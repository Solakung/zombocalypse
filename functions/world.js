// 🌍 อีเวนต์โลกรายสัปดาห์ (7 วัน จันทร์–อาทิตย์ เวลาไทย): ผู้เล่นทุกคนช่วยกันทำเป้าหมายรวม → รับรางวัลตามเปอร์เซ็นต์ที่ทำได้
// การมีส่วนร่วม = ตัวนับ ach/{uid}/c ที่เพิ่มขึ้นหลังเข้าร่วม (ค่าตั้งต้นจดโดยเซิร์ฟเวอร์) • world/ อยู่นอก rules → อ่าน/เขียนผ่านฟังก์ชันนี้เท่านั้น
const { fail, withLock, grantAll, dayIdx, TZ, DAY } = require("./lib");
const SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / DAY);   // จันทร์ — ต้องตรงกับ script.js / pass.js

const EVENTS = [
  { k: "found", per: 120, icon: "🚚", name: "ขนเสบียงเข้าเมือง", say: "ทั้งเมืองต้องการเสบียงด่วน ช่วยกันเก็บของที่ค้นเจอ", unit: "ชิ้นที่เจอ" },
  { k: "srch", per: 200, icon: "🗺️", name: "สำรวจเมืองร้าง", say: "แผนที่เมืองยังขาดอีกหลายจุด ช่วยกันออกค้นหา", unit: "ครั้งที่ค้นหา" },
  { k: "use", per: 60, icon: "💊", name: "ระดมยาช่วยผู้บาดเจ็บ", say: "โรคภัยแพร่หลาย ทุกการใช้ไอเทมรักษาช่วยพยุงเมืองไว้", unit: "ครั้งที่ใช้ไอเทม" },
  { k: "bcol", per: 40, icon: "🏠", name: "ฟื้นฟูที่พักทั่วเมือง", say: "เก็บผลผลิตจากที่พักไปแบ่งปันกัน", unit: "ชิ้นที่เก็บจากที่พัก" },
  { k: "nsrch", per: 80, icon: "🌙", name: "เฝ้ายามค่ำคืน", say: "ค่ำคืนอันตราย ใครกล้าออกไปค้นหาตอนมืดช่วยเมืองได้มาก", unit: "ครั้งที่ค้นหากลางคืน" },
  { k: "mkt", per: 20, icon: "🏪", name: "ตลาดคึกคัก", say: "เศรษฐกิจเมืองกำลังฟื้น ช่วยกันซื้อขายในตลาด", unit: "ครั้งที่ซื้อ/ขาย" }
];
const MS = [{ p: 0.4, r: { human: [["canned_food", 3], ["bandage", 2]], zombie: [["rotten_meat", 5]] } },
  { p: 0.7, r: { human: [["medkit", 1], ["scrap", 6]], zombie: [["serum", 1], ["rotten_meat", 5]] } },
  { p: 1, r: { human: [["trauma_kit", 1], ["steel_plate", 1], ["survivor_badge", 1]], zombie: [["mutant_gland", 2], ["serum", 1], ["survivor_badge", 1]] } }];
const MIN_FRAC = 0.25, CAP_FRAC = 2, MIN_NP = 5;
const weekIdx = (now) => Math.floor((dayIdx(now) - SEA_EPOCH) / 7);
const weekEnd = (now) => (SEA_EPOCH + (weekIdx(now) + 1) * 7) * DAY - TZ;
const evOf = (wi) => EVENTS[((wi % EVENTS.length) + EVENTS.length) % EVENTS.length];

function makeWorld(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const wi = weekIdx(now), ev = evOf(wi), path = `world/${wi}`;
      const [pS, cS, wS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(path).get()]);
      const p = pS.val(), c = cS.val() || {}, w = wS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human";
      let me = w.u && w.u[uid], tot = w.tot || 0, np = w.np || 0;
      const cap = ev.per * CAP_FRAC;
      if (a === "state" || a === "claim") {
        if (!me) {   // เข้าร่วม: จดค่าตั้งต้นของตัวนับ + นับจำนวนผู้เข้าร่วม
          me = { b: c[ev.k] || 0, c: 0, ts: now }; await db.ref(`${path}/u/${uid}`).set(me);
          np = (await db.ref(`${path}/np`).transaction((x) => (x || 0) + 1)).snapshot.val();
        } else {
          const nc = Math.min(cap, Math.max(0, (c[ev.k] || 0) - me.b)), d = nc - (me.c || 0);
          if (d > 0) { tot = (await db.ref(`${path}/tot`).transaction((x) => (x || 0) + d)).snapshot.val(); await db.ref(`${path}/u/${uid}/c`).set(nc); me.c = nc; }
        }
      }
      const goal = ev.per * Math.max(MIN_NP, np), min = Math.ceil(ev.per * MIN_FRAC), mine = (me && me.c) || 0, cl = (me && me.cl) || {};
      const view = (extra) => Object.assign({
        ok: true, wi, k: ev.k, icon: ev.icon, name: ev.name, say: ev.say, unit: ev.unit, per: ev.per, goal, tot, np, mine, min, end: weekEnd(now),
        ms: MS.map((m, i) => ({ i, p: m.p, need: Math.ceil(goal * m.p), ok: tot >= goal * m.p, got: !!cl[i], rew: m.r[fac] }))
      }, extra || {});
      if (a === "state") return view();
      if (a === "claim") {
        const i = Number(data.i), m = MS[i];
        if (!m) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
        if (!(tot >= goal * m.p)) fail("failed-precondition", "เป้าหมายรวมยังไม่ถึงขั้นนี้");
        if (mine < min) fail("failed-precondition", `ต้องมีส่วนร่วมอย่างน้อย ${min} ${ev.unit} ถึงจะรับรางวัลได้`);
        if (cl[i]) fail("failed-precondition", "รับไปแล้ว");
        await db.ref(`${path}/u/${uid}/cl/${i}`).set(1);
        if (!(await grantAll(db, uid, m.r[fac]))) { await db.ref(`${path}/u/${uid}/cl/${i}`).remove(); fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วลองใหม่"); }
        cl[i] = 1;
        return view({ rewarded: m.r[fac] });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeWorld, EVENTS, MS, weekIdx };
