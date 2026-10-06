process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert"), fs = require("fs");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=forge" });
const db = admin.database(); const Fg = require(F + "forge");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
(async () => {
  // สูตร/ความทน ต้องตรงกับ script.js
  const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
  const blk = sc.slice(sc.indexOf("const RECIPES = {"), sc.indexOf("};", sc.indexOf("const RECIPES = {")) + 2);
  const clientR = new Function(blk + "; return RECIPES;")(), srv = Object.entries(clientR).filter(([, r]) => r.srv);
  assert.deepStrictEqual(srv.map(([k]) => k).sort(), Object.keys(Fg.RECIPES).sort());
  for (const [k, r] of srv) { assert.deepStrictEqual(r.need, Fg.RECIPES[k].need, "recipe " + k); assert.strictEqual(r.out, k); const m = sc.match(new RegExp("^  " + k + ": \\{[^}]*maxDur: (\\d+)", "m")); assert.strictEqual(Number(m[1]), Fg.DUR[k], "dur " + k); const d = sc.match(new RegExp("^  " + k + ": \\{[^}]*dmg: (\\d+)", "m")); assert(Number(d[1]) <= 22, "dmg cap " + k); }
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
  const ws = Object.values((await db.ref("inventory/h").get()).val()).filter((x) => x.dur); assert.strictEqual(ws.length, 2);
  console.log("FORGE ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
