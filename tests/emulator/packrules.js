// 🦖 rules สายแรปเตอร์ (evo/{uid}/p + ฉายา evo4 + ลูกฝูงใน attacks/pkd): เทียบ rules เก่า (main ที่ 7dd767e) กับใหม่ — ซื้อขั้นด้วย DNA/สายหลักแบบเดียวกับสายอื่น (สายอื่นได้ถึงขั้น 1)
//   • ผลตอบแทนสุทธิ: rules เก่าไม่รับฟิลด์ p ($other:false) จึงปฏิเสธทุกกรณีของแรปเตอร์ — ใหม่รับเฉพาะที่ถูกกติกา
// ใช้: NODE_PATH=/tmp/fbt/rut/node_modules node tests/emulator/packrules.js (OLD_RULES=ไฟล์ เพื่อกำหนด rules เก่าเอง)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 7dd767e:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
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
  const TODAY = now - (now % 86400000), P1 = evo({ dna: 20, sp: 3, p: 1, line: "pack", day: TODAY, gain: 5 });
  const buy = (o) => () => ({ "evo/U/p": o.p, "evo/U/sp": o.sp, "evo/U/dna": o.dna, "evo/U/line": o.line });
  const zp = (v) => () => ({ "zonePlayers/ruins/U": { name: "tester", faction: "zombie", evo4: v } }), die = (extra = {}) => () => ({ "users/U/hp": 50, "users/U/zone": "safe", "users/U/lastDeath": SV, ...extra });
  const pkAtk = (pkd, roll = 4) => atk({ wdmg: 6, roll, pkd });
  const C = [   // [ชื่อ, ข้อมูลตั้งต้น, การเขียน, เก่าผ่าน?, ใหม่ผ่าน?]
    // ---- ซื้อขั้น
    ["ซื้อแรปเตอร์ขั้น 1 (3 DNA) สายหลัก=pack", base({ evo: { U: evo({ dna: 20 }) } }), buy({ p: 1, sp: 3, dna: 17, line: "pack" }), false, true],
    ["ซื้อขั้น 2 (6 DNA)", base({ evo: { U: P1 } }), buy({ p: 2, sp: 9, dna: 14, line: "pack" }), false, true],
    ["ซื้อขั้น 2 แต่ DNA หักไม่ตรง", base({ evo: { U: P1 } }), buy({ p: 2, sp: 9, dna: 15, line: "pack" }), false, false],
    ["ซื้อกระโดด 2 ขั้นในครั้งเดียว", base({ evo: { U: evo({ dna: 20 }) } }), buy({ p: 2, sp: 9, dna: 11, line: "pack" }), false, false],
    ["ตั้งขั้นโดยไม่เพิ่ม sp (ฟรี)", base({ evo: { U: evo({ dna: 20 }) } }), buy({ p: 1, sp: 0, dna: 20, line: "pack" }), false, false],
    ["ขั้น 5 (เกิน)", base({ evo: { U: evo({ dna: 99, sp: 34, p: 4, line: "pack" }) } }), buy({ p: 5, sp: 37, dna: 96, line: "pack" }), false, false],
    ["ขั้น 4 สายหลัก pack: ซื้อขั้น 4 (15 DNA) จากขั้น 3", base({ evo: { U: evo({ dna: 30, sp: 19, p: 3, line: "pack" }) } }), buy({ p: 4, sp: 34, dna: 15, line: "pack" }), false, true],
    ["สายหลักตะกละ 4 + แรปเตอร์ขั้น 1 (สายอื่นได้ถึงขั้น 1)", base({ evo: { U: evo({ dna: 20, sp: 34, h: 4, line: "hunter" }) } }), buy({ p: 1, sp: 37, dna: 17, line: "hunter" }), false, true],
    ["สายหลักตะกละ 4 + แรปเตอร์ขั้น 2 (เกิน — สายอื่นได้ถึงขั้น 1)", base({ evo: { U: evo({ dna: 20, sp: 37, h: 4, p: 1, line: "hunter" }) } }), buy({ p: 2, sp: 43, dna: 14, line: "hunter" }), false, false],
    ["แรปเตอร์สายหลัก ขั้น 2 + ตะกละขั้น 1 ได้", base({ evo: { U: evo({ dna: 20, sp: 9, p: 2, line: "pack" }) } }), () => ({ "evo/U/h": 1, "evo/U/sp": 12, "evo/U/dna": 17 }), false, true],
    ["แรปเตอร์สายหลัก ขั้น 2 + ตะกละขั้น 2 (เกิน)", base({ evo: { U: evo({ dna: 20, sp: 12, p: 2, h: 1, line: "pack" }) } }), () => ({ "evo/U/h": 2, "evo/U/sp": 18, "evo/U/dna": 14 }), false, false],
    ["ซื้อสายตะกละปกติขั้น 1 (ยังทำงานเหมือนเดิม)", base({ evo: { U: evo({ dna: 20 }) } }), () => ({ "evo/U/h": 1, "evo/U/sp": 3, "evo/U/dna": 17, "evo/U/line": "hunter" }), true, true],
    ["line เป็น pack แต่ไม่มีขั้นแรปเตอร์ (แอบตั้งสาย)", base({ evo: { U: evo({ dna: 20 }) } }), () => ({ "evo/U/line": "pack" }), false, false],
    ["มนุษย์ซื้อแรปเตอร์", base({ evo: { U: evo({ dna: 20 }) } }, {}, "human"), buy({ p: 1, sp: 3, dna: 17, line: "pack" }), false, false],
    // ---- ได้ DNA ตอนกัด / ตาย / รีเซ็ต
    ["กัดได้ DNA +1 ขณะถือแรปเตอร์ขั้น 1", base({ ...bite, evo: { U: P1 } }), () => ({ "evo/U/dna": 21, "evo/U/gain": 6, "evo/U/day": TODAY, "bites/U": null }), false, true],
    ["กัดได้ DNA แต่แอบเปลี่ยนขั้น p → 4", base({ ...bite, evo: { U: P1 } }), () => ({ "evo/U/dna": 21, "evo/U/gain": 6, "evo/U/day": TODAY, "evo/U/p": 4, "bites/U": null }), false, false],
    ["กัดได้ DNA ของสายตะกละ (ไม่มี p) ยังผ่าน", base({ ...bite, evo: { U: evo({ dna: 5, h: 1, sp: 3, line: "hunter", day: TODAY, gain: 5 }) } }), () => ({ "evo/U/dna": 6, "evo/U/gain": 6, "evo/U/day": TODAY, "bites/U": null }), true, true],
    ["ตายเสีย DNA ครึ่งหนึ่ง (สายตะกละ — ฐานเทียบ)", base({ inventory: {}, evo: { U: evo({ dna: 10, sp: 3, h: 1, line: "hunter" }) } }, { hp: 0, zone: "forest" }), die({ "evo/U/dna": 5 }), true, true],
    ["ตายเสีย DNA ครึ่งหนึ่ง (ถือแรปเตอร์)", base({ inventory: {}, evo: { U: evo({ dna: 10, sp: 3, p: 1, line: "pack" }) } }, { hp: 0, zone: "forest" }), die({ "evo/U/dna": 5 }), false, true],
    ["ตายแล้วแอบรีเซ็ตขั้น p", base({ inventory: {}, evo: { U: evo({ dna: 10, sp: 3, p: 1, line: "pack" }) } }, { hp: 0, zone: "forest" }), die({ "evo/U/dna": 5, "evo/U/p": 0 }), false, false],
    ["รีเซ็ตทั้งหมด (คืน 70%) ล้างแรปเตอร์", base({ evo: { U: evo({ dna: 0, sp: 3, p: 1, line: "pack" }) } }), () => ({ "evo/U/h": 0, "evo/U/g": 0, "evo/U/s": 0, "evo/U/p": 0, "evo/U/sp": 0, "evo/U/line": "none", "evo/U/dna": 2, "evo/U/rs": SV }), false, true],
    ["รีเซ็ตแต่ไม่ล้างแรปเตอร์ (ค้างขั้น)", base({ evo: { U: evo({ dna: 0, sp: 3, p: 1, line: "pack" }) } }), () => ({ "evo/U/h": 0, "evo/U/g": 0, "evo/U/s": 0, "evo/U/sp": 0, "evo/U/line": "none", "evo/U/dna": 2, "evo/U/rs": SV }), true, false],
    ["รีเซ็ตสายตะกละปกติ (ยังทำงาน)", base({ evo: { U: evo({ dna: 0, sp: 3, h: 1, line: "hunter" }) } }), () => ({ "evo/U/h": 0, "evo/U/g": 0, "evo/U/s": 0, "evo/U/sp": 0, "evo/U/line": "none", "evo/U/dna": 2, "evo/U/rs": SV }), true, true],
    // ---- ฉายา (evo4)
    ["ฉายา pack เมื่อ p = 4", base({ evo: { U: evo({ sp: 34, p: 4, line: "pack" }) } }, { zone: "ruins" }), zp("pack"), false, true],
    ["ฉายา pack เมื่อ p = 3 (ยังไม่ถึง)", base({ evo: { U: evo({ sp: 19, p: 3, line: "pack" }) } }, { zone: "ruins" }), zp("pack"), false, false],
    ["ฉายา hunter เมื่อ h = 4 (เดิม)", base({ evo: { U: evo({ sp: 34, h: 4, line: "hunter" }) } }, { zone: "ruins" }), zp("hunter"), true, true],
    // ---- ลูกฝูงกัดในการโจมตี (attacks/pkd)
    ["โจมตีมีลูกฝูงกัด pkd 2 (แรปเตอร์ขั้น 2)", base({ evo: { U: evo({ sp: 9, p: 2, line: "pack" }) } }), pkAtk(2), true, true],
    ["pkd 3 เกินขั้น 2", base({ evo: { U: evo({ sp: 9, p: 2, line: "pack" }) } }), pkAtk(3), true, false],
    ["pkd 5 ขั้น 4 ไม่มีมิวเตชัน (เกิน 4)", base({ evo: { U: evo({ sp: 34, p: 4, line: "pack" }) } }), pkAtk(5), true, false],
    ["pkd 5 ขั้น 4 + มิวเตชัน (mut/p=1)", base({ evo: { U: evo({ sp: 34, p: 4, line: "pack" }) }, mut: { U: { p: 1 } } }), pkAtk(5), true, true],
    ["pkd 5 ขั้น 3 + มิวเตชันค้าง (ต้องขั้น 4)", base({ evo: { U: evo({ sp: 19, p: 3, line: "pack" }) }, mut: { U: { p: 1 } } }), pkAtk(5), true, false],
    ["pkd โดยไม่มีสายแรปเตอร์", base({}), pkAtk(1), true, false],
    ["pkd 0", base({ evo: { U: evo({ sp: 3, p: 1, line: "pack" }) } }), pkAtk(0), true, false],
    ["pkd ทศนิยม", base({ evo: { U: evo({ sp: 9, p: 2, line: "pack" }) } }), pkAtk(1.5), true, false],
    ["pkd จากมนุษย์ที่มี evo ค้าง", base({ evo: { U: evo({ sp: 9, p: 2, line: "pack" }) } }, {}, "human"), pkAtk(1), true, false],
    ["โจมตีปกติไม่มี pkd", base({}), atk({ wdmg: 6 }), true, true]
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
