// 🗺️ เควสเดินทางไปถึงโซน (รายวัน zd{วัน}t + รายสัปดาห์ w7–w9): ชุดที่โค้ดสร้างต้องผ่าน rules ของ config/questDefs (เจ้าของเขียน) — เทียบ rules เก่า/ใหม่
//   • ตรวจเฉพาะรูปแบบ (ชื่อ/ev/need/z/dw/ของรางวัลในรายการอนุญาต) • โซนที่ rules ไม่รับ (safe/casino) ต้องถูกปฏิเสธ
// ใช้: NODE_PATH=/tmp/fbt/rut/node_modules node tests/emulator/questseed.js
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 6df49dc:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now();
  const stock = () => ({ scrap: { id: "scrap", qty: 5 }, chem: { id: "chem", qty: 5 }, canned_food: { id: "canned_food", qty: 5 }, medkit: { id: "medkit", qty: 5 } });   // กฎเดิมเช็กช่องเหล่านี้ทุกครั้ง (ไม่มี = error = ปฏิเสธทั้งหมด)
  const user = (fac, extra = {}) => ({ username: "tester", faction: fac, role: "player", banned: false, zone: "ruins", createdAt: now - 864000000, hp: 50, food: 50, foodTs: now - 1000, water: 50, waterTs: now - 1000, stamina: 50, staminaTs: now - 60000, ...extra });
  const base = (extra = {}, ux = {}, fac = "zombie") => ({ users: { U: user(fac, ux), T: user("human", { username: "target" }) }, stats: { U: { str: 1, hp: 1, st: 1, regen: 0, agi: 0, tough: 0 } }, inventory: { U: stock() }, ...extra });
  const evo = (o) => ({ dna: 0, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0, ...o });
  const bite = { bites: { U: { ts: now, food: 25, dna: 1 } } };
  const heal = (n) => () => ({ "users/U/hp": 50 + n, "bites/U": null });
  const atk = (extra, ts = SV) => () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "ruins", ts, ...extra }, "users/U/lastAttack": SV });
  const amb = (s, wd, roll = 4) => ({ ...base({ evo: { U: evo({ s, line: "shade", h: 0 }) } }, { lastTravel: now - 10000 }) });
  // [ชื่อ, สถานะเริ่ม, การเขียน, ผลเก่าที่คาด, ผลใหม่ที่คาด]
  const fs2 = require("fs"), sc = fs2.readFileSync("/home/user/zombocalypse/script.js", "utf8");
  const zoneSrc = sc.slice(sc.indexOf("function zoneQuestSeed()"), sc.indexOf("async function qpSeedZone()")), seedSrc = sc.slice(sc.indexOf("const QP_SEED = {"), sc.indexOf("const qpDayKey"));
  const ZONES = Object.fromEntries(["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab", "safe", "casino"].map((z) => [z, { name: "โซน-" + z }]));
  const daily = new Function("ZONES", zoneSrc + ";return zoneQuestSeed();")(ZONES), QP = new Function(seedSrc + ";return QP_SEED;")();
  const tq = Object.entries(daily).filter(([k]) => /^zd\d+t$/.test(k)); require("assert").strictEqual(tq.length, 7, "เควสเดินทางรายวัน 7 วัน"); require("assert").deepStrictEqual(tq.map(([, d]) => d.dw), [0, 1, 2, 3, 4, 5, 6]); require("assert")(tq.every(([, d]) => d.ev === "travel" && d.need === 1 && d.z && !d.f), "ทุกฝ่ายทำได้");
  require("assert").deepStrictEqual(["w7", "w8", "w9"].map((k) => QP.weekly[k].z), ["hospital", "base", "lab"]); require("assert").strictEqual(Object.keys(daily).length, 49);
  const owner = { role: "owner" }, wr = (path, v) => () => ({ [path]: v });
  const C = [   // [ชื่อ, ข้อมูลตั้งต้น, การเขียน, เก่าผ่าน?, ใหม่ผ่าน?]
    ["เจ้าของเติมเควสโซนรายวัน 49 ข้อ (รวม zd#t)", base({}, owner, "human"), () => Object.fromEntries(Object.entries(daily).map(([k, d]) => ["config/questDefs/daily/" + k, d])), true, true],
    ["เจ้าของเติมเควสรายสัปดาห์ w7–w9", base({}, owner, "human"), () => Object.fromEntries(["w7", "w8", "w9"].map((k) => ["config/questDefs/weekly/" + k, QP.weekly[k]])), true, true],
    ["เจ้าของเติมชุดเริ่มต้นทั้งก้อน (QP_SEED)", base({}, owner, "human"), wr("config/questDefs", QP), true, true],
    ["เควสไปถึง Safe Zone (rules ไม่รับโซน safe)", base({}, owner, "human"), wr("config/questDefs/weekly/wx", { ...QP.weekly.w7, z: "safe" }), false, false],
    ["เควสไปถึงคาสิโน (rules ไม่รับ)", base({}, owner, "human"), wr("config/questDefs/weekly/wy", { ...QP.weekly.w7, z: "casino" }), false, false],
    ["ผู้เล่นปกติเขียนเควสไม่ได้", base({}, {}, "human"), wr("config/questDefs/weekly/w7", QP.weekly.w7), false, false]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, seed, w] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(seed)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("QUEST SEED OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
