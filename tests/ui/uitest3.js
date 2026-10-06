const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const part = fs.readFileSync("clientpart3.js", "utf8");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
  const pg = await b.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.setContent(`<body><div id="toast"></div><button id="btn-profile">p</button></body>`);
  const R = await pg.evaluate(async (part) => {
    const out = {}; const $ = (i) => document.getElementById(i);
    function mk(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; }
    function btn(label, fn, cls = "btn primary mini") { const b = mk("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
    const toast = (m) => { out.toast = m; }, logLine = () => {}, achBump = () => {}, passMs = () => "1 ชม.", fnErr = () => "err", serverNow = () => 0, encHave = () => 5, equippedWeapon = () => ({ def: { dmg: 12 } }), weaponBonus = () => 2;
    const mRew = (l) => l.map(([id, q]) => `${id}×${q}`).join(" ");
    const state = { profile: { hp: 50 }, ach: { loaded: true }, zone: "tunnel" };
    let nemChosen = null;
    const diveCall = async (d) => d.a === "start" ? { ok: true, on: true, fl: 1, stab: 100, loot: [], max: 12, best: 3, runsLeft: 5, entry: ["scrap", 2], cd: 0, opts: [{ i: 0, k: "sneak", icon: "🥷", l: "ย่อง", p: 88, r: 1 }, { i: 1, k: "fight", icon: "⚔️", l: "สู้", p: 58, r: 3 }] } : { ok: true, on: false, best: 3, runsLeft: 6, entry: ["scrap", 2], cd: 0, max: 12 };
    const nemCall = async (d) => d.a === "choose" ? (nemChosen = d, { ok: true, win: true, msg: "ชนะ", lv: 2, again: false, loot: [["scrap", 2]] }) : { ok: true, nem: d.a === "peek" ? { name: "เขี้ยวดำ", lv: 2, kills: 1, esc: 0, trait: "กลัวไฟ", tip: "t", opts: [{ k: "fight", l: "สู้", p: 50 }, { k: "weak", l: "จุดอ่อน", p: 82, need: ["fuel_can", 1] }] } : null };
    const radioCall = async () => ({ ok: true, zone: "tunnel", zoneTh: "อุโมงค์", slot: "หลักที่สอง", heard: false, solved: false, clues: [], solvers: 2, bigLeft: 8, guessesLeft: 5, end: 1 });
    const caravanCall = async () => ({ ok: true, open: true, here: true, who: "ลุงฮวด", until: 1, goods: [{ key: "serum", id: "serum", q: 2, cost: [["chem", 6]], left: 3, bought: false }] });
    eval(part + "; window.__t = { advTick, advOpen, advRender, adv };");
    const T = window.__t; T.advTick(); await new Promise((r) => setTimeout(r, 80));
    out.nemModal = !$("nem-modal").classList.contains("hidden"); out.nemBtns = [...$("nem-body").querySelectorAll("button")].map((x) => x.textContent).join("|");
    $("nem-body").querySelectorAll("button")[1].click(); await new Promise((r) => setTimeout(r, 80)); out.nemRes = $("nem-body").innerText.replace(/\n/g, " | "); out.nemChosen = nemChosen;
    $("nem-modal").classList.add("hidden");
    T.advOpen(); await new Promise((r) => setTimeout(r, 80)); out.dive = $("adv-body").innerText.replace(/\n/g, " | ").slice(0, 200);
    const tabs = () => [...$("adv-tabs").querySelectorAll("button")];
    [...$("adv-body").querySelectorAll("button")].find((x) => x.textContent === "เริ่มดิ่ง").click(); await new Promise((r) => setTimeout(r, 80)); out.diveOn = $("adv-body").innerText.replace(/\n/g, " | ").slice(0, 330);
    for (const i of [2, 3]) { tabs()[i].click(); await new Promise((r) => setTimeout(r, 80)); out["tab" + i] = $("adv-body").innerText.replace(/\n/g, " | ").slice(0, 260); }
    out.dot = $("btn-adv").classList.contains("btn-dot");
    return out;
  }, part);
  console.log(JSON.stringify(R, null, 1)); console.log("pageerrors:", errs); await b.close();
})();
