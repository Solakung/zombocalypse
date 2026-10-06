process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=hm" });
const db = admin.database(); const H = require(F + "home"); const L = require(F + "lib");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
// ราคา/ของรางวัลต้องเป็นไอเทมจริงที่อยู่ใน whitelist
const ids = new Set(); Object.values(H.PRICE).forEach((f) => Object.values(f).forEach(([id]) => ids.add(id))); H.THEMES.forEach(([, , , , c]) => c && ids.add(c[0]));
for (const id of ids) assert(new RegExp("^  " + id + ": \\{", "m").test(sc) && wl.test(id), "bad item " + id);
// ไอเทมทุกชิ้นมีไอคอน/โซนถูกต้อง, id ที่ใช้กับ grant ตรง regex
for (const it of Object.values(H.ITEMS)) { assert(["w", "f", "a"].includes(it.z) && it.ic && it.n && it.sz > 0, it.id); if (!/^d\d+$/.test(it.id)) assert(L.isHome("deco_" + it.id), "deco id regex " + it.id); }
H.THEMES.forEach(([id, , , pal]) => { assert(L.isHome("theme_" + id)); if (pal) assert.strictEqual(pal.length, 6); });
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
const NOW = Date.UTC(2026, 8, 7, 3), DAY = 86400000;
(async () => {
  const mkU = (n, f = "human", extra = {}) => ({ username: n, faction: f, hp: 80, zone: "safe", ...extra });
  await db.ref().set({ users: { a: mkU("a"), b: mkU("b"), z: mkU("z", "zombie"), n: mkU("n") }, base: { a: { lv: 2, deco: { d0: true, d5: true, d11: true } }, b: { lv: 0 }, z: { lv: 3 } }, ach: { a: { c: { srch: 50 } }, b: { c: { srch: 100 } }, z: { c: { srch: 30 } }, n: { c: { srch: 3 } } } });
  const h = H.makeHome(db);
  // ----- ย้ายของเดิม
  let r = await h.run("a", { a: "state" }, NOW);
  assert.strictEqual(r.slots, 12); assert(r.own.d0 === 1 && r.own.d5 === 1 && r.own.d11 === 1 && !r.own.d1);
  assert.strictEqual(r.lay.length, 3); assert.deepStrictEqual(r.lay.find((e) => e.d === "d5"), { d: "d5", x: 246, y: 176 }); assert.strictEqual(r.th, "plain");
  const r2 = await h.run("a", { a: "state" }, NOW + 1000); assert.strictEqual(r2.lay.length, 3, "migrate idempotent");
  await db.ref("base/a/deco/d1").set(true); r = await h.run("a", { a: "state" }, NOW + 2000); assert(r.own.d1 === 1 && r.lay.length === 3, "later old purchase owned but not auto-placed");
  // ----- ซื้อ
  await rej(h.run("a", { a: "buy", d: "cot" }, NOW), "ของไม่พอ");
  await db.ref("inventory/a").set({ scrap: { id: "scrap", qty: 80 }, herb_bundle: { id: "herb_bundle", qty: 20 } });
  r = await h.run("a", { a: "buy", d: "cot" }, NOW); assert.strictEqual(r.own.cot, 1); assert.strictEqual((await db.ref("inventory/a/scrap").get()).val().qty, 62);   // เตียง p3 = 18
  await rej(h.run("a", { a: "buy", d: "xtree" }, NOW), "ซื้อของชิ้นนี้ไม่ได้"); await rej(h.run("a", { a: "buy", d: "d3" }, NOW), "ซื้อของชิ้นนี้ไม่ได้"); await rej(h.run("a", { a: "buy", d: "bones" }, NOW), "ซื้อของชิ้นนี้ไม่ได้");
  r = await h.run("a", { a: "buy", d: "sunflower" }, NOW); assert.strictEqual((await db.ref("inventory/a/herb_bundle").get()).val().qty, 12);   // p2 = 8
  r = await h.run("a", { a: "buy", t: "cozy" }, NOW); assert(r.themes.find((t) => t.id === "cozy").owned); await rej(h.run("a", { a: "buy", t: "cozy" }, NOW), "มีธีมนี้แล้ว"); await rej(h.run("a", { a: "buy", t: "rain" }, NOW), "ซื้อธีมนี้ไม่ได้"); await rej(h.run("a", { a: "buy", t: "moss" }, NOW), "ซื้อธีมนี้ไม่ได้");
  // ----- จัดห้อง
  const lay = [{ d: "d5", x: 100, y: 170 }, { d: "cot", x: 200, y: 175 }, { d: "d11", x: 60, y: 50 }, { d: "sunflower", x: 280, y: 180 }];
  r = await h.run("a", { a: "place", lay, th: "cozy", cap: 2 }, NOW); assert(r.saved && r.lay.length === 4 && r.th === "cozy" && r.cap === 2);
  assert.strictEqual((await db.ref("home/a/lay").get()).val().length, 4);
  await rej(h.run("a", { a: "place", lay: [{ d: "d5", x: 1, y: 170 }] }, NOW), "วางตำแหน่งนี้ไม่ได้");
  await rej(h.run("a", { a: "place", lay: [{ d: "d11", x: 60, y: 170 }] }, NOW), "วางตำแหน่งนี้ไม่ได้");   // รูปติดผนังวางบนพื้นไม่ได้
  await rej(h.run("a", { a: "place", lay: [{ d: "cot", x: 60, y: 60 }] }, NOW), "วางตำแหน่งนี้ไม่ได้");
  await rej(h.run("a", { a: "place", lay: [{ d: "cot", x: 60, y: 170 }, { d: "cot", x: 100, y: 170 }] }, NOW), "ไม่พอ");
  await rej(h.run("a", { a: "place", lay: [{ d: "robot", x: 60, y: 170 }] }, NOW), "ไม่พอ"); await rej(h.run("a", { a: "place", lay: [{ d: "nothing", x: 60, y: 170 }] }, NOW), "ไม่รู้จัก");
  await rej(h.run("a", { a: "place", lay: [{ d: "bones", x: 60, y: 170 }] }, NOW), "อีกฝ่าย");
  await rej(h.run("a", { a: "place", lay: [], th: "blood" }, NOW), "ไม่มีธีมนี้"); await rej(h.run("a", { a: "place", lay: [], th: "dusk" }, NOW), "ยังไม่ได้ปลดล็อก"); await rej(h.run("a", { a: "place", lay: [], cap: 99 }, NOW), "วลี");
  await rej(h.run("a", { a: "place", lay: "x" }, NOW), "ข้อมูลไม่ถูกต้อง");
  // เกินจำนวนช่อง: b ที่พัก 0 → 6 ช่อง
  await db.ref("home/b/own").set({ crate: 9, barrel: 9 }); await rej(h.run("b", { a: "place", lay: Array.from({ length: 7 }, (_, i) => ({ d: "crate", x: 20 + i * 20, y: 170 })) }, NOW), "ไม่เกิน 6");
  await h.run("b", { a: "place", lay: Array.from({ length: 6 }, (_, i) => ({ d: "crate", x: 20 + i * 20, y: 170 })) }, NOW);
  // ----- ซอมบี้
  r = await h.run("z", { a: "state" }, NOW); assert(r.catalog.some((c) => c.id === "bones") && r.themes.some((t) => t.id === "blood") && !r.themes.some((t) => t.id === "mint") && r.slots === 16);
  const hz = r.catalog.find((c) => c.id === "bones"); assert.deepStrictEqual(hz.cost, ["rotten_meat", 6]);
  // ----- รางวัลผ่าน grantAll: deco_/theme_ ไม่เข้ากระเป๋า
  assert(await L.grantAll(db, "a", [["deco_crown", 1], ["theme_rain", 1], ["deco_gift", 2]])); r = await h.run("a", { a: "state" }, NOW);
  assert(r.own.crown === 1 && r.own.t_rain === 1 && r.own.gift === 2); assert.strictEqual((await db.ref("inventory/a/deco_crown").get()).val(), null);
  assert(!(await L.grantAll(db, "a", [["scrap", 1], ["theme_rain", 1]])), "theme cap 1"); assert.strictEqual((await db.ref("inventory/a/scrap").get()).val().qty, 38, "rolled back");   // 80 − เตียง 18 − ธีม 24
  r = await h.run("a", { a: "place", lay: [{ d: "crown", x: 100, y: 100 }], th: "rain" }, NOW); assert.strictEqual(r.th, "rain");
  // ----- เยี่ยมห้อง
  let v = await h.run("b", { a: "visit", uid: "a" }, NOW); assert(v.name === "a" && v.lay.length === 1 && v.th === "rain" && Array.isArray(v.pal) && v.items.crown && !v.self && v.left === 5 && !v.liked);
  assert(!("own" in v) && !("slots" in v), "no private data leaked");
  await rej(h.run("b", { a: "visit", uid: "nobody" }, NOW), "ไม่พบ");
  // ----- ถูกใจ
  await h.run("a", { a: "place", lay: [{ d: "crown", x: 100, y: 100 }], th: "rain", cap: 0 }, NOW);
  await rej(h.run("a", { a: "like", to: "a" }, NOW), "ตัวเอง"); await rej(h.run("n", { a: "like", to: "a" }, NOW), "ต้องเล่นให้มากกว่านี้");
  let lk = await h.run("b", { a: "like", to: "a" }, NOW); assert(lk.ok && lk.left === 4 && lk.rew[0][0] === "scrap"); const b0 = (await db.ref("inventory/b/scrap").get()).val().qty;
  await rej(h.run("b", { a: "like", to: "a" }, NOW + 5), "ถูกใจห้องนี้ไปแล้ว");
  await db.ref("home/z/lay").set([{ d: "bones", x: 50, y: 170 }]); lk = await h.run("b", { a: "like", to: "z" }, NOW); assert(lk.rew === null, "reward only first like of day"); assert.strictEqual((await db.ref("inventory/b/scrap").get()).val().qty, b0);
  await rej(h.run("b", { a: "like", to: "b" }, NOW), "ตัวเอง");
  await db.ref("home/b/lay").set([{ d: "crate", x: 20, y: 170 }]); await db.ref("home/n/lay").set([{ d: "crate", x: 20, y: 170 }]);
  // เกิน 5/วัน: สร้างเป้าหมาย 5 ห้อง
  for (let i = 0; i < 4; i++) { await db.ref(`users/t${i}`).set(mkU("t" + i)); await db.ref(`home/t${i}/lay`).set([{ d: "crate", x: 20, y: 170 }]); }
  for (let i = 0; i < 3; i++) await h.run("b", { a: "like", to: "t" + i }, NOW);   // รวม a,z,t0..t2 = 5
  await rej(h.run("b", { a: "like", to: "t3" }, NOW), "ครบ 5"); lk = await h.run("b", { a: "like", to: "t3" }, NOW + DAY).catch((e) => e); assert(lk.ok, "next day resets");
  v = await h.run("a", { a: "visit", uid: "a" }, NOW + 10); assert(v.self && v.likes === 1 && v.wlikes === 1);
  await db.ref("home/q/lay").set(null); await db.ref("users/q").set(mkU("q")); await rej(h.run("b", { a: "like", to: "q" }, NOW + DAY), "ยังไม่ได้ตกแต่ง");
  await db.ref("users/bn").set(mkU("bn", "human", { banned: true })); await rej(h.run("bn", { a: "state" }, NOW), "ใช้งานไม่ได้"); await rej(h.run(null, { a: "state" }, NOW), "ล็อกอิน");
  // ----- ห้องยอดนิยม + รางวัลสัปดาห์ถัดไป
  let top = await h.run("a", { a: "top" }, NOW); assert(top.cur.length >= 2 && top.cur[0].v >= top.cur[top.cur.length - 1].v && top.cur[0].name); assert(!top.canClaim);
  const W1 = NOW + 7 * DAY; top = await h.run("a", { a: "top" }, W1); assert(top.prev.some((x) => x.uid === "a") && top.canClaim, "last week's top can claim");
  const rank = top.prev.findIndex((x) => x.uid === "a") + 1; r = await h.run("a", { a: "claimTop" }, W1); assert.strictEqual(r.rank, rank); assert(r.rewarded.some(([id]) => id === "deco_gift") || r.rewarded.length);
  await rej(h.run("a", { a: "claimTop" }, W1), "ไปแล้ว"); await rej(h.run("n", { a: "claimTop" }, W1), "ไม่ได้อยู่ใน 10");
  // ----- กดซ้อน
  await db.ref("inventory/a/scrap").set({ id: "scrap", qty: 40 }); const w0 = (await h.run("a", { a: "state" }, W1)).own.crate || 0;
  const rs = await Promise.allSettled([1, 2, 3, 4].map(() => h.run("a", { a: "buy", d: "crate" }, W1))); const ok = rs.filter((x) => x.status === "fulfilled").length;
  const have = (await db.ref("home/a/own/crate").get()).val() || 0; assert.strictEqual(have - w0, ok, "own matches successes"); assert.strictEqual(40 - (await db.ref("inventory/a/scrap").get()).val().qty, ok * 6, "paid exactly for successes");
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("HOME ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
