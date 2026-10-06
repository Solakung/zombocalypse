// 🃏 โต๊ะสลาฟ (Slave / President / Daifugo) — คาสิโนเถื่อนเฟส 2: ผู้เล่น 3–4 คนแข่งกันเอง
// ส่วนที่ 1 = เอนจินล้วน (ไม่พึ่งฐานข้อมูล) ส่วนที่ 2 = makeSlave(db) ต่อกับ RTDB
// ข้อมูล: ctable/{tid} (สถานะเต็ม+ไพ่ทุกมือ — ไม่มีใน rules) • cpub/{tid} (สาธารณะ อ่านอย่างเดียว) • chand/{tid}/{uid} (ไพ่ของตัวเอง อ่านได้เฉพาะเจ้าของ)
// ไพ่ = เลข 0..51: ค่า = id>>2 (0=3 … 11=A, 12=2), ดอก = id&3 (0=♣ 1=♦ 2=♥ 3=♠) → id ที่สูงกว่า = ไพ่ที่แรงกว่าเสมอ
const crypto = require("crypto");
const { fail, withLock, dayIdx } = require("./lib");
const { LOSS_CAP } = require("./casino");

const ANTES = [10, 25, 50, 100, 250], ROUNDS = 3, TURN_MS = 30000, MAX_MISS = 3, TW_CAP = 3000, PAIR_MAX = 6, STALE_MS = 10 * 60000, FIN_KEEP_MS = 3 * 60000;
const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"], SUITS = ["♣", "♦", "♥", "♠"];
const cardTxt = (c) => RANKS[c >> 2] + SUITS[c & 3];
const POINTS = { 3: [2, 0, -2], 4: [3, 1, -1, -3] };
const ri = (n) => crypto.randomInt(n);

// ---------- เอนจินล้วน ----------
const comboOf = (cards) => {
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > 4) return null;
  if (!cards.every((c) => Number.isInteger(c) && c >= 0 && c < 52) || new Set(cards).size !== cards.length) return null;
  const v = cards[0] >> 2; if (!cards.every((c) => (c >> 2) === v)) return null;
  return { n: cards.length, v, top: Math.max(...cards) };
};
const beats = (c, last) => !last || (c.n === last.n && c.top > last.top);
const shuffle = (rnd = ri) => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = rnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
const hand = (T, u) => T.hands[u] || (T.hands[u] = []);
const active = (T) => T.seats.filter((u) => hand(T, u).length > 0);
function cyc(T, from, pred) { const n = T.seats.length, i0 = T.seats.indexOf(from); for (let k = 1; k <= n; k++) { const u = T.seats[(i0 + k) % n]; if (pred(u)) return u; } return null; }
const nextActive = (T, from) => cyc(T, from, (u) => hand(T, u).length > 0);

// ใส่ค่าเริ่มต้นให้ทุกฟิลด์ (RTDB ทิ้ง {} และ [] ที่ว่าง)
function norm(T) {
  T.seats = Array.isArray(T.seats) ? T.seats : Object.values(T.seats || {});
  for (const k of ["hands", "pts", "nm", "passed", "dq", "miss"]) T[k] = T[k] && typeof T[k] === "object" ? T[k] : {};
  for (const k of ["out", "prev"]) T[k] = Array.isArray(T[k]) ? T[k] : T[k] ? Object.values(T[k]) : [];
  for (const u of T.seats) T.hands[u] = Array.isArray(T.hands[u]) ? T.hands[u] : T.hands[u] ? Object.values(T.hands[u]) : [];
  if (T.last && !Array.isArray(T.last.c)) T.last.c = Object.values(T.last.c || {});
  return T;
}
function newTable(owner, name, ante, max, now) { return { owner, ante, max, rounds: ROUNDS, st: "wait", rd: 0, seats: [owner], nm: { [owner]: name }, hands: {}, pts: { [owner]: 0 }, passed: {}, dq: {}, miss: {}, out: [], prev: [], last: null, turn: null, dl: 0, first: false, fc: null, xc: null, res: null, t: now }; }

function startRound(T, now, rnd) {
  const n = T.seats.length, per = Math.floor(52 / n), d = shuffle(rnd);
  T.rd++; T.hands = {}; T.out = []; T.last = null; T.passed = {}; T.xc = null; T.first = false; T.fc = null;
  T.seats.forEach((u, i) => { T.hands[u] = d.slice(i * per, (i + 1) * per).sort((a, b) => a - b); });
  if (T.rd === 1) {   // รอบแรก: ผู้ถือไพ่ต่ำสุดที่แจก (ปกติ 3♣) เปิดกอง และต้องลงใบนั้น
    const low = Math.min(...T.seats.map((u) => T.hands[u][0])); T.fc = low; T.first = true; T.turn = T.seats.find((u) => T.hands[u][0] === low); T.st = "play";
  } else {   // รอบถัดไป: Slave ส่ง 2 ใบแรงสุดให้ King → King เลือก 2 ใบคืน → Slave เปิดกอง
    const king = T.prev[0], slave = T.prev[n - 1], give = T.hands[slave].slice(-2);
    T.hands[slave] = T.hands[slave].slice(0, -2); T.hands[king] = T.hands[king].concat(give).sort((a, b) => a - b);
    T.xc = { k: king, s: slave, g: give }; T.st = "xchg"; T.turn = king;
  }
  T.dl = now + TURN_MS;
}
function giveBack(T, u, cards, now) {
  if (T.st !== "xchg" || !T.xc || T.xc.k !== u) return "ยังไม่ถึงช่วงแลกไพ่ของคุณ";
  if (!Array.isArray(cards) || cards.length !== 2 || cards[0] === cards[1] || !cards.every((c) => hand(T, u).includes(c))) return "ต้องเลือกไพ่ 2 ใบจากมือ";
  T.hands[u] = hand(T, u).filter((c) => !cards.includes(c)); T.hands[T.xc.s] = hand(T, T.xc.s).concat(cards).sort((a, b) => a - b);
  T.xc.r = cards.slice().sort((a, b) => a - b); T.st = "play"; T.turn = T.xc.s; T.last = null; T.passed = {}; T.dl = now + TURN_MS; return null;
}
function playCards(T, u, cards, now) {
  if (T.st !== "play" || T.turn !== u) return "ยังไม่ถึงตาคุณ";
  const cb = comboOf(cards); if (!cb) return "ลงได้เฉพาะไพ่ใบเดี่ยว/คู่/ตอง/โฟร์ ที่ค่าเท่ากัน";
  const h = hand(T, u); if (!cards.every((c) => h.includes(c))) return "ไพ่ไม่อยู่ในมือ";
  if (T.first && !cards.includes(T.fc)) return `ตาแรกต้องลง ${cardTxt(T.fc)}`;
  if (!beats(cb, T.last && comboOf(T.last.c))) return T.last ? "ต้องลงชนิดเดียวกันและสูงกว่ากองกลาง" : "ลงไม่ได้";
  T.hands[u] = h.filter((c) => !cards.includes(c)); T.last = { u, c: cards.slice().sort((a, b) => a - b) }; T.first = false; T.miss[u] = 0;
  after(T, u, now, true); return null;
}
function passTurn(T, u, now) {
  if (T.st !== "play" || T.turn !== u) return "ยังไม่ถึงตาคุณ"; if (!T.last) return "คุณเป็นคนเปิดกอง ผ่านไม่ได้";
  T.passed[u] = true; after(T, u, now, false); return null;
}
function after(T, u, now, played) {
  if (hand(T, u).length === 0 && !T.out.includes(u)) T.out.push(u);
  const act = active(T);
  if (act.length <= 1) { if (act.length === 1) T.out.push(act[0]); return endRound(T, now); }
  const endTrick = played && T.last.c.some((c) => (c >> 2) === 12), rem = act.filter((x) => !T.passed[x] && x !== T.last.u);
  if (endTrick || !rem.length) {   // จบกอง → คนลงล่าสุดเปิดต่อ (ถ้าไพ่หมดแล้วเป็นคนถัดไปที่ยังเล่นอยู่)
    const lu = T.last.u; T.turn = act.includes(lu) ? lu : nextActive(T, lu); T.last = null; T.passed = {}; T.dl = now + TURN_MS; return;
  }
  T.turn = cyc(T, u, (x) => act.includes(x) && !T.passed[x]); T.dl = now + TURN_MS;
}
function endRound(T, now) {
  const pts = POINTS[T.seats.length]; T.out.forEach((u, i) => { T.pts[u] = (T.pts[u] || 0) + pts[i]; }); T.prev = T.out.slice(); T.last = null; T.passed = {};
  if (T.rd >= T.rounds) { T.st = "end"; T.turn = null; T.dl = 0; return; }
  startRound(T, now);
}
// ตัดสินอัตโนมัติ (หมดเวลา/ผู้เล่นที่หลุด): ถ้าเปิดกอง ลงใบต่ำสุดใบเดียว มิฉะนั้นผ่าน • แลกไพ่ = คืน 2 ใบต่ำสุด
function autoAct(T, now) {
  const u = T.turn; if (T.st === "xchg") return giveBack(T, u, hand(T, u).slice(0, 2), now);
  if (T.last) return passTurn(T, u, now);
  return playCards(T, u, [T.first ? T.fc : hand(T, u)[0]], now);
}
function runAuto(T, now) { for (let i = 0; i < 5000 && (T.st === "play" || T.st === "xchg") && T.dq[T.turn]; i++) { const e = autoAct(T, now); if (e) throw new Error("autoAct: " + e); } }
// ไล่เส้นตายที่เลยไปแล้ว (เวลาเสมือน: แต่ละตาที่ตกเวลาเริ่มนับ 30 วินาทีต่อจากเส้นตายเดิม) — คืนรายชื่อคนที่ถูกตัดสิทธิ์
function expire(T, now) {
  const dqd = [];
  for (let i = 0; i < 600 && (T.st === "play" || T.st === "xchg") && T.dl && T.dl < now; i++) {
    const u = T.turn, vt = T.dl; T.miss[u] = (T.miss[u] || 0) + 1; if (T.miss[u] >= MAX_MISS && !T.dq[u]) { T.dq[u] = true; dqd.push(u); }
    const e = autoAct(T, vt); if (e) throw new Error("expire: " + e); runAuto(T, vt);
  }
  return dqd;
}
// อันดับสุดท้าย + เงินรางวัล (ที่ 1 = 60% ที่ 2 = 30% ของกอง ที่เหลือเป็นของบ่อน; ผู้ถูกตัดสิทธิ์ไม่ได้รางวัล)
function finalize(T) {
  const n = T.seats.length, pot = T.ante * n, allDq = T.seats.every((u) => T.dq[u]);
  const order = T.seats.slice().sort((a, b) => ((allDq ? 0 : T.dq[a] ? 1 : 0) - (allDq ? 0 : T.dq[b] ? 1 : 0)) || (T.pts[b] || 0) - (T.pts[a] || 0) || T.prev.indexOf(a) - T.prev.indexOf(b));
  const pay = [Math.floor(pot * 0.6), Math.floor(pot * 0.3)]; let fee = pot;
  const rank = order.map((u, i) => { const p = !allDq && T.dq[u] ? 0 : pay[i] || 0; fee -= p; return { u, n: T.nm[u], pt: T.pts[u] || 0, pay: p, net: p - T.ante, dq: !!T.dq[u] }; });
  return { rank, pot, fee };
}

// ---------- RTDB ----------
function makeSlave(db) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const J = (o) => JSON.parse(JSON.stringify(o));
  const pubOf = (tid, T) => J({
    id: tid, ow: T.owner, ante: T.ante, max: T.max, rounds: T.rounds, st: T.st, rd: T.rd, t: T.t, turn: T.turn, dl: T.dl, last: T.last, prev: T.prev, xc: T.xc, res: T.res, first: T.first,
    seats: T.seats.map((u) => ({ u, n: T.nm[u], c: hand(T, u).length, p: !!T.passed[u], pt: T.pts[u] || 0, dq: !!T.dq[u], o: T.out.indexOf(u) + 1 }))
  });
  async function saveT(tid, T, extra) {
    const up = { [`ctable/${tid}`]: J(T), [`cpub/${tid}`]: pubOf(tid, T), ...(extra || {}) };
    T.seats.forEach((u) => { up[`chand/${tid}/${u}`] = hand(T, u).length ? hand(T, u) : null; });
    await db.ref().update(up);
  }
  async function loadT(tid) { const s = (await db.ref(`ctable/${tid}`).get()).val(); return s ? norm(s) : null; }
  async function dropT(tid, T) { const up = { [`ctable/${tid}`]: null, [`cpub/${tid}`]: null, [`chand/${tid}`]: null }; await db.ref().update(up); }
  // ล็อกผู้เล่นแบบรอ (กันชนกับ casinoAct ที่แก้ casino/{uid} ในล็อกเดียวกัน) — ถือทีละล็อก ไม่ซ้อนกัน จึงไม่เกิด deadlock
  async function userLock(uid, now, fn, tries = 12) {
    for (let i = 0; i < tries; i++) { try { return await withLock(db, uid, now, fn); } catch (e) { if (e && e.code === "aborted" && i < tries - 1) { await sleep(150); continue; } throw e; } }
  }
  const dayOf = (c, di) => (c.day && c.day.d === di ? { ...col(c.day), d: di, loss: Number(c.day.loss) || 0, tw: Number(c.day.tw) || 0, pr: col(c.day.pr), buy: col(c.day.buy), hp: Number(c.day.hp) || 0 } : { d: di, loss: 0, hp: 0, buy: {}, tw: 0, pr: {} });
  const cRead = async (uid, now) => { const c = col((await db.ref(`casino/${uid}`).get()).val()); return { c, chips: Number(c.chips) || 0, lock: Number(c.lock) || 0, tb: c.tb || null, day: dayOf(c, dayIdx(now)) }; };

  // ตรวจและหักค่าเข้าโต๊ะ (ในล็อกผู้เล่น)
  async function seatUser(uid, tid, ante, now, p) {
    return userLock(uid, now, async () => {
      const s = await cRead(uid, now);
      if (s.lock > now) fail("failed-precondition", "คุณขอพักไว้ เล่นไม่ได้ตอนนี้");
      if (s.day.loss >= LOSS_CAP) fail("failed-precondition", "วันนี้เสียถึงเพดานแล้ว พักก่อนนะ — การพนันไม่เคยทำให้ใครรวย");
      if (s.day.tw >= TW_CAP) fail("failed-precondition", `วันนี้ชนะจากโต๊ะครบเพดาน ${TW_CAP} ชิปแล้ว`);
      if (s.chips < ante) fail("failed-precondition", "ชิปไม่พอสำหรับค่าเข้าโต๊ะ");
      if (s.tb) { const o = await db.ref(`cpub/${s.tb}/st`).get(); if (o.exists() && o.val() !== "fin") fail("failed-precondition", "คุณนั่งอยู่อีกโต๊ะ ต้องออกจากโต๊ะนั้นก่อน"); }
      await db.ref(`casino/${uid}`).update({ chips: s.chips - ante, tb: tid, day: s.day }); return s.chips - ante;
    });
  }
  const refundUser = (uid, tid, ante, now) => userLock(uid, now, async () => { const s = await cRead(uid, now); await db.ref(`casino/${uid}`).update({ chips: s.chips + ante, tb: s.tb === tid ? null : s.tb }); }, 30);
  const freeUser = (uid, tid, now) => userLock(uid, now, async () => { const s = await cRead(uid, now); if (s.tb === tid) await db.ref(`casino/${uid}/tb`).remove(); }, 30);

  async function eligible(uid, now) {
    const p = (await db.ref(`users/${uid}`).get()).val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    const gm = p.role === "gm" || p.role === "owner"; if (!gm && p.zone !== "casino") fail("failed-precondition", "ต้องอยู่ที่คาสิโนเถื่อนก่อน"); if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
    return { name: String(p.username || "ผู้เล่น").slice(0, 20), gm };
  }

  // เริ่มเกม: ตรวจโควตาเล่นกับคนเดิมรายวัน → แจกรอบ 1
  async function startGame(tid, T, now) {
    const st = await Promise.all(T.seats.map((u) => cRead(u, now)));
    for (let i = 0; i < T.seats.length; i++) for (let j = 0; j < T.seats.length; j++) if (i !== j && (Number(st[i].day.pr[T.seats[j]]) || 0) >= PAIR_MAX) fail("failed-precondition", "มีผู้เล่นที่เล่นกับคนบนโต๊ะนี้ครบโควตารายวันแล้ว");
    for (let i = 0; i < T.seats.length; i++) await userLock(T.seats[i], now, async () => { const s = await cRead(T.seats[i], now); T.seats.forEach((o) => { if (o !== T.seats[i]) s.day.pr[o] = (Number(s.day.pr[o]) || 0) + 1; }); await db.ref(`casino/${T.seats[i]}/day`).set(s.day); });
    T.pts = {}; T.seats.forEach((u) => { T.pts[u] = 0; }); T.t = now; startRound(T, now); runAuto(T, now);
  }
  // จ่ายผลเมื่อจบเกม (ทำครั้งเดียว: เปลี่ยน st เป็น fin ในล็อกโต๊ะเดียวกัน)
  async function settle(tid, T, now) {
    const R = finalize(T); T.res = R; T.st = "fin"; T.t = now; T.hands = {}; T.seats.forEach((u) => { T.hands[u] = []; });
    for (const r of R.rank) {
      await userLock(r.u, now, async () => {
        const s = await cRead(r.u, now); let pay = r.pay; const gain = pay - T.ante, room = Math.max(0, TW_CAP - s.day.tw);
        if (gain > room) { pay = T.ante + room; r.pay = pay; r.net = pay - T.ante; }
        s.day.loss = Math.max(0, s.day.loss + T.ante - pay); s.day.tw += Math.max(0, pay - T.ante);
        await db.ref(`casino/${r.u}`).update({ chips: s.chips + pay, day: s.day, tb: s.tb === tid ? null : s.tb });
      }, 30).catch(() => {});
    }
  }
  const view = (uid, tid, T, extra) => Object.assign({ ok: true, tid, pub: pubOf(tid, T), hand: hand(T, uid), now: Date.now() }, extra || {});
  async function finish(tid, T, now) { runAuto(T, now); if (T.st === "end") await settle(tid, T, now); await saveT(tid, T); }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "list") return list(uid, now);
    if (a === "create") {
      const ante = Math.trunc(Number(data.ante)), max = Math.trunc(Number(data.seats) || 4); if (!ANTES.includes(ante)) fail("invalid-argument", `ค่าเข้าโต๊ะเลือกได้: ${ANTES.join("/")} ชิป`); if (max !== 3 && max !== 4) fail("invalid-argument", "โต๊ะมี 3 หรือ 4 ที่นั่ง");
      const me = await eligible(uid, now), tid = db.ref("ctable").push().key;
      await seatUser(uid, tid, ante, now); const T = newTable(uid, me.name, ante, max, now);
      try { await saveT(tid, T); } catch (e) { await refundUser(uid, tid, ante, now); throw e; }
      return view(uid, tid, T);
    }
    // ----- ตั้งแต่ตรงนี้ทำงานกับโต๊ะที่มีอยู่
    let tid = String((data && data.tid) || ""); if (!tid) { const s = await cRead(uid, now); tid = s.tb || ""; }
    if (!tid || !/^[-\w]{10,40}$/.test(tid)) { if (a === "state") return { ok: true, none: true }; fail("failed-precondition", "ยังไม่ได้นั่งโต๊ะ"); }
    return withLock(db, "t_" + tid, now, async () => {
      const T = await loadT(tid); if (!T) { if (a === "state") { await freeUserAny(uid, tid, now); return { ok: true, none: true }; } fail("not-found", "ไม่พบโต๊ะนี้ (อาจถูกปิดแล้ว)"); }
      const seated = T.seats.includes(uid);
      if (a === "join") {
        if (seated) return view(uid, tid, T); if (T.st !== "wait") fail("failed-precondition", "โต๊ะนี้เริ่มเล่นแล้ว"); if (T.seats.length >= T.max) fail("failed-precondition", "โต๊ะเต็ม");
        const me = await eligible(uid, now); await seatUser(uid, tid, T.ante, now); T.seats.push(uid); T.nm[uid] = me.name; T.pts[uid] = 0; T.t = now;
        let warn = null; if (T.seats.length === T.max) { try { await startGame(tid, T, now); } catch (e) { if (!(e && e.code === "failed-precondition")) throw e; warn = e.message; } }
        await saveT(tid, T); return view(uid, tid, T, warn ? { warn } : null);
      }
      if (a === "state" || a === "tick") {
        if (!seated) return view(uid, tid, T, { spectator: true });
        if (T.st === "play" || T.st === "xchg") {
          for (const u of T.seats) if (!T.dq[u]) { const p = (await db.ref(`users/${u}`).get()).val() || {}; if (p.zone !== "casino" && p.role !== "gm" && p.role !== "owner") T.dq[u] = true; }
          T.t = now; expire(T, now); await finish(tid, T, now);
        } else if (T.st === "fin") await freeUserAny(uid, tid, now);
        return view(uid, tid, T);
      }
      if (!seated) fail("permission-denied", "คุณไม่ได้นั่งโต๊ะนี้");
      if (a === "leave") {
        if (T.st === "wait") {
          await refundUser(uid, tid, T.ante, now); T.seats = T.seats.filter((u) => u !== uid); delete T.nm[uid]; delete T.pts[uid];
          if (!T.seats.length) { await dropT(tid, T); return { ok: true, left: true }; }
          if (T.owner === uid) T.owner = T.seats[0]; T.t = now; await saveT(tid, T, { [`chand/${tid}/${uid}`]: null }); return { ok: true, left: true };
        }
        if (T.st === "fin") { await freeUserAny(uid, tid, now); return { ok: true, left: true }; }
        T.dq[uid] = true; await freeUser(uid, tid, now); T.t = now; expire(T, now); await finish(tid, T, now); return { ok: true, left: true, forfeited: true };
      }
      if (a === "start") {
        if (T.owner !== uid) fail("permission-denied", "เฉพาะเจ้าของโต๊ะ"); if (T.st !== "wait") fail("failed-precondition", "เริ่มไปแล้ว"); if (T.seats.length < 3) fail("failed-precondition", "ต้องมีอย่างน้อย 3 คน");
        await startGame(tid, T, now); await saveT(tid, T); return view(uid, tid, T);
      }
      if (T.st !== "play" && T.st !== "xchg") fail("failed-precondition", T.st === "wait" ? "ยังไม่เริ่มเกม" : "เกมจบแล้ว");
      expire(T, now);
      let err = null;
      if (a === "play") err = playCards(T, uid, (Array.isArray(data.cards) ? data.cards : []).map(Number), now);
      else if (a === "pass") err = passTurn(T, uid, now);
      else if (a === "give") err = giveBack(T, uid, (Array.isArray(data.cards) ? data.cards : []).map(Number), now);
      else fail("invalid-argument", "ไม่รู้จักคำสั่ง");
      if (err) { await finish(tid, T, now); fail("failed-precondition", err); }   // เซฟผลหมดเวลาที่อาจเกิดขึ้นก่อนแล้วค่อยแจ้ง
      T.t = now; await finish(tid, T, now); return view(uid, tid, T);
    });
  }
  const freeUserAny = (uid, tid, now) => freeUser(uid, tid, now).catch(() => {});

  // รายชื่อโต๊ะ + เก็บกวาดโต๊ะค้าง (รอนาน → คืนค่าเข้า / เล่นแล้วร้าง → คืนทุกคน / จบนาน → ลบ)
  async function list(uid, now) {
    const all = col((await db.ref("cpub").get()).val()), rows = []; let cleaned = 0;
    for (const [tid, p] of Object.entries(all)) {
      const age = now - (Number(p.t) || 0);
      if (age > STALE_MS && cleaned < 3 || (p.st === "fin" && age > FIN_KEEP_MS && cleaned < 3)) {
        cleaned++; try { await withLock(db, "t_" + tid, now, async () => { const T = await loadT(tid); if (!T) { await db.ref().update({ [`cpub/${tid}`]: null, [`chand/${tid}`]: null }); return; } const ag = now - (Number(T.t) || 0);
          if (T.st === "fin" && ag > FIN_KEEP_MS) await dropT(tid, T); else if (T.st !== "fin" && ag > STALE_MS) { for (const u of T.seats) if (!T.dq[u] || T.st === "wait") await refundUser(u, tid, T.ante, now).catch(() => {}); await dropT(tid, T); } }); } catch { /* ข้าม */ }
        continue;
      }
      if (p.st === "wait" && p.seats) rows.push({ id: tid, ow: p.ow, ante: p.ante, max: p.max, seats: Array.isArray(p.seats) ? p.seats.map((s) => s.n) : Object.values(p.seats).map((s) => s.n) });
    }
    const s = await cRead(uid, now); return { ok: true, tables: rows, mine: s.tb || null, antes: ANTES, now };
  }
  return { run };
}
module.exports = { makeSlave, comboOf, beats, shuffle, norm, newTable, startRound, giveBack, playCards, passTurn, autoAct, runAuto, expire, finalize, endRound, active, cardTxt, POINTS, ANTES, ROUNDS, TURN_MS, MAX_MISS, TW_CAP, PAIR_MAX, STALE_MS };
