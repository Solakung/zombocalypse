# MIGRATION.md — ย้ายตรรกะตรวจสอบจาก `database_rules.json` ไป Cloud Functions

ไฟล์นี้สรุปงานที่ทำไปแล้วและวิธีทำต่อ ให้คนหรือ AI ตัวไหนอ่านแล้วทำต่อได้ โดยไม่ต้องส่ง `script.js` (~1 MB) หรือ rules ทั้งไฟล์

## ทำไมต้องย้าย
- Firebase Realtime Database จำกัดขนาด rules ที่ 262,144 bytes (256 KiB) เดิม `database_rules.json` = 258,922 bytes (เหลือที่ ~3 KB)
- Rules ไม่มีตัวแปร/ฟังก์ชันให้ใช้ซ้ำ ตรรกะยาว ๆ ต้องเขียนซ้ำทุกกิ่ง (`inventory/$uid/$slot/.write` ใหญ่ 59 KB)
- แก้โดยย้ายการเขียนข้อมูลของแต่ละระบบไปเป็น Callable Cloud Function (Admin SDK ข้าม rules) แล้วตัดกฎเขียนของระบบนั้นออก เหลือแค่กฎอ่าน

## สถาปัตยกรรม
- เกม = เว็บ static (GitHub Pages) `index.html` + `script.js` + Firebase Auth + Realtime Database (asia-southeast1)
- `functions/` = Cloud Functions Gen2 (Node 22, region **asia-southeast1**) โปรเจกต์ `zompocalypse-137a6` แพลน Blaze
  - `functions/index.js` ทางเข้า: `ping` (ทดสอบ), `baseAct` (ที่พัก), `marketAct` (ตลาด)
  - `functions/lib.js` helper ร่วม: `fail`, `withLock`, `takeItem`, `addItem`
  - `functions/base.js`, `functions/market.js` ตรรกะของแต่ละระบบ (`makeX(db)` → `{ run(uid, data, now) }`)
- ฝั่งเกม (`script.js`): `const baseCall`, `const marketCall` = `httpsCallable(fns, "baseAct" | "marketAct")` เรียกด้วย `{ a: "<action>", ... }`

## สถานะ
| ระบบ | ฟังก์ชัน | ประหยัด rules | สถานะ |
|---|---|---|---|
| ที่พัก (base, baseTx) | `baseAct` | ~11.7 KB | เสร็จ ขึ้นระบบจริงแล้ว |
| ตลาด/ตลาดมืด/ฝากของ (market, marketTx, marketPayouts, bm, giftTx) | `marketAct` | ~30.4 KB | โค้ดเสร็จ (PR #3) รอ deploy/merge/publish rules |

ขนาด rules: 258,922 → 247,246 (ที่พัก) → **216,830** (ตลาด) bytes

### ระบบที่เหลือ (ประมาณการจากขนาดโหนด + กิ่งใน inventory)
| ระบบ | ประมาณ | หมายเหตุ |
|---|---|---|
| เควสต์ + กาชา (`quests`, `questProg`, `questClaim`, `questPayouts`, `gachaTickets`, `gachaPool`, `gachaMeta`) | ~17 KB | |
| บอสโลก (`worldBosses`, `worldBossClaims`, `worldBossHits`, `wbAuto`) | ~15 KB | |
| ค้นหาของ/`zoneItems` + กิ่งค้นหาใน inventory | ~27 KB | ซับซ้อนสุด: หิว/น้ำ/พลังงาน/บัฟ/ตารางไอเทมต่อโซน |
| `users/$uid/hp` และสูตรตาย/กิน/ฟื้น | ~10 KB | แตะหลายระบบ ระวัง |
| อื่น ๆ: `duel`, `skills`, `evo`, `effects`, `attacks`, `wall*`, `exp`, `pet` ฯลฯ | | ดูขนาดด้วย `node -e` (ดูหัวข้อ "วิเคราะห์ขนาด") |

## กติกา: ห้ามทำให้เกมพัง
1. พฤติกรรมอนุญาต/ปฏิเสธต้องเท่ากฎเดิม (ปรับปรุงได้เฉพาะที่กฎเดิมผิดชัดเจน แล้วต้องแจ้งผู้ใช้)
2. ทดสอบเทียบก่อนเสมอ (differential): รันโค้ดฝั่งเกมแบบเดิมใต้ **rules เก่า** vs ฟังก์ชันใหม่ ใน Firebase Emulator แล้วเทียบสถานะฐานข้อมูลหลังรัน ต้องตรงกันทุกเคส (ดูหัวข้อ "ชุดทดสอบ")
3. หลังตัด rules ต้องเทียบ rules เก่า/ใหม่ของส่วนอื่นอีกรอบ (คราฟต์, ชุดเริ่มต้นผู้เล่นใหม่, การเขียนทั่วไป) ว่าอนุญาต/ปฏิเสธเหมือนเดิม และการอ่านยังได้
4. ทดสอบผ่านฟังก์ชันจริง (auth+functions+database emulator) รวมกรณีพร้อมกัน (2 คนแย่งของชิ้นเดียว)

## ขั้นตอนย้ายระบบใหม่ (แพตเทิร์น)
1. อ่านกฎของโหนดระบบนั้น + กิ่งที่เกี่ยวข้องใน `inventory/$uid/$slot/.write` + โค้ดเกมที่เขียนข้อมูลนั้น สรุปกติกาก่อนเขียน
2. เขียน `functions/<ระบบ>.js` (`makeX(db)`), ใช้ helper จาก `lib.js` ต่อ action: ตรวจ user (ไม่โดนแบน/โซน/HP ตามกฎเดิม) → ล็อกต่อผู้เล่น → ตรวจเงื่อนไข → หักของ → เขียนผล → คืนของถ้าขั้นต่อมาล้ม
3. export ใน `functions/index.js` (`onCall` + จับ error ที่ไม่ใช่ `HttpsError` ลง `logger.error`)
4. ทดสอบเทียบ + e2e ตามกติกาข้างบน
5. แก้ `script.js` ให้เรียกฟังก์ชันแทน `update()` ตรง (คงการตรวจฝั่งเกมไว้เพื่อ UX ข้อความภาษาไทยมาจากฟังก์ชัน)
6. ตัด rules: ลบ `.write`/`.validate` ของโหนดที่ย้าย (เหลือ `.read`) ตัดกิ่งใน `inventory` ที่เกี่ยวข้องแบบตัดข้อความตรง ๆ แล้วตรวจว่ามีแค่กิ่งที่ตั้งใจหายไป (เทียบ OR operand ก่อน/หลัง)
7. `node bump.js <เวอร์ชันใหม่ที่ใหม่กว่า version.json>` แก้ 3 ที่ให้ตรงกัน (APP_VERSION, `?v=` ใน index.html, version.json) → commit → PR

## ขั้นตอนปล่อย (ห้ามสลับลำดับ)
ใน Cloud Shell (พิมพ์ทีละบรรทัด):
```
cd ~/zombocalypse
git fetch origin
git checkout <branch>      # ถ้าฟ้องเรื่อง functions/package-lock.json: rm -f functions/package-lock.json
git pull origin <branch>
cd functions && npm install && cd ..
firebase deploy --only functions
```
1. deploy ฟังก์ชัน → ผลต้องมี `functions[<ชื่อ>(asia-southeast1)] Successful create/update operation`
2. merge PR → GitHub Pages ปล่อยเกม → ทดสอบระบบนั้นในเกมจริง
3. สุดท้าย `firebase deploy --only database` (หรือวาง `database_rules.json` ใน Console > Realtime Database > Rules)
- ถ้า publish rules ก่อนข้อ 2 ผู้เล่นที่ใช้เกมเก่าจะใช้ระบบนั้นไม่ได้ชั่วคราว
- Rollback rules: `git show <commit ก่อนหน้า>:database_rules.json > old.json` แล้ว deploy ไฟล์นั้น

## บทเรียน/ข้อควรระวัง
- Admin SDK ต้องระบุ `databaseURL` ภูมิภาคเอง (`https://zompocalypse-137a6-default-rtdb.asia-southeast1.firebasedatabase.app`) ไม่งั้นต่อไม่ถึง (ทำใน `functions/index.js`)
- `ref.transaction(fn)` ของ Admin SDK: รอบแรก `fn` ถูกเรียกด้วย `null` ถ้าไม่มีแคช **ห้าม return `undefined` (abort) ตอน `cur === null`** ให้ return `cur` แล้วให้เซิร์ฟเวอร์ส่งค่าจริงมารันซ้ำ (ดู `takeItem`, `removeIf`) และใช้ตัวแปร `ok` เช็กว่ารอบสุดท้ายผ่านเงื่อนไขจริง
- ทุก action ต้องล็อกต่อผู้เล่น (`withLock`, โหนด `locks/{uid}` ไม่มีใน rules → ไคลเอนต์เข้าไม่ได้) และหักของด้วย transaction ก่อนเขียนผลเสมอ (ล้มแล้วคืนของ)
- Rules เดิมมีบั๊ก: ผู้เล่นมนุษย์ที่ไม่มีวัตถุดิบสูตรคราฟต์ในกระเป๋า จะแก้ช่องของ 9 ชนิด (bandage, antidote, trauma_kit, soup, stim_shot, rag_vest, scrap_plate, headlamp, toolkit) ไม่ได้ เพราะกิ่งคราฟต์ของ inventory ประเมินล้มก่อนถึงกิ่งอื่น (ฟังก์ชันใหม่ไม่มีปัญหา) ตอนเขียนเทสต์เทียบ ต้องเติมวัตถุดิบ (scrap, chem, canned_food, water, medkit, energy_drink, moss) ให้ผู้เล่นมนุษย์ ไม่งั้นผลเทียบเพี้ยน
- สูตรเก่ากับค่าคงที่ในเกมต้องตรงกัน (คอมเมนต์ "ต้องตรงกับ rules" ใน `script.js`) ย้ายแล้วให้ชี้ไปที่ไฟล์ฟังก์ชัน
- ผู้เล่นที่ยังไม่รีเฟรชใช้เกมเก่าได้จนกว่า publish rules ใหม่ (เกมมีแบนเนอร์อัปเดตจาก `version.json`)
- ต้อง `git pull` ก่อน deploy ทุกครั้ง (เคย deploy จากโค้ดเก่าแล้วฟังก์ชันไม่ขึ้น)
- NPC ธารา (`npc-tara.json`, `npc/{uid}/tara.m` บิต 21/22) ยังไม่ปรากฏในเกมจนกว่าจะจัดอีเวนต์ — อย่าแตะกฎ `npc/*`

## ชุดทดสอบ (Firebase Emulator)
ไม่ได้เก็บในรีโพ (อยู่ในโฟลเดอร์ชั่วคราว) แนวทางสร้างใหม่:
- ติดตั้ง `firebase-tools`, `@firebase/rules-unit-testing`, `firebase` (client) ในโฟลเดอร์ชั่วคราว; Emulator ต้องรัน **ไม่ผ่าน proxy** (`env -u HTTPS_PROXY ...`) ใน sandbox ที่มี proxy
- `firebase emulators:start --only database` พร้อมไฟล์ rules **เก่า** → สคริปต์: seed ข้อมูลด้วย Admin SDK (`FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000`, `?ns=<project>`) → รัน update แบบเดิมของเกมผ่าน `rules-unit-testing` (rules เก่า) → seed ใหม่ → รัน `makeX(adb).run(...)` → เทียบ snapshot (ละเว้น timestamp ±60 วินาที) ใช้ ~800–1,100 เคสต่อระบบ
- Emulator ทุกตัวใน namespace เดียวกันใช้ rules ชุดเดียว: ถ้าจะเทียบ rules เก่า/ใหม่ ให้สลับด้วย `PUT http://127.0.0.1:9000/.settings/rules.json?ns=<ns>` (header `Authorization: Bearer owner`) ระหว่างรัน
- e2e: `firebase emulators:start --only functions,database,auth` + client SDK (`connectAuthEmulator`, `connectFunctionsEmulator`) — Admin ในฟังก์ชันจะใช้ namespace `zompocalypse-137a6-default-rtdb` ตาม databaseURL

## วิเคราะห์ขนาด rules (คำสั่งสำเร็จรูป)
```
node -e 'const r=require("./database_rules.json").rules;console.log(JSON.stringify(r).length);
Object.entries(r).map(([k,v])=>[k,JSON.stringify(v).length]).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(x=>console.log(x.join("\t")))'
```

## Cost
Blaze + Cloud Functions: โควตาฟรี 2 ล้านครั้ง/เดือน ปัจจุบันเกมมีผู้เล่นน้อย ตั้ง Budget alert ไว้ที่ Google Cloud Console > Billing > Budgets & alerts เครดิตทดลองหมดอายุ 5 ม.ค. 2027 ควรอัปเกรดเป็นบัญชีเต็มก่อนถึงวันนั้น

## 🎟️ Season Pass + 🎭 เหตุการณ์สุ่มเลือกทาง (ระบบใหม่ — ไม่แตะ rules)
- `functions/pass.js` (`passAct`: sync / claimMission / claimTier) — เก็บสถานะที่ `pass/{uid}`; ความคืบหน้า = ตัวนับ `ach/{uid}/c` ลบค่าตั้งต้นของวัน/สัปดาห์ที่เซิร์ฟเวอร์จด; XP 100/ระดับ × 30 ระดับ; รีเซ็ตตาม `seaIdx` (28 วัน, เวลาไทย)
- `functions/events.js` (`eventAct`: peek / roll / choose) — 26 เหตุการณ์ ~120 ผลลัพธ์; สถานะ `enc/{uid}`; โอกาส 8%/การค้นหา, คูลดาวน์ 100 วิ, เพดาน 30/วัน, ไม่ทำให้ HP ต่ำกว่า 1, ฟื้นสูงสุด 100
- โหนด `pass`, `enc` ไม่มีในไฟล์ rules → ปิดเขียนจากไคลเอนต์โดยปริยาย; ไอเทมที่แจกทุกตัวอยู่ใน whitelist `inventory` แล้ว (ตรวจด้วยสคริปต์)
- ข้อจำกัดที่ยอมรับ: ตัวนับ ach เขียนจากไคลเอนต์ (มีเพดาน +3000/ครั้ง) → โกงภารกิจได้เช่นเดียวกับความสำเร็จเดิม รางวัลจึงจำกัดเป็นของพื้นฐาน
- เพิ่มภารกิจ/เหตุการณ์/รางวัล = แก้ตารางใน `pass.js` / `events.js` แล้ว deploy functions อย่างเดียว (ตัวนับใหม่ในภารกิจต้องมีฝั่งเกม `achBump` ด้วย)
- ทดสอบ: ชุดทดสอบในสแครชแพด (ผ่านทุกผลลัพธ์/ตัวเลือก, กดซ้อน, หมดเวลา, เพดานกระเป๋า 99, ข้ามวัน/ซีซัน, ซอมบี้/มนุษย์)
- บั๊กที่เจอ: RTDB ไม่เก็บอ็อบเจ็กต์ว่าง (`c:{}` หาย) → ต้อง normalize ตอนอ่าน
- **รางวัล/ภารกิจต่างกันต่อธีมซีซัน** (`OVR`, `THEME` ใน `pass.js`): ซีซันวน 4 ธีมตาม `seaIdx % 4` (ฝน, โรคระบาด, เก็บเสบียง, หนาว) — ระดับ 3/6/9/12/18/21/24 บางส่วนและ 10/20/30 (ของสวมใส่เด่น) เปลี่ยนตามธีม + พูลภารกิจเพิ่มธีมละ 2–3 ข้อรายวัน/รายสัปดาห์; deploy เฉพาะ functions

## 🎁 กิจกรรมประจำวัน (หีบรายวัน / ล่าค่าหัว / ต้นไม้ค่าย+สัตว์เลี้ยง / อีเวนต์โลก) — ไม่แตะ rules
- `functions/daily.js` (`dailyAct`: s=crate|hunt) — โหนด `crate/{uid}`, `hunt/{uid}`; streak 7 วันวนรอบ (วัน 7 การันตีของหายาก+ของแถม); ค่าหัว: มนุษย์ล่าซอมบี้ในโซนเป้าหมาย (ตัวนับ ach `hw<โซน>` ที่เกมบวกตอนชนะซอมบี้), ซอมบี้กัด 4 ครั้ง; ต้อง `accept` เพื่อจดค่าตั้งต้น
- `functions/camp.js` (`campAct`: state|buy|petBonus) — โหนด `camp/{uid}`, `pet2/{uid}`; 5 อัปเกรด×5 ระดับ (ต้อง Safe Zone + ที่พักขั้น 1); ฟังก์ชันส่ง `eff` กลับมาให้เกมคูณตารางของที่เจอ (`fxPerkMods`) และลดดาเมจ (`fxPerkCut`); สัตว์เลี้ยง: ระดับ = 1+⌊petc/5⌋ ให้ของแถมหลังรับของ (เกมเรียก `petBonus` หลัง `petClaim`)
- `functions/world.js` (`worldAct`: state|claim) — โหนด `world/{สัปดาห์}`; 6 อีเวนต์หมุนทุกสัปดาห์ (จันทร์–อาทิตย์ เวลาไทย); เป้า = per×max(5, ผู้เข้าร่วม); มีส่วนร่วม = ตัวนับ ach ที่เพิ่มหลังเข้าร่วม (เพดาน 2×per); รางวัล 40/70/100% ต้องมีส่วนร่วม ≥25% ของ per
- ใน `lib.js` เพิ่ม `addCapped`, `grantAll` (แจกหลายชิ้นแบบย้อนคืนถ้าไม่ครบ), `dayIdx`, `rng`
- ทดสอบ: สแครชแพด `sys3.js` (emulator) + `uitest2.js` (headless) — ผ่าน; เควสต์ต่อเนื่องของ NPC (ข้อ 3) ยังไม่ทำ รอ brief บท 2 ของธารา

## 🎲 ผจญภัย (ดิ่งลึก / ศัตรูคู่อาฆาต / ปริศนาวิทยุ / ขบวนพ่อค้าเร่) — ไม่แตะ rules
- `functions/dive.js` (`diveAct`: state|start|pick|cashout) — `dive/{uid}` (ของที่เก็บอยู่ในโหนดนี้จนกว่า cashout), `dive2/{uid}` (สถิติ/รางวัลครั้งแรก); 12 ชั้น พักทุกชั้นที่ 4; หมดสติ = เสียของ + HP จริงลด ≤20 (ไม่ต่ำกว่า 1); วันละ 6 รอบ คูลดาวน์ 5 นาที ค่าเตรียมตัว scrap/rotten_meat 2
- `functions/nemesis.js` (`nemAct`: peek|roll|choose) — `nem/{uid}`; โอกาส 3.5%/การค้นหา คูลดาวน์ 20 นาที; แพ้/หนีไม่พ้น → ศัตรูเลเวลขึ้นและกลับมา; ล้มได้ → ของ (เลเวลสูง = ของหายาก, ≥6 ได้ boss_trophy); เกมส่ง `wb` (โบนัสอาวุธ 0–3 → +6%/แต้ม) ซึ่งเซิร์ฟเวอร์ clamp
- `functions/radio.js` (`radioAct`: state|listen|guess) — `radio/{สัปดาห์}` (secret อ่านไม่ได้จากไคลเอนต์); เบาะแสหมุนตามวัน; ทายได้ 5 ครั้ง/วัน บอกจำนวนหลักที่ถูกตำแหน่ง; 10 คนแรกได้ชุดใหญ่
- `functions/caravan.js` (`caravanAct`: state|buy) — `caravan/{รอบ 6 ชม.}`; เปิด 3 ชม.แรกของรอบ โซนสุ่ม ต้องยืนในโซนถึงเห็นสินค้า; สต็อกรวมจองด้วย transaction; คืนของ/สต็อกเมื่อไม่พอ
- ทดสอบ: สแครชแพด `sys4.js` (emulator) + `uitest3.js` (headless) — ผ่าน

## 🎲 ศูนย์กิจกรรม (UI มือถือก่อน) — PR A
- รวมปุ่ม 🎟️ 🎁 🎲 🔥 เป็นแท็บเดียวในแผ่นล่าง `#hub2-modal` (`hubOpen(tab)`); มือถือเปิดจากแท็บ "กิจกรรม" ในแถบล่าง (4 แท็บ), คอมเปิดจากปุ่ม `#btn-hub2` บนแถบบน; จุดแจ้งเตือนรวม `hubDot()`
- ตัว render เดิม (`passRender/actRender/advRender/mwRender`) ยังอยู่ แค่เช็กการมองเห็นด้วย `hubOn(tab)` แทนโมดัลแยก; `#btn-ck` ยังถูกสร้าง (ตัวจัดการเดิมใช้) แต่ซ่อนด้วย CSS
- CSS ใหม่ท้าย `style.css`: `.modal.sheet` (bottom sheet, ปุ่ม ≥ 44px, safe-area; คอม >900px = กล่องกลางจอ), `.hub2-tab`, `.subtabs` (แถวเลื่อนแนวนอน), เหตุการณ์สุ่ม/ศัตรูคู่อาฆาตใช้ `.sheet` ด้วย
- ทดสอบด้วย Playwright (360×740, 390×844, 768, 1280) ไม่มี page error / ไม่มีเลื่อนแนวนอน

## 🌱 แปลงปลูก (Garden) — `functions/garden.js` (`gardenAct`: state|daily|buy|plant|water|fert|harvest)
- ข้อมูลที่ `garden/{uid}` (`p/{i}` แปลง, `seed/{พืช}` ตัวนับเมล็ด, `h/{พืช}` จำนวนที่เก็บแล้ว, `d` วันที่รับเมล็ดฟรี) — ไม่มีใน rules; แปลง 4/6/8 ตามที่พักขั้น 1/2/3
- 8 พืชมนุษย์ + 4 พืชซอมบี้ (เชื้อรา/หนอน/แอ่งน้ำเน่า/รากเลือด) ผลผลิตเป็นไอเทมเดิมใน whitelist; เวลาโต × ตัวคูณซีซัน `s[seaIdx%4]`; รดน้ำ −25% เวลาที่เหลือ, ปุ๋ย +1 ผลผลิต/กันศัตรูพืช; ตอนเก็บ 12% ศัตรูพืช (ถ้าไม่ใส่ปุ๋ย) / 8% กลายพันธุ์ (ของแถม)
- เมล็ด = id `seed_<พืช>` ใน `lib.grantAll/addCapped` (เก็บเป็นตัวนับที่ garden ไม่ใช่กระเป๋า) → หีบรายวัน, พ่อค้าเร่ (กรองตามฝ่าย), ดิ่งลึก, เหตุการณ์สุ่ม, ค่าหัวป่า แจกเมล็ดได้
- ข้อควรระวัง: transaction ของ Admin SDK รอบแรกอาจได้ `null` — ต้อง `return x` ไม่ใช่ abort (ใช้แพตเทิร์น ok-flag เหมือน `takeItem`)
- ภารกิจ Season Pass เพิ่ม `d_gard`/`w_gard` (ตัวนับ `gard` ฝั่งเกม bump ตอนเก็บเกี่ยว)
- ทดสอบ: `garden.js` (emulator) + `uigarden.js` (headless 360px) — ผ่าน

## 📖 สมุดสะสมแบบชุด + 🏅 ความสมบูรณ์ — `functions/col.js` (`colAct`: state|sync|claim)
- `col/{uid}` (ไม่มีใน rules): `i` ไอเทมที่เคยพบ, `z` โซนที่เคยไป (ซิงก์จาก `book_i`/`book_z` ในเครื่อง — เพิ่มได้อย่างเดียว ตรวจรูปแบบ id + เพดาน 400), `cl` ชุด/ขั้นที่รับแล้ว; พืชที่เก็บเกี่ยวอ่านจาก `garden/{uid}/h` ฝั่งเซิร์ฟเวอร์
- 13 ชุด (บางชุดเฉพาะมนุษย์/ซอมบี้) + 14 เหตุการณ์สำคัญจากตัวนับ ach → `pct` = ค่าเฉลี่ย; รางวัล 25/50/75/100% ต่างกันตามฝ่าย
- ข้อจำกัดที่ยอมรับ: ข้อมูลที่ไคลเอนต์ซิงก์ปลอมได้ → รางวัลชุดเป็นของพื้นฐาน ครั้งเดียวต่อชุด
- UI: แท็บที่ 4 "📖 สะสม" ในศูนย์กิจกรรม (5 แท็บ); หีบรายวัน `daily.js` ผ่อนผัน streak ขาดได้ 1 วัน

## 🎨 กราฟิกแปลงปลูก/ลานหน้าบ้าน (SVG วาดในโค้ด — ไม่แตะ functions/rules)
- `gardenSceneSvg(D, sel, spent, zom)` ฉากแปลง 4/6/8 ช่อง: พืช 12 ชนิด × 3 ขั้น (งอก/โต/พร้อมเก็บเรืองแสง) จาก `gPlant`, ท้องฟ้าตามเวลาจริง (`scnSky`), เอฟเฟกต์ฤดูกาล (ฝน/หมอก/โทนทอง/หิมะ), ธีมฝั่งซอมบี้; แตะแปลงในภาพ = เลือก (`state.gardenSel`) แล้วแผงปลูก/รด/ปุ๋ย/เก็บอยู่ใต้ภาพ
- `baseYardSvg(lv, zom, plots, spent, uid)` ลานหน้าบ้านตามระดับ 0–3 (เต็นท์→บ้านไม้→บ้านมีปล่องไฟ→ป้อมเสริมเหล็ก; ซอมบี้=รัง) + แถวแปลงที่โตตามสถานะจริง; หน้าต่างที่พักมีแท็บ "ห้องข้างใน / ลานหน้าบ้าน" (`state.baseView`)
- `scnStn` สถานีผลิตบนเคาน์เตอร์เป็น SVG (แทน emoji) • id ของ gradient ใช้ตัวนับ `gGid` กันชนกันเมื่อมีหลายภาพในหน้าเดียว • แอนิเมชันเป็น CSS ล้วน เคารพ `prefers-reduced-motion`
- ยังไม่ทำ: ของตกแต่งในห้อง 12 ชิ้นยังเป็น emoji (ตำแหน่ง `SCN_POS` ใช้ร่วมกับห้องผู้เล่นอื่น); ถ้ามีรูปจริง (เขียนมือ/AI) ค่อยเพิ่มจุดรับ `img/garden/*.webp`

## 🛋️ บ้านของฉัน (จัดห้องเอง/ธีม/เยี่ยมห้อง/ถูกใจ/ห้องยอดนิยม) — `functions/home.js` (`homeAct`: state|place|buy|like|claimTop|visit|top)
- โหนด `home/{uid}` (own, lay, th, cap, lk, mig, tc), `hw/{สัปดาห์}/{uid}` (ถูกใจรายสัปดาห์), `hl/{uid}` (โควตาถูกใจรายวัน) — ไม่มีใน rules; คนอื่นดูห้องผ่าน `visit` ซึ่งคืนเฉพาะข้อมูลสาธารณะ (ไม่รั่ว own/slots)
- แคตตาล็อก 12 ของเดิม (d0–d11, ซื้อผ่านหน้าที่พักเดิม `baseAct`) + 48 ของใหม่ (`ITEMS`) + 13 ธีม (`THEMES`): ย้ายของเดิมอัตโนมัติจาก `base/{uid}/deco` (`migrate`, ทำซ้ำได้ ไม่ทำของหาย) • โซนวาง w/f/a ตรวจฝั่งเซิร์ฟเวอร์ • ช่อง 6/9/12/16 ตามที่พักขั้น 0–3
- id รางวัลใหม่ใน `lib.grantAll`: `deco_<ของ>` / `theme_<ธีม>` → นับที่ `home/{uid}/own` (เพดาน 9 / ธีม 1) ไม่เข้ากระเป๋า — Season Pass ระดับ 15/25 (ธีมประจำซีซัน + ของเทศกาล), หีบรายวัน, ดิ่งลึกชั้น 12, สมุดสะสม 100%, ห้องยอดนิยมสัปดาห์แจกได้
- ถูกใจ: ห้ามตัวเอง, 1 ห้อง/วัน/ผู้กด, 5 ห้อง/วัน, ผู้กดต้องค้นหาอย่างน้อย 20 ครั้ง, ห้องต้องมีของที่วางแล้ว, ครั้งแรกของวันได้ของเล็ก ๆ; ห้องยอดนิยมอ่านทั้งสัปดาห์แล้วเรียงในหน่วยความจำ (ไม่ต้องพึ่ง `.indexOn`)
- UI: แท็บ "🛋️ จัดห้อง" ในหน้าต่างที่พัก (`homeEdit`: ถาดของ → แตะวาง/ย้าย → บันทึก, ธีม, วลี, ร้าน, ห้องยอดนิยม); `baseSceneSvg` รับ `layout`/`items`/`pal` (ไม่ส่ง = ห้องเดิม); หน้าประวัติ (`showBio`) ลอง `homeVisitFill` ก่อน ถ้าไม่มี/ฟังก์ชันยังไม่ deploy ใช้ `baseSceneBio` เดิม
- ภารกิจ Season Pass เพิ่ม `home` (จัดห้อง) / `like` (ถูกใจห้อง)
- ทดสอบ: `home.js` (emulator) + `uihome.js` (headless 360px: วาง/หนีบโซน/ลบ/เกินช่อง/ธีม/บันทึก)
- ยังไม่ทำ (PR ถัดไป): โปรไฟล์ตกแต่งแบบคลังรูป (PR 2) และอัปโหลดรูปเองพร้อมแปลง webp ฝั่งเซิร์ฟเวอร์ (PR 3, ต้องเปิด Storage)

## 🪪 โปรไฟล์ตกแต่ง + รูปอัปโหลด — `functions/profile.js` (`profAct`: state|set|commit|removeUp|report|visit|gmList|gmRemove) + `storage.rules`
- `prof/{uid}` (av, fr, bn, ti, up:{t,v,kb}, uu, hid, ban) และ `profRep/{uid}/{ผู้รายงาน}` — ไม่มีใน rules; อวาตาร์ 28 / กรอบ 12 / แบนเนอร์ 12 / ฉายา 20 ปลดล็อกจากความก้าวหน้าจริง (ach/col/pass/home) ตรวจฝั่งเซิร์ฟเวอร์ (`unlocked`)
- **รูปอัปโหลด**: ไคลเอนต์ → Storage `raw/{uid}` (ต้นฉบับ ≤10 MB, เขียนได้เฉพาะเจ้าของ, อ่านไม่ได้) → `commit` ดึงมาแปลงด้วย `sharp` (หมุนตาม EXIF แล้วตัด metadata ทิ้ง, ครอปสี่เหลี่ยมจัตุรัส, ลองขนาด 384→144px × คุณภาพ 80→22) เป็น **webp < 100 KB เสมอ** → `profile/{uid}.webp` (ไคลเอนต์เขียนไม่ได้) → ลบ `raw/{uid}` ทุกกรณี (ใน `finally`); ไฟล์ที่ไม่ใช่รูปถูกปฏิเสธและรูปเดิมไม่ถูกแตะ; เปลี่ยนรูปได้ชั่วโมงละ 1 ครั้ง
- ขึ้นทันที (ตามที่เจ้าของเกมตัดสินใจ) + `report` (บัญชีที่ค้นหา ≥20 ครั้ง; 3 บัญชี = ซ่อนอัตโนมัติ) + GM: `gmList`/`gmRemove` (delete = ลบไฟล์ + ห้ามอัปโหลดอีก, keep = เลิกซ่อน) — ส่วน "🖼️ รูปโปรไฟล์ที่ถูกรายงาน" ในหน้า Admin; การแบนบัญชีใช้เครื่องมือเดิม
- ⚠️ ไม่มีการตรวจเนื้อหาอัตโนมัติ (ต่อยอดได้ด้วย Cloud Vision SafeSearch ซึ่งมีค่าใช้จ่ายต่อรูป)
- ติดตั้ง: เปิด Firebase Storage ในคอนโซล → `cd functions && npm install` (เพิ่ม `sharp`) → `firebase deploy --only functions,storage`; `profAct` ตั้ง memory 512MiB
- UI: ปุ่ม "🪪 ตกแต่งโปรไฟล์" ในหน้าต่างข้อมูลตัวละคร (`profOpen` แผ่นล่าง: การ์ดตัวอย่างสด, อัปโหลด, อวาตาร์/กรอบ/แบนเนอร์/ฉายา) • การ์ดผู้อื่นในหน้าประวัติ (`profVisitFill`) • `storage.rules` ยังไม่ได้ทดสอบกับ Storage emulator (เป็นกฎสั้น ๆ ตรวจด้วยตาแล้ว)
- ทดสอบ: `prof.js` (ตัวแปลงด้วย sharp จริง 7 แบบ: jpeg 12 MB, png, แนวตั้ง/แนวนอน, EXIF+GPS, gif, ภาพเล็ก → ทุกใบเป็น webp < 100 KB สี่เหลี่ยมจัตุรัส ไม่มี EXIF; ไฟล์ปลอมถูกปฏิเสธ) + ตรรกะปลดล็อก/รายงาน/GM ด้วย bucket จำลอง + `uiprof.js` (headless 360px)

## 🧭 บทเรียนแนะนำการเล่น (Coach) — `functions/learn.js` (`learnAct`: state|claim)
- เส้นทาง 12 ขั้นแยกมนุษย์/ซอมบี้ (`PATHS`) ต่อจาก "ภารกิจวันแรก" 6 ข้อเดิม (`onb/`, ยังอยู่ใน rules ตามเดิม ไม่แตะ) • สถานะรับรางวัลที่ `learn/{uid}/c/{ขั้น}` + `fin` — ไม่มีใน rules
- ความคืบหน้าอ่านจากข้อมูลจริงฝั่งเซิร์ฟเวอร์ (ตัวนับ ach, `base/{uid}/lv`, `pass/{uid}/xp`, `crate/{uid}/st`) • เงื่อนไขชนิด `ach`/`base`/`pass`/`crate`; เพิ่มขั้นใหม่ = แก้ `PATHS` (ตัวนับใหม่ต้องมี `achBump` ฝั่งเกม) แล้ว deploy functions
- รางวัลขั้นใช้ `lib.grantAll` (รวมเมล็ด/ของตกแต่ง/ธีม) • รางวัลปิดท้าย: ธีม + ของตกแต่ง + ของใช้ (`FINAL`)
- UI: แถบ `#coach` ใน `.topbar` (ขั้นถัดไป + ปุ่ม "ไปเลย"/"🎁 รับ"; ถ้ายังทำภารกิจวันแรกไม่ครบ ชี้ไปที่ภารกิจนั้นก่อน) • แตะข้อความเปิดรายการเต็ม (`coachOpen` แผ่นล่าง) • `coachGoTo` แปลง `go` เป็นการเปิดหน้าต่าง (bag/zone/players/base/baseedit/market/hub:<แท็บ>)
- ถ้าฟังก์ชันยังไม่ deploy แถบจะซ่อนเงียบ ๆ (ไม่กระทบเกม)
- ทดสอบ: `learn.js` (emulator: ฝ่าย/ขั้น/เงื่อนไข/รับซ้ำ/กระเป๋าเต็มไม่เสียสิทธิ์/กดซ้อน/รางวัลปิดท้าย + ตรวจรหัสรางวัลทุกตัว) + `uicoach.js` (headless 360px)

## ⚡ ความสามารถประจำสาย + ⚔️ ศึกใหญ่ประจำสัปดาห์ — `functions/ability.js` (`abilAct`: state|use), `functions/war.js` (`warAct`: state|claim)
- **ความสามารถ**: มนุษย์ = อาชีพที่คะแนนสูงสุด (สูตร `CAREER_SCORE`/`CAREER_LV` ใน ability.js ต้องตรงกับ `CAREER` ใน script.js — มีเทสต์ตรวจรูปแบบ) • ซอมบี้ = สายวิวัฒนาการขั้นสูงสุดจาก `evo/{uid}` (เสมอ → ยึด `line` ที่เลือก) • ขั้น L 1–4: มีผล (8+2L) นาที, คูลดาวน์ 100−10L นาที (หมอ 45 นาที), ค่าใช้จ่าย 1–2 ชิ้นของพื้นฐาน
- สถานะที่ `abil/{uid}` (`on`, `cd`, `ad/an` โควตาช่วยเพื่อนรายวัน) ไม่มีใน rules • เกมคูณตัวคูณเข้า `fxMods` (`fxAbilMods`), ลดดาเมจ (`fxAbilCut` ใน `fxDmgCut`), ทอยปะทะ (`abilDice` ใน `zombieEncounter`) — โมเดลความเชื่อถือเดียวกับโบนัสค่าย (ตารางค้นหาคำนวณฝั่งเกมอยู่แล้ว) ฟังก์ชันคุมค่าใช้จ่าย/คูลดาวน์/สิทธิ์
- **หมอสนาม**: รักษา HP ทันที (20+8L) ตัวเอง/เพื่อนมนุษย์ในโซนเดียวกัน เขียน `users/{to}/hp` ด้วย Admin SDK (transaction, เพดาน max(เดิม,100)); ช่วยเพื่อนได้ 5 ครั้ง/วัน ได้สมุนไพร 1 ชิ้นต่อครั้ง; ไม่แตะหิว/น้ำ/พลังงาน
- **ศึกใหญ่**: อ่านแต้มศึกชิงโซนเดิม `coop/{zh|zz}{สัปดาห์}{โซน 1–10}/{uid}.n` ด้วย Admin SDK (สัปดาห์ = `floor((dayIdx+3)/7)` ตรงกับ `qpKey("weekly")`) • ผู้ชนะ = แต้มรวมสัปดาห์ก่อนมากกว่า (รวมขั้นต่ำ 60) • สมาชิกที่สะสม ≥30 แต้มรับรางวัล (ผู้ชนะ/ปลอบใจ) ที่ `war/{uid}/{สัปดาห์}` • ฝ่ายชนะได้โบนัสตารางค้นหาตลอดสัปดาห์ถัดไป (`BUFF`)
- UI: แถบ `#abil-bar` ใต้ปุ่มค้นหา (+ `abilPick` เลือกเพื่อนสำหรับหมอ) • แท็บ "⚔️ ศึกใหญ่" เป็นแท็บแรกใน 🎲 ผจญภัย (`warRender`) พร้อมจุดแจ้งเตือนเมื่อมีรางวัลให้รับ
- ทดสอบ: `abil.js` (emulator: อาชีพ/สายซอมบี้/ค่าใช้จ่าย/คูลดาวน์/หมอรักษา เพดาน/โซนต่างกัน/กดซ้อน + ศึก: รวมแต้ม/ผู้ชนะ/รางวัล/รับซ้ำ/แต้มไม่ถึง/ของตกแต่งเข้า home) + `uiabil.js` (headless 360px)
