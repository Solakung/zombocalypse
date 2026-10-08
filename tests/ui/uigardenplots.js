// 🌱 สวน: ที่พักขั้น 1 = 4 แปลง — ลานบ้านเห็นครบ, แตะเลือกแปลงว่างแล้วปลูกชนิดที่เลือกได้ (ส่ง i + c ถูกต้อง)
const { boot } = require("./_fakefb"); const assert = require("assert");
(async () => {
  const B = await boot({ faction: "human", seed: { base: { u1: { lv: 1 } } } }); const pg = B.pg; await pg.waitForTimeout(2500);
  await pg.evaluate(() => document.getElementById("clog-close")?.click());
  await pg.evaluate(() => {
    window.__plant = [];
    const mkv = (plots) => ({ ok: true, n: 4, season: 0, daily: false, dEnd: Date.now() + 1e6, plots, seeds: { herb: 2, tomato: 1 }, harvested: {}, fert: ["scrap", 1], water: ["water", 1],
      crops: { herb: { n: "สมุนไพร", i: "🌿", r: 0, g: 2700000, y: ["herb_bundle", 3], buy: ["scrap", 3], h: 0 }, tomato: { n: "มะเขือเทศ", i: "🍅", r: 0, g: 5400000, y: ["fruit", 3], buy: ["scrap", 5], h: 0 } }, up: { lv: 0, max: 5, eff: { p: 0 }, tiers: [], next: null } });
    let plots = [{ i: 1, c: "herb", e: Date.now() + 1e6, w: false, f: false, ready: false, left: 1e6, total: 2e6 }, { i: 2 }, { i: 3 }, { i: 4 }];
    window.__FNRES = { gardenAct: async (d) => { if (d.a === "plant") { window.__plant.push([d.i, d.c]); plots = plots.map((p) => (p.i === d.i ? { i: d.i, c: d.c, e: Date.now() + 1e6, w: false, f: false, ready: false, left: 1e6, total: 2e6 } : p)); } return mkv(plots); } };
  });
  await pg.evaluate(() => document.getElementById("btn-base")?.click()); await pg.waitForTimeout(500);
  await pg.evaluate(() => { [...document.querySelectorAll("#base-body .subtabs button")].find((b) => /ลานบ้าน/.test(b.textContent))?.click(); }); await pg.waitForTimeout(1200);
  const info = await pg.evaluate(() => ({ yardPlots: document.querySelectorAll("#base-scene ellipse[rx]").length, panel: /แปลง/.test(document.getElementById("base-body").innerText), hint: /แตะแปลงในภาพ/.test(document.getElementById("base-body").innerText), taps: document.querySelectorAll("#base-body [data-i]").length, txt: (document.getElementById("base-body").innerText.match(/แปลงที่ \d[^\n]*/g) || []).join(" | ") }));
  console.log(JSON.stringify(info)); console.log("ORDER:", JSON.stringify(await pg.evaluate(() => [...document.querySelectorAll("#base-body b, #base-body summary")].map((e) => e.textContent.slice(0, 40)))));
  await pg.screenshot({ path: "/tmp/claude-0/-home-user-zombocalypse/151a244a-95d6-5679-8654-49c6a5860fe0/scratchpad/garden.png", fullPage: false });
  assert.strictEqual(info.taps, 4, "แตะเลือกได้ 4 แปลง");
  // แตะแปลง 3 (ว่าง) แล้วปลูกมะเขือเทศ
  await pg.evaluate(() => document.querySelector('#base-body [data-i="3"]').dispatchEvent(new MouseEvent("click", { bubbles: true }))); await pg.waitForTimeout(500);
  const sel = await pg.evaluate(() => document.getElementById("base-body").innerText.match(/แปลงที่ \d \(ว่าง\)[^\n]*/)?.[0]); console.log("selected:", sel); assert(/แปลงที่ 3/.test(sel || ""), "เลือกแปลง 3");
  await pg.evaluate(() => [...document.querySelectorAll("#base-body button")].find((b) => /ปลูกมะเขือเทศ/.test(b.textContent))?.click()); await pg.waitForTimeout(600);
  const pl = await pg.evaluate(() => window.__plant); console.log("plant calls:", JSON.stringify(pl)); assert.deepStrictEqual(pl, [[3, "tomato"]]);
  const errs = B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e)); assert.deepStrictEqual(errs, []); await B.br.close(); console.log("uigardenplots OK");
})().catch((e) => { console.error(e); process.exit(1); });
