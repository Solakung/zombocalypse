process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP, UID = "u1";
const R = { old: fs.readFileSync("rules_old.json", "utf8"), nw: fs.readFileSync("rules_new.json", "utf8") }; let cur = "old";
const setRules = async (k) => { if (cur === k) return; const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("put " + r.status); cur = k; };
const user = (o = {}) => ({ username: "tester", faction: "zombie", role: "player", banned: false, zone: "safe", stamina: 100, staminaTs: Date.now(), hp: 100, food: 100, water: 100, foodTs: Date.now(), waterTs: Date.now(), ...o });
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const c = env.authenticatedContext(UID, { firebase: { sign_in_provider: "password" } }).database();
  const smash = async (rules, mf, claimed) => { await setRules(rules); await adb.ref().set({ users: { [UID]: user(mf ? { mf } : {}) }, inventory: mf ? { [UID]: { [mf]: { id: mf, qty: 1 } } } : null, wall: { safe: { hp: 500, ts: Date.now() - 1000 } } });
    const wk = Math.floor((Date.now() - 320400000) / 604800000); const u = { "wall/safe": { hp: 500 - 10 - claimed, ts: SV }, [`users/${UID}/lastSmash`]: SV, [`users/${UID}/stamina`]: 85, [`users/${UID}/staminaTs`]: SV, [`wallHit/${UID}`]: { n: 1, ts: SV, name: "tester" }, [`wallWeek/${UID}`]: { wk, n: 1, name: "tester", ts: SV } };
    try { await c.ref().update(u); return true; } catch { return false; } };
  const bonus = { null: 0, mut_fang1: 3, mut_fang2: 6, mut_fang3: 5, mut_fang4: 4, mut_fang5: 9, mut_fang6: 6 };
  console.log("calibration old no-fang claim 0:", await smash("old", null, 0));
  let bad = 0;
  for (const [id, b] of Object.entries(bonus)) { const mf = id === "null" ? null : id;
    const o = await smash("old", mf, b), nw = await smash("nw", mf, b), over = await smash("nw", mf, b + 3);
    const known = ["null", "mut_fang1", "mut_fang2"].includes(id);
    console.log(id.padEnd(10), "claim", b, "| old:", o, "new:", nw, "| new claim+3 (must be false):", over);
    if (over !== false) bad++; if (!nw) bad++; if (known && !o) bad++; }
  await env.cleanup(); process.exit(bad ? 1 : 0);
})();
