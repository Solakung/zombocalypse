// ที่พัก (🏠): สถานีตั้งเวลา / โต๊ะงาน / อัปเกรด / ของตกแต่ง — ย้ายตรรกะมาจาก database_rules.json (base/{uid}, baseTx/{uid} และกิ่ง baseTx ของ inventory)
// ค่าคงที่ทุกตัวต้องตรงกับ script.js (BASE_P, BASE_CAP, BASE_UP, BENCH, DECO)
const BASE_P = { w: 7200000, m: 10800000, t: 14400000 };   // เวลาต่อ 1 ชิ้น (ms)
const BASE_CAP = { w: 4, m: 3, t: 3 };                      // เพดานสะสม
const BASE_UP = [15, 40, 90];                               // ค่าอัปเกรดระดับ 1-3
const BENCH = {                                             // r: [วัตถุดิบ, จำนวน, ผลผลิต, จำนวน, เวลา ms]
  1: ["water", 2, "water_jug", 1, 7200000],
  2: ["canned_food", 2, "soup", 2, 10800000],
  3: ["moss", 3, "bandage", 2, 10800000],
  4: ["bandage", 3, "medkit", 1, 14400000],
  5: ["canned_food", 2, "army_meal", 1, 14400000],
  6: ["rotten_meat", 4, "bandage", 1, 10800000]
};
const DECO_COST = { d0: 10, d1: 10, d2: 15, d3: 15, d4: 20, d5: 25, d6: 30, d7: 40, d8: 50, d9: 60, d10: 80, d11: 100 };

const { fail, withLock, takeItem, addItem } = require("./lib");

function makeBase(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = data && data.a;
    return withLock(db, uid, now, async () => {
      const [pS, bS] = await Promise.all([db.ref(`users/${uid}`).get(), db.ref(`base/${uid}`).get()]);
      const p = pS.val(), base = bS.val() || {};
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      if (p.zone !== "safe" || !(p.hp > 0)) fail("failed-precondition", "ต้องอยู่ที่ Safe Zone และมีชีวิต");
      const lv = Math.max(0, Math.min(3, base.lv || 0));
      const upItem = p.faction === "zombie" ? "rotten_meat" : "scrap";
      const set = (path, v) => db.ref(`base/${uid}/${path}`).set(v);

      if (a === "place") {
        const i = Number(data.i), k = data.k;
        if (!Number.isInteger(i) || i < 1 || i > 5 || !BASE_P[k]) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
        if (i > 2 + lv) fail("failed-precondition", "ช่องนี้ยังไม่ปลดล็อก");
        if (base["s" + i]) fail("failed-precondition", "ช่องนี้มีสถานีอยู่แล้ว");
        await set("s" + i, { k, t: now });
        return { ok: true };
      }
      if (a === "dismantle") {
        const i = Number(data.i); if (!Number.isInteger(i) || i < 1 || i > 5 || !base["s" + i]) fail("failed-precondition", "ไม่มีสถานีให้รื้อ");
        await set("s" + i, null); return { ok: true };
      }
      if (a === "collect") {
        const i = Number(data.i), rec = base["s" + i];
        if (!Number.isInteger(i) || i < 1 || i > 5 || !rec || !BASE_P[rec.k] || typeof rec.t !== "number") fail("failed-precondition", "ไม่มีสถานีให้เก็บ");
        const P = BASE_P[rec.k], cap = BASE_CAP[rec.k], raw = Math.floor((now - rec.t) / P);
        if (!(raw >= 1)) return { ok: true, item: null, n: 0 };
        const u = Math.min(cap, raw), item = rec.k === "w" ? "water" : rec.k === "m" ? "moss" : p.faction === "zombie" ? "rotten_meat" : "canned_food";
        await addItem(db, uid, item, u);   // เพิ่มของก่อน (ถ้าล้มเหลวจะยังไม่ขยับเวลา) แล้วค่อยรีเซ็ตเวลาสถานี
        await set(`s${i}/t`, raw >= cap ? now : rec.t + u * P);
        return { ok: true, item, n: u };
      }
      if (a === "upgrade") {
        if (lv >= 3) fail("failed-precondition", "ที่พักอัปเกรดสูงสุดแล้ว");
        if (!(await takeItem(db, uid, upItem, BASE_UP[lv]))) fail("failed-precondition", "ของไม่พอสำหรับอัปเกรด");
        await set("lv", lv + 1); return { ok: true, lv: lv + 1 };
      }
      if (a === "deco") {
        const d = data.d, cost = DECO_COST[d];
        if (!cost) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
        if (base.deco && base.deco[d]) fail("failed-precondition", "มีของตกแต่งชิ้นนี้แล้ว");
        if (!(await takeItem(db, uid, upItem, cost))) fail("failed-precondition", "ของไม่พอ");
        await set("deco/" + d, true); return { ok: true };
      }
      if (a === "benchStart" || a === "benchCancel" || a === "benchCollect") {
        const j = Number(data.j);
        if (!(j === 1 || (j === 2 && lv >= 2))) fail("failed-precondition", "ช่องงานนี้ยังไม่ปลดล็อก");
        const rec = base["j" + j];
        if (a === "benchStart") {
          const r = String(data.r), R = BENCH[r];
          if (rec) fail("failed-precondition", "ช่องงานนี้ไม่ว่าง");
          if (!R) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
          if (!(await takeItem(db, uid, R[0], R[1]))) fail("failed-precondition", "วัตถุดิบไม่พอ");
          await set("j" + j, { r, t: now }); return { ok: true };
        }
        if (!rec) fail("failed-precondition", "ไม่มีงานในช่องนี้");
        if (a === "benchCancel") { await set("j" + j, null); return { ok: true }; }
        const R = BENCH[rec.r];
        if (!R || typeof rec.t !== "number" || rec.t + R[4] > now) fail("failed-precondition", "งานยังไม่เสร็จ");
        await addItem(db, uid, R[2], R[3]);
        await set("j" + j, null);
        return { ok: true, item: R[2], n: R[3] };
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}

module.exports = { makeBase, BASE_P, BASE_CAP, BASE_UP, BENCH, DECO_COST };
