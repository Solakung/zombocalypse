// 🌱 แปลงปลูก (Garden) ในที่พัก: ลงเมล็ด → รดน้ำ/ใส่ปุ๋ย → เก็บเกี่ยวผลผลิต • ⬆️ อัปเกรดสวน (upgrade) ระดับ 1–5 แยกตามฝ่าย • ฤดูกาลมีผลกับเวลาโต • มีเหตุการณ์เล็ก ๆ ตอนเก็บเกี่ยว
// ข้อมูลที่ garden/{uid} (ไม่มีใน rules → เขียนได้เฉพาะฟังก์ชันนี้) • เมล็ดพันธุ์เป็นตัวนับ garden/{uid}/seed/{พืช} (lib.js: id "seed_<พืช>")
// ไม่แตะ หิว/น้ำ/พลังงาน/HP • ผลผลิตเป็นไอเทมเดิมที่อยู่ใน whitelist กระเป๋าอยู่แล้ว
const { fail, withLock, takeItem, grantAll, dayIdx, dayEnd } = require("./lib");
const { seaIdx } = require("./pass");
const MIN = 60000, H = 3600000;

// f: ฝ่าย (h/z) • g: เวลาโต (ms) • y: ผลผลิต [รหัสไอเทม, จำนวน] • s: ตัวคูณเวลาตามซีซัน [ฝน, โรคระบาด, เก็บเสบียง, หนาว] (<1 = โตไว)
// buy: ราคาเมล็ด (ซื้อได้เฉพาะพืชธรรมดา/ไม่ธรรมดา) • r: ความหายาก (0 ธรรมดา, 1 ไม่ธรรมดา, 2 หายาก)
const CROPS = {
  herb: { f: "h", n: "สมุนไพรข้างรั้ว", i: "🌿", g: 45 * MIN, y: ["herb_bundle", 3], s: [0.7, 1, 1, 1.4], buy: ["scrap", 3], r: 0 },
  mossb: { f: "h", n: "บ่อมอส", i: "🪴", g: 40 * MIN, y: ["moss", 4], s: [0.6, 1, 1.1, 1.3], buy: ["scrap", 3], r: 0 },
  tomato: { f: "h", n: "มะเขือเทศบนดาดฟ้า", i: "🍅", g: 90 * MIN, y: ["fruit", 3], s: [1, 1.1, 0.7, 1.5], buy: ["scrap", 5], r: 0 },
  wheat: { f: "h", n: "ข้าวสาลีป่า", i: "🌾", g: 3 * H, y: ["bread", 2], s: [1.1, 1.1, 0.7, 1.4], buy: ["scrap", 6], r: 1 },
  pumpkin: { f: "h", n: "ฟักทองหลังบ้านร้าง", i: "🎃", g: 6 * H, y: ["soup", 2], s: [1.2, 1.1, 0.7, 1.3], buy: ["scrap", 9], r: 1 },
  aloe: { f: "h", n: "ว่านหางจระเข้", i: "🪻", g: 4 * H, y: ["bandage", 3], s: [0.8, 0.7, 1, 1.4], buy: ["scrap", 9], r: 1 },
  shroom: { f: "h", n: "เห็ดห้องใต้ดิน", i: "🍄", g: 8 * H, y: ["army_meal", 1], s: [0.7, 1.1, 1, 1.2], r: 2 },
  glow: { f: "h", n: "ดอกไม้เรืองแสง", i: "🌸", g: 12 * H, y: ["serum", 1], s: [1, 0.7, 1.2, 1.5], r: 2 },
  fungus: { f: "z", n: "เชื้อราซาก", i: "🍄", g: 60 * MIN, y: ["rotten_meat", 4], s: [0.7, 0.8, 1, 1.4], buy: ["rotten_meat", 3], r: 0 },
  maggot: { f: "z", n: "บ่อหนอน", i: "🪱", g: 3 * H, y: ["rotten_meat", 7], s: [0.9, 0.8, 0.8, 1.3], buy: ["rotten_meat", 6], r: 1 },
  bog: { f: "z", n: "แอ่งน้ำเน่า", i: "💧", g: 50 * MIN, y: ["water", 3], s: [0.6, 1, 1, 1.4], buy: ["rotten_meat", 3], r: 0 },
  bloodroot: { f: "z", n: "รากเลือด", i: "🩸", g: 10 * H, y: ["mutant_gland", 1], s: [1, 0.7, 1.2, 1.4], r: 2 }
};
const plotsFor = (lv) => (lv >= 1 ? 2 + 2 * Math.min(3, lv) : 0);   // ที่พักขั้น 1/2/3 → 4/6/8 แปลง
const FERT = { human: ["scrap", 1], zombie: ["rotten_meat", 1] };
const WATER_COST = ["water", 1];
const MUT = { human: [["serum", 1], ["chem_catalyst", 1], ["medkit", 1]], zombie: [["mutant_gland", 1], ["serum", 1]] };
const PEST = 0.12, MUTATE = 0.08;
// ⬆️ อัปเกรดสวน (ระดับ 1–5 แยกตามฝ่าย — เก็บที่ garden/{uid}/u) ผสม 4 แบบ: เพิ่มแปลง / เวลาโตลดลง / โอกาสได้ผลผลิตเพิ่ม +1 ชิ้น / โอกาสกลายพันธุ์ (ซอมบี้)
// eff = ผลสะสมรวมของระดับนั้น {p: แปลงเพิ่ม, g: เวลาโตลด %, b: โอกาส +1 ชิ้น %, m: กลายพันธุ์เพิ่ม %} • cost ต้องไม่เกิน 99 ต่อชนิด (เพดานช่องกระเป๋า) • ซอมบี้ไม่ได้เศษวัสดุ/สารเคมีจากการค้น จึงใช้เนื้อเน่า/ต่อมมิวแทนต์
const UP_MAX = 5;
const UP = {
  human: [
    { n: "🌿 ขยายแปลงริมรั้ว", d: "แปลง +1", cost: [["scrap", 30]], eff: { p: 1, g: 0, b: 0, m: 0 } },
    { n: "💧 ระบบรดน้ำฝน", d: "เวลาโต −6%", cost: [["scrap", 45], ["rope_coil", 2]], eff: { p: 1, g: 6, b: 0, m: 0 } },
    { n: "🧺 ปุ๋ยหมัก", d: "เก็บเกี่ยวมีโอกาส 10% ได้เพิ่ม +1 ชิ้น", cost: [["scrap", 60], ["herb_bundle", 6], ["chem", 3]], eff: { p: 1, g: 6, b: 10, m: 0 } },
    { n: "🌿 แถวปลูกใหม่", d: "แปลง +1 อีก (รวม +2)", cost: [["scrap", 80], ["steel_plate", 2]], eff: { p: 2, g: 6, b: 10, m: 0 } },
    { n: "🏆 สวนชุมชน", d: "เวลาโตลดรวม −14% และโอกาสได้เพิ่มรวม 20%", cost: [["scrap", 99], ["steel_plate", 3], ["battery_pack", 2]], eff: { p: 2, g: 14, b: 20, m: 0 } }
  ],
  zombie: [
    { n: "🪱 ขุดบ่อเพิ่ม", d: "แปลง +1", cost: [["rotten_meat", 30]], eff: { p: 1, g: 0, b: 0, m: 0 } },
    { n: "🍖 บ่มซาก", d: "เก็บเกี่ยวมีโอกาส 15% ได้เพิ่ม +1 ชิ้น", cost: [["rotten_meat", 45], ["water", 3]], eff: { p: 1, g: 0, b: 15, m: 0 } },
    { n: "🧬 เชื้อกลายพันธุ์", d: "โอกาสกลายพันธุ์ +4% (รวม 12%)", cost: [["rotten_meat", 60], ["mutant_gland", 1]], eff: { p: 1, g: 0, b: 15, m: 4 } },
    { n: "🪱 บ่อสำรอง", d: "แปลง +1 อีก (รวม +2)", cost: [["rotten_meat", 80], ["mutant_gland", 2]], eff: { p: 2, g: 0, b: 15, m: 4 } },
    { n: "👑 รังเพาะพันธุ์", d: "เวลาโต −10% • โอกาสได้เพิ่มรวม 25% • กลายพันธุ์รวม +8%", cost: [["rotten_meat", 99], ["mutant_gland", 4]], eff: { p: 2, g: 10, b: 25, m: 8 } }
  ]
};
const ZERO = { p: 0, g: 0, b: 0, m: 0 };
const upLv = (u) => Math.max(0, Math.min(UP_MAX, Math.trunc(Number(u)) || 0));
const upEff = (fac, lv) => (upLv(lv) > 0 ? UP[fac][upLv(lv) - 1].eff : ZERO);
const DAILY_SEEDS = { human: ["herb", "mossb", "tomato"], zombie: ["fungus", "bog"] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const growMs = (c, now, cutPct = 0) => Math.round(CROPS[c].g * CROPS[c].s[seaIdx(now) % 4] * (1 - cutPct / 100));

function makeGarden(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, gS, bS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`garden/${uid}`).get(), db.ref(`base/${uid}/lv`).get()]);
      const p = pS.val(), g = gS.val() || {}, lv = bS.val() || 0;
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human", fk = fac === "zombie" ? "z" : "h", ul = upLv(g.u), ef = upEff(fac, ul), n = lv >= 1 ? plotsFor(lv) + ef.p : 0, plots = g.p || {}, seed = g.seed || {}, hv = g.h || {};
      const di = dayIdx(now);
      const need = () => { if (p.zone !== "safe" || !(p.hp > 0)) fail("failed-precondition", "ต้องอยู่ที่ Safe Zone และมีชีวิต"); if (n < 1) fail("failed-precondition", "ต้องมีที่พักขั้น 1 ขึ้นไปก่อน"); };
      const idxOf = () => { const i = Number(data.i); if (!Number.isInteger(i) || i < 1 || i > n) fail("invalid-argument", "ไม่มีแปลงนี้"); return i; };
      const set = (path, v) => db.ref(`garden/${uid}/${path}`).set(v);
      const view = (extra) => Object.assign({
        ok: true, n, season: seaIdx(now) % 4, daily: g.d !== di, dEnd: dayEnd(now),
        plots: Array.from({ length: n }, (_, k) => { const r = plots[k + 1]; return r ? { i: k + 1, c: r.c, e: r.e, w: !!r.w, f: !!r.f, ready: now >= r.e, left: Math.max(0, r.e - now), total: r.e - r.t } : { i: k + 1 }; }),
        seeds: Object.fromEntries(Object.entries(seed).filter(([c, q]) => CROPS[c] && q > 0)), harvested: hv,
        crops: Object.fromEntries(Object.entries(CROPS).filter(([, c]) => c.f === fk).map(([id, c]) => [id, { n: c.n, i: c.i, r: c.r, g: growMs(id, now, ef.g), y: c.y, buy: c.buy || null, h: hv[id] || 0 }])),
        fert: FERT[fac], water: WATER_COST,
        up: { lv: ul, max: UP_MAX, eff: ef, tiers: UP[fac].map((t, i) => ({ n: t.n, d: t.d, cost: t.cost, done: i < ul })), next: ul < UP_MAX ? { n: UP[fac][ul].n, d: UP[fac][ul].d, cost: UP[fac][ul].cost } : null }
      }, extra || {});
      if (a === "state") return view();

      if (a === "daily") {   // เมล็ดฟรีวันละครั้ง (ของขวัญ ไม่ต้องเข้าทุกวันก็ไม่เสียอะไร)
        if (g.d === di) fail("failed-precondition", "วันนี้รับเมล็ดฟรีไปแล้ว");
        if (n < 1) fail("failed-precondition", "ต้องมีที่พักขั้น 1 ขึ้นไปก่อน");
        const c = pick(DAILY_SEEDS[fac]), q = 2;
        if (!(await grantAll(db, uid, [["seed_" + c, q]]))) fail("failed-precondition", "เมล็ดชนิดนี้เต็ม 99 แล้ว");
        await set("d", di); seed[c] = (seed[c] || 0) + q; g.d = di;
        return view({ got: [["seed_" + c, q]] });
      }
      if (a === "buy") {
        need();
        const c = CROPS[data.c], q = Math.max(1, Math.min(10, Number(data.q) || 1));
        if (!c || c.f !== fk || !c.buy) fail("invalid-argument", "ซื้อเมล็ดนี้ไม่ได้");
        const [id, cost] = c.buy;
        if (!(await takeItem(db, uid, id, cost * q))) fail("failed-precondition", "ของไม่พอ");
        if (!(await grantAll(db, uid, [["seed_" + data.c, q]]))) { await grantAll(db, uid, [[id, cost * q]]); fail("failed-precondition", "เมล็ดชนิดนี้เต็ม 99 แล้ว"); }
        seed[data.c] = (seed[data.c] || 0) + q;
        return view({ bought: [["seed_" + data.c, q]] });
      }
      if (a === "plant") {
        need();
        const i = idxOf(), cid = String(data.c), c = CROPS[cid];
        if (!c || c.f !== fk) fail("invalid-argument", "ปลูกพืชนี้ไม่ได้");
        if (plots[i]) fail("failed-precondition", "แปลงนี้มีพืชอยู่แล้ว");
        let okSeed = false;   // transaction รอบแรกอาจได้ null (ยังไม่มีแคช) → อย่า abort ให้เซิร์ฟเวอร์ส่งค่าจริงมาแล้วรันซ้ำ
        const took = await db.ref(`garden/${uid}/seed/${cid}`).transaction((x) => { okSeed = false; if (x === null) return x; if (!((Number(x) || 0) >= 1)) return undefined; okSeed = true; return (Number(x) - 1) || null; });
        if (!took.committed || !okSeed) fail("failed-precondition", "ไม่มีเมล็ดพันธุ์ชนิดนี้");
        const rec = { c: cid, t: now, e: now + growMs(cid, now, ef.g) };
        try { await set("p/" + i, rec); } catch (e) { await grantAll(db, uid, [["seed_" + cid, 1]]); throw e; }
        plots[i] = rec; seed[cid] = Math.max(0, (seed[cid] || 0) - 1);
        return view();
      }
      if (a === "water" || a === "fert") {
        need();
        const i = idxOf(), r = plots[i];
        if (!r) fail("failed-precondition", "แปลงนี้ยังว่างอยู่");
        if (now >= r.e) fail("failed-precondition", "พืชพร้อมเก็บเกี่ยวแล้ว");
        if (a === "water" ? r.w : r.f) fail("failed-precondition", a === "water" ? "แปลงนี้รดน้ำแล้ว" : "แปลงนี้ใส่ปุ๋ยแล้ว");
        const [id, q] = a === "water" ? WATER_COST : FERT[fac];
        if (!(await takeItem(db, uid, id, q))) fail("failed-precondition", "ของไม่พอ");
        if (a === "water") { r.w = 1; r.e = now + Math.round((r.e - now) * 0.75); } else r.f = 1;   // รดน้ำ: เวลาที่เหลือลด 25% • ปุ๋ย: กันศัตรูพืช + ผลผลิต +1
        await set("p/" + i, r);
        return view();
      }
      if (a === "upgrade") {
        need();
        if (ul >= UP_MAX) fail("failed-precondition", "สวนอัปเกรดถึงระดับสูงสุดแล้ว");
        const tier = UP[fac][ul], took = [];
        for (const [id, q] of tier.cost) {
          if (!(await takeItem(db, uid, id, q))) { for (const [rid, rq] of took) await grantAll(db, uid, [[rid, rq]]); fail("failed-precondition", "ของไม่พอสำหรับอัปเกรดนี้"); }
          took.push([id, q]);
        }
        let okLv = false;   // กันอัปซ้อน: ตั้งระดับเฉพาะเมื่อยังเท่าที่อ่านมา (รอบแรกของ transaction อาจได้ null)
        try { await db.ref(`garden/${uid}/u`).transaction((x) => { okLv = false; if (x === null) { if (ul !== 0) return x; okLv = true; return 1; } if (upLv(x) !== ul) return undefined; okLv = true; return ul + 1; }); }
        catch (e) { for (const [rid, rq] of took) await grantAll(db, uid, [[rid, rq]]); throw e; }
        if (!okLv) { for (const [rid, rq] of took) await grantAll(db, uid, [[rid, rq]]); fail("aborted", "อัปเกรดไม่สำเร็จ ลองใหม่อีกครั้ง"); }
        g.u = ul + 1;
        const ul2 = ul + 1, ef2 = upEff(fac, ul2), n2 = plotsFor(lv) + ef2.p;
        return Object.assign(view(), { upgraded: tier.n, lv: ul2, ok: true, n: n2, plots: Array.from({ length: n2 }, (_, k) => { const r = plots[k + 1]; return r ? { i: k + 1, c: r.c, e: r.e, w: !!r.w, f: !!r.f, ready: now >= r.e, left: Math.max(0, r.e - now), total: r.e - r.t } : { i: k + 1 }; }), up: { lv: ul2, max: UP_MAX, eff: ef2, tiers: UP[fac].map((t, i) => ({ n: t.n, d: t.d, cost: t.cost, done: i < ul2 })), next: ul2 < UP_MAX ? { n: UP[fac][ul2].n, d: UP[fac][ul2].d, cost: UP[fac][ul2].cost } : null } });
      }
      if (a === "harvest") {
        need();
        const targets = data.i === "all" ? Object.keys(plots).map(Number).filter((k) => k <= n && plots[k] && now >= plots[k].e) : [idxOf()];
        if (!targets.length) fail("failed-precondition", "ยังไม่มีแปลงที่พร้อมเก็บ");
        const got = {}, notes = []; let cnt = 0;
        for (const i of targets) {
          const r = plots[i];
          if (!r || now < r.e) { if (data.i !== "all") fail("failed-precondition", "ยังโตไม่เสร็จ"); continue; }
          const c = CROPS[r.c]; if (!c) continue;
          let [id, q] = c.y; q += r.f ? 1 : 0;
          let ev = null;
          if (!r.f && Math.random() < PEST) { q = Math.max(1, q - 1); ev = `🐛 ศัตรูพืชกัดแปลง ${c.i}${c.n} (ได้น้อยลง 1)`; }
          if (ef.b > 0 && Math.random() * 100 < ef.b) { q += 1; ev = ev || `🌟 ${c.i}${c.n} ได้ผลผลิตเพิ่ม +1`; }   // อัปเกรดสวน: โอกาสได้เพิ่ม
          const list = [[id, q]];
          if (Math.random() < MUTATE + ef.m / 100) { const m = pick(MUT[fac]); list.push(m); ev = `✨ ${c.i}${c.n} กลายพันธุ์! ได้ของแถมพิเศษ`; }
          if (!(await grantAll(db, uid, list))) { if (cnt) break; fail("failed-precondition", "ช่องกระเป๋าเต็ม (99 ชิ้น) — เคลียร์ของก่อนเก็บเกี่ยว"); }
          list.forEach(([k, v]) => { got[k] = (got[k] || 0) + v; });
          await set("p/" + i, null); delete plots[i];
          hv[r.c] = (hv[r.c] || 0) + 1; await set("h/" + r.c, hv[r.c]); cnt++;
          if (ev) notes.push(ev);
        }
        if (!cnt) fail("failed-precondition", "ช่องกระเป๋าเต็ม (99 ชิ้น) — เคลียร์ของก่อนเก็บเกี่ยว");
        return view({ got: Object.entries(got), notes, cnt });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeGarden, CROPS, plotsFor, growMs, DAILY_SEEDS, MUT, FERT, UP, UP_MAX, upEff };
