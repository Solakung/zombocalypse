// 🌍 โลกเดินได้ทุกโซน + ⚔️ ฉากปะทะ (script.js หัวข้อ 54-56): แผนที่สร้างคงที่/เดินถึงกันหมด • ตำแหน่งแบบประหยัดแบนด์วิท (ไม่ส่งตอนอยู่คนเดียว/ส่งเฉพาะเริ่ม-หยุด/ปิดด้วย tune/พักตอนแท็บซ่อน)
// • เมนูผู้เล่น → โจมตีเรียก attack() เดิม • ฉากปะทะเล่นตามผล (โดน/หลบ/ป้องกัน/ล้ม) อ่านผลจากแชท combat ได้ • ปิดด้วย pv_on/ปุ่ม/ข้าม — `node tests/ui/uiworld.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
const now0 = Date.now();
const mkU = (n, f, zone) => ({ username: n, faction: f, role: "player", banned: false, zone, hp: 110, stamina: 110, staminaTs: now0, food: 100, foodTs: now0, water: 100, waterTs: now0, createdAt: now0 - 1e9, seenAt: now0 });
async function mkpage(o = {}) {
  const zone = o.zone || "ruins", zp = { u1: { name: "tester", faction: "human" }, ...(o.alone ? {} : { u2: { name: "Bob", faction: "human" } }) };
  const seed = { tune: { mg_on: 0, ...(o.tune || {}) }, users: { u1: mkU("tester", "human", zone), u2: mkU("Bob", "human", zone) }, zonePlayers: { [zone]: zp }, ...(o.seed || {}) };
  const B = await boot({ faction: "human", seed });
  await B.pg.waitForTimeout(4800); await B.pg.evaluate(() => document.getElementById("clog-close")?.click());
  return B;
}
const shown = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
const click = (pg, id) => pg.evaluate((i) => document.getElementById(i).click(), id);
const errs = (B) => B.errs.filter((e) => /PAGEERROR/.test(e));
const tw = (pg, f, arg) => pg.evaluate(new Function("a", `const T = window.__town.TW; ${f}`), arg);
const colors = (pg, id) => pg.evaluate((i) => { const c = document.getElementById(i), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let k = 0; k < d.length; k += 4 * 37) s.add(d[k] + "," + d[k + 1] + "," + d[k + 2]); return s.size; }, id);

(async () => {
  // 1) แผนที่ทุกโซน: คงที่ (สร้างซ้ำได้เหมือนเดิม) • ช่องว่างเดินถึงกันหมดจากจุดเกิด • มีทางออก • ลังเข้าถึงได้
  let B = await mkpage(), pg = B.pg;
  const rep = await pg.evaluate(() => {
    const W = window.__town, out = {};
    for (const z of ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab", "zzz"]) {
      const m1 = W.twGenMap(z).join("|"), m2 = W.twGenMap(z).join("|"), w = W.twWorld(z), sp = w.spawn;
      const seen = W.twReach(w, Math.floor(sp.x), Math.floor(sp.y)); let free = 0, exitOk = false, crates = 0, crateOk = 0;
      for (let y = 0; y < w.mh; y++) for (let x = 0; x < w.mw; x++) {
        const c = w.map[y][x];
        if (c === ".") free++;
        if (c === "X" || c === "c") { const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(x + dx + "," + (y + dy))); if (c === "X") exitOk = near; else { crates++; if (near) crateOk++; } }
      }
      out[z] = { same: m1 === m2, free, reach: seen.size, exitOk, crates, crateOk, rows: w.map.length, cols: w.map[0].length, spawnFree: w.map[Math.floor(sp.y)][Math.floor(sp.x)] === "." };
    }
    return out;
  });
  for (const [z, r] of Object.entries(rep)) {
    assert(r.same && r.rows === 22 && r.cols === 28 && r.spawnFree, `${z}: แผนที่คงที่/ขนาด/จุดเกิดว่าง ${JSON.stringify(r)}`);
    assert(r.reach === r.free, `${z}: ช่องว่างเดินถึงกันหมด ${r.reach}/${r.free}`);
    assert(r.exitOk, `${z}: ทางออกเดินถึง`); assert(r.crates >= 3 && r.crateOk === r.crates, `${z}: ลังเข้าถึงได้ทุกลัง ${r.crateOk}/${r.crates}`);
  }
  assert(await pg.evaluate(() => window.__town.twGenMap("ruins").join() !== window.__town.twGenMap("mall").join()), "คนละโซน → คนละแผนที่");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("1 แผนที่สร้างอัตโนมัติ ✓");

  // 2) เปิดโซนรกร้าง: ภาพ/ผู้เล่นอื่น/ตำแหน่งแบบประหยัด (ส่งเฉพาะเริ่ม-หยุด) / ออกแล้วลบ
  B = await mkpage({ seed: { town: { ruins: { 0: { u2: "100,100,0,0" } } } } }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(700);
  assert(await shown(pg, "#tw-root") && /ซากเมือง|รกร้าง|ruins/i.test(await pg.evaluate(() => document.getElementById("tw-ttl").textContent)) || await shown(pg, "#tw-root"), "เปิดฉากโซน");
  assert((await colors(pg, "tw-cv")) > 25, "ภาพโซนวาดแล้ว");
  assert(await tw(pg, "return T.ents.some(e => e.type === 'player' && e.uid === 'u2');"), "เห็นผู้เล่นจาก town/ruins/0");
  await pg.waitForTimeout(500);
  const wr = () => pg.evaluate(() => window.__DB.town?.ruins?.[0]?.u1 || "");
  assert(/^\d+,\d+,\d+,0$/.test(await wr()), "ส่งตำแหน่งแรก (มีคนอื่นในโซน): " + await wr());
  const spy = await pg.evaluate(() => { window.__w = 0; const T = window.__town.TW; T.pres._set = 1; return 1; }); assert(spy);
  const v0 = await wr(); await pg.waitForTimeout(2500); assert((await wr()) === v0, "ยืนนิ่งไม่ส่งซ้ำถี่ ๆ");
  await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(700); const v1 = await wr(); assert(/,1$/.test(v1), "เริ่มเดิน → ส่ง m=1: " + v1);
  await pg.waitForTimeout(1800); assert((await wr()) === v1, "เดินตรงไม่ส่งทุกครึ่งวินาที (ผู้ชมต่อเส้นทางเอง)");
  await pg.keyboard.up("ArrowUp"); await pg.waitForTimeout(700); assert(/,0$/.test(await wr()), "หยุด → ส่ง m=0: " + await wr());
  await click(pg, "tw-x"); await pg.waitForTimeout(300); assert(!(await wr()), "ออกแล้วลบตำแหน่ง");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("2 โซนอื่น/ตำแหน่งประหยัด ✓");

  // 3) อยู่คนเดียว = ไม่ส่งเลย • town_pres=0 = ไม่ส่ง/ไม่ฟัง
  B = await mkpage({ alone: true }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(500); await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(900); await pg.keyboard.up("ArrowUp"); await pg.waitForTimeout(500);
  assert(!(await pg.evaluate(() => window.__DB.town?.ruins?.[0]?.u1)), "คนเดียวในโซน → ไม่เขียน town/");
  await B.br.close();
  B = await mkpage({ tune: { town_pres: 0 }, seed: { town: { ruins: { 0: { u2: "100,100,0,0" } } } } }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(600); await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(700); await pg.keyboard.up("ArrowUp"); await pg.waitForTimeout(400);
  assert(!(await pg.evaluate(() => window.__DB.town?.ruins?.[0]?.u1)), "town_pres=0 → ไม่ส่ง");
  assert(!(await tw(pg, "return T.ents.some(e => e.type === 'player');")), "town_pres=0 → ไม่เห็นคนอื่น (ไม่ฟัง)");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("3 ไม่ส่งเมื่ออยู่คนเดียว/ปิดด้วย tune ✓");

  // 4) แท็บถูกซ่อน > 15 วินาที = เลิกฟัง+ลบตำแหน่ง • กลับมา = เริ่มใหม่
  B = await mkpage({ seed: { town: { ruins: { 0: { u2: "100,100,0,0" } } } } }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(900); assert(await pg.evaluate(() => !!window.__DB.town?.ruins?.[0]?.u1), "มีตำแหน่งก่อนซ่อนแท็บ");
  await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await pg.waitForTimeout(15800); assert(!(await pg.evaluate(() => window.__DB.town?.ruins?.[0]?.u1)), "ซ่อนแท็บนาน → ลบตำแหน่ง");
  await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await pg.waitForTimeout(1200); assert(await pg.evaluate(() => !!window.__DB.town?.ruins?.[0]?.u1), "กลับมาแล้วส่งใหม่");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("4 พักตอนแท็บซ่อน ✓");

  // 5) เมนูผู้เล่น: หันหาบ็อบ → ✋ → เมนู → ⚔️ โจมตี = attack() เดิม (เขียน attacks/u2/u1) + เปิดฉากปะทะ
  B = await mkpage({ seed: { town: { ruins: { 0: { u2: "100,100,0,0" } } } } }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(800);
  await tw(pg, "const e = T.ents.find(q => q.uid === 'u2'); e.x = e.tx = 11.5; e.y = e.ty = 8.2; T.x = 11.5; T.y = 6.9; T.a = Math.PI/2; T.W.map[7] = T.W.map[7].replace(/./g, '.').replace(/^./, '#').replace(/.$/, '#');");
  await pg.waitForTimeout(400); assert(/Bob/.test(await pg.evaluate(() => document.getElementById("tw-prompt").textContent)), "ชี้ที่บ็อบ: " + await pg.evaluate(() => document.getElementById("tw-prompt").textContent));
  await click(pg, "tw-act"); await pg.waitForTimeout(300);
  assert(await shown(pg, "#tw-pop") && /โจมตี/.test(await pg.evaluate(() => document.getElementById("tw-pop").textContent)), "เมนูผู้เล่นมีโจมตี");
  assert(/ทักทาย/.test(await pg.evaluate(() => document.getElementById("tw-pop").textContent)), "มีทักทาย");
  await pg.evaluate(() => [...document.querySelectorAll("#tw-pop button")].find((b) => /โจมตี/.test(b.textContent)).click()); await pg.waitForTimeout(900);
  assert(await pg.evaluate(() => !!window.__DB.attacks?.u2?.u1), "เขียน attacks/u2/u1 ผ่าน attack() เดิม");
  assert(await shown(pg, "#pv-root"), "เปิดฉากปะทะฝั่งผู้โจมตี"); assert(await pg.evaluate(() => window.__town.PV.role === "att" && window.__town.PV.phase === "wait"), "รอผล");
  // ผลมาทางแชท combat → เล่นท่า
  await pg.evaluate(() => window.__town.pvChat({ uid: "u2", name: "Bob", type: "combat", text: "⚔ tester ทอย 5 vs Bob ทอยป้องกันได้ 2 → tester โจมตีโดน! −12 HP — Bob ล้มลง!" })); await pg.waitForTimeout(500);
  assert(await pg.evaluate(() => window.__town.PV.phase === "act" && window.__town.PV.res.k === "hit" && window.__town.PV.res.dmg === 12 && window.__town.PV.res.dead && window.__town.PV.res.ar === 5 && window.__town.PV.res.dr === 2), "อ่านผลจากแชท: โดน/−12/ล้ม/ทอย");
  assert(/−12/.test(await pg.evaluate(() => document.getElementById("pv-cap").textContent)), "คำบรรยายผล");
  assert((await colors(pg, "pv-cv")) > 20, "ภาพฉากปะทะวาดแล้ว");
  await pg.waitForTimeout(3200); assert(!(await shown(pg, "#pv-root")), "ฉากปะทะปิดเองหลังจบท่า");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("5 เมนูผู้เล่น/โจมตี/ฝั่งผู้โจมตี ✓");

  // 6) ฉากปะทะทุกผล (ฝั่งผู้ถูกโจมตี) + แยกวิเคราะห์ข้อความ + สวิตช์ปิด + ข้าม
  B = await mkpage(); pg = B.pg;
  for (const k of ["hit", "dodge", "block", "def", "tie"]) {
    const ok = await pg.evaluate(({ k }) => window.__town.pvBegin({ role: "def", uid: "u2", name: "Bob", fac: "human" }) && (window.__town.pvResult({ k, dmg: 7, dead: false, ar: 4, dr: 3 }), true), { k });
    assert(ok, "เริ่มฉาก " + k); await pg.waitForTimeout(1700);
    assert(await pg.evaluate(() => window.__town.PV.phase === "act" || window.__town.PV.phase === "end"), "เล่นท่า " + k);
    assert((await colors(pg, "pv-cv")) > 15, "ภาพ " + k);
    await click(pg, "pv-skip"); await pg.waitForTimeout(150); assert(!(await shown(pg, "#pv-root")), "ข้ามแล้วปิด " + k);
  }
  const parse = await pg.evaluate(() => { const W = window.__town, out = []; for (const t of ["⚔ A ทอย 3 vs B ทอยป้องกันได้ 5 → B ป้องกันได้", "⚔ A ทอย 4 vs B ทอยป้องกันได้ 4 → เสมอ ไม่มีใครโดน", "⚔ A ทอย 6 vs B ทอยป้องกันได้ 1 → B หลบได้ในจังหวะสุดท้าย! 💨", "⚔ A ทอย 6 vs B ทอยป้องกันได้ 1 → A ฟาดโดน แต่ 🦖 ลูกฝูงกระโจนมารับแทน! B ไม่เป็นไร", "🏃 Bob ไม่ทันตั้งตัว! tester ฟาดเข้าเป้า −9 HP", "🏃 tester ฟาดใส่ Bob แต่ถูกหลบได้! 💨"]) { W.pvBegin({ role: "att", uid: "u2", name: "Bob", fac: "human" }); W.pvChat({ uid: t.startsWith("🏃") ? "u1" : "u2", type: "combat", text: t }); out.push(W.PV.res && W.PV.res.k + ":" + W.PV.res.dmg); W.PV.on = false; cancelAnimationFrame(W.PV.raf); document.getElementById("pv-root").classList.add("hidden"); } return out; });
  assert.deepStrictEqual(parse, ["def:null", "tie:null", "dodge:null", "block:null", "hit:9", "dodge:null"], "แยกผลจากข้อความ " + JSON.stringify(parse));
  await pg.evaluate(() => { window.__town.pvBegin({ role: "att", uid: "u3", name: "X", fac: "human" }); window.__town.pvChat({ uid: "u2", type: "combat", text: "⚔ ทอย 1 vs ทอยป้องกันได้ 1 → เสมอ" }); }); assert(await pg.evaluate(() => window.__town.PV.res === null), "ข้อความของคนอื่นไม่ใช่ผลของเรา");
  await pg.evaluate(() => { window.__town.PV.on = false; cancelAnimationFrame(window.__town.PV.raf); document.getElementById("pv-root").classList.add("hidden"); });
  assert.deepStrictEqual(errs(B), []); await B.br.close();
  B = await mkpage({ tune: { pv_on: 0 } }); pg = B.pg;
  assert(!(await pg.evaluate(() => window.__town.pvBegin({ role: "att", uid: "u2", name: "Bob" }))), "pv_on=0 → ไม่เปิดฉาก");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("6 ฉากปะทะทุกผล/ข้อความ/สวิตช์ ✓");
  console.log("uiworld OK");
})().catch((e) => { console.error(e); process.exit(1); });
