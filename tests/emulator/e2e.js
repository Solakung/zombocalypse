process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const admin = require("/home/user/zombocalypse/functions/node_modules/firebase-admin");
const { initializeApp } = require("firebase/app");
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require("firebase/functions");
const NS = "zompocalypse-137a6-default-rtdb";
admin.initializeApp({ projectId: "demo-zombo", databaseURL: `http://127.0.0.1:9000?ns=${NS}` });
const db = admin.database();
(async () => {
  const app = initializeApp({ projectId: "demo-zombo", apiKey: "fake", authDomain: "x" });
  const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const fns = getFunctions(app, "asia-southeast1"); connectFunctionsEmulator(fns, "127.0.0.1", 5001);
  const call = httpsCallable(fns, "baseAct");
  // unauthenticated
  try { await call({ a: "place", i: 1, k: "w" }); console.log("unauth: ALLOWED (bad)"); } catch (e) { console.log("unauth ->", e.code); }
  const cred = await createUserWithEmailAndPassword(auth, "u" + Date.now() + "@b.co", "secret12"); const uid = cred.user.uid;
  const now = Date.now();
  await db.ref().set({ users: { [uid]: { username: "t", faction: "human", role: "player", banned: false, zone: "safe", hp: 100 } }, inventory: { [uid]: { scrap: { id: "scrap", qty: 40 }, water: { id: "water", qty: 5 } } }, base: { [uid]: { lv: 0 } } });
  const show = async (label) => console.log(label, JSON.stringify({ base: (await db.ref(`base/${uid}`).get()).val(), inv: (await db.ref(`inventory/${uid}`).get()).val(), locks: (await db.ref(`locks/${uid}`).get()).val() }));
  console.log("place   ->", JSON.stringify((await call({ a: "place", i: 1, k: "w" })).data)); await show(" ");
  console.log("upgrade ->", JSON.stringify((await call({ a: "upgrade" })).data)); await show(" ");
  console.log("benchStart ->", JSON.stringify((await call({ a: "benchStart", j: 1, r: "1" })).data)); await show(" ");
  for (const bad of [{ a: "place", i: 9, k: "w" }, { a: "nope" }, { a: "deco", d: "d99" }, { a: "benchStart", j: 2, r: "1" }, { a: "collect", i: 1 }]) { try { const r = await call(bad); console.log("bad", JSON.stringify(bad), "->", JSON.stringify(r.data)); } catch (e) { console.log("bad", JSON.stringify(bad), "->", e.code, e.message); } }
  await db.ref(`base/${uid}/s1/t`).set(now - 3 * 7200000 - 5000);
  console.log("collect ->", JSON.stringify((await call({ a: "collect", i: 1 })).data)); await show(" ");
  await db.ref(`users/${uid}/zone`).set("ruins");
  try { await call({ a: "place", i: 2, k: "m" }); console.log("wrong zone ALLOWED (bad)"); } catch (e) { console.log("wrong zone ->", e.code, e.message); }
  // concurrency: 5 parallel collects on a ready slot → exactly one succeeds in gaining
  await db.ref(`users/${uid}/zone`).set("safe"); await db.ref(`base/${uid}/s1/t`).set(now - 2 * 7200000 - 5000);
  const before = (await db.ref(`inventory/${uid}/water/qty`).get()).val();
  const rs = await Promise.allSettled(Array.from({ length: 5 }, () => call({ a: "collect", i: 1 })));
  const gained = rs.filter((r) => r.status === "fulfilled" && r.value.data.n > 0).length, after = (await db.ref(`inventory/${uid}/water/qty`).get()).val();
  console.log("parallel collect: successes with gain =", gained, " water", before, "->", after, "(expect gain=1, +2)", rs.map((r) => r.status === "fulfilled" ? "ok:" + r.value.data.n : r.reason.code).join(","));
  process.exit(0);
})().catch((e) => { console.error("E2E FAIL", e.code, e.message); process.exit(1); });
