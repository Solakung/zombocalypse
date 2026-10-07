// Cloud Functions ของ ZOMBOCALYPSE — ย้ายตรรกะตรวจสอบหนัก ๆ จาก database_rules.json มาไว้ที่นี่ทีละระบบ
// ฟังก์ชันทุกตัวใช้ Admin SDK (ข้าม rules) จึงต้องตรวจสิทธิ์/เงื่อนไขเองเสมอ
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { makeBase } = require("./base");
const { makeMarket } = require("./market");
const { makePass } = require("./pass");
const { makeEvents } = require("./events");
const { makeDaily } = require("./daily");
const { makeCamp } = require("./camp");
const { makeWorld } = require("./world");
const { makeDive } = require("./dive");
const { makeNemesis } = require("./nemesis");
const { makeRadio } = require("./radio");
const { makeCaravan } = require("./caravan");
const { makeGarden } = require("./garden");
const { makeCol } = require("./col");
const { makeHome } = require("./home");
const { makeProfile } = require("./profile");
const { makeLearn } = require("./learn");
const { makeAbility } = require("./ability");
const { makeWar } = require("./war");
const { makeCasino } = require("./casino");
const { makeSlave } = require("./slave");
const { makeMutate } = require("./mutate");
const { makeHc } = require("./hc");
const { makeZwar } = require("./zwar");
const { makeForge } = require("./forge");
const { makeHboss } = require("./hboss");
const { makeCrim } = require("./crim");
const { makeFxw } = require("./fxw");
const { makeUse } = require("./use");

// ฐานข้อมูลเกมอยู่ที่ asia-southeast1 (ไม่ใช่ us-central1) → ต้องระบุ URL เอง ไม่งั้น Admin SDK เดาเป็น <project>-default-rtdb.firebaseio.com แล้วต่อไม่ถึง
admin.initializeApp({ databaseURL: "https://zompocalypse-137a6-default-rtdb.asia-southeast1.firebasedatabase.app", storageBucket: "zompocalypse-137a6.firebasestorage.app" });
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 });   // region เดียวกับฐานข้อมูล

// ฟังก์ชันทดสอบ: ยืนยันว่า deploy ได้ + ล็อกอินผ่านเข้ามาถึงฟังก์ชัน (ยังไม่แตะข้อมูลเกม)
exports.ping = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "ต้องล็อกอินก่อน");
  return { ok: true, uid: req.auth.uid, serverTime: Date.now() };
});

// 🏠 ที่พัก: ทุกการเขียนข้อมูล base/{uid} และ inventory ที่เกี่ยวกับที่พัก ต้องผ่านฟังก์ชันนี้ (rules ปิดการเขียนตรงแล้ว)
const baseSys = makeBase(admin.database());
exports.baseAct = onCall(async (req) => {
  try { return await baseSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("baseAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }   // error ที่ไม่ใช่ของเกม → ลง Logs ให้ตามได้
});

// 🏪 ตลาด/ตลาดมืด/ฝากของ: ทุกการเขียน market, marketPayouts, bm, giftTx และการย้ายของที่เกี่ยวข้อง ต้องผ่านฟังก์ชันนี้ (rules ปิดการเขียนตรงแล้ว)
const marketSys = makeMarket(admin.database());
exports.marketAct = onCall(async (req) => {
  try { return await marketSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("marketAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🎟️ Season Pass: ภารกิจรายวัน/รายสัปดาห์ + รางวัล 30 ระดับ (โหนด pass/{uid} เขียนได้เฉพาะฟังก์ชันนี้ — ไม่มีใน rules)
const passSys = makePass(admin.database());
exports.passAct = onCall(async (req) => {
  try { return await passSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("passAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🎭 เหตุการณ์สุ่มแบบเลือกทางระหว่างค้นหา (โหนด enc/{uid} เขียนได้เฉพาะฟังก์ชันนี้ — ไม่มีใน rules)
const eventSys = makeEvents(admin.database());
exports.eventAct = onCall(async (req) => {
  try { return await eventSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("eventAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🎁 หีบรายวัน + 🎯 ล่าค่าหัว (โหนด crate, hunt — ไม่มีใน rules)
const dailySys = makeDaily(admin.database());
exports.dailyAct = onCall(async (req) => {
  try { return await dailySys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("dailyAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🏕️ ต้นไม้อัปเกรดค่าย + 🐾 ระดับสัตว์เลี้ยง (โหนด camp, pet2 — ไม่มีใน rules)
const campSys = makeCamp(admin.database());
exports.campAct = onCall(async (req) => {
  try { return await campSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("campAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🌍 อีเวนต์โลกรายสัปดาห์ (โหนด world — ไม่มีใน rules)
const worldSys = makeWorld(admin.database());
exports.worldAct = onCall(async (req) => {
  try { return await worldSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("worldAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🕳️ ดิ่งลึก (โหนด dive, dive2 — ไม่มีใน rules)
const diveSys = makeDive(admin.database());
exports.diveAct = onCall(async (req) => {
  try { return await diveSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("diveAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 👹 ศัตรูคู่อาฆาต (โหนด nem — ไม่มีใน rules)
const nemSys = makeNemesis(admin.database());
exports.nemAct = onCall(async (req) => {
  try { return await nemSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("nemAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 📻 ปริศนาวิทยุ (โหนด radio — ไม่มีใน rules)
const radioSys = makeRadio(admin.database());
exports.radioAct = onCall(async (req) => {
  try { return await radioSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("radioAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🐪 ขบวนพ่อค้าเร่ (โหนด caravan — ไม่มีใน rules)
const caravanSys = makeCaravan(admin.database());
exports.caravanAct = onCall(async (req) => {
  try { return await caravanSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("caravanAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🌱 แปลงปลูกในที่พัก (โหนด garden — ไม่มีใน rules)
const gardenSys = makeGarden(admin.database());
exports.gardenAct = onCall(async (req) => {
  try { return await gardenSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("gardenAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 📖 สมุดสะสมแบบชุด + ความสมบูรณ์ของผู้รอดชีวิต (โหนด col — ไม่มีใน rules)
const colSys = makeCol(admin.database());
exports.colAct = onCall(async (req) => {
  try { return await colSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("colAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🛋️ บ้านของฉัน: จัดห้องเอง/ธีม/เยี่ยมห้อง/ถูกใจ/ห้องยอดนิยม (โหนด home, hw, hl — ไม่มีใน rules)
const homeSys = makeHome(admin.database());
exports.homeAct = onCall(async (req) => {
  try { return await homeSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("homeAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🪪 โปรไฟล์ตกแต่ง + รูปอัปโหลด (แปลง webp < 100 KB ฝั่งเซิร์ฟเวอร์ด้วย sharp) — โหนด prof, profRep; Storage: raw/{uid} (ชั่วคราว), profile/{uid}.webp
const profSys = makeProfile(admin.database(), () => admin.storage().bucket());
exports.profAct = onCall({ memory: "512MiB", timeoutSeconds: 60 }, async (req) => {
  try { return await profSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("profAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🧭 บทเรียนแนะนำการเล่น 12 ขั้น แยกมนุษย์/ซอมบี้ (โหนด learn — ไม่มีใน rules)
const learnSys = makeLearn(admin.database());
exports.learnAct = onCall(async (req) => {
  try { return await learnSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("learnAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// ⚡ ความสามารถประจำอาชีพ/สายวิวัฒนาการ (โหนด abil — ไม่มีใน rules)
const abilSys = makeAbility(admin.database());
exports.abilAct = onCall(async (req) => {
  try { return await abilSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("abilAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// ⚔️ ศึกใหญ่ประจำสัปดาห์ รางวัลฝ่ายชนะ/โบนัสทั้งฝ่าย (โหนด war — ไม่มีใน rules; อ่าน coop ด้วย Admin SDK)
const warSys = makeWar(admin.database());
exports.warAct = onCall(async (req) => {
  try { return await warSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("warAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🎰 คาสิโนเถื่อน — แปลงของเป็นชิป เกมบ้าน หนี้/เลือด (โหนด casino — ไม่มีใน rules)
const casinoSys = makeCasino(admin.database());
exports.casinoAct = onCall(async (req) => {
  try { return await casinoSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("casinoAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🃏 โต๊ะสลาฟหลายผู้เล่นในคาสิโนเถื่อน (โหนด ctable/cpub/chand — เขียนโดย Admin SDK เท่านั้น)
const slaveSys = makeSlave(admin.database());
exports.slaveAct = onCall(async (req) => {
  try { return await slaveSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("slaveAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🧬 มิวเตชันซอมบี้ขั้น 5–8 จ่ายด้วย DNA (โหนด mut — ไม่มีใน rules)
const mutSys = makeMutate(admin.database());
exports.mutAct = onCall(async (req) => {
  try { return await mutSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("mutAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 📡 ภารกิจ HC: ค้นพบธาราทั้งเซิร์ฟเวอร์ครั้งเดียว + ส่งชิ้นส่วน DNA (โหนด hc — อ่านได้เฉพาะ hc/state; coop/hc1 เขียนโดยฟังก์ชันเท่านั้น)
const hcSys = makeHc(admin.database(), admin);
exports.hcAct = onCall(async (req) => {
  try { return await hcSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("hcAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// ⚔️ แต้มศึกชิงโซนรายสัปดาห์ (coop/{zh|zz}… เขียนผ่านฟังก์ชันเท่านั้น — โหนด zwrl ไม่มีใน rules)
const zwarSys = makeZwar(admin.database(), admin);
exports.zwAct = onCall(async (req) => {
  try { return await zwarSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("zwAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🔨 คราฟต์อาวุธระดับต้น–กลาง (สูตรฝั่งเซิร์ฟเวอร์ — สร้างช่องอาวุธในกระเป๋าด้วย Admin SDK)
const forgeSys = makeForge(admin.database());
exports.forgeAct = onCall(async (req) => {
  try { return await forgeSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("forgeAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🏹 บอสเผ่ามนุษย์สำหรับผู้เล่นซอมบี้ (ปิดอยู่จนกว่าตั้ง tune hb_on = 1 — functions/hboss.js)
const hbossSys = makeHboss(admin.database());
exports.hbossAct = onCall(async (req) => {
  try { return await hbossSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("hbossAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// ⚔️ อาวุธติดสถานะ (มนุษย์): ค้นเจอ — ปิดอยู่จนกว่าตั้ง tune fxw_on = 1 (functions/fxw.js; คราฟต์ผ่าน forgeAct)
const fxwSys = makeFxw(admin.database());
exports.fxwAct = onCall(async (req) => {
  try { return await fxwSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("fxwAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🟠 สถานะส้ม (ฆ่าผู้เล่นฝ่ายเดียวกัน → เข้า Safe Zone ไม่ได้) — ปิดอยู่จนกว่าตั้ง tune crim_on = 1 (functions/crim.js)
const crimSys = makeCrim(admin.database());
exports.crimAct = onCall(async (req) => {
  try { return await crimSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("crimAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});

// 🍽️ ใช้ไอเทม กิน/ดื่ม/ยา/บัฟ/สเตตัส (ผลคำนวณและเขียนที่ฝั่งเซิร์ฟเวอร์ — rules ไม่มีกิ่ง eatSlot ของการกินแล้ว ยกเว้นยาในการสู้บอส)
const useSys = makeUse(admin.database(), admin);
exports.useAct = onCall(async (req) => {
  try { return await useSys.run(req.auth && req.auth.uid, req.data || {}); }
  catch (e) { if (!(e instanceof HttpsError)) logger.error("useAct failed", { uid: req.auth && req.auth.uid, data: req.data, err: String(e && e.stack || e) }); throw e; }
});
