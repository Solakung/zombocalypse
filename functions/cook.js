// 🍳 พ่อครัว + มินิเกมทำอาหาร (สับ/คน/ตีไข่/ทอด/ย่าง จังหวะกดตามเวลา) — ยิ่งเพอร์เฟกต์ ยิ่งได้บัฟแรงและนาน
// - เมนู DISHES: ใช้วัตถุดิบ → เซิร์ฟเวอร์สุ่ม 2–3 ขั้นตอนจากชุดเทคนิคของเมนู + จังหวะ (beat) แบบสุ่มเหลื่อม → ผู้เล่นกดตามจังหวะ → ได้อาหาร (custom_food) ที่มีบัฟตามคุณภาพ
// - ความเชื่อใจ: เซิร์ฟเวอร์ออกโจทย์ (t0 + ตารางจังหวะ) ไคลเอนต์ส่งเวลากดของตัวเอง (ซิงก์เวลาเซิร์ฟเวอร์) — รับเมื่อ ts ≥ t0+250ms, ts ≤ now+300ms, ส่งก่อนเวลาจบโจทย์ไม่ได้, ใช้ครั้งเดียว
//   (บอทที่กดแม่นเป๊ะทำได้เท่านั้นเอง: รางวัลคือบัฟชั่วคราวไม่มีของหายาก/ไม่ฟื้น HP จึงไม่คุ้มเสี่ยง)
// - คุณภาพ q = ค่าเฉลี่ยคะแนนทุกจังหวะ (เป๊ะ 1.0 / ดี .7 / พอใช้ .4 / พลาด 0) → ระดับ 0 พอกินได้ (อาหาร/น้ำอย่างเดียว) 1 รสมือดี 2 เลิศรส 3 เพอร์เฟกต์ — พลาดหมดก็ยังได้จาน (ไม่ลงโทษหนักเกิน)
// - ไม่ฟื้น HP (กันของฟื้นล้นเกม) — ให้บัฟสเตตัสชั่วคราว (buffs/{uid} ตัวเดียว ใช้ผ่าน use.js เดิมที่ถามก่อนทับบัฟ) + อาหาร/น้ำเล็กน้อย
// - ฝีมือพ่อครัว: ตัวนับ `cook/{uid}` = {n จานที่ทำสำเร็จ, p จานเพอร์เฟกต์, ch โจทย์ที่ค้าง} (โหนดฝั่งเซิร์ฟเวอร์ ไม่มีกฎเขียนใน rules) → ขั้น 0–5 ตาม n: ช่วงเวลาให้อภัยกว้างขึ้น 7%/ขั้น, บัฟนานขึ้น 2 นาที/ขั้น, ขั้น ≥1 มีโอกาสได้ 2 จาน (8%/ขั้น เมื่อระดับ ≥2) • เมนูพิเศษต้องขั้น ≥3
// - ทำที่ Safe Zone เท่านั้น (เหมือนประกอบของ) • มนุษย์เท่านั้น • ปิดอยู่จนกว่าตั้ง tune cook_on = 1
const crypto = require("crypto");
const { fail, withLock, takeItem, grantAll } = require("./lib");

const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
// เทคนิค: beats จำนวนจังหวะ • gap ระยะห่างเฉลี่ย (มิลลิวินาที — สุ่มเหลื่อม ×0.85–1.2)
const TECH = {
  chop: { n: "สับ", i: "🔪", beats: 4, gap: 650 },
  stir: { n: "คน/ต้ม", i: "🥄", beats: 6, gap: 480 },
  whisk: { n: "ตีไข่/ผสม", i: "🥣", beats: 8, gap: 340 },
  fry: { n: "ทอด", i: "🍳", beats: 2, gap: 1400 },
  grill: { n: "ย่าง", i: "🔥", beats: 3, gap: 1000 }
};
// main/sec = สเตตัสบัฟหลัก/รอง (มนุษย์: str hp st regen)
const DISHES = {
  bbq_fish: { n: "ปลาเผาสมุนไพร", i: "🍢", need: [["fish", 1], ["herb_bundle", 1]], pool: ["chop", "grill", "stir"], main: "str", sec: "st", food: 30, water: 0, rank: 0 },
  hot_stew: { n: "สตูว์เคี่ยวช้า", i: "🍲", need: [["canned_food", 1], ["water", 1]], pool: ["stir", "chop", "fry"], main: "hp", sec: "regen", food: 35, water: 20, rank: 0 },
  fried_bread: { n: "ขนมปังไข่ทอด", i: "🥪", need: [["bread", 1], ["fruit", 1]], pool: ["whisk", "fry", "chop"], main: "st", sec: "regen", food: 30, water: 5, rank: 0 },
  herb_soup: { n: "ซุปสมุนไพรร้อน", i: "🍵", need: [["herb_bundle", 1], ["water", 1]], pool: ["stir", "whisk", "chop"], main: "regen", sec: "hp", food: 10, water: 30, rank: 1 },
  chef_special: { n: "เมนูพิเศษของเชฟ", i: "🍱", need: [["fish", 1], ["canned_food", 1], ["herb_bundle", 1], ["water", 1]], pool: ["chop", "stir", "whisk", "fry", "grill"], main: "str", sec: "hp", food: 45, water: 25, rank: 3, sp: true }
};
const TIERS = [{ n: "พอกินได้", q: 0 }, { n: "รสมือดี", q: 0.3 }, { n: "เลิศรส", q: 0.6 }, { n: "เพอร์เฟกต์", q: 0.85 }];
const RANKS = [3, 12, 30, 70, 150];   // จำนวนจานสะสมที่ขึ้นขั้น 1–5
const TITLES = ["ลูกมือ", "พ่อครัวฝึกหัด", "พ่อครัว", "หัวหน้าครัว", "เชฟประจำฐาน", "เชฟในตำนาน"];
const WIN = { perfect: 90, good: 170, ok: 260 }, SCORE = { perfect: 1, good: 0.7, ok: 0.4 };
const LEAD = 2200, STEP_GAP = 1200, FIRST_BEAT = 900, TAIL = 600, MIN_DELAY = 250, MAX_LATE = 20000, EARLY = 500;
const rankOf = (n) => RANKS.filter((v) => num(n) >= v).length;
const tierOf = (q) => { let t = 0; TIERS.forEach((x, i) => { if (q >= x.q) t = i; }); return t; };
const winMul = (rank) => 1 + 0.07 * rank;
const bminOf = (tier, rank) => 12 + 6 * tier + 2 * rank;
const statsOf = (d, tier, flawless) => (tier <= 0 ? {} : { [d.main]: tier === 3 && flawless ? 4 : tier, ...(tier >= 2 ? { [d.sec]: tier - 1 } : {}) });
// ตัดสินทุกจังหวะ (ฟังก์ชันล้วน — เทสต์ได้) • steps = [{k, at:[ms จาก t0]}] • presses = [[ts...] ต่อขั้น] • คืน {q, perfect, beats, per:[คะแนนต่อขั้น], flawless}
function judge(t0, steps, presses, now, rank) {
  const m = winMul(rank), w = { perfect: WIN.perfect * m, good: WIN.good * m, ok: WIN.ok * m };
  let sum = 0, cnt = 0, perfect = 0; const per = [];
  steps.forEach((s, k) => {
    const pr = (Array.isArray(presses && presses[k]) ? presses[k] : []).slice(0, s.at.length + 4).filter((x) => typeof x === "number" && Number.isFinite(x) && x >= t0 + MIN_DELAY && x <= now + 300).map((x) => x - t0).sort((a, b) => a - b);
    const used = new Array(pr.length).fill(false); let ss = 0;
    s.at.forEach((b) => {
      let bi = -1, be = 1e9; pr.forEach((x, i) => { const e = Math.abs(x - b); if (!used[i] && e < be) { be = e; bi = i; } });
      let sc = 0; if (bi >= 0) { used[bi] = true; sc = be <= w.perfect ? SCORE.perfect : be <= w.good ? SCORE.good : be <= w.ok ? SCORE.ok : 0; if (sc === 1) perfect++; }
      ss += sc; sum += sc; cnt++;
    });
    per.push(Math.round((ss / s.at.length) * 100) / 100);
  });
  return { q: cnt ? sum / cnt : 0, perfect, beats: cnt, per, flawless: cnt > 0 && perfect === cnt };
}

function makeCook(db, rnd) {
  const rf = rnd || (() => crypto.randomInt(1000000) / 1000000);
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  const dishView = (id, rank) => { const d = DISHES[id]; return { id, n: d.n, i: d.i, need: d.need, pool: d.pool, main: d.main, sec: d.sec, rank: d.rank, locked: d.rank > rank, sp: !!d.sp }; };
  const view = (c, on) => { const n = num(c && c.n), rank = rankOf(n); return { ok: true, on, n, p: num(c && c.p), rank, title: TITLES[rank], next: rank < RANKS.length ? RANKS[rank] : 0, win: Math.round(winMul(rank) * 100) / 100, dishes: Object.keys(DISHES).map((id) => dishView(id, rank)) }; };
  // โจทย์: ขั้นเรียงต่อกันบนเส้นเวลาเดียว (นับจาก t0) — ขั้นละ [สุ่มเหลื่อมจังหวะ] เริ่มหลังจบขั้นก่อน STEP_GAP
  function makeSteps(d) {
    const cnt = d.pool.length >= 3 && rf() < 0.5 ? 3 : 2, pool = d.pool.slice(), picks = [];
    if (d.sp) { while (picks.length < 3) picks.push(pool.splice(Math.floor(rf() * pool.length), 1)[0]); } else { while (picks.length < cnt) picks.push(pool.splice(Math.floor(rf() * pool.length), 1)[0]); }
    let t = LEAD; const steps = picks.map((k) => {
      const T = TECH[k], at = []; let x = t + FIRST_BEAT;
      for (let i = 0; i < T.beats; i++) { at.push(Math.round(x)); x += T.gap * (0.85 + 0.35 * rf()); }
      const last = at[at.length - 1]; t = last + TAIL + STEP_GAP; return { k, at };
    });
    return { steps, end: steps[steps.length - 1].at.slice(-1)[0] + TAIL };
  }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "start", "done"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const on = (await tune("cook_on", 0)) === 1;
    if (a === "state") return view((await db.ref(`cook/${uid}`).get()).val(), on);
    if (!on) return { ok: true, on: false };
    return withLock(db, uid, now, async () => {
      const [pS, cS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`cook/${uid}`).get()]), p = pS.val(), c = cS.val() || {}, rank = rankOf(c.n);
      if (!p || p.banned === true || p.role !== "player") fail("permission-denied", "บัญชีนี้ทำอาหารไม่ได้");
      if (p.faction !== "human") fail("failed-precondition", "ซอมบี้ทำอาหารไม่เป็น…");
      if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
      if (p.zone !== "safe") fail("failed-precondition", "ทำอาหารได้เฉพาะที่ Safe Zone");

      if (a === "start") {
        const id = String(data.dish || ""), d = DISHES[id]; if (!d) fail("invalid-argument", "ไม่มีเมนูนี้");
        if (d.rank > rank) fail("failed-precondition", `เมนูนี้ต้องฝีมือขั้น ${d.rank} (${TITLES[d.rank]}) ขึ้นไป`);
        const took = [];
        for (const [iid, q] of d.need) {
          if (!(await takeItem(db, uid, iid, q))) { if (took.length) await grantAll(db, uid, took); fail("failed-precondition", "วัตถุดิบไม่พอ"); }
          took.push([iid, q]);
        }
        const { steps, end } = makeSteps(d), ch = { t0: now, d: id, steps, end };
        await db.ref(`cook/${uid}/ch`).set(ch);
        return { ok: true, on: true, t0: now, dish: id, n: d.n, i: d.i, end, win: WIN, mul: winMul(rank), steps: steps.map((s) => ({ k: s.k, n: TECH[s.k].n, i: TECH[s.k].i, at: s.at })) };
      }

      // done
      const ch = c.ch; if (!ch || !ch.steps || !DISHES[ch.d]) fail("failed-precondition", "ไม่มีจานที่กำลังทำอยู่");
      if (now < ch.t0 + ch.end - EARLY) fail("failed-precondition", "ยังทำไม่เสร็จ");
      const d = DISHES[ch.d];
      if (now > ch.t0 + ch.end + MAX_LATE) { await db.ref(`cook/${uid}/ch`).remove(); fail("deadline-exceeded", "ทำช้าเกินไป จานนี้เสียไปแล้ว"); }
      const j = judge(ch.t0, ch.steps, data.presses, now, rank), tier = tierOf(j.q), st = statsOf(d, tier, j.flawless), bmin = bminOf(tier, rank);
      const dbl = tier >= 2 && rank >= 2 && rf() < 0.08 * rank, qty = dbl ? 2 : 1;
      const food = d.food + 3 * tier, water = d.water ? d.water + 2 * tier : 0, name = `${d.n}${tier ? ` (${TIERS[tier].n})` : " (พอกินได้)"}`;
      const key = `ck_${ch.d}_${tier}_${bmin}`, fields = { id: "custom_food", type: "consumable", name, icon: d.i, food, ...(water ? { water } : {}), ...(tier ? { bmin } : {}), ...Object.fromEntries(Object.entries(st).map(([k, v]) => ["b_" + k, v])) };
      const res = await db.ref(`inventory/${uid}/${key}`).transaction((cur) => {
        if (!cur) return { ...fields, qty };
        if (cur.id !== "custom_food" || cur.name !== name || cur.bmin !== fields.bmin || !(cur.qty > 0) || cur.qty + qty > 99) return undefined;
        return { ...cur, qty: cur.qty + qty };
      });
      if (!res.committed) fail("failed-precondition", "กระเป๋าเต็ม — เคลียร์ช่องแล้วกดส่งอีกครั้ง (จานนี้ยังรอคุณอยู่)");
      await db.ref(`cook/${uid}`).update({ ch: null, n: num(c.n) + 1, p: num(c.p) + (tier === 3 ? 1 : 0), ts: now });
      const nn = num(c.n) + 1, nr = rankOf(nn);
      return { ok: true, on: true, q: Math.round(j.q * 100) / 100, tier, tierName: TIERS[tier].n, perfect: j.perfect, beats: j.beats, per: j.per, flawless: j.flawless, name, icon: d.i, qty, stats: st, bmin: tier ? bmin : 0, food, water, n: nn, rank: nr, title: TITLES[nr], rankUp: nr > rank };
    });
  }
  return { run };
}
module.exports = { makeCook, judge, DISHES, TECH, TIERS, RANKS, TITLES, rankOf, tierOf, statsOf, bminOf, WIN };
