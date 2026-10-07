// ⛓️ คุก (functions/jail.js): เปิด/ปิด tune, เงื่อนไขการจับ, ชั้นโทษ, ของยึด, ทำงานลดโทษ, จ่ายประกัน, แหกคุก (สำเร็จ/ล้มเหลว), ครบเวลา (ริบของ)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=jail" });
const db = admin.database(); const J = require(F + "functions/jail");
const queue = []; const rnd = () => (queue.length ? queue.shift() : 0.5); const q = (...v) => { queue.length = 0; queue.push(...v); };
const jl = J.makeJail(db, rnd);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), M = 60000;
(async () => {
  // ของทั่วไปที่ยึด/ริบต้องอยู่ใน ITEMS ของเกมและผ่าน whitelist กระเป๋า
  const sc = fs.readFileSync(F + "script.js", "utf8"), rules = JSON.parse(fs.readFileSync(F + "database_rules.json", "utf8")).rules, rx = new RegExp(rules.inventory.$uid.$slot[".validate"].match(/matches\(\/(\^\([^/]+\)\$)\//)[1]);
  for (const id of J.COMMON) { assert(new RegExp("^  " + id + ": \\{", "m").test(sc), "ITEMS " + id); assert(rx.test(id), "regex " + id); }
  const u = (n, f, x = {}) => ({ username: n, faction: f, role: "player", hp: 100, zone: "forest", ...x });
  const OR = { until: T0 + 30 * M, n: 1, ts: T0 };
  const base = (extra = {}) => ({ users: { v: u("v", "human", { hp: 0 }), k: u("k", "human", { lastAttack: T0 - 5000 }), z: u("z", "zombie", { lastAttack: T0 - 5000 }), gm: u("gm", "human", { role: "gm", lastAttack: T0 - 5000 }) }, crim: { v: OR }, inventory: { v: { scrap: { id: "scrap", qty: 6 }, chem: { id: "chem", qty: 4 }, knife: { id: "knife", qty: 1, dur: 20 } }, k: { scrap: { id: "scrap", qty: 1 } } }, tune: { jail_on: 1 }, ...extra });
  const set = (x) => db.ref().set(base(x)); let r;
  // ---- ปิดอยู่ (ค่าเริ่มต้น)
  await set({ tune: null }); r = await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); assert.deepStrictEqual(r, { ok: true, on: false }); assert.strictEqual((await db.ref("jail/v").get()).val(), null);
  assert.strictEqual((await jl.run("v", { a: "state" }, T0)).on, false); await rej(jl.run(null, { a: "state" }, T0), "ล็อกอิน"); await rej(jl.run("v", { a: "zz" }, T0), "ไม่รู้จัก");
  assert.deepStrictEqual(await jl.run("v", { a: "work" }, T0), { ok: true, on: false });
  // ---- จับ: ผู้ถูกฆ่ารายงาน เลือกของยึด = สุ่มจากของทั่วไป (scrap/chem — มีดไม่ใช่ของทั่วไป) ค่า 0.99 → chem (ตัวที่ 2 ตามลำดับ COMMON: scrap, chem)
  await set(); q(0.99); r = await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); assert.strictEqual(r.captured, true); assert.strictEqual(r.tier, 1); assert.strictEqual(r.until, T0 + 30 * M); assert.deepStrictEqual(r.reward, { id: "chem", qty: 1 });
  assert.strictEqual((await db.ref("inventory/v/chem/qty").get()).val(), 3); assert.strictEqual((await db.ref("inventory/k/chem/qty").get()).val(), 1); assert.strictEqual((await db.ref("inventory/v/knife").get()).exists(), true);
  const jv = (await db.ref("jail/v").get()).val(); assert.deepStrictEqual({ until: jv.until, t: jv.t, tm: jv.tm, w: jv.w, by: jv.by }, { until: T0 + 30 * M, t: 1, tm: 30, w: 0, by: "k" });
  assert.strictEqual((await db.ref("crim/v/until").get()).val(), T0, "ล้างส้ม"); assert.strictEqual((await db.ref("crim/v/n").get()).val(), 1);
  r = await jl.run("k", { a: "capture", role: "killer", other: "v" }, T0 + 10000); assert.strictEqual(r.captured, false); assert(["dup", "already", "not-orange"].includes(r.why));
  // ---- เงื่อนไขที่ไม่จับ
  const no = async (why, x, role = "victim", who = "v", other = "k") => { await set(x); const rr = await jl.run(who, { a: "capture", role, other }, T0); assert.strictEqual(rr.captured, false, why); assert.strictEqual(rr.why, why); assert.strictEqual((await db.ref("jail/v").get()).val(), null, why); };
  await no("not-orange", { crim: null });
  await no("killer-orange", { crim: { v: OR, k: OR } });
  await no("alive", { users: { ...base().users, v: u("v", "human", { hp: 9 }) } });
  await no("zone", { users: { ...base().users, v: u("v", "human", { hp: 0, zone: "ruins" }) } });
  await no("zone", { users: { ...base().users, v: u("v", "human", { hp: 0, zone: "safe" }), k: u("k", "human", { zone: "safe", lastAttack: T0 - 1000 }) } });
  await no("stale", { users: { ...base().users, k: u("k", "human", { lastAttack: T0 - 100000 }) } });
  await no("user", { users: { ...base().users, k: u("k", "human", { role: "gm", lastAttack: T0 - 1000 }) } }, "victim", "v", "k");
  await rej(jl.run("v", { a: "capture", role: "victim", other: "v" }, T0), "ข้อมูลไม่ถูกต้อง");
  // ผู้ฆ่ารายงานเอง + ผู้ต้องขังกระเป๋าไม่มีของทั่วไป → จับได้แต่ไม่มีของยึด • ซอมบี้จับก็ได้ (ต่างฝ่ายก็จับได้)
  await set({ inventory: { v: { knife: { id: "knife", qty: 1, dur: 20 } } } }); r = await jl.run("z", { a: "capture", role: "killer", other: "v" }, T0); assert.strictEqual(r.captured, true); assert.strictEqual(r.reward, null);
  // ---- ชั้นโทษ: แหกคุกสะสมใน 24 ชม. → โทษ/ประกัน/ของยึดเพิ่ม • เพดานชั้น 4
  for (const [n, tier] of [[0, 1], [1, 2], [2, 3], [3, 4], [9, 4]]) { await set({ jailn: { v: { n, ts: T0 - M } } }); q(0); r = await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); assert.strictEqual(r.tier, tier, "tier n=" + n); assert.strictEqual(r.until, T0 + 30 * tier * M); if (tier >= 2) assert.strictEqual(r.reward.qty, tier); }
  await set({ jailn: { v: { n: 3, ts: T0 - 25 * 3600000 } } }); q(0); r = await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); assert.strictEqual(r.tier, 1, "ลดเมื่อห่าง 24 ชม.");
  // ---- state
  await db.ref("inventory/v").set({ scrap: { id: "scrap", qty: 50 }, chem: { id: "chem", qty: 10 }, duct_tape: { id: "duct_tape", qty: 5 } }); await db.ref("users/v/zone").set("jail"); await db.ref("users/v/hp").set(50);
  const j0 = (await db.ref("jail/v").get()).val(); r = await jl.run("v", { a: "state" }, T0 + M); assert.deepStrictEqual({ on: r.on, active: r.active, tier: r.tier, bailPts: r.bailPts, esc: r.esc }, { on: true, active: true, tier: 1, bailPts: 30, esc: 25 });
  // ---- ทำงาน: −2 นาที/ครั้ง พัก 20 วินาที ได้รวมไม่เกินครึ่งโทษ (30/2 = 14 → 7 ครั้ง)
  r = await jl.run("v", { a: "work" }, T0 + M); assert.strictEqual(r.until, j0.until - 2 * M); await rej(jl.run("v", { a: "work" }, T0 + M + 5000), "พักก่อน");
  let t = T0 + M; for (let i = 0; i < 6; i++) { t += 25000; r = await jl.run("v", { a: "work" }, t); } assert.strictEqual(r.w, 14); await rej(jl.run("v", { a: "work" }, t + 25000), "ไม่เกินครึ่ง");
  assert.strictEqual((await db.ref("jail/v/until").get()).val(), j0.until - 14 * M);
  // ---- จ่ายประกัน 30 แต้ม: เศษเหล็ก 30 → ปล่อยที่ Safe Zone ไม่ริบของ
  r = await jl.run("v", { a: "bail" }, t + 30000); assert.strictEqual(r.zone, "safe"); assert.deepStrictEqual(r.paid, [{ id: "scrap", qty: 30 }]); assert.strictEqual((await db.ref("jail/v").get()).val(), null); assert.strictEqual((await db.ref("users/v/zone").get()).val(), "safe"); assert.strictEqual((await db.ref("inventory/v/scrap/qty").get()).val(), 20);
  await rej(jl.run("v", { a: "bail" }, t + 40000), "ไม่ได้ติดคุก"); await rej(jl.run("v", { a: "work" }, t + 40000), "ไม่ได้ติดคุก");
  // ประกันไม่พอ → ไม่หักอะไร
  await set({ inventory: { v: { scrap: { id: "scrap", qty: 5 } } } }); q(0); await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); await rej(jl.run("v", { a: "bail" }, T0 + M), "วัตถุดิบไม่พอ"); assert.strictEqual((await db.ref("jail/v/until").get()).val() > T0 + M, true);
  // ---- แหกคุก: ล้มเหลว (0.9 ≥ 25%) → +5 นาที เสียของ 1 ชิ้น พัก 5 นาที
  await db.ref("users/v/zone").set("jail"); const until1 = (await db.ref("jail/v/until").get()).val(); q(0.9, 0); r = await jl.run("v", { a: "escape" }, T0 + M); assert.strictEqual(r.escaped, false); assert.strictEqual(r.until, until1 + 5 * M); assert.deepStrictEqual(r.lost, { id: "scrap", qty: 1 }); assert.strictEqual((await db.ref("inventory/v/scrap/qty").get()).val(), 3);   // 5 −1 (ถูกยึดตอนจับ) −1 (แหกคุกพลาด)
  await rej(jl.run("v", { a: "escape" }, T0 + 2 * M), "เพิ่งลองแหกคุก");
  // สำเร็จ (0.1 < 25%) → ออกที่เมืองร้าง กลับเป็นส้ม (n+1) ชั้นโทษรอบหน้าสูงขึ้น
  q(0.1); r = await jl.run("v", { a: "escape" }, T0 + 7 * M); assert.strictEqual(r.escaped, true); assert.strictEqual(r.zone, "ruins"); assert.strictEqual((await db.ref("jail/v").get()).val(), null); assert.strictEqual((await db.ref("users/v/zone").get()).val(), "ruins");
  const cr = (await db.ref("crim/v").get()).val(); assert.strictEqual(cr.until, T0 + 7 * M + 45 * M * 2); assert.strictEqual(cr.n, 2); assert.strictEqual((await db.ref("jailn/v/n").get()).val(), 1);
  // ---- ครบเวลา: ปล่อยไม่ได้ก่อนเวลา • ครบแล้วริบของทั่วไป 1 ชิ้น (ประกันไม่ริบ)
  await set(); q(0); await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); await db.ref("users/v/zone").set("jail"); await rej(jl.run("v", { a: "release" }, T0 + 29 * M), "ยังไม่ครบโทษ");
  await db.ref("inventory/v").set({ scrap: { id: "scrap", qty: 6 } }); q(0); r = await jl.run("v", { a: "release" }, T0 + 31 * M); assert.strictEqual(r.released, true); assert.strictEqual(r.zone, "safe"); assert.deepStrictEqual(r.lost, { id: "scrap", qty: 1 }); assert.strictEqual((await db.ref("inventory/v/scrap/qty").get()).val(), 5); assert.strictEqual((await db.ref("users/v/zone").get()).val(), "safe");
  // ไม่มีบันทึกคุกแต่ค้างโซนคุก → ปล่อยออก • ไม่ค้าง → ไม่ทำอะไร
  await db.ref("users/v/zone").set("jail"); r = await jl.run("v", { a: "release" }, T0 + 32 * M); assert.strictEqual(r.released, true); assert.strictEqual((await db.ref("users/v/zone").get()).val(), "safe"); r = await jl.run("v", { a: "release" }, T0 + 33 * M); assert.strictEqual(r.released, false);
  // ครบเวลาแต่กระเป๋าไม่มีของทั่วไป → ไม่ริบ
  await set(); q(0); await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); await db.ref("inventory/v").set({ knife: { id: "knife", qty: 1, dur: 5 } }); r = await jl.run("v", { a: "release" }, T0 + 31 * M); assert.strictEqual(r.lost, null);
  // tune ปรับโทษ/ประกัน/โอกาส
  await set({ tune: { jail_on: 1, jail_min: 10, jail_bail: 5, jail_esc: 100 } }); q(0); r = await jl.run("v", { a: "capture", role: "victim", other: "k" }, T0); assert.strictEqual(r.until, T0 + 10 * M); r = await jl.run("v", { a: "state" }, T0); assert.strictEqual(r.bailPts, 5); q(0.99); r = await jl.run("v", { a: "escape" }, T0 + M); assert.strictEqual(r.escaped, true, "esc 100%");
  console.log("JAIL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
