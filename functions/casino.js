// 🎰 คาสิโนเถื่อน (โซน casino — ปลอดภัยแบบ Safe Zone แต่ไม่ใช่โซนปลอดภัย: ใช้ที่พัก/ตลาด/คราฟต์ไม่ได้ โจมตีกันไม่ได้ ค้นหาของไม่ได้)
// เกมแข่งกับเจ้ามือ: สล็อต รูเล็ต ไฮโล บาคาร่า ไฮ-โล แบล็กแจ็ก วิดีโอโป๊กเกอร์ — ผลทั้งหมดสุ่มฝั่งเซิร์ฟเวอร์ (crypto) ผู้เล่นเห็นแค่ผลลัพธ์
// เศรษฐกิจ: แลกของ → ชิป (หักค่าธรรมเนียม 10%) • ชิป → ของในร้านแลก (แพงกว่าตลาด + จำกัดต่อวัน) • ชิปโอนให้ผู้เล่นอื่นไม่ได้ • เจ้ามือได้เปรียบทุกเกม (คาสิโนคือตัวดูดของ)
// "จ่ายด้วยสิ่งอื่น": เลือด (HP ไม่ต่ำกว่า 1) และหนี้นอกระบบ (ดอก 25% ครบ 48 ชม. ถูกยึดของ + ซ้อมเตือน + กู้ไม่ได้ 7 วัน) — เสียหายแบบจำกัด ไม่ถาวร
// ความรับผิดชอบ: เพดานขาดทุนสุทธิรายวัน, ปุ่มพักห้ามเล่น 24 ชม./7 วัน, คำเตือน "การพนันไม่เคยทำให้ใครรวย" • ข้อมูลที่ casino/{uid} (ไม่มีใน rules)
const crypto = require("crypto");
const { fail, withLock, takeItem, grantAll, dayIdx, dayEnd } = require("./lib");

const ri = (n) => crypto.randomInt(n);
const MIN_BET = 5, MAX_BET = 500, LOSS_CAP = 2000, FEE = 0.10, HP_RATE = 3, HP_DAY = 60, LOAN_MAX = 500, LOAN_INT = 0.25, LOAN_MS = 48 * 3600000, NOLOAN_MS = 7 * 86400000, STALE_MS = 10 * 60000;
// มูลค่าของเป็นชิป (ต่อชิ้น) — ของที่ไม่อยู่ในตารางแลกไม่ได้
const VAL = { scrap: 2, water: 3, canned_food: 5, bread: 4, fruit: 4, bandage: 6, moss: 3, energy_drink: 8, medkit: 28, antidote: 14, serum: 30, trauma_kit: 55, army_meal: 20, stim_shot: 24, chem: 5, rotten_meat: 3, steel_plate: 22, copper_wire: 7, battery_pack: 12, circuit_board: 30, gunpowder: 9, duct_tape: 5, rusty_nails: 3, cloth_roll: 5, rope_coil: 5, herb_bundle: 6, fuel_can: 10, leather_scrap: 6, chem_catalyst: 20, mutant_gland: 28, lab_sample: 22, data_chip: 60, gold_watch: 120, survivor_badge: 70, old_photo: 40, lab_core: 150, boss_trophy: 200, fish: 6, golden_fish: 40 };
// ร้านแลกของ: [รหัส, ราคาชิป, โควตาต่อวัน, ฝ่าย]  (deco_/theme_ ของตกแต่งเฉพาะบ่อน)
const SHOP = [
  ["bandage", 9, 10], ["energy_drink", 12, 6], ["army_meal", 28, 5], ["antidote", 20, 5], ["medkit", 40, 4], ["serum", 42, 3], ["stim_shot", 34, 3], ["trauma_kit", 80, 2],
  ["steel_plate", 32, 3], ["circuit_board", 42, 2], ["data_chip", 85, 2], ["chem_catalyst", 30, 3],
  ["deco_slotm", 2500, 1], ["deco_dice", 1500, 1], ["deco_cards", 1500, 1], ["deco_chipstack", 3000, 1], ["theme_casino", 6000, 1]
];
const SHOP_MAP = Object.fromEntries(SHOP.map(([id, p, d]) => [id, { p, d }]));

// ---------- ไพ่ ----------
const deck = () => { const d = Array.from({ length: 52 }, (_, i) => i); for (let i = 51; i > 0; i--) { const j = ri(i + 1); [d[i], d[j]] = [d[j], d[i]]; } return d; };
const rank = (c) => (c % 13) + 1, suit = (c) => Math.floor(c / 13);
const cardTxt = (c) => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][c % 13] + ["♠", "♥", "♦", "♣"][suit(c)];

// ---------- สล็อต ----------
const STRIP = ["🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍋", "🍋", "🍋", "🍋", "🍋", "🔔", "🔔", "🔔", "🔔", "⭐", "⭐", "⭐", "💎", "7️⃣"];
const SLOT3 = { "🍒": 4, "🍋": 6, "🔔": 14, "⭐": 36, "💎": 150, "7️⃣": 400 };   // คูณเดิมพัน เมื่อออก 3 ตัวเหมือนกัน
const slotPay = (r) => { if (r[0] === r[1] && r[1] === r[2]) return SLOT3[r[0]]; const ch = r.filter((x) => x === "🍒").length; return ch === 2 ? 1.2 : ch === 1 ? 0.5 : 0; };
function slotRtp() { let t = 0, n = 0; for (const a of STRIP) for (const b of STRIP) for (const c of STRIP) { t += slotPay([a, b, c]); n++; } return t / n; }
// ---------- รูเล็ต (ยุโรป 0–36) ----------
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
function roulettePay(t, n, x) {   // คืนตัวคูณของเงินเดิมพัน (รวมต้นทุน) เมื่อชนะ
  if (x === 0) return t === "num" && n === 0 ? 36 : 0;
  switch (t) {
    case "num": return x === n ? 36 : 0; case "red": return REDS.has(x) ? 2 : 0; case "black": return !REDS.has(x) ? 2 : 0; case "odd": return x % 2 === 1 ? 2 : 0; case "even": return x % 2 === 0 ? 2 : 0;
    case "low": return x <= 18 ? 2 : 0; case "high": return x >= 19 ? 2 : 0; case "d1": return x <= 12 ? 3 : 0; case "d2": return x > 12 && x <= 24 ? 3 : 0; case "d3": return x > 24 ? 3 : 0;
    case "c1": return x % 3 === 1 ? 3 : 0; case "c2": return x % 3 === 2 ? 3 : 0; case "c3": return x % 3 === 0 ? 3 : 0; default: return 0;
  }
}
const R_TYPES = ["num", "red", "black", "odd", "even", "low", "high", "d1", "d2", "d3", "c1", "c2", "c3"];
// ---------- ไฮโล (สามลูก) ----------
function sicPay(t, n, d) { const s = d[0] + d[1] + d[2], trip = d[0] === d[1] && d[1] === d[2]; if (t === "big") return !trip && s >= 11 ? 2 : 0; if (t === "small") return !trip && s <= 10 ? 2 : 0; if (t === "num") { const c = d.filter((x) => x === n).length; return c ? 1 + c : 0; } return 0; }
// ---------- บาคาร่า ----------
const bv = (c) => Math.min(10, rank(c)) % 10;
function baccarat() {
  const d = deck(), P = [d.pop(), d.pop()], B = [d.pop(), d.pop()], tot = (h) => h.reduce((s, c) => s + bv(c), 0) % 10;
  let p = tot(P), b = tot(B), p3 = null;
  if (p < 8 && b < 8) {
    if (p <= 5) { p3 = d.pop(); P.push(p3); p = tot(P); }
    const x = p3 === null ? null : bv(p3);
    const draw = x === null ? b <= 5 : b <= 2 ? true : b === 3 ? x !== 8 : b === 4 ? x >= 2 && x <= 7 : b === 5 ? x >= 4 && x <= 7 : b === 6 ? x >= 6 && x <= 7 : false;
    if (draw) { B.push(d.pop()); b = tot(B); }
  }
  return { P, B, p, b, win: p > b ? "player" : b > p ? "banker" : "tie" };
}
const baccPay = (side, win) => (win === "tie" ? (side === "tie" ? 9 : 1) : side === win ? (side === "banker" ? 1.95 : 2) : 0);
// ---------- แบล็กแจ็ก ----------
const bjVal = (h) => { let t = h.reduce((s, c) => s + Math.min(10, rank(c)), 0); const ace = h.some((c) => rank(c) === 1); return ace && t + 10 <= 21 ? t + 10 : t; };
const bjNat = (h) => h.length === 2 && bjVal(h) === 21;
// ---------- วิดีโอโป๊กเกอร์ (Jacks or Better, ตาราง 7/5) ----------
const VP_PAY = { royal: 250, sflush: 50, quads: 25, fullhouse: 7, flush: 5, straight: 4, trips: 3, twopair: 2, jacks: 1, none: 0 };
const VP_NAME = { royal: "รอยัลฟลัช", sflush: "สเตรทฟลัช", quads: "โฟร์การ์ด", fullhouse: "ฟูลเฮาส์", flush: "ฟลัช", straight: "สเตรท", trips: "สามใบ", twopair: "สองคู่", jacks: "คู่ J ขึ้นไป", none: "ไม่ได้แต้ม" };
function vpEval(h) {
  const rs = h.map(rank).sort((a, b) => a - b), cnt = {}; rs.forEach((r) => { cnt[r] = (cnt[r] || 0) + 1; }); const c = Object.entries(cnt).map(([r, n]) => [Number(r), n]).sort((a, b) => b[1] - a[1]);
  const flush = new Set(h.map(suit)).size === 1, uniq = new Set(rs).size === 5, straight = uniq && (rs[4] - rs[0] === 4 || (rs[0] === 1 && rs[1] === 10 && rs[4] === 13));
  if (straight && flush) return rs[0] === 1 && rs[1] === 10 ? "royal" : "sflush"; if (c[0][1] === 4) return "quads"; if (c[0][1] === 3 && c[1][1] === 2) return "fullhouse"; if (flush) return "flush"; if (straight) return "straight"; if (c[0][1] === 3) return "trips";
  if (c[0][1] === 2 && c[1][1] === 2) return "twopair"; if (c[0][1] === 2 && (c[0][0] >= 11 || c[0][0] === 1)) return "jacks"; return "none";
}
// ---------- ไฮ-โล ----------
function hiloMult(r1) { const tie = 3 / 51, wH = (4 * (13 - r1)) / 51, wL = (4 * (r1 - 1)) / 51, k = 0.95 - tie; return { hi: wH > 0 ? Math.floor((k / wH) * 100) / 100 : 0, lo: wL > 0 ? Math.floor((k / wL) * 100) / 100 : 0 }; }

function makeCasino(db) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, cS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`casino/${uid}`).get()]);
      const p = pS.val(); if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const gm = p.role === "gm" || p.role === "owner", c = col(cS.val()), di = dayIdx(now);
      const st = { chips: Number(c.chips) || 0, debt: c.debt || null, lock: Number(c.lock) || 0, nl: Number(c.nl) || 0, day: c.day && c.day.d === di ? { d: di, loss: Number(c.day.loss) || 0, hp: Number(c.day.hp) || 0, buy: col(c.day.buy) } : { d: di, loss: 0, hp: 0, buy: {} }, g: col(c.g) };
      const upd = {}; let note = [];
      // ----- ครบกำหนดหนี้ → ยึดของ + ซ้อมเตือน
      if (st.debt && st.debt.due < now) {
        let need = st.debt.a, seized = [];
        const inv = col((await db.ref(`inventory/${uid}`).get()).val());
        const items = Object.values(inv).filter((x) => x && VAL[x.id] && x.qty > 0).sort((x, y) => VAL[x.id] - VAL[y.id]);
        for (const it of items) { if (need <= 0) break; const q = Math.min(it.qty, Math.ceil(need / VAL[it.id])); if (await takeItem(db, uid, it.id, q)) { seized.push([it.id, q]); need -= q * VAL[it.id]; } }
        await db.ref(`users/${uid}/hp`).transaction((h) => (typeof h === "number" ? Math.max(1, h - 10) : h));
        st.debt = null; st.nl = now + NOLOAN_MS; note.push({ debt: true, seized, left: Math.max(0, need) }); upd.debt = null; upd.nl = st.nl;
      }
      // ----- เกมค้างนาน = ริบเดิมพัน
      for (const k of Object.keys(st.g)) if (now - (st.g[k].t || 0) > STALE_MS) { delete st.g[k]; upd[`g/${k}`] = null; }
      const inZone = p.zone === "casino" || gm;
      const hasGame = () => Object.keys(st.g).length > 0;
      const lockLeft = Math.max(0, st.lock - now), capLeft = Math.max(0, LOSS_CAP - st.day.loss);
      const save = async () => { upd.chips = st.chips; upd.day = st.day; if (st.g) upd.g = Object.keys(st.g).length ? st.g : null; Object.keys(upd).forEach((k) => { if (k.startsWith("g/")) delete upd[k]; }); await db.ref(`casino/${uid}`).update(upd); };
      const pubG = (k) => { const g = st.g[k]; if (!g) return null; if (k === "bj") return { bet: g.bet, you: g.you.map(cardTxt), yv: bjVal(g.you), dealer: [cardTxt(g.dl[0]), "🂠"], can: { dbl: g.you.length === 2 && !g.dbl } }; if (k === "hl") return { bet: g.bet, card: cardTxt(g.c), rank: rank(g.c), mult: hiloMult(rank(g.c)) }; if (k === "vp") return { bet: g.bet, hand: g.hand.map(cardTxt), stage: g.stage, pay: VP_PAY }; return null; };
      const view = (extra) => Object.assign({
        ok: true, inZone, chips: st.chips, debt: st.debt, lockLeft, capLeft, lossToday: st.day.loss, cap: LOSS_CAP, hpToday: st.day.hp, hpMax: HP_DAY, noLoan: Math.max(0, st.nl - now), min: MIN_BET, max: MAX_BET, loanMax: LOAN_MAX, fee: FEE, hpRate: HP_RATE,
        games: { bj: pubG("bj"), hl: pubG("hl"), vp: pubG("vp") }, note, warn: "การพนันไม่เคยทำให้ใครรวย", end: dayEnd(now)
      }, extra || {});
      if (a === "state") { if (Object.keys(upd).length) await save(); return view({ rates: VAL, shop: SHOP.map(([id, price, day]) => ({ id, price, day, left: Math.max(0, day - (Number(st.day.buy[id]) || 0)) })), slotRtp: Math.round(slotRtp() * 1000) / 10 }); }
      if (a === "gmChips") {
        if (!gm) fail("permission-denied", "เฉพาะ GM/Owner"); const to = String(data.to || uid), n = Math.trunc(Number(data.n)); if (!Number.isFinite(n) || Math.abs(n) > 1e6) fail("invalid-argument", "จำนวนไม่ถูกต้อง");
        const r = await db.ref(`casino/${to}/chips`).transaction((x) => Math.max(0, (Number(x) || 0) + n)); if (to === uid) st.chips = r.snapshot.val(); if (Object.keys(upd).length) await save(); return view({ gm: true, to, chips2: r.snapshot.val() });
      }
      if (!inZone) fail("failed-precondition", "ต้องอยู่ที่คาสิโนเถื่อนก่อน");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      const needPlay = () => { if (lockLeft > 0) fail("failed-precondition", `คุณขอพักไว้ เล่นได้อีกครั้งใน ${Math.ceil(lockLeft / 3600000)} ชั่วโมง`); if (capLeft <= 0) fail("failed-precondition", "วันนี้เสียถึงเพดานแล้ว พักก่อนนะ — การพนันไม่เคยทำให้ใครรวย"); };
      const bet = (b) => { b = Math.trunc(Number(b)); if (!(b >= MIN_BET && b <= MAX_BET)) fail("invalid-argument", `เดิมพันต้องอยู่ระหว่าง ${MIN_BET}–${MAX_BET} ชิป`); if (b > st.chips) fail("failed-precondition", "ชิปไม่พอ"); return b; };
      const settle = (stake, ret) => { st.day.loss = Math.max(0, st.day.loss + stake - ret); };   // net สะสมต่อวัน (ชนะคืนได้ ไม่ต่ำกว่า 0)

      if (a === "sell") {   // แลกของเป็นชิป
        needPlay(); const id = String(data.id), q = Math.trunc(Number(data.q)); if (!VAL[id] || !(q >= 1 && q <= 99)) fail("invalid-argument", "แลกของนี้ไม่ได้");
        if (!(await takeItem(db, uid, id, q))) fail("failed-precondition", "ของไม่พอ"); const got = Math.floor(VAL[id] * q * (1 - FEE)); st.chips += got; await save(); return view({ got, spent: [id, q] });
      }
      if (a === "blood") {   // จ่ายด้วยเลือด
        needPlay(); const n = Math.trunc(Number(data.n)); if (!(n >= 1 && n <= 30)) fail("invalid-argument", "แลกได้ครั้งละ 1–30 HP");
        if (st.day.hp + n > HP_DAY) fail("failed-precondition", `วันนี้บริจาคเลือดได้อีก ${HP_DAY - st.day.hp} HP`); if (!(p.hp - n >= 1)) fail("failed-precondition", "HP ไม่พอ (ต้องเหลืออย่างน้อย 1)");
        let ok = false; await db.ref(`users/${uid}/hp`).transaction((h) => { ok = false; if (typeof h !== "number") return h; if (h - n < 1) return undefined; ok = true; return h - n; }); if (!ok) fail("failed-precondition", "HP ไม่พอ");
        st.day.hp += n; st.chips += n * HP_RATE; await save(); return view({ got: n * HP_RATE, bled: n });
      }
      if (a === "loan") {
        needPlay(); if (st.debt) fail("failed-precondition", "ยังมีหนี้ค้างอยู่"); if (st.nl > now) fail("failed-precondition", "ถูกห้ามกู้ชั่วคราว"); const amt = Math.trunc(Number(data.n));
        if (!(amt >= 50 && amt <= LOAN_MAX)) fail("invalid-argument", `กู้ได้ครั้งละ 50–${LOAN_MAX} ชิป`); st.debt = { a: Math.ceil(amt * (1 + LOAN_INT)), due: now + LOAN_MS, p: amt }; st.chips += amt; upd.debt = st.debt; await save(); return view({ loaned: amt });
      }
      if (a === "repay") {
        if (!st.debt) fail("failed-precondition", "ไม่มีหนี้"); const n = Math.min(st.chips, st.debt.a, Math.trunc(Number(data.n) || st.debt.a)); if (!(n >= 1)) fail("failed-precondition", "ชิปไม่พอ");
        st.chips -= n; st.debt = { ...st.debt, a: st.debt.a - n }; if (st.debt.a <= 0) st.debt = null; upd.debt = st.debt; await save(); return view({ repaid: n });
      }
      if (a === "buy") {   // แลกชิปเป็นของ (ร้านแลก)
        const id = String(data.id), it = SHOP_MAP[id]; if (!it) fail("invalid-argument", "ไม่มีสินค้านี้"); const used = Number(st.day.buy[id]) || 0; if (used >= it.d) fail("failed-precondition", "วันนี้แลกชิ้นนี้ครบโควตาแล้ว"); if (st.chips < it.p) fail("failed-precondition", "ชิปไม่พอ");
        st.chips -= it.p; st.day.buy[id] = used + 1; if (!(await grantAll(db, uid, [[id, 1]]))) { st.chips += it.p; st.day.buy[id] = used; await save(); fail("failed-precondition", "ช่องเก็บของเต็มหรือมีของชิ้นนี้ครบแล้ว"); }
        await save(); return view({ bought: [id, 1] });
      }
      if (a === "rest") { const h = Number(data.h) === 168 ? 168 : 24; st.lock = now + h * 3600000; upd.lock = st.lock; await save(); return view({ rested: h, lockLeft: h * 3600000 }); }
      // ============ เกม ============
      needPlay();
      if (a === "slots") {
        const b = bet(data.bet), r = [STRIP[ri(20)], STRIP[ri(20)], STRIP[ri(20)]], m = slotPay(r), ret = Math.floor(b * m); st.chips += ret - b; settle(b, ret); await save(); return view({ game: "slots", reels: r, mult: m, bet: b, ret, net: ret - b });
      }
      if (a === "roulette") {
        const list = Array.isArray(data.bets) ? data.bets.slice(0, 8) : []; if (!list.length) fail("invalid-argument", "ยังไม่ได้วางเดิมพัน"); let total = 0; const bs = list.map((x) => { const t = String(x.t), n = Number(x.n), amt = Math.trunc(Number(x.a)); if (!R_TYPES.includes(t) || !(amt >= MIN_BET) || (t === "num" && !(Number.isInteger(n) && n >= 0 && n <= 36))) fail("invalid-argument", "เดิมพันไม่ถูกต้อง"); total += amt; return { t, n, a: amt }; });
        if (total > MAX_BET) fail("invalid-argument", `เดิมพันรวมไม่เกิน ${MAX_BET} ชิป`); if (total > st.chips) fail("failed-precondition", "ชิปไม่พอ");
        const x = ri(37); let ret = 0; bs.forEach((q) => { ret += Math.floor(q.a * roulettePay(q.t, q.n, x)); }); st.chips += ret - total; settle(total, ret); await save(); return view({ game: "roulette", n: x, red: REDS.has(x), bet: total, ret, net: ret - total });
      }
      if (a === "sicbo") {
        const list = Array.isArray(data.bets) ? data.bets.slice(0, 8) : []; if (!list.length) fail("invalid-argument", "ยังไม่ได้วางเดิมพัน"); let total = 0; const bs = list.map((x) => { const t = String(x.t), n = Number(x.n), amt = Math.trunc(Number(x.a)); if (!["big", "small", "num"].includes(t) || !(amt >= MIN_BET) || (t === "num" && !(Number.isInteger(n) && n >= 1 && n <= 6))) fail("invalid-argument", "เดิมพันไม่ถูกต้อง"); total += amt; return { t, n, a: amt }; });
        if (total > MAX_BET) fail("invalid-argument", `เดิมพันรวมไม่เกิน ${MAX_BET} ชิป`); if (total > st.chips) fail("failed-precondition", "ชิปไม่พอ");
        const d = [1 + ri(6), 1 + ri(6), 1 + ri(6)]; let ret = 0; bs.forEach((q) => { ret += Math.floor(q.a * sicPay(q.t, q.n, d)); }); st.chips += ret - total; settle(total, ret); await save(); return view({ game: "sicbo", dice: d, sum: d[0] + d[1] + d[2], triple: d[0] === d[1] && d[1] === d[2], bet: total, ret, net: ret - total });
      }
      if (a === "baccarat") {
        const b = bet(data.bet), side = String(data.side); if (!["player", "banker", "tie"].includes(side)) fail("invalid-argument", "เลือกฝั่งไม่ถูกต้อง"); const g = baccarat(), ret = Math.floor(b * baccPay(side, g.win));
        st.chips += ret - b; settle(b, ret); await save(); return view({ game: "baccarat", P: g.P.map(cardTxt), B: g.B.map(cardTxt), p: g.p, b: g.b, win: g.win, side, bet: b, ret, net: ret - b });
      }
      if (a === "hilo") {
        if (data.act === "start") { if (st.g.hl) fail("failed-precondition", "มีเกมค้างอยู่"); const b = bet(data.bet), d = deck(); st.chips -= b; st.g.hl = { bet: b, c: d.pop(), d: d.slice(0, 5), t: now }; await save(); return view({ game: "hilo", started: true }); }
        const g = st.g.hl; if (!g) fail("failed-precondition", "ยังไม่ได้เริ่มเกม"); const guess = String(data.guess); if (!["hi", "lo"].includes(guess)) fail("invalid-argument", "ทายสูงหรือต่ำ"); const r1 = rank(g.c), m = hiloMult(r1)[guess]; if (!(m > 0)) fail("invalid-argument", "ทายทางนี้ไม่ได้");
        const c2 = g.d[ri(g.d.length)], r2 = rank(c2), win = guess === "hi" ? r2 > r1 : r2 < r1, tie = r2 === r1, ret = tie ? g.bet : win ? Math.floor(g.bet * m) : 0; delete st.g.hl; upd["g/hl"] = null; st.chips += ret; settle(g.bet, ret); await save();
        return view({ game: "hilo", card1: cardTxt(g.c), card2: cardTxt(c2), win, tie, mult: m, bet: g.bet, ret, net: ret - g.bet });
      }
      if (a === "blackjack") {
        const act = String(data.act);
        if (act === "start") {
          if (st.g.bj) fail("failed-precondition", "มีเกมค้างอยู่"); const b = bet(data.bet), d = deck(); st.chips -= b; const g = { bet: b, you: [d.pop(), d.pop()], dl: [d.pop(), d.pop()], dk: d.slice(0, 20), dbl: false, t: now };
          if (bjNat(g.you) || bjNat(g.dl)) { const ret = bjNat(g.you) && bjNat(g.dl) ? b : bjNat(g.you) ? Math.floor(b * 2.2) : 0; st.chips += ret; settle(b, ret); await save(); return view({ game: "blackjack", done: true, you: g.you.map(cardTxt), yv: bjVal(g.you), dealer: g.dl.map(cardTxt), dv: bjVal(g.dl), bet: b, ret, net: ret - b, natural: true }); }
          st.g.bj = g; await save(); return view({ game: "blackjack", started: true });
        }
        const g = st.g.bj; if (!g) fail("failed-precondition", "ยังไม่ได้เริ่มเกม"); const take = () => { const c = g.dk.pop(); if (c === undefined) fail("aborted", "ไพ่หมดกอง"); return c; };
        if (act === "hit") { g.you.push(take()); if (bjVal(g.you) < 21) { g.t = now; await save(); return view({ game: "blackjack", started: true }); } }
        else if (act === "double") { if (g.you.length !== 2 || g.dbl) fail("failed-precondition", "ดับเบิลได้เฉพาะตาแรก"); if (st.chips < g.bet) fail("failed-precondition", "ชิปไม่พอสำหรับดับเบิล"); st.chips -= g.bet; g.bet *= 2; g.dbl = true; g.you.push(take()); }
        else if (act !== "stand") fail("invalid-argument", "คำสั่งไม่ถูกต้อง");
        const yv = bjVal(g.you); let ret = 0;
        if (yv <= 21) { while (bjVal(g.dl) < 17) g.dl.push(take()); const dv = bjVal(g.dl); ret = dv > 21 || yv > dv ? g.bet * 2 : yv === dv ? g.bet : 0; }
        delete st.g.bj; upd["g/bj"] = null; st.chips += ret; settle(g.bet, ret); await save(); return view({ game: "blackjack", done: true, you: g.you.map(cardTxt), yv, dealer: g.dl.map(cardTxt), dv: bjVal(g.dl), bet: g.bet, ret, net: ret - g.bet });
      }
      if (a === "poker") {
        if (data.act === "deal") { if (st.g.vp) fail("failed-precondition", "มีเกมค้างอยู่"); const b = bet(data.bet), d = deck(); st.chips -= b; st.g.vp = { bet: b, hand: d.splice(0, 5), dk: d.slice(0, 15), stage: "hold", t: now }; await save(); return view({ game: "poker", dealt: true }); }
        const g = st.g.vp; if (!g || g.stage !== "hold") fail("failed-precondition", "ยังไม่ได้แจกไพ่"); const hold = new Set((Array.isArray(data.hold) ? data.hold : []).map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < 5));
        const hand = g.hand.map((c, i) => (hold.has(i) ? c : g.dk.pop())), kind = vpEval(hand), ret = Math.floor(g.bet * VP_PAY[kind]); delete st.g.vp; upd["g/vp"] = null; st.chips += ret; settle(g.bet, ret); await save();
        return view({ game: "poker", hand: hand.map(cardTxt), kind, kindTh: VP_NAME[kind], bet: g.bet, ret, net: ret - g.bet, held: [...hold] });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeCasino, VAL, SHOP, SLOT3, slotRtp, slotPay, STRIP, roulettePay, sicPay, baccarat, baccPay, vpEval, VP_PAY, hiloMult, bjVal, deck, REDS, MIN_BET, MAX_BET, LOSS_CAP, FEE };
