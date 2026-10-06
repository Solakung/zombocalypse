// เพดานกำไรสุทธิรายวันของเกมเดี่ยว (WIN_CAP): จ่ายถูกตัดเมื่อเกินเพดาน + เล่นต่อไม่ได้เมื่อครบ + รีเซ็ตวันถัดไป
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=cwin" });
const db = admin.database(); const C = require(F + "casino");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), DAY = 86400000, CAP = C.WIN_CAP;
(async () => {
  assert(CAP >= 1000);
  await db.ref().set({ users: { a: { username: "a", faction: "human", hp: 80, zone: "casino" } } });
  const cs = C.makeCasino(db); let r;
  // ใกล้เพดาน (เหลือ 20): ชนะใหญ่ต้องถูกตัดให้กำไรสุทธิรวม = เพดานพอดี ไม่เกิน
  const di = Math.floor((T0 + 25200000) / DAY);
  let capped = 0;
  for (let i = 0; i < 400 && !capped; i++) {
    await db.ref("casino/a").set({ chips: 100000, day: { d: di, loss: 0, hp: 0, tw: CAP - 20, buy: {} } });
    r = await cs.run("a", { a: "slots", bet: 100 }, T0 + i * 20000);   // 7️⃣7️⃣7️⃣ ×400 / 💎 ×150 ฯลฯ หากออกจะเกินเพดาน
    const tw = (await db.ref("casino/a/day/tw").get()).val();
    assert(tw <= CAP, "tw over cap " + tw);
    if (r.mult >= 4) { assert(r.net <= 20, "net clipped " + JSON.stringify(r)); assert.strictEqual(tw, CAP); capped = 1; }
  }
  assert(capped, "never rolled a winning slot in 400 tries");
  // ครบเพดานแล้ว: เล่นไม่ได้ทุกเกม แต่ state/sell ยังใช้ได้
  await rej(cs.run("a", { a: "slots", bet: 10 }, T0 + 9e6), "เพดาน");
  r = await cs.run("a", { a: "state" }, T0 + 9e6); assert.strictEqual(r.winToday, CAP); assert.strictEqual(r.winCap, CAP);
  // วันถัดไปรีเซ็ต
  r = await cs.run("a", { a: "slots", bet: 10 }, T0 + DAY); assert(r.ok);
  assert((await db.ref("casino/a/day/tw").get()).val() <= 10 * 400, "new day tw");
  // โป๊กเกอร์รอยัลที่เดิมพัน 500 (×250 = 125,000) ถูกตัดที่เพดาน
  for (let i = 0; i < 1; i++) {
    await db.ref("casino/a").set({ chips: 1000, day: { d: di + 1, loss: 0, hp: 0, tw: 0, buy: {} }, g: { vp: { bet: 500, hand: [9, 10, 11, 12, 0], dk: [0, 1, 2, 3, 4], stage: "hold", t: T0 + DAY + 1000 } } });
    r = await cs.run("a", { a: "poker", act: "draw", hold: [0, 1, 2, 3, 4] }, T0 + DAY + 2000);   // ถือครบ 5 ใบ = รอยัลฟลัช (8..12 ♠ = 10 J Q K A? ตามการจัดลำดับของ vpEval)
    assert(r.kind === "royal" && r.net === CAP, "poker net clipped " + JSON.stringify(r));
    const tw = (await db.ref("casino/a/day/tw").get()).val(); assert(tw <= CAP, "poker tw " + tw);
  }
  console.log("CASINO WINCAP OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
