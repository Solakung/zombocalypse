// 🏠→🌱 อัปเกรดที่พักแล้วแปลงสวนต้องเพิ่มทันที (เดิมแผงสวนค้างข้อมูลเก่า ~2 นาที): ที่พักขั้น 0 → 1 = ปลดล็อกสวน 4 แปลง • ขั้น 1 → 2 = 6 แปลง
const { boot } = require("./_fakefb"); const assert = require("assert");
const run = async (lv0, n0, n1) => {
  const B = await boot({ faction: "human", seed: { base: { u1: { lv: lv0 } } }, inventory: { scrap: { id: "scrap", qty: 99 } } }); const pg = B.pg; await pg.waitForTimeout(2500);
  await pg.evaluate(() => document.getElementById("clog-close")?.click());
  await pg.evaluate(([n0, n1]) => {
    window.__up = false;
    const mk = (n) => ({ ok: true, n, season: 0, daily: false, dEnd: Date.now() + 1e6, plots: Array.from({ length: n }, (_, k) => ({ i: k + 1 })), seeds: { herb: 1 }, harvested: {}, fert: ["scrap", 1], water: ["water", 1], crops: { herb: { n: "สมุนไพร", i: "🌿", r: 0, g: 1, y: ["herb_bundle", 3], buy: ["scrap", 3], h: 0 } }, up: { lv: 0, max: 5, eff: { p: 0 }, tiers: [], next: null } });
    window.__FNRES = { baseAct: async (d) => { if (d.a === "upgrade") { window.__up = true; window.__DB.base = window.__DB.base || {}; window.__DB.base.u1 = { ...(window.__DB.base.u1 || {}), lv: (window.__DB.base.u1?.lv || 0) + 1 }; } return { ok: true }; }, gardenAct: async () => mk(window.__up ? n1 : n0) };
  }, [n0, n1]);
  await pg.evaluate(() => document.getElementById("btn-base")?.click()); await pg.waitForTimeout(600);
  await pg.evaluate(() => [...document.querySelectorAll("#base-body .subtabs button")].find((b) => /ลานบ้าน/.test(b.textContent))?.click()); await pg.waitForTimeout(1200);
  const before = await pg.evaluate(() => ({ plots: new Set([...document.querySelectorAll("#base-body [data-i]")].map((e) => e.getAttribute("data-i"))).size, txt: /อัปเกรดที่พักเป็นขั้น 1 ก่อน/.test(document.getElementById("base-body").innerText) }));
  await pg.evaluate(() => [...document.querySelectorAll("#base-body button")].find((b) => /^อัปเกรด \(/.test(b.textContent))?.click()); await pg.waitForTimeout(1800);
  const after = await pg.evaluate(() => ({ up: window.__up, plots: new Set([...document.querySelectorAll("#base-body [data-i]")].map((e) => e.getAttribute("data-i"))).size, locked: /อัปเกรดที่พักเป็นขั้น 1 ก่อน/.test(document.getElementById("base-body").innerText) }));
  console.log(JSON.stringify({ lv0, before, after })); assert(after.up, "กดอัปเกรดแล้ว"); assert.strictEqual(after.plots, n1, `แปลงต้องเป็น ${n1} ทันที`); assert(!after.locked, "ข้อความล็อกต้องหาย");
  assert.deepStrictEqual(B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e)), []); await B.br.close();
};
(async () => { await run(0, 0, 4); await run(1, 4, 6); console.log("uibaseupplots OK"); })().catch((e) => { console.error(e); process.exit(1); });
