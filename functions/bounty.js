// 💰 ค่าหัวแบบใหม่ (ก้อนที่ 2 ของระบบส้ม/ค่าหัว/คุก) — ตั้งโดยจ่ายวัตถุดิบ สะสมเป็นแต้ม ไม่หมดเวลา (แค่ลดช้าๆ) จ่ายเป็นวัตถุดิบให้คนที่ล้มเป้าหมาย
// - โหนด `bty/{เป้าหมาย}` = {pts, ts, tn, bn, s:{uid:แต้ม}, kb?, kts?, paid?} • ไม่มีกฎเขียนใน rules → เขียนได้เฉพาะฟังก์ชันนี้ • ทุกคนอ่านได้ (แสดงค่าหัว/วิทยุ)
// - ตั้ง (`place`): จ่ายวัตถุดิบ STEP แต้ม (ค่าเริ่มต้น 10) → ค่าหัว +STEP • เพดานรวม CAP ต่อเป้าหมาย (200) • คนเดิมตั้งให้คนเดิมได้ 3 ครั้ง/วัน • เว้น 30 วินาทีระหว่างครั้ง • ตั้งให้ตัวเอง/ทีมงาน/คนโดนแบนไม่ได้
// - ลดตามเวลา: ค่าจริง = pts × (1 − DECAY% × จำนวนวันนับจากการตั้งครั้งล่าสุด) (ค่าเริ่มต้น 3%/วัน) — ต้องตรงกับ bty2Eff ใน script.js
// - เก็บ (`claim`): ผู้ฆ่า (role:"killer") หรือผู้ถูกฆ่า (role:"victim") เรียกหลังเป้าหมาย HP=0 — เซิร์ฟเวอร์ตรวจเอง: ผู้ฆ่าโจมตีล่าสุด ≤90 วินาที / โซนเดียวกัน (ไม่ใช่ Safe/คาสิโน/คุก) / ผู้ฆ่าไม่ใช่คนตั้งค่าหัวนี้ / ยังมีค่าหัวเหลือ
//   จ่ายให้ผู้ฆ่า = ค่าจริง × (100 − FEE)% (หัก 20% เป็นค่าธรรมเนียม = ตัวดูดทรัพยากร) เป็นเศษเหล็ก+สารเคมี • ไม่ผูกกับสถานะส้ม (ฆ่าฝ่ายเดียวกันที่ไม่ใช่ส้มยังติดส้มตามระบบ crim)
// - ปิดอยู่จนกว่าตั้ง tune bty2_on = 1 (เกมสลับไปใช้ค่าหัวใหม่และซ่อนค่าหัวเดิมเอง) • ปรับได้: bty_step / bty_cap / bty_decay / bty_fee
const { fail, withLock, grantAll, dayIdx } = require("./lib");
const { payPts, ptsToItems } = require("./paypts");

const ATK_WINDOW = 90000, CD_MS = 30000, PER_DAY = 3, DAY_MS = 86400000;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
// ค่าจริงหลังลดตามเวลา (ฟังก์ชันเดียวกับ script.js)
const effPts = (b, now, decay) => (b && num(b.pts) > 0 ? Math.max(0, Math.round(num(b.pts) * (1 - (decay / 100) * Math.max(0, (now - num(b.ts)) / DAY_MS)))) : 0);

function makeBounty(db) {
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function cfg() { return { on: (await tune("bty2_on", 0)) === 1, step: Math.max(1, Math.floor(await tune("bty_step", 10))), cap: Math.max(1, Math.floor(await tune("bty_cap", 200))), decay: Math.max(0, await tune("bty_decay", 3)), fee: Math.min(100, Math.max(0, await tune("bty_fee", 20))) }; }
  const okRole = (u) => !!u && u.role === "player" && u.banned !== true;

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "place", "claim"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const C = await cfg();
    if (a === "state") return { ok: true, on: C.on, step: C.step, cap: C.cap, decay: C.decay, fee: C.fee };
    if (!C.on) return { ok: true, on: false };
    const other = String((data && (a === "place" ? data.target : data.other)) || "");
    if (!other || other === uid || !/^[A-Za-z0-9_-]{1,64}$/.test(other)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");

    if (a === "place") return withLock(db, uid, now, async () => {
      const [meS, tS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`users/${other}`).get()]), me = meS.val(), t = tS.val();
      if (!okRole(me)) fail("permission-denied", "บัญชีนี้ตั้งค่าหัวไม่ได้");
      if (!okRole(t)) fail("failed-precondition", "ตั้งค่าหัวคนนี้ไม่ได้");
      if (!(me.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      const day = dayIdx(now), rl = (await db.ref(`btyrl/${uid}`).get()).val() || {}, used = rl.d === day && rl.t && rl.t[other] ? num(rl.t[other]) : 0;
      if (now - num(rl.ts) < CD_MS) fail("resource-exhausted", `ตั้งค่าหัวเร็วเกินไป รออีก ${Math.ceil((CD_MS - (now - num(rl.ts))) / 1000)} วินาที`);
      if (used >= PER_DAY) fail("resource-exhausted", `วันนี้คุณเพิ่มค่าหัวคนนี้ครบ ${PER_DAY} ครั้งแล้ว`);
      const cur = (await db.ref(`bty/${other}`).get()).val(), eff = effPts(cur, now, C.decay);
      if (eff + C.step > C.cap) fail("failed-precondition", `ค่าหัวคนนี้เต็มเพดาน ${C.cap} แต้มแล้ว`);
      const paid = await payPts(db, uid, C.step, "ตั้งค่าหัว");
      let committed = null;
      await db.ref(`bty/${other}`).transaction((c) => {
        const e = effPts(c, now, C.decay), s = c && c.s && typeof c.s === "object" ? { ...c.s } : {}; if (!c || c.kb) { for (const k of Object.keys(s)) delete s[k]; }
        s[uid] = num(s[uid]) + C.step;
        committed = { pts: e + C.step, ts: now, tn: t.username, bn: me.username, s };
        return committed;
      });
      await db.ref(`btyrl/${uid}`).set({ ts: now, d: day, t: { ...(rl.d === day && rl.t ? rl.t : {}), [other]: used + 1 } });
      return { ok: true, on: true, pts: committed.pts, paid };
    });

    // claim
    const role = data.role === "victim" ? "victim" : "killer", kid = role === "killer" ? uid : other, vid = role === "killer" ? other : uid;
    const [kS, vS, bS] = await Promise.all([db.ref(`users/${kid}`).get(), db.ref(`users/${vid}`).get(), db.ref(`bty/${vid}`).get()]), k = kS.val(), v = vS.val(), b = bS.val();
    const no = (why) => ({ ok: true, on: true, claimed: false, why });
    if (!okRole(k) || !okRole(v)) return no("user");
    if (!(v.hp === 0)) return no("alive");
    if (k.zone !== v.zone || ["safe", "casino", "jail"].includes(v.zone)) return no("zone");
    if (!(num(k.lastAttack) > 0 && now - num(k.lastAttack) <= ATK_WINDOW)) return no("stale");
    if (!b || b.kb) return no("none");
    if (b.s && b.s[kid]) return no("setter");
    let take = null;
    await db.ref(`bty/${vid}`).transaction((c) => {
      take = null; if (c === null) return c;
      if (c.kb || (c.s && c.s[kid])) return undefined;
      const e = effPts(c, now, C.decay); if (e <= 0) return undefined;
      take = e; return { tn: c.tn, bn: c.bn, ts: c.ts, pts: 0, kb: k.username, kts: now, paid: Math.floor((e * (100 - C.fee)) / 100), s: {} };
    });
    if (!take) return no("none");
    const pay = Math.floor((take * (100 - C.fee)) / 100), list = ptsToItems(pay);
    if (list.length && !(await grantAll(db, kid, list))) {   // กระเป๋าเต็ม → คืนค่าหัวให้ครบ แล้วบอกให้เคลียร์ช่อง
      await db.ref(`bty/${vid}`).set(b); fail("failed-precondition", "กระเป๋าเต็ม — เคลียร์ช่องแล้วลองใหม่ (ค่าหัวยังอยู่ ไม่หาย)");
    }
    return { ok: true, on: true, claimed: true, who: kid, target: v.username, pts: take, pay, items: list.map(([id, qty]) => ({ id, qty })) };
  }
  return { run };
}
module.exports = { makeBounty, effPts, ATK_WINDOW, PER_DAY, CD_MS };
