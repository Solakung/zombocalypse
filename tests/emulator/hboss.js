// 🏹 บอสเผ่ามนุษย์สำหรับซอมบี้ (functions/hboss.js): เปิด/ปิดด้วย tune, ทอยเจอ+คูลดาวน์+ถังโทเค็น, สู้เป็นรอบ (โล่/เลือดไหล/ยาอ่อนแรง/ฉมวก/ซุ่มตีก่อน), หนี, ตาย, รับรางวัล, และสูตรตรงกับ script.js
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=hboss" });
const db = admin.database(); const H = require(F + "functions/hboss");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
// ตัวสุ่มแบบกำหนดค่าเอง: คิวค่า [0,1) — หมดคิวแล้วคืน 0.5 (ใช้ q(...) ใส่ก่อนทุกครั้ง แล้วตรวจว่าใช้หมดพอดี)
const queue = []; const rnd = () => (queue.length ? queue.shift() : 0.5); const q = (...v) => { queue.length = 0; queue.push(...v); };
const left = () => { assert.strictEqual(queue.length, 0, "unused rnd " + queue.join(",")); };
const D = (n) => (n - 1) / 6 + 0.01;   // ค่าสุ่มที่ทำให้ลูกเต๋า = n
const sc = fs.readFileSync(F + "script.js", "utf8");
(async () => {
  // ---- สูตรต้องตรงกับ script.js
  const bossW = new Function(sc.match(/const BOSS_W = (\{[^}]*\});/)[1].replace(/^/, "return "))();
  for (const [z, w] of Object.entries(H.W)) assert.strictEqual(bossW[z], w, "BOSS_W " + z);
  assert.strictEqual(Number(sc.match(/UNARMED_DMG = (\d+)/)[1]), H.UNARMED_DMG); assert.strictEqual(Number(sc.match(/DODGE_PER_POINT = ([\d.]+)/)[1]), H.DODGE_PER_POINT); assert.strictEqual(Number(sc.match(/HP_BASE = (\d+)/)[1]), H.HP_BASE);
  assert.deepStrictEqual(JSON.parse(sc.match(/const HB_ZONES = (\[[^\]]*\])/)[1]), Object.keys(H.W), "HB_ZONES");
  const evoSrc = sc.slice(sc.indexOf("function evoBonusAt"), sc.indexOf("function evoBonus(k)"));
  const pkSrc = sc.slice(sc.indexOf("function packTable()"), sc.indexOf("function packT()")), clientEvo = new Function(pkSrc + evoSrc + "; return evoBonusAt;")();
  const srvSrc = fs.readFileSync(F + "functions/hboss.js", "utf8"), eb = srvSrc.slice(srvSrc.indexOf("function evoBonus(evo, k)"), srvSrc.indexOf("async function load"));
  const srvEvo = new Function("PK", "const num = (x) => (typeof x === \"number\" && Number.isFinite(x) ? x : 0);" + eb + "; return evoBonus;")(require(F + "functions/pack"));
  for (let h = 0; h <= 4; h++) for (let g = 0; g <= 4; g++) for (let s = 0; s <= 4; s++) for (let p = 0; p <= 4; p++) for (const k of ["str", "hp", "agi", "tough", "st", "regen"]) assert.strictEqual(srvEvo({ h, g, s, p }, k), clientEvo(k, { h, g, s, p }), `evo ${k} ${h}${g}${s} p${p}`);   // รวมสายแรปเตอร์ (มีผลเฉพาะเมื่อไม่มีสายอื่น)
  // รางวัลทุกชิ้นต้องอยู่ใน ITEMS ของเกม และผ่าน regex ของ rules ช่องกระเป๋า
  const rules = JSON.parse(fs.readFileSync(F + "database_rules.json", "utf8")).rules, rx = new RegExp(rules.inventory.$uid.$slot[".validate"].match(/matches\(\/(\^\([^/]+\)\$)\//)[1]);
  const ids = new Set(); for (const [z, b] of Object.entries(H.BOSSES)) { assert(H.W[z], "W " + z); for (const [id] of [...b.loot, ...b.bonus]) if (id) ids.add(id); }
  for (const id of ids) { assert(new RegExp("^  " + id + ": \\{", "m").test(sc), "ITEMS " + id); assert(rx.test(id), "rules regex " + id); }
  { const U = require(F + "functions/use"); for (const [id, v] of Object.entries(H.HEAL_ITEMS)) assert.strictEqual(U.CONSUMABLES[id].heal, v, "heal " + id); }   // ค่าฟื้นตรง use.js
  // ---- ข้อมูล
  const u = (n, f, zone, x = {}) => ({ username: n, faction: f, hp: 150, zone, ...x });
  const mk = async (extra = {}) => { await db.ref().set({ users: { z: u("z", "zombie", "forest"), h: u("h", "human", "forest"), l: u("l", "zombie", "lab"), b: u("b", "zombie", "forest", { banned: true }), d: u("d", "zombie", "forest", { hp: 0 }) }, stats: { z: { str: 3, hp: 5, agi: 0, tough: 0 } }, tune: { hb_on: 1 }, ...extra }); };
  await mk({ tune: null });
  const hb = H.makeHboss(db, rnd); let r;
  // ---- ค่าเริ่มต้น = เปิด (ไม่มี tune) • ตั้ง hb_on = 0 = ปิด: ไม่เจอ, state ใช้ได้
  assert.strictEqual((await hb.run("z", { a: "state" }, T0)).on, true, "default on"); await db.ref("tune/hb_on").set(0);
  q(0); r = await hb.run("z", { a: "roll" }, T0); assert.deepStrictEqual({ on: r.on, hit: r.hit }, { on: false, hit: false }); assert.strictEqual(queue.length, 1); assert.strictEqual((await db.ref("hboss/z").get()).val(), null);
  assert.deepStrictEqual(await hb.run("z", { a: "state" }, T0), { ok: true, on: false, fight: null });
  await db.ref("tune/hb_on").set(1);
  // ---- สิทธิ์
  await rej(hb.run(null, { a: "roll" }, T0), "ล็อกอิน"); await rej(hb.run("z", { a: "zz" }, T0), "ไม่รู้จัก"); await rej(hb.run("h", { a: "roll" }, T0), "ซอมบี้เท่านั้น"); await rej(hb.run("b", { a: "roll" }, T0), "ใช้งานไม่ได้"); await rej(hb.run("d", { a: "roll" }, T0), "มีชีวิต");
  await rej(hb.run("z", { a: "attack" }, T0), "ไม่มีการต่อสู้"); await rej(hb.run("z", { a: "claim" }, T0), "ไม่มีการต่อสู้");
  q(0); r = await hb.run("l", { a: "roll" }, T0); assert.strictEqual(r.hit, false); assert.strictEqual(queue.length, 1, "โซนที่ไม่มีเผ่าไม่ทอย"); queue.length = 0;
  // ---- ทอยเจอ: ไม่เจอ (0.99) / เจอ (0) ป่า W=2%
  q(0.99); r = await hb.run("z", { a: "roll" }, T0); assert.strictEqual(r.hit, false); left();
  q(0.0199); r = await hb.run("z", { a: "roll" }, T0 + 1000); assert.strictEqual(r.hit, true); left(); assert.strictEqual(r.fight.hp, 50); assert.strictEqual(r.fight.name, "หัวหน้าเผ่านายพราน"); assert.strictEqual(r.hp, 150);
  q(0.0); r = await hb.run("z", { a: "roll" }, T0 + 2000); assert.strictEqual(r.hit, false); assert(r.fight); assert.strictEqual(queue.length, 1, "มีบอสอยู่แล้วไม่ทอยซ้ำ"); queue.length = 0;
  assert.strictEqual((await hb.run("z", { a: "state" }, T0 + 2000)).fight.hp, 50);
  // ---- สู้: ทอย 4 (×1) ดาเมจ 5+3=8 → บอส 62 / บอสตี: โดน(0) ไม่หลบ(.99) ดาเมจ 7 (lo) → ผู้เล่น 143 + เลือดไหล
  q(D(4), 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 3000); left();
  assert.strictEqual(r.fight.hp, 42); assert.strictEqual(r.hp, 144); assert.deepStrictEqual(r.fight.pdot, { n: 2, per: 3 }); assert.strictEqual((await db.ref("users/z/hp").get()).val(), 144);
  // รอบสอง: ทอย 6 (×1.5) = 12 → 50 / แผลเก่า −3 / บอสฟาดพลาด (0.99)
  q(D(6), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 4000); left(); assert.strictEqual(r.fight.hp, 30); assert.strictEqual(r.hp, 141); assert.strictEqual(r.fight.pdot.n, 1);
  // ทอย 1 = พลาดหนัก ไม่เสียเลือดบอส
  q(D(1), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 5000); left(); assert.strictEqual(r.fight.hp, 30); assert.strictEqual(r.hp, 138); assert.strictEqual(r.fight.pdot, null);
  // ---- หลบ/ทน: agi 10 → หลบ 30% (ค่า 0.1 หลบ) / ทน tough 3 ลดดาเมจ (ขั้นต่ำ 1)
  await db.ref("stats/z").update({ agi: 10, tough: 3 }); q(D(4), 0, 0.1); r = await hb.run("z", { a: "attack" }, T0 + 6000); left(); assert.strictEqual(r.hp, 138); assert(r.log.some((l) => l.includes("หลบ")));
  q(D(4), 0, 0.5, 0); r = await hb.run("z", { a: "attack" }, T0 + 7000); left(); assert.strictEqual(r.hp, 138 - 3, "6−3=3"); await db.ref("users/z/hp").set(150);
  await db.ref("stats/z").update({ agi: 0, tough: 0 });
  // ---- มึนงงโจมตีไม่ได้ / หนี
  await db.ref("effects/z/stun").set({ bstart: T0, mins: 5, v: 1 }); await rej(hb.run("z", { a: "attack" }, T0 + 8000), "มึนงง"); await db.ref("effects/z").remove();
  q(0.9, 0.99); r = await hb.run("z", { a: "flee" }, T0 + 9000); left(); assert(!r.fled); assert(r.fight);   // หนีไม่พ้น (flee .45) → โดนตีรอบนั้น (พลาด)
  q(0.1); r = await hb.run("z", { a: "flee" }, T0 + 10000); left(); assert.strictEqual(r.fled, true); assert.deepStrictEqual((await db.ref("hboss/z").get()).val(), { last: T0 + 10000 });
  // ---- คูลดาวน์ 2 นาทีหลังจบ
  q(0); r = await hb.run("z", { a: "roll" }, T0 + 60000); assert.strictEqual(r.cooling, true); assert.strictEqual(queue.length, 1); queue.length = 0;
  q(0.0); r = await hb.run("z", { a: "roll" }, T0 + 10000 + 120000); assert.strictEqual(r.hit, true); left();
  // ---- ใช้ไอเทมรักษาระหว่างสู้: ฟื้น (ไม่เกินเลือดสูงสุด) + เสียไอเทม 1 + บอสตอบโต้ (พลาด 0.99) • ไอเทมนอกรายการ/ไม่มี/เลือดเต็มถูกปฏิเสธ
  await db.ref("users/z/hp").set(100); await db.ref("inventory/z").set({ bandage: { id: "bandage", qty: 2 }, medkit: { id: "medkit", qty: 1 }, canned_food: { id: "canned_food", qty: 3 } });
  q(0.99); r = await hb.run("z", { a: "heal", id: "bandage" }, T0 + 150000); left(); assert.strictEqual(r.hp, 120); assert((await db.ref("inventory/z/bandage/qty").get()).val() === 1); assert(r.fight && r.log[0].includes("+20"));
  q(0.99); r = await hb.run("z", { a: "heal", id: "medkit" }, T0 + 151000); left(); assert.strictEqual(r.hp, 150, "ไม่เกิน max"); assert.strictEqual((await db.ref("inventory/z/medkit").get()).val(), null); assert(r.log[0].includes("+30"));
  await rej(hb.run("z", { a: "heal", id: "bandage" }, T0 + 152000), "เต็มอยู่แล้ว"); await db.ref("users/z/hp").set(100);
  await rej(hb.run("z", { a: "heal", id: "canned_food" }, T0 + 153000), "ใช้ไอเทมนี้"); await rej(hb.run("z", { a: "heal", id: "moss" }, T0 + 153000), "ไม่มีไอเทม");
  assert.strictEqual((await db.ref("users/z/hp").get()).val(), 100); await db.ref("users/z/hp").set(150); await db.ref("inventory/z").remove();
  // ---- ตาย: hp 5, บอสตี 7 → 0, สถานะเหลือแค่ last
  await db.ref("users/z/hp").set(5); q(D(4), 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 200000); left(); assert.strictEqual(r.dead, true); assert.strictEqual((await db.ref("users/z/hp").get()).val(), 0); assert.deepStrictEqual((await db.ref("hboss/z").get()).val(), { last: T0 + 200000 }); assert.strictEqual(r.fight, null);
  // ---- ชนะ + รางวัล: บอสเหลือ 5, ทอย 4 → 8 ≥ 5 ล้ม (ไม่ตอบโต้)
  await db.ref("users/z/hp").set(150); q(0.0); r = await hb.run("z", { a: "roll" }, T0 + 400000); assert.strictEqual(r.hit, true); left();
  await db.ref("hboss/z/hp").set(5); q(D(4)); r = await hb.run("z", { a: "attack" }, T0 + 401000); left(); assert.strictEqual(r.won, true); assert.strictEqual(r.fight.hp, 0); assert.strictEqual(r.hp, 150);
  await rej(hb.run("z", { a: "attack" }, T0 + 402000), "ล้มแล้ว");
  await db.ref("inventory/z").set({ rotten_meat: { id: "rotten_meat", qty: 95 } });
  q(0.0, 0.0); await rej(hb.run("z", { a: "claim" }, T0 + 403000), "กระเป๋าเต็ม"); left(); assert.strictEqual((await db.ref("hboss/z/hp").get()).val(), 0, "ยังค้างให้รับใหม่"); assert.strictEqual((await db.ref("inventory/z/rotten_meat/qty").get()).val(), 95);
  await db.ref("inventory/z/rotten_meat/qty").set(10); q(0.0, 0.0); r = await hb.run("z", { a: "claim" }, T0 + 404000); left();   // loot ตัวแรก = rotten_meat 8 / bonus ตัวแรก = rotten_meat 4 (ซ้ำ → ตัดทิ้ง)
  assert.deepStrictEqual(r.claimed, [{ id: "rotten_meat", qty: 8 }]); assert.strictEqual((await db.ref("inventory/z/rotten_meat/qty").get()).val(), 18); assert.deepStrictEqual((await db.ref("hboss/z").get()).val(), { last: T0 + 404000 });
  await rej(hb.run("z", { a: "claim" }, T0 + 405000), "ไม่มีการต่อสู้");
  // ---- กลไกเฉพาะเผ่า
  const enc = async (zone, now) => { await db.ref("users/z").update({ zone, hp: 150 }); await db.ref("hboss/z").remove(); q(0.0); const x = await hb.run("z", { a: "roll" }, now); assert(x.hit, "encounter " + zone); left(); return x; };
  // โล่ตำรวจ: โล่ 25 ดูดดาเมจก่อน
  await enc("police", T0 + 500000); q(D(4), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 501000); left(); assert.strictEqual(r.fight.shield, 17); assert.strictEqual(r.fight.hp, 70); assert(r.log[0].includes("โล่รับไป 8"));
  await db.ref("hboss/z/shield").set(5); q(D(4), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 502000); left(); assert.strictEqual(r.fight.shield, 0); assert.strictEqual(r.fight.hp, 67, "ดาเมจ 8 − โล่ 5 = 3 ทะลุ"); assert(r.log[0].includes("โล่แตก"));
  // ยาหมอลัทธิ: โดนแล้วโจมตีถัดไป 2 ครั้งเหลือ 60% (8→5)
  await enc("hospital", T0 + 510000); q(D(4), 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 511000); left(); assert.strictEqual(r.fight.weak.n, 2); assert.strictEqual(r.fight.hp, 52);
  q(D(4), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 512000); left(); assert.strictEqual(r.fight.hp, 52 - 5); assert.strictEqual(r.fight.weak.n, 1);
  // ฉมวกกัปตัน: รอบที่ 3 ตีแรง ×1.5 (12→18)
  await enc("port", T0 + 520000); q(D(4), 0.99); await hb.run("z", { a: "attack" }, T0 + 521000); left(); q(D(4), 0.99); await hb.run("z", { a: "attack" }, T0 + 522000); left();
  q(D(4), 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 523000); left(); assert.strictEqual(r.hp, 150 - 18); assert(r.log.some((l) => l.includes("ฉมวกกระชาก")));
  // ช่างเหล็ก: ไฟเผา 3 ต่อรอบ 2 รอบ
  await enc("factory", T0 + 530000); q(D(4), 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 531000); left(); assert.deepStrictEqual(r.fight.pdot, { n: 2, per: 3 }); assert.strictEqual(r.hp, 150 - 8);
  q(D(4), 0.99); r = await hb.run("z", { a: "attack" }, T0 + 532000); left(); assert.strictEqual(r.hp, 150 - 8 - 3);
  // เผ่าใต้ดิน: ตีก่อนตอนเจอ 2 ครั้ง (ครั้งละ 5) / ตีสองครั้งต่อรอบ
  await db.ref("users/z").update({ zone: "tunnel", hp: 150 }); await db.ref("hboss/z").remove(); q(0.0, 0, 0.99, 0, 0, 0.99, 0); r = await hb.run("z", { a: "roll" }, T0 + 540000); left(); assert(r.hit); assert.strictEqual(r.hp, 150 - 10); assert.strictEqual(r.fight.round, 1);
  q(D(4), 0, 0.99, 0, 0, 0.99, 0); r = await hb.run("z", { a: "attack" }, T0 + 541000); left(); assert.strictEqual(r.hp, 150 - 20);
  // ---- ถังโทเค็น: 12 ครั้งแรกทอยได้ ครั้งที่ 13 ถูกจำกัด (เติม 1 ครั้งต่อ 15 วิ)
  await mk(); await db.ref("hbrl").remove();
  for (let i = 0; i < 12; i++) { q(0.99); r = await hb.run("z", { a: "roll" }, T0 + 700000); assert(!r.limited, "i=" + i); left(); }
  q(0.0); r = await hb.run("z", { a: "roll" }, T0 + 700000); assert.strictEqual(r.limited, true); assert.strictEqual(queue.length, 1); queue.length = 0;
  q(0.99); r = await hb.run("z", { a: "roll" }, T0 + 700000 + 15000); assert(!r.limited); left();
  // ---- ตัวคูณโอกาส: hb_pct 0 = ไม่เจอเลย / 500 = ป่า 10%
  await db.ref("hbrl").remove(); await db.ref("tune/hb_pct").set(0); q(0.0); r = await hb.run("z", { a: "roll" }, T0 + 800000); assert.strictEqual(r.hit, false); left();
  await db.ref("tune/hb_pct").set(500); q(0.099); r = await hb.run("z", { a: "roll" }, T0 + 801000); assert.strictEqual(r.hit, true); left();
  await db.ref("hboss/z").remove(); q(0.1); r = await hb.run("z", { a: "roll" }, T0 + 802000 + 130000); assert.strictEqual(r.hit, false); left();
  console.log("HBOSS OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
