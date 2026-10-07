// 🏹 บอสเผ่ามนุษย์ (สำหรับผู้เล่นฝั่งซอมบี้) — ผู้รอดชีวิตที่ไม่ยอมเข้า Safe Zone ประจำโซน สู้เป็นรอบ: โจมตี / หนี
// - ฝั่งมนุษย์เจอบอสซอมบี้จากการค้นหา; ฝั่งซอมบี้แทบไม่เจอซอมบี้ป่า → ใช้ระบบนี้เป็นคู่เทียบ (โอกาสต่อการค้นหาเท่าตารางบอสฝั่งมนุษย์)
// - ทำที่ฝั่งเซิร์ฟเวอร์ทั้งหมด (สถานะสู้ที่ hboss/{uid} ไม่มีใน rules → เขียนได้เฉพาะฟังก์ชันนี้ • ไม่แก้ rules): ทอยโอกาสเจอ/ทอยโจมตี/ดาเมจ/รางวัล
// - ปิดอยู่ (tune hb_on = 0) เปิดเองเมื่อพร้อม • tune hb_pct = โอกาสเจอเทียบบอสฝั่งมนุษย์ (%; 100 = เท่ากัน ค่าเริ่มต้น)
// - กันสแปมทอยเจอ: ถังโทเค็น 12 ครั้ง เติม 1 ครั้งต่อ 15 วินาที + คูลดาวน์หลังเจอ/สู้จบ 2 นาที (เหมือนบอสฝั่งมนุษย์)
// - ตัวเลขสถานะซอมบี้ (str/hp/agi/tough + วิวัฒนาการ + บัฟ) ต้องตรงกับ script.js / use.js
const crypto = require("crypto");
const { fail, withLock, grantAll } = require("./lib");

const HP_BASE = 100, UNARMED_DMG = 5, DODGE_PER_POINT = 0.03, COOLDOWN = 120000, BURST = 12, REFILL_MS = 15000;
// ★ น้ำหนักเจอ (≈ % ต่อการค้นหา) เท่า BOSS_W ฝั่งมนุษย์ของโซนเดียวกัน — โซนที่ไม่มีเผ่าไม่มีบอส
const W = { forest: 2, police: 4, port: 3, factory: 3, hospital: 3, tunnel: 5 };
// hp เลือด / hits โจมตีต่อรอบ / dmg ช่วงดาเมจ / acc โอกาสโดน / flee โอกาสหนีสำเร็จ
// ★ ตัวเลขเลือด/ดาเมจปรับจากการจำลองสมดุล (เริ่มต้น 7 แต้มชนะป่า/โรงพยาบาลได้ ปลายเกมชนะหมด — เทียบบอสฝั่งมนุษย์) ดู MIGRATION.md
// กลไกเฉพาะเผ่า: shield (โล่ดูดดาเมจก่อน) / pdot (เลือดไหล/ไฟเผา {n รอบ, per ต่อรอบ} หลังโดนโจมตี) / weak (ฉีดยา: โจมตีครั้งถัดไป n ครั้งเหลือ pct%) / heavy (ทุก n รอบตีแรงกว่า ×1.5) / first (ตีก่อนตอนเจอ)
// loot: ได้ 1 ชิ้น [id, จำนวน, น้ำหนัก] • bonus: ของแถม (อาจไม่ได้ id=null) — ทุกรหัสต้องอยู่ใน whitelist กระเป๋าของ rules และใน ITEMS ของ script.js
const BOSSES = {
  forest: { name: "หัวหน้าเผ่านายพราน", icon: "🏹", tag: "นักล่าวางกับดัก — แผลเลือดไหลต่อเนื่อง", hp: 50, hits: 1, dmg: [6, 10], acc: 0.75, flee: 0.45, verb: "ลูกหน้าไม้พุ่งเสียบ", pdot: { n: 2, per: 3, text: "🩸 กับดักบาดแผลเลือดไหล" },
    intro: "เสียงเชือกตึงดังอยู่รอบตัว… ชายหน้าทาสีในชุดหนังสัตว์ยกหน้าไม้เล็งคุณจากเงาไม้ — เขาวางกับดักไว้ทั่วป่าแล้ว!",
    loot: [["rotten_meat", 8, 4], ["mutant_gland", 1, 3], ["mut_nose1", 1, 1]], bonus: [["rotten_meat", 4, 3], ["moss", 1, 3], [null, 0, 2]] },
  police: { name: "หัวหน้าหน่วยปราบจลาจล", icon: "🛡️", tag: "โล่ดูดดาเมจ — ต้องทุบโล่ให้แตกก่อน", hp: 70, hits: 1, dmg: [8, 13], acc: 0.7, flee: 0.5, verb: "กระบองฟาดเข้าอย่างจัง", shield: 25,
    intro: "แนวโล่เคลื่อนมาบังทางเข้าสถานี… ชายในเกราะประยุกต์ถือโล่ที่เชื่อมหนามเหล็ก เขายังมีชีวิตและพร้อมสู้กับพวกคุณ!",
    loot: [["serum", 3, 4], ["trauma_kit", 1, 2], ["mutant_gland", 2, 2], ["mut_hide1", 1, 1]], bonus: [["rotten_meat", 5, 3], [null, 0, 2]] },
  port: { name: "กัปตันโจรสลัดท่าเรือ", icon: "🏴‍☠️", tag: "ทนสูง ตีหนักช้า — ฉมวกกระชากทุก 3 รอบ", hp: 90, hits: 1, dmg: [12, 18], acc: 0.6, flee: 0.6, verb: "ด้ามฉมวกกระแทก", heavy: 3,
    intro: "โซ่เหล็กลากครูดบนท่า… ชายแก่ผ้าคลุมปะชุนชักฉมวกขึ้นพาดบ่า เขารักษาท่าเรือนี้มานานกว่าที่ซอมบี้ตัวแรกจะเกิด!",
    loot: [["rotten_meat", 12, 4], ["mutant_gland", 2, 3], ["gold_watch", 1, 2], ["mut_fang2", 1, 1]], bonus: [["rotten_meat", 5, 3], ["water", 2, 2], [null, 0, 2]] },
  factory: { name: "ช่างเหล็กพ่นไฟ", icon: "🔥", tag: "เปลวไฟเผาต่อเนื่อง — เกราะหนา", hp: 70, hits: 1, dmg: [8, 11], acc: 0.75, flee: 0.5, verb: "เปลวไฟพุ่งใส่", pdot: { n: 2, per: 3, text: "🔥 ไฟลามเผาไหม้" },
    intro: "แสงสีส้มสาดมาจากสายพาน… ชายสวมหน้ากากเชื่อมลากถังเชื้อเพลิงมาพร้อมเครื่องพ่นไฟ ไม่มีใครผ่านโรงงานของเขาได้!",
    loot: [["chem_catalyst", 1, 3], ["mutant_gland", 3, 3], ["mut_hide2", 1, 1]], bonus: [["chem", 3, 3], [null, 0, 2]] },
  hospital: { name: "หมอลัทธิผู้เยียวยา", icon: "💉", tag: "ฉีดยาให้อ่อนแรง — ตีเบาแต่กวนใจ", hp: 60, hits: 1, dmg: [6, 10], acc: 0.8, flee: 0.55, verb: "เข็มฉีดยาปักเข้า", weak: { n: 2, pct: 40, text: "💉 ยาทำให้แขนขาอ่อนแรง" },
    intro: "เสียงสวดมนต์ดังก้องทางเดิน… ชายในเสื้อกาวน์เปื้อนเลือดชูเข็มฉีดยาขนาดใหญ่ — เขาเชื่อว่าซอมบี้ \"รักษาให้หายได้\" ด้วยวิธีของเขา!",
    loot: [["serum", 4, 4], ["antidote", 2, 3], ["lab_sample", 1, 2], ["mut_fang3", 1, 1]], bonus: [["moss", 2, 3], [null, 0, 2]] },
  tunnel: { name: "หัวหน้าเผ่าใต้ดิน", icon: "🔦", tag: "ซุ่มตีก่อน — ตีไวสองครั้งต่อรอบ", hp: 70, hits: 2, dmg: [5, 9], acc: 0.7, flee: 0.4, verb: "หอกเหล็กเส้นแทง", first: true,
    intro: "แสงเรืองสีเขียวแวบผ่านความมืด… ใครบางคนที่มองเห็นในที่มืดโผล่มาข้างหลังคุณก่อนจะทันได้ยินเสียงเท้า!",
    loot: [["mutant_gland", 4, 3], ["lab_sample", 1, 2], ["survivor_badge", 1, 2], ["mut_nose2", 1, 1]], bonus: [["rotten_meat", 6, 3], [null, 0, 2]] }
};

const col = (x) => (x && typeof x === "object" ? x : {});
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

function makeHboss(db, rnd) {
  const rf = rnd || (() => crypto.randomInt(1000000) / 1000000);   // [0,1)
  const ri = (lo, hi) => lo + Math.floor(rf() * (hi - lo + 1));
  const d6 = () => 1 + Math.floor(rf() * 6);
  async function tune(k, d) { const v = (await db.ref(`tune/${k}`).get()).val(); return typeof v === "number" && Number.isFinite(v) ? v : d; }
  const pickW = (list) => { let t = 0; for (const x of list) t += x[2]; let r = rf() * t; for (const x of list) { r -= x[2]; if (r < 0) return x; } return list[list.length - 1]; };

  // สถานะซอมบี้ (ตรงกับ use.js / script.js: evoBonusAt)
  function evoBonus(evo, k) {
    const h = num(evo.h), g = num(evo.g), s = num(evo.s), cap = { str: 2, hp: 4, agi: 4, tough: 2 }; let v = 0;
    if (k === "str") v = (h >= 1 ? 1 : 0) + (h >= 4 ? 1 : 0);
    else if (k === "hp") v = (g >= 1 ? 2 : 0) + (g >= 4 ? 2 : 0) - (s >= 3 ? 2 : s >= 2 ? 1 : 0);
    else if (k === "agi") v = (s >= 1 ? 2 : 0) + (s >= 4 ? 1 : 0) - [0, 1, 2, 3, 3][Math.min(4, Math.max(0, g))];
    else if (k === "tough") v = g >= 1 ? 1 : 0;
    return cap[k] !== undefined ? Math.min(v, cap[k]) : v;
  }
  async function load(uid, now) {
    const [pS, stS, bS, eS, evS, fS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`stats/${uid}`).get(), db.ref(`buffs/${uid}`).get(), db.ref(`effects/${uid}`).get(), db.ref(`evo/${uid}`).get(), db.ref(`hboss/${uid}`).get()]);
    const p = pS.val(), stats = col(stS.val()), buff = bS.val(), effects = col(eS.val()), evo = col(evS.val());
    const buffActive = !!buff && typeof buff.bstart === "number" && buff.bstart + num(buff.mins) * 60000 - 1000 > now;
    const effActive = (t) => { const e = effects[t]; return !!e && typeof e.bstart === "number" && e.bstart + num(e.mins) * 60000 - 1000 > now; };
    const statOf = (k) => num(stats[k]) + (buffActive ? num(buff[k]) : 0) + evoBonus(evo, k);
    return { p, statOf, maxHp: HP_BASE + 10 * statOf("hp"), stunned: effActive("stun"), diceMod: effActive("dice") ? Math.min(0, num(effects.dice.v)) : 0, f: fS.exists() ? col(fS.val()) : {} };
  }
  const fightView = (f) => { const b = BOSSES[f.boss]; return { boss: f.boss, name: b.name, icon: b.icon, tag: b.tag, hp: f.hp, max: f.max, shield: f.shield || 0, shieldMax: b.shield || 0, pdot: f.pdN > 0 ? { n: f.pdN, per: f.pdP } : null, weak: f.wkN > 0 ? { n: f.wkN, pct: b.weak ? b.weak.pct : 0 } : null, round: f.round || 0, art: "hb_" + f.boss }; };

  // บอสโจมตี 1 รอบ: คืน {dmg, lines} (ลดด้วยหลบ agi×3% / ความทน tough ต่อครั้ง) และอัปเดตสถานะสู้ (pdot/weak) ที่ f
  function bossStrike(b, f, ctx) {
    const lines = []; let total = 0, landed = 0;
    const heavy = b.heavy && f.round % b.heavy === 0;
    for (let i = 0; i < b.hits; i++) {
      if (rf() >= b.acc) { lines.push(`${b.name}ฟาดพลาด`); continue; }
      if (rf() < Math.max(0, DODGE_PER_POINT * ctx.statOf("agi"))) { lines.push(`🌀 คุณหลบ${b.verb}ได้`); continue; }
      let dmg = ri(b.dmg[0], b.dmg[1]); if (heavy) dmg = Math.round(dmg * 1.5);
      dmg = Math.max(1, dmg - Math.max(0, ctx.statOf("tough")));
      total += dmg; landed++;
      lines.push(`${heavy ? "⚓ ฉมวกกระชากแรง! " : ""}${b.verb} −${dmg}`);
    }
    if (landed) {
      if (b.pdot) { f.pdN = b.pdot.n; f.pdP = b.pdot.per; lines.push(b.pdot.text); }
      if (b.weak) { f.wkN = b.weak.n; lines.push(b.weak.text + ` (โจมตีถัดไป ${b.weak.n} ครั้งเหลือ ${100 - b.weak.pct}%)`); }
    }
    return { dmg: total, lines };
  }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (!["state", "roll", "attack", "flee", "claim"].includes(a)) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    const on = (await tune("hb_on", 0)) === 1;
    if (a === "state") {
      const fS = await db.ref(`hboss/${uid}`).get(), f = fS.exists() ? col(fS.val()) : {};
      const live = BOSSES[f.boss] && typeof f.hp === "number";
      return { ok: true, on, fight: live ? fightView(f) : null };
    }
    if (!on && a === "roll") return { ok: true, on: false, hit: false };
    return withLock(db, uid, now, async () => {
      const c = await load(uid, now), p = c.p, f = c.f;
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (p.faction !== "zombie") fail("failed-precondition", "บอสเผ่านี้สู้กับซอมบี้เท่านั้น");
      const live = BOSSES[f.boss] && typeof f.hp === "number";

      if (a === "roll") {
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        if (live) return { ok: true, on, hit: false, fight: fightView(f) };
        const z = p.zone, b = BOSSES[z];
        if (!b) return { ok: true, on, hit: false };
        if (now - num(f.last) < COOLDOWN) return { ok: true, on, hit: false, cooling: true };
        let allowed = false;   // ถังโทเค็น
        await db.ref(`hbrl/${uid}`).transaction((cur) => { allowed = false; if (cur === null) { allowed = true; return { tk: BURST - 1, t: now }; } const tk = Math.min(BURST, num(cur.tk) + Math.max(0, now - num(cur.t)) / REFILL_MS); if (tk < 1) return undefined; allowed = true; return { tk: tk - 1, t: now }; });
        if (!allowed) return { ok: true, on, hit: false, limited: true };
        const mult = Math.max(0, await tune("hb_pct", 100)) / 100;
        if (!(rf() < (W[z] * mult) / 100)) return { ok: true, on, hit: false };
        const nf = { boss: z, hp: b.hp, max: b.hp, shield: b.shield || 0, round: 0, pdN: 0, pdP: 0, wkN: 0, last: now, ts: now };
        let log = [b.intro], hp = p.hp;
        if (b.first) { nf.round = 1; const s = bossStrike(b, nf, c); hp = Math.max(0, hp - s.dmg); log = log.concat(s.lines); if (s.dmg) log.push(`ตีแรกโดนไปแล้ว −${s.dmg} HP`); }
        const u = { [`hboss/${uid}`]: hp > 0 ? nf : null }; if (hp !== p.hp) u[`users/${uid}/hp`] = hp; if (hp === 0) u[`hboss/${uid}`] = { last: now };
        await db.ref().update(u);
        return { ok: true, on, hit: true, log, hp, maxHp: c.maxHp, dead: hp === 0, fight: hp > 0 ? fightView(nf) : null };
      }

      if (!live) fail("failed-precondition", "ไม่มีการต่อสู้อยู่");
      const b = BOSSES[f.boss];

      if (a === "claim") {
        if (f.hp > 0) fail("failed-precondition", "บอสยังไม่ล้ม");
        const [id, qty] = pickW(b.loot).slice(0, 2); let bo = pickW(b.bonus).slice(0, 2); if (bo[0] === id) bo = [null, 0];
        const list = [[id, qty]]; if (bo[0]) list.push([bo[0], bo[1]]);
        if (!(await grantAll(db, uid, list))) fail("failed-precondition", "กระเป๋าเต็ม — เคลียร์ช่องแล้วกดรับรางวัลอีกครั้ง");
        await db.ref(`hboss/${uid}`).set({ last: now });
        return { ok: true, on, claimed: list.map(([i, q]) => ({ id: i, qty: q })), fight: null };
      }

      if (!(p.hp > 0)) fail("failed-precondition", "คุณสลบอยู่");
      if (f.hp <= 0) fail("failed-precondition", "บอสล้มแล้ว กดรับรางวัล");
      const log = []; let hp = p.hp, bossHp = f.hp, ended = null; const nf = { ...f, round: num(f.round) + 1 };

      if (a === "flee") {
        if (rf() < b.flee) { await db.ref(`hboss/${uid}`).set({ last: now }); return { ok: true, on, fled: true, log: ["🏃 คุณวิ่งหนีออกมาได้!"], hp, maxHp: c.maxHp, fight: null }; }
        log.push("🏃 หนีไม่พ้น! เขาขวางทางไว้");
      } else {   // attack
        if (c.stunned) fail("failed-precondition", "😵 คุณมึนงง โจมตีไม่ได้ (หนีได้)");
        const r = Math.max(1, d6() + c.diceMod), mult = r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5;
        let dmg = Math.round(Math.max(1, UNARMED_DMG + c.statOf("str")) * mult);
        if (nf.wkN > 0 && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (100 - b.weak.pct) / 100)); nf.wkN--; }
        let msg = `🎲 ทอย ${r} — ` + (dmg ? `${r === 6 ? "คริติคอล! " : ""}โจมตีโดน −${dmg}` : "พลาด!");
        if (dmg && nf.shield > 0) { const ab = Math.min(nf.shield, dmg); nf.shield -= ab; dmg -= ab; msg += ` (🛡️ โล่รับไป ${ab}${nf.shield === 0 ? " • โล่แตก!" : ""})`; }
        bossHp = Math.max(0, bossHp - dmg); log.push(msg);
        if (bossHp === 0) ended = "won";
      }
      if (!ended) {
        if (nf.pdN > 0) { const per = nf.pdP; hp = Math.max(0, hp - per); nf.pdN--; log.push(`${b.pdot.text.slice(0, 2)} แผลเก่าทำให้เสีย −${per} HP`); }
        if (hp > 0) { const s = bossStrike(b, nf, c); hp = Math.max(0, hp - s.dmg); for (const l of s.lines) log.push(l); }
        if (hp === 0) ended = "dead";
      }
      nf.hp = bossHp;
      const u = {}; if (hp !== p.hp) u[`users/${uid}/hp`] = hp;
      u[`hboss/${uid}`] = ended === "dead" ? { last: now } : nf;
      await db.ref().update(u);
      return { ok: true, on, log, hp, maxHp: c.maxHp, won: ended === "won", dead: ended === "dead", fight: ended === "dead" ? null : fightView(nf) };
    });
  }
  return { run };
}
module.exports = { makeHboss, BOSSES, W, COOLDOWN, UNARMED_DMG, HP_BASE, DODGE_PER_POINT };
