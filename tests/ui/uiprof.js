const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("const FR_CSS = {"), sc.indexOf("/* =========================================================\n   49.4)"));
const rewSrc = sc.match(/const mRew = .*\n/)[0];
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 900 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  // รูปทดสอบจริง (webp เล็ก ๆ) ผ่าน data URL เป็น "ผลลัพธ์จาก Storage"
  const png = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#2a8"/><circle cx="48" cy="40" r="22" fill="#fd8"/><rect x="20" y="64" width="56" height="30" rx="14" fill="#fd8"/></svg>');
  const out = await pg.evaluate(async ([part, rewSrc, img]) => {
    document.querySelectorAll(".screen").forEach((x) => x.classList.remove("active")); const $ = (i) => document.getElementById(i);
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const state = { uid: "u1", profile: { username: "ผู้รอดชีวิตทดสอบ", faction: "human" } }; const out = {}; const calls = [];
    const A = (id, n, ic, ok, need) => ({ id, n, ic, ok, need: need || "" });
    let D = { ok: true, cur: { av: "av_wolf", fr: "fr_gold", bn: "bn_forest", ti: "ti_seeker" }, up: { t: 1, v: 1, kb: 64 }, hid: false, banned: false, nextUp: 0, avatars: [A("av_surv", "ผู้รอดชีวิต", "🧑‍🚒", true), A("av_wolf", "หมาป่า", "🐺", true), A("av_owl", "นกฮูก", "🦉", false, "ค้นหากลางคืน 100"), A("av_gas", "หน้ากาก", "😷", true)], frames: ["fr_none", "fr_tan", "fr_gold", "fr_neon", "fr_royal", "fr_dash"].map((id, i) => A(id, id.slice(3), null, i < 4, i < 4 ? "" : "ถูกใจห้อง 10")), banners: Object.keys({ bn_dusk: 1, bn_night: 1, bn_forest: 1, bn_gold: 1, bn_aurora: 1, bn_fire: 1 }).map((id, i) => A(id, id.slice(3), null, i < 4, "Season Pass ระดับ 15")), titles: [A("ti_none", "ไม่มีฉายา", null, true), A("ti_seeker", "นักค้นของ", null, true), A("ti_full", "ผู้รอดชีวิตเต็มตัว", null, false, "ความสมบูรณ์ 100%")] };
    const profCall = async (d) => { calls.push(d); if (d.a === "set") { Object.keys(d).filter((k) => k !== "a" && k !== "useUp").forEach((k) => { D = { ...D, cur: { ...D.cur, [k]: d[k] } }; }); } if (d.a === "commit") D = { ...D, up: { t: 2, v: 2, kb: 58 } }; if (d.a === "removeUp") D = { ...D, up: null }; if (d.a === "visit") return { ok: true, self: false, reported: false, canGm: true, card: { name: "เพื่อนบ้าน", fac: "human", av: "av_fox", avic: "🦊", fr: "fr_neon", bn: "bn_aurora", tin: "นักดิ่งลึก", up: { v: 3, t: 1 }, uu: true, hid: false } }; if (d.a === "report") return { ok: true, hidden: false }; return D; };
    const getDownloadURL = async () => img, sref = () => 0, storage = 0, uploadBytes = async () => { calls.push({ a: "upload" }); }, fnErr = () => "err", toast = (m) => { out.toast = m; }, logLine = () => {}, passMs = () => "30 นาที", showBio = () => {}, confirm = () => true, showToast = 0;
    const api = new Function("state", "mk", "btn", "$", "profCall", "getDownloadURL", "sref", "storage", "uploadBytes", "fnErr", "toast", "logLine", "passMs", "showBio", "confirm", part + ";\nreturn { profOpen, profRender, profVisitFill, profCardEl, profGo };")(state, mk, btn, $, profCall, getDownloadURL, sref, storage, uploadBytes, fnErr, toast, logLine, passMs, showBio, confirm);
    api.profOpen(); await new Promise((r) => setTimeout(r, 200)); out.dbg = [!!$("pcard-modal"), !!$("pcard-body"), document.body.innerHTML.length];
    out.sections = [...$("pcard-body").querySelectorAll("b")].map((b) => b.textContent);
    out.imgLoaded = !!$("pcard-body").querySelector("img");
    const lockedBtn = [...$("pcard-body").querySelectorAll("button")].find((b) => b.textContent.includes("🔒")); lockedBtn.click(); out.lockedToast = out.toast;
    [...$("pcard-body").querySelectorAll("button")].find((b) => b.textContent.includes("หน้ากาก")).click(); await new Promise((r) => setTimeout(r, 150)); out.setCall = calls.filter((c) => c.a === "set").pop();
    [...$("pcard-body").querySelectorAll("button")].find((b) => b.textContent.includes("เปลี่ยนรูป")); out.hasUploadBtn = !![...$("pcard-body").querySelectorAll("button")].find((b) => b.textContent.includes("รูป"));
    out.hscroll = document.documentElement.scrollWidth > innerWidth; out.small = [...$("pcard-body").querySelectorAll("button")].filter((b) => b.getBoundingClientRect().height < 40).length;
    const bm = $("bio-modal"); bm.classList.remove("hidden");
    out.pre = [!!$("bio-text"), $("bio-modal").className, JSON.stringify(await profCall({ a: "visit", uid: "u2" })).slice(0, 60)]; try { await api.profVisitFill("u2"); } catch (e) { out.visitErr = String(e); } await new Promise((r) => setTimeout(r, 200)); out.bioCard = !!$("bio-card"); out.bioHtml = bm.innerHTML.slice(0, 80); out.bioBtns = [...(($("bio-card")) || bm).querySelectorAll("button")].map((b) => b.textContent);
    return out;
  }, [part, rewSrc, png]);
  await pg.screenshot({ path: "shots/prof.png", fullPage: true });
  console.log(JSON.stringify(out, null, 1)); console.log("errors:", errs); await br.close();
})();
