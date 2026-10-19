// 🎭 ฉากเดินมีชีวิต (script.js หัวข้อ 54-57): ท่าทาง (/me + ไอคอนลอย) • บรรยากาศเหตุการณ์ • กองศพจากข้อความ combat • ป้ายค่าหัว — `node tests/ui/uilife.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
const now0 = Date.now();
const mkU = (n, f) => ({ username: n, faction: f, role: "player", banned: false, zone: "ruins", hp: 110, stamina: 110, staminaTs: now0, food: 100, foodTs: now0, water: 100, waterTs: now0, createdAt: now0 - 1e9, seenAt: now0 });
const shown = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains("hidden") && getComputedStyle(e).display !== "none"; }, sel);
(async () => {
  const B = await boot({ faction: "human", seed: { tune: { mg_on: 0 }, users: { u1: mkU("tester", "human"), u2: mkU("Bob", "human") }, zonePlayers: { ruins: { u1: { name: "tester", faction: "human" }, u2: { name: "Bob", faction: "human" } } }, town: { ruins: { 0: { u2: "115,80,0,0" } } }, bounty: { u2: { ts: now0, tn: "Bob", bn: "Zed" } } } });
  const pg = B.pg; await pg.waitForTimeout(4800); await pg.evaluate(() => document.getElementById("clog-close")?.click());
  await pg.evaluate(() => document.getElementById("btn-town").click()); await pg.waitForTimeout(900);
  const tw = (f) => pg.evaluate(new Function(`const T = window.__town.TW; ${f}`));
  // ท่าทาง: เมนูค้างอยู่ (ไม่ถูกปิดเองตอนไม่มีเป้าหมาย) • ส่ง /me จริง • คนอื่นส่งมา → ไอคอน+กระโดด
  await pg.evaluate(() => document.getElementById("tw-emob").click()); await pg.waitForTimeout(500);
  assert(await shown(pg, "#tw-pop") && (await pg.evaluate(() => document.querySelectorAll("#tw-pop .tw-emo").length)) === 5, "เมนูท่าทาง 5 ปุ่ม และไม่ถูกปิดเอง");
  await pg.evaluate(() => document.querySelector("#tw-pop .tw-emo").click()); await pg.waitForTimeout(700);
  assert(await pg.evaluate(() => Object.values(window.__DB.chats?.ruins || {}).some((m) => m.type === "emote" && m.uid === "u1" && m.text.startsWith("👋"))), "ส่ง /me ผ่านแชทเดิม");
  assert(!(await shown(pg, "#tw-pop")), "เมนูปิดหลังเลือก");
  await pg.evaluate(() => window.__town.townChat({ uid: "u2", name: "Bob", faction: "human", text: "😂 หัวเราะ", type: "emote", ts: Date.now() }));
  assert(await tw("const e = T.ents.find(q => q.uid === 'u2'); return e.bub === '😂' && e.hopT > performance.now();"), "ไอคอนลอย+กระโดดเหนือหัวคนอื่น");
  // ป้ายค่าหัว
  await tw("T.x = 11.5; T.y = 6.2; T.a = Math.PI/2;"); await pg.waitForTimeout(500);
  assert(/💰/.test(await pg.evaluate(() => document.getElementById("tw-ov").innerText)), "ป้ายค่าหัว 💰 เหนือชื่อ");
  // กองศพ
  await pg.evaluate(() => window.__town.townChat({ uid: "u1", name: "tester", faction: "human", type: "combat", text: "⚔ Zed ทอย 6 vs Bob ทอยป้องกันได้ 1 → Zed โจมตีโดน! −30 HP — Bob ล้มลง!", ts: Date.now() })); await pg.waitForTimeout(400);
  assert(await tw("return T.ents.some(e => e.type === 'corpse' && e.nm.includes('Bob'));"), "เกิดกองศพของ Bob");
  await pg.evaluate(() => window.__town.townChat({ uid: "u1", type: "combat", text: "⚔ ทอย 6 vs ทอยป้องกันได้ 1 → Bob ล้มลง!", ts: Date.now() - 600000 })); // เก่า = ไม่นับซ้ำ
  assert((await tw("return T.ents.filter(e => e.type === 'corpse').length;")) === 1, "ข้อความเก่าไม่สร้างศพ/ไม่ซ้ำ");
  await tw("T.ents.find(e => e.type === 'corpse').until = Date.now() - 1;"); await pg.waitForTimeout(300);
  assert((await tw("return T.ents.filter(e => e.type === 'corpse').length;")) === 0, "ศพหายเมื่อหมดเวลา");
  // บรรยากาศเหตุการณ์
  for (const t of ["blackout", "horde", "air"]) { await pg.evaluate((t) => window.__town.twAmbSet(t), t); assert(await pg.evaluate((t) => document.getElementById("tw-amb").classList.contains(t), t) && await shown(pg, "#tw-evt"), "บรรยากาศ " + t); }
  await pg.evaluate(() => window.__town.twAmbSet("")); assert(!(await shown(pg, "#tw-evt")), "ไม่มีเหตุการณ์ = ไม่มีป้าย");
  await pg.waitForTimeout(300);
  assert(await pg.evaluate(() => window.__town.TW.on), "ฉากยังเปิดอยู่ ไม่พัง");
  assert.deepStrictEqual(B.errs.filter((e) => /PAGEERROR/.test(e)), []); await B.br.close(); console.log("uilife OK");
})().catch((e) => { console.error(e); process.exit(1); });
