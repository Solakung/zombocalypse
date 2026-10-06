// ตัดกิ่งคราฟต์ฝั่งไคลเอนต์ (12 สูตร) ออกจาก rules `inventory`: เทียบ rules เก่า (OLD_RULES หรือ origin/main) กับใหม่
// - คราฟต์ผ่านการเขียนตรงต้องถูกปฏิเสธ (เดิมอนุญาต) • สิ่งอื่นต้องผลเท่ากัน: ชุดเริ่มต้นตอนสมัคร, ลบ/ลดจำนวนของ, ของที่ค้นเจอ, ชุดเริ่มต้นที่ผิดจำนวน, ผู้เล่นโดนแบน
// รันด้วย NODE_PATH ที่มี @firebase/rules-unit-testing (ข้อมูลทดสอบต้องมี scrap/chem/canned_food/medkit — ดู userules.js)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show c6ab75d:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now();
  const user = (extra = {}) => ({ username: "tester", faction: "human", role: "player", banned: false, zone: "safe", createdAt: now - 864000000, hp: 100, food: 50, foodTs: now, water: 50, waterTs: now, stamina: 50, staminaTs: now, ...extra });
  const stock = (o = {}) => ({ scrap: { id: "scrap", qty: 20 }, chem: { id: "chem", qty: 20 }, canned_food: { id: "canned_food", qty: 5 }, medkit: { id: "medkit", qty: 5 }, water: { id: "water", qty: 5 }, bandage: { id: "bandage", qty: 5 }, energy_drink: { id: "energy_drink", qty: 5 }, fish: { id: "fish", qty: 5 }, lab_sample: { id: "lab_sample", qty: 5 }, ...o });
  const withInv = (o, u = user()) => ({ users: { U: u }, inventory: { U: stock(o) } });
  // สูตรเดิม: [รหัส, วัตถุดิบที่ลด {รหัส: จำนวนที่เหลือ}]
  const CRAFT = { bandage: { scrap: 18 }, antidote: { chem: 18, scrap: 19 }, trauma_kit: { medkit: 4, bandage: 3, chem: 19 }, soup: { canned_food: 4, water: 4 }, stim_shot: { chem: 17, energy_drink: 4 }, rag_vest: { scrap: 15 }, scrap_plate: { scrap: 10, chem: 18 }, headlamp: { scrap: 16, energy_drink: 4 }, toolkit: { scrap: 14, chem: 19 }, exp_serum: { lab_sample: 3, chem: 18 }, fish_grill: { fish: 4, scrap: 19 }, fish_stew: { fish: 3, water: 4, canned_food: 4 } };
  const C = [];
  for (const [id, left] of Object.entries(CRAFT)) C.push([`craft ${id} (client write)`, withInv({}), () => { const u = {}; for (const [m, q] of Object.entries(left)) u[`inventory/U/${m}/qty`] = q; u[`inventory/U/${id}`] = { id, qty: id === "bandage" ? 6 : 1 }; if (id === "trauma_kit") u["inventory/U/chem/qty"] = 19; return u; }, true, false]);
  C.push(["delete own slot", withInv({}), () => ({ "inventory/U/water": null }), true, true]);
  C.push(["lower qty", withInv({}), () => ({ "inventory/U/water/qty": 3 }), true, true]);
  C.push(["raise qty (cheat)", withInv({}), () => ({ "inventory/U/water/qty": 50 }), false, false]);
  C.push(["search drop in safe (bread + stamina cost)", withInv({}), () => ({ "inventory/U/bread": { id: "bread", qty: 1 }, "users/U/stamina": 40, "users/U/staminaTs": SV }), true, true]);
  C.push(["search drop without paying stamina (denied)", withInv({}), () => ({ "inventory/U/bread": { id: "bread", qty: 1 } }), false, false]);
  C.push(["search drop wrong zone item", withInv({}), () => ({ "inventory/U/pistol": { id: "pistol", qty: 1, dur: 12 } }), false, false]);
  C.push(["craft by zombie (denied)", withInv({}, user({ faction: "zombie" })), () => ({ "inventory/U/chem/qty": 18, "inventory/U/scrap/qty": 19, "inventory/U/antidote": { id: "antidote", qty: 1 } }), false, false]);
  C.push(["craft outside safe (denied)", withInv({}, user({ zone: "ruins" })), () => ({ "inventory/U/scrap/qty": 18, "inventory/U/bandage/qty": 6 }), false, false]);
  const kit = (fac, items) => [`starter kit ${fac}`, {}, () => { const u = { "users/U": { username: "newbie", faction: fac, role: "player", banned: false, zone: "safe", stamina: fac === "human" ? 110 : 100, staminaTs: SV, hp: 110, food: 100, water: 100, foodTs: SV, waterTs: SV, createdAt: SV }, "stats/U": fac === "human" ? { str: 3, hp: 1, st: 1, regen: 2, agi: 0, tough: 0 } : { str: 3, hp: 1, st: 0, regen: 0, agi: 2, tough: 1 } }; for (const [id, q] of Object.entries(items)) u[`inventory/U/${id}`] = { id, qty: q }; return u; }, true, true];
  C.push(kit("human", { canned_food: 2, water: 2, bandage: 2, scrap: 3 })); C.push(kit("zombie", { rotten_meat: 3, water: 2, bandage: 2 }));
  { const [n, s, w] = kit("human", { canned_food: 2, water: 2, bandage: 2, scrap: 30 }); C.push([n + " (too many scrap)", s, w, false, false]); }
  const res = { old: {}, nw: {} };
  for (const k of ["old", "nw"]) {
    await setRules(k);
    for (const [name, seed, w] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(seed)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0; for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  // (ขนาด rules เปลี่ยนเท่าไรดูจากบรรทัดสรุปด้านล่าง — ไม่ assert เพราะ origin/main มีการตัด rules รอบนี้ไปแล้ว)
  console.log("CRAFT RULES OK (" + C.length + " cases, rules −" + (R.old.length - R.nw.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
