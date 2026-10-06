// 📰 มีอะไรใหม่ (changelog): แสดงครั้งเดียวต่อรายการ • ผู้เล่นใหม่ไม่เห็น • เปิดซ้ำจากปุ่มได้ • ไม่ล้นจอ 360px • ข้อความไม่ถูกตีความเป็น HTML
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 📰 มีอะไรใหม่"), sc.indexOf("// ---- /มีอะไรใหม่"));
const logJson = fs.readFileSync(R + "changelog.json", "utf8");
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true }); const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part, logJson }) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const $ = (id) => document.getElementById(id); const store = {}; const LS = { get: (k, d) => (k in store ? store[k] : d), set: (k, v) => { store[k] = v; } }, lsKey = (n) => "zc_u_" + n;
    let feed = JSON.parse(logJson); feed.entries.unshift({ id: "2026-10-07", date: "7 ต.ค.", title: "<b>ทดสอบ</b>", items: [{ k: "ปรับ", t: "<img src=x onerror=window.__pwn=1> ข้อความทดสอบ" }, "ข้อความล้วน"] });
    window.fetch = async () => ({ ok: true, json: async () => feed });
    const state = { profile: { createdAt: Date.now() - 86400000 * 5 } }, serverNow = () => Date.now();
    const api = new Function("$", "mk", "LS", "lsKey", "state", "serverNow", part + ";return { clogOpen, clogAuto, clogLoad };")($, mk, LS, lsKey, state, serverNow);
    const modal = $("clog-modal"), res = {};
    res.first = await api.clogOpen(true); res.visible1 = !modal.classList.contains("hidden"); res.text1 = $("clog-body").innerText.replace(/\n/g, " | ");
    res.entries1 = $("clog-body").querySelectorAll("ul").length; res.xss = !!window.__pwn; res.saved = store["zc_u_clog"];
    const sx = document.documentElement.scrollWidth > innerWidth; res.hscroll1 = sx;
    $("clog-close").click(); res.hidden = modal.classList.contains("hidden");
    res.second = await api.clogOpen(true);   // เห็นแล้ว → ไม่เด้งซ้ำ
    $("guide-modal").classList.remove("hidden"); $("clog-open").click(); await new Promise((r) => setTimeout(r, 100));
    res.manual = !modal.classList.contains("hidden") && !$("guide-modal").classList.contains("hidden") === false; res.entriesAll = $("clog-body").querySelectorAll("ul").length; $("clog-close").click();
    // ผู้เล่นใหม่ (สร้างตัวเมื่อกี้): ไม่เด้ง แต่บันทึกว่าเห็นแล้ว
    delete store["zc_u_clog"]; state.profile.createdAt = Date.now() - 1000; await api.clogAuto(); res.newPlayerShown = !modal.classList.contains("hidden"); res.newPlayerSaved = store["zc_u_clog"];
    // มีหน้าต่างอื่นเปิดอยู่: ไม่ทับ
    delete store["zc_u_clog"]; state.profile.createdAt = Date.now() - 86400000; $("guide-modal").classList.remove("hidden"); await api.clogAuto(); res.blockedByOther = modal.classList.contains("hidden"); $("guide-modal").classList.add("hidden");
    // ไฟล์หาย/พัง: ไม่ error ไม่เด้ง
    window.fetch = async () => { throw new Error("offline"); }; res.offline = await api.clogOpen(true);
    window.fetch = async () => ({ ok: true, json: async () => ({ entries: "x" }) }); res.badFile = await api.clogOpen(true);
    return res;
  }, { part, logJson });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.first, true); assert(out.visible1); assert(out.text1.includes("ทดสอบ") && out.text1.includes("อัปเดตล่าสุด")); assert.strictEqual(out.xss, false, "html must not execute"); assert.strictEqual(out.saved, "2026-10-07");
  assert.strictEqual(out.hscroll1, false); assert(out.hidden); assert.strictEqual(out.second, false); assert(out.entriesAll >= 2); assert.strictEqual(out.newPlayerShown, false); assert.strictEqual(out.newPlayerSaved, "2026-10-07"); assert(out.blockedByOther);
  assert.strictEqual(out.offline, false); assert.strictEqual(out.badFile, false);
  // ภาพ 360px (รายการจริงจาก changelog.json)
  await pg.evaluate(({ part, logJson }) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const $ = (id) => document.getElementById(id); window.fetch = async () => ({ ok: true, json: async () => JSON.parse(logJson) });
    const api = new Function("$", "mk", "LS", "lsKey", "state", "serverNow", part + ";return { clogOpen };")($, mk, { get: () => "", set: () => {} }, (n) => n, { profile: {} }, () => Date.now()); return api.clogOpen(false);
  }, { part, logJson });
  await new Promise((r) => setTimeout(r, 200)); await pg.screenshot({ path: "/tmp/fbt/clog360.png" });
  console.log("UI CLOG OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
