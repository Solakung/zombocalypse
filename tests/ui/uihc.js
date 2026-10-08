// 📡 ภารกิจ HC (ธารา) ฝั่งเกม — จำลองทั้งหมดในเบราว์เซอร์ปลอม ไม่แตะฐานข้อมูลจริง
// เช็ก: ปิดอยู่ = ไม่มีข้อความวิทยุ/ไม่มีธาราในค่าย • เปิด (tune hc_on=1) = มีข้อความวิทยุครั้งเดียว • เจอแล้ว = ธาราโผล่ในการ์ดคนในค่าย
const { boot } = require("./_fakefb"); const assert = require("assert");
const chat = (pg) => pg.evaluate(() => [...document.querySelectorAll("#chat-log, #log, .log")].map((e) => e.innerText).join("\n"));
const run = async (name, seed, fn) => {
  const B = await boot({ faction: "human", seed }); await B.pg.waitForTimeout(2500);
  try { await B.pg.evaluate(() => document.getElementById("clog-close")?.click()); } catch { /* ข้าม */ }
  await B.pg.waitForTimeout(500);
  const r = await fn(B.pg); const errs = B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e));
  await B.br.close(); return { name, r, errs };
};
(async () => {
  const off = await run("off", { tune: { hc_on: 0 } }, async (pg) => ({ txt: await chat(pg), card: await pg.evaluate(() => /ธารา/.test(document.getElementById("npc-box")?.innerText || "")) }));
  const on = await run("on", { tune: { hc_on: 1 } }, async (pg) => ({ txt: await chat(pg), card: await pg.evaluate(() => /ธารา/.test(document.getElementById("npc-box")?.innerText || "")) }));
  const found = await run("found", { tune: { hc_on: 1 }, hc: { state: { found: true, by: "x", name: "คนอื่น", ts: 1 } } }, async (pg) => ({ txt: await chat(pg), card: await pg.evaluate(() => /ธารา/.test(document.getElementById("npc-box")?.innerText || "")) }));
  console.log(JSON.stringify([off, on, found].map((x) => ({ n: x.name, radio: /วิทยุจับสัญญาณขอความช่วยเหลือ/.test(x.r.txt), card: x.r.card, errs: x.errs })), null, 1));
  assert(!/วิทยุจับสัญญาณขอความช่วยเหลือ/.test(off.r.txt), "ปิดอยู่ต้องไม่มีข้อความวิทยุ"); assert(!off.r.card, "ปิดอยู่ต้องไม่มีธารา");
  assert(/วิทยุจับสัญญาณขอความช่วยเหลือ/.test(on.r.txt), "เปิดแล้วต้องมีข้อความวิทยุ"); assert(!on.r.card, "ยังไม่เจอ ธาราต้องไม่โผล่ในค่าย");
  assert(found.r.card, "เจอแล้ว ธาราต้องโผล่ในการ์ดคนในค่าย");
  for (const x of [off, on, found]) assert.deepStrictEqual(x.errs, [], x.name + " errors");
  console.log("uihc OK");
})().catch((e) => { console.error(e); process.exit(1); });
