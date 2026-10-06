// ⬆️ อัปเกรดสวน (gardenUpRows): แสดงระดับ/ผลรวม/ต้นทุน มี-ต้องใช้ • ปุ่มปิดเมื่อของไม่พอ • กดแล้วเรียก upgrade • ถึงระดับสูงสุด • ไม่ล้น 360px
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- ⬆️ อัปเกรดสวน"), sc.indexOf("// ---- /อัปเกรดสวน"));
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true }); const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async (part) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const btn = (l, f, c = "btn primary mini") => { const b = mk("button", c, l); b.type = "button"; b.addEventListener("click", f); return b; };
    const calls = [], toasts = []; let can = true;
    const ITEMS = { scrap: { name: "เศษวัสดุ", icon: "🔩" }, rope_coil: { name: "เชือก", icon: "🪢" }, rotten_meat: { name: "เนื้อเน่า", icon: "🥩" }, mutant_gland: { name: "ต่อมมิวแทนต์", icon: "🫀" } };
    const state = { inv: { scrap: { id: "scrap", qty: 50 }, rope_coil: { id: "rope_coil", qty: 1 } } };
    const api = new Function("mk", "btn", "ITEMS", "state", "baseCan", "gardenGo", "toast", "logLine", "sfx", part + ";return { gardenUpRows };")(mk, btn, ITEMS, state, () => can, (a, x, ok) => { calls.push(a); if (ok) ok({ upgraded: "💧 ระบบรดน้ำฝน", lv: 2 }); }, (m) => toasts.push(m), () => {}, () => {});
    const D1 = { up: { lv: 1, max: 5, eff: { p: 1, g: 0, b: 0, m: 0 }, tiers: [{ n: "🌿 ขยายแปลงริมรั้ว", d: "แปลง +1", cost: [["scrap", 30]], done: true }, { n: "💧 ระบบรดน้ำฝน", d: "เวลาโต −6%", cost: [["scrap", 45], ["rope_coil", 2]], done: false }, { n: "🧺 ปุ๋ยหมัก", d: "x", cost: [], done: false }, { n: "a", d: "b", cost: [], done: false }, { n: "c", d: "d", cost: [], done: false }], next: { n: "💧 ระบบรดน้ำฝน", d: "เวลาโต −6%", cost: [["scrap", 45], ["rope_coil", 2]] } } };
    document.querySelectorAll(".screen").forEach((x) => x.classList.remove("active")); const box = mk("div"); box.style.cssText = "padding:10px;display:grid;gap:8px;position:fixed;inset:0;background:var(--bg);overflow:auto;z-index:99;align-content:start"; document.body.append(box);
    api.gardenUpRows(box, D1); const det = box.querySelector("details"); det.open = true; await new Promise((r) => setTimeout(r, 50));
    const res = { text: box.innerText.replace(/\\n/g, " | "), btn1: box.querySelector("button").disabled };   // ของไม่พอ (เชือก 1/2) → ปิด
    state.inv.rope_coil.qty = 2; box.textContent = ""; api.gardenUpRows(box, D1); box.querySelector("details").open = true; const b = box.querySelector("button"); res.btn2 = b.disabled; res.btnText = b.textContent; b.click(); res.calls = calls.slice(); res.toast = toasts[0];
    can = false; box.textContent = ""; api.gardenUpRows(box, D1); res.btnCantBase = box.querySelector("button").disabled; can = true;
    const Dmax = { up: { ...D1.up, lv: 5, next: null, eff: { p: 2, g: 14, b: 20, m: 0 }, tiers: D1.up.tiers.map((t) => ({ ...t, done: true })) } }; box.textContent = ""; api.gardenUpRows(box, Dmax); box.querySelector("details").open = true; res.max = box.innerText.replace(/\\n/g, " | "); res.maxBtn = box.querySelectorAll("button").length;
    box.textContent = ""; api.gardenUpRows(box, {}); res.noUp = box.children.length;   // ไม่มีข้อมูล up → ไม่แสดงอะไร ไม่ error
    box.textContent = ""; api.gardenUpRows(box, D1); box.querySelector("details").open = true; res.hscroll = document.documentElement.scrollWidth > innerWidth || box.scrollWidth > box.clientWidth; res.bh = box.querySelector("button").getBoundingClientRect().height;
    return res;
  }, part);
  console.log(JSON.stringify(out, null, 1));
  assert(out.text.includes("ระดับ 1/5") && out.text.includes("แปลง +1") && out.text.includes("เศษวัสดุ 50/45") && out.text.includes("เชือก 1/2")); assert.strictEqual(out.btn1, true); assert.strictEqual(out.btn2, false); assert(out.btnText.includes("ระดับ 2"));
  assert.deepStrictEqual(out.calls, ["upgrade"]); assert(out.toast.includes("อัปเกรดสวนแล้ว")); assert.strictEqual(out.btnCantBase, true); assert(out.max.includes("ระดับสูงสุด")); assert.strictEqual(out.maxBtn, 0); assert.strictEqual(out.noUp, 0); assert.strictEqual(out.hscroll, false); assert(out.bh >= 34, "tap target " + out.bh);
  await pg.screenshot({ path: "/tmp/fbt/gardenup360.png" }); console.log("UI GARDEN UP OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
