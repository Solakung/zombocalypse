const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const casinoPart = sc.slice(sc.indexOf("// ---------- 49.48 คาสิโนเถื่อน"), sc.indexOf("// ---------- 49.49 โต๊ะสลาฟ")), slPart = sc.slice(sc.indexOf("// ---------- 49.49 โต๊ะสลาฟ"), sc.indexOf("function hubOpen(tab) {"));
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ([cp, sp]) => {
    document.getElementById("screen-game").classList.add("active"); document.querySelectorAll(".screen").forEach((x) => { if (x.id !== "screen-game") x.classList.remove("active"); });
    const $ = (i) => document.getElementById(i), out = {}, calls = [];
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const state = { uid: "me", inv: {}, csD: null }; const ITEMS = {}; const toasts = []; const toast = (m) => toasts.push(m); const serverNow = () => Date.now(); const fnErr = (e) => String(e.message || e); const errMsg = fnErr;
    const cbs = {}; const ref = (db, p) => p; const onValue = (p, cb) => { cbs[p] = cb; return () => { delete cbs[p]; }; }; const db = {};
    const snap = (v) => ({ val: () => v });
    const pubBase = { id: "t1", ow: "me", ante: 25, max: 3, rounds: 3, st: "wait", rd: 0, t: 1, turn: null, dl: 0, last: null, prev: [], xc: null, res: null, first: false, seats: [{ u: "me", n: "ฉัน", c: 0, p: false, pt: 0, dq: false, o: 0 }] };
    let pub = { ...pubBase }, hand = [];
    const push = () => { cbs["cpub/t1"] && cbs["cpub/t1"](snap(pub)); cbs["chand/t1/me"] && cbs["chand/t1/me"](snap(hand)); };
    const slaveCall = async (d) => { calls.push(d);
      if (d.a === "list") return { ok: true, tables: [{ id: "x9", ow: "bob", ante: 50, max: 4, seats: ["bob", "ann"] }], mine: null };
      if (d.a === "create") return { ok: true, tid: "t1", pub, hand };
      if (d.a === "join") return { ok: true, tid: "x9", pub: { ...pubBase, id: "x9" }, hand: [] };
      if (d.a === "start") { pub = { ...pub, st: "play", rd: 1, first: true, turn: "me", dl: Date.now() + 30000, seats: [{ u: "me", n: "ฉัน", c: 4, p: false, pt: 0, dq: false, o: 0 }, { u: "b", n: "บี", c: 4, p: false, pt: 0, dq: false, o: 0 }, { u: "c", n: "ซี", c: 4, p: false, pt: 0, dq: false, o: 0 }] }; hand = [0, 1, 6, 40]; setTimeout(push, 30); return { ok: true, tid: "t1", pub, hand }; }
      if (d.a === "play") { hand = hand.filter((c) => !d.cards.includes(c)); pub = { ...pub, first: false, turn: "b", last: { u: "me", c: d.cards } }; setTimeout(push, 30); return { ok: true, tid: "t1", pub, hand }; }
      if (d.a === "leave") { return { ok: true, left: true }; }
      return { ok: true, tid: "t1", pub, hand }; };
    $ && 0;
    const api = new Function("state", "mk", "btn", "$", "casinoCall", "slaveCall", "fnErr", "errMsg", "toast", "serverNow", "ITEMS", "ref", "onValue", "db", cp + sp + ";\nreturn { casinoBar, casinoOpen, casinoRender, slRender, slOpen };")(state, mk, btn, $, async () => ({ ok: true, inZone: true, chips: 500, debt: null, lockLeft: 0, capLeft: 2000, lossToday: 0, cap: 2000, hpToday: 0, hpMax: 60, noLoan: 0, min: 5, max: 500, slotMax: 100, loanMax: 500, fee: 0.1, hpRate: 3, games: {}, rates: {}, shop: [], note: [] }), slaveCall, fnErr, errMsg, toast, serverNow, ITEMS, ref, onValue, db);
    document.body.prepend(Object.assign(mk("div"), { id: "zone-desc" }));
    api.casinoOpen(); await new Promise((r) => setTimeout(r, 150)); const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms)), body = () => $("casino-body"), txt = () => body().innerText.replace(/\n/g, " | ");
    const clickT = async (t) => { const b = [...body().querySelectorAll("button")].find((x) => x.textContent.includes(t)); if (!b) { out["miss_" + t] = true; return; } b.click(); await wait(); };
    await clickT("สลาฟ"); out.lobby = txt().slice(0, 400); out.hasList = txt().includes("bob"); await clickT("สร้างโต๊ะ"); out.wait = txt().slice(0, 300);
    await clickT("เริ่มเกม"); out.startDisabled = [...body().querySelectorAll("button")].find((x) => x.textContent.includes("เริ่มเกม"))?.disabled;
    pub = { ...pub, seats: [pub.seats[0], { u: "b", n: "บี", c: 0, p: false, pt: 0, dq: false, o: 0 }, { u: "c", n: "ซี", c: 0, p: false, pt: 0, dq: false, o: 0 }] }; cbs["cpub/t1"](snap(pub)); await wait();
    await clickT("เริ่มเกม"); await wait(200); out.play = txt().slice(0, 400); out.cards = [...body().querySelectorAll(".sl-hand .sl-card")].map((b) => b.textContent);
    const hb = [...body().querySelectorAll(".sl-hand .sl-card")]; const playBtn = () => [...body().querySelectorAll("button")].find((x) => x.textContent.startsWith("ลง"));
    out.playDisabled0 = playBtn().disabled; hb[1].click(); await wait(); out.afterWrong = playBtn().disabled; // 3♦ without 3♣ first
    [...body().querySelectorAll(".sl-hand .sl-card")][0].click(); await wait(); out.afterPair = playBtn().disabled; out.pairLabel = playBtn().textContent; // 3♣+3♦ pair OK
    playBtn().click(); await wait(250); out.after = txt().slice(0, 300); out.lastCards = [...body().querySelectorAll(".sl-lastcards .sl-card")].map((b) => b.textContent);
    out.passDisabled = [...body().querySelectorAll("button")].find((x) => x.textContent === "ผ่าน").disabled;
    out.hscroll = document.documentElement.scrollWidth > innerWidth; out.handH = Math.round(body().querySelector(".sl-hand").getBoundingClientRect().height);
    // จบเกม
    pub = { ...pub, st: "fin", turn: null, res: { rank: [{ u: "me", n: "ฉัน", pt: 4, pay: 45, net: 20, dq: false }, { u: "b", n: "บี", pt: 0, pay: 22, net: -3, dq: false }, { u: "c", n: "ซี", pt: -4, pay: 0, net: -25, dq: false }], fee: 8 } }; cbs["cpub/t1"](snap(pub)); await wait(); out.fin = txt().slice(0, 300);
    await clickT("กลับล็อบบี้"); await wait(300); out.back = txt().slice(0, 120);
    out.toasts = toasts; return out;
  }, [casinoPart, slPart]);
  await pg.screenshot({ path: "shots/slave.png" });
  console.log(JSON.stringify(out, null, 1)); console.log("errors:", errs); await br.close();
})();
