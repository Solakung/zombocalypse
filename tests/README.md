# ชุดทดสอบ (คัดลอกมาจากโฟลเดอร์ชั่วคราวของเซสชัน Claude Code)

> สคริปต์ทั้งหมดเขียนให้รันในเครื่องที่มี **Firebase Realtime Database emulator** (พอร์ต 9000) และ Playwright
> พาธบางจุดในไฟล์ยังเป็นพาธของเครื่องเดิม (`/home/user/zombocalypse/functions/`, `/opt/node-tools/...`) — แก้ตัวแปรบรรทัดต้นไฟล์ให้ตรงกับเครื่องคุณก่อนรัน

## รัน emulator
```
cd functions && npm install
npx firebase emulators:start --only database --project demo-zombo    # ปล่อยค้างไว้
```
ก่อนเทสต์ที่ใช้กฎ (`*rules.js`, `*parity.js`, `ruleparity.js`) ต้องใส่ rules ปัจจุบันเข้า emulator เอง:
```
curl -X PUT -H "Authorization: Bearer owner" --data-binary @database_rules.json "http://127.0.0.1:9000/.settings/rules.json?ns=<ชื่อ ns ที่ไฟล์ใช้>"
```
(ถ้ารันในเครื่องที่ตั้งพร็อกซี: ใช้ `env -u HTTPS_PROXY -u https_proxy node ...`)

## เทสต์ฟังก์ชัน (`tests/emulator/`) — รันด้วย `node <ไฟล์>.js` ต้องลงท้ายว่า `... OK`
| ไฟล์ | ครอบคลุม |
|---|---|
| `casino.js` `casinoparity.js` | คาสิโน (ชิป/หนี้/เกมทั้ง 7/เพดาน) • พาริตี้ rules โซนคาสิโน |
| `slaveeng.js` `slave.js` `slaverules.js` | สลาฟ: เอนจิน (จำลอง 1,500 เกม), ฟังก์ชันบน emulator, rules ของ `cpub`/`chand` |
| `hc.js` `hcrules.js` | ภารกิจ HC (ค้นพบธารา/ส่ง DNA) + เทียบ rules เก่า/ใหม่ (`rules_main.json` = rules เดิมจาก `git show origin/main:database_rules.json`) |
| `hboss.js` | บอสเผ่ามนุษย์สำหรับซอมบี้ (`functions/hboss.js`): เปิด/ปิด tune, ทอยเจอ+คูลดาวน์+ถังโทเค็น, สู้เป็นรอบ (โล่/เลือดไหล/ยาอ่อนแรง/ฉมวก/ซุ่มตีก่อน), หนี/ตาย/รับรางวัล, สูตรตรง `script.js` (BOSS_W, วิวัฒนาการ, regex กระเป๋า) |
| `crim.js` | สถานะส้ม (`functions/crim.js`): เปิด/ปิด tune, เงื่อนไขรายงาน (ฝ่ายเดียวกัน/โซน/HP=0/โจมตีล่าสุด/สู้กันเอง/ฆ่าคนส้ม/ซ้ำ), โทษสะสม+เพดาน+ลดเมื่อห่าง 24 ชม., ค่าประกันวัตถุดิบ |
| `crimrules.js` | rules สถานะส้ม เทียบ rules เก่า (37d3eb7) กับใหม่: ส้มเข้า/ฟื้นใน Safe Zone ไม่ได้ ฟื้นที่เมืองร้างได้ คนปกติเหมือนเดิม ผู้เล่นเขียน `crim` ไม่ได้ |
| `tests/ui/uicrim.js` | แถบส้ม/ปุ่มประกัน/การรายงาน (Playwright 360px) |
| `bounty.js` | ค่าหัวใหม่ (`functions/bounty.js`): เปิด/ปิด tune, ตั้งด้วยวัตถุดิบ, เพดาน/ครั้งต่อวัน/คูลดาวน์, ลดตามเวลา (สูตรตรง script.js), เก็บโดยผู้ฆ่า/ผู้ถูกฆ่า, ผู้ตั้งเก็บเองไม่ได้, ค่าธรรมเนียม, กระเป๋าเต็มไม่เสียค่าหัว |
| `tests/ui/uibounty.js` | ค่าหัวใหม่ฝั่งเกม: สูตร/แถวหน้าโลก/ตั้ง/เก็บ (Playwright 360px) |
| `jail.js` | คุก (`functions/jail.js`): เปิด/ปิด tune, เงื่อนไขการจับ, ชั้นโทษ+เพดาน+ลดเมื่อห่าง 24 ชม., ของยึด, ทำงานลดโทษ, จ่ายประกัน, แหกคุก (สำเร็จ/ล้มเหลว), ครบเวลาริบของ |
| `tests/ui/uijail.js` | แถบคุก/ซิงก์โซน/จับ/แหกคุก/ประกัน (Playwright 360px) |
| `tests/ui/uiadm.js` | Admin Console แท็บหมวดหมู่ (รวมเศรษฐกิจ/ปรับค่าของเจ้าของ): การจัดหมวด, แท็บตามบทบาท, ตัวกรองหมวดย่อยของปรับค่า, จำแท็บล่าสุด (Playwright 360px) |
| `tests/sim/hboss_balance.js` | จำลองสมดุลบอสเผ่ามนุษย์ (ซอมบี้ 4 ลายสเตตัส × 4 ขั้นแต้ม) เทียบบอสฝั่งมนุษย์ — ไม่ต้องใช้ emulator `node tests/sim/hboss_balance.js` (ตัวเลขเป็นการสมมติ) |
| `tests/sim/telemetry.js` | แดชบอร์ดสถิติผู้เล่น (ผู้เล่นหายตรงไหน/PvP ตามฝ่าย): ฟังก์ชันล้วน + คีย์ตัวนับผ่าน rules (ไม่ต้องใช้ emulator) |
| `tests/sim/lines_balance.js` | จำลองดวล PvP ซอมบี้ตัวต่อตัวเทียบสาย 3 สาย (ตะกละ/ซากหนา/เลื้อยคลาน) × ตารางฮีลตอนกัด + ทดลองปรับค่า — สมมติสเตตัส/อาวุธ (ไม่ใช่ข้อมูลจริง) |
| `evorules.js` | rules ของวิวัฒนาการ/มิวเตชัน (ปรับสมดุลสาย): เทียบ rules เก่า (`bbef150`) กับใหม่ — HP ซากหนา, ฮีลตอนกัดขั้น 8 (`mut/h`), ซุ่ม ×2.5/×4 + ทอย +2 • `tests/sim/evo_values.js` ตรวจค่าสายที่ตกลงกันจาก `script.js` |
| `fxw.js` `fxwrules.js` | อาวุธติดสถานะ: แคตตาล็อกตรง `script.js`, ค้นเจอ (tune/ถังโทเค็น/เพดานรายวัน), คราฟต์ (forge) • rules `attacks/wfx` เทียบ rules เก่า/ใหม่ (+ ทิ้ง/เก็บ/รับสถานะ) • `tests/ui/uifxw.js` `tests/sim/fxw_balance.js` |
| `mut.js` `career56.js` `abil.js` | มิวเตชันซอมบี้ / อาชีพขั้น 5–6 / ความสามารถ+ศึกใหญ่ |
| `prof.js` `learn.js` `home.js` `garden.js` `col.js` `passevt.js` `sys3.js` `sys4.js` `themetest.js` | โปรไฟล์/รูป webp, โค้ช, ห้อง, สวน, สมุดสะสม, Pass+อีเวนต์, ระบบอื่นๆ |
| `ruleparity.js` `diff.js` `basediff.js` `marketdiff.js` `e2e*.js` `walltest.js` `batch1test.js` | เทียบ rules เก่า/ใหม่ของระบบที่ย้ายมาเป็นฟังก์ชันในช่วงแรก |

## เทสต์หน้าจอมือถือ (`tests/ui/`) — Playwright, ดึงโค้ดบางช่วงของ `script.js` มารันในหน้าเปล่า (ฟังก์ชัน callable ถูกจำลอง)
`node uicasino.js`, `uislave.js`, `uimut.js`, `uihub.js` ฯลฯ — พิมพ์ผล JSON และ `errors: []`

> หมายเหตุ: `ruleparity.js` (เทียบการคราฟต์แบบเขียนตรง) ล้าสมัยโดยตั้งใจ — คราฟต์ทุกสูตรย้ายไป `forgeAct` แล้ว ใช้ `craftrules.js` (เทียบ rules เก่า/ใหม่ของ `inventory`) แทน; `usediff.js`/`use.js`/`userules.js` ครอบคลุมระบบใช้ไอเทม

> `tests/ui/uiclog.js` — หน้าต่าง "มีอะไรใหม่" (changelog.json): แสดงครั้งเดียวต่อรายการ, ผู้เล่นใหม่ไม่เห็น, เปิดซ้ำได้, ไม่ล้น 360px, ข้อความไม่ถูกตีความเป็น HTML
