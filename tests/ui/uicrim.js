// 🟠 สถานะส้ม (ฝั่งเกม) 360px — แถบแจ้ง/ปุ่มประกัน/การรายงาน/การเปิด-ปิดด้วย tune (รันโค้ดจริงจาก script.js ช่วงระหว่างเครื่องหมาย)
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🟠 สถานะส้ม"), sc.indexOf("// ---- /สถานะส้ม")); assert(part.length > 500, "slice");
// จุดที่ต้องมีในโค้ดส่วนอื่น (ตรวจแบบข้อความ — กันเผลอลบ)
for (const needle of ['z === "safe" && crimMe()', 'crimMe() ? "ruins" : "safe"', 'crimReport("victim", key)', 'crimReport("attacker", targetUid)', 'crimMark(c.key)', "!crimMe()) return toast"]) assert(sc.includes(needle), "missing: " + needle);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const $ = (id) => document.getElementById(id); document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active")); $("screen-game")?.classList.add("active");
    const calls = [], toasts = [], logs = []; let tune = {}, now = 1000000, script = [], ok = true;
    const state = { uid: "me", crim: {} }, T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), serverNow = () => now, toast = (m) => toasts.push(m), logLine = (t) => logs.push(t), hbMsg = (e) => String(e?.message || "");
    const crimCall = async (d) => { calls.push(d.a + (d.role ? ":" + d.role : "")); const r = script.shift(); if (r instanceof Error) throw r; return r; };
    const renderTravelState = () => {}, renderPlayers = () => {}, ref = () => ({}), onValue = () => {}, db = {}; let asked = null; const confirm = (m) => { asked = m; return ok; };
    const api = new Function("$", "state", "T", "serverNow", "toast", "logLine", "hbMsg", "crimCall", "renderTravelState", "renderPlayers", "ref", "onValue", "db", "confirm", part + ";return { crimOn, crimActive, crimMe, crimRed, crimMark, crimRender, crimReport, crimBail };")($, state, T, serverNow, toast, logLine, hbMsg, crimCall, renderTravelState, renderPlayers, ref, onValue, db, confirm);
    const res = {};
    api.crimRender(); res.hiddenNormal = $("crim-bar").classList.contains("hidden");
    state.crim = { me: { until: now + 90 * 60000, n: 2, ts: now }, other: { until: now - 1, n: 1, ts: now - 5 }, o2: { until: now + 60000, n: 1, ts: now } };
    res.act = [api.crimActive("me"), api.crimActive("other"), api.crimActive("o2"), api.crimActive("nobody")].join(","); res.me = api.crimMe();
    api.crimRender(); res.shown = !$("crim-bar").classList.contains("hidden"); res.txt = $("crim-txt").textContent; res.noHs = document.documentElement.scrollWidth <= innerWidth;
    now += 89.5 * 60000; api.crimRender(); res.txt2 = $("crim-txt").textContent; now += 5 * 60000; api.crimRender(); res.hiddenAfter = $("crim-bar").classList.contains("hidden"); now -= 94.5 * 60000;
    // 🔴 แดง: ข้อความ/ปุ่มประกันซ่อน/เครื่องหมายในรายชื่อ
    state.crim = { me: { until: now + 360 * 60000, n: 3, ts: now, red: true }, o2: { until: now + 60000, n: 1, ts: now }, r3: { until: now - 1, n: 3, ts: now, red: true } }; api.crimRender(); res.redTxt = $("crim-txt").textContent; res.redBailHidden = $("crim-bail").classList.contains("hidden");
    res.marks = [api.crimMark("me"), api.crimMark("o2"), api.crimMark("r3"), api.crimMark("zz")].join("|"); state.crim = { me: { until: now + 90 * 60000, n: 2, ts: now }, other: {}, o2: {} }; api.crimRender(); res.orBailShown = !$("crim-bail").classList.contains("hidden");
    // รายงาน: ปิดอยู่ไม่เรียก / เปิดแล้วเรียก / error ไม่ throw
    await api.crimReport("victim", "x"); res.offCalls = calls.length; tune = { crim_on: 1 }; script = [{ ok: true }]; await api.crimReport("victim", "x"); await api.crimReport("attacker", ""); script = [new Error("boom")]; await api.crimReport("attacker", "y"); res.calls = calls.join(",");
    // จ่ายประกัน: ยืนยัน → เรียก state แล้ว bail
    calls.length = 0; script = [{ ok: true, active: true, bailPts: 40 }, { ok: true, pts: 40 }]; await api.crimBail(); res.bailCalls = calls.join(","); res.ask = asked; res.toast = toasts[toasts.length - 1];
    calls.length = 0; ok = false; script = [{ ok: true, active: true, bailPts: 40 }]; await api.crimBail(); res.cancelCalls = calls.join(",");
    calls.length = 0; ok = true; script = [{ ok: true, active: false }]; await api.crimBail(); res.notOrange = toasts[toasts.length - 1];
    calls.length = 0; script = [{ ok: true, active: true, bailPts: 20 }, Object.assign(new Error("วัตถุดิบไม่พอจ่ายค่าประกัน"), { code: "x" })]; await api.crimBail(); res.err = toasts[toasts.length - 1];
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert(out.hiddenNormal); assert.strictEqual(out.act, "true,false,true,false"); assert(out.me); assert(out.shown && out.txt.includes("~90 นาที") && out.noHs); assert(out.txt2.includes("~1 นาที")); assert(out.hiddenAfter);
  assert(out.redTxt.includes("🔴") && out.redTxt.includes("~360 นาที") && out.redTxt.includes("จ่ายค่าประกันไม่ได้")); assert(out.redBailHidden); assert.strictEqual(out.marks, " 🔴| 🟠||"); assert(out.orBailShown);
  assert.strictEqual(out.offCalls, 0); assert.strictEqual(out.calls, "report:victim,report:attacker"); assert.strictEqual(out.bailCalls, "state,bail"); assert(out.ask.includes("40 แต้ม")); assert(out.toast.includes("40")); assert.strictEqual(out.cancelCalls, "state"); assert(out.notOrange.includes("ไม่ได้เป็นส้ม")); assert(out.err.includes("วัตถุดิบไม่พอ"));
  console.log("UI CRIM OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
