// 🧹 เคลียร์ของที่ผู้เล่นวางทิ้งไว้บนพื้นโซน (`zoneItems/{โซน}/{คีย์}`) — ของที่ทิ้งไว้เกิน ground_ttl_h ชั่วโมง (ค่าเริ่มต้น 6) ถูกลบ • ตั้ง 0 = ปิด
// - ของบนพื้นไม่มีเวลาที่วาง (rules ไม่รับฟิลด์เวลา) → ฟังก์ชันจดเวลา "เห็นครั้งแรก" ไว้ที่ `zitemAge/{โซน}/{คีย์}` = {t, s ลายเซ็นของ} (ไม่มีกฎใน rules → เฉพาะฟังก์ชัน) แล้วลบเมื่อครบ TTL — ของจึงอยู่ได้นาน TTL ถึง TTL+ช่วงกวาด
// - ไม่ใช้ตัวตั้งเวลา: ไคลเอนต์เรียก `a:"sweep"` ตอนเข้าโซน (กวาดโซนเดียวกันได้ไม่ถี่กว่า 10 นาที — เก็บเวลาที่ `zsweep/{โซน}`) • โซนที่ไม่มีใครเข้าเลยก็ไม่ต้องกวาด (ไม่มีใครเห็นของอยู่แล้ว)
// - ลบเฉพาะของที่ผู้เล่นวาง (มีฟิลด์ src) — ม้วนสกิล/ของที่ GM วางไว้ (คีย์ push ไม่มี src) ไม่ถูกลบ
// - ของที่ถูกเก็บไปแล้ว/วางใหม่คนละชิ้น: ลายเซ็น s = id:qty:dur ต่างกันจะเริ่มนับใหม่
const { fail } = require("./lib");

const SWEEP_MS = 600000, DEFAULT_TTL_H = 6;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const sig = (g) => `${g.id}:${num(g.qty)}:${num(g.dur)}`;

function makeGround(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const zone = String((data && data.zone) || "");
    if (!/^[a-z]{2,12}$/.test(zone)) fail("invalid-argument", "ไม่รู้จักโซน");
    const a = (data && data.a) || "sweep"; if (a !== "sweep") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const u = (await db.ref(`users/${uid}`).get()).val();
    if (!u || u.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    const ttlH = (await db.ref("tune/ground_ttl_h").get()).val(), ttl = typeof ttlH === "number" && Number.isFinite(ttlH) ? ttlH : DEFAULT_TTL_H;
    if (!(ttl > 0)) return { ok: true, on: false };
    let go = false;
    await db.ref(`zsweep/${zone}`).transaction((cur) => { go = false; if (cur !== null && now - num(cur) < SWEEP_MS) return undefined; go = true; return now; });
    if (!go) return { ok: true, on: true, swept: false, ttl };
    const [iS, aS] = await Promise.all([db.ref(`zoneItems/${zone}`).get(), db.ref(`zitemAge/${zone}`).get()]);
    const items = iS.val() || {}, ages = aS.val() || {}, upd = {}; let removed = 0, tracked = 0;
    for (const [k, g] of Object.entries(items)) {
      if (!g || typeof g !== "object" || g.id === "skill" || typeof g.src !== "string") continue;   // ไม่แตะม้วนสกิล/ของที่ GM วาง
      const s = sig(g), at = ages[k];
      if (at && at.s === s && now - num(at.t) >= ttl * 3600000) { upd[`zoneItems/${zone}/${k}`] = null; upd[`zitemAge/${zone}/${k}`] = null; removed++; }
      else if (!at || at.s !== s) { upd[`zitemAge/${zone}/${k}`] = { t: now, s }; tracked++; }
    }
    for (const k of Object.keys(ages)) if (!items[k]) upd[`zitemAge/${zone}/${k}`] = null;   // ของที่หายไปแล้ว (ถูกเก็บ) → เลิกจำ
    if (Object.keys(upd).length) await db.ref().update(upd);
    return { ok: true, on: true, swept: true, removed, tracked, ttl };
  }
  return { run };
}
module.exports = { makeGround, SWEEP_MS, DEFAULT_TTL_H };
