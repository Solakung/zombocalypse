process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=ln" });
const db = admin.database(); const Lr = require(F + "learn"); const L = require(F + "lib");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8"), rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const ids = new Set(); Object.values(Lr.PATHS).flat().forEach((s) => s.r.forEach(([id]) => ids.add(id))); Object.values(Lr.FINAL).flat().forEach(([id]) => ids.add(id));
for (const id of ids) if (!/^(seed|deco|theme)_/.test(id)) assert(new RegExp("^  " + id + ": \\{", "m").test(sc) && wl.test(id), "bad id " + id);
// ธีม/ของตกแต่งที่แจกต้องมีจริงใน home.js
const H = require(F + "home"); for (const id of ids) { if (id.startsWith("deco_")) assert(H.ITEMS[id.slice(5)], "no deco " + id); if (id.startsWith("theme_")) assert(H.TH[id.slice(6)], "no theme " + id); }
for (const [f, p] of Object.entries(Lr.PATHS)) assert.strictEqual(new Set(p.map((s) => s.id)).size, p.length, f + " dup ids");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
(async () => {
  await db.ref().set({ users: { h: { username: "h", faction: "human", hp: 80 }, z: { username: "z", faction: "zombie", hp: 80 } } });
  const ln = Lr.makeLearn(db); let r = await ln.run("h", { a: "state" });
  assert.strictEqual(r.steps.length, 12); assert.strictEqual(r.next, 0); assert(r.steps.every((s) => !s.ok && !s.got)); assert.strictEqual(r.fac, "human");
  await rej(ln.run("h", { a: "claim", id: "use" }), "ยังทำไม่ครบ"); await rej(ln.run("h", { a: "claim", id: "nope" }), "ไม่มีขั้นนี้"); await rej(ln.run("h", { a: "claim", id: "final" }), "ไม่ครบ");
  await db.ref("ach/h/c").set({ use: 5, srch: 10, gard: 1, craft: 2, home: 1, mkt: 1, enc: 1, dive: 1, like: 1 }); await db.ref("base/h/lv").set(1); await db.ref("pass/h/xp").set(25); await db.ref("crate/h/st").set(3);
  r = await ln.run("h", { a: "state" }); const byId = Object.fromEntries(r.steps.map((s) => [s.id, s])); assert(byId.use.ok && !byId.srch.ok && byId.srch.v === 10 && byId.base.ok && byId.gard.ok && byId.pass.ok && byId.crate.ok && byId.mkt.ok && byId.like.ok);
  const c = await ln.run("h", { a: "claim", id: "use" }); assert(c.rewarded.length && c.steps.find((s) => s.id === "use").got); await rej(ln.run("h", { a: "claim", id: "use" }), "รับไปแล้ว");
  assert.strictEqual((await db.ref("inventory/h/water").get()).val().qty, 2);
  await ln.run("h", { a: "claim", id: "home" }); assert.strictEqual((await db.ref("home/h/own/gift").get()).val(), 1); assert.strictEqual((await db.ref("inventory/h/deco_gift").get()).val(), null);
  await ln.run("h", { a: "claim", id: "gard" }); assert.strictEqual((await db.ref("garden/h/seed/herb").get()).val(), 2);
  // ทำให้ครบทุกขั้น แล้วรับรางวัลปิดท้าย
  await db.ref("ach/h/c").update({ srch: 30 });
  for (const s of r.steps) { if (!(await db.ref(`learn/h/c/${s.id}`).get()).val()) await ln.run("h", { a: "claim", id: s.id }); }
  r = await ln.run("h", { a: "state" }); assert(r.allGot && r.done === 12 && !r.finalGot);
  const f = await ln.run("h", { a: "claim", id: "final" }); assert(f.finalGot && f.rewarded.some(([id]) => id === "theme_cozy")); assert.strictEqual((await db.ref("home/h/own/t_cozy").get()).val(), 1); await rej(ln.run("h", { a: "claim", id: "final" }), "รับไปแล้ว");
  // ซอมบี้
  const zr = await ln.run("z", { a: "state" }); assert.strictEqual(zr.steps.length, 12); assert(zr.steps.some((s) => s.id === "bite") && !zr.steps.some((s) => s.id === "mkt" || s.id === "craft"));
  await db.ref("ach/z/c").set({ bite: 2 }); await ln.run("z", { a: "claim", id: "bite" }); assert.strictEqual((await db.ref("inventory/z/serum").get()).val().qty, 1);
  // กระเป๋าเต็ม → ไม่เสียสิทธิ์
  await db.ref("ach/z/c/use").set(9); await db.ref("inventory/z/rotten_meat").set({ id: "rotten_meat", qty: 98 }); await rej(ln.run("z", { a: "claim", id: "use" }), "เต็ม"); assert.strictEqual((await db.ref("learn/z/c/use").get()).val(), null, "not consumed");
  await db.ref("inventory/z/rotten_meat").set({ id: "rotten_meat", qty: 10 }); await ln.run("z", { a: "claim", id: "use" });
  // กดซ้อน
  await db.ref("ach/z/c/srch").set(40); const rs = await Promise.allSettled([1, 2, 3].map(() => ln.run("z", { a: "claim", id: "srch" }))); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1);
  await db.ref("users/bn").set({ username: "bn", faction: "human", banned: true }); await rej(ln.run("bn", { a: "state" }), "ใช้งานไม่ได้"); await rej(ln.run(null, { a: "state" }), "ล็อกอิน");
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("LEARN ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
