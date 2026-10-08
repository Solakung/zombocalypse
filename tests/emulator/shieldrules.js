// 🛡️ rules โล่ผู้เล่นใหม่ (attacks + shield/{uid}/off + zonePlayers nb/wk): เทียบ rules เก่า (5801aab) กับใหม่ — ผู้เล่นใหม่ (บัญชี < 3 วัน และค้นหา < 100) ถูกโจมตีไม่ได้ทุกโซน • โจมตีผู้เล่นอื่นแล้วโล่หมดถาวร (ต้องเขียน shield/off ในการโจมตีเดียวกัน)
// ใช้: NODE_PATH=/tmp/fbt/rut/node_modules node tests/emulator/shieldrules.js
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs"), assert = require("assert"), { execSync } = require("child_process");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo"; if (!admin.apps.length) admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: process.env.OLD_RULES ? fs.readFileSync(process.env.OLD_RULES, "utf8") : execSync("git show 5801aab:database_rules.json", { cwd: "/home/user/zombocalypse", maxBuffer: 1 << 26 }).toString(), nw: fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8") };
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
  const H = 3600000, D = 86400000;
  const mk = (ux, tx, extra = {}) => { const b = base(extra, ux, "human"); b.users.T = user("human", { username: "target", ...tx }); return b; };
  const newb = { createdAt: now - H }, oldb = { createdAt: now - 10 * D };
  const srch = (u, n) => ({ ach: { [u]: { ts: now - 60000, c: { srch: n } } } });
  const off = (u) => ({ shield: { [u]: { off: now - 1000 } } });
  const aOff = () => ({ ...atk({})(), "shield/U/off": SV });
  const zp = (flags) => () => ({ "zonePlayers/ruins/U": { name: "tester", faction: "human", ...flags } });
  const C = [
    ["ปกติ: บัญชีเก่าโจมตีบัญชีเก่า ผ่านเหมือนเดิม", mk(oldb, oldb), atk({}), true, true],
    ["โล่: เป้าหมายใหม่ (1 ชม.) ไม่มีค้นหา โจมตีไม่ได้", mk(oldb, newb), atk({}), true, false],
    ["โล่: เป้าหมายใหม่ ค้นหา 99 ครั้ง ยังมีโล่", mk(oldb, newb, srch("T", 99)), atk({}), true, false],
    ["โล่: เป้าหมายใหม่ ค้นหา 100 ครั้ง โล่หมด โจมตีได้", mk(oldb, newb, srch("T", 100)), atk({}), true, true],
    ["โล่: เป้าหมายอายุ 4 วัน โล่หมด โจมตีได้", mk(oldb, { createdAt: now - 4 * D }), atk({}), true, true],
    ["โล่: เป้าหมายอายุ 2 วัน 23 ชม. ยังมีโล่", mk(oldb, { createdAt: now - 3 * D + H }), atk({}), true, false],
    ["โล่: เป้าหมายใหม่แต่เคยโจมตีคนอื่น (shield/off) โจมตีได้", mk(oldb, newb, off("T")), atk({}), true, true],
    ["โล่: เป้าหมายไม่มี createdAt (บัญชีเก่ามาก) โจมตีได้", mk(oldb, { createdAt: null }), atk({}), true, true],
    ["ผู้โจมตีใหม่ โจมตีโดยเขียน shield/off ด้วย ผ่าน (เก่าไม่มีโหนด shield จึงปฏิเสธทั้งชุด)", mk(newb, oldb), aOff, false, true],
    ["ผู้โจมตีใหม่ โจมตีโดยไม่เขียน shield/off ไม่ผ่าน (กันเลี่ยง)", mk(newb, oldb), atk({}), true, false],
    ["ผู้โจมตีใหม่แต่โล่หมดไปแล้ว (มี off) โจมตีได้โดยไม่ต้องเขียนซ้ำ", mk(newb, oldb, off("U")), atk({}), true, true],
    ["ผู้โจมตีใหม่ ค้นหา 100 ครั้ง (โล่หมดตามเกณฑ์) โจมตีได้ไม่ต้องเขียน off", mk(newb, oldb, srch("U", 100)), atk({}), true, true],
    ["ผู้โจมตีอายุเกิน 3 วัน โจมตีได้ตามปกติ", mk({ createdAt: now - 5 * D }, oldb), atk({}), true, true],
    ["ใหม่ตีใหม่: เขียน off แล้วก็ยังตีเป้าหมายที่มีโล่ไม่ได้", mk(newb, newb), aOff, false, false],
    ["ใหม่ตีใหม่ที่เป้าหมายโล่หมดแล้ว (ค้นหา 100) ผ่านเมื่อเขียน off", mk(newb, newb, srch("T", 100)), aOff, false, true],
    // ---- shield/{uid}/off
    ["off: เขียนของตัวเอง = now ผ่าน", mk(newb, oldb), () => ({ "shield/U/off": SV }), false, true],
    ["off: เขียนเวลาปลอม (ไม่ใช่ now) ไม่ผ่าน", mk(newb, oldb), () => ({ "shield/U/off": now - 5000 }), false, false],
    ["off: เขียนซ้ำเมื่อมีแล้วไม่ผ่าน", mk(newb, oldb, off("U")), () => ({ "shield/U/off": SV }), false, false],
    ["off: เขียนให้คนอื่นไม่ผ่าน", mk(newb, oldb), () => ({ "shield/T/off": SV }), false, false],
    ["off: ลบของตัวเองไม่ผ่าน (โล่ไม่กลับมา)", mk(newb, oldb, off("U")), () => ({ "shield/U/off": null }), false, false],
    // ---- zonePlayers flags
    ["nb: ผู้เล่นใหม่ตั้งธงของตัวเอง ผ่าน", mk(newb, oldb), zp({ nb: true }), true, true],
    ["nb: บัญชีเก่าตั้งธง nb ปลอม ไม่ผ่าน", mk(oldb, oldb), zp({ nb: true }), true, false],
    ["nb: ผู้เล่นใหม่แต่โล่หมด (off) ตั้งธงไม่ผ่าน", mk(newb, oldb, off("U")), zp({ nb: true }), true, false],
    ["wk: ตั้งธงกำลังเดินผ่าน ผ่าน", mk(oldb, oldb), zp({ wk: true }), true, true],
    ["wk: ค่า false ไม่ผ่าน (ต้อง true หรือไม่มี)", mk(oldb, oldb), zp({ wk: false }), true, false],
    ["ไม่มีธง: เหมือนเดิมทุกอย่าง", mk(oldb, oldb), zp({}), true, true]
  ];
  const res = {};
  for (const k of ["old", "nw"]) {
    await setRules(k); res[k] = {};
    for (const [name, seed, w] of C) {
      const sd = JSON.parse(JSON.stringify(seed)), lt = sd.users && sd.users.U && sd.users.U.lastTravel; if (typeof lt === "number") sd.users.U.lastTravel = lt + (Date.now() - now);   // เลื่อนเวลาตามที่ผ่านไปจริง ไม่ให้เคส "รอ N วินาที" เพี้ยนเพราะเทสต์รันนาน
      await adb.ref().set(sd);
      const db = env.authenticatedContext("U", { firebase: { sign_in_provider: "password" } }).database();
      let ok = true; try { await db.ref().update(w()); } catch { ok = false; }
      res[k][name] = ok;
    }
  }
  let bad = 0;
  for (const [name, , , eo, en] of C) { if (res.old[name] !== eo || res.nw[name] !== en) { bad++; console.error("MISMATCH", name, "old", res.old[name], "(want", eo + ")", "new", res.nw[name], "(want", en + ")"); } }
  assert.strictEqual(bad, 0);
  console.log("SHIELD RULES OK (" + C.length + " cases, rules +" + (R.nw.length - R.old.length) + " B)"); await env.cleanup(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
