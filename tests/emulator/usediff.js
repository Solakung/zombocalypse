// เทียบ "ใช้ไอเทม" ฝั่งไคลเอนต์เดิม (useItem ใน script.js รันจริงในโหนดด้วย stub) กับฟังก์ชัน useAct — สถานะฐานข้อมูลหลังใช้ต้องเท่ากันทุกกรณี
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert"), fs = require("fs");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=usedA" });
const dbA = admin.database(); // useAct
const appB = admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=usedB" }, "b"), dbB = appB.database(); // client u
const { makeUse, CONSUMABLES } = require(F + "use");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const cut = (a, b, from = 0) => { const i = sc.indexOf(a, from); if (i < 0) throw new Error("no " + a); const j = sc.indexOf(b, i + a.length); if (j < 0) throw new Error("no end " + b); return [sc.slice(i, j), j]; };
const parts = [];
parts.push(cut("const STAMINA_COST = 10", "\n", 0)[0], cut("const FOOD_DECAY_MS", "\n")[0]);
{ const a = sc.indexOf("const STAT_DEF = {"), k = sc.indexOf("const FX_CURES = {"); parts.push(sc.slice(a, sc.indexOf("\n", k))); }

{ const [x, j] = cut("const hasFx = ", "\nconst ITEMS = {"); parts.push(x); const e = sc.indexOf("\n};", j); parts.push(sc.slice(j, e + 3)); }
parts.push(cut("const defOf = ", "\n")[0]);
parts.push(cut("const baseStat = ", "const dodgeChance")[0]);
parts.push(cut("const hungerMs = ", "function mk(")[0]);
parts.push(cut("const REGEN_FAST_MS", "\nfunction curStamina", 0)[0]); { const i = sc.indexOf("function curStamina"); parts.push(sc.slice(i, sc.indexOf("\n}\n", i) + 3)); }
parts.push(cut("function evoBonusAt(", "\nfunction searchCost")[0]);
parts.push("function evoT(k) { return state.profile?.faction === \"zombie\" && state.evo ? state.evo[k] || 0 : 0; }");
// ฟังก์ชันเดิมที่แช่แข็งไว้ + ส่วนที่เปลี่ยนโดยตั้งใจเพียงจุดเดียว: สายตะกละขั้น 2+ กินเนื้อเน่าได้อาหาร 75% (use.js เปลี่ยนตรงกัน)
{ const legacy = fs.readFileSync("/home/user/zombocalypse/tests/emulator/legacy_useItem.txt", "utf8"), from = "const foodGain = zombieNoFood ? 0 : (def.food || 0);"; assert(legacy.includes(from), "legacy foodGain line");
  parts.push(legacy.replace(from, 'const foodGain = zombieNoFood ? 0 : (p.faction === "zombie" && def.zombieOnly && it.id !== "custom_food" && evoT("h") >= 2 ? Math.floor((def.food || 0) * 0.75) : (def.food || 0));')); }
const prelude = `
let NOW = 0, CAP = null, CONFIRM = false; const TSM = "__TS__";
const state = { uid: "U", profile: null, stats: null, buff: null, effects: {}, evo: null, inv: {}, offset: 0 };
const serverNow = () => NOW, serverTimestamp = () => TSM, ref = () => ({}), db = {}, update = async (_r, u) => { CAP = u; };
const toast = () => {}, confirm = () => CONFIRM, errMsg = () => "", questBump = () => {}, mealOnUse = () => {}, achBump = () => {};
const LS = { get: () => 0, set: () => {} }, lsKey = (n) => n;
`;
const mk = new Function(prelude + parts.join("\n") + "\nreturn { state, useItem, setNow: (n) => { NOW = n; }, setConfirm: (c) => { CONFIRM = c; }, cap: () => CAP, reset: () => { CAP = null; } };");
const C = mk();
let seed = Number(process.env.SEED || 12345); const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = (a) => a[Math.floor(rnd() * a.length)];
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
(async () => {
  // ตารางผลไอเทมมาตรฐานต้องตรง ITEMS ใน script.js
  const cl = new Function(prelude + parts.slice(0, 5).join("\n") + "\nreturn ITEMS;")();
  const cons = Object.entries(cl).filter(([, d]) => d.type === "consumable");
  assert.deepStrictEqual(cons.map(([k]) => k).sort(), Object.keys(CONSUMABLES).sort(), "consumable ids");
  for (const [k, d] of cons) { const { type, icon, ...rest } = d; assert.deepStrictEqual(CONSUMABLES[k], rest, "consumable " + k); }
  const use = makeUse(dbA, admin), CASES = Number(process.env.CASES || 700); let applied = 0, rejected = 0, confirmed = 0, byId = {};
  // ไคลเอนต์เดิมใช้ผล s_*/b_*/e_*/c_* ได้เฉพาะ custom_food → เทียบเฉพาะไอเทมมาตรฐานที่ไม่มีฟิลด์เหล่านั้น (ชุดที่ 2 ที่มีผลพิเศษทดสอบใน use.js)
  const std = Object.keys(CONSUMABLES).filter((k) => !Object.keys(CONSUMABLES[k]).some((f) => /^(s_|b_|e_|c_)|^(bmin|emin)$/.test(f)));
  for (let n = 0; n < CASES; n++) {
    const NOW = Date.now(), fac = pick(["human", "zombie"]);
    const slotKey = pick(["s1", "s2", "bandage"]);
    // กระเป๋า: ไอเทมมาตรฐานหรือ custom_food ที่สุ่มผล
    let item;
    if (rnd() < 0.6) { const id = pick(std); item = { id, qty: ri(1, 3) }; }
    else {
      item = { id: "custom_food", qty: ri(1, 2), name: "ของเสก", type: pick(["consumable", "consumable", "consumable", "material"]) };
      if (rnd() < 0.7) item.food = ri(-30, 60); if (rnd() < 0.5) item.water = ri(-30, 60); if (rnd() < 0.5) item.heal = ri(-40, 90); if (rnd() < 0.4) item.stamina = ri(-40, 70);
      const sk = ["str", "hp", "st", "regen", "agi", "tough"];
      if (rnd() < 0.4) sk.forEach((k) => { if (rnd() < 0.4) item["s_" + k] = ri(-3, 3); });
      if (rnd() < 0.4) { item.bmin = ri(1, 30); sk.forEach((k) => { if (rnd() < 0.4) item["b_" + k] = ri(-4, 5); }); }
      if (rnd() < 0.3) { item.emin = ri(1, 30); ["bleed", "poison", "hot", "stun", "dice"].forEach((t) => { if (rnd() < 0.35) item["e_" + t] = t === "dice" ? ri(-2, 2) || 1 : ri(1, 3); }); }
      ["bleed", "poison", "stun"].forEach((t) => { if (rnd() < 0.2) item["c_" + t] = 1; });
      Object.keys(item).forEach((k) => { if (item[k] === 0) delete item[k]; });
    }
    const stats = rnd() < 0.85 ? { str: ri(0, 4), hp: ri(0, 4), st: ri(0, 4), regen: ri(0, 3), agi: ri(0, 4), tough: ri(0, 3) } : null;
    if (stats && rnd() < 0.15) stats.hp = 99;
    const buff = rnd() < 0.3 ? { bstart: NOW - ri(0, 20) * 60000, mins: ri(1, 30), str: ri(-2, 3), hp: ri(-2, 3), st: ri(-2, 3), regen: ri(-1, 2), agi: ri(-2, 3), tough: ri(-2, 3) } : null;
    const evo = fac === "zombie" && rnd() < 0.6 ? { h: ri(0, 4), g: ri(0, 4), s: ri(0, 4) } : null;
    const effects = {}; ["bleed", "poison", "hot", "stun", "dice"].forEach((t) => { if (rnd() < 0.3) effects[t] = { bstart: NOW - ri(0, 10) * 60000, mins: ri(1, 12), v: t === "poison" ? ri(1, 3) : ri(1, 3), tick: NOW }; });
    const fm = FOOD_MS(fac);
    const food = ri(0, 100), water = ri(0, 100), foodTs = NOW - ri(0, 40) * fm - ri(0, fm - 1), waterTs = NOW - ri(0, 40) * 100000 - ri(0, 99999);
    const maxish = 100 + 10 * ((stats?.hp || 0));
    const p = { username: "u", faction: fac, role: "player", banned: false, zone: "safe", hp: ri(1, maxish), food, foodTs, water, waterTs, stamina: ri(0, 100), staminaTs: NOW - ri(0, 3000000), ...(rnd() < 0.25 ? { infected: true, infectTs: NOW - 5000 } : {}) };
    // ฝั่งไคลเอนต์
    C.setNow(NOW); C.setConfirm(false); C.reset();
    Object.assign(C.state, { profile: { ...p }, stats: stats && { ...stats }, buff: buff && { ...buff }, effects: JSON.parse(JSON.stringify(effects)), evo: evo && { ...evo }, inv: { [slotKey]: { ...item } } });
    await C.useItem(slotKey);
    const cu = C.cap();
    // ฐานข้อมูล A (useAct) และ B (ผลของไคลเอนต์)
    const seedDb = { users: { U: { ...p } }, inventory: { U: { [slotKey]: { ...item } } }, ...(stats ? { stats: { U: stats } } : {}), ...(buff ? { buffs: { U: buff } } : {}), ...(Object.keys(effects).length ? { effects: { U: effects } } : {}), ...(evo ? { evo: { U: evo } } : {}) };
    await dbA.ref().set(JSON.parse(JSON.stringify(seedDb))); await dbB.ref().set(JSON.parse(JSON.stringify(seedDb)));
    let ar = null, err = null; const t0 = Date.now();
    try { ar = await use.run("U", { slot: slotKey, replaceBuff: false }, NOW); } catch (e) { err = e; }
    const snap = async (d) => { const o = {}; for (const k of ["users", "stats", "buffs", "effects", "inventory"]) o[k] = (await d.ref(k + "/U").get()).val(); return o; };
    if (!cu) {   // ไคลเอนต์ไม่เขียนอะไร → ฟังก์ชันต้องปฏิเสธ (หรือขอยืนยันบัฟ) และฐานข้อมูลไม่เปลี่ยน
      if (ar && ar.confirm === "buff") confirmed++; else assert(err, "client noop but server applied: " + JSON.stringify({ item, p, ar }));
      rejected++; assert.deepStrictEqual(await snap(dbA), await snap(dbB), "no-op state differs"); continue;
    }
    // client ขอยืนยันบัฟแล้วผู้เล่นกดตกลง: เรียกใหม่พร้อม replaceBuff
    if (ar && ar.confirm === "buff") { confirmed++; C.setConfirm(true); C.reset(); Object.assign(C.state, { profile: { ...p }, stats: stats && { ...stats }, buff: buff && { ...buff }, effects: JSON.parse(JSON.stringify(effects)), evo: evo && { ...evo }, inv: { [slotKey]: { ...item } } }); await C.useItem(slotKey); const cu2 = C.cap(); assert(cu2, "confirm path"); ar = await use.run("U", { slot: slotKey, replaceBuff: true }, NOW); Object.keys(cu2).forEach((k) => { cu[k] = cu2[k]; }); }
    if (err) throw new Error("server rejected but client applied: " + err.message + " " + JSON.stringify({ item, p, cu }));
    await dbB.ref().update(JSON.parse(JSON.stringify(cu, (k, v) => (v === "__TS__" ? NOW : v === undefined ? null : v))));
    const a = await snap(dbA), b = await snap(dbB);
    delete b.users.eatSlot;   // ช่องที่ไคลเอนต์เดิมเขียนให้ rules ตรวจ — useAct ไม่ต้องใช้แล้ว
    // timestamp ที่เซิร์ฟเวอร์ตั้ง (ตอนนี้จริง ≥ NOW) เทียบกับ NOW ฝั่งไคลเอนต์ — ยอมต่างได้ไม่เกิน 30 วินาที (และต้องไม่ชนกับเวลาที่คำนวณย้อนหลัง ≤ NOW−2500)
    const norm = (o) => JSON.parse(JSON.stringify(o), (k, v) => (typeof v === "number" && v >= NOW && v <= Date.now() + 1000 && /Ts$|bstart|tick/.test(k) ? "TS" : v));
    try { assert.deepStrictEqual(norm(a), norm(b)); } catch (e) { console.error("DIFF case", n, JSON.stringify({ item, p, stats, buff, evo, effects })); console.error("A", JSON.stringify(a)); console.error("B", JSON.stringify(b)); throw e; }
    applied++; byId[item.id] = (byId[item.id] || 0) + 1;
  }
  console.log("applied", applied, "noop/rejected", rejected, "buff-confirm", confirmed, "ids", Object.keys(byId).length);
  assert(applied > CASES * 0.4, "too few applied cases");
  console.log("USE DIFF OK"); process.exit(0);
  function FOOD_MS(f) { return f === "zombie" ? 100000 : 150000; }
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
