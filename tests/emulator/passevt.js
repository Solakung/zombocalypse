process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/";
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=pe" });
const db = admin.database();
const { makePass, POOL, TIER_REW } = require(F + "pass");
const { makeEvents, E } = require(F + "events");
const assert = require("assert");
const P = makePass(db), V = makeEvents(db);
const NOW = Date.UTC(2026, 8, 7, 3, 0, 0);   // จันทร์ 7 ก.ย. 10:00 เวลาไทย
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
(async () => {
  await db.ref().set({ users: { u1: { username: "a", faction: "human", hp: 60, zone: "ruins" }, z1: { username: "z", faction: "zombie", hp: 50, zone: "forest" }, s1: { username: "s", faction: "human", hp: 80, zone: "safe" }, bn: { username: "b", banned: true, faction: "human" } } });
  // ---------- PASS ----------
  let r = await P.run("u1", { a: "sync" }, NOW);
  assert(r.d.length === 3 && r.w.length === 4 && r.xp === 0 && r.rew.length === 30);
  assert(new Set(r.d.map((m) => POOL[m.id].k)).size === 3, "distinct keys");
  assert(r.d.every((m) => !POOL[m.id].f || POOL[m.id].f === "h"), "faction filter");
  const r2 = await P.run("u1", { a: "sync" }, NOW + 60000);
  assert.deepStrictEqual(r2.d.map((m) => m.id), r.d.map((m) => m.id), "stable within day");
  await rej(P.run("u1", { a: "claimMission", p: "d", id: r.d[0].id }, NOW), "ยังไม่สำเร็จ");
  // progress via counters
  const c = {}; r.d.concat(r.w).forEach((m) => { c[POOL[m.id].k] = (c[POOL[m.id].k] || 0) + POOL[m.id].n; });
  await db.ref("ach/u1/c").set(c);
  r = await P.run("u1", { a: "sync" }, NOW + 120000);
  assert(r.d.every((m) => m.done) && r.w.every((m) => m.done), "done");
  for (const m of r.d) await P.run("u1", { a: "claimMission", p: "d", id: m.id }, NOW + 130000);
  await rej(P.run("u1", { a: "claimMission", p: "d", id: r.d[0].id }, NOW), "รับไปแล้ว");
  await rej(P.run("u1", { a: "claimMission", p: "d", id: "d_enc_x" }, NOW), "ไม่มีภารกิจ");
  r = await P.run("u1", { a: "sync" }, NOW + 140000);
  assert.strictEqual(r.xp, 75, "xp daily 3x25");
  for (const m of r.w) await P.run("u1", { a: "claimMission", p: "w", id: m.id }, NOW + 150000);
  r = await P.run("u1", { a: "sync" }, NOW + 160000);
  assert.strictEqual(r.xp, 75 + 4 * 80);
  // tiers
  await rej(P.run("u1", { a: "claimTier", t: 4 }, NOW), "XP ยังไม่ถึง");
  const t1 = await P.run("u1", { a: "claimTier", t: 1 }, NOW + 170000);
  assert.deepStrictEqual(t1.rewarded, [["water", 2]]);
  await rej(P.run("u1", { a: "claimTier", t: 1 }, NOW), "รับไปแล้ว");
  await P.run("u1", { a: "claimTier", t: 3 }, NOW + 170000);
  assert.strictEqual((await db.ref("inventory/u1/water").get()).val().qty, 2);
  assert.strictEqual((await db.ref("inventory/u1/water_jug").get()).val().qty, 1);   // ซีซัน 0 (ฝน) ระดับ 3 = น้ำแกลลอน
  await db.ref("pass/u1/xp").set(500);
  // inventory full → reject without consuming the claim
  await db.ref("inventory/u1/scrap").set({ id: "scrap", qty: 98 });
  await rej(P.run("u1", { a: "claimTier", t: 4 }, NOW), "เต็ม");
  assert.strictEqual((await db.ref("pass/u1/tc/4").get()).val(), null, "tier 4 not marked after failure");
  await db.ref("inventory/u1/scrap").set({ id: "scrap", qty: 90 });
  await P.run("u1", { a: "claimTier", t: 4 }, NOW);
  assert.strictEqual((await db.ref("inventory/u1/scrap").get()).val().qty, 95);
  // next day → new daily, weekly same; counters since baseline only
  const D2 = NOW + 86400000;
  let r3 = await P.run("u1", { a: "sync" }, D2);
  assert(r3.d.every((m) => !m.done && !m.got) && r3.w.every((m) => m.done), "new day resets daily, weekly stays");
  // next season → xp reset
  const S2 = NOW + 28 * 86400000;
  let r4 = await P.run("u1", { a: "sync" }, S2);
  assert.strictEqual(r4.xp, 0); assert.deepStrictEqual(r4.tc, {});
  // zombie
  const rz = await P.run("z1", { a: "sync" }, NOW);
  assert(rz.d.every((m) => !POOL[m.id].f || POOL[m.id].f === "z") && rz.rew[0][0][0] === "water");
  await db.ref("pass/z1/xp").set(1000);
  const tz = await P.run("z1", { a: "claimTier", t: 2 }, NOW);
  assert.deepStrictEqual(tz.rewarded, [["rotten_meat", 3]]);
  await rej(P.run("bn", { a: "sync" }, NOW), "ใช้งานไม่ได้");
  await rej(P.run(null, { a: "sync" }, NOW), "ล็อกอิน");
  // concurrent double claim
  await db.ref("pass/u1/xp").set(3000); await db.ref("pass/u1/tc").set({});
  const rs = await Promise.allSettled([1, 2, 3].map(() => P.run("u1", { a: "claimTier", t: 10 }, S2 + 1000)));
  assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, "only one claim wins");
  console.log("PASS ok");

  // ---------- EVENTS ----------
  // ตรวจทุกเหตุการณ์/ตัวเลือก/ผลลัพธ์ผ่าน run จริง
  const rnd = Math.random; let stub = 0; Math.random = () => stub;
  const roll = async (uid, now) => V.run(uid, { a: "roll" }, now);
  let T0 = NOW;
  stub = 0.5; assert.strictEqual((await roll("u1", T0)).enc, null, "no encounter at 0.5");
  stub = 0.0; assert.strictEqual((await roll("u1", T0 + 1000)).enc, null, "ROLL_GAP");
  const e1 = await roll("u1", T0 + 20000); assert(e1.enc && e1.enc.o.length >= 2, "forced encounter");
  const pk = await V.run("u1", { a: "peek" }, T0 + 21000); assert.strictEqual(pk.enc.id, e1.enc.id);
  await rej(V.run("s1", { a: "choose", i: 0 }, T0), "หมดเวลา");
  assert.strictEqual((await roll("s1", T0 + 30000)).enc, null, "safe zone none");
  await rej(V.run("u1", { a: "choose", i: 99 }, T0 + 22000), "ไม่ถูกต้อง");
  // ครบทุกผลลัพธ์: บังคับ encounter ทีละอัน/ตัวเลือก/ผล
  let cnt = 0;
  for (const e of E) for (const fac of ["u1", "z1"]) {
    const p = (await db.ref("users/" + fac).get()).val();
    if ((e.f && e.f !== (p.faction === "zombie" ? "z" : "h")) || (e.z && !e.z.includes(p.zone))) continue;
    for (let oi = 0; oi < e.o.length; oi++) {
      const o = e.o[oi]; if (o.f && o.f !== (p.faction === "zombie" ? "z" : "h")) continue;
      for (let ri = 0; ri < o.r.length; ri++) {
        await db.ref(`enc/${fac}`).set({ id: e.id, ts: T0 + 100000, dk: 1, n: 0 });
        await db.ref(`users/${fac}/hp`).set(60);
        if (o.need) await db.ref(`inventory/${fac}/${o.need[0]}`).set({ id: o.need[0], qty: 5 });
        const wsum = o.r.reduce((s, x) => s + x.w, 0); let acc = 0; for (let k = 0; k < ri; k++) acc += o.r[k].w; stub = (acc + 0.01) / wsum;
        const out = await V.run(fac, { a: "choose", i: oi }, T0 + 100500);
        assert.strictEqual(out.x, o.r[ri].x, e.id);
        const hp = (await db.ref(`users/${fac}/hp`).get()).val();
        const exp = o.r[ri].hp ? (o.r[ri].hp < 0 ? Math.max(1, 60 + o.r[ri].hp) : 60 + o.r[ri].hp) : 60; assert.strictEqual(hp, exp, e.id + " hp");
        if (o.need) assert.strictEqual((await db.ref(`inventory/${fac}/${o.need[0]}`).get()).val()?.qty ?? 0, 5 - o.need[1] + (out.got.filter((g) => g[0] === o.need[0]).reduce((s, g) => s + g[1], 0)), e.id + " need");
        assert.strictEqual((await db.ref(`enc/${fac}/id`).get()).val(), null, "pending cleared");
        cnt++;
      }
    }
  }
  console.log("EVENTS outcomes exercised:", cnt);
  // need-not-met, cooldown, daily cap, never kills, heal cap, expiry
  await db.ref("enc/u1").set({ id: "wounded", ts: T0 + 200000, dk: 1, n: 0 }); await db.ref("inventory/u1/bandage").remove();
  await rej(V.run("u1", { a: "choose", i: 0 }, T0 + 200100), "ของไม่พอ");
  assert((await V.run("u1", { a: "peek" }, T0 + 200200)).enc, "pending kept after failed need");
  await db.ref("enc/u1").set({ id: "wounded", ts: T0 + 200000 });
  assert.strictEqual((await V.run("u1", { a: "peek" }, T0 + 200000 + 31 * 60000)).enc, null, "expired");
  await db.ref("users/u1/hp").set(3); await db.ref("enc/u1").set({ id: "ruined_pharmacy", ts: T0 + 300000 });
  stub = 0.99; const k = await V.run("u1", { a: "choose", i: 0 }, T0 + 300100);   // ผลสุดท้าย (hp -6 / medkit)
  assert((await db.ref("users/u1/hp").get()).val() >= 1, "never below 1");
  await db.ref("users/u1/hp").set(98); await db.ref("enc/u1").set({ id: "preacher", ts: T0 + 400000 }); stub = 0.01;
  await V.run("u1", { a: "choose", i: 0 }, T0 + 400100); assert.strictEqual((await db.ref("users/u1/hp").get()).val(), 100, "heal capped at 100");
  // cooldown & day cap
  await db.ref("enc/u1").set({ last: T0 + 500000, rt: 0, dk: 20702, n: 0 }); stub = 0.0;
  assert.strictEqual((await roll("u1", T0 + 500000 + 50000)).enc, null, "cooldown");
  await db.ref("enc/u1").set({ last: 0, rt: 0, dk: Math.floor((T0 + 7 * 3600000 + 700000) / 86400000), n: 30 });
  assert.strictEqual((await roll("u1", T0 + 700000)).enc, null, "daily cap");
  // concurrent choose → one outcome only
  await db.ref("enc/u1").set({ id: "stray_dog", ts: T0 + 800000 }); stub = 0.01;
  const cs = await Promise.allSettled([0, 1, 2].map((i) => V.run("u1", { a: "choose", i: 1 }, T0 + 800100)));
  assert.strictEqual(cs.filter((x) => x.status === "fulfilled").length, 1, "one choose wins");
  Math.random = rnd;
  console.log("locks left:", JSON.stringify((await db.ref("locks").get()).val()));
  console.log("ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
