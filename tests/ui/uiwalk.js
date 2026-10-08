// 🚶 เดินตามถนน (เกมจริง + Firebase จำลอง): ปิด = กดข้ามโซนเหมือนเดิม • เปิด = กดโซนไกลแล้วเดินทีละช่องอัตโนมัติ (แถบสถานะ/พลังงานต่อถนน/คูลดาวน์) • นับภารกิจ (เดินทางทั่วไป 1 ครั้งต่อการเดิน, เควสไปถึงโซนนับทุกช่อง) • ยกเลิก • พลังงานไม่พอหยุด • มือถือ 390px ไม่ล้นจอ
const { boot } = require("./_fakefb"), assert = require("assert"), M = require("/home/user/zombocalypse/functions/worldmap");
const roads = {}; M.WORLD.roads.forEach((r) => { const c = M.worldCost(r); roads[r[0] + "_" + r[1]] = c; roads[r[1] + "_" + r[0]] = c; });
const R1 = { human: { id: "scrap", qty: 1 }, zombie: { id: "scrap", qty: 1 } };
const defs = { weekly: { t1: { title: "ไปถึงโรงพยาบาล", ev: "travel", need: 1, z: "hospital", r: R1 }, t2: { title: "ไปถึงค่ายทหาร", ev: "travel", need: 1, z: "base", r: R1 }, t3: { title: "เดินทางทั่วไป", ev: "travel", need: 5, r: R1 } } };
const accel = (pg) => pg.evaluate(() => { const t0 = Date.now(), p0 = performance.now(); Date.now = () => Math.round(t0 + (performance.now() - p0) * 40); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.textContent) (window.__logs = window.__logs || []).push(n.textContent); }))).observe(document.getElementById("chat-log"), { childList: true }); window.confirm = (m) => { (window.__confirms = window.__confirms || []).push(m); return true; }; });
const user = (stamina) => ({ u1: { username: "tester", faction: "human", role: "player", banned: false, zone: "safe", hp: 100, stamina, staminaTs: Date.now(), food: 100, foodTs: Date.now(), water: 100, waterTs: Date.now(), createdAt: Date.now() - 1e9, seenAt: Date.now() } });
const waitFor = async (pg, fn, ms = 25000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await pg.evaluate(fn).catch(() => false)) return true; await pg.waitForTimeout(150); } return false; };
(async () => {
  // 1) ปิดอยู่ (ค่าเริ่มต้น): กดข้ามโซนเหมือนเดิม
  let B = await boot({ faction: "human", viewport: { width: 390, height: 844 } }); await B.pg.waitForTimeout(2500); await accel(B.pg);
  await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="base"]').click()); await B.pg.waitForTimeout(800);
  let u = await B.pg.evaluate(() => window.__DB.users.u1); assert.strictEqual(u.zone, "base", "ปิดอยู่: ข้ามไปค่ายทหารได้ทันที"); assert(Math.round(100 - u.stamina) >= 13 && Math.round(100 - u.stamina) <= 15, "ราคาเดิม 14: " + u.stamina);
  assert.strictEqual(await B.pg.evaluate(() => document.getElementById("walk-bar").classList.contains("hidden")), true); await B.br.close();

  // 2) เปิด: เดินตามถนน Safe → โรงงาน → โรงพยาบาล → ค่ายทหาร
  B = await boot({ faction: "human", viewport: { width: 390, height: 844 }, seed: { tune: { travel_roads: 1 }, config: { roads, questDefs: defs } } }); await B.pg.waitForTimeout(2800); await accel(B.pg);
  await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="base"]').click()); await B.pg.waitForTimeout(500);
  const bar = await B.pg.evaluate(() => { const b = document.getElementById("walk-bar"), r = b.getBoundingClientRect(); return { hidden: b.classList.contains("hidden"), txt: document.getElementById("walk-txt").textContent, w: r.width, right: r.right, vw: innerWidth, confirm: (window.__confirms || [])[0] || "" }; });
  assert(!bar.hidden && /เดินไป ค่ายทหารร้าง/.test(bar.txt) && /ช่อง [12]\/3/.test(bar.txt), bar.txt); assert(bar.right <= bar.vw + 1, "แถบไม่ล้นจอมือถือ " + JSON.stringify(bar));
  assert(!bar.confirm.includes("\\n") && bar.confirm.includes("\n"), "ข้อความยืนยันต้องขึ้นบรรทัดใหม่จริง ไม่ใช่ตัวอักษร \\n");
  assert(/Safe Zone → โรงงานร้าง → โรงพยาบาล → ค่ายทหารร้าง/.test(bar.confirm) && /3 ช่อง/.test(bar.confirm) && /พลังงานรวม ~17/.test(bar.confirm) && /โอกาสเจอ\/โดนซุ่มระหว่างทาง: (🟢|🟡|🔴)/.test(bar.confirm), bar.confirm);
  assert(await waitFor(B.pg, () => window.__DB.users.u1.zone === "base"), "เดินถึงค่ายทหาร"); await B.pg.waitForTimeout(800);
  const lg = (await B.pg.evaluate(() => window.__logs || [])).join("\n"); assert(/โรงงานร้าง \(−5 พลังงาน\)/.test(lg) && /โรงพยาบาล \(−5 พลังงาน\)/.test(lg) && /ค่ายทหารร้าง \(−7 พลังงาน\)/.test(lg), "พลังงานต่อช่วงถนน 5/5/7: " + lg.slice(-300));
  const qp = await B.pg.evaluate(() => window.__DB.questProg && window.__DB.questProg.u1 && window.__DB.questProg.u1.weekly); assert(qp && qp.t1 && qp.t1.n === 1 && qp.t2 && qp.t2.n === 1, "เควสไปถึงโซน: โรงพยาบาล(ผ่านทาง)+ค่ายทหาร(ปลายทาง) " + JSON.stringify(qp)); assert(qp.t3 && qp.t3.n === 1, "เดินทางทั่วไปนับ 1 ครั้งต่อการเดิน (ไม่ใช่ 3) " + JSON.stringify(qp));
  assert.strictEqual(await B.pg.evaluate(() => document.getElementById("walk-bar").classList.contains("hidden")), true, "เดินเสร็จแถบหาย");
  // เดินกลับ: โซนที่ติดกันกดทีละช่อง (ไม่ถามยืนยัน) — ค่ายทหาร → โรงพยาบาล
  await B.pg.waitForTimeout(1200); const n0 = await B.pg.evaluate(() => (window.__confirms || []).length); await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="hospital"]').click()); await B.pg.waitForTimeout(700);
  assert.strictEqual(await B.pg.evaluate(() => window.__DB.users.u1.zone), "hospital"); assert.strictEqual(await B.pg.evaluate(() => (window.__confirms || []).length), n0, "ช่องติดกัน = ไม่ต้องยืนยัน");
  // ยกเลิกกลางทาง: โรงพยาบาล → ศูนย์วิจัย ไม่ถามเพราะติดกัน → ลองไป Safe (2 ช่อง) แล้วกดหยุดเดิน
  await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="safe"]').click()); await B.pg.waitForTimeout(400);
  assert.strictEqual(await B.pg.evaluate(() => document.getElementById("walk-bar").classList.contains("hidden")), false, "กำลังเดินกลับ Safe"); await B.pg.evaluate(() => document.getElementById("walk-cancel").click()); await B.pg.waitForTimeout(300);
  assert.strictEqual(await B.pg.evaluate(() => document.getElementById("walk-bar").classList.contains("hidden")), true); const stop = await B.pg.evaluate(() => window.__DB.users.u1.zone); await B.pg.waitForTimeout(2500); assert.strictEqual(await B.pg.evaluate(() => window.__DB.users.u1.zone), stop, "หยุดแล้วไม่เดินต่อ");
  const fatal = B.errs.filter((e) => /^PAGEERROR/.test(e) && !/fxPerkMods/.test(e)); assert.deepStrictEqual(fatal, [], fatal.join("||")); await B.br.close();

  // 3) พลังงานไม่พอ: มี 7 ต้องใช้ 5+5+7 → ไปถึงโรงงาน(5) เหลือ 2 → หยุด
  B = await boot({ faction: "human", viewport: { width: 390, height: 844 }, seed: { tune: { travel_roads: 1 }, config: { roads }, users: user(7) } }); await B.pg.waitForTimeout(2800); await accel(B.pg);
  await B.pg.evaluate(() => document.querySelector('.zone-btn[data-zone="base"]').click()); await B.pg.waitForTimeout(500);
  assert(await waitFor(B.pg, () => document.getElementById("walk-bar").classList.contains("hidden") && window.__DB.users.u1.zone !== "safe", 20000), "หยุดเมื่อพลังงานหมด");
  u = await B.pg.evaluate(() => window.__DB.users.u1); assert.strictEqual(u.zone, "factory", "ไปได้แค่โรงงาน: " + u.zone); await B.br.close();
  // 4) เจ้าของเปิดเกมแล้วตารางถนนในฐานข้อมูลว่าง/ไม่ตรง → ซิงก์ให้เอง (28 รายการ) • ผู้เล่นปกติไม่เขียน
  B = await boot({ faction: "human", role: "owner", seed: { tune: { travel_roads: 0 } } }); await B.pg.waitForTimeout(3500);
  const cfg = await B.pg.evaluate(() => window.__DB.config && window.__DB.config.roads); assert(cfg && Object.keys(cfg).length === 28 && cfg.safe_factory === 5 && cfg.factory_safe === 5 && cfg.hospital_base === 7, "owner auto-sync: " + JSON.stringify(cfg)); await B.br.close();
  B = await boot({ faction: "human", role: "player", seed: { tune: { travel_roads: 0 } } }); await B.pg.waitForTimeout(3500);
  assert.strictEqual(await B.pg.evaluate(() => !!(window.__DB.config && window.__DB.config.roads)), false, "ผู้เล่นปกติไม่ซิงก์"); await B.br.close();
  console.log("uiwalk OK");
})().catch((e) => { console.error(e); process.exit(1); });
