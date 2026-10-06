// 👹 ศัตรูคู่อาฆาต (Nemesis): ซอมบี้/นักล่าที่มีชื่อ จำผู้เล่นได้ ยิ่งเจอยิ่งแข็งแกร่ง โผล่ระหว่างค้นหานอก Safe Zone
// สถานะต่อผู้เล่นที่ nem/{uid} (ไม่มีใน rules) • เซิร์ฟเวอร์ทอยผลทั้งหมด • HP ไม่ต่ำกว่า 1 • ไม่แตะหิว/น้ำ/พลังงาน
const { fail, withLock, takeItem, grantAll } = require("./lib");

const CHANCE = 0.035, COOLDOWN = 20 * 60000, EXPIRE = 30 * 60000, ROLL_GAP = 7000, MAXLV = 8, HP_CAP = 100;
const PRE = ["เขี้ยว", "กรงเล็บ", "เงา", "ฟันเลื่อย", "เหล็กไน", "หนังเหนียว", "ตาแดง", "ลมหายใจเน่า", "โซ่ตรวน", "หน้ากาก"];
const SUF = ["ดำ", "เลือดเดือด", "แห่งซอก", "ผู้เศร้า", "เฒ่า", "ไร้เสียง", "คลั่ง", "ผู้หิวโหย", "ใต้ดิน", "กระดูกร้าว"];
const HUNTER_PRE = ["นักล่า", "มือปืน", "ผู้ไล่ล่า", "เพชฌฆาต", "ผู้ปราบ"], HUNTER_SUF = ["สีเทา", "ตาเหยี่ยว", "ใจเหี้ยม", "ไร้ปราณี", "แห่งเขตตะวันตก"];
// นิสัย: weak = ของที่ใช้เล่นงานจุดอ่อนได้ (โอกาสชนะ +35%)
const TRAITS = [
  { id: "noise", t: "กลัวเสียงดัง", weak: ["gunpowder", 1], tip: "ยิงไฟหรือจุดประทัดไล่มัน" },
  { id: "fire", t: "กลัวไฟ", weak: ["fuel_can", 1], tip: "จุดไฟขวางทางมัน" },
  { id: "greed", t: "ตะกละ", weak: ["canned_food", 2], tip: "ล่อมันด้วยอาหาร" },
  { id: "wound", t: "บาดแผลเก่า", weak: ["bandage", 2], tip: "เล่นงานจุดอ่อนที่บาดเจ็บ" },
  { id: "metal", t: "เกลียดโลหะ", weak: ["steel_plate", 1], tip: "ใช้แผ่นเหล็กกั้นและโจมตีพร้อมกัน" },
  { id: "chem", t: "แพ้สารเคมี", weak: ["chem", 2], tip: "สาดสารเคมีใส่มัน" }
];
const ZH = { weak: ["rotten_meat", 3], tip: "ล่อด้วยเหยื่อสด" };   // นักล่า (ผู้เล่นซอมบี้) ใช้ของเดียวกันทุกนิสัย
const TRAP = ["scrap", 3];
const LOOT = { human: [["canned_food", 3], ["medkit", 1], ["steel_plate", 1], ["copper_wire", 2], ["army_meal", 1], ["antidote", 1], ["gunpowder", 2]], zombie: [["serum", 1], ["mutant_gland", 1], ["chem", 3], ["rotten_meat", 6]] };
const LOOT_RARE = { human: [["circuit_board", 1], ["trauma_kit", 1], ["lab_sample", 1], ["gold_watch", 1], ["data_chip", 1]], zombie: [["mutant_gland", 2], ["serum", 2], ["chem_catalyst", 1], ["lab_sample", 1]] };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ROUTE = {   // ตัวเลือก → ฐานโอกาสชนะ (ก่อนหักเลเวล)
  fight: { l: "สู้ตรง ๆ", base: 0.5 },
  trap: { l: "วางกับดัก (ใช้เศษวัสดุ 3)", base: 0.62, cost: TRAP, faction: "human" },
  weak: { l: "เล่นงานจุดอ่อน", base: 0.82, faction: null },
  flee: { l: "หนี", base: 0.7 }
};
const winP = (lv, k, wb) => Math.min(0.95, Math.max(0.12, ROUTE[k].base - (k === "flee" ? 0.04 : 0.055) * (lv - 1) + (k === "flee" ? 0 : (wb || 0) * 0.06)));
const create = (fac, lv = 1) => {
  const hunter = fac === "zombie", t = pick(TRAITS);
  return { name: hunter ? pick(HUNTER_PRE) + pick(HUNTER_SUF) : pick(PRE) + pick(SUF), trait: t.id, lv, kills: 0, esc: 0 };
};
const traitOf = (n, fac) => (fac === "zombie" ? { ...TRAITS.find((t) => t.id === n.trait), weak: ZH.weak, tip: ZH.tip } : TRAITS.find((t) => t.id === n.trait));

function makeNemesis(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "peek";
    return withLock(db, uid, now, async () => {
      const [pS, nS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`nem/${uid}`).get()]);
      const p = pS.val(), n = nS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human", ref = db.ref(`nem/${uid}`);
      const pend = n.cur && n.at && now - n.at < EXPIRE ? n.cur : null;
      const view = (c) => { const t = traitOf(c, fac); return { name: c.name, lv: c.lv, kills: c.kills, esc: c.esc, trait: t.t, tip: t.tip, weak: t.weak, opts: ["fight", "trap", "weak", "flee"].filter((k) => !ROUTE[k].faction || ROUTE[k].faction === fac).map((k) => ({ k, l: ROUTE[k].l, p: Math.round(winP(c.lv, k, 0) * 100), need: k === "trap" ? TRAP : k === "weak" ? t.weak : null })) }; };
      const prof = (c) => ({ name: c.name, lv: c.lv, kills: c.kills, esc: c.esc });
      if (a === "peek") return { ok: true, nem: pend ? view(pend) : null, history: n.h ? prof(n.h) : null };

      if (a === "roll") {
        if (pend) return { ok: true, nem: view(pend) };
        if (!(p.hp > 0) || p.zone === "safe" || !p.zone) return { ok: true, nem: null };
        if (now - (n.rt || 0) < ROLL_GAP) return { ok: true, nem: null };
        const nx = { ...n, rt: now };
        if (now - (n.last || 0) < COOLDOWN || Math.random() >= CHANCE) { await ref.set(nx); return { ok: true, nem: null }; }
        const c = n.h && n.h.name ? { ...n.h } : create(fac, n.next || 1);   // ศัตรูเดิมที่ยังหนีรอดอยู่จะกลับมา
        nx.cur = c; nx.at = now; nx.last = now;
        await ref.set(nx);
        return { ok: true, nem: view(c), again: !!(n.h && n.h.name) };
      }

      if (a === "choose") {
        if (!pend) fail("failed-precondition", "ศัตรูหายไปแล้ว");
        const k = String(data.k), R = ROUTE[k], c = pend;
        if (!R || (R.faction && R.faction !== fac)) fail("invalid-argument", "ตัวเลือกไม่ถูกต้อง");
        const t = traitOf(c, fac), paid = k === "trap" ? TRAP : k === "weak" ? t.weak : null;
        if (paid && !(await takeItem(db, uid, paid[0], paid[1]))) fail("failed-precondition", "ของไม่พอสำหรับตัวเลือกนี้");
        const wb = Math.max(0, Math.min(3, Math.floor(Number(data.wb) || 0)));
        const win = Math.random() < winP(c.lv, k, wb);
        const nx = { ...n, rt: now }; delete nx.cur; delete nx.at;
        let res = { ok: true, win, paid, name: c.name, lv: c.lv }, hpD = 0;
        const hurt = async (amt) => { const hp0 = Number(p.hp) || 1, hp1 = Math.max(1, hp0 - amt); hpD = hp1 - hp0; if (hpD) await db.ref(`users/${uid}/hp`).set(hp1); };
        if (k === "flee") {
          if (win) { c.esc += 1; nx.h = c; res.msg = `คุณหนี ${c.name} ไปได้ แต่มันยังจำกลิ่นคุณได้…`; }
          else { await hurt(6 + 2 * c.lv); c.lv = Math.min(MAXLV, c.lv + 1); nx.h = c; res.msg = `${c.name} ตามทันและข่วนคุณก่อนที่คุณจะหนีรอด — มันแข็งแกร่งขึ้น`; }
        } else if (win) {
          const kills = (nx.kills || 0) + 1; nx.kills = kills; c.kills += 1;
          const loot = LOOT[fac].slice().sort(() => Math.random() - 0.5).slice(0, 1 + (c.lv >= 4 ? 1 : 0)).map(([id, q]) => [id, q + Math.floor(c.lv / 3)]);
          if (c.lv >= 3 && Math.random() < 0.15 + 0.07 * c.lv) loot.push(pick(LOOT_RARE[fac]));
          if (c.lv >= 6) loot.push(["boss_trophy", 1]);
          const okGrant = await grantAll(db, uid, loot);
          res.msg = `คุณล้ม ${c.name} (เลเวล ${c.lv}) ได้สำเร็จ!` + (okGrant ? "" : " (กระเป๋าเต็ม — ไม่ได้รับของ)"); res.loot = okGrant ? loot : [];
          delete nx.h;   // ศัตรูตัวใหม่จะเกิดครั้งหน้า (เลเวลเริ่มสูงขึ้นตามจำนวนที่ล้มได้)
          nx.next = Math.min(4, 1 + Math.floor(kills / 3));
        } else {
          await hurt(8 + 4 * c.lv);
          const lostItem = fac === "human" ? ["scrap", 2] : ["rotten_meat", 2];
          const took = await takeItem(db, uid, lostItem[0], lostItem[1]);
          c.lv = Math.min(MAXLV, c.lv + 1); nx.h = c;
          res.msg = `${c.name} ชนะ! คุณบาดเจ็บ${took ? ` และถูกขโมย ${lostItem[0] === "scrap" ? "เศษวัสดุ" : "เนื้อเน่า"} ${lostItem[1]} ชิ้น` : ""} — มันแข็งแกร่งขึ้นเป็นเลเวล ${c.lv}`;
        }
        res.hp = hpD; res.again = !!nx.h;
        await ref.set(nx);
        return res;
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeNemesis, ROUTE, TRAITS, winP, create, LOOT, LOOT_RARE, TRAP, ZH };
