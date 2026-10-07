// 🏹 บอสเผ่ามนุษย์ (ซอมบี้): หน้าต่างสู้ 360px — เปิด/ปิดตามสถานะ, ปุ่มโจมตี/หนี/รับรางวัล, ข้อความ, ไม่ล้นจอ (ใช้โค้ดจริงจาก script.js ตัดตามเครื่องหมาย)
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🏹 บอสเผ่ามนุษย์"), sc.indexOf("// ---- /บอสเผ่ามนุษย์"));
assert(part.length > 500, "slice");
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true }); const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const $ = (id) => document.getElementById(id); document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const logs = [], toasts = [], stats = [], calls = []; let script = [], tune = { hb_on: 1 }, stun = false;
    const state = { profile: { faction: "zombie", hp: 120, zone: "forest" }, zone: "forest" };
    const T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), toast = (m) => toasts.push(m), errMsg = () => "ทำรายการไม่สำเร็จ", logLine = (t, k) => logs.push([k, t]), stat = (k) => stats.push(k);
    const ITEMS = { rotten_meat: { name: "เนื้อเน่า", icon: "🥩" }, mutant_gland: { name: "ต่อมมิวแทนต์", icon: "🫀" } };
    const imgProbe = (src, cb) => cb(false), maxHp = () => 150, effActive = () => stun;
    const hbCall = async (d) => { calls.push(d.a); const r = script.shift(); if (r instanceof Error) throw r; return r; };
    const api = new Function("$", "mk", "state", "T", "toast", "errMsg", "logLine", "stat", "ITEMS", "imgProbe", "maxHp", "effActive", "hbCall", part + ";return { hbRender, hbRound, hbClaim, hbRestore, hbAfterSearch, HB_ZONES };")($, mk, state, T, toast, errMsg, logLine, stat, ITEMS, imgProbe, maxHp, effActive, hbCall);
    const res = {}, modal = $("hb-modal"), fight = (o = {}) => Object.assign({ boss: "forest", name: "หัวหน้าเผ่านายพราน", icon: "🏹", tag: "นักล่าวางกับดัก", hp: 70, max: 70, shield: 0, shieldMax: 0, pdot: null, weak: null, round: 0, art: "hb_forest" }, o);
    const wait = () => new Promise((r) => setTimeout(r, 30));
    res.zones = api.HB_ZONES.join(",");
    // ปิดอยู่ → ไม่เรียกเซิร์ฟเวอร์
    tune = { hb_on: 0 }; await api.hbAfterSearch(null); await api.hbRestore(); res.offCalls = calls.length; tune = { hb_on: 1 };
    // มนุษย์/โซนไม่มีเผ่า → ไม่เรียก
    state.profile.faction = "human"; await api.hbAfterSearch(null); state.profile.faction = "zombie"; state.zone = "lab"; await api.hbAfterSearch(null); state.zone = "forest"; res.skipCalls = calls.length;
    // เจอ → เปิดหน้าต่าง
    script = [{ ok: true, hit: true, log: ["เสียงเชือกตึง…", "ตีแรกโดน −5"], hp: 115, fight: fight({ pdot: { n: 2, per: 3 } }) }]; await api.hbAfterSearch(null); await wait();
    res.open1 = !modal.classList.contains("hidden"); res.title = $("hb-title").textContent; res.tag = $("hb-tag").textContent; res.bar = $("txt-hb").textContent; res.me = $("txt-hb-me").textContent; res.log1 = $("hb-log").children.length; res.combat = logs.map((x) => x[0]).join(",");
    res.noHscroll = document.documentElement.scrollWidth <= innerWidth; res.atkText = $("hb-attack").textContent;
    // โจมตี → เลือดบอสลด / บอสโล่
    script = [{ ok: true, log: ["🎲 ทอย 4 — โจมตีโดน −8 (🛡️ โล่รับไป 8)", "กระบองฟาด −10"], hp: 110, fight: fight({ boss: "police", name: "หัวหน้าหน่วยปราบจลาจล", icon: "🛡️", hp: 110, max: 110, shield: 32, shieldMax: 40 }) }];
    await api.hbRound("attack"); res.tag2 = $("hb-tag").textContent; res.bar2 = $("txt-hb").textContent; res.log2 = $("hb-log").children.length; res.busyAfter = $("hb-attack").disabled;
    // มึนงง → ปุ่มโจมตีกด/ข้อความ
    stun = true; api.hbRender(); res.stunTxt = $("hb-attack").textContent; res.stunDis = $("hb-attack").disabled; stun = false; api.hbRender();
    // ชนะ → รับรางวัลอัตโนมัติ
    script = [{ ok: true, won: true, log: ["🎲 ทอย 6 — คริติคอล! โจมตีโดน −12"], hp: 110, fight: fight({ hp: 0 }) }, { ok: true, claimed: [{ id: "rotten_meat", qty: 8 }, { id: "mutant_gland", qty: 1 }], fight: null }];
    await api.hbRound("attack"); await wait(); res.stats = stats.join(","); res.closedAfterClaim = modal.classList.contains("hidden"); res.toast = toasts[toasts.length - 1]; res.calls = calls.join(",");
    // หนีสำเร็จ
    state.hb = null; script = [{ ok: true, hit: true, log: ["…"], hp: 100, fight: fight() }]; await api.hbAfterSearch(null); script = [{ ok: true, fled: true, log: ["🏃 คุณวิ่งหนีออกมาได้!"], hp: 100, fight: null }]; await api.hbRound("flee"); res.fled = modal.classList.contains("hidden") && !state.hb;
    // ตาย → ปิดหน้าต่าง ไม่ค้าง
    state.hb = fight(); state.profile.hp = 120; api.hbRender(); res.reopen = !modal.classList.contains("hidden"); state.profile.hp = 0; api.hbRender(); res.deadClosed = modal.classList.contains("hidden") && !state.hb; state.profile.hp = 120;
    // error ข้อความจากเซิร์ฟเวอร์ แสดงตามที่ส่งมา
    state.hb = fight(); api.hbRender(); script = [Object.assign(new Error("กระเป๋าเต็ม"), { code: "functions/failed-precondition" })]; await api.hbRound("attack"); res.errToast = toasts[toasts.length - 1]; state.hb = null;
    // รีเฟรชกลางการสู้ → เปิดต่อ
    script = [{ ok: true, fight: fight({ hp: 33 }) }]; await api.hbRestore(); res.restored = !modal.classList.contains("hidden") && $("txt-hb").textContent;
    res.shot = 1; return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.zones, "forest,police,port,factory,hospital,tunnel"); assert.strictEqual(out.offCalls, 0); assert.strictEqual(out.skipCalls, 0);
  assert(out.open1); assert.strictEqual(out.title, "🏹 หัวหน้าเผ่านายพราน"); assert(out.tag.includes("แผลติดตัว −3/รอบ")); assert.strictEqual(out.bar, "เขา 70/70"); assert.strictEqual(out.me, "HP 120/150"); assert.strictEqual(out.log1, 2); assert.strictEqual(out.combat, "combat"); assert(out.noHscroll); assert.strictEqual(out.atkText, "🦷 ขย้ำ");
  assert(out.tag2.includes("โล่ 32/40")); assert.strictEqual(out.bar2, "เขา 110/110"); assert.strictEqual(out.log2, 4); assert.strictEqual(out.busyAfter, false);
  assert.strictEqual(out.stunTxt, "😵 มึนงง"); assert(out.stunDis); assert.strictEqual(out.stats, "boss"); assert(out.closedAfterClaim); assert(out.toast.includes("เนื้อเน่า ×8") && out.toast.includes("ต่อมมิวแทนต์")); assert(out.calls.endsWith("roll,attack,attack,claim"), out.calls);
  assert(out.fled); assert(out.reopen); assert(out.deadClosed); assert.strictEqual(out.errToast, "กระเป๋าเต็ม"); assert.strictEqual(out.restored, "เขา 33/70");
  // ภาพ 360px
  await pg.evaluate(() => { const $ = (id) => document.getElementById(id); document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active")); const m = $("hb-modal"); m.classList.remove("hidden"); $("hb-title").textContent = "🛡️ หัวหน้าหน่วยปราบจลาจล"; $("hb-tag").textContent = "โล่ดูดดาเมจ — ต้องทุบโล่ให้แตกก่อน • 🛡️ โล่ 32/40 • 🩸 แผลติดตัว −3/รอบ (อีก 2 รอบ)"; $("bar-hb").style.width = "70%"; $("txt-hb").textContent = "เขา 77/110"; $("bar-hb-me").style.width = "60%"; $("txt-hb-me").textContent = "HP 90/150"; ["🎲 ทอย 4 — โจมตีโดน −8 (🛡️ โล่รับไป 8)", "กระบองฟาดเข้าอย่างจัง −10", "🩸 แผลเก่าทำให้เสีย −3 HP"].forEach((t) => { const li = document.createElement("li"); li.textContent = t; $("hb-log").append(li); }); });
  await new Promise((r) => setTimeout(r, 200)); await pg.screenshot({ path: "/tmp/fbt/hboss360.png" });
  console.log("UI HBOSS OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
