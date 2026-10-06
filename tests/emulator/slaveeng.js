const F = "/home/user/zombocalypse/functions/", assert = require("assert"); const S = require(F + "slave");
// unit
assert.deepStrictEqual(S.comboOf([0]), { n: 1, v: 0, top: 0 }); assert(S.comboOf([0, 1]).n === 2); assert(!S.comboOf([0, 4])); assert(!S.comboOf([0, 0])); assert(!S.comboOf([])); assert(!S.comboOf([0, 1, 2, 3, 3]));
assert(S.beats(S.comboOf([4]), S.comboOf([3]))); assert(S.beats(S.comboOf([3]), S.comboOf([2])), "spade>heart same rank"); assert(!S.beats(S.comboOf([4, 5]), S.comboOf([0])), "combo mismatch"); assert(S.beats(S.comboOf([48]), S.comboOf([47])), "2♣ > A♠");
assert(S.beats(S.comboOf([4, 5]), S.comboOf([0, 3]))); assert(!S.beats(S.comboOf([0, 1]), S.comboOf([0, 3])));
// simulate full games with random legal bots
const rnd = (n) => require("crypto").randomInt(n);
function legal(T, u) { // all legal plays
  const h = T.hands[u], out = []; const byV = {}; h.forEach((c) => (byV[c >> 2] = byV[c >> 2] || []).push(c));
  const subs = (arr, k) => { const r = []; const go = (i, cur) => { if (cur.length === k) return r.push(cur.slice()); for (let j = i; j < arr.length; j++) { cur.push(arr[j]); go(j + 1, cur); cur.pop(); } }; go(0, []); return r; };
  for (const v of Object.values(byV)) for (let k = 1; k <= v.length; k++) for (const s of subs(v, k)) { const cb = S.comboOf(s); if (S.beats(cb, T.last && S.comboOf(T.last.c)) && (!T.first || s.includes(T.fc))) out.push(s); }
  return out;
}
let games = 0, tot = 0;
for (let g = 0; g < 1500; g++) {
  const n = 3 + (g % 2), seats = Array.from({ length: n }, (_, i) => "u" + i), T = S.newTable("u0", "a", 50, n, 0); T.seats = seats; seats.forEach((u) => { T.nm[u] = u; T.pts[u] = 0; });
  let now = 1000; S.startRound(T, now, rnd); let steps = 0;
  while (T.st !== "end") {
    assert(++steps < 4000, "stuck"); assert(["play", "xchg"].includes(T.st));
    // card conservation
    const all = [].concat(...seats.map((u) => T.hands[u])), played = 0; assert.strictEqual(new Set(all).size, all.length);
    const u = T.turn; assert(seats.includes(u));
    if (T.st === "xchg") { assert(!S.giveBack(T, u, T.hands[u].slice(0, 2).reverse(), now)); continue; }
    const L = legal(T, u); now += 1000;
    if (L.length && (!T.last || Math.random() < 0.8 || T.first)) { assert(!S.playCards(T, u, L[rnd(L.length)], now)); }
    else if (T.last) assert(!S.passTurn(T, u, now)); else assert(false, "leader no legal play");
    for (const x of seats) assert(T.hands[x].length >= 0);
  }
  assert.strictEqual(T.rd, 3); const F2 = S.finalize(T); assert.strictEqual(F2.rank.reduce((s, r) => s + r.pay, 0) + F2.fee, 50 * n); assert(F2.fee >= Math.floor(50 * n * 0.1)); assert.strictEqual(Object.values(T.pts).reduce((a, b) => a + b, 0), 0, "points zero-sum");
  assert.strictEqual(T.prev.length, n); games++;
}
// timeouts / dq with all-auto
{ const seats = ["a", "b", "c"], T = S.newTable("a", "a", 10, 3, 0); T.seats = seats; seats.forEach((u) => { T.nm[u] = u; T.pts[u] = 0; }); S.startRound(T, 0); seats.forEach((u) => (T.dq[u] = true)); S.runAuto(T, 0); assert.strictEqual(T.st, "end"); const R = S.finalize(T); assert.strictEqual(R.rank.reduce((s, r) => s + r.pay, 0) + R.fee, 30); }
{ const seats = ["a", "b", "c", "d"], T = S.newTable("a", "a", 10, 4, 0); T.seats = seats; seats.forEach((u) => { T.nm[u] = u; T.pts[u] = 0; }); S.startRound(T, 0); const d = S.expire(T, 24 * 3600 * 1000); assert.strictEqual(T.st, "end", "idle table runs to end"); assert.strictEqual(d.length, 4); }
// 2 ends trick, first-lead rule
{ const T = S.newTable("a", "a", 10, 3, 0); T.seats = ["a", "b", "c"]; T.hands = { a: [0, 40, 47], b: [5, 48], c: [9, 20, 30] }; T.st = "play"; T.turn = "a"; T.first = true; T.fc = 0; T.rd = 1; ["a", "b", "c"].forEach((u) => { T.nm[u] = u; T.pts[u] = 0; });
  assert(S.playCards(T, "a", [40], 1), "must include fc"); assert(S.playCards(T, "b", [5], 1), "not b's turn"); assert(!S.playCards(T, "a", [0], 1)); assert.strictEqual(T.turn, "b");
  assert(!S.playCards(T, "b", [48], 1)); assert.strictEqual(T.turn, "b", "2 ends trick; b leads again"); assert.strictEqual(T.last, null);
}
console.log("engine OK games", games);
