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
  // ===== ⬆️ อัปเกรดสวน (แยกตามฝ่าย / ผสม 4 แบบ)
  { Math.random = rnd;
    for (const fac of ["human", "zombie"]) { assert.strictEqual(G.UP[fac].length, G.UP_MAX); let prev = { p: 0, g: 0, b: 0, m: 0 };
      G.UP[fac].forEach((t, i) => { Object.keys(prev).forEach((k) => assert(t.eff[k] >= prev[k], `${fac} L${i + 1} ${k} must not decrease`)); prev = t.eff; t.cost.forEach(([id, q]) => { assert(q >= 1 && q <= 99, "cost cap " + id); assert(new RegExp("^  " + id + ": \\{", "m").test(sc) && wl.test(id), "cost item exists " + fac + " " + id); }); });
      assert(G.UP[fac].some((t) => t.eff.p > 0) && G.UP[fac].some((t) => t.eff.b > 0), fac + " mixed: plots + bonus"); }
    assert(G.UP.human.some((t) => t.eff.g > 0) && G.UP.zombie.some((t) => t.eff.m > 0), "human: faster / zombie: mutation");
    assert.deepStrictEqual(G.UP.human.at(-1).eff, G.upEff("human", 5)); assert.deepStrictEqual(G.upEff("human", 0), { p: 0, g: 0, b: 0, m: 0 }); assert.deepStrictEqual(G.upEff("zombie", 99), G.UP.zombie[4].eff);
    // ไม่ใช่ซอมบี้ใช้ต้นทุนของมนุษย์ไม่ได้: ซอมบี้ไม่ใช้ scrap/chem (ค้นแล้วทิ้ง)
    for (const t of G.UP.zombie) t.cost.forEach(([id]) => assert(!["scrap", "chem"].includes(id), "zombie cost must not need scrap/chem"));
    await db.ref().update({ "users/u1": { username: "u1", faction: "human", hp: 80, zone: "safe" }, "users/u2": { username: "u2", faction: "zombie", hp: 80, zone: "safe" }, "users/u3": { username: "u3", faction: "human", hp: 80, zone: "ruins" }, "users/u4": { username: "u4", faction: "human", hp: 80, zone: "safe" }, "base/u1": { lv: 1 }, "base/u2": { lv: 1 }, "base/u3": { lv: 1 }, "base/u4": { lv: 0 } });
    let u = await g.run("u1", { a: "state" }, NOW); assert.strictEqual(u.up.lv, 0); assert.strictEqual(u.n, 4); assert.strictEqual(u.up.next.cost[0][0], "scrap"); assert.strictEqual(u.up.tiers.length, 5);
    await rej(g.run("u1", { a: "upgrade" }, NOW), "ของไม่พอ"); await rej(g.run("u3", { a: "upgrade" }, NOW), "Safe Zone"); await rej(g.run("u4", { a: "upgrade" }, NOW), "ที่พักขั้น 1");
    await db.ref("inventory/u1").set({ scrap: { id: "scrap", qty: 99 }, rope_coil: { id: "rope_coil", qty: 1 }, herb_bundle: { id: "herb_bundle", qty: 9 }, chem: { id: "chem", qty: 9 }, steel_plate: { id: "steel_plate", qty: 9 }, battery_pack: { id: "battery_pack", qty: 9 } });
    u = await g.run("u1", { a: "upgrade" }, NOW); assert.strictEqual(u.lv, 1); assert.strictEqual(u.n, 5, "+1 plot"); assert.strictEqual(u.plots.length, 5); assert.strictEqual((await db.ref("inventory/u1/scrap/qty").get()).val(), 69); assert.strictEqual((await db.ref("garden/u1/u").get()).val(), 1);
    // ระดับ 2 ต้องใช้ rope_coil 2 (มี 1) → ไม่หักอะไร (คืนของที่หักไปแล้ว)
    await rej(g.run("u1", { a: "upgrade" }, NOW), "ของไม่พอ"); assert.strictEqual((await db.ref("inventory/u1/scrap/qty").get()).val(), 69, "rollback scrap"); assert.strictEqual((await db.ref("garden/u1/u").get()).val(), 1);
    await db.ref("inventory/u1/rope_coil").set({ id: "rope_coil", qty: 2 });
    u = await g.run("u1", { a: "upgrade" }, NOW); assert.strictEqual(u.lv, 2); assert.strictEqual(u.n, 5); assert.strictEqual(u.up.eff.g, 6);
    // เวลาโตลดลง 6% ตอนปลูกหลังอัปเกรด (ฤดูฝน herb = 45 นาที × 0.7)
    await db.ref("garden/u1/seed/herb").set(1); u = await g.run("u1", { a: "plant", i: 1, c: "herb" }, NOW); assert.strictEqual(u.plots[0].total, Math.round(45 * MIN * 0.7 * 0.94)); assert.strictEqual(u.crops.herb.g, Math.round(45 * MIN * 0.7 * 0.94));
    // กดซ้อนพร้อมกัน: ระดับขึ้นแค่ 1 (ระดับ 3 ต้อง scrap 60 + herb 6 + chem 3; ใส่ของพอสำหรับ 2 ครั้ง)
    await db.ref("inventory/u1").update({ scrap: { id: "scrap", qty: 99 }, herb_bundle: { id: "herb_bundle", qty: 99 }, chem: { id: "chem", qty: 99 } });
    const rs2 = await Promise.allSettled([1, 2, 3].map(() => g.run("u1", { a: "upgrade" }, NOW))); assert.strictEqual(rs2.filter((x) => x.status === "fulfilled").length, 1, "one upgrade only"); assert.strictEqual((await db.ref("garden/u1/u").get()).val(), 3);
    assert.strictEqual((await db.ref("inventory/u1/scrap/qty").get()).val(), 99 - 60, "paid once");
    // ถึงระดับสูงสุด: ระดับ 4 (แปลง +2 รวม 6) และ 5 แล้วอัปต่อไม่ได้
    await db.ref("inventory/u1").update({ scrap: { id: "scrap", qty: 99 }, steel_plate: { id: "steel_plate", qty: 9 }, battery_pack: { id: "battery_pack", qty: 9 } });
    u = await g.run("u1", { a: "upgrade" }, NOW + 1000); assert.strictEqual(u.n, 6); await db.ref("inventory/u1/scrap").set({ id: "scrap", qty: 99 }); u = await g.run("u1", { a: "upgrade" }, NOW + 2000); assert.strictEqual(u.lv, 5); assert.strictEqual(u.up.next, null); assert.strictEqual(u.n, 6);
    await rej(g.run("u1", { a: "upgrade" }, NOW + 3000), "ระดับสูงสุด");
    // โอกาสได้เพิ่ม +1 ชิ้น (ระดับ 5 = 20%): สุ่มต่ำ → ได้ +1, สุ่มสูง → ไม่ได้ (ใส่ปุ๋ยกันศัตรูพืชไม่ให้ปนผล)
    const put = async (c) => { await db.ref("garden/u1/p/2").set({ c, t: NOW, e: NOW, w: 0, f: 1 }); };
    await db.ref("inventory/u1/herb_bundle").set({ id: "herb_bundle", qty: 10 }); await put("herb"); Math.random = () => 0.05; let hv = await g.run("u1", { a: "harvest", i: 2 }, NOW + 5000); assert(hv.got.some(([id, q]) => id === "herb_bundle" && q === 3 + 1 + 1), "fert +1 and upgrade bonus +1: " + JSON.stringify(hv.got));
    await db.ref("inventory/u1/herb_bundle").set({ id: "herb_bundle", qty: 10 }); await put("herb"); let calls = 0; Math.random = () => (calls++ === 0 ? 0.9 : 0.99); hv = await g.run("u1", { a: "harvest", i: 2 }, NOW + 6000); assert(hv.got.some(([id, q]) => id === "herb_bundle" && q === 4), "no bonus when roll high: " + JSON.stringify(hv.got)); Math.random = rnd;
    // ซอมบี้: ทางอัปเกรดของตัวเอง ใช้เนื้อเน่า (ไม่ใช่ scrap) และโอกาสกลายพันธุ์เพิ่ม
    u = await g.run("u2", { a: "state" }, NOW); assert.deepStrictEqual(u.up.next.cost, [["rotten_meat", 30]]); assert.strictEqual(u.up.tiers[0].d, "แปลง +1");
    await db.ref("inventory/u2").set({ rotten_meat: { id: "rotten_meat", qty: 99 }, water: { id: "water", qty: 9 }, mutant_gland: { id: "mutant_gland", qty: 9 } });
    u = await g.run("u2", { a: "upgrade" }, NOW); assert.strictEqual(u.n, 5); u = await g.run("u2", { a: "upgrade" }, NOW); assert.strictEqual(u.lv, 2); assert.strictEqual(u.up.eff.b, 15);
    await db.ref("inventory/u2/rotten_meat").set({ id: "rotten_meat", qty: 99 }); u = await g.run("u2", { a: "upgrade" }, NOW); assert.strictEqual(u.up.eff.m, 4); assert.strictEqual((await db.ref("inventory/u2/mutant_gland/qty").get()).val(), 8);
    // ซอมบี้กลายพันธุ์ที่ระดับ 3: เกณฑ์ MUTATE 8% + 4% = 12% → สุ่ม 0.10 ได้ของแถม (ระดับ 0 จะไม่ได้)
    await db.ref("garden/u2/p/1").set({ c: "fungus", t: NOW, e: NOW, w: 0, f: 1 }); calls = 0; Math.random = () => (calls++ === 0 ? 0.99 : 0.10); hv = await g.run("u2", { a: "harvest", i: 1 }, NOW + 7000); assert(hv.notes.some((n) => n.includes("กลายพันธุ์")), "mutation at 10% roll with upgrade: " + JSON.stringify(hv)); Math.random = rnd;
    await db.ref("garden/u2/p/1").set({ c: "fungus", t: NOW, e: NOW, w: 0, f: 1 }); await db.ref("garden/u2/u").set(0); calls = 0; Math.random = () => (calls++ === 0 ? 0.99 : 0.10); hv = await g.run("u2", { a: "harvest", i: 1 }, NOW + 8000); assert(!hv.notes.some((n) => n.includes("กลายพันธุ์")), "no mutation at 10% roll without upgrade"); Math.random = rnd; }
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("GARDEN ALL OK"); process.exit(0);
})().catch((e) => { Math.random = rnd; console.error("FAIL", e); process.exit(1); });
