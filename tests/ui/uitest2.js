const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const part = fs.readFileSync("clientpart2.js", "utf8");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const pg = await b.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.setContent(`<body><div id="toast"></div><button id="btn-profile">p</button></body>`);
  const R = await pg.evaluate(async (part) => {
    const out = {}; const $ = (i) => document.getElementById(i);
    function mk(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
    function btn(label, fn, cls = "btn primary mini") { const b = mk("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
    const toast = (m) => { out.toast = m; }, logLine = () => {}, sfx = () => {}, achFlush = async () => {}, passMs = () => "1 ชม.", fnErr = () => "err", serverNow = () => 0;
    const ZONES = { ruins: { name: "ซากเมือง" } }, PET_K = { dog: { icon: "🐕", name: "หมา" } };
    const mRew = (l) => l.map(([id, q]) => `${id}×${q}`).join(" ");
    const state = { profile: {}, ach: { loaded: true }, zone: "safe" };
    const camp = { ok: true, base: 1, perks: [{ id: "p1", icon: "🔭", name: "หอ", tip: "t", eff: { z: -0.02 }, lv: 2, max: 5, next: [["scrap", 36]] }, { id: "p4", icon: "🩹", name: "พยาบาล", tip: "t", eff: { cut: 0.01 }, lv: 3, max: 5, next: null }], pet: { k: "dog", lv: 3, claims: 12, eff: { n: -0.02 } } };
    const dailyCall = async (d) => d.s === "crate" ? (d.a === "open" ? { ok: true, claimed: true, st: 1, day: 1, got: ["water", 2], end: 1 } : { ok: true, claimed: false, st: 3, day: 4, end: 1 }) : { ok: true, name: "สารวัตร", zone: "ruins", n: 4, rew: [["scrap", 6]], acc: true, v: 4, done: true, got: false, end: 1 };
    const worldCall = async () => ({ ok: true, icon: "🚚", name: "ขน", say: "s", unit: "ชิ้น", per: 120, goal: 600, tot: 300, np: 5, mine: 50, min: 30, end: 1, ms: [{ i: 0, p: 0.4, need: 240, ok: true, got: false, rew: [["water", 1]] }, { i: 1, p: 0.7, need: 420, ok: false, got: false, rew: [["water", 1]] }] });
    const campCall = async () => camp;
    eval(part + "; window.__t = { actTick, actOpen, actRender, fxPerkMods, fxPerkCut, acs };");
    const T = window.__t; T.actTick(); await new Promise((r) => setTimeout(r, 60));
    out.btn = !!$("btn-act"); out.dot = $("btn-act").classList.contains("btn-dot");
    const m = { z: 1, n: 1, r: 1, f: 1, w: 1, a: 1, rm: 1, sc: 1, it: {} }; T.fxPerkMods(m); out.mods = { z: m.z, n: m.n }; out.cut = T.fxPerkCut();
    T.actOpen(); await new Promise((r) => setTimeout(r, 60)); out.crate = $("act-body").innerText.slice(0, 160);
    const tabs = [...$("act-tabs").querySelectorAll("button")]; out.tabs = tabs.map((t) => t.textContent);
    for (const i of [1, 2, 3]) { tabs[i].click(); await new Promise((r) => setTimeout(r, 80)); out["tab" + i] = $("act-body").innerText.replace(/\n/g, " | ").slice(0, 230); }
    return out;
  }, part);
  console.log(JSON.stringify(R, null, 1)); console.log("pageerrors:", errs); await b.close();
})();
