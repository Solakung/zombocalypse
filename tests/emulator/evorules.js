// 🧬 rules ของวิวัฒนาการ/มิวเตชัน (ปรับสมดุลสายซอมบี้): เทียบ rules เก่า (main ที่ bbef150) กับใหม่ — การเขียนปกติต้องผลเท่ากัน ส่วนที่ตั้งใจเปลี่ยนต้องต่างตามที่คาด
//   • HP โบนัสซากหนา: ขั้น 1 +20→+30, ขั้น 4 +40→+50 (users/hp validate) • ฮีลตอนกัด: ตะกละขั้น 4 + มิวเตชัน (mut/h) ขั้น 4 = 8 (users/hp write) • ซุ่ม: ดาเมจ ×1.5/×2 → ×2.5/×4 และทอยเกิน 6 ได้ +2 เมื่อมีแฟล็ก amb (attacks validate)
// ต้องรัน emulator แล้วใส่ rules เองไม่ต้อง — สคริปต์ตั้งให้ทีละชุด • ใช้: node tests/emulator/evorules.js (OLD_RULES=ไฟล์ เพื่อกำหนด rules เก่าเอง)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show bbef150:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
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
  const C = [
    // ---- HP สูงสุดของซากหนา (validate ตอนเขียนค่าลดลง): seed hp สูงกว่าเพดานเก่า
    ["giant tier1 hp 138→137 (เพดานเก่า 130 / ใหม่ 140)", base({ evo: { U: evo({ g: 1, line: "giant" }) } }, { hp: 138 }), () => ({ "users/U/hp": 137 }), false, true],
    ["giant tier1 hp 141→140 (เท่าเพดานใหม่พอดี)", base({ evo: { U: evo({ g: 1, line: "giant" }) } }, { hp: 141 }), () => ({ "users/U/hp": 140 }), false, true],
    ["giant tier1 hp 142→141 (เกินเพดานใหม่ 140)", base({ evo: { U: evo({ g: 1, line: "giant" }) } }, { hp: 142 }), () => ({ "users/U/hp": 141 }), false, false],
    ["giant tier4 hp 155→154 (เพดานเก่า 150 / ใหม่ 160)", base({ evo: { U: evo({ g: 4, line: "giant" }) } }, { hp: 155 }), () => ({ "users/U/hp": 154 }), false, true],
    ["giant tier4 hp 165→161 (เกินเพดานใหม่ 160)", base({ evo: { U: evo({ g: 4, line: "giant" }) } }, { hp: 165 }), () => ({ "users/U/hp": 161 }), false, false],
    ["hunter tier4 hp 115→114 (ไม่มีโบนัส HP เพดาน 110)", base({ evo: { U: evo({ h: 4, line: "hunter" }) } }, { hp: 115 }), () => ({ "users/U/hp": 114 }), false, false],
    ["ไม่มีสาย hp 108→107 (เพดาน 110)", base({}, { hp: 108 }), () => ({ "users/U/hp": 107 }), true, true],
    // ---- ฮีลตอนกัด (ต้องลบ bites พร้อมกัน)
    ["bite heal พื้นฐาน +2", base({ ...bite }), heal(2), true, true],
    ["bite heal พื้นฐาน +3 (เกิน)", base({ ...bite }), heal(3), false, false],
    ["bite heal ตะกละขั้น 2 +3", base({ ...bite, evo: { U: evo({ h: 2, line: "hunter" }) } }), heal(3), true, true],
    ["bite heal ตะกละขั้น 2 +4 (เกิน)", base({ ...bite, evo: { U: evo({ h: 2, line: "hunter" }) } }), heal(4), false, false],
    ["bite heal ตะกละขั้น 4 +5", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) } }), heal(5), true, true],
    ["bite heal ตะกละขั้น 4 +6 (เกิน)", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) } }), heal(6), false, false],
    ["bite heal ตะกละขั้น 4 + มิวเตชันขั้น 8 (mut/h=4) +8", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) }, mut: { U: { h: 4 } } }), heal(8), false, true],
    ["bite heal ตะกละขั้น 4 + มิวเตชันขั้น 8 +9 (เกิน)", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) }, mut: { U: { h: 4 } } }), heal(9), false, false],
    ["bite heal ตะกละขั้น 4 + มิวเตชันขั้น 7 (mut/h=3) +8 (ยังไม่ถึง)", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) }, mut: { U: { h: 3 } } }), heal(8), false, false],
    ["bite heal ตะกละขั้น 4 + มิวเตชันขั้น 7 +5", base({ ...bite, evo: { U: evo({ h: 4, line: "hunter" }) }, mut: { U: { h: 3 } } }), heal(5), true, true],
    ["bite heal ไม่ใช่ตะกละ แต่มี mut/h ค้าง +8 (ปฏิเสธ)", base({ ...bite, evo: { U: evo({ h: 0, g: 4, line: "giant" }) }, mut: { U: { h: 4 } } }), heal(8), false, false],
    ["bite heal ซากหนาขั้น 4 + mut/g=4 +3 (ไม่มีโบนัสฮีล)", base({ ...bite, evo: { U: evo({ g: 4, line: "giant" }) }, mut: { U: { g: 4 } } }), heal(3), false, false],
    ["bite heal มนุษย์ (ไม่ใช่ซอมบี้) +2", base({ ...bite }, {}, "human"), heal(2), false, false],
    // ---- ซุ่ม (attacks): เลื้อยคลานขั้น 3/4 หลังเดินทางไม่เกิน 60 วิ ต้นฉบับ unarmed = 5 + str(1) = 6
    ["ซุ่มขั้น 4 ดาเมจ 24 (×4)", amb(4), atk({ amb: true, wdmg: 24 }), false, true],
    ["ซุ่มขั้น 4 ดาเมจ 25 (เกิน ×4)", amb(4), atk({ amb: true, wdmg: 25 }), false, false],
    ["ซุ่มขั้น 4 ดาเมจ 12 (×2 เดิม)", amb(4), atk({ amb: true, wdmg: 12 }), true, true],
    ["ซุ่มขั้น 3 ดาเมจ 15 (×2.5)", amb(3), atk({ amb: true, wdmg: 15 }), false, true],
    ["ซุ่มขั้น 3 ดาเมจ 16 (เกิน ×2.5)", amb(3), atk({ amb: true, wdmg: 16 }), false, false],
    ["ซุ่มขั้น 3 ดาเมจ 9 (×1.5 เดิม)", amb(3), atk({ amb: true, wdmg: 9 }), true, true],
    ["ซุ่ม ทอย 8 (ทอยแรก +2)", amb(4), atk({ amb: true, wdmg: 6, roll: 8 }), false, true],
    ["ซุ่ม ทอย 7", amb(4), atk({ amb: true, wdmg: 6, roll: 7 }), false, true],
    ["ซุ่ม ทอย 9 (เกิน)", amb(4), atk({ amb: true, wdmg: 6, roll: 9 }), false, false],
    ["ทอย 8 โดยไม่มีแฟล็กซุ่ม (โกง)", base({ evo: { U: evo({ s: 4, line: "shade" }) } }, { lastTravel: now - 10000 }), atk({ wdmg: 6, roll: 8 }), false, false],
    ["โจมตีปกติ ทอย 6 ดาเมจ 6", base({}), atk({ wdmg: 6, roll: 6 }), true, true],
    ["ซุ่มโดยไม่ได้เดินทางเมื่อกี้ (เกิน 60 วิ)", base({ evo: { U: evo({ s: 4, line: "shade" }) } }, { lastTravel: now - 120000 }), atk({ amb: true, wdmg: 12 }), false, false],
    ["ซุ่มโดยไม่มีสายเลื้อยคลาน", base({}, { lastTravel: now - 10000 }), atk({ amb: true, wdmg: 6 }), false, false]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, seed, w] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(seed)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("EVO RULES OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
