process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", fs = require("fs"), assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=cs" });
const db = admin.database(); const C = require(F + "casino"), H = require(F + "home");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
for (const id of [...Object.keys(C.VAL), ...C.SHOP.map((x) => x[0])]) { if (id.startsWith("deco_")) assert(H.ITEMS[id.slice(5)], "no deco " + id); else if (id.startsWith("theme_")) assert(H.TH[id.slice(6)], "no theme " + id); else assert(wl.test(id) && new RegExp("^  " + id + ": \\{", "m").test(sc), "bad id " + id); }
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), H1 = 3600000, DAY = 86400000;
(async () => {
  // ---- ตารางจ่าย (คณิต)
  const rtp = C.slotRtp(); assert(rtp > 0.88 && rtp < 0.97, "slot rtp " + rtp);
  assert.strictEqual(C.roulettePay("red", 0, 0), 0); assert.strictEqual(C.roulettePay("red", 0, 1), 2); assert.strictEqual(C.roulettePay("num", 7, 7), 36); assert.strictEqual(C.roulettePay("num", 0, 0), 36);
  let tot = 0; for (let x = 0; x < 37; x++) tot += C.roulettePay("num", 5, x); assert(Math.abs(tot / 37 - 36 / 37) < 1e-9);
  let t2 = 0; for (let x = 0; x < 37; x++) t2 += C.roulettePay("red", 0, x); assert(Math.abs(t2 / 37 - 36 / 37) < 1e-9, "red rtp");
  const mk = (n, zone = "casino", hp = 100, extra = {}) => ({ username: n, faction: "human", hp, zone, ...extra });
  await db.ref().set({ users: { a: mk("a"), b: mk("b", "ruins"), gm: mk("gm", "safe", 100, { role: "gm" }), dead: mk("dead", "casino", 0), ban: mk("ban", "casino", 100, { banned: true }) },
    inventory: { a: { scrap: { id: "scrap", qty: 50 }, gold_watch: { id: "gold_watch", qty: 3 }, bread: { id: "bread", qty: 10 } } } });
  const cs = C.makeCasino(db); let r; const chips = async (u = "a") => (await db.ref(`casino/${u}/chips`).get()).val() || 0;
  // ---- สิทธิ์
  await rej(cs.run(null, {}, T0), "ล็อกอิน"); await rej(cs.run("ban", { a: "state" }, T0), "ใช้งานไม่ได้"); await rej(cs.run("b", { a: "sell", id: "scrap", q: 1 }, T0), "คาสิโนเถื่อน"); await rej(cs.run("dead", { a: "sell", id: "scrap", q: 1 }, T0), "ชีวิต");
  r = await cs.run("b", { a: "state" }, T0); assert(!r.inZone && r.chips === 0 && r.warn.includes("ไม่เคยทำให้ใครรวย") && r.shop.length === C.SHOP.length);
  // ---- แลกของ → ชิป (หักค่าธรรมเนียม 10%)
  r = await cs.run("a", { a: "sell", id: "gold_watch", q: 2 }, T0); assert.strictEqual(r.got, Math.floor(120 * 2 * 0.9)); assert.strictEqual((await db.ref("inventory/a/gold_watch").get()).val().qty, 1);
  await rej(cs.run("a", { a: "sell", id: "gold_watch", q: 5 }, T0), "ของไม่พอ"); await rej(cs.run("a", { a: "sell", id: "sword", q: 1 }, T0), "แลกของนี้ไม่ได้"); await rej(cs.run("a", { a: "sell", id: "scrap", q: 0 }, T0), "แลกของนี้ไม่ได้");
  assert.strictEqual(await chips(), 216);
  // ---- เลือด
  r = await cs.run("a", { a: "blood", n: 10 }, T0); assert.strictEqual(r.got, 30); assert.strictEqual((await db.ref("users/a/hp").get()).val(), 90); await rej(cs.run("a", { a: "blood", n: 31 }, T0), "1–30");
  await cs.run("a", { a: "blood", n: 30 }, T0); await cs.run("a", { a: "blood", n: 20 }, T0); await rej(cs.run("a", { a: "blood", n: 1 }, T0), "บริจาคเลือด"); assert.strictEqual((await db.ref("users/a/hp").get()).val(), 40);
  assert.strictEqual(await chips(), 216 + 180);
  r = await cs.run("a", { a: "blood", n: 1 }, T0 + DAY); assert(r.hpToday === 1, "reset daily");
  // ---- ร้านแลก + โควตา
  r = await cs.run("a", { a: "buy", id: "bandage" }, T0 + DAY); assert.deepStrictEqual(r.bought, ["bandage", 1]); assert.strictEqual((await db.ref("inventory/a/bandage").get()).val().qty, 1); await rej(cs.run("a", { a: "buy", id: "nothing" }, T0 + DAY), "ไม่มีสินค้า");
  await rej(cs.run("a", { a: "buy", id: "deco_slotm" }, T0 + DAY), "ชิปไม่พอ"); await db.ref("casino/a/chips").set(20000);
  r = await cs.run("a", { a: "buy", id: "deco_slotm" }, T0 + DAY); assert.strictEqual((await db.ref("home/a/own/slotm").get()).val(), 1); await rej(cs.run("a", { a: "buy", id: "deco_slotm" }, T0 + DAY), "โควตา");
  await cs.run("a", { a: "buy", id: "theme_casino" }, T0 + DAY); assert.strictEqual((await db.ref("home/a/own/t_casino").get()).val(), 1); assert.strictEqual(await chips(), 20000 - 2500 - 6000);
  // ---- เกมทุกชนิด: ชิปต้องเปลี่ยนเท่า net เสมอ
  await db.ref("casino/a").update({ chips: 5000, day: null }); const T1 = T0 + 3 * DAY; let c = 5000;
  const chk = async (x) => { c += x.net; assert.strictEqual(await chips(), c, JSON.stringify(x)); };
  for (let i = 0; i < 25; i++) {
    await chk(await cs.run("a", { a: "slots", bet: 10 }, T1));
    await chk(await cs.run("a", { a: "roulette", bets: [{ t: "red", a: 5 }, { t: "num", n: 17, a: 5 }, { t: "d1", a: 5 }] }, T1));
    await chk(await cs.run("a", { a: "sicbo", bets: [{ t: "big", a: 5 }, { t: "num", n: 3, a: 5 }] }, T1));
    await chk(await cs.run("a", { a: "baccarat", bet: 10, side: ["player", "banker", "tie"][i % 3] }, T1));
    r = await cs.run("a", { a: "hilo", act: "start", bet: 10 }, T1); assert(r.started || r.games.hl); c -= 10; assert.strictEqual(await chips(), c); await rej(cs.run("a", { a: "hilo", act: "start", bet: 10 }, T1), "ค้าง");
    { const rk = (await cs.run("a", { a: "state" }, T1)).games.hl.rank; r = await cs.run("a", { a: "hilo", act: "guess", guess: rk === 1 ? "hi" : rk === 13 ? "lo" : i % 2 ? "hi" : "lo" }, T1); } c += r.ret; assert.strictEqual(await chips(), c); assert(r.net === r.ret - 10);
    r = await cs.run("a", { a: "blackjack", act: "start", bet: 10 }, T1); c -= 10;
    if (r.done) { c += r.ret; } else { await rej(cs.run("a", { a: "blackjack", act: "start", bet: 10 }, T1), "ค้าง"); if (i % 3 === 0) { r = await cs.run("a", { a: "blackjack", act: "double" }, T1); c -= 10; c += r.ret; } else { r = await cs.run("a", { a: "blackjack", act: "hit" }, T1); while (!r.done) r = await cs.run("a", { a: "blackjack", act: "stand" }, T1); c += r.ret; } }
    assert.strictEqual(await chips(), c, "bj " + JSON.stringify(r));
    r = await cs.run("a", { a: "poker", act: "deal", bet: 10 }, T1); c -= 10; assert.strictEqual(r.games.vp.hand.length, 5); r = await cs.run("a", { a: "poker", act: "draw", hold: [0, 1, 2] }, T1); c += r.ret; assert.strictEqual(await chips(), c, "vp " + JSON.stringify(r)); assert.strictEqual(r.hand.length, 5);
  }
  // ---- ตรวจอินพุตผิด
  await rej(cs.run("a", { a: "slots", bet: 101 }, T1), "สูงสุด"); await rej(cs.run("a", { a: "slots", bet: 4 }, T1), "ระหว่าง"); await rej(cs.run("a", { a: "slots", bet: 501 }, T1), "ระหว่าง"); await rej(cs.run("a", { a: "slots", bet: "x" }, T1), "ระหว่าง"); await rej(cs.run("a", { a: "baccarat", bet: 10, side: "x" }, T1), "ฝั่ง"); await rej(cs.run("a", { a: "roulette", bets: [] }, T1), "เดิมพัน");
  await rej(cs.run("a", { a: "hilo", act: "guess", guess: "hi" }, T1), "ยังไม่ได้เริ่ม"); await rej(cs.run("a", { a: "blackjack", act: "hit" }, T1), "ยังไม่ได้เริ่ม"); await rej(cs.run("a", { a: "poker", act: "draw" }, T1), "ยังไม่ได้แจก"); await rej(cs.run("a", { a: "xx" }, T1), "ไม่รู้จัก");
  await db.ref("casino/a/chips").set(7); await rej(cs.run("a", { a: "slots", bet: 10 }, T1), "ชิปไม่พอ");
  // ---- เกมค้างหมดอายุ = ริบ ไม่ติดค้าง
  await db.ref("casino/a").update({ chips: 100, g: null }); await cs.run("a", { a: "hilo", act: "start", bet: 50 }, T1); r = await cs.run("a", { a: "state" }, T1 + 11 * 60000); assert(!r.games.hl && r.chips === 50);
  // ---- เพดานขาดทุนรายวัน
  const T2 = T0 + 5 * DAY; await db.ref("casino/a").set({ chips: 100000 }); let hit = false;
  for (let i = 0; i < 40 && !hit; i++) { try { await cs.run("a", { a: "roulette", bets: [{ t: "num", n: 0, a: 500 }] }, T2); } catch (e) { assert(String(e.message).includes("เพดาน")); hit = true; } }
  assert(hit, "loss cap reached"); r = await cs.run("a", { a: "state" }, T2); assert(r.capLeft === 0 && r.lossToday >= 2000); await rej(cs.run("a", { a: "sell", id: "bread", q: 1 }, T2), "เพดาน"); r = await cs.run("a", { a: "state" }, T2 + DAY); assert(r.capLeft === 2000, "cap resets");
  // ---- พักตัว
  r = await cs.run("a", { a: "rest", h: 24 }, T2 + DAY); assert(r.lockLeft === DAY); await rej(cs.run("a", { a: "slots", bet: 10 }, T2 + DAY + H1), "พักไว้"); r = await cs.run("a", { a: "slots", bet: 10 }, T2 + 2 * DAY + 1); assert(r.ok);
  // ---- หนี้: กู้ / ใช้คืน / ครบกำหนด → ยึด + หัก HP + ห้ามกู้
  const T3 = T0 + 10 * DAY; await db.ref("casino/a").set({ chips: 0 }); await db.ref("users/a/hp").set(50); await db.ref("inventory/a").set({ gold_watch: { id: "gold_watch", qty: 1 }, scrap: { id: "scrap", qty: 20 } });
  await rej(cs.run("a", { a: "loan", n: 10 }, T3), "50–"); await rej(cs.run("a", { a: "loan", n: 501 }, T3), "50–"); r = await cs.run("a", { a: "loan", n: 400 }, T3); assert(r.debt.a === 500 && r.chips === 400); await rej(cs.run("a", { a: "loan", n: 100 }, T3), "หนี้ค้าง");
  r = await cs.run("a", { a: "repay", n: 100 }, T3 + H1); assert(r.debt.a === 400 && r.chips === 300);
  r = await cs.run("a", { a: "state" }, T3 + 49 * H1); assert(!r.debt && r.note[0].debt && r.noLoan > 0); assert.strictEqual((await db.ref("users/a/hp").get()).val(), 40);
  // ของที่ยึดต้องเป็นของมีค่าน้อยสุดก่อน (scrap ×20 = 40 ชิป ไม่พอ → ต่อด้วยนาฬิกา)
  assert.deepStrictEqual(r.note[0].seized.map((x) => x[0]), ["scrap", "gold_watch"]); assert.strictEqual((await db.ref("inventory/a/scrap").get()).val(), null);
  await rej(cs.run("a", { a: "loan", n: 100 }, T3 + 50 * H1), "ห้ามกู้"); r = await cs.run("a", { a: "loan", n: 100 }, T3 + 49 * H1 + 8 * DAY); assert(r.debt);
  // ---- GM
  await rej(cs.run("a", { a: "gmChips", n: 100 }, T0), "เฉพาะ"); r = await cs.run("gm", { a: "gmChips", to: "a", n: 1000 }, T0); assert(r.chips2 > 1000); r = await cs.run("gm", { a: "gmChips", to: "a", n: -999999 }, T0); assert.strictEqual(r.chips2, 0);
  r = await cs.run("gm", { a: "state" }, T0); assert(r.inZone, "gm อยู่นอกโซนก็เล่นได้"); await rej(cs.run("gm", { a: "gmChips", to: "a", n: 1e9 }, T0), "จำนวน");
  // ---- กดซ้อน: ขายพร้อมกัน ของไม่พอต้องไม่ติดลบ
  await db.ref("inventory/a").set({ gold_watch: { id: "gold_watch", qty: 1 } }); await db.ref("casino/a").set({ chips: 0 });
  const rs = await Promise.allSettled([1, 2, 3, 4].map(() => cs.run("a", { a: "sell", id: "gold_watch", q: 1 }, T0 + 20 * DAY))); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1); assert.strictEqual(await chips(), 108);
  console.log("casino OK, slot RTP", (rtp * 100).toFixed(2));
  process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
