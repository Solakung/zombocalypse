// 🧭 บทเรียนแนะนำการเล่น (Coach): เส้นทาง 12 ขั้น แยกมนุษย์/ซอมบี้ — พาผู้เล่นใหม่ไปลองแต่ละระบบทีละขั้น พร้อมรางวัลเล็ก ๆ
// ต่อจาก "ภารกิจวันแรก" 6 ข้อเดิม (onb/) โดยไม่แตะ rules: สถานะรับรางวัลอยู่ที่ learn/{uid}/c/{ขั้น} (ฟังก์ชันเท่านั้น)
// ความคืบหน้าอ่านจากข้อมูลจริงฝั่งเซิร์ฟเวอร์ (ตัวนับ ach, ที่พัก, Season Pass, หีบรายวัน) • go = ปลายทางที่เกมพาไป (ฝั่งเกมแปลเป็นการเปิดหน้าต่าง)
const { fail, withLock, grantAll } = require("./lib");

// ชนิดเงื่อนไข: ach:[คีย์,n] • base:[ระดับ] • pass:[xp] • crate • home (ตัวนับ home)
const COMMON = {
  use: { id: "use", t: "ใช้ไอเทมจากกระเป๋า 3 ครั้ง", d: "แตะไอเทมในแท็บกระเป๋าเพื่อกิน/ดื่ม/ใช้รักษา", req: ["ach", "use", 3], go: "bag", r: [["water", 2], ["bandage", 1]] },
  srch: { id: "srch", t: "ค้นหาไอเทมรวม 25 ครั้ง", d: "ปุ่มค้นหาอยู่แท็บกระเป๋า ยิ่งค้นยิ่งเจอของ (กินพลังงาน)", req: ["ach", "srch", 25], go: "bag", r: [["energy_drink", 1], ["scrap", 3]] },
  base: { id: "base", t: "สร้างที่พักขั้น 1", d: "เปิดหน้าต่างที่พัก (ปุ่ม 🏠) วางสถานีผลิตและอัปเกรดครั้งแรก", req: ["base", 1], go: "base", r: [["scrap", 6]] },
  gard: { id: "gard", t: "ปลูกและเก็บเกี่ยวครั้งแรก", d: "หน้าต่างที่พักมีแปลงปลูก — รับเมล็ดฟรีรายวัน ลงเมล็ด รอเวลา แล้วเก็บเกี่ยว", req: ["ach", "gard", 1], go: "base", r: [["seed_herb", 2]] },
  home: { id: "home", t: "จัดห้องแล้วบันทึก 1 ครั้ง", d: "หน้าต่างที่พัก → แท็บ 🛋️ จัดห้อง เลือกของจากถาดแล้วแตะในภาพ", req: ["ach", "home", 1], go: "baseedit", r: [["deco_gift", 1]] },
  pass: { id: "pass", t: "รับ XP จากภารกิจซีซัน", d: "ศูนย์กิจกรรม (🎲) → แท็บ 🎟️ ซีซัน ทำภารกิจให้ครบแล้วกดรับ XP", req: ["pass", 1], go: "hub:pass", r: [["bandage", 2], ["canned_food", 1]] },
  crate: { id: "crate", t: "เปิดหีบรายวัน", d: "ศูนย์กิจกรรม → แท็บ 🎁 รายวัน เปิดได้วันละครั้ง ขาดวันเดียวไม่เสีย streak", req: ["crate"], go: "hub:act", r: [["water", 2]] },
  enc: { id: "enc", t: "ผ่านเหตุการณ์สุ่ม 1 ครั้ง", d: "ค้นหานอก Safe Zone บ่อย ๆ จะมีเหตุการณ์ให้เลือกทางเด้งขึ้นมา", req: ["ach", "enc", 1], go: "zone", r: [["medkit", 1]] },
  dive: { id: "dive", t: "ดิ่งลึก 1 รอบ", d: "ไปอุโมงค์หรือห้องแล็บ แล้วเปิด 🎲 ผจญภัย → ดิ่งลึก (ขึ้นจากหลุมเพื่อเก็บของ)", req: ["ach", "dive", 1], go: "hub:adv", r: [["steel_plate", 1]] },
  like: { id: "like", t: "ถูกใจห้องของผู้เล่นอื่น", d: "เปิดหน้าประวัติผู้เล่นในแชต/รายชื่อโซน แล้วกด ❤️ ถูกใจห้อง", req: ["ach", "like", 1], go: "players", r: [["energy_drink", 1]] }
};
const PATHS = {
  human: [
    COMMON.use, COMMON.srch, COMMON.base, COMMON.gard,
    { id: "craft", t: "คราฟต์ของ 1 ชิ้น", d: "มนุษย์คราฟต์ที่ Safe Zone (แท็บกระเป๋า ส่วนคราฟต์) ผ้าพันแผลเริ่มจากเศษวัสดุ", req: ["ach", "craft", 1], go: "bag", r: [["scrap", 4]] },
    COMMON.home, COMMON.pass, COMMON.crate,
    { id: "mkt", t: "ซื้อหรือขายในตลาด 1 ครั้ง", d: "ปุ่ม 🏪 ตลาด ลงขายของที่ไม่ใช้ หรือซื้อของที่ขาดจากผู้เล่นอื่น", req: ["ach", "mkt", 1], go: "market", r: [["scrap", 5]] },
    COMMON.enc, COMMON.dive, COMMON.like
  ],
  zombie: [
    { id: "use", t: "กินเนื้อ/ใช้ของ 3 ครั้ง", d: "ซอมบี้หิวด้วยเนื้อเน่า — แตะไอเทมในแท็บกระเป๋าเพื่อกิน", req: ["ach", "use", 3], go: "bag", r: [["rotten_meat", 3], ["water", 1]] },
    { ...COMMON.srch, r: [["rotten_meat", 4]] },
    { id: "bite", t: "กัดเหยื่อ 1 ครั้ง", d: "ซอมบี้โจมตีมนุษย์ในโซนเดียวกันได้ที่รายชื่อผู้เล่น (ต้องออกนอก Safe Zone)", req: ["ach", "bite", 1], go: "players", r: [["serum", 1]] },
    { ...COMMON.base, t: "สร้างรังขั้น 1", d: "เปิดหน้าต่างที่พัก (ปุ่ม 🏠) วางสถานีผลิตในรังครั้งแรก", r: [["rotten_meat", 6]] },
    { ...COMMON.gard, t: "เลี้ยงบ่อเชื้อ/เก็บเกี่ยวครั้งแรก", d: "ซอมบี้เลี้ยงเชื้อรา หนอน แอ่งน้ำเน่า ในบ่อบ่มเชื้อ รับเมล็ดฟรีรายวันแล้วลงบ่อ", r: [["seed_fungus", 2]] },
    { ...COMMON.home, t: "จัดรังแล้วบันทึก 1 ครั้ง", r: [["deco_gift", 1]] },
    COMMON.pass, COMMON.crate, COMMON.enc, COMMON.dive, COMMON.like,
    { id: "nem", t: "ล้างนักล่าคู่อาฆาต 1 ครั้ง", d: "นักล่าที่มีชื่อจะโผล่ระหว่างค้นหานอก Safe Zone — ล้มมันได้ของดี", req: ["ach", "nemk", 1], go: "zone", r: [["mutant_gland", 1]] }
  ]
};
// ของรางวัลปิดท้ายเมื่อครบทุกขั้น
const FINAL = { human: [["theme_cozy", 1], ["deco_gift", 1], ["medkit", 2]], zombie: [["theme_moss", 1], ["deco_gift", 1], ["serum", 2]] };

function makeLearn(db) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, aS, lS, bS, psS, cS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(`learn/${uid}`).get(), db.ref(`base/${uid}/lv`).get(), db.ref(`pass/${uid}/xp`).get(), db.ref(`crate/${uid}/st`).get()]);
      const p = pS.val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human", ach = col(aS.val()), L = col(lS.val()), got = col(L.c), ctx = { lv: Number(bS.val()) || 0, xp: Number(psS.val()) || 0, crate: Number(cS.val()) || 0 };
      const prog = (s) => { const r = s.req; switch (r[0]) { case "ach": { const v = Number(ach[r[1]]) || 0; return { v: Math.min(v, r[2]), n: r[2], ok: v >= r[2] }; } case "base": return { v: Math.min(ctx.lv, r[1]), n: r[1], ok: ctx.lv >= r[1] }; case "pass": return { v: Math.min(ctx.xp, r[1]), n: r[1], ok: ctx.xp >= r[1] }; case "crate": return { v: ctx.crate > 0 ? 1 : 0, n: 1, ok: ctx.crate > 0 }; default: return { v: 0, n: 1, ok: false }; } };
      const steps = PATHS[fac].map((s) => ({ id: s.id, t: s.t, d: s.d, go: s.go, r: s.r, ...prog(s), got: !!got[s.id] }));
      const allGot = steps.every((s) => s.got), fin = L.fin || null;
      const view = (extra) => Object.assign({ ok: true, fac, steps, next: steps.findIndex((s) => !s.got), final: FINAL[fac], finalGot: !!fin, allGot, done: steps.filter((s) => s.got).length }, extra || {});
      if (a === "state") return view();
      if (a === "claim") {
        const id = String(data.id || "");
        if (id === "final") {
          if (!allGot) fail("failed-precondition", "ยังทำบทเรียนไม่ครบทุกขั้น");
          if (fin) fail("failed-precondition", "รับไปแล้ว");
          await db.ref(`learn/${uid}/fin`).set(now);
          if (!(await grantAll(db, uid, FINAL[fac]))) { await db.ref(`learn/${uid}/fin`).remove(); fail("failed-precondition", "ช่องเก็บของเต็ม — เคลียร์แล้วลองใหม่"); }
          return view({ rewarded: FINAL[fac], finalGot: true });
        }
        const i = steps.findIndex((s) => s.id === id); if (i < 0) fail("invalid-argument", "ไม่มีขั้นนี้");
        const s = steps[i]; if (s.got) fail("failed-precondition", "รับไปแล้ว"); if (!s.ok) fail("failed-precondition", "ยังทำไม่ครบเงื่อนไข");
        await db.ref(`learn/${uid}/c/${id}`).set(now);
        if (!(await grantAll(db, uid, s.r))) { await db.ref(`learn/${uid}/c/${id}`).remove(); fail("failed-precondition", "ช่องเก็บของเต็ม — เคลียร์แล้วลองใหม่"); }
        s.got = true; got[id] = now;
        return Object.assign(view(), { rewarded: s.r });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeLearn, PATHS, FINAL };
