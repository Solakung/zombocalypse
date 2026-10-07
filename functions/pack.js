// 🦖 สายแรปเตอร์ (สายวิวัฒนาการที่ 4 ของซอมบี้) — เลือดน้อยมาก หลบเก่ง มี "ลูกฝูง" ช่วยสู้: ปรากฏอัตโนมัติ 1 ตัวตอนเริ่มสู้ แล้วหายไปเมื่อจบการต่อสู้
// - ทำผ่านฟังก์ชัน (ไม่แก้ rules): ขั้นเก็บที่ `pack/{uid}` = {t ขั้น 0–4, sp DNA ที่ใช้ไป, rs เวลารีเซ็ตล่าสุด} (ไม่มีกฎเขียน/อ่านใน rules → เฉพาะฟังก์ชันนี้) • หัก/คืน DNA ที่ evo/{uid}/dna ด้วย Admin SDK
//   (ไม่เขียนฟิลด์ใหม่ใน evo เพราะ rules ของ evo ปฏิเสธฟิลด์แปลก ($other:false) — เขียนแล้วผู้เล่นอัปสายอื่นไม่ได้)
// - เป็นสายหลักแบบเดี่ยว: ซื้อได้เมื่อ evo h=g=s=0 (ยังไม่มีสายตะกละ/ซากหนา/เลื้อยคลาน) และผลมีเฉพาะตอน h=g=s=0 (packTier) — ถ้าไปอัปสายอื่นภายหลังผลของแรปเตอร์จะหยุดเอง
// - ผล (ต้องตรงกับ script.js `packTable` / use.js / hboss.js — มีเทสต์ตรวจ): HP −20/−30/−40/−50 (ผ่านสเตตัส hp) • ว่องไว +1/+2/+3/+4 • หลบเพิ่ม +4/8/13/18% (เพดานรวม 65%)
//   • ลูกฝูงรับดาเมจแทน 10/15/22/30% ของครั้งที่ "โดน" • ในบอสเผ่ามนุษย์ (hboss.js) ลูกฝูงกัดบอสทุกรอบ (โอกาสโดน 70% ดาเมจ 1 / 1–2 / 1–3 / 2–4) — ลูกฝูงไม่มีเลือดจึงไม่ตาย
//   • PvP: ลูกฝูงปรากฏเมื่อถูกโจมตีหากไม่ได้อยู่ในการต่อสู้ (หน้าต่าง 2 นาที) และ "รับแทน" ได้เท่านั้น (ฝั่งโจมตีของ PvP ผู้ถูกจำกัดโดย rules จึงยังไม่มีดาเมจจากลูกฝูง)
// - ตัวเลขจูนด้วย tests/sim/hboss_balance.js (ส่วนเทียบสายเดิม): ขั้น 1 ≈ สายตะกละขั้น 1 • ขั้น 4 อยู่ระหว่างตะกละกับซากหนา แต่ตายง่ายกว่า (เลือดต่ำ)
// - ราคา DNA ต่อขั้นเท่าสายอื่น (3/6/10/15) • รีเซ็ตได้ทุก 24 ชม. คืน DNA 70% • owner/gm: `a:"dist"` สรุปจำนวนซอมบี้ต่อสาย/ขั้น (แดชบอร์ดสถิติ)
const { fail, withLock } = require("./lib");

const COST = [3, 6, 10, 15];
const HP = [0, -2, -3, -4, -5], AGI = [0, 1, 2, 3, 4], DODGE = [0, 0.04, 0.08, 0.13, 0.18], INTERCEPT = [0, 0.10, 0.15, 0.22, 0.30];
const BITE = [null, [1, 1], [1, 2], [1, 3], [2, 4]], BITE_ACC = 0.7, DODGE_CAP = 0.65, REFUND = 0.7, RESET_CD = 86400000;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const col = (x) => (x && typeof x === "object" ? x : {});
const clampT = (t) => Math.max(0, Math.min(4, Math.floor(num(t))));
// ขั้นที่มีผลจริง: ต้องยังไม่มีสายอื่น (evo h=g=s=0) — evo.p คือขั้นที่ผู้เรียกใส่ลงไป (hboss/use โหลดจาก pack/{uid}/t)
const packTier = (evo) => { const e = col(evo); return num(e.h) || num(e.g) || num(e.s) ? 0 : clampT(e.p); };
// โบนัสสเตตัสของสาย (hp/agi) — เพิ่มเข้า evoBonus ก่อนใช้เพดาน
const packBonus = (k, t) => (k === "hp" ? HP[t] : k === "agi" ? AGI[t] : 0);
const dodgeBonus = (t) => DODGE[t] || 0;

function makePack(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "buy", "reset", "dist"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    if (a === "dist") {
      const me = (await db.ref(`users/${uid}/role`).get()).val();
      if (me !== "owner" && me !== "gm") fail("permission-denied", "เฉพาะทีมงาน");
      const [eS, pS, uS] = await Promise.all([db.ref("evo").get(), db.ref("pack").get(), db.ref("users").get()]);
      const E = col(eS.val()), P = col(pS.val()), U = col(uS.val()), out = { hunter: [0, 0, 0, 0, 0], giant: [0, 0, 0, 0, 0], shade: [0, 0, 0, 0, 0], pack: [0, 0, 0, 0, 0], none: 0, n: 0 };
      const KEY = { hunter: "h", giant: "g", shade: "s" };
      Object.keys(U).forEach((id) => {
        const u = U[id]; if (!u || u.faction !== "zombie" || u.role !== "player" || u.banned === true) return;
        out.n++; const e = col(E[id]), t = packTier({ ...e, p: col(P[id]).t });
        if (t > 0) { out.pack[t]++; return; }
        const main = ["hunter", "giant", "shade"].map((l) => [l, num(e[KEY[l]])]).sort((x, y) => y[1] - x[1])[0];
        if (main[1] > 0) out[main[0]][main[1]]++; else out.none++;
      });
      return { ok: true, ...out };
    }
    return withLock(db, uid, now, async () => {
      const [pS, eS, kS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`evo/${uid}`).get(), db.ref(`pack/${uid}`).get()]);
      const p = pS.val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const e = col(eS.val()), k = col(kS.val()), t = clampT(k.t), view = (extra) => Object.assign({ ok: true, zom: p.faction === "zombie", t, active: packTier({ ...e, p: t }) > 0, sp: num(k.sp), rs: num(k.rs), dna: num(e.dna), cost: t < 4 ? COST[t] : 0 }, extra || {});
      if (p.faction !== "zombie") return view({ zom: false });
      if (a === "state") return view();

      if (a === "buy") {
        if (t >= 4) fail("failed-precondition", "ขั้นสูงสุดแล้ว");
        if (!eS.exists()) fail("failed-precondition", "ยังไม่มี DNA (กัดเหยื่อให้โดนก่อน)");
        if (num(e.h) || num(e.g) || num(e.s)) fail("failed-precondition", "ต้องรีเซ็ตสายตะกละ/ซากหนา/เลื้อยคลานก่อน (แรปเตอร์เป็นสายแยก)");
        const cost = COST[t]; let ok = false;
        await db.ref(`evo/${uid}/dna`).transaction((cur) => { ok = false; if (typeof cur !== "number") return cur === null ? cur : undefined; if (cur < cost) return undefined; ok = true; return cur - cost; });
        if (!ok) fail("failed-precondition", `DNA ไม่พอ (ต้องใช้ ${cost})`);
        await db.ref(`pack/${uid}`).set({ t: t + 1, sp: num(k.sp) + cost, rs: num(k.rs) });
        return view({ t: t + 1, sp: num(k.sp) + cost, active: true, dna: num(e.dna) - cost, cost: t + 1 < 4 ? COST[t + 1] : 0, bought: t + 1 });
      }

      // reset
      if (!(t > 0)) fail("failed-precondition", "ยังไม่มีขั้นแรปเตอร์ให้รีเซ็ต");
      if (num(k.rs) && now - num(k.rs) < RESET_CD) fail("resource-exhausted", `รีเซ็ตได้อีกใน ${Math.ceil((RESET_CD - (now - num(k.rs))) / 3600000)} ชม.`);
      const refund = Math.floor(num(k.sp) * REFUND);
      if (refund > 0 && eS.exists()) await db.ref(`evo/${uid}/dna`).transaction((cur) => (typeof cur === "number" ? Math.min(9999, cur + refund) : cur));
      await db.ref(`pack/${uid}`).set({ t: 0, sp: 0, rs: now });
      return view({ t: 0, sp: 0, rs: now, active: false, refund: eS.exists() ? refund : 0, dna: num(e.dna) + (eS.exists() ? refund : 0), cost: COST[0] });
    });
  }
  return { run };
}
module.exports = { makePack, packTier, packBonus, dodgeBonus, COST, HP, AGI, DODGE, INTERCEPT, BITE, BITE_ACC, DODGE_CAP, REFUND, RESET_CD };
