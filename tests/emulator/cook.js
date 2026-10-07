// 🍳 พ่อครัว/มินิเกมทำอาหาร (functions/cook.js): ปิด/เปิด tune, วัตถุดิบ, ตารางจังหวะ, ตัดสินคะแนน, คุณภาพ→บัฟ, ขั้นฝีมือ, กระเป๋าเต็ม, ใช้ครั้งเดียว
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/", assert = require("assert");
const admin = require(F + "functions/node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=cook" });
const db = admin.database(); const C = require(F + "functions/cook");
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const ck = C.makeCook(db, rnd);
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
const user = (x = {}) => ({ username: "a", faction: "human", role: "player", hp: 100, zone: "safe", ...x });
const inv = (x = {}) => ({ fish: { id: "fish", qty: 5 }, herb_bundle: { id: "herb_bundle", qty: 5 }, canned_food: { id: "canned_food", qty: 5 }, water: { id: "water", qty: 5 }, bread: { id: "bread", qty: 5 }, fruit: { id: "fruit", qty: 5 }, ...x });
const set = (x = {}) => db.ref().set({ users: { a: user(x.u), z: user({ faction: "zombie" }) }, inventory: { a: inv(x.inv) }, tune: { cook_on: 1, ...(x.tune || {}) }, ...(x.cook ? { cook: { a: x.cook } } : {}) });
// เล่นให้ทุกจังหวะ: offset = ความคลาดของทุกการกด (มิลลิวินาที) • คืน {presses, at เวลาส่ง}
const play = (st, off) => ({ presses: st.steps.map((s) => s.at.map((b) => st.t0 + b + off)), at: st.t0 + st.end + 100 });
(async () => {
  // ---- ฟังก์ชันล้วน
  assert.deepStrictEqual([0, 3, 12, 30, 70, 150, 999].map(C.rankOf), [0, 1, 2, 3, 4, 5, 5]);
  assert.deepStrictEqual([0, 0.29, 0.3, 0.6, 0.84, 0.85, 1].map(C.tierOf), [0, 0, 1, 2, 2, 3, 3]);
  assert.deepStrictEqual(C.statsOf(C.DISHES.bbq_fish, 0, true), {}); assert.deepStrictEqual(C.statsOf(C.DISHES.bbq_fish, 1, false), { str: 1 });
  assert.deepStrictEqual(C.statsOf(C.DISHES.bbq_fish, 3, false), { str: 3, st: 2 }); assert.deepStrictEqual(C.statsOf(C.DISHES.bbq_fish, 3, true), { str: 4, st: 2 });
  const steps = [{ k: "chop", at: [1000, 2000] }, { k: "fry", at: [4000] }];
  let j = C.judge(0, steps, [[1000, 2000], [4000]], 9000, 0); assert.strictEqual(j.q, 1); assert.strictEqual(j.flawless, true); assert.deepStrictEqual(j.per, [1, 1]);
  j = C.judge(0, steps, [[1100, 2000], [4000]], 9000, 0); assert.strictEqual(j.flawless, false); assert.strictEqual(Math.round(j.q * 1000), Math.round(((0.7 + 1 + 1) / 3) * 1000));   // 100ms = ดี
  j = C.judge(0, steps, [[1000, 2400], [4200]], 9000, 0); assert.strictEqual(Math.round(j.q * 1000), Math.round(((1 + 0 + 0.4) / 3) * 1000));     // 400ms = พลาด • 200ms = พอใช้
  assert.strictEqual(C.judge(0, steps, [[], []], 9000, 0).q, 0); assert.strictEqual(C.judge(0, steps, null, 9000, 0).q, 0);
  assert.strictEqual(C.judge(0, steps, [[100, 150], [200]], 9000, 0).q, 0);                                  // ก่อน t0+250 ไม่นับ
  assert.strictEqual(C.judge(0, steps, [[1000, 2000], [20000]], 9000, 0).q, (1 + 1) / 3);                    // เวลาในอนาคตไม่นับ
  assert.strictEqual(C.judge(0, steps, [[1000, 1000], [4000]], 9000, 0).q, (1 + 0 + 1) / 3);                 // กดซ้ำจังหวะเดียวไม่ได้คะแนนสองจังหวะ
  assert(C.judge(0, steps, [[1110, 2110], [4110]], 9000, 5).q === 1 && C.judge(0, steps, [[1110, 2110], [4110]], 9000, 0).q < 1, "ขั้นฝีมือให้ช่วงเวลากว้างขึ้น");

  // ---- ปิดอยู่
  await set({ tune: { cook_on: 0 } }); assert.deepStrictEqual(await ck.run("a", { a: "start", dish: "bbq_fish" }, T0), { ok: true, on: false });
  let r = await ck.run("a", { a: "state" }, T0); assert.strictEqual(r.on, false); assert.strictEqual(r.rank, 0); assert.strictEqual(r.dishes.length, 5); assert.strictEqual(r.dishes.find((d) => d.id === "chef_special").locked, true);
  await rej(ck.run(null, { a: "state" }, T0), "ล็อกอิน"); await set(); await rej(ck.run("a", { a: "zz" }, T0), "ไม่รู้จัก");
  // ---- เงื่อนไขเริ่ม
  await set({ u: { zone: "forest" } }); await rej(ck.run("a", { a: "start", dish: "bbq_fish" }, T0), "Safe Zone");
  await set({ u: { hp: 0 } }); await rej(ck.run("a", { a: "start", dish: "bbq_fish" }, T0), "มีชีวิต");
  await set(); await rej(ck.run("z", { a: "start", dish: "bbq_fish" }, T0), "ซอมบี้"); await rej(ck.run("a", { a: "start", dish: "nope" }, T0), "ไม่มีเมนู");
  await rej(ck.run("a", { a: "start", dish: "chef_special" }, T0), "ฝีมือขั้น 3"); await rej(ck.run("a", { a: "start", dish: "herb_soup" }, T0), "ฝีมือขั้น 1");
  await set({ inv: { herb_bundle: null } }); await rej(ck.run("a", { a: "start", dish: "bbq_fish" }, T0), "วัตถุดิบไม่พอ"); assert.strictEqual((await db.ref("inventory/a/fish/qty").get()).val(), 5, "คืนวัตถุดิบที่หักไปแล้ว");
  await rej(ck.run("a", { a: "done", presses: [] }, T0), "ไม่มีจาน");
  // ---- เริ่ม: หักวัตถุดิบ + ออกโจทย์ 2–3 ขั้น จังหวะเรียงตามเวลา อยู่ในชุดเทคนิคของเมนู
  await set(); r = await ck.run("a", { a: "start", dish: "bbq_fish" }, T0);
  assert.strictEqual((await db.ref("inventory/a/fish/qty").get()).val(), 4); assert.strictEqual((await db.ref("inventory/a/herb_bundle/qty").get()).val(), 4);
  assert(r.steps.length >= 2 && r.steps.length <= 3); assert.strictEqual(new Set(r.steps.map((s) => s.k)).size, r.steps.length);
  r.steps.forEach((s) => { assert(C.DISHES.bbq_fish.pool.includes(s.k)); assert.strictEqual(s.at.length, C.TECH[s.k].beats); assert(s.at.every((x, i) => i === 0 || x > s.at[i - 1])); assert(s.at[0] >= 2200); });
  assert(r.steps.every((s, i) => i === 0 || s.at[0] > r.steps[i - 1].at.slice(-1)[0] + 1000), "แต่ละขั้นเว้นช่วง"); assert.strictEqual(r.end, r.steps.slice(-1)[0].at.slice(-1)[0] + 600);
  const st = r; await rej(ck.run("a", { a: "done", presses: [] }, T0 + 3000), "ยังทำไม่เสร็จ");            // ส่งก่อนจบโจทย์ไม่ได้
  // ---- เพอร์เฟกต์: เมนูบัฟสูงสุด
  r = await ck.run("a", { a: "done", presses: play(st, 0).presses }, T0 + st.end + 100);
  assert.strictEqual(r.tier, 3); assert.strictEqual(r.flawless, true); assert.strictEqual(r.stats.str, 4); assert.strictEqual(r.stats.st, 2); assert.strictEqual(r.bmin, 12 + 18); assert.strictEqual(r.n, 1);
  const slot = (await db.ref("inventory/a").get()).val(), key = Object.keys(slot).find((k) => k.startsWith("ck_")); assert(key, "มีช่องอาหาร");
  const it = slot[key]; assert.strictEqual(it.id, "custom_food"); assert.strictEqual(it.type, "consumable"); assert.strictEqual(it.b_str, 4); assert.strictEqual(it.b_st, 2); assert.strictEqual(it.bmin, 30); assert.strictEqual(it.food, 39); assert(!it.heal, "ไม่ฟื้น HP"); assert(/เพอร์เฟกต์/.test(it.name));
  // กินอาหารที่ทำได้ผ่าน use.js เดิม → ได้บัฟสเตตัสตามที่ปรุง (ไม่ฟื้น HP)
  { const U = require(F + "functions/use").makeUse(db, admin); await db.ref("users/a").update({ hp: 60, food: 50, foodTs: T0, water: 50, waterTs: T0, stamina: 50, staminaTs: T0 }); await db.ref("stats/a").set({ str: 3, hp: 3, st: 3, regen: 3 });
    const ur = await U.run("a", { slot: key }, T0 + st.end + 1000); assert(ur.ok, "use ok"); const bf = (await db.ref("buffs/a").get()).val(); assert.strictEqual(bf.str, 4); assert.strictEqual(bf.st, 2); assert.strictEqual(bf.mins, 30); assert.strictEqual((await db.ref("users/a/hp").get()).val(), 60, "ไม่ฟื้น HP"); assert.strictEqual((await db.ref(`inventory/a/${key}`).get()).val(), null);
    await db.ref("buffs/a").remove(); await db.ref(`inventory/a/${key}`).set(it); }
  assert.strictEqual((await db.ref("cook/a/ch").get()).val(), null); await rej(ck.run("a", { a: "done", presses: play(st, 0).presses }, T0 + st.end + 200), "ไม่มีจาน");   // ใช้ครั้งเดียว
  assert.strictEqual((await db.ref("cook/a/p").get()).val(), 1);
  // ---- กดเลอะ/ไม่กดเลย → ยังได้จาน (ระดับ 0 ไม่มีบัฟ)
  r = await ck.run("a", { a: "start", dish: "hot_stew" }, T0 + 100000); const t1 = r;
  r = await ck.run("a", { a: "done", presses: [] }, T0 + 100000 + t1.end + 50); assert.strictEqual(r.tier, 0); assert.deepStrictEqual(r.stats, {}); assert.strictEqual(r.bmin, 0); assert.strictEqual(r.n, 2);
  const s0 = (await db.ref("inventory/a").get()).val(), k0 = Object.keys(s0).find((k) => k.startsWith("ck_hot_stew_0")); assert(k0); assert(!s0[k0].bmin && !s0[k0].b_hp); assert.strictEqual(s0[k0].food, 35); assert.strictEqual(s0[k0].water, 20);
  // ---- ทำช้าเกิน → จานเสีย (วัตถุดิบไม่คืน)
  r = await ck.run("a", { a: "start", dish: "fried_bread" }, T0 + 200000); await rej(ck.run("a", { a: "done", presses: [] }, T0 + 200000 + r.end + 30000), "ช้าเกินไป"); assert.strictEqual((await db.ref("cook/a/ch").get()).val(), null);
  // ---- ผลคลาดเคลื่อน 120ms ทุกจังหวะ = "ดี" (.7) → เลิศรส (ระดับ 2): สเตตัสหลัก 2 รอง 1
  await set(); r = await ck.run("a", { a: "start", dish: "fried_bread" }, T0); r = await ck.run("a", { a: "done", presses: play(r, 120).presses }, T0 + r.end + 100);
  assert.strictEqual(r.tier, 2); assert.deepStrictEqual(r.stats, { st: 2, regen: 1 }); assert.strictEqual(r.flawless, false);
  // ---- กดซ้อนซ้ำจำนวนมาก (สแปม) ไม่ได้เปรียบ: กดทุก 60ms ตลอดโจทย์ → มีคะแนนได้ไม่เกินจำนวนจังหวะ
  await set(); r = await ck.run("a", { a: "start", dish: "bbq_fish" }, T0); const spam = r.steps.map((s) => { const a = []; for (let x = 300; x < s.at[s.at.length - 1] + 500; x += 60) a.push(r.t0 + x); return a; });
  const jj = C.judge(r.t0, r.steps, spam, r.t0 + r.end + 100, 0); assert(jj.q <= 1); assert(spam[0].length > r.steps[0].at.length + 4); // เกินขีดจำกัดต่อขั้น ถูกตัดทิ้ง
  // ---- ฝีมือขั้น: ขั้น 3 ปลดเมนูพิเศษ (4 เทคนิค-ขั้น = 3 ขั้นตอนเสมอ) • ขั้นสูงให้ช่วงเวลากว้าง/บัฟนาน/ได้ 2 จาน
  await set({ cook: { n: 30, p: 0 } }); r = await ck.run("a", { a: "state" }, T0); assert.strictEqual(r.rank, 3); assert.strictEqual(r.title, "หัวหน้าครัว"); assert.strictEqual(r.next, 70);
  r = await ck.run("a", { a: "start", dish: "chef_special" }, T0); assert.strictEqual(r.steps.length, 3); assert.strictEqual((await db.ref("inventory/a/water/qty").get()).val(), 4); assert.strictEqual((await db.ref("inventory/a/canned_food/qty").get()).val(), 4);
  const cs = r; r = await ck.run("a", { a: "done", presses: play(cs, 0).presses }, T0 + cs.end + 100); assert.strictEqual(r.tier, 3); assert.strictEqual(r.bmin, 12 + 18 + 6); assert.strictEqual(r.n, 31); assert.deepStrictEqual(r.stats, { str: 4, hp: 2 });
  assert(r.qty === 1 || r.qty === 2);
  // ขึ้นขั้น
  await set({ cook: { n: 69, p: 0 } }); r = await ck.run("a", { a: "start", dish: "bbq_fish" }, T0); r = await ck.run("a", { a: "done", presses: [] }, T0 + r.end + 50); assert.strictEqual(r.rankUp, true); assert.strictEqual(r.rank, 4);
  // ---- กระเป๋าเต็มช่องเดิม (99) → ไม่หายและรับใหม่ได้ภายหลัง
  await set({ inv: { ck_bbq_fish_3_30: { id: "custom_food", type: "consumable", name: "ปลาเผาสมุนไพร (เพอร์เฟกต์)", icon: "🍢", food: 39, b_str: 4, b_st: 2, bmin: 30, qty: 99 } } });
  r = await ck.run("a", { a: "start", dish: "bbq_fish" }, T0); const full = r; await rej(ck.run("a", { a: "done", presses: play(full, 0).presses }, T0 + full.end + 100), "กระเป๋าเต็ม");
  assert.notStrictEqual((await db.ref("cook/a/ch").get()).val(), null, "โจทย์ยังอยู่"); assert.strictEqual((await db.ref("cook/a/n").get()).val(), null);
  await db.ref("inventory/a/ck_bbq_fish_3_30/qty").set(10); r = await ck.run("a", { a: "done", presses: play(full, 0).presses }, T0 + full.end + 200); assert.strictEqual(r.tier, 3); assert.strictEqual((await db.ref("inventory/a/ck_bbq_fish_3_30/qty").get()).val(), 11);
  console.log("cook OK"); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
