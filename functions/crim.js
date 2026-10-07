// 🟠 สถานะส้ม (ผู้ก่อเหตุ) — ฆ่าผู้เล่นฝ่ายเดียวกันนอก Safe Zone → ติดส้ม: เข้า Safe Zone ไม่ได้จนกว่าจะหมดเวลา/จ่ายค่าประกัน
// - สถานะที่ `crim/{uid}` = {until, n, ts} • โหนดนี้ไม่มีกฎเขียนใน rules → เขียนได้เฉพาะฟังก์ชันนี้ (Admin) • ทุกคนอ่านได้ (ใช้แสดงชื่อส้ม)
//   rules ใช้ crim/{uid}/until เทียบ now เพื่อกั้นการเดินทาง/ฟื้นตัวเข้า Safe Zone (ฟื้นตัวตอนส้มไปที่เขตเมืองร้างแทน)
// - เหตุการณ์ (action "report"): ผู้ถูกฆ่า หรือผู้ฆ่า (ฝั่งที่เขียน HP เป้าหมาย) เรียกหลังเป้าหมาย HP=0 — เซิร์ฟเวอร์ตรวจเอง:
//   ทั้งคู่เป็นผู้เล่น/ฝ่ายเดียวกัน/โซนเดียวกัน (ไม่ใช่ Safe/คาสิโน) • ผู้ถูกฆ่า HP=0 จริง • ผู้ฆ่าโจมตีล่าสุดไม่เกิน 90 วินาที •
//   ผู้ถูกฆ่าไม่ได้โจมตีใครใน 3 นาทีก่อน (ถือว่าสู้กันเอง/ป้องกันตัว = ไม่ผิด) • ผู้ถูกฆ่าไม่ได้เป็นส้มอยู่ (ฆ่าคนส้มไม่ผิด) • ซ้ำภายใน 2 นาทีนับครั้งเดียว
// - ข้อจำกัดที่ทราบ: เซิร์ฟเวอร์ยืนยันไม่ได้ว่าใครเริ่มก่อน (ไม่มีบันทึกการโจมตีถาวร) และผู้ฆ่าที่ปิดการรายงานในไคลเอนต์ที่ดัดแปลงจะหลบได้ถ้าผู้ถูกฆ่าไม่รายงาน
// - ระยะเวลา = crim_min (ค่าเริ่มต้น 45 นาที) × จำนวนครั้ง n (สูงสุด 4) • n ลดเหลือ 0 ถ้าไม่ก่อเหตุเกิน 24 ชม. • ค่าประกัน = crim_bail (ค่าเริ่มต้น 20) × n "แต้มมูลค่า" จ่ายเป็นวัตถุดิบ
// - 🔴 สถานะแดง (ผู้ก่อเหตุซ้ำ): ก่อเหตุถึงครั้งที่ crim_red (3) ใน 24 ชม. → แดงนาน crim_redh (6) ชั่วโมง (ก่อเหตุซ้ำต่ออายุ) • เข้า Safe Zone ไม่ได้เหมือนส้ม (rules ใช้ until เดียวกัน) • **จ่ายค่าประกันไม่ได้** ต้องรอหรือถูกจับ • ถ้าถูกจับ โทษคุก ×2 และผู้จับได้ของยึด ×2 (ดู jail.js) • แดงถูกล้มเก็บค่าหัว/จับได้เหมือนส้ม
// - ปิดอยู่จนกว่าตั้ง tune crim_on = 1
const { fail, withLock } = require("./lib");
const { payPts, VAL: BAIL_VAL } = require("./paypts");

const MAX_N = 4, DECAY_MS = 86400000, ATK_WINDOW = 90000, SELF_DEF_WINDOW = 180000, DEDUPE_MS = 120000;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

// ก่อเหตุครั้งใหม่: n+1 (ลดเหลือ 0 ถ้าห่างเกิน 24 ชม.) • n ≥ redAt → แดง (นาน redH ชม.) ไม่งั้นส้ม (mins × n นาที)
function nextCrim(cur, now, C) {
  const n = Math.min(MAX_N, (cur && now - num(cur.ts) <= DECAY_MS ? Math.min(MAX_N, num(cur.n)) : 0) + 1), red = n >= C.redAt;
  return { until: red ? now + C.redH * 3600000 : now + C.mins * 60000 * n, n, ts: now, ...(red ? { red: true } : {}) };
}
function makeCrim(db) {
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  const nowN = (c, now) => (c && now - num(c.ts) <= DECAY_MS ? Math.min(MAX_N, num(c.n)) : 0);
  const active = (c, now) => !!c && num(c.until) > now;
  async function cfg() { return { on: (await tune("crim_on", 0)) === 1, mins: Math.max(1, await tune("crim_min", 45)), bail: Math.max(1, await tune("crim_bail", 20)), redAt: Math.max(2, Math.floor(await tune("crim_red", 3))), redH: Math.max(1, await tune("crim_redh", 6)) }; }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "report", "bail"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const C = await cfg();
    if (a === "state") {
      const c = (await db.ref(`crim/${uid}`).get()).val(), n = nowN(c, now);
      return { ok: true, on: C.on, active: active(c, now), red: active(c, now) && c.red === true, until: c ? num(c.until) : 0, n, bailPts: C.bail * Math.max(1, n) };
    }
    if (!C.on) return { ok: true, on: false };

    if (a === "report") {
      const role = data.role === "attacker" ? "attacker" : "victim", other = String(data.other || "");
      if (!other || other === uid || !/^[A-Za-z0-9_-]{1,64}$/.test(other)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      const vid = role === "victim" ? uid : other, aid = role === "victim" ? other : uid;
      const [vS, aS, cS, rS] = await Promise.all([db.ref(`users/${vid}`).get(), db.ref(`users/${aid}`).get(), db.ref(`crim/${aid}`).get(), db.ref(`crim/${vid}`).get()]);
      const v = vS.val(), at = aS.val();
      const no = (why) => ({ ok: true, on: true, flagged: false, why });
      if (!v || !at || v.banned === true || at.banned === true) return no("user");
      if (v.role !== "player" || at.role !== "player") return no("role");
      if ((v.faction !== "human" && v.faction !== "zombie") || v.faction !== at.faction) return no("faction");
      if (!(v.hp === 0)) return no("alive");
      if (v.zone !== at.zone || v.zone === "safe" || v.zone === "casino") return no("zone");
      if (!(now - num(at.lastAttack) <= ATK_WINDOW && num(at.lastAttack) > 0)) return no("stale");
      if (num(v.lastAttack) > 0 && now - num(v.lastAttack) < SELF_DEF_WINDOW) return no("mutual");
      if (active(rS.val(), now)) return no("victim-orange");
      let dup = false;
      await db.ref(`crimrep/${vid}`).transaction((cur) => { dup = false; if (cur === null) return { ts: now, by: aid }; if (now - num(cur.ts) < DEDUPE_MS) { dup = true; return undefined; } return { ts: now, by: aid }; });
      if (dup) return no("dup");
      let out = null;
      await db.ref(`crim/${aid}`).transaction((cur) => { out = nextCrim(cur, now, C); return out; });
      return { ok: true, on: true, flagged: true, who: aid, until: out.until, n: out.n, red: out.red === true };
    }

    // bail: จ่ายวัตถุดิบเท่าแต้มประกัน → ปลดส้มทันที (n ยังอยู่ — ก่อเหตุซ้ำภายใน 24 ชม. โทษหนักขึ้น)
    return withLock(db, uid, now, async () => {
      const c = (await db.ref(`crim/${uid}`).get()).val();
      if (!active(c, now)) fail("failed-precondition", "คุณไม่ได้เป็นส้มอยู่");
      if (c.red === true) fail("failed-precondition", "🔴 ผู้ก่อเหตุซ้ำจ่ายค่าประกันไม่ได้ — ต้องรอให้หมดเวลา (หรือถูกจับ)");
      const need = C.bail * Math.max(1, nowN(c, now)), paid = await payPts(db, uid, need, "จ่ายค่าประกัน");
      await db.ref(`crim/${uid}`).set({ until: now, n: num(c.n), ts: num(c.ts) });
      return { ok: true, on: true, paid, pts: need };
    });
  }
  return { run };
}
module.exports = { makeCrim, nextCrim, BAIL_VAL, MAX_N };
