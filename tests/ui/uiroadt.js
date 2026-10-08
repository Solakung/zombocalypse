// ⏱️ เวลาเดินต่อถนน (config/roadt): เปิดเดินตามถนน + มีตารางเวลา → ปุ่มโซนนับถอยหลังตามถนนสายนั้น (ถนนสั้นรอน้อย ทางป่ารอนาน) • ไม่มีตารางเวลา = 45 วินาทีเหมือนเดิม • owner ซิงก์เขียนทั้ง roads + roadt
const { boot } = require("./_fakefb"), assert = require("assert"), M = require("/home/user/zombocalypse/functions/worldmap");
const roads = {}, roadt = {}; M.WORLD.roads.forEach((r) => { const c = M.worldCost(r), t = M.worldSecs(r); roads[r[0] + "_" + r[1]] = c; roads[r[1] + "_" + r[0]] = c; roadt[r[0] + "_" + r[1]] = t; roadt[r[1] + "_" + r[0]] = t; });
const user = (role = "player") => ({ u1: { username: "tester", faction: "human", role, banned: false, zone: "safe", hp: 100, stamina: 100, staminaTs: Date.now(), food: 100, foodTs: Date.now(), water: 100, waterTs: Date.now(), createdAt: Date.now() - 1e9, seenAt: Date.now(), lastTravel: Date.now() - 20000 } });
const tags = (pg) => pg.evaluate(() => Object.fromEntries([...document.querySelectorAll(".zone-btn")].map((b) => [b.dataset.zone, b.querySelector(".travel-tag")?.textContent || ""])));
(async () => {
  let B = await boot({ faction: "human", seed: { tune: { travel_roads: 1 }, config: { roads, roadt }, users: user() } }); await B.pg.waitForTimeout(2800);
  await B.pg.evaluate(() => document.getElementById("clog-close")?.click()); await B.pg.waitForTimeout(300);
  let t = await tags(B.pg); console.log("with roadt:", JSON.stringify(t));
  const sec = (s) => Number((s.match(/⏳ (\d+)/) || [])[1]);
  // ผ่านไป 20 วิ: Safe→โรงงาน 33 วิ เหลือ ~13 • Safe→ป่า 52 วิ เหลือ ~32 • ไม่ติดกัน (ค่ายทหาร) ไม่มีเวลาเฉพาะ → ต้องไม่โชว์เวลาของถนนอื่น
  assert(sec(t.factory) >= 7 && sec(t.factory) <= 14, "โรงงาน " + t.factory); assert(sec(t.forest) >= 26 && sec(t.forest) <= 33, "ป่า " + t.forest); assert(sec(t.ruins) >= 10 && sec(t.ruins) <= 17, "เมืองร้าง " + t.ruins); assert(Math.abs(sec(t.hospital) - sec(t.factory)) <= 1, "ไม่ติดกัน (โรงพยาบาล) ใช้เวลาถนนช่องแรก = โรงงาน " + t.hospital);
  assert(sec(t.forest) > sec(t.factory), "ทางป่ารอนานกว่า");
  assert.deepStrictEqual(B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e)), []); await B.br.close();
  B = await boot({ faction: "human", seed: { tune: { travel_roads: 1 }, config: { roads }, users: user() } }); await B.pg.waitForTimeout(2800);
  await B.pg.evaluate(() => document.getElementById("clog-close")?.click()); await B.pg.waitForTimeout(300);
  t = await tags(B.pg); console.log("no roadt:", JSON.stringify(t)); assert(sec(t.factory) >= 18 && sec(t.factory) <= 26 && sec(t.forest) >= 18 && sec(t.forest) <= 26, "ไม่มี roadt = 45 วิ เหมือนเดิม"); await B.br.close();
  B = await boot({ faction: "human", role: "owner", seed: { tune: { travel_roads: 1 }, config: { roads: {} }, users: user("owner") } }); await B.pg.waitForTimeout(3500);
  const cfg = await B.pg.evaluate(() => ({ r: Object.keys(window.__DB.config?.roads || {}).length, t: window.__DB.config?.roadt })); console.log("owner sync:", cfg.r, cfg.t && cfg.t.safe_factory, cfg.t && cfg.t.safe_forest);
  assert(cfg.r === 28 && cfg.t && Object.keys(cfg.t).length === 28 && cfg.t.safe_factory === roadt.safe_factory && cfg.t.forest_safe === roadt.safe_forest, "owner ซิงก์ roads + roadt"); await B.br.close();
  console.log("uiroadt OK");
})().catch((e) => { console.error(e); process.exit(1); });
