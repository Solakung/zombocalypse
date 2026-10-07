// 💰 ค่าหัวใหม่ (ฝั่งเกม) 360px — สูตรลดตามเวลา, ตั้ง/เก็บ, แถวค่าหัวในหน้าโลก (รันโค้ดจริงจาก script.js ช่วงระหว่างเครื่องหมาย)
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 💰 ค่าหัวแบบใหม่"), sc.indexOf("// ---- /ค่าหัวใหม่")); assert(part.length > 500, "slice");
for (const needle of ["bty2On() ? btn(bty2Pts(c.key)", 'bty2Claim("killer", targetUid)', 'bty2Claim("victim", key)', "(bty2On() ? bty2WorldRows : bountyWorldRows)(box)", "if (bty2On()) return;   // ค่าหัวใหม่"]) assert(sc.includes(needle), "missing: " + needle);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const calls = [], toasts = [], bumps = []; let tune = {}, now = 10 * 86400000, script = [], ok = true, asked = null;
    const state = { uid: "me", profile: { hp: 100, username: "me" }, bty: {} }, T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), serverNow = () => now, toast = (m) => toasts.push(m), hbMsg = (e) => String(e?.message || ""), achBump = (k) => bumps.push(k);
    const bountyCall = async (d) => { calls.push(d.a + (d.role ? ":" + d.role : "")); const r = script.shift(); if (r instanceof Error) throw r; return r; };
    const confirm = (m) => { asked = m; return ok; };
    const stubs = { mk, state, T, serverNow, toast, hbMsg, achBump, confirm, httpsCallable: () => () => Promise.resolve({ data: {} }), fns: {}, ref: () => ({}), onValue: () => {}, db: {}, lsKey: (k) => k, LS: { get: () => 0, set: () => {} }, radioPush: () => {}, questBump: () => {}, worldRefresh: () => {}, renderPlayers: () => {} };
    const names = Object.keys(stubs), api = new Function(...names, part.replace('const bountyCall = (data) => httpsCallable(fns, "bountyAct")(data).then((r) => r.data);', "") + ";return { bty2On, bty2Eff, bty2Pts, bty2Place, bty2Claim, bty2WorldRows };")(...names.map((n) => stubs[n]));
    // bountyCall ถูกตัดออกจาก part → ประกาศใหม่ในขอบเขตเดียวกัน
    const api2 = new Function(...names, "bountyCall", part.replace('const bountyCall = (data) => httpsCallable(fns, "bountyAct")(data).then((r) => r.data);', "") + ";return { bty2On, bty2Eff, bty2Pts, bty2Place, bty2Claim, bty2WorldRows };")(...names.map((n) => stubs[n]), bountyCall);
    const res = {}; res.off = api2.bty2On(); tune = { bty2_on: 1 }; res.on = api2.bty2On();
    state.bty = { a: { pts: 100, ts: now - 10 * 86400000, tn: "A", bn: "x" }, me: { pts: 40, ts: now, tn: "me", bn: "y" }, k: { pts: 0, ts: now - 1000, tn: "K", bn: "z", kb: "hunter", kts: now - 5000, paid: 32 }, old: { pts: 5, ts: now - 90 * 86400000, tn: "O", bn: "z" } };
    res.eff = [api2.bty2Pts("a"), api2.bty2Pts("me"), api2.bty2Pts("k"), api2.bty2Pts("old"), api2.bty2Pts("nobody")].join(",");
    const box = document.createElement("div"); document.body.prepend(box); api2.bty2WorldRows(box); res.rows = box.innerText.replace(/\n+/g, " | "); res.noHs = document.documentElement.scrollWidth <= innerWidth;
    script = [{ ok: true, pts: 50 }]; await api2.bty2Place("t", "เป้า"); res.place = calls.join(",") + " / " + toasts[toasts.length - 1] + " / " + bumps.join(","); res.ask = asked;
    ok = false; calls.length = 0; await api2.bty2Place("t", "เป้า"); res.cancel = calls.length; ok = true;
    script = [Object.assign(new Error("ค่าหัวคนนี้เต็มเพดาน 200 แต้มแล้ว"), { code: "x" })]; await api2.bty2Place("t", "เป้า"); res.err = toasts[toasts.length - 1];
    calls.length = 0; script = [{ ok: true, claimed: true, who: "me", target: "ศัตรู", pay: 40 }]; await api2.bty2Claim("killer", "v"); res.claimKiller = toasts[toasts.length - 1];
    script = [{ ok: true, claimed: true, who: "other", target: "ศัตรู", pay: 40 }]; const n = toasts.length; await api2.bty2Claim("victim", "k"); res.victimQuiet = toasts.length === n;
    script = [new Error("กระเป๋าเต็ม")]; await api2.bty2Claim("victim", "k"); res.victimErrQuiet = toasts.length === n; script = [new Error("กระเป๋าเต็ม")]; await api2.bty2Claim("killer", "k"); res.killerErr = toasts[toasts.length - 1];
    tune = {}; calls.length = 0; await api2.bty2Claim("killer", "k"); res.offCalls = calls.length;
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert(!out.off && out.on); assert.strictEqual(out.eff, "70,40,0,0,0"); assert(out.rows.includes("A — 70 แต้ม") && out.rows.includes("me (คุณ!) — 40 แต้ม") && out.rows.includes("K ถูก hunter เก็บค่าหัวแล้ว") && !out.rows.includes("O —") && out.noHs);
  assert(out.place.startsWith("place / ") && out.place.includes("50 แต้ม") && out.place.endsWith("btyset")); assert(out.ask.includes("+10 แต้ม") && out.ask.includes("ตอนนี้ 0 แต้ม")); assert.strictEqual(out.cancel, 0); assert(out.err.includes("เต็มเพดาน")); assert(out.claimKiller.includes("40 แต้ม"));
  assert(out.victimQuiet && out.victimErrQuiet); assert(out.killerErr.includes("กระเป๋าเต็ม")); assert.strictEqual(out.offCalls, 0);
  console.log("UI BOUNTY OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
