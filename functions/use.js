// 🍽️ ใช้ไอเทม (กิน/ดื่ม/ยา/บัฟ/สเตตัส) ที่ฝั่งเซิร์ฟเวอร์ — พอร์ต `useItem` ใน script.js (หัวข้อ 10) • ไม่แตะ rules ใหม่ (ปลดกิ่ง eatSlot ใน rules ออกแล้ว)
// - ผลของไอเทมมาตรฐานอยู่ในตาราง CONSUMABLES ด้านล่าง (ต้องตรง ITEMS ใน script.js — มีเทสต์เทียบ) • รองรับฟิลด์ผลแบบเดียวกับ custom_food: food/water/heal/stamina, s_* (ถาวร), b_*+bmin (บัฟ), e_*+emin (สถานะ), c_* (รักษาสถานะ) • ไอเทม custom_food (แอดมินเสก) อ่านผลจากช่องในกระเป๋าเอง
// - หิว/น้ำ/พลังงานเก็บแบบ "ค่า + timestamp" (ค่าจริง = ค่าที่เก็บ − รอบที่ผ่านไป) — hungerShift/พลังงานต้องตรงสูตรฝั่งเกม (hungerShift, getRegenRate, curStamina)
// - ไม่ทำฝั่งฟังก์ชัน (ยังเป็นของไคลเอนต์): ภูมิต้านพิษของยาแก้พิษ (LS pimm), ตัวนับเควสต์/ความสำเร็จ/มื้ออาหาร — ไคลเอนต์ทำต่อหลังฟังก์ชันตอบสำเร็จ
const { fail, withLock } = require("./lib");
const PK = require("./pack");   // 🦖 สายแรปเตอร์ — โบนัส hp/agi ต้องตรง script.js

const HP_BASE = 100, STAMINA_BASE = 100;
const FOOD_DECAY_MS = { human: 150000, zombie: 100000 }, WATER_DECAY_MS = 100000;
const REGEN_FAST_MS = 20000, REGEN_NORMAL_MS = 30000, REGEN_SLOW_MS = 45000;
const STAT_KEYS = ["str", "hp", "st", "regen", "agi", "tough"];
const STAT_LABEL = { str: "💪 พละกำลัง", hp: "❤️ พลังชีวิต", st: "⚡ พลังงาน", regen: "🔋 พลังฟื้นฟู", agi: "💨 ความว่องไว", tough: "🛡️ ความคงทน" };
const STAT_CAP = 99, STAT_MIN = { str: -5, hp: -2, st: -3, regen: -1, agi: -5, tough: -5 };
const STAT_DEF = { human: ["str", "hp", "st", "regen"], zombie: ["str", "hp", "agi", "tough"] };
const FX_TYPES = { bleed: { icon: "🩸", name: "เลือดไหล" }, poison: { icon: "☠️", name: "พิษ" }, hot: { icon: "💚", name: "ฟื้นฟู" }, stun: { icon: "😵", name: "มึนงง" }, dice: { icon: "🎯", name: "ทอยลูกเต๋า" } };
const FX_KEYS = Object.keys(FX_TYPES), FX_CURE_KEYS = ["bleed", "poison", "stun"];
const POISON_STRONG = 2, STRONG_CURE = ["antidote", "trauma_kit", "exp_serum", "field_surgery_kit"];
const FX_CURES = { bandage: ["bleed"], medkit: ["bleed", "poison"], moss: ["poison"], antidote: ["poison"], trauma_kit: ["bleed", "poison"], exp_serum: ["bleed", "poison"] };
const INFECT_CURES = ["medkit", "moss", "serum", "trauma_kit"];
// ผลของไอเทมมาตรฐาน (ตรง ITEMS ใน script.js เฉพาะ type consumable)
const CONSUMABLES = {
  canned_food: { name: "อาหารกระป๋อง", food: 40 }, water: { name: "น้ำดื่ม", water: 40 }, bandage: { name: "ผ้าพันแผล", heal: 20 }, medkit: { name: "ชุดปฐมพยาบาล", heal: 50 },
  bread: { name: "ขนมปัง", food: 20 }, fruit: { name: "ผลไม้", food: 10, water: 10 }, moss: { name: "มอส", heal: 15 }, energy_drink: { name: "เครื่องดื่มชูกำลัง", stamina: 30 },
  super_ration: { name: "เสบียงพิเศษ", heal: 50, food: 100, water: 100, gmOnly: true }, antidote: { name: "ยาแก้พิษ" }, serum: { name: "เซรั่มต้านเชื้อ" }, trauma_kit: { name: "ชุดช่วยชีวิตขั้นสูง", heal: 80 },
  army_meal: { name: "อาหารทหาร", food: 60, water: 10 }, water_jug: { name: "น้ำสะอาดแกลลอน", water: 70 }, soup: { name: "ซุปอุ่น", heal: 10, food: 30, water: 15 }, stim_shot: { name: "ยากระตุ้น", stamina: 60 },
  choco_bar: { name: "ช็อกโกแลตแท่ง", food: 10, stamina: 15 }, rotten_meat: { name: "เนื้อเน่า", food: 20, zombieOnly: true }, exp_serum: { name: "ซีรั่มทดลอง", heal: 60 },
  fish_grill: { name: "ปลาย่าง", heal: 10, food: 40 }, fish_stew: { name: "ซุปปลา", heal: 25, food: 45, water: 25 },
  // ไอเทมชุดที่ 2 (ตรง ITEMS ใน script.js — สร้างจาก items.draft.json)
  instant_noodle: { name: "บะหมี่กึ่งสำเร็จรูป", food: 25, water: -5 },
  potato_chips: { name: "มันฝรั่งทอดกรอบ", food: 15, stamina: 5 },
  canned_sardine: { name: "ซาร์ดีนกระป๋อง", food: 30, water: -5, stamina: 5 },
  cereal_bar: { name: "ซีเรียลบาร์", food: 25, stamina: 15 },
  canned_tuna: { name: "ทูน่ากระป๋อง", food: 35, heal: 3 },
  wild_berries: { name: "เบอร์รี่ป่า", food: 12, water: 10, e_poison: 1, emin: 1 },
  smoked_meat: { name: "เนื้อรมควัน", food: 45, water: -8 },
  honey_jar: { name: "ขวดน้ำผึ้ง", food: 25, heal: 10 },
  mushroom_stew: { name: "ซุปเห็ดป่า", food: 40, heal: 15, b_regen: 1, bmin: 8 },
  mre_pack: { name: "เสบียงสนาม MRE", food: 70, water: 20 },
  soda_can: { name: "น้ำอัดลมกระป๋อง", water: 25, stamina: 5 },
  spring_water: { name: "น้ำพุธรรมชาติ", water: 40 },
  mineral_bottle: { name: "น้ำแร่ขวดแก้ว", water: 45 },
  herbal_tea: { name: "ชาสมุนไพร", water: 20, heal: 8, c_stun: 1 },
  sports_drink: { name: "เครื่องดื่มเกลือแร่", water: 40, stamina: 15 },
  desal_water: { name: "น้ำกลั่นจากทะเล", food: -5, water: 60 },
  gauze_roll: { name: "ผ้าก๊อซม้วน", heal: 12, c_bleed: 1 },
  antiseptic: { name: "น้ำยาฆ่าเชื้อ", heal: 8, c_poison: 1 },
  painkillers: { name: "ยาแก้ปวด", heal: 10, stamina: 15, b_tough: 2, bmin: 10 },
  antibiotic: { name: "ยาปฏิชีวนะ", heal: 15, c_poison: 1 },
  suture_kit: { name: "ชุดเย็บแผล", heal: 35, c_bleed: 1 },
  herbal_salve: { name: "ยาขี้ผึ้งสมุนไพร", heal: 25, c_poison: 1 },
  iv_drip: { name: "น้ำเกลือ IV", water: 30, heal: 40 },
  morphine: { name: "มอร์ฟีน", heal: 90, b_str: -2, b_agi: -3, bmin: 8 },
  blood_pack: { name: "ถุงเลือด", heal: 65, stamina: -10 },
  field_surgery_kit: { name: "ชุดผ่าตัดสนาม", heal: 90, stamina: -20, c_bleed: 1, c_poison: 1 },
  coffee_can: { name: "กาแฟกระป๋อง", water: -5, stamina: 25 },
  smelling_salts: { name: "ยาดมกระตุ้น", stamina: 10, c_stun: 1 },
  rum_bottle: { name: "เหล้ารัม", heal: 15, stamina: 30, b_agi: -2, bmin: 5 },
  adrenaline_shot: { name: "อะดรีนาลีน", stamina: 50, b_str: 3, b_tough: -2, bmin: 5 },
  focus_pill: { name: "ยาเพิ่มสมาธิ", food: -10, b_agi: 4, bmin: 10 },
  regen_gel: { name: "เจลฟื้นฟูเซลล์", e_hot: 2, emin: 6 },
  combat_stim: { name: "ยากระตุ้นรบ", heal: -10, stamina: 40, b_str: 4, b_agi: 3, bmin: 10 },
  berserker_serum: { name: "เซรั่มคลั่ง", b_str: 9, b_tough: -3, bmin: 8 },
  reflex_booster: { name: "ยาเร่งรีเฟล็กซ์", food: -15, b_agi: 8, bmin: 8 },
  mutagen_vial: { name: "หลอดมิวทาเจน", b_str: 5, b_hp: 3, bmin: 10, e_poison: 1, emin: 2 }
};
const col = (x) => (x && typeof x === "object" ? x : {});
const sgn = (n) => (n > 0 ? "+" : "") + n;
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const hasStatFx = (d) => STAT_KEYS.some((k) => d["s_" + k] || d["b_" + k]);

function makeUse(db, admin) {
  const SV = () => admin.database.ServerValue.TIMESTAMP;
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const slot = String((data && data.slot) || "");
    if (!/^[A-Za-z0-9_\-]{1,40}$/.test(slot)) fail("invalid-argument", "ไม่พบไอเทมนี้");
    const replaceBuff = !!(data && data.replaceBuff);
    return withLock(db, uid, now, async () => {
      const [pS, iS, stS, bS, eS, evS, pkS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`inventory/${uid}/${slot}`).get(), db.ref(`stats/${uid}`).get(), db.ref(`buffs/${uid}`).get(), db.ref(`effects/${uid}`).get(), db.ref(`evo/${uid}`).get(), db.ref(`pack/${uid}`).get()]);
      const p = pS.val(), it = iS.val(), stats = stS.exists() ? col(stS.val()) : null, buff = bS.val(), effects = col(eS.val()), evo = col(evS.val()), pkT = PK.packTier({ ...evo, p: col(pkS.val()).t });
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (!(p.hp > 0)) fail("failed-precondition", "คุณสลบอยู่ ใช้ไอเทมไม่ได้");
      if (!it || !(it.qty >= 1)) fail("failed-precondition", "ไม่พบไอเทมนี้ในกระเป๋า");
      const custom = it.id === "custom_food", def = custom ? it : CONSUMABLES[it.id];
      if (!def || (custom && it.type !== "consumable")) fail("failed-precondition", "ไอเทมนี้ใช้ไม่ได้");
      const fac = p.faction === "zombie" ? "zombie" : "human";
      if (def.zombieOnly && fac !== "zombie") fail("failed-precondition", "เนื้อเน่า… มีแต่ซอมบี้เท่านั้นที่กินลง");
      const zombieNoFood = fac === "zombie" && def.food > 0 && !def.gmOnly && !def.zombieOnly && !custom;
      const foodGain = zombieNoFood ? 0 : fac === "zombie" && def.zombieOnly && !custom && num(evo.h) >= 2 ? Math.floor(num(def.food) * 0.75) : num(def.food);   // สายตะกละขั้น 2+: เนื้อเน่าเติมอาหาร 75% (script.js evoFoodMult ตรงกัน)
      // ---- สถานะที่ใช้คำนวณ (เหมือนฝั่งเกม: บัฟ/สถานะหมดก่อนเวลาจริง 1 วินาที)
      const buffEnd = buff && typeof buff.bstart === "number" ? buff.bstart + num(buff.mins) * 60000 : 0, buffActive = buffEnd - 1000 > now;
      const effActive = (t) => { const e = effects[t]; return !!e && typeof e.bstart === "number" && e.bstart + num(e.mins) * 60000 - 1000 > now; };
      const effV = (t) => (effActive(t) ? num(effects[t].v) : 0);
      const evoBonus = (k) => {
        if (fac !== "zombie") return 0;
        const h = num(evo.h), g = num(evo.g), s = num(evo.s), cap = { str: 2, hp: 5, agi: 4, tough: 2 }; let v = 0;
        if (k === "str") v = (h >= 1 ? 1 : 0) + (h >= 4 ? 1 : 0);
        else if (k === "hp") v = (g >= 1 ? 3 : 0) + (g >= 4 ? 2 : 0) - (s >= 3 ? 2 : s >= 2 ? 1 : 0);
        else if (k === "agi") v = (s >= 1 ? 2 : 0) + (s >= 4 ? 1 : 0) - [0, 0, 1, 2, 2][Math.min(4, Math.max(0, g))];
        else if (k === "tough") v = g >= 1 ? 2 : 0;
        else if (k === "st") v = g >= 3 ? -2 : 0;
        else if (k === "regen") v = g >= 3 ? -1 : 0;
        v += PK.packBonus(k, pkT);
        return cap[k] !== undefined ? Math.min(v, cap[k]) : v;
      };
      const baseStat = (k) => num(stats && stats[k]), statOf = (k) => baseStat(k) + (buffActive ? num(buff[k]) : 0) + evoBonus(k);
      const maxHp = HP_BASE + 10 * statOf("hp"), maxSt = STAMINA_BASE + 10 * statOf("st");
      const hungerMs = (k) => (k === "food" ? FOOD_DECAY_MS[fac] : WATER_DECAY_MS);
      const hungerLeft = (k) => { const v = typeof p[k] === "number" ? p[k] : 100, ts = p[k + "Ts"]; if (typeof ts !== "number") return v; return Math.max(0, v - Math.floor(Math.max(0, now - ts) / hungerMs(k))); };
      const fd = hungerLeft("food"), wt = hungerLeft("water");
      const regenMs = fd > 70 && wt > 70 ? REGEN_FAST_MS : fd <= 20 || wt <= 20 ? REGEN_SLOW_MS : REGEN_NORMAL_MS;
      const curSt = typeof p.staminaTs === "number" ? Math.min(maxSt, num(p.stamina) + Math.floor(Math.max(0, Math.floor((now - 2500 - p.staminaTs) / regenMs)) * Math.max(0, 1 + 0.5 * statOf("regen")))) : num(p.stamina);
      const u = {}, msgs = [];
      // หิว/น้ำ: เลื่อน timestamp ทีละ "รอบเต็ม" เท่านั้น (เศษเวลาไม่หาย) — เหมือน hungerShift ฝั่งเกม
      const hungerShift = (k, delta) => {
        const ms = hungerMs(k), ts = p[k + "Ts"], v = typeof p[k] === "number" ? p[k] : 100;
        if (typeof ts !== "number" || !delta) return;
        const kw = Math.floor(Math.max(0, now - 2500 - ts) / ms), empty = v <= kw, n = Math.max(0, Math.min(100, (empty ? 0 : v - kw) + delta)), base = `users/${uid}/${k}`;
        if (empty) { if (n === 0 && v === 0) return; u[base] = n; u[base + "Ts"] = SV(); } else { u[base] = n; if (kw > 0) u[base + "Ts"] = ts + kw * ms; }
      };
      const heal = num(def.heal), water = num(def.water), stamina = num(def.stamina);
      if (heal > 0 && p.hp < maxHp) { const n = Math.min(maxHp, p.hp + heal); u[`users/${uid}/hp`] = n; msgs.push(`ฟื้น ${n - p.hp} HP`); }
      if (heal < 0 && p.hp > 1) { const n = Math.max(1, p.hp + heal); u[`users/${uid}/hp`] = n; msgs.push(`เสีย ${p.hp - n} HP`); }
      if (foodGain > 0 && fd < 100) { const g = Math.min(100 - fd, foodGain); hungerShift("food", g); msgs.push(`อาหาร +${g}`); }
      if (foodGain < 0 && fd > 0) { const g = Math.min(fd, -foodGain); hungerShift("food", -g); msgs.push(`อาหาร −${g}`); }
      if (water > 0 && wt < 100) { const g = Math.min(100 - wt, water); hungerShift("water", g); msgs.push(`น้ำ +${g}`); }
      if (water < 0 && wt > 0) { const g = Math.min(wt, -water); hungerShift("water", -g); msgs.push(`น้ำ −${g}`); }
      if (stamina > 0 && curSt < maxSt) { const n = Math.min(maxSt, curSt + stamina); u[`users/${uid}/stamina`] = n; u[`users/${uid}/staminaTs`] = SV(); msgs.push(`พลังงาน +${n - curSt}`); }
      if (stamina < 0 && curSt > 0) { const n = Math.max(0, curSt + stamina); u[`users/${uid}/stamina`] = n; u[`users/${uid}/staminaTs`] = SV(); msgs.push(`พลังงาน −${curSt - n}`); }
      // ---- ไอเทมสเตตัส (custom_food ที่มี s_* / b_*)
      const statItem = hasStatFx(def);   // ทั้ง custom_food และไอเทมมาตรฐานชุดที่ 2 ที่มีฟิลด์ s_*/b_*
      if (statItem) {
        const mine = STAT_DEF[fac];
        if (stats) mine.filter((k) => (def["s_" + k] > 0 && baseStat(k) < STAT_CAP) || (def["s_" + k] < 0 && baseStat(k) > STAT_MIN[k])).forEach((k) => {
          const n = Math.max(STAT_MIN[k], Math.min(STAT_CAP, baseStat(k) + def["s_" + k]));
          u[`stats/${uid}/${k}`] = n; msgs.push(`${STAT_LABEL[k]} ถาวร ${sgn(n - baseStat(k))}`);
        });
        if (def.bmin > 0 && mine.some((k) => def["b_" + k])) {
          if (buffActive && !replaceBuff) return { ok: true, confirm: "buff" };   // ไคลเอนต์ถามผู้เล่นก่อนแล้วเรียกใหม่พร้อม replaceBuff
          const b = { bstart: SV(), mins: def.bmin }; STAT_KEYS.forEach((k) => { b[k] = def["b_" + k] || 0; });
          u[`buffs/${uid}`] = b;
          msgs.push(`${mine.some((k) => def["b_" + k] < 0) ? "บัฟ/ดีบัฟ" : "บัฟ"} ${mine.filter((k) => def["b_" + k]).map((k) => `${STAT_LABEL[k].split(" ")[0]}${sgn(def["b_" + k])}`).join(" ")} นาน ${def.bmin} นาที`);
        }
      }
      // ---- สถานะพิเศษ / รักษา
      let strongBlocked = false;
      const cure = (t) => { u[`effects/${uid}/${t}`] = null; msgs.push(`หาย${FX_TYPES[t].name}`); };
      {
        if (def.emin > 0) FX_KEYS.filter((t) => def["e_" + t]).forEach((t) => {
          u[`effects/${uid}/${t}`] = { bstart: SV(), mins: def.emin, v: def["e_" + t], tick: SV() };
          msgs.push(`${FX_TYPES[t].icon} ${FX_TYPES[t].name}${t === "dice" ? " " + sgn(def.e_dice) : ""} นาน ${def.emin} นาที`);
        });
        // ไอเทมมาตรฐานชุดที่ 2: พิษแรงรักษาได้เฉพาะ STRONG_CURE (ไอเทม custom ของแอดมินรักษาได้ทุกระดับ เหมือนเดิม)
        FX_CURE_KEYS.filter((t) => def["c_" + t] && !def["e_" + t] && effActive(t)).forEach((t) => { if (!custom && t === "poison" && effV("poison") >= POISON_STRONG && !STRONG_CURE.includes(it.id)) { strongBlocked = true; return; } cure(t); });
      }
      (FX_CURES[it.id] || []).filter(effActive).forEach((t) => { if (t === "poison" && effV("poison") >= POISON_STRONG && !STRONG_CURE.includes(it.id)) { strongBlocked = true; return; } cure(t); });
      if (it.id === "antidote") msgs.push("🛡️ ภูมิต้านพิษ 10 นาที");   // ตัวภูมิเก็บฝั่งไคลเอนต์ (LS) — ไคลเอนต์ตั้งเองหลังสำเร็จ
      if (strongBlocked) { if (!msgs.length) fail("failed-precondition", "☠️ พิษแรงเกินกว่าไอเทมนี้จะรักษาได้ ต้องใช้ยาแก้พิษหรือชุดช่วยชีวิตขั้นสูง"); msgs.push("แต่พิษแรงยังไม่หาย (ต้องยาแก้พิษหรือชุดช่วยชีวิตขั้นสูง)"); }
      if (p.infected && fac === "human" && INFECT_CURES.includes(it.id)) { u[`users/${uid}/infected`] = null; u[`users/${uid}/infectTs`] = null; msgs.push("หายจากการติดเชื้อ"); }
      if (!msgs.length && statItem) fail("failed-precondition", "ไอเทมนี้ไม่มีผลกับฝ่ายของคุณ หรือสเตตัสถาวรถึงเพดาน/ขีดต่ำสุดแล้ว");
      if (!msgs.length) fail("failed-precondition", zombieNoFood ? "ซอมบี้กินอาหารทั่วไปไม่ลง… ต้องกัดเหยื่อเท่านั้น" : "สเตตัสหลอดนั้นเต็มอยู่แล้ว ไม่จำเป็นต้องใช้");
      // ---- หักของ (กันใช้ซ้ำพร้อมกัน: ลดจากค่าที่อ่านมา ถ้าช่องเปลี่ยนไปแล้วให้ล้ม)
      const took = await db.ref(`inventory/${uid}/${slot}`).transaction((c) => { if (c === null) return c; if (c.id !== it.id || !(c.qty >= 1)) return undefined; return c.qty > 1 ? { ...c, qty: c.qty - 1 } : null; });
      if (!took.committed) fail("failed-precondition", "ไม่พบไอเทมนี้ในกระเป๋า");
      await db.ref().update(u);
      return { ok: true, id: it.id, name: def.name || it.name || it.id, msgs, heal: heal > 0 };
    });
  }
  return { run };
}
module.exports = { makeUse, CONSUMABLES, STAT_LABEL };
