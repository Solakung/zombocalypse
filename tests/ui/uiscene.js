// 🕹️ ฉากค้นลึกแบบ Doom (script.js หัวข้อ 52): เปิดเฉพาะตอนค้นลึก • เดินแล้วผลเล่นเป็นฉาก • ช้อยส์/มินิเกมเดิมยังทำงาน • ปิดได้ (tune sc_on / ปุ่ม 🕹️)
// ใช้เกมจริงกับ Firebase จำลอง (_fakefb) ที่ 360px — รันด้วย `node tests/ui/uiscene.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
async function mkpage(o = {}) {
  const now = Date.now(), faction = o.faction || "human", zone = o.zone || "ruins";
  const B = await boot({ faction, inventory: o.inventory, seed: { tune: { mg_on: 0, ...(o.tune || {}) }, users: { u1: { username: "tester", faction, role: "player", banned: false, zone, hp: 110, stamina: o.stamina ?? 110, staminaTs: now, food: 100, foodTs: now, water: 100, waterTs: now, createdAt: now - 1e9, seenAt: now, ...(o.user || {}) } } } });
  await B.pg.waitForTimeout(4800); await B.pg.evaluate(() => document.getElementById("clog-close")?.click());   // changelog เด้งตอน ~4 วิ
  return B;
}
const shown = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
const pageErrs = (B) => B.errs.filter((e) => /PAGEERROR/.test(e));
const click = (pg, id) => pg.evaluate((i) => document.getElementById(i).click(), id);
const idle = async (pg) => { for (let i = 0; i < 40 && (await pg.evaluate(() => document.getElementById("sc-walk").disabled)); i++) await pg.waitForTimeout(250); };
// ภาพไม่ว่าง: แคนวาสมีหลายสี และตรงกลางไม่ใช่สีดำล้วน
const canvasAlive = (pg) => pg.evaluate(() => { const c = document.getElementById("sc-cv"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, set = new Set(); for (let i = 0; i < d.length; i += 4 * 37) set.add(d[i] + "," + d[i + 1] + "," + d[i + 2]); return { w: c.width, h: c.height, colors: set.size }; });

(async () => {
  // 1) เปิดฉาก: ค้นลึกเท่านั้น • เดินหลายก้าว (ผลสุ่มต่างกัน) → ทุกก้าวจบแล้วกลับมาว่าง มีบรรทัดผลเพิ่ม ไม่มี error
  let B = await mkpage({ stamina: 110 }), pg = B.pg;
  await click(pg, "btn-scavenge"); await pg.waitForTimeout(600);
  assert(!(await shown(pg, "#sc-root")), "ค้นปกติ → ไม่เปิดฉาก");
  await pg.evaluate(() => { let a = 7; Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(500);
  assert(await shown(pg, "#sc-root"), "ค้นลึก → เปิดฉาก");
  assert(!(await shown(pg, "#boss-modal")), "ฉากไม่ใช่ .modal (ไม่บล็อก encShow)");
  assert(!(await pg.evaluate(() => document.getElementById("sc-root").classList.contains("modal"))), "sc-root ไม่ใช้คลาส modal");
  const cv = await canvasAlive(pg); assert(cv.w === 160 && cv.h === 136 && cv.colors > 25, "แคนวาสวาดภาพแล้ว " + JSON.stringify(cv));
  assert(/พลังงาน/.test(await pg.evaluate(() => document.getElementById("sc-walk").textContent)), "ปุ่มเดินแสดงต้นทุนพลังงาน");
  const before = await pg.evaluate(() => document.getElementById("sc-st").textContent);
  let lines = 1;
  for (let i = 0; i < 4; i++) {
    await click(pg, "sc-walk"); await pg.waitForTimeout(300);
    assert(await pg.evaluate(() => document.getElementById("sc-walk").disabled), "ระหว่างเดิน/เล่นผลปุ่มถูกล็อก");
    await idle(pg);
    const n = await pg.evaluate(() => document.getElementById("sc-log").children.length); assert(n >= Math.min(lines + 1, 4), `ก้าว ${i + 1}: มีบรรทัดผลเพิ่ม (${n})`); lines = n;
    assert((await canvasAlive(pg)).colors > 25, "ภาพยังอยู่หลังก้าว " + (i + 1));
  }
  const after = await pg.evaluate(() => document.getElementById("sc-st").textContent); assert(after !== before, "พลังงานถูกหักจริง " + before + " → " + after);
  await click(pg, "sc-x"); await pg.waitForTimeout(200); assert(!(await shown(pg, "#sc-root")), "ปุ่มออกปิดฉาก");
  assert.deepStrictEqual(pageErrs(B), [], "ไม่มี error"); await B.br.close(); console.log("1 เปิด/เดิน/ออก ✓");

  // 2) ช้อยส์สถานการณ์ (eventAct) เด้งทับฉากได้ + กดเลือกได้
  B = await mkpage(); pg = B.pg;
  await pg.evaluate(() => { window.__FNRES = { eventAct: async (d) => (d.a === "roll" ? { ok: true, enc: { t: "ลังไม้ถูกล็อก", d: "ลังทหารถูกล็อกแน่น", o: [{ i: 0, l: "งัดด้วยแรง" }, { i: 1, l: "ทิ้งไว้" }] } } : { ok: true }) }; Math.random = () => 0.3; });
  await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(400); await click(pg, "sc-walk"); await pg.waitForTimeout(2600);
  assert(await shown(pg, "#enc-modal"), "ช้อยส์เด้งทับฉาก");
  assert(await pg.evaluate(() => { const r = document.getElementById("enc-modal").getBoundingClientRect(); return !!document.elementFromPoint(r.left + r.width / 2, r.top + 40).closest("#enc-modal"); }), "ช้อยส์อยู่ชั้นบนสุด");
  assert.deepStrictEqual(pageErrs(B), []); await B.br.close(); console.log("2 ช้อยส์ทับฉาก ✓");

  // 3) มินิเกมก่อนค้นลึกยังทำงาน: กดเดิน → มินิเกมเด้ง → ข้าม → เดินต่อจนจบ
  B = await mkpage({ tune: { mg_on: 1 } }); pg = B.pg;
  await pg.evaluate(() => { Math.random = () => 0.3; }); await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(400); await click(pg, "sc-walk"); await pg.waitForTimeout(900);
  assert(await shown(pg, "#mg-modal"), "มินิเกมเด้งทับฉาก");
  await pg.evaluate(() => [...document.querySelectorAll("#mg-modal button")].find((b) => /ข้าม/.test(b.textContent))?.click()); await pg.waitForTimeout(2800);
  assert(/เจอ/.test(await pg.evaluate(() => document.getElementById("sc-log").innerText)), "ข้ามมินิเกมแล้วเดินต่อจนได้ผล");
  assert.deepStrictEqual(pageErrs(B), []); await B.br.close(); console.log("3 มินิเกม ✓");

  // 4) ปุ่ม 🕹️ ปิด/เปิดฉากในเครื่อง • tune sc_on = 0 ปิดทั้งระบบ
  B = await mkpage(); pg = B.pg;
  await pg.evaluate(() => { Math.random = () => 0.3; }); await click(pg, "btn-deep");
  assert(await pg.evaluate(() => !!document.getElementById("btn-sc") && !document.getElementById("btn-sc").hidden), "มีปุ่ม 🕹️");
  await click(pg, "btn-sc"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(1200);
  assert(!(await shown(pg, "#sc-root")), "ปิดฉาก → ค้นลึกแบบเดิม");
  assert(/เจอ/.test(await pg.evaluate(() => document.getElementById("chat-log").innerText)), "ค้นแบบเดิมลงแชทตามปกติ");
  await click(pg, "btn-sc"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(400); assert(await shown(pg, "#sc-root"), "เปิดกลับแล้วเข้าฉาก");
  await click(pg, "btn-deep"); await click(pg, "sc-x"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(600); assert(!(await shown(pg, "#sc-root")), "ปิดค้นลึก → ค้นปกติ ไม่เปิดฉาก");
  assert.deepStrictEqual(pageErrs(B), []); await B.br.close();
  B = await mkpage({ tune: { sc_on: 0 } }); pg = B.pg;
  await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(800);
  assert(!(await shown(pg, "#sc-root")) && (await pg.evaluate(() => { const b = document.getElementById("btn-sc"); return !b || b.hidden; })), "sc_on=0 → ไม่เปิดฉากและซ่อนปุ่ม");
  assert.deepStrictEqual(pageErrs(B), []); await B.br.close(); console.log("4 สวิตช์ปิด ✓");

  // 5) พลังงานไม่พอ → ไม่เริ่มเดิน ฉากไม่ค้าง
  B = await mkpage({ stamina: 22 }); pg = B.pg;
  await pg.evaluate(() => { Math.random = () => 0.3; }); await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(400);
  await click(pg, "sc-walk"); await pg.waitForTimeout(3200); await click(pg, "sc-walk"); await pg.waitForTimeout(1500);
  assert(/พลังงานไม่พอ/.test(await pg.evaluate(() => document.getElementById("toast")?.textContent || "")), "แจ้งพลังงานไม่พอ");
  assert(await shown(pg, "#sc-root") && !(await pg.evaluate(() => document.getElementById("sc-walk").disabled)), "ฉากว่าง กดใหม่ได้");
  assert.deepStrictEqual(pageErrs(B), []); await B.br.close(); console.log("5 พลังงานไม่พอ ✓");

  // 6) ฝั่งซอมบี้: มือเขียว/ฉากโซนอื่น ไม่มี error • ถืออาวุธ (มนุษย์) วาดได้ทุกชนิด
  B = await mkpage({ faction: "zombie", zone: "tunnel" }); pg = B.pg;
  await pg.evaluate(() => { Math.random = () => 0.3; }); await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(500); await click(pg, "sc-walk"); await idle(pg);
  assert((await canvasAlive(pg)).colors > 25, "ซอมบี้: ภาพวาดแล้ว"); assert.deepStrictEqual(pageErrs(B), []); await B.br.close();
  for (const w of ["knife", "pistol", "wooden_bat", "fire_axe", "crowbar"]) {
    B = await mkpage({ zone: "lab", inventory: { [w]: { id: w, qty: 1, dur: 20 } }, user: { equipped: w } }); pg = B.pg;
    await click(pg, "btn-deep"); await click(pg, "btn-scavenge"); await pg.waitForTimeout(600);
    assert((await canvasAlive(pg)).colors > 25, w + ": ภาพวาดแล้ว"); assert.deepStrictEqual(pageErrs(B), [], w); await B.br.close();
  }
  console.log("6 ซอมบี้/อาวุธ/โซน ✓");
  console.log("uiscene OK");
})().catch((e) => { console.error(e); process.exit(1); });
