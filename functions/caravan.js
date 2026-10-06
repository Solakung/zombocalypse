// 🐪 ขบวนพ่อค้าเร่: พ่อค้าปรากฏในโซนสุ่มคราวละ 3 ชั่วโมง (ทุก 6 ชั่วโมงมีหนึ่งรอบ) ขายของที่หาไม่ได้จากการค้นหา แลกด้วยของ
// ต้องอยู่ในโซนเดียวกับพ่อค้าถึงจะเห็น/ซื้อได้ (นอกโซนมีแค่คำใบ้) • สต็อกรวมทั้งเซิร์ฟเวอร์จำกัด ใครถึงก่อนได้ก่อน คนละไม่เกิน 1 ชิ้นต่อรายการ
// โหนด caravan/{รอบ} อยู่นอก rules → เขียนได้เฉพาะฟังก์ชันนี้
const { fail, withLock, takeItem, grantAll } = require("./lib");
const SLOT_MS = 6 * 3600000, OPEN_MS = 3 * 3600000;
const ZONES = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel"];
const HINT = { ruins: "ได้ยินเสียงระฆังจากกลางเมืองเก่า", mall: "มีกลิ่นน้ำหอมลอยมาจากซากห้าง", hospital: "ใครบางคนวางป้ายขายยาหน้าโรงพยาบาล", police: "ล้อเกวียนเสียงดังใกล้สถานีตำรวจ", forest: "ควันไฟลอยขึ้นจากชายป่า", factory: "ปล่องควันโรงงานมีผ้าแดงผูกอยู่", port: "ธงแปลกตาโบกที่ท่าเรือ", base: "มีรถบรรทุกเก่าจอดหน้าฐานทัพ", tunnel: "แสงตะเกียงวาบวับจากปากอุโมงค์" };
const NAMES = ["ลุงฮวด", "ป้าแก้ว", "เฮียตู่", "ซิสเตอร์เมย์", "หนุ่มเร่", "ลุงติ๋ม", "ยายพร", "อาหมวย"];
// สินค้า: [รหัส, จำนวน, ราคา(ของแลก...), สต็อกรวม] — ทุกรหัสอยู่ใน whitelist กระเป๋า
const GOODS = [
  { id: "kevlar_vest", q: 1, cost: [["steel_plate", 3], ["scrap", 20]], stock: 3 },
  { id: "hazmat_suit", q: 1, cost: [["chem_catalyst", 2], ["scrap", 15]], stock: 3 },
  { id: "trauma_kit", q: 2, cost: [["medkit", 2], ["bandage", 4]], stock: 6 },
  { id: "serum", q: 2, cost: [["chem", 6], ["water", 3]], stock: 6 },
  { id: "stim_shot", q: 2, cost: [["chem", 5], ["energy_drink", 1]], stock: 6 },
  { id: "army_meal", q: 4, cost: [["canned_food", 6]], stock: 8 },
  { id: "circuit_board", q: 1, cost: [["copper_wire", 4], ["battery_pack", 2]], stock: 5 },
  { id: "lab_core", q: 1, cost: [["data_chip", 1], ["gold_watch", 1]], stock: 2 },
  { id: "survivor_badge", q: 1, cost: [["scrap", 12], ["rusty_nails", 6]], stock: 5 },
  { id: "fish_stew", q: 3, cost: [["fish", 3], ["water", 1]], stock: 8 },
  { id: "mutant_gland", q: 2, cost: [["rotten_meat", 10]], stock: 6 },
  { id: "survivor_badge", q: 2, cost: [["gold_watch", 1]], stock: 3, tag: "b" },
  { id: "rabbit_foot", q: 1, cost: [["lab_sample", 3], ["gold_watch", 1]], stock: 1 },
  { id: "seed_glow", q: 2, cost: [["serum", 1], ["scrap", 8]], stock: 4, f: "h" },
  { id: "seed_shroom", q: 2, cost: [["army_meal", 1], ["scrap", 6]], stock: 4, f: "h" },
  { id: "seed_bloodroot", q: 2, cost: [["mutant_gland", 1], ["rotten_meat", 6]], stock: 4, f: "z" },
  { id: "seed_maggot", q: 3, cost: [["rotten_meat", 8]], stock: 6, f: "z" },
  { id: "night_goggles", q: 1, cost: [["circuit_board", 1], ["battery_pack", 2], ["scrap", 10]], stock: 2 }
];
const GOOD_KEY = (g) => `${g.id}${g.tag || ""}`;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const slotOf = (now) => Math.floor(now / SLOT_MS);
const openNow = (now) => now - slotOf(now) * SLOT_MS < OPEN_MS;
const zoneOf = (s) => ZONES[hash("cz" + s) % ZONES.length];
const nameOf = (s) => NAMES[hash("cn" + s) % NAMES.length];
const stockOf = (s, fk) => { const idx = GOODS.map((_, i) => i).filter((i) => !fk || !GOODS[i].f || GOODS[i].f === fk).sort((a, b) => hash("cs" + s + a) - hash("cs" + s + b)).slice(0, 5); return idx.map((i) => GOODS[i]); };
// ตั้งแต่ ruins..tunnel (ไม่รวม lab/safe) — lab ไม่ใช้เพราะขบวนเดินเข้าไม่ถึง

function makeCaravan(db) {
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    return withLock(db, uid, now, async () => {
      const [pS] = await Promise.all([db.ref(`users/${uid}`).get()]);
      const p = pS.val();
      if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
      const s = slotOf(now), z = zoneOf(s), open = openNow(now), here = open && p.zone === z, closeAt = s * SLOT_MS + OPEN_MS, nextAt = (s + 1) * SLOT_MS;
      const sold = (await db.ref(`caravan/${s}/sold`).get()).val() || {}, mine = (await db.ref(`caravan/${s}/u/${uid}`).get()).val() || {};
      const goods = stockOf(s, p.faction === "zombie" ? "z" : "h");
      const view = (extra) => {
        if (!open) return Object.assign({ ok: true, open: false, next: nextAt }, extra || {});
        if (!here) return Object.assign({ ok: true, open: true, here: false, hint: HINT[z], until: closeAt }, extra || {});
        return Object.assign({ ok: true, open: true, here: true, who: nameOf(s), until: closeAt, goods: goods.map((g) => ({ key: GOOD_KEY(g), id: g.id, q: g.q, cost: g.cost, left: Math.max(0, g.stock - (sold[GOOD_KEY(g)] || 0)), bought: !!mine[GOOD_KEY(g)] })) }, extra || {});
      };
      if (a === "state") return view();
      if (a === "buy") {
        if (!here) fail("failed-precondition", "ต้องอยู่ที่โซนของพ่อค้าและร้านยังเปิดอยู่");
        const g = goods.find((x) => GOOD_KEY(x) === data.key);
        if (!g) fail("invalid-argument", "ไม่มีสินค้านี้");
        const key = GOOD_KEY(g);
        if (mine[key]) fail("failed-precondition", "ซื้อรายการนี้ไปแล้ว");
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        const got = await db.ref(`caravan/${s}/sold/${key}`).transaction((x) => ((x || 0) < g.stock ? (x || 0) + 1 : undefined));   // จองสต็อกก่อน
        if (!got.committed) fail("failed-precondition", "สินค้าชิ้นนี้หมดแล้ว");
        const taken = []; let ok = true;
        for (const [id, q] of g.cost) { if (await takeItem(db, uid, id, q)) taken.push([id, q]); else { ok = false; break; } }
        if (ok && !(await grantAll(db, uid, [[g.id, g.q]]))) ok = false;
        if (!ok) {   // คืนของ + คืนสต็อก
          if (taken.length) await grantAll(db, uid, taken);
          await db.ref(`caravan/${s}/sold/${key}`).transaction((x) => Math.max(0, (x || 1) - 1));
          fail("failed-precondition", "ของไม่พอหรือช่องกระเป๋าเต็ม");
        }
        await db.ref(`caravan/${s}/u/${uid}/${key}`).set(1);
        mine[key] = 1; sold[key] = (sold[key] || 0) + 1;
        return view({ bought: [g.id, g.q] });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run };
}
module.exports = { makeCaravan, GOODS, stockOf, zoneOf, slotOf, openNow, SLOT_MS, OPEN_MS };
