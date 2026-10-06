process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=s4" });
const db = admin.database();
const Dv = require(F + "dive"), N = require(F + "nemesis"), Rd = require(F + "radio"), Cv = require(F + "caravan");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const ids = new Set(); const add = (l) => l.forEach(([id]) => ids.add(id));
Object.values(Dv.LOOT).forEach((f) => Object.values(f).forEach(add)); Object.values(Dv.FIRST).forEach((f) => { add(f.human); add(f.zombie); }); add([["survivor_badge", 1]]);
add(N.LOOT.human); add(N.LOOT.zombie); add(N.LOOT_RARE.human); add(N.LOOT_RARE.zombie); add([["boss_trophy", 1]]); N.TRAITS.forEach((t) => add([t.weak])); add([N.TRAP, N.ZH.weak]);
add(Rd.REW.big.human); add(Rd.REW.big.zombie); add(Rd.REW.small.human); add(Rd.REW.small.zombie);
Cv.GOODS.forEach((g) => { add([[g.id, 1]]); add(g.cost); });
let bad = 0; for (const id of [...ids].filter((x) => !/^(seed|deco|theme)_/.test(x))) if (!new RegExp("^  " + id + ": \\{", "m").test(sc) || !wl.test(id)) { bad++; console.log("BAD id", id); }
assert(!bad); console.log("item ids ok:", ids.size);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
const NOW = Date.UTC(2026, 8, 7, 3);
const rig = (vals) => { let i = 0; Math.random = () => vals[i++ % vals.length]; };
const rnd = Math.random;
(async () => {
  await db.ref().set({ users: { t: { username: "t", faction: "human", hp: 80, zone: "tunnel" }, l: { username: "l", faction: "zombie", hp: 60, zone: "lab" }, r: { username: "r", faction: "human", hp: 70, zone: "ruins" } } });
  const dv = Dv.makeDive(db), nm = N.makeNemesis(db), rd = Rd.makeRadio(db), cv = Cv.makeCaravan(db);
  // ===== DIVE =====
  await rej(dv.run("r", { a: "start" }, NOW), "อุโมงค์"); await rej(dv.run("t", { a: "start" }, NOW), "เตรียมตัว");
  await db.ref("inventory/t/scrap").set({ id: "scrap", qty: 10 });
  let d = await dv.run("t", { a: "start" }, NOW); assert(d.on && d.fl === 1 && d.opts.length === 3 && d.stab === 100);
  assert.strictEqual((await db.ref("inventory/t/scrap").get()).val().qty, 8);
  await rej(dv.run("t", { a: "start" }, NOW), "อยู่แล้ว");
  rig([0.0]);   // ทุกการทอยสำเร็จ
  for (let i = 0; i < 3; i++) d = await dv.run("t", { a: "pick", i: 1 }, NOW);   // search ×3 → ชั้น 4 (พัก)
  assert(d.fl === 4 && d.opts[0].k === "rest" && d.loot.length > 0);
  d = await dv.run("t", { a: "pick", i: 0 }, NOW); assert(d.fl === 5 && d.firstReward, "first reward at 5");
  const invBefore = JSON.stringify((await db.ref("inventory/t").get()).val());
  const c = await dv.run("t", { a: "cashout" }, NOW); assert(!c.on && c.cashed.length > 0 && c.best === 5);
  for (const [id, q] of c.cashed) assert((await db.ref(`inventory/t/${id}`).get()).val().qty >= q);
  await rej(dv.run("t", { a: "start" }, NOW + 1000), "พักก่อน");
  // พลาด → หมดสติ เสียของ
  rig([0.99]); await db.ref("inventory/t/scrap").set({ id: "scrap", qty: 10 }); await db.ref("users/t/hp").set(50);
  d = await dv.run("t", { a: "start" }, NOW + 600000);
  let r; for (let g = 0; g < 10; g++) { r = await dv.run("t", { a: "pick", i: 2 }, NOW + 600000); if (!r.on) break; }
  assert(r.dead && r.hp === -20 && r.lostLoot.length === 0, JSON.stringify(r)); assert.strictEqual((await db.ref("users/t/hp").get()).val(), 30);
  assert.strictEqual((await db.ref("dive/t").get()).val(), null);
  // เคลียร์ชั้น 12 + กระเป๋าเต็มตอน cashout
  rig([0.0]); await db.ref("inventory/t/scrap").set({ id: "scrap", qty: 10 });
  d = await dv.run("t", { a: "start" }, NOW + 1200000); let guard = 0, cleared;
  while (d.on && guard++ < 40) { d = await dv.run("t", { a: "pick", i: d.opts[0].k === "rest" ? 1 : 2 }, NOW + 1200000); if (d.cleared) cleared = d; }
  assert(cleared && cleared.cashed.some((x) => x[0] === "survivor_badge"), "cleared floor 12");
  // ซอมบี้ + เพดานต่อวัน
  await db.ref("inventory/l/rotten_meat").set({ id: "rotten_meat", qty: 50 });
  let zr = await dv.run("l", { a: "start" }, NOW); assert(zr.on && zr.entry[0] === "rotten_meat");
  await dv.run("l", { a: "cashout" }, NOW);
  // ===== NEMESIS =====
  Math.random = rnd; rig([0.0]);
  await db.ref("users/r/hp").set(70);
  assert((await nm.run("r", { a: "roll" }, NOW)).nem, "forced spawn");
  await rej(nm.run("r", { a: "choose", k: "trap" }, NOW + 1), "ของไม่พอ");
  await db.ref("inventory/r/scrap").set({ id: "scrap", qty: 10 });
  const w = await nm.run("r", { a: "choose", k: "trap" }, NOW + 8000); assert(w.win && w.loot.length && w.paid[0] === "scrap");
  assert.strictEqual((await db.ref("nem/r/cur").get()).val(), null);
  // แพ้ → เสีย HP, ศัตรูเลเวลขึ้นและกลับมา
  rig([0.0]); await nm.run("r", { a: "roll" }, NOW + 30 * 60000); rig([0.99]);
  const l = await nm.run("r", { a: "choose", k: "fight" }, NOW + 30 * 60000 + 8000); assert(!l.win && l.hp < 0 && l.again);
  assert((await db.ref("users/r/hp").get()).val() >= 1);
  rig([0.0]); const again = await nm.run("r", { a: "roll" }, NOW + 90 * 60000); assert(again.nem && again.again && again.nem.lv === 2, "nemesis returns stronger");
  rig([0.0]); const fl = await nm.run("r", { a: "choose", k: "flee" }, NOW + 90 * 60000 + 9000); assert(fl.win && fl.again);
  await db.ref("nem/r").remove(); Math.random = rnd; await db.ref("users/r/zone").set("safe");
  assert.strictEqual((await nm.run("r", { a: "roll" }, NOW + 5 * 3600000)).nem, null, "safe zone none"); await db.ref("users/r/zone").set("ruins");
  const zv = await nm.run("l", { a: "peek" }, NOW); assert(zv.nem === null);
  rig([0.0]); const zn = await nm.run("l", { a: "roll" }, NOW + 1e7); assert(zn.nem && !zn.nem.opts.some((o) => o.k === "trap"), "hunter has no trap");
  // ===== RADIO =====
  Math.random = rnd;
  let st = await rd.run("r", { a: "state" }, NOW); assert(!st.heard && st.zone && st.clues.length === 0);
  await db.ref("users/r/zone").set(st.zone === "ruins" ? "mall" : "ruins");
  await rej(rd.run("r", { a: "listen" }, NOW), "จับได้ที่");
  await db.ref("users/r/zone").set(st.zone);
  const ls = await rd.run("r", { a: "listen" }, NOW); assert(ls.heard && ls.clues.length === 1);
  await rej(rd.run("r", { a: "listen" }, NOW), "ไปแล้ว");
  const secret = (await db.ref(`radio/${Rd.weekIdx(NOW)}/secret`).get()).val(); assert(/^\d{4}$/.test(secret));
  assert(ls.got.includes(secret[ls.clues[0].i]), "clue contains right digit");
  await rej(rd.run("r", { a: "guess", code: "12a4" }, NOW), "4 หลัก");
  const wrong = secret === "0000" ? "1111" : "0000"; let gr = await rd.run("r", { a: "guess", code: wrong }, NOW); assert(gr.right === false && typeof gr.hint === "number" && gr.guessesLeft === 4);
  for (let i = 0; i < 4; i++) await rd.run("r", { a: "guess", code: wrong }, NOW);
  await rej(rd.run("r", { a: "guess", code: secret }, NOW), "ครบ");
  gr = await rd.run("r", { a: "guess", code: secret }, NOW + 86400000); assert(gr.right && gr.big && gr.rewarded.length && gr.order === 1);
  await rej(rd.run("r", { a: "guess", code: secret }, NOW + 86400000), "ไปแล้ว");
  // ผู้เล่นอื่นข้ามวัน ได้เบาะแสต่างกันตามวัน
  const idxs = new Set(); for (let d2 = 0; d2 < 4; d2++) idxs.add((await rd.run("t", { a: "state" }, NOW + d2 * 86400000)).idx); assert.strictEqual(idxs.size, 4, "rotates through 4 clues");
  // ===== CARAVAN =====
  const s = Cv.slotOf(NOW), open = Cv.openNow(NOW), zone = Cv.zoneOf(s);
  let t0 = s * Cv.SLOT_MS + 1000;   // ต้นรอบ (เปิดอยู่)
  await db.ref("users/r/zone").set("ruins"); await db.ref("users/r/hp").set(70);
  const zoneR = Cv.zoneOf(Cv.slotOf(t0)); const other = zoneR === "ruins" ? "mall" : "ruins";
  await db.ref("users/r/zone").set(other);
  let cs = await cv.run("r", { a: "state" }, t0); assert(cs.open && !cs.here && cs.hint);
  assert(!(await cv.run("r", { a: "state" }, s * Cv.SLOT_MS + Cv.OPEN_MS + 5000)).open, "closed in 2nd half");
  await db.ref("users/r/zone").set(zoneR);
  cs = await cv.run("r", { a: "state" }, t0); assert(cs.here && cs.goods.length === 5);
  const g = cs.goods[0]; await rej(cv.run("r", { a: "buy", key: g.key }, t0), "ไม่พอ");
  const need = {}; g.cost.forEach(([id, q]) => { need[id] = { id, qty: q }; }); await db.ref("inventory/r").set(need);
  const b = await cv.run("r", { a: "buy", key: g.key }, t0); assert(b.bought[0] === g.id);
  assert.strictEqual((await db.ref(`inventory/r/${g.id}`).get()).val().qty, g.q);
  for (const [id] of g.cost) assert(!(await db.ref(`inventory/r/${id}`).get()).val() || id === g.id, "cost taken " + id);
  await rej(cv.run("r", { a: "buy", key: g.key }, t0), "ไปแล้ว");
  // สต็อกหมดเมื่อแย่งกัน (ตั้งสต็อกรวมเหลือ 1 แล้วให้สองคนซื้อพร้อมกัน)
  const g2 = cs.goods[1]; await db.ref(`caravan/${s}/sold/${g2.key}`).set(g2.left - 1);
  for (const u of ["t", "l"]) { await db.ref(`users/${u}/zone`).set(zoneR); const nd = {}; g2.cost.forEach(([id, q]) => { nd[id] = { id, qty: q + 1 }; }); await db.ref(`inventory/${u}`).set(nd); }
  const rs = await Promise.allSettled(["t", "l"].map((u) => cv.run(u, { a: "buy", key: g2.key }, t0)));
  assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, "last unit sold once");
  const loser = rs[0].status === "rejected" ? "t" : "l"; const li = (await db.ref(`inventory/${loser}`).get()).val(); g2.cost.forEach(([id, q]) => assert.strictEqual(li[id].qty, q + 1, "loser untouched"));
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
