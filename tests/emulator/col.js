process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=col" });
const db = admin.database(); const C = require(F + "col");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const has = (id) => new RegExp("^  " + id + ": \\{", "m").test(sc);
let bad = 0;
C.SETS.filter((s) => s.k === "i").forEach((s) => s.ids.forEach((id) => { if (!has(id)) { bad++; console.log("set id not in ITEMS", s.id, id); } }));
const rewIds = new Set(); C.SETS.forEach((s) => s.r.forEach(([id]) => rewIds.add(id))); C.REWARDS.forEach((r) => r.r.concat(r.rz).forEach(([id]) => rewIds.add(id)));
for (const id of rewIds) if (!/^(seed|deco|theme)_/.test(id) && (!has(id) || !wl.test(id))) { bad++; console.log("reward id bad", id); }
assert(!bad); console.log("ids ok, sets:", C.SETS.length, "miles:", C.MILES.length);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
(async () => {
  await db.ref().set({ users: { h: { username: "h", faction: "human", hp: 80, zone: "safe" }, z: { username: "z", faction: "zombie", hp: 80, zone: "safe" } } });
  const col = C.makeCol(db);
  let r = await col.run("h", { a: "state" }); assert(r.pct === 0 && r.sets.every((s) => !["fangs", "hides", "noses", "rot"].includes(s.id)) && r.sets.some((s) => s.id === "armor"));
  const zr = await col.run("z", { a: "state" }); assert(zr.sets.every((s) => !["armor", "gadget", "garden"].includes(s.id)) && zr.sets.some((s) => s.id === "fangs"));
  await rej(col.run("h", { a: "claim", k: "medic" }), "ไม่ครบ");
  const medic = C.SETS.find((s) => s.id === "medic").ids;
  r = await col.run("h", { a: "sync", i: medic.slice(0, 3).concat(["BAD ID!", 5, "x"]), z: ["ruins", "mars"] }); const m = r.sets.find((s) => s.id === "medic"); assert(m.have === 3 && !m.done, JSON.stringify(m)); assert.strictEqual(r.sets.find((s) => s.id === "zones").have, 1);
  assert.strictEqual((await db.ref("col/h/i/BAD ID!").get()).val(), null);
  r = await col.run("h", { a: "sync", i: medic }); assert(r.sets.find((s) => s.id === "medic").done);
  const c = await col.run("h", { a: "claim", k: "medic" }); assert(c.rewarded.length && c.sets.find((s) => s.id === "medic").got); await rej(col.run("h", { a: "claim", k: "medic" }), "รับไปแล้ว");
  assert.strictEqual((await db.ref("inventory/h/medkit").get()).val().qty, 2);
  // garden set จากข้อมูลฝั่งเซิร์ฟเวอร์ + ความสมบูรณ์ %
  await db.ref("garden/h/h").set({ herb: 2, mossb: 1, tomato: 1, wheat: 1, pumpkin: 1, aloe: 1, shroom: 1, glow: 1 });
  r = await col.run("h", { a: "state" }); assert(r.sets.find((s) => s.id === "garden").done);
  const allI = [...new Set(C.SETS.filter((s) => s.k === "i").flatMap((s) => s.ids))];
  await db.ref("ach/h/c").set(Object.fromEntries(C.MILES.map(([k, n]) => [k, n])));
  r = await col.run("h", { a: "sync", i: allI, z: ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"] }); assert.strictEqual(r.pct, 100, "pct " + r.pct); assert(r.rewards.every((x) => x.ok));
  for (const p of [25, 50, 75, 100]) { const x = await col.run("h", { a: "claim", k: "m" + p }); assert(x.rewarded.length); }
  for (const s of r.sets.filter((q) => q.done && !q.got)) await col.run("h", { a: "claim", k: s.id });
  await rej(col.run("h", { a: "claim", k: "m100" }), "รับไปแล้ว"); await rej(col.run("h", { a: "claim", k: "fangs" }), "ไม่มีชุดนี้");
  const x = await col.run("z", { a: "state" }); assert(x.pct < 100);
  // กดซ้อน
  await db.ref("col/z/cl").remove(); await db.ref("col/z/i").set(Object.fromEntries(C.SETS.find((s) => s.id === "noses").ids.map((i) => [i, 1])));
  const rs = await Promise.allSettled([1, 2, 3].map(() => col.run("z", { a: "claim", k: "noses" }))); assert.strictEqual(rs.filter((q) => q.status === "fulfilled").length, 1);
  // streak ผ่อนผัน 1 วัน
  const D = require(F + "daily"); const dly = D.makeDaily(db); const T0 = Date.UTC(2026, 8, 7, 3);
  await dly.run("h", { s: "crate", a: "open" }, T0); await dly.run("h", { s: "crate", a: "open" }, T0 + 86400000);
  let o = await dly.run("h", { s: "crate", a: "open" }, T0 + 3 * 86400000); assert.strictEqual(o.st, 3, "skipping 1 day keeps streak");
  o = await dly.run("h", { s: "crate", a: "open" }, T0 + 6 * 86400000); assert.strictEqual(o.st, 1, "skipping 2 days resets");
  console.log("COL ALL OK", r.pct); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
