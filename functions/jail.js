// ⛓️ คุก (ก้อนที่ 3 ของระบบส้ม/ค่าหัว/คุก) — คนส้มที่ถูกผู้เล่นที่ไม่ใช่ส้มล้ม = "ถูกจับ" → ติดคุกตามเวลา มี 3 ทางออก: ครบเวลา / จ่ายประกัน / แหกคุก
// - สถานะที่ `jail/{uid}` = {until, t ชั้นโทษ, tm ระยะโทษรวม(นาที), w นาทีที่ลดด้วยการทำงาน, ts, by ผู้จับ, wt/et เวลาทำงาน/แหกคุกล่าสุด} (ผู้เล่นอ่านของตัวเองได้ • เขียนได้เฉพาะฟังก์ชัน) • `jailn/{uid}` = {n จำนวนครั้งที่แหกคุก, ts}
//   คุกคือโซนซ่อน `jail` (เหมือนคาสิโน: ไม่มีค่าเดินทาง ไม่ค้นหา ต่อสู้ไม่ได้) — rules: เข้าคุกได้เมื่อ jail/{uid}/until > now, ออกจากคุกด้วยตัวเองไม่ได้ (ฟังก์ชันย้ายให้)
// - จับ (`capture`): ผู้ถูกฆ่า (role:"victim") หรือผู้ฆ่า (role:"killer") เรียกหลังเป้าหมาย HP=0 — เซิร์ฟเวอร์ตรวจเอง: เป้าเป็นส้มอยู่ / ผู้ฆ่าไม่ใช่ส้ม / ทั้งคู่เป็นผู้เล่น / โซนเดียวกัน (ไม่ใช่ Safe/คาสิโน/คุก) /
//   ผู้ฆ่าโจมตีล่าสุด ≤90 วินาที / ไม่ได้ติดคุกอยู่ / ซ้ำใน 2 นาทีนับครั้งเดียว → เป้าติดคุก (สถานะส้มถูกล้าง) • ผู้ฆ่าได้ของยึดจากกระเป๋าผู้ต้องขัง: ของทั่วไปสุ่ม 1 ชนิด จำนวน = ชั้นโทษ (ไม่ใช่ของสร้างใหม่)
// - ชั้นโทษ t = 1 + min(3, จำนวนครั้งที่แหกคุกใน 24 ชม.) • ระยะโทษ = jail_min (30 นาที) × t • ค่าประกัน = jail_bail (30) × t แต้มวัตถุดิบ • แหกคุกสำเร็จ jail_esc% (25) — สำเร็จ: ออกทันที แต่กลับเป็นส้ม (ครั้งที่ n+1) และชั้นโทษรอบหน้าสูงขึ้น •
//   ล้มเหลว: เวลา +5 นาที เสียของทั่วไป 1 ชิ้น พักลองใหม่ 5 นาที • ทำงานในคุก: ลดโทษ 2 นาที/ครั้ง (พัก 20 วินาที) รวมได้ไม่เกินครึ่งของโทษ • ครบเวลา: เสียของทั่วไปอย่างน้อย 1 ชิ้นแบบสุ่ม (ไม่รวมอาวุธ/ของหายาก/ของที่สวม) • จ่ายประกันไม่เสียของ
// // - ค่าหัว (ระบบ bounty.js): ครบเวลา = ค่าหัวบนตัวหาย • ค่าประกัน = jail_bail × ชั้น + jail_bailpct% (25) ของค่าหัวบนตัว (ค่าหัวสูง = ประกันแพง) และจ่ายประกันแล้วค่าหัวยังอยู่ (ยังถูกล่า) •
//   แหกคุกสำเร็จ: เอาทรัพย์สินตัวเองสูงสุด jail_escbty (20) แต้มไปตั้งเป็นค่าหัวบนตัว (ผู้ล้มได้ไป — ไม่สร้างของใหม่) • ถ้าตั้ง jail_pct < 100 การถูกล้มตอนเป็นส้มมีโอกาสถูกจับแค่ jail_pct%
// - 🔴 ผู้ก่อเหตุสีแดง (crim.js): ถูกจับ → โทษ ×2 + ของยึด ×2 + จ่ายประกันไม่ได้ (ทำงานลดโทษ/แหกคุก/ครบเวลาได้)
// - ช่วยแหกคุก (`rescue`): ผู้เล่นอื่นที่อยู่นอกเมือง (ไม่ใช่ Safe/คาสิโน/คุก ไม่ได้ติดคุก) ช่วยผู้ต้องขังได้ (รายชื่อผู้ต้องขังที่ `jailpub/{uid}` อ่านได้ทุกคน) โอกาส jail_rescue% (40) พักต่อคน 10 นาที •
//   สำเร็จ: ผู้ต้องขังออกทันที (เมืองร้าง) กลับเป็นส้ม และผู้ช่วยกลายเป็นส้มด้วย (ความผิดฐานช่วยแหกคุก) • ล้มเหลว: ผู้ช่วย **ติดคุกไปด้วย โทษเท่ากับผู้ต้องขัง** (ชั้นโทษ/ระยะโทษเต็ม) สถานะส้มของผู้ช่วยถูกล้างตามการถูกจับ
// - ปิดอยู่จนกว่าตั้ง tune jail_on = 1 • ปรับได้: jail_min / jail_bail / jail_esc / jail_pct / jail_bailpct / jail_escbty / jail_rescue
const crypto = require("crypto");
const { fail, withLock, takeItem, grantAll } = require("./lib");
const { payPts, payUpTo } = require("./paypts");
const { effPts } = require("./bounty");
const { nextCrim } = require("./crim");

// งานในคุก (มินิเกมจำลำดับ — เซิร์ฟเวอร์ออกโจทย์และตรวจคำตอบเอง): งานเบา จำ 4 ตัว ลด 2 นาที / งานหนัก จำ 6 ตัว ลด 5 นาที แต่ถ้าพลาดเสีย 10 HP (ไม่ตาย เหลืออย่างน้อย 1) • พักหลังทำเสร็จหรือพลาด • รวมลดไม่เกินครึ่งโทษ
const JOBS = { light: { len: 4, mins: 2, cd: 20000, hp: 0 }, heavy: { len: 6, mins: 5, cd: 45000, hp: 10 } };
const RESCUE_CD = 600000, RED_MUL = 2, ATK_WINDOW = 90000, DEDUPE_MS = 120000, WORK_TTL = 90000, WORK_SYMS = 5, ESC_CD = 300000, ESC_FAIL_MIN = 5, DECAY_MS = 86400000, MAX_T = 4;
// ของทั่วไปที่ยึด/ริบได้ (ทุกรหัสต้องอยู่ใน ITEMS ของเกมและ whitelist กระเป๋า) — ไม่รวมอาวุธ/เกราะ/ของหายาก
const COMMON = ["scrap", "chem", "canned_food", "water", "bandage", "rusty_nails", "leather_scrap", "duct_tape", "bread", "fruit", "rotten_meat", "moss"];
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

function makeJail(db, rnd) {
  const rf = rnd || (() => crypto.randomInt(1000000) / 1000000);
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  async function cfg() { return { on: (await tune("jail_on", 0)) === 1, mins: Math.max(1, await tune("jail_min", 30)), bail: Math.max(1, await tune("jail_bail", 30)), esc: Math.min(100, Math.max(0, await tune("jail_esc", 25))), pct: Math.min(100, Math.max(0, await tune("jail_pct", 100))), bailPct: Math.max(0, await tune("jail_bailpct", 25)), escBty: Math.max(0, Math.floor(await tune("jail_escbty", 20))), bty2: (await tune("bty2_on", 0)) === 1, btyCap: Math.max(1, Math.floor(await tune("bty_cap", 200))), btyDecay: Math.max(0, await tune("bty_decay", 3)), crimMins: Math.max(1, await tune("crim_min", 45)), redAt: Math.max(2, Math.floor(await tune("crim_red", 3))), redH: Math.max(1, await tune("crim_redh", 6)), rescue: Math.min(100, Math.max(0, await tune("jail_rescue", 40))) }; }
  const active = (j, now) => !!j && num(j.until) > now;
  const orange = (c, now) => !!c && num(c.until) > now;
  const escN = (jn, now) => (jn && now - num(jn.ts) <= DECAY_MS ? Math.max(0, num(jn.n)) : 0);
  const tierOf = (n) => Math.min(MAX_T, 1 + Math.min(3, n));
  const okRole = (u) => !!u && u.role === "player" && u.banned !== true;
  async function pickCommon(uid) {   // สุ่ม 1 ชนิดจากของทั่วไปที่มีในกระเป๋า → [id, มีอยู่] หรือ null
    const inv = (await db.ref(`inventory/${uid}`).get()).val() || {}, have = COMMON.filter((id) => inv[id] && inv[id].id === id && num(inv[id].qty) > 0);
    if (!have.length) return null; const id = have[Math.floor(rf() * have.length)]; return [id, num(inv[id].qty)];
  }
  const bailFor = (C, t, b, now) => C.bail * t + Math.floor((effPts(b, now, C.btyDecay) * C.bailPct) / 100);
  const view = (j, jn, C, now, b) => ({ active: active(j, now), until: j ? num(j.until) : 0, tier: j ? num(j.t) || 1 : tierOf(escN(jn, now)), tm: j ? num(j.tm) : 0, w: j ? num(j.w) : 0, bailPts: bailFor(C, j ? num(j.t) || 1 : tierOf(escN(jn, now)), b, now), red: !!(j && j.red), esc: C.esc, rescue: C.rescue, workLeftAt: j ? num(j.wcd) : 0, escLeftAt: j ? num(j.et) + ESC_CD : 0 });

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "capture", "workStart", "workDone", "escape", "bail", "release", "rescue"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const C = await cfg();
    if (a === "state") { const [jS, nS, bS] = await Promise.all([db.ref(`jail/${uid}`).get(), db.ref(`jailn/${uid}`).get(), db.ref(`bty/${uid}`).get()]); return { ok: true, on: C.on, ...view(jS.val(), nS.val(), C, now, bS.val()) }; }
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
      if (C.pct < 100 && !(rf() * 100 < C.pct)) return no("lucky");   // โอกาสถูกจับ (ค่าเริ่มต้น 100% = จับทุกครั้ง)
      const red = (vcS.val() || {}).red === true, t = tierOf(escN(jnS.val(), now)), tm = C.mins * t * (red ? RED_MUL : 1);   // 🔴 แดง: โทษ ×2
      await db.ref().update({ [`jail/${vid}`]: { until: now + tm * 60000, t, tm, w: 0, ts: now, by: k.username, ...(red ? { red: true } : {}) }, [`jailpub/${vid}`]: { n: v.username, u: now + tm * 60000, t, ...(red ? { red: true } : {}) }, [`crim/${vid}`]: { until: now, n: num((vcS.val() || {}).n), ts: num((vcS.val() || {}).ts) } });
      let reward = null;   // ของยึด: ของทั่วไป 1 ชนิดจากกระเป๋าผู้ต้องขัง จำนวนเท่าชั้นโทษ (ย้ายของจริง ไม่สร้างใหม่)
      const pick = await pickCommon(vid);
      if (pick) {
        const [id, have] = pick, q = Math.min(have, t * (red ? RED_MUL : 1));
        if (await takeItem(db, vid, id, q)) { if (await grantAll(db, kid, [[id, q]])) reward = { id, qty: q }; else await grantAll(db, vid, [[id, q]]).catch(() => {}); }
      }
      return { ok: true, on: true, captured: true, who: vid, by: kid, until: now + tm * 60000, tier: t, red, reward };
    }

    if (!C.on) return { ok: true, on: false };
    return withLock(db, uid, now, async () => {
      const [j, jnv, u] = await Promise.all([jailed(uid), db.ref(`jailn/${uid}`).get().then((s) => s.val()), db.ref(`users/${uid}`).get().then((s) => s.val())]);
      if (!u || u.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const leave = async (zone, extra = {}) => { await db.ref().update({ [`jail/${uid}`]: null, [`jailpub/${uid}`]: null, [`users/${uid}/zone`]: zone, ...extra }); };
      if (a === "rescue") {
        const target = String((data && data.target) || "");
        if (!target || target === uid || !/^[A-Za-z0-9_-]{1,64}$/.test(target)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
        if (!okRole(u)) fail("permission-denied", "บัญชีนี้ช่วยแหกคุกไม่ได้");
        if (!(u.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        if (["safe", "casino", "jail"].includes(u.zone)) fail("failed-precondition", "ต้องอยู่นอกเมือง (ไม่ใช่ Safe Zone/คาสิโน/คุก) ถึงจะช่วยแหกคุกได้");
        if (active(j, now)) fail("failed-precondition", "คุณติดคุกอยู่เอง");
        const [tjS, tuS, rsS, hcS, tcS, tnS] = await Promise.all([db.ref(`jail/${target}`).get(), db.ref(`users/${target}`).get(), db.ref(`jailrs/${uid}`).get(), db.ref(`crim/${uid}`).get(), db.ref(`crim/${target}`).get(), db.ref(`jailn/${target}`).get()]);
        const tj = tjS.val(), tu = tuS.val();
        if (!active(tj, now) || !okRole(tu)) fail("failed-precondition", "คนนี้ไม่ได้ติดคุกอยู่");
        if (now - num((rsS.val() || {}).ts) < RESCUE_CD) fail("resource-exhausted", `เพิ่งลองช่วยแหกคุกไป รออีก ${Math.ceil((RESCUE_CD - (now - num((rsS.val() || {}).ts))) / 60000)} นาที`);
        await db.ref(`jailrs/${uid}`).set({ ts: now, to: target });
        const nc = { mins: C.crimMins, redAt: C.redAt, redH: C.redH };
        if (rf() * 100 < C.rescue) {   // สำเร็จ: ผู้ต้องขังออกทันที กลับเป็นส้ม • ผู้ช่วยกลายเป็นส้มด้วย
          let freed = false; await db.ref(`jail/${target}`).transaction((c) => { freed = false; if (c === null) return c; if (!active(c, now)) return undefined; freed = true; return null; });
          if (!freed) fail("failed-precondition", "คนนี้ออกจากคุกไปแล้ว");
          await db.ref().update({ [`jailpub/${target}`]: null, [`users/${target}/zone`]: "ruins", [`crim/${target}`]: nextCrim(tcS.val(), now, nc), [`jailn/${target}`]: { n: escN(tnS.val(), now) + 1, ts: now }, [`crim/${uid}`]: nextCrim(hcS.val(), now, nc) });
          return { ok: true, on: true, rescued: true, target: tu.username, helperOrange: true };
        }
        // ล้มเหลว: ผู้ช่วยติดคุกไปด้วย โทษเท่ากับผู้ต้องขัง (ชั้นโทษ/ระยะโทษเต็ม)
        const t2 = num(tj.t) || 1, tm = num(tj.tm) || C.mins * t2, red = tj.red === true;
        await db.ref().update({ [`jail/${uid}`]: { until: now + tm * 60000, t: t2, tm, w: 0, ts: now, by: "ช่วยแหกคุกพลาด", ...(red ? { red: true } : {}) }, [`jailpub/${uid}`]: { n: u.username, u: now + tm * 60000, t: t2, ...(red ? { red: true } : {}) }, [`crim/${uid}`]: { until: now, n: num((hcS.val() || {}).n), ts: num((hcS.val() || {}).ts) } });
        return { ok: true, on: true, rescued: false, jailed: true, until: now + tm * 60000, tier: t2, tm };
      }
      if (a === "release") {
        if (!j) { const stuck = u.zone === "jail"; if (stuck) await db.ref(`users/${uid}/zone`).set("safe"); return { ok: true, on: true, released: stuck, zone: stuck ? "safe" : u.zone }; }   // ไม่มีบันทึกคุกแต่ยังค้างโซนคุก (ข้อมูลหลุด) → ปล่อยออก
        if (active(j, now)) fail("failed-precondition", "ยังไม่ครบโทษ");
        let lost = null; const pick = await pickCommon(uid);
        if (pick && (await takeItem(db, uid, pick[0], 1))) lost = { id: pick[0], qty: 1 };
        await leave("safe", { [`bty/${uid}`]: null }); await db.ref(`jailn/${uid}`).set({ n: escN(jnv, now), ts: now });   // ครบโทษ: ค่าหัวบนตัวหาย
        return { ok: true, on: true, released: true, zone: "safe", lost };
      }
      if (!active(j, now)) fail("failed-precondition", "คุณไม่ได้ติดคุกอยู่");
      const t = num(j.t) || 1;
      if (a === "workStart") {
        const key = String((data && data.job) || ""), job = JOBS[key]; if (!job) fail("invalid-argument", "ไม่รู้จักงานนี้");
        if (now < num(j.wcd)) fail("resource-exhausted", `พักก่อน อีก ${Math.ceil((num(j.wcd) - now) / 1000)} วินาที`);
        if (num(j.w) + job.mins > Math.floor(num(j.tm) / 2)) fail("failed-precondition", "ทำงานลดโทษได้ไม่เกินครึ่งหนึ่งของโทษแล้ว (งานนี้ลดเกิน)");
        const seq = Array.from({ length: job.len }, () => Math.floor(rf() * WORK_SYMS));
        await db.ref(`jailwk/${uid}`).set({ job: key, seq, ts: now });
        return { ok: true, on: true, job: key, seq, len: job.len, syms: WORK_SYMS, mins: job.mins, hpRisk: job.hp };
      }
      if (a === "workDone") {
        const wkS = await db.ref(`jailwk/${uid}`).get(), wk = wkS.val();
        if (!wk || !JOBS[wk.job] || !Array.isArray(wk.seq)) fail("failed-precondition", "ยังไม่ได้เริ่มงาน");
        await db.ref(`jailwk/${uid}`).remove();   // ตอบได้ครั้งเดียวต่อโจทย์
        const job = JOBS[wk.job];
        if (now - num(wk.ts) > WORK_TTL) fail("deadline-exceeded", "หมดเวลาทำงานนี้ เริ่มงานใหม่");
        if (now - num(wk.ts) < job.len * 600) fail("failed-precondition", "ตอบเร็วผิดปกติ — ลองใหม่");
        const ans = data && Array.isArray(data.answer) ? data.answer : [];
        const ok = ans.length === wk.seq.length && ans.every((x, i) => x === wk.seq[i]);
        if (!ok) {   // ตอบผิด: ไม่ลดโทษ พักตามงาน • งานหนักเสีย HP (เหลืออย่างน้อย 1)
          const upd = { [`jail/${uid}/wcd`]: now + job.cd }; let hpLost = 0;
          if (job.hp > 0 && num(u.hp) > 1) { hpLost = Math.min(job.hp, num(u.hp) - 1); upd[`users/${uid}/hp`] = num(u.hp) - hpLost; }
          await db.ref().update(upd); return { ok: true, on: true, success: false, hpLost };
        }
        if (num(j.w) + job.mins > Math.floor(num(j.tm) / 2)) fail("failed-precondition", "ทำงานลดโทษได้ไม่เกินครึ่งหนึ่งของโทษแล้ว");
        const nu = num(j.until) - job.mins * 60000;
        await db.ref().update({ [`jail/${uid}/until`]: nu, [`jail/${uid}/w`]: num(j.w) + job.mins, [`jail/${uid}/wt`]: now, [`jail/${uid}/wcd`]: now + job.cd, [`jailpub/${uid}/u`]: nu });
        return { ok: true, on: true, success: true, mins: job.mins, until: nu, w: num(j.w) + job.mins, ended: nu <= now };
      }
      if (a === "bail") {
        if (j.red) fail("failed-precondition", "🔴 นักโทษผู้ก่อเหตุซ้ำจ่ายค่าประกันไม่ได้ (ทำงานลดโทษ แหกคุก หรือรอครบเวลา)");
        const need = bailFor(C, t, (await db.ref(`bty/${uid}`).get()).val(), now), paid = await payPts(db, uid, need, "จ่ายค่าประกัน");
        await leave("safe"); return { ok: true, on: true, released: true, zone: "safe", paid, pts: need };
      }
      // escape
      if (now - num(j.et) < ESC_CD) fail("resource-exhausted", `เพิ่งลองแหกคุกไป รออีก ${Math.ceil((ESC_CD - (now - num(j.et))) / 1000)} วินาที`);
      if (rf() * 100 < C.esc) {
        const n = escN(jnv, now) + 1, cS = (await db.ref(`crim/${uid}`).get()).val(), nc = nextCrim(cS, now, { mins: C.crimMins, redAt: C.redAt, redH: C.redH });
        let self = 0;   // เอาทรัพย์สินตัวเองตั้งเป็นค่าหัวบนตัว (เฉพาะเมื่อเปิดค่าหัวใหม่) — ผู้ที่ล้มได้ไปเอง
        if (C.bty2 && C.escBty > 0) {
          const bS = (await db.ref(`bty/${uid}`).get()).val(), room = Math.max(0, C.btyCap - effPts(bS, now, C.btyDecay)), got = room > 0 ? await payUpTo(db, uid, Math.min(C.escBty, room)) : { pts: 0 };
          if (got.pts > 0) { self = got.pts; await db.ref(`bty/${uid}`).transaction((c) => { const e = effPts(c, now, C.btyDecay), s = c && c.s && typeof c.s === "object" && !c.kb ? { ...c.s } : {}; s._jail = num(s._jail) + got.pts; return { pts: e + got.pts, ts: now, tn: u.username, bn: "แหกคุก", s }; }); }
        }
        await leave("ruins", { [`crim/${uid}`]: nc, [`jailn/${uid}`]: { n, ts: now } });
        return { ok: true, on: true, escaped: true, zone: "ruins", n, bounty: self, red: nc.red === true };
      }
      let lost = null; const pick = await pickCommon(uid);
      if (pick && (await takeItem(db, uid, pick[0], 1))) lost = { id: pick[0], qty: 1 };
      const nu = num(j.until) + ESC_FAIL_MIN * 60000; await db.ref().update({ [`jail/${uid}/until`]: nu, [`jail/${uid}/et`]: now, [`jailpub/${uid}/u`]: nu });
      return { ok: true, on: true, escaped: false, until: nu, lost };
    });
  }
  return { run };
}
module.exports = { makeJail, RESCUE_CD, RED_MUL, COMMON, MAX_T, JOBS, WORK_SYMS, ESC_CD, ESC_FAIL_MIN };
