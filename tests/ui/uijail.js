// ⛓️ คุก (ฝั่งเกม) 360px — แถบคุก/ปุ่ม, ซิงก์โซน (เข้าคุก/ออกคุก), จับ/แหกคุก/ประกัน/ทำงาน (รันโค้ดจริงจาก script.js ช่วงระหว่างเครื่องหมาย)
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- ⛓️ คุก"), sc.indexOf("// ---- /คุก")); assert(part.length > 500, "slice");
for (const needle of ['state.zone === "jail") return toast("⛓️ คุณติดคุกอยู่', 'const rz = exempt || jailActive() ? "jail"', 'jailCapture("killer", targetUid)', 'jailCapture("victim", key)', 'Object.defineProperty(ZONES, "jail"', 'z === "casino" || z === "jail"', '&& state.zone !== "jail") {\n        const ab = btn("โจมตี"', "const exempt = jailOn() && (jailActive()", "if (!exempt) DEATH_STACK.forEach", "if (!exempt) { const en = evoDeathWrites(u)", "state.jailWait = new Promise", "jailWorldRows(box); fxWorldRows(box)"]) assert(sc.includes(needle), "missing: " + needle);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const $ = (id) => document.getElementById(id); document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active")); $("screen-game")?.classList.add("active");
    const wait = () => new Promise((r) => setTimeout(r, 30)), calls = [], toasts = [], logs = [], zones = [], dbw = []; let tune = {}, now = 1000000, script = [], ok = true;
    const state = { uid: "me", profile: { hp: 100, username: "me" }, zone: "ruins", players: { x: { name: "คนส้ม" } }, jail: null }, T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), serverNow = () => now, toast = (m) => toasts.push(m), logLine = (t) => logs.push(t), hbMsg = (e) => String(e?.message || "");
    const jailCall = async (d) => { calls.push(d.a + (d.role ? ":" + d.role : "")); const r = script.shift(); if (r instanceof Error) throw r; return r; };
    const enterZone = async (z) => { zones.push(z); state.zone = z; }, update = async (_, u) => { dbw.push(u); }, ref = () => ({}), onValue = () => {}, db = {}, ITEMS = { scrap: { name: "เศษเหล็ก" } }, confirm = () => ok;
    const crimActiveStub = () => false;
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }, btn = (txt, fn, cls) => { const b = mk("button", cls, txt); b.addEventListener("click", fn); return b; }, worldRefresh = () => {};
    const stubs = { mk, btn, worldRefresh, state, T, serverNow, toast, logLine, hbMsg, enterZone, update, ref, onValue, db, ITEMS, confirm, jailCall, $ };
    const names = Object.keys(stubs), api = new Function(...names, part.replace('const jailCall = (data) => httpsCallable(fns, "jailAct")(data).then((r) => r.data);', "") + ";return { jailOn, jailActive, jailRender, jailSync, jailAction, jailCapture, jailRescue, jailWorldRows };")(...names.map((n) => stubs[n]));
    const res = {}; res.off = api.jailOn(); tune = { jail_on: 1 }; res.on = api.jailOn(); api.jailRender(); res.hiddenNormal = $("jail-bar").classList.contains("hidden");
    // ถูกจับ → ซิงก์เข้าโซนคุก
    state.jail = { until: now + 30 * 60000, t: 2, tm: 60, w: 0 }; script = [{ ok: true, active: true, bailPts: 60, esc: 25 }]; await api.jailSync(); res.zones1 = zones.join(","); res.dbw = JSON.stringify(dbw[0]); res.log = logs[logs.length - 1];
    res.shown = !$("jail-bar").classList.contains("hidden"); res.txt = $("jail-txt").textContent; res.esc = $("jail-esc").textContent; res.bail = $("jail-bail").textContent; res.noHs = document.documentElement.scrollWidth <= innerWidth;
    // ทำงาน → เรียก work, ปุ่มพัก 20 วินาที
    script = [{ ok: true, until: state.jail.until - 120000, w: 2, ended: false }]; calls.length = 0; await api.jailAction("work"); await wait(); res.work = calls.join(",") + " / " + toasts[toasts.length - 1]; res.workDis = $("jail-work").disabled; now += 21000; api.jailRender(); res.workEn = !$("jail-work").disabled;
    // แหกคุกล้มเหลว → เวลาเพิ่ม ปุ่มพัก 5 นาที
    script = [{ ok: true, escaped: false, until: state.jail.until + 300000, lost: { id: "scrap", qty: 1 } }]; calls.length = 0; await api.jailAction("escape"); await wait(); res.escFail = toasts[toasts.length - 1]; res.escDis = $("jail-esc").disabled;
    // แหกคุกสำเร็จ → ซิงก์ย้ายออก (เซิร์ฟเวอร์ลบคุกแล้ว) ตามโซนที่เซิร์ฟเวอร์บอก
    state.jail = null; script = [{ ok: true, escaped: true, zone: "ruins" }, { ok: true, released: false, zone: "ruins" }]; calls.length = 0; zones.length = 0; await api.jailAction("escape"); await wait(); res.escOk = toasts.find((t) => t.includes("แหกคุกสำเร็จ")) + " / " + calls.join(",") + " / " + zones.join(",");
    // จ่ายประกัน: ยกเลิก → ไม่เรียก bail
    state.zone = "jail"; state.jail = { until: now + 600000, t: 1, tm: 30 }; ok = false; script = [{ ok: true, bailPts: 30 }]; calls.length = 0; await api.jailAction("bail"); res.bailCancel = calls.join(","); ok = true;
    script = [{ ok: true, bailPts: 30 }, { ok: true, released: true, zone: "safe", pts: 30 }, { ok: true, released: false, zone: "safe" }]; calls.length = 0; state.jail = null; await api.jailAction("bail"); await wait(); res.bail2 = calls.join(",") + " / " + toasts.find((t) => t.includes("ค่าประกัน") && t.includes("30 แต้มแล้ว"));
    // ครบเวลา → release ริบของ
    state.zone = "jail"; state.jail = null; script = [{ ok: true, released: true, zone: "safe", lost: { id: "scrap", qty: 1 } }]; calls.length = 0; zones.length = 0; await api.jailSync(); res.release = calls.join(",") + " / " + zones.join(",") + " / " + logs[logs.length - 1];
    // ปิดระบบ (jail_on = 0) แล้วค้างโซนคุก → ไม่เรียกเซิร์ฟเวอร์
    tune = {}; state.zone = "jail"; calls.length = 0; await api.jailSync(); res.offCalls = calls.length; tune = { jail_on: 1 };
    // จับ: ผู้ฆ่าเรียก/ผู้ถูกฆ่าเรียก → toast เฉพาะผู้จับ
    state.zone = "forest"; calls.length = 0; script = [{ ok: true, captured: true, by: "me", reward: { id: "scrap", qty: 2 } }]; await api.jailCapture("killer", "x"); res.cap = calls.join(",") + " / " + toasts[toasts.length - 1];
    const n = toasts.length; script = [{ ok: true, captured: true, by: "other" }]; await api.jailCapture("victim", "x"); res.capQuiet = toasts.length === n; script = [new Error("boom")]; await api.jailCapture("victim", "x"); res.capErrQuiet = toasts.length === n;
    // ช่วยแหกคุก: แถวผู้ต้องขัง (เหลือกี่นาที/แดง) • ปุ่มกดไม่ได้เมื่ออยู่ Safe Zone/ติดคุก • สำเร็จ/ล้มเหลว/ยกเลิก
    state.zone = "forest"; state.jail = null; state.profile.hp = 100; state.jailpub = { p1: { n: "เพื่อน", u: now + 20 * 60000, t: 2 }, p2: { n: "แดง", u: now + 90 * 60000, t: 1, red: true }, old: { n: "หมดแล้ว", u: now - 1, t: 1 }, me: { n: "ฉัน", u: now + 9 * 60000, t: 1 } };
    const box = document.createElement("div"); document.body.prepend(box); api.jailWorldRows(box); res.rows = box.innerText.replace(/\n+/g, " | "); res.btns = [...box.querySelectorAll("button")].map((b) => b.disabled).join(",");
    state.zone = "safe"; const box2 = document.createElement("div"); api.jailWorldRows(box2); res.safeBtns = [...box2.querySelectorAll("button")].map((b) => b.disabled).join(","); state.zone = "forest";
    tune = {}; const box3 = document.createElement("div"); api.jailWorldRows(box3); res.offRows = box3.children.length; tune = { jail_on: 1 };
    calls.length = 0; script = [{ ok: true, rescued: true, target: "เพื่อน" }]; await api.jailRescue("p1", "เพื่อน", state.jailpub.p1); await wait(); res.resOk = calls.join(",") + " / " + toasts.find((t) => t.includes("ช่วย เพื่อน แหกคุกสำเร็จ")) + " / " + logs[logs.length - 1];
    calls.length = 0; script = [{ ok: true, rescued: false, jailed: true, tm: 60 }]; await api.jailRescue("p2", "แดง", state.jailpub.p2); await wait(); res.resFail = calls.join(",") + " / " + toasts[toasts.length - 1];
    ok = false; calls.length = 0; await api.jailRescue("p1", "เพื่อน", state.jailpub.p1); res.resCancel = calls.length; ok = true;
    script = [Object.assign(new Error("เพิ่งลองช่วยแหกคุกไป รออีก 9 นาที"), { code: "x" })]; await api.jailRescue("p1", "เพื่อน", state.jailpub.p1); await wait(); res.resErr = toasts[toasts.length - 1];
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert(!out.off && out.on && out.hiddenNormal); assert.strictEqual(out.zones1, "jail"); assert.strictEqual(out.dbw, JSON.stringify({ "users/me/zone": "jail" })); assert(out.log.includes("ขังคุก")); assert(out.shown && out.txt.includes("~30 นาที") && out.txt.includes("ชั้นโทษ 2") && out.esc.includes("25%") && out.bail.includes("60 แต้ม") && out.noHs);
  assert(out.work.startsWith("work / ") && out.workDis && out.workEn); assert(out.escFail.includes("ล้มเหลว") && out.escFail.includes("เศษเหล็ก") && out.escDis); assert(out.escOk.includes("แหกคุกสำเร็จ") && out.escOk.includes("escape,release") && out.escOk.endsWith("ruins"));
  assert.strictEqual(out.bailCancel, "state"); assert(out.bail2.startsWith("state,bail,release")); assert(out.release.startsWith("release / safe / ") && out.release.includes("ถูกริบ เศษเหล็ก ×1")); assert.strictEqual(out.offCalls, 0); assert(out.cap.startsWith("capture:killer / ") && out.cap.includes("เศษเหล็ก ×2") && out.cap.includes("คนส้ม")); assert(out.capQuiet && out.capErrQuiet);
  assert(out.rows.includes("เพื่อน — เหลือ ~20 นาที (ชั้นโทษ 2)") && out.rows.includes("แดง 🔴 — เหลือ ~90 นาที") && !out.rows.includes("หมดแล้ว") && !out.rows.includes("ฉัน")); assert.strictEqual(out.btns, "false,false"); assert.strictEqual(out.safeBtns, "true,true"); assert.strictEqual(out.offRows, 0);
  assert(out.resOk.startsWith("rescue / ") && out.resOk.includes("ช่วย เพื่อน แหกคุกสำเร็จ")); assert(out.resFail.startsWith("rescue / ") && out.resFail.includes("ถูกขังไปด้วย") && out.resFail.includes("60")); assert.strictEqual(out.resCancel, 0); assert(out.resErr.includes("รออีก 9 นาที"));
  console.log("UI JAIL OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
