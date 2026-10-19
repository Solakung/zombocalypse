// 🏘️ เมืองค่ายแบบ Doom + 🎨 อวาตาร์พิกเซล (script.js หัวข้อ 53-55): ปุ่มเข้า/ออก • เดิน/ชน/หมุน • NPC (ธาราโผล่เมื่อ hcFound เท่านั้น) •
// ประตู/ป้าย • ผู้เล่นอื่น + บับเบิลแชท • ส่งตำแหน่ง town/{uid} • ตัววาดอวาตาร์ (วาด/เท/ย้อน/แม่แบบ/บันทึก/ลบ) • วงกลมแชทใช้หน้าพิกเซล
// ใช้เกมจริงกับ Firebase จำลอง (_fakefb) ที่ 360px — รันด้วย `node tests/ui/uitown.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
const now0 = Date.now();
const mkU = (n, f, zone = "safe") => ({ username: n, faction: f, role: "player", banned: false, zone, hp: 110, stamina: 110, staminaTs: now0, food: 100, foodTs: now0, water: 100, waterTs: now0, createdAt: now0 - 1e9, seenAt: now0 });
async function mkpage(o = {}) {
  const zone = o.zone || "safe";
  const seed = { tune: { mg_on: 0, ...(o.tune || {}) }, users: { u1: { ...mkU("tester", o.faction || "human", zone), ...(o.user || {}) }, u2: mkU("Bob", "human"), u3: mkU("Zed", "zombie") }, ...(o.seed || {}) };
  const B = await boot({ faction: o.faction || "human", seed });
  await B.pg.waitForTimeout(4800); await B.pg.evaluate(() => document.getElementById("clog-close")?.click());
  return B;
}
const shown = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
const click = (pg, id) => pg.evaluate((i) => document.getElementById(i).click(), id);
const errs = (B) => B.errs.filter((e) => /PAGEERROR/.test(e));
const tw = (pg, f, arg) => pg.evaluate(new Function("a", `const T = window.__town.TW; ${f}`), arg);
const tp = (pg, x, y, a) => tw(pg, "T.x = a[0]; T.y = a[1]; T.a = a[2];", [x, y, a]);
const canvasColors = (pg) => pg.evaluate(() => { const c = document.getElementById("tw-cv"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 37) s.add(d[i] + "," + d[i + 1] + "," + d[i + 2]); return { w: c.width, h: c.height, n: s.size }; });
const prompt = (pg) => pg.evaluate(() => document.getElementById("tw-prompt").textContent);

(async () => {
  // 1) ปุ่ม: เห็นเฉพาะ Safe Zone และเมื่อเปิดด้วย tune town_on • เปิด/ปิดฉาก • ภาพไม่ว่าง
  let B = await mkpage({ seed: { zonePlayers: { safe: { u1: { name: "tester", faction: "human" }, u2: { name: "Bob", faction: "human" }, u3: { name: "Zed", faction: "zombie" } } }, town: { safe: { 0: { u2: "100,100,0,0", u3: "126,112,6,0" } } } } }), pg = B.pg;
  assert(await pg.evaluate(() => { const b = document.getElementById("btn-town"); return !!b && !b.classList.contains("hidden"); }), "Safe Zone → มีปุ่มเดินในค่าย");
  assert(!(await shown(pg, "#tw-root")), "ยังไม่เปิดฉาก");
  await click(pg, "btn-town"); await pg.waitForTimeout(700);
  assert(await shown(pg, "#tw-root"), "เปิดฉากค่าย");
  assert(!(await pg.evaluate(() => document.getElementById("tw-root").classList.contains("modal"))), "ฉากไม่ใช้คลาส modal (ไม่บล็อกหน้าต่างอื่น)");
  const cv = await canvasColors(pg); assert(cv.w === 160 && cv.h === 136 && cv.n > 25, "ภาพวาดแล้ว " + JSON.stringify(cv));
  assert(/👥/.test(await pg.evaluate(() => document.getElementById("tw-cnt").textContent)), "แสดงจำนวนคนในฉาก");
  let ents = await tw(pg, "return T.ents.map(e => e.type + ':' + (e.id || e.uid || ''));");
  assert(ents.includes("npc:kane") && ents.includes("npc:mira"), "เคน/มิรา ยืนในค่าย " + ents);
  assert(!ents.includes("npc:tara"), "ธารายังไม่ปรากฏ (ยังไม่ hcFound) " + ents);
  assert(ents.includes("player:u2") && ents.includes("player:u3"), "เห็นผู้เล่นอื่นจาก town/ " + ents);
  assert(/👥 3/.test(await pg.evaluate(() => document.getElementById("tw-cnt").textContent)), "นับ 3 คน");
  // เดิน/ชน: เดินหน้านาน ๆ ไม่ทะลุกำแพง/กองไฟ • หมุนเปลี่ยนมุม
  const a0 = await tw(pg, "return T.a;"); await pg.keyboard.down("ArrowRight"); await pg.waitForTimeout(500); await pg.keyboard.up("ArrowRight");
  assert((await tw(pg, "return T.a;")) !== a0, "กดหันขวาแล้วมุมเปลี่ยน");
  await tp(pg, 12, 13.2, -Math.PI / 2); await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(2600); await pg.keyboard.up("ArrowUp");
  let pos = await tw(pg, "return [T.x, T.y];"); assert(pos[1] > 10.5 && pos[1] < 13.2, "เดินหน้าแล้วหยุดที่กองไฟ (ไม่ทะลุ) " + pos);
  await tp(pg, 12, 13.2, Math.PI / 2); await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(3500); await pg.keyboard.up("ArrowUp");
  pos = await tw(pg, "return [T.x, T.y];"); assert(pos[1] < 15 && pos[1] > 13, "เดินไปทางตึกแล้วชนผนัง " + pos);
  await tp(pg, 12, 13.2, 0); await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(6000); await pg.keyboard.up("ArrowUp");
  pos = await tw(pg, "return [T.x, T.y];"); assert(pos[0] < 23 && pos[0] > 15, "เดินไปทางขวาชนรั้ว " + pos);
  // ส่งตำแหน่งของตัวเองให้คนอื่น
  await pg.waitForTimeout(700); assert(await pg.evaluate(() => /^\d{1,3},\d{1,3},\d{1,2},[01]$/.test(window.__DB.town?.safe?.[0]?.u1 || "")), "เขียน town/safe/0/u1 เป็น x,y,h,m");
  assert((await pg.evaluate(() => window.__DB.town.safe[0].u1)) !== undefined, "มีตำแหน่ง");
  // NPC: หันหามิรา → ข้อความปุ่ม → กดใช้ → เปิดหน้าต่างคุย
  await tp(pg, 7.2, 8.6, Math.PI); await pg.waitForTimeout(400); assert(/มิรา/.test(await prompt(pg)), "ข้อความบอกคุยกับมิรา: " + await prompt(pg));
  assert(await pg.evaluate(() => document.getElementById("tw-act").classList.contains("ready")), "ปุ่มใช้พร้อม");
  await click(pg, "tw-act"); await pg.waitForTimeout(500); assert(await shown(pg, "#npc-modal"), "เปิดหน้าต่างคุยมิรา"); await pg.evaluate(() => document.querySelector("#npc-modal .btn.ghost")?.click()); await pg.waitForTimeout(200);
  // ประตูตลาด → กดปุ่มตลาดเดิม • ประตูค่าย → ปิดฉากแล้วไปแท็บโซน
  await pg.evaluate(() => { window.__mk = 0; const b = document.getElementById("btn-market"); if (b) b.addEventListener("click", () => { window.__mk++; }); });
  await tp(pg, 5.6, 14.3, Math.PI / 2); await pg.waitForTimeout(400); assert(/ตลาด/.test(await prompt(pg)), "ข้อความประตูตลาด"); await click(pg, "tw-act"); await pg.waitForTimeout(300);
  if (await pg.evaluate(() => !!document.getElementById("btn-market"))) assert((await pg.evaluate(() => window.__mk)) === 1, "กดประตูตลาด = เรียกปุ่มตลาดเดิม");
  await pg.evaluate(() => document.querySelectorAll(".modal:not(.hidden)").forEach((m) => m.classList.add("hidden")));
  await tp(pg, 11.5, 2.4, -Math.PI / 2); await pg.waitForTimeout(500);
  await tw(pg, "T.x = 12.0; T.y = 3.6; T.a = -Math.PI/2 + 0.0;"); await tw(pg, "T.ents = T.ents.filter(e => e.type !== 'npc'); T.npcSig = 'x';"); await tp(pg, 11.2, 1.4, -Math.PI / 2); await pg.waitForTimeout(400);
  assert(/ประตูค่าย/.test(await prompt(pg)), "ข้อความประตูค่าย: " + await prompt(pg));
  await click(pg, "tw-act"); await pg.waitForTimeout(400); assert(!(await shown(pg, "#tw-root")), "ประตูค่าย = ปิดฉาก");
  assert(await pg.evaluate(() => document.querySelector('.tabbar [data-tab="map"]').classList.contains("on")), "ไปแท็บโซน");
  await pg.waitForTimeout(300); assert(await pg.evaluate(() => window.__DB.town?.safe?.[0]?.u1 === undefined), "ปิดฉากแล้วลบตำแหน่ง town/u1");
  assert.deepStrictEqual(errs(B), [], "ไม่มี error"); await B.br.close(); console.log("1 เปิด/เดิน/ชน/NPC/ประตู/ส่งตำแหน่ง ✓");

  // 2) ธาราปรากฏเฉพาะเมื่อ hcFound • บับเบิลแชท • ออกด้วยปุ่ม ✕
  B = await mkpage({ seed: { npc: { u1: { tara: { p: 0, d: 0, s: 0, m: 1 << 22, v: 0 } } }, zonePlayers: { safe: { u1: { name: "tester", faction: "human" }, u2: { name: "Bob", faction: "human" } } }, town: { safe: { 0: { u2: "126,100,0,0" } } } } }); pg = B.pg;
  await click(pg, "btn-town"); await pg.waitForTimeout(900);
  ents = await tw(pg, "return T.ents.map(e => e.type + ':' + (e.id || e.uid || ''));"); assert(ents.includes("npc:tara"), "เจอธาราแล้ว → ธารายืนในเต็นท์วิจัย " + ents);
  await tp(pg, 14.5, 11, -Math.PI / 2 + 0.4); await pg.waitForTimeout(300);
  await pg.evaluate(() => window.__town.townChat({ uid: "u2", name: "Bob", faction: "human", text: "สวัสดีทุกคน", type: "chat", ts: Date.now() })); await pg.waitForTimeout(500);
  assert(/สวัสดีทุกคน/.test(await pg.evaluate(() => document.getElementById("tw-log").innerText)), "ข้อความเข้าแถบแชทของฉาก");
  assert((await tw(pg, "return T.ents.find(e => e.uid === 'u2').bub;")) === "สวัสดีทุกคน", "ตั้งบับเบิลเหนือหัวผู้พูด");
  await pg.evaluate(() => window.__town.townChat({ uid: "u2", name: "Bob", faction: "human", text: "ข้อความเก่า", type: "chat", ts: Date.now() - 600000 })); assert(!/ข้อความเก่า/.test(await pg.evaluate(() => document.getElementById("tw-log").innerText)), "ข้อความเก่าไม่เข้า");
  await pg.fill("#tw-in", "ทดสอบพิมพ์"); await pg.evaluate(() => document.getElementById("tw-in").form.requestSubmit()); await pg.waitForTimeout(500);
  assert(await pg.evaluate(() => Object.values(window.__DB.chats?.safe || {}).some((m) => m.text === "ทดสอบพิมพ์" && m.uid === "u1")), "พิมพ์ในฉากส่งแชทโซนจริง");
  await click(pg, "tw-x"); await pg.waitForTimeout(200); assert(!(await shown(pg, "#tw-root")), "ปุ่มออกปิดฉาก");
  assert.deepStrictEqual(errs(B), [], "ไม่มี error"); await B.br.close(); console.log("2 ธารา/แชท/ออก ✓");

  // 3) โซนอื่นมีปุ่ม • คุก/บ่อนไม่มี • town_on = 0 ซ่อน
  B = await mkpage({ zone: "ruins" }); pg = B.pg;
  assert(await pg.evaluate(() => { const b = document.getElementById("btn-town"); return !!b && !b.classList.contains("hidden") && /เดินสำรวจ/.test(b.textContent); }), "โซนอื่นมีปุ่มเดินสำรวจ");
  await B.br.close();
  B = await mkpage({ zone: "jail" }); pg = B.pg;
  assert(await pg.evaluate(() => { const b = document.getElementById("btn-town"); return !b || b.classList.contains("hidden"); }), "คุกไม่มีปุ่ม");
  await B.br.close();
  B = await mkpage({ tune: { town_on: 0 } }); pg = B.pg;
  assert(await pg.evaluate(() => { const b = document.getElementById("btn-town"); return !b || b.classList.contains("hidden"); }), "town_on=0 → ซ่อนปุ่ม");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("3 สวิตช์ ✓");

  // 4) ตัววาดอวาตาร์: เปิด/วาด/เท/ย้อน/แม่แบบ/บันทึก/ลบ + วงกลมแชทใช้หน้าพิกเซลของผู้ที่วาดไว้
  B = await mkpage({ seed: { chats: { safe: { m1: { uid: "u2", name: "Bob", faction: "human", text: "hi", type: "chat", ts: Date.now() } } } } }); pg = B.pg;
  const hex2 = await pg.evaluate(() => window.__town.pxaEnc(window.__town.pxaTemplate(2, "u2", "human"))); assert(/^[0-9a-f]{384}$/.test(hex2), "แม่แบบเข้ารหัสได้ 384 ตัว");
  await pg.evaluate((h) => { window.__DB.pxav = { u2: h }; }, hex2);
  await click(pg, "btn-town"); await pg.waitForTimeout(600); await click(pg, "tw-paint"); await pg.waitForTimeout(400);
  assert(await shown(pg, "#pxa-modal"), "เปิดตัววาด");
  const filled0 = await pg.evaluate(() => { const c = document.getElementById("pxa-cv").getContext("2d").getImageData(0, 0, 224, 336).data; let n = 0; for (let i = 0; i < c.length; i += 4 * 211) n += c[i] + c[i + 1]; return n; }); assert(filled0 > 0, "ภาพตั้งต้นวาดแล้ว");
  // วาดจุดที่มุมซ้ายบน (ช่องว่าง) ด้วยสีแดง + สมมาตร → ได้ 2 ช่อง
  await pg.evaluate(() => document.querySelector('#pxa-pal .pxa-sw[data-i="6"]').click());
  const box = await pg.evaluate(() => { const r = document.getElementById("pxa-cv").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await pg.mouse.click(box.x + box.w * (0.5 / 16), box.y + box.h * (0.5 / 24));
  assert(await pg.evaluate(() => { const c = document.getElementById("pxa-cv").getContext("2d"), a = c.getImageData(7, 7, 1, 1).data, b = c.getImageData(15 * 14 + 7, 7, 1, 1).data; return a[0] > 180 && a[1] < 80 && b[0] > 180 && b[1] < 80; }), "ปากกา + สมมาตร: จุดแดงทั้งซ้ายและขวา");
  await click(pg, "pxa-t-undo"); assert(await pg.evaluate(() => { const a = document.getElementById("pxa-cv").getContext("2d").getImageData(7, 7, 1, 1).data; return !(a[0] > 180 && a[1] < 80); }), "ย้อนกลับได้");
  await click(pg, "pxa-t-fill"); await pg.evaluate(() => document.querySelector('#pxa-pal .pxa-sw[data-i="9"]').click());
  await pg.mouse.click(box.x + box.w * (0.5 / 16), box.y + box.h * (0.5 / 24));   // เทพื้นว่างทั้งหมดเป็นเขียว
  assert(await pg.evaluate(() => { const a = document.getElementById("pxa-cv").getContext("2d").getImageData(7, 7, 1, 1).data; return a[1] > 120 && a[0] < 100; }), "เทสีเต็มพื้นที่");
  await click(pg, "pxa-t-tpl"); await pg.waitForTimeout(100);
  await click(pg, "pxa-save"); await pg.waitForTimeout(500);
  const saved = await pg.evaluate(() => window.__DB.pxav?.u1 || ""); assert(/^[0-9a-f]{384}$/.test(saved), "บันทึก pxav/u1 เป็น 384 ตัวอักษรฐาน 16");
  assert(!(await shown(pg, "#pxa-modal")), "บันทึกแล้วปิดหน้าต่าง");
  // วงกลมรูปในแชทของ Bob ใช้หน้าพิกเซลที่เขาวาด (pxav/u2) — ตรวจจากแชทที่โหลดไว้แล้ว
  await B.br.close();
  B = await mkpage({ seed: { pxav: { u2: hex2 }, chats: { safe: { m1: { uid: "u2", name: "Bob", faction: "human", text: "hi", type: "chat", ts: Date.now() } } } } }); pg = B.pg;
  await pg.waitForTimeout(800); assert((await pg.evaluate(() => document.querySelectorAll("#chat-log .cav canvas").length)) >= 1, "วงกลมแชทแสดงหน้าพิกเซลของผู้ที่วาดไว้");
  await B.br.close();
  B = await mkpage({ tune: { px_on: 0 }, seed: { pxav: { u2: hex2 }, chats: { safe: { m1: { uid: "u2", name: "Bob", faction: "human", text: "hi", type: "chat", ts: Date.now() } } } } }); pg = B.pg;
  await pg.waitForTimeout(800); assert((await pg.evaluate(() => document.querySelectorAll("#chat-log .cav canvas").length)) === 0, "px_on=0 → ไม่ใช้หน้าพิกเซล");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("4 อวาตาร์พิกเซล ✓");
  console.log("uitown OK");
})().catch((e) => { console.error(e); process.exit(1); });
