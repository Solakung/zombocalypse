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
