// helper ร่วมของฟังก์ชันเกม (ที่พัก, ตลาด, ...) — ทุกตัวใช้ Admin SDK (ข้าม rules) จึงต้องตรวจเงื่อนไขเองเสมอ
const { HttpsError } = require("firebase-functions/v2/https");

const fail = (code, msg) => { throw new HttpsError(code, msg); };

// ล็อกต่อผู้เล่น: กันกดซ้อน/ยิงฟังก์ชันพร้อมกัน (โหนด locks ไม่มีในไฟล์ rules → ฝั่งไคลเอนต์เข้าไม่ได้)
async function withLock(db, uid, now, fn) {
  const ref = db.ref(`locks/${uid}`);
  const res = await ref.transaction((cur) => (cur && cur.busy && now - cur.busy < 10000 ? undefined : { busy: now }));
  if (!res.committed) fail("aborted", "กำลังประมวลผลอยู่ ลองใหม่อีกครั้ง");
  try { return await fn(); } finally { await ref.remove().catch(() => {}); }
}

async function takeItem(db, uid, id, qty) {
  let ok = false;
  const res = await db.ref(`inventory/${uid}/${id}`).transaction((cur) => {
    ok = false;
    if (cur === null) return cur;   // รอบแรกของ transaction ยังไม่มีค่าในแคช → ให้เซิร์ฟเวอร์ส่งค่าจริงมาแล้วรันซ้ำ (อย่า abort)
    if (cur.id !== id || !(cur.qty >= qty)) return undefined;
    ok = true;
    return cur.qty - qty > 0 ? { ...cur, qty: cur.qty - qty } : null;
  });
  return res.committed && ok;
}
// ช่องชนิดเดียวกันเก็บต่อกัน (เหมือนฝั่งเกมเดิม): มีของชนิดเดียวกันอยู่แล้ว → บวก qty / ไม่มี → สร้างช่องใหม่
// ถ้าช่องนั้นมีของคนละชนิดอยู่ (ข้อมูลผิดปกติ) จะไม่เขียนทับ — ยกเลิกทั้งคำสั่งก่อนแตะข้อมูลอื่น
async function addItem(db, uid, id, qty) {
  const res = await db.ref(`inventory/${uid}/${id}`).transaction((cur) => {
    if (!cur) return { id, qty };
    return cur.id === id && cur.qty > 0 ? { ...cur, qty: cur.qty + qty } : undefined;
  });
  if (!res.committed) fail("failed-precondition", "ช่องกระเป๋านี้ใช้ไม่ได้");
}

// เพิ่มของแบบไม่ทะลุเพดาน 99 ต่อช่อง (rules ฝั่งกระเป๋า) — เต็ม/ช่องใช้ไม่ได้ → คืน false (ไม่เขียนอะไร)
async function addCapped(db, uid, id, qty) {
  const res = await db.ref(`inventory/${uid}/${id}`).transaction((cur) => {
    if (!cur) return { id, qty };
    if (cur.id !== id || !(cur.qty > 0) || cur.qty + qty > 99) return undefined;
    return { ...cur, qty: cur.qty + qty };
  });
  return res.committed;
}
// แจกของหลายชิ้น: ถ้าชิ้นใดไม่สำเร็จจะคืนชิ้นก่อนหน้า (ไม่ค้างครึ่งทาง) และคืน false
async function grantAll(db, uid, list) {
  const done = [];
  for (const [id, q] of list) {
    if (!(await addCapped(db, uid, id, q))) {
      for (const [rid, rq] of done) await db.ref(`inventory/${uid}/${rid}`).transaction((x) => (x && x.qty > rq ? { ...x, qty: x.qty - rq } : null));
      return false;
    }
    done.push([id, q]);
  }
  return true;
}
const TZ = 25200000, DAY = 86400000;
const dayIdx = (now) => Math.floor((now + TZ) / DAY);
const dayEnd = (now) => (dayIdx(now) + 1) * DAY - TZ;
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

module.exports = { fail, withLock, takeItem, addItem, addCapped, grantAll, dayIdx, dayEnd, rng, TZ, DAY };
