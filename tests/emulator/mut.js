process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=mu" });
const db = admin.database(); const M = require(F + "mutate"), A = require(F + "ability"), P = require(F + "profile");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
(async () => {
  const z = (n, extra = {}) => ({ username: n, faction: "zombie", hp: 80, zone: "ruins", ...extra });
  await db.ref().set({ users: { g: z("g"), h: z("h"), s: z("s"), lo: z("lo"), hm: { username: "hm", faction: "human", hp: 50 }, dead: z("dead", { hp: 0 }) },
    evo: { g: { dna: 300, sp: 34, line: "giant", h: 0, g: 4, s: 0 }, h: { dna: 30, sp: 34, line: "hunter", h: 4, g: 0, s: 0 }, s: { dna: 500, sp: 34, line: "shade", h: 0, g: 0, s: 4 }, lo: { dna: 500, sp: 9, line: "giant", h: 0, g: 2, s: 0 }, dead: { dna: 500, sp: 34, line: "giant", g: 4, h: 0, s: 0 } } });
  const mu = M.makeMutate(db); let r;
  r = await mu.run("hm", { a: "state" }, T0); assert(!r.zom); await rej(mu.run(null, {}, T0), "ล็อกอิน");
  await rej(mu.run("lo", { a: "buy" }, T0), "ขั้น 4"); r = await mu.run("lo", { a: "state" }, T0); assert(r.zom && !r.line && !r.next);
  await rej(mu.run("dead", { a: "buy" }, T0), "ชีวิต"); await rej(mu.run("g", { a: "zzz" }, T0), "ไม่รู้จัก");
  r = await mu.run("g", { a: "state" }, T0); assert(r.line === "giant" && r.m === 0 && r.next.cost === 25 && r.abilL === 4 && r.dna === 300);
  r = await mu.run("g", { a: "buy" }, T0); assert(r.m === 1 && r.dna === 275 && r.abilL === 5 && Math.abs(r.pass.cut - 0.01) < 1e-9 && r.bought === "เกราะซ้อนเกราะ");
  assert.strictEqual((await db.ref("evo/g/dna").get()).val(), 275); assert.strictEqual((await db.ref("mut/g/g").get()).val(), 1);
  for (let i = 0; i < 3; i++) r = await mu.run("g", { a: "buy" }, T0); assert(r.m === 4 && !r.next && r.abilL === 8 && Math.abs(r.pass.cut - 0.04) < 1e-9); assert.strictEqual((await db.ref("evo/g/dna").get()).val(), 300 - 215);
  await rej(mu.run("g", { a: "buy" }, T0), "สูงสุด");
  // DNA ไม่พอ / กดซ้อน
  r = await mu.run("h", { a: "buy" }, T0); assert.strictEqual(r.dna, 5); await rej(mu.run("h", { a: "buy" }, T0), "DNA ไม่พอ"); assert.strictEqual((await db.ref("evo/h/dna").get()).val(), 5);
  await db.ref("evo/s/dna").set(40); const rs = await Promise.allSettled([1, 2, 3].map(() => mu.run("s", { a: "buy" }, T0))); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, "double spend blocked"); assert.strictEqual((await db.ref("evo/s/dna").get()).val(), 15); assert.strictEqual((await db.ref("mut/s/s").get()).val(), 1);
  // ความสามารถเห็นขั้นมิวเตชัน (L = 4 + m, ผลครึ่งหนึ่งหลังขั้น 4)
  const ab = A.makeAbility(db); await db.ref("inventory/g/rotten_meat").set({ id: "rotten_meat", qty: 5 });
  r = await ab.run("g", { a: "state" }, T0); assert.strictEqual(r.L, 8); assert.strictEqual(r.dur, 8 + 2 * 6); r = await ab.run("g", { a: "use" }, T0); assert(Math.abs(r.live.eff.cut - 0.05 * 6) < 1e-9, "Le(8)=6"); assert(r.cdLeft === (100 - 60) * 60000);
  await db.ref("inventory/lo/rotten_meat").set({ id: "rotten_meat", qty: 5 }); r = await ab.run("lo", { a: "state" }, T0); assert.strictEqual(r.L, 2);
  // รีเซ็ตวิวัฒนาการ → มิวเตชันไม่ทำงานจนกว่าจะถึงขั้น 4 อีก
  await db.ref("evo/g").update({ g: 2 }); r = await mu.run("g", { a: "state" }, T0); assert(!r.line); r = await ab.run("g", { a: "state" }, T0 + 99 * 3600000); assert.strictEqual(r.L, 2);
  // ฉายา
  assert(P.TITLES.find((t) => t[0] === "ti_mut_g")); console.log("MUT ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
