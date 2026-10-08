// 🖼️ รูปโปรไฟล์วงกลมหน้าชื่อในแชท (360px): ไอคอนฝ่ายก่อน → ขอรูปแบบรวมกลุ่ม (1 ครั้งต่อหลายคน) → วาดอวาตาร์/กรอบ/รูปอัปโหลด • แคช • ล้มเหลวใช้ไอคอนฝ่าย • ปิดด้วย tune • ต่อกับ addChat จริง
const { boot } = require("./_fakefb"); const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/", sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🖼️ รูปโปรไฟล์ในแชท"), sc.indexOf("// ---- /รูปโปรไฟล์ในแชท")); assert(part.length > 500, "slice");
for (const needle of ["if (chatAvOn()) sender.append(chatAvEl(m.uid, m.faction), document.createTextNode(m.name))", '"chat_av_on"', 'profCall({ a: "mini", uids: ids })']) assert(sc.includes(needle), "wired: " + needle);
assert(fs.readFileSync(R + "style.css", "utf8").includes(".cav {"), "css");
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms)), calls = []; let tune = {}, reply = null;
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
    const FACTION = { human: { icon: "🧑" }, zombie: { icon: "🧟" } }, FR_CSS = { fr_gold: "border:3px solid #e0b84a;box-shadow:0 0 8px #e0b84a88", fr_none: "border:2px solid #3a424c" }, avBg = () => "linear-gradient(#222,#333)";
    const T = (k, d) => (typeof tune[k] === "number" ? tune[k] : d), imgs = [];
    const profCall = async (d) => { calls.push(d.uids.slice()); const r = reply; if (r instanceof Error) throw r; return r; }, profImgUrl = async (uid, v) => { imgs.push(uid + ":" + v); return "data:image/gif;base64,R0lGODlhAQABAAAAACw="; };
    const api = new Function("mk", "FACTION", "FR_CSS", "avBg", "T", "profCall", "profImgUrl", part + ";return { chatAvEl, chatAvOn, CAV };")(mk, FACTION, FR_CSS, avBg, T, profCall, profImgUrl), res = {};
    const box = mk("div"); document.body.append(box);
    // 1) ก่อนมีข้อมูล: ไอคอนฝ่ายเดิม • หลายคนรวมเป็น 1 คำขอ (uid ซ้ำนับครั้งเดียว)
    reply = { ok: true, list: { a: { avic: "🐺", fr: "fr_gold", upv: null }, b: { avic: null, fr: "fr_none", upv: 3 } } };
    const e1 = api.chatAvEl("a", "human"), e2 = api.chatAvEl("b", "zombie"), e3 = api.chatAvEl("a", "human"), e4 = api.chatAvEl("c", "zombie"); box.append(e1, e2, e3, e4);
    res.before = [e1, e2, e4].map((e) => e.textContent).join(""); await wait();
    res.calls = JSON.stringify(calls); res.a = e1.textContent + "|" + e1.style.borderColor + "|" + (e3.textContent === "🐺"); res.b = (e2.querySelector("img") ? "img" : "noimg") + "|" + imgs.join(","); res.c = e4.textContent + "|" + (e4.style.borderColor || "none");
    res.cls = e1.className + " " + e1.getAttribute("aria-hidden");
    // 2) แคช: ครั้งต่อไปไม่เรียกซ้ำ และวาดทันที
    calls.length = 0; const e5 = api.chatAvEl("a", "human"); const e6 = api.chatAvEl("c", "zombie"); await wait(); res.cached = calls.length + "|" + e5.textContent + "|" + e6.textContent;
    // 3) ล้มเหลว (ยังไม่ deploy ฟังก์ชัน) → ใช้ไอคอนฝ่าย ไม่พัง • ไม่ยิงซ้ำถี่
    api.CAV.cache.clear(); calls.length = 0; reply = new Error("not-found"); const e7 = api.chatAvEl("x", "zombie"); await wait(); const e8 = api.chatAvEl("x", "zombie"); await wait(); res.fail = e7.textContent + "|" + e8.textContent + "|calls=" + calls.length;
    // 4) ผู้ส่งเกิน 25 คนแบ่งหลายรอบ
    api.CAV.cache.clear(); calls.length = 0; reply = { ok: true, list: {} }; for (let i = 0; i < 30; i++) api.chatAvEl("u" + i, "human"); await wait(900); res.batch = calls.map((c) => c.length).join(",");
    // 5) ปิดด้วย tune: ไม่ขอข้อมูล
    tune = { chat_av_on: 0 }; api.CAV.cache.clear(); calls.length = 0; res.off = api.chatAvOn(); const e9 = api.chatAvEl("a", "human"); await wait(); res.offCalls = calls.length + "|" + e9.textContent;
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1));
  assert.strictEqual(out.before, "🧑🧟🧟"); assert.strictEqual(out.calls, JSON.stringify([["a", "b", "c"]]), "รวมเป็นคำขอเดียว ไม่ซ้ำ");
  assert(out.a.startsWith("🐺|") && /rgb\(224, 184, 74\)|#e0b84a/i.test(out.a) && out.a.endsWith("|true")); assert(out.b === "img|b:3"); assert(out.c.startsWith("🧟|")); assert(out.cls === "cav true");
  assert.strictEqual(out.cached, "0|🐺|🧟"); assert(/^🧟\|🧟\|calls=1$/.test(out.fail), out.fail); assert.strictEqual(out.batch, "25,5"); assert.strictEqual(out.off, false); assert.strictEqual(out.offCalls, "0|🧑");
  assert.deepStrictEqual(errs.filter((e) => !/fxPerkMods/.test(e)), []); await br.close();
  // เกมจริง: ข้อความแชทมีวงกลมหน้าชื่อ (ไอคอนฝ่ายก่อนได้ข้อมูล) และเรียก profAct mini
  const B = await boot({ faction: "human", seed: { chats: { safe: { m1: { uid: "u2", name: "เพื่อน", faction: "zombie", text: "สวัสดี", type: "chat", ts: Date.now() }, m2: { uid: "u1", name: "tester", faction: "human", text: "ว่าไง", type: "chat", ts: Date.now() + 1 } } } } }); await B.pg.waitForTimeout(3500);
  const row = await B.pg.evaluate(() => [...document.querySelectorAll("#chat-log .msg .sender")].map((s) => ({ cav: !!s.querySelector(".cav"), txt: s.textContent.trim(), first: s.firstElementChild && s.firstElementChild.className })));
  const calls = await B.pg.evaluate(() => window.__calls || []);
  assert(row.length >= 2 && row.every((r) => r.cav && r.first === "cav"), JSON.stringify(row)); assert(row.some((r) => /เพื่อน/.test(r.txt)) && row.some((r) => /tester/.test(r.txt)), JSON.stringify(row)); assert(calls.includes("profAct:mini"), "เรียก mini: " + calls.join(","));
  const fatal = B.errs.filter((e) => /^PAGEERROR/.test(e) && !/fxPerkMods/.test(e)); assert.deepStrictEqual(fatal, [], fatal.join(" || ")); await B.br.close(); console.log("uichatav OK");
})().catch((e) => { console.error(e); process.exit(1); });
