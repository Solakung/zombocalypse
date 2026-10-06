process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const B = JSON.parse(fs.readFileSync("/tmp/claude-0/-home-user-zombocalypse/057fb33f-8deb-5907-9926-885a7223355b/scratchpad/batch1.json", "utf8"));
const items = require("/tmp/claude-0/-home-user-zombocalypse/057fb33f-8deb-5907-9926-885a7223355b/scratchpad/itemsdata.js").items;
const NS = "demo-zombo";
admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database(), SV = admin.database.ServerValue.TIMESTAMP, UID = "u1";
const R = { old: fs.readFileSync("rules_old.json", "utf8"), nw: fs.readFileSync("rules_new.json", "utf8") };
let cur = "old";
const setRules = async (k) => { if (cur === k) return; const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules put " + r.status); cur = k; };
const user = (o = {}) => ({ username: "tester", faction: "human", role: "player", banned: false, zone: "ruins", stamina: 100, staminaTs: Date.now(), hp: 100, food: 100, water: 100, foodTs: Date.now(), waterTs: Date.now(), ...o });
(async () => {
  const env = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  const c = env.authenticatedContext(UID, { firebase: { sign_in_provider: "password" } }).database();
  const run = async (rules, seed, up, who = c) => { await setRules(rules); await adb.ref().set(JSON.parse(JSON.stringify(seed))); try { await who.ref().update(up); return true; } catch { return false; } };
  const lootUp = (id, zombie) => ({ [`inventory/${UID}/${id}`]: { id, qty: 1 }, [`users/${UID}/stamina`]: zombie ? 92 : 90, [`users/${UID}/staminaTs`]: SV });
  // 0) calibrate: template item must be lootable under OLD rules in ruins
  const seed = (z, f = "human") => ({ users: { [UID]: user({ zone: z, faction: f }) } });
  console.log("calibration old rag_vest@ruins:", await run("old", seed("ruins"), lootUp("rag_vest")), "(expect true) | old water@ruins:", await run("old", seed("ruins"), lootUp("water")));
  let bad = 0, ok = 0, n = 0;
  const zones = ["ruins", "mall", "hospital", "police", "forest", "factory", "port", "base", "tunnel", "lab"];
  for (const it of items.filter((x) => B.ids.includes(x.id))) for (const z of zones) {
    const zombie = it.cat === "mut"; const expected = (B.perZoneIds[z] || []).includes(it.id);
    const a = await run("old", seed(z, zombie ? "zombie" : "human"), lootUp(it.id, zombie)), b = await run("nw", seed(z, zombie ? "zombie" : "human"), lootUp(it.id, zombie));
    n++; if (a !== false) { bad++; console.log("OLD ALLOWED new id?!", it.id, z); }
    if (b !== expected) { bad++; console.log("MISMATCH loot", it.id, "zone", z, "expected", expected, "got", b); } else if (b) ok++;
  }
  console.log("loot checks:", n, "bad:", bad, "allowed-as-designed:", ok);
  // 1) regression: pre-existing items still behave same in every zone under old vs new
  let reg = 0, regN = 0;
  for (const id of ["water", "scrap", "bandage", "pistol", "rag_vest", "mut_fang1", "lab_coat", "dna_frag", "chem", "serum"]) for (const z of zones) {
    const zombie = id.startsWith("mut_"); const a = await run("old", seed(z, zombie ? "zombie" : "human"), lootUp(id, zombie)), b = await run("nw", seed(z, zombie ? "zombie" : "human"), lootUp(id, zombie)); regN++; if (a !== b) { reg++; console.log("REGRESSION", id, z, a, b); }
  }
  console.log("regression loot checks:", regN, "diffs:", reg);
  // 2) equip validation
  let eq = 0, eqN = 0;
  for (const it of items.filter((x) => ["arm", "acc", "mut"].includes(x.cat))) {
    const slot = it.cat === "mut" ? it.slot : it.cat, fac = it.cat === "mut" ? "zombie" : "human";
    const s = { users: { [UID]: user({ zone: "safe", faction: fac }) }, inventory: { [UID]: { [it.id]: { id: it.id, qty: 1 } } } };
    const a = await run("old", s, { [`users/${UID}/${slot}`]: it.id }), b = await run("nw", s, { [`users/${UID}/${slot}`]: it.id });
    eqN++; if (a !== false || b !== true) { eq++; console.log("EQUIP issue", it.id, slot, "old", a, "new", b); }
    // wrong faction must be denied
    const s2 = { ...s, users: { [UID]: user({ zone: "safe", faction: fac === "zombie" ? "human" : "zombie" }) } };
    const c2 = await run("nw", s2, { [`users/${UID}/${slot}`]: it.id }); eqN++; if (c2 !== false) { eq++; console.log("EQUIP wrong-faction allowed", it.id); }
  }
  console.log("equip checks:", eqN, "issues:", eq);
  // 3) boss loot: write via bossFights branch? (verify rule text includes ids instead)
  const w = JSON.parse(R.nw).rules.inventory.$uid.$slot[".write"]; const bossMissing = B.bossIds.filter((id) => !w.includes("|lab_blade|" + id) && !new RegExp("\\^\\(canned_food\\|water\\|bandage\\|medkit\\|wooden_bat[^)]*\\|" + id + "[|)]").test(w));
  console.log("boss ids missing from boss reward list:", bossMissing.join(",") || "none");
  await env.cleanup(); process.exit(bad || reg || eq ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
