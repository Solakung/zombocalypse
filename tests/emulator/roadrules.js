// 🚶 rules เดินตามถนน (users/{uid}/zone): เทียบ rules เก่า (HEAD ก่อนก้อนนี้ 6df49dc) กับใหม่ — tune/travel_roads ≠ 1 = เหมือนเดิมทุกอย่าง • = 1 ต้องเดินตามถนนที่มีใน config/roads/{จาก}_{ถึง} (= พลังงานต่อถนน) เท่านั้น
//   • ไม่มี config ของถนนนั้น = ไปไม่ได้ (กันกดข้ามโซน/ลืมซิงก์) • พลังงานหักไม่พอ/คูลดาวน์ 45 วินาที ยังบังคับเหมือนเดิม
// ใช้: NODE_PATH=/tmp/fbt/rut/node_modules node tests/emulator/roadrules.js (OLD_RULES=ไฟล์ เพื่อกำหนด rules เก่าเอง)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 6df49dc:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now();
  const stock = () => ({ scrap: { id: "scrap", qty: 5 }, chem: { id: "chem", qty: 5 }, canned_food: { id: "canned_food", qty: 5 }, medkit: { id: "medkit", qty: 5 } });   // กฎเดิมเช็กช่องเหล่านี้ทุกครั้ง (ไม่มี = error = ปฏิเสธทั้งหมด)
  const user = (fac, extra = {}) => ({ username: "tester", faction: fac, role: "player", banned: false, zone: "ruins", createdAt: now - 864000000, hp: 50, food: 50, foodTs: now - 1000, water: 50, waterTs: now - 1000, stamina: 50, staminaTs: now - 60000, ...extra });
  const base = (extra = {}, ux = {}, fac = "zombie") => ({ users: { U: user(fac, ux), T: user("human", { username: "target" }) }, stats: { U: { str: 1, hp: 1, st: 1, regen: 0, agi: 0, tough: 0 } }, inventory: { U: stock() }, ...extra });
  const evo = (o) => ({ dna: 0, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0, ...o });
  const bite = { bites: { U: { ts: now, food: 25, dna: 1 } } };
  const heal = (n) => () => ({ "users/U/hp": 50 + n, "bites/U": null });
  const atk = (extra, ts = SV) => () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "ruins", ts, ...extra }, "users/U/lastAttack": SV });
  const amb = (s, wd, roll = 4) => ({ ...base({ evo: { U: evo({ s, line: "shade", h: 0 }) } }, { lastTravel: now - 10000 }) });
  // [ชื่อ, สถานะเริ่ม, การเขียน, ผลเก่าที่คาด, ผลใหม่ที่คาด]
  const fs2 = require("fs"), M = require("/home/user/zombocalypse/functions/worldmap");
  const roads = {}; M.WORLD.roads.forEach((r) => { const c = M.worldCost(r); roads[r[0] + "_" + r[1]] = c; roads[r[1] + "_" + r[0]] = c; });
  const at = (zone, extra = {}, st = 100) => base({ tune: { travel_roads: 1 }, config: { roads } }, { zone, stamina: st, staminaTs: now - 1000, lastTravel: now - 60000, ...extra });
  const off = (zone, extra = {}, st = 100) => base({}, { zone, stamina: st, staminaTs: now - 1000, lastTravel: now - 60000, ...extra });
  const go = (z, cost, st = 100) => () => ({ "users/U/zone": z, "users/U/lastTravel": SV, "users/U/stamina": st - cost, "users/U/staminaTs": SV });
  const roadt = {}; M.WORLD.roads.forEach((r) => { const c = M.worldSecs(r); roadt[r[0] + "_" + r[1]] = c; roadt[r[1] + "_" + r[0]] = c; });
  const atT = (zone, ago, o = {}) => base({ tune: { travel_roads: o.off ? 0 : 1 }, config: o.noT ? { roads } : { roads, roadt } }, { zone, stamina: 100, staminaTs: now - 1000, lastTravel: now - ago });
  const sec = (a, b) => roadt[a + "_" + b];
  assert(sec("safe", "factory") === 33 && sec("safe", "forest") === 52, "เวลาถนนตามตาราง");
  const C = [   // [ชื่อ, ข้อมูลตั้งต้น, การเขียน, เก่าผ่าน?, ใหม่ผ่าน?]
    // ---- เวลาเดินต่อถนน (config/roadt): คูลดาวน์ก่อนออกเดิน = เวลาของถนนสายนั้น • เก่า = 45 วินาทีเสมอ
    ["เวลา: ถนนสั้น Safe→โรงงาน 33 วิ รอครบ 34 วิ ผ่าน", atT("safe", 34000), go("factory", 5), false, true],
    ["เวลา: Safe→โรงงาน 33 วิ รอแค่ 30 วิ ไม่ผ่าน", atT("safe", 30000), go("factory", 5), false, false],
    ["เวลา: ทางป่ายาว Safe→ป่า 52 วิ รอ 46 วิ (เกิน 45 เดิม) ไม่ผ่านแล้ว", atT("safe", 46000), go("forest", 7), true, false],
    ["เวลา: Safe→ป่า รอ 53 วิ ผ่าน", atT("safe", 53000), go("forest", 7), true, true],
    ["เวลา: โรงพยาบาล→อุโมงค์ 54 วิ รอ 50 วิ ไม่ผ่าน", atT("hospital", 50000), go("tunnel", 8), false, false],
    ["เวลา: โรงพยาบาล→อุโมงค์ รอ 55 วิ ผ่าน", atT("hospital", 55000), go("tunnel", 8), false, true],
    ["เวลา: ไม่มี config/roadt → ถอยไป 45 วิ (รอ 40 วิ ไม่ผ่าน)", atT("safe", 40000, { noT: true }), go("factory", 5), false, false],
    ["เวลา: ไม่มี config/roadt รอ 46 วิ ผ่าน", atT("safe", 46000, { noT: true }), go("factory", 5), false, true],
    ["เวลา: ปิดสวิตช์แล้วยังใช้ 45 วิ (รอ 34 วิ ไม่ผ่าน ทั้งเก่า/ใหม่)", atT("safe", 34000, { off: true }), go("factory", 10), false, false],
    ["เวลา: ปิดสวิตช์ รอ 46 วิ ผ่านเหมือนเดิม", atT("safe", 46000, { off: true }), go("factory", 10), true, true],
    ["เวลา: ไม่เคยเดินทาง (ไม่มี lastTravel) ผ่าน", base({ tune: { travel_roads: 1 }, config: { roads, roadt } }, { zone: "safe", stamina: 100, staminaTs: now - 1000 }), go("factory", 5), false, true],
    ["เวลา: ใส่เวลา lastTravel ปลอม (ไม่ใช่ now) ไม่ผ่าน", atT("safe", 60000), () => ({ "users/U/zone": "factory", "users/U/lastTravel": now - 1, "users/U/stamina": 95, "users/U/staminaTs": SV }), false, false],
    ["เวลา: เขียน lastTravel เดี่ยว ๆ ซ้ำใน 3 วิ (ต่ำกว่าพื้น 5 วิ) ไม่ผ่านทั้งเก่า/ใหม่", atT("safe", 3000), () => ({ "users/U/lastTravel": SV }), false, false],
    // ---- ปิดสวิตช์ = ระบบเดิมทุกอย่าง
    ["ปิดอยู่: Safe→ค่ายทหาร กดข้ามได้ (14)", off("safe"), go("base", 14), true, true],
    ["ปิดอยู่: Safe→เมืองร้าง (6)", off("safe"), go("ruins", 6), true, true],
    ["ปิดอยู่: Safe→โรงงาน ราคาเดิม 10", off("safe"), go("factory", 10), true, true],
    ["ปิดอยู่: Safe→โรงงาน แต่หักแค่ 5 (ถูกเกิน)", off("safe"), go("factory", 5), false, false],
    ["สวิตช์ = 0 (ชัดเจน) ใช้ระบบเดิม", base({ tune: { travel_roads: 0 } }, { zone: "safe", stamina: 100, staminaTs: now - 1000, lastTravel: now - 60000 }), go("base", 14), true, true],
    // ---- เปิดสวิตช์ + มี config
    ["เปิด: Safe→โรงงาน ติดกัน (5)", at("safe"), go("factory", 5), false, true],
    ["เปิด: Safe→เมืองร้าง (5)", at("safe"), go("ruins", 5), false, true],
    ["เปิด: Safe→ป่าลึก ทางป่า (7)", at("safe"), go("forest", 7), true, true],
    ["เปิด: Safe→ค่ายทหาร ข้ามโซน ไม่ติดกัน (กดข้าม)", at("safe"), go("base", 14), true, false],
    ["เปิด: Safe→ค่ายทหาร ข้ามโซน หักถูก (3)", at("safe"), go("base", 3), false, false],
    ["เปิด: โรงงาน→โรงพยาบาล สะพาน (5)", at("factory"), go("hospital", 5), false, true],
    ["เปิด: โรงพยาบาล→ค่ายทหาร (7)", at("hospital"), go("base", 7), false, true],
    ["เปิด: โรงพยาบาล→คาสิโน (5)", at("hospital"), go("casino", 5), false, true],
    ["เปิด: คาสิโน→โรงพยาบาล ย้อนกลับ (5)", at("casino"), go("hospital", 5), false, true],
    ["เปิด: โรงพยาบาล→แล็บ (7)", at("hospital"), go("lab", 7), false, true],
    ["เปิด: อุโมงค์→แล็บ ทะลุภูเขา (5)", at("tunnel"), go("lab", 5), false, true],
    ["เปิด: ค่ายทหาร→อุโมงค์ ไม่ติดกัน", at("base"), go("tunnel", 8), false, false],
    ["เปิด: ท่าเรือ→ห้าง ไม่ติดกัน", at("port"), go("mall", 10), true, false],
    ["เปิด: หักพลังงานน้อยกว่าราคาถนน (4 แทน 5)", at("safe"), go("ruins", 4), false, false],
    ["เปิด: หักมากกว่าราคาถนน (6 แทน 5) ผ่าน", at("safe"), go("ruins", 6), true, true],
    ["เปิด: พลังงานไม่พอ (เหลือ 3 ต้อง 5)", at("safe", {}, 3), go("ruins", 5, 3), false, false],
    ["เปิด: คูลดาวน์ยังไม่ครบ (10 วินาที)", at("safe", { lastTravel: now - 10000 }), go("ruins", 5), false, false],
    ["เปิด: ล้มอยู่ (hp 0) เดินทางไม่ได้", at("safe", { hp: 0 }), go("ruins", 5), false, false],
    ["เปิด: ติดคุก ออกโซนอื่นไม่ได้", at("jail"), go("ruins", 5), false, false],
    // ---- เปิดสวิตช์ แต่ไม่มี config (ลืมซิงก์) = เดินทางไม่ได้เลย
    ["เปิดแต่ไม่มี config: Safe→โรงงาน", base({ tune: { travel_roads: 1 } }, { zone: "safe", stamina: 100, staminaTs: now - 1000, lastTravel: now - 60000 }), go("factory", 5), false, false],
    ["เปิดแต่ไม่มี config: Safe→เมืองร้าง", base({ tune: { travel_roads: 1 } }, { zone: "safe", stamina: 100, staminaTs: now - 1000, lastTravel: now - 60000 }), go("ruins", 5), false, false],
    // ---- ทางอื่นของโซนไม่กระทบ: เกิดใหม่/เข้าคุก
    ["เปิด: ล้มแล้วฟื้นที่ Safe Zone ยังได้", base({ tune: { travel_roads: 1 }, config: { roads }, inventory: {} }, { hp: 0, zone: "forest" }), () => ({ "users/U/hp": 50, "users/U/zone": "safe", "users/U/lastDeath": SV }), true, true],
    ["เปิด: ผู้เล่นปกติเขียน config/roads ไม่ได้", at("safe"), () => ({ "config/roads/safe_base": 1 }), false, false],
    ["เวลา: ผู้เล่นปกติเขียน config/roadt ไม่ได้", atT("safe", 60000), () => ({ "config/roadt/safe_factory": 1 }), false, false]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, seed, w] of C) {
      const sd = JSON.parse(JSON.stringify(seed)), lt = sd.users && sd.users.U && sd.users.U.lastTravel; if (typeof lt === "number") sd.users.U.lastTravel = lt + (Date.now() - now);   // เลื่อนเวลาตามที่ผ่านไปจริง ไม่ให้เคส "รอ N วินาที" เพี้ยนเพราะเทสต์รันนาน
      await adb.ref().set(sd);
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("ROAD RULES OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
