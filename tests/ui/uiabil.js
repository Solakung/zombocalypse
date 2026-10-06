const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("const abilLive = () =>"), sc.indexOf("/* =========================================================\n   49.47) 🪪"));
const rewSrc = sc.match(/const mRew = .*\n/)[0];
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ([part, rewSrc]) => {
    document.getElementById("screen-game").classList.add("active"); document.querySelectorAll(".screen").forEach((x) => { if (x.id !== "screen-game") x.classList.remove("active"); });
    const $ = (i) => document.getElementById(i), out = {}, calls = [];
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const state = { profile: { hp: 50 }, ach: { loaded: true }, uid: "me", players: { me: { name: "ฉัน", faction: "human" }, p1: { name: "สมชาย", faction: "human" }, z1: { name: "ซอมบี้", faction: "zombie" } } };
    const base = { ok: true, has: true, id: "explorer", L: 2, i: "🧭", n: "ส่องทาง", d: "ค้นแล้วว่างเปล่าน้อยลง", cost: ["scrap", 2], dur: 12, heal: 0, cdLeft: 0, live: null, aidLeft: 5 };
    let D = base; let serverT = 1000000;
    const abilCall = async (d) => { calls.push(d); if (d.a === "use") { D = { ...D, live: { id: "explorer", until: serverT + 720000, L: 2, eff: { n: 0.76, r: 1.16 } }, cdLeft: 4800000 }; return { ...D, used: true, n: "ส่องทาง", dur: 12, i: "🧭" }; } return D; };
    const warCall = async (d) => ({ ok: true, wk: 1, end: serverT + 86400000 * 3, fac: "human", h: 120, z: 180, mine: 40, min: 30, prev: { h: 90, z: 60, win: "h", mine: 55, canClaim: true, claimed: false, rew: [["medkit", 2]], won: true }, buff: { f: 1.06, w: 1.06, z: 0.94 }, buffOf: "h" });
    const anchor = mk("button", "btn primary wide", "ค้นหา"); anchor.id = "btn-scavenge"; document.querySelector('[data-panel="bag"]').prepend(anchor); document.querySelectorAll(".panel").forEach((p) => p.classList.add("tab-on"));
    const adv = { tab: "war" }; let fxMemo = { k: "", v: null };
    const api = new Function("state", "mk", "btn", "$", "abilCall", "warCall", "fnErr", "toast", "logLine", "achBump", "serverNow", "passMs", "adv", "advBtn", "advRender", "hubBtn", "seedLbl", "ITEMS", "fxMemo", part + ";\n" + rewSrc + ";\nreturn { abilTick, abilBar, fxAbilMods, fxAbilCut, abilDice, abilSync, warRender, abilLive, set fxMemo(v) {} };")(state, mk, btn, $, abilCall, warCall, () => "err", (m) => { out.toast = m; }, () => {}, (k) => { out.bump = k; }, () => serverT, (ms) => "2 วัน", adv, () => {}, () => {}, () => {}, () => null, { scrap: { name: "เศษ", icon: "🧵" } }, fxMemo);
    api.abilTick(); await new Promise((r) => setTimeout(r, 120)); api.abilBar();
    out.bar0 = $("abil-bar").innerText.replace(/\n/g, " | "); out.btns0 = [...$("abil-bar").querySelectorAll("button")].map((b) => b.textContent + (b.disabled ? "[off]" : ""));
    $("abil-bar").querySelector("button").click(); await new Promise((r) => setTimeout(r, 150)); out.afterUse = $("abil-bar").innerText.replace(/\n/g, " | "); out.used = calls.filter((c) => c.a === "use").length; out.toast1 = out.toast;
    const m = { n: 1, z: 1, r: 1, f: 1, w: 1, rm: 1, sc: 1, a: 1, it: {} }; api.fxAbilMods(m); out.mods = { n: m.n, r: m.r, f: +m.f.toFixed(2), z: +m.z.toFixed(2) };   // ความสามารถ + โบนัสศึก
    out.cut = api.fxAbilCut(); out.dice = api.abilDice();
    // หมอสนาม
    D = { ...base, id: "medic", i: "🩹", n: "ปฐมพยาบาล", heal: 36, cdLeft: 0, live: null }; state.abilD = D; state.abilAt = Date.now(); api.abilBar(); out.medicBtns = [...$("abil-bar").querySelectorAll("button")].map((b) => b.textContent);
    [...$("abil-bar").querySelectorAll("button")][1].click(); out.pickBtns = [...$("abil-pick-body").querySelectorAll("button")].map((b) => b.textContent); $("abil-pick-body").querySelector("button").click(); await new Promise((r) => setTimeout(r, 120)); out.healCall = calls.filter((c) => c.a === "use").pop();
    // ศึกใหญ่
    adv.war = await warCall({}); const cards = []; const card = (cls = "") => { const c = mk("div", "world-row" + cls); $("abil-bar").after(c); cards.push(c); return c; }; api.warRender(card);
    out.war = cards.map((c) => c.innerText.replace(/\n/g, " | ")).join(" ## ").slice(0, 520);
    out.hscroll = document.documentElement.scrollWidth > innerWidth; out.barH = Math.round($("abil-bar").getBoundingClientRect().height);
    return out;
  }, [part, rewSrc]);
  await pg.screenshot({ path: "shots/abil.png" });
  console.log(JSON.stringify(out, null, 1)); console.log("errors:", errs); await br.close();
})();
