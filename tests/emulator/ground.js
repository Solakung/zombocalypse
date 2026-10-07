// 🧹 เคลียร์ของบนพื้น (functions/ground.js): จดเวลาเห็นครั้งแรก → ลบเมื่อครบ TTL, ไม่แตะม้วนสกิล/ของ GM, กันกวาดถี่, ปรับ/ปิดด้วย tune
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=ground" });
const db = admin.database(); const G = require(F + "functions/ground"), gr = G.makeGround(db);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 8, 3), H = 3600000, M = 60000;
const items = () => ({ u1_s1_3: { id: "scrap", qty: 1, src: "s1" }, u2_w_1: { id: "knife", qty: 1, src: "w", dur: 5 }, "-Nabc": { id: "scrap", qty: 1 }, "-Nskill": { id: "skill", qty: 1, name: "x", icon: "x", kind: "pve", type: "dodge", power: 0, cd: 60, uses: 1 } });
const set = (x = {}) => db.ref().set({ users: { a: { username: "a", faction: "human", role: "player", zone: "forest" }, b: { username: "b", banned: true } }, zoneItems: { forest: items() }, ...x });
(async () => {
  let r; await set();
  await rej(gr.run(null, { zone: "forest" }, T0), "ล็อกอิน"); await rej(gr.run("a", { zone: "Forest!" }, T0), "ไม่รู้จักโซน"); await rej(gr.run("a", { zone: "forest", a: "x" }, T0), "ไม่รู้จักคำสั่ง"); await rej(gr.run("b", { zone: "forest" }, T0), "ใช้งานไม่ได้");
  // รอบแรก: จดเวลาเห็นครั้งแรกเฉพาะของผู้เล่น (มี src) • ยังไม่ลบอะไร
  r = await gr.run("a", { zone: "forest" }, T0); assert.deepStrictEqual({ swept: r.swept, removed: r.removed, tracked: r.tracked, ttl: r.ttl }, { swept: true, removed: 0, tracked: 2, ttl: 6 });
  assert.deepStrictEqual(Object.keys((await db.ref("zitemAge/forest").get()).val()).sort(), ["u1_s1_3", "u2_w_1"]);
  // กวาดถี่ไป (<10 นาที) ไม่ทำอะไร
  r = await gr.run("a", { zone: "forest" }, T0 + 5 * M); assert.strictEqual(r.swept, false);
  // 5 ชม. ยังไม่ครบ 6 ชม. • ครบแล้วลบเฉพาะของผู้เล่น ม้วนสกิล/ของ GM อยู่ครบ
  r = await gr.run("a", { zone: "forest" }, T0 + 5 * H); assert.strictEqual(r.removed, 0); assert.strictEqual(Object.keys((await db.ref("zoneItems/forest").get()).val()).length, 4);
  r = await gr.run("a", { zone: "forest" }, T0 + 6 * H + 1 * M); assert.strictEqual(r.removed, 2); assert.deepStrictEqual(Object.keys((await db.ref("zoneItems/forest").get()).val()).sort(), ["-Nabc", "-Nskill"]); assert.strictEqual((await db.ref("zitemAge/forest").get()).val(), null);
  // ของที่ถูกเก็บไปก่อนครบเวลา: เลิกจำ • ของที่วางใหม่ (ลายเซ็นต่าง) เริ่มนับใหม่
  await set(); await gr.run("a", { zone: "forest" }, T0); await db.ref("zoneItems/forest/u1_s1_3").remove(); await db.ref("zoneItems/forest/u2_w_1").set({ id: "knife", qty: 1, src: "w", dur: 3 });
  r = await gr.run("a", { zone: "forest" }, T0 + 6 * H + 20 * M); assert.strictEqual(r.removed, 0); assert.strictEqual(r.tracked, 1); const ag = (await db.ref("zitemAge/forest").get()).val(); assert.deepStrictEqual(Object.keys(ag), ["u2_w_1"]); assert.strictEqual(ag.u2_w_1.t, T0 + 6 * H + 20 * M);
  // tune: ปรับ TTL / ปิด
  await set({ tune: { ground_ttl_h: 1 } }); await gr.run("a", { zone: "forest" }, T0); r = await gr.run("a", { zone: "forest" }, T0 + 2 * H); assert.strictEqual(r.removed, 2); assert.strictEqual(r.ttl, 1);
  await set({ tune: { ground_ttl_h: 0 } }); r = await gr.run("a", { zone: "forest" }, T0 + 99 * H); assert.deepStrictEqual(r, { ok: true, on: false }); assert.strictEqual(Object.keys((await db.ref("zoneItems/forest").get()).val()).length, 4);
  // แต่ละโซนกวาดแยกกัน
  await set({ zoneItems: { forest: items(), ruins: { r1_s_1: { id: "scrap", qty: 1, src: "s" } } } }); await gr.run("a", { zone: "forest" }, T0); r = await gr.run("a", { zone: "ruins" }, T0 + M); assert.strictEqual(r.swept, true); assert.strictEqual(r.tracked, 1);
  console.log("ground OK"); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
