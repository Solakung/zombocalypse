// 🕳️ ดิ่งลึก (Roguelike Run): ลงชั้นใต้ดินของอุโมงค์/ห้องแล็บทีละชั้น เลือกทางเสี่ยงโชค — ของที่เก็บได้ "ยังไม่ปลอดภัย" จนกว่าจะขึ้นจากหลุม
// สถานะรอบเล่นอยู่ที่ dive/{uid} (ของที่เก็บถูกเก็บในโหนดนี้ ไม่ใช่กระเป๋า จนกว่าจะ cashout) • ไม่มีใน rules → เขียนได้เฉพาะฟังก์ชันนี้
// หมดสติ (เสถียรภาพ 0) = เสียของทั้งรอบ + เสีย HP จริงเล็กน้อย (ไม่ต่ำกว่า 1) • ไม่แตะหิว/น้ำ/พลังงาน
const { fail, withLock, takeItem, grantAll, dayIdx, dayEnd } = require("./lib");

const MAX_FLOOR = 12, REST_EVERY = 4, DAY_CAP = 6, COOLDOWN = 5 * 60000, ENTRY = { human: ["scrap", 2], zombie: ["rotten_meat", 2] };
const ZONES_OK = ["tunnel", "lab"];
const STAB0 = 100;
// ประเภทตัวเลือก: p0 = โอกาสสำเร็จเริ่มต้น, pd = ลดต่อชั้น, loot = ตัวคูณจำนวนม้วนของ, loss = เสียเสถียรภาพเมื่อพลาด
const KINDS = {
  sneak: { icon: "🥷", p0: 0.88, pd: 0.015, rolls: 1, loss: 10 },
  search: { icon: "🔦", p0: 0.74, pd: 0.022, rolls: 2, loss: 20 },
  fight: { icon: "⚔️", p0: 0.58, pd: 0.03, rolls: 3, loss: 34 }
};
const TEXT = {
  tunnel: {
    sneak: ["ย่องเลียบผนังอุโมงค์ผ่านเงามืด", "แอบผ่านรางรถไฟที่ปกคลุมด้วยหยากไย่"], search: ["ค้นตู้เก็บของพนักงานสถานี", "สำรวจรถไฟใต้ดินที่จอดทิ้งไว้"], fight: ["บุกเข้าฝูงซากในโบกี้", "ปะทะผู้ครองอุโมงค์ตรงทางแยก"], rest: ["พักที่ห้องควบคุมสัญญาณที่ล็อกจากด้านใน"]
  },
  lab: {
    sneak: ["ย่องผ่านห้องกักตัวที่ไฟกะพริบ", "เลี่ยงเซนเซอร์เก่าตามทางเดิน"], search: ["ค้นตู้เก็บตัวอย่างวิจัย", "เจาะระบบเครื่องเก็บข้อมูลเก่า"], fight: ["บุกห้องทดลองที่ตัวอย่างหลุดออกมา", "ปะทะผู้พิทักษ์ชั้นล่างสุด"], rest: ["พักในห้องปลอดเชื้อที่ยังมีไฟสำรอง"]
  }
};
// พูลของตามความลึก (ทุกรหัสอยู่ใน whitelist กระเป๋า) — [ของ, จำนวนต่อม้วน]
const LOOT = {
  human: {
    1: [["scrap", 3], ["bandage", 1], ["water", 1], ["canned_food", 1], ["rusty_nails", 2], ["duct_tape", 1], ["cloth_roll", 1]],
    2: [["medkit", 1], ["steel_plate", 1], ["copper_wire", 1], ["gunpowder", 1], ["army_meal", 1], ["battery_pack", 1], ["antidote", 1], ["fuel_can", 1]],
    3: [["trauma_kit", 1], ["circuit_board", 1], ["chem_catalyst", 1], ["serum", 1], ["data_chip", 1], ["lab_sample", 1], ["gold_watch", 1], ["survivor_badge", 1]]
  },
  zombie: {
    1: [["rotten_meat", 3], ["moss", 2], ["water", 1], ["rotten_meat", 2], ["energy_drink", 1]],
    2: [["serum", 1], ["mutant_gland", 1], ["chem", 2], ["rotten_meat", 6], ["medkit", 1]],
    3: [["serum", 2], ["mutant_gland", 2], ["chem_catalyst", 1], ["lab_sample", 1], ["survivor_badge", 1]]
  }
};
const tierOf = (fl) => (fl <= 3 ? 1 : fl <= 7 ? 2 : 3);
// รางวัลครั้งแรกที่ลงถึงชั้นนั้น (ครั้งเดียวต่อบัญชี)
const FIRST = { 5: { human: [["steel_plate", 1], ["medkit", 1]], zombie: [["mutant_gland", 1], ["serum", 1]] }, 8: { human: [["circuit_board", 1], ["trauma_kit", 1]], zombie: [["mutant_gland", 2], ["serum", 1]] }, 12: { human: [["gold_watch", 1], ["data_chip", 1], ["lab_core", 1]], zombie: [["mutant_gland", 3], ["serum", 2], ["lab_core", 1]] } };

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const isRest = (fl) => fl % REST_EVERY === 0 && fl < MAX_FLOOR;
function makeOptions(zone, fl) {
  if (isRest(fl)) return [{ k: "rest", icon: "🏕️", l: pick(TEXT[zone].rest) }, { k: "sneak", icon: KINDS.sneak.icon, l: pick(TEXT[zone].sneak) }];
  return ["sneak", "search", "fight"].map((k) => ({ k, icon: KINDS[k].icon, l: pick(TEXT[zone][k]) }));
}
const chance = (k, fl) => Math.max(0.15, KINDS[k].p0 - KINDS[k].pd * (fl - 1));

function makeDive(db) {
  const view = (d, extra) => d ? Object.assign({
    ok: true, on: true, zone: d.zone, fl: d.fl, stab: d.stab, loot: d.loot || [], opts: (d.opts || []).map((o, i) => ({ i, k: o.k, icon: o.icon, l: o.l, p: o.k === "rest" ? null : Math.round(chance(o.k, d.fl) * 100), r: o.k === "rest" ? 0 : KINDS[o.k].rolls })), max: MAX_FLOOR
  }, extra || {}) : Object.assign({ ok: true, on: false }, extra || {});
  const stats = async (uid, now) => {
    const s = (await db.ref(`dive2/${uid}`).get()).val() || {};
    const di = dayIdx(now);
    return { best: s.best || 0, runs: s.dk === di ? s.n || 0 : 0, last: s.last || 0, first: s.first || {}, dk: di };
  };
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, dS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`dive/${uid}`).get()]);
      const p = pS.val(); let d = dS.val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human";
      const st = await stats(uid, now);
      const meta = { best: st.best, runsLeft: Math.max(0, DAY_CAP - st.runs), entry: ENTRY[fac], cd: Math.max(0, st.last + COOLDOWN - now), end: dayEnd(now) };
      const V = (x, e) => view(x, Object.assign({}, meta, e || {}));
      if (a === "state") return V(d);

      if (a === "start") {
        if (d) fail("failed-precondition", "มีรอบที่กำลังดิ่งอยู่แล้ว");
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        if (!ZONES_OK.includes(p.zone)) fail("failed-precondition", "ต้องอยู่ที่อุโมงค์หรือห้องแล็บถึงจะดิ่งลงไปได้");
        if (st.runs >= DAY_CAP) fail("failed-precondition", "วันนี้ดิ่งครบ " + DAY_CAP + " รอบแล้ว");
        if (now - st.last < COOLDOWN) fail("failed-precondition", "พักก่อน ยังดิ่งรอบใหม่ไม่ได้");
        const [id, q] = ENTRY[fac];
        if (!(await takeItem(db, uid, id, q))) fail("failed-precondition", "ต้องมีของสำหรับเตรียมตัว");
        d = { zone: p.zone, fl: 1, stab: STAB0, loot: [], ts: now };
        d.opts = makeOptions(d.zone, 1);
        await db.ref(`dive/${uid}`).set(d);
        await db.ref(`dive2/${uid}`).update({ dk: st.dk, n: st.runs + 1, last: now });
        return V(d, { runsLeft: meta.runsLeft - 1 });
      }
      if (!d) fail("failed-precondition", "ยังไม่ได้เริ่มดิ่ง");

      if (a === "cashout") {
        const loot = d.loot || [];
        if (loot.length && !(await grantAll(db, uid, loot))) fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วขึ้นจากหลุม");
        await db.ref(`dive/${uid}`).remove();
        await db.ref(`dive2/${uid}`).update({ last: now, best: Math.max(st.best, d.fl) });
        return Object.assign({ ok: true, on: false, cashed: loot, fl: d.fl }, meta, { best: Math.max(st.best, d.fl), cd: COOLDOWN });
      }

      if (a === "pick") {
        const i = Number(data.i), o = d.opts && d.opts[i];
        if (!o) fail("invalid-argument", "ตัวเลือกไม่ถูกต้อง");
        let msg, got = null, lost = 0;
        if (o.k === "rest") { d.stab = Math.min(STAB0, d.stab + 30); msg = "คุณพักฟื้นจนเสถียรภาพกลับมา +30"; }
        else {
          const K = KINDS[o.k], ok = Math.random() < chance(o.k, d.fl);
          if (ok) {
            got = []; const pool = LOOT[fac][tierOf(d.fl)];
            for (let r = 0; r < K.rolls; r++) { const [id, q] = pick(pool); const ex = got.find((x) => x[0] === id); if (ex) ex[1] += q; else got.push([id, q]); }
            d.loot = Object.values([...(d.loot || []), ...got].reduce((m, [id, q]) => { (m[id] = m[id] || [id, 0])[1] += q; return m; }, {}));
            msg = o.k === "sneak" ? "ผ่านไปได้เงียบ ๆ และเก็บของได้" : o.k === "search" ? "ค้นเจอของมีประโยชน์" : "ฝ่าฟันสำเร็จ! ได้ของก้อนใหญ่";
          } else { lost = K.loss + Math.floor(d.fl / 2); d.stab -= lost; msg = o.k === "sneak" ? "ถูกจับได้ต้องถอยหนี" : o.k === "search" ? "ค้นผิดที่ ทำให้เกิดเสียงดัง" : "ถูกสวนกลับอย่างหนัก"; }
        }
        if (d.stab <= 0) {   // หมดสติ: เสียของทั้งรอบ + HP จริงลดเล็กน้อย (ไม่ต่ำกว่า 1)
          const lostLoot = d.loot || [], hp0 = Number(p.hp) || 1, hp1 = Math.max(1, hp0 - Math.min(20, hp0 - 1));
          if (hp1 !== hp0) await db.ref(`users/${uid}/hp`).set(hp1);
          await db.ref(`dive/${uid}`).remove(); await db.ref(`dive2/${uid}`).update({ last: now, best: Math.max(st.best, d.fl) });
          return Object.assign({ ok: true, on: false, dead: true, msg: "คุณหมดสติและถูกลากออกมา… ของที่เก็บมาหายไปหมด", lostLoot, hp: hp1 - hp0, fl: d.fl }, meta, { best: Math.max(st.best, d.fl), cd: COOLDOWN });
        }
        // ลงชั้นถัดไป (ชั้นสุดท้ายสำเร็จ = เคลียร์)
        let first = null;
        if (d.fl >= MAX_FLOOR) {
          const loot = d.loot || [], bonus = [["survivor_badge", 1]];
          if (!(await grantAll(db, uid, loot.concat(bonus)))) fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วลองใหม่");
          await db.ref(`dive/${uid}`).remove(); await db.ref(`dive2/${uid}`).update({ last: now, best: MAX_FLOOR });
          return Object.assign({ ok: true, on: false, cleared: true, msg: "คุณฝ่าถึงชั้นล่างสุดและกลับขึ้นมาได้!", cashed: loot.concat(bonus), fl: d.fl }, meta, { best: MAX_FLOOR, cd: COOLDOWN });
        }
        d.fl += 1;
        if (FIRST[d.fl] && !st.first[d.fl]) {
          if (await grantAll(db, uid, FIRST[d.fl][fac])) { first = FIRST[d.fl][fac]; await db.ref(`dive2/${uid}/first/${d.fl}`).set(1); await db.ref(`dive2/${uid}`).update({ best: Math.max(st.best, d.fl) }); }
        }
        d.opts = makeOptions(d.zone, d.fl);
        await db.ref(`dive/${uid}`).set(d);
        return V(d, { msg, got, lost, firstReward: first, best: Math.max(st.best, d.fl) });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeDive, KINDS, LOOT, FIRST, MAX_FLOOR, chance, tierOf, ENTRY };
