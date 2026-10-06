// พักแรงต่อเป้าหมายคนเดิม (rules attacks) เฉพาะผู้โจมตีที่เป็นซอมบี้: ตีคนเดิมซ้ำได้ทุก ≥20 วินาที (มนุษย์ไม่ถูกจำกัดต่อคู่) (ตีคนอื่นยังได้ตามพักแรงเดิม 9 วินาที)
// เทียบ rules เก่า (origin/main หรือ OLD_RULES) กับใหม่ — รันด้วย NODE_PATH ที่มี @firebase/rules-unit-testing (ข้อมูลทดสอบมี scrap/chem/canned_food/medkit เหมือนเทสต์ rules อื่น)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show origin/main:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now();
  const user = (name, fac, extra = {}) => ({ username: name, faction: fac, role: "player", banned: false, zone: "ruins", createdAt: now - 864000000, hp: 100, food: 50, foodTs: now, water: 50, waterTs: now, stamina: 50, staminaTs: now, ...extra });
  const world = (att = {}, fac = "zombie") => ({ users: { U: user("att", fac, { lastAttack: now - 20000, ...att }), T: user("tgt", "human"), T2: user("tgt2", "human") } });
  const hit = (tgt, { tgtRec = true, tgtT = "SV", tgtU } = {}) => () => { const u = { [`attacks/${tgt}/U`]: { from: "U", fromName: "att", roll: 4, zone: "ruins", ts: SV }, "users/U/lastAttack": SV }; if (tgtRec) u["users/U/lastTgt"] = { u: tgtU || tgt, t: tgtT === "SV" ? SV : tgtT }; return u; };
  // [ชื่อ, สถานะเริ่ม, เขียนแบบเกมเก่า, เขียนแบบเกมใหม่, ผลเก่าที่คาด, ผลใหม่ที่คาด]
  const C = [
    ["first attack (no history)", world(), hit("T", { tgtRec: false }), hit("T"), true, true],
    ["same target after 15 s (denied)", world({ lastTgt: { u: "T", t: now - 15000 } }), hit("T", { tgtRec: false }), hit("T"), true, false],
    ["same target after 25 s", world({ lastTgt: { u: "T", t: now - 25000 } }), hit("T", { tgtRec: false }), hit("T"), true, true],
    ["same target after 40 s", world({ lastTgt: { u: "T", t: now - 40000 } }), hit("T", { tgtRec: false }), hit("T"), true, true],
    ["other target 12 s after hitting T", world({ lastAttack: now - 12000, lastTgt: { u: "T", t: now - 12000 } }), hit("T2", { tgtRec: false }), hit("T2"), true, true],
    ["attack too soon (<9 s, any target) still denied", world({ lastAttack: now - 4000, lastTgt: { u: "T", t: now - 40000 } }), hit("T", { tgtRec: false }), hit("T"), false, false],
    ["HUMAN same target after 15 s (allowed: no pair limit for humans)", world({ lastTgt: { u: "T", t: now - 15000 } }, "human"), hit("T", { tgtRec: false }), hit("T"), true, true],
    ["cheat: skip lastTgt record (denied)", world(), hit("T", { tgtRec: false }), hit("T", { tgtRec: false }), true, false],
    ["cheat: lastTgt names another user (denied)", world(), hit("T", { tgtRec: false }), hit("T", { tgtU: "T2" }), true, false],
    ["cheat: forged lastTgt time (denied)", world(), hit("T", { tgtRec: false }), hit("T", { tgtT: now - 100000 }), true, false]
  ];
  const res = { old: {}, nw: {} };
  for (const k of ["old", "nw"]) {
    await setRules(k);
    for (const [name, seed, wOld, wNew] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(seed)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update((k === "old" ? wOld : wNew)()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0; for (const [name, , , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0); console.log("PAIR RULES OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
