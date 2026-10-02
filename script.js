import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, deleteUser
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, remove, onValue, onChildAdded, onChildRemoved,
  onDisconnect, query, orderByKey, limitToLast, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

/* =========================================================
   1) ตั้งค่า Firebase
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyD_5ovnQvZrkO8kG1i00dMdkO2rlNTG_Tk",
  authDomain: "zompocalypse-137a6.firebaseapp.com",
  databaseURL: "https://zompocalypse-137a6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zompocalypse-137a6",
  storageBucket: "zompocalypse-137a6.firebasestorage.app",
  messagingSenderId: "1032491711291",
  appId: "1:1032491711291:web:4f6d6d9f3eb7d174a0151e",
  measurementId: "G-66LKE0WRVB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* =========================================================
   2) ข้อมูลเกม (โซน + ไอเทม)
   ========================================================= */
const STAMINA_COST = 10, STAMINA_BASE = 100, HP_BASE = 100;
// หิวตามเวลา: ลด 1 หน่วยทุก ๆ N มิลลิวินาที (ซอมบี้หิวเร็วกว่า) คำนวณจาก timestamp เหมือนพลังงาน → ลดต่อแม้ปิดเกม — ต้องตรงกับ database_rules.json
const FOOD_DECAY_MS = { human: 150000, zombie: 100000 }, WATER_DECAY_MS = 100000;
// โทษตาย: ของสิ้นเปลืองเหลือ 70% (ปัดลง) / อาวุธที่ถือเหลือความทนครึ่งเดียว — rules บังคับตามนี้ตอนฟื้น
const DEATH_KEEP = 0.7, WEAPON_KEEP = 0.5;
const DEATH_COOLDOWN = 180000;   // ตายซ้ำภายใน 3 นาทีหลังฟื้นครั้งก่อน ต้องรอก่อนฟื้น (กันฆ่าตัวเองเพื่อฟื้น 50 HP) — ต้องตรงกับ rules
const DEATH_STACK = ["canned_food", "water", "bandage", "medkit", "scrap", "chem", "super_ration", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "rotten_meat"];
const STARVE_HP = 10;   // HP ที่เสียต่อการค้นหาตอนหิว/กระหาย (ทำได้เฉพาะใน Safe Zone) — ต้องตรงกับ database_rules.json
// ---- มินิบอสประจำโซน: มนุษย์ค้นหาแล้วสุ่มเจอ (ไอเดียซอมบี้พิเศษแนว Zombicide: Runner / Fatty / ซอมบี้ถืออาวุธ / Abomination) ----
const BOSS_COOLDOWN = 120000;   // เจอบอสได้ทุก ๆ 2 นาทีอย่างน้อย — ต้องตรงกับ rules (users/lastBoss)
const BOSS_W = { ruins: 2, mall: 3, hospital: 3, police: 4, forest: 2, factory: 3, port: 3, base: 4, tunnel: 5 };   // น้ำหนักเจอบอสในตารางค้นหา (≈ % ต่อครั้ง)
// hp: เลือดบอส (rules จำกัด ≤300) / hits: จำนวนครั้งที่โจมตีต่อรอบ / dmg: ช่วงดาเมจต่อครั้ง / acc: โอกาสโดน / flee: โอกาสหนีสำเร็จ
// loot: ได้ 1 ชิ้น (สุ่มตามน้ำหนัก) / bonus: ของแถม (อาจไม่ได้) — ไอเดมต้องอยู่ใน regex ของ rules และอาวุธต้องมี maxDur ≤ 30
const BOSSES = {
  ruins: { name: "นักวิ่งเมืองร้าง", icon: "🏃", tag: "Runner — เร็วมาก ตีสองครั้งต่อรอบแต่เบา", hp: 55, hits: 2, dmg: [5, 9], acc: 0.7, flee: 0.3, verb: "มันพุ่งข่วนรัวๆ",
    intro: "เสียงฝีเท้ารัวถี่ดังมาจากซอกตึก… ซอมบี้ตัวหนึ่งวิ่งตรงเข้ามาเร็วผิดปกติ!",
    loot: [{ id: "spiked_bat", w: 3 }, { id: "knife", w: 3 }, { id: "energy_drink", w: 4 }], bonus: [{ id: "bandage", w: 3 }, { id: "water", w: 3 }, { id: null, w: 2 }] },
  mall: { name: "อ้วนห้างสรรพสินค้า", icon: "🍔", tag: "Fatty — อึดมาก ช้า แต่หนักมือ", hp: 120, hits: 1, dmg: [14, 22], acc: 0.75, flee: 0.65, verb: "มันทุ่มตัวกระแทก",
    intro: "ชั้นวางของล้มระเนระนาด… ร่างอ้วนใหญ่ยักษ์เดินกระชากทางออกมา!",
    loot: [{ id: "soup", w: 3 }, { id: "choco_bar", w: 3 }, { id: "energy_drink", w: 3 }, { id: "crowbar", w: 2 }], bonus: [{ id: "canned_food", w: 3 }, { id: "bread", w: 3 }, { id: null, w: 2 }] },
  hospital: { name: "ศัลยแพทย์ผี", icon: "🩺", tag: "ซอมบี้ถือมีดผ่าตัด — ฟันแม่นและเจ็บ", hp: 90, hits: 1, dmg: [12, 20], acc: 0.8, flee: 0.55, verb: "มีดผ่าตัดกรีดฉับ",
    intro: "เสียงรถเข็นกลิ้งมาในทางเดิน… หมอในเสื้อกาวน์เปื้อนเลือดชูมีดผ่าตัดขึ้น!",
    loot: [{ id: "medkit", w: 4 }, { id: "trauma_kit", w: 2 }, { id: "serum", w: 2 }, { id: "antidote", w: 2 }], bonus: [{ id: "bandage", w: 4 }, { id: "moss", w: 2 }, { id: null, w: 2 }] },
  police: { name: "ตำรวจผีถือกระบอง", icon: "🚔", tag: "ซอมบี้ถืออาวุธ — ตีหนักสม่ำเสมอ", hp: 100, hits: 1, dmg: [13, 20], acc: 0.75, flee: 0.55, verb: "กระบองฟาดเข้าอย่างจัง",
    intro: "ไฟฉายสาดมาจากห้องควบคุม… เจ้าหน้าที่ผีในเครื่องแบบเดินเข้ามาพร้อมกระบอง!",
    loot: [{ id: "pistol", w: 3 }, { id: "crowbar", w: 3 }, { id: "knife", w: 3 }, { id: "stim_shot", w: 2 }], bonus: [{ id: "bandage", w: 3 }, { id: "bread", w: 2 }, { id: null, w: 3 }] },
  forest: { name: "นักวิ่งป่าลึก", icon: "🐺", tag: "Runner — ว่องไว ตีสองครั้งต่อรอบ", hp: 60, hits: 2, dmg: [6, 10], acc: 0.7, flee: 0.3, verb: "มันกระโจนตะปบ",
    intro: "ใบไม้แหวกเสียงสวบสาบ… บางอย่างวิ่งซิกแซกผ่านต้นไม้เข้ามาหาคุณ!",
    loot: [{ id: "crossbow", w: 2 }, { id: "pocket_knife", w: 3 }, { id: "moss", w: 4 }], bonus: [{ id: "fruit", w: 4 }, { id: "water", w: 3 }, { id: null, w: 2 }] },
  factory: { name: "คนงานถือขวาน", icon: "🪓", tag: "Fatty ถืออาวุธ — อึดและตีแรง", hp: 130, hits: 1, dmg: [16, 24], acc: 0.7, flee: 0.6, verb: "ขวานฟาดลงมา",
    intro: "สายพานหยุดกึก… ร่างกำยำในชุดช่างเดินเข้ามาลากขวานครูดพื้น!",
    loot: [{ id: "fire_axe", w: 3 }, { id: "spiked_bat", w: 3 }, { id: "chem", w: 3 }], bonus: [{ id: "scrap", w: 4 }, { id: "antidote", w: 2 }, { id: null, w: 2 }] },
  port: { name: "ยักษ์ท่าเรือ", icon: "⚓", tag: "Fatty — ร่างยักษ์ ช้าแต่ทุ่มหนัก", hp: 150, hits: 1, dmg: [15, 24], acc: 0.75, flee: 0.65, verb: "กำปั้นยักษ์ทุบลงมา",
    intro: "ตู้คอนเทนเนอร์สั่นสะเทือน… ร่างใหญ่เท่าตู้เหล็กก้าวออกมาจากเงา!",
    loot: [{ id: "army_meal", w: 3 }, { id: "water_jug", w: 3 }, { id: "crossbow", w: 2 }, { id: "pocket_knife", w: 2 }], bonus: [{ id: "canned_food", w: 3 }, { id: "choco_bar", w: 3 }, { id: null, w: 2 }] },
  base: { name: "ทหารผีถือปืน", icon: "🪖", tag: "ซอมบี้ถืออาวุธปืน — ยิงสองนัดต่อรอบ", hp: 110, hits: 2, dmg: [8, 14], acc: 0.7, flee: 0.45, verb: "กระสุนซอยเข้าใส่",
    intro: "เสียงลั่นไกดังก้องค่ายร้าง… ทหารผีในชุดเกราะยกปืนขึ้นเล็งคุณ!",
    loot: [{ id: "shotgun", w: 2 }, { id: "pistol", w: 3 }, { id: "trauma_kit", w: 2 }, { id: "stim_shot", w: 2 }], bonus: [{ id: "army_meal", w: 3 }, { id: "medkit", w: 2 }, { id: null, w: 2 }] },
  tunnel: { name: "อสุรกายอุโมงค์", icon: "👹", tag: "Abomination — บอสใหญ่สุดของเมือง", hp: 220, hits: 1, dmg: [22, 34], acc: 0.8, flee: 0.5, verb: "กรงเล็บมหึมาฉีกอกเข้าอย่างจัง",
    intro: "พื้นสะเทือนเป็นจังหวะ… สิ่งที่ไม่ควรมีอยู่ลากร่างออกมาจากความมืดของอุโมงค์!",
    loot: [{ id: "samurai_sword", w: 3 }, { id: "shotgun", w: 2 }, { id: "serum", w: 3 }, { id: "stim_shot", w: 2 }], bonus: [{ id: "medkit", w: 3 }, { id: "antidote", w: 2 }, { id: "trauma_kit", w: 2 }] }
};
const TRAVEL_COOLDOWN = 45000, TRAVEL_STAMINA = 10, TRAVEL_STAMINA_SAFE = 5;   // ค่าเดินทางข้ามโซน (กลับ Safe Zone ถูกกว่า) — ต้องตรงกับ rules

// ระบบแต้มสเตตัส: แจก 7 แต้มตอนสร้างตัวละคร (เก็บที่ stats/{uid} เขียนได้ครั้งเดียว)
const STAT_POINTS = 7, DODGE_PER_POINT = 0.03;
const STAT_DEF = {
  human: [
    { k: "str", icon: "💪", name: "พละกำลัง", desc: "+1 ดาเมจต่อแต้ม" },
    { k: "hp", icon: "❤️", name: "พลังชีวิต", desc: "+10 HP สูงสุดต่อแต้ม" },
    { k: "st", icon: "⚡", name: "พลังงาน", desc: "+10 พลังงานสูงสุดต่อแต้ม" },
    { k: "regen", icon: "🔋", name: "พลังฟื้นฟู", desc: "+0.5 พลังงานต่อรอบที่ฟื้น ต่อแต้ม" }
  ],
  zombie: [
    { k: "str", icon: "💪", name: "พละกำลัง", desc: "+1 ดาเมจต่อแต้ม" },
    { k: "hp", icon: "❤️", name: "พลังชีวิต", desc: "+10 HP สูงสุดต่อแต้ม" },
    { k: "agi", icon: "💨", name: "ความว่องไว", desc: "+3% โอกาสหลบ (โดนตีแล้วไม่โดนเลย)" },
    { k: "tough", icon: "🛡️", name: "ความคงทน", desc: "−1 ดาเมจที่ได้รับต่อแต้ม (ขั้นต่ำ 1)" }
  ]
};
// สเตตัสจากไอเทม: ถาวร (s_*) บวกเข้า stats/{uid} ตรงๆ / ชั่วคราว (b_* + bmin นาที) เก็บที่ buffs/{uid} (มีได้ชุดเดียว ใช้ใหม่จะแทนที่)
const STAT_KEYS = ["str", "hp", "st", "regen", "agi", "tough"];
const STAT_LABEL = { str: "💪 พละกำลัง", hp: "❤️ พลังชีวิต", st: "⚡ พลังงาน", regen: "🔋 พลังฟื้นฟู", agi: "💨 ความว่องไว", tough: "🛡️ ความคงทน" };
const STAT_CAP = 99, ITEM_STAT_CAP = 20, BUFF_MAX_MIN = 720;
// ค่าต่ำสุดของสเตตัสถาวร และของบัฟ (แยกกัน) — ตั้งไว้ให้ HP/พลังงานสูงสุดไม่ต่ำกว่า 60/40 และฟื้นพลังงานไม่ติดลบ (ต้องตรงกับ database_rules.json)
const STAT_MIN = { str: -5, hp: -2, st: -3, regen: -1, agi: -5, tough: -5 };
const sgn = (n) => (n > 0 ? "+" : "") + n;
const statFx = (d, pre) => STAT_KEYS.filter((k) => d[pre + k]).map((k) => `${STAT_LABEL[k].split(" ")[0]}${sgn(d[pre + k])}`).join(" ");
const hasStatFx = (d) => STAT_KEYS.some((k) => d["s_" + k] || d["b_" + k]);
// สถานะพิเศษ: เก็บที่ effects/{uid}/{type} = { bstart, mins, v, tick } / bleed·poison·hot ทำงานทุก FX_TICK ขณะออนไลน์ (v = HP ต่อรอบ) / stun = โจมตี+ค้นหาไม่ได้ / dice = บวกลบค่าทอยปะทะ
const FX_TYPES = {
  bleed: { icon: "🩸", name: "เลือดไหล" }, poison: { icon: "☠️", name: "พิษ" }, hot: { icon: "💚", name: "ฟื้นฟู" },
  stun: { icon: "😵", name: "มึนงง" }, dice: { icon: "🎯", name: "ทอยลูกเต๋า" }
};
const FX_KEYS = Object.keys(FX_TYPES), FX_CURE_KEYS = ["bleed", "poison", "stun"];
const FX_TICK = 15000, FX_MAX_TICKS = 40, POISON_STAMINA = 2, FX_MAX_MIN = 720;
const FX_CURES = { bandage: ["bleed"], medkit: ["bleed", "poison"], moss: ["poison"], antidote: ["poison"], trauma_kit: ["bleed", "poison"] };   // ไอเทมในเกมที่รักษาสถานะได้ (ต้องตรงกับ rules)
const hasFx = (d) => FX_KEYS.some((t) => d["e_" + t]) || FX_CURE_KEYS.some((t) => d["c_" + t]);
const fxText = (d) => {
  const on = FX_KEYS.filter((t) => d["e_" + t]).map((t) => `${FX_TYPES[t].icon}${FX_TYPES[t].name}${t === "dice" ? sgn(d.e_dice) : t === "stun" ? "" : " " + d["e_" + t] + "/รอบ"}`);
  const cure = FX_CURE_KEYS.filter((t) => d["c_" + t]).map((t) => FX_TYPES[t].name);
  return [on.length && `${on.join(" ")} นาน ${d.emin || 0} นาที`, cure.length && `รักษา ${cure.join("/")}`].filter(Boolean).join(" • ");
};
const SHOUT_COOLDOWN = 30000, BITE_FOOD = 25;
const CHAT_LIMIT = 100, ANN_LIMIT = 50, ATTACK_COOLDOWN = 10000, ATTACK_FALLBACK = 31000, UNARMED_DMG = 5;

const FACTION = { human: { name: "มนุษย์", icon: "👤" }, zombie: { name: "ซอมบี้", icon: "🧟" } };

const ITEMS = {
  canned_food: { name: "อาหารกระป๋อง", icon: "🥫", type: "consumable", food: 40 },
  water: { name: "น้ำดื่ม", icon: "💧", type: "consumable", water: 40 },
  bandage: { name: "ผ้าพันแผล", icon: "🩹", type: "consumable", heal: 20 },
  medkit: { name: "ชุดปฐมพยาบาล", icon: "🧰", type: "consumable", heal: 50 },
  wooden_bat: { name: "ไม้เบสบอล", icon: "🏏", type: "weapon", dmg: 8, maxDur: 20 },
  knife: { name: "มีด", icon: "🔪", type: "weapon", dmg: 12, maxDur: 25 },
  crowbar: { name: "ชะแลง", icon: "🔧", type: "weapon", dmg: 10, maxDur: 30 },
  pistol: { name: "ปืนพก", icon: "🔫", type: "weapon", dmg: 25, maxDur: 12 },
  bread: { name: "ขนมปัง", icon: "🍞", type: "consumable", food: 20 },
  fruit: { name: "ผลไม้", icon: "🍎", type: "consumable", food: 10, water: 10 },
  moss: { name: "มอส", icon: "🌿", type: "consumable", heal: 15 },
  energy_drink: { name: "เครื่องดื่มชูกำลัง", icon: "⚡", type: "consumable", stamina: 30 },
  super_ration: { name: "เสบียงพิเศษ", icon: "🍱", type: "consumable", heal: 50, food: 100, water: 100, gmOnly: true },
  admin_katana: { name: "ดาบคาตานะ", icon: "🗡️", type: "weapon", dmg: 40, maxDur: 60, gmOnly: true },
  scrap: { name: "เศษผ้าและวัสดุ", icon: "🧵", type: "material" },
  chem: { name: "สารเคมี", icon: "🧴", type: "material" },
  // อาวุธใหม่ (ค่าดาเมจต้องตรงกับตารางใน database_rules.json / ความทนต้องไม่เกิน 30 เพราะค้นหาเจอได้)
  pocket_knife: { name: "มีดพก", icon: "🗡️", type: "weapon", dmg: 9, maxDur: 30 },
  spiked_bat: { name: "ไม้เบสบอลตะปู", icon: "🏏", type: "weapon", dmg: 14, maxDur: 18 },
  fire_axe: { name: "ขวานดับเพลิง", icon: "🪓", type: "weapon", dmg: 18, maxDur: 16 },
  crossbow: { name: "หน้าไม้", icon: "🏹", type: "weapon", dmg: 22, maxDur: 14 },
  samurai_sword: { name: "ดาบซามูไร", icon: "⚔️", type: "weapon", dmg: 28, maxDur: 22 },
  shotgun: { name: "ปืนลูกซอง", icon: "💥", type: "weapon", dmg: 32, maxDur: 8 },
  // ไอเทมสำเร็จรูปใหม่ (ค่าที่ฟื้นต้องตรงกับ rules)
  antidote: { name: "ยาแก้พิษ", icon: "💉", type: "consumable" },
  serum: { name: "เซรั่มต้านเชื้อ", icon: "🧬", type: "consumable" },
  trauma_kit: { name: "ชุดช่วยชีวิตขั้นสูง", icon: "🩺", type: "consumable", heal: 80 },
  army_meal: { name: "อาหารทหาร", icon: "🥘", type: "consumable", food: 60, water: 10 },
  water_jug: { name: "น้ำสะอาดแกลลอน", icon: "🚰", type: "consumable", water: 70 },
  soup: { name: "ซุปอุ่น", icon: "🍲", type: "consumable", heal: 10, food: 30, water: 15 },
  stim_shot: { name: "ยากระตุ้น", icon: "💊", type: "consumable", stamina: 60 },
  choco_bar: { name: "ช็อกโกแลตแท่ง", icon: "🍫", type: "consumable", food: 10, stamina: 15 },
  // อาหารรองของซอมบี้: ค้นหาเจอได้เฉพาะฝั่งซอมบี้ และกินได้เฉพาะซอมบี้ (ค่าอาหารต้องตรงกับ rules)
  rotten_meat: { name: "เนื้อเน่า", icon: "🥩", type: "consumable", food: 20, zombieOnly: true }
};

// อาหาร custom ที่ admin เสก (id = custom_food) เก็บค่าสเตตัสไว้ในตัวไอเทมเอง
const defOf = (x) => (x.id === "custom" ? x : x.id === "custom_food" ? { icon: x.type === "material" ? "✨" : hasStatFx(x) || hasFx(x) ? "🧪" : "🍽️", ...x } : ITEMS[x.id]);
const ITEM_NUM_KEYS = ["food", "water", "heal", "stamina", ...STAT_KEYS.map((k) => "s_" + k), ...STAT_KEYS.map((k) => "b_" + k), "bmin", ...FX_KEYS.map((t) => "e_" + t), "emin", ...FX_CURE_KEYS.map((t) => "c_" + t)];
const foodFields = (x) => ({ name: x.name, type: x.type || "consumable", ...(x.icon ? { icon: x.icon } : {}), ...ITEM_NUM_KEYS.reduce((o, k) => (x[k] ? { ...o, [k]: x[k] } : o), {}) });
const effectText = (d) => [d.heal && `HP ${sgn(d.heal)}`, d.food && `อาหาร ${sgn(d.food)}`, d.water && `น้ำ ${sgn(d.water)}`, d.stamina && `พลังงาน ${sgn(d.stamina)}`,
  statFx(d, "s_") && `ถาวร ${statFx(d, "s_")}`, statFx(d, "b_") && `ชั่วคราว ${statFx(d, "b_")} นาน ${d.bmin || 0} นาที`, hasFx(d) && fxText(d)].filter(Boolean).join(" ");

// สูตรคราฟต์ (เฉพาะมนุษย์ ใน Safe Zone) — ถ้าเพิ่มสูตรใหม่ ต้องเพิ่มเงื่อนไขใน database_rules.json ด้วย
const RECIPES = {
  bandage: { need: { scrap: 2 }, out: "bandage", qty: 1 },
  antidote: { need: { chem: 2, scrap: 1 }, out: "antidote", qty: 1 },
  trauma_kit: { need: { medkit: 1, bandage: 2, chem: 1 }, out: "trauma_kit", qty: 1 },
  soup: { need: { canned_food: 1, water: 1 }, out: "soup", qty: 1 },
  stim_shot: { need: { chem: 3, energy_drink: 1 }, out: "stim_shot", qty: 1 }
};

// โบนัสทอยลูกเต๋าตอนเจอซอมบี้ตามความแรงของอาวุธที่ถือ
const weaponBonus = (def) => (def.dmg >= 25 ? 3 : def.dmg >= 10 ? 2 : 1);

const FACTION_PERK = {
  human: "มนุษย์: คราฟต์ผ้าพันแผล ยา ซุป และยากระตุ้นจากวัสดุที่ Safe Zone ได้ / ซอมบี้ป่าจะโจมตีคุณ ต้องทอยลูกเต๋าสู้หรือหนี / ถ้าถูกซอมบี้ผู้เล่นกัดโดนจะติดเชื้อ HP ค่อยๆ ลด ต้องรักษาด้วยชุดปฐมพยาบาลหรือมอส",
  zombie: "ซอมบี้: กินอาหารทั่วไป (กระป๋อง ขนมปัง ผลไม้) ไม่ได้ ต้องกัดคนให้โดนเพื่อเติมอาหาร (+25) หรือค้นหา “เนื้อเน่า” 🥩 นอก Safe Zone (+20) / ซอมบี้ป่าจะเมินคุณ แต่คุณหิวเร็วกว่า / กัดมนุษย์โดนแล้วเหยื่อจะติดเชื้อ"
};

// danger = ระดับอันตราย 0-10 (กำหนดเอง ปรับได้) / โอกาสเจอซอมบี้คำนวณจากตารางดรอปจริง
const ZONES = {
  safe: { name: "Safe Zone", icon: "🏕️", danger: 0, desc: "ค่ายพักพิง ปลอดภัย ต่อสู้ไม่ได้ เสบียงมีแค่พอเสมอตัว ส่วนใหญ่เป็นวัสดุคราฟต์ — อยากได้ของจริงต้องออกไปข้างนอก", drops: [{ id: "canned_food", w: 4 }, { id: "bread", w: 5 }, { id: "water", w: 9 }, { id: "fruit", w: 5 }, { id: "bandage", w: 3 }, { id: "scrap", w: 22 }, { id: null, w: 52 }] },   // คาดหวังอาหาร ~3.1 / น้ำ ~4.1 ต่อครั้ง ≈ ต้นทุนค้นหา (3 / 4)
  ruins: { name: "เขตเมืองร้าง", icon: "🏚️", danger: 4, desc: "ตึกพังและซากรถ ระวังซอมบี้ตามซอกตึก", drops: [{ id: "zombie", w: 15 }, { id: "canned_food", w: 12 }, { id: "bread", w: 8 }, { id: "water", w: 12 }, { id: "fruit", w: 4 }, { id: "energy_drink", w: 3 }, { id: "wooden_bat", w: 5 }, { id: "spiked_bat", w: 3 }, { id: "knife", w: 6 }, { id: "scrap", w: 12 }, { id: null, w: 20 }] },
  mall: { name: "ห้างสรรพสินค้าร้าง", icon: "🏬", danger: 6, desc: "ของกินเยอะ แต่ซอมบี้ก็เยอะเช่นกัน", drops: [{ id: "zombie", w: 25 }, { id: "canned_food", w: 12 }, { id: "soup", w: 3 }, { id: "choco_bar", w: 3 }, { id: "bread", w: 10 }, { id: "water", w: 16 }, { id: "energy_drink", w: 6 }, { id: "crowbar", w: 10 }, { id: "scrap", w: 8 }, { id: null, w: 7 }] },
  hospital: { name: "โรงพยาบาล", icon: "🏥", danger: 7, desc: "ยาและเวชภัณฑ์เยอะ แต่อันตรายมาก", drops: [{ id: "zombie", w: 28 }, { id: "bandage", w: 15 }, { id: "medkit", w: 10 }, { id: "moss", w: 6 }, { id: "water", w: 10 }, { id: "energy_drink", w: 5 }, { id: "scrap", w: 8 }, { id: "antidote", w: 5 }, { id: "serum", w: 3 }, { id: "trauma_kit", w: 2 }, { id: "chem", w: 4 }, { id: null, w: 4 }] },
  police: { name: "สถานีตำรวจ", icon: "🚓", danger: 9, desc: "สถานที่หาอาวุธชั้นดี ถ้าคุณรอดจากฝูงผีได้", drops: [{ id: "zombie", w: 30 }, { id: "pistol", w: 10 }, { id: "knife", w: 12 }, { id: "bandage", w: 5 }, { id: "bread", w: 5 }, { id: "energy_drink", w: 5 }, { id: "shotgun", w: 5 }, { id: "stim_shot", w: 3 }, { id: null, w: 25 }] },
  forest: { name: "ป่าลึก", icon: "🌲", danger: 2, desc: "เงียบสงบ ผลไม้และมอสขึ้นชุก อาจเจอของแปลกๆ ซ่อนอยู่", drops: [{ id: "zombie", w: 10 }, { id: "water", w: 15 }, { id: "fruit", w: 18 }, { id: "moss", w: 12 }, { id: "crowbar", w: 8 }, { id: "pistol", w: 3 }, { id: "pocket_knife", w: 1 }, { id: "scrap", w: 8 }, { id: null, w: 25 }] },
  factory: { name: "โรงงานร้าง", icon: "🏭", danger: 5, desc: "เครื่องจักรสนิมเขรอะ เศษวัสดุและสารเคมีเพียบ อาวุธหนักๆ ก็พอมี", drops: [{ id: "zombie", w: 20 }, { id: "scrap", w: 15 }, { id: "chem", w: 10 }, { id: "energy_drink", w: 5 }, { id: "fire_axe", w: 6 }, { id: "spiked_bat", w: 5 }, { id: "pocket_knife", w: 6 }, { id: "canned_food", w: 6 }, { id: "antidote", w: 3 }, { id: null, w: 24 }] },
  port: { name: "ท่าเรือ", icon: "⚓", danger: 5, desc: "ตู้คอนเทนเนอร์เรียงรายเต็มไปด้วยเสบียง ระวังฝูงซอมบี้หลบอยู่หลังตู้", drops: [{ id: "zombie", w: 18 }, { id: "canned_food", w: 14 }, { id: "water_jug", w: 8 }, { id: "army_meal", w: 4 }, { id: "choco_bar", w: 8 }, { id: "bread", w: 6 }, { id: "fruit", w: 5 }, { id: "scrap", w: 8 }, { id: "pocket_knife", w: 4 }, { id: "crossbow", w: 3 }, { id: "soup", w: 4 }, { id: null, w: 18 }] },
  base: { name: "ค่ายทหารร้าง", icon: "🪖", danger: 8, desc: "คลังแสงและเสบียงทหาร ของดีจริงแต่ทหารผีเฝ้าอยู่เต็มพื้นที่", drops: [{ id: "zombie", w: 30 }, { id: "army_meal", w: 10 }, { id: "shotgun", w: 5 }, { id: "pistol", w: 8 }, { id: "crossbow", w: 4 }, { id: "trauma_kit", w: 4 }, { id: "stim_shot", w: 5 }, { id: "medkit", w: 5 }, { id: "bandage", w: 5 }, { id: "water_jug", w: 6 }, { id: null, w: 18 }] },
  tunnel: { name: "อุโมงค์ใต้ดิน", icon: "🕳️", danger: 10, desc: "มืดสนิทและอับชื้น ซอมบี้ชุกที่สุดในเมือง แต่ของหายากซ่อนอยู่ข้างใน", drops: [{ id: "zombie", w: 35 }, { id: "chem", w: 10 }, { id: "scrap", w: 8 }, { id: "samurai_sword", w: 3 }, { id: "shotgun", w: 4 }, { id: "serum", w: 5 }, { id: "antidote", w: 5 }, { id: "trauma_kit", w: 3 }, { id: "stim_shot", w: 5 }, { id: "soup", w: 4 }, { id: null, w: 18 }] }
};

// เหตุการณ์ประจำโซน: dmod = ปรับระดับอันตราย, zmod = ปรับน้ำหนักโอกาสเจอซอมบี้, nmod = ปรับน้ำหนักช่อง "ไม่เจออะไร" (ลบ = เจอของง่ายขึ้น)
const EVENT_TYPES = {
  horde: { name: "ฝูงซอมบี้บุก", icon: "🧟", dmod: 3, zmod: 25, nmod: 0 },
  fog: { name: "หมอกหนา", icon: "🌫️", dmod: 1, zmod: 8, nmod: 5 },
  calm: { name: "ช่วงสงบ", icon: "🌤️", dmod: -2, zmod: -8, nmod: 0 },
  supply: { name: "เสบียงตกค้าง", icon: "📦", dmod: 1, zmod: 5, nmod: -20 },
  custom: { name: "เหตุการณ์พิเศษ", icon: "⚠️", dmod: 0, zmod: 0, nmod: 0 }
};
const eventIcon = (e) => EVENT_TYPES[e?.type]?.icon || "⚠️";
const minsLeft = (e) => Math.max(1, Math.ceil((e.endsAt - serverNow()) / 60000));
const activeEvent = (z) => { const e = state.events?.[z]; return e && e.endsAt > serverNow() ? e : null; };
// วัฏจักรกลางวัน/กลางคืน: คำนวณจากเวลาเซิร์ฟเวอร์ ทุกคนเห็นตรงกัน ไม่ต้องเก็บข้อมูล
// รอบละ 100 นาที: นาทีที่ 0-59 = กลางวัน (1 ชม.), 60-99 = กลางคืน (40 นาที) (ปรับได้ที่ 2 ค่านี้) / Safe Zone ไม่ได้รับผล
const DAY_CYCLE = 100 * 60000, NIGHT_START = 60 * 60000;
const NIGHT_MOD = { dmod: 2, zmod: 10, nmod: 0 };
const isNight = () => serverNow() % DAY_CYCLE >= NIGHT_START;
const phaseMinsLeft = () => { const t = serverNow() % DAY_CYCLE; return Math.max(1, Math.ceil(((isNight() ? DAY_CYCLE : NIGHT_START) - t) / 60000)); };
const nightMod = (z) => (z !== "safe" && isNight() ? NIGHT_MOD : { dmod: 0, zmod: 0, nmod: 0 });

const effDanger = (z) => Math.max(0, Math.min(10, ZONES[z].danger + (activeEvent(z)?.dmod || 0) + nightMod(z).dmod));
function effectiveDrops(z) {
  const e = activeEvent(z), n = nightMod(z);
  const zm = (e?.zmod || 0) + n.zmod, nm = (e?.nmod || 0) + n.nmod;
  if (!zm && !nm) return ZONES[z].drops;
  return ZONES[z].drops.map((d) => d.id === "zombie" ? { ...d, w: Math.max(0, d.w + zm) } : d.id === null ? { ...d, w: Math.max(0, d.w + nm) } : d);
}

// เนื้อเน่า: น้ำหนักดรอปเพิ่มเฉพาะฝั่งซอมบี้ (นอก Safe Zone)
const ZOMBIE_EXTRA = { ruins: 8, mall: 6, hospital: 6, police: 4, forest: 14, factory: 5, port: 10, base: 4, tunnel: 10 };
function humanDrops(z) { const d = effectiveDrops(z), w = BOSS_W[z]; return w ? [...d, { id: "boss", w }] : d; }   // ตารางค้นหาของมนุษย์ = ตารางโซน + โอกาสเจอบอส
function zombieDrops(z) { const d = effectiveDrops(z), w = ZOMBIE_EXTRA[z]; return w ? [...d, { id: "rotten_meat", w }] : d; }

function dangerInfo(id) {
  const drops = effectiveDrops(id), total = drops.reduce((t, d) => t + d.w, 0) || 1;
  const chance = Math.round((100 * (drops.find((d) => d.id === "zombie")?.w || 0)) / total);
  const level = effDanger(id);
  const tier = level === 0 ? 0 : level <= 3 ? 1 : level <= 6 ? 2 : level <= 8 ? 3 : 4;
  return { chance, level, tier, label: ["ปลอดภัย", "ต่ำ", "ปานกลาง", "สูง", "อันตรายมาก"][tier], ev: activeEvent(id) };
}
function renderZoneDanger(z) {
  const el = $("zone-danger"), evEl = $("zone-event"), tEl = $("zone-time"); if (!el) return;
  const d = dangerInfo(z), base = ZONES[z].danger;
  el.className = "danger-line d" + d.tier;
  el.textContent = `ระดับอันตราย ${d.level}/10 (${d.label})${d.level !== base ? ` • ปกติ ${base}/10` : ""} • โอกาสเจอซอมบี้ตอนค้นหา ${d.chance}% • ${z === "safe" ? "ต่อสู้ระหว่างผู้เล่นไม่ได้" : "ผู้เล่นโจมตีกันได้"}`;
  if (tEl) {
    const night = isNight();
    tEl.className = "time-line " + (night ? "night" : "day");
    tEl.textContent = night
      ? `🌙 กลางคืน — อีกประมาณ ${phaseMinsLeft()} นาทีจะสว่าง${z === "safe" ? "" : ` • อันตราย +${NIGHT_MOD.dmod} ซอมบี้ชุกขึ้น`}`
      : `☀️ กลางวัน — อีกประมาณ ${phaseMinsLeft()} นาทีจะมืด`;
  }
  if (evEl) {
    evEl.classList.toggle("hidden", !d.ev);
    if (d.ev) evEl.textContent = `${eventIcon(d.ev)} ${d.ev.title} — อีกประมาณ ${minsLeft(d.ev)} นาที`;
  }
}

/* =========================================================
   3) State + Helpers
   ========================================================= */
const state = {
  uid: null, profile: null, stats: null, buff: null, effects: {}, fxBusy: false, statsLoaded: false, zone: null, offset: 0, inv: {}, ground: {},
  unsubs: [], players: {}, claimingBite: false, mutedUntil: 0, delMode: false, mutesOff: null, started: false, busy: false, attacking: false, pending: new Set(), sessionStart: 0, wb: {}, wbHits: {}, wbClaim: null, wbBusy: false, attackQueue: Promise.resolve(), events: {}, evSeen: {}, evEnded: {}, nextAuto: undefined, autoOff: false, autoBusy: false
};

const $ = (id) => document.getElementById(id);
const serverNow = () => Date.now() + state.offset;
const d6 = () => 1 + Math.floor(Math.random() * 6);
const isStaff = () => ["gm", "owner"].includes(state.profile?.role);
const baseStat = (k) => state.stats?.[k] || 0;
// บัฟชั่วคราว: หมดก่อนเวลาจริง 1 วิ เพื่อให้ฝั่งเรา "เข้มกว่า" database rules เสมอ (กันเขียนค่าเกินเพดานตอนหมดบัฟ)
const buffEnd = () => (state.buff && typeof state.buff.bstart === "number" ? state.buff.bstart + (state.buff.mins || 0) * 60000 : 0);
const buffActive = () => buffEnd() - 1000 > serverNow();
const buffOf = (k) => (buffActive() ? state.buff[k] || 0 : 0);
const statOf = (k) => baseStat(k) + buffOf(k);
const effEnd = (e) => (e && typeof e.bstart === "number" ? e.bstart + (e.mins || 0) * 60000 : 0);
const effActive = (t) => { const e = state.effects?.[t]; return !!e && effEnd(e) - 1000 > serverNow(); };
const effV = (t) => (effActive(t) ? state.effects[t].v || 0 : 0);
const maxHp = () => HP_BASE + 10 * statOf("hp");
const maxStamina = () => STAMINA_BASE + 10 * statOf("st");
const regenPerTick = () => Math.max(0, 1 + 0.5 * statOf("regen"));
const dodgeChance = () => Math.max(0, DODGE_PER_POINT * statOf("agi"));

// ---- หิว/กระหายตามเวลา: เก็บ food/water + foodTs/waterTs → ค่าจริง = ค่าที่เก็บ − จำนวนรอบที่ผ่านไป ----
const hungerMs = (k) => (k === "food" ? FOOD_DECAY_MS[state.profile?.faction] || FOOD_DECAY_MS.human : WATER_DECAY_MS);
function hungerLeft(k) {
  const p = state.profile; if (!p) return 100;
  const v = typeof p[k] === "number" ? p[k] : 100, ts = p[k + "Ts"];
  if (typeof ts !== "number") return v;
  return Math.max(0, v - Math.floor(Math.max(0, serverNow() - ts) / hungerMs(k)));
}
const curFood = () => hungerLeft("food"), curWater = () => hungerLeft("water");
// ปรับ food/water ลง u (delta = เพิ่ม/ลดจากค่าจริง) พร้อมเลื่อน timestamp ตามที่ rules ยอมรับ แล้วคืนค่าใหม่
// เลื่อน ts ทีละ "รอบเต็ม" เท่านั้น (เศษเวลาไม่หาย → กดบ่อยก็ไม่ช่วยให้หิวช้าลง) / ถ้าหมดอยู่แล้วให้เริ่มนับใหม่จากตอนนี้
function hungerShift(u, k, delta) {
  const p = state.profile, ms = hungerMs(k), ts = p[k + "Ts"], v = typeof p[k] === "number" ? p[k] : 100;
  if (typeof ts !== "number" || !delta) return hungerLeft(k);   // ข้อมูลเก่ายังไม่ถูกย้าย (ทำตอนเข้าเกม) → ข้ามไปก่อน
  const kw = Math.floor(Math.max(0, serverNow() - 2500 - ts) / ms), empty = v <= kw;   // −2.5 วิ: กัน timestamp เกินเวลาเซิร์ฟเวอร์
  const n = Math.max(0, Math.min(100, (empty ? 0 : v - kw) + delta)), base = `users/${state.uid}/${k}`;
  if (empty) { if (n === v) return n; u[base] = n; u[base + "Ts"] = serverTimestamp(); }
  else { u[base] = n; if (kw > 0) u[base + "Ts"] = ts + kw * ms; }
  return n;
}

function mk(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
function btn(label, fn, cls = "btn primary mini") { const b = mk("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
function show(name) { document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active")); $("screen-" + name).classList.add("active"); }
let toastTimer;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2800); }
const errMsg = (e) => (String(e?.code || e).includes("PERMISSION_DENIED") ? "ระบบไม่อนุญาตการกระทำนี้" : "ทำรายการไม่สำเร็จ");

async function trimList(path, limit) {
  const snap = await get(query(ref(db, path), orderByKey(), limitToLast(limit + 10)));
  let extra = snap.size - limit;
  const del = {};
  snap.forEach((c) => { if (extra-- > 0) del[`${path}/${c.key}`] = null; });
  if (Object.keys(del).length) await update(ref(db), del);
}

const REGEN_FAST_MS = 20000, REGEN_NORMAL_MS = 30000, REGEN_SLOW_MS = 45000;   // อิ่ม / ปกติ / หิว (มิลลิวินาทีต่อ 1 แต้ม)
function getRegenRate() {
  const p = state.profile;
  if (!p) return REGEN_NORMAL_MS;
  const fd = curFood(), wt = curWater();
  if (fd > 70 && wt > 70) return REGEN_FAST_MS;
  if (fd <= 20 || wt <= 20) return REGEN_SLOW_MS;
  return REGEN_NORMAL_MS;
}

function curStamina() {
  const p = state.profile;
  if (!p) return 0;
  const rate = getRegenRate();
  const ticks = Math.max(0, Math.floor((serverNow() - 2500 - p.staminaTs) / rate));
  const regen = Math.floor(ticks * regenPerTick());
  return Math.min(maxStamina(), p.stamina + regen);
}

function equippedWeapon() {
  const slot = state.profile?.equipped;
  const it = slot && state.inv[slot];
  const def = (it && it.id === "custom") ? it : (it && ITEMS[it.id]);
  return def && def.type === "weapon" && it.dur > 0 ? { slot, it, def } : null;
}

function wearUpdates(u, w) {
  if (w.it.dur > 999) return;   // อาวุธค่าสูงเกินเพดาน rules (dur ≤ 999) → ไม่หักความทน ไม่งั้นอัปเดตโดนปฏิเสธ
  const left = w.it.dur - 1;
  if (left <= 0) { u[`inventory/${state.uid}/${w.slot}`] = null; u[`users/${state.uid}/equipped`] = null; toast(`${w.def.name} พังแล้ว!`); }
  else { u[`inventory/${state.uid}/${w.slot}/dur`] = left; }
}

function setTab(t) {
  document.querySelectorAll(".layout .panel").forEach((p) => p.classList.toggle("tab-on", p.dataset.panel === t));
  document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  document.querySelector(`.tabbar [data-tab="${t}"]`)?.classList.remove("unread");
}
function notifyTab(t) {
  const p = document.querySelector(`.layout .panel[data-panel="${t}"]`);
  if (p && !p.classList.contains("tab-on")) document.querySelector(`.tabbar [data-tab="${t}"]`)?.classList.add("unread");
}
function notifyChat() { if (!document.querySelector(".layout .panel.chat").classList.contains("tab-on")) document.querySelector('.tabbar [data-tab="chat"]').classList.add("unread"); }
document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
setTab("chat");

/* =========================================================
   4) หน้าโปรไฟล์ & เรนเดอร์หลอดพลัง
   ========================================================= */
$("btn-profile").addEventListener("click", () => {
  const p = state.profile;
  $("prof-val-name").textContent = p.username;
  $("prof-val-faction").textContent = FACTION[p.faction].name;
  $("prof-val-zone").textContent = ZONES[p.zone].name;
  const w = equippedWeapon();
  const sb = statOf("str");
  $("prof-val-wpn").textContent = w ? `${w.def.name} (ดาเมจ ${Math.max(1, w.def.dmg + sb)}, เหลือ ${w.it.dur} ครั้ง)` : `มือเปล่า (ดาเมจ ${Math.max(1, UNARMED_DMG + sb)})`;
  $("prof-val-stats").textContent = statSummary(p.faction);
  renderBuffRow();
  $("prof-perk").textContent = FACTION_PERK[p.faction] || "";
  $("prof-bio").value = "";
  get(ref(db, "bios/" + state.uid)).then((s) => { $("prof-bio").value = s.val() || ""; }).catch(() => {});
  $("profile-modal").classList.remove("hidden");
});
$("prof-bio-save").addEventListener("click", async () => {
  const t = $("prof-bio").value.trim().slice(0, 300);
  try {
    if (t) await set(ref(db, "bios/" + state.uid), t); else await remove(ref(db, "bios/" + state.uid));
    toast("บันทึกประวัติแล้ว");
  } catch (e) { toast(errMsg(e)); }
});
$("bio-close").addEventListener("click", () => $("bio-modal").classList.add("hidden"));
async function showBio(uid, name) {
  $("bio-title").textContent = `ประวัติของ ${name}`;
  $("bio-text").textContent = "กำลังโหลด…";
  $("bio-modal").classList.remove("hidden");
  try { const s = await get(ref(db, "bios/" + uid)); $("bio-text").textContent = s.val() || "ยังไม่ได้เขียนประวัติ"; }
  catch { $("bio-text").textContent = "โหลดไม่สำเร็จ"; }
}
$("prof-close").addEventListener("click", () => $("profile-modal").classList.add("hidden"));

// ---- คู่มือวิธีเล่น: ตัวเลขดึงจากค่าคงที่ด้านบน เลยไม่ต้องแก้ข้อความซ้ำเมื่อปรับบาลานซ์ ----
const fmtDur = (ms) => { const s = Math.round(ms / 1000), m = Math.floor(s / 60), r = s % 60; return m ? (r ? `${m} นาที ${r} วินาที` : `${m} นาที`) : `${s} วินาที`; };
function openGuide() {
  const body = $("guide-body"); body.textContent = "";
  const sec = (title, lines) => {
    body.append(mk("h3", "", title));
    const ul = mk("ul"); ul.style.cssText = "margin: 4px 0 14px; padding-left: 20px;";
    lines.forEach((t) => ul.append(mk("li", "", t))); body.append(ul);
  };
  sec("พื้นฐาน", [
    `ค้นหาไอเทมใช้พลังงาน ${STAMINA_COST} ต่อครั้ง พลังงานฟื้นเองตามเวลา`,
    "Safe Zone ต่อสู้ไม่ได้และมีเสบียงแค่พอเสมอตัว ส่วนใหญ่เป็นวัสดุคราฟต์ อยากได้ของดีต้องออกไปโซนข้างนอก ซึ่งมีซอมบี้และผู้เล่นอื่น",
    "กดชื่อผู้เล่นในโซนเพื่อดูประวัติ กระซิบ หรือโจมตี (นอก Safe Zone เท่านั้น)"
  ]);
  sec("หิวและกระหาย", [
    `อาหารของมนุษย์ลด 1 ทุก ${fmtDur(FOOD_DECAY_MS.human)} ซอมบี้หิวเร็วกว่า ลด 1 ทุก ${fmtDur(FOOD_DECAY_MS.zombie)}`,
    `น้ำลด 1 ทุก ${fmtDur(WATER_DECAY_MS)} ความหิวและกระหายหยุดนับตอนออกจากเกม (อาจคลาดเคลื่อนไม่กี่สิบวินาที)`,
    "ถ้าอาหารหรือน้ำเหลือ 0 นอก Safe Zone จะค้นหาไม่ได้เลย",
    `ใน Safe Zone ยังค้นหาได้เพื่อไม่ให้ติดตาย แต่เสีย HP ${STARVE_HP} ต่อครั้ง`
  ]);
  sec("การเดินทาง", [
    `ย้ายโซนเสียพลังงาน ${TRAVEL_STAMINA} (กลับ Safe Zone เสีย ${TRAVEL_STAMINA_SAFE})`,
    `หลังเดินทางต้องรอ ${fmtDur(TRAVEL_COOLDOWN)} ก่อนย้ายโซนอีกครั้ง`
  ]);
  sec("เมื่อ HP หมด", [
    `คุณจะฟื้นที่ Safe Zone ด้วย 50 HP แต่ของสิ้นเปลืองเหลือ ${Math.round(DEATH_KEEP * 100)}% (ปัดลง) และอาวุธที่ถืออยู่เสียความทนไปครึ่งหนึ่ง`,
    "โทษคิดเฉพาะของที่อยู่ในกระเป๋าและอาวุธที่ถือ ณ ตอนล้ม",
    `ถ้าล้มซ้ำภายใน ${fmtDur(DEATH_COOLDOWN)} หลังฟื้นครั้งก่อน ต้องรอจนครบเวลาก่อนจึงฟื้นได้`
  ]);
  sec("มินิบอสประจำโซน (ฝ่ายมนุษย์)", [
    "ค้นหานอก Safe Zone มีโอกาสน้อยๆ เจอซอมบี้พิเศษประจำโซน เช่น Runner (เร็ว ตีสองครั้ง) Fatty (อึดมาก) ซอมบี้ถืออาวุธ และบอสใหญ่ในอุโมงค์",
    "สู้เป็นรอบ: โจมตี (ทอยลูกเต๋า ทอย 1 พลาด ทอย 6 คริติคอล) ใช้ผ้าพันแผล/ชุดปฐมพยาบาล หรือหนี (ไม่แน่ว่าจะพ้น ถ้าไม่พ้นบอสโจมตีต่อ)",
    "สกิล: ปุ่มสกิลใต้ปุ่มโจมตี (ฟันหนัก ตั้งการ์ด หลบหลีก ปฐมพยาบาล) แต่ละอันมีคูลดาวน์ ใช้ได้ทั้งบอสประจำโซนและบอสโลก ใช้แล้วบอสยังสวนกลับ (ยกเว้นฟันหนักที่ฆ่าบอสได้)",
    "สกิล PvP: เลือก 🎯โจมตีเฉียบ / 🔨ฟาดหนัก / 🗡️ทะลวงเกราะ ที่แถบเหนือรายชื่อผู้เล่น แล้วกดโจมตี ใช้ได้ครั้งละ 1 สกิล ส่วน 🧱ท่าตั้งรับกดใช้ทันที ลดดาเมจที่โดนปะทะครึ่งหนึ่งนาน 60 วินาที",
    "สกิลพิเศษ: GM/Owner อาจมอบสกิลเฉพาะตัวให้ — เป็นรางวัลเควสต์ รางวัลบอสโลก หรือ 📜ม้วนสกิลที่วางไว้ในโซน (กด \"เรียนรู้\" ในรายการของบนพื้น คนแรกที่เรียนได้ไป) จะขึ้นต่อท้ายในแถบสกิล บางอันมีจำนวนครั้งจำกัด (แสดงเป็น ×จำนวน)",
    "ระหว่างสู้ย้ายโซนและค้นหาไม่ได้ และปิดเกมหนีไม่ได้ กลับมาเปิดใหม่จะต้องสู้ต่อ ถ้า HP หมดจะโดนโทษตายตามปกติ",
    `ชนะได้ของหายากประจำโซน 1 ชิ้น + ของแถมบางครั้ง เจอบอสได้ทุก ๆ ${fmtDur(BOSS_COOLDOWN)} อย่างน้อย`
  ]);
  sec("ฝ่ายซอมบี้", [
    "กินอาหารคนทั่วไปไม่ได้ ต้องหาอาหารจากการกัดผู้เล่นหรือเก็บ 🥩 เนื้อเน่า (+20) ที่ค้นเจอนอก Safe Zone",
    "เนื้อเน่ามีแต่ซอมบี้เท่านั้นที่กินลง"
  ]);
  sec("ของบนพื้น", [
    "กดวางไอเทมลงพื้นเพื่อแบ่งให้คนในโซนเดียวกัน ใครอยู่ในโซนก็เก็บได้",
    "วางของชิ้นเดียวจาก slot เดิมซ้ำไม่ได้จนกว่าชิ้นก่อนหน้าจะถูกเก็บ"
  ]);
  $("guide-modal").classList.remove("hidden");
}
$("btn-guide").addEventListener("click", openGuide);
$("guide-close").addEventListener("click", () => $("guide-modal").classList.add("hidden"));

// เดินเวลาสถานะ: bleed/poison ลด HP (poison ลดพลังงานด้วย) ย้อนหลังได้ไม่เกิน FX_MAX_TICKS รอบ ไม่ทำให้ตาย (เหลือ ≥ 1 HP) / hot ฟื้นรอบละครั้ง / หมดเวลาแล้วลบทิ้ง
async function effectTick() {
  const p = state.profile; if (!p || p.banned || state.fxBusy) return;
  const now = serverNow(), u = {};
  let hp = p.hp, stam = null;
  for (const t of FX_KEYS) {
    const e = state.effects?.[t]; if (!e || typeof e.bstart !== "number") continue;
    const end = effEnd(e), base = `effects/${state.uid}/${t}`, v = e.v || 0;
    const expired = now >= end + 1500, live = now < end - 1500;
    if (!expired && !live) continue;
    if (t === "bleed" || t === "poison" || t === "hot") {
      const upto = expired ? end : now - 1500;
      let ticks = Math.min(FX_MAX_TICKS, Math.floor((upto - (e.tick ?? e.bstart)) / FX_TICK));
      if (t === "hot") ticks = expired ? 0 : Math.min(1, ticks);
      if (ticks > 0) {
        if (t === "hot") { if (hp < maxHp()) { hp = Math.min(maxHp(), hp + v); u[base + "/tick"] = serverTimestamp(); } }
        else {
          hp = Math.max(1, hp - v * ticks);
          if (t === "poison") stam = Math.max(0, (stam ?? curStamina()) - POISON_STAMINA * ticks);
          if (!expired) u[base + "/tick"] = serverTimestamp();
        }
      }
    }
    if (expired) u[base] = null;
  }
  if (hp !== p.hp) u[`users/${state.uid}/hp`] = hp;
  if (stam !== null) { u[`users/${state.uid}/stamina`] = stam; u[`users/${state.uid}/staminaTs`] = serverTimestamp(); }
  if (!Object.keys(u).length) return;
  state.fxBusy = true;
  try { await update(ref(db), u); } catch (e) { console.error(e); }
  finally { state.fxBusy = false; }
}

function renderBuffRow() {
  const el = $("prof-val-buff"); if (!el) return;
  if (!buffActive()) { el.textContent = "ไม่มี"; return; }
  const parts = STAT_KEYS.filter((k) => state.buff[k]).map((k) => `${STAT_LABEL[k].split(" ")[0]}${sgn(state.buff[k])}`);
  el.textContent = `${parts.join(" ")} (อีก ${Math.max(1, Math.ceil((buffEnd() - serverNow()) / 60000))} นาที)`;
}

// ถ้าสเตตัสสูงสุดลด (บัฟหมด / GM ลดแต้ม) แล้ว HP/พลังงานที่เก็บไว้เกินเพดาน → ต้องหักลงมาเอง ไม่งั้น rules (validate ≤ max) จะปฏิเสธทุกการเขียนค่าเหล่านั้น
let clampBusyUntil = 0;
async function clampToMax() {
  const p = state.profile; if (!p || Date.now() < clampBusyUntil) return;
  const u = {};
  if (typeof p.hp === "number" && p.hp > maxHp()) u[`users/${state.uid}/hp`] = maxHp();
  if (typeof p.stamina === "number" && p.stamina > maxStamina()) { u[`users/${state.uid}/stamina`] = maxStamina(); u[`users/${state.uid}/staminaTs`] = serverTimestamp(); }
  if (!Object.keys(u).length) return;
  clampBusyUntil = Date.now() + 3000;
  try { await update(ref(db), u); } catch (e) { clampBusyUntil = Date.now() + 30000; console.error(e); }
}

function statSummary(faction) {
  if (!state.stats) return "ยังไม่ได้แจกแต้ม";
  return (STAT_DEF[faction] || []).map((d) => `${d.icon}${d.name} ${baseStat(d.k)}${buffOf(d.k) ? ` (${sgn(buffOf(d.k))})` : ""}`).join(" · ");
}

const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function deathWaitLeft() { const t = state.profile?.lastDeath; return typeof t === "number" ? Math.max(0, DEATH_COOLDOWN - (serverNow() - t)) : 0; }

// ปุ่มโซน: แสดงต้นทุนเดินทาง และนับถอยหลังคูลดาวน์ (ปุ่มยังกดได้ จะได้ toast บอกสาเหตุ)
function renderTravelState() {
  const cd = travelCooldownLeft(), dead = state.profile?.hp === 0;
  document.querySelectorAll(".zone-btn").forEach((b) => {
    let t = b.querySelector(".travel-tag");
    if (!t) { t = mk("span", "travel-tag"); b.insertBefore(t, b.querySelector(".danger-tag")); }
    const here = b.dataset.zone === state.zone;
    b.classList.toggle("cooling", !here && (cd > 0 || dead));
    t.textContent = here ? "" : cd > 0 ? `⏳ ${Math.ceil(cd / 1000)}วิ` : `⚡${travelCost(b.dataset.zone)}`;
    t.title = here ? "" : cd > 0 ? "ยังล้าจากการเดินทางครั้งก่อน" : `เดินทางไปที่นี่ใช้พลังงาน ${travelCost(b.dataset.zone)}`;
  });
}

function renderBars() {
  const p = state.profile;
  if (!p) return;
  const st = curStamina();
  const fd = curFood();
  const wt = curWater();
  $("me-infected")?.classList.toggle("hidden", !(p.infected && p.faction === "human"));
  
  $("bar-hp").style.width = Math.min(100, (p.hp / maxHp()) * 100) + "\%"; $("txt-hp").textContent = p.hp === 0 ? (deathWaitLeft() > 0 ? `💀 ล้มลง • ฟื้นได้ใน ${mmss(deathWaitLeft())}` : "💀 ล้มลง • กำลังฟื้น…") : `HP ${p.hp}/${maxHp()}`;
  renderTravelState(); renderBoss();
  $("bar-st").style.width = Math.min(100, (st / maxStamina()) * 100) + "\%"; $("txt-st").textContent = `พลังงาน ${st}/${maxStamina()}`;
  $("bar-fd").style.width = (fd / 100) * 100 + "\%"; $("txt-fd").textContent = `อาหาร ${fd}/100`;
  $("bar-wt").style.width = (wt / 100) * 100 + "\%"; $("txt-wt").textContent = `น้ำ ${wt}/100`;

  const rate = getRegenRate();
  const per = regenPerTick();
  let rateText = `ปกติ (${per} หน่วย/${REGEN_NORMAL_MS / 1000}วิ)`;
  if (rate === REGEN_FAST_MS) rateText = `เร็ว (${per} หน่วย/${REGEN_FAST_MS / 1000}วิ)`;
  if (rate === REGEN_SLOW_MS) rateText = `ช้า (${per} หน่วย/${REGEN_SLOW_MS / 1000}วิ)`;
  if ($("prof-val-regen")) {
      $("prof-val-regen").textContent = rateText;
      $("prof-val-regen").style.color = rate === REGEN_FAST_MS ? "var(--primary)" : (rate === REGEN_SLOW_MS ? "var(--hazard)" : "inherit");
  }

  const starving = (fd === 0 || wt === 0);
  $("btn-scavenge").disabled = (starving ? (state.zone !== "safe" || p.hp <= STARVE_HP) : st < STAMINA_COST) || effActive("stun");
  const fxEl = $("me-effects");
  if (fxEl) {
    fxEl.textContent = FX_KEYS.filter(effActive).map((t) => `${FX_TYPES[t].icon}${FX_TYPES[t].name}${t === "dice" ? sgn(effV(t)) : ""} ${Math.max(1, Math.ceil((effEnd(state.effects[t]) - serverNow()) / 60000))}น.`).join("  ");
    fxEl.classList.toggle("hidden", !fxEl.textContent);
  }
  updateAttackButtons();
  renderBuffRow(); clampToMax();
}

/* =========================================================
   5) ล็อกอิน & สมัครสมาชิก
   ========================================================= */
onValue(ref(db, ".info/serverTimeOffset"), (s) => { state.offset = s.val() || 0; });
const EMAIL_DOMAIN = "zombocalypse.app";
const nameKey = (name) => name.toLowerCase().replace(/\s+/g, "_");
const cleanName = (v) => v.replace(/[.#$\[\]\/]/g, "").trim();

async function emailFor(name) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nameKey(name)));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `u${hex.slice(0, 40)}@${EMAIL_DOMAIN}`;
}

onAuthStateChanged(auth, async (user) => {
  if (state.registering) return;
  try {
    if (!user) { show("login"); return; }
    state.uid = user.uid;
    const snap = await get(ref(db, "users/" + user.uid));
    if (snap.exists()) { startGame(); return; }
    await signOut(auth); show("login"); $("login-error").textContent = "ไม่พบตัวละคร กรุณาสร้างใหม่";
  } catch (e) { show("login"); console.error(e); }
});

let mode = "login", pickedFaction = null, regPicker = null;
function setMode(m) {
  mode = m;
  document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  document.querySelectorAll(".reg-only").forEach((el) => el.classList.toggle("hidden", m !== "register"));
  $("auth-submit").textContent = m === "login" ? "เข้าสู่ระบบ" : "สร้างตัวละครและเข้าเกม"; $("login-error").textContent = "";
}
document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
document.querySelectorAll(".faction-btn").forEach((b) => b.addEventListener("click", () => {
  pickedFaction = b.dataset.faction;
  document.querySelectorAll(".faction-btn").forEach((x) => x.classList.toggle("selected", x === b));
  regPicker = buildStatPicker($("reg-stats"), pickedFaction);
}));

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = cleanName($("inp-username").value), pw = $("inp-password").value;
  if (name.length < 2) return $("login-error").textContent = "ชื่อต้องยาวอย่างน้อย 2 ตัว";
  if (pw.length < 6) return $("login-error").textContent = "รหัสผ่านอย่างน้อย 6 ตัว";
  if (mode === "register" && (!pickedFaction || pw !== $("inp-password2").value)) return $("login-error").textContent = "ข้อมูลไม่ครบหรือรหัสไม่ตรงกัน";
  if (mode === "register" && (!regPicker || regPicker.left() !== 0)) return $("login-error").textContent = `แจกแต้มสเตตัสให้ครบ ${STAT_POINTS} แต้มก่อน`;
  
  $("auth-submit").disabled = true;
  try {
    const email = await emailFor(name);
    if (mode === "login") await signInWithEmailAndPassword(auth, email, pw);
    else await register(name, email, pw);
  } catch (ex) { $("login-error").textContent = "ทำรายการไม่สำเร็จ กรุณาลองใหม่"; }
  finally { $("auth-submit").disabled = false; }
});

/* =========================================================
   5.1) ตัวแจกแต้มสเตตัส (ใช้ทั้งตอนสมัครและตอนผู้เล่นเก่าแจกครั้งแรก)
   ========================================================= */
function buildStatPicker(box, faction, onChange) {
  const vals = { str: 0, hp: 0, st: 0, regen: 0, agi: 0, tough: 0 };
  const left = () => STAT_POINTS - Object.values(vals).reduce((a, b) => a + b, 0);
  box.innerHTML = ""; box.classList.add("stat-box");
  const head = mk("p", "stat-left"); box.append(head);
  const nums = {};
  const refresh = () => {
    head.textContent = `แต้มคงเหลือ ${left()} / ${STAT_POINTS}`;
    STAT_DEF[faction].forEach((d) => { nums[d.k].textContent = vals[d.k]; });
    if (onChange) onChange(left());
  };
  STAT_DEF[faction].forEach((d) => {
    const row = mk("div", "stat-row");
    const num = mk("span", "", "0"); nums[d.k] = num;
    const ctl = mk("div", "stat-ctl");
    ctl.append(
      btn("−", () => { if (vals[d.k] > 0) { vals[d.k]--; refresh(); } }, "btn ghost mini"), num,
      btn("+", () => { if (left() > 0) { vals[d.k]++; refresh(); } }, "btn ghost mini")
    );
    row.append(mk("b", "", `${d.icon} ${d.name}`), ctl, mk("small", "", d.desc));
    box.append(row);
  });
  refresh();
  return { vals, left };
}

let modalPicker = null;
function openStatModal() {
  const m = $("stat-modal");
  if (!state.profile || !m.classList.contains("hidden")) return;
  modalPicker = buildStatPicker($("stat-modal-box"), state.profile.faction, (left) => { $("stat-save").disabled = left !== 0; });
  m.classList.remove("hidden");
}
$("stat-save").addEventListener("click", async () => {
  if (!modalPicker || modalPicker.left() !== 0) return;
  $("stat-save").disabled = true;
  try { await set(ref(db, "stats/" + state.uid), { ...modalPicker.vals }); toast("บันทึกแต้มสเตตัสแล้ว"); }
  catch (e) { toast(errMsg(e)); $("stat-save").disabled = false; }
});

async function register(name, email, pw) {
  state.registering = true; let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, pw);
    const uid = cred.user.uid;
    await set(ref(db, "usernames/" + nameKey(name)), uid);
    const stats = { ...regPicker.vals };
    await update(ref(db), {
      ["users/" + uid]: {
        username: name, faction: pickedFaction, role: "player", banned: false, zone: "safe",
        stamina: STAMINA_BASE + 10 * stats.st, staminaTs: serverTimestamp(), hp: HP_BASE + 10 * stats.hp,
        food: 100, water: 100, foodTs: serverTimestamp(), waterTs: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      ["stats/" + uid]: stats
    });
    state.uid = uid; startGame();
  } catch (e) { if (cred) await deleteUser(cred.user).catch(() => {}); throw e; } 
  finally { state.registering = false; }
}

$("btn-logout").addEventListener("click", async () => {
  await beat();
  if (state.zone) await remove(ref(db, `zonePlayers/${state.zone}/${state.uid}`));
  await signOut(auth); location.reload();
});

/* =========================================================
   6) เริ่มเกม 
   ========================================================= */
// ความหิว/กระหายหยุดนับตอนออกจากเกม: ส่งสัญญาณ users/{uid}/seenAt ทุก 30 วินาทีขณะออนไลน์
// ตอนกลับเข้าเกมจะเลื่อน foodTs/waterTs ไปข้างหน้าเท่าเวลาที่หายไป (ค่า food/water ไม่เปลี่ยน) — rules จำกัดไม่ให้เลื่อนเกินช่วงออฟไลน์จริง
const HEARTBEAT_MS = 30000;
function beat() {
  if (!state.uid || state.profile?.banned) return Promise.resolve();
  return update(ref(db), { [`users/${state.uid}/seenAt`]: serverTimestamp() }).catch(() => {});
}
async function resumeOffline(p) {
  const uid = state.uid, now = serverNow(), u = { [`users/${uid}/seenAt`]: serverTimestamp() };
  if ([p.seenAt, p.foodTs, p.waterTs].every((x) => typeof x === "number")) {
    const off = now - 1000 - p.seenAt;   // −1 วิ: กันนาฬิกาเหลื่อมกับเซิร์ฟเวอร์ (rules ไม่ยอมให้เลื่อนเกินช่วงที่หายไปจริง)
    if (off > 0) ["food", "water"].forEach((k) => {
      const ts = Math.min(now - 1000, p[k + "Ts"] + off);
      if (ts > p[k + "Ts"]) u[`users/${uid}/${k}Ts`] = ts;
    });
  }
  try { await update(ref(db), u); }
  catch (e) { console.warn("resumeOffline denied", e?.code || e); await beat(); }
}
window.addEventListener("pagehide", () => { beat(); });

function startGame() {
  if (state.started) return;
  state.started = true;
  state.sessionStart = serverNow() - 30000;

  onValue(ref(db, "stats/" + state.uid), (s) => {
    state.stats = s.val(); state.statsLoaded = true;
    if (!s.exists()) openStatModal(); else $("stat-modal").classList.add("hidden");
    renderBars();
  });

  onValue(ref(db, "buffs/" + state.uid), (s) => { state.buff = s.val(); renderBars(); });
  onValue(ref(db, "effects/" + state.uid), (s) => { state.effects = s.val() || {}; renderBars(); });

  onValue(ref(db, "users/" + state.uid), (snap) => {
    const p = snap.val(); if (!p) return;
    state.profile = p;
    if ((typeof p.foodTs !== "number" || typeof p.waterTs !== "number") && !state.hungerInit && !p.banned) {   // ผู้เล่นเก่า: เริ่มนับหิวจากตอนนี้
      state.hungerInit = true;
      const mu = {};
      if (typeof p.foodTs !== "number") mu[`users/${state.uid}/foodTs`] = serverTimestamp();
      if (typeof p.waterTs !== "number") mu[`users/${state.uid}/waterTs`] = serverTimestamp();
      update(ref(db), mu).catch(console.error);
    }
    const inf = !!p.infected && p.faction === "human";
    if (state.wasInfected !== undefined && inf !== state.wasInfected) {
      logLine(inf ? "🦠 คุณถูกกัดและติดเชื้อ! HP จะค่อยๆ ลดลง — รักษาด้วยชุดปฐมพยาบาล 🧰 หรือมอส 🌿" : "💊 อาการติดเชื้อหายแล้ว", inf ? "system" : "info");
    }
    if (state.wasInfected !== undefined && inf !== state.wasInfected) syncInfectedFlag(inf);
    state.wasInfected = inf;
    if (p.banned) { teardownZone(); show("banned"); return; }
    if (!state.hbStarted) { state.hbStarted = true; resumeOffline(p).finally(() => setInterval(beat, HEARTBEAT_MS)); }   // ต้องจัดการเวลาที่หายไปก่อนเริ่มส่งสัญญาณ ไม่งั้น seenAt เก่าจะถูกทับ
    if (!$("screen-game").classList.contains("active")) {
      show("game"); buildZoneList(); renderZoneTags(); buildAdmin(); listenEvents(); listenInventory(); listenAnnouncements(); listenAttacks(); listenWhispers(); listenShouts(); listenBites(); listenMyMute(); listenQuests(); listenBoss(); listenWorldBoss(); listenSkills();
      enterZone(p.zone in ZONES ? p.zone : "safe", true);
    }
    $("me-name").textContent = p.username; $("me-faction").textContent = FACTION[p.faction].icon;
    $("me-role").className = "badge " + p.role; $("me-role").textContent = p.role;
    $("me-role").classList.toggle("hidden", p.role === "player");
    $("btn-admin").classList.toggle("hidden", !isStaff());
    document.querySelector(".owner-only").classList.toggle("hidden", p.role !== "owner");
    if (state.statsLoaded && !state.stats) openStatModal();
    renderBars(); renderInv();
    if (p.hp === 0) processDeath();
  });
  setInterval(renderBars, 1000);
  setInterval(infectionTick, 5000);
  setInterval(effectTick, 5000);
}

$("btn-copy-id").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(state.uid); toast("คัดลอก Player ID แล้ว"); }
  catch { prompt("Player ID ของคุณ", state.uid); }
});

/* =========================================================
   7) โซน + แชท (อัปเดตระบบ Bubble)
   ========================================================= */
function buildZoneList() {
  const ul = $("zone-list"); ul.innerHTML = "";
  Object.entries(ZONES).forEach(([id, z]) => {
    const li = mk("li"); li.style.padding = "0"; li.style.border = "0"; li.style.background = "none";
    const b = mk("button", "zone-btn");
    const dg = dangerInfo(id);
    b.append(mk("span", "", `${z.icon} ${z.name}`), mk("span", "danger-tag d" + dg.tier, `⚠ ${z.danger}/10`));
    b.title = `อันตราย ${z.danger}/10 • เจอซอมบี้ ${dg.chance}%`;
    b.dataset.zone = id;
    b.addEventListener("click", () => { enterZone(id); setTab("chat"); });
    li.append(b); ul.append(li);
  });
}

function teardownZone() { state.unsubs.forEach((f) => f()); state.unsubs = []; }

const travelCost = (z) => (z === "safe" ? TRAVEL_STAMINA_SAFE : TRAVEL_STAMINA);
function travelCooldownLeft() { const t = state.profile?.lastTravel; return typeof t === "number" ? Math.max(0, TRAVEL_COOLDOWN - (serverNow() - t)) : 0; }

// moved = true → ถูกย้ายโซนจากระบบ (ล้มลงแล้วฟื้นที่ Safe Zone) ไม่เสียต้นทุน/คูลดาวน์
async function enterZone(z, initial = false, moved = false) {
  if (!initial && z === state.zone) return;
  const old = state.zone;
  try {
    if (!initial) {
      if (!moved) {
        if (state.profile.hp <= 0) return;
        if (state.boss) return toast("บอสขวางทางอยู่ — สู้หรือหนีก่อน");
        const cd = travelCooldownLeft(), cost = travelCost(z), cur = curStamina();
        if (cd > 0) return toast(`เพิ่งเดินทางมา ยังล้าอยู่ รออีก ${Math.ceil(cd / 1000)} วินาที`);
        if (cur < cost) return toast(`พลังงานไม่พอเดินทาง (ต้องใช้ ${cost})`);
        await update(ref(db), {
          [`users/${state.uid}/zone`]: z, [`users/${state.uid}/lastTravel`]: serverTimestamp(),
          [`users/${state.uid}/stamina`]: cur - cost, [`users/${state.uid}/staminaTs`]: serverTimestamp()
        });
      }
      if (old) await remove(ref(db, `zonePlayers/${old}/${state.uid}`));
    }
    teardownZone(); state.zone = z; state.ground = {}; state.wbHits = {}; state.wbClaim = null;
    $("chat-log").innerHTML = ""; $("zone-title").textContent = `${ZONES[z].icon} ${ZONES[z].name}`; $("zone-desc").textContent = ZONES[z].desc; renderZoneDanger(z);
    document.querySelectorAll(".zone-btn").forEach((b) => b.classList.toggle("current", b.dataset.zone === z));
    renderCraft();

    const pRef = ref(db, `zonePlayers/${z}/${state.uid}`);
    await set(pRef, { name: state.profile.username, faction: state.profile.faction, ...(state.profile.infected && state.profile.faction === "human" ? { infected: true } : {}) });
    onDisconnect(pRef).remove();

    const chatQ = query(ref(db, "chats/" + z), orderByKey(), limitToLast(CHAT_LIMIT));
    state.unsubs.push(
      onChildAdded(chatQ, (s) => addChat(s.key, s.val())),
      onChildRemoved(chatQ, (s) => { document.querySelector(`[data-key="${s.key}"]`)?.remove(); }),
      onValue(ref(db, "zonePlayers/" + z), renderPlayers),
      onValue(ref(db, "zoneItems/" + z), (s) => { state.ground = s.val() || {}; renderGround(); }),
      onValue(ref(db, "worldBossHits/" + z), (s) => { state.wbHits = s.val() || {}; renderWB(); }),
      onValue(ref(db, `worldBossClaims/${z}/${state.uid}`), (s) => { state.wbClaim = s.val(); renderWB(); })
    );
    renderWB();
    if (!initial) logLine(`คุณเดินทางมาถึง ${ZONES[z].name}${moved ? "" : ` (−${travelCost(z)} พลังงาน)`}`, "info");
  } catch (e) { toast(errMsg(e)); }
}

function logLine(text, cls = "info") {
  const log = $("chat-log"); const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  const el = mk("div", "msg " + cls);
  el.append(mk("div", "bubble", text));
  log.append(el);
  if (near) log.scrollTop = log.scrollHeight; notifyChat();
}

function addChat(key, m) {
  const log = $("chat-log"); const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  let el;
  const isMe = m.uid === state.uid;

  if (m.type === "combat") {
    el = mk("div", "msg combat");
    el.append(mk("div", "bubble", m.text));
  } else if (m.type === "emote") {
    el = mk("div", "msg emote");
    const b = mk("div", "bubble");
    b.append(mk("span", "n " + m.faction, m.name), document.createTextNode(" " + m.text));
    el.append(b);
  } else { 
    el = mk("div", isMe ? "msg self" : "msg"); 
    const sender = mk("div", "sender " + m.faction, `${FACTION[m.faction]?.icon || ""} ${m.name}`);
    const bubble = mk("div", "bubble", m.text);
    el.append(sender, bubble); 
  }

  if (isStaff()) el.addEventListener("click", () => {
    if (!state.delMode) return;
    if (confirm("ลบข้อความนี้?")) remove(ref(db, `chats/${state.zone}/${key}`)).catch((e) => toast(errMsg(e)));
  });
  el.dataset.key = key; log.append(el);
  if (near) log.scrollTop = log.scrollHeight; notifyChat();
}

const HELP_LINES = [
  "คำสั่งแชท:",
  "/me ท่าทาง — บรรยายท่าทาง เช่น /me หยิบไม้เบสบอลขึ้นมาช้าๆ",
  "/w ชื่อ ข้อความ — กระซิบกับคนในโซนเดียวกัน (หรือกดปุ่ม กระซิบ ในรายชื่อ)",
  "/s ข้อความ — ตะโกนให้ทุกโซนได้ยิน (พัก 30 วินาที)",
  "/roll [6|20|100] — ทอยลูกเต๋าให้คนในโซนเห็น",
  "/guide — เปิดคู่มือวิธีเล่น (หิว เดินทาง โทษตาย)"
];

function findZonePlayer(rest) {
  const low = rest.toLowerCase();
  const list = Object.entries(state.players).filter(([id]) => id !== state.uid).sort((a, b) => b[1].name.length - a[1].name.length);
  for (const [id, v] of list) {
    const n = v.name.toLowerCase();
    if (low === n || low.startsWith(n + " ")) return { uid: id, name: v.name, text: rest.slice(v.name.length).trim() };
  }
  return null;
}

function muteBlock() {
  const left = state.mutedUntil - serverNow();
  if (left <= 0) return false;
  toast(`คุณถูกปิดแชทอีก ${Math.ceil(left / 60000)} นาที`);
  return true;
}

async function sendChat(raw) {
  const p = state.profile;
  if (!/^\/(help|\?|ช่วยเหลือ)\s*$/i.test(raw) && muteBlock()) return;
  const postZone = async (text, type) => {
    await push(ref(db, "chats/" + state.zone), { uid: state.uid, name: p.username, faction: p.faction, text: text.slice(0, 200), type, ts: serverTimestamp() });
    trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});
  };
  const cm = raw.match(/^\/(\S+)(?:\s+([\s\S]*))?$/);
  if (!cm) return postZone(raw, "chat");

  const cmd = cm[1].toLowerCase(), rest = (cm[2] || "").trim();
  switch (cmd) {
    case "help": case "?": case "ช่วยเหลือ":
      HELP_LINES.forEach((l) => logLine(l, "info")); return;
    case "guide": case "วิธีเล่น": openGuide(); return;
    case "me": case "ท่าทาง":
      if (!rest) return toast("ใช้: /me ท่าทางของตัวละคร");
      return postZone(rest, "emote");
    case "roll": case "ทอย": {
      const n = [6, 20, 100].includes(parseInt(rest.replace(/^d/i, ""), 10)) ? parseInt(rest.replace(/^d/i, ""), 10) : 20;
      return postZone(`🎲 ทอยลูกเต๋า d${n} ได้ ${1 + Math.floor(Math.random() * n)}`, "emote");
    }
    case "w": case "whisper": case "กระซิบ": {
      const t = findZonePlayer(rest);
      if (!t || !t.text) return toast("ใช้: /w ชื่อ ข้อความ (ต้องอยู่โซนเดียวกัน)");
      const text = t.text.slice(0, 200);
      const k1 = push(ref(db, `whispers/${t.uid}`)).key, k2 = push(ref(db, `whispers/${state.uid}`)).key;
      await update(ref(db), {
        [`whispers/${t.uid}/${k1}`]: { from: state.uid, fromName: p.username, toName: t.name, text, ts: serverTimestamp() },
        [`whispers/${state.uid}/${k2}`]: { from: state.uid, fromName: p.username, toName: t.name, text, out: true, ts: serverTimestamp() }
      });
      trimList(`whispers/${state.uid}`, 50).catch(() => {});
      return;
    }
    case "s": case "shout": case "ตะโกน": {
      if (!rest) return toast("ใช้: /s ข้อความ");
      const last = typeof p.lastShout === "number" ? p.lastShout : 0;
      const left = SHOUT_COOLDOWN - (serverNow() - last);
      if (left > 0) return toast(`คอแหบ… รออีก ${Math.ceil(left / 1000)} วินาที`);
      const k = push(ref(db, "shouts")).key;
      await update(ref(db), {
        [`shouts/${k}`]: { uid: state.uid, name: p.username, faction: p.faction, zone: state.zone, text: rest.slice(0, 120), ts: serverTimestamp() },
        [`users/${state.uid}/lastShout`]: serverTimestamp()
      });
      trimList("shouts", 30).catch(() => {});
      return;
    }
    default:
      return toast("ไม่รู้จักคำสั่งนี้ พิมพ์ /help ดูรายการ");
  }
}

function listenWhispers() {
  trimList(`whispers/${state.uid}`, 50).catch(() => {});
  onChildAdded(query(ref(db, "whispers/" + state.uid), limitToLast(20)), (s) => {
    const w = s.val(); if (typeof w.ts === "number" && w.ts < state.sessionStart) return;
    if (w.out) logLine(`🤫 (กระซิบถึง ${w.toName}) ${w.text}`, "whisper out");
    else logLine(`🤫 ${w.fromName} กระซิบ: ${w.text}`, "whisper");
  });
}

function listenShouts() {
  onChildAdded(query(ref(db, "shouts"), limitToLast(10)), (s) => {
    const m = s.val(); if (typeof m.ts === "number" && m.ts < state.sessionStart) return;
    logLine(`📢 ${FACTION[m.faction]?.icon || ""} ${m.name} ตะโกนจาก${ZONES[m.zone]?.name || "ที่ไหนสักแห่ง"}: ${m.text}`, "shout");
  });
}

// ซอมบี้: กัดโดน → ฝั่งเหยื่อ (หรือคนกัดเองตอนฟาดฟรี) บันทึก bites แล้วคนกัดมารับอาหาร
function listenBites() {
  if (state.profile.faction !== "zombie") return;
  onValue(ref(db, "bites/" + state.uid), async (s) => {
    if (!s.exists() || state.claimingBite) return;
    state.claimingBite = true;
    try {
      const fd = curFood();
      const u = { [`bites/${state.uid}`]: null };
      const gain = Math.min(BITE_FOOD, 100 - fd);
      if (gain > 0) hungerShift(u, "food", gain);
      await update(ref(db), u);
      logLine(gain > 0 ? `🦷 คุณกัดเหยื่อ! อาหาร +${gain}` : "🦷 คุณกัดเหยื่อ (อิ่มอยู่แล้ว)", "combat");
    } catch (e) { console.error(e); }
    finally { state.claimingBite = false; }
  });
}

$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("chat-input").value.trim().slice(0, 200);
  if (!text) return;

  $("chat-input").value = "";
  $("chat-input").style.height = "auto"; // รีเซ็ตความสูงกลับหลังส่งข้อความ

  try { await sendChat(text); }
  catch (err) { toast(errMsg(err)); }
});

// กด Enter เพื่อส่งแชท (ใช้ Shift+Enter ถ้าจะขึ้นบรรทัดใหม่)
$("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("chat-form").requestSubmit(); // สั่งส่งฟอร์ม
  }
});

// ให้กล่องแชทยืดความสูงอัตโนมัติตามข้อความที่พิมพ์
$("chat-input").addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});

function renderPlayers(snap) {
  const ul = $("player-list"); ul.innerHTML = ""; state.players = {};
  snap.forEach((c) => {
    const v = c.val(), me = c.key === state.uid;
    state.players[c.key] = v;
    const li = mk("li");
    li.append(mk("span", "", `${FACTION[v.faction]?.icon || ""} ${v.name}${me ? " (คุณ)" : ""}${v.infected ? " 🦠" : ""}`));
    if (v.infected) li.title = "ติดเชื้อ";
    if (!me) {
      const grp = mk("div", "row-btns");
      grp.append(btn("ประวัติ", () => showBio(c.key, v.name), "btn ghost mini"));
      grp.append(btn("กระซิบ", () => { $("chat-input").value = `/w ${v.name} `; setTab("chat"); $("chat-input").focus(); }, "btn ghost mini"));
      if (isStaff()) grp.append(btn("จัดการ", () => {
        ["adm-mute-id", "adm-pid", "adm-target-id", "adm-inf-id", "adm-se-id", "adm-sk-id"].forEach((id) => { $(id).value = c.key; });
        $("adm-clear-zone").value = state.zone; watchMutes();
        $("admin-modal").classList.remove("hidden");
      }, "btn ghost mini"));
      if (state.zone !== "safe") {
        const ab = btn("โจมตี", () => attack(c.key, v.name), "btn danger mini atk-btn");
        ab.dataset.uid = c.key; grp.append(ab);
      }
      li.append(grp);
    }
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีใครอยู่"));
  updateAttackButtons();
}

/* =========================================================
   8) ประกาศระบบ
   ========================================================= */
function listenAnnouncements() {
  onChildAdded(query(ref(db, "announcements"), limitToLast(10)), (s) => {
    const a = s.val(); if (typeof a.ts === "number" && a.ts < state.sessionStart) return;
    if (a.zone === "all" || a.zone === state.zone) logLine(`[ประกาศระบบ] ${a.text}`, "system");
  });
}

/* =========================================================
   9) กระเป๋า การกินอาหาร และ การทิ้งของ
   ========================================================= */
function listenInventory() { onValue(ref(db, "inventory/" + state.uid), (s) => { state.inv = s.val() || {}; state.invLoaded = true; renderInv(); if (state.profile?.hp === 0) processDeath(); }); }

function renderInv() {
  const ul = $("inv-list"); if (!ul) return;
  ul.innerHTML = "";
  Object.entries(state.inv).forEach(([slot, it]) => {
    const def = defOf(it); if (!def) return;
    const li = mk("li");
    if (def.type === "weapon") {
      const eq = state.profile?.equipped === slot;
      if (eq) li.classList.add("equipped");
      li.append(mk("span", "", `🗡️ ${def.name} (${it.dur}/${def.maxDur})`));
      
      const btnGrp = mk("div", "row-btns");
      btnGrp.append(btn(eq ? "ถอด" : "ถือ", () => equip(slot, eq), "btn ghost mini"));
      btnGrp.append(btn("ทิ้ง", () => dropItem(slot), "btn danger mini"));
      btnGrp.append(btn("ทำลาย", () => destroyItem(slot), "btn ghost mini"));
      li.append(btnGrp);
    } else {
      const lbl = mk("span", "", `${def.icon || "📦"} ${def.name} ×${it.qty}`);
      const fx = effectText(def); if (fx) lbl.append(mk("small", "muted", ` (${fx})`));
      li.append(lbl);
      
      const btnGrp = mk("div", "row-btns");
      if (def.type === "consumable") btnGrp.append(btn("ใช้", () => useItem(slot)));
      btnGrp.append(btn("ทิ้ง", () => dropItem(slot), "btn danger mini"));
      btnGrp.append(btn("ทำลาย", () => destroyItem(slot), "btn ghost mini"));
      li.append(btnGrp);
    }
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "กระเป๋าว่างเปล่า"));
  renderCraft();
}

function renderCraft() {
  const sec = $("craft-section"); if (!sec || !state.profile) return;
  const human = state.profile.faction === "human";
  sec.classList.toggle("hidden", !human); if (!human) return;
  const ul = $("craft-list"); ul.innerHTML = "";
  Object.entries(RECIPES).forEach(([id, r]) => {
    const out = ITEMS[r.out];
    const needTxt = Object.entries(r.need).map(([m, n]) => `${ITEMS[m].icon} ${state.inv[m]?.qty || 0}/${n}`).join(" ");
    const can = state.zone === "safe" && Object.entries(r.need).every(([m, n]) => (state.inv[m]?.qty || 0) >= n);
    const li = mk("li"); li.append(mk("span", "", `${out.icon} ${out.name} ← ${needTxt}`));
    const b = btn("ประกอบ", () => craft(id), "btn primary mini"); b.disabled = !can;
    li.append(b); ul.append(li);
  });
  $("craft-hint").textContent = state.zone === "safe" ? "" : "คราฟต์ได้เฉพาะใน Safe Zone";
}

async function craft(id) {
  const r = RECIPES[id]; if (!r || state.busy) return;
  if (state.profile.faction !== "human") return toast("เฉพาะมนุษย์เท่านั้นที่คราฟต์ได้");
  if (state.zone !== "safe") return toast("ต้องคราฟต์ที่ Safe Zone");
  for (const [m, n] of Object.entries(r.need)) if ((state.inv[m]?.qty || 0) < n) return toast("วัตถุดิบไม่พอ");
  state.busy = true;
  const u = {};
  for (const [m, n] of Object.entries(r.need)) {
    const left = state.inv[m].qty - n;
    u[`inventory/${state.uid}/${m}` + (left > 0 ? "/qty" : "")] = left > 0 ? left : null;
  }
  invAddUpdate(u, r.out, r.qty);
  try { await update(ref(db), u); toast(`ประกอบ ${ITEMS[r.out].name} สำเร็จ`); logLine(`🛠️ คุณประกอบ ${ITEMS[r.out].name}`, "info"); }
  catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

// ทำลายไอเทมทิ้งถาวร (ไม่ตกลงพื้น ใครก็เก็บไม่ได้) — ใช้เคลียร์กระเป๋าที่ล้น
async function destroyItem(slot) {
  if (state.busy) return;
  const it = state.inv[slot]; if (!it) return;
  const def = defOf(it);
  if (!confirm(`ทำลาย ${def.name}${it.qty > 1 ? " ทั้ง " + it.qty + " ชิ้น" : ""} ทิ้งถาวร? เอาคืนไม่ได้`)) return;
  state.busy = true;
  const u = { [`inventory/${state.uid}/${slot}`]: null };
  if (state.profile.equipped === slot) u[`users/${state.uid}/equipped`] = null;
  try { await update(ref(db), u); toast(`ทำลาย ${def.name} แล้ว`); logLine(`🔥 คุณทำลาย ${def.name}${it.qty > 1 ? " ×" + it.qty : ""} ทิ้ง`, "info"); }
  catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

async function dropItem(slot) {
  if (state.busy) return;
  const it = state.inv[slot]; if (!it) return;
  state.busy = true;
  
  const def = defOf(it);
  const p = state.profile;
  const u = {};

  if (p.equipped === slot) u[`users/${state.uid}/equipped`] = null;

  // key ผูกกับ slot + จำนวนปัจจุบัน (rules บังคับ) → กันวางหลายชิ้นจาก slot เดียวในคำสั่งเดียวเพื่อทำของซ้ำ
  const key = `${state.uid}_${slot}_${it.qty}`;
  if (state.ground[key]) { state.busy = false; return toast("มีของชิ้นเดียวกันวางรออยู่บนพื้นแล้ว เก็บหรือรอให้มีคนเก็บก่อน"); }
  u[`zoneItems/${state.zone}/${key}`] = {
    id: it.id, qty: 1, src: slot,
    ...(it.dur ? { dur: it.dur } : {}),
    ...(it.id === "custom" ? { name: it.name, dmg: it.dmg, maxDur: it.maxDur, type: "weapon" } : {}),
    ...(it.id === "custom_food" ? foodFields(it) : {})
  };

  if (it.qty > 1) u[`inventory/${state.uid}/${slot}/qty`] = it.qty - 1;
  else u[`inventory/${state.uid}/${slot}`] = null;

  try { 
    await update(ref(db), u); 
    toast(`ทิ้ง ${def.name} ลงพื้นแล้ว`); 
    logLine(`${p.username} วาง ${def.name} ไว้บนพื้น`, "info");
  } catch (e) { toast(errMsg(e)); } 
  finally { state.busy = false; }
}

function renderGround() {
  const ul = $("ground-list"); ul.innerHTML = "";
  Object.entries(state.ground).forEach(([key, g]) => {
    if (g.id === "skill") {   // ม้วนสกิลที่ GM วางไว้
      const li = mk("li"); li.title = skillDesc({ ...g, basic: false });
      li.append(mk("span", "", `📜 ม้วนสกิล ${g.icon || "✨"} ${g.name} (${g.kind === "pvp" ? "PvP" : "PvE"})`));
      li.append(btn("เรียนรู้", (e) => learnScroll(key, e.target)));
      ul.append(li); return;
    }
    const def = defOf(g); if (!def) return;
    const li = mk("li");
    li.append(mk("span", "", `📦 ${def.name}${def.type === "consumable" ? " ×" + g.qty : ""}`));
    li.append(btn("เก็บ", (e) => pickup(key, e.target)));
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีของบนพื้น"));
}

function invAddUpdate(u, itemId, qty, src, dur, customData) {
  if (itemId === "custom" && customData) {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: "custom", qty: 1, dur: customData.dur, name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon", ...(src ? { src } : {}) };
    return;
  }
  if (itemId === "custom_food" && customData) {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: "custom_food", qty: 1, ...foodFields(customData), ...(src ? { src } : {}) };
    return;
  }
  const def = ITEMS[itemId];
  if (def.type === "weapon") {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: itemId, qty: 1, dur: dur ?? def.maxDur, ...(src ? { src } : {}) };
  } else {
    const total = Math.min(99, (state.inv[itemId]?.qty || 0) + qty);
    u[`inventory/${state.uid}/${itemId}`] = { id: itemId, qty: total, ...(src ? { src } : {}) };
  }
}

// เรียนรู้สกิลจากม้วนบนพื้น: ลบม้วน + เขียนสกิลลง skills/{uid}/z:{key} ในคำสั่งเดียว (rules ตรวจว่าม้วนมีอยู่จริงและค่าตรงกัน ใครเร็วกว่าได้)
async function learnScroll(key, btnEl) {
  const g = state.ground[key], p = state.profile; if (!g || g.id !== "skill") return;
  if (btnEl) btnEl.disabled = true;
  if (p.hp <= 0) { if (btnEl) btnEl.disabled = false; return toast("คุณสลบอยู่ เรียนรู้สกิลไม่ได้"); }
  const sk = skillFields(g);
  try {
    await update(ref(db), { [`zoneItems/${state.zone}/${key}`]: null, [`skills/${state.uid}/z:${key}`]: sk });
    toast(`เรียนรู้สกิล ${sk.icon} ${sk.name} แล้ว!`);
    logLine(`📖 ${p.username} เรียนรู้สกิล ${sk.icon} ${sk.name} จากม้วนสกิล`, "system");
  } catch { toast("มีคนเรียนม้วนนี้ไปก่อนแล้ว หรือม้วนถูกเก็บไปแล้ว"); if (btnEl) btnEl.disabled = false; }
}

async function pickup(key, btnEl) {
  if (btnEl) btnEl.disabled = true;
  const g = state.ground[key]; if (!g) return;
  if (g.id === "skill") return learnScroll(key, btnEl);
  const u = { [`zoneItems/${state.zone}/${key}`]: null };
  const customData = g.id === "custom" ? { name: g.name, dmg: g.dmg, dur: g.maxDur } : g.id === "custom_food" ? g : null;
  
  invAddUpdate(u, g.id, g.qty || 1, key, g.dur, customData);
  try { await update(ref(db), u); toast(`เก็บ ${defOf(g).name} แล้ว`); } 
  catch { toast("มีคนเก็บไปก่อนแล้ว หรือกระเป๋าเต็ม"); if (btnEl) btnEl.disabled = false; }
}

async function equip(slot, isEquipped) {
  try { await update(ref(db), { ["users/" + state.uid + "/equipped"]: isEquipped ? null : slot }); }
  catch (e) { toast(errMsg(e)); }
}

async function useItem(slot) {
  const it = state.inv[slot], def = it && defOf(it), p = state.profile;
  if (p.hp <= 0) return;
  if (!def || def.type !== "consumable") return;
  // ซอมบี้ได้อาหารจากการกัดเท่านั้น (ยกเว้นเสบียงพิเศษ/อาหาร custom ของแอดมิน) แต่ยังใช้ส่วนน้ำ/HP/พลังงานของไอเทมได้
  if (def.zombieOnly && p.faction !== "zombie") return toast("เนื้อเน่า… มีแต่ซอมบี้เท่านั้นที่กินลง");
  const zombieNoFood = p.faction === "zombie" && def.food > 0 && !def.gmOnly && !def.zombieOnly && it.id !== "custom_food";
  const foodGain = zombieNoFood ? 0 : (def.food || 0);
  const fd = curFood(), wt = curWater(), cur = curStamina();
  const u = {}, msgs = [];

  // ค่าบวก = เติม / ค่าลบ = ลด (HP ลดได้ต่ำสุด 1 ไม่ถึงตาย)
  if (def.heal > 0 && p.hp < maxHp()) { const n = Math.min(maxHp(), p.hp + def.heal); u[`users/${state.uid}/hp`] = n; msgs.push(`ฟื้น ${n - p.hp} HP`); }
  if (def.heal < 0 && p.hp > 1) { const n = Math.max(1, p.hp + def.heal); u[`users/${state.uid}/hp`] = n; msgs.push(`เสีย ${p.hp - n} HP`); }
  if (foodGain > 0 && fd < 100) { const g = Math.min(100 - fd, foodGain); hungerShift(u, "food", g); msgs.push(`อาหาร +${g}`); }
  if (foodGain < 0 && fd > 0) { const g = Math.min(fd, -foodGain); hungerShift(u, "food", -g); msgs.push(`อาหาร −${g}`); }
  if (def.water > 0 && wt < 100) { const g = Math.min(100 - wt, def.water); hungerShift(u, "water", g); msgs.push(`น้ำ +${g}`); }
  if (def.water < 0 && wt > 0) { const g = Math.min(wt, -def.water); hungerShift(u, "water", -g); msgs.push(`น้ำ −${g}`); }
  if (def.stamina > 0 && cur < maxStamina()) {
    const n = Math.min(maxStamina(), cur + def.stamina);
    u[`users/${state.uid}/stamina`] = n; u[`users/${state.uid}/staminaTs`] = serverTimestamp(); msgs.push(`พลังงาน +${n - cur}`);
  }
  if (def.stamina < 0 && cur > 0) {
    const n = Math.max(0, cur + def.stamina);
    u[`users/${state.uid}/stamina`] = n; u[`users/${state.uid}/staminaTs`] = serverTimestamp(); msgs.push(`พลังงาน −${cur - n}`);
  }

  // ไอเทมสเตตัส (custom_food ที่มี s_* / b_*): ถาวร = บวกเข้า stats / ชั่วคราว = เขียนทับ buffs
  const statItem = it.id === "custom_food" && hasStatFx(def);
  if (statItem) {
    const mine = (STAT_DEF[p.faction] || []).map((d) => d.k);
    if (state.stats) {
      mine.filter((k) => (def["s_" + k] > 0 && baseStat(k) < STAT_CAP) || (def["s_" + k] < 0 && baseStat(k) > STAT_MIN[k])).forEach((k) => {
        const n = Math.max(STAT_MIN[k], Math.min(STAT_CAP, baseStat(k) + def["s_" + k]));
        u[`stats/${state.uid}/${k}`] = n; msgs.push(`${STAT_LABEL[k]} ถาวร ${sgn(n - baseStat(k))}`);
      });
    }
    if (def.bmin > 0 && mine.some((k) => def["b_" + k])) {
      if (buffActive() && !confirm("คุณมีบัฟชั่วคราวอยู่ การใช้ไอเทมนี้จะแทนที่บัฟเดิมทั้งหมด ต้องการใช้ต่อไหม?")) return;
      const b = { bstart: serverTimestamp(), mins: def.bmin };
      STAT_KEYS.forEach((k) => { b[k] = def["b_" + k] || 0; });
      u[`buffs/${state.uid}`] = b;
      msgs.push(`${mine.some((k) => def["b_" + k] < 0) ? "บัฟ/ดีบัฟ" : "บัฟ"} ${mine.filter((k) => def["b_" + k]).map((k) => `${STAT_LABEL[k].split(" ")[0]}${sgn(def["b_" + k])}`).join(" ")} นาน ${def.bmin} นาที`);
    }
  }

  // สถานะพิเศษ: ไอเทม custom ใส่สถานะ (e_*) หรือรักษา (c_*) / ผ้าพันแผล-ชุดปฐมพยาบาล-มอส รักษาสถานะได้ตาม FX_CURES
  let usedEat = false;
  const cure = (t) => { u[`effects/${state.uid}/${t}`] = null; msgs.push(`หาย${FX_TYPES[t].name}`); usedEat = true; };
  if (it.id === "custom_food") {
    if (def.emin > 0) FX_KEYS.filter((t) => def["e_" + t]).forEach((t) => {
      u[`effects/${state.uid}/${t}`] = { bstart: serverTimestamp(), mins: def.emin, v: def["e_" + t], tick: serverTimestamp() };
      msgs.push(`${FX_TYPES[t].icon} ${FX_TYPES[t].name}${t === "dice" ? " " + sgn(def.e_dice) : ""} นาน ${def.emin} นาที`); usedEat = true;
    });
    FX_CURE_KEYS.filter((t) => def["c_" + t] && !def["e_" + t] && effActive(t)).forEach(cure);
  }
  (FX_CURES[it.id] || []).filter(effActive).forEach(cure);

  if (p.infected && p.faction === "human" && ["medkit", "moss", "serum", "trauma_kit"].includes(it.id)) { u[`users/${state.uid}/infected`] = null; u[`users/${state.uid}/infectTs`] = null; msgs.push("หายจากการติดเชื้อ"); }

  if (!msgs.length && statItem) return toast("ไอเทมนี้ไม่มีผลกับฝ่ายของคุณ หรือสเตตัสถาวรถึงเพดาน/ขีดต่ำสุดแล้ว");
  if (!msgs.length) return toast(zombieNoFood ? "ซอมบี้กินอาหารทั่วไปไม่ลง… ต้องกัดเหยื่อเท่านั้น" : "สเตตัสหลอดนั้นเต็มอยู่แล้ว ไม่จำเป็นต้องใช้");

  if (it.id === "custom_food" || usedEat) u[`users/${state.uid}/eatSlot`] = slot;  // ให้ database rules รู้ว่ากินสล็อตไหน
  if (it.qty > 1) u[`inventory/${state.uid}/${slot}/qty`] = it.qty - 1;
  else u[`inventory/${state.uid}/${slot}`] = null;

  try { await update(ref(db), u); toast(`ใช้ ${def.name} ` + msgs.join(", ")); }
  catch (e) { toast(errMsg(e)); }
}

/* =========================================================
   10) ค้นหาไอเทม (ระบบหิวข้าว/หิวน้ำ)
   ========================================================= */
function rollDrop(table) {
  const total = table.reduce((s, d) => s + d.w, 0);
  let r = Math.random() * total;
  for (const d of table) { if ((r -= d.w) < 0) return d.id; }
  return null;
}

// ล้มลง (HP 0) → จ่ายโทษตาย แล้วฟื้น 50 HP ที่ Safe Zone: ของสิ้นเปลืองหาย ~30% + อาวุธที่ถือเสียความทนครึ่งหนึ่ง (database rules บังคับตามนี้)
async function processDeath(attempt = 0) {
  const p = state.profile;
  if (!p || p.hp !== 0 || p.banned || state.dying || !state.invLoaded || !state.zone) return;
  const wait = deathWaitLeft();
  if (wait > 0) {   // ยังอยู่ในช่วงรอฟื้น → นับถอยหลังแล้วค่อยลองใหม่ (ฟื้นก่อนเวลา rules ไม่ยอม)
    if (!state.deathTimer) {
      logLine(`💀 คุณล้มลง… ร่างกายยังอ่อนล้าจากครั้งก่อน จะฟื้นได้ในอีก ${mmss(wait)} นาที (ดูเวลาที่แถบ HP)`, "system");
      state.deathTimer = setTimeout(() => { state.deathTimer = null; processDeath(); }, wait + 1500);
    }
    return;
  }
  state.dying = true;
  try {
    const u = {}, lost = [], uid = state.uid;
    DEATH_STACK.forEach((id) => {
      const it = state.inv[id]; if (!it || !(it.qty > 0)) return;
      const keep = Math.floor(it.qty * DEATH_KEEP);
      if (keep >= it.qty) return;
      lost.push(`${ITEMS[id].icon}×${it.qty - keep}`);
      if (keep > 0) u[`inventory/${uid}/${id}/qty`] = keep; else u[`inventory/${uid}/${id}`] = null;
    });
    const ws = p.equipped, wi = ws && state.inv[ws];
    if (wi && typeof wi.dur === "number") {
      const nd = Math.floor(wi.dur * WEAPON_KEEP), wn = defOf(wi)?.name || "อาวุธ";
      if (nd <= 0) { u[`inventory/${uid}/${ws}`] = null; u[`users/${uid}/equipped`] = null; lost.push(`${wn} พัง`); }
      else { u[`inventory/${uid}/${ws}/dur`] = nd; lost.push(`${wn} ความทน −${wi.dur - nd}`); }
    }
    if (p.infected) { u[`users/${uid}/infected`] = null; u[`users/${uid}/infectTs`] = null; }
    if (state.boss) u[`bossFights/${uid}`] = null;
    u[`users/${uid}/hp`] = 50; u[`users/${uid}/zone`] = "safe"; u[`users/${uid}/lastDeath`] = serverTimestamp();
    await update(ref(db), u);
    logLine(`💀 คุณล้มลง… ฟื้นขึ้นที่ Safe Zone${lost.length ? ` • สูญเสีย ${lost.join(" ")}` : ""}`, "system");
    await enterZone("safe", false, true);
  } catch (e) {
    console.error("death", e);
    if (attempt < 2) setTimeout(() => { state.dying = false; processDeath(attempt + 1); }, 2000);
    else toast(errMsg(e));
  } finally { if (state.profile?.hp !== 0 || attempt >= 2) state.dying = false; }
}

// ทำการค้นหา 1 ครั้ง (อ่านค่าล่าสุดจาก state ทุกครั้ง) — โยน error ออกไปให้ตัวครอบจัดการ
async function scavengeOnce() {
  const p = state.profile;
  if (p.hp <= 0) return;
  if (state.boss) return toast("คุณกำลังเผชิญหน้ากับบอสอยู่!");
  if (effActive("stun")) return toast("😵 คุณมึนงง ค้นหาไอเทมไม่ได้ในตอนนี้");
  const cur = curStamina();
  const fd = curFood();
  const wt = curWater();
  const starving = (fd === 0 || wt === 0);

  if (starving && state.zone !== "safe") return toast("หิวหรือกระหายจนหมดแรง ค้นหาข้างนอกไม่ไหว — กินอาหาร/ดื่มน้ำก่อน (หรือกลับไปค้นหาใน Safe Zone)");
  if (starving && p.hp <= STARVE_HP) return toast(`HP ต่ำเกินไปที่จะฝืนค้นหาตอนหิว (เสีย ${STARVE_HP} HP ต่อครั้ง) กินหรือดื่มก่อน`);
  if (!starving && cur < STAMINA_COST) return toast("พลังงานไม่พอ");
  {
    const isZombie = p.faction === "zombie";
    let found = rollDrop(isZombie ? zombieDrops(state.zone) : humanDrops(state.zone));
    if (found === "boss" && bossCooldownLeft() > 0) found = null;   // เพิ่งเจอบอสไป ยังไม่เกิดซ้ำ
    const scrapIgnored = isZombie && (found === "scrap" || found === "chem");
    if (scrapIgnored) found = null;
    const u = {};
    hungerShift(u, "food", -(isZombie ? 5 : 3)); hungerShift(u, "water", -(isZombie ? 2 : 4));

    let newHp = p.hp;
    if (starving) {
      newHp = Math.max(0, p.hp - STARVE_HP);
      u[`users/${state.uid}/hp`] = newHp;
    } else {
      u[`users/${state.uid}/stamina`] = cur - STAMINA_COST;
      u[`users/${state.uid}/staminaTs`] = serverTimestamp();
    }

    state.lastPayload = u;
    if (found === "zombie") {
      if (isZombie) {
        await update(ref(db), u);
        logLine("🧟 ซอมบี้ตัวหนึ่งเดินผ่านมา… มันดมกลิ่นคุณแล้วเมินไป (พวกเดียวกัน)", "info");
      } else {
        await zombieEncounter(u, newHp);
      }
    } else if (found === "boss") {
      await startBoss(u);
    } else if (found) {
      invAddUpdate(u, found, 1);
      await update(ref(db), u);
      logLine(`คุณค้นหา… เจอ ${ITEMS[found].icon} ${ITEMS[found].name}`, "info");
      if (starving) logLine(`คำเตือน: คุณฝืนร่างกายค้นหาของจนเสียเลือด ${STARVE_HP} HP`, "system");
    } else {
      await update(ref(db), u);
      logLine(scrapIgnored ? "คุณเจอเศษผ้ากับวัสดุ แต่ซอมบี้ไม่รู้จะเอาไปทำอะไร… จึงทิ้งไว้" : "คุณค้นหา… ไม่เจออะไรเลย", "info");
      if (starving) logLine(`คำเตือน: คุณฝืนร่างกายค้นหาของจนเสียเลือด ${STARVE_HP} HP`, "system");
    }
  }
}

$("btn-scavenge").addEventListener("click", async () => {
  if (state.busy) return;
  state.busy = true;
  try {
    try { await scavengeOnce(); }
    catch (e) {
      if (!String(e?.code || e).includes("PERMISSION_DENIED")) throw e;
      // ข้อมูลในเครื่องอาจล้าหลังเซิร์ฟเวอร์เล็กน้อย (โดนตี/เน็ตหน่วง/นาฬิกาเหลื่อม)
      // การเขียนที่ถูกปฏิเสธไม่มีผลใดๆ และ Firebase จะย้อนค่าในเครื่องกลับเอง จึงรอสักครู่แล้วลองใหม่จากค่าล่าสุด
      console.warn("scavenge denied (จะลองใหม่ 1 ครั้ง)", { payload: state.lastPayload, profile: state.profile, offset: state.offset });
      await new Promise((r) => setTimeout(r, 1500));
      await scavengeOnce();
    }
  } catch (e) {
    console.error("scavenge denied", e?.code, { payload: state.lastPayload, profile: state.profile, inv: state.inv, stamina: curStamina(), offset: state.offset });
    toast(errMsg(e));
  } finally { state.busy = false; }
});

// เจอซอมบี้ตอนค้นหา: ทอย d6 + โบนัสอาวุธ (ทอยได้ 1 คือพลาดหนักเสมอ)
async function zombieEncounter(u, hpNow) {
  const w = equippedWeapon();
  const bonus = w ? weaponBonus(w.def) : 0;
  const r = d6(), total = r + bonus;
  const base = 10 + Math.floor(Math.random() * 15);
  const rollTxt = `🎲 ทอย ${r}${bonus ? ` + ${bonus} (${w.def.name})` : ""} = ${total}`;
  let dmg = 0, verdict, loot = null, won = false;

  if (r === 1) { dmg = Math.min(40, Math.round(base * 1.5)); verdict = `พลาดท่า! ซอมบี้งับเต็มแรง −${dmg} HP`; }
  else if (total <= 3) { dmg = base; verdict = `ซอมบี้พุ่งออกมาจากที่ซ่อน โดนกัด −${dmg} HP`; }
  else if (total === 4) { dmg = Math.ceil(base / 2); verdict = `ถอยทันแต่ยังโดนข่วน −${dmg} HP`; }
  else if (total === 5) { verdict = "หลบและหนีออกมาได้อย่างหวุดหวิด"; }
  else { won = true; verdict = w ? `ฟาด${w.def.name}ใส่จนซอมบี้ล้มลง!` : "สู้ซอมบี้ล้มได้ด้วยมือเปล่า!"; }

  if (w && r !== 1) wearUpdates(u, w);

  if (won) {
    loot = rollDrop(effectiveDrops(state.zone).filter((d) => d.id !== "zombie"));
    if (loot) { invAddUpdate(u, loot, 1); verdict += ` และเจอ ${ITEMS[loot].icon} ${ITEMS[loot].name} ติดตัวมัน`; }
  }

  let newHp = hpNow;
  if (dmg > 0) {
    newHp = Math.max(0, hpNow - dmg);
    u[`users/${state.uid}/hp`] = newHp;
  }

  await update(ref(db), u);
  logLine(`🧟 ${rollTxt} — ${verdict}`, "combat");
  if (newHp === 0) logLine("คุณบาดเจ็บสาหัสจนล้มลง…", "system");
}

/* =========================================================
   10.5) มินิบอสประจำโซน (สู้เป็นรอบ: โจมตี / ใช้ยา / หนี)
   ========================================================= */
const bossCooldownLeft = () => { const t = state.profile?.lastBoss; return typeof t === "number" ? Math.max(0, BOSS_COOLDOWN - (serverNow() - t)) : 0; };

function bossLog(t) {
  const ul = $("boss-log"); ul.append(mk("li", "", t));
  while (ul.children.length > 30) ul.firstChild.remove();
  ul.scrollTop = ul.scrollHeight;
}

// เจอบอส: ต้นทุนการค้นหาจ่ายไปแล้วใน u / บันทึกสถานะสู้ที่ bossFights/{uid} เพื่อให้รีเฟรชแล้วต้องสู้ต่อ (หนีด้วยการปิดเกมไม่ได้)
async function startBoss(u) {
  const id = state.zone, b = BOSSES[id];
  if (!b) { await update(ref(db), u); return logLine("คุณค้นหา… ไม่เจออะไรเลย", "info"); }
  u[`users/${state.uid}/lastBoss`] = serverTimestamp();
  u[`bossFights/${state.uid}`] = { boss: id, hp: b.hp, max: b.hp, zone: id, ts: serverTimestamp() };
  await update(ref(db), u);
  $("boss-log").textContent = "";
  logLine(`${b.icon} ${b.intro}`, "combat");
  bossLog(b.intro);
}

function listenBoss() { onValue(ref(db, "bossFights/" + state.uid), (s) => { state.boss = s.val(); renderBoss(); }); }

function renderBoss() {
  const m = $("boss-modal"), p = state.profile, bs = state.boss, b = bs && BOSSES[bs.boss];
  const open = !!(b && p && p.hp > 0 && p.faction === "human");
  m.classList.toggle("hidden", !open);
  if (!open) return;
  const won = bs.hp <= 0, busy = !!state.bossBusy, w = equippedWeapon();
  $("boss-title").textContent = `${b.icon} ${b.name}`;
  $("boss-tag").textContent = b.tag;
  $("bar-boss").style.width = Math.max(0, (bs.hp / bs.max) * 100) + "%"; $("txt-boss").textContent = `บอส ${Math.max(0, bs.hp)}/${bs.max}`;
  $("bar-boss-me").style.width = Math.min(100, (p.hp / maxHp()) * 100) + "%"; $("txt-boss-me").textContent = `HP ${p.hp}/${maxHp()}`;
  $("boss-weapon").textContent = w ? `ถืออยู่: ${w.def.icon} ${w.def.name} (ทน ${w.it.dur})` : "ถืออยู่: มือเปล่า (ดาเมจต่ำมาก — แนะนำให้หนี)";
  const bd = state.inv.bandage?.qty || 0, kit = state.inv.medkit?.qty || 0;
  $("boss-attack").classList.toggle("hidden", won); $("boss-attack").disabled = busy;
  $("boss-bandage").classList.toggle("hidden", won); $("boss-bandage").disabled = busy || !bd; $("boss-bandage").textContent = `🩹 ผ้าพันแผล ×${bd}`;
  $("boss-medkit").classList.toggle("hidden", won); $("boss-medkit").disabled = busy || !kit; $("boss-medkit").textContent = `🧰 ชุดปฐมพยาบาล ×${kit}`;
  $("boss-flee").classList.toggle("hidden", won); $("boss-flee").disabled = busy;
  $("boss-claim").classList.toggle("hidden", !won); $("boss-claim").disabled = busy;
  $("boss-skills").classList.toggle("hidden", won); renderSkillBar($("boss-skills"), (id) => bossRound("skill:" + id), busy || won, p);
}

// การโจมตีของบอส 1 รอบ (ทอยโดน/พลาดแต่ละครั้ง)
function bossStrike(b) {
  let total = 0; const parts = [];
  for (let i = 0; i < b.hits; i++) {
    if (Math.random() < b.acc) { const d = b.dmg[0] + Math.floor(Math.random() * (b.dmg[1] - b.dmg[0] + 1)); total += d; parts.push(`−${d}`); }
    else parts.push("พลาด");
  }
  return { total, text: `${b.verb} (${parts.join(", ")})` };
}

/* =========================================================
   สกิล — พื้นฐาน (ทุกคนมีอัตโนมัติ) + สกิล custom ที่ GM/Owner มอบ (skills/{uid}/{slot})
   สถานะคูลดาวน์เก็บที่ skillState/{uid}/{id} = { ts } / rules คุมคูลดาวน์และจำนวนครั้งที่เหลือ
   ทุกสกิลมี type + power
     PvE: power = ตีโดนแน่ ดาเมจ×power / guard = ลดดาเมจสวนกลับ power% / dodge = บอสสวนกลับพลาด / heal = ฟื้น HP
     PvP: sharp = ทอยโจมตี +power / smash = ดาเมจ×power / pierce = ไม่หัก tough / brace = ลดดาเมจที่โดน power% นาน 60 วิ
   สกิล custom มี uses: -1 = ไม่จำกัด, >0 = จำนวนครั้งที่เหลือ (ใช้ครั้งละ 1), 0 = หมด
   ========================================================= */
const SKILLS = {
  heavy: { kind: "pve", type: "power", power: 1.5, basic: true, icon: "💥", name: "ฟันหนัก", cd: 30, desc: "ตีโดนแน่ ดาเมจ ×1.5 (ไม่ต้องลุ้นลูกเต๋า)" },
  guard: { kind: "pve", type: "guard", power: 50, basic: true, icon: "🛡️", name: "ตั้งการ์ด", cd: 45, desc: "ดาเมจที่บอสสวนกลับรอบนี้ลดลงครึ่งหนึ่ง" },
  dodge: { kind: "pve", type: "dodge", power: 0, basic: true, icon: "💨", name: "หลบหลีก", cd: 60, desc: "บอสสวนกลับรอบนี้พลาดแน่" },
  aid:   { kind: "pve", type: "heal", power: 0, basic: true, icon: "✚", name: "ปฐมพยาบาล", cd: 90, desc: "ฟื้น HP 20 + 2×ค่า HP ของตัวละคร" },
  // ---- PvP (ใช้ตอนปะทะผู้เล่น) — เลือกสกิลก่อนกดโจมตี สกิลโจมตีใช้ได้ครั้งละ 1 อัน ----
  sharp:  { kind: "pvp", type: "sharp", power: 2, basic: true, icon: "🎯", name: "โจมตีเฉียบ", cd: 40, desc: "ค่าทอยโจมตีครั้งถัดไป +2" },
  smash:  { kind: "pvp", type: "smash", power: 1.3, basic: true, icon: "🔨", name: "ฟาดหนัก", cd: 45, desc: "ดาเมจปะทะครั้งถัดไป ×1.3" },
  pierce: { kind: "pvp", type: "pierce", power: 0, basic: true, icon: "🗡️", name: "ทะลวงเกราะ", cd: 60, desc: "โจมตีครั้งถัดไปไม่ถูกหักด้วยค่า tough ของเป้าหมาย" },
  brace:  { kind: "pvp", type: "brace", power: 50, basic: true, icon: "🧱", name: "ท่าตั้งรับ", cd: 90, desc: "60 วินาที ดาเมจที่โดนปะทะลดลงครึ่งหนึ่ง" }
};
const PVP_BRACE_MS = 60000;   // ระยะท่าตั้งรับ (rules บังคับ cd ของสกิลประเภท brace ≥ 60 วิ)
const skillHeal = () => 20 + 2 * baseStat("hp");   // สกิลพื้นฐาน: ต้องไม่เกินเพดานใน rules (users/hp)
const skillDef = (id) => SKILLS[id] || state.mySkills?.[id] || null;
const skillHealOf = (d) => (d.basic ? skillHeal() : d.power);
function skillCdLeft(id) {
  const d = skillDef(id), t = state.skillUse?.[id]?.ts;
  return d && typeof t === "number" ? Math.max(0, Math.ceil((d.cd * 1000 - (serverNow() - t)) / 1000)) : 0;
}
const skillReady = (id) => { const d = skillDef(id); return !!d && d.uses !== 0 && skillCdLeft(id) === 0; };
// ข้อความอธิบายสกิล (ใช้เป็น tooltip)
function skillDesc(d) {
  if (d.basic) return d.desc;
  const p = d.power;
  return ({
    power: `ตีโดนแน่ ดาเมจ ×${p}`, guard: `ลดดาเมจที่บอสสวนกลับ ${p}%`, dodge: "บอสสวนกลับรอบนี้พลาดแน่", heal: `ฟื้น HP ${p}`,
    sharp: `ค่าทอยโจมตีครั้งถัดไป +${p}`, smash: `ดาเมจปะทะครั้งถัดไป ×${p}`, pierce: "โจมตีครั้งถัดไปไม่ถูกหักด้วยค่า tough",
    brace: `60 วินาที ดาเมจที่โดนปะทะลด ${p}%`
  })[d.type] || d.name;
}
const skillList = (kind) => [
  ...Object.entries(SKILLS).filter(([, d]) => d.kind === kind),
  ...Object.entries(state.mySkills || {}).filter(([, d]) => d && d.kind === kind)
];
function skillLabel(d, cd) {
  const left = d.basic || d.uses === -1 ? "" : d.uses === 0 ? " (หมด)" : ` ×${d.uses}`;
  return `${d.icon} ${d.name}${left}${cd > 0 ? ` (${cd})` : ""}`;
}
// บันทึกการใช้สกิลลง update: คูลดาวน์ + (custom) ลดจำนวนครั้ง + (custom heal) ตัวบอกว่าฟื้นจากสกิลไหน
function skillUseWrites(u, id) {
  const uid = state.uid, d = skillDef(id);
  u[`skillState/${uid}/${id}`] = { ts: serverTimestamp() };
  if (!d.basic) {
    if (d.uses > 0) u[`skills/${uid}/${id}/uses`] = d.uses - 1;
    if (d.type === "heal") u[`skillMark/${uid}`] = { sid: id, ts: serverTimestamp() };
  }
}
// ท่าตั้งรับที่ยังมีผลอยู่ (พื้นฐาน + custom) → เลือกอันที่ลดดาเมจมากสุด
function braceInfo() {
  let best = { left: 0, pct: 0 };
  const check = (id, d) => {
    const t = state.skillUse?.[id]?.ts; if (typeof t !== "number") return;
    const left = Math.max(0, Math.ceil((PVP_BRACE_MS - (serverNow() - t)) / 1000));
    if (left > 0 && d.power > best.pct) best = { left, pct: d.power };
  };
  check("brace", SKILLS.brace);
  Object.entries(state.mySkills || {}).forEach(([id, d]) => { if (d && d.type === "brace") check(id, d); });
  return best;
}
const braceLeft = () => braceInfo().left;
// การสวนกลับของบอสเมื่อใช้สกิลป้องกัน: guard ลด power% / dodge พลาดทั้งหมด
function strikeWith(b, def) {
  if (def?.type === "dodge") return { total: 0, text: `${b.verb} (หลบพ้นทั้งหมด)` };
  const s = bossStrike(b);
  if (def?.type === "guard" && s.total > 0) { const t = Math.ceil(s.total * (1 - def.power / 100)); return { total: t, text: `${s.text} → ลดเหลือ −${t}` }; }
  return s;
}
// สร้างปุ่มสกิลครั้งเดียว แล้วอัปเดตข้อความ/สถานะทุกครั้งที่ render (ไม่สร้างใหม่ ปุ่มจะได้ไม่หลุดตอนกด)
function syncSkillButtons(box, kind, onClick, stateFn) {
  const list = skillList(kind), ids = new Set(list.map(([id]) => id));
  box.querySelectorAll("[data-sk]").forEach((b) => { if (!ids.has(b.dataset.sk)) b.remove(); });
  list.forEach(([id, d]) => {
    let b = box.querySelector(`[data-sk="${id}"]`);
    if (!b) { b = mk("button", "btn ghost sk-btn"); b.type = "button"; b.dataset.sk = id; b.addEventListener("click", () => onClick(id)); box.append(b); }
    b.title = skillDesc(d);
    stateFn(b, id, d);
  });
}
function renderSkillBar(box, onUse, blocked, p) {
  if (!box) return;
  syncSkillButtons(box, "pve", onUse, (b, id, d) => {
    const cd = skillCdLeft(id);
    b.disabled = !!blocked || cd > 0 || d.uses === 0 || (d.type === "heal" && p && p.hp >= maxHp());
    b.textContent = skillLabel(d, cd);
  });
}
// แถบสกิล PvP: สกิลโจมตี (กดเลือก → ใช้กับปุ่มโจมตีครั้งถัดไป) + ท่าตั้งรับ (ใช้ทันที)
function renderPvpSkillBar() {
  const box = $("pvp-skills"), hint = $("pvp-skill-hint"); if (!box) return;
  const p = state.profile, off = !p || p.hp <= 0 || !state.zone || state.zone === "safe";
  box.classList.toggle("hidden", off); hint.classList.toggle("hidden", off);
  if (off) { state.pvpSkill = null; return; }
  const stunned = effActive("stun");
  syncSkillButtons(box, "pvp", (id) => {
    const d = skillDef(id); if (!d) return;
    if (d.type === "brace") return useBrace(id);
    if (!skillReady(id)) return;
    state.pvpSkill = state.pvpSkill === id ? null : id; renderPvpSkillBar();
  }, (b, id, d) => {
    const cd = skillCdLeft(id), t = state.skillUse?.[id]?.ts;
    const act = d.type === "brace" && typeof t === "number" ? Math.max(0, Math.ceil((PVP_BRACE_MS - (serverNow() - t)) / 1000)) : 0;
    b.disabled = cd > 0 || d.uses === 0 || (d.type !== "brace" && stunned) || !!state.braceBusy;
    b.classList.toggle("on", state.pvpSkill === id);
    b.textContent = act > 0 ? `${d.icon} ตั้งรับอยู่ (${act})` : skillLabel(d, cd);
  });
  if (state.pvpSkill && !skillReady(state.pvpSkill)) state.pvpSkill = null;
  const sel = state.pvpSkill && skillDef(state.pvpSkill);
  hint.textContent = sel ? `ครั้งถัดไปที่กด "โจมตี" จะใช้ ${sel.icon} ${sel.name} (กดซ้ำเพื่อยกเลิก)` : 'สกิล PvP: เลือกสกิลโจมตีก่อน แล้วกด "โจมตี" ที่ผู้เล่น / ท่าตั้งรับกดใช้ได้ทันที';
}
async function useBrace(id = "brace") {
  if (!skillReady(id) || state.braceBusy || state.profile.hp <= 0) return;
  state.braceBusy = true; renderPvpSkillBar();
  try {
    const u = {}, d = skillDef(id); skillUseWrites(u, id);
    await update(ref(db), u);
    toast(`${d.icon} ตั้งท่ารับ 60 วินาที ดาเมจที่โดนปะทะลด ${d.power}%`);
    logLine(`${d.icon} คุณตั้งท่ารับ — ดาเมจที่โดนปะทะลดลง ${d.power}% ใน 60 วินาที`, "info");
  } catch (e) { toast(errMsg(e)); }
  finally { state.braceBusy = false; renderPvpSkillBar(); }
}
function listenSkills() {
  const refresh = () => { renderBoss(); renderWB(); renderPvpSkillBar(); };
  onValue(ref(db, "skillState/" + state.uid), (snap) => { state.skillUse = snap.val() || {}; refresh(); });
  onValue(ref(db, "skills/" + state.uid), (snap) => { state.mySkills = snap.val() || {}; refresh(); });
  setInterval(() => { if (state.boss) renderBoss(); renderPvpSkillBar(); }, 1000);
}

async function bossRound(action) {
  const bs = state.boss, b = bs && BOSSES[bs.boss], p = state.profile;
  if (!b || state.bossBusy || p.hp <= 0 || bs.hp <= 0) return;
  state.bossBusy = true; renderBoss();
  let killed = false;
  try {
    const u = {}, uid = state.uid; let hp = p.hp, strike = true, line = "", skillUsed = null;
    if (action.startsWith("skill:")) {
      const id = action.slice(6), sk = skillDef(id);
      if (!sk || sk.kind !== "pve" || !skillReady(id)) return;
      skillUsed = sk; skillUseWrites(u, id);
      if (sk.type === "power") {
        const w = equippedWeapon(), dmg = Math.floor(myDmg(w) * sk.power), left = Math.max(0, bs.hp - dmg);
        line = `${sk.icon} ${sk.name} — โจมตีโดนแน่ −${dmg}`;
        if (w) wearUpdates(u, w);
        u[`bossFights/${uid}/hp`] = left;
        if (left === 0) { strike = false; killed = true; }
      } else if (sk.type === "guard") line = `${sk.icon} ${sk.name} — ตั้งท่ารับ`;
      else if (sk.type === "dodge") line = `${sk.icon} ${sk.name} — เตรียมหลบ`;
      else if (sk.type === "heal") {
        if (hp >= maxHp()) return;
        hp = Math.min(maxHp(), hp + skillHealOf(sk));
        line = `${sk.icon} ${sk.name} +${hp - p.hp} HP`;
      }
    } else if (action === "attack") {
      const w = equippedWeapon(), r = d6(), mult = r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5;
      const dmg = Math.round(myDmg(w) * mult), left = Math.max(0, bs.hp - dmg);
      line = `🎲 ทอย ${r} — ` + (dmg ? `โจมตีโดน −${dmg}${r === 6 ? " (คริติคอล!)" : ""}` : "พลาด!");
      if (w && r !== 1) wearUpdates(u, w);
      if (dmg) u[`bossFights/${uid}/hp`] = left;
      if (left === 0) { strike = false; killed = true; }
    } else if (action === "bandage" || action === "medkit") {
      const it = state.inv[action]; if (!it || !(it.qty > 0)) return;
      const heal = ITEMS[action].heal;
      if (it.qty > 1) u[`inventory/${uid}/${action}/qty`] = it.qty - 1; else u[`inventory/${uid}/${action}`] = null;
      hp = Math.min(maxHp(), hp + heal);
      line = `${ITEMS[action].icon} ใช้${ITEMS[action].name} +${heal} HP`;
    } else if (action === "flee") {
      if (Math.random() < b.flee) { u[`bossFights/${uid}`] = null; strike = false; line = "🏃 คุณวิ่งหนีออกมาได้!"; }
      else line = "🏃 หนีไม่พ้น! มันขวางทางไว้";
    }
    if (strike) { const s = strikeWith(b, skillUsed); hp = Math.max(0, hp - s.total); line += ` • ${s.text}`; }
    if (hp !== p.hp) u[`users/${uid}/hp`] = hp;
    if (hp === 0) { delete u[`bossFights/${uid}/hp`]; u[`bossFights/${uid}`] = null; }   // ล้มลง → จบการสู้ (processDeath จัดการต่อ)
    await update(ref(db), u);
    bossLog(line);
    if (killed) { logLine(`${b.icon} คุณล้ม${b.name}ได้สำเร็จ!`, "combat"); bossLog(`🏆 ${b.name}ล้มลงแล้ว!`); }
    else if (hp === 0) logLine(`${b.icon} ${b.name}สู้คุณจนล้มลง…`, "system");
    else if (action === "flee" && !state.boss?.hp) logLine(`คุณหนี${b.name}มาได้`, "info");
  } catch (e) { toast(errMsg(e)); }
  finally { state.bossBusy = false; renderBoss(); }
  if (killed) await claimBossReward();
}

async function claimBossReward() {
  const bs = state.boss, b = bs && BOSSES[bs.boss];
  if (!b || bs.hp > 0 || state.bossBusy) return;
  state.bossBusy = true; renderBoss();
  try {
    const main = rollDrop(b.loot); let bonus = rollDrop(b.bonus); if (bonus === main) bonus = null;
    const u = { [`bossFights/${state.uid}`]: null };
    [main, bonus].forEach((id) => id && invAddUpdate(u, id, 1));
    await update(ref(db), u);
    const got = [main, bonus].filter(Boolean).map((id) => `${ITEMS[id].icon} ${ITEMS[id].name}`).join(" + ");
    logLine(`🏆 รางวัลจาก${b.name}: ${got}`, "combat"); toast(`ได้รับ ${got}`);
  } catch (e) { toast(errMsg(e)); }
  finally { state.bossBusy = false; renderBoss(); }
}

$("boss-attack").addEventListener("click", () => bossRound("attack"));
$("boss-bandage").addEventListener("click", () => bossRound("bandage"));
$("boss-medkit").addEventListener("click", () => bossRound("medkit"));
$("boss-flee").addEventListener("click", () => bossRound("flee"));
$("boss-claim").addEventListener("click", claimBossReward);

/* =========================================================
   10b) บอสโลก (World Boss) — GM/Owner เรียกที่โซนไหนก็ได้ ทุกคนในโซนช่วยกันตี HP ร่วมกัน
   ข้อมูล: worldBosses/{zone} (สถานะบอส) / worldBossHits/{zone}/{uid} (ดาเมจสะสมของแต่ละคน) / worldBossClaims/{zone}/{uid} (รับรางวัลแล้ว)
   ========================================================= */
const WB_REWARD_IDS = [...Object.keys(ITEMS).filter((id) => ITEMS[id].type !== "material" || id === "scrap" || id === "chem")].filter((id) => id !== "rotten_meat");
const wbOf = (z) => { const b = state.wb?.[z]; return b && typeof b.hp === "number" && typeof b.startedAt === "number" ? b : null; };
const wbExpired = (b) => !!b && b.hp > 0 && !!b.endsAt && b.endsAt <= serverNow();
const wbAlive = (b) => !!b && b.hp > 0 && !wbExpired(b);
const wbMine = (b) => { const h = state.wbHits?.[state.uid]; return h && h.bid === b.startedAt ? h : null; };
const wbRewardText = (b) => { if (b.rid === "skill" && b.rsk) return `📖 สกิล ${b.rsk.icon || "✨"} ${b.rsk.name}`; const d = ITEMS[b.rid]; return d ? `${d.icon} ${d.name}${d.type === "weapon" ? "" : " ×" + b.rqty}` : "—"; };

function renderWB() {
  const box = $("wb-box"); if (!box) return;
  const z = state.zone, b = z && z !== "safe" ? wbOf(z) : null, p = state.profile;
  if (!b || wbExpired(b) || !p) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  const dead = b.hp <= 0, mine = wbMine(b), claimed = state.wbClaim?.bid === b.startedAt;
  // บอสล้มแล้ว: คนที่รับรางวัลแล้ว/ไม่ได้ร่วมตี ไม่ต้องเห็นกล่องบอสอีก
  if (dead && (claimed || !mine)) { box.classList.add("hidden"); return; }
  // ผู้ร่วมตีที่ยังไม่รับรางวัล → รับให้อัตโนมัติ 1 ครั้งต่อบอส (ถ้าพลาดยังกดปุ่มเองได้)
  if (dead && mine && !claimed && !state.wbBusy && state.wbAutoClaimed !== b.startedAt) { state.wbAutoClaimed = b.startedAt; setTimeout(wbClaim, 300); }
  $("wb-title").textContent = `${b.icon || "👹"} ${b.name}`;
  $("wb-time").textContent = dead ? "ล้มแล้ว" : b.endsAt ? `หายไปใน ~${Math.max(1, Math.ceil((b.endsAt - serverNow()) / 60000))} นาที` : "";
  $("wb-tag").textContent = `${b.tag ? b.tag + " • " : ""}ตี ${b.hits} ครั้ง/รอบ ดาเมจ ${b.dmgLo}–${b.dmgHi} • รางวัล ${wbRewardText(b)}`;
  $("bar-wb").style.width = Math.max(0, (b.hp / b.max) * 100) + "%";
  $("txt-wb").textContent = `HP ${Math.max(0, b.hp)}/${b.max}`;
  const top = Object.values(state.wbHits || {}).filter((h) => h.bid === b.startedAt).sort((a, c) => c.total - a.total).slice(0, 3);
  $("wb-top").textContent = (top.length ? "🏅 " + top.map((h, i) => `${i + 1}. ${h.name || "?"} ${h.total}`).join("  ") : "ยังไม่มีใครโจมตี") + (mine ? ` • ของคุณ ${mine.total}` : "");
  const cd = Math.ceil(attackCooldownLeft() / 1000), stunned = effActive("stun");
  const atk = $("wb-attack"); atk.classList.toggle("hidden", dead);
  atk.disabled = !!state.wbBusy || p.hp <= 0 || cd > 0 || stunned;
  atk.textContent = state.wbBusy ? "กำลังต่อสู้…" : stunned ? "😵 มึนงง" : cd > 0 ? `พักแรง ${cd}` : "⚔️ โจมตีบอสโลก";
  const sb = $("wb-skills"); sb.classList.toggle("hidden", dead);
  renderSkillBar(sb, (id) => wbAttack(true, id), !!state.wbBusy || p.hp <= 0 || cd > 0 || stunned, p);
  const cl = $("wb-claim"); cl.classList.toggle("hidden", !dead || !mine || claimed); cl.disabled = !!state.wbBusy;
  if (dead && !mine) $("wb-top").textContent += " • คุณไม่ได้ร่วมโจมตี จึงไม่มีรางวัล";
  if (dead && claimed) $("wb-top").textContent += " • รับรางวัลแล้ว";
}

// [DEBUG บอสโลก] เมื่อ Firebase ปฏิเสธ จะพิมพ์ข้อมูลที่ส่ง + สถานะผู้เล่น/บอส ลง Console เพื่อใช้วิเคราะห์ (ลบได้เมื่อแก้เสร็จ)
function wbDebug(tag, e, u, b) {
  try {
    const p = state.profile || {};
    console.error("[WB-DEBUG]", tag, e?.code || e, JSON.stringify({
      update: u, boss: b, now: serverNow(), zone: state.zone,
      me: { uid: state.uid, role: p.role, hp: p.hp, zone: p.zone, equipped: p.equipped, lastAttack: p.lastAttack },
      stats: state.stats, buff: state.buff, effects: state.effects,
      weapon: equippedWeapon()?.it || null, myHits: state.wbHits?.[state.uid] || null, myClaim: state.wbClaim
    }, null, 1));
  } catch (x) { console.error("[WB-DEBUG] failed", x); }
}
async function wbAttack(retry = true, skill = null) {
  const z = state.zone, p = state.profile; let b = wbOf(z);
  if (!wbAlive(b) || state.wbBusy || p.hp <= 0 || z === "safe") return;
  if (effActive("stun")) return toast("😵 คุณมึนงง โจมตีไม่ได้ในตอนนี้");
  if (attackCooldownLeft() > 0) return toast("ยังพักแรงอยู่");
  const skd = skill ? skillDef(skill) : null;
  if (skill && (!skd || skd.kind !== "pve" || !skillReady(skill))) return toast("สกิลยังไม่พร้อม");
  if (skd?.type === "heal" && p.hp >= maxHp()) return toast("HP เต็มอยู่แล้ว");
  state.wbBusy = true; renderWB();
  try {
    const fresh = (await get(ref(db, `worldBosses/${z}`))).val();   // อ่าน HP ล่าสุดก่อนตี (หลายคนตีพร้อมกันได้)
    b = fresh && typeof fresh.hp === "number" ? { ...b, ...fresh } : b;
    if (!wbAlive(b)) { toast("บอสโลกล้มไปแล้วหรือหายไปแล้ว"); return; }
    const uid = state.uid, u = {}, w = equippedWeapon(), r = d6(), sk = skd, atk = !sk || sk.type === "power";
    const mult = sk?.type === "power" ? sk.power : r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5;
    const dmg = atk ? Math.min(b.hp, Math.floor(myDmg(w) * mult)) : 0;   // floor: ต้องไม่เกินเพดาน (×1.5 หรือ power ของสกิล custom) ที่ rules ตรวจ
    u[`users/${uid}/lastAttack`] = serverTimestamp();
    if (sk) skillUseWrites(u, skill);
    if (w && atk && (sk?.type === "power" || r !== 1)) wearUpdates(u, w);
    let line = sk ? (sk.type === "power" ? `${sk.icon} ${sk.name} — โจมตี${b.name}โดนแน่ −${dmg}` : `${sk.icon} ${sk.name}`)
      : `🎲 ทอย ${r} — ` + (dmg ? `โจมตี${b.name}โดน −${dmg}${r === 6 ? " (คริติคอล!)" : ""}` : "พลาด!");
    let killed = false;
    if (dmg) {
      const mine = wbMine(b);
      u[`worldBossHits/${z}/${uid}`] = { bid: b.startedAt, last: dmg, total: (mine?.total || 0) + dmg, ts: serverTimestamp(), name: p.username, ...(w ? { wpn: w.it.id } : {}), ...(sk && !sk.basic && sk.type === "power" ? { sk: skill } : {}) };
      u[`worldBosses/${z}/hp`] = b.hp - dmg;
      killed = b.hp - dmg <= 0;
    }
    let hp = p.hp;
    if (sk?.type === "heal") { hp = Math.min(maxHp(), hp + skillHealOf(sk)); line += ` +${hp - p.hp} HP`; }
    if (!killed) {
      const s = strikeWith({ hits: b.hits, acc: b.acc, dmg: [b.dmgLo, b.dmgHi], verb: `${b.name}โจมตีกลับ` }, sk);
      hp = Math.max(0, hp - s.total); line += ` • ${s.text}`;
      if (hp !== p.hp) u[`users/${uid}/hp`] = hp;
    }
    state.wbDbgU = u;
    await update(ref(db), u);
    logLine(`${b.icon || "👹"} ${line}`, "combat");
    if (killed) logLine(`🏆 ${b.name}ล้มลงแล้ว! กดรับรางวัลได้เลย`, "system");
    else if (hp === 0) logLine(`${b.icon || "👹"} ${b.name}สู้คุณจนล้มลง…`, "system");
  } catch (e) {
    if (String(e?.code || e).includes("PERMISSION_DENIED")) wbDebug(retry ? "attack" : "attack-retry", e, state.wbDbgU, b);
    if (retry && String(e?.code || e).includes("PERMISSION_DENIED")) {
      state.wbBusy = false; await new Promise((r) => setTimeout(r, 1200)); return wbAttack(false, skill);   // ข้อมูลในเครื่องอาจล้าหลัง/มีคนตีพร้อมกัน ลองใหม่ 1 ครั้ง
    }
    toast(errMsg(e));
  } finally { state.wbBusy = false; renderWB(); }
}

async function wbClaim() {
  const z = state.zone, b = wbOf(z);
  if (!b || b.hp > 0 || state.wbBusy) return;
  if (!wbMine(b)) return toast("ต้องร่วมโจมตีบอสก่อนถึงจะรับรางวัลได้");
  if (state.wbClaim?.bid === b.startedAt) return toast("รับรางวัลไปแล้ว");
  state.wbBusy = true; renderWB();
  try {
    const u = { [`worldBossClaims/${z}/${state.uid}`]: { bid: b.startedAt, ts: serverTimestamp() } }, def = ITEMS[b.rid];
    if (b.rid === "skill") u[`skills/${state.uid}/wb_${z}_${b.startedAt}`] = skillFields(b.rsk);   // รางวัลเป็นสกิล: เข้า skills ไม่ใช่ inventory
    else if (def.type === "weapon") u[`inventory/${state.uid}/wb_${z}_${b.startedAt}`] = { id: b.rid, qty: 1, dur: b.rdur ?? Math.min(30, def.maxDur) };
    else u[`inventory/${state.uid}/${b.rid}`] = { id: b.rid, qty: Math.min(99, (state.inv[b.rid]?.qty || 0) + b.rqty) };
    state.wbDbgU = u;
    await update(ref(db), u);
    logLine(`🏆 รางวัลจาก${b.name}: ${wbRewardText(b)}`, "combat"); toast(`ได้รับ ${wbRewardText(b)}`);
  } catch (e) { wbDebug("claim", e, state.wbDbgU, b); toast(errMsg(e)); }
  finally { state.wbBusy = false; renderWB(); }
}
$("wb-attack").addEventListener("click", () => wbAttack());
$("wb-claim").addEventListener("click", wbClaim);
$("wb-title").parentElement.addEventListener("click", () => $("wb-box").classList.toggle("open"));   // มือถือ: แตะหัวกล่องเพื่อดูรายละเอียด/อันดับดาเมจ

function renderAdminWB() {
  const ul = $("adm-wb-list"); if (!ul || !isStaff()) return;
  ul.innerHTML = "";
  Object.entries(state.wb || {}).forEach(([z, b]) => {
    if (!ZONES[z] || typeof b?.hp !== "number") return;
    const li = mk("li");
    li.append(mk("span", "", `${b.icon || "👹"} ${b.name} @ ${ZONES[z].name} — HP ${Math.max(0, b.hp)}/${b.max}${b.hp <= 0 ? " (ล้มแล้ว)" : wbExpired(b) ? " (หมดเวลา)" : ""}`));
    li.append(btn("ลบ", () => wbRemove(z), "btn ghost mini"));
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีบอสโลก"));
}

async function wbRemove(z) {
  try {
    await update(ref(db), { [`worldBosses/${z}`]: null, [`worldBossHits/${z}`]: null, [`worldBossClaims/${z}`]: null });
    toast("ลบบอสโลกแล้ว");
  } catch (e) { toast(errMsg(e)); }
}

function buildAdminWB() {
  fillSelect($("adm-wb-zone"), Object.entries(ZONES).filter(([id]) => id !== "safe").map(([id, z]) => [id, `${z.icon} ${z.name}`]));
  fillSelect($("adm-wb-reward"), [...WB_REWARD_IDS.map((id) => [id, `${ITEMS[id].icon} ${ITEMS[id].name}${ITEMS[id].type === "weapon" ? " (อาวุธ)" : ""}`]), ["skill", "📖 สกิลเอง (custom)"]]);
  buildSkillBox("adm-wb-skill-box", "adm-wb-spk-");
  syncWbRewardFields();
}
function syncWbRewardFields() {
  const isSk = $("adm-wb-reward").value === "skill";
  $("adm-wb-skill-box").classList.toggle("hidden", !isSk);
  $("adm-wb-rqty").classList.toggle("hidden", isSk);
  $("adm-wb-rdur").classList.toggle("hidden", isSk);
}
$("adm-wb-reward").addEventListener("change", syncWbRewardFields);

$("adm-wb-spawn").addEventListener("click", async () => {
  if (!isStaff()) return;
  const z = $("adm-wb-zone").value, name = $("adm-wb-name").value.trim().slice(0, 30);
  if (!name) return toast("ใส่ชื่อบอสก่อน");
  if (wbAlive(wbOf(z))) return toast("โซนนี้มีบอสโลกอยู่แล้ว — ลบของเดิมก่อน");
  const num = (id, lo, hi, def) => { const n = parseInt($(id).value, 10); return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : def)); };
  const hp = num("adm-wb-hp", 1, 100000, 2000), dlo = num("adm-wb-dlo", 1, 200, 15), dhi = Math.max(dlo, num("adm-wb-dhi", 1, 200, 30));
  const hits = num("adm-wb-hits", 1, 5, 1), acc = num("adm-wb-acc", 10, 100, 75) / 100, mins = num("adm-wb-mins", 0, 700, 0);
  const rid = $("adm-wb-reward").value, isSk = rid === "skill", def = isSk ? null : ITEMS[rid], isW = !isSk && def.type === "weapon";
  const sk = isSk ? readSkillForm("adm-wb-spk-") : null; if (isSk && !sk) return;
  const icon = $("adm-wb-icon").value.trim().slice(0, 4), tag = $("adm-wb-tag").value.trim().slice(0, 80), intro = $("adm-wb-intro").value.trim().slice(0, 120);
  const b = {
    name, hp, max: hp, zone: z, by: state.profile.username, startedAt: serverTimestamp(), dmgLo: dlo, dmgHi: dhi, hits, acc, rid, rqty: isW || isSk ? 1 : num("adm-wb-rqty", 1, 50, 1),
    ...(isSk ? { rsk: skillFields(sk) } : {}),
    ...(isW ? { rdur: num("adm-wb-rdur", 1, 60, Math.min(30, def.maxDur)) } : {}),
    ...(icon ? { icon } : {}), ...(tag ? { tag } : {}), ...(intro ? { intro } : {}), ...(mins ? { endsAt: serverNow() + mins * 60000 } : {})
  };
  try {
    const annId = push(ref(db, "announcements")).key;
    await update(ref(db), {
      [`worldBosses/${z}`]: b, [`worldBossHits/${z}`]: null, [`worldBossClaims/${z}`]: null,
      [`announcements/${annId}`]: { text: `${icon || "👹"} บอสโลก「${name}」ปรากฏตัวที่${ZONES[z].name}! ไปช่วยกันล้มมัน${intro ? " — " + intro : ""}`.slice(0, 200), zone: "all", by: state.profile.username, ts: serverTimestamp() }
    });
    toast(`เรียกบอสโลกที่ ${ZONES[z].name} แล้ว`);
    trimList("announcements", ANN_LIMIT).catch(() => {});
  } catch (e) { toast(errMsg(e)); }
});

function listenWorldBoss() {
  onValue(ref(db, "worldBosses"), (snap) => {
    const nu = snap.val() || {};
    Object.entries(nu).forEach(([z, b]) => {
      const was = state.wb?.[z];
      if (was && was.startedAt === b.startedAt && was.hp > 0 && b.hp <= 0 && z === state.zone) logLine(`🏆 ${b.name}ล้มลงแล้ว! ผู้ที่ร่วมโจมตีกดรับรางวัลได้`, "system");
    });
    state.wb = nu; renderWB(); renderAdminWB();
  });
  setInterval(() => { renderWB(); renderAdminWB(); }, 1000);
}

/* =========================================================
   11) ต่อสู้ (หักความหิว และแก้ไขแชทต่อสู้)
   ========================================================= */
const myDmg = (w) => Math.max(1, attackDmg(w ? w.it.id : null, w?.it) + statOf("str"));
const attackDmg = (id, custom) => (!id ? UNARMED_DMG : id === "custom" ? Math.max(1, custom?.dmg || 25) : (ITEMS[id]?.dmg || UNARMED_DMG));

function attackCooldownLeft() {
  const last = state.profile?.lastAttack;
  if (typeof last !== "number") return 0;
  return Math.max(0, ATTACK_COOLDOWN - (serverNow() - last));
}

function updateAttackButtons() {
  const left = Math.ceil(attackCooldownLeft() / 1000);
  document.querySelectorAll(".atk-btn").forEach((b) => {
    const pending = state.pending.has(b.dataset.uid);
    const stunned = effActive("stun");
    b.disabled = left > 0 || pending || stunned;
    b.textContent = pending ? "รอตอบโต้…" : stunned ? "มึนงง" : left > 0 ? `พักแรง ${left}` : "โจมตี";
  });
}

async function attack(targetUid, targetName = "เป้าหมาย") {
  if (state.profile.hp <= 0) return;
  if (state.zone === "safe") return toast("Safe Zone ต่อสู้ไม่ได้");
  if (effActive("stun")) return toast("😵 คุณมึนงง โจมตีไม่ได้จนกว่าจะหายหรือรักษา");
  if (state.attacking || state.pending.has(targetUid)) return toast(`การปะทะกับ ${targetName} ยังไม่จบ รอผลก่อน`);
  const cd = attackCooldownLeft();
  if (cd > 0) return toast(`ร่างกายยังล้าจากการปะทะครั้งก่อน พักอีก ${Math.ceil(cd / 1000)} วินาที`);
  const skd = state.pvpSkill ? skillDef(state.pvpSkill) : null;
  const skId = skd && skd.kind === "pvp" && skd.type !== "brace" ? state.pvpSkill : null;
  if (skId && !skillReady(skId)) { state.pvpSkill = null; renderPvpSkillBar(); return toast("สกิลยังไม่พร้อม"); }
  const sty = skId ? skd.type : null;

  state.attacking = true; state.pending.add(targetUid); updateAttackButtons();

  const p = state.profile;
  const fd = curFood();
  const wt = curWater();
  const starving = (fd === 0 || wt === 0);

  let newHp = p.hp;
  let attackerDied = false;
  const selfUpdate = { [`users/${state.uid}/lastAttack`]: serverTimestamp() };
  hungerShift(selfUpdate, "food", -2); hungerShift(selfUpdate, "water", -2);

  if (starving) {
    newHp = Math.max(1, p.hp - 5);   // ฝืนโจมตีตอนหิวไม่ทำให้ตายเอง
    selfUpdate[`users/${state.uid}/hp`] = newHp;
    toast("คุณฝืนโจมตีขณะหิวโซ เสีย HP 5 หน่วย!");
  }

  const w = equippedWeapon();
  const dm = effV("dice");
  const rb = sty === "sharp" ? skd.power : 0;   // โจมตีเฉียบ: ค่าทอย +2 (rules บวกเพดานให้เท่ากัน)
  const roll = Math.max(1, Math.min(6 + Math.max(0, dm) + rb, d6() + dm + rb));   // rules จำกัดเพดานตามค่า dice ที่ติดอยู่
  const wd = sty === "smash" ? Math.floor(myDmg(w) * skd.power) : myDmg(w);   // ฟาดหนัก: ×1.3 (floor ไม่ให้เกินเพดานใน rules)
  // คีย์ = uid ผู้โจมตี → 1 คนค้างการโจมตีใส่เป้าหมายเดียวกันได้ทีละครั้งเท่านั้น
  const attackData = {
    from: state.uid, fromName: p.username, roll, zone: state.zone, ts: serverTimestamp(),
    ...(w ? { wpn: w.it.id === "custom" ? "custom" : w.it.id } : {}),
    wdmg: wd,
    ...(skId ? { sk: skId, ...(skd.basic ? {} : { skt: skd.type, skn: skd.name, ski: skd.icon }) } : {})
  };
  if (skId) skillUseWrites(selfUpdate, skId);

  try {
    await update(ref(db), { [`attacks/${targetUid}/${state.uid}`]: attackData, ...selfUpdate });

    if (attackerDied) {
      state.pending.delete(targetUid);
      logLine("คุณหิวโซและฝืนร่างกายโจมตีศัตรู จนหมดสติไป... ฟื้นอีกทีที่ Safe Zone", "system");
      await enterZone("safe", false, true);
      return;
    }

    if (skId) { state.pvpSkill = null; renderPvpSkillBar(); }
    toast(`${skId ? skd.icon + " " : ""}คุณพุ่งเข้าใส่ ${targetName} (ทอยได้ ${roll}) — รอเขาตอบโต้...`);
    watchAttack(targetUid, targetName, w, skId ? skd : null);
  } catch (e) {
    state.pending.delete(targetUid);
    toast(errMsg(e));
  } finally {
    state.attacking = false; updateAttackButtons();
  }
}

// รอผลการโจมตี: ถ้าเป้าหมายตอบโต้ (ลบคำสั่งโจมตี) ก็จบ ถ้าเงียบเกินเวลาจะฟาดฟรี
function watchAttack(targetUid, targetName, w, sk = null) {
  const aRef = ref(db, `attacks/${targetUid}/${state.uid}`);
  let seen = false, finished = false, off = null, timer = null;
  const cleanup = () => {
    if (finished) return; finished = true;
    if (off) off(); clearTimeout(timer);
    state.pending.delete(targetUid); updateAttackButtons();
  };
  off = onValue(aRef, (s) => { if (s.exists()) seen = true; else if (seen) cleanup(); });
  timer = setTimeout(async () => {
    if (finished) return;
    try { await freeHit(targetUid, targetName, w, sk); } catch (e) { console.error(e); }
    cleanup();
  }, ATTACK_FALLBACK);
}

async function freeHit(targetUid, targetName, w, sk = null) {
  const p = state.profile;
  const aRef = ref(db, `attacks/${targetUid}/${state.uid}`);
  if (!(await get(aRef)).exists()) return;
  const hpSnap = await get(ref(db, `users/${targetUid}/hp`));
  const tHp = hpSnap.val();
  if (typeof tHp !== "number") return;

  const tStats = (await get(ref(db, `stats/${targetUid}`))).val() || {};
  const tBuff = (await get(ref(db, `buffs/${targetUid}`))).val();
  const tb = (k) => (tBuff && tBuff.bstart + (tBuff.mins || 0) * 60000 - 1000 > serverNow() ? tBuff[k] || 0 : 0);
  const tIsZombie = state.players[targetUid]?.faction === "zombie";
  const dodged = tIsZombie && Math.random() < Math.max(0, DODGE_PER_POINT * ((tStats.agi || 0) + tb("agi")));
  const base = sk?.type === "smash" ? Math.floor(myDmg(w) * sk.power) : myDmg(w), tough = sk?.type === "pierce" ? 0 : (tStats.tough || 0) + tb("tough");
  const dmg = Math.min(base, Math.max(1, base - tough));
  const left = Math.max(0, tHp - dmg);
  let text = dodged
    ? `🏃 ${p.username} ฟาดใส่ ${targetName} แต่ถูกหลบได้! 💨`
    : `🏃 ${targetName} ไม่ทันตั้งตัว! ${p.username} ฟาดเข้าเป้า −${dmg} HP`;

  const u = { [`attacks/${targetUid}/${state.uid}`]: null };
  if (w) wearUpdates(u, w);
  if (!dodged) {
    u[`users/${targetUid}/hp`] = left;
    if (left === 0) text += ` — ${targetName} ล้มลง!`;
  }
  if (p.faction === "zombie" && !dodged) {
    u[`bites/${state.uid}/${targetUid}`] = { ts: serverTimestamp(), food: BITE_FOOD }; text += " 🦷";
    if (state.players[targetUid]?.faction === "human") { u[`users/${targetUid}/infected`] = serverTimestamp(); text += " 🦠"; }
  }

  const chatRef = push(ref(db, "chats/" + state.zone));
  u[`chats/${state.zone}/${chatRef.key}`] = { uid: state.uid, name: p.username, faction: p.faction, text, type: "combat", ts: serverTimestamp() };

  await update(ref(db), u);
  trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});
}

function listenAttacks() {
  onChildAdded(ref(db, "attacks/" + state.uid), (s) => {
    state.attackQueue = state.attackQueue.then(() => resolveAttack(s.key, s.val())).catch(console.error);
  });
}

async function resolveAttack(key, a) {
  const aRef = ref(db, `attacks/${state.uid}/${key}`);
  const p = state.profile;
  if (serverNow() - a.ts > 35000 || a.zone !== state.zone) { await remove(aRef); return; }

  const defRoll = d6() + effV("dice");
  const w = equippedWeapon();
  const u = { [`attacks/${state.uid}/${key}`]: null };
  if (w) wearUpdates(u, w);

  const hit = a.roll > defRoll;
  const dodged = hit && p.faction === "zombie" && Math.random() < dodgeChance();
  const landed = hit && !dodged;
  const rawDmg = a.wdmg ?? attackDmg(a.wpn, { dmg: a.wdmg });
  const tough = a.sk === "pierce" || a.skt === "pierce" ? 0 : statOf("tough");   // ทะลวงเกราะ: ไม่หักค่า tough
  const bi = braceInfo(), braced = landed && bi.left > 0;                        // ท่าตั้งรับ: ดาเมจที่โดนลดตาม %
  let dmg = landed ? Math.max(1, rawDmg - tough) : 0;
  if (braced) dmg = Math.max(1, Math.floor(dmg * (1 - bi.pct / 100)));
  const skTxt = a.sk ? (SKILLS[a.sk] ? ` (${SKILLS[a.sk].icon}${SKILLS[a.sk].name})` : a.skn ? ` (${a.ski || ""}${a.skn})` : "") : "";

  const newHp = Math.max(0, p.hp - dmg);
  let text = `⚔ ${a.fromName}${skTxt} ทอย ${a.roll} vs ${p.username} ทอยป้องกันได้ ${defRoll} → `;
  
  if (landed) {
    text += `${a.fromName} โจมตีโดน! −${dmg} HP${braced ? " (🧱 ท่าตั้งรับลดดาเมจ)" : ""}`;
    if (state.players[key]?.faction === "zombie") {
      u[`bites/${key}/${state.uid}`] = { ts: serverTimestamp(), food: BITE_FOOD }; text += " 🦷";
      if (p.faction === "human") { u[`users/${state.uid}/infected`] = serverTimestamp(); text += " 🦠"; }
    }
    u[`users/${state.uid}/hp`] = newHp;
    if (newHp === 0) text += ` — ${p.username} ล้มลง!`;
  } else if (dodged) {
    text += `${p.username} หลบได้ในจังหวะสุดท้าย! 💨`;
  } else {
    text += a.roll === defRoll ? "เสมอ ไม่มีใครโดน" : `${p.username} ป้องกันได้`;
  }

  const chatRef = push(ref(db, "chats/" + state.zone));
  // แก้ไขบักตรงนี้: ใช้ uid ของคนโจมตีเหมือนเดิมแทนการใช้คำว่า "system"
  u[`chats/${state.zone}/${chatRef.key}`] = { uid: state.uid, name: p.username, faction: p.faction, text, type: "combat", ts: serverTimestamp() };

  await update(ref(db), u);
  trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});

}

/* =========================================================
   12) Admin Console
   ========================================================= */
function fillSelect(sel, entries) { sel.innerHTML = ""; entries.forEach(([v, label]) => sel.append(new Option(label, v))); }

// ช่องกรอกสเตตัสของไอเทม custom: ถาวร 6 ช่อง + ชั่วคราว 6 ช่อง + ระยะเวลา (P = "adm-" เสกไอเทม / "adm-q-" รางวัลภารกิจ)
function buildStatInputs(P) {
  const box = $(P + "stat-box"); if (!box) return;
  box.innerHTML = ""; box.style.cssText = "display:grid;gap:8px";
  const num = (id, ph, min, max) => { const i = document.createElement("input"); i.type = "number"; i.min = min; i.max = max; i.id = id; i.placeholder = ph; return i; };
  box.append(mk("p", "muted", `สเตตัสถาวร: ใส่ค่าบวก = เพิ่ม / ค่าลบ = ลด (สูงสุด +${ITEM_STAT_CAP}, ลดได้ไม่เกินขีดต่ำสุดของแต่ละช่อง) — มีผลเฉพาะสเตตัสของฝ่ายผู้ใช้`));
  STAT_KEYS.forEach((k) => box.append(num(`${P}sp-${k}`, `ถาวร ${STAT_LABEL[k]} (${STAT_MIN[k]} ถึง +${ITEM_STAT_CAP})`, STAT_MIN[k], ITEM_STAT_CAP)));
  box.append(mk("p", "muted", "สเตตัสชั่วคราว: บัฟ/ดีบัฟมีเวลา (ใช้ชิ้นใหม่จะแทนที่บัฟเดิม)"));
  STAT_KEYS.forEach((k) => box.append(num(`${P}sb-${k}`, `ชั่วคราว ${STAT_LABEL[k]} (${STAT_MIN[k]} ถึง +${ITEM_STAT_CAP})`, STAT_MIN[k], ITEM_STAT_CAP)));
  box.append(num(`${P}sb-min`, `ระยะเวลาบัฟ (นาที 1-${BUFF_MAX_MIN} ไม่ใส่ = 10)`, 1, BUFF_MAX_MIN));
  box.append(mk("p", "muted", "สถานะพิเศษ: ทำงานทุก 15 วินาทีขณะผู้เล่นออนไลน์ (HP ไม่ลดต่ำกว่า 1) — ใส่ค่า/ติ๊ก = เปิดใช้ ใช้ชิ้นใหม่จะแทนที่สถานะชนิดเดิม"));
  box.append(num(`${P}fx-bleed`, "🩸 เลือดไหล: เสีย HP ต่อรอบ (1-20)", 1, 20));
  box.append(num(`${P}fx-poison`, "☠️ พิษ: เสีย HP ต่อรอบ + พลังงาน 2 (1-20)", 1, 20));
  box.append(num(`${P}fx-hot`, "💚 ฟื้นฟู: ได้ HP ต่อรอบ (1-20)", 1, 20));
  box.append(num(`${P}fx-dice`, "🎯 บวก/ลบค่าทอยปะทะ (−5 ถึง +5)", -5, 5));
  const cb = (id, label) => { const l = mk("label", "", ""); l.style.cssText = "display:flex;gap:8px;align-items:center;font-weight:400"; const i = document.createElement("input"); i.type = "checkbox"; i.id = id; i.style.width = "auto"; l.append(i, document.createTextNode(label)); return l; };
  box.append(cb(`${P}fx-stun`, "😵 มึนงง (โจมตี/ค้นหาไม่ได้)"));
  box.append(num(`${P}fx-min`, `ระยะเวลาสถานะ (นาที 1-${FX_MAX_MIN} ไม่ใส่ = 5)`, 1, FX_MAX_MIN));
  box.append(mk("p", "muted", "รักษาสถานะ: กินแล้วล้างสถานะที่ติ๊กออก"));
  FX_CURE_KEYS.forEach((t) => box.append(cb(`${P}fx-c-${t}`, `รักษา ${FX_TYPES[t].icon} ${FX_TYPES[t].name}`)));
}

function buildAdmin() {
  buildAdminWB();
  fillSelect($("adm-ann-zone"), [["all", "ทุกโซน"], ...Object.entries(ZONES).map(([id, z]) => [id, "เฉพาะ " + z.name])]);
  fillSelect($("adm-target-zone"), Object.entries(ZONES).map(([id, z]) => [id, z.name]));
  fillSelect($("adm-clear-zone"), Object.entries(ZONES).map(([id, z]) => [id, z.name]));
  fillSelect($("adm-ev-zone"), Object.entries(ZONES).filter(([id]) => id !== "safe").map(([id, z]) => [id, z.name]));
  fillSelect($("adm-ev-type"), Object.entries(EVENT_TYPES).map(([id, t]) => [id, `${t.icon} ${t.name}`]));
  const itemOpts = Object.entries(ITEMS).map(([id, i]) => [id, `${i.icon} ${i.name}`]);
  itemOpts.push(["custom", "✨ สร้างอาวุธเอง (Custom)"], ["custom_food", "🍽️ สร้างไอเทมเอง (อาหาร/น้ำ/สเตตัส/พิเศษ)"], ["skill", "📖 สกิลเอง (custom — ได้เป็นสกิล ไม่ใช่ไอเทม)"]);
  fillSelect($("adm-item"), itemOpts);
  fillSelect($("adm-q-item"), itemOpts);
  buildStatInputs("adm-"); buildStatInputs("adm-q-"); buildStatEditor();
  buildSkillBox("adm-skill-box", "adm-spk-"); buildSkillBox("adm-q-skill-box", "adm-q-spk-");
  fillSelect($("adm-q-need"), [["", "ไม่ต้องส่งของ (ทำตามที่บรรยาย)"], ...NEED_ITEMS.map((id) => [id, `ต้องส่ง ${ITEMS[id].icon} ${ITEMS[id].name}`])]);
}

$("btn-admin").addEventListener("click", () => {
  if (!isStaff()) return;
  $("adm-clear-zone").value = state.zone; watchMutes();
  $("admin-modal").classList.remove("hidden");
});
$("adm-close").addEventListener("click", () => $("admin-modal").classList.add("hidden"));
$("adm-mode").addEventListener("change", (e) => {
  $("adm-target-id").classList.toggle("hidden", e.target.value !== "player");
  $("adm-target-zone").classList.toggle("hidden", e.target.value !== "zone");
});
["adm-", "adm-q-"].forEach((P) => $(P + "item").addEventListener("change", (e) => {
  $(P + "custom-fields").classList.toggle("hidden", e.target.value !== "custom");
  $(P + "food-fields").classList.toggle("hidden", e.target.value !== "custom_food");
  $(P + "skill-box").classList.toggle("hidden", e.target.value !== "skill");
  $(P + "qty").classList.toggle("hidden", e.target.value === "skill");   // สกิลไม่มีจำนวนชิ้น
}));

$("adm-ann-send").addEventListener("click", async () => {
  const text = $("adm-ann-text").value.trim().slice(0, 200); if (!text) return;
  try {
    await push(ref(db, "announcements"), { text, zone: $("adm-ann-zone").value, by: state.profile.username, ts: serverTimestamp() });
    $("adm-ann-text").value = ""; toast("ส่งประกาศแล้ว");
    trimList("announcements", ANN_LIMIT).catch(() => {});
  } catch (e) { toast(errMsg(e)); }
});

// P = คำนำหน้า id ของฟอร์ม: "adm-" = เสกไอเทม, "adm-q-" = รางวัลภารกิจ
function readAdminItem(P = "adm-") {
  const itemId = $(P + "item").value;
  // สกิล: คืน skill (null ถ้ากรอกไม่ผ่าน — readSkillForm toast บอกเหตุผลแล้ว) ผู้เรียกต้องเช็กก่อนใช้
  if (itemId === "skill") return { itemId, skill: readSkillForm(P + "spk-") };
  const qty = Math.max(1, Math.min(99, parseInt($(P + "qty").value, 10) || 1));
  const isFood = itemId === "custom_food";
  let customData = null, def = ITEMS[itemId];

  if (itemId === "custom") {
    const cName = $(P + "custom-name").value.trim() || "อาวุธปริศนา";
    const cDmg = parseInt($(P + "custom-dmg").value, 10) || 10;
    const cDur = parseInt($(P + "custom-dur").value, 10) || 10;
    customData = { name: cName, dmg: cDmg, dur: cDur };
    def = { name: cName, type: "weapon", maxDur: cDur };
  }
  if (isFood) {
    const num = (id) => Math.max(-100, Math.min(100, parseInt($(id).value, 10) || 0));
    customData = { name: $(P + "food-name").value.trim().slice(0, 40) || "ไอเทมปริศนา", icon: [...$(P + "food-icon").value.trim()].slice(0, 2).join(""), food: num(P + "food-food"), water: num(P + "food-water"), heal: num(P + "food-hp"), stamina: num(P + "food-st") };
    // มีค่าอย่างน้อย 1 ช่อง = ใช้ได้ (อาหาร/น้ำ/ยา/ชูกำลัง) / เว้นว่างหมด = ไอเทมพิเศษ ใช้ไม่ได้ (ของสะสม)
    const gs = (id, k) => Math.max(STAT_MIN[k], Math.min(ITEM_STAT_CAP, parseInt($(id).value, 10) || 0));
    STAT_KEYS.forEach((k) => { customData["s_" + k] = gs(`${P}sp-${k}`, k); customData["b_" + k] = gs(`${P}sb-${k}`, k); });
    customData.bmin = STAT_KEYS.some((k) => customData["b_" + k]) ? Math.max(1, Math.min(BUFF_MAX_MIN, parseInt($(`${P}sb-min`).value, 10) || 10)) : 0;
    ["bleed", "poison", "hot"].forEach((t) => { customData["e_" + t] = Math.max(0, Math.min(20, parseInt($(`${P}fx-${t}`).value, 10) || 0)); });
    customData.e_dice = Math.max(-5, Math.min(5, parseInt($(`${P}fx-dice`).value, 10) || 0));
    customData.e_stun = $(`${P}fx-stun`).checked ? 1 : 0;
    FX_CURE_KEYS.forEach((t) => { customData["c_" + t] = $(`${P}fx-c-${t}`).checked ? 1 : 0; });
    customData.emin = FX_KEYS.some((t) => customData["e_" + t]) ? Math.max(1, Math.min(FX_MAX_MIN, parseInt($(`${P}fx-min`).value, 10) || 5)) : 0;
    customData.type = (customData.food || customData.water || customData.heal || customData.stamina || hasStatFx(customData) || hasFx(customData)) ? "consumable" : "material";
    def = { name: customData.name, type: customData.type };
  }
  const single = def.type === "weapon" || isFood;   // ไอเทมที่วางบนพื้นทีละชิ้น
  return { itemId, qty, isFood, customData, def, single };
}

// เสกสกิล: เข้าผู้เล่นโดยตรง (เหมือนมอบสกิล) หรือวาง "ม้วนสกิล" ไว้กลางโซน — คนแรกที่กดเรียนรู้จะได้สกิล (ม้วนหายไป)
async function spawnSkill(sk) {
  try {
    if ($("adm-mode").value === "zone") {
      const z = $("adm-target-zone").value;
      await push(ref(db, "zoneItems/" + z), { id: "skill", qty: 1, ...sk });
      toast(`วางม้วนสกิล ${sk.icon} ${sk.name} ไว้ใน ${ZONES[z].name} แล้ว (คนแรกที่เรียนรู้จะได้ไป)`);
    } else {
      const target = $("adm-target-id").value.trim();
      if (!target) return toast("ใส่ Player ID ก่อน");
      const t = await get(ref(db, "users/" + target));
      if (!t.exists()) return toast("ไม่พบ Player ID นี้");
      const k = push(ref(db, `skills/${target}`)).key;
      await set(ref(db, `skills/${target}/${k}`), sk);
      toast(`เสกสกิล ${sk.icon} ${sk.name} ให้ ${t.val().username} แล้ว`);
    }
  } catch (e) { toast(errMsg(e)); }
}

$("adm-spawn").addEventListener("click", async () => {
  const R = readAdminItem();
  if (R.itemId === "skill") { if (R.skill) await spawnSkill(R.skill); return; }
  const { itemId, qty, isFood, customData, def, single } = R;

  try {
    if ($("adm-mode").value === "zone") {
      const z = $("adm-target-zone").value;
      const n = single ? Math.min(qty, 10) : 1;
      for (let i = 0; i < n; i++) {
        await push(ref(db, "zoneItems/" + z), {
          id: itemId, qty: single ? 1 : qty,
          ...(def.type === "weapon" ? { dur: def.maxDur } : {}),
          ...(itemId === "custom" ? { name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon" } : {}),
          ...(isFood ? foodFields(customData) : {})
        });
      }
      toast(`วาง ${def.name} ไว้ใน ${ZONES[z].name} แล้ว`);
    } else {
      const target = $("adm-target-id").value.trim();
      if (!target) return toast("ใส่ Player ID ก่อน");
      const t = await get(ref(db, "users/" + target));
      if (!t.exists()) return toast("ไม่พบ Player ID นี้");

      if (isFood) {
        const k = push(ref(db, `inventory/${target}`)).key;
        await set(ref(db, `inventory/${target}/${k}`), { id: "custom_food", qty, ...foodFields(customData) });
      } else if (def.type === "weapon") {
        for (let i = 0; i < Math.min(qty, 10); i++) {
          const k = push(ref(db, `inventory/${target}`)).key;
          await update(ref(db), {
            [`inventory/${target}/${k}`]: {
              id: itemId, qty: 1, dur: def.maxDur,
              ...(customData ? { name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon" } : {})
            }
          });
        }
      } else {
        await runTransaction(ref(db, `inventory/${target}/${itemId}`), (cur) => ({
          id: itemId, qty: Math.min(99, (cur?.qty || 0) + qty)
        }));
      }
      toast(`เสก ${def.name} ให้ ${t.val().username} แล้ว`);
    }
  } catch (e) { toast(errMsg(e)); }
});


// ---------- มอบสกิล custom (GM/Owner) ----------
// [type, ป้ายชื่อ, ค่าต่ำสุด, ค่าสูงสุด]  (ค่าต้องตรงกับ rules → skills/$uid/$slot)
const SKILL_TYPES = {
  pve: [["power", "💥 ตีโดนแน่ (ดาเมจ ×ตัวคูณ)", 1.1, 2], ["guard", "🛡️ ลดดาเมจที่บอสสวนกลับ (%)", 10, 90], ["dodge", "💨 หลบ (บอสสวนกลับพลาดแน่)", 0, 0], ["heal", "✚ ฟื้น HP (จำนวน)", 10, 150]],
  pvp: [["sharp", "🎯 ค่าทอยโจมตี + (แต้ม)", 1, 3], ["smash", "🔨 ดาเมจปะทะ ×ตัวคูณ", 1.1, 1.5], ["pierce", "🗡️ ทะลวงเกราะ (ไม่หัก tough)", 0, 0], ["brace", "🧱 ท่าตั้งรับ ลดดาเมจ (%) นาน 60 วิ", 10, 70]]
};
const SKILL_FIELDS = ["name", "icon", "kind", "type", "power", "cd", "uses"];
const skillFields = (x) => SKILL_FIELDS.reduce((o, k) => { o[k] = x[k]; return o; }, {});   // เอาเฉพาะช่องที่ rules อนุญาต (skills/$uid/$slot)

// K = คำนำหน้า id ของช่องกรอก: `${K}name` `${K}icon` `${K}kind` `${K}type` `${K}power` `${K}cd` `${K}uses`
// ใช้ร่วมกัน 4 จุด: มอบสกิล (adm-sk-) / เสก (adm-spk-) / รางวัลภารกิจ (adm-q-spk-) / รางวัลบอสโลก (adm-wb-spk-)
function syncSkillForm(K, resetType = true) {
  const kind = $(K + "kind").value, sel = $(K + "type");
  if (resetType) { sel.innerHTML = ""; SKILL_TYPES[kind].forEach(([v, label]) => { const o = document.createElement("option"); o.value = v; o.textContent = label; sel.append(o); }); }
  const spec = SKILL_TYPES[kind].find((t) => t[0] === sel.value) || SKILL_TYPES[kind][0];
  const noPower = spec[2] === 0 && spec[3] === 0;
  $(K + "power").classList.toggle("hidden", noPower);
  $(K + "power").placeholder = `ค่าของสกิล (${spec[2]} ถึง ${spec[3]})`;
  $(K + "cd").placeholder = sel.value === "brace" ? "คูลดาวน์ (วินาที 60–3600)" : "คูลดาวน์ (วินาที 5–3600)";
}
// สร้างช่องกรอกสกิลลงในกล่อง boxId (ใช้กับฟอร์มที่ซ่อน/แสดงตามชนิดรางวัล)
function buildSkillBox(boxId, K) {
  const box = $(boxId); if (!box) return;
  box.innerHTML = ""; box.style.cssText = "display:grid;gap:8px;margin-top:5px;padding-left:10px;border-left:2px solid var(--hazard)";
  const inp = (id, ph, attrs) => { const i = document.createElement("input"); i.id = id; i.placeholder = ph; Object.assign(i, attrs); return i; };
  const kind = document.createElement("select"); kind.id = K + "kind";
  [["pve", "PvE — ใช้กับบอสประจำโซน / บอสโลก"], ["pvp", "PvP — ใช้ตอนปะทะผู้เล่น"]].forEach(([v, l]) => kind.append(new Option(l, v)));
  const type = document.createElement("select"); type.id = K + "type";
  box.append(
    inp(K + "name", "ชื่อสกิล (เช่น คมดาบพิฆาต)", { maxLength: 20 }),
    inp(K + "icon", "ไอคอน emoji (ไม่ใส่ = ✨)", { maxLength: 4 }),
    kind, type,
    inp(K + "power", "ค่าของสกิล", { type: "number", step: "0.1" }),
    inp(K + "cd", "คูลดาวน์ (วินาที)", { type: "number", min: 5, max: 3600, value: 60 }),
    inp(K + "uses", "จำนวนครั้งที่ใช้ได้ (เว้นว่าง = ไม่จำกัด)", { type: "number", min: 1, max: 999 })
  );
  kind.addEventListener("change", () => syncSkillForm(K, true));
  type.addEventListener("change", () => syncSkillForm(K, false));
  syncSkillForm(K, true);
}
// อ่าน+ตรวจค่าจากฟอร์มสกิล (ช่วงค่าต้องตรงกับ rules) — ไม่ผ่านจะ toast แล้วคืน null
function readSkillForm(K) {
  const kind = $(K + "kind").value, type = $(K + "type").value, spec = SKILL_TYPES[kind].find((t) => t[0] === type);
  if (!spec) { toast("เลือกประเภทสกิลก่อน"); return null; }
  const name = $(K + "name").value.trim(), icon = $(K + "icon").value.trim() || "✨";
  const noPower = spec[2] === 0 && spec[3] === 0, power = noPower ? 0 : Number($(K + "power").value);
  const cd = Math.floor(Number($(K + "cd").value)), usesRaw = $(K + "uses").value.trim(), uses = usesRaw === "" ? -1 : Math.floor(Number(usesRaw));
  const bad = (m) => { toast(m); return null; };
  if (!name || name.length > 20) return bad("ตั้งชื่อสกิล 1–20 ตัวอักษร");
  if (!noPower && !(power >= spec[2] && power <= spec[3])) return bad(`ค่าของสกิลต้องอยู่ระหว่าง ${spec[2]} ถึง ${spec[3]}`);
  if (!(cd >= (type === "brace" ? 60 : 5) && cd <= 3600)) return bad(`คูลดาวน์ต้องอยู่ระหว่าง ${type === "brace" ? 60 : 5} ถึง 3600 วินาที`);
  if (!(uses === -1 || (uses >= 1 && uses <= 999))) return bad("จำนวนครั้ง: เว้นว่าง = ไม่จำกัด หรือ 1–999");
  return { name, icon, kind, type, power, cd, uses };
}
$("adm-sk-kind").addEventListener("change", () => syncSkillForm("adm-sk-", true));
$("adm-sk-type").addEventListener("change", () => syncSkillForm("adm-sk-", false));
syncSkillForm("adm-sk-", true);
$("adm-sk-grant").addEventListener("click", async () => {
  const target = $("adm-sk-id").value.trim(); if (!target) return toast("ใส่ Player ID ก่อน");
  const sk = readSkillForm("adm-sk-"); if (!sk) return;
  try {
    const t = await get(ref(db, "users/" + target));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    const k = push(ref(db, `skills/${target}`)).key;
    await set(ref(db, `skills/${target}/${k}`), sk);
    toast(`มอบสกิล ${sk.icon} ${sk.name} ให้ ${t.val().username} แล้ว`);
    loadAdminSkills();
  } catch (e) { toast(errMsg(e)); }
});
async function loadAdminSkills() {
  const target = $("adm-sk-id").value.trim(), ul = $("adm-sk-list"); ul.innerHTML = "";
  if (!target) return toast("ใส่ Player ID ก่อน");
  try {
    const sv = (await get(ref(db, `skills/${target}`))).val() || {};
    const ids = Object.keys(sv);
    if (!ids.length) { ul.append(mk("li", "empty", "ผู้เล่นคนนี้ยังไม่มีสกิล custom")); return; }
    ids.forEach((id) => {
      const d = sv[id], li = mk("li");
      li.append(mk("span", "", `${d.icon} ${d.name} — ${d.kind.toUpperCase()} · ${skillDesc({ ...d, basic: false })} · CD ${d.cd}s · ${d.uses === -1 ? "ไม่จำกัด" : `เหลือ ${d.uses} ครั้ง`}`));
      li.append(btn("ถอน", async () => {
        try { await update(ref(db), { [`skills/${target}/${id}`]: null, [`skillState/${target}/${id}`]: null }); toast("ถอนสกิลแล้ว"); loadAdminSkills(); }
        catch (e) { toast(errMsg(e)); }
      }, "btn danger mini"));
      ul.append(li);
    });
  } catch (e) { toast(errMsg(e)); }
}
$("adm-sk-load").addEventListener("click", loadAdminSkills);

// แก้สเตตัสถาวรของผู้เล่น (Owner แก้ได้ทุกคน / GM แก้ได้เฉพาะ role = player ตาม database rules)
function buildStatEditor() {
  const box = $("adm-se-box"); if (!box) return;
  box.innerHTML = "";
  STAT_KEYS.forEach((k) => {
    const row = mk("label", "", STAT_LABEL[k]); row.style.cssText = "display:grid;gap:4px;font-weight:400";
    const i = document.createElement("input"); i.type = "number"; i.min = STAT_MIN[k]; i.max = STAT_CAP; i.id = "adm-se-" + k; i.placeholder = `${STAT_MIN[k]} ถึง ${STAT_CAP}`;
    row.append(i); box.append(row);
  });
}
async function loadStatEditor() {
  const pid = $("adm-se-id").value.trim(); if (!pid) return toast("ใส่ Player ID ก่อน");
  try {
    const s = await get(ref(db, "stats/" + pid));
    if (!s.exists()) { STAT_KEYS.forEach((k) => { $("adm-se-" + k).value = ""; }); return toast("ผู้เล่นคนนี้ยังไม่ได้แจกแต้มสเตตัส"); }
    STAT_KEYS.forEach((k) => { $("adm-se-" + k).value = s.val()[k] ?? 0; });
    const b = (await get(ref(db, "buffs/" + pid))).val();
    const left = b ? Math.ceil((b.bstart + (b.mins || 0) * 60000 - serverNow()) / 60000) : 0;
    toast(left > 0 ? `โหลดแล้ว (มีบัฟชั่วคราวอีก ${left} นาที)` : "โหลดสเตตัสแล้ว");
  } catch (e) { toast(errMsg(e)); }
}
$("adm-se-load").addEventListener("click", loadStatEditor);
$("adm-se-save").addEventListener("click", async () => {
  const pid = $("adm-se-id").value.trim(); if (!pid) return toast("ใส่ Player ID ก่อน");
  const vals = {};
  for (const k of STAT_KEYS) {
    const n = Number($("adm-se-" + k).value);
    if ($("adm-se-" + k).value === "" || !Number.isInteger(n) || n < STAT_MIN[k] || n > STAT_CAP) return toast(`${STAT_LABEL[k]} ต้องเป็นจำนวนเต็ม ${STAT_MIN[k]} ถึง ${STAT_CAP} (กด "โหลดค่าปัจจุบัน" ก่อนแล้วค่อยแก้)`);
    vals[k] = n;
  }
  try {
    const t = await get(ref(db, "users/" + pid));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    if (!(await get(ref(db, "stats/" + pid))).exists()) return toast("ผู้เล่นยังไม่ได้แจกแต้มสเตตัส แก้ให้ไม่ได้");
    await set(ref(db, "stats/" + pid), vals);
    toast(`แก้สเตตัสของ ${t.val().username} แล้ว`);
  } catch (e) { toast(errMsg(e)); }
});
$("adm-se-cleareff").addEventListener("click", async () => {
  const pid = $("adm-se-id").value.trim(); if (!pid) return toast("ใส่ Player ID ก่อน");
  try { await remove(ref(db, "effects/" + pid)); toast("ล้างสถานะพิเศษแล้ว"); } catch (e) { toast(errMsg(e)); }
});
$("adm-se-clearbuff").addEventListener("click", async () => {
  const pid = $("adm-se-id").value.trim(); if (!pid) return toast("ใส่ Player ID ก่อน");
  try { await remove(ref(db, "buffs/" + pid)); toast("ล้างบัฟชั่วคราวแล้ว"); } catch (e) { toast(errMsg(e)); }
});

async function ownerSet(patch, okMsg) {
  const pid = $("adm-pid").value.trim();
  if (!pid) return toast("ใส่ Player ID ก่อน");
  if (pid === state.uid) return toast("ไม่สามารถแก้สิทธิ์ตัวเองได้");
  try {
    const t = await get(ref(db, "users/" + pid));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    const u = {}; Object.entries(patch).forEach(([k, v]) => { u[`users/${pid}/${k}`] = v; });
    await update(ref(db), u); toast(`${okMsg}: ${t.val().username}`);
  } catch (e) { toast(errMsg(e)); }
}
$("adm-setrole").addEventListener("click", () => ownerSet({ role: $("adm-role").value }, "ตั้งสิทธิ์แล้ว"));
$("adm-reset-stats").addEventListener("click", async () => {
  const pid = $("adm-pid").value.trim();
  if (!pid) return toast("ใส่ Player ID ก่อน");
  try { await remove(ref(db, "stats/" + pid)); toast("รีเซ็ตแต้มสเตตัสแล้ว ผู้เล่นจะได้แจกแต้มใหม่ตอนเข้าเกม"); }
  catch (e) { toast(errMsg(e)); }
});
$("adm-ban").addEventListener("click", () => ownerSet({ banned: true }, "แบนแล้ว"));
$("adm-unban").addEventListener("click", () => ownerSet({ banned: false }, "ปลดแบนแล้ว"));

/* =========================================================
   13) เครื่องมือ GM: ปิดแชทผู้เล่น / ล้างแชทโซน / ลบทีละข้อความ
   ========================================================= */
function listenMyMute() {
  onValue(ref(db, "mutes/" + state.uid), (snap) => {
    const until = snap.val()?.until || 0;
    const was = state.mutedUntil;
    state.mutedUntil = until;
    if (until > serverNow()) {
      const t = new Date(until).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      logLine(`🔇 คุณถูกปิดแชทโดยผู้ดูแลจนถึง ${t}`, "system");
    } else if (was > serverNow()) logLine("🔊 คุณพูดในแชทได้อีกครั้งแล้ว", "system");
  });
}

function watchMutes() {
  if (state.mutesOff) return;
  state.mutesOff = onValue(ref(db, "mutes"), (snap) => {
    const ul = $("adm-mute-list"); ul.innerHTML = "";
    snap.forEach((c) => {
      const v = c.val(), left = v.until - serverNow();
      if (left <= 0) return;
      const li = mk("li"); li.append(mk("span", "", `🔇 ${v.name} (อีก ${Math.ceil(left / 60000)} นาที)`));
      li.append(btn("เปิดแชท", () => unmute(c.key), "btn ghost mini"));
      ul.append(li);
    });
    if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีใครถูกปิดแชท"));
  }, () => { state.mutesOff = null; });
}

async function unmute(pid) {
  try { await remove(ref(db, "mutes/" + pid)); toast("เปิดแชทให้แล้ว"); }
  catch (e) { toast(errMsg(e)); }
}

$("adm-mute").addEventListener("click", async () => {
  const pid = $("adm-mute-id").value.trim();
  if (!pid) return toast("ใส่ Player ID ก่อน");
  if (pid === state.uid) return toast("ปิดแชทตัวเองไม่ได้");
  const mins = parseInt($("adm-mute-dur").value, 10) || 5;
  try {
    const t = await get(ref(db, "users/" + pid));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    await set(ref(db, "mutes/" + pid), { until: serverNow() + mins * 60000, by: state.profile.username, name: t.val().username });
    toast(`ปิดแชท ${t.val().username} ${mins} นาทีแล้ว`);
  } catch (e) { toast(errMsg(e)); }
});
$("adm-unmute").addEventListener("click", () => {
  const pid = $("adm-mute-id").value.trim();
  if (!pid) return toast("ใส่ Player ID ก่อน");
  unmute(pid);
});

$("adm-clear").addEventListener("click", async () => {
  const z = $("adm-clear-zone").value;
  if (!confirm(`ล้างแชททั้งหมดของ ${ZONES[z].name}?`)) return;
  try {
    await remove(ref(db, "chats/" + z));
    await push(ref(db, "announcements"), { text: "ผู้ดูแลล้างแชทของโซนนี้แล้ว", zone: z, by: state.profile.username, ts: serverTimestamp() });
    toast("ล้างแชทแล้ว");
  } catch (e) { toast(errMsg(e)); }
});

$("adm-delmode").addEventListener("change", (e) => {
  state.delMode = e.target.checked;
  $("chat-log").classList.toggle("del-mode", state.delMode);
});

/* =========================================================
   14) เหตุการณ์ประจำโซน (สุ่มอัตโนมัติ + แอดมินกำหนดเอง)
   ========================================================= */
const AUTO_EVENT_WEIGHTS = { horde: 3, fog: 3, calm: 2, supply: 2 };

function renderZoneTags() {
  document.querySelectorAll(".zone-btn").forEach((b) => {
    const id = b.dataset.zone, tag = b.querySelector(".danger-tag"); if (!tag || !ZONES[id]) return;
    const d = dangerInfo(id);
    tag.className = "danger-tag d" + d.tier;
    tag.textContent = `${d.ev ? eventIcon(d.ev) + " " : ""}⚠ ${d.level}/10`;
    b.title = `อันตราย ${d.level}/10 • เจอซอมบี้ ${d.chance}%` + (d.ev ? ` • ${d.ev.title} (อีก ~${minsLeft(d.ev)} นาที)` : "");
  });
}

function renderAdminEvents() {
  const ul = $("adm-ev-list"); if (!ul || !isStaff()) return;
  ul.innerHTML = "";
  Object.entries(state.events).forEach(([z, e]) => {
    if (!ZONES[z] || e.endsAt <= serverNow()) return;
    const li = mk("li");
    li.append(mk("span", "", `${eventIcon(e)} ${e.title} @ ${ZONES[z].name} (อีก ~${minsLeft(e)} นาที${e.auto ? ", สุ่ม" : ""})`));
    li.append(btn("ยุติ", () => endEvent(z), "btn ghost mini"));
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีเหตุการณ์ที่กำลังเกิด"));
}

function refreshDanger() { renderZoneTags(); if (state.zone) renderZoneDanger(state.zone); renderAdminEvents(); }

function listenEvents() {
  onValue(ref(db, "eventMeta"), (s) => {
    const m = s.val() || {};
    state.nextAuto = m.nextAuto || 0; state.autoOff = !!m.autoOff;
    const cb = $("adm-ev-auto"); if (cb) cb.checked = !state.autoOff;
  });
  onValue(ref(db, "zoneEvents"), (snap) => {
    state.events = snap.val() || {};
    Object.entries(state.events).forEach(([z, e]) => {
      if (!ZONES[z] || state.evSeen[z] === e.endsAt) return;
      state.evSeen[z] = e.endsAt;
      if (typeof e.startedAt === "number" && e.startedAt >= state.sessionStart && e.endsAt > serverNow()) {
        logLine(`${eventIcon(e)} [ข่าวด่วน] ${e.title} ที่${ZONES[z].name} (~${minsLeft(e)} นาที) — ระดับอันตรายตอนนี้ ${effDanger(z)}/10`, "system");
      }
    });
    refreshDanger();
  });
  setInterval(tickEvents, 5000);
}

function tickEvents() {
  Object.entries(state.events).forEach(([z, e]) => {
    if (e.endsAt > serverNow() || state.evEnded[z] === e.endsAt || state.evSeen[z] !== e.endsAt) return;
    state.evEnded[z] = e.endsAt;
    if (z === state.zone && e.endsAt > state.sessionStart) logLine(`${e.title} ที่${ZONES[z].name} สิ้นสุดแล้ว สถานการณ์กลับสู่ปกติ`, "info");
  });
  const night = isNight();
  if (state.wasNight !== undefined && state.wasNight !== night && state.zone) {
    logLine(night ? "🌙 ฟ้าเริ่มมืดลง… เสียงคำรามในความมืดดังขึ้น ซอมบี้ออกหากินมากขึ้น" : "🌅 ฟ้าเริ่มสว่างแล้ว ซอมบี้ทยอยกลับที่ซ่อน สถานการณ์คลี่คลายลง", "system");
  }
  state.wasNight = night;
  refreshDanger();
  maybeStartAutoEvent();
}

// ไม่มีเซิร์ฟเวอร์ → ผู้เล่นที่ออนไลน์คนใดคนหนึ่งเป็นคนกดเริ่มเมื่อถึงเวลา (กฎฐานข้อมูลคุมคูลดาวน์/ช่วงค่าให้)
async function maybeStartAutoEvent() {
  if (state.autoBusy || state.autoOff || state.nextAuto === undefined || !state.profile || state.profile.banned) return;
  if (serverNow() - state.sessionStart < 90000 || serverNow() < state.nextAuto) return;
  state.autoBusy = true;
  try {
    await new Promise((r) => setTimeout(r, Math.random() * 8000));   // สุ่มหน่วง กันหลายคนชนกัน
    if (state.autoOff || serverNow() < state.nextAuto) return;
    const zones = Object.keys(ZONES).filter((z) => z !== "safe" && !activeEvent(z));
    if (!zones.length) return;
    const z = zones[Math.floor(Math.random() * zones.length)];
    const pool = Object.entries(AUTO_EVENT_WEIGHTS);
    let r = Math.random() * pool.reduce((t, [, w]) => t + w, 0), type = pool[0][0];
    for (const [k, w] of pool) { if ((r -= w) < 0) { type = k; break; } }
    const t = EVENT_TYPES[type], now = serverNow();
    await update(ref(db), {
      [`zoneEvents/${z}`]: { type, title: t.name, dmod: t.dmod, zmod: t.zmod, nmod: t.nmod, startedAt: serverTimestamp(), endsAt: now + (5 + Math.floor(Math.random() * 8)) * 60000, by: "auto", auto: true },
      "eventMeta/nextAuto": now + (15 + Math.floor(Math.random() * 26)) * 60000
    });
  } catch (e) { /* มีคนอื่นเริ่มก่อน หรือยังไม่ถึงเวลา — ไม่ต้องแจ้งผู้เล่น */ }
  finally { state.autoBusy = false; }
}

async function endEvent(z) {
  try { await remove(ref(db, "zoneEvents/" + z)); toast("ยุติเหตุการณ์แล้ว"); }
  catch (e) { toast(errMsg(e)); }
}

$("adm-ev-type").addEventListener("change", (e) => { $("adm-ev-custom").classList.toggle("hidden", e.target.value !== "custom"); });
$("adm-ev-start").addEventListener("click", async () => {
  if (!isStaff()) return;
  const z = $("adm-ev-zone").value, type = $("adm-ev-type").value, t = EVENT_TYPES[type];
  const dur = Math.max(1, Math.min(720, parseInt($("adm-ev-dur").value, 10) || 10));
  const num = (id, lo, hi) => Math.max(lo, Math.min(hi, parseInt($(id).value, 10) || 0));
  const e = type === "custom"
    ? { type, title: $("adm-ev-title").value.trim().slice(0, 40) || t.name, dmod: num("adm-ev-dmod", -10, 10), zmod: num("adm-ev-zmod", -100, 100), nmod: num("adm-ev-nmod", -100, 100) }
    : { type, title: t.name, dmod: t.dmod, zmod: t.zmod, nmod: t.nmod };
  try {
    await set(ref(db, "zoneEvents/" + z), { ...e, startedAt: serverTimestamp(), endsAt: serverNow() + dur * 60000, by: state.profile.username, auto: false });
    toast(`เริ่ม ${e.title} ที่ ${ZONES[z].name} นาน ${dur} นาที`);
  } catch (ex) { toast(errMsg(ex)); }
});
$("adm-ev-end").addEventListener("click", () => endEvent($("adm-ev-zone").value));
$("adm-ev-auto").addEventListener("change", async (e) => {
  try { await set(ref(db, "eventMeta/autoOff"), !e.target.checked); toast(e.target.checked ? "เปิดเหตุการณ์สุ่มแล้ว" : "ปิดเหตุการณ์สุ่มแล้ว"); }
  catch (ex) { toast(errMsg(ex)); e.target.checked = !e.target.checked; }
});

/* =========================================================
   12) กระดานภารกิจ (GM โพสต์ → ผู้เล่นรับ/ส่งมอบ → GM ตรวจรับและมอบรางวัล)
   ========================================================= */
const NEED_ITEMS = ["canned_food", "water", "bandage", "medkit", "scrap", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "chem"];
const rewardText = (r) => { if (r.id === "skill") return `📖 สกิล ${r.icon || "✨"} ${r.name}`; const d = defOf(r); return `${d?.icon || "🗡️"} ${d?.name || "ไอเทม"}${r.qty > 1 ? " ×" + r.qty : ""}`; };
const needText = (n) => `${ITEMS[n.id].icon} ${ITEMS[n.id].name} ×${n.qty}`;

function listenQuests() {
  onValue(ref(db, "quests"), (s) => {
    const next = s.val() || {};
    if (state.questsSeen) {   // ข้ามรอบโหลดแรก ไม่แจ้งของเก่า
      Object.entries(next).forEach(([id, q]) => {
        if (state.questsSeen.has(id) || q.status !== "open") return;
        logLine(`📜 ภารกิจใหม่บนกระดาน: “${q.title}” — รางวัล ${rewardText(q.reward)}`, "system");
        notifyTab("map");
      });
    }
    state.questsSeen = new Set(Object.keys(next));
    state.quests = next; renderQuests();
  });
}

function renderQuests() {
  const ul = $("quest-list"); if (!ul) return; ul.innerHTML = "";
  Object.entries(state.quests || {}).sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0)).forEach(([id, q]) => {
    const mine = q.claimer === state.uid;
    const li = mk("li", "quest");
    li.append(mk("b", "", q.title));
    if (q.desc) li.append(mk("small", "muted", q.desc));
    li.append(mk("small", "", `🎁 ${rewardText(q.reward)}${q.need ? ` • ต้องส่ง ${needText(q.need)}` : ""}`));
    li.append(mk("small", "muted", q.auto ? "⚡ ได้รับรางวัลทันทีเมื่อส่งมอบ" : "🕵️ รางวัลมอบเมื่อ GM อนุมัติ"));
    li.append(mk("small", "muted", q.status === "open" ? "สถานะ: ว่าง" : q.status === "taken" ? `🧍 ${q.claimerName} กำลังทำ` : `⏳ ${q.claimerName} ส่งมอบแล้ว รอ GM ตรวจ`));
    const row = mk("div", "row-btns");
    if (q.status === "open") row.append(btn("รับภารกิจ", () => questAccept(id)));
    if (q.status === "taken" && mine) { row.append(btn(q.auto ? "ส่งมอบ + รับรางวัล" : "ส่งมอบ", () => questDeliver(id))); row.append(btn("ยกเลิก", () => questAbandon(id), "btn ghost mini")); }
    if (isStaff()) {
      if (q.status === "submitted") { row.append(btn("อนุมัติ", () => questApprove(id))); row.append(btn("ปฏิเสธ", () => questReject(id), "btn ghost mini")); }
      row.append(btn("ลบ", () => { if (confirm("ลบภารกิจนี้?")) remove(ref(db, "quests/" + id)).catch((e) => toast(errMsg(e))); }, "btn danger mini"));
    }
    if (row.children.length) li.append(row);
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ยังไม่มีภารกิจ"));
}

async function questAccept(id) {
  const q = state.quests[id]; if (!q || q.status !== "open" || state.busy) return;
  if (Object.values(state.quests).some((x) => x.claimer === state.uid)) return toast("คุณมีภารกิจค้างอยู่ ทำให้เสร็จหรือยกเลิกก่อน");
  state.busy = true;
  try {
    await update(ref(db), { [`quests/${id}/status`]: "taken", [`quests/${id}/claimer`]: state.uid, [`quests/${id}/claimerName`]: state.profile.username });
    toast(`รับภารกิจ “${q.title}” แล้ว`); logLine(`📜 คุณรับภารกิจ “${q.title}”`, "info");
  } catch { toast("มีคนรับภารกิจนี้ไปก่อน หรือภารกิจถูกลบแล้ว"); }
  finally { state.busy = false; }
}

async function questDeliver(id) {
  const q = state.quests[id]; if (!q || q.claimer !== state.uid || q.status !== "taken" || state.busy) return;
  if (q.auto) return questDeliverAuto(id, q);
  const u = { [`quests/${id}/status`]: "submitted" };
  if (q.need) {
    const have = state.inv[q.need.id]?.qty || 0;
    if (have < q.need.qty) return toast(`ของไม่พอ ต้องมี ${needText(q.need)}`);
    if (have > q.need.qty) u[`inventory/${state.uid}/${q.need.id}/qty`] = have - q.need.qty; else u[`inventory/${state.uid}/${q.need.id}`] = null;
  }
  state.busy = true;
  try { await update(ref(db), u); toast("ส่งมอบแล้ว รอ GM ตรวจรับ"); logLine(`📜 คุณส่งมอบภารกิจ “${q.title}” รอ GM ตรวจรับ`, "info"); }
  catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

// ภารกิจแบบอัตโนมัติ: ส่งมอบแล้วรางวัลเข้ากระเป๋าทันที ภารกิจถูกลบในคำสั่งเดียว (rules ตรวจว่ารางวัลตรงกับที่ GM ตั้งไว้)
const AUTO_STACK = ["canned_food", "water", "bandage", "medkit", "scrap", "super_ration", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "chem"];
async function questDeliverAuto(id, q) {
  const r = q.reward, uid = state.uid, u = {};
  if (q.need) {
    if (q.need.id === r.id) return toast("ภารกิจนี้ตั้งค่าไม่ถูกต้อง (ของที่ต้องส่งซ้ำกับรางวัล) แจ้ง GM ด้วย");
    const have = state.inv[q.need.id]?.qty || 0;
    if (have < q.need.qty) return toast(`ของไม่พอ ต้องมี ${needText(q.need)}`);
    if (have > q.need.qty) u[`inventory/${uid}/${q.need.id}/qty`] = have - q.need.qty; else u[`inventory/${uid}/${q.need.id}`] = null;
  }
  if (r.id === "skill") u[`skills/${uid}/q_${id}`] = skillFields(r);   // รางวัลเป็นสกิล: เข้า skills ไม่ใช่ inventory
  else if (AUTO_STACK.includes(r.id)) u[`inventory/${uid}/${r.id}`] = { id: r.id, qty: Math.min(99, (state.inv[r.id]?.qty || 0) + r.qty) };
  else u[`inventory/${uid}/q_${id}`] = { ...r };
  u[`questPayouts/${uid}`] = { qid: id, ts: serverTimestamp() };
  u[`quests/${id}`] = null;
  state.busy = true;
  try {
    await update(ref(db), u);
    remove(ref(db, `questPayouts/${uid}`)).catch(() => {});
    toast(`ภารกิจสำเร็จ! ได้รับ ${rewardText(r)}`);
    logLine(`📜 คุณทำภารกิจ “${q.title}” สำเร็จ ได้รับ ${rewardText(r)}`, "system");
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

async function questAbandon(id) {
  const q = state.quests[id]; if (!q || q.claimer !== state.uid || q.status !== "taken" || state.busy) return;
  state.busy = true;
  try { await update(ref(db), { [`quests/${id}/status`]: "open", [`quests/${id}/claimer`]: null, [`quests/${id}/claimerName`]: null }); toast("ยกเลิกภารกิจแล้ว"); }
  catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

async function grantItem(target, spec, qid) {
  if (spec.id === "skill") { await set(ref(db, `skills/${target}/q_${qid}`), skillFields(spec)); return; }
  if (spec.id === "custom" || spec.id === "custom_food" || ITEMS[spec.id]?.type === "weapon") {
    const k = push(ref(db, `inventory/${target}`)).key;
    await set(ref(db, `inventory/${target}/${k}`), spec);
  } else {
    await runTransaction(ref(db, `inventory/${target}/${spec.id}`), (cur) => ({ id: spec.id, qty: Math.min(99, (cur?.qty || 0) + spec.qty) }));
  }
}

async function questApprove(id) {
  const q = state.quests[id]; if (!isStaff() || !q || q.status !== "submitted" || state.busy) return;
  state.busy = true;
  try {
    await grantItem(q.claimer, q.reward, id);
    await remove(ref(db, "quests/" + id));
    await push(ref(db, "announcements"), { text: `📜 ${q.claimerName} ทำภารกิจ “${q.title}” สำเร็จ ได้รับ ${rewardText(q.reward)}`.slice(0, 200), zone: "all", by: state.profile.username, ts: serverTimestamp() });
    toast("อนุมัติและมอบรางวัลแล้ว");
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

async function questReject(id) {
  if (!isStaff()) return;
  try { await update(ref(db), { [`quests/${id}/status`]: "taken" }); toast("ส่งกลับให้ผู้เล่นทำต่อแล้ว"); }
  catch (e) { toast(errMsg(e)); }
}

$("adm-q-post").addEventListener("click", async () => {
  const title = $("adm-q-title").value.trim().slice(0, 60);
  if (!title) return toast("ใส่ชื่อภารกิจก่อน");
  const R = readAdminItem("adm-q-");
  if (R.itemId === "skill" && !R.skill) return;
  const { itemId, qty, isFood, customData, def } = R;
  let reward;
  if (itemId === "skill") reward = { id: "skill", qty: 1, ...R.skill };
  else if (itemId === "custom") reward = { id: "custom", qty: 1, dur: customData.dur, maxDur: customData.dur, name: customData.name, dmg: customData.dmg, type: "weapon" };
  else if (isFood) reward = { id: "custom_food", qty, ...foodFields(customData) };
  else if (def.type === "weapon") reward = { id: itemId, qty: 1, dur: def.maxDur };
  else reward = { id: itemId, qty };
  const auto = $("adm-q-mode").value === "auto";
  const quest = { title, by: state.profile.username, ts: serverTimestamp(), status: "open", reward, auto };
  const desc = $("adm-q-desc").value.trim().slice(0, 300); if (desc) quest.desc = desc;
  const needId = $("adm-q-need").value;
  if (needId) quest.need = { id: needId, qty: Math.max(1, Math.min(50, parseInt($("adm-q-need-qty").value, 10) || 1)) };
  if (auto && quest.need && quest.need.id === reward.id) return toast("แบบอัตโนมัติ: ของที่ต้องส่งห้ามซ้ำกับรางวัล");
  try {
    await push(ref(db, "quests"), quest);
    ["adm-q-title", "adm-q-desc"].forEach((i) => { $(i).value = ""; });
    ["adm-q-custom-name", "adm-q-food-name"].forEach((i) => { $(i).value = ""; });
    toast(`โพสต์ภารกิจ “${title}” (รางวัล ${rewardText(reward)} • ${auto ? "อัตโนมัติ" : "รออนุมัติ"}) แล้ว`);
  } catch (e) { toast(errMsg(e)); }
});

/* =========================================================
   13) ติดเชื้อ (มนุษย์ที่ถูกซอมบี้ผู้เล่นกัดโดน)
   ========================================================= */
const INFECT_TICK = 15000, INFECT_DMG = 2, INFECT_MAX_TICKS = 40;   // HP −2 ทุก 15 วินาที (ย้อนหลังได้สูงสุด 40 ติ๊ก = 10 นาที)

// เชื้อลุกลามตามเวลาจริง: บันทึกเวลาที่หักล่าสุดไว้ที่ users/{uid}/infectTs
// ถ้าปิดเกมไปนาน กลับมาจะหักย้อนหลัง แต่ไม่ทำให้ตายตอนไม่อยู่ (เหลืออย่างน้อย 1 HP)
async function infectionTick() {
  const p = state.profile;
  if (!p || p.banned || !p.infected || p.faction !== "human" || state.busy || state.infBusy) return;
  const ticks = Math.min(INFECT_MAX_TICKS, Math.floor((serverNow() - Math.max(p.infected, p.infectTs || 0)) / INFECT_TICK));
  if (ticks < 1) return;
  state.infBusy = true;
  try {
    const away = ticks > 2;
    let left = p.hp - ticks * INFECT_DMG;
    if (away) left = Math.max(1, left);
    if (left > 0) {
      await update(ref(db), { [`users/${state.uid}/hp`]: left, [`users/${state.uid}/infectTs`]: serverTimestamp() });
      if (away && p.hp - left > 0) logLine(`🦠 ระหว่างที่คุณไม่อยู่ เชื้อลุกลามกินร่างกาย −${p.hp - left} HP`, "system");
    } else {
      await update(ref(db), { [`users/${state.uid}/hp`]: 0 });
      logLine("🦠 เชื้อลุกลามจนคุณสลบ…", "system");
    }
  } catch (e) { console.error("infection tick", e); }
  finally { state.infBusy = false; }
}

// ให้ผู้เล่นคนอื่นในโซนเห็นว่าเราติดเชื้อ (🦠 ข้างชื่อในรายชื่อผู้เล่น)
function syncInfectedFlag(inf) {
  if (!state.zone) return;
  const r = ref(db, `zonePlayers/${state.zone}/${state.uid}/infected`);
  (inf ? set(r, true) : remove(r)).catch(() => {});
}

// GM: ทำให้ติดเชื้อ / รักษาให้หาย
async function adminInfect(on) {
  const id = $("adm-inf-id").value.trim(); if (!id) return toast("ใส่ Player ID ก่อน");
  try {
    const t = await get(ref(db, "users/" + id));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    if (on && t.val().faction !== "human") return toast("ซอมบี้ติดเชื้อไม่ได้");
    await update(ref(db), { [`users/${id}/infected`]: on ? serverTimestamp() : null, [`users/${id}/infectTs`]: null });
    toast(`${on ? "ทำให้ติดเชื้อ" : "รักษาให้"} ${t.val().username} แล้ว`);
  } catch (e) { toast(errMsg(e)); }
}
$("adm-inf-on").addEventListener("click", () => adminInfect(true));
$("adm-inf-off").addEventListener("click", () => adminInfect(false));
