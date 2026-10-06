// Cloud Functions ของ ZOMBOCALYPSE — ย้ายตรรกะตรวจสอบหนัก ๆ จาก database_rules.json มาไว้ที่นี่ทีละระบบ
// ฟังก์ชันทุกตัวใช้ Admin SDK (ข้าม rules) จึงต้องตรวจสิทธิ์/เงื่อนไขเองเสมอ
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { makeBase } = require("./base");
const { makeMarket } = require("./market");

// ฐานข้อมูลเกมอยู่ที่ asia-southeast1 (ไม่ใช่ us-central1) → ต้องระบุ URL เอง ไม่งั้น Admin SDK เดาเป็น <project>-default-rtdb.firebaseio.com แล้วต่อไม่ถึง
admin.initializeApp({ databaseURL: "https://zompocalypse-137a6-default-rtdb.asia-southeast1.firebasedatabase.app" });
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
