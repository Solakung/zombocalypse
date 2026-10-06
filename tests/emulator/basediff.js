// Differential test: OLD client path (multi-path update under OLD rules) vs NEW Cloud Function logic (admin) — results must match.
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs");
const FN = "/home/user/zombocalypse/functions";
const admin = require(FN + "/node_modules/firebase-admin");
const { makeBase, BASE_P, BASE_CAP, BASE_UP, BENCH, DECO_COST } = require(FN + "/base.js");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const oldRules = fs.readFileSync(process.argv[2] || "rules_old.json", "utf8");

const NS = "demo-zombo";
const adm = admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database();
const sys = makeBase(adb);
const SV = admin.database.ServerValue.TIMESTAMP;   // {".sv":"timestamp"}
const UID = "u1";

function user(o = {}) {
  const now = Date.now();
  return { username: "tester", faction: "human", role: "player", banned: false, zone: "safe", stamina: 100, staminaTs: now, hp: 100, food: 100, water: 100, foodTs: now, waterTs: now, ...o };
}
const inv = (o) => { const r = {}; for (const [id, q] of Object.entries(o)) r[id] = { id, qty: q }; return r; };

// ---- OLD client behaviour (mirrors script.js before migration) ----
const oldOps = {
  place: (d, S) => ({ [`base/${UID}/s${d.i}`]: { k: d.k, t: SV } }),
  dismantle: (d) => ({ [`base/${UID}/s${d.i}`]: null }),
  collect: (d, S) => {
    const rec = S.base["s" + d.i]; if (!rec) return null; const K = rec.k, P = BASE_P[K], cap = BASE_CAP[K], el = Date.now() - rec.t, raw = Math.floor(el / P);
    if (!(raw >= 1)) return null;
    const u = Math.min(cap, raw), newT = raw >= cap ? SV : rec.t + u * P;
    const item = K === "w" ? "water" : K === "m" ? "moss" : S.user.faction === "zombie" ? "rotten_meat" : "canned_food";
    const have = (S.inventory || {})[item];
    const up = { [`baseTx/${UID}`]: { ts: SV, s: "s" + d.i }, [`base/${UID}/s${d.i}/t`]: newT };
    if (have && have.id === item && have.qty > 0) up[`inventory/${UID}/${item}/qty`] = have.qty + u; else up[`inventory/${UID}/${item}`] = { id: item, qty: u };
    return up;
  },
  upgrade: (d, S) => {
    const lv = S.base.lv || 0, it = S.user.faction === "zombie" ? "rotten_meat" : "scrap", cost = BASE_UP[lv], have = (S.inventory || {})[it];
    if (!have || have.id !== it || have.qty < cost) return null;
    return { [`base/${UID}/lv`]: lv + 1, ...(have.qty === cost ? { [`inventory/${UID}/${it}`]: null } : { [`inventory/${UID}/${it}/qty`]: have.qty - cost }) };
  },
  deco: (d, S) => {
    const it = S.user.faction === "zombie" ? "rotten_meat" : "scrap", cost = DECO_COST[d.d], have = (S.inventory || {})[it];
    if (!have || have.id !== it || have.qty < cost) return null;
    return { [`base/${UID}/deco/${d.d}`]: true, ...(have.qty === cost ? { [`inventory/${UID}/${it}`]: null } : { [`inventory/${UID}/${it}/qty`]: have.qty - cost }) };
  },
  benchStart: (d, S) => {
    const R = BENCH[d.r]; if (!R) return null; const have = (S.inventory || {})[R[0]];
    if (!have || have.id !== R[0] || have.qty < R[1]) return null;
    return { [`base/${UID}/j${d.j}`]: { r: String(d.r), t: SV }, ...(have.qty === R[1] ? { [`inventory/${UID}/${R[0]}`]: null } : { [`inventory/${UID}/${R[0]}/qty`]: have.qty - R[1] }) };
  },
  benchCancel: (d) => ({ [`base/${UID}/j${d.j}`]: null }),
  benchCollect: (d, S) => {
    const rec = S.base["j" + d.j], R = rec && BENCH[rec.r]; if (!R) return null;
    const [oid, q] = [R[2], R[3]], have = (S.inventory || {})[oid];
    const up = { [`baseTx/${UID}`]: { ts: SV, s: "j" + d.j }, [`base/${UID}/j${d.j}`]: null };
    if (have && have.id === oid && have.qty > 0) up[`inventory/${UID}/${oid}/qty`] = have.qty + q; else up[`inventory/${UID}/${oid}`] = { id: oid, qty: q };
    return up;
  }
};

const norm = (o) => JSON.parse(JSON.stringify(o ?? null));
function cmp(a, b, path = "") {   // compare with tolerance for timestamps (fields named t)
  if (a === b) return null;
  if (typeof a === "number" && typeof b === "number" && path.endsWith("/t") && Math.abs(a - b) < 60000) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const r = cmp(a[k], b[k], path + "/" + k); if (r) return r; }
    return null;
  }
  return `${path}: old=${JSON.stringify(a)} new=${JSON.stringify(b)}`;
}

(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: oldRules } });
  const ctxU = env.authenticatedContext(UID, { firebase: { sign_in_provider: "password" } });
  const cdb = ctxU.database();
  const seedAll = async (S) => { await adb.ref().set(null); await adb.ref().set(norm({ users: { [UID]: S.user }, base: { [UID]: S.base || null }, inventory: { [UID]: S.inventory || null } })); };
  const snap = async () => ({ base: (await adb.ref(`base/${UID}`).get()).val(), inventory: (await adb.ref(`inventory/${UID}`).get()).val() });
  let known = 0, n = 0, bad = 0, okBoth = 0, denyBoth = 0;
  async function scenario(name, S, act, d) {
    n++;
    S.user = S.user || user(); S.base = S.base || {};
    // OLD
    await seedAll(S);
    let oldOk = true, oldSkipped = false;
    const up = oldOps[act](d, S);
    if (!up) { oldSkipped = true; oldOk = false; }
    else { try { await cdb.ref().update(up); } catch (e) { oldOk = false; } }
    const oldState = await snap();
    // NEW
    await seedAll(S);
    let newOk = true;
    try { await sys.run(UID, { a: act, ...d }); } catch (e) { newOk = false; if (!e.code) console.log("  (non-HttpsError)", e.message); }
    const newState = await snap();
    let diff = null;
    if (oldSkipped) { diff = newOk && JSON.stringify(norm(newState)) !== JSON.stringify(norm(await (async () => { await seedAll(S); return snap(); })())) ? "client would not send, but function changed state" : null; }
    else if (name.startsWith("benchStart r4") && name.endsWith("have=20") && !oldOk && newOk) { known++; }
    else if (oldOk !== newOk) diff = `allow mismatch old=${oldOk} new=${newOk}`;
    else if (oldOk) diff = cmp(norm(oldState), norm(newState));
    if (diff) { bad++; console.log("MISMATCH", name, JSON.stringify(d), diff); } else if (oldOk) okBoth++; else denyBoth++;
  }
  const now = Date.now();
  const F = ["human", "zombie"];
  for (const fac of F) {
    const U = (o) => user({ faction: fac, ...o });
    // place
    for (const lv of [0, 1, 2, 3]) for (let i = 1; i <= 5; i++) for (const k of ["w", "t", "m"]) {
      await scenario(`place ${fac} lv${lv}`, { user: U(), base: { lv: lv || undefined } }, "place", { i, k });
    }
    await scenario("place occupied", { user: U(), base: { s1: { k: "w", t: now - 5000 } } }, "place", { i: 1, k: "m" });
    for (const z of ["ruins", "mall"]) await scenario("place wrong zone", { user: U({ zone: z }) }, "place", { i: 1, k: "w" });
    await scenario("place dead", { user: U({ hp: 0 }) }, "place", { i: 1, k: "w" });
    await scenario("place banned", { user: U({ banned: true }) }, "place", { i: 1, k: "w" });
    // dismantle
    await scenario("dismantle", { user: U(), base: { s2: { k: "t", t: now - 5000 } } }, "dismantle", { i: 2 });
    await scenario("dismantle empty", { user: U() }, "dismantle", { i: 2 });
    // collect
    for (const k of ["w", "m", "t"]) for (const mult of [0.5, 1, 2, 3, 4, 6]) for (const have of [null, 3, 50]) for (const other of [false]) {
      const item = k === "w" ? "water" : k === "m" ? "moss" : fac === "zombie" ? "rotten_meat" : "canned_food";
      const iv = have == null ? {} : inv({ [item]: have });
      if (other && have != null) iv[item] = { id: "water_jug", qty: have };   // slot key mismatch case
      await scenario(`collect ${k} x${mult} have=${have}${other ? " mism" : ""} ${fac}`, { user: U(), base: { s1: { k, t: now - Math.floor(mult * BASE_P[k]) - 8000 } }, inventory: iv }, "collect", { i: 1 });
    }
    await scenario("collect empty slot", { user: U(), base: {} }, "collect", { i: 3 });
    await scenario("collect dead", { user: U({ hp: 0 }), base: { s1: { k: "w", t: now - 3 * BASE_P.w } } }, "collect", { i: 1 });
    // upgrade
    for (let lv = 0; lv <= 3; lv++) for (const have of [null, 14, 15, 16, 40, 90, 99]) {
      const it = fac === "zombie" ? "rotten_meat" : "scrap";
      await scenario(`upgrade lv${lv} have=${have} ${fac}`, { user: U(), base: { lv: lv || undefined }, inventory: have == null ? {} : inv({ [it]: have }) }, "upgrade", {});
    }
    // deco
    for (let d = 0; d <= 11; d++) for (const have of [null, DECO_COST["d" + d] - 1, DECO_COST["d" + d], 99]) {
      const it = fac === "zombie" ? "rotten_meat" : "scrap";
      await scenario(`deco d${d} have=${have} ${fac}`, { user: U(), inventory: have == null ? {} : inv({ [it]: have }) }, "deco", { d: "d" + d });
    }
    await scenario("deco owned", { user: U(), base: { deco: { d0: true } }, inventory: inv({ scrap: 99, rotten_meat: 99 }) }, "deco", { d: "d0" });
    // bench start
    for (let r = 1; r <= 6; r++) for (const j of [1, 2]) for (const lv of [0, 2]) for (const have of [null, BENCH[r][1] - 1, BENCH[r][1], 20]) {
      await scenario(`benchStart r${r} j${j} lv${lv} have=${have}`, { user: U(), base: { lv: lv || undefined }, inventory: have == null ? {} : inv({ [BENCH[r][0]]: have }) }, "benchStart", { j, r });
    }
    await scenario("benchStart busy", { user: U(), base: { j1: { r: "1", t: now - 5000 } }, inventory: inv({ water: 9 }) }, "benchStart", { j: 1, r: 1 });
    // bench collect
    for (let r = 1; r <= 6; r++) for (const j of [1, 2]) for (const frac of [0.5, 0.99, 1.01, 3]) for (const have of [null, 4]) {
      const R = BENCH[r];
      await scenario(`benchCollect r${r} j${j} f${frac} have=${have}`, { user: U(), base: { lv: 2, ["j" + j]: { r: String(r), t: now - Math.floor(frac * R[4]) - (frac > 1 ? 8000 : 0) } }, inventory: have == null ? {} : inv({ [R[2]]: have }) }, "benchCollect", { j });
    }
    await scenario("benchCancel", { user: U(), base: { j1: { r: "2", t: now - 5000 } } }, "benchCancel", { j: 1 });
    await scenario("benchCancel none", { user: U() }, "benchCancel", { j: 1 });
  }
  console.log(JSON.stringify({ scenarios: n, mismatches: bad, knownImprovements: known, bothAllowed: okBoth, bothDenied: denyBoth }));
  await env.cleanup(); await adm.delete();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
