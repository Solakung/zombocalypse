const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const scn = sc.slice(sc.indexOf("const SCN_POS = {"), sc.indexOf("function baseSceneOwn()"));
const decoSrc = sc.slice(sc.indexOf("const DECO = ["), sc.indexOf("const benchSlots"));
const gfx = sc.slice(sc.indexOf("/* ---------- 🎨 กราฟิกแปลงปลูก"), sc.indexOf("function gardenRows(body)"));
const home = sc.slice(sc.indexOf("function homeItemsMap(D)"), sc.indexOf("/* =========================================================\n   49.4)"));
const rewSrc = sc.match(/const mRew = .*\n/)[0];
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 1100 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ([decoSrc, gfx, scn, home, rewSrc]) => {
    document.querySelectorAll(".screen").forEach((x) => x.classList.remove("active"));
    const out = {}; const $ = (i) => document.getElementById(i);
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const state = { profile: { faction: "human" }, zone: "safe" }, ITEMS = { scrap: { name: "เศษ", icon: "🧵" }, herb_bundle: { name: "สมุนไพร", icon: "🌾" } };
    const catalog = [["d5", "🪑", "เก้าอี้โยก", "f", 38, "old", null], ["d11", "🌌", "โคมไฟดวงดาว", "w", 26, "old", null], ["cot", "🛏️", "เตียงสนาม", "f", 40, "surv", ["scrap", 18]], ["flag", "🏴", "ธงผู้รอดชีวิต", "w", 30, "surv", ["scrap", 12]], ["sunflower", "🌻", "ทานตะวัน", "f", 34, "gard", ["herb_bundle", 8]], ["crown", "👑", "มงกุฎผู้ชนะ", "a", 28, "fest", null]].map(([id, ic, n, z, sz, cat, cost]) => ({ id, ic, n, z, sz, cat, cost }));
    let D = { ok: true, slots: 6, lv: 1, own: { d5: 1, d11: 1, cot: 2, flag: 1, crown: 1 }, lay: [{ d: "d5", x: 246, y: 176 }], th: "plain", cap: null, likes: 3, wlikes: 1, wend: 1, catalog, cats: { old: "ของเดิม", surv: "ผู้รอดชีวิต", gard: "สวน/ธรรมชาติ", fest: "เทศกาล" }, caps: ["ยินดีต้อนรับ", "ทุกอย่างเรียบร้อย"], themes: [{ id: "plain", n: "ห้องเดิม", ic: "🏠", pal: null, cost: null, owned: true }, { id: "cozy", n: "อุ่นสบาย", ic: "🕯️", pal: ["#8a5a3a", "#76492e", "#a37a50", "#85603c", "#b94a3c", "#d1604f"], cost: ["scrap", 24], owned: true }, { id: "dusk", n: "ยามเย็น", ic: "🌇", pal: ["#6a5470", "#58445f", "#7a5a44", "#634833", "#d08a38", "#e6a24c"], cost: ["scrap", 30], owned: false }] };
    const calls = []; const homeCall = async (d) => { calls.push(d); if (d.a === "place") { D = { ...D, lay: d.lay, th: d.th, cap: d.cap }; return D; } if (d.a === "top") return { ok: true, end: 1, cur: [{ uid: "u1", name: "สมชาย", fac: "human", v: 7 }], prev: [], canClaim: false }; return D; };
    const window2 = { };
    const api = new Function("state", "ITEMS", "mk", "btn", "$", "homeCall", "toast", "logLine", "achBump", "baseCan", "baseAgain", "baseSceneOwn", "mRew2", "passMs", "serverNow", "fnErr", "showBio", "fxMoon", "confirm", "seedLbl", decoSrc + ";\n" + gfx + ";\n" + scn + ";\n" + rewSrc + ";\n" + home + ";\nreturn { homeEdit, baseSceneSvg, homeVisitFill, homeLoad, homeDraftInit, getDraft: () => state.homeDraft };");
    let ctr; const baseAgain = () => { ctr(); };
    const hostSc = mk("div"), hostBody = mk("div"); const wrap = mk("div"); wrap.id = "wrap"; wrap.style.cssText = "padding:8px;background:#171a1e;width:360px"; wrap.append(hostSc, hostBody); document.body.append(wrap);
    state.homeD = D; const fns = api(state, ITEMS, mk, btn, $, homeCall, (m) => { out.toast = m; }, () => {}, (k) => { out.bump = k; }, () => true, baseAgain, () => ({ lv: 1, deco: {}, zombie: false, uid: "u1", stations: [{ k: "w", u: 1, cap: 4 }, {}, {}, { locked: true }, { locked: true }], bench: [{ state: "empty" }, { state: "locked" }] }), null, (x) => "1 ชม.", () => 0, () => "err", () => {}, () => "full", () => true, () => null);
    ctr = () => { hostSc.innerHTML = ""; hostBody.innerHTML = ""; fns.homeEdit(hostSc, hostBody); };
    ctr();
    const svg = () => hostSc.querySelector("svg"), tap = (x, y) => { const r = svg().getBoundingClientRect(); hostSc.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: r.left + x / 320 * r.width, clientY: r.top + y / 200 * r.height })); };
    out.trayBefore = [...hostBody.querySelectorAll("button")].filter((b) => b.textContent.includes("×")).map((b) => b.textContent);
    // เลือกเตียง แล้วแตะวาง 2 จุด
    const pick = (t) => [...hostBody.querySelectorAll("button")].find((b) => b.textContent.includes(t)).click();
    pick("เตียงสนาม"); tap(120, 170); out.afterPlace1 = fns.getDraft().lay.length; tap(40, 60);   // แตะ y=60 ที่พื้นไม่ได้ → ถูกหนีบเข้าโซนพื้น (y>=128)
    out.clampedY = fns.getDraft().lay.map((e) => e.y);
    pick("ธงผู้รอดชีวิต"); tap(200, 40); out.flagY = fns.getDraft().lay.find((e) => e.d === "flag").y;   // ผนัง
    tap(246, 170);   // แตะเก้าอี้ที่วางแล้ว = เลือก
    out.sel = fns.getDraft().sel; [...hostBody.querySelectorAll("button")].find((b) => b.textContent.includes("ลบที่เลือก")).click(); out.afterDelete = fns.getDraft().lay.length;
    // เกินช่อง (slots 6): ตั้ง slots เล็กแล้ววาง
    D.slots = 3; state.homeD = D; ctr(); pick("เตียงสนาม"); tap(30, 160); out.toastLimit = out.toast;
    // เลือกธีม + บันทึก
    [...hostBody.querySelectorAll("button")].find((b) => b.textContent.includes("อุ่นสบาย")).click();
    out.dirtyLabel = [...hostBody.querySelectorAll("button")].map((b) => b.textContent).find((t) => t.includes("บันทึกห้อง"));
    [...hostBody.querySelectorAll("button")].find((b) => b.textContent.includes("บันทึกห้อง")).click(); await new Promise((r) => setTimeout(r, 120));
    out.saved = calls.filter((c) => c.a === "place").map((c) => ({ n: c.lay.length, th: c.th })); out.bump2 = out.bump;
    out.shop = hostBody.querySelector("details").innerText.replace(/\n/g, " | ").slice(0, 200);
    out.svgOK = !!svg() && svg().querySelectorAll("g.it").length;
    out.hscroll = document.documentElement.scrollWidth > innerWidth;
    out.smallBtns = [...hostBody.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().height < 34).length;
    return out;
  }, [decoSrc, gfx, scn, home, rewSrc]);
  await pg.screenshot({ path: "shots/home_edit.png", fullPage: true });
  console.log(JSON.stringify(out, null, 1)); console.log("errors:", errs); await br.close();
})();
