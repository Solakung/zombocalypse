// 📖 สมุดสะสมแบบมีชุด + 🏅 ความสมบูรณ์ของผู้รอดชีวิต (เป้าหมายยาวประจำบัญชี)
// - ชุดสะสม: ครบทุกชิ้นในชุด → รับรางวัลได้ครั้งเดียวต่อชุด • ความคืบหน้าของไอเทม/โซน/เทศกาลที่เคยพบ ไคลเอนต์ส่งมาซิงก์ (สมุดสะสมเดิมเก็บในเครื่อง)
// - ความสมบูรณ์ % = ค่าเฉลี่ยของ (ความคืบหน้าทุกชุด + เหตุการณ์สำคัญ 12 ข้อจากตัวนับความสำเร็จ) → รางวัลที่ 25/50/75/100%
// โหนด col/{uid} ไม่มีใน rules (ฟังก์ชันเท่านั้น) • ข้อจำกัดที่ยอมรับ: ข้อมูลที่ไคลเอนต์ซิงก์ปลอมได้ รางวัลจึงเป็นของพื้นฐาน/ครั้งเดียวต่อชุด
const { fail, withLock, grantAll } = require("./lib");

const ZONES = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
// kind: i = ไอเทมที่เคยพบ, z = โซนที่เคยไป, c = พืชที่เคยเก็บเกี่ยว • f: ฝ่าย (h/z/ว่าง = ทุกฝ่าย)
const SETS = [
  { id: "medic", icon: "🩹", n: "ชุดแพทย์สนาม", k: "i", ids: ["bandage", "medkit", "trauma_kit", "antidote", "serum", "stim_shot"], r: [["medkit", 2], ["trauma_kit", 1]] },
  { id: "kitchen", icon: "🍲", n: "เสบียงครัวกลาง", k: "i", ids: ["canned_food", "bread", "fruit", "soup", "army_meal", "fish_grill", "fish_stew", "choco_bar"], r: [["army_meal", 3], ["soup", 3]] },
  { id: "armor", icon: "🛡️", n: "ตู้เสื้อผ้านักป้องกัน", k: "i", ids: ["rag_vest", "scrap_plate", "riot_vest", "army_vest", "cardboard_armor", "leather_jacket", "hunter_cloak", "welder_apron", "diver_suit", "hazmat_suit", "kevlar_vest", "bomb_suit"], f: "h", r: [["steel_plate", 3], ["trauma_kit", 2]] },
  { id: "tools", icon: "🧰", n: "กล่องช่างซ่อม", k: "i", ids: ["scrap", "chem", "duct_tape", "rusty_nails", "cloth_roll", "rope_coil", "copper_wire", "leather_scrap", "fuel_can", "gunpowder", "steel_plate", "battery_pack", "circuit_board", "chem_catalyst"], r: [["circuit_board", 2], ["chem_catalyst", 2]] },
  { id: "lab", icon: "🔬", n: "แฟ้มนักวิจัย", k: "i", ids: ["lab_sample", "dna_frag", "lab_core", "data_chip", "exp_serum", "lab_coat", "bio_lens", "chem_gloves"], r: [["lab_core", 1], ["serum", 2]] },
  { id: "gadget", icon: "🎒", n: "ของเสริมติดตัว", k: "i", ids: ["compass", "earplugs", "survival_bracelet", "rabbit_foot", "lucky_coin", "respirator", "night_goggles", "tactical_radio", "gas_mask", "headlamp", "toolkit", "lucky_charm"], f: "h", r: [["battery_pack", 2], ["survivor_badge", 1]] },
  { id: "keepsake", icon: "🎖️", n: "ของที่ระลึก", k: "i", ids: ["survivor_badge", "old_photo", "gold_watch", "boss_trophy", "lab_keycard"], r: [["lab_core", 1], ["data_chip", 1]] },
  { id: "fangs", icon: "🦷", n: "คอลเลกชันเขี้ยว", k: "i", ids: ["mut_fang1", "mut_fang2", "mut_fang3", "mut_fang4", "mut_fang5", "mut_fang6"], f: "z", r: [["mutant_gland", 3], ["serum", 2]] },
  { id: "hides", icon: "🐢", n: "คอลเลกชันหนัง", k: "i", ids: ["mut_hide1", "mut_hide2", "mut_hide3", "mut_hide4", "mut_hide5"], f: "z", r: [["mutant_gland", 3], ["serum", 2]] },
  { id: "noses", icon: "👃", n: "คอลเลกชันจมูก", k: "i", ids: ["mut_nose1", "mut_nose2", "mut_nose3", "mut_nose4"], f: "z", r: [["mutant_gland", 2], ["serum", 2]] },
  { id: "zones", icon: "🗺️", n: "นักสำรวจเมืองร้าง", k: "z", ids: ZONES, r: [["canned_food", 3], ["water", 3], ["survivor_badge", 1]] },
  { id: "garden", icon: "🌱", n: "ผู้เก็บเกี่ยวครบสวน", k: "c", ids: ["herb", "mossb", "tomato", "wheat", "pumpkin", "aloe", "shroom", "glow"], f: "h", r: [["seed_glow", 3], ["seed_shroom", 3], ["serum", 2]] },
  { id: "rot", icon: "🍄", n: "ผู้เก็บเกี่ยวครบรัง", k: "c", ids: ["fungus", "maggot", "bog", "bloodroot"], f: "z", r: [["seed_bloodroot", 3], ["seed_maggot", 3], ["mutant_gland", 3]] }
];
// เหตุการณ์สำคัญ (ความสมบูรณ์): [ตัวนับ ach, เป้าหมาย, ข้อความ, ฝ่าย]
const MILES = [
  ["srch", 1000, "🔍 ค้นหาของ 1,000 ครั้ง"], ["found", 800, "🎒 เจอของ 800 ชิ้น"], ["zwin", 300, "⚔️ ชนะซอมบี้ 300 ครั้ง", "h"], ["bite", 150, "🦷 กัดเหยื่อ 150 ครั้ง", "z"],
  ["boss", 30, "👹 ชนะมินิบอส 30 ครั้ง"], ["craft", 100, "🔧 คราฟต์ 100 ชิ้น", "h"], ["enc", 50, "🎭 ผ่านเหตุการณ์สุ่ม 50 ครั้ง"], ["nemk", 10, "👹 ล้มศัตรูคู่อาฆาต 10 ครั้ง"],
  ["dive", 20, "🕳️ ดิ่งลึก 20 รอบ"], ["radio", 3, "📻 ไขปริศนาวิทยุ 3 สัปดาห์"], ["gard", 100, "🌱 เก็บเกี่ยวจากแปลง 100 แปลง"], ["cbuy", 10, "🐪 ซื้อจากพ่อค้าเร่ 10 ครั้ง"],
  ["petc", 25, "🐾 รับของจากสัตว์เลี้ยง 25 ครั้ง"], ["mkt", 60, "🏪 ซื้อ/ขายในตลาด 60 ครั้ง"]
];
const REWARDS = [
  { p: 25, r: [["medkit", 2], ["army_meal", 2], ["seed_herb", 3]], rz: [["serum", 1], ["rotten_meat", 6], ["seed_fungus", 3]] },
  { p: 50, r: [["trauma_kit", 2], ["steel_plate", 2], ["survivor_badge", 1]], rz: [["serum", 2], ["mutant_gland", 2], ["survivor_badge", 1]] },
  { p: 75, r: [["circuit_board", 2], ["chem_catalyst", 2], ["lab_core", 1]], rz: [["mutant_gland", 3], ["chem_catalyst", 2], ["lab_core", 1]] },
  { p: 100, r: [["boss_trophy", 1], ["gold_watch", 1], ["lab_core", 2], ["data_chip", 2], ["deco_medal", 1]], rz: [["boss_trophy", 1], ["gold_watch", 1], ["mutant_gland", 5], ["lab_core", 2], ["deco_medal", 1]] }
];
const OK_ID = /^[a-z0-9_]{2,24}$/;
const MAXSYNC = 400;

function makeCol(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS, cS, aS, hS, dS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`col/${uid}`).get(), db.ref(`ach/${uid}/c`).get(), db.ref(`garden/${uid}/h`).get(), db.ref(`dive2/${uid}`).get()]);
      const p = pS.val(), c = cS.val() || {}, ach = aS.val() || {}, hv = hS.val() || {}, dv = dS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fk = p.faction === "zombie" ? "z" : "h";
      const seen = { i: c.i || {}, z: c.z || {}, c: Object.fromEntries(Object.keys(hv).map((k) => [k, 1])) };

      if (a === "sync") {   // ไคลเอนต์ส่งรายการที่เคยพบ (สมุดสะสมในเครื่อง) มารวม — เพิ่มได้อย่างเดียว
        const up = {};
        for (const [kind, key, list] of [["i", "i", data.i], ["z", "z", data.z]]) {
          if (!Array.isArray(list)) continue;
          for (const id of list.slice(0, MAXSYNC)) {
            if (typeof id !== "string" || !OK_ID.test(id) || seen[kind][id]) continue;
            if (kind === "z" && !ZONES.includes(id)) continue;
            if (Object.keys(seen[kind]).length >= MAXSYNC) break;
            seen[kind][id] = 1; up[`${key}/${id}`] = 1;
          }
        }
        if (Object.keys(up).length) await db.ref(`col/${uid}`).update(up);
      }
      const cl = c.cl || {};
      const sets = SETS.filter((s) => !s.f || s.f === fk).map((s) => {
        const have = s.ids.filter((id) => seen[s.k][id]);
        return { id: s.id, icon: s.icon, n: s.n, k: s.k, total: s.ids.length, have: have.length, miss: s.ids.filter((id) => !seen[s.k][id]), done: have.length === s.ids.length, got: !!cl[s.id], rew: s.r };
      });
      const miles = MILES.filter((m) => !m[3] || m[3] === fk).map(([k, n, t]) => {
        const v = k === "dive" ? Math.max(Number(ach.dive) || 0, 0) : Number(ach[k]) || 0;
        return { k, n, t, v: Math.min(v, n) };
      });
      const parts = sets.map((s) => s.have / s.total).concat(miles.map((m) => m.v / m.n));
      const pct = Math.min(100, Math.floor((parts.reduce((x, y) => x + y, 0) / parts.length) * 100));
      const view = (extra) => Object.assign({ ok: true, pct, sets, miles, rewards: REWARDS.map((r) => ({ p: r.p, ok: pct >= r.p, got: !!cl["m" + r.p], rew: fk === "z" ? r.rz : r.r })), done: sets.filter((s) => s.done).length }, extra || {});
      if (a === "state" || a === "sync") return view();

      if (a === "claim") {
        const key = String(data.k || "");
        let rew;
        if (/^m(25|50|75|100)$/.test(key)) {
          const r = REWARDS.find((x) => "m" + x.p === key);
          if (pct < r.p) fail("failed-precondition", "ความสมบูรณ์ยังไม่ถึง " + r.p + "%");
          rew = fk === "z" ? r.rz : r.r;
        } else {
          const s = sets.find((x) => x.id === key);
          if (!s) fail("invalid-argument", "ไม่มีชุดนี้");
          if (!s.done) fail("failed-precondition", "ยังเก็บไม่ครบชุด");
          rew = s.rew;
        }
        if (cl[key]) fail("failed-precondition", "รับไปแล้ว");
        await db.ref(`col/${uid}/cl/${key}`).set(now);
        if (!(await grantAll(db, uid, rew))) { await db.ref(`col/${uid}/cl/${key}`).remove(); fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วลองใหม่"); }
        cl[key] = now;
        return Object.assign(view(), { rewarded: rew, rewards: REWARDS.map((r) => ({ p: r.p, ok: pct >= r.p, got: !!cl["m" + r.p], rew: fk === "z" ? r.rz : r.r })), sets: sets.map((s) => ({ ...s, got: !!cl[s.id] })) });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeCol, SETS, MILES, REWARDS };
