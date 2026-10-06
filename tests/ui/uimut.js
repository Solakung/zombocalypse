const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🧬 มิวเตชัน"), sc.indexOf("function renderEvo() {"));
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true }); const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async (part) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const calls = [], toasts = []; const state = { profile: { faction: "zombie" }, evo: { dna: 100 } };
    let D = { ok: true, zom: true, line: "giant", ic: "🗿", n: "สายซากหนา", m: 1, dna: 100, tiers: [{ n: "เกราะซ้อนเกราะ", d: "ลด 1%", cost: 25, done: true }, { n: "หัวใจศิลา", d: "ลด 2%", cost: 40, done: false }, { n: "ผิวหินผา", d: "ลด 3%", cost: 60, done: false }, { n: "ยักษ์", d: "ลด 4%", cost: 90, done: false }], next: { cost: 40 }, pass: { cut: 0.01 }, abilL: 5 };
    const mutCall = async (d) => { calls.push(d); if (d.a === "buy") { D = { ...D, m: 2, bought: "หัวใจศิลา", pass: { cut: 0.02 } }; D.tiers[1].done = true; } return D; };
    window.confirm = () => true; let renders = 0, api; const renderEvo = () => { renders++; const b = document.getElementById("evo-b"); b.innerHTML = ""; api.mutRender(b); };
    const body = mk("div"); body.id = "evo-b"; document.body.append(body);
    api = new Function("state", "mk", "btn", "mutCall", "toast", "logLine", "abilInvalidate", "fnErr", "renderEvo", "abilBar", part + ";return { mutRender, mutSync };")(state, mk, btn, mutCall, (m) => toasts.push(m), () => {}, () => {}, (e) => String(e), renderEvo, () => {});
    renderEvo(); await new Promise((r) => setTimeout(r, 200)); const t1 = body.innerText.replace(/\n/g, " | ");
    [...body.querySelectorAll("button")][0].click(); await new Promise((r) => setTimeout(r, 250));
    return { t1, t2: body.innerText.replace(/\n/g, " | "), calls, toasts, renders, hscroll: document.documentElement.scrollWidth > innerWidth };
  }, part);
  console.log(JSON.stringify(out, null, 1)); console.log("errors:", errs); await br.close();
})();
