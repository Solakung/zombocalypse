// Cloud Functions ของ ZOMBOCALYPSE — ย้ายตรรกะตรวจสอบหนัก ๆ จาก database_rules.json มาไว้ที่นี่ทีละระบบ
// ฟังก์ชันทุกตัวใช้ Admin SDK (ข้าม rules) จึงต้องตรวจสิทธิ์/เงื่อนไขเองเสมอ
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { makeBase } = require("./base");

admin.initializeApp();
setGlobalOptions({ region: "asia-southeast1", maxInstances: 10 });   // region เดียวกับฐานข้อมูล

// ฟังก์ชันทดสอบ: ยืนยันว่า deploy ได้ + ล็อกอินผ่านเข้ามาถึงฟังก์ชัน (ยังไม่แตะข้อมูลเกม)
exports.ping = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "ต้องล็อกอินก่อน");
  return { ok: true, uid: req.auth.uid, serverTime: Date.now() };
});

// 🏠 ที่พัก: ทุกการเขียนข้อมูล base/{uid} และ inventory ที่เกี่ยวกับที่พัก ต้องผ่านฟังก์ชันนี้ (rules ปิดการเขียนตรงแล้ว)
const baseSys = makeBase(admin.database());
exports.baseAct = onCall(async (req) => baseSys.run(req.auth && req.auth.uid, req.data || {}));
