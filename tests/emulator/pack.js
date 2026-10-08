// 🦖 สายแรปเตอร์ (functions/pack.js + hboss/use/mutate/ability): ตารางตรง script.js, ย้ายข้อมูลเดิม, สรุปสาย (owner), ลูกฝูงในบอสเผ่ามนุษย์ (ปรากฏ/รับแทน/กัด/หลบ), มิวเตชัน 5–8, เพดาน HP, ความสามารถประจำสาย
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert"), fs = require("fs");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=pack" });
const db = admin.database(); const PK = require(F + "functions/pack"), H = require(F + "functions/hboss"), U = require(F + "functions/use"), MU = require(F + "functions/mutate"), AB = require(F + "functions/ability");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
const queue = []; const rnd = () => (queue.length ? queue.shift() : 0.5); const q = (...v) => { queue.length = 0; queue.push(...v); }; const left = () => assert.strictEqual(queue.length, 0, "unused rnd " + queue.join(","));
const D = (n) => (n - 1) / 6 + 0.01;
const sc = fs.readFileSync(F + "script.js", "utf8");
(async () => {
  // ---- ตัวเลขฝั่งเกมตรงฝั่งเซิร์ฟเวอร์
  const T = new Function(sc.slice(sc.indexOf("function packTable()"), sc.indexOf("const packClamp")) + "; return packTable();")();
  assert.deepStrictEqual(T.cost, PK.COST); assert.deepStrictEqual(T.hp, PK.HP); assert.deepStrictEqual(T.agi, PK.AGI); assert.deepStrictEqual(T.dodge, PK.DODGE); assert.deepStrictEqual(T.icpt, PK.INTERCEPT); assert.deepStrictEqual(T.bite, PK.BITE); assert.strictEqual(T.dodgeCap, PK.DODGE_CAP); assert.deepStrictEqual(T.mut, PK.MUT);
  assert.strictEqual(T.fightMs, 120000); assert(sc.includes("const EVO_STEP = [3, 6, 10, 15]")); assert.deepStrictEqual(PK.COST, [3, 6, 10, 15]); assert(sc.includes("Math.random() >= 0.7") && PK.BITE_ACC === 0.7);
  // ข้อความมิวเตชันฝั่งเซิร์ฟเวอร์ใช้ตารางเดียวกัน
  assert.deepStrictEqual(MU.LINES.pack.pass(4), { icpt: 0.12, dodge: 0.04, bite: 1, hp: 20 }); assert.strictEqual(MU.LINES.pack.k, "p"); assert.strictEqual(MU.mainLine({ line: "pack", p: 4 }), "pack"); assert.strictEqual(MU.mainLine({ line: "pack", p: 3 }), null); assert.strictEqual(MU.mainLine({ line: "hunter", h: 4, p: 4 }), "hunter");
  // ---- ฟังก์ชันล้วน
  assert.strictEqual(PK.packTier({ p: 3 }), 3); assert.strictEqual(PK.packTier({ p: 9 }), 4); assert.strictEqual(PK.packTier({ p: -2 }), 0); assert.strictEqual(PK.packTier(null), 0); assert.strictEqual(PK.packTier({ h: 4, p: 1 }), 1, "เป็นสายเต็มรูปแบบ: ใช้ร่วมกับสายอื่นได้ (ถึงขั้น 1)");
  assert.strictEqual(PK.packMut({ p: 4, mp: 3 }), 3); assert.strictEqual(PK.packMut({ p: 3, mp: 3 }), 0, "ต้องแรปเตอร์ขั้น 4"); assert.strictEqual(PK.packMut({ p: 4, mp: 9 }), 4);
  assert.deepStrictEqual([0, 1, 2, 3, 4].map((m) => PK.packBonus("hp", 4, m)), [-5, -5, -5, -4, -3]); assert.deepStrictEqual([1, 2, 3, 4].map((t) => PK.packBonus("hp", t)), [-2, -3, -4, -5]); assert.strictEqual(PK.packBonus("str", 4), 0);
  assert.strictEqual(PK.dodgeBonus(4, 4), 0.22); assert.strictEqual(PK.intercept(4, 4), 0.42); assert.deepStrictEqual(PK.biteRange(4, 0), [2, 4]); assert.deepStrictEqual(PK.biteRange(4, 2), [2, 5]); assert.strictEqual(PK.biteRange(0, 0), null);
  assert.deepStrictEqual(PK.mainOf({ line: "pack", p: 2, h: 1 }), ["pack", 2]); assert.deepStrictEqual(PK.mainOf({ line: "hunter", h: 4, p: 1 }), ["hunter", 4]); assert.strictEqual(PK.mainOf({}), null); assert.deepStrictEqual(PK.mainOf({ line: "none", g: 2, p: 1 }), ["giant", 2]);
  const pk = PK.makePack(db), u = (n, f, x = {}) => ({ username: n, faction: f, hp: 100, zone: "forest", role: "player", ...x });
  let r;
  // ---- ย้ายข้อมูลเดิม pack/{uid}
  const set = (x = {}) => db.ref().set({ users: { z: u("z", "zombie"), h: u("h", "human"), o: u("o", "human", { role: "owner" }) }, ...x });
  await set({ evo: { z: { dna: 5, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0 } }, pack: { z: { t: 2, sp: 9, rs: 0 } } });
  r = await pk.run("z", { a: "migrate" }, T0); assert.deepStrictEqual({ m: r.migrated, p: r.p }, { m: true, p: 2 }); const e = (await db.ref("evo/z").get()).val(); assert.deepStrictEqual({ p: e.p, sp: e.sp, line: e.line, dna: e.dna }, { p: 2, sp: 9, line: "pack", dna: 5 }); assert.strictEqual((await db.ref("pack/z").get()).val(), null);
  assert.deepStrictEqual(await pk.run("z", { a: "migrate" }, T0), { ok: true, migrated: false });                     // ซ้ำ = ไม่ทำอะไร
  await set({ evo: { z: { dna: 5, sp: 3, line: "hunter", h: 1, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0 } }, pack: { z: { t: 1, sp: 3, rs: 0 } } });   // มีสายอื่นอยู่แล้ว → คืน DNA เต็มจำนวน
  r = await pk.run("z", { a: "migrate" }, T0); assert.deepStrictEqual({ m: r.migrated, rf: r.refunded }, { m: false, rf: 3 }); assert.strictEqual((await db.ref("evo/z/dna").get()).val(), 8); assert.strictEqual((await db.ref("evo/z/p").get()).val(), null);
  await rej(pk.run(null, { a: "dist" }, T0), "ล็อกอิน"); await rej(pk.run("z", { a: "zz" }, T0), "ไม่รู้จัก"); await rej(pk.run("z", { a: "dist" }, T0), "ทีมงาน");
  // ---- สรุปสาย (owner)
  await db.ref().set({ users: { a: u("a", "zombie"), b: u("b", "zombie"), c: u("c", "zombie"), d: u("d", "zombie"), e: u("e", "zombie"), f: u("f", "zombie", { role: "gm" }), x: u("x", "zombie", { banned: true }), h: u("h", "human"), o: u("o", "human", { role: "owner" }) },
    evo: { a: { line: "hunter", h: 2, g: 0, s: 1, p: 1 }, b: { line: "giant", g: 4 }, c: { dna: 5, h: 0, g: 0, s: 0 }, d: { line: "pack", p: 3 }, e: { line: "pack", p: 4, h: 1 }, x: { h: 4 } } });
  r = await pk.run("o", { a: "dist" }, T0); assert.deepStrictEqual({ h: r.hunter, g: r.giant, s: r.shade, p: r.pack, none: r.none, n: r.n }, { h: [0, 0, 1, 0, 0], g: [0, 0, 0, 0, 1], s: [0, 0, 0, 0, 0], p: [0, 0, 0, 1, 1], none: 1, n: 5 });
  // ---- hboss: ลูกฝูงปรากฏ/รับแทน/กัด/หลบ
  const hb = H.makeHboss(db, rnd), mk = (extra = {}) => db.ref().set({ users: { z: u("z", "zombie", { hp: 150 }) }, stats: { z: { str: 2, hp: 2, agi: 2, tough: 2 } }, ...extra });
  await mk({ evo: { z: { dna: 0, h: 0, g: 0, s: 0, p: 2, sp: 9, line: "pack" } } });
  q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.hit, true); assert(r.log.some((l) => /ลูกฝูงปรากฏ/.test(l))); assert.deepStrictEqual(r.fight.pack, { t: 2 }); assert.strictEqual((await db.ref("hboss/z/pk").get()).val(), 2);
  assert.strictEqual(r.maxHp, 100 + 10 * (2 - 3), "เลือดสูงสุดลดตามขั้น");
  q(D(4), 0.5, 0, 0.5, 0.9, 0.1); r = await hb.run("z", { a: "attack" }, T0 + 1000); left(); assert.strictEqual(r.fight.hp, 42); assert.strictEqual(r.hp, 150); assert(r.log.some((l) => /ลูกฝูงงับบอส −1/.test(l))); assert(r.log.some((l) => /ลูกฝูงกระโจนมารับ/.test(l)));
  q(D(4), 0.9, 0.5, 0.9, 0.9, 0); r = await hb.run("z", { a: "attack" }, T0 + 2000); left(); assert.strictEqual(r.fight.hp, 35); assert.strictEqual(r.hp, 146); assert(r.log.some((l) => /ลูกฝูงงับพลาด/.test(l)));
  q(D(4), 0.9, 0.5, 0.15); r = await hb.run("z", { a: "attack" }, T0 + 3000); left(); assert.strictEqual(r.hp, 143, "แผลเก่าจากบอสป่ายังเสีย 3"); assert(r.log.some((l) => /คุณหลบ/.test(l)));
  q(0.99, 0.5, 0.9, 0.9, 0.9); r = await hb.run("z", { a: "flee" }, T0 + 4000); left(); assert(!r.log.some((l) => /ลูกฝูงงับ/.test(l)));
  await db.ref("hboss/z/hp").set(6); q(D(2), 0.5, 0.99); r = await hb.run("z", { a: "attack" }, T0 + 5000); left(); assert.strictEqual(r.won, true); assert.strictEqual(r.fight.hp, 0);
  // มิวเตชัน: ขั้น 8 ลดโทษ HP 20 / กัดสูงสุด +1 / รับแทน +12% — ต้องแรปเตอร์ขั้น 4
  const ev4 = { dna: 0, h: 0, g: 0, s: 0, p: 4, sp: 34, line: "pack" };
  await mk({ evo: { z: ev4 } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.maxHp, 100 + 10 * (2 - 5));
  await mk({ evo: { z: ev4 }, mut: { z: { p: 4 } } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.maxHp, 100 + 10 * (2 - 5 + 2)); assert.deepStrictEqual(r.fight.pack, { t: 4 });
  q(D(4), 0.5, 0.99, 0.5, 0.9, 0.4); r = await hb.run("z", { a: "attack" }, T0 + 1000); left(); assert(r.log.some((l) => /ลูกฝูงงับบอส −5/.test(l)), "กัดสูงสุด 4+1"); assert(r.log.some((l) => /ลูกฝูงกระโจนมารับ/.test(l)), "รับแทน 0.30+0.12 = 0.42 > 0.4");
  await mk({ evo: { z: { ...ev4, p: 3 } }, mut: { z: { p: 4 } } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.maxHp, 100 + 10 * (2 - 4), "มิวเตชันค้างแต่แรปเตอร์ไม่ถึงขั้น 4 = ไม่มีผล");
  // มีสายอื่นพร้อมกัน (สายหลักซากหนา 4 + แรปเตอร์ 1): hp = +5 − 2
  await mk({ evo: { z: { dna: 0, h: 0, g: 4, s: 0, p: 1, sp: 37, line: "giant" } } }); q(0); r = await hb.run("z", { a: "roll" }, T0); left(); assert.strictEqual(r.maxHp, 100 + 10 * (2 + 5 - 2)); assert.deepStrictEqual(r.fight.pack, { t: 1 });
  // ---- use.js: เพดานเลือดสูงสุดตามขั้น/มิวเตชัน (ผ้าพันแผล +20)
  const use = U.makeUse(db, admin), useAt = async (evo, mut) => { await db.ref().set({ users: { z: u("z", "zombie", { hp: 60, food: 50, foodTs: T0, water: 50, waterTs: T0, stamina: 50, staminaTs: T0 }) }, stats: { z: { str: 2, hp: 2, agi: 2, tough: 2 } }, inventory: { z: { bandage: { id: "bandage", qty: 3 } } }, evo: { z: { dna: 0, h: 0, g: 0, s: 0, ...evo } }, ...(mut ? { mut: { z: mut } } : {}) }); await use.run("z", { slot: "bandage" }, T0); return (await db.ref("users/z/hp").get()).val(); };
  assert.strictEqual(await useAt({}), 80); assert.strictEqual(await useAt({ p: 4 }), 70, "100+10×(2−5)"); assert.strictEqual(await useAt({ p: 2 }), 80); assert.strictEqual(await useAt({ p: 4 }, { p: 3 }), 80, "มิวเตชันขั้น 7: โทษ −4"); assert.strictEqual(await useAt({ p: 4 }, { p: 4 }), 80);
  // ---- มิวเตชัน (mutate.js): ต้องแรปเตอร์ขั้น 4 • ซื้อ 25 DNA → mut/p
  const mu = MU.makeMutate(db);
  await db.ref().set({ users: { z: u("z", "zombie") }, evo: { z: { dna: 300, sp: 34, line: "pack", h: 0, g: 0, s: 0, p: 3 } } }); r = await mu.run("z", { a: "state" }, T0); assert.strictEqual(r.line, null); await rej(mu.run("z", { a: "buy" }, T0), "ขั้น 4");
  await db.ref("evo/z/p").set(4); r = await mu.run("z", { a: "state" }, T0); assert.strictEqual(r.line, "pack"); assert.strictEqual(r.n, "สายแรปเตอร์"); assert.strictEqual(r.m, 0); assert.strictEqual(r.tiers.length, 4);
  r = await mu.run("z", { a: "buy" }, T0); assert.strictEqual(r.bought, "ฝูงอาละวาด"); assert.strictEqual(r.m, 1); assert.deepStrictEqual(r.pass, { icpt: 0.03, dodge: 0, bite: 1, hp: 0 }); assert.strictEqual((await db.ref("mut/z/p").get()).val(), 1); assert.strictEqual((await db.ref("evo/z/dna").get()).val(), 275);
  for (let i = 0; i < 3; i++) await mu.run("z", { a: "buy" }, T0); r = await mu.run("z", { a: "state" }, T0); assert.strictEqual(r.m, 4); assert.deepStrictEqual(r.pass, { icpt: 0.12, dodge: 0.04, bite: 1, hp: 20 }); await rej(mu.run("z", { a: "buy" }, T0), "สูงสุด");
  // ---- ความสามารถประจำสาย (ability.js): แรปเตอร์เป็นสายหลักได้ความสามารถ packz
  assert.deepStrictEqual(AB.evoLine({ line: "pack", p: 2 }), { k: "pack", L: 2 }); assert.deepStrictEqual(AB.evoLine({ line: "pack", p: 4 }, { p: 2 }), { k: "pack", L: 6 }); assert.deepStrictEqual(AB.evoLine({ line: "hunter", h: 1, p: 1 }), { k: "hunter", L: 1 });
  const ab = AB.makeAbility(db); await db.ref().set({ users: { z: u("z", "zombie") }, evo: { z: { dna: 0, line: "pack", h: 0, g: 0, s: 0, p: 2 } }, inventory: { z: { rotten_meat: { id: "rotten_meat", qty: 5 } } } });
  r = await ab.run("z", { a: "state" }, T0); assert.strictEqual(r.id, "packz"); assert.strictEqual(r.L, 2); r = await ab.run("z", { a: "use" }, T0); assert.strictEqual(r.used, true); assert.deepStrictEqual(Object.keys(r.live.eff).sort(), ["dodge", "icpt"]); assert.strictEqual(r.live.eff.icpt, 0.06);
  console.log("pack OK"); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
