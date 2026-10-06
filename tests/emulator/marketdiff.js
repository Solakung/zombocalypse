// Differential test for the market: OLD client multi-path update under OLD rules vs NEW Cloud Function logic (admin).
// usage: node marketdiff.js rules_old.json
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs");
const FN = "/home/user/zombocalypse/functions";
const admin = require(FN + "/node_modules/firebase-admin");
const { makeMarket, bmBuildRound, BM_CFG, MKT_IDS, MKT_WEAP } = require(FN + "/market.js");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const oldRules = fs.readFileSync(process.argv[2] || "rules_old.json", "utf8");
const NS = "demo-zombo";
admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), sys = makeMarket(adb), SV = admin.database.ServerValue.TIMESTAMP;
const U = "u1", V = "u2", NOW0 = Date.now();
const user = (o = {}) => ({ username: "tester", faction: "human", role: "player", banned: false, zone: "safe", stamina: 100, staminaTs: Date.now(), hp: 100, food: 100, water: 100, foodTs: Date.now(), waterTs: Date.now(), ...o });
const inv = (o) => { const r = {}; for (const [id, q] of Object.entries(o)) r[id] = typeof q === "object" ? { id, ...q } : { id, qty: q }; return r; };
const norm = (o) => JSON.parse(JSON.stringify(o ?? null));
const MAXQ = 99;
const have = (S, id) => ((S.inventory || {})[id]?.qty) || 0;
const mktInt = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= MAXQ ? n : 0; };
function debit(S, u, uid, id, qty) { const left = have(S, id) - qty, base = `inventory/${uid}/${id}`; if (left > 0) u[base + "/qty"] = left; else u[base] = null; }
function credit(S, u, uid, id, qty) { const h = have(S, id), base = `inventory/${uid}/${id}`; if (h > 0) u[base + "/qty"] = h + qty; else u[base] = { id, qty }; }
const wantsOf = (l) => [l?.want, l?.want2, l?.want3].filter((w) => w && w.id);
const wk = ["", "b", "c"];

// ---- OLD client behaviour (copied from script.js) ----
const old = {
  sell(d, S) {   // d: {g, gq, w, wq, x}
    const p = S.user, isW = String(d.g).startsWith("w:"), wslot = isW ? d.g.slice(2) : null, wit = isW ? (S.inventory || {})[wslot] : null;
    const gq = isW ? 1 : mktInt(d.gq), list = [{ id: d.w, q: d.wq }, ...(d.x || [])].slice(0, 3);
    if (!d.g || !gq) return null;
    if (isW && (!wit || !MKT_WEAP.includes(wit.id) || !(wit.dur > 0))) return null;
    const ws = [];
    for (const x of list) { const q = mktInt(x.q); if (!x.id || !q) return null; if (!isW && x.id === d.g) return null; if (ws.some((w) => w.id === x.id)) return null; ws.push({ id: x.id, qty: q }); }
    if (!isW && have(S, d.g) < gq) return null;
    const n = [1, 2, 3].find((i) => !(S.market?.[p.faction] || {})[`${U}_${i}`]); if (!n) return null;
    const L = { seller: U, sellerName: p.username, give: isW ? { id: wit.id, qty: 1, dur: wit.dur, slot: wslot, ...(wit.maxDur ? { maxDur: wit.maxDur } : {}) } : { id: d.g, qty: gq }, want: ws[0], ts: SV };
    if (ws[1]) L.want2 = ws[1]; if (ws[2]) L.want3 = ws[2];
    const u = { [`market/${p.faction}/${U}_${n}`]: L };
    if (isW) { u[`inventory/${U}/${wslot}`] = null; if (p.equipped === wslot) u[`users/${U}/equipped`] = null; } else debit(S, u, U, d.g, gq);
    return u;
  },
  buy(d, S) {
    const p = S.user, l = (S.market?.[p.faction] || {})[d.lid]; if (!l) return null; if (l.seller === U) return null;
    const ws = wantsOf(l); if (ws.find((w) => have(S, w.id) < w.qty)) return null;
    if (!l.give.slot && have(S, l.give.id) + l.give.qty > MAXQ) return null;
    const u = { [`market/${p.faction}/${d.lid}`]: null, [`marketTx/${U}`]: { op: "buy", lid: d.lid, ts: SV } };
    ws.forEach((w, i) => { u[`marketPayouts/${l.seller}/${i ? `${d.lid}_${wk[i]}${l.ts}` : `${d.lid}_${l.ts}`}`] = { id: w.id, qty: w.qty, lid: d.lid }; debit(S, u, U, w.id, w.qty); });
    if (l.give.slot) u[`inventory/${U}/m_${l.ts}`] = { id: l.give.id, qty: 1, dur: l.give.dur, ...(l.give.maxDur ? { maxDur: l.give.maxDur } : {}) }; else credit(S, u, U, l.give.id, l.give.qty);
    return u;
  },
  cancel(d, S) {
    const p = S.user, l = (S.market?.[p.faction] || {})[d.lid]; if (!l || l.seller !== U) return null;
    if (!l.give.slot && have(S, l.give.id) + l.give.qty > MAXQ) return null;
    const u = { [`market/${p.faction}/${d.lid}`]: null, [`marketTx/${U}`]: { op: "cancel", lid: d.lid, ts: SV } };
    if (l.give.slot) u[`inventory/${U}/m_${l.ts}`] = { id: l.give.id, qty: 1, dur: l.give.dur, ...(l.give.maxDur ? { maxDur: l.give.maxDur } : {}) }; else credit(S, u, U, l.give.id, l.give.qty);
    return u;
  },
  claim(d, S) {
    const pay = (S.marketPayouts?.[U] || {})[d.pid]; if (!pay) return null;
    const slot = (S.inventory || {})[pay.id] || null, h = slot?.qty || 0;
    if (h + pay.qty > MAXQ) return null;
    return { [`marketPayouts/${U}/${d.pid}`]: null, [`marketTx/${U}`]: { op: "claim", pid: d.pid, ts: SV }, [`inventory/${U}/${pay.id}`]: { id: pay.id, qty: h + pay.qty } };
  },
  bmBuy(d, S) {
    const p = S.user, bm = (S.bm || {})[p.faction], o = bm?.[d.k]; if (!o || !o.give) return null;
    if (bm.w !== Math.floor(Date.now() / BM_CFG.win)) return null;
    if (o.buyers?.[U]) return null; if ((o.sold || 0) >= o.stock) return null;
    if (have(S, o.want.id) < o.want.qty) return null; if (have(S, o.give.id) + o.give.qty > MAXQ) return null;
    const u = { [`bm/${p.faction}/${d.k}/sold`]: (o.sold || 0) + 1, [`bm/${p.faction}/${d.k}/buyers/${U}`]: true, [`marketTx/${U}`]: { op: "bmbuy", k: d.k, ts: SV } };
    debit(S, u, U, o.want.id, o.want.qty); credit(S, u, U, o.give.id, o.give.qty); return u;
  },
  gift(d, S) {
    const p = S.user; if (!d.to || d.to === U) return null; if (!["water", "canned_food", "bandage", "moss", "bread", "fruit"].includes(d.id)) return null;
    if (have(S, d.id) < 1) return null; if (d.fac && d.fac !== p.faction) return null;
    const u = { [`giftTx/${U}`]: { ts: SV, to: d.to }, [`marketPayouts/${d.to}/g${U}`]: { id: d.id, qty: 1, lid: "gift", n: String(p.username || "").slice(0, 16) } };
    debit(S, u, U, d.id, 1); return u;
  },
  bmRotate(d, S) { const p = S.user, w = Math.floor(Date.now() / BM_CFG.win); const cur = (S.bm || {})[p.faction]; if (cur && cur.w >= w) return null; return { [`bm/${p.faction}`]: bmBuildRound(p.faction, w) }; }
};

function cmp(a, b, path = "") {
  if (a === b) return null;
  if (typeof a === "number" && typeof b === "number" && /\/(ts|t)$/.test(path) && Math.abs(a - b) < 60000) return null;
  if (a && b && typeof a === "object" && typeof b === "object") { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const r = cmp(a[k], b[k], path + "/" + k); if (r) return r; } return null; }
  return `${path}: old=${JSON.stringify(a)} new=${JSON.stringify(b)}`;
}

(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: oldRules } });
  const cdb = env.authenticatedContext(U, { firebase: { sign_in_provider: "password" } }).database();
  const seedAll = async (S) => { await adb.ref().set(null); await adb.ref().set(norm({ users: { [U]: S.user, [V]: S.other || user({ username: "other", faction: S.user.faction }) }, inventory: { [U]: S.inventory || null }, config: { weaponMaxDur: Object.fromEntries(MKT_WEAP.map((w) => [w, 30])) }, market: S.market || null, marketPayouts: S.marketPayouts || null, bm: S.bm || null, giftTx: S.giftTx || null })); };
  const snap = async () => { const r = (await adb.ref().get()).val() || {}; delete r.locks; delete r.marketTx; delete r.config; if (r.users) { for (const k of Object.keys(r.users)) { r.users[k] = { equipped: r.users[k].equipped ?? null }; } } if (r.inventory) delete r.inventory[V]; return norm(r); };
  let n = 0, bad = 0, okBoth = 0, denyBoth = 0, clientBlocked = 0;
  const PAD = { scrap: 40, chem: 40, canned_food: 40, water: 40, medkit: 40, energy_drink: 40, moss: 40 };   // วัตถุดิบของสูตรคราฟต์ — กฎเดิมของมนุษย์พังถ้าไม่มี (ดูรายงาน) จึงเติมให้เทสต์เทียบพฤติกรรมปกติ
  async function scenario(name, S, act, d) {
    n++; S.user = S.user || user();
    if (S.user.faction === "human" && !S.noPad) { S.inventory = S.inventory || {}; for (const [id, q] of Object.entries(PAD)) if (!S.inventory[id]) S.inventory[id] = { id, qty: q }; }
    await seedAll(S);
    let oldOk = true, skipped = false; const up = old[act](d, S);
    if (!up) { skipped = true; oldOk = false; } else { try { await cdb.ref().update(up); } catch { oldOk = false; } }
    const oldState = await snap();
    await seedAll(S); const base = await snap();
    let newOk = true, err = "";
    try { await sys.run(U, { a: act, ...d.new }); } catch (e) { newOk = false; err = e.message; if (!e.code) console.log("  (non-HttpsError)", e.stack); }
    const newState = await snap();
    let diff = null;
    if (skipped) { clientBlocked++; if (newOk) { const c = cmp(base, newState); if (c) diff = "client would not send, but function changed state: " + c; } }
    else if (oldOk !== newOk) diff = `allow mismatch old=${oldOk} new=${newOk} (${err})`;
    else if (oldOk) diff = cmp(oldState, newState);
    if (diff) { bad++; console.log("MISMATCH", name, JSON.stringify(d.new), diff); } else if (oldOk) okBoth++; else denyBoth++;
  }
  const mk = (o) => o;
  const L = (extra = {}) => ({ seller: V, sellerName: "other", give: { id: "bandage", qty: 3 }, want: { id: "scrap", qty: 2 }, ts: NOW0 - 5000, ...extra });
  for (const fac of ["human", "zombie"]) {
    const U1 = (o = {}) => user({ faction: fac, ...o });
    // ---------- sell ----------
    const sellD = (g, gq, w, wq, x = []) => ({ g, gq, w, wq, x, new: { g, gq: g.startsWith("w:") ? undefined : gq, wants: [{ id: w, qty: wq }, ...x.map((y) => ({ id: y.id, qty: y.q }))] } });
    for (const have0 of [0, 2, 5]) for (const gq of [1, 3, 5, 6]) for (const [w, wq] of [["scrap", 2], ["water", 99], ["bandage", 1]]) for (const x of [[], [{ id: "chem", q: 2 }], [{ id: "chem", q: 2 }, { id: "moss", q: 3 }], [{ id: "bandage", q: 1 }], [{ id: "scrap", q: 1 }]]) {
      await scenario(`sell ${fac} have=${have0} gq=${gq} w=${w}/${wq} x=${x.length}`, { user: U1(), inventory: have0 ? inv({ bandage: have0 }) : {} }, "sell", sellD("bandage", gq, w, wq, x));
    }
    await scenario("sell zone", { user: U1({ zone: "ruins" }), inventory: inv({ bandage: 5 }) }, "sell", sellD("bandage", 1, "scrap", 1));
    await scenario("sell dead", { user: U1({ hp: 0 }), inventory: inv({ bandage: 5 }) }, "sell", sellD("bandage", 1, "scrap", 1));
    await scenario("sell banned", { user: U1({ banned: true }), inventory: inv({ bandage: 5 }) }, "sell", sellD("bandage", 1, "scrap", 1));
    for (const full of [0, 1, 2, 3]) { const m = {}; for (let i = 1; i <= full; i++) m[`${U}_${i}`] = L({ seller: U, sellerName: "tester" }); await scenario(`sell listings=${full}`, { user: U1(), inventory: inv({ bandage: 5 }), market: { [fac]: m } }, "sell", sellD("bandage", 1, "scrap", 1)); }
    await scenario("sell gap slot2", { user: U1(), inventory: inv({ bandage: 5 }), market: { [fac]: { [`${U}_1`]: L({ seller: U }) } } }, "sell", sellD("bandage", 1, "scrap", 1));
    // weapons
    for (const [id, it] of [["knife", { dur: 20, maxDur: 30 }], ["knife", { dur: 20 }], ["pistol", { dur: 1, maxDur: 30 }], ["knife", { dur: 0, maxDur: 30 }], ["admin_katana", { dur: 20 }], ["custom", { dur: 20, name: "x", dmg: 5, type: "weapon" }]]) for (const eq of [false, true]) {
      await scenario(`sell weapon ${id} ${JSON.stringify(it)} eq=${eq}`, { user: U1(eq ? { equipped: "wslot1" } : {}), inventory: { wslot1: { id, qty: 1, ...it } } }, "sell", sellD("w:wslot1", 1, "scrap", 4));
    }
    await scenario("sell weapon missing", { user: U1() }, "sell", sellD("w:nope", 1, "scrap", 4));
    // ---------- buy ----------
    const buyD = (lid) => ({ lid, new: { lid } });
    for (const nW of [1, 2, 3]) for (const hv of ["enough", "exact", "short", "none"]) for (const give of [{ id: "bandage", qty: 3 }, { id: "water", qty: 5 }, { id: "knife", qty: 1, slot: "ws", dur: 12, maxDur: 30 }, { id: "pistol", qty: 1, slot: "ws", dur: 5 }]) for (const haveGive of [0, 4, 97]) {
      const wants = [{ id: "scrap", qty: 2 }, { id: "chem", qty: 1 }, { id: "moss", qty: 3 }].slice(0, nW);
      const l = L({ give, want: wants[0], ...(wants[1] ? { want2: wants[1] } : {}), ...(wants[2] ? { want3: wants[2] } : {}) });
      const iv = {}; wants.forEach((w, i) => { const q = hv === "enough" ? w.qty + 3 : hv === "exact" ? w.qty : hv === "short" ? (i === nW - 1 ? w.qty - 1 : w.qty) : 0; if (q > 0) iv[w.id] = q; });
      if (haveGive && !give.slot) iv[give.id] = haveGive;
      await scenario(`buy ${fac} nW=${nW} have=${hv} give=${give.id} haveGive=${haveGive}`, { user: U1(), inventory: inv(iv), market: { [fac]: { [`${V}_1`]: l } } }, "buy", buyD(`${V}_1`));
    }
    await scenario("buy own", { user: U1(), inventory: inv({ scrap: 9 }), market: { [fac]: { [`${U}_1`]: L({ seller: U }) } } }, "buy", buyD(`${U}_1`));
    await scenario("buy missing", { user: U1(), inventory: inv({ scrap: 9 }) }, "buy", buyD(`${V}_1`));
    await scenario("buy zone", { user: U1({ zone: "mall" }), inventory: inv({ scrap: 9 }), market: { [fac]: { [`${V}_1`]: L() } } }, "buy", buyD(`${V}_1`));
    await scenario("buy dead", { user: U1({ hp: 0 }), inventory: inv({ scrap: 9 }), market: { [fac]: { [`${V}_1`]: L() } } }, "buy", buyD(`${V}_1`));
    const other = fac === "human" ? "zombie" : "human";
    await scenario("buy other faction market", { user: U1(), inventory: inv({ scrap: 9 }), market: { [other]: { [`${V}_1`]: L() } } }, "buy", buyD(`${V}_1`));
    // ---------- cancel ----------
    for (const give of [{ id: "bandage", qty: 3 }, { id: "water", qty: 99 }, { id: "knife", qty: 1, slot: "ws", dur: 12, maxDur: 30 }]) for (const hv of [0, 1, 50, 97, 99]) {
      await scenario(`cancel ${fac} give=${give.id}/${give.qty} have=${hv}`, { user: U1(), inventory: hv && !give.slot ? inv({ [give.id]: hv }) : {}, market: { [fac]: { [`${U}_2`]: L({ seller: U, give }) } } }, "cancel", buyD(`${U}_2`));
    }
    await scenario("cancel others", { user: U1(), market: { [fac]: { [`${V}_1`]: L() } } }, "cancel", buyD(`${V}_1`));
    await scenario("cancel zone any", { user: U1({ zone: "ruins" }), market: { [fac]: { [`${U}_2`]: L({ seller: U }) } } }, "cancel", buyD(`${U}_2`));
    // ---------- claim ----------
    for (const pay of [{ id: "scrap", qty: 4, lid: "x" }, { id: "water", qty: 10, lid: "x" }, { id: "bandage", qty: 1, lid: "gift", n: "friend" }]) for (const hv of [0, 1, 89, 90, 95, 99]) {
      await scenario(`claim ${fac} ${pay.id}/${pay.qty} have=${hv}`, { user: U1(), inventory: hv ? inv({ [pay.id]: hv }) : {}, marketPayouts: { [U]: { p1: pay } } }, "claim", { pid: "p1", new: { pid: "p1" } });
    }
    await scenario("claim missing", { user: U1() }, "claim", { pid: "zz", new: { pid: "zz" } });
    // ---------- black market ----------
    const w = Math.floor(Date.now() / BM_CFG.win), rnd = bmBuildRound(fac, w);
    const cur = BM_CFG[fac].currency;
    for (const k of ["o1", "o3", "o5"]) for (const hv of ["enough", "exact", "short", "none"]) for (const state of ["fresh", "bought", "soldout", "lastone", "stale"]) {
      const o = rnd[k]; const bm = JSON.parse(JSON.stringify(rnd));
      if (state === "bought") bm[k].buyers = { [U]: true }, bm[k].sold = 1;
      if (state === "soldout") bm[k].sold = bm[k].stock, bm[k].buyers = { [V]: true };
      if (state === "lastone") bm[k].sold = bm[k].stock - 1, bm[k].buyers = { [V]: true };
      if (state === "stale") bm.w = w - 1;
      const q = hv === "enough" ? o.want.qty + 4 : hv === "exact" ? o.want.qty : hv === "short" ? o.want.qty - 1 : 0;
      await scenario(`bmBuy ${fac} ${k} ${hv} ${state}`, { user: U1(), inventory: q > 0 ? inv({ [cur]: q }) : {}, bm: { [fac]: bm } }, "bmBuy", { k, new: { k } });
    }
    await scenario("bmBuy cap", { user: U1(), inventory: inv({ [cur]: 30, [rnd.o1.give.id]: 99 }), bm: { [fac]: rnd } }, "bmBuy", { k: "o1", new: { k: "o1" } });
    await scenario("bmBuy zone", { user: U1({ zone: "ruins" }), inventory: inv({ [cur]: 30 }), bm: { [fac]: rnd } }, "bmBuy", { k: "o1", new: { k: "o1" } });
    for (const st of ["none", "old", "current"]) await scenario(`bmRotate ${fac} ${st}`, { user: U1(), bm: st === "none" ? undefined : { [fac]: st === "old" ? { ...rnd, w: w - 3 } : rnd } }, "bmRotate", { new: {} });
    // ---------- gift ----------
    for (const id of ["water", "canned_food", "bandage", "moss", "bread", "fruit", "scrap"]) for (const hv of [0, 1, 5]) for (const pend of [false, true]) for (const sameFac of [true, false]) {
      await scenario(`gift ${fac} ${id} have=${hv} pending=${pend} sameFac=${sameFac}`, { user: U1(), other: user({ username: "other", faction: sameFac ? fac : other }), inventory: hv ? inv({ [id]: hv }) : {}, marketPayouts: pend ? { [V]: { [`g${U}`]: { id: "water", qty: 1, lid: "gift", n: "tester" } } } : undefined }, "gift", { to: V, id, fac: undefined, new: { to: V, id } });
    }
    await scenario("gift zone", { user: U1({ zone: "ruins" }), inventory: inv({ water: 2 }) }, "gift", { to: V, id: "water", new: { to: V, id: "water" } });
    await scenario("gift self", { user: U1(), inventory: inv({ water: 2 }) }, "gift", { to: U, id: "water", new: { to: U, id: "water" } });
    await scenario("gift rate", { user: U1(), inventory: inv({ water: 2 }), giftTx: { [U]: { ts: Date.now() - 1000, to: "zz" } } }, "gift", { to: V, id: "water", new: { to: V, id: "water" } });
  }
  console.log(JSON.stringify({ scenarios: n, mismatches: bad, bothAllowed: okBoth, bothDenied: denyBoth, clientBlocked }));
  await env.cleanup(); await admin.app().delete();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
