// 🦖 สายแรปเตอร์ (ฝั่งเกม) — โบนัสสเตตัสเฉพาะเมื่อไม่มีสายอื่น, การ์ดในหน้าวิวัฒนาการ (ซื้อ/ล็อก/รีเซ็ต), ลูกฝูงปรากฏ/หายใน PvP, ซื้อ/รีเซ็ตผ่านฟังก์ชัน, โหลดหน้าเกมฝั่งซอมบี้ได้
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/", sc = fs.readFileSync(R + "script.js", "utf8");
const a = sc.indexOf("/* ---------- 🦖 สายแรปเตอร์"), b = sc.indexOf("function searchCost()"); assert(a > 0 && b > a, "slice"); const part = sc.slice(a, b);
const ev = sc.slice(sc.indexOf("function evoBonusAt"), sc.indexOf("function evoBonus(k)")); assert(ev.length > 100);
for (const needle of ["const packTxt = packFightTouch();", "packT() > 0 && Math.random() < packIntercept()", "ลูกฝูงกระโจนมารับแทน", "packRender(body)", "if (packT() > 0) return toast(", 'p: "🦖 แรปเตอร์"', 'packCall({ a: "dist" })']) assert(sc.includes(needle), "wired: " + needle);
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part, ev }) => {
    const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms)), calls = [], toasts = [], logs = [], upd = []; let script = [], now = 1000000, ok = true;
    const state = { profile: { faction: "zombie", hp: 90, username: "z" }, evo: { dna: 20, h: 0, g: 0, s: 0 }, pack: null, uid: "z" };
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }, btn = (txt, fn, cls) => { const x = mk("button", cls, txt); x.addEventListener("click", fn); return x; };
    const packCall = async (d) => { calls.push(d.a); const r = script.shift(); if (r instanceof Error) throw r; return r; };
    const stubs = { state, serverNow: () => now, logLine: (t) => logs.push(t), mk, btn, toast: (m) => toasts.push(m), errMsg: (e) => e.message, packCall, evoClampHp: (u, t) => { const mx = 100 + 10 * (2 + H.api.evoBonusAt("hp", t)); if (state.profile.hp > mx) u["users/z/hp"] = mx; }, update: async (_, u) => { upd.push(u); }, ref: () => ({}), db: {}, renderBars: () => {}, renderEvo: () => {}, $: (id) => document.getElementById(id), achBump: () => {}, confirm: () => ok, PACK_UNUSED: 0 };
    const H = {}, names = Object.keys(stubs), api = new Function(...names, ev + part + ";return { packTable, packBonusAt, packT, packFightTouch, packIntercept, packDodgeBonus, packSync, packRender, evoBonusAt, PACK_TIERS };")(...Object.values(stubs)), res = {}; H.api = api;
    // โบนัสสเตตัส: เฉพาะเมื่อไม่มีสายอื่น • HP −20..−50 • ว่องไว +2..+4 (เพดาน +4)
    res.bonus = [1, 2, 3, 4].map((t) => api.evoBonusAt("hp", { p: t }) + "/" + api.evoBonusAt("agi", { p: t })).join(" "); res.withOther = api.evoBonusAt("hp", { h: 1, p: 4 }) + "/" + api.evoBonusAt("agi", { s: 0, g: 1, p: 4 });
    // packT: ต้องเป็นซอมบี้ + ไม่มีสายอื่น
    state.pack = { t: 3 }; res.t1 = api.packT(); state.evo.h = 1; res.t2 = api.packT(); state.evo.h = 0; state.profile.faction = "human"; res.t3 = api.packT(); state.profile.faction = "zombie"; state.pack = { t: 9 }; res.t4 = api.packT(); state.pack = { t: 2 };
    res.table = JSON.stringify([api.packIntercept(), api.packDodgeBonus()]);
    // ลูกฝูงใน PvP: ปรากฏครั้งแรกแล้วไม่ซ้ำ (ภายใน 2 นาที) → พ้นเวลาหายเอง
    res.f1 = api.packFightTouch(); now += 30000; res.f2 = api.packFightTouch(); res.active = !!state.packFight; await wait(); state.packTm && clearTimeout(state.packTm);
    now += 130000; res.f3 = api.packFightTouch(); clearTimeout(state.packTm); state.pack = { t: 0 }; res.noPack = api.packFightTouch() + "|" + api.packIntercept(); state.pack = { t: 2 };
    // การ์ด: ซื้อได้ (DNA 20 ≥ 10 ขั้น 3) / ล็อกเมื่อมีสายอื่น / DNA ไม่พอ
    const card = (e) => { state.evo = e; const box = document.createElement("div"); api.packRender(box); return { txt: box.innerText.replace(/\n+/g, " | "), btns: [...box.querySelectorAll("button")].map((x) => x.textContent + ":" + x.disabled) }; };
    state.pack = { t: 2, sp: 9, rs: 0 }; res.c1 = card({ dna: 20, h: 0, g: 0, s: 0 }); res.c2 = card({ dna: 20, h: 1, g: 0, s: 0 }); res.c3 = card({ dna: 5, h: 0, g: 0, s: 0 });
    state.pack = { t: 0, sp: 0, rs: 0 }; res.c0 = card({ dna: 20, h: 0, g: 0, s: 0 }); state.pack = { t: 4, sp: 34, rs: now - 3600000 }; res.c4 = card({ dna: 0, h: 0, g: 0, s: 0 });
    // ซื้อ: เรียกฟังก์ชัน → อัปเดตขั้น • HP ถูกลดให้ไม่เกินเพดานใหม่ • รีเซ็ต
    state.evo = { dna: 20, h: 0, g: 0, s: 0 }; state.pack = { t: 0 }; state.profile.hp = 110; calls.length = 0; script = [{ ok: true, t: 1, sp: 3, rs: 0, bought: 1 }];
    await api.packSync("buy"); await wait(); res.buy = calls.join(",") + " / t=" + state.pack.t + " / " + toasts[toasts.length - 1] + " / hpWrite=" + JSON.stringify(upd.map((u) => u["users/z/hp"]));
    calls.length = 0; script = [{ ok: true, t: 0, sp: 0, rs: 5, refund: 2 }]; await api.packSync("reset"); res.reset = calls.join(",") + " / t=" + state.pack.t + " / " + toasts[toasts.length - 1];
    script = [Object.assign(new Error("DNA ไม่พอ (ต้องใช้ 3)"), {})]; calls.length = 0; await api.packSync("buy"); res.err = toasts[toasts.length - 1] + " / busy=" + !!state.packBusy;
    state.profile.faction = "human"; calls.length = 0; await api.packSync("state"); res.human = calls.length;
    return res;
  }, { part, ev });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.bonus, "-2/1 -3/2 -4/3 -5/4"); assert.strictEqual(out.withOther, "0/0", "มีสายอื่น = แรปเตอร์ไม่มีผล (hp สายตะกละ 0, g=1 agi −0)");
  assert.deepStrictEqual([out.t1, out.t2, out.t3, out.t4], [3, 0, 0, 4]); assert.strictEqual(out.table, "[0.15,0.08]");
  assert(/ลูกฝูงปรากฏ/.test(out.f1) && out.f2 === "" && out.active === true && /ลูกฝูงปรากฏ/.test(out.f3), "ปรากฏครั้งแรก/ไม่ซ้ำ/พ้นเวลาแล้วปรากฏใหม่"); assert.strictEqual(out.noPack, "|0");
  assert(/ขั้น 2\/4/.test(out.c1.txt) && /⭐ สายหลัก/.test(out.c1.txt) && out.c1.btns[0] === "10 DNA:false" && /รีเซ็ตแรปเตอร์ \(คืน 6 DNA\)/.test(out.c1.btns[1]), "การ์ดซื้อได้");
  assert.strictEqual(out.c2.btns[0], "10 DNA:true", "มีสายอื่น → ซื้อไม่ได้"); assert(!/⭐ สายหลัก/.test(out.c2.txt)); assert.strictEqual(out.c3.btns[0], "10 DNA:true", "DNA ไม่พอ");
  assert.strictEqual(out.c0.btns.length, 1); assert.strictEqual(out.c0.btns[0], "3 DNA:false"); assert(out.c4.btns.length === 1 && /รออีก/.test(out.c4.btns[0]) && out.c4.btns[0].endsWith(":true"), "รีเซ็ตพัก 24 ชม.");
  assert(/^buy \/ t=1 \/ 🦖 เรียกฝูง สำเร็จ \/ hpWrite=\[100\]/.test(out.buy), out.buy); assert(/^reset \/ t=0 \/ รีเซ็ตแรปเตอร์แล้ว ได้ DNA คืน 2/.test(out.reset)); assert(/DNA ไม่พอ/.test(out.err) && /busy=false/.test(out.err)); assert.strictEqual(out.human, 0);
  assert.deepStrictEqual(errs.filter((e) => !/fxPerkMods/.test(e)), []); await br.close(); console.log("uipack OK");
})().catch((e) => { console.error(e); process.exit(1); });
