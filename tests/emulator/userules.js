// เทียบ rules เก่า (main ก่อนย้ายการใช้ไอเทม) กับ rules ใหม่ (ตัดกิ่ง eatSlot ออก): การเขียนปกติต้องผลเท่ากัน • การกิน/ดื่ม/ใช้ยา/บัฟ/สถานะผ่านการเขียนตรงต้องถูกปฏิเสธ (ยกเว้นยาในการสู้บอส: ผ้าพันแผล/ชุดปฐมพยาบาล)
// ใช้: git show 5a14644:database_rules.json > rules_main.json  (ค่าตั้งต้นเทียบกับ rules ที่ commit 5a14644 = ก่อนย้ายการใช้ไอเทม; กำหนดเองด้วย OLD_RULES)  แล้วรันด้วย NODE_PATH ที่มี @firebase/rules-unit-testing
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 5a14644:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now(), M = 60000;
  const base = (fac = "human", extra = {}) => ({ users: { U: { username: "tester", faction: fac, role: "player", banned: false, zone: "safe", createdAt: now - 864000000, hp: 50, food: 2, foodTs: now - 400000, water: 2, waterTs: now - 400000, stamina: 50, staminaTs: now - 60000, ...extra } }, stats: { U: { str: 1, hp: 1, st: 1, regen: 0, agi: 0, tough: 0 } } });
  // กฎเดิมเช็กวัตถุดิบคราฟต์ (scrap/chem/canned_food/medkit) ทุกครั้งที่เขียนช่องกระเป๋า — ถ้าไม่มีช่องเหล่านี้ กฎจะ error แล้วปฏิเสธทั้งหมด (ผู้เล่นจริงมีเสมอ) จึงใส่ไว้เป็นค่าตั้งต้น
  const stock = () => ({ scrap: { id: "scrap", qty: 5 }, chem: { id: "chem", qty: 5 }, canned_food: { id: "canned_food", qty: 5 }, medkit: { id: "medkit", qty: 5 } });
  const inv = (o) => ({ inventory: { U: { ...stock(), ...o } } });
  // [ชื่อ, สถานะเริ่ม, การเขียน, ผลเก่าที่คาด, ผลใหม่ที่คาด]
  const C = [
    ["decay food (human)", { ...base(), ...inv({}) }, () => ({ "users/U/food": 1, "users/U/foodTs": now - 400000 + 150000 }), true, true],
    ["decay water", { ...base(), ...inv({}) }, () => ({ "users/U/water": 1, "users/U/waterTs": now - 400000 + 100000 }), true, true],
    ["zombie bite food +25", { ...base("zombie", { food: 0, foodTs: now - 150000 }), ...inv({}), bites: { U: { ts: now, food: 25, dna: 1 } } }, () => ({ "users/U/food": 25, "users/U/foodTs": SV, "bites/U": null }), true, true],
    ["stamina spend", { ...base(), ...inv({}) }, () => ({ "users/U/stamina": 40, "users/U/staminaTs": SV }), true, true],
    ["stamina regen", { ...base(), ...inv({}) }, () => ({ "users/U/stamina": 52, "users/U/staminaTs": SV }), true, true],
    ["stamina cheat +60", { ...base(), ...inv({}) }, () => ({ "users/U/stamina": 99, "users/U/staminaTs": SV }), false, false],
    ["hp damage", { ...base(), ...inv({}) }, () => ({ "users/U/hp": 30 }), true, true],
    ["hp cheat heal", { ...base(), ...inv({}) }, () => ({ "users/U/hp": 100 }), false, false],
    ["boss heal bandage", { ...base(), ...inv({ bandage: { id: "bandage", qty: 2 } }) }, () => ({ "users/U/hp": 70, "users/U/eatSlot": "bandage", "inventory/U/bandage/qty": 1 }), true, true],
    ["boss heal medkit", { ...base(), ...inv({ medkit: { id: "medkit", qty: 1 } }) }, () => ({ "users/U/hp": 100, "users/U/eatSlot": "medkit", "inventory/U/medkit": null }), true, true],
    ["eat canned_food (client write)", { ...base(), ...inv({ canned_food: { id: "canned_food", qty: 2 } }) }, () => ({ "users/U/food": 40, "users/U/foodTs": SV, "users/U/eatSlot": "canned_food", "inventory/U/canned_food/qty": 1 }), true, false],
    ["drink water (client write)", { ...base(), ...inv({ water: { id: "water", qty: 2 } }) }, () => ({ "users/U/water": 40, "users/U/waterTs": SV, "users/U/eatSlot": "water", "inventory/U/water/qty": 1 }), true, false],
    ["stim stamina (client write)", { ...base(), ...inv({ stim_shot: { id: "stim_shot", qty: 2 } }) }, () => ({ "users/U/stamina": 100, "users/U/staminaTs": SV, "users/U/eatSlot": "stim_shot", "inventory/U/stim_shot/qty": 1 }), true, false],
    ["moss heal (client write)", { ...base(), ...inv({ moss: { id: "moss", qty: 2 } }) }, () => ({ "users/U/hp": 65, "users/U/eatSlot": "moss", "inventory/U/moss/qty": 1 }), true, false],
    ["trauma_kit heal (client write)", { ...base(), ...inv({ trauma_kit: { id: "trauma_kit", qty: 1 } }) }, () => ({ "users/U/hp": 100, "users/U/eatSlot": "trauma_kit", "inventory/U/trauma_kit": null }), true, false],
    ["custom_food heal (client write)", { ...base(), ...inv({ s1: { id: "custom_food", qty: 1, name: "x", type: "consumable", heal: 30 } }) }, () => ({ "users/U/hp": 80, "users/U/eatSlot": "s1", "inventory/U/s1": null }), true, false],
    ["custom_food permanent stat (client write)", { ...base(), ...inv({ s1: { id: "custom_food", qty: 1, name: "x", type: "consumable", s_str: 1 } }) }, () => ({ "stats/U/str": 2, "users/U/eatSlot": "s1", "inventory/U/s1": null }), true, false],
    ["custom_food buff (client write)", { ...base(), ...inv({ s1: { id: "custom_food", qty: 1, name: "x", type: "consumable", bmin: 5, b_str: 2 } }) }, () => ({ "buffs/U": { bstart: SV, mins: 5, str: 2, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 }, "users/U/eatSlot": "s1", "inventory/U/s1": null }), true, false],
    ["custom_food effect (client write)", { ...base(), ...inv({ s1: { id: "custom_food", qty: 1, name: "x", type: "consumable", emin: 5, e_hot: 1 } }) }, () => ({ "effects/U/hot": { bstart: SV, mins: 5, v: 1, tick: SV }, "users/U/eatSlot": "s1", "inventory/U/s1": null }), true, false],
    ["bandage cures bleed (client write)", { ...base(), ...inv({ bandage: { id: "bandage", qty: 2 } }), effects: { U: { bleed: { bstart: now - M, mins: 5, v: 2, tick: now - 20000 } } } }, () => ({ "effects/U/bleed": null, "users/U/eatSlot": "bandage", "inventory/U/bandage/qty": 1 }), true, false],
    ["effect tick (hot/bleed)", { ...base(), ...inv({}), effects: { U: { bleed: { bstart: now - M, mins: 5, v: 2, tick: now - 20000 } } } }, () => ({ "effects/U/bleed/tick": SV, "users/U/hp": 48 }), true, true],
    ["expired effect cleanup", { ...base(), ...inv({}), effects: { U: { stun: { bstart: now - 10 * M, mins: 1, v: 1, tick: now - 10 * M } } } }, () => ({ "effects/U/stun": null }), false, true],   // กฎเดิม error เมื่อไม่มี users/{uid}/eatSlot (child(null)) จึงลบสถานะที่หมดอายุไม่ผ่านถ้ายังไม่เคยกินอะไร — กฎใหม่ไม่อ้าง eatSlot แล้ว ลบสถานะหมดอายุของตัวเองได้ปกติ
    ["buff removal", { ...base(), ...inv({}), buffs: { U: { bstart: now - 10 * M, mins: 1, str: 1, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 } } }, () => ({ "buffs/U": null }), true, true],
    ["cheat: set buff without item", { ...base(), ...inv({}) }, () => ({ "buffs/U": { bstart: SV, mins: 99, str: 5, hp: 5, st: 5, regen: 5, agi: 5, tough: 5 } }), false, false]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, seed, w, eo, en] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(seed)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  console.log(JSON.stringify(res.nw)); assert.strictEqual(bad, 0);
  // (ขนาด rules เปลี่ยนเท่าไรดูจากบรรทัดสรุปด้านล่าง — ไม่ assert เพราะ origin/main มีการตัด rules รอบนี้ไปแล้ว)
  console.log("USE RULES OK (rules −" + (R.old.length - R.nw.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
