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
| `mut.js` `career56.js` `abil.js` | มิวเตชันซอมบี้ / อาชีพขั้น 5–6 / ความสามารถ+ศึกใหญ่ |
| `prof.js` `learn.js` `home.js` `garden.js` `col.js` `passevt.js` `sys3.js` `sys4.js` `themetest.js` | โปรไฟล์/รูป webp, โค้ช, ห้อง, สวน, สมุดสะสม, Pass+อีเวนต์, ระบบอื่นๆ |
| `ruleparity.js` `diff.js` `basediff.js` `marketdiff.js` `e2e*.js` `walltest.js` `batch1test.js` | เทียบ rules เก่า/ใหม่ของระบบที่ย้ายมาเป็นฟังก์ชันในช่วงแรก |

## เทสต์หน้าจอมือถือ (`tests/ui/`) — Playwright, ดึงโค้ดบางช่วงของ `script.js` มารันในหน้าเปล่า (ฟังก์ชัน callable ถูกจำลอง)
`node uicasino.js`, `uislave.js`, `uimut.js`, `uihub.js` ฯลฯ — พิมพ์ผล JSON และ `errors: []`

> หมายเหตุ: `ruleparity.js` (เทียบการคราฟต์แบบเขียนตรง) ล้าสมัยโดยตั้งใจ — คราฟต์ทุกสูตรย้ายไป `forgeAct` แล้ว ใช้ `craftrules.js` (เทียบ rules เก่า/ใหม่ของ `inventory`) แทน; `usediff.js`/`use.js`/`userules.js` ครอบคลุมระบบใช้ไอเทม

> `tests/ui/uiclog.js` — หน้าต่าง "มีอะไรใหม่" (changelog.json): แสดงครั้งเดียวต่อรายการ, ผู้เล่นใหม่ไม่เห็น, เปิดซ้ำได้, ไม่ล้น 360px, ข้อความไม่ถูกตีความเป็น HTML
