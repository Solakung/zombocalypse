# HANDOFF — ZOMBOCALYPSE (เกมเบราว์เซอร์ภาษาไทย, Firebase RTDB + Cloud Functions Gen2 + GitHub Pages)

เอกสารนี้สรุปให้ผู้ช่วย (เช่น Claude ปกติที่รับแค่ไฟล์) ทำงานต่อได้โดยไม่ต้องมีประวัติแชท

## 1) ภาพรวมระบบ
- ฝั่งเกม: `index.html` + `script.js` (**~1.15 MB รวมไว้ไฟล์เดียว** มีหัวข้อ `/* ===== NN) ... */` ~130 จุด ใช้ `grep -n "^   [0-9]*[.)]" script.js` หาตำแหน่ง) + `style.css` (ต่อท้ายไฟล์ทุกฟีเจอร์) + `sw.js` + `version.json` — **ทุกครั้งที่แก้เกมต้องรัน `node bump.js` (เลขเวอร์ชัน)** ไม่งั้นผู้เล่นได้แคชเก่า
- ฝั่งเซิร์ฟเวอร์: `functions/` (Node 22, region `asia-southeast1`, Admin SDK ข้าม rules) — ไฟล์ละระบบ: `base market pass events daily camp world dive nemesis radio caravan garden col home profile learn ability war casino slave mutate hc`; ลงทะเบียนใน `functions/index.js` (รูปแบบ `onCall` + ล็อก error เหมือนกันทุกตัว)
- ข้อมูล: `database_rules.json` (**219 KB จากเพดาน 256 KiB — อย่าให้โต**) + `storage.rules`; โหนดข้อมูลของระบบที่ย้ายมาเป็นฟังก์ชันไม่อยู่ใน rules (default deny) เข้าได้เฉพาะผ่านฟังก์ชัน: `pass enc crate hunt camp pet2 world dive dive2 nem radio caravan garden col home hw hl prof profRep learn abil war casino ctable mut hc`; โหนดที่ไคลเอนต์อ่านได้เพิ่ม: `cpub` (สาธารณะ), `chand/{tid}/{uid}` (ไพ่ตัวเอง), `hc/state`
- เอกสารรายระบบ: `MIGRATION.md` (หัวข้อต่อระบบ: ข้อมูล/กติกา/ข้อควรระวัง/วิธีทดสอบ) • ออกแบบไอเทมชุดต่อไป: `ITEMS_DESIGN.md` + `items.draft.json` • บทพูด NPC: `npc-*.json`

## 2) ขั้นตอน deploy (ลำดับสำคัญ)
1. Cloud Shell: `cd ~/zombocalypse && git fetch origin && git checkout -B <กิ่ง> origin/<กิ่ง> && cd functions && npm install && cd .. && firebase deploy --only functions[,storage]`
2. merge PR บน GitHub (GitHub Pages ส่งเกมใหม่)
3. **เผยแพร่ rules ท้ายสุดเฉพาะเมื่อ `database_rules.json` เปลี่ยน**: `git checkout main && git pull origin main && firebase deploy --only database`
- ถ้า `git pull` ฟ้อง divergent branches: ใช้ `git fetch origin && git checkout -B <กิ่ง> origin/<กิ่ง>` (ไม่ใช่ pull)
- ถ้า deploy ฟังก์ชันตัวใดล้ม: `firebase deploy --only functions:<ชื่อ>` ซ้ำ; ไม่ผ่าน → `firebase functions:delete <ชื่อ> --region asia-southeast1 --force` แล้ว deploy ใหม่

## 3) แบบแผนในโค้ด (ทำตามเสมอ)
- ทุกฟังก์ชันตรวจสิทธิ์/ฝ่าย/โซน/HP/แบนเอง และใช้ `lib.withLock(db, uid, now, fn)` (ล็อกต่อผู้เล่น — ถ้าล็อกอยู่จะ `aborted` ไม่รอ ฝั่งเกมควรลองใหม่ 1 ครั้ง; ถ้าต้องถือหลายล็อกให้ถือทีละอันห้ามซ้อน)
- แจกของด้วย `lib.grantAll/addCapped` (คืนของถ้าล้มครึ่งทาง) รองรับ id พิเศษ: `seed_<พืช>` → สวน, `deco_<x>`/`theme_<x>` → ห้อง; ไอเทมปกติต้องอยู่ใน whitelist ของ rules ช่อง `inventory` (regex) และมีใน `ITEMS` ของ `script.js`
- Admin `transaction()` รอบแรกอาจส่ง `null` มา: ต้อง `if (cur === null) return cur` แล้วใช้ flag ตัดสินผล • RTDB ทิ้ง `{}`/`[]` ว่าง → normalize หลังอ่าน • `orderByValue` ต้องมี `.indexOn` → อ่านทั้งหมดแล้วเรียงในหน่วยความจำ
- ฝั่งเกม: เรียกฟังก์ชันผ่านตัวห่อ `xxxCall` ใกล้ต้นไฟล์; UI มือถือก่อน (ปุ่ม ≥44px, แผ่นล่าง `.modal.sheet`); ตัวคูณโบนัสต่อเข้า `fxMods` (`fxAbilMods` ฯลฯ); ค่าปรับแต่งรันไทม์ผ่าน `tune/{key}` (ฟังก์ชัน `T(k, default)`) แก้ในแท็บแอดมิน
- สัญญาข้อมูลที่ rules ตรวจอยู่ (**ห้ามแก้ฝั่งเกมอย่างเดียว**): วิวัฒนาการซอมบี้ `evo/{uid}` (ขั้น/DNA/HP/แรงกัด ~28 จุด), อาวุธ/ดาเมจ/การซ่อม/รื้อ, การโจมตี, ดวล, สต็อกช่องกระเป๋า — แก้ต้องแก้ rules พร้อมกันและเทสต์เทียบกฎเก่า/ใหม่ (ดู `tests/emulator/*parity*.js`)

## 4) สถานะล่าสุด
- PR #7–#20 merge แล้ว, **#21 ยังเปิด** (ภารกิจ HC: ค้นพบธาราทั้งเซิร์ฟเวอร์ + ส่ง DNA ผ่านฟังก์ชัน + รางวัลผู้ค้นพบ + rules) — ต้อง deploy functions → merge → เผยแพร่ rules
- ภารกิจ HC ปิดอยู่ (`tune hc_on = 0`) เปิดเองเมื่อพร้อม; ตั้งโอกาสเจอธาราที่ `hc_pm` (‰)
- ทดสอบทั้งหมดอยู่ที่ `tests/` (ดู `tests/README.md`) — ต้องรัน Firebase emulator เอง

## 5) งานค้าง/ช่องโหว่ที่รู้ (เรียงตามความสำคัญ)
1. **แต้มศึกใหญ่รายสัปดาห์ (`coop/{zh|zz}{สัปดาห์}{โซน}/{uid}.n`) โกงได้**: rules `coop/$key/$uid` ไม่ตรวจว่าทำกิจกรรมจริง (เพิ่มได้ ≤300 ต่อ 4 วินาที) → ควรย้ายการนับแต้มเป็นฟังก์ชันแบบเดียวกับ `hc.js` ก่อนมีรางวัลจริง (`war.js` อ่านค่านี้อยู่)
2. **คาสิโนเกมเดี่ยวไม่มีเพดานชนะต่อวัน** (สล็อตตั้งเดิมพัน ≤100 แล้ว; โป๊กเกอร์รอยัล ×250 ที่เดิมพัน 500 = 125,000) — ควรเพิ่มเพดานชนะรายวันแบบ `day.tw` ของโต๊ะสลาฟ (`slave.js`)
3. **อาวุธใหม่ 20 ชนิด** (`ITEMS_DESIGN.md`): รหัสอาวุธฝังใน rules ~14 จุด (regex ดรอป/รื้อ/บอสโลก/ตรวจ `wpn`) → ต้องเพิ่มรหัสทุกจุด + `config/weaponDmg`/`weaponMaxDur` หรือย้ายการสู้เป็นฟังก์ชัน (ใหญ่) • **คราฟต์อาวุธเดิม 11 ชนิด**: เสนอทำเป็น `craftAct` (สูตรฝั่งเซิร์ฟเวอร์ ไม่แตะ rules; ให้เฉพาะอาวุธระดับต้น–กลาง)
4. ไอเทมชุดที่ 2 อื่นๆ (อาหาร/ยา/บัฟ/ของสะสม 42 ชิ้น) ต้องย้ายระบบค้นหา/ใช้ไอเทมเป็นฟังก์ชันก่อน (ตาม `MIGRATION.md` หัวข้อแรกๆ)
5. แดชบอร์ดแอดมินสร้างข้อมูลผ่านหน้าเว็บ (`adminAct` ระดับ 1 ที่แนะนำ) • เนื้อเรื่องบท 2 ของธารา/เคน (รอเรื่อง) • บอท/โต๊ะ PvP อื่นๆ ของคาสิโน • ถ้าซอมบี้ตันอีกหลังมิวเตชัน (ขั้น 8) ต้องออกแบบชั้นต่อไป (อย่าแตะ `evo/` ใน rules)

## 6) ถ้าจะให้ Claude ปกติช่วยต่อ (ประหยัดบริบท)
- อย่าแนบ `script.js` ทั้งไฟล์ (1.15 MB) — ตัดเฉพาะหัวข้อที่เกี่ยวข้อง (ใช้เลขหัวข้อใน `MIGRATION.md` ชี้) + `functions/<ระบบ>.js` + `functions/lib.js` + หัวข้อที่เกี่ยวใน `MIGRATION.md`
- แจ้งเสมอ: "ห้ามให้ `database_rules.json` โตเกินจำเป็น, ฟังก์ชันใหม่ต้องมี emulator test, UI ต้องรองรับมือถือ 360px, ต้อง `node bump.js`"
- ส่งผลทดสอบ/ข้อความ error กลับไปเสมอ (log ฟังก์ชัน: `firebase functions:log --only <ชื่อ> -n 30`)
