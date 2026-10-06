// 🎟️ ภารกิจซีซัน (Season Pass): ภารกิจรายวัน/รายสัปดาห์ → XP → รางวัล 30 ระดับ
// ความคืบหน้านับจากตัวนับความสำเร็จ ach/{uid}/c ที่เกมเขียนอยู่แล้ว โดยเซิร์ฟเวอร์เก็บ "ค่าตั้งต้น" ของแต่ละช่วงไว้ที่ pass/{uid}
// (โหนด pass ไม่มีในไฟล์ rules → ฝั่งไคลเอนต์เขียนไม่ได้ ต้องผ่านฟังก์ชันนี้เท่านั้น • ไม่ต้องแก้ rules)
const COOP_TZ = 25200000, DAY = 86400000;
const SEA_LEN = 28, SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / DAY);   // ต้องตรงกับ script.js
const TIER_XP = 100, TIERS = 30, XP_DAILY = 25, XP_WEEKLY = 80;

// [รหัส, ตัวนับ ach, เป้าหมาย, ข้อความ, ฝ่าย(h/z/ว่าง=ทั้งคู่)]
const DAILY = [
  ["d_srch", "srch", 20, "🔍 ค้นหาของ 20 ครั้ง"], ["d_srch2", "srch", 35, "🔍 ค้นหาของ 35 ครั้ง"],
  ["d_found", "found", 12, "🎒 เจอของ 12 ชิ้น"], ["d_night", "nsrch", 8, "🌙 ค้นหาตอนกลางคืน 8 ครั้ง"],
  ["d_zwin", "zwin", 5, "⚔️ ชนะซอมบี้ 5 ครั้ง", "h"], ["d_bite", "bite", 3, "🦷 กัดเหยื่อ 3 ครั้ง", "z"],
  ["d_use", "use", 6, "🧪 ใช้ไอเทม 6 ครั้ง"], ["d_craft", "craft", 3, "🔧 คราฟต์ 3 ชิ้น", "h"],
  ["d_mkt", "mkt", 2, "🏪 ซื้อ/ขายในตลาด 2 ครั้ง"], ["d_bcol", "bcol", 3, "🏠 เก็บผลผลิตที่พัก 3 ชิ้น"],
  ["d_fish", "fish", 2, "🎣 ตกปลา 2 ครั้ง"], ["d_enc", "enc", 2, "🎭 ผ่านเหตุการณ์สุ่ม 2 ครั้ง"]
];
const WEEKLY = [
  ["w_srch", "srch", 150, "🔍 ค้นหาของ 150 ครั้ง"], ["w_found", "found", 80, "🎒 เจอของ 80 ชิ้น"],
  ["w_zwin", "zwin", 30, "⚔️ ชนะซอมบี้ 30 ครั้ง", "h"], ["w_bite", "bite", 15, "🦷 กัดเหยื่อ 15 ครั้ง", "z"],
  ["w_use", "use", 35, "🧪 ใช้ไอเทม 35 ครั้ง"], ["w_craft", "craft", 15, "🔧 คราฟต์ 15 ชิ้น", "h"],
  ["w_mkt", "mkt", 8, "🏪 ซื้อ/ขายในตลาด 8 ครั้ง"], ["w_bcol", "bcol", 20, "🏠 เก็บผลผลิตที่พัก 20 ชิ้น"],
  ["w_camp", "camp", 100, "🏕️ สมทบโปรเจกต์ค่าย 100 แต้ม"], ["w_boss", "boss", 2, "👹 ชนะมินิบอส 2 ครั้ง"],
  ["w_fish", "fish", 10, "🎣 ตกปลา 10 ครั้ง"], ["w_night", "nsrch", 40, "🌙 ค้นหาตอนกลางคืน 40 ครั้ง"],
  ["w_enc", "enc", 8, "🎭 ผ่านเหตุการณ์สุ่ม 8 ครั้ง"]
];
const POOL = {};
DAILY.concat(WEEKLY).forEach((m) => { POOL[m[0]] = { id: m[0], k: m[1], n: m[2], t: m[3], f: m[4] || "", xp: m[0][0] === "d" ? XP_DAILY : XP_WEEKLY }; });

// รางวัลระดับ 1–30: R([ไอเทมมนุษย์, จำนวน], [ไอเทมซอมบี้, จำนวน]) — ไม่ระบุช่องที่สอง = ใช้ของเดียวกัน
const R = (h, z) => ({ h: [h], z: [z || h] });
const TIER_REW = [
  R(["water", 2], ["water", 2]), R(["bandage", 2], ["rotten_meat", 3]), R(["canned_food", 2], ["rotten_meat", 3]), R(["scrap", 5], ["rotten_meat", 4]),
  R(["medkit", 1], ["energy_drink", 1]), R(["energy_drink", 1]), R(["duct_tape", 2], ["mutant_gland", 1]), R(["army_meal", 1], ["rotten_meat", 5]),
  R(["herb_bundle", 3], ["water_jug", 1]), R(["leather_jacket", 1], ["mut_hide2", 1]),
  R(["water_jug", 1]), R(["cloth_roll", 3], ["rotten_meat", 5]), R(["trauma_kit", 1], ["serum", 1]), R(["copper_wire", 2], ["mutant_gland", 1]), R(["survivor_badge", 1]),
  R(["stim_shot", 1], ["energy_drink", 2]), R(["steel_plate", 1], ["mutant_gland", 2]), R(["soup", 3], ["rotten_meat", 6]), R(["battery_pack", 1], ["serum", 1]), R(["hunter_cloak", 1], ["mut_nose3", 1]),
  R(["medkit", 2], ["serum", 2]), R(["gunpowder", 2], ["mutant_gland", 2]), R(["antidote", 2], ["rotten_meat", 8]), R(["circuit_board", 1], ["serum", 2]), R(["gold_watch", 1]),
  R(["trauma_kit", 2], ["serum", 3]), R(["chem_catalyst", 2], ["mutant_gland", 3]), R(["army_meal", 3], ["rotten_meat", 10]), R(["data_chip", 1], ["mutant_gland", 3]), R(["kevlar_vest", 1], ["mut_hide3", 1])
];

const dayIdx = (now) => Math.floor((now + COOP_TZ) / DAY);
const seaIdx = (now) => Math.max(0, Math.floor((dayIdx(now) - SEA_EPOCH) / SEA_LEN));
const weekIdx = (now) => Math.floor((dayIdx(now) - SEA_EPOCH) / 7);
const dayEnd = (now) => (dayIdx(now) + 1) * DAY - COOP_TZ;
const weekEnd = (now) => (SEA_EPOCH + (weekIdx(now) + 1) * 7) * DAY - COOP_TZ;
const seaEnd = (now) => (SEA_EPOCH + (seaIdx(now) + 1) * SEA_LEN) * DAY - COOP_TZ;

function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// เลือก n ภารกิจจากพูล: ตัวนับไม่ซ้ำกัน และกรองตามฝ่าย (ผลลัพธ์เหมือนกันทุกครั้งสำหรับช่วงเดียวกัน)
function pick(list, n, seed, faction) {
  const r = rng(seed), f = faction === "zombie" ? "z" : "h", pool = list.filter((m) => !m[4] || m[4] === f);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = [], used = new Set();
  for (const m of pool) { if (out.length >= n) break; if (used.has(m[1])) continue; used.add(m[1]); out.push(m[0]); }
  return out;
}

const { fail, withLock, addItem } = require("./lib");

// เพิ่มของแบบไม่ให้ทะลุเพดาน 99 ต่อช่อง (rules ฝั่งกระเป๋า) — เต็มแล้วไม่ให้รับ (ไม่เสียรางวัล)
async function addCapped(db, uid, id, qty) {
  const res = await db.ref(`inventory/${uid}/${id}`).transaction((cur) => {
    if (!cur) return { id, qty };
    if (cur.id !== id || !(cur.qty > 0) || cur.qty + qty > 99) return undefined;
    return { ...cur, qty: cur.qty + qty };
  });
  return res.committed;
}

function makePass(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "sync";
    return withLock(db, uid, now, async () => {
      const [pS, aS, qS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(`pass/${uid}`).get()]);
      const p = pS.val(), c = aS.val() || {}, ps = qS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human";
      const s = seaIdx(now), di = dayIdx(now), wi = weekIdx(now);
      const upd = {};   // เขียนทีเดียวท้ายคำสั่ง
      let cur = ps.s === s ? ps : { s, xp: 0 };   // ซีซันใหม่ → XP/รางวัลระดับเริ่มใหม่ (ระดับที่ไม่ได้กดรับของซีซันเก่าจะหายไป)
      const mk = (idx, ids) => { const b = {}; ids.forEach((id) => { b[POOL[id].k] = c[POOL[id].k] || 0; }); return { i: idx, m: ids, b, c: {} }; };
      let d = cur.d, w = cur.w, dirty = ps.s !== s;
      if (!d || d.i !== di) { d = mk(di, pick(DAILY, 3, di * 7 + 1, fac)); dirty = true; }
      if (!w || w.i !== wi) { w = mk(wi, pick(WEEKLY, 4, wi * 13 + 5, fac)); dirty = true; }
      d.c = d.c || {}; w.c = w.c || {}; d.b = d.b || {}; w.b = w.b || {};   // อ็อบเจ็กต์ว่างไม่ถูกเก็บใน RTDB → คืนค่าว่างเอง
      cur = { ...cur, d, w, tc: cur.tc || {} };
      const view = (P) => P.m.map((id) => { const m = POOL[id], v = Math.max(0, (c[m.k] || 0) - (P.b[m.k] || 0)); return { id, t: m.t, n: m.n, v: Math.min(v, m.n), xp: m.xp, done: v >= m.n, got: !!P.c[id] }; });
      const save = () => db.ref(`pass/${uid}`).set(cur);

      if (a === "claimMission") {
        const P = data.p === "w" ? w : data.p === "d" ? d : null, id = String(data.id);
        if (!P || !P.m.includes(id)) fail("failed-precondition", "ไม่มีภารกิจนี้ในช่วงนี้");
        const m = POOL[id], v = (c[m.k] || 0) - (P.b[m.k] || 0);
        if (P.c[id]) fail("failed-precondition", "รับไปแล้ว");
        if (!(v >= m.n)) fail("failed-precondition", "ภารกิจยังไม่สำเร็จ");
        P.c[id] = 1; cur.xp = Math.min(TIERS * TIER_XP, (cur.xp || 0) + m.xp); dirty = true;
      } else if (a === "claimTier") {
        const t = Number(data.t);
        if (!Number.isInteger(t) || t < 1 || t > TIERS) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
        if ((cur.xp || 0) < t * TIER_XP) fail("failed-precondition", "XP ยังไม่ถึงระดับนี้");
        if (cur.tc[t]) fail("failed-precondition", "รับไปแล้ว");
        const rw = TIER_REW[t - 1][fac === "zombie" ? "z" : "h"];
        for (const [id] of rw) { const slot = (await db.ref(`inventory/${uid}/${id}`).get()).val(); if (slot && slot.id !== id) fail("failed-precondition", "ช่องกระเป๋านี้ใช้ไม่ได้"); }
        cur.tc[t] = 1; await save();   // ตีตราว่ารับแล้วก่อนแจกของ (ถ้าแจกไม่สำเร็จจะถอนตรากลับ)
        const done = [];
        for (const [id, q] of rw) {
          if (!(await addCapped(db, uid, id, q))) {
            for (const [rid, rq] of done) { await db.ref(`inventory/${uid}/${rid}`).transaction((x) => (x && x.qty > rq ? { ...x, qty: x.qty - rq } : null)); }
            delete cur.tc[t]; await save();
            fail("failed-precondition", "กระเป๋าช่องนั้นเต็ม (99 ชิ้น) — เคลียร์พื้นที่แล้วลองใหม่");
          }
          done.push([id, q]);
        }
        dirty = false;
        return finish({ rewarded: rw });
      } else if (a !== "sync") fail("invalid-argument", "ไม่รู้จักคำสั่ง");

      if (dirty) await save();
      return finish();

      function finish(extra) {
        return Object.assign({
          ok: true, s, xp: cur.xp || 0, tierXp: TIER_XP, tiers: TIERS, tc: cur.tc,
          rew: TIER_REW.map((r) => r[fac === "zombie" ? "z" : "h"]),
          d: view(cur.d), w: view(cur.w), dEnd: dayEnd(now), wEnd: weekEnd(now), sEnd: seaEnd(now)
        }, extra || {});
      }
    });
  }
  return { run };
}

module.exports = { makePass, POOL, DAILY, WEEKLY, TIER_REW, TIER_XP, TIERS, pick, seaIdx, dayIdx, weekIdx };
