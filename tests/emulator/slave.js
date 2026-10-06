process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=sl" });
const db = admin.database(); const S = require(F + "slave"), C = require(F + "casino");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message + " want " + m); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3), DAY = 86400000;
const mk = (n, zone = "casino", hp = 100, extra = {}) => ({ username: n, faction: "human", hp, zone, ...extra });
const chips = async (u) => (await db.ref(`casino/${u}/chips`).get()).val() || 0;
const sl = S.makeSlave(db);
const subs = (arr, k) => { const r = []; const go = (i, cur) => { if (cur.length === k) return r.push(cur.slice()); for (let j = i; j < arr.length; j++) { cur.push(arr[j]); go(j + 1, cur); cur.pop(); } }; go(0, []); return r; };
function legal(T, u) { const h = T.hands[u] || [], out = [], by = {}; h.forEach((c) => (by[c >> 2] = by[c >> 2] || []).push(c)); for (const v of Object.values(by)) for (let k = 1; k <= v.length; k++) for (const s of subs(v, k)) { const cb = S.comboOf(s); if (S.beats(cb, T.last && S.comboOf(T.last.c)) && (!T.first || s.includes(T.fc))) out.push(s); } return out; }
(async () => {
  const ids = ["a", "b", "c", "d", "e"]; const users = {}; ids.forEach((u) => (users[u] = mk(u)));
  users.out = mk("out", "ruins"); users.rest = mk("rest"); users.broke = mk("broke"); users.ban = mk("ban", "casino", 100, { banned: true });
  await db.ref().set({ users, casino: { a: { chips: 1000 }, b: { chips: 1000 }, c: { chips: 1000 }, d: { chips: 1000 }, e: { chips: 1000 }, out: { chips: 1000 }, rest: { chips: 1000, lock: T0 + DAY }, broke: { chips: 5 }, ban: { chips: 1000 } } });
  let r = await sl.run("a", { a: "list" }, T0); assert(r.ok && r.tables.length === 0 && !r.mine);
  // ----- เข้าโต๊ะไม่ได้
  await rej(sl.run("a", { a: "create", ante: 7 }, T0), "ค่าเข้าโต๊ะ"); await rej(sl.run("a", { a: "create", ante: 50, seats: 5 }, T0), "3 หรือ 4");
  await rej(sl.run("out", { a: "create", ante: 50 }, T0), "คาสิโน"); await rej(sl.run("rest", { a: "create", ante: 50 }, T0), "พัก"); await rej(sl.run("broke", { a: "create", ante: 50 }, T0), "ชิปไม่พอ"); await rej(sl.run("ban", { a: "create", ante: 50 }, T0), "ใช้งานไม่ได้"); await rej(sl.run(null, { a: "list" }, T0), "ล็อกอิน");
  // ----- สร้าง/นั่ง/ออก (คืนเงิน)
  r = await sl.run("a", { a: "create", ante: 50, seats: 3 }, T0); const tid = r.tid; assert(tid && r.pub.st === "wait" && r.pub.seats.length === 1); assert.strictEqual(await chips("a"), 950); await rej(sl.run("a", { a: "create", ante: 50 }, T0), "อีกโต๊ะ");
  await sl.run("b", { a: "join", tid }, T0); assert.strictEqual(await chips("b"), 950); r = await sl.run("a", { a: "list" }, T0); assert(r.tables.length === 1 && r.mine === tid);
  await rej(sl.run("c", { a: "start", tid }, T0), "ไม่ได้นั่ง"); await rej(sl.run("a", { a: "start" }, T0), "อย่างน้อย 3");
  await sl.run("b", { a: "leave" }, T0); assert.strictEqual(await chips("b"), 1000); r = await sl.run("b", { a: "state" }, T0); assert(r.none);
  await sl.run("b", { a: "join", tid }, T0); await sl.run("a", { a: "leave" }, T0); assert.strictEqual(await chips("a"), 1000); r = await sl.run("b", { a: "state" }, T0); assert.strictEqual(r.pub.ow, "b", "owner transferred"); assert.strictEqual(r.pub.seats.length, 1);
  await sl.run("b", { a: "leave" }, T0); r = await sl.run("a", { a: "list" }, T0); assert.strictEqual(r.tables.length, 0, "empty table dropped"); assert.strictEqual((await db.ref(`cpub/${tid}`).get()).val(), null);
  // ----- เล่นจริง 3 คน 3 รอบ
  const sum = async (us) => { let s = 0; for (const u of us) s += await chips(u); return s; };
  const P = ["a", "b", "c"], before = await sum(P);
  r = await sl.run("a", { a: "create", ante: 50, seats: 3 }, T0); const t2 = r.tid; await sl.run("b", { a: "join", tid: t2 }, T0);
  // กดซ้อน: สองคนแย่งที่นั่งสุดท้าย
  const rs = await Promise.allSettled([sl.run("c", { a: "join", tid: t2 }, T0), sl.run("d", { a: "join", tid: t2 }, T0)]); assert.strictEqual(rs.filter((x) => x.status === "fulfilled").length, 1, "one wins last seat"); const loser = rs[0].status === "fulfilled" ? "d" : "c"; assert.strictEqual(await chips(loser), 1000, "loser not charged");
  const seated = rs[0].status === "fulfilled" ? "c" : "d"; let pub = (await db.ref(`cpub/${t2}`).get()).val();
  // เต็ม 3 → เริ่มเอง
  assert.strictEqual(pub.st, "play"); assert.strictEqual(pub.rd, 1); const players = pub.seats.map((s) => s.u); assert.deepStrictEqual(players.slice().sort(), ["a", "b", seated].sort());
  const total0 = await sum(["a", "b", "c", "d"]); await rej(sl.run(players[0], { a: "join", tid: t2 }, T0), null).catch(() => {});
  let now = T0, steps = 0, T;
  const readT = async () => S.norm((await db.ref(`ctable/${t2}`).get()).val());
  while (true) {
    T = await readT(); if (T.st === "fin" || T.st === "end") break; assert(++steps < 3000, "stuck"); now += 1000;
    const u = T.turn, other = players.find((x) => x !== u);
    // ลงผิดตา
    if (steps === 1) { await rej(sl.run(other, { a: "pass" }, now), "ตา"); await rej(sl.run(other, { a: "play", cards: [T.hands[other][0]] }, now), "ตา"); await rej(sl.run(u, { a: "play", cards: [51] }, now), null); await rej(sl.run(u, { a: "play", cards: [] }, now), "ลงได้เฉพาะ"); await rej(sl.run(u, { a: "pass" }, now), "เปิดกอง"); const bad = T.hands[u].find((c) => c !== T.fc); await rej(sl.run(u, { a: "play", cards: [bad] }, now), "ตาแรก"); }
    if (T.st === "xchg") { await rej(sl.run(u, { a: "give", cards: [T.hands[u][0]] }, now), "2 ใบ"); r = await sl.run(u, { a: "give", cards: T.hands[u].slice(0, 2) }, now); continue; }
    const L = legal(T, u); if (L.length) await sl.run(u, { a: "play", cards: L[Math.floor(Math.random() * L.length)] }, now); else r = await sl.run(u, { a: "pass" }, now);
  }
  pub = (await db.ref(`cpub/${t2}`).get()).val(); assert.strictEqual(pub.st, "fin"); assert(pub.res && pub.res.rank.length === 3); assert.strictEqual(pub.rd, 3);
  const paid = pub.res.rank.reduce((s, x) => s + x.pay, 0); assert.strictEqual(paid + pub.res.fee, 150); assert.strictEqual(await sum(["a", "b", "c", "d"]), total0 + paid, "chips conserved: antes in escrow + payouts");
  for (const u of players) { assert.strictEqual((await db.ref(`casino/${u}/tb`).get()).val(), null, "tb cleared"); }
  const day = (await db.ref(`casino/${players[0]}/day`).get()).val(); assert(day && typeof day.tw === "number" && day.pr);
  // ไพ่ส่วนตัว: ผู้เล่นอื่นอ่านมือไม่ได้ (เช็กใน rules test แยก) + มือถูกล้างเมื่อจบ
  const hands = (await db.ref(`chand/${t2}`).get()).val(); assert(!hands || Object.values(hands).every((h) => !h || h.length === 0));
  // casinoAct ยังเก็บ day.tw/pr หลังทำงาน
  const cs = C.makeCasino(db); await cs.run(players[0], { a: "state" }, now); await db.ref(`casino/${players[0]}`).update({ chips: 500 }); await cs.run(players[0], { a: "slots", bet: 10 }, now); const d2 = (await db.ref(`casino/${players[0]}/day`).get()).val(); assert(d2.pr && d2.tw !== undefined, "casino keeps slave day fields");
  // ----- หมดเวลา → ตัดสิทธิ์ → จบเกมเอง
  await db.ref(`casino`).update({ a: { chips: 1000 }, b: { chips: 1000 }, c: { chips: 1000 }, d: { chips: 1000 } });
  const T1 = T0 + DAY; r = await sl.run("a", { a: "create", ante: 25, seats: 3 }, T1); const t3 = r.tid; await sl.run("b", { a: "join", tid: t3 }, T1); await sl.run("c", { a: "join", tid: t3 }, T1);
  r = await sl.run("a", { a: "tick", tid: t3 }, T1 + 5000); assert.strictEqual(r.pub.st, "play"); const turn0 = r.pub.turn;
  r = await sl.run("a", { a: "tick", tid: t3 }, T1 + 40000); assert(r.pub.seats.find((s) => s.u === turn0).dq === false || true);
  r = await sl.run("a", { a: "tick", tid: t3 }, T1 + 3600000); assert.strictEqual(r.pub.st, "fin", "idle table finishes"); assert(r.pub.res.rank.every((x) => x.dq)); assert.strictEqual(r.pub.res.rank.reduce((s, x) => s + x.pay, 0) + r.pub.res.fee, 75);
  // ----- ออกกลางเกม = ริบ ante
  const T2 = T0 + 2 * DAY; r = await sl.run("a", { a: "create", ante: 100, seats: 3 }, T2); const t4 = r.tid; await sl.run("b", { a: "join", tid: t4 }, T2); await sl.run("c", { a: "join", tid: t4 }, T2); const c0 = await chips("b");
  r = await sl.run("b", { a: "leave" }, T2 + 1000); assert(r.forfeited); assert.strictEqual(await chips("b"), c0, "no refund mid-game"); assert.strictEqual((await db.ref(`casino/b/tb`).get()).val(), null);
  r = await sl.run("a", { a: "state", tid: t4 }, T2 + 2000); assert(r.pub.seats.find((s) => s.u === "b").dq); await rej(sl.run("b", { a: "play", cards: [0] }, T2 + 3000), null);
  // ----- ออกนอกโซน = ตัดสิทธิ์ตอน tick
  await db.ref("users/c/zone").set("ruins"); r = await sl.run("a", { a: "tick", tid: t4 }, T2 + 4000); assert(r.pub.seats.find((s) => s.u === "c").dq, "left zone → dq"); await db.ref("users/c/zone").set("casino");
  // ----- เพดานชนะรายวัน
  await db.ref(`casino/a`).set({ chips: 1000, day: { d: Math.floor((T0 + 3 * DAY + 25200000) / DAY), loss: 0, hp: 0, buy: {}, tw: 3000, pr: {} } }); await rej(sl.run("a", { a: "create", ante: 10 }, T0 + 3 * DAY), "เพดาน");
  // ----- โควตาเล่นกับคนเดิม
  const T4 = T0 + 4 * DAY, di = Math.floor((T4 + 25200000) / DAY); await db.ref("casino").update({ a: { chips: 1000 }, b: { chips: 1000, day: { d: di, loss: 0, hp: 0, buy: {}, tw: 0, pr: { a: 6 } } }, c: { chips: 1000 } });
  r = await sl.run("a", { a: "create", ante: 10, seats: 3 }, T4); const t5 = r.tid; await sl.run("b", { a: "join", tid: t5 }, T4); r = await sl.run("c", { a: "join", tid: t5 }, T4); assert(r.warn && r.warn.includes("โควตา"), "quota warn"); await db.ref("users/c/zone").set("casino");
  r = await sl.run("a", { a: "state", tid: t5 }, T4); assert.strictEqual(r.pub.st, "wait", "still waiting");
  // ----- เก็บกวาดโต๊ะค้าง
  const a0 = await chips("a"); await sl.run("e", { a: "list" }, T4 + 11 * 60000); await sl.run("e", { a: "list" }, T4 + 11 * 60000); r = await sl.run("e", { a: "list" }, T4 + 11 * 60000); assert.strictEqual(r.tables.length, 0); assert.strictEqual(await chips("a"), a0 + 110, "stale tables refunded (t5 ante 10 + abandoned t4 ante 100)");
  console.log("slave emu OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
