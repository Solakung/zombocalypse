// ⚔️ อาวุธติดสถานะ (มนุษย์ใช้ได้เท่านั้น) — แคตตาล็อก + ค้นเจอ (`fxwAct` a:"find") • การคราฟต์ผ่าน forge.js (`forgeAct` id ขึ้นต้น fxw_)
// - ช่องอาวุธ = id "custom" (rules รองรับ: ชื่อ/ดาเมจ/ความทนอยู่ในช่องของเอง) + ช่อง fx {t ชนิด, v ความแรง, m นาที, p โอกาสติด% ต่อการโจมตีที่โดน} + icon
//   rules `attacks/{เป้า}/{ผู้โจมตี}` ยอมให้แนบ wfx ได้เมื่อ: ผู้โจมตีเป็นมนุษย์ + เป้าเป็นซอมบี้ + wfx ตรงกับช่อง fx ของอาวุธที่ถืออยู่ — ผู้ถูกโจมตีเป็นคนทอยโอกาสติดและเขียนสถานะลงตัวเอง (กิ่ง effects เดิมของมอนสเตอร์)
// - ปิดอยู่จนกว่า tune fxw_on = 1 (คราฟต์/ค้นเจอ) • ค่าปรับ: fxw_rate = % ของโอกาสค้นเจอ (ค่าเริ่มต้น 100) • ตัวเลขทั้งหมดต้องตรงกับ FXW ใน script.js (tests/emulator/fxw.js ตรวจ)
// - ค้นเจอ: ไคลเอนต์เรียกหลังมนุษย์ค้นหาเสร็จ (ค้นหายังเป็นฝั่งไคลเอนต์ — เซิร์ฟเวอร์ยืนยันไม่ได้ จึงจำกัดด้วยถังโทเค็น + เพดานรายวัน)
const crypto = require("crypto");
const { fail, withLock, dayIdx } = require("./lib");

// tier 1–2 คราฟต์ได้ (need) • tier 3 ค้นเจอเท่านั้น • ดาเมจต่ำกว่าอาวุธธรรมดาระดับเดียวกัน ~10% ชดเชยด้วยสถานะ
const FXW = {
  fxw_cleaver: { name: "มีดสับกระดูก", icon: "🔪", dmg: 11, dur: 24, tier: 1, fx: { t: "bleed", v: 2, m: 3, p: 30 }, need: { scrap: 8, leather_scrap: 1, rusty_nails: 2 } },
  fxw_venom: { name: "มีดอาบพิษ", icon: "🗡️", dmg: 9, dur: 22, tier: 1, fx: { t: "poison", v: 1, m: 5, p: 35 }, need: { scrap: 6, chem: 3, leather_scrap: 1 } },
  fxw_stunbat: { name: "กระบองช็อต", icon: "🏏", dmg: 8, dur: 16, tier: 1, fx: { t: "stun", v: 1, m: 1, p: 15 }, need: { scrap: 8, battery_pack: 1, copper_wire: 2 } },
  fxw_ripaxe: { name: "ขวานผ่าซาก", icon: "🪓", dmg: 16, dur: 16, tier: 2, fx: { t: "bleed", v: 3, m: 3, p: 30 }, need: { scrap: 14, steel_plate: 1, rusty_nails: 3 } },
  fxw_hammer: { name: "ค้อนทุบกระดูก", icon: "🔨", dmg: 14, dur: 18, tier: 2, fx: { t: "dice", v: -1, m: 3, p: 15 }, need: { scrap: 12, steel_plate: 1, duct_tape: 1 } },
  fxw_dartbow: { name: "หน้าไม้ลูกดอกพิษ", icon: "🏹", dmg: 20, dur: 14, tier: 2, fx: { t: "poison", v: 3, m: 3, p: 30 }, need: { scrap: 12, rope_coil: 2, steel_plate: 1, chem: 4 } },
  fxw_chainsaw: { name: "ดาบเลื่อยโซ่", icon: "⛓️", dmg: 26, dur: 14, tier: 3, fx: { t: "bleed", v: 3, m: 5, p: 30 } },
  fxw_taser: { name: "ปืนช็อตไฟฟ้า", icon: "⚡", dmg: 22, dur: 12, tier: 3, fx: { t: "stun", v: 1, m: 1, p: 35 } },
  fxw_plague: { name: "ดาบกาฬโรค", icon: "☣️", dmg: 24, dur: 14, tier: 3, fx: { t: "poison", v: 3, m: 5, p: 35 } }
};
// ค้นเจอ: โอกาสต่อการค้น 1 ครั้ง (‰) ต่อชั้น × โซน — ชั้น 1 ทุกโซนนอก Safe/คาสิโน • ชั้น 2 โซนกลาง–ไกล • ชั้น 3 โซนไกลสุด
const FIND_PM = { 1: { ruins: 8, mall: 8, forest: 6, hospital: 10, police: 10, factory: 10, port: 10, base: 12, tunnel: 12, lab: 12 }, 2: { hospital: 4, police: 6, factory: 6, port: 6, base: 8, tunnel: 8, lab: 8 }, 3: { police: 2, base: 3, tunnel: 3, lab: 4 } };
const BURST = 12, REFILL_MS = 12000, DAY_CAP = 3;

// ช่องอาวุธที่จะเขียนลงกระเป๋า (ต้องตรงกับ fxwSlot ใน script.js)
const slotOf = (k) => { const d = FXW[k]; return { id: "custom", qty: 1, dur: d.dur, maxDur: d.dur, name: d.name, dmg: d.dmg, type: "weapon", icon: d.icon, fx: { ...d.fx } }; };
const newKey = (now) => `f_${now}${crypto.randomInt(1000)}`;
async function giveWeapon(db, uid, k, now) {
  const slot = newKey(now), res = await db.ref(`inventory/${uid}/${slot}`).transaction((c) => (c === null ? slotOf(k) : undefined));
  if (!res.committed) fail("aborted", "สร้างอาวุธไม่สำเร็จ ลองใหม่อีกครั้ง");
  return slot;
}

function makeFxw(db, rnd) {
  const rf = rnd || (() => crypto.randomInt(1000000) / 1000000);
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a !== "find" && a !== "state") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const on = (await tune("fxw_on", 0)) === 1;
    if (a === "state" || !on) return { ok: true, on, got: null };
    return withLock(db, uid, now, async () => {
      const p = (await db.ref(`users/${uid}`).get()).val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (p.faction !== "human") return { ok: true, on, got: null };
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      const z = p.zone;
      if (!FIND_PM[1][z]) return { ok: true, on, got: null };   // Safe Zone / คาสิโน / โซนที่ไม่มี = ไม่ทอย
      let allowed = false;   // ถังโทเค็น
      await db.ref(`fxwrl/${uid}`).transaction((c) => { allowed = false; if (c === null) { allowed = true; return { tk: BURST - 1, t: now }; } const tk = Math.min(BURST, (Number(c.tk) || 0) + Math.max(0, now - (Number(c.t) || 0)) / REFILL_MS); if (tk < 1) return undefined; allowed = true; return { tk: tk - 1, t: now }; });
      if (!allowed) return { ok: true, on, got: null, limited: true };
      const day = dayIdx(now), dS = (await db.ref(`fxwday/${uid}`).get()).val(), used = dS && dS.d === day ? Number(dS.n) || 0 : 0;
      if (used >= DAY_CAP) return { ok: true, on, got: null, capped: true };
      const rate = Math.max(0, await tune("fxw_rate", 100)) / 100;
      // ทอยชั้นสูงก่อน (ชั้น 3 → 2 → 1) ได้ชิ้นเดียวต่อการค้น
      for (const tier of [3, 2, 1]) {
        const pm = FIND_PM[tier][z]; if (!pm) continue;
        if (!(rf() < (pm * rate) / 1000)) continue;
        const pool = Object.keys(FXW).filter((k) => FXW[k].tier === tier), k = pool[Math.floor(rf() * pool.length)];
        const slot = await giveWeapon(db, uid, k, now);
        await db.ref(`fxwday/${uid}`).set({ d: day, n: used + 1 });
        return { ok: true, on, got: { key: k, slot, name: FXW[k].name, icon: FXW[k].icon, tier } };
      }
      return { ok: true, on, got: null };
    });
  }
  return { run };
}
module.exports = { makeFxw, FXW, slotOf, giveWeapon, FIND_PM, DAY_CAP, BURST, REFILL_MS };
