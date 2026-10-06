// 📡 ภารกิจ HC — ตามหาธาราที่ศูนย์วิจัย (ค้นพบทั้งเซิร์ฟเวอร์ครั้งเดียว) + ส่งชิ้นส่วน DNA — ทำที่ฝั่งเซิร์ฟเวอร์ทั้งหมด
// - เหตุผล: rules ของ coop/{key}/{uid} เดิมไม่ตรวจว่าผู้ส่งเสียของจริง (เพิ่มได้ครั้งละ ≤300 ทุก 4 วินาที) → ย้ายยอดส่ง DNA มาที่นี่และปิดการเขียนตรงของ coop/hc1 ใน rules
// - ทอยค้นเจอธารา: ผู้เล่นเรียก roll หลังค้นที่ศูนย์วิจัย (มนุษย์ต้องล้มผู้เฝ้าก่อน — บิต 21 ของ npc/{uid}/tara.m) โอกาสคงที่ต่อครั้ง (tune hc_pm ‰, ซอมบี้ครึ่งหนึ่ง) • ใครเจอก่อนได้เป็น "ผู้ค้นพบ" (hc/state) ได้ของรางวัล + ประกาศ
// - กันสแปมทอย: ถังโทเค็น 12 ครั้ง เติม 1 ครั้งต่อ 2 นาที (ใกล้เคียงอัตราค้นหาจริงที่ใช้พลังงานครั้งละ 10)
const crypto = require("crypto");
const { fail, withLock, takeItem, addCapped } = require("./lib");

const BOSS_BIT = 1 << 21, FOUND_BIT = 1 << 22, KEY = "hc1", GOAL_DEFAULT = 300, PM_DEFAULT = 4, BURST = 12, REFILL_MS = 120000;
// ของรางวัลผู้ค้นพบ: มนุษย์ได้อาวุธเฉพาะ (rules รองรับ id "custom" ที่ดาเมจ/ชื่ออยู่ในช่องของเอง) ดาเมจสูงกว่าปืน (ปืนพก 25 / ลูกซอง 32) แต่ทนต่ำ 7 ครั้ง ซ่อมไม่ได้ • ซอมบี้ได้ต่อมกลายพันธุ์ระดับสูง
const WEAPON = { id: "custom", qty: 1, dur: 7, maxDur: 7, name: "🧬 สกัลเปลล์ DNA ของธารา", dmg: 36, type: "weapon" };
const ZOM_REWARD = "mut_fang5";
const col = (x) => (x && typeof x === "object" ? x : {});

function makeHc(db, admin) {
  // ล็อกโลกแบบรอ (ส่งพร้อมกันหลายคนต้องไม่เกินเป้า): ลองใหม่ถ้าติดล็อก
  async function lockWait(key, now, fn, tries = 15) { for (let i = 0; i < tries; i++) { try { return await withLock(db, key, now, fn); } catch (e) { if (e && e.code === "aborted" && i < tries - 1) { await new Promise((r) => setTimeout(r, 120)); continue; } throw e; } } }
  const SV = () => admin.database.ServerValue.TIMESTAMP;
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function totals(uid) { const s = col((await db.ref(`coop/${KEY}`).get()).val()); let t = 0; for (const x of Object.values(s)) t += Number(col(x).n) || 0; return { total: t, mine: Number(col(s[uid]).n) || 0 }; }
  async function view(uid, extra) {
    const [on, goal, st, tt] = await Promise.all([tune("hc_on", 0), tune("hc_goal", GOAL_DEFAULT), db.ref("hc/state").get(), totals(uid)]);
    const G = Math.max(1, Math.round(goal));
    return Object.assign({ ok: true, on: on === 1, goal: G, total: tt.total, mine: tt.mine, found: st.exists() ? col(st.val()) : null }, extra || {});
  }
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "state") return view(uid);
    if (a !== "roll" && a !== "donate") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    return withLock(db, uid, now, async () => {
      const pS = await db.ref(`users/${uid}`).get(), p = pS.val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      const zom = p.faction === "zombie", on = (await tune("hc_on", 0)) === 1, st0 = await db.ref("hc/state").get();
      if (a === "roll") {
        if (!on) fail("failed-precondition", "ภารกิจยังไม่เปิด");
        if (st0.exists()) return view(uid, { hit: false, already: true });
        if (p.zone !== "lab") fail("failed-precondition", "ต้องอยู่ที่ศูนย์วิจัย");
        if (!zom) { const m = Number(col((await db.ref(`npc/${uid}/tara`).get()).val()).m) || 0; if (!(m & BOSS_BIT)) return { ok: true, hit: false, skip: "boss" }; }
        let allowed = false;   // ถังโทเค็น
        await db.ref(`hc/rl/${uid}`).transaction((c) => { allowed = false; if (c === null) { allowed = true; return { tk: BURST - 1, t: now }; } const tk = Math.min(BURST, (Number(c.tk) || 0) + Math.max(0, now - (Number(c.t) || 0)) / REFILL_MS); if (tk < 1) return undefined; allowed = true; return { tk: tk - 1, t: now }; });
        if (!allowed) return { ok: true, hit: false, limited: true };
        const pm = Math.max(0, await tune("hc_pm", PM_DEFAULT)), prob = (pm / 1000) * (zom ? 0.5 : 1);
        if (!(crypto.randomInt(1000000) / 1000000 < prob)) return { ok: true, hit: false };
        await db.ref("hc/state").transaction((c) => (c === null ? { found: true, by: uid, name: String(p.username || "ผู้รอดชีวิต").slice(0, 20), zom, ts: now } : undefined));
        const cur = (await db.ref("hc/state").get()).val();
        if (!cur || cur.by !== uid) return view(uid, { hit: false, already: true });
        // ผู้ค้นพบ: ของรางวัล + ประกาศ + บิต "เจอแล้ว" ของตัวเอง
        let reward = "weapon";
        if (zom) { const ok = await addCapped(db, uid, ZOM_REWARD, 1); reward = ok ? "organ" : "none"; }
        else { const k = db.ref(`inventory/${uid}`).push().key; await db.ref(`inventory/${uid}/${k}`).set(WEAPON); }
        await db.ref(`npc/${uid}/tara`).transaction((c) => (c && typeof c === "object" ? { ...c, m: (((Number(c.m) || 0) | FOUND_BIT) >>> 0) } : c));
        await db.ref("announcements").push({ text: `📡 ${cur.name} ค้นพบนักวิจัยธาราที่ศูนย์วิจัยร้าง! เธอกลับมาที่ค่ายแล้ว — ไปคุยกับเธอที่ Safe Zone และช่วยกันเก็บชิ้นส่วน DNA`, zone: "all", by: cur.name, ts: SV() });
        return view(uid, { hit: true, reward, weapon: zom ? null : WEAPON.name });
      }
      // ----- donate
      if (!st0.exists()) fail("failed-precondition", "ยังไม่พบธารา");
      if (p.zone !== "safe") fail("failed-precondition", "ต้องอยู่ที่ Safe Zone");
      const want = Math.trunc(Number(data.q)); if (!(want >= 1)) fail("invalid-argument", "จำนวนไม่ถูกต้อง");
      return lockWait("hc_donate", now, async () => {
        const goal = Math.max(1, Math.round(await tune("hc_goal", GOAL_DEFAULT))), tt = await totals(uid), left = goal - tt.total;
        if (left <= 0) fail("failed-precondition", "ครบเป้าแล้ว");
        const q = Math.min(want, left, 99);
        if (!(await takeItem(db, uid, "dna_frag", q))) fail("failed-precondition", "ชิ้นส่วน DNA ไม่พอ");
        try { await db.ref(`coop/${KEY}/${uid}`).transaction((c) => ({ n: (Number(col(c).n) || 0) + q, name: String(p.username || "ผู้รอดชีวิต").slice(0, 20), ts: SV() })); }
        catch (e) { await db.ref(`inventory/${uid}/dna_frag`).transaction((c) => (c ? { ...c, qty: (Number(c.qty) || 0) + q } : { id: "dna_frag", qty: q })); throw e; }
        return view(uid, { donated: q });
      });
    });
  }
  return { run };
}
module.exports = { makeHc, WEAPON, ZOM_REWARD, BOSS_BIT, FOUND_BIT, KEY };
