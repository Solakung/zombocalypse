// 🦖 สายแรปเตอร์ (functions/pack.js + hboss.js + use.js): ซื้อ/รีเซ็ตด้วย DNA, เป็นสายแยก, ตัวเลขตรง script.js, ลูกฝูงในบอสเผ่ามนุษย์ (ปรากฏ/รับแทน/กัด/หลบ), เพดาน HP ใน use.js, สรุปสาย (owner)
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=pack" });
const db = admin.database(); const PK = require(F + "functions/pack"), H = require(F + "functions/hboss"), U = require(F + "functions/use");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), HR = 3600000;
const queue = []; const rnd = () => (queue.length ? queue.shift() : 0.5); const q = (...v) => { queue.length = 0; queue.push(...v); }; const left = () => assert.strictEqual(queue.length, 0, "unused rnd " + queue.join(","));
const D = (n) => (n - 1) / 6 + 0.01;
const sc = fs.readFileSync(F + "script.js", "utf8");
(async () => {
  // ---- ตัวเลขฝั่งเกมตรงฝั่งเซิร์ฟเวอร์
  const T = new Function(sc.slice(sc.indexOf("function packTable()"), sc.indexOf("function packBonusAt")) + "; return packTable();")();
  assert.deepStrictEqual(T.cost, PK.COST); assert.deepStrictEqual(T.hp, PK.HP); assert.deepStrictEqual(T.agi, PK.AGI); assert.deepStrictEqual(T.dodge, PK.DODGE); assert.deepStrictEqual(T.icpt, PK.INTERCEPT); assert.deepStrictEqual(T.bite, PK.BITE); assert.strictEqual(T.dodgeCap, PK.DODGE_CAP);
  assert.strictEqual(T.fightMs, 120000); assert(/86400000 - \(serverNow\(\) - state\.pack\.rs\)/.test(sc), "reset cd"); assert.strictEqual(PK.RESET_CD, 86400000); assert(sc.includes("Math.floor((state.pack?.sp || 0) * 0.7)") && PK.REFUND === 0.7);
  assert(sc.includes("const EVO_STEP = [3, 6, 10, 15]")); assert.deepStrictEqual(PK.COST, [3, 6, 10, 15]);
  // ---- ฟังก์ชันล้วน: ผลมีเฉพาะเมื่อไม่มีสายอื่น
  assert.strictEqual(PK.packTier({ h: 0, g: 0, s: 0, p: 3 }), 3); assert.strictEqual(PK.packTier({ h: 1, g: 0, s: 0, p: 3 }), 0); assert.strictEqual(PK.packTier({ p: 9 }), 4); assert.strictEqual(PK.packTier({ p: -2 }), 0); assert.strictEqual(PK.packTier(null), 0);
  assert.deepStrictEqual([0, 1, 2, 3, 4].map((t) => PK.packBonus("hp", t)), [0, -2, -3, -4, -5]); assert.strictEqual(PK.packBonus("str", 4), 0); assert.strictEqual(PK.dodgeBonus(4), 0.18);
  const pk = PK.makePack(db), u = (n, f, x = {}) => ({ username: n, faction: f, hp: 100, zone: "forest", role: "player", ...x });
  const set = (x = {}) => db.ref().set({ users: { z: u("z", "zombie"), h: u("h", "human"), o: u("o", "human", { role: "owner" }), n: u("n", "zombie") }, evo: { z: { dna: 40, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0 } }, ...x });
  let r;
  // ---- state / สิทธิ์
  await set(); r = await pk.run("z", { a: "state" }, T0); assert.deepStrictEqual({ t: r.t, active: r.active, cost: r.cost, dna: r.dna, zom: r.zom }, { t: 0, active: false, cost: 3, dna: 40, zom: true });
  r = await pk.run("h", { a: "state" }, T0); assert.strictEqual(r.zom, false); r = await pk.run("h", { a: "buy" }, T0); assert.strictEqual(r.zom, false); assert.strictEqual((await db.ref("pack/h").get()).val(), null);
  await rej(pk.run(null, { a: "state" }, T0), "ล็อกอิน"); await rej(pk.run("z", { a: "zz" }, T0), "ไม่รู้จัก"); await rej(pk.run("z", { a: "dist" }, T0), "ทีมงาน");
  await rej(pk.run("n", { a: "buy" }, T0), "ยังไม่มี DNA");   // ไม่มี evo (ยังไม่เคยกัดเลย)
  // ---- ซื้อทีละขั้น: หัก DNA 3/6/10/15 • ขั้น 4 แล้วซื้อไม่ได้
  const dnaOf = async () => (await db.ref("evo/z/dna").get()).val();
  for (const [t, cost] of [[1, 3], [2, 6], [3, 10], [4, 15]]) { const b = await dnaOf(); r = await pk.run("z", { a: "buy" }, T0); assert.strictEqual(r.t, t); assert.strictEqual(r.bought, t); assert.strictEqual(await dnaOf(), b - cost); assert.strictEqual((await db.ref("pack/z/t").get()).val(), t); }
  assert.strictEqual((await db.ref("pack/z/sp").get()).val(), 34); assert.strictEqual(r.dna, 6); await rej(pk.run("z", { a: "buy" }, T0), "ขั้นสูงสุด");
  assert.deepStrictEqual((await db.ref("evo/z").get()).val(), { dna: 6, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0 });   // evo ไม่มีฟิลด์ใหม่ (rules ของ evo ไม่รับ)
  // DNA ไม่พอ / มีสายอื่น
  await set(); await db.ref("evo/z/dna").set(2); await rej(pk.run("z", { a: "buy" }, T0), "DNA ไม่พอ"); assert.strictEqual((await db.ref("pack/z").get()).val(), null);
  await set(); await db.ref("evo/z/h").set(1); await rej(pk.run("z", { a: "buy" }, T0), "รีเซ็ตสาย"); assert.strictEqual(await dnaOf(), 40);
  // ---- รีเซ็ต: คืน 70% ของที่ใช้ • พัก 24 ชม.
  await set({ pack: { z: { t: 3, sp: 19, rs: 0 } } }); r = await pk.run("z", { a: "reset" }, T0); assert.strictEqual(r.refund, 13); assert.strictEqual(r.t, 0); assert.strictEqual(await dnaOf(), 53); assert.deepStrictEqual((await db.ref("pack/z").get()).val(), { t: 0, sp: 0, rs: T0 });
  await rej(pk.run("z", { a: "reset" }, T0 + HR), "ยังไม่มีขั้น"); await pk.run("z", { a: "buy" }, T0 + HR); await rej(pk.run("z", { a: "reset" }, T0 + 5 * HR), "ชม."); r = await pk.run("z", { a: "reset" }, T0 + 25 * HR); assert.strictEqual(r.refund, 2);
  // ---- สรุปสาย (owner)
  await db.ref().set({ users: { a: u("a", "zombie"), b: u("b", "zombie"), c: u("c", "zombie"), d: u("d", "zombie"), e: u("e", "zombie"), f: u("f", "zombie", { role: "gm" }), x: u("x", "zombie", { banned: true }), h: u("h", "human"), o: u("o", "human", { role: "owner" }) },
    evo: { a: { h: 2, g: 0, s: 1 }, b: { g: 4 }, c: { dna: 5, h: 0, g: 0, s: 0 }, d: { h: 0, g: 0, s: 0 }, x: { h: 4 } }, pack: { d: { t: 3 }, a: { t: 4 }, e: { t: 2 } } });
  r = await pk.run("o", { a: "dist" }, T0); assert.deepStrictEqual({ h: r.hunter, g: r.giant, s: r.shade, p: r.pack, none: r.none, n: r.n }, { h: [0, 0, 1, 0, 0], g: [0, 0, 0, 0, 1], s: [0, 0, 0, 0, 0], p: [0, 0, 1, 1, 0], none: 1, n: 5 });   // a มีสายอื่น → แรปเตอร์ไม่นับ • GM/แบน/มนุษย์ไม่นับ
  // ---- hboss: ลูกฝูงปรากฏ/รับแทน/กัด/หลบ
  const hb = H.makeHboss(db, rnd), mk = (extra = {}) => db.ref().set({ users: { z: u("z", "zombie", { hp: 150 }) }, stats: { z: { str: 2, hp: 2, agi: 2, tough: 2 } }, ...extra });
  await mk({ evo: { z: { dna: 0, h: 0, g: 0, s: 0 } }, pack: { z: { t: 2 } } });
  q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.hit, true); assert(r.log.some((l) => /ลูกฝูงปรากฏ/.test(l))); assert.deepStrictEqual(r.fight.pack, { t: 2 }); assert.strictEqual((await db.ref("hboss/z/pk").get()).val(), 2);
  assert.strictEqual(r.maxHp, 100 + 10 * (2 - 3), "เลือดสูงสุดลดตามขั้น");   // hp stat 2 + (−3)
  // รอบ 1: ทอย 4 (7 ดาเมจ) + ลูกฝูงกัด 1 → บอสเหลือ 42 • บอสโดน → ลูกฝูงรับแทน (intercept 15%) ไม่เสียเลือด
  q(D(4), 0.5, 0, 0.5, 0.9, 0.1); r = await hb.run("z", { a: "attack" }, T0 + 1000); left(); assert.strictEqual(r.fight.hp, 42); assert.strictEqual(r.hp, 150); assert(r.log.some((l) => /ลูกฝูงงับบอส −1/.test(l))); assert(r.log.some((l) => /ลูกฝูงกระโจนมารับ/.test(l)));
  // รอบ 2: ลูกฝูงงับพลาด • บอสโดน ไม่หลบ ไม่รับแทน → เสีย 6−tough2... (ri ต่ำสุด 6) = 4
  q(D(4), 0.9, 0.5, 0.9, 0.9, 0); r = await hb.run("z", { a: "attack" }, T0 + 2000); left(); assert.strictEqual(r.fight.hp, 35); assert.strictEqual(r.hp, 146); assert(r.log.some((l) => /ลูกฝูงงับพลาด/.test(l)));
  // รอบ 3: หลบ (20% = agi 4×3% + 8%) — ไม่ต้องทอยรับแทน
  q(D(4), 0.9, 0.5, 0.15); r = await hb.run("z", { a: "attack" }, T0 + 3000); left(); assert.strictEqual(r.hp, 143, "แผลเก่าจากบอสป่ายังเสีย 3"); assert(r.log.some((l) => /คุณหลบ/.test(l)));
  // หนีไม่พ้นรอบเดียวกัน: ลูกฝูงไม่กัด (ไม่เสียเทิร์นแบบโจมตี)
  q(0.99, 0.5, 0.9, 0.9, 0.9); r = await hb.run("z", { a: "flee" }, T0 + 4000); left(); assert(!r.log.some((l) => /ลูกฝูงงับ/.test(l)));
  // ลูกฝูงกัดปิดจบ: บอสเหลือน้อย
  await db.ref("hboss/z/hp").set(6); q(D(2), 0.5, 0.99); r = await hb.run("z", { a: "attack" }, T0 + 5000); left(); assert.strictEqual(r.won, true); assert.strictEqual(r.fight.hp, 0);
  // มีสายอื่น → แรปเตอร์ไม่มีผล (ไม่ปรากฏ ไม่มีโบนัส)
  await mk({ evo: { z: { dna: 0, h: 1, g: 0, s: 0 } }, pack: { z: { t: 4 } } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert(!r.log.some((l) => /ลูกฝูง/.test(l))); assert.strictEqual(r.fight.pack, null); assert.strictEqual(r.maxHp, 100 + 10 * (2 + 0));
  // ขั้น 4: HP −50
  await mk({ evo: { z: { dna: 0, h: 0, g: 0, s: 0 } }, pack: { z: { t: 4 } } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.maxHp, 100 + 10 * (2 - 5));
  // ---- use.js: เพดานเลือดสูงสุดลดตามขั้น (ผ้าพันแผล +20)
  const use = U.makeUse(db, admin), useAt = async (pack) => { await db.ref().set({ users: { z: u("z", "zombie", { hp: 60, food: 50, foodTs: T0, water: 50, waterTs: T0, stamina: 50, staminaTs: T0 }) }, stats: { z: { str: 2, hp: 2, agi: 2, tough: 2 } }, inventory: { z: { bandage: { id: "bandage", qty: 3 } } }, evo: { z: { dna: 0, h: 0, g: 0, s: 0 } }, ...(pack ? { pack: { z: { t: pack } } } : {}) }); await use.run("z", { slot: "bandage" }, T0); return (await db.ref("users/z/hp").get()).val(); };
  assert.strictEqual(await useAt(0), 80); assert.strictEqual(await useAt(4), 70, "เลือดสูงสุด 70 (100+10×(2−5))"); assert.strictEqual(await useAt(2), 80);
  console.log("pack OK"); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
