// 🍳 พ่อครัว (ฝั่งเกม) 360px — ปุ่มเข้าครัว (เปิด/ปิดตาม tune), เมนูเมนู/ล็อก/ขาดวัตถุดิบ/นอก Safe, เล่นมินิเกม (กดตามจังหวะ → ส่ง presses ให้เซิร์ฟเวอร์), ผลลัพธ์/ขึ้นขั้น, ข้อผิดพลาด
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🍳 พ่อครัว"), sc.indexOf("// ---- /พ่อครัว")); assert(part.length > 500, "slice");
assert(sc.includes("cookEntry(sec);") && sc.includes('"cook_on"'), "wired");
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const $ = (id) => document.getElementById(id), wait = (ms = 30) => new Promise((r) => setTimeout(r, ms)), calls = [], toasts = [], bumps = [];
    let tune = {}, script = [];
    const state = { profile: { hp: 100, faction: "human" }, zone: "safe", inv: { fish: { qty: 2 }, herb_bundle: { qty: 2 }, canned_food: { qty: 0 }, water: { qty: 3 } } };
    const T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), serverNow = () => Date.now(), toast = (m) => toasts.push(m), logLine = () => {}, hbMsg = (e) => e.message, sfx = () => {}, achBump = (k) => bumps.push(k);
    const ITEMS = { fish: { icon: "🐟" }, herb_bundle: { icon: "🌾" }, canned_food: { icon: "🥫" }, water: { icon: "💧" }, bread: { icon: "🍞" }, fruit: { icon: "🍎" } };
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }, btn = (txt, fn, cls) => { const b = mk("button", cls, txt); b.addEventListener("click", fn); return b; };
    const httpsCallable = () => async (d) => { calls.push(d); const r = script.shift(); if (r instanceof Error) throw r; return { data: r }; }, fns = {};
    const sec = mk("div"); sec.innerHTML = '<ul id="craft-list"></ul>'; document.body.append(sec);
    const stubs = { mk, btn, state, T, serverNow, toast, logLine, hbMsg, sfx, achBump, ITEMS, httpsCallable, fns, $ };
    const api = new Function(...Object.keys(stubs), part + ";return { cookOn, cookEntry, cookOpen, cookPlay };")(...Object.values(stubs)), res = {};
    const dishes = [{ id: "bbq_fish", n: "ปลาเผาสมุนไพร", i: "🍢", need: [["fish", 1], ["herb_bundle", 1]], pool: ["chop", "grill"], main: "str", sec: "st", rank: 0, locked: false }, { id: "hot_stew", n: "สตูว์", i: "🍲", need: [["canned_food", 1], ["water", 1]], pool: ["stir"], main: "hp", sec: "regen", rank: 0, locked: false }, { id: "chef_special", n: "เมนูพิเศษ", i: "🍱", need: [["fish", 1]], pool: ["chop"], main: "str", sec: "hp", rank: 3, locked: true, sp: true }];
    const S = (x = {}) => ({ ok: true, on: true, n: 5, p: 1, rank: 1, title: "พ่อครัวฝึกหัด", next: 12, win: 1.07, dishes, ...x });
    // ปุ่มเข้าครัว: ปิดอยู่ซ่อน / เปิดแล้วโชว์ (มนุษย์เท่านั้น)
    res.off = api.cookOn(); tune = { cook_on: 0 }; api.cookEntry(sec); res.btnOff = $("cook-open").classList.contains("hidden"); tune = {}; api.cookEntry(sec); res.btnOn = !$("cook-open").classList.contains("hidden");
    state.profile.faction = "zombie"; api.cookEntry(sec); res.btnZombie = $("cook-open").classList.contains("hidden"); state.profile.faction = "human";
    // เมนู: ปุ่มทำ (ทำได้/ขาดวัตถุดิบ/ล็อก)
    script = [S()]; await api.cookOpen(); await wait(); res.menuTxt = $("cook-body").innerText.replace(/\n+/g, " | "); res.dis = [...$("cook-body").querySelectorAll("button")].map((b) => b.disabled).join(",");
    state.zone = "forest"; script = [S()]; await api.cookOpen(); await wait(); res.outSafe = [...$("cook-body").querySelectorAll("button")].map((b) => b.disabled).join(",") + " / " + /Safe Zone/.test($("cook-body").innerText); state.zone = "safe";
    // เล่น: โจทย์สั้น (t0 ย้อนหลัง 2000ms) 2 ขั้น • กดตรงจังหวะ → ส่ง presses 2 ชุด
    const t0 = Date.now() - 2000, steps = [{ k: "chop", n: "สับ", i: "🔪", at: [2300, 2700] }, { k: "grill", n: "ย่าง", i: "🔥", at: [4300] }], end = 4900;
    calls.length = 0; script = [{ ok: true, t0, dish: "bbq_fish", n: "ปลาเผาสมุนไพร", i: "🍢", end, win: { perfect: 90, good: 170, ok: 260 }, mul: 1, steps }, { ok: true, tier: 3, tierName: "เพอร์เฟกต์", name: "ปลาเผาสมุนไพร (เพอร์เฟกต์)", qty: 1, perfect: 3, beats: 3, flawless: true, stats: { str: 4, st: 2 }, bmin: 30, rank: 1, title: "พ่อครัวฝึกหัด", rankUp: false }, S({ n: 6 })];
    const pr = api.cookPlay("bbq_fish"); await wait(60);
    const at = async (ms) => { while (Date.now() - t0 < ms) await wait(5); const b = [...$("cook-body").querySelectorAll("button")].find((x) => /กด/.test(x.textContent)); b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true })); };
    res.stage = $("cook-body").innerText.replace(/\n+/g, " | ").slice(0, 80);
    await at(2300); await at(2700); await at(4300); await pr; await wait();
    const done = calls.find((c) => c.a === "done"); res.calls = calls.map((c) => c.a).join(","); res.presses = done && done.presses.map((p) => p.length).join(","); res.near = done && done.presses.map((p, k) => p.every((x, i) => Math.abs(x - t0 - steps[k].at[i]) < 120)).join(",");
    res.toast = toasts[toasts.length - 1]; res.bump = bumps.join(","); res.after = $("cook-body").innerText.replace(/\n+/g, " | ").slice(0, 120); res.busy = !!state.cookBusy;
    // เซิร์ฟเวอร์ปฏิเสธ (วัตถุดิบไม่พอ) → toast + กลับเมนู ไม่ค้าง
    calls.length = 0; script = [new Error("วัตถุดิบไม่พอ"), S()]; await api.cookPlay("bbq_fish"); await wait(); res.err = toasts[toasts.length - 1] + " / busy=" + !!state.cookBusy + " / " + calls.map((c) => c.a).join(",");
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.off, true); assert.strictEqual(out.btnOff, true); assert.strictEqual(out.btnOn, true); assert.strictEqual(out.btnZombie, true);
  assert(/พ่อครัวฝึกหัด/.test(out.menuTxt) && /ปลาเผาสมุนไพร/.test(out.menuTxt) && /🔒 ขั้น 3/.test(out.menuTxt), "menu"); 
  const dis = out.dis.split(","); assert.strictEqual(dis[0], "false", "ทำ bbq_fish ได้"); assert.strictEqual(dis[1], "true", "สตูว์ขาดวัตถุดิบ"); assert.strictEqual(dis[2], "true", "ล็อกขั้น");
  assert.strictEqual(out.outSafe, "true,true,true / true", "นอก Safe กดทำไม่ได้");
  assert.strictEqual(out.calls, "start,done,state"); assert.strictEqual(out.presses, "2,1"); assert.strictEqual(out.near, "true,true"); assert(/เพอร์เฟกต์/.test(out.toast) && /ไร้ที่ติ/.test(out.toast) && /โจมตี\+4/.test(out.toast)); assert.strictEqual(out.bump, "cook"); assert.strictEqual(out.busy, false);
  assert(/เตรียมตัว|สับ/.test(out.stage)); assert(/วัตถุดิบไม่พอ/.test(out.err) && /busy=false/.test(out.err) && out.err.endsWith("start,state"));
  assert.deepStrictEqual(errs.filter((e) => !/fxPerkMods/.test(e)), []); await br.close(); console.log("uicook OK");
})().catch((e) => { console.error(e); process.exit(1); });
