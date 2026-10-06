process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert"); const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=c56" }); const db = admin.database(), A = require(F + "ability");
(async () => {
  await db.ref().set({ users: { a: { username: "a", faction: "human", hp: 50 }, b: { username: "b", faction: "human", hp: 50 } }, ach: { a: { c: { srch: 6000 } }, b: { c: { srch: 15500 } } }, inventory: { a: { scrap: { id: "scrap", qty: 4 } }, b: { scrap: { id: "scrap", qty: 4 } } } });
  const ab = A.makeAbility(db); let r = await ab.run("a", { a: "state" }, 1e12); assert.strictEqual(r.L, 5); assert.strictEqual(r.dur, 17);
  r = await ab.run("a", { a: "use" }, 1e12); assert(Math.abs(r.live.eff.n - (1 - 0.12 * 4.5)) < 1e-9, "n " + r.live.eff.n);
  r = await ab.run("b", { a: "state" }, 1e12); assert.strictEqual(r.L, 6); r = await ab.run("b", { a: "use" }, 1e12); assert(Math.abs(r.live.eff.n - (1 - 0.12 * 5)) < 1e-9); assert(r.live.eff.n > 0.3, "not overpowered");
  console.log("career 5-6 OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
