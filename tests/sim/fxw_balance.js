// ⚔️ จำลองอาวุธติดสถานะ (มนุษย์ → ซอมบี้): ดวลตัวต่อตัวเทียบอาวุธธรรมดาระดับเดียวกัน — `node tests/sim/fxw_balance.js`
// สมมติ: สเตตัส/ของ/นโยบายผู้เล่น (ไม่ใช่ข้อมูลจริง) • ซอมบี้ไม่มีของรักษาสถานะ • เลือดไหล/พิษ = v HP ต่อ 15 วิ (≈ 0.67v ต่อสเต็ป 10 วิ) เป็นเวลา m นาที ไม่ทับกัน • มึนงง = ซอมบี้โจมตีไม่ได้ 1 นาที (กันมึนซ้ำ 3 นาที) • ทอย −v ซอมบี้ m นาที
const fs = require("fs"), path = require("path"), N = 6000;
const sc = fs.readFileSync(path.resolve(__dirname, "../../script.js"), "utf8");
const FXW = new Function(sc.slice(sc.indexOf("const FXW = {"), sc.indexOf("\n};", sc.indexOf("const FXW = {")) + 3).replace("const FXW", "const F") + "; return F;")();
const d6 = () => 1 + Math.floor(Math.random() * 6), mult = (r) => (r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5);
const ZB = { "กลาง 26 แต้ม": { str: 8, hp: 8, agi: 6, tough: 4 }, "ปลาย 50 แต้ม": { str: 14, hp: 14, agi: 12, tough: 10 } };
const HU = { "มนุษย์กลาง": { str: 9, hp: 9, red: 15, band: 3, med: 1 }, "มนุษย์ปลาย": { str: 14, hp: 14, red: 20, band: 5, med: 2 } };
// สาย ซอมบี้ (ค่าที่ลงเกมแล้ว): ตะกละ ฮีล 2/3/5 • ซากหนา HP+50 ทน+2 หลบ−12%... ใช้เฉพาะโบนัสสเตตัสหลัก
const LINE = { none: {}, hunter: { str: 2, heal: 5, bleed: true }, giant: { hp: 5, tough: 2, agi: -2, cut: 0.85 }, shade: { agi: 3, hp: -2 } };
function duel(z, line, hu, wpn, fx, o = {}) {
  const L = LINE[line], st = (k) => z[k] + (L[k] || 0), zMax = 100 + 10 * st("hp"), hMax = 100 + 10 * hu.hp;
  let zh = zMax, hh = hMax, band = hu.band, med = hu.med, bleed = 0, bleedV = 0, stunLeft = 0, stunImm = 0, diceLeft = 0, step = 0, dur = wpn.dur, hb = 0;
  while (step++ < 60) {
    // ซอมบี้โจมตี (ถ้าไม่มึน)
    if (stunLeft > 0) stunLeft--; else {
      const zr = Math.max(1, d6() - (diceLeft > 0 ? 1 : 0)); if (zr > d6()) { hh -= Math.max(1, Math.round((5 + st("str")) * mult(d6()) * 0 + (5 + st("str")) * (1 - hu.red / 100))); zh = Math.min(zMax, zh + (L.heal || 2)); if (L.bleed && hb <= 0) hb = 18; }
    }
    if (hb > 0) { hh -= 1.33; hb--; }
    if (diceLeft > 0) diceLeft--; if (stunImm > 0) stunImm--;
    if (bleed > 0) { zh -= 0.667 * bleedV; bleed--; }
    if (hh <= 0) return 1;
    if (hh < 0.4 * hMax && (band > 0 || med > 0)) { if (med > 0 && hh < 0.3 * hMax) { med--; hh += 50; } else if (band > 0) { band--; hh += 20; } else { med--; hh += 50; } hb = 0; hh = Math.min(hMax, hh); }
    else if (d6() > d6() && !(Math.random() < 0.03 * Math.max(0, st("agi")))) {
      const w = dur > 0 ? wpn.dmg : 5; dur--; let dmg = Math.max(1, w + hu.str - st("tough")); if (L.cut) dmg = Math.max(1, Math.floor(dmg * L.cut)); zh -= dmg;
      if (fx && Math.random() * 100 < fx.p) {   // ติดสถานะ (เมื่อโดน)
        if (fx.t === "bleed" || fx.t === "poison") { if (bleed <= 0 || bleedV < fx.v) { bleed = fx.m * 6; bleedV = fx.v; } }
        else if (fx.t === "stun") { if (stunImm <= 0 && stunLeft <= 0) { stunLeft = 6; stunImm = 24; } }
        else if (fx.t === "dice") { if (diceLeft <= 0) diceLeft = fx.m * 6; }
      }
    }
    if (zh <= 0) return 0;
  }
  return 0.5;
}
const pct = (x) => (100 * x).toFixed(0).padStart(3) + "%", run = (z, line, hu, w, fx) => { let s = 0; for (let i = 0; i < N; i++) s += duel(z, line, hu, w, fx); return s / N; };
// ธรรมดา → ติดสถานะ ที่ระดับใกล้เคียง (ซอมบี้ชนะ% — ยิ่งต่ำ = มนุษย์ได้เปรียบ)
const PAIRS = [["knife 12/25", { dmg: 12, dur: 25 }, "fxw_cleaver"], ["pocket_knife 9/30", { dmg: 9, dur: 30 }, "fxw_venom"], ["wooden_bat 8/20", { dmg: 8, dur: 20 }, "fxw_stunbat"], ["fire_axe 18/16", { dmg: 18, dur: 16 }, "fxw_ripaxe"], ["spiked_bat 14/18", { dmg: 14, dur: 18 }, "fxw_hammer"], ["crossbow 22/14", { dmg: 22, dur: 14 }, "fxw_dartbow"], ["samurai 28/22", { dmg: 28, dur: 22 }, "fxw_chainsaw"], ["pistol 25/12", { dmg: 25, dur: 12 }, "fxw_taser"], ["samurai 28/22", { dmg: 28, dur: 22 }, "fxw_plague"]];
for (const [zn, z] of Object.entries(ZB)) for (const [hn, hu] of Object.entries(HU)) {
  console.log(`\n=== ${zn} vs ${hn} (ซอมบี้ชนะ%: ธรรมดา → ติดสถานะ) — ตะกละ | ซากหนา | เลื้อยคลาน ===`);
  for (const [pn, plain, key] of PAIRS) {
    const d = FXW[key], cells = ["hunter", "giant", "shade"].map((l) => `${pct(run(z, l, hu, plain, null))}→${pct(run(z, l, hu, { dmg: d.dmg, dur: d.dur }, d.fx))}`);
    console.log(`${pn.padEnd(18)} → ${d.icon}${d.name.padEnd(14)} ${d.fx.t}${d.fx.v} ${d.fx.p}% | ${cells.join(" | ")}`);
  }
}
