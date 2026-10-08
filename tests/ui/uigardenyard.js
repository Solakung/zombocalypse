// 🌱 ฉากบ้านในแท็บลานบ้าน: แตะแปลงในภาพบนสุดเพื่อเลือก (ด้วยการแตะจริง) → แผงสวนเปลี่ยนเป็นแปลงนั้น • มีวงเส้นประที่แปลงที่เลือก • ปลูกได้ไม่ต้องตามลำดับ
const { boot } = require("./_fakefb"); const assert = require("assert");
(async () => {
  const B = await boot({ faction: "human", seed: { base: { u1: { lv: 2 } } } }); const pg = B.pg; await pg.waitForTimeout(2500);
  await pg.evaluate(() => document.getElementById("clog-close")?.click());
  await pg.evaluate(() => {
    window.__plant = [];
    const mkv = (plots) => ({ ok: true, n: 6, season: 0, daily: false, dEnd: Date.now() + 1e6, plots, seeds: { herb: 3 }, harvested: {}, fert: ["scrap", 1], water: ["water", 1], crops: { herb: { n: "สมุนไพร", i: "🌿", r: 0, g: 2700000, y: ["herb_bundle", 3], buy: ["scrap", 3], h: 0 } }, up: { lv: 0, max: 5, eff: { p: 0 }, tiers: [], next: null } });
    let plots = [1, 2, 3, 4, 5, 6].map((i) => ({ i }));
    window.__FNRES = { gardenAct: async (d) => { if (d.a === "plant") { window.__plant.push([d.i, d.c]); plots = plots.map((p) => (p.i === d.i ? { i: d.i, c: d.c, e: Date.now() + 1e6, w: false, f: false, ready: false, left: 1e6, total: 2e6 } : p)); } return mkv(plots); } };
  });
  await pg.evaluate(() => document.getElementById("btn-base")?.click()); await pg.waitForTimeout(500);
  await pg.evaluate(() => { [...document.querySelectorAll("#base-body .subtabs button")].find((b) => /ลานบ้าน/.test(b.textContent))?.click(); }); await pg.waitForTimeout(1200);
  const heading = () => pg.evaluate(() => (document.getElementById("base-body").innerText.match(/แปลงที่ \d \(ว่าง\)|\(แปลง \d\)/) || [])[0]);
  const tapTop = async (k) => { await pg.evaluate((k) => document.querySelector('#base-scene [data-i="' + k + '"]').scrollIntoView({ block: "center" }), k); await pg.waitForTimeout(150); const bb = await (await pg.$('#base-scene [data-i="' + k + '"] rect')).boundingBox(); await pg.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.waitForTimeout(350); };
  assert.strictEqual((await pg.$$('#base-scene [data-i]')).length, 6, "ฉากบ้านมีจุดแตะครบ 6 แปลง");
  const seen = []; for (const k of [4, 2, 6, 5, 3, 1]) { await tapTop(k); seen.push(k + "→" + await heading()); }
  console.log(seen.join(" | ")); for (const k of [4, 2, 6, 5, 3, 1]) assert((seen.find((x) => x.startsWith(k + "→")) || "").includes("แปลงที่ " + k), "แตะแปลง " + k + " ได้: " + seen);
  assert(await pg.evaluate(() => !!document.querySelector('#base-scene ellipse[stroke-dasharray]')), "มีวงเส้นประที่แปลงที่เลือก");
  // เลือกแปลง 5 (ข้ามลำดับ) แล้วปลูก
  await tapTop(5); await pg.evaluate(() => [...document.querySelectorAll("#base-body button")].find((b) => /ปลูกสมุนไพร/.test(b.textContent))?.click()); await pg.waitForTimeout(600);
  assert.deepStrictEqual(await pg.evaluate(() => window.__plant), [[5, "herb"]], "ปลูกแปลง 5 ข้ามลำดับได้");
  assert.deepStrictEqual(B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e)), []); await B.br.close(); console.log("uigardenyard OK");
})().catch((e) => { console.error(e); process.exit(1); });
