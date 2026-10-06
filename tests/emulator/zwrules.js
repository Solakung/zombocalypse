// rules: coop/{zh|zz}… ปิดเขียนตรงแล้ว (ต้องผ่านฟังก์ชัน zwAct) • คีย์กลุ่มอื่น (wh/mh/ph…) ยังเขียนได้เหมือนเดิม
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
(async () => {
  const rules = fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8");
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules } });
  await adb.ref().set({ users: { u1: { username: "tester", faction: "human", hp: 80, zone: "forest" } } });
  const db = env.authenticatedContext("u1", { firebase: { sign_in_provider: "password" } }).database(), ok = async (p) => { try { await p; return true; } catch { return false; } };
  const w = (k) => ok(db.ref(`coop/${k}/u1`).set({ n: 5, name: "tester", ts: SV }));
  const res = { zh: await w("zh2951"), zz: await w("zz29510"), wh: await w("wh2951"), mh: await w("mh12345"), ph: await w("ph11"), read: await ok(db.ref("coop/zh2951").get()) };
  console.log(JSON.stringify(res)); assert.deepStrictEqual(res, { zh: false, zz: false, wh: true, mh: true, ph: true, read: true });
  console.log("ZW rules OK"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
