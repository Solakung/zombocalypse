const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/";
const sc = fs.readFileSync(R + "script.js", "utf8");
// ดึงโค้ดส่วน 49.4–49.7 + mwOpen/mwRender จาก script.js จริง
const a = sc.indexOf("/* =========================================================\n   49.35)"), b = sc.indexOf("/* =========================================================\n   50) 🎲 Release N");
const hubCode = sc.slice(a, b);
const sizes = [["m360", 360, 740], ["m390", 390, 844], ["tab768", 768, 1024], ["pc1280", 1280, 800]];
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  for (const [name, w, h] of sizes) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: 2 });
    const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(name + ": " + e));
    await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
    await pg.goto("file://" + R + "index.html");
    const res = await pg.evaluate(async (hubCode) => {
      const out = {}; document.querySelectorAll(".screen").forEach((x) => x.classList.remove("active")); document.getElementById("screen-game").classList.add("active");
      const $ = (i) => document.getElementById(i);
      window.$ = $; window.mk = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
      window.btn = (label, fn, cls = "btn primary mini") => { const b = mk("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; };
      Object.assign(window, { toast() {}, logLine() {}, sfx() {}, achFlush: async () => {}, achBump() {}, passMs: () => "2 วัน 3 ชม.", fnErr: () => "err", serverNow: () => 0, encHave: () => 5, equippedWeapon: () => null, weaponBonus: () => 0, ckUnclaimed: () => [1], cbPending: () => false, seaDef: () => ({ icon: "🦠", name: "ฤดูโรคระบาด" }), T: () => 1, ZONES: { ruins: { name: "ซากเมือง" } }, PET_K: { dog: { icon: "🐕", name: "หมา" } }, mRew: (l) => l.map(([id, q]) => `${id}×${q}`).join(" "), ITEMS: {}, state: { profile: { hp: 50 }, ach: { loaded: true }, zone: "tunnel" },
        mwRender() { const b = $("mw-body"); if (!b || !hubOn("ck")) return; b.innerHTML = ""; const c = mk("div", "world-row"); c.append(mk("div", "", "🔥 ปฏิทินเช็กอิน สะสม 5/28 วัน")); b.append(c); } });
      const P = { ok: true, s: 1, xp: 130, tierXp: 100, tiers: 30, tc: { 1: 1 }, rew: Array.from({ length: 30 }, (_, i) => [["water", 2]]), d: [{ id: "d1", t: "🔍 ค้นหาของ 20 ครั้ง", n: 20, v: 20, xp: 25, done: true, got: false }, { id: "d2", t: "🎒 เจอของ 12 ชิ้น", n: 12, v: 4, xp: 25, done: false, got: false }], w: [{ id: "w1", t: "🏠 เก็บผลผลิตที่พัก 35 ชิ้น", n: 35, v: 12, xp: 80, done: false, got: false }], dEnd: 1e9, wEnd: 1e9, sEnd: 1e9 };
      window.passCall = async () => P; window.dailyCall = async (d) => d.s === "crate" ? { ok: true, claimed: false, st: 3, day: 4, end: 1 } : { ok: true, name: "สารวัตรมรณะ", zone: "ruins", n: 5, rew: [["scrap", 6]], acc: true, v: 2, done: false, got: false, end: 1 };
      window.worldCall = async () => ({ ok: true, icon: "🚚", name: "ขนเสบียงเข้าเมือง", say: "ทั้งเมืองต้องการเสบียงด่วน", unit: "ชิ้น", per: 120, goal: 600, tot: 300, np: 5, mine: 50, min: 30, end: 1, ms: [{ i: 0, p: 0.4, need: 240, ok: true, got: false, rew: [["water", 1]] }] });
      window.campCall = async () => ({ ok: true, base: 1, perks: [{ id: "p1", icon: "🔭", name: "หอสังเกตการณ์", tip: "เจอซอมบี้น้อยลง 2%/ระดับ", eff: {}, lv: 2, max: 5, next: [["scrap", 36]] }], pet: null });
      window.diveCall = async () => ({ ok: true, on: false, best: 3, runsLeft: 6, entry: ["scrap", 2], cd: 0, max: 12 });
      window.worldBar = (f, t) => { const bar = mk("div", "ach-bar"), i = mk("i"); i.style.width = Math.round(f * 100) + "%"; bar.append(i, mk("span", "", t)); return bar; }; window.bookSet = () => new Set(["bandage"]); window.colCall = async () => ({ ok: true, pct: 37, done: 1, sets: [{ id: "medic", icon: "🩹", n: "ชุดแพทย์สนาม", k: "i", total: 6, have: 6, miss: [], done: true, got: false, rew: [["medkit", 2]] }, { id: "zones", icon: "🗺️", n: "นักสำรวจเมืองร้าง", k: "z", total: 10, have: 4, miss: ["mall", "port"], done: false, got: false, rew: [["water", 3]] }], miles: [{ k: "srch", n: 1000, t: "🔍 ค้นหาของ 1,000 ครั้ง", v: 400 }], rewards: [{ p: 25, ok: true, got: false, rew: [["medkit", 2]] }, { p: 50, ok: false, got: false, rew: [["medkit", 2]] }] }); window.nemCall = async () => ({ ok: true, nem: null }); window.radioCall = async () => ({ ok: true, zone: "tunnel", zoneTh: "อุโมงค์", slot: "หลักที่สอง", heard: false, solved: false, clues: [], solvers: 2, bigLeft: 8, guessesLeft: 5, end: 1 }); window.caravanCall = async () => ({ ok: true, open: false, next: 1 });
      (0, eval)(hubCode + "; Object.assign(window, { colRender, hubOpen, hubBtn, hubOn, hub2, actRender, advRender, passRender, state: window.state });");
      window.hubBtn(); out.deskBtn = !!$("btn-hub2"); out.tabBtn = !!$("tab-hub2"); out.tabDot = $("tab-hub2").classList.contains("unread");
      const first = () => new Promise((r) => setTimeout(r, 120));
      window.hubOpen("pass"); await first(); out.tabs = [...document.querySelectorAll(".hub2-tab")].map((x) => x.textContent + (x.classList.contains("dot") ? "•" : ""));
      return out;
    }, hubCode);
    await pg.waitForTimeout(200);
    const checks = {};
    for (const t of ["pass", "act", "adv", "col", "ck"]) {
      await pg.evaluate((t) => window.hubOpen(t), t); await pg.waitForTimeout(250);
      checks[t] = await pg.evaluate(() => { const box = document.querySelector("#hub2-modal .modal-box"), r = box.getBoundingClientRect(); const bad = [...document.querySelectorAll("#hub2-modal button")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 40 && !b.classList.contains("subtab")).map((b) => b.textContent.slice(0, 12) + ":" + Math.round(b.getBoundingClientRect().height)); return { sheet: Math.round(r.width) + "x" + Math.round(r.height), hscroll: document.documentElement.scrollWidth > innerWidth, boxScrollW: box.scrollWidth > box.clientWidth, smallBtns: bad.slice(0, 4) }; });
      await pg.screenshot({ path: `shots/${name}_${t}.png` });
    }
    // แท็บล่างบนมือถือ
    const tb = await pg.evaluate(() => { const t = document.querySelector(".tabbar"); const cs = getComputedStyle(t); return { disp: cs.display, btns: [...t.querySelectorAll("button")].map((b) => Math.round(b.getBoundingClientRect().width) + "x" + Math.round(b.getBoundingClientRect().height)), deskBtnVisible: getComputedStyle(document.getElementById("btn-hub2")).display !== "none" }; });
    console.log(name, JSON.stringify(res), JSON.stringify(checks), JSON.stringify(tb));
    await ctx.close();
  }
  console.log("errors:", errs); await br.close();
})();
