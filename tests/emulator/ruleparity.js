// Allow/deny parity between two rules files for (a) human crafting, (b) starter kit, (c) misc writes; plus base/baseTx now closed.
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const fs = require("fs");
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const NS = "demo-zombo";
admin.initializeApp({ projectId: NS, databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const adb = admin.database();
const UID = "u1", SV = admin.database.ServerValue.TIMESTAMP;
const R = { old: fs.readFileSync("rules_old.json", "utf8"), nw: fs.readFileSync("rules_new.json", "utf8") };
const user = (o = {}) => ({ username: "tester", faction: "human", role: "player", banned: false, zone: "safe", stamina: 100, staminaTs: Date.now(), hp: 100, food: 100, water: 100, foodTs: Date.now(), waterTs: Date.now(), ...o });
const rec = { bandage: { m: ["scrap", 2] }, antidote: { m: ["chem", 2], s: ["scrap", 1] }, trauma_kit: { m: ["medkit", 1], s: ["bandage", 2], x: ["chem", 1] }, soup: { m: ["canned_food", 1], s: ["water", 1] }, stim_shot: { m: ["chem", 3], s: ["energy_drink", 1] }, rag_vest: { m: ["scrap", 5] }, scrap_plate: { m: ["scrap", 10], s: ["chem", 2] }, headlamp: { m: ["scrap", 4], s: ["energy_drink", 1] }, toolkit: { m: ["scrap", 6], s: ["chem", 1] } };
(async () => {
  const envs = {}; const env0 = await initializeTestEnvironment({ projectId: NS, database: { host: "127.0.0.1", port: 9000, rules: R.old } });
  let cur = "old";
  const setRules = async (k) => { if (cur === k) return; const r = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}`, { method: "PUT", headers: { Authorization: "Bearer owner" }, body: R[k] }); if (!r.ok) throw new Error("rules put " + r.status + await r.text()); cur = k; };
  envs.old = envs.nw = env0;
  const run = async (k, seed, up, who = UID) => {
    await setRules(k);
    await adb.ref().set(JSON.parse(JSON.stringify(seed)));
    const db = (who === "anon" ? envs[k].unauthenticatedContext() : envs[k].authenticatedContext(who, { firebase: { sign_in_provider: "password" } })).database();
    try { await db.ref().update(up); return true; } catch { return false; }
  };
  let n = 0, bad = 0, allowed = 0;
  async function both(name, seed, up) { n++; const a = await run("old", seed, up), b = await run("nw", seed, up); if (a) allowed++; if (a !== b) { bad++; console.log("MISMATCH", name, "old", a, "new", b); } }
  for (const [slot, r] of Object.entries(rec)) for (const fac of ["human", "zombie"]) for (const miss of [null, "m", "s", "x"]) for (const have0 of [0, 1]) for (const extra of [0, 5]) {
    const inv = {}; const add = (id, q) => { inv[id] = { id, qty: (inv[id]?.qty || 0) + q }; };
    for (const [key, v] of Object.entries(r)) { if (key === miss) continue; add(v[0], v[1] + extra); }
    if (have0) add(slot, 2);
    const up = {}; const cur = (id) => inv[id]?.qty || 0;
    for (const [key, v] of Object.entries(r)) { const left = cur(v[0]) - v[1]; if (miss === key) continue; up[`inventory/${UID}/${v[0]}`] = left > 0 ? { id: v[0], qty: left } : null; }
    up[`inventory/${UID}/${slot}`] = { id: slot, qty: (inv[slot]?.qty || 0) + 1 };
    await both(`craft ${slot} ${fac} miss=${miss} have=${have0} extra=${extra}`, { users: { [UID]: user({ faction: fac }) }, inventory: { [UID]: inv } }, up);
  }
  // starter kit (new user)
  for (const fac of ["human", "zombie"]) { const kit = fac === "human" ? { canned_food: 2, water: 2, bandage: 2, scrap: 3 } : { rotten_meat: 3, water: 2, bandage: 2 };
    const up = { [`users/${UID}`]: { ...user({ faction: fac }), createdAt: SV, hp: 100, stamina: 100, food: 100, water: 100, foodTs: SV, waterTs: SV, staminaTs: SV } }; for (const [id, q] of Object.entries(kit)) up[`inventory/${UID}/${id}`] = { id, qty: q };
    await both("starter " + fac, {}, up); }
  // misc plain operations that must be unchanged
  await both("scrap decrement", { users: { [UID]: user() }, inventory: { [UID]: { scrap: { id: "scrap", qty: 9 } } } }, { [`inventory/${UID}/scrap/qty`]: 8 });
  await both("drop item", { users: { [UID]: user() }, inventory: { [UID]: { scrap: { id: "scrap", qty: 9 } } } }, { [`inventory/${UID}/scrap`]: null });
  await both("other user inv", { users: { [UID]: user(), u2: user() }, inventory: { u2: { scrap: { id: "scrap", qty: 9 } } } }, { [`inventory/u2/scrap/qty`]: 1 });
  await both("fabricate item", { users: { [UID]: user() } }, { [`inventory/${UID}/pistol`]: { id: "pistol", qty: 1, dur: 30 } });
  // market: old allowed direct sell / buy ticket / gift, new must deny
  const seedM = { users: { [UID]: user(), u2: user({ username: "other" }) }, inventory: { [UID]: { water: { id: "water", qty: 5 }, scrap: { id: "scrap", qty: 40 }, chem: { id: "chem", qty: 40 }, canned_food: { id: "canned_food", qty: 40 }, medkit: { id: "medkit", qty: 40 }, energy_drink: { id: "energy_drink", qty: 40 }, moss: { id: "moss", qty: 40 } } } };
  const sellUp = { [`market/human/${UID}_1`]: { seller: UID, sellerName: "tester", give: { id: "water", qty: 2 }, want: { id: "scrap", qty: 1 }, ts: SV }, [`inventory/${UID}/water/qty`]: 3 };
  const sOld = await run("old", seedM, sellUp), sNew = await run("nw", seedM, sellUp);
  console.log("direct market sell  old:", sOld, " new:", sNew, "(expect true/false)");
  const gUp = { [`giftTx/${UID}`]: { ts: SV, to: "u2" }, [`marketPayouts/u2/g${UID}`]: { id: "water", qty: 1, lid: "gift", n: "tester" }, [`inventory/${UID}/water/qty`]: 4 };
  const gOld = await run("old", seedM, gUp), gNew = await run("nw", seedM, gUp);
  console.log("direct gift write   old:", gOld, " new:", gNew, "(expect true/false)");
  // reads must still work
  await adb.ref().set({ users: { [UID]: user() }, market: { human: { x: { seller: "u2" } }, zombie: { y: { seller: "u3" } } }, marketPayouts: { [UID]: { p: { id: "water", qty: 1, lid: "x" } }, u2: { p: { id: "water", qty: 1, lid: "x" } } }, bm: { human: { w: 1 }, zombie: { w: 1 } } });
  const rd = async (k, who, path) => { try { await envs[k].authenticatedContext(who, { firebase: { sign_in_provider: "password" } }).database().ref(path).get(); return true; } catch { return false; } };
  for (const k of ["old", "nw"]) { await setRules(k); console.log(k, "read own market:", await rd(k, UID, "market/human"), "| other faction market:", await rd(k, UID, "market/zombie"), "| own payouts:", await rd(k, UID, `marketPayouts/${UID}`), "| other payouts:", await rd(k, UID, "marketPayouts/u2"), "| bm own:", await rd(k, UID, "bm/human"), "| bm other:", await rd(k, UID, "bm/zombie")); }
  console.log(JSON.stringify({ scenarios: n, mismatches: bad, allowedByOld: allowed }));
  await env0.cleanup(); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
