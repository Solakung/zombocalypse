// 🛠️ Admin Console แท็บหมวดหมู่ (รวมเศรษฐกิจ/ปรับค่าเกมของเจ้าของ) 360px — รันโค้ดจริงจาก script.js ช่วงระหว่างเครื่องหมาย บนหน้าแอดมินจริงใน index.html
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), assert = require("assert");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const part = sc.slice(sc.indexOf("// ---- 🛠️ Admin Console: แท็บหมวดหมู่"), sc.indexOf("// ---- /Admin Console แท็บ")); assert(part.length > 500, "slice");
for (const needle of ["admTabsInit(); $(\"admin-modal\").classList.remove(\"hidden\"); loadDash();", 'state.econCache = null; admTab("econ");', "admTab(\"tune\"); } catch { /* ข้าม */ }", "function tuneRender(box, only = \"\")"]) assert(sc.includes(needle), "missing: " + needle);
assert(!sc.includes('[["econ", "📈"], ["tune", "🎛️"]]') && !sc.includes('tab === "tune" && state.profile?.role === "owner"'), "แท็บเดิมในหน้าสรุปต้องถูกเอาออก");
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const pg = await (await br.newContext({ viewport: { width: 360, height: 780 }, isMobile: true })).newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(async ({ part }) => {
    const $ = (id) => document.getElementById(id); document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; }, btn = (t, f, c) => { const b = mk("button", c, t); b.addEventListener("click", f); return b; };
    const store = {}, LS = { get: (k, d) => (k in store ? store[k] : d), set: (k, v) => { store[k] = v; } }; const state = { profile: { role: "owner" } };
    const calls = []; const econRender = (box) => { calls.push("econ"); box.append(mk("div", "", "ข้อมูลเศรษฐกิจ")); }, tuneRender = (box, only) => { calls.push("tune:" + (only || "all")); box.append(mk("div", "", "ช่องปรับค่า " + (only || "ทุกหมวด"))); };
    const tuneDefs = () => [["a", "A", 1, 0, 9, "🟠 สถานะส้ม"], ["b", "B", 1, 0, 9, "💰 ค่าหัวใหม่"], ["c", "C", 1, 0, 9, "🟠 สถานะส้ม"]];
    // เพิ่มส่วนที่ถูกสร้างทีหลัง (เหมือน profGmSection) แล้วเปิดหน้าแอดมินจริง
    const extra = mk("div", "adm-section"); extra.id = "pgm-box"; extra.append(mk("h3", "", "🖼️ รูปโปรไฟล์ที่ถูกรายงาน")); $("adm-reset-stats").closest(".adm-section").after(extra);
    $("admin-modal").classList.remove("hidden");
    const api = new Function("$", "mk", "btn", "LS", "state", "econRender", "tuneRender", "tuneDefs", part + ";return { admTab, admTabsInit, ADM_CATS };")($, mk, btn, LS, state, econRender, tuneRender, tuneDefs);
    const vis = () => [...$("admin-modal").querySelectorAll(".adm-section[data-cat]")].filter((s) => !s.classList.contains("hidden")).map((s) => s.querySelector("h3")?.textContent.trim());
    const res = {}; api.admTabsInit(); res.tabs = [...$("adm-tabs").querySelectorAll("button")].map((b) => b.textContent).join("|"); res.on = $("adm-tabs").querySelector("button.on")?.dataset.t; res.players = vis();
    const cats = {}; $("admin-modal").querySelectorAll(".adm-section[data-cat]").forEach((s) => { (cats[s.dataset.cat] = cats[s.dataset.cat] || []).push(s.querySelector("h3")?.textContent.trim()); }); res.cats = cats;
    const click = (t) => [...$("adm-tabs").querySelectorAll("button")].find((b) => b.dataset.t === t).click();
    click("comms"); res.comms = vis(); click("items"); res.items = vis(); click("world"); res.world = vis(); res.paneHiddenWorld = $("adm-pane").classList.contains("hidden");
    click("econ"); res.econ = vis().length + "/" + $("adm-pane").innerText + "/" + $("adm-pane").classList.contains("hidden"); click("tune"); res.tune = vis().length + "/" + $("adm-pane").innerText.replace(/\n+/g, " | ") + "/" + calls[calls.length - 1];
    const sel = $("adm-pane").querySelector("select"); res.opts = [...sel.options].map((o) => o.text).join(","); sel.value = "💰 ค่าหัวใหม่"; sel.dispatchEvent(new Event("change")); res.tuneFilter = $("adm-pane").innerText.replace(/\n+/g, " | ") + " / " + calls[calls.length - 1] + " / sel=" + $("adm-pane").querySelector("select").value;
    res.saved = store.zc_admtab; res.noHs = document.documentElement.scrollWidth <= innerWidth;
    // เปิดซ้ำจำแท็บเดิม • GM เห็นแค่ 4 หมวดและเข้า econ/tune ไม่ได้
    api.admTabsInit(); res.reopen = $("adm-tabs").querySelector("button.on").dataset.t;
    state.profile.role = "gm"; $("adm-tabs").remove(); $("adm-pane").remove(); api.admTabsInit(); res.gmTabs = [...$("adm-tabs").querySelectorAll("button")].map((b) => b.dataset.t).join(","); api.admTab("econ"); res.gmEcon = $("adm-tabs").querySelector("button.on").dataset.t;
    return res;
  }, { part });
  console.log(JSON.stringify(out, null, 1)); await pg.screenshot({ path: "/tmp/adm360.png" });
  assert.strictEqual(out.tabs, "👥 ผู้เล่น|📣 สื่อสาร|🎁 ไอเทม|🌍 โลก|📈 เศรษฐกิจ|🎛️ ปรับค่า"); assert.strictEqual(out.on, "players");
  assert.deepStrictEqual(out.cats, { players: ["แดชบอร์ดผู้เล่น", "แก้ไขสเตตัสผู้เล่น", "ให้บัฟ/ดีบัฟ/สถานะให้ผู้เล่น", "ติดเชื้อ", "จัดการผู้เล่น (Owner)", "🖼️ รูปโปรไฟล์ที่ถูกรายงาน"], comms: ["ประกาศระบบ", "ควบคุมแชท"], items: ["เสกไอเทม / สกิล", "มอบสกิล", "กระดานภารกิจ"], world: ["เหตุการณ์ประจำโซน", "บอสโลก (World Boss)"] }, "การจัดหมวด");
  assert.deepStrictEqual(out.comms, ["ประกาศระบบ", "ควบคุมแชท"]); assert.strictEqual(out.items.length, 3); assert.strictEqual(out.world.length, 2); assert(out.paneHiddenWorld);
  assert.strictEqual(out.econ, "0/ข้อมูลเศรษฐกิจ/false"); assert(out.tune.startsWith("0/") && out.tune.includes("ช่องปรับค่า ทุกหมวด") && out.tune.endsWith("tune:all")); assert(out.opts.includes("ทุกหมวด") && out.opts.includes("บังคับเหตุการณ์") && out.opts.includes("🟠 สถานะส้ม") && out.opts.includes("💰 ค่าหัวใหม่"));
  assert(out.tuneFilter.includes("ช่องปรับค่า 💰 ค่าหัวใหม่") && out.tuneFilter.endsWith("sel=💰 ค่าหัวใหม่") && out.tuneFilter.includes("tune:💰 ค่าหัวใหม่")); assert.strictEqual(out.saved, "tune"); assert(out.noHs); assert.strictEqual(out.reopen, "tune");
  assert.strictEqual(out.gmTabs, "players,comms,items,world"); assert.strictEqual(out.gmEcon, "players");
  console.log("UI ADM OK; errors:", errs); assert.deepStrictEqual(errs, []); await br.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
