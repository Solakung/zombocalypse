// 📻 ปริศนาวิทยุ: ทุกสัปดาห์เมืองได้ยินสัญญาณลึกลับ รหัส 4 หลักถูกแบ่งเป็น 4 เบาะแส
// ผู้เล่น "ฟังสัญญาณ" ได้วันละครั้งในโซนที่กำหนด → ได้เบาะแส 1 ชิ้น (หมุนเวียนตามวัน) ต้องแชร์กันในแชตเพื่อประกอบรหัส แล้วส่งรหัสเปิดคลังลับ
// รหัสลับอยู่ที่ radio/{สัปดาห์}/secret (ไม่มีใน rules → ผู้เล่นอ่านตรง ๆ ไม่ได้) • ทายผิดได้วันละ 5 ครั้ง
const { fail, withLock, grantAll, dayIdx, dayEnd, TZ, DAY } = require("./lib");
const SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / DAY);
const weekIdx = (now) => Math.floor((dayIdx(now) - SEA_EPOCH) / 7);
const weekEnd = (now) => (SEA_EPOCH + (weekIdx(now) + 1) * 7) * DAY - TZ;

const ZONES = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
const ZONE_TH = { ruins: "ซากเมือง", mall: "ห้างร้าง", hospital: "โรงพยาบาลร้าง", police: "สถานีตำรวจ", forest: "ป่ารกร้าง", factory: "โรงงานเก่า", port: "ท่าเรือ", base: "ฐานทัพร้าง", tunnel: "อุโมงค์ใต้ดิน", lab: "ห้องวิจัยร้าง" };
const SLOT = ["หลักที่หนึ่ง", "หลักที่สอง", "หลักที่สาม", "หลักที่สี่"];
// ข้อความเบาะแส: ใช้ตัวเลขตรง ๆ แต่ห่อด้วยประโยคบรรยากาศ (เบาะแสชิ้นที่ i คือหลักที่ i ของรหัส)
const FLAVOR = [
  (d) => `สัญญาณขาดๆ หายๆ ... "${d}" ... แล้วเสียงก็ขาดไป`, (d) => `เสียงกระซิบจากวิทยุเก่า นับเลขช้า ๆ ... ${d} ... ก่อนเงียบ`,
  (d) => `คลื่นรบกวนลดลงชั่วขณะ ได้ยินคนพูดว่า "${d}" ซ้ำสามครั้ง`, (d) => `เสียงเคาะเป็นจังหวะ ${d} ครั้ง ตามด้วยเสียงเครื่องจักรเก่าหยุดทำงาน`
];
const REW = {   // รางวัลเปิดคลังลับ: ผู้แก้ได้ 10 คนแรกของสัปดาห์ได้ชุดใหญ่ คนหลังได้ชุดเล็ก
  big: { human: [["lab_core", 1], ["data_chip", 1], ["trauma_kit", 1], ["steel_plate", 2]], zombie: [["mutant_gland", 3], ["serum", 2], ["lab_core", 1]] },
  small: { human: [["medkit", 1], ["circuit_board", 1], ["army_meal", 2]], zombie: [["mutant_gland", 1], ["serum", 1], ["rotten_meat", 6]] }
};
const BIG_N = 10, GUESS_CAP = 5;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
// โซนของเบาะแสชิ้นที่ i ในสัปดาห์ w (เปลี่ยนทุกสัปดาห์)
const fragZone = (wi, i) => ZONES[(hash("z" + wi + ":" + i) % ZONES.length)];

function makeRadio(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state", wi = weekIdx(now), di = dayIdx(now), path = `radio/${wi}`;
    return withLock(db, uid, now, async () => {
      const [pS, rS, uS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(path).get(), db.ref(`${path}/u/${uid}`).get()]);
      const p = pS.val(); let r = rS.val() || {}; const u = uS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human";
      if (!r.secret) {   // สุ่มรหัสของสัปดาห์ตอนมีคนเปิดครั้งแรก (transaction กันสองคนสร้างพร้อมกัน)
        const code = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
        r.secret = (await db.ref(`${path}/secret`).transaction((x) => x || code)).snapshot.val();
      }
      const idx = (hash(uid) + di) % 4;                         // เบาะแสของผู้เล่นวันนี้
      const today = u.d === di ? u : null;                      // ฟังไปแล้ววันนี้?
      const guesses = u.gd === di ? u.g || 0 : 0;
      const view = (extra) => Object.assign({
        ok: true, wi, idx, slot: SLOT[idx], zone: fragZone(wi, idx), zoneTh: ZONE_TH[fragZone(wi, idx)], heard: !!today, solved: !!u.solved, solvers: r.n || 0, bigLeft: Math.max(0, BIG_N - (r.n || 0)),
        guessesLeft: Math.max(0, GUESS_CAP - guesses), clues: (u.clues || []).filter((c) => c && c.w === wi).map((c) => ({ i: c.i, slot: SLOT[c.i], text: c.t })), end: weekEnd(now), dEnd: dayEnd(now)
      }, extra || {});
      if (a === "state") return view();

      if (a === "listen") {
        if (today) fail("failed-precondition", "วันนี้ฟังสัญญาณไปแล้ว");
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        const z = fragZone(wi, idx);
        if (p.zone !== z) fail("failed-precondition", `สัญญาณช่วงนี้จับได้ที่ ${ZONE_TH[z]} เท่านั้น`);
        const digit = r.secret[idx], text = FLAVOR[hash(uid + wi + idx) % FLAVOR.length](digit);
        const clues = (u.clues || []).filter((c) => c && c.w === wi && c.i !== idx).concat({ w: wi, i: idx, t: text });
        await db.ref(`${path}/u/${uid}`).update({ d: di, clues });
        u.clues = clues; u.d = di;
        return Object.assign(view(), { heard: true, clues: clues.map((c) => ({ i: c.i, slot: SLOT[c.i], text: c.t })), got: text });
      }

      if (a === "guess") {
        if (u.solved) fail("failed-precondition", "คุณเปิดคลังสัปดาห์นี้ไปแล้ว");
        const code = String(data.code || "");
        if (!/^[0-9]{4}$/.test(code)) fail("invalid-argument", "รหัสต้องเป็นตัวเลข 4 หลัก");
        if (guesses >= GUESS_CAP) fail("resource-exhausted", "วันนี้ทายครบ " + GUESS_CAP + " ครั้งแล้ว");
        if (code !== r.secret) {
          await db.ref(`${path}/u/${uid}`).update({ gd: di, g: guesses + 1 });
          const right = [...code].filter((c, i) => c === r.secret[i]).length;   // บอกจำนวนหลักที่ถูกตำแหน่ง (เหมือนเกมทายตัวเลข)
          return view({ right: false, hint: right, guessesLeft: Math.max(0, GUESS_CAP - guesses - 1) });
        }
        const order = (await db.ref(`${path}/n`).transaction((x) => (x || 0) + 1)).snapshot.val();
        const big = order <= BIG_N, rew = (big ? REW.big : REW.small)[fac];
        await db.ref(`${path}/u/${uid}`).update({ solved: now, order });
        if (!(await grantAll(db, uid, rew))) {   // กระเป๋าเต็ม: ถอนสถานะ (ลำดับที่ใช้ไปแล้วยอมเสีย เพื่อไม่ให้ซ้ำ)
          await db.ref(`${path}/u/${uid}/solved`).remove(); await db.ref(`${path}/n`).transaction((x) => Math.max(0, (x || 1) - 1));
          fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วลองส่งรหัสอีกครั้ง (รหัสถูกต้องแล้ว!)");
        }
        return Object.assign(view(), { right: true, solved: true, big, order, rewarded: rew, solvers: order });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeRadio, fragZone, FLAVOR, REW, ZONES, hash, weekIdx };
