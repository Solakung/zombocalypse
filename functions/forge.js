// 🔨 คราฟต์อาวุธ + ยา/เครื่องดื่ม/เกราะ/อุปกรณ์ชุดที่ 2 (มนุษย์ ที่ Safe Zone) — สูตรอยู่ฝั่งเซิร์ฟเวอร์ ไม่แตะ rules
// - เหตุผล: rules ตรวจสูตรคราฟต์ของไอเทมสิ้นเปลือง (RECIPES เดิม) แต่ช่องอาวุธมีรหัสฝังอยู่หลายจุด; อาวุธที่คราฟต์ได้จึงทำผ่านฟังก์ชัน (Admin SDK สร้างช่องอาวุธเอง)
// - เฉพาะอาวุธระดับต้น–กลาง (ดาเมจ ≤ 22) — ปืนพก/ลูกซอง/ซามูไร/มีดห้องแล็บยังต้องหาจากการค้น/ดรอป • สูตรทั้งหมดต้องตรงกับ RECIPES ที่มี srv:true ใน script.js (มีเทสต์เทียบ)
// - ได้อาวุธเต็มความทน (dur = ค่าตั้งต้นของชนิดนั้น) ช่องคีย์ f_<ms><สุ่ม> • ถ้าสร้างช่องไม่ได้จะคืนวัตถุดิบ
const crypto = require("crypto");
const { fail, withLock, takeItem, addCapped } = require("./lib");
const { FXW, giveWeapon } = require("./fxw");

// out → ความทนตั้งต้น (ต้องตรง ITEMS[..].maxDur ในเกม)
const DUR = { wooden_bat: 20, pocket_knife: 30, crowbar: 30, knife: 25, spiked_bat: 18, fire_axe: 16, crossbow: 14 };
const RECIPES = {
  wooden_bat: { need: { scrap: 8 } },
  pocket_knife: { need: { scrap: 6, leather_scrap: 1 } },
  crowbar: { need: { scrap: 10, duct_tape: 1 } },
  knife: { need: { scrap: 8, leather_scrap: 1, duct_tape: 1 } },
  spiked_bat: { need: { scrap: 8, rusty_nails: 3 } },
  fire_axe: { need: { scrap: 14, steel_plate: 1 } },
  crossbow: { need: { scrap: 12, rope_coil: 2, steel_plate: 1 } },
  // สูตรเดิมของไอเทมสิ้นเปลือง (เคยเป็นกิ่ง rules ฝั่งไคลเอนต์ — ย้ายมาทำที่ฟังก์ชันแล้ว ตัดกิ่งออกจาก rules)
  bandage: { need: { scrap: 2 } }, antidote: { need: { chem: 2, scrap: 1 } }, trauma_kit: { need: { medkit: 1, bandage: 2, chem: 1 } }, soup: { need: { canned_food: 1, water: 1 } },
  stim_shot: { need: { chem: 3, energy_drink: 1 } }, rag_vest: { need: { scrap: 5 } }, scrap_plate: { need: { scrap: 10, chem: 2 } }, headlamp: { need: { scrap: 4, energy_drink: 1 } },
  toolkit: { need: { scrap: 6, chem: 1 } }, exp_serum: { need: { lab_sample: 2, chem: 2 } }, fish_grill: { need: { fish: 1, scrap: 1 } }, fish_stew: { need: { fish: 2, water: 1, canned_food: 1 } },
  // ไอเทมชุดที่ 2 ตามสูตรใน items.draft.json: ยา/เครื่องดื่ม/เกราะ/อุปกรณ์ (ไม่ใช่อาวุธ → ซ้อนช่องตามรหัส ได้ตามจำนวน qty)
  gauze_roll: { need: { cloth_roll: 1, scrap: 1 }, qty: 2 },
  antiseptic: { need: { chem: 1, herb_bundle: 1 } },
  painkillers: { need: { herb_bundle: 2, chem: 1 } },
  suture_kit: { need: { cloth_roll: 1, copper_wire: 1, antiseptic: 1 } },
  herbal_salve: { need: { herb_bundle: 3, water: 1 } },
  herbal_tea: { need: { herb_bundle: 1, water: 1 } },
  regen_gel: { need: { chem_catalyst: 1, antiseptic: 1, water: 1 } },
  cardboard_armor: { need: { cloth_roll: 2, duct_tape: 2 } },
  leather_jacket: { need: { leather_scrap: 4, cloth_roll: 1 } },
  hunter_cloak: { need: { leather_scrap: 6, herb_bundle: 2, rope_coil: 1 } },
  welder_apron: { need: { leather_scrap: 3, steel_plate: 1, cloth_roll: 2 } },
  diver_suit: { need: { rope_coil: 2, cloth_roll: 3, fuel_can: 1 } },
  kevlar_vest: { need: { cloth_roll: 4, steel_plate: 2, duct_tape: 2 } },
  compass: { need: { battery_pack: 1, copper_wire: 1, steel_plate: 1 } },
  earplugs: { need: { cloth_roll: 1, duct_tape: 1 } },
  survival_bracelet: { need: { rope_coil: 1, duct_tape: 1, scrap: 2 } },
  night_goggles: { need: { circuit_board: 1, battery_pack: 2, steel_plate: 1, leather_scrap: 1 } }
};

// ♻️ รื้อเกราะ (มนุษย์ ที่ Safe Zone): ได้วัสดุคืนตาม "ระดับความหายาก" — ยิ่งหายากยิ่งคืนมาก (ธรรมดา 50% • ไม่ธรรมดา 60% • หายาก 75% • ตำนาน 90% ของวัสดุประกอบ ปัดลง ขั้นต่ำ 1 ชิ้นของวัสดุหลัก)
// - ไม่คืนสารเคมี (เหมือนเดิม) • tune salv_pct (0–100, ค่าตั้งต้น 100) คูณอัตราทั้งหมด • วัสดุที่ช่องเต็ม 99 ส่วนเกินหาย (บอกในผลลัพธ์ว่า lost)
// - ต้องตรง ARMOR_SALV ใน script.js (มีเทสต์เทียบ) • เกราะ custom ของแอดมินไม่อยู่ในตาราง รื้อไม่ได้
const SALV_PCT = { C: 0.5, U: 0.6, R: 0.75, E: 0.9 };
const ARMOR_SALV = {
  rag_vest: { r: "C", m: { scrap: 5 } }, scrap_plate: { r: "U", m: { scrap: 10 } }, riot_vest: { r: "U", m: { scrap: 8, cloth_roll: 2 } }, army_vest: { r: "R", m: { scrap: 12, steel_plate: 1, cloth_roll: 2 } },
  cardboard_armor: { r: "C", m: { cloth_roll: 2, duct_tape: 2 } }, leather_jacket: { r: "C", m: { leather_scrap: 4, cloth_roll: 1 } }, hunter_cloak: { r: "U", m: { leather_scrap: 6, herb_bundle: 2, rope_coil: 1 } },
  welder_apron: { r: "U", m: { leather_scrap: 3, steel_plate: 1, cloth_roll: 2 } }, diver_suit: { r: "U", m: { rope_coil: 2, cloth_roll: 3, fuel_can: 1 } }, hazmat_suit: { r: "U", m: { scrap: 15, cloth_roll: 3 } },
  kevlar_vest: { r: "R", m: { cloth_roll: 4, steel_plate: 2, duct_tape: 2 } }, bomb_suit: { r: "E", m: { steel_plate: 6, cloth_roll: 5, circuit_board: 1 } }
};
function salvageOf(id, pct = 100) {
  const a = ARMOR_SALV[id]; if (!a) return null;
  const k = SALV_PCT[a.r] * Math.max(0, Math.min(100, pct)) / 100, out = [];
  Object.entries(a.m).forEach(([m, n], i) => { const q = Math.max(i === 0 && k > 0 ? 1 : 0, Math.floor(n * k + 1e-9)); if (q > 0) out.push([m, q]); });
  return out;
}

function makeForge(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "state") return { ok: true, recipes: RECIPES };
    if (a === "dismantle") return dismantle(uid, data, now);
    if (a !== "craft") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const id = String((data && data.id) || ""), r = RECIPES[id];
    if (id.startsWith("fxw_")) return craftFxw(uid, id, now);   // อาวุธติดสถานะ (functions/fxw.js)
    if (!r) fail("invalid-argument", "สูตรนี้ไม่มี");
    return withLock(db, uid, now, async () => {
      const p = (await db.ref(`users/${uid}`).get()).val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      if (p.faction !== "human") fail("failed-precondition", "เฉพาะมนุษย์เท่านั้นที่คราฟต์ได้");
      if (p.zone !== "safe") fail("failed-precondition", "ต้องคราฟต์ที่ Safe Zone");
      const taken = [];
      const refund = async () => { for (const [m, n] of taken) await addCapped(db, uid, m, n); };
      for (const [m, n] of Object.entries(r.need)) {
        if (!(await takeItem(db, uid, m, n))) { await refund(); fail("failed-precondition", "วัตถุดิบไม่พอ"); }
        taken.push([m, n]);
      }
      if (DUR[id]) {   // อาวุธ: ช่องใหม่ต่อชิ้น
        const slot = `f_${now}${crypto.randomInt(1000)}`;
        const res = await db.ref(`inventory/${uid}/${slot}`).transaction((c) => (c === null ? { id, qty: 1, dur: DUR[id] } : undefined));
        if (!res.committed) { await refund(); fail("aborted", "สร้างอาวุธไม่สำเร็จ ลองใหม่อีกครั้ง"); }
        return { ok: true, id, slot };
      }
      const q = r.qty || 1;   // ของซ้อนช่อง (ช่อง = รหัสไอเทม เพดาน 99)
      if (!(await addCapped(db, uid, id, q))) { await refund(); fail("failed-precondition", "ช่องเก็บของชนิดนี้เต็ม (99)"); }
      return { ok: true, id, qty: q };
    });
  }
  // ⚔️ อาวุธติดสถานะ: ต้องเปิด tune fxw_on • มนุษย์ที่ Safe Zone เท่านั้น • เฉพาะชั้น 1–2 (มีสูตร) • ช่องอาวุธ id custom + fx
  async function craftFxw(uid, id, now) {
    const d = FXW[id]; if (!d || !d.need) fail("invalid-argument", "สูตรนี้ไม่มี");
    if ((await db.ref("tune/fxw_on").get()).val() !== 1) fail("failed-precondition", "ยังไม่เปิดให้ประกอบอาวุธติดสถานะ");
    return withLock(db, uid, now, async () => {
      const p = (await db.ref(`users/${uid}`).get()).val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      if (p.faction !== "human") fail("failed-precondition", "เฉพาะมนุษย์เท่านั้นที่คราฟต์ได้");
      if (p.zone !== "safe") fail("failed-precondition", "ต้องคราฟต์ที่ Safe Zone");
      const taken = [], refund = async () => { for (const [m, n] of taken) await addCapped(db, uid, m, n); };
      for (const [m, n] of Object.entries(d.need)) {
        if (!(await takeItem(db, uid, m, n))) { await refund(); fail("failed-precondition", "วัตถุดิบไม่พอ"); }
        taken.push([m, n]);
      }
      try { const slot = await giveWeapon(db, uid, id, now); return { ok: true, id, slot }; }
      catch (e) { await refund(); throw e; }
    });
  }
  async function dismantle(uid, data, now) {
    const slot = String((data && data.slot) || "");
    if (!ARMOR_SALV[slot]) fail("invalid-argument", "รื้อเกราะชิ้นนี้ไม่ได้");   // ช่องเกราะซ้อนใช้รหัสไอเทมเป็นชื่อช่อง
    return withLock(db, uid, now, async () => {
      const [pS, iS, tS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`inventory/${uid}/${slot}`).get(), db.ref("tune/salv_pct").get()]);
      const p = pS.val(), it = iS.val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      if (p.faction !== "human") fail("failed-precondition", "เฉพาะมนุษย์ที่รื้อเกราะได้");
      if (p.zone !== "safe") fail("failed-precondition", "รื้อได้เฉพาะใน Safe Zone");
      if (!it || it.id !== slot || !(it.qty >= 1)) fail("failed-precondition", "ไม่พบเกราะชิ้นนี้ในกระเป๋า");
      if (p.arm === slot && it.qty <= 1) fail("failed-precondition", "ถอดเกราะชิ้นนี้ก่อนค่อยรื้อ");
      const pct = typeof tS.val() === "number" ? tS.val() : 100, give = salvageOf(slot, pct);
      if (!give.length) fail("failed-precondition", "ปรับอัตราการรื้อไว้ต่ำเกินไป ไม่ได้อะไรคืน");
      const took = await db.ref(`inventory/${uid}/${slot}`).transaction((c) => { if (c === null) return c; if (c.id !== slot || !(c.qty >= 1)) return undefined; return c.qty > 1 ? { ...c, qty: c.qty - 1 } : null; });
      if (!took.committed) fail("failed-precondition", "ไม่พบเกราะชิ้นนี้ในกระเป๋า");
      const got = [], lost = [];
      for (const [m, q] of give) {
        let placed = 0;   // ใส่ได้จริงกี่ชิ้น (ช่องเต็ม 99 → ส่วนเกินหาย)
        await db.ref(`inventory/${uid}/${m}`).transaction((c) => {
          placed = 0;
          if (c === null) { placed = q; return { id: m, qty: q }; }
          if (c.id !== m || !(c.qty > 0)) return undefined;
          placed = Math.min(q, 99 - c.qty); return placed > 0 ? { ...c, qty: c.qty + placed } : undefined;
        });
        if (placed > 0) got.push([m, placed]); if (placed < q) lost.push([m, q - placed]);
      }
      return { ok: true, id: slot, got, lost };
    });
  }
  return { run };
}
module.exports = { makeForge, RECIPES, DUR, ARMOR_SALV, SALV_PCT, salvageOf };
