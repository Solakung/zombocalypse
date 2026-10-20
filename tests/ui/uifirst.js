// 👋 ความรู้สึกแรก (script.js twCardSync/twFirstRun): การ์ดเข้าฉากบนหน้าแรก • ผู้เล่นใหม่เปิดค่ายเองครั้งเดียว+เคนทัก • ผู้เล่นเก่าไม่โดน
// รันด้วย `node tests/ui/uifirst.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
const now0 = Date.now();
const mkU = (zone, age) => ({ username: "tester", faction: "human", role: "player", banned: false, zone, hp: 110, stamina: 110, staminaTs: now0, food: 100, foodTs: now0, water: 100, waterTs: now0, createdAt: now0 - age, seenAt: now0 });
const vis = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
async function mk(zone, age, wait = 6500) {
  const B = await boot({ faction: "human", seed: { tune: { mg_on: 0 }, users: { u1: mkU(zone, age) } } });
  await B.pg.waitForTimeout(wait); return B;
}
(async () => {
  // 1) ผู้เล่นเก่า: มีการ์ดบนหน้าแรก ไม่เปิดฉากเอง • กดการ์ดแล้วเปิด
  let B = await mk("safe", 1e9), pg = B.pg;
  await pg.evaluate(() => document.getElementById("clog-close")?.click());
  assert(await vis(pg, "#tw-card"), "การ์ดเดินในค่ายอยู่หน้าแรก");
  assert(/ค่าย/.test(await pg.evaluate(() => document.querySelector("#tw-card b").textContent)), "ป้ายการ์ด Safe Zone");
  assert(await pg.evaluate(() => document.getElementById("tw-card").nextElementSibling.id === "chat-log"), "การ์ดอยู่เหนือแชต");
  assert(!(await vis(pg, "#tw-root")), "ผู้เล่นเก่าไม่เปิดฉากเอง");
  await pg.evaluate(() => document.getElementById("tw-card-go").click()); await pg.waitForTimeout(600);
  assert(await vis(pg, "#tw-root"), "กดการ์ดเปิดฉาก");
  assert(!/เคน: ใหม่/.test(await pg.evaluate(() => document.getElementById("tw-log").textContent)), "ไม่มีคำทักทายสำหรับคนเก่า");
  assert(!B.errs.some((e) => /PAGEERROR/.test(e)), "ไม่มี error " + B.errs);
  await B.br?.close?.();
  // 2) ผู้เล่นใหม่ใน Safe Zone: เปิดเองครั้งเดียว + เคนทัก
  B = await mk("safe", 3600e3); pg = B.pg;
  assert(await vis(pg, "#tw-root"), "ผู้เล่นใหม่ → เปิดค่ายเอง");
  assert(/เคน: ใหม่/.test(await pg.evaluate(() => document.getElementById("tw-log").textContent)), "เคนทักทาย");
  await pg.evaluate(() => document.getElementById("tw-x")?.click()); await pg.waitForTimeout(300);
  assert(!(await vis(pg, "#tw-root")), "ปิดฉากได้");
  await pg.reload(); await pg.waitForTimeout(7000);
  assert(!(await vis(pg, "#tw-root")), "รีโหลดแล้วไม่เปิดเองซ้ำ");
  await B.br?.close?.();
  // 3) ผู้เล่นใหม่แต่อยู่นอก Safe Zone: ไม่เปิดเอง • การ์ดเป็น "เดินสำรวจ"
  B = await mk("ruins", 3600e3); pg = B.pg;
  assert(!(await vis(pg, "#tw-root")), "นอก Safe Zone ไม่เปิดเอง");
  assert(/เดินสำรวจ/.test(await pg.evaluate(() => document.querySelector("#tw-card b").textContent)), "การ์ดโซนอื่น");
  await B.br?.close?.();
  console.log("uifirst OK");
})().catch((e) => { console.error(e); process.exit(1); });
