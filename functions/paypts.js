// 💱 จ่ายเป็น "แต้มมูลค่า" ด้วยวัตถุดิบพื้นฐาน (ใช้กับค่าประกันส้ม / ตั้งค่าหัว) — ระบบหักให้เองจากถูกไปแพง ไม่พอ = ไม่หักอะไรเลย
// แต้มต่อชิ้น: เศษเหล็ก/ตะปูสนิม 1 • สารเคมี/เศษหนัง 2 • เทปกาว 3 (รหัสต้องอยู่ใน ITEMS ของเกมและ whitelist กระเป๋า — tests/emulator/crim.js ตรวจ)
const { fail, takeItem, addCapped } = require("./lib");
const VAL = [["scrap", 1], ["rusty_nails", 1], ["chem", 2], ["leather_scrap", 2], ["duct_tape", 3]];
const num = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
async function payPts(db, uid, need, what = "จ่าย") {
  const inv = (await db.ref(`inventory/${uid}`).get()).val() || {}, plan = []; let left = need;
  for (const [id, val] of VAL) {
    if (left <= 0) break;
    const it = inv[id], have = it && it.id === id ? num(it.qty) : 0; if (have <= 0) continue;
    const take = Math.min(have, Math.ceil(left / val)); plan.push([id, take]); left -= take * val;
  }
  if (left > 0) fail("failed-precondition", `วัตถุดิบไม่พอ${what} (ต้องการ ${need} แต้ม: เศษเหล็ก/ตะปูสนิม 1 • สารเคมี/เศษหนัง 2 • เทปกาว 3)`);
  const taken = [];
  for (const [id, q] of plan) {
    if (!(await takeItem(db, uid, id, q))) { for (const [i, n] of taken) await addCapped(db, uid, i, n).catch(() => {}); fail("failed-precondition", "วัตถุดิบเปลี่ยนระหว่างจ่าย ลองใหม่อีกครั้ง"); }
    taken.push([id, q]);
  }
  return plan.map(([id, qty]) => ({ id, qty }));
}
// แต้ม → รายการของที่จะให้ (ครึ่งหนึ่งเป็นสารเคมี ที่เหลือเป็นเศษเหล็ก)
function ptsToItems(pts) { const chem = Math.floor(pts / 4), scrap = pts - chem * 2, out = []; if (scrap > 0) out.push(["scrap", scrap]); if (chem > 0) out.push(["chem", chem]); return out; }
module.exports = { payPts, ptsToItems, VAL };
