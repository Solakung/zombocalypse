const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs");
const part = fs.readFileSync("clientpart.js", "utf8");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const pg = await b.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await pg.setContent(`<body><div id="toast"></div><button id="btn-profile">p</button><button id="btn-ck">c</button></body>`);
  const R = await pg.evaluate(async (part) => {
    const out = {};
    const $ = (i) => document.getElementById(i);
    function mk(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
    function btn(label, fn, cls = "btn primary mini") { const b = mk("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
    const toast = (m) => { out.toast = m; }, logLine = (t) => { (out.logs = out.logs || []).push(t); }, sfx = () => {}, stat = () => {}, achFlush = async () => {};
    let bumps = []; const achBump = (k) => bumps.push(k);
    const ITEMS = { water: { name: "น้ำ", icon: "💧" }, bandage: { name: "ผ้า", icon: "🩹" } };
    const mRew = (l) => l.map(([id, q]) => `${ITEMS[id]?.icon || "📦"}${ITEMS[id]?.name || id} ×${q}`).join(" ");
    const seaDef = () => ({ icon: "🌧️", name: "ฤดูฝน" }), serverNow = () => 1000;
    const state = { profile: { hp: 50 }, ach: { loaded: true }, zone: "ruins", inv: { bandage: { id: "bandage", qty: 2 } } };
    let calls = [];
    const P = { ok: true, s: 0, xp: 130, tierXp: 100, tiers: 30, tc: { 1: 1 }, rew: Array.from({ length: 30 }, () => [["water", 2]]), d: [{ id: "d1", t: "🔍 ค้นหา", n: 5, v: 5, xp: 25, done: true, got: false }], w: [{ id: "w1", t: "x", n: 5, v: 2, xp: 80, done: false, got: false }], dEnd: 90000000, wEnd: 99999999, sEnd: 199999999 };
    const passCall = async (d) => { calls.push(d); return d.a === "claimTier" ? { ...P, rewarded: [["water", 2]] } : P; };
    const eventCall = async (d) => { calls.push(d); if (d.a === "choose") return { ok: true, x: "ผลลัพธ์", hp: -5, got: [["water", 1]], paid: ["bandage", 1] }; return { ok: true, enc: { id: "x", t: "T", d: "D", o: [{ i: 0, l: "A", need: ["bandage", 1] }, { i: 1, l: "B", need: ["bandage", 9] }] } }; };
    eval(part + "; window.__t = { passTick, passOpen, passRender, passClaim, encAfterSearch, encShow, passDot, passBtn };");
    const T = window.__t;
    T.passTick(); await new Promise((r) => setTimeout(r, 50));
    out.btn = $("btn-pass") && $("btn-pass").textContent; out.dot = $("btn-pass").classList.contains("btn-dot");
    T.passOpen(); await new Promise((r) => setTimeout(r, 50));
    out.body = $("pass-body").innerText.slice(0, 260); out.claims = [...$("pass-body").querySelectorAll("button")].map((b) => b.textContent).join("|");
    await T.passClaim({ a: "claimTier", t: 2 }); out.toastClaim = out.toast;
    out.encModalOpen = !$("enc-modal").classList.contains("hidden");   // peek เปิดให้ตอน passTick
    out.encBtns = [...$("enc-body").querySelectorAll("button")].map((b) => b.textContent + (b.disabled ? "[off]" : "")).join("|");
    $("enc-body").querySelector("button").click(); await new Promise((r) => setTimeout(r, 80));
    out.encResult = $("enc-body").innerText; out.bumps = bumps; out.calls = calls.map((c) => c.a + (c.t || "") + (c.i ?? ""));
    return out;
  }, part);
  console.log(JSON.stringify(R, null, 1)); console.log("pageerrors:", errs);
  await b.close();
})();
