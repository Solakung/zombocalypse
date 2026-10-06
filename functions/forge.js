// 🔨 คราฟต์อาวุธ (มนุษย์ ที่ Safe Zone) — สูตรอยู่ฝั่งเซิร์ฟเวอร์ ไม่แตะ rules
// - เหตุผล: rules ตรวจสูตรคราฟต์ของไอเทมสิ้นเปลือง (RECIPES เดิม) แต่ช่องอาวุธมีรหัสฝังอยู่หลายจุด; อาวุธที่คราฟต์ได้จึงทำผ่านฟังก์ชัน (Admin SDK สร้างช่องอาวุธเอง)
// - เฉพาะอาวุธระดับต้น–กลาง (ดาเมจ ≤ 22) — ปืนพก/ลูกซอง/ซามูไร/มีดห้องแล็บยังต้องหาจากการค้น/ดรอป • สูตรทั้งหมดต้องตรงกับ RECIPES ที่มี srv:true ใน script.js (มีเทสต์เทียบ)
// - ได้อาวุธเต็มความทน (dur = ค่าตั้งต้นของชนิดนั้น) ช่องคีย์ f_<ms><สุ่ม> • ถ้าสร้างช่องไม่ได้จะคืนวัตถุดิบ
const crypto = require("crypto");
const { fail, withLock, takeItem, addCapped } = require("./lib");

// out → ความทนตั้งต้น (ต้องตรง ITEMS[..].maxDur ในเกม)
const DUR = { wooden_bat: 20, pocket_knife: 30, crowbar: 30, knife: 25, spiked_bat: 18, fire_axe: 16, crossbow: 14 };
const RECIPES = {
  wooden_bat: { need: { scrap: 8 } },
  pocket_knife: { need: { scrap: 6, leather_scrap: 1 } },
  crowbar: { need: { scrap: 10, duct_tape: 1 } },
  knife: { need: { scrap: 8, leather_scrap: 1, duct_tape: 1 } },
  spiked_bat: { need: { scrap: 8, rusty_nails: 3 } },
  fire_axe: { need: { scrap: 14, steel_plate: 1 } },
  crossbow: { need: { scrap: 12, rope_coil: 2, steel_plate: 1 } }
};

function makeForge(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "state") return { ok: true, recipes: RECIPES };
    if (a !== "craft") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const id = String((data && data.id) || ""), r = RECIPES[id];
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
      const slot = `f_${now}${crypto.randomInt(1000)}`;
      const res = await db.ref(`inventory/${uid}/${slot}`).transaction((c) => (c === null ? { id, qty: 1, dur: DUR[id] } : undefined));
      if (!res.committed) { await refund(); fail("aborted", "สร้างอาวุธไม่สำเร็จ ลองใหม่อีกครั้ง"); }
      return { ok: true, id, slot };
    });
  }
  return { run };
}
module.exports = { makeForge, RECIPES, DUR };
