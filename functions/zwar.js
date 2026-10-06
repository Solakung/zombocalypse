// ⚔️ แต้มศึกชิงโซนรายสัปดาห์ (coop/{zh|zz}{สัปดาห์}{โซน 1–9}/{uid}) — ทำที่ฝั่งเซิร์ฟเวอร์
// - เหตุผล: rules เดิมให้ผู้เล่นเขียนแต้มตัวเองเองได้ (≤300 ต่อ 4 วินาที) โดยไม่ตรวจว่าทำกิจกรรมจริง → แก้ยอดสะสมให้ฝ่ายตัวเองชนะได้ (war.js อ่านค่านี้แจกรางวัล)
// - ตอนนี้ไคลเอนต์ส่งแค่ "ชนิดเหตุการณ์ + จำนวนครั้ง" ({search,zwin,boss,bite}) ส่วนโซน/ฝ่าย/สัปดาห์/น้ำหนักแต้ม เซิร์ฟเวอร์กำหนดเอง (โซนจาก users/{uid}/zone ที่ผู้เล่นอยู่จริง)
// - กันแต้มเกินจริง: ถังโทเค็นต่อผู้เล่น (tune zw_burst แต้ม เติม 1 แต้มต่อ zw_refill วินาที) — ค่าเริ่มต้นหลวมกว่าการเล่นจริง (ค้นหาใช้พลังงานครั้งละ 10 ที่ฟื้น ≥20 วินาที/หน่วย)
const { fail, withLock, dayIdx } = require("./lib");
const W = { search: 1, zwin: 2, boss: 5, bite: 3 };          // ต้องตรงกับ ZW_W ในเกม
const ZONE_ORDER = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];   // ต้องตรงลำดับ Object.keys(ZONES) ไม่รวม safe/casino ในเกม (zwZones()) — ดัชนี = ตำแหน่ง+1
const BURST = 200, REFILL_S = 10, MAX_N = 20, WK_CAP = 20000;
const wkOf = (now) => Math.floor((dayIdx(now) + 3) / 7);       // ต้องตรงกับ qpKey("weekly")
const col = (x) => (x && typeof x === "object" ? x : {});

function makeZwar(db, admin) {
  const SV = () => admin.database.ServerValue.TIMESTAMP;
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const items = data && data.items;
    if (!items || typeof items !== "object" || Array.isArray(items)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const evs = Object.keys(items); if (!evs.length || evs.length > 4) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    let pts = 0;
    for (const e of evs) { const n = items[e]; if (!W[e] || !Number.isInteger(n) || n < 1 || n > MAX_N) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง"); pts += n * W[e]; }
    return withLock(db, uid, now, async () => {
      const p = (await db.ref(`users/${uid}`).get()).val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if ((await tune("zw_on", 1)) !== 1) return { ok: true, added: 0, off: true };
      if (!(p.hp > 0)) return { ok: true, added: 0, skip: "dead" };
      const idx = ZONE_ORDER.indexOf(p.zone) + 1;
      if (idx < 1) return { ok: true, added: 0, skip: "zone" };       // Safe Zone/โซนที่ไม่มีศึก
      const burst = Math.max(1, await tune("zw_burst", BURST)), refill = Math.max(1, await tune("zw_refill", REFILL_S)) * 1000;
      let take = 0;
      await db.ref(`zwrl/${uid}`).transaction((c) => {
        take = 0;
        const have = c === null ? burst : Math.min(burst, (Number(col(c).tk) || 0) + Math.max(0, now - (Number(col(c).t) || 0)) / refill);
        take = Math.min(pts, Math.floor(have)); if (take < 1) return c === null ? { tk: have, t: now } : undefined;
        return { tk: have - take, t: now };
      });
      if (take < 1) return { ok: true, added: 0, limited: true };
      const key = (p.faction === "zombie" ? "zz" : "zh") + wkOf(now) + idx;
      let added = 0;
      await db.ref(`coop/${key}/${uid}`).transaction((c) => {
        added = 0; const cur = Number(col(c).n) || 0, room = WK_CAP - cur; if (room < 1) return undefined;
        added = Math.min(take, room); return { n: cur + added, name: String(p.username || "ผู้รอดชีวิต").slice(0, 20), ts: SV() };
      });
      return { ok: true, added, key };
    });
  }
  return { run };
}
module.exports = { makeZwar, W, wkOf };
