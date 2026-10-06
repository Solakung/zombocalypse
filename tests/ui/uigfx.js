const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs");
const R = "/home/user/zombocalypse/"; const sc = fs.readFileSync(R + "script.js", "utf8");
const gfx = sc.slice(sc.indexOf("/* ---------- 🎨 กราฟิกแปลงปลูก"), sc.indexOf("function gardenRows(body)"));
const scn = sc.slice(sc.indexOf("const SCN_POS = {"), sc.indexOf("function baseSceneOwn()"));
const decoSrc = sc.slice(sc.indexOf("const DECO = ["), sc.indexOf("const benchSlots"));
(async () => {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: { width: 360, height: 900 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(String(e)));
  await pg.route("**/*", (r) => { const u = r.request().url(); if (u.includes("script.js")) return r.fulfill({ body: "" }); if (u.startsWith("file://")) return r.continue(); return r.abort(); });
  await pg.goto("file://" + R + "index.html");
  const out = await pg.evaluate(([decoSrc, gfx, scn]) => {
    document.querySelectorAll(".screen").forEach((x) => x.classList.remove("active"));
    window.serverNow = () => Date.UTC(2026, 8, 7, 10); window.fxMoon = () => "full";
    const api = new Function("serverNow", "fxMoon", decoSrc + ";\n" + gfx + ";\n" + scn + ";\nreturn {gardenSceneSvg,baseYardSvg,scnStn,gPlant,baseSceneSvg,CROP_ART};")(window.serverNow, window.fxMoon);
    Object.assign(window, api);
    const out = {}, host = document.createElement("div"); host.style.cssText = "position:absolute;left:0;top:0;width:360px;background:#171a1e;padding:6px;z-index:99"; document.body.append(host);
    const crops = ["herb", "mossb", "tomato", "wheat", "pumpkin", "aloe", "shroom", "glow"], zc = ["fungus", "maggot", "bog", "bloodroot"];
    const mkPlots = (list, n) => Array.from({ length: n }, (_, k) => { const c = list[k % list.length]; const m = k % 4; return m === 0 ? { i: k + 1 } : { i: k + 1, c, total: 1000, left: m === 1 ? 900 : m === 2 ? 300 : 0, w: k % 3 === 0, f: k % 2 === 0 }; });
    const parts = [];
    for (const [n, season, zom] of [[8, 0, false], [6, 1, false], [4, 2, false], [8, 3, false], [8, 0, true]]) {
      const D = { n, season, plots: mkPlots(zom ? zc : crops, n) }; parts.push(`<div style="margin-bottom:6px;font:11px sans-serif;color:#9aa">n=${n} season=${season} zombie=${zom}</div>` + gardenSceneSvg(D, 2, 0, zom));
    }
    for (const lv of [0, 1, 2, 3]) parts.push(`<div style="margin:6px 0;font:11px sans-serif;color:#9aa">yard lv${lv}</div>` + baseYardSvg(lv, false, mkPlots(crops, 6), 0, "u1"));
    parts.push(`<div style="margin:6px 0;font:11px sans-serif;color:#9aa">yard zombie lv2</div>` + baseYardSvg(2, true, mkPlots(zc, 8), 0, "u1"));
    parts.push(`<div style="margin:6px 0;font:11px sans-serif;color:#9aa">room lv2 stations</div>` + baseSceneSvg({ lv: 2, deco: { d0: true, d1: true, d3: true }, zombie: false, uid: "u1", stations: [{ k: "w", u: 2, cap: 4 }, { k: "m", u: 0, cap: 3 }, { k: "t", u: 3, cap: 3 }, {}, { locked: true }], bench: [{ state: "ready" }, { state: "locked" }] }));
    parts.push(`<div style="margin:6px 0;font:11px sans-serif;color:#9aa">room zombie</div>` + baseSceneSvg({ lv: 1, deco: {}, zombie: true, uid: "u2", stations: [{ k: "t", u: 1, cap: 3 }, { k: "w", u: 0, cap: 4 }], bench: [] }));
    host.innerHTML = parts.join("");
    out.svgs = host.querySelectorAll("svg").length; out.maxW = Math.max(...[...host.querySelectorAll("svg")].map((s) => s.getBoundingClientRect().width)); out.h = host.scrollHeight;
    out.crops = Object.keys(CROP_ART).length; out.stageSvgOk = Object.keys(CROP_ART).every((c) => [1, 2, 3].every((s) => gPlant(c, s).length > 20));
    return out;
  }, [decoSrc, gfx, scn]);
  console.log(JSON.stringify(out)); console.log("errors:", errs);
  const h = out.h; for (let k = 0, y = 0; y < h; k++, y += 1500) await pg.screenshot({ path: `shots/gfx_${k}.png`, clip: { x: 0, y, width: 360, height: Math.min(1500, h - y) }, fullPage: true });
  await br.close();
})();
