process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=zwx" });
const db = admin.database(); const Z = require(F + "zwar");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), wk = Z.wkOf(T0);
(async () => {
  const u = (n, f, zone, extra = {}) => ({ username: n, faction: f, hp: 80, zone, ...extra });
  await db.ref().set({ users: { h: u("h", "human", "forest"), z: u("z", "zombie", "lab"), s: u("s", "human", "safe"), d: u("d", "human", "mall", { hp: 0 }), b: u("b", "human", "mall", { banned: true }), c: u("c", "human", "casino") } });
  const zw = Z.makeZwar(db, admin); let r;
  await rej(zw.run(null, { items: { search: 1 } }, T0), "ล็อกอิน");
  for (const bad of [null, [], {}, { zzz: 1 }, { search: 0 }, { search: 21 }, { search: 1.5 }, { search: "x" }]) await rej(zw.run("h", { items: bad }, T0), "ข้อมูล");
  await rej(zw.run("b", { items: { search: 1 } }, T0), "ใช้งานไม่ได้");
  r = await zw.run("h", { items: { search: 3, boss: 1 } }, T0); assert.strictEqual(r.added, 8); assert.strictEqual(r.key, "zh" + wk + "5");   // ป่าลึก = โซนที่ 5
  assert.strictEqual((await db.ref(`coop/zh${wk}5/h/n`).get()).val(), 8);
  r = await zw.run("z", { items: { zwin: 2 } }, T0); assert.strictEqual(r.key, "zz" + wk + "10"); assert.strictEqual(r.added, 4);
  assert.strictEqual((await zw.run("s", { items: { search: 1 } }, T0)).skip, "zone"); assert.strictEqual((await zw.run("c", { items: { search: 1 } }, T0)).skip, "zone");
  assert.strictEqual((await zw.run("d", { items: { search: 1 } }, T0)).skip, "dead");
  // ถังโทเค็น: 200 แต้ม แล้วจำกัด
  let tot = 8; for (let i = 0; i < 20; i++) { r = await zw.run("h", { items: { boss: 20 } }, T0); tot += r.added; } assert.strictEqual(tot, 200, "burst cap " + tot); assert(r.limited);
  r = await zw.run("h", { items: { search: 20 } }, T0 + 100000); assert.strictEqual(r.added, 10, "refill 1 per 10s");
  await db.ref("tune/zw_on").set(0); assert((await zw.run("h", { items: { search: 1 } }, T0 + 9e6)).off);
  console.log("ZWAR ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
