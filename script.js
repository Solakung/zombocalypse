import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, deleteUser
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, remove, onValue, onChildAdded, onChildRemoved,
  onDisconnect, query, orderByKey, limitToLast, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

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
const fns = getFunctions(app, "asia-southeast1");   // Cloud Functions: ระบบที่ย้ายตรรกะตรวจสอบจาก rules ไปไว้ฝั่งเซิร์ฟเวอร์ (ตอนนี้: ที่พัก 🏠)
const storage = getStorage(app);   // รูปโปรไฟล์ (raw/{uid} ต้นฉบับชั่วคราว → profile/{uid}.webp ที่ระบบแปลงให้) — กฎอยู่ที่ storage.rules
const baseCall = (data) => httpsCallable(fns, "baseAct")(data).then((r) => r.data);
const marketCall = (data) => httpsCallable(fns, "marketAct")(data).then((r) => r.data);   // ตลาด/ตลาดมืด/ฝากของ (functions/market.js)
const passCall = (data) => httpsCallable(fns, "passAct")(data).then((r) => r.data);   // 🎟️ ภารกิจซีซัน (functions/pass.js)
const eventCall = (data) => httpsCallable(fns, "eventAct")(data).then((r) => r.data);   // 🎭 เหตุการณ์สุ่มเลือกทาง (functions/events.js)
const dailyCall = (data) => httpsCallable(fns, "dailyAct")(data).then((r) => r.data);   // 🎁 หีบรายวัน/🎯 ล่าค่าหัว (functions/daily.js)
const campCall = (data) => httpsCallable(fns, "campAct")(data).then((r) => r.data);   // 🏕️ ต้นไม้ค่าย/🐾 สัตว์เลี้ยง (functions/camp.js)
const worldCall = (data) => httpsCallable(fns, "worldAct")(data).then((r) => r.data);   // 🌍 อีเวนต์โลกรายสัปดาห์ (functions/world.js)
const diveCall = (data) => httpsCallable(fns, "diveAct")(data).then((r) => r.data);   // 🕳️ ดิ่งลึก (functions/dive.js)
const nemCall = (data) => httpsCallable(fns, "nemAct")(data).then((r) => r.data);   // 👹 ศัตรูคู่อาฆาต (functions/nemesis.js)
const radioCall = (data) => httpsCallable(fns, "radioAct")(data).then((r) => r.data);   // 📻 ปริศนาวิทยุ (functions/radio.js)
const caravanCall = (data) => httpsCallable(fns, "caravanAct")(data).then((r) => r.data);   // 🐪 ขบวนพ่อค้าเร่ (functions/caravan.js)
const gardenCall = (data) => httpsCallable(fns, "gardenAct")(data).then((r) => r.data);   // 🌱 แปลงปลูก (functions/garden.js)
const colCall = (data) => httpsCallable(fns, "colAct")(data).then((r) => r.data);   // 📖 สมุดสะสมชุด/ความสมบูรณ์ (functions/col.js)
const homeCall = (data) => httpsCallable(fns, "homeAct")(data).then((r) => r.data);   // 🛋️ บ้านของฉัน/จัดห้อง/เยี่ยมห้อง (functions/home.js)
const profCall = (data) => httpsCallable(fns, "profAct")(data).then((r) => r.data);   // 🪪 โปรไฟล์ตกแต่ง/รูปอัปโหลด (functions/profile.js)
const learnCall = (data) => httpsCallable(fns, "learnAct")(data).then((r) => r.data);   // 🧭 บทเรียนแนะนำการเล่น (functions/learn.js)
const abilCall = (data) => httpsCallable(fns, "abilAct")(data).then((r) => r.data);   // ⚡ ความสามารถประจำสาย (functions/ability.js)
const slaveCall = (data) => httpsCallable(fns, "slaveAct")(data).then((r) => r.data);   // 🃏 โต๊ะสลาฟหลายผู้เล่น (functions/slave.js)
const casinoCall = (data) => httpsCallable(fns, "casinoAct")(data).then((r) => r.data);   // 🎰 คาสิโนเถื่อน (functions/casino.js)
const mutCall = (data) => httpsCallable(fns, "mutAct")(data).then((r) => r.data);   // 🧬 มิวเตชันซอมบี้ขั้น 5–8 (functions/mutate.js)
const hcCall = (data) => httpsCallable(fns, "hcAct")(data).then((r) => r.data);   // 📡 ภารกิจ HC: ค้นพบธารา/ส่ง DNA (functions/hc.js)
const zwCall = (data) => httpsCallable(fns, "zwAct")(data).then((r) => r.data);   // ⚔️ แต้มศึกชิงโซนรายสัปดาห์ (functions/zwar.js)
const forgeCall = (data) => httpsCallable(fns, "forgeAct")(data).then((r) => r.data);   // 🔨 คราฟต์อาวุธระดับต้น–กลาง (functions/forge.js)
const useCall = (data) => httpsCallable(fns, "useAct")(data).then((r) => r.data);   // 🍽️ ใช้ไอเทม กิน/ดื่ม/ยา/บัฟ (functions/use.js)
const warCall = (data) => httpsCallable(fns, "warAct")(data).then((r) => r.data);   // ⚔️ ศึกใหญ่ประจำสัปดาห์ (functions/war.js)
const fxwCall = (data) => httpsCallable(fns, "fxwAct")(data).then((r) => r.data);   // ⚔️ อาวุธติดสถานะ ค้นเจอ (functions/fxw.js; คราฟต์ผ่าน forgeCall)
const jailCall = (data) => httpsCallable(fns, "jailAct")(data).then((r) => r.data);   // ⛓️ คุก (functions/jail.js)
const crimCall = (data) => httpsCallable(fns, "crimAct")(data).then((r) => r.data);   // 🟠 สถานะส้ม (functions/crim.js)
const hbCall = (data) => httpsCallable(fns, "hbossAct")(data).then((r) => r.data);   // 🏹 บอสเผ่ามนุษย์สำหรับซอมบี้ (functions/hboss.js)

/* ---------------------------------------------------------
   อัปเดตเวอร์ชันอัตโนมัติ (GitHub Pages cache ไฟล์ ~10 นาที แก้ header เองไม่ได้)
   ทุกครั้งที่ deploy ต้องเปลี่ยนเลขเวอร์ชัน 3 ที่ให้ตรงกัน: APP_VERSION นี้ / ?v= ใน index.html / version.json
   (รัน `node bump.js` ทีเดียวจบ) — ตัวเกมจะเช็ค version.json แบบไม่ผ่านแคช แล้วเด้งปุ่มอัปเดตให้ผู้เล่น
   --------------------------------------------------------- */
const APP_VERSION = "2026-10-07.0805";
let updateBarShown = false;
function reloadToVersion(v) {
  const u = new URL(location.href); u.searchParams.set("v", v);   // URL ใหม่ = บังคับโหลด index.html สดจากเซิร์ฟเวอร์
  location.replace(u.toString());
}
function showUpdateBar(v) {
  if (updateBarShown) return;
  // ยังไม่ได้ล็อกอิน (ไม่มีอะไรเสียหาย) → รีโหลดให้เองครั้งเดียวต่อเวอร์ชัน กันวนลูปถ้า CDN ยังส่งไฟล์เก่า
  if (document.getElementById("screen-login")?.classList.contains("active")) {
    try { const k = "upd:" + v; if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, "1"); return reloadToVersion(v); } } catch (_) {}
  }
  updateBarShown = true;
  const bar = document.createElement("div"); bar.className = "update-banner"; bar.setAttribute("role", "status");
  const msg = document.createElement("span"); msg.textContent = "🔄 มีเวอร์ชันใหม่ของเกมแล้ว";
  const go = document.createElement("button"); go.className = "btn primary mini"; go.textContent = "อัปเดตเลย"; go.onclick = () => reloadToVersion(v);
  const later = document.createElement("button"); later.className = "btn ghost mini"; later.textContent = "ทีหลัง";
  later.onclick = () => { bar.remove(); setTimeout(() => { updateBarShown = false; }, 5 * 60 * 1000); };
  bar.append(msg, go, later); document.body.append(bar);
}
async function checkForUpdate() {
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return;
    const { v } = await r.json();
    if (typeof v === "string" && v && v !== APP_VERSION) showUpdateBar(v);
  } catch (_) { /* ออฟไลน์/ไฟล์ไม่มี → ข้าม */ }
}
checkForUpdate();
setInterval(checkForUpdate, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkForUpdate(); });

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
const BOSS_W = { ruins: 2, mall: 3, hospital: 3, police: 4, forest: 2, factory: 3, port: 3, base: 4, tunnel: 5, lab: 4 };   // น้ำหนักเจอบอสในตารางค้นหา (≈ % ต่อครั้ง)
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
    loot: [{ id: "samurai_sword", w: 3 }, { id: "shotgun", w: 2 }, { id: "serum", w: 3 }, { id: "stim_shot", w: 2 }], bonus: [{ id: "medkit", w: 3 }, { id: "antidote", w: 2 }, { id: "trauma_kit", w: 2 }] },
  lab: { name: "วัตถุทดลองหมายเลข 0", icon: "🧫", tag: "Experiment — ตัวทดลองที่ล้มเหลว ฟาดเร็วสองครั้งและพิษแรง", hp: 170, hits: 2, dmg: [10, 16], acc: 0.75, flee: 0.45, verb: "กรงเล็บที่ถูกตัดต่อพันธุกรรมฟาดใส่",
    intro: "ไฟฉุกเฉินกะพริบแดง… ตู้เพาะเลี้ยงกระจกแตก สิ่งที่ถูกขังไว้ลากร่างเปียกชื้นออกมาจากหมอกไอเย็น!",
    loot: [{ id: "serum", w: 3 }, { id: "trauma_kit", w: 2 }, { id: "stim_shot", w: 2 }, { id: "samurai_sword", w: 1 }, { id: "lab_blade", w: 2 }], bonus: [{ id: "antidote", w: 3 }, { id: "medkit", w: 2 }, { id: "lab_core", w: 3 }, { id: null, w: 1 }] }
};
const TRAVEL_COOLDOWN = 45000, TRAVEL_STAMINA_SAFE = 5;
// ค่าเดินทางคิดตามปลายทาง ยิ่งไกล Safe Zone ยิ่งแพง (ใกล้ 6 / กลาง 10 / ไกล 14, กลับ Safe 5) — ต้องตรงกับ rules
const TRAVEL_NEAR = ["forest", "ruins", "casino"], TRAVEL_FAR = ["base", "police", "tunnel", "lab"], TRAVEL_STAMINA = 10;

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
// พิษ 2 ระดับ: อ่อน (v=1) ทุกไอเทมรักษาได้ / แรง (v≥2) เฉพาะยาแก้พิษกับชุดช่วยชีวิตขั้นสูง (ข้อจำกัดนี้อยู่ฝั่งเกม rules ไม่ได้บังคับ) • ยาแก้พิษให้ภูมิต้านพิษ 10 นาที (เก็บในเครื่อง)
const POISON_STRONG = 2, STRONG_CURE = ["antidote", "trauma_kit", "exp_serum", "field_surgery_kit"], ANTI_IMM_MS = 600000;
const poisonImmLeft = () => Math.max(0, (LS.get(lsKey("pimm"), 0) || 0) - serverNow());
const fxName = (t) => (t === "poison" && effV("poison") >= POISON_STRONG ? "พิษแรง" : FX_TYPES[t].name);
const FX_CURES = { bandage: ["bleed"], medkit: ["bleed", "poison"], moss: ["poison"], antidote: ["poison"], trauma_kit: ["bleed", "poison"], exp_serum: ["bleed", "poison"] };   // ไอเทมในเกมที่รักษาสถานะได้ (ต้องตรงกับ rules)
// สถานะจากมอนสเตอร์: โดนตีจริง (HP ลด) → สุ่มติดอย่างมาก 1 อย่าง [โอกาส %, ค่า v, นาที] — เพดานตรงกับ rules: bleed/poison v≤3, stun 1 นาที, dice −1..−2, ทุกอย่าง ≤5 นาที
const MON_FX = {
  zombie: { bleed: [18, 2, 3], poison: [10, 1, 4] },
  ruins: { bleed: [30, 2, 3] }, mall: { dice: [30, -2, 3] }, hospital: { poison: [30, 2, 4], bleed: [15, 2, 3] }, police: { stun: [20, 1, 1], dice: [20, -1, 3] },
  forest: { poison: [30, 1, 5] }, factory: { bleed: [30, 3, 3], poison: [18, 2, 4] }, port: { stun: [25, 1, 1], poison: [18, 2, 4] }, base: { bleed: [20, 2, 3], stun: [15, 1, 1] },
  tunnel: { poison: [25, 3, 5], dice: [25, -2, 5], stun: [10, 1, 1] },
  lab: { poison: [30, 3, 5], stun: [12, 1, 1] },
  wboss: { bleed: [15, 2, 4], poison: [12, 2, 5], stun: [8, 1, 1], dice: [15, -2, 4] }
};
function monFx(u, src, loss, hpAfter) {
  if (!(loss > 0) || !(hpAfter > 0)) return "";
  for (const [t, [pc, v, mins]] of Object.entries(MON_FX[src] || {})) {
    const pg = t === "poison" && (gearHas("chem_gloves") || gearHas("mut_fang3") || gearFxFlag("poisonHalf")), v2 = pg && v > 1 ? v - 1 : v;   // ถุงมือ/ต่อมพิษ: โอกาสติดพิษครึ่งเดียว และพิษแรงอ่อนลง 1 ระดับ
    if (Math.random() * 100 >= (pg ? pc * 0.5 : pc) || effActive(t) || (t === "poison" && poisonImmLeft() > 0)) continue;
    u[`effects/${state.uid}/${t}`] = { bstart: serverTimestamp(), mins, v: v2, tick: serverTimestamp() }; stat("fx");
    return ` ⚠️ ติด${FX_TYPES[t].icon}${t === "poison" && v2 >= POISON_STRONG ? "พิษแรง" : FX_TYPES[t].name}`;
  }
  return "";
}
const pveD6 = () => Math.max(1, d6() + Math.min(0, effV("dice")));   // ติดสถานะอ่อนแรง (dice ติดลบ) → ทอยสู้มอนสเตอร์แย่ลง; บัฟบวกไม่มีผลกับ PvE
// อาวุธคมมีโอกาสทำให้บอสประจำโซนเลือดไหล (ฝั่งเกมล้วน ๆ: บอสเสียเลือดเพิ่ม BOSS_BLEED/รอบ นาน BOSS_BLEED_N รอบ) — สกิลโจมตีโดนแน่ได้โอกาส ×2
const WPN_PROC = { knife: 20, spiked_bat: 25, fire_axe: 25, samurai_sword: 25, pocket_knife: 15, lab_blade: 25 }, BOSS_BLEED = 3, BOSS_BLEED_N = 3;
// สลับอาวุธระหว่างสู้: หน้าบอส/บอสโลกมีแถบสลับ — ถ้าอาวุธพังจนมือเปล่าจะสลับได้ทันที ไม่งั้นติดคูลดาวน์ SWAP_CD
const SWAP_CD = 15000;
const swapLeft = () => Math.max(0, SWAP_CD - (serverNow() - (state.lastSwap || 0)));
async function swapWeapon(slot) {
  if (equippedWeapon() && swapLeft() > 0) return toast(`สลับอาวุธได้อีกใน ${Math.ceil(swapLeft() / 1000)} วินาที`);
  state.lastSwap = serverNow();
  await equip(slot, false);
}
// รวมอาวุธชนิดเดียวกันเป็นปุ่มเดียว (แสดง ×จำนวน) — ชนิดที่ถืออยู่ใช้ช่องที่ถือ ชนิดอื่นเลือกเล่มที่ทนทานสุด
function swapGroups() {
  const cur = state.profile?.equipped, g = {};
  Object.entries(state.inv || {}).forEach(([slot, it]) => {
    const d = defOf(it); if (!d || d.type !== "weapon" || !(it.dur > 0)) return;
    const k = it.id || d.name, x = g[k] || (g[k] = { slot, it, d, n: 0 });
    x.n++; if (slot === cur || (x.slot !== cur && it.dur > x.it.dur)) { x.slot = slot; x.it = it; }
  });
  return Object.values(g).sort((p, q) => p.d.name.localeCompare(q.d.name, "th"));
}
function renderSwapBar(el) {
  if (!el) return;
  const cur = state.profile?.equipped, left = equippedWeapon() ? Math.ceil(swapLeft() / 1000) : 0;
  const gs = swapGroups();
  const sig = gs.map((x) => `${x.slot}:${x.it.dur}:${x.n}`).join(",") + "|" + cur;
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig; el.textContent = "";
    if (gs.length > 1 || (gs.length === 1 && gs[0].slot !== cur)) gs.forEach(({ slot, it, d, n }) => {
      const b = btn(`${d.icon || "🗡️"} ${d.name} (${it.dur})${n > 1 ? " ×" + n : ""}`, () => swapWeapon(slot), "btn ghost mini" + (slot === cur ? " on" : ""));
      b.dataset.slot = slot; b.style.borderBottom = `3px solid ${durColor(durFrac(it, d))}`; b.title = "ปุ่มลัด: Q"; if (slot === cur) b.disabled = true; el.append(b);
    });
  }
  el.classList.toggle("hidden", !el.childElementCount);
  el.querySelectorAll("button").forEach((b) => { if (b.dataset.slot !== cur) { b.disabled = left > 0; b.title = left > 0 ? `สลับได้อีก ${left} วิ` : "สลับอาวุธ"; } });
}
if (!document.getElementById("swap-style")) { const st = document.createElement("style"); st.id = "swap-style"; st.textContent = ".swap-bar{display:flex;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:4px;margin:4px 0;padding-bottom:3px;scrollbar-width:thin}.swap-bar .btn{flex:0 0 auto;white-space:nowrap}.swap-bar .on{outline:1px solid var(--accent,#7fb069)}"; document.head.append(st); }
const hasFx = (d) => FX_KEYS.some((t) => d["e_" + t]) || FX_CURE_KEYS.some((t) => d["c_" + t]);
const fxText = (d) => {
  const on = FX_KEYS.filter((t) => d["e_" + t]).map((t) => `${FX_TYPES[t].icon}${FX_TYPES[t].name}${t === "dice" ? sgn(d.e_dice) : t === "stun" ? "" : " " + d["e_" + t] + "/รอบ"}`);
  const cure = FX_CURE_KEYS.filter((t) => d["c_" + t]).map((t) => FX_TYPES[t].name);
  return [on.length && `${on.join(" ")} นาน ${d.emin || 0} นาที`, cure.length && `รักษา ${cure.join("/")}`].filter(Boolean).join(" • ");
};
const SHOUT_COOLDOWN = 30000, BITE_FOOD = 25;
const CHAT_COOLDOWN = 1000;   // ms ระหว่างข้อความแชต/กระซิบ — ต้องตรงกับ users/$uid/lastChat ใน database_rules.json (>= 1000)
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
  // ไอเทมอัปสเตตัสประจำเกม: ใช้ผ่านหน้าต่าง 🧪 เท่านั้น (ห้ามทิ้ง/ซื้อขาย) ได้จากเควสสัปดาห์ กาชา หรือแอดมินมอบให้
  stat_cap: { name: "แคปซูลสเตตัส", icon: "🧪", type: "stat" },
  stat_lim: { name: "แกนทะลุขีดจำกัด", icon: "🔓", type: "stat" },
  // อาหารรองของซอมบี้: ค้นหาเจอได้เฉพาะฝั่งซอมบี้ และกินได้เฉพาะซอมบี้ (ค่าอาหารต้องตรงกับ rules)
  rotten_meat: { name: "เนื้อเน่า", icon: "🥩", type: "consumable", food: 20, zombieOnly: true },
  // ชุดสวมใส่ (มนุษย์ 2 ช่อง: เกราะ arm / อุปกรณ์เสริม acc) และอวัยวะกลายพันธุ์ (ซอมบี้ 3 ช่อง: เขี้ยว mf / หนัง mh / จมูก mn)
  // type "gear" = ซ้อนกันได้เหมือนของสิ้นเปลือง (ช่อง = id) แต่ "ใช้" ไม่ได้ ต้องกด "สวม" / ผลอยู่ในส่วนที่ 20 ท้ายไฟล์ / ตัวเลข red ต้องตรงกับ GEAR_FX
  rag_vest: { name: "เสื้อผ้าพันตัว", icon: "🧥", type: "gear", slot: "arm", red: 5 },
  scrap_plate: { name: "เกราะเศษเหล็ก", icon: "🛡️", type: "gear", slot: "arm", red: 10 },
  riot_vest: { name: "เสื้อปราบจลาจล", icon: "🦺", type: "gear", slot: "arm", red: 15 },
  army_vest: { name: "เกราะทหาร", icon: "🪖", type: "gear", slot: "arm", red: 20 },
  lucky_charm: { name: "เครื่องรางนำโชค", icon: "🍀", type: "gear", slot: "acc" },
  headlamp: { name: "ไฟฉายคาดหัว", icon: "🔦", type: "gear", slot: "acc" },
  gas_mask: { name: "หน้ากากกันแก๊ส", icon: "😷", type: "gear", slot: "acc" },
  toolkit: { name: "กล่องเครื่องมือ", icon: "🛠️", type: "gear", slot: "acc" },
  lab_coat: { name: "เสื้อกาวน์ปลอดเชื้อ", icon: "🥼", type: "gear", slot: "arm", red: 12 },
  bio_lens: { name: "เลนส์สแกนชีวภาพ", icon: "🔬", type: "gear", slot: "acc" },
  lab_sample: { name: "ตัวอย่างวิจัย", icon: "🧫", type: "material" },
  dna_frag: { name: "ชิ้นส่วน DNA", icon: "🧬", type: "material" },
  chem_gloves: { name: "ถุงมือกันสารเคมี", icon: "🧤", type: "gear", slot: "acc" },
  lab_blade: { name: "มีดผ่าตัดเลเซอร์", icon: "🔪", type: "weapon", dmg: 24, maxDur: 20 },
  lab_core: { name: "แกนวิจัย", icon: "💠", type: "material" },
  exp_serum: { name: "ซีรั่มทดลอง", icon: "🧪", type: "consumable", heal: 60 },
  mut_fang3: { name: "ต่อมพิษ", icon: "☣️", type: "gear", slot: "mf", zombieOnly: true },
  fish: { name: "ปลาสด", icon: "🐟", type: "material" },
  golden_fish: { name: "ปลาทอง", icon: "🐠", type: "material" },
  fish_grill: { name: "ปลาย่าง", icon: "🍢", type: "consumable", heal: 10, food: 40 },
  fish_stew: { name: "ซุปปลา", icon: "🍲", type: "consumable", heal: 25, food: 45, water: 25 },
  mut_fang1: { name: "เขี้ยวแหลม", icon: "🦷", type: "gear", slot: "mf", zombieOnly: true },
  mut_fang2: { name: "เขี้ยวเหล็กไน", icon: "🐍", type: "gear", slot: "mf", zombieOnly: true },
  mut_hide1: { name: "หนังหนา", icon: "🦴", type: "gear", slot: "mh", red: 8, zombieOnly: true },
  mut_hide2: { name: "เกล็ดซาก", icon: "🐢", type: "gear", slot: "mh", red: 16, zombieOnly: true },
  mut_nose1: { name: "จมูกไว", icon: "👃", type: "gear", slot: "mn", zombieOnly: true },
  mut_nose2: { name: "จมูกล่าซาก", icon: "🐽", type: "gear", slot: "mn", zombieOnly: true },
  // ===== ไอเทมชุดที่ 1 (44 ชิ้น: เกราะ/อุปกรณ์/อวัยวะซอมบี้/วัตถุดิบ/ของสะสม) — ดู ITEMS_DESIGN.md • fx = ผลพิเศษของชุดสวมใส่ (อ่านโดย gearFxSum/gearFxFlag) =====
  cardboard_armor: { name: "เกราะกระดาษแข็ง", icon: "📦", type: "gear", slot: "arm", red: 3 },
  leather_jacket: { name: "แจ็คเก็ตหนัง", icon: "🧥", type: "gear", slot: "arm", red: 7 },
  hunter_cloak: { name: "เสื้อคลุมนักล่า", icon: "🪶", type: "gear", slot: "arm", red: 9 },
  welder_apron: { name: "ผ้ากันเปื้อนช่างเชื่อม", icon: "🥋", type: "gear", slot: "arm", red: 11 },
  diver_suit: { name: "ชุดกันน้ำนักดำน้ำ", icon: "🤿", type: "gear", slot: "arm", red: 13 },
  hazmat_suit: { name: "ชุดป้องกันสารเคมี", icon: "☢️", type: "gear", slot: "arm", red: 16 },
  kevlar_vest: { name: "เสื้อเคฟลาร์", icon: "🦺", type: "gear", slot: "arm", red: 18 },
  bomb_suit: { name: "ชุดเก็บกู้ระเบิด", icon: "💣", type: "gear", slot: "arm", red: 26 },
  compass: { name: "เข็มทิศ", icon: "🧭", type: "gear", slot: "acc", fx: {"nofind":10} },
  earplugs: { name: "ที่อุดหู", icon: "🎧", type: "gear", slot: "acc", fx: {"zspawn":15} },
  survival_bracelet: { name: "สายรัดข้อมือเอาชีวิตรอด", icon: "⌚", type: "gear", slot: "acc", fx: {"nofind":6,"zspawn":6} },
  rabbit_foot: { name: "ตีนกระต่ายนำโชค", icon: "🐇", type: "gear", slot: "acc", fx: {"rare":5} },
  lucky_coin: { name: "เหรียญนำโชค", icon: "🪙", type: "gear", slot: "acc", fx: {"nofind":8,"rare":3} },
  respirator: { name: "เครื่องช่วยหายใจ", icon: "🫁", type: "gear", slot: "acc", fx: {"poisonHalf":true} },
  night_goggles: { name: "แว่นมองกลางคืน", icon: "🥽", type: "gear", slot: "acc", fx: {"nightSafe":true,"zspawn":10} },
  tactical_radio: { name: "วิทยุยุทธวิธี", icon: "📻", type: "gear", slot: "acc", fx: {"zspawn":20} },
  mut_fang4: { name: "เขี้ยวฟันเลื่อย", icon: "🦷", type: "gear", slot: "mf", fx: {"wall":4}, zombieOnly: true },
  mut_fang6: { name: "เขี้ยวเลือดเดือด", icon: "🩸", type: "gear", slot: "mf", fx: {"wall":6}, zombieOnly: true },
  mut_fang5: { name: "เขี้ยวมังกรซาก", icon: "🐉", type: "gear", slot: "mf", fx: {"wall":9}, zombieOnly: true },
  mut_hide3: { name: "หนังเหล็กไหล", icon: "🛡️", type: "gear", slot: "mh", red: 12, zombieOnly: true },
  mut_hide4: { name: "กระดองซาก", icon: "🐚", type: "gear", slot: "mh", red: 20, zombieOnly: true },
  mut_hide5: { name: "เกราะกระดูกยักษ์", icon: "🦴", type: "gear", slot: "mh", red: 26, zombieOnly: true },
  mut_nose3: { name: "จมูกกลิ่นเลือด", icon: "👃", type: "gear", slot: "mn", fx: {"meat":2.2}, zombieOnly: true },
  mut_nose4: { name: "จมูกผู้ล่า", icon: "🐕", type: "gear", slot: "mn", fx: {"meat":1.4,"nofind":35}, zombieOnly: true },
  duct_tape: { name: "เทปกาว", icon: "🧷", type: "material" },
  rusty_nails: { name: "ตะปูสนิม", icon: "📌", type: "material" },
  cloth_roll: { name: "ม้วนผ้า", icon: "🧶", type: "material" },
  rope_coil: { name: "เชือกมัด", icon: "🪢", type: "material" },
  herb_bundle: { name: "กำสมุนไพร", icon: "🌾", type: "material" },
  copper_wire: { name: "ลวดทองแดง", icon: "🔌", type: "material" },
  leather_scrap: { name: "เศษหนัง", icon: "🟫", type: "material" },
  fuel_can: { name: "น้ำมันเชื้อเพลิง", icon: "⛽", type: "material" },
  gunpowder: { name: "ดินปืน", icon: "🧨", type: "material" },
  steel_plate: { name: "แผ่นเหล็กกล้า", icon: "🔩", type: "material" },
  battery_pack: { name: "แบตเตอรี่", icon: "🔋", type: "material" },
  circuit_board: { name: "แผงวงจร", icon: "🖥️", type: "material" },
  chem_catalyst: { name: "ตัวเร่งปฏิกิริยา", icon: "⚗️", type: "material" },
  mutant_gland: { name: "ต่อมมิวแทนต์", icon: "🫀", type: "material" },
  survivor_badge: { name: "เข็มกลัดผู้รอดชีวิต", icon: "🎖️", type: "material" },
  old_photo: { name: "ภาพถ่ายเก่า", icon: "🖼️", type: "material" },
  gold_watch: { name: "นาฬิกาทอง", icon: "🕰️", type: "material" },
  lab_keycard: { name: "บัตรผ่านห้องแล็บ", icon: "🪪", type: "material" },
  data_chip: { name: "ชิปข้อมูลวิจัย", icon: "💾", type: "material" },
  boss_trophy: { name: "ถ้วยรางวัลบอส", icon: "🏆", type: "material" },
  // ===== ไอเทมชุดที่ 2: อาหาร/น้ำ/ยา/บัฟ 36 ชิ้น (ใช้ผ่าน useAct — ผลต้องตรง CONSUMABLES ใน functions/use.js; ที่มาดูหัวข้อ "ไอเทมชุดที่ 2" ใน MIGRATION.md) =====
  instant_noodle: { name: "บะหมี่กึ่งสำเร็จรูป", icon: "🍜", type: "consumable", food: 25, water: -5 },
  potato_chips: { name: "มันฝรั่งทอดกรอบ", icon: "🍟", type: "consumable", food: 15, stamina: 5 },
  canned_sardine: { name: "ซาร์ดีนกระป๋อง", icon: "🐟", type: "consumable", food: 30, water: -5, stamina: 5 },
  cereal_bar: { name: "ซีเรียลบาร์", icon: "🥜", type: "consumable", food: 25, stamina: 15 },
  canned_tuna: { name: "ทูน่ากระป๋อง", icon: "🥫", type: "consumable", food: 35, heal: 3 },
  wild_berries: { name: "เบอร์รี่ป่า", icon: "🫐", type: "consumable", food: 12, water: 10, e_poison: 1, emin: 1 },
  smoked_meat: { name: "เนื้อรมควัน", icon: "🍖", type: "consumable", food: 45, water: -8 },
  honey_jar: { name: "ขวดน้ำผึ้ง", icon: "🍯", type: "consumable", food: 25, heal: 10 },
  mushroom_stew: { name: "ซุปเห็ดป่า", icon: "🥘", type: "consumable", food: 40, heal: 15, b_regen: 1, bmin: 8 },
  mre_pack: { name: "เสบียงสนาม MRE", icon: "🍱", type: "consumable", food: 70, water: 20 },
  soda_can: { name: "น้ำอัดลมกระป๋อง", icon: "🥤", type: "consumable", water: 25, stamina: 5 },
  spring_water: { name: "น้ำพุธรรมชาติ", icon: "🏞️", type: "consumable", water: 40 },
  mineral_bottle: { name: "น้ำแร่ขวดแก้ว", icon: "🍶", type: "consumable", water: 45 },
  herbal_tea: { name: "ชาสมุนไพร", icon: "🍵", type: "consumable", water: 20, heal: 8, c_stun: 1 },
  sports_drink: { name: "เครื่องดื่มเกลือแร่", icon: "🧃", type: "consumable", water: 40, stamina: 15 },
  desal_water: { name: "น้ำกลั่นจากทะเล", icon: "🌊", type: "consumable", food: -5, water: 60 },
  gauze_roll: { name: "ผ้าก๊อซม้วน", icon: "🩹", type: "consumable", heal: 12, c_bleed: 1 },
  antiseptic: { name: "น้ำยาฆ่าเชื้อ", icon: "🧴", type: "consumable", heal: 8, c_poison: 1 },
  painkillers: { name: "ยาแก้ปวด", icon: "💊", type: "consumable", heal: 10, stamina: 15, b_tough: 2, bmin: 10 },
  antibiotic: { name: "ยาปฏิชีวนะ", icon: "💊", type: "consumable", heal: 15, c_poison: 1 },
  suture_kit: { name: "ชุดเย็บแผล", icon: "🧵", type: "consumable", heal: 35, c_bleed: 1 },
  herbal_salve: { name: "ยาขี้ผึ้งสมุนไพร", icon: "🌿", type: "consumable", heal: 25, c_poison: 1 },
  iv_drip: { name: "น้ำเกลือ IV", icon: "🏥", type: "consumable", water: 30, heal: 40 },
  morphine: { name: "มอร์ฟีน", icon: "💉", type: "consumable", heal: 90, b_str: -2, b_agi: -3, bmin: 8 },
  blood_pack: { name: "ถุงเลือด", icon: "🩸", type: "consumable", heal: 65, stamina: -10 },
  field_surgery_kit: { name: "ชุดผ่าตัดสนาม", icon: "🧰", type: "consumable", heal: 90, stamina: -20, c_bleed: 1, c_poison: 1 },
  coffee_can: { name: "กาแฟกระป๋อง", icon: "☕", type: "consumable", water: -5, stamina: 25 },
  smelling_salts: { name: "ยาดมกระตุ้น", icon: "🧂", type: "consumable", stamina: 10, c_stun: 1 },
  rum_bottle: { name: "เหล้ารัม", icon: "🍾", type: "consumable", heal: 15, stamina: 30, b_agi: -2, bmin: 5 },
  adrenaline_shot: { name: "อะดรีนาลีน", icon: "💉", type: "consumable", stamina: 50, b_str: 3, b_tough: -2, bmin: 5 },
  focus_pill: { name: "ยาเพิ่มสมาธิ", icon: "💊", type: "consumable", food: -10, b_agi: 4, bmin: 10 },
  regen_gel: { name: "เจลฟื้นฟูเซลล์", icon: "🧴", type: "consumable", e_hot: 2, emin: 6 },
  combat_stim: { name: "ยากระตุ้นรบ", icon: "💊", type: "consumable", heal: -10, stamina: 40, b_str: 4, b_agi: 3, bmin: 10 },
  berserker_serum: { name: "เซรั่มคลั่ง", icon: "🧪", type: "consumable", b_str: 9, b_tough: -3, bmin: 8 },
  reflex_booster: { name: "ยาเร่งรีเฟล็กซ์", icon: "⚡", type: "consumable", food: -15, b_agi: 8, bmin: 8 },
  mutagen_vial: { name: "หลอดมิวทาเจน", icon: "☣️", type: "consumable", b_str: 5, b_hp: 3, bmin: 10, e_poison: 1, emin: 2 }
};

// อาหาร custom ที่ admin เสก (id = custom_food) เก็บค่าสเตตัสไว้ในตัวไอเทมเอง
const gearFields = (x) => ({ name: x.name, gslot: x.gslot, red: x.red, type: "gear", ...(x.icon ? { icon: x.icon } : {}) });   // เกราะ/อุปกรณ์ custom ที่แอดมินเสก
const defOf = (x) => (x.id === "custom" ? (x.icon ? x : { icon: "🗡️", ...x }) : x.id === "custom_gear" ? { icon: "🛡️", ...x, slot: x.gslot, type: "gear" } : x.id === "custom_food" ? { icon: x.type === "material" ? "✨" : hasStatFx(x) || hasFx(x) ? "🧪" : "🍽️", ...x } : ITEMS[x.id]);
const ITEM_NUM_KEYS = ["food", "water", "heal", "stamina", ...STAT_KEYS.map((k) => "s_" + k), ...STAT_KEYS.map((k) => "b_" + k), "bmin", ...FX_KEYS.map((t) => "e_" + t), "emin", ...FX_CURE_KEYS.map((t) => "c_" + t)];
const foodFields = (x) => ({ name: x.name, type: x.type || "consumable", ...(x.icon ? { icon: x.icon } : {}), ...ITEM_NUM_KEYS.reduce((o, k) => (x[k] ? { ...o, [k]: x[k] } : o), {}) });
const effectText = (d) => [d.heal && `HP ${sgn(d.heal)}`, d.food && `อาหาร ${sgn(d.food)}`, d.water && `น้ำ ${sgn(d.water)}`, d.stamina && `พลังงาน ${sgn(d.stamina)}`,
  statFx(d, "s_") && `ถาวร ${statFx(d, "s_")}`, statFx(d, "b_") && `ชั่วคราว ${statFx(d, "b_")} นาน ${d.bmin || 0} นาที`, hasFx(d) && fxText(d)].filter(Boolean).join(" ");

// สูตรคราฟต์ (เฉพาะมนุษย์ ใน Safe Zone) — ทุกสูตรทำผ่านฟังก์ชัน forgeAct (srv) สูตรต้องตรง functions/forge.js RECIPES (มีเทสต์เทียบ) — เพิ่มสูตรใหม่ไม่ต้องแตะ rules
const RECIPES = {
  bandage: { need: { scrap: 2 }, out: "bandage", qty: 1, srv: 1 },
  antidote: { need: { chem: 2, scrap: 1 }, out: "antidote", qty: 1, srv: 1 },
  trauma_kit: { need: { medkit: 1, bandage: 2, chem: 1 }, out: "trauma_kit", qty: 1, srv: 1 },
  soup: { need: { canned_food: 1, water: 1 }, out: "soup", qty: 1, srv: 1 },
  stim_shot: { need: { chem: 3, energy_drink: 1 }, out: "stim_shot", qty: 1, srv: 1 },
  rag_vest: { need: { scrap: 5 }, out: "rag_vest", qty: 1, srv: 1 },
  scrap_plate: { need: { scrap: 10, chem: 2 }, out: "scrap_plate", qty: 1, srv: 1 },
  headlamp: { need: { scrap: 4, energy_drink: 1 }, out: "headlamp", qty: 1, srv: 1 },
  toolkit: { need: { scrap: 6, chem: 1 }, out: "toolkit", qty: 1, srv: 1 },
  exp_serum: { need: { lab_sample: 2, chem: 2 }, out: "exp_serum", qty: 1, srv: 1 },
  fish_grill: { need: { fish: 1, scrap: 1 }, out: "fish_grill", qty: 1, srv: 1 },
  fish_stew: { need: { fish: 2, water: 1, canned_food: 1 }, out: "fish_stew", qty: 1, srv: 1 },
  // อาวุธระดับต้น–กลาง: คราฟต์ผ่านฟังก์ชัน forgeAct (srv) — สูตรต้องตรง functions/forge.js (ไม่เกี่ยวกับ rules)
  wooden_bat: { need: { scrap: 8 }, out: "wooden_bat", qty: 1, srv: 1 },
  pocket_knife: { need: { scrap: 6, leather_scrap: 1 }, out: "pocket_knife", qty: 1, srv: 1 },
  crowbar: { need: { scrap: 10, duct_tape: 1 }, out: "crowbar", qty: 1, srv: 1 },
  knife: { need: { scrap: 8, leather_scrap: 1, duct_tape: 1 }, out: "knife", qty: 1, srv: 1 },
  spiked_bat: { need: { scrap: 8, rusty_nails: 3 }, out: "spiked_bat", qty: 1, srv: 1 },
  fire_axe: { need: { scrap: 14, steel_plate: 1 }, out: "fire_axe", qty: 1, srv: 1 },
  crossbow: { need: { scrap: 12, rope_coil: 2, steel_plate: 1 }, out: "crossbow", qty: 1, srv: 1 },
  // ไอเทมชุดที่ 2: ยา/เครื่องดื่ม/เกราะ/อุปกรณ์ (srv — functions/forge.js)
  gauze_roll: { need: { cloth_roll: 1, scrap: 1 }, out: "gauze_roll", qty: 2, srv: 1 },
  antiseptic: { need: { chem: 1, herb_bundle: 1 }, out: "antiseptic", qty: 1, srv: 1 },
  painkillers: { need: { herb_bundle: 2, chem: 1 }, out: "painkillers", qty: 1, srv: 1 },
  suture_kit: { need: { cloth_roll: 1, copper_wire: 1, antiseptic: 1 }, out: "suture_kit", qty: 1, srv: 1 },
  herbal_salve: { need: { herb_bundle: 3, water: 1 }, out: "herbal_salve", qty: 1, srv: 1 },
  herbal_tea: { need: { herb_bundle: 1, water: 1 }, out: "herbal_tea", qty: 1, srv: 1 },
  regen_gel: { need: { chem_catalyst: 1, antiseptic: 1, water: 1 }, out: "regen_gel", qty: 1, srv: 1 },
  cardboard_armor: { need: { cloth_roll: 2, duct_tape: 2 }, out: "cardboard_armor", qty: 1, srv: 1 },
  leather_jacket: { need: { leather_scrap: 4, cloth_roll: 1 }, out: "leather_jacket", qty: 1, srv: 1 },
  hunter_cloak: { need: { leather_scrap: 6, herb_bundle: 2, rope_coil: 1 }, out: "hunter_cloak", qty: 1, srv: 1 },
  welder_apron: { need: { leather_scrap: 3, steel_plate: 1, cloth_roll: 2 }, out: "welder_apron", qty: 1, srv: 1 },
  diver_suit: { need: { rope_coil: 2, cloth_roll: 3, fuel_can: 1 }, out: "diver_suit", qty: 1, srv: 1 },
  kevlar_vest: { need: { cloth_roll: 4, steel_plate: 2, duct_tape: 2 }, out: "kevlar_vest", qty: 1, srv: 1 },
  compass: { need: { battery_pack: 1, copper_wire: 1, steel_plate: 1 }, out: "compass", qty: 1, srv: 1 },
  earplugs: { need: { cloth_roll: 1, duct_tape: 1 }, out: "earplugs", qty: 1, srv: 1 },
  survival_bracelet: { need: { rope_coil: 1, duct_tape: 1, scrap: 2 }, out: "survival_bracelet", qty: 1, srv: 1 },
  night_goggles: { need: { circuit_board: 1, battery_pack: 2, steel_plate: 1, leather_scrap: 1 }, out: "night_goggles", qty: 1, srv: 1 }
};

// <<REPAIR-HELPERS  ซ่อม/รื้ออาวุธ (เฉพาะมนุษย์ใน Safe Zone, เฉพาะอาวุธมาตรฐาน 10 ชนิด — ไม่รวม admin_katana / custom)
// สูตรทั้งหมดต้องตรงกับ database_rules.json (ช่อง inventory/$uid/$slot) ถ้าแก้ตรงนี้ ต้องแก้ rules ด้วย
// สัญญากับ rules:
//   ซ่อม  = เขียนช่องอาวุธ {dur: m, maxDur: m} (m = nextMaxDur) + หัก scrap = repairCost ในคำสั่ง update เดียวกัน
//   รื้อ/พัง = ลบช่องอาวุธ + เขียน scrap (qty ใหม่) + เขียน salvage/{uid} = { slot: <ช่องอาวุธที่ลบ>, ts: serverTimestamp() } ในคำสั่งเดียวกัน
//   พังเอง (dur 1→0) ได้ซาก BREAK_SCRAP = 1 ฝั่งมนุษย์ ส่วนซอมบี้ไม่ได้
const SALVAGE_IDS = ["wooden_bat", "pocket_knife", "crowbar", "knife", "spiked_bat", "fire_axe", "crossbow", "pistol", "samurai_sword", "shotgun", "lab_blade"];
const BREAK_SCRAP = 1;
const isSalvageable = (it) => !!it && SALVAGE_IDS.includes(it.id);
const repairFull = (id) => Math.ceil(ITEMS[id].dmg / 4) + 1;                 // ค่าซ่อมเต็ม (scrap) = ปัดขึ้น(ดาเมจ ÷ 4) + 1
const slotMaxDur = (it) => it.maxDur ?? ITEMS[it.id].maxDur;                  // ความทนสูงสุดปัจจุบันของช่อง (ของเก่าไม่มี maxDur → ใช้ค่าตั้งต้น)
const nextMaxDur = (mx) => Math.floor((mx * 9) / 10);                         // ซ่อม 1 ครั้ง: สูงสุดลด 10% (ปัดลง)
const minMaxDur = (id) => Math.ceil(ITEMS[id].maxDur / 2);                    // ลดได้ไม่เกินครึ่งของค่าตั้งต้น (ปัดขึ้น)
const canRepair = (it) => isSalvageable(it) && it.dur < slotMaxDur(it) && nextMaxDur(slotMaxDur(it)) >= minMaxDur(it.id) && nextMaxDur(slotMaxDur(it)) > it.dur; // ต้องได้ความทนเพิ่มจริง ไม่งั้นเสียของเปล่า
const repairCost = (it) => Math.ceil((repairFull(it.id) * (slotMaxDur(it) - it.dur)) / slotMaxDur(it)); // ตามสัดส่วนที่หายไป (≥ 1 เสมอเมื่อ canRepair)
const repairResult = (it) => { const m = nextMaxDur(slotMaxDur(it)); return { cost: repairCost(it), dur: m, maxDur: m }; };
const canDismantle = (it) => isSalvageable(it) && it.dur <= slotMaxDur(it);   // อาวุธที่ dur เกินสูงสุด (เช่นของรางวัล GM) รื้อไม่ได้
const salvageYield = (it) => Math.max(1, Math.floor((repairFull(it.id) * (slotMaxDur(it) + it.dur)) / (5 * slotMaxDur(it)))); // = ปัดลง(ค่าซ่อมเต็ม × 0.4 × (0.5 + 0.5 × dur/max)) ขั้นต่ำ 1
const repairBlock = (it) => !isSalvageable(it) ? "ซ่อมอาวุธชนิดนี้ไม่ได้"
  : it.dur >= slotMaxDur(it) ? "ความทนยังเต็มอยู่"
  : nextMaxDur(slotMaxDur(it)) < minMaxDur(it.id) ? "ซ่อมจนสุดทางแล้ว (ความทนสูงสุดต่ำสุดแล้ว)"
  : nextMaxDur(slotMaxDur(it)) <= it.dur ? "ซ่อมแล้วความทนไม่เพิ่ม ไม่คุ้ม"
  : "";
// REPAIR-HELPERS>>

// โบนัสทอยลูกเต๋าตอนเจอซอมบี้ตามความแรงของอาวุธที่ถือ
const weaponBonus = (def) => (def.dmg >= 25 ? 3 : def.dmg >= 10 ? 2 : 1);

const FACTION_PERK = {
  human: "มนุษย์: คราฟต์ผ้าพันแผล ยา ซุป และยากระตุ้นจากวัสดุที่ Safe Zone ได้ / ซอมบี้ป่าจะโจมตีคุณ ต้องทอยลูกเต๋าสู้หรือหนี / ถ้าถูกซอมบี้ผู้เล่นกัดโดนจะติดเชื้อ HP ค่อยๆ ลด ต้องรักษาด้วยชุดปฐมพยาบาลหรือมอส",
  zombie: "ซอมบี้: กินอาหารทั่วไป (กระป๋อง ขนมปัง ผลไม้) ไม่ได้ ต้องกัดคนให้โดนเพื่อเติมอาหาร (+25) และฟื้น HP +2 หรือค้นหา “เนื้อเน่า” 🥩 นอก Safe Zone (+20) / ซอมบี้ป่าจะเมินคุณ แต่คุณหิวเร็วกว่า / กัดมนุษย์โดนแล้วเหยื่อจะติดเชื้อ"
};

// danger = ระดับอันตราย 0-10 (กำหนดเอง ปรับได้) / โอกาสเจอซอมบี้คำนวณจากตารางดรอปจริง
const ZONES = {
  safe: { name: "Safe Zone", icon: "🏕️", danger: 0, desc: "ค่ายพักพิง ปลอดภัย ต่อสู้ไม่ได้ เสบียงมีแค่พอเสมอตัว ส่วนใหญ่เป็นวัสดุคราฟต์ — อยากได้ของจริงต้องออกไปข้างนอก", drops: [{ id: "canned_food", w: 4 }, { id: "bread", w: 5 }, { id: "water", w: 9 }, { id: "fruit", w: 5 }, { id: "bandage", w: 3 }, { id: "scrap", w: 22 }, { id: null, w: 52 }] },   // คาดหวังอาหาร ~3.1 / น้ำ ~4.1 ต่อครั้ง ≈ ต้นทุนค้นหา (3 / 4)
  ruins: { name: "เขตเมืองร้าง", icon: "🏚️", danger: 4, desc: "ตึกพังและซากรถ ระวังซอมบี้ตามซอกตึก", drops: [{ id: "zombie", w: 15 }, { id: "canned_food", w: 12 }, { id: "bread", w: 8 }, { id: "water", w: 12 }, { id: "fruit", w: 4 }, { id: "energy_drink", w: 3 }, { id: "wooden_bat", w: 5 }, { id: "spiked_bat", w: 3 }, { id: "knife", w: 6 }, { id: "scrap", w: 12 }, { id: null, w: 20 }] },
  mall: { name: "ห้างสรรพสินค้าร้าง", icon: "🏬", danger: 6, desc: "ของกินเยอะ แต่ซอมบี้ก็เยอะเช่นกัน", drops: [{ id: "zombie", w: 25 }, { id: "canned_food", w: 12 }, { id: "soup", w: 3 }, { id: "choco_bar", w: 3 }, { id: "bread", w: 10 }, { id: "water", w: 16 }, { id: "energy_drink", w: 6 }, { id: "crowbar", w: 10 }, { id: "scrap", w: 8 }, { id: null, w: 7 }] },
  hospital: { name: "โรงพยาบาล", icon: "🏥", danger: 7, desc: "ยาและเวชภัณฑ์เยอะ แต่อันตรายมาก", drops: [{ id: "zombie", w: 28 }, { id: "bandage", w: 10 }, { id: "medkit", w: 6 }, { id: "moss", w: 4 }, { id: "water", w: 10 }, { id: "energy_drink", w: 5 }, { id: "scrap", w: 8 }, { id: "antidote", w: 1 }, { id: "serum", w: 2 }, { id: "trauma_kit", w: 1 }, { id: "chem", w: 4 }, { id: null, w: 21 }] },
  police: { name: "สถานีตำรวจ", icon: "🚓", danger: 9, desc: "สถานที่หาอาวุธชั้นดี ถ้าคุณรอดจากฝูงผีได้", drops: [{ id: "zombie", w: 30 }, { id: "pistol", w: 10 }, { id: "knife", w: 12 }, { id: "bandage", w: 5 }, { id: "bread", w: 5 }, { id: "energy_drink", w: 5 }, { id: "shotgun", w: 5 }, { id: "stim_shot", w: 3 }, { id: null, w: 25 }] },
  forest: { name: "ป่าลึก", icon: "🌲", danger: 2, desc: "เงียบสงบ ผลไม้และมอสขึ้นชุก อาจเจอของแปลกๆ ซ่อนอยู่", drops: [{ id: "zombie", w: 10 }, { id: "water", w: 15 }, { id: "fruit", w: 18 }, { id: "moss", w: 8 }, { id: "crowbar", w: 8 }, { id: "pistol", w: 3 }, { id: "pocket_knife", w: 1 }, { id: "scrap", w: 8 }, { id: null, w: 29 }] },
  factory: { name: "โรงงานร้าง", icon: "🏭", danger: 5, desc: "เครื่องจักรสนิมเขรอะ เศษวัสดุและสารเคมีเพียบ อาวุธหนักๆ ก็พอมี", drops: [{ id: "zombie", w: 20 }, { id: "scrap", w: 15 }, { id: "chem", w: 10 }, { id: "energy_drink", w: 5 }, { id: "fire_axe", w: 6 }, { id: "spiked_bat", w: 5 }, { id: "pocket_knife", w: 6 }, { id: "canned_food", w: 6 }, { id: "antidote", w: 1 }, { id: null, w: 26 }] },
  port: { name: "ท่าเรือ", icon: "⚓", danger: 5, desc: "ตู้คอนเทนเนอร์เรียงรายเต็มไปด้วยเสบียง ระวังฝูงซอมบี้หลบอยู่หลังตู้", drops: [{ id: "zombie", w: 18 }, { id: "canned_food", w: 14 }, { id: "water_jug", w: 8 }, { id: "army_meal", w: 4 }, { id: "choco_bar", w: 8 }, { id: "bread", w: 6 }, { id: "fruit", w: 5 }, { id: "scrap", w: 8 }, { id: "pocket_knife", w: 4 }, { id: "crossbow", w: 3 }, { id: "soup", w: 4 }, { id: null, w: 18 }] },
  base: { name: "ค่ายทหารร้าง", icon: "🪖", danger: 8, desc: "คลังแสงและเสบียงทหาร ของดีจริงแต่ทหารผีเฝ้าอยู่เต็มพื้นที่", drops: [{ id: "zombie", w: 30 }, { id: "army_meal", w: 10 }, { id: "shotgun", w: 5 }, { id: "pistol", w: 8 }, { id: "crossbow", w: 4 }, { id: "trauma_kit", w: 3 }, { id: "stim_shot", w: 5 }, { id: "medkit", w: 4 }, { id: "bandage", w: 4 }, { id: "water_jug", w: 6 }, { id: null, w: 21 }] },
  tunnel: { name: "อุโมงค์ใต้ดิน", icon: "🕳️", danger: 10, desc: "มืดสนิทและอับชื้น ซอมบี้ชุกที่สุดในเมือง แต่ของหายากซ่อนอยู่ข้างใน", drops: [{ id: "zombie", w: 35 }, { id: "chem", w: 10 }, { id: "scrap", w: 8 }, { id: "samurai_sword", w: 3 }, { id: "shotgun", w: 4 }, { id: "serum", w: 3 }, { id: "antidote", w: 1 }, { id: "trauma_kit", w: 2 }, { id: "stim_shot", w: 5 }, { id: "soup", w: 4 }, { id: null, w: 25 }] },
  lab: { name: "ศูนย์วิจัยร้าง", icon: "🧬", danger: 9, desc: "ห้องแล็บใต้ดินของโครงการที่ล้มเหลว ตัวอย่างและยาทดลองยังเหลืออยู่เต็มตู้ แต่สิ่งที่ถูกทดลองก็ยังเดินอยู่ด้วย", drops: [{ id: "zombie", w: 30 }, { id: "chem", w: 12 }, { id: "lab_sample", w: 8 }, { id: "scrap", w: 8 }, { id: "serum", w: 4 }, { id: "antidote", w: 1 }, { id: "stim_shot", w: 5 }, { id: "energy_drink", w: 4 }, { id: "trauma_kit", w: 2 }, { id: null, w: 26 }] }
};
// คาสิโนเถื่อน: โซนสงบแบบ Safe Zone (ห้ามต่อสู้/ไม่เจอซอมบี้/ไม่ค้นหา) — ซ่อนจาก Object.keys(ZONES) โดยตั้งใจ เพื่อไม่ให้ระบบอีเวนต์/ภารกิจ/บอสโลกสุ่มลงโซนนี้ (ปุ่มเดินทางเพิ่มเองใน buildZoneList)
Object.defineProperty(ZONES, "casino", { enumerable: false, value: { name: "คาสิโนเถื่อน", icon: "🎰", danger: 0, desc: "บ่อนใต้ดินของพวกรอดชีวิตที่เห็นแก่ได้ ห้ามตีกัน แลกของเป็นชิป เล่นพนัน หรือจ่ายด้วยเลือด — ⚠️ การพนันไม่เคยทำให้ใครรวย", drops: [{ id: null, w: 1 }] } });
// คุก: โซนสงบซ่อน (เหมือนคาสิโน) — ผู้ถูกจับเท่านั้น (ฟังก์ชัน jailAct + rules) ไม่ขึ้นรายการเดินทาง
Object.defineProperty(ZONES, "jail", { enumerable: false, value: { name: "คุกผู้รอดชีวิต", icon: "⛓️", danger: 0, desc: "ห้องขังของพวกรอดชีวิตที่ไม่ยอมให้ใครก่อเรื่อง ทำงานลดโทษ จ่ายค่าประกัน หรือเสี่ยงแหกคุก — ออกเองไม่ได้จนกว่าจะครบโทษ", drops: [{ id: null, w: 1 }] } });
const isPeace = (z) => z === "safe" || z === "casino" || z === "jail";

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
const nightMod = (z) => (!isPeace(z) && isNight() && !gearHas("headlamp") && !gearFxFlag("nightSafe") ? NIGHT_MOD : { dmod: 0, zmod: 0, nmod: 0 });

const effDanger = (z) => Math.max(0, Math.min(10, ZONES[z].danger + (zoneEv(z)?.dmod || 0) + nightMod(z).dmod + wallDmod(z) + wxDmod(z) + fxDmod(z)));
function effectiveDrops(z) { return fxDrops(z, wxNzDrops(z, hcAdd(z, effectiveDrops0(z)))); }   // + อากาศ + เสียงดัง (หัวข้อ 35)
function effectiveDrops0(z) {
  if (z === "safe" && wallBroken()) return [...ZONES.safe.drops, { id: "zombie", w: WALL_BREACH_Z }];   // กำแพงพัง → ซอมบี้บุก Safe Zone
  const e = zoneEv(z), n = nightMod(z);
  const zm = (e?.zmod || 0) + n.zmod, nm = (e?.nmod || 0) + n.nmod;
  if (!zm && !nm) return ZONES[z].drops;
  return ZONES[z].drops.map((d) => d.id === "zombie" ? { ...d, w: Math.max(0, d.w + zm) } : d.id === null ? { ...d, w: Math.max(0, d.w + nm) } : d);
}

// เนื้อเน่า: น้ำหนักดรอปเพิ่มเฉพาะฝั่งซอมบี้ (นอก Safe Zone)
const ZOMBIE_EXTRA = { ruins: 8, mall: 6, hospital: 6, police: 4, forest: 14, factory: 5, port: 10, base: 4, tunnel: 10, lab: 8, safe: 6 };
function humanDrops(z) {
  const d = effectiveDrops(z), w = BOSS_W[z], g = GEAR_DROPS[z];
  let t = w ? [...d, { id: "boss", w }] : d;
  if (g) t = [...t, ...Object.entries(g).map(([id, gw]) => ({ id, w: gw }))];   // ชุดสวมใส่ประจำโซน
  const md = MAT_DROPS[z]; if (md) t = [...t, ...Object.entries(md).map(([id, mw]) => ({ id, w: mw }))];   // วัตถุดิบ/ของสะสม
  return t;
}   // ตารางค้นหาของมนุษย์ = ตารางโซน + โอกาสเจอบอส
// ซอมบี้: "เจอซอมบี้" = ตามรอยฝูงไปเจอซากที่ทิ้งไว้ (เนื้อเน่า) แทนที่จะเมินไปเฉยๆ → ฝูงบุก/กำแพงพังจึงเป็นข่าวดีของฝั่งซอมบี้
function zombieDrops(z) {
  const d = effectiveDrops(z).map((x) => x.id === "zombie" ? { id: "rotten_meat", w: x.w * 0.4 } : x), w = ZOMBIE_EXTRA[z], m = MUT_DROPS[z];
  let t = w ? [...d, { id: "rotten_meat", w }] : d;
  if (m) t = [...t, ...Object.entries(m).map(([id, mw]) => ({ id, w: mw }))];   // อวัยวะกลายพันธุ์ประจำโซน
  const md = MAT_DROPS[z]; if (md) t = [...t, ...Object.entries(md).map(([id, mw]) => ({ id, w: mw }))];   // วัตถุดิบ/ของสะสม
  return t;
}

function dangerInfo(id) {
  const drops = gearTable(effectiveDrops(id)), total = drops.reduce((t, d) => t + d.w, 0) || 1;
  const chance = Math.round((100 * (drops.find((d) => d.id === "zombie")?.w || 0)) / total);
  const level = effDanger(id);
  const tier = level === 0 ? 0 : level <= 3 ? 1 : level <= 6 ? 2 : level <= 8 ? 3 : 4;
  return { chance, level, tier, label: ["ปลอดภัย", "ต่ำ", "ปานกลาง", "สูง", "อันตรายมาก"][tier], ev: zoneEv(id) };
}
function renderZoneDanger(z) {
  const el = $("zone-danger"), evEl = $("zone-event"), tEl = $("zone-time"); if (!el) return;
  const d = dangerInfo(z), base = ZONES[z].danger;
  el.className = "danger-line d" + d.tier;
  const pvpTxt = z === "casino" ? "ต่อสู้ไม่ได้ (กฎของบ่อน)" : z === "safe" ? (wallBroken() ? "กำแพงพัง ต่อสู้กันได้" : "ต่อสู้ไม่ได้") : "ผู้เล่นโจมตีกันได้";
  const fogged = !isPeace(z) && wxNow().type === "fog" && wxScale() > 0, cTxt = fogged ? `~${Math.max(0, Math.round(d.chance / 10) * 10 - 10)}–${Math.round(d.chance / 10) * 10 + 10}%` : `${d.chance}%`;
  el.textContent = `⚠️ ${d.level}/10 (${d.label})${d.level !== base ? ` ปกติ ${base}` : ""} • เจอซอมบี้ ${cTxt}${fogged ? " 🌫️" : ""} • ${pvpTxt}`;
  el.title = `ระดับอันตราย ${d.level}/10 (${d.label})${d.level !== base ? ` • ปกติ ${base}/10` : ""} • โอกาสเจอซอมบี้ตอนค้นหา ${cTxt}${fogged ? " (หมอกบังสายตา ประเมินได้แค่ช่วง)" : ""} • ${pvpTxt}`;
  if (tEl) {
    const night = isNight();
    tEl.className = "time-line " + (night ? "night" : "day");
    tEl.textContent = night
      ? `🌙 กลางคืน — อีกประมาณ ${phaseMinsLeft()} นาทีจะสว่าง${z === "safe" ? "" : ` • อันตราย +${NIGHT_MOD.dmod} ซอมบี้ชุกขึ้น`}`
      : `☀️ กลางวัน — อีกประมาณ ${phaseMinsLeft()} นาทีจะมืด`;
  }
  try { wxRender(z); fxRender(z); } catch { /* ข้าม */ }
  try { hcRender(z); } catch { /* ข้าม */ }
  if (evEl) {
    evEl.classList.toggle("hidden", !d.ev);
    if (d.ev) evEl.textContent = `${eventIcon(d.ev)} ${d.ev.title} — ${d.ev.daily ? "ถึงเที่ยงคืน" : `อีกประมาณ ${minsLeft(d.ev)} นาที`}${state.profile?.faction === "zombie" && d.ev.type === "horde" ? " • 🥩 ซากเพียบ" : ""}`;
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
const statOf = (k) => baseStat(k) + buffOf(k) + evoBonus(k);
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
  // หมดอยู่ (ค่าจริง 0): ข้ามเฉพาะเมื่อไม่มีอะไรต้องเปลี่ยนจริงๆ (n=0 และค่าที่เก็บ=0) — ถ้าค่าที่เก็บเป็น 100 แต่เวลาทำให้ค่าจริงเป็น 0 ต้องเขียนรีเซ็ต ts ด้วย
  if (empty) { if (n === 0 && v === 0) return n; u[base] = n; u[base + "Ts"] = serverTimestamp(); }
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
  try { if (careerWearSkip(w)) return; } catch { /* ข้าม */ }   // อาชีพนักล่า: บางครั้งตีแล้วไม่เสียความทน
  if (w.it.dur > 999) return;   // อาวุธค่าสูงเกินเพดาน rules (dur ≤ 999) → ไม่หักความทน ไม่งั้นอัปเดตโดนปฏิเสธ
  const left = w.it.dur - 1;
  if (left <= 0) {
    stat("broke");
    u[`inventory/${state.uid}/${w.slot}`] = null; u[`users/${state.uid}/equipped`] = null;
    // ซากอาวุธ: มนุษย์ได้ scrap 1 (อาวุธมาตรฐาน) — ต้องเขียน salvage/{uid} ในคำสั่งเดียวกันให้ rules ตรวจ; ซอมบี้/อาวุธ custom ไม่ได้
    const have = state.inv.scrap?.qty || 0;
    if (state.profile?.faction === "human" && isSalvageable(w.it) && have < 99) {
      u[`inventory/${state.uid}/scrap`] = { id: "scrap", qty: have + BREAK_SCRAP };
      u[`salvage/${state.uid}/slot`] = w.slot; u[`salvage/${state.uid}/ts`] = serverTimestamp();
      toast(`${w.def.name} พังแล้ว! เหลือซาก ${BREAK_SCRAP} เศษวัสดุ`);
    } else toast(`${w.def.name} พังแล้ว!`);
  }
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
document.querySelectorAll(".tabbar button[data-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
$("tab-hub2")?.addEventListener("click", () => hubOpen());   // แท็บ "กิจกรรม" เปิดแผ่นศูนย์กิจกรรม (ไม่ใช่แผงในหน้า)
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
  try { statProfile(); } catch (e) { console.warn("statProfile", e); }
  $("prof-bio").value = "";
  get(ref(db, "bios/" + state.uid)).then((s) => { $("prof-bio").value = s.val() || ""; }).catch(() => {});
  $("profile-modal").classList.remove("hidden");
});
$("prof-card-open")?.addEventListener("click", () => { try { profOpen(); } catch (e) { console.warn("prof", e); } });
$("prof-bio-save").addEventListener("click", async () => {
  const t = $("prof-bio").value.trim().slice(0, 300);
  try {
    if (t) await set(ref(db, "bios/" + state.uid), t); else await remove(ref(db, "bios/" + state.uid));
    toast("บันทึกประวัติแล้ว");
  } catch (e) { toast(errMsg(e)); }
});
$("bio-close").addEventListener("click", () => $("bio-modal").classList.add("hidden"));
async function showBio(uid, name, fac) {
  $("bio-title").textContent = `ประวัติของ ${name}`;
  { const old = $("bio-scene"); if (old) old.remove(); }
  $("bio-text").textContent = "กำลังโหลด…";
  $("bio-modal").classList.remove("hidden");
  try { const s = await get(ref(db, "bios/" + uid)); $("bio-text").textContent = s.val() || "ยังไม่ได้เขียนประวัติ"; }
  catch { $("bio-text").textContent = "โหลดไม่สำเร็จ"; }
  achBioLine(uid).then((t) => { if (t && !$("bio-modal").classList.contains("hidden")) $("bio-text").textContent += "\n\n" + t; });
  homeVisitFill(uid, name, fac).then((ok) => { if (ok) return; return baseSceneBio(uid, fac).then((o) => { if (!o || $("bio-modal").classList.contains("hidden")) return; let h = $("bio-scene"); if (!h) { h = mk("div"); h.id = "bio-scene"; h.style.margin = "8px 0"; $("bio-text").before(h); } baseSceneFill(h, o); }); }).catch(() => {});
  baseDecoLine(uid).then((t) => { if (t && !$("bio-modal").classList.contains("hidden")) $("bio-text").textContent += "\n\n" + t; });
  try { profVisitFill(uid); } catch { /* ข้าม */ }
  try { gftBioRow(uid, name, fac); gftVisit(uid); } catch (e) { console.warn("gift ui", e); }
}
$("prof-close").addEventListener("click", () => $("profile-modal").classList.add("hidden"));

// ---- คู่มือวิธีเล่น: ตัวเลขดึงจากค่าคงที่ด้านบน เลยไม่ต้องแก้ข้อความซ้ำเมื่อปรับบาลานซ์ ----
const fmtDur = (ms) => { const s = Math.round(ms / 1000), m = Math.floor(s / 60), r = s % 60; return m ? (r ? `${m} นาที ${r} วินาที` : `${m} นาที`) : `${s} วินาที`; };

// ข้อความเพิ่มในหน้า "วิธีเล่น" — ตัวเลขอ่านจากตารางปรับสมดุลโดยตรง (แก้ตารางแล้วหน้านี้อัปเดตตามเอง)
function guideExtra(sec) {
  const nm = (src) => (src === "zombie" ? "ซอมบี้ทั่วไป" : src === "wboss" ? "บอสโลก" : BOSSES[src]?.name || src);
  sec("สถานะผิดปกติ", [
    "โดนซอมบี้/บอสตีจนเสีย HP มีโอกาสติดสถานะ: 🩸 เลือดไหล (เสีย HP ทุกรอบ) • ☠️ พิษ (เสีย HP+พลังงาน) • 😵 มึนงง (โจมตีไม่ได้ ค้นหาไม่ได้) • 🎯 อ่อนแรง (ทอยสู้มอนสเตอร์แย่ลง)",
    "รักษา: 🩹 ผ้าพันแผล (เลือดไหล) • 🧰 ชุดปฐมพยาบาล/🌿 มอส (พิษอ่อน) • สถานะหายเองเมื่อหมดเวลา (ไม่เกิน 5 นาที)",
    "☠️ พิษมี 2 ระดับ: พิษอ่อนรักษาได้ด้วยมอส/ชุดปฐมพยาบาล ส่วน “พิษแรง” (จากอุโมงค์ โรงพยาบาล โรงงาน ท่าเรือ และบอส) รักษาได้เฉพาะ 💉 ยาแก้พิษ หรือ 🩺 ชุดช่วยชีวิตขั้นสูง",
    "💉 ยาแก้พิษให้ภูมิต้านพิษ 10 นาที ใช้ล่วงหน้าก่อนไปโซนอันตรายได้ — ทำเองได้ (สารเคมี 2 + เศษเหล็ก 1)",
    ...Object.entries(MON_FX).map(([src, t]) => `${nm(src)}: ${Object.entries(t).map(([k, [pc]]) => `${FX_TYPES[k].icon}${FX_TYPES[k].name} ${pc}%`).join(" • ")}`)
  ]);
  sec("📡 ภารกิจ HC (เมื่อเปิดใช้งาน)", [
    "มีสัญญาณขอความช่วยเหลือจากศูนย์วิจัยร้าง: มนุษย์ต้องล้ม “ผู้เฝ้า” (บอสศูนย์วิจัย) ให้ได้ก่อน แล้วค้นหาต่อที่นั่นเรื่อยๆ จนเจอต้นสัญญาณ — ยิ่งค้นนานยิ่งเจอง่ายขึ้น",
    "ซอมบี้ไม่ต้องสู้บอส (เป็นตัวทดลองเก่าของที่นั่น) ค้นหาที่ศูนย์วิจัยได้เลย",
    "เจอแล้ว ธาราจะไปอยู่ที่ค่าย (การ์ด “คนในค่าย” ที่ Safe Zone) คุยได้เหมือนมิราและเคน ทำเรื่องนี้ครั้งเดียวต่อคน",
    "🧬 ชิ้นส่วน DNA ดรอปยากที่ศูนย์วิจัยร้าง (ทั้งมนุษย์และซอมบี้) — ส่งให้ธาราผ่านปุ่ม “ส่งชิ้นส่วน DNA” ยอดรวมของทุกคนในเซิร์ฟเวอร์ ไม่หายเมื่อตาย"
  ]);
  sec("🎲 ท้าดวลผู้เล่น (Safe Zone)", [
    "กดปุ่ม 🎲 ที่แถบบน (ปรากฏเมื่ออยู่ Safe Zone) → ตั้งดวลโดยวางของกิน/ยา/วัสดุ 1–5 ชิ้น คนรับต้องวางของชนิดและจำนวนเท่ากัน ผู้ชนะได้ทั้งหมด เสมอได้คืน",
    "เกม: 🎲 ทอยเต๋า (เลข 0–99 มากกว่าชนะ) • 🪙 โยนเหรียญ • ✊ เป่ายิ้งฉุบ • 🃏 21 (ได้ไพ่ 2 ใบ เลือกจั่วเพิ่ม 0–3 ใบแบบลับ ใกล้ 21 ที่สุดชนะ เกินคือแพ้ ไม่ตอบใน 5 นาที = เสมอ)",
    "ผลถูกคำนวณโดยระบบจากเวลาเซิร์ฟเวอร์ตอนมีคนรับ ไม่มีใครเลือกผลเองได้ • ยกเลิกดวลที่ยังไม่มีคนรับได้ ได้ของคืนครบ • ของในกระเป๋าเต็ม 99 ชิ้น ส่วนที่เกินจะหาย"
  ]);
  sec("อาวุธและการสลับอาวุธ", [
    "อาวุธคม (" + Object.keys(WPN_PROC).map((id) => ITEMS[id]?.name || id).join(", ") + ") ตีบอสประจำโซนโดนมีโอกาสทำให้บอสเลือดไหล (สกิลโจมตีโดนแน่เพิ่มโอกาสเป็น 2 เท่า)",
    "สีของความทนอาวุธ: เขียว = ปกติ • เหลือง = เหลือครึ่งหนึ่ง • แดง = ใกล้พัง",
    "สลับอาวุธกลางสู้ได้จากแถบใต้ชื่ออาวุธ (หรือกด Q บนคอมพิวเตอร์) — คูลดาวน์ " + SWAP_CD / 1000 + " วิ แต่ถ้าอาวุธพังจนมือเปล่า สลับได้ทันที"
  ]);
  sec("ที่พัก ฤดูกาล และกิจกรรมโลก", [
    "🏠 ที่พัก (ปุ่มข้างตลาด): วางสถานีรองน้ำ/ดักสัตว์/ปลูกมอสในค่าย เก็บผลผลิตได้ตามเวลาแม้ไม่ออนไลน์ (เก็บสะสมได้จำกัด) • อัปเกรดเพิ่มช่องด้วยของที่หาข้างนอก • 🛠️ โต๊ะงานใส่วัตถุดิบแล้วรอรับของ • 🪟 ซื้อของตกแต่งให้ที่พัก คนอื่นเห็นในหน้าประวัติ",
    "🍂 ฤดูกาล 28 วัน: แต่ละฤดูเปลี่ยนของที่เจอบ่อย มีเป้าส่วนตัว 3 ข้อ ครบแล้วได้เหรียญติดตัว • 📖 สมุดสะสมบันทึกของ/สถานที่/เทศกาล/คลังลับที่เคยพบ • 📅 สรุปวันดูได้ในแท็บ 🌍",
    "🎆 เทศกาลตามปฏิทิน (จันทร์เต็มดวง ฝนดาวตก สงกรานต์ ฯลฯ) • 🛩️ คลังลับ: ฟังข่าวลือทางวิทยุแล้วค้นหาให้ถูกโซน • 🤝 ภารกิจเคียงข้าง: อยู่กับเพื่อนในโซนนอกค่ายครบเวลาได้โชคค้นหาดีขึ้น • 🧭 เส้นทางอาชีพคิดจากสิ่งที่คุณทำบ่อยที่สุด",
    "🏕️ โปรเจกต์ค่าย/รัง: สมทบของใน Safe Zone ครบเป้าแล้วทั้งฝั่งได้โบนัสเล็ก ๆ • ⚔️ ศึกชิงโซน: ฝั่งที่แต้มมากกว่าในโซนนั้นยึดโซนสัปดาห์ถัดไปและได้โบนัสเล็ก ๆ • 🤝 หัวใจของมิราและเคนปลดพรเล็ก ๆ ดูได้ในแท็บ 🌍"
  ]);
  sec("สรุป อันดับ บันทึก เสียง", [
    "ปุ่ม 📊 ด้านบน: สรุปวันนี้/สัปดาห์ (นับในเครื่องนี้), อันดับ (ทุบกำแพงรายสัปดาห์ ดาเมจบอสโลก), และสมุดบันทึกเหตุการณ์ของคุณ",
    "แถบสีเหลือง/แดงเหนือปุ่มค้นหาคือคำเตือน เช่น HP ต่ำ ติดสถานะ อาวุธใกล้พัง หิว พลังงานใกล้หมด",
    "ปุ่ม ⚙️ ตั้งค่า: เสียง/สั่นเตือน, แจ้งเตือนบนอุปกรณ์ (พลังงานเต็ม บอสโลกเกิด โดนตี), ซ่อนข้อความบรรยากาศ, สลับแผนที่/รายการ และติดตั้งเป็นแอป",
    "ปุ่ม ☆ ข้างไอเทมกินได้/ยา = ปักไว้ที่แถบลัดใต้หลอดพลัง (สูงสุด 4 ช่อง) กดใช้ได้ทันทีจากทุกแท็บ"
  ]);
}
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
  sec("คนในค่าย (มิรา / เคน)", [
    "ที่ Safe Zone มี มิรา (พยาบาล) กับ เคน (ยามกำแพง) ให้คุยด้วย — กดการ์ด “คนในค่าย” ใต้รายการโซน",
    "คุยครั้งแรกของวันได้ความสนิท (หัวใจ ❤️) + ของขวัญประจำวันที่ปุ่มภารกิจ หัวใจยิ่งเยอะ ของขวัญยิ่งดี และปลดล็อกเรื่องราวตอนใหม่ รวม 5 ตอน",
    "คำตอบที่เลือกมีผลต่อเนื้อเรื่องและความสนิท ทั้งสองคนจำสิ่งที่คุณเคยเลือกได้ ออกจากฉากกลางคันจะไม่นับความคืบหน้าของฉากนั้น",
    "ซอมบี้ก็คุยได้ แต่เขาจะระวังตัวกว่า"
  ]);
  sec("วิทยุ • เช็กอิน • คืนปิดล้อม", [
    "📻 วิทยุฉุกเฉินประกาศข่าวสถานะโลกทุก ~20 นาที (ดูย้อนหลังที่แผง “วิทยุฉุกเฉิน” ในแท็บโซน/ผู้เล่น) บางครั้งสถานีจะเชิญสัมภาษณ์ — ตอบ 1 ข้อ แล้วคำตอบจะถูกประกาศให้ทุกคน",
    "📖 แท็บ “สะสม” ในศูนย์กิจกรรม: สมุดสะสมแบบชุด (ครบชุดรับรางวัลครั้งเดียว) + ความสมบูรณ์ผู้รอดชีวิต % รางวัลที่ 25/50/75/100% • หีบรายวันผ่อนผันให้ขาดได้ 1 วันโดย streak ไม่หาย",
    "🃏 โต๊ะสลาฟ (ในคาสิโนเถื่อน → แท็บ “สลาฟ”): ผู้เล่น 3–4 คน 3 รอบ ลงไพ่เดี่ยว/คู่/ตอง/โฟร์ ชนิดเดียวกันและสูงกว่ากองกลาง ไพ่หมดก่อน = King หมดท้ายสุด = Slave (รอบถัดไป Slave ให้ไพ่แรงสุด 2 ใบกับ King, King คืน 2 ใบ) • ค่าเข้าโต๊ะรวมเป็นกอง อันดับ 1 ได้ 60% อันดับ 2 ได้ 30% บ่อนเก็บ 10% • ตาละ 30 วินาที ออกกลางเกม/หมดเวลาติดกัน 3 ครั้งเสียค่าเข้า",
    "🎰 คาสิโนเถื่อน: เดินทางไปที่โซน “คาสิโนเถื่อน” (ห้ามต่อสู้ ไม่มีซอมบี้) — แลกของ/เลือด (HP) เป็นชิป เล่นสล็อต รูเล็ต ไฮโล บาคาร่า สูง-ต่ำ แบล็กแจ็ก โป๊กเกอร์ กู้เงินนอกระบบได้ (ไม่คืน = ถูกยึดของ) และเอาชิปแลกของ/ของตกแต่งห้อง เจ้ามือได้เปรียบเสมอ — การพนันไม่เคยทำให้ใครรวย เสียสุทธิได้ไม่เกิน 2000 ชิปต่อวัน",
    "⚡ ความสามารถประจำสาย: แถบใต้ปุ่มค้นหา — มนุษย์ใช้พลังตามอาชีพ (นักสำรวจ ส่องทาง • นักล่า เตรียมซุ่ม • หมอสนาม รักษาตัวเอง/เพื่อนในโซนเดียวกัน • พ่อค้า สายส่งวัสดุ) ซอมบี้ใช้พลังตามสายวิวัฒนาการ (ล่ากลิ่น • ผิวหนา • ซุ่มเงียบ) มีค่าใช้จ่ายเล็กน้อยและคูลดาวน์ • ⚔️ ศึกใหญ่ประจำสัปดาห์: 🎲 ผจญภัย → แท็บ ศึกใหญ่ (แต้มศึกชิงโซนรวมทั้งเซิร์ฟเวอร์ ฝ่ายชนะได้โบนัสและรางวัล)",
    "🧭 แถบโค้ชบนสุดของหน้าเกม: บทเรียนแนะนำการเล่น 12 ขั้น แยกมนุษย์/ซอมบี้ (ต่อจากภารกิจวันแรก) ปุ่ม “ไปเลย” พาเปิดหน้าต่างที่เกี่ยวข้อง ทุกขั้นมีรางวัล ครบแล้วรับของปิดท้าย",
    "🪪 ตกแต่งโปรไฟล์ (หน้าต่างโปรไฟล์ → ปุ่ม “ตกแต่งโปรไฟล์”): เลือกอวาตาร์ กรอบ แบนเนอร์ ฉายา (ปลดล็อกจากความก้าวหน้า) หรืออัปโหลดรูปเอง — ระบบแปลงเป็น webp ไม่เกิน 100 KB ให้เองและลบข้อมูลตำแหน่งในรูป เปลี่ยนได้ชั่วโมงละครั้ง รูปผิดกฎกด 🚩 รายงานได้",
    "🛋️ จัดห้อง (หน้าต่างที่พัก → แท็บ “จัดห้อง”): เลือกของจากถาด แตะในภาพเพื่อวาง/ย้าย แล้วบันทึก • ธีมห้อง 13 แบบ • ของตกแต่งใหม่ 48 ชิ้น (ซื้อด้วยวัสดุ หรือได้จากหีบ/ซีซัน/สมุดสะสม/ห้องยอดนิยม) • คนอื่นเห็นห้องของคุณในหน้าประวัติ กด ❤️ ถูกใจได้วันละ 5 ห้อง ห้องยอดนิยมประจำสัปดาห์ได้รางวัล",
    "🌱 แปลงปลูก (ในหน้าต่างที่พัก): ลงเมล็ด → รดน้ำ/ใส่ปุ๋ย → เก็บเกี่ยว ฤดูกาลมีผลกับเวลาโต รับเมล็ดฟรีวันละครั้ง ได้เมล็ดเพิ่มจากหีบ/พ่อค้าเร่/ดิ่งลึก/เหตุการณ์สุ่ม • ซอมบี้เลี้ยงเชื้อรา/หนอนแทน",
    "🎲 🎲 ผจญภัย: 🕳️ ดิ่งลึก (ลงชั้นใต้ดินที่อุโมงค์/ห้องแล็บ เลือกทางเสี่ยงโชค ขึ้นจากหลุมเพื่อเก็บของ) • 👹 ศัตรูคู่อาฆาต (โผล่ระหว่างค้นหา ยิ่งหนียิ่งแรง) • 📻 ปริศนาวิทยุรายสัปดาห์ (แชร์เบาะแสกันในแชต) • 🐪 ขบวนพ่อค้าเร่ (โผล่ในโซนสุ่ม ของจำกัด)",
    "🎁 🎁 รายวัน: หีบรายวัน (เปิดวันละครั้ง streak 7 วันได้ของหายาก) • ล่าค่าหัวประจำวัน • อีเวนต์โลกรายสัปดาห์ที่ทุกคนช่วยกัน • ต้นไม้อัปเกรดค่ายและระดับสัตว์เลี้ยง (โบนัสถาวรเล็ก ๆ)",
    "🎟️ แท็บ “🎲 กิจกรรม” (แถบล่างบนมือถือ / ปุ่มบนแถบบนบนคอม) → 🎟️ ซีซัน: ภารกิจซีซัน — ภารกิจรายวัน 3 ข้อ/รายสัปดาห์ 4 ข้อ ได้ XP สะสมปลดรางวัล 30 ระดับ รีเซ็ตทุกซีซัน (28 วัน) กดรับเองก่อนซีซันจบ",
    "🎭 เหตุการณ์สุ่ม: ระหว่างค้นหานอก Safe Zone มีโอกาสเจอสถานการณ์ให้เลือกทาง (บางทางต้องใช้ของ) ผลลัพธ์สุ่ม อาจได้ของหรือเสีย HP แต่จะไม่ทำให้ตาย",
    "🔥 เข้าเล่นวันละครั้งนับเป็นเช็กอิน (ปุ่มภารกิจ) — สะสม 3/5/7 วันต่อสัปดาห์ได้รางวัลเพิ่ม",
    "🔥 ปุ่ม “🔥 n/28” บนแถบบน: ปฏิทินเช็กอินประจำซีซัน (28 วัน) นับสะสมวันที่เข้าเล่น ไม่ต้องติดกัน มีรางวัลวันที่ 3/7/14/21/28 กดรับเอง — รางวัลซีซันเก่ารับได้จนกว่าจะเริ่มนับซีซันใหม่",
    "🎁 ห่างไปเกิน 3 ชั่วโมง จะมีสรุปว่าระหว่างที่ไม่อยู่มีอะไรรอคุณ • ห่างไปเกิน 7 วัน รับของขวัญต้อนรับกลับได้หนึ่งครั้ง",
    "🚨 ทุกวันมี “คืนปิดล้อม” 30 นาทีช่วงหัวค่ำ (เวลาเริ่มไม่เท่ากันทุกวัน ดูได้ที่แผงวิทยุ) ซอมบี้ทุบกำแพง มนุษย์ซ่อมกำแพงที่ Safe Zone นับเป็นเควสพิเศษ"
  ]);
  sec("ความสำเร็จ • ฉายา • เป้าหมายร่วม", [
    "🏅 ความสำเร็จกว่า 140 อัน (ปุ่ม 🏅 มุมบน) ปลดล็อกจากสิ่งที่คุณทำ มีระดับ ทองแดง/เงิน/ทอง/ตำนาน และมีของลับให้ค้นหา",
    "🏷️ เลือกความสำเร็จที่ปลดแล้วเป็นฉายา — คนอื่นเห็นข้างชื่อคุณในแชทและรายชื่อผู้เล่น (ความสำเร็จให้ฉายา ไม่ให้ของ)",
    "🌍 ทุกสัปดาห์มีเป้าหมายร่วม 3 ข้อ (ทั้งเซิร์ฟเวอร์ / มนุษย์ / ซอมบี้) ช่วยกันทำคนละไม้คนละมือ ถ้าสำเร็จและคุณมีส่วนร่วมพอ รับรางวัลได้ที่ 📜 ภารกิจ",
    "📻 ทุก 2 ชั่วโมงวิทยุจะประกาศภารกิจกลุ่มสั้นๆ (ภารกิจของฝั่งคุณกับอีกฝั่งแยกกัน) ช่วยกันทำให้ทันภายใน 90 นาที",
    "🌟 ทุกเช้าวิทยุประกาศผู้รอดเด่นของเมื่อวาน (นักสำรวจ นักสู้ ผู้ดูแลกำแพง นักล่าบอส) ดูทั้งหมดที่ 📊 → 🌍"
  ]);
  sec("หิวและกระหาย", [
    `อาหารของมนุษย์ลด 1 ทุก ${fmtDur(FOOD_DECAY_MS.human)} ซอมบี้หิวเร็วกว่า ลด 1 ทุก ${fmtDur(FOOD_DECAY_MS.zombie)}`,
    `น้ำลด 1 ทุก ${fmtDur(WATER_DECAY_MS)} ความหิวและกระหายหยุดนับตอนออกจากเกม (อาจคลาดเคลื่อนไม่กี่สิบวินาที)`,
    "ถ้าอาหารหรือน้ำเหลือ 0 นอก Safe Zone จะค้นหาไม่ได้เลย",
    `ใน Safe Zone ยังค้นหาได้เพื่อไม่ให้ติดตาย แต่เสีย HP ${STARVE_HP} ต่อครั้ง`
  ]);
  sec("การเดินทาง", [
    `ย้ายโซนเสียพลังงานตามความไกลจาก Safe Zone: ใกล้ 6 / กลาง ${TRAVEL_STAMINA} / ไกล 14 (กลับ Safe Zone เสีย ${TRAVEL_STAMINA_SAFE})`,
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
    "ซอมบี้/บอสที่ตีโดนมีโอกาสทำให้ติดสถานะ (🩸เลือดไหล ☠️พิษ 😵มึนงง 🎯อ่อนแรง) — รักษาด้วยผ้าพันแผล/ยาถอนพิษ • อาวุธคมมีโอกาสทำให้บอสประจำโซนเลือดไหล • สลับอาวุธกลางสู้ได้จากแถบใต้ชื่ออาวุธ (คูลดาวน์ 15 วิ แต่ถ้าอาวุธพังสลับได้ทันที)",
    `ชนะได้ของหายากประจำโซน 1 ชิ้น + ของแถมบางครั้ง เจอบอสได้ทุก ๆ ${fmtDur(BOSS_COOLDOWN)} อย่างน้อย`
  ]);
  sec("ฝ่ายซอมบี้", [
    "กินอาหารคนทั่วไปไม่ได้ ต้องหาอาหารจากการกัดผู้เล่นหรือเก็บ 🥩 เนื้อเน่า (+20) ที่ค้นเจอนอก Safe Zone",
    "เนื้อเน่ามีแต่ซอมบี้เท่านั้นที่กินลง",
    "อวัยวะกลายพันธุ์ 3 ช่อง (ได้จากการค้นหาและภารกิจ): 🦷 เขี้ยว = ทุบกำแพงแรงขึ้น • 🦴 หนัง = ลดดาเมจที่โดน • 👃 จมูก = เจอเนื้อเน่าบ่อยขึ้น — เปิดกระเป๋าแล้วกด “สวม”",
    `ใน Safe Zone ซอมบี้ทุบกำแพงได้ (−${SMASH_DMG} HP กำแพงต่อครั้ง เสียพลังงาน ${SMASH_STAM} คูลดาวน์ ${SMASH_CD / 1000} วิ) ถ้ากำแพงพัง จะล่าเหยื่อในค่ายได้`,
    `ทุบครบทุก ${SMASH_EVERY} ครั้งได้ 🥩+1 • คนทุบจนพังได้ 🥩+${SMASH_BREAK_BONUS} • แชมป์ทุบสูงสุดประจำสัปดาห์ (อย่างน้อย ${PRIZE_MIN} ครั้ง) รับ 🥩+${PRIZE_MEAT} ได้สัปดาห์ถัดไป`,
    "🌍 เป้าหมายโลกประจำวัน: ทุกวันมี 3 ข้อสุ่มตามโลกวันนั้น (เทศกาล/ดวงจันทร์/ฤดูกาล) ทำข้อไหนสำเร็จได้ 🍀 โชคประจำวัน +15 นาที (ค้นแล้วว่างเปล่าน้อยลง 12% ของหายากออกง่ายขึ้น 20%) ครบ 3 ข้อนับเป็น 1 วันของฉายา • ดูได้ในปุ่ม 📅 • ในนั้นมี 📜 บันทึกประจำฤดูกาล (เหรียญ เทศกาล ผลเป้าหมายร่วม) และ 🏅 ฉายาที่ใกล้ปลดล็อก • สมุดสะสมซิงค์ข้ามเครื่องแล้ว",
    "🎁 เยี่ยมบ้าน/ฝากของ: กดชื่อเพื่อนเพื่อเปิดประวัติ จะเห็นห้องและขั้นบ้านจริงของเขา • ฝากน้ำ/อาหาร/ผ้าพันแผล/มอส/ผลไม้ให้เพื่อนฝั่งเดียวกันได้ทีละ 1 ชิ้น (ตอนอยู่ Safe Zone) เขาไปรับที่ 📬 ตลาด • ฝากค้างได้ 1 ชิ้นต่อคน จนกว่าเขาจะรับ",
    "🌳 ต้นไม้ทักษะ: ทำสายไหนบ่อย สายนั้นได้แต้มทักษะ (ดูที่ 📅 → 🌍 → เส้นทางอาชีพ) ใช้เรียนทักษะเสริมของสายนั้น 5 ขั้น แล้วเลือกปลายสาย 1 จาก 2 • เรียนแล้วเปลี่ยนไม่ได้ ได้โบนัสเล็ก ๆ เหมือนโบนัสอื่น ๆ ในเกม",
    "🧭 ทีมสำรวจ (ปุ่ม 🏠 ที่พัก): ที่พักขั้น 1+ ส่งทีมออกนอกค่าย 4 ชั่วโมง จ่ายเสบียงเล็กน้อย กลับมารับของตามโซนที่ส่งไป แม้ไม่ได้ออนไลน์ • ทีละ 1 ทีม",
    "🧬 ศูนย์วิจัยร้าง (โซนใหม่ ไกลและอันตราย): หาได้ยาทดลอง/สารเคมี และของเฉพาะที่นี่ — 🧫 ตัวอย่างวิจัย (สมทบโปรเจกต์ค่าย/รังได้ 5 แต้มต่อชิ้น) • 🥼 เสื้อกาวน์ปลอดเชื้อ (เกราะ ลดดาเมจ ~17%) • 🔬 เลนส์สแกนชีวภาพ (ของหายากออกง่ายขึ้น) • 🧤 ถุงมือกันสารเคมี (ทนพิษ) • ☣️ ต่อมพิษ (ซอมบี้ ทุบกำแพง+5 ทนพิษ) • ประกอบ 🧪 ซีรั่มทดลอง (ตัวอย่างวิจัย×2 + สารเคมี×2 ที่ Safe Zone: ฟื้น 60 HP รักษาเลือดไหล/พิษทุกระดับ) • บอสประจำโซนมีโอกาสทิ้ง 🔪 มีดผ่าตัดเลเซอร์ กับ 💠 แกนวิจัย (ส่งให้ห้องวิจัยของค่ายได้ผลวิจัยชั่วคราว) • บางช่วงเกิดเหตุการณ์ 🔌 ไฟดับฉุกเฉิน (ของหายากออกง่ายมากแต่ซอมบี้โผล่เพิ่ม) • ส่งทีมสำรวจไปได้",
    "🧭 ภารกิจวันแรก (ปุ่ม 🧭 บนแถบบน): ทำ 6 ข้อเพื่อรู้จักเกมแล้วรับของรางวัล ข้อละครั้งเดียว • 🌳 ปุ่มต้นไม้ทักษะอยู่บนแถบบนเช่นกัน มีจุดแดงเมื่อมีแต้มว่าง",
    "🐾 สัตว์เลี้ยงประจำค่าย (ปุ่ม 🏠 ที่พักขั้น 1+): ส่งออกไปหาของรอบละ 3 ชั่วโมง กลับมารับได้แม้ไม่ได้ออนไลน์ • 🎣 ตกปลาที่ท่าเรือ (มนุษย์ เสีย 10 พลังงาน กดดึงตอนเครื่องหมายอยู่โซนเขียว ฝนช่วยให้ง่ายขึ้น พายุยากขึ้น) ได้ 🐟 ปลาสด/🐠 ปลาทอง แล้วคราฟต์ 🍢 ปลาย่าง กับ 🍲 ซุปปลา ที่ Safe Zone กินแล้วฟื้นพร้อมบัฟสั้น ๆ",
    "🎮 มินิเกมก่อนค้นลึก: จำรหัสวิทยุ 📻 หรือลำดับเสียงป่า 🌲 ให้ถูกครบ = ค้นครั้งนั้นเจอของว่างเปล่าน้อยลง 40% ของหายากออกง่ายขึ้น 50% ซอมบี้น้อยลง 15% (ผิดตัวเดียวได้โบนัสครึ่งหนึ่ง) • กด ข้าม ได้ตลอด หรือปิดด้วยปุ่ม 🎮 ข้างปุ่มค้นลึก",
    "เจอซอมบี้พวกเดียวกันตอนค้นหา = ตามรอยไปเจอซาก ได้เนื้อเน่า (ฝูงบุกและกำแพงพังทำให้ซากเยอะขึ้น) และค้นลึกจะได้เนื้อเน่าเพิ่ม ×2"
  ]);
  sec("ชุดสวมใส่ (ฝ่ายมนุษย์)", [
    "มี 2 ช่อง: 🛡️ เกราะ (ลดดาเมจที่โดน 5–20% ทั้งตอนโดนซอมบี้ โดนผู้เล่นตีสู้ และโดนบอส) และ 🎒 อุปกรณ์เสริม (🍀 เครื่องราง ค้นเจอของง่ายขึ้น • 🔦 ไฟฉาย กลางคืนไม่อันตรายขึ้น • 😷 หน้ากาก เจอซอมบี้น้อยลง • 🛠️ กล่องเครื่องมือ ค้นลึกเสียพลังงานน้อยลง)",
    "ได้จากการค้นหา (แต่ละโซนมีชุดประจำของมัน) คราฟต์ที่ Safe Zone (เสื้อผ้าพันตัว เกราะเศษเหล็ก ไฟฉาย กล่องเครื่องมือ) และรางวัลภารกิจรายวัน — เปิดกระเป๋าแล้วกด “สวม”",
    "ถ้าทิ้งหรือทำลายชุดที่สวมอยู่ ชุดจะถูกถอดอัตโนมัติ ชุดไม่หายตอนตาย",
    "ภารกิจรายวันผูกโซน: ทุกวันมีภารกิจประจำวันนั้น (ค้นหา/โจมตี ฯลฯ ในโซนที่กำหนด) ดูที่ปุ่ม ภารกิจ"
  ]);
  sec("ของบนพื้น", [
    "กดวางไอเทมลงพื้นเพื่อแบ่งให้คนในโซนเดียวกัน ใครอยู่ในโซนก็เก็บได้",
    "วางของชิ้นเดียวจาก slot เดิมซ้ำไม่ได้จนกว่าชิ้นก่อนหน้าจะถูกเก็บ"
  ]);
  guideExtra(sec);
  $("guide-modal").classList.remove("hidden");
}
$("btn-guide").addEventListener("click", openGuide);
$("guide-close").addEventListener("click", () => $("guide-modal").classList.add("hidden"));
// ---- 📰 มีอะไรใหม่ (changelog.json) — แสดงอัตโนมัติครั้งเดียวต่อรายการที่ยังไม่เคยเห็น (เก็บในเครื่อง) + เปิดดูซ้ำได้จากปุ่มในหน้าวิธีเล่น
// รูปแบบไฟล์: { entries: [ { id, date, title, items: [ { k: "ใหม่"|"ปรับ"|"แก้", t: "ข้อความสั้น" } ] } ] } เรียงใหม่สุดไว้บน — แก้ไฟล์นี้ไฟล์เดียวเมื่อมีอัปเดต (ไม่ต้องแก้โค้ดเกม)
const CLOG_KINDS = { "ใหม่": "clog-new", "ปรับ": "clog-chg", "แก้": "clog-fix" };
async function clogLoad() {
  try {
    const r = await fetch(`changelog.json?t=${Date.now()}`, { cache: "no-store" }); if (!r.ok) return [];
    const j = await r.json(); return Array.isArray(j?.entries) ? j.entries.filter((e) => e && typeof e.id === "string" && Array.isArray(e.items)) : [];
  } catch { return []; }
}
function clogRender(entries) {
  const box = $("clog-body"); box.textContent = "";
  if (!entries.length) { box.append(mk("p", "muted", "ยังไม่มีบันทึกการอัปเดต")); return; }
  entries.forEach((e) => {
    const h = mk("div"); h.style.cssText = "margin:0 0 6px;font-weight:700";
    h.append(mk("span", "", String(e.title || "อัปเดต")), mk("span", "muted", e.date ? `  ${String(e.date)}` : ""));
    const ul = mk("ul"); ul.style.cssText = "margin:0 0 14px;padding-left:18px";
    e.items.forEach((it) => {
      const li = mk("li"); li.style.margin = "4px 0";
      const k = typeof it === "string" ? "" : String(it.k || "");
      if (k) li.append(mk("span", "clog-k " + (CLOG_KINDS[k] || ""), k), document.createTextNode(" "));
      li.append(document.createTextNode(typeof it === "string" ? it : String(it.t || ""))); ul.append(li);
    });
    box.append(h, ul);
  });
}
async function clogOpen(onlyUnseen) {
  const all = await clogLoad(), seen = LS.get(lsKey("clog"), ""), i = all.findIndex((e) => e.id === seen);
  const list = onlyUnseen ? (i < 0 ? all.slice(0, 3) : all.slice(0, i)).slice(0, 3) : all.slice(0, 8);   // อัตโนมัติ: เฉพาะที่ยังไม่เคยเห็น (สูงสุด 3 รายการ) • เปิดเอง: ย้อนหลัง 8 รายการ
  if (onlyUnseen && !list.length) return false;
  clogRender(list); $("clog-modal").classList.remove("hidden");
  if (all[0]) LS.set(lsKey("clog"), all[0].id);
  return true;
}
// เรียกหลังเข้าเกม: ผู้เล่นใหม่ (สร้างตัวภายใน 10 นาที) ไม่ต้องเห็น • ถ้ามีหน้าต่างอื่นเปิดอยู่ รอแล้วลองใหม่ (ไม่ทับกัน)
async function clogAuto(tries = 0) {
  try {
    const p = state.profile; if (!p || p.banned) return;
    if (typeof p.createdAt === "number" && serverNow() - p.createdAt < 600000) { const a = await clogLoad(); if (a[0]) LS.set(lsKey("clog"), a[0].id); return; }
    if (document.querySelector(".modal:not(.hidden)")) { if (tries < 6) setTimeout(() => clogAuto(tries + 1), 20000); return; }
    await clogOpen(true);
  } catch { /* ข้าม */ }
}
$("clog-open").addEventListener("click", () => { $("guide-modal").classList.add("hidden"); clogOpen(false); });
$("clog-close").addEventListener("click", () => $("clog-modal").classList.add("hidden"));
// ---- /มีอะไรใหม่


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
          hp = Math.max(1, hp - fxCutDmg(v * ticks));
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
    t.textContent = here ? "" : b.dataset.zone === "safe" && crimMe() ? (crimRed(state.uid) ? "🔴 ห้ามเข้า" : "🟠 ห้ามเข้า") : cd > 0 ? `⏳ ${Math.ceil(cd / 1000)}วิ` : `⚡${travelCost(b.dataset.zone)}`;
    t.title = here ? "" : cd > 0 ? "ยังล้าจากการเดินทางครั้งก่อน" : `เดินทางไปที่นี่ใช้พลังงาน ${travelCost(b.dataset.zone)}`;
  });
  try { zmapBadges(); } catch { /* ยังไม่พร้อม */ }
  try { renderNpcBox(); } catch { /* ยังไม่พร้อม */ }
}

function renderBars() {
  const p = state.profile;
  if (!p) return;
  const st = curStamina();
  const fd = curFood();
  const wt = curWater();
  $("me-infected")?.classList.toggle("hidden", !(p.infected && p.faction === "human" && p.hp > 0));
  
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
  renderDanger($("danger-bar"));
  $("btn-scavenge").disabled = (starving ? ((state.zone !== "safe" && !crimMe()) || p.hp <= STARVE_HP) : st < searchCost()) || effActive("stun");
  const fxEl = $("me-effects");
  if (fxEl) {
    fxEl.textContent = FX_KEYS.filter(effActive).map((t) => `${FX_TYPES[t].icon}${fxName(t)}${t === "dice" ? sgn(effV(t)) : ""} ${Math.max(1, Math.ceil((effEnd(state.effects[t]) - serverNow()) / 60000))}น.`).concat(poisonImmLeft() > 0 ? [`🛡️ต้านพิษ ${Math.ceil(poisonImmLeft() / 60000)}น.`] : []).join("  ");
    fxEl.classList.toggle("hidden", !fxEl.textContent);
  }
  updateAttackButtons();
  renderBuffRow(); clampToMax();
  try { fxStatus(); } catch { /* */ }
  try { achProfileWatch(state.profile); } catch { /* */ }
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
    await signOut(auth); show("login"); $("login-error").textContent = "ไม่พบตัวละคร (ข้อมูลถูกรีเซ็ต) กรุณากด สร้างตัวละคร โดยใช้ชื่อและรหัสผ่านเดิม";
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
  } catch (ex) {
    console.error("auth", ex);
    const c = String(ex?.code || ex);
    $("login-error").textContent =
      c.includes("invalid-credential") || c.includes("wrong-password") ? (mode === "register" ? "ชื่อนี้เคยมีบัญชีอยู่แล้ว — ต้องใช้รหัสผ่านเดิมเท่านั้น (ถ้าจำไม่ได้ ให้แจ้งแอดมินลบบัญชีเดิม)" : "ชื่อหรือรหัสผ่านไม่ถูกต้อง")
      : c.includes("user-not-found") ? "ไม่พบบัญชีนี้"
      : c.includes("too-many-requests") ? "ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่"
      : c.includes("network") ? "เครือข่ายมีปัญหา ลองใหม่อีกครั้ง"
      : c.includes("PERMISSION_DENIED") ? "สร้างตัวละครไม่สำเร็จ (ระบบไม่อนุญาต) — แจ้งแอดมินพร้อมชื่อตัวละคร"
      : "ทำรายการไม่สำเร็จ กรุณาลองใหม่ (" + (ex?.code || "unknown") + ")";
  }
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

// ชุดเริ่มต้นของผู้เล่นใหม่ — ต้องตรงกับ rules (inventory/$uid/$slot ท่อนแรกของ .write) ทุกตัวเลข ถ้าแก้ตรงนี้ต้อง publish rules ใหม่ด้วย
const START_KIT = {
  human: { canned_food: 2, water: 2, bandage: 2, scrap: 3 },
  zombie: { rotten_meat: 3, water: 2, bandage: 2 }
};

async function register(name, email, pw) {
  state.registering = true; let cred, adopted = false;
  try {
    try { cred = await createUserWithEmailAndPassword(auth, email, pw); }
    catch (e) {
      // บัญชีล็อกอินเดิมยังอยู่ แต่ตัวละครในฐานข้อมูลหาย → ถ้ารหัสผ่านถูก ใช้บัญชีเดิมสร้างตัวละครใหม่ได้
      if (e?.code !== "auth/email-already-in-use") throw e;
      cred = await signInWithEmailAndPassword(auth, email, pw);
      adopted = true;
    }
    const uid = cred.user.uid;
    await set(ref(db, "usernames/" + nameKey(name)), uid);
    const stats = { ...regPicker.vals };
    const base = {
      ["users/" + uid]: {
        username: name, faction: pickedFaction, role: "player", banned: false, zone: "safe",
        stamina: STAMINA_BASE + 10 * stats.st, staminaTs: serverTimestamp(), hp: HP_BASE + 10 * stats.hp,
        food: 100, water: 100, foodTs: serverTimestamp(), waterTs: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      ["stats/" + uid]: stats
    };
    // ชุดเริ่มต้น: เขียนพร้อมตัวละครในคำสั่งเดียว (rules ตรวจว่าเป็นตัวละครที่เพิ่งสร้างและจำนวนตรงตาม START_KIT)
    const kit = {};
    Object.entries(START_KIT[pickedFaction] || {}).forEach(([id, qty]) => { kit[`inventory/${uid}/${id}`] = { id, qty }; });
    let gotKit = true;
    try { await update(ref(db), { ...base, ...kit }); }
    catch (e) {
      // กันสมัครไม่ได้ทั้งระบบ: ถ้า rules ยังไม่รองรับชุดเริ่มต้น ให้สมัครแบบไม่มีชุดแทน
      if (!String(e?.code || e).includes("PERMISSION_DENIED")) throw e;
      gotKit = false; await update(ref(db), base);
    }
    state.uid = uid; startGame();
    if (gotKit) toast("ได้รับชุดเริ่มต้นแล้ว — เปิดกระเป๋าดูได้เลย");
  } catch (e) {
    if (adopted) await signOut(auth).catch(() => {});
    else if (cred) await deleteUser(cred.user).catch(() => {});
    throw e;
  }
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
  setTimeout(() => { try { clogAuto(); } catch { /* ข้าม */ } }, 4000);   // 📰 มีอะไรใหม่ (changelog.json)
  setTimeout(() => { try { hbRestore(); } catch { /* ข้าม */ } }, 5000);
  setTimeout(() => { try { tutBoot(); } catch { /* ข้าม */ } }, 2500);   // 🎓 บทสอนผู้เล่นใหม่
  setTimeout(() => { try { if (state.profile?.faction === "zombie") mutSync(); } catch { /* ข้าม */ } }, 6000);   // โหลดขั้นมิวเตชัน (ฮีลตอนกัดขั้น 8)   // 🏹 บอสเผ่ามนุษย์ (ซอมบี้): รีเฟรชกลางการสู้ → เปิดต่อ

  onValue(ref(db, "stats/" + state.uid), (s) => {
    state.stats = s.val(); state.statsLoaded = true;
    if (!s.exists()) openStatModal(); else $("stat-modal").classList.add("hidden");
    renderBars();
  });

  onValue(ref(db, "buffs/" + state.uid), (s) => { state.buff = s.val(); renderBars(); });
  onValue(ref(db, "effects/" + state.uid), (s) => { state.effects = s.val() || {}; renderBars(); });

  onValue(ref(db, "users/" + state.uid), (snap) => {
    const p = snap.val(); if (!p) return;
    state.profile = p; try { sfxHpWatch(p); } catch { /* เสียงไม่ใช่เรื่องสำคัญ */ }
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
    if (!state.hbStarted) { state.hbStarted = true; (async () => { try { await mArrive(p); } catch (e) { console.warn("mArrive", e?.code || e); } await resumeOffline(p); })().finally(() => setInterval(beat, HEARTBEAT_MS)); }   // ต้องจัดการเวลาที่หายไปก่อนเริ่มส่งสัญญาณ ไม่งั้น seenAt เก่าจะถูกทับ
    if (!$("screen-game").classList.contains("active")) {
      show("game"); buildZoneList(); renderZoneTags(); buildAdmin(); listenEvents(); listenInventory(); listenAnnouncements(); listenAttacks(); listenWhispers(); listenShouts(); listenBites(); listenMyMute(); listenQuests(); listenBoss(); listenWorldBoss(); listenSkills(); listenMarket(); listenBlackMarket(); listenGacha(); try { presenceWatch(); } catch (e) { console.warn("presenceWatch", e); } qpListen(); try { kInit(); } catch (e) { console.warn("kInit", e); } achInit(); wallListen(); deepInit(); headCompactInit();
      enterZone(p.zone in ZONES ? p.zone : "safe", true);
    }
    $("me-name").textContent = p.username; $("me-faction").textContent = FACTION[p.faction].icon;
    $("me-role").className = "badge " + p.role; $("me-role").textContent = p.role;
    $("me-role").classList.toggle("hidden", p.role === "player");
    $("btn-admin").classList.toggle("hidden", !isStaff());
    document.querySelector(".owner-only").classList.toggle("hidden", p.role !== "owner");
    if (state.statsLoaded && !state.stats) openStatModal();
    renderBars(); renderInv(); if (state.hb) { try { hbRender(); } catch { /* ข้าม */ } }
    if (p.hp === 0) processDeath();
  });
  setInterval(renderBars, 1000);
  setInterval(infectionTick, 5000);
  setInterval(() => { const p = state.profile; if (p && p.hp === 0 && !state.dying && !state.deathTimer) processDeath(); }, 20000);   // ล้มแล้วยังไม่ฟื้น (เช่นลองครบ 3 ครั้งแล้วพลาด) → ลองใหม่เอง
  setInterval(effectTick, 5000);
}

$("btn-copy-id").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(state.uid); toast("คัดลอก Player ID แล้ว"); }
  catch { prompt("Player ID ของคุณ", state.uid); }
});

/* =========================================================
   7) โซน + แชท (อัปเดตระบบ Bubble)
   ========================================================= */
// buildZoneList → ดูหัวข้อ 23 ท้ายไฟล์ (แผนที่โซน)
function teardownZone() { state.unsubs.forEach((f) => f()); state.unsubs = []; }

const travelCost = (z) => (z === "safe" ? TRAVEL_STAMINA_SAFE : TRAVEL_NEAR.includes(z) ? 6 : TRAVEL_FAR.includes(z) ? 14 : TRAVEL_STAMINA) + wxTravelExtra(z);
function travelCooldownLeft() { const t = state.profile?.lastTravel; return typeof t === "number" ? Math.max(0, TRAVEL_COOLDOWN - (serverNow() - t)) : 0; }

// moved = true → ถูกย้ายโซนจากระบบ (ล้มลงแล้วฟื้นที่ Safe Zone) ไม่เสียต้นทุน/คูลดาวน์
// รายชื่อในโซน (zonePlayers) ถูกลบโดย onDisconnect ทุกครั้งที่สัญญาณหลุด (มือถือหลับ/สลับเน็ต/พับจอ) — ต้องเขียนกลับเมื่อต่อใหม่ ไม่งั้นผู้เล่นยังตี/ค้นหา/แชทได้แต่ไม่โผล่ในรายชื่อ ใครโดนตีก็ตีสวนไม่ได้
async function presenceSet(z = state.zone) {
  if (!z || !state.uid || !state.profile) return;
  const pRef = ref(db, `zonePlayers/${z}/${state.uid}`);
  await set(pRef, { name: state.profile.username, faction: state.profile.faction, ...(state.profile.infected && state.profile.faction === "human" ? { infected: true } : {}), ...(evoTitleKey() ? { evo4: evoTitleKey() } : {}) });
  onDisconnect(pRef).remove();
}
function presenceWatch() {
  if (state.presOn) return; state.presOn = true; state.presTry = 0;
  const fix = async () => {
    if (!state.zone || !state.profile || state.profile.hp === undefined || state.presBusy || state.presEntering) return;
    const sn = state.psnap; if (!sn || sn.key !== state.zone || sn.hasChild(state.uid)) { state.presTry = 0; return; }   // รายชื่อโซนปัจจุบันโหลดแล้วและยังมีเราอยู่ → ปกติ
    if (state.presTry >= 5) return;
    state.presBusy = true; state.presTry++;
    try { await presenceSet(state.zone); } catch (e) { console.warn("presence", e?.code || e); } finally { state.presBusy = false; }
  };
  onValue(ref(db, ".info/connected"), (s) => { if (s.val() === true) setTimeout(fix, 1500); }, () => {});
  setInterval(fix, 20000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(fix, 1200); });
}
async function enterZone(z, initial = false, moved = false) {
  if (!initial && z === state.zone) return;
  const old = state.zone; state.presEntering = true;
  try {
    if (!initial) {
      if (!moved) {
        if (state.profile.hp <= 0) return;
        if (state.boss || state.hb) return toast("บอสขวางทางอยู่ — สู้หรือหนีก่อน");
        const cd = travelCooldownLeft(), cost = travelCost(z), cur = curStamina();
        if (state.zone === "jail") return toast("⛓️ คุณติดคุกอยู่ ออกไปไม่ได้จนกว่าจะครบโทษ (ทำงานลดโทษ จ่ายประกัน หรือแหกคุก)");
        if (z === "safe" && crimMe()) return toast(`🟠 คุณเป็นผู้ก่อเหตุ เข้า Safe Zone ไม่ได้อีก ~${crimMinsLeft()} นาที (หรือจ่ายค่าประกันที่แถบส้ม)`);
        if (cd > 0) return toast(`เพิ่งเดินทางมา ยังล้าอยู่ รออีก ${Math.ceil(cd / 1000)} วินาที`);
        if (cur < cost) return toast(`พลังงานไม่พอเดินทาง (ต้องใช้ ${cost})`);
        await update(ref(db), {
          [`users/${state.uid}/zone`]: z, [`users/${state.uid}/lastTravel`]: serverTimestamp(),
          [`users/${state.uid}/stamina`]: cur - cost, [`users/${state.uid}/staminaTs`]: serverTimestamp()
        });
        questBump("travel");
      }
      if (old) await remove(ref(db, `zonePlayers/${old}/${state.uid}`));
    }
    teardownZone(); state.zone = z; try { $("screen-game").dataset.zone = z; } catch { /* */ } try { achZone(z); } catch { /* */ } state.ground = {}; state.wbHits = {}; state.wbClaim = null;
    $("chat-log").innerHTML = ""; $("zone-title").textContent = `${ZONES[z].icon} ${ZONES[z].name}`; $("zone-desc").textContent = ZONES[z].desc; zoneBanner(z); renderZoneDanger(z); wallRender(); kZoneHook(); try { casinoBar(z); } catch { /* ข้าม */ }
    document.querySelectorAll(".zone-btn").forEach((b) => b.classList.toggle("current", b.dataset.zone === z));
    renderCraft(); renderInv();

    await presenceSet(z);

    const chatQ = query(ref(db, "chats/" + z), orderByKey(), limitToLast(CHAT_LIMIT));
    state.unsubs.push(
      onChildAdded(chatQ, (s) => addChat(s.key, s.val())),
      onChildRemoved(chatQ, (s) => { document.querySelector(`[data-key="${s.key}"]`)?.remove(); }),
      onValue(ref(db, "zonePlayers/" + z), renderPlayers),
      onValue(ref(db, "zoneItems/" + z), (s) => { state.ground = s.val() || {}; renderGround(); }),
      signListen(z),
      onValue(ref(db, "worldBossHits/" + z), (s) => { state.wbHits = s.val() || {}; renderWB(); }),
      onValue(ref(db, `worldBossClaims/${z}/${state.uid}`), (s) => { state.wbClaim = s.val(); renderWB(); })
    );
    signStyle(); renderWB();
    if (!initial) logLine(`คุณเดินทางมาถึง ${ZONES[z].name}${moved ? "" : ` (−${travelCost(z)} พลังงาน)`}`, "info");
  } catch (e) { toast(errMsg(e)); } finally { state.presEntering = false; }
}

function logLine(text, cls = "info") {
  try { jrnlAdd(text, cls); } catch { /* บันทึกไม่ได้ก็ข้าม */ }
  const log = $("chat-log"); const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  const el = mk("div", "msg " + cls + fxOnLog(text, cls));
  el.append(mk("div", "bubble", text));
  log.append(el);
  if (near) log.scrollTop = log.scrollHeight; notifyChat();
}

function addChat(key, m) {
  const log = $("chat-log"); const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  let el;
  const isMe = m.uid === state.uid;

  if (m.type === "combat") {
    try { nzNote(m); } catch { /* ข้าม */ }
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
    sender.append(" ", achBadge(m.uid));
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
  "/guide — เปิดคู่มือวิธีเล่น (หิว เดินทาง โทษตาย)",
  "/tutorial — ดูบทสอนผู้เล่นใหม่ซ้ำ"
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
    if (serverNow() - (typeof p.lastChat === "number" ? p.lastChat : 0) < CHAT_COOLDOWN) return toast("พิมพ์เร็วเกินไป รอสักครู่");
    const k = push(ref(db, "chats/" + state.zone)).key;
    await update(ref(db), {
      [`chats/${state.zone}/${k}`]: { uid: state.uid, name: p.username, faction: p.faction, text: text.slice(0, 200), type, ts: serverTimestamp() },
      [`users/${state.uid}/lastChat`]: serverTimestamp()
    });
    trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});
  };
  const cm = raw.match(/^\/(\S+)(?:\s+([\s\S]*))?$/);
  if (!cm) { await postZone(raw, "chat"); questBump("chat"); return; }

  const cmd = cm[1].toLowerCase(), rest = (cm[2] || "").trim();
  switch (cmd) {
    case "help": case "?": case "ช่วยเหลือ":
      HELP_LINES.forEach((l) => logLine(l, "info")); return;
    case "guide": case "วิธีเล่น": openGuide(); return;
    case "tutorial": case "บทสอน": tutEnd(false); tutStart(0, true); return;
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
      if (serverNow() - (typeof p.lastChat === "number" ? p.lastChat : 0) < CHAT_COOLDOWN) return toast("พิมพ์เร็วเกินไป รอสักครู่");
      const k1 = push(ref(db, `whispers/${t.uid}`)).key, k2 = push(ref(db, `whispers/${state.uid}`)).key;
      await update(ref(db), {
        [`users/${state.uid}/lastChat`]: serverTimestamp(),
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
  listenEvo();
  onValue(ref(db, "bites/" + state.uid), async (s) => {
    if (!s.exists() || state.claimingBite) return;
    state.claimingBite = true;
    try {
      await state.evoReady;
      const fd = curFood();
      const u = { [`bites/${state.uid}`]: null };
      const gain = Math.min(Math.floor(BITE_FOOD * evoFoodMult()), 100 - fd);
      if (gain > 0) hungerShift(u, "food", gain);
      
      // ดึงค่าเลือดที่แท้จริงจากฐานข้อมูลก่อนคำนวณฮีล
      const hpSnap = await get(ref(db, `users/${state.uid}/hp`));
      const realHp = hpSnap.val() || 0;
      
      // ส่ง realHp เข้าไปคำนวณแทน
      const evoMsg = evoClaimWrites(u, s.val(), realHp);
      
      await update(ref(db), u);
      logLine((gain > 0 ? `🦷 คุณกัดเหยื่อ! อาหาร +${gain}` : "🦷 คุณกัดเหยื่อ (อิ่มอยู่แล้ว)") + evoMsg, "combat");
      questBump("bite");
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
  state.psnap = snap;
  const ul = $("player-list"); ul.innerHTML = ""; state.players = {};
  snap.forEach((c) => {
    const v = c.val(), me = c.key === state.uid;
    state.players[c.key] = v;
    const li = mk("li");
    li.append(mk("span", "", `${FACTION[v.faction]?.icon || ""} ${v.name}${me ? " (คุณ)" : ""}${v.infected ? " 🦠" : ""}${crimMark(c.key)}${v.evo4 ? " " + evoTitleText(v.evo4) : ""}`), achBadge(c.key));
    if (v.infected) li.title = "ติดเชื้อ";
    if (!me) {
      const grp = mk("div", "row-btns");
      grp.append(btn("ประวัติ", () => showBio(c.key, v.name, v.faction), "btn ghost mini"));
      grp.append(btn("กระซิบ", () => { $("chat-input").value = `/w ${v.name} `; setTab("chat"); $("chat-input").focus(); }, "btn ghost mini"));
      if (v.role !== "gm" && v.role !== "owner") grp.append(bty2On() ? btn(bty2Pts(c.key) > 0 ? `💰 ${bty2Pts(c.key)}` : "💰", () => bty2Place(c.key, v.name), "btn ghost mini bty-btn") : btn(bountyOn(c.key) ? "💰 มีค่าหัว" : "💰", () => bountyPlace(c.key, v.name), "btn ghost mini bty-btn"));
      if (isStaff()) grp.append(btn("จัดการ", () => {
        ["adm-mute-id", "adm-pid", "adm-target-id", "adm-inf-id", "adm-se-id", "adm-gv-id", "adm-sk-id"].forEach((id) => { $(id).value = c.key; });
        $("adm-clear-zone").value = state.zone; watchMutes();
        $("admin-modal").classList.remove("hidden");
      }, "btn ghost mini"));
      if ((state.zone !== "safe" || wallBroken()) && state.zone !== "jail") {
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
  listenRadio();
}

/* =========================================================
   9) กระเป๋า การกินอาหาร และ การทิ้งของ
   ========================================================= */
function listenInventory() { onValue(ref(db, "inventory/" + state.uid), (s) => { state.inv = s.val() || {}; state.invLoaded = true; renderInv(); try { renderHotbar(); } catch { /* */ } if (state.profile?.hp === 0) processDeath(); }); }

function renderInv() {
  const ul = $("inv-list"); if (!ul) return;
  ul.innerHTML = "";
  wallRender();
  try { invToolsInit(); } catch { /* ข้าม */ }
  state.invLastCat = null;
  invList().forEach(([slot, it, cat]) => {
    const def = defOf(it); if (!def) return;
    invGroupHdr(ul, cat);
    const li = mk("li");
    if (def.type === "weapon") {
      const eq = state.profile?.equipped === slot;
      if (eq) li.classList.add("equipped");
      { const wf = wfxOf(it), sp = mk("span", "", `${it.id === "custom" && it.icon ? String(it.icon).slice(0, 4) : "🗡️"} ${def.name} (${it.dur}/${it.maxDur ?? def.maxDur})${wf ? " • " + wfxLabel(wf) : ""}`); sp.style.color = durColor(durFrac(it, def)); if (wf) sp.title = `ติดสถานะ ${FX_TYPES[wf.t].name} ${wf.p}% ต่อการโจมตีที่โดน (มนุษย์ใช้ได้เท่านั้น)`; li.append(sp); }
      
      const btnGrp = mk("div", "row-btns");
      btnGrp.append(btn(eq ? "ถอด" : "ถือ", () => equip(slot, eq), "btn ghost mini"));
      if (state.profile?.faction === "human" && state.zone === "safe" && isSalvageable(it)) {   // เบต้า: ซ่อม/รื้ออาวุธ
        const why = repairBlock(it);
        const rb = btn(why ? "ซ่อม" : `ซ่อม −${repairCost(it)}`, () => repairWeapon(slot), "btn primary mini"); rb.disabled = !!why; if (why) rb.title = why;
        btnGrp.append(rb);
        if (canDismantle(it)) btnGrp.append(btn(`รื้อ +${salvageYield(it)}`, () => dismantleWeapon(slot), "btn ghost mini"));
      }
      btnGrp.append(btn("ทิ้ง", () => dropItem(slot), "btn danger mini"));
      btnGrp.append(btn("ทำลาย", () => destroyItem(slot), "btn ghost mini"));
      li.append(btnGrp);
    } else if (def.type === "gear") {
      const worn = state.profile?.[def.slot] === slot, mine = (state.profile?.faction === "zombie") === !!def.zombieOnly;
      if (worn) li.classList.add("equipped");
      const lbl = mk("span", "", `${def.icon} ${def.name}${it.qty > 1 ? " ×" + it.qty : ""}`); lbl.append(mk("small", "muted", ` (${GEAR_SLOTS[def.slot]}: ${gearFx(it)})`)); li.append(lbl);
      const btnGrp = mk("div", "row-btns");
      const wb = btn(worn ? "ถอด" : "สวม", () => gearToggle(slot), "btn ghost mini"); wb.disabled = !mine; if (!mine) wb.title = def.zombieOnly ? "เฉพาะซอมบี้" : "เฉพาะมนุษย์";
      btnGrp.append(wb);
      if (state.profile?.faction === "human" && state.zone === "safe" && armorYield(it)) btnGrp.append(btn(`รื้อ +${armorYield(it)}`, () => dismantleArmor(slot), "btn ghost mini"));   // ได้เศษวัสดุคืน (ต่ำกว่าต้นทุนคราฟต์)
      btnGrp.append(btn("ทิ้ง", () => dropItem(slot), "btn danger mini"));
      btnGrp.append(btn("ทำลาย", () => destroyItem(slot), "btn ghost mini"));
      li.append(btnGrp);
    } else {
      const lbl = mk("span", "", `${def.icon || "📦"} ${def.name} ×${it.qty}`);
      const fx = effectText(def); if (fx) lbl.append(mk("small", "muted", ` (${fx})`));
      li.append(lbl);
      
      const btnGrp = mk("div", "row-btns");
      if (def.type === "consumable") btnGrp.append(btn("ใช้", () => useItem(slot)), hotPinBtn(slot));
      if (def.type === "stat") btnGrp.append(btn("🧪 ใช้", () => statOpen()));
      else btnGrp.append(btn("ทิ้ง", () => dropItem(slot), "btn danger mini"));
      btnGrp.append(btn("ทำลาย", () => destroyItem(slot), "btn ghost mini"));
      li.append(btnGrp);
    }
    ul.append(li); try { invInfoHook(li, it); } catch { /* ข้าม */ }
  });
  if (!ul.children.length) ul.append(mk("li", "empty", invFiltering() ? "ไม่พบไอเทมที่ตรงกับตัวกรอง" : "กระเป๋าว่างเปล่า"));
  renderCraft(); gearBar(); gearAutoFix();
}

function renderCraft() {
  const sec = $("craft-section"); if (!sec || !state.profile) return;
  const human = state.profile.faction === "human";
  sec.classList.toggle("hidden", !human); if (!human) return;
  const ul = $("craft-list"); ul.innerHTML = "";
  const canOf = (r) => state.zone === "safe" && Object.entries(r.need).every(([m, n]) => (state.inv[m]?.qty || 0) >= n);
  Object.entries(RECIPES).sort((a, b) => (canOf(b[1]) ? 1 : 0) - (canOf(a[1]) ? 1 : 0)).forEach(([id, r]) => {
    const out = ITEMS[r.out];
    const needTxt = Object.entries(r.need).map(([m, n]) => `${ITEMS[m].icon} ${state.inv[m]?.qty || 0}/${n}`).join(" ");
    const can = state.zone === "safe" && Object.entries(r.need).every(([m, n]) => (state.inv[m]?.qty || 0) >= n);
    const li = mk("li"); const nm = mk("span", "", `${out.icon} ${out.name} ← ${needTxt}`); nm.style.cursor = "pointer"; nm.title = "แตะเพื่อดูข้อมูลไอเทม"; nm.addEventListener("click", () => { try { itemInfoOpen(r.out); } catch { /* ข้าม */ } }); li.append(nm);
    const b = btn("ประกอบ", () => craft(id), "btn primary mini"); b.disabled = !can;
    li.append(b);
    const mx = can ? craftMax(id) : 0;
    if (mx >= 2) { const g = mk("span", "row-btns"); if (mx >= 5) g.append(btn("×5", () => craftMany(id, 5), "btn ghost mini")); g.append(btn(`สูงสุด ×${Math.min(mx, 20)}`, () => craftMany(id, 20), "btn ghost mini")); li.append(g); }
    ul.append(li);
  });
  if (T("fxw_on", 0) === 1) {   // ⚔️ อาวุธติดสถานะ (ชั้น 1–2 คราฟต์ได้ • ชั้น 3 ค้นเจอเท่านั้น)
    ul.append(mk("li", "hub-day", "⚔️ อาวุธติดสถานะ (มนุษย์ใช้ได้เท่านั้น)"));
    Object.entries(FXW).filter(([, d]) => d.need).forEach(([k, d]) => {
      const can = state.zone === "safe" && Object.entries(d.need).every(([m, n]) => (state.inv[m]?.qty || 0) >= n), li = mk("li");
      const nm = mk("span", "", `${d.icon} ${d.name} (ดาเมจ ${d.dmg} • ทน ${d.dur} • ${wfxLabel(d.fx)}) ← ` + Object.entries(d.need).map(([m, n]) => `${ITEMS[m].icon} ${state.inv[m]?.qty || 0}/${n}`).join(" "));
      const b = btn("ประกอบ", () => fxwCraft(k), "btn primary mini"); b.disabled = !can; li.append(nm, b); ul.append(li);
    });
  }
  $("craft-hint").textContent = state.zone === "safe" ? "" : "คราฟต์ได้เฉพาะใน Safe Zone";
}

async function craft(id) {
  // คราฟต์ทุกสูตรทำผ่านฟังก์ชัน forgeAct (หักวัตถุดิบ + ใส่ของให้เอง) — ตรวจเบื้องต้นฝั่งนี้เพื่อข้อความเร็ว ฟังก์ชันตรวจซ้ำเอง
  const r = RECIPES[id]; if (!r || state.busy) return false;
  if (state.profile.faction !== "human") { toast("เฉพาะมนุษย์เท่านั้นที่คราฟต์ได้"); return false; }
  if (state.zone !== "safe") { toast("ต้องคราฟต์ที่ Safe Zone"); return false; }
  for (const [m, n] of Object.entries(r.need)) if ((state.inv[m]?.qty || 0) < n) { toast("วัตถุดิบไม่พอ"); return false; }
  let okc = false;
  state.busy = true;
  try {
    try { await forgeCall({ a: "craft", id }); } catch (e) { if (!/aborted/.test(e?.code || "")) throw e; await new Promise((res) => setTimeout(res, 800)); await forgeCall({ a: "craft", id }); }   // ติดล็อกลองใหม่ 1 ครั้ง
    questBump("craft"); if (id === "fish_grill" || id === "fish_stew") achBump("cook"); okc = true;
    if (!state.craftQuiet) { toast(`ประกอบ ${ITEMS[r.out].name} สำเร็จ`); logLine(`🛠️ คุณประกอบ ${ITEMS[r.out].name}`, "info"); }
  } catch (e) { toast(fnErr(e)); }
  finally { state.busy = false; }
  return okc;
}

// ซ่อมอาวุธด้วย scrap (เบต้า) — มนุษย์ใน Safe Zone เท่านั้น / ความทนสูงสุดลดลง 10% ทุกครั้ง
async function repairWeapon(slot) {
  if (state.busy) return;
  const it = state.inv[slot], p = state.profile; if (!it || !p) return;
  if (p.faction !== "human") return toast("เฉพาะมนุษย์ที่ซ่อมอาวุธได้");
  if (state.zone !== "safe") return toast("ซ่อมได้เฉพาะใน Safe Zone");
  const why = repairBlock(it); if (why) return toast(why);
  
  state.busy = true;
  try {
    // ดึงค่า Scrap จริงจากเซิร์ฟเวอร์
    const scrapSnap = await get(ref(db, `inventory/${state.uid}/scrap/qty`));
    const realHave = scrapSnap.val() || 0;
    
    const r = repairResult(it), def = ITEMS[it.id];
    if (realHave < r.cost) {
        state.busy = false;
        return toast(`ต้องใช้เศษวัสดุ ${r.cost} ชิ้น (คุณมี ${realHave})`);
    }
    
    if (!confirm(`ซ่อม ${def.name}?\nใช้ เศษผ้าและวัสดุ ${r.cost} ชิ้น (มี ${realHave} → ${realHave - r.cost})\nความทน ${it.dur}/${slotMaxDur(it)} → ${r.dur}/${r.maxDur}\n⚠ ความทนสูงสุดลดลงถาวรทุกครั้งที่ซ่อม`)) {
        state.busy = false;
        return;
    }
    
    const u = { [`inventory/${state.uid}/${slot}/dur`]: r.dur, [`inventory/${state.uid}/${slot}/maxDur`]: r.maxDur };
    if (realHave - r.cost > 0) u[`inventory/${state.uid}/scrap/qty`] = realHave - r.cost; else u[`inventory/${state.uid}/scrap`] = null;
    
    await update(ref(db), u); 
    toast(`ซ่อม ${def.name} แล้ว (${r.dur}/${r.maxDur})`); 
    logLine(`🔧 คุณซ่อม ${def.name} ใช้เศษวัสดุ ${r.cost} ชิ้น (ความทน ${r.dur}/${r.maxDur})`, "info");
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
}

// รื้ออาวุธเอาเศษวัสดุ (เบต้า) — ได้ ~40% ของค่าซ่อมเต็ม ยิ่งสึกยิ่งได้น้อย / อาวุธหายถาวร
// รื้อเกราะ (มนุษย์ • Safe Zone): ได้เศษวัสดุคืน ไม่คืนสารเคมี — เพดานตามกฎ: เสื้อเก่า 2 • เกราะเศษเหล็ก/เสื้อปราบจลาจล 4 • เกราะทหาร 6
// รื้อเกราะ: ทำผ่านฟังก์ชัน forgeAct (dismantle) — ได้วัสดุคืนตาม "ระดับความหายาก" (ธรรมดา 50% • ไม่ธรรมดา 60% • หายาก 75% • ตำนาน 90% ของวัสดุประกอบ ปัดลง) ไม่คืนสารเคมี • ตารางต้องตรง ARMOR_SALV ใน functions/forge.js (มีเทสต์เทียบ)
const SALV_PCT = { C: 0.5, U: 0.6, R: 0.75, E: 0.9 }, SALV_RAR = { C: "ธรรมดา", U: "ไม่ธรรมดา", R: "หายาก", E: "ตำนาน" };
const ARMOR_SALV = {
  rag_vest: { r: "C", m: { scrap: 5 } }, scrap_plate: { r: "U", m: { scrap: 10 } }, riot_vest: { r: "U", m: { scrap: 8, cloth_roll: 2 } }, army_vest: { r: "R", m: { scrap: 12, steel_plate: 1, cloth_roll: 2 } },
  cardboard_armor: { r: "C", m: { cloth_roll: 2, duct_tape: 2 } }, leather_jacket: { r: "C", m: { leather_scrap: 4, cloth_roll: 1 } }, hunter_cloak: { r: "U", m: { leather_scrap: 6, herb_bundle: 2, rope_coil: 1 } },
  welder_apron: { r: "U", m: { leather_scrap: 3, steel_plate: 1, cloth_roll: 2 } }, diver_suit: { r: "U", m: { rope_coil: 2, cloth_roll: 3, fuel_can: 1 } }, hazmat_suit: { r: "U", m: { scrap: 15, cloth_roll: 3 } },
  kevlar_vest: { r: "R", m: { cloth_roll: 4, steel_plate: 2, duct_tape: 2 } }, bomb_suit: { r: "E", m: { steel_plate: 6, cloth_roll: 5, circuit_board: 1 } }
};
function armorSalv(it) {   // รายการ [รหัสวัสดุ, จำนวน] ที่จะได้คืน (ว่าง = รื้อไม่ได้)
  const a = it && ARMOR_SALV[it.id]; if (!a) return [];
  const k = SALV_PCT[a.r] * Math.max(0, Math.min(100, T("salv_pct", 100))) / 100, out = [];
  Object.entries(a.m).forEach(([m, n], i) => { const q = Math.max(i === 0 && k > 0 ? 1 : 0, Math.floor(n * k + 1e-9)); if (q > 0) out.push([m, q]); });
  return out;
}
const armorYield = (it) => armorSalv(it).reduce((t, [, q]) => t + q, 0);
const salvTxt = (list) => list.map(([m, q]) => `${ITEMS[m]?.icon || ""}${ITEMS[m]?.name || m} ×${q}`).join(" ");
async function dismantleArmor(slot) {
  if (state.busy) return;
  const it = state.inv[slot], p = state.profile; if (!it || !p || !armorYield(it) || it.id !== slot) return;
  if (p.faction !== "human") return toast("เฉพาะมนุษย์ที่รื้อเกราะได้");
  if (state.zone !== "safe") return toast("รื้อได้เฉพาะใน Safe Zone");
  const def = ITEMS[it.id], qty = it.qty || 1, list = armorSalv(it);
  if (p.arm === slot && qty <= 1) return toast("ถอดเกราะชิ้นนี้ก่อนค่อยรื้อ");
  if (!confirm(`รื้อ ${def.name} 1 ชิ้น? (ระดับ${SALV_RAR[ARMOR_SALV[it.id].r]})\nได้คืน ${salvTxt(list)}\n⚠ ได้คืนน้อยกว่าวัสดุที่ใช้ประกอบ และไม่คืนสารเคมี ช่องที่เต็ม 99 ส่วนเกินจะหาย`)) return;
  state.busy = true;
  try {
    const go = async () => { try { return await forgeCall({ a: "dismantle", slot }); } catch (e) { if (!/aborted/.test(e?.code || "")) throw e; await new Promise((res) => setTimeout(res, 800)); return await forgeCall({ a: "dismantle", slot }); } };   // ติดล็อกลองใหม่ 1 ครั้ง
    const r = await go(), g = salvTxt(r.got || []);
    toast(`รื้อ ${def.name} ได้ ${g}${r.lost?.length ? " (บางส่วนเกินช่อง 99 จึงหาย)" : ""}`); logLine(`🔩 คุณรื้อ ${def.name} ได้ ${g}`, "info");
  } catch (e) { toast(fnErr(e)); } finally { state.busy = false; }
}
async function dismantleWeapon(slot) {
  if (state.busy) return;
  const it = state.inv[slot], p = state.profile; if (!it || !p) return;
  if (p.faction !== "human") return toast("เฉพาะมนุษย์ที่รื้ออาวุธได้");
  if (state.zone !== "safe") return toast("รื้อได้เฉพาะใน Safe Zone");
  if (!canDismantle(it)) return toast("รื้ออาวุธชิ้นนี้ไม่ได้");
  
  state.busy = true;
  try {
    // ดึงค่า Scrap จริงจากเซิร์ฟเวอร์ เพื่อป้องกัน Error จากข้อมูลที่ล้าหลัง
    const scrapSnap = await get(ref(db, `inventory/${state.uid}/scrap/qty`));
    const realHave = scrapSnap.val() || 0;
    
    const y = salvageYield(it), after = Math.min(99, realHave + y), def = ITEMS[it.id];
    if (!confirm(`รื้อ ${def.name} (${it.dur}/${slotMaxDur(it)})?\nได้ เศษผ้าและวัสดุ ${y} ชิ้น (มี ${realHave} → ${after}${realHave + y > 99 ? " · เกิน 99 ส่วนเกินจะหาย" : ""})\n⚠ อาวุธจะหายไปถาวร`)) {
        state.busy = false;
        return;
    }
    
    const u = { [`inventory/${state.uid}/${slot}`]: null };
    if (p.equipped === slot) u[`users/${state.uid}/equipped`] = null;
    if (after > realHave) { 
        u[`inventory/${state.uid}/scrap`] = { id: "scrap", qty: after }; 
        u[`salvage/${state.uid}/slot`] = slot; 
        u[`salvage/${state.uid}/ts`] = serverTimestamp(); 
    }
    
    await update(ref(db), u); 
    toast(`รื้อ ${def.name} ได้เศษวัสดุ ${after - realHave} ชิ้น`); 
    logLine(`🔩 คุณรื้อ ${def.name} ได้เศษวัสดุ ${after - realHave} ชิ้น`, "info");
  } catch (e) { toast(errMsg(e)); }
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
  if (ITEMS[it.id]?.type === "stat") return toast("ไอเทมนี้ทิ้งหรือแลกเปลี่ยนไม่ได้ ใช้ได้เฉพาะเจ้าของ");
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
    ...(it.maxDur && it.id !== "custom" && it.id !== "custom_food" ? { maxDur: it.maxDur } : {}),   // ความทนสูงสุดที่ลดจากการซ่อมต้องติดไปด้วย (กันทิ้งแล้วเก็บคืนเพื่อรีเซ็ต)
    ...(it.id === "custom" ? { name: it.name, dmg: it.dmg, maxDur: it.maxDur, type: "weapon", ...(it.icon ? { icon: String(it.icon).slice(0, 4) } : {}), ...(wfxOf(it) ? { fx: wfxOf(it) } : {}) } : {}),
    ...(it.id === "custom_food" ? foodFields(it) : {}),
    ...(it.id === "custom_gear" ? gearFields(it) : {})
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

function invAddUpdate(u, itemId, qty, src, dur, customData, maxDur) {
  if (itemId === "custom" && customData) {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: "custom", qty: 1, dur: customData.dur, name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon", ...(customData.icon ? { icon: customData.icon } : {}), ...(customData.fx ? { fx: customData.fx } : {}), ...(src ? { src } : {}) };
    return;
  }
  if (itemId === "custom_food" && customData) {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: "custom_food", qty: 1, ...foodFields(customData), ...(src ? { src } : {}) };
    return;
  }
  if (itemId === "custom_gear" && customData) {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: "custom_gear", qty: 1, ...gearFields(customData), ...(src ? { src } : {}) };
    return;
  }
  const def = ITEMS[itemId];
  if (def.type === "weapon") {
    const k = src ? `g_${src}` : push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: itemId, qty: 1, dur: dur ?? def.maxDur, ...(maxDur ? { maxDur } : {}), ...(src ? { src } : {}) };
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
  const customData = g.id === "custom" ? { name: g.name, dmg: g.dmg, dur: g.maxDur, icon: g.icon, fx: wfxOf(g) } : (g.id === "custom_food" || g.id === "custom_gear") ? g : null;
  
  invAddUpdate(u, g.id, g.qty || 1, key, g.dur, customData, g.maxDur);
  try { await update(ref(db), u); toast(`เก็บ ${defOf(g).name} แล้ว`); } 
  catch { toast("มีคนเก็บไปก่อนแล้ว หรือกระเป๋าเต็ม"); if (btnEl) btnEl.disabled = false; }
}

async function equip(slot, isEquipped) {
  if (!isEquipped && state.inv[slot]?.fx && state.profile?.faction !== "human") return toast("อาวุธติดสถานะ ใช้ได้เฉพาะมนุษย์");
  try { await update(ref(db), { ["users/" + state.uid + "/equipped"]: isEquipped ? null : slot }); }
  catch (e) { toast(errMsg(e)); }
}

async function useItem(slot) {
  // ผลของไอเทมคำนวณ/เขียนที่ฝั่งเซิร์ฟเวอร์ (functions/use.js `useAct`) — ที่นี่แค่ตรวจเบื้องต้น เรียกฟังก์ชัน แล้วทำของฝั่งไคลเอนต์ต่อ (เควสต์/ความสำเร็จ/มื้อ/ภูมิต้านพิษ)
  const it = state.inv[slot], def = it && defOf(it), p = state.profile;
  if (p.hp <= 0) return;
  if (!def || def.type !== "consumable") return;
  if (def.zombieOnly && p.faction !== "zombie") return toast("เนื้อเน่า… มีแต่ซอมบี้เท่านั้นที่กินลง");
  // ยาแก้พิษ: ถ้าภูมิต้านพิษยังเหลือเกิน 2 นาทีและไม่มีพิษให้รักษา ไม่ต้องใช้ (ภูมิเก็บในเครื่อง)
  if (it.id === "antidote" && poisonImmLeft() > 120000 && !effActive("poison")) return toast(`ภูมิต้านพิษยังเหลืออีก ${Math.ceil(poisonImmLeft() / 60000)} นาที`);
  try {
    const go = async (extra) => { try { return await useCall({ slot, ...extra }); } catch (e) { if (!/aborted/.test(e?.code || "")) throw e; await new Promise((res) => setTimeout(res, 800)); return await useCall({ slot, ...extra }); } };   // ติดล็อกลองใหม่ 1 ครั้ง
    let r = await go();
    if (r.confirm === "buff") { if (!confirm("คุณมีบัฟชั่วคราวอยู่ การใช้ไอเทมนี้จะแทนที่บัฟเดิมทั้งหมด ต้องการใช้ต่อไหม?")) return; r = await go({ replaceBuff: true }); }
    if (it.id === "antidote") LS.set(lsKey("pimm"), serverNow() + ANTI_IMM_MS);
    questBump("use"); try { mealOnUse(it.id); } catch { /* ข้าม */ } if (def.heal > 0) achBump("heal");
    toast(`ใช้ ${def.name} ` + (r.msgs || []).join(", "));
  } catch (e) { toast(fnErr(e)); }
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
    if (p.infected) update(ref(db), { [`users/${state.uid}/infected`]: null, [`users/${state.uid}/infectTs`]: null }).catch(() => {});   // ล้มลงแล้วเชื้อหายทันที (ไม่ต้องรอฟื้น) — ต้องใช้ rules v31
    if (!state.deathTimer) {
      logLine(`💀 คุณล้มลง… ร่างกายยังอ่อนล้าจากครั้งก่อน จะฟื้นได้ในอีก ${mmss(wait)} นาที (ดูเวลาที่แถบ HP)`, "system");
      state.deathTimer = setTimeout(() => { state.deathTimer = null; processDeath(); }, wait + 1500);
    }
    return;
  }
  state.dying = true; stat("death");
  try {
    const u = {}, lost = [], uid = state.uid;
    // ⛓️ ถูกจับ = ยกเว้นโทษตอนล้ม (ไม่หักของ/ความทนอาวุธ/วิวัฒนาการ) — รอผลการจับ (ผู้ถูกฆ่าเป็นคนเรียก) และรอ jail/{uid} โหลดตอนเข้าเกม
    if (jailOn()) { try { if (state.jailWait) await Promise.race([state.jailWait, new Promise((r) => setTimeout(r, 6000))]); else if (state.jailReady) await Promise.race([state.jailReady, new Promise((r) => setTimeout(r, 3000))]); } catch { /* ข้าม */ } state.jailWait = null; }
    const exempt = jailOn() && (jailActive() || (state.jailCapAt && Date.now() - state.jailCapAt < 120000));
    if (!exempt) DEATH_STACK.forEach((id) => {
      const it = state.inv[id]; if (!it || !(it.qty > 0)) return;
      const keep = Math.floor(it.qty * DEATH_KEEP);
      if (keep >= it.qty) return;
      lost.push(`${ITEMS[id].icon}×${it.qty - keep}`);
      if (keep > 0) u[`inventory/${uid}/${id}/qty`] = keep; else u[`inventory/${uid}/${id}`] = null;
    });
    const ws = p.equipped, wi = !exempt && ws && state.inv[ws];
    if (wi && typeof wi.dur === "number") {
      const nd = Math.floor(wi.dur * WEAPON_KEEP), wn = defOf(wi)?.name || "อาวุธ";
      if (nd <= 0) { u[`inventory/${uid}/${ws}`] = null; u[`users/${uid}/equipped`] = null; lost.push(`${wn} พัง`); }
      else { u[`inventory/${uid}/${ws}/dur`] = nd; lost.push(`${wn} ความทน −${wi.dur - nd}`); }
    }
    if (p.infected) { u[`users/${uid}/infected`] = null; u[`users/${uid}/infectTs`] = null; }
    if (state.boss) u[`bossFights/${uid}`] = null;
    if (!exempt) { const en = evoDeathWrites(u); if (en) lost.push(en); }
    const rz = exempt || jailActive() ? "jail" : crimMe() ? "ruins" : "safe";   // ติดคุก → ฟื้นในคุก • ส้มฟื้นที่ Safe Zone ไม่ได้ → เขตเมืองร้าง
    u[`users/${uid}/hp`] = 50; u[`users/${uid}/zone`] = rz; u[`users/${uid}/lastDeath`] = serverTimestamp();
    const deadZone = state.zone;
    if (!bty2On() && state.bounty?.[uid]) u[`bounty/${uid}`] = null;   // ค่าหัวบนตัวเราหมดสภาพเมื่อฟื้น
    await update(ref(db), u);
    // ตรวจหลังฟื้น: ถ้าฐานข้อมูลยังมีเชื้อค้าง (ไม่ควรเกิด) ให้บันทึกลง console + แจ้งผู้เล่นให้รักษา/แจ้งแอดมิน (ล้างเองตอน HP>0 ไม่ได้ตาม rules)
    if (p.infected) setTimeout(async () => { try { const hpS = (await get(ref(db, `users/${uid}`))).val(); if (hpS && hpS.infected && hpS.hp === 50) { console.warn("infection survived respawn", hpS.infected); logLine("🦠 เชื้อยังค้างหลังฟื้น — ใช้ชุดปฐมพยาบาลหรือมอสเพื่อรักษา (หรือแจ้งแอดมิน)", "system"); } } catch { /* ข้าม */ } }, 4000);
    try { if (effDanger(deadZone) >= 5) feedPost(3, deadZone); } catch { /* ข้าม */ }
    logLine(`💀 คุณล้มลง… ฟื้นขึ้นที่ ${rz === "safe" ? "Safe Zone" : rz === "jail" ? "คุก (ถูกจับ — ไม่เสียของตอนล้ม)" : "เขตเมืองร้าง (ส้มเข้า Safe Zone ไม่ได้)"}${lost.length ? ` • สูญเสีย ${lost.join(" ")}` : ""}`, "system");
    await enterZone(rz, false, true);
  } catch (e) {
    console.error("death", e);
    if (attempt < 2) setTimeout(() => { state.dying = false; processDeath(attempt + 1); }, 2000);
    else { toast(errMsg(e)); logLine(`💀 ฟื้นไม่สำเร็จ: ${errMsg(e)} — เกมจะลองใหม่เองใน 20 วินาที`, "system"); }
  } finally { if (state.profile?.hp !== 0 || attempt >= 2) state.dying = false; }
}

// ทำการค้นหา 1 ครั้ง (อ่านค่าล่าสุดจาก state ทุกครั้ง) — โยน error ออกไปให้ตัวครอบจัดการ
async function scavengeOnce() {
  let mgT = 0;   // มินิเกมค้นลึก (หัวข้อ 41) เล่นก่อนอ่านพลังงาน/ความหิวเพื่อให้ค่าสดเสมอ
  { const q = state.profile; if (q && q.hp > 0 && state.deep && !state.boss && !effActive("stun") && curFood() > 0 && curWater() > 0 && curStamina() >= searchCost()) { try { mgT = await mgRun(q.faction === "zombie"); } catch { mgT = 0; } } }
  const p = state.profile;
  if (p.hp <= 0) return;
  if (state.zone === "jail") return toast("⛓️ ในคุกไม่มีอะไรให้ค้น — ทำงานลดโทษแทน");
  if (state.zone === "casino") return toast("บ่อนนี้ไม่มีอะไรให้ค้น — ไปแลกของเป็นชิปหรือเล่นเกมแทน");
  if (state.boss || state.hb) return toast("คุณกำลังเผชิญหน้ากับบอสอยู่!");
  if (effActive("stun")) return toast("😵 คุณมึนงง ค้นหาไอเทมไม่ได้ในตอนนี้");
  const cur = curStamina();
  const fd = curFood();
  const wt = curWater();
  const starving = (fd === 0 || wt === 0);

  if (starving && state.zone !== "safe" && !crimMe()) return toast("หิวหรือกระหายจนหมดแรง ค้นหาข้างนอกไม่ไหว — กินอาหาร/ดื่มน้ำก่อน (หรือกลับไปค้นหาใน Safe Zone)");
  if (starving && p.hp <= STARVE_HP) return toast(`HP ต่ำเกินไปที่จะฝืนค้นหาตอนหิว (เสีย ${STARVE_HP} HP ต่อครั้ง) กินหรือดื่มก่อน`);
  if (!starving && cur < searchCost()) return toast("พลังงานไม่พอ");
  {
    const isZombie = p.faction === "zombie";
    let table = isZombie ? zombieDrops(state.zone) : humanDrops(state.zone);
    if (state.deep && !starving) { table = deepTable(table, isZombie); try { table = mgTable(table, mgT, isZombie); } catch { /* ข้าม */ } }
    try { table = wgTable(table); } catch { /* ข้าม */ }   // 🍀 โชคประจำวัน (หัวข้อ 43)
    table = evtTable(table, isZombie);   // เหตุการณ์ใหญ่ประจำโซน (เครื่องบินทิ้งเสบียง/ฝูงบุก)
    table = gearTable(table);   // เครื่องราง/หน้ากาก/จมูกกลายพันธุ์ ปรับน้ำหนักตาราง   // ค้นลึก: ของหายาก ×2, ซอมบี้ ×1.5, ว่างเปล่า ×0.5
    let found = rollDrop(table);
    if (found === "boss" && bossCooldownLeft() > 0) found = null;   // เพิ่งเจอบอสไป ยังไม่เกิดซ้ำ
    const scrapIgnored = isZombie && (found === "scrap" || found === "chem");
    if (scrapIgnored) found = null;
    try { const sf = siteRoll(found, table, isZombie); if (sf) found = sf; } catch { /* ข้าม */ }   // คลังลับ (หัวข้อ 36)
    let hcFind = false;   // ภารกิจ HC (หัวข้อ 51): มนุษย์ต้องเจอบอสก่อน → ค้นต่อจนเจอธารา / ซอมบี้ข้ามบอสได้
    try { if (hcSearching(state.zone)) { if (!isZombie && !hcBossDone()) { if (bossCooldownLeft() === 0 && BOSSES.lab) found = "boss"; } else if (found !== "zombie" && found !== "boss") hcFind = await hcRoll(); } } catch { /* ข้าม */ }
    const u = {};
    hungerShift(u, "food", -(isZombie ? 5 : 3)); hungerShift(u, "water", -(isZombie ? 2 : 4));

    let newHp = p.hp;
    if (starving) {
      newHp = Math.max(0, p.hp - STARVE_HP);
      u[`users/${state.uid}/hp`] = newHp;
    } else {
      u[`users/${state.uid}/stamina`] = cur - searchCost();
      u[`users/${state.uid}/staminaTs`] = serverTimestamp();
    }

    state.lastPayload = u;
    ambient();
    if (hcFind) {
      await hcRescue(u, isZombie);
    } else if (found === "zombie") {
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
      stat("found"); logLine(`${srchLead()} เจอ ${ITEMS[found].icon} ${ITEMS[found].name}`, "info");
      try { siteAfter(found); } catch { /* ข้าม */ }
      if (starving) logLine(`คำเตือน: คุณฝืนร่างกายค้นหาของจนเสียเลือด ${STARVE_HP} HP`, "system");
    } else {
      await update(ref(db), u);
      logLine(scrapIgnored ? "คุณเจอเศษผ้ากับวัสดุ แต่ซอมบี้ไม่รู้จะเอาไปทำอะไร… จึงทิ้งไว้" : srchEmpty(), "info");
      if (starving) logLine(`คำเตือน: คุณฝืนร่างกายค้นหาของจนเสียเลือด ${STARVE_HP} HP`, "system");
    }
    questBump("search"); stat("search");
    try { hbAfterSearch(found); } catch { /* ข้าม */ }
    try { fxwAfterSearch(); } catch { /* ข้าม */ }
    try { evtSearchHook(); fxSearchHook(); } catch { /* ข้าม */ }
    try { if (!hcFind && found !== "zombie" && found !== "boss") { encAfterSearch(); nemAfterSearch(); } } catch { /* ข้าม */ }
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
  } finally { state.busy = false; state.mgKeep = null; }
});

// เจอซอมบี้ตอนค้นหา: ทอย d6 + โบนัสอาวุธ (ทอยได้ 1 คือพลาดหนักเสมอ)
async function zombieEncounter(u, hpNow) {
  const w = equippedWeapon();
  const bonus = (w ? weaponBonus(w.def) : 0) + (typeof abilDice === "function" ? abilDice() : 0);
  const r = pveD6(), total = r + bonus;
  const base = 10 + Math.floor(Math.random() * 15);
  const rollTxt = `🎲 ทอย ${r}${bonus ? ` + ${bonus} (${w ? w.def.name + (abilDice() ? " + ความสามารถ" : "") : "ความสามารถ"})` : ""} = ${total}`;
  let dmg = 0, verdict, loot = null, won = false;

  if (r === 1) { dmg = gearCut(Math.min(40, Math.round(base * 1.5))); verdict = `พลาดท่า! ซอมบี้งับเต็มแรง −${dmg} HP`; }
  else if (total <= 3) { dmg = gearCut(base); verdict = `ซอมบี้พุ่งออกมาจากที่ซ่อน โดนกัด −${dmg} HP`; }
  else if (total === 4) { dmg = gearCut(Math.ceil(base / 2)); verdict = `ถอยทันแต่ยังโดนข่วน −${dmg} HP`; }
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
    verdict += monFx(u, "zombie", dmg, newHp);
  }

  await update(ref(db), u);
  stat("zombie"); if (won) { stat("zwin"); try { achBump("hw" + state.zone); if (acs.hunt?.acc && !acs.hunt.got && acs.hunt.zone === state.zone) toast(`🎯 ค่าหัว ${Math.min(acs.hunt.n, acs.hunt.v + 1)}/${acs.hunt.n}`); } catch { /* ข้าม */ } } if (dmg > 0) stat("dmg", dmg);
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
  try { if (id === "lab" && hcOn() && !hcBossDone()) logLine("📡 มันคือผู้เฝ้าทางลงชั้นล่าง… ถ้าล้มมันได้ สัญญาณขอความช่วยเหลือจะดังชัดขึ้น", "system"); } catch { /* ข้าม */ }
}

function listenBoss() { onValue(ref(db, "bossFights/" + state.uid), (s) => { state.boss = s.val(); renderBoss(); }); }

function renderBoss() {
  const m = $("boss-modal"), p = state.profile, bs = state.boss, b = bs && BOSSES[bs.boss];
  const open = !!(b && p && p.hp > 0 && p.faction === "human");
  m.classList.toggle("hidden", !open);
  if (!open) return;
  const won = bs.hp <= 0, busy = !!state.bossBusy, w = equippedWeapon();
  $("boss-title").textContent = `${b.icon} ${b.name}`;
  { const art = $("boss-art"); if (art) { const src = `img/boss/${bs.boss}.webp`; art.classList.add("hidden"); imgProbe(src, (ok) => { if (ok) { art.style.backgroundImage = `url(${src})`; art.classList.remove("hidden"); } }); } }
  $("boss-tag").textContent = b.tag + fxChanceText(bs.boss);
  $("bar-boss").style.width = Math.max(0, (bs.hp / bs.max) * 100) + "%"; $("txt-boss").textContent = `บอส ${Math.max(0, bs.hp)}/${bs.max}`;
  $("bar-boss-me").style.width = Math.min(100, (p.hp / maxHp()) * 100) + "%"; $("txt-boss-me").textContent = `HP ${p.hp}/${maxHp()}`;
  $("boss-weapon").textContent = w ? `ถืออยู่: ${w.def.icon} ${w.def.name} (ทน ${w.it.dur}) ` : "ถืออยู่: มือเปล่า (ดาเมจต่ำมาก — แนะนำให้หนี)";
  if (w) { const f = durFrac(w.it, w.def), bar = mk("span"); bar.style.cssText = `display:inline-block;vertical-align:middle;width:70px;height:7px;border-radius:4px;background:#333;overflow:hidden`; const fl = mk("span"); fl.style.cssText = `display:block;height:100%;width:${Math.round(f * 100)}%;background:${durColor(f)}`; bar.append(fl); $("boss-weapon").append(bar); }
  const bd = state.inv.bandage?.qty || 0, kit = state.inv.medkit?.qty || 0;
  const bStun = effActive("stun");
  $("boss-attack").classList.toggle("hidden", won); $("boss-attack").disabled = busy || bStun; $("boss-attack").textContent = bStun ? "😵 มึนงง" : "⚔️ โจมตี";
  renderSwapBar($("boss-swap")); renderDanger($("boss-warn"));
  $("boss-bandage").classList.toggle("hidden", won); $("boss-bandage").disabled = busy || !bd; $("boss-bandage").textContent = `🩹 ผ้าพันแผล ×${bd}`;
  $("boss-medkit").classList.toggle("hidden", won); $("boss-medkit").disabled = busy || !kit; $("boss-medkit").textContent = `🧰 ชุดปฐมพยาบาล ×${kit}`;
  $("boss-flee").classList.toggle("hidden", won); $("boss-flee").disabled = busy;
  $("boss-claim").classList.toggle("hidden", !won); $("boss-claim").disabled = busy;
  $("boss-skills").classList.toggle("hidden", won); renderSkillBar($("boss-skills"), (id) => bossRound("skill:" + id), busy || won || bStun, p);
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
  const p = state.profile, off = !p || p.hp <= 0 || !state.zone || isPeace(state.zone);
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
    const w0 = equippedWeapon(), stunMsg = "😵 คุณมึนงง โจมตีไม่ได้ (หนี/ใช้ยาได้)";
    if (action.startsWith("skill:")) {
      const id = action.slice(6), sk = skillDef(id);
      if (!sk || sk.kind !== "pve" || !skillReady(id)) return;
      if (sk.type === "power" && effActive("stun")) return toast(stunMsg);
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
      if (effActive("stun")) return toast(stunMsg);
      const w = equippedWeapon(), r = pveD6(), mult = r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5;
      const dmg = Math.round(myDmg(w) * mult), left = Math.max(0, bs.hp - dmg);
      line = `🎲 ทอย ${r} — ` + (dmg ? `โจมตีโดน −${dmg}${r === 6 ? " (คริติคอล!)" : ""}` : "พลาด!");
      if (w && r !== 1) wearUpdates(u, w);
      if (dmg) u[`bossFights/${uid}/hp`] = left;
      if (left === 0) { strike = false; killed = true; }
    } else if (action === "bandage" || action === "medkit") {
      const it = state.inv[action]; if (!it || !(it.qty > 0)) return;
      const heal = ITEMS[action].heal;
      if (it.qty > 1) u[`inventory/${uid}/${action}/qty`] = it.qty - 1; else u[`inventory/${uid}/${action}`] = null;
      u[`users/${uid}/eatSlot`] = action;   // rules ตรวจผลไอเทมจากชื่อสล็อตนี้ (ขาดแล้วเขียน hp ไม่ผ่าน → "ระบบไม่อนุญาต")
      hp = Math.min(maxHp(), hp + heal);
      line = `${ITEMS[action].icon} ใช้${ITEMS[action].name} +${heal} HP`;
    } else if (action === "flee") {
      if (Math.random() < b.flee) { u[`bossFights/${uid}`] = null; strike = false; line = "🏃 คุณวิ่งหนีออกมาได้!"; }
      else line = "🏃 หนีไม่พ้น! มันขวางทางไว้";
    }
    // อาวุธคม: สุ่มทำให้บอสเลือดไหล / บอสที่เลือดไหลเสียเลือดทุกรอบ
    const bHp = () => (typeof u[`bossFights/${uid}/hp`] === "number" ? u[`bossFights/${uid}/hp`] : bs.hp), hitNow = bHp() < bs.hp;
    if (!killed && u[`bossFights/${uid}`] !== null) {
      const bl = state.bossBleed && state.bossBleed.id === bs.ts ? state.bossBleed : null;
      if (bl && bl.n > 0) { const nh = Math.max(0, bHp() - BOSS_BLEED); u[`bossFights/${uid}/hp`] = nh; bl.n--; line += ` • 🩸 ${b.name}เสียเลือด −${BOSS_BLEED}`; if (nh === 0) { strike = false; killed = true; } }
      const pc = w0 && hitNow ? (WPN_PROC[w0.it.id] || 0) * (skillUsed?.type === "power" ? 2 : 1) : 0;
      if (!killed && pc && Math.random() * 100 < pc && !(state.bossBleed && state.bossBleed.id === bs.ts && state.bossBleed.n > 0)) { state.bossBleed = { id: bs.ts, n: BOSS_BLEED_N }; line += ` • 🩸 ${w0.def.name}ทำให้${b.name}เลือดไหล!`; }
    }
    if (strike) { const s = strikeWith(b, skillUsed), cut = gearCut(s.total); hp = Math.max(0, hp - cut); line += ` • ${s.text}${cut < s.total ? ` (🛡️ ชุดลดเหลือ −${cut})` : ""}`; }
    if (strike && !u[`users/${uid}/eatSlot`]) line += monFx(u, bs.boss, p.hp - hp, hp);   // รอบที่ใช้ยา: ยังโดนตี แต่ไม่ติดสถานะใหม่ (rules ไม่ให้เขียนสถานะพร้อมใช้ไอเทม)
    if (hp !== p.hp) u[`users/${uid}/hp`] = hp;
    if (hp === 0) { delete u[`bossFights/${uid}/hp`]; u[`bossFights/${uid}`] = null; }   // ล้มลง → จบการสู้ (processDeath จัดการต่อ)
    await update(ref(db), u);
    if (action === "attack" || skillUsed?.type === "power") questBump("hit");
    if (hp < p.hp) stat("dmg", p.hp - hp);
    bossLog(line);
    if (killed) { stat("boss"); logLine(`${b.icon} คุณล้ม${b.name}ได้สำเร็จ!`, "combat"); bossLog(`🏆 ${b.name}ล้มลงแล้ว!`); }
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
    let hcNew = false;
    try { if (bs.zone === "lab" && hcOn() && hcReady() && !hcBossDone()) { hcBits(u, HC_BOSS_BIT); hcNew = true; } } catch { /* ข้าม */ }
    await update(ref(db), u);
    if (hcNew) setTimeout(() => { logLine("📡 ผู้เฝ้าล้มแล้ว… ประตูชั้นล่างเปิดออก มีเสียงเคาะท่อเบาๆ ดังมาจากข้างใน — ค้นหาต่อที่ศูนย์วิจัยจนกว่าจะเจอต้นเสียง", "system"); toast("📡 ทางลงชั้นล่างเปิดแล้ว ค้นหาต่อเพื่อหาต้นสัญญาณ"); }, 600);
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

// ---- 🏹 บอสเผ่ามนุษย์ (ฝั่งซอมบี้) — functions/hboss.js • ปิดอยู่จนกว่าเจ้าของตั้ง tune hb_on = 1
// ผู้รอดชีวิตที่ไม่ยอมเข้า Safe Zone ประจำโซน: ซอมบี้ค้นหาแล้วมีโอกาสเจอ (โอกาสเท่าบอสฝั่งมนุษย์ ทอยที่เซิร์ฟเวอร์) สู้เป็นรอบ โจมตี/หนี รับรางวัลเป็นของซอมบี้
const HB_ZONES = ["forest", "police", "port", "factory", "hospital", "tunnel"];   // ต้องตรงกับ W ใน functions/hboss.js
const hbOn = () => T("hb_on", 1) === 1;   // เปิดเป็นค่าเริ่มต้น — ปิดด้วย tune hb_on = 0
const hbMsg = (e) => { const m = String(e?.message || ""); return !m || /^(internal|unknown)$/i.test(m) ? errMsg(e) : m; };
function hbLog(t) { const ul = $("hb-log"); ul.append(mk("li", "", t)); while (ul.children.length > 30) ul.firstChild.remove(); ul.scrollTop = ul.scrollHeight; }
function hbRender() {
  if (state.hb && state.profile?.faction === "zombie" && !(state.profile.hp > 0) && state.hb.hp > 0) state.hb = null;   // ล้มลงแล้ว: เซิร์ฟเวอร์ปิดการสู้ให้แล้ว
  const m = $("hb-modal"), f = state.hb, p = state.profile, open = !!(f && p && p.faction === "zombie" && (p.hp > 0 || f.hp <= 0));
  m.classList.toggle("hidden", !open);
  if (!open) return;
  const won = f.hp <= 0, busy = !!state.hbBusy, stun = effActive("stun");
  $("hb-title").textContent = `${f.icon} ${f.name}`;
  { const art = $("hb-art"); if (art) { const src = `img/boss/${f.art}.webp`; art.classList.add("hidden"); imgProbe(src, (ok) => { if (ok) { art.style.backgroundImage = `url(${src})`; art.classList.remove("hidden"); } }); } }
  $("hb-tag").textContent = f.tag + (f.shieldMax ? ` • 🛡️ โล่ ${f.shield}/${f.shieldMax}` : "") + (f.pdot ? ` • 🩸 แผลติดตัว −${f.pdot.per}/รอบ (อีก ${f.pdot.n} รอบ)` : "") + (f.weak ? ` • 💉 อ่อนแรง (โจมตีอีก ${f.weak.n} ครั้งเหลือ ${100 - f.weak.pct}%)` : "");
  $("bar-hb").style.width = Math.max(0, (f.hp / f.max) * 100) + "%"; $("txt-hb").textContent = `เขา ${Math.max(0, f.hp)}/${f.max}`;
  $("bar-hb-me").style.width = Math.min(100, (p.hp / maxHp()) * 100) + "%"; $("txt-hb-me").textContent = `HP ${p.hp}/${maxHp()}`;
  $("hb-attack").classList.toggle("hidden", won); $("hb-attack").disabled = busy || stun; $("hb-attack").textContent = stun ? "😵 มึนงง" : "🦷 ขย้ำ";
  $("hb-flee").classList.toggle("hidden", won); $("hb-flee").disabled = busy;
  for (const [id, ic, nm] of [["bandage", "🩹", "ผ้าพันแผล"], ["medkit", "🧰", "ชุดปฐมพยาบาล"], ["moss", "🌿", "มอส"]]) {   // ใช้ไอเทมรักษาระหว่างสู้ (เสียเทิร์น) — ตรง HEAL_ITEMS ใน hboss.js
    const q = state.inv[id]?.qty || 0, b = $("hb-" + id); b.classList.toggle("hidden", won || !q); b.disabled = busy || p.hp >= maxHp(); b.textContent = `${ic} ${nm} ×${q}`;
  }
  $("hb-claim").classList.toggle("hidden", !won); $("hb-claim").disabled = busy;
}
async function hbDo(a, id) { const d = id ? { a, id } : { a }; try { return await hbCall(d); } catch (e) { if (!/aborted/.test(e?.code || "")) throw e; await new Promise((r) => setTimeout(r, 800)); return await hbCall(d); } }   // ติดล็อกลองใหม่ 1 ครั้ง
async function hbRound(action, id) {
  if (state.hbBusy || !state.hb || state.hb.hp <= 0) return;
  state.hbBusy = true; hbRender();
  try {
    const f0 = state.hb, r = await hbDo(action, id);
    (r.log || []).forEach(hbLog); state.hb = r.fight || null;
    if (r.won) { hbLog(`🏆 ${f0.name}ล้มลงแล้ว!`); logLine(`${f0.icon} คุณล้ม${f0.name}ได้สำเร็จ!`, "combat"); try { stat("boss"); } catch { /* ข้าม */ } }
    else if (r.dead) logLine(`${f0.icon} ${f0.name}สู้คุณจนล้มลง…`, "system");
    else if (r.fled) logLine(`คุณหนี${f0.name}มาได้`, "info");
  } catch (e) { if (/ไม่มีการต่อสู้/.test(String(e?.message))) state.hb = null; toast(hbMsg(e)); }
  finally { state.hbBusy = false; hbRender(); }
  if (state.hb && state.hb.hp <= 0) await hbClaim();
}
async function hbClaim() {
  if (state.hbBusy || !state.hb || state.hb.hp > 0) return;
  state.hbBusy = true; hbRender();
  try {
    const f0 = state.hb, r = await hbDo("claim"), got = (r.claimed || []).map((x) => `${ITEMS[x.id]?.icon || ""} ${ITEMS[x.id]?.name || x.id}${x.qty > 1 ? " ×" + x.qty : ""}`).join(" + ");
    state.hb = null; logLine(`🏆 รางวัลจาก${f0.name}: ${got}`, "combat"); toast(`ได้รับ ${got}`);
  } catch (e) { if (/ไม่มีการต่อสู้/.test(String(e?.message))) state.hb = null; toast(hbMsg(e)); }
  finally { state.hbBusy = false; hbRender(); }
}
async function hbRestore() {   // เข้าเกม/รีเฟรชกลางการสู้ → เปิดต่อ
  if (!hbOn() || state.profile?.faction !== "zombie" || state.hb) return;
  try { const r = await hbCall({ a: "state" }); if (r?.fight) { state.hb = r.fight; $("hb-log").textContent = ""; hbLog(`${r.fight.icon} ${r.fight.name}ยังขวางทางคุณอยู่!`); hbRender(); } } catch { /* ข้าม */ }
}
async function hbAfterSearch(found) {   // ค้นหาเสร็จ → ให้เซิร์ฟเวอร์ทอยโอกาสเจอเผ่ามนุษย์ (ไม่ทอยถ้าเจอบอส/ไม่อยู่โซนที่มีเผ่า)
  const p = state.profile;
  if (!hbOn() || p?.faction !== "zombie" || !(p.hp > 0) || state.hb || found === "boss" || !HB_ZONES.includes(state.zone)) return;
  try {
    const r = await hbCall({ a: "roll" }); if (!r?.hit) return;
    if (!r.fight) { logLine(`${(r.log || [])[0] || "ผู้รอดชีวิตโผล่มา"} — คุณถูกซุ่มโจมตีจนล้มลง…`, "system"); return; }
    state.hb = r.fight; $("hb-log").textContent = ""; (r.log || []).forEach(hbLog); logLine(`${r.fight.icon} ${r.log[0]}`, "combat"); hbRender();
  } catch { /* ข้าม — ค้นหาปกติไม่ควรล้มเพราะบอส */ }
}
$("hb-attack").addEventListener("click", () => hbRound("attack"));
$("hb-flee").addEventListener("click", () => hbRound("flee"));
for (const id of ["bandage", "medkit", "moss"]) $("hb-" + id).addEventListener("click", () => hbRound("heal", id));
$("hb-claim").addEventListener("click", hbClaim);
// ---- /บอสเผ่ามนุษย์

// ---- 🟠 สถานะส้ม — functions/crim.js • ฆ่าผู้เล่นฝ่ายเดียวกันนอก Safe Zone → เข้า Safe Zone ไม่ได้ (rules กั้นด้วย) • ปิดอยู่จนกว่าเจ้าของตั้ง tune crim_on = 1
const crimOn = () => T("crim_on", 0) === 1;
const crimActive = (uid, now = serverNow()) => { const c = state.crim?.[uid]; return !!c && typeof c.until === "number" && c.until > now; };   // ไม่เช็ค crimOn: rules กั้นตามข้อมูลจริงแม้ปิดระบบทีหลัง
const crimMe = () => !!state.uid && crimActive(state.uid);
const crimRed = (uid) => crimActive(uid) && state.crim[uid].red === true;   // 🔴 ผู้ก่อเหตุซ้ำ (ก่อเหตุครั้งที่ 3+ ใน 24 ชม.)
const crimMark = (uid) => (crimActive(uid) ? (crimRed(uid) ? " 🔴" : " 🟠") : "");
const crimMinsLeft = () => Math.max(1, Math.ceil(((state.crim?.[state.uid]?.until || 0) - serverNow()) / 60000));
function crimRender() {
  const bar = $("crim-bar"); if (!bar) return;
  const on = crimMe(); bar.classList.toggle("hidden", !on);
  const red = crimRed(state.uid);
  if (on) $("crim-txt").textContent = red ? `🔴 คุณเป็นผู้ก่อเหตุซ้ำ — เข้า Safe Zone ไม่ได้อีก ~${crimMinsLeft()} นาที • จ่ายค่าประกันไม่ได้ (ถ้าถูกจับ โทษคุก ×2)` : `🟠 คุณเป็นผู้ก่อเหตุ (ฆ่าผู้เล่นฝ่ายเดียวกัน) — เข้า Safe Zone ไม่ได้อีก ~${crimMinsLeft()} นาที`;
  { const b = $("crim-bail"); if (b) b.classList.toggle("hidden", red); }
  try { renderTravelState(); } catch { /* ยังไม่พร้อม */ }
}
function crimListen() {
  onValue(ref(db, "crim"), (snap) => { state.crim = snap.val() || {}; crimRender(); if (state.psnap) { try { renderPlayers(state.psnap); } catch { /* ข้าม */ } } }, (er) => console.warn("crim", er?.code || er));
  setInterval(crimRender, 30000);
}
async function crimReport(role, other) {   // หลังเป้าหมายล้ม (HP 0 ถูกเขียนแล้ว) แจ้งเซิร์ฟเวอร์ให้ตรวจเอง — พลาดไม่กระทบเกม
  try { if (crimOn() && other) await crimCall({ a: "report", role, other }); } catch (e) { console.warn("crim report", e?.code || e); }
}
async function crimBail() {
  try {
    const st = await crimCall({ a: "state" });
    if (!st.active) { toast("คุณไม่ได้เป็นส้มแล้ว"); return; }
    if (!confirm(`จ่ายค่าประกัน ${st.bailPts} แต้ม? (เศษเหล็ก/ตะปูสนิม 1 • สารเคมี/เศษหนัง 2 • เทปกาว 3 — ระบบหักให้เอง) แล้วเข้า Safe Zone ได้ทันที — ก่อเหตุซ้ำใน 24 ชม. โทษจะหนักขึ้น`)) return;
    const r = await crimCall({ a: "bail" }); toast(`จ่ายค่าประกัน ${r.pts} แต้มแล้ว`); logLine("🟠 จ่ายค่าประกันแล้ว กลับเข้า Safe Zone ได้", "info");
  } catch (e) { toast(hbMsg(e)); }
}
$("crim-bail").addEventListener("click", crimBail);
// ---- /สถานะส้ม

// ---- 💰 ค่าหัวแบบใหม่ — functions/bounty.js • ตั้งด้วยวัตถุดิบ สะสมแต้ม ไม่หมดเวลา (ลดช้าๆ) จ่ายเป็นวัตถุดิบให้คนที่ล้มเป้าหมาย • ปิดอยู่จนกว่าเจ้าของตั้ง tune bty2_on = 1 (เปิดแล้วเกมใช้ระบบนี้แทนค่าหัวเดิม)
const bountyCall = (data) => httpsCallable(fns, "bountyAct")(data).then((r) => r.data);
const bty2On = () => T("bty2_on", 0) === 1;
const bty2Eff = (b, now = serverNow()) => (b && b.pts > 0 ? Math.max(0, Math.round(b.pts * (1 - (T("bty_decay", 3) / 100) * Math.max(0, (now - b.ts) / 86400000)))) : 0);   // ต้องตรง effPts ใน functions/bounty.js
const bty2Pts = (uid) => bty2Eff(state.bty?.[uid]);
async function bty2Place(uid, name) {
  const p = state.profile; if (!p || p.hp <= 0 || uid === state.uid) return;
  const step = T("bty_step", 10), cur = bty2Pts(uid);
  if (!confirm(`เพิ่มค่าหัว ${name} +${step} แต้ม? (หักวัตถุดิบ ${step} แต้ม: เศษเหล็ก/ตะปูสนิม 1 • สารเคมี/เศษหนัง 2 • เทปกาว 3) ตอนนี้ ${cur} แต้ม — ไม่หมดเวลา (ลด ${T("bty_decay", 3)}%/วัน) คนที่ล้มเขาได้รับวัตถุดิบ (หักค่าธรรมเนียม ${T("bty_fee", 20)}%) ผู้ตั้งเก็บเองไม่ได้ • ฆ่าผู้เล่นฝ่ายเดียวกันที่ไม่ใช่ส้มยังทำให้ตัวเองติดส้ม`)) return;
  try { const r = await bountyCall({ a: "place", target: uid }); achBump("btyset", 1); toast(`💰 ค่าหัว ${name} ตอนนี้ ${r.pts} แต้ม`); } catch (e) { toast(hbMsg(e)); }
}
async function bty2Claim(role, other) {   // หลังเป้าหมายล้ม — เซิร์ฟเวอร์ตรวจเงื่อนไขและจ่ายให้ผู้ฆ่าเอง
  try { if (!bty2On() || !other) return; const r = await bountyCall({ a: "claim", role, other }); if (r?.claimed && r.who === state.uid) { toast(`💰 เก็บค่าหัว ${r.target} ได้ ${r.pay} แต้ม (ได้ของเข้ากระเป๋า)`); } } catch (e) { if (role === "killer") toast(hbMsg(e)); }
}
function bty2Listen() {
  if (state.bty2On || !state.uid) return; state.bty2On = true;
  let first = true; const seen = {};
  onValue(ref(db, "bty"), (snap) => {
    const all = snap.val() || {}, now = serverNow(), fresh = []; state.bty = all;
    Object.entries(all).forEach(([uid, b]) => {
      if (!b || typeof b.ts !== "number") return;
      const was = seen[uid] || {}, live = !first, sig = `${b.ts}:${b.pts}`;
      if (!b.kb && b.pts > 0 && was.sig !== sig && !(first && now - b.ts > 1800000)) fresh.push({ ts: b.ts, live, t: uid === state.uid ? `💰 ค่าหัวบนตัวคุณตอนนี้ ${bty2Eff(b, now)} แต้ม (ล่าสุด: ${b.bn}) ระวังตัวไว้!` : `💰 ${b.bn} เพิ่มค่าหัว ${b.tn} — ตอนนี้ ${bty2Eff(b, now)} แต้ม` });
      if (b.kb && was.kb !== b.kb + b.kts && !(first && now - b.kts > 1800000)) {
        fresh.push({ ts: Math.max(b.kts || b.ts, now - 1), live, t: `🎯 ${b.kb} เก็บค่าหัวของ ${b.tn} ได้สำเร็จ (${b.paid} แต้ม)` });
        const flag = lsKey("bty2kb_" + uid + "_" + b.kts);
        if (!first && b.kb === state.profile?.username && !LS.get(flag, 0)) { LS.set(flag, 1); achBump("bty", 1); questBump("btyok"); }
      }
      seen[uid] = { sig, kb: b.kb ? b.kb + b.kts : "" };
    });
    fresh.sort((a, b) => a.ts - b.ts).forEach((f) => radioPush(`📻 [วิทยุ] ${f.t}`, f.ts, f.live));
    first = false;
    try { if (state.psnap) renderPlayers(state.psnap); worldRefresh(); } catch { /* ข้าม */ }
  }, (er) => console.warn("bty", er?.code || er));
}
function bty2WorldRows(box) {
  box.append(mk("div", "hub-day", "💰 ค่าหัวตอนนี้"));
  const now = serverNow(), list = Object.entries(state.bty || {}).map(([uid, b]) => [uid, b, bty2Eff(b, now)]).filter(([, b, e]) => b && (e > 0 || (b.kb && now - b.kts < 3600000))).sort((x, y) => y[2] - x[2]);
  if (!list.length) return box.append(mk("div", "muted", "ยังไม่มีใครถูกตั้งค่าหัว — กดปุ่ม 💰 ที่รายชื่อผู้เล่นเพื่อเพิ่ม (หักวัตถุดิบ)"));
  list.forEach(([uid, b, e]) => {
    const row = mk("div", "world-row");
    row.append(mk("div", "", e > 0 ? `💰 ${b.tn}${uid === state.uid ? " (คุณ!)" : ""} — ${e} แต้ม` : `🎯 ${b.tn} ถูก ${b.kb} เก็บค่าหัวแล้ว`), mk("div", "muted", e > 0 ? `ล่าสุดโดย ${b.bn} • ไม่หมดเวลา (ลดช้าๆ)` : `ได้รับ ${b.paid} แต้ม`));
    box.append(row);
  });
}
// ---- /ค่าหัวใหม่

// ---- ⛓️ คุก — functions/jail.js • คนส้มที่ถูกล้มโดยผู้เล่นที่ไม่ใช่ส้ม → ติดคุก (โซนซ่อน jail) • ปิดอยู่จนกว่าเจ้าของตั้ง tune jail_on = 1
const jailOn = () => T("jail_on", 0) === 1;
const jailActive = (now = serverNow()) => !!state.jail && typeof state.jail.until === "number" && state.jail.until > now;
const jailMinsLeft = () => Math.max(1, Math.ceil(((state.jail?.until || 0) - serverNow()) / 60000));
function jailRender() {
  const bar = $("jail-bar"); if (!bar) return;
  const on = jailActive() && state.zone === "jail"; bar.classList.toggle("hidden", !on); if (!on) return;
  const I = state.jailInfo || {}, t = state.jail.t || 1, busy = !!state.jailBusy, now = serverNow();
  $("jail-txt").textContent = `⛓️ คุณติดคุก — เหลือ ~${jailMinsLeft()} นาที (ชั้นโทษ ${t}${state.jail.red ? " • 🔴 ผู้ก่อเหตุซ้ำ โทษ ×2 จ่ายประกันไม่ได้" : ""}) • ครบเวลา: ค่าหัวบนตัวหาย แต่เสียของทั่วไปอย่างน้อย 1 ชิ้น • ทำงานในคุก (มินิเกมจำลำดับ) ลดโทษได้ 2–5 นาที/ครั้ง รวมไม่เกินครึ่งหนึ่ง`;
  $("jail-work").disabled = busy || now < (state.jail.wcd || 0); $("jail-esc").disabled = busy || now < (state.jail.et || 0) + 300000;
  const dg = state.jail.dig || 0; $("jail-dig").textContent = `🕳️ ขุดช่องโหว่ ${dg}/3`; $("jail-dig").disabled = busy || state.jwBusy || dg >= 3 || now < (state.jail.dgcd || 0); $("jail-esc").textContent = `🔓 แหกคุก ${I.esc ?? 25}%`; $("jail-bail").textContent = `💰 จ่ายประกัน ${I.bailPts ?? 30 * t} แต้ม`; $("jail-bail").disabled = busy; $("jail-bail").classList.toggle("hidden", !!state.jail.red);
}
async function jailSync() {   // ให้โซนของเกมตรงกับสถานะคุก: ติดคุก → เข้าโซนคุก • หมดโทษ/ประกัน/แหกคุก → ย้ายออกตามที่เซิร์ฟเวอร์กำหนด
  if (state.jailSyncBusy || !state.uid || !state.profile) return; state.jailSyncBusy = true;
  try {
    const p = state.profile;
    if (jailActive() && state.zone !== "jail" && p.hp > 0 && !state.dying && !state.boss && !state.hb) {
      await update(ref(db), { [`users/${state.uid}/zone`]: "jail" }); await enterZone("jail", false, true);
      try { state.jailInfo = await jailCall({ a: "state" }); } catch { /* ข้าม */ }
      logLine(`⛓️ คุณถูกจับขังคุก ${jailMinsLeft()} นาที — ทำงานลดโทษ จ่ายประกัน หรือเสี่ยงแหกคุกได้`, "system");
    } else if (!jailActive() && state.zone === "jail" && jailOn()) {
      const r = await jailCall({ a: "release" });
      if (r.lost) logLine(`⛓️ ครบโทษ — ถูกริบ ${ITEMS[r.lost.id]?.name || r.lost.id} ×${r.lost.qty}`, "system"); else if (r.released) logLine("⛓️ คุณถูกปล่อยตัวแล้ว", "info");
      if (r.zone && r.zone !== state.zone) await enterZone(r.zone, false, true);
    }
  } catch (e) { console.warn("jail sync", e?.code || e); } finally { state.jailSyncBusy = false; jailRender(); }
}
function jailListen() {
  if (state.jailOn || !state.uid) return; state.jailOn = true;
  state.jailReady = new Promise((r) => { state.jailReadyRes = r; });
  onValue(ref(db, `jail/${state.uid}`), (snap) => { state.jail = snap.val(); if (state.jailReadyRes) { state.jailReadyRes(); state.jailReadyRes = null; } jailRender(); jailSync(); }, (er) => console.warn("jail", er?.code || er));
  setInterval(() => { jailRender(); if ((state.zone === "jail") !== jailActive()) jailSync(); }, 15000);
}
async function jailAction(a) {
  if (state.jailBusy) return; state.jailBusy = true; jailRender();
  try {
    if (a === "bail") { const st = await jailCall({ a: "state" }); state.jailInfo = st; if (!confirm(`จ่ายค่าประกัน ${st.bailPts} แต้ม? (เศษเหล็ก/ตะปูสนิม 1 • สารเคมี/เศษหนัง 2 • เทปกาว 3 — ระบบหักให้เอง) ออกทันทีที่ Safe Zone ไม่ถูกริบของ (ค่าหัวบนตัวยังอยู่ — ยังถูกล่าได้)`)) return; }
    if (a === "escape" && !confirm("แหกคุก? ถ้าสำเร็จคุณออกทันที แต่กลับเป็นส้ม โทษรอบหน้าหนักขึ้น และทรัพย์สินบางส่วนของคุณถูกตั้งเป็นค่าหัวบนตัว (ใครล้มคุณได้ไป) • ถ้าล้มเหลวเวลา +5 นาทีและเสียของทั่วไป 1 ชิ้น")) return;
    const r = await jailCall({ a });
    if (a === "bail") toast(`จ่ายค่าประกัน ${r.pts} แต้มแล้ว`);
    else if (a === "escape") toast(r.escaped ? `🔓 แหกคุกสำเร็จ! แต่คุณกลับเป็นส้มแล้ว${r.bounty ? ` และมีค่าหัว ${r.bounty} แต้มบนตัว` : ""}` : `🚨 แหกคุกล้มเหลว เวลาเพิ่ม 5 นาที${r.lost ? ` และเสีย ${ITEMS[r.lost.id]?.name || r.lost.id}` : ""}`);
    if (r.until) state.jail = { ...(state.jail || {}), until: r.until, et: serverNow() };
  } catch (e) { toast(hbMsg(e)); }
  finally { state.jailBusy = false; jailRender(); jailSync(); }
}
async function jailCapture(role, other) {   // ฆ่าคนส้มแล้ว (HP 0 ถูกเขียนแล้ว) → ให้เซิร์ฟเวอร์ตรวจเงื่อนไขและจับเอง
  try {
    if (!jailOn() || !other) return; const r = await jailCall({ a: "capture", role, other });
    if (r?.captured && r.who === state.uid) state.jailCapAt = Date.now();   // ผู้ถูกจับ: ยกเว้นโทษตอนล้ม (processDeath ใช้)
    if (r?.captured && r.by === state.uid) toast(`⛓️ คุณจับ ${state.players[other]?.name || "ผู้ก่อเหตุ"} ส่งเข้าคุกสำเร็จ${r.reward ? ` — ได้ ${ITEMS[r.reward.id]?.name || r.reward.id} ×${r.reward.qty}` : ""}`);
  } catch (e) { console.warn("jail capture", e?.code || e); }
}

// ---- ⛏️ งานในคุก (มินิเกมจำลำดับ) — เซิร์ฟเวอร์ออกโจทย์และตรวจคำตอบ (jailAct workStart/workDone)
// งานเบา: จำ 4 ตัว −2 นาที • งานหนัก: จำ 6 ตัว −5 นาที แต่พลาดเสีย 10 HP • ดูลำดับสัญลักษณ์ที่โผล่ทีละตัว แล้วแตะตามลำดับเดิม
const JW_SYMS = ["🔨", "🪚", "🔩", "🧱", "⛏️"], JW_JOBS = [["light", "🔨 งานเบา", "จำ 4 ตัว • ลดโทษ 2 นาที • พัก 20 วินาที"], ["heavy", "🏗️ งานหนัก", "จำ 6 ตัว • ลดโทษ 5 นาที • ⚠️ พลาดเสีย 10 HP • พัก 45 วินาที"]];
function jwEl() {
  if (!$("jail-work-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "jail-work-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "งานในคุก");
    m.addEventListener("click", (e) => { if (e.target === m && !state.jwBusy) m.classList.add("hidden"); });
    const box = mk("div", "modal-box"), head = mk("div", "modal-head"); head.append(mk("h2", "", "⛏️ งานในคุก"), btn("ปิด", () => { if (!state.jwBusy) m.classList.add("hidden"); }, "btn ghost mini"));
    const body = mk("div", "hub2-body"); body.id = "jw-body"; body.style.marginTop = "10px"; box.append(head, body); m.append(box); document.body.append(m);
  }
  return $("jw-body");
}
function jwMenu(msg) {
  const body = jwEl(), now = serverNow(), left = Math.max(0, Math.ceil(((state.jail?.wcd || 0) - now) / 1000)); body.innerHTML = "";
  if (msg) body.append(mk("div", "", msg));
  body.append(mk("div", "muted", `เหลือโทษ ~${jailActive() ? jailMinsLeft() : 0} นาที • ทำงานลดโทษได้รวมไม่เกินครึ่งหนึ่งของโทษ${left ? ` • พักอีก ${left} วินาที` : ""}`));
  JW_JOBS.forEach(([job, name, desc]) => { const b = btn(`${name} — ${desc}`, () => jwStart(job), "btn primary"); b.style.cssText = "display:block;width:100%;margin-top:8px;min-height:48px;text-align:left"; b.disabled = !!state.jwBusy || left > 0 || !jailActive(); body.append(b); });
}
function jailWorkOpen() { if (!jailActive()) return; $("jail-work-modal") || jwEl(); jwMenu(); $("jail-work-modal").classList.remove("hidden"); }
async function jwStart(job) {
  if (state.jwBusy) return; state.jwBusy = true; const body = jwEl();
  try {
    const st = await jailCall({ a: "workStart", job }), ms = state.jwShowMs ?? 700; body.innerHTML = ""; body.append(mk("div", "", "จำลำดับที่เห็นให้ดี…"));
    const shown = mk("div", "", " "); shown.style.cssText = "font-size:56px;text-align:center;min-height:80px;margin:12px 0"; body.append(shown);
    await new Promise((r) => setTimeout(r, Math.min(ms, 600)));
    for (const x of st.seq) { shown.textContent = JW_SYMS[x] || "?"; await new Promise((r) => setTimeout(r, ms)); shown.textContent = " "; await new Promise((r) => setTimeout(r, Math.round(ms / 3))); }
    const ans = []; body.innerHTML = ""; body.append(mk("div", "", `แตะตามลำดับ (${st.len} ตัว)`));
    const prog = mk("div", "", "·".repeat(st.len)); prog.style.cssText = "font-size:28px;text-align:center;margin:10px 0;letter-spacing:6px"; const pad = mk("div"); pad.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:8px"; body.append(prog, pad);
    const done = new Promise((resolve) => JW_SYMS.slice(0, st.syms || 5).forEach((sym, i) => { const b = btn(sym, () => { ans.push(i); prog.textContent = ans.map((a) => JW_SYMS[a]).join(" ") + " ·".repeat(st.len - ans.length); if (ans.length >= st.len) resolve(); }, "btn ghost"); b.style.cssText = "font-size:30px;min-height:56px"; pad.append(b); }));
    await done; pad.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    const r = await jailCall({ a: "workDone", answer: ans });
    let msg;
    if (r.success) { state.jail = { ...(state.jail || {}), until: r.until, w: r.w }; toast(r.ended ? "⛏️ ทำงานจนครบโทษแล้ว" : `⛏️ ทำงานสำเร็จ ลดโทษ ${r.mins} นาที`); msg = `✅ สำเร็จ ลดโทษ ${r.mins} นาที`; }
    else { toast(r.hpLost ? `❌ พลาด! เสีย ${r.hpLost} HP` : "❌ พลาด! ไม่ลดโทษ"); msg = r.hpLost ? `❌ พลาด เสีย ${r.hpLost} HP` : "❌ พลาด ลองใหม่ได้เมื่อพักเสร็จ"; }
    state.jail = { ...(state.jail || {}), wcd: serverNow() + (job === "heavy" ? 45000 : 20000) }; state.jwBusy = false; jwMenu(msg); jailRender();
  } catch (e) { toast(hbMsg(e)); state.jwBusy = false; jwMenu(); }
  finally { state.jwBusy = false; jailRender(); }
}
// ---- /งานในคุก

// ช่วยแหกคุก: รายชื่อผู้ต้องขัง (jailpub — ทุกคนอ่านได้) • ผู้ช่วยต้องอยู่นอกเมือง • สำเร็จ = ผู้ต้องขังออก แต่ทั้งคู่เป็นส้ม • ล้มเหลว = ผู้ช่วยติดคุกไปด้วย โทษเท่ากับผู้ต้องขัง
function jailPubListen() {
  if (state.jailPubOn || !state.uid) return; state.jailPubOn = true;
  onValue(ref(db, "jailpub"), (snap) => { state.jailpub = snap.val() || {}; try { worldRefresh(); } catch { /* ข้าม */ } }, (er) => console.warn("jailpub", er?.code || er));
}
// เกจแกว่งซ้าย-ขวา (ขุดช่องโหว่/ช่วยแหกคุก): เซิร์ฟเวอร์ออกโจทย์ {t0, c, period, half} — เข็มวิ่งตามเวลาเซิร์ฟเวอร์ กดตอนเข็มอยู่ในโซนเขียว • คืนเวลาที่กด (0 = ไม่ได้กด/หมดเวลา)
const jgPos = (ch, ts) => { const ph = ((((ts - ch.t0) % ch.period) + ch.period) % ch.period) / ch.period; return ph < 0.5 ? ph * 2 : 2 - ph * 2; };
function jailGauge(ch, title) {
  return new Promise((resolve) => {
    const body = jwEl(), modal = $("jail-work-modal"); body.innerHTML = ""; modal.classList.remove("hidden"); state.jwBusy = true;
    body.append(mk("div", "", title)); const bar = mk("div"); bar.style.cssText = "position:relative;height:40px;margin:16px 0;border-radius:8px;background:#20252b;border:1px solid #444;overflow:hidden";
    const zone = mk("div"); zone.style.cssText = `position:absolute;top:0;bottom:0;left:${((ch.c - ch.half) * 100).toFixed(1)}%;width:${(ch.half * 200).toFixed(1)}%;background:rgba(80,200,120,.55)`;
    const needle = mk("div"); needle.style.cssText = "position:absolute;top:0;bottom:0;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 6px #fff"; bar.append(zone, needle);
    let done = false, raf = 0; const finish = (ts) => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(tm); press.disabled = true; resolve(ts); };
    const press = btn("🖐️ กด!", () => finish(serverNow()), "btn primary"); press.style.cssText = "width:100%;min-height:64px;font-size:22px"; body.append(bar, press);
    const tick = () => { if (done) return; needle.style.left = (jgPos(ch, serverNow()) * 100).toFixed(1) + "%"; raf = requestAnimationFrame(tick); }; tick();
    const tm = setTimeout(() => finish(0), Math.round(ch.period * 3.2));
  });
}
async function jailDig() {   // ผู้ต้องขังขุดช่องโหว่ไว้ให้ผู้ช่วย (ไม่ต้องออนไลน์พร้อมกัน): กดตรงโซนเขียว = +1 ช่องโหว่ (สูงสุด 3) โอกาสช่วยแหกคุกของผู้ช่วยเพิ่ม +10% ต่อช่อง
  if (state.jailBusy || state.jwBusy || !jailActive()) return; state.jailBusy = true; jailRender();
  try {
    const st = await jailCall({ a: "digStart" }), ts = await jailGauge(st.ch, `🕳️ ขุดช่องโหว่ (${st.dig}/${st.digMax}) — กดตอนเข็มอยู่ในโซนเขียว`);
    const r = await jailCall({ a: "digHit", ts }); state.jail = { ...(state.jail || {}), dig: r.dig, dgcd: serverNow() + 45000 };
    toast(r.hit ? `🕳️ ขุดสำเร็จ! ช่องโหว่ ${r.dig}/${r.digMax} (เพื่อนช่วยแหกคุกได้ง่ายขึ้น +10%)` : "❌ พลาด ขุดไม่เข้า");
  } catch (e) { toast(hbMsg(e)); }
  finally { state.jwBusy = false; state.jailBusy = false; $("jail-work-modal")?.classList.add("hidden"); jailRender(); }
}
async function jailRescue(uid, name, entry) {
  if (state.jailBusy || state.jwBusy) return; state.jailBusy = true;
  try {
    const base = T("jail_rescue", 10), step = 10, dig = entry?.d || 0, cap = T("jail_rescuemax", 70);
    if (!confirm(`ช่วย ${name} แหกคุก?\nโอกาสสำเร็จ = ${base}% + ${step}% ต่อช่องโหว่ที่เขาขุดไว้ (ตอนนี้ ${dig}/3) + ${step}% ต่อรอบเกจที่คุณกดตรง (3 รอบ) สูงสุด ${cap}%\n• สำเร็จ: เขาออกทันที แต่คุณทั้งคู่กลายเป็นส้ม (เข้า Safe Zone ไม่ได้)\n• ล้มเหลว: คุณถูกขังไปด้วย โทษเท่ากับเขา (${entry?.t ? "ชั้นโทษ " + entry.t : ""}${entry?.red ? " • 🔴 ×2" : ""} ติดเต็มโทษ)\n• ลองได้ทุก 10 นาที`)) return;
    let st = await jailCall({ a: "rescueStart", target: uid }), r = null, ch = st.ch, hits = 0;
    for (let round = 1; round <= st.rounds; round++) {
      const ts = await jailGauge(ch, `🔓 ช่วย ${name} แหกคุก — รอบ ${round}/${st.rounds} • กดตอนเข็มอยู่ในโซนเขียว (ตรงแล้ว ${hits}/${round - 1})`);
      r = await jailCall({ a: "rescueHit", ts }); hits = r.hits ?? hits; if (r.done) break; ch = r.ch;
    }
    state.jwBusy = false; $("jail-work-modal")?.classList.add("hidden");
    if (r?.rescued) { toast(`🔓 ช่วย ${r.target} แหกคุกสำเร็จ! (โอกาส ${r.chance}%) แต่คุณกลายเป็นส้มแล้ว`); logLine(`🔓 คุณช่วย ${r.target} แหกคุกสำเร็จ — คุณทั้งคู่เป็นผู้ก่อเหตุ`, "system"); }
    else if (r) { toast(`🚨 ช่วยแหกคุกล้มเหลว (โอกาส ${r.chance}%)! คุณถูกขังไปด้วย (โทษเท่ากัน ~${Math.round(r.tm || 0)} นาที)`); }
  } catch (e) { toast(hbMsg(e)); }
  finally { state.jwBusy = false; state.jailBusy = false; $("jail-work-modal")?.classList.add("hidden"); jailRender(); jailSync(); try { worldRefresh(); } catch { /* ข้าม */ } }
}
function jailWorldRows(box) {
  if (!jailOn()) return;
  const now = serverNow(), list = Object.entries(state.jailpub || {}).filter(([uid, e]) => e && e.u > now && uid !== state.uid);
  box.append(mk("div", "hub-day", "⛓️ ผู้ต้องขัง"));
  if (!list.length) return box.append(mk("div", "muted", "ตอนนี้ไม่มีใครติดคุก"));
  const can = !jailActive() && state.profile?.hp > 0 && !["safe", "casino", "jail"].includes(state.zone);
  list.sort((a, b) => a[1].u - b[1].u).forEach(([uid, e]) => {
    const row = mk("div", "world-row"), mins = Math.max(1, Math.ceil((e.u - now) / 60000));
    row.append(mk("div", "", `⛓️ ${e.n}${e.red ? " 🔴" : ""} — เหลือ ~${mins} นาที (ชั้นโทษ ${e.t || 1}) • 🕳️ ช่องโหว่ ${e.d || 0}/3 (+${(e.d || 0) * 10}%)`));
    const b = btn("🔓 ช่วยแหกคุก", () => jailRescue(uid, e.n, e), "btn ghost mini"); b.disabled = !can; if (!can) b.title = "ต้องอยู่นอกเมือง (ไม่ใช่ Safe Zone/คาสิโน) และไม่ได้ติดคุกอยู่";
    row.append(b); box.append(row);
  });
}
$("jail-work").addEventListener("click", jailWorkOpen); $("jail-dig").addEventListener("click", jailDig); $("jail-esc").addEventListener("click", () => jailAction("escape")); $("jail-bail").addEventListener("click", () => jailAction("bail"));
// ---- /คุก

/* =========================================================
   10b) บอสโลก (World Boss) — GM/Owner เรียกที่โซนไหนก็ได้ ทุกคนในโซนช่วยกันตี HP ร่วมกัน
   ข้อมูล: worldBosses/{zone} (สถานะบอส) / worldBossHits/{zone}/{uid} (ดาเมจสะสมของแต่ละคน) / worldBossClaims/{zone}/{uid} (รับรางวัลแล้ว)
   ========================================================= */
const WB_REWARD_IDS = [...Object.keys(ITEMS).filter((id) => (ITEMS[id].type !== "material" || id === "scrap" || id === "chem") && ITEMS[id].type !== "gear" && ITEMS[id].type !== "stat")].filter((id) => id !== "rotten_meat");
const wbOf = (z) => { const b = state.wb?.[z]; return b && typeof b.hp === "number" && typeof b.startedAt === "number" ? b : null; };
const wbExpired = (b) => !!b && b.hp > 0 && !!b.endsAt && b.endsAt <= serverNow();
const wbAlive = (b) => !!b && b.hp > 0 && !wbExpired(b);
const wbMine = (b) => { const h = state.wbHits?.[state.uid]; return h && h.bid === b.startedAt ? h : null; };
const wbRewardText = (b) => { if (b.rid === "skill" && b.rsk) return `📖 สกิล ${b.rsk.icon || "✨"} ${b.rsk.name}`; if (b.rid === "custom_gear" && b.rcg) return `${b.rcg.icon || "🛡️"} ${b.rcg.name}`; const d = ITEMS[b.rid]; return d ? `${d.icon} ${d.name}${d.type === "weapon" ? "" : " ×" + b.rqty}` : "—"; };
const wbBonusText = (b) => (b.rpool ? " + 🎲 เกราะสุ่ม" : "") + (b.rtop ? " + 🥇 ชิ้นพิเศษอันดับ 1" : "");

const WB_ART = { "ซอมบี้ยักษ์หิวโหย": "hungry", "ผีคลั่งข้างถนน": "mad", "ราชาซอมบี้": "king", "สัตว์ประหลาดกลายพันธุ์": "mutant", "ทรราชแห่งความตาย": "tyrant", "เจ้าแห่งฝูงผี": "horde" };
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
  { const art = $("wb-art"), id = WB_ART[b.name]; if (art) art.classList.add("hidden"); box.classList.remove("has-art"); box.style.removeProperty("--wbart"); if (id) { const src = `img/wb/${id}.webp`; imgProbe(src, (ok) => { if (ok && box.isConnected) { box.style.setProperty("--wbart", `url(${src})`); box.classList.add("has-art"); } }); } }   // รูปบอสเป็นพื้นหลังกล่อง (เหมือนแบนเนอร์โซน) ไม่ดันปุ่มต่อสู้
  $("wb-time").textContent = dead ? "ล้มแล้ว" : b.endsAt ? `หายไปใน ~${Math.max(1, Math.ceil((b.endsAt - serverNow()) / 60000))} นาที` : "";
  $("wb-tag").textContent = `${b.tag ? b.tag + " • " : ""}ตี ${b.hits} ครั้ง/รอบ ดาเมจ ${b.dmgLo}–${b.dmgHi}${T("wb_aura", WB_AURA_DEF) > 0 ? ` • ฟาดทุกคนในโซนทุก ~${T("wb_aura", WB_AURA_DEF)} วิ` : ""} • รางวัล ${wbRewardText(b)}${wbBonusText(b)}${fxChanceText("wboss")}`;
  $("bar-wb").style.width = Math.max(0, (b.hp / b.max) * 100) + "%";
  $("txt-wb").textContent = `HP ${Math.max(0, b.hp)}/${b.max}`;
  const top = Object.values(state.wbHits || {}).filter((h) => h.bid === b.startedAt).sort((a, c) => c.total - a.total).slice(0, 3);
  $("wb-top").textContent = (top.length ? "🏅 " + top.map((h, i) => `${i + 1}. ${h.name || "?"} ${h.total}`).join("  ") : "ยังไม่มีใครโจมตี") + (mine ? ` • ของคุณ ${mine.total}` : "");
  const cd = Math.ceil(attackCooldownLeft() / 1000), stunned = effActive("stun");
  const atk = $("wb-attack"); atk.classList.toggle("hidden", dead);
  atk.disabled = !!state.wbBusy || p.hp <= 0 || cd > 0 || stunned;
  atk.textContent = state.wbBusy ? "กำลังต่อสู้…" : stunned ? "😵 มึนงง" : cd > 0 ? `พักแรง ${cd}` : "⚔️ โจมตีบอสโลก";
  renderSwapBar($("wb-swap")); $("wb-swap").classList.toggle("hidden", dead || !$("wb-swap").childElementCount);
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
    const uid = state.uid, u = {}, w = equippedWeapon(), r = pveD6(), sk = skd, atk = !sk || sk.type === "power";
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
      const nt = (mine?.total || 0) + dmg;
      if (nt > (b.top?.total || 0)) u[`worldBosses/${z}/top`] = { uid, total: nt, name: String(p.username).slice(0, 16) };   // อันดับ 1 ณ ตอนนี้ (rules ตรวจว่าตรงกับดาเมจสะสมจริง)
    }
    let hp = p.hp;
    if (sk?.type === "heal") { hp = Math.min(maxHp(), hp + skillHealOf(sk)); line += ` +${hp - p.hp} HP`; }
    if (!killed) {
      const s = strikeWith({ hits: b.hits, acc: b.acc, dmg: [b.dmgLo, b.dmgHi], verb: `${b.name}โจมตีกลับ` }, sk);
      hp = Math.max(0, hp - s.total); line += ` • ${s.text}`;
      if (hp !== p.hp) u[`users/${uid}/hp`] = hp;
      if (hp < p.hp) line += monFx(u, "wboss", p.hp - hp, hp);
    }
    state.wbDbgU = u;
    await update(ref(db), u);
    if (dmg > 0) { questBump("wboss"); questBump("hit"); stat("wbdmg", dmg); }
    if (hp < p.hp) stat("dmg", p.hp - hp);
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

async function wbClaim(retry = true) {
  const z = state.zone, b0 = wbOf(z);
  if (!b0 || b0.hp > 0 || state.wbBusy) return;
  if (!wbMine(b0)) return toast("ต้องร่วมโจมตีบอสก่อนถึงจะรับรางวัลได้");
  if (state.wbClaim?.bid === b0.startedAt) return toast("รับรางวัลไปแล้ว");
  state.wbBusy = true; renderWB();
  let b = b0;
  try {
    const fresh = (await get(ref(db, `worldBosses/${z}`))).val();   // อ่านตัวนับคลังเกราะล่าสุด (หลายคนรับพร้อมกันได้)
    if (fresh && fresh.startedAt === b0.startedAt) b = { ...b0, ...fresh };
    const uid = state.uid, u = { [`worldBossClaims/${z}/${uid}`]: { bid: b.startedAt, ts: serverTimestamp() } }, def = ITEMS[b.rid];
    if (b.rid === "custom_gear") u[`inventory/${uid}/wb_${z}_${b.startedAt}`] = { id: "custom_gear", qty: 1, ...gearFields(b.rcg) };
    else if (b.rid === "skill") u[`skills/${uid}/wb_${z}_${b.startedAt}`] = skillFields(b.rsk);   // รางวัลเป็นสกิล: เข้า skills ไม่ใช่ inventory
    else if (def.type === "weapon") u[`inventory/${uid}/wb_${z}_${b.startedAt}`] = { id: b.rid, qty: 1, dur: b.rdur ?? Math.min(30, def.maxDur) };
    else u[`inventory/${uid}/${b.rid}`] = { id: b.rid, qty: Math.min(99, (state.inv[b.rid]?.qty || 0) + b.rqty) };
    // ชิ้นที่ 2: เกราะจากคลังที่สุ่มไว้ล่วงหน้า (ได้ตามลำดับคนรับ — rules บังคับให้เลือกเองไม่ได้)
    const n = b.rn || 0, pg = b.rpool?.["p" + n];
    if (pg) { u[`inventory/${uid}/wbp_${z}_${b.startedAt}`] = { id: "custom_gear", qty: 1, ...gearFields(pg) }; u[`worldBosses/${z}/rn`] = n + 1; }
    // ชิ้นพิเศษของผู้ทำดาเมจสูงสุด
    const topGear = b.rtop && b.top?.uid === uid ? b.rtop : null;
    if (topGear) u[`inventory/${uid}/wbt_${z}_${b.startedAt}`] = { id: "custom_gear", qty: 1, ...gearFields(topGear) };
    state.wbDbgU = u;
    await update(ref(db), u);
    logLine(`🏆 รางวัลจาก${b.name}: ${wbRewardText(b)}`, "combat"); toast(`ได้รับ ${wbRewardText(b)}`); achBump("wbkill");
    if (pg) logLine(`🎲 เกราะสุ่มจากคลัง: ${pg.icon || "🛡️"} ${pg.name} (ลดดาเมจ ${pg.red}% • ช่อง${pg.gslot === "acc" ? "อุปกรณ์เสริม" : "เกราะ"})`, "combat");
    if (topGear) logLine(`🥇 คุณทำดาเมจสูงสุด! ได้ชิ้นพิเศษ: ${topGear.icon || "🛡️"} ${topGear.name} (ลดดาเมจ ${topGear.red}%)`, "system");
  } catch (e) {
    wbDebug("claim", e, state.wbDbgU, b);
    if (retry && String(e?.code || e).includes("PERMISSION_DENIED")) { state.wbBusy = false; await new Promise((r) => setTimeout(r, 900)); return wbClaim(false); }   // มีคนรับพร้อมกัน ตัวนับคลังขยับ → ลองใหม่ 1 ครั้ง
    toast(errMsg(e));
  }
  finally { state.wbBusy = false; renderWB(); }
}
$("wb-attack").addEventListener("click", () => wbAttack());
$("wb-claim").addEventListener("click", () => wbClaim());
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
  fillSelect($("adm-wb-reward"), [...WB_REWARD_IDS.map((id) => [id, `${ITEMS[id].icon} ${ITEMS[id].name}${ITEMS[id].type === "weapon" ? " (อาวุธ)" : ""}`]), ["custom_gear", "🛡️ เกราะ/อุปกรณ์เอง (custom)"], ["skill", "📖 สกิลเอง (custom)"]]);
  buildSkillBox("adm-wb-skill-box", "adm-wb-spk-");
  syncWbRewardFields();
}
function syncWbRewardFields() {
  const isSk = $("adm-wb-reward").value === "skill", isCg = $("adm-wb-reward").value === "custom_gear";
  $("adm-wb-skill-box").classList.toggle("hidden", !isSk);
  $("adm-wb-gear-fields").classList.toggle("hidden", !isCg);
  $("adm-wb-rqty").classList.toggle("hidden", isSk || isCg);
  $("adm-wb-rdur").classList.toggle("hidden", isSk || isCg);
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
  const rid = $("adm-wb-reward").value, isSk = rid === "skill", isCg = rid === "custom_gear", def = isSk || isCg ? null : ITEMS[rid], isW = !!def && def.type === "weapon";
  const rcg = isCg ? { name: $("adm-wb-gear-name").value.trim().slice(0, 40) || "เกราะปริศนา", gslot: $("adm-wb-gear-slot").value === "acc" ? "acc" : "arm", red: Math.max(1, Math.min(GEAR_CUSTOM_MAX, parseInt($("adm-wb-gear-red").value, 10) || 10)), ...([...$("adm-wb-gear-icon").value.trim()].slice(0, 2).join("") ? { icon: [...$("adm-wb-gear-icon").value.trim()].slice(0, 2).join("") } : {}) } : null;
  const sk = isSk ? readSkillForm("adm-wb-spk-") : null; if (isSk && !sk) return;
  const icon = $("adm-wb-icon").value.trim().slice(0, 4), tag = $("adm-wb-tag").value.trim().slice(0, 80), intro = $("adm-wb-intro").value.trim().slice(0, 120);
  const b = {
    name, hp, max: hp, zone: z, by: state.profile.username, startedAt: serverTimestamp(), dmgLo: dlo, dmgHi: dhi, hits, acc, rid, rqty: isW || isSk || isCg ? 1 : num("adm-wb-rqty", 1, 50, 1),
    ...(isSk ? { rsk: skillFields(sk) } : {}),
    ...(isCg ? { rcg } : {}),
    ...(isW ? { rdur: num("adm-wb-rdur", 1, 60, Math.min(30, def.maxDur)) } : {}),
    ...(icon ? { icon } : {}), ...(tag ? { tag } : {}), ...(intro ? { intro } : {}), ...(mins ? { endsAt: serverNow() + mins * 60000 } : {})
  };
  if ($("adm-wb-loot").checked) {   // สุ่มคลังเกราะ + ชิ้นพิเศษอันดับ 1 ตามความแรงบอส (หรือระดับที่เลือก)
    const tsel = $("adm-wb-tier").value, tier = tsel === "auto" ? lootTierOf(hp) : parseInt(tsel, 10);
    Object.assign(b, rollLoot(Math.random, tier, num("adm-wb-pool", 1, 12, 8), GEAR_CUSTOM_MAX, GEAR_CUSTOM_MAX));
  }
  try {
    const annId = push(ref(db, "announcements")).key;
    await update(ref(db), {
      [`worldBosses/${z}`]: b, [`worldBossHits/${z}`]: null, [`worldBossClaims/${z}`]: null,
      [`announcements/${annId}`]: { text: `${icon || "👹"} บอสโลก「${name}」ปรากฏตัวที่${ZONES[z].name}! ไปช่วยกันล้มมัน${intro ? " — " + intro : ""}${b.rpool ? " • รางวัลมีเกราะสุ่ม!" : ""}`.slice(0, 200), zone: "all", by: state.profile.username, ts: serverTimestamp() }
    });
    toast(`เรียกบอสโลกที่ ${ZONES[z].name} แล้ว`);
    trimList("announcements", ANN_LIMIT).catch(() => {});
  } catch (e) { toast(errMsg(e)); }
});

// ประกาศผลตอนบอสโลกล้ม: MVP (ดาเมจสะสมสูงสุด) + ชิ้นพิเศษที่เขาจะได้ — อ่านจาก worldBosses/{z}/top เดิม ไม่เขียนอะไรใหม่
function wbMvpNotice(z, b) {
  const k = "mvp" + z + b.startedAt; state.wbaSeen = state.wbaSeen || {}; if (state.wbaSeen[k]) return; state.wbaSeen[k] = 1;
  const zn = ZONES[z]?.name || z, t = b.top;
  if (!t?.name) { logLine(`🏆 บอสโลก「${b.name}」ที่${zn}ล้มลงแล้ว!`, "system"); return; }
  const me = t.uid === state.uid;
  logLine(`🏆 บอสโลก「${b.name}」ที่${zn}ล้มลงแล้ว! 🥇 MVP: ${t.name} (ดาเมจรวม ${t.total})${b.rtop ? ` — รับชิ้นพิเศษ ${b.rtop.icon || "🛡️"} ${b.rtop.name}` : ""}${me ? " • คือคุณเอง! 🎉" : ""}`, "system");
  if (me && !LS.get(lsKey("mvp_" + k), 0)) { LS.set(lsKey("mvp_" + k), 1); achBump("wbmvp"); }
  if (me) { toast("🥇 คุณคือ MVP ของบอสโลก!"); try { sfx("boss"); } catch (_) {} }
}

function listenWorldBoss() {
  onValue(ref(db, "worldBosses"), (snap) => {
    const nu = snap.val() || {};
    Object.entries(nu).forEach(([z, b]) => {
      const was = state.wb?.[z];
      if (was && was.startedAt === b.startedAt && was.hp > 0 && b.hp <= 0 && z === state.zone) logLine(`🏆 ${b.name}ล้มลงแล้ว! ผู้ที่ร่วมโจมตีกดรับรางวัลได้`, "system");
      if (was && was.startedAt === b.startedAt && was.hp > 0 && b.hp <= 0) wbMvpNotice(z, b);   // ประกาศ MVP ให้ทุกคนที่ออนไลน์ (ฝั่ง client ล้วน)
      wbaNotice(z, b, was);
      if (state.wbSeenOnce && !was && b.hp > 0) { sfx("boss"); notifyOS("👹 บอสโลกเกิดแล้ว!", `${b.name} ที่${ZONES[z]?.name || z}`, "wb" + b.startedAt); }   // บอสโลกเกิดใหม่ (ไม่ร้องตอนโหลดหน้าครั้งแรก)
    });
    state.wbSeenOnce = true;
    state.wb = nu; renderWB(); renderAdminWB();
  });
  onValue(ref(db, "wbAuto"), (s) => { state.wbAuto = s.val(); state.wbAutoOk = true; wbaTick(); }, (e) => console.error("wbAuto", e));
  setInterval(() => { renderWB(); renderAdminWB(); }, 1000);
  setInterval(wbaTick, 20000);
  setInterval(wbAuraTick, 5000);
}
// บอสโลกฟาดผู้เล่นที่ยืนอยู่ในโซนเป็นระยะ (กันยืนดูเฉย ๆ) — ฝั่งเครื่องผู้เล่นหักเลือดตัวเอง (rules เดิมให้ลดเลือดตัวเองได้อยู่แล้ว)
// ฟาดครั้งละ 1 ที (ดาเมจ/โอกาสโดนตามบอส) • นับเวลาจากตอนเข้าโซน/บอสเกิด หรือจากการตีบอสครั้งล่าสุด (คนที่ตีอยู่โดนสวนกลับอยู่แล้ว) • ปรับ/ปิดได้ที่แท็บ 🎛️ (wb_aura = วินาที, 0 = ปิด)
const WB_AURA_DEF = 45;
async function wbAuraTick() {
  try {
    const z = state.zone, p = state.profile, b = z && z !== "safe" ? wbOf(z) : null;
    if (!b || !wbAlive(b) || !p || !(p.hp > 0) || state.wbBusy || state.wbAuraBusy) return;
    const ms = Math.max(0, T("wb_aura", WB_AURA_DEF)) * 1000; if (!ms) return;
    const now = serverNow(), key = z + "_" + b.startedAt;
    if (state.wbAuraAt?.k !== key) { state.wbAuraAt = { k: key, t: now }; return; }
    if (now - Math.max(state.wbAuraAt.t, typeof p.lastAttack === "number" ? p.lastAttack : 0) < ms) return;
    state.wbAuraAt.t = now; state.wbAuraBusy = true;
    const s = strikeWith({ hits: 1, acc: b.acc, dmg: [b.dmgLo, b.dmgHi], verb: `${b.name}ฟาดใส่ทุกคนในโซน` }, null);
    const hp = Math.max(0, p.hp - s.total), u = {};
    if (hp !== p.hp) u[`users/${state.uid}/hp`] = hp;
    let line = s.text;
    if (hp < p.hp) line += monFx(u, "wboss", p.hp - hp, hp);
    if (Object.keys(u).length) await update(ref(db), u);
    if (hp < p.hp) stat("dmg", p.hp - hp);
    logLine(`${b.icon || "👹"} ${line}`, "combat");
    if (hp === 0) logLine(`${b.icon || "👹"} ${b.name}ฟาดคุณจนล้มลง…`, "system");
  } catch (e) { console.warn("wbAura", e); }
  finally { state.wbAuraBusy = false; }
}

/* =========================================================
   10c) บอสโลกสุ่มเกิด — เกิดเองทุก 1–2 ชม. หายเองตามเวลา รางวัลสุ่มตอนเกิด (ไม่ต้องมี GM / ไม่ต้องมีเซิร์ฟเวอร์)
   wbAuto = { ts, zone, by } = ครั้งล่าสุดที่เกิด • ระยะห่างครั้งถัดไป = 60–120 นาที สุ่มจาก seed = ts ล่าสุด (ทุกเครื่องคำนวณได้ค่าเดียวกัน)
   ผู้เล่นออนไลน์คนแรกที่ถึงเวลาเป็นคนเขียนบอส (worldBosses/{zone} + wbAuto ในอัปเดตเดียวกัน) • คนที่ช้ากว่าโดน rules ปฏิเสธ = ปกติ
   ตัวเลขทุกค่า (HP/ดาเมจ/อายุ/รายการรางวัล/จำนวน) ต้องอยู่ในขอบเขตเดียวกับ rules ของ worldBosses (ฝั่ง auto) ใน database_rules.json
   ========================================================= */
const WBA = {
  gapMin: 60, gapMax: 120,   // นาที (rules บังคับขั้นต่ำ 60 นาทีนับจาก wbAuto.ts)
  tiers: [
    { w: 60, hp: 1500, dlo: 8, dhi: 16, hits: 1, acc: 0.65, mins: 40, tag: "บอสเล็ก",
      rewards: [["canned_food", 3], ["water_jug", 2], ["bandage", 4], ["stim_shot", 2], ["scrap", 6], ["chem", 4], ["soup", 3]],
      names: [["ซอมบี้ยักษ์หิวโหย", "🧟", "ร่างใหญ่โตที่หิวกระหายเลือดมนุษย์"], ["ผีคลั่งข้างถนน", "💀", "มันวิ่งตรงมาโดยไม่สนอะไรทั้งนั้น"]] },
    { w: 30, hp: 3000, dlo: 12, dhi: 24, hits: 1, acc: 0.75, mins: 45, tag: "บอสกลาง",
      rewards: [["medkit", 3], ["army_meal", 4], ["trauma_kit", 2], ["antidote", 2], ["serum", 2], ["spiked_bat", 1], ["fire_axe", 1]],
      names: [["ราชาซอมบี้", "👹", "เสียงคำรามของมันดังไปทั่วเขต"], ["สัตว์ประหลาดกลายพันธุ์", "🐺", "เชื้อไวรัสเปลี่ยนมันจนจำเค้าเดิมไม่ได้"]] },
    { w: 10, hp: 5000, dlo: 15, dhi: 28, hits: 2, acc: 0.7, mins: 50, tag: "บอสใหญ่ รางวัลดีมาก",
      rewards: [["trauma_kit", 3], ["serum", 3], ["crossbow", 1], ["samurai_sword", 1], ["shotgun", 1], ["pistol", 1]],
      names: [["ทรราชแห่งความตาย", "☠️", "ผู้รอดชีวิตหลายคนไม่เคยกลับมาจากที่ที่มันอยู่"], ["เจ้าแห่งฝูงผี", "👹", "ฝูงซอมบี้ทั้งเขตเชื่อฟังมัน"]] }
  ]
};
const wbaGapMin = (last) => WBA.gapMin + Math.floor(bmRng((Math.imul(Math.floor(last / 1000), 2654435761) ^ 0x1b873593) >>> 0)() * (WBA.gapMax - WBA.gapMin + 1));
const wbaDue = () => state.wbAutoOk && (!state.wbAuto?.ts || serverNow() >= state.wbAuto.ts + wbaGapMin(state.wbAuto.ts) * 60000);

// สร้างบอสรอบถัดจาก last (seed จาก last → ชนิด/รางวัลเหมือนกันทุกเครื่อง; โซนเลือกจากโซนที่ยังไม่มีบอสอยู่)
function wbaBuild(last) {
  const rnd = bmRng((Math.imul(Math.floor(last / 1000), 2246822519) ^ 0x85ebca6b) >>> 0);
  const roll = rnd() * 100; let acc = 0;
  const t = WBA.tiers.find((x) => (acc += x.w) > roll) || WBA.tiers[0];
  const zones = Object.keys(ZONES).filter((z) => z !== "safe" && !wbAlive(wbOf(z)));
  if (!zones.length) return null;
  const zone = zones[Math.floor(rnd() * zones.length)];
  const [name, icon, intro] = t.names[Math.floor(rnd() * t.names.length)];
  const [rid, rqty] = t.rewards[Math.floor(rnd() * t.rewards.length)], isW = ITEMS[rid].type === "weapon";
  return {
    zone, mins: t.mins,
    boss: { name, icon, tag: t.tag, intro, hp: t.hp, max: t.hp, zone, dmgLo: t.dlo, dmgHi: t.dhi, hits: t.hits, acc: t.acc, rid, rqty: isW ? 1 : rqty, ...(isW ? { rdur: Math.min(20, ITEMS[rid].maxDur) } : {}), ...rollLoot(rnd, lootTierOf(t.hp), 6, 12, 18) }
  };
}

async function wbaTick() {
  const p = state.profile;
  if (!p || p.banned || state.wbaBusy || !wbaDue() || Date.now() < (state.wbaBackoff || 0)) return;
  state.wbaBusy = true;
  try {
    await new Promise((r) => setTimeout(r, Math.random() * 4000));   // สุ่มหน่วง กันหลายคนเขียนชนกัน
    if (!wbaDue()) return;                                            // มีคนเขียนไปก่อนแล้ว (listener อัปเดต state.wbAuto)
    const made = wbaBuild(state.wbAuto?.ts || 0); if (!made) return;
    const { zone, mins, boss } = made;
    await update(ref(db), {
      [`worldBosses/${zone}`]: { ...boss, by: p.username, startedAt: serverTimestamp(), endsAt: serverNow() + mins * 60000, auto: true },
      wbAuto: { ts: serverTimestamp(), zone, by: state.uid }
    });
  } catch (e) {
    state.wbaBackoff = Date.now() + 120000;   // โดนปฏิเสธ (มักมีคนเขียนก่อน) → เว้น 2 นาทีค่อยลองใหม่
    console.debug("wbaSpawn", e?.code || e);
  } finally { state.wbaBusy = false; }
}

// แจ้งผู้เล่นออนไลน์ทุกคนในเกมเมื่อมีบอสสุ่มเกิดใหม่ (ประกาศของ GM เขียนโดยผู้เล่นทั่วไปไม่ได้ จึงแจ้งฝั่ง client เอง) / ตอนเพิ่งเข้าเกมก็บอกบอสที่ยังอยู่
function wbaNotice(z, b, was) {
  if (!b?.auto || typeof b.hp !== "number" || b.hp <= 0 || (b.endsAt && b.endsAt <= serverNow())) return;
  if (was && was.startedAt === b.startedAt) return;
  state.wbaSeen = state.wbaSeen || {}; const key = z + b.startedAt; if (state.wbaSeen[key]) return; state.wbaSeen[key] = 1;
  const left = b.endsAt ? Math.max(1, Math.ceil((b.endsAt - serverNow()) / 60000)) : 0;
  logLine(`${b.icon || "👹"} บอสโลก「${b.name}」ปรากฏที่${ZONES[z]?.name || z}! ไปช่วยกันล้มมัน${left ? ` (หายไปใน ~${left} นาที)` : ""} • รางวัล ${wbRewardText(b)}${wbBonusText(b)}`, "system");
  toast(`${b.icon || "👹"} บอสโลกปรากฏที่${ZONES[z]?.name || z}!`);
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

// ---- ⚔️ อาวุธติดสถานะ (มนุษย์ใช้ได้เท่านั้น) — functions/fxw.js (ตัวเลขต้องตรงกัน: tests/emulator/fxw.js) • ปิดอยู่จนกว่า tune fxw_on = 1 (คราฟต์/ค้นเจอ; แอดมินเสกได้เสมอ)
// ช่องอาวุธ = id "custom" + icon + fx {t ชนิด, v ความแรง, m นาที, p โอกาสติด % ต่อการโจมตีที่โดน} • ผู้ใช้ต้องเป็นมนุษย์ ได้ผลกับเป้าทั้งสองฝ่าย: เกมแนบ wfx ในบันทึกโจมตี (rules ตรวจว่าตรงกับช่อง fx ของอาวุธที่ถือ) ผู้ถูกโจมตีทอยโอกาสแล้วเขียนสถานะลงตัวเอง (กิ่ง effects เดิมของมอนสเตอร์)
const FXW = {
  fxw_cleaver: { name: "มีดสับกระดูก", icon: "🔪", dmg: 11, dur: 24, tier: 1, fx: { t: "bleed", v: 2, m: 3, p: 30 }, need: { scrap: 8, leather_scrap: 1, rusty_nails: 2 } },
  fxw_venom: { name: "มีดอาบพิษ", icon: "🗡️", dmg: 9, dur: 22, tier: 1, fx: { t: "poison", v: 1, m: 5, p: 35 }, need: { scrap: 6, chem: 3, leather_scrap: 1 } },
  fxw_stunbat: { name: "กระบองช็อต", icon: "🏏", dmg: 8, dur: 16, tier: 1, fx: { t: "stun", v: 1, m: 1, p: 15 }, need: { scrap: 8, battery_pack: 1, copper_wire: 2 } },
  fxw_ripaxe: { name: "ขวานผ่าซาก", icon: "🪓", dmg: 16, dur: 16, tier: 2, fx: { t: "bleed", v: 3, m: 3, p: 30 }, need: { scrap: 14, steel_plate: 1, rusty_nails: 3 } },
  fxw_hammer: { name: "ค้อนทุบกระดูก", icon: "🔨", dmg: 14, dur: 18, tier: 2, fx: { t: "dice", v: -1, m: 3, p: 15 }, need: { scrap: 12, steel_plate: 1, duct_tape: 1 } },
  fxw_dartbow: { name: "หน้าไม้ลูกดอกพิษ", icon: "🏹", dmg: 20, dur: 14, tier: 2, fx: { t: "poison", v: 3, m: 3, p: 30 }, need: { scrap: 12, rope_coil: 2, steel_plate: 1, chem: 4 } },
  fxw_chainsaw: { name: "ดาบเลื่อยโซ่", icon: "⛓️", dmg: 26, dur: 14, tier: 3, fx: { t: "bleed", v: 3, m: 5, p: 30 } },
  fxw_taser: { name: "ปืนช็อตไฟฟ้า", icon: "⚡", dmg: 22, dur: 12, tier: 3, fx: { t: "stun", v: 1, m: 1, p: 35 } },
  fxw_plague: { name: "ดาบกาฬโรค", icon: "☣️", dmg: 24, dur: 14, tier: 3, fx: { t: "poison", v: 3, m: 5, p: 35 } }
};
const WFX_TYPES = ["bleed", "poison", "stun", "dice"];
// ช่อง fx ที่ใช้ได้จริง (null ถ้าไม่ใช่อาวุธติดสถานะ/ค่าผิดปกติ) — v: เลือดไหล/พิษ 1–3 • ทอย −2..−1 • นาที 1–5 • มึนงง 1 นาที
const wfxOf = (it) => {
  const f = it && it.id === "custom" && it.fx; if (!f || !WFX_TYPES.includes(f.t)) return null;
  const v = Number(f.v), m = Number(f.m), pr = Number(f.p);
  if (!(m >= 1 && m <= 5) || !(pr >= 1 && pr <= 100) || !(v >= -2 && v <= 3) || !v) return null;
  if (f.t === "dice" ? !(v < 0) : v < 0) return null; if (f.t === "stun" && m !== 1) return null;
  return { t: f.t, v, m, p: pr };
};
const wfxLabel = (f) => `${FX_TYPES[f.t].icon} ${f.t === "poison" && f.v >= POISON_STRONG ? "พิษแรง" : FX_TYPES[f.t].name} ${f.p}%`;
const fxwSlot = (k) => { const d = FXW[k]; return { id: "custom", qty: 1, dur: d.dur, maxDur: d.dur, name: d.name, dmg: d.dmg, type: "weapon", icon: d.icon, fx: { ...d.fx } }; };   // ต้องตรงกับ slotOf ใน functions/fxw.js
const stunImmLeft = () => Math.max(0, (LS.get(lsKey("simm"), 0) || 0) - serverNow());   // กันมึนซ้ำ: 3 นาทีหลังโดนมึน
// ผู้ถูกโจมตี (ซอมบี้หรือมนุษย์) รับสถานะจากอาวุธของมนุษย์ที่โจมตีโดน (เรียกใน resolveAttack เมื่อ landed) — ทอยโอกาสที่นี่ แล้วเขียนลง u (rules: เขียนได้เมื่อ HP ลดในคำสั่งเดียวกัน)
function wfxHit(u, a) {
  const f = a.wfx; if (!f || !WFX_TYPES.includes(f.t) || state.players[a.from]?.faction !== "human") return "";
  const v = Number(f.v), m = Number(f.m), pr = Number(f.p); if (!(m >= 1 && m <= 5) || !(pr >= 1 && pr <= 100) || !v) return "";
  const pg = f.t === "poison" && (gearHas("chem_gloves") || gearHas("mut_fang3") || gearFxFlag("poisonHalf"));   // ถุงมือ/ต่อมพิษ: โอกาสติดพิษครึ่งเดียว (เหมือน monFx)
  if (Math.random() * 100 >= (pg ? pr * 0.5 : pr) || effActive(f.t) || (f.t === "poison" && poisonImmLeft() > 0) || (f.t === "stun" && stunImmLeft() > 0)) return "";
  u[`effects/${state.uid}/${f.t}`] = { bstart: serverTimestamp(), mins: f.t === "stun" ? 1 : m, v: f.t === "stun" ? 1 : v, tick: serverTimestamp() }; stat("fx");
  if (f.t === "stun") LS.set(lsKey("simm"), serverNow() + 60000 + 180000);
  return ` ⚠️ ติด${FX_TYPES[f.t].icon}${f.t === "poison" && v >= POISON_STRONG ? "พิษแรง" : FX_TYPES[f.t].name}`;
}
async function fxwAfterSearch() {   // มนุษย์ค้นหาเสร็จ → ให้เซิร์ฟเวอร์ทอยโอกาสเจออาวุธติดสถานะ (ไม่เรียกถ้า tune ปิด/ไม่ใช่มนุษย์)
  const p = state.profile; if (T("fxw_on", 0) !== 1 || p?.faction !== "human" || !(p.hp > 0) || state.zone === "safe" || state.zone === "casino") return;
  try { const r = await fxwCall({ a: "find" }); if (r?.got) { logLine(`${r.got.icon} ค้นเจออาวุธติดสถานะ: ${r.got.name}!`, "combat"); toast(`เจอ ${r.got.icon} ${r.got.name}`); } } catch { /* ข้าม — ค้นหาปกติไม่ควรล้มเพราะนี่ */ }
}
async function fxwCraft(k) {
  if (state.busy) return; state.busy = true;
  try { try { await forgeCall({ a: "craft", id: k }); } catch (e) { if (!/aborted/.test(e?.code || "")) throw e; await new Promise((r) => setTimeout(r, 800)); await forgeCall({ a: "craft", id: k }); } toast(`ประกอบ ${FXW[k].icon} ${FXW[k].name} แล้ว`); logLine(`🔧 ประกอบ ${FXW[k].icon} ${FXW[k].name} (${wfxLabel(FXW[k].fx)})`, "info"); }
  catch (e) { toast(String(e?.message || "").replace(/^.*?:\s*/, "") || errMsg(e)); }
  finally { state.busy = false; renderCraft(); }
}
// ---- /อาวุธติดสถานะ
async function attack(targetUid, targetName = "เป้าหมาย") {
  if (state.profile.hp <= 0) return;
  if (state.zone === "jail") return toast("⛓️ ในคุกห้ามต่อสู้");
  if (state.zone === "casino") return toast("ในบ่อนห้ามต่อสู้ — ยามจะลากคุณออกไป");
  if (state.zone === "safe" && !wallBroken()) return toast("Safe Zone ต่อสู้ไม่ได้ (กำแพงยังแข็งแรง)");
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
    const starvePen = p.faction === "zombie" ? 2 : 5;   // ซอมบี้เสียน้อยกว่า (ชดเชยด้วยการกัดฟื้น HP +2) — HP ลดได้เสมอตาม rules
    newHp = Math.max(1, p.hp - starvePen);   // ฝืนโจมตีตอนหิวไม่ทำให้ตายเอง
    selfUpdate[`users/${state.uid}/hp`] = newHp;
    toast(`คุณฝืนโจมตีขณะหิวโซ เสีย HP ${starvePen} หน่วย!`);
  }

  const w = equippedWeapon();
  const dm = effV("dice");
  const am = ambushMult();   // ซุ่มตะปบ (เลื้อยคลานขั้น 3+): ดาเมจ ×2.5/×4 และทอย +2 ครั้งเดียวต่อการเดินทาง
  const rb = (sty === "sharp" ? skd.power : 0) + (am > 1 ? AMB_ROLL : 0);   // โจมตีเฉียบ: ค่าทอย +2 (rules บวกเพดานให้เท่ากัน)
  const roll = Math.max(1, Math.min(6 + Math.max(0, dm) + rb, d6() + dm + rb));   // rules จำกัดเพดานตามค่า dice ที่ติดอยู่
  const wd0 = sty === "smash" ? Math.floor(myDmg(w) * skd.power) : myDmg(w), wd = am > 1 ? Math.floor(wd0 * am) : wd0;   // ฟาดหนัก: ×1.3 (floor ไม่ให้เกินเพดานใน rules)
  // คีย์ = uid ผู้โจมตี → 1 คนค้างการโจมตีใส่เป้าหมายเดียวกันได้ทีละครั้งเท่านั้น
  const attackData = {
    from: state.uid, fromName: p.username, roll, zone: state.zone, ts: serverTimestamp(),
    ...(w ? { wpn: w.it.id === "custom" ? "custom" : w.it.id } : {}),
    wdmg: wd,
    ...(am > 1 ? { amb: true } : {}),
    ...(evoT("h") >= 3 ? { bl: true } : {}),
    ...(w && p.faction === "human" && wfxOf(w.it) ? { wfx: wfxOf(w.it) } : {}),   // อาวุธติดสถานะ (มนุษย์ใช้ได้เท่านั้น — ได้ผลกับทั้งซอมบี้และมนุษย์)
    ...(skId ? { sk: skId, ...(skd.basic ? {} : { skt: skd.type, skn: skd.name, ski: skd.icon }) } : {})
  };
  if (skId) skillUseWrites(selfUpdate, skId);
  if (am > 1) state.evoAmbFor = state.profile.lastTravel;

  try {
    await update(ref(db), { [`attacks/${targetUid}/${state.uid}`]: attackData, ...selfUpdate });
    questBump("hit");

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
    if (left === 0) { text += ` — ${targetName} ล้มลง!`; try { bountyKillWrite(u, targetUid, p.username); } catch { /* ข้าม */ } }
  }
  if (p.faction === "zombie" && !dodged) {
    u[`bites/${state.uid}/${targetUid}`] = biteRec(state.players[targetUid]?.faction === "human" && !state.players[targetUid]?.infected); text += " 🦷";
    if (evoT("h") >= 3) u[`effects/${targetUid}/bleed`] = bleedRec();
    if (state.players[targetUid]?.faction === "human") { u[`users/${targetUid}/infected`] = serverTimestamp(); text += " 🦠"; }
  }

  const chatRef = push(ref(db, "chats/" + state.zone));
  u[`chats/${state.zone}/${chatRef.key}`] = { uid: state.uid, name: p.username, faction: p.faction, text, type: "combat", ts: serverTimestamp() };

  await update(ref(db), u);
  trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});
  if (!dodged && left === 0 && crimActive(targetUid) && !crimMe()) jailCapture("killer", targetUid);   // ⛓️ จับคนส้ม
  if (!dodged && left === 0) bty2Claim("killer", targetUid);   // 💰 ค่าหัวใหม่ (เซิร์ฟเวอร์ตรวจและจ่ายเอง)
  if (!dodged && left === 0 && state.players[targetUid]?.faction === p.faction) crimReport("attacker", targetUid);   // 🟠 ฆ่าฝ่ายเดียวกัน (เซิร์ฟเวอร์ตรวจเงื่อนไขเอง)
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
  if (landed) dmg = evoCutDmg(dmg);   // ซากหนาขั้น 2
  if (landed) dmg = gearCut(dmg);     // เกราะ / หนังกลายพันธุ์
  const skTxt = a.sk ? (SKILLS[a.sk] ? ` (${SKILLS[a.sk].icon}${SKILLS[a.sk].name})` : a.skn ? ` (${a.ski || ""}${a.skn})` : "") : "";

  const newHp = Math.max(0, p.hp - dmg);
  try { const af = state.players[key]?.faction; if (af === "zombie" || af === "human") { const sf = af === "zombie" ? "z" : "h"; achBump("patk" + sf); if (landed) { achBump("phit" + sf); achBump("pdmg" + sf, dmg); } } if (landed && newHp === 0) achBump("pdie"); if (p.faction === "zombie") { const L = pvpLineKey(); achBump("qa" + L); if (landed) { achBump("qh" + L); achBump("qd" + L, dmg); if (newHp === 0) achBump("qx" + L); } } } catch { /* สถิติพลาดไม่กระทบเกม */ }   // 📉 สถิติ PvP (แดชบอร์ดเจ้าของ): ผู้ถูกโจมตีเป็นคนบันทึก แยกตามฝ่ายผู้โจมตี
  let text = `⚔ ${a.fromName}${skTxt} ทอย ${a.roll} vs ${p.username} ทอยป้องกันได้ ${defRoll} → `;
  
  if (landed) {
    text += `${a.fromName} โจมตีโดน! −${dmg} HP${braced ? " (🧱 ท่าตั้งรับลดดาเมจ)" : ""}`;
    if (state.players[key]?.faction === "zombie") {
      u[`bites/${key}/${state.uid}`] = biteRec(p.faction === "human" && !p.infected); text += " 🦷";
      if (a.bl && !(effActive("bleed") && effV("bleed") > 2)) { u[`effects/${state.uid}/bleed`] = bleedRec(); text += " 🩸"; }
      if (p.faction === "human") { u[`users/${state.uid}/infected`] = serverTimestamp(); text += " 🦠"; }
    }
    try { text += wfxHit(u, a); } catch { /* ข้าม */ }   // อาวุธติดสถานะของมนุษย์ที่โจมตีซอมบี้
    u[`users/${state.uid}/hp`] = newHp;
    if (newHp === 0) { text += ` — ${p.username} ล้มลง!`; try { bountyKillWrite(u, state.uid, a.fromName); } catch { /* ข้าม */ } }
  } else if (dodged) {
    text += `${p.username} หลบได้ในจังหวะสุดท้าย! 💨`; achBump("pdodge");
  } else {
    text += a.roll === defRoll ? "เสมอ ไม่มีใครโดน" : `${p.username} ป้องกันได้`; achBump("pdef");
  }

  const chatRef = push(ref(db, "chats/" + state.zone));
  // แก้ไขบักตรงนี้: ใช้ uid ของคนโจมตีเหมือนเดิมแทนการใช้คำว่า "system"
  u[`chats/${state.zone}/${chatRef.key}`] = { uid: state.uid, name: p.username, faction: p.faction, text, type: "combat", ts: serverTimestamp() };

  let jRes = null; if (landed && newHp === 0 && crimMe() && jailOn()) state.jailWait = new Promise((r) => { jRes = r; });   // ให้ processDeath รอผลการจับก่อนคิดโทษตอนล้ม
  await update(ref(db), u);
  trimList("chats/" + state.zone, CHAT_LIMIT).catch(() => {});
  if (jRes) { jailCapture("victim", key).finally(jRes); }   // ⛓️ เราเป็นส้มและถูกล้ม → ให้เซิร์ฟเวอร์ตัดสินว่าถูกจับไหม
  if (landed && newHp === 0) bty2Claim("victim", key);   // 💰 ผู้ถูกฆ่าเรียกให้ ผลจ่ายให้ผู้ฆ่า
  if (landed && newHp === 0 && state.players[key]?.faction === p.faction) crimReport("victim", key);   // 🟠 ถูกฝ่ายเดียวกันฆ่า (เซิร์ฟเวอร์ตรวจเงื่อนไขเอง)
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

// ---- ⚔️ แอดมิน: พรีเซ็ต + ช่องสถานะพ่วงของอาวุธ Custom (P = "adm-" เสกไอเทม / "adm-q-" รางวัลภารกิจ)
function buildWfxAdmin(P) {
  const box = $(P + "custom-fields"); if (!box || $(P + "wfx-t")) return;
  const num = (id, ph, min, max) => { const i = document.createElement("input"); i.type = "number"; i.min = min; i.max = max; i.id = id; i.placeholder = ph; return i; };
  const preset = document.createElement("select"); preset.id = P + "wfx-preset"; preset.append(new Option("— พรีเซ็ตอาวุธติดสถานะ (มนุษย์ใช้ได้เท่านั้น) —", ""));
  Object.entries(FXW).forEach(([k, d]) => preset.append(new Option(`${d.icon} ${d.name} • ดาเมจ ${d.dmg} • ทน ${d.dur} • ${wfxLabel(d.fx)}${d.need ? "" : " • ชั้นสูง"}`, k)));
  const icon = document.createElement("input"); icon.id = P + "custom-icon"; icon.placeholder = "ไอคอน (อีโมจิ — ไม่ใส่ก็ได้)"; icon.maxLength = 4;
  const sel = document.createElement("select"); sel.id = P + "wfx-t"; sel.append(new Option("ไม่พ่วงสถานะ", "")); WFX_TYPES.forEach((t) => sel.append(new Option(`${FX_TYPES[t].icon} ${FX_TYPES[t].name}`, t)));
  const v = num(P + "wfx-v", "ความแรง (เลือดไหล/พิษ 1–3 • ทอย 1–2 = ลดค่าทอย)", 1, 3), m = num(P + "wfx-m", "ระยะเวลา นาที (1–5 • มึนงง = 1 นาที)", 1, 5), pr = num(P + "wfx-p", "โอกาสติด % ต่อการโจมตีที่โดน (1–100)", 1, 100);
  preset.addEventListener("change", () => { const d = FXW[preset.value]; if (!d) return; $(P + "custom-name").value = d.name; $(P + "custom-dmg").value = d.dmg; $(P + "custom-dur").value = d.dur; icon.value = d.icon; sel.value = d.fx.t; v.value = Math.abs(d.fx.v); m.value = d.fx.m; pr.value = d.fx.p; });
  box.append(preset, icon, sel, v, m, pr, mk("p", "muted", "อาวุธติดสถานะ: มนุษย์ใช้ได้เท่านั้น ได้ผลกับทั้งซอมบี้และมนุษย์ที่ถูกโจมตี (ผู้ถูกโจมตีทอยโอกาสเอง) • เลือกพรีเซ็ตเพื่อกรอกช่องด้านบนให้อัตโนมัติ แล้วแก้เองได้"));
}
function wfxAdminRead(P) {
  const out = {}, icon = [...(($(P + "custom-icon") || {}).value || "").trim()].slice(0, 2).join(""), t = ($(P + "wfx-t") || {}).value || "";
  if (icon) out.icon = icon;
  if (WFX_TYPES.includes(t)) {
    const mag = Math.max(1, Math.min(t === "dice" ? 2 : 3, parseInt($(P + "wfx-v").value, 10) || 1)), mins = t === "stun" ? 1 : Math.max(1, Math.min(5, parseInt($(P + "wfx-m").value, 10) || 3)), pr = Math.max(1, Math.min(100, parseInt($(P + "wfx-p").value, 10) || 30));
    out.fx = { t, v: t === "dice" ? -mag : t === "stun" ? 1 : mag, m: mins, p: pr };
  }
  return out;
}
function buildAdmin() {
  buildAdminWB();
  fillSelect($("adm-ann-zone"), [["all", "ทุกโซน"], ...Object.entries(ZONES).map(([id, z]) => [id, "เฉพาะ " + z.name])]);
  fillSelect($("adm-target-zone"), Object.entries(ZONES).map(([id, z]) => [id, z.name]));
  fillSelect($("adm-clear-zone"), Object.entries(ZONES).map(([id, z]) => [id, z.name]));
  fillSelect($("adm-ev-zone"), Object.entries(ZONES).filter(([id]) => id !== "safe").map(([id, z]) => [id, z.name]));
  fillSelect($("adm-ev-type"), Object.entries(EVENT_TYPES).map(([id, t]) => [id, `${t.icon} ${t.name}`]));
  const itemOpts = Object.entries(ITEMS).map(([id, i]) => [id, `${i.icon} ${i.name}`]);
  itemOpts.push(...Object.entries(FXW).map(([k, d]) => [k, `⚔️ ${d.icon} ${d.name} • ดาเมจ ${d.dmg} • ทน ${d.dur} • ${wfxLabel(d.fx)} (มนุษย์ใช้ได้เท่านั้น)`])); itemOpts.push(["custom", "✨ สร้างอาวุธเอง (Custom)"], ["custom_gear", "🛡️ สร้างเกราะ/อุปกรณ์เอง (Custom)"], ["custom_food", "🍽️ สร้างไอเทมเอง (อาหาร/น้ำ/สเตตัส/พิเศษ)"], ["skill", "📖 สกิลเอง (custom — ได้เป็นสกิล ไม่ใช่ไอเทม)"]);
  fillSelect($("adm-item"), itemOpts);
  fillSelect($("adm-q-item"), itemOpts);
  buildStatInputs("adm-"); buildStatInputs("adm-q-"); buildStatEditor(); buildGiveUi(); buildWfxAdmin("adm-"); buildWfxAdmin("adm-q-");
  buildSkillBox("adm-skill-box", "adm-spk-"); buildSkillBox("adm-q-skill-box", "adm-q-spk-");
  fillSelect($("adm-q-need"), [["", "ไม่ต้องส่งของ (ทำตามที่บรรยาย)"], ...NEED_ITEMS.map((id) => [id, `ต้องส่ง ${ITEMS[id].icon} ${ITEMS[id].name}`])]);
}


// ---- 🛠️ Admin Console: แท็บหมวดหมู่ — รวมทุกอย่างในปุ่ม Admin ปุ่มเดียว (เดิมเศรษฐกิจ/ปรับค่าเกมของเจ้าของอยู่แยกในแท็บ 📈 🎛️ ของหน้าสรุป)
const ADM_CATS = [["players", "👥 ผู้เล่น"], ["comms", "📣 สื่อสาร"], ["items", "🎁 ไอเทม"], ["world", "🌍 โลก"], ["econ", "📈 เศรษฐกิจ", true], ["tune", "🎛️ ปรับค่า", true]];   // true = เฉพาะเจ้าของ
const ADM_MAP = [[/แดชบอร์ดผู้เล่น|สเตตัส|บัฟ|ติดเชื้อ|รูปโปรไฟล์/, "players"], [/ประกาศ|แชท/, "comms"], [/ไอเทม|สกิล|ภารกิจ/, "items"], [/เหตุการณ์|บอสโลก|World Boss/, "world"]];
const admCatOf = (sec) => { const t = sec.querySelector("h3")?.textContent || ""; for (const [rx, c] of ADM_MAP) if (rx.test(t)) return c; return "players"; };
function admTuneRender(pane) {
  const groups = []; tuneDefs().forEach((r) => { if (!groups.includes(r[5])) groups.push(r[5]); });
  const sel = document.createElement("select"); sel.style.cssText = "width:100%;margin-bottom:8px";
  [["", "ทุกหมวด"], ["__force", "⚡ บังคับเหตุการณ์/สภาพอากาศ"], ...groups.map((g) => [g, g])].forEach(([v, l]) => sel.append(new Option(l, v)));
  sel.value = state.admTuneGrp || ""; sel.addEventListener("change", () => { state.admTuneGrp = sel.value; admTab("tune"); });
  pane.append(sel); tuneRender(pane, state.admTuneGrp || "");
}
function admTab(t) {
  const m = $("admin-modal"); if (!m) return; const owner = state.profile?.role === "owner";
  if (!ADM_CATS.some(([k, , o]) => k === t && (!o || owner))) t = "players";
  state.admTab = t; LS.set("zc_admtab", t);
  m.querySelectorAll("#adm-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === t));
  m.querySelectorAll(".adm-section[data-cat]").forEach((sec) => sec.classList.toggle("hidden", sec.dataset.cat !== t));
  const pane = $("adm-pane"); if (!pane) return; const wide = t === "econ" || t === "tune"; pane.classList.toggle("hidden", !wide); pane.textContent = "";
  if (t === "econ") econRender(pane); else if (t === "tune") admTuneRender(pane);
}
function admTabsInit() {
  const m = $("admin-modal"); if (!m) return; const box = m.querySelector(".modal-box"), owner = state.profile?.role === "owner";
  m.querySelectorAll(".adm-section").forEach((sec) => { if (sec.id !== "adm-pane") sec.dataset.cat = admCatOf(sec); });   // รวมส่วนที่ถูกเพิ่มทีหลัง (เช่น รูปโปรไฟล์ที่ถูกรายงาน)
  if (!$("adm-tabs")) {
    const tabs = mk("div", "hub-tabs"); tabs.id = "adm-tabs"; tabs.style.cssText = "position:sticky;top:-16px;z-index:3;background:var(--panel);padding:8px 0;margin:0 -4px";
    ADM_CATS.filter(([, , o]) => !o || owner).forEach(([k, l]) => { const b = btn(l, () => admTab(k), "btn ghost mini"); b.dataset.t = k; tabs.append(b); });
    box.querySelector(".modal-head").after(tabs);
    const pane = mk("div", "adm-section hidden"); pane.id = "adm-pane"; box.append(pane);
  }
  admTab(state.admTab || LS.get("zc_admtab", "players"));
}
// ---- /Admin Console แท็บ
$("btn-admin").addEventListener("click", () => {
  if (!isStaff()) return;
  try { profGmSection(); } catch { /* ข้าม */ }
  $("adm-clear-zone").value = state.zone; watchMutes();
  admTabsInit(); $("admin-modal").classList.remove("hidden"); loadDash();
});
$("adm-close").addEventListener("click", () => $("admin-modal").classList.add("hidden"));
$("adm-mode").addEventListener("change", (e) => {
  $("adm-target-id").classList.toggle("hidden", e.target.value !== "player");
  $("adm-target-zone").classList.toggle("hidden", e.target.value !== "zone");
});
["adm-", "adm-q-"].forEach((P) => $(P + "item").addEventListener("change", (e) => {
  $(P + "custom-fields").classList.toggle("hidden", e.target.value !== "custom");
  $(P + "food-fields").classList.toggle("hidden", e.target.value !== "custom_food");
  $(P + "gear-fields").classList.toggle("hidden", e.target.value !== "custom_gear");
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
  let itemId = $(P + "item").value;
  const fxp = FXW[itemId] ? itemId : null; if (fxp) itemId = "custom";   // ⚔️ พรีเซ็ตอาวุธติดสถานะในรายการไอเทมโดยตรง = อาวุธ custom ที่มี fx
  // สกิล: คืน skill (null ถ้ากรอกไม่ผ่าน — readSkillForm toast บอกเหตุผลแล้ว) ผู้เรียกต้องเช็กก่อนใช้
  if (itemId === "skill") return { itemId, skill: readSkillForm(P + "spk-") };
  const qty = Math.max(1, Math.min(99, parseInt($(P + "qty").value, 10) || 1));
  const isFood = itemId === "custom_food", isGear = itemId === "custom_gear";
  let customData = null, def = ITEMS[itemId];

  if (itemId === "custom" && fxp) {
    const d = FXW[fxp]; customData = { name: d.name, dmg: d.dmg, dur: d.dur, icon: d.icon, fx: { ...d.fx } };
    def = { name: d.name, type: "weapon", maxDur: d.dur };
  } else if (itemId === "custom") {
    const cName = $(P + "custom-name").value.trim() || "อาวุธปริศนา";
    const cDmg = parseInt($(P + "custom-dmg").value, 10) || 10;
    const cDur = parseInt($(P + "custom-dur").value, 10) || 10;
    customData = { name: cName, dmg: cDmg, dur: cDur, ...wfxAdminRead(P) };
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
  if (isGear) {
    customData = { name: $(P + "gear-name").value.trim().slice(0, 40) || "เกราะปริศนา", gslot: $(P + "gear-slot").value === "acc" ? "acc" : "arm", red: Math.max(1, Math.min(GEAR_CUSTOM_MAX, parseInt($(P + "gear-red").value, 10) || 10)), icon: [...$(P + "gear-icon").value.trim()].slice(0, 2).join("") };
    def = { name: customData.name, type: "gear" };
  }
  const single = def.type === "weapon" || isFood || isGear;   // ไอเทมที่วางบนพื้นทีละชิ้น
  return { itemId, qty, isFood, isGear, customData, def, single };
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
  const { itemId, qty, isFood, isGear, customData, def, single } = R;

  try {
    if ($("adm-mode").value === "zone") {
      const z = $("adm-target-zone").value;
      const n = single ? Math.min(qty, 10) : 1;
      for (let i = 0; i < n; i++) {
        await push(ref(db, "zoneItems/" + z), {
          id: itemId, qty: single ? 1 : qty,
          ...(def.type === "weapon" ? { dur: def.maxDur } : {}),
          ...(itemId === "custom" ? { name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon", ...(customData.icon ? { icon: customData.icon } : {}), ...(customData.fx ? { fx: customData.fx } : {}) } : {}),
          ...(isFood ? foodFields(customData) : {}),
          ...(isGear ? gearFields(customData) : {})
        });
      }
      toast(`วาง ${def.name} ไว้ใน ${ZONES[z].name} แล้ว`);
    } else {
      const target = $("adm-target-id").value.trim();
      if (!target) return toast("ใส่ Player ID ก่อน");
      const t = await get(ref(db, "users/" + target));
      if (!t.exists()) return toast("ไม่พบ Player ID นี้");

      if (isGear) {
        for (let i = 0; i < Math.min(qty, 10); i++) {
          const k = push(ref(db, `inventory/${target}`)).key;
          await set(ref(db, `inventory/${target}/${k}`), { id: "custom_gear", qty: 1, ...gearFields(customData) });
        }
      } else if (isFood) {
        const k = push(ref(db, `inventory/${target}`)).key;
        await set(ref(db, `inventory/${target}/${k}`), { id: "custom_food", qty, ...foodFields(customData) });
      } else if (def.type === "weapon") {
        for (let i = 0; i < Math.min(qty, 10); i++) {
          const k = push(ref(db, `inventory/${target}`)).key;
          await update(ref(db), {
            [`inventory/${target}/${k}`]: {
              id: itemId, qty: 1, dur: def.maxDur,
              ...(customData ? { name: customData.name, dmg: customData.dmg, maxDur: customData.dur, type: "weapon", ...(customData.icon ? { icon: customData.icon } : {}), ...(customData.fx ? { fx: customData.fx } : {}) } : {})
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
// ให้บัฟ/ดีบัฟชั่วคราว + สถานะพิเศษกับผู้เล่นโดยตรง (rules เดิมให้ GM/Owner เขียน buffs/effects ได้อยู่แล้ว — ช่วงค่าอิงตาม .validate เดิม)
const BF_MIN = { str: -5, hp: -2, st: -3, regen: -1, agi: -5, tough: -5 };
function buildGiveUi() {
  const box = $("adm-bf-box"), sel = $("adm-gfx-type"); if (!box || !sel) return;
  box.innerHTML = ""; sel.innerHTML = "";
  STAT_KEYS.forEach((k) => {
    const row = mk("label", "", STAT_LABEL[k]); row.style.cssText = "display:grid;gap:4px;font-weight:400";
    const i = document.createElement("input"); i.type = "number"; i.id = "adm-bf-" + k; i.placeholder = `${BF_MIN[k]} ถึง 99`;
    row.append(i); box.append(row);
  });
  FX_KEYS.forEach((t) => { const o = document.createElement("option"); o.value = t; o.textContent = `${FX_TYPES[t].icon} ${FX_TYPES[t].name}`; sel.append(o); });
}
async function giveTarget() {
  const pid = $("adm-gv-id").value.trim(); if (!pid) { toast("ใส่ Player ID ก่อน"); return null; }
  const t = await get(ref(db, "users/" + pid));
  if (!t.exists()) { toast("ไม่พบ Player ID นี้"); return null; }
  if (state.profile?.role !== "owner" && (t.val().role || "player") !== "player") { toast("GM ให้ได้เฉพาะผู้เล่นทั่วไป"); return null; }
  return { pid, name: t.val().username };
}
$("adm-bf-give")?.addEventListener("click", async () => {
  try {
    const tg = await giveTarget(); if (!tg) return;
    const mins = Number($("adm-bf-min").value);
    if (!Number.isInteger(mins) || mins < 1 || mins > BUFF_MAX_MIN) return toast(`นาทีต้องเป็นจำนวนเต็ม 1–${BUFF_MAX_MIN}`);
    const b = { bstart: serverTimestamp(), mins }; let any = false;
    for (const k of STAT_KEYS) {
      const raw = $("adm-bf-" + k).value, n = raw === "" ? 0 : Number(raw);
      if (!Number.isInteger(n) || n < BF_MIN[k] || n > 99) return toast(`${STAT_LABEL[k]} ต้องเป็นจำนวนเต็ม ${BF_MIN[k]} ถึง 99`);
      b[k] = n; if (n) any = true;
    }
    if (!any) return toast("ใส่ค่าอย่างน้อย 1 ช่อง");
    await set(ref(db, "buffs/" + tg.pid), b);
    toast(`ให้บัฟ/ดีบัฟแก่ ${tg.name} นาน ${mins} นาทีแล้ว`);
  } catch (e) { toast(errMsg(e)); }
});
$("adm-gfx-give")?.addEventListener("click", async () => {
  try {
    const tg = await giveTarget(); if (!tg) return;
    const type = $("adm-gfx-type").value, v = Number($("adm-gfx-v").value), mins = Number($("adm-gfx-min").value);
    if (!Number.isInteger(mins) || mins < 1 || mins > FX_MAX_MIN) return toast(`นาทีต้องเป็นจำนวนเต็ม 1–${FX_MAX_MIN}`);
    const ok = type === "dice" ? Number.isInteger(v) && v >= -5 && v <= 5 && v !== 0 : type === "stun" ? v === 1 : Number.isInteger(v) && v >= 1 && v <= 20;
    if (!ok) return toast(type === "dice" ? "ทอยเต๋า: v ต้องเป็น −5..5 (ไม่ใช่ 0)" : type === "stun" ? "มึนงง: v ต้องเป็น 1" : "v ต้องเป็นจำนวนเต็ม 1–20");
    await set(ref(db, `effects/${tg.pid}/${type}`), { bstart: serverTimestamp(), mins, v, tick: serverTimestamp() });
    toast(`ให้${FX_TYPES[type].name}แก่ ${tg.name} นาน ${mins} นาทีแล้ว`);
  } catch (e) { toast(errMsg(e)); }
});
// แดชบอร์ดผู้เล่น (Staff): รวมรายชื่อจาก stats (ทุกคนที่แจกแต้มแล้ว) + zonePlayers (ผู้ที่ออนไลน์อยู่) แล้วอ่าน users/effects/buffs ทีละคน (rules ให้ staff อ่านได้) — อ่านอย่างเดียว ไม่เขียนอะไร
const DASH_ONLINE_MS = 90000;
const dashAgo = (ms) => { const m = Math.floor(ms / 60000); return m < 1 ? "เมื่อครู่" : m < 60 ? `${m} นาทีที่แล้ว` : m < 1440 ? `${Math.floor(m / 60)} ชม.ที่แล้ว` : `${Math.floor(m / 1440)} วันที่แล้ว`; };
function buildDashFilter() {
  const sel = $("adm-dash-filter"); if (!sel || sel.options.length) return;
  [["all", "ทั้งหมด"], ["online", "🟢 ออนไลน์"], ["offline", "⚪ ออฟไลน์"], ["inf", "🦠 ติดเชื้อ"], ["fx", "⚠️ มีสถานะ/บัฟ"], ["ban", "🚫 ถูกแบน"], ...Object.keys(ZONES).map((z) => ["z:" + z, "📍 " + ZONES[z].name])]
    .forEach(([v, t]) => { const o = document.createElement("option"); o.value = v; o.textContent = t; sel.append(o); });
}
async function loadDash() {
  const list = $("adm-dash-list"), sumEl = $("adm-dash-sum"); if (!list || !isStaff() || state.dashBusy) return;
  state.dashBusy = true; buildDashFilter();
  try {
    const uids = new Set(Object.keys((await get(ref(db, "stats"))).val() || {}));
    const zp = await Promise.all(Object.keys(ZONES).map((z) => get(ref(db, "zonePlayers/" + z)).catch(() => null)));
    zp.forEach((s) => s?.forEach((c) => { uids.add(c.key); }));
    const now = serverNow();
    const rows = (await Promise.all([...uids].map(async (uid) => {
      const [u, e, b] = await Promise.all([get(ref(db, "users/" + uid)), get(ref(db, "effects/" + uid)), get(ref(db, "buffs/" + uid))]);
      const v = u.val(); if (!v) return null;
      const fx = Object.entries(e.val() || {}).filter(([, x]) => x && x.bstart + x.mins * 60000 > now).map(([t, x]) => (FX_TYPES[t]?.icon || "") + (t === "poison" && x.v >= POISON_STRONG ? "พิษแรง" : FX_TYPES[t]?.name || t));
      const bv = b.val(), buff = bv && bv.bstart + bv.mins * 60000 > now ? STAT_KEYS.filter((k) => bv[k]).map((k) => `${STAT_LABEL[k].split(" ")[0]}${sgn(bv[k])}`).join(" ") : "";
      return { uid, name: v.username || "?", faction: v.faction, role: v.role || "player", banned: v.banned === true, zone: v.zone, hp: v.hp, inf: !!v.infected, seen: typeof v.seenAt === "number" ? v.seenAt : 0, fx, buff };
    }))).filter(Boolean);
    rows.forEach((r) => { r.on = r.seen && now - r.seen < DASH_ONLINE_MS; });
    rows.sort((a, c) => (c.on - a.on) || (c.seen - a.seen));
    state.dashRows = rows; state.dashAt = now; renderDash();
  } catch (e) { sumEl.textContent = "โหลดไม่สำเร็จ: " + errMsg(e); }
  finally { state.dashBusy = false; }
}
function renderDash() {
  const list = $("adm-dash-list"), sumEl = $("adm-dash-sum"), rows = state.dashRows || []; if (!list) return;
  const now = serverNow(), f = $("adm-dash-filter").value || "all";
  const on = rows.filter((r) => r.on), byZone = {};
  on.forEach((r) => { byZone[r.zone] = (byZone[r.zone] || 0) + 1; });
  sumEl.innerHTML = "";
  const chip = (t) => { const c = mk("span", "", t); c.style.cssText = "padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.08)"; sumEl.append(c); };
  chip(`🟢 ออนไลน์ ${on.length}/${rows.length}`);
  Object.keys(ZONES).filter((z) => byZone[z]).forEach((z) => chip(`${ZONES[z].name} ${byZone[z]}`));
  const bosses = Object.entries(state.wb || {}).filter(([, b]) => wbAlive(b));
  if (bosses.length) chip("👹 บอสโลก: " + bosses.map(([z, b]) => `${b.name}@${ZONES[z]?.name || z}`).join(", "));
  const ok = (r) => f === "all" || (f === "online" ? r.on : f === "offline" ? !r.on : f === "inf" ? r.inf : f === "fx" ? r.fx.length || r.buff : f === "ban" ? r.banned : f.startsWith("z:") ? r.zone === f.slice(2) : true);
  list.innerHTML = "";
  rows.filter(ok).forEach((r) => {
    const row = mk("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05)";
    const info = mk("div"); info.style.cssText = "min-width:0;display:grid;gap:2px";
    const head = mk("div", "", `${r.on ? "🟢" : "⚪"} ${FACTION[r.faction]?.icon || ""} ${r.name}${r.role !== "player" ? ` [${r.role}]` : ""}${r.banned ? " 🚫" : ""}${r.inf ? " 🦠" : ""}`); head.style.fontWeight = "600";
    const place = mk("div", "muted", `📍 ${ZONES[r.zone]?.name || r.zone || "—"} • ❤️ ${r.hp ?? "?"}${r.hp === 0 ? " 💀" : ""} • ${r.on ? "ออนไลน์" : r.seen ? "เห็นล่าสุด " + dashAgo(now - r.seen) : "ไม่เคยออนไลน์"}`);
    info.append(head, place);
    if (r.fx.length || r.buff) info.append(mk("div", "muted", `${r.fx.length ? "⚠️ " + r.fx.join(" ") : ""}${r.fx.length && r.buff ? " • " : ""}${r.buff ? "✨ " + r.buff : ""}`));
    row.append(info, btn("เลือก", () => {
      ["adm-mute-id", "adm-pid", "adm-target-id", "adm-inf-id", "adm-se-id", "adm-gv-id", "adm-sk-id"].forEach((id) => { const el = $(id); if (el) el.value = r.uid; });
      watchMutes(); toast(`เลือก ${r.name} แล้ว — เลื่อนลงไปใช้เครื่องมือด้านล่างได้`);
    }, "btn ghost mini"));
    list.append(row);
  });
  if (!list.children.length) list.append(mk("p", "muted", "ไม่มีผู้เล่นตรงตัวกรอง"));
  $("adm-dash-note").textContent = `อัปเดต ${new Date(now).toLocaleTimeString("th-TH")} • รีเฟรชเองทุก 30 วินาทีขณะเปิดหน้านี้ • ออนไลน์ = ส่งสัญญาณภายใน 90 วินาที • โซนคือโซนล่าสุดที่บันทึกไว้ (ผู้เล่นที่ยังไม่เคยแจกแต้มสเตตัสและออฟไลน์จะไม่อยู่ในรายการ)`;
}
$("adm-dash-refresh")?.addEventListener("click", loadDash);
$("adm-dash-filter")?.addEventListener("change", renderDash);
setInterval(() => { if (isStaff() && !$("admin-modal").classList.contains("hidden")) loadDash(); }, 30000);
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
    b.title = `อันตราย ${d.level}/10 • เจอซอมบี้ ${d.chance}%` + (d.ev ? ` • ${d.ev.title} (${d.ev.daily ? "ถึงเที่ยงคืน" : `อีก ~${minsLeft(d.ev)} นาที`})` : "");
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
  if (r.id === "skill") {
    u[`skills/${uid}/q_${id}`] = skillFields(r);
  } else if (AUTO_STACK.includes(r.id)) {
    // ดึงค่าล่าสุดจากฐานข้อมูลโดยตรง ป้องกัน Error จาก State ในเครื่องที่ไม่ตรงกัน
    const curSnap = await get(ref(db, `inventory/${uid}/${r.id}/qty`));
    u[`inventory/${uid}/${r.id}`] = { id: r.id, qty: Math.min(99, (curSnap.val() || 0) + r.qty) };
  } else {
    // บังคับแนบค่า dur สำหรับอาวุธ เพื่อให้ผ่านด่านตรวจของ Rules
    const def = ITEMS[r.id];
    if (def && def.type === "weapon") {
      u[`inventory/${uid}/q_${id}`] = { id: r.id, qty: 1, dur: r.dur || def.maxDur };
    } else {
      u[`inventory/${uid}/q_${id}`] = { ...r };
    }
  }
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
  if (spec.id === "custom" || spec.id === "custom_food" || spec.id === "custom_gear" || ITEMS[spec.id]?.type === "weapon") {
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
  const { itemId, qty, isFood, isGear, customData, def } = R;
  let reward;
  if (itemId === "skill") reward = { id: "skill", qty: 1, ...R.skill };
  else if (itemId === "custom") reward = { id: "custom", qty: 1, dur: customData.dur, maxDur: customData.dur, name: customData.name, dmg: customData.dmg, type: "weapon", ...(customData.icon ? { icon: customData.icon } : {}), ...(customData.fx ? { fx: customData.fx } : {}) };
  else if (isFood) return toast("รางวัลอาหารสร้างเองไม่รองรับแล้ว ให้มอบด้วยมือ");
  else if (isGear) reward = { id: "custom_gear", qty: 1, ...gearFields(customData) };
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
    ["adm-q-custom-name", "adm-q-food-name", "adm-q-gear-name"].forEach((i) => { $(i).value = ""; });
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
  if (!p || p.banned || !p.infected || p.faction !== "human" || !(p.hp > 0) || state.dying || state.deathTimer || state.busy || state.infBusy) return;   // ล้มลง (HP 0) แล้วเชื้อไม่ลุกลาม/ไม่เด้งข้อความซ้ำ
  const ticks = Math.min(INFECT_MAX_TICKS, Math.floor((serverNow() - Math.max(p.infected, p.infectTs || 0)) / INFECT_TICK));
  if (ticks < 1) return;
  state.infBusy = true;
  try {
    const away = ticks > 2;
    let left = p.hp - fxCutDmg(ticks * INFECT_DMG);
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
// Owner: ชุบผู้เล่นที่ล้มอยู่ (HP 0) — ฟื้นที่ Safe Zone 50 HP โดยไม่หักของ ล้างเชื้อ/สถานะ/ค่าหัว (rules ให้ Owner เขียน users/{uid} ได้อยู่แล้ว GM ทำไม่ได้)
async function adminRevive() {
  const id = $("adm-inf-id").value.trim(); if (!id) return toast("ใส่ Player ID ก่อน");
  if (state.profile?.role !== "owner") return toast("ชุบได้เฉพาะ Owner");
  try {
    const t = await get(ref(db, "users/" + id));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    const v = t.val();
    if (v.hp > 0) return toast(`${v.username} ยังไม่ล้ม (HP ${v.hp})`);
    if (!confirm(`ชุบ ${v.username}?\nฟื้นที่ Safe Zone ด้วย 50 HP ไม่หักของ ล้างเชื้อและสถานะ`)) return;
    await update(ref(db), { [`users/${id}/hp`]: 50, [`users/${id}/zone`]: "safe", [`users/${id}/lastDeath`]: null, [`users/${id}/infected`]: null, [`users/${id}/infectTs`]: null, [`effects/${id}`]: null });
    toast(`ชุบ ${v.username} แล้ว`);
  } catch (e) { toast(errMsg(e)); }
}
{ const b = document.createElement("button"); b.id = "adm-revive"; b.className = "btn primary"; b.textContent = "💉 ชุบ (Owner)"; $("adm-inf-off").after(b); b.addEventListener("click", adminRevive); }

/* =========================================================
   14) วิวัฒนาการซอมบี้ (DNA) — แปะต่อท้าย script.js
   เก็บที่ evo/{uid} = { dna, sp, line, h, g, s, day, gain, fd, rs }
   h/g/s = ขั้นสายตะกละ/ซากหนา/เลื้อยคลาน (0-4) • sp = DNA ที่ใช้ไปสะสม • day/gain = เพดานรายวัน (UTC)
   fd = วันที่ใช้ "ไม่ยอมตาย" ไปแล้ว • rs = เวลารีเซ็ตล่าสุด — ทุกค่าต้องตรงกับ rules (patch_rules_evo.js)
   ใช้ function declaration ทั้งหมด (hoist) เพราะ statOf ที่อยู่ด้านบนเรียก evoBonus
   ========================================================= */
const EVO_STEP = [3, 6, 10, 15];                     // ราคาแต้มต่อขั้น (สะสม 3/9/19/34 — rules ตรวจ sp ตามนี้)
const EVO_DAY = 86400000, EVO_DAILY_CAP = 25, EVO_CLAIM_MAX = 10, EVO_RESET_CD = 86400000, EVO_REFUND = 0.7;
const EVO_LINES = {
  hunter: { key: "h", icon: "🩸", name: "สายตะกละ", title: "อสูรตะกละ", tag: "วิ่งไว กัดแรง หิวโหย",
    tiers: [["เขี้ยวคม", "พละกำลัง +1"], ["กระหายเลือด", "กัดโดนฟื้น HP 3"], ["แผลเน่า", "เหยื่อที่โดนกัดเลือดไหล (2 HP/รอบ นาน 3 นาที)"], ["อสูรตะกละ", "พละกำลัง +1 อีก และดูดเลือดเป็น 5 HP (มิวเตชันขั้น 8 = 8 HP)"]],
    cost: "ราคา: หิวเร็วขึ้น 15/30/40/50% ตามขั้น และตั้งแต่ขั้น 2 อาหารที่ได้จากการกัด/เนื้อเน่าเหลือ 75%" },
  giant: { key: "g", icon: "🗿", name: "สายซากหนา", title: "ยักษ์ซากอมตะ", tag: "อึดถึก ตายยาก ช้า",
    tiers: [["หนังด้าน", "HP +30 และความคงทน +2"], ["ไขมันเกราะ", "ดาเมจที่ได้รับ −15%"], ["ไม่ยอมตาย", "ตายครั้งแรกของวัน DNA ไม่หาย"], ["ยักษ์ซากอมตะ", "HP +20 อีก (รวม +50)"]],
    cost: "ราคา: ว่องไวลด 0/1/2/2 (หลบ −0/3/6/6%) และตั้งแต่ขั้น 3 พลังงานสูงสุด −20 ฟื้นฟูพลังงาน −1" },
  shade: { key: "s", icon: "🕷️", name: "สายเลื้อยคลาน", title: "นักล่าความมืด", tag: "เงียบ ว่อง ซุ่มโจมตี",
    tiers: [["ก้าวเงียบ", "ว่องไว +2 (หลบ +6%)"], ["จมูกไว", "ค้นหาเสียพลังงานน้อยลง 20% (10→8)"], ["ซุ่มตะปบ", "ฟาดแรกหลังเข้าโซนภายใน 1 นาที ดาเมจ ×2.5 และทอยแรก +2"], ["นักล่าความมืด", "ว่องไว +1 อีก และซุ่มเป็น ×4"]],
    cost: "ราคา: HP สูงสุด −10 (ขั้น 2) และ −20 (ขั้น 3 ขึ้นไป)" }
};

const evoToday = () => { const n = serverNow(); return n - (n % EVO_DAY); };
function evoT(k) { return state.profile?.faction === "zombie" && state.evo ? state.evo[k] || 0 : 0; }
// ขั้นมิวเตชันของสายตะกละ (0–4) — ได้จากฟังก์ชัน mutAct (state.mutD) • ฮีลตอนกัด 8 ที่ขั้น 4 (rules อ่าน mut/{uid}/h ตรงกัน)
const mutTierH = () => (state.profile?.faction === "zombie" && state.mutD && state.mutD.line === "hunter" ? Number(state.mutD.m) || 0 : 0);
const evoFoodMult = () => (evoT("h") >= 2 ? 0.75 : 1);   // สายตะกละขั้น 2+: อาหารที่ได้จากการกัด/เนื้อเน่าเหลือ 75% (use.js ตรงกัน)

// โบนัส/ข้อเสียสุทธิต่อสเตตัส จากขั้นที่กำหนด (เพดานโบนัสฝั่งบวก: str +2, hp +5, agi +4, tough +2) — hp ต้องตรงกับ rules (users/hp) และ functions/use.js, hboss.js
function evoBonusAt(k, e) {
  const h = e?.h || 0, g = e?.g || 0, s = e?.s || 0;
  const cap = { str: 2, hp: 5, agi: 4, tough: 2 };
  let v = 0;
  if (k === "str") v = (h >= 1 ? 1 : 0) + (h >= 4 ? 1 : 0);
  else if (k === "hp") v = (g >= 1 ? 3 : 0) + (g >= 4 ? 2 : 0) - (s >= 3 ? 2 : s >= 2 ? 1 : 0);
  else if (k === "agi") v = (s >= 1 ? 2 : 0) + (s >= 4 ? 1 : 0) - [0, 0, 1, 2, 2][g];
  else if (k === "tough") v = g >= 1 ? 2 : 0;
  else if (k === "st") v = g >= 3 ? -2 : 0;
  else if (k === "regen") v = g >= 3 ? -1 : 0;
  return cap[k] !== undefined ? Math.min(v, cap[k]) : v;
}
function evoBonus(k) { return state.profile?.faction === "zombie" ? evoBonusAt(k, state.evo) : 0; }

function searchCost() { return Math.ceil((evoT("s") >= 2 ? 8 : STAMINA_COST) * (state.deep ? (gearHas("toolkit") ? 1.6 : 2) : 1)); }                 // ค้นหาไว: เสียพลังงาน −20%
function evoCutDmg(dmg) { return evoT("g") >= 2 ? Math.max(1, Math.floor(dmg * 0.85)) : dmg; }   // ไขมันเกราะ: −15%
function evoTitleKey() { const e = state.evo; return !e || state.profile?.faction !== "zombie" ? null : e.h === 4 ? "hunter" : e.g === 4 ? "giant" : e.s === 4 ? "shade" : null; }
function evoTitleText(key) { const L = EVO_LINES[key]; return L ? `${L.icon}${L.title}` : ""; }

// ซุ่มตะปบ: คืนตัวคูณดาเมจ (1 = ไม่ได้ซุ่ม) — ใช้ได้ครั้งเดียวต่อการเดินทาง 1 ครั้ง (ภายใน 55 วิ ให้เข้มกว่า rules 60 วิ)
const AMB_ROLL = 2;   // ซุ่ม: ทอยแรก +2 (rules อนุญาตเมื่อมีแฟล็ก amb — ต้องตรงกัน)
function ambushMult() {
  const s = evoT("s"), lt = state.profile?.lastTravel;
  if (s < 3 || typeof lt !== "number" || state.evoAmbFor === lt) return 1;
  return serverNow() - lt <= 55000 ? (s >= 4 ? 4 : 2.5) : 1;
}

// ระเบียน bites: dna = 1 (กัดโดน) หรือ 6 (กัดโดน + ติดเชื้อครั้งแรก) — rules ตรวจว่า 6 ใช้ได้เฉพาะตอนเหยื่อเพิ่งติดเชื้อจริง
function biteRec(firstInfect) { return { ts: serverTimestamp(), food: BITE_FOOD, dna: firstInfect ? 6 : 1 }; }
function bleedRec() { return { bstart: serverTimestamp(), mins: 3, v: 2, tick: serverTimestamp() }; }

/* ---------- ฟัง evo + ปุ่ม + ฉายา + ค่าหิวเพิ่ม ---------- */
function listenEvo() {
  if (state.evoOn) return; state.evoOn = true;
  state.evoReady = new Promise((r) => { state.evoResolve = r; });
  const b = btn("🧬 วิวัฒนาการ", openEvo, "btn ghost mini"); b.id = "btn-evo";
  $("btn-profile").before(b);
  onValue(ref(db, "evo/" + state.uid), (s) => {
    state.evo = s.val(); state.evoResolve?.();
    renderBars(); syncEvoTitle();
    scavLabel();
    if (!$("evo-modal")?.classList.contains("hidden")) renderEvo();
  }, (e) => { console.error("evo", e); state.evoResolve?.(); });
  setInterval(evoHungerTick, 30000);
}

function syncEvoTitle() {
  if (!state.zone || state.profile?.faction !== "zombie") return;
  const r = ref(db, `zonePlayers/${state.zone}/${state.uid}/evo4`), k = evoTitleKey();
  (k ? set(r, k) : remove(r)).catch(() => {});
  if (k && !LS.get(lsKey("feed_evo_" + k), 0)) { LS.set(lsKey("feed_evo_" + k), 1); try { feedPost(2, k); } catch { /* ข้าม */ } }
}

// สายตะกละ: หิวเร็วขึ้นตามขั้น (หักอาหารเพิ่มเอง ทีละ 30 วิ ขณะออนไลน์ — rules อนุญาตให้ food ลดได้เสมอ)
async function evoHungerTick() {
  const pct = [0, 0.15, 0.3, 0.4, 0.5][evoT("h")], p = state.profile;
  if (!pct || !p || p.hp <= 0 || state.busy || state.evoHBusy) return;
  state.evoHAcc = (state.evoHAcc || 0) + (pct * 30000) / FOOD_DECAY_MS.zombie;
  const n = Math.floor(state.evoHAcc); if (n < 1) return;
  state.evoHAcc -= n;
  const fd = curFood(); if (fd <= 0) return;
  const u = {}; hungerShift(u, "food", -Math.min(n, fd));
  if (!Object.keys(u).length) return;
  state.evoHBusy = true;
  try { await update(ref(db), u); } catch (e) { console.error("evo hunger", e); } finally { state.evoHBusy = false; }
}

/* ---------- ได้ DNA + ดูดเลือด (เรียกตอนรับ bites ใน listenBites) — เขียนลง u ใบเดียวกับที่ลบ bites ---------- */
function evoClaimWrites(u, bites, realHp = 0) {
  const uid = state.uid, p = state.profile, e = state.evo, today = evoToday();
  let n = 0; Object.values(bites || {}).forEach((b) => { n += Number(b?.dna) || 1; });
  const room = e && e.day === today ? EVO_DAILY_CAP - (e.gain || 0) : EVO_DAILY_CAP;
  const add = Math.max(0, Math.min(n, EVO_CLAIM_MAX, room));
  let msg = "";
  if (add > 0) {
    if (!e) Object.entries({ dna: add, sp: 0, line: "none", h: 0, g: 0, s: 0, day: today, gain: add, fd: 0, rs: 0 }).forEach(([k, v]) => { u[`evo/${uid}/${k}`] = v; });
    else { u[`evo/${uid}/dna`] = (e.dna || 0) + add; u[`evo/${uid}/day`] = today; u[`evo/${uid}/gain`] = (e.day === today ? e.gain || 0 : 0) + add; }
    msg += ` 🧬 DNA +${add}`;
  } else if (n > 0) msg += " (🧬 DNA วันนี้เต็มแล้ว)";
  const h = evoT("h");
  if (realHp > 0 && realHp < maxHp()) {
    const heal = Math.min(h >= 4 && mutTierH() >= 4 ? 8 : h >= 4 ? 5 : h >= 2 ? 3 : 2, maxHp() - realHp);   // พื้นฐาน 2 / สายตะกละขั้น 2-3 = 3 / ขั้น 4 = 5 / มิวเตชันขั้น 8 = 8 — ต้องตรงกับ rules (users/hp)
    u[`users/${uid}/hp`] = realHp + heal; 
    msg += ` 🩸 ฟื้น HP +${heal}`;
  }
  return msg;
}
/* ---------- ตาย: เสีย DNA ที่ยังไม่ใช้ครึ่งหนึ่ง (ซากหนาขั้น 3 ยกเว้นครั้งแรกของวัน) — เรียกใน processDeath ---------- */
function evoDeathWrites(u) {
  const e = state.evo, uid = state.uid;
  if (state.profile?.faction !== "zombie" || !e || !(e.dna > 0)) return "";
  const today = evoToday();
  if ((e.g || 0) >= 3 && (e.fd || 0) < today) { u[`evo/${uid}/fd`] = today; return "🗿 ไม่ยอมตาย (DNA ไม่หาย)"; }
  const keep = Math.floor(e.dna / 2); u[`evo/${uid}/dna`] = keep;
  return `🧬 DNA −${e.dna - keep}`;
}

/* ---------- ซื้อขั้น / รีเซ็ต ---------- */
function evoClampHp(u, tiers) {   // ถ้าเพดาน HP ใหม่ต่ำกว่า HP ปัจจุบัน ให้ลด HP ในอัปเดตเดียวกัน (rules validate HP ด้วยค่า evo ใหม่)
  const p = state.profile, mx = HP_BASE + 10 * (baseStat("hp") + buffOf("hp") + evoBonusAt("hp", tiers));
  if (p.hp > mx) u[`users/${state.uid}/hp`] = Math.max(1, mx);
}
async function evoBuy(lineId) {
  const e = state.evo; if (!e || state.evoBusy) return;
  const L = EVO_LINES[lineId], cur = e[L.key] || 0, next = cur + 1;
  const main = e.line && e.line !== "none" ? e.line : lineId;
  if (next > 4) return toast("ขั้นสูงสุดแล้ว");
  if (next > 1 && main !== lineId) return toast("สายอื่นอัปได้ถึงขั้น 1 เท่านั้น");
  const cost = EVO_STEP[cur]; if ((e.dna || 0) < cost) return toast(`DNA ไม่พอ (ต้องใช้ ${cost})`);
  const tiers = { h: e.h || 0, g: e.g || 0, s: e.s || 0, [L.key]: next };
  const u = { [`evo/${state.uid}/${L.key}`]: next, [`evo/${state.uid}/sp`]: (e.sp || 0) + cost, [`evo/${state.uid}/dna`]: e.dna - cost, [`evo/${state.uid}/line`]: main };
  evoClampHp(u, tiers);
  state.evoBusy = true;
  try { await update(ref(db), u); toast(`🧬 ${L.tiers[cur][0]} สำเร็จ`); achBump("evo"); } catch (err) { toast(errMsg(err)); } finally { state.evoBusy = false; }
}
async function evoReset() {
  const e = state.evo; if (!e || state.evoBusy || !(e.sp > 0)) return;
  const left = e.rs ? EVO_RESET_CD - (serverNow() - e.rs) : 0;
  if (left > 0) return toast(`รีเซ็ตได้อีกใน ${Math.ceil(left / 3600000)} ชม.`);
  const refund = Math.floor(e.sp * EVO_REFUND);
  if (!confirm(`รีเซ็ตวิวัฒนาการทั้งหมด? จะได้ DNA คืน ${refund} จาก ${e.sp} (70%) และรีเซ็ตซ้ำได้ทุก 24 ชม.`)) return;
  const u = { [`evo/${state.uid}/h`]: 0, [`evo/${state.uid}/g`]: 0, [`evo/${state.uid}/s`]: 0, [`evo/${state.uid}/sp`]: 0, [`evo/${state.uid}/line`]: "none", [`evo/${state.uid}/dna`]: (e.dna || 0) + refund, [`evo/${state.uid}/rs`]: serverTimestamp() };
  evoClampHp(u, { h: 0, g: 0, s: 0 });
  state.evoBusy = true;
  try { await update(ref(db), u); toast(`รีเซ็ตแล้ว ได้ DNA คืน ${refund}`); } catch (err) { toast(errMsg(err)); } finally { state.evoBusy = false; }
}

/* ---------- UI (สร้าง modal ด้วย JS ใช้ class เดิมของเกม ไม่ต้องแก้ index.html/style.css) ---------- */
function openEvo() {
  if (!$("evo-modal")) {
    const m = mk("div", "modal hidden"); m.id = "evo-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "440px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🧬 วิวัฒนาการ"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "evo-body"; body.style.cssText = "display:grid;gap:12px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  renderEvo(); $("evo-modal").classList.remove("hidden");
}
// ---- 🧬 มิวเตชัน (ขั้น 5–8 ของสายหลัก จ่ายด้วย DNA ผ่านฟังก์ชัน mutAct) ----
async function mutSync(a = "state") { if (state.mutBusy) return; state.mutBusy = true; try { const r = await mutCall({ a }); state.mutD = r; state.mutAt = Date.now(); if (a === "buy" && r.bought) { toast(`🧬 กลายพันธุ์: ${r.bought}`); logLine(`🧬 มิวเตชัน ${r.n} ขั้น ${4 + r.m}/8: ${r.bought}`, "system"); } abilInvalidate(); } catch (e) { state.mutAt = Date.now(); if (a === "buy") toast(fnErr(e)); } finally { state.mutBusy = false; try { renderEvo(); abilBar(); } catch { /* ข้าม */ } } }
function mutRender(body) {
  if (state.profile?.faction !== "zombie") return;
  const D = state.mutD; if (!D || Date.now() - (state.mutAt || 0) > 20000) { if (!state.mutBusy) mutSync(); }
  if (!D || !D.zom) return;
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px;margin-top:8px";
  if (!D.line) { c.append(mk("b", "", "🧬 มิวเตชัน (ขั้น 5–8)"), mk("span", "muted", "ปลดล็อกเมื่อสายหลักถึงขั้น 4 — ต่อยอดไปอีก 4 ขั้น จ่ายด้วย DNA เพิ่มพลังความสามารถประจำสายและโบนัสถาวร")); body.append(c); return; }
  c.append(mk("b", "", `🧬 มิวเตชัน ${D.ic} ${D.n} — ขั้น ${4 + D.m}/8`), mk("span", "muted", "ขั้น 5+ เพิ่มระดับความสามารถประจำสาย (ได้ผลครึ่งหนึ่งของขั้นปกติ) + โบนัสถาวรเล็กน้อย • DNA ที่ใช้ไม่คืนเมื่อรีเซ็ต"));
  D.tiers.forEach((t, i) => { const row = mk("div"); row.style.cssText = "display:flex;justify-content:space-between;gap:8px;align-items:center"; row.append(mk("span", t.done ? "" : "muted", `${t.done ? "✅" : i === D.m ? "▶" : "🔒"} ขั้น ${5 + i} ${t.n}: ${t.d}`)); if (i === D.m) { const b = btn(`${t.cost} DNA`, () => { if (confirm(`กลายพันธุ์ "${t.n}" ใช้ ${t.cost} DNA?`)) mutSync("buy"); }, "btn primary mini"); b.disabled = !!state.mutBusy || (state.evo?.dna || 0) < t.cost; b.style.minHeight = "40px"; row.append(b); } c.append(row); });
  body.append(c);
}
function renderEvo() {
  const body = $("evo-body"); if (!body) return;
  body.innerHTML = "";
  const e = state.evo || { dna: 0, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, rs: 0 };
  const today = evoToday(), gainToday = e.day === today ? e.gain || 0 : 0;
  const head = mk("div"); head.append(mk("div", "", `🧬 DNA ${e.dna || 0} • วันนี้ได้แล้ว ${gainToday}/${EVO_DAILY_CAP}`));
  // เป้าหมายถัดไป: ขั้นที่ถูกที่สุดที่ซื้อได้ตามกติกา
  let goal = null;
  Object.entries(EVO_LINES).forEach(([id, L]) => {
    const cur = e[L.key] || 0, main = e.line && e.line !== "none" ? e.line : id;
    if (cur >= 4 || (cur >= 1 && main !== id)) return;
    const c = EVO_STEP[cur]; if (!goal || c < goal.c) goal = { c, name: L.tiers[cur][0] };
  });
  if (goal) head.append(mk("div", "muted", (e.dna || 0) >= goal.c ? `พร้อมอัป: ${goal.name}` : `อีก ${goal.c - (e.dna || 0)} DNA ถึง "${goal.name}"`));
  body.append(head);
  body.append(mk("p", "muted", "ได้ DNA: กัดโดน +1 / ติดเชื้อเหยื่อครั้งแรก +6 • ตายเสียครึ่งหนึ่ง • สายหลักได้ถึงขั้น 4 สายอื่นได้ถึงขั้น 1"));
  Object.entries(EVO_LINES).forEach(([id, L]) => {
    const cur = e[L.key] || 0, main = e.line && e.line !== "none" ? e.line : id, locked = cur >= 1 && main !== id;
    const card = mk("div"); card.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
    card.append(mk("b", "", `${L.icon} ${L.name} ${e.line === id ? "⭐ สายหลัก" : ""} — ขั้น ${cur}/4`), mk("span", "muted", L.tag));
    L.tiers.forEach(([n, d], i) => {
      const row = mk("div"); row.style.cssText = "display:flex;justify-content:space-between;gap:8px;align-items:center";
      const t = mk("span", i < cur ? "" : "muted", `${i < cur ? "✅" : i === cur ? "▶" : "🔒"} ขั้น ${i + 1} ${n}: ${d}`);
      row.append(t);
      if (i === cur && cur < 4) {
        const capped = cur >= 1 && main !== id, cost = EVO_STEP[cur];
        const b = btn(`${cost} DNA`, () => evoBuy(id), "btn primary mini");
        b.disabled = capped || (e.dna || 0) < cost || !state.evo; row.append(b);
      }
      card.append(row);
    });
    card.append(mk("span", "muted", L.cost));
    if (locked) card.append(mk("span", "muted", "สายอื่น: อัปได้ถึงขั้น 1 เท่านั้น"));
    body.append(card);
  });
  try { mutRender(body); } catch { /* ข้าม */ }
  const left = e.rs ? EVO_RESET_CD - (serverNow() - e.rs) : 0;
  const rb = btn(left > 0 ? `รีเซ็ต (รออีก ${Math.ceil(left / 3600000)} ชม.)` : `รีเซ็ตวิวัฒนาการ (คืน ${Math.floor((e.sp || 0) * EVO_REFUND)} DNA)`, evoReset, "btn danger wide");
  rb.disabled = !(e.sp > 0) || left > 0; body.append(rb);
}

/* =========================================================
   15) ตลาดซื้อขาย — แปะต่อท้าย script.js (แยกตลาดตามฝั่ง: market/{human|zombie})
   market/{faction}/{uid_1..3} = { seller, sellerName, give:{id,qty}, want:{id,qty}, ts }  ← ของที่ลงขายอยู่ใน escrow (หักจากคลังตอนลง)
   marketPayouts/{seller}/{lid_ts} = { id, qty, lid }  ← ของที่ผู้ขายได้ รอกด "รับ"
   marketTx/{uid} = { op: buy|cancel|claim, lid|pid, ts }  ← "ตั๋ว" ที่ rules ใช้ตรวจ (เขียนในอัปเดตเดียวกับการย้ายของ)
   ทุกการเขียนข้อมูลตลาดทำผ่าน Cloud Function marketAct (functions/market.js) — rules ปิดการเขียนตรงแล้ว • ค่าคงที่ต้องตรงกับไฟล์นั้น • ใช้ function declaration (hoist) ไม่ต้องแก้ index.html/style.css
   ========================================================= */
const MKT_IDS = ["canned_food", "water", "bandage", "medkit", "scrap", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "chem", "rotten_meat", "duct_tape", "rusty_nails", "cloth_roll", "rope_coil", "herb_bundle", "copper_wire", "leather_scrap", "fuel_can", "gunpowder", "steel_plate", "battery_pack", "circuit_board", "chem_catalyst", "mutant_gland", "survivor_badge", "old_photo", "gold_watch", "lab_keycard", "data_chip", "boss_trophy", "instant_noodle", "potato_chips", "canned_sardine", "cereal_bar", "canned_tuna", "wild_berries", "smoked_meat", "honey_jar", "mushroom_stew", "mre_pack", "soda_can", "spring_water", "mineral_bottle", "herbal_tea", "sports_drink", "desal_water", "gauze_roll", "antiseptic", "painkillers", "antibiotic", "suture_kit", "herbal_salve", "iv_drip", "morphine", "blood_pack", "field_surgery_kit", "coffee_can", "smelling_salts", "rum_bottle", "adrenaline_shot", "focus_pill", "regen_gel", "combat_stim", "berserker_serum", "reflex_booster", "mutagen_vial"];
const MKT_SLOTS = 3, MKT_MAX = 99;
const mktIdsFor = () => MKT_IDS.filter((id) => id !== "rotten_meat" || state.profile?.faction === "zombie");
const mktHave = (id) => state.inv?.[id]?.qty || 0;
const MKT_WEAP = ["wooden_bat", "pocket_knife", "crowbar", "knife", "spiked_bat", "fire_axe", "crossbow", "pistol", "samurai_sword", "shotgun", "lab_blade"];   // อาวุธที่ลงตลาดได้ (ขายทีละชิ้น พร้อมความทน) — ไม่รวมอาวุธ GM/อาวุธสร้างเอง
const mktWeaponSlots = () => Object.entries(state.inv || {}).filter(([, it]) => it && MKT_WEAP.includes(it.id) && it.dur > 0).map(([slot]) => "w:" + slot);
const mktLabel = (id) => {
  if (String(id).startsWith("w:")) { const it = state.inv?.[id.slice(2)]; if (!it) return "—"; const d = ITEMS[it.id]; return `${d.icon || "🗡️"} ${d.name} (${it.dur}/${it.maxDur ?? d.maxDur})`; }
  const d = ITEMS[id]; return d ? `${d.icon || "📦"} ${d.name}` : id;
};
const mktGiveTxt = (g) => g?.slot ? `${mktLabel(g.id)} (${g.dur}/${g.maxDur ?? ITEMS[g.id]?.maxDur ?? "?"})` + "" : `${mktLabel(g.id)} ×${g.qty}`;
const mktWants = (l) => [l?.want, l?.want2, l?.want3].filter((w) => w && w.id);   // ประกาศขอได้ 1–3 อย่าง (ผู้ซื้อต้องจ่ายครบทุกอย่าง)
const mktWantTxt = (l) => mktWants(l).map((w) => `${mktLabel(w.id)} ×${w.qty}`).join(" + ");
const mktWantKey = ["", "b", "c"];   // คีย์ใบรับของ: lid_ts / lid_b{ts} / lid_c{ts}
const mktInt = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= MKT_MAX ? n : 0; };
// ใส่ของเข้าคลังตัวเอง (บวกจากของเดิม) ลง u — ถ้าช่องมีอยู่แล้วแก้แค่ qty
function mktCredit(u, id, qty) {
  const have = mktHave(id), base = `inventory/${state.uid}/${id}`;
  if (have > 0) u[base + "/qty"] = have + qty; else u[base] = { id, qty };
}
function mktDebit(u, id, qty) {
  const left = mktHave(id) - qty, base = `inventory/${state.uid}/${id}`;
  if (left > 0) u[base + "/qty"] = left; else u[base] = null;
}

function listenMarket() {
  if (state.mktOn || !state.profile?.faction) return; state.mktOn = true;
  state.market = {}; state.mktPay = {}; state.mktForm = state.mktForm || { g: "", gq: 1, w: "scrap", wq: 1 };
  const b = btn("🏪 ตลาด", openMarket, "btn ghost mini"); b.id = "btn-market"; $("btn-profile").before(b);
  const again = () => {
    const m = $("mkt-modal"); if (!m || m.classList.contains("hidden")) return;
    if (/^(INPUT|SELECT)$/.test(document.activeElement?.tagName || "") && m.contains(document.activeElement)) return;   // ไม่รีเฟรชทับตอนกำลังพิมพ์/เลือก
    renderMarket();
  };
  onValue(ref(db, "market/" + state.profile.faction), (s) => { state.market = s.val() || {}; try { mktListingsSeen(state.market); } catch { /* ข้าม */ } again(); }, (e) => console.error("market", e));
  onValue(ref(db, "marketPayouts/" + state.uid), (s) => { state.mktPay = s.val() || {}; try { gftSeen(state.mktPay); } catch { /* ข้าม */ } updateMarketBadge(); again(); }, (e) => console.error("marketPayouts", e));
  onValue(ref(db, "inventory/" + state.uid), again);   // ลงทะเบียนหลัง listenInventory จึงเห็น state.inv ล่าสุดเสมอ
  setInterval(again, 5000);                              // อัปเดตสถานะ Safe Zone ของปุ่ม
}
function updateMarketBadge() {
  const b = $("btn-market"); if (!b) return;
  const n = Object.keys(state.mktPay || {}).length;
  b.textContent = n ? `🏪 ตลาด (${n} รอรับ)` : "🏪 ตลาด";
}
function mktErr(e) {
  const c = String(e?.code || "");
  if (c.startsWith("functions/")) return /internal|unavailable|deadline|unknown/.test(c) ? "เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง" : (e.message || "ทำรายการไม่สำเร็จ");   // ข้อความไทยมาจากฟังก์ชัน
  return "ทำรายการไม่สำเร็จ";
}
async function mktRun(data, okMsg, tag = "") {
  if (state.mktBusy) return; state.mktBusy = true;
  try {
    // timeout กัน mktBusy ค้างเป็น true (ปุ่มตลาดทุกปุ่มจะเงียบ) ถ้าคำขอไม่ตอบกลับ
    const r = await Promise.race([marketCall(data), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000))]);
    toast(okMsg);
    return r || true;
  } catch (e) {
    console.error("market", tag, e?.code || e, JSON.stringify(data));
    toast(String(e?.message) === "timeout" ? "เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง" : mktErr(e) + (tag ? ` [${tag}]` : ""));
  } finally { state.mktBusy = false; }
}
function mktGuard(needSafe = true) {
  const p = state.profile;
  if (!p || p.hp <= 0) { toast("คุณสลบอยู่"); return false; }
  if (needSafe && state.zone !== "safe") { toast("ซื้อขายได้เฉพาะใน Safe Zone"); return false; }
  return true;
}

// ลงขาย: ของออกจากคลัง → ประกาศ (escrow)
async function mktCreate() {
  const f = state.mktForm, p = state.profile; if (!mktGuard()) return;
  const isW = String(f.g).startsWith("w:"), wslot = isW ? f.g.slice(2) : null, wit = isW ? state.inv?.[wslot] : null;
  const gq = isW ? 1 : mktInt(f.gq), list = [{ id: f.w, q: f.wq }, ...(f.x || [])].slice(0, 3);
  if (!f.g || !gq) return toast("จำนวนต้องเป็น 1–99");
  if (isW && (!wit || !MKT_WEAP.includes(wit.id) || !(wit.dur > 0))) return toast("ไม่พบอาวุธชิ้นนี้ในกระเป๋า");
  const ws = [];
  for (const x of list) {
    const q = mktInt(x.q);
    if (!x.id || !q) return toast("จำนวนต้องเป็น 1–99");
    if (!isW && x.id === f.g) return toast("ของที่ต้องการต้องไม่ซ้ำกับของที่ขาย");
    if (ws.some((w) => w.id === x.id)) return toast("ของที่ต้องการห้ามซ้ำกันเอง");
    ws.push({ id: x.id, qty: q });
  }
  if (!isW && mktHave(f.g) < gq) return toast("ของในกระเป๋าไม่พอ");
  const n = [1, 2, 3].find((i) => !state.market?.[`${state.uid}_${i}`]);
  if (!n) return toast(`ลงขายได้สูงสุด ${MKT_SLOTS} ประกาศ — ยกเลิกอันเก่าก่อน`);
  if (await mktRun({ a: "sell", g: f.g, ...(isW ? {} : { gq }), wants: ws }, `ลงขาย ${ITEMS[isW ? wit.id : f.g].name} ×${gq} แล้ว`)) { f.x = []; questBump("market"); }
}
// ซื้อ: จ่ายของที่ขอ → ได้ของในประกาศ • ผู้ขายได้ใบรับของ (ซื้อทั้งประกาศ ไม่แบ่งซื้อ)
async function mktBuy(lid) {
  const l = state.market?.[lid], p = state.profile; if (!l || !mktGuard()) return;
  if (l.seller === state.uid) return toast("ซื้อประกาศตัวเองไม่ได้");
  const ws = mktWants(l);
  const lack = ws.find((w) => mktHave(w.id) < w.qty);
  if (lack) return toast(`ของไม่พอ — ต้องมี ${mktWantTxt(l)}`);
  if (!l.give.slot && mktHave(l.give.id) + l.give.qty > MKT_MAX) return toast(`${ITEMS[l.give.id].name} ในกระเป๋าจะเกิน ${MKT_MAX} — ใช้ของก่อน`);
  if (await mktRun({ a: "buy", lid }, `ซื้อ ${ITEMS[l.give.id].name} ×${l.give.qty} แล้ว`)) questBump("market");
}
// ยกเลิกประกาศของตัวเอง: ของกลับเข้าคลัง
async function mktCancel(lid) {
  const l = state.market?.[lid]; if (!l || l.seller !== state.uid || !mktGuard(false)) return;
  if (!l.give.slot && mktHave(l.give.id) + l.give.qty > MKT_MAX) return toast(`${ITEMS[l.give.id].name} ในกระเป๋าจะเกิน ${MKT_MAX} — ใช้ของก่อน`);
  await mktRun({ a: "cancel", lid }, "ยกเลิกประกาศแล้ว ของกลับเข้ากระเป๋า");
}
// รับของที่ขายได้
async function mktClaim(pid) {
  const pay = state.mktPay?.[pid]; if (!pay || !mktGuard(false)) return;
  if (mktHave(pay.id) + pay.qty > MKT_MAX) return toast(`${ITEMS[pay.id].name} ในกระเป๋าจะเกิน ${MKT_MAX} — ใช้ของก่อนแล้วค่อยรับ`);
  await mktRun({ a: "claim", pid }, `รับ ${ITEMS[pay.id].name} ×${pay.qty} แล้ว`, "claim");
}

/* ---------- UI (modal สร้างด้วย JS ใช้ class เดิมของเกม) ---------- */
function openMarket() {
  if (!$("mkt-modal")) {
    const m = mk("div", "modal hidden"); m.id = "mkt-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🏪 ตลาด"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "mkt-body"; body.style.cssText = "display:grid;gap:12px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  renderMarket(); $("mkt-modal").classList.remove("hidden");
}
function mktSelect(ids, value, onChange) {
  const s = mk("select"); s.style.cssText = "flex:1;min-width:0";
  ids.forEach((id) => { const o = mk("option", "", mktLabel(id)); o.value = id; s.append(o); });
  if (ids.includes(value)) s.value = value;
  s.addEventListener("change", () => onChange(s.value)); return s;
}
function renderMarket() {
  const body = $("mkt-body"); if (!body) return;
  body.innerHTML = "";
  const f = state.mktForm, safe = state.zone === "safe", fac = state.profile?.faction === "zombie" ? "🧟 ตลาดฝั่งซอมบี้" : "🧍 ตลาดฝั่งมนุษย์";
  body.append(mk("div", "muted", `${fac} — ซื้อขายกับผู้เล่นฝั่งเดียวกันเท่านั้น${safe ? "" : " • ตอนนี้ไม่ได้อยู่ Safe Zone (ซื้อ/ลงขายไม่ได้ แต่ยกเลิกและรับของได้)"}`));
  const row = () => { const r = mk("div"); r.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px"; return r; };
  const card = (title) => { const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px"; c.append(mk("b", "", title)); return c; };

  const pays = Object.entries(state.mktPay || {});
  if (pays.length) {
    const c = card("📬 ของที่รอรับ (ขายได้ / ของขวัญ)");
    pays.forEach(([pid, p]) => { const r = row(); r.append(mk("span", "", `${p.lid === "gift" ? `🎁 ของขวัญจาก ${p.n || "เพื่อน"} — ` : ""}${mktLabel(p.id)} ×${p.qty}`), btn("รับ", () => mktClaim(pid), "btn primary mini")); c.append(r); });
    if (pays.length > 1) c.append(btn("📬 รับทั้งหมด", async () => { for (const [pid] of Object.entries(state.mktPay || {})) { if (!state.mktPay?.[pid]) continue; await mktClaim(pid); } }, "btn primary mini"));
    body.append(c);
  }

  if (typeof bmRender === "function") bmRender(body, card, row);   // ตลาดมืด (ข้อ 16)
  if (typeof gachaRender === "function") gachaRender(body, card, row);   // ตู้กาชา (ข้อ 17)
  const mine = [1, 2, 3].map((i) => [`${state.uid}_${i}`, state.market?.[`${state.uid}_${i}`]]).filter(([, l]) => l);
  const c2 = card(`📦 ประกาศของฉัน (${mine.length}/${MKT_SLOTS})`);
  mine.forEach(([lid, l]) => { const r = row(); r.append(mk("span", "", `ขาย ${mktGiveTxt(l.give)} → ต้องการ ${mktWantTxt(l)}`), btn("ยกเลิก", () => mktCancel(lid), "btn danger mini")); c2.append(r); });
  if (mine.length < MKT_SLOTS) {
    const haveIds = [...mktIdsFor().filter((id) => mktHave(id) > 0), ...mktWeaponSlots()];
    if (!haveIds.includes(f.g)) f.g = haveIds[0] || "";
    if (!mktIdsFor().includes(f.w)) f.w = "scrap";
    if (!haveIds.length) c2.append(mk("span", "muted", "ไม่มีของที่ลงขายได้ในกระเป๋า"));
    else {
      const num = (key, o = f) => { const i = mk("input"); i.type = "number"; i.min = 1; i.max = MKT_MAX; i.value = o[key]; i.style.cssText = "width:64px"; i.addEventListener("input", () => { o[key] = i.value; }); return i; };
      const r1 = row(), r2 = row(); f.x = f.x || [];
      const gW = String(f.g).startsWith("w:");
      r1.append(mk("span", "", "ขาย"), mktSelect(haveIds, f.g, (v) => { f.g = v; renderMarket(); }), ...(gW ? [mk("span", "muted", "×1 (อาวุธติดความทนไปด้วย)")] : [num("gq"), mk("span", "muted", `(มี ${mktHave(f.g)})`)]));
      r2.append(mk("span", "", "แลก"), mktSelect(mktIdsFor(), f.w, (v) => { f.w = v; }), num("wq"));
      c2.append(r1, r2);
      f.x.forEach((x, i) => { const rx = row(); rx.append(mk("span", "", "และ"), mktSelect(mktIdsFor(), x.id, (v) => { x.id = v; }), num("q", x), btn("✕", () => { f.x.splice(i, 1); renderMarket(); }, "btn ghost mini")); c2.append(rx); });
      if (f.x.length < 2) c2.append(btn("➕ ขอของเพิ่มอีกอย่าง (ผู้ซื้อต้องจ่ายครบทุกอย่าง)", () => { const used = [f.g, f.w, ...f.x.map((x) => x.id)]; f.x.push({ id: mktIdsFor().find((id) => !used.includes(id)) || "water", q: 1 }); renderMarket(); }, "btn ghost mini"));
      const go = btn("ลงขาย", mktCreate, "btn primary mini"); go.disabled = !safe;
      c2.append(go, mk("span", "muted", "ของที่ลงขายจะถูกเก็บไว้ในตลาด (ไม่หายตอนตาย) ยกเลิกเมื่อไรก็ได้"));
    }
  }
  body.append(c2);

  const others0 = Object.entries(state.market || {}).filter(([, l]) => l.seller !== state.uid).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
  try { body.append(mktFilterCard(card, row)); } catch (e) { console.warn("mkt filter", e); }
  let others = others0; try { others = mktApplyFilter(others0); } catch { /* ข้าม */ }
  const c3 = card(`🛒 ประกาศในตลาด (${others.length})`);
  others.forEach(([lid, l]) => {
    const r = row(), enough = mktWants(l).every((w) => mktHave(w.id) >= w.qty);
    const t = mk("span", enough ? "" : "muted", `${l.sellerName}: ${mktGiveTxt(l.give)} ← ${mktWantTxt(l)}`);
    const b = btn("ซื้อ", () => mktBuy(lid), "btn primary mini"); b.disabled = !safe || !enough;
    if (!enough) b.title = "ของไม่พอ";
    r.append(t, b); c3.append(r);
  });
  if (!others.length) c3.append(mk("span", "muted", "ยังไม่มีใครลงขาย"));
  body.append(c3);
}


/* =========================================================
   16) ตลาดมืด — ระบบสุ่มของมาขาย หมุนรอบทุก 60 นาที (แปะต่อท้าย script.js ต่อจากข้อ 15 ตลาดซื้อขาย)
   bm/{faction} = { w, o1..o5: { give:{id,qty}, want:{id,qty}, stock, sold, buyers:{uid:true} } }
   w = เลขรอบ = floor(เวลาเซิร์ฟเวอร์ ÷ 1 ชม.) • ผู้เล่นออนไลน์คนแรกของรอบเป็นคนเขียนรอบใหม่ (แนวเดียวกับเหตุการณ์สุ่ม)
   สุ่มด้วย seed จากเลขรอบ → ทุกเครื่องได้ชั้นวางเหมือนกัน • rules บังคับไอเทมต่อช่อง/ราคาต่ำสุด-สูงสุด/สต็อก (patch_rules_bm.js)
   ซื้อ: marketTx/{uid} = { op: "bmbuy", k, ts } + bm/{f}/{k}/sold +1 + bm/{f}/{k}/buyers/{uid} ในอัปเดตเดียวกับการย้ายของ
   ของที่จ่ายหายจากระบบ (เป็นที่ระบายของ) • ตารางสินค้า/ราคามาจาก bm_config.js ชุดเดียวกับ rules
   ========================================================= */
const BM_CFG = {"win":3600000,"slots":{"o1":"common","o2":"common","o3":"mid","o4":"mid","o5":"rare"},"stock":{"common":4,"mid":3,"rare":2},"human":{"currency":"scrap","tiers":{"common":["chem","water_jug","choco_bar","soup","medkit"],"mid":["army_meal","energy_drink","antidote","stim_shot"],"rare":["serum","trauma_kit"]},"price":{"chem":[5,4,6],"water_jug":[6,5,7],"choco_bar":[6,5,7],"soup":[5,4,6],"medkit":[6,5,7],"army_meal":[6,5,7],"energy_drink":[9,7,11],"antidote":[12,10,14],"stim_shot":[13,11,15],"serum":[17,14,20],"trauma_kit":[19,16,22]}},"zombie":{"currency":"rotten_meat","tiers":{"common":["water_jug","choco_bar","soup","moss"],"mid":["medkit","energy_drink","stim_shot"],"rare":["trauma_kit"]},"price":{"water_jug":[3,2,4],"choco_bar":[3,2,4],"soup":[3,2,4],"moss":[2,1,3],"medkit":[3,2,4],"energy_drink":[4,3,5],"stim_shot":[6,5,7],"trauma_kit":[8,6,10]}}};

const bmWindow = () => Math.floor(serverNow() / BM_CFG.win);
function bmRng(seed) {   // mulberry32 — เหมือนกันทุกเครื่องเมื่อ seed เท่ากัน
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function listenBlackMarket() {
  if (state.bmOn || !state.profile?.faction) return; state.bmOn = true;
  state.bm = null; state.bmFac = "";
  bmSubscribe();
  setInterval(() => { bmSubscribe(); bmMaybeRotate(); }, 15000);   // เช็กรอบใหม่ทุก 15 วิ (คำนวณในเครื่อง ไม่แตะฐานข้อมูลถ้ายังไม่ถึงรอบ)
}
function bmSubscribe() {
  const fac = state.profile?.faction; if (!fac || fac === state.bmFac) return;
  if (state.bmOff) state.bmOff();
  state.bmFac = fac; state.bm = null;
  state.bmOff = onValue(ref(db, "bm/" + fac), (s) => { state.bm = s.val() || {}; bmRefresh(); bmMaybeRotate(); }, (e) => console.error("bm", e));
}
function bmRefresh() {
  const m = $("mkt-modal"); if (!m || m.classList.contains("hidden")) return;
  if (/^(INPUT|SELECT)$/.test(document.activeElement?.tagName || "") && m.contains(document.activeElement)) return;   // ไม่รีเฟรชทับตอนกำลังพิมพ์/เลือกในตลาดผู้เล่น
  renderMarket();
}
// ไม่มีเซิร์ฟเวอร์ → ผู้เล่นที่ออนไลน์คนใดคนหนึ่งเป็นคนเขียนรอบใหม่ (rules บังคับให้เขียนได้เฉพาะรอบปัจจุบันและเลขรอบต้องเพิ่มขึ้น)
async function bmMaybeRotate() {
  const p = state.profile, fac = state.bmFac;
  if (state.bmBusy || !p || p.banned || !fac || fac !== p.faction || state.bm === null) return;
  const w = bmWindow();
  if ((state.bm.w || 0) >= w || serverNow() < w * BM_CFG.win + 1500) return;   // +1.5 วิ: กันนาฬิกาเครื่องเร็วกว่าเซิร์ฟเวอร์เล็กน้อย
  state.bmBusy = true;
  try {
    await new Promise((r) => setTimeout(r, Math.random() * 4000));            // สุ่มหน่วง กันหลายคนชนกัน
    if (bmWindow() !== w || (state.bm?.w || 0) >= w) return;
    await marketCall({ a: "bmRotate" });   // เซิร์ฟเวอร์สร้างชั้นวางรอบใหม่ให้ (ถ้ายังไม่มีคนสร้าง)
  } catch (e) { /* มีคนเขียนก่อน หรือยังไม่ถึงเวลา — ไม่ต้องแจ้งผู้เล่น */ }
  finally { state.bmBusy = false; }
}

// ซื้อ: จ่ายสกุลของฝั่ง → ได้ของ 1 ชิ้น • 1 คนซื้อได้ 1 ครั้งต่อช่องต่อรอบ
async function bmBuy(k) {
  const o = state.bm?.[k], p = state.profile; if (!o || !o.give || !mktGuard()) return;
  if (state.bm.w !== bmWindow()) return toast("ตลาดมืดกำลังเปลี่ยนรอบ — รอสักครู่");
  if (o.buyers?.[state.uid]) return toast("คุณซื้อรายการนี้ในรอบนี้แล้ว");
  if ((o.sold || 0) >= o.stock) return toast("สินค้าหมดแล้ว");
  if (mktHave(o.want.id) < o.want.qty) return toast(`ของไม่พอ — ต้องมี ${mktLabel(o.want.id)} ×${o.want.qty}`);
  if (mktHave(o.give.id) + o.give.qty > MKT_MAX) return toast(`${ITEMS[o.give.id].name} ในกระเป๋าจะเกิน ${MKT_MAX} — ใช้ของก่อน`);
  if (await mktRun({ a: "bmBuy", k }, `ซื้อ ${ITEMS[o.give.id].name} จากตลาดมืดแล้ว`)) questBump("market");
}

// วาดการ์ด "ตลาดมืด" ในหน้าต่างตลาดเดิม (renderMarket เรียกให้ พร้อมส่งตัวช่วย card/row มา)
function bmRender(body, card, row) {
  const fac = state.profile?.faction, c = BM_CFG[fac]; if (!c) return;
  const w = bmWindow(), safe = state.zone === "safe", bm = state.bm;
  const left = Math.max(1, Math.ceil(((w + 1) * BM_CFG.win - serverNow()) / 60000));
  const box = card("🕶️ ตลาดมืด");
  const fresh = !!bm && bm.w === w;
  box.append(mk("span", "muted", fresh
    ? `ระบบสุ่มของมาขาย เปลี่ยนรอบในอีก ~${left} นาที • ซื้อได้ 1 ชิ้นต่อรายการต่อรอบ • จ่ายด้วย ${mktLabel(c.currency)} (ของที่จ่ายหายไปจากระบบ)`
    : bm === null ? "กำลังโหลด…" : "กำลังจัดของรอบใหม่…"));
  if (fresh) {
    Object.keys(BM_CFG.slots).forEach((k) => {
      const o = bm[k]; if (!o || !o.give || !o.want) return;
      const stockLeft = o.stock - (o.sold || 0), bought = !!o.buyers?.[state.uid], out = stockLeft <= 0, enough = mktHave(o.want.id) >= o.want.qty;
      const r = row();
      r.append(
        mk("span", enough || bought || out ? "" : "muted", `${mktLabel(o.give.id)} ×${o.give.qty} ← ${mktLabel(o.want.id)} ×${o.want.qty}  (เหลือ ${Math.max(0, stockLeft)}/${o.stock})`),
        (() => {
          const b = btn(bought ? "ซื้อแล้ว" : out ? "หมด" : "ซื้อ", () => bmBuy(k), "btn primary mini");
          b.disabled = !safe || bought || out || !enough;
          if (!safe) b.title = "ซื้อได้เฉพาะใน Safe Zone"; else if (!enough && !bought && !out) b.title = "ของไม่พอ";
          return b;
        })()
      );
      box.append(r);
    });
  }
  body.append(box);
}

/* =========================================================
   17) ตู้กาชา — หมุนด้วยทรัพยากร ได้ของเอาชีวิตรอด (แยกกองมนุษย์/ซอมบี้)
   gachaPool/{fac}/{slot} = { id, qty }  ← กองรางวัลที่แอดมินใส่ไว้ล่วงหน้า (ผู้เล่นอ่านไม่ได้ ยกเว้นช่องของตั๋วตัวเอง)
   gachaMeta/{fac}/{slot} = true          ← ช่องที่ยังไม่ถูกหมุน (ผู้เล่นเห็นแค่จำนวน ไม่เห็นว่าข้างในคืออะไร)
   gachaTickets/{uid} = { f, slot, ts }   ← ตั๋ว: หมุน = หักของ + ลบช่องออกจาก meta + สร้างตั๋วในคำสั่งเดียว แล้วค่อยรับของตามช่องนั้น
   ราคา / รายการของที่ใส่ได้ ต้องตรงกับ database_rules.json (gachaTickets / gachaPool)
   ========================================================= */
const GACHA_COST = { human: { id: "scrap", qty: 5 }, zombie: { id: "rotten_meat", qty: 2 } };
const GACHA_ITEMS = {
  human: ["canned_food", "water", "bandage", "medkit", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "stat_cap", "stat_lim"],
  zombie: ["water", "water_jug", "bandage", "medkit", "moss", "energy_drink", "stim_shot", "antidote", "trauma_kit", "rotten_meat", "stat_cap", "stat_lim"]
};
const GACHA_QTY_MAX = 5;
// กองเริ่มต้น 100 ช่องต่อฝั่ง [id, qty ต่อช่อง, จำนวนช่อง] — มนุษย์คืนมูลค่า ~67% ของราคา / ซอมบี้ ~86% (เนื้อเน่ามีค่าสูงกว่า scrap จริง จึงตั้งให้คืนมากกว่า)
const GACHA_SEED = {
  human: [["water", 1, 14], ["canned_food", 1, 12], ["bread", 1, 10], ["bandage", 1, 12], ["fruit", 1, 8], ["moss", 1, 6],
    ["water_jug", 1, 6], ["soup", 1, 6], ["choco_bar", 1, 5], ["energy_drink", 1, 5], ["medkit", 1, 6],
    ["army_meal", 1, 3], ["antidote", 1, 2], ["stim_shot", 1, 2], ["trauma_kit", 1, 2], ["serum", 1, 1]],
  zombie: [["water", 1, 28], ["bandage", 1, 24], ["rotten_meat", 1, 24], ["moss", 1, 12],
    ["water_jug", 1, 5], ["medkit", 1, 3], ["energy_drink", 1, 2],
    ["stim_shot", 1, 1], ["trauma_kit", 1, 1]]
};
// รหัสช่องสุ่ม (ห้ามใช้ push id เพราะเรียงตามเวลา — จะเดาได้ว่าช่องไหนใส่ทีหลัง)
const gachaKey = () => { const c = "abcdefghijklmnopqrstuvwxyz0123456789", a = new Uint8Array(12); crypto.getRandomValues(a); return [...a].map((x) => c[x % 36]).join(""); };
const gachaIsPerm = (e) => String(e?.code || e).includes("PERMISSION_DENIED");

function listenGacha() {
  if (state.gaOn || !state.profile?.faction) return; state.gaOn = true;
  state.gaMeta = null; state.gaFac = ""; state.gaTicket = null; state.gaForm = state.gaForm || { f: "", id: "water", qty: 1, n: 10 };
  const sub = () => {
    const fac = state.profile?.faction; if (!fac || fac === state.gaFac) return;
    if (state.gaOff) state.gaOff();
    state.gaFac = fac; state.gaMeta = null;
    state.gaOff = onValue(ref(db, "gachaMeta/" + fac), (s) => { state.gaMeta = s.val() || {}; gachaRefresh(); }, (e) => console.error("gachaMeta", e));
  };
  sub(); setInterval(sub, 5000);   // ติดเชื้อกลายเป็นซอมบี้ → เปลี่ยนไปฟังกองของฝั่งใหม่
  // ตั๋วค้าง (ปิดเกมระหว่างหมุน) → รับของต่อให้อัตโนมัติ
  onValue(ref(db, "gachaTickets/" + state.uid), (s) => { state.gaTicket = s.val(); gachaRefresh(); if (s.val()) setTimeout(() => gachaClaim(), 500); }, (e) => console.error("gachaTickets", e));
}
function gachaRefresh() {
  const m = $("mkt-modal"); if (!m || m.classList.contains("hidden")) return;
  if (document.activeElement?.tagName === "INPUT" && m.contains(document.activeElement)) return;
  renderMarket();
}

// หมุน: จ่ายของ + เอาช่องสุ่มออกจาก meta + สร้างตั๋ว ในคำสั่งเดียว (ใครแย่งช่องเดียวกันก่อน = rules ปฏิเสธ ลองใหม่ได้ ไม่เสียของ)
async function gachaPull() {
  const p = state.profile, fac = p?.faction, cost = GACHA_COST[fac];
  if (!cost || state.gaBusy || state.gaTicket || !mktGuard()) return;
  if (HAS_DOM && (document.querySelector(".ga-spin") || Date.now() < (state.gaCool || 0))) return;   // กันกดรัวทะลุจากปุ่ม ข้าม/รับของ ลงมาโดนปุ่มหมุน
  { const cap = Math.round(T("gacha_cap", 0)); if (cap > 0 && gachaToday() >= cap) return toast(`วันนี้หมุนครบ ${cap} ครั้งแล้ว พรุ่งนี้ค่อยมาใหม่`); }
  const keys = Object.keys(state.gaMeta || {});
  if (!keys.length) return toast("ตู้กาชาว่างแล้ว รอแอดมินเติมของ");
  if (mktHave(cost.id) < cost.qty) return toast(`ของไม่พอ — ต้องมี ${mktLabel(cost.id)} ×${cost.qty}`);
  const slot = keys[Math.floor(Math.random() * keys.length)];
  const u = { [`gachaTickets/${state.uid}`]: { f: fac, slot, ts: serverTimestamp() }, [`gachaMeta/${fac}/${slot}`]: null };
  mktDebit(u, cost.id, cost.qty);
  state.gaBusy = true;
  try { await update(ref(db), u); }
  catch (e) { state.gaBusy = false; return toast(gachaIsPerm(e) ? "หมุนไม่สำเร็จ — อาจมีคนหมุนช่องเดียวกันก่อน ลองอีกครั้ง (ของยังไม่ถูกหัก)" : "ทำรายการไม่สำเร็จ"); }
  state.gaBusy = false; gachaTodayAdd();
  await gachaClaim({ f: fac, slot });
}
// รับของตามตั๋ว: เติมของเข้ากระเป๋า + ลบตั๋ว + ลบช่องออกจากกอง ในคำสั่งเดียว (rules บังคับให้ของตรงกับช่องและจำนวนไม่เกิน)
// อ่านจำนวนของจากเซิร์ฟเวอร์ตรงๆ (REST) — กันค่าในแคชของแท็บนี้ล้าหลัง (เช่น เปิดหลายแท็บ/เครื่อง) ซึ่งทำให้ rules ปฏิเสธการรับของ
async function gachaServerQty(id) {
  try {
    const tok = await auth.currentUser.getIdToken();
    const r = await fetch(`${firebaseConfig.databaseURL}/inventory/${state.uid}/${id}/qty.json?auth=${encodeURIComponent(tok)}`, { cache: "no-store" });
    if (!r.ok) return null;
    const v = await r.json(); return typeof v === "number" ? v : 0;
  } catch { return null; }
}
async function gachaClaim(ticket, fresh) {
  const t = ticket || state.gaTicket, uid = state.uid; if (!t || state.gaBusy) return;
  state.gaBusy = true; let again = false;
  try {
    let prize;
    try { prize = (await get(ref(db, `gachaPool/${t.f}/${t.slot}`))).val(); }
    catch (e0) {
      // อ่านรางวัลไม่ได้ = ตั๋วใบนี้ไม่อยู่บนเซิร์ฟเวอร์แล้ว (เช่น รับสำเร็จไปแล้วจากอีกแท็บ/เครื่อง) ไม่ใช่ปัญหาสิทธิ์ของของ → เลิกวนซ้ำ
      if (gachaIsPerm(e0)) { state.gaTicket = null; state.gaRetried = true; console.warn("gachaClaim: ตั๋วหายจากเซิร์ฟเวอร์แล้ว", t); toast("ตั๋วใบนี้ถูกใช้ไปแล้ว (อาจรับของจากอีกแท็บ/เครื่อง) — ตรวจกระเป๋าดูได้เลย"); return; }
      throw e0;
    }
    const u = { [`gachaTickets/${uid}`]: null };
    if (prize) {
      let have = (await get(ref(db, `inventory/${uid}/${prize.id}/qty`))).val() || 0;
      { const sv = await gachaServerQty(prize.id); if (sv !== null) { if (sv !== have) console.warn("gachaClaim: แคชล้าหลัง", { cache: have, server: sv }); have = sv; } }   // อ่านค่าจริงจากเซิร์ฟเวอร์ทุกครั้ง (rules เทียบกับจำนวนจริง ไม่ใช่แคช)
      state.gaDbg = `${prize.id}×${prize.qty} มี ${have}`;
      const after = Math.min(99, have + prize.qty);
      u[`inventory/${uid}/${prize.id}`] = { id: prize.id, qty: after };
      u[`gachaPool/${t.f}/${t.slot}`] = null;
    }
    await update(ref(db), u);
    state.gaTicket = null; state.gaRetried = false; state.gaFail = "";
    if (prize) {
      state.gaLast = { id: prize.id, qty: prize.qty };
      questBump("gacha");
      gachaSpinAnim(prize);   // แอนิเมชันหมุนแบบเปิดกล่อง (ของเข้ากระเป๋าไปแล้ว ตัวนี้เป็นแค่ภาพ) — จบแล้วค่อยขึ้นข้อความ
    } else toast("ช่องนี้ว่างแล้ว (แอดมินล้างตู้) — ตั๋วถูกยกเลิก");
  } catch (e) {
    const code = String(e?.code || e?.message || e).replace(/^.*?:\s*/, "").slice(0, 40);
    console.error("gachaClaim", e?.code || e, { ticket: t, uid });
    state.gaFail = code;
    toast(`รับของไม่สำเร็จ (${code}) — กด “รับของที่ค้างอยู่” อีกครั้ง`);
    try { logLine(`🎰 รับของกาชาไม่สำเร็จ: ${code} (ตั๋ว ${t.f}/${String(t.slot).slice(0, 4)}… ${state.gaDbg || "?"}) — แจ้งเจ้าของเกมพร้อมข้อความนี้ได้`, "system"); } catch { /* ข้าม */ }
    if (!fresh && gachaIsPerm(e)) again = true;   // ลองใหม่ทันที 1 ครั้งโดยอ่านค่าจริงจากเซิร์ฟเวอร์
    else if (!state.gaRetried && gachaIsPerm(e)) { state.gaRetried = true; setTimeout(() => { if (state.gaTicket && !state.gaBusy) gachaClaim(null, true); }, 4000); }
  }
  finally { state.gaBusy = false; gachaRefresh(); }
  if (again) return gachaClaim(t, true);
}

/* ---------- แอนิเมชันกาชา: เลื่อนแถบไอเทมแล้วหยุดที่ของที่ได้ (เหมือนเปิดกล่อง) ---------- */
const GA_TIERS = [["common", "ธรรมดา", "#8a93a0"], ["uncommon", "ดี", "#4aa3ff"], ["rare", "หายาก", "#a55cff"], ["legend", "ตำนาน", "#ffc247"]];
function gachaTier(id, qty) {
  const d = ITEMS[id]; if (!d) return 0;
  if (d.type === "stat") return 3;   // แคปซูล/แกนทะลุขีดจำกัด = รางวัลสูงสุดเสมอ
  if (d.type && d.type !== "consumable" && d.type !== "material") return 2;
  const v = ((d.heal || 0) + (d.food || 0) + (d.water || 0) + (d.stamina || 0) || 25) * Math.max(1, qty || 1);
  return v >= 200 ? 3 : v >= 120 ? 2 : v >= 60 ? 1 : 0;
}
function gachaSpinAnim(prize) {
  const t = gachaTier(prize.id, prize.qty), T = GA_TIERS[t];
  const finish = (quiet) => {
    if (!quiet) toast(`🎰 ได้ ${mktLabel(prize.id)} ×${prize.qty}`);   // มีหน้าต่างผลลัพธ์อยู่แล้วไม่ต้องเด้งซ้ำ
    logLine(`🎰 หมุนตู้กาชา ได้ ${mktLabel(prize.id)} ×${prize.qty}${t >= 2 ? ` (${T[1]})` : ""}`, "system");
    if (t === 3 && /^[a-z0-9_]{1,12}$/.test(prize.id)) { try { feedPost(5, prize.id); } catch { /* ข้าม */ } }
  };
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!HAS_DOM || reduce) return finish();
  const ids = Object.keys(ITEMS).filter((k) => ITEMS[k].icon), N = 44, WIN = 36, CW = 84;
  const wrap = mk("div", "modal ga-spin"); wrap.setAttribute("role", "dialog");
  const box = mk("div", "modal-box ga-box");
  box.append(mk("h3", "", "🎰 ตู้กาชา"));
  const view = mk("div", "ga-view"), track = mk("div", "ga-track");
  for (let i = 0; i < N; i++) {
    const id = i === WIN ? prize.id : ids[Math.floor(Math.random() * ids.length)], tt = i === WIN ? t : gachaTier(id, 1 + Math.floor(Math.random() * 3));
    const c = mk("div", "ga-cell"); c.style.setProperty("--tc", GA_TIERS[tt][2]); c.append(mk("span", "ga-ic", ITEMS[id].icon || "📦"));
    track.append(c);
  }
  view.append(track, mk("div", "ga-mark")); box.append(view);
  const res = mk("div", "ga-res"); res.style.setProperty("--tc", T[2]); box.append(res);
  const ok = btn("ข้าม", () => end(), "btn ghost mini"); box.append(ok);
  wrap.append(box); document.body.append(wrap);
  let done = false, timer = 0, tick = 0;
  const end = () => {
    if (done) { state.gaCool = Date.now() + 1200; wrap.remove(); return; }
    done = true; state.gaCool = Date.now() + 1200; clearTimeout(timer); clearInterval(tick);
    track.style.transition = "none"; track.style.transform = `translateX(${-(WIN * CW) + (view.clientWidth / 2 - CW / 2)}px)`;
    res.textContent = ""; res.append(mk("div", "ga-tier", `✨ ${T[1]}`), mk("div", "ga-nm", `${mktLabel(prize.id)} ×${prize.qty}`));
    box.classList.add("ga-done", "ga-t" + t); ok.textContent = "รับของ"; sfx(t >= 2 ? "boss" : "low"); finish(true);
  };
  const off = Math.floor((Math.random() - 0.5) * (CW * 0.6));
  requestAnimationFrame(() => requestAnimationFrame(() => {
    track.style.transition = "transform 4.8s cubic-bezier(.08,.62,.13,1)";
    track.style.transform = `translateX(${-(WIN * CW) + (view.clientWidth / 2 - CW / 2) + off}px)`;
  }));
  tick = setInterval(() => { try { if (SFX.on && SFX.ac) tone(900, 0, 0.03, "square", 0.02); } catch { /* ข้าม */ } }, 140);
  timer = setTimeout(() => { clearInterval(tick); setTimeout(end, 350); }, 4900);
}

/* ---------- แอดมิน ---------- */
async function gachaChunks(u) {   // แบ่งเขียนทีละ ≤200 เส้นทาง
  const ks = Object.keys(u);
  for (let i = 0; i < ks.length; i += 200) await update(ref(db), Object.fromEntries(ks.slice(i, i + 200).map((k) => [k, u[k]])));
}
async function gachaAdminAdd(f, id, qty, n) {
  if (!isStaff() || !GACHA_ITEMS[f]) return;
  if (!GACHA_ITEMS[f].includes(id)) return toast("ไอเทมนี้ใส่ตู้ฝั่งนี้ไม่ได้");
  const q = Math.max(1, Math.min(GACHA_QTY_MAX, parseInt(qty, 10) || 1)), c = Math.max(1, Math.min(100, parseInt(n, 10) || 1)), u = {};
  for (let i = 0; i < c; i++) { const k = gachaKey(); u[`gachaPool/${f}/${k}`] = { id, qty: q }; u[`gachaMeta/${f}/${k}`] = true; }
  try { await gachaChunks(u); toast(`เพิ่ม ${mktLabel(id)} ×${q} จำนวน ${c} ช่อง เข้าตู้${FACTION[f].name}แล้ว`); gachaRefresh(); }
  catch (e) { toast(errMsg(e)); }
}
async function gachaAdminSeed(f) {
  if (!isStaff() || !GACHA_SEED[f]) return;
  if (!confirm(`เติมกองเริ่มต้น 100 ช่องให้ตู้${FACTION[f].name}? (ของที่มีอยู่แล้วในตู้จะยังอยู่ ไม่ถูกลบ)`)) return;
  const u = {};
  GACHA_SEED[f].forEach(([id, qty, n]) => { for (let i = 0; i < n; i++) { const k = gachaKey(); u[`gachaPool/${f}/${k}`] = { id, qty }; u[`gachaMeta/${f}/${k}`] = true; } });
  try { await gachaChunks(u); toast(`เติมกองเริ่มต้นตู้${FACTION[f].name}แล้ว (${Object.keys(u).length / 2} ช่อง)`); gachaRefresh(); }
  catch (e) { toast(errMsg(e)); }
}
async function gachaAdminClear(f) {
  if (!isStaff() || !GACHA_ITEMS[f]) return;
  if (!confirm(`ล้างตู้${FACTION[f].name}ทั้งหมด? ช่องที่เหลือจะหายไป (ผู้เล่นที่ถือตั๋วค้างอยู่จะไม่ได้ของ)`)) return;
  try {
    const [pool, meta] = await Promise.all([get(ref(db, "gachaPool/" + f)), get(ref(db, "gachaMeta/" + f))]), u = {};
    Object.keys(pool.val() || {}).forEach((k) => { u[`gachaPool/${f}/${k}`] = null; });
    Object.keys(meta.val() || {}).forEach((k) => { u[`gachaMeta/${f}/${k}`] = null; });
    await gachaChunks(u); toast(`ล้างตู้${FACTION[f].name}แล้ว`); gachaRefresh();
  } catch (e) { toast(errMsg(e)); }
}
async function gachaAdminPeek(f) {   // ดูองค์ประกอบของที่เหลือในตู้ (เฉพาะแอดมินอ่านได้)
  if (!isStaff()) return;
  try {
    const pool = (await get(ref(db, "gachaPool/" + f))).val() || {}, meta = (await get(ref(db, "gachaMeta/" + f))).val() || {}, cnt = {};
    Object.entries(pool).forEach(([k, v]) => { if (meta[k]) { const key = `${v.id}|${v.qty}`; cnt[key] = (cnt[key] || 0) + 1; } });
    state.gaPeek = { f, rows: Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, n]) => { const [id, q] = k.split("|"); return `${mktLabel(id)} ×${q} : ${n} ช่อง`; }) };
    gachaRefresh(); renderMarket();
  } catch (e) { toast(errMsg(e)); }
}

function gachaRender(body, card, row) {
  const fac = state.profile?.faction, cost = GACHA_COST[fac]; if (!cost) return;
  const safe = state.zone === "safe", left = state.gaMeta ? Object.keys(state.gaMeta).length : null, enough = mktHave(cost.id) >= cost.qty;
  const box = card("🎰 ตู้กาชา");
  box.append(mk("span", "muted", `หมุน 1 ครั้ง = จ่าย ${mktLabel(cost.id)} ×${cost.qty} (ของที่จ่ายหายไปจากระบบ) • ได้ของเอาชีวิตรอด 1 ชุดจากกองของ${FACTION[fac].name} • ของหายากมีจำนวนจำกัด หมดแล้วหมดเลย • หมุนได้เฉพาะใน Safe Zone • ถ้าของในกระเป๋าครบ 99 ส่วนเกินจะหาย`));
  const r = row();
  r.append(mk("span", "", left === null ? "กำลังโหลด…" : left > 0 ? `ในตู้เหลือ ${left} ช่อง` : "ตู้ว่าง — รอแอดมินเติมของ"));
  if (state.gaTicket) r.append(btn("รับของที่ค้างอยู่", () => gachaClaim(), "btn primary mini"));
  else {
    const b = btn(state.gaBusy ? "กำลังหมุน…" : "หมุน", gachaPull, "btn primary mini");
    b.disabled = !!state.gaBusy || !safe || !enough || !left;
    b.title = !safe ? "หมุนได้เฉพาะใน Safe Zone" : !enough ? "ของไม่พอ" : !left ? "ตู้ว่าง" : "";
    r.append(b);
  }
  box.append(r);
  { const cap = Math.round(T("gacha_cap", 0)); if (cap > 0) box.append(mk("span", "muted", `โควตาวันนี้: หมุนแล้ว ${gachaToday()}/${cap} ครั้ง`)); }
  if (state.gaLast) box.append(mk("span", "", `ครั้งล่าสุดได้: ${mktLabel(state.gaLast.id)} ×${state.gaLast.qty}`));
  if (isStaff()) gachaAdminPanel(box, row);
  body.append(box);
}
function gachaAdminPanel(box, row) {
  const F = state.gaForm; if (!F.f) F.f = state.profile?.faction || "human";
  const wrap = mk("div"); wrap.style.cssText = "border-top:1px dashed var(--line);margin-top:6px;padding-top:8px;display:grid;gap:6px";
  wrap.append(mk("b", "", "🛠️ แอดมิน — จัดการตู้"));
  const r0 = row(); r0.append(mk("span", "", "ตู้ฝั่ง"), mktSelect(["human", "zombie"].map((x) => x), F.f, (v) => { F.f = v; if (!GACHA_ITEMS[v].includes(F.id)) F.id = GACHA_ITEMS[v][0]; renderMarket(); }));
  r0.firstChild.nextSibling.querySelectorAll("option").forEach((o) => { o.textContent = FACTION[o.value].icon + " " + FACTION[o.value].name; });
  if (!GACHA_ITEMS[F.f].includes(F.id)) F.id = GACHA_ITEMS[F.f][0];
  const r1 = row(), num = (key, max) => { const i = mk("input"); i.type = "number"; i.min = 1; i.max = max; i.value = F[key]; i.style.cssText = "width:60px"; i.addEventListener("input", () => { F[key] = i.value; }); return i; };
  r1.append(mk("span", "", "ของ"), mktSelect(GACHA_ITEMS[F.f], F.id, (v) => { F.id = v; }), mk("span", "muted", "ชิ้น/ช่อง"), num("qty", GACHA_QTY_MAX), mk("span", "muted", "× ช่อง"), num("n", 100));
  const r2 = row(); r2.append(btn("เพิ่มเข้าตู้", () => gachaAdminAdd(F.f, F.id, F.qty, F.n), "btn primary mini"), btn("เติมกองเริ่มต้น 100 ช่อง", () => gachaAdminSeed(F.f), "btn ghost mini"));
  const r3 = row(); r3.append(btn("ดูของที่เหลือ", () => gachaAdminPeek(F.f), "btn ghost mini"), btn("ล้างตู้", () => gachaAdminClear(F.f), "btn danger mini"));
  wrap.append(r0, r1, r2, r3);
  if (state.gaPeek && state.gaPeek.f === F.f) { const pk = mk("div", "muted", state.gaPeek.rows.length ? "ในตู้ตอนนี้: " + state.gaPeek.rows.join(" • ") : "ตู้ว่าง"); wrap.append(pk); }
  wrap.append(mk("span", "muted", `ใส่ได้เฉพาะของเอาชีวิตรอดของฝั่งนั้น (ไม่มีอาวุธ) ชิ้นละ ≤ ${GACHA_QTY_MAX} ต่อช่อง — ผู้เล่นเห็นแค่จำนวนช่อง ไม่เห็นว่าข้างในคืออะไร`));
  box.append(wrap);
}

/* =========================================================
   18) ภารกิจรายวัน / รายสัปดาห์ / ผู้เล่นใหม่
   นิยามเควสอยู่ที่ config/questDefs (เจ้าของเขียนได้) — เพิ่ม/แก้เควสได้โดยไม่ต้องแตะ rules
   ความคืบหน้า = questProg/{uid}/{daily|weekly|newbie}/{qid} = { k: รอบเวลา, n: จำนวน, ts, c?: รับรางวัลแล้ว }
   รอบเวลาใช้เวลาไทย (UTC+7): รายวันรีเซ็ตเที่ยงคืน / รายสัปดาห์รีเซ็ตเที่ยงคืนคืนวันอาทิตย์→จันทร์
   ========================================================= */
const QP_PERIODS = [["daily", "📅 รายวัน"], ["weekly", "🗓️ รายสัปดาห์"], ["newbie", "🌱 ผู้เล่นใหม่ (ทำครั้งเดียว)"]];
const QP_EVENTS = "search=ค้นหา, hit=โจมตี(ทุกแบบ), wboss=ตีบอสโลก, craft=คราฟต์, use=ใช้ไอเทม, travel=เดินทาง, market=ซื้อ/ขายตลาด, gacha=หมุนกาชา, chat=แชท, wall=ซ่อมกำแพงค่าย, smash=ทุบกำแพง(ซอมบี้), bite=กัดเหยื่อ(ซอมบี้), login=เข้าเล่น(นับวันละครั้ง), siege=ทุบ/ซ่อมกำแพงช่วงคืนปิดล้อม, siegen=ร่วมคืนปิดล้อม(วันละครั้ง), dclaim=รับรางวัลเควสรายวัน, goalok=ร่วมเป้าหมายร่วมสำเร็จ(เกมเรียกให้เอง), gmok=ร่วมภารกิจกลุ่มสำเร็จ(เกมเรียกให้เอง) — เควสรายวันผูกโซนใส่ฟิลด์ z=รหัสโซน และ dw=วันในสัปดาห์ (0=จันทร์…6=อาทิตย์)";
const QP_GAP_MS = 4200;                       // rules: แต่ละเควสนับได้อย่างน้อยห่างกัน 4 วินาที
const QP_TZ_MS = 7 * 3600000, QP_DAY_MS = 86400000;
// ค่าเริ่มต้น (ปุ่ม "เติมเควสเริ่มต้น" ของเจ้าของ) — ของรางวัลต้องเป็นของเอาชีวิตรอดเท่านั้น (rules จำกัด) / f = จำกัดฝ่าย (ไม่ใส่ = ทั้งสองฝ่าย)
const QP_SEED = {
  daily: {
    d1: { title: "ออกค้นหา 5 ครั้ง", ev: "search", need: 5, r: { human: { id: "scrap", qty: 2 }, zombie: { id: "rotten_meat", qty: 1 } } },
    d2: { title: "โจมตี 3 ครั้ง (ซอมบี้/บอส/ผู้เล่น)", ev: "hit", need: 3, r: { human: { id: "bandage", qty: 1 }, zombie: { id: "bandage", qty: 1 } } },
    d3: { title: "ใช้ไอเทม 2 ครั้ง", ev: "use", need: 2, r: { human: { id: "water", qty: 1 }, zombie: { id: "water", qty: 1 } } }
  },
  weekly: {
    w1: { title: "ออกค้นหา 40 ครั้ง", ev: "search", need: 40, r: { human: { id: "scrap", qty: 8 }, zombie: { id: "rotten_meat", qty: 4 } } },
    w2: { title: "โจมตีบอสโลก 3 ครั้ง", ev: "wboss", need: 3, r: { human: { id: "stim_shot", qty: 1 }, zombie: { id: "stim_shot", qty: 1 } } },
    w3: { title: "ซื้อ/ขายในตลาด 3 ครั้ง", ev: "market", need: 3, r: { human: { id: "water_jug", qty: 1 }, zombie: { id: "water_jug", qty: 1 } } },
    w4: { title: "เดินทางระหว่างโซน 10 ครั้ง", ev: "travel", need: 10, r: { human: { id: "energy_drink", qty: 1 }, zombie: { id: "energy_drink", qty: 1 } } },
    w5: { title: "คราฟต์ 5 ครั้ง", ev: "craft", need: 5, f: "human", r: { human: { id: "army_meal", qty: 1 }, zombie: { id: "army_meal", qty: 1 } } },
    w6: { title: "ซ่อมกำแพงค่าย 5 ครั้ง", ev: "wall", need: 5, f: "human", r: { human: { id: "bandage", qty: 2 }, zombie: { id: "bandage", qty: 2 } } }
  },
  newbie: {
    n1: { title: "ออกค้นหาไอเทมครั้งแรก", desc: "กดปุ่ม ค้นหาไอเทม", ev: "search", need: 1, r: { human: { id: "scrap", qty: 2 }, zombie: { id: "rotten_meat", qty: 1 } } },
    n2: { title: "ส่งข้อความในแชท", desc: "พิมพ์ทักทายผู้เล่นในโซน", ev: "chat", need: 1, r: { human: { id: "water", qty: 1 }, zombie: { id: "water", qty: 1 } } },
    n3: { title: "ใช้ไอเทมครั้งแรก", desc: "เปิดกระเป๋าแล้วกดใช้ของสักชิ้น", ev: "use", need: 1, r: { human: { id: "bandage", qty: 1 }, zombie: { id: "bandage", qty: 1 } } },
    n4: { title: "เดินทางไปโซนอื่น", desc: "ใช้พลังงานเดินทางออกจากโซนปัจจุบัน", ev: "travel", need: 1, r: { human: { id: "canned_food", qty: 2 }, zombie: { id: "rotten_meat", qty: 2 } } },
    n5: { title: "ซื้อหรือลงขายของในตลาด", desc: "ปุ่ม ตลาด (ต้องอยู่ Safe Zone)", ev: "market", need: 1, r: { human: { id: "scrap", qty: 3 }, zombie: { id: "rotten_meat", qty: 1 } } },
    n6: { title: "โจมตีครั้งแรก", desc: "สู้กับซอมบี้/บอส/ผู้เล่นนอก Safe Zone", ev: "hit", need: 1, r: { human: { id: "medkit", qty: 1 }, zombie: { id: "medkit", qty: 1 } } },
    n7: { title: "คราฟต์ไอเทมครั้งแรก", desc: "มนุษย์เท่านั้น — ทำที่ Safe Zone", ev: "craft", need: 1, f: "human", r: { human: { id: "bread", qty: 2 }, zombie: { id: "bread", qty: 2 } } }
  }
};
const qpDayKey = (ms) => Math.floor((ms + QP_TZ_MS) / QP_DAY_MS);
function qpKey(per, ms = serverNow()) { const d = qpDayKey(ms); return per === "daily" ? d : per === "weekly" ? Math.floor((d + 3) / 7) : 0; }
function qpResetIn(per, ms = serverNow()) {
  if (per === "newbie") return null;
  const d = qpDayKey(ms), next = per === "daily" ? d + 1 : (Math.floor((d + 3) / 7) + 1) * 7 - 3;
  return next * QP_DAY_MS - QP_TZ_MS - ms;
}
function qpFmt(ms) { const m = Math.max(0, Math.ceil(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return d ? `${d} วัน ${h} ชม.` : h ? `${h} ชม. ${m % 60} นาที` : `${m} นาที`; }
function qpList(per) {   // เควสที่ฝ่ายของฉันทำได้ เรียงตามรหัส
  return Object.entries(state.qDefs?.[per] || {}).filter(([, d]) => d && (d.dw === undefined || d.dw === qpWd())).filter(([, d]) => d && !d.f || d && d.f === state.profile?.faction).filter(([qid, d]) => npcQuestShown(per, qid, d))
    .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
}
function qpState(per, qid) {
  const d = state.qDefs?.[per]?.[qid], cur = state.qProg?.[per]?.[qid], same = !!cur && cur.k === qpKey(per);
  const n = same ? Math.min(cur.n, d ? d.need : cur.n) : 0;
  return { d, n, claimed: same && cur.c === true, done: !!d && n >= d.need, ts: same ? cur.ts : 0, cur: same ? cur : null };
}
const qpClaimable = () => QP_PERIODS.reduce((s, [per]) => s + qpList(per).filter(([qid]) => { const x = qpState(per, qid); return x.done && !x.claimed; }).length, 0);

// เรียกจากจุดต่างๆ ของเกมหลังทำสำเร็จ — ไม่รอ ไม่โยน error (ความคืบหน้าพลาดไม่กระทบการกระทำจริง)
let qpChain = Promise.resolve();
function questBump(evName) { try { achEv(evName); } catch { /* ข้าม */ } qpChain = qpChain.then(() => qpBumpRun(evName)).catch((e) => console.warn("quest", e?.code || e)); }
async function qpBumpRun(evName) {
  const uid = state.uid; if (!state.qDefs || !uid || !state.profile || state.profile.banned) return;
  for (const [per] of QP_PERIODS) for (const [qid, d] of qpList(per)) {
    if (d.ev !== evName) continue;
    if (d.z && d.z !== state.zone) continue;   // เควสผูกโซน: นับเฉพาะตอนอยู่โซนนั้น (rules ตรวจโซนปัจจุบันซ้ำ)
    let x = qpState(per, qid);
    if (x.done || x.claimed) continue;
    if ((evName === "login" || evName === "siegen") && x.n > 0 && qpDayKey(x.ts) === qpDayKey(serverNow())) continue;   // เช็กอิน: นับวันละครั้งต่อเควส
    if (evName === "dclaim" && x.n > 0 && serverNow() - x.ts < QP_GAP_MS) {   // รับรางวัลหลายข้อติดกัน: รอให้พ้นช่วงห่างที่ rules ยอมแล้วค่อยนับ (ไม่ทิ้ง)
      await new Promise((r) => setTimeout(r, QP_GAP_MS - (serverNow() - x.ts) + 300)); x = qpState(per, qid);
      if (x.done || x.claimed) continue;
    }
    if (x.n > 0 && serverNow() - x.ts < QP_GAP_MS) continue;   // ถี่เกินกว่าที่ rules ยอม — ครั้งนี้ไม่นับ
    try {
      await set(ref(db, `questProg/${uid}/${per}/${qid}`), { k: qpKey(per), n: x.n + 1, ts: serverTimestamp() });
      if (x.n + 1 >= d.need) toast(`📜 ภารกิจสำเร็จ: ${d.title} — กดปุ่ม “ภารกิจ” เพื่อรับรางวัล`);
    } catch (e) { console.warn("quest progress", per, qid, e?.code || e); }
  }
}

async function qpClaim(per, qid) {
  const x = qpState(per, qid), p = state.profile, uid = state.uid;
  if (!x.d || !x.cur || !x.done || x.claimed || state.qpBusy || !p) return false;
  const rw = x.d.r && x.d.r[p.faction]; if (!rw) return false;
  state.qpBusy = true; qpRefresh();
  try {
    const have = (await get(ref(db, `inventory/${uid}/${rw.id}/qty`))).val() || 0;
    if (have >= 99) { toast(`ช่อง ${mktLabel(rw.id)} เต็ม (99) — ใช้หรือขายก่อนจึงรับรางวัลได้`); return false; }
    const u = {
      [`questProg/${uid}/${per}/${qid}`]: { k: x.cur.k, n: x.cur.n, ts: x.cur.ts, c: true },
      [`questClaim/${uid}`]: { t: per, q: qid, ts: serverTimestamp() },
      [`inventory/${uid}/${rw.id}`]: { id: rw.id, qty: Math.min(99, have + rw.qty) }
    };
    await update(ref(db), u);
    toast(`🎁 รับรางวัล ${mktLabel(rw.id)} ×${rw.qty}`); logLine(`📜 ภารกิจ “${x.d.title}” สำเร็จ — ได้ ${mktLabel(rw.id)} ×${rw.qty}`, "system");
    if (per === "daily") questBump("dclaim"); else if (per === "weekly") achBump("wclaim");
    return true;
  } catch (e) { console.error("qpClaim", e?.code || e); toast(String(e?.code || e).includes("PERMISSION_DENIED") ? "รับรางวัลไม่สำเร็จ — ลองใหม่อีกครั้ง (ข้อมูลอาจเพิ่งเปลี่ยนรอบ)" : "ทำรายการไม่สำเร็จ"); return false; }
  finally { state.qpBusy = false; qpRefresh(); }
}
async function qpClaimAll() {
  for (const [per] of QP_PERIODS) for (const [qid] of qpList(per)) { const x = qpState(per, qid); if (x.done && !x.claimed) { if (!(await qpClaim(per, qid))) return; } }
}
async function qpSeed() {
  if (state.profile?.role !== "owner") return;
  if (!confirm("เติมเควสเริ่มต้น?\nนิยามเควสทั้งหมดใน config/questDefs จะถูกแทนที่ด้วยชุดเริ่มต้น (ความคืบหน้าของผู้เล่นไม่หาย)")) return;
  try { await set(ref(db, "config/questDefs"), QP_SEED); toast("เติมเควสเริ่มต้นแล้ว"); }
  catch (e) { console.error("qpSeed", e?.code || e); toast(errMsg(e)); }
}

// เช็กอิน: เปิดเกม (และข้ามเที่ยงคืนระหว่างเปิดค้าง) นับ 1 ครั้งต่อวัน — ใช้ระบบเควสเดิม ไม่แตะ rules
function qpLoginCheck() {
  if (!state.qDefs || !state.qProgReady || !state.profile || state.profile.banned) return;
  const day = qpDayKey(serverNow()); if (state.qpLoginDay === day) return;
  state.qpLoginDay = day; questBump("login");
}
function qpListen() {
  if (state.qpOn || !state.uid) return; state.qpOn = true;
  state.qDefs = null; state.qProg = {}; state.qProgReady = false;
  const b = btn("📜 ภารกิจ", qpOpen, "btn ghost mini"); b.id = "btn-quests"; $("btn-profile").before(b);
  onValue(ref(db, "config/questDefs"), (s) => { state.qDefs = s.val() || {}; qpRefresh(); qpLoginCheck(); }, (e) => console.error("questDefs", e));
  onValue(ref(db, "questProg/" + state.uid), (s) => { state.qProg = s.val() || {}; state.qProgReady = true; qpRefresh(); qpLoginCheck(); }, (e) => console.error("questProg", e));
  setInterval(() => { qpRefresh(); qpLoginCheck(); }, 30000);   // อัปเดตนับถอยหลัง/ข้ามรอบเที่ยงคืน
  npcListen();
}
function qpRefresh() {
  const b = $("btn-quests"); if (b) { const n = qpClaimable(); b.textContent = n ? `📜 ภารกิจ (${n} รับได้)` : "📜 ภารกิจ"; }
  const m = $("qp-modal"); if (m && !m.classList.contains("hidden")) qpRender();
}
function qpOpen() {
  if (!$("qp-modal")) {
    const m = mk("div", "modal hidden"); m.id = "qp-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "📜 ภารกิจ"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "qp-body"; body.style.cssText = "display:grid;gap:12px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  qpRender(); $("qp-modal").classList.remove("hidden");
}
function QP_ATT_Q() {
  const l = qpList("weekly").filter(([, d]) => d.ev === "login"); if (!l.length) return null;
  const st = l.map(([qid, d]) => ({ qid, d, x: qpState("weekly", qid), rw: d.r && d.r[state.profile?.faction] })).sort((a, b) => a.d.need - b.d.need);
  const n = Math.max(...st.map((q) => q.x.n)), max = Math.max(...st.map((q) => q.d.need));
  return { n, max, next: st.find((q) => q.d.need > n) };
}
function qpRender() {
  const body = $("qp-body"); if (!body) return; body.innerHTML = "";
  const row = () => { const r = mk("div"); r.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px"; return r; };
  const card = (title) => { const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px"; c.append(mk("b", "", title)); return c; };
  const att = QP_ATT_Q();   // เช็กอินรายสัปดาห์ (เควสสะสมวันที่เข้าเล่น)
  if (att) {
    const c = card(`🔥 เช็กอินสัปดาห์นี้ ${att.n}/${att.max} วัน`);
    c.append(mk("div", "", Array.from({ length: att.max }, (_, i) => (i < att.n ? "🔥" : "⚪")).join(" ")));
    c.append(mk("span", "muted", att.next ? `อีก ${att.next.d.need - att.n} วัน ได้ ${att.next.rw ? mktLabel(att.next.rw.id) + " ×" + att.next.rw.qty : "รางวัล"} (${att.next.d.title}) • เข้าเล่นวันละครั้งก็นับ รีเซ็ตเที่ยงคืนคืนวันอาทิตย์` : "ครบทุกขั้นของสัปดาห์นี้แล้ว — กลับมาใหม่สัปดาห์หน้า"));
    body.append(c);
  }
  const n = qpClaimable();
  if (n > 1) { const r = row(); r.append(mk("span", "", `มีรางวัลรอรับ ${n} รายการ`), btn("รับทั้งหมด", qpClaimAll, "btn primary mini")); body.append(r); }
  if (state.qDefs === null) body.append(mk("span", "muted", "กำลังโหลด…"));
  let any = false;
  for (const [per, label] of QP_PERIODS) {
    const list = qpList(per); if (!list.length) continue; any = true;
    const allClaimed = per === "newbie" && list.every(([qid]) => qpState(per, qid).claimed);
    const left = qpResetIn(per);
    const c = card(allClaimed ? "🌱 ภารกิจผู้เล่นใหม่ — รับครบแล้ว ✓" : label + (left !== null ? ` — รีเซ็ตในอีก ${qpFmt(left)}` : ""));
    if (!allClaimed) list.forEach(([qid, d]) => {
      const x = qpState(per, qid), rw = d.r && d.r[state.profile?.faction];
      const box = mk("div"); box.style.cssText = "display:grid;gap:4px;padding-top:6px;border-top:1px dashed var(--line)";
      const r1 = row(); r1.append(mk("span", "", (x.claimed ? "✅ " : x.done ? "🎁 " : "▫️ ") + (d.z && ZONES[d.z] ? ZONES[d.z].icon + " " : "") + d.title), mk("span", "muted", `${x.n}/${d.need}`));
      const bar = mk("div"); bar.style.cssText = "height:6px;border-radius:3px;background:var(--line);overflow:hidden";
      const fill = mk("div"); fill.style.cssText = `height:100%;width:${Math.min(100, Math.round(x.n / d.need * 100))}%;background:var(--accent, #e0a030)`; bar.append(fill);
      const r2 = row(); r2.append(mk("span", "muted", rw ? `รางวัล: ${mktLabel(rw.id)} ×${rw.qty}` : ""));
      if (x.claimed) r2.append(mk("span", "muted", "รับแล้ว"));
      else { const b = btn(x.done ? "รับรางวัล" : "ยังไม่ครบ", () => qpClaim(per, qid), "btn primary mini"); b.disabled = !x.done || !!state.qpBusy; r2.append(b); }
      box.append(r1, bar); if (d.desc && !x.done) box.append(mk("span", "muted", d.desc)); box.append(r2); c.append(box);
    });
    body.append(c);
  }
  if (!any && state.qDefs !== null) body.append(mk("span", "muted", "ยังไม่มีภารกิจในตอนนี้"));
  if (state.profile?.role === "owner") {
    const c = card("🛠️ เจ้าของ — ข้อมูลเควส");
    c.append(mk("span", "muted", "เควสเก็บที่ config/questDefs (แก้รายข้อได้ที่ Firebase Console ไม่ต้องแก้ rules) เหตุการณ์ที่นับได้: " + QP_EVENTS + " • ของรางวัลต้องเป็นของเอาชีวิตรอดเท่านั้น ≤ 20 ชิ้น"));
    const r = row(); r.append(btn("เติมเควสเริ่มต้น", qpSeed, "btn primary mini"), btn("เติมเควสโซนรายวัน", qpSeedZone, "btn ghost mini"), btn("เติมเควส NPC", qpSeedNpc, "btn ghost mini"), btn("เติมเควสเช็กอิน+ปิดล้อม+เป้าหมายร่วม", qpSeedStreak, "btn ghost mini")); c.append(r); body.append(c);
  }
}


/* =========================================================
   19) กำแพง Safe Zone • สภาพโซนรายวัน • ค้นลึก
   - กำแพง: wall/safe = {hp, ts} ผุเอง 1 HP ต่อ 259,200 ms (1000 HP ≈ 3 วัน) คำนวณจากเวลา ไม่ต้องมีตัวจับเวลา
     มนุษย์ซ่อมด้วย scrap (1 ชิ้น = +10 HP, ครั้งละ ≤ 20) / HP = 0 → Safe Zone เปิด PvP + ซอมบี้บุกตอนค้นหา
     ตัวเลขทั้งหมดต้องตรงกับ wall / wallLog / attacks ใน database_rules.json (v7)
   - สภาพโซนรายวัน: สุ่มจากวัน (เวลาไทย) + โซน ทุกคนเห็นตรงกัน ไม่ต้องเก็บข้อมูล
   - ค้นลึก: พลังงาน ×2 ของหายากออกง่ายขึ้น แต่ซอมบี้มากขึ้น (ฝั่ง client ล้วน rules ไม่เปลี่ยน)
   ========================================================= */
const SMASH_EVERY = 5, SMASH_BREAK_BONUS = 3, PRIZE_MEAT = 5, PRIZE_MIN = 10, WEEK_MS = 604800000, WEEK_OFF = -320400000;   // รางวัลทุบกำแพง (ตรงกับ inventory/wallWeek/wallTop/wallPrize ใน rules) / สัปดาห์เริ่มจันทร์ 00:00 เวลาไทย
const wallWk = () => Math.floor((serverNow() + WEEK_OFF) / WEEK_MS);
const SMASH_DMG = 10, SMASH_STAM = 15, SMASH_CD = 30000;   // ซอมบี้ทุบกำแพง: ต้องตรงกับ wall/safe + users.lastSmash ใน rules (คลาดเคลื่อน ≤2)
const WALL_MAX = 1000, WALL_DIV = 259200, WALL_PER = 10, WALL_SPEND = 20, WALL_BREACH_Z = 25;

function wallHp() {
  const w = state.wall; if (!w || typeof w.hp !== "number" || typeof w.ts !== "number") return null;
  return Math.max(0, w.hp - (serverNow() - w.ts) / WALL_DIV);
}
function wallBroken() { const h = wallHp(); return h !== null && h <= 0; }
function wallDmod(z) { return z === "safe" && wallBroken() ? 6 : 0; }
function wallTimeText() {
  const h = wallHp(); if (h === null) return "";
  const mins = (h * WALL_DIV) / 60000;
  return mins >= 2880 ? `${(mins / 1440).toFixed(1)} วัน` : mins >= 120 ? `${Math.round(mins / 60)} ชั่วโมง` : `${Math.max(1, Math.round(mins))} นาที`;
}
function wallStyle() {
  if ($("wall-style")) return;
  const st = document.createElement("style"); st.id = "wall-style";
  st.textContent = ".wall-box{margin:4px 0;padding:4px 8px;border:1px solid var(--border,#444);border-radius:8px;background:rgba(0,0,0,.18);max-height:38vh;overflow:auto}"
    + ".wall-head{display:flex;gap:8px;align-items:center;cursor:pointer;user-select:none;font-size:.9em}"
    + ".wall-bar{flex:1;height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}"
    + ".wall-fill{height:100%;transition:width .4s;background:#5fb36b}.wall-fill.mid{background:#d9a441}.wall-fill.low,.wall-fill.bad{background:#c0392b}"
    + ".wall-note{margin:6px 0;font-size:.85em}.wall-btns{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0}"
    + ".wall-box.broken{border-color:#c0392b}#btn-deep.active{outline:1px solid var(--hazard,#d9a441)}";
  document.head.append(st);
}
function wallListen() {
  if (state.wallOn || !state.uid) return; state.wallOn = true;
  state.wall = null; state.wallLog = {}; state.wallBusy = false; state.wallWasBroken = null; state.wallWarned = false;
  wallStyle();
  state.wallHit = {}; state.wallTop = {}; state.wallWeek = null; state.wallPrize = null;
  onValue(ref(db, "wallTop"), (s) => { state.wallTop = s.val() || {}; wallRender(); }, (e) => console.error("wallTop", e));
  onValue(ref(db, "wallWeek/" + state.uid), (s) => { state.wallWeek = s.val(); wallRender(); }, (e) => console.error("wallWeek", e));
  onValue(ref(db, "wallPrize/" + state.uid), (s) => { state.wallPrize = s.val(); wallRender(); }, (e) => console.error("wallPrize", e));
  onValue(ref(db, "wallHit"), (s) => { state.wallHit = s.val() || {}; wallRender(); }, (e) => console.error("wallHit", e));
  onValue(ref(db, "wall/safe"), (s) => {
    const before = wallHp(); state.wall = s.val(); const after = wallHp();
    if (before !== null && after !== null && after < before - 5 && state.profile?.faction === "human" && state.zone === "safe") logLine(`🧟 เสียงทุบกำแพงค่ายดังสนั่น! กำแพงเหลือ ${Math.floor(after)}/${WALL_MAX} — ใครมี scrap รีบซ่อม`, "system");
    if (!state.wall && !state.wallMaking) {   // ยังไม่มีกำแพง → ใครก็ได้สร้างให้เต็ม 1000 (rules อนุญาตเฉพาะตอนยังไม่มี)
      state.wallMaking = true;
      set(ref(db, "wall/safe"), { hp: WALL_MAX, ts: serverTimestamp() }).catch(() => {}).finally(() => { state.wallMaking = false; });
    }
    wallSync();
  }, (e) => console.error("wall", e));
  onValue(ref(db, "wallLog"), (s) => { state.wallLog = s.val() || {}; wallRender(); }, (e) => console.error("wallLog", e));
  setInterval(wallSync, 30000);
}
function wallSync() {
  const h = wallHp(), broken = h !== null && h <= 0;
  if (state.wallWasBroken !== null && state.wallWasBroken !== broken) {
    logLine(broken ? "💥 กำแพงค่ายพังแล้ว! Safe Zone ไม่ปลอดภัย — ซอมบี้บุกตอนค้นหาและต่อสู้กันได้ ช่วยกันซ่อมด่วน!" : "🧱 กำแพงค่ายซ่อมกลับมาแล้ว Safe Zone ปลอดภัยอีกครั้ง", broken ? "system" : "info");
    if (state.psnap) renderPlayers(state.psnap);
    renderZoneTags();
  }
  state.wallWasBroken = broken;
  if (h !== null && !broken && h < 250 && !state.wallWarned) { state.wallWarned = true; logLine(`⚠️ กำแพงค่ายใกล้พัง (เหลือ ${Math.floor(h)}/${WALL_MAX}) ใครมี scrap ช่วยซ่อมที่ Safe Zone`, "system"); }
  if (h !== null && h > 400) state.wallWarned = false;
  if (state.zone) renderZoneDanger(state.zone);
  wallRender();
}
function wallRender() {
  const show = state.zone === "safe" && !!state.wall && wallHp() !== null;
  let box = $("wall-box");
  if (!box) { if (!show || !$("zone-desc")) return; wallStyle(); box = mk("div", "wall-box"); box.id = "wall-box"; $("zone-desc").after(box); }   // อยู่ในหัวห้องแชท: ย่อเป็นบรรทัดเดียวเสมอ ไม่ให้ดันช่องแชทหาย
  box.classList.toggle("hidden", !show); if (!show) return;
  const p = state.profile, h = wallHp(), broken = h <= 0, pct = Math.round((100 * h) / WALL_MAX), open = !!state.wallOpen;
  box.classList.toggle("broken", broken); box.textContent = "";
  const head = mk("div", "wall-head"), bar = mk("div", "wall-bar"), fill = mk("div", "wall-fill " + (broken ? "bad" : pct < 25 ? "low" : pct < 60 ? "mid" : "ok")); fill.style.width = pct + "%"; bar.append(fill);
  head.append(mk("span", "", broken ? "💥 กำแพงพัง" : "🧱 กำแพง"), bar, mk("span", "muted", broken ? "0" : `${Math.floor(h)}/${WALL_MAX}`), mk("span", "muted", open ? "▴" : "▾"));
  head.addEventListener("click", () => { state.wallOpen = !state.wallOpen; wallRender(); });
  box.append(head);
  if (!open) return;
  box.append(mk("div", "muted wall-note", broken
    ? "💥 กำแพงพัง! ซอมบี้บุกเข้ามาตอนค้นหา และต่อสู้กันได้ใน Safe Zone จนกว่าจะซ่อมกลับมา"
    : `ถ้าไม่มีใครซ่อม จะพังในอีกประมาณ ${wallTimeText()} • scrap 1 ชิ้น = +${WALL_PER} HP`));
  if (p?.faction === "human") {
    const have = state.inv?.scrap?.qty || 0, room = Math.ceil((WALL_MAX - h) / WALL_PER), all = Math.min(have, WALL_SPEND, room);
    const row = mk("div", "wall-btns");
    [1, 5].forEach((n) => { const b = btn(`ซ่อม ×${n}`, () => wallRepair(n), "btn ghost mini"); b.disabled = state.wallBusy || have < n || room < 1 || (p.hp || 0) <= 0; row.append(b); });
    if (all > 5) row.append(btn(`ซ่อม ×${all}`, () => wallRepair(all), "btn primary mini"));
    row.append(mk("span", "muted", `scrap ในกระเป๋า ${have}`));
    box.append(row);
  } else if (p) {
    const cdLeft = Math.max(0, SMASH_CD - (serverNow() - (p.lastSmash || 0))), row = mk("div", "wall-btns");
    const b = btn(`💢 ทุบกำแพง (−${SMASH_DMG + fangBonus()} HP กำแพง • −${SMASH_STAM} พลังงาน)`, wallSmash, "btn danger mini");
    b.disabled = state.wallBusy || broken || cdLeft > 0 || (p.hp || 0) <= 0; row.append(b);
    row.append(mk("span", "muted", broken ? "กำแพงพังแล้ว — เข้าไปล่าเหยื่อได้เลย" : cdLeft > 0 ? `รออีก ${Math.ceil(cdLeft / 1000)} วิ` : "คูลดาวน์ 30 วิ"));
    const nh = state.wallHit?.[state.uid]?.n || 0;
    box.append(row, mk("div", "muted wall-note", `ทุบสะสม ${nh} ครั้ง • อีก ${SMASH_EVERY - (nh % SMASH_EVERY)} ครั้งได้ 🥩+1 • ทุบจนพังได้ 🥩+${SMASH_BREAK_BONUS}`));
    const due = prizeDue();
    if (due) { const pb = btn(`🏆 รับรางวัลแชมป์สัปดาห์ก่อน (🥩+${PRIZE_MEAT})`, () => wallPrizeClaim(due), "btn primary mini"); pb.disabled = state.wallBusy; box.append(pb); }
  }
  {
    const wk = wallWk(), tn = state.wallTop?.["w" + wk], tl = state.wallTop?.["w" + (wk - 1)];
    if (tn) box.append(mk("div", "muted wall-note", `👑 ราชาทุบกำแพงสัปดาห์นี้: ${tn.name} (${tn.n})`));
    if (tl) box.append(mk("div", "muted wall-note", `🏆 แชมป์สัปดาห์ก่อน: ${tl.name} (${tl.n})`));
  }
  const hits = Object.values(state.wallHit || {}).filter((x) => x && x.n).sort((a, b) => b.n - a.n).slice(0, 3);
  if (hits.length) box.append(mk("div", "muted wall-note", "💢 ผู้ทุบสูงสุด: " + hits.map((x) => `${x.name} (${x.n})`).join(" • ")));
  const top = Object.values(state.wallLog || {}).filter((x) => x && x.n).sort((a, b) => b.n - a.n).slice(0, 3);
  if (top.length) box.append(mk("div", "muted wall-note", "🏅 ผู้ซ่อมสูงสุด: " + top.map((x) => `${x.name} (${x.n})`).join(" • ")));
}
async function wallSmash() {
  const p = state.profile; if (!p || p.hp <= 0 || p.faction !== "zombie" || state.zone !== "safe" || state.wallBusy) return;
  const h = wallHp(); if (h === null) return;
  if (h <= 0) return toast("กำแพงพังอยู่แล้ว");
  const cd = SMASH_CD - (serverNow() - (p.lastSmash || 0)); if (cd > 0) return toast(`ยังทุบไม่ไหว รออีก ${Math.ceil(cd / 1000)} วิ`);
  const cur = curStamina(); if (cur < SMASH_STAM) return toast("พลังงานไม่พอ");
  state.wallBusy = true; wallRender();
  try {
    const hp = Math.max(0, Math.floor(h) - SMASH_DMG - fangBonus()), uid = state.uid;
    const n = (state.wallHit?.[uid]?.n || 0) + 1, wk = wallWk(), wr = state.wallWeek, wn = (wr && wr.wk === wk ? wr.n : 0) + 1;
    const breaker = hp <= 0, meat = (n % SMASH_EVERY === 0 ? 1 : 0) + (breaker ? SMASH_BREAK_BONUS : 0);
    const u = {
      "wall/safe": { hp, ts: serverTimestamp() },
      [`users/${uid}/lastSmash`]: serverTimestamp(),
      [`users/${uid}/stamina`]: cur - SMASH_STAM, [`users/${uid}/staminaTs`]: serverTimestamp(),
      [`wallHit/${uid}`]: { n, ts: serverTimestamp(), name: p.username },
      [`wallWeek/${uid}`]: { wk, n: wn, name: p.username, ts: serverTimestamp() }
    };
    if (wn > (state.wallTop?.["w" + wk]?.n || 0)) u[`wallTop/w${wk}`] = { uid, name: p.username, n: wn, wk, ts: serverTimestamp() };   // ทำลายสถิติสัปดาห์นี้
    if (meat > 0) invAddUpdate(u, "rotten_meat", meat);
    await update(ref(db), u);
    logLine((breaker ? "💥 คุณทุบกำแพงจนพังทลาย! ค่ายไม่ปลอดภัยอีกต่อไป" : `💢 คุณทุบกำแพงค่าย กำแพงเหลือ ${hp}/${WALL_MAX}`) + (meat ? ` • ได้ 🥩 เนื้อเน่า +${meat}${breaker ? " (โบนัสทุบพัง)" : ""}` : ""), "combat");
    setTimeout(wallRender, SMASH_CD + 300); questBump("smash"); siegeHit();
  } catch (e) { toast(errMsg(e)); }
  finally { state.wallBusy = false; wallRender(); }
}
// แชมป์ทุบกำแพงสัปดาห์ที่ผ่านมา (อย่างน้อย PRIZE_MIN ครั้ง) รับ 🥩 ได้ครั้งเดียวต่อสัปดาห์
function prizeDue() {
  const wk = wallWk(), me = state.uid; let best = null;
  for (const e of Object.values(state.wallTop || {})) if (e && e.uid === me && e.wk < wk && e.n >= PRIZE_MIN && (!state.wallPrize || state.wallPrize.wk < e.wk) && (!best || e.wk > best.wk)) best = e;
  return best;
}
async function wallPrizeClaim(e) {
  if (!state.profile || state.profile.faction !== "zombie" || state.wallBusy) return;
  state.wallBusy = true; wallRender();
  try {
    const u = { [`wallPrize/${state.uid}`]: { wk: e.wk, ts: serverTimestamp() } };
    invAddUpdate(u, "rotten_meat", PRIZE_MEAT);
    await update(ref(db), u);
    logLine(`🏆 คุณรับรางวัลแชมป์ทุบกำแพง (ทุบ ${e.n} ครั้ง) 🥩 +${PRIZE_MEAT}`, "system");
  } catch (er) { toast(errMsg(er)); }
  finally { state.wallBusy = false; wallRender(); }
}
async function wallRepair(n) {
  const p = state.profile; if (!p || p.hp <= 0 || p.faction !== "human" || state.zone !== "safe" || state.wallBusy) return;
  const h = wallHp(); if (h === null) return;
  const have = state.inv?.scrap?.qty || 0; n = Math.min(n, have, WALL_SPEND);
  if (n < 1) return toast("ไม่มี scrap สำหรับซ่อม");
  if (h >= WALL_MAX) return toast("กำแพงเต็มแล้ว");
  state.wallBusy = true; wallRender();
  try {
    const hp = Math.min(WALL_MAX, Math.floor(h + n * WALL_PER) - 1);   // ลบ 1 ไว้กันเวลาเพี้ยน (rules ยอมคลาดเคลื่อนไม่เกิน 2)
    const u = {
      "wall/safe": { hp, ts: serverTimestamp() },
      [`wallLog/${state.uid}`]: { n: (state.wallLog?.[state.uid]?.n || 0) + n, ts: serverTimestamp(), name: p.username }
    };
    if (have - n > 0) u[`inventory/${state.uid}/scrap/qty`] = have - n; else u[`inventory/${state.uid}/scrap`] = null;
    await update(ref(db), u);
    logLine(`🧱 ซ่อมกำแพงด้วย scrap ×${n} (+${n * WALL_PER} HP)`, "info");
    questBump("wall"); siegeHit(); achBump("scrap", n); coopEvent("scrap", n);
  } catch (e) { toast(errMsg(e)); }
  finally { state.wallBusy = false; wallRender(); }
}

// ---- สภาพโซนรายวัน (เวลาไทย) ----
function dailyEvent(z) {
  if (z === "safe" || !ZONES[z]) return null;
  const TZ = 7 * 3600000, DAY = 86400000;   // (ไม่ใช้ QP_* เพราะอาจถูกเรียกก่อนที่ const เหล่านั้นจะถูกสร้าง)
  const day = Math.floor((serverNow() + TZ) / DAY), zi = Object.keys(ZONES).indexOf(z);
  let h = (Math.imul(day, 2654435761) ^ Math.imul(zi + 1, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
  const r = h % 100, type = r < 9 ? "supply" : r < 17 ? "horde" : r < 27 ? "fog" : r < 35 ? "calm" : null;
  if (!type) return null;
  const t = EVENT_TYPES[type];
  return { type, title: `${t.name} (ประจำวัน)`, endsAt: (day + 1) * DAY - TZ, dmod: t.dmod, zmod: t.zmod, nmod: t.nmod, daily: true };
}
function zoneEv(z) { return activeEvent(z) || dailyEvent(z); }
function dailyNews() {
  const list = Object.keys(ZONES).map((z) => [z, dailyEvent(z)]).filter(([, e]) => e);
  if (!list.length) return logLine("📰 ข่าววันนี้: ทุกโซนเป็นปกติ", "info");
  logLine("📰 ข่าววันนี้: " + list.map(([z, e]) => `${eventIcon(e)} ${ZONES[z].name} — ${EVENT_TYPES[e.type].name}`).join(" • "), "info");
}

// ---- ค้นลึก ----
function deepTable(t, isZ) {
  return t.map((d) => d.id === null ? { ...d, w: d.w * 0.5 }
    : d.id === "zombie" ? { ...d, w: d.w * 1.5 }
    : d.id === "rotten_meat" ? (isZ ? { ...d, w: d.w * 2 } : d)   // ซอมบี้ค้นลึก: เนื้อเน่าออกง่ายขึ้น ×2
    : d.id === "boss" ? d
    : d.w <= 5 ? { ...d, w: d.w * 2 } : d);
}
function scavLabel() { $("btn-scavenge").textContent = `ค้นหาไอเทม${state.deep ? " (ลึก)" : ""} (−${searchCost()} พลังงาน)`; }
function deepSync() {
  const b = $("btn-deep"); if (b) { b.textContent = state.deep ? "🔦 ค้นลึก: เปิด" : "🔦 โหมดค้น: ปกติ"; b.classList.toggle("active", !!state.deep); }
  scavLabel(); renderBars();
}
function deepInit() {
  if (state.deepOn) return; state.deepOn = true; state.deep = false;
  const b = btn("🔦 โหมดค้น: ปกติ", () => { state.deep = !state.deep; deepSync(); }, "btn ghost mini"); b.id = "btn-deep";
  b.title = "ค้นลึก: เสียพลังงาน ×2 • ของหายากออกง่ายขึ้น ×2 • แต่เจอซอมบี้มากขึ้น 50% (ซอมบี้: เนื้อเน่าออกง่ายขึ้น ×2)";
  $("btn-scavenge").after(b); deepSync(); dailyNews(); try { mgBtnInit(); } catch { /* ข้าม */ }
}


// ---- หัวห้องแชทแบบย่อ: ชื่อโซน + บรรทัดสถานะ แตะชื่อเพื่อดูคำอธิบาย ช่องแชทได้พื้นที่มากขึ้น ----
function headCompactInit() {
  if ($("head-style")) return;
  const st = document.createElement("style"); st.id = "head-style";
  st.textContent = ".chat-head h2#zone-title{cursor:pointer;user-select:none;margin-bottom:2px}"
    + ".chat-head h2#zone-title::after{content:' ▾';font-size:.6em;opacity:.6}.chat-head.open h2#zone-title::after{content:' ▴'}"
    + ".chat-head #zone-desc{display:none;margin:2px 0;font-size:13px}.chat-head.open #zone-desc{display:block}"
    + ".chat-head #zone-danger,.chat-head #zone-time,.chat-head #zone-event{font-size:12px;margin:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"
    + ".chat-head.open #zone-danger,.chat-head.open #zone-time,.chat-head.open #zone-event{white-space:normal}";
  document.head.append(st);
  const t = $("zone-title"); if (t) t.addEventListener("click", () => t.closest(".chat-head")?.classList.toggle("open"));
}


/* =========================================================
   20) ชุดสวมใส่ (มนุษย์) • อวัยวะกลายพันธุ์ (ซอมบี้) • เควสรายวันผูกโซน
   - ของชนิด type "gear" ซ้อนได้ (ช่อง = id) สวมแล้วเก็บ id ไว้ที่ users/{uid}/{arm|acc|mf|mh|mn} (rules ตรวจว่ามีของในกระเป๋าและตรงฝ่าย/ช่อง)
   - ผลลัพธ์ทั้งหมดเกิดฝั่ง client เท่านั้น (ลดดาเมจที่ตัวเองโดน / ปรับน้ำหนักตารางค้นหา / ต้นทุนค้นลึก) ยกเว้นเขี้ยวที่ rules รู้ (ทุบกำแพงแรงขึ้น +3/+6)
   - ถ้าแก้ตัวเลข: GEAR_DROPS/MUT_DROPS ต้องตรงกับรายการโซนใน rules (ช่อง inventory) และ RECIPES ต้องตรงกับสูตรคราฟต์ใน rules
   - เควสโซนรายวัน: นิยามอยู่ที่ config/questDefs/daily/zd{วัน}{h|z}{1-3} มี z (โซน) และ dw (วัน 0=จันทร์) — ปุ่มเจ้าของ “เติมเควสโซนรายวัน”
   ========================================================= */
const GEAR_CUSTOM_MAX = 35;   // ลดดาเมจสูงสุดของเกราะ custom (ต้องตรง rules)
const GEAR_SLOTS = { arm: "🛡️ เกราะ", acc: "🎒 อุปกรณ์", mf: "🦷 เขี้ยว", mh: "🦴 หนัง", mn: "👃 จมูก" };
const GEAR_FX = {
  rag_vest: "ลดดาเมจที่โดน 5%", scrap_plate: "ลดดาเมจที่โดน 10%", riot_vest: "ลดดาเมจที่โดน 15%", army_vest: "ลดดาเมจที่โดน 20%",
  lucky_charm: "ค้นหาแล้ว “ไม่เจออะไร” น้อยลง 20%", headlamp: "กลางคืนไม่เพิ่มอันตรายตอนค้นหา", gas_mask: "เจอซอมบี้ตอนค้นหาน้อยลง 25%", toolkit: "ค้นลึกเสียพลังงาน ×1.6 แทน ×2",
  mut_fang1: "ทุบกำแพงแรงขึ้น +3", mut_fang2: "ทุบกำแพงแรงขึ้น +6", mut_hide1: "ลดดาเมจที่โดน 8%", mut_hide2: "ลดดาเมจที่โดน 16%",
  mut_nose1: "เจอเนื้อเน่าบ่อยขึ้น ×1.3", mut_nose2: "เจอเนื้อเน่าบ่อยขึ้น ×1.7 และไม่เจออะไรน้อยลง 20%",
  lab_coat: "ลดดาเมจที่โดนรวมประมาณ 17% (เกราะ 12% + ผ้าปลอดเชื้ออีก 5%)", bio_lens: "ของหายากออกง่ายขึ้น 7%",
  chem_gloves: "โอกาสติดพิษจากมอนสเตอร์ลดครึ่ง และพิษแรงอ่อนลงหนึ่งระดับ", mut_fang3: "ทุบกำแพงแรงขึ้น +5 และทนพิษ (โอกาสติดพิษลดครึ่ง)"
};
const GEAR_DROPS = {   // ฝั่งมนุษย์ (น้ำหนักเทียบกับตารางโซน) — ต้องตรงกับ rules
  ruins: { rag_vest: 3 }, mall: { rag_vest: 2, lucky_charm: 2 }, hospital: { gas_mask: 3, riot_vest: 1 }, police: { riot_vest: 2, headlamp: 2, gas_mask: 1 },
  forest: { lucky_charm: 1, rag_vest: 1 }, factory: { scrap_plate: 3, headlamp: 2, toolkit: 3 }, port: { scrap_plate: 2, toolkit: 2, lucky_charm: 1 },
  base: { army_vest: 2, riot_vest: 2, gas_mask: 2 }, tunnel: { army_vest: 1, headlamp: 2, toolkit: 1 }, lab: { lab_coat: 2, bio_lens: 1, gas_mask: 1, chem_gloves: 1 }
};
const MUT_DROPS = {    // ฝั่งซอมบี้
  ruins: { mut_hide1: 2, mut_nose1: 3, mut_fang1: 2 }, mall: { mut_nose1: 3, mut_fang1: 2 }, hospital: { mut_hide1: 2, mut_nose2: 1 },
  police: { mut_fang1: 3, mut_hide1: 2, mut_fang2: 1 }, forest: { mut_nose1: 4, mut_hide1: 2 }, factory: { mut_hide1: 2, mut_fang1: 2, mut_hide2: 1 },
  port: { mut_nose1: 3, mut_hide1: 2, mut_nose2: 1 }, base: { mut_fang2: 1, mut_hide2: 1, mut_fang1: 2 }, tunnel: { mut_fang2: 2, mut_hide2: 2, mut_nose2: 2 }, lab: { mut_nose2: 2, mut_hide2: 1, mut_fang2: 1, mut_fang3: 1 }
};
// ไอเทมชุดที่ 1: น้ำหนักดรอปสัมบูรณ์ต่อโซน (คิดจากส่วนแบ่งใน ITEMS_DESIGN.md) — รวมเข้ากับตารางเดิมด้านล่าง
// ต้องตรงกับรายการโซนใน rules (ช่อง inventory) และรายการสวมใส่ (users/{uid}/arm|acc|mf|mh|mn)
const NEW_GEAR_DROPS = { ruins: { cardboard_armor: 0.93, leather_jacket: 0.46, compass: 0.46, survival_bracelet: 0.46 }, mall: { cardboard_armor: 0.5, leather_jacket: 1.01, earplugs: 1.01, rabbit_foot: 0.5, lucky_coin: 0.5 }, hospital: { earplugs: 1.61, respirator: 0.81 }, police: { kevlar_vest: 0.39, night_goggles: 0.39 }, forest: { hunter_cloak: 0.62, compass: 1.23, rabbit_foot: 0.62 }, factory: { welder_apron: 0.96, hazmat_suit: 0.38, respirator: 0.96 }, port: { diver_suit: 0.9, survival_bracelet: 0.9, lucky_coin: 0.9 }, base: { kevlar_vest: 1.11, bomb_suit: 0.11, night_goggles: 1.11, tactical_radio: 0.45 }, tunnel: { hazmat_suit: 1.47, bomb_suit: 0.15, tactical_radio: 1.47 }, lab: { hazmat_suit: 1.02 } };
const NEW_MUT_DROPS = { hospital: { mut_fang6: 0.32, mut_nose3: 0.81 }, police: { mut_fang4: 0.96 }, forest: { mut_nose3: 0.62 }, factory: { mut_fang4: 0.96, mut_hide3: 0.96 }, port: { mut_hide3: 0.9 }, base: { mut_fang5: 0.45, mut_hide4: 0.45 }, tunnel: { mut_fang5: 0.15, mut_hide4: 1.47, mut_hide5: 0.15, mut_nose4: 1.47 }, lab: { mut_fang6: 0.41, mut_hide5: 0.41, mut_nose4: 0.41 } };
const MAT_DROPS = { ruins: { duct_tape: 0.93, rusty_nails: 0.93, cloth_roll: 0.46, old_photo: 0.46 }, mall: { duct_tape: 1.01, cloth_roll: 1.01, leather_scrap: 0.5, battery_pack: 0.5, circuit_board: 0.5, survivor_badge: 0.2, gold_watch: 0.2 }, hospital: { herb_bundle: 0.81, old_photo: 0.81 }, police: { gunpowder: 0.96, survivor_badge: 0.39 }, forest: { rope_coil: 0.62, herb_bundle: 1.23, leather_scrap: 0.62 }, factory: { rusty_nails: 1.92, copper_wire: 1.92, fuel_can: 0.96, steel_plate: 0.96, battery_pack: 0.96, chem_catalyst: 0.38 }, port: { rope_coil: 1.8, fuel_can: 0.9, gold_watch: 0.36 }, base: { gunpowder: 1.11, steel_plate: 1.11 }, tunnel: { mutant_gland: 0.59, data_chip: 1.47 }, lab: { copper_wire: 1.02, battery_pack: 2.04, circuit_board: 1.02, chem_catalyst: 1.02, mutant_gland: 1.02, lab_keycard: 0.41, data_chip: 0.41 } };   // วัตถุดิบ/ของสะสม: ทั้งมนุษย์และซอมบี้ค้นเจอ
for (const [z, m] of Object.entries(NEW_GEAR_DROPS)) GEAR_DROPS[z] = { ...(GEAR_DROPS[z] || {}), ...m };
for (const [z, m] of Object.entries(NEW_MUT_DROPS)) MUT_DROPS[z] = { ...(MUT_DROPS[z] || {}), ...m };
const NEW_BOSS_LOOT = {"ruins":[{"id":"leather_jacket","w":3},{"id":"survival_bracelet","w":2},{"id":"boss_trophy","w":1}],"mall":[{"id":"rabbit_foot","w":3},{"id":"lucky_coin","w":2},{"id":"gold_watch","w":1},{"id":"boss_trophy","w":1}],"hospital":[{"id":"boss_trophy","w":1}],"police":[{"id":"kevlar_vest","w":1},{"id":"boss_trophy","w":1}],"forest":[{"id":"hunter_cloak","w":3},{"id":"boss_trophy","w":1}],"factory":[{"id":"welder_apron","w":3},{"id":"boss_trophy","w":1}],"port":[{"id":"diver_suit","w":3},{"id":"boss_trophy","w":1}],"base":[{"id":"bomb_suit","w":1},{"id":"boss_trophy","w":1}],"tunnel":[{"id":"boss_trophy","w":1}],"lab":[{"id":"lab_keycard","w":1},{"id":"data_chip","w":2},{"id":"boss_trophy","w":1}]};
for (const [z, l] of Object.entries(NEW_BOSS_LOOT)) if (BOSSES[z]) BOSSES[z].loot.push(...l);
// ผลพิเศษทั่วไปของชุดสวมใส่ (fx ใน ITEMS): รวมค่าจากทุกช่องที่สวมอยู่
const GEAR_SLOT_KEYS = ["arm", "acc", "mf", "mh", "mn"];
const gearFxSum = (k) => GEAR_SLOT_KEYS.reduce((t, sl) => t + (gearDef(sl)?.fx?.[k] || 0), 0);
const gearFxFlag = (k) => GEAR_SLOT_KEYS.some((sl) => !!gearDef(sl)?.fx?.[k]);
const gearFxMax = (k) => GEAR_SLOT_KEYS.reduce((t, sl) => Math.max(t, gearDef(sl)?.fx?.[k] || 0), 0);
const FX_LABEL = { nofind: (v) => `“ไม่เจออะไร” น้อยลง ${v}%`, zspawn: (v) => `เจอซอมบี้ตอนค้นหาน้อยลง ${v}%`, rare: (v) => `ของหายากออกง่ายขึ้น ${v}%`, poisonHalf: () => "โอกาสติดพิษลดครึ่ง", nightSafe: () => "กลางคืนไม่เพิ่มอันตรายตอนค้นหา", wall: (v) => `ทุบกำแพงแรงขึ้น +${v}`, meat: (v) => `เจอเนื้อเน่าบ่อยขึ้น ×${v}` };
const autoGearFx = (d) => d ? [d.red ? `ลดดาเมจที่โดน ${d.red}%` : "", ...Object.entries(d.fx || {}).map(([k, v]) => FX_LABEL[k]?.(v))].filter(Boolean).join(" • ") : "";
const GEAR_SLOT_BY_FAC = { human: ["arm", "acc"], zombie: ["mf", "mh", "mn"] };
// ของที่สวมอยู่จริง: ต้องมี id นั้นในช่อง และยังมีของในกระเป๋า
const gearFx = (it) => (it.id === "custom_gear" ? `ลดดาเมจที่โดน ${it.red}%` : GEAR_FX[it.id] || autoGearFx(ITEMS[it.id]));
// ช่องสวมเก็บ "ชื่อสล็อตในกระเป๋า" (ของในเกม = id เดียวกับสล็อต, ของ custom = key สุ่ม)
function gearDef(slot) { const k = state.profile?.[slot], it = k && state.inv?.[k], d = it && defOf(it); return d && d.type === "gear" && d.slot === slot && it.qty > 0 ? d : null; }
function gearId(slot) { return gearDef(slot) ? state.profile[slot] : null; }
function gearHas(id) { return !!ITEMS[id] && gearId(ITEMS[id].slot) === id; }
function gearRed() { let red = 0; for (const s of ["arm", "acc", "mh"]) { const d = gearDef(s); if (d) red += d.red || 0; } return Math.min(40, red); }
function gearCut(dmg) { const red = gearRed(); return dmg > 0 && red ? Math.max(1, Math.round(dmg * (1 - red / 100))) : dmg; }
function fangBonus() { const id = gearId("mf"); return id === "mut_fang2" ? 6 : id === "mut_fang3" ? 5 : id === "mut_fang1" ? 3 : (gearDef("mf")?.fx?.wall || 0); }   // ต้องตรงกับ wall/safe ใน rules
function gearTable(t) {
  let out = t;
  if (gearHas("lucky_charm")) out = out.map((d) => d.id === null ? { ...d, w: d.w * 0.8 } : d);
  if (gearHas("gas_mask")) out = out.map((d) => d.id === "zombie" ? { ...d, w: d.w * 0.75 } : d);
  if (gearHas("bio_lens")) out = out.map((d) => d.id && d.id !== "zombie" && d.id !== "boss" && d.id !== "rotten_meat" && d.w <= 5 ? { ...d, w: d.w * 1.07 } : d);
  { // ผลทั่วไปจาก fx (ชุดใหม่): ไม่เจออะไรน้อยลง / เจอซอมบี้น้อยลง / ของหายากออกง่ายขึ้น / เนื้อเน่า ×
    const nf = Math.min(60, gearFxSum("nofind")), zs = Math.min(60, gearFxSum("zspawn")), rr = gearFxSum("rare"), mm = gearFxMax("meat");
    if (nf) out = out.map((d) => d.id === null ? { ...d, w: d.w * (1 - nf / 100) } : d);
    if (zs) out = out.map((d) => d.id === "zombie" ? { ...d, w: d.w * (1 - zs / 100) } : d);
    if (rr) out = out.map((d) => d.id && d.id !== "zombie" && d.id !== "boss" && d.id !== "rotten_meat" && d.w <= 5 ? { ...d, w: d.w * (1 + rr / 100) } : d);
    if (mm) out = out.map((d) => d.id === "rotten_meat" ? { ...d, w: d.w * mm } : d);
  }
  const n = gearId("mn");
  if (n === "mut_nose1" || n === "mut_nose2") out = out.map((d) => d.id === "rotten_meat" ? { ...d, w: d.w * (n === "mut_nose2" ? 1.7 : 1.3) } : d.id === null && n === "mut_nose2" ? { ...d, w: d.w * 0.8 } : d);
  return out;
}
async function gearToggle(key) {
  const it = state.inv?.[key], d = it && defOf(it), p = state.profile; if (!d || d.type !== "gear" || !p || state.gearBusy) return;
  if ((p.faction === "zombie") !== !!d.zombieOnly) return toast(d.zombieOnly ? "อวัยวะกลายพันธุ์ใช้ได้เฉพาะซอมบี้" : "ชุดนี้ใช้ได้เฉพาะมนุษย์");
  if (!(it.qty > 0)) return;
  const worn = p[d.slot] === key; state.gearBusy = true;
  try { await set(ref(db, `users/${state.uid}/${d.slot}`), worn ? null : key); toast(worn ? `ถอด ${d.name} แล้ว` : `สวม ${d.name} แล้ว — ${gearFx(it)}`); }
  catch (e) { toast(errMsg(e)); } finally { state.gearBusy = false; }
}
// ของหมดจากกระเป๋า (ทิ้ง/ขาย/ทำลาย) → ถอดให้อัตโนมัติ ไม่ให้ค้างอยู่ในช่อง
function gearAutoFix() {
  const p = state.profile; if (!p || !state.invLoaded || state.gearFixing) return;
  for (const slot of ["arm", "acc", "mf", "mh", "mn"]) {
    const id = p[slot]; if (!id) continue;
    const ok = !!gearDef(slot) && GEAR_SLOT_BY_FAC[p.faction]?.includes(slot);
    if (ok) continue;
    state.gearFixing = true;
    set(ref(db, `users/${state.uid}/${slot}`), null).catch(() => {}).finally(() => { state.gearFixing = false; });
    return;
  }
}
function gearBar() {
  const ul = $("inv-list"), p = state.profile; if (!ul || !p) return;
  let bar = $("gear-bar");
  if (!bar) { bar = mk("div", "muted"); bar.id = "gear-bar"; bar.style.cssText = "margin:4px 0 8px;font-size:13px"; ul.before(bar); }
  const slots = GEAR_SLOT_BY_FAC[p.faction] || [];
  bar.textContent = slots.map((s) => `${GEAR_SLOTS[s]}: ${gearDef(s) ? gearDef(s).icon + " " + gearDef(s).name : "—"}`).join(" • ") + (gearRed() ? ` • ลดดาเมจรวม ${gearRed()}%` : "");
}

// ---- เควสรายวันผูกโซน (นิยามสร้างจากสูตรนี้ เจ้าของกดเติมได้) ----
const WD_NAMES = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const qpWd = () => (qpDayKey(serverNow()) + 3) % 7;   // 0 = จันทร์ (เวลาไทย)
function zoneQuestSeed() {
  const Z = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel"];
  const HR = { ruins: ["canned_food", 2], mall: ["soup", 1], hospital: ["medkit", 1], police: ["scrap", 4], forest: ["moss", 3], factory: ["chem", 2], port: ["water_jug", 1], base: ["army_meal", 1], tunnel: ["trauma_kit", 1] };
  const R = (id, qty) => ({ id, qty }), zn = (z) => ZONES[z].name;
  const H3 = [["hit", 3, "rag_vest"], ["search", 8, "lucky_charm"], ["craft", 2, "headlamp"], ["hit", 4, "gas_mask"], ["wall", 4, "toolkit"], ["hit", 6, "riot_vest"], ["search", 10, "scrap_plate"]];
  const Z3 = [["smash", 3, "mut_hide1"], ["search", 8, "mut_nose1"], ["bite", 2, "mut_fang1"], ["smash", 5, "mut_hide1"], ["hit", 3, "mut_nose1"], ["bite", 3, "mut_fang1"], ["search", 10, "mut_nose1"]];
  const EV = { search: "ค้นหา", hit: "โจมตี", craft: "คราฟต์", wall: "ซ่อมกำแพงค่าย", smash: "ทุบกำแพงค่าย", bite: "กัดเหยื่อ" };
  const out = {};
  for (let d = 0; d < 7; d++) {
    const z1 = Z[(d * 2) % 9], z2 = Z[(d * 2 + 1) % 9], z3 = Z[(d * 2 + 5) % 9];
    const [h1id, h1q] = HR[z1], [h2id] = HR[z2];
    out[`zd${d}h1`] = { title: `ค้นหา 4 ครั้งที่${zn(z1)}`, ev: "search", need: 4, z: z1, dw: d, f: "human", r: { human: R(h1id, h1q), zombie: R("water", 1) } };
    out[`zd${d}h2`] = { title: `ค้นหา 6 ครั้งที่${zn(z2)}`, ev: "search", need: 6, z: z2, dw: d, f: "human", r: { human: R("scrap", 3), zombie: R("water", 1) } };
    const [e3, n3, g3] = H3[d], needZ = ["hit", "search"].includes(e3);
    out[`zd${d}h3`] = { title: `${EV[e3]} ${n3} ครั้ง${needZ ? "ที่" + zn(z3) : ""}`, ev: e3, need: n3, ...(needZ ? { z: z3 } : {}), dw: d, f: "human", r: { human: R(g3, 1), zombie: R("water", 1) } };
    out[`zd${d}z1`] = { title: `ค้นหา 4 ครั้งที่${zn(z2)}`, ev: "search", need: 4, z: z2, dw: d, f: "zombie", r: { human: R("water", 1), zombie: R("rotten_meat", 2) } };
    out[`zd${d}z2`] = { title: `ค้นหา 6 ครั้งที่${zn(z1)}`, ev: "search", need: 6, z: z1, dw: d, f: "zombie", r: { human: R("water", 1), zombie: R("rotten_meat", 3) } };
    const [e4, n4, g4] = Z3[d], zz = ["hit", "search", "bite"].includes(e4);
    out[`zd${d}z3`] = { title: `${EV[e4]} ${n4} ครั้ง${zz ? "ที่" + zn(z3) : ""}`, ev: e4, need: n4, ...(zz ? { z: z3 } : {}), dw: d, f: "zombie", r: { human: R("water", 1), zombie: R(g4, 1) } };
  }
  return out;
}
async function qpSeedZone() {
  if (state.profile?.role !== "owner") return;
  if (!confirm("เติมเควสโซนรายวัน?\nจะเพิ่ม/อัปเดตเควส zd0h1…zd6z3 (42 ข้อ) ใน config/questDefs/daily โดยไม่แตะเควสอื่น")) return;
  try { await update(ref(db, "config/questDefs/daily"), zoneQuestSeed()); toast("เติมเควสโซนรายวันแล้ว"); }
  catch (e) { console.error("qpSeedZone", e?.code || e); toast(errMsg(e)); }
}

/* =========================================================
   21) เกราะสุ่มรางวัลบอสโลก (คลังต่อผู้ร่วมโจมตี + ชิ้นพิเศษอันดับ 1)
   สุ่ม "ตอนบอสเกิด" แล้วเก็บไว้กับบอส (worldBosses/{zone}/rpool, rtop) — rules บังคับให้ผู้เล่นรับตรงตามนั้นเท่านั้น
   ========================================================= */
const LOOT_RED = { 1: [3, 6], 2: [6, 10], 3: [9, 13], 4: [13, 19], 5: [19, 26], 6: [26, 35] };
const LOOT_PRE = ["เหล็กกล้า", "หนังดิบ", "ผ้าใบเสริมแผ่น", "ยุทธวิธี", "โลหะผสม", "คาร์บอน", "ฝ่าพายุ", "ผู้พิทักษ์", "เถ้าถ่าน", "เขี้ยวมังกร"];
const LOOT_TOP = ["ตำนาน", "ราชัน", "จอมโหด", "เหนือชั้น"];
const LOOT_ARM = [["เสื้อเกราะ", "🛡️"], ["เกราะอก", "🦺"], ["เสื้อกั๊ก", "🦺"], ["เกราะหลัง", "🛡️"]];
const LOOT_ACC = [["สร้อยนิรภัย", "🧿"], ["สายรัดข้อมือ", "⌚"], ["กระเป๋าสะพาย", "🎒"], ["หมวกนิรภัย", "⛑️"], ["รองเท้าบูท", "🥾"]];
const lootTierOf = (hp) => (hp < 1500 ? 1 : hp < 3000 ? 2 : hp < 5000 ? 3 : hp < 10000 ? 4 : hp < 30000 ? 5 : 6);
const lootPick = (rnd, a) => a[Math.floor(rnd() * a.length)];
function rollGear(rnd, tier, cap, prestige) {
  const [lo, hi] = LOOT_RED[Math.max(1, Math.min(6, tier))];
  const red = Math.max(1, Math.min(cap, lo + Math.floor(rnd() * (hi - lo + 1))));
  const acc = rnd() < 0.3, [noun, icon] = lootPick(rnd, acc ? LOOT_ACC : LOOT_ARM);
  return { name: `${noun}${lootPick(rnd, prestige ? LOOT_TOP : LOOT_PRE)}`.slice(0, 40), gslot: acc ? "acc" : "arm", red, icon };
}
// n ชิ้นในคลัง (ระดับ tier) + ชิ้นพิเศษอันดับ 1 (ระดับ tier+1); capPool/capTop = เพดานค่าลดดาเมจ (บอสสุ่มอัตโนมัติ rules จำกัด 12/18)
function rollLoot(rnd, tier, n, capPool, capTop) {
  const rpool = {}; for (let i = 0; i < Math.max(1, Math.min(12, n)); i++) rpool["p" + i] = rollGear(rnd, tier, capPool, false);
  return { rpool, rtop: rollGear(rnd, tier + 1, capTop, true) };
}

/* =========================================================
   22) บรรยากาศ • สมุดบันทึก • สรุปวัน/สัปดาห์ • อันดับ • คำเตือน • เสียง
   ฝั่งเกมล้วน — ไม่แตะ rules / ไม่เขียนข้อมูลใหม่ขึ้นเซิร์ฟเวอร์
   บันทึกและสถิติส่วนตัวเก็บใน localStorage ของเครื่องนี้ (แยกตามบัญชี) / อันดับอ่านจากข้อมูลสาธารณะเดิม (wallWeek, wallTop, worldBossHits)

   ตัวเลขปรับสมดุลอยู่ที่ตารางเดียว (แก้ได้โดยไม่ต้อง publish rules แต่ต้องไม่เกินเพดานที่ rules คุมไว้):
     MON_FX   = โอกาสติดสถานะจากมอนสเตอร์ [โอกาส%, ค่า v, นาที] (เพดาน: bleed/poison v≤3, stun 1 นาที, dice −1..−2, ≤5 นาที)
     WPN_PROC = โอกาสที่อาวุธคมทำให้บอสประจำโซนเลือดไหล / BOSS_BLEED, BOSS_BLEED_N = เลือดที่เสีย/รอบ และจำนวนรอบ
     SWAP_CD  = คูลดาวน์สลับอาวุธ / AMB_CHANCE = โอกาสที่ข้อความบรรยากาศจะโผล่ตอนค้นหา
   ========================================================= */
const HAS_DOM = typeof document !== "undefined" && typeof document.addEventListener === "function" && typeof document.createElement === "function";   // (เครื่องมือทดสอบไม่มี DOM จริง)
const AMB_CHANCE = 0.55;
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* เต็ม/ถูกบล็อก: ข้ามไป */ } }
};
const lsKey = (n) => `zc_${state.uid || "x"}_${n}`;
const dayKey = (t = serverNow()) => new Date(t + 25200000).toISOString().slice(0, 10);
const weekStartKey = (t = serverNow()) => dayKey(t - ((new Date(t + 25200000).getUTCDay() + 6) % 7) * 86400000);   // วันจันทร์ของสัปดาห์นั้น (เวลาไทย)

/* ---- สถิติรายวัน (ในเครื่อง) ---- */
function stat(k, n = 1) {
  if (!state.uid || !(n > 0)) return;
  const all = LS.get(lsKey("st"), {}), d = dayKey(), cut = dayKey(serverNow() - 60 * 86400000);
  Object.keys(all).forEach((x) => { if (x < cut) delete all[x]; });
  (all[d] = all[d] || {})[k] = (all[d][k] || 0) + n;
  LS.set(lsKey("st"), all);
  try { achStat(k, n); } catch { /* ความสำเร็จพลาดไม่กระทบเกม */ }
}
function statSum(from, to) {
  const all = LS.get(lsKey("st"), {}), s = {};
  Object.entries(all).forEach(([d, o]) => { if (d >= from && d <= to) Object.entries(o).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; }); });
  return s;
}

/* ---- สมุดบันทึกเหตุการณ์ (ในเครื่อง): เก็บทุกบรรทัดที่เกมแจ้งเรา ยกเว้นข้อความบรรยากาศ/ค้นแล้วไม่เจอ ---- */
const JR_MAX = 300;
function jrnlAdd(text, cls) {
  if (!state.uid || cls === "ambient" || /ไม่เจอ|📰/.test(text)) return;
  const j = LS.get(lsKey("jr"), []);
  j.push({ t: serverNow(), c: cls, x: String(text).slice(0, 220) });
  if (j.length > JR_MAX) j.splice(0, j.length - JR_MAX);
  LS.set(lsKey("jr"), j);
}

/* ---- ข้อความบรรยากาศตอนค้นหา (ไม่มีผลต่อผลลัพธ์) ---- */
const AMB_ZONE = {
  safe: ["เสียงเด็กหัวเราะแว่วมาจากเต็นท์ข้าง ๆ ชั่วครู่ก็เงียบลง", "ลวดหนามบนกำแพงสั่นกริ๊งตามแรงลม ยามบนหอสังเกตการณ์ยกไฟฉายกวาดไปรอบ ๆ", "กลิ่นซุปกระป๋องอุ่นลอยมาจากครัวส่วนกลาง ท้องคุณร้องขึ้นมาเอง", "ใครบางคนเถียงกันเรื่องแบ่งน้ำที่หัวมุมค่าย", "กระดานหน้าค่ายเขียนรายชื่อคนที่ยังไม่กลับ… มีชื่อใหม่เพิ่มมา", "เครื่องปั่นไฟครางต่ำ ๆ เป็นจังหวะสม่ำเสมอ ปลอบใจคนทั้งค่ายได้ดีกว่าคำพูดใด"],
  ruins: ["กระจกร้าวใต้รองเท้าลั่นกรอบแกรบ คุณชะงักฟังว่ามีอะไรตอบกลับไหม", "รถบัสพลิกคว่ำขวางถนน ผ้าม่านในหน้าต่างยังปลิวไหว ทั้งที่ไม่มีลม", "รอยมือเปื้อนเลือดแห้งกรังบนผนังตึก ลากยาวลงไปถึงพื้น", "นกพิราบฝูงหนึ่งบินขึ้นพร้อมกันจากชั้นสาม… มีอะไรทำให้พวกมันตกใจ", "กลิ่นไหม้เก่า ๆ ปนกลิ่นเน่าลอยมาจากซอกตึก", "ตุ๊กตาหมีเปื้อนฝุ่นนั่งอยู่กลางถนนเหมือนมีคนวางไว้", "เสียงโลหะกระทบกันดังก๊องแก๊งจากที่ไกล ๆ แล้วก็เงียบไป"],
  mall: ["ลิฟต์เก่ากริ๊งดังขึ้นหนึ่งครั้งจากชั้นบน ทั้งที่ไฟดับมาหลายเดือนแล้ว", "หุ่นโชว์ในตู้กระจกใส่ชุดซีดจาง ตายิ้มค้างเหมือนมองตามคุณอยู่", "เพลงห้างเพี้ยน ๆ แว่วมาจากลำโพงสักตัว ท่อนเดียววนซ้ำไม่รู้จบ", "ป้ายลดราคายังแปะอยู่ทุกชั้น แต่ไม่มีใครมาจ่ายเงินให้นานแล้ว", "ชั้นวางของล้มเรียงเป็นโดมิโน รอยลากเท้ายาวพาดผ่านหน้าร้านขายยา", "หยดน้ำจากเพดานรั่วตกลงบนถังสังกะสีเป็นจังหวะ ติ๊ง… ติ๊ง…"],
  hospital: ["กลิ่นยาฆ่าเชื้อจาง ๆ ยังตกค้างอยู่ใต้กลิ่นเน่า เตียงเข็นเปล่าหมุนช้า ๆ เหมือนเพิ่งมีคนปล่อย", "ไฟฉุกเฉินสีเขียวกะพริบเป็นช่วง ๆ ฉายเงายาวลงบนทางเดิน", "เสียงเครื่องวัดชีพจรปี๊บ… ปี๊บ… ดังมาจากห้องไหนสักห้อง ทั้งที่ไม่มีไฟ", "ผ้าม่านกั้นเตียงพลิ้วไหว รอยเท้าเปื้อนเลือดเดินวนเข้าไปในห้องผ่าตัด", "แฟ้มประวัติคนไข้เกลื่อนพื้น บรรทัดท้ายสุดเขียนด้วยลายมือหมอว่า \"อย่าเปิดประตูชั้นใต้ดิน\"", "รถเข็นยาล้มคว่ำ ขวดยาเกลื่อน กลิ่นฉุนทำให้คุณแสบจมูก"],
  police: ["วิทยุตำรวจซ่าส์ ๆ เป็นช่วง มีเสียงคนพูดไม่ชัดปนอยู่… แล้วก็เงียบ", "รถสายตรวจไร้คนขับจอดค้างริมถนน กระจกมีรอยกระสุนใหม่ ๆ", "กระดานข่าวคนหายเต็มผนังสถานี รูปหลายใบถูกวงด้วยปากกาแดง", "กุญแจมือห้อยอยู่ที่ลูกบิดห้องขัง ประตูแง้มอยู่นิดเดียว", "เสียงปืนลูกซองดังก้องจากไกล ๆ หนเดียว แล้วทุกอย่างกลับสู่ความเงียบ", "ถ้วยกาแฟบนโต๊ะเวรยังมีคราบแห้งเป็นวงสีน้ำตาลติดก้น"],
  forest: ["เสียงกิ่งไม้หักดังเปรี๊ยะจากทางซ้าย คุณหยุดหายใจฟังอยู่ครู่หนึ่ง", "หมอกลอยต่ำระดับเข่า ใบไม้เปียกลื่นใต้รองเท้า", "นกร้องแล้วหยุดกะทันหันทั่วทั้งป่า… ความเงียบแบบนี้ไม่ธรรมดา", "รอยเล็บลึกบนต้นไม้ใหญ่ สูงกว่าหัวคุณ", "กลิ่นดินเปียกปนกลิ่นเนื้อเน่าพัดมาตามลม", "แสงแดดลอดใบไม้เป็นลำสวยงาม แต่ไม่ได้ทำให้คุณรู้สึกปลอดภัยขึ้นเลย"],
  factory: ["สายพานค้างอยู่กลางไลน์ผลิต สลักสนิมส่งเสียงเอี๊ยดเมื่อลมผ่าน", "ไอน้ำพุ่งออกจากท่อรั่วเป็นช่วง ๆ ฟู่… ฟู่… ทำให้เงาในโรงงานดูขยับได้", "หมวกนิรภัยสีเหลืองเรียงอยู่หน้าห้องล็อกเกอร์ ขาดไปหลายใบ", "เสียงมอเตอร์เก่าติดขัดแล้วดับ… ใครเปิดสวิตช์ไว้เมื่อไหร่กัน", "กลิ่นน้ำมันเครื่องกับสารเคมีฉุนจนตาแสบ", "รอยลากเหล็กยาวบนพื้นคอนกรีตมุ่งหน้าไปทางโกดังด้านหลัง"],
  port: ["คลื่นกระทบท่าเรือเป็นจังหวะ เสียงโซ่เรือเสียดกับเสาเสียวฟัน", "ตู้คอนเทนเนอร์ซ้อนสูงเป็นเขาวงกต ประตูตู้หนึ่งแง้มอยู่ มีรอยข่วนด้านใน", "นกนางนวลวนอยู่เหนือกองอะไรสักอย่างที่ปลายท่า", "กลิ่นเค็มปนกลิ่นปลาเน่าพัดมาทางลม", "ไฟประภาคารเก่าหมุนช้า ๆ สาดแสงผ่านสายหมอกแล้วหายไป", "เรือประมงจมครึ่งลำนอนเอียงอยู่ในน้ำ ธงฉีกขาดโบกสะบัด"],
  base: ["ลวดหนามขดเป็นวงรอบค่ายทหาร ป้ายเตือนเขตหวงห้ามผุกร่อนจนอ่านไม่ออก", "ถุงทรายกองสูงหลังจุดยิง ปลอกกระสุนเปล่ากองเป็นเนินเล็ก ๆ", "ธงชาติครึ่งเสาสีซีดจางสะบัดอยู่เหนือหอบังคับการ", "วิทยุสนามดังซ่า… มีเสียงนับถอยหลังวนอยู่ แล้วก็ตัดเงียบไป", "เต็นท์ทหารฉีกขาด รอยกัดที่ขอบเตียงสนามชัดเจน", "รถจิ๊ปคันหนึ่งดับเครื่องกลางลาน กุญแจยังเสียบค้างอยู่"],
  lab: ["ไฟฉุกเฉินสีแดงกะพริบเป็นจังหวะ ป้าย “ห้ามเข้า ตัวอย่างอันตรายทางชีวภาพ” ติดอยู่ทุกบานประตู", "ตู้เพาะเลี้ยงกระจกร้าวเป็นแผ่นใยแมงมุม ของเหลวสีเขียวซีดหยดลงพื้นทีละหยด", "เครื่องปรับอากาศยังทำงานอยู่ใต้ดิน ลมเย็นพัดกลิ่นสารเคมีมาแตะจมูก", "จอคอมพิวเตอร์ค้างอยู่ที่บันทึกการทดลองฉบับสุดท้าย ตัวหนังสือสั่นไหวเหมือนมีใครเพิ่งพิมพ์"],
  tunnel: ["เสียงน้ำหยดก้องในความมืด ติ๋ง… ก้องไปไกลกว่าที่ควรจะเป็น", "ลมเย็นพัดจากลึกเข้าไปในอุโมงค์ เหมือนมีอะไรหายใจอยู่ปลายทาง", "ไฟฉายเริ่มสลัว ผนังคอนกรีตเปียกชื้นสะท้อนเงาเป็นสองสามเงา", "รางรถไฟสนิมเขรอะ ไม้หมอนผุยุ่ย รอยเลือดแห้งลากยาวตามราง", "เสียงเท้าย่ำน้ำดังมาจากที่ไกล ๆ… ตามด้วยเสียงคราง", "กลิ่นอับชื้นปนกลิ่นเหม็นเปรี้ยวของสิ่งที่ไม่ควรมีชีวิตแต่ยังเคลื่อนไหวอยู่"]
};
const AMB_TIME = {
  dawn: ["แสงเช้าสีส้มจางลอดผ่านซากตึก นกยังไม่ตื่นดี", "หมอกเช้าบาง ๆ ยังไม่ทันจาง อากาศเย็นจนมือชา", "รุ่งสางเงียบกว่าที่คิด… เงียบจนได้ยินใจตัวเอง", "น้ำค้างเกาะบนซากรถ คราบเลือดเก่ากลายเป็นสีน้ำตาลเข้ม", "พระอาทิตย์ขึ้นมาอีกวัน บางทีวันนี้อาจเป็นวันดี"],
  day: ["แดดเที่ยงเผาถนนจนอากาศสั่นระริก เหงื่อไหลลงหลัง", "ไม่มีเมฆสักก้อน เงาของคุณสั้นและชัดเจนเกินไป", "แมลงวันฝูงหนึ่งตอมอยู่ไม่ไกล คุณเลือกไม่ดูว่ามันตอมอะไร", "แสงจ้าทำให้ทุกอย่างดูปลอดภัยกว่าที่เป็นจริง", "ลมร้อนพัดกระดาษปลิวผ่านเท้า ตัวหนังสือบนกระดาษอ่านไม่ออกแล้ว"],
  dusk: ["ท้องฟ้าสีแดงฉานเหมือนบาดแผลบนขอบฟ้า", "เงาทอดยาวขึ้นเรื่อย ๆ… ใกล้ค่ำแล้ว", "ฝูงนกบินกลับรังเร็วกว่าปกติ", "แสงสุดท้ายของวันกำลังหมด ไฟฉายเริ่มมีความหมาย", "เสียงแปลก ๆ เริ่มดังขึ้นเมื่อแสงเริ่มลด"],
  night: ["ความมืดหนาจนมือตัวเองแทบมองไม่เห็น", "จันทร์ถูกเมฆบังครึ่งหนึ่ง เงาทุกอย่างดูเหมือนคนยืนอยู่", "เสียงหายใจของตัวเองดังเกินไปในความเงียบยามค่ำ", "ดาวเต็มฟ้า สวยจนลืมไปว่าไม่มีไฟเมืองให้ดูแล้ว", "ไกล ๆ มีเสียงครางยาว ๆ ดังขึ้น แล้วอีกเสียงตอบรับ"]
};
const AMB_LOW = ["แผลสั่นระริกทุกครั้งที่ก้าวเท้า ตาเริ่มพร่า", "มือสั่น หายใจเป็นช่วงสั้น ๆ… ควรหยุดพักหรือไม่", "เลือดหยดลงพื้นตามรอยเท้า ซอมบี้ตามกลิ่นนี้ได้ไม่ยาก", "ร่างกายเตือนว่าไม่ไหวแล้ว แต่คุณยังเลือกจะเดินต่อ"];
const AMB_ZOMBIE = ["กลิ่นคนอุ่น ๆ ลอยมาตามลม ท้องหิวร้องคำราม", "ความหิวเป็นเสียงเดียวในหัว… เนื้อสด", "ในความมืดคุณเห็นร่องรอยชีวิตเป็นประกายจาง ๆ", "เสียงหัวใจคนเต้นดังแว่ว… ทางไหน?", "พวกเดียวกันครางตอบมาจากที่ไกล เหมือนทักทาย"];
// ช่วงเวลาตามวัฏจักรกลางวัน/กลางคืนของเกม (DAY_CYCLE: กลางวัน 60 นาที → กลางคืน 40 นาที): 10 นาทีแรกของกลางวัน = รุ่งสาง, 10 นาทีสุดท้าย = เย็น
const timeSlot = () => { if (isNight()) return "night"; const t = serverNow() % DAY_CYCLE; return t < 600000 ? "dawn" : t >= NIGHT_START - 600000 ? "dusk" : "day"; };
function ambient() {
  const p = state.profile; if (!p || Math.random() > AMB_CHANCE || LS.get("zc_noamb", false)) return;
  const z = p.faction === "zombie", low = !z && p.hp < maxHp() * 0.3, pool = [];
  const add = (arr, w) => { for (let i = 0; i < w; i++) pool.push(...arr); };
  add(AMB_ZONE[state.zone] || [], z ? 1 : 3); add(AMB_TIME[timeSlot()], z ? 1 : 2);
  if (z) add(AMB_ZOMBIE, 3); if (low) add(AMB_LOW, 4);
  try { const wa = wxFlavor("amb"); if (wa && Math.random() < 0.5) { logLine("· " + wa, "ambient"); return; } } catch { /* ข้าม */ }
  const fresh = pool.filter((t) => t !== state.ambLast); const t = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length))];
  if (!t) return; state.ambLast = t; logLine("· " + t, "ambient");
}

/* ---- เสียง/สั่น (ปิดได้ จำค่าไว้ในเครื่อง) ---- */
const SFX = { on: LS.get("zc_sfx", true) !== false, ac: null };
function tone(f, at, dur, type = "square", vol = 0.05) {
  const a = SFX.ac, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, a.currentTime + at); g.gain.exponentialRampToValueAtTime(vol, a.currentTime + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + at); o.stop(a.currentTime + at + dur + 0.02);
}
function sfx(kind) {
  if (!SFX.on) return;
  try { navigator.vibrate?.({ hit: 80, down: [120, 60, 200], low: [60, 40, 60], boss: [100, 60, 100, 60, 200] }[kind] || 50); } catch { /* ไม่รองรับ */ }
  try {
    SFX.ac = SFX.ac || new (window.AudioContext || window.webkitAudioContext)(); SFX.ac.resume?.();
    if (kind === "hit") tone(150, 0, 0.12, "sawtooth", 0.07);
    else if (kind === "down") { tone(220, 0, 0.18, "sawtooth", 0.07); tone(110, 0.18, 0.35, "sawtooth", 0.07); }
    else if (kind === "low") { tone(440, 0, 0.1); tone(330, 0.15, 0.1); }
    else if (kind === "boss") { tone(392, 0, 0.14); tone(523, 0.16, 0.14); tone(659, 0.32, 0.26); }
  } catch { /* ถูกบล็อกจนกว่าจะแตะหน้าจอ */ }
}
function sfxHpWatch(p) {
  const prev = state.hpPrev; state.hpPrev = p.hp;
  if (typeof prev !== "number" || typeof p.hp !== "number") return;
  const mx = maxHp();
  if (p.hp < prev && prev - p.hp >= 8) { sfx(p.hp <= 0 ? "down" : "hit"); notifyOS(p.hp <= 0 ? "💀 คุณล้มลงแล้ว" : "💔 คุณโดนโจมตี", `HP เหลือ ${p.hp}/${mx}`, "hit"); }
  if (prev > mx * 0.25 && p.hp <= mx * 0.25 && p.hp > 0) setTimeout(() => sfx("low"), 350);
}
if (HAS_DOM) document.addEventListener("pointerdown", () => { try { if (SFX.on && SFX.ac) SFX.ac.resume?.(); } catch { /* */ } }, { passive: true });

/* ---- คำเตือนก่อนอันตราย ---- */
function durFrac(it, def) { const mx = it.maxDur ?? def?.maxDur ?? 0; return mx > 0 ? Math.max(0, Math.min(1, it.dur / mx)) : 1; }
const durColor = (f) => (f > 0.5 ? "#7fb069" : f > 0.2 ? "#d9a441" : "#e5533d");
function dangerChips() {
  const p = state.profile, out = []; if (!p || p.hp <= 0) return out;
  const mx = maxHp(), zom = p.faction === "zombie", w = equippedWeapon();
  if (p.hp <= mx * 0.25) out.push(["bad", `💔 HP ต่ำมาก ${p.hp}/${mx}`]); else if (p.hp <= mx * 0.45) out.push(["warn", `💔 HP ต่ำ ${p.hp}/${mx}`]);
  FX_KEYS.filter(effActive).forEach((t) => { if (t === "hot" || (t === "dice" && effV(t) > 0)) return; out.push([t === "stun" ? "bad" : "warn", `${FX_TYPES[t].icon} ${fxName(t)}${t === "bleed" || t === "poison" ? ` −${effV(t)}/รอบ` : ""}`]); });
  if (p.infected && !zom) out.push(["bad", "🦠 ติดเชื้อ HP จะค่อย ๆ ลด"]);
  if (!zom && state.zone !== "safe") {
    if (!w) out.push(["warn", "🗡️ ไม่ได้ถืออาวุธ"]);
    else if (w.it.dur <= 5) out.push(["bad", `🔧 อาวุธใกล้พัง (เหลือ ${w.it.dur})`]);
    else if (durFrac(w.it, w.def) <= 0.2) out.push(["warn", `🔧 อาวุธทนต่ำ (เหลือ ${w.it.dur})`]);
  }
  if (curFood() <= 20 || curWater() <= 20) out.push(["warn", `${curFood() <= 20 ? "🍞 หิว" : ""}${curFood() <= 20 && curWater() <= 20 ? " " : ""}${curWater() <= 20 ? "💧 กระหาย" : ""} — ค้นหาต่อจะเสียเลือด`]);
  const left = Math.floor(curStamina() / Math.max(1, searchCost())); if (left <= 1) out.push(["warn", `⚡ พลังงานเหลือค้นได้ ${left} ครั้ง`]);
  if (state.zone === "safe" && typeof wallBroken === "function" && wallBroken()) out.push(["bad", "🧱 กำแพงพัง — ซอมบี้บุกค่ายได้"]);
  return out;
}
function renderDanger(el) {
  if (!el) return; const chips = dangerChips(), sig = JSON.stringify(chips);
  if (el.dataset.sig === sig) return; el.dataset.sig = sig; el.textContent = "";
  chips.forEach(([lv, t]) => el.append(mk("span", "dchip " + lv, t))); el.classList.toggle("hidden", !chips.length);
}
function fxChanceText(src) {
  const t = MON_FX[src]; if (!t) return "";
  return " • ⚠️ โอกาสติด: " + Object.entries(t).map(([k, [pc]]) => `${FX_TYPES[k].icon}${pc}%`).join(" ");
}

/* ---- สลับอาวุธด้วยปุ่มลัด Q ---- */
if (HAS_DOM) document.addEventListener("keydown", (e) => {
  if (e.key !== "q" && e.key !== "Q") return;
  const tg = e.target; if (e.ctrlKey || e.metaKey || e.altKey || (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || "")) || !state.profile) return;
  const ws = swapGroups().map((x) => x.slot);
  if (ws.length < 2 && !(ws.length === 1 && state.profile.equipped !== ws[0])) return;
  const i = ws.indexOf(state.profile.equipped); swapWeapon(ws[(i + 1) % ws.length]);
});

/* ---- หน้า สรุป / อันดับ / บันทึก ---- */
const HUB_STATS = [["search", "🔎 ค้นหา"], ["found", "🎒 เจอของ"], ["zombie", "🧟 เจอซอมบี้"], ["zwin", "⚔️ ชนะซอมบี้"], ["boss", "👹 ล้มบอสโซน"], ["wbdmg", "🌋 ดาเมจบอสโลก"], ["dmg", "💔 HP ที่เสีย"], ["fx", "☠️ ติดสถานะ"], ["broke", "🔧 อาวุธพัง"], ["death", "💀 ล้มลง"]];
function hubVerdict(s, label) {
  if (!Object.keys(s).length) return `${label}ยังไม่มีบันทึก — ออกไปค้นหาสักรอบสิ`;
  if (s.death >= 3) return `${label}ล้มไป ${s.death} ครั้ง… ระวังตัวและพกยาไว้เยอะ ๆ`;
  if (s.boss >= 2 || s.wbdmg >= 100) return `${label}สู้หนักมาก! ล้มบอสโซน ${s.boss || 0} ตัว ดาเมจบอสโลก ${s.wbdmg || 0}`;
  if (s.death) return `${label}ล้มไป ${s.death} ครั้ง แต่ก็ลุกกลับมาได้`;
  if ((s.search || 0) >= 20) return `${label}ค้นหาไป ${s.search} ครั้ง ขยันมาก เสบียงน่าจะแน่นขึ้น`;
  return `${label}รอดมาได้อย่างเงียบ ๆ`;
}
function hubSummary(box, scope) {
  const today = dayKey(), s = scope === "week" ? statSum(weekStartKey(), today) : statSum(today, today);
  box.append(mk("p", "muted", hubVerdict(s, scope === "week" ? "สัปดาห์นี้" : "วันนี้")));
  const g = mk("div", "hub-grid"); HUB_STATS.forEach(([k, l]) => { const c = mk("div", "hub-card"); c.append(mk("div", "hub-n", String(s[k] || 0)), mk("div", "hub-l", l)); g.append(c); }); box.append(g);
  const days = []; for (let i = 6; i >= 0; i--) days.push(dayKey(serverNow() - i * 86400000));
  const all = LS.get(lsKey("st"), {}), vals = days.map((d) => all[d]?.search || 0), mxv = Math.max(1, ...vals);
  box.append(mk("h3", "", "ค้นหา 7 วันล่าสุด")); const ch = mk("div", "hub-bars");
  days.forEach((d, i) => { const col = mk("div", "hub-col"), b = mk("div", "hub-bar"); b.style.height = Math.max(2, Math.round((vals[i] / mxv) * 60)) + "px"; b.title = `${d}: ${vals[i]}`; col.append(mk("div", "hub-v", String(vals[i])), b, mk("div", "hub-d", d.slice(8))); ch.append(col); });
  box.append(ch, mk("p", "muted", "สถิติเก็บในเครื่องนี้เท่านั้น (เปลี่ยนเครื่อง/ล้างข้อมูลเบราว์เซอร์แล้วจะเริ่มใหม่)"));
}
async function hubRank(box) {
  box.append(mk("p", "muted", "กำลังโหลด…"));
  const me = state.uid, rows = (title, list, fmt) => {
    box.append(mk("h3", "", title));
    if (!list.length) return box.append(mk("p", "muted", "ยังไม่มีข้อมูล"));
    const ol = mk("ol", "hub-rank"); list.forEach((e, i) => { const li = mk("li", e.uid === me ? "me" : "", `${["🥇", "🥈", "🥉"][i] || i + 1 + "."} ${fmt(e)}`); ol.append(li); }); box.append(ol);
  };
  try {
    const wk = wallWk(), [ww, wt] = await Promise.all([get(ref(db, "wallWeek")), get(ref(db, "wallTop"))]);
    const wl = Object.entries(ww.val() || {}).map(([uid, e]) => ({ uid, ...e })).filter((e) => e.wk === wk && e.n > 0).sort((a, b) => b.n - a.n).slice(0, 10);
    const tl = Object.values(wt.val() || {}).filter((e) => e && e.n > 0).sort((a, b) => b.wk - a.wk).slice(0, 5);
    const wbs = [];
    for (const [z, b] of Object.entries(state.wb || {})) {
      if (!b || !b.startedAt) continue;
      try { const h = (await get(ref(db, `worldBossHits/${z}`))).val() || {}; const l = Object.entries(h).map(([uid, e]) => ({ uid, ...e })).filter((e) => e.bid === b.startedAt).sort((a, c) => c.total - a.total).slice(0, 5); if (l.length) wbs.push([b, z, l]); } catch { /* ข้ามโซนที่อ่านไม่ได้ */ }
    }
    box.textContent = "";
    rows("🧱 ทุบกำแพงสัปดาห์นี้ (ซอมบี้)", wl, (e) => `${e.name || "?"} — ${e.n} ครั้ง`);
    rows("🏆 สถิติสัปดาห์ล่าสุด", tl, (e) => `${e.name || "?"} — ${e.n} ครั้ง (สัปดาห์ที่ ${e.wk})`);
    if (!wbs.length) { box.append(mk("h3", "", "👹 ดาเมจบอสโลก"), mk("p", "muted", "ตอนนี้ไม่มีบอสโลก")); }
    wbs.forEach(([b, z, l]) => rows(`${b.icon || "👹"} ${b.name} • ${ZONES[z]?.name || z} ${b.hp > 0 ? "(ยังอยู่)" : "(ล้มแล้ว)"}`, l, (e) => `${e.name || "?"} — ${e.total} ดาเมจ`));
  } catch (e) { box.textContent = ""; box.append(mk("p", "muted", "โหลดอันดับไม่สำเร็จ ลองใหม่อีกครั้ง")); console.error("rank", e); }
}
function hubJournal(box) {
  const j = LS.get(lsKey("jr"), []).slice().reverse();
  const top = mk("div", "row"); top.append(mk("span", "muted", `ล่าสุด ${Math.min(j.length, 120)} จาก ${j.length} รายการ`));
  const clr = btn("ล้าง", () => { if (confirm("ล้างสมุดบันทึกทั้งหมด?")) { LS.set(lsKey("jr"), []); hubTab("log"); } }, "btn ghost mini"); top.append(" ", clr); box.append(top);
  if (!j.length) return box.append(mk("p", "muted", "ยังไม่มีบันทึก"));
  const ul = mk("ul", "hub-log"); let last = "";
  j.slice(0, 120).forEach((e) => { const d = new Date(e.t + 25200000).toISOString(); const dk = d.slice(0, 10); if (dk !== last) { last = dk; ul.append(mk("li", "hub-day", "📅 " + dk)); } ul.append(mk("li", e.c, `${d.slice(11, 16)} ${e.x}`)); });
  box.append(ul);
}
function hubTab(tab) {
  const m = $("hub-modal"); if (!m) return; m.dataset.tab = tab;
  m.querySelectorAll(".hub-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
  const box = $("hub-body"); box.textContent = "";
  if (tab === "day" || tab === "week") hubSummary(box, tab); else if (tab === "rank") hubRank(box); else if (tab === "ach") achRender(box); else if (tab === "world") worldRender(box); else if (tab === "fame") fameRender(box); else hubJournal(box);
}
function openHub(tab = "day") {
  let m = $("hub-modal");
  if (!m) {
    m = mk("div", "modal hidden"); m.id = "hub-modal"; m.setAttribute("role", "dialog");
    const bx = mk("div", "modal-box"); bx.style.maxWidth = "440px";
    const hd = mk("div", "modal-head"); hd.append(mk("h2", "", "📊 สรุป • ความสำเร็จ • โลก"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const tabs = mk("div", "hub-tabs"); [["day", "วันนี้"], ["week", "สัปดาห์"], ["rank", "อันดับ"], ["ach", "🏅"], ["world", "🌍"], ["fame", "🏆"], ["log", "บันทึก"]].forEach(([t, l]) => { const b = btn(l, () => hubTab(t), "btn ghost mini"); b.dataset.t = t; tabs.append(b); });
    const body = mk("div", "hub-body"); body.id = "hub-body";
    bx.append(hd, tabs, body); m.append(bx); document.body.append(m);
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
  }
  m.classList.remove("hidden"); hubTab(tab);
}
function initHubUi() {
  if ($("btn-hub")) return;
  const g = $("btn-guide"); if (!g) return;
  const h = btn("📊", () => openHub(), "btn ghost mini"); h.id = "btn-hub"; h.title = "สรุปวัน/สัปดาห์ • อันดับ • สมุดบันทึก";
  const s = btn("⚙️", () => openSettings(), "btn ghost mini"); s.id = "btn-sfx"; s.title = "ตั้งค่า: เสียง • แจ้งเตือน • แผนที่ • ติดตั้งแอป";
  const ab = btn("🏅", () => openHub("ach"), "btn ghost mini"); ab.id = "btn-ach"; ab.title = "ความสำเร็จ • ฉายา";
  g.before(ab, h, s);
  const sc = $("btn-scavenge"); if (sc && !$("danger-bar")) { const d = mk("div", "danger-bar hidden"); d.id = "danger-bar"; sc.before(d); }
  const bw = $("boss-weapon"); if (bw && !$("boss-warn")) { const d = mk("div", "danger-bar hidden"); d.id = "boss-warn"; bw.after(d); }
}
if (HAS_DOM && !document.getElementById("hub-style")) {
  const st = document.createElement("style"); st.id = "hub-style";
  st.textContent = ".msg.ambient{color:var(--muted);font-style:italic;font-size:13px;opacity:.8}"
    + ".danger-bar{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.dchip{font-size:12px;padding:2px 8px;border-radius:10px;border:1px solid #d9a441;color:#d9a441}.dchip.bad{border-color:#e5533d;color:#e5533d;font-weight:600}"
    + ".hub-tabs{display:flex;gap:4px;margin:10px 0}.hub-tabs .on{outline:1px solid var(--accent,#7fb069)}.hub-body{font-size:14px;line-height:1.5;max-height:60vh;overflow:auto}"
    + ".hub-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:8px 0}.hub-card{border:1px solid var(--line,#3a3a3a);border-radius:8px;padding:6px 8px}.hub-n{font-size:20px;font-weight:700}.hub-l{font-size:12px;opacity:.8}"
    + ".hub-bars{display:flex;gap:6px;align-items:flex-end;height:90px}.hub-col{flex:1;text-align:center;font-size:11px}.hub-bar{background:#7fb069;border-radius:3px 3px 0 0;margin:2px auto 0;width:70%}"
    + ".hub-rank{padding-left:0;list-style:none;margin:4px 0 12px}.hub-rank li{padding:2px 4px}.hub-rank li.me{background:rgba(127,176,105,.18);border-radius:4px}"
    + ".hub-log{list-style:none;padding:0;margin:6px 0}.hub-log li{padding:2px 0;font-size:13px}.hub-log li.combat{color:var(--hazard,#d9a441)}.hub-log li.system{color:#ff5b47}.hub-day{font-weight:700;margin-top:8px}";
  document.head.append(st);
}
if (HAS_DOM) initHubUi();

/* ---- มือถือ: ความสูงหน้าจอจริง (กัน Chrome มือถือคำนวณ 100dvh ค้าง/เพี้ยนหลังคีย์บอร์ดปิดหรือสลับแท็บ → เห็นพื้นที่ว่างใต้แถบเมนู) ---- */
function fitViewport() {
  try { const h = Math.round(window.visualViewport?.height || window.innerHeight); if (h > 200) document.documentElement.style.setProperty("--app-h", h + "px"); } catch { /* ใช้ 100dvh ตามเดิม */ }
}
if (HAS_DOM && typeof window !== "undefined") {
  fitViewport();
  ["resize", "orientationchange", "pageshow"].forEach((ev) => window.addEventListener(ev, fitViewport));
  window.visualViewport?.addEventListener("resize", fitViewport);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { fitViewport(); setTimeout(fitViewport, 400); } });
  document.addEventListener("focusout", () => setTimeout(fitViewport, 350));   // คีย์บอร์ดเพิ่งปิด
}

/* =========================================================
   23) แผนที่โซน • ติดตั้งเป็นแอป (PWA) • แจ้งเตือนเมื่อพร้อม • ตั้งค่า • ไอเทมโปรด (hotbar)
   ฝั่งเกมล้วน — ไม่แตะ rules (แผนที่ใช้ปุ่มโซนเดิม ฟังก์ชันเดินทางเดิมทุกอย่าง)
   ========================================================= */
/* ---- แผนที่โซน: ตำแหน่งโหนด (เปอร์เซ็นต์) และถนนเชื่อม — แค่ภาพ ไม่มีผลกับค่าเดินทาง ---- */
// ผังแผนที่: แถวล่างสุด = Safe Zone ยิ่งขึ้นไปยิ่งไกล/อันตราย (ใกล้: ป่าลึก เขตเมืองร้าง / กลาง: ท่าเรือ โรงงาน ห้าง โรงพยาบาล / ไกล: ค่ายทหาร สถานีตำรวจ อุโมงค์)
const ZMAP = { casino: [20, 34], base: [20, 12], police: [50, 12], tunnel: [80, 12], lab: [80, 34], hospital: [50, 34], port: [20, 56], factory: [50, 56], mall: [80, 56], ruins: [20, 78], safe: [50, 78], forest: [80, 78] };
const ZROADS = [["safe", "ruins"], ["safe", "forest"], ["safe", "factory"], ["ruins", "port"], ["forest", "mall"], ["factory", "port"], ["factory", "mall"], ["factory", "hospital"], ["hospital", "base"], ["hospital", "police"], ["hospital", "tunnel"], ["hospital", "lab"], ["tunnel", "lab"], ["hospital", "casino"]];
const zmapOn = () => LS.get("zc_zmap", "map") !== "list";
function zmapRoads() {
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none");
  ZROADS.forEach(([a, b]) => { if (!ZMAP[a] || !ZMAP[b]) return; const l = document.createElementNS(ns, "line"); l.setAttribute("x1", ZMAP[a][0]); l.setAttribute("y1", ZMAP[a][1]); l.setAttribute("x2", ZMAP[b][0]); l.setAttribute("y2", ZMAP[b][1]); l.setAttribute("vector-effect", "non-scaling-stroke"); svg.append(l); });
  const li = mk("li", "zroads"); li.setAttribute("aria-hidden", "true"); li.append(svg); return li;
}
function buildZoneList() {
  const ul = $("zone-list"); ul.innerHTML = "";
  ul.append(zmapRoads());
  [...Object.entries(ZONES), ["casino", ZONES.casino]].forEach(([id, z]) => {
    const li = mk("li"); li.style.padding = "0"; li.style.border = "0"; li.style.background = "none";
    if (ZMAP[id]) { li.style.setProperty("--x", ZMAP[id][0] + "%"); li.style.setProperty("--y", ZMAP[id][1] + "%"); }
    const b = mk("button", "zone-btn");
    const dg = dangerInfo(id), nm = mk("span", "zname"); nm.append(mk("b", "zi", z.icon), mk("span", "zt", z.name));
    b.append(nm, mk("span", "danger-tag d" + dg.tier, `⚠ ${z.danger}/10`));
    b.title = `${z.name} • อันตราย ${z.danger}/10 • เจอซอมบี้ ${dg.chance}%`;
    b.dataset.zone = id;
    b.addEventListener("click", () => { enterZone(id); setTab("chat"); });
    li.append(b); ul.append(li);
  });
  ul.append((() => { const lg = mk("li", "zlegend", "⚠ อันตราย • ⚡ ค่าเดินทาง • 👥 คนในโซน • 👹 บอสโลก"); return lg; })());
  zmapApply(); zmapListen(); zmapBadges();
}
function zmapApply() {
  const ul = $("zone-list"); if (!ul) return; const on = zmapOn(); ul.classList.toggle("zmap", on);
  let tg = $("zmap-toggle");
  if (!tg) {
    tg = mk("div", "zmap-toggle"); tg.id = "zmap-toggle";
    [["map", "🗺️ แผนที่"], ["list", "☰ รายการ"]].forEach(([m, l]) => { const b = btn(l, () => { LS.set("zc_zmap", m); zmapApply(); }, "btn ghost mini"); b.dataset.m = m; tg.append(b); });
    ul.before(tg);
  }
  tg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.m === "map") === on));
}
// จำนวนผู้เล่นในแต่ละโซน (ฟัง zonePlayers ทุกโซน — ข้อมูลเล็ก) + เครื่องหมายบอสโลก
function zmapListen() {
  if (state.zmapOn) return; state.zmapOn = true; state.zcount = state.zcount || {};
  [...Object.keys(ZONES), "casino"].forEach((z) => onValue(ref(db, "zonePlayers/" + z), (s) => { try { state.zcount[z] = typeof s.numChildren === "function" ? s.numChildren() : Object.keys(s.val?.() || s || {}).length; zmapBadges(); } catch (e) { console.warn("zcount", z, e); } }, () => {}));
}
function zmapBadges() {
  document.querySelectorAll(".zone-btn").forEach((b) => {
    const z = b.dataset.zone; if (!z) return;
    let c = b.querySelector(".zc"); if (!c) { c = mk("span", "zc"); b.append(c); }
    const n = state.zcount?.[z] || 0, wb = state.wb?.[z], boss = wb && wbAlive(wb);
    const txt = (n ? `👥${n}` : "") + (boss ? " 👹" : ""); if (c.textContent !== txt) c.textContent = txt;
    c.classList.toggle("hidden", !txt); b.classList.toggle("hasboss", !!boss);
  });
}

/* ---- ตั้งค่า (⚙️): เสียง • แจ้งเตือน • ข้อความบรรยากาศ • แผนที่ • ติดตั้งแอป ---- */
const NT = { on: LS.get("zc_notif", false) === true };
let deferredInstall = null;
if (HAS_DOM && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
  window.addEventListener("appinstalled", () => { deferredInstall = null; toast("ติดตั้งแอปแล้ว"); });
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch((e) => console.warn("sw", e)));
}
const isStandalone = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch { return false; } };
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "");
async function toggleNotif(on) {
  if (!on) { NT.on = false; LS.set("zc_notif", false); return true; }
  if (!("Notification" in window)) { toast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน"); return false; }
  let perm = Notification.permission; if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") { toast("ยังไม่ได้อนุญาตการแจ้งเตือน (ไปตั้งค่าเบราว์เซอร์ → การแจ้งเตือน)"); return false; }
  NT.on = true; LS.set("zc_notif", true); return true;
}
function openSettings() {
  let m = $("set-modal");
  if (!m) {
    m = mk("div", "modal hidden"); m.id = "set-modal"; m.setAttribute("role", "dialog");
    const bx = mk("div", "modal-box"); bx.style.maxWidth = "420px";
    const hd = mk("div", "modal-head"); hd.append(mk("h2", "", "⚙️ ตั้งค่า"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div", "set-body"); body.id = "set-body"; bx.append(hd, body); m.append(bx); document.body.append(m);
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
  }
  m.classList.remove("hidden"); renderSettings();
}
function renderSettings() {
  const body = $("set-body"); if (!body) return; body.textContent = "";
  const row = (label, hint, on, fn) => {
    const r = mk("label", "set-row"), t = mk("span", "set-t"); t.append(mk("b", "", label)); if (hint) t.append(mk("small", "muted", hint));
    const cb = mk("input"); cb.type = "checkbox"; cb.checked = !!on; cb.addEventListener("change", async () => { const ok = await fn(cb.checked); if (ok === false) cb.checked = !cb.checked; });
    r.append(t, cb); body.append(r);
  };
  row("🔊 เสียงและสั่นเตือน", "ตอนบอสโลกเกิด โดนตีแรง และ HP ต่ำ", SFX.on, (v) => { SFX.on = v; LS.set("zc_sfx", v); const s = $("btn-sfx"); if (s) s.title = v ? "ตั้งค่า (เสียงเปิดอยู่)" : "ตั้งค่า (เสียงปิดอยู่)"; if (v) sfx("low"); });
  row("🔔 แจ้งเตือนบนอุปกรณ์", "เด้งเมื่อพลังงานเต็ม เดินทาง/บอสโซนพร้อม สำรวจ/สัตว์เลี้ยง/โต๊ะคราฟต์เสร็จ บอสโลกเกิด หรือโดนตี — เฉพาะตอนเกมถูกพับอยู่เบื้องหลัง (ต้องไม่ปิดแท็บ/แอป)", NT.on, toggleNotif);
  row("💬 ซ่อนข้อความบรรยากาศ", "ปิดข้อความสั้น ๆ ที่โผล่ตอนค้นหา", LS.get("zc_noamb", false), (v) => { LS.set("zc_noamb", v); });
  row("✨ เอฟเฟกต์ภาพ", "ขอบจอตามสถานะ ตัวเลขดาเมจลอย ลูกเต๋า (ปิดถ้าเครื่องช้า)", !LS.get("zc_fxoff", false), (v) => { LS.set("zc_fxoff", !v); try { fxStatus(); } catch { /* */ } });
  row("🗺️ แสดงโซนเป็นแผนที่", "ปิด = แสดงเป็นรายการแบบเดิม", zmapOn(), (v) => { LS.set("zc_zmap", v ? "map" : "list"); zmapApply(); });
  const ins = mk("div", "set-install"); ins.append(mk("b", "", "📲 ติดตั้งเป็นแอป"));
  if (isStandalone()) ins.append(mk("small", "muted", "คุณกำลังใช้งานแบบแอปอยู่แล้ว"));
  else if (deferredInstall) ins.append(mk("small", "muted", "เปิดเต็มจอ ไม่มีแถบเบราว์เซอร์ และมีไอคอนบนหน้าจอหลัก"), btn("ติดตั้งเลย", async () => { try { deferredInstall.prompt(); await deferredInstall.userChoice; } catch { /* ยกเลิก */ } deferredInstall = null; renderSettings(); }, "btn primary mini"));
  else if (isIOS()) ins.append(mk("small", "muted", "iPhone/iPad: กดปุ่มแชร์ (สี่เหลี่ยมมีลูกศรขึ้น) ใน Safari แล้วเลือก \"เพิ่มลงหน้าจอโฮม\""));
  else ins.append(mk("small", "muted", "เปิดเมนู ⋮ ของเบราว์เซอร์ → \"ติดตั้งแอป\" หรือ \"เพิ่มลงหน้าจอหลัก\""));
  body.append(ins);
  try { kSettingsExtra(body); } catch { /* ข้าม */ }
}
function notifyOS(title, bodyText, tag) {
  try {
    if (!NT.on || !("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;   // กำลังดูเกมอยู่ → ไม่ต้องเด้ง
    const opts = { body: bodyText, tag, icon: "icon-192.png", badge: "icon-192.png" };
    const fallback = () => { try { new Notification(title, opts); } catch { /* Android ต้องผ่าน service worker */ } };
    if (navigator.serviceWorker?.getRegistration) navigator.serviceWorker.getRegistration().then((r) => (r ? r.showNotification(title, opts) : fallback())).catch(fallback); else fallback();
  } catch { /* แจ้งเตือนไม่ได้ก็ข้าม */ }
}
// ตรวจทุก 15 วิ: พลังงานเต็ม / เดินทางได้ / บอสโซนเจอได้อีก
function notifyTick() {
  const p = state.profile; if (!p || p.hp <= 0 || !state.uid) return;
  const full = curStamina() >= maxStamina(), trav = travelCooldownLeft() > 0, bos = bossCooldownLeft() > 0, nf = state.nf || (state.nf = { full: true, trav: false, bos: false });
  if (full && !nf.full) notifyOS("⚡ พลังงานเต็มแล้ว", "กลับไปค้นหา/เดินทางได้เลย", "stam");
  if (!trav && nf.trav) notifyOS("🧭 เดินทางได้แล้ว", "พักจากการเดินทางครบแล้ว", "trav");
  if (!bos && nf.bos) notifyOS("👹 บอสประจำโซนกลับมาเจอได้แล้ว", "ค้นหาต่อได้เลย", "bos");
  nf.full = full; nf.trav = trav; nf.bos = bos;
  try { kNotifyTick(); } catch { /* ข้าม */ }
}
if (HAS_DOM) setInterval(() => { try { notifyTick(); } catch { /* */ } }, 15000);

/* ---- ไอเทมโปรด (hotbar): ปักของใช้ได้สูงสุด 4 ช่อง กดใช้จากแถบใต้หลอดพลัง ---- */
const HOT_MAX = 4;
const hotPins = () => LS.get(lsKey("hot"), []).filter((s) => typeof s === "string").slice(0, HOT_MAX);
function hotToggle(slot) {
  const h = hotPins(), i = h.indexOf(slot);
  if (i >= 0) h.splice(i, 1); else { if (h.length >= HOT_MAX) return toast(`ปักได้สูงสุด ${HOT_MAX} ช่อง — เลิกปักชิ้นอื่นก่อน`); h.push(slot); }
  LS.set(lsKey("hot"), h); renderHotbar(); renderInv();
}
const hotPinBtn = (slot) => { const on = hotPins().includes(slot), b = btn(on ? "★" : "☆", () => hotToggle(slot), "btn ghost mini" + (on ? " on" : "")); b.title = on ? "เลิกปักไว้ที่แถบลัด" : "ปักไว้ที่แถบลัด"; return b; };
function renderHotbar() {
  const el = $("hotbar"); if (!el) return;
  const items = hotPins().map((slot) => [slot, state.inv?.[slot]]).filter(([, it]) => it && it.qty > 0).map(([slot, it]) => [slot, it, defOf(it)]).filter(([, , d]) => d && d.type === "consumable");
  const sig = items.map(([s, it]) => `${s}:${it.qty}`).join(",");
  if (el.dataset.sig === sig) return; el.dataset.sig = sig; el.textContent = "";
  items.forEach(([slot, it, d]) => { const b = btn(`${d.icon || "🧪"} ×${it.qty}`, () => { if (state.boss) return toast("กำลังสู้บอสอยู่ — ใช้ปุ่มในหน้าบอส"); useItem(slot); }, "btn ghost mini hot"); b.title = `ใช้ ${d.name}`; el.append(b); });
  el.classList.toggle("hidden", !items.length);
}
function initMapUi() {
  const bars = document.querySelector(".bars"); if (bars && !$("hotbar")) { const h = mk("div", "hotbar hidden"); h.id = "hotbar"; bars.after(h); }
}
if (HAS_DOM) { initMapUi(); }

/* =========================================================
   NPC ในค่าย (sec24): มิรา / เคน — คุยแบบนิยายภาพ สะสมหัวใจ ได้ของขวัญรายวัน
   - ข้อมูลความสัมพันธ์ npc/{uid}/{id} = { p: คะแนน 0-100, d: วันที่คุยล่าสุด(qpDayKey), s: ตอนเรื่องราวที่จบแล้ว 0-5,
     m: บิตแฟลกความจำ (บิต 0-15 = แฟลกในบท, บิต 20 = แนะนำตัวแล้ว), v: บิตหัวข้อคุยที่เคยเจอ }
   - บทพูดอยู่ในไฟล์ npc-{id}.json (โหลดตอนเปิดคุยครั้งแรก) — แก้/เพิ่มบทได้โดยไม่ต้องแตะ rules; ห้ามสลับลำดับ topics (บิต v ผูกกับลำดับ) ให้เพิ่มต่อท้ายเท่านั้น
   - ของขวัญรายวัน = เควสรายวัน {id}_h1…h5 (ev=npc_{id}) ใน config/questDefs — เจ้าของกดปุ่ม "เติมเควส NPC" ในหน้าภารกิจหนึ่งครั้ง
   ========================================================= */
const NPC_IDS = ["mira", "kane"];
const NPC_META = {
  tara: { name: "ธารา", icon: "🧑‍🔬", title: "นักวิจัยโครงการ HC", blurb: "นักวิจัยที่รอดจากศูนย์วิจัยใต้ดิน" },
  mira: { name: "มิรา", icon: "🧑‍⚕️", title: "หมอประจำค่าย", blurb: "ประจำเต็นท์พยาบาลริมกำแพง พูดน้อย มือนิ่งเสมอ ชอบชงชามอสให้คนที่ดูไม่ไหว" },
  kane: { name: "เคน", icon: "🪖", title: "ยามเฝ้ากำแพง", blurb: "อดีตทหารช่าง เดินตรวจกำแพงทุกรอบ ห้วนๆ แต่จำได้ว่าใครกลับมาไม่ครบ" }
};
const NPC_HEART_AT = [8, 20, 36, 56, 80], NPC_INTRO_BIT = 1 << 20, NPC_DAILY_CAP = 4, NPC_FLAG_MASK = 0xFFFF;
// ของขวัญตามหัวใจ (ต้องเป็นของที่ rules ของเควสอนุญาต, qty ≤ 20)
const NPC_GIFT = {
  mira: [
    { human: { id: "bandage", qty: 1 }, zombie: { id: "rotten_meat", qty: 1 } },
    { human: { id: "bandage", qty: 2 }, zombie: { id: "rotten_meat", qty: 2 } },
    { human: { id: "antidote", qty: 1 }, zombie: { id: "rotten_meat", qty: 2 } },
    { human: { id: "medkit", qty: 1 }, zombie: { id: "rotten_meat", qty: 3 } },
    { human: { id: "trauma_kit", qty: 1 }, zombie: { id: "rotten_meat", qty: 4 } }
  ],
  kane: [
    { human: { id: "scrap", qty: 3 }, zombie: { id: "rotten_meat", qty: 1 } },
    { human: { id: "canned_food", qty: 2 }, zombie: { id: "rotten_meat", qty: 1 } },
    { human: { id: "army_meal", qty: 1 }, zombie: { id: "rotten_meat", qty: 2 } },
    { human: { id: "energy_drink", qty: 2 }, zombie: { id: "rotten_meat", qty: 3 } },
    { human: { id: "stim_shot", qty: 1 }, zombie: { id: "rotten_meat", qty: 3 } }
  ]
};
const NPC_DATA = {};
const npcRec = (id) => ({ p: 0, d: 0, s: 0, m: 0, v: 0, ...(state.npc?.[id] || {}) });
const npcHeartsOf = (p) => NPC_HEART_AT.filter((x) => p >= x).length;
const npcHearts = (id) => npcHeartsOf(npcRec(id).p);
const npcToday = () => qpDayKey(serverNow());
const npcHeartStr = (h) => "❤️".repeat(h) + "🤍".repeat(5 - h);
const npcChapterReady = (id) => { const r = npcRec(id); return !!(r.m & NPC_INTRO_BIT) && r.s < 5 && npcHeartsOf(r.p) >= r.s + 1; };

function npcQuestSeed() {
  const o = {};
  NPC_IDS.forEach((id) => NPC_GIFT[id].forEach((g, i) => {
    o[`${id}_h${i + 1}`] = { title: `${NPC_META[id].icon} คุยกับ${NPC_META[id].name} (❤️${i + 1}) รับของขวัญ`, desc: `คุยกับ${NPC_META[id].name}ที่ Safe Zone วันละครั้ง (ของขวัญดีขึ้นตามหัวใจ)`, ev: "npc_" + id, need: 1, r: g };
  }));
  return o;
}
const QP_STREAK_SEED = {
  "daily/dlogin": { title: "📻 เช็กอินวันนี้", desc: "แค่เปิดเกมก็นับ กดรับรางวัลได้เลย", ev: "login", need: 1, r: { human: { id: "water", qty: 1 }, zombie: { id: "water", qty: 1 } } },
  "daily/dall": { title: "รับรางวัลภารกิจรายวันครบ 4 ข้อ", desc: "รวมเช็กอินและของขวัญ NPC", ev: "dclaim", need: 4, r: { human: { id: "energy_drink", qty: 1 }, zombie: { id: "energy_drink", qty: 1 } } },
  "weekly/wa3": { title: "เช็กอิน 3 วันในสัปดาห์นี้", ev: "login", need: 3, r: { human: { id: "canned_food", qty: 3 }, zombie: { id: "rotten_meat", qty: 3 } } },
  "weekly/wa5": { title: "เช็กอิน 5 วันในสัปดาห์นี้", ev: "login", need: 5, r: { human: { id: "medkit", qty: 1 }, zombie: { id: "medkit", qty: 1 } } },
  "weekly/wa7": { title: "เช็กอินครบ 7 วัน 🔥", ev: "login", need: 7, r: { human: { id: "trauma_kit", qty: 1 }, zombie: { id: "trauma_kit", qty: 1 } } },
  "daily/dsiege": { title: "🚨 ร่วมคืนปิดล้อม (ทุบ/ซ่อมกำแพง 5 ครั้ง)", desc: "นับเฉพาะช่วงคืนปิดล้อม ที่เซฟโซน — ดูเวลาได้ที่แผงวิทยุ", ev: "siege", need: 5, r: { human: { id: "army_meal", qty: 1 }, zombie: { id: "rotten_meat", qty: 5 } } },
  "weekly/wsiege": { title: "ร่วมคืนปิดล้อมให้ครบ 3 คืน", ev: "siegen", need: 3, r: { human: { id: "stim_shot", qty: 2 }, zombie: { id: "stim_shot", qty: 2 } } },
  "weekly/wgoal": { title: "🌍 ร่วมทำเป้าหมายประจำสัปดาห์ให้สำเร็จ", desc: "ช่วยให้เป้าหมายร่วมสำเร็จอย่างน้อย 1 ข้อ (ดู 📊 → 🌍)", ev: "goalok", need: 1, r: { human: { id: "medkit", qty: 1 }, zombie: { id: "medkit", qty: 1 } } },
  "weekly/wgoal2": { title: "ทำเป้าหมายประจำสัปดาห์ครบทั้ง 2 ข้อ", desc: "เป้าหมายทั้งเซิร์ฟเวอร์ + เป้าหมายของฝั่งคุณ", ev: "goalok", need: 2, r: { human: { id: "trauma_kit", qty: 1 }, zombie: { id: "trauma_kit", qty: 1 } } },
  "daily/dmis": { title: "📻 ร่วมภารกิจกลุ่มจากวิทยุให้สำเร็จ", desc: "ภารกิจกลุ่มประกาศทางวิทยุ ดูความคืบหน้าที่ 📊 → 🌍", ev: "gmok", need: 1, r: { human: { id: "energy_drink", qty: 1 }, zombie: { id: "rotten_meat", qty: 5 } } },
  "daily/dbty": { title: "🎯 เก็บค่าหัวสำเร็จ 1 ครั้ง", desc: "ล้มผู้เล่นที่มีค่าหัว (ปุ่ม 💰 ที่รายชื่อผู้เล่น / ดู 📊 → 🌍)", ev: "btyok", need: 1, r: { human: { id: "trauma_kit", qty: 1 }, zombie: { id: "trauma_kit", qty: 1 } } },
  "weekly/wbty3": { title: "🎯 นักล่าค่าหัว: เก็บค่าหัว 3 ครั้งในสัปดาห์นี้", ev: "btyok", need: 3, r: { human: { id: "riot_vest", qty: 1 }, zombie: { id: "mut_hide1", qty: 1 } } },
  "weekly/wbty6": { title: "🎯 ตำนานนักล่า: เก็บค่าหัว 6 ครั้งในสัปดาห์นี้", ev: "btyok", need: 6, r: { human: { id: "army_vest", qty: 1 }, zombie: { id: "mut_hide2", qty: 1 } } },
  "weekly/wst7": { title: "🧪 เช็กอินครบ 7 วัน รับแคปซูลสเตตัส", desc: "ใช้อัปสเตตัสถาวรที่ปุ่ม 🧪 ในกระเป๋า", ev: "login", need: 7, r: { human: { id: "stat_cap", qty: 1 }, zombie: { id: "stat_cap", qty: 1 } } },
  "weekly/wstw": { title: "🧪 ตีบอสโลก 10 ครั้ง รับแคปซูลสเตตัส", ev: "wboss", need: 10, r: { human: { id: "stat_cap", qty: 1 }, zombie: { id: "stat_cap", qty: 1 } } },
  "weekly/wlim": { title: "🔓 ตีบอสโลก 30 ครั้ง รับแกนทะลุขีดจำกัด", desc: "ใช้ขยายเพดานสเตตัสที่เต็มแล้ว", ev: "wboss", need: 30, r: { human: { id: "stat_lim", qty: 1 }, zombie: { id: "stat_lim", qty: 1 } } },
  "weekly/wmis": { title: "ภารกิจกลุ่มสำเร็จ 4 ครั้งในสัปดาห์", ev: "gmok", need: 4, r: { human: { id: "stim_shot", qty: 2 }, zombie: { id: "stim_shot", qty: 2 } } }
};
async function qpSeedStreak() {
  if (state.profile?.role !== "owner") return;
  if (!confirm("เติมเควสเช็กอิน + ปิดล้อม + เป้าหมายร่วม?\nจะเพิ่ม/อัปเดต daily: dlogin, dall, dsiege, dmis, dbty และ weekly: wa3, wa5, wa7, wsiege, wgoal, wgoal2, wmis, wbty3, wbty6, wst7, wstw, wlim (🧪 แคปซูล/🔓 แกนขยายเพดาน) โดยไม่แตะเควสอื่น")) return;
  try { await update(ref(db, "config/questDefs"), QP_STREAK_SEED); toast("เติมเควสเช็กอิน/ปิดล้อม/เป้าหมายร่วมแล้ว"); }
  catch (e) { console.error("qpSeedStreak", e?.code || e); toast(errMsg(e)); }
}
async function qpSeedNpc() {
  if (state.profile?.role !== "owner") return;
  if (!confirm("เติมเควส NPC?\nจะเพิ่ม/อัปเดตเควส mira_h1…h5, kane_h1…h5 (10 ข้อ) ใน config/questDefs/daily โดยไม่แตะเควสอื่น")) return;
  try { await update(ref(db, "config/questDefs/daily"), npcQuestSeed()); toast("เติมเควส NPC แล้ว"); }
  catch (e) { console.error("qpSeedNpc", e?.code || e); toast(errMsg(e)); }
}
// เควสของขวัญ NPC: แสดงเฉพาะขั้นสูงสุดที่หัวใจถึง (วันละหนึ่งชิ้นต่อ NPC)
function npcQuestShown(per, qid, d) {
  if (!d || typeof d.ev !== "string" || !d.ev.startsWith("npc_")) return true;
  const id = d.ev.slice(4), m = /_h(\d)$/.exec(qid);
  if (!m || !NPC_IDS.includes(id) || !qid.startsWith(id + "_h")) return true;
  const tier = +m[1], hearts = npcHearts(id);
  if (tier > hearts) return false;
  const top = Math.max(0, ...Object.keys(state.qDefs?.[per] || {}).filter((k) => k.startsWith(id + "_h")).map((k) => +k.slice(id.length + 2)).filter((n) => n <= hearts));
  return tier === top;
}
function npcListen() {
  if (state.npcOn || !state.uid) return; state.npcOn = true; state.npc = {};
  onValue(ref(db, "npc/" + state.uid), (s) => { state.npc = s.val() || {}; state.npcReady = true; try { renderNpcBox(); qpRefresh(); hcRender(); } catch { /* ยังไม่พร้อม */ } }, (e) => console.error("npc", e));
}
async function npcLoad(id) {
  if (NPC_DATA[id]) return NPC_DATA[id];
  try { const r = await fetch(`npc-${id}.json`, { cache: "no-cache" }); if (!r.ok) throw new Error(r.status); NPC_DATA[id] = await r.json(); return NPC_DATA[id]; }
  catch (e) { console.warn("npc load", id, e); toast("โหลดบทสนทนาไม่สำเร็จ ลองใหม่อีกครั้ง"); return null; }
}
function npcCtx() {
  const p = state.profile || {}, dk = dayKey();
  return {
    slot: timeSlot(), zombie: p.faction === "zombie", human: p.faction !== "zombie",
    hurt: p.hp > 0 && p.hp < maxHp() * 0.4, hungry: curFood() < 30 || curWater() < 30,
    wallbroken: (() => { try { return wallBroken(); } catch { return false; } })(),
    wboss: Object.values(state.wb || {}).some((b) => wbAlive(b)),
    died: (statSum(dk, dk).death || 0) > 0, infected: !!p.infected && p.faction === "human"
  };
}
const npcPick = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
function npcGreeting(data, id) {
  const g = data.greet || {}, c = npcCtx(), h = npcHearts(id);
  const act = ["zombie", "infected", "wallbroken", "died", "hurt", "hungry", "wboss"].filter((k) => c[k] && g.cond?.[k]?.length);
  const r = Math.random();
  let pool;
  if (act.length && r < (c.zombie ? 0.5 : 0.55)) pool = g.cond[act.length > 1 && c.zombie && Math.random() < 0.4 ? npcPick(act.filter((k) => k !== "zombie")) || "zombie" : npcPick(act)];
  else if (r < 0.85 && g.slot?.[c.slot]?.length) pool = g.slot[c.slot];
  else pool = g.byHearts?.[h] || g.byHearts?.["0"];
  return npcPick((pool || []).filter((l) => !l.f || l.f === (c.zombie ? "zombie" : "human")));
}
function npcPickTopic(data, id) {
  const rec = npcRec(id), c = npcCtx(), h = npcHearts(id), T = data.topics || [];
  const ok = (s, i, ignoreSeen) => s.min <= h && (!s.for || s.for === (c.zombie ? "zombie" : "human")) && (!s.when || s.when === c.slot) && (!s.if || c[s.if]) && (ignoreSeen || !(rec.v & (1 << i)));
  let cand = T.map((s, i) => [s, i]).filter(([s, i]) => ok(s, i, false));
  let reset = false;
  if (!cand.length) { cand = T.map((s, i) => [s, i]).filter(([s, i]) => ok(s, i, true)); reset = true; }
  if (!cand.length) return null;
  const sc = ([s]) => (s.if ? 4 : 0) + (s.when ? 2 : 0) + (s.min === h ? 1 : 0) + Math.random() * 3;
  cand.sort((a, b) => sc(b) - sc(a));
  return { scene: cand[0][0], idx: cand[0][1], reset };
}

/* ---- เครื่องเล่นฉาก (UI แบบนิยายภาพ) ---- */
const npcRun = { tok: 0, mode: "", skip: null, adv: null, id: null, lines: 0 };
const NPC_CPS = 42;
const npcName = () => state.profile?.username || "คุณ";
function npcTap() { if (npcRun.mode === "typing") npcRun.skip?.(); else if (npcRun.mode === "wait") npcRun.adv?.(); }
function npcEnsureModal() {
  let m = $("npc-modal"); if (m) return m;
  m = mk("div", "modal hidden"); m.id = "npc-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  const bx = mk("div", "modal-box npc-vn"), hd = mk("div", "npc-head");
  const face = mk("div", "npc-face"); face.id = "npc-face";
  const info = mk("div", "npc-info"); info.id = "npc-info";
  hd.append(face, info, btn("ปิด", () => npcClose(), "btn ghost mini"));
  const log = mk("div", "npc-log"); log.id = "npc-log"; log.addEventListener("click", npcTap);
  const ctl = mk("div", "npc-ctl"); ctl.id = "npc-ctl";
  bx.append(hd, log, ctl); m.append(bx); document.body.append(m);
  m.addEventListener("click", (e) => { if (e.target === m) npcClose(); });
  return m;
}
function npcClose(force) {
  const m = $("npc-modal"); if (!m || m.classList.contains("hidden")) return;
  if (!force && npcRun.mode && npcRun.lines > 0 && npcRun.inScene && !confirm("ออกกลางคัน?\nความคืบหน้าของฉากนี้จะไม่ถูกบันทึก")) return;
  npcRun.tok++; npcRun.mode = ""; npcRun.inScene = false; m.classList.add("hidden");
}
function npcHeader(id) {
  const rec = npcRec(id), h = npcHeartsOf(rec.p), meta = NPC_META[id], info = $("npc-info"); if (!info) return;
  info.textContent = "";
  try { achSet(id, h); } catch { /* ข้าม */ }
  const nxt = h < 5 ? NPC_HEART_AT[h] : null, prev = h ? NPC_HEART_AT[h - 1] : 0;
  const bar = mk("div", "npc-pbar"), fill = mk("i"); fill.style.width = (nxt ? Math.max(4, Math.min(100, ((rec.p - prev) / (nxt - prev)) * 100)) : 100) + "%"; bar.append(fill);
  info.append(mk("b", "npc-nm", `${meta.name} `), mk("small", "muted", meta.title), mk("div", "npc-hearts", npcHeartStr(h)), bar);
}
// ---- ช่องภาพ (ไม่บังคับ): วางไฟล์ WebP ใน img/ แล้วเกมใช้เองถ้าพบ ไม่พบ = ใช้อีโมจิเดิม ----
const IMG_OK = {};
function imgProbe(src, cb) {
  if (IMG_OK[src] === true) return cb(true); if (IMG_OK[src] === false) return cb(false);
  const im = new Image(); im.onload = () => { IMG_OK[src] = true; cb(true); }; im.onerror = () => { IMG_OK[src] = false; cb(false); }; im.src = src;
}
const NPC_MOOD = { "🙂": "calm", "😐": "calm", "😶": "calm", "😌": "calm", "😏": "smirk", "😊": "smile", "😔": "sad", "🥲": "sad", "😮\u200d💨": "tired", "😴": "tired", "😠": "angry", "😮": "shock", "😳": "shock" };
function npcPortrait(el, id, e) {
  if (!el || !id) return;
  const mood = NPC_MOOD[e] || "calm", want = `img/npc/${id}_${mood}.webp`, base = `img/npc/${id}_calm.webp`;
  imgProbe(want, (ok) => {
    if (el.dataset.want !== want) return;
    if (ok) { el.style.backgroundImage = `url(${want})`; el.classList.add("has-img"); el.textContent = ""; }
    else imgProbe(base, (ok2) => { if (el.dataset.want !== want) return; if (ok2) { el.style.backgroundImage = `url(${base})`; el.classList.add("has-img"); el.textContent = ""; } else { el.style.backgroundImage = ""; el.classList.remove("has-img"); el.textContent = e; } });
  });
  el.dataset.want = want;
}
function zoneBanner(z) { const h = $("zone-title")?.closest(".chat-head"); if (!h) return; const src = `img/zone/${z}.webp?v=${APP_VERSION}`; h.classList.remove("has-banner"); /* ?v= กันเบราว์เซอร์ใช้ภาพเก่าที่แคชไว้ (ไฟล์เคยถูกสลับชื่อ) */ h.style.removeProperty("--banner"); imgProbe(src, (ok) => { if (ok && $("screen-game")?.dataset.zone === z) { h.style.setProperty("--banner", `url(${src})`); h.classList.add("has-banner"); } }); }
function npcFace(e) { const f = $("npc-face"); if (!f) return; if (!f.classList.contains("has-img")) f.textContent = e; npcPortrait(f, npcRun.id, e); if (f.dataset.want && IMG_OK[f.dataset.want] === false && !f.classList.contains("has-img")) f.textContent = e; }
function npcScroll() { const l = $("npc-log"); if (l) l.scrollTop = l.scrollHeight; }
function npcSetCtl(...els) { const c = $("npc-ctl"); c.textContent = ""; els.forEach((e) => e && c.append(e)); }
const npcFlagBit = (flags, n) => { const i = (npcRun.flagNames || []).indexOf(n); return i >= 0 && !!(flags & (1 << i)); };
// แปลงบรรทัดบท → ส่วนที่จะแสดง [{t,e,nar}] (กรองตามฝ่าย/แฟลก, แยกบรรยาย "*...*" ออกจากคำพูด)
function npcParts(l, flags, zom) {
  const o = typeof l === "string" ? { t: l } : l || {}; if (!o.t) return [];
  if (o.f && o.f !== (zom ? "zombie" : "human")) return [];
  if (o.if && !npcFlagBit(flags, o.if)) return []; if (o.not && npcFlagBit(flags, o.not)) return [];
  let t = String(o.t).replace(/\{name\}/g, npcName()), e = o.e || null;
  const m = /^(\S{1,8})\|/u.exec(t); if (m) { e = m[1]; t = t.slice(m[0].length); }
  t = t.trim(); if (!t) return [];
  if (!t.startsWith("*")) return [{ t, e, nar: false }];
  const mm = /^\*([^*]+)\*\s*([\s\S]*)$/.exec(t), out = [];
  if (mm) { out.push({ t: mm[1].trim(), e, nar: true }); if (mm[2].trim()) out.push({ t: mm[2].trim(), e: null, nar: false }); }
  else { const x = t.replace(/^\*+|\*+$/g, "").trim(); if (x) out.push({ t: x, e, nar: true }); }
  return out;
}
async function npcSay(raw, flags, tok, id) {
  for (const o of npcParts(raw, flags, state.profile?.faction === "zombie")) if (!(await npcSayPart(o, tok, id))) return false;
  return true;
}
async function npcSayPart(o, tok, id) {
  if (npcRun.tok !== tok) return false;
  const log = $("npc-log"), b = mk("div", "npc-b " + (o.nar ? "nar" : "npc"));
  if (o.e) npcFace(o.e);
  if (!o.nar) b.append(mk("small", "npc-who", NPC_META[id].name)); const tx = mk("span", "npc-tx"); b.append(tx); log.append(b); npcRun.lines++;
  npcRun.mode = "typing";
  await new Promise((res) => {
    let i = 0; const t = o.t; npcRun.skip = () => { i = t.length; tx.textContent = t; npcScroll(); res(); };
    const tick = () => { if (npcRun.tok !== tok || npcRun.mode !== "typing") return res(); i = Math.min(t.length, i + 1 + (t[i] === " " ? 1 : 0)); tx.textContent = t.slice(0, i); npcScroll(); if (i >= t.length) return res(); setTimeout(tick, 1000 / NPC_CPS); };
    tick();
  });
  if (npcRun.tok !== tok) return false;
  tx.textContent = o.t; npcScroll();
  npcSetCtl(btn("▶ ต่อ", () => npcTap(), "btn primary npc-next"));
  npcRun.mode = "wait";
  await new Promise((res) => { npcRun.adv = res; });
  npcRun.mode = ""; if (npcRun.tok !== tok) return false;
  return true;
}
async function npcAsk(choices, flags, tok) {
  let list = choices.filter((c) => (!c.if || npcFlagBit(flags, c.if)) && (!c.not || !npcFlagBit(flags, c.not)));
  if (!list.length) list = choices.slice(0, 1);
  return new Promise((res) => {
    npcRun.mode = "ask";
    const wrap = mk("div", "npc-choices");
    list.forEach((c) => wrap.append(btn(c.t, () => {
      if (npcRun.tok !== tok) return; npcRun.mode = "";
      const b = mk("div", "npc-b me"); b.append(mk("span", "npc-tx", c.t)); $("npc-log").append(b); npcScroll(); npcRun.lines++;
      npcSetCtl(); res(c);
    }, "btn ghost npc-choice")));
    npcSetCtl(wrap); npcScroll();
  });
}
// เล่นหนึ่งฉาก → { m, gained } หรือ null ถ้าถูกปิดกลางคัน
async function npcPlay(id, scene, flags0, tok) {
  let flags = flags0, gained = 0, nid = scene.start, guard = 0; npcRun.inScene = true; npcRun.lines = 0;
  while (nid && guard++ < 300) {
    const n = scene.nodes[nid]; if (!n) break;
    const setF = (arr) => (arr || []).forEach((f) => { const i = (npcRun.flagNames || []).indexOf(f); if (i >= 0) flags |= 1 << i; });
    setF(n.set);
    for (const l of n.say || []) if (!(await npcSay(l, flags, tok, id))) { npcRun.inScene = false; return null; }
    if (n.ask) { const c = await npcAsk(n.ask, flags, tok); if (npcRun.tok !== tok) { npcRun.inScene = false; return null; } gained += Math.max(0, Math.min(3, c.p || 0)); setF(c.set); nid = c.next; }
    else if (n.next) nid = n.next; else nid = null;
  }
  npcRun.inScene = false; return { m: flags, gained };
}
async function npcSave(id, kind, scene, idx, res) {
  const rec = npcRec(id), today = npcToday(), first = rec.d !== today, hBefore = npcHeartsOf(rec.p);
  let gain = first ? Math.min(NPC_DAILY_CAP, res.gained) : 0;
  if (kind === "intro" || kind === "chapter") gain += Math.max(0, Math.min(4, scene.bonus ?? 4));
  const nr = { p: Math.min(100, rec.p + gain), d: today, s: rec.s, m: (res.m | (kind === "intro" ? NPC_INTRO_BIT : 0)) >>> 0, v: rec.v };
  if (kind === "chapter") nr.s = Math.min(5, rec.s + 1);
  if (kind === "daily" && idx >= 0) nr.v = (rec.v | (1 << idx)) >>> 0;
  try {
    await set(ref(db, `npc/${state.uid}/${id}`), nr);
  } catch (e) { console.error("npcSave", e?.code || e); toast("บันทึกความสัมพันธ์ไม่สำเร็จ — ลองใหม่อีกครั้ง"); return null; }
  state.npc = { ...(state.npc || {}), [id]: nr };
  stat("npc");
  if (first) questBump("npc_" + id);
  renderNpcBox(); npcHeader(id);
  return { gain, hUp: npcHeartsOf(nr.p) > hBefore, hearts: npcHeartsOf(nr.p), first };
}
function npcSummary(id, r) {
  const wrap = mk("div", "npc-sum");
  if (r.gain > 0) wrap.append(mk("div", "npc-gain", `💗 ความสนิทเพิ่มขึ้น +${r.gain}`));
  else wrap.append(mk("div", "npc-gain muted", "วันนี้คุยแล้ว — พรุ่งนี้ค่อยมาใหม่ได้ความสนิทเพิ่ม"));
  if (r.hUp) wrap.append(mk("div", "npc-up", `✨ หัวใจเพิ่มเป็น ${npcHeartStr(r.hearts)}`));
  if (r.first && state.qDefs?.daily && Object.keys(state.qDefs.daily).some((k) => k.startsWith(id + "_h"))) wrap.append(mk("div", "npc-gift", "🎁 ของขวัญวันนี้รอรับที่ปุ่ม “ภารกิจ”"));
  return wrap;
}
async function npcMenu(id, greetFirst) {
  const tok = npcRun.tok, data = await npcLoad(id); if (!data || npcRun.tok !== tok) return;
  npcRun.flagNames = data.flags || []; npcRun.id = id; npcFace(NPC_META[id].icon); npcHeader(id);
  const rec = npcRec(id), zom = state.profile?.faction === "zombie";
  if (!(rec.m & NPC_INTRO_BIT)) {   // ครั้งแรก: ฉากแนะนำตัว
    const res = await npcPlay(id, data.intro, rec.m, tok); if (!res) return;
    const sv = await npcSave(id, "intro", data.intro, -1, res); npcFace(NPC_META[id].icon);
    if (npcRun.tok !== tok) return;
    npcSetCtl(sv ? npcSummary(id, sv) : null, btn("ต่อ", () => npcMenu(id, false), "btn primary")); return;
  }
  if (greetFirst) { const g = npcGreeting(data, id); if (g && !(await npcSay(g, rec.m, tok, id))) return; npcFace(NPC_META[id].icon); }
  if (npcRun.tok !== tok) return;
  const today = npcRec(id).d === npcToday(), opts = mk("div", "npc-menu");
  opts.append(btn(today ? "💬 คุยเล่นต่อ" : "💬 คุยกัน", () => npcDaily(id), "btn primary npc-opt"));
  if (npcChapterReady(id)) opts.append(btn(`📖 เรื่องราวของ${NPC_META[id].name} · ตอนที่ ${rec.s + 1} ✨`, () => npcChapter(id), "btn npc-opt npc-new"));
  else if (rec.s < 5 && data.chapters?.[rec.s]) opts.append(mk("div", "npc-lock", `🔒 เรื่องราวตอนที่ ${rec.s + 1} — ต้องมีหัวใจ ${rec.s + 1} ดวง`));
  if (id === HC_ID) opts.append(btn(`🧬 ส่งชิ้นส่วน DNA (${hcTotal()}/${hcGoal()})`, () => hcDnaOpen(id), "btn npc-opt"));
  opts.append(btn("👋 ลาก่อน", async () => { const tk = npcRun.tok; const b = npcPick(data.bye); npcSetCtl(); if (b && (await npcSay(b, npcRec(id).m, tk, id))) npcClose(true); }, "btn ghost npc-opt"));
  const tip = mk("small", "muted npc-tip", today ? "วันนี้คุยแล้ว ✓" : "คุยครั้งแรกของวันได้ความสนิท + ของขวัญ");
  npcSetCtl(tip, opts);
}
async function npcDaily(id) {
  const tok = npcRun.tok, data = await npcLoad(id); if (!data) return;
  const rec = npcRec(id);
  if (rec.d === npcToday()) {   // คุยแล้ววันนี้ → แค่คุยเล่นสั้นๆ ไม่เปลืองบท
    npcSetCtl(); const l = npcPick(data.repeat); if (l && !(await npcSay(l, rec.m, tok, id))) return; npcFace(NPC_META[id].icon); return npcMenu(id, false);
  }
  const pk = npcPickTopic(data, id);
  if (!pk) { npcSetCtl(); const l = npcPick(data.repeat); if (l && !(await npcSay(l, rec.m, tok, id))) return; return npcMenu(id, false); }
  npcSetCtl();
  const res = await npcPlay(id, pk.scene, rec.m, tok); if (!res) return;
  if (pk.reset) { /* บทหมดแล้ว: เริ่มวนใหม่ */ }
  const r0 = npcRec(id); if (pk.reset) state.npc = { ...(state.npc || {}), [id]: { ...r0, v: 0 } };
  const sv = await npcSave(id, "daily", pk.scene, pk.idx, res); npcFace(NPC_META[id].icon);
  if (npcRun.tok !== tok) return;
  npcSetCtl(sv ? npcSummary(id, sv) : null, btn("ต่อ", () => npcMenu(id, false), "btn primary"));
}
async function npcChapter(id) {
  const tok = npcRun.tok, data = await npcLoad(id); if (!data) return;
  const rec = npcRec(id), sc = data.chapters?.[rec.s]; if (!sc || !npcChapterReady(id)) return npcMenu(id, false);
  npcSetCtl();
  const res = await npcPlay(id, sc, rec.m, tok); if (!res) return;
  const sv = await npcSave(id, "chapter", sc, -1, res); npcFace(NPC_META[id].icon);
  if (npcRun.tok !== tok) return;
  npcSetCtl(sv ? npcSummary(id, sv) : null, btn("ต่อ", () => npcMenu(id, false), "btn primary"));
}
function npcOpen(id) {
  if (!NPC_META[id] || !state.profile || state.profile.hp <= 0) return;
  if (state.zone !== "safe") return toast("NPC อยู่ที่ Safe Zone");
  if (state.boss) return toast("กำลังสู้อยู่ ไปคุยทีหลัง");
  const m = npcEnsureModal(); $("npc-log").textContent = ""; npcSetCtl(); npcRun.tok++; npcRun.mode = ""; npcRun.inScene = false; npcRun.lines = 0;
  m.classList.remove("hidden"); npcFace(NPC_META[id].icon); npcHeader(id); npcMenu(id, true);
}

/* ---- การ์ดคนในค่าย (ใต้รายการโซน, เฉพาะอยู่ Safe Zone) ---- */
function renderNpcBox() {
  const box = $("npc-box"); if (!box) return;
  const show = state.zone === "safe" && !!state.profile && state.profile.hp > 0;
  const ids = hcFound() ? [...NPC_IDS, HC_ID] : NPC_IDS;
  if (show) hcListen();
  const sig = show ? [state.uid, npcToday(), hcTotal(), ...ids.map((id) => { const r = npcRec(id); return `${r.p}:${r.d}:${r.s}:${r.m & NPC_INTRO_BIT}`; })].join("|") : "";
  box.classList.toggle("hidden", !show);
  if (!show || box.dataset.sig === sig) return;
  box.dataset.sig = sig; box.textContent = "";
  box.append(mk("h2", "", "👥 คนในค่าย"));
  ids.forEach((id) => {
    const m = NPC_META[id], r = npcRec(id), met = !!(r.m & NPC_INTRO_BIT), h = npcHeartsOf(r.p), today = r.d === npcToday();
    const card = mk("button", "npc-card"); card.type = "button"; card.dataset.npc = id;
    const st = !met ? "ยังไม่เคยคุย — แวะไปทักทาย" : id === HC_ID && hcTotal() < hcGoal() && !today ? `🧬 ชิ้นส่วน DNA ${hcTotal()}/${hcGoal()} • วันนี้ยังไม่ได้คุย` : npcChapterReady(id) ? "✨ มีเรื่องเล่าตอนใหม่" : today ? "วันนี้คุยแล้ว ✓" : "🎁 วันนี้ยังไม่ได้คุย";
    const tx = mk("div", "npc-ct"); tx.append(mk("b", "", `${m.name} `), mk("small", "muted", m.title), mk("div", "npc-hearts", met ? npcHeartStr(h) : "🤍🤍🤍🤍🤍"), mk("small", "npc-st", st));
    card.append(mk("div", "npc-ic", m.icon), tx, mk("span", "npc-go", "💬"));
    card.addEventListener("click", () => npcOpen(id)); box.append(card);
  });
}
function initNpcUi() {
  if (!$("npc-box")) { const ul = $("zone-list"); if (ul) { const b = mk("div", "npc-box hidden"); b.id = "npc-box"; ul.after(b); } }
}
/* =========================================================
   51) 📡 ภารกิจ HC — ตามหานักวิจัยที่ศูนย์วิจัยร้าง (ธารา) + ส่งชิ้นส่วน DNA
   - เปิด/ปิดด้วย tune hc_on (ปิดเป็นค่าเริ่มต้น) • ประกาศเนื้อเรื่องผ่านระบบประกาศของแอดมินตามเดิม
   - สถานะรายคนอยู่ที่ npc/{uid}/tara.m: บิต 21 = ล้มผู้เฝ้าแล้ว, บิต 22 = เจอธาราแล้ว (บิต 0-15 = แฟลกบทพูด, 20 = แนะนำตัวแล้ว)
   - ส่งชิ้นส่วน DNA: coop/hc1/{uid} = {n,name,ts} (นับรวมทั้งเซิร์ฟเวอร์) + หักของในกระเป๋าใน update เดียวกัน (ไม่ต้องใช้ rules ใหม่นอกจาก v43 ที่เพิ่มไอเทม/NPC id)
   ========================================================= */
const HC_ID = "tara", HC_BOSS_BIT = 1 << 21, HC_FOUND_BIT = 1 << 22, HC_KEY = "hc1";
const hcOn = () => T("hc_on", 0) === 1;
const hcM = () => state.npc?.[HC_ID]?.m || 0;
const hcBossDone = () => !!(hcM() & HC_BOSS_BIT);
const hcFound = () => !!(hcM() & HC_FOUND_BIT) || !!state.hcG?.found;   // ธราถูกค้นพบแล้ว (ทั้งเซิร์ฟเวอร์ — ใครเจอก่อนก็ถือว่าทุกคนเจอ)
const hcReady = () => !!state.npcReady;
const hcGoal = () => Math.max(1, Math.round(T("hc_goal", 300)));
const hcSearching = (z) => z === "lab" && hcOn() && hcReady() && !hcFound();
function hcAdd(z, t) { return z === "lab" && hcOn() && !(state.hc && hcTotal() >= hcGoal()) ? [...t, { id: "dna_frag", w: Math.max(0, T("hc_drop", 8)) }] : t; }
function hcBits(u, bits) { const r = npcRec(HC_ID); u[`npc/${state.uid}/${HC_ID}`] = { p: r.p, d: r.d, s: r.s, m: (r.m | bits) >>> 0, v: r.v }; }
const HC_HINTS = {
  4: "🔇 ได้ยินเสียงเคาะท่อเป็นจังหวะ… สามครั้ง หยุด สามครั้ง หยุด",
  9: "📻 วิทยุในกระเป๋าจับสัญญาณได้เสี้ยววินาที: “…ใครก็ได้… ชั้นล่างสุด… ห้อง…” แล้วก็เงียบ",
  15: "🚪 ประตูนิรภัยบานหนึ่งมีรอยขีดข่วนจากด้านใน และคราบเลือดที่แห้งกรังแล้ว… ใกล้แล้ว"
};
// ทอยหาเธอหนึ่งครั้งต่อการค้นที่ศูนย์วิจัย: ยิ่งไม่เจอยิ่งง่ายขึ้น (ตัวนับอยู่ในเครื่อง)
// ทอยค้นเจอธาราฝั่งเซิร์ฟเวอร์ (hcAct roll): ใครเจอก่อนเป็นผู้ค้นพบของทั้งเซิร์ฟเวอร์ — ตัวนับในเครื่องใช้แค่เล่นเบาะแสเนื้อเรื่อง ไม่มีผลต่อโอกาส
async function hcRoll() {
  const k = lsKey("hct"), n = LS.get(k, 0);
  try {
    const r = await hcCall({ a: "roll" }); if (r.found) state.hcG = r.found;
    if (r.hit) { state.hcReward = r; LS.set(k, 0); return true; }
    if (!r.skip && !r.limited && !r.already) { LS.set(k, n + 1); if (HC_HINTS[n + 1]) setTimeout(() => logLine(HC_HINTS[n + 1], "system"), 500); }
  } catch (e) { console.warn("hcRoll", e?.code || e); }
  return false;
}
// สถานะค้นพบรวม (hc/state): ทุกคนเห็นธาราที่ค่ายพร้อมกัน — ตั้งบิต "เจอแล้ว" ของตัวเองให้ครั้งเดียว
function hcGlobalListen() {
  if (state.hcGon || !state.uid) return; state.hcGon = true; hcListen();
  onValue(ref(db, "hc/state"), (s) => {
    state.hcG = s.val(); const f = state.hcG;
    try { renderNpcBox(); hcRender(); } catch { /* ข้าม */ }
    if (f && f.found && state.npcReady && !(hcM() & HC_FOUND_BIT) && !state.hcSyncing) {
      state.hcSyncing = true; const u = {}; hcBits(u, HC_FOUND_BIT);
      update(ref(db), u).catch(() => { /* ข้าม */ }).finally(() => { state.hcSyncing = false; });
    }
  }, (e) => console.warn("hcG", e?.code || e));
}
async function hcRescue(u, zom) {
  hcBits(u, HC_FOUND_BIT); await update(ref(db), u);
  LS.set(lsKey("hct"), 0); stat("found");
  const L = zom ? [
    "🧟 กลิ่นที่ไม่ใช่เหยื่อ… กลิ่นสารเคมีและกระดาษเก่า ลอยมาจากห้องสุดทางเดิน",
    "🧑‍🔬 ผู้หญิงในเสื้อกาวน์ขาดวิ่นนั่งอยู่หลังตู้เหล็ก เธอไม่กรีดร้อง ไม่หนี แค่มองคอเสื้อของคุณ แล้วพึมพำว่า “…หมายเลข HC… ยังจำที่นี่ได้สินะ”",
    "🏕️ เธอเก็บสมุดโน้ตแล้วเดินตามคุณกลับไปที่ค่าย — ไปคุยกับเธอได้ที่ Safe Zone การ์ด “คนในค่าย”"
  ] : [
    "🔦 ลึกเข้าไปหลังประตูนิรภัยที่ผู้เฝ้าเคยยืนขวาง มีห้องเล็กๆ ล็อกจากด้านใน เสียงเคาะท่อหยุดลงทันทีที่คุณเข้าใกล้",
    "🧑‍🔬 ผู้หญิงในเสื้อกาวน์ขาดวิ่นยกมือขึ้นช้าๆ “…ฉันยังเป็นคนอยู่ อย่าเพิ่งยิง” เธอพูดเสียงแหบแห้งจนแทบไม่ได้ยิน",
    "🏕️ คุณพาเธอออกมาจากศูนย์วิจัยได้สำเร็จ เธอตามกลับไปที่ค่าย — ไปคุยกับเธอได้ที่ Safe Zone การ์ด “คนในค่าย”"
  ];
  L.forEach((t, i) => setTimeout(() => logLine(t, i === 2 ? "system" : "combat"), i * 700));
  toast("🧑‍🔬 พบนักวิจัยแล้ว! เธอกลับไปรอที่ค่าย"); try { sfx("boss"); } catch { /* ข้าม */ }
  const rw = state.hcReward; if (rw) { setTimeout(() => logLine(`🎁 ในฐานะผู้ค้นพบ คุณได้รับ ${rw.weapon || (rw.reward === "organ" ? "🩸 เขี้ยวมังกรซาก" : "ของรางวัล")} — ${rw.weapon ? "แรงกว่าปืนแต่ทนแค่ 7 ครั้งและซ่อมไม่ได้" : "ต่อมกลายพันธุ์ระดับสูง"}`, "system"), 2200); state.hcReward = null; }
  setTimeout(() => { try { renderNpcBox(); hcRender(); } catch { /* ข้าม */ } }, 400);
}
// แบนเนอร์ที่ศูนย์วิจัย + ข้อความสัญญาณครั้งแรก
function hcRender(zArg) {
  const z = zArg || state.zone; let box = $("hc-box");
  if (!box) { const ref0 = $("zone-event"); if (!ref0) return; box = mk("p", "event-line hidden"); box.id = "hc-box"; ref0.after(box); }
  const on = hcOn() && hcReady() && !!state.profile && state.profile.hp > 0;
  if (on && !hcFound() && !LS.get(lsKey("hcsig"), 0)) { LS.set(lsKey("hcsig"), 1); logLine("📡 วิทยุจับสัญญาณขอความช่วยเหลือแบบเข้ารหัสได้ — ต้นทางมาจากศูนย์วิจัยร้าง", "system"); }
  let tx = "";
  if (on && z === "lab") {
    const zom = state.profile.faction === "zombie";
    if (!hcFound()) tx = zom ? "📡 สัญญาณขอความช่วยเหลือ… กลิ่นเก่าๆ ของที่นี่ยังจำคุณได้ ค้นหาต่อเพื่อตามหาต้นสัญญาณ" : hcBossDone() ? "📡 ผู้เฝ้าล้มแล้ว — ค้นหาต่อจนกว่าจะเจอต้นสัญญาณ (ยิ่งค้นนานยิ่งใกล้)" : "📡 สัญญาณขอความช่วยเหลือดังมาจากชั้นล่าง — ผู้เฝ้ายังขวางทางอยู่ ค้นหาจนกว่ามันจะโผล่ แล้วล้มมันให้ได้";
    else tx = `🧬 ชิ้นส่วน DNA ดรอปที่นี่ (หายาก) — ส่งธาราที่ค่าย ${hcTotal()}/${hcGoal()}`;
  }
  box.classList.toggle("hidden", !tx); box.textContent = tx;
}
// ยอดส่งรวมทั้งเซิร์ฟเวอร์
function hcListen() {
  if (state.hcOn || !state.uid) return; state.hcOn = true; state.hc = { sums: {}, last: 0, mine: undefined };
  onValue(ref(db, "coop/" + HC_KEY), (s) => { state.hc.sums = s.val() || {}; try { renderNpcBox(); hcRender(); if (state.hc.refresh) state.hc.refresh(); } catch { /* ข้าม */ } }, (e) => console.warn("hc", e?.code || e));
}
const hcTotal = () => Object.values(state.hc?.sums || {}).reduce((t, x) => t + (x?.n || 0), 0);
const hcMine = () => Math.max(state.hc?.mine ?? 0, state.hc?.sums?.[state.uid]?.n || 0);
async function hcDnaOpen(id) {
  const tok = npcRun.tok, data = await npcLoad(id); if (!data) return;
  hcListen(); const D = data.dna || {}; npcSetCtl();
  if (hcTotal() >= hcGoal()) { for (const l of D.after || []) if (!(await npcSay(l, npcRec(id).m, tok, id))) return; return hcDnaPanel(id, data); }
  const lines = state.hc.askShown ? (D.ask || []).slice(0, 1) : D.ask || []; state.hc.askShown = true;
  for (const l of lines) if (!(await npcSay(l, npcRec(id).m, tok, id))) return;
  hcDnaPanel(id, data);
}
function hcDnaPanel(id, data) {
  const have = state.inv?.dna_frag?.qty || 0, tot = hcTotal(), goal = hcGoal(), left = Math.max(0, goal - tot);
  const info = mk("small", "muted npc-tip", `🧬 ส่งแล้วรวม ${tot}/${goal}${left ? ` (ขาดอีก ${left})` : " — ครบแล้ว ✓"} • ของคุณ ${hcMine()} • ในกระเป๋า ${have}`);
  const row = mk("div", "npc-menu"), b1 = btn("🧬 ส่ง 1 ชิ้น", () => hcDonate(id, data, 1), "btn npc-opt"), b2 = btn(`🧬 ส่งทั้งหมด (${Math.min(have, left || have)})`, () => hcDonate(id, data, 99), "btn primary npc-opt");
  b1.disabled = b2.disabled = have < 1 || !left || state.zone !== "safe";
  row.append(b1, b2, btn("← กลับ", () => npcMenu(id, false), "btn ghost npc-opt"));
  npcSetCtl(info, row);
  state.hc.refresh = () => { if ($("npc-modal") && !$("npc-modal").classList.contains("hidden") && npcRun.id === id && !npcRun.mode && $("npc-ctl").contains(info)) hcDnaPanel(id, data); };
}
async function hcDonate(id, data, want) {
  const p = state.profile, it = state.inv?.dna_frag, H = state.hc; const tok = npcRun.tok;
  if (!p || !H || !it || !(it.qty > 0) || p.hp <= 0) return;
  if (!hcOn() && !hcFound()) return;
  if (state.zone !== "safe") return toast("ต้องอยู่ที่ Safe Zone");
  const left = hcGoal() - hcTotal(); if (left <= 0) return toast("ครบเป้าแล้ว");
  if (Date.now() - H.last < 6000) return toast("รอสักครู่แล้วส่งอีกครั้ง");
  const q = Math.max(1, Math.min(want, it.qty, left, 99)); if (state.busy) return; state.busy = true; H.last = Date.now();
  try {
    const r = await hcCall({ a: "donate", q }); H.mine = r.mine; if (r.found) state.hcG = r.found;
    const q2 = r.donated || q;
    toast(`🧬 ส่งชิ้นส่วน DNA ×${q2}`); logLine(`🧬 คุณส่งชิ้นส่วน DNA ×${q2} ให้ธารา`, "system"); try { sfx("boss"); achBump("camp", q2); } catch { /* ข้าม */ }
    if (npcRun.tok !== tok) return;
    const D = data.dna || {}, done = r.total >= r.goal; npcSetCtl();
    const say = async (arr) => { for (const l of arr) if (!(await npcSay(l, npcRec(id).m, tok, id))) return false; return true; };
    if (!(await say([npcPick(D.thanks)].filter(Boolean)))) return;
    if (done && !(await say(D.full || []))) return;
    hcDnaPanel(id, data);
  } catch (e) { H.mine = undefined; toast(fnErr(e)); }
  finally { state.busy = false; }
}

/* =========================================================
   26) วิทยุฉุกเฉิน
   • ข่าวด่วนอัตโนมัติ: ทุก 20 นาที (slot ตามเวลาเซิร์ฟเวอร์ → seed เดียวกันทุกเครื่อง) สร้างจากสถานะโลกจริง
     (บอส/กำแพง/อีเวนต์/จำนวนคน) + ข่าวทั่วไป + คำแนะนำเกม — ฝั่ง client ล้วน ไม่เขียนอะไรขึ้นเซิร์ฟเวอร์
   • สัมภาษณ์ผู้เล่นสุ่ม: ระบบสุ่ม "เชิญ" ผู้เล่นที่ออนไลน์ ตอบแบบเลือกข้อ (เหมือนคุยกับ NPC) แล้วเขียน radio/{uid} = {q,a,f,n,ts}
     ทุกคนฟัง radio แล้วแสดงเป็นข่าวสด (rules จำกัดคนละ 1 ครั้ง/30 นาที, ค่า q/a เป็นเลขดัชนี ไม่มีข้อความอิสระ)
   ========================================================= */
const RADIO_SLOT = 20 * 60000, RADIO_COOL = 30 * 60000, RADIO_GLOBAL_GAP = 6 * 60000, RADIO_KEEP = 10;
const rdHash = (...a) => { let h = 2166136261; for (const x of a) { const s = String(x); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } } return h >>> 0; };
const rdPick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const rdFill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const RD_AMBIENT = [
  "ย้ำอีกครั้ง ผู้รอดชีวิตทุกคนโปรดตรวจสอบเสบียงและน้ำดื่มของตัวเองก่อนออกจากเซฟโซน",
  "สัญญาณรบกวนรุนแรงช่วงนี้ หากได้ยินเสียงครวญครางใกล้ตัว อย่าหันกลับไปมอง",
  "รายงานจากจุดสังเกตการณ์: ฝูงอีกาบินวนเหนือตัวเมืองตั้งแต่เช้า ยังไม่ทราบสาเหตุ",
  "มีผู้พบรอยเท้าขนาดใหญ่ใกล้ริมถนนสายเก่า เจ้าหน้าที่แนะนำให้เลี่ยงเส้นทางดังกล่าว",
  "ฝนกรดเบา ๆ ตกทางฝั่งตะวันตกของเมือง ผู้ที่อยู่กลางแจ้งควรหาที่กำบัง",
  "ขอเตือนผู้ที่คิดจะเดินทางไกล: ยิ่งไกลยิ่งกินแรง ประเมินพลังงานก่อนออกเดินทางเสมอ",
  "เราได้รับสัญญาณขอความช่วยเหลือจากที่ไหนสักแห่งแต่ตอบกลับไปไม่ได้ ถ้าคุณได้ยินเรา โปรดอยู่ที่เดิม",
  "ทีมสำรวจรายงานกลิ่นไหม้ลอยมาจากทางโรงงาน ไม่ทราบว่ามีใครอยู่ที่นั่นหรือไม่",
  "คืนนี้อากาศหนาวกว่าปกติ ผู้รอดชีวิตควรรักษาความอบอุ่นและอย่าอยู่ในที่โล่งนาน",
  "สถานีขอบคุณทุกคนที่ยังเปิดรับฟัง ตราบใดที่ยังมีคนฟัง เราจะออกอากาศต่อไป",
  "ขอย้ำ: ซอมบี้ไม่ใช่ศัตรูเพียงอย่างเดียว ความหิวและความประมาทฆ่าผู้รอดชีวิตมามากกว่า",
  "เสียงปืนดังขึ้นเป็นระยะจากทางทิศเหนือ ไม่ทราบฝ่าย อย่าเข้าใกล้"
];
const RD_TIPS = [
  "คำแนะนำจากทีมแพทย์สนาม: พิษแรงรักษาได้ด้วยยาแก้พิษหรือชุดช่วยชีวิตขั้นสูงเท่านั้น ผ้าพันแผลและมอสช่วยไม่ได้",
  "ผู้ที่ดื่มยาแก้พิษจะมีภูมิคุ้มกันพิษชั่วคราวราว 10 นาที ใช้ช่วงนั้นลุยพื้นที่เสี่ยงได้",
  "อาวุธใกล้พังอย่าฝืน สลับอาวุธสำรองก่อนเข้าสู้กับบอสโลก",
  "ผู้ที่ตีบอสโลกได้ดาเมจสูงสุดมักได้รับชิ้นพิเศษ ส่วนคนอื่นก็ได้เกราะสุ่มจากคลัง อย่าลืมกดรับรางวัล",
  "ชาวค่ายแนะนำ: แวะคุยกับ {npc} ที่เซฟโซนบ้าง ทั้งสองมีเรื่องเล่าและของฝากให้ทุกวัน",
  "กำแพงเซฟโซนต้องมีคนดูแลอยู่เสมอ ใครมีเศษวัสดุเหลือ ช่วยกันซ่อมก็ได้"
];
const RD_BOSS = [
  "ด่วน! พบ「{boss}」ที่{zone} กำลังเคลื่อนไหวอยู่ ผู้ที่มีกำลังพอโปรดรวมตัวกันเข้าจัดการ",
  "ทีมสังเกตการณ์ที่{zone}ส่งภาพมาแล้ว「{boss}」ตัวใหญ่กว่าที่คาดไว้มาก ขอให้เตรียมเสบียงและอาวุธสำรอง",
  "ใครอยู่ใกล้{zone} โปรดระวังตัว「{boss}」ยังไม่ล้ม และมันไม่มีทีท่าจะหยุด"
];
const RD_BOSS_T = "รายงานล่าสุด:「{boss}」ยังอาละวาดที่{zone} คาดว่าจะอยู่ต่ออีกราว {min} นาที";
const RD_WALL = {
  broken: ["แจ้งเตือนสูงสุด! กำแพงเซฟโซนพังแล้ว ซอมบี้อาจบุกเข้ามาได้ทุกเมื่อ ใครอยู่ในค่ายโปรดช่วยกันซ่อมด่วน", "เซฟโซนไม่ปลอดภัยอีกต่อไป กำแพงแตกเป็นช่อง เร่งซ่อมก่อนมืด"],
  low: ["กำแพงเซฟโซนเหลือราว {pct}% และทรุดลงเรื่อย ๆ ขอแรงชาวค่ายช่วยซ่อม", "วิศวกรประเมินกำแพงเหลือ {pct}% หากไม่มีใครซ่อมเร็ว ๆ นี้ เราอาจเสียเซฟโซน"],
  mid: ["กำแพงเซฟโซนอยู่ที่ราว {pct}% ยังไหว แต่อย่าประมาท"],
  ok: ["กำแพงเซฟโซนยังแข็งแรง ราว {pct}% ขอบคุณทุกคนที่ช่วยกันดูแล"]
};
function radioBulletin(slot) {
  const rnd = bmRng(rdHash("rd", slot)), o = [], now = serverNow();
  o.push([4, rdPick(rnd, RD_AMBIENT)]);
  o.push([2, rdFill(rdPick(rnd, RD_TIPS), { npc: NPC_IDS.map((id) => NPC_META[id].name).join(" และ ") })]);
  try {
    if (!siegeLive(now)) { const sg = siegeNext(now); if (sg.start > now && sg.start - now < 6 * 3600000) o.push([3, `ตารางเฝ้าระวัง: คาดว่าฝูงซอมบี้จะบุกกำแพงเซฟโซนราว ${siegeClock(sg.start)} น. ผู้รอดชีวิตโปรดเตรียมเศษวัสดุและกลับเข้าค่าย`]); }
    const bz = Object.entries(state.wb || {}).find(([, b]) => wbAlive(b));
    if (bz) { const [z, b] = bz, min = b.endsAt ? Math.max(1, Math.ceil((b.endsAt - now) / 60000)) : 0, d = { boss: b.name, zone: ZONES[z]?.name || z, min }; o.push([6, rdFill(min && rnd() < 0.4 ? RD_BOSS_T : rdPick(rnd, RD_BOSS), d)]); }
    const h = wallHp();
    if (h !== null) { const pct = Math.round((h / WALL_MAX) * 100), k = h <= 0 ? "broken" : pct < 35 ? "low" : pct < 70 ? "mid" : "ok"; o.push([k === "broken" ? 8 : k === "low" ? 5 : 2, rdFill(rdPick(rnd, RD_WALL[k]), { pct })]); }
    const zc = Object.entries(state.zcount || {}).sort((a, c) => c[1] - a[1]), tot = zc.reduce((s, [, n]) => s + n, 0);
    if (tot <= 1) o.push([3, "สถานีตรวจพบสัญญาณชีวิตในเมืองน้อยมาก ถ้าคุณกำลังฟังอยู่ โปรดบอกให้เรารู้ว่าคุณยังอยู่"]);
    else if (zc[0]?.[1] >= 3) o.push([3, `ผู้รอดชีวิตรวมตัวกันที่${ZONES[zc[0][0]]?.name || zc[0][0]}ถึง ${zc[0][1]} คน ขอให้ระวังเสียงดังที่ดึงดูดฝูงซอมบี้`]);
    else if (zc[0]?.[1] >= 1) o.push([2, `จากการสำรวจ ขณะนี้มีผู้รอดชีวิตออนไลน์ราว ${tot} คน หนาแน่นที่สุดที่${ZONES[zc[0][0]]?.name || zc[0][0]}`]);
    { const w = wxNow(now); if (w.type !== "clear") o.push([4, `พยากรณ์อากาศ: ขณะนี้ ${WX[w.type].name} ${WX_TIP[w.type]} คาดว่าจะคงอยู่อีกราว ${Math.max(1, Math.ceil((w.end - now) / 60000))} นาที`]); }
    const ev = Object.entries(state.events || {}).find(([z]) => activeEvent(z));
    if (ev) o.push([5, `ประกาศเตือน: เกิดเหตุการณ์ผิดปกติที่${ZONES[ev[0]]?.name || ev[0]} — ${ev[1].title || "ไม่ทราบสาเหตุ"}`]);
  } catch { /* ข้อมูลโลกยังไม่พร้อม → ใช้ข่าวทั่วไป */ }
  let r = rnd() * o.reduce((s, x) => s + x[0], 0);
  for (const [w, t] of o) { if ((r -= w) < 0) return t; }
  return o[0][1];
}
const RD_TOPICS = [
  { q: "อะไรทำให้คุณยังไม่ยอมแพ้ในวันที่แย่ที่สุด?",
    h: ["ข้าวกระป๋องที่ซ่อนไว้กับความดื้อของตัวเอง", "เพื่อนร่วมค่ายที่ยังรอฉันอยู่", "ความโกรธ… ฉันยังมีเรื่องค้างกับพวกมัน", "ไม่รู้เหมือนกัน ขาแค่ก้าวต่อไปเอง"],
    z: ["ความหิว มันไม่เคยหยุดเลย", "เสียงบางอย่างในหัวที่บอกให้เดินต่อ", "ฉันยังจำชื่อตัวเองได้… แค่นั้นก็พอ", "ไม่ต้องมีเหตุผล พวกเราแค่เดิน"] },
  { q: "ถ้าขอสิ่งของจากฟ้าได้อย่างเดียว คุณจะขออะไร?",
    h: ["ยาแก้พิษสักลัง", "ปืนที่กระสุนไม่มีวันหมด", "ข้าวเหนียวหมูปิ้งร้อน ๆ", "เตียงนุ่ม ๆ กับคืนหลับยาว ๆ"],
    z: ["เนื้อสด ๆ… ขอเยอะ ๆ", "ความเงียบ ในหัวมันดังเกินไป", "ตัวตนเดิมของฉันกลับมา", "ไม่ขออะไร แค่อยากมีใครเดินเป็นเพื่อน"] },
  { q: "ที่ไหนในเมืองนี้ที่คุณกลัวที่สุด?",
    h: ["อุโมงค์ ไฟดับแล้วไม่รู้ว่าอะไรอยู่ข้างหน้า", "โรงพยาบาล เสียงเครื่องมือแพทย์ยังดังอยู่", "ห้างสรรพสินค้า ทุกมุมมีที่ซ่อน และที่ให้ถูกซุ่ม", "เซฟโซน เพราะที่นั่นฉันมีอะไรให้เสียมากที่สุด"],
    z: ["ไม่มีที่ไหนน่ากลัวสำหรับเรา มีแต่ที่ที่มีคนเยอะ", "ที่ที่แสงจ้า ๆ มันทำให้ฉันนึกถึงบางอย่าง", "ที่ไหนก็ตามที่มีเสียงปืน", "กำแพงเซฟโซน มันสูงเกินกว่าจะข้าม"] },
  { q: "เมื่อคืนคุณได้ยินอะไรไหม?",
    h: ["เสียงใครสักคนเรียกชื่อฉันจากข้างนอก ฉันไม่ได้ออกไป", "เสียงฝีเท้าเยอะมาก แต่ไม่มีใครส่งเสียงเลย", "เสียงเพลงจากวิทยุเก่า ๆ ที่ไหนสักแห่ง", "ไม่ได้ยินอะไรเลย นั่นแหละที่น่ากลัว"],
    z: ["เสียงหัวใจของคนที่หลับอยู่ มันดังมาก", "เสียงพวกเดียวกันเรียกจากอีกฟากเมือง", "เสียงตัวเองร้องไห้ แปลกดีนะ", "เสียงปืน… แล้วก็เงียบ"] },
  { q: "ถ้าวันนี้เป็นวันสุดท้าย คุณจะทำอะไร?",
    h: ["กินของอร่อยที่สุดที่หาได้ในเมือง", "ไปล้มบอสที่ไม่มีใครล้มได้", "นั่งดูพระอาทิตย์ตกกับเพื่อนสักคน", "ซ่อมกำแพงให้ดีที่สุด คนอื่นจะได้อยู่ต่อ"],
    z: ["ล่าให้เต็มที่ ไม่ต้องเก็บแรงไว้แล้ว", "ไปหาคนที่เคยรู้จัก… แล้วบอกอะไรบางอย่าง", "นอนหลับสักคืน ถ้ายังหลับเป็น", "เดินไปให้ไกลที่สุดจนกว่าขาจะพัง"] },
  { q: "ตอนนี้คุณไว้ใจใครมากที่สุด?",
    h: ["ตัวเอง ไว้ใจคนอื่นไม่ได้แล้ว", "คนที่แบ่งผ้าพันแผลให้ฉันโดยไม่ถามอะไร", "คนในค่ายที่ยังยิ้มให้ฉันทุกเช้า", "ยังไม่มี แต่ฉันกำลังพยายามจะมี"],
    z: ["ฝูงของเรา", "ไม่มี เราไม่ไว้ใจใครอีกแล้ว", "มนุษย์คนหนึ่งที่เคยปล่อยฉันไปทั้งที่ฉันหิว", "เสียงในหัวของฉันเอง… ซึ่งนั่นน่ากลัวมาก"] },
  { q: "เล่าเรื่องที่เกือบเอาชีวิตไม่รอดให้ฟังหน่อย",
    h: ["บอสโลกฟาดมาทีเดียว เลือดเหลือไม่ถึงสิบ", "กินของเน่าเข้าไปเพราะหิวจัด", "ติดพิษแรงแล้วไม่มียาแก้ ต้องวิ่งหาแทบตาย", "ตกใจเสียงอะไรไม่รู้ในอุโมงค์ จนลืมสู้"],
    z: ["เกือบถูกยิงหัวขาดตอนล่าอยู่ใกล้ฐานทัพ", "ถูกมนุษย์ล้อมไว้เจ็ดคน ถ้าไม่ใช่เพราะหมอกคงจบแล้ว", "ติดพิษแรง ทั้งที่เราควรเป็นฝ่ายกัดนะ", "ตัดสินใจผิดแล้วหนีไม่ทัน"] },
  { q: "มีคำแนะนำให้ผู้รอดชีวิตมือใหม่ไหม?",
    h: ["พกผ้าพันแผลเสมอ แม้คิดว่าไม่ถึงตาย", "อย่าเดินไกลตอนพลังงานเหลือน้อย", "คุยกับคนในเซฟโซนทุกวัน ได้ของฟรีด้วย", "ตีบอสเป็นทีม ไปคนเดียวรอดยาก"],
    z: ["อย่าล่าตอนหิวจัด สายตาจะพร่า", "ใจเย็น ๆ เหยื่อไม่หนีไปไหน", "อดทน วิวัฒนาการต้องใช้เวลา", "อย่าไว้ใจเสียงในหัว"] },
  { q: "เสบียงชิ้นสุดท้ายของคุณคืออะไร?",
    h: ["ข้าวกระป๋องที่เปิดไว้แล้วครึ่งกระป๋อง", "น้ำครึ่งขวดกับความหวัง", "ชุดปฐมพยาบาลที่ยังไม่ได้แกะ", "ช็อกโกแลตแท่งที่เก็บไว้ตั้งแต่วันแรก"],
    z: ["ไม่มี เรากินสิ่งที่หาได้", "เศษเนื้อที่ยังไม่เน่าชิ้นหนึ่ง", "ความทรงจำเก่า ๆ เรากินมันซ้ำทุกวัน", "ความอดทน… กินไม่อิ่ม แต่ก็ยังอยู่"] },
  { q: "ถ้าเจอซอมบี้ที่คุณจำหน้าได้ คุณจะทำอย่างไร?", qz: "ถ้าเจอมนุษย์ที่คุณจำหน้าได้ คุณจะทำอย่างไร?",
    h: ["ยกอาวุธขึ้น แต่มือสั่นมาก", "เรียกชื่อมัน เผื่อจะยังได้ยิน", "เดินหนีโดยไม่หันหลังกลับ", "ขอโทษ แล้วทำให้มันสงบเสียที"],
    z: ["เดินเข้าไปหาโดยไม่รู้ตัวด้วยซ้ำ", "หยุด… แล้วถอยออกมาช้า ๆ", "ตามไปดูห่าง ๆ ว่าเขาจะปลอดภัยไหม", "กัดมัน แล้วเสียใจทีหลัง"] },
  { q: "คุณคิดว่าคนที่เหลืออยู่ในเมืองนี้เป็นคนแบบไหน?",
    h: ["ดื้อ ขี้หึง แต่ไม่ยอมตายง่าย ๆ", "เหนื่อย แต่ยังแบ่งปันกันได้", "ทั้งดีและเลวปนกัน แล้วแต่ว่าหิวแค่ไหน", "เป็นครอบครัวที่ไม่ได้เลือกกันเอง"],
    z: ["เหยื่อ… และบางคนก็เป็นเพื่อนเก่า", "แข็งแกร่งกว่าที่เราคิด", "ส่วนมากกลัว ส่วนน้อยกล้าจนน่าสงสัย", "พวกเขาเหมือนเราตอนที่ยังเป็นคน"] },
  { q: "ถ้าวิทยุเครื่องนี้ส่งถึงโลกภายนอกได้ คุณจะบอกอะไร?",
    h: ["เรายังอยู่ ส่งความช่วยเหลือมาที", "อย่าเข้ามาที่นี่ แต่อย่าลืมพวกเรา", "ขอบคุณคนที่ยังฟังเราอยู่", "บอกแม่ว่าฉันไม่เป็นไร"],
    z: ["พวกเรายังเดินอยู่ และจะเดินต่อไป", "ช่วยเรา… ได้ไหม", "อย่าเปิดประตู", "บอกแม่… ว่าขอโทษ"] },
  { q: "คุณคิดถึงอะไรจากชีวิตก่อนวิกฤตมากที่สุด?",
    h: ["กาแฟร้อน ๆ ตอนเช้า", "เสียงรถติดหน้าบ้าน", "การเดินไปไหนมาไหนโดยไม่ต้องมองข้างหลัง", "ข้อความขี้บ่นจากแม่"],
    z: ["รสข้าวเหนียวมะม่วง", "ความรู้สึกอิ่ม", "ชื่อของตัวเอง", "เสียงหัวเราะ"] }
];
const RD_INTRO = {
  human: [(n) => `🎙️ ผู้สื่อข่าวภาคสนามยื่นไมค์ให้ ${n}`, (n) => `🎙️ สถานีสัมภาษณ์สดจาก ${n}`, (n) => `🎙️ เสียงจากผู้รอดชีวิต: เรากำลังคุยกับ ${n}`, (n) => `🎙️ ช่วงสัมภาษณ์พิเศษกับ ${n}`],
  zombie: [(n) => `🎙️ (สัญญาณแทรกหนัก) ผู้สื่อข่าวเสี่ยงชีวิตเข้าไปสัมภาษณ์ ${n} ซึ่งดูเหมือนจะไม่ใช่คนอีกต่อไป`, (n) => `🎙️ เสียงขู่คำรามดังแทรก… เราขอสัมภาษณ์ ${n} จากระยะที่ปลอดภัยที่สุด`, (n) => `🎙️ ภาคสนามรายงาน: ${n} ยินดีให้สัมภาษณ์ แม้ท่าทางจะน่ากลัวไปหน่อย`]
};
const rdMyLast = () => state.radioRec?.[state.uid]?.ts || 0;
function radioPanel() {
  const box = $("radio-box"); if (!box) return;
  box.textContent = "";
  const items = (state.radioLog || []).slice(0, RADIO_KEEP);
  const sum = mk("summary", "", `📻 วิทยุฉุกเฉิน${items.length ? ` (${items.length})` : ""}`); sum.style.cssText = "cursor:pointer;font-weight:600";
  box.append(sum);
  const wrap = mk("div"); wrap.style.cssText = "display:grid;gap:6px;margin-top:6px";
  wrap.append(mk("div", "", siegeInfoLine()));
  items.forEach((it) => {
    const row = mk("div", "muted", `${new Date(it.ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} • ${it.text}`); row.style.cssText = "font-size:.88em;line-height:1.4"; wrap.append(row);
  });
  if (!items.length) wrap.append(mk("div", "muted", "ยังไม่มีข่าว — รอฟังสักครู่"));
  const left = RADIO_COOL - (serverNow() - rdMyLast());
  const b = btn(left > 0 ? `🎙️ ขึ้นวิทยุได้อีก ~${Math.ceil(left / 60000)} นาที` : "🎙️ ขอขึ้นวิทยุ (ตอบสัมภาษณ์)", () => radioAsk(), "btn ghost mini");
  b.disabled = left > 0; wrap.append(b); box.append(wrap);
}
function radioPush(text, ts, live) {
  state.radioLog = state.radioLog || [];
  state.radioLog.unshift({ text, ts }); state.radioLog.sort((a, c) => c.ts - a.ts); state.radioLog.length = Math.min(state.radioLog.length, RADIO_KEEP);
  if (live) logLine(text, "system");
  radioPanel();
}
function radioShowInterview(uid, r, live) {
  const t = RD_TOPICS[r.q]; if (!t || !Number.isInteger(r.a) || r.a < 0 || r.a > 3) return;
  const fac = r.f === "zombie" ? "zombie" : "human", n = String(r.n || "?").slice(0, 16), rnd = bmRng(rdHash(uid, r.ts));
  const intro = rdPick(rnd, RD_INTRO[fac])(n), q = fac === "zombie" && t.qz ? t.qz : t.q, a = t[fac === "zombie" ? "z" : "h"][r.a];
  if (live) { logLine(`${intro}: “${q}”`, "system"); logLine(`💬 ${n}: “${a}”`, "system"); }
  radioPush(`🎙️ ${n}: “${q}” → “${a}”`, r.ts || serverNow(), false);
}
function radioAsk() {
  const p = state.profile; if (!p || p.hp <= 0) return;
  if (serverNow() - rdMyLast() < RADIO_COOL) return toast("ขึ้นวิทยุได้ทุก 30 นาที");
  radioInviteClose();
  const fac = p.faction === "zombie" ? "zombie" : "human";
  let qi = rdHash(state.uid, Date.now()) % RD_TOPICS.length;
  const last = state.radioRec?.[state.uid]?.q, lastAll = state.radioLastQ;
  for (let k = 0; k < RD_TOPICS.length && (qi === last || qi === lastAll); k++) qi = (qi + 1) % RD_TOPICS.length;
  const t = RD_TOPICS[qi];
  const m = mk("div", "modal"); m.id = "radio-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  const bx = mk("div", "modal-box"); bx.style.cssText = "display:grid;gap:10px";
  bx.append(mk("h2", "", "📻 สถานีวิทยุขอสัมภาษณ์"), mk("p", "muted", "ตอบ 1 ข้อ คำตอบของคุณจะถูกประกาศให้ผู้รอดชีวิตทุกคนที่ออนไลน์ได้ยิน"), mk("p", "", `🎙️ “${fac === "zombie" && t.qz ? t.qz : t.q}”`));
  const close = () => m.remove();
  t[fac === "zombie" ? "z" : "h"].forEach((txt, ai) => {
    const b = btn(`“${txt}”`, async () => {
      bx.querySelectorAll("button").forEach((x) => { x.disabled = true; });
      try {
        await set(ref(db, "radio/" + state.uid), { q: qi, a: ai, f: fac, n: p.username, ts: serverTimestamp() });
        toast("ออกอากาศแล้ว 📻"); achBump("radio"); close();
      } catch (e) { toast(errMsg(e)); bx.querySelectorAll("button").forEach((x) => { x.disabled = false; }); }
    }, "btn ghost");
    b.style.cssText = "text-align:left;white-space:normal"; bx.append(b);
  });
  bx.append(btn("ไว้ก่อน", close, "btn ghost mini")); m.append(bx); document.body.append(m);
}
function radioInviteClose() { state.radioInvEl?.remove(); state.radioInvEl = null; clearTimeout(state.radioInvT); }
function radioInvite() {
  if (state.radioInvEl) return;
  state.radioInvAt = Date.now();
  const el = mk("div"); el.style.cssText = "position:fixed;left:12px;right:12px;bottom:76px;z-index:60;background:#1b2330;border:1px solid #e0a030;border-radius:12px;padding:10px 12px;display:grid;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.5)";
  el.append(mk("div", "", "📻 สถานีวิทยุฉุกเฉินขอสัมภาษณ์คุณ — ตอบแค่ข้อเดียว แล้วคำตอบจะถูกประกาศให้ทุกคนได้ยิน"));
  const row = mk("div", "row-btns"); row.append(btn("🎙️ ตอบรับ", () => radioAsk(), "btn primary mini"), btn("ไว้ก่อน", radioInviteClose, "btn ghost mini")); el.append(row);
  document.body.append(el); state.radioInvEl = el; state.radioInvT = setTimeout(radioInviteClose, 120000);
  try { sfx("boss"); } catch { /* */ }
}
function radioTick(n) {
  const p = state.profile; if (!p || !state.radioReady) return;
  const slot = Math.floor(serverNow() / RADIO_SLOT);
  if (state.radioSlot !== slot) { const first = state.radioSlot === undefined; state.radioSlot = slot; setTimeout(() => radioPush(`📻 [วิทยุฉุกเฉิน] ${radioBulletin(slot)}`, serverNow(), true), first ? 6000 : 0); }
  if (n % 4 || p.hp <= 0 || document.hidden || state.radioInvEl || $("radio-modal") || $("npc-modal") && !$("npc-modal").classList.contains("hidden")) return;
  const now = serverNow(), online = Math.max(1, Object.values(state.zcount || {}).reduce((s, x) => s + x, 0));
  if (now - rdMyLast() < RADIO_COOL || now - (state.radioLastGlobal || 0) < RADIO_GLOBAL_GAP || Date.now() - (state.radioInvAt || 0) < 20 * 60000) return;
  if (Math.random() < 0.12 / online) radioInvite();
}
function listenRadio() {
  if (state.radioStarted) return; state.radioStarted = true;
  if (!$("radio-box")) { const ul = $("zone-list"); if (ul) { const d = mk("details", "radio-box"); d.id = "radio-box"; d.style.cssText = "margin:10px 0 4px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05)"; ul.after(d); } }
  state.radioSeen = {};
  onValue(ref(db, "radio"), (s) => {
    const all = s.val() || {}; state.radioRec = all;
    Object.entries(all).sort((a, c) => (a[1].ts || 0) - (c[1].ts || 0)).forEach(([uid, r]) => {
      if (!r || typeof r.ts !== "number") return;
      const key = uid + ":" + r.ts; if (state.radioSeen[key]) return; state.radioSeen[key] = 1;
      state.radioLastGlobal = Math.max(state.radioLastGlobal || 0, r.ts); state.radioLastQ = r.q;
      radioShowInterview(uid, r, state.radioReady && r.ts >= state.sessionStart);
    });
    state.radioReady = true; radioPanel();
  }, (e) => console.error("radio", e));
  let n = 0; setInterval(() => radioTick(++n), 15000);
  setInterval(() => { try { siegeAnnounce(); siegeBar(); } catch (e) { console.warn("siege", e); } }, 10000);
}

/* =========================================================
   27) คืนปิดล้อม (ทุกวัน 30 นาที ช่วงหัวค่ำ — เวลาเริ่มสุ่มจากวัน ทุกเครื่องตรงกัน)
   ฝั่ง client ล้วน ไม่แตะ rules: ซอมบี้ทุบกำแพง / มนุษย์ซ่อมกำแพงที่เซฟโซน (ระบบกำแพงเดิม) ระหว่างช่วงนี้นับเป็นเควส
   ev "siege" (ต่อครั้ง) และ "siegen" (วันละครั้ง) • วิทยุประกาศเตือน/เริ่ม/กลางคืน/สรุป • แถบนับถอยหลังเหนือแชท
   ========================================================= */
const SIEGE_DUR = 30 * 60000, SIEGE_PRE = 10 * 60000, SIEGE_TZ = 7 * 3600000, SIEGE_DAY = 86400000;
function siegeSched(day) {
  const rnd = bmRng(rdHash("siege", day)), startMin = 19 * 60 + Math.floor(rnd() * 10) * 15;   // 19:00 – 21:15 (เวลาไทย)
  const start = day * SIEGE_DAY - SIEGE_TZ + startMin * 60000; return { day, start, end: start + SIEGE_DUR };
}
const siegeNext = (ms = serverNow()) => { const s = siegeSched(Math.floor((ms + SIEGE_TZ) / SIEGE_DAY)); return ms < s.end ? s : siegeSched(s.day + 1); };
const siegeLive = (ms = serverNow()) => { const s = siegeSched(Math.floor((ms + SIEGE_TZ) / SIEGE_DAY)); return ms >= s.start && ms < s.end ? s : null; };
const siegeClock = (ms) => { const d = new Date(ms + SIEGE_TZ); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };
// เรียกหลังทุบ/ซ่อมกำแพงสำเร็จ
function siegeHit() {
  const s = siegeLive(); if (!s) return;
  questBump("siege");
  if (state.siegeDay !== s.day) { state.siegeDay = s.day; questBump("siegen"); toast("🚨 คุณร่วมคืนปิดล้อมแล้ว!"); }
}
const SG_PRE = ["ด่วน! ตรวจพบฝูงซอมบี้ขนาดใหญ่กำลังรวมตัวนอกกำแพงเซฟโซน คาดว่าจะบุกในอีกประมาณ {min} นาที ผู้รอดชีวิตเตรียมเศษวัสดุให้พร้อม", "สัญญาณเตือนภัย: ฝูงผีกำลังเคลื่อนเข้ามาทางกำแพงเซฟโซน อีกราว {min} นาทีจะถึง ใครอยู่ในค่ายโปรดเตรียมซ่อมกำแพง"];
const SG_START = ["🚨 การปิดล้อมเริ่มแล้ว! ฝูงซอมบี้รุมทุบกำแพงเซฟโซน — ใครอยู่ในค่ายช่วยกันซ่อมด่วน!", "🚨 กำแพงถูกโจมตีหนักแล้ว! ผู้รอดชีวิตทุกคนที่อยู่ใกล้เซฟโซน ใช้เศษวัสดุซ่อมกำแพงเดี๋ยวนี้!"];
const SG_MID = ["🚨 ครึ่งทางของคืนปิดล้อม กำแพงเซฟโซนเหลือราว {pct}% — สู้ต่อไป!", "🚨 รายงานกลางเหตุการณ์: กำแพงเซฟโซนอยู่ที่ราว {pct}% ฝูงซอมบี้ยังไม่ถอย"];
const SG_END = { broken: "การปิดล้อมจบลง… กำแพงเซฟโซนพังทลาย ค่ายไม่ปลอดภัย ฝูงซอมบี้ได้ชัยชนะในคืนนี้", low: "การปิดล้อมจบลง กำแพงเซฟโซนรอดมาได้อย่างหวุดหวิด เหลือเพียง {pct}% ซ่อมด่วนก่อนคืนถัดไป", ok: "การปิดล้อมจบลง ค่ายรอดมาได้! กำแพงเซฟโซนยังเหลือ {pct}% ขอบคุณทุกคนที่ช่วยกันสู้" };
function siegeBar() {
  let bar = $("siege-bar");
  if (!bar) { const log = $("chat-log"); if (!log) return; bar = mk("div"); bar.id = "siege-bar"; bar.style.cssText = "display:none;margin:6px 0;padding:8px 10px;border-radius:10px;font-size:.92em;line-height:1.4;border:1px solid"; log.before(bar); }
  const now = serverNow(), s = siegeNext(now), live = now >= s.start && now < s.end, pre = !live && s.start - now <= SIEGE_PRE;
  if (!state.profile || (!live && !pre)) { bar.style.display = "none"; return; }
  const h = wallHp(), pct = h === null ? null : Math.round((h / WALL_MAX) * 100), z = state.profile.faction === "zombie";
  bar.style.display = "block";
  bar.style.background = live ? "rgba(200,40,40,.18)" : "rgba(224,160,48,.15)"; bar.style.borderColor = live ? "#c82828" : "#e0a030";
  bar.textContent = live
    ? `🚨 คืนปิดล้อม! เหลืออีก ~${Math.max(1, Math.ceil((s.end - now) / 60000))} นาที${pct !== null ? ` • กำแพงเซฟโซน ${pct}%` : ""} • ${z ? "ไปเซฟโซนแล้วกด “ทุบกำแพง” ช่วยฝูง!" : "ไปเซฟโซนแล้วซ่อมกำแพงด้วยเศษวัสดุ!"} (ทุบ/ซ่อมนับเป็นเควส “ปิดล้อม”)`
    : `⏳ อีก ~${Math.max(1, Math.ceil((s.start - now) / 60000))} นาที ฝูงซอมบี้จะบุกกำแพงเซฟโซน — ${z ? "รวมพลที่เซฟโซน!" : "เตรียมเศษวัสดุ!"}`;
}
function siegeAnnounce() {
  const p = state.profile; if (!p) return;
  state.siegeAnn = state.siegeAnn || {};
  const now = serverNow(), s = siegeNext(now), ps = siegeSched(s.day - 1);
  const h = wallHp(), pct = h === null ? 0 : Math.round((h / WALL_MAX) * 100), rnd = bmRng(rdHash("sgann", s.day));
  const say = (key, text) => { if (state.siegeAnn[key]) return; state.siegeAnn[key] = 1; radioPush(`📻 [วิทยุฉุกเฉิน] ${text}`, serverNow(), true); };
  if (now < s.start && s.start - now <= SIEGE_PRE) say(s.day + "p", rdFill(rdPick(rnd, SG_PRE), { min: Math.max(1, Math.ceil((s.start - now) / 60000)) }));
  if (now >= s.start && now < s.end) {
    say(s.day + "s", rdPick(rnd, SG_START));
    if (now >= s.start + SIEGE_DUR / 2) say(s.day + "m", rdFill(rdPick(rnd, SG_MID), { pct }));
  }
  if (now >= ps.end && now < ps.end + 5 * 60000 && h !== null) say(ps.day + "e", rdFill(SG_END[h <= 0 ? "broken" : pct < 35 ? "low" : "ok"], { pct }));
}
function siegeInfoLine() {
  const now = serverNow(), s = siegeNext(now), live = now >= s.start && now < s.end, today = s.day === Math.floor((now + SIEGE_TZ) / SIEGE_DAY);
  return live ? `🚨 กำลังปิดล้อมอยู่ถึง ${siegeClock(s.end)} น.` : `🚨 คืนปิดล้อม${today ? "วันนี้" : "พรุ่งนี้"} ${siegeClock(s.start)}–${siegeClock(s.end)} น.`;
}

/* =========================================================
   28) เอฟเฟกต์หน้าตา (ฝั่ง client ล้วน — ไม่เขียนข้อมูลใดขึ้นเซิร์ฟเวอร์)
   • ขอบจอตามสถานะ (HP ต่ำ/พิษ/เลือดไหล/มึนงง/ล้มลง) • หลอดพลังกะพริบเมื่อใกล้หมด
   • ตัวเลขดาเมจลอย (โดนตี/ฟื้น/ทำดาเมจ) • ลูกเต๋าหมุน • ประกายรางวัล • สไตล์ข้อความ (คริ/ของรางวัล/วิทยุ/แจ้งเตือน)
   • สีประจำโซนที่ #screen-game[data-zone] • ปิดได้ที่ ⚙️ ตั้งค่า และเคารพ prefers-reduced-motion
   ========================================================= */
const fxOff = () => LS.get("zc_fxoff", false) || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
function fxLayer() { let l = $("fx-float"); if (!l) { l = document.createElement("div"); l.id = "fx-float"; document.body.append(l); } return l; }
function fxVig() { let v = $("fx-vignette"); if (!v) { v = document.createElement("div"); v.id = "fx-vignette"; document.body.append(v); } return v; }
function fxNum(text, kind, anchorId) {
  if (!HAS_DOM || fxOff()) return;
  const l = fxLayer(); if (l.childElementCount > 14) return;
  const r = anchorId ? $(anchorId)?.getBoundingClientRect?.() : null;
  const x = r && r.width ? r.left + r.width * (0.25 + Math.random() * 0.5) : innerWidth / 2, y = r && r.height ? r.top + r.height / 2 : innerHeight * 0.4;
  const e = mk("div", "fxn " + kind, text); e.style.left = x + "px"; e.style.top = y + "px"; l.append(e); setTimeout(() => e.remove(), 1600);
}
function fxDie(n) {
  if (!HAS_DOM || fxOff()) return;
  const l = fxLayer(); l.querySelectorAll(".fxdie").forEach((x) => x.remove());
  const e = mk("div", "fxdie" + (n === 6 ? " six" : "")); e.append(document.createTextNode("🎲"), mk("b", "", String(n))); l.append(e); setTimeout(() => e.remove(), 1100);
}
function fxSparks(n = 8) {
  if (!HAS_DOM || fxOff()) return;
  const l = fxLayer(), cx = innerWidth / 2, cy = innerHeight * 0.45;
  for (let i = 0; i < n; i++) {
    const e = mk("div", "fxsp", i % 3 ? "✨" : "⭐"), a = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = 50 + Math.random() * 60;
    e.style.left = cx + "px"; e.style.top = cy + "px"; e.style.setProperty("--dx", Math.cos(a) * d + "px"); e.style.setProperty("--dy", Math.sin(a) * d - 20 + "px"); l.append(e); setTimeout(() => e.remove(), 1000);
  }
}
// เรียกจาก logLine: คืนคลาสเสริมของข้อความ + ยิงเอฟเฟกต์
function fxOnLog(text, cls) {
  let extra = "";
  try {
    if (/^(📻|🎙️)/.test(text) || /^💬 .*: “/.test(text)) extra = " radio";
    else if (/^🚨/.test(text)) extra = " alert";
    if (cls === "combat") {
      const crit = /คริติคอล/.test(text), dm = /โดน[^\d−-]{0,40}[−-](\d+)/.exec(text), dice = /🎲 ทอย (\d)/.exec(text);
      if (dice) fxDie(+dice[1]);
      if (dm) fxNum("−" + dm[1], crit ? "crit" : "deal", "chat-log");
      if (crit) extra += " crit";
    }
    if (/^(🎁|🏆 รางวัล|🥇 คุณทำดาเมจสูงสุด)|ได้รับ |รับรางวัล|ได้ชิ้นพิเศษ|เกราะสุ่มจากคลัง/.test(text)) { extra += " loot"; fxSparks(); }
  } catch { /* เอฟเฟกต์พลาดไม่กระทบเกม */ }
  return extra;
}
function fxStatus() {
  const p = state.profile; if (!p || !HAS_DOM) return;
  const max = maxHp(), frac = max ? p.hp / max : 1, dead = p.hp <= 0, v = fxVig(), off = fxOff();
  const low = !dead && frac < 0.3, poison = effActive("poison"), bleed = effActive("bleed"), stun = effActive("stun");
  const on = !off && (dead || low || poison || bleed || stun);
  v.classList.toggle("on", on);
  v.classList.toggle("lowhp", on && low); v.classList.toggle("poison", on && poison); v.classList.toggle("bleed", on && bleed); v.classList.toggle("stun", on && stun); v.classList.toggle("dead", on && dead);
  const st = curStamina() / (maxStamina() || 1);
  [["bar-hp", low], ["bar-st", st < 0.15 && !dead], ["bar-fd", curFood() <= 15], ["bar-wt", curWater() <= 15]].forEach(([id, c]) => { $(id)?.parentElement?.classList.toggle("low", !off && c); });
  if (state.fxUid === state.uid && typeof state.fxHp === "number" && p.hp !== state.fxHp) {
    const d = p.hp - state.fxHp;
    if (d < 0) { fxNum("−" + -d, "dmg", "bar-hp"); if (!off) { v.classList.add("hit"); setTimeout(() => v.classList.remove("hit"), 400); } }
    else if (d >= 5) fxNum("+" + d, "heal", "bar-hp");
  }
  state.fxHp = p.hp; state.fxUid = state.uid;
}

/* =========================================================
   29) ความสำเร็จ • ฉายา • ยอดร่วมทั้งเซิร์ฟเวอร์ (เป้าหมายประจำสัปดาห์ / ภารกิจกลุ่มจากวิทยุ / ผู้รอดเด่นประจำวัน)
   ข้อมูล: ach/{uid} = { c:{ตัวนับสะสม}, t:ฉายาที่เลือก, ts }   coop/{key}/{uid} = { n, name, ts }
   • ปลดล็อกคำนวณฝั่งไคลเอนต์จากตัวนับ (ความสำเร็จให้ฉายา ไม่ให้ของ) • รางวัลของเป้าหมาย/ภารกิจกลุ่มวิ่งผ่านระบบเควสเดิม
   • key ของ coop: w/wh/wz{สัปดาห์}=เป้าหมาย(รวม/มนุษย์/ซอมบี้)  mh/mz{สล็อต 2 ชม.}=ภารกิจกลุ่ม  ds/dh/dw/db{วัน}=สถิติรายวันของผู้รอดเด่น
   ========================================================= */
const ACH_GAP = 6000, ACH_FLUSH_MS = 20000, ACH_STEP = 3000;
const ACH_TIER = [["b", "🥉", "ทองแดง"], ["s", "🥈", "เงิน"], ["g", "🥇", "ทอง"], ["l", "💎", "ตำนาน"]];
const ACH_CATS = [["explore", "🔍 สำรวจ"], ["combat", "⚔️ ต่อสู้"], ["camp", "🧱 ค่าย"], ["social", "💬 สังคม"], ["world", "🌍 โลก"], ["secret", "❓ ลับ"]];
const ZSHORT = { lab: "lab", safe: "safe", ruins: "ruins", mall: "mall", hospital: "hosp", police: "police", forest: "forest", factory: "fact", port: "port", base: "base", tunnel: "tunnel" };
// [ตัวนับ, ไอคอน, หมวด, ฝ่าย(h=มนุษย์ z=ซอมบี้ ว่าง=ทุกคน), คำกริยา, หน่วย, [เกณฑ์], [ชื่อฉายา]]
const ACH_FAM = [
  ["srch", "🔍", "explore", "", "ค้นหาของ", "ครั้ง", [10, 50, 150, 400, 1000, 2500], ["มือใหม่ขุดซาก", "นักคุ้ยเศษ", "นักสำรวจซากเมือง", "ขาประจำกองขยะ", "ปรมาจารย์ผู้ค้นหา", "ตำนานนักคุ้ยโลกแตก"]],
  ["found", "🎒", "explore", "", "เจอของจากการค้นหา", "ชิ้น", [5, 25, 100, 300, 800], ["เจอของชิ้นแรกๆ", "ตาไว", "โชคดีติดตัว", "โชคชะตาเข้าข้าง", "เทพเจ้าแห่งการเจอของ"]],
  ["nsrch", "🌙", "explore", "", "ค้นหาตอนกลางคืน", "ครั้ง", [10, 50, 200], ["คนกลางคืน", "นักค้นหาไร้แสง", "เจ้าแห่งรัตติกาล"]],
  ["trav", "🧭", "explore", "", "เดินทางข้ามโซน", "ครั้ง", [5, 30, 100, 300], ["นักเดินทางมือใหม่", "คนรู้ทาง", "นักเดินทางช่ำชอง", "ไม่มีที่ไหนไม่เคยไป"]],
  ["zvis", "🗺️", "explore", "", "ไปเยือนโซนต่างๆ ให้ครบ", "โซน", [4, 7, 11], ["เปิดแผนที่", "ครึ่งทางของแผนที่", "รู้จักทุกซอกมุมเมือง"]],
  ["craft", "🔧", "explore", "", "คราฟต์ของ", "ชิ้น", [5, 25, 80, 200], ["ช่างฝึกหัด", "ช่างประดิษฐ์", "ช่างฝีมือดี", "ช่างแห่งโลกใหม่"]],
  ["use", "🧪", "explore", "", "ใช้ไอเทม", "ครั้ง", [10, 50, 200, 600], ["ลองใช้ดู", "ชินมือ", "ผู้ใช้ของคล่อง", "ไม่เหลือทิ้งสักชิ้น"]],
  ["mkt", "🏪", "explore", "", "ซื้อ/ขายในตลาด", "ครั้ง", [3, 15, 50, 150], ["ลูกค้าใหม่", "พ่อค้าประจำ", "เจ้าพ่อตลาด", "จักรพรรดิตลาด"]],
  ["gacha", "🎰", "explore", "", "หมุนกาชา", "ครั้ง", [3, 15, 50, 150], ["ลองเสี่ยงดวง", "คอกาชา", "ผู้ติดกาชา", "เศรษฐีสายสุ่ม"]],
  ["zomb", "🧟", "combat", "h", "เจอซอมบี้ระหว่างค้นหา", "ครั้ง", [10, 40, 120, 300, 800], ["ครั้งแรกที่เห็นมัน", "ชินกับเสียงคำราม", "นักสู้ข้างถนน", "คนบ้านใกล้ปากเหว", "ความตายคือเพื่อนบ้าน"]],
  ["zwin", "⚔️", "combat", "h", "ชนะซอมบี้", "ครั้ง", [5, 25, 80, 200, 500, 1000], ["ฟาดครั้งแรก", "มือหนักขึ้น", "นักล่าซอมบี้", "ฆาตกรซอมบี้", "กำแพงเดินได้", "ผู้พิฆาตมหาอสุรกาย"]],
  ["boss", "👹", "combat", "h", "ล้มมินิบอสประจำโซน", "ตัว", [1, 5, 15, 40], ["ล้มยักษ์ตัวแรก", "นักล่าบอส", "ฝันร้ายของเหล่าบอส", "ผู้พิชิตเมือง"]],
  ["wbhit", "🌋", "combat", "", "โจมตีบอสโลก", "ครั้ง", [3, 15, 50, 150], ["ลองลูบคมบอสโลก", "ทีมบอสโลก", "ขาประจำสมรภูมิบอส", "นักรบบอสโลก"]],
  ["wbdmg", "💥", "combat", "", "ทำดาเมจรวมใส่บอสโลก", "แต้ม", [100, 1000, 5000, 20000], ["ขีดข่วนยักษ์", "ตีเจ็บ", "พายุดาเมจ", "ภัยพิบัติเดินได้"]],
  ["wbkill", "🏆", "combat", "", "ร่วมล้มบอสโลกและรับรางวัล", "ครั้ง", [1, 5, 15], ["ส่วนหนึ่งของชัยชนะ", "ตำนานบอสโลก", "ฆาตกรยักษ์"]],
  ["wbmvp", "🥇", "combat", "", "เป็น MVP ของบอสโลก", "ครั้ง", [1, 3, 10], ["MVP ครั้งแรก", "ดาวเด่นสนามรบ", "ราชาแห่งดาเมจ"]],
  ["dmg", "🩸", "combat", "", "รับดาเมจสะสม", "แต้ม", [200, 1000, 5000, 15000], ["ผ่านการบาดเจ็บ", "แผลเป็นเต็มตัว", "ร่างกายที่เคยตาย", "ไม่เจ็บแล้ว (จริงเหรอ?)"]],
  ["death", "💀", "combat", "", "ล้มลงจนต้องฟื้นที่ Safe Zone", "ครั้ง", [1, 5, 15, 40], ["ตายครั้งแรก", "ตายจนเริ่มชิน", "ตายซ้ำตายซาก", "ผู้ฟื้นคืนชีพ"]],
  ["hit", "🥊", "combat", "", "โจมตี (ผู้เล่น/บอส ทุกรูปแบบ)", "ครั้ง", [10, 50, 200, 600], ["ลงมือแล้ว", "นักเลงหน้าใหม่", "เก๋าสนามประลอง", "อัศวินดาบแหลกลาญ"]],
  ["pdef", "🛡️", "combat", "", "ป้องกันการโจมตีจากผู้เล่นอื่นได้", "ครั้ง", [3, 15, 50], ["ตั้งรับได้", "กำแพงมีชีวิต", "ป้อมปราการเดินได้"]],
  ["pdodge", "💨", "combat", "z", "หลบการโจมตีจากผู้เล่นอื่น", "ครั้ง", [3, 15, 50], ["หลบแล้ว", "เงาตัวเร็ว", "หลบอย่างกับไม่มีตัวตน"]],
  ["broke", "🔨", "combat", "", "ทำอาวุธพัง", "ชิ้น", [1, 5, 20], ["เพิ่งรู้ว่าอาวุธก็พัง", "ช่างพังประจำ", "ของทุกอย่างพังในมือ"]],
  ["infect", "🦠", "combat", "h", "ติดเชื้อ", "ครั้ง", [1, 3, 8], ["ถูกเชื้อเยือน", "ภูมิคุ้มกันกำลังสร้าง", "ภูมิคุ้มกันของจริง"]],
  ["cure", "💉", "combat", "h", "หายจากการติดเชื้อ", "ครั้ง", [1, 3, 8], ["รอดจากเชื้อ", "ผู้รอดจากเชื้อประจำ", "คนที่เชื้อก็ยอมแพ้"]],
  ["wall", "🧱", "camp", "h", "ซ่อมกำแพงค่าย", "ครั้ง", [3, 15, 50, 150, 400], ["ช่างปะผ้า", "มือปูน", "ช่างกำแพงประจำค่าย", "ผู้พิทักษ์กำแพง", "กำแพงคือชีวิต"]],
  ["scrap", "🔩", "camp", "h", "ใช้เศษเหล็กซ่อมกำแพงรวม", "ชิ้น", [20, 100, 400, 1500], ["เศษเหล็กชิ้นแรก", "คลังเศษเหล็ก", "วิศวกรเศษเหล็ก", "มหาบุรุษแห่งเศษเหล็ก"]],
  ["smash", "🔨", "camp", "z", "ทุบกำแพงค่าย", "ครั้ง", [3, 15, 50, 150, 400], ["เคาะประตูทักทาย", "ผู้มาเยือนไม่ได้รับเชิญ", "ค้อนเดินได้", "ผู้ทลายกำแพง", "ผู้ทำลายล้างแห่งค่าย"]],
  ["bite", "🦷", "camp", "z", "กัดเหยื่อ", "ครั้ง", [3, 15, 50, 150], ["กัดแรก", "เขี้ยวกำลังโต", "นักล่าเขี้ยวคม", "ราชันกัดไม่เลือก"]],
  ["evo", "🧬", "camp", "z", "วิวัฒนาการ", "ขั้น", [1, 5, 12], ["เริ่มกลายพันธุ์", "ผ่านการกลายพันธุ์", "สายพันธุ์เหนือมนุษย์"]],
  ["siegen", "🚨", "camp", "", "ร่วมคืนปิดล้อม", "คืน", [1, 3, 7, 15], ["คืนปิดล้อมแรก", "นักรบรัตติกาล", "ทหารผ่านศึกปิดล้อม", "ตำนานคืนปิดล้อม"]],
  ["siege", "⚡", "camp", "", "ทุบ/ซ่อมกำแพงในช่วงปิดล้อม", "ครั้ง", [5, 25, 100], ["สู้ในคืนอันตราย", "แนวหน้า", "ไม่หลับไม่นอน"]],
  ["bty", "💰", "combat", "", "เก็บค่าหัวสำเร็จ", "ครั้ง", [1, 3, 8, 20], ["นักล่าค่าหัวมือใหม่", "คนรับจ้างเก็บหัว", "นักล่าค่าหัวชื่อดัง", "ตำนานนักล่าค่าหัว"]],
  ["btyset", "📜", "social", "", "ตั้งค่าหัวคนอื่น", "ครั้ง", [1, 5, 15], ["ผู้ประกาศจับ", "เจ้าหนี้แค้นฝังหุ่น", "ผู้อยู่เบื้องหลังทุกการล่า"]],
  ["evt", "🪂", "world", "", "ค้นหาในโซนที่เกิดเหตุการณ์ใหญ่", "ครั้ง", [3, 15, 50, 150], ["ไปถึงที่เกิดเหตุ", "ขาประจำเหตุการณ์", "นักล่าโอกาส", "ผู้อยู่กลางพายุ"]],
  ["chat", "💬", "social", "", "ส่งข้อความแชท", "ข้อความ", [20, 100, 400, 1500], ["ทักทายแรก", "คนช่างคุย", "แกนนำวงสนทนา", "เสียงแห่งซากเมือง"]],
  ["radio", "🎙️", "social", "", "ขึ้นวิทยุตอบสัมภาษณ์", "ครั้ง", [1, 5, 15], ["เสียงแรกทางคลื่น", "ดีเจเถื่อน", "ผู้ประกาศประจำคลื่น"]],
  ["npc", "🗣️", "social", "", "คุยกับ NPC", "ครั้ง", [3, 15, 50, 120], ["ได้ทักทาย", "เพื่อนร่วมค่าย", "คนสนิทคนหนึ่ง", "ผู้รู้ทุกเรื่องราว"]],
  ["mira", "💊", "social", "", "สนิทกับมิราจนได้หัวใจ", "ดวง", [1, 3, 5], ["หมอเริ่มจำชื่อได้", "หมอเริ่มไว้ใจ", "คนที่มิราห่วงที่สุด"]],
  ["kane", "🪖", "social", "", "สนิทกับเคนจนได้หัวใจ", "ดวง", [1, 3, 5], ["ยามจำหน้าได้", "ยามพยักหน้าให้", "ศิษย์ใกล้ชิดเคน"]],
  ["dclaim", "🎁", "social", "", "รับรางวัลภารกิจรายวัน", "ครั้ง", [3, 15, 50, 150], ["เก็บค่าจ้างวันแรก", "พนักงานประจำ", "นักรับเงินรายวัน", "ขาประจำโต๊ะภารกิจ"]],
  ["wclaim", "📅", "social", "", "รับรางวัลภารกิจรายสัปดาห์", "ครั้ง", [1, 5, 15], ["รายสัปดาห์แรก", "ผู้ทำภารกิจสม่ำเสมอ", "พนักงานดีเด่นประจำเมือง"]],
  ["login", "📆", "social", "", "เข้าเล่นสะสม", "วัน", [1, 3, 7, 14, 30, 60], ["มาถึงแล้ว", "เริ่มติดค่าย", "แขกประจำ", "เพื่อนบ้านถาวร", "ผู้อยู่มานาน", "ตำนานแห่งค่าย"]],
  ["mxstrk", "🔥", "social", "", "เข้าเล่นติดต่อกัน", "วัน", [3, 7, 14, 30], ["สามวันติด", "หนึ่งสัปดาห์เต็ม", "สองสัปดาห์ไม่ขาด", "หนึ่งเดือนไม่ขาด"]],
  ["goalok", "🌍", "world", "", "ร่วมทำเป้าหมายประจำสัปดาห์ให้สำเร็จ", "ข้อ", [1, 3, 8], ["ส่วนหนึ่งของส่วนรวม", "คนของส่วนรวม", "เสาหลักของค่าย"]],
  ["gmok", "📻", "world", "", "ร่วมภารกิจกลุ่มจากวิทยุให้สำเร็จ", "ครั้ง", [1, 5, 15, 40], ["รับสายวิทยุแล้ว", "หน่วยกู้ภัยวิทยุ", "ทีมเวิร์กตัวจริง", "ฮีโร่ประจำคลื่น"]],
  ["mvpday", "🌟", "world", "", "ได้เป็นผู้รอดเด่นประจำวัน", "ครั้ง", [1, 3, 10, 25], ["ดาวเด่นของวัน", "ขวัญใจวิทยุ", "คนดังประจำค่าย", "ตำนานผู้รอดเด่น"]],
  ["fest", "🎆", "world", "", "ค้นหาระหว่างเทศกาล", "ครั้ง", [5, 25, 100], ["นักเที่ยวเทศกาล", "คอเทศกาลตัวยง", "ตำนานงานเมือง"]],
  ["festn", "🗓️", "world", "", "ได้ร่วมเทศกาลที่ต่างกัน", "งาน", [2, 4, 8], ["เริ่มสนุกกับปฏิทิน", "ตามเทศกาลครบ", "ครบทุกงานของเมือง"]],
  ["site", "🛩️", "world", "", "ค้นพบคลังลับ", "แห่ง", [1, 5, 15, 40], ["นักล่าข่าวลือ", "จมูกไวกว่าวิทยุ", "ขุดคลังลับมือฉมัง", "ตำนานนักค้นหาคลังลับ"]],
  ["duo", "🤝", "world", "", "ทำภารกิจเคียงข้างสำเร็จ", "ครั้ง", [1, 5, 20, 60], ["มีเพื่อนร่วมทาง", "คู่หูต่างโซน", "คู่หูตลอดกาล", "พี่น้องร่วมสมรภูมิ"]],
  ["heal", "🩹", "world", "", "ใช้ยา/ของรักษา", "ครั้ง", [10, 50, 200, 600], ["ผู้ช่วยหมอ", "หมอประจำหมู่", "หมอสนามตัวจริง", "เทพแห่งการรักษา"]],
  ["camp", "🏕️", "world", "", "สมทบโปรเจกต์ค่าย/รัง", "แต้ม", [50, 300, 1200, 4000], ["ผู้ร่วมสร้างค่าย", "แรงงานขยัน", "สถาปนิกค่าย", "ผู้สร้างบ้านให้ทุกคน"]],
  ["bcol", "🏠", "world", "", "เก็บผลผลิตจากที่พัก", "ชิ้น", [10, 50, 200, 600], ["เจ้าของบ้านมือใหม่", "ชาวสวนแห่งค่าย", "ผู้พึ่งตนเองได้", "เศรษฐีที่พักพิง"]],
  ["bup", "🔨", "world", "", "อัปเกรดที่พัก", "ครั้ง", [1, 2, 3], ["ต่อเติมบ้าน", "ขยายชานบ้าน", "คฤหาสน์แห่งค่าย"]],
  ["sea", "🏅", "world", "", "เหรียญเป้าหมายฤดูกาล", "เหรียญ", [1, 3, 6, 12], ["เหรียญแรก", "นักสู้ตลอดฤดู", "ขวัญใจทุกฤดูกาล", "ตำนานแห่งปีปฏิทิน"]],
  ["mgp", "🎮", "explore", "", "ผ่านมินิเกมค้นลึกแบบถูกครบ", "ครั้ง", [5, 25, 80, 200], ["หูไว", "จดจำแม่น", "นักถอดรหัส", "ไม่มีสัญญาณไหนรอดหู"]],
  ["wgd", "🌍", "world", "", "ทำเป้าหมายโลกครบทั้ง 3 ข้อในวันเดียว", "วัน", [3, 10, 30, 60], ["ใส่ใจโลกใบนี้", "นักสำรวจประจำวัน", "ผู้รับใช้เมืองร้าง", "ไม่เคยปล่อยให้วันผ่านไปเปล่า"]],
  ["vis", "🏡", "social", "", "เยี่ยมบ้านเพื่อน (คนละ 1 ครั้ง/วัน)", "ครั้ง", [3, 15, 50, 150], ["แวะทักทาย", "แขกประจำ", "เพื่อนบ้านทั้งเมือง", "ผู้ไม่เคยลืมใคร"]],
  ["gft", "🎁", "social", "", "ฝากของให้เพื่อน", "ชิ้น", [1, 5, 20, 60], ["น้ำใจแรก", "คนใจดี", "ซานต้ากลางป่า", "ผู้ให้ไม่รู้จบ"]],
  ["labs", "🧫", "world", "", "ส่งตัวอย่างวิจัยให้ค่าย", "ชิ้น", [5, 25, 80, 200], ["ผู้ช่วยนักวิจัย", "คนเก็บตัวอย่าง", "หัวหน้าห้องแล็บสนาม", "ผู้ไขปริศนาโครงการลับ"]],
  ["fish", "🎣", "explore", "", "ตกปลาได้", "ตัว", [5, 25, 80, 200], ["มือใหม่หัดตกปลา", "นักตกปลาท่าเรือ", "เจ้าแห่งทุ่นลอย", "ตำนานแห่งท่าเรือ"]],
  ["cook", "🍲", "world", "", "ทำอาหารจากปลา", "จาน", [3, 15, 50], ["พ่อครัวมือใหม่", "แม่ครัวประจำค่าย", "เชฟแห่งเมืองร้าง"]],
  ["petc", "🐾", "world", "", "สัตว์เลี้ยงหาของกลับมา", "ครั้ง", [3, 15, 50, 150], ["เพื่อนตัวน้อย", "คู่หูสี่ขา", "ผู้ฝึกสัตว์", "เจ้าของฝูงที่ภักดี"]],
  ["expd", "🧭", "explore", "", "ทีมสำรวจกลับมารับของสำเร็จ", "ครั้ง", [1, 5, 20, 60], ["ส่งทีมแรก", "หัวหน้าทีมสำรวจ", "เจ้าของเส้นทางเสบียง", "ผู้ไม่เคยให้ค่ายอดอยาก"]],
  ["book", "📖", "world", "", "บันทึกลงสมุดสะสม", "รายการ", [10, 25, 45, 70], ["นักจดบันทึก", "นักสะสมตัวยง", "ผู้รอบรู้เมืองร้าง", "สารานุกรมเดินได้"]],
  ["pjd", "🏗️", "world", "", "ร่วมสร้างโปรเจกต์จนเสร็จ", "โปรเจกต์", [1, 3, 6], ["ฟันเฟืองของค่าย", "คนสร้างถิ่น", "ตำนานผู้ก่อตั้ง"]],
  ["zwar", "⚔️", "world", "", "สะสมแต้มศึกชิงโซน", "แต้ม", [50, 300, 1000, 3000], ["ทหารแนวหน้า", "นักรบชิงโซน", "ผู้คุมสมรภูมิ", "ขุนศึกแห่งเมืองร้าง"]],
  ["wwin", "🚩", "world", "", "ฝั่งเราชนะศึกชิงโซนประจำสัปดาห์", "สัปดาห์", [1, 4, 12], ["ชัยชนะแรก", "ผู้ยึดโซนตัวยง", "ราชันศึกชิงโซน"]]
];
// ระดับท้าทายเพิ่ม (ตัวนับเดิม ไม่ต้องแก้ rules): ต่อท้ายแต่ละหมวดด้วยเกณฑ์ที่สูงขึ้นมาก
const ACH_HARD = {
  srch: [6000, "คนที่โลกนี้ไม่เหลืออะไรให้ซ่อน"], found: [2000, "ผู้ถูกโชคเลือก"], zwin: [2500, "ผู้ทำให้ซอมบี้ต้องหนี"], boss: [100, "ยักษ์ทุกตัวรู้จักชื่อ"],
  wbhit: [400, "ผู้ไม่ทิ้งสนามบอส"], wbdmg: [100000, "หายนะที่มีชีวิต"], wbkill: [30, "ผู้สังหารยักษ์ตัวจริง"], hit: [1500, "นักสู้ไม่มีวันเกษียณ"], dmg: [40000, "ผู้รอดจากทุกสิ่ง"],
  trav: [600, "แผนที่เดินได้"], craft: [500, "ช่างผู้สร้างโลกใหม่"], mkt: [400, "ผู้คุมเศรษฐกิจเมือง"], gacha: [400, "ผู้ผูกพันกับโชคชะตา"], use: [1500, "ไม่มีอะไรเหลือทิ้ง"],
  wall: [1000, "กำแพงคือศาสนา"], scrap: [6000, "ภูเขาเศษเหล็ก"], smash: [1000, "ผู้ลบกำแพงออกจากแผนที่"], siegen: [30, "ผู้ไม่เคยพลาดคืนปิดล้อม"], evt: [400, "ผู้ตามกลิ่นโอกาสได้ก่อนใคร"],
  chat: [4000, "เสียงที่ไม่เคยเงียบ"], login: [100, "ผู้ไม่เคยจากค่าย"], mxstrk: [60, "สองเดือนไม่ขาดสักวัน"], dclaim: [400, "ลูกจ้างตัวอย่างของเมือง"], bite: [400, "เขี้ยวที่เมืองต้องจดจำ"], bty: [50, "ราชาค่าหัว"]
};
ACH_FAM.forEach((f) => { const h = ACH_HARD[f[0]]; if (h && h[0] > f[6][f[6].length - 1] && f[7].length === f[6].length) { f[6].push(h[0]); f[7].push(h[1]); } });
const ACH = [];
ACH_FAM.forEach(([k, ic, cat, f, verb, unit, ths, names]) => ths.forEach((n, i) => ACH.push({
  id: k + (i + 1), k, ic, cat, f, n, n0: n, dv: verb, du: unit, name: names[i], desc: `${verb} ${n.toLocaleString("en-US")} ${unit}`,
  tier: i === ths.length - 1 && ths.length >= 3 ? 3 : Math.min(3, Math.floor(i * 4 / ths.length))
})));
// ความสำเร็จลับ: ซ่อนชื่อ/เงื่อนไขจนกว่าจะปลดล็อก
const ACH_SEC = [
  { id: "x1", ic: "😇", name: "ยังไม่เคยตาย", desc: "เข้าเล่นครบ 7 วันโดยไม่ล้มลงเลยสักครั้ง", tier: 2, f: "", t: (c) => (c.login || 0) >= 7 && !c.death },
  { id: "x2", ic: "🪦", name: "ตายก่อนชนะ", desc: "ล้มลง 10 ครั้ง ทั้งที่ชนะซอมบี้ได้ไม่ถึง 10 ครั้ง", tier: 0, f: "h", t: (c) => (c.death || 0) >= 10 && (c.zwin || 0) < 10 },
  { id: "x3", ic: "💞", name: "คนรักของทั้งค่าย", desc: "สนิทกับมิราและเคนจนได้หัวใจครบ 5 ดวงทั้งคู่", tier: 3, f: "", t: (c) => (c.mira || 0) >= 5 && (c.kane || 0) >= 5 },
  { id: "x4", ic: "🎖️", name: "ครบเครื่องสนามรบ", desc: "ล้มมินิบอสโซน ร่วมล้มบอสโลก และเป็น MVP อย่างน้อยอย่างละครั้ง", tier: 2, f: "h", t: (c) => (c.boss || 0) >= 1 && (c.wbkill || 0) >= 1 && (c.wbmvp || 0) >= 1 },
  { id: "x5", ic: "🦾", name: "อึดเกินมนุษย์", desc: "รับดาเมจสะสม 10,000 แต้ม โดยล้มลงไม่เกิน 3 ครั้ง", tier: 2, f: "", t: (c) => (c.dmg || 0) >= 10000 && (c.death || 0) <= 3 },
  { id: "x6", ic: "🌃", name: "ลูกรัตติกาล", desc: "ร่วมคืนปิดล้อม 3 คืน และค้นหาตอนกลางคืนอีก 50 ครั้ง", tier: 1, f: "", t: (c) => (c.siegen || 0) >= 3 && (c.nsrch || 0) >= 50 },
  { id: "x7", ic: "📡", name: "ผู้ศรัทธาคลื่นวิทยุ", desc: "ขึ้นวิทยุ 5 ครั้ง และร่วมภารกิจกลุ่มสำเร็จ 5 ครั้ง", tier: 2, f: "", t: (c) => (c.radio || 0) >= 5 && (c.gmok || 0) >= 5 },
  { id: "x8", ic: "🧿", name: "ไม่ยอมแพ้", desc: "ล้มลง 40 ครั้ง แต่ยังกลับมาเล่นต่อ", tier: 3, f: "", t: (c) => (c.death || 0) >= 40 },
  { id: "x9", ic: "🗺️", name: "ผู้พิชิตแผนที่", desc: "ไปเยือนครบ 10 โซน ค้นหา 1,500 ครั้ง และเดินทางข้ามโซน 100 ครั้ง", tier: 3, f: "", t: (c) => (c.zvis || 0) >= 10 && (c.srch || 0) >= 1500 && (c.trav || 0) >= 100 },
  { id: "x10", ic: "🕊️", name: "ไร้รอยแผล", desc: "เข้าเล่นครบ 14 วันโดยไม่ล้มลงเลยสักครั้ง", tier: 3, f: "", t: (c) => (c.login || 0) >= 14 && !c.death },
  { id: "x11", ic: "🐉", name: "ผู้สังหารมังกร", desc: "ล้มมินิบอส 40 ตัว ร่วมล้มบอสโลก 5 ครั้ง และเป็น MVP 3 ครั้ง", tier: 3, f: "h", t: (c) => (c.boss || 0) >= 40 && (c.wbkill || 0) >= 5 && (c.wbmvp || 0) >= 3 },
  { id: "x12", ic: "💎", name: "เศรษฐีนักสะสม", desc: "ซื้อขาย 150 ครั้ง หมุนกาชา 150 ครั้ง และคราฟต์ 200 ชิ้น", tier: 3, f: "", t: (c) => (c.mkt || 0) >= 150 && (c.gacha || 0) >= 150 && (c.craft || 0) >= 200 },
  { id: "x13", ic: "🏰", name: "เสาหลักของค่าย", desc: "ซ่อมกำแพง 400 ครั้ง ใช้เศษเหล็ก 1,500 ชิ้น และร่วมคืนปิดล้อม 15 คืน", tier: 3, f: "h", t: (c) => (c.wall || 0) >= 400 && (c.scrap || 0) >= 1500 && (c.siegen || 0) >= 15 },
  { id: "x14", ic: "☠️", name: "จอมทำลายล้าง", desc: "ทุบกำแพง 400 ครั้ง กัดเหยื่อ 150 ครั้ง และวิวัฒนาการครบ 12 ขั้น", tier: 3, f: "z", t: (c) => (c.smash || 0) >= 400 && (c.bite || 0) >= 150 && (c.evo || 0) >= 12 },
  { id: "x15", ic: "🏙️", name: "ชาวเมืองตัวจริง", desc: "เข้าเล่นติดกัน 30 วัน รับภารกิจรายวัน 150 ครั้ง รายสัปดาห์ 15 ครั้ง และร่วมเป้าหมายส่วนรวม 8 ข้อ", tier: 3, f: "", t: (c) => (c.mxstrk || 0) >= 30 && (c.dclaim || 0) >= 150 && (c.wclaim || 0) >= 15 && (c.goalok || 0) >= 8 },
  { id: "x16", ic: "📚", name: "ผู้รู้ทุกเรื่องราว", desc: "คุยกับ NPC 120 ครั้ง ได้หัวใจมิราและเคนครบ 5 ดวง และขึ้นวิทยุ 15 ครั้ง", tier: 3, f: "", t: (c) => (c.npc || 0) >= 120 && (c.mira || 0) >= 5 && (c.kane || 0) >= 5 && (c.radio || 0) >= 15 },
  { id: "x17", ic: "🦇", name: "ปีศาจรัตติกาล", desc: "ค้นหาตอนกลางคืน 200 ครั้ง และร่วมคืนปิดล้อม 15 คืน", tier: 3, f: "", t: (c) => (c.nsrch || 0) >= 200 && (c.siegen || 0) >= 15 }
];
const ACH_BY_ID = {}; ACH.concat(ACH_SEC).forEach((a) => { ACH_BY_ID[a.id] = a; });
const achFacKey = () => (state.profile?.faction === "zombie" ? "z" : "h");
const achVisible = (a) => !a.f || a.f === achFacKey();

/* ---- ตัวนับ + ปลดล็อก ---- */
function achBump(k, n = 1) {
  const A = state.ach; if (!A || !(n > 0)) return;
  if (!A.loaded) { A.pre.push([k, n, false]); return; }
  const before = A.c[k] || 0; A.c[k] = before + n; A.dirty[k] = 1; achCheck();
}
function achSet(k, v) {
  const A = state.ach; if (!A || !(v > 0)) return;
  if (!A.loaded) { A.pre.push([k, v, true]); return; }
  if (v > (A.c[k] || 0)) { A.c[k] = v; A.dirty[k] = 1; achCheck(); }
}
function achCheck(silent) {
  const A = state.ach; if (!A) return;
  ACH.forEach((a) => { if (!A.unl[a.id] && (A.c[a.k] || 0) >= a.n) achUnlock(a, silent); });
  ACH_SEC.forEach((a) => { if (!A.unl[a.id] && a.t(A.c)) achUnlock(a, silent); });
}
function achUnlock(a, silent) {
  const A = state.ach; A.unl[a.id] = 1; if (silent) return;
  const T = ACH_TIER[a.tier], msg = `🏅 ปลดล็อกความสำเร็จ: ${a.ic} ${a.name} (${T[1]} ${T[2]})`;
  try { toast(msg); logLine(msg, "system"); sfx("boss"); } catch { /* ข้าม */ }
  const fr = LS.get(lsKey("achnew"), []); fr.push(a.id); LS.set(lsKey("achnew"), fr.slice(-80));
  if (a.tier >= 2) { try { feedPost(1, a.id); } catch { /* ข้าม */ } }   // ทอง/ตำนาน → ประกาศทางวิทยุ
  achBtn();
}
function achZvis() {
  const A = state.ach; if (!A?.loaded) return;
  achSet("zvis", Object.keys(ZSHORT).filter((z) => A.c["zn" + ZSHORT[z]]).length);
}
function achZone(z) {
  const s = ZSHORT[z], A = state.ach; if (!s || !A) return;
  achSet("zn" + s, 1); achZvis();
}
// ตัวนับจากสถิติกลาง stat() และตัวนับเควส questBump()
function achStat(k, n) {
  switch (k) {
    case "search": achBump("srch", n); if (isNight()) achBump("nsrch", n); coopEvent("search", n); break;
    case "found": achBump("found", n); break;
    case "zombie": achBump("zomb", n); break;
    case "zwin": achBump("zwin", n); coopEvent("zwin", n); break;
    case "dmg": achBump("dmg", n); break;
    case "death": achBump("death", n); break;
    case "boss": achBump("boss", n); coopEvent("boss", n); break;
    case "wbdmg": achBump("wbdmg", n); coopEvent("wbdmg", n); break;
    case "npc": achBump("npc", n); break;
    case "broke": achBump("broke", n); break;
    default: break;
  }
}
const ACH_EVMAP = { hit: "hit", wboss: "wbhit", craft: "craft", use: "use", travel: "trav", market: "mkt", gacha: "gacha", chat: "chat", wall: "wall", smash: "smash", bite: "bite", siege: "siege", siegen: "siegen", dclaim: "dclaim" };
function achEv(ev) {
  if (ACH_EVMAP[ev]) achBump(ACH_EVMAP[ev]);
  if (["craft", "use", "travel", "market", "wall", "smash", "bite"].includes(ev)) coopEvent(ev, 1);
}
function achProfileWatch(p) {
  const A = state.ach; if (!A?.loaded || !p) return;
  const inf = !!p.infected;
  if (state.achInf === undefined) { state.achInf = inf; return; }
  if (inf && !state.achInf) achBump("infect");
  if (!inf && state.achInf && p.hp > 0 && p.faction === "human" && !state.dying) achBump("cure");
  state.achInf = inf;
}

/* ---- โหลด/บันทึก ---- */
async function achInit() {
  if (state.achOn || !state.uid) return; state.achOn = true;
  const A = state.ach = { c: {}, srv: {}, t: null, dirty: {}, loaded: false, pre: [], last: 0, tDirty: false, busy: false, unl: {}, tm: 0 };
  try {
    const s = (await get(ref(db, "ach/" + state.uid))).val();
    if (s) { A.c = s.c || {}; A.t = s.t || null; }
    else {   // ครั้งแรก: ยกยอดเก่าที่เซิร์ฟเวอร์มีอยู่แล้ว (ซ่อมกำแพง/ทุบกำแพง)
      const [wl, wh] = await Promise.all([get(ref(db, `wallLog/${state.uid}/n`)), get(ref(db, `wallHit/${state.uid}/n`))]);
      if (wl.val() > 0) { A.c.scrap = Math.min(wl.val(), 100000); A.dirty.scrap = 1; }
      if (wh.val() > 0) { A.c.smash = Math.min(wh.val(), 100000); A.dirty.smash = 1; }
    }
  } catch (e) { console.warn("ach load", e?.code || e); }
  Object.entries(A.c).forEach(([k, v]) => { if (!A.dirty[k]) A.srv[k] = v; });
  A.loaded = true; achCheck(true);   // ของที่ถึงเกณฑ์อยู่แล้ว: ปลดล็อกเงียบๆ ไม่เด้งเตือน
  A.pre.splice(0).forEach(([k, n, set]) => (set ? achSet(k, n) : achBump(k, n)));
  achZvis(); achLoginDay(); achBtn();
  setInterval(achFlush, ACH_FLUSH_MS);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { achFlush(); coopFlush(); } });
  coopInit();
}
function achLoginDay() {
  const A = state.ach, day = coopDay(), ld = day - 20000;   // เก็บเป็นเลขเล็ก (กฎจำกัดการเพิ่มต่อครั้ง)
  if ((A.c.ld || 0) >= ld) return;
  const st = LS.get(lsKey("achday"), { d: 0, s: 0 }), s = st.d === day - 1 ? st.s + 1 : 1;
  LS.set(lsKey("achday"), { d: day, s });
  achSet("ld", ld); achBump("login", 1); achSet("mxstrk", s);
  if ([7, 14, 30, 60, 100].includes(s)) setTimeout(() => { try { feedPost(4, String(s)); } catch { /* ข้าม */ } }, 8000);
}
async function achFlush() {
  const A = state.ach; if (!A?.loaded || A.busy || !state.profile || state.profile.banned) return;
  const keys = Object.keys(A.dirty), nm = String(state.profile.username || "").slice(0, 16); if (!keys.length && !A.tDirty && A.nSent === nm) return;
  const wait = ACH_GAP - (serverNow() - A.last);
  if (wait > 0) { clearTimeout(A.tm); A.tm = setTimeout(achFlush, wait + 250); return; }
  A.busy = true;
  const u = { ts: serverTimestamp() }, sent = {};
  keys.forEach((k) => {
    const v = Math.min(A.c[k], (A.srv[k] || 0) + ACH_STEP, 100000000);
    if (v > (A.srv[k] || 0)) { u["c/" + k] = v; sent[k] = v; } else delete A.dirty[k];
  });
  if (A.tDirty) u.t = A.t || null;
  if (nm && A.nSent !== nm) u.n = nm;   // ชื่อไว้แสดงในหอเกียรติยศ
  try {
    if (Object.keys(u).length > 1) await update(ref(db, "ach/" + state.uid), u);
    Object.entries(sent).forEach(([k, v]) => { A.srv[k] = v; if (A.c[k] === v) delete A.dirty[k]; });
    A.tDirty = false; if (u.n) A.nSent = u.n;
  } catch (e) {
    console.warn("ach flush", e?.code || e);   // อาจชนกับอีกเครื่อง: อ่านค่าจริงมารวมแล้วลองใหม่รอบหน้า
    try { const s = (await get(ref(db, "ach/" + state.uid))).val(); Object.entries(s?.c || {}).forEach(([k, v]) => { A.srv[k] = v; if ((A.c[k] || 0) < v) A.c[k] = v; }); } catch { /* ข้าม */ }
  } finally { A.last = serverNow(); A.busy = false; }
}

/* ---- ฉายา ---- */
state.achT = state.achT || {};
function achBadgeFill(el) {
  const uid = el.dataset.uid, id = uid === state.uid ? state.ach?.t : state.achT[uid]?.t, a = id && ACH_BY_ID[id];
  el.textContent = a ? `${a.ic} ${a.name}` : ""; el.className = "ach-t" + (a ? " tier-" + ACH_TIER[a.tier][0] : "");
}
function achTitleLoad(uid) {
  if (!uid || uid === state.uid) return;
  const c = state.achT[uid]; if (c && (c.loading || serverNow() - (c.at || 0) < 600000)) return;
  state.achT[uid] = { t: c?.t || null, at: c?.at || 0, loading: true };
  get(ref(db, `ach/${uid}/t`)).then((s) => { state.achT[uid] = { t: s.val() || null, at: serverNow() }; })
    .catch(() => { state.achT[uid] = { t: c?.t || null, at: serverNow() }; })
    .finally(() => document.querySelectorAll(`.ach-t[data-uid="${uid}"]`).forEach(achBadgeFill));
}
function achBadge(uid) { const el = mk("span", "ach-t"); el.dataset.uid = uid; achBadgeFill(el); achTitleLoad(uid); return el; }
function achSetTitle(id) {
  const A = state.ach; if (!A?.loaded || (id && !A.unl[id])) return;
  A.t = id || null; A.tDirty = true; achFlush();
  document.querySelectorAll(".ach-t").forEach(achBadgeFill);
  const hm = $("hub-modal"); if (hm && !hm.classList.contains("hidden") && hm.dataset.tab === "ach") hubTab("ach");
  toast(id ? `ใช้ฉายา ${ACH_BY_ID[id].ic} ${ACH_BY_ID[id].name}` : "ถอดฉายาแล้ว");
}
async function achBioLine(uid) {
  try {
    const s = (await get(ref(db, "ach/" + uid))).val(); if (!s?.c) return "";
    const got = ACH.filter((a) => (s.c[a.k] || 0) >= a.n).length + ACH_SEC.filter((a) => { try { return a.t(s.c); } catch { return false; } }).length;
    const t = s.t && ACH_BY_ID[s.t];
    return `🏅 ความสำเร็จ ${got} อัน${t ? ` • ฉายา ${t.ic} ${t.name}` : ""}`;
  } catch { return ""; }
}

/* ---- UI: แท็บ 🏅 ความสำเร็จ ---- */
function achBtn() {
  const b = $("btn-ach"); if (!b) return;
  const n = LS.get(lsKey("achnew"), []).length; b.textContent = n ? `🏅 ${n}` : "🏅";
}
function achProg(a) { const c = state.ach?.c || {}; return Math.min(a.n, c[a.k] || 0); }
function achRender(box) {
  const A = state.ach; if (!A?.loaded) { box.append(mk("div", "muted", "กำลังโหลดความสำเร็จ…")); return; }
  const list = ACH.concat(ACH_SEC).filter(achVisible), got = list.filter((a) => A.unl[a.id]).length;
  const head = mk("div", "ach-head"), cur = A.t && ACH_BY_ID[A.t];
  head.append(mk("b", "", `🏅 ปลดแล้ว ${got}/${list.length}`));
  head.append(mk("div", "muted", cur ? `ฉายาตอนนี้: ${cur.ic} ${cur.name}` : "ยังไม่ได้เลือกฉายา — แตะ “ใช้เป็นฉายา” ที่ความสำเร็จที่ปลดแล้ว (คนอื่นจะเห็นข้างชื่อคุณ)"));
  if (cur) head.append(btn("ถอดฉายา", () => achSetTitle(null), "btn ghost mini"));
  box.append(head);
  const cats = mk("div", "ach-cats"), sel = state.achCat || "all";
  [["all", "ทั้งหมด"], ...ACH_CATS].forEach(([k, l]) => { const b = btn(l, () => { state.achCat = k; hubTab("ach"); }, "btn ghost mini"); if (k === sel) b.classList.add("on"); cats.append(b); });
  box.append(cats);
  const fresh = new Set(LS.get(lsKey("achnew"), []));
  const rows = list.filter((a) => sel === "all" || a.cat === sel || (sel === "secret" && !a.cat));
  const fr = (a) => (A.unl[a.id] ? 1 : (a.k ? achProg(a) / a.n : 0));
  rows.sort((a, b) => (fresh.has(b.id) - fresh.has(a.id)) || ((A.unl[b.id] ? 1 : 0) - (A.unl[a.id] ? 1 : 0)) || (fr(b) - fr(a)));
  rows.forEach((a) => {
    const un = !!A.unl[a.id], T = ACH_TIER[a.tier], secret = !a.k && !un;
    const card = mk("div", `ach-card tier-${T[0]}${un ? "" : " lock"}`);
    card.append(mk("span", "ach-ic", secret ? "❓" : a.ic));
    const bd = mk("div", "ach-bd");
    bd.append(mk("div", "ach-nm", secret ? "ความสำเร็จลับ" : `${a.name}${fresh.has(a.id) ? " 🆕" : ""}`));
    bd.append(mk("div", "ach-ds muted", secret ? "ทำบางอย่างให้ถูกวิธีเพื่อเปิดเผย" : a.desc));
    if (!un && a.k) {
      const cur2 = achProg(a), bar = mk("div", "ach-bar"), i = mk("i"); i.style.width = Math.round((cur2 / a.n) * 100) + "%"; bar.append(i, mk("span", "", `${cur2.toLocaleString("en-US")}/${a.n.toLocaleString("en-US")}`)); bd.append(bar);
    }
    if (un) bd.append(A.t === a.id ? mk("div", "ach-using", `✓ กำลังใช้เป็นฉายา • ${T[1]} ${T[2]}`) : btn(`ใช้เป็นฉายา • ${T[1]} ${T[2]}`, () => achSetTitle(a.id), "btn ghost mini"));
    card.append(bd); box.append(card);
  });
  if (fresh.size) { LS.set(lsKey("achnew"), []); achBtn(); }
}

/* ---- ยอดร่วม (coop) ---- */
const COOP_TZ = 25200000, COOP_DAY_MS = 86400000, COOP_SLOT_MS = 7200000, MIS_LIVE_MS = 5400000, COOP_FLUSH_MS = 25000, COOP_MAXD = 280;
const coopDay = (t = serverNow()) => Math.floor((t + COOP_TZ) / COOP_DAY_MS);
const coopSlot = (t = serverNow()) => Math.floor(t / COOP_SLOT_MS);
const GROUP_KEY = { all: "w", human: "wh", zombie: "wz" };
const GOALS = {
  all: [
    { ev: "search", n: 700, min: 10, t: "ออกค้นหาของให้ได้รวมกัน 700 ครั้ง" },
    { ev: "craft", n: 100, min: 3, t: "คราฟต์ของรวมกัน 100 ชิ้น" },
    { ev: "travel", n: 200, min: 5, t: "เดินทางข้ามโซนรวมกัน 200 ครั้ง" },
    { ev: "use", n: 350, min: 8, t: "ใช้ไอเทมรวมกัน 350 ครั้ง" },
    { ev: "market", n: 60, min: 2, t: "ซื้อ/ขายในตลาดรวมกัน 60 ครั้ง" }
  ],
  human: [
    { ev: "scrap", n: 300, min: 8, t: "ใช้เศษเหล็กซ่อมกำแพงรวมกัน 300 ชิ้น" },
    { ev: "zwin", n: 200, min: 5, t: "ชนะซอมบี้รวมกัน 200 ครั้ง" }
  ],
  zombie: [
    { ev: "smash", n: 250, min: 8, t: "ทุบกำแพงค่ายรวมกัน 250 ครั้ง" },
    { ev: "bite", n: 60, min: 2, t: "กัดเหยื่อรวมกัน 60 ครั้ง" }
  ]
};
const goalOf = (grp, wk = qpKey("weekly")) => {
  const L = GOALS[grp], d = L[rdHash("goal", grp, wk) % L.length];
  const n = Math.max(1, Math.round(T(`g_${grp}_${d.ev}`, d.n))), min = Math.max(0, Math.round(T(`gm_${grp}_${d.ev}`, d.min)));   // ปรับค่าได้จากแท็บ 🎛️ (tune/)
  return { ...d, n, min, t: d.t.replace(String(d.n), String(n)), grp, wk, key: GROUP_KEY[grp] + wk };
};
const MIS = {
  human: [
    { ev: "search", z: 1, n: 15, t: (z) => `ค้นหาของที่${z}รวมกัน 15 ครั้ง` },
    { ev: "zwin", n: 12, t: () => "ชนะซอมบี้รวมกัน 12 ครั้ง" },
    { ev: "scrap", n: 15, t: () => "ใช้เศษเหล็กซ่อมกำแพงรวมกัน 15 ชิ้น" }
  ],
  zombie: [
    { ev: "smash", n: 12, t: () => "ทุบกำแพงค่ายรวมกัน 12 ครั้ง" },
    { ev: "search", z: 1, n: 15, t: (z) => `ออกล่าหาของที่${z}รวมกัน 15 ครั้ง` },
    { ev: "bite", n: 6, t: () => "กัดเหยื่อรวมกัน 6 ครั้ง" }
  ]
};
function misOf(fac, slot = coopSlot()) {
  const L = MIS[fac], d = L[rdHash("mis", fac, slot) % L.length], zl = Object.keys(ZONES).filter((z) => z !== "safe");
  const zone = d.z ? zl[rdHash("misz", fac, slot) % zl.length] : null;
  const n = Math.max(1, Math.round(T(`m_${fac}_${d.ev}`, d.n)));
  return { ev: d.ev, n, zone, slot, fac, key: (fac === "human" ? "mh" : "mz") + slot, text: d.t(zone ? ZONES[zone].name : "").replace(String(d.n), String(n)), end: slot * COOP_SLOT_MS + MIS_LIVE_MS };
}
const misLive = (t = serverNow()) => t - coopSlot(t) * COOP_SLOT_MS < MIS_LIVE_MS;
const coopFac = () => (state.profile?.faction === "zombie" ? "zombie" : "human");

function coopEvent(ev, n = 1) {
  const C = state.coop; if (!C || !(n > 0) || !state.profile) return;
  const add = (key) => { C.pend[key] = (C.pend[key] || 0) + n; }, now = serverNow(), fac = coopFac(), wk = qpKey("weekly");
  const dk = { search: "ds", zwin: "dh", boss: "dh", wall: "dw", smash: "dw", wbdmg: "db" }[ev]; if (dk) add(dk + coopDay(now));
  if (goalOf("all", wk).ev === ev) add(goalOf("all", wk).key);
  if (goalOf(fac, wk).ev === ev) add(goalOf(fac, wk).key);
  if (misLive(now)) { const m = misOf(fac); if (m.ev === ev && (!m.zone || m.zone === state.zone)) add(m.key); }
  try { zwarEvent(ev, n); } catch { /* ข้าม */ }   // ศึกชิงโซน (หัวข้อ 37)
}
async function coopFlush() {
  try { zwFlush(); } catch { /* ข้าม */ }
  const C = state.coop; if (!C || C.busy || !state.profile || state.profile.banned) return;
  const keys = Object.keys(C.pend).filter((k) => C.pend[k] > 0); if (!keys.length) return;
  const wait = ACH_GAP - (serverNow() - C.last);
  if (wait > 0) { clearTimeout(C.tm); C.tm = setTimeout(coopFlush, wait + 300); return; }
  C.busy = true;
  try {
    const u = {}, sent = {};
    for (const key of keys.slice(0, 6)) {
      if (C.mine[key] === undefined) C.mine[key] = (await get(ref(db, `coop/${key}/${state.uid}/n`))).val() || 0;
      const d = Math.min(C.pend[key], COOP_MAXD);
      u[`${key}/${state.uid}`] = { n: C.mine[key] + d, name: state.profile.username, ts: serverTimestamp() }; sent[key] = d;
    }
    await update(ref(db, "coop"), u);
    Object.entries(sent).forEach(([k, d]) => { C.mine[k] += d; C.pend[k] -= d; if (C.pend[k] <= 0) delete C.pend[k]; });
  } catch (e) { console.warn("coop flush", e?.code || e); C.mine = {}; }
  finally { C.last = serverNow(); C.busy = false; }
}
const coopMine = (k) => Math.max(state.coop?.mine?.[k] ?? 0, state.coop?.sums?.[k]?.[state.uid]?.n || 0) + (state.coop?.pend?.[k] || 0);
const coopSum = (k) => Object.entries(state.coop?.sums?.[k] || {}).reduce((s, [u, x]) => s + (u === state.uid ? 0 : (x?.n || 0)), 0) + coopMine(k);
function coopListen() {
  const C = state.coop, wk = qpKey("weekly"), slot = coopSlot();
  const want = new Set(["w" + wk, "wh" + wk, "wz" + wk, "mh" + slot, "mz" + slot]);
  try { zwarWant(want); } catch { /* ข้าม */ }
  Object.keys(C.subs).forEach((k) => { if (!want.has(k)) { try { C.subs[k](); } catch { /* ข้าม */ } delete C.subs[k]; delete C.sums[k]; } });
  want.forEach((k) => {
    if (C.subs[k]) return;
    C.subs[k] = onValue(ref(db, "coop/" + k), (s) => { C.sums[k] = s.val() || {}; coopCheck(); worldRefresh(); }, (e) => console.warn("coop", k, e?.code || e));
  });
}
function coopReward(fn) { const C = state.coop; C.q = C.q.then(async () => { try { fn(); } catch { /* ข้าม */ } await new Promise((r) => setTimeout(r, 5500)); }); }
const coopFlag = (k) => !!LS.get(lsKey("cf_" + k), 0);
const coopSetFlag = (k) => { LS.set(lsKey("cf_" + k), 1); };
function coopCheck() {
  const C = state.coop; if (!C || !state.profile || !state.ach?.loaded) return;
  const fac = coopFac(), wk = qpKey("weekly");
  ["all", fac].forEach((grp) => {
    const g = goalOf(grp, wk), s = coopSum(g.key); if (s < g.n) return;
    if (!coopFlag("ga_" + g.key)) { coopSetFlag("ga_" + g.key); radioPush(`📻 [วิทยุ] 🌍 เป้าหมายประจำสัปดาห์สำเร็จแล้ว! ${g.t} — ใครมีส่วนร่วมรับรางวัลได้ที่ 📜 ภารกิจ`, serverNow(), true); }
    if (coopMine(g.key) >= g.min && !coopFlag("gr_" + g.key)) { coopSetFlag("gr_" + g.key); coopReward(() => { achBump("goalok"); questBump("goalok"); }); }
  });
  const m = misOf(fac), s = coopSum(m.key);
  if (s >= m.n && !coopFlag("ms_" + m.key)) {
    coopSetFlag("ms_" + m.key);
    radioPush(fac === "zombie" ? `📻 [เสียงในฝูง] ภารกิจสำเร็จ! ${m.text} (${s}/${m.n}) — พวกเราทำได้` : `📻 [ศูนย์กู้ภัย] ภารกิจสำเร็จ! ${m.text} (${s}/${m.n}) — ขอบคุณทุกคน`, serverNow(), true);
    if (coopMine(m.key) >= 2) coopReward(() => { achBump("gmok"); questBump("gmok"); });
  }
}
function coopMissionTick() {
  const fac = coopFac(), now = serverNow(), m = misOf(fac);
  if (misLive(now) && !coopFlag("mst_" + m.key)) {
    coopSetFlag("mst_" + m.key);
    const mins = Math.max(1, Math.ceil((m.end - now) / 60000));
    radioPush(fac === "zombie" ? `📻 [เสียงในฝูง] ภารกิจกลุ่ม: ${m.text} ภายใน ${mins} นาที — พวกเราต้องไปด้วยกัน (ดูที่ 📊 → 🌍)` : `📻 [ศูนย์กู้ภัย] ภารกิจกลุ่ม: ${m.text} ภายใน ${mins} นาที — ใครว่างช่วยกันหน่อย! (ดูที่ 📊 → 🌍)`, now, true);
  }
  if (!misLive(now) && coopFlag("mst_" + m.key) && !coopFlag("ms_" + m.key) && !coopFlag("mf_" + m.key)) {
    coopSetFlag("mf_" + m.key); radioPush(`📻 ภารกิจกลุ่มหมดเวลา ยอด ${coopSum(m.key)}/${m.n} — รอบหน้าลองใหม่`, now, true);
  }
}
const MVP_CATS = [["ds", "🔍", "นักสำรวจแห่งวัน", "ค้นหา", 5, "ครั้ง"], ["dh", "⚔️", "นักสู้แห่งวัน", "ชนะ", 3, "ครั้ง"], ["dw", "🧱", "ผู้ดูแลกำแพงแห่งวัน", "ลงมือ", 3, "ครั้ง"], ["db", "🌋", "นักล่าบอสแห่งวัน", "ดาเมจ", 50, "แต้ม"]];
async function coopMvp(day) {
  const C = state.coop;
  try {
    const snaps = await Promise.all(MVP_CATS.map(([p]) => get(ref(db, `coop/${p}${day}`))));
    const lines = []; let won = 0;
    snaps.forEach((s, i) => {
      const v = s.val(); if (!v) return;
      const top = Object.entries(v).filter(([, x]) => x && typeof x.n === "number").sort((a, b) => b[1].n - a[1].n)[0];
      if (!top || top[1].n < MVP_CATS[i][4]) return;
      const [, ic, ttl, verb, , unit] = MVP_CATS[i];
      lines.push(`${ic} ${ttl} ${String(top[1].name || "?").slice(0, 16)} (${verb} ${top[1].n} ${unit})`);
      if (top[0] === state.uid) won++;
    });
    C.mvp = { day, lines };
    if (lines.length) radioPush(`📻 [วิทยุ] ผู้รอดเด่นเมื่อวาน: ${lines.join(" • ")}`, serverNow(), true);
    if (won) { achBump("mvpday", 1); toast("🌟 เมื่อวานคุณเป็นผู้รอดเด่นประจำวัน!"); }
    worldRefresh();
  } catch (e) { console.warn("coop mvp", e?.code || e); }
}
function coopMvpTick() {
  const C = state.coop, day = coopDay(); if (C.mvpBusy) return;
  const last = LS.get(lsKey("cf_mvpday"), 0); if (last === day) return;
  C.mvpBusy = true; LS.set(lsKey("cf_mvpday"), day); coopMvp(day - 1).finally(() => { C.mvpBusy = false; });
}
function coopTick() { const C = state.coop; if (!C || !state.profile || !state.ach?.loaded) return; coopListen(); coopMissionTick(); coopMvpTick(); }
function coopInit() {
  if (state.coop) return;
  state.coop = { pend: {}, mine: {}, sums: {}, subs: {}, last: 0, busy: false, tm: 0, q: Promise.resolve(), mvp: null, mvpBusy: false };
  tuneListen(); try { hcGlobalListen(); } catch { /* ข้าม */ } feedListen(); bountyListen(); try { crimListen(); } catch (e) { console.warn("crimListen", e); } try { bty2Listen(); } catch (e) { console.warn("bty2Listen", e); } try { jailListen(); jailPubListen(); } catch (e) { console.warn("jailListen", e); } setInterval(evtTick, 15000); setTimeout(evtTick, 6000); coopListen(); setInterval(coopFlush, COOP_FLUSH_MS); setInterval(coopTick, 15000); setTimeout(coopTick, 4000); try { fxInit(); } catch (e) { console.warn("fxInit", e); }
}
function worldRefresh() { const hm = $("hub-modal"); if (hm && !hm.classList.contains("hidden") && hm.dataset.tab === "world") { const b = $("hub-body"), y = b ? b.scrollTop : 0; hubTab("world"); if (b) b.scrollTop = y; } }

/* ---- UI: แท็บ 🌍 โลก ---- */
function worldBar(frac, text) { const bar = mk("div", "ach-bar"), i = mk("i"); i.style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + "%"; bar.append(i, mk("span", "", text)); return bar; }
function worldRender(box) {
  try { kWorldRows(box); } catch (e) { console.warn("kWorld", e); }
  const C = state.coop; if (!C) { box.append(mk("div", "muted", "กำลังโหลด…")); return; }
  const fac = coopFac(), wk = qpKey("weekly");
  box.append(mk("div", "hub-day", `🌍 เป้าหมายประจำสัปดาห์ • เหลือ ${qpFmt(qpResetIn("weekly"))}`));
  [["all", "🌐 ทั้งเซิร์ฟเวอร์"], ["human", "🧑 ฝั่งมนุษย์"], ["zombie", "🧟 ฝั่งซอมบี้"]].forEach(([grp, label]) => {
    const g = goalOf(grp, wk), s = coopSum(g.key), mine = coopMine(g.key), who = Object.values(C.sums[g.key] || {}).filter((x) => x && x.n > 0).length;
    const row = mk("div", "world-row"); row.append(mk("div", "", `${label}: ${g.t}`), worldBar(s / g.n, `${Math.min(s, g.n)}/${g.n}${s >= g.n ? " ✅" : ""}`));
    row.append(mk("div", "muted", grp === "all" || grp === fac ? `คุณทำไป ${mine}${mine >= g.min ? " (รับรางวัลได้)" : ` (ต้องอย่างน้อย ${g.min} ถึงจะรับรางวัล)`} • ผู้ร่วม ${who} คน` : `ผู้ร่วม ${who} คน (เป้าหมายของอีกฝั่ง)`));
    box.append(row);
  });
  const tops = Object.values(C.sums["w" + wk] || {}).filter((x) => x && x.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
  if (tops.length) box.append(mk("div", "muted", "🏅 ตัวตึงสัปดาห์นี้: " + tops.map((x, i) => `${i + 1}. ${String(x.name || "?").slice(0, 16)} ${x.n}`).join("  ")));
  box.append(mk("div", "hub-day", "📻 ภารกิจกลุ่มจากวิทยุ"));
  const now = serverNow();
  [fac, fac === "human" ? "zombie" : "human"].forEach((f) => {
    const m = misOf(f), live = misLive(now), s = coopSum(m.key), row = mk("div", "world-row");
    const label = f === "human" ? "🧑 ฝั่งมนุษย์" : "🧟 ฝั่งซอมบี้";
    if (live) { row.append(mk("div", "", `${label}: ${m.text}`), worldBar(s / m.n, `${Math.min(s, m.n)}/${m.n}${s >= m.n ? " ✅" : ""}`), mk("div", "muted", `เหลือ ${Math.max(1, Math.ceil((m.end - now) / 60000))} นาที${f === fac ? ` • คุณทำไป ${coopMine(m.key)}` : " (ภารกิจของอีกฝั่ง)"}`)); }
    else { const nx = (m.slot + 1) * COOP_SLOT_MS - now; row.append(mk("div", "muted", `${label}: ยังไม่มีภารกิจ — ภารกิจถัดไปในอีก ~${Math.max(1, Math.ceil(nx / 60000))} นาที`)); }
    box.append(row);
  });
  try { wxWorldRows(box); evtWorldRows(box); (bty2On() ? bty2WorldRows : bountyWorldRows)(box); jailWorldRows(box); fxWorldRows(box); } catch (e) { console.warn("world rows", e); }
  box.append(mk("div", "hub-day", "🌟 ผู้รอดเด่นเมื่อวาน"));
  if (C.mvp?.lines?.length) C.mvp.lines.forEach((l) => box.append(mk("div", "", l))); else box.append(mk("div", "muted", C.mvp ? "เมื่อวานยังไม่มีใครโดดเด่นพอ" : "กำลังโหลด…"));
  box.append(mk("div", "muted", "รางวัลเป้าหมาย/ภารกิจกลุ่มไปรับที่ปุ่ม 📜 ภารกิจ (ถ้าเจ้าของยังไม่เติมเควส ให้ไปกด “เติมเควสเช็กอิน+ปิดล้อม” ที่แอดมิน)"));
}


/* =========================================================
   30) ข่าววิทยุจากผู้เล่น (feed) + 🏆 หอเกียรติยศ
   feed/{uid} = {k:ชนิด, x:รหัส, n:ชื่อ, ts} — ช่องเดียวต่อคน เขียนทับได้ทุก ≥15 วิ
   ทุกเครื่องฟังทั้งโหนด แล้วแปลงเป็นข้อความวิทยุเอง (ไม่เก็บข้อความ ไม่มีช่องให้พิมพ์เอง)
   ========================================================= */
const FEED_GAP = 16000;
state.feed = state.feed || { last: 0, q: null, tm: 0, seen: {}, first: true, on: false };
function feedPost(k, x) {
  const F = state.feed; if (!state.uid || !state.profile || state.profile.banned) return;
  F.q = { k, x: x === undefined ? null : String(x).slice(0, 12) }; feedDrain();
}
function feedDrain() {
  const F = state.feed; if (!F.q || F.busy) return;
  const wait = FEED_GAP - (serverNow() - F.last);
  if (wait > 0) { clearTimeout(F.tm); F.tm = setTimeout(feedDrain, wait + 300); return; }
  const e = F.q; F.q = null; F.busy = true;
  const body = { k: e.k, n: String(state.profile.username).slice(0, 16), ts: serverTimestamp(), ...(e.x ? { x: e.x } : {}) };
  set(ref(db, "feed/" + state.uid), body).catch((er) => console.warn("feed", er?.code || er)).finally(() => { F.last = serverNow(); F.busy = false; if (F.q) feedDrain(); });
}
function feedText(e) {
  const n = String(e.n || "?").slice(0, 16), x = String(e.x || "");
  if (e.k === 1) { const a = ACH_BY_ID[x]; if (!a) return ""; const T = ACH_TIER[a.tier]; return `🏅 ${n} ปลดล็อกความสำเร็จ ${T[1]} ${a.ic} ${a.name}${a.tier === 3 ? " — ระดับตำนาน!" : ""}`; }
  if (e.k === 2) { const L = EVO_LINES[x]; return L ? `🧬 ${n} วิวัฒนาการถึงขั้นสุดท้าย กลายเป็น ${L.icon}${L.title} — ฝูงซอมบี้ส่งเสียงคำราม` : ""; }
  if (e.k === 3) { const z = ZONES[x]; return z ? `💀 ผู้รอดชีวิตชื่อ ${n} ล้มลงที่${z.name} — ระวังตัวกันด้วย` : ""; }
  if (e.k === 5) { const d = ITEMS[x]; return d ? `🎰 ${n} หมุนตู้กาชาโชคดีสุดๆ ได้ ${d.icon || "📦"} ${d.name} ระดับตำนาน!` : ""; }
  if (e.k === 6) return STAT_LABEL[x] ? `🔓 ${n} ทะลุขีดจำกัด ${STAT_LABEL[x]} — แกร่งขึ้นอีกขั้น!` : "";
  if (e.k === 7) return STAT_LABEL[x] ? `☣️ ${n} ฝืนกินแคปซูลเสริม ${STAT_LABEL[x]} ทั้งที่ร่างกายรับไม่ไหว — ลุ้นกันอยู่!` : "";
  if (e.k === 4) { const d = Number(x); return d >= 7 && d <= 100 ? `🔥 ${n} อยู่รอดมาต่อเนื่อง ${d} วันแล้ว` : ""; }
  return "";
}
function feedListen() {
  const F = state.feed; if (F.on || !state.uid) return; F.on = true;
  onValue(ref(db, "feed"), (snap) => {
    const all = snap.val() || {}, now = serverNow(), fresh = [];
    Object.entries(all).forEach(([uid, e]) => {
      if (!e || typeof e.ts !== "number" || F.seen[uid] === e.ts) return;
      const old = F.seen[uid] === undefined; F.seen[uid] = e.ts;
      if (old && F.first && now - e.ts > 1800000) return;   // เปิดเกมมาครั้งแรก: เอาแค่ข่าว 30 นาทีล่าสุด
      const t = feedText(e); if (t) fresh.push({ t, ts: e.ts, live: !F.first });
    });
    fresh.sort((a, b) => a.ts - b.ts).forEach((f) => radioPush(`📻 [วิทยุ] ${f.t}`, f.ts, f.live));
    F.first = false;
  }, (er) => console.warn("feed listen", er?.code || er));
}

const FAME = [["srch", "🔍 นักค้นหา", "ครั้ง"], ["zwin", "⚔️ นักล่าซอมบี้", "ครั้ง"], ["scrap", "🔩 ช่างซ่อมกำแพง", "ชิ้น"], ["smash", "🔨 ผู้ทลายกำแพง", "ครั้ง"], ["bite", "🦷 เขี้ยวคม", "ครั้ง"], ["trav", "🧭 นักเดินทาง", "ครั้ง"], ["craft", "🔧 ช่างฝีมือ", "ชิ้น"], ["mkt", "🏪 พ่อค้า", "ครั้ง"], ["bty", "💰 นักล่าค่าหัว", "ครั้ง"], ["evt", "🪂 ผู้ร่วมเหตุการณ์", "ครั้ง"]];
async function fameLoad() {
  const C = state.fameCache; if (C && serverNow() - C.at < 300000) return C.rows;
  const all = (await get(ref(db, "ach"))).val() || {};
  const rows = Object.entries(all).map(([uid, e]) => {
    const c = e?.c || {}, got = ACH.filter((a) => (c[a.k] || 0) >= a.n).length + ACH_SEC.filter((a) => { try { return a.t(c); } catch { return false; } }).length;
    return { uid, n: String(e?.n || "ผู้รอดนิรนาม").slice(0, 16), c, got, t: e?.t || null };
  });
  state.fameCache = { at: serverNow(), rows }; return rows;
}
async function fameRender(box) {
  box.append(mk("p", "muted", "กำลังโหลดหอเกียรติยศ…"));
  try {
    const rows = await fameLoad(), me = state.uid; box.textContent = "";
    box.append(mk("div", "muted", "อัปเดตทุก ~5 นาที • นับสถิติตลอดชีพของแต่ละคน"));
    const block = (title, list, fmt) => {
      box.append(mk("div", "hub-day", title));
      if (!list.length) return box.append(mk("div", "muted", "ยังไม่มีใครบันทึกไว้"));
      list.forEach((r, i) => { const row = mk("div", r.uid === me ? "me" : "", `${["🥇", "🥈", "🥉"][i]} ${r.n} — ${fmt(r)}`); const a = r.t && ACH_BY_ID[r.t]; if (a) { const b = mk("span", "ach-t tier-" + ACH_TIER[a.tier][0], `${a.ic} ${a.name}`); row.append(" ", b); } box.append(row); });
    };
    block("🏅 นักสะสมความสำเร็จ", rows.filter((r) => r.got > 0).sort((a, b) => b.got - a.got).slice(0, 3), (r) => `${r.got} อัน`);
    FAME.forEach(([k, label, unit]) => block(label, rows.filter((r) => (r.c[k] || 0) > 0).sort((a, b) => (b.c[k] || 0) - (a.c[k] || 0)).slice(0, 3), (r) => `${(r.c[k] || 0).toLocaleString("en-US")} ${unit}`));
    block("📅 เข้าเล่นต่อเนื่องนานสุด", rows.filter((r) => (r.c.mxstrk || 0) > 0).sort((a, b) => (b.c.mxstrk || 0) - (a.c.mxstrk || 0)).slice(0, 3), (r) => `${r.c.mxstrk} วัน`);
  } catch (e) { box.textContent = ""; box.append(mk("p", "muted", "โหลดหอเกียรติยศไม่สำเร็จ ลองใหม่อีกครั้ง")); console.error("fame", e); }
}


/* =========================================================
   31) 💰 ค่าหัว (bounty)  +  ⚡ เหตุการณ์ใหญ่ทั้งเซิร์ฟเวอร์
   ค่าหัว: bounty/{เป้าหมาย} = {by,bn,tn,ts,kb?} อยู่ได้ 90 นาที ตั้งได้ทุก 15 นาที (bountyBy)
   เหตุการณ์: คำนวณจากวัน+ลำดับ (rdHash) ทุกเครื่องได้ตารางเดียวกัน ไม่ต้องมีเซิร์ฟเวอร์/rules
   ========================================================= */
const BTY_LIFE = 5400000, BTY_CD = 900000;
state.bounty = state.bounty || {};
const bountyActive = (b, now = serverNow()) => !!b && typeof b.ts === "number" && now - b.ts < BTY_LIFE && !b.kb;
const bountyOn = (uid) => bountyActive(state.bounty?.[uid]);
async function bountyPlace(uid, name) {
  const p = state.profile; if (!p || p.hp <= 0 || uid === state.uid) return;
  if (bountyOn(uid)) return toast(`${name} มีค่าหัวอยู่แล้ว`);
  const left = BTY_CD - (serverNow() - LS.get(lsKey("btyat"), 0));
  if (left > 0) return toast(`ตั้งค่าหัวได้อีกครั้งใน ~${Math.ceil(left / 60000)} นาที`);
  if (!confirm(`ตั้งค่าหัว ${name}? ทุกคนจะได้ยินทางวิทยุ และค่าหัวอยู่ 90 นาที (คนที่ล้มเขาได้จะได้แต้มนักล่าค่าหัว)`)) return;
  try {
    await update(ref(db), { [`bounty/${uid}`]: { by: state.uid, bn: p.username, tn: name, ts: serverTimestamp() }, [`bountyBy/${state.uid}`]: { ts: serverTimestamp() } });
    LS.set(lsKey("btyat"), serverNow()); achBump("btyset", 1); toast(`💰 ตั้งค่าหัว ${name} แล้ว`);
  } catch (e) { toast(String(e?.code || e).includes("PERMISSION_DENIED") ? "ตั้งไม่ได้ — เป้าหมายมีค่าหัวอยู่ หรือคุณเพิ่งตั้งไป" : errMsg(e)); }
}
// ใส่ลงในคำสั่งอัปเดตตอนฆ่า: บอกว่าใครเก็บค่าหัว (rules ตรวจว่าเป้าหมาย HP=0 จริง และชื่อผู้ฆ่ามีอยู่จริง)
function bountyKillWrite(u, targetUid, killerName) {
  if (bty2On()) return;   // ค่าหัวใหม่: ฟังก์ชันเซิร์ฟเวอร์จ่ายเอง (bty2Claim)
  const b = state.bounty?.[targetUid]; if (!bountyActive(b) || !killerName || b.bn === killerName) return;
  u[`bounty/${targetUid}/kb`] = String(killerName).slice(0, 16);
}
function bountyListen() {
  if (state.btyOn || !state.uid) return; state.btyOn = true;
  let first = true; const seen = {};
  onValue(ref(db, "bounty"), (snap) => {
    const all = snap.val() || {}, now = serverNow(), fresh = [];
    state.bounty = all;
    Object.entries(all).forEach(([uid, b]) => {
      if (!b || typeof b.ts !== "number") return;
      const key = `${b.ts}`, was = seen[uid] || {}, live = !first;
      if (was.ts !== key && now - b.ts < BTY_LIFE) {
        if (!(first && now - b.ts > 1800000)) fresh.push({ ts: b.ts, live, t: uid === state.uid ? `💰 ${b.bn} ประกาศค่าหัวบนตัวคุณ! ระวังตัวไว้ 90 นาที` : `💰 ${b.bn} ประกาศค่าหัว ${b.tn} — ใครล้มเขาได้ รับแต้มนักล่าค่าหัว!` });
      }
      if (b.kb && !was.kb && now - b.ts < BTY_LIFE + 600000) {
        if (!(first && now - b.ts > 1800000)) fresh.push({ ts: Math.max(b.ts, now - 1), live, t: `🎯 ${b.kb} เก็บค่าหัวของ ${b.tn} ได้สำเร็จ (ผู้ตั้ง: ${b.bn})` });
        const flag = lsKey("btykb_" + uid + "_" + b.ts);
        if (!first && b.kb === state.profile?.username && !LS.get(flag, 0)) { LS.set(flag, 1); achBump("bty", 1); questBump("btyok"); toast(`💰 เก็บค่าหัว ${b.tn} สำเร็จ!`); }
      }
      seen[uid] = { ts: key, kb: !!b.kb };
    });
    fresh.sort((a, b) => a.ts - b.ts).forEach((f) => radioPush(`📻 [วิทยุ] ${f.t}`, f.ts, f.live));
    first = false;
    document.querySelectorAll(".bty-btn").forEach(() => { /* ปุ่มอัปเดตเมื่อเปลี่ยนโซน/รายชื่อ */ });
    try { if (state.psnap) renderPlayers(state.psnap); worldRefresh(); } catch { /* ข้าม */ }
  }, (er) => console.warn("bounty", er?.code || er));
}
function bountyWorldRows(box) {
  box.append(mk("div", "hub-day", "💰 ค่าหัวตอนนี้"));
  const now = serverNow(), list = Object.entries(state.bounty || {}).filter(([, b]) => b && typeof b.ts === "number" && now - b.ts < BTY_LIFE).sort((a, b) => b[1].ts - a[1].ts);
  if (!list.length) return box.append(mk("div", "muted", "ยังไม่มีใครถูกตั้งค่าหัว — กดปุ่ม 💰 ที่รายชื่อผู้เล่นเพื่อตั้ง"));
  list.forEach(([uid, b]) => {
    const row = mk("div", "world-row"), mins = Math.max(1, Math.ceil((BTY_LIFE - (now - b.ts)) / 60000));
    row.append(mk("div", "", b.kb ? `🎯 ${b.tn} ถูก ${b.kb} เก็บค่าหัวแล้ว` : `💰 ${b.tn}${uid === state.uid ? " (คุณ!)" : ""}`), mk("div", "muted", b.kb ? `ผู้ตั้ง: ${b.bn}` : `ตั้งโดย ${b.bn} • เหลือ ~${mins} นาที`));
    box.append(row);
  });
}

/* ---- เหตุการณ์ใหญ่ ---- */
const EVT_TYPES = {
  air: { icon: "🪂", name: "เครื่องบินทิ้งเสบียง", say: (z) => `เครื่องบินขนส่งทิ้งเสบียงลงที่${z}! ค้นหาที่นั่นตอนนี้จะเจอของดีกว่าปกติ`, end: (z) => `เสบียงที่${z}ถูกเก็บจนเกลี้ยงแล้ว`, tip: "ค้นหาในโซนนี้เจอของมากขึ้น ของหายากออกง่ายขึ้น" },
  horde: { icon: "🧟‍♂️", name: "ฝูงซอมบี้บุก", say: (z) => `มีรายงานฝูงซอมบี้ใหญ่เคลื่อนเข้าสู่${z}! ระวังตัวให้ดี (ซอมบี้: กลิ่นเลือดฟุ้ง เนื้อเน่าออกเยอะ)`, end: (z) => `ฝูงซอมบี้ที่${z}สลายตัวแล้ว`, tip: "มนุษย์: เจอซอมบี้บ่อยขึ้น • ซอมบี้: เนื้อเน่าออกเยอะขึ้น" },
  blackout: { icon: "🔌", name: "ไฟดับฉุกเฉิน", say: (z) => `ไฟสำรองของ${z}ดับทั้งอาคาร! ในความมืดของหายากโผล่ง่ายขึ้น แต่ก็มีอะไรเคลื่อนไหวอยู่ด้วย`, end: (z) => `ไฟสำรองของ${z}กลับมาติดแล้ว`, tip: "ของหายากออกง่ายมาก • มนุษย์: ซอมบี้โผล่บ่อยขึ้น" }
};
const EVT_DUR = 30 * 60000, EVT_PER_DAY = 3;
function evtOf(day, i) {
  const dayStart = day * COOP_DAY_MS - COOP_TZ, zl = Object.keys(ZONES).filter((z) => z !== "safe");
  const start = dayStart + (8 + i * 5) * 3600000 + (rdHash("evs", day, i) % (4 * 3600000));
  const zone = zl[rdHash("evz", day, i) % zl.length], type = zone === "lab" && (rdHash("evb", day, i) >>> 9) % 2 ? "blackout" : rdHash("evt", day, i) % 2 ? "air" : "horde";   // ไฟดับเกิดเฉพาะศูนย์วิจัย (สลับกับเหตุการณ์เดิม) — โซนอื่นตารางเดิมไม่เปลี่ยน
  return { key: `e${day}_${i}`, type, zone, start, end: start + Math.max(5, Math.min(180, T("evt_dur", 30))) * 60000 };
}
function evtList(now = serverNow()) {
  const d = coopDay(now), out = [];
  if (T("evt_on", 1)) for (const dd of [d - 1, d, d + 1]) for (let i = 0; i < EVT_PER_DAY; i++) out.push(evtOf(dd, i));
  for (const [k, f] of Object.entries(state.evtForce || {})) if (f && typeof f.start === "number" && typeof f.end === "number" && EVT_TYPES[f.type] && ZONES[f.zone] && f.zone !== "safe") out.push({ key: "x" + k, type: f.type, zone: f.zone, start: f.start, end: f.end });   // เจ้าของสั่งเอง: ทำงานแม้ปิดตารางอัตโนมัติ
  return out;
}
const evtActive = (now = serverNow()) => evtList(now).filter((e) => now >= e.start && now < e.end);
const evtHere = (zone = state.zone, now = serverNow()) => evtActive(now).find((e) => e.zone === zone) || null;
function evtTable(t, isZ) {
  const e = evtHere(); if (!e) return t;
  const em = (f) => Math.pow(f, Math.max(0, T("evt_str", 100)) / 100);   // ความแรงเหตุการณ์ปรับได้ (100 = ค่าเดิม, 0 = ไม่มีผล)
  if (e.type === "blackout") return t.map((d) => d.id === null ? { ...d, w: d.w * em(0.8) } : d.id === "boss" ? d : d.id === "zombie" ? (isZ ? d : { ...d, w: d.w * em(1.7) }) : d.id === "rotten_meat" ? d : d.w <= 5 ? { ...d, w: d.w * em(1.9) } : d);
  if (e.type === "air") return t.map((d) => d.id === null ? { ...d, w: d.w * em(0.4) } : (d.id === "zombie" || d.id === "boss") ? d : d.w <= 5 ? { ...d, w: d.w * em(2.2) } : { ...d, w: d.w * em(1.3) });
  return t.map((d) => isZ ? (d.id === "rotten_meat" ? { ...d, w: d.w * em(2.5) } : d.id === null ? { ...d, w: d.w * em(0.6) } : d) : (d.id === "zombie" ? { ...d, w: d.w * em(2) } : d.id === null ? { ...d, w: d.w * em(0.7) } : d));
}
function evtSearchHook() { const e = evtHere(); if (e) { achBump("evt", 1); stat("evt"); } }
function evtTick() {
  if (!state.profile || !state.ach?.loaded) return;
  const now = serverNow(), say = (k, text) => { if (LS.get(lsKey("evt_" + k), 0)) return; LS.set(lsKey("evt_" + k), 1); radioPush(`📻 [วิทยุฉุกเฉิน] ${text}`, now, true); };
  evtList(now).forEach((e) => {
    const T = EVT_TYPES[e.type], zn = ZONES[e.zone]?.name || e.zone;
    if (now >= e.start && now < e.end) say("s" + e.key, `${T.icon} ${T.say(zn)} (เหลือ ~${Math.max(1, Math.ceil((e.end - now) / 60000))} นาที)`);
    else if (now >= e.end && now < e.end + 600000) { if (LS.get(lsKey("evt_s" + e.key), 0)) say("e" + e.key, `${T.icon} ${T.end(zn)}`); }
  });
  try { const hm = $("hub-modal"); if (hm && !hm.classList.contains("hidden") && hm.dataset.tab === "world") worldRefresh(); } catch { /* ข้าม */ }
}
function evtWorldRows(box) {
  box.append(mk("div", "hub-day", "⚡ เหตุการณ์ใหญ่"));
  if (!T("evt_on", 1) && !evtActive(serverNow()).length) return box.append(mk("div", "muted", "เหตุการณ์ใหญ่ปิดอยู่ชั่วคราว"));
  const now = serverNow(), act = evtActive(now), nxt = evtList(now).filter((e) => e.start > now).sort((a, b) => a.start - b.start)[0];
  if (!act.length && !nxt) return;
  act.forEach((e) => { const T = EVT_TYPES[e.type], row = mk("div", "world-row evt-live"); row.append(mk("div", "", `${T.icon} ${T.name} • ${ZONES[e.zone]?.name || e.zone}`), mk("div", "muted", `${T.tip} • เหลือ ~${Math.max(1, Math.ceil((e.end - now) / 60000))} นาที${state.zone === e.zone ? " • คุณอยู่ที่นี่!" : ""}`)); box.append(row); });
  if (!act.length && nxt) { const m = Math.ceil((nxt.start - now) / 60000), row = mk("div", "world-row"); row.append(mk("div", "muted", `ยังไม่มีเหตุการณ์ตอนนี้ — รอบถัดไปในอีก ${m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} นาที` : `${m} นาที`} (ไม่บอกล่วงหน้าว่าที่ไหน ฟังวิทยุไว้)`)); box.append(row); }
}


/* =========================================================
   35) 🌦️ สภาพอากาศ + 🔊 เสียงดึงซอมบี้ + ข้อความบรรยายสมจริง
   - อากาศคำนวณจากเวลาเซิร์ฟเวอร์ (rdHash) ทุกเครื่องเห็นตรงกัน ไม่ต้องมีข้อมูลใหม่ • เปลี่ยนทุก ~50 นาที (ต่อเนื่องได้) • เจ้าของสั่งทับได้ที่ wxForce/
   - ผล: ฝน = น้ำเจอง่าย แต่เดินทางเหนื่อย / หมอก = ซอมบี้มาก มองโอกาสไม่ชัด / พายุ = ซอมบี้มาก เดินทางหนัก ค้นหาเสี่ยง
   - เสียง: คนอยู่รวมกันในโซน + ข้อความต่อสู้ใน 90 วิ ล่าสุด → น้ำหนักซอมบี้เพิ่ม (ไม่ใช่ Safe Zone) — คำนวณฝั่งเครื่อง ไม่แตะ rules
   - ปรับได้จากแท็บ 🎛️: wx_on, wx_str, noise_str
   ========================================================= */
const WX_BLOCK = 50 * 60000, NZ_WINDOW = 90000;
const WX = {
  clear: { icon: "🌤️", name: "ฟ้าโปร่ง", z: 1, w: 1, n: 1, t: 0, d: 0 },
  rain: { icon: "🌧️", name: "ฝนตก", z: 1, w: 2.5, n: 1, t: 3, d: 0 },
  fog: { icon: "🌫️", name: "หมอกลง", z: 1.4, w: 1, n: 1, t: 0, d: 1 },
  storm: { icon: "⛈️", name: "พายุ", z: 1.5, w: 1.8, n: 1.15, t: 5, d: 2 }
};
const WX_TIP = {
  clear: "ทัศนวิสัยดี ไม่มีผลพิเศษ",
  rain: "เจอน้ำสะอาดง่ายขึ้น • เดินทางเหนื่อยกว่าเดิม (+พลังงาน)",
  fog: "ซอมบี้ชุกขึ้น • มองไม่ชัดว่าเสี่ยงแค่ไหน (โอกาสเจอซอมบี้แสดงเป็นช่วง)",
  storm: "ซอมบี้ชุกมาก • อันตรายเพิ่ม • เดินทางหนักมาก • แต่ฝนก็เก็บน้ำได้เยอะ"
};
function wxBase(b) {
  if (rdHash("wxk", b) % 100 < 35) b--;   // 35% ต่อเนื่องจากช่วงก่อน → อากาศมีช่วงยาวบ้างสั้นบ้าง
  const phase = (b * WX_BLOCK) % DAY_CYCLE, r = rdHash("wx", b) % 100;
  if (phase < 10 * 60000 && r < 12) return "fog";   // รุ่งสางหมอกลงบ่อย
  return r < 48 ? "clear" : r < 75 ? "rain" : r < 90 ? "fog" : "storm";
}
const wxAt = (t) => wxBase(Math.floor(t / WX_BLOCK));
function wxForced(now = serverNow()) {
  let best = null;
  for (const f of Object.values(state.wxForce || {})) if (f && WX[f.type] && typeof f.start === "number" && typeof f.end === "number" && now >= f.start && now < f.end && (!best || f.start > best.start)) best = f;
  return best;
}
function wxNow(now = serverNow()) {
  const f = wxForced(now);
  if (f) return { type: f.type, forced: true, end: f.end };
  if (!T("wx_on", 1)) return { type: "clear", forced: false, end: now + WX_BLOCK };
  const b = Math.floor(now / WX_BLOCK), ty = wxAt(now);
  let k = 1; while (k < 8 && wxBase(b + k) === ty) k++;
  return { type: ty, forced: false, end: (b + k) * WX_BLOCK };
}
const wxScale = () => Math.max(0, T("wx_str", 100)) / 100;
const wxTravelExtra = (z) => { const w = WX[wxNow().type]; return w && w.t ? Math.round(w.t * wxScale()) : 0; };
const wxDmod = (z) => { if (isPeace(z)) return 0; const w = WX[wxNow().type]; return w && w.d ? Math.round(w.d * wxScale()) : 0; };
// เสียงดัง: จำนวนคนในโซน (ไม่นับตัวเองที่โซนปัจจุบัน) + ข้อความต่อสู้ในโซนนี้ภายใน 90 วิ
function noiseInfo(z) {
  if (isPeace(z)) return { lvl: 0, mul: 1, others: 0, fights: 0 };
  const cnt = z === state.zone ? Object.keys(state.players || {}).length - 1 : (state.zcount?.[z] || 0), others = Math.max(0, cnt);
  const now = serverNow(), fights = (state.nzCombat || []).filter((x) => x.z === z && now - x.t < NZ_WINDOW).length;
  const raw = Math.min(0.35, 0.08 * others) + Math.min(0.25, 0.1 * fights), mul = 1 + raw * Math.max(0, T("noise_str", 100)) / 100;
  return { lvl: raw < 0.1 ? 0 : raw < 0.3 ? 1 : 2, mul, others, fights };
}
function nzNote(m) {   // addChat เรียกตอนมีข้อความต่อสู้
  if (!m || m.type !== "combat" || typeof m.ts !== "number" || serverNow() - m.ts > NZ_WINDOW) return;
  const a = (state.nzCombat = (state.nzCombat || []).filter((x) => serverNow() - x.t < NZ_WINDOW)); a.push({ z: state.zone, t: m.ts }); if (a.length > 40) a.shift();
}
function wxNzDrops(z, d) {
  const wt = WX[wxNow().type], s = wxScale(), nz = noiseInfo(z).mul, safe = isPeace(z);
  const zf = safe ? 1 : Math.pow(wt.z, s) * nz, wf = Math.pow(wt.w, s), nf = safe ? 1 : Math.pow(wt.n, s);
  if (zf === 1 && wf === 1 && nf === 1) return d;
  return d.map((x) => x.id === "zombie" && zf !== 1 ? { ...x, w: x.w * zf } : x.id === "water" && wf !== 1 ? { ...x, w: x.w * wf } : x.id === null && nf !== 1 ? { ...x, w: x.w * nf } : x);
}
/* ---- ข้อความบรรยาย ---- */
const LEAD = {
  clear: ["คุณค้นหา…", "คุณรื้อไปตามซอกมุม…", "คุณคุ้ยหาอย่างระวังตัว…", "คุณกวาดตามองหาของใช้…", "คุณเปิดลิ้นชักและกองเศษซาก…"],
  rain: ["สายฝนเปียกโชกขณะคุณคุ้ยหา…", "น้ำฝนหยดลงคอเสื้อ คุณยังคุ้ยต่อ…", "เสียงฝนกลบเสียงฝีเท้า คุณค้นหา…", "พื้นลื่นเป็นเลน คุณก้มลงคลำหา…"],
  fog: ["หมอกหนาจนมองไม่เห็นปลายเท้า คุณคลำหา…", "ในหมอกขาวคุณคลำทางค้นหา…", "เงาอะไรบางอย่างขยับในหมอก… คุณรีบค้นหา…"],
  storm: ["ฟ้าผ่าวาบ! คุณรีบคุ้ยหา…", "ลมพายุหวีดหวิว คุณฝืนค้นหา…", "สายฝนสาดแรงจนลืมตาไม่ขึ้น คุณควานหา…"],
  night: ["ในความมืดคุณคลำหา…", "แสงริบหรี่ คุณค้นหาอย่างเงียบที่สุด…", "คุณกลั้นหายใจแล้วคุ้ยหา…"],
  dawn: ["แสงแรกส่องให้เห็นของเล็กน้อย คุณค้นหา…"],
  dusk: ["แสงกำลังจะหมด คุณรีบค้นหา…"],
  loud: ["เสียงเอะอะแถวนี้อาจดึงพวกมันมา… คุณรีบค้นหา…", "คุณรู้สึกว่ามีเสียงดังเกินไป แต่ก็ยังค้นหา…"],
  quiet: ["ทุกอย่างเงียบสนิท คุณค้นหาโดยไม่มีใครรบกวน…"]
};
const LEAD_EMPTY = {
  clear: ["คุณค้นหา… ไม่เจออะไรเลย", "คุณค้นหา… ไม่เจออะไรเลย มีแต่ฝุ่นกับซาก"],
  rain: ["คุณค้นหา… น้ำฝนชะล้างทุกอย่างหายไปหมด ไม่เจออะไรเลย", "คุณค้นหา… ของเปียกเละใช้การไม่ได้ ไม่เจออะไรเลย"],
  fog: ["คุณค้นหา… มองไม่เห็นอะไรในหมอก ไม่เจออะไรเลย"],
  storm: ["คุณค้นหา… ลมพายุพัดของปลิวไปหมด ไม่เจออะไรเลย"]
};
const AMB_WX = {
  rain: ["เสียงฝนกระทบสังกะสีดังเป็นจังหวะ ท่วงทำนองเดียวที่ยังเหลืออยู่", "ท่อระบายน้ำเอ่อล้น น้ำสีน้ำตาลไหลผ่านรองเท้า", "กลิ่นดินเปียกปนกลิ่นเน่า ลอยมาตามสายฝน", "ฝนเย็นเฉียบซึมเข้าแผลเก่าจนแสบ"],
  fog: ["หมอกกลืนตึกทั้งแถบจนเหลือแต่เงาเลือนราง", "เสียงครางไกล ๆ ในหมอก… ไม่รู้ทิศทาง", "ความชื้นเกาะเต็มขนตา ทุกอย่างเป็นสีเทา", "ได้ยินเสียงฝีเท้าลากเบา ๆ แต่ไม่เห็นใคร"],
  storm: ["ฟ้าร้องก้องเมืองร้าง สะเทือนไปถึงอก", "ป้ายโลหะบนตึกเหวี่ยงปะทะกันเสียงดังลั่น", "สายฟ้าฟาดไกล ๆ แสงขาววาบเผยเงาคนเดินเป็นแถว… แล้วก็มืดอีกครั้ง", "ลมกระชากจนต้องเกาะกำแพงไว้"],
  clear: ["ท้องฟ้าโปร่งจนเห็นควันไฟจากไกล ๆ ลอยเป็นเส้น"]
};
const AMB_NZ = ["เสียงพูดคุยดังไปทั่วซอย… ถ้ามีอะไรได้ยินก็คงมาเร็ว", "คุณรู้สึกเหมือนมีสายตามองมาจากที่มืด ๆ"];
const WX_RADIO = {
  clear: ["ฟ้าเริ่มเปิด เมฆจางลง ทัศนวิสัยดีขึ้น", "ท้องฟ้าโปร่งแล้ว แต่อย่าประมาท"],
  rain: ["ฝนเริ่มตกทั่วเมือง ใครขาดน้ำสะอาดนี่คือโอกาส แต่ทางเดินจะลื่นและเหนื่อยกว่าเดิม", "ฝนกำลังเทลงมา ระวังพื้นลื่นระหว่างเดินทาง"],
  fog: ["หมอกหนาลงปกคลุมเมือง มองได้ไม่ไกล ระวังซอมบี้ที่โผล่มากะทันหัน", "รายงานหมอกจัด ทัศนวิสัยต่ำมาก ซอมบี้อาจเข้าใกล้โดยไม่รู้ตัว"],
  storm: ["เตือนพายุเข้า! ฟ้าผ่าและฝนตกหนัก ค้นหาข้างนอกเสี่ยงกว่าปกติ หาที่หลบถ้าทำได้", "พายุรุนแรงกำลังเข้าเมือง ฝูงซอมบี้จะเคลื่อนไหวมากขึ้นในเสียงฟ้าร้อง"]
};
function wxFlavor(kind) {   // kind: "lead" | "empty" | "amb"
  const w = wxNow().type, ts = timeSlot(), ni = isPeace(state.zone) ? { lvl: 0 } : noiseInfo(state.zone), pool = [];
  const add = (a, n) => { if (a) for (let i = 0; i < n; i++) pool.push(...a); };
  if (kind === "empty") { add(LEAD_EMPTY[w] || LEAD_EMPTY.clear, 3); add(LEAD_EMPTY.clear, 1); }
  else if (kind === "amb") { add(AMB_WX[w], w === "clear" ? 1 : 4); if (ni.lvl >= 2) add(AMB_NZ, 3); }
  else {
    add(LEAD.clear, w === "clear" && ts === "day" ? 3 : 1);
    if (w !== "clear") add(LEAD[w], 4);
    if (ts !== "day") add(LEAD[ts], ts === "night" ? 3 : 2);
    if (ni.lvl >= 2) add(LEAD.loud, 3); else if (state.zone !== "safe" && ni.lvl === 0 && ni.others === 0) add(LEAD.quiet, 1);
  }
  if (kind !== "empty") { try { add(fxPool(kind), 2); } catch { /* ข้าม */ } }
  const fresh = pool.filter((t) => t !== state["wxL" + kind]), L = fresh.length ? fresh : pool, t = L[Math.floor(Math.random() * L.length)] || "คุณค้นหา…";
  state["wxL" + kind] = t; return t;
}
const srchLead = () => wxFlavor("lead");
const srchEmpty = () => wxFlavor("empty");
/* ---- แสดงผล ---- */
function wxStyle() {
  if ($("wx-style")) return;
  const st = document.createElement("style"); st.id = "wx-style";
  st.textContent = ".time-line.wx{opacity:.95}.chat-head #zone-weather{font-size:12px;margin:1px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chat-head.open #zone-weather{white-space:normal}"
    + ".nz-chip{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;background:rgba(255,255,255,.08);font-size:.9em}";
  document.head.append(st);
}
function wxRender(zArg) {
  const tEl = $("zone-time"); if (!tEl) return;
  wxStyle();
  let el = $("zone-weather"); if (!el) { el = mk("p", "time-line wx"); el.id = "zone-weather"; tEl.after(el); }
  const w = wxNow(), W = WX[w.type], z = zArg || state.zone, mins = Math.max(1, Math.ceil((w.end - serverNow()) / 60000));
  const ni = z && z !== "safe" ? noiseInfo(z) : null;
  const nz = ni ? (ni.lvl >= 2 ? " • 🔊 เสียงดัง ซอมบี้ได้ยิน" : ni.lvl === 1 ? " • 🔉 ค่อนข้างเสียงดัง" : " • 🤫 เงียบ") : "";
  el.textContent = `${W.icon} ${W.name}${w.forced ? " (ฟ้าลิขิต)" : ""} — ${w.type === "clear" ? "" : `อีก ~${mins} นาทีจะเปลี่ยน`}${nz}`.replace(/ — (?= •|$)/, "");
  el.title = `${W.name}: ${WX_TIP[w.type]}${ni ? ` • คนอื่นในโซน ${ni.others} • การต่อสู้ล่าสุด ${ni.fights} • ซอมบี้ ×${ni.mul.toFixed(2)} จากเสียง` : ""}`;
}
let wxSeen = null;
function wxTick() {
  if (!state.profile) return;
  const w = wxNow();
  if (wxSeen !== null && wxSeen !== w.type) {
    const L = WX_RADIO[w.type], line = L[rdHash("wxr", Math.floor(serverNow() / WX_BLOCK)) % L.length];
    radioPush(`📻 [พยากรณ์อากาศ] ${WX[w.type].icon} ${line}`, serverNow(), true);
    try { logLine(`${WX[w.type].icon} ${WX[w.type].name} — ${WX_TIP[w.type]}`, "info"); } catch { /* ข้าม */ }
  }
  wxSeen = w.type;
  try { wxRender(); if (state.zone) renderZoneDanger(state.zone); } catch { /* ข้าม */ }
}
function wxWorldRows(box) {
  box.append(mk("div", "hub-day", "🌦️ สภาพอากาศ"));
  const now = serverNow(), w = wxNow(now), W = WX[w.type], row = mk("div", "world-row evt-live");
  row.append(mk("div", "", `${W.icon} ${W.name}${w.forced ? " (กำหนดโดยเจ้าของ)" : ""} • ${WX_TIP[w.type]}`), mk("div", "muted", w.type === "clear" ? "ฟ้าโปร่งต่อไปอีกสักพัก" : `เปลี่ยนในอีก ~${Math.max(1, Math.ceil((w.end - now) / 60000))} นาที`));
  box.append(row);
  const nx = []; for (let t = w.end, i = 0; i < 3; i++) { const ty = wxNow(t).type; nx.push(`${WX[ty].icon} ${WX[ty].name}`); t += WX_BLOCK; }
  if (!w.forced && T("wx_on", 1)) box.append(mk("div", "muted", "ช่วงถัดไปคาดว่า: " + nx.join(" → ")));
  if (state.zone && state.zone !== "safe") { const ni = noiseInfo(state.zone); box.append(mk("div", "muted", `🔊 เสียงในโซนนี้: ${ni.lvl >= 2 ? "ดังมาก" : ni.lvl === 1 ? "พอได้ยิน" : "เงียบ"} (คนอื่น ${ni.others} • ต่อสู้ล่าสุด ${ni.fights}) — ซอมบี้ ×${ni.mul.toFixed(2)} ถ้าอยากเงียบให้แยกกันค้นคนละโซน`)); }
}
function wxListen() {
  if (state.wxOn || !state.uid) return; state.wxOn = true; state.wxForce = {};
  onValue(ref(db, "wxForce"), (snap) => { state.wxForce = snap.val() || {}; try { wxTick(); worldRefresh(); } catch { /* ข้าม */ } }, (e) => console.warn("wxForce", e?.code || e));
  wxTick(); setInterval(wxTick, 10000);
}
function wxForceRows(box) {
  box.append(mk("div", "hub-day", "🌦️ สั่งอากาศ (เจ้าของ)"));
  box.append(mk("div", "muted", "ทุกเครื่องเปลี่ยนตรงกันทันที พร้อมประกาศวิทยุ — ใช้เปิดฉากเนื้อเรื่อง เช่นสั่งพายุ"));
  const row = mk("div", "world-row tune-row"), ctl = mk("div", "tune-ctl");
  const ty = mk("select"); Object.entries(WX).forEach(([k, v]) => { const o = mk("option", "", `${v.icon} ${v.name}`); o.value = k; ty.append(o); });
  const mins = mk("input"); mins.type = "number"; mins.min = 5; mins.max = 180; mins.value = 30; mins.inputMode = "numeric";
  const go = btn("🚀 เปลี่ยนเลย", async () => {
    const m = Math.round(Number(mins.value)); if (!(m >= 5 && m <= 180)) return toast("ใส่เวลา 5–180 นาที");
    const now = serverNow(), k = "w" + now.toString(36);
    try { await set(ref(db, "wxForce/" + k), { type: ty.value, start: now, end: now + m * 60000 }); toast("เปลี่ยนอากาศแล้ว"); } catch (e) { toast(errMsg(e)); }
  }, "btn primary mini");
  ctl.append(ty, mins, mk("span", "muted", "นาที"), go); row.append(ctl); box.append(row);
  const now = serverNow();
  Object.entries(state.wxForce || {}).filter(([, f]) => f && f.end > now).forEach(([k, f]) => {
    const r = mk("div", "world-row"), W = WX[f.type];
    r.append(mk("div", "", `${W?.icon || "🌦️"} ${W?.name || f.type}`), mk("div", "muted", `${f.start > now ? "เริ่มอีก" : "เหลือ"} ~${Math.max(1, Math.ceil(((f.start > now ? f.start : f.end) - now) / 60000))} นาที`));
    r.append(btn("หยุดตอนนี้", async () => { try { await update(ref(db, "wxForce/" + k), { end: Math.max(f.start + 1, serverNow()) }); toast("หยุดแล้ว"); } catch (e) { toast(errMsg(e)); } }, "btn danger mini"));
    box.append(r);
  });
  Object.entries(state.wxForce || {}).forEach(([k, f]) => { if (f && f.end < now - 86400000) remove(ref(db, "wxForce/" + k)).catch(() => {}); });
}

/* =========================================================
   36) 🎆 เทศกาลตามปฏิทิน • 🛩️ คลังลับ • 🤝 ภารกิจเคียงข้าง • 🧭 เส้นทางอาชีพ • ⭐ ตลาด "ของที่ตามหา"
   - ไม่ต้องแก้ rules: ทุกอย่างคำนวณจากเวลาเซิร์ฟเวอร์ (rdHash/ปฏิทิน/ดวงจันทร์) ทุกเครื่องเห็นตรงกัน
     ตัวนับส่วนตัวใช้ ach/{uid}/c เดิม • ค่าปรับแต่งใช้ tune/ เดิม • ผลตอบแทนเป็น "น้ำหนักของที่เจอ/ลดความเสียหายสถานะ" ฝั่งเกม
     (ไม่เสกไอเทมนอกทางเดิมของ rules: ของที่ได้ยังมาจากตารางค้นหาของโซนเท่านั้น)
   - ปรับได้จากแท็บ 🎛️: fest_on, fest_str, fest_force, site_on, site_pc, site_str, duo_on, duo_min, career_on
   ========================================================= */
const FXM = new Map();   // เก็บในหน่วยความจำด้วย เผื่อเบราว์เซอร์บล็อก localStorage (โหมดส่วนตัว)
const fxGet = (k, d) => { const kk = lsKey(k); return FXM.has(kk) ? FXM.get(kk) : LS.get(kk, d); };
const fxSet = (k, v) => { const kk = lsKey(k); FXM.set(kk, v); LS.set(kk, v); };
const FX_MOON_REF = 947182440000, FX_MOON_SYN = 29.530588853 * 86400000;   // จันทร์ดับ 6 ม.ค. 2000 18:14 UTC • คาบ 29.53 วัน
const fxMoonAge = (t) => { let a = (t - FX_MOON_REF) % FX_MOON_SYN; if (a < 0) a += FX_MOON_SYN; return a / 86400000; };
const fxMoon = (t) => { const a = fxMoonAge(t); return a < 0.9 || a > 28.63 ? "new" : Math.abs(a - 14.77) < 0.9 ? "full" : ""; };
const fxDate = (t) => { const d = new Date(t + COOP_TZ); return { m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
const FX_METEOR = [[1, 3, 4], [4, 22, 23], [5, 6, 7], [8, 12, 13], [10, 21, 22], [11, 17, 18], [12, 13, 14]];   // ฝนดาวตกจริงตามปฏิทิน (เดือน, วันเริ่ม, วันจบ)
const FX_FOOD = new Set(["canned_food", "bread", "fruit", "army_meal", "soup", "choco_bar", "super_ration"]);
// m: z/n/r/f/w/a/rm = ตัวคูณน้ำหนัก (ซอมบี้/ไม่เจออะไร/ของหายาก/อาหาร/น้ำ/ทุกอย่าง/เนื้อเน่า) • dm = อันตราย (บวก/ลบ) • night = มีผลเฉพาะ "กลางคืนในเกม"
const FEST = [
  { id: "newmoon", icon: "🌑", name: "คืนเดือนมืด", night: 1, on: (t) => fxMoon(t) === "new", m: { z: 1.15, r: 1.5, dm: 1 }, tip: "มืดสนิท อันตราย +1 ซอมบี้ชุกขึ้น แต่ของหายากโผล่มากขึ้นตอนกลางคืน", say: "คืนนี้เดือนมืดสนิท ไฟฉายแทบไม่ช่วยอะไร ใครกล้าออกไปอาจเจอของดี แต่ก็เจอของไม่ดีเช่นกัน",
    lead: ["ความมืดสนิทจนมือตัวเองยังมองไม่เห็น คุณคลำหา…", "ไร้แสงจันทร์ คุณค้นหาด้วยสัมผัสล้วน ๆ…"], amb: ["ไม่มีแสงจันทร์สักนิด ท้องฟ้าดำเหมือนถูกกลืนไป", "ดาวเต็มฟ้าเพราะไม่มีจันทร์กวนตา แต่พื้นดินมืดสนิท"] },
  { id: "fullmoon", icon: "🌕", name: "คืนจันทร์เต็มดวง", night: 1, on: (t) => fxMoon(t) === "full", m: { z: 0.9, n: 0.92, dm: -1 }, tip: "แสงจันทร์ช่วยมองเห็น อันตราย −1 ค้นหาง่ายขึ้นเล็กน้อยตอนกลางคืน", say: "จันทร์เต็มดวงส่องเมืองร้างสว่างกว่าปกติ ออกไปค้นหาตอนกลางคืนจะง่ายขึ้นหน่อย",
    lead: ["แสงจันทร์ส่องทางให้คุณค้นหา…", "เงาของคุณทอดยาวใต้จันทร์เต็มดวง คุณคุ้ยหา…"], amb: ["จันทร์เต็มดวงลอยเหนือซากตึก สว่างจนเห็นเงาของเศษแก้ว", "แสงจันทร์สีเงินทาบทับถนนว่างเปล่า สวยอย่างน่าขนลุก"] },
  { id: "meteor", icon: "🌠", name: "คืนฝนดาวตก", night: 1, on: (t) => { const d = fxDate(t); return FX_METEOR.some(([m, a, b]) => d.m === m && d.d >= a && d.d <= b); }, m: { r: 1.6 }, tip: "เศษซากจากฟ้าตกลงมาทั่วเมือง ของหายากเจอง่ายขึ้นมากตอนกลางคืน", say: "คืนนี้ฝนดาวตกพาดฟ้า! มีเสียงเศษอะไรตกลงมาไกล ๆ ใครออกค้นหาตอนมืดอาจโชคดี",
    lead: ["ดาวตกขีดผ่านฟ้า คุณละสายตาแล้วค้นหาต่อ…", "แสงวาบบนท้องฟ้าส่องให้เห็นของบนพื้น คุณรีบคว้า…"], amb: ["ดาวตกพาดผ่านท้องฟ้าเป็นเส้นสว่าง แล้วหายไปในความมืด", "เสียงบางอย่างตกลงห่างออกไป… เศษดาวหรือเศษเมือง ไม่มีใครรู้"] },
  { id: "songkran", icon: "💦", name: "สงกรานต์เมืองร้าง", on: (t) => { const d = fxDate(t); return d.m === 4 && d.d >= 13 && d.d <= 15; }, m: { w: 2, n: 0.9, dm: -1 }, tip: "ท่อประปาแตกทั่วเมือง น้ำเจอง่ายมาก อันตราย −1", say: "วันสงกรานต์ ท่อน้ำทั่วเมืองแตกระเบิดเหมือนสาดน้ำ ใครขาดน้ำรีบออกไปเก็บ",
    lead: ["น้ำกระเซ็นจากท่อแตก คุณเปียกทั้งตัวแต่ยังค้นหา…", "สายน้ำพุ่งจากท่อประปา คุณหลบแล้วคุ้ยต่อ…"], amb: ["ท่อประปาแตกพ่นน้ำขึ้นฟ้าเหมือนน้ำพุ", "เสียงน้ำไหลดังไปทั้งซอย บรรยากาศแปลกเหมือนเทศกาลที่ไร้ผู้คน"] },
  { id: "loy", icon: "🏮", name: "ลอยกระทงริมคลองร้าง", on: (t) => { const d = fxDate(t); return fxMoon(t) === "full" && (d.m === 11 || (d.m === 10 && d.d >= 26)); }, m: { w: 1.5, f: 1.2 }, tip: "ของลอยมาเกยตามริมน้ำ น้ำและอาหารเจอง่ายขึ้น", say: "คืนลอยกระทง กระทงเก่าลอยมาเกยฝั่งเต็มคลอง มีของกินของใช้ปนมาด้วย",
    lead: ["กระทงเก่าลอยเกยฝั่ง คุณก้มค้นหา…", "แสงจากกระทงริบหรี่ริมคลอง คุณคุ้ยหา…"], amb: ["กระทงเก่าลอยเอื่อยอยู่กลางคลองมืด ๆ", "กลิ่นธูปจาง ๆ ลอยมาตามลม ทั้งที่ไม่มีใครจุด"] },
  { id: "halloween", icon: "🎃", name: "คืนล่าผี", on: (t) => { const d = fxDate(t); return d.m === 10 && d.d === 31; }, m: { z: 1.3, r: 1.4, rm: 1.6, dm: 1 }, tip: "ซอมบี้คึกคักผิดปกติ อันตราย +1 แต่ของหายากและเนื้อเน่าก็เจอมากขึ้น", say: "คืนล่าผี ซอมบี้ทั้งเมืองคึกคักผิดปกติ ใครกล้าออกไปก็ได้ของดีติดมือกลับมา",
    lead: ["เสียงคราง ๆ ดังรอบตัว คุณกลั้นใจค้นหา…", "ทุกเงามีดวงตา คุณรีบคุ้ยหา…"], amb: ["โคมกะลามะพร้าวลอยอยู่กลางซอย ไม่มีใครรู้ว่าใครจุด", "เสียงหัวเราะแผ่ว ๆ ดังมาจากตึกร้าง… ไม่ควรเข้าไปเช็ก"] },
  { id: "harvest", icon: "🌾", name: "วันเก็บเกี่ยว", on: (t) => { const d = fxDate(t); return d.m === 11 && d.d >= 24 && d.d <= 26; }, m: { f: 1.8, n: 0.92 }, tip: "เสบียงที่ซ่อนไว้ถูกขุดขึ้นมา อาหารเจอง่ายขึ้นมาก", say: "วันเก็บเกี่ยว ผู้รอดชีวิตรื้อคลังที่ซ่อนไว้ออกมาตากแดด ของกินหาง่ายกว่าปกติ",
    lead: ["กลิ่นข้าวและผลไม้ตากแห้งลอยมา คุณค้นหา…", "แปลงผักร้างยังมีของให้เก็บ คุณก้มคุ้ย…"], amb: ["รวงข้าวป่าโยกไหวในลมเหมือนเมืองนี้ยังเป็นนา", "ฝูงนกลงจิกเมล็ดพืชบนถนนร้างอย่างไม่กลัวใคร"] },
  { id: "newyear", icon: "🎆", name: "ปีใหม่ผู้รอดชีวิต", on: (t) => { const d = fxDate(t); return (d.m === 12 && d.d === 31) || (d.m === 1 && d.d === 1); }, m: { a: 1.15, n: 0.85 }, tip: "ทุกคนแบ่งปันกัน ค้นหาเจอของง่ายขึ้นทุกโซน", say: "ปีใหม่แล้ว! เมืองนี้ยังอยู่ ผู้รอดชีวิตแบ่งปันกันมากกว่าปกติ ค้นหาแล้วคุ้มกว่าทุกวัน",
    lead: ["เสียงพลุจากที่ไกล ๆ คุณค้นหาด้วยใจฟู…", "ปีใหม่ทั้งที คุณขอลองโชคอีกสักรอบ…"], amb: ["พลุเล็ก ๆ ลูกหนึ่งสว่างวาบไกล ๆ ก่อนเงียบไป", "มีคนตะโกนอวยพรปีใหม่จากหลังคาตึก แล้วเสียงก็ขาดหาย"] }
];
const festForced = () => { const i = Math.round(T("fest_force", 0)); return i >= 1 && i <= FEST.length ? FEST[i - 1] : null; };
function festActive(t = serverNow()) {
  const out = T("fest_on", 1) ? FEST.filter((f) => { try { return f.on(t); } catch { return false; } }) : [];
  const fz = festForced(); if (fz && !out.includes(fz)) out.push(fz);
  return out;
}
// เทศกาลที่ "มีผลตอนนี้" (เฉพาะกลางคืนในเกมสำหรับงานที่ night:1)
const festLive = (t = serverNow()) => festActive(t).filter((f) => !f.night || isNight());
function festNext(f, t = serverNow()) {   // วันถัดไปที่เทศกาลนี้เริ่ม (ค้นล่วงหน้า 400 วัน) • null = ไม่พบ
  if (f.on(t)) return 0;
  for (let k = 1; k <= 400; k++) { if (f.on(t + k * 86400000)) return k; }
  return null;
}

/* ---- คลังลับ: ข่าวลือทางวิทยุ → ต้องออกค้นหาให้ถูกโซนในช่วงเวลา (ไม่บอกโซนตรง ๆ) ---- */
const SITE_SLOT = 3 * 3600000, SITE_LIVE = 100 * 60000;
const SITE_TYPES = [
  { id: "plane", icon: "🛩️", name: "ซากเครื่องบินขนส่ง", loot: ["medkit", "trauma_kit", "serum", "army_meal", "stim_shot", "energy_drink", "bandage", "antidote"], find: "เจอกล่องเวชภัณฑ์ที่กระเด็นออกจากซากเครื่องบิน" },
  { id: "truck", icon: "🚚", name: "รถขนเสบียงที่ถูกทิ้ง", loot: ["canned_food", "bread", "water_jug", "army_meal", "choco_bar", "water", "fruit", "soup"], find: "งัดท้ายรถขนเสบียงที่ถูกทิ้งไว้จนเจอลังอาหาร" },
  { id: "bunker", icon: "🚪", name: "บังเกอร์ลับ", loot: ["scrap", "chem", "pistol", "knife", "crowbar", "shotgun", "stim_shot", "fire_axe"], find: "ฝาเหล็กใต้พื้นเผยบังเกอร์เล็ก ๆ ที่ยังมีของเหลือ" }
];
const SITE_HINT = {
  ruins: "ตึกที่ถล่มครึ่งหนึ่ง กองเศษปูนสูงเป็นเนิน", mall: "ป้ายไฟห้างที่ยังกะพริบไม่ยอมดับ", hospital: "กลิ่นยาฆ่าเชื้อจาง ๆ ลอยมาตามลม", police: "เสียงไซเรนที่ไม่มีใครเปิด",
  lab: "ไอเย็นลอดขึ้นมาจากช่องระบายอากาศพื้นดิน มีป้ายเตือนสารชีวภาพผุพัง", forest: "ใต้ร่มไม้ที่แสงลอดไม่ถึง", factory: "เสียงเหล็กครูดจากเครื่องจักรสนิม", port: "กลิ่นเกลือและตู้คอนเทนเนอร์ที่ซ้อนกันสูง", base: "รั้วลวดหนามของค่ายทหารเก่า", tunnel: "ความมืดและอากาศอับชื้นใต้ดิน"
};
function siteOf(slot) {
  const zl = Object.keys(ZONES).filter((z) => z !== "safe");
  if (rdHash("sx", slot) % 100 >= Math.max(0, Math.min(100, T("site_pc", 60)))) return null;
  const type = SITE_TYPES[rdHash("st", slot) % SITE_TYPES.length], zone = zl[rdHash("sz", slot) % zl.length];
  const start = slot * SITE_SLOT + (rdHash("ss", slot) % (SITE_SLOT - SITE_LIVE));
  return { key: "s" + slot, slot, type, zone, start, end: start + SITE_LIVE };
}
function siteList(now = serverNow()) {
  if (!T("site_on", 1)) return [];
  const s = Math.floor(now / SITE_SLOT), out = [];
  for (let k = s - 1; k <= s + 1; k++) { const x = siteOf(k); if (x) out.push(x); }
  return out;
}
const siteLive = (now = serverNow()) => siteList(now).filter((x) => now >= x.start && now < x.end);
const siteHere = (z = state.zone, now = serverNow()) => siteLive(now).find((x) => x.zone === z) || null;
const siteRec = (s) => fxGet("site_" + s.key, { t: 0, f: 0 });
// ทอยค้นพบ: คืน id ของที่เจอ (จากตารางค้นหาจริงของโซน) หรือ null ถ้ายังไม่พบ
function siteRoll(found, table, isZombie) {
  if (found === "zombie" || found === "boss" || state.deep) return null;
  const s = siteHere(); if (!s) return null;
  const rec = siteRec(s); if (rec.f) return null;
  rec.t++;
  const p = Math.min(0.55, 0.1 + 0.06 * rec.t) * Math.max(0, T("site_str", 100)) / 100;
  if (Math.random() >= p) { fxSet("site_" + s.key, rec); return null; }
  const ok = (x) => x.id && x.id !== "zombie" && x.id !== "boss" && x.w > 0 && !(isZombie && (x.id === "scrap" || x.id === "chem")) && !ITEMS[x.id]?.gmOnly;
  let ids = table.filter((x) => ok(x) && s.type.loot.includes(x.id)).map((x) => x.id);
  if (!ids.length) { const w = table.filter(ok).sort((a, b) => a.w - b.w); ids = w.slice(0, Math.max(1, Math.ceil(w.length / 3))).map((x) => x.id); }
  if (!ids.length) { fxSet("site_" + s.key, rec); return null; }
  rec.f = 1; fxSet("site_" + s.key, rec);
  state.siteHit = { s, id: ids[Math.floor(Math.random() * ids.length)] };
  return state.siteHit.id;
}
function siteAfter(found) {
  const h = state.siteHit; state.siteHit = null; if (!h || h.id !== found) return;
  const msg = `${h.s.type.icon} ${h.s.type.find}! คุณได้ ${ITEMS[found].icon} ${ITEMS[found].name}`;
  logLine(`✨ ${msg}`, "system"); toast(`${h.s.type.icon} ค้นพบ${h.s.type.name}!`);
  achBump("site"); try { bookNote("s", h.s.type.id); } catch { /* ข้าม */ } try { sfx("boss"); } catch { /* ข้าม */ }
}

/* ---- ภารกิจเคียงข้าง: อยู่โซนนอก Safe Zone ร่วมกับเพื่อนฝั่งเดียวกันให้ครบเวลา (ต่อรอบ 2 ชม.) ---- */
const DUO_BUFF_MS = 30 * 60000;
const duoRec = (slot = coopSlot()) => fxGet("duo_" + slot, { s: 0, d: 0 });
const duoTarget = () => Math.max(1, Math.round(T("duo_min", 8))) * 60;
const duoBuffLeft = () => Math.max(0, fxGet("duo_buf", 0) - serverNow());
function duoPartners() {
  const p = state.profile; if (!p || !state.zone || isPeace(state.zone) || !(p.hp > 0)) return 0;
  return Object.entries(state.players || {}).filter(([id, v]) => id !== state.uid && v && v.faction === p.faction).length;
}
function duoTick() {
  if (!T("duo_on", 1) || !state.profile || !state.ach?.loaded) return;
  const now = serverNow(), last = state.duoLast || now; state.duoLast = now;
  const dt = Math.max(0, Math.min(30, (now - last) / 1000));
  if (!dt || !duoPartners()) return;
  const slot = coopSlot(now), rec = duoRec(slot); if (rec.d) return;
  rec.s += dt;
  if (rec.s >= duoTarget()) {
    rec.d = 1; fxSet("duo_" + slot, rec);
    fxSet("duo_buf", now + DUO_BUFF_MS);
    achBump("duo"); questBump("duo");
    toast("🤝 ภารกิจเคียงข้างสำเร็จ!"); logLine(`🤝 ภารกิจเคียงข้างสำเร็จ — โชคค้นหาดีขึ้นเล็กน้อยไปอีก ${Math.round(DUO_BUFF_MS / 60000)} นาที`, "system");
  } else fxSet("duo_" + slot, rec);
  try { worldRefresh(); } catch { /* ข้าม */ }
}

/* ---- เส้นทางอาชีพ: คำนวณจากตัวนับ achievement เดิม ---- */
const CAREER = {
  explorer: { icon: "🧭", name: "นักสำรวจ", titles: ["มือสำรวจ", "นักสำรวจ", "ผู้นำทาง", "จอมสำรวจแห่งเมืองร้าง", "ตำนานนักสำรวจ", "ผู้ไร้ขอบฟ้า"], tip: (L) => `ตาไวกว่าใคร: ค้นหาแล้ว "ไม่เจออะไร" น้อยลง ${L * 3}%`, score: (c) => (c.srch || 0) + 4 * (c.trav || 0) + 15 * (c.zvis || 0) + 2 * (c.nsrch || 0) },
  hunter: { icon: "🗡️", name: "นักล่า", titles: ["นักสู้", "นักล่า", "จอมล่า", "ผู้ล่าแห่งเมือง", "ผู้ล่าตำนาน", "ราชันย์แห่งการล่า"], tip: (L, z) => z ? `สัญชาตญาณล่า: เนื้อเน่าเจอมากขึ้น ${L * 5}%` : `อาวุธทนขึ้น: มีโอกาส ${L * 7}% ที่ตีแล้วไม่เสียความทน`, score: (c) => 2 * (c.zwin || 0) + 8 * (c.boss || 0) + 3 * (c.wbhit || 0) + 4 * (c.bite || 0) + 2 * (c.smash || 0) + 10 * (c.evo || 0) + (c.wbdmg || 0) / 20 },
  medic: { icon: "🩹", name: "หมอสนาม", titles: ["ผู้ช่วยหมอ", "หมอสนาม", "หมอใหญ่", "เทพแห่งการรักษา", "หมอผู้คืนชีพ", "แพทย์แห่งปาฏิหาริย์"], tip: (L) => `ทนสถานะดีขึ้น: เลือดไหล/พิษ/เชื้อทำเลือดลดน้อยลง ${L * 8}%`, score: (c) => 0.5 * (c.use || 0) + 3 * (c.heal || 0) + 15 * (c.cure || 0) },
  trader: { icon: "💼", name: "พ่อค้า", titles: ["ผู้ค้าปลีก", "พ่อค้า", "เจ้าพ่อตลาด", "เศรษฐีเมืองร้าง", "มหาเศรษฐี", "จักรพรรดิการค้า"], tip: (L) => `รู้แหล่งของ: เศษวัสดุเจอมากขึ้น ${L * 6}%`, score: (c) => 4 * (c.mkt || 0) + 2 * (c.craft || 0) + (c.gacha || 0) + (c.dclaim || 0) }
};
const CAREER_LV = [60, 250, 800, 2500, 6000, 15000];   // ขั้น 5–6 ต้องตรงกับ functions/ability.js
const CAREER_MAX = CAREER_LV.length, careerLe = (L) => (L <= 4 ? L : 4 + (L - 4) * 0.5);   // ขั้น 5+ ให้โบนัสครึ่งหนึ่งของขั้นปกติ กันแรงเกิน
function careerOf() {
  if (!T("career_on", 1) || !state.ach?.loaded) return null;
  const c = state.ach.c || {}, key = state.ach.loaded ? Object.keys(CAREER).map((k) => [k, CAREER[k].score(c)]).sort((a, b) => b[1] - a[1])[0] : null;
  if (!key || key[1] < CAREER_LV[0]) return null;
  const L = CAREER_LV.filter((v) => key[1] >= v).length;
  return { k: key[0], L, Le: careerLe(L), score: Math.round(key[1]), def: CAREER[key[0]], title: CAREER[key[0]].titles[L - 1] };
}
let fxCareerMemo = { t: 0, v: null };
function careerNow() { const n = Date.now(); if (n - fxCareerMemo.t > 4000) fxCareerMemo = { t: n, v: careerOf() }; return fxCareerMemo.v; }
function careerCheck() {
  try { skNotify(); } catch { /* ข้าม */ }
  const c = careerOf(); if (!c) return;
  const last = fxGet("career", ""), cur = c.k + c.L;
  if (last !== cur) { fxSet("career", cur); if (last) { toast(`🧭 เส้นทางอาชีพ: ${c.def.icon} ${c.title}`); logLine(`🧭 คุณก้าวสู่ ${c.def.icon} ${c.title} (${c.def.name} ขั้น ${c.L}) — ${c.def.tip(c.L, state.profile?.faction === "zombie")}`, "system"); } }
}
const careerWearSkip = (w) => { if (state.profile?.faction === "zombie" || !(w.it.dur > 1)) return false; const c = careerNow(); return Math.random() < (c && c.k === "hunter" ? c.Le * 0.07 : 0) + (typeof skWear === "function" ? skWear() : 0) + (typeof npcWear === "function" ? npcWear() : 0); };
// สัดส่วนที่ลดความเสียหายจากสถานะ (เลือดไหล/พิษ/เชื้อ) — หมอสนาม (+โปรเจกต์ค่ายในอนาคต)
const fxDmgCut = () => { const c = careerNow(); return Math.min(0.6, (gearHas("lab_coat") ? 0.05 : 0) + (c && c.k === "medic" ? c.Le * 0.08 : 0) + (typeof skCut === "function" ? skCut() : 0) + (typeof mealCut === "function" ? mealCut() : 0) + (typeof fxCampCut === "function" ? fxCampCut() : 0) + (typeof npcCut === "function" ? npcCut() : 0) + (typeof fxPerkCut === "function" ? fxPerkCut() : 0) + (typeof fxAbilCut === "function" ? fxAbilCut() : 0)); };
const fxCutDmg = (x) => { if (!(x > 0)) return x; const y = x * (1 - fxDmgCut()); return Math.max(1, Math.floor(y) + (Math.random() < y - Math.floor(y) ? 1 : 0)); };   // ปัดเศษแบบสุ่มให้ลดได้จริงแม้ติ๊กละน้อย

/* ---- รวมผลทั้งหมดเข้า "ตารางของที่เจอ" และ "อันตรายของโซน" ---- */
let fxMemo = { k: "", v: null };
function fxMods(z) {
  const nowS = Math.floor(Date.now() / 2500), k = z + "|" + nowS + "|" + (state.profile?.faction || "") + "|" + state.offset + "|" + [T("fest_on", 1), T("fest_str", 100), T("fest_force", 0), T("career_on", 1), duoBuffLeft() > 0 ? 1 : 0, labBuffLeft() > 0 ? 1 : 0, mealRec() ? 1 : 0, typeof skEff === "function" ? skEff.s || "" : ""].join(",");
  if (fxMemo.k === k) return fxMemo.v;
  const m = { z: 1, n: 1, r: 1, f: 1, w: 1, a: 1, rm: 1, sc: 1, dm: 0, it: {} }, s = Math.max(0, T("fest_str", 100)) / 100, safe = z === "safe";
  festLive().forEach((f) => { const x = f.m; ["z", "n", "r", "f", "w", "a", "rm"].forEach((q) => { if (x[q] && !(safe && q === "z")) m[q] *= Math.pow(x[q], s); }); if (x.dm && !safe) m.dm += Math.round(x.dm * s); });
  const c = careerNow();
  if (c) { if (c.k === "explorer") m.n *= 1 - 0.03 * c.Le; if (c.k === "trader") m.sc *= 1 + 0.06 * c.Le; if (c.k === "hunter" && state.profile?.faction === "zombie") m.rm *= 1 + 0.05 * c.Le; }
  if (duoBuffLeft() > 0) m.a *= 1.1;
  if (typeof skApply === "function") skApply(m);
  labBuffMods(m); mealMods(m);
  if (typeof fxCampMods === "function") fxCampMods(m, z);
  if (typeof fxSeasonMods === "function") fxSeasonMods(m, z);
  if (typeof fxNpcMods === "function") fxNpcMods(m, z);
  if (typeof fxPerkMods === "function") fxPerkMods(m);
  if (typeof fxAbilMods === "function") fxAbilMods(m);
  fxMemo = { k, v: m }; return m;
}
function fxDrops(z, d) {
  const m = fxMods(z);
  const hasIt = Object.keys(m.it || {}).length > 0;
  if (m.z === 1 && m.n === 1 && m.r === 1 && m.f === 1 && m.w === 1 && m.a === 1 && m.rm === 1 && m.sc === 1 && !hasIt) return d;
  const ws = d.filter((x) => x.id && x.id !== "zombie" && x.id !== "boss" && x.w > 0).map((x) => x.w).sort((a, b) => a - b), cut = ws.length ? ws[Math.floor(ws.length * 0.4)] : 0;
  return d.map((x) => {
    if (x.id === null) return m.n === 1 ? x : { ...x, w: x.w * m.n };
    if (x.id === "zombie") return m.z === 1 ? x : { ...x, w: x.w * m.z };
    if (x.id === "boss") return x;
    let k = m.a; if (x.w <= cut) k *= m.r; if (FX_FOOD.has(x.id)) k *= m.f; if (x.id === "water") k *= m.w; if (x.id === "scrap") k *= m.sc; if (x.id === "rotten_meat") k *= m.rm; if (hasIt && m.it[x.id]) k *= m.it[x.id];
    return k === 1 ? x : { ...x, w: x.w * k };
  });
}
const fxDmod = (z) => (z && z !== "safe" ? fxMods(z).dm : 0);

/* ---- ข้อความบรรยาย/ประกาศ ---- */
function fxPool(kind) {   // ใช้ใน wxFlavor
  const out = []; festLive().forEach((f) => { (kind === "amb" ? f.amb : kind === "lead" ? f.lead : null)?.forEach((t) => out.push(t)); });
  return out;
}
function fxRender(zArg) {
  const tEl = $("zone-time"); if (!tEl) return;
  let el = $("zone-fx"); if (!el) { el = mk("p", "time-line wx"); el.id = "zone-fx"; (($("zone-weather") || tEl).after(el)); }
  const z = zArg || state.zone, fl = festLive(), parts = fl.map((f) => `${f.icon} ${f.name}`);
  const s = z && z !== "safe" ? siteHere(z) : null;
  if (s && siteRec(s).t >= 2 && !siteRec(s).f) parts.push("👀 รู้สึกเหมือนมีอะไรซ่อนอยู่แถวนี้…");
  if (duoBuffLeft() > 0) parts.push("🤝 โชคเคียงข้าง");
  try { const fb = fxZoneBadge(z); if (fb) parts.push(fb); } catch { /* ข้าม */ }
  el.classList.toggle("hidden", !parts.length);
  el.textContent = parts.join(" • ");
  el.title = fl.map((f) => `${f.name}: ${f.tip}`).join("\n");
}
function fxTick() {
  if (!state.profile) return;
  const now = serverNow(), day = coopDay(now);
  festActive(now).forEach((f) => {
    const k = `fx_${f.id}_${day}`; if (fxGet(k, 0)) return; fxSet(k, 1);
    radioPush(`📻 [ประกาศเมือง] ${f.icon} ${f.name} — ${f.say}`, now, true);
    try { logLine(`${f.icon} ${f.name} — ${f.tip}`, "system"); } catch { /* ข้าม */ }
  });
  siteLive(now).forEach((x) => {
    const k = "fxs_" + x.key; if (fxGet(k, 0)) return; fxSet(k, 1);
    radioPush(`📻 [ข่าวลือ] ${x.type.icon} ได้ยินมาว่ามี${x.type.name}ซ่อนอยู่ที่ไหนสักแห่ง ใกล้ ๆ ${SITE_HINT[x.zone] || "ที่ลับตา"} — ใครไปค้นหาถูกที่อาจโชคดี (อีก ~${Math.max(1, Math.ceil((x.end - now) / 60000))} นาที)`, now, true);
  });
  try { fxTick2(now); } catch (e) { console.warn("fxTick2", e); }
  try { fxTick3(now); } catch (e) { console.warn("fxTick3", e); }
  try { careerCheck(); fxRender(); if (state.zone) renderZoneDanger(state.zone); } catch { /* ข้าม */ }
}
// นับการค้นหาระหว่างเทศกาล (เรียกจากการค้นหาสำเร็จ)
function fxSearchHook() {
  const fl = festLive(); if (!fl.length) return;
  achBump("fest"); const seen = [...fxGet("festseen", [])], n0 = seen.length;
  fl.forEach((f) => { if (!seen.includes(f.id)) seen.push(f.id); });
  if (seen.length !== n0) { fxSet("festseen", seen); achSet("festn", seen.length); }
}

/* ---- แผงโลก (🌍): พับ/ขยายได้ ---- */
function fxSection(box, id, title, fn, open = true) {
  const d = document.createElement("details"); d.className = "fx-sec"; d.open = fxGet("fxo_" + id, open ? 1 : 0) === 1;
  const sm = document.createElement("summary"); sm.className = "hub-day"; sm.textContent = title; d.append(sm);
  const body = mk("div", "fx-body"); d.append(body); fn(body);
  d.addEventListener("toggle", () => fxSet("fxo_" + id, d.open ? 1 : 0));
  box.append(d);
}
function fxWorldRows(box) {
  if (!$("fx-style")) { const st = document.createElement("style"); st.id = "fx-style"; st.textContent = ".fx-sec{margin:6px 0}.fx-sec>summary{cursor:pointer;list-style:none}.fx-sec>summary::-webkit-details-marker{display:none}.fx-body{display:grid;gap:4px;margin-top:4px}.fx-chip{display:inline-block;padding:0 8px;border-radius:10px;border:1px solid var(--line,#3a3a3a);margin:2px 4px 2px 0;font-size:12px}"; document.head.append(st); }
  fxSection(box, "fest", "🎆 เทศกาลและปฏิทินเมือง", (b) => {
    const now = serverNow(), act = festActive(now);
    if (!T("fest_on", 1) && !festForced()) return b.append(mk("div", "muted", "เทศกาลปิดอยู่ชั่วคราว"));
    act.forEach((f) => { const r = mk("div", "world-row evt-live"); r.append(mk("div", "", `${f.icon} ${f.name}${f === festForced() ? " (เจ้าของสั่งเปิด)" : ""}`), mk("div", "muted", `${f.tip}${f.night && !isNight() ? " • (มีผลตอนกลางคืนในเกม)" : ""}`)); b.append(r); });
    if (!act.length) b.append(mk("div", "muted", "ตอนนี้ยังไม่มีเทศกาล"));
    const nx = FEST.map((f) => [f, festNext(f, now)]).filter(([f, d]) => d !== null && d > 0).sort((a, c) => a[1] - c[1]).slice(0, 3);
    if (nx.length) b.append(mk("div", "muted", "งานถัดไป: " + nx.map(([f, d]) => `${f.icon} ${f.name} (อีก ~${d} วัน)`).join(" • ")));
  }, true);
  fxSection(box, "site", "🛩️ ข่าวลือคลังลับ", (b) => {
    if (!T("site_on", 1)) return b.append(mk("div", "muted", "คลังลับปิดอยู่ชั่วคราว"));
    const now = serverNow(), live = siteLive(now);
    live.forEach((x) => { const rec = siteRec(x), r = mk("div", "world-row evt-live"); r.append(mk("div", "", `${x.type.icon} มี${x.type.name}ซ่อนอยู่ ใกล้ ๆ ${SITE_HINT[x.zone] || "ที่ลับตา"}`), mk("div", "muted", `${rec.f ? "คุณค้นพบแล้ว ✅" : "ออกค้นหาให้ถูกโซน แล้วอาจเจอ"} • เหลือ ~${Math.max(1, Math.ceil((x.end - now) / 60000))} นาที`)); b.append(r); });
    if (!live.length) { const nx = siteList(now).filter((x) => x.start > now).sort((a, c) => a.start - c.start)[0]; b.append(mk("div", "muted", nx ? `ยังไม่มีข่าวลือตอนนี้ — ข่าวถัดไปอีก ~${Math.max(1, Math.ceil((nx.start - now) / 60000))} นาที` : "ยังไม่มีข่าวลือตอนนี้ — ฟังวิทยุไว้")); }
  }, true);
  fxSection(box, "duo", "🤝 ภารกิจเคียงข้าง", (b) => {
    if (!T("duo_on", 1)) return b.append(mk("div", "muted", "ปิดอยู่ชั่วคราว"));
    const rec = duoRec(), tg = duoTarget(), r = mk("div", "world-row");
    r.append(mk("div", "", `อยู่โซนนอก Safe Zone ร่วมกับเพื่อนฝั่งเดียวกันให้ครบ ${Math.round(tg / 60)} นาที (รอบละ 2 ชม.)`), worldBar(rec.d ? 1 : rec.s / tg, rec.d ? "สำเร็จแล้ว ✅" : `${Math.floor(rec.s / 60)}:${String(Math.floor(rec.s % 60)).padStart(2, "0")} / ${Math.round(tg / 60)}:00`));
    r.append(mk("div", "muted", duoBuffLeft() > 0 ? `🤝 โชคเคียงข้างเหลือ ~${Math.ceil(duoBuffLeft() / 60000)} นาที (ของที่เจอดีขึ้นเล็กน้อย)` : (duoPartners() ? "ตอนนี้มีเพื่อนอยู่ด้วย กำลังนับเวลา" : "ตอนนี้ยังไม่มีเพื่อนอยู่ในโซนเดียวกัน (หรืออยู่ Safe Zone)"))); b.append(r);
  }, false);
  fxSection(box, "career", "🧭 เส้นทางอาชีพ", (b) => {
    if (!T("career_on", 1)) return b.append(mk("div", "muted", "ปิดอยู่ชั่วคราว"));
    if (!state.ach?.loaded) return b.append(mk("div", "muted", "กำลังโหลด…"));
    const c = state.ach.c || {}, cur = careerOf(), z = state.profile?.faction === "zombie";
    if (cur) { const r = mk("div", "world-row evt-live"); r.append(mk("div", "", `${cur.def.icon} ${cur.title} (${cur.def.name} ขั้น ${cur.L}/${CAREER_MAX})`), mk("div", "muted", cur.def.tip(cur.Le, z))); b.append(r); }
    else b.append(mk("div", "muted", "ยังไม่มีเส้นทางเด่นชัด — เล่นไปเรื่อย ๆ สายที่ทำบ่อยที่สุดจะกลายเป็นอาชีพของคุณ"));
    Object.entries(CAREER).forEach(([k, d]) => { const sc = d.score(c), L = CAREER_LV.filter((v) => sc >= v).length, nx = CAREER_LV[Math.min(CAREER_MAX - 1, L)]; const r = mk("div", "world-row"); r.append(mk("div", "", `${d.icon} ${d.name}${L ? ` • ขั้น ${L}` : ""}`), worldBar(L >= CAREER_MAX ? 1 : sc / nx, `${Math.round(sc)}/${L >= CAREER_MAX ? Math.round(sc) : nx}`)); b.append(r); });
    b.append(mk("div", "muted", "อาชีพหลัก = สายที่แต้มสูงสุด ได้โบนัสเล็ก ๆ ตามขั้น (แต้มคำนวณจากตัวนับความสำเร็จเดิม)"));
    try { if (skOn()) b.append(btn(`🌳 ต้นไม้ทักษะ${skFreeAll() ? ` (แต้มว่าง ${skFreeAll()})` : ""}`, skOpen, "btn primary mini")); } catch { /* ข้าม */ }
  }, false);
  try { if (typeof fxWorldRows2 === "function") fxWorldRows2(box); } catch (e) { console.warn("fx rows2", e); }
  try { if (typeof fxWorldRows3 === "function") fxWorldRows3(box); } catch (e) { console.warn("fx rows3", e); }
}

/* ---- ตลาด: ตัวกรอง • เรียง • ของที่ตามหา (เก็บในเครื่อง) ---- */
const mktWatch = () => fxGet("mkt_watch", []);
function mktWatchToggle(id) { const a = [...mktWatch()], i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); fxSet("mkt_watch", a.slice(-12)); }
function mktListingsSeen(snap) {   // เรียกทุกครั้งที่ snapshot ตลาดเปลี่ยน: แจ้งเตือนเมื่อมีคนลงขายของที่ตามหา
  const prev = state.mktPrevKeys, cur = new Set(Object.keys(snap || {}));
  state.mktPrevKeys = cur; if (!prev) return;
  const w = mktWatch(); if (!w.length) return;
  cur.forEach((k) => {
    if (prev.has(k)) return; const l = snap[k]; if (!l || l.seller === state.uid || !l.give) return;
    if (w.includes(l.give.id)) { const t = `⭐ มีคนลงขาย ${mktLabel(l.give.id)} ← ${mktWantTxt(l)}`; toast(t); logLine(t, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }
  });
}
function mktFilterCard(card, row) {
  const f = (state.mktFilter = state.mktFilter || fxGet("mkt_flt", { mode: "all", id: "", sort: "new" }));
  const save = () => { fxSet("mkt_flt", f); renderMarket(); };
  const c = card("🔎 ตัวกรอง • ของที่ตามหา"), r1 = row();
  const mode = mk("select"); [["all", "ทั้งหมด"], ["give", "ของที่ขาย"], ["want", "ที่เขาขอ"]].forEach(([v, t]) => { const o = mk("option", "", t); o.value = v; mode.append(o); }); mode.value = f.mode;
  mode.addEventListener("change", () => { f.mode = mode.value; save(); });
  const ids = [...MKT_IDS, ...MKT_WEAP], it = mk("select"); it.style.cssText = "flex:1;min-width:0";
  const o0 = mk("option", "", "— เลือกของ —"); o0.value = ""; it.append(o0); ids.forEach((id) => { const o = mk("option", "", mktLabel(id)); o.value = id; it.append(o); }); it.value = f.id;
  it.addEventListener("change", () => { f.id = it.value; save(); });
  r1.append(mode, it);
  const r2 = row(), sort = mk("select"); [["new", "เรียง: ใหม่สุด"], ["cheap", "เรียง: จ่ายน้อยสุด"]].forEach(([v, t]) => { const o = mk("option", "", t); o.value = v; sort.append(o); }); sort.value = f.sort;
  sort.addEventListener("change", () => { f.sort = sort.value; save(); });
  const w = mktWatch(), star = btn(f.id && w.includes(f.id) ? "⭐ เลิกตามหา" : "☆ ตามหาของนี้", () => { if (!f.id) return toast("เลือกของก่อน"); mktWatchToggle(f.id); save(); }, "btn ghost mini");
  r2.append(sort, star); c.append(r1, r2);
  if (w.length) { const ch = mk("div"); w.forEach((id) => { const b = mk("span", "fx-chip", `⭐ ${mktLabel(id)} ✕`); b.style.cursor = "pointer"; b.addEventListener("click", () => { mktWatchToggle(id); renderMarket(); }); ch.append(b); }); c.append(ch, mk("span", "muted", "มีคนลงขายของที่ตามหา จะแจ้งเตือนทันที (เฉพาะเครื่องนี้)")); }
  return c;
}
function mktApplyFilter(list) {
  const f = state.mktFilter || fxGet("mkt_flt", { mode: "all", id: "", sort: "new" });
  let a = list;
  if (f.id && f.mode === "give") a = a.filter(([, l]) => l.give?.id === f.id);
  else if (f.id && f.mode === "want") a = a.filter(([, l]) => mktWants(l).some((w) => w.id === f.id));
  else if (f.id) a = a.filter(([, l]) => l.give?.id === f.id || mktWants(l).some((w) => w.id === f.id));
  if (f.sort === "cheap") a = a.slice().sort((x, y) => mktWants(x[1]).reduce((s, w) => s + w.qty, 0) - mktWants(y[1]).reduce((s, w) => s + w.qty, 0));
  return a;
}

function fxInit() {
  if (state.fxOn || !state.uid) return; state.fxOn = true;
  try { baseInit(); } catch (e) { console.warn("baseInit", e); }
  fxTick(); setInterval(fxTick, 10000); setInterval(duoTick, 15000);
  setInterval(() => { try { const hm = $("hub-modal"); if (hm && !hm.classList.contains("hidden") && hm.dataset.tab === "world" && !hm.querySelector("input:focus,select:focus")) worldRefresh(); } catch { /* ข้าม */ } }, 20000);
}

/* =========================================================
   37) 🏕️ โปรเจกต์ค่าย/รัง • ⚔️ ศึกชิงโซน — ใช้ตัวนับกลุ่ม coop/ เดิม (ไม่ต้องแก้ rules)
   - โปรเจกต์: สมทบของจาก Safe Zone → หักของในกระเป๋า + เพิ่มแต้ม coop/{ph|pz}{ซีซัน*10+เลขโปรเจกต์}/{uid} ในคำสั่งเดียว (อะตอมมิก)
     ครบเป้า = โบนัสเล็ก ๆ ถาวรตลอดซีซัน (เจ้าของขึ้นซีซันใหม่ด้วย tune proj_season เพื่อรีเซ็ต)
   - ศึกชิงโซน: ทุกการค้นหา/ชนะซอมบี้/สู้บอส/กัดเหยื่อนอก Safe Zone ให้แต้มกับฝั่งตัวเองในโซนนั้น (coop/{zh|zz}{สัปดาห์}{โซน 1–9})
     จบสัปดาห์ ฝั่งที่แต้มมากกว่าในโซนนั้น "ยึดโซน" ตลอดสัปดาห์ถัดไป → สมาชิกฝั่งผู้ชนะได้โบนัสเล็ก ๆ ในโซนนั้น
   - ปรับได้จากแท็บ 🎛️: proj_on, proj_scale, proj_str, proj_season, zw_on, zw_str, zw_min
   ========================================================= */
const PROJ_ITEMS = { human: { scrap: 1, chem: 3, bandage: 2, canned_food: 2, water: 1, medkit: 6, lab_sample: 5, lab_core: 25, fish: 3, golden_fish: 8 }, zombie: { rotten_meat: 1, chem: 3, moss: 2, medkit: 6, lab_sample: 5, lab_core: 25 } };
const PROJ = {
  human: [
    { id: 1, icon: "🗼", name: "หอสังเกตการณ์", cost: 500, tip: "ตาไวขึ้น: เจอซอมบี้ตอนค้นหาน้อยลง 5%", eff: { z: 0.95 } },
    { id: 2, icon: "🍲", name: "ครัวกลางค่าย", cost: 800, tip: "อาหารเจอง่ายขึ้น 10%", eff: { f: 1.1 } },
    { id: 3, icon: "🩹", name: "ห้องพยาบาลสนาม", cost: 1100, tip: "เลือดไหล/พิษ/เชื้อทำเลือดลดน้อยลง 5%", eff: { cut: 0.05 } },
    { id: 4, icon: "⚙️", name: "โรงซ่อมกลาง", cost: 1500, tip: "เศษวัสดุเจอมากขึ้น 10%", eff: { sc: 1.1 } }
  ],
  zombie: [
    { id: 1, icon: "👃", name: "รังดมกลิ่น", cost: 500, tip: "เนื้อเน่าเจอมากขึ้น 10%", eff: { rm: 1.1 } },
    { id: 2, icon: "🧪", name: "บ่อบ่มเชื้อ", cost: 800, tip: "เลือดไหล/พิษ/เชื้อทำเลือดลดน้อยลง 5%", eff: { cut: 0.05 } },
    { id: 3, icon: "🌫️", name: "ม่านหมอกของรัง", cost: 1100, tip: "ค้นหาแล้ว \"ไม่เจออะไร\" น้อยลง 5%", eff: { n: 0.95 } },
    { id: 4, icon: "🦴", name: "คลังกระดูก", cost: 1500, tip: "ของหายากเจอมากขึ้น 10%", eff: { r: 1.1 } }
  ]
};
const projSeason = () => Math.max(1, Math.min(9999999, Math.round(T("proj_season", 1))));
const projKey = (f, i) => (f === "zombie" ? "pz" : "ph") + (projSeason() * 10 + i);
const projCost = (p) => Math.max(1, Math.round(p.cost * Math.max(1, T("proj_scale", 100)) / 100));
const projSum = (i) => (T("proj_on", 1) ? coopSum(projKey(coopFac(), i)) : 0);
const projDone = (p) => T("proj_on", 1) && projSum(p.id) >= projCost(p);
const projStr = () => Math.max(0, T("proj_str", 100)) / 100;
function fxCampCut() { const s = projStr(); return s ? PROJ[coopFac()].reduce((a, p) => a + (p.eff.cut && projDone(p) ? p.eff.cut * s : 0), 0) : 0; }
function fxCampMods(m, z) {
  const s = projStr(), safe = z === "safe", my = coopFac();
  if (s) PROJ[my].forEach((p) => {
    if (!projDone(p)) return;
    Object.entries(p.eff).forEach(([q, v]) => { if (q === "cut" || (safe && q === "z")) return; m[q] *= Math.pow(v, s); });
  });
  const c = zwCtl(z), zs = Math.max(0, T("zw_str", 100)) / 100;
  if (c && zs && c === (my === "zombie" ? "z" : "h")) { m.a *= Math.pow(1.04, zs); if (my === "zombie") m.rm *= Math.pow(1.12, zs); else m.z *= Math.pow(0.92, zs); }
}
const projCool = {};
async function projDonate(i, id, qty) {
  const C = state.coop, p = state.profile, fac = coopFac(), P = PROJ[fac].find((x) => x.id === i), pts = PROJ_ITEMS[fac][id];
  if (!C || !p || !P || !pts) return;
  if (!T("proj_on", 1)) return toast("โปรเจกต์ปิดอยู่ชั่วคราว");
  if (!(p.hp > 0)) return toast("ต้องมีชีวิตอยู่ถึงจะสมทบได้");
  if (state.zone !== "safe") return toast(`ต้องอยู่ที่ Safe Zone ถึงจะสมทบ${fac === "zombie" ? "รัง" : "ค่าย"}ได้`);
  const key = projKey(fac, i), cost = projCost(P), sum = coopSum(key), left = cost - sum;
  if (left <= 0) return toast("โปรเจกต์นี้เสร็จแล้ว");
  const it = state.inv[id]; if (!it || it.id !== id || !(it.qty > 0)) return toast("ไม่มีของชิ้นนี้ในกระเป๋า");
  if (Date.now() - (projCool[key] || 0) < 6000) return toast("รอสักครู่แล้วสมทบอีกครั้ง");
  const q = Math.max(1, Math.min(Math.floor(qty) || 1, it.qty, Math.ceil(left / pts), Math.floor(300 / pts)));
  if (state.busy) return; state.busy = true; projCool[key] = Date.now();
  try {
    if (C.mine[key] === undefined) C.mine[key] = (await get(ref(db, `coop/${key}/${state.uid}/n`))).val() || 0;
    const n = q * pts, u = {};
    if (q >= it.qty) u[`inventory/${state.uid}/${id}`] = null; else u[`inventory/${state.uid}/${id}/qty`] = it.qty - q;
    u[`coop/${key}/${state.uid}`] = { n: C.mine[key] + n, name: p.username, ts: serverTimestamp() };
    await update(ref(db), u);
    C.mine[key] += n; achBump("camp", n);
    toast(`${P.icon} สมทบ ${ITEMS[id].icon} ${ITEMS[id].name} ×${q} (+${n} แต้ม)`); logLine(`${P.icon} คุณสมทบ ${ITEMS[id].name} ×${q} ให้ ${P.name} (+${n} แต้ม)`, "system");
    try { sfx("boss"); } catch { /* ข้าม */ }
  } catch (e) { C.mine = {}; toast(errMsg(e)); }
  finally { state.busy = false; worldRefresh(); }
}

/* ---- ศึกชิงโซน ---- */
const ZW_W = { search: 1, zwin: 2, boss: 5, bite: 3 };
const zwZones = () => Object.keys(ZONES).filter((z) => z !== "safe");
const zwKey = (f, wk, idx) => (f === "zombie" ? "zz" : "zh") + wk + idx;
const coopRaw = (k) => Object.values(state.coop?.sums?.[k] || {}).reduce((s, x) => s + (x?.n || 0), 0);
function zwarEvent(ev, n) {
  const C = state.coop, w = ZW_W[ev]; if (!C || !w || !T("zw_on", 1)) return;
  const idx = zwZones().indexOf(state.zone) + 1; if (idx < 1 || !(state.profile?.hp > 0)) return;
  // แต้มเขียนผ่านฟังก์ชัน zwAct (เซิร์ฟเวอร์กำหนดโซน/ฝ่าย/น้ำหนักเอง) — ที่นี่แค่สะสมจำนวนครั้งของโซนปัจจุบัน
  const q = C.zq || (C.zq = { zone: state.zone, ev: {} });
  if (q.zone !== state.zone) { q.zone = state.zone; q.ev = {}; }   // ย้ายโซน: ของค้างโซนเดิมทิ้ง (เซิร์ฟเวอร์ใช้โซนปัจจุบันของผู้เล่น)
  q.ev[ev] = (q.ev[ev] || 0) + n; achBump("zwar", n * w);
  clearTimeout(C.zt); C.zt = setTimeout(zwFlush, 5000);
}
async function zwFlush() {
  const C = state.coop, q = C?.zq; if (!q || C.zbusy || !state.profile || state.profile.banned || q.zone !== state.zone) return;
  const ev = {}; let any = false;
  Object.entries(q.ev).forEach(([k, v]) => { const n = Math.min(20, Math.floor(v)); if (n >= 1) { ev[k] = n; any = true; } });
  if (!any) return;
  C.zbusy = true;
  try {
    const r = await zwCall({ items: ev });
    Object.entries(ev).forEach(([k, n]) => { q.ev[k] -= n; if (q.ev[k] <= 0) delete q.ev[k]; });
    if (Object.keys(q.ev).length) { clearTimeout(C.zt); C.zt = setTimeout(zwFlush, 3000); }
    if (r?.limited) q.ev = {};   // ถังเต็ม: ทิ้งส่วนเกิน (ไม่ลองใหม่ไม่รู้จบ)
  } catch (e) {
    const c = e?.code || ""; console.warn("zwFlush", c);
    if (/invalid-argument|permission-denied|unauthenticated/.test(c)) q.ev = {}; else if (/aborted|unavailable|internal|deadline/.test(c)) { clearTimeout(C.zt); C.zt = setTimeout(zwFlush, 8000); } else q.ev = {};
  } finally { C.zbusy = false; }
}
function zwarWant(want) {
  const wk = qpKey("weekly"); zwZones().forEach((z, i) => { want.add(zwKey("human", wk, i + 1)); want.add(zwKey("zombie", wk, i + 1)); });
  if (T("proj_on", 1)) PROJ[coopFac()].forEach((p) => want.add(projKey(coopFac(), p.id)));
}
function zwLive(z) {   // แต้มสัปดาห์นี้ของโซน {h, z}
  const idx = zwZones().indexOf(z) + 1, wk = qpKey("weekly"), my = coopFac();
  const hk = zwKey("human", wk, idx), zk = zwKey("zombie", wk, idx);
  return { h: my === "human" ? coopSum(hk) : coopRaw(hk), z: my === "zombie" ? coopSum(zk) : coopRaw(zk) };
}
// ผลสัปดาห์ก่อน: อ่านครั้งเดียวต่อสัปดาห์ (ผลปิดแล้วไม่เปลี่ยน) เก็บไว้ในเครื่อง
function zwPrev() {
  const pw = qpKey("weekly") - 1, ck = "zw_res_" + pw + "_" + Math.max(1, Math.round(T("zw_min", 30)));
  const hit = fxGet(ck, null); if (hit) return hit;
  if (!state.coop || state.zwLoading === pw) return null;
  state.zwLoading = pw;
  (async () => {
    try {
      const res = {}, tot = { h: 0, z: 0 }, min = Math.max(1, Math.round(T("zw_min", 30)));
      await Promise.all(zwZones().map(async (z, i) => {
        const sum = async (f) => { const s = await get(ref(db, "coop/" + zwKey(f, pw, i + 1))); let t = 0; const v = s.val() || {}; Object.values(v).forEach((x) => { t += x?.n || 0; }); return t; };
        const [h, zz] = await Promise.all([sum("human"), sum("zombie")]);
        res[z] = h + zz >= min && h !== zz ? (h > zz ? "h" : "z") : ""; if (res[z] === "h") tot.h++; if (res[z] === "z") tot.z++;
      }));
      fxSet(ck, { res, tot, pw }); fxMemo = { k: "", v: null }; worldRefresh(); try { renderZoneDanger(state.zone); } catch { /* ข้าม */ }
    } catch (e) { console.warn("zwPrev", e?.code || e); state.zwLoading = null; setTimeout(() => { state.zwLoading = null; }, 60000); return; }
  })();
  return null;
}
function zwCtl(z) { if (!z || z === "safe" || !T("zw_on", 1)) return ""; const r = zwPrev(); return r?.res?.[z] || ""; }
function fxZoneBadge(z) {
  const c = zwCtl(z); if (!c) return "";
  const mine = c === (coopFac() === "zombie" ? "z" : "h");
  return `🚩 ${c === "h" ? "ธงมนุษย์" : "ธงซอมบี้"}${mine ? " (โบนัสฝั่งเรา)" : ""}`;
}
function fxTick2(now) {
  if (!state.profile || !state.ach?.loaded) return;
  const fac = coopFac();
  PROJ[fac].forEach((p) => {
    if (!projDone(p)) return; const k = "pj_" + projKey(fac, p.id); if (fxGet(k, 0)) return; fxSet(k, 1);
    if (coopMine(projKey(fac, p.id)) > 0) achBump("pjd");
    radioPush(`📻 [${fac === "zombie" ? "รัง" : "ค่าย"}] ${p.icon} ${p.name} สร้างเสร็จแล้ว! ${p.tip}`, now, true);
    try { logLine(`${p.icon} ${p.name} สร้างเสร็จ — ${p.tip}`, "system"); toast(`${p.icon} ${p.name} เสร็จแล้ว!`); } catch { /* ข้าม */ }
  });
  const r = T("zw_on", 1) ? zwPrev() : null, wk = qpKey("weekly");
  if (r && (r.tot.h || r.tot.z)) {
    const k = "zwann_" + wk; if (!fxGet(k, 0)) {
      fxSet(k, 1);
      const my = fac === "zombie" ? r.tot.z : r.tot.h, ot = fac === "zombie" ? r.tot.h : r.tot.z;
      radioPush(`📻 [ศึกชิงโซน] สรุปสัปดาห์ที่แล้ว: 🧑 มนุษย์ยึด ${r.tot.h} โซน • 🧟 ซอมบี้ยึด ${r.tot.z} โซน — ผู้ชนะได้โบนัสเล็ก ๆ ในโซนนั้นตลอดสัปดาห์นี้`, now, true);
      if (my > ot) { achBump("wwin"); toast("🚩 ฝั่งของคุณชนะศึกชิงโซนสัปดาห์ที่แล้ว!"); }
    }
  }
}
function fxWorldRows2(box) {
  fxSection(box, "proj", fac2("🏕️ โปรเจกต์ค่าย", "🕳️ โปรเจกต์รัง"), (b) => {
    if (!T("proj_on", 1)) return b.append(mk("div", "muted", "โปรเจกต์ปิดอยู่ชั่วคราว"));
    const fac = coopFac(), L = PROJ[fac], sel = (state.projSel = state.projSel || { p: 0, id: "", q: 10 });
    L.forEach((P) => {
      const cost = projCost(P), sum = Math.min(cost, projSum(P.id)), done = sum >= cost, r = mk("div", "world-row" + (done ? " evt-live" : ""));
      r.append(mk("div", "", `${P.icon} ${P.name}${done ? " ✅" : ""}`), worldBar(sum / cost, `${sum}/${cost}`), mk("div", "muted", `${P.tip} • ของคุณ ${coopMine(projKey(fac, P.id))} แต้ม`)); b.append(r);
    });
    const open = L.filter((P) => !projDone(P)); if (!open.length) return b.append(mk("div", "muted", `ทุกโปรเจกต์เสร็จแล้วในซีซันนี้ 🎉 (เจ้าของเปิดซีซันใหม่ได้)`));
    if (!open.find((P) => P.id === sel.p)) sel.p = open[0].id;
    const mine = Object.entries(PROJ_ITEMS[fac]).filter(([id]) => state.inv[id]?.id === id && state.inv[id].qty > 0);
    if (!mine.length) return b.append(mk("div", "muted", `ไม่มีของที่สมทบได้ในกระเป๋า (รับ: ${Object.keys(PROJ_ITEMS[fac]).map((id) => ITEMS[id].icon + ITEMS[id].name).join(" ")})`));
    if (!mine.find(([id]) => id === sel.id)) sel.id = mine[0][0];
    const row = mk("div"); row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center";
    const sp = mk("select"); open.forEach((P) => { const o = mk("option", "", `${P.icon} ${P.name}`); o.value = P.id; sp.append(o); }); sp.value = sel.p; sp.addEventListener("change", () => { sel.p = +sp.value; });
    const si = mk("select"); mine.forEach(([id, pts]) => { const o = mk("option", "", `${ITEMS[id].icon} ${ITEMS[id].name} ×${state.inv[id].qty} (+${pts})`); o.value = id; si.append(o); }); si.value = sel.id; si.addEventListener("change", () => { sel.id = si.value; });
    const qi = mk("input"); qi.type = "number"; qi.min = 1; qi.max = 300; qi.value = sel.q; qi.style.cssText = "width:64px"; qi.addEventListener("input", () => { sel.q = +qi.value || 1; });
    const go = btn("สมทบ", () => projDonate(sel.p, sel.id, +qi.value || 1), "btn primary mini");
    go.disabled = state.zone !== "safe"; row.append(sp, si, qi, go); b.append(row);
    b.append(mk("div", "muted", state.zone === "safe" ? "หักของจากกระเป๋าแล้วเข้าแต้มกองกลางทันที • ครบเป้าทุกคนในฝั่งได้โบนัสถาวรตลอดซีซัน" : "ต้องอยู่ที่ Safe Zone ถึงจะสมทบได้"));
  }, true);
  fxSection(box, "zwar", "⚔️ ศึกชิงโซน (สัปดาห์นี้)", (b) => {
    if (!T("zw_on", 1)) return b.append(mk("div", "muted", "ศึกชิงโซนปิดอยู่ชั่วคราว"));
    const left = qpResetIn("weekly"), d = Math.floor(left / 86400000), h = Math.floor((left % 86400000) / 3600000);
    b.append(mk("div", "muted", `ออกค้นหา/สู้นอก Safe Zone เพื่อสะสมแต้มให้ฝั่งตัวเองในโซนนั้น • สรุปผลอีก ~${d} วัน ${h} ชม. • ผู้ชนะยึดโซนตลอดสัปดาห์ถัดไป`));
    zwZones().forEach((z) => {
      const v = zwLive(z), tot = v.h + v.z, c = zwCtl(z), r = mk("div", "world-row" + (state.zone === z ? " evt-live" : ""));
      r.append(mk("div", "", `${ZONES[z].icon} ${ZONES[z].name}${c ? ` • ${c === "h" ? "🚩 มนุษย์คุมอยู่" : "🚩 ซอมบี้คุมอยู่"}` : ""}${state.zone === z ? " • คุณอยู่ที่นี่" : ""}`), worldBar(tot ? v.h / tot : 0.5, `🧑 ${v.h}  vs  🧟 ${v.z}`)); b.append(r);
    });
    const pr = zwPrev(); if (pr) b.append(mk("div", "muted", `สัปดาห์ก่อน: 🧑 ยึด ${pr.tot.h} โซน • 🧟 ยึด ${pr.tot.z} โซน (ฝั่งที่ยึดโซนได้ รับโบนัสเล็ก ๆ ในโซนนั้น)`)); else b.append(mk("div", "muted", "กำลังโหลดผลสัปดาห์ก่อน…"));
  }, false);
}
const fac2 = (h, z) => (coopFac() === "zombie" ? z : h);

/* =========================================================
   38) 🏠 ที่พัก — สถานีตั้งเวลาในค่าย (เขียนข้อมูลผ่าน Cloud Function baseAct — functions/base.js — rules ปิดการเขียน base/{uid} จากฝั่งเกมแล้ว)
   - วางสถานีแล้วกลับมาเก็บผลผลิตได้เรื่อย ๆ แม้ไม่มีใครออนไลน์ (คิดจากเวลาที่ผ่านไป ไม่ต้องมีโค้ดฝั่งเซิร์ฟเวอร์)
   - ผลผลิต "ของพื้นฐาน" เท่านั้น และมีเพดานสะสม (รอเก็บได้ไม่เกิน cap) → เป็นตัวช่วยออกไปค้นหาได้นานขึ้น ไม่ใช่เครื่องผลิตของเด็ด
   - อัปเกรดเพิ่มช่อง (เริ่ม 2 ช่อง สูงสุด 5) ต้องใช้ของที่หาจากข้างนอก (มนุษย์: เศษวัสดุ • ซอมบี้: เนื้อเน่า)
   - rules ตรวจทั้งหมด: เวลาที่ผ่านไปจริง, เพดาน, ชนิดของที่ได้, ค่าอัปเกรด, ต้องอยู่ Safe Zone และมีชีวิต
   ========================================================= */
const BASE_P = { w: 7200000, m: 10800000, t: 14400000 }, BASE_CAP = { w: 4, m: 3, t: 3 };
const BASE_UP = [15, 40, 90], BASE_MIN_GAP = 1800;
function baseKind(k) {
  const z = state.profile?.faction === "zombie";
  return {
    w: { icon: "💧", name: "ตะแกรงรองน้ำฝน", item: "water", tip: "รองน้ำฝนสะสมไว้ให้" },
    t: z ? { icon: "🪤", name: "หลุมดักซาก", item: "rotten_meat", tip: "ดักซากสัตว์ให้" } : { icon: "🪤", name: "กับดักสัตว์", item: "canned_food", tip: "ดักสัตว์ป่าแล้วทำเป็นอาหารกระป๋องให้" },
    m: { icon: "🌱", name: "แปลงมอส", item: "moss", tip: "มอสสมานแผลโตเองในที่ร่ม" }
  }[k];
}
const baseLv = () => Math.max(0, Math.min(3, state.base?.lv || 0));
const baseSlots = () => 2 + baseLv();
const baseUpItem = () => (state.profile?.faction === "zombie" ? "rotten_meat" : "scrap");
const baseOn = () => T("base_on", 1) === 1;
function baseUnits(rec, now = serverNow()) {
  if (!rec || !BASE_P[rec.k] || typeof rec.t !== "number") return 0;
  return Math.max(0, Math.min(BASE_CAP[rec.k], Math.floor((now - rec.t) / BASE_P[rec.k])));
}
const baseReady = () => { let n = 0; for (let i = 1; i <= baseSlots(); i++) n += baseUnits(state.base?.["s" + i]); try { n += benchDone(); } catch { /* ข้าม */ } try { if (expReady()) n += 1; } catch { /* ข้าม */ } try { if (petReady()) n += 1; } catch { /* ข้าม */ } return n; };
const baseHm = (ms) => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} นาที` : `${m} นาที`; };
let baseLastTx = 0;
function baseInit() {
  if (state.baseOn || !state.uid) return; state.baseOn = true; state.base = {};
  const b = btn("🏠 ที่พัก", openBase, "btn ghost mini"); b.id = "btn-base"; const pr = $("btn-profile"); if (pr) pr.before(b);
  onValue(ref(db, "base/" + state.uid), (s) => { state.base = s.val() || {}; baseBadge(); baseAgain(); }, (e) => console.warn("base", e?.code || e));
  try { expInit(); } catch (e) { console.warn("exp init", e); }
  try { petInit(); } catch (e) { console.warn("pet init", e); }
  setInterval(() => { baseBadge(); baseAgain(); baseNotice(); try { expNotice(); } catch { /* ข้าม */ } }, 20000); setTimeout(baseNotice, 8000);
}
function baseBadge() { const b = $("btn-base"); if (!b) return; const n = baseOn() ? baseReady() : 0; b.textContent = n > 0 ? `🏠 ที่พัก (${n})` : "🏠 ที่พัก"; b.classList.toggle("hidden", !baseOn()); }
function baseNotice() {   // เตือนเบา ๆ ครั้งละไม่เกินชั่วโมงละหน เมื่อมีผลผลิตรอเก็บ
  if (!baseOn() || !state.profile) return; const n = baseReady(), last = fxGet("base_note", 0);
  if (n > 0 && serverNow() - last > 3600000) { fxSet("base_note", serverNow()); try { logLine(`🏠 ที่พักมีผลผลิต/งานรอรับ ${n} รายการ — แวะที่ Safe Zone แล้วกดรับได้เลย`, "info"); } catch { /* ข้าม */ } }
}
function baseAgain() { const m = $("base-modal"); if (!m || m.classList.contains("hidden")) return; renderBase(); }
function openBase() {
  if (!$("base-modal")) {
    const m = mk("div", "modal hidden"); m.id = "base-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🏠 ที่พักของคุณ"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "base-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  renderBase(); $("base-modal").classList.remove("hidden");
}
function baseErr(e) {
  const c = String(e?.code || "");
  if (c.startsWith("functions/")) return /internal|unavailable|deadline|unknown/.test(c) ? "เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง" : (e.message || errMsg(e));   // ข้อความไทยมาจากฟังก์ชัน (functions/base.js)
  return String(e?.code || e).includes("PERMISSION_DENIED") ? "ทำรายการไม่ได้ในตอนนี้ (ต้องอยู่ Safe Zone และมีชีวิต • หรือเวลายังไม่ถึง) ลองใหม่อีกครั้ง" : errMsg(e);
}
function baseCan() { return baseOn() && state.zone === "safe" && state.profile?.hp > 0; }
async function basePlace(i, k) {
  if (state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะวางสถานีได้"); state.busy = true;
  try { await baseCall({ a: "place", i, k }); toast(`${baseKind(k).icon} วาง${baseKind(k).name}แล้ว`); }
  catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
async function baseDismantle(i) {
  const rec = state.base?.["s" + i]; if (!rec || state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะรื้อได้");
  const u = baseUnits(rec); if (!confirm(`รื้อ${baseKind(rec.k).name}?${u > 0 ? ` (ผลผลิตที่รอเก็บ ${u} ชิ้นจะหายไป — เก็บก่อนดีกว่า)` : ""}`)) return;
  state.busy = true;
  try { await baseCall({ a: "dismantle", i }); toast("รื้อสถานีแล้ว"); } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
async function baseCollectOne(i, retry = true) {
  const rec = state.base?.["s" + i]; if (!rec) return 0;
  const K = rec.k, P = BASE_P[K], el = serverNow() - rec.t - 1500, raw = Math.floor(el / P);
  if (!(raw >= 1)) return 0;
  try { const r = await baseCall({ a: "collect", i }); const u = r?.n || 0; if (u) achBump("bcol", u); return u; }
  catch (e) {
    if (retry && String(e?.code || e).includes("failed-precondition")) { await new Promise((r) => setTimeout(r, 2500)); return baseCollectOne(i, false); }   // จังหวะเปลี่ยนสถานะเหลื่อมเล็กน้อย → ลองใหม่ 1 ครั้ง
    throw e;
  }
}
async function baseCollect(only) {
  if (state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะเก็บผลผลิตได้");
  state.busy = true; const got = {};
  try {
    for (let i = 1; i <= baseSlots(); i++) {
      if (only && only !== i) continue; if (!baseUnits(state.base?.["s" + i])) continue;
      const wait = BASE_MIN_GAP - (Date.now() - baseLastTx); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      baseLastTx = Date.now();
      const k = state.base["s" + i].k, n = await baseCollectOne(i); if (n) { const it = baseKind(k).item; got[it] = (got[it] || 0) + n; }
      await new Promise((r) => setTimeout(r, 400));   // ให้ข้อมูลกระเป๋า/ที่พักอัปเดตก่อนช่องถัดไป
    }
    const txt = Object.entries(got).map(([id, n]) => `${ITEMS[id].icon} ${ITEMS[id].name} ×${n}`).join(" ");
    if (txt) { toast(`🏠 เก็บผลผลิต: ${txt}`); logLine(`🏠 เก็บผลผลิตจากที่พัก: ${txt}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } } else toast("ยังไม่มีผลผลิตให้เก็บ");
  } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
async function baseUpgrade() {
  const lv = baseLv(), it = baseUpItem(), cost = BASE_UP[lv], have = state.inv[it];
  if (lv >= 3 || !cost) return; if (state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะอัปเกรดได้");
  if (!have || have.id !== it || have.qty < cost) return toast(`ต้องมี ${ITEMS[it].icon} ${ITEMS[it].name} ×${cost}`);
  state.busy = true;
  try {
    await baseCall({ a: "upgrade" });
    achBump("bup"); toast(`🏠 อัปเกรดที่พักแล้ว ได้ช่องเพิ่ม (รวม ${baseSlots() + 1} ช่อง)`);
  } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
function renderBase() {
  const body = $("base-body"); if (!body) return; body.innerHTML = "";
  if (!baseOn()) return body.append(mk("div", "muted", "ที่พักปิดอยู่ชั่วคราว"));
  const can = baseCan(), fac = state.profile?.faction === "zombie";
  body.append(mk("div", "muted", `${fac ? "รังของคุณ" : "ที่พักของคุณในค่าย"} — วางสถานีแล้วกลับมาเก็บผลผลิตได้เรื่อย ๆ แม้ไม่มีใครออนไลน์ ผลผลิตสะสมได้จำกัด (เต็มแล้วหยุดผลิต) ${can ? "" : "• ตอนนี้ไม่ได้อยู่ Safe Zone จึงดูได้อย่างเดียว"}`));
  { const tabs = mk("div", "subtabs"); tabs.style.paddingTop = "0";
    [["in", "🏠 ห้อง"], ["edit", "🛋️ จัดห้อง"], ["yard", "🌱 ลานบ้าน"]].forEach(([k, l]) => tabs.append(btn(l, () => { state.baseView = k; renderBase(); }, "btn mini " + ((state.baseView || "in") === k ? "primary" : "ghost"))));
    body.append(tabs);
    const sc = mk("div"); sc.id = "base-scene"; body.append(sc);
    try {
      if (state.baseView === "yard") { const D = state.gardenD, spent = Date.now() - (state.gardenAt || Date.now()); sc.innerHTML = baseYardSvg(baseLv(), fac, D ? D.plots : [], spent, state.uid); if (!D && !state.gardenBusy && !state.gardenLoad) { state.gardenLoad = true; gardenGo("state").finally(() => { state.gardenLoad = false; }); } }
      else if (state.baseView === "edit") { homeEdit(sc, body); return; }
      else { baseSceneFill(sc, baseSceneOwn()); homeLoad(); }
    } catch (e) { console.warn("scene", e); } }
  const slots = baseSlots(); let total = 0;
  for (let i = 1; i <= 5; i++) {
    const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
    if (i > slots) { c.append(mk("span", "muted", `🔒 ช่องที่ ${i} — ปลดล็อกด้วยการอัปเกรดที่พัก`)); body.append(c); continue; }
    const rec = state.base?.["s" + i];
    if (!rec || !BASE_P[rec.k]) {
      c.append(mk("b", "", `ช่องที่ ${i} (ว่าง)`));
      const row = mk("div"); row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
      ["w", "t", "m"].forEach((k) => { const kd = baseKind(k), b = btn(`${kd.icon} ${kd.name}`, () => basePlace(i, k), "btn ghost mini"); b.disabled = !can; b.title = `${kd.tip} • ได้ ${ITEMS[kd.item].name} ทุก ~${baseHm(BASE_P[k])} (เก็บสะสมได้สูงสุด ${BASE_CAP[k]})`; row.append(b); });
      c.append(row, mk("span", "muted", "วางแล้วเริ่มผลิตทันที • รื้อ/เปลี่ยนชนิดทีหลังได้"));
    } else {
      const kd = baseKind(rec.k), P = BASE_P[rec.k], cap = BASE_CAP[rec.k], u = baseUnits(rec), el = serverNow() - rec.t; total += u;
      c.append(mk("b", "", `${kd.icon} ${kd.name} (ช่อง ${i})`));
      c.append(worldBar(u >= cap ? 1 : (el % P) / P, u >= cap ? `เต็มแล้ว ${cap}/${cap}` : `ชิ้นถัดไปอีก ~${baseHm(P - (el % P))}`));
      const row = mk("div"); row.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px";
      row.append(mk("span", u ? "" : "muted", `${ITEMS[kd.item].icon} ${ITEMS[kd.item].name} รอเก็บ ${u}/${cap}`));
      const bs = mk("div"); bs.style.cssText = "display:flex;gap:6px";
      const cb = btn("เก็บ", () => baseCollect(i), "btn primary mini"); cb.disabled = !can || !u;
      const db2 = btn("รื้อ", () => baseDismantle(i), "btn ghost mini"); db2.disabled = !can;
      bs.append(cb, db2); row.append(bs); c.append(row);
    }
    body.append(c);
  }
  if (total > 0) { const ab = btn(`เก็บทั้งหมด (${total} ชิ้น)`, () => baseCollect(), "btn primary"); ab.disabled = !can; body.append(ab); }
  const lv = baseLv(), it = baseUpItem();
  const c2 = mk("div"); c2.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
  if (lv >= 3) c2.append(mk("b", "", "🏠 ที่พักอัปเกรดสูงสุดแล้ว (5 ช่อง)"));
  else {
    const cost = BASE_UP[lv], have = state.inv[it]?.id === it ? state.inv[it].qty : 0;
    c2.append(mk("b", "", `🔨 อัปเกรดที่พัก (ขั้น ${lv}/3)`), mk("span", "muted", `เพิ่ม 1 ช่อง ใช้ ${ITEMS[it].icon} ${ITEMS[it].name} ×${cost} (คุณมี ${have}) — ต้องออกไปหาข้างนอก`));
    const ub = btn(`อัปเกรด (${ITEMS[it].icon}×${cost})`, baseUpgrade, "btn primary mini"); ub.disabled = !can || have < cost; c2.append(ub);
  }
  body.append(c2);
  try { gardenRows(body); benchRows(body); expRows(body); petRows(body); labRows(body); decoRows(body); } catch (e) { console.warn("bench/deco rows", e); }
}

/* =========================================================
   39) 📅 สรุปจบวัน • 🍂 ฤดูกาล 28 วัน • 📖 สมุดสะสม • 🤝 พรจากมิตรภาพ NPC — ไม่ต้องแก้ rules
   - สรุปวัน: เทียบตัวนับความสำเร็จเดิม (ach/c) กับภาพถ่ายตอนเริ่มวัน เก็บในเครื่อง
   - ฤดูกาล: คำนวณจากวันที่ (ครบ 28 วันเปลี่ยนธีม) เป้าส่วนตัว 3 ข้อ ครบแล้วได้เหรียญ (เก็บเป็นบิตในตัวนับ seab/sea → ข้ามเครื่องไม่นับซ้ำ)
   - สมุดสะสม: ของ/สถานที่/เทศกาล/คลังลับที่เคยพบ (เก็บในเครื่อง) จำนวนรวมบันทึกในตัวนับ book
   - พรจากมิตรภาพ: ระดับหัวใจของมิราและเคน (ระบบ NPC เดิม) ปลดโบนัสเล็ก ๆ
   - ปรับได้จากแท็บ 🎛️: ds_on, sea_on, sea_scale, sea_str, npc_str
   ========================================================= */
/* ---------- ฤดูกาล ---------- */
const SEA_LEN = 28, SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / 86400000);   // เริ่มนับจากจันทร์ 7 ก.ย. 2569 (ค.ศ. 2026)
const SEA = [
  { icon: "🌧️", name: "ฤดูฝนฉ่ำ", tip: "น้ำดื่มและมอสเจอง่ายขึ้น", say: "ฝนตกพรำทั้งเมือง น้ำและมอสงอกตามซอกตึก ออกค้นหาได้ของพวกนี้ง่ายขึ้น", m: { w: 1.3, it: { moss: 1.25 } },
    goals: [["srch", 250, "ค้นหาของ 250 ครั้ง"], ["bcol", 30, "เก็บผลผลิตจากที่พัก 30 ชิ้น"], ["use", 40, "ใช้ไอเทม 40 ครั้ง"]] },
  { icon: "🦠", name: "ฤดูโรคระบาด", tip: "ซอมบี้ชุกขึ้นเล็กน้อย แต่ยารักษาเจอง่ายขึ้น", say: "โรคระบาดรอบใหม่แพร่ในเมือง ซอมบี้เพิ่มขึ้น แต่ก็มีคลังยาที่คนทิ้งไว้ให้คุ้ยเจอมากกว่าปกติ", m: { z: 1.08, it: { bandage: 1.3, medkit: 1.3, antidote: 1.3, serum: 1.3 } },
    goals: [["zwin", 40, "ชนะซอมบี้ 40 ครั้ง", "bite", 12, "กัดเหยื่อ 12 ครั้ง"], ["use", 60, "ใช้ไอเทม 60 ครั้ง"], ["craft", 25, "คราฟต์ของ 25 ชิ้น"]] },
  { icon: "🌾", name: "ฤดูเก็บเสบียง", tip: "อาหารและเศษวัสดุเจอง่ายขึ้น", say: "ถึงเวลาสะสมเสบียงก่อนฤดูแล้ง ทั้งเมืองมีอาหารกับเศษวัสดุให้เก็บมากกว่าปกติ", m: { f: 1.2, sc: 1.1 },
    goals: [["srch", 300, "ค้นหาของ 300 ครั้ง"], ["camp", 150, "สมทบโปรเจกต์ค่าย 150 แต้ม"], ["mkt", 15, "ซื้อ/ขายในตลาด 15 ครั้ง"]] },
  { icon: "❄️", name: "ฤดูหนาวเหน็บ", tip: "เนื้อเน่าและของหายากเจอง่ายขึ้น", say: "ลมหนาวพัดเข้าเมือง ซากสัตว์แข็งตัวเก็บง่ายขึ้น และของหายากที่ถูกหิมะกลบก็โผล่มา", m: { rm: 1.2, r: 1.1 },
    goals: [["zwin", 50, "ชนะซอมบี้ 50 ครั้ง", "bite", 15, "กัดเหยื่อ 15 ครั้ง"], ["zwar", 150, "สะสมแต้มศึกชิงโซน 150 แต้ม"], ["boss", 3, "ล้มมินิบอส 3 ครั้ง", "bite", 20, "กัดเหยื่อ 20 ครั้ง"]] }
];
const seaDay = (t = serverNow()) => coopDay(t) - SEA_EPOCH;
const seaIdx = (t = serverNow()) => Math.max(0, Math.floor(seaDay(t) / SEA_LEN));
const seaDayIn = (t = serverNow()) => Math.max(0, seaDay(t)) % SEA_LEN + 1;
const seaDef = (i = seaIdx()) => SEA[i % SEA.length];
const seaOn = () => T("sea_on", 1) === 1;
function fxSeasonMods(m, z) {
  if (!seaOn()) return; const s = Math.max(0, T("sea_str", 100)) / 100, d = seaDef().m; if (!s) return;
  ["z", "n", "r", "f", "w", "a", "rm", "sc"].forEach((q) => { if (d[q] && !(z === "safe" && q === "z")) m[q] *= Math.pow(d[q], s); });
  if (d.it) Object.entries(d.it).forEach(([id, v]) => { m.it[id] = (m.it[id] || 1) * Math.pow(v, s); });
}
function seaGoals() {
  const zom = state.profile?.faction === "zombie", sc = Math.max(10, T("sea_scale", 100)) / 100;
  return seaDef().goals.map((g) => zom && g[3] ? { k: g[3], n: Math.max(1, Math.round(g[4] * sc)), t: g[5] } : { k: g[0], n: Math.max(1, Math.round(g[1] * sc)), t: g[2] });
}
const seaBase = (s = seaIdx()) => fxGet("sea_b_" + s, null);
function seaProg() {   // [{k,n,t,v,done}]
  const c = state.ach?.c || {}, b = seaBase() || {};
  return seaGoals().map((g) => { const v = Math.max(0, (c[g.k] || 0) - (b[g.k] || 0)); return { ...g, v, done: v >= g.n }; });
}
const popcnt = (x) => { let n = 0; while (x > 0) { n += x & 1; x = Math.floor(x / 2); } return n; };
function seaTick(now) {
  if (!seaOn() || !state.profile || !state.ach?.loaded) return;
  const s = seaIdx(now), c = state.ach.c;
  if (!seaBase(s)) { const o = {}; ["srch", "bcol", "use", "zwin", "bite", "craft", "camp", "mkt", "zwar", "boss"].forEach((k) => { o[k] = c[k] || 0; }); fxSet("sea_b_" + s, o); }
  const d = seaDef(s), dayIn = seaDayIn(now);
  if (!fxGet("sea_ann_" + s, 0)) { fxSet("sea_ann_" + s, 1); radioPush(`📻 [ฤดูกาลใหม่] ${d.icon} ${d.name} — ${d.say} (ผ่านไป ${dayIn}/${SEA_LEN} วัน)`, now, true); try { logLine(`${d.icon} ${d.name} — ${d.tip} • เป้าฤดูกาลดูได้ที่แท็บ 🌍`, "system"); } catch { /* ข้าม */ } }
  if (dayIn >= SEA_LEN - 2 && !fxGet("sea_end_" + s, 0)) { fxSet("sea_end_" + s, 1); const left = SEA_LEN - dayIn + 1; radioPush(`📻 [ฤดูกาล] ${d.icon} ${d.name} เหลืออีก ${left} วัน — ใครยังทำเป้าฤดูกาลไม่ครบรีบเก็บเหรียญ`, now, true); }
  const pr = seaProg();
  pr.forEach((g, i) => { const k = `sea_g${i}_${s}`; if (g.done && !fxGet(k, 0)) { fxSet(k, 1); try { toast(`🍂 เป้าฤดูกาลสำเร็จ: ${g.t}`); logLine(`🍂 เป้าฤดูกาลสำเร็จ: ${g.t}`, "system"); } catch { /* ข้าม */ } } });
  if (pr.every((g) => g.done) && !fxGet("sea_medal_" + s, 0)) {
    fxSet("sea_medal_" + s, 1);
    achSet("sb" + s, 1); achSet("sea", seaMedals().size);   // ตัวนับแยกรายฤดู (เดิมใช้บิตมาสก์ seab ซึ่งติดเพดาน +3000 ตอนฤดูที่ 12)
    try { toast(`🏅 ได้เหรียญ ${d.icon} ${d.name}!`); logLine(`🏅 คุณทำเป้าฤดูกาลครบ ได้เหรียญ ${d.icon} ${d.name}`, "system"); sfx("boss"); } catch { /* ข้าม */ }
  }
}

/* ---------- สมุดสะสม ---------- */
const bookSet = (k) => new Set(fxGet("book_" + k, []));
function bookNote(k, id) {
  if (!id) return; const s = bookSet(k); if (s.has(id)) return; s.add(id); fxSet("book_" + k, [...s]); state.bookDirty = 1;
  try { toast(`📖 บันทึกลงสมุดสะสมแล้ว`); } catch { /* ข้าม */ }
}
const bookItems = () => Object.keys(ITEMS).filter((id) => !ITEMS[id].gmOnly && ITEMS[id].type !== "stat" && !(ITEMS[id].zombieOnly && state.profile?.faction !== "zombie"));
function bookScan() {
  if (!state.profile) return;
  const it = bookSet("i"); let ch = false;
  Object.values(state.inv || {}).forEach((x) => { if (x && ITEMS[x.id] && !ITEMS[x.id].gmOnly && ITEMS[x.id].type !== "stat" && !it.has(x.id)) { it.add(x.id); ch = true; } });
  if (ch) fxSet("book_i", [...it]);
  const z = bookSet("z"); if (state.zone && ZONES[state.zone] && !z.has(state.zone)) { z.add(state.zone); fxSet("book_z", [...z]); ch = true; }
  const f = new Set(fxGet("festseen", [])); const bf = bookSet("f"); f.forEach((x) => { if (!bf.has(x)) { bf.add(x); ch = true; } }); if (ch) fxSet("book_f", [...bf]);
  if (state.ach?.loaded) { const n = bookCount(); if (n > 0) achSet("book", n); }
}
function bookCount() {
  const it = bookSet("i"), ids = new Set(bookItems()); let n = 0; it.forEach((x) => { if (ids.has(x)) n++; });
  return n + [...bookSet("z")].filter((z) => ZONES[z]).length + [...bookSet("f")].filter((f) => FEST.some((x) => x.id === f)).length + [...bookSet("s")].filter((s) => SITE_TYPES.some((x) => x.id === s)).length;
}
function bookRows(b) {
  const sec = (title, all, known, label) => {
    const r = mk("div", "world-row"), ks = new Set(known), n = all.filter((x) => ks.has(x[0])).length;
    r.append(mk("div", "", `${title} ${n}/${all.length}`), worldBar(all.length ? n / all.length : 0, `${Math.round(100 * n / Math.max(1, all.length))}%`));
    const g = mk("div"); g.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-top:4px";
    all.forEach(([id, icon, name]) => { const c = mk("span", "fx-chip", ks.has(id) ? icon : "❓"); c.title = ks.has(id) ? name : "ยังไม่เคยพบ"; c.style.opacity = ks.has(id) ? "1" : "0.45"; g.append(c); });
    r.append(g); b.append(r);
  };
  sec("🎒 ของที่เคยพบ", bookItems().map((id) => [id, ITEMS[id].icon, ITEMS[id].name]), [...bookSet("i")]);
  sec("🗺️ สถานที่ที่เคยไป", Object.keys(ZONES).map((z) => [z, ZONES[z].icon, ZONES[z].name]), [...bookSet("z")]);
  sec("🎆 เทศกาลที่เคยร่วม", FEST.map((f) => [f.id, f.icon, f.name]), [...bookSet("f")]);
  sec("🛩️ คลังลับที่เคยค้นพบ", SITE_TYPES.map((s) => [s.id, s.icon, s.name]), [...bookSet("s")]);
  b.append(mk("div", "muted", "สมุดเก็บในเครื่องนี้ (ถ้าเปลี่ยนเครื่อง ของที่เคยเก็บแล้วจะเติมกลับมาเมื่อเจออีก) • ยอดรวมบันทึกในความสำเร็จ"));
}

/* ---------- พรจากมิตรภาพ NPC (มิรา/เคน — ระดับหัวใจจากระบบ NPC เดิม) ---------- */
const NPC_PERK = {
  mira: [{ h: 2, eff: { cut: 0.03 }, t: "มือนิ่ง: เลือดไหล/พิษ/เชื้อทำเลือดลดน้อยลง 3%" }, { h: 4, eff: { it: { moss: 1.15, bandage: 1.15 } }, t: "สายตาหมอ: มอสและผ้าพันแผลเจอมากขึ้น 15%" }, { h: 5, eff: { cut: 0.03 }, t: "ใจเย็นยามคับขัน: ทนสถานะดีขึ้นอีก 3%" }],
  kane: [{ h: 2, eff: { sc: 1.05 }, t: "รู้แหล่งของ: เศษวัสดุเจอมากขึ้น 5%" }, { h: 4, eff: { wear: 0.05 }, t: "ดูแลอาวุธเป็น: 5% ที่ตีแล้วไม่เสียความทน" }, { h: 5, eff: { z: 0.97 }, t: "รู้ทางหลบ: เจอซอมบี้ตอนค้นหาน้อยลง 3% (ซอมบี้: ได้เนื้อเน่ามากขึ้น 5%)" }]
};
function npcPerks() {
  const out = [], s = Math.max(0, T("npc_str", 100)) / 100;
  if (!s || !state.npc) return out;
  NPC_IDS.forEach((id) => { const h = npcHearts(id); (NPC_PERK[id] || []).forEach((p) => { if (h >= p.h) out.push({ id, ...p }); }); });
  return out;
}
function fxNpcMods(m, z) {
  const s = Math.max(0, T("npc_str", 100)) / 100, zom = state.profile?.faction === "zombie";
  npcPerks().forEach((p) => {
    Object.entries(p.eff).forEach(([q, v]) => {
      if (q === "cut" || q === "wear") return;
      if (q === "it") { Object.entries(v).forEach(([id, x]) => { m.it[id] = (m.it[id] || 1) * Math.pow(x, s); }); return; }
      if (q === "z" && zom) { m.rm *= Math.pow(1.05, s); return; }
      if (q === "z" && z === "safe") return;
      m[q] *= Math.pow(v, s);
    });
  });
}
const npcCut = () => { const s = Math.max(0, T("npc_str", 100)) / 100; return npcPerks().reduce((a, p) => a + (p.eff.cut || 0) * s, 0); };
const npcWear = () => { const s = Math.max(0, T("npc_str", 100)) / 100; return npcPerks().reduce((a, p) => a + (p.eff.wear || 0) * s, 0); };

/* ---------- สรุปจบวัน ---------- */
const DS_KEYS = [["srch", "🔍", "ค้นหา", "ครั้ง"], ["found", "🎒", "ของที่เจอ", "ชิ้น"], ["zwin", "⚔️", "ชนะซอมบี้", "ครั้ง"], ["bite", "🦷", "กัดเหยื่อ", "ครั้ง"], ["boss", "👹", "ล้มมินิบอส", "ครั้ง"], ["use", "🧪", "ใช้ไอเทม", "ครั้ง"], ["craft", "🔧", "คราฟต์", "ชิ้น"], ["bcol", "🏠", "เก็บผลผลิตที่พัก", "ชิ้น"], ["camp", "🏕️", "สมทบโปรเจกต์", "แต้ม"], ["zwar", "🚩", "แต้มศึกชิงโซน", "แต้ม"], ["mkt", "🏪", "ซื้อ/ขายในตลาด", "ครั้ง"]];
const dsSnap = () => { const c = state.ach?.c || {}, o = {}; DS_KEYS.forEach(([k]) => { o[k] = c[k] || 0; }); return o; };
const dsDelta = (b) => { const c = state.ach?.c || {}, d = {}; DS_KEYS.forEach(([k]) => { const x = (c[k] || 0) - ((b || {})[k] || 0); if (x > 0) d[k] = x; }); return d; };
function dsHints() {
  const h = [], now = serverNow();
  try { const n = typeof baseReady === "function" ? baseReady() : 0; if (n > 0) h.push(`🏠 ที่พักมีผลผลิต/งานรอรับ ${n} รายการ`); } catch { /* ข้าม */ }
  try { NPC_IDS.forEach((id) => { if (npcRec(id).d !== npcToday()) h.push(`${NPC_META[id].icon} วันนี้ยังไม่ได้คุยกับ${NPC_META[id].name} (${npcHeartStr(npcHearts(id))})`); }); } catch { /* ข้าม */ }
  try { const a = festActive(now); if (a.length) h.push(`${a[0].icon} ตอนนี้: ${a[0].name} — ${a[0].tip}`); else { const nx = FEST.map((f) => [f, festNext(f, now)]).filter(([, d]) => d !== null && d > 0).sort((x, y) => x[1] - y[1])[0]; if (nx && nx[1] <= 7) h.push(`${nx[0].icon} อีก ~${nx[1]} วัน: ${nx[0].name}`); } } catch { /* ข้าม */ }
  try { const fac = coopFac(), P = PROJ[fac].map((p) => [p, projCost(p) - projSum(p.id)]).filter(([, r]) => r > 0).sort((a, b) => a[1] - b[1])[0]; if (P) h.push(`${P[0].icon} ${P[0].name} ขาดอีก ${P[1]} แต้มจะเสร็จ`); } catch { /* ข้าม */ }
  try { if (seaOn()) { const pr = seaProg(), left = pr.filter((g) => !g.done); h.push(left.length ? `🍂 เป้าฤดูกาลเหลือ ${left.length}/3 ข้อ (ฤดูกาลเหลืออีก ${SEA_LEN - seaDayIn()} วัน)` : "🏅 เป้าฤดูกาลนี้ครบแล้ว"); } } catch { /* ข้าม */ }
  try { if (wgOn()) { const pr = wgProg(), n = pr.filter((g) => g.done).length; h.push(`🌍 เป้าหมายโลกวันนี้ ${n}/${pr.length} ข้อ${wgBuffLeft() > 0 ? ` • 🍀 โชคเหลือ ~${Math.ceil(wgBuffLeft() / 60000)} นาที` : ""}`); } } catch { /* ข้าม */ }
  try { const c = careerOf(); if (c && c.L < CAREER_MAX) h.push(`${c.def.icon} ${c.title}: อีก ${Math.max(1, CAREER_LV[c.L] - c.score)} แต้มถึงขั้นถัดไป`); } catch { /* ข้าม */ }
  return h;
}
function dsTick() {
  if (T("ds_on", 1) !== 1 || !state.profile || !state.ach?.loaded) return;
  const day = coopDay(), cur = fxGet("ds_cur", null);
  if (!cur || typeof cur.day !== "number") { fxSet("ds_cur", { day, b: dsSnap() }); return; }
  if (cur.day !== day) {
    fxSet("ds_last", { day: cur.day, span: Math.max(1, day - cur.day), d: dsDelta(cur.b) }); fxSet("ds_cur", { day, b: dsSnap() });
    if (state.dsSeen) { try { toast("📅 สรุปวันพร้อมแล้ว — กดปุ่ม 📅 ดูได้"); } catch { /* ข้าม */ } }
  }
  if (!state.dsSeen) {
    state.dsSeen = 1; const last = fxGet("ds_last", null);
    if (last && fxGet("ds_shown", 0) !== day) { fxSet("ds_shown", day); setTimeout(() => { try { dsOpen(); } catch { /* ข้าม */ } }, 5000); }
  }
}
function dsRender() {
  const body = $("ds-body"); if (!body) return; body.innerHTML = "";
  const list = (title, d, note) => {
    const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:4px"; c.append(mk("b", "", title)); if (note) c.append(mk("span", "muted", note));
    const rows = DS_KEYS.filter(([k]) => d[k] > 0); if (!rows.length) c.append(mk("span", "muted", "ยังไม่มีความเคลื่อนไหว"));
    rows.forEach(([k, ic, nm, un]) => c.append(mk("div", "", `${ic} ${nm}: ${d[k]} ${un}`))); body.append(c);
  };
  const last = fxGet("ds_last", null), cur = fxGet("ds_cur", null);
  if (last) list(last.span > 1 ? `📅 ${last.span} วันที่ผ่านมา` : "📅 เมื่อวาน", last.d || {});
  list("☀️ วันนี้จนถึงตอนนี้", dsDelta(cur?.b));
  try { wgRows(body); nearRows(body); } catch (e) { console.warn("wg/near rows", e); }
  const hs = dsHints(), c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:4px"; c.append(mk("b", "", "📌 วันนี้/พรุ่งนี้มีอะไรรอ"));
  if (!hs.length) c.append(mk("span", "muted", "ไม่มีอะไรค้างอยู่ — ออกไปสำรวจได้เลย")); hs.forEach((t) => c.append(mk("div", "", t))); body.append(c);
  body.append(btn("📜 บันทึกประจำฤดูกาล", () => { try { chOpen(); } catch (e) { toast("เปิดบันทึกไม่สำเร็จ"); } }, "btn ghost"));
}
function dsOpen() {
  if (!$("ds-modal")) {
    const m = mk("div", "modal hidden"); m.id = "ds-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "📅 สรุปวัน"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "ds-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  dsRender(); $("ds-modal").classList.remove("hidden");
}

/* ---------- ตัวประสาน: tick + แผงโลก ---------- */
function fxTick3(now) {
  try { seaTick(now); } catch (e) { console.warn("seaTick", e); }
  try { bookScan(); } catch (e) { console.warn("bookScan", e); }
  try { dsTick(); } catch (e) { console.warn("dsTick", e); }
  try { wgTick(now); if (now - (state.bkAt || 0) > 60000) { state.bkAt = now; bookSync(); } } catch (e) { console.warn("wgTick/bookSync", e); }
}
function fxWorldRows3(box) {
  fxSection(box, "ds", "📅 สรุปวัน", (b) => {
    const hs = dsHints(); hs.slice(0, 6).forEach((t) => b.append(mk("div", "", t))); if (!hs.length) b.append(mk("div", "muted", "ไม่มีอะไรค้างอยู่"));
    b.append(btn("📅 ดูสรุปเต็ม", dsOpen, "btn ghost mini"));
  }, true);
  if (seaOn()) fxSection(box, "sea", `🍂 ฤดูกาล: ${seaDef().icon} ${seaDef().name}`, (b) => {
    const d = seaDef(), dayIn = seaDayIn(), r = mk("div", "world-row evt-live");
    r.append(mk("div", "", `${d.icon} ${d.name} — วันที่ ${dayIn}/${SEA_LEN}`), worldBar(dayIn / SEA_LEN, `เหลืออีก ${SEA_LEN - dayIn + 1} วัน`), mk("div", "muted", d.tip)); b.append(r);
    seaProg().forEach((g) => { const x = mk("div", "world-row" + (g.done ? " evt-live" : "")); x.append(mk("div", "", `${g.done ? "✅ " : ""}${g.t}`), worldBar(Math.min(1, g.v / g.n), `${Math.min(g.v, g.n)}/${g.n}`)); b.append(x); });
    const mask = state.ach?.c?.seab || 0; b.append(mk("div", "muted", `เป้าส่วนตัวครบทั้ง 3 ข้อ = เหรียญประจำฤดู • เหรียญที่สะสม ${popcnt(mask)} เหรียญ`));
  }, true);
  fxSection(box, "book", `📖 สมุดสะสม (${bookCount()})`, (b) => bookRows(b), false);
  fxSection(box, "perk", "🤝 พรจากมิตรภาพ", (b) => {
    NPC_IDS.forEach((id) => {
      const h = npcHearts(id), r = mk("div", "world-row"); r.append(mk("div", "", `${NPC_META[id].icon} ${NPC_META[id].name} ${npcHeartStr(h)}`));
      (NPC_PERK[id] || []).forEach((p) => r.append(mk("div", h >= p.h ? "" : "muted", `${h >= p.h ? "✅" : "🔒 ❤️" + p.h} ${p.t}`))); b.append(r);
    });
    b.append(mk("div", "muted", "คุยและให้ของขวัญประจำวันในค่ายเพื่อเพิ่มหัวใจ"));
  }, false);
}

/* =========================================================
   40) 🛠️ โต๊ะงานตั้งเวลา • 🪟 ของตกแต่งที่พัก (ต้องใช้ rules v33: base/{uid}/j1,j2 และ base/{uid}/deco)
   - โต๊ะงาน: ใส่วัตถุดิบแล้วรอเวลา (หักของทันทีตอนเริ่ม) เสร็จแล้วกลับมารับ — สูตรตายตัวใน rules (แลกของแบบเสียเปรียบเล็กน้อย/เท่าทุน)
     ช่อง 1 ฟรี ช่อง 2 ปลดล็อกที่ที่พักขั้น 2
   - ของตกแต่ง: จ่ายของเพื่อปลดล็อกถาวร (มนุษย์: เศษวัสดุ • ซอมบี้: เนื้อเน่า) ไม่มีผลต่อสมดุลเกม คนอื่นเห็นได้ในหน้า "ประวัติ" ของเรา
   ========================================================= */
const BENCH = {
  1: { in: ["water", 2], out: ["water_jug", 1], ms: 7200000, name: "กลั่นน้ำสะอาด" },
  2: { in: ["canned_food", 2], out: ["soup", 2], ms: 10800000, name: "ตุ๋นซุปอุ่น" },
  3: { in: ["moss", 3], out: ["bandage", 2], ms: 10800000, name: "หมักมอสทำผ้าพันแผล" },
  4: { in: ["bandage", 3], out: ["medkit", 1], ms: 14400000, name: "ประกอบชุดปฐมพยาบาล" },
  5: { in: ["canned_food", 2], out: ["army_meal", 1], ms: 14400000, name: "อุ่นอาหารทหาร" },
  6: { in: ["rotten_meat", 4], out: ["bandage", 1], ms: 10800000, name: "สกัดเนื้อเน่า", z: 1 }
};
const DECO = [
  ["d0", "🪴", "กระถางต้นไม้", 10], ["d1", "🕯️", "เทียนไข", 10], ["d2", "🧸", "ตุ๊กตาผ้า", 15], ["d3", "📻", "วิทยุเก่า", 15],
  ["d4", "🖼️", "รูปถ่ายครอบครัว", 20], ["d5", "🪑", "เก้าอี้โยก", 25], ["d6", "🏺", "แจกันโบราณ", 30], ["d7", "🎸", "กีตาร์เก่า", 40],
  ["d8", "🔭", "กล้องโทรทรรศน์", 50], ["d9", "🏆", "ถ้วยรางวัล", 60], ["d10", "🛋️", "โซฟานุ่ม", 80], ["d11", "🌌", "โคมไฟดวงดาว", 100]
];
const benchSlots = () => (baseLv() >= 2 ? 2 : 1);
const benchLeft = (rec, now = serverNow()) => (rec && BENCH[rec.r] && typeof rec.t === "number" ? rec.t + BENCH[rec.r].ms - now : 1e15);
const benchDone = () => { let n = 0; for (let j = 1; j <= benchSlots(); j++) { const r = state.base?.["j" + j]; if (r && benchLeft(r) <= 0) n++; } return n; };
const benchHave = async (id) => (await get(ref(db, `inventory/${state.uid}/${id}`))).val();
async function benchStart(j, r) {
  const R = BENCH[r]; if (!R || state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะใช้โต๊ะงานได้"); state.busy = true;
  try {
    const have = await benchHave(R.in[0]);
    if (!have || have.id !== R.in[0] || have.qty < R.in[1]) { toast(`ต้องมี ${ITEMS[R.in[0]].icon} ${ITEMS[R.in[0]].name} ×${R.in[1]}`); return; }
    await baseCall({ a: "benchStart", j, r: String(r) });
    toast(`🛠️ เริ่ม${R.name}`);
  } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
async function benchCancel(j) {
  const rec = state.base?.["j" + j]; if (!rec || state.busy || !baseCan()) return;
  if (!confirm("ยกเลิกงานนี้? วัตถุดิบที่ใส่ไปแล้วจะไม่คืน")) return; state.busy = true;
  try { await baseCall({ a: "benchCancel", j }); toast("ยกเลิกงานแล้ว"); } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
async function benchCollectOne(j, retry = true) {
  const rec = state.base?.["j" + j], R = rec && BENCH[rec.r]; if (!R || benchLeft(rec) > -1500) return false;
  try { const r = await baseCall({ a: "benchCollect", j }); achBump("bcol", r?.n || R.out[1]); return true; }
  catch (e) { if (retry && String(e?.code || e).includes("failed-precondition")) { await new Promise((r) => setTimeout(r, 2500)); return benchCollectOne(j, false); } throw e; }
}
async function benchCollect(j) {
  if (state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะรับงานได้"); state.busy = true;
  try {
    const wait = BASE_MIN_GAP - (Date.now() - baseLastTx); if (wait > 0) await new Promise((r) => setTimeout(r, wait)); baseLastTx = Date.now();
    const rec = state.base?.["j" + j], R = rec && BENCH[rec.r];
    if (await benchCollectOne(j)) { toast(`🛠️ ได้ ${ITEMS[R.out[0]].icon} ${ITEMS[R.out[0]].name} ×${R.out[1]}`); logLine(`🛠️ ${R.name}เสร็จ ได้ ${ITEMS[R.out[0]].name} ×${R.out[1]}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }
    else toast("งานยังไม่เสร็จ");
  } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
function benchRows(body) {
  const can = baseCan(), zom = state.profile?.faction === "zombie", slots = benchSlots();
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px";
  c.append(mk("b", "", `🛠️ โต๊ะงาน (${slots}/2 ช่อง)`), mk("span", "muted", "ใส่วัตถุดิบแล้วรอ เสร็จแล้วกลับมารับได้ แม้ไม่ได้ออนไลน์ • ช่อง 2 ปลดล็อกที่ที่พักขั้น 2"));
  for (let j = 1; j <= 2; j++) {
    const r = mk("div"); r.style.cssText = "border-top:1px solid var(--line);padding-top:6px;display:grid;gap:6px";
    if (j > slots) { r.append(mk("span", "muted", `🔒 ช่องงาน ${j} — อัปเกรดที่พักถึงขั้น 2`)); c.append(r); continue; }
    const rec = state.base?.["j" + j];
    if (rec && BENCH[rec.r]) {
      const R = BENCH[rec.r], left = benchLeft(rec);
      r.append(mk("b", "", `${ITEMS[R.in[0]].icon}×${R.in[1]} → ${ITEMS[R.out[0]].icon}×${R.out[1]} ${R.name}`));
      r.append(worldBar(left <= 0 ? 1 : 1 - left / R.ms, left <= 0 ? "เสร็จแล้ว" : `อีก ~${baseHm(left)}`));
      const row = mk("div"); row.style.cssText = "display:flex;gap:6px";
      const cb = btn(`รับ ${ITEMS[R.out[0]].icon}×${R.out[1]}`, () => benchCollect(j), "btn primary mini"); cb.disabled = !can || left > 0;
      const xb = btn("ยกเลิก", () => benchCancel(j), "btn ghost mini"); xb.disabled = !can; row.append(cb, xb); r.append(row);
    } else {
      r.append(mk("b", "", `ช่องงาน ${j} (ว่าง)`));
      const row = mk("div"); row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
      Object.entries(BENCH).filter(([, R]) => !R.z || zom).forEach(([id, R]) => {
        const have = state.inv[R.in[0]]?.id === R.in[0] ? state.inv[R.in[0]].qty : 0;
        const b = btn(`${ITEMS[R.in[0]].icon}×${R.in[1]} → ${ITEMS[R.out[0]].icon}×${R.out[1]}`, () => benchStart(j, +id), "btn ghost mini");
        b.disabled = !can || have < R.in[1]; b.title = `${R.name} • ใช้เวลา ~${baseHm(R.ms)} • คุณมี ${ITEMS[R.in[0]].name} ${have}`; row.append(b);
      });
      r.append(row, mk("span", "muted", "เลื่อนเมาส์/กดค้างที่ปุ่มดูชื่อสูตรและเวลา"));
    }
    c.append(r);
  }
  body.append(c);
}
/* ---- ของตกแต่ง ---- */
const decoOwned = () => state.base?.deco || {};
async function decoBuy(d) {
  const row = DECO.find((x) => x[0] === d), it = baseUpItem(); if (!row || decoOwned()[d] || state.busy || !baseCan()) return toast("ต้องอยู่ที่ Safe Zone ถึงจะซื้อของตกแต่งได้");
  const cost = row[3]; state.busy = true;
  try {
    const have = await benchHave(it);
    if (!have || have.id !== it || have.qty < cost) { toast(`ต้องมี ${ITEMS[it].icon} ${ITEMS[it].name} ×${cost}`); return; }
    await baseCall({ a: "deco", d });
    toast(`${row[1]} ตกแต่งที่พักด้วย${row[2]}แล้ว`); try { sfx("boss"); } catch { /* ข้าม */ }
  } catch (e) { toast(baseErr(e)); } finally { state.busy = false; renderBase(); }
}
function decoRows(body) {
  const own = decoOwned(), can = baseCan(), it = baseUpItem(), have = state.inv[it]?.id === it ? state.inv[it].qty : 0, n = DECO.filter((x) => own[x[0]]).length;
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
  c.append(mk("b", "", `🪟 ของตกแต่งที่พัก (${n}/${DECO.length})`));
  const shelf = mk("div"); shelf.style.cssText = "font-size:26px;letter-spacing:4px;min-height:34px"; shelf.textContent = DECO.filter((x) => own[x[0]]).map((x) => x[1]).join(" ") || "ยังว่างเปล่า…"; c.append(shelf);
  c.append(mk("span", "muted", `ซื้อด้วย ${ITEMS[it].icon} ${ITEMS[it].name} (คุณมี ${have}) • ไม่มีผลต่อการเล่น แต่คนอื่นเห็นในหน้าประวัติของคุณ`));
  DECO.filter((x) => !own[x[0]]).forEach(([d, ic, nm, cost]) => {
    const r = mk("div"); r.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px";
    r.append(mk("span", have >= cost ? "" : "muted", `${ic} ${nm}`)); const b = btn(`${ITEMS[it].icon}×${cost}`, () => decoBuy(d), "btn ghost mini"); b.disabled = !can || have < cost; r.append(b); c.append(r);
  });
  body.append(c);
}
async function baseDecoLine(uid) {
  try { const v = (await get(ref(db, `base/${uid}/deco`))).val() || {}; const t = DECO.filter((x) => v[x[0]] === true).map((x) => x[1]).join(" "); return t ? `🏠 ของตกแต่งที่พัก: ${t}` : ""; } catch { return ""; }
}

/* =========================================================
   41) 🎮 มินิเกมตอนค้นลึก — 📻 รหัสวิทยุ / 🌲 เสียงในป่า (ฝั่ง client ล้วน ไม่ใช้ rules)
   - กดค้นลึก → เล่นมินิเกมจำลำดับสั้นๆ (ข้ามได้) → ผลทำให้ตารางของที่ค้นดีขึ้นเล็กน้อยเฉพาะครั้งนั้น
   - ได้ครบ = ว่างเปล่า −40% / ของหายาก +50% / ซอมบี้ −15% • พลาดตัวเดียว = ว่างเปล่า −20% / ของหายาก +25%
   - ปรับด้วย mg_on / mg_str ใน 🎛️ และปิดเฉพาะเครื่องด้วยปุ่ม 🎮
   ========================================================= */
const MG_LEN = 4;
const MG_FOREST = [["🐦", "จิ๊บๆ"], ["🦉", "ฮู้~"], ["🐸", "อ๊บ"], ["🐺", "หอน…"], ["🦗", "หริ่งๆ"]];
const mgOn = () => T("mg_on", 1) === 1 && !fxGet("mg_off", 0);
function mgScore(seq, inp) { let n = 0; for (let i = 0; i < seq.length; i++) if (inp[i] === seq[i]) n++; return n; }
function mgTier(score, len = MG_LEN) { return score >= len ? 2 : score >= len - 1 ? 1 : 0; }
function mgTable(t, tier, isZ) {
  if (!tier) return t;
  const s = T("mg_str", 100) / 100; if (!(s > 0)) return t;
  const lerp = (m) => 1 + (m - 1) * s;
  const eM = lerp(tier === 2 ? 0.6 : 0.8), rM = lerp(tier === 2 ? 1.5 : 1.25), zM = lerp(tier === 2 ? 0.85 : 1);
  return t.map((d) => d.id === null ? { ...d, w: d.w * eM }
    : d.id === "zombie" ? { ...d, w: d.w * zM }
    : (d.id === "boss" || d.id === "rotten_meat") ? d
    : d.w <= 5 ? { ...d, w: d.w * rM } : d);
}
function mgBeep(i) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    mgBeep.c = mgBeep.c || new AC(); const c = mgBeep.c, o = c.createOscillator(), g = c.createGain();
    o.frequency.value = 300 + i * 110; g.gain.value = 0.04; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.16);
  } catch { /* ข้าม */ }
}
// เล่น 1 รอบ คืนค่า tier 0/1/2 (ข้าม/หมดเวลา/ปิด = ตามที่ตอบได้ถึงตอนนั้น)
function mgPlay(kind, isZ) {
  return new Promise((resolve) => {
    let m = $("mg-modal");
    if (!m) {
      m = mk("div", "modal hidden"); m.id = "mg-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
      m.append(mk("div", "modal-box")); document.body.append(m);
    }
    const box = m.firstChild; box.textContent = ""; box.style.maxWidth = "340px";
    const radio = kind === "radio";
    const syms = radio ? ["1", "2", "3", "4", "5", "6", "7", "8", "9"] : MG_FOREST.map((x) => x[0]);
    const seq = Array.from({ length: MG_LEN }, () => Math.floor(Math.random() * syms.length));
    const inp = []; let alive = true, phase = "show"; const timers = [];
    const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); };
    const title = radio ? (isZ ? "🧠 เสียงเรียกของฝูง" : "📻 วิทยุส่งรหัสมา") : "🌲 เสียงในป่า";
    const hint = mk("div", "muted"); hint.style.textAlign = "center";
    const stage = mk("div"); stage.style.cssText = "font-size:54px;text-align:center;min-height:76px;line-height:76px";
    const cap = mk("div", "muted"); cap.style.cssText = "text-align:center;min-height:20px";
    const typed = mk("div"); typed.style.cssText = "font-size:26px;text-align:center;min-height:34px;letter-spacing:6px";
    const bar = mk("div"); bar.style.cssText = "height:6px;border-radius:4px;background:var(--line,#333);overflow:hidden;display:none";
    const fill = mk("div"); fill.style.cssText = "height:100%;width:100%;background:var(--accent,#7c3);transition:width .2s linear"; bar.append(fill);
    const pad = mk("div"); pad.style.cssText = `display:grid;gap:8px;grid-template-columns:repeat(${radio ? 3 : 5},1fr)`;
    const keys = syms.map((s, i) => { const b = btn(s, () => press(i), "btn ghost"); b.style.fontSize = radio ? "22px" : "26px"; b.disabled = true; pad.append(b); return b; });
    const foot = mk("div"); foot.style.cssText = "display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap";
    const skip = btn("ข้าม (ค้นแบบไม่มีโบนัส)", () => finish(true), "btn ghost mini");
    const off = btn("🔕 ปิดมินิเกมในเครื่องนี้", () => { fxSet("mg_off", 1); try { mgBtnSync(); } catch { /* ข้าม */ } toast("ปิดมินิเกมแล้ว (เปิดใหม่ด้วยปุ่ม 🎮)"); finish(true); }, "btn ghost mini");
    foot.append(skip, off);
    const head = mk("div", "modal-head"); head.append(mk("h2", "", title));
    box.append(head, hint, stage, cap, typed, bar, pad, foot);
    m.classList.remove("hidden");
    function press(i) {
      if (!alive || phase !== "input") return;
      inp.push(i); mgBeep(i); typed.textContent = inp.map((x) => radio ? "●" : syms[x]).join(" ");
      if (inp.length >= MG_LEN) finish(false);
    }
    let left = 12000, iv = null;
    function finish(skipped) {
      if (!alive) return; alive = false; phase = "done"; timers.forEach(clearTimeout); if (iv) clearInterval(iv);
      keys.forEach((k) => { k.disabled = true; });
      const sc = skipped && !inp.length ? 0 : mgScore(seq, inp), tier = skipped ? 0 : mgTier(sc);
      stage.textContent = skipped ? "…" : tier === 2 ? "✅" : tier === 1 ? "👌" : "❌";
      cap.textContent = skipped ? "ข้ามมินิเกม" : tier === 2 ? "ถูกครบ! โชคดีมาก" : tier === 1 ? "เกือบครบ โชคดีขึ้นเล็กน้อย" : "พลาด… ค้นแบบปกติ";
      if (!skipped && tier === 2) { try { achBump("mgp"); } catch { /* ข้าม */ } }
      if (!skipped) { try { logLine(`${radio ? "📻" : "🌲"} มินิเกมค้นลึก: ${tier === 2 ? "ถูกครบ ได้โบนัสเต็ม" : tier === 1 ? "เกือบครบ ได้โบนัสเล็กน้อย" : "พลาด ไม่มีโบนัส"}`, "info"); } catch { /* ข้าม */ } }
      setTimeout(() => { m.classList.add("hidden"); resolve(tier); }, skipped ? 0 : 700);
    }
    hint.textContent = radio ? (isZ ? "ฟังเสียงเรียก จำตัวเลขที่ผุดขึ้นมา" : "จำตัวเลขที่วิทยุส่งมาทีละตัว") : "ฟัง/ดูเสียงที่ดังขึ้นทีละเสียง แล้วกดตามลำดับ";
    let k = 0;
    const step = () => {
      if (!alive) return;
      if (k >= seq.length) {
        stage.textContent = "❓"; cap.textContent = "ตาคุณแล้ว กดตามลำดับ"; phase = "input"; keys.forEach((x) => { x.disabled = false; }); bar.style.display = "block";
        iv = setInterval(() => { left -= 200; fill.style.width = Math.max(0, left / 120) + "%"; if (left <= 0) finish(false); }, 200); return;
      }
      const s = seq[k]; stage.textContent = syms[s]; cap.textContent = radio ? "…ปี๊บ" : MG_FOREST[s][1]; mgBeep(s); k++;
      later(() => { stage.textContent = "·"; cap.textContent = ""; later(step, 250); }, 650);
    };
    later(step, 700);
  });
}
async function mgRun(isZ) {
  if (!mgOn()) return 0;
  if (state.mgKeep != null) return state.mgKeep;   // ลองใหม่หลังโดน rules ปฏิเสธ = ใช้ผลเดิม ไม่เล่นซ้ำ
  const t = await mgPlay(Math.random() < 0.5 ? "radio" : "forest", isZ);
  state.mgKeep = t; return t;
}
function mgBtnSync() {
  const b = $("btn-mg"); if (!b) return;
  const on = mgOn(); b.classList.toggle("active", on); b.style.opacity = on ? "1" : "0.5"; b.hidden = T("mg_on", 1) !== 1;
  b.title = on ? "มินิเกมก่อนค้นลึก: เปิด (กดเพื่อปิดเฉพาะเครื่องนี้)" : "มินิเกมก่อนค้นลึก: ปิด (กดเพื่อเปิด)";
}
function mgBtnInit() {
  if ($("btn-mg") || !$("btn-deep")) return;
  const b = btn("🎮", () => { fxSet("mg_off", fxGet("mg_off", 0) ? 0 : 1); mgBtnSync(); toast(mgOn() ? "เปิดมินิเกมตอนค้นลึกแล้ว" : "ปิดมินิเกมตอนค้นลึกในเครื่องนี้แล้ว"); }, "btn ghost mini");
  b.id = "btn-mg"; $("btn-deep").after(b); mgBtnSync();
}

/* =========================================================
   42) 🏡 ภาพห้องที่พัก (SVG วาดจากข้อมูลจริง) — ฝั่ง client ล้วน
   - หน้าตาบ้านเปลี่ยนตามขั้น: เพิงผ้าใบ → กระท่อมไม้ → บ้านไม้ → บ้านเสริมเหล็ก (ซอมบี้: รังดิน → รังเถาวัลย์ → ถ้ำรัง → ถ้ำฝูง)
   - ของตกแต่งที่ซื้อแล้วโผล่ในตำแหน่งของมัน (แตะดูชื่อ) • สถานี/โต๊ะงานเป็นของในฉาก มีประกายเมื่อมีของรอเก็บ
   - หน้าต่างเปลี่ยนตามเวลาจริง (กลางวัน/พลบค่ำ/กลางคืน+ดาว) • สีผนัง/พรมต่างกันตามผู้เล่น (hash ของ uid)
   - คนอื่นเห็นห้องของเราได้ในหน้าประวัติ (จากของตกแต่งที่ rules อ่านได้อยู่แล้ว)
   ========================================================= */
const SCN_POS = {   // ตำแหน่งของตกแต่ง [x, y, ขนาด, เหนือพื้นหรือไม่]
  d0: [296, 168, 30], d1: [150, 124, 18], d2: [104, 176, 24], d3: [40, 68, 22], d4: [138, 48, 28], d5: [246, 176, 38],
  d6: [176, 125, 22], d7: [78, 158, 32], d8: [200, 160, 36], d9: [88, 66, 20], d10: [150, 178, 48], d11: [172, 30, 26]
};
const SCN_PAL = [   // [ผนัง, เส้นผนัง, พื้น, เส้นพื้น, พรม, ผ้าม่าน]
  ["#7a5a3c", "#6a4c31", "#8d6a45", "#76573a", "#a3433a", "#c0584b"],
  ["#5d6f5a", "#4f6050", "#7c6a4c", "#665640", "#3f6c8c", "#4b86a8"],
  ["#6c5a73", "#5b4a62", "#85694f", "#6e553f", "#c58a2f", "#d6a248"],
];
const SCN_ZPAL = [["#2f2a3a", "#262131", "#3a3128", "#2d261f", "#5a2b3f", "#7a3a52"], ["#26332f", "#1f2b28", "#38301f", "#2c2518", "#3a5a4a", "#4f7a64"]];
function scnHash(s) { let h = 7; s = String(s || "x"); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function scnSky() {
  let hr = 12, moon = "🌙";
  try { hr = new Date(serverNow() + 7 * 3600000).getUTCHours(); } catch { /* ข้าม */ }
  try { const mp = fxMoon(serverNow()); moon = mp === "full" ? "🌕" : mp === "new" ? "🌑" : "🌙"; } catch { /* ข้าม */ }
  if (hr >= 7 && hr < 17) return { top: "#7fc4ee", bot: "#cfeaf7", night: false, sun: true, moon };
  if (hr >= 17 && hr < 19 || hr >= 5 && hr < 7) return { top: "#e98a52", bot: "#f6cf8a", night: false, sun: true, moon };
  return { top: "#0d1230", bot: "#2a2f66", night: true, sun: false, moon };
}
// o: { lv, deco:{d0:true..}, zombie, uid, stations:[{k,u,cap,locked}], bench:[{state:'empty'|'busy'|'ready'|'locked'}] }
function baseSceneSvg(o) {
  const lv = Math.max(0, Math.min(3, o.lv | 0)), z = !!o.zombie, h = scnHash(o.uid);
  const pal = o.pal && o.pal.length === 6 ? o.pal : z ? SCN_ZPAL[h % SCN_ZPAL.length] : SCN_PAL[h % SCN_PAL.length], sky = scnSky();
  const deco = o.deco || {}, P = [];
  const t = (x, y, size, ch, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" ${extra}>${ch}</text>`;
  P.push(`<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ภาพห้องที่พัก" style="width:100%;height:auto;border-radius:12px;display:block;background:#111">`);
  P.push(`<style>.fl{animation:scnfl 1.6s ease-in-out infinite;transform-origin:center;transform-box:fill-box}@keyframes scnfl{0%,100%{opacity:1}50%{opacity:.55}}.sp{animation:scnsp 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes scnsp{0%,100%{transform:scale(.8);opacity:.7}50%{transform:scale(1.25);opacity:1}}.pu{animation:scnpu 3s ease-in-out infinite}@keyframes scnpu{0%,100%{opacity:.25}50%{opacity:.5}}.it{cursor:pointer}</style>`);
  P.push(`<defs><linearGradient id="scnsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.bot}"/></linearGradient><radialGradient id="scnglow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>`);
  // ผนัง + พื้น
  P.push(`<rect width="320" height="200" fill="${pal[0]}"/>`);
  if (z) { for (let i = 0; i < 9; i++) P.push(`<ellipse cx="${(i * 41 + 10) % 320}" cy="${20 + (i * 37) % 90}" rx="${22 + i % 3 * 6}" ry="${10 + i % 2 * 5}" fill="${pal[1]}" opacity=".7"/>`); }
  else if (lv === 0) { for (let i = 0; i < 8; i++) P.push(`<path d="M${i * 44 - 8} 0 L${i * 44 + 22} 140" stroke="${pal[1]}" stroke-width="2" opacity=".7"/>`); P.push(`<rect x="238" y="96" width="26" height="22" fill="#b9a46b" opacity=".6" transform="rotate(-4 250 107)"/>`); }
  else { for (let x = 0; x < 320; x += 20) P.push(`<line x1="${x}" y1="0" x2="${x}" y2="140" stroke="${pal[1]}" stroke-width="2"/>`); }
  if (lv >= 2 && !z) P.push(`<rect x="0" y="12" width="320" height="8" fill="#3c2a1b"/><rect x="0" y="0" width="320" height="6" fill="#2d2014"/>`);
  if (lv >= 3) { P.push(`<rect x="0" y="0" width="14" height="140" fill="#59606a"/><rect x="306" y="0" width="14" height="140" fill="#59606a"/>`); for (let y = 10; y < 140; y += 26) P.push(`<circle cx="7" cy="${y}" r="2.5" fill="#8a929c"/><circle cx="313" cy="${y}" r="2.5" fill="#8a929c"/>`); }
  P.push(`<rect y="140" width="320" height="60" fill="${pal[2]}"/>`);
  for (let y = 150; y < 200; y += 14) P.push(`<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="${pal[3]}" stroke-width="2"/>`);
  P.push(`<rect y="136" width="320" height="6" fill="${pal[3]}"/>`);
  // หน้าต่าง
  P.push(`<g><rect x="206" y="28" width="72" height="62" rx="${z ? 28 : 3}" fill="url(#scnsky)" stroke="#2b1d12" stroke-width="5"/>`);
  if (sky.night) { for (let i = 0; i < 9; i++) P.push(`<circle cx="${212 + (i * 23) % 60}" cy="${34 + (i * 17) % 44}" r="1.1" fill="#fff"/>`); P.push(t(256, 56, 20, sky.moon)); }
  else P.push(t(256, 56, 20, "☀️"));
  if (!z) P.push(`<line x1="242" y1="28" x2="242" y2="90" stroke="#2b1d12" stroke-width="3"/><line x1="206" y1="59" x2="278" y2="59" stroke="#2b1d12" stroke-width="3"/>`);
  if (lv >= 1 && !z) P.push(`<path d="M200 24 Q212 60 204 96 L216 96 Q222 58 214 24 Z" fill="${pal[5]}" opacity=".95"/><path d="M284 24 Q272 60 280 96 L268 96 Q262 58 270 24 Z" fill="${pal[5]}" opacity=".95"/>`);
  P.push(`</g>`);
  // ประตู / ทางเข้า
  if (z) P.push(`<path d="M14 140 Q14 74 44 70 Q74 74 74 140 Z" fill="#0b0912"/><circle cx="30" cy="104" r="3" fill="#c33" class="fl"/><circle cx="40" cy="104" r="3" fill="#c33" class="fl"/>`);
  else if (lv === 0) P.push(`<path d="M10 140 L44 66 L78 140 Z" fill="#3a3a30"/><path d="M44 66 L44 140" stroke="#222" stroke-width="2"/>`);
  else P.push(`<rect x="12" y="68" width="52" height="72" rx="3" fill="#4a3320" stroke="#2b1d12" stroke-width="3"/><circle cx="54" cy="106" r="3" fill="#e0b84a"/>${lv >= 3 ? '<rect x="12" y="68" width="52" height="72" fill="none" stroke="#7a828c" stroke-width="3"/><line x1="12" y1="92" x2="64" y2="92" stroke="#7a828c" stroke-width="3"/><line x1="12" y1="116" x2="64" y2="116" stroke="#7a828c" stroke-width="3"/>' : ""}`);
  // ชั้นวางของ (ติดผนัง)
  P.push(`<rect x="26" y="76" width="96" height="5" fill="#3c2a1b"/><rect x="34" y="81" width="4" height="8" fill="#3c2a1b"/><rect x="110" y="81" width="4" height="8" fill="#3c2a1b"/>`);
  // แสงตะเกียง/ไฟประดับ
  if (lv === 0) P.push(`<circle cx="120" cy="40" r="28" fill="url(#scnglow)" class="pu"/>${t(120, 44, 16, "🏮", 'class="fl"')}<line x1="120" y1="0" x2="120" y2="30" stroke="#222" stroke-width="1.5"/>`);
  if (lv >= 3) { P.push(`<path d="M16 24 Q80 44 160 24 T304 24" fill="none" stroke="#222" stroke-width="1.5"/>`); for (let i = 0; i < 9; i++) { const x = 28 + i * 33; P.push(`<circle cx="${x}" cy="${30 + (i % 2) * 6}" r="3.2" fill="${["#ffd35a", "#ff7a7a", "#7ad0ff"][i % 3]}" class="fl" style="animation-delay:${i * 0.2}s"/>`); } }
  // พรม
  if (lv >= 1 || z) P.push(`<ellipse cx="160" cy="180" rx="${lv >= 3 ? 112 : 84}" ry="${lv >= 3 ? 16 : 13}" fill="${pal[4]}" opacity=".92"/><ellipse cx="160" cy="180" rx="${lv >= 3 ? 96 : 70}" ry="${lv >= 3 ? 11 : 8}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>`);
  // เคาน์เตอร์สถานี
  P.push(`<rect x="8" y="118" width="116" height="9" rx="2" fill="#4a3320"/><rect x="14" y="127" width="5" height="12" fill="#3a2818"/><rect x="113" y="127" width="5" height="12" fill="#3a2818"/>`);
  // โต๊ะข้าง (ของวางบนโต๊ะ d1,d6)
  P.push(`<rect x="134" y="128" width="58" height="6" rx="2" fill="#5a4028"/><rect x="140" y="134" width="5" height="8" fill="#3a2818"/><rect x="181" y="134" width="5" height="8" fill="#3a2818"/>`);
  // สถานี 1..5 บนเคาน์เตอร์
  const kinds = { w: "💧", t: z ? "🥩" : "🥫", m: "🌿" };
  (o.stations || []).forEach((s, i) => {
    const x = 22 + i * 22;
    if (s.locked) { P.push(`<rect x="${x - 8}" y="104" width="16" height="14" rx="3" fill="none" stroke="#fff" stroke-opacity=".25" stroke-dasharray="3 2"/>`); return; }
    if (!s.k) { P.push(`<rect x="${x - 8}" y="104" width="16" height="14" rx="3" fill="#000" opacity=".18"/>`); return; }
    P.push(kinds[s.k] ? scnStn(s.k, x, z) : t(x, 117, 16, "📦"));
    if (s.u > 0) P.push(`<text x="${x + 8}" y="104" font-size="9" text-anchor="middle" class="sp">✨</text>`, `<text x="${x}" y="127.5" font-size="7" text-anchor="middle" fill="#fff">${s.u}/${s.cap}</text>`);
  });
  // โต๊ะงาน (ขวา)
  const bs = o.bench || [];
  if (bs.length) {
    P.push(`<rect x="262" y="112" width="48" height="8" rx="2" fill="#4a3320"/><rect x="268" y="120" width="5" height="22" fill="#3a2818"/><rect x="299" y="120" width="5" height="22" fill="#3a2818"/>`);
    bs.forEach((b, i) => { const x = 276 + i * 20; if (b.state === "locked") P.push(`<rect x="${x - 7}" y="98" width="14" height="14" rx="3" fill="none" stroke="#fff" stroke-opacity=".25" stroke-dasharray="3 2"/>`); else if (b.state === "busy") P.push(t(x, 111, 15, "⚙️", 'class="sp"')); else if (b.state === "ready") P.push(t(x, 111, 15, "📦"), `<text x="${x + 7}" y="98" font-size="9" text-anchor="middle" class="sp">✨</text>`); else P.push(t(x, 111, 15, "🛠️", 'opacity=".55"')); });
  }
  // ของตกแต่ง
  const lay = Array.isArray(o.layout) ? o.layout : null;   // ห้องแบบจัดเอง (homeAct): [{d,x,y}] + o.items = { รหัส: [ไอคอน, ชื่อ, ขนาด] }
  const hasLamp = lay ? lay.some((e) => e.d === "d11") : deco.d11 === true;
  if (hasLamp) { const lp = lay && lay.find((e) => e.d === "d11"); const lx = lp ? lp.x : 172; P.push(`<circle cx="${lx}" cy="46" r="52" fill="url(#scnglow)" class="pu"/><line x1="${lx}" y1="0" x2="${lx}" y2="20" stroke="#222" stroke-width="1.5"/>`); }
  if (lay) [...lay].sort((a, b) => a.y - b.y).forEach((e) => {   // เรียงตามความลึก (y น้อย = ไกล วาดก่อน)
    const it = (o.items && o.items[e.d]) || (DECO.find((x) => x[0] === e.d) && [DECO.find((x) => x[0] === e.d)[1], DECO.find((x) => x[0] === e.d)[2], (SCN_POS[e.d] || [0, 0, 24])[2]]);
    if (!it) return;
    P.push(`<g class="it${o.sel === e.i ? " sel" : ""}" data-n="${it[0]} ${it[1]}"><title>${it[1]}</title>${o.sel === e.i ? `<circle cx="${e.x}" cy="${e.y - it[2] / 3}" r="${it[2] * 0.7}" fill="none" stroke="#e0a030" stroke-width="2" stroke-dasharray="4 3"/>` : ""}${t(e.x, e.y, it[2], it[0], e.d === "d1" ? 'class="fl"' : "")}</g>`);
  });
  else for (const d of DECO) {
    const id = d[0]; if (deco[id] !== true) continue;
    const q = SCN_POS[id]; if (!q) continue;
    const extra = id === "d1" ? 'class="fl"' : "";
    P.push(`<g class="it" data-n="${d[1]} ${d[2]}"><title>${d[2]}</title>${t(q[0], q[1], q[2], d[1], extra)}</g>`);
  }
  if (z) P.push(t(52, 170, 14, "🦴", 'opacity=".8"'), t(296, 98, 12, "🕸️", 'opacity=".7"'), t(224, 152, 13, "🍄", 'class="fl"'));
  P.push(`</svg>`);
  return P.join("");
}
function baseSceneFill(host, o) {
  host.innerHTML = baseSceneSvg(o);
  host.onclick = (e) => { const g = e.target.closest && e.target.closest("[data-n]"); if (g) toast(g.getAttribute("data-n")); };
}
function baseSceneOwn() {
  const slots = baseSlots(), st = [];
  for (let i = 1; i <= 5; i++) {
    if (i > slots) { st.push({ locked: true }); continue; }
    const rec = state.base?.["s" + i];
    if (!rec || !BASE_P[rec.k]) { st.push({}); continue; }
    st.push({ k: rec.k, u: baseUnits(rec), cap: BASE_CAP[rec.k] });
  }
  const bench = [1, 2].map((j) => {
    if (j > benchSlots()) return { state: "locked" };
    const rec = state.base?.["j" + j];
    if (!rec || !BENCH[rec.r]) return { state: "empty" };
    return { state: benchLeft(rec) <= 0 ? "ready" : "busy" };
  });
  const hd = state.homeD, home = hd && hd.lay ? { layout: hd.lay, items: homeItemsMap(hd), pal: homePal(hd, hd.th) } : {};
  return { lv: baseLv(), deco: decoOwned(), zombie: state.profile?.faction === "zombie", uid: state.uid, stations: st, bench, ...home };
}
// ห้องของคนอื่น (หน้าประวัติ): ขั้นบ้านประมาณจากจำนวนของตกแต่ง
async function baseSceneBio(uid, facIn) {
  try {
    const v = (await get(ref(db, `base/${uid}/deco`))).val() || {}; const n = Object.values(v).filter((x) => x === true).length;
    let rl = null; try { const x = (await get(ref(db, `base/${uid}/lv`))).val(); if (Number.isInteger(x) && x >= 0 && x <= 3) rl = x; } catch { /* rules เก่า: ประมาณจากของตกแต่ง */ }
    if (!n && !rl) return null;
    let fac = facIn || "human";
    return { lv: rl ?? (n >= 9 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0), deco: v, zombie: fac === "zombie", uid, stations: [], bench: [] };
  } catch { return null; }
}

/* =========================================================
   43) 🌍 เป้าหมายโลกประจำวัน • 📜 บันทึกประจำฤดูกาล • 🏅 ฉายาใกล้ปลดล็อก • 📖 สมุดสะสมซิงค์ข้ามเครื่อง (ฝั่ง client ล้วน ไม่ใช้ rules)
   - เป้าหมายโลก: 3 ข้อ/วัน สุ่มตามโลกวันนั้น (เทศกาล/ดวงจันทร์/ฤดูกาล/ฝ่าย) นับจากตัวนับความสำเร็จเดิม ไม่ต้องมี hook ใหม่
     ทำครบข้อไหนได้ "โชคประจำวัน" +15 นาที (ซ้อนได้ไม่เกิน 60) = ค้นแล้วว่างเปล่าน้อยลง/ของหายากออกง่ายขึ้นเล็กน้อย • ครบ 3 ข้อ = นับ 1 วัน (ฉายา)
   - สมุดสะสม: เก็บเป็นบิตลงตัวนับ ach (ชิ้นละ 11 บิต ≤ 2047 < เพดาน +3000/ครั้ง) แล้วรวม (OR) กลับเข้าทุกเครื่อง
   ========================================================= */
const BK_SP = {   // ลำดับต้องคงที่ตลอดไป: เพิ่มของใหม่ได้เฉพาะต่อท้ายเท่านั้น
  i: ["canned_food", "water", "bandage", "medkit", "wooden_bat", "knife", "crowbar", "pistol", "bread", "fruit", "moss", "energy_drink", "scrap", "chem", "pocket_knife", "spiked_bat", "fire_axe", "crossbow", "samurai_sword", "shotgun", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "rotten_meat", "rag_vest", "scrap_plate", "riot_vest", "army_vest", "lucky_charm", "headlamp", "gas_mask", "toolkit", "mut_fang1", "mut_fang2", "mut_hide1", "mut_hide2", "mut_nose1", "mut_nose2", "lab_coat", "bio_lens", "lab_sample", "chem_gloves", "lab_blade", "lab_core", "exp_serum", "mut_fang3", "fish", "golden_fish", "fish_grill", "fish_stew"],
  z: ["safe", "ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"],
  f: ["newmoon", "fullmoon", "meteor", "songkran", "loy", "halloween", "harvest", "newyear"],
  s: ["plane", "truck", "bunker"]
};
const BK_PFX = { i: "bki", z: "bkz", f: "bkf", s: "bks" }, BK_BITS = 11;
function bkChunks(cat, set) {   // set(ids) → [ตัวเลขต่อชิ้น]
  const L = BK_SP[cat], n = Math.ceil(L.length / BK_BITS), out = new Array(n).fill(0);
  L.forEach((id, i) => { if (set.has(id)) out[Math.floor(i / BK_BITS)] += Math.pow(2, i % BK_BITS); });
  return out;
}
function bkDecode(cat, c) {
  const L = BK_SP[cat], ids = [];
  for (let k = 0; k < Math.ceil(L.length / BK_BITS); k++) { const v = Math.floor(c[BK_PFX[cat] + k] || 0); for (let b = 0; b < BK_BITS; b++) { const i = k * BK_BITS + b; if (i < L.length && Math.floor(v / Math.pow(2, b)) % 2 === 1) ids.push(L[i]); } }
  return ids;
}
function bookSync() {
  if (!state.ach?.loaded || !state.profile) return 0;
  let pushed = 0;
  Object.keys(BK_SP).forEach((cat) => {
    const loc = bookSet(cat), c = state.ach.c;
    const srv = bkDecode(cat, c); let ch = false; srv.forEach((id) => { if (!loc.has(id)) { loc.add(id); ch = true; } });
    if (ch) fxSet("book_" + cat, [...loc]);
    const mine = bkChunks(cat, loc);
    mine.forEach((v, k) => { const key = BK_PFX[cat] + k; if (v > (c[key] || 0)) { achSet(key, v); pushed++; } });
  });
  return pushed;
}

/* ---------- เหรียญฤดูกาล: เก็บเป็นตัวนับแยกรายฤดู (sb<n>) กันเพดาน +3000 ของบิตมาสก์เดิมตอนฤดูที่ 12+ ---------- */
function seaMedals() {
  const c = state.ach?.c || {}, out = new Set(), m = Math.floor(c.seab || 0);
  for (let s = 0; s < 12; s++) if (Math.floor(m / Math.pow(2, s)) % 2 === 1) out.add(s);
  Object.keys(c).forEach((k) => { const g = /^sb(\d{1,3})$/.exec(k); if (g && c[k] >= 1) out.add(+g[1]); });
  return out;
}

/* ---------- 🌍 เป้าหมายโลกประจำวัน ---------- */
const wgOn = () => T("wg_on", 1) === 1;
const WG_NAME = { srch: ["🔍", "ค้นหาของ", "ครั้ง"], found: ["🎒", "เจอของ", "ชิ้น"], zwin: ["⚔️", "ชนะซอมบี้", "ครั้ง"], bite: ["🦷", "กัดเหยื่อ", "ครั้ง"], use: ["🧪", "ใช้ไอเทม", "ครั้ง"], craft: ["🔧", "คราฟต์", "ชิ้น"], bcol: ["🏠", "เก็บผลผลิตที่พัก", "ชิ้น"], camp: ["🏕️", "สมทบโปรเจกต์", "แต้ม"], mkt: ["🏪", "ซื้อ/ขายในตลาด", "ครั้ง"], nsrch: ["🌙", "ค้นหาตอนกลางคืน", "ครั้ง"] };
const WG_KEYS = Object.keys(WG_NAME);
const wgBaseKey = (d) => "wg_b_" + d;
function wgToday(now = serverNow()) {
  const day = coopDay(now), zom = state.profile?.faction === "zombie", fac = zom ? "z" : "h", out = [], used = new Set();
  const add = (k, n, why) => { if (used.has(k) || !WG_NAME[k]) return false; used.add(k); out.push({ k, n: Math.max(1, Math.round(n)), why }); return true; };
  // 1) ธีมของโลกวันนี้
  let a = null; try { a = festActive(now); } catch { /* ข้าม */ }
  const moon = (() => { try { return fxMoon(now + 12 * 3600000); } catch { return ""; } })();
  if (a && a.length) add("srch", 12, `${a[0].icon} ${a[0].name}`);
  else if (moon === "full") add("nsrch", 5, "🌕 ใต้พระจันทร์เต็มดวง");
  else if (moon === "new") add("use", 6, "🌑 คืนเดือนมืด");
  else if (seaOn()) { const g = seaGoals()[rdHash("wg1", day) % 3]; add(g.k, Math.max(3, g.n / 9), `${seaDef().icon} ธีม${seaDef().name}`); }
  // 2) กิจกรรมหลัก  3) งานรอง
  const A = zom ? [["srch", 15], ["found", 8], ["bite", 2], ["zwin", 4], ["use", 5], ["craft", 3]] : [["srch", 15], ["found", 8], ["zwin", 4], ["use", 5], ["craft", 4], ["mkt", 2]];
  const B = [["bcol", 3], ["camp", 20], ["use", 4], ["mkt", 2], ["craft", 3], ["found", 6]];
  for (let q = 0; q < 8 && out.length < 2; q++) { const p = A[rdHash("wg2", fac, day, q) % A.length]; add(p[0], p[1], "ภารกิจวันนี้"); }
  for (let q = 0; q < 12 && out.length < 3; q++) { const p = B[rdHash("wg3", fac, day, q) % B.length]; add(p[0], p[1], "งานรอง"); }
  const sc = Math.max(10, T("wg_scale", 100)) / 100;
  return out.slice(0, 3).map((g) => ({ ...g, n: Math.max(1, Math.round(g.n * sc)) }));
}
function wgSnap() { const c = state.ach?.c || {}, o = {}; WG_KEYS.forEach((k) => { o[k] = c[k] || 0; }); return o; }
function wgProg(now = serverNow()) {
  const day = coopDay(now), b = fxGet(wgBaseKey(day), null) || {}, c = state.ach?.c || {};
  return wgToday(now).map((g, i) => { const v = Math.max(0, (c[g.k] || 0) - (b[g.k] || 0)); return { ...g, i, v, done: v >= g.n }; });
}
const wgBuffLeft = (now = serverNow()) => Math.max(0, fxGet("wg_buff", 0) - now);
function wgTick(now = serverNow()) {
  if (!wgOn() || !state.profile || !state.ach?.loaded) return;
  const day = coopDay(now);
  if (!fxGet(wgBaseKey(day), null)) { fxSet(wgBaseKey(day), wgSnap()); try { fxSet(wgBaseKey(day - 3), null); } catch { /* ข้าม */ } }
  const pr = wgProg(now); let all = true;
  pr.forEach((g) => {
    if (!g.done) { all = false; return; }
    const k = `wg_d${g.i}_${day}`;
    if (!fxGet(k, 0)) {
      fxSet(k, 1); const until = Math.min(now + 3600000, Math.max(now, fxGet("wg_buff", 0)) + 900000); fxSet("wg_buff", until);
      try { toast(`🌍 เป้าหมายโลกสำเร็จ: ${WG_NAME[g.k][1]} ${g.n} — ได้ 🍀 โชคประจำวัน +15 นาที`); logLine(`🌍 เป้าหมายโลกสำเร็จ: ${WG_NAME[g.k][0]} ${WG_NAME[g.k][1]} ${g.n} ${WG_NAME[g.k][2]} (${g.why}) • 🍀 โชคประจำวันเหลือ ~${Math.ceil((until - now) / 60000)} นาที`, "system"); } catch { /* ข้าม */ }
    }
  });
  if (all && pr.length && !fxGet("wg_all_" + day, 0)) { fxSet("wg_all_" + day, 1); achBump("wgd"); try { toast("🌟 ครบเป้าหมายโลกวันนี้ทั้ง 3 ข้อ!"); sfx("boss"); } catch { /* ข้าม */ } }
}
function wgTable(t) {   // โชคประจำวัน: ว่างเปล่า −12% • ของหายาก +20% (ปรับด้วย wg_str)
  if (!wgOn() || wgBuffLeft() <= 0) return t;
  const s = Math.max(0, T("wg_str", 100)) / 100; if (!s) return t;
  const e = Math.pow(0.88, s), r = Math.pow(1.2, s);
  return t.map((d) => d.id === null ? { ...d, w: d.w * e } : (d.id === "zombie" || d.id === "boss" || d.id === "rotten_meat") ? d : d.w <= 5 ? { ...d, w: d.w * r } : d);
}
function wgRows(body) {
  if (!wgOn()) return;
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
  c.append(mk("b", "", "🌍 เป้าหมายโลกวันนี้"));
  const left = wgBuffLeft();
  c.append(mk("span", "muted", left > 0 ? `🍀 โชคประจำวัน เหลือ ~${Math.ceil(left / 60000)} นาที (ค้นแล้วว่างเปล่าน้อยลง ของหายากออกง่ายขึ้นเล็กน้อย)` : "ทำเป้าหมายสำเร็จข้อละ +15 นาที 🍀 โชคประจำวัน (ซ้อนได้ไม่เกิน 60 นาที) • ครบ 3 ข้อนับเป็น 1 วันของฉายา"));
  wgProg().forEach((g) => { const nm = WG_NAME[g.k]; const r = mk("div"); r.append(mk("div", "", `${g.done ? "✅" : "▫️"} ${nm[0]} ${nm[1]} ${g.n} ${nm[2]} — ${g.why}`), worldBar(Math.min(1, g.v / g.n), `${Math.min(g.v, g.n)}/${g.n}`)); c.append(r); });
  c.append(mk("span", "muted", "นับจากตอนเปิดเกมครั้งแรกของวัน (เวลาไทย) • รีเซ็ตเที่ยงคืน"));
  body.append(c);
}
function nearTitles(maxN = 3) {   // ฉายาที่ใกล้ปลดล็อกที่สุด (ยังไม่ปลด, ทำไปแล้ว ≥ 40%)
  const A = state.ach; if (!A?.loaded) return [];
  const fac = state.profile?.faction === "zombie" ? "z" : "h";
  return ACH.filter((a) => !A.unl[a.id] && (!a.f || a.f === fac) && (A.c[a.k] || 0) > 0)
    .map((a) => ({ a, r: Math.min(0.999, (A.c[a.k] || 0) / a.n), left: a.n - (A.c[a.k] || 0) })).filter((x) => x.r >= 0.4)
    .sort((x, y) => y.r - x.r).slice(0, maxN);
}
function nearRows(body) {
  const L = nearTitles(); if (!L.length) return;
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:4px"; c.append(mk("b", "", "🏅 ใกล้ได้ฉายา"));
  L.forEach(({ a, left }) => c.append(mk("div", "", `${a.ic} ${a.name} — อีก ${left.toLocaleString("en-US")} (${a.desc})`)));
  body.append(c);
}

/* ---------- 📜 บันทึกประจำฤดูกาล ---------- */
const chDayMs = (d) => d * 86400000 - COOP_TZ;
const chFmt = (d) => { const x = new Date(chDayMs(d) + COOP_TZ); return `${x.getUTCDate()}/${x.getUTCMonth() + 1}`; };
function chSeasonInfo(s) {
  const d0 = SEA_EPOCH + s * SEA_LEN, d1 = d0 + SEA_LEN - 1, fest = new Map(); let full = 0, nw = 0;
  for (let d = d0; d <= d1; d++) { const t = chDayMs(d) + 43200000; try { festActive(t).forEach((f) => fest.set(f.id, f)); } catch { /* ข้าม */ } try { const m = fxMoon(t); if (m === "full") full++; else if (m === "new") nw++; } catch { /* ข้าม */ } }
  return { d0, d1, fest: [...fest.values()].filter((f) => f.id !== "fullmoon" && f.id !== "newmoon"), full, nw };
}
async function chWeekly(wk) {   // สัปดาห์ที่จบแล้วเก็บผลถาวร • สัปดาห์ปัจจุบันอ่านสด
  const cur = qpKey("weekly"), memo = fxGet("ch_w_" + wk, null);
  if (wk < cur && memo) return memo;
  const out = { g: [] };
  for (const grp of ["all", "human", "zombie"]) {
    let sums = {}; try { sums = (await get(ref(db, "coop/" + GROUP_KEY[grp] + wk))).val() || {}; } catch { /* ข้าม */ }
    const gl = goalOf(grp, wk), arr = Object.values(sums), tot = arr.reduce((a, x) => a + (x?.n || 0), 0), top = arr.sort((a, b) => (b?.n || 0) - (a?.n || 0))[0];
    out.g.push({ grp, t: gl.t, n: gl.n, tot, ok: tot >= gl.n, top: top ? { name: top.name, n: top.n } : null });
  }
  if (wk < cur) fxSet("ch_w_" + wk, out);
  return out;
}
async function chRender() {
  const body = $("ch-body"); if (!body) return; body.innerHTML = ""; body.append(mk("div", "muted", "กำลังเปิดสมุดบันทึก…"));
  const cur = seaIdx(), medals = seaMedals(), cards = [];
  for (let s = cur; s >= Math.max(0, cur - 2); s--) {
    const d = seaDef(s), inf = chSeasonInfo(s), c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:5px";
    c.append(mk("b", "", `${d.icon} ฤดูกาลที่ ${s + 1}: ${d.name}  (${chFmt(inf.d0)}–${chFmt(inf.d1)}${s === cur ? ` • ตอนนี้วันที่ ${seaDayIn()}/${SEA_LEN}` : ""})`));
    c.append(mk("div", "muted", `${d.tip}`));
    c.append(mk("div", "", medals.has(s) ? `🏅 คุณได้เหรียญ ${d.icon} ${d.name} แล้ว` : s === cur ? "🏅 เหรียญฤดูกาลนี้: ยังไม่ครบ (ดูเป้าในแผงโลก)" : "🏅 ฤดูกาลนั้นคุณยังไม่ได้เหรียญ"));
    if (inf.fest.length) c.append(mk("div", "", `🎆 เทศกาล: ${inf.fest.map((f) => `${f.icon} ${f.name}`).join(" • ")}`));
    c.append(mk("div", "", `🌕 พระจันทร์เต็มดวง ${inf.full} คืน • 🌑 เดือนมืด ${inf.nw} คืน`));
    const wl = mk("div"); wl.style.cssText = "display:grid;gap:3px"; wl.dataset.s = s; c.append(wl);
    cards.push([s, inf, wl]); body.append(c);
  }
  body.firstChild.remove();
  for (const [s, inf, wl] of cards) {
    wl.append(mk("div", "muted", "กำลังรวมผลเป้าหมายร่วมรายสัปดาห์…"));
    const w0 = qpKey("weekly", chDayMs(inf.d0) + 43200000), w1 = qpKey("weekly", chDayMs(inf.d1) + 43200000), cur = qpKey("weekly"), rows = []; let ok = 0, all = 0, best = null;
    for (let wk = w0; wk <= Math.min(w1, cur); wk++) {
      let r; try { r = await chWeekly(wk); } catch { continue; }
      r.g.forEach((g) => { if (wk < cur) { all++; if (g.ok) ok++; } if (g.top && (!best || g.top.n > best.n)) best = { ...g.top, wk }; });
    }
    wl.innerHTML = "";
    wl.append(mk("div", "", `🤝 เป้าหมายร่วมรายสัปดาห์ที่สำเร็จ: ${ok}/${all || 0} ข้อ (ที่จบแล้ว)`));
    if (best) wl.append(mk("div", "", `👑 ผู้สมทบสูงสุดในฤดูนี้: ${best.name} (${best.n} แต้มในสัปดาห์เดียว)`));
  }
}
function chOpen() {
  if (!$("ch-modal")) {
    const m = mk("div", "modal hidden"); m.id = "ch-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "📜 บันทึกประจำฤดูกาล"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "ch-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("ch-modal").classList.remove("hidden"); chRender().catch((e) => console.warn("chronicle", e));
}

/* =========================================================
   44) 🎁 เยี่ยมบ้านเพื่อน + ฝากของ (ต้องใช้ rules v35)
   - เปิด "ประวัติ" ของเพื่อน → เห็นห้อง/ขั้นบ้านจริง (base/{uid}/lv อ่านได้แล้ว) + ปุ่มฝากของ
   - ฝากของ = เรียก Cloud Function marketAct (a:"gift") → เขียน marketPayouts/{เขา}/g{เรา} {id,qty:1,lid:"gift"} + หักของเรา (giftTx กั้นสแปมฝั่งเซิร์ฟเวอร์)
     ผู้รับกดรับที่ 📬 ตลาดเหมือนของที่ขายได้ (ใช้ทางรับเดิม) • ฝั่งเดียวกันเท่านั้น • ทีละ 1 ชิ้น • ค้างได้ 1 ชิ้นต่อคู่
   ========================================================= */
const GIFT_IDS = ["water", "canned_food", "bandage", "moss", "bread", "fruit"];
const gftOn = () => T("gft_on", 1) === 1;
async function gftSend(to, id, name, fac) {
  const p = state.profile;
  if (!gftOn()) return toast("ปิดระบบฝากของอยู่");
  if (!p || p.hp <= 0) return toast("คุณสลบอยู่");
  if (state.zone !== "safe") return toast("ฝากของได้เฉพาะตอนอยู่ Safe Zone");
  if (!to || to === state.uid || !GIFT_IDS.includes(id)) return;
  if (Date.now() < (state.gftAt || 0)) return toast("รอสักครู่ก่อนฝากชิ้นต่อไป");
  if (mktHave(id) < 1) return toast("ของชิ้นนี้หมดแล้ว");
  if (fac && fac !== p.faction) return toast("ฝากของได้เฉพาะเพื่อนฝั่งเดียวกัน");
  if (!confirm(`ฝาก ${mktLabel(id)} ×1 ให้ ${name}?\nของจะไปรอที่ 📬 ตลาดของเขา (ถ้าเขายังไม่ได้รับชิ้นก่อนหน้า จะฝากซ้ำไม่ได้)`)) return;
  state.gftAt = Date.now() + 4000;
  const u = { a: "gift", to, id };
  try {
    await Promise.race([marketCall(u), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000))]);
    achBump("gft"); toast(`🎁 ฝาก ${mktLabel(id)} ให้ ${name} แล้ว`); try { logLine(`🎁 ฝาก ${mktLabel(id)} ให้ ${name} (รอเขาไปรับที่ตลาด)`, "system"); } catch { /* ข้าม */ }
    try { sfx("pick"); } catch { /* ข้าม */ }
    return true;
  } catch (e) {
    state.gftAt = 0;
    console.error("gift", e?.code || e, JSON.stringify(u));
    toast(String(e?.message) === "timeout" ? "เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง" : String(e?.code || "").startsWith("functions/") ? mktErr(e) + " [gift]" : errMsg(e));
  }
}
function gftVisit(uid) {   // นับเยี่ยมบ้าน: คนละ 1 ครั้งต่อวัน
  if (!uid || uid === state.uid) return;
  const k = `vis_${uid}_${coopDay(serverNow())}`; if (fxGet(k, 0)) return;
  fxSet(k, 1); achBump("vis");
}
function gftBioRow(uid, name, fac) {
  const old = $("bio-gift"); if (old) old.remove();
  if (!gftOn() || !uid || uid === state.uid || !state.profile) return;
  const box = mk("div"); box.id = "bio-gift"; box.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0;display:grid;gap:6px";
  box.append(mk("b", "", `🎁 ฝากของให้ ${name}`));
  const note = mk("span", "muted", "ของจะไปรอที่ 📬 ตลาดของเขา • ฝากได้เฉพาะเพื่อนฝั่งเดียวกัน ตอนอยู่ Safe Zone • ทีละ 1 ชิ้น"); box.append(note);
  const row = mk("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px"; box.append(row);
  const have = GIFT_IDS.filter((id) => mktHave(id) > 0);
  if (!have.length) row.append(mk("span", "muted", "ตอนนี้ไม่มีของที่ฝากได้ (น้ำ/อาหาร/ผ้าพันแผล/มอส/ผลไม้)"));
  have.forEach((id) => row.append(btn(`${mktLabel(id)} (${mktHave(id)})`, async (e) => { const b = e?.currentTarget; if (b) b.disabled = true; try { await gftSend(uid, id, name, fac); } finally { if (b) b.disabled = false; gftBioRow(uid, name, fac); } }, "btn ghost mini")));
  const host = $("bio-text"); if (host) host.after(box);
  if (fac && fac !== state.profile.faction) { row.innerHTML = ""; note.textContent = "ฝากของได้เฉพาะเพื่อนฝั่งเดียวกัน"; }
}
function gftSeen(pay) {   // แจ้งเตือนของขวัญที่เพิ่งมา (ชื่อผู้ฝากมากับตัวของขวัญ: n)
  const now = new Set(Object.keys(pay || {}).filter((k) => pay[k]?.lid === "gift"));
  const prev = state.gftPrev; state.gftPrev = now;
  if (!prev) { if (now.size) toast(`🎁 มีของขวัญรออยู่ ${now.size} ชิ้น — รับที่ 📬 ตลาด`); }
  else [...now].filter((k) => !prev.has(k)).forEach((k) => { const n = pay[k]?.n || "เพื่อน"; try { toast(`🎁 ${n} ฝากของไว้ให้ — รับที่ 📬 ตลาด`); logLine(`🎁 ${n} ฝาก ${ITEMS[pay[k]?.id]?.name || "ของ"} ไว้ให้ที่ตลาด`, "system"); sfx("pick"); } catch { /* ข้าม */ } });
}

/* =========================================================
   45) 🌳 ต้นไม้ทักษะสายอาชีพ — ไม่ต้องแก้ rules
   - แต้มทักษะแยกตามสาย = floor(√(แต้มสายนั้น ÷ 6)) (ใช้แต้มสายเดิมของ CAREER) ใช้ได้เฉพาะในสายนั้น
   - เรียนแล้วถาวร (เก็บเป็นบิตลงตัวนับ ach: skte/skth/skm/sktt — ซิงก์ข้ามเครื่อง) ปลายสายเลือกได้ 1 จาก 2
   - ผลเป็นโบนัสเล็ก ๆ ผ่านจุดเดิม (fxMods / ทนสถานะ / อาวุธทน) • ปรับได้ที่ sk_on, sk_str
   ========================================================= */
const SK_KEY = { explorer: "skte", hunter: "skth", medic: "sktm", trader: "sktt" };
const SK = {
  explorer: [
    { n: "เท้าเบา", c: 1, d: "ค้นแล้วว่างเปล่าน้อยลง 3%", e: { n: 0.97 } },
    { n: "จำทางได้", c: 1, d: "เจอซอมบี้น้อยลง 4%", e: { z: 0.96 } },
    { n: "ตาจับของหายาก", c: 2, d: "ของหายากออกง่ายขึ้น 6%", e: { r: 1.06 } },
    { n: "แผนที่ในหัว", c: 2, d: "ว่างเปล่าน้อยลงอีก 3% • อาหารเจอมากขึ้น 4%", e: { n: 0.97, f: 1.04 } },
    { n: "ผู้ชำนาญซอกหลืบ", c: 3, d: "ของหายาก +5% • เศษวัสดุ +5%", e: { r: 1.05, sc: 1.05 } },
    { n: "นักล่าขุมทรัพย์", c: 4, d: "ของหายากออกง่ายขึ้นอีก 10%", e: { r: 1.10 }, cap: 1 },
    { n: "เงาเงียบ", c: 4, d: "เจอซอมบี้น้อยลงอีก 12%", e: { z: 0.88 }, cap: 1 }
  ],
  hunter: [
    { n: "มือหนัก", c: 1, d: "อาวุธทนขึ้น 3% • (ซอมบี้) เนื้อเน่า +3%", e: { wear: 0.03, rm: 1.03 } },
    { n: "ผิวด้าน", c: 1, d: "ทนสถานะผิดปกติ +3%", e: { cut: 0.03 } },
    { n: "รู้จุดอ่อน", c: 2, d: "อาวุธทน +4% • เนื้อเน่า +4%", e: { wear: 0.04, rm: 1.04 } },
    { n: "นักสู้ผ่านศึก", c: 2, d: "ทนสถานะผิดปกติ +4%", e: { cut: 0.04 } },
    { n: "ช่างใจเย็น", c: 3, d: "อาวุธทน +5% • เนื้อเน่า +5%", e: { wear: 0.05, rm: 1.05 } },
    { n: "นักล่าตลอดกาล", c: 4, d: "อาวุธทน +8% • เนื้อเน่า +8%", e: { wear: 0.08, rm: 1.08 }, cap: 1 },
    { n: "เหล็กไหล", c: 4, d: "ทนสถานะผิดปกติ +10%", e: { cut: 0.10 }, cap: 1 }
  ],
  medic: [
    { n: "ผ้าพันแผลเก่า", c: 1, d: "เจอผ้าพันแผลมากขึ้น 10%", e: { it: { bandage: 1.10 } } },
    { n: "มือนิ่ง", c: 1, d: "ทนสถานะผิดปกติ +3%", e: { cut: 0.03 } },
    { n: "ตำรามอส", c: 2, d: "มอส +12% • ยาแก้พิษ +10%", e: { it: { moss: 1.12, antidote: 1.10 } } },
    { n: "ใจเย็นกลางเลือด", c: 2, d: "ทนสถานะผิดปกติ +4%", e: { cut: 0.04 } },
    { n: "หมอประจำค่าย", c: 3, d: "ชุดปฐมพยาบาล +15% • เซรั่ม +12%", e: { it: { medkit: 1.15, serum: 1.12 } } },
    { n: "ผู้ช่วยชีวิต", c: 4, d: "ของรักษาทุกชนิดเจอมากขึ้นอีก 15%", e: { it: { bandage: 1.15, medkit: 1.15, antidote: 1.15, serum: 1.15 } }, cap: 1 },
    { n: "ภูมิต้านทาน", c: 4, d: "ทนสถานะผิดปกติ +10%", e: { cut: 0.10 }, cap: 1 }
  ],
  trader: [
    { n: "ตาพ่อค้า", c: 1, d: "เศษวัสดุเจอมากขึ้น 4%", e: { sc: 1.04 } },
    { n: "รู้ราคาเสบียง", c: 1, d: "อาหารเจอมากขึ้น 4%", e: { f: 1.04 } },
    { n: "คลังน้ำ", c: 2, d: "น้ำดื่มเจอมากขึ้น 6%", e: { w: 1.06 } },
    { n: "สายส่งวัสดุ", c: 2, d: "เศษวัสดุ +5% • สารเคมี +8%", e: { sc: 1.05, it: { chem: 1.08 } } },
    { n: "นักต่อรอง", c: 3, d: "อาหาร +5% • น้ำ +5%", e: { f: 1.05, w: 1.05 } },
    { n: "เจ้าพ่อวัสดุ", c: 4, d: "เศษวัสดุ +10% • สารเคมี +10%", e: { sc: 1.10, it: { chem: 1.10 } }, cap: 1 },
    { n: "พ่อค้าเสบียง", c: 4, d: "อาหาร +8% • น้ำ +8%", e: { f: 1.08, w: 1.08 }, cap: 1 }
  ]
};
const skOn = () => T("sk_on", 1) === 1;
const skMask = (b) => Math.floor(state.ach?.c?.[SK_KEY[b]] || 0) & 127;
const skHas = (b, i) => (skMask(b) >> i) & 1;
const skSpent = (b) => SK[b].reduce((t, n, i) => t + (skHas(b, i) ? n.c : 0), 0);
const skEarned = (b) => Math.floor(Math.sqrt(Math.max(0, CAREER[b].score(state.ach?.c || {})) / 6));
const skFree = (b) => Math.max(0, skEarned(b) - skSpent(b));
const skFreeAll = () => Object.keys(SK).reduce((t, b) => t + skFree(b), 0);
function skCan(b, i) {   // → "" = เรียนได้ ไม่งั้นเหตุผล
  const n = SK[b]?.[i]; if (!n) return "ไม่มีทักษะนี้";
  if (skHas(b, i)) return "เรียนแล้ว";
  if (i >= 1 && i <= 4 && !skHas(b, i - 1)) return "ต้องเรียนขั้นก่อนหน้าก่อน";
  if (n.cap) { if (!skHas(b, 4)) return "ต้องเรียนครบ 5 ขั้นก่อน"; if (SK[b].some((x, j) => x.cap && j !== i && skHas(b, j))) return "เลือกปลายสายไปแล้ว (เลือกได้ 1 จาก 2)"; }
  if (skFree(b) < n.c) return `ต้องใช้ ${n.c} แต้ม (ว่าง ${skFree(b)})`;
  return "";
}
function skLearn(b, i) {
  if (!skOn() || !state.ach?.loaded) return false;
  const why = skCan(b, i); if (why) { toast(why); return false; }
  const n = SK[b][i];
  if (!confirm(`เรียน "${n.n}" (${n.c} แต้ม)?\n${n.d}\nเรียนแล้วเปลี่ยนไม่ได้${n.cap ? " • ปลายสายเลือกได้แค่ 1 จาก 2" : ""}`)) return false;
  achSet(SK_KEY[b], skMask(b) | (1 << i)); fxMemo.k = ""; fxCareerMemo.t = 0;
  toast(`🌳 เรียนแล้ว: ${n.n}`); try { logLine(`🌳 เรียนทักษะ ${CAREER[b].icon} ${n.n}: ${n.d}`, "system"); sfx("boss"); } catch { /* ข้าม */ }
  return true;
}
function skEff() {   // รวมผลของทักษะที่เรียนแล้ว (เมโมไซส์ด้วย mask)
  const sig = Object.keys(SK).map(skMask).join(",") + "|" + T("sk_str", 100) + "|" + skOn();
  if (skEff.s === sig) return skEff.v; const s = Math.max(0, T("sk_str", 100)) / 100;
  const o = { n: 1, z: 1, r: 1, f: 1, w: 1, sc: 1, rm: 1, cut: 0, wear: 0, it: {} };
  if (skOn() && s) Object.keys(SK).forEach((b) => SK[b].forEach((nd, i) => { if (!skHas(b, i)) return; const e = nd.e;
    ["n", "z", "r", "f", "w", "sc", "rm"].forEach((q) => { if (e[q]) o[q] *= Math.pow(e[q], s); }); if (e.cut) o.cut += e.cut * s; if (e.wear) o.wear += e.wear * s;
    if (e.it) Object.entries(e.it).forEach(([id, v]) => { o.it[id] = (o.it[id] || 1) * Math.pow(v, s); }); }));
  skEff.s = sig; skEff.v = o; return o;
}
function skApply(m) {
  const o = skEff(); ["n", "z", "r", "f", "w", "sc", "rm"].forEach((q) => { if (o[q] !== 1) m[q] *= o[q]; });
  Object.entries(o.it).forEach(([id, v]) => { m.it[id] = (m.it[id] || 1) * v; });
}
const skCut = () => skEff().cut, skWear = () => skEff().wear;
function skNotify() {
  if (!skOn() || !state.ach?.loaded) return;
  const free = skFreeAll(), last = fxGet("sk_free", null);
  if (last === null) { fxSet("sk_free", free); return; }
  if (free > last) { toast(`🌳 ได้แต้มทักษะใหม่! (ว่างรวม ${free}) — ดูที่ 🧭 เส้นทางอาชีพ`); try { logLine(`🌳 แต้มทักษะว่างรวม ${free} แต้ม — กดต้นไม้ทักษะที่ปุ่ม 📅 → โลก → เส้นทางอาชีพ`, "system"); } catch { /* ข้าม */ } }
  if (free !== last) fxSet("sk_free", free);
}
function skRender() {
  const body = $("sk-body"); if (!body) return; body.innerHTML = "";
  if (!skOn()) return body.append(mk("div", "muted", "ปิดอยู่ชั่วคราว"));
  if (!state.ach?.loaded) return body.append(mk("div", "muted", "กำลังโหลด…"));
  body.append(mk("div", "muted", "แต้มทักษะได้จากการเล่นสายนั้น ๆ (ยิ่งทำสายไหนมาก สายนั้นยิ่งได้แต้ม) • ใช้ได้เฉพาะในสายตัวเอง • เรียนแล้วเปลี่ยนไม่ได้ • ปลายสายเลือก 1 จาก 2"));
  const zom = state.profile?.faction === "zombie";
  Object.keys(SK).forEach((b) => {
    const d = CAREER[b], c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:6px";
    c.append(mk("b", "", `${d.icon} ${d.name} — แต้มว่าง ${skFree(b)} (ใช้ไป ${skSpent(b)}/${skEarned(b)})`));
    SK[b].forEach((n, i) => {
      const r = mk("div"); r.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px";
      const has = skHas(b, i), why = skCan(b, i);
      const hz = (b === "hunter" && zom) ? "" : "";
      r.append(mk("span", has ? "" : "muted", `${has ? "✅" : n.cap ? "⭐" : "▫️"} ${n.n} (${n.c}) — ${n.d}${hz}`));
      if (!has) { const bt = btn("เรียน", () => { if (skLearn(b, i)) skRender(); }, "btn primary mini"); bt.disabled = !!why; if (why) bt.title = why; r.append(bt); }
      c.append(r);
    });
    body.append(c);
  });
  body.append(mk("div", "muted", "หมายเหตุ: ทักษะสายนักล่า ลดการสึกของอาวุธ (มนุษย์) / เพิ่มเนื้อเน่า (ซอมบี้)"));
}
function skOpen() {
  if (!$("sk-modal")) {
    const m = mk("div", "modal hidden"); m.id = "sk-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🌳 ต้นไม้ทักษะ"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "sk-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  skRender(); $("sk-modal").classList.remove("hidden");
}

/* =========================================================
   46) 🧭 ทีมสำรวจ — ส่งทีมออกนอกค่าย 4 ชั่วโมง กลับมารับของ (ต้องใช้ rules v36: exp/{uid})
   - ต้องมีที่พักขั้น 1 ขึ้นไป • จ่ายเสบียงตอนส่ง (มนุษย์: อาหารกระป๋อง+น้ำ ฝั่งละ 1 • ซอมบี้: เนื้อเน่า 2)
   - รางวัลคงที่ตามโซนที่ส่งไป (rules ตรวจตรง ๆ) • ทีละ 1 ทีม • รับได้เมื่อครบเวลา ตอนอยู่ Safe Zone
   ========================================================= */
const EXP_MS = 14400000;
const EXP_ZONES = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
const EXP_H = { ruins: ["canned_food", 3], mall: ["bread", 3], hospital: ["bandage", 3], police: ["scrap", 4], forest: ["moss", 3], factory: ["chem", 2], port: ["water_jug", 1], base: ["army_meal", 1], tunnel: ["energy_drink", 2], lab: ["antidote", 2] };
const EXP_Z = { ruins: 2, mall: 2, hospital: 3, police: 3, forest: 3, factory: 2, port: 3, base: 3, tunnel: 4, lab: 4 };
const expOn = () => T("exp_on", 1) === 1;
const expZom = () => state.profile?.faction === "zombie";
const expReward = (z) => expZom() ? ["rotten_meat", EXP_Z[z]] : EXP_H[z];
const expCost = () => expZom() ? [["rotten_meat", 2]] : [["canned_food", 1], ["water", 1]];
const expLeft = () => state.exp?.t ? Math.max(0, state.exp.t + EXP_MS - serverNow()) : 0;
const expReady = () => !!state.exp?.t && expLeft() <= 0;
function expInit() {
  if (state.expOn || !state.uid) return; state.expOn = true; state.exp = null;
  onValue(ref(db, "exp/" + state.uid), (s) => { state.exp = s.val() || null; try { baseBadge(); baseAgain(); } catch { /* ข้าม */ } }, (e) => console.warn("exp", e?.code || e));
}
function expCan() { return baseCan() && baseLv() >= 1 && expOn(); }
async function expStart(z) {
  if (!expCan() || state.exp || state.expBusy || !EXP_ZONES.includes(z)) return;
  const need = expCost().filter(([id, n]) => mktHave(id) < n); if (need.length) return toast(`เสบียงไม่พอ — ต้องใช้ ${expCost().map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(" + ")}`);
  const [rid, rn] = expReward(z);
  if (!confirm(`ส่งทีมสำรวจไป ${ZONES[z].name}?\nจ่ายเสบียง ${expCost().map(([id, n]) => `${ITEMS[id].icon} ${ITEMS[id].name} ×${n}`).join(" + ")}\nกลับมาใน 4 ชั่วโมง ได้ ${ITEMS[rid].icon} ${ITEMS[rid].name} ×${rn}`)) return;
  state.expBusy = true;
  const u = { [`exp/${state.uid}`]: { t: serverTimestamp(), z } }; expCost().forEach(([id, n]) => mktDebit(u, id, n));
  try { await Promise.race([update(ref(db), u), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000))]); toast(`🧭 ส่งทีมสำรวจไป ${ZONES[z].name} แล้ว — กลับมาใน 4 ชั่วโมง`); try { logLine(`🧭 ส่งทีมสำรวจไป ${ZONES[z].name} (กลับมาใน 4 ชั่วโมง ได้ ${ITEMS[rid].name} ×${rn})`, "system"); } catch { /* ข้าม */ } }
  catch (e) { console.error("exp start", e?.code || e, JSON.stringify(u)); toast(String(e?.message) === "timeout" ? "เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง" : "ส่งทีมไม่สำเร็จ — ต้องอยู่ Safe Zone มีที่พักขั้น 1 และเสบียงครบ [exp]"); }
  finally { state.expBusy = false; }
}
async function expClaim() {
  if (!state.exp || !expReady() || !baseCan() || state.expBusy) return;
  const z = state.exp.z, [id, n] = expReward(z); state.expBusy = true;
  try {
    let slot = null; try { slot = (await get(ref(db, `inventory/${state.uid}/${id}`))).val(); } catch { slot = state.inv?.[id] || null; }
    const have = slot?.qty || 0; if (have + n > 99) return toast(`${ITEMS[id].name} ในกระเป๋าจะเกิน 99 — ใช้ก่อนแล้วค่อยรับ`);
    const u = { [`exp/${state.uid}`]: null, [`inventory/${state.uid}/${id}`]: { id, qty: have + n } };
    await Promise.race([update(ref(db), u), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000))]);
    achBump("expd"); toast(`🧭 ทีมสำรวจกลับมาแล้ว! ได้ ${ITEMS[id].icon} ${ITEMS[id].name} ×${n}`); try { logLine(`🧭 ทีมสำรวจจาก ${ZONES[z].name} กลับมา ได้ ${ITEMS[id].name} ×${n}`, "system"); sfx("boss"); } catch { /* ข้าม */ }
  } catch (e) { console.error("exp claim", e?.code || e); toast(String(e?.message) === "timeout" ? "เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง" : "รับของทีมสำรวจไม่สำเร็จ [exp]"); }
  finally { state.expBusy = false; }
}
function expNotice() {   // ทีมกลับมาแล้ว → แจ้งครั้งเดียวต่อทริป
  if (!expOn() || !expReady()) return; const k = "exp_n_" + state.exp.t; if (fxGet(k, 0)) return; fxSet(k, 1);
  try { toast("🧭 ทีมสำรวจกลับมาแล้ว — รับของที่ 🏠 ที่พัก"); logLine(`🧭 ทีมสำรวจจาก ${ZONES[state.exp.z]?.name || state.exp.z} กลับมาแล้ว รอรับที่ที่พัก (ใน Safe Zone)`, "system"); } catch { /* ข้าม */ }
}
/* ---- 🧫 ส่งตัวอย่างวิจัยให้ค่าย → "ผลวิจัย" ชั่วคราว (ฝั่งเกมล้วน ๆ เก็บเวลาในเครื่อง: ของหายาก ×1.08 / ของทุกชนิด ×1.03) ---- */
const LAB_BUFF_KEY = "labbuf", LAB_MIN_PER = 10, LAB_MIN_CORE = 30, LAB_MAX_MIN = 60;
const labBuffLeft = () => Math.max(0, (LS.get(lsKey(LAB_BUFF_KEY), 0) || 0) - serverNow());
function labBuffMods(m) { if (labBuffLeft() > 0) { m.r *= 1.08; m.a *= 1.03; } }
async function labSubmit(id, n) {
  const it = state.inv?.[id], per = id === "lab_core" ? LAB_MIN_CORE : LAB_MIN_PER;
  if (!it || !(n > 0) || state.busy) return;
  n = Math.min(n, it.qty, Math.max(0, Math.ceil((LAB_MAX_MIN * 60000 - labBuffLeft()) / (per * 60000))));
  if (n <= 0) return toast("ผลวิจัยเต็ม 60 นาทีแล้ว รอให้ลดลงก่อนค่อยส่งเพิ่ม");
  state.busy = true;
  try {
    await update(ref(db), { [`inventory/${state.uid}/${id}` + (it.qty - n > 0 ? "/qty" : "")]: it.qty - n > 0 ? it.qty - n : null });
    LS.set(lsKey(LAB_BUFF_KEY), Math.min(serverNow() + LAB_MAX_MIN * 60000, Math.max(serverNow(), LS.get(lsKey(LAB_BUFF_KEY), 0) || 0) + n * per * 60000));
    fxMemo = { k: "", v: null }; achBump("labs", n);
    toast(`🧫 ส่ง ${ITEMS[id].name} ×${n} — ผลวิจัยเหลือ ~${Math.ceil(labBuffLeft() / 60000)} นาที`);
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; try { renderBase(); } catch { /* ข้าม */ } }
}
function labRows(body) {
  const sm = state.inv?.lab_sample?.qty || 0, core = state.inv?.lab_core?.qty || 0, left = labBuffLeft();
  if (!sm && !core && !left) return;
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px";
  c.append(mk("b", "", "🧫 ห้องวิจัยของค่าย"));
  c.append(mk("span", "muted", `ส่งตัวอย่างวิจัยให้ค่ายวิเคราะห์ (ชิ้นละ +${LAB_MIN_PER} นาที / แกนวิจัยละ +${LAB_MIN_CORE} นาที สูงสุด ${LAB_MAX_MIN} นาที) ได้ผลวิจัย: ของหายากออกง่ายขึ้น 8% และของทุกชนิดออกง่ายขึ้น 3%${left > 0 ? ` • เหลือ ~${Math.ceil(left / 60000)} นาที` : ""}`));
  const row = mk("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
  const b1 = btn(`🧫 ส่ง 1 ชิ้น (มี ${sm})`, () => labSubmit("lab_sample", 1), "btn ghost mini"); b1.disabled = sm < 1;
  const b2 = btn(`🧫 ส่งทั้งหมด`, () => labSubmit("lab_sample", sm), "btn ghost mini"); b2.disabled = sm < 2;
  const b3 = btn(`💠 ส่งแกนวิจัย (มี ${core})`, () => labSubmit("lab_core", 1), "btn primary mini"); b3.disabled = core < 1;
  row.append(b1, b2, b3); c.append(row); body.append(c);
}
function expRows(body) {
  if (!expOn()) return;
  const can = expCan(), c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px";
  c.append(mk("b", "", "🧭 ทีมสำรวจ"));
  if (baseLv() < 1) { c.append(mk("span", "muted", "ต้องอัปเกรดที่พักถึงขั้น 1 ก่อน จึงจะส่งทีมสำรวจได้")); return body.append(c); }
  if (state.exp?.t) {
    const z = state.exp.z, [id, n] = expReward(z), left = expLeft();
    c.append(mk("span", "", `ไปที่ ${ZONES[z]?.icon || ""} ${ZONES[z]?.name || z} — ${left > 0 ? `กลับมาใน ~${baseHm(left)}` : "กลับมาแล้ว!"}`), worldBar(Math.min(1, 1 - left / EXP_MS), left > 0 ? `${Math.round((1 - left / EXP_MS) * 100)}%` : "พร้อมรับ"));
    const b = btn(`รับของ (${ITEMS[id].icon} ${ITEMS[id].name} ×${n})`, expClaim, "btn primary mini"); b.disabled = !baseCan() || left > 0; c.append(b);
  } else {
    c.append(mk("span", "muted", `ส่งทีมออกนอกค่าย 4 ชั่วโมง (จ่ายเสบียง ${expCost().map(([id, n]) => `${ITEMS[id].icon}×${n}`).join(" ")}) กลับมารับของได้ แม้ไม่ได้ออนไลน์ • ทีละ 1 ทีม`));
    const row = mk("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
    EXP_ZONES.forEach((z) => { const [id, n] = expReward(z), b = btn(`${ZONES[z].icon} ${ZONES[z].name} → ${ITEMS[id].icon}×${n}`, () => expStart(z), "btn ghost mini"); b.disabled = !can; row.append(b); });
    c.append(row);
  }
  body.append(c);
}

/* =========================================================
   47) 🎒 Release K — ปุ่มลัดบนแถบบน • 🧭 ภารกิจวันแรก • 🐾 สัตว์เลี้ยงประจำค่าย • 🎣 ตกปลา • 🍲 อาหารจากปลา (rules v39: onb/ pet/ + ปลาในท่าเรือ + อาหารปลา)
   - 🌳 ปุ่มต้นไม้ทักษะ/🧭 ภารกิจวันแรกอยู่แถบบน มีจุดแดงเมื่อมีสิ่งให้ทำ
   - ภารกิจวันแรก 6 ข้อ: รับของข้อละครั้งเดียวตลอดชีพ (onb/{uid}/s1..s6) — ความคืบหน้านับจากตัวนับความสำเร็จ ฝั่งเกมตรวจ rules ตรวจแค่ "รับซ้ำไม่ได้ + ของ/จำนวนตรงตาราง"
   - สัตว์เลี้ยง: ส่งออกไปหาของ 3 ชม. กลับมารับของ (pet/{uid} = {k, t}) ของที่ได้ผูกกับชนิดสัตว์ (rules ตรวจตรง ๆ)
   - ตกปลา: มนุษย์ที่ท่าเรือ เสีย 10 พลังงานต่อครั้ง ได้ปลา/ปลาทอง (เขียนผ่านช่องทางเก็บของโซนเดิม) อากาศมีผลกับความยากของมินิเกม
   - ปลา → ปลาย่าง/ซุปปลา (คราฟต์ที่ Safe Zone) กินแล้วฟื้นตามตาราง + บัฟสั้น ๆ (ฝั่งเกมล้วน ๆ เก็บในเครื่อง)
   ========================================================= */
const ONB_STEPS = [
  { k: "srch", n: 5, t: "ค้นหาไอเทม 5 ครั้ง", id: "bandage", q: 2 },
  { k: "use", n: 1, t: "ใช้ไอเทมจากกระเป๋า 1 ครั้ง", id: "water", q: 2 },
  { k: "trav", n: 1, t: "เดินทางไปโซนอื่น (แท็บ โซน/ผู้เล่น)", id: "energy_drink", q: 1 },
  { k: "found", n: 10, t: "ค้นหาจนเจอของรวม 10 ชิ้น", id: "medkit", q: 1 },
  { k: "bup", n: 1, t: "สร้างที่พัก (ปุ่ม 🏠 ที่พัก)", id: "water_jug", q: 1 },
  { k: "npc", n: 1, t: "คุยกับ NPC ที่ Safe Zone (มิรา/เคน)", id: "trauma_kit", q: 1 }
];
const onbOn = () => T("onb_on", 1) === 1;
const onbCnt = (k) => state.ach?.loaded ? (state.ach.c?.[k] || 0) : 0;
const onbDone = (i) => !!state.onb?.["s" + (i + 1)];
function onbOk(i) { const s = ONB_STEPS[i]; if (s.k === "bup" && baseLv() >= 1) return true; return onbCnt(s.k) >= s.n; }
const onbReady = () => ONB_STEPS.filter((_, i) => !onbDone(i) && onbOk(i)).length;
const onbLeft = () => ONB_STEPS.filter((_, i) => !onbDone(i)).length;
function onbInit() {
  if (state.onbOn || !state.uid) return; state.onbOn = true; state.onb = null;
  onValue(ref(db, "onb/" + state.uid), (s) => { state.onb = s.val() || {}; try { kTopTick(); onbRender(); } catch { /* ข้าม */ } }, (e) => console.warn("onb", e?.code || e));
}
async function onbClaim(i) {
  const s = ONB_STEPS[i], uid = state.uid; if (!s || !uid || state.busy || onbDone(i) || !onbOk(i)) return;
  state.busy = true;
  try {
    const have = (await get(ref(db, `inventory/${uid}/${s.id}/qty`))).val() || 0;
    if (have + s.q > 99) return toast(`ช่อง ${ITEMS[s.id].name} เต็ม — ใช้ก่อนแล้วค่อยรับ`);
    await update(ref(db), { [`onb/${uid}/s${i + 1}`]: serverTimestamp(), [`inventory/${uid}/${s.id}`]: { id: s.id, qty: have + s.q } });
    toast(`🎁 รับ ${ITEMS[s.id].icon} ${ITEMS[s.id].name} ×${s.q}`); try { logLine(`🧭 ภารกิจวันแรก “${s.t}” สำเร็จ — ได้ ${ITEMS[s.id].name} ×${s.q}`, "system"); } catch { /* ข้าม */ }
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; onbRender(); }
}
function onbRender() {
  const body = $("onb-body"); if (!body || $("onb-modal").classList.contains("hidden")) return; body.innerHTML = "";
  body.append(mk("div", "muted", "ทำตามขั้นตอนเหล่านี้เพื่อทำความรู้จักเกม รับของรางวัลได้ข้อละครั้งเดียวตลอดชีพ (ทำไปแล้วก็กดรับได้เลย)"));
  ONB_STEPS.forEach((s, i) => {
    const done = onbDone(i), ok = onbOk(i), c = Math.min(s.n, onbCnt(s.k)), r = mk("div", "world-row" + (ok && !done ? " evt-live" : ""));
    r.append(mk("div", "", `${done ? "✅" : ok ? "🎯" : "⬜"} ${i + 1}. ${s.t}`), mk("div", "muted", `${s.k === "bup" && baseLv() >= 1 ? "เสร็จแล้ว" : `ความคืบหน้า ${c}/${s.n}`} • รางวัล ${ITEMS[s.id].icon} ${ITEMS[s.id].name} ×${s.q}`));
    if (!done && ok) r.append(btn("รับรางวัล", () => onbClaim(i), "btn primary mini"));
    body.append(r);
  });
  if (!onbLeft()) body.append(mk("div", "", "🎉 ครบทุกข้อแล้ว — ขอให้รอดตลอดไป"));
}
function onbOpen() {
  if (!$("onb-modal")) {
    const m = mk("div", "modal hidden"); m.id = "onb-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "460px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🧭 ภารกิจวันแรก"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "onb-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("onb-modal").classList.remove("hidden"); onbRender();
}
function kInit() {
  if (state.kOn || !state.uid) return; state.kOn = true;
  try { onbInit(); } catch (e) { console.warn("onb init", e); }
  const pr = $("btn-profile"); if (pr) {
    const sk = btn("🌳 ทักษะ", () => { try { skOpen(); } catch { /* ข้าม */ } }, "btn ghost mini"); sk.id = "btn-sk"; pr.before(sk);
    const ob = btn("🧭 เริ่มต้น", onbOpen, "btn ghost mini"); ob.id = "btn-onb"; ob.classList.add("hidden"); pr.before(ob);
  }
  const sc = $("btn-scavenge"); if (sc) { const fb = btn("🎣 ตกปลา (−10 พลังงาน)", fishOpen, "btn ghost wide"); fb.id = "btn-fish"; fb.classList.add("hidden"); sc.after(fb); }
  setInterval(kTopTick, 5000); kTopTick();
  try { kInit2(); } catch (e) { console.warn("kInit2", e); }
}
function kTopTick() {
  const sk = $("btn-sk"), ob = $("btn-onb"), fb = $("btn-fish");
  if (sk) { let on = false, n = 0; try { on = skOn(); n = on ? skFreeAll() : 0; } catch { /* ข้าม */ } sk.classList.toggle("hidden", !on); sk.classList.toggle("btn-dot", n > 0); sk.title = n > 0 ? `มีแต้มทักษะว่าง ${n} แต้ม` : "ต้นไม้ทักษะ"; }
  if (ob) { const show = onbOn() && !!state.onb && onbLeft() > 0, rd = onbReady(); ob.classList.toggle("hidden", !show); ob.classList.toggle("btn-dot", rd > 0); ob.textContent = `🧭 เริ่มต้น ${ONB_STEPS.length - onbLeft()}/${ONB_STEPS.length}`; }
  if (fb) fb.classList.toggle("hidden", !fishCan());
  try { kTick2(); } catch { /* ข้าม */ }
}
function kZoneHook() { try { kTopTick(); } catch { /* ข้าม */ } }

/* ---- 🐾 สัตว์เลี้ยงประจำค่าย ---- */
const PET_MS = 10800000;
const PET_K = {
  dog: { f: "human", icon: "🐕", name: "หมาเฝ้าค่าย", id: "canned_food", q: 1 },
  cat: { f: "human", icon: "🐈", name: "แมวสายสืบ", id: "scrap", q: 2 },
  rat: { f: "zombie", icon: "🐀", name: "หนูซอมบี้", id: "rotten_meat", q: 2 },
  bat: { f: "zombie", icon: "🦇", name: "ค้างคาวกลางคืน", id: "moss", q: 1 }
};
const petOn = () => T("pet_on", 1) === 1;
const petLeft = () => state.pet?.t > 0 ? Math.max(0, state.pet.t + PET_MS - serverNow()) : 0;
const petOut = () => !!state.pet && state.pet.t > 0;
const petReady = () => petOut() && petLeft() <= 0;
function petInit() {
  if (state.petOn || !state.uid) return; state.petOn = true; state.pet = null;
  onValue(ref(db, "pet/" + state.uid), (s) => { state.pet = s.val() || null; try { baseBadge(); baseAgain(); } catch { /* ข้าม */ } }, (e) => console.warn("pet", e?.code || e));
}
async function petWrite(label, val, extra) {
  if (state.busy || !baseCan() || !petOn()) return toast("ต้องอยู่ที่ Safe Zone และมีที่พักขั้น 1 ขึ้นไป"); state.busy = true;
  try { await update(ref(db), { ...val, ...(extra || {}) }); if (label) toast(label); }
  catch (e) { toast(baseErr(e)); } finally { state.busy = false; baseAgain(); }
}
const petAdopt = (k) => petWrite(`${PET_K[k].icon} รับ${PET_K[k].name}มาเลี้ยงแล้ว`, { ["pet/" + state.uid]: { k, t: 0 } });
const petSend = () => petWrite(`${PET_K[state.pet.k].icon} ส่ง${PET_K[state.pet.k].name}ออกไปหาของแล้ว กลับมาใน ~3 ชั่วโมง`, { [`pet/${state.uid}/t`]: serverTimestamp() });
async function petClaim() {
  const pk = state.pet && PET_K[state.pet.k]; if (!pk || !petReady() || state.busy) return;
  const have = (await get(ref(db, `inventory/${state.uid}/${pk.id}/qty`))).val() || 0;
  if (have + pk.q > 99) return toast(`ช่อง ${ITEMS[pk.id].name} เต็ม — ใช้ก่อนแล้วค่อยรับ`);
  await petWrite(`${pk.icon} ${pk.name}กลับมาแล้ว! ได้ ${ITEMS[pk.id].icon} ${ITEMS[pk.id].name} ×${pk.q}`, { [`pet/${state.uid}/t`]: 0, [`inventory/${state.uid}/${pk.id}`]: { id: pk.id, qty: have + pk.q } });
  try { achBump("petc"); petBonusAfterClaim(); } catch { /* ข้าม */ }
}
function petRows(body) {
  if (!petOn()) return;
  const fac = state.profile?.faction, kinds = Object.entries(PET_K).filter(([, d]) => d.f === fac);
  const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px";
  c.append(mk("b", "", "🐾 สัตว์เลี้ยงประจำค่าย"));
  if (baseLv() < 1) { c.append(mk("span", "muted", "ต้องอัปเกรดที่พักถึงขั้น 1 ก่อนจึงรับเลี้ยงได้")); return body.append(c); }
  const row = mk("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
  const pk = state.pet && PET_K[state.pet.k];
  if (!pk) {
    c.append(mk("span", "muted", "เลือกเพื่อนร่วมค่าย ส่งออกไปหาของรอบละ 3 ชั่วโมง กลับมารับได้แม้คุณไม่ได้ออนไลน์ (เปลี่ยนตัวได้ตอนที่มันอยู่ที่ค่าย)"));
    kinds.forEach(([k, d]) => { const b = btn(`${d.icon} ${d.name} → ${ITEMS[d.id].icon}×${d.q}`, () => petAdopt(k), "btn ghost mini"); b.disabled = !baseCan(); row.append(b); });
    c.append(row); return body.append(c);
  }
  if (petOut()) {
    const left = petLeft(); c.append(mk("span", "", `${pk.icon} ${pk.name} ออกไปหาของ — ${left > 0 ? `กลับมาใน ~${baseHm(left)}` : "กลับมาแล้ว!"}`), worldBar(Math.min(1, 1 - left / PET_MS), left > 0 ? `${Math.round((1 - left / PET_MS) * 100)}%` : "พร้อมรับ"));
    const b = btn(`รับของ (${ITEMS[pk.id].icon} ${ITEMS[pk.id].name} ×${pk.q})`, petClaim, "btn primary mini"); b.disabled = !baseCan() || left > 0; row.append(b);
  } else {
    c.append(mk("span", "muted", `${pk.icon} ${pk.name} อยู่ที่ค่าย — ส่งออกไปหาของ ${ITEMS[pk.id].icon} ${ITEMS[pk.id].name} ×${pk.q} (3 ชั่วโมง)`));
    const b = btn("ส่งออกไปหาของ", petSend, "btn primary mini"); b.disabled = !baseCan(); row.append(b);
    kinds.filter(([k]) => k !== state.pet.k).forEach(([k, d]) => { const s = btn(`เปลี่ยนเป็น ${d.icon}`, () => { if (confirm(`เปลี่ยนเป็น ${d.name}?`)) petAdopt(k); }, "btn ghost mini"); s.disabled = !baseCan(); row.append(s); });
    if (!kinds.some(([k]) => k === state.pet.k)) c.append(mk("span", "muted", "ฝ่ายของคุณเปลี่ยนไปแล้ว เลือกเพื่อนร่วมค่ายตัวใหม่ได้"));
  }
  c.append(row); body.append(c);
}

/* ---- 🍲 บัฟจากอาหารปลา (เก็บในเครื่อง) ---- */
const MEALS = { fish_grill: { min: 20, name: "อิ่มปลาย่าง", tip: "ไม่เจออะไรน้อยลง 7%" }, fish_stew: { min: 30, name: "อุ่นท้องซุปปลา", tip: "ลดดาเมจที่โดน 5%" } };
const mealRec = () => { const r = LS.get(lsKey("meal"), null); return r && MEALS[r.id] && r.until > serverNow() ? r : null; };
function mealOnUse(id) { const m = MEALS[id]; if (!m) return; LS.set(lsKey("meal"), { id, until: serverNow() + m.min * 60000 }); fxMemo = { k: "", v: null }; toast(`🍽️ ${m.name} ${m.min} นาที: ${m.tip}`); }
function mealMods(m) { const r = mealRec(); if (r && r.id === "fish_grill") m.n *= 0.93; }
const mealCut = () => { const r = mealRec(); return r && r.id === "fish_stew" ? 0.05 : 0; };

/* ---- 🎣 ตกปลา ---- */
const FISH_COST = 10;
const FISH_WX = { clear: [0.22, 1], rain: [0.3, 0.95], fog: [0.22, 1], storm: [0.15, 1.35] };   // [สัดส่วนโซนเขียว, ความเร็วเครื่องหมาย]
const fishOn = () => T("fish_on", 1) === 1;
let fishRun = null;
function fishCan() { const p = state.profile; return !!(fishOn() && p && p.faction === "human" && p.hp > 0 && state.zone === "port" && !state.boss); }
function fishClose() { if (fishRun) { clearTimeout(fishRun.tm); cancelAnimationFrame(fishRun.raf); fishRun.dead = true; } fishRun = null; $("fish-modal")?.classList.add("hidden"); }
function fishOpen() {
  if (!fishCan()) return toast("ตกปลาได้เฉพาะมนุษย์ที่ท่าเรือ");
  if (state.busy) return;
  if (curFood() <= 0 || curWater() <= 0) return toast("หิวหรือกระหายเกินไป — กินอาหาร/ดื่มน้ำก่อน");
  if (curStamina() < FISH_COST) return toast("พลังงานไม่พอ");
  if (!$("fish-modal")) {
    const m = mk("div", "modal hidden"); m.id = "fish-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "420px";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🎣 ตกปลา"), btn("ปิด", fishClose, "btn ghost mini"));
    const body = mk("div"); body.id = "fish-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("fish-modal").classList.remove("hidden"); fishCast();
}
function fishCast() {
  const body = $("fish-body"); if (!body) return; body.innerHTML = "";
  const w = wxNow().type, [zw, sp] = FISH_WX[w] || FISH_WX.clear, W = WX[w];
  const st = mk("div", "", "🎣 ปล่อยเบ็ดแล้ว… รอให้ทุ่นจม แล้วกด “ดึง!” ตอนเครื่องหมายอยู่ในโซนเขียว"), wx = mk("div", "muted", `${W.icon} ${W.name}: ${w === "rain" ? "ปลากินเบ็ดง่าย โซนเขียวกว้างขึ้น" : w === "storm" ? "คลื่นแรง โซนเขียวแคบและเร็ว" : "ทะเลปกติ"}`);
  const track = mk("div"); track.style.cssText = "position:relative;height:30px;border-radius:8px;background:#222a33;overflow:hidden";
  const a = 0.08 + Math.random() * (0.84 - zw), zone = mk("div"); zone.style.cssText = `position:absolute;top:0;bottom:0;left:${a * 100}%;width:${zw * 100}%;background:#2e7d32;opacity:.85`;
  const mk2 = mk("div"); mk2.style.cssText = "position:absolute;top:2px;bottom:2px;width:6px;left:0;background:#e8a33d;border-radius:3px"; track.append(zone, mk2);
  const pull = btn("ดึง!", () => fishPull(), "btn primary wide"); body.append(st, track, wx, pull);
  const run = fishRun = { phase: "wait", a, zw, sp, st, mk2, pull, track, body };
  run.tm = setTimeout(() => {
    if (run.dead) return; run.phase = "bite"; run.t0 = performance.now(); st.textContent = "🐟 ทุ่นจมแล้ว! ดึงเลย!";
    const loop = () => { if (run.dead || run.phase !== "bite") return; const el = performance.now() - run.t0; if (el > 4200) return fishResolve(run, null); const p = (el / (1500 / run.sp)) % 2; run.pos = p < 1 ? p : 2 - p; run.mk2.style.left = `calc(${run.pos * 100}% - 3px)`; run.raf = requestAnimationFrame(loop); };
    run.raf = requestAnimationFrame(loop);
  }, 1200 + Math.random() * 2300);
}
function fishPull() {
  const run = fishRun; if (!run || run.dead) return;
  if (run.phase === "wait") { clearTimeout(run.tm); run.dead = true; run.st.textContent = "ดึงเร็วไป ปลาตกใจหนีไปแล้ว (ไม่เสียพลังงาน)"; run.pull.textContent = "ลองใหม่"; run.pull.onclick = () => { fishRun = null; fishCast(); }; return; }
  if (run.phase === "bite") { cancelAnimationFrame(run.raf); fishResolve(run, run.pos); }
}
async function fishResolve(run, pos) {
  if (run.phase === "done") return; run.phase = "done"; run.dead = true; run.pull.disabled = true;
  const hit = pos != null && pos >= run.a && pos <= run.a + run.zw, perfect = hit && Math.abs(pos - (run.a + run.zw / 2)) < run.zw * 0.18;
  const id = hit ? (perfect && Math.random() < 0.25 ? "golden_fish" : "fish") : null;
  const again = (msg) => { run.st.textContent = msg; run.pull.disabled = false; run.pull.textContent = "ตกต่อ"; run.pull.onclick = () => { fishRun = null; if (!fishCan() || curStamina() < FISH_COST) return fishClose(); fishCast(); }; };
  if (state.busy) return again("ระบบกำลังทำงานอยู่ ลองใหม่อีกครั้ง");
  state.busy = true;
  try {
    const u = {}, cur = curStamina();
    u[`users/${state.uid}/stamina`] = cur - FISH_COST; u[`users/${state.uid}/staminaTs`] = serverTimestamp();
    if (id) { if ((state.inv[id]?.qty || 0) >= 99) { again("ช่องเก็บปลาเต็ม (99) — ทำอาหารก่อน"); return; } invAddUpdate(u, id, 1); }
    await update(ref(db), u);
    if (id) { try { achBump("fish"); } catch { /* ข้าม */ } logLine(`🎣 ตกได้ ${ITEMS[id].icon} ${ITEMS[id].name}${id === "golden_fish" ? " ตัวทองอร่าม!" : ""}`, "info"); again(`${ITEMS[id].icon} ได้ ${ITEMS[id].name}!${perfect ? " (ดึงเป๊ะ)" : ""}`); }
    else again(pos == null ? "🐟 ปลาหลุดเบ็ดไปแล้ว… (เสีย 10 พลังงาน)" : "ดึงไม่ตรงจังหวะ ปลาหนีไป (เสีย 10 พลังงาน)");
  } catch (e) { again(errMsg(e)); }
  finally { state.busy = false; try { kTopTick(); } catch { /* ข้าม */ } }
}

/* =========================================================
   48) 🧰 Release L — ระบบเสริมฝั่งเกมล้วน (ไม่แตะ rules)
   1 กรอง/จัดกลุ่มกระเป๋า • 2 การ์ดข้อมูลไอเทม • 3 คราฟต์เป็นชุด • 4 ตัวจับเวลารวม • 5 แจ้งเตือนของพร้อมรับ • 6 ตัวเลขบนแท็บ
   7 โซนแนะนำ • 8 พรีวิวเดินทาง • 9 ป้ายบอกสิ่งที่ควรทำต่อ • 10 กรองบันทึกเหตุการณ์ • 11 ขนาดตัวอักษร/โหมดกะทัดรัด • 12 ปุ่มลัดคีย์บอร์ด
   ทุกอย่างอ่านข้อมูลที่เกมมีอยู่แล้ว (ไม่มีการเขียนฐานข้อมูลเพิ่ม ยกเว้นคราฟต์เป็นชุดที่เรียกคราฟต์เดิมทีละชิ้น)
   ========================================================= */
// ---- 1) กรอง/จัดกลุ่มกระเป๋า ----
const INV_CATS = { w: "🗡️ อาวุธ", g: "🛡️ เกียร์", m: "💊 ยา/พลังงาน", f: "🍖 อาหาร/น้ำ", x: "🧱 วัสดุ/อื่น ๆ" };
const INV_ORDER = ["w", "g", "m", "f", "x"];
function invCat(it, def) {
  if (!def) return "x";
  if (def.type === "weapon") return "w";
  if (def.type === "gear") return "g";
  if (def.type === "consumable" || it.id === "custom_food") return (def.food > 0 || def.water > 0) ? "f" : (def.heal || def.stamina || FX_CURES[it.id] || def.type === "consumable") ? "m" : "x";
  return "x";
}
function invList() {
  const q = String(state.invQ || "").trim().toLowerCase(), cat = state.invCat || "";
  return Object.entries(state.inv || {}).map(([slot, it]) => ({ slot, it, def: defOf(it) })).filter((r) => r.def)
    .map((r) => ({ ...r, cat: invCat(r.it, r.def) }))
    .filter((r) => (!cat || r.cat === cat) && (!q || String(r.def.name || "").toLowerCase().includes(q) || String(r.it.id || "").toLowerCase().includes(q)))
    .sort((a, b) => INV_ORDER.indexOf(a.cat) - INV_ORDER.indexOf(b.cat) || (state.profile?.equipped === b.slot) - (state.profile?.equipped === a.slot) || String(a.def.name).localeCompare(String(b.def.name), "th"))
    .map((r) => [r.slot, r.it, r.cat]);
}
function invGroupHdr(ul, cat) {
  if (state.invLastCat === cat) return; state.invLastCat = cat;
  const h = mk("li", "inv-h", INV_CATS[cat] || ""); h.style.cssText = "list-style:none;font-size:12px;color:var(--muted);padding:6px 2px 0;border:0;background:none"; ul.append(h);
}
function invFiltering() { return !!(String(state.invQ || "").trim() || state.invCat); }
function invToolsInit() {
  const ul = $("inv-list"); if (!ul || $("inv-tools")) return;
  const box = mk("div"); box.id = "inv-tools"; box.style.cssText = "display:grid;gap:6px;margin:4px 0 8px";
  const inp = mk("input"); inp.type = "search"; inp.placeholder = "🔎 ค้นหาไอเทมในกระเป๋า…"; inp.id = "inv-q"; inp.style.cssText = "padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--panel-2);color:var(--text);font-size:14px";
  inp.addEventListener("input", () => { state.invQ = inp.value; renderInv(); });
  const chips = mk("div"); chips.style.cssText = "display:flex;flex-wrap:wrap;gap:6px"; chips.id = "inv-chips";
  [["", "ทั้งหมด"], ...INV_ORDER.map((c) => [c, INV_CATS[c].split(" ")[0]])].forEach(([c, l]) => { const b = btn(l, () => { state.invCat = c; invChipsSync(); renderInv(); }, "btn ghost mini"); b.dataset.c = c; b.title = c ? INV_CATS[c] : "ทุกหมวด"; chips.append(b); });
  box.append(inp, chips); ul.before(box); invChipsSync();
}
function invChipsSync() { document.querySelectorAll("#inv-chips button").forEach((b) => b.classList.toggle("on", (b.dataset.c || "") === (state.invCat || ""))); }

// ---- 2) การ์ดข้อมูลไอเทม ----
const ITEM_NOTE = {
  fish: "ตกได้ที่ท่าเรือ (ปุ่ม 🎣 ตกปลา) — เอาไปคราฟต์ปลาย่าง/ซุปปลา", golden_fish: "ตกได้ที่ท่าเรือเมื่อดึงเบ็ดได้เป๊ะ ๆ (หายาก) — สมทบโปรเจกต์ค่ายได้แต้มสูง",
  dna_frag: "เศษ DNA จากศูนย์วิจัยร้าง (ดรอปยาก ช่วงภารกิจ HC) — ส่งให้ธาราที่ค่ายผ่านการ์ด “คนในค่าย” ยอดรวมทั้งเซิร์ฟเวอร์",
  lab_core: "ดรอปจากบอสศูนย์วิจัย — ส่งให้ห้องวิจัยของค่าย (ที่พัก) เพื่อรับผลวิจัยชั่วคราว", lab_blade: "ดรอปจากบอสศูนย์วิจัย (หายาก)", lab_sample: "ส่งให้ห้องวิจัยของค่ายเพื่อรับผลวิจัยชั่วคราว หรือเอาไปคราฟต์ซีรั่มทดลอง",
  exp_serum: "ฟื้น 60 HP และรักษาเลือดไหล/พิษทุกระดับ", fish_grill: "กินแล้วได้บัฟ “อิ่มปลาย่าง” 20 นาที (ไม่เจออะไรน้อยลง 7%)", fish_stew: "กินแล้วได้บัฟ “อุ่นท้องซุปปลา” 30 นาที (ลดดาเมจที่โดน 5%)",
  boss_trophy: "ถ้วยรางวัลจากบอสประจำโซน — ของสะสมหายาก ขายในตลาดได้", lab_keycard: "บัตรผ่านจากศูนย์วิจัยร้าง — ของสะสม/ของส่งภารกิจในเนื้อเรื่องภายหลัง", data_chip: "ชิปข้อมูลวิจัยจากศูนย์วิจัยร้าง — ของสะสม/ของส่งภารกิจในเนื้อเรื่องภายหลัง", survivor_badge: "เข็มกลัดของผู้รอดชีวิต — ของสะสม ขายในตลาดได้", old_photo: "ภาพถ่ายเก่า — ของสะสม ขายในตลาดได้", gold_watch: "นาฬิกาทอง — ของสะสมมูลค่าสูง ขายในตลาดได้",
  scrap: "วัสดุหลักของการคราฟต์ซ่อมอาวุธและกำแพง", chem: "วัสดุคราฟต์ยาและเกราะ", rotten_meat: "อาหารของซอมบี้ (ซอมบี้เท่านั้นที่กินได้)"
};
function itemSources(id) {
  const out = [], zs = Object.keys(ZONES).filter((z) => z !== "safe");
  const hz = zs.filter((z) => (ZONES[z].drops || []).some((d) => d.id === id) || GEAR_DROPS[z]?.[id] || MAT_DROPS[z]?.[id]), zz = zs.filter((z) => MUT_DROPS[z]?.[id] || (id === "rotten_meat" && ZOMBIE_EXTRA[z]));
  if (ZONES.safe.drops?.some((d) => d.id === id)) out.push("🏕️ ค้นหาใน Safe Zone");
  if (hz.length) out.push("ค้นหาที่: " + hz.map((z) => `${ZONES[z].icon}${ZONES[z].name}`).join(", "));
  if (zz.length && !hz.length) out.push("ซอมบี้ค้นหาที่: " + zz.map((z) => `${ZONES[z].icon}${ZONES[z].name}`).join(", "));
  const bs = Object.entries(BOSSES).filter(([, b]) => (b.loot || []).some((d) => d.id === id) || (b.bonus || []).some((d) => d.id === id)).map(([z, b]) => `${b.icon} ${b.name}`);
  if (bs.length) out.push("บอสโซนที่ดรอป: " + bs.join(", "));
  const ex = Object.entries(EXP_H).filter(([, v]) => v[0] === id).map(([z]) => ZONES[z]?.name).filter(Boolean); if (ex.length) out.push("ทีมสำรวจ (มนุษย์) จาก: " + ex.join(", "));
  if (id === "rotten_meat") out.push("ทีมสำรวจ/สัตว์เลี้ยง/สถานีที่พัก (ซอมบี้)");
  const pk = Object.values(PET_K).filter((d) => d.id === id); if (pk.length) out.push("สัตว์เลี้ยงหาให้: " + pk.map((d) => `${d.icon}${d.name}`).join(", "));
  const bn = Object.values(BENCH).filter((b) => b.out[0] === id); if (bn.length) out.push("โต๊ะงานที่พัก: " + bn.map((b) => b.name).join(", "));
  const cr = Object.values(RECIPES).filter((r) => r.out === id); cr.forEach((r) => out.push("ประกอบจาก: " + Object.entries(r.need).map(([m, n]) => `${ITEMS[m].icon}${ITEMS[m].name}×${n}`).join(" + ")));
  return out;
}
function itemUses(id) {
  const out = [], rc = Object.entries(RECIPES).filter(([, r]) => r.need[id]).map(([, r]) => `${ITEMS[r.out].icon}${ITEMS[r.out].name}`); if (rc.length) out.push("ใช้ประกอบ: " + rc.join(", "));
  const bn = Object.values(BENCH).filter((b) => b.in[0] === id).map((b) => b.name); if (bn.length) out.push("ใส่โต๊ะงาน: " + bn.join(", "));
  const pj = PROJ_ITEMS[state.profile?.faction === "zombie" ? "zombie" : "human"]?.[id]; if (pj) out.push(`สมทบโปรเจกต์ค่าย ${pj} แต้มต่อชิ้น`);
  if (typeof GIFT_IDS !== "undefined" && GIFT_IDS.includes?.(id)) out.push("ฝากเป็นของขวัญให้เพื่อนได้ (เยี่ยมบ้านเพื่อน)");
  return out;
}
function itemInfoOpen(id) {
  const def = ITEMS[id]; if (!def) return;
  if (!$("iteminfo-modal")) {
    const m = mk("div", "modal hidden"); m.id = "iteminfo-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "420px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "ข้อมูลไอเทม"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "iteminfo-body"; body.style.cssText = "display:grid;gap:8px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m); m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
  }
  const body = $("iteminfo-body"); body.textContent = "";
  const T2 = { weapon: "อาวุธ", gear: "เกียร์/ของสวมใส่", consumable: "ของใช้", material: "วัสดุ", stat: "ยาปรับสเตตัส" };
  body.append(mk("b", "", `${def.icon} ${def.name}`), mk("div", "muted", `${T2[def.type] || def.type} • คุณมี ×${state.inv?.[id]?.qty || (Object.values(state.inv || {}).filter((x) => x.id === id).length) || 0}`));
  const fx = effectText(def); if (fx) body.append(mk("div", "", `ผล: ${fx}`));
  if (def.type === "weapon") body.append(mk("div", "", `ดาเมจ ${def.dmg} • ความทน ${def.maxDur}${WPN_PROC[id] ? ` • ${WPN_PROC[id]}% ทำให้บอสเลือดไหล` : ""}`));
  if (def.type === "gear") body.append(mk("div", "", `ช่อง: ${GEAR_SLOTS[def.slot] || def.slot}${GEAR_FX[id] ? ` • ${GEAR_FX[id]}` : ""}${def.zombieOnly ? " • เฉพาะซอมบี้" : ""}`));
  if (ITEM_NOTE[id]) body.append(mk("div", "", "📝 " + ITEM_NOTE[id]));
  else if (ITEMS[id]?.type === "material" && !ITEMS[id].gmOnly && !["lab_sample", "dna_frag", "lab_core", "fish", "golden_fish"].includes(id)) body.append(mk("div", "", "📝 วัตถุดิบ — ใช้คราฟต์ในอัปเดตถัดไป ขายในตลาดได้"));
  const src = itemSources(id), use = itemUses(id);
  if (src.length) { body.append(mk("b", "", "หาได้จาก")); src.forEach((s) => body.append(mk("div", "muted", "• " + s))); }
  if (use.length) { body.append(mk("b", "", "ใช้ทำอะไรได้")); use.forEach((s) => body.append(mk("div", "muted", "• " + s))); }
  if (!src.length && !use.length && !ITEM_NOTE[id] && !fx) body.append(mk("div", "muted", "ยังไม่มีข้อมูลเพิ่มเติมของไอเทมนี้"));
  $("iteminfo-modal").classList.remove("hidden");
}
function invInfoHook(li, it) {
  if (!it || !ITEMS[it.id]) return; const sp = li.querySelector("span"); if (!sp) return;
  sp.style.cursor = "pointer"; sp.title = "แตะเพื่อดูข้อมูลไอเทม"; sp.addEventListener("click", () => itemInfoOpen(it.id));
}

// ---- 3) คราฟต์เป็นชุด ----
const craftMax = (id) => { const r = RECIPES[id]; return r ? Math.min(...Object.entries(r.need).map(([m, n]) => Math.floor((state.inv[m]?.qty || 0) / n))) : 0; };
async function craftMany(id, n) {
  if (state.busy) return; const r = RECIPES[id]; if (!r) return;
  n = Math.min(n, craftMax(id), 20); if (n < 1) return toast("วัตถุดิบไม่พอ");
  let done = 0; state.craftQuiet = true;
  try { for (let i = 0; i < n; i++) { if (craftMax(id) < 1) break; const ok = await craft(id); if (!ok) break; done++; await new Promise((res) => setTimeout(res, 150)); } }
  finally { state.craftQuiet = false; }
  if (done) { toast(`🛠️ ประกอบ ${ITEMS[r.out].name} ×${done} สำเร็จ`); try { logLine(`🛠️ คุณประกอบ ${ITEMS[r.out].name} ×${done}`, "info"); } catch { /* ข้าม */ } }
}

// ---- 4) ตัวจับเวลารวม + 7) โซนแนะนำ (แสดงในแท็บ โลก) ----
function kFmt(ms) { return baseHm(Math.max(0, ms)); }
function kTimers() {
  const rows = [], now = serverNow(), add = (icon, text, left, ready) => rows.push({ icon, text, left, ready });
  try { if (state.exp?.t) add("🧭", "ทีมสำรวจ", expLeft(), expLeft() <= 0); else if (baseLv() >= 1 && expOn()) add("🧭", "ทีมสำรวจ: ว่าง (ส่งได้เลย)", 0, false); } catch { /* ข้าม */ }
  try { if (petOn() && state.pet) { const pk = PET_K[state.pet.k]; if (petOut()) add(pk?.icon || "🐾", `${pk?.name || "สัตว์เลี้ยง"} ออกไปหาของ`, petLeft(), petLeft() <= 0); else add(pk?.icon || "🐾", `${pk?.name || "สัตว์เลี้ยง"}: อยู่ที่ค่าย (ส่งออกไปได้)`, 0, false); } } catch { /* ข้าม */ }
  try { for (let j = 1; j <= benchSlots(); j++) { const rec = state.base?.["j" + j]; if (rec && BENCH[rec.r]) { const l = benchLeft(rec); add("🛠️", `โต๊ะงาน ${j}: ${BENCH[rec.r].name}`, l, l <= 0); } } } catch { /* ข้าม */ }
  try { let u = 0; for (let i = 1; i <= baseSlots(); i++) u += baseUnits(state.base?.["s" + i]); if (u > 0) add("🏠", `สถานีที่พักมีผลผลิตรอเก็บ ${u} ชิ้น`, 0, true); } catch { /* ข้าม */ }
  try { const l = labBuffLeft(); if (l > 0) add("🧫", "ผลวิจัย (ของหายาก +8%)", l, false); } catch { /* ข้าม */ }
  try { const m = mealRec(); if (m) add("🍽️", `${MEALS[m.id].name} (${MEALS[m.id].tip})`, m.until - now, false); } catch { /* ข้าม */ }
  try { const d = duoBuffLeft(); if (d > 0) add("🤝", "โชคเคียงข้าง", d, false); } catch { /* ข้าม */ }
  try { const c = travelCooldownLeft(); if (c > 0) add("🧭", "พักเดินทาง", c, false); const b = bossCooldownLeft(); if (b > 0) add("👹", "บอสโซนกลับมาเจอได้ใน", b, false); } catch { /* ข้าม */ }
  try { evtActive(now).forEach((e) => add(EVT_TYPES[e.type].icon, `${EVT_TYPES[e.type].name} • ${ZONES[e.zone]?.name || e.zone}`, e.end - now, false)); } catch { /* ข้าม */ }
  try { const w = wxNow(now); add(WX[w.type].icon, `สภาพอากาศ: ${WX[w.type].name}`, w.end - now, false); } catch { /* ข้าม */ }
  try { add("📜", "ภารกิจรายวันรีเซ็ตใน", qpResetIn("daily"), false); } catch { /* ข้าม */ }
  return rows;
}
function kTimersRows(box) {
  fxSection(box, "ktimers", "⏱️ ตัวจับเวลารวม", (b) => {
    const rows = kTimers(); if (!rows.length) return b.append(mk("div", "muted", "ยังไม่มีอะไรที่นับเวลาอยู่"));
    rows.forEach((r) => { const row = mk("div", "world-row" + (r.ready ? " evt-live" : "")); row.append(mk("div", "", `${r.icon} ${r.text}`), mk("div", "muted", r.ready ? "✅ พร้อมรับ" : r.left > 0 ? `เหลือ ~${kFmt(r.left)}` : "—")); b.append(row); });
  }, true);
}
function zrecVal(id, fac) {
  const D = ITEMS[id]; if (!D || id === "boss") return 0; const food = curFood(), water = curWater(), hp = state.profile?.hp || 0, low = (v) => v < 50;
  if (id === "rotten_meat") return fac === "zombie" ? (low(food) ? 3 : 1.2) : 0;
  if (FX_FOOD.has(id)) return fac === "human" ? (low(food) ? 3 : 1.2) : 0.3;
  if (id === "water" || id === "water_jug") return fac === "human" ? (low(water) ? 3 : 1.2) : 0.6;
  if (D.heal > 0) return hp < maxHp() * 0.7 ? 2.6 : 1.4;
  if (D.type === "gear") return (state.inv?.[id]?.qty || 0) ? 0.8 : 2.2;
  if (id === "chem" || id === "scrap") return fac === "human" ? 1.1 : 0.2;
  return 1.1;
}
function zrecScore(z, fac) {
  const t = fac === "zombie" ? zombieDrops(z) : humanDrops(z), tot = t.reduce((s, d) => s + d.w, 0) || 1; let u = 0; const part = {};
  for (const d of t) { if (d.id === "zombie") { if (fac === "human") u -= (d.w / tot) * 5; continue; } if (!d.id) continue; const v = zrecVal(d.id, fac), c = (d.w / tot) * v; u += c; if (c > 0) part[d.id] = (part[d.id] || 0) + c; }
  let s = u * 10 - (z === state.zone ? 0 : travelCost(z) * 0.12) - ZONES[z].danger * 0.15, tag = "";
  try { const e = evtHere(z); if (e) { const T2 = EVT_TYPES[e.type]; tag = `${T2.icon} ${T2.name}`; s += e.type === "air" ? 2.5 : e.type === "blackout" ? 1.5 : fac === "zombie" ? 2 : -2; } } catch { /* ข้าม */ }
  const top = Object.entries(part).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => `${ITEMS[id].icon}${ITEMS[id].name}`);
  return { z, s, top, tag };
}
function zrecList() {
  const p = state.profile; if (!p) return []; const fac = p.faction === "zombie" ? "zombie" : "human";
  return Object.keys(ZONES).filter((z) => z !== "safe").map((z) => zrecScore(z, fac)).sort((a, b) => b.s - a.s);
}
function kRecRows(box) {
  fxSection(box, "krec", "🧭 โซนแนะนำตอนนี้", (b) => {
    const L = zrecList().slice(0, 3); if (!L.length) return;
    L.forEach((r, i) => {
      const row = mk("div", "world-row" + (i === 0 ? " evt-live" : "")), z = ZONES[r.z];
      row.append(mk("div", "", `${i === 0 ? "⭐ " : ""}${z.icon} ${z.name}${r.z === state.zone ? " (คุณอยู่ที่นี่)" : ""}`), mk("div", "muted", `เหมาะกับ ${r.top.join(", ") || "ของทั่วไป"}${r.tag ? ` • ${r.tag}` : ""} • ⚠ ${z.danger}/10 • ⚡ ${r.z === state.zone ? 0 : travelCost(r.z)}`));
      if (r.z !== state.zone) row.append(btn("ไปเลย", () => { try { $("hub-modal")?.classList.add("hidden"); } catch { /* ข้าม */ } enterZone(r.z); try { setTab("chat"); } catch { /* ข้าม */ } }, "btn ghost mini"));
      b.append(row);
    });
    b.append(mk("div", "muted", "คำแนะนำคร่าว ๆ จากของที่หาได้ตอนนี้ สภาพอากาศ เหตุการณ์ และความหิว/HP ของคุณ — ตัดสินใจเองได้เสมอ"));
  }, true);
}
function kWorldRows(box) { try { kRecRows(box); } catch (e) { console.warn("krec", e); } try { kTimersRows(box); } catch (e) { console.warn("ktimers", e); } }

// ---- 5) แจ้งเตือนของพร้อมรับ (เด้งเมื่อปิดหน้าเกมอยู่) ----
function kNotifyTick() {
  const p = state.profile; if (!p || !state.uid) return;
  const cur = { exp: !!(typeof expReady === "function" && expReady()), pet: !!(typeof petReady === "function" && petReady()), bench: (typeof benchDone === "function" ? benchDone() : 0) > 0 };
  const prev = state.nf2 || (state.nf2 = { ...cur });
  if (cur.exp && !prev.exp) notifyOS("🧭 ทีมสำรวจกลับมาแล้ว", "กลับ Safe Zone ไปรับของได้เลย", "exp");
  if (cur.pet && !prev.pet) notifyOS("🐾 สัตว์เลี้ยงกลับมาแล้ว", "แวะที่พักไปรับของที่มันหามาได้", "pet");
  if (cur.bench && !prev.bench) notifyOS("🛠️ โต๊ะงานเสร็จแล้ว", "แวะที่พักไปรับของที่ทำเสร็จได้", "bench");
  state.nf2 = cur;
}

// ---- 6) ตัวเลขบนแท็บเบราว์เซอร์ ----
let kTitle0 = null;
function kTitleTick() {
  if (kTitle0 === null) kTitle0 = document.title.replace(/^\(\d+\)\s*/, "");
  let n = 0; try { n += baseReady(); } catch { /* ข้าม */ } try { n += qpClaimable(); } catch { /* ข้าม */ } try { n += onbReady(); } catch { /* ข้าม */ }
  const t = n > 0 ? `(${n}) ${kTitle0}` : kTitle0; if (document.title !== t) document.title = t;
}

// ---- 8) พรีวิวเดินทางบนปุ่มโซน + ดาวโซนแนะนำ ----
function zonePreview() {
  const best = (() => { try { return zrecList()[0]?.z; } catch { return null; } })();
  document.querySelectorAll(".zone-btn").forEach((b) => {
    const z = b.dataset.zone; if (!z || !ZONES[z]) return;
    let c = b.querySelector(".zp"); if (!c) { c = mk("span", "zp"); c.style.cssText = "display:block;font-size:10px;opacity:.85;line-height:1.2"; b.append(c); }
    let ev = ""; try { const e = evtHere(z); if (e) ev = " " + EVT_TYPES[e.type].icon; } catch { /* ข้าม */ }
    const txt = z === state.zone ? "📍" : `⚡${travelCost(z)}${ev}${z === best ? " ⭐" : ""}`; if (c.textContent !== txt) c.textContent = txt;
    b.title = `${ZONES[z].name} • อันตราย ${ZONES[z].danger}/10${z === state.zone ? "" : ` • เดินทางเสีย ${travelCost(z)} พลังงาน`}${z === best ? " • ⭐ แนะนำตอนนี้" : ""}`;
  });
}

// ---- 9) ป้ายบอกสิ่งที่ควรทำต่อ ----
function kHintText() {
  const p = state.profile; if (!p || p.hp <= 0) return "";
  const inv = state.inv || {}, has = (id) => inv[id]?.qty > 0, safe = state.zone === "safe";
  try { const q = qpClaimable(); if (q > 0) return `📜 มีรางวัลภารกิจรอรับ ${q} รายการ (ปุ่ม “ภารกิจ”)`; } catch { /* ข้าม */ }
  try { if (onbReady() > 0) return "🧭 มีรางวัลภารกิจวันแรกรอรับ (ปุ่ม “เริ่มต้น”)"; } catch { /* ข้าม */ }
  try { const n = baseReady(); if (n > 0) return safe ? `🏠 ที่พักมีของรอรับ ${n} รายการ (ปุ่ม “ที่พัก”)` : `🏠 ที่พักมีของรอรับ ${n} รายการ — กลับ Safe Zone ไปรับ`; } catch { /* ข้าม */ }
  if (p.hp < maxHp() * 0.4) { const m = ["trauma_kit", "medkit", "exp_serum", "bandage", "fish_stew", "soup", "moss"].find(has); if (m) return `💊 HP ต่ำ — ใช้ ${ITEMS[m].icon} ${ITEMS[m].name} ได้เลย`; }
  if (curFood() < 30) { const m = (p.faction === "zombie" ? ["rotten_meat"] : ["fish_stew", "fish_grill", "army_meal", "canned_food", "soup", "bread", "fruit"]).find(has); if (m) return `🍖 หิวแล้ว — กิน ${ITEMS[m].icon} ${ITEMS[m].name}`; }
  if (curWater() < 30) { const m = ["water_jug", "water", "soup", "fish_stew"].find(has); if (m) return `💧 กระหายน้ำ — ดื่ม ${ITEMS[m].icon} ${ITEMS[m].name}`; }
  if (p.faction === "human" && safe && has("fish") && (craftMax("fish_grill") > 0 || craftMax("fish_stew") > 0)) return "🍲 คุณมีปลา — ประกอบปลาย่าง/ซุปปลาที่ Safe Zone ได้";
  try { if (has("lab_sample") || has("lab_core")) if (labBuffLeft() <= 0) return "🧫 มีตัวอย่างวิจัย — ส่งให้ห้องวิจัยที่ค่าย (ที่พัก) รับบัฟชั่วคราว"; } catch { /* ข้าม */ }
  try { if (skOn() && skFreeAll() > 0) return `🌳 มีแต้มทักษะว่าง ${skFreeAll()} แต้ม (ปุ่ม “ทักษะ”)`; } catch { /* ข้าม */ }
  if (curStamina() >= maxStamina()) { const r = (() => { try { return zrecList()[0]; } catch { return null; } })(); return r && r.z !== state.zone ? `⚡ พลังงานเต็ม — ${ZONES[r.z].icon} ${ZONES[r.z].name} น่าไปตอนนี้ (เหมาะกับ ${r.top.join(", ") || "ของทั่วไป"})` : "⚡ พลังงานเต็ม — ค้นหาได้เลย"; }
  return "";
}
function kHintTick() {
  let el = $("k-hint"); const sc = $("btn-scavenge");
  if (!el) { if (!sc) return; el = mk("div", "muted"); el.id = "k-hint"; el.style.cssText = "font-size:13px;padding:6px 10px;border:1px dashed var(--line);border-radius:8px;margin:0 0 8px"; sc.before(el); }
  const t = kHintText(); el.textContent = t ? "💡 " + t : ""; el.classList.toggle("hidden", !t);
}

// ---- 10) กรองบันทึกเหตุการณ์ ----
const LOG_FILTERS = [["", "ทั้งหมด"], ["chat", "💬 แชทอย่างเดียว"], ["combat", "⚔️ เฉพาะต่อสู้"], ["log", "📦 เฉพาะเหตุการณ์/ระบบ"]];
function logFilterApply(f) {
  const log = $("chat-log"); if (!log) return; log.dataset.f = f || "";
  if (!$("kl-style")) { const st = document.createElement("style"); st.id = "kl-style"; st.textContent = '#chat-log[data-f="chat"] .msg.info,#chat-log[data-f="chat"] .msg.system,#chat-log[data-f="chat"] .msg.combat,#chat-log[data-f="chat"] .msg.ambient{display:none}#chat-log[data-f="combat"] .msg:not(.combat){display:none}#chat-log[data-f="log"] .msg:not(.info):not(.system):not(.ambient){display:none}'; document.head.append(st); }
  log.scrollTop = log.scrollHeight;
}
function logFilterInit() { logFilterApply(LS.get("zc_logf", "")); }   // ตัวกรองย้ายไปอยู่ใน ⚙️ ตั้งค่า (ไม่กินที่หน้าแชท)

// ---- 11) ขนาดตัวอักษร / โหมดกะทัดรัด ----
function viewApply() {
  const z = LS.get("zc_zoom", 100), c = LS.get("zc_compact", false) === true;
  try { document.documentElement.style.zoom = z && z !== 100 ? String(z / 100) : ""; } catch { /* ข้าม */ }
  document.body.classList.toggle("compact", c);
  if (!$("kc-style")) { const st = document.createElement("style"); st.id = "kc-style"; st.textContent = "body.compact .bubble{padding:4px 9px}body.compact .msg{margin:2px 0}body.compact .list li{padding:5px 8px}body.compact .world-row{padding:5px 8px}body.compact .panel{padding:10px}"; document.head.append(st); }
}
function kSettingsExtra(body) {
  const box = mk("div", "set-install"); box.append(mk("b", "", "🔠 การแสดงผล"));
  const sel = mk("select"); sel.style.cssText = "padding:6px 8px;border-radius:8px;background:var(--panel-2);color:var(--text);border:1px solid var(--line)";
  [[100, "ขนาดปกติ"], [112, "ใหญ่"], [125, "ใหญ่มาก"], [90, "เล็ก"]].forEach(([v, l]) => { const o = mk("option", "", l); o.value = v; if (v === LS.get("zc_zoom", 100)) o.selected = true; sel.append(o); });
  sel.addEventListener("change", () => { LS.set("zc_zoom", +sel.value); viewApply(); });
  const cb = mk("input"); cb.type = "checkbox"; cb.checked = LS.get("zc_compact", false) === true; cb.addEventListener("change", () => { LS.set("zc_compact", cb.checked); viewApply(); });
  const l2 = mk("label"); l2.style.cssText = "display:flex;gap:8px;align-items:center"; l2.append(cb, mk("span", "", "โหมดกะทัดรัด (ลดระยะห่าง เห็นข้อความต่อหน้าจอมากขึ้น)"));
  const lf = mk("label"); lf.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap"; lf.append(mk("span", "", "กรองบันทึกหน้าแชท:"));
  const ls = mk("select"); ls.style.cssText = sel.style.cssText; LOG_FILTERS.forEach(([v, l]) => { const o = mk("option", "", l); o.value = v; if (v === LS.get("zc_logf", "")) o.selected = true; ls.append(o); });
  ls.addEventListener("change", () => { LS.set("zc_logf", ls.value); logFilterApply(ls.value); }); lf.append(ls);
  box.append(sel, l2, lf, mk("small", "muted", "⌨️ ปุ่มลัด (คอมพิวเตอร์): S ค้นหา • F ตกปลา • 1–4 ไอเทมโปรด • Q สลับอาวุธ • B กระเป๋า • M แผนที่ • C แชท"));
  body.append(box);
}

// ---- 12) ปุ่มลัดคีย์บอร์ด ----
function kKeysInit() {
  if (state.kKeys) return; state.kKeys = true;
  document.addEventListener("keydown", (e) => {
    const tg = e.target; if (e.ctrlKey || e.metaKey || e.altKey || (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName || "")) || !state.profile) return;
    if (document.querySelector(".modal:not(.hidden)")) return;
    const k = e.key.toLowerCase();
    if (k === "s") { const b = $("btn-scavenge"); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    else if (k === "f") { if (fishCan()) { e.preventDefault(); fishOpen(); } }
    else if (k >= "1" && k <= "4") { const hs = document.querySelectorAll("#hotbar .hot"); const h = hs[+k - 1]; if (h) { e.preventDefault(); h.click(); } }
    else if (k === "b") { setTab("bag"); } else if (k === "m") { setTab("map"); } else if (k === "c") { setTab("chat"); }
  });
}

function kInit2() {
  try { invToolsInit(); } catch (e) { console.warn("inv tools", e); }
  try { logFilterInit(); } catch (e) { console.warn("log filter", e); }
  try { viewApply(); } catch (e) { console.warn("view", e); }
  try { kKeysInit(); } catch (e) { console.warn("keys", e); }
  try { mInit(); } catch (e) { console.warn("mInit", e); }
  try { dBtnInit(); dInit(); } catch (e) { console.warn("dInit", e); }
}
function kTick2() {
  try { mTick(); } catch { /* ข้าม */ }
  try { kHintTick(); } catch { /* ข้าม */ }
  try { kTitleTick(); } catch { /* ข้าม */ }
  try { zonePreview(); } catch { /* ข้าม */ }
}

/* =========================================================
   49) 🔥 Release M — เหตุผลให้กลับมา (ต้องใช้ rules v40)
   1 สรุปตอนกลับมา (ฝั่งเกมล้วน) • 2 ปฏิทินเช็กอินสะสมรายซีซัน 28 วัน (ck/{uid}, ckm/{uid}/{mN}) • 3 ของขวัญต้อนรับกลับหลังหายไป 7 วัน (back/{uid})
   - เช็กอิน: เปิดเกมวันละครั้ง (เวลาไทย) นับสะสม ไม่ต้องติดกัน • รางวัลวันที่ 3/7/14/21/28 กดรับเอง • รางวัลซีซันเก่ารับได้จนกว่าจะเช็กอินซีซันใหม่
   - ของขวัญกลับมา: ตอนเข้าเกม ถ้า seenAt เก่ากว่า 7 วัน จะบันทึกสิทธิ์ไว้ก่อนส่งสัญญาณ seenAt ใหม่ (rules ตรวจกับ seenAt เดิมในเซิร์ฟเวอร์) แล้วกดรับเองได้ครั้งเดียวต่อรอบ
   - ปรับได้จากแท็บ 🎛️: ck_on, cb_on, wb_on
   ========================================================= */
const CK_MILES = [
  { k: "m3", n: 3, r: [["bandage", 2], ["water", 2]] },
  { k: "m7", n: 7, r: [["medkit", 1], ["energy_drink", 1], ["water", 1]] },
  { k: "m14", n: 14, r: [["trauma_kit", 1], ["water_jug", 1], ["bandage", 2]] },
  { k: "m21", n: 21, r: [["medkit", 2], ["energy_drink", 2], ["bandage", 2]] },
  { k: "m28", n: 28, r: [["trauma_kit", 2], ["serum", 1], ["water_jug", 2], ["medkit", 1]] }
];
const BACK_REW = [["bandage", 3], ["water", 3], ["energy_drink", 2], ["medkit", 1]], BACK_MS = 604800000, WB_MS = 10800000;
const ckOn = () => T("ck_on", 1) === 1, cbOn = () => T("cb_on", 1) === 1, wbOn = () => T("wb_on", 1) === 1;
const ckDay = () => coopDay(), ckSeas = () => SEA_EPOCH + seaIdx() * SEA_LEN;
const mRew = (l) => l.map(([id, q]) => { const sd = seedLbl(id); return sd ? `${sd} ×${q}` : `${ITEMS[id]?.icon || "📦"}${ITEMS[id]?.name || id} ×${q}`; }).join(" ");
const ckUnclaimed = (C = state.ck) => (C ? CK_MILES.filter((m) => C.n >= m.n && state.ckm?.[m.k]?.s !== C.s) : []);
const ckToday = () => !!state.ck && state.ck.s === ckSeas() && state.ck.d === ckDay();
const ckHold = () => !!state.ck && state.ck.s !== ckSeas() && ckUnclaimed().length > 0 && !state.ckSkip;
const cbPending = () => cbOn() && !!state.back && state.back.c === 0;
const mAwayTxt = (ms) => { const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000); return d > 0 ? `${d} วัน ${h} ชม.` : `${Math.max(1, h)} ชม.`; };

// ก่อนส่ง seenAt ใหม่ (เรียกจาก startGame): จำเวลาที่หายไป + ลงทะเบียนสิทธิ์ของขวัญกลับมา
async function mArrive(p) {
  const uid = state.uid, now = serverNow();
  state.mSeen = typeof p.seenAt === "number" ? p.seenAt : null;
  state.mAway = state.mSeen ? Math.max(0, now - state.mSeen) : 0;
  if (!cbOn() || !state.mSeen || state.mAway < BACK_MS + 5000) return;
  const cur = (await get(ref(db, "back/" + uid))).val();
  if (cur && cur.c === 0) return;
  await update(ref(db), { [`back/${uid}`]: { a: state.mSeen, t: serverTimestamp(), c: 0 } });
}
function mInit() {
  if (state.mOn || !state.uid) return; state.mOn = true; state.ck = undefined;
  const uid = state.uid, re = () => { try { mTick(); mwRender(); } catch { /* ข้าม */ } };
  onValue(ref(db, "ck/" + uid), (s) => { state.ck = s.val() || null; re(); }, (e) => { state.ck = null; console.warn("ck", e?.code || e); });
  onValue(ref(db, "ckm/" + uid), (s) => { state.ckm = s.val() || {}; re(); }, (e) => console.warn("ckm", e?.code || e));
  onValue(ref(db, "back/" + uid), (s) => { state.back = s.val() || null; re(); }, (e) => { state.back = null; console.warn("back", e?.code || e); });
  const pr = $("btn-profile"); if (pr && !$("btn-ck")) { const b = btn("🔥", mwOpen, "btn ghost mini"); b.id = "btn-ck"; b.classList.add("hidden"); pr.before(b); }
}
async function ckTick() {
  const uid = state.uid, p = state.profile;
  if (!ckOn() || !uid || state.ckBusy || state.ck === undefined || !p || !p.username || p.banned || Date.now() < (state.ckNext || 0) || state.busy) return;
  const C = state.ck, S = ckSeas(), D = ckDay();
  if (C && C.s === S && C.d === D) return;
  if (ckHold()) return;
  const n = C && C.s === S ? C.n + 1 : 1;
  state.ckBusy = true;
  try {
    await update(ref(db), { [`ck/${uid}`]: { s: S, d: D, n } });
    toast(`🔥 เช็กอินวันที่ ${n}/${SEA_LEN} ของซีซัน`); try { logLine(`🔥 เช็กอินซีซัน ${seaDef().icon} ${seaDef().name} สะสม ${n}/${SEA_LEN} วัน${CK_MILES.some((m) => m.n === n) ? " — มีรางวัลให้กดรับ!" : ""}`, "system"); } catch { /* ข้าม */ }
  } catch (e) { console.warn("ck checkin", e?.code || e); state.ckNext = Date.now() + 300000; }   // rules ยังไม่ได้อัป / เน็ตหลุด → รออีก 5 นาทีค่อยลองใหม่
  finally { state.ckBusy = false; }
}
async function mGive(u, list) {
  for (const [id, q] of list) { const have = (await get(ref(db, `inventory/${state.uid}/${id}/qty`))).val() || 0; u[`inventory/${state.uid}/${id}`] = { id, qty: Math.min(99, have + q) }; }
}
async function ckClaim(k) {
  const m = CK_MILES.find((x) => x.k === k), C = state.ck; if (!m || !C || state.busy || C.n < m.n || state.ckm?.[k]?.s === C.s) return;
  if (C.s !== ckSeas() && C.s !== ckSeas() - SEA_LEN) return toast("รางวัลซีซันเก่านี้หมดอายุแล้ว");
  state.busy = true;
  try {
    const u = { [`ckm/${state.uid}/${k}`]: { s: C.s, t: serverTimestamp() } }; await mGive(u, m.r);
    await update(ref(db), u); toast(`🎁 รับรางวัลเช็กอินวันที่ ${m.n}`); try { logLine(`🔥 รางวัลเช็กอินวันที่ ${m.n}: ${mRew(m.r)}`, "system"); } catch { /* ข้าม */ }
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; try { mTick(); mwRender(); } catch { /* ข้าม */ } }
}
async function cbClaim() {
  const B = state.back; if (!B || B.c !== 0 || state.busy || !cbOn()) return;
  state.busy = true;
  try {
    const u = { [`back/${state.uid}/c`]: serverTimestamp() }; await mGive(u, BACK_REW);
    await update(ref(db), u); toast("🎁 รับของขวัญต้อนรับกลับแล้ว"); try { logLine(`🎁 ของขวัญต้อนรับกลับ: ${mRew(BACK_REW)}`, "system"); } catch { /* ข้าม */ }
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; try { mTick(); mwRender(); } catch { /* ข้าม */ } }
}

// ---- 1) สรุปตอนกลับมา ----
function mDigest() {
  const rows = [], away = state.mAway || 0; if (!wbOn() || away < WB_MS) return { away, rows };
  const add = (icon, text) => rows.push([icon, text]);
  try { const n = baseReady(); if (n > 0) add("🏠", `ที่พักมีของ/งานรอรับ ${n} รายการ (ปุ่ม “ที่พัก”)`); } catch { /* ข้าม */ }
  try { if (expReady()) add("🧭", "ทีมสำรวจกลับมาแล้ว รอรับของ"); } catch { /* ข้าม */ }
  try { if (petReady()) add("🐾", "สัตว์เลี้ยงกลับมาแล้ว รอรับของ"); } catch { /* ข้าม */ }
  try { const k = Object.keys(state.mktPay || {}).length; if (k > 0) add("💰", `ตลาดมีของรอรับ ${k} รายการ (ของที่ขายได้/ของฝากจากเพื่อน)`); } catch { /* ข้าม */ }
  try { const q = qpClaimable(); if (q > 0) add("📜", `รางวัลภารกิจรอรับ ${q} รายการ`); } catch { /* ข้าม */ }
  try { const rl = (state.radioLog || []).filter((x) => state.mSeen && x.ts > state.mSeen).slice(0, 4); rl.forEach((x) => add("📻", String(x.text).replace(/^📻\s*/, "").slice(0, 110))); } catch { /* ข้าม */ }
  try { if (seaOn()) { const g = seaProg(), d = g.filter((x) => x.done).length; add(seaDef().icon, `${seaDef().name} วันที่ ${seaDayIn()}/${SEA_LEN} • เป้าซีซัน ${d}/${g.length}`); } } catch { /* ข้าม */ }
  try { const w = wxNow(serverNow()); add(WX[w.type].icon, `ตอนนี้อากาศ: ${WX[w.type].name}`); } catch { /* ข้าม */ }
  return { away, rows };
}

// ---- หน้าต่าง กลับมา/เช็กอิน ----
function mwOpen() { hubOpen("ck"); }
function mwRender() {
  const body = $("mw-body"); if (!body || !hubOn("ck")) return; body.innerHTML = "";
  const card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; };
  const B = state.back;
  if (cbPending()) {
    const c = card(" evt-live"); c.append(mk("div", "", `🎁 ของขวัญต้อนรับกลับ — คุณห่างไปนานกว่า 7 วัน`), mk("div", "muted", mRew(BACK_REW)));
    c.append(btn("รับของขวัญ", cbClaim, "btn primary mini"));
  }
  const dg = mDigest();
  if (dg.rows.length) {
    const c = card(); c.append(mk("div", "", `📋 ระหว่างที่คุณไม่อยู่ (${mAwayTxt(dg.away)})`));
    dg.rows.forEach(([i, t]) => c.append(mk("div", "muted", `${i} ${t}`)));
  }
  if (!ckOn()) { body.append(mk("div", "muted", "เช็กอินซีซันถูกปิดชั่วคราวโดยผู้ดูแล")); return; }
  const C = state.ck, S = ckSeas(), cur = C && C.s === S, n = cur ? C.n : 0, d = seaDef();
  const c = card(); c.append(mk("div", "", `${d.icon} ปฏิทินเช็กอิน ${d.name}: สะสม ${n}/${SEA_LEN} วัน ${ckToday() ? "• วันนี้เช็กอินแล้ว ✅" : state.ck === undefined ? "" : "• วันนี้ยังไม่ได้เช็กอิน"}`));
  const grid = mk("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(14,1fr);gap:3px;margin:6px 0";
  for (let i = 1; i <= SEA_LEN; i++) { const x = mk("span", "", i <= n ? "✔" : String(i)); x.style.cssText = `font-size:10px;text-align:center;padding:3px 0;border-radius:4px;background:${i <= n ? "var(--accent,#e0a030)" : "var(--panel-2,#1c2128)"};color:${i <= n ? "#14171c" : "var(--muted,#8b949e)"};${CK_MILES.some((m) => m.n === i) ? "outline:1px solid var(--accent,#e0a030)" : ""}`; grid.append(x); }
  c.append(grid, mk("div", "muted", `นับสะสมวันที่เข้าเล่น ไม่ต้องติดกัน • ซีซันนี้เหลืออีก ${SEA_LEN - seaDayIn() + 1} วัน (เวลาไทย)`));
  if (ckHold()) {
    const h = card(" evt-live"); h.append(mk("div", "", "🍂 ซีซันใหม่เริ่มแล้ว — ยังมีรางวัลซีซันเก่าที่ยังไม่รับ"), mk("div", "muted", "กดรับให้ครบก่อนจึงจะเริ่มนับซีซันใหม่ (หรือข้ามไปเลย รางวัลที่ยังไม่รับจะหายไป)"));
    h.append(btn("ข้ามไปซีซันใหม่", () => { if (confirm("รางวัลซีซันเก่าที่ยังไม่รับจะหายไป ต้องการข้ามไหม?")) { state.ckSkip = true; ckTick(); mwRender(); } }, "btn ghost mini"));
  }
  const MC = C || { s: S, n: 0 };
  CK_MILES.forEach((m) => {
    const got = state.ckm?.[m.k]?.s === MC.s, ok = MC.n >= m.n, r = card(ok && !got ? " evt-live" : "");
    r.append(mk("div", "", `${got ? "✅" : ok ? "🎯" : "⬜"} วันที่ ${m.n}`), mk("div", "muted", mRew(m.r) + (got || ok ? "" : ` • อีก ${m.n - MC.n} วัน`)));
    if (ok && !got) r.append(btn("รับรางวัล", () => ckClaim(m.k), "btn primary mini"));
  });
}
function mTick() {
  try { ckTick(); } catch { /* ข้าม */ }
  try { passTick(); } catch { /* ข้าม */ }
  try { colTick(); hubBtn(); } catch { /* ข้าม */ }
  try { coachTick(); } catch { /* ข้าม */ }
  try { abilTick(); } catch { /* ข้าม */ }
  try { actTick(); } catch { /* ข้าม */ }
  try { advTick(); } catch { /* ข้าม */ }
  try { dTick(); } catch { /* ข้าม */ }
  const b = $("btn-ck"); if (!b) return;
  const show = ckOn() && state.ck !== undefined || cbPending();
  b.classList.toggle("hidden", !show);
  const n = state.ck && state.ck.s === ckSeas() ? state.ck.n : 0, dot = ckUnclaimed().length > 0 || cbPending();
  b.textContent = `🔥 ${n}/${SEA_LEN}`; b.classList.toggle("btn-dot", dot);
  b.title = cbPending() ? "มีของขวัญต้อนรับกลับรอรับ" : dot ? "มีรางวัลเช็กอินให้กดรับ" : "ปฏิทินเช็กอินประจำซีซัน";
  // เปิดหน้าต่างให้เองครั้งเดียวต่อการเข้าเกม: มีของขวัญรอรับ หรือห่างไป ≥ 3 ชม. (หลังโหลดข้อมูลเสร็จ)
  if (!state.mwShown && state.ck !== undefined && state.back !== undefined && state.profile && Date.now() - (state.mBoot || (state.mBoot = Date.now())) > 3500) {
    state.mwShown = true;
    const want = cbPending() || (wbOn() && (state.mAway || 0) >= WB_MS);
    if (want && !state.boss && !document.querySelector(".modal:not(.hidden)")) { try { mwOpen(); } catch { /* ข้าม */ } }
  }
}

/* =========================================================
   49.2) 🧭 บทเรียนแนะนำการเล่น (Coach) — เส้นทาง 12 ขั้น แยกมนุษย์/ซอมบี้ (functions/learn.js — learnAct) • ไม่แตะ rules
   - แถบโค้ชบนสุดของหน้าเกมบอกขั้นต่อไป + ปุ่ม "ไปเลย" พาเปิดหน้าต่างที่เกี่ยวข้อง • รายการเต็มกดที่แถบ • ต่อจากภารกิจวันแรก (🧭 เริ่มต้น) 6 ข้อเดิม
   ========================================================= */
const coachGoTo = (go) => {
  const g = String(go || "");
  try {
    if (g === "bag") setTab("bag"); else if (g === "zone") setTab("chat"); else if (g === "players") setTab("map");
    else if (g === "base") { state.baseView = "in"; openBase(); } else if (g === "baseedit") { state.baseView = "edit"; openBase(); }
    else if (g === "market") $("btn-market")?.click(); else if (g.startsWith("hub:")) hubOpen(g.slice(4));
  } catch (e) { console.warn("coach go", e); }
  $("coach-modal")?.classList.add("hidden");
};
async function coachSync(a = "state", x) { const r = await learnCall({ a, ...(x || {}) }); state.coachD = r; state.coachAt = Date.now(); return r; }
function coachTick() {
  if (!state.profile || !state.ach?.loaded || state.profile.hp === undefined) return;
  const now = Date.now(); if (state.coachDone) return coachBar();
  if (!state.coachBusy && (!state.coachAt || now - state.coachAt > 120000) && !document.hidden) {
    state.coachBusy = true; state.coachAt = now;
    coachSync().catch(() => { /* ฟังก์ชันยังไม่ deploy → ซ่อนแถบเงียบ ๆ */ }).finally(() => { state.coachBusy = false; try { coachBar(); coachRender(); } catch { /* ข้าม */ } });
  }
  coachBar();
}
function coachBar() {
  let b = $("coach"); const D = state.coachD, tb = document.querySelector(".topbar");
  const onbLeftN = (() => { try { return onbOn() && state.onb ? onbLeft() : 0; } catch { return 0; } })();
  if (!tb || (!D && !onbLeftN) || (D && D.allGot && D.finalGot)) { if (b) b.classList.add("hidden"); if (D && D.allGot && D.finalGot) state.coachDone = true; return; }
  if (!b) { b = mk("div"); b.id = "coach"; b.className = "coach"; tb.append(b); }
  b.classList.remove("hidden"); b.innerHTML = "";
  if (onbLeftN) {   // ยังทำภารกิจวันแรกไม่ครบ → ชี้ไปที่ภารกิจวันแรกก่อน
    b.append(mk("span", "coach-t", `🧭 ภารกิจวันแรก ${ONB_STEPS.length - onbLeftN}/${ONB_STEPS.length} — ทำตามขั้นตอนเพื่อรับของ`), btn("เปิดดู", () => onbOpen(), "btn primary mini")); return;
  }
  const i = D.next < 0 ? -1 : D.next, s = i >= 0 ? D.steps[i] : null;
  if (!s) { b.append(mk("span", "coach-t", "🎉 ทำบทเรียนครบแล้ว — รับของรางวัลปิดท้าย"), btn("รับรางวัล", async () => { try { const r = await coachSync("claim", { id: "final" }); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`🧭 จบบทเรียน: ${mRew(r.rewarded)}`, "system"); } catch (e) { toast(fnErr(e)); } coachBar(); }, "btn primary mini")); return; }
  const lbl = mk("span", "coach-t", `🧭 บทเรียน ${D.done + 1}/${D.steps.length}: ${s.t}${s.ok ? "" : s.n > 1 ? ` (${s.v}/${s.n})` : ""}`);
  lbl.addEventListener("click", coachOpen); b.append(lbl);
  if (s.ok) b.append(btn("🎁 รับ", () => coachClaim(s.id), "btn primary mini")); else b.append(btn("ไปเลย", () => coachGoTo(s.go), "btn primary mini"));
}
async function coachClaim(id) {
  if (state.coachBusy) return; state.coachBusy = true;
  try { const r = await coachSync("claim", { id }); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`🧭 บทเรียนสำเร็จ: ${mRew(r.rewarded)}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }
  catch (e) { toast(fnErr(e)); } finally { state.coachBusy = false; coachBar(); coachRender(); }
}
function coachOpen() {
  if (!$("coach-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "coach-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    const box = mk("div", "modal-box"), top = mk("div", "sheet-top"), head = mk("div", "modal-head"); head.append(mk("h2", "", "🧭 บทเรียนแนะนำการเล่น"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini")); top.append(head);
    const body = mk("div", "hub2-body"); body.id = "coach-body"; body.style.marginTop = "12px"; box.append(top, body); m.append(box); document.body.append(m);
  }
  $("coach-modal").classList.remove("hidden"); coachRender();
  if (!state.coachBusy) { state.coachBusy = true; coachSync().catch((e) => toast(fnErr(e))).finally(() => { state.coachBusy = false; coachBar(); coachRender(); }); }
}
function coachRender() {
  const body = $("coach-body"), m = $("coach-modal"); if (!body || !m || m.classList.contains("hidden")) return; body.innerHTML = "";
  const D = state.coachD; if (!D) { body.append(mk("div", "muted", "กำลังโหลด…")); return; }
  const h = mk("div", "world-row"); h.append(mk("b", "", `${D.fac === "zombie" ? "🧟 เส้นทางซอมบี้" : "🧑 เส้นทางมนุษย์"} • ${D.done}/${D.steps.length} ขั้น`), worldBar(D.done / D.steps.length, `${D.done}/${D.steps.length}`), mk("div", "muted", `ทำทีละขั้นตามลำดับหรือข้ามไปก่อนก็ได้ ทุกขั้นมีรางวัล • ครบทุกขั้นรับ ${mRew(D.final)}`)); body.append(h);
  D.steps.forEach((s, i) => {
    const c = mk("div", "world-row" + (i === D.next ? " evt-live" : "")); c.append(mk("div", "", `${s.got ? "✅" : s.ok ? "🎯" : i === D.next ? "👉" : "⬜"} ${i + 1}. ${s.t}`));
    if (!s.got) c.append(mk("div", "muted", s.d), mk("div", "muted", `${s.n > 1 ? `ความคืบหน้า ${s.v}/${s.n} • ` : ""}รางวัล ${mRew(s.r)}`));
    if (!s.got) { const row = mk("div"); row.style.cssText = "display:flex;gap:8px;margin-top:6px"; if (s.ok) row.append(btn("🎁 รับรางวัล", () => coachClaim(s.id), "btn primary mini")); else row.append(btn("ไปเลย", () => coachGoTo(s.go), "btn ghost mini")); c.append(row); }
    body.append(c);
  });
  if (D.allGot) { const f = mk("div", "world-row evt-live"); f.append(mk("div", "", D.finalGot ? "✅ รับรางวัลปิดท้ายแล้ว" : `🎉 รางวัลปิดท้าย: ${mRew(D.final)}`)); if (!D.finalGot) f.append(btn("🎁 รับรางวัลปิดท้าย", async () => { try { const r = await coachSync("claim", { id: "final" }); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`🧭 จบบทเรียน: ${mRew(r.rewarded)}`, "system"); } catch (e) { toast(fnErr(e)); } coachBar(); coachRender(); }, "btn primary mini")); body.append(f); }
}

// ---- 🎓 บทสอนผู้เล่นใหม่ (จับมือทำ ข้ามได้) — เฉพาะบัญชีที่สร้างใหม่หลัง TUT_SINCE และอายุไม่เกิน 24 ชม. • ไม่แตะ rules/functions
// ไฟสปอตไลต์ + NPC (มนุษย์ = มิรา • ซอมบี้ = ธารา) พาทำจริงทีละขั้น: ดูแถบสถานะ → เปิดแท็บกระเป๋า → กดค้นหา → ใช้ของ → ดูโซน/ผู้เล่น → แชท → คู่มือ • เล่นซ้ำได้ด้วย /tutorial
// สถานะ: ach counter `tutdone` (ข้ามเครื่องได้) + LS (ขั้นล่าสุด/จบ) • ปิดทั้งระบบด้วย tune tut_on = 0 • แก้วันตัดบัญชีด้วย tut_since (มิลลิวินาทีแบบ epoch)
const TUT_SINCE = Date.UTC(2026, 9, 7, 1, 0);
const tutDone = () => ((state.ach?.c?.tutdone || 0) >= 1) || !!LS.get(lsKey("tutdone"), 0);
function tutEligible() {
  const p = state.profile; if (!p || p.banned || T("tut_on", 1) !== 1 || p.role === "owner" || p.role === "gm") return false;
  if (typeof p.createdAt !== "number" || p.createdAt < T("tut_since", TUT_SINCE) || serverNow() - p.createdAt > 86400000) return false;
  return !tutDone();
}
const tutTabsOn = () => { const tb = document.querySelector(".tabbar"); return !!tb && getComputedStyle(tb).display !== "none"; };
const tutTab = (t) => document.querySelector(`.tabbar [data-tab="${t}"]`), tutPanel = (t) => document.querySelector(`.layout .panel[data-panel="${t}"]`);
function tutSteps(fac) {
  const Z = fac === "zombie", who = Z ? "tara" : "mira", nm = Z ? "ธารา" : "มิรา", mood = Z ? "😐" : "😊";
  const tab = (t, label, emo) => ({ t: `ลองแตะแท็บ “${emo} ${label}” ด้านล่างดูสิ`, target: () => (tutTabsOn() ? tutTab(t) : tutPanel(t)), act: tutTabsOn() ? "click" : "next", pre: () => { if (!tutTabsOn()) setTab(t); } });
  return [
    { t: Z ? `...ตื่นแล้วสินะ ฉัน${nm} นักวิจัยของค่ายนี้ ร่างกายคุณไม่เหมือนคนทั่วไป กฎของคุณต่างออกไป ฉันจะพาดูให้ทีละอย่าง ไม่นานหรอก` : `ยินดีต้อนรับสู่ Safe Zone ค่ะ ฉัน${nm} หมอประจำค่ายนี้ ข้างนอกกำแพงมีทั้งซอมบี้และคนเอาแต่ได้ ก่อนออกไป ฉันจะพาดูของที่ต้องรู้ก่อน แป๊บเดียวเท่านั้นค่ะ`, target: null, act: "next" },
    { t: Z ? "นี่คือสภาพร่างกายคุณ ❤️ HP ถ้าถึง 0 จะล้มลง • ⚡ พลังงานใช้ตอนค้นหากับเดินทาง • 🍖 อาหารของคุณลดเร็วกว่ามนุษย์ และกินอาหารคนทั่วไปไม่ได้ ต้องกัดคนให้โดน หรือหา 🥩 เนื้อเน่านอกกำแพง • 💧 น้ำก็ลดเรื่อยๆ" : "นี่คือสภาพร่างกายคุณค่ะ ❤️ HP ถ้าถึง 0 จะล้มลง • ⚡ พลังงานใช้ตอนค้นหากับเดินทาง • 🍖 อาหารกับ 💧 น้ำลดลงเรื่อยๆ ตามเวลา ถ้าหมด ค้นหาข้างนอกไม่ไหว หมั่นกินหมั่นดื่มนะคะ", target: () => document.querySelector(".topbar .bars"), act: "next" },
    { ...tab("bag", "กระเป๋า / ค้นหา", "🎒"), t: "ต่อไปไปที่กระเป๋ากันค่ะ — ลองแตะแท็บ “🎒 กระเป๋า / ค้นหา” ด้านล่างดูสิ" },
    { t: "นี่คือปุ่มค้นหา ใน Safe Zone ปลอดภัยดี ลองกดดู 1 ครั้งนะ จะเจอวัสดุหรือเสบียงเล็กน้อย (ใช้พลังงานนิดหน่อย)", target: () => $("btn-scavenge"), act: "search", pre: () => setTab("bag") },
    { t: Z ? "ของที่เจอจะเข้ากระเป๋าตรงนี้ ซอมบี้ใช้ยา ผ้าพันแผล มอส และวัสดุคราฟต์ได้ แต่กินอาหารคนทั่วไปไม่ได้ — อย่าลืมหา 🥩 เนื้อเน่านอกกำแพง" : "ของที่เจอจะเข้ากระเป๋าตรงนี้ค่ะ มีทั้งอาหาร น้ำ ยา และวัสดุคราฟต์ ยิ่งออกไปไกล ของยิ่งดี แต่ก็อันตรายขึ้นตามไปด้วย", target: () => $("inv-list"), act: "next", pre: () => setTab("bag") },
    { t: "แตะไอเทมที่กินหรือใช้ได้ (อาหาร น้ำ ผ้าพันแผล) เพื่อใช้ ลองใช้ 1 ชิ้นดูนะ", target: () => $("inv-list"), act: "use", pre: () => setTab("bag"), skipIf: () => Z || !invList().some(([, it]) => { const d = defOf(it); return !!d && (d.food > 0 || d.water > 0 || d.heal > 0); }) },
    { ...tab("map", "โซน / ผู้เล่น", "🗺️"), t: "ถัดไปคือแผนที่ค่ะ — ลองแตะแท็บ “🗺️ โซน / ผู้เล่น” ด้านล่างดูสิ" },
    { t: Z ? "นี่คือโซนทั้งหมด ⚠ คือระดับอันตราย ⚡ คือพลังงานที่ใช้เดินทาง ซอมบี้ป่าจะเมินคุณ แต่ 🥩 เนื้อเน่าเจอได้เฉพาะนอก Safe Zone — ลองเริ่มที่ 🌲 ป่าลึกหรือ 🏚️ เขตเมืองร้างก่อน" : "นี่คือโซนทั้งหมดค่ะ ⚠ คือระดับอันตราย (ยิ่งสูง ยิ่งเจอซอมบี้ แต่ของก็ดีขึ้น) ⚡ คือพลังงานที่ใช้เดินทาง แนะนำเริ่มที่ 🌲 ป่าลึก (อันตราย 2) หรือ 🏚️ เขตเมืองร้างก่อนนะคะ", target: () => $("zone-list"), act: "next", pre: () => setTab("map") },
    { t: Z ? "ใต้โซนคือรายชื่อผู้เล่นในโซนเดียวกัน ที่ Safe Zone ต่อสู้ไม่ได้ แต่นอกกำแพง กัดมนุษย์โดนจะเติมอาหาร +25 และฟื้น HP ส่วนเหยื่อจะติดเชื้อ — แต่มนุษย์ก็สู้กลับได้ ระวังตัว" : "ใต้โซนคือรายชื่อผู้เล่นในโซนเดียวกันค่ะ ที่ Safe Zone ต่อสู้กันไม่ได้ แต่นอกกำแพง ซอมบี้ผู้เล่นโจมตีคุณได้ และคุณก็สู้กลับได้ — ถ้าถูกกัดจะติดเชื้อ ต้องรักษาด้วยชุดปฐมพยาบาลหรือมอส", target: () => $("player-list"), act: "next", pre: () => setTab("map") },
    { ...tab("chat", "แชท", "💬"), t: "แท็บ “💬 แชท” ใช้คุยกับคนในโซนเดียวกัน ลองแตะดูค่ะ ถ้ามีอะไรสงสัยถามเพื่อนๆ ได้" },
    { t: "เสร็จแล้วค่ะ! ถ้าลืมอะไร กด “วิธีเล่น” ได้ตลอด และแถบ 🧭 ด้านบนจะบอกภารกิจถัดไปพร้อมของรางวัล ขอให้รอดนะ", target: () => $("btn-guide"), act: "next", pre: () => setTab("chat") }
  ].map((x) => ({ who, nm, mood, ...x }));
}
const tutLayer = () => {
  let L = $("tut-layer"); if (L) return L;
  L = mk("div"); L.id = "tut-layer";
  ["t", "b", "l", "r", "c"].forEach((k) => { const d = mk("div", "tut-blk"); d.dataset.k = k; L.append(d); });
  const ring = mk("div", "tut-ring"); const card = mk("div", "tut-card"); const por = mk("div", "tut-por"); por.id = "tut-por";
  const body = mk("div", "tut-body"), name = mk("b", "tut-name"), txt = mk("div", "tut-txt"), row = mk("div", "tut-row");
  const nxt = btn("ต่อไป ▶", () => tutNext(), "btn primary mini"); nxt.id = "tut-next"; const skipStep = btn("ข้ามขั้นนี้", () => tutNext(true), "btn ghost mini"); skipStep.id = "tut-skipstep"; const prog = mk("span", "tut-prog"); prog.id = "tut-prog";
  row.append(prog, skipStep, nxt); body.append(name, txt, row); card.append(por, body);
  const skip = btn("ข้ามบทสอน ✕", () => tutSkipAll(), "btn ghost mini"); skip.id = "tut-skip";
  L.append(ring, card, skip); document.body.append(L); return L;
};
function tutPlace() {
  const T0 = state.tut; if (!T0 || !T0.on) return; const L = $("tut-layer"); if (!L) return;
  const s = T0.steps[T0.i], tg = s && s.target ? s.target() : null, W = innerWidth, H = innerHeight, ring = L.querySelector(".tut-ring"), card = L.querySelector(".tut-card");
  const r = tg && tg.offsetParent !== null ? tg.getBoundingClientRect() : null, pad = 6, inter = s.act !== "next";
  const set = (k, x, y, w, h) => { const e = L.querySelector(`.tut-blk[data-k="${k}"]`); e.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`; };
  if (r && r.width > 0) {
    const x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad), w = Math.min(W - x, r.width + pad * 2), h = Math.min(H - y, r.height + pad * 2);
    set("t", 0, 0, W, y); set("b", 0, y + h, W, H - y - h); set("l", 0, y, x, h); set("r", x + w, y, W - x - w, h);
    set("c", x, y, w, inter ? 0 : h); ring.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    card.classList.toggle("tut-top", y + h / 2 > H * 0.5);
  } else { set("t", 0, 0, W, H); set("b", 0, 0, 0, 0); set("l", 0, 0, 0, 0); set("r", 0, 0, 0, 0); set("c", 0, 0, 0, 0); ring.style.display = "none"; card.classList.remove("tut-top"); }
}
function tutShow() {
  const T0 = state.tut; if (!T0) return; const L = tutLayer(), s = T0.steps[T0.i];
  if (s.skipIf && s.skipIf()) { T0.i++; if (T0.i >= T0.steps.length) return tutEnd(true); return tutShow(); }
  try { s.pre && s.pre(); } catch { /* ข้าม */ }
  L.classList.remove("hidden"); L.querySelector(".tut-name").textContent = `${s.nm}`; L.querySelector(".tut-txt").textContent = s.t;
  npcPortrait($("tut-por"), s.who, s.mood);
  $("tut-prog").textContent = `${T0.i + 1}/${T0.steps.length}`;
  $("tut-next").classList.toggle("hidden", s.act !== "next"); $("tut-skipstep").classList.toggle("hidden", s.act === "next");
  $("tut-next").textContent = T0.i === T0.steps.length - 1 ? "เริ่มเล่น ▶" : "ต่อไป ▶";
  LS.set(lsKey("tutstep"), T0.i);
  const tg = s.target ? s.target() : null; if (tg && tg.scrollIntoView) { try { tg.scrollIntoView({ block: "center", behavior: "instant" }); } catch { /* ข้าม */ } }
  // รอการกระทำจริงของผู้เล่น
  T0.off && T0.off(); T0.off = null; const idx = T0.i;
  if (s.act === "click" && tg) { const h = () => setTimeout(() => { if (state.tut && state.tut.i === idx) tutNext(); }, 350); tg.addEventListener("click", h, { once: true, capture: true }); T0.off = () => tg.removeEventListener("click", h, true); }
  else if (s.act === "search" || s.act === "use") {
    const key = s.act === "search" ? "srch" : "use", base = state.ach?.c?.[key] || 0;
    const iv = setInterval(() => { if (!state.tut || state.tut.i !== idx) return clearInterval(iv); if ((state.ach?.c?.[key] || 0) > base) { clearInterval(iv); setTimeout(() => { if (state.tut && state.tut.i === idx) tutNext(); }, 900); } }, 400);
    T0.off = () => clearInterval(iv);
  }
  tutPlace();
}
function tutNext(skipped) {
  const T0 = state.tut; if (!T0) return; T0.off && T0.off(); T0.off = null; T0.i++;
  if (T0.i >= T0.steps.length) return tutEnd(true); tutShow();
}
function tutEnd(done) {
  const T0 = state.tut; if (T0) { T0.on = false; T0.off && T0.off(); cancelAnimationFrame(T0.raf); } state.tut = null;
  $("tut-layer")?.classList.add("hidden");
  if (done) { LS.set(lsKey("tutdone"), 1); try { achSet("tutdone", 1); } catch { /* ข้าม */ } toast("🎓 จบบทสอนแล้ว — ดูซ้ำได้ด้วยคำสั่ง /tutorial"); }
}
function tutSkipAll() { if (confirm("ข้ามบทสอนทั้งหมด? (ดูใหม่ได้ภายหลังด้วยคำสั่ง /tutorial ในช่องแชท)")) tutEnd(true); }
function tutStart(from = 0, force = false) {
  const p = state.profile; if (state.tut || !p || p.hp <= 0 || (!force && !tutEligible())) return;
  const steps = tutSteps(p.faction === "zombie" ? "zombie" : "human"); state.tut = { on: true, i: Math.min(Math.max(0, from), steps.length - 1), steps, force };
  const loop = () => { if (!state.tut || !state.tut.on) return; tutPlace(); state.tut.raf = requestAnimationFrame(loop); }; state.tut.raf = requestAnimationFrame(loop);
  window.addEventListener("resize", tutPlace); tutShow();
}
function tutBoot(n = 0) {   // รอโปรไฟล์/ตัวนับพร้อมแล้วค่อยเริ่ม (กันเปิดตอนข้อมูลยังไม่ครบ)
  try {
    if (state.tut) return;
    if (!state.profile || !state.ach?.loaded || !state.zone) { if (n < 25) setTimeout(() => tutBoot(n + 1), 1000); return; }
    if (tutEligible() && !state.boss && !state.hb) { const st = Number(LS.get(lsKey("tutstep"), 0)) || 0; tutStart(st); }
  } catch (e) { console.warn("tutBoot", e); }
}
// ---- /บทสอน

/* =========================================================
   49.3) 🌱 แปลงปลูกในที่พัก (functions/garden.js — gardenAct) • ไม่แตะ rules
   - ลงเมล็ด → รดน้ำ (เวลาเหลือ −25%) / ใส่ปุ๋ย (+1 ผลผลิต กันศัตรูพืช) → เก็บเกี่ยว • ฤดูกาลมีผลกับเวลาโต • มีเหตุการณ์เล็กตอนเก็บ (ศัตรูพืช/กลายพันธุ์)
   - เมล็ดพันธุ์ ("seed_<พืช>") เป็นตัวนับในแปลง ไม่ใช่ไอเทมในกระเป๋า • ได้จากเมล็ดฟรีรายวัน ซื้อ หรือรางวัล (หีบ พ่อค้าเร่ ดิ่งลึก เหตุการณ์สุ่ม)
   ========================================================= */
const SEED_LBL = { herb: "🌿 สมุนไพรข้างรั้ว", mossb: "🪴 บ่อมอส", tomato: "🍅 มะเขือเทศบนดาดฟ้า", wheat: "🌾 ข้าวสาลีป่า", pumpkin: "🎃 ฟักทองหลังบ้านร้าง", aloe: "🪻 ว่านหางจระเข้", shroom: "🍄 เห็ดห้องใต้ดิน", glow: "🌸 ดอกไม้เรืองแสง", fungus: "🍄 เชื้อราซาก", maggot: "🪱 บ่อหนอน", bog: "💧 แอ่งน้ำเน่า", bloodroot: "🩸 รากเลือด" };
const seedLbl = (id) => (/^seed_/.test(id) && SEED_LBL[id.slice(5)] ? `🌱 เมล็ด${SEED_LBL[id.slice(5)]}` : null);
const SEASON_TH = ["🌧️ ฤดูฝน", "🦠 ฤดูโรคระบาด", "🌾 ฤดูเก็บเสบียง", "❄️ ฤดูหนาว"];
async function gardenGo(a, x, ok) {
  if (state.gardenBusy) return; state.gardenBusy = true;
  try { const r = await gardenCall({ a, ...(x || {}) }); state.gardenD = r; state.gardenAt = Date.now(); if (ok) ok(r); }
  catch (e) { toast(fnErr(e)); try { state.gardenD = await gardenCall({ a: "state" }); state.gardenAt = Date.now(); } catch { /* ข้าม */ } }
  finally { state.gardenBusy = false; try { baseAgain(); } catch { /* ข้าม */ } }
}
/* ---------- 🎨 กราฟิกแปลงปลูก/ลานหน้าบ้าน (SVG วาดในโค้ด — เบา ปรับสีตามฤดู/เวลา ไม่ต้องมีไฟล์รูป) ---------- */
// a = รูปแบบการวาด • c = สีต้น/ใบ • f = สีผล/ดอก (ตอนพร้อมเก็บ)
const CROP_ART = {
  herb: { a: "leaf", c: "#5fae4e", f: "#f3f0d8" }, mossb: { a: "moss", c: "#6e9e4a", f: "#a9d86e" }, aloe: { a: "aloe", c: "#7fc46a", f: "#ffd27a" },
  tomato: { a: "fruit", c: "#4f9d45", f: "#e0432f" }, pumpkin: { a: "pumpkin", c: "#4f9d45", f: "#e08a2a" }, wheat: { a: "grain", c: "#7fae4a", f: "#e1bf4c" },
  shroom: { a: "shroom", c: "#a58a5e", f: "#e8d9b0" }, glow: { a: "flower", c: "#3f9a8a", f: "#8fe8ff" },
  fungus: { a: "shroom", c: "#6b7a42", f: "#a9bf4f" }, maggot: { a: "worm", c: "#d8c8a8", f: "#f3e6c8" }, bog: { a: "pool", c: "#34503f", f: "#7fb89a" }, bloodroot: { a: "root", c: "#6a1f2a", f: "#e0432f" }
};
// st: 1 = งอก, 2 = โต, 3 = พร้อมเก็บ (วาดที่ 0,0 = พื้นดิน, ต้นสูงขึ้นไปทางลบ y)
function gPlant(cid, st) {
  const A = CROP_ART[cid] || { a: "leaf", c: "#5fae4e", f: "#fff" }, c = A.c, f = A.f, rd = st >= 3, o = [];
  if (st <= 1 && A.a !== "worm" && A.a !== "pool") return `<path d="M0 0 Q-2 -8 -7 -11 M0 0 Q2 -9 8 -13" stroke="${c}" fill="none" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-7" cy="-11" rx="3" ry="2" fill="${c}"/><ellipse cx="8" cy="-13" rx="3.2" ry="2.1" fill="${c}"/>`;
  switch (A.a) {
    case "leaf": [-52, -26, 0, 26, 52].forEach((a, i) => o.push(`<ellipse cx="0" cy="-13" rx="${3.6 + (i % 2)}" ry="${st >= 2 ? 12 : 8}" fill="${c}" transform="rotate(${a})"/>`)); if (rd) for (let i = 0; i < 5; i++) o.push(`<circle cx="${-12 + i * 6}" cy="${-22 - (i % 2) * 5}" r="2" fill="${f}"/>`); break;
    case "moss": [[-9, -4, 6], [0, -7, 8], [9, -4, 6], [-4, -12, 5], [5, -12, 5]].forEach(([x, y, r]) => o.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`)); if (rd) [[-6, -10], [4, -15], [10, -6]].forEach(([x, y]) => o.push(`<circle cx="${x}" cy="${y}" r="2" fill="${f}"/>`)); break;
    case "aloe": [-40, -18, 0, 18, 40].forEach((a) => o.push(`<path d="M0 0 L-4 -24 L1 -8 Z" fill="${c}" transform="rotate(${a})"/>`)); if (rd) o.push(`<line x1="0" y1="-6" x2="0" y2="-34" stroke="${c}" stroke-width="2"/><circle cx="0" cy="-35" r="3.5" fill="${f}"/>`); break;
    case "fruit": o.push(`<path d="M0 0 L0 -30" stroke="${c}" stroke-width="2.6"/>`); [[-9, -22], [9, -16], [-7, -10]].forEach(([x, y]) => o.push(`<ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="${c}"/>`)); [[-9, -27], [8, -22], [-3, -15]].forEach(([x, y]) => o.push(`<circle cx="${x}" cy="${y}" r="${st >= 2 ? 4.5 : 2.5}" fill="${rd ? f : "#78b552"}"/>`)); break;
    case "pumpkin": o.push(`<ellipse cx="0" cy="-9" rx="${st >= 2 ? 14 : 8}" ry="${st >= 2 ? 10 : 6}" fill="${rd ? f : c}"/>`, `<path d="M-5 -18 Q-7 -9 -5 -1 M5 -18 Q7 -9 5 -1" stroke="#0004" fill="none" stroke-width="1.6"/>`, `<rect x="-1.5" y="-24" width="3" height="7" rx="1.5" fill="#4b7a2c"/>`, `<path d="M0 -20 Q14 -26 18 -16" stroke="${c}" fill="none" stroke-width="2"/>`); break;
    case "grain": [-12, -6, 0, 6, 12].forEach((x, i) => { const h = 26 + (i % 2) * 6; o.push(`<path d="M${x} 0 Q${x + 2} ${-h / 2} ${x} ${-h}" stroke="${rd ? "#caa73a" : c}" fill="none" stroke-width="2"/><ellipse cx="${x}" cy="${-h - 3}" rx="2.6" ry="6" fill="${rd ? f : "#9ac45a"}"/>`); }); break;
    case "shroom": { const n = rd ? 3 : st >= 2 ? 2 : 1; [[0, 0, 1], [-11, 2, 0.7], [11, 3, 0.62]].slice(0, n).forEach(([x, y, k]) => o.push(`<g transform="translate(${x} ${y}) scale(${k})"><rect x="-3.5" y="-14" width="7" height="14" rx="3" fill="${f}"/><path d="M-13 -13 Q0 -34 13 -13 Z" fill="${c}"/>${rd ? '<circle cx="-4" cy="-19" r="1.6" fill="#fff8"/><circle cx="4" cy="-22" r="1.3" fill="#fff8"/>' : ""}</g>`)); break; }
    case "flower": o.push(`<path d="M0 0 Q-3 -16 0 -28" stroke="${c}" fill="none" stroke-width="2.6"/><ellipse cx="-7" cy="-9" rx="6" ry="2.6" fill="${c}" transform="rotate(-25 -7 -9)"/><ellipse cx="7" cy="-14" rx="6" ry="2.6" fill="${c}" transform="rotate(25 7 -14)"/>`); if (st >= 2) { for (let a = 0; a < 6; a++) o.push(`<ellipse cx="0" cy="-35" rx="3.2" ry="7" fill="${rd ? f : "#6fb6a4"}" transform="rotate(${a * 60} 0 -29)"/>`); o.push(`<circle cx="0" cy="-29" r="3" fill="${rd ? "#fff" : "#cde"}"/>`); } else o.push(`<ellipse cx="0" cy="-30" rx="3.6" ry="5.5" fill="#6fb6a4"/>`); break;
    case "worm": o.push(`<ellipse cx="0" cy="-3" rx="19" ry="7" fill="#2a1d15"/>`); [[-8, -4, 0], [5, -3, 1], [-1, -6, 2]].slice(0, rd ? 3 : st >= 2 ? 2 : 1).forEach(([x, y, i]) => o.push(`<path class="gwg" style="animation-delay:${i * 0.4}s" d="M${x - 7} ${y} q3.5 -9 7 0 t7 0" stroke="${f}" fill="none" stroke-width="3.2" stroke-linecap="round"/>`)); break;
    case "pool": o.push(`<ellipse cx="0" cy="-3" rx="21" ry="8" fill="${c}"/><ellipse cx="0" cy="-3" rx="15" ry="5" fill="#27402f"/><ellipse class="gwg" cx="-3" cy="-3" rx="6" ry="1.8" fill="none" stroke="${f}" stroke-width="1"/>`); if (st >= 2) o.push(`<circle cx="7" cy="-8" r="2.4" fill="${f}" opacity=".8"/>`); if (rd) o.push(`<circle cx="-8" cy="-11" r="3" fill="${f}" opacity=".85"/><circle cx="2" cy="-15" r="2" fill="${f}" opacity=".7"/>`); break;
    case "root": [-30, -12, 8, 28].forEach((a) => o.push(`<path d="M0 0 Q-3 -9 ${-1 + a / 12} -18" stroke="${rd ? f : c}" fill="none" stroke-width="3" stroke-linecap="round" transform="rotate(${a / 2})"/>`)); o.push(`<ellipse cx="0" cy="-3" rx="9" ry="5" fill="${c}"/>`); if (rd) o.push(`<circle cx="0" cy="-3" r="5" fill="${f}" opacity=".75"/>`); break;
  }
  return o.join("");
}
const gStage = (pl, left) => (!pl.c ? 0 : left <= 0 ? 3 : pl.total && 1 - left / pl.total >= 0.34 ? 2 : 1);
const GS_SEASON = [
  { gr: ["#2c4a34", "#3a5c3f"], w: "rain" }, { gr: ["#31402f", "#44553a"], w: "fog" }, { gr: ["#4a4a2a", "#5f5c30"], w: "gold" }, { gr: ["#5a6a70", "#738087"], w: "snow" }
];
const gStyle = '<style>.gpu{animation:gpu 1.8s ease-in-out infinite}.gsp{animation:gsp 1.3s ease-in-out infinite}.gwg{animation:gwg 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.grn{animation:grn .9s linear infinite}.gsn{animation:gsn 4s linear infinite}.gp{cursor:pointer}@keyframes gpu{0%,100%{opacity:.35}50%{opacity:.85}}@keyframes gsp{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}@keyframes gwg{0%,100%{transform:translateX(0)}50%{transform:translateX(2.5px)}}@keyframes grn{from{transform:translate(0,-12px)}to{transform:translate(-5px,60px)}}@keyframes gsn{from{transform:translateY(-10px)}to{transform:translateY(70px)}}@keyframes gsm{from{transform:translateY(0);opacity:.4}to{transform:translateY(-22px) translateX(6px);opacity:0}}@media (prefers-reduced-motion:reduce){.gpu,.gsp,.gwg,.grn,.gsn{animation:none}}</style>';
let gGid = 0;   // id ของ gradient ต้องไม่ซ้ำกันระหว่างภาพหลายใบในหน้าเดียว
function gardenSceneSvg(D, sel, spent, zom) {
  const q = ++gGid, n = D.plots.length, cols = Math.min(4, Math.ceil(n / 2)), rows = Math.ceil(n / cols), cw = 320 / cols, H = 66 + rows * 64 + 6, S = GS_SEASON[D.season % 4], sky = scnSky(), o = [];
  const gr = zom ? ["#2a2433", "#352d3f"] : S.gr;
  o.push(`<svg viewBox="0 0 320 ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="แปลงปลูก" style="width:100%;height:auto;border-radius:12px;display:block;background:#0f1216">${gStyle}`);
  o.push(`<defs><linearGradient id="gsky${q}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${zom ? "#1a1230" : sky.top}"/><stop offset="1" stop-color="${zom ? "#3a2a50" : sky.bot}"/></linearGradient><radialGradient id="ggl${q}"><stop offset="0" stop-color="#fff6b0" stop-opacity=".95"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient><linearGradient id="gfog${q}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6d89a" stop-opacity="0"/><stop offset="1" stop-color="#b6d89a" stop-opacity=".35"/></linearGradient></defs>`);
  o.push(`<rect width="320" height="70" fill="url(#gsky${q})"/>`);
  if (sky.night || zom) { for (let i = 0; i < 12; i++) o.push(`<circle cx="${(i * 53 + 17) % 320}" cy="${6 + (i * 29) % 40}" r="1" fill="#fff" opacity=".8"/>`); o.push(`<text x="270" y="30" font-size="18" text-anchor="middle">${sky.moon}</text>`); } else o.push(`<text x="270" y="30" font-size="20" text-anchor="middle">☀️</text>`);
  o.push(`<path d="M0 62 Q50 40 100 58 T210 52 T320 60 L320 72 L0 72 Z" fill="${zom ? "#221b2c" : "#27382c"}"/>`);
  o.push(`<rect y="64" width="320" height="${H - 64}" fill="${gr[0]}"/>`);
  for (let y = 70; y < H; y += 14) o.push(`<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="${gr[1]}" stroke-width="2" opacity=".7"/>`);
  if (!zom) for (let x = 6; x < 320; x += 20) o.push(`<rect x="${x}" y="52" width="3" height="14" fill="#3c2a1b"/>`), o.push(`<line x1="0" y1="58" x2="320" y2="58" stroke="#3c2a1b" stroke-width="2"/>`);
  D.plots.forEach((pl, k) => {
    const r = Math.floor(k / cols), cc = k % cols, cx = cw * cc + cw / 2, by = 66 + r * 64 + 44, left = Math.max(0, (pl.left || 0) - spent), st = gStage(pl, left), dry = !pl.w;
    o.push(`<g class="gp" data-i="${pl.i}"><rect x="${cx - cw / 2 + 2}" y="${by - 52}" width="${cw - 4}" height="62" fill="transparent"/>`);
    if (sel === pl.i) o.push(`<ellipse cx="${cx}" cy="${by + 2}" rx="${Math.min(36, cw / 2 - 3)}" ry="12" fill="none" stroke="#e0a030" stroke-width="2" stroke-dasharray="4 3"/>`);
    o.push(`<ellipse cx="${cx}" cy="${by + 3}" rx="${Math.min(31, cw / 2 - 6)}" ry="9.5" fill="${pl.w ? "#33261a" : "#4a3320"}"/><ellipse cx="${cx}" cy="${by + 1}" rx="${Math.min(25, cw / 2 - 10)}" ry="6.5" fill="${pl.w ? "#3d2e20" : "#5a4028"}"/>`);
    if (st === 3) o.push(`<circle class="gpu" cx="${cx}" cy="${by - 16}" r="26" fill="url(#ggl${q})"/>`);
    if (st > 0) o.push(`<g transform="translate(${cx} ${by})">${gPlant(pl.c, st)}</g>`);
    else o.push(`<text x="${cx}" y="${by + 1}" font-size="9" text-anchor="middle" fill="#fff" opacity=".35">${pl.i}</text>`);
    if (st === 3) { o.push(`<text class="gsp" x="${cx + 16}" y="${by - 30}" font-size="11" text-anchor="middle">✨</text><text class="gsp" style="animation-delay:.5s" x="${cx - 18}" y="${by - 20}" font-size="9" text-anchor="middle">✨</text>`); }
    if (pl.w && st > 0 && st < 3) o.push(`<text x="${cx - 24}" y="${by - 26}" font-size="9">💧</text>`);
    if (pl.f && st > 0) o.push(`<text x="${cx + 18}" y="${by + 8}" font-size="8">🧪</text>`);
    o.push(`</g>`);
  });
  if (S.w === "rain" && !zom) for (let i = 0; i < 22; i++) o.push(`<line class="grn" style="animation-delay:${(i * 0.13).toFixed(2)}s" x1="${(i * 29) % 320}" y1="0" x2="${(i * 29) % 320 - 3}" y2="9" stroke="#bfe3ff" stroke-width="1" opacity=".55"/>`);
  if (S.w === "snow" && !zom) for (let i = 0; i < 24; i++) o.push(`<circle class="gsn" style="animation-delay:${(i * 0.17).toFixed(2)}s" cx="${(i * 37) % 320}" cy="0" r="1.6" fill="#fff" opacity=".85"/>`);
  if (S.w === "fog" || zom) o.push(`<rect y="40" width="320" height="${H - 40}" fill="url(#gfog${q})"/>`);
  if (S.w === "gold" && !zom) o.push(`<rect width="320" height="${H}" fill="#ffcf6b" opacity=".07"/>`);
  o.push(`</svg>`); return o.join("");
}
// ---- ลานหน้าบ้าน: ตัวบ้านตามระดับ (0–3) + แปลงที่โตตามสถานะจริง ----
function baseYardSvg(lv, zom, plots, spent, uid) {
  const q = ++gGid, sky = scnSky(), night = sky.night, o = [], lit = night ? "#ffd27a" : "#cfe6f2", h = scnHash(uid) % 3;
  o.push(`<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ลานหน้าบ้าน" style="width:100%;height:auto;border-radius:12px;display:block;background:#0f1216">${gStyle}`);
  o.push(`<defs><linearGradient id="ysky${q}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${zom ? "#1a1230" : sky.top}"/><stop offset="1" stop-color="${zom ? "#3a2a50" : sky.bot}"/></linearGradient><radialGradient id="ggl${q}"><stop offset="0" stop-color="#fff6b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient></defs><rect width="320" height="120" fill="url(#ysky${q})"/>`);
  if (night || zom) { for (let i = 0; i < 14; i++) o.push(`<circle cx="${(i * 47 + 9) % 320}" cy="${6 + (i * 31) % 70}" r="1" fill="#fff" opacity=".8"/>`); o.push(`<text x="40" y="34" font-size="18" text-anchor="middle">${sky.moon}</text>`); } else o.push(`<text x="40" y="36" font-size="20" text-anchor="middle">☀️</text>`);
  o.push(`<path d="M0 108 Q60 84 120 104 T250 98 T320 106 L320 124 L0 124 Z" fill="${zom ? "#221b2c" : "#27382c"}"/><rect y="116" width="320" height="84" fill="${zom ? "#2a2433" : "#3a4a32"}"/>`);
  for (let y = 126; y < 200; y += 14) o.push(`<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="${zom ? "#352d3f" : "#44563a"}" stroke-width="2" opacity=".7"/>`);
  if (zom) {   // รัง: เนินดิน + ตาแดง + กระดูก
    o.push(`<path d="M30 124 Q36 56 110 54 Q190 56 196 124 Z" fill="#17121f"/><path d="M${60 + lv * 4} 124 Q${66 + lv * 4} 82 110 80 Q154 82 ${160 - lv * 4} 124 Z" fill="#0b0912"/>`);
    o.push(`<circle cx="98" cy="104" r="3.4" fill="#d33" class="gpu"/><circle cx="118" cy="104" r="3.4" fill="#d33" class="gpu"/>`);
    for (let i = 0; i < lv; i++) o.push(`<path d="M${44 + i * 66} 70 L${52 + i * 66} 46 L${60 + i * 66} 70 Z" fill="#2a2036"/>`);
    o.push(`<text x="40" y="128" font-size="13">🦴</text><text x="190" y="126" font-size="12">🕸️</text><text x="210" y="140" font-size="12" class="gpu">🍄</text>`);
  } else if (lv === 0) {   // เต็นท์ผ้าใบ
    o.push(`<path d="M40 126 L112 54 L184 126 Z" fill="#6d7a5a"/><path d="M112 54 L112 126" stroke="#3b4430" stroke-width="2"/><path d="M92 126 L112 84 L132 126 Z" fill="#171a14"/><path d="M40 126 L184 126" stroke="#2b3322" stroke-width="3"/>`);
  } else {
    const wall = lv === 1 ? "#6b4a2d" : lv === 2 ? "#7a5a38" : "#59606a", roof = lv === 1 ? "#3c2a1b" : lv === 2 ? "#5a2f24" : "#2e343c", w = 100 + lv * 14, x0 = 112 - w / 2;
    o.push(`<rect x="${x0}" y="${126 - 54 - lv * 6}" width="${w}" height="${54 + lv * 6}" fill="${wall}"/>`);
    for (let x = x0 + 8; x < x0 + w; x += 14) o.push(`<line x1="${x}" y1="${126 - 54 - lv * 6}" x2="${x}" y2="126" stroke="#0003" stroke-width="2"/>`);
    o.push(`<path d="M${x0 - 8} ${126 - 54 - lv * 6} L112 ${126 - 92 - lv * 8} L${x0 + w + 8} ${126 - 54 - lv * 6} Z" fill="${roof}"/>`);
    o.push(`<rect x="${112 - 8}" y="${126 - 34}" width="18" height="34" rx="2" fill="#2b1d12"/><circle cx="${112 + 6}" cy="${126 - 16}" r="1.6" fill="#e0b84a"/>`);
    o.push(`<rect x="${x0 + 12}" y="${126 - 44}" width="20" height="18" rx="2" fill="${lit}" stroke="#2b1d12" stroke-width="3"/>${lv >= 2 ? `<rect x="${x0 + w - 32}" y="${126 - 44}" width="20" height="18" rx="2" fill="${lit}" stroke="#2b1d12" stroke-width="3"/>` : ""}`);
    if (night) o.push(`<circle class="gpu" cx="${x0 + 22}" cy="${126 - 35}" r="22" fill="url(#ggl${q})"/>`);
    if (lv >= 2) { o.push(`<rect x="${x0 + w - 24}" y="${126 - 100}" width="10" height="26" fill="#3a2a1d"/>`); for (let i = 0; i < 3; i++) o.push(`<circle class="gsn" style="animation-delay:${i * 1.2}s;animation-name:gsm" cx="${x0 + w - 19}" cy="${126 - 104 - i * 8}" r="${3 + i}" fill="#ddd" opacity=".35"/>`); }
    if (lv >= 3) { o.push(`<rect x="${x0 - 22}" y="${126 - 70}" width="14" height="70" fill="#59606a"/><rect x="${x0 - 26}" y="${126 - 82}" width="22" height="14" fill="#2e343c"/><circle class="gpu" cx="${x0 - 15}" cy="${126 - 75}" r="3" fill="#ffd27a"/>`); for (let i = 0; i < 5; i++) o.push(`<ellipse cx="${x0 + w + 12 + (i % 3) * 10}" cy="${122 - Math.floor(i / 3) * 7}" rx="7" ry="4" fill="#9a8a62"/>`); }
    if (h === 0 && lv >= 1) o.push(`<text x="${x0 - 6}" y="124" font-size="13">🪵</text>`);
  }
  // แถวแปลงหน้าบ้าน (สถานะจริง)
  const n = Math.min(8, plots.length); const gap = 300 / Math.max(1, n);
  for (let k = 0; k < n; k++) {
    const pl = plots[k], cx = 10 + gap * (k + 0.5), by = 176, left = Math.max(0, (pl.left || 0) - spent), st = gStage(pl, left);
    o.push(`<ellipse cx="${cx}" cy="${by + 3}" rx="${Math.min(20, gap / 2 - 2)}" ry="6" fill="${pl.w ? "#33261a" : "#4a3320"}"/>`);
    if (st === 3) o.push(`<circle class="gpu" cx="${cx}" cy="${by - 9}" r="15" fill="url(#ggl${q})"/>`);
    if (st > 0) o.push(`<g transform="translate(${cx} ${by}) scale(.62)">${gPlant(pl.c, st)}</g>`);
  }
  if (!n) o.push(`<text x="160" y="178" font-size="10" text-anchor="middle" fill="#fff" opacity=".45">ยังไม่มีแปลงปลูก — อัปเกรดที่พักเป็นขั้น 1</text>`);
  o.push(`</svg>`); return o.join("");
}
// สถานีผลิตบนเคาน์เตอร์ (แทน emoji): w=น้ำ m=มอส t=อาหาร/เนื้อ
function scnStn(k, x, z) {
  if (k === "w") return `<g><rect x="${x - 6}" y="104" width="12" height="14" rx="3" fill="#3d8fd0"/><rect x="${x - 3}" y="100" width="6" height="5" rx="1.5" fill="#cfe9ff"/><rect x="${x - 4}" y="108" width="8" height="3" fill="#fff" opacity=".35"/></g>`;
  if (k === "m") return `<g><path d="M${x - 7} 111 L${x + 7} 111 L${x + 5} 118 L${x - 5} 118 Z" fill="#8a5a3a"/><circle cx="${x - 4}" cy="107" r="4.4" fill="#6e9e4a"/><circle cx="${x + 3}" cy="105" r="5" fill="#7fb05a"/><circle cx="${x}" cy="109" r="3.6" fill="#5a8a3a"/></g>`;
  return z ? `<g><ellipse cx="${x}" cy="111" rx="8" ry="6" fill="#a8483f"/><ellipse cx="${x - 2}" cy="109" rx="3" ry="2" fill="#d9776a"/><circle cx="${x + 6}" cy="108" r="2" fill="#efe"/></g>` : `<g><rect x="${x - 7}" y="104" width="14" height="14" rx="2.5" fill="#c9cdd2"/><rect x="${x - 7}" y="108" width="14" height="6" fill="#d9573f"/><rect x="${x - 7}" y="104" width="14" height="2.5" fill="#8d949b"/></g>`;
}

function gardenRows(body) {
  const D = state.gardenD, can = baseCan(), box = mk("div"); box.style.cssText = "border:1px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:8px";
  box.append(mk("b", "", "🌱 แปลงปลูก"));
  if (!D || Date.now() - (state.gardenAt || 0) > 120000) { if (!state.gardenBusy && !state.gardenLoad) { state.gardenLoad = true; gardenGo("state").finally(() => { state.gardenLoad = false; }); } }
  if (!D) { box.append(mk("span", "muted", "กำลังโหลด…")); return body.append(box); }
  if (D.n < 1) { box.append(mk("span", "muted", "อัปเกรดที่พักเป็นขั้น 1 ก่อนถึงจะเริ่มปลูกได้")); return body.append(box); }
  const spent = Date.now() - state.gardenAt, zom = state.profile?.faction === "zombie";
  const leftOf = (pl) => Math.max(0, (pl.left || 0) - spent);
  if (!D.plots.some((p) => p.i === state.gardenSel)) state.gardenSel = (D.plots.find((p) => p.c && leftOf(p) <= 0) || D.plots.find((p) => !p.c) || D.plots[0]).i;
  box.append(mk("span", "muted", `${zom ? "บ่อบ่มเชื้อ" : "สวนลับในค่าย"} ${D.n} แปลง • ${SEASON_TH[D.season]} (ฤดูกาลมีผลกับเวลาโต) • แตะแปลงในภาพเพื่อเลือก`));
  if (D.daily) box.append(btn("🎁 รับเมล็ดฟรีวันนี้", () => gardenGo("daily", null, (r) => { toast(`🌱 ได้ ${mRew(r.got)}`); logLine(`🌱 เมล็ดฟรีรายวัน: ${mRew(r.got)}`, "system"); }), "btn primary"));
  const scn = mk("div"); scn.innerHTML = gardenSceneSvg(D, state.gardenSel, spent, zom);
  scn.onclick = (e) => { const g = e.target.closest && e.target.closest("[data-i]"); if (g) { state.gardenSel = Number(g.getAttribute("data-i")); try { baseAgain(); } catch { /* ข้าม */ } } };
  box.append(scn);
  const seeds = Object.entries(D.seeds).filter(([c, q]) => q > 0 && D.crops[c]);
  const pl = D.plots.find((p) => p.i === state.gardenSel), c = mk("div"); c.style.cssText = "border:1px solid var(--hazard);border-radius:10px;padding:10px;display:grid;gap:8px;background:var(--panel-2)";
  if (!pl.c) {
    c.append(mk("b", "", `แปลงที่ ${pl.i} (ว่าง) — เลือกเมล็ดที่จะปลูก`));
    if (!seeds.length) c.append(mk("span", "muted", "ไม่มีเมล็ด — รับฟรีรายวัน / ซื้อด้านล่าง / ได้จากหีบ พ่อค้าเร่ ดิ่งลึก"));
    const row = mk("div"); row.style.cssText = "display:grid;gap:6px";
    seeds.forEach(([k, q]) => { const v = D.crops[k], b = btn(`${v.i} ปลูก${v.n} ×${q} • โต ${baseHm(v.g)} • ได้ ${mRew([v.y])}`, () => gardenGo("plant", { i: pl.i, c: k }), "btn primary"); b.disabled = !can; b.style.textAlign = "left"; row.append(b); });
    c.append(row);
  } else {
    const v = D.crops[pl.c] || { i: "🌱", n: pl.c, y: ["", 0] }, left = leftOf(pl), done = left <= 0;
    c.append(mk("b", "", `${v.i} ${v.n} (แปลง ${pl.i})${pl.w ? " 💧" : ""}${pl.f ? " 🧪" : ""}`), worldBar(pl.total ? 1 - left / pl.total : 1, done ? "พร้อมเก็บเกี่ยว!" : `อีก ~${baseHm(left)}`), mk("span", "muted", `ผลผลิต ${mRew([[v.y[0], v.y[1] + (pl.f ? 1 : 0)]])}`));
    const row = mk("div"); row.style.cssText = "display:grid;gap:6px";
    if (done) { const b = btn("🧺 เก็บเกี่ยว", () => gardenGo("harvest", { i: pl.i }, gardenDone), "btn primary"); b.disabled = !can; row.append(b); }
    else {
      const w = btn(pl.w ? "💧 รดน้ำแล้ว" : `💧 รดน้ำ (${mRew([D.water])}) — เร็วขึ้น 25%`, () => gardenGo("water", { i: pl.i }), "btn ghost"), f = btn(pl.f ? "🧪 ใส่ปุ๋ยแล้ว" : `🧪 ใส่ปุ๋ย (${mRew([D.fert])}) — +1 ผลผลิต กันศัตรูพืช`, () => gardenGo("fert", { i: pl.i }), "btn ghost");
      w.disabled = !can || pl.w; f.disabled = !can || pl.f; row.append(w, f);
    }
    c.append(row);
  }
  box.append(c);
  const ready = D.plots.filter((p) => p.c && leftOf(p) <= 0).length;
  if (ready > 1) { const b = btn(`🧺 เก็บเกี่ยวทั้งหมด (${ready} แปลง)`, () => gardenGo("harvest", { i: "all" }, gardenDone), "btn primary"); b.disabled = !can; box.append(b); }
  const shop = Object.entries(D.crops).filter(([, v]) => v.buy);
  const sb = mk("details"); sb.append(mk("summary", "", `🌰 เมล็ดที่มี: ${seeds.length ? seeds.map(([k, q]) => `${D.crops[k].i}×${q}`).join(" ") : "ไม่มี"} • ซื้อเมล็ด`));
  if (shop.length) { const row = mk("div"); row.style.cssText = "display:grid;gap:6px;margin-top:8px"; shop.forEach(([k, v]) => { const b = btn(`ซื้อ ${v.i}${v.n} (${mRew([v.buy])})`, () => gardenGo("buy", { c: k, q: 1 }, () => toast(`🌱 ซื้อเมล็ด${v.n}แล้ว`)), "btn ghost"); b.disabled = !can; row.append(b); }); sb.append(row); }
  sb.open = !!state.gardenShop; sb.addEventListener("toggle", () => { state.gardenShop = sb.open; });
  box.append(sb);
  try { gardenUpRows(box, D); } catch { /* ข้าม */ }
  body.append(box);
}
// ---- ⬆️ อัปเกรดสวน (functions/garden.js `upgrade`; ระดับ 1–5 แยกตามฝ่าย — ข้อมูลทั้งหมดมากับ state.gardenD.up)
function gardenUpRows(box, D) {
  const U = D?.up; if (!U) return;
  const d = mk("details"), eff = U.eff || {}, parts = [];
  if (eff.p) parts.push(`แปลง +${eff.p}`); if (eff.g) parts.push(`เวลาโต −${eff.g}%`); if (eff.b) parts.push(`โอกาสได้ผลผลิต +1 ชิ้น ${eff.b}%`); if (eff.m) parts.push(`กลายพันธุ์ +${eff.m}%`);
  d.append(mk("summary", "", `⬆️ อัปเกรดสวน ระดับ ${U.lv}/${U.max}${parts.length ? " • " + parts.join(" • ") : ""}`));
  const wrap = mk("div"); wrap.style.cssText = "display:grid;gap:6px;margin-top:8px";
  U.tiers.forEach((t, i) => wrap.append(mk("span", t.done ? "" : "muted", `${t.done ? "✅" : `${i + 1}.`} ${t.n} — ${t.d}`)));
  if (U.next) {
    const have = (id) => state.inv?.[id]?.qty || 0, ok = U.next.cost.every(([id, q]) => have(id) >= q);
    wrap.append(mk("span", "", `ระดับ ${U.lv + 1}: ${U.next.n} — ${U.next.d}`), mk("span", ok ? "" : "muted", "ต้องใช้ " + U.next.cost.map(([id, q]) => `${ITEMS[id]?.icon || ""}${ITEMS[id]?.name || id} ${Math.min(have(id), 999)}/${q}`).join(" • ")));
    const b = btn(`⬆️ อัปเกรดเป็นระดับ ${U.lv + 1}`, () => gardenGo("upgrade", null, (r) => { toast(`⬆️ อัปเกรดสวนแล้ว: ${r.upgraded}`); logLine(`⬆️ คุณอัปเกรดสวนเป็นระดับ ${r.lv}: ${r.upgraded}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }), "btn primary");
    b.disabled = !baseCan() || !ok; wrap.append(b);
  } else wrap.append(mk("span", "", "🏆 สวนอัปเกรดถึงระดับสูงสุดแล้ว"));
  d.append(wrap); d.open = !!state.gardenUp; d.addEventListener("toggle", () => { state.gardenUp = d.open; });
  box.append(d);
}
// ---- /อัปเกรดสวน
function gardenDone(r) {
  toast(`🌱 ได้ ${mRew(r.got)}`); logLine(`🌱 เก็บเกี่ยว ${r.cnt} แปลง: ${mRew(r.got)}`, "system");
  (r.notes || []).forEach((n) => logLine(n, "info")); try { achBump("gard", r.cnt); sfx("boss"); } catch { /* ข้าม */ }
}

/* =========================================================
   49.35) 📖 สมุดสะสมแบบชุด + 🏅 ความสมบูรณ์ผู้รอดชีวิต (functions/col.js — colAct) • แท็บ "สะสม" ในศูนย์กิจกรรม
   - ไอเทม/โซนที่เคยพบ (สมุดสะสมในเครื่อง book_i / book_z) ถูกซิงก์ขึ้นเซิร์ฟเวอร์ → ครบชุดรับรางวัลได้ครั้งเดียวต่อชุด
   - ความสมบูรณ์ % = เฉลี่ยของชุดสะสมทั้งหมด + เหตุการณ์สำคัญ → รางวัล 25/50/75/100%
   ========================================================= */
const colDot = () => { const D = state.colD; return !!D && (D.sets.some((s) => s.done && !s.got) || D.rewards.some((r) => r.ok && !r.got)); };
async function colSync(a = "sync", x) {
  const body = a === "sync" ? { a, i: [...bookSet("i")], z: [...bookSet("z")] } : { a, ...(x || {}) };
  try { await achFlush(); } catch { /* ข้าม */ }
  const r = await colCall(body); state.colD = r; state.colAt = Date.now(); return r;
}
function colKick() {
  if (state.colBusy) return; state.colBusy = true;
  colSync().catch((e) => toast(fnErr(e))).finally(() => { state.colBusy = false; try { hubBtn(); colRender(); } catch { /* ข้าม */ } });
}
function colTick() {
  if (!state.profile || !state.ach?.loaded || state.colBusy || document.hidden) return;
  if (state.colAt && Date.now() - state.colAt < 600000) return;
  state.colBusy = true; state.colAt = Date.now();   // ซิงก์เงียบ ๆ ทุก 10 นาที (ใช้ทำจุดแจ้งเตือน)
  colSync().catch(() => { /* ข้าม */ }).finally(() => { state.colBusy = false; try { hubBtn(); colRender(); } catch { /* ข้าม */ } });
}
function colRender() {
  const body = $("col-body"); if (!body || !hubOn("col")) return; body.innerHTML = "";
  const D = state.colD, card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; };
  if (!D) { card().append(mk("div", "muted", "กำลังโหลด…")); return; }
  const claim = (k) => async () => {
    if (state.colBusy) return; state.colBusy = true;
    try { const r = await colSync("claim", { k }); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`📖 รางวัลสมุดสะสม: ${mRew(r.rewarded)}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }
    catch (e) { toast(fnErr(e)); } finally { state.colBusy = false; hubBtn(); colRender(); }
  };
  const h = card(); h.append(mk("div", "", `🏅 ผู้รอดชีวิตเต็มตัว ${D.pct}%`), worldBar(D.pct / 100, `${D.pct}% • ชุดครบแล้ว ${D.done}/${D.sets.length}`));
  D.rewards.forEach((r) => { const row = mk("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px"; row.append(mk("div", r.got ? "muted" : "", `${r.got ? "✅" : r.ok ? "🎯" : "🔒"} ${r.p}%: ${mRew(r.rew)}`)); if (r.ok && !r.got) row.append(btn("รับ", claim("m" + r.p), "btn primary mini")); h.append(row); });
  const sh = card(); sh.append(mk("div", "", "📖 ชุดสะสม"), mk("div", "muted", "เก็บของ/ไปโซน/เก็บเกี่ยวให้ครบทั้งชุดแล้วกดรับรางวัล (ได้ครั้งเดียวต่อชุด) • ของที่เคยเจอจะบันทึกอัตโนมัติ"));
  D.sets.forEach((s) => {
    const c = mk("div"); c.style.cssText = "border:1px solid var(--line);border-radius:8px;padding:8px;display:grid;gap:6px;margin-top:8px";
    c.append(mk("b", "", `${s.icon} ${s.n} (${s.have}/${s.total})${s.got ? " ✅" : ""}`), worldBar(s.have / s.total, s.done ? "ครบชุด!" : `ขาดอีก ${s.total - s.have}`));
    if (!s.done) c.append(mk("span", "muted", `ยังไม่เคยเจอ: ${s.miss.map((id) => s.k === "i" ? `${ITEMS[id]?.icon || "❔"}${ITEMS[id]?.name || id}` : s.k === "z" ? (ZONES[id]?.name || id) : id).join(" • ")}`.slice(0, 220)));
    c.append(mk("span", "muted", `รางวัล: ${mRew(s.rew)}`));
    if (s.done && !s.got) c.append(btn("รับรางวัลชุด", claim(s.id), "btn primary mini"));
    sh.append(c);
  });
  const mc = card(); mc.append(mk("div", "", "🎯 เหตุการณ์สำคัญ (นับรวมในความสมบูรณ์)"));
  D.miles.forEach((m) => { const r = mk("div", m.v >= m.n ? "muted" : ""); r.style.marginTop = "6px"; r.append(document.createTextNode(`${m.v >= m.n ? "✅" : "⬜"} ${m.t} — ${m.v}/${m.n}`)); mc.append(r); });
}

/* =========================================================
   49.45) 🛋️ บ้านของฉัน — จัดห้องเอง • ธีม • เยี่ยมห้อง • ถูกใจ • ห้องยอดนิยม (functions/home.js — homeAct) • ไม่แตะ rules
   - แท็บ "🛋️ จัดห้อง" ในหน้าต่างที่พัก: เลือกของจากถาด → แตะในภาพเพื่อวาง/ย้าย → บันทึก (เซิร์ฟเวอร์ตรวจเจ้าของ/โซน/จำนวนช่อง)
   - หน้าประวัติผู้เล่นอื่น: เห็นห้องที่เขาจัด + ถูกใจวันละ 5 ห้อง • ของเดิม 12 ชิ้นย้ายเข้าระบบใหม่อัตโนมัติ
   ========================================================= */
function homeItemsMap(D) { const m = {}; (D?.catalog || []).forEach((c) => { m[c.id] = [c.ic, c.n, c.sz]; }); return m; }
function homePal(D, th) { const t = D?.themes?.find((x) => x.id === th); return t && t.pal ? t.pal : null; }
async function homeGo(a, x, ok) {
  if (state.homeBusy) return; state.homeBusy = true;
  try { const r = await homeCall({ a, ...(x || {}) }); if (r.catalog) state.homeD = r; if (ok) ok(r); }
  catch (e) { toast(fnErr(e)); } finally { state.homeBusy = false; try { baseAgain(); } catch { /* ข้าม */ } }
}
function homeLoad() { if (!state.homeD && !state.homeBusy && !state.homeLoadTry) { state.homeLoadTry = true; homeGo("state").finally(() => { state.homeLoadTry = false; }); } }
function homeDraftInit() {
  const D = state.homeD; if (!D) return null;
  if (!state.homeDraft || state.homeDraft.base !== D) state.homeDraft = { base: D, lay: D.lay.map((e) => ({ ...e })), th: D.th, cap: D.cap, sel: null, pick: null };
  return state.homeDraft;
}
const homeUsed = (dr, d) => dr.lay.filter((e) => e.d === d).length;
const homeSceneObj = (D, dr) => ({ ...baseSceneOwn(), layout: dr.lay.map((e, i) => ({ ...e, i })), items: homeItemsMap(D), pal: homePal(D, dr.th), sel: dr.sel });
function homeEdit(sc, body) {
  const D = state.homeD, can = baseCan(); homeLoad();
  if (!D) { sc.append(mk("div", "muted", "กำลังโหลด…")); return; }
  const dr = homeDraftInit(), cat = (id) => D.catalog.find((c) => c.id === id), draw = () => { sc.innerHTML = baseSceneSvg(homeSceneObj(D, dr)); };
  draw();
  sc.onclick = (ev) => {
    const svg = sc.querySelector("svg"); if (!svg) return; const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 320, y = (ev.clientY - r.top) / r.height * 200;
    let best = -1, bd = 1e9; dr.lay.forEach((e, i) => { const c = cat(e.d), sz = c ? c.sz : 24, d = Math.hypot(e.x - x, e.y - sz / 3 - y); if (d < Math.max(16, sz * 0.65) && d < bd) { bd = d; best = i; } });
    const place = (c, at) => { const zr = { w: [20, 132], f: [128, 196], a: [20, 196] }[c.z]; return { d: c.id, x: Math.max(8, Math.min(312, Math.round(x / 8) * 8)), y: Math.max(zr[0], Math.min(zr[1], Math.round((y + c.sz / 3) / 4) * 4)) }; };
    if (dr.pick) {   // วางชิ้นใหม่
      const c = cat(dr.pick); if (!c) return;
      if (dr.lay.length >= D.slots) return toast(`วางได้ไม่เกิน ${D.slots} ชิ้นที่ที่พักระดับนี้ (อัปเกรดที่พักเพื่อเพิ่มช่อง)`);
      if (homeUsed(dr, c.id) >= (D.own[c.id] || 0)) return toast(`${c.n} วางครบจำนวนที่มีแล้ว`);
      dr.lay.push(place(c)); dr.sel = dr.lay.length - 1; if (homeUsed(dr, c.id) >= (D.own[c.id] || 0)) dr.pick = null; baseAgain(); return;
    }
    if (best >= 0) { dr.sel = dr.sel === best ? null : best; baseAgain(); return; }
    if (dr.sel !== null && dr.lay[dr.sel]) { const c = cat(dr.lay[dr.sel].d); if (c) { const p = place(c); dr.lay[dr.sel] = { ...dr.lay[dr.sel], x: p.x, y: p.y }; baseAgain(); } }   // ย้ายชิ้นที่เลือกไปจุดที่แตะ
  };
  const box = mk("div"); box.style.cssText = "border:1px solid var(--hazard);border-radius:10px;padding:10px;display:grid;gap:8px;background:var(--panel-2);margin-top:8px";
  const dirty = JSON.stringify(dr.lay) !== JSON.stringify(D.lay) || dr.th !== D.th || dr.cap !== D.cap;
  box.append(mk("b", "", `🛋️ จัดห้อง — วางแล้ว ${dr.lay.length}/${D.slots} ชิ้น${dirty ? " • ยังไม่ได้บันทึก" : ""}`), mk("span", "muted", dr.pick ? `เลือก ${cat(dr.pick)?.ic} ${cat(dr.pick)?.n} อยู่ — แตะในภาพเพื่อวาง` : dr.sel !== null && dr.lay[dr.sel] ? "เลือกชิ้นที่วางแล้ว — แตะที่ว่างเพื่อย้าย หรือกดลบ" : "เลือกของจากถาดด้านล่าง แล้วแตะในภาพเพื่อวาง • แตะของที่วางแล้วเพื่อเลือกย้าย/ลบ"));
  const tray = mk("div"); tray.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;-webkit-overflow-scrolling:touch";
  D.catalog.filter((c) => (D.own[c.id] || 0) > 0).forEach((c) => {
    const left = (D.own[c.id] || 0) - homeUsed(dr, c.id), b = btn(`${c.ic} ${c.n} ×${left}`, () => { dr.pick = dr.pick === c.id ? null : c.id; dr.sel = null; baseAgain(); }, "btn mini " + (dr.pick === c.id ? "primary" : "ghost"));
    b.style.cssText += ";flex:0 0 auto;white-space:nowrap"; b.disabled = left <= 0 && dr.pick !== c.id; tray.append(b);
  });
  if (!tray.children.length) tray.append(mk("span", "muted", "ยังไม่มีของตกแต่ง — ซื้อด้านล่าง หรือได้จากหีบ/ซีซัน/สมุดสะสม"));
  box.append(tray);
  const row = mk("div"); row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px";
  const del = btn("🗑️ ลบที่เลือก", () => { if (dr.sel !== null) { dr.lay.splice(dr.sel, 1); dr.sel = null; baseAgain(); } }, "btn ghost"); del.disabled = dr.sel === null;
  row.append(del, btn("ล้างทั้งห้อง", () => { if (!dr.lay.length || confirm("เก็บของทุกชิ้นออกจากห้อง? (ของยังอยู่ในคลัง)")) { dr.lay = []; dr.sel = null; baseAgain(); } }, "btn ghost"));
  box.append(row);
  // ธีม + วลี
  const th = mk("div"); th.style.cssText = "display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px"; th.append(mk("span", "muted", "ธีม:"));
  D.themes.forEach((t) => { const b = btn(`${t.ic} ${t.n}${t.owned ? "" : t.cost ? " 🔒" : " 🔒"}`, () => { if (t.owned) { dr.th = t.id; baseAgain(); } else if (t.cost) { if (confirm(`ซื้อธีม "${t.n}" ด้วย ${mRew([t.cost])} ?`)) homeGo("buy", { t: t.id }, () => toast(`🎨 ได้ธีม ${t.n}`)); } else toast("ธีมนี้ได้จากรางวัล (ซีซัน/สมุดสะสม/ห้องยอดนิยม)"); }, "btn mini " + (dr.th === t.id ? "primary" : "ghost")); b.style.cssText += ";flex:0 0 auto;white-space:nowrap"; th.append(b); });
  box.append(th);
  const cs = document.createElement("select"); cs.style.cssText = "width:100%;min-height:44px"; cs.append(new Option("— ไม่มีวลีประจำห้อง —", ""));
  D.caps.forEach((c, i) => cs.append(new Option(c, String(i)))); cs.value = dr.cap === null || dr.cap === undefined ? "" : String(dr.cap); cs.addEventListener("change", () => { dr.cap = cs.value === "" ? null : Number(cs.value); });
  box.append(cs);
  const save = btn(dirty ? "💾 บันทึกห้อง" : "บันทึกแล้ว", () => homeGo("place", { lay: dr.lay.map(({ d, x, y }) => ({ d, x, y })), th: dr.th, cap: dr.cap }, () => { toast("🛋️ บันทึกห้องแล้ว"); logLine("🛋️ จัดห้องใหม่แล้ว คนอื่นเยี่ยมชมได้จากหน้าประวัติของคุณ", "system"); state.homeDraft = null; try { achBump("home"); } catch { /* ข้าม */ } }), "btn primary"); save.disabled = !dirty || !can;
  const rs = btn("↩️ คืนค่าเดิม", () => { state.homeDraft = null; baseAgain(); }, "btn ghost"); rs.disabled = !dirty;
  box.append(save, rs); if (!can) box.append(mk("span", "muted", "ต้องอยู่ที่ Safe Zone และมีชีวิตถึงจะบันทึกได้"));
  body.append(box);
  // ร้านค้า
  const shop = mk("details"); shop.style.marginTop = "8px"; shop.append(mk("summary", "", "🛒 ร้านของตกแต่ง (ซื้อด้วยวัสดุ)"));
  Object.entries(D.cats).filter(([k]) => k !== "old" && k !== "fest").forEach(([k, name]) => {
    const items = D.catalog.filter((c) => c.cat === k && c.cost); if (!items.length) return;
    shop.append(mk("div", "muted", name)); const g = mk("div"); g.style.cssText = "display:grid;gap:6px;margin:4px 0 8px";
    items.forEach((c) => { const have = D.own[c.id] || 0, b = btn(`${c.ic} ${c.n} • ${mRew([c.cost])}${have ? ` • มี ${have}` : ""}`, () => homeGo("buy", { d: c.id }, () => toast(`${c.ic} ซื้อ ${c.n} แล้ว`)), "btn ghost"); b.disabled = !can || have >= 9; b.style.textAlign = "left"; g.append(b); });
    shop.append(g);
  });
  shop.append(mk("div", "muted", "🎁 เทศกาล/รางวัล: ได้จากหีบรายวัน ซีซัน สมุดสะสม ดิ่งลึก และห้องยอดนิยมประจำสัปดาห์ • ของเดิม 12 ชิ้นซื้อได้ที่ส่วน “ของตกแต่งที่พัก” ด้านล่าง"));
  body.append(shop);
  const tp = mk("details"); tp.style.marginTop = "8px"; tp.append(mk("summary", "", `🏆 ห้องยอดนิยมประจำสัปดาห์ • คุณได้ ❤️ ${D.wlikes} สัปดาห์นี้ (รวม ${D.likes})`));
  tp.addEventListener("toggle", () => { if (tp.open && !tp.dataset.l) { tp.dataset.l = 1; homeTopFill(tp); } }); body.append(tp);
}
async function homeTopFill(host) {
  const box = mk("div"); box.style.cssText = "display:grid;gap:6px;margin-top:6px"; host.append(box); box.append(mk("span", "muted", "กำลังโหลด…"));
  try {
    const r = await homeCall({ a: "top" }); box.innerHTML = "";
    box.append(mk("div", "muted", `สัปดาห์นี้ (เหลือ ${passMs(r.end - serverNow())}) — 10 อันดับแรกของสัปดาห์ได้รางวัลสัปดาห์ถัดไป`));
    if (!r.cur.length) box.append(mk("span", "muted", "ยังไม่มีใครได้ถูกใจ — ตกแต่งห้องแล้วชวนเพื่อนมาเยี่ยม!"));
    r.cur.forEach((x, i) => { const row = mk("div"); row.style.cssText = "display:flex;gap:8px;justify-content:space-between"; row.append(mk("span", "", `${["🥇", "🥈", "🥉"][i] || `${i + 1}.`} ${x.name}`), mk("span", "muted", `❤️ ${x.v}`)); row.style.cursor = "pointer"; row.onclick = () => { try { showBio(x.uid, x.name, x.fac); } catch { /* ข้าม */ } }; box.append(row); });
    if (r.canClaim) box.append(btn("🎁 รับรางวัลห้องยอดนิยมสัปดาห์ที่แล้ว", () => homeGo("claimTop", null, (q) => { toast(`🏆 อันดับ ${q.rank}: ได้ ${mRew(q.rewarded)}`); logLine(`🏆 ห้องยอดนิยมอันดับ ${q.rank}: ${mRew(q.rewarded)}`, "system"); }), "btn primary"));
  } catch (e) { box.innerHTML = ""; box.append(mk("span", "muted", fnErr(e))); }
}
// ---- เยี่ยมห้องในหน้าประวัติผู้เล่น ----
async function homeVisitFill(uid, name, fac) {
  const modalOpen = () => !$("bio-modal").classList.contains("hidden");
  let r; try { r = await homeCall({ a: "visit", uid }); } catch { r = null; }
  if (!modalOpen()) return true;
  if (!r || !r.ok || !r.lay || !r.lay.length) return false;   // ยังไม่ได้จัดห้อง / ฟังก์ชันยังไม่ deploy → ใช้ภาพห้องเดิม
  let h = $("bio-scene"); if (!h) { h = mk("div"); h.id = "bio-scene"; h.style.margin = "8px 0"; $("bio-text").before(h); }
  h.innerHTML = ""; const sc = mk("div"); sc.innerHTML = baseSceneSvg({ lv: r.lv, deco: {}, zombie: r.fac === "zombie", uid, stations: [], bench: [], layout: r.lay, items: r.items, pal: r.pal });
  sc.onclick = (e) => { const g = e.target.closest && e.target.closest("[data-n]"); if (g) toast(g.getAttribute("data-n")); }; h.append(sc);
  if (r.cap) h.append(mk("div", "muted", `💬 “${r.cap}”`));
  const row = mk("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px"; row.append(mk("span", "muted", `❤️ ${r.likes} (สัปดาห์นี้ ${r.wlikes})`));
  if (!r.self) { const b = btn(r.liked ? "❤️ ถูกใจแล้ววันนี้" : `🤍 ถูกใจห้องนี้ (เหลือ ${r.left})`, () => { b.disabled = true; homeCall({ a: "like", to: uid }).then((q) => { toast(`❤️ ถูกใจแล้ว${q.rew ? ` • ได้ ${mRew(q.rew)}` : ""}`); try { achBump("like"); } catch { /* ข้าม */ } b.textContent = "❤️ ถูกใจแล้ววันนี้"; }).catch((e) => { toast(fnErr(e)); b.disabled = false; }); }, "btn primary mini"); b.disabled = r.liked || r.left <= 0; row.append(b); }
  h.append(row); return true;
}

/* =========================================================
   49.46) ⚡ ความสามารถประจำอาชีพ/สายวิวัฒนาการ (functions/ability.js — abilAct) • ⚔️ ศึกใหญ่ประจำสัปดาห์ (functions/war.js — warAct) • ไม่แตะ rules
   - แถบ ⚡ ใต้ปุ่มค้นหา: กดใช้พลังประจำสาย (มีค่าใช้จ่ายเล็กน้อย + คูลดาวน์) → ตัวคูณมีผล 10–16 นาที เข้าตารางค้นหา/ลดดาเมจ/ทอยปะทะ
   - หมอสนามรักษา HP ตัวเอง/เพื่อนมนุษย์ในโซนเดียวกันทันที • ซอมบี้ใช้พลังตามสายวิวัฒนาการ
   - ศึกใหญ่: แท็บใหม่ใน 🎲 ผจญภัย — แต้มศึกชิงโซนรวมทั้งเซิร์ฟเวอร์ รับรางวัลสัปดาห์ก่อน + ฝ่ายชนะได้โบนัสตลอดสัปดาห์นี้
   ========================================================= */
const abilLive = () => { const D = state.abilD; return D && D.live && D.live.until > serverNow() ? D.live : null; };
const abilInvalidate = () => { try { fxMemo = { k: "", v: null }; } catch { /* ข้าม */ } };
function fxAbilMods(m) {
  const L = abilLive(), e = L && L.eff; if (e) {
    ["n", "z", "r", "f", "w", "rm", "sc", "a"].forEach((k) => { if (e[k] !== undefined && m[k] !== undefined) m[k] *= e[k]; });
    if (e.it) Object.entries(e.it).forEach(([id, v]) => { m.it[id] = (m.it[id] || 1) * v; });
  }
  const mp = state.profile?.faction === "zombie" && state.mutD && state.mutD.pass;   // มิวเตชันซอมบี้ (โบนัสถาวร)
  if (mp) ["n", "z", "r", "f", "w", "rm", "sc", "a"].forEach((k) => { if (mp[k] !== undefined && m[k] !== undefined) m[k] *= mp[k]; });
  const b = state.warD && state.warD.buff;   // โบนัสฝ่ายผู้ชนะศึกสัปดาห์ก่อน
  if (b) ["n", "z", "r", "f", "w", "rm", "sc", "a"].forEach((k) => { if (b[k] !== undefined && m[k] !== undefined) m[k] *= b[k]; });
}
const fxAbilCut = () => { const L = abilLive(), mp = state.profile?.faction === "zombie" && state.mutD && state.mutD.pass; return (L && L.eff && L.eff.cut ? L.eff.cut : 0) + (mp && mp.cut ? mp.cut : 0); };
const abilDice = () => { const L = abilLive(); return L && L.eff && L.eff.dice ? L.eff.dice : 0; };
async function abilSync(a = "state", x) { const r = await abilCall({ a, ...(x || {}) }); state.abilD = r; state.abilAt = Date.now(); abilInvalidate(); return r; }
async function warSync(a = "state") { const r = await warCall({ a }); state.warD = r; state.warAt = Date.now(); abilInvalidate(); return r; }
function abilTick() {
  if (!state.profile || !state.ach?.loaded || document.hidden) return;
  const now = Date.now();
  if (!state.abilBusy && (!state.abilAt || now - state.abilAt > 600000)) {
    state.abilBusy = true; state.abilAt = now; abilSync().catch(() => { /* ข้าม */ }).finally(() => { state.abilBusy = false; try { abilBar(); } catch { /* ข้าม */ } });
  }
  if (state.profile.faction === "zombie" && !state.mutBusy && (!state.mutAt || now - state.mutAt > 900000)) mutSync().catch(() => { /* ข้าม */ });
  if (!state.warBusy && (!state.warAt || now - state.warAt > 900000)) {
    state.warBusy = true; state.warAt = now; warSync().catch(() => { /* ข้าม */ }).finally(() => { state.warBusy = false; try { hubBtn(); } catch { /* ข้าม */ } });
  }
  abilBar();
}
const abilMs = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")} ชม.` : `${m}:${String(x).padStart(2, "0")}`; };
function abilBar() {
  const D = state.abilD, anchor = $("btn-scavenge"); if (!anchor) return; let b = $("abil-bar");
  if (!D || !D.has) { if (b) b.classList.add("hidden"); return; }
  if (!b) { b = mk("div", "abil-bar"); b.id = "abil-bar"; anchor.after(b); }   // ใต้ปุ่มค้นหา
  b.classList.remove("hidden"); b.innerHTML = "";
  const live = abilLive(), cdLeft = Math.max(0, D.cdLeft - (Date.now() - state.abilAt));
  const t = mk("span", "abil-t", `${D.i} ${D.n} (ขั้น ${D.L})`), sub = mk("span", "muted", live ? `⚡ ทำงานอยู่ อีก ${abilMs(live.until - serverNow())}` : cdLeft > 0 ? `คูลดาวน์ ${abilMs(cdLeft)}` : D.heal ? `รักษา +${D.heal} HP • ใช้ ${mRew([D.cost])}` : `${D.d} • ${D.dur} นาที • ใช้ ${mRew([D.cost])}`);
  const info = mk("div"); info.style.cssText = "min-width:0;display:grid;line-height:1.3"; info.append(t, sub); b.append(info);
  const go = (to) => { if (state.abilBusy) return; state.abilBusy = true; abilSync("use", to ? { to } : null).then((r) => { toast(r.healed !== undefined ? `🩹 รักษา +${r.healed} HP${r.to ? ` ให้ ${r.to.name}${r.rew ? " • ได้ " + mRew(r.rew) : ""}` : ""}` : `⚡ ${r.n} เริ่มทำงาน ${r.dur} นาที`); logLine(`⚡ ใช้ความสามารถ ${r.i} ${r.n}${r.healed !== undefined ? ` (+${r.healed} HP${r.to ? " → " + r.to.name : ""})` : ""}`, "system"); if (r.to) { try { achBump("aid"); } catch { /* ข้าม */ } } }).catch((e) => toast(fnErr(e))).finally(() => { state.abilBusy = false; abilBar(); }); };
  if (D.heal) {
    const row = mk("div"); row.style.cssText = "display:flex;gap:6px;flex:none"; const dis = cdLeft > 0;
    const me = btn("ตัวเอง", () => go(null), "btn primary mini"); me.disabled = dis; const fr = btn("เพื่อน", () => abilPick(go), "btn ghost mini"); fr.disabled = dis || D.aidLeft <= 0; row.append(me, fr); b.append(row);
  } else { const u = btn(live ? "ทำงานอยู่" : "ใช้", () => go(null), "btn primary mini"); u.disabled = !!live || cdLeft > 0; b.append(u); }
}
function abilPick(go) {
  const list = Object.entries(state.players || {}).filter(([id, v]) => id !== state.uid && v && v.faction === "human");
  if (!list.length) return toast("ไม่มีเพื่อนมนุษย์ในโซนนี้");
  if (!$("abil-pick")) {
    const m = mk("div", "modal sheet hidden"); m.id = "abil-pick"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    const box = mk("div", "modal-box"), top = mk("div", "sheet-top"), head = mk("div", "modal-head"); head.append(mk("h2", "", "🩹 เลือกคนที่จะรักษา"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini")); top.append(head);
    const body = mk("div", "hub2-body"); body.id = "abil-pick-body"; body.style.marginTop = "12px"; box.append(top, body); m.append(box); document.body.append(m);
  }
  const body = $("abil-pick-body"); body.innerHTML = ""; list.forEach(([id, v]) => body.append(btn(`🧑 ${v.name}`, () => { $("abil-pick").classList.add("hidden"); go(id); }, "btn ghost")));
  $("abil-pick").classList.remove("hidden");
}
// ---- แท็บ ⚔️ ศึกใหญ่ (ใน 🎲 ผจญภัย) ----
function warRender(card) {
  const D = adv.war; if (!D) { card().append(mk("div", "muted", "กำลังโหลด…")); return; }
  const c = card(), tot = Math.max(1, D.h + D.z), mine = D.fac === "zombie" ? "🧟 ซอมบี้" : "🧑 มนุษย์";
  c.append(mk("div", "", "⚔️ ศึกใหญ่ประจำสัปดาห์"), mk("div", "muted", `มนุษย์ vs ซอมบี้ — แต้มจากศึกชิงโซน (ค้นหา/ชนะซอมบี้/บอส/กัดเหยื่อนอก Safe Zone) รวมทั้งเซิร์ฟเวอร์ • จบใน ${passMs(D.end - serverNow())} • ฝ่ายชนะได้โบนัสตลอดสัปดาห์ถัดไป`));
  const bar = mk("div"); bar.style.cssText = "display:flex;height:14px;border-radius:7px;overflow:hidden;margin:8px 0;background:var(--panel-2,#1c2128)"; const bh = mk("div"), bz = mk("div"); bh.style.cssText = `width:${D.h / tot * 100}%;background:#4a90d9`; bz.style.cssText = `width:${D.z / tot * 100}%;background:#8bb83a`; bar.append(bh, bz);
  c.append(bar, mk("div", "", `🧑 มนุษย์ ${D.h} • 🧟 ซอมบี้ ${D.z}`), mk("div", "muted", `คุณ (${mine}) สะสมแล้ว ${D.mine} แต้มสัปดาห์นี้ (ต้องมี ${D.min}+ เพื่อรับรางวัลสัปดาห์หน้า)`));
  const p = D.prev, pc = card(p.canClaim ? " evt-live" : "");
  pc.append(mk("div", "", "📜 ผลสัปดาห์ที่แล้ว"), mk("div", "muted", p.h + p.z <= 0 ? "ไม่มีข้อมูล" : `🧑 ${p.h} vs 🧟 ${p.z} — ${p.win === "h" ? "มนุษย์ชนะ 🏆" : p.win === "z" ? "ซอมบี้ชนะ 🏆" : "เสมอ/แต้มรวมน้อยไป"} • คุณได้ ${p.mine} แต้ม`));
  if (D.buff && D.buffOf) pc.append(mk("div", "", `✨ ฝ่ายคุณชนะ — โบนัสทั้งฝ่ายมีผลตลอดสัปดาห์นี้ (อาหาร/น้ำ/ของที่ค้นเจอดีขึ้นเล็กน้อย)`));
  if (p.canClaim) pc.append(mk("div", "muted", `รางวัล (${p.won ? "ผู้ชนะ" : "ปลอบใจ"}): ${mRew(p.rew)}`), btn("🎁 รับรางวัล", async () => { try { const r = await warSync("claim"); state.warD = r; adv.war = r; toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`⚔️ รางวัลศึกใหญ่ (${r.won ? "ชนะ" : "ปลอบใจ"}): ${mRew(r.rewarded)}`, "system"); } catch (e) { toast(fnErr(e)); } advBtn(); advRender(); }, "btn primary"));
  else if (p.claimed) pc.append(mk("div", "muted", "✅ รับรางวัลแล้ว"));
  else if (p.h + p.z > 0 && p.mine < D.min) pc.append(mk("div", "muted", `ต้องมีส่วนร่วมอย่างน้อย ${D.min} แต้มถึงรับรางวัลได้ (คุณมี ${p.mine})`));
}

/* =========================================================
   49.47) 🪪 โปรไฟล์ตกแต่งตัวตน — อวาตาร์ • กรอบ • แบนเนอร์ • ฉายา • รูปอัปโหลด (functions/profile.js — profAct • storage.rules)
   - ปลดล็อกจากความก้าวหน้าจริง (ตรวจฝั่งเซิร์ฟเวอร์) • การ์ดโปรไฟล์โชว์ในหน้าประวัติของผู้เล่นอื่น
   - รูปอัปโหลด: ส่งไฟล์ต้นฉบับไป Storage → ระบบแปลงเป็น webp < 100 KB ให้เอง (ผู้เล่นไม่ต้องแปลงมาก่อน) • ขึ้นทันที มีปุ่มรายงาน + เครื่องมือ GM
   ========================================================= */
const FR_CSS = {
  fr_none: "border:2px solid #3a424c", fr_tan: "border:3px solid #b87333", fr_steel: "border:3px solid #9aa4ac", fr_gold: "border:3px solid #e0b84a;box-shadow:0 0 8px #e0b84a88", fr_mint: "border:3px solid #6fd6a0;box-shadow:0 0 6px #6fd6a066",
  fr_blood: "border:3px solid #b0243a;box-shadow:0 0 8px #b0243a88", fr_neon: "border:3px solid #39f0ff;box-shadow:0 0 10px #39f0ff,inset 0 0 6px #39f0ff66", fr_rain: "border:4px double #7fb6e8", fr_heart: "border:3px solid #ff6f9f;box-shadow:0 0 8px #ff6f9f88",
  fr_lab: "border:3px dashed #8fe8ff", fr_dash: "border:3px dotted #e0a030", fr_royal: "border:4px solid transparent;background:linear-gradient(#222,#222) padding-box,linear-gradient(135deg,#e0b84a,#b03a4a,#6a5ac8) border-box"
};
const BN_CSS = {
  bn_dusk: "linear-gradient(135deg,#6a3a5a,#e98a52)", bn_night: "radial-gradient(circle at 80% 25%,#e8e6c8 0 6%,transparent 7%),linear-gradient(180deg,#0d1230,#2a2f66)", bn_forest: "repeating-linear-gradient(100deg,#1f3a28 0 14px,#2a4d34 14px 26px)",
  bn_ruins: "linear-gradient(180deg,#5a6068,#2a2d32)", bn_lab: "repeating-linear-gradient(0deg,#cfd8dc 0 10px,#b0bec5 10px 11px)", bn_nest: "radial-gradient(circle at 30% 60%,#3a1f3f,transparent 60%),#17101f",
  bn_rain: "repeating-linear-gradient(105deg,#35607a 0 6px,#2a4d66 6px 9px)", bn_gold: "linear-gradient(135deg,#8a5a1a,#f0c060,#8a5a1a)", bn_snow: "radial-gradient(circle at 20% 30%,#fff 0 2px,transparent 3px),radial-gradient(circle at 70% 60%,#fff 0 2px,transparent 3px),linear-gradient(180deg,#7a8a98,#b8c4cc)",
  bn_garden: "linear-gradient(180deg,#27382c,#4c7a4a)", bn_fire: "linear-gradient(0deg,#e0432f,#f0a030 50%,#3a1a10)", bn_aurora: "linear-gradient(120deg,#0d1230,#1fa87a,#6a5ac8,#0d1230)"
};
const bnBg = (id) => BN_CSS[id] || "linear-gradient(135deg,#2a3038,#3a424c)";
const avBg = (id) => { let h = 0; for (const c of String(id || "x")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `linear-gradient(135deg,hsl(${h % 360} 35% 28%),hsl(${(h + 50) % 360} 40% 40%))`; };
const profImgCache = new Map();
async function profImgUrl(uid, v) {
  const k = uid + ":" + v; if (profImgCache.has(k)) return profImgCache.get(k);
  const u = await getDownloadURL(sref(storage, `profile/${uid}.webp`)); profImgCache.set(k, u); return u;
}
// การ์ดโปรไฟล์: card = { name, av, avic, fr, bn, tin, up, uu, hid } — uid ใช้ดึงรูปอัปโหลด
function profCardEl(card, uid, small) {
  const w = mk("div"); w.style.cssText = `position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--panel-2)`;
  const bn = mk("div"); bn.style.cssText = `height:${small ? 56 : 84}px;background:${bnBg(card.bn)}`; w.append(bn);
  const sz = small ? 56 : 76, row = mk("div"); row.style.cssText = `display:flex;gap:12px;align-items:flex-end;padding:0 12px 10px;margin-top:-${sz / 2}px`;
  const av = mk("div"); av.style.cssText = `flex:none;width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:${sz * 0.5}px;background:${avBg(card.av || card.name)};${FR_CSS[card.fr] || FR_CSS.fr_none};box-sizing:border-box`;
  const useUp = card.up && card.uu !== false && !card.hid;
  if (useUp && uid) { av.textContent = card.avic || "🧑"; profImgUrl(uid, card.up.v).then((u) => { const im = document.createElement("img"); im.src = u; im.alt = ""; im.style.cssText = "width:100%;height:100%;object-fit:cover;display:block"; av.textContent = ""; av.append(im); }).catch(() => { /* ใช้อวาตาร์เกมแทน */ }); }
  else av.textContent = card.avic || (card.fac === "zombie" ? "🧟" : "🧑");
  const tx = mk("div"); tx.style.cssText = "min-width:0;padding-top:" + (small ? 18 : 30) + "px";
  const nm = mk("b", "", card.name || "—"); nm.style.cssText = "display:block;font-size:" + (small ? 15 : 17) + "px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
  tx.append(nm, mk("span", "muted", card.tin || (card.fac === "zombie" ? "🧟 ซอมบี้" : "🧑 มนุษย์")));
  row.append(av, tx); w.append(row);
  if (card.hid) w.append(Object.assign(mk("div", "muted", "🚩 รูปนี้ถูกซ่อนชั่วคราว (รอตรวจสอบ)"), { style: "padding:0 12px 10px;font-size:12px" }));
  return w;
}
// ---- หน้าต่างตกแต่งโปรไฟล์ของตัวเอง ----
async function profGo(a, x, ok) {
  if (state.profBusy) return; state.profBusy = true;
  try { const r = await profCall({ a, ...(x || {}) }); state.profD = r; if (ok) ok(r); } catch (e) { toast(fnErr(e)); } finally { state.profBusy = false; try { profRender(); } catch { /* ข้าม */ } }
}
function profOpen() {
  if (!$("pcard-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "pcard-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    const box = mk("div", "modal-box"), top = mk("div", "sheet-top"), head = mk("div", "modal-head"); head.append(mk("h2", "", "🪪 ตกแต่งโปรไฟล์"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini")); top.append(head);
    const body = mk("div", "hub2-body"); body.id = "pcard-body"; body.style.marginTop = "12px"; box.append(top, body); m.append(box); document.body.append(m);
  }
  $("pcard-modal").classList.remove("hidden"); profRender(); profGo("state");
}
function profRender() {
  const body = $("pcard-body"), m = $("pcard-modal"); if (!body || !m || m.classList.contains("hidden")) return; body.innerHTML = "";
  const D = state.profD; if (!D) { body.append(mk("div", "muted", "กำลังโหลด…")); return; }
  const me = state.profile || {}, avs = Object.fromEntries(D.avatars.map((x) => [x.id, x.ic]));
  const card = { name: me.username, fac: me.faction, av: D.cur.av, avic: avs[D.cur.av], fr: D.cur.fr, bn: D.cur.bn, tin: (D.titles.find((x) => x.id === D.cur.ti) || {}).n, up: D.up, uu: D.up ? state.profUU !== false : false, hid: D.hid };
  body.append(profCardEl(card, state.uid));
  const sec = (title, list, key, kind) => {
    const c = mk("div", "world-row"); c.append(mk("b", "", title)); const g = mk("div"); g.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px;margin-top:8px";
    list.forEach((it) => {
      const on = D.cur[key] === it.id, b = mk("button"); b.type = "button"; b.className = "btn mini " + (on ? "primary" : "ghost"); b.style.cssText = "min-height:56px;display:grid;gap:2px;place-items:center;padding:4px;white-space:normal;line-height:1.2;font-size:12px";
      if (kind === "av") b.append(Object.assign(mk("span", "", it.ic), { style: "font-size:24px" })); else if (kind === "fr") { const d = mk("span"); d.style.cssText = `width:26px;height:26px;border-radius:50%;box-sizing:border-box;display:block;${FR_CSS[it.id] || ""}`; b.append(d); } else if (kind === "bn") { const d = mk("span"); d.style.cssText = `width:60px;height:22px;border-radius:5px;display:block;background:${bnBg(it.id)}`; b.append(d); }
      b.append(mk("span", "", it.ok ? it.n : `🔒 ${it.need}`)); if (!it.ok) b.style.opacity = ".55";
      b.addEventListener("click", () => { if (!it.ok) return toast(`🔒 ปลดล็อกด้วย: ${it.need}`); profGo("set", { [key]: it.id }); }); g.append(b);
    }); c.append(g); body.append(c);
  };
  // รูปอัปโหลด
  const up = mk("div", "world-row"); up.append(mk("b", "", "🖼️ รูปของคุณ"), mk("div", "muted", "เลือกรูปอะไรก็ได้จากเครื่อง — ระบบจะย่อ ครอปเป็นสี่เหลี่ยมจัตุรัส ลบข้อมูลตำแหน่ง/กล้อง และแปลงเป็น webp ขนาดไม่เกิน 100 KB ให้เอง • เปลี่ยนได้ชั่วโมงละ 1 ครั้ง • ต้องไม่ผิดกฎ (ผู้เล่นรายงานได้ GM ลบ/แบนได้)"));
  const fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/*"; fi.style.display = "none";
  const upBtn = btn(D.up ? "📤 เปลี่ยนรูป" : "📤 อัปโหลดรูป", () => fi.click(), "btn primary"); upBtn.disabled = D.banned || D.nextUp > 0; upBtn.style.marginTop = "8px";
  if (D.banned) up.append(mk("div", "muted", "บัญชีนี้ถูกจำกัดการอัปโหลดรูป")); else if (D.nextUp > 0) up.append(mk("div", "muted", `เปลี่ยนรูปได้อีกครั้งใน ${passMs(D.nextUp)}`));
  fi.addEventListener("change", async () => {
    const f = fi.files && fi.files[0]; fi.value = ""; if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast("ไฟล์ใหญ่เกิน 10 MB");
    if (f.type && !f.type.startsWith("image/")) return toast("ต้องเป็นไฟล์รูปภาพ");
    if (state.profBusy) return; state.profBusy = true; upBtn.disabled = true; upBtn.textContent = "กำลังอัปโหลดและแปลงรูป…";
    try {
      const tmo = (pr, ms, msg) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error(msg), { csTimeout: true })), ms))]);
      upBtn.textContent = "ขั้น 1/2 กำลังอัปโหลดต้นฉบับ…";
      await tmo(uploadBytes(sref(storage, "raw/" + state.uid), f, { contentType: f.type || "image/jpeg" }), 45000, "อัปโหลดต้นฉบับไปที่ Storage ไม่ตอบสนอง (เกิน 45 วินาที) — Storage อาจยังไม่ได้เปิด/ยังไม่ได้ deploy storage.rules หรือเน็ตช้า");
      upBtn.textContent = "ขั้น 2/2 ระบบกำลังแปลงเป็น webp…";
      const r = await tmo(profCall({ a: "commit" }), 90000, "ฟังก์ชันแปลงรูป (profAct) ไม่ตอบสนอง (เกิน 90 วินาที) — ตรวจว่า deploy functions แล้วและ sharp ติดตั้งสำเร็จ"); state.profD = r; toast(`🖼️ แปลงเป็น webp ${r.up.kb} KB แล้ว`); logLine(`🖼️ เปลี่ยนรูปโปรไฟล์แล้ว (${r.up.kb} KB)`, "system"); profImgCache.clear();
    } catch (e) { console.warn("profile upload", e?.code, e?.message || e); toast(e?.csTimeout ? e.message : String(e?.code || "").includes("storage/") ? `อัปโหลดไม่สำเร็จ (${e.code}) — Storage ยังไม่พร้อม/ไฟล์ไม่ผ่านกติกา` : fnErr(e)); }
    finally { state.profBusy = false; try { profRender(); } catch { /* ข้าม */ } }
  });
  up.append(fi, upBtn);
  if (D.up) {
    up.append(mk("div", "muted", `รูปปัจจุบัน ${D.up.kb} KB (webp)`));
    const row = mk("div"); row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px";
    row.append(btn(state.profUU === false ? "ใช้รูปของฉัน" : "ใช้อวาตาร์เกมแทน", () => { state.profUU = state.profUU === false; profGo("set", { useUp: state.profUU !== false }); }, "btn ghost"), btn("🗑️ ลบรูป", () => { if (confirm("ลบรูปที่อัปโหลด?")) profGo("removeUp", null, () => { profImgCache.clear(); toast("ลบรูปแล้ว"); }); }, "btn ghost"));
    up.append(row);
  }
  body.append(up);
  sec("🙂 อวาตาร์เกม", D.avatars, "av", "av"); sec("⭕ กรอบ", D.frames, "fr", "fr"); sec("🏞️ แบนเนอร์", D.banners, "bn", "bn"); sec("🏅 ฉายา", D.titles, "ti", "ti");
}
// ---- การ์ดของผู้เล่นอื่นในหน้าประวัติ ----
async function profVisitFill(uid) {
  let r; try { r = await profCall({ a: "visit", uid }); } catch { return; }
  if (!r?.ok || $("bio-modal").classList.contains("hidden")) return;
  let h = $("bio-card"); if (h) h.remove(); h = mk("div"); h.id = "bio-card"; h.style.margin = "0 0 8px"; $("bio-text").before(h);
  h.append(profCardEl(r.card, uid));
  const c = r.card;
  if (!r.self && c.up) { const rb = btn(r.reported ? "🚩 รายงานแล้ว" : "🚩 รายงานรูปนี้", () => { rb.disabled = true; profCall({ a: "report", uid }).then((q) => toast(q.hidden ? "🚩 รายงานแล้ว — รูปถูกซ่อนชั่วคราวเพื่อรอตรวจ" : "🚩 รายงานแล้ว ขอบคุณ")).catch((e) => { toast(fnErr(e)); rb.disabled = false; }); }, "btn ghost mini"); rb.disabled = r.reported; rb.style.marginTop = "6px"; h.append(rb); }
  if (r.canGm && c.up !== undefined && (c.up || c.hid)) {
    const g = mk("div"); g.style.cssText = "display:flex;gap:6px;margin-top:6px;flex-wrap:wrap";
    g.append(btn("🗑️ ลบรูป + ห้ามอัปโหลด", () => { if (confirm("ลบรูปนี้และห้ามผู้เล่นอัปโหลดอีก? (แบนบัญชีให้ทำที่หน้า Admin)")) profCall({ a: "gmRemove", uid, mode: "delete" }).then(() => { toast("ลบรูปแล้ว"); profVisitFill(uid); }).catch((e) => toast(fnErr(e))); }, "btn danger mini"), btn("✅ ไม่ผิด (เลิกซ่อน)", () => profCall({ a: "gmRemove", uid, mode: "keep" }).then(() => { toast("เลิกซ่อนแล้ว"); profVisitFill(uid); }).catch((e) => toast(fnErr(e))), "btn ghost mini"));
    h.append(g);
  }
}
// ---- GM: รายการรูปที่ถูกรายงาน (ในหน้า Admin) ----
function profGmSection() {
  if ($("pgm-box")) return; const anchor = $("adm-reset-stats")?.closest(".adm-section"); if (!anchor) return;
  const sec = mk("div", "adm-section"); sec.id = "pgm-box"; sec.append(mk("h3", "", "🖼️ รูปโปรไฟล์ที่ถูกรายงาน"));
  const list = mk("div"); list.style.cssText = "display:grid;gap:6px"; const load = () => { list.innerHTML = ""; list.append(mk("span", "muted", "กำลังโหลด…")); profCall({ a: "gmList" }).then((r) => { list.innerHTML = ""; if (!r.rows.length) list.append(mk("span", "muted", "ไม่มีรายการ")); r.rows.forEach((x) => { const row = mk("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap"; row.append(mk("span", "", `${x.hid ? "🙈" : "👁️"} ${x.name} • รายงาน ${x.n} ครั้ง`), btn("เปิดดู", () => { try { showBio(x.uid, x.name, "human"); } catch { /* ข้าม */ } }, "btn ghost mini")); list.append(row); }); }).catch((e) => { list.innerHTML = ""; list.append(mk("span", "muted", fnErr(e))); }); };
  sec.append(btn("รีเฟรชรายการ", load, "btn ghost mini"), list); anchor.after(sec); load();
}

/* =========================================================
   49.4) 🎲 ศูนย์กิจกรรม — หน้าต่างเดียวรวม 🎟️ ซีซัน • 🎁 รายวัน • 🎲 ผจญภัย • 🔥 เช็กอิน
   มือถือก่อน: เป็นแผ่นเลื่อนขึ้นจากด้านล่าง เปิดจากแท็บ "กิจกรรม" ในแถบล่าง (คอม: ปุ่มบนแถบบน) • จุดแจ้งเตือนรวมจุดเดียว
   ตรรกะของแต่ละแท็บยังอยู่ที่ passRender / actRender / advRender / mwRender เดิม (แค่ย้ายมาแสดงในแผ่นนี้)
   ========================================================= */
const hub2 = { tab: "pass" };
const HUB2_TABS = [["pass", "🎟️", "ซีซัน"], ["act", "🎁", "รายวัน"], ["adv", "🎲", "ผจญภัย"], ["col", "📖", "สะสม"], ["ck", "🔥", "เช็กอิน"]];
const hubOn = (t) => { const m = $("hub2-modal"); return !!m && !m.classList.contains("hidden") && hub2.tab === t; };
function hubTabDot(t) { try { return t === "pass" ? passDot() : t === "act" ? actDot() : t === "adv" ? advDot() : t === "col" ? colDot() : ckUnclaimed().length > 0 || cbPending(); } catch { return false; } }
const hubDot = () => HUB2_TABS.some(([t]) => hubTabDot(t));
function hubBtn() {   // ปุ่มบนแถบบน (คอม) + แท็บล่าง (มือถือ) + จุดในแผ่น
  let b = $("btn-hub2");
  if (!b) { const ref = $("btn-quests") || $("btn-profile"); if (!ref) return; b = btn("🎲 กิจกรรม", () => hubOpen(), "btn ghost mini"); b.id = "btn-hub2"; b.title = "ซีซัน • รายวัน • ผจญภัย • เช็กอิน"; ref.before(b); }
  const d = hubDot(); b.classList.toggle("btn-dot", d); $("tab-hub2")?.classList.toggle("unread", d);
  const m = $("hub2-modal"); if (m && !m.classList.contains("hidden")) m.querySelectorAll(".hub2-tab").forEach((x) => x.classList.toggle("dot", hubTabDot(x.dataset.t)));
}
function hubShow() {
  const m = $("hub2-modal"); if (!m) return;
  m.querySelectorAll(".hub2-tab").forEach((x) => { x.classList.toggle("on", x.dataset.t === hub2.tab); x.classList.toggle("dot", hubTabDot(x.dataset.t)); x.setAttribute("aria-selected", x.dataset.t === hub2.tab); });
  m.querySelectorAll(".hub2-pane").forEach((x) => x.classList.toggle("hidden", x.dataset.t !== hub2.tab));
}
// ---------- 49.48 คาสิโนเถื่อน (functions/casino.js) — โซนสงบ: แลกของ/เลือดเป็นชิป เล่นเกมบ้าน กู้ยืม ร้านแลก ----------
const CS_GAMES = [["slots", "🎰", "สล็อต"], ["roulette", "🎡", "รูเล็ต"], ["sicbo", "🎲", "ไฮโล"], ["baccarat", "🃏", "บาคาร่า"], ["hilo", "⬆️", "สูง-ต่ำ"], ["blackjack", "♠️", "แบล็กแจ็ก"], ["poker", "🂡", "โป๊กเกอร์"]];
const CS_BETS = [5, 10, 25, 50, 100, 250, 500];
const CS_RT = [["red", "🔴 แดง ×2"], ["black", "⚫ ดำ ×2"], ["odd", "คี่ ×2"], ["even", "คู่ ×2"], ["low", "1–18 ×2"], ["high", "19–36 ×2"], ["d1", "1–12 ×3"], ["d2", "13–24 ×3"], ["d3", "25–36 ×3"], ["c1", "แถว 1 ×3"], ["c2", "แถว 2 ×3"], ["c3", "แถว 3 ×3"]];
const CS_HOME = { deco_slotm: "🎰 ตู้สล็อตจิ๋ว (ของตกแต่งห้อง)", deco_dice: "🎲 ลูกเต๋ายักษ์ (ของตกแต่งห้อง)", deco_cards: "🃏 ไพ่โจ๊กเกอร์ (ของตกแต่งห้อง)", deco_chipstack: "🪙 กองชิป (ของตกแต่งห้อง)", theme_casino: "🎰 ธีมห้อง “คาสิโนเถื่อน”" };
const csErr = (e) => { try { return fnErr(e); } catch { return errMsg(e); } };
function casinoBar(z) {
  let b = $("casino-bar"); const on = z === "casino";
  if (!on) { b?.remove(); return; }
  if (!b) { b = mk("div", "casino-bar"); b.id = "casino-bar"; $("zone-desc").after(b); }
  b.innerHTML = ""; b.append(btn("🎰 เข้าสู่บ่อน", () => casinoOpen(), "btn primary"), mk("span", "casino-warn", "⚠️ การพนันไม่เคยทำให้ใครรวย"));
}
function casinoOpen() {
  if (!$("casino-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "casino-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "คาสิโนเถื่อน");
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    const box = mk("div", "modal-box"), top = mk("div", "sheet-top"), head = mk("div", "modal-head"); head.append(mk("h2", "", "🎰 คาสิโนเถื่อน"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini")); top.append(head);
    const warn = mk("div", "casino-warn-strip", "⚠️ การพนันไม่เคยทำให้ใครรวย — เกมทุกเกมเสียเปรียบผู้เล่น เล่นแล้วเสียเป็นเรื่องปกติ ถ้าเริ่มรู้สึกควบคุมไม่ได้ กด “พักตัว”"); top.append(warn);
    const body = mk("div", "hub2-body"); body.id = "casino-body"; body.style.marginTop = "12px"; box.append(top, body); m.append(box); document.body.append(m);
  }
  $("casino-modal").classList.remove("hidden"); state.csTab = state.csTab || "game"; state.csGame = state.csGame || "slots"; state.csBet = state.csBet || 10;
  casinoRender(); casinoGo({ a: "state" });
}
async function casinoGo(data, ok) {
  if (state.csBusy) return; state.csBusy = true; casinoRender();
  try {
    const r = await casinoCall(data); state.csD = Object.assign({}, state.csD || {}, r); state.csRes = r.game ? r : (r.got !== undefined || r.bought || r.loaned || r.repaid || r.rested || r.bled ? r : state.csRes);
    if (r.games) state.csD.games = r.games; if (r.note && r.note.length) r.note.forEach((n) => { if (n.debt) toast(`💸 หนี้ครบกำหนด — ยึดของ ${n.seized.map(([id, q]) => `${ITEMS[id]?.icon || ""}×${q}`).join(" ") || "ไม่มี"}${n.left > 0 ? ` (ยังขาด ${n.left} ชิป)` : ""} และหัก HP`); });
    if (ok) ok(r);
  } catch (e) { toast(csErr(e)); } finally { state.csBusy = false; casinoRender(); }
}
function casinoRender() {
  const body = $("casino-body"), m = $("casino-modal"); if (!body || !m || m.classList.contains("hidden")) return; body.innerHTML = "";
  const D = state.csD; if (!D || D.chips === undefined) { body.append(mk("div", "muted", "กำลังโหลด…")); return; }
  const busy = !!state.csBusy, row = (...c) => { const d = mk("div", "world-row"); c.forEach((x) => x && d.append(x)); return d; };
  const hdr = mk("div", "casino-stat"); hdr.append(mk("b", "", `🪙 ${D.chips} ชิป`), mk("span", "muted", ` • เสียสุทธิวันนี้ ${D.lossToday}/${D.cap}`), mk("span", "muted", D.winCap ? ` • ชนะวันนี้ ${D.winToday || 0}/${D.winCap}` : ""));
  if (D.debt) { const left = Math.max(0, D.debt.due - serverNow()); hdr.append(mk("div", "casino-debt", `💸 หนี้ ${D.debt.a} ชิป • ครบกำหนดใน ${Math.ceil(left / 3600000)} ชม. (ไม่จ่าย = ยึดของในกระเป๋า + หัก HP)`)); }
  if (D.lockLeft > 0) hdr.append(mk("div", "muted", `😴 พักตัวอยู่ อีก ${Math.ceil(D.lockLeft / 3600000)} ชม.`));
  if (D.capLeft <= 0) hdr.append(mk("div", "casino-debt", "วันนี้เสียถึงเพดานแล้ว — พักก่อนนะ"));
  else if (D.winCap && (D.winToday || 0) >= D.winCap) hdr.append(mk("div", "casino-debt", "วันนี้ชนะเกมเดี่ยวครบเพดานแล้ว — พรุ่งนี้ค่อยมาใหม่"));
  body.append(hdr);
  if (!D.inZone) body.append(mk("div", "casino-debt", "ต้องอยู่ที่คาสิโนเถื่อนก่อนถึงจะเล่นได้"));
  const tabs = mk("div", "casino-tabs"); [["game", "🎰 เกม"], ["slave", "🃏 สลาฟ"], ["ex", "💱 แลกชิป"], ["shop", "🛍️ ร้านแลก"], ["more", "⚙️ อื่นๆ"]].forEach(([k, l]) => { const b = btn(l, () => { state.csTab = k; casinoRender(); if (k === "slave") slOpen(); }, "btn mini " + (state.csTab === k ? "primary" : "ghost")); tabs.append(b); }); body.append(tabs);
  const T = state.csTab;
  if (T === "slave") { slRender(body); }
  else if (T === "ex") {
    const inv = Object.values(state.inv || {}).filter((x) => x && D.rates?.[x.id] && x.qty > 0).sort((a, b) => D.rates[b.id] - D.rates[a.id]), c = mk("div", "world-row");
    c.append(mk("b", "", "💱 แลกของเป็นชิป"), mk("div", "muted", `หักค่าธรรมเนียมบ่อน ${Math.round(D.fee * 100)}% • ราคาเป็นชิปต่อชิ้นแสดงข้างของ`));
    const g = mk("div"); g.style.cssText = "display:grid;gap:6px;margin-top:8px";
    if (!inv.length) g.append(mk("div", "muted", "ไม่มีของในกระเป๋าที่บ่อนรับ"));
    inv.forEach((x) => { const r = mk("div"); r.style.cssText = "display:flex;gap:6px;align-items:center"; const l = mk("span", "", `${ITEMS[x.id]?.icon || "📦"} ${ITEMS[x.id]?.name || x.id} ×${x.qty} = ${Math.floor(D.rates[x.id] * (1 - D.fee))}🪙/ชิ้น`); l.style.flex = "1"; r.append(l);
      const b1 = btn("ขาย 1", () => casinoGo({ a: "sell", id: x.id, q: 1 }), "btn ghost mini"), b2 = btn("ทั้งหมด", () => { if (confirm(`แลก ${ITEMS[x.id]?.name || x.id} ×${x.qty} เป็นชิป?`)) casinoGo({ a: "sell", id: x.id, q: Math.min(99, x.qty) }); }, "btn mini"); b1.disabled = b2.disabled = busy; b1.style.minHeight = b2.style.minHeight = "40px"; r.append(b1, b2); g.append(r); });
    c.append(g); body.append(c);
    const bl = mk("div", "world-row"); bl.append(mk("b", "", "🩸 จ่ายด้วยเลือด"), mk("div", "muted", `1 HP = ${D.hpRate} ชิป • วันนี้บริจาคแล้ว ${D.hpToday}/${D.hpMax} HP • ต้องเหลือ HP อย่างน้อย 1`));
    const br = mk("div"); br.style.cssText = "display:flex;gap:6px;margin-top:8px"; [5, 10, 20].forEach((n) => { const b = btn(`−${n} HP`, () => { if (confirm(`ให้เลือด ${n} HP แลก ${n * D.hpRate} ชิป?`)) casinoGo({ a: "blood", n }); }, "btn danger mini"); b.disabled = busy; b.style.minHeight = "44px"; br.append(b); }); bl.append(br); body.append(bl);
    const ln = mk("div", "world-row"); ln.append(mk("b", "", "💸 กู้เงินนอกระบบ"), mk("div", "muted", `กู้ได้ 50–${D.loanMax} ชิป ดอก 25% ต้องคืนใน 48 ชม. ไม่คืน = ยึดของมีค่าน้อยสุดก่อน + หัก HP + ห้ามกู้ 7 วัน`));
    if (D.debt) { const b = btn(`ชำระหนี้ (${D.debt.a} ชิป)`, () => casinoGo({ a: "repay", n: D.debt.a }), "btn primary"); b.disabled = busy || D.chips < 1; b.style.cssText = "margin-top:8px;min-height:44px"; ln.append(b); }
    else if (D.noLoan > 0) ln.append(mk("div", "muted", `ถูกห้ามกู้อีก ${Math.ceil(D.noLoan / 86400000)} วัน`));
    else { const r = mk("div"); r.style.cssText = "display:flex;gap:6px;margin-top:8px"; [100, 250, 500].forEach((n) => { const b = btn(`กู้ ${n}`, () => { if (confirm(`กู้ ${n} ชิป — ต้องคืน ${Math.ceil(n * 1.25)} ชิปใน 48 ชม.\nการพนันไม่เคยทำให้ใครรวย ยืนยัน?`)) casinoGo({ a: "loan", n }); }, "btn ghost mini"); b.disabled = busy; b.style.minHeight = "44px"; r.append(b); }); ln.append(r); }
    body.append(ln);
  } else if (T === "shop") {
    const c = mk("div", "world-row"); c.append(mk("b", "", "🛍️ ร้านแลกชิปเป็นของ"), mk("div", "muted", "โควตาจำกัดต่อวัน • ของตกแต่ง/ธีมห้องหาไม่ได้ที่อื่น"));
    const g = mk("div"); g.style.cssText = "display:grid;gap:6px;margin-top:8px";
    (D.shop || []).forEach((it) => { const r = mk("div"); r.style.cssText = "display:flex;gap:6px;align-items:center"; const home = it.id.startsWith("deco_") || it.id.startsWith("theme_"); const nm = home ? (CS_HOME[it.id] || it.id) : `${ITEMS[it.id]?.icon || "📦"} ${ITEMS[it.id]?.name || it.id}`;
      const l = mk("span", "", `${nm} • ${it.price}🪙 • เหลือ ${it.left}/${it.day}`); l.style.flex = "1"; r.append(l); const b = btn("แลก", () => casinoGo({ a: "buy", id: it.id }), "btn mini"); b.disabled = busy || it.left <= 0 || D.chips < it.price; b.style.minHeight = "40px"; r.append(b); g.append(r); });
    c.append(g); body.append(c);
  } else if (T === "more") {
    const c = mk("div", "world-row"); c.append(mk("b", "", "😴 พักตัว (ห้ามตัวเองเล่น)"), mk("div", "muted", "ถ้ารู้สึกว่าเล่นมากไป ล็อกตัวเองไม่ให้เล่น/แลก/กู้ได้ชั่วคราว ยกเลิกไม่ได้"));
    const r = mk("div"); r.style.cssText = "display:flex;gap:6px;margin-top:8px"; [[24, "พัก 24 ชม."], [168, "พัก 7 วัน"]].forEach(([h, l]) => { const b = btn(l, () => { if (confirm(`ล็อกตัวเอง ${l.slice(4)}? ยกเลิกไม่ได้`)) casinoGo({ a: "rest", h }); }, "btn ghost mini"); b.disabled = busy; b.style.minHeight = "44px"; r.append(b); }); c.append(r); body.append(c);
    body.append(row(mk("b", "", "📋 กติกาของบ่อน"), mk("div", "muted", `เดิมพันครั้งละ ${D.min}–${D.max} ชิป • เสียสุทธิต่อวันไม่เกิน ${D.cap} ชิป • สล็อตคืน ~${D.slotRtp ?? 95}% ในระยะยาว (เสียเปรียบเสมอ) • เกมที่ค้างนาน 10 นาทีถือว่าแพ้ • ห้ามต่อสู้ในบ่อน`)));
  } else {
    const gs = mk("div", "casino-tabs"); CS_GAMES.forEach(([k, ic, n]) => gs.append(btn(`${ic} ${n}`, () => { state.csGame = k; state.csRes = null; casinoRender(); }, "btn mini " + (state.csGame === k ? "primary" : "ghost")))); body.append(gs);
    const g = state.csGame, G = D.games || {}, bet = state.csBet = Math.min(state.csBet || 10, g === "slots" ? (D.slotMax || 100) : D.max), can = D.inZone && !busy && D.lockLeft <= 0 && D.capLeft > 0 && !(D.winCap && (D.winToday || 0) >= D.winCap), panel = mk("div", "world-row");
    const betRow = () => { const r = mk("div", "casino-bets"); CS_BETS.filter((n) => g !== "slots" || n <= (D.slotMax || 100)).forEach((n) => { const b = btn(String(n), () => { state.csBet = n; casinoRender(); }, "btn mini " + (n === bet ? "primary" : "ghost")); b.style.minHeight = "40px"; r.append(b); }); return r; };
    const act = (label, data, cls) => { const b = btn(label, () => casinoGo(data), cls || "btn primary"); b.disabled = !can; b.style.cssText = "min-height:48px;margin-top:8px"; return b; };
    const res = state.csRes && state.csRes.game === g ? state.csRes : null, resTxt = (r) => r.ret !== undefined ? `${r.net > 0 ? "🎉 ชนะ" : r.net === 0 ? "เสมอ" : "💸 แพ้"} • ได้คืน ${r.ret} • สุทธิ ${r.net > 0 ? "+" : ""}${r.net}` : "";
    const show = (r) => { if (!r) return null; const d = mk("div", "casino-res"); d.append(mk("div", "casino-res-main", resTxt(r))); return d; };
    if (g === "slots") {
      panel.append(mk("b", "", "🎰 สล็อต 3 ช่อง"), mk("div", "muted", `ออก 3 ตัวเหมือนกัน ×4 ถึง ×400 • 🍒 ออกก็ได้คืนบางส่วน • เดิมพันสูงสุด ${D.slotMax || 100} ชิป`), betRow());
      const reel = mk("div", "casino-reels"); (res ? res.reels : ["❔", "❔", "❔"]).forEach((x) => reel.append(mk("span", "", x))); panel.append(reel, act(`หมุน (${bet} ชิป)`, { a: "slots", bet }), show(res));
    } else if (g === "roulette") {
      const L = state.csRL = state.csRL || []; panel.append(mk("b", "", "🎡 รูเล็ต (0 เจ้ามือกิน)"), mk("div", "muted", "แตะเพื่อวางชิปครั้งละ 1 ก้อน (สูงสุด 8 ช่อง รวมไม่เกิน 500) • เลขตรง ×36"), betRow());
      const g1 = mk("div", "casino-grid"); CS_RT.forEach(([t, l]) => { const n = L.filter((x) => x.t === t).reduce((s, x) => s + x.a, 0); const b = btn(n ? `${l} • ${n}` : l, () => { const e = L.find((x) => x.t === t); if (e) e.a += bet; else if (L.length < 8) L.push({ t, a: bet }); casinoRender(); }, "btn mini " + (n ? "primary" : "ghost")); b.style.minHeight = "40px"; g1.append(b); }); panel.append(g1);
      const sel = document.createElement("select"); sel.style.cssText = "min-height:40px;margin-top:6px"; for (let i = 0; i <= 36; i++) { const o = document.createElement("option"); o.value = i; o.textContent = "เลข " + i; sel.append(o); } const addN = btn("＋เลขตรง", () => { if (L.length < 8) { L.push({ t: "num", n: Number(sel.value), a: bet }); casinoRender(); } }, "btn ghost mini"); addN.style.minHeight = "40px"; const nr = mk("div"); nr.style.cssText = "display:flex;gap:6px;margin-top:6px"; nr.append(sel, addN); panel.append(nr);
      const tot = L.reduce((s, x) => s + x.a, 0); panel.append(mk("div", "muted", L.length ? `วางไว้: ${L.map((x) => (x.t === "num" ? "เลข" + x.n : x.t) + " " + x.a).join(" • ")} (รวม ${tot})` : "ยังไม่ได้วาง"));
      const sp = act(`หมุน (${tot} ชิป)`, { a: "roulette", bets: L.map((x) => ({ t: x.t, n: x.n, a: x.a })) }); sp.disabled = !can || !L.length || tot > D.max; sp.addEventListener("click", () => { state.csRL = []; }); const cl = btn("ล้าง", () => { state.csRL = []; casinoRender(); }, "btn ghost mini"); cl.style.cssText = "min-height:44px;margin:8px 0 0 6px"; panel.append(sp, cl);
      if (res) { const d = show(res); d.prepend(mk("div", "casino-res-n", `${res.red ? "🔴" : res.n === 0 ? "🟢" : "⚫"} ${res.n}`)); panel.append(d); }
    } else if (g === "sicbo") {
      const L = state.csSL = state.csSL || []; panel.append(mk("b", "", "🎲 ไฮโล (สามลูกเต๋า)"), mk("div", "muted", "สูง(11–17)/ต่ำ(4–10) ×2 (ตอง = เจ้ามือกิน) • ทายเลข: ออก 1 ลูก ×2 / 2 ลูก ×3 / 3 ลูก ×4"), betRow());
      const g1 = mk("div", "casino-grid"); [["big", "สูง"], ["small", "ต่ำ"], ...[1, 2, 3, 4, 5, 6].map((n) => ["num" + n, "⚀⚁⚂⚃⚄⚅"[n - 1] + " " + n])].forEach(([t, l]) => { const key = t.startsWith("num") ? "num" : t, nn = t.startsWith("num") ? Number(t.slice(3)) : undefined; const n = L.filter((x) => x.t === key && x.n === nn).reduce((s, x) => s + x.a, 0); const b = btn(n ? `${l} • ${n}` : l, () => { const e = L.find((x) => x.t === key && x.n === nn); if (e) e.a += bet; else if (L.length < 8) L.push({ t: key, n: nn, a: bet }); casinoRender(); }, "btn mini " + (n ? "primary" : "ghost")); b.style.minHeight = "40px"; g1.append(b); }); panel.append(g1);
      const tot = L.reduce((s, x) => s + x.a, 0); panel.append(mk("div", "muted", L.length ? `รวม ${tot} ชิป` : "ยังไม่ได้วาง")); const sp = act(`ทอย (${tot} ชิป)`, { a: "sicbo", bets: L.map((x) => ({ t: x.t, n: x.n, a: x.a })) }); sp.disabled = !can || !L.length || tot > D.max; sp.addEventListener("click", () => { state.csSL = []; }); const cl = btn("ล้าง", () => { state.csSL = []; casinoRender(); }, "btn ghost mini"); cl.style.cssText = "min-height:44px;margin:8px 0 0 6px"; panel.append(sp, cl);
      if (res) { const d = show(res); d.prepend(mk("div", "casino-res-n", `${res.dice.map((x) => "⚀⚁⚂⚃⚄⚅"[x - 1]).join(" ")} = ${res.sum}`)); panel.append(d); }
    } else if (g === "baccarat") {
      const sd = state.csSide = state.csSide || "player"; panel.append(mk("b", "", "🃏 บาคาร่า"), mk("div", "muted", "ผู้เล่น ×2 • เจ้ามือ ×1.95 • เสมอ ×9 (ผู้เล่น/เจ้ามือคืนทุนเมื่อเสมอ)"), betRow());
      const sr = mk("div", "casino-tabs"); [["player", "👤 ผู้เล่น"], ["banker", "🏦 เจ้ามือ"], ["tie", "🤝 เสมอ"]].forEach(([k, l]) => sr.append(btn(l, () => { state.csSide = k; casinoRender(); }, "btn mini " + (sd === k ? "primary" : "ghost")))); panel.append(sr, act(`แจกไพ่ (${bet} ชิป)`, { a: "baccarat", bet, side: sd }));
      if (res) { const d = show(res); d.prepend(mk("div", "casino-res-n", `👤 ${res.P.join(" ")} = ${res.p}  |  🏦 ${res.B.join(" ")} = ${res.b}  → ${res.win === "tie" ? "เสมอ" : res.win === "player" ? "ผู้เล่นชนะ" : "เจ้ามือชนะ"}`)); panel.append(d); }
    } else if (g === "hilo") {
      panel.append(mk("b", "", "⬆️ สูง–ต่ำ"), mk("div", "muted", "ทายว่าไพ่ใบถัดไปสูงกว่าหรือต่ำกว่า (A ต่ำสุด K สูงสุด) • ค่าจ่ายขึ้นกับโอกาส • เท่ากัน = คืนทุน"));
      if (G.hl) { panel.append(mk("div", "casino-res-n", `ไพ่ตอนนี้: ${G.hl.card} (เดิมพัน ${G.hl.bet})`)); const r = mk("div", "casino-tabs"); const hi = btn(`⬆️ สูงกว่า`, () => casinoGo({ a: "hilo", act: "guess", guess: "hi" }), "btn primary"), lo = btn(`⬇️ ต่ำกว่า`, () => casinoGo({ a: "hilo", act: "guess", guess: "lo" }), "btn primary"); hi.disabled = lo.disabled = busy; hi.style.minHeight = lo.style.minHeight = "48px"; r.append(hi, lo); panel.append(r); }
      else { panel.append(betRow(), act(`เริ่ม (${bet} ชิป)`, { a: "hilo", act: "start", bet })); if (res) { const d = show(res); d.prepend(mk("div", "casino-res-n", `${res.card1} → ${res.card2} (${res.tie ? "เท่ากัน" : res.win ? "ทายถูก" : "ทายผิด"} ×${res.mult})`)); panel.append(d); } }
    } else if (g === "blackjack") {
      panel.append(mk("b", "", "♠️ แบล็กแจ็ก"), mk("div", "muted", "เจ้ามือหยุดที่ 17 • ชนะ ×2 • แบล็กแจ็กธรรมชาติ ×2.2 • ดับเบิลได้เฉพาะตาแรก"));
      if (G.bj) { panel.append(mk("div", "casino-res-n", `คุณ: ${G.bj.you.join(" ")} = ${G.bj.yv}   เจ้ามือ: ${G.bj.dealer.join(" ")}`)); const r = mk("div", "casino-tabs"); [["hit", "➕ ขอไพ่"], ["stand", "✋ พอแล้ว"], ["double", "✖️2 ดับเบิล"]].forEach(([k, l]) => { const b = btn(l, () => casinoGo({ a: "blackjack", act: k }), "btn primary"); b.disabled = busy || (k === "double" && (!G.bj.can.dbl || D.chips < G.bj.bet)); b.style.minHeight = "48px"; r.append(b); }); panel.append(r); }
      else { panel.append(betRow(), act(`เริ่ม (${bet} ชิป)`, { a: "blackjack", act: "start", bet })); if (res && res.you) { const d = show(res); d.prepend(mk("div", "casino-res-n", `คุณ: ${res.you.join(" ")} = ${res.yv}   เจ้ามือ: ${(res.dealer || []).join(" ")}${res.dv !== undefined ? " = " + res.dv : ""}`)); panel.append(d); } }
    } else if (g === "poker") {
      panel.append(mk("b", "", "🂡 วิดีโอโป๊กเกอร์ (Jacks or Better)"), mk("div", "muted", "แจก 5 ใบ เลือกใบที่เก็บไว้ แล้วจั่วใหม่ • คู่ J+ ×1 • สองคู่ ×2 • สามใบ ×3 • สเตรท ×4 • ฟลัช ×5 • ฟูลเฮาส์ ×7 • โฟร์ ×25 • สเตรทฟลัช ×50 • รอยัล ×250"));
      if (G.vp) { const hold = state.csHold = state.csHold || [false, false, false, false, false]; const r = mk("div", "casino-cards"); G.vp.hand.forEach((c, i) => { const b = btn(c, () => { hold[i] = !hold[i]; casinoRender(); }, "btn mini casino-card " + (hold[i] ? "primary" : "ghost")); b.style.cssText = "min-height:64px;font-size:20px"; r.append(b); }); panel.append(r, mk("div", "muted", "แตะไพ่ที่ต้องการเก็บ"), act("จั่ว", { a: "poker", act: "draw", hold: hold.map((h, i) => (h ? i : -1)).filter((i) => i >= 0) }));
        panel.lastChild.addEventListener("click", () => { state.csHold = null; }); }
      else { state.csHold = null; panel.append(betRow(), act(`แจกไพ่ (${bet} ชิป)`, { a: "poker", act: "deal", bet })); if (res && res.hand) { const d = show(res); d.prepend(mk("div", "casino-res-n", `${res.hand.join(" ")} — ${res.kindTh}`)); panel.append(d); } }
    }
    body.append(panel);
  }
}
// ---------- 49.49 โต๊ะสลาฟ (functions/slave.js) — ผู้เล่นหลายคนในคาสิโนเถื่อน ----------
const SL_R = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"], SL_S = ["♣", "♦", "♥", "♠"], SL_TURN = 30000;
const slTxt = (c) => SL_R[c >> 2] + SL_S[c & 3], slRed = (c) => (c & 3) === 1 || (c & 3) === 2;
const slCombo = (cs) => { if (!cs.length || cs.length > 4) return null; const v = cs[0] >> 2; return cs.every((c) => (c >> 2) === v) ? { n: cs.length, top: Math.max(...cs) } : null; };
const slSt = () => (state.sl = state.sl || { sel: [], tab: "lobby", list: null, tid: null, pub: null, hand: [], busy: false });
function slStop() { const S = slSt(); (S.unsub || []).forEach((f) => { try { f(); } catch { /* ข้าม */ } }); S.unsub = []; clearInterval(S.timer); S.timer = null; }
function slListen(tid) {
  const S = slSt(); if (S.lt === tid) return; slStop(); S.lt = tid;
  S.unsub = [onValue(ref(db, "cpub/" + tid), (s) => { S.pub = s.val(); if (!S.pub) { S.tid = null; S.lt = null; slStop(); } S.sel = []; casinoRender(); }, () => {}),
    onValue(ref(db, `chand/${tid}/${state.uid}`), (s) => { const v = s.val(); S.hand = Array.isArray(v) ? v : v ? Object.values(v) : []; S.sel = S.sel.filter((c) => S.hand.includes(c)); casinoRender(); }, () => {})];
  S.timer = setInterval(() => { const m = $("casino-modal"); if (!m || m.classList.contains("hidden")) return; slTimerTick(); }, 1000);
}
function slTimerTick() {
  const S = slSt(), p = S.pub; if (!p) return; const el = $("sl-timer");
  if (el && p.dl && (p.st === "play" || p.st === "xchg")) { const left = Math.max(0, Math.ceil((p.dl - serverNow()) / 1000)); el.textContent = `⏱ ${left} วิ`; el.classList.toggle("sl-late", left <= 8); }
  if (p.dl && (p.st === "play" || p.st === "xchg") && serverNow() > p.dl + 1500 && !S.busy && serverNow() - (S.lastTick || 0) > 6000) { S.lastTick = serverNow(); slGo({ a: "tick", tid: S.tid }, true); }
}
async function slGo(data, quiet) {
  const S = slSt(); if (S.busy) return; S.busy = true; if (!quiet) casinoRender();
  try {
    let r; try { r = await slaveCall(data); } catch (e) { if (e?.code === "functions/aborted") { await new Promise((x) => setTimeout(x, 400)); r = await slaveCall(data); } else throw e; }
    if (r.tables) { S.list = r; if (r.mine && !S.tid) { S.tid = r.mine; slListen(r.mine); } }
    if (r.tid) { S.tid = r.tid; S.pub = r.pub; S.hand = r.hand || S.hand; slListen(r.tid); }
    if (r.none || r.left) { S.tid = null; S.pub = null; S.hand = []; S.lt = null; slStop(); S.list = null; S.needList = true; }
    if (r.warn) toast(r.warn);
    if (data.a === "play" || data.a === "give") S.sel = [];
  } catch (e) { toast(csErr(e)); } finally { S.busy = false; casinoRender(); if (S.needList) { S.needList = false; slGo({ a: "list" }); } }
}
function slOpen() { const S = slSt(); if (S.tid) slGo({ a: "state", tid: S.tid }); else slGo({ a: "list" }); }
function slCard(c, on, fn) { const b = mk("button", "sl-card" + (slRed(c) ? " red" : "") + (on ? " sel" : ""), slTxt(c)); b.type = "button"; if (fn) b.addEventListener("click", fn); else b.disabled = true; return b; }
function slRender(body) {
  const S = slSt(), D = state.csD || {}, busy = S.busy, p = S.pub;
  if (!p || !S.tid) {   // ล็อบบี้
    const c = mk("div", "world-row"); c.append(mk("b", "", "🃏 โต๊ะสลาฟ (3–4 คน)"), mk("div", "muted", "ไพ่ 52 ใบ 3 รอบ • ลงเดี่ยว/คู่/ตอง/โฟร์ ต้องชนิดเดียวกันและสูงกว่า • ไพ่หมดก่อน = King, หมดท้ายสุด = Slave • รอบถัดไป Slave ให้ไพ่แรงสุด 2 ใบกับ King และ King คืน 2 ใบ • อันดับ 1 ได้ 60% ของกอง อันดับ 2 ได้ 30% บ่อนเก็บ 10% • ชนะสุทธิได้ไม่เกิน 3,000 ชิป/วัน"));
    const f = state.slForm = state.slForm || { ante: 25, seats: 4 }, row = mk("div", "casino-bets"); [10, 25, 50, 100, 250].forEach((n) => { const b = btn(String(n), () => { f.ante = n; casinoRender(); }, "btn mini " + (f.ante === n ? "primary" : "ghost")); b.style.minHeight = "40px"; row.append(b); });
    const sr = mk("div", "casino-tabs"); [3, 4].forEach((n) => sr.append(btn(`${n} คน`, () => { f.seats = n; casinoRender(); }, "btn mini " + (f.seats === n ? "primary" : "ghost"))));
    const cr = btn(`➕ สร้างโต๊ะ (ค่าเข้า ${f.ante} ชิป)`, () => slGo({ a: "create", ante: f.ante, seats: f.seats }), "btn primary"); cr.disabled = busy || !D.inZone; cr.style.cssText = "min-height:48px;margin-top:8px";
    c.append(mk("div", "muted", "ค่าเข้าโต๊ะ:"), row, sr, cr); body.append(c);
    const L = mk("div", "world-row"); L.append(mk("b", "", "โต๊ะที่รอผู้เล่น"), btn("🔄 รีเฟรช", () => slGo({ a: "list" }), "btn ghost mini")); const g = mk("div"); g.style.cssText = "display:grid;gap:6px;margin-top:8px";
    const tb = (S.list && S.list.tables) || []; if (!S.list) g.append(mk("div", "muted", "กำลังโหลด…")); else if (!tb.length) g.append(mk("div", "muted", "ยังไม่มีโต๊ะ — สร้างโต๊ะแล้วรอเพื่อนมานั่ง"));
    tb.forEach((t) => { const r = mk("div"); r.style.cssText = "display:flex;gap:6px;align-items:center"; const l = mk("span", "", `🪙${t.ante} • ${t.seats.length}/${t.max} • ${t.seats.join(", ")}`); l.style.flex = "1"; const j = btn("นั่ง", () => slGo({ a: "join", tid: t.id }), "btn mini"); j.disabled = busy || !D.inZone; j.style.minHeight = "44px"; r.append(l, j); g.append(r); });
    L.append(g); body.append(L); return;
  }
  const me = state.uid, my = p.seats.find((s) => s.u === me), pot = p.ante * p.seats.length;
  const head = mk("div", "world-row"); head.append(mk("b", "", `🃏 รอบ ${Math.max(1, p.rd)}/${p.rounds} • ค่าเข้า ${p.ante} • กอง ${pot}`), mk("div", "muted", p.st === "wait" ? "รอผู้เล่น (ต้องมีอย่างน้อย 3 คน)" : p.st === "fin" ? "จบเกม" : p.st === "xchg" ? "แลกไพ่: Slave ให้ไพ่แรงสุด 2 ใบ King เลือก 2 ใบคืน" : "กำลังเล่น")); body.append(head);
  const seats = mk("div", "sl-seats"); p.seats.forEach((s) => { const d = mk("div", "sl-seat" + (p.turn === s.u && (p.st === "play" || p.st === "xchg") ? " turn" : "") + (s.u === me ? " me" : "")); const tag = s.dq ? "⛔" : s.o ? ["🥇", "🥈", "🥉", "💩"][s.o - 1] || s.o : s.p ? "⏭" : ""; d.append(mk("b", "", `${tag} ${s.n}`), mk("span", "muted", p.st === "wait" ? "" : `ไพ่ ${s.c} • ${s.pt >= 0 ? "+" : ""}${s.pt}`)); seats.append(d); }); body.append(seats);
  if (p.st === "wait") {
    const r = mk("div", "casino-tabs"); if (p.ow === me) { const st = btn("▶️ เริ่มเกม", () => slGo({ a: "start", tid: S.tid }), "btn primary"); st.disabled = busy || p.seats.length < 3; st.style.minHeight = "48px"; r.append(st); }
    const lv = btn("ออก (คืนค่าเข้า)", () => slGo({ a: "leave", tid: S.tid }), "btn ghost"); lv.disabled = busy; lv.style.minHeight = "48px"; r.append(lv); body.append(r); return;
  }
  if (p.st === "fin") {
    const res = p.res || { rank: [] }, c = mk("div", "casino-res"); c.append(mk("div", "casino-res-main", "🏁 ผลสุดท้าย")); res.rank.forEach((x, i) => c.append(mk("div", "", `${["🥇", "🥈", "🥉", "4️⃣"][i]} ${x.n}${x.u === me ? " (คุณ)" : ""} • ${x.pt >= 0 ? "+" : ""}${x.pt} แต้ม • ${x.pay} ชิป (${x.net >= 0 ? "+" : ""}${x.net})${x.dq ? " ⛔หลุด" : ""}`)));
    c.append(mk("div", "muted", `ค่าบ่อน ${res.fee || 0} ชิป`)); body.append(c);
    const b = btn("กลับล็อบบี้", () => { S.tid = null; S.pub = null; S.hand = []; S.lt = null; slStop(); S.list = null; slGo({ a: "leave", tid: p.id }); }, "btn primary"); b.style.cssText = "min-height:48px;margin-top:8px"; body.append(b); return;
  }
  // กองกลาง
  const mid = mk("div", "sl-mid"); const lastBy = p.last && p.seats.find((s) => s.u === p.last.u);
  mid.append(mk("div", "muted", p.last ? `${lastBy ? lastBy.n : "?"} ลง:` : p.st === "xchg" ? "ช่วงแลกไพ่" : "กองว่าง — ผู้เล่นที่ได้เทิร์นเปิดกอง")); const lc = mk("div", "sl-lastcards"); (p.last ? p.last.c : []).forEach((c) => lc.append(slCard(c, false))); mid.append(lc);
  const tm = mk("div", "sl-timer", "⏱"); tm.id = "sl-timer"; mid.append(tm); body.append(mid); setTimeout(slTimerTick, 0);
  const myTurn = p.turn === me, king = p.xc && p.xc.k === me, sel = S.sel;
  if (p.st === "xchg") {
    if (p.xc) { const x = mk("div", "muted", `${(p.seats.find((s) => s.u === p.xc.s) || {}).n} (Slave) ให้ ${(p.seats.find((s) => s.u === p.xc.k) || {}).n} (King): ${p.xc.g.map(slTxt).join(" ")}`); body.append(x); }
  }
  const hr = mk("div", "sl-hand"); S.hand.forEach((c) => hr.append(slCard(c, sel.includes(c), () => { const i = sel.indexOf(c); if (i >= 0) sel.splice(i, 1); else if (sel.length < 4) sel.push(c); casinoRender(); }))); body.append(hr);
  if (!my || my.dq) { body.append(mk("div", "casino-debt", "คุณหลุดจากโต๊ะนี้แล้ว (ริบค่าเข้า)")); const lb = btn("ปิดโต๊ะ", () => { S.tid = null; S.pub = null; S.lt = null; slStop(); S.list = null; slGo({ a: "list" }); }, "btn ghost"); body.append(lb); return; }
  const ctl = mk("div", "casino-tabs");
  if (p.st === "xchg") {
    if (king) { const b = btn(`ส่งคืน 2 ใบ (${sel.length}/2)`, () => slGo({ a: "give", tid: S.tid, cards: sel.slice() }), "btn primary"); b.disabled = busy || sel.length !== 2; b.style.minHeight = "48px"; ctl.append(b); } else ctl.append(mk("div", "muted", "รอ King เลือกไพ่คืน…"));
  } else {
    const cb = slCombo(sel), lcb = p.last && slCombo(p.last.c), okPlay = myTurn && cb && (!lcb || (cb.n === lcb.n && cb.top > lcb.top)) && (!p.first || sel.includes(S.hand[0]));
    const pl = btn(sel.length ? `ลง ${sel.slice().sort((a, b) => a - b).map(slTxt).join(" ")}` : "ลง", () => slGo({ a: "play", tid: S.tid, cards: sel.slice() }), "btn primary"), ps = btn("ผ่าน", () => slGo({ a: "pass", tid: S.tid }), "btn ghost");
    pl.disabled = busy || !okPlay; ps.disabled = busy || !myTurn || !p.last; pl.style.minHeight = ps.style.minHeight = "52px"; ctl.append(pl, ps);
    if (!myTurn) ctl.append(mk("div", "muted", "รอเทิร์น…"));
  }
  const lv = btn("ยอมแพ้/ออก (ริบค่าเข้า)", () => { if (confirm("ออกกลางเกมจะเสียค่าเข้าโต๊ะ ยืนยัน?")) slGo({ a: "leave", tid: S.tid }); }, "btn ghost mini"); lv.disabled = busy; ctl.append(lv); body.append(ctl);
}
function hubOpen(tab) {
  if (tab) hub2.tab = tab;
  if (!$("hub2-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "hub2-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "ศูนย์กิจกรรม");
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });   // แตะนอกแผ่นเพื่อปิด
    const box = mk("div", "modal-box hub");
    const top = mk("div", "sheet-top"), head = mk("div", "modal-head"); head.append(mk("h2", "", "🎲 ศูนย์กิจกรรม"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const tabs = mk("div", "hub2-tabs"); tabs.setAttribute("role", "tablist");
    HUB2_TABS.forEach(([t, ic, l]) => { const b = mk("button", "hub2-tab"); b.type = "button"; b.dataset.t = t; b.setAttribute("role", "tab"); b.append(mk("span", "ti", ic), document.createTextNode(l)); b.addEventListener("click", () => hubOpen(t)); tabs.append(b); });
    top.append(head, tabs);
    const pane = (t, ...kids) => { const d = mk("div", "hub2-pane hidden"); d.dataset.t = t; kids.forEach((k) => d.append(k)); return d; };
    const body = (id) => { const d = mk("div", "hub2-body"); d.id = id; return d; }, sub = (id) => { const d = mk("div", "subtabs"); d.id = id; return d; };
    box.append(top, pane("pass", body("pass-body")), pane("act", sub("act-tabs"), body("act-body")), pane("adv", sub("adv-tabs"), body("adv-body")), pane("col", body("col-body")), pane("ck", body("mw-body")));
    m.append(box); document.body.append(m);
  }
  $("hub2-modal").classList.remove("hidden"); hubShow();
  const t = hub2.tab;
  if (t === "pass") { passRender(); passKick(); } else if (t === "act") { actRender(); actRefresh(); } else if (t === "adv") { advRender(); advRefresh(); } else if (t === "col") { colRender(); colKick(); } else mwRender();
}

/* =========================================================
   49.5) 🎟️ ภารกิจซีซัน (Season Pass) + 🎭 เหตุการณ์สุ่มแบบเลือกทาง
   ทั้งสองระบบทำงานผ่าน Cloud Functions (passAct / eventAct — functions/pass.js, functions/events.js) ไม่แตะ rules
   - Season Pass: ภารกิจรายวัน 3 + รายสัปดาห์ 4 นับจากตัวนับความสำเร็จเดิม → XP → รางวัล 30 ระดับ รีเซ็ตทุกซีซัน (28 วัน)
   - เหตุการณ์สุ่ม: หลังค้นหานอก Safe Zone มีโอกาสเจอสถานการณ์ให้เลือกทาง (เซิร์ฟเวอร์ทอยผล • HP ไม่ลดต่ำกว่า 1)
   ========================================================= */
function fnErr(e) {
  const c = String(e?.code || "");
  if (c.startsWith("functions/")) return /internal|unavailable|deadline|unknown/.test(c) ? "เซิร์ฟเวอร์ไม่ตอบสนอง ลองใหม่อีกครั้ง" : (e.message || "ทำรายการไม่สำเร็จ");
  return "ทำรายการไม่สำเร็จ";
}
const passMs = (t) => { const s = Math.max(0, Math.floor(t / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d} วัน ${h} ชม.` : h ? `${h} ชม. ${m} นาที` : `${m} นาที`; };
function passDot() { const P = state.pass; if (!P) return false; return [...P.d, ...P.w].some((m) => m.done && !m.got) || (P.rew || []).some((_, i) => P.xp >= (i + 1) * P.tierXp && !P.tc[i + 1]); }
async function passSync(a = { a: "sync" }) {
  try { await achFlush(); } catch { /* ข้าม */ }
  const r = await passCall(a); state.pass = r; state.passAt = Date.now(); return r;
}
function passTick() {
  if (!state.profile || !state.ach?.loaded) return;
  const now = Date.now();
  if (!state.passAt && !state.passBusy || (state.passAt && now - state.passAt > 300000 && !document.hidden && !state.passBusy)) {
    state.passAt = now; state.passBusy = true;
    passSync().catch(() => { /* ข้าม */ }).finally(() => { state.passBusy = false; try { passBtn(); passRender(); } catch { /* ข้าม */ } });
  }
  if (!state.encPeeked) {   // กลับเข้าเกมแล้วมีเหตุการณ์ค้างอยู่ → เด้งให้ตัดสินใจต่อ
    state.encPeeked = true;
    eventCall({ a: "peek" }).then((r) => { if (r.enc) encShow(r.enc); }).catch(() => { /* ข้าม */ });
  }
  passBtn();
}
function passBtn() { hubBtn(); }
function passOpen() { hubOpen("pass"); }
function passKick() {
  if (!state.passBusy) { state.passBusy = true; passSync().catch((e) => toast(fnErr(e))).finally(() => { state.passBusy = false; passBtn(); passRender(); }); }
}
function passRender() {
  const body = $("pass-body"); if (!body || !hubOn("pass")) return; body.innerHTML = "";
  const P = state.pass, card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; };
  const d = seaDef(); if (!P) { card().append(mk("div", "muted", "กำลังโหลด…")); return; }
  const tier = Math.min(P.tiers, Math.floor(P.xp / P.tierXp)), inTier = P.xp % P.tierXp;
  const h = card(); h.append(mk("div", "", `${d.icon} ${d.name} • ระดับ ${tier}/${P.tiers} • XP ${P.xp}`), mk("div", "muted", tier >= P.tiers ? "ปลดรางวัลครบทุกระดับแล้ว 🎉" : `อีก ${P.tierXp - inTier} XP ถึงระดับ ${tier + 1}`));
  { const bar = mk("div"); bar.style.cssText = "height:8px;border-radius:4px;background:var(--panel-2,#1c2128);margin:6px 0;overflow:hidden"; const i = mk("div"); i.style.cssText = `height:100%;width:${tier >= P.tiers ? 100 : inTier}%;background:var(--accent,#e0a030)`; bar.append(i); h.append(bar); }
  h.append(mk("div", "muted", `ซีซันนี้เหลือ ${passMs(P.sEnd - serverNow())} • ภารกิจนับจากตอนที่เปิดภารกิจครั้งแรกของวัน/สัปดาห์ — รางวัลที่ไม่กดรับก่อนซีซันจบจะหายไป`));
  const sect = (title, list, kind, end) => {
    const c = card(); c.append(mk("div", "", `${title} • รีเซ็ตใน ${passMs(end - serverNow())}`));
    list.forEach((x) => {
      const r = mk("div"); r.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px";
      const t = mk("div", x.got ? "muted" : "", `${x.got ? "✅" : x.done ? "🎯" : "⬜"} ${x.t} — ${x.v}/${x.n} (+${x.xp} XP)`);
      r.append(t); if (x.done && !x.got) r.append(btn("รับ XP", () => passClaim({ a: "claimMission", p: kind, id: x.id }), "btn primary mini"));
      c.append(r);
    });
  };
  sect("📅 ภารกิจวันนี้", P.d, "d", P.dEnd); sect("🗓️ ภารกิจสัปดาห์นี้", P.w, "w", P.wEnd);
  const tc = card(); tc.append(mk("div", "", "🎁 รางวัลตามระดับ"));
  P.rew.forEach((rw, i) => {
    const t = i + 1, got = !!P.tc[t], ok = P.xp >= t * P.tierXp, r = mk("div"); r.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:5px";
    r.append(mk("div", got ? "muted" : ok ? "" : "muted", `${got ? "✅" : ok ? "🎯" : "🔒"} ระดับ ${t}: ${mRew(rw)}`));
    if (ok && !got) r.append(btn("รับ", () => passClaim({ a: "claimTier", t }), "btn primary mini"));
    tc.append(r);
  });
}
async function passClaim(a) {
  if (state.passBusy) return; state.passBusy = true;
  try {
    const r = await passSync(a);
    if (r.rewarded) { toast(`🎁 ได้รับ ${mRew(r.rewarded)}`); logLine(`🎟️ รับรางวัลซีซัน: ${mRew(r.rewarded)}`, "system"); try { sfx("boss"); } catch { /* ข้าม */ } }
    else toast("🎟️ ได้รับ XP แล้ว");
  } catch (e) { toast(fnErr(e)); try { await passSync(); } catch { /* ข้าม */ } }
  finally { state.passBusy = false; passBtn(); passRender(); }
}

// ---- เหตุการณ์สุ่ม ----
function encAfterSearch() {
  if (state.encBusy || state.enc || !state.profile || state.profile.hp <= 0 || isPeace(state.zone) || state.boss) return;
  state.encBusy = true;
  eventCall({ a: "roll" }).then((r) => { if (r.enc) encShow(r.enc); }).catch(() => { /* ข้าม: ไม่ให้กระทบการค้นหา */ }).finally(() => { state.encBusy = false; });
}
const encHave = (id) => Object.values(state.inv || {}).filter((x) => x && x.id === id).reduce((s, x) => s + (x.qty || 0), 0);
function encShow(enc) {
  if (!enc || state.boss || document.querySelector(".modal:not(.hidden):not(#enc-modal)")) return;   // ชนกับหน้าต่างอื่น → ปล่อยไว้ (เซิร์ฟเวอร์เก็บไว้ 30 นาที ค้นหาครั้งหน้าจะเด้งใหม่)
  state.enc = enc;
  if (!$("enc-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "enc-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "440px";
    const head = mk("div", "modal-head"); head.append(mk("h2", "")); head.firstChild.id = "enc-title";
    const body = mk("div"); body.id = "enc-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.6";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("enc-title").textContent = `🎭 ${enc.t}`;
  const body = $("enc-body"); body.innerHTML = ""; body.append(mk("div", "", enc.d));
  enc.o.forEach((o) => {
    const need = o.need, lack = need && encHave(need[0]) < need[1];
    const b = btn(o.l + (lack ? " — ของไม่พอ" : ""), () => encChoose(o.i), "btn primary"); b.disabled = !!lack; b.style.textAlign = "left"; body.append(b);
  });
  $("enc-modal").classList.remove("hidden");
}
async function encChoose(i) {
  if (state.encBusy) return; state.encBusy = true;
  const body = $("enc-body"); body.querySelectorAll("button").forEach((b) => { b.disabled = true; });
  try {
    const r = await eventCall({ a: "choose", i });
    achBump("enc"); state.enc = null;
    body.innerHTML = "";
    const lines = [r.x]; if (r.paid) lines.push(`ใช้ ${mRew([r.paid])}`);
    if (r.hp) lines.push(r.hp > 0 ? `❤️ ฟื้น +${r.hp} HP` : `💔 เสีย ${-r.hp} HP`);
    if (r.got && r.got.length) lines.push(`🎒 ได้ ${mRew(r.got)}`);
    body.append(mk("div", "", lines[0])); lines.slice(1).forEach((t) => body.append(mk("div", "muted", t)));
    body.append(btn("ตกลง", () => $("enc-modal").classList.add("hidden"), "btn ghost"));
    logLine(`🎭 ${lines.join(" • ")}`, r.hp < 0 ? "combat" : "info");
    if (r.got?.length) stat("found", r.got.reduce((s, g) => s + g[1], 0));
  } catch (e) {
    toast(fnErr(e)); state.enc = null;
    try { const p = await eventCall({ a: "peek" }); if (p.enc) { state.encBusy = false; encShow(p.enc); } else $("enc-modal").classList.add("hidden"); } catch { $("enc-modal").classList.add("hidden"); }
  } finally { state.encBusy = false; }
}

/* =========================================================
   49.6) 🎁 กิจกรรมประจำวัน — หีบรายวัน • ล่าค่าหัว • อีเวนต์โลกรายสัปดาห์ • ต้นไม้ค่าย/สัตว์เลี้ยง
   ทุกระบบทำงานผ่าน Cloud Functions (dailyAct / worldAct / campAct — functions/daily.js, world.js, camp.js) ไม่แตะ rules
   - โบนัสจากต้นไม้ค่าย/ระดับสัตว์เลี้ยง คำนวณฝั่งเกมเป็นตัวคูณตารางของที่เจอ + ลดดาเมจ (เหมือนโปรเจกต์ค่ายเดิม)
   - ล่าค่าหัว: ชนะซอมบี้ในโซนเป้าหมายบวกตัวนับ ach hw<โซน> (ซอมบี้ใช้ตัวนับ bite เดิม)
   ========================================================= */
const acs = (state.acs = state.acs || { tab: "crate" });
const actTabs = [["crate", "🎁 หีบรายวัน"], ["hunt", "🎯 ค่าหัว"], ["world", "🌍 อีเวนต์โลก"], ["camp", "🏕️ ค่าย"]];
const actCall = { crate: (a) => dailyCall({ s: "crate", a }), hunt: (a) => dailyCall({ s: "hunt", a }), world: (a, x) => worldCall({ a, ...(x || {}) }), camp: (a, x) => campCall({ a, ...(x || {}) }) };
async function actSync(tab, a = "state", x) {
  if (tab === "world" || tab === "hunt") { try { await achFlush(); } catch { /* ข้าม */ } }
  const r = await actCall[tab](a, x); acs[tab] = r; acs[tab + "At"] = Date.now(); return r;
}
function actDot() {
  const c = acs.crate, h = acs.hunt, w = acs.world;
  return !!(c && !c.claimed) || !!(h && h.done && !h.got) || !!(w && w.mine >= w.min && w.ms.some((m) => m.ok && !m.got));
}
function actBtn() { hubBtn(); }
function actTick() {
  if (!state.profile || !state.ach?.loaded) return;
  const now = Date.now();
  ["crate", "camp"].forEach((t) => {   // ดึงข้อมูลตอนเข้าเกม (โบนัสค่ายต้องใช้ทันที) แล้วรีเฟรชทุก 5 นาที
    if (acs[t + "Busy"] || (acs[t + "At"] && now - acs[t + "At"] < 300000) || document.hidden) return;
    acs[t + "Busy"] = true; acs[t + "At"] = now;
    actSync(t).catch(() => { /* ข้าม */ }).finally(() => { acs[t + "Busy"] = false; try { actBtn(); actRender(); } catch { /* ข้าม */ } });
  });
  actBtn();
}
function actOpen() { hubOpen("act"); }
function actRefresh() {
  const t = acs.tab; if (acs[t + "Busy"]) return; acs[t + "Busy"] = true;
  actSync(t).catch((e) => toast(fnErr(e))).finally(() => { acs[t + "Busy"] = false; actBtn(); actRender(); });
}
const actLeft = (t) => passMs(t - serverNow());
function actRender() {
  const body = $("act-body"); if (!body || !hubOn("act")) return;
  const tabs = $("act-tabs"); tabs.innerHTML = "";
  actTabs.forEach(([k, l]) => { const b = btn(l, () => { acs.tab = k; actRender(); actRefresh(); }, "btn mini " + (acs.tab === k ? "primary" : "ghost")); tabs.append(b); });
  body.innerHTML = ""; const card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; }, t = acs.tab, D = acs[t];
  if (!D) { card().append(mk("div", "muted", "กำลังโหลด…")); return; }
  const row = (c, left, right) => { const r = mk("div"); r.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px"; r.append(left); if (right) r.append(right); c.append(r); };
  if (t === "crate") {
    const c = card(D.claimed ? "" : " evt-live");
    c.append(mk("div", "", `🎁 หีบรายวัน • streak ${D.st} วัน`), mk("div", "muted", D.claimed ? `วันนี้เปิดแล้ว ✅ — หีบใหม่ในอีก ${actLeft(D.end)}` : `วันนี้เป็นวันที่ ${D.day}/7 ของรอบ${D.day === 7 ? " — การันตีของหายาก + ของแถม!" : ""}`));
    const g = mk("div"); g.style.cssText = "display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin:6px 0";
    for (let i = 1; i <= 7; i++) { const done = D.claimed ? i <= ((D.st - 1) % 7) + 1 : i <= (D.st % 7); const x = mk("span", "", i === 7 ? "💎" : done ? "✔" : String(i)); x.style.cssText = `font-size:11px;text-align:center;padding:4px 0;border-radius:4px;background:${done ? "var(--accent,#e0a030)" : "var(--panel-2,#1c2128)"}`; g.append(x); }
    c.append(g);
    if (D.last) c.append(mk("div", "", `ได้รับล่าสุด: ${mRew([D.last])}`));
    if (!D.claimed) c.append(btn("เปิดหีบ", async () => { try { const r = await actSync("crate", "open"); toast(`🎁 ได้ ${mRew([r.got])}${r.bonus ? " + " + mRew([r.bonus]) : ""}`); logLine(`🎁 เปิดหีบรายวัน (วันที่ ${r.day}${r.tier === "r" ? " ★หายาก" : ""}): ${mRew([r.got].concat(r.bonus ? [r.bonus] : []))}`, "system"); acs.crate.last = r.got; try { sfx("boss"); } catch { /* ข้าม */ } } catch (e) { toast(fnErr(e)); } actBtn(); actRender(); }, "btn primary"));
  } else if (t === "hunt") {
    const c = card(D.done && !D.got ? " evt-live" : "");
    c.append(mk("div", "", `🎯 ค่าหัววันนี้: ${D.name}`), mk("div", "muted", D.zone ? `ล่าซอมบี้ให้ได้ ${D.n} ตัว ที่ ${(ZONES[D.zone] || {}).name || D.zone}` : `กัดเหยื่อให้ได้ ${D.n} ครั้ง`), mk("div", "muted", `รางวัล: ${mRew(D.rew)} • รีเซ็ตในอีก ${actLeft(D.end)}`));
    if (!D.acc) c.append(btn("รับค่าหัว", async () => { try { await actSync("hunt", "accept"); } catch (e) { toast(fnErr(e)); } actRender(); }, "btn primary"));
    else {
      c.append(mk("div", "", `ความคืบหน้า ${D.v}/${D.n} ${D.got ? "✅ รับรางวัลแล้ว" : D.done ? "🎯 สำเร็จ!" : ""}`));
      if (D.done && !D.got) c.append(btn("รับรางวัล", async () => { try { const r = await actSync("hunt", "claim"); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`🎯 ล่าค่าหัวสำเร็จ: ${mRew(r.rewarded)}`, "system"); } catch (e) { toast(fnErr(e)); } actBtn(); actRender(); }, "btn primary"));
    }
  } else if (t === "world") {
    const c = card(); c.append(mk("div", "", `${D.icon} ${D.name} • สัปดาห์นี้`), mk("div", "muted", D.say), mk("div", "muted", `สิ้นสุดใน ${actLeft(D.end)} • ผู้ร่วมกิจกรรม ${D.np} คน (เป้าหมายขยายตามจำนวนคน)`));
    const bar = mk("div"); bar.style.cssText = "height:10px;border-radius:5px;background:var(--panel-2,#1c2128);margin:6px 0;overflow:hidden"; const i = mk("div"); i.style.cssText = `height:100%;width:${Math.min(100, D.tot / D.goal * 100)}%;background:var(--accent,#e0a030)`; bar.append(i);
    c.append(bar, mk("div", "", `รวมทั้งเมือง ${D.tot}/${D.goal} ${D.unit} • คุณช่วยไป ${D.mine} (ต้องช่วยอย่างน้อย ${D.min} ถึงรับรางวัลได้)`));
    D.ms.forEach((x) => { const ok = x.ok && D.mine >= D.min; row(c, mk("div", x.got ? "muted" : "", `${x.got ? "✅" : x.ok ? "🎯" : "🔒"} ${Math.round(x.p * 100)}% (${x.need}): ${mRew(x.rew)}`), ok && !x.got ? btn("รับ", async () => { try { const r = await actSync("world", "claim", { i: x.i }); toast(`🎁 ได้ ${mRew(r.rewarded)}`); logLine(`🌍 รางวัลอีเวนต์โลก: ${mRew(r.rewarded)}`, "system"); } catch (e) { toast(fnErr(e)); } actBtn(); actRender(); }, "btn primary mini") : null); });
  } else if (t === "camp") {
    const c = card(); c.append(mk("div", "", "🏕️ ต้นไม้อัปเกรดค่าย (โบนัสถาวร)"), mk("div", "muted", D.base >= 1 ? "อัปเกรดได้ที่ Safe Zone ด้วยวัสดุ/สารเคมี" : "ต้องมีที่พักขั้น 1 ขึ้นไปก่อนถึงจะอัปเกรดได้"));
    D.perks.forEach((p) => {
      const cost = p.next ? mRew(p.next) : "สูงสุดแล้ว";
      row(c, mk("div", "", `${p.icon} ${p.name} ระดับ ${p.lv}/${p.max} — ${p.tip}${p.next ? ` • ราคา ${cost}` : ""}`), p.next ? btn("อัปเกรด", async () => {
        if (state.zone !== "safe") return toast("ต้องอยู่ที่ Safe Zone");
        try { await actSync("camp", "buy", { id: p.id }); toast(`${p.icon} ${p.name} ระดับ ${p.lv + 1}`); } catch (e) { toast(fnErr(e)); } actRender();
      }, "btn primary mini") : null);
    });
    if (D.pet) { const PK = PET_K[D.pet.k] || {}; const pc = card(); pc.append(mk("div", "", `${PK.icon || "🐾"} ${PK.name || "สัตว์เลี้ยง"} ระดับ ${D.pet.lv}/5`), mk("div", "muted", `รับของจากสัตว์เลี้ยงแล้ว ${D.pet.claims} ครั้ง (ทุก 5 ครั้งเลื่อน 1 ระดับ) • ได้ของแถมทุกครั้งที่รับ และระดับ 2 ขึ้นไปลดโอกาสค้นหาแล้วไม่เจออะไรเพิ่มขึ้น 1%/ระดับ`)); }
    else card().append(mk("div", "muted", "🐾 ยังไม่มีสัตว์เลี้ยง — รับเลี้ยงได้ที่หน้าที่พัก"));
  }
}
// โบนัสถาวรจากต้นไม้ค่าย + สัตว์เลี้ยง: ตัวคูณ 1 + ค่าต่อระดับ × ระดับ
function fxPerkMods(m) {
  const D = acs.camp; if (!D) return;
  const ap = (eff, L) => Object.entries(eff).forEach(([q, v]) => { if (q === "cut") return; if (m[q] !== undefined) m[q] *= Math.max(0.2, 1 + v * L); });
  D.perks.forEach((p) => { if (p.lv > 0) ap(p.eff, p.lv); });
  if (D.pet?.eff) ap(D.pet.eff, 1);   // eff ของสัตว์เลี้ยงคูณระดับมาจากเซิร์ฟเวอร์แล้ว
}
const fxPerkCut = () => (acs.camp ? acs.camp.perks.reduce((a, p) => a + ((p.eff.cut || 0) * p.lv), 0) : 0);
async function petBonusAfterClaim() {
  try { await achFlush(); const r = await actSync("camp", "petBonus"); if (r.bonus) { toast(`🐾 ของแถมจากสัตว์เลี้ยง: ${mRew(r.bonus)}`); logLine(`🐾 สัตว์เลี้ยง (ระดับ ${r.lvl}) หาของแถมมาให้: ${mRew(r.bonus)}`, "info"); } } catch { /* ข้าม */ }
}

/* =========================================================
   49.7) 🎲 ผจญภัย — 🕳️ ดิ่งลึก • 👹 ศัตรูคู่อาฆาต • 📻 ปริศนาวิทยุ • 🐪 ขบวนพ่อค้าเร่
   ทุกระบบทำงานผ่าน Cloud Functions (diveAct / nemAct / radioAct / caravanAct — functions/dive.js, nemesis.js, radio.js, caravan.js) ไม่แตะ rules
   ========================================================= */
const adv = (state.adv = state.adv || { tab: "war" });
const advTabs = [["war", "⚔️ ศึกใหญ่"], ["dive", "🕳️ ดิ่งลึก"], ["nem", "👹 คู่อาฆาต"], ["radio", "📻 วิทยุ"], ["caravan", "🐪 พ่อค้าเร่"]];
const advCalls = { dive: (a, x) => diveCall({ a, ...(x || {}) }), nem: (a, x) => nemCall({ a, ...(x || {}) }), radio: (a, x) => radioCall({ a, ...(x || {}) }), caravan: (a, x) => caravanCall({ a, ...(x || {}) }), war: (a, x) => warCall({ a, ...(x || {}) }) };
async function advSync(tab, a = "state", x) { const r = await advCalls[tab](a, x); adv[tab] = r; adv[tab + "At"] = Date.now(); if (tab === "war") { state.warD = r; abilInvalidate(); } return r; }
function advDot() { const c = adv.caravan, r = adv.radio, w = adv.war || state.warD; return !!(w && w.prev && w.prev.canClaim) || !!(c && c.open && c.here) || !!(r && !r.heard && !r.solved && state.zone === r.zone); }
function advBtn() { hubBtn(); }
function advTick() {
  if (!state.profile || !state.ach?.loaded) return;
  const now = Date.now();
  if (!state.advPeek) { state.advPeek = true; nemCall({ a: "peek" }).then((r) => { adv.nemHist = r.history; if (r.nem) nemShow(r.nem); }).catch(() => { /* ข้าม */ }); }
  ["caravan", "radio"].forEach((t) => {   // รีเฟรชทุก 5 นาที (ใช้ทำจุดแจ้งเตือน)
    if (adv[t + "Busy"] || (adv[t + "At"] && now - adv[t + "At"] < 300000) || document.hidden) return;
    adv[t + "Busy"] = true; adv[t + "At"] = now;
    advSync(t).catch(() => { /* ข้าม */ }).finally(() => { adv[t + "Busy"] = false; try { advBtn(); advRender(); } catch { /* ข้าม */ } });
  });
  advBtn();
}
function advOpen() { hubOpen("adv"); }
function advRefresh() { const t = adv.tab; if (adv[t + "Busy"]) return; adv[t + "Busy"] = true; advSync(t).catch((e) => toast(fnErr(e))).finally(() => { adv[t + "Busy"] = false; advBtn(); advRender(); }); }
const advGo = async (tab, a, x, ok) => {   // เรียกคำสั่ง → อัปเดตสถานะ → แสดงผล
  if (adv.busy) return; adv.busy = true;
  try { const r = await advSync(tab, a, x); if (ok) ok(r); } catch (e) { toast(fnErr(e)); try { await advSync(tab); } catch { /* ข้าม */ } }
  finally { adv.busy = false; advBtn(); advRender(); }
};
const advLeft = (t) => passMs(t - serverNow());
function advRender() {
  const body = $("adv-body"); if (!body || !hubOn("adv")) return;
  const tabs = $("adv-tabs"); tabs.innerHTML = "";
  advTabs.forEach(([k, l]) => tabs.append(btn(l, () => { adv.tab = k; advRender(); advRefresh(); }, "btn mini " + (adv.tab === k ? "primary" : "ghost"))));
  body.innerHTML = ""; const card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; }, t = adv.tab, D = adv[t];
  const row = (c, left, right) => { const r = mk("div"); r.style.cssText = "display:flex;gap:8px;align-items:center;justify-content:space-between;margin-top:6px"; r.append(left); if (right) r.append(right); c.append(r); };
  if (t === "nem") {
    const c = card(), h = adv.nemHist;
    c.append(mk("div", "", "👹 ศัตรูคู่อาฆาต"), mk("div", "muted", "ระหว่างค้นหานอก Safe Zone มีโอกาสเจอศัตรูที่มีชื่อ จำคุณได้ ยิ่งหนีหรือแพ้มันยิ่งแข็งแกร่งขึ้นและกลับมาเอง ล้มมันได้ของดี (เลเวลสูง = ของหายาก)"));
    c.append(mk("div", "", h ? `ตอนนี้มี: ${h.name} เลเวล ${h.lv} (คุณหนีรอด ${h.esc} ครั้ง) ยังตามหาคุณอยู่` : "ตอนนี้ไม่มีศัตรูที่ตามหาคุณ"));
    return;
  }
  if (t === "war") { warRender(card); return; }
  if (!D) { card().append(mk("div", "muted", "กำลังโหลด…")); return; }
  if (t === "dive") {
    const c = card(D.on ? " evt-live" : "");
    c.append(mk("div", "", "🕳️ ดิ่งลึก"), mk("div", "muted", `ลงชั้นใต้ดินของอุโมงค์/ห้องแล็บ สูงสุด ${D.max} ชั้น ของที่เก็บได้ยังไม่ปลอดภัยจนกว่าจะ "ขึ้นจากหลุม" — หมดสติ = เสียของทั้งรอบ`), mk("div", "muted", `สถิติสูงสุด: ชั้น ${D.best} • เหลือ ${D.runsLeft} รอบวันนี้`));
    if (adv.msg) c.append(mk("div", "", adv.msg));
    if (!D.on) {
      const inZone = state.zone === "tunnel" || state.zone === "lab";
      c.append(mk("div", "muted", `ค่าเตรียมตัว ${mRew([D.entry])} • ต้องอยู่ที่อุโมงค์หรือห้องแล็บ${D.cd > 0 ? ` • พักอีก ${passMs(D.cd)}` : ""}`));
      const b = btn("เริ่มดิ่ง", () => advGo("dive", "start", null, () => { adv.msg = ""; try { achBump("dive"); } catch { /* ข้าม */ } }), "btn primary"); b.disabled = !inZone || D.runsLeft <= 0 || D.cd > 0; c.append(b);
    } else {
      const bar = mk("div"); bar.style.cssText = "height:8px;border-radius:4px;background:var(--panel-2,#1c2128);margin:6px 0;overflow:hidden"; const i = mk("div"); i.style.cssText = `height:100%;width:${Math.max(0, D.stab)}%;background:${D.stab > 50 ? "#4caf50" : D.stab > 25 ? "#e0a030" : "#d9534f"}`; bar.append(i);
      c.append(mk("div", "", `ชั้น ${D.fl}/${D.max} • เสถียรภาพ ${D.stab}/100`), bar, mk("div", "muted", D.loot.length ? `ของที่เก็บมา: ${mRew(D.loot)}` : "ยังไม่ได้เก็บของ"));
      D.opts.forEach((o) => { const b = btn(`${o.icon} ${o.l}${o.p === null ? " (ฟื้น +30)" : ` — สำเร็จ ${o.p}% • ของ ×${o.r}`}`, () => advGo("dive", "pick", { i: o.i }, (r) => { adv.msg = r.dead ? `💀 ${r.msg}` : r.cleared ? `🏆 ${r.msg}` : `${r.msg}${r.got ? ` (+${mRew(r.got)})` : ""}${r.lost ? ` เสียเสถียรภาพ −${r.lost}` : ""}${r.firstReward ? ` 🎁 รางวัลครั้งแรกถึงชั้นนี้: ${mRew(r.firstReward)}` : ""}`; if (r.cashed) toast(`🎁 ได้ ${mRew(r.cashed)}`); if (r.dead || r.cleared) logLine(`🕳️ ${adv.msg}`, r.dead ? "combat" : "system"); }), "btn primary"); b.style.textAlign = "left"; c.append(b); });
      c.append(btn(`⬆️ ขึ้นจากหลุม (เก็บของ ${D.loot.length ? mRew(D.loot) : "ไม่มี"})`, () => advGo("dive", "cashout", null, (r) => { adv.msg = r.cashed.length ? `ขึ้นมาถึงชั้น ${r.fl} ได้ ${mRew(r.cashed)}` : "ขึ้นมามือเปล่า"; toast(adv.msg); logLine(`🕳️ ${adv.msg}`, "system"); }), "btn ghost"));
    }
  } else if (t === "radio") {
    const c = card(); c.append(mk("div", "", "📻 ปริศนาวิทยุประจำสัปดาห์"), mk("div", "muted", `สัญญาณลึกลับซ่อนรหัส 4 หลัก • ฟังสัญญาณได้วันละครั้งที่โซนที่กำหนด จะได้เบาะแส 1 หลัก (เปลี่ยนทุกวัน) — แชร์เบาะแสกันในแชตแล้วส่งรหัสเปิดคลังลับ • เปลี่ยนใน ${advLeft(D.end)}`));
    if (D.solved) c.append(mk("div", "", "✅ คุณเปิดคลังสัปดาห์นี้แล้ว"));
    else {
      c.append(mk("div", "", `วันนี้ต้องไปที่ ${D.zoneTh} เพื่อฟังเบาะแส${D.slot}`));
      const b = btn(D.heard ? "ฟังวันนี้แล้ว ✅" : "📡 ฟังสัญญาณ", () => advGo("radio", "listen", null, (r) => { toast(`📻 ${r.got}`); logLine(`📻 เบาะแส${D.slot}: ${r.got}`, "system"); }), "btn primary"); b.disabled = D.heard || state.zone !== D.zone; c.append(b);
    }
    const cl = card(); cl.append(mk("div", "", "🗒️ เบาะแสที่คุณได้สัปดาห์นี้"));
    if (!D.clues.length) cl.append(mk("div", "muted", "ยังไม่มี")); D.clues.forEach((x) => cl.append(mk("div", "muted", `${x.slot}: ${x.text}`)));
    if (!D.solved) {
      const g = card(), inp = document.createElement("input"); inp.type = "text"; inp.inputMode = "numeric"; inp.maxLength = 4; inp.placeholder = "รหัส 4 หลัก"; inp.style.cssText = "width:100%;box-sizing:border-box;margin:6px 0";
      g.append(mk("div", "", `🔐 ส่งรหัส (ทายได้อีก ${D.guessesLeft} ครั้งวันนี้ • ผู้แก้แล้ว ${D.solvers} คน • ชุดใหญ่เหลือ ${D.bigLeft} ที่)`), inp);
      if (adv.hint !== undefined) g.append(mk("div", "muted", `รอบก่อนถูกตำแหน่ง ${adv.hint}/4 หลัก`));
      g.append(btn("ส่งรหัส", () => advGo("radio", "guess", { code: inp.value.trim() }, (r) => { if (r.right) { toast(`🎉 รหัสถูกต้อง! ได้ ${mRew(r.rewarded)}`); logLine(`📻 เปิดคลังลับสำเร็จ (ลำดับที่ ${r.order}): ${mRew(r.rewarded)}`, "system"); try { achBump("radio"); } catch { /* ข้าม */ } adv.hint = undefined; } else { adv.hint = r.hint; toast("รหัสไม่ถูกต้อง"); } }), "btn primary"));
    }
  } else if (t === "caravan") {
    const c = card();
    c.append(mk("div", "", "🐪 ขบวนพ่อค้าเร่"));
    if (!D.open) c.append(mk("div", "muted", `ตอนนี้ขบวนพักอยู่ — รอบหน้าอีก ${advLeft(D.next)}`));
    else if (!D.here) c.append(mk("div", "", `มีขบวนพ่อค้ามาแล้ว! ใบ้: ${D.hint}`), mk("div", "muted", `ตามหาให้เจอแล้วไปยืนที่โซนนั้น • อยู่อีก ${advLeft(D.until)}`));
    else {
      c.append(mk("div", "muted", `${D.who} เปิดร้านอยู่อีก ${advLeft(D.until)} • ซื้อได้คนละ 1 ชิ้นต่อรายการ ของจำกัดทั้งเซิร์ฟเวอร์`));
      D.goods.forEach((g) => {
        const b = btn(g.bought ? "ซื้อแล้ว" : g.left <= 0 ? "หมด" : "ซื้อ", () => advGo("caravan", "buy", { key: g.key }, (r) => { toast(`🐪 ได้ ${mRew([r.bought])}`); logLine(`🐪 ซื้อจากขบวนพ่อค้า: ${mRew([r.bought])}`, "system"); try { achBump("cbuy"); } catch { /* ข้าม */ } }), "btn primary mini"); b.disabled = g.bought || g.left <= 0;
        row(c, mk("div", "", `${mRew([[g.id, g.q]])} — แลกด้วย ${mRew(g.cost)} (เหลือ ${g.left})`), b);
      });
    }
  }
}
// ---- ศัตรูคู่อาฆาต: หน้าต่างปะทะ ----
function nemAfterSearch() {
  if (state.nemBusy || state.nemOn || state.enc || !state.profile || state.profile.hp <= 0 || isPeace(state.zone) || state.boss) return;
  state.nemBusy = true;
  nemCall({ a: "roll" }).then((r) => { if (r.nem) nemShow(r.nem, r.again); }).catch(() => { /* ข้าม */ }).finally(() => { state.nemBusy = false; });
}
function nemShow(n, again) {
  if (!n || state.boss || document.querySelector(".modal:not(.hidden):not(#nem-modal)")) return;
  state.nemOn = true;
  if (!$("nem-modal")) {
    const m = mk("div", "modal sheet hidden"); m.id = "nem-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "440px";
    const head = mk("div", "modal-head"); const h = mk("h2", ""); h.id = "nem-title"; head.append(h);
    const body = mk("div"); body.id = "nem-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.6";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("nem-title").textContent = `👹 ${n.name} (เลเวล ${n.lv})`;
  const body = $("nem-body"); body.innerHTML = "";
  body.append(mk("div", "", again ? `มันกลับมาแล้ว… และแข็งแกร่งขึ้น! ${n.name} จำกลิ่นคุณได้` : `${n.name} ปรากฏตัวขึ้นตรงหน้าคุณ`), mk("div", "muted", `นิสัย: ${n.trait} — ${n.tip} • ที่ผ่านมาคุณล้มมันได้ ${n.kills} ครั้ง หนีรอด ${n.esc} ครั้ง`));
  const w = (() => { try { const q = equippedWeapon(); return q ? weaponBonus(q.def) : 0; } catch { return 0; } })();
  n.opts.forEach((o) => {
    const lack = o.need && encHave(o.need[0]) < o.need[1];
    const b = btn(`${o.l}${o.need ? ` (ใช้ ${mRew([o.need])})` : ""} — ชนะประมาณ ${Math.min(95, o.p + (o.k === "flee" ? 0 : w * 6))}%${lack ? " • ของไม่พอ" : ""}`, () => nemChoose(o.k, w), "btn primary"); b.disabled = !!lack; b.style.textAlign = "left"; body.append(b);
  });
  $("nem-modal").classList.remove("hidden");
}
async function nemChoose(k, wb) {
  if (state.nemBusy) return; state.nemBusy = true;
  const body = $("nem-body"); body.querySelectorAll("button").forEach((b) => { b.disabled = true; });
  try {
    const r = await nemCall({ a: "choose", k, wb });
    state.nemOn = false; adv.nemHist = r.again ? { name: r.name, lv: Math.min(8, r.win ? r.lv : r.lv + 1), esc: 0 } : null;
    body.innerHTML = ""; const lines = [r.msg]; if (r.paid) lines.push(`ใช้ ${mRew([r.paid])}`); if (r.hp) lines.push(`💔 เสีย ${-r.hp} HP`); if (r.loot && r.loot.length) lines.push(`🎒 ได้ ${mRew(r.loot)}`);
    body.append(mk("div", "", lines[0])); lines.slice(1).forEach((x) => body.append(mk("div", "muted", x)));
    body.append(btn("ตกลง", () => $("nem-modal").classList.add("hidden"), "btn ghost"));
    logLine(`👹 ${lines.join(" • ")}`, r.win ? "info" : "combat");
    if (r.win && k !== "flee") { try { achBump("nemk"); } catch { /* ข้าม */ } }
  } catch (e) {
    toast(fnErr(e)); state.nemOn = false;
    try { const p = await nemCall({ a: "peek" }); if (p.nem) { state.nemBusy = false; nemShow(p.nem); } else $("nem-modal").classList.add("hidden"); } catch { $("nem-modal").classList.add("hidden"); }
  } finally { state.nemBusy = false; }
}

/* =========================================================
   50) 🎲 Release N — ท้าดวลระหว่างผู้เล่น (duel/, ds/, dc/ • ต้องใช้ rules v41)
   วางเดิมพันของกิน/วัสดุ (ชนิดเดียวกัน จำนวนเท่ากัน 1–5 ชิ้น) ที่ Safe Zone • ผู้ชนะได้ของทั้งสองฝั่ง
   เกม: 🎲 ทอยเต๋า • 🪙 โยนเหรียญ • ✊ เป่ายิ้งฉุบ • 🃏 21 (เลือกจั่วเพิ่ม 0–3 ใบ ลับกัน)
   ผลตัดสินโดย rules จากเวลาเซิร์ฟเวอร์ตอนที่อีกฝ่ายกดรับ (u) — ไม่มีใครเลือกผลเองได้ • ยกเลิกดวลที่ยังไม่มีคนรับได้ ของคืนเต็ม
   ปรับได้จากแท็บ 🎛️: duel_on
   ========================================================= */
const DUEL_ITEMS = ["water", "canned_food", "bandage", "medkit", "scrap", "energy_drink", "bread", "fruit", "moss", "rotten_meat", "chem"];
const DUEL_G = { d: { icon: "🎲", name: "ทอยเต๋า", how: "สุ่มเลข 0–99 คนละตัว มากกว่าชนะ" }, c: { icon: "🪙", name: "โยนเหรียญ", how: "ผู้ท้าเลือกหัว/ก้อย ผู้รับได้ด้านตรงข้าม" }, r: { icon: "✊", name: "เป่ายิ้งฉุบ", how: "เลือกลับกัน เปิดพร้อมกันตอนผู้รับตอบ" }, j: { icon: "🃏", name: "21", how: "ได้ไพ่ 2 ใบ เลือกจั่วเพิ่ม 0–3 ใบแบบลับ ใกล้ 21 ชนะ เกินแพ้" } };
const DUEL_RPS = ["✊ ค้อน", "✋ กระดาษ", "✌️ กรรไกร"], DUEL_COIN = ["🪙 หัว", "🪙 ก้อย"];
const duelOn = () => T("duel_on", 1) === 1;
const dCard = (u, p) => u % p % 10 + 1;
const dHandA = (u, h) => [dCard(u, 101), dCard(u, 103), ...[107, 109, 113].slice(0, h).map((p) => dCard(u, p))];
const dHandB = (u, h) => [dCard(u, 127), dCard(u, 131), ...[137, 139, 149].slice(0, h).map((p) => dCard(u, p))];
const dSum = (a) => a.reduce((x, y) => x + y, 0);
function dCalc(d, xa, xb) {   // ต้องตรงกับสูตรใน rules ทุกตัวอักษร
  const u = d.u, o = {};
  if (d.g === "c") { o.ra = u % 2; o.w = o.ra === d.cs ? d.a : d.b; }
  else if (d.g === "d") { o.ra = u % 100; o.rb = ((u - o.ra) / 100) % 100; o.w = o.ra > o.rb ? d.a : o.ra < o.rb ? d.b : "d"; }
  else if (d.g === "r") { o.w = xa === xb ? "d" : (xa - xb + 3) % 3 === 1 ? d.a : d.b; }
  else { o.ra = dSum(dHandA(u, xa)); o.rb = dSum(dHandB(u, xb)); const ea = o.ra > 21 ? 0 : o.ra, eb = o.rb > 21 ? 0 : o.rb; o.w = ea > eb ? d.a : ea < eb ? d.b : "d"; }
  return o;
}
function dName(uid) {
  if (uid === state.uid) return "คุณ";
  const n = state.players?.[uid]?.name || state.dNames?.[uid]; if (n) return n;
  state.dNames = state.dNames || {};
  if (!state.dNames["?" + uid]) { state.dNames["?" + uid] = 1; get(ref(db, `users/${uid}/username`)).then((s) => { if (s.val()) { state.dNames[uid] = s.val(); dRender(); } }).catch(() => {}); }
  return "ผู้เล่น";
}
const dMine = (d) => d && (d.a === state.uid || d.b === state.uid);
const dMyFlag = (d) => d.a === state.uid ? d.fa : d.fb;
function dEntitle(d) {   // จำนวนชิ้นที่ฉันมีสิทธิ์รับคืน/รับรางวัล (0 = ไม่มี/รับแล้ว)
  if (!dMine(d) || dMyFlag(d)) return 0;
  if (d.s === 3) return d.a === state.uid ? d.q : 0;
  if (d.s === 2) return d.w === state.uid ? 2 * d.q : d.w === "d" ? d.q : 0;
  return 0;
}
function dInit() {
  if (state.dOn || !state.uid) return; state.dOn = true; state.duels = {}; state.dDs = {};
  onValue(query(ref(db, "duel"), orderByKey(), limitToLast(60)), (s) => {
    const v = s.val() || {}, old = state.duels; state.duels = { ...v };
    try { (JSON.parse(localStorage.getItem("dl_ids_" + state.uid) || "[]")).forEach((id) => { if (!state.duels[id]) get(ref(db, "duel/" + id)).then((x) => { if (x.val()) { state.duels[id] = x.val(); dRender(); } }).catch(() => {}); }); } catch { /* ข้าม */ }
    Object.entries(v).forEach(([id, d]) => {   // แจ้งผลครั้งแรกที่เห็น
      if (!dMine(d) || d.s < 2 || (old[id] && old[id].s >= 2) || state.dSeen?.[id]) return;
      (state.dSeen = state.dSeen || {})[id] = 1;
      if (!state.dFirst) return;
      const it = ITEMS[d.it], txt = d.s === 3 ? "ยกเลิกแล้ว" : d.w === state.uid ? `🏆 ชนะ! ได้ ${it.icon}${it.name} ×${2 * d.q}` : d.w === "d" ? "เสมอ ได้ของคืน" : `แพ้ เสีย ${it.icon}${it.name} ×${d.q}`;
      if (d.s === 2) { toast(`🎲 ดวลกับ${dName(d.a === state.uid ? d.b : d.a)}: ${txt}`); try { logLine(`🎲 ดวล ${DUEL_G[d.g].name} กับ ${dName(d.a === state.uid ? d.b : d.a)}: ${txt}`, d.w === state.uid ? "system" : "info"); } catch { /* ข้าม */ } }
    });
    state.dFirst = true; dRender(); dTick();
  }, (e) => { state.duels = {}; console.warn("duel", e?.code || e); });
}
function dRemember(id) { try { const k = "dl_ids_" + state.uid, l = JSON.parse(localStorage.getItem(k) || "[]"); l.push(id); localStorage.setItem(k, JSON.stringify(l.slice(-30))); } catch { /* ข้าม */ } }
async function dRead(id) {
  const r = {};
  for (const p of ["a", "b"]) { try { const v = (await get(ref(db, `ds/${id}/${p}`))).val(); if (typeof v === "number") r[p] = v; } catch { /* ยังไม่มีสิทธิ์อ่าน */ } }
  return r;
}
async function dSettle(id, d) {
  if (!d || d.s !== 1 || !dMine(d)) return;
  let xa, xb;
  if (d.g === "r" || d.g === "j") {
    const r = await dRead(id); xa = r.a; xb = r.b;
    if (typeof xa !== "number" || typeof xb !== "number") {
      if (d.g === "j" && serverNow() - d.u >= 300000 && !(xa !== undefined && xb !== undefined)) { try { await update(ref(db), { [`duel/${id}/s`]: 2, [`duel/${id}/w`]: "d" }); } catch { /* อีกฝั่งอาจทำไปแล้ว */ } }
      return;
    }
  }
  const o = dCalc(d, xa, xb), u = { [`duel/${id}/s`]: 2 };
  Object.entries(o).forEach(([k, v]) => { u[`duel/${id}/${k}`] = v; });
  try { await update(ref(db), u); } catch (e) { console.warn("duel settle", e?.code || e); }
}
async function dClaim(id, d) {
  const k = dEntitle(d); if (!k || state.busy) return;
  const me = state.uid, side = d.a === me ? "fa" : "fb";
  try {
    const have = (await get(ref(db, `inventory/${me}/${d.it}/qty`))).val() || 0;
    await update(ref(db), { [`dc/${me}`]: { id }, [`duel/${id}/${side}`]: serverTimestamp(), [`inventory/${me}/${d.it}`]: { id: d.it, qty: Math.min(99, have + k) } });
    if (d.s === 2 && d.w === me) toast(`🏆 รับรางวัลดวล ${ITEMS[d.it].icon}×${k}`);
  } catch (e) { (state.dFail = state.dFail || {})[id] = Date.now() + 20000; console.warn("duel claim", e?.code || e); }
}
function dTick() {
  const b = $("btn-duel"), p = state.profile;
  if (b) {
    const act = Object.values(state.duels || {}).some((d) => dMine(d) && (d.s <= 1 || dEntitle(d) > 0));
    b.classList.toggle("hidden", !(duelOn() && p && p.hp > 0 && (state.zone === "safe" || act)));
    b.classList.toggle("btn-dot", Object.values(state.duels || {}).some((d) => d.s === 0 && d.a !== state.uid && state.zone === "safe") || act);
  }
  if (!duelOn() || !p || Date.now() < (state.dNext || 0)) return;
  state.dNext = Date.now() + 3000;
  Object.entries(state.duels || {}).forEach(([id, d]) => {
    if (!dMine(d)) return;
    if (d.s === 1 && !(state.dBusy || {})[id]) { (state.dBusy = state.dBusy || {})[id] = 1; dSettle(id, d).finally(() => { delete state.dBusy[id]; }); }
    else if (dEntitle(d) > 0 && Date.now() > ((state.dFail || {})[id] || 0)) { state.dFail = state.dFail || {}; state.dFail[id] = Date.now() + 8000; dClaim(id, d); }
  });
  if ($("dl-modal") && !$("dl-modal").classList.contains("hidden")) dRender();
}
function dHave(it) { return state.inv?.[it]?.qty || 0; }
async function dCreate(g, it, q, ch) {
  if (state.busy) return; state.busy = true;
  try {
    const me = state.uid, id = push(ref(db, "duel")).key, left = dHave(it) - q;
    const u = { [`duel/${id}`]: { a: me, g, it, q, t: serverTimestamp(), u: serverTimestamp(), s: 0, ...(g === "c" ? { cs: ch } : {}) }, [`inventory/${me}/${it}`]: left > 0 ? { id: it, qty: left } : null };
    if (g === "r") u[`ds/${id}/a`] = ch;
    await update(ref(db), u); dRemember(id); toast("🎲 ตั้งดวลแล้ว รอคนรับ (ยกเลิกได้)");
  } catch (e) { toast(errMsg(e)); } finally { state.busy = false; dRender(); }
}
async function dAccept(id, d, ch) {
  if (state.busy) return; state.busy = true;
  try {
    const me = state.uid, left = dHave(d.it) - d.q;
    const u = { [`duel/${id}/b`]: me, [`duel/${id}/s`]: 1, [`duel/${id}/u`]: serverTimestamp(), [`inventory/${me}/${d.it}`]: left > 0 ? { id: d.it, qty: left } : null };
    if (d.g === "r") u[`ds/${id}/b`] = ch;
    await update(ref(db), u); dRemember(id);
    const x = (await get(ref(db, `duel/${id}`))).val(); state.duels[id] = x; state.busy = false; await dSettle(id, x);
  } catch (e) { toast(errMsg(e)); } finally { state.busy = false; dRender(); }
}
async function dCancel(id, d) {
  if (state.busy) return; state.busy = true;
  try { await update(ref(db), { [`duel/${id}/s`]: 3 }); state.duels[id] = { ...d, s: 3 }; state.busy = false; await dClaim(id, state.duels[id]); toast("ยกเลิกดวลแล้ว ได้ของคืน"); }
  catch (e) { toast(errMsg(e)); } finally { state.busy = false; dRender(); }
}
async function dCommit(id, d, n) {
  if (state.busy) return; state.busy = true;
  try { await update(ref(db), { [`ds/${id}/${d.a === state.uid ? "a" : "b"}`]: n }); toast("🃏 ส่งการตัดสินใจแล้ว (ลับ)"); state.dRd = state.dRd || {}; delete state.dRd[id]; }
  catch (e) { toast(errMsg(e)); } finally { state.busy = false; dRender(); }
}
function dOpen() {
  if (!$("dl-modal")) {
    const m = mk("div", "modal hidden"); m.id = "dl-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    const box = mk("div", "modal-box"); box.style.maxWidth = "480px"; box.style.maxHeight = "85vh"; box.style.overflowY = "auto";
    const head = mk("div", "modal-head"); head.append(mk("h2", "", "🎲 ท้าดวล"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div"); body.id = "dl-body"; body.style.cssText = "display:grid;gap:10px;margin-top:12px;font-size:14px;line-height:1.5";
    box.append(head, body); m.append(box); document.body.append(m);
  }
  $("dl-modal").classList.remove("hidden"); dRender();
}
function dRender() {
  const body = $("dl-body"); if (!body || $("dl-modal").classList.contains("hidden")) return;
  if (body.contains(document.activeElement) && /SELECT|INPUT/.test(document.activeElement.tagName) && state.dFocusLock) return;
  body.innerHTML = "";
  const card = (cls = "") => { const c = mk("div", "world-row" + cls); body.append(c); return c; };
  const safe = state.zone === "safe", F = state.dForm = state.dForm || { g: "d", it: "water", q: 1, ch: 0 };
  const duels = Object.entries(state.duels || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const itxt = (d) => `${ITEMS[d.it]?.icon || ""}${ITEMS[d.it]?.name || d.it} ×${d.q}`;
  // ---- ตั้งดวลใหม่
  const nf = card(); nf.append(mk("div", "", "➕ ตั้งดวลใหม่"));
  if (!safe) nf.append(mk("div", "muted", "ตั้ง/รับดวลได้เฉพาะที่ Safe Zone"));
  else {
    const opts = DUEL_ITEMS.filter((i) => dHave(i) > 0 && ITEMS[i]);
    if (!opts.length) nf.append(mk("div", "muted", "ไม่มีของที่ใช้เดิมพันได้ (ของกิน/ยา/วัสดุ)"));
    else {
      if (!opts.includes(F.it)) F.it = opts[0];
      F.q = Math.max(1, Math.min(F.q, 5, dHave(F.it)));
      const row = mk("div"); row.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0";
      const sel = (list, val, on) => { const s = mk("select"); list.forEach(([v, t]) => { const o = mk("option", "", t); o.value = v; if (String(v) === String(val)) o.selected = true; s.append(o); }); s.addEventListener("change", () => { on(s.value); dRender(); }); s.addEventListener("focus", () => { state.dFocusLock = 1; }); s.addEventListener("blur", () => { state.dFocusLock = 0; }); return s; };
      row.append(sel(Object.entries(DUEL_G).map(([k, v]) => [k, `${v.icon} ${v.name}`]), F.g, (v) => { F.g = v; F.ch = 0; }),
        sel(opts.map((i) => [i, `${ITEMS[i].icon} ${ITEMS[i].name} (มี ${dHave(i)})`]), F.it, (v) => { F.it = v; }),
        sel(Array.from({ length: Math.min(5, dHave(F.it)) }, (_, i) => [i + 1, `เดิมพัน ×${i + 1}`]), F.q, (v) => { F.q = +v; }));
      if (F.g === "c") row.append(sel(DUEL_COIN.map((t, i) => [i, "ฉันเลือก " + t]), F.ch, (v) => { F.ch = +v; }));
      if (F.g === "r") row.append(sel(DUEL_RPS.map((t, i) => [i, "ฉันออก " + t]), F.ch, (v) => { F.ch = +v; }));
      nf.append(row, mk("div", "muted", DUEL_G[F.g].how + " • ผู้รับต้องลงเดิมพันเท่ากัน ผู้ชนะได้ทั้งหมด • ยกเลิกได้ถ้ายังไม่มีคนรับ"));
      nf.append(btn(`ตั้งดวล ${DUEL_G[F.g].icon}`, () => dCreate(F.g, F.it, F.q, F.ch), "btn primary mini"));
    }
  }
  // ---- ดวลของฉัน
  const mine = duels.filter(([, d]) => dMine(d) && (d.s <= 1 || dEntitle(d) > 0)).concat(duels.filter(([, d]) => dMine(d) && d.s >= 2 && dEntitle(d) === 0).slice(0, 4));
  if (mine.length) {
    const h = card(); h.append(mk("div", "", "📋 ดวลของฉัน"));
    mine.forEach(([id, d]) => {
      const c = mk("div", "muted"); c.style.cssText = "border-top:1px solid var(--line,#2a313a);padding-top:6px;margin-top:6px"; h.append(c);
      const opp = d.b ? dName(d.a === state.uid ? d.b : d.a) : "";
      c.append(mk("div", "", `${DUEL_G[d.g].icon} ${DUEL_G[d.g].name} • ${itxt(d)}${opp ? " • กับ " + opp : ""}`));
      if (d.s === 0) { c.append(mk("div", "", "⏳ รอคนรับดวล…"), btn("ยกเลิก (รับของคืน)", () => dCancel(id, d), "btn ghost mini")); }
      else if (d.s === 1) dPlaying(c, id, d);
      else if (d.s === 3) c.append(mk("div", "", d.fa ? "ยกเลิกแล้ว • รับของคืนแล้ว" : "ยกเลิกแล้ว • กำลังรับของคืน…"));
      else {
        const res = d.g === "d" ? ` (${d.ra} vs ${d.rb})` : d.g === "j" ? ` (${d.ra > 21 ? d.ra + " ไหม้" : d.ra} vs ${d.rb > 21 ? d.rb + " ไหม้" : d.rb})` : d.g === "c" ? ` (ออก${DUEL_COIN[d.ra].slice(2)})` : "";
        const t = d.w === state.uid ? `🏆 ชนะ ได้ ×${2 * d.q}` : d.w === "d" ? "🤝 เสมอ ได้คืน" : "💀 แพ้";
        c.append(mk("div", "", t + res));
        if (dEntitle(d) > 0) c.append(btn("รับของ", () => dClaim(id, d), "btn primary mini"));
      }
    });
  }
  // ---- ดวลที่เปิดอยู่
  const open = duels.filter(([, d]) => d.s === 0 && d.a !== state.uid);
  const oc = card(); oc.append(mk("div", "", `⚔️ ดวลที่เปิดรับ (${open.length})`));
  if (!open.length) oc.append(mk("div", "muted", "ยังไม่มีใครท้า — ตั้งดวลแล้วรอเพื่อนมารับได้เลย"));
  open.forEach(([id, d]) => {
    const c = mk("div", "muted"); c.style.cssText = "border-top:1px solid var(--line,#2a313a);padding-top:6px;margin-top:6px"; oc.append(c);
    c.append(mk("div", "", `${DUEL_G[d.g].icon} ${dName(d.a)} ท้า ${DUEL_G[d.g].name} • ${itxt(d)}`));
    const can = safe && dHave(d.it) >= d.q;
    if (d.g === "c") c.append(mk("div", "", `คุณจะได้ด้าน ${DUEL_COIN[1 - d.cs]}`));
    if (!can) c.append(mk("div", "", safe ? `ของไม่พอ (ต้องมี ${itxt(d)})` : "ต้องอยู่ Safe Zone"));
    else if (d.g === "r") DUEL_RPS.forEach((t, i) => c.append(btn(t, () => dAccept(id, d, i), "btn primary mini")));
    else c.append(btn("รับดวล", () => dAccept(id, d), "btn primary mini"));
  });
  body.append(mk("div", "muted", "เดิมพันได้เฉพาะของกิน ยา และวัสดุ (ไม่รวมอาวุธ/เกราะ) • เก็บของได้สูงสุด 99 ชิ้น ส่วนที่เกินจะหายไป"));
}
function dPlaying(c, id, d) {
  const me = state.uid, amA = d.a === me, u = d.u;
  if (d.g === "j") {
    const ha = dHandA(u, 0), hb = dHandB(u, 0), mh = amA ? ha : hb, oh = amA ? hb : ha;
    c.append(mk("div", "", `ไพ่คุณ ${mh.join(" + ")} = ${dSum(mh)} • ไพ่ ${dName(amA ? d.b : d.a)} ${oh.join(" + ")} = ${dSum(oh)}`));
    state.dRd = state.dRd || {};
    if (state.dRd[id] === undefined) { state.dRd[id] = null; dRead(id).then((r) => { state.dRd[id] = r[amA ? "a" : "b"] ?? -1; dRender(); }); }
    const mineC = state.dRd[id];
    if (mineC >= 0) c.append(mk("div", "", `✅ คุณเลือกจั่วเพิ่ม ${mineC} ใบแล้ว รออีกฝั่งตัดสินใจ (ไม่ตอบใน 5 นาที = เสมอ ได้ของคืน)`));
    else if (mineC === -1) {
      c.append(mk("div", "", "จะจั่วเพิ่มกี่ใบ? (ลับ — เกิน 21 = ไหม้ แพ้)"));
      [0, 1, 2, 3].forEach((n) => c.append(btn(n ? `จั่ว ${n}` : "หยุด", () => dCommit(id, d, n), "btn primary mini")));
    }
  } else c.append(mk("div", "", d.g === "r" ? "กำลังเปิดผล…" : "กำลังตัดสิน…"));
}
function dBtnInit() {
  const pr = $("btn-profile"); if (pr && !$("btn-duel")) { const b = btn("🎲", dOpen, "btn ghost mini"); b.id = "btn-duel"; b.classList.add("hidden"); b.title = "ท้าดวลผู้เล่น"; pr.before(b); }
}

/* =========================================================
   33) 🪧 ป้ายประกาศประจำโซน (sign/{zone}/{uid}) + ⚡ เจ้าของสั่งอีเวนต์ทันที (evtForce/)
   ผู้เล่นฝากข้อความสั้นๆ (≤60 ตัว) ไว้ที่โซนที่ตัวเองยืนอยู่ ได้คนละ 1 ป้ายต่อโซน (เขียนใหม่ทับได้ทุก 60 วิ) • คนที่อยู่โซนนั้นเห็น ป้ายอายุ 24 ชม.
   ========================================================= */
const SIGN_LIFE = 24 * 3600000, SIGN_CD = 60000, SIGN_MAX = 60;
const signBad = (t) => /(http|www\.)/i.test(t);
function signFresh() { const now = serverNow(); return Object.entries(state.signs || {}).filter(([, g]) => g && typeof g.t === "string" && typeof g.ts === "number" && now - g.ts < SIGN_LIFE).sort((a, b) => b[1].ts - a[1].ts); }
function signListen(z) {
  state.signs = {}; state.signZone = z; let first = true;
  return onValue(ref(db, "sign/" + z), (snap) => {
    if (state.signZone !== z) return;
    state.signs = snap.val() || {};
    const list = signFresh();
    if (first) { first = false; if (list.length && state.profile) logLine(`🪧 มีป้ายในโซนนี้ ${list.length} ป้าย — ล่าสุด “${list[0][1].t}” (${list[0][1].n})`, "info"); }
    signRender();
  }, (e) => console.warn("sign", e?.code || e));
}
function signRender() {
  const head = $("zone-event"); if (!head || !state.profile) return;
  let box = $("sign-box"); if (!box) { box = mk("div", "sign-box"); box.id = "sign-box"; head.after(box); }
  const list = signFresh(), open = !!state.signOpen, me = state.uid, staff = ["owner", "gm"].includes(state.profile.role);
  box.textContent = "";
  const h = mk("div", "sign-head"); h.append(mk("span", "", `🪧 ป้ายในโซน${list.length ? ` (${list.length})` : ""}`), mk("span", "muted", open ? "▴" : "▾"));
  h.addEventListener("click", () => { state.signOpen = !state.signOpen; signRender(); });
  box.append(h); if (!open) return;
  if (!list.length) box.append(mk("div", "muted sign-note", "ยังไม่มีใครฝากป้ายไว้ที่นี่"));
  list.slice(0, 8).forEach(([uid, g]) => {
    const r = mk("div", "sign-row"), m = Math.max(1, Math.round((serverNow() - g.ts) / 60000));
    r.append(mk("span", "sign-t", `“${g.t}”`), mk("span", "muted", ` — ${g.n || "?"} • ${m >= 60 ? Math.floor(m / 60) + " ชม." : m + " นาที"}ก่อน`));
    if (uid === me || staff) { const d = btn("ลบ", async () => { try { await remove(ref(db, `sign/${state.zone}/${uid}`)); } catch (e) { toast(errMsg(e)); } }, "btn ghost mini"); r.append(d); }
    box.append(r);
  });
  if (state.profile.hp > 0) {
    const mine = state.signs?.[me], cd = mine ? Math.max(0, SIGN_CD - (serverNow() - mine.ts)) : 0;
    const f = mk("div", "sign-form"), inp = mk("input"); inp.maxLength = SIGN_MAX; inp.placeholder = mine ? "เขียนทับป้ายของคุณ…" : "ฝากข้อความถึงคนที่ผ่านมา (≤60 ตัว)"; inp.value = state.signDraft || "";
    inp.addEventListener("input", () => { state.signDraft = inp.value; });
    const go = btn("ปักป้าย", async () => {
      const t = inp.value.replace(/\s+/g, " ").trim();
      if (!t) return toast("พิมพ์ข้อความก่อน");
      if (t.length > SIGN_MAX) return toast(`ยาวเกิน ${SIGN_MAX} ตัวอักษร`);
      if (signBad(t)) return toast("ห้ามใส่ลิงก์");
      const left = mine ? Math.max(0, SIGN_CD - (serverNow() - mine.ts)) : 0; if (left > 0) return toast(`รออีก ${Math.ceil(left / 1000)} วิ ถึงจะเขียนใหม่ได้`);
      go.disabled = true;
      try { await set(ref(db, `sign/${state.zone}/${me}`), { t, n: state.profile.username, ts: serverTimestamp() }); state.signDraft = ""; toast("🪧 ปักป้ายแล้ว"); }
      catch (e) { toast(errMsg(e)); } finally { go.disabled = false; }
    }, "btn primary mini");
    f.append(inp, go); box.append(f);
    if (cd > 0) box.append(mk("div", "muted sign-note", `เพิ่งปักป้าย — เขียนทับได้ในอีก ${Math.ceil(cd / 1000)} วิ`));
  }
}
function signStyle() {
  if ($("sign-style")) return;
  const st = document.createElement("style"); st.id = "sign-style";
  st.textContent = ".sign-box{margin:4px 0;padding:4px 8px;border:1px dashed var(--hazard,#d9a441);border-radius:8px;background:rgba(0,0,0,.18);flex-basis:100%;max-height:22vh;overflow:auto}"
    + ".sign-head{display:flex;justify-content:space-between;gap:8px;cursor:pointer;user-select:none;font-size:.9em}"
    + ".sign-row{margin:5px 0;font-size:.88em;display:flex;flex-wrap:wrap;gap:4px;align-items:baseline}.sign-t{font-weight:600}"
    + ".sign-form{display:flex;gap:6px;margin:6px 0;align-items:center}.sign-form input{flex:1 1 auto;min-width:0;width:auto}.sign-form .btn,.sign-row .btn{white-space:nowrap;min-height:0;padding:3px 10px;width:auto}.sign-note{margin:4px 0;font-size:.82em}";
  document.head.append(st);
}

/* ---- ⚡ เจ้าของสั่งอีเวนต์ทันที ---- */
function evtForceListen() {
  if (state.efOn || !state.uid) return; state.efOn = true; state.evtForce = {};
  onValue(ref(db, "evtForce"), (snap) => { state.evtForce = snap.val() || {}; try { evtTick(); worldRefresh(); } catch { /* ข้าม */ } }, (e) => console.warn("evtForce", e?.code || e));
}
function evtForceRows(box) {
  box.append(mk("div", "hub-day", "⚡ สั่งอีเวนต์ทันที (เจ้าของ)"));
  box.append(mk("div", "muted", "ปล่อยแล้วทุกคนได้ยินวิทยุเอง — ใช้ตอนคนออนเยอะหรือเปิดฉากเนื้อเรื่อง ไม่ต้องรอตามตาราง"));
  const row = mk("div", "world-row tune-row"), ctl = mk("div", "tune-ctl");
  const ty = mk("select"); Object.entries(EVT_TYPES).forEach(([k, v]) => { const o = mk("option", "", `${v.icon} ${v.name}`); o.value = k; ty.append(o); });
  const zn = mk("select"); Object.entries(ZONES).filter(([k]) => k !== "safe").forEach(([k, v]) => { const o = mk("option", "", `${v.icon} ${v.name}`); o.value = k; zn.append(o); });
  const mins = mk("input"); mins.type = "number"; mins.min = 5; mins.max = 180; mins.value = Math.max(5, Math.min(180, T("evt_dur", 30))); mins.inputMode = "numeric";
  const go = btn("🚀 ปล่อยเลย", async () => {
    const m = Math.round(Number(mins.value)); if (!(m >= 5 && m <= 180)) return toast("ใส่เวลา 5–180 นาที");
    const now = serverNow(), k = "f" + now.toString(36);
    try { await set(ref(db, "evtForce/" + k), { type: ty.value, zone: zn.value, start: now, end: now + m * 60000 }); toast("ปล่อยอีเวนต์แล้ว"); } catch (e) { toast(errMsg(e)); }
  }, "btn primary mini");
  ctl.append(ty, zn, mins, mk("span", "muted", "นาที"), go); row.append(ctl); box.append(row);
  const now = serverNow(), live = Object.entries(state.evtForce || {}).filter(([, f]) => f && f.end > now);
  live.forEach(([k, f]) => {
    const r = mk("div", "world-row"), T2 = EVT_TYPES[f.type];
    r.append(mk("div", "", `${T2?.icon || "⚡"} ${T2?.name || f.type} • ${ZONES[f.zone]?.name || f.zone}`), mk("div", "muted", `เหลือ ~${Math.max(1, Math.ceil((f.end - now) / 60000))} นาที`));
    r.append(btn("หยุดตอนนี้", async () => { try { await update(ref(db, "evtForce/" + k), { end: Math.max(f.start + 1, serverNow()) }); toast("หยุดแล้ว"); } catch (e) { toast(errMsg(e)); } }, "btn danger mini"));
    box.append(r);
  });
  Object.entries(state.evtForce || {}).forEach(([k, f]) => { if (f && f.end < now - 86400000) remove(ref(db, "evtForce/" + k)).catch(() => {}); });
}

/* =========================================================
   34) 🧪 แคปซูลสเตตัส + 🔓 แกนทะลุขีดจำกัด (อัปสเตตัสถาวรจากไอเทม)
   - ราคาขั้นบันได: แต้มจาก v → v+1 ใช้ max(1, ⌈(v−6)/2⌉) เม็ด (นับจากค่ารวมของสเตตัส) • ความคืบหน้าเก็บที่ statUp/{uid}/{สเตตัส}={c,ts}
   - เพดานปกติ 17 (พละกำลัง 13) อ่านจาก tune • แกนทะลุขีดจำกัด +2 ต่อครั้ง (สูงสุด 4 ครั้ง / พละกำลัง 2 ครั้ง) ราคา 1,2,3,4 ชิ้น เก็บที่ statBrk/{uid}/{สเตตัส}={b,c}
   - ห้ามทิ้ง/ซื้อขาย (rules กันที่ตลาดและกองของพื้น) • ราคา/เพดาน/การหักไอเทม rules บังคับ • โอเวอร์โดส (สุ่มฝั่งเครื่อง) เป็นความเสี่ยงที่ผู้เล่นเลือกเอง
   ========================================================= */
const STATUP_STEP = 2, TOX_HALF = 12 * 3600000;
const statNat = (k) => Math.round(k === "str" ? T("stat_cap_str", 13) : T("stat_cap", 17));
const statBrkMax = (k) => (k === "str" ? 2 : 4);
const statBrkOf = (k) => state.statBrk?.[k] || { b: 0, c: 0 };
const statCeil = (k) => statNat(k) + STATUP_STEP * (statBrkOf(k).b || 0);
const statCapCost = (v) => (v <= 8 ? 1 : Math.ceil((v - 6) / 2));
const statLimCost = (b) => b + 1;
const statUpOf = (k) => { const x = state.statUp?.[k]; return typeof x === "number" ? x : typeof x?.c === "number" ? x.c : 0; };   // statUp/{uid}/{k} = {c, ts}
const invQty = (id) => state.inv?.[id]?.id === id ? state.inv[id].qty || 0 : 0;
function toxNow() {
  const o = LS.get(lsKey("tox"), { n: 0, ts: 0 }), el = Math.max(0, serverNow() - (o.ts || 0));
  return Math.max(0, (o.n || 0) - Math.floor(el / TOX_HALF));
}
function toxAdd() {
  const o = LS.get(lsKey("tox"), { n: 0, ts: 0 }), now = serverNow(), el = Math.max(0, now - (o.ts || 0)), left = Math.max(0, (o.n || 0) - Math.floor(el / TOX_HALF));
  LS.set(lsKey("tox"), { n: left + 1, ts: left > 0 ? now - (el % TOX_HALF) : now });   // ค่าพิษลดลง 1 ทุก 12 ชม. (เก็บเศษเวลาไว้)
}
function odChance() {
  const t = toxNow(), free = Math.round(T("od_free", 2)); if (t < free) return 0;
  return Math.min(Math.max(0, T("od_max", 70)), Math.max(0, T("od_step", 20)) * (t - free + 1));
}
function statupListen() {
  if (state.suOn || !state.uid) return; state.suOn = true; state.statUp = {}; state.statBrk = {};
  onValue(ref(db, "statUp/" + state.uid), (s) => { state.statUp = s.val() || {}; statRefresh(); }, (e) => console.warn("statUp", e?.code || e));
  onValue(ref(db, "statBrk/" + state.uid), (s) => { state.statBrk = s.val() || {}; statRefresh(); }, (e) => console.warn("statBrk", e?.code || e));
}
function statRefresh() {
  try { const m = $("statup-modal"); if (m && !m.classList.contains("hidden")) statBuild($("statup-body")); } catch { /* ข้าม */ }
  try { if (!$("profile-modal")?.classList.contains("hidden")) statProfile(); } catch { /* ข้าม */ }
}
function statProfile() {
  const p = state.profile; if (!p || !state.stats) return; statStyle();
  let box = $("prof-statup"); if (!box) { box = mk("div", "statup-sum"); box.id = "prof-statup"; $("prof-perk").before(box); }
  box.textContent = "";
  box.append(mk("div", "muted", "🧪 ขีดจำกัดสเตตัส (ค่าปัจจุบัน/เพดาน)"));
  (STAT_DEF[p.faction] || []).forEach((d) => {
    const v = baseStat(d.k), ceil = statCeil(d.k), row = mk("div", "statup-line");
    row.append(mk("span", "", `${d.icon} ${d.name} ${v}/${ceil}`), mk("span", "muted", v >= ceil ? (statBrkOf(d.k).b >= statBrkMax(d.k) ? " • สูงสุดแล้ว" : " • ต้องใช้ 🔓 แกนขยาย") : ` • แคปซูล ${statUpOf(d.k)}/${statCapCost(v)}`));
    box.append(row);
  });
  box.append(btn("🧪 อัปสเตตัส", () => statOpen(), "btn primary mini"));
  box.append(mk("div", "muted statup-hint", "แคปซูล/แกนขยาย ได้จากเควสสัปดาห์ กาชา หรือกิจกรรม — ห้ามทิ้งหรือซื้อขาย"));
}
function statOpen() {
  if (!state.profile) return; statStyle();
  let m = $("statup-modal");
  if (!m) {
    m = mk("div", "modal hidden"); m.id = "statup-modal"; m.setAttribute("role", "dialog");
    const box = mk("div", "modal-box"), head = mk("div", "statup-head");
    head.append(mk("h2", "", "🧪 อัปสเตตัส"), btn("ปิด", () => m.classList.add("hidden"), "btn ghost mini"));
    const body = mk("div", ""); body.id = "statup-body"; box.append(head, body); m.append(box);
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
    document.body.append(m);
  }
  statBuild($("statup-body")); m.classList.remove("hidden");
}
function statBuild(body) {
  const p = state.profile; if (!p || !body) return; body.textContent = "";
  if (!state.stats) { body.append(mk("div", "muted", "ยังไม่ได้แจกแต้มสเตตัสเริ่มต้น")); return; }
  const cap = invQty("stat_cap"), lim = invQty("stat_lim"), od = odChance(), tox = toxNow();
  const info = mk("div", "statup-info"); info.append(mk("span", "", `🧪 แคปซูล ×${cap}`), mk("span", "", `🔓 แกนขยาย ×${lim}`), mk("span", od ? "danger-text" : "muted", `☣️ ค่าพิษ ${tox}${od ? ` — เม็ดต่อไปเสี่ยงโอเวอร์โดส ${od}%` : " — ปลอดภัย"}`));
  body.append(info);
  (STAT_DEF[p.faction] || []).forEach((d) => {
    const k = d.k, v = baseStat(k), ceil = statCeil(k), br = statBrkOf(k), row = mk("div", "statup-row");
    const head = mk("div", "statup-name"); head.append(mk("b", "", `${d.icon} ${d.name}`), mk("span", "", ` ${v} / ${ceil}`)); row.append(head, mk("div", "muted", d.desc));
    const ctl = mk("div", "statup-ctl");
    if (v < ceil) {
      const need = statCapCost(v), c = statUpOf(k);
      const bar = mk("div", "statup-bar"), fill = mk("i"); fill.style.width = Math.min(100, (100 * c) / need) + "%"; bar.append(fill); ctl.append(bar, mk("span", "muted", `แต้มถัดไป: ${c}/${need} เม็ด`));
      const b = btn(od ? `🧪 ใช้ ×1 (เสี่ยง ${od}%)` : "🧪 ใช้ ×1", () => statUse(k), od ? "btn danger mini" : "btn primary mini"); b.disabled = !!state.statBusy || cap < 1 || p.hp <= 0; ctl.append(b);
    } else if (br.b >= statBrkMax(k)) {
      ctl.append(mk("span", "muted", "ถึงเพดานสูงสุดแล้ว"));
    } else {
      const need = statLimCost(br.b), c = br.c || 0;
      const bar = mk("div", "statup-bar"), fill = mk("i"); fill.style.width = Math.min(100, (100 * c) / need) + "%"; bar.append(fill); ctl.append(bar, mk("span", "muted", `ขยายเพดาน +${STATUP_STEP}: ${c}/${need} ชิ้น`));
      const b = btn("🔓 ใช้แกน ×1", () => limUse(k), "btn primary mini"); b.disabled = !!state.statBusy || lim < 1 || p.hp <= 0; ctl.append(b);
    }
    row.append(ctl); body.append(row);
  });
  body.append(mk("div", "muted statup-hint", `ราคาแต้มเพิ่มขึ้นตามค่าสเตตัส • กินถี่เกินไปจะสะสมค่าพิษ (ลดลง 1 ทุก 12 ชม.) เสี่ยงโอเวอร์โดส: เม็ดนั้นเสียเปล่า HP เหลือครึ่งและพลังงานหมด • ใช้ระหว่างต่อสู้ได้ แต่ความเสี่ยงอยู่ที่คุณ`));
}
async function statUse(k) {
  const p = state.profile; if (!p || state.statBusy || p.hp <= 0) return;
  const v = baseStat(k), need = statCapCost(v), c = statUpOf(k), q = invQty("stat_cap");
  if (!(STAT_DEF[p.faction] || []).some((d) => d.k === k)) return toast("สเตตัสนี้ไม่ใช่ของฝ่ายคุณ");
  if (q < 1) return toast("ไม่มีแคปซูลสเตตัส");
  if (v >= statCeil(k)) return toast("ถึงเพดานแล้ว — ต้องใช้ 🔓 แกนทะลุขีดจำกัด");
  const chance = odChance();
  if (chance > 0 && !confirm(`⚠️ ค่าพิษสะสมสูง! เม็ดนี้เสี่ยงโอเวอร์โดส ${chance}%\nถ้าซวย: เม็ดเสียเปล่า HP เหลือครึ่ง พลังงานหมด\nจะเสี่ยงไหม?`)) return;
  state.statBusy = true; statRefresh();
  const uid = state.uid, u = {};
  u[q > 1 ? `inventory/${uid}/stat_cap/qty` : `inventory/${uid}/stat_cap`] = q > 1 ? q - 1 : null;
  const over = chance > 0 && Math.random() * 100 < chance;
  let msg;
  if (over) {
    u[`users/${uid}/hp`] = Math.max(1, Math.floor((p.hp || 1) / 2));
    u[`users/${uid}/stamina`] = 0; u[`users/${uid}/staminaTs`] = serverTimestamp();
    msg = "💀 โอเวอร์โดส! แคปซูลเสียเปล่า HP เหลือครึ่ง พลังงานหมด";
  } else if (c + 1 >= need) {
    u[`stats/${uid}/${k}`] = v + 1; u[`statUp/${uid}/${k}`] = { c: 0, ts: serverTimestamp() };
    msg = `✨ ${STAT_LABEL[k]} เพิ่มเป็น ${v + 1}`;
  } else {
    u[`statUp/${uid}/${k}`] = { c: c + 1, ts: serverTimestamp() };
    msg = `🧪 สะสมแล้ว ${c + 1}/${need} เม็ดสำหรับแต้มถัดไปของ ${STAT_LABEL[k]}`;
  }
  try {
    await update(ref(db), u); toxAdd(); toast(msg); logLine(msg, over ? "system" : "info");
    if (over) { try { sfx("hit"); } catch { /* */ } if (chance >= 40) feedPost(7, k); }
    else if (u[`stats/${uid}/${k}`]) { try { sfx("low"); } catch { /* */ } }
  } catch (e) { toast(errMsg(e)); }
  finally { state.statBusy = false; renderBars(); statRefresh(); }
}
async function limUse(k) {
  const p = state.profile; if (!p || state.statBusy || p.hp <= 0) return;
  const v = baseStat(k), br = statBrkOf(k), q = invQty("stat_lim"), need = statLimCost(br.b);
  if (q < 1) return toast("ไม่มีแกนทะลุขีดจำกัด");
  if (v < statCeil(k)) return toast("ยังไม่ถึงเพดาน — ใช้แคปซูลก่อน");
  if (br.b >= statBrkMax(k)) return toast("ขยายเพดานสูงสุดแล้ว");
  state.statBusy = true; statRefresh();
  const uid = state.uid, u = {}, done = (br.c || 0) + 1 >= need;
  u[q > 1 ? `inventory/${uid}/stat_lim/qty` : `inventory/${uid}/stat_lim`] = q > 1 ? q - 1 : null;
  u[`statBrk/${uid}/${k}`] = done ? { b: br.b + 1, c: 0 } : { b: br.b, c: (br.c || 0) + 1 };
  try {
    await update(ref(db), u);
    const msg = done ? `🔓 ขยายเพดาน ${STAT_LABEL[k]} เป็น ${statNat(k) + STATUP_STEP * (br.b + 1)}!` : `🔓 สะสมแกน ${(br.c || 0) + 1}/${need} เพื่อขยายเพดาน ${STAT_LABEL[k]}`;
    toast(msg); logLine(msg, "info"); if (done) feedPost(6, k);
  } catch (e) { toast(errMsg(e)); }
  finally { state.statBusy = false; statRefresh(); }
}
function statStyle() {
  if ($("statup-style")) return;
  const st = document.createElement("style"); st.id = "statup-style";
  st.textContent = ".statup-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.statup-head h2{margin:0}"
    + ".statup-info{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0;font-size:.92em}.danger-text{color:#ff7b6b;font-weight:600}"
    + ".statup-row{border:1px solid var(--line,#444);border-radius:8px;padding:8px;margin:8px 0;background:rgba(0,0,0,.15)}.statup-name{display:flex;gap:6px;align-items:baseline}"
    + ".statup-ctl{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:6px}.statup-bar{flex:1 1 90px;height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;min-width:70px}.statup-bar i{display:block;height:100%;background:var(--hazard,#d9a441)}"
    + ".statup-hint{margin-top:8px;font-size:.82em}.statup-sum{margin:8px 0;padding:8px;border:1px dashed var(--line,#555);border-radius:8px}.statup-line{font-size:.9em;margin:2px 0}";
  document.head.append(st);
}

/* =========================================================
   32) 🎛️ ปรับตัวเลขเกมสดๆ (tune/) + 📈 แดชบอร์ดเศรษฐกิจ (เจ้าของเท่านั้น)
   tune/{key} = ตัวเลข (เจ้าของเขียนได้คนเดียว) — ทุกเครื่องฟังสด ไม่ต้องอัปโหลดโค้ดใหม่ ไม่มีค่า = ใช้ค่าตั้งต้นในโค้ด
   ========================================================= */
state.tune = state.tune || {};
function T(k, d) { const v = state.tune?.[k]; return typeof v === "number" && Number.isFinite(v) ? v : d; }
const gachaDay = () => qpDayKey(serverNow());
function gachaToday() { const o = LS.get(lsKey("gcnt"), { d: 0, n: 0 }); return o.d === gachaDay() ? o.n : 0; }
function gachaTodayAdd() { const d = gachaDay(), o = LS.get(lsKey("gcnt"), { d: 0, n: 0 }); LS.set(lsKey("gcnt"), { d, n: (o.d === d ? o.n : 0) + 1 }); }
function achApplyTune() {
  const m = Math.max(10, Math.min(1000, T("ach_mult", 100)));
  ACH.forEach((a) => { a.n = Math.max(1, Math.round(a.n0 * m / 100)); a.desc = `${a.dv} ${a.n.toLocaleString("en-US")} ${a.du}`; });
  if (state.ach?.loaded) achCheck(true);   // ลดเกณฑ์แล้วปลดล็อกย้อนหลังแบบเงียบๆ ไม่เด้งเตือน/ไม่ขึ้นวิทยุ
}
function tuneListen() {
  if (state.tuneOn || !state.uid) return; state.tuneOn = true; let last = null;
  evtForceListen(); wxListen();
  statStyle(); statupListen();
  onValue(ref(db, "tune"), (snap) => {
    state.tune = snap.val() || {};
    const m = T("ach_mult", 100); if (m !== last) { last = m; achApplyTune(); }
    try { worldRefresh(); const am = $("admin-modal"); if (am && !am.classList.contains("hidden") && state.admTab === "tune" && !(document.activeElement && ["INPUT", "SELECT"].includes(document.activeElement.tagName))) admTab("tune"); } catch { /* ข้าม */ }
  }, (er) => console.warn("tune", er?.code || er));
}
function tuneDefs() {
  const rows = [];
  const gl = { all: "🌐 เป้าหมายทั้งเซิร์ฟเวอร์", human: "🧑 เป้าหมายฝั่งมนุษย์", zombie: "🧟 เป้าหมายฝั่งซอมบี้" };
  Object.entries(GOALS).forEach(([grp, L]) => L.forEach((d) => {
    rows.push([`g_${grp}_${d.ev}`, `${d.t}`, d.n, 1, 20000, gl[grp] + " (ยอดรวมที่ต้องทำ)"]);
    rows.push([`gm_${grp}_${d.ev}`, `ขั้นต่ำที่ต้องทำเองถึงจะรับรางวัล: ${d.t}`, d.min, 0, 2000, gl[grp] + " (ขั้นต่ำรับรางวัล)"]);
  }));
  Object.entries(MIS).forEach(([fac, L]) => L.forEach((d) => rows.push([`m_${fac}_${d.ev}`, `${d.t("โซน")}`, d.n, 1, 2000, (fac === "human" ? "🧑" : "🧟") + " ภารกิจกลุ่มทุก 2 ชม. (ยอดรวม)"])));
  rows.push(["evt_on", "เหตุการณ์ใหญ่ (1 = เปิด, 0 = ปิด)", 1, 0, 1, "⚡ เหตุการณ์ใหญ่"], ["evt_dur", "ระยะเวลาเหตุการณ์ (นาที)", 30, 5, 180, "⚡ เหตุการณ์ใหญ่"], ["evt_str", "ความแรงของผล (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 300, "⚡ เหตุการณ์ใหญ่"]);
  rows.push(["ach_mult", "ตัวคูณเกณฑ์ความสำเร็จทั้งหมด (% • 100 = เดิม, 50 = ง่ายขึ้นครึ่งหนึ่ง)", 100, 10, 1000, "🏅 ความสำเร็จ"]);
  rows.push(["gacha_cap", "เพดานหมุนกาชาต่อคนต่อวัน (0 = ไม่จำกัด)", 0, 0, 500, "🎰 กาชา"]);
  { const g = "🧪 แคปซูลสเตตัส • โอเวอร์โดส (เพดานบังคับด้วย rules ด้วย)";
    rows.push(["stat_cap", "เพดานสเตตัสจากแคปซูล (ค่ารวม ทุกช่องยกเว้นพละกำลัง)", 17, 8, 60, g]);
    rows.push(["stat_cap_str", "เพดานพละกำลังจากแคปซูล (ค่ารวม)", 13, 5, 40, g]);
    rows.push(["od_free", "ค่าพิษที่ยังกินได้ปลอดภัย (ค่าพิษ +1 ต่อเม็ด ลดลง 1 ทุก 12 ชม.)", 2, 0, 10, g]);
    rows.push(["od_step", "โอกาสโอเวอร์โดสที่เพิ่มต่อค่าพิษที่เกิน (%)", 20, 0, 100, g]);
    rows.push(["od_max", "โอกาสโอเวอร์โดสสูงสุด (%)", 70, 0, 100, g]); }
  rows.push(["wb_aura", "บอสโลกฟาดผู้เล่นที่ยืนอยู่ในโซนทุกกี่วินาที (0 = ปิด • คนที่ตีบอสอยู่โดนสวนกลับตามปกติ ไม่นับซ้ำ)", WB_AURA_DEF, 0, 300, "👹 บอสโลก"]);
  { const g = "🌦️ อากาศ & 🔊 เสียงดึงซอมบี้";
    rows.push(["wx_on", "สภาพอากาศสุ่ม (1 = เปิด, 0 = ฟ้าโปร่งตลอด • สั่งอากาศเองยังใช้ได้)", 1, 0, 1, g]);
    rows.push(["wx_str", "ความแรงของผลอากาศ (% • 100 = เดิม, 0 = ไม่มีผลต่อการเล่น)", 100, 0, 200, g]);
    rows.push(["noise_str", "ความแรงของเสียงดึงซอมบี้ (% • 100 = เดิม, 0 = ปิด)", 100, 0, 300, g]); }
  { const g = "🎆 กิจกรรมโลก (เทศกาล • คลังลับ • คู่หู • อาชีพ)";
    rows.push(["fest_on", "เทศกาลตามปฏิทิน (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["fest_str", "ความแรงของผลเทศกาล (% • 100 = เดิม, 0 = แค่บรรยากาศ)", 100, 0, 200, g]);
    rows.push(["fest_force", "สั่งเปิดเทศกาลทันที (0 = ตามปฏิทิน • 1 เดือนมืด 2 จันทร์เต็มดวง 3 ฝนดาวตก 4 สงกรานต์ 5 ลอยกระทง 6 คืนล่าผี 7 วันเก็บเกี่ยว 8 ปีใหม่)", 0, 0, FEST.length, g]);
    rows.push(["site_on", "คลังลับ/ซากเครื่องบิน (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["site_pc", "โอกาสที่แต่ละรอบ 3 ชม. จะมีคลังลับ (%)", 60, 0, 100, g]);
    rows.push(["site_str", "โอกาสค้นพบคลังลับต่อการค้นหา (% • 100 = เดิม)", 100, 0, 300, g]);
    rows.push(["duo_on", "ภารกิจเคียงข้าง (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["duo_min", "ภารกิจเคียงข้าง: ต้องอยู่ร่วมกี่นาที", 8, 1, 60, g]);
    rows.push(["career_on", "เส้นทางอาชีพ (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]); }
  { const g = "🏕️ โปรเจกต์ค่าย & ⚔️ ศึกชิงโซน";
    rows.push(["proj_on", "โปรเจกต์ค่าย/รัง (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["proj_scale", "ราคาโปรเจกต์ทั้งหมด (% • 100 = เดิม, 50 = ถูกลงครึ่งหนึ่ง)", 100, 1, 1000, g]);
    rows.push(["proj_str", "ความแรงของโบนัสโปรเจกต์ (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 200, g]);
    rows.push(["proj_season", "ซีซันโปรเจกต์ (เพิ่มเลข = เริ่มโปรเจกต์ใหม่ทั้งหมด แต้มเก่าเก็บไว้ไม่หาย)", 1, 1, 999, g]);
    rows.push(["zw_on", "ศึกชิงโซน (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["zw_str", "ความแรงของโบนัสโซนที่ยึดได้ (% • 100 = เดิม, 0 = แค่ธง)", 100, 0, 200, g]);
    rows.push(["zw_min", "แต้มรวมขั้นต่ำของโซนในสัปดาห์นั้นถึงจะนับว่ามีผู้ยึด", 30, 1, 5000, g]); }
  rows.push(["wg_on", "เป้าหมายโลกประจำวัน (1 = เปิด, 0 = ปิด)", 1, 0, 1, "🌍 เป้าหมายโลก"]);
  rows.push(["wg_str", "ความแรงของ 🍀 โชคประจำวัน (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 200, "🌍 เป้าหมายโลก"]);
  rows.push(["wg_scale", "จำนวนที่ต้องทำของเป้าหมายโลก (% • 100 = เดิม)", 100, 10, 500, "🌍 เป้าหมายโลก"]);
  rows.push(["gft_on", "ฝากของให้เพื่อน (1 = เปิด, 0 = ปิด)", 1, 0, 1, "🎁 เยี่ยมบ้าน/ฝากของ"]);
  rows.push(["sk_on", "ต้นไม้ทักษะสายอาชีพ (1 = เปิด, 0 = ปิด)", 1, 0, 1, "🌳 ทักษะอาชีพ"]);
  rows.push(["sk_str", "ความแรงของทักษะ (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 200, "🌳 ทักษะอาชีพ"]);
  rows.push(["exp_on", "ทีมสำรวจ (1 = เปิด, 0 = ปิด)", 1, 0, 1, "🧭 ทีมสำรวจ"]);
  rows.push(["onb_on", "ภารกิจวันแรก (1 = เปิด, 0 = ซ่อนปุ่ม)", 1, 0, 1, "🎒 ชุดเริ่มต้น/สัตว์เลี้ยง/ตกปลา"]);
  rows.push(["pet_on", "สัตว์เลี้ยงประจำค่าย (1 = เปิด, 0 = ปิด • ต้องใช้ rules v39)", 1, 0, 1, "🎒 ชุดเริ่มต้น/สัตว์เลี้ยง/ตกปลา"]);
  rows.push(["fish_on", "ตกปลาที่ท่าเรือ (1 = เปิด, 0 = ซ่อนปุ่ม • ต้องใช้ rules v39)", 1, 0, 1, "🎒 ชุดเริ่มต้น/สัตว์เลี้ยง/ตกปลา"]);
  rows.push(["ck_on", "ปฏิทินเช็กอินรายซีซัน (1 = เปิด, 0 = ปิด • ต้องใช้ rules v40)", 1, 0, 1, "🔥 เช็กอิน/กลับมา"]);
  rows.push(["cb_on", "ของขวัญต้อนรับกลับหลังหาย 7 วัน (1 = เปิด, 0 = ปิด • ต้องใช้ rules v40)", 1, 0, 1, "🔥 เช็กอิน/กลับมา"]);
  rows.push(["hc_on", "📡 ภารกิจ HC: ตามหานักวิจัยที่ศูนย์วิจัยร้าง (1 = เปิด, 0 = ปิด • เปิดเมื่อพร้อมประกาศเนื้อเรื่อง • ต้องใช้ rules v43)", 0, 0, 1, "📡 ภารกิจ HC"]);
  rows.push(["hc_drop", "น้ำหนักดรอป 🧬 ชิ้นส่วน DNA ในศูนย์วิจัย (ตารางรวม ~110 • 8 ≈ 7% ต่อการค้น)", 8, 0, 40, "📡 ภารกิจ HC"]);
  rows.push(["hc_goal", "เป้าหมายส่งชิ้นส่วน DNA รวมทั้งเซิร์ฟเวอร์ (ชิ้น)", 300, 10, 5000, "📡 ภารกิจ HC"]);
  rows.push(["hc_pm", "โอกาสเจอธาราต่อการค้น 1 ครั้งที่ศูนย์วิจัย (‰ — 4 = 0.4%, ซอมบี้ได้ครึ่งหนึ่ง) • ใครเจอก่อนคือผู้ค้นพบของทั้งเซิร์ฟเวอร์ เฉลี่ยทั้งโลกค้นรวม ~250 ครั้ง • ต้องใช้ฟังก์ชัน hcAct + rules ใหม่", 4, 0, 1000, "📡 ภารกิจ HC"]);
  rows.push(["crim_on", "🟠 สถานะส้ม: ฆ่าผู้เล่นฝ่ายเดียวกัน → เข้า Safe Zone ไม่ได้ (1 = เปิด, 0 = ปิด • ต้อง deploy ฟังก์ชัน crimAct และเผยแพร่ rules ก่อน)", 0, 0, 1, "🟠 สถานะส้ม"]);
  rows.push(["crim_min", "ระยะเวลาส้มต่อครั้ง (นาที — คูณจำนวนครั้งใน 24 ชม. สูงสุด ×4)", 45, 1, 600, "🟠 สถานะส้ม"]);
  rows.push(["crim_bail", "ค่าประกันปลดส้ม (แต้มมูลค่าต่อครั้ง — เศษเหล็ก/ตะปู 1 • เคมี/เศษหนัง 2 • เทปกาว 3)", 20, 1, 500, "🟠 สถานะส้ม"]);
  rows.push(["bty2_on", "💰 ค่าหัวแบบใหม่ (ตั้งด้วยวัตถุดิบ สะสมแต้ม ไม่หมดเวลา — 1 = เปิดแทนค่าหัวเดิม, 0 = ใช้ค่าหัวเดิม • ต้อง deploy ฟังก์ชัน bountyAct และเผยแพร่ rules ก่อน)", 0, 0, 1, "💰 ค่าหัวใหม่"]);
  rows.push(["bty_step", "แต้มค่าหัวที่เพิ่มต่อการกด 1 ครั้ง (= วัตถุดิบที่หัก)", 10, 1, 100, "💰 ค่าหัวใหม่"]);
  rows.push(["bty_cap", "เพดานค่าหัวรวมต่อเป้าหมาย (แต้ม)", 200, 10, 2000, "💰 ค่าหัวใหม่"]);
  rows.push(["bty_decay", "ค่าหัวลดต่อวัน (% ของแต้ม — 0 = ไม่ลดเลย)", 3, 0, 50, "💰 ค่าหัวใหม่"]);
  rows.push(["bty_fee", "ค่าธรรมเนียมตอนจ่ายค่าหัวให้ผู้ล่า (% — เป็นตัวดูดทรัพยากรออกจากเกม)", 20, 0, 100, "💰 ค่าหัวใหม่"]);
  rows.push(["tut_on", "🎓 บทสอนผู้เล่นใหม่ (1 = เปิด, 0 = ปิด) — แสดงเฉพาะบัญชีที่สร้างหลังวันตัดบัญชีและอายุไม่เกิน 24 ชม. • ทุกคนดูซ้ำได้ด้วย /tutorial", 1, 0, 1, "🎓 บทสอนผู้เล่นใหม่"]);
  rows.push(["jail_on", "⛓️ คุก: คนส้มที่ถูกล้มโดยคนที่ไม่ใช่ส้มติดคุก (1 = เปิด, 0 = ปิด • ต้องเปิดระบบส้ม crim_on ด้วย • ต้อง deploy ฟังก์ชัน jailAct และเผยแพร่ rules ก่อน)", 0, 0, 1, "⛓️ คุก"]);
  rows.push(["jail_min", "ระยะโทษพื้นฐาน (นาที — คูณชั้นโทษ 1–4)", 30, 1, 600, "⛓️ คุก"]);
  rows.push(["jail_bail", "ค่าประกันออกจากคุก (แต้มมูลค่า × ชั้นโทษ)", 30, 1, 500, "⛓️ คุก"]);
  rows.push(["jail_pct", "โอกาสถูกจับเมื่อคนส้มถูกล้ม (% — 100 = จับทุกครั้ง)", 100, 0, 100, "⛓️ คุก"]);
  rows.push(["jail_bailpct", "ค่าประกันเพิ่มตามค่าหัวบนตัว (% ของค่าหัว — 0 = ไม่คิดตามค่าหัว)", 25, 0, 200, "⛓️ คุก"]);
  rows.push(["jail_escbty", "แหกคุกสำเร็จ: ทรัพย์สินตัวเองที่ถูกตั้งเป็นค่าหัวบนตัว (แต้ม — ต้องเปิด bty2_on, 0 = ไม่ตั้ง)", 20, 0, 200, "⛓️ คุก"]);
  rows.push(["jail_rescue", "โอกาสช่วยแหกคุกพื้นฐาน (% — เพิ่ม +10% ต่อช่องโหว่ที่ผู้ต้องขังขุด ≤3 และต่อเกจที่ผู้ช่วยกดตรง ≤3 • ล้มเหลวผู้ช่วยติดคุกไปด้วยโทษเท่ากัน)", 10, 0, 100, "⛓️ คุก"]);
  rows.push(["jail_rescuemax", "โอกาสช่วยแหกคุกสูงสุด (%)", 70, 0, 100, "⛓️ คุก"]);
  rows.push(["crim_red", "ก่อเหตุครั้งที่เท่าไรใน 24 ชม. กลายเป็นสีแดง 🔴 (ผู้ก่อเหตุซ้ำ)", 3, 2, 4, "🟠 สถานะส้ม"]);
  rows.push(["crim_redh", "ระยะเวลาสถานะแดง (ชั่วโมง)", 6, 1, 72, "🟠 สถานะส้ม"]);
  rows.push(["jail_esc", "โอกาสแหกคุกสำเร็จ (%)", 25, 0, 100, "⛓️ คุก"]);
  rows.push(["fxw_on", "⚔️ อาวุธติดสถานะของมนุษย์: คราฟต์ + ค้นเจอ (1 = เปิด, 0 = ปิด • แอดมินเสกได้เสมอ • ต้อง deploy ฟังก์ชัน fxwAct/forgeAct และเผยแพร่ rules ก่อน)", 0, 0, 1, "⚔️ อาวุธติดสถานะ"]);
  rows.push(["fxw_rate", "โอกาสค้นเจออาวุธติดสถานะ (% ของค่าตั้งต้น — 100 = ปกติ, 50 = ครึ่งหนึ่ง)", 100, 0, 1000, "⚔️ อาวุธติดสถานะ"]);
  rows.push(["hb_on", "🏹 บอสเผ่ามนุษย์ของผู้เล่นซอมบี้ (1 = เปิด ค่าเริ่มต้น, 0 = ปิด • ต้อง deploy ฟังก์ชัน hbossAct ก่อน)", 1, 0, 1, "🏹 บอสเผ่ามนุษย์"]);
  rows.push(["hb_pct", "โอกาสเจอบอสเผ่ามนุษย์เทียบบอสฝั่งมนุษย์ (% — 100 = เท่ากัน, 50 = ครึ่งหนึ่ง)", 100, 0, 1000, "🏹 บอสเผ่ามนุษย์"]);
  rows.push(["duel_on", "ท้าดวลระหว่างผู้เล่น (1 = เปิด, 0 = ซ่อนปุ่ม 🎲 • ต้องใช้ rules v41)", 1, 0, 1, "🎲 ท้าดวล"]);
  rows.push(["wb_on", "สรุปตอนกลับมา เมื่อห่างไป ≥ 3 ชม. (1 = เปิด, 0 = ปิด)", 1, 0, 1, "🔥 เช็กอิน/กลับมา"]);
  rows.push(["mg_on", "มินิเกมก่อนค้นลึก (1 = เปิด, 0 = ปิด/ซ่อนปุ่ม 🎮)", 1, 0, 1, "🎮 มินิเกมค้นลึก"]);
  rows.push(["mg_str", "ความแรงของโบนัสมินิเกม (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 200, "🎮 มินิเกมค้นลึก"]);
  rows.push(["base_on", "ที่พัก/สถานีตั้งเวลา (1 = เปิด, 0 = ซ่อนปุ่ม • ต้องใช้ rules v32)", 1, 0, 1, "🏠 ที่พัก"]);
  { const g = "📅 สรุปวัน • 🍂 ฤดูกาล • 🤝 พรจากมิตรภาพ";
    rows.push(["ds_on", "สรุปจบวัน (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["sea_on", "ฤดูกาล 28 วัน (1 = เปิด, 0 = ปิด)", 1, 0, 1, g]);
    rows.push(["sea_scale", "ขนาดเป้าส่วนตัวของฤดูกาล (% • 100 = เดิม, 50 = ง่ายขึ้นครึ่งหนึ่ง)", 100, 10, 500, g]);
    rows.push(["sea_str", "ความแรงของโบนัสฤดูกาล (% • 100 = เดิม, 0 = ไม่มีผล)", 100, 0, 200, g]);
    rows.push(["npc_str", "ความแรงของพรจากมิตรภาพ NPC (% • 100 = เดิม, 0 = ปิด)", 100, 0, 200, g]); }
  rows.push(["salv_pct", "อัตราเศษวัสดุที่ได้จากการรื้อเกราะ (% ของเพดาน • 100 = เต็ม, ลดได้อย่างเดียว)", 100, 0, 100, "🔩 รื้อเกราะ"]);
  return rows;
}
function tuneRender(box, only = "") {   // only = ชื่อหมวดที่จะแสดง ("" = ทุกหมวด, "__force" = เฉพาะปุ่มบังคับเหตุการณ์/อากาศ)
  if (!only || only === "__force") { try { evtForceRows(box); wxForceRows(box); } catch (e) { console.warn("evtForceRows", e); } }
  if (only === "__force") return;
  box.append(mk("div", "muted", "ปรับแล้วทุกเครื่องได้ค่าใหม่ทันที ไม่ต้องรีเฟรช • ช่องว่าง/รีเซ็ต = กลับไปใช้ค่าตั้งต้น • ผลของเป้าหมาย/ภารกิจที่เริ่มแล้วจะใช้ยอดใหม่ทันที"));
  let grp = "";
  const order = []; tuneDefs().forEach((r) => { if (!order.includes(r[5])) order.push(r[5]); });
  tuneDefs().filter((r) => !only || r[5] === only).sort((a, b) => order.indexOf(a[5]) - order.indexOf(b[5])).forEach(([key, label, def, mn, mx, g]) => {
    if (g !== grp) { grp = g; box.append(mk("div", "hub-day", g)); }
    const tuned = typeof state.tune?.[key] === "number", cur = T(key, def);
    const row = mk("div", "world-row tune-row"); row.append(mk("div", "", label));
    const ctl = mk("div", "tune-ctl"), inp = mk("input"); inp.type = "number"; inp.min = mn; inp.max = mx; inp.step = 1; inp.value = cur; inp.inputMode = "numeric";
    const info = mk("span", "muted", tuned ? `ปรับแล้ว (เดิม ${def})` : "ค่าตั้งต้น");
    const save = btn("บันทึก", async () => {
      const v = Number(inp.value);
      if (!Number.isFinite(v) || v < mn || v > mx) return toast(`ใส่ค่า ${mn}–${mx}`);
      if (v === def && !tuned) return toast("เท่าค่าตั้งต้นอยู่แล้ว");
      try { await update(ref(db, "tune"), { [key]: Math.round(v) }); toast("บันทึกแล้ว"); } catch (e) { toast(errMsg(e)); }
    }, "btn primary mini");
    const rst = btn("↺", async () => { try { await update(ref(db, "tune"), { [key]: null }); toast("กลับไปค่าตั้งต้นแล้ว"); } catch (e) { toast(errMsg(e)); } }, "btn ghost mini"); rst.title = "รีเซ็ตเป็นค่าตั้งต้น"; rst.disabled = !tuned;
    ctl.append(inp, save, rst, info); row.append(ctl); box.append(row);
  });
}

/* ---- 📈 แดชบอร์ดเศรษฐกิจ ---- */
const ECON_KEYS = [["srch", "🔍 ค้นหา"], ["found", "🎒 เจอของ"], ["gacha", "🎰 หมุนกาชา"], ["use", "🧪 ใช้ไอเทม"], ["craft", "🔧 คราฟต์"], ["mkt", "🏪 ตลาด"], ["zwin", "⚔️ ชนะซอมบี้"], ["scrap", "🔩 ซ่อมกำแพง (ชิ้น)"], ["smash", "🔨 ทุบกำแพง"], ["trav", "🧭 เดินทาง"], ["evt", "🪂 ร่วมเหตุการณ์"], ["bty", "💰 เก็บค่าหัว"]];
async function econLoad(force) {
  const C = state.econCache; if (!force && C && serverNow() - C.at < 60000) return C.data;
  const [ach, stats, gh, gz] = await Promise.all([get(ref(db, "ach")), get(ref(db, "stats")), get(ref(db, "gachaMeta/human")), get(ref(db, "gachaMeta/zombie"))]);
  const A = ach.val() || {}, uids = [...new Set([...Object.keys(A), ...Object.keys(stats.val() || {})])];
  const people = await Promise.all(uids.map(async (uid) => {
    const [u, inv] = await Promise.all([get(ref(db, "users/" + uid)).then((x) => x.val()).catch(() => null), get(ref(db, "inventory/" + uid)).then((x) => x.val()).catch(() => null)]);
    return { uid, u, inv: inv || {}, a: A[uid] || null };
  }));
  let pool = { human: null, zombie: null };
  try { for (const f of ["human", "zombie"]) { const p = (await get(ref(db, "gachaPool/" + f))).val() || {}; const by = {}; Object.values(p).forEach((x) => { if (x?.id) by[x.id] = (by[x.id] || 0) + (x.qty || 1); }); pool[f] = by; } } catch { /* ไม่มีสิทธิ์อ่าน */ }
  const data = { at: serverNow(), people, gaLeft: { human: Object.keys(gh.val() || {}).length, zombie: Object.keys(gz.val() || {}).length }, pool };
  state.econCache = { at: data.at, data }; return data;
}
const isFoodItem = (id) => { const d = ITEMS[id]; return !!d && d.type === "consumable" && ((d.food || 0) > 0 || (d.water || 0) > 0); };
function econCompute(D) {
  const P = D.people.filter((p) => p.u), now = D.at, tot = {}, inv = {};
  ECON_KEYS.forEach(([k]) => { tot[k] = 0; });
  D.people.forEach((p) => ECON_KEYS.forEach(([k]) => { tot[k] += p.a?.c?.[k] || 0; }));
  let noFood = 0;
  P.forEach((p) => { let f = 0; Object.entries(p.inv).forEach(([id, it]) => { const q = it?.qty || 0; const key = it?.id || id; inv[key] = (inv[key] || 0) + q; if (isFoodItem(key)) f += q; }); p.food = f; if (f === 0 && p.u.hp > 0) noFood++; });
  const pullers = D.people.map((p) => ({ n: p.u?.username || p.a?.n || "?", g: p.a?.c?.gacha || 0 })).filter((x) => x.g > 0).sort((a, b) => b.g - a.g);
  return {
    n: P.length, human: P.filter((p) => p.u.faction !== "zombie").length, zombie: P.filter((p) => p.u.faction === "zombie").length,
    active: P.filter((p) => now - (p.u.seenAt || 0) < 86400000).length, dead: P.filter((p) => p.u.hp === 0).length, noFood,
    withAch: D.people.filter((p) => p.a?.c).length, tot, inv, pullers, totalPulls: tot.gacha
  };
}
function econSnapshot(tot) {
  const now = Date.now(), key = "zc_econ_snap", L = LS.get(key, []);
  const base = L.filter((x) => now - x.t >= 3600000 && now - x.t <= 30 * 3600000).sort((a, b) => a.t - b.t)[0] || L.filter((x) => now - x.t >= 600000).sort((a, b) => b.t - a.t)[0] || null;
  if (!L.length || now - L[L.length - 1].t > 3600000) { L.push({ t: now, tot }); LS.set(key, L.slice(-30)); }
  return base;
}
// ---- 📉 สถิติผู้เล่น (แดชบอร์ดเจ้าของ) — ฟังก์ชันล้วน ทดสอบที่ tests/sim/telemetry.js • ไม่เขียนข้อมูลเพิ่มนอกจากตัวนับ ach (patk/phit/pdmg z|h, pdie)
const RET_B = [[600000, "ไม่ถึง 10 นาที"], [3600000, "10 นาที–1 ชม."], [86400000, "1–24 ชม."], [259200000, "1–3 วัน"], [Infinity, "เกิน 3 วัน"]];
const medianOf = (arr) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function retCompute(people, now) {   // "หายไป" = ไม่เห็นในเกมเกิน 24 ชม. • ระยะที่เล่น = seenAt − createdAt
  const rows = people.filter((p) => p.u && typeof p.u.createdAt === "number" && p.u.role !== "owner" && p.u.role !== "gm");
  const isGone = (p) => now - (typeof p.u.seenAt === "number" ? p.u.seenAt : p.u.createdAt) > 86400000;
  const gone = rows.filter(isGone), buckets = RET_B.map(([, label]) => ({ label, n: 0 }));
  gone.forEach((p) => { const life = Math.max(0, (typeof p.u.seenAt === "number" ? p.u.seenAt : p.u.createdAt) - p.u.createdAt); buckets[RET_B.findIndex(([lim]) => life < lim)].n++; });
  const srch = gone.map((p) => p.a?.c?.srch || 0), zones = {};
  gone.forEach((p) => { const z = p.u.zone || "?"; zones[z] = (zones[z] || 0) + 1; });
  const fac = (f) => { const all = rows.filter((p) => (p.u.faction === "zombie" ? "zombie" : "human") === f); return { n: all.length, gone: all.filter(isGone).length }; };
  return { n: rows.length, gone: gone.length, active: rows.length - gone.length, buckets, medSrch: medianOf(srch), never: srch.filter((x) => x < 1).length, dead: gone.filter((p) => p.u.hp === 0).length, zones: Object.entries(zones).sort((x, y) => y[1] - x[1]).slice(0, 3), human: fac("human"), zombie: fac("zombie") };
}
const pvpLineKey = () => { const e = state.evo || {}, t = [["h", e.h || 0], ["g", e.g || 0], ["s", e.s || 0]].sort((a, b) => b[1] - a[1])[0]; return t[1] >= 1 ? t[0] : "n"; };   // สายวิวัฒนาการหลักของผู้ถูกโจมตี (ขั้นสูงสุด; ยังไม่วิวัฒนาการ = n)
function pvpLinesCompute(people) {   // ซอมบี้ถูกโจมตีแยกตามสาย (บันทึกโดยผู้ถูกโจมตีเอง): qa รับโจมตี / qh โดน / qd ดาเมจรวม / qx ล้ม
  const R = {}; ["h", "g", "s", "n"].forEach((l) => { R[l] = { atk: 0, hit: 0, dmg: 0, died: 0 }; });
  people.forEach((p) => { const c = p.a?.c; if (!c) return; for (const l in R) { R[l].atk += c["qa" + l] || 0; R[l].hit += c["qh" + l] || 0; R[l].dmg += c["qd" + l] || 0; R[l].died += c["qx" + l] || 0; } });
  return R;
}
function pvpCompute(people) {   // ตัวนับบันทึกโดยผู้ถูกโจมตี: matrix[ฝ่ายผู้โจมตี][ฝ่ายผู้ถูกโจมตี]
  const M = { z: { human: { atk: 0, hit: 0, dmg: 0 }, zombie: { atk: 0, hit: 0, dmg: 0 } }, h: { human: { atk: 0, hit: 0, dmg: 0 }, zombie: { atk: 0, hit: 0, dmg: 0 } } }, died = { human: 0, zombie: 0 };
  people.forEach((p) => { const c = p.a?.c; if (!c || !p.u) return; const df = p.u.faction === "zombie" ? "zombie" : "human"; ["z", "h"].forEach((af) => { const m = M[af][df]; m.atk += c["patk" + af] || 0; m.hit += c["phit" + af] || 0; m.dmg += c["pdmg" + af] || 0; }); died[df] += c.pdie || 0; });
  return { M, died };
}
// ---- /สถิติผู้เล่น
async function econRender(box) {
  box.append(mk("p", "muted", "กำลังรวบรวมข้อมูล…"));
  try {
    const D = await econLoad(), X = econCompute(D); box.textContent = "";
    const base = econSnapshot(X.tot), fmt = (n) => Number(n).toLocaleString("en-US");
    const flags = [];
    const left = D.gaLeft.human + D.gaLeft.zombie;
    if (D.gaLeft.human <= 15 || D.gaLeft.zombie <= 15) flags.push(`🎰 ตู้กาชาเหลือน้อย (มนุษย์ ${D.gaLeft.human} • ซอมบี้ ${D.gaLeft.zombie} ช่อง) — เติมของก่อนคนหมุนไม่ได้`);
    if (X.pullers[0] && X.totalPulls >= 15 && X.pullers[0].g / X.totalPulls > 0.4) flags.push(`🎰 ${X.pullers[0].n} หมุนกาชา ${Math.round(100 * X.pullers[0].g / X.totalPulls)}% ของทั้งเซิร์ฟเวอร์`);
    if (X.n >= 3 && X.noFood / X.n >= 0.3) flags.push(`🍖 ผู้เล่น ${X.noFood}/${X.n} คนไม่มีอาหาร/น้ำในกระเป๋าเลย`);
    const hit = X.tot.srch ? X.tot.found / X.tot.srch : null;
    if (hit !== null && X.tot.srch >= 100 && (hit < 0.15 || hit > 0.65)) flags.push(`🔍 อัตราเจอของ ${Math.round(hit * 100)}% ${hit < 0.15 ? "ต่ำมาก คนอาจหมดสนุก" : "สูงมาก ของอาจล้น"}`);
    if (X.withAch < X.n) flags.push(`ℹ️ ตัวเลขกิจกรรมนับเฉพาะคนที่เปิดเวอร์ชันใหม่แล้ว ${X.withAch}/${X.n} คน`);
    box.append(mk("div", "hub-day", "⚠️ ข้อสังเกต"));
    if (flags.length) flags.forEach((f) => box.append(mk("div", "", f))); else box.append(mk("div", "muted", "ยังไม่พบสัญญาณผิดปกติ"));
    box.append(mk("div", "hub-day", "👥 ผู้เล่น"));
    box.append(mk("div", "", `ทั้งหมด ${X.n} • 🧑 ${X.human} • 🧟 ${X.zombie} • ออนใน 24 ชม. ${X.active} • ล้มอยู่ ${X.dead}`));
    try {   // 📉 ผู้เล่นใหม่หายตรงไหน + 🥊 PvP
      const R = retCompute(D.people, D.at), V = pvpCompute(D.people), pc = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "–");
      box.append(mk("div", "hub-day", "📉 ผู้เล่นหายตรงไหน (ไม่เห็นเกิน 24 ชม. = หาย • ไม่นับ GM/เจ้าของ)"));
      box.append(mk("div", "", `สมัครแล้ว ${R.n} • ยังเล่นอยู่ ${R.active} • หายไป ${R.gone} • 🧑 หาย ${R.human.gone}/${R.human.n} • 🧟 หาย ${R.zombie.gone}/${R.zombie.n}`));
      if (R.gone) {
        box.append(mk("div", "", "ระยะที่เล่นก่อนหาย: " + R.buckets.map((x) => `${x.label} ${x.n}`).join(" • ")));
        box.append(mk("div", "", `คนที่หาย: ค้นหามัธยฐาน ${R.medSrch === null ? "–" : Math.round(R.medSrch)} ครั้ง • ไม่เคยค้นหาเลย ${R.never} • หายตอนล้มอยู่ ${R.dead}${R.zones.length ? " • โซนล่าสุด " + R.zones.map(([z, n]) => `${ZONES[z]?.name || z} ${n}`).join(", ") : ""}`));
      }
      box.append(mk("div", "hub-day", "🥊 PvP (นับเมื่อผู้ถูกโจมตีเล่นเวอร์ชันนี้ • ผู้โจมตี→ผู้ถูกโจมตี)"));
      const F = { z: "🧟", h: "🧑" }, DF = { human: "🧑", zombie: "🧟" }; let any = false;
      ["z", "h"].forEach((af) => ["human", "zombie"].forEach((df) => { const m = V.M[af][df]; if (!m.atk) return; any = true; box.append(mk("div", "", `${F[af]}→${DF[df]}: โจมตี ${m.atk} ครั้ง โดน ${m.hit} (${pc(m.hit, m.atk)}) • ดาเมจเฉลี่ย ${m.hit ? (m.dmg / m.hit).toFixed(1) : "–"}`)); }));
      { const LN = { h: "🩸 ตะกละ", g: "🗿 ซากหนา", s: "🕷️ เลื้อยคลาน", n: "ยังไม่วิวัฒน์" }, PL = pvpLinesCompute(D.people); Object.entries(PL).forEach(([l, m]) => { if (m.atk) box.append(mk("div", "", `🧟 ${LN[l]} ถูกโจมตี ${m.atk} ครั้ง โดน ${m.hit} (${pc(m.hit, m.atk)}) • ดาเมจที่รับ/ครั้งที่โดน ${m.hit ? (m.dmg / m.hit).toFixed(1) : "–"} • ล้ม ${m.died}`)); }); }
      box.append(mk("div", any ? "" : "muted", any ? `ล้มจาก PvP: 🧑 ${V.died.human} • 🧟 ${V.died.zombie}` : "ยังไม่มีข้อมูล PvP (เริ่มนับเมื่อผู้ถูกโจมตีอัปเดตเวอร์ชันนี้)"));
    } catch (e) { console.warn("telemetry", e); }
    const hrs = base ? Math.max(1, Math.round((Date.now() - base.t) / 3600000)) : 0;
    box.append(mk("div", "hub-day", `📊 กิจกรรมรวม (ตลอดชีพ${base ? ` • เทียบ ${hrs} ชม.ก่อน` : " • ยังไม่มีสแนปช็อตเก่าให้เทียบ — เปิดซ้ำภายหลัง"})`));
    ECON_KEYS.forEach(([k, label]) => { const d = base ? X.tot[k] - (base.tot[k] || 0) : null; box.append(mk("div", "", `${label}: ${fmt(X.tot[k])}${d ? `  (+${fmt(d)})` : ""}`)); });
    if (hit !== null) box.append(mk("div", "muted", `อัตราเจอของจากการค้นหา ≈ ${Math.round(hit * 100)}%`));
    box.append(mk("div", "hub-day", "🎰 กาชา"));
    box.append(mk("div", "", `เหลือในตู้: 🧑 ${D.gaLeft.human} ช่อง • 🧟 ${D.gaLeft.zombie} ช่อง`));
    if (X.pullers.length) box.append(mk("div", "", "ผู้หมุนมากสุด: " + X.pullers.slice(0, 3).map((x, i) => `${i + 1}. ${x.n} ${x.g}`).join("  ")));
    ["human", "zombie"].forEach((f) => { const p = D.pool[f]; if (p) { const top = Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, q]) => `${ITEMS[id]?.icon || "📦"}×${q}`).join(" "); box.append(mk("div", "muted", `ของในตู้ ${f === "human" ? "🧑" : "🧟"}: ${top || "ว่าง"}`)); } });
    box.append(mk("div", "hub-day", "🎒 ของในมือผู้เล่นทุกคนรวมกัน"));
    const top = Object.entries(X.inv).filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    box.append(mk("div", "", top.length ? top.map(([id, q]) => `${ITEMS[id]?.icon || "📦"} ${ITEMS[id]?.name || id} ${fmt(q)}`).join(" • ") : "ไม่มีข้อมูล"));
    const row = mk("div", "row"); row.append(btn("รีเฟรชข้อมูล", () => { state.econCache = null; admTab("econ"); }, "btn ghost mini")); box.append(row);
  } catch (e) { box.textContent = ""; box.append(mk("p", "muted", "โหลดแดชบอร์ดไม่สำเร็จ ลองใหม่อีกครั้ง")); console.error("econ", e); }
}

if (HAS_DOM) initNpcUi();
