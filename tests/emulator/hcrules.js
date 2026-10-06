process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
(async () => {
  const R = { old: fs.readFileSync("rules_main.json", "utf8"), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); await adb.ref().set({ users: { u1: { username: "tester", faction: "human", hp: 80, zone: "safe" } }, hc: { state: { found: true, by: "x" } } });
    const db = env.authenticatedContext("u1", { firebase: { sign_in_provider: "password" } }).database(), ok = async (p) => { try { await p; return true; } catch { return false; } };
    res[k] = {
      coopHc1: await ok(db.ref("coop/hc1/u1").set({ n: 5, name: "tester", ts: SV })),
      coopOther: await ok(db.ref("coop/wh1234/u1").set({ n: 5, name: "tester", ts: SV })),
      readState: await ok(db.ref("hc/state").get()), writeState: await ok(db.ref("hc/state/by").set("u1")), readHcOther: await ok(db.ref("hc/rl/u1").get()), readCoop: await ok(db.ref("coop/hc1").get())
    };
  }
  console.log(JSON.stringify(res)); assert.deepStrictEqual(res.nw, { coopHc1: false, coopOther: true, readState: true, writeState: false, readHcOther: false, readCoop: true }); assert.strictEqual(res.old.coopHc1, true, "old rules allowed unauthenticated-of-items write (the hole)"); assert.strictEqual(res.old.coopOther, true);
  console.log("HC rules OK"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
