// ⚔️ อาวุธติดสถานะ (functions/fxw.js + forge.js): แคตตาล็อกตรงกับ script.js, ค้นเจอ (tune/ถังโทเค็น/เพดานรายวัน/ชั้น×โซน), คราฟต์ (ชั้น 1–2, มนุษย์ Safe Zone, คืนวัตถุดิบ)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=fxw" });
const db = admin.database(); const X = require(F + "functions/fxw"), Fg = require(F + "functions/forge");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), queue = []; const rnd = () => (queue.length ? queue.shift() : 0.999), q = (...v) => { queue.length = 0; queue.push(...v); };
(async () => {
  // ---- แคตตาล็อกฝั่งเกม = ฝั่งเซิร์ฟเวอร์
  const sc = fs.readFileSync(F + "script.js", "utf8"), cut = (a, b) => sc.slice(sc.indexOf(a), sc.indexOf(b, sc.indexOf(a)));
  const FX_TYPES = { bleed: { icon: "🩸", name: "เลือดไหล" }, poison: { icon: "☠️", name: "พิษ" }, hot: {}, stun: { icon: "😵", name: "มึนงง" }, dice: { icon: "🎯", name: "ทอยลูกเต๋า" } };
  const api = new Function("FX_TYPES", "POISON_STRONG", cut("const FXW = {", "\n};") + "\n};\n" + cut("const WFX_TYPES", "\nconst wfxLabel") + "\n" + cut("const fxwSlot", "\n") + "\nreturn { FXW, wfxOf, fxwSlot };")(FX_TYPES, 2);
  assert.deepStrictEqual(api.FXW, X.FXW, "FXW client = server");
  const rules = JSON.parse(fs.readFileSync(F + "database_rules.json", "utf8")).rules, rx = new RegExp(rules.inventory.$uid.$slot[".validate"].match(/matches\(\/(\^\([^/]+\)\$)\//)[1]);
  for (const [k, d] of Object.entries(X.FXW)) {
    assert(k.startsWith("fxw_")); assert.deepStrictEqual(api.fxwSlot(k), X.slotOf(k), "slot " + k);
    const s = X.slotOf(k); assert(s.name.length <= 40 && s.dmg >= 1 && s.dmg <= 999 && s.dur <= 999 && s.type === "weapon" && s.id === "custom" && rx.test("custom"), "rules slot " + k);   // ช่อง custom ผ่านเงื่อนไข inventory validate
    assert(api.wfxOf(s), "wfxOf " + k); assert.strictEqual(s.fx.t === "stun" ? s.fx.m : 1, 1, "stun 1 นาที"); assert(!(d.tier <= 2) === !d.need, "ชั้น 1–2 มีสูตร / ชั้น 3 ไม่มี " + k);
    for (const m of Object.keys(d.need || {})) { assert(new RegExp("^  " + m + ": \\{", "m").test(sc), "ITEMS " + m); assert(rx.test(m), "rules regex " + m); }
  }
  assert.strictEqual(api.wfxOf({ id: "knife", fx: X.FXW.fxw_cleaver.fx }), null); assert.strictEqual(api.wfxOf({ id: "custom", fx: { t: "bleed", v: 4, m: 3, p: 30 } }), null); assert.strictEqual(api.wfxOf({ id: "custom", fx: { t: "dice", v: 1, m: 3, p: 30 } }), null); assert.strictEqual(api.wfxOf({ id: "custom", fx: { t: "stun", v: 1, m: 2, p: 30 } }), null); assert.strictEqual(api.wfxOf({ id: "custom" }), null);
  // ---- ข้อมูล
  const u = (n, f, zone, x = {}) => ({ username: n, faction: f, hp: 80, zone, ...x });
  const mats = { scrap: { id: "scrap", qty: 40 }, leather_scrap: { id: "leather_scrap", qty: 3 }, rusty_nails: { id: "rusty_nails", qty: 6 }, chem: { id: "chem", qty: 3 }, battery_pack: { id: "battery_pack", qty: 1 }, copper_wire: { id: "copper_wire", qty: 2 } };
  const mk = async (tune) => db.ref().set({ users: { h: u("h", "human", "ruins"), s: u("s", "human", "safe"), z: u("z", "zombie", "ruins"), p: u("p", "human", "police"), d: u("d", "human", "ruins", { hp: 0 }), b: u("b", "human", "ruins", { banned: true }) }, inventory: { s: { ...mats } }, tune: tune === undefined ? { fxw_on: 1 } : tune });
  await mk(null);
  const fx = X.makeFxw(db, rnd); let r;
  // ---- ค้นเจอ: ปิดอยู่ / state
  q(0); r = await fx.run("h", { a: "find" }, T0); assert.deepStrictEqual({ on: r.on, got: r.got }, { on: false, got: null }); assert.strictEqual(queue.length, 1);
  assert.deepStrictEqual(await fx.run("h", { a: "state" }, T0), { ok: true, on: false, got: null }); await db.ref("tune/fxw_on").set(1);
  await rej(fx.run(null, { a: "find" }, T0), "ล็อกอิน"); await rej(fx.run("h", { a: "zz" }, T0), "ไม่รู้จัก"); await rej(fx.run("b", { a: "find" }, T0), "ใช้งานไม่ได้"); await rej(fx.run("d", { a: "find" }, T0), "มีชีวิต");
  q(0); r = await fx.run("z", { a: "find" }, T0); assert.strictEqual(r.got, null); assert.strictEqual(queue.length, 1, "ซอมบี้ไม่ทอย"); queue.length = 0;
  q(0); r = await fx.run("s", { a: "find" }, T0); assert.strictEqual(r.got, null); assert.strictEqual(queue.length, 1, "Safe Zone ไม่ทอย"); queue.length = 0;
  // ---- ชั้น 1 ในเมืองร้าง (8‰): ไม่เจอ 0.5 / เจอ 0.007 แล้วสุ่มชิ้นจากชั้น 1
  q(0.5); r = await fx.run("h", { a: "find" }, T0); assert.strictEqual(r.got, null); assert.strictEqual(queue.length, 0, "ทอยชั้น 3, 2 ไม่มีในเมืองร้าง → ทอยชั้น 1 ครั้งเดียว");
  q(0.007, 0.0); r = await fx.run("h", { a: "find" }, T0 + 1000); assert(r.got && r.got.tier === 1 && r.got.key === "fxw_cleaver", JSON.stringify(r.got)); assert.strictEqual(queue.length, 0);
  const slot = (await db.ref(`inventory/h/${r.got.slot}`).get()).val(); assert.deepStrictEqual(slot, X.slotOf("fxw_cleaver"));
  assert.deepStrictEqual((await db.ref("fxwday/h").get()).val(), { d: Math.floor((T0 + 1000 + 25200000) / 86400000), n: 1 });
  // ---- สถานีตำรวจ: ทอยชั้น 3 ก่อน (2‰) → ได้ชิ้นชั้น 3 • ชั้น 3 ไม่ผ่านแต่ชั้น 2 ผ่าน (6‰)
  q(0.0019, 0.5); r = await fx.run("p", { a: "find" }, T0); assert(r.got && r.got.tier === 3 && ["fxw_chainsaw", "fxw_taser", "fxw_plague"].includes(r.got.key)); assert.strictEqual(queue.length, 0);
  q(0.9, 0.005, 0.99); r = await fx.run("p", { a: "find" }, T0 + 1000); assert(r.got && r.got.tier === 2); assert.strictEqual(queue.length, 0);
  // ---- fxw_rate: 0 = ไม่เจอ / 500 = ครึ่งหนึ่ง (เจอ 0.007 ที่ 8‰×0.5=4‰ ไม่เจอ)
  await db.ref("tune/fxw_rate").set(0); q(0.0); r = await fx.run("h", { a: "find" }, T0 + 2000); assert.strictEqual(r.got, null); queue.length = 0;
  await db.ref("tune/fxw_rate").set(50); q(0.007); r = await fx.run("h", { a: "find" }, T0 + 3000); assert.strictEqual(r.got, null); await db.ref("tune/fxw_rate").remove();
  // ---- เพดานรายวัน 3 ชิ้น
  await db.ref("fxwday/h").set({ d: Math.floor((T0 + 25200000) / 86400000), n: 3 }); q(0.0); r = await fx.run("h", { a: "find" }, T0 + 4000); assert.strictEqual(r.capped, true); queue.length = 0;
  r = await fx.run("h", { a: "find" }, T0 + 86400000); assert(!r.capped, "วันใหม่รีเซ็ต");
  // ---- ถังโทเค็น 12 ครั้ง / เติม 1 ต่อ 12 วิ
  await db.ref("fxwrl").remove(); await db.ref("fxwday").remove();
  for (let i = 0; i < 12; i++) { q(0.9, 0.9, 0.9); r = await fx.run("h", { a: "find" }, T0 + 9e6); assert(!r.limited, "i=" + i); }
  q(0.0); r = await fx.run("h", { a: "find" }, T0 + 9e6); assert.strictEqual(r.limited, true); queue.length = 0;
  q(0.9); r = await fx.run("h", { a: "find" }, T0 + 9e6 + 12000); assert(!r.limited);
  // ---- คราฟต์ผ่าน forge (ต้องเปิด tune, มนุษย์, Safe Zone, ชั้น 1–2)
  const fg = Fg.makeForge(db); await mk(null);
  await rej(fg.run("s", { a: "craft", id: "fxw_cleaver" }, T0), "ยังไม่เปิด"); await db.ref("tune/fxw_on").set(1);
  await rej(fg.run("s", { a: "craft", id: "fxw_chainsaw" }, T0), "ไม่มี"); await rej(fg.run("s", { a: "craft", id: "fxw_nope" }, T0), "ไม่มี");
  await rej(fg.run("h", { a: "craft", id: "fxw_cleaver" }, T0), "Safe Zone"); await rej(fg.run("z", { a: "craft", id: "fxw_cleaver" }, T0), "มนุษย์"); await rej(fg.run("d", { a: "craft", id: "fxw_cleaver" }, T0), "มีชีวิต"); await rej(fg.run("b", { a: "craft", id: "fxw_cleaver" }, T0), "ใช้งานไม่ได้");
  r = await fg.run("s", { a: "craft", id: "fxw_cleaver" }, T0); assert(r.ok && r.id === "fxw_cleaver" && r.slot.startsWith("f_"));
  assert.deepStrictEqual((await db.ref(`inventory/s/${r.slot}`).get()).val(), X.slotOf("fxw_cleaver")); assert.strictEqual((await db.ref("inventory/s/scrap/qty").get()).val(), 32); assert.strictEqual((await db.ref("inventory/s/leather_scrap/qty").get()).val(), 2); assert.strictEqual((await db.ref("inventory/s/rusty_nails/qty").get()).val(), 4);
  // วัตถุดิบไม่พอ → คืนของที่หักไปแล้ว: ขวานผ่าซากต้อง steel_plate (ไม่มี)
  const before = JSON.stringify((await db.ref("inventory/s").get()).val()); await rej(fg.run("s", { a: "craft", id: "fxw_ripaxe" }, T0 + 1000), "ไม่พอ"); assert.strictEqual(JSON.stringify((await db.ref("inventory/s").get()).val()), before, "refunded");
  r = await fg.run("s", { a: "craft", id: "fxw_venom" }, T0 + 2000); assert.strictEqual((await db.ref(`inventory/s/${r.slot}/fx/t`).get()).val(), "poison");
  r = await fg.run("s", { a: "craft", id: "fxw_stunbat" }, T0 + 3000); assert.strictEqual((await db.ref(`inventory/s/${r.slot}/fx/m`).get()).val(), 1);
  // สูตรเดิมยังทำงานปกติ
  await db.ref("inventory/s/scrap").set({ id: "scrap", qty: 30 }); r = await fg.run("s", { a: "craft", id: "wooden_bat" }, T0 + 4000); assert(r.ok);
  console.log("FXW OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
