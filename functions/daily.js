// 🎁 หีบรายวัน (Daily crate) + 🎯 ล่าค่าหัวประจำวัน (Bounty hunt)
// โหนด crate/{uid}, hunt/{uid} อยู่นอก rules → เขียนได้เฉพาะฟังก์ชันนี้
const { fail, withLock, grantAll, dayIdx, dayEnd, rng } = require("./lib");

// ---------- หีบรายวัน ----------
// streak นับวันติดกัน (เวลาไทย) วนรอบ 7 วัน: วันที่ 7 การันตีของหายาก
const CRATE = {
  human: {
    c: [["water", 2], ["bandage", 2], ["scrap", 4], ["canned_food", 2], ["energy_drink", 1], ["herb_bundle", 2], ["duct_tape", 2], ["rusty_nails", 3], ["moss", 3], ["cloth_roll", 2]],
    u: [["medkit", 1], ["army_meal", 1], ["stim_shot", 1], ["steel_plate", 1], ["copper_wire", 2], ["battery_pack", 1], ["antidote", 1], ["gunpowder", 2], ["fuel_can", 1], ["seed_aloe", 2], ["seed_wheat", 2], ["seed_pumpkin", 1]],
    r: [["trauma_kit", 1], ["serum", 2], ["chem_catalyst", 2], ["circuit_board", 1], ["survivor_badge", 1], ["gold_watch", 1], ["data_chip", 1], ["seed_shroom", 1], ["seed_glow", 1]]
  },
  zombie: {
    c: [["rotten_meat", 3], ["moss", 3], ["water", 2], ["rotten_meat", 4], ["energy_drink", 1]],
    u: [["serum", 1], ["mutant_gland", 1], ["chem", 3], ["rotten_meat", 7], ["medkit", 1], ["seed_maggot", 2]],
    r: [["serum", 2], ["mutant_gland", 2], ["chem_catalyst", 2], ["survivor_badge", 1], ["trauma_kit", 1], ["seed_bloodroot", 1]]
  }
};
const crateTier = (day, rand) => { if (day >= 7) return "r"; const rare = 0.03 + 0.03 * day, unc = 0.25 + 0.03 * day, x = rand(); return x < rare ? "r" : x < rare + unc ? "u" : "c"; };

// ---------- ล่าค่าหัว ----------
// มนุษย์: ชนะซอมบี้ N ครั้ง "ในโซนเป้าหมาย" (ตัวนับ ach hw<โซน> ที่เกมบวกให้) • ซอมบี้: กัดเหยื่อ N ครั้ง (ตัวนับ bite)
const ZONES = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
const HUNT_N = { ruins: 4, mall: 4, hospital: 5, police: 5, forest: 5, factory: 6, port: 6, base: 6, tunnel: 7, lab: 8 };
const HUNT_NAME = { ruins: "ซากตะกายกำแพง", mall: "ผู้จัดการห้างผีสิง", hospital: "พยาบาลไร้วิญญาณ", police: "สารวัตรมรณะ", forest: "เจ้าป่าเน่าเฟะ", factory: "หัวหน้าไลน์ผลิตซาก", port: "กัปตันจมน้ำ", base: "จ่าฝูงนายทหารซอมบี้", tunnel: "ผู้ครองอุโมงค์มืด", lab: "ตัวอย่างหมายเลขศูนย์" };
const HUNT_REW = {
  ruins: [["scrap", 6], ["bandage", 2]], mall: [["energy_drink", 2], ["cloth_roll", 2]], hospital: [["medkit", 1], ["antidote", 1]], police: [["gunpowder", 2], ["steel_plate", 1]],
  forest: [["herb_bundle", 3], ["fish_stew", 1], ["seed_aloe", 1]], factory: [["copper_wire", 2], ["battery_pack", 1]], port: [["fuel_can", 1], ["rope_coil", 2]], base: [["army_meal", 1], ["stim_shot", 1]],
  tunnel: [["circuit_board", 1], ["chem_catalyst", 1]], lab: [["lab_core", 1], ["data_chip", 1]]
};
const HUNT_Z = { n: 4, name: "เหยื่อสดตัวเด่น", rew: [["mutant_gland", 1], ["serum", 1], ["rotten_meat", 4]] };
const huntKey = (zone) => "hw" + zone;   // ≤10 ตัวอักษร ตามรูปแบบคีย์ ach

function makeDaily(db) {
  async function loadUser(uid) {
    const p = (await db.ref(`users/${uid}`).get()).val();
    if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    return p;
  }
  const huntTarget = (di, fac) => {
    if (fac === "zombie") return { zone: null, k: "bite", n: HUNT_Z.n, name: HUNT_Z.name, rew: HUNT_Z.rew };
    const zone = ZONES[Math.floor(rng(di * 31 + 7)() * ZONES.length)];
    return { zone, k: huntKey(zone), n: HUNT_N[zone], name: HUNT_NAME[zone], rew: HUNT_REW[zone] };
  };

  async function crate(uid, data, now) {
    const a = (data && data.a) || "state", p = await loadUser(uid), fac = p.faction === "zombie" ? "zombie" : "human", di = dayIdx(now);
    const cs = (await db.ref(`crate/${uid}`).get()).val() || {};
    const streakNow = cs.d === di ? cs.st || 1 : cs.d === di - 1 ? cs.st || 0 : 0;   // streak ที่ยังไม่รวมวันนี้ (ถ้ายังไม่เปิด)
    const claimed = cs.d === di, nextDay = claimed ? ((cs.st - 1) % 7) + 1 : (streakNow % 7) + 1;
    const view = (extra) => Object.assign({ ok: true, claimed, st: claimed ? cs.st : streakNow, day: nextDay, end: dayEnd(now) }, extra || {});
    if (a === "state") return view();
    if (a !== "open") fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    if (claimed) fail("failed-precondition", "วันนี้เปิดหีบไปแล้ว");
    if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
    const st = streakNow + 1, day = ((st - 1) % 7) + 1, rand = Math.random;
    // สุ่มระดับ แล้วลองของในระดับนั้นจนกว่าช่องกระเป๋าจะรับได้ (เต็มหมด → ไม่หักสิทธิ์วันนี้)
    const tier = crateTier(day, rand), order = tier === "r" ? ["r", "u", "c"] : tier === "u" ? ["u", "c"] : ["c"];
    let got = null, gotTier = null;
    for (const t of order) {
      const pool = CRATE[fac][t].slice();
      while (pool.length && !got) { const i = Math.floor(rand() * pool.length), it = pool.splice(i, 1)[0]; if (await grantAll(db, uid, [it])) { got = it; gotTier = t; } }
      if (got) break;
    }
    if (!got) fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วเปิดหีบอีกครั้ง");
    // วันที่ 7 ของรอบได้ของแถมเล็ก ๆ
    let bonus = null;
    if (day === 7) { const b = fac === "zombie" ? ["rotten_meat", 5] : ["canned_food", 3]; if (await grantAll(db, uid, [b])) bonus = b; }
    await db.ref(`crate/${uid}`).set({ d: di, st, ts: now });
    cs.d = di; cs.st = st;
    return Object.assign(view(), { claimed: true, st, got, tier: gotTier, bonus, day });
  }

  async function hunt(uid, data, now) {
    const a = (data && data.a) || "state", p = await loadUser(uid), fac = p.faction === "zombie" ? "zombie" : "human", di = dayIdx(now);
    const [hS, cS] = await Promise.all([db.ref(`hunt/${uid}`).get(), db.ref(`ach/${uid}/c`).get()]);
    let h = hS.val(); const c = cS.val() || {};
    const T = huntTarget(di, fac);
    if (!h || h.d !== di || h.k !== T.k) h = null;   // ของวันก่อน/เปลี่ยนฝ่าย → ไม่นับ
    const prog = h ? Math.max(0, (c[h.k] || 0) - h.b) : 0;
    const view = () => ({ ok: true, name: T.name, zone: T.zone, n: T.n, rew: T.rew, acc: !!h, v: Math.min(prog, T.n), done: !!h && prog >= T.n, got: !!(h && h.cl), end: dayEnd(now) });
    if (a === "state") return view();
    if (a === "accept") {
      if (h) return view();
      h = { d: di, k: T.k, b: c[T.k] || 0 }; await db.ref(`hunt/${uid}`).set(h); return view();
    }
    if (a === "claim") {
      if (!h) fail("failed-precondition", "ยังไม่ได้รับค่าหัววันนี้");
      if (h.cl) fail("failed-precondition", "รับรางวัลไปแล้ว");
      if (!(prog >= T.n)) fail("failed-precondition", "ยังล่าไม่ครบ");
      h.cl = 1; await db.ref(`hunt/${uid}/cl`).set(1);   // ตีตราก่อนแจก แล้วถอนกลับถ้าแจกไม่สำเร็จ
      if (!(await grantAll(db, uid, T.rew))) { await db.ref(`hunt/${uid}/cl`).remove(); fail("failed-precondition", "ช่องกระเป๋าเต็ม — เคลียร์ของก่อนแล้วลองใหม่"); }
      return Object.assign(view(), { rewarded: T.rew });
    }
    fail("invalid-argument", "ไม่รู้จักคำสั่ง");
  }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const sys = data && data.s;
    return withLock(db, uid, now, async () => {
      if (sys === "crate") return crate(uid, data, now);
      if (sys === "hunt") return hunt(uid, data, now);
      fail("invalid-argument", "ไม่รู้จักระบบ");
    });
  }
  return { run };
}

module.exports = { makeDaily, CRATE, HUNT_REW, HUNT_Z, HUNT_N, ZONES, crateTier };
