// 🟠 rules สถานะส้ม: เทียบ rules เก่า (main ก่อนกิ่งนี้ 37d3eb7) กับใหม่ — ส้มเข้า/ฟื้นตัวใน Safe Zone ไม่ได้ (ฟื้นที่เมืองร้างแทน) ส่วนคนปกติเหมือนเดิมทุกอย่าง
// ใช้: node tests/emulator/crimrules.js (OLD_RULES=ไฟล์ เพื่อกำหนด rules เก่าเอง)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 37d3eb7:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const setRules = async (k) => { const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules"); };
  const now = Date.now(), H = 3600000;
  const user = (extra = {}) => ({ username: "tester", faction: "human", role: "player", banned: false, zone: "ruins", createdAt: now - 864000000, hp: 80, food: 50, foodTs: now - 1000, water: 50, waterTs: now - 1000, stamina: 50, staminaTs: now - 1000, ...extra });
  const seed = (o = {}) => ({ users: { U: user(o.u || {}) }, ...(o.inv ? { inventory: { U: { canned_food: { id: "canned_food", qty: 5 }, scrap: { id: "scrap", qty: 5 }, chem: { id: "chem", qty: 5 }, medkit: { id: "medkit", qty: 5 } } } } : {}), ...(o.crim ? { crim: { U: o.crim } } : {}), ...(o.jail ? { jail: { U: o.jail } } : {}), ...(o.t ? { users: { U: user(o.u || {}), T: user({ username: "target", ...o.t }) } } : {}) });
  const ORANGE = { until: now + H, n: 1, ts: now }, EXPIRED = { until: now - 1000, n: 1, ts: now - 2 * H };
  const travel = (z) => () => ({ "users/U/zone": z, "users/U/lastTravel": SV, "users/U/stamina": 40, "users/U/staminaTs": SV });
  const respawn = (z) => () => ({ "users/U/hp": 50, "users/U/zone": z, "users/U/lastDeath": SV });
  const dead = { hp: 0, zone: "forest" };
  const full = (z) => () => ({ "users/U/hp": 50, "users/U/zone": z, "users/U/lastDeath": SV, "users/U/infected": null, "users/U/infectTs": null });
  const JAIL = { until: now + H, t: 1, tm: 30, w: 0, ts: now };
  const atk = () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "jail", ts: SV }, "users/U/lastAttack": SV });
  const C = [   // [ชื่อ, ข้อมูลตั้งต้น, การเขียน, เก่าผ่าน?, ใหม่ผ่าน?]
    ["ปกติ เดินทางเข้า Safe Zone", seed(), travel("safe"), true, true],
    ["ปกติ เดินทางไปป่า", seed(), travel("forest"), true, true],
    ["ส้ม เดินทางเข้า Safe Zone", seed({ crim: ORANGE }), travel("safe"), true, false],
    ["ส้ม เดินทางไปป่า", seed({ crim: ORANGE }), travel("forest"), true, true],
    ["ส้ม เดินทางไปเมืองร้าง→ห้างได้", seed({ crim: ORANGE }), travel("mall"), true, true],
    ["ส้มหมดเวลาแล้ว เข้า Safe Zone", seed({ crim: EXPIRED }), travel("safe"), true, true],
    ["ปกติ ล้มแล้วฟื้นที่ Safe Zone", seed({ u: dead }), respawn("safe"), true, true],
    ["ส้ม ล้มแล้วฟื้นที่ Safe Zone", seed({ u: dead, crim: ORANGE }), respawn("safe"), true, false],
    ["ส้ม ล้มแล้วฟื้นที่เมืองร้าง", seed({ u: dead, crim: ORANGE }), respawn("ruins"), false, true],
    ["ส้มหมดเวลา ล้มแล้วฟื้นที่เมืองร้าง (ไม่ใช่ส้มแล้ว)", seed({ u: dead, crim: EXPIRED }), respawn("ruins"), false, false],
    ["ปกติ ล้มแล้วฟื้นที่เมืองร้าง (โกงจุดเกิด)", seed({ u: dead }), respawn("ruins"), false, false],
    ["ส้ม ฟื้นที่ป่า (ไม่ใช่เมืองร้าง)", seed({ u: dead, crim: ORANGE }), respawn("forest"), false, false],
    // ฟื้นตัวจริงของเกม: ล้างเชื้อ (infected/infectTs) ในคำสั่งเดียวกัน (การหักของตอนตายไม่ขึ้นกับโซน)
    ["ปกติ ฟื้นตัวพร้อมล้างเชื้อ ที่ Safe Zone", seed({ u: { ...dead, infected: now - H, infectTs: now - H } }), full("safe"), true, true],
    ["ส้ม ฟื้นตัวพร้อมล้างเชื้อ ที่เมืองร้าง", seed({ u: { ...dead, infected: now - H, infectTs: now - H }, crim: ORANGE }), full("ruins"), false, true],
    // ---- คุก (โซน jail): เข้าได้เมื่อมีบันทึกคุก ออกเองไม่ได้ ต่อสู้ไม่ได้
    ["ถูกจับ เดินเข้าโซนคุก (ไม่เสียค่าเดินทาง)", seed({ jail: JAIL }), () => ({ "users/U/zone": "jail" }), false, true],
    ["ไม่ได้ติดคุก เขียนโซนเป็นคุกเอง", seed(), () => ({ "users/U/zone": "jail" }), false, false],
    ["คุกหมดเวลาแล้ว เขียนโซนเป็นคุก", seed({ jail: { ...JAIL, until: now - 1000 } }), () => ({ "users/U/zone": "jail" }), false, false],
    ["ติดคุกอยู่ เดินทางออกไปป่า", seed({ u: { zone: "jail" }, jail: JAIL }), travel("forest"), true, false],
    ["ติดคุกอยู่ เดินทางออกไป Safe Zone", seed({ u: { zone: "jail" }, jail: JAIL }), travel("safe"), true, false],
    ["ติดคุกอยู่ แต่เขียนโซนเป็นคุกต่อ (ค่าเดิม)", seed({ u: { zone: "jail" }, jail: JAIL }), () => ({ "users/U/zone": "jail" }), false, true],
    ["ล้มแล้วฟื้นตัวเข้าคุก", seed({ u: { hp: 0, zone: "forest" }, jail: JAIL }), respawn("jail"), false, true],
    ["ไม่ได้ติดคุก ฟื้นตัวเข้าคุก (โกง)", seed({ u: { hp: 0, zone: "forest" } }), respawn("jail"), false, false],
    ["ติดคุกอยู่ ล้มแล้วฟื้นที่ Safe Zone (หนี)", seed({ u: { hp: 0, zone: "jail" }, jail: JAIL }), respawn("safe"), true, false],
    ["ติดคุกอยู่ โจมตีผู้ต้องขังคนอื่น", seed({ u: { zone: "jail" }, t: { zone: "jail" }, jail: JAIL }), atk, true, false],
    ["โจมตีในป่าตามปกติ", seed({ u: { zone: "forest" }, t: { zone: "forest" } }), () => ({ "attacks/T/U": { from: "U", fromName: "tester", roll: 4, zone: "forest", ts: SV }, "users/U/lastAttack": SV }), true, true],
    ["ผู้เล่นเขียน jail ของตัวเอง (ลบโทษ)", seed({ u: { zone: "jail" }, jail: JAIL }), () => ({ "jail/U": null }), false, false],
    ["ผู้เล่นเขียนยกเลิกคุกด้วยการลด until", seed({ u: { zone: "jail" }, jail: JAIL }), () => ({ "jail/U/until": 1 }), false, false],
    ["ผู้เล่นเขียน crim ของตัวเอง (ล้างส้ม)", seed({ crim: ORANGE }), () => ({ "crim/U": null }), false, false],
    ["ผู้เล่นตั้ง crim ให้ตัวเอง", seed(), () => ({ "crim/U": { until: now + H, n: 1, ts: now } }), false, false]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, sd, w] of C) {
      await adb.ref().set(JSON.parse(JSON.stringify(sd)));
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  // อ่าน crim ได้ทุกคนที่ล็อกอิน (แสดงชื่อส้ม)
  await setRules("nw"); await adb.ref().set({ crim: { X: ORANGE }, bty: { X: { pts: 10, ts: now, tn: "x", bn: "y", s: { y: 10 } } } });
  let readOk = true; try { await env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database().ref("crim").get(); } catch { readOk = false; } assert(readOk, "read crim");
  { let rb = true, wb = true; const dbU = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database(); try { await dbU.ref("bty").get(); } catch { rb = false; } try { await dbU.ref("bty/U").set({ pts: 999 }); } catch { wb = false; } assert(rb, "read bty"); { await adb.ref().set({ jail: { U: { until: now + H }, X: { until: now + H } } }); const dU = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database(); let own = true, oth = true; try { await dU.ref("jail/U").get(); } catch { own = false; } try { await dU.ref("jail/X").get(); } catch { oth = false; } assert(own, "อ่านคุกตัวเองได้"); assert(!oth, "อ่านคุกคนอื่นไม่ได้"); } assert(!wb, "ผู้เล่นเขียน bty ไม่ได้"); }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("CRIM RULES OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
