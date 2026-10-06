// ⚔️ ศึกใหญ่ประจำสัปดาห์ (มนุษย์ vs ซอมบี้): สรุปจากแต้มศึกชิงโซนเดิม (coop/{zh|zz}{สัปดาห์}{โซน}/{uid}) ทั้งเซิร์ฟเวอร์
// - ฝ่ายที่แต้มรวมสัปดาห์ก่อนมากกว่า = ผู้ชนะ → สมาชิกที่มีส่วนร่วมรับรางวัลใหญ่ (ผู้แพ้รับรางวัลปลอบใจ) + โบนัสทั้งฝ่ายตลอดสัปดาห์นี้ (ฝั่งเกมนำไปคูณตารางค้นหา)
// - สถานะรับรางวัลที่ war/{uid}/{สัปดาห์} (ฟังก์ชันเท่านั้น ไม่มีใน rules) • ไม่ต้องแก้ rules (อ่าน coop ด้วย Admin SDK)
const { fail, withLock, grantAll, dayIdx, TZ, DAY } = require("./lib");
const ZONES = 10, MIN_PTS = 30, MIN_TOTAL = 60;
const wkOf = (now) => Math.floor((dayIdx(now) + 3) / 7);                    // ต้องตรงกับ qpKey("weekly") ในเกม
const wkEnd = (now) => ((wkOf(now) + 1) * 7 - 3) * DAY - TZ;
const REW = {
  win: { human: [["medkit", 2], ["steel_plate", 1], ["deco_flag", 1]], zombie: [["serum", 2], ["mutant_gland", 2], ["deco_web", 1]] },
  lose: { human: [["bandage", 2], ["scrap", 4]], zombie: [["rotten_meat", 4], ["moss", 2]] }
};
const BUFF = { human: { f: 1.06, w: 1.06, z: 0.94 }, zombie: { rm: 1.12, n: 0.94 } };   // โบนัสฝ่ายผู้ชนะสัปดาห์ก่อน (ฝั่งเกมคูณ)

function makeWar(db) {
  async function sideTotals(wk) {
    const out = { h: 0, z: 0, mine: {} };
    const reads = [];
    for (let i = 1; i <= ZONES; i++) for (const f of ["h", "z"]) reads.push(db.ref(`coop/z${f}${wk}${i}`).get().then((s) => ({ f, v: s.val() || {} })));
    for (const { f, v } of await Promise.all(reads)) for (const [u, x] of Object.entries(v)) { const n = Number(x && x.n) || 0; out[f] += n; (out.mine[u] = out.mine[u] || { h: 0, z: 0 })[f] += n; }
    return out;
  }
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const p = (await db.ref(`users/${uid}`).get()).val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human", fk = fac === "zombie" ? "z" : "h", wk = wkOf(now), pw = wk - 1;
      const [cur, prev, cl] = await Promise.all([sideTotals(wk), sideTotals(pw), db.ref(`war/${uid}/${pw}`).get()]);
      const win = prev.h + prev.z >= MIN_TOTAL && prev.h !== prev.z ? (prev.h > prev.z ? "h" : "z") : "", mineP = (prev.mine[uid] || {})[fk] || 0, mineC = (cur.mine[uid] || {})[fk] || 0;
      const claimed = !!cl.val();
      const view = (extra) => Object.assign({
        ok: true, wk, end: wkEnd(now), fac, h: cur.h, z: cur.z, mine: mineC, min: MIN_PTS,
        prev: { h: prev.h, z: prev.z, win, mine: mineP, canClaim: mineP >= MIN_PTS && !claimed && prev.h + prev.z > 0, claimed, rew: win ? (win === fk ? REW.win[fac] : REW.lose[fac]) : REW.lose[fac], won: win === fk },
        buff: win === fk ? BUFF[fac] : null, buffOf: win || ""
      }, extra || {});
      if (a === "state") return view();
      if (a === "claim") {
        if (claimed) fail("failed-precondition", "รับรางวัลสัปดาห์ที่แล้วไปแล้ว");
        if (prev.h + prev.z <= 0) fail("failed-precondition", "สัปดาห์ที่แล้วยังไม่มีศึก");
        if (mineP < MIN_PTS) fail("failed-precondition", `ต้องสะสมแต้มศึกอย่างน้อย ${MIN_PTS} แต้มในสัปดาห์นั้น (คุณมี ${mineP})`);
        const rew = win ? (win === fk ? REW.win[fac] : REW.lose[fac]) : REW.lose[fac];
        await db.ref(`war/${uid}/${pw}`).set(now);
        if (!(await grantAll(db, uid, rew))) { await db.ref(`war/${uid}/${pw}`).remove(); fail("failed-precondition", "ช่องเก็บของเต็ม — เคลียร์แล้วลองใหม่"); }
        return Object.assign(view(), { rewarded: rew, won: win === fk, draw: !win });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeWar, REW, BUFF, wkOf, MIN_PTS };
