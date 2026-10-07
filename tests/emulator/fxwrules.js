// ⚔️ rules ของอาวุธติดสถานะ: เทียบ rules เก่า (main ที่ bbef150) กับใหม่ — wfx ใน attacks ต้องผ่านเฉพาะ มนุษย์→ซอมบี้ + ตรงกับช่อง fx ของอาวุธที่ถือ • กิ่ง effects เดิมของผู้ถูกโจมตี • ทิ้ง/เก็บอาวุธที่มี fx ต้องยังทำได้
// ใช้: node tests/emulator/fxwrules.js (OLD_RULES=ไฟล์ เพื่อกำหนด rules เก่าเอง)
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
  const stock = () => ({ scrap: { id: "scrap", qty: 5 }, chem: { id: "chem", qty: 5 }, canned_food: { id: "canned_food", qty: 5 }, medkit: { id: "medkit", qty: 5 } });
  const user = (fac, extra = {}) => ({ username: "tester", faction: fac, role: "player", banned: false, zone: "ruins", createdAt: now - 864000000, hp: 80, food: 50, foodTs: now - 1000, water: 50, waterTs: now - 1000, stamina: 50, staminaTs: now - 60000, ...extra });
  const wpn = (fx, extra = {}) => ({ id: "custom", qty: 1, dur: 20, maxDur: 20, name: "อาวุธทดสอบ", dmg: 11, type: "weapon", icon: "🔪", ...(fx ? { fx } : {}), ...extra });
  const BL = { t: "bleed", v: 1, m: 3, p: 35 };
  const seed = (o = {}) => ({ users: { U: user(o.uf || "human", { equipped: "w1", ...(o.ux || {}) }), T: user(o.tf || "zombie", { username: "target" }) }, stats: { U: { str: 1, hp: 1, st: 1, regen: 0, agi: 0, tough: 0 } }, inventory: { U: { ...stock(), w1: o.item === undefined ? wpn(BL) : o.item, w2: { id: "knife", qty: 1, dur: 20 } } }, ...(o.extra || {}) });
  const atk = (wfx, extra = {}) => () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "ruins", ts: SV, wpn: "custom", wdmg: 12, ...(wfx ? { wfx } : {}), ...extra }, "users/U/lastAttack": SV });
  // ผู้ถูกโจมตี (T ซอมบี้) เขียนสถานะลงตัวเองพร้อมลด HP และลบบันทึกโจมตี
  const take = (t, v, m) => () => ({ [`effects/T/${t}`]: { bstart: SV, mins: m, v, tick: SV }, "users/T/hp": 60, "attacks/T/U": null });
  const defSeed = () => ({ users: { U: user("human"), T: user("zombie", { username: "target", hp: 80 }) }, stats: { T: { str: 1, hp: 1, agi: 0, tough: 0 } }, inventory: { T: stock() }, attacks: { T: { U: { from: "U", fromName: "tester", roll: 6, zone: "ruins", ts: now - 2000, wpn: "custom", wdmg: 12 } } } });
  const KEY = "U_w1_1";
  const C = [
    // ---- ผู้โจมตี: บันทึกโจมตีที่แนบ wfx
    ["มนุษย์→ซอมบี้ เลือดไหล ตรงกับอาวุธ", seed(), atk(BL), true, true],
    ["ไม่แนบ wfx (โจมตีปกติด้วยอาวุธ custom)", seed(), atk(null), true, true],
    ["wfx โอกาสไม่ตรงกับอาวุธ (36 ≠ 35)", seed(), atk({ ...BL, p: 36 }), true, false],
    ["wfx ชนิดไม่ตรงกับอาวุธ", seed(), atk({ t: "poison", v: 1, m: 3, p: 35 }), true, false],
    ["wfx ความแรง 5 (เกินเพดาน 3) แม้ตรงกับอาวุธ", seed({ item: wpn({ t: "bleed", v: 5, m: 3, p: 35 }) }), atk({ t: "bleed", v: 5, m: 3, p: 35 }), true, false],
    ["wfx นาที 5 (สูงสุด)", seed({ item: wpn({ t: "bleed", v: 3, m: 5, p: 25 }) }), atk({ t: "bleed", v: 3, m: 5, p: 25 }), true, true],
    ["wfx นาที 6 (เกิน 5)", seed({ item: wpn({ t: "bleed", v: 1, m: 6, p: 35 }) }), atk({ t: "bleed", v: 1, m: 6, p: 35 }), true, false],
    ["wfx โอกาส 101%", seed({ item: wpn({ t: "bleed", v: 1, m: 3, p: 101 }) }), atk({ t: "bleed", v: 1, m: 3, p: 101 }), true, false],
    ["wfx ชนิดที่ไม่มี (hot)", seed({ item: wpn({ t: "hot", v: 1, m: 3, p: 35 }) }), atk({ t: "hot", v: 1, m: 3, p: 35 }), true, false],
    ["มึนงง นาที 1 โอกาส 10", seed({ item: wpn({ t: "stun", v: 1, m: 1, p: 10 }) }), atk({ t: "stun", v: 1, m: 1, p: 10 }), true, true],
    ["ทอย −1 นาที 3 โอกาส 20", seed({ item: wpn({ t: "dice", v: -1, m: 3, p: 20 }) }), atk({ t: "dice", v: -1, m: 3, p: 20 }), true, true],
    ["พิษแรง 3", seed({ item: wpn({ t: "poison", v: 3, m: 3, p: 25 }) }), atk({ t: "poison", v: 3, m: 3, p: 25 }), true, true],
    ["ผู้โจมตีเป็นซอมบี้ แนบ wfx", seed({ uf: "zombie" }), atk(BL), true, false],
    ["เป้าหมายเป็นมนุษย์ แนบ wfx (ไม่ให้ติดกับมนุษย์)", seed({ tf: "human" }), atk(BL), true, false],
    ["อาวุธที่ถือไม่มี fx แต่แนบ wfx", seed({ item: wpn(null) }), atk(BL), true, false],
    ["ถืออาวุธธรรมดา (knife) แนบ wfx", seed({ ux: { equipped: "w2" }, extra: { config: { weaponDmg: { knife: 12 } } } }), () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "ruins", ts: SV, wpn: "knife", wdmg: 13, wfx: BL }, "users/U/lastAttack": SV }), true, false],
    ["โจมตีด้วย knife ปกติ (ไม่มี wfx)", seed({ ux: { equipped: "w2" }, extra: { config: { weaponDmg: { knife: 12 } } } }), () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "ruins", ts: SV, wpn: "knife", wdmg: 13 }, "users/U/lastAttack": SV }), true, true],
    ["wfx ขาดช่อง (ไม่มี p)", seed(), atk({ t: "bleed", v: 1, m: 3 }), true, false],
    // ---- ผู้ถูกโจมตี: รับสถานะ (กิ่ง effects เดิม ต้องไม่เปลี่ยน)
    ["รับเลือดไหล v1 3 นาที", defSeed(), take("bleed", 1, 3), true, true],
    ["รับเลือดไหล v3 3 นาที", defSeed(), take("bleed", 3, 3), true, true],
    ["รับเลือดไหล v3 5 นาที", defSeed(), take("bleed", 3, 5), true, true],
    ["รับเลือดไหล v3 6 นาที (เกิน)", defSeed(), take("bleed", 3, 6), false, false],
    ["รับเลือดไหล v4 (เกิน)", defSeed(), take("bleed", 4, 3), false, false],
    ["รับพิษ v2 3 นาที", defSeed(), take("poison", 2, 3), true, true],
    ["รับมึนงง 1 นาที", defSeed(), take("stun", 1, 1), true, true],
    ["รับมึนงง 2 นาที (เกิน)", defSeed(), take("stun", 1, 2), false, false],
    ["รับทอย −1 3 นาที", defSeed(), take("dice", -1, 3), true, true],
    ["รับทอย −3 (เกิน)", defSeed(), take("dice", -3, 3), false, false],
    ["รับทอย +1 (เป็นบัฟ ไม่ได้)", defSeed(), take("dice", 1, 3), false, false],
    // ---- ทิ้ง/เก็บอาวุธที่มี fx ต้องผ่านเหมือนเดิม
    ["ทิ้งอาวุธติดสถานะลงพื้น", seed(), () => ({ [`zoneItems/ruins/${KEY}`]: { id: "custom", qty: 1, src: "w1", dur: 20, maxDur: 20, name: "อาวุธทดสอบ", dmg: 11, type: "weapon", icon: "🔪", fx: BL }, "inventory/U/w1": null, "users/U/equipped": null }), true, true],
    ["เก็บอาวุธติดสถานะจากพื้น", { ...seed({ item: null }), zoneItems: { ruins: { [KEY]: { id: "custom", qty: 1, src: "w1", dur: 20, maxDur: 20, name: "อาวุธทดสอบ", dmg: 11, type: "weapon", icon: "🔪", fx: BL } } } }, () => ({ [`zoneItems/ruins/${KEY}`]: null, [`inventory/U/g_${KEY}`]: { id: "custom", qty: 1, dur: 20, name: "อาวุธทดสอบ", dmg: 11, maxDur: 20, type: "weapon", icon: "🔪", fx: BL, src: KEY } }), true, true]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, sd, w] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(sd)));
      const uid = name.startsWith("รับ") ? "T" : "U", db = env.authenticatedContext(uid, { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("FXW RULES OK (" + C.length + " cases, rules " + (R.nw.length - R.old.length >= 0 ? "+" : "") + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
