// 💰 ค่าหัวแบบใหม่ (functions/bounty.js): เปิด/ปิด tune, ตั้งด้วยวัตถุดิบ, เพดาน/จำกัดต่อวัน/คูลดาวน์, ลดตามเวลา, เก็บ (ผู้ฆ่า/ผู้ถูกฆ่าเรียก), ผู้ตั้งเก็บเองไม่ได้, ค่าธรรมเนียม, กระเป๋าเต็ม, สูตรตรง script.js
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=bounty" });
const db = admin.database(); const B = require(F + "functions/bounty"), by = B.makeBounty(db);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), M = 60000, DAY = 86400000;
(async () => {
  // สูตรลดตามเวลาตรงกับ script.js
  const sc = fs.readFileSync(F + "script.js", "utf8"), m = sc.match(/const bty2Eff = (\(b, now = serverNow\(\)\) => [^\n]*);/); assert(m, "bty2Eff");
  const clientEff = new Function("serverNow", "T", "const bty2Eff = " + m[1] + "; return bty2Eff;")(() => 0, (k, d) => d);
  for (const [pts, ds] of [[10, 0], [10, 1], [50, 3.5], [200, 10], [200, 40], [7, 12]]) { const b = { pts, ts: T0 }; assert.strictEqual(clientEff(b, T0 + ds * DAY), B.effPts(b, T0 + ds * DAY, 3), `eff ${pts}/${ds}`); }
  const u = (n, f, x = {}) => ({ username: n, faction: f, role: "player", hp: 100, zone: "forest", ...x });
  const inv = (x = {}) => ({ scrap: { id: "scrap", qty: 40 }, chem: { id: "chem", qty: 10 }, ...x });
  const base = (extra = {}) => ({ users: { a: u("a", "human", { lastAttack: T0 - 5000 }), b: u("b", "human"), c: u("c", "zombie", { lastAttack: T0 - 5000 }), v: u("v", "human", { hp: 0 }), gm: u("gm", "human", { role: "gm" }), bn: u("bn", "human", { banned: true }) }, inventory: { a: inv(), b: inv(), c: inv() }, tune: { bty2_on: 1 }, ...extra });
  const set = (x) => db.ref().set(base(x)); let r;
  // ---- ปิดอยู่ (ค่าเริ่มต้น)
  await set({ tune: null }); r = await by.run("a", { a: "place", target: "b" }, T0); assert.deepStrictEqual(r, { ok: true, on: false }); assert.strictEqual((await db.ref("bty/b").get()).val(), null); assert.strictEqual((await by.run("a", { a: "state" }, T0)).on, false);
  await rej(by.run(null, { a: "state" }, T0), "ล็อกอิน"); await set(); await rej(by.run("a", { a: "zz" }, T0), "ไม่รู้จัก");
  // ---- ตั้ง: หักวัตถุดิบ 10 แต้ม (เศษเหล็ก 10) แล้วค่าหัว +10
  r = await by.run("a", { a: "place", target: "b" }, T0); assert.strictEqual(r.pts, 10); assert.deepStrictEqual(r.paid, [{ id: "scrap", qty: 10 }]); assert.strictEqual((await db.ref("inventory/a/scrap/qty").get()).val(), 30);
  const n1 = (await db.ref("bty/b").get()).val(); assert.deepStrictEqual({ pts: n1.pts, tn: n1.tn, bn: n1.bn, s: n1.s }, { pts: 10, tn: "b", bn: "a", s: { a: 10 } });
  await rej(by.run("a", { a: "place", target: "b" }, T0 + 10000), "เร็วเกินไป");   // คูลดาวน์ 30 วินาที
  r = await by.run("a", { a: "place", target: "b" }, T0 + 31000); assert.strictEqual(r.pts, 20);
  r = await by.run("c", { a: "place", target: "b" }, T0 + 32000); assert.strictEqual(r.pts, 30); assert.deepStrictEqual((await db.ref("bty/b/s").get()).val(), { a: 20, c: 10 });
  await by.run("a", { a: "place", target: "b" }, T0 + 70000); await rej(by.run("a", { a: "place", target: "b" }, T0 + 110000), "ครบ 3 ครั้ง");   // 3 ครั้ง/วัน/เป้าหมาย
  assert.strictEqual((await db.ref("bty/b/pts").get()).val(), 40);
  // ---- ห้ามตั้ง
  await rej(by.run("a", { a: "place", target: "a" }, T0), "ข้อมูลไม่ถูกต้อง"); await rej(by.run("a", { a: "place", target: "gm" }, T0), "ตั้งค่าหัวคนนี้ไม่ได้"); await rej(by.run("a", { a: "place", target: "bn" }, T0), "ตั้งค่าหัวคนนี้ไม่ได้"); await rej(by.run("a", { a: "place", target: "nobody" }, T0), "ตั้งค่าหัวคนนี้ไม่ได้");
  await rej(by.run("gm", { a: "place", target: "b" }, T0), "ตั้งค่าหัวไม่ได้"); await rej(by.run("v", { a: "place", target: "b" }, T0), "ต้องมีชีวิต");
  // ไม่มีวัตถุดิบ → ไม่ตั้งและไม่หัก
  await db.ref("inventory/c").set({ scrap: { id: "scrap", qty: 3 } }); await rej(by.run("c", { a: "place", target: "v" }, T0 + 200000), "วัตถุดิบไม่พอ"); assert.strictEqual((await db.ref("inventory/c/scrap/qty").get()).val(), 3); assert.strictEqual((await db.ref("bty/v").get()).val(), null);
  // ---- เพดาน 200 (ปรับด้วย tune) • ลดตามเวลา 3%/วัน
  await db.ref("bty/b").set({ pts: 195, ts: T0, tn: "b", bn: "a", s: { a: 195 } }); await rej(by.run("c", { a: "place", target: "b" }, T0 + 300000), "เต็มเพดาน");
  await db.ref("inventory/c").set(inv()); await db.ref("tune/bty_cap").set(300); r = await by.run("c", { a: "place", target: "b" }, T0 + 300000); assert.strictEqual(r.pts, B.effPts({ pts: 195, ts: T0 }, T0 + 300000, 3) + 10);
  await db.ref("bty/b").set({ pts: 100, ts: T0, tn: "b", bn: "a", s: { a: 100 } }); await db.ref("btyrl").remove(); r = await by.run("c", { a: "place", target: "b" }, T0 + 10 * DAY); assert.strictEqual(r.pts, 70 + 10, "10 วัน × 3% = 70 + 10");
  // ---- เก็บ: v (b ที่ตายแล้ว) — ผู้ฆ่า c (ซอมบี้) เก็บ b ไม่ได้ถ้าคนละโซน/ไม่ได้โจมตี ฯลฯ
  const sv = async (x = {}) => { await set(x); await db.ref("bty/v").set({ pts: 50, ts: T0, tn: "v", bn: "a", s: { a: 50 } }); };
  await sv(); r = await by.run("c", { a: "claim", other: "v" }, T0 + M); assert.strictEqual(r.claimed, true); assert.strictEqual(r.pay, 40); assert.deepStrictEqual(r.items, [{ id: "scrap", qty: 20 }, { id: "chem", qty: 10 }]);   // 50 → จ่าย 40 แต้ม (หัก 20%) = เคมี 10 (20แต้ม) + เศษเหล็ก 20
  assert.strictEqual((await db.ref("inventory/c/scrap/qty").get()).val(), 60); assert.strictEqual((await db.ref("inventory/c/chem/qty").get()).val(), 20);
  const cl = (await db.ref("bty/v").get()).val(); assert.deepStrictEqual({ pts: cl.pts, kb: cl.kb, paid: cl.paid, tn: cl.tn }, { pts: 0, kb: "c", paid: 40, tn: "v" });
  r = await by.run("c", { a: "claim", other: "v" }, T0 + M + 5000); assert.strictEqual(r.claimed, false); assert.strictEqual(r.why, "none");   // เก็บซ้ำไม่ได้
  // ตั้งใหม่หลังถูกเก็บ → เริ่มสะสมใหม่ (kb หาย)
  await db.ref("users/v/hp").set(100); r = await by.run("a", { a: "place", target: "v" }, T0 + 3 * M); assert.strictEqual(r.pts, 10); const n2 = (await db.ref("bty/v").get()).val(); assert.strictEqual(n2.kb, undefined); assert.deepStrictEqual(n2.s, { a: 10 });
  // ผู้ถูกฆ่าเรียกแทนผู้ฆ่า (role victim) — ผลเหมือนกัน จ่ายให้ผู้ฆ่า
  await sv(); r = await by.run("v", { a: "claim", role: "victim", other: "c" }, T0 + M); assert.strictEqual(r.claimed, true); assert.strictEqual(r.who, "c"); assert.strictEqual((await db.ref("bty/v/kb").get()).val(), "c");
  // ---- เก็บไม่ได้
  const no = async (why, x, who = "c", d = { a: "claim", other: "v" }) => { await sv(x); const rr = await by.run(who, d, T0 + M); assert.strictEqual(rr.claimed, false, why); assert.strictEqual(rr.why, why); assert.strictEqual((await db.ref("bty/v/pts").get()).val(), 50, why); };
  await no("alive", { users: { ...base().users, v: u("v", "human", { hp: 7 }) } });
  await no("zone", { users: { ...base().users, v: u("v", "human", { hp: 0, zone: "ruins" }) } });
  await no("zone", { users: { ...base().users, c: u("c", "zombie", { zone: "safe", lastAttack: T0 - 1000 }), v: u("v", "human", { hp: 0, zone: "safe" }) } });
  await no("stale", { users: { ...base().users, c: u("c", "zombie", { lastAttack: T0 - 200000 }) } });
  await no("setter", {}, "a");   // ผู้ตั้งเก็บค่าหัวของตัวเองไม่ได้
  await no("user", { users: { ...base().users, c: u("c", "zombie", { role: "gm", lastAttack: T0 - 1000 }) } });
  // ค่าหัวลดจนหมด → เก็บไม่ได้
  await set(); await db.ref("bty/v").set({ pts: 10, ts: T0 - 40 * DAY, tn: "v", bn: "a", s: { a: 10 } }); r = await by.run("c", { a: "claim", other: "v" }, T0 + M); assert.strictEqual(r.claimed, false);
  // กระเป๋าเต็ม (กองเกิน 99) → ไม่เสียค่าหัว และไม่จ่ายครึ่งทาง
  await sv(); await db.ref("inventory/c").set({ scrap: { id: "scrap", qty: 95 }, chem: { id: "chem", qty: 2 } }); const bef = (await db.ref("bty/v").get()).val();
  await rej(by.run("c", { a: "claim", other: "v" }, T0 + M), "กระเป๋าเต็ม"); assert.deepStrictEqual((await db.ref("bty/v").get()).val(), bef, "ค่าหัวคืนครบ"); assert.strictEqual((await db.ref("inventory/c/chem/qty").get()).val(), 2, "ไม่จ่ายครึ่งทาง");
  console.log("BOUNTY OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
