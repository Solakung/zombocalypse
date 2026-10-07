// ⛓️ คุก (ก้อนที่ 3 ของระบบส้ม/ค่าหัว/คุก) — คนส้มที่ถูกผู้เล่นที่ไม่ใช่ส้มล้ม = "ถูกจับ" → ติดคุกตามเวลา มี 3 ทางออก: ครบเวลา / จ่ายประกัน / แหกคุก
// - สถานะที่ `jail/{uid}` = {until, t ชั้นโทษ, tm ระยะโทษรวม(นาที), w นาทีที่ลดด้วยการทำงาน, ts, by ผู้จับ, wt/et เวลาทำงาน/แหกคุกล่าสุด} (ผู้เล่นอ่านของตัวเองได้ • เขียนได้เฉพาะฟังก์ชัน) • `jailn/{uid}` = {n จำนวนครั้งที่แหกคุก, ts}
//   คุกคือโซนซ่อน `jail` (เหมือนคาสิโน: ไม่มีค่าเดินทาง ไม่ค้นหา ต่อสู้ไม่ได้) — rules: เข้าคุกได้เมื่อ jail/{uid}/until > now, ออกจากคุกด้วยตัวเองไม่ได้ (ฟังก์ชันย้ายให้)
// - จับ (`capture`): ผู้ถูกฆ่า (role:"victim") หรือผู้ฆ่า (role:"killer") เรียกหลังเป้าหมาย HP=0 — เซิร์ฟเวอร์ตรวจเอง: เป้าเป็นส้มอยู่ / ผู้ฆ่าไม่ใช่ส้ม / ทั้งคู่เป็นผู้เล่น / โซนเดียวกัน (ไม่ใช่ Safe/คาสิโน/คุก) /
//   ผู้ฆ่าโจมตีล่าสุด ≤90 วินาที / ไม่ได้ติดคุกอยู่ / ซ้ำใน 2 นาทีนับครั้งเดียว → เป้าติดคุก (สถานะส้มถูกล้าง) • ผู้ฆ่าได้ของยึดจากกระเป๋าผู้ต้องขัง: ของทั่วไปสุ่ม 1 ชนิด จำนวน = ชั้นโทษ (ไม่ใช่ของสร้างใหม่)
// - ชั้นโทษ t = 1 + min(3, จำนวนครั้งที่แหกคุกใน 24 ชม.) • ระยะโทษ = jail_min (30 นาที) × t • ค่าประกัน = jail_bail (30) × t แต้มวัตถุดิบ • แหกคุกสำเร็จ jail_esc% (25) — สำเร็จ: ออกทันที แต่กลับเป็นส้ม (ครั้งที่ n+1) และชั้นโทษรอบหน้าสูงขึ้น •
//   ล้มเหลว: เวลา +5 นาที เสียของทั่วไป 1 ชิ้น พักลองใหม่ 5 นาที • ทำงานในคุก: ลดโทษ 2 นาที/ครั้ง (พัก 20 วินาที) รวมได้ไม่เกินครึ่งของโทษ • ครบเวลา: เสียของทั่วไปอย่างน้อย 1 ชิ้นแบบสุ่ม (ไม่รวมอาวุธ/ของหายาก/ของที่สวม) • จ่ายประกันไม่เสียของ
// - ปิดอยู่จนกว่าตั้ง tune jail_on = 1 • ปรับได้: jail_min / jail_bail / jail_esc
const crypto = require("crypto");
const { fail, withLock, takeItem, grantAll } = require("./lib");
const { payPts } = require("./paypts");

const ATK_WINDOW = 90000, DEDUPE_MS = 120000, WORK_MIN = 2, WORK_CD = 20000, ESC_CD = 300000, ESC_FAIL_MIN = 5, DECAY_MS = 86400000, MAX_T = 4;
// ของทั่วไปที่ยึด/ริบได้ (ทุกรหัสต้องอยู่ใน ITEMS ของเกมและ whitelist กระเป๋า) — ไม่รวมอาวุธ/เกราะ/ของหายาก
const COMMON = ["scrap", "chem", "canned_food", "water", "bandage", "rusty_nails", "leather_scrap", "duct_tape", "bread", "fruit", "rotten_meat", "moss"];
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

function makeJail(db, rnd) {
  const rf = rnd || (() => crypto.randomInt(1000000) / 1000000);
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function cfg() { return { on: (await tune("jail_on", 0)) === 1, mins: Math.max(1, await tune("jail_min", 30)), bail: Math.max(1, await tune("jail_bail", 30)), esc: Math.min(100, Math.max(0, await tune("jail_esc", 25))), crimMins: Math.max(1, await tune("crim_min", 45)) }; }
  const active = (j, now) => !!j && num(j.until) > now;
  const orange = (c, now) => !!c && num(c.until) > now;
  const escN = (jn, now) => (jn && now - num(jn.ts) <= DECAY_MS ? Math.max(0, num(jn.n)) : 0);
  const tierOf = (n) => Math.min(MAX_T, 1 + Math.min(3, n));
  const okRole = (u) => !!u && u.role === "player" && u.banned !== true;
  async function pickCommon(uid) {   // สุ่ม 1 ชนิดจากของทั่วไปที่มีในกระเป๋า → [id, มีอยู่] หรือ null
    const inv = (await db.ref(`inventory/${uid}`).get()).val() || {}, have = COMMON.filter((id) => inv[id] && inv[id].id === id && num(inv[id].qty) > 0);
    if (!have.length) return null; const id = have[Math.floor(rf() * have.length)]; return [id, num(inv[id].qty)];
  }
  const view = (j, jn, C, now) => ({ active: active(j, now), until: j ? num(j.until) : 0, tier: j ? num(j.t) || 1 : tierOf(escN(jn, now)), tm: j ? num(j.tm) : 0, w: j ? num(j.w) : 0, bailPts: C.bail * (j ? num(j.t) || 1 : tierOf(escN(jn, now))), esc: C.esc, workLeftAt: j ? num(j.wt) + WORK_CD : 0, escLeftAt: j ? num(j.et) + ESC_CD : 0 });

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "capture", "work", "escape", "bail", "release"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const C = await cfg();
    if (a === "state") { const [jS, nS] = await Promise.all([db.ref(`jail/${uid}`).get(), db.ref(`jailn/${uid}`).get()]); return { ok: true, on: C.on, ...view(jS.val(), nS.val(), C, now) }; }
    const jailed = async (id) => (await db.ref(`jail/${id}`).get()).val();

    if (a === "capture") {
      if (!C.on) return { ok: true, on: false };
      const role = data.role === "killer" ? "killer" : "victim", other = String(data.other || "");
      if (!other || other === uid || !/^[A-Za-z0-9_-]{1,64}$/.test(other)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      const vid = role === "victim" ? uid : other, kid = role === "victim" ? other : uid;
      const [vS, kS, vcS, kcS, vjS, jnS] = await Promise.all([db.ref(`users/${vid}`).get(), db.ref(`users/${kid}`).get(), db.ref(`crim/${vid}`).get(), db.ref(`crim/${kid}`).get(), db.ref(`jail/${vid}`).get(), db.ref(`jailn/${vid}`).get()]);
      const v = vS.val(), k = kS.val(), no = (why) => ({ ok: true, on: true, captured: false, why });
      if (!okRole(v) || !okRole(k)) return no("user");
      if (!(v.hp === 0)) return no("alive");
      if (v.zone !== k.zone || ["safe", "casino", "jail"].includes(v.zone)) return no("zone");
      if (!orange(vcS.val(), now)) return no("not-orange");
      if (orange(kcS.val(), now)) return no("killer-orange");
      if (!(num(k.lastAttack) > 0 && now - num(k.lastAttack) <= ATK_WINDOW)) return no("stale");
      if (active(vjS.val(), now)) return no("already");
      let dup = false;
      await db.ref(`jailrep/${vid}`).transaction((cur) => { dup = false; if (cur === null) return { ts: now, by: kid }; if (now - num(cur.ts) < DEDUPE_MS) { dup = true; return undefined; } return { ts: now, by: kid }; });
      if (dup) return no("dup");
      const t = tierOf(escN(jnS.val(), now)), tm = C.mins * t;
      await db.ref().update({ [`jail/${vid}`]: { until: now + tm * 60000, t, tm, w: 0, ts: now, by: k.username }, [`crim/${vid}`]: { until: now, n: num((vcS.val() || {}).n), ts: num((vcS.val() || {}).ts) } });
      let reward = null;   // ของยึด: ของทั่วไป 1 ชนิดจากกระเป๋าผู้ต้องขัง จำนวนเท่าชั้นโทษ (ย้ายของจริง ไม่สร้างใหม่)
      const pick = await pickCommon(vid);
      if (pick) {
        const [id, have] = pick, q = Math.min(have, t);
        if (await takeItem(db, vid, id, q)) { if (await grantAll(db, kid, [[id, q]])) reward = { id, qty: q }; else await grantAll(db, vid, [[id, q]]).catch(() => {}); }
      }
      return { ok: true, on: true, captured: true, who: vid, by: kid, until: now + tm * 60000, tier: t, reward };
    }

    if (!C.on) return { ok: true, on: false };
    return withLock(db, uid, now, async () => {
      const [j, jnv, u] = await Promise.all([jailed(uid), db.ref(`jailn/${uid}`).get().then((s) => s.val()), db.ref(`users/${uid}`).get().then((s) => s.val())]);
      if (!u || u.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const leave = async (zone, extra = {}) => { await db.ref().update({ [`jail/${uid}`]: null, [`users/${uid}/zone`]: zone, ...extra }); };
      if (a === "release") {
        if (!j) { const stuck = u.zone === "jail"; if (stuck) await db.ref(`users/${uid}/zone`).set("safe"); return { ok: true, on: true, released: stuck, zone: stuck ? "safe" : u.zone }; }   // ไม่มีบันทึกคุกแต่ยังค้างโซนคุก (ข้อมูลหลุด) → ปล่อยออก
        if (active(j, now)) fail("failed-precondition", "ยังไม่ครบโทษ");
        let lost = null; const pick = await pickCommon(uid);
        if (pick && (await takeItem(db, uid, pick[0], 1))) lost = { id: pick[0], qty: 1 };
        await leave("safe"); await db.ref(`jailn/${uid}`).set({ n: escN(jnv, now), ts: now });
        return { ok: true, on: true, released: true, zone: "safe", lost };
      }
      if (!active(j, now)) fail("failed-precondition", "คุณไม่ได้ติดคุกอยู่");
      const t = num(j.t) || 1;
      if (a === "work") {
        if (now - num(j.wt) < WORK_CD) fail("resource-exhausted", `พักก่อน อีก ${Math.ceil((WORK_CD - (now - num(j.wt))) / 1000)} วินาที`);
        const cap = Math.floor(num(j.tm) / 2);
        if (num(j.w) + WORK_MIN > cap) fail("failed-precondition", "ทำงานลดโทษได้ไม่เกินครึ่งหนึ่งของโทษแล้ว");
        const nu = num(j.until) - WORK_MIN * 60000; await db.ref(`jail/${uid}`).update({ until: nu, w: num(j.w) + WORK_MIN, wt: now });
        return { ok: true, on: true, until: nu, w: num(j.w) + WORK_MIN, ended: nu <= now };
      }
      if (a === "bail") {
        const need = C.bail * t, paid = await payPts(db, uid, need, "จ่ายค่าประกัน");
        await leave("safe"); return { ok: true, on: true, released: true, zone: "safe", paid, pts: need };
      }
      // escape
      if (now - num(j.et) < ESC_CD) fail("resource-exhausted", `เพิ่งลองแหกคุกไป รออีก ${Math.ceil((ESC_CD - (now - num(j.et))) / 1000)} วินาที`);
      if (rf() * 100 < C.esc) {
        const n = escN(jnv, now) + 1, cS = (await db.ref(`crim/${uid}`).get()).val(), cn = Math.min(4, (cS && now - num(cS.ts) <= DECAY_MS ? Math.min(4, num(cS.n)) : 0) + 1);
        await leave("ruins", { [`crim/${uid}`]: { until: now + C.crimMins * 60000 * cn, n: cn, ts: now }, [`jailn/${uid}`]: { n, ts: now } });
        return { ok: true, on: true, escaped: true, zone: "ruins", n };
      }
      let lost = null; const pick = await pickCommon(uid);
      if (pick && (await takeItem(db, uid, pick[0], 1))) lost = { id: pick[0], qty: 1 };
      const nu = num(j.until) + ESC_FAIL_MIN * 60000; await db.ref(`jail/${uid}`).update({ until: nu, et: now });
      return { ok: true, on: true, escaped: false, until: nu, lost };
    });
  }
  return { run };
}
module.exports = { makeJail, COMMON, MAX_T, WORK_MIN, WORK_CD, ESC_CD, ESC_FAIL_MIN };
