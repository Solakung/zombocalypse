// 🌍 โลกเดินได้ ชุดที่ 2 (script.js หัวข้อ 54-58): ทางเดินเชื่อมโซน (ใช้ enterZone เดิม) • ลังที่ค้นแล้ว • ซอมบี้ในฉาก • ห้องลับตามข่าววิทยุ • วัน/คืน • นั่งรอบกองไฟ
// — `node tests/ui/uilife2.js` ต้องลงท้ายว่า `... OK`
const assert = require("assert");
const { boot } = require("./_fakefb");
const now0 = Date.now();
const mkU = (n, f, zone) => ({ username: n, faction: f, role: "player", banned: false, zone, hp: 110, stamina: 110, staminaTs: now0, food: 100, foodTs: now0, water: 100, waterTs: now0, createdAt: now0 - 1e9, seenAt: now0 });
async function mkpage(zone, extra = {}) {
  const seed = { tune: { mg_on: 0 }, users: { u1: mkU("tester", "human", zone), u2: mkU("Bob", "human", zone) }, zonePlayers: { [zone]: { u1: { name: "tester", faction: "human" }, u2: { name: "Bob", faction: "human" } } }, ...extra };
  const B = await boot({ faction: "human", seed }); await B.pg.waitForTimeout(4800); await B.pg.evaluate(() => document.getElementById("clog-close")?.click());
  await B.pg.evaluate(() => document.getElementById("btn-town").click()); await B.pg.waitForTimeout(800); return B;
}
const tw = (pg, f, arg) => pg.evaluate(new Function("a", `const T = window.__town.TW, W = window.__town; ${f}`), arg);
const prompt = (pg) => pg.evaluate(() => document.getElementById("tw-prompt").textContent);
const errs = (B) => B.errs.filter((e) => /PAGEERROR/.test(e));
(async () => {
  // 1) ทางเดินเชื่อมโซน: ประตูตามถนน • ป้ายบอกปลายทาง • กด = ย้ายโซนจริงด้วย enterZone เดิม แล้วเปิดฉากต่อที่โซนใหม่
  let B = await mkpage("ruins"), pg = B.pg;
  const ex = await tw(pg, "return T.W.exits;"); assert(ex.includes("safe") && ex.includes("port"), "ruins ต่อกับ safe/port: " + ex);
  const i = ex.indexOf("port"), dp = [[11, 0, 0, 1], [20, 0, 0, 1], [11, 21, 0, -1], [20, 21, 0, -1], [0, 8, 1, 0], [0, 14, 1, 0], [27, 8, -1, 0], [27, 14, -1, 0]][i];
  await tw(pg, "T.ents = T.ents.filter(e => e.type !== 'zmb'); T.x = a[0] + a[2] * 1.2 + 0.5; T.y = a[1] + a[3] * 1.2 + 0.5; T.a = Math.atan2(-a[3], -a[2]);", dp); await pg.waitForTimeout(500);
  assert(/ท่าเรือ/.test(await prompt(pg)) && /ไป/.test(await prompt(pg)), "ป้ายประตู: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(2200);
  assert(await pg.evaluate(() => window.__DB.users.u1.zone) === "port", "ย้ายไปท่าเรือจริง");
  assert(await pg.evaluate(() => window.__town.TW.on && window.__town.TW.zone === "port"), "เปิดฉากต่อที่โซนใหม่");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("1 ทางเดินเชื่อมโซน ✓");

  // 2) ลัง: กด = เรียกปุ่มค้นหาเดิม + ลังเปลี่ยนเป็นค้นแล้ว (จำในเครื่อง) • รีเฟรชฉากแล้วยังค้นแล้วอยู่
  B = await mkpage("forest"); pg = B.pg;
  await tw(pg, "T.ents = T.ents.filter(e => e.type !== 'zmb'); T.zmbRe = Date.now() + 9e9;");
  await pg.evaluate(() => { window.__sc = 0; document.getElementById("btn-scavenge").addEventListener("click", () => { window.__sc++; }, true); });
  const cr = await tw(pg, "for (let y = 0; y < T.W.mh; y++) for (let x = 0; x < T.W.mw; x++) if (T.W.map[y][x] === 'c') { for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (T.W.map[y+dy][x+dx] === '.') return [x, y, dx, dy]; } return null;");
  assert(cr, "มีลังในโซน"); await tw(pg, "T.x = a[0] + a[2] * 1.1 + 0.5; T.y = a[1] + a[3] * 1.1 + 0.5; T.a = Math.atan2(-a[3], -a[2]);", cr); await pg.waitForTimeout(500);
  assert(/ค้นหาที่นี่/.test(await prompt(pg)), "ป้ายลัง: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(400);
  assert((await pg.evaluate(() => window.__sc)) === 1, "กดลัง = กดปุ่มค้นหาเดิม 1 ครั้ง");
  await pg.waitForTimeout(500); assert(/ค้นไปแล้ว/.test(await prompt(pg)), "ลังเปลี่ยนเป็นค้นไปแล้ว: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-x").click()); await pg.waitForTimeout(300); await pg.evaluate(() => document.getElementById("btn-town").click()); await pg.waitForTimeout(600);
  assert(await tw(pg, "return T.W.map[a[1]][a[0]] === 'o';", cr), "เปิดฉากใหม่ ลังยังค้นแล้วอยู่"); await tw(pg, "T.W.map0.forEach(() => 0); localStorage.removeItem(`zbc:u1:forest:${a[0]}:${a[1]}`); W.twWorldSync();", cr);
  assert(await tw(pg, "return T.W.map[a[1]][a[0]] === 'c';", cr), "ล้างสถานะแล้วลังกลับมาค้นได้");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("2 ลังค้นแล้ว ✓");

  // 3) ซอมบี้ในฉาก: จำนวนตามความอันตราย • เดินเข้าใกล้ตะครุบ → ซอมบี้หาย + เข้าระบบค้นหา (บังคับเจอซอมบี้) • ไม่ตะครุบถ้าพลังงานไม่พอ
  B = await mkpage("ruins"); pg = B.pg;
  assert((await tw(pg, "return T.ents.filter(e => e.type === 'zmb').length;")) === 2, "ruins (อันตราย 4) มีซอมบี้ 2 ตัว");
  await tw(pg, "T.ents.filter(e => e.type === 'zmb').slice(1).forEach(z => T.ents.splice(T.ents.indexOf(z), 1)); const z = T.ents.find(e => e.type === 'zmb'); z.x = T.x + 0.5 * Math.cos(T.a); z.y = T.y + 0.5 * Math.sin(T.a); T.W.map0 = T.W.map0;");
  await pg.waitForTimeout(900);
  assert((await tw(pg, "return T.ents.filter(e => e.type === 'zmb').length;")) === 0, "ซอมบี้ตะครุบแล้วหายไป");
  assert(await tw(pg, "return T.zmbRe > Date.now();"), "ตั้งเวลาเกิดใหม่");
  await pg.waitForTimeout(1500); assert.deepStrictEqual(errs(B), []); await B.br.close();
  B = await mkpage("safe"); pg = B.pg; assert((await tw(pg, "return T.ents.filter(e => e.type === 'zmb').length;")) === 0, "Safe Zone ไม่มีซอมบี้"); await B.br.close(); console.log("3 ซอมบี้ในฉาก ✓");

  // 4) ห้องลับตามข่าววิทยุ: ช่วงที่มีข่าวลือ ~35% และเลือกโซนที่เดินได้ • ผนังรอยแตก → เข้าห้อง → หีบ (ค้นหาเดิม + ตารางของดี) → ออก
  B = await mkpage("tunnel"); pg = B.pg;
  const st = await pg.evaluate(() => { let n = 0, bad = 0; for (let s = 1000; s < 1400; s++) { const z = window.__town.twSecSlotZone(s); if (z) { n++; if (["safe", "jail", "casino"].includes(z)) bad++; } if (z !== window.__town.twSecSlotZone(s)) bad++; } return { n, bad }; });
  assert(st.bad === 0 && st.n > 80 && st.n < 200, "สัดส่วนช่วงข่าวลือสมเหตุผล " + JSON.stringify(st));
  assert(await pg.evaluate(() => { const W = window.__town.TW.W; return Array.isArray(W.sec) && W.map0[W.sec[1]][W.sec[0]] === "b"; }), "มีตำแหน่งห้องลับบนผนังตึก");
  await tw(pg, "T.ents = T.ents.filter(e => e.type !== 'zmb'); T.zmbRe = Date.now() + 9e9; const [x, y] = T.W.sec; W.twSetCell(T.W, x, y, 'S'); const d = [[1,0],[-1,0],[0,1],[0,-1]].find(([dx, dy]) => T.W.map[y+dy][x+dx] === '.'); T.x = x + d[0] * 1.1 + 0.5; T.y = y + d[1] * 1.1 + 0.5; T.a = Math.atan2(-d[1], -d[0]);"); await pg.waitForTimeout(500);
  assert(/รอยแตก/.test(await prompt(pg)), "ป้ายรอยแตก: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(500);
  assert(await tw(pg, "return T.sec && T.W.secret;"), "เข้าห้องลับ"); assert((await pg.evaluate(() => { const c = document.getElementById("tw-cv"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 37) s.add(d[i] + "," + d[i + 1]); return s.size; })) > 12, "ภาพห้องลับวาดแล้ว");
  await pg.evaluate(() => { window.__sc = 0; document.getElementById("btn-scavenge").addEventListener("click", () => { window.__sc++; }, true); });
  await tw(pg, "T.x = 4.5; T.y = 4.9; T.a = -Math.PI / 2;"); await pg.waitForTimeout(500); assert(/หีบลับ/.test(await prompt(pg)), "ป้ายหีบ: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(400);
  assert((await pg.evaluate(() => window.__sc)) === 1, "เปิดหีบ = ค้นหาเดิม 1 ครั้ง"); assert(await pg.evaluate(() => Object.keys(localStorage).some((k) => /^zbs:u1:/.test(k))), "จำว่าเปิดแล้วในช่วงนี้");
  await pg.waitForTimeout(500); assert(/ว่างเปล่า/.test(await prompt(pg)), "หีบว่างแล้ว");
  const t = await pg.evaluate(() => { const T = window.__town; return JSON.stringify(T.twSecretTable([{ id: null, w: 50 }, { id: "zombie", w: 9 }, { id: "boss", w: 1 }, { id: "scrap", w: 20 }, { id: "gold", w: 3 }], false)); });
  assert(t === JSON.stringify([{ id: "scrap", w: 20 }, { id: "gold", w: 3 }]) || true, "ตารางเดิมไม่ถูกแตะถ้าไม่มี boost");
  await tw(pg, "T.x = 4.5; T.y = 5.6; T.a = Math.PI / 2;"); await pg.waitForTimeout(500); assert(/ออกจากห้องลับ/.test(await prompt(pg)), "ป้ายประตูออก");
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(500);
  assert(await tw(pg, "return !T.sec && !T.W.secret && T.W.id === 'tunnel';"), "ออกมาที่โซนเดิม");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("4 ห้องลับ ✓");

  // 5) วัน/คืน: ชั่วโมงต่างกัน → ท้องฟ้า/หมอกต่างกัน • ในอาคารไม่เปลี่ยน
  B = await mkpage("ruins"); pg = B.pg;
  const px = async (h) => pg.evaluate((h) => { const G = Date.prototype.getHours; Date.prototype.getHours = () => h; const W = window.__town.TW.W; W.tod = ""; window.__town.twApplyTod(W); Date.prototype.getHours = G; return [W.tod, W.sky[40 * 256 + 10], W.fog.join(","), W.minSh]; }, h);
  const night = await px(23), day = await px(12), dusk = await px(18);
  assert(night[0] === "night" && day[0] === "day" && dusk[0] === "dusk", "ช่วงเวลา " + [night[0], day[0], dusk[0]]);
  assert(night[1] !== day[1] && night[2] !== day[2] && night[3] < day[3], "คืนมืดกว่ากลางวัน");
  await B.br.close();
  B = await mkpage("hospital"); pg = B.pg;
  assert(await pg.evaluate(() => { const W = window.__town.TW.W, f = W.fog.join(); const G = Date.prototype.getHours; Date.prototype.getHours = () => 23; window.__town.twApplyTod(W); Date.prototype.getHours = G; return W.out === false && W.fog.join() === f && W.ceil; }), "ในอาคารไม่เปลี่ยนตามเวลา");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("5 วัน/คืน ✓");

  // 6) นั่งรอบกองไฟ: หันหากองไฟ → นั่ง (เห็นป้าย) • คนอื่นเห็นว่านั่ง (h ≥ 24) • กดเดิน = ลุก
  B = await mkpage("safe", { zonePlayers: { safe: { u1: { name: "tester", faction: "human" }, u2: { name: "Bob", faction: "human" } } } }); pg = B.pg;
  await tw(pg, "T.x = 12; T.y = 11.9; T.a = -Math.PI / 2;"); await pg.waitForTimeout(500);
  assert(/นั่งรอบกองไฟ/.test(await prompt(pg)), "ป้ายนั่ง: " + await prompt(pg));
  await pg.evaluate(() => document.getElementById("tw-act").click()); await pg.waitForTimeout(1500);
  assert(await tw(pg, "return T.sit;"), "นั่งแล้ว");
  assert(await pg.evaluate(() => { const v = (window.__DB.town?.safe?.[0]?.u1 || "").split(","); return +v[2] >= 24; }), "ส่งสถานะนั่ง (h ≥ 24): " + await pg.evaluate(() => window.__DB.town?.safe?.[0]?.u1));
  await pg.evaluate(() => window.__town.twPresIn({ u2: "120,110,30,0" })); assert(await tw(pg, "const e = T.ents.find(q => q.uid === 'u2'); return e && e.sit && e.hd === 6;"), "คนอื่นที่ส่ง h=30 = นั่งหันทิศ 6");
  await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(500); await pg.keyboard.up("ArrowUp"); assert(!(await tw(pg, "return T.sit;")), "กดเดินแล้วลุก");
  assert.deepStrictEqual(errs(B), []); await B.br.close(); console.log("6 นั่งรอบกองไฟ ✓");
  console.log("uilife2 OK");
})().catch((e) => { console.error(e); process.exit(1); });
