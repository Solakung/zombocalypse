// ⚡ ความสามารถประจำอาชีพ (มนุษย์ 4 สาย) / สายวิวัฒนาการ (ซอมบี้ 3 สาย): กดใช้ได้ มีค่าใช้จ่ายเล็กน้อยและคูลดาวน์
// - อาชีพมนุษย์ = สายที่คะแนนสูงสุดจากตัวนับความสำเร็จ (สูตรเดียวกับ careerOf ในเกม) • ซอมบี้ = สายวิวัฒนาการที่ขั้นสูงสุด (evo/{uid}: h/g/s)
// - เซิร์ฟเวอร์ตรวจสิทธิ์ ค่าใช้จ่าย คูลดาวน์ แล้วจดผลที่ abil/{uid} (ไม่มีใน rules) • เกมอ่านผ่านคำสั่ง state แล้วคูณเข้าตารางค้นหา/ลดดาเมจเหมือนโบนัสค่าย
// - หมอสนาม: รักษา HP ทันที (ตัวเองหรือเพื่อนมนุษย์ในโซนเดียวกัน) เขียน HP ด้วย Admin SDK • ไม่แตะหิว/น้ำ/พลังงาน
const { fail, withLock, takeItem, grantAll, dayIdx, dayEnd } = require("./lib");

const CAREER_SCORE = {
  explorer: (c) => (c.srch || 0) + 4 * (c.trav || 0) + 15 * (c.zvis || 0) + 2 * (c.nsrch || 0),
  hunter: (c) => 2 * (c.zwin || 0) + 8 * (c.boss || 0) + 3 * (c.wbhit || 0) + 4 * (c.bite || 0) + 2 * (c.smash || 0) + 10 * (c.evo || 0) + (c.wbdmg || 0) / 20,
  medic: (c) => 0.5 * (c.use || 0) + 3 * (c.heal || 0) + 15 * (c.cure || 0),
  trader: (c) => 4 * (c.mkt || 0) + 2 * (c.craft || 0) + (c.gacha || 0) + (c.dclaim || 0)
};
const CAREER_LV = [60, 250, 800, 2500, 6000, 15000];   // ต้องตรงกับ script.js (ขั้น 5–6)
const Le = (L) => (L <= 4 ? L : 4 + (L - 4) * 0.5);   // ขั้น 5+ (อาชีพขั้น 5–6 / มิวเตชันซอมบี้) ให้ผลครึ่งหนึ่งของขั้นปกติ กันแรงเกิน
const careerOf = (c) => {
  const best = Object.keys(CAREER_SCORE).map((k) => [k, CAREER_SCORE[k](c)]).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] < CAREER_LV[0]) return null;
  return { k: best[0], L: CAREER_LV.filter((v) => best[1] >= v).length };
};
const evoLine = (e, m = {}) => {
  const t = { hunter: Number(e.h) || 0, giant: Number(e.g) || 0, shade: Number(e.s) || 0, pack: Number(e.p) || 0 }, max = Math.max(t.hunter, t.giant, t.shade, t.pack);
  if (max < 1) return null;
  const pref = { hunter: "h", giant: "g", shade: "s", pack: "p" }, k = [e.line, "hunter", "giant", "shade", "pack"].find((x) => x && t[x] === max && (x !== e.line || t[e.line] === max));
  const kk = k || "hunter", mt = max >= 4 ? Math.min(4, Number(m[pref[kk]]) || 0) : 0;   // มิวเตชัน (mutate.js) เพิ่มขั้นต่อจากขั้น 4 ได้อีก 4 ขั้น
  return { k: kk, L: Math.min(4, max) + mt };
};
// ความสามารถ: n=ชื่อ i=ไอคอน d=คำอธิบาย cost=[ไอเทม, จำนวน] eff(L)=ตัวคูณ/โบนัส (ฝั่งเกมนำไปใช้) heal(L)=รักษาทันที
const ABIL = {
  explorer: { f: "h", i: "🧭", n: "ส่องทาง", d: "ค้นแล้วว่างเปล่าน้อยลง ของหายากออกง่ายขึ้น", cost: ["scrap", 2], eff: (L) => ({ n: 1 - 0.12 * L, r: 1 + 0.08 * L }) },
  hunter: { f: "h", i: "🗡️", n: "เตรียมซุ่ม", d: "เจอซอมบี้น้อยลง ทอยปะทะ +1 (ขั้น 4 = +2) ทนสถานะผิดปกติขึ้น", cost: ["canned_food", 1], eff: (L) => ({ z: 1 - 0.05 * L, dice: L >= 4 ? 2 : 1, cut: 0.03 * L }) },
  medic: { f: "h", i: "🩹", n: "ปฐมพยาบาล", d: "รักษา HP ทันทีให้ตัวเองหรือเพื่อนมนุษย์ในโซนเดียวกัน", cost: ["bandage", 1], heal: (L) => 20 + 8 * L, cd: 45 },
  trader: { f: "h", i: "💼", n: "สายส่งวัสดุ", d: "เจอเศษวัสดุ สารเคมี และอาหารมากขึ้น", cost: ["scrap", 2], eff: (L) => ({ sc: 1 + 0.07 * L, f: 1 + 0.04 * L, it: { chem: 1 + 0.10 * L } }) },
  hunterz: { f: "z", i: "🩸", n: "ล่ากลิ่น", d: "เนื้อเน่าเจอมากขึ้น ว่างเปล่าน้อยลง", cost: ["rotten_meat", 2], eff: (L) => ({ rm: 1 + 0.10 * L, n: 1 - 0.05 * L }) },
  giantz: { f: "z", i: "🗿", n: "ผิวหนา", d: "ลดดาเมจที่ได้รับ และทนสถานะผิดปกติ", cost: ["rotten_meat", 2], eff: (L) => ({ cut: 0.05 * L }) },
  shadez: { f: "z", i: "🕷️", n: "ซุ่มเงียบ", d: "ค้นแล้วว่างเปล่าน้อยลง ของหายากออกง่ายขึ้น", cost: ["rotten_meat", 2], eff: (L) => ({ n: 1 - 0.10 * L, r: 1 + 0.06 * L }) },
  packz: { f: "z", i: "🦖", n: "เสียงเรียกฝูง", d: "ลูกฝูงรับดาเมจแทนบ่อยขึ้น และหลบง่ายขึ้นชั่วคราว", cost: ["rotten_meat", 2], eff: (L) => ({ icpt: 0.03 * L, dodge: 0.03 * L }) }
};
const ZMAP = { hunter: "hunterz", giant: "giantz", shade: "shadez", pack: "packz" };
const dur = (L) => (8 + 2 * Le(L)) * 60000;                 // 10/12/14/16 นาที
const cdOf = (id, L) => (ABIL[id].cd || (100 - 10 * Le(L))) * 60000;   // ปกติ 90/80/70/60 นาที (หมอ 45 นาที)
const AID_DAY = 5, AID_REW = [["herb_bundle", 1]];

function makeAbility(db) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  async function who(uid) {
    const [pS, aS, eS, mS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(`evo/${uid}`).get(), db.ref(`mut/${uid}`).get()]);
    const p = pS.val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    const zom = p.faction === "zombie";
    if (zom) { const l = evoLine(col(eS.val()), col(mS.val())); return { p, zom, id: l ? ZMAP[l.k] : null, L: l ? l.L : 0, line: l && l.k }; }
    const c = careerOf(col(aS.val())); return { p, zom, id: c ? c.k : null, L: c ? c.L : 0, line: c && c.k };
  }
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const w = await who(uid), st = col((await db.ref(`abil/${uid}`).get()).val());
      const A = w.id ? ABIL[w.id] : null, on = col(st.on), cd = col(st.cd), di = dayIdx(now), aid = st.ad === di ? st.an || 0 : 0;
      const live = on.id && on.until > now ? { id: on.id, until: on.until, L: on.L, eff: ABIL[on.id] && ABIL[on.id].eff ? ABIL[on.id].eff(Le(on.L)) : null } : null;
      const view = (extra) => Object.assign({ ok: true, has: !!A, id: w.id, L: w.L, zom: w.zom, i: A && A.i, n: A && A.n, d: A && A.d, cost: A && A.cost, dur: A && A.eff ? Math.round(dur(w.L) / 60000) : 0, heal: A && A.heal ? A.heal(Le(w.L)) : 0, cdLeft: A ? Math.max(0, (Number(cd[w.id]) || 0) - now) : 0, live, aidLeft: Math.max(0, AID_DAY - aid), end: dayEnd(now) }, extra || {});
      if (a === "state") return view();
      if (a !== "use") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
      if (!A) fail("failed-precondition", w.zom ? "ยังไม่ได้เลือกสายวิวัฒนาการ (ลงแต้ม DNA อย่างน้อย 1 ขั้น)" : "ยังไม่มีอาชีพ (สะสมคะแนนจากการเล่นให้ถึงขั้นแรกก่อน)");
      if (!(w.p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      if ((Number(cd[w.id]) || 0) > now) fail("failed-precondition", "ยังติดคูลดาวน์");
      if (A.heal) {   // หมอสนาม
        const to = data.to ? String(data.to) : uid, self = to === uid;
        let tp = w.p;
        if (!self) {
          tp = (await db.ref(`users/${to}`).get()).val();
          if (!tp || tp.banned === true || tp.faction !== "human" || !(tp.hp > 0)) fail("failed-precondition", "รักษาคนนี้ไม่ได้");
          if (tp.zone !== w.p.zone || w.p.zone === "safe" && false) fail("failed-precondition", "ต้องอยู่โซนเดียวกัน");
          if (aid >= AID_DAY) fail("resource-exhausted", `วันนี้ช่วยเพื่อนครบ ${AID_DAY} ครั้งแล้ว`);
        }
        if (!(tp.hp > 0)) fail("failed-precondition", "รักษาไม่ได้");
        if (!(await takeItem(db, uid, A.cost[0], A.cost[1]))) fail("failed-precondition", "ของไม่พอสำหรับใช้ความสามารถ");
        let gained = 0;
        await db.ref(`users/${to}/hp`).transaction((cur) => { if (typeof cur !== "number") return cur; const cap = Math.max(cur, 100), nx = Math.min(cap, cur + A.heal(Le(w.L))); gained = nx - cur; return nx; });
        await db.ref(`abil/${uid}`).update({ [`cd/${w.id}`]: now + cdOf(w.id, w.L), ...(self ? {} : { ad: di, an: aid + 1 }) });
        cd[w.id] = now + cdOf(w.id, w.L);
        let rew = null; if (!self && (await grantAll(db, uid, AID_REW))) rew = AID_REW;
        return view({ used: true, healed: gained, to: self ? null : { uid: to, name: tp.username }, rew, aidLeft: Math.max(0, AID_DAY - (self ? aid : aid + 1)) });
      }
      if (!(await takeItem(db, uid, A.cost[0], A.cost[1]))) fail("failed-precondition", "ของไม่พอสำหรับใช้ความสามารถ");
      const until = now + dur(w.L);
      await db.ref(`abil/${uid}`).update({ on: { id: w.id, until, L: w.L, at: now }, [`cd/${w.id}`]: now + cdOf(w.id, w.L) });
      on.id = w.id; on.until = until; on.L = w.L; cd[w.id] = now + cdOf(w.id, w.L);
      return view({ used: true, live: { id: w.id, until, L: w.L, eff: A.eff(Le(w.L)) }, cdLeft: cdOf(w.id, w.L) });
    });
  }
  return { run };
}
module.exports = { makeAbility, ABIL, careerOf, evoLine, dur, cdOf };
