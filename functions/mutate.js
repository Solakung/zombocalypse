// 🧬 มิวเตชัน (ซอมบี้) — ต่อยอดสายวิวัฒนาการที่ถึงขั้น 4 ไปอีก 4 ขั้น (ขั้น 5–8) โดยจ่าย DNA
// - ทำผ่านฟังก์ชันเพราะ rules ของ evo/{uid} ตรวจขั้น/แต้มไว้แน่น (28 จุด) จึงไม่แตะ: ขั้นเพิ่มเก็บที่ mut/{uid}/{h|g|s} (ไม่มีใน rules) และหัก DNA ด้วย Admin SDK
// - ผลของขั้นเพิ่ม: ความสามารถประจำสาย (ability.js) ขั้นสูงขึ้น (ขั้น 5+ ได้ผลครึ่งหนึ่งของขั้นปกติ) + โบนัสถาวรเล็กน้อย (ไม่ใช่ค่า HP/แรงกัดที่ rules ตรวจ) + ฉายา (profile.js)
const { fail, withLock } = require("./lib");

const COST = [25, 40, 60, 90];   // DNA ต่อขั้น (ได้ DNA วันละไม่เกิน 25 → ครบทั้งสี่ขั้นราว 9 วัน)
const LINES = {
  hunter: { k: "h", ic: "🩸", n: "สายตะกละ", t: [["เขี้ยวทมิฬ", "เนื้อเน่าเจอเพิ่ม +4%"], ["รสเลือดติดปาก", "เนื้อเน่าเจอเพิ่ม +8% รวม"], ["เจ้าแห่งการล่า", "เนื้อเน่าเจอเพิ่ม +12% รวม"], ["อสูรทมิฬ", "เนื้อเน่าเจอเพิ่ม +16% รวม + ฉายา"]], pass: (m) => ({ rm: 1 + 0.04 * m }) },
  giant: { k: "g", ic: "🗿", n: "สายซากหนา", t: [["เกราะซ้อนเกราะ", "ลดดาเมจที่ได้รับ +1%"], ["หัวใจศิลา", "ลดดาเมจรวม +2%"], ["ผิวหินผา", "ลดดาเมจรวม +3%"], ["ยักษ์ศิลาอมตะ", "ลดดาเมจรวม +4% + ฉายา"]], pass: (m) => ({ cut: 0.01 * m }) },
  shade: { k: "s", ic: "🕷️", n: "สายเลื้อยคลาน", t: [["ย่างเงา", "ค้นแล้วว่างเปล่า −3% ของหายาก +3%"], ["นัยน์ตาอเวจี", "−6% / +6% รวม"], ["กระซิบแห่งมืด", "−9% / +9% รวม"], ["ราชันเงา", "−12% / +12% รวม + ฉายา"]], pass: (m) => ({ n: 1 - 0.03 * m, r: 1 + 0.03 * m }) }
};
const col = (x) => (x && typeof x === "object" ? x : {});
// สายหลักที่ถึงขั้น 4 (rules ให้สายหลักสายเดียวถึงขั้น 4)
function mainLine(e) { const t = { hunter: Number(e.h) || 0, giant: Number(e.g) || 0, shade: Number(e.s) || 0 }; return [e.line, "hunter", "giant", "shade"].find((k) => k && t[k] === 4) || null; }

function makeMutate(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, eS, mS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`evo/${uid}`).get(), db.ref(`mut/${uid}`).get()]);
      const p = pS.val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (p.faction !== "zombie") return { ok: true, zom: false };
      const e = col(eS.val()), m = col(mS.val()), key = mainLine(e), L = key && LINES[key], mt = L ? Math.min(4, Number(m[L.k]) || 0) : 0;
      const view = (extra) => Object.assign({
        ok: true, zom: true, line: key, ic: L && L.ic, n: L && L.n, m: mt, dna: Number(e.dna) || 0, tiers: L ? L.t.map(([n, d], i) => ({ n, d, cost: COST[i], done: i < mt })) : [],
        next: L && mt < 4 ? { cost: COST[mt], n: L.t[mt][0], d: L.t[mt][1] } : null, pass: L ? L.pass(mt) : null, abilL: 4 + mt
      }, extra || {});
      if (a === "state") return view();
      if (a !== "buy") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
      if (!L) fail("failed-precondition", "ต้องวิวัฒนาการสายหลักถึงขั้น 4 ก่อน");
      if (mt >= 4) fail("failed-precondition", "มิวเตชันถึงขั้นสูงสุดแล้ว");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      const cost = COST[mt]; let ok = false;
      await db.ref(`evo/${uid}/dna`).transaction((cur) => { ok = false; if (cur === null) return cur; if (!(cur >= cost)) return undefined; ok = true; return cur - cost; });
      if (!ok) fail("failed-precondition", `DNA ไม่พอ (ต้องใช้ ${cost})`);
      try { await db.ref(`mut/${uid}/${L.k}`).set(mt + 1); }
      catch (err) { await db.ref(`evo/${uid}/dna`).transaction((cur) => (typeof cur === "number" ? cur + cost : cur)); throw err; }
      m[L.k] = mt + 1; const mt2 = mt + 1;
      return Object.assign(view(), { m: mt2, dna: (Number(e.dna) || 0) - cost, tiers: L.t.map(([n, d], i) => ({ n, d, cost: COST[i], done: i < mt2 })), next: mt2 < 4 ? { cost: COST[mt2], n: L.t[mt2][0], d: L.t[mt2][1] } : null, pass: L.pass(mt2), abilL: 4 + mt2, bought: L.t[mt][0] });
    });
  }
  return { run };
}
module.exports = { makeMutate, COST, LINES, mainLine };
