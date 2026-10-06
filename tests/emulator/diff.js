// Differential fuzzer: same seed + same write against two rules files; report any allow/deny mismatch.
// usage: node diff.js old.json new.json [trials] [rngSeed]
const fs = require("fs");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const [oldF, newF, N = "2000", SEED = "1"] = process.argv.slice(2);
const oldRules = fs.readFileSync(oldF, "utf8"), newRules = fs.readFileSync(newF, "utf8");
const rulesObj = JSON.parse(oldRules).rules;

let s = Number(SEED) >>> 0 || 1;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;

// ---- pools harvested from rules text ----
const lits = new Set(), kids = new Set();
for (const m of oldRules.matchAll(/'([^'\\]{1,40})'/g)) lits.add(m[1]);
for (const m of oldRules.matchAll(/\(([a-z_0-9|]+)\)/g)) m[1].split("|").forEach((x) => lits.add(x));
const litA = [...lits].filter((x) => !x.includes("/") && !/^[+]/.test(x));
const NOW = Date.now();
const nums = [0, 1, 2, 3, 4, 5, 6, 7, 10, 20, 30, 31, 50, 60, 99, 100, 110, 150, 300, -1, -5, 1000, NOW, NOW - 1000, NOW - 60000, NOW - 600000, NOW - 7200000, NOW - 10800000, NOW - 14400000, NOW - 86400000];
const zones = ["safe", "ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
const UIDS = ["u1", "u2", "gm1", "own1"];
const WILD = {};  // wildcard pools
const wildPool = (name) => name === "$uid" || name === "$target" ? pick(["u1", "u2"]) : name === "$zone" ? pick(zones) : name === "$faction" ? pick(["human", "zombie"]) : pick([...litA.slice(0, 80), "u1", "u2", "a", "b", "1", "2"]);

function val(key, depth = 0) {
  const r = rnd();
  if (key === "zone") return pick(zones);
  if (key === "faction") return pick(["human", "zombie"]);
  if (key === "role") return pick(["player", "player", "gm", "owner"]);
  if (key === "banned") return chance(0.1);
  if (key === "id") return pick(litA);
  if (r < 0.45) return pick(nums);
  if (r < 0.85) return pick(litA);
  if (r < 0.9) return chance(0.5);
  return "x".repeat(1 + Math.floor(rnd() * 20));
}
function gen(node, key, depth = 0) {
  if (!node || typeof node !== "object") return val(key);
  const ch = Object.keys(node).filter((k) => k[0] !== ".");
  if (!ch.length) return val(key);
  const o = {};
  for (const k of ch) {
    if (k[0] === "$") { const n = 1 + Math.floor(rnd() * 2); for (let i = 0; i < n; i++) o[wildPool(k)] = gen(node[k], k, depth + 1); }
    else if (chance(0.85)) o[k] = gen(node[k], k, depth + 1);
  }
  return Object.keys(o).length ? o : val(key);
}
// all path templates
const paths = [];
(function walk(n, p) { for (const [k, v] of Object.entries(n)) { if (k[0] === "." || typeof v !== "object") continue; const q = [...p, k]; paths.push({ tpl: q, node: v }); walk(v, q); } })(rulesObj, []);
const weight = paths.map((p) => JSON.stringify(p.node).length);

function mkSeed() {
  const db = {};
  for (const [k, v] of Object.entries(rulesObj)) if (k[0] !== "." && chance(0.5)) db[k] = gen(v, k);
  const mkUser = (role, uid) => ({ username: uid.slice(0, 8), faction: pick(["human", "zombie"]), role, banned: false, zone: pick(zones), stamina: pick([0, 5, 50, 100, 110]), staminaTs: NOW - pick([0, 1000, 60000]), hp: pick([0, 1, 50, 100, 110]), food: pick([0, 5, 100]), water: pick([0, 5, 100]), foodTs: NOW - pick([0, 1000, 60000]), waterTs: NOW - pick([0, 1000, 60000]), createdAt: NOW - 1e6 });
  db.users = Object.assign(db.users && typeof db.users === "object" ? db.users : {}, { u1: mkUser("player", "u1"), u2: mkUser("player", "u2"), gm1: mkUser("gm", "gm1"), own1: mkUser("owner", "own1") });
  return db;
}
function pickPathInst() {
  let tot = 0; for (const w of weight) tot += w;
  let r = rnd() * tot, i = 0; while (r > weight[i]) { r -= weight[i]; i++; }
  const { tpl, node } = paths[i];
  const inst = tpl.map((k) => (k[0] === "$" ? wildPool(k) : k));
  return { path: inst.join("/"), node, key: tpl[tpl.length - 1] };
}
const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));

(async () => {
  const mk = async (id, rules) => initializeTestEnvironment({ projectId: id, database: { host: "127.0.0.1", port: 9000, rules } });
  const A = await mk("demo-a", oldRules), B = await mk("demo-b", newRules);
  const authFor = (env, who) => who === "anon" ? env.unauthenticatedContext() : env.authenticatedContext(who, { firebase: { sign_in_provider: "password" } });
  let mism = 0, allowed = 0, tot = 0;
  const hitPaths = {};
  for (let t = 0; t < Number(N); t++) {
    const seed = clean(mkSeed());
    const { path, node, key } = pickPathInst();
    const value = chance(0.05) ? null : clean({ v: gen(node, key) }).v;
    const who = pick(["u1", "u1", "u1", "u2", "gm1", "own1", "anon"]);
    const mode = chance(0.25) ? "update" : "set";
    // make the write more likely to pass: sometimes derive from seed value with small mutation
    const res = [];
    for (const env of [A, B]) {
      await env.withSecurityRulesDisabled(async (c) => { await c.database().ref().set(seed); });
      const db = authFor(env, who).database();
      let ok = true;
      try { mode === "set" || typeof value !== "object" || value === null ? await db.ref(path).set(value) : await db.ref(path).update(value); } catch (e) { ok = false; }
      res.push(ok);
    }
    tot++; if (res[0]) { allowed++; hitPaths[path.split("/")[0]] = (hitPaths[path.split("/")[0]] || 0) + 1; }
    if (res[0] !== res[1]) { mism++; console.log("MISMATCH", JSON.stringify({ who, mode, path, value, old: res[0], new: res[1] }).slice(0, 600)); if (mism > 5) break; }
  }
  console.log(JSON.stringify({ trials: tot, allowedByOld: allowed, mismatches: mism, allowedPerCollection: hitPaths }));
  await A.cleanup(); await B.cleanup();
  process.exit(mism ? 1 : 0);
})();
