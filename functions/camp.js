// 🏕️ ต้นไม้อัปเกรดค่าย (โบนัสถาวรเล็ก ๆ) + 🐾 ระดับสัตว์เลี้ยง (โบนัสของที่หาได้ + บัฟเล็ก ๆ ตามระดับ)
// โหนด camp/{uid}, pet2/{uid} อยู่นอก rules → เขียนได้เฉพาะฟังก์ชันนี้ • ผลโบนัสฝั่งเกมคำนวณเอง (ตัวคูณตารางของที่เจอ/ลดดาเมจ) เหมือนโปรเจกต์ค่ายเดิม
// eff: ค่าต่อ 1 ระดับ — ตัวคูณ = 1 + v×ระดับ (z/f/sc/r/rm/n/w = น้ำหนักตารางค้นหา) • cut = ลดดาเมจที่โดน (บวกรวม)
const { fail, withLock, takeItem, grantAll } = require("./lib");

const MAXLV = 5;
const PERKS = {
  human: [
    { id: "p1", icon: "🔭", name: "หอสังเกตการณ์", tip: "เจอซอมบี้ตอนค้นหาน้อยลง 2%/ระดับ", eff: { z: -0.02 } },
    { id: "p2", icon: "🌾", name: "แปลงเพาะปลูก", tip: "เจออาหารมากขึ้น 3%/ระดับ", eff: { f: 0.03 } },
    { id: "p3", icon: "🔧", name: "คลังอะไหล่", tip: "เจอเศษวัสดุมากขึ้น 3%/ระดับ", eff: { sc: 0.03 } },
    { id: "p4", icon: "🩹", name: "เต็นท์พยาบาล", tip: "ลดดาเมจที่โดน 1%/ระดับ", eff: { cut: 0.01 } },
    { id: "p5", icon: "🍀", name: "ศาลเจ้านำโชค", tip: "เจอของหายากมากขึ้น 2%/ระดับ", eff: { r: 0.02 } }
  ],
  zombie: [
    { id: "p1", icon: "👃", name: "รังดมกลิ่น", tip: "เจอเนื้อเน่ามากขึ้น 4%/ระดับ", eff: { rm: 0.04 } },
    { id: "p2", icon: "🧪", name: "บ่อบ่มเชื้อ", tip: "ลดดาเมจที่โดน 1%/ระดับ", eff: { cut: 0.01 } },
    { id: "p3", icon: "🕳️", name: "โพรงพราง", tip: "ค้นหาแล้ว \"ไม่เจออะไร\" น้อยลง 3%/ระดับ", eff: { n: -0.03 } },
    { id: "p4", icon: "💧", name: "แอ่งน้ำขัง", tip: "เจอน้ำมากขึ้น 3%/ระดับ", eff: { w: 0.03 } },
    { id: "p5", icon: "🍀", name: "รังสมบัติ", tip: "เจอของหายากมากขึ้น 2%/ระดับ", eff: { r: 0.02 } }
  ]
};
// ค่าอัปเกรดระดับ L (1–5): วัสดุหลัก 12×L + สารเคมี 2×(L−1)
const cost = (fac, L) => { const out = [[fac === "zombie" ? "rotten_meat" : "scrap", 12 * L]]; if (L > 1) out.push(["chem", 2 * (L - 1)]); return out; };

// สัตว์เลี้ยง: ระดับ = 1 + ⌊ครั้งที่รับของ ÷ 5⌋ (สูงสุด 5) จากตัวนับ ach petc
const PET_ITEM = { dog: "canned_food", cat: "scrap", rat: "rotten_meat", bat: "moss" };
const PET_RARE = { human: [["medkit", 1], ["steel_plate", 1], ["copper_wire", 2], ["gunpowder", 1]], zombie: [["serum", 1], ["mutant_gland", 1], ["chem", 2]] };
const petLv = (n) => Math.min(MAXLV, 1 + Math.floor((n || 0) / 5));
const PET_EFF = { human: { n: -0.01 }, zombie: { n: -0.01 } };   // ต่อระดับ (ข้ามระดับ 1 → ระดับ 2 เริ่มมีผล)

function makeCamp(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, cS, aS, bS, qS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`camp/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(`base/${uid}/lv`).get(), db.ref(`pet/${uid}`).get()]);
      const p = pS.val(), cm = cS.val() || {}, ac = aS.val() || {}, blv = bS.val() || 0, pet = qS.val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human", lv = cm.p || {};
      const view = (extra) => {
        const perks = PERKS[fac].map((x) => ({ ...x, lv: lv[x.id] || 0, max: MAXLV, next: (lv[x.id] || 0) < MAXLV ? cost(fac, (lv[x.id] || 0) + 1) : null }));
        const pl = pet ? petLv(ac.petc) : 0;
        const peff = pl > 1 ? Object.fromEntries(Object.entries(PET_EFF[fac]).map(([k, v]) => [k, v * (pl - 1)])) : {};   // eff รวมของสัตว์ (คูณระดับให้เสร็จฝั่งเซิร์ฟเวอร์)
        return Object.assign({ ok: true, base: blv, perks, pet: pet ? { k: pet.k, lv: pl, claims: ac.petc || 0, eff: peff } : null }, extra || {});
      };
      if (a === "state") return view();

      if (a === "buy") {
        const x = PERKS[fac].find((q) => q.id === data.id);
        if (!x) fail("invalid-argument", "ไม่มีอัปเกรดนี้");
        if (p.zone !== "safe" || !(p.hp > 0)) fail("failed-precondition", "ต้องอยู่ที่ Safe Zone และมีชีวิต");
        if (!(blv >= 1)) fail("failed-precondition", "ต้องมีที่พักขั้น 1 ขึ้นไป");
        const L = (lv[x.id] || 0) + 1;
        if (L > MAXLV) fail("failed-precondition", "อัปเกรดสูงสุดแล้ว");
        const need = cost(fac, L), taken = [];
        for (const [id, q] of need) {
          if (!(await takeItem(db, uid, id, q))) { for (const [rid, rq] of taken) await grantAll(db, uid, [[rid, rq]]); fail("failed-precondition", "ของไม่พอสำหรับอัปเกรด"); }
          taken.push([id, q]);
        }
        try { await db.ref(`camp/${uid}/p/${x.id}`).set(L); } catch (e) { await grantAll(db, uid, taken); throw e; }
        lv[x.id] = L;
        return view({ bought: x.id, level: L });
      }

      if (a === "petBonus") {
        if (!pet || !PET_ITEM[pet.k]) fail("failed-precondition", "ยังไม่มีสัตว์เลี้ยง");
        const pc = Number(ac.petc) || 0, last = (await db.ref(`pet2/${uid}/c`).get()).val() || 0;
        if (!(pc > last)) return view({ bonus: null });
        const n = Math.min(3, pc - last), L = petLv(pc), gains = [];
        for (let i = 0; i < n; i++) {
          gains.push([PET_ITEM[pet.k], L]);   // ของโปรดของสัตว์ ×ระดับ
          if (Math.random() < (L - 1) * 0.05) gains.push(PET_RARE[fac][Math.floor(Math.random() * PET_RARE[fac].length)]);
        }
        const merged = Object.values(gains.reduce((m, [id, q]) => { (m[id] = m[id] || [id, 0])[1] += q; return m; }, {}));
        await db.ref(`pet2/${uid}/c`).set(pc);   // ตีตรารอบนี้ก่อน (ถ้าแจกไม่ได้เพราะกระเป๋าเต็ม จะถอนตรากลับ ให้ลองใหม่ภายหลัง)
        if (!(await grantAll(db, uid, merged))) { await db.ref(`pet2/${uid}/c`).set(last); return view({ bonus: null, full: true }); }
        return view({ bonus: merged, lvl: L });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}

module.exports = { makeCamp, PERKS, PET_ITEM, petLv, cost, MAXLV };
