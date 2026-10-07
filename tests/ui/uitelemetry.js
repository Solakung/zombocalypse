// 📉 แดชบอร์ดสถิติผู้เล่น/PvP 360px — รันโค้ดแสดงผลจริงจาก script.js ด้วยข้อมูลจำลอง
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const fnPart = sc.slice(sc.indexOf("// ---- 📉 สถิติผู้เล่น"), sc.indexOf("// ---- /สถิติผู้เล่น"));
const rs = sc.indexOf("    try {   // 📉 ผู้เล่นใหม่หายตรงไหน"), re = sc.indexOf("    } catch (e) { console.warn(\"telemetry\", e); }");
const rendPart = sc.slice(rs + "    try {".length, re); assert(rendPart.length > 500);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(({ fnPart, rendPart }) => {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const box = document.createElement("div"); box.style.cssText = "padding:12px;font-size:14px"; document.body.prepend(box); document.body.style.background = "#171a1e"; document.body.style.color = "#eee";
    const ZONES = { ruins: { name: "เขตเมืองร้าง" }, forest: { name: "ป่า" } }, now = 100 * 86400000, D = 86400000;
    const P = (u, srch, c = {}) => ({ u: { role: "player", faction: "human", zone: "ruins", hp: 50, ...u }, a: { c: { srch, ...c } } });
    const people = [P({ createdAt: now - 5 * D, seenAt: now - 5 * D + 300000 }, 0), P({ createdAt: now - 4 * D, seenAt: now - 4 * D + 1800000, faction: "zombie", zone: "forest", hp: 0 }, 6, { qag: 8, qhg: 3, qdg: 30, qxg: 1, qas: 4, qhs: 3, qds: 45 }), P({ createdAt: now - D, seenAt: now - 1000 }, 50, { patkz: 10, phitz: 4, pdmgz: 40, patkh: 3, phith: 1, pdmgh: 9, pdie: 1 }), P({ createdAt: now - 2 * D, seenAt: now - 100, faction: "zombie" }, 80, { patkh: 8, phith: 5, pdmgh: 60 })];
    const D2 = { people, at: now };
    new Function("box", "D", "mk", "ZONES", fnPart + "; const sc0 = 0; " + rendPart.replace("D.people, D.at", "D.people, D.at"))(box, D2, mk, ZONES);
    return { text: box.innerText.replace(/\n+/g, " | "), hs: document.documentElement.scrollWidth > innerWidth };
  }, { fnPart, rendPart });
  console.log(out.text);
  assert(out.text.includes("สมัครแล้ว 4") && out.text.includes("หายไป 2") && out.text.includes("🧟→🧑: โจมตี 10 ครั้ง โดน 4 (40%) • ดาเมจเฉลี่ย 10.0") && out.text.includes("🧑→🧟: โจมตี 8 ครั้ง โดน 5 (63%)") && out.text.includes("ล้มจาก PvP: 🧑 1 • 🧟 0") && out.text.includes("ไม่ถึง 10 นาที 1"));
  assert(out.text.includes("🗿 ซากหนา ถูกโจมตี 8 ครั้ง โดน 3 (38%) • ดาเมจที่รับ/ครั้งที่โดน 10.0 • ล้ม 1") && out.text.includes("🕷️ เลื้อยคลาน ถูกโจมตี 4 ครั้ง โดน 3 (75%) • ดาเมจที่รับ/ครั้งที่โดน 15.0"), "line stats");
  assert.strictEqual(out.hs, false);
  await pg.screenshot({ path: "/tmp/fbt/telemetry360.png" }); console.log("UI TELEMETRY OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
