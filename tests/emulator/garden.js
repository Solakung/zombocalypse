process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=gd" });
const db = admin.database(); const G = require(F + "garden"); const { seaIdx } = require(F + "pass");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const ids = new Set(); Object.values(G.CROPS).forEach((c) => ids.add(c.y[0])); Object.values(G.MUT).flat().forEach(([id]) => ids.add(id)); Object.values(G.FERT).forEach(([id]) => ids.add(id)); ids.add("water");
Object.values(G.CROPS).forEach((c) => c.buy && ids.add(c.buy[0]));
for (const id of ids) assert(new RegExp("^  " + id + ": \\{", "m").test(sc) && wl.test(id), "bad item " + id);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
const NOW = Date.UTC(2026, 8, 7, 3), MIN = 60000;
const rnd = Math.random;
(async () => {
  await db.ref().set({ users: { h: { username: "h", faction: "human", hp: 80, zone: "safe" }, z: { username: "z", faction: "zombie", hp: 80, zone: "safe" }, o: { username: "o", faction: "human", hp: 80, zone: "ruins" } }, base: { h: { lv: 1 }, z: { lv: 3 }, o: { lv: 1 } } });
  const g = G.makeGarden(db);
  let r = await g.run("h", { a: "state" }, NOW); assert(r.n === 4 && r.plots.length === 4 && r.daily && Object.keys(r.crops).every((k) => G.CROPS[k].f === "h"));
  await rej(g.run("h", { a: "plant", i: 1, c: "herb" }, NOW), "ไม่มีเมล็ด");
  r = await g.run("h", { a: "daily" }, NOW); assert(r.got[0][0].startsWith("seed_") && !r.daily); await rej(g.run("h", { a: "daily" }, NOW + 1000), "รับเมล็ดฟรีไปแล้ว");
  r = await g.run("h", { a: "daily" }, NOW + 86400000);   // วันถัดไป ได้อีกครั้ง
  await db.ref("inventory/h").set({ scrap: { id: "scrap", qty: 40 }, water: { id: "water", qty: 3 } });
  r = await g.run("h", { a: "buy", c: "herb", q: 3 }, NOW); assert.strictEqual((await db.ref("inventory/h/scrap").get()).val().qty, 31);
  await rej(g.run("h", { a: "buy", c: "shroom" }, NOW), "ซื้อเมล็ดนี้ไม่ได้"); await rej(g.run("h", { a: "buy", c: "fungus" }, NOW), "ซื้อเมล็ดนี้ไม่ได้");
  const seeds0 = (await db.ref("garden/h/seed/herb").get()).val(); assert(seeds0 >= 3);
  r = await g.run("h", { a: "plant", i: 1, c: "herb" }, NOW); assert.strictEqual(r.plots[0].c, "herb"); assert.strictEqual((await db.ref("garden/h/seed/herb").get()).val(), seeds0 - 1);
  assert.strictEqual(r.plots[0].total, G.growMs("herb", NOW)); assert.strictEqual(seaIdx(NOW) % 4, 0, "season 0 rain"); assert.strictEqual(r.plots[0].total, Math.round(45 * MIN * 0.7));
  await rej(g.run("h", { a: "plant", i: 1, c: "herb" }, NOW), "มีพืชอยู่แล้ว"); await rej(g.run("h", { a: "plant", i: 5, c: "herb" }, NOW), "ไม่มีแปลง"); await rej(g.run("h", { a: "plant", i: 2, c: "fungus" }, NOW), "ปลูกพืชนี้ไม่ได้");
  await rej(g.run("h", { a: "harvest", i: 1 }, NOW + MIN), "ยังโตไม่เสร็จ");
  const before = r.plots[0].left; r = await g.run("h", { a: "water", i: 1 }, NOW + 5 * MIN); assert(r.plots[0].w && r.plots[0].left < before - 5 * MIN, "water shortens"); await rej(g.run("h", { a: "water", i: 1 }, NOW + 6 * MIN), "รดน้ำแล้ว");
  assert.strictEqual((await db.ref("inventory/h/water").get()).val().qty, 2);
  r = await g.run("h", { a: "fert", i: 1 }, NOW + 6 * MIN); assert(r.plots[0].f);
  Math.random = () => 0.99;   // ไม่มีศัตรูพืช/กลายพันธุ์
  const t1 = NOW + 60 * MIN; r = await g.run("h", { a: "harvest", i: 1 }, t1); assert.deepStrictEqual(r.got, [["herb_bundle", 4]], "yield 3 + fert 1");   // ปุ๋ย +1
  assert.strictEqual((await db.ref("garden/h/p/1").get()).val(), null); assert.strictEqual(r.plots[0].c, undefined); assert.strictEqual((await db.ref("garden/h/h/herb").get()).val(), 1);
  // ศัตรูพืช (ไม่ใส่ปุ๋ย) และกลายพันธุ์
  await db.ref("garden/h/seed").update({ mossb: 5 }); await g.run("h", { a: "plant", i: 2, c: "mossb" }, t1); Math.random = () => 0.0;   // ทุกเหตุการณ์เกิด
  r = await g.run("h", { a: "harvest", i: 2 }, t1 + 60 * MIN); assert(r.notes.length >= 1 && r.got.some(([id]) => id === "moss") && r.got.length >= 2, JSON.stringify(r.got)); Math.random = rnd;
  // harvest all + กระเป๋าเต็ม
  Math.random = () => 0.99; for (const i of [1, 2, 3]) { await db.ref("garden/h/seed/herb").set(5); await g.run("h", { a: "plant", i, c: "herb" }, t1 + 120 * MIN); }
  r = await g.run("h", { a: "harvest", i: "all" }, t1 + 120 * MIN + 80 * MIN); assert.strictEqual(r.cnt, 3); assert.strictEqual((await db.ref("inventory/h/herb_bundle").get()).val().qty, 4 + 3 * 3 + 0 + (r.got[0][0] === "herb_bundle" ? 0 : 0));
  await db.ref("garden/h/seed/herb").set(5); await g.run("h", { a: "plant", i: 1, c: "herb" }, t1 + 300 * MIN); await db.ref("inventory/h/herb_bundle").set({ id: "herb_bundle", qty: 99 });
  await rej(g.run("h", { a: "harvest", i: 1 }, t1 + 400 * MIN), "เต็ม"); assert((await db.ref("garden/h/p/1").get()).val(), "plot kept when inventory full");
  Math.random = rnd;
  // ต้องอยู่ safe + ที่พัก
  await rej(g.run("o", { a: "plant", i: 1, c: "herb" }, NOW), "Safe Zone"); await db.ref("users/o/zone").set("safe"); await db.ref("base/o").remove(); await rej(g.run("o", { a: "plant", i: 1, c: "herb" }, NOW), "ที่พักขั้น 1");
  // ซอมบี้ 8 แปลง + ฤดูหนาว (ซีซัน 3) ช้าลง
  const WINTER = NOW + 28 * 3 * 86400000; assert.strictEqual(seaIdx(WINTER) % 4, 3);
  r = await g.run("z", { a: "state" }, WINTER); assert(r.n === 8 && Object.keys(r.crops).every((k) => G.CROPS[k].f === "z") && r.crops.fungus.g === Math.round(60 * MIN * 1.4));
  await g.run("z", { a: "daily" }, WINTER); const sd = (await db.ref("garden/z/seed").get()).val(); const c0 = Object.keys(sd)[0]; assert(["fungus", "bog"].includes(c0));
  await g.run("z", { a: "plant", i: 8, c: c0 }, WINTER); await db.ref("inventory/z/rotten_meat").set({ id: "rotten_meat", qty: 4 }); await g.run("z", { a: "fert", i: 8 }, WINTER + 1000);
  assert.strictEqual((await db.ref("inventory/z/rotten_meat").get()).val().qty, 3);
  // seed_ ผ่าน grantAll ของระบบอื่น (หีบ/พ่อค้า) และไม่ทะลุ 99
  const L = require(F + "lib"); assert(await L.grantAll(db, "h", [["seed_glow", 2]])); assert.strictEqual((await db.ref("garden/h/seed/glow").get()).val(), 2);
  await db.ref("garden/h/seed/glow").set(98); assert(!(await L.grantAll(db, "h", [["seed_glow", 2]])), "seed cap"); assert.strictEqual((await db.ref("garden/h/seed/glow").get()).val(), 98);
  assert.strictEqual((await db.ref("inventory/h/seed_glow").get()).val(), null, "seed never in inventory");
  // rollback ผสม: ไอเทม + เมล็ดเต็ม → ไม่ค้างครึ่งทาง
  const before2 = (await db.ref("inventory/h/scrap").get()).val().qty; assert(!(await L.grantAll(db, "h", [["scrap", 1], ["seed_glow", 5]]))); assert.strictEqual((await db.ref("inventory/h/scrap").get()).val().qty, before2, "rolled back");
  // กดซ้อน
  Math.random = rnd; await db.ref("garden/h/seed/tomato").set(1);
  const rs = await Promise.allSettled([1, 2, 3].map((i) => g.run("h", { a: "plant", i: 4, c: "tomato" }, WINTER + 9e6)));
  assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1);
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("GARDEN ALL OK"); process.exit(0);
})().catch((e) => { Math.random = rnd; console.error("FAIL", e); process.exit(1); });
