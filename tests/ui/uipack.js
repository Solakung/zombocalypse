// 🦖 สายแรปเตอร์ (ฝั่งเกม) — คลาสเต็มรูปแบบในหน้าวิวัฒนาการ: การ์ด/ซื้อ (เขียน evo/{uid}/p ผ่าน rules เดียวกับสายอื่น)/รีเซ็ต, โบนัสสเตตัส+มิวเตชัน, ลูกฝูงใน PvP (ปรากฏ/หาย/กัด pkd/รับแทน), ย้ายข้อมูลเดิม, โหลดเกมจริงฝั่งซอมบี้ได้
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const { boot } = require("./_fakefb");
const R = "/home/user/zombocalypse/", sc = fs.readFileSync(R + "script.js", "utf8");
const a = sc.indexOf("/* ---------- 🦖 สายแรปเตอร์"), b = sc.indexOf("function searchCost()"); assert(a > 0 && b > a, "slice"); const part = sc.slice(a, b);
const ev = sc.slice(sc.indexOf("function evoBonusAt"), sc.indexOf("function evoBonus(k)")); assert(ev.length > 100);
for (const needle of ["const packTxt = packFightTouch();", "packT() > 0 && Math.random() < packIntercept()", "ลูกฝูงกระโจนมารับแทน", "const pkd = packBiteRoll(), pkTxt = packFightTouch();", "...(pkd > 0 ? { pkd } : {})", "Number(a.pkd) > 0", 'e.p === 4 ? "pack"', 'p: "🦖 แรปเตอร์"', 'packCall({ a: "dist" })', "packMigrate();", '["p", e.p || 0]', "  pack: { key: \"p\""]) assert(sc.includes(needle), "wired: " + needle);
(async () => {
  // ---- 1) ฟังก์ชันล้วนของฝั่งเกม
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part, ev }) => {
    const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms)), logs = [], toasts = [], calls = []; let now = 1000000, abil = null, ls = {}, script = [];
    const state = { profile: { faction: "zombie", hp: 90, username: "z" }, evo: { dna: 20, h: 0, g: 0, s: 0, p: 0 }, mutD: null, uid: "z" };
    const stubs = { state, serverNow: () => now, logLine: (t) => logs.push(t), abilLive: () => abil, toast: (m) => toasts.push(m), packCall: async (d) => { calls.push(d.a); const r = script.shift(); if (r instanceof Error) throw r; return r; }, LS: { get: (k, d) => (k in ls ? ls[k] : d), set: (k, v) => { ls[k] = v; } }, lsKey: (k) => k };
    const api = new Function(...Object.keys(stubs), ev + part + ";return { packTable, packBonusAt, packT, packM, packDodgeBonus, packIntercept, packBiteRoll, packFightTouch, packMigrate, evoBonusAt };")(...Object.values(stubs)), res = {};
    // โบนัสสเตตัส (ไม่เกี่ยวกับสายอื่น: เป็นสายเต็มรูปแบบ) • มิวเตชันลดโทษ HP เฉพาะเมื่อแรปเตอร์ขั้น 4
    res.bonus = [1, 2, 3, 4].map((t) => api.evoBonusAt("hp", { p: t }) + "/" + api.evoBonusAt("agi", { p: t })).join(" ");
    res.mut = [0, 1, 2, 3, 4].map((m) => api.evoBonusAt("hp", { p: 4, mp: m })).join(",") + " " + api.evoBonusAt("hp", { p: 3, mp: 4 });
    res.hybrid = api.evoBonusAt("hp", { g: 4, p: 1 }) + "/" + api.evoBonusAt("agi", { s: 1, p: 1 });   // ซากหนา 4 (+5) − แรปเตอร์ 1 (−2) = 3 • เลื้อยคลาน 1 (+2) + แรปเตอร์ 1 (+1) = 3
    // ขั้น/มิวเตชันจาก state
    state.evo = { p: 3 }; res.t1 = api.packT(); state.profile.faction = "human"; res.t2 = api.packT(); state.profile.faction = "zombie"; state.evo = { p: 9 }; res.t3 = api.packT(); state.evo = { p: 4 }; state.mutD = { line: "pack", m: 3 }; res.m1 = api.packM(); state.mutD = { line: "hunter", m: 3 }; res.m2 = api.packM(); state.evo = { p: 3 }; state.mutD = { line: "pack", m: 3 }; res.m3 = api.packM();
    // หลบ/รับแทน = ตารางขั้น + มิวเตชัน + ความสามารถประจำสาย
    state.evo = { p: 4 }; state.mutD = { line: "pack", m: 4 }; res.icpt = api.packIntercept().toFixed(2) + "/" + api.packDodgeBonus().toFixed(2); abil = { eff: { icpt: 0.06, dodge: 0.03 } }; res.abil = api.packIntercept().toFixed(2) + "/" + api.packDodgeBonus().toFixed(2); abil = null;
    state.evo = { p: 0 }; res.none = api.packIntercept() + "/" + api.packDodgeBonus() + "/" + api.packBiteRoll() + "/" + api.packFightTouch() + "|";
    // กัด PvP (pkd): อยู่ในช่วงตามขั้น (+1 มิวเตชัน) และมี 0 บ้าง (กัดพลาด)
    const seen = (t, m) => { state.evo = { p: t }; state.mutD = m ? { line: "pack", m } : null; const s = new Set(); for (let i = 0; i < 400; i++) s.add(api.packBiteRoll()); return [...s].sort().join(","); };
    res.bite = [seen(1), seen(2), seen(4), seen(4, 2)].join(" | ");
    // ลูกฝูงใน PvP: ปรากฏครั้งแรกแล้วไม่ซ้ำ (ภายใน 2 นาที) → พ้นเวลาแล้วปรากฏใหม่
    state.evo = { p: 2 }; state.mutD = null; res.f1 = api.packFightTouch(); now += 30000; res.f2 = api.packFightTouch(); res.active = !!state.packFight; now += 130000; res.f3 = api.packFightTouch(); clearTimeout(state.packTm);
    // ย้ายข้อมูลเดิม: ครั้งเดียวต่ออุปกรณ์ (สำเร็จแล้วไม่เรียกซ้ำ) • ล้มเหลวลองใหม่ได้ • มนุษย์ไม่เรียก
    script = [{ ok: true, migrated: true, p: 2 }]; await api.packMigrate(); await api.packMigrate(); res.mig = calls.join(",") + " / " + toasts[toasts.length - 1] + " / busy=" + !!state.packMigBusy;
    ls = {}; calls.length = 0; script = [new Error("x"), { ok: true, migrated: false }]; await api.packMigrate(); await api.packMigrate(); res.mig2 = calls.join(",");
    ls = {}; calls.length = 0; state.profile.faction = "human"; await api.packMigrate(); res.mig3 = calls.length;
    return res;
  }, { part, ev });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.bonus, "-2/1 -3/2 -4/3 -5/4"); assert.strictEqual(out.mut, "-5,-5,-5,-4,-3 -4", "มิวเตชัน: ขั้น 7 โทษ −10 ขั้น 8 −20 • ต้องแรปเตอร์ขั้น 4"); assert.strictEqual(out.hybrid, "3/3");
  assert.deepStrictEqual([out.t1, out.t2, out.t3, out.m1, out.m2, out.m3], [3, 0, 4, 3, 0, 0]); assert.strictEqual(out.icpt, "0.42/0.22"); assert.strictEqual(out.abil, "0.48/0.25"); assert.strictEqual(out.none, "0/0/0/|");
  assert.strictEqual(out.bite, "0,1 | 0,1,2 | 0,2,3,4 | 0,2,3,4,5"); assert(/ลูกฝูงปรากฏ/.test(out.f1) && out.f2 === "" && out.active === true && /ลูกฝูงปรากฏ/.test(out.f3));
  assert(/^migrate \/ 🦖 ย้ายสายแรปเตอร์ขั้น 2 .* \/ busy=false$/.test(out.mig) && out.mig.startsWith("migrate / "), out.mig); assert.strictEqual(out.mig2, "migrate,migrate"); assert.strictEqual(out.mig3, 0);
  assert.deepStrictEqual(errs.filter((e) => !/fxPerkMods/.test(e)), []); await br.close();

  // ---- 2) เกมจริงฝั่งซอมบี้: หน้าวิวัฒนาการมีการ์ดแรปเตอร์ • ซื้อขั้น 1 เขียน evo/u1/p + sp + dna + line • รีเซ็ตล้าง p
  const seed = { evo: { u1: { dna: 20, sp: 0, line: "none", h: 0, g: 0, s: 0, day: 0, gain: 0, fd: 0, rs: 0 } } };
  const B = await boot({ faction: "zombie", seed }); await B.pg.waitForTimeout(2500);
  await B.pg.evaluate(() => document.getElementById("btn-evo").click()); await B.pg.waitForTimeout(300);
  const card = () => B.pg.evaluate(() => { const body = document.getElementById("evo-body"), cards = [...body.children].filter((c) => /สายแรปเตอร์/.test(c.textContent) && c.querySelector("button")); const c = cards[0]; return c ? { txt: c.innerText.replace(/\n+/g, " | "), btns: [...c.querySelectorAll("button")].map((x) => x.textContent + ":" + x.disabled) } : null; });
  let c1 = await card(); assert(c1, "การ์ดแรปเตอร์"); assert(/ขั้น 0\/4/.test(c1.txt) && /เรียกฝูง/.test(c1.txt) && /ราชาแรปเตอร์/.test(c1.txt), c1.txt); assert.strictEqual(c1.btns[0], "3 DNA:false");
  await B.pg.evaluate(() => [...document.querySelectorAll("#evo-body button")].find((x) => x.textContent === "3 DNA" && /แรปเตอร์/.test(x.closest("div[style*='border']")?.textContent || ""))?.click()); await B.pg.waitForTimeout(400);
  const evo1 = await B.pg.evaluate(() => window.__DB.evo.u1); assert.deepStrictEqual({ p: evo1.p, sp: evo1.sp, dna: evo1.dna, line: evo1.line }, { p: 1, sp: 3, dna: 17, line: "pack" }, JSON.stringify(evo1));
  c1 = await card(); assert(/ขั้น 1\/4/.test(c1.txt) && /⭐ สายหลัก/.test(c1.txt), c1.txt);
  await B.pg.evaluate(() => { window.confirm = () => true; window.__rs = 1; const rb = [...document.querySelectorAll("#evo-body button")].find((x) => /^รีเซ็ตวิวัฒนาการ/.test(x.textContent)); rb.disabled = false; rb.click(); }); await B.pg.waitForTimeout(400);
  const evo2 = await B.pg.evaluate(() => window.__DB.evo.u1); assert.deepStrictEqual({ p: evo2.p, sp: evo2.sp, line: evo2.line, h: evo2.h }, { p: 0, sp: 0, line: "none", h: 0 }, JSON.stringify(evo2));
  const fatal = B.errs.filter((e) => /^PAGEERROR/.test(e) && !/fxPerkMods/.test(e)); assert.deepStrictEqual(fatal, [], fatal.join(" || ")); await B.br.close(); console.log("uipack OK");
})().catch((e) => { console.error(e); process.exit(1); });
