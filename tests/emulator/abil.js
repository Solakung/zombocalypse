process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=ab" });
const db = admin.database(); const A = require(F + "ability"), W = require(F + "war"); const H = require(F + "home");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8"), rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const ids = new Set(); Object.values(A.ABIL).forEach((x) => ids.add(x.cost[0])); Object.values(W.REW).forEach((o) => Object.values(o).flat().forEach(([id]) => ids.add(id))); ids.add("herb_bundle");
for (const id of ids) if (!/^(seed|deco|theme)_/.test(id)) assert(new RegExp("^  " + id + ": \\{", "m").test(sc) && wl.test(id), "bad id " + id); else if (id.startsWith("deco_")) assert(H.ITEMS[id.slice(5)], "no deco " + id);
// สูตรอาชีพต้องตรงกับในเกม (script.js)
for (const k of ["explorer", "hunter", "medic", "trader"]) { const m = sc.match(new RegExp(k + ': \\{ icon:[^\\n]*score: \\(c\\) => ([^\\n]*?) \\},?\\n')); assert(m, "career " + k); }
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 8, 7, 3), MIN = 60000, DAY = 86400000;
(async () => {
  const mk = (n, f, zone = "ruins", hp = 60, extra = {}) => ({ username: n, faction: f, hp, zone, ...extra });
  await db.ref().set({ users: { ex: mk("ex", "human"), md: mk("md", "human"), mf: mk("mf", "human", "ruins", 30), far: mk("far", "human", "mall", 30), zb: mk("zb", "zombie"), none: mk("none", "human"), z0: mk("z0", "zombie"), hu: mk("hu", "human", "ruins", 60) },
    ach: { ex: { c: { srch: 300 } }, md: { c: { use: 700 } }, none: { c: { srch: 10 } }, hu: { c: { zwin: 500, boss: 20, bite: 5 } } }, evo: { zb: { h: 1, g: 3, s: 2, line: "giant" }, z0: { h: 0, g: 0, s: 0 } } });
  const ab = A.makeAbility(db); let r;
  // ----- ผู้ไม่มีสาย
  r = await ab.run("none", { a: "state" }, T0); assert(!r.has); await rej(ab.run("none", { a: "use" }, T0), "ยังไม่มีอาชีพ"); await rej(ab.run("z0", { a: "use" }, T0), "วิวัฒนาการ");
  // ----- นักสำรวจ L2 (คะแนน 300 → L2)
  r = await ab.run("ex", { a: "state" }, T0); assert(r.has && r.id === "explorer" && r.L === 2 && r.dur === 12 && !r.live && r.cdLeft === 0);
  await rej(ab.run("ex", { a: "use" }, T0), "ของไม่พอ"); await db.ref("inventory/ex/scrap").set({ id: "scrap", qty: 5 });
  r = await ab.run("ex", { a: "use" }, T0); assert(r.used && r.live.id === "explorer" && Math.abs(r.live.eff.n - 0.76) < 1e-9 && Math.abs(r.live.eff.r - 1.16) < 1e-9 && r.live.until === T0 + 12 * MIN); assert.strictEqual((await db.ref("inventory/ex/scrap").get()).val().qty, 3);
  await rej(ab.run("ex", { a: "use" }, T0 + 5 * MIN), "คูลดาวน์"); r = await ab.run("ex", { a: "state" }, T0 + 5 * MIN); assert(r.live && r.cdLeft === 80 * MIN - 5 * MIN);
  r = await ab.run("ex", { a: "state" }, T0 + 13 * MIN); assert(!r.live, "expired"); r = await ab.run("ex", { a: "use" }, T0 + 81 * MIN); assert(r.used);
  // ----- หมอ L3 (350 → 0.5*700 = 350 → L2) รักษาเพื่อน/ตัวเอง
  r = await ab.run("md", { a: "state" }, T0); assert(r.id === "medic" && r.L === 2 && r.heal === 36);
  await db.ref("inventory/md/bandage").set({ id: "bandage", qty: 3 });
  await rej(ab.run("md", { a: "use", to: "far" }, T0), "โซนเดียวกัน"); await rej(ab.run("md", { a: "use", to: "zb" }, T0), "รักษาคนนี้ไม่ได้"); await rej(ab.run("md", { a: "use", to: "ghost" }, T0), "รักษาคนนี้ไม่ได้");
  r = await ab.run("md", { a: "use", to: "mf" }, T0); assert(r.used && r.healed === 36 && r.to.name === "mf" && r.rew && r.aidLeft === 4); assert.strictEqual((await db.ref("users/mf/hp").get()).val(), 66); assert.strictEqual((await db.ref("inventory/md/bandage").get()).val().qty, 2); assert.strictEqual((await db.ref("inventory/md/herb_bundle").get()).val().qty, 1);
  await rej(ab.run("md", { a: "use", to: "mf" }, T0 + 10 * MIN), "คูลดาวน์");
  r = await ab.run("md", { a: "use" }, T0 + 46 * MIN); assert(r.used && r.healed === 36 && !r.to); assert.strictEqual((await db.ref("users/md/hp").get()).val(), 96);   // 60+36
  await db.ref("users/mf/hp").set(95); r = await ab.run("md", { a: "use", to: "mf" }, T0 + 92 * MIN); assert.strictEqual(r.healed, 5, "cap 100"); assert.strictEqual((await db.ref("users/mf/hp").get()).val(), 100);
  await db.ref("users/mf/hp").set(0); await rej(ab.run("md", { a: "use", to: "mf" }, T0 + 140 * MIN), "รักษาคนนี้ไม่ได้");
  // ----- นักล่า (คะแนนสูง) ซอมบี้
  r = await ab.run("hu", { a: "state" }, T0); assert(r.id === "hunter" && r.L >= 3); await db.ref("inventory/hu/canned_food").set({ id: "canned_food", qty: 2 }); r = await ab.run("hu", { a: "use" }, T0); assert(r.live.eff.dice >= 1 && r.live.eff.z < 1 && r.live.eff.cut > 0);
  r = await ab.run("zb", { a: "state" }, T0); assert(r.id === "giantz" && r.L === 3 && r.zom); await db.ref("inventory/zb/rotten_meat").set({ id: "rotten_meat", qty: 3 }); r = await ab.run("zb", { a: "use" }, T0); assert(Math.abs(r.live.eff.cut - 0.15) < 1e-9);
  await db.ref("evo/z0").set({ h: 2, g: 2, s: 0, line: "hunter" }); r = await ab.run("z0", { a: "state" }, T0); assert(r.id === "hunterz", "tie → chosen line");
  // กดซ้อน
  await db.ref("inventory/ex/scrap").set({ id: "scrap", qty: 9 }); const rs = await Promise.allSettled([1, 2, 3].map(() => ab.run("ex", { a: "use" }, T0 + 400 * MIN))); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1); assert.strictEqual((await db.ref("inventory/ex/scrap").get()).val().qty, 7);
  // ============ ศึกใหญ่ ============
  const wk = W.wkOf(T0 + 14 * DAY), pw = wk - 1; const w = W.makeWar(db);
  const put = async (f, i, uid, n) => db.ref(`coop/z${f}${pw}${i}/${uid}`).set({ n, name: uid, ts: 1 });
  await put("h", 1, "ex", 40); await put("h", 2, "md", 25); await put("h", 2, "ex", 10); await put("z", 1, "zb", 90); await put("z", 3, "z0", 20); await put("z", 4, "z0", 15);
  const NOW = T0 + 14 * DAY; r = await w.run("ex", { a: "state" }, NOW); assert.strictEqual(r.prev.h, 75); assert.strictEqual(r.prev.z, 125); assert.strictEqual(r.prev.win, "z"); assert(r.prev.mine === 50 && r.prev.canClaim && !r.prev.won && !r.buff);
  r = await w.run("zb", { a: "state" }, NOW); assert(r.prev.won && r.buff && r.buff.rm > 1 && r.buffOf === "z");
  await rej(w.run("md", { a: "claim" }, NOW), "ต้องสะสมแต้ม"); r = await w.run("ex", { a: "claim" }, NOW); assert(r.rewarded.length && !r.won); await rej(w.run("ex", { a: "claim" }, NOW), "รับรางวัลสัปดาห์ที่แล้วไปแล้ว");
  r = await w.run("zb", { a: "claim" }, NOW); assert(r.won && r.rewarded.some(([id]) => id === "deco_web")); assert.strictEqual((await db.ref("home/zb/own/web").get()).val(), 1); assert.strictEqual((await db.ref("inventory/zb/deco_web").get()).val(), null);
  r = await w.run("z0", { a: "claim" }, NOW); assert(r.won, "z0 35 pts ≥ 30");
  await db.ref(`coop/zh${wk}1/ex`).set({ n: 12, name: "ex", ts: 1 }); r = await w.run("ex", { a: "state" }, NOW); assert.strictEqual(r.h, 12); assert.strictEqual(r.mine, 12);
  const w2 = await w.run("none", { a: "state" }, NOW + 7 * DAY); assert(w2.prev.h === 12 && w2.prev.h + w2.prev.z < 60 && w2.prev.win === "", "too few total → draw/no winner");
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("ABIL+WAR ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
