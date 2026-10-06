process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=usefn" });
const db = admin.database(); const U = require(F + "use");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
(async () => {
  const NOW = Date.now(), p = (f, x = {}) => ({ username: "u", faction: f, role: "player", banned: false, zone: "safe", hp: 50, food: 50, foodTs: NOW - 10000, water: 50, waterTs: NOW - 10000, stamina: 50, staminaTs: NOW - 10000, ...x });
  await db.ref().set({
    users: { h: p("human"), z: p("zombie"), d: p("human", { hp: 0 }), b: p("human", { banned: true }), a: p("human"), c: p("human"), r: p("human") },
    inventory: {
      h: { canned_food: { id: "canned_food", qty: 2 }, rotten_meat: { id: "rotten_meat", qty: 1 }, mat: { id: "custom_food", qty: 1, name: "วัสดุ", type: "material", food: 10 }, gone: { id: "water", qty: 1 }, bandage: { id: "bandage", qty: 1 } },
      z: { canned_food: { id: "canned_food", qty: 1 }, rotten_meat: { id: "rotten_meat", qty: 2 } }, d: { bandage: { id: "bandage", qty: 1 } }, b: { bandage: { id: "bandage", qty: 1 } },
      a: { moss: { id: "moss", qty: 1 } }, c: { s1: { id: "custom_food", qty: 1, name: "บัฟ", type: "consumable", bmin: 5, b_str: 2 } }, r: { antidote: { id: "antidote", qty: 1 }, moss: { id: "moss", qty: 1 } }
    },
    stats: { c: { str: 1, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 } }, buffs: { c: { bstart: NOW - 1000, mins: 10, str: 1, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 } },
    effects: { r: { poison: { bstart: NOW - 1000, mins: 10, v: 3, tick: NOW } } }
  });
  const u = U.makeUse(db, admin); let r;
  await rej(u.run(null, { slot: "x" }, NOW), "ล็อกอิน"); await rej(u.run("h", { slot: "a/b" }, NOW), "ไม่พบ"); await rej(u.run("h", {}, NOW), "ไม่พบ");
  await rej(u.run("b", { slot: "bandage" }, NOW), "ใช้งานไม่ได้"); await rej(u.run("d", { slot: "bandage" }, NOW), "สลบ"); await rej(u.run("h", { slot: "nope" }, NOW), "ไม่พบไอเทม");
  await rej(u.run("h", { slot: "mat" }, NOW), "ใช้ไม่ได้"); await rej(u.run("h", { slot: "rotten_meat" }, NOW), "ซอมบี้เท่านั้น");
  await rej(u.run("z", { slot: "canned_food" }, NOW), "กินอาหารทั่วไปไม่ลง"); assert.strictEqual((await db.ref("inventory/z/canned_food/qty").get()).val(), 1, "failed use must not consume");
  r = await u.run("z", { slot: "rotten_meat" }, NOW); assert(r.ok && r.msgs.some((m) => m.includes("อาหาร")));
  r = await u.run("h", { slot: "canned_food" }, NOW); assert.deepStrictEqual(r.msgs, ["อาหาร +40"]); assert.strictEqual((await db.ref("inventory/h/canned_food/qty").get()).val(), 1); assert.strictEqual((await db.ref("users/h/food").get()).val(), 90);
  // เต็มแล้ว (ไม่เปลี่ยนอะไร) ต้องไม่หักของ
  await db.ref("users/h").update({ food: 100, foodTs: NOW - 5000 }); await rej(u.run("h", { slot: "canned_food" }, NOW), "เต็มอยู่แล้ว"); assert.strictEqual((await db.ref("inventory/h/canned_food/qty").get()).val(), 1);
  // ชนกันพร้อมกัน: ผ้าพันแผล 1 ชิ้น × 3 คำสั่ง → สำเร็จแค่ครั้งเดียว
  await db.ref("users/h/hp").set(40); const rs = await Promise.allSettled([1, 2, 3].map(() => u.run("h", { slot: "bandage" }, NOW))); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, JSON.stringify(rs.map((x) => x.status))); assert.strictEqual((await db.ref("users/h/hp").get()).val(), 60); assert.strictEqual((await db.ref("inventory/h/bandage").get()).val(), null);
  // บัฟซ้อน: ต้องยืนยันก่อน → ไม่หักของ; ยืนยันแล้วค่อยแทนที่
  r = await u.run("c", { slot: "s1" }, NOW); assert.strictEqual(r.confirm, "buff"); assert((await db.ref("inventory/c/s1").get()).exists());
  r = await u.run("c", { slot: "s1", replaceBuff: true }, NOW); assert(r.ok && r.msgs[0].startsWith("บัฟ")); assert.strictEqual((await db.ref("buffs/c/str").get()).val(), 2); assert.strictEqual((await db.ref("inventory/c/s1").get()).val(), null);
  // พิษแรง: มอสรักษาไม่ได้ ยาแก้พิษรักษาได้
  r = await u.run("r", { slot: "moss" }, NOW); assert(r.msgs.some((m) => m.includes("พิษแรงยังไม่หาย"))); await db.ref("inventory/r/moss").set({ id: "moss", qty: 1 }); await db.ref("users/r/hp").set(100); await rej(u.run("r", { slot: "moss" }, NOW), "พิษแรง"); assert((await db.ref("inventory/r/moss").get()).exists()); r = await u.run("r", { slot: "antidote" }, NOW); assert(r.msgs.includes("หายพิษ")); assert.strictEqual((await db.ref("effects/r/poison").get()).val(), null);
  // ฟื้นฟูไม่เกินเลือดสูงสุด
  await db.ref("users/a/hp").set(95); r = await u.run("a", { slot: "moss" }, NOW); assert.strictEqual((await db.ref("users/a/hp").get()).val(), 100);
  // ---- ไอเทมชุดที่ 2 (ผลพิเศษ)
  await db.ref().update({
    "users/s1": p("human", { hp: 40 }), "users/s2": p("human", { hp: 40 }), "users/s3": p("human", { hp: 40 }), "users/s4": p("zombie", { hp: 40 }), "users/s5": p("human", { hp: 100 }),
    "inventory/s1": { wild_berries: { id: "wild_berries", qty: 1 }, herbal_tea: { id: "herbal_tea", qty: 1 }, regen_gel: { id: "regen_gel", qty: 1 } },
    "inventory/s2": { morphine: { id: "morphine", qty: 1 } }, "inventory/s3": { field_surgery_kit: { id: "field_surgery_kit", qty: 1 }, antiseptic: { id: "antiseptic", qty: 1 } },
    "inventory/s4": { morphine: { id: "morphine", qty: 1 }, canned_tuna: { id: "canned_tuna", qty: 1 } }, "inventory/s5": { mre_pack: { id: "mre_pack", qty: 1 } },
    "stats/s2": { str: 1, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 }, "stats/s4": { str: 1, hp: 0, st: 0, regen: 0, agi: 1, tough: 1 },
    "effects/s1": { stun: { bstart: NOW - 1000, mins: 5, v: 1, tick: NOW } }, "effects/s3": { poison: { bstart: NOW - 1000, mins: 10, v: 3, tick: NOW }, bleed: { bstart: NOW - 1000, mins: 10, v: 2, tick: NOW } }
  });
  r = await u.run("s1", { slot: "wild_berries" }, NOW); assert(r.msgs.some((m) => m.includes("พิษ")) && r.msgs.some((m) => m.startsWith("อาหาร"))); assert.strictEqual((await db.ref("effects/s1/poison/v").get()).val(), 1); assert.strictEqual((await db.ref("effects/s1/poison/mins").get()).val(), 1);
  r = await u.run("s1", { slot: "herbal_tea" }, NOW); assert(r.msgs.includes("หายมึนงง") && r.msgs.some((m) => m.startsWith("ฟื้น"))); assert.strictEqual((await db.ref("effects/s1/stun").get()).val(), null);
  r = await u.run("s1", { slot: "regen_gel" }, NOW); assert(r.msgs[0].includes("ฟื้นฟู")); assert.strictEqual((await db.ref("effects/s1/hot/v").get()).val(), 2);
  // บัฟ/ดีบัฟ: มนุษย์โดนเฉพาะสเตตัสของฝั่งตัวเอง (💪) ซอมบี้โดนทั้ง 💪 และ 💨
  r = await u.run("s2", { slot: "morphine" }, NOW); assert.strictEqual((await db.ref("buffs/s2/str").get()).val(), -2); assert.strictEqual((await db.ref("buffs/s2/agi").get()).val(), -3); assert.strictEqual((await db.ref("users/s2/hp").get()).val(), 100, "heal 90 capped to max 100");
  r = await u.run("s4", { slot: "morphine" }, NOW); assert(r.msgs.some((m) => m.startsWith("บัฟ/ดีบัฟ")));
  await rej(u.run("s4", { slot: "canned_tuna" }, NOW), "กินอาหารทั่วไปไม่ลง");   // ซอมบี้กินอาหารมนุษย์ไม่ได้
  // ชุดผ่าตัดสนาม: รักษาพิษแรง+เลือดไหล, พลังงานลด 20
  r = await u.run("s3", { slot: "field_surgery_kit" }, NOW); assert(r.msgs.includes("หายพิษ") && r.msgs.includes("หายเลือดไหล") && r.msgs.some((m) => m.startsWith("พลังงาน −"))); assert.strictEqual((await db.ref("effects/s3/poison").get()).val(), null);
  r = await u.run("s5", { slot: "mre_pack" }, NOW); assert.deepStrictEqual(r.msgs, ["อาหาร +50", "น้ำ +20"].map((m, i) => r.msgs[i]).slice(0, 2)); assert(r.msgs[0].startsWith("อาหาร +") && r.msgs[1].startsWith("น้ำ +"));
  console.log("USE ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
