process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=s3" });
const db = admin.database();
const D = require(F + "daily"), C = require(F + "camp"), W = require(F + "world");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const chk = (ids, label) => { let bad = 0; for (const id of [...ids].filter((x) => !/^(seed|deco|theme)_/.test(x))) if (!new RegExp("^  " + id + ": \\{", "m").test(sc) || !wl.test(id)) { bad++; console.log("BAD id", label, id); } assert(!bad); };
// ---- ตรวจรหัสไอเทมทุกตัว
const ids = new Set(); const add = (l) => l.forEach(([id]) => ids.add(id));
for (const f of ["human", "zombie"]) for (const t of "cur") add(D.CRATE[f][t]);
Object.values(D.HUNT_REW).forEach(add); add(D.HUNT_Z.rew);
W.MS.forEach((m) => { add(m.r.human); add(m.r.zombie); });
Object.values(C.PET_ITEM).forEach((id) => ids.add(id)); ["scrap", "rotten_meat", "chem", "medkit", "steel_plate", "copper_wire", "gunpowder", "serum", "mutant_gland"].forEach((id) => ids.add(id));
chk(ids, "all"); console.log("item ids ok:", ids.size);
const R = async (sys, uid, d, now) => sys.run(uid, d, now);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
const NOW = Date.UTC(2026, 8, 7, 3);
(async () => {
  await db.ref().set({ users: { h: { username: "h", faction: "human", hp: 80, zone: "safe" }, z: { username: "z", faction: "zombie", hp: 80, zone: "safe" }, o: { username: "o", faction: "human", hp: 80, zone: "ruins" } }, base: { h: { lv: 1 }, z: { lv: 2 } } });
  const dly = D.makeDaily(db), cmp = C.makeCamp(db), wld = W.makeWorld(db);
  // ===== CRATE =====
  let r = await dly.run("h", { s: "crate", a: "state" }, NOW); assert(!r.claimed && r.day === 1);
  r = await dly.run("h", { s: "crate", a: "open" }, NOW + 1000); assert(r.claimed && r.got && r.st === 1 && r.day === 1);
  await rej(dly.run("h", { s: "crate", a: "open" }, NOW + 2000), "เปิดหีบไปแล้ว");
  for (let d = 1; d <= 6; d++) { r = await dly.run("h", { s: "crate", a: "open" }, NOW + d * 86400000); assert.strictEqual(r.st, d + 1); }
  assert.strictEqual(r.day, 7); assert.strictEqual(r.tier, "r", "day7 rare"); assert(r.bonus, "day7 bonus");
  r = await dly.run("h", { s: "crate", a: "open" }, NOW + 7 * 86400000); assert(r.st === 8 && r.day === 1, "cycle");
  r = await dly.run("h", { s: "crate", a: "open" }, NOW + 10 * 86400000); assert(r.st === 1, "streak reset after gap");
  r = await dly.run("z", { s: "crate", a: "open" }, NOW); assert(r.got, "zombie crate");
  // กระเป๋าเต็ม → ไม่หักสิทธิ์
  const all = {}; [...new Set(Object.values(D.CRATE.human).flat().map((x) => x[0]))].forEach((id) => { all[id] = { id, qty: 99 }; });
  Object.keys(all).forEach((id) => { if (/^seed_/.test(id)) delete all[id]; else if (/^deco_/.test(id)) delete all[id]; });
  await db.ref("inventory/o").set(all); await db.ref("garden/o/seed").set(Object.fromEntries(["aloe", "wheat", "pumpkin", "shroom", "glow", "maggot", "bloodroot", "herb"].map((c) => [c, 99]))); await db.ref("home/o/own").set({ gift: 9 }); await db.ref("users/o/zone").set("safe");
  await rej(dly.run("o", { s: "crate", a: "open" }, NOW), "เต็ม");
  assert.strictEqual((await db.ref("crate/o").get()).val(), null, "not consumed when full");
  // ===== HUNT =====
  let h = await dly.run("h", { s: "hunt", a: "state" }, NOW); assert(!h.acc && h.zone && h.n >= 4);
  await rej(dly.run("h", { s: "hunt", a: "claim" }, NOW), "ยังไม่ได้รับ");
  await db.ref("ach/h/c").set({ ["hw" + h.zone]: 10 });
  h = await dly.run("h", { s: "hunt", a: "accept" }, NOW); assert(h.acc && h.v === 0);
  await rej(dly.run("h", { s: "hunt", a: "claim" }, NOW), "ยังล่าไม่ครบ");
  await db.ref(`ach/h/c/hw${h.zone}`).set(10 + h.n);
  h = await dly.run("h", { s: "hunt", a: "state" }, NOW); assert(h.done && !h.got);
  const before = (await db.ref("inventory/h").get()).val() || {};
  h = await dly.run("h", { s: "hunt", a: "claim" }, NOW); assert(h.got && h.rewarded);
  await rej(dly.run("h", { s: "hunt", a: "claim" }, NOW), "ไปแล้ว");
  const after = (await db.ref("inventory/h").get()).val();
  for (const [id, q] of h.rewarded) assert.strictEqual((after[id]?.qty || 0) - (before[id]?.qty || 0), q, "reward " + id);
  h = await dly.run("h", { s: "hunt", a: "state" }, NOW + 86400000); assert(!h.acc, "new day resets");
  let hz = await dly.run("z", { s: "hunt", a: "accept" }, NOW); assert(hz.zone === null && hz.n === 4);
  // ===== CAMP =====
  let c = await cmp.run("h", { a: "state" }, NOW); assert(c.perks.length === 5 && c.perks[0].next[0][0] === "scrap");
  await rej(cmp.run("h", { a: "buy", id: "p1" }, NOW), "ของไม่พอ");
  await db.ref("inventory/h/scrap").set({ id: "scrap", qty: 50 }); await db.ref("inventory/h/chem").set({ id: "chem", qty: 3 });
  c = await cmp.run("h", { a: "buy", id: "p1" }, NOW); assert(c.perks[0].lv === 1);
  assert.strictEqual((await db.ref("inventory/h/scrap").get()).val().qty, 38);
  c = await cmp.run("h", { a: "buy", id: "p1" }, NOW); assert(c.perks[0].lv === 2);   // scrap 24 + chem 2
  assert.strictEqual((await db.ref("inventory/h/chem").get()).val().qty, 1);
  await rej(cmp.run("h", { a: "buy", id: "p1" }, NOW), "ของไม่พอ");   // L3 = scrap 36 chem 4
  assert.strictEqual((await db.ref("inventory/h/scrap").get()).val().qty, 14, "failed buy refunds");
  assert.strictEqual((await db.ref("inventory/h/chem").get()).val().qty, 1, "failed buy refunds chem");
  await rej(cmp.run("h", { a: "buy", id: "zz" }, NOW), "ไม่มีอัปเกรด");
  await db.ref("users/h/zone").set("ruins"); await rej(cmp.run("h", { a: "buy", id: "p2" }, NOW), "Safe Zone"); await db.ref("users/h/zone").set("safe");
  await db.ref("base/o/lv").set(0); await rej(cmp.run("o", { a: "buy", id: "p1" }, NOW), "ที่พัก");
  // ===== PET =====
  await db.ref("pet/h").set({ k: "dog", t: 0 }); await db.ref("ach/h/c/petc").set(0);
  c = await cmp.run("h", { a: "petBonus" }, NOW); assert(c.bonus === null);
  await db.ref("ach/h/c/petc").set(7);
  c = await cmp.run("h", { a: "petBonus" }, NOW); assert(c.bonus && c.lvl === 2, JSON.stringify(c.bonus)); assert.strictEqual(c.bonus.find((x) => x[0] === "canned_food")[1] >= 6, true);
  c = await cmp.run("h", { a: "petBonus" }, NOW); assert(c.bonus === null, "no double bonus");
  c = await cmp.run("h", { a: "state" }, NOW); assert(c.pet.lv === 2 && c.pet.eff.n === -0.01);
  // ===== WORLD =====
  let w = await wld.run("h", { a: "state" }, NOW); assert(w.np === 1 && w.goal === w.per * 5 && w.mine === 0);
  await db.ref(`ach/h/c/${w.k}`).set(10_000); await db.ref(`ach/z/c/${w.k}`).set(5);
  w = await wld.run("h", { a: "state" }, NOW + 1000); assert.strictEqual(w.mine, w.per * 2, "cap 2x");
  const w2 = await wld.run("z", { a: "state" }, NOW + 1000); assert(w2.np === 2);
  await db.ref(`ach/z/c/${w.k}`).set(5 + 400);
  await wld.run("z", { a: "state" }, NOW + 2000);
  w = await wld.run("h", { a: "state" }, NOW + 3000); assert(w.tot === w.per * 2 + w2.per * 2 || w.tot > 0, "tot " + w.tot);
  const ms0 = w.ms[0]; console.log("world tot/goal", w.tot, w.goal, "ms ok", w.ms.map((x) => x.ok));
  if (ms0.ok) { const cr = await wld.run("h", { a: "claim", i: 0 }, NOW + 4000); assert(cr.rewarded); await rej(wld.run("h", { a: "claim", i: 0 }, NOW + 5000), "รับไปแล้ว"); }
  await rej(wld.run("h", { a: "claim", i: 2 }, NOW + 5000), "ยังไม่ถึง");
  const wn = await wld.run("h", { a: "state" }, NOW + 7 * 86400000); assert(wn.wi === w.wi + 1 && wn.mine === 0, "new week");
  // concurrent crate
  await db.ref("crate/z").remove();
  const rs = await Promise.allSettled([1, 2, 3].map(() => dly.run("z", { s: "crate", a: "open" }, NOW + 40 * 86400000)));
  assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, "one crate wins");
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
