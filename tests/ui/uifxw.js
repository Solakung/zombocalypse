// ⚔️ อาวุธติดสถานะฝั่งเกม: ตรวจช่อง fx (wfxOf), ผู้ถูกโจมตีรับสถานะ (wfxHit) และฟอร์มแอดมิน (พรีเซ็ต + ช่องสถานะ) ที่ 360px — โค้ดจริงจาก script.js ตัดตามเครื่องหมาย
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/", sc = fs.readFileSync(R + "script.js", "utf8");
const blk = sc.slice(sc.indexOf("// ---- ⚔️ อาวุธติดสถานะ (มนุษย์"), sc.indexOf("// ---- /อาวุธติดสถานะ")), adm = sc.slice(sc.indexOf("// ---- ⚔️ แอดมิน:"), sc.indexOf("function buildAdmin() {"));
assert(blk.length > 1000 && adm.length > 500);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ blk, adm }) => {
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }, $ = (id) => document.getElementById(id);
    const FX_TYPES = { bleed: { icon: "🩸", name: "เลือดไหล" }, poison: { icon: "☠️", name: "พิษ" }, hot: { icon: "💚", name: "ฟื้นฟู" }, stun: { icon: "😵", name: "มึนงง" }, dice: { icon: "🎯", name: "ทอยลูกเต๋า" } };
    const store = {}, LS = { get: (k, d) => (k in store ? store[k] : d), set: (k, v) => { store[k] = v; } }, lsKey = (n) => n, NOW = 1e12, serverNow = () => NOW, serverTimestamp = () => "__TS__", stats = [];
    const state = { uid: "T", profile: { faction: "zombie" }, players: { A: { faction: "human" }, Z: { faction: "zombie" } }, zone: "ruins" }; let eff = {}, imm = 0, rand = 0;
    const effActive = (t) => !!eff[t], poisonImmLeft = () => imm, stat = (k) => stats.push(k), toast = () => {}, logLine = () => {}, errMsg = () => "", T = () => 1, forgeCall = async () => {}, fxwCall = async () => ({}), renderCraft = () => {};
    const realRandom = Math.random; Math.random = () => rand;
    const api = new Function("mk", "$", "FX_TYPES", "POISON_STRONG", "LS", "lsKey", "serverNow", "serverTimestamp", "state", "effActive", "poisonImmLeft", "stat", "toast", "logLine", "errMsg", "T", "forgeCall", "fxwCall", "renderCraft", blk + "\n" + adm + "\nreturn { FXW, WFX_TYPES, wfxOf, wfxLabel, fxwSlot, wfxHit, buildWfxAdmin, wfxAdminRead };")(mk, $, FX_TYPES, 2, LS, lsKey, serverNow, serverTimestamp, state, effActive, poisonImmLeft, stat, toast, logLine, errMsg, T, forgeCall, fxwCall, renderCraft);
    const res = {}, hit = (a, setup) => { const u = {}; eff = {}; imm = 0; rand = 0; delete store.simm; if (setup) setup(); return { t: api.wfxHit(u, a), u }; };
    // wfxOf: ใช้ได้เฉพาะ custom + ค่าถูกต้อง
    res.of = [api.wfxOf(api.fxwSlot("fxw_cleaver")), api.wfxOf({ id: "knife", fx: { t: "bleed", v: 1, m: 3, p: 30 } }), api.wfxOf({ id: "custom", fx: { t: "bleed", v: 4, m: 3, p: 30 } }), api.wfxOf({ id: "custom", fx: { t: "dice", v: 1, m: 3, p: 30 } }), api.wfxOf({ id: "custom", fx: { t: "stun", v: 1, m: 2, p: 30 } }), api.wfxOf({ id: "custom" })].map((x) => (x ? x.t : null));
    res.label = [api.wfxLabel(api.FXW.fxw_cleaver.fx), api.wfxLabel(api.FXW.fxw_dartbow.fx), api.wfxLabel(api.FXW.fxw_venom.fx)];
    // wfxHit: ซอมบี้ถูกมนุษย์ตี
    const A = { from: "A", wfx: { t: "bleed", v: 2, m: 3, p: 25 } };
    let r = hit(A, () => { rand = 0.1; }); res.proc = [r.t.includes("เลือดไหล"), JSON.stringify(r.u)];   // 0.1×100 < 25 → ติด
    r = hit(A, () => { rand = 0.3; }); res.noProc = [r.t, Object.keys(r.u).length];   // 30 ≥ 25 → ไม่ติด
    r = hit(A, () => { eff = { bleed: 1 }; }); res.active = Object.keys(r.u).length;   // ติดอยู่แล้ว ไม่ทับ
    r = hit({ from: "A", wfx: { t: "poison", v: 2, m: 3, p: 100 } }, () => { imm = 5000; }); res.pimm = Object.keys(r.u).length;
    r = hit({ from: "A", wfx: { t: "stun", v: 1, m: 1, p: 100 } }); res.stun = [JSON.stringify(r.u["effects/T/stun"]), store.simm > NOW + 200000];
    r = hit({ from: "A", wfx: { t: "stun", v: 1, m: 1, p: 100 } }, () => { store.simm = NOW + 100000; }); res.stunImm = Object.keys(r.u).length;
    r = hit({ from: "A", wfx: { t: "dice", v: -1, m: 3, p: 100 } }); res.dice = JSON.stringify(r.u["effects/T/dice"]);
    r = hit({ from: "Z", wfx: { t: "bleed", v: 2, m: 3, p: 100 } }); res.fromZombie = Object.keys(r.u).length;   // ผู้โจมตีไม่ใช่มนุษย์
    r = hit({ from: "A", wfx: { t: "bleed", v: 2, m: 9, p: 100 } }); res.badM = Object.keys(r.u).length;
    r = hit({ from: "A" }); res.none = Object.keys(r.u).length; state.profile.faction = "human"; r = hit(A, () => { rand = 0; }); res.defHuman = Object.keys(r.u).length; state.profile.faction = "zombie";
    // ฟอร์มแอดมิน
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const box = mk("div"); box.style.cssText = "padding:12px;display:grid;gap:8px"; document.body.prepend(box); document.body.style.background = "#171a1e"; document.body.style.color = "#eee";
    const cf = mk("div"); cf.id = "adm-custom-fields"; cf.style.cssText = "display:grid;gap:8px"; box.append(cf);
    for (const id of ["custom-name", "custom-dmg", "custom-dur"]) { const i = document.createElement("input"); i.id = "adm-" + id; cf.append(i); }
    api.buildWfxAdmin("adm-"); api.buildWfxAdmin("adm-"); res.once = cf.querySelectorAll("#adm-wfx-t").length; res.presetN = $("adm-wfx-preset").options.length;
    const pre = $("adm-wfx-preset"); pre.value = "fxw_ripaxe"; pre.dispatchEvent(new Event("change"));
    res.filled = [$("adm-custom-name").value, $("adm-custom-dmg").value, $("adm-custom-dur").value, $("adm-custom-icon").value, $("adm-wfx-t").value, $("adm-wfx-v").value, $("adm-wfx-m").value, $("adm-wfx-p").value];
    res.read1 = JSON.stringify(api.wfxAdminRead("adm-"));
    pre.value = "fxw_hammer"; pre.dispatchEvent(new Event("change")); res.read2 = JSON.stringify(api.wfxAdminRead("adm-"));   // ทอย −1
    $("adm-wfx-t").value = "stun"; $("adm-wfx-m").value = "3"; $("adm-wfx-v").value = "3"; $("adm-wfx-p").value = "500"; res.read3 = JSON.stringify(api.wfxAdminRead("adm-"));   // มึนงง: นาที 1, v 1, โอกาส ≤100
    $("adm-wfx-t").value = ""; $("adm-custom-icon").value = ""; res.read4 = JSON.stringify(api.wfxAdminRead("adm-"));   // ไม่พ่วงสถานะ
    $("adm-wfx-t").value = "dice"; $("adm-wfx-v").value = "9"; $("adm-wfx-p").value = "0"; res.read5 = JSON.stringify(api.wfxAdminRead("adm-"));
    res.noHscroll = document.documentElement.scrollWidth <= innerWidth;
    Math.random = realRandom; return res;
  }, { blk, adm });
  console.log(JSON.stringify(out, null, 1));
  assert.deepStrictEqual(out.of, ["bleed", null, null, null, null, null]); assert.deepStrictEqual(out.label, ["🩸 เลือดไหล 30%", "☠️ พิษแรง 30%", "☠️ พิษ 35%"]);
  assert(out.proc[0]); assert(out.proc[1].includes('"mins":3') && out.proc[1].includes('"v":2')); assert.deepStrictEqual(out.noProc, ["", 0]); assert.strictEqual(out.active, 0); assert.strictEqual(out.pimm, 0);
  assert(out.stun[0].includes('"mins":1') && out.stun[0].includes('"v":1') && out.stun[1]); assert.strictEqual(out.stunImm, 0); assert(out.dice.includes('"v":-1')); assert.strictEqual(out.fromZombie, 0); assert.strictEqual(out.badM, 0); assert.strictEqual(out.none, 0); assert.strictEqual(out.defHuman, 0);
  assert.strictEqual(out.once, 1); assert.strictEqual(out.presetN, 10); assert.deepStrictEqual(out.filled, ["ขวานผ่าซาก", "16", "16", "🪓", "bleed", "3", "3", "30"]);
  assert.strictEqual(out.read1, '{"icon":"🪓","fx":{"t":"bleed","v":3,"m":3,"p":30}}'); assert.strictEqual(out.read2, '{"icon":"🔨","fx":{"t":"dice","v":-1,"m":3,"p":15}}'); assert.strictEqual(out.read3, '{"icon":"🔨","fx":{"t":"stun","v":1,"m":1,"p":100}}'); assert.strictEqual(out.read4, "{}"); assert.strictEqual(out.read5, '{"fx":{"t":"dice","v":-2,"m":3,"p":30}}');
  assert(out.noHscroll);
  await pg.screenshot({ path: "/tmp/fbt/fxw360.png" }); console.log("UI FXW OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
