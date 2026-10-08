// 🛡️ โล่ผู้เล่นใหม่ + 🚶 เห็นคนกำลังเดินผ่าน (ฝั่งเกม + Firebase จำลอง)
const { boot } = require("./_fakefb"), assert = require("assert");
const now = Date.now();
const user = (createdAt, extra = {}) => ({ u1: { username: "tester", faction: "human", role: "player", banned: false, zone: "ruins", hp: 100, stamina: 100, staminaTs: now, food: 100, foodTs: now, water: 100, waterTs: now, createdAt, seenAt: now, ...extra } });
const zp = { ruins: { u1: { name: "tester", faction: "human" }, v1: { name: "มือใหม่", faction: "human", nb: true }, v2: { name: "ตัวเก่า", faction: "human" }, v3: { name: "นักเดิน", faction: "zombie", wk: true } } };
const rows = (pg) => pg.evaluate(() => [...document.querySelectorAll("#player-list li")].map((li) => ({ t: li.querySelector("span")?.textContent || "", atk: li.querySelector(".atk-btn")?.textContent || "", dis: li.querySelector(".atk-btn")?.disabled })));
(async () => {
  // 1) ผู้เล่นใหม่ (ฉัน): ธง nb ของฉันถูกเขียนลง zonePlayers • เห็นโล่เป้าหมาย • ปุ่มโจมตีคนที่มีโล่ปิด • คนเดินผ่านมี 🚶
  let B = await boot({ faction: "human", seed: { users: user(now - 3600000), zonePlayers: zp, tune: { travel_roads: 1 } } }); let pg = B.pg; await pg.waitForTimeout(3000);
  await pg.evaluate(() => document.getElementById("clog-close")?.click()); await pg.waitForTimeout(400);
  let r = await rows(pg); console.log(JSON.stringify(r));
  const by = (n) => r.find((x) => x.t.includes(n)); assert(by("(คุณ)").t.includes("🛡️"), "ฉันเห็นโล่ของตัวเอง");
  assert(by("มือใหม่").t.includes("🛡️") && by("มือใหม่").dis === true && /มีโล่/.test(by("มือใหม่").atk), "เป้าหมายมีโล่ ปุ่มปิด");
  assert(!by("ตัวเก่า").t.includes("🛡️") && by("ตัวเก่า").dis === false, "ตัวเก่าโจมตีได้"); assert(by("นักเดิน").t.includes("🚶"), "คนเดินผ่านมี 🚶");
  const mine = await pg.evaluate(() => window.__DB.zonePlayers?.ruins?.u1?.nb); assert(mine === true, "ธง nb ของฉันถูกเขียน");
  // 2) โจมตีตัวเก่า: ต้องยืนยัน + เขียน shield/off + ล้างธง nb ในการโจมตีเดียวกัน
  let dlg = null; pg.on("dialog", async (d) => { dlg = d.message(); await d.accept(); });
  await pg.evaluate(() => [...document.querySelectorAll("#player-list li")].find((li) => li.textContent.includes("ตัวเก่า")).querySelector(".atk-btn").click()); await pg.waitForTimeout(1500);
  console.log("dialog:", dlg && dlg.replace(/\n/g, " / ")); assert(dlg && /โล่ผู้เล่นใหม่/.test(dlg) && /หมดถาวร/.test(dlg), "ถามก่อนโล่หมด");
  const after = await pg.evaluate(() => ({ off: window.__DB.shield?.u1?.off, nb: window.__DB.zonePlayers?.ruins?.u1?.nb, atk: !!(window.__DB.attacks?.v2?.u1) }));
  console.log(JSON.stringify(after)); assert(after.atk && after.off, "โจมตี + เขียน shield/off"); assert(after.nb === undefined || after.nb === null, "ล้างธง nb");
  assert.deepStrictEqual(B.errs.filter((e) => e.startsWith("PAGEERROR") && !/fxPerkMods/.test(e)), []); await B.br.close();
  // 2b) ยกเลิกยืนยัน = ไม่โจมตี ไม่เสียโล่
  B = await boot({ faction: "human", seed: { users: user(now - 3600000), zonePlayers: zp } }); pg = B.pg; await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById("clog-close")?.click()); await pg.waitForTimeout(300);
  pg.on("dialog", (d) => d.dismiss()); await pg.evaluate(() => [...document.querySelectorAll("#player-list li")].find((li) => li.textContent.includes("ตัวเก่า")).querySelector(".atk-btn").click()); await pg.waitForTimeout(1000);
  const kept = await pg.evaluate(() => ({ off: window.__DB.shield?.u1?.off, atk: !!(window.__DB.attacks?.v2?.u1) })); assert(!kept.off && !kept.atk, "ยกเลิก = ไม่เสียโล่ ไม่โจมตี"); await B.br.close();
  // 3) บัญชีเก่า (10 วัน): ไม่มีโล่ ไม่ถามยืนยัน ธง nb ไม่ถูกตั้ง
  B = await boot({ faction: "human", seed: { users: user(now - 10 * 86400000), zonePlayers: zp } }); pg = B.pg; await pg.waitForTimeout(3000); await pg.evaluate(() => document.getElementById("clog-close")?.click()); await pg.waitForTimeout(300);
  r = await rows(pg); assert(!r.find((x) => x.t.includes("(คุณ)")).t.includes("🛡️"), "บัญชีเก่าไม่มีโล่"); assert(!(await pg.evaluate(() => window.__DB.zonePlayers?.ruins?.u1?.nb)), "ไม่ตั้งธง nb");
  let asked = false; pg.on("dialog", async (d) => { asked = true; await d.accept(); }); await pg.evaluate(() => [...document.querySelectorAll("#player-list li")].find((li) => li.textContent.includes("ตัวเก่า")).querySelector(".atk-btn").click()); await pg.waitForTimeout(1200);
  assert(!asked, "บัญชีเก่าไม่ต้องยืนยัน"); assert(!(await pg.evaluate(() => window.__DB.shield?.u1)), "ไม่เขียน shield"); await B.br.close();
  console.log("uishield OK");
})().catch((e) => { console.error(e); process.exit(1); });
