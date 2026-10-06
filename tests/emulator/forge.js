process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert"), fs = require("fs");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=forge" });
const db = admin.database(); const Fg = require(F + "forge");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), p0 = (f, zone, x = {}) => ({ username: "u", faction: f, hp: 80, zone, ...x });
(async () => {
  // สูตร/ความทน ต้องตรงกับ script.js
  const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
  const blk = sc.slice(sc.indexOf("const RECIPES = {"), sc.indexOf("};", sc.indexOf("const RECIPES = {")) + 2);
  const clientR = new Function(blk + "; return RECIPES;")(), srv = Object.entries(clientR).filter(([, r]) => r.srv);
  assert.deepStrictEqual(srv.map(([k]) => k).sort(), Object.keys(Fg.RECIPES).sort());
  for (const [k, r] of srv) {
    assert.deepStrictEqual(r.need, Fg.RECIPES[k].need, "recipe " + k); assert.strictEqual(r.out, k); assert.strictEqual(r.qty, Fg.RECIPES[k].qty || 1, "qty " + k);
    if (Fg.DUR[k]) { const m = sc.match(new RegExp("^  " + k + ": \\{[^}]*maxDur: (\\d+)", "m")); assert.strictEqual(Number(m[1]), Fg.DUR[k], "dur " + k); const d = sc.match(new RegExp("^  " + k + ": \\{[^}]*dmg: (\\d+)", "m")); assert(Number(d[1]) <= 22, "dmg cap " + k); }
    else { assert(new RegExp("^  " + k + ": \\{", "m").test(sc), "item exists " + k); for (const m of Object.keys(r.need)) assert(new RegExp("^  " + m + ": \\{", "m").test(sc), "material exists " + m); }
  }
  const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules; for (const k of Object.keys(Fg.RECIPES)) assert(rules.inventory.$uid.$slot[".validate"].includes(k), "id in rules " + k);
  const u = (n, f, zone, extra = {}) => ({ username: n, faction: f, hp: 80, zone, ...extra });
  const mats = { scrap: { id: "scrap", qty: 30 }, steel_plate: { id: "steel_plate", qty: 1 }, rope_coil: { id: "rope_coil", qty: 5 } };
  await db.ref().set({ users: { h: u("h", "human", "safe"), z: u("z", "zombie", "safe"), f: u("f", "human", "forest"), d: u("d", "human", "safe", { hp: 0 }), b: u("b", "human", "safe", { banned: true }) }, inventory: { h: { ...mats }, z: { scrap: { id: "scrap", qty: 30 } }, f: { scrap: { id: "scrap", qty: 30 } }, d: { scrap: { id: "scrap", qty: 30 } }, b: { scrap: { id: "scrap", qty: 30 } } } });
  const fg = Fg.makeForge(db); let r;
  await rej(fg.run(null, { a: "craft", id: "wooden_bat" }, T0), "ล็อกอิน"); await rej(fg.run("h", { a: "craft", id: "pistol" }, T0), "ไม่มี"); await rej(fg.run("h", { a: "zz" }, T0), "ไม่รู้จัก");
  await rej(fg.run("z", { a: "craft", id: "wooden_bat" }, T0), "มนุษย์"); await rej(fg.run("f", { a: "craft", id: "wooden_bat" }, T0), "Safe Zone"); await rej(fg.run("d", { a: "craft", id: "wooden_bat" }, T0), "ชีวิต"); await rej(fg.run("b", { a: "craft", id: "wooden_bat" }, T0), "ใช้งานไม่ได้");
  r = await fg.run("h", { a: "craft", id: "wooden_bat" }, T0); assert(r.ok && r.id === "wooden_bat");
  assert.deepStrictEqual((await db.ref(`inventory/h/${r.slot}`).get()).val(), { id: "wooden_bat", qty: 1, dur: 20 }); assert.strictEqual((await db.ref("inventory/h/scrap/qty").get()).val(), 22);
  // วัตถุดิบไม่พอ → ไม่หักอะไร (คืนของที่หักไปแล้ว): crossbow ต้อง scrap12+rope2+steel1 → ทำได้ 1 ครั้ง ครั้งที่ 2 steel หมด
  r = await fg.run("h", { a: "craft", id: "crossbow" }, T0 + 1000); assert((await db.ref("inventory/h/steel_plate").get()).val() === null && (await db.ref("inventory/h/scrap/qty").get()).val() === 10 && (await db.ref("inventory/h/rope_coil/qty").get()).val() === 3);
  await rej(fg.run("h", { a: "craft", id: "fire_axe" }, T0 + 2000), "ไม่พอ"); assert.strictEqual((await db.ref("inventory/h/scrap/qty").get()).val(), 10, "refunded");
  await rej(fg.run("h", { a: "craft", id: "crossbow" }, T0 + 3000), "ไม่พอ"); assert.strictEqual((await db.ref("inventory/h/rope_coil/qty").get()).val(), 3, "refunded rope"); assert.strictEqual((await db.ref("inventory/h/scrap/qty").get()).val(), 10);
  // ของซ้อนช่อง: ผ้าก๊อซ 1 ชุด = 2 ชิ้น / เกราะ = 1 ชิ้น ซ้อนตามรหัส
  await db.ref("inventory/h").update({ cloth_roll: { id: "cloth_roll", qty: 4 }, scrap: { id: "scrap", qty: 3 }, duct_tape: { id: "duct_tape", qty: 3 } });
  r = await fg.run("h", { a: "craft", id: "gauze_roll" }, T0 + 4000); assert.deepStrictEqual({ id: r.id, qty: r.qty }, { id: "gauze_roll", qty: 2 }); r = await fg.run("h", { a: "craft", id: "gauze_roll" }, T0 + 5000); assert.strictEqual((await db.ref("inventory/h/gauze_roll/qty").get()).val(), 4);
  r = await fg.run("h", { a: "craft", id: "cardboard_armor" }, T0 + 6000); assert.strictEqual((await db.ref("inventory/h/cardboard_armor/qty").get()).val(), 1); assert.strictEqual((await db.ref("inventory/h/cloth_roll").get()).val(), null, "cloth used up");
  // ช่องเต็ม 99 → คืนวัตถุดิบ ไม่หักของ
  await db.ref("inventory/h").update({ gauze_roll: { id: "gauze_roll", qty: 99 }, cloth_roll: { id: "cloth_roll", qty: 2 }, scrap: { id: "scrap", qty: 2 } }); await rej(fg.run("h", { a: "craft", id: "gauze_roll" }, T0 + 7000), "เต็ม"); assert.strictEqual((await db.ref("inventory/h/cloth_roll/qty").get()).val(), 2); assert.strictEqual((await db.ref("inventory/h/scrap/qty").get()).val(), 2);
  await db.ref("inventory/h").update({ gauze_roll: null });
  const ws = Object.values((await db.ref("inventory/h").get()).val()).filter((x) => x.dur); assert.strictEqual(ws.length, 2);
  // ---- รื้อเกราะตามระดับความหายาก
  { const i = sc.indexOf("const SALV_PCT = "), j = sc.indexOf("function armorSalv(it)"); const cli = new Function(sc.slice(i, j) + "; return { SALV_PCT, ARMOR_SALV };")();
    assert.deepStrictEqual(cli.SALV_PCT, Fg.SALV_PCT); assert.deepStrictEqual(cli.ARMOR_SALV, Fg.ARMOR_SALV, "client/server armor table");
    for (const [k, a] of Object.entries(Fg.ARMOR_SALV)) { assert(new RegExp("^  " + k + ": \\{[^}]*type: \"gear\"", "m").test(sc), "armor exists " + k); assert(!a.m.chem, "no chem"); assert(rules.inventory.$uid.$slot[".validate"].includes(k), "rules id " + k); for (const m of Object.keys(a.m)) assert(new RegExp("^  " + m + ": \\{", "m").test(sc), "mat " + m); }
    // ยิ่งหายากยิ่งคืนเป็นสัดส่วนมาก (รวมทุกชิ้น เทียบกับวัสดุรวม)
    const ratio = (k) => Fg.salvageOf(k).reduce((t, [, q]) => t + q, 0) / Object.values(Fg.ARMOR_SALV[k].m).reduce((t, q) => t + q, 0), avg = (rar) => { const ks = Object.keys(Fg.ARMOR_SALV).filter((k) => Fg.ARMOR_SALV[k].r === rar); return ks.reduce((t, k) => t + ratio(k), 0) / ks.length; };
    assert(avg("C") < avg("U") && avg("U") < avg("R") && avg("R") < avg("E"), "rarity order " + ["C", "U", "R", "E"].map(avg)); }
  await db.ref().update({ "users/f2": p0("zombie", "safe"), "users/f3": p0("human", "forest"), "users/f4": p0("human", "safe", { arm: "kevlar_vest" }), "users/f5": p0("human", "safe"),
    "inventory/h": { kevlar_vest: { id: "kevlar_vest", qty: 2 }, cloth_roll: { id: "cloth_roll", qty: 98 }, bomb_suit: { id: "bomb_suit", qty: 1 }, leather_jacket: { id: "leather_jacket", qty: 1 } },
    "inventory/f2": { kevlar_vest: { id: "kevlar_vest", qty: 1 } }, "inventory/f3": { kevlar_vest: { id: "kevlar_vest", qty: 1 } }, "inventory/f4": { kevlar_vest: { id: "kevlar_vest", qty: 1 } }, "inventory/f5": { kevlar_vest: { id: "kevlar_vest", qty: 1 }, hunter_cloak: { id: "hunter_cloak", qty: 1 } } });
  await rej(fg.run("h", { a: "dismantle", slot: "scrap" }, T0), "รื้อเกราะชิ้นนี้ไม่ได้"); await rej(fg.run("h", { a: "dismantle", slot: "../x" }, T0), "รื้อเกราะชิ้นนี้ไม่ได้");
  await rej(fg.run("f2", { a: "dismantle", slot: "kevlar_vest" }, T0), "มนุษย์"); await rej(fg.run("f3", { a: "dismantle", slot: "kevlar_vest" }, T0), "Safe Zone"); await rej(fg.run("f4", { a: "dismantle", slot: "kevlar_vest" }, T0), "ถอดเกราะ"); await rej(fg.run("h", { a: "dismantle", slot: "hunter_cloak" }, T0), "ไม่พบ");
  r = await fg.run("h", { a: "dismantle", slot: "kevlar_vest" }, T0 + 10000);   // เคฟลาร์ (หายาก 75%): cloth 3 (ช่อง 98 → ใส่ได้ 1, หาย 2) steel 1 tape 1
  assert.deepStrictEqual(r.got.map((x) => x[0]).sort(), ["cloth_roll", "duct_tape", "steel_plate"].sort()); assert.strictEqual((await db.ref("inventory/h/cloth_roll/qty").get()).val(), 99); assert.deepStrictEqual(r.lost, [["cloth_roll", 2]]); assert.strictEqual((await db.ref("inventory/h/kevlar_vest/qty").get()).val(), 1);
  r = await fg.run("f5", { a: "dismantle", slot: "hunter_cloak" }, T0 + 20000); assert.deepStrictEqual(r.got, [["leather_scrap", 3], ["herb_bundle", 1]]); assert.strictEqual((await db.ref("inventory/f5/hunter_cloak").get()).val(), null);
  await db.ref("tune/salv_pct").set(0); await rej(fg.run("f5", { a: "dismantle", slot: "kevlar_vest" }, T0 + 30000), "ต่ำเกินไป"); assert((await db.ref("inventory/f5/kevlar_vest").get()).exists(), "no consume when yield 0"); await db.ref("tune/salv_pct").set(50);
  r = await fg.run("f5", { a: "dismantle", slot: "kevlar_vest" }, T0 + 40000); assert.deepStrictEqual(r.got.map((x) => x.join(":")), ["cloth_roll:1", "steel_plate:1", "duct_tape:1"].filter((_, i) => i < r.got.length)); await db.ref("tune/salv_pct").remove();
  console.log("FORGE ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
