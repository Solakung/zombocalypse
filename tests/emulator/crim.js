// 🟠 สถานะส้ม (functions/crim.js): เปิด/ปิดด้วย tune, เงื่อนไขการรายงาน (ฝ่ายเดียวกัน/โซน/ผู้ถูกฆ่า HP=0/โจมตีล่าสุด/สู้กันเอง/ฆ่าคนส้ม/ซ้ำ), ระยะเวลาสะสม, ค่าประกันวัตถุดิบ
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=crim" });
const db = admin.database(); const C = require(F + "functions/crim"), cr = C.makeCrim(db);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), M = 60000;
(async () => {
  // รหัสวัตถุดิบประกันต้องอยู่ใน ITEMS ของเกม + whitelist กระเป๋า
  const sc = fs.readFileSync(F + "script.js", "utf8"), rules = JSON.parse(fs.readFileSync(F + "database_rules.json", "utf8")).rules, rx = new RegExp(rules.inventory.$uid.$slot[".validate"].match(/matches\(\/(\^\([^/]+\)\$)\//)[1]);
  for (const [id] of C.BAIL_VAL) { assert(new RegExp("^  " + id + ": \\{", "m").test(sc), "ITEMS " + id); assert(rx.test(id), "rules regex " + id); }
  const u = (n, f, x = {}) => ({ username: n, faction: f, role: "player", hp: 100, zone: "forest", ...x });
  const base = (extra = {}) => ({ users: { a: u("a", "human", { lastAttack: T0 - 10000 }), v: u("v", "human", { hp: 0 }), z: u("z", "zombie", { lastAttack: T0 - 10000 }), gm: u("gm", "human", { role: "gm", lastAttack: T0 - 10000 }) }, tune: { crim_on: 1 }, ...extra });
  const set = (extra) => db.ref().set(base(extra));
  let r;
  // ---- ปิดอยู่ (ค่าเริ่มต้น) = ไม่ติดส้ม แต่ state ใช้ได้
  await set({ tune: null }); r = await cr.run("v", { a: "report", role: "victim", other: "a" }, T0); assert.deepStrictEqual(r, { ok: true, on: false }); assert.strictEqual((await db.ref("crim/a").get()).val(), null);
  assert.strictEqual((await cr.run("a", { a: "state" }, T0)).on, false);
  await rej(cr.run(null, { a: "state" }, T0), "ล็อกอิน"); await rej(cr.run("a", { a: "zz" }, T0), "ไม่รู้จัก");
  // ---- รายงานโดยผู้ถูกฆ่า
  await set(); r = await cr.run("v", { a: "report", role: "victim", other: "a" }, T0); assert.strictEqual(r.flagged, true); assert.strictEqual(r.n, 1); assert.strictEqual(r.until, T0 + 45 * M);
  assert.deepStrictEqual((await db.ref("crim/a").get()).val(), { until: T0 + 45 * M, n: 1, ts: T0 });
  // ซ้ำภายใน 2 นาทีนับครั้งเดียว (ผู้ฆ่ารายงานซ้ำอีกทาง)
  r = await cr.run("a", { a: "report", role: "attacker", other: "v" }, T0 + 30000); assert.strictEqual(r.flagged, false); assert.strictEqual(r.why, "dup"); assert.strictEqual((await db.ref("crim/a/n").get()).val(), 1);
  // ---- เงื่อนไข (แต่ละข้อไม่ติด)
  const no = async (why, extra, role = "victim", other = "a", who) => { await set(extra); const rr = await cr.run(who || (role === "victim" ? "v" : other), { a: "report", role, other: role === "victim" ? other : "v" }, T0); assert.strictEqual(rr.flagged, false, why); assert.strictEqual(rr.why, why); assert.strictEqual((await db.ref("crim/a").get()).val(), null, why); };
  await no("faction", { users: { ...base().users, v: u("v", "zombie", { hp: 0 }) } });
  await no("alive", { users: { ...base().users, v: u("v", "human", { hp: 5 }) } });
  await no("zone", { users: { ...base().users, v: u("v", "human", { hp: 0, zone: "ruins" }) } });
  await no("zone", { users: { ...base().users, a: u("a", "human", { zone: "safe", lastAttack: T0 - 1000 }), v: u("v", "human", { hp: 0, zone: "safe" }) } });   // Safe Zone (กำแพงพัง) ไม่นับ
  await no("stale", { users: { ...base().users, a: u("a", "human", { lastAttack: T0 - 100000 }) } });
  await no("mutual", { users: { ...base().users, v: u("v", "human", { hp: 0, lastAttack: T0 - 60000 }) } });
  await no("victim-orange", { crim: { v: { until: T0 + 10 * M, n: 1, ts: T0 } } });
  await no("role", { users: { ...base().users, a: u("a", "human", { role: "gm", lastAttack: T0 - 1000 }) } });
  await no("user", { users: { ...base().users, a: u("a", "human", { banned: true, lastAttack: T0 - 1000 }) } });
  await rej(cr.run("v", { a: "report", role: "victim", other: "v" }, T0), "ข้อมูลไม่ถูกต้อง"); await rej(cr.run("v", { a: "report", role: "victim", other: "" }, T0), "ข้อมูลไม่ถูกต้อง"); await rej(cr.run("v", { a: "report", role: "victim", other: "../x" }, T0), "ข้อมูลไม่ถูกต้อง");
  // ซอมบี้ฆ่าซอมบี้ก็นับ / เป้า HP=0 ทอยพ้น "สู้กันเอง" เมื่อเกิน 3 นาที
  await set({ users: { ...base().users, v: u("v", "zombie", { hp: 0, lastAttack: T0 - 200000 }) } }); r = await cr.run("v", { a: "report", role: "victim", other: "z" }, T0); assert.strictEqual(r.flagged, true);
  // ผู้ฆ่ารายงานเอง (ฆ่าตอนเป้าไม่ทันตั้งตัว — ผู้ฆ่าเป็นฝ่ายเขียน HP เป้า)
  await set(); r = await cr.run("a", { a: "report", role: "attacker", other: "v" }, T0); assert.strictEqual(r.flagged, true);
  // ---- โทษสะสม: ครั้งที่ 2 = 90 นาที, 3 = 135, 4 = 180, 5 = ยังเพดาน 180 • ห่างเกิน 24 ชม. → เริ่มใหม่ที่ครั้งที่ 1
  let t = T0; const dur = [];
  for (let i = 0; i < 5; i++) { t += 5 * M; await db.ref("users/v").update({ hp: 0, lastAttack: null }); await db.ref("users/a/lastAttack").set(t - 1000); r = await cr.run("v", { a: "report", role: "victim", other: "a" }, t); assert.strictEqual(r.flagged, true); dur.push((r.until - t) / M); }
  assert.deepStrictEqual(dur, [90, 135, 180, 180, 180]);   // ครั้งแรกของลูปคือครั้งที่ 2 (มีครั้งก่อนหน้าจากเทสต์ผู้ฆ่ารายงานเอง)
  t += 25 * 3600000; await db.ref("users/v").update({ hp: 0, lastAttack: null }); await db.ref("users/a/lastAttack").set(t - 1000); r = await cr.run("v", { a: "report", role: "victim", other: "a" }, t); assert.strictEqual(r.n, 1); assert.strictEqual((r.until - t) / M, 45);
  // ---- state
  r = await cr.run("a", { a: "state" }, t + M); assert.deepStrictEqual({ on: r.on, active: r.active, n: r.n, bailPts: r.bailPts }, { on: true, active: true, n: 1, bailPts: 20 });
  r = await cr.run("a", { a: "state" }, t + 46 * M); assert.strictEqual(r.active, false);
  // ---- ค่าประกัน: n=1 → 20 แต้ม เก็บจากถูกไปแพง (เศษเหล็ก 1 / ตะปู 1 / เคมี 2 / เศษหนัง 2 / เทปกาว 3)
  await rej(cr.run("v", { a: "bail" }, t), "ไม่ได้เป็นส้ม");
  await db.ref("inventory/a").set({ scrap: { id: "scrap", qty: 8 }, rusty_nails: { id: "rusty_nails", qty: 2 }, chem: { id: "chem", qty: 3 }, duct_tape: { id: "duct_tape", qty: 5 }, canned_food: { id: "canned_food", qty: 9 } });
  r = await cr.run("a", { a: "bail" }, t + 2 * M); assert.strictEqual(r.pts, 20);
  // 8 + 2 + chem 3×2=6 → 16 ; เหลือ 4 → เทปกาว 2 ชิ้น (6) รวม 22 ≥ 20
  assert.deepStrictEqual(r.paid, [{ id: "scrap", qty: 8 }, { id: "rusty_nails", qty: 2 }, { id: "chem", qty: 3 }, { id: "duct_tape", qty: 2 }]);
  const inv = (await db.ref("inventory/a").get()).val(); assert.strictEqual(inv.scrap, undefined); assert.strictEqual(inv.duct_tape.qty, 3); assert.strictEqual(inv.canned_food.qty, 9);
  const c = (await db.ref("crim/a").get()).val(); assert(c.until <= t + 2 * M && c.n === 1, "ปลดส้มแล้ว n ยังอยู่");
  await rej(cr.run("a", { a: "bail" }, t + 3 * M), "ไม่ได้เป็นส้ม");
  // ไม่พอ → ไม่หักอะไรเลย
  await db.ref("crim/a").set({ until: t + 100 * M, n: 2, ts: t }); await db.ref("inventory/a").set({ scrap: { id: "scrap", qty: 10 } });   // ต้อง 40 แต้ม
  await rej(cr.run("a", { a: "bail" }, t + 4 * M), "วัตถุดิบไม่พอ"); assert.strictEqual((await db.ref("inventory/a/scrap/qty").get()).val(), 10); assert((await db.ref("crim/a/until").get()).val() > t + 4 * M);
  await db.ref("tune/crim_bail").set(5); r = await cr.run("a", { a: "state" }, t + 4 * M); assert.strictEqual(r.bailPts, 10);   // tune ปรับค่าประกันได้
  await db.ref("tune/crim_min").set(10); await db.ref("crim").remove(); await set({ tune: { crim_on: 1, crim_min: 10 } }); r = await cr.run("v", { a: "report", role: "victim", other: "a" }, T0); assert.strictEqual((r.until - T0) / M, 10);
  console.log("CRIM OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
