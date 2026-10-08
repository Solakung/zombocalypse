// 🦖 สายแรปเตอร์ (สายวิวัฒนาการที่ 4 ของซอมบี้ — คลาสเต็มรูปแบบเหมือนตะกละ/ซากหนา/เลื้อยคลาน) — เลือดน้อยมาก หลบเก่ง มี "ลูกฝูง" ช่วยสู้
// - ขั้น 1–4 เก็บที่ `evo/{uid}/p` (rules ตรวจราคา DNA/สายหลัก/รีเซ็ตเหมือนสายอื่น: สายหลักถึงขั้น 4 สายอื่นได้ถึงขั้น 1) • ฉายา evo4 = "pack" • มิวเตชันขั้น 5–8 ที่ `mut/{uid}/p` (mutate.js)
// - ลูกฝูง: ปรากฏอัตโนมัติ 1 ตัวตอนเริ่มสู้ แล้วหายเมื่อจบการต่อสู้ (บอสเผ่ามนุษย์: ตอนเจอบอส/จบเมื่อสู้เสร็จ • PvP: หน้าต่าง 2 นาทีนับจากการโจมตีที่เกี่ยวข้องครั้งล่าสุด) • ไม่มีเลือดจึงไม่ตาย
//   • รับดาเมจแทนผู้เล่นตามโอกาส (INTERCEPT) • กัดเพิ่ม: บอส (hboss.js) กัดทุกรอบ • PvP: ผู้โจมตีแนบ `pkd` (ดาเมจลูกฝูง) ในการโจมตี — rules ตรวจเพดานตามขั้น (attacks validate) ฝั่งผู้ถูกโจมตีบวกเข้าดาเมจ
// - ผลต่อสเตตัส (ต้องตรงกับ script.js `packTable`/`evoBonusAt`, use.js, hboss.js): HP −20/−30/−40/−50 (สเตตัส hp) • ว่องไว +1/+2/+3/+4 • หลบเพิ่ม +4/8/13/18% (เพดานรวม 65%)
// - มิวเตชัน (ขั้น 5–8 ผ่าน mutate.js ต้องแรปเตอร์ขั้น 4): รับแทน +3/6/9/12% • หลบ +0/2/2/4% • ดาเมจกัดสูงสุด +1 • HP โทษลด +0/0/10/20
// - ตัวเลขจูนด้วย tests/sim/hboss_balance.js (ส่วนเทียบสายเดิม): ขั้น 1 ≈ ตะกละขั้น 1 • ขั้น 4 อยู่ระหว่างตะกละกับซากหนา แต่ตายง่ายกว่า (เลือดต่ำ)
// - ฟังก์ชัน `packAct`: `a:"migrate"` ย้ายขั้นจากโหนดเดิม `pack/{uid}` (เวอร์ชันก่อนหน้า) เข้า evo • `a:"dist"` (owner/gm) สรุปจำนวนซอมบี้ต่อสาย/ขั้นให้แดชบอร์ดสถิติ
const { fail, withLock } = require("./lib");

const COST = [3, 6, 10, 15];
const HP = [0, -2, -3, -4, -5], AGI = [0, 1, 2, 3, 4], DODGE = [0, 0.04, 0.08, 0.13, 0.18], INTERCEPT = [0, 0.10, 0.15, 0.22, 0.30];
const BITE = [null, [1, 1], [1, 2], [1, 3], [2, 4]], BITE_ACC = 0.7, DODGE_CAP = 0.65;
// มิวเตชัน (ขั้น 0–4 = ขั้นรวม 5–8)
const MUT = { icpt: [0, 0.03, 0.06, 0.09, 0.12], dodge: [0, 0, 0.02, 0.02, 0.04], bite: [0, 1, 1, 1, 1], hp: [0, 0, 0, 1, 2] };
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const col = (x) => (x && typeof x === "object" ? x : {});
const clampT = (t) => Math.max(0, Math.min(4, Math.floor(num(t))));
const packTier = (evo) => clampT(col(evo).p);                                   // ขั้นแรปเตอร์ (evo.p)
const packMut = (evo) => (packTier(evo) === 4 ? clampT(col(evo).mp) : 0);       // ขั้นมิวเตชัน (evo.mp = mut/{uid}/p ที่ผู้เรียกใส่ลงไป) — ต้องแรปเตอร์ขั้น 4
// โบนัสสเตตัสของสาย (hp/agi) — เพิ่มเข้า evoBonus ก่อนใช้เพดาน
const packBonus = (k, t, m = 0) => (k === "hp" ? HP[t] + MUT.hp[m] : k === "agi" ? AGI[t] : 0);
const dodgeBonus = (t, m = 0) => (DODGE[t] || 0) + (MUT.dodge[m] || 0);
const intercept = (t, m = 0) => (INTERCEPT[t] || 0) + (MUT.icpt[m] || 0);
const biteRange = (t, m = 0) => (BITE[t] ? [BITE[t][0], BITE[t][1] + (MUT.bite[m] || 0)] : null);
const MAIN = { hunter: "h", giant: "g", shade: "s", pack: "p" };
// สายหลักของผู้เล่น (ตาม evo.line ถ้าถูกต้อง ไม่งั้นสายที่ขั้นสูงสุด) → [ชื่อสาย, ขั้น] หรือ null
function mainOf(e) {
  const t = (l) => num(e[MAIN[l]]); let l = MAIN[e.line] ? e.line : null;
  if (!l || !t(l)) { l = Object.keys(MAIN).sort((a, b) => t(b) - t(a))[0]; if (!t(l)) return null; }
  return [l, Math.min(4, t(l))];
}

function makePack(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "dist";
    if (!["dist", "migrate"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    if (a === "dist") {
      const me = (await db.ref(`users/${uid}/role`).get()).val();
      if (me !== "owner" && me !== "gm") fail("permission-denied", "เฉพาะทีมงาน");
      const [eS, uS] = await Promise.all([db.ref("evo").get(), db.ref("users").get()]);
      const E = col(eS.val()), U = col(uS.val()), out = { hunter: [0, 0, 0, 0, 0], giant: [0, 0, 0, 0, 0], shade: [0, 0, 0, 0, 0], pack: [0, 0, 0, 0, 0], none: 0, n: 0 };
      Object.keys(U).forEach((id) => {
        const u = U[id]; if (!u || u.faction !== "zombie" || u.role !== "player" || u.banned === true) return;
        out.n++; const m = mainOf(col(E[id])); if (m) out[m[0]][m[1]]++; else out.none++;
      });
      return { ok: true, ...out };
    }
    // migrate: เวอร์ชันก่อนหน้าเก็บขั้นไว้ที่ pack/{uid} = {t, sp, rs} → ย้ายเข้า evo/{uid}/p (ต้องไม่มีสายอื่นขัดกัน ไม่งั้นคืน DNA เต็มจำนวนที่จ่ายไป)
    return withLock(db, uid, now, async () => {
      const [kS, eS] = await Promise.all([db.ref(`pack/${uid}`).get(), db.ref(`evo/${uid}`).get()]);
      if (!kS.exists()) return { ok: true, migrated: false };
      const k = col(kS.val()), e = col(eS.val()), t = clampT(k.t), sp = num(k.sp);
      if (!(t > 0) || !eS.exists()) { await db.ref(`pack/${uid}`).remove(); return { ok: true, migrated: false }; }
      const other = num(e.h) || num(e.g) || num(e.s) || num(e.p);
      if (other) { await db.ref(`evo/${uid}/dna`).transaction((cur) => Math.min(9999, num(cur) + sp)); await db.ref(`pack/${uid}`).remove(); return { ok: true, migrated: false, refunded: sp }; }
      await db.ref(`evo/${uid}`).update({ p: t, sp: num(e.sp) + sp, line: "pack" });
      await db.ref(`pack/${uid}`).remove();
      return { ok: true, migrated: true, p: t };
    });
  }
  return { run };
}
module.exports = { makePack, packTier, packMut, packBonus, dodgeBonus, intercept, biteRange, mainOf, COST, HP, AGI, DODGE, INTERCEPT, BITE, BITE_ACC, DODGE_CAP, MUT };
