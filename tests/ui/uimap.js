// 🗺️ แผนที่เมือง (หน้าโซน): ฉากหลัง SVG + ถนนตามชนิด 14 เส้น + โหนดตามพิกัด • ป้ายพลังงานต่อถนน (tune map_energy) • ไฮไลต์เส้นทางตอนชี้ • กดโซนยังเดินทางเหมือนเดิม • โหมดรายการซ่อนแผนที่
const { boot } = require("./_fakefb"), assert = require("assert");
(async () => {
  const run = async (seed) => {
    const B = await boot({ faction: "human", viewport: { width: 430, height: 900 }, seed }); await B.pg.waitForTimeout(2800);
    await B.pg.evaluate(() => document.querySelector('.tabbar [data-tab="map"]').click()); await B.pg.waitForTimeout(400);
    return B;
  };
  // 1) ปกติ (ไม่เปิดป้ายพลังงาน)
  let B = await run({});
  const a = await B.pg.evaluate(() => {
    const ul = document.getElementById("zone-list"), nodes = [...ul.querySelectorAll(".zone-btn")].map((b) => { const li = b.parentElement; return [b.dataset.zone, parseFloat(li.style.getPropertyValue("--x")), parseFloat(li.style.getPropertyValue("--y"))]; });
    const kinds = [...ul.querySelectorAll(".zroad .zfill")].map((p) => p.getAttribute("stroke-dasharray") || "solid");
    return { map: ul.classList.contains("zmap"), svg: !!ul.querySelector("svg.zworld"), roads: ul.querySelectorAll(".zroad").length, nodes, pills: ul.querySelectorAll(".zeng").length, kinds: [...new Set(kinds)].sort(), sea: !!ul.querySelector(".zsea path"), mount: ul.querySelectorAll(".zmount path").length, lbl: ul.querySelectorAll(".zlbl").length, legend: ul.querySelector(".zlegend")?.textContent || "" };
  });
  console.log(JSON.stringify({ map: a.map, svg: a.svg, sea: a.sea, mount: a.mount, lbl: a.lbl, kinds: a.kinds }));
  assert(a.map && a.svg && a.sea); assert.strictEqual(a.roads, 14); assert.strictEqual(a.nodes.length, 12); assert.strictEqual(a.pills, 0); assert(a.mount >= 10 && a.lbl === 4); assert(/ถนนหลัก/.test(a.legend)); assert(a.kinds.length >= 3, a.kinds.join(","));
  const pos = Object.fromEntries(a.nodes.map(([z, x, y]) => [z, [x, y]])); assert(pos.safe[1] > pos.factory[1] && pos.factory[1] > pos.hospital[1] && pos.hospital[1] > pos.police[1], "Safe ล่างสุด ยิ่งไกลยิ่งขึ้นบน"); assert(pos.port[0] < pos.safe[0] && pos.mall[0] > pos.safe[0], "ท่าเรือตะวันตก ห้างตะวันออก");
  // ชี้โซนไกล: ไฮไลต์เส้นทาง safe→factory→hospital→base (3 ถนน) + ชื่อทางใน title; ออกแล้วล้างไฮไลต์
  const h = await B.pg.evaluate(() => { const b = document.querySelector('.zone-btn[data-zone="base"]'); b.dispatchEvent(new Event("mouseenter")); const on = document.querySelectorAll(".zroad.hl").length, title = b.title; b.dispatchEvent(new Event("mouseleave")); return { on, title, off: document.querySelectorAll(".zroad.hl").length }; });
  assert.strictEqual(h.on, 3); assert.strictEqual(h.off, 0); assert(/เส้นทางตามถนน: .*โรงงาน.*โรงพยาบาล.*ค่ายทหารร้าง \(3 ช่อง ~[\d.]+ กม\.\)/.test(h.title), h.title);
  // กดโซน = เดินทางเหมือนเดิม (ไม่ถูกครอบด้วยการเดินตามถนน)
  const before = await B.pg.evaluate(() => document.querySelector(".tabbar button.on")?.dataset.tab); assert.strictEqual(before, "map");
  await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="forest"]').click()); await B.pg.waitForTimeout(600);
  const after = await B.pg.evaluate(() => document.querySelector(".tabbar button.on")?.dataset.tab); assert.strictEqual(after, "chat", "กดโซนแล้วกลับหน้าแชทเหมือนเดิม");
  // โหมดรายการ: ซ่อนแผนที่
  await B.pg.evaluate(() => { localStorage.setItem("zc_zmap", "list"); }); const fatal1 = B.errs.filter((e) => /^PAGEERROR/.test(e) && !/fxPerkMods/.test(e)); assert.deepStrictEqual(fatal1, [], fatal1.join("||")); await B.br.close();
  // 2) เปิดป้ายพลังงาน (tune map_energy = 1): ป้ายตัวเลขทุกถนน ตรงกับค่า worldCost
  B = await run({ tune: { map_energy: 1 } });
  const e = await B.pg.evaluate(() => [...document.querySelectorAll("#zone-list .zeng")].map((x) => x.textContent + "|" + x.title)); assert.strictEqual(e.length, 14); assert(e.every((x) => /^\d+⚡\|.+ [\d.]+ กม\.$/.test(x)), e.join(";")); assert(e.some((x) => /สะพาน/.test(x)) && e.some((x) => /อุโมงค์/.test(x)) && e.some((x) => /ทางป่า/.test(x)));
  const fatal2 = B.errs.filter((x) => /^PAGEERROR/.test(x) && !/fxPerkMods/.test(x)); assert.deepStrictEqual(fatal2, [], fatal2.join("||")); await B.br.close(); console.log("uimap OK");
})().catch((err) => { console.error(err); process.exit(1); });
