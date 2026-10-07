// ⚖️ จำลองสมดุลสายวิวัฒนาการซอมบี้ (ตะกละ/ซากหนา/เลื้อยคลาน) ใน PvP เทียบกับมนุษย์ — `node tests/sim/lines_balance.js`
// สมมติ: สเตตัส/อาวุธ/นโยบายผู้เล่น (ไม่ใช่ข้อมูลจริงจากเกม) • สูตรหลักตรงกับ script.js (resolveAttack/attack/evoBonusAt/evoCutDmg/bleedRec/evoClaimWrites)
// ผลแต่ละแถว: ชนะ% ของซอมบี้ (ดวลตัวต่อตัว ทั้งสองฝั่งโจมตีทุก 10 วิ จนมีฝ่ายล้ม) • เลือดซอมบี้ที่เหลือเฉลี่ยเมื่อชนะ
const N = 8000;
const d6 = () => 1 + Math.floor(Math.random() * 6);
const CFG0 = { agiPen: [0, 1, 2, 3, 3], shadeHp: (s) => (s >= 3 ? 2 : s >= 2 ? 1 : 0), shadeAgi: [0, 2, 2, 2, 3], gHp: [0, 2, 2, 2, 4], evoCut: 0.9, bleed: true, bleedSteps: 18 };
let CFG = { ...CFG0 };
const GREEN = { agiPen: [0, 2, 4, 6, 6], gHp: [0, 3, 3, 3, 5], toughG: 2 };
const evoB = (e, k) => { const h = e.h || 0, g = e.g || 0, s = e.s || 0, cap = { str: 2, hp: 4, agi: 4, tough: 2 }; let v = 0; if (k === "str") v = (h >= 1) + (h >= 4) + (g >= 1 ? (CFG.giantStr || 0) : 0); else if (k === "hp") v = CFG.gHp[g] - CFG.shadeHp(s); else if (k === "agi") v = CFG.shadeAgi[s] - CFG.agiPen[g]; else if (k === "tough") v = g >= 1 ? (CFG.toughG || 1) : 0; return cap[k] !== undefined && !CFG.nocap ? Math.min(v, cap[k]) : v; };
// ตารางฮีลตอนกัดโดน (ตาม evo h และขั้นมิวเตชัน m 0–4)
const HEAL = {
  "ปัจจุบัน 2/3/5": (h) => (h >= 4 ? 5 : h >= 2 ? 3 : 2),
  "ข้อเสนอแรก 4/6/8/10": (h, m) => (m >= 4 ? 10 : h >= 4 ? 8 : h >= 2 ? 6 : 4),
  "ข้อเสนอสอง 3/4/5/6": (h, m) => (m >= 4 ? 6 : h >= 4 ? 5 : h >= 2 ? 4 : 3)
};
function duel(z, hu, healFn, o = {}) {
  const st = (k) => z.s[k] + evoB(z.e, k), zMax = 100 + 10 * st("hp"), hMax = 100 + 10 * hu.hp;
  let zh = zMax, hh = hMax, bleed = 0, band = hu.band, med = hu.med, step = 0, dur = o.dur === undefined ? 1e9 : o.dur;
  const cut = 1 - (o.extraCut || 0);   // มิวเตชันซากหนา/ความสามารถ
  while (step++ < 60) {
    // ซอมบี้โจมตี
    if ((step === 1 && o.ambushRoll ? d6() + o.ambushRoll : d6()) > d6()) {
      let raw = 5 + st("str"); if (o.ambush && step === 1) raw *= o.ambush;
      hh -= Math.max(1, Math.round(Math.floor(raw) * (1 - hu.red / 100)));
      zh = Math.min(zMax, zh + healFn(z.e.h || 0, z.m || 0));
      if (CFG.bleed && (z.e.h || 0) >= 3 && bleed <= 0) bleed = CFG.bleedSteps;   // เลือดไหล 3 นาที = 18 สเต็ป (10 วิ) — 2 HP ต่อ 15 วิ ≈ 1.33 ต่อสเต็ป
    }
    if (bleed > 0) { hh -= CFG.bleedDmg || 1.33; bleed--; }
    if (hh <= 0) return { win: 1, hp: zh / zMax };
    // มนุษย์: ฮีลเมื่อ HP < 40% (ใช้เวลาแทนการโจมตี) ไม่งั้นโจมตี
    if (hh < 0.4 * hMax && (band > 0 || med > 0)) { if (med > 0 && hh < 0.3 * hMax) { med--; hh = Math.min(hMax, hh + 50); } else if (band > 0) { band--; hh = Math.min(hMax, hh + 20); } else { med--; hh = Math.min(hMax, hh + 50); } bleed = 0; }
    else if (d6() > d6() && !(Math.random() < 0.03 * st("agi"))) {
      const w = dur > 0 ? hu.w : 5; dur--; let dmg = Math.max(1, w + hu.str - st("tough")); if (z.e.g >= 2) dmg = Math.max(1, Math.floor(dmg * CFG.evoCut)); dmg = Math.max(1, Math.round(dmg * cut)); zh -= dmg;
    }
    if (zh <= 0) return { win: 0, hp: 0 };
  }
  return { win: 0.5, hp: zh / zMax, timeout: 1 };   // หมดเวลา = เสมอ
}
const run = (z, hu, hf, o) => { let w = 0, hp = 0, k = 0; for (let i = 0; i < N; i++) { const r = duel(z, hu, hf, o); w += r.win; if (r.win === 1) { hp += r.hp; k++; } } return { win: w / N, hp: k ? hp / k : 0 }; };
const pct = (x) => (100 * x).toFixed(0).padStart(3) + "%";
const ZB = { "กลาง 26 แต้ม": { str: 8, hp: 8, agi: 6, tough: 4 }, "ปลาย 50 แต้ม": { str: 14, hp: 14, agi: 12, tough: 10 } };
const HU = { "มนุษย์กลาง (ขวาน 18, เกราะ 15%)": { str: 9, hp: 9, w: 18, red: 15, band: 3, med: 1 }, "มนุษย์ปลาย (ซามูไร 28, เกราะ 20%)": { str: 14, hp: 14, w: 28, red: 20, band: 5, med: 2 } };
const LINES = [["ไม่มีสาย", {}, 0, 0], ["🩸 ตะกละ ขั้น 4", { h: 4 }, 0, 0], ["🗿 ซากหนา ขั้น 4", { g: 4 }, 0, 0], ["🕷️ เลื้อยคลาน ขั้น 4", { s: 4 }, 0, 0], ["🩸 ตะกละ ขั้น 8", { h: 4 }, 4, 0], ["🗿 ซากหนา ขั้น 8 (ลดดาเมจ +4%)", { g: 4 }, 4, 0.04], ["🕷️ เลื้อยคลาน ขั้น 8", { s: 4 }, 4, 0]];
for (const [hn, hf] of Object.entries(HEAL)) {
  console.log(`\n=== ตารางฮีล: ${hn} === (ชนะ% ของซอมบี้ / เลือดเหลือเมื่อชนะ)`);
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) {
    let line = `${zn.padEnd(13)} vs ${hun.slice(0, 20).padEnd(20)} |`;
    for (const [ln, e, m, ec] of LINES) { const r = run({ s: zs, e, m }, hu, hf, { extraCut: ec }); line += ` ${ln.split(" ")[1] ? ln.slice(0, 2) + ln.slice(-6) : ln.slice(0, 5)} ${pct(r.win)}`; }
    console.log(line);
  }
}

// ---- ลองปรับสาย (ตารางฮีลปัจจุบัน) — ชนะ% ของซอมบี้ ขั้น 4 vs มนุษย์ปลายสุด/กลาง
function tweak(name, cfg, heal = HEAL["ปัจจุบัน 2/3/5"]) {
  CFG = { ...CFG0, ...cfg }; let line = name.padEnd(46) + "|";
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) { const r = ["h", "g", "s"].map((k) => run({ s: zs, e: { [k]: 4 }, m: 0 }, hu, heal, {}).win); line += ` ${zn.slice(0, 3)}/${hun.includes("ปลาย") ? "มปลาย" : "มกลาง"}: 🩸${pct(r[0])} 🗿${pct(r[1])} 🕷${pct(r[2])} •`; }
  console.log(line); CFG = { ...CFG0 };
}
console.log("\n=== ลองปรับ (ซอมบี้ขั้น 4 ของแต่ละสาย • ตารางฮีลปัจจุบัน) ===");
tweak("ปัจจุบัน", {});
tweak("ตะกละ: ไม่มีเลือดไหล", { bleed: false });
tweak("ตะกละ: เลือดไหลสั้นลง (1.5 นาที)", { bleedSteps: 9 });
tweak("ซากหนา: เลิกลดว่องไว (−1 ที่ขั้น 3-4)", { agiPen: [0, 0, 0, 1, 1] });
tweak("ซากหนา: ลดดาเมจ 15% (แทน 10%)", { evoCut: 0.85 });
tweak("ซากหนา: ทั้งสองข้อ", { agiPen: [0, 0, 0, 1, 1], evoCut: 0.85 });
tweak("เลื้อยคลาน: ไม่หัก HP", { shadeHp: () => 0 });
tweak("เลื้อยคลาน: หัก HP ครึ่งหนึ่ง (−5/−10)", { shadeHp: (s) => (s >= 3 ? 1 : 0) });
tweak("เลื้อยคลาน: ว่องไว +4 รวม", { shadeAgi: [0, 2, 2, 3, 4] });
tweak("เลื้อยคลาน: ไม่หัก HP + ว่องไว +4", { shadeHp: () => 0, shadeAgi: [0, 2, 2, 3, 4] });

// ---- อยู่รอด% (ไม่ตายภายใน 10 นาที = ชนะหรือหมดเวลา) และเวลาที่อยู่รอดเฉลี่ย (สเต็ป 10 วิ) — วัดบทบาทแทงค์ของซากหนา
function surv(name, zs, hu, e, m = 0, ec = 0) {
  let alive = 0, steps = 0; const z = { s: zs, e, m };
  for (let i = 0; i < N; i++) { const st = (k) => z.s[k] + evoB(z.e, k); const zMax = 100 + 10 * st("hp"); const r = duel(z, hu, HEAL["ปัจจุบัน 2/3/5"], { extraCut: ec }); alive += r.win === 0 ? 0 : 1; }
  return alive / N;
}
console.log("\n=== อยู่รอด% ในการดวลกับมนุษย์ปลายสุด (ตารางฮีลปัจจุบัน) ===");
for (const [zn, zs] of Object.entries(ZB)) { let line = zn.padEnd(13) + "|"; for (const [ln, e, m, ec] of LINES) line += ` ${ln.slice(0, 2)}${ln.includes("8") ? "8" : "4"}:${pct(surv(ln, zs, HU["มนุษย์ปลาย (ซามูไร 28, เกราะ 20%)"], e, m, ec))}`; console.log(line); }

// ---- ทดสอบความไว: ใส่เกราะ/อวัยวะซอมบี้ลดดาเมจ 12% + อาวุธมนุษย์พังหลังตี 16 ครั้ง (ใกล้ขวาน/ซามูไร)
console.log("\n=== สมมาตรขึ้น: ซอมบี้ลดดาเมจ 12% (อวัยวะ) + อาวุธมนุษย์ทนตี 16 ครั้ง ===");
for (const [tag, o] of [["เดิม", {}], ["สมมาตรขึ้น", { extraCut: 0.12, dur: 16 }]]) {
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) {
    let line = `${tag.padEnd(10)} ${zn.slice(0, 5).padEnd(6)} vs ${hun.includes("ปลาย") ? "มปลาย" : "มกลาง"} |`;
    for (const [ln, e] of [["ไม่มี", {}], ["🩸", { h: 4 }], ["🗿", { g: 4 }], ["🕷", { s: 4 }]]) line += ` ${ln} ${pct(run({ s: zs, e, m: 0 }, hu, HEAL["ปัจจุบัน 2/3/5"], o).win)}`;
    console.log(line);
  }
}

// ---- ข้อเสนอของเจ้าของเกม (ทดลอง): ตะกละ ฮีล 4/8 • ซากหนา HP +50 ทน +2 ลดดาเมจ 15% หลบ −18% มิวเตชันสูงสุดลด +20% • เลื้อยคลาน มิวเตชันสูงสุด HP −40 หลบ +18%
const HEAL_NEW = (h, m) => (h >= 4 ? 8 : h >= 2 ? 4 : 2);
function propose(tag, o) {
  console.log("\n" + tag);
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) {
    const hs = hun.includes("ปลาย") ? "มปลาย" : "มกลาง";
    const cell = (cfg, e, m, ec, hf) => { CFG = { ...CFG0, nocap: true, ...cfg }; const r = run({ s: zs, e, m }, hu, hf || HEAL["ปัจจุบัน 2/3/5"], { ...o, extraCut: (o.extraCut || 0) + (ec || 0) }); CFG = { ...CFG0 }; return pct(r.win); };
    const base = ["h", "g", "s"].map((k) => cell({}, { [k]: 4 }, 0, 0));
    const prop = [cell({}, { h: 4 }, 0, 0, HEAL_NEW), cell({ ...GREEN, evoCut: 0.85 }, { g: 4 }, 0, 0), cell({ shadeAgi: [0, 2, 2, 2, 3] }, { s: 4 }, 0, 0)];
    const prop8 = [cell({}, { h: 4 }, 4, 0, HEAL_NEW), cell({ ...GREEN, evoCut: 0.85 }, { g: 4 }, 4, 0.20), cell({ shadeAgi: [0, 2, 2, 2, 6], shadeHp: (x) => (x >= 3 ? 4 : 0) }, { s: 4 }, 4, 0)];
    console.log(`${zn.slice(0, 5)} vs ${hs} | ปัจจุบัน ขั้น4: 🩸${base[0]} 🗿${base[1]} 🕷${base[2]}  → ข้อเสนอ ขั้น4: 🩸${prop[0]} 🗿${prop[1]} 🕷${prop[2]}  → ข้อเสนอ ขั้น8: 🩸${prop8[0]} 🗿${prop8[1]} 🕷${prop8[2]}`);
  }
}
propose("=== ข้อเสนอของเจ้าของเกม (สมมติฐานเดิม) ===", {});
propose("=== ข้อเสนอของเจ้าของเกม (สมมาตรขึ้น: ซอมบี้ลดดาเมจ 12% + อาวุธมนุษย์พังหลัง 16 ครั้ง) ===", { extraCut: 0.12, dur: 16 });

// ---- ชุดข้อเสนอรอบ 2: ตะกละ ฮีลฐาน 2/3/5 และ 8 เฉพาะมิวเตชันขั้น 8 • ซากหนา HP +50 ทน +2 หลบ −18% + ลดดาเมจมิวเตชัน • เลื้อยคลานตามเดิม — ทุกสถานการณ์
const HEAL_P2 = (h, m) => (m >= 4 ? 8 : h >= 4 ? 5 : h >= 2 ? 3 : 2);
function scenario(o, tag) {
  console.log("\n=== " + tag + " ===  (ชนะ% ของซอมบี้)");
  console.log("ซอมบี้/มนุษย์".padEnd(18) + "| ไม่มี | 🩸ปจ.4 | 🩸เสนอ8 | 🗿ปจ.4 | 🗿เสนอ4 | 🗿8(+15ซ้อน) | 🗿8(รวม15) | 🕷ปจ.4 | 🕷ปจ.8");
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) {
    const c = (cfg, e, m, ec, hf) => { CFG = { ...CFG0, nocap: true, ...cfg }; const r = run({ s: zs, e, m }, hu, hf || HEAL["ปัจจุบัน 2/3/5"], { ...o, extraCut: (o.extraCut || 0) + (ec || 0) }); CFG = { ...CFG0 }; return pct(r.win); };
    const G = { ...GREEN, evoCut: 0.9 };
    const row = [c({}, {}, 0, 0), c({}, { h: 4 }, 0, 0), c({}, { h: 4 }, 4, 0, HEAL_P2), c({}, { g: 4 }, 0, 0), c(G, { g: 4 }, 0, 0), c(G, { g: 4 }, 4, 0.15), c(G, { g: 4 }, 4, 0.05), c({}, { s: 4 }, 0, 0), c({}, { s: 4 }, 4, 0)];
    console.log(`${zn.slice(0, 5)}/${hun.includes("ปลาย") ? "มปลาย" : "มกลาง"}`.padEnd(18) + "| " + row.join("   |  "));
  }
}
scenario({}, "สมมติฐานเดิม (มนุษย์ได้เปรียบ)");
scenario({ extraCut: 0.12, dur: 16 }, "สมมาตรขึ้น (ซอมบี้ลดดาเมจ 12% + อาวุธมนุษย์พังหลัง 16 ครั้ง)");

// ---- ต้นทุนอาหารของตะกละ (ต่อชั่วโมง) — สมมติ: ค้น 18 ครั้ง/ชม. (ฟื้นพลังงานฐาน) • ค้นเสีย 5 อาหาร • โจมตีเสีย 2 • เนื้อเน่าเจอ 17% ของการค้น (ส่วนใหญ่ของโซน) • โจมตีโดน 42% • ซอมบี้หมดอาหาร 1 แต้มต่อ 100 วิ
function food(label, hungerPct, foodMult, meatPct) {
  const drain = 36 * (1 + hungerPct / 100), search = 18 * 5, meat = 18 * 0.17 * (1 + meatPct / 100) * 20 * foodMult, per = 25 * foodMult;
  const b = (drain + search - meat) / (per - 2 / 0.42);   // ต้องกัดโดนกี่ครั้งต่อชั่วโมงจึงสมดุล
  console.log(label.padEnd(44) + `หมดอาหาร ${drain.toFixed(0).padStart(3)}/ชม. • เนื้อเน่าหาได้ ${meat.toFixed(0).padStart(3)}/ชม. • ต้องกัดโดน ${b.toFixed(1).padStart(4)} ครั้ง/ชม. (โจมตี ≈ ${(b / 0.42).toFixed(0)} ครั้ง)`);
}
console.log("\n=== ต้นทุนอาหารของตะกละ ===");
food("ซอมบี้ไม่มีสาย", 0, 1, 0); food("ตะกละ ขั้น 4 ปัจจุบัน (หิว +40%)", 40, 1, 0);
food("ข้อเสนอ: หิว +50% อาหารที่ได้ ×0.5 เนื้อเน่า +20%", 50, 0.5, 20);
food("ทางกลาง: หิว +50% อาหารที่ได้ ×0.75 เนื้อเน่า +20%", 50, 0.75, 20);
food("ทางกลาง: หิว +30% อาหารที่ได้ ×0.75 เนื้อเน่า +20%", 30, 0.75, 20);
food("ทางกลาง: หิว +30% อาหารที่ได้ ×0.67 เนื้อเน่า +20%", 30, 0.67, 20);

// ---- ชุดสุดท้ายที่เสนอ (รอบ 3): ตะกละ ฮีล 2/3/5 และ 8 ที่มิวเตชันขั้น 8 • ซากหนา HP +50 ทน +2 หลบ −12% (agi −4) ลดดาเมจรวม 15% ที่ขั้น 8 • เลื้อยคลานตามเดิม
function final(o, tag) {
  console.log("\n=== " + tag + " ===  (ชนะ% ของซอมบี้)");
  console.log("ซอมบี้/มนุษย์".padEnd(16) + "| ไม่มี | 🩸4 | 🩸8 | 🩸4 เลือด½ | 🩸8 เลือด½ | 🗿ปจ.4 | 🗿เสนอ4 | 🗿เสนอ8 | 🕷4 | 🕷8");
  for (const [zn, zs] of Object.entries(ZB)) for (const [hun, hu] of Object.entries(HU)) {
    const c = (cfg, e, m, ec, hf) => { CFG = { ...CFG0, nocap: true, ...cfg }; const r = run({ s: zs, e, m }, hu, hf || HEAL["ปัจจุบัน 2/3/5"], { ...o, extraCut: (o.extraCut || 0) + (ec || 0) }); CFG = { ...CFG0 }; return pct(r.win); };
    const G = { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 1, 2, 3, 4], evoCut: 0.9 }, half = { bleedDmg: 0.67 };
    const row = [c({}, {}, 0, 0), c({}, { h: 4 }, 0, 0, HEAL_P2), c({}, { h: 4 }, 4, 0, HEAL_P2), c(half, { h: 4 }, 0, 0, HEAL_P2), c(half, { h: 4 }, 4, 0, HEAL_P2), c({}, { g: 4 }, 0, 0), c(G, { g: 4 }, 0, 0), c(G, { g: 4 }, 4, 0.05), c({}, { s: 4 }, 0, 0), c({}, { s: 4 }, 4, 0)];
    console.log(`${zn.slice(0, 5)}/${hun.includes("ปลาย") ? "มปลาย" : "มกลาง"}`.padEnd(16) + "| " + row.join("  | "));
  }
}
final({}, "ชุดสุดท้าย — สมมติฐานเดิม");
final({ extraCut: 0.12, dur: 16 }, "ชุดสุดท้าย — สมมาตร (อวัยวะซอมบี้ลด 12% + อาวุธมนุษย์พัง)");

// ---- ปรับซากหนา (แทงค์) เพิ่มเติม: ชนะ% / อยู่รอด% (ไม่ตายใน 10 นาที) • เทียบตะกละขั้น 8 (ฮีล 8) เป็นเกณฑ์
function giantVariants() {
  const o = { extraCut: 0.12, dur: 16 }, cases = [["กลาง/มกลาง", ZB["กลาง 26 แต้ม"], HU["มนุษย์กลาง (ขวาน 18, เกราะ 15%)"]], ["ปลาย/มปลาย", ZB["ปลาย 50 แต้ม"], HU["มนุษย์ปลาย (ซามูไร 28, เกราะ 20%)"]]];
  const cell = (cfg, e, m, ec, zs, hu, hf) => { CFG = { ...CFG0, nocap: true, ...cfg }; let w = 0, alive = 0; for (let i = 0; i < N; i++) { const r = duel({ s: zs, e, m }, hu, hf || HEAL["ปัจจุบัน 2/3/5"], { ...o, extraCut: o.extraCut + (ec || 0) }); w += r.win; alive += r.win === 0 ? 0 : 1; } CFG = { ...CFG0 }; return `${pct(w / N)}/${pct(alive / N)}`; };
  const V = [
    ["ปัจจุบัน (ไม่ปรับ)", {}, 0, 0, null],
    ["ชุดที่ 3: HP+50 ทน+2 หลบ−12% ลด 15%@8", { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 1, 2, 3, 4], evoCut: 0.9 }, 4, 0.05],
    ["แทงค์ B: HP+50 ทน+2 หลบ−6% ลด 15%@ขั้น2 25%@8", { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 0, 1, 2, 2], evoCut: 0.85 }, 4, 0.12],
    ["แทงค์ B′: B แต่ขั้น 8 ลดเพิ่มแค่ +5%", { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 0, 1, 2, 2], evoCut: 0.85 }, 4, 0.05],
    ["แทงค์ B″: B แต่ขั้น 8 ลดเพิ่ม +8%", { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 0, 1, 2, 2], evoCut: 0.85 }, 4, 0.08],
    ["แทงค์ C: HP+60 ทน+2 หลบ−6% ลด 20%@ขั้น2 30%@8", { gHp: [0, 3, 4, 4, 6], toughG: 2, agiPen: [0, 0, 1, 2, 2], evoCut: 0.8 }, 4, 0.12],
    ["แทงค์ D: B + ตีโต้ (พละกำลัง +2 เหมือนตะกละ)", { gHp: [0, 3, 3, 3, 5], toughG: 2, agiPen: [0, 0, 1, 2, 2], evoCut: 0.85, giantStr: 2 }, 4, 0.12]
  ];
  console.log("\n=== ซากหนา ขั้น 4 และ ขั้น 8 — ชนะ%/อยู่รอด% (สมมาตร) ===");
  console.log("ตัวเลือก".padEnd(52) + "| กลาง/กลาง ขั้น4 | กลาง/กลาง ขั้น8 | ปลาย/ปลายสุด ขั้น4 | ปลาย/ปลายสุด ขั้น8");
  for (const [name, cfg, m8, ec8] of V) {
    const g4 = (zs, hu) => cell(cfg, { g: 4 }, 0, 0, zs, hu), g8 = (zs, hu) => cell(cfg, { g: 4 }, m8, ec8, zs, hu);
    console.log(name.padEnd(52) + `| ${g4(cases[0][1], cases[0][2])}      | ${g8(cases[0][1], cases[0][2])}      | ${g4(cases[1][1], cases[1][2])}         | ${g8(cases[1][1], cases[1][2])}`);
  }
  const hz = (m, zs, hu) => cell({}, { h: 4 }, m, 0, zs, hu, HEAL_P2);
  console.log("เทียบ ตะกละ ขั้น 4 / ขั้น 8 (ฮีล 8)".padEnd(52) + `| ${hz(0, cases[0][1], cases[0][2])}      | ${hz(4, cases[0][1], cases[0][2])}      | ${hz(0, cases[1][1], cases[1][2])}         | ${hz(4, cases[1][1], cases[1][2])}`);
}
giantVariants();

// ---- เลื้อยคลาน (สายซุ่ม): ซุ่มฟาดแรกหลังเข้าโซน (ตอนนี้ ×1.5 ขั้น 3 / ×2 ขั้น 4 ครั้งเดียวต่อการเดินทาง) — ดวลที่ซอมบี้ "เปิดด้วยซุ่ม" เสมอ
function shadeAmbush() {
  const base = { extraCut: 0.12, dur: 16 };
  const V = [["ไม่ซุ่ม (ปัจจุบันขั้น 4 ไม่นับซุ่ม)", {}], ["ซุ่มปัจจุบัน ×2", { ambush: 2 }], ["ซุ่ม ×3", { ambush: 3 }], ["ซุ่ม ×4", { ambush: 4 }], ["ซุ่ม ×3 + ทอยแรก +2", { ambush: 3, ambushRoll: 2 }], ["ซุ่ม ×4 + ทอยแรก +2", { ambush: 4, ambushRoll: 2 }], ["ซุ่ม ×4 + ทอยแรก +3 (แทบโดนแน่)", { ambush: 4, ambushRoll: 3 }]];
  console.log("\n=== เลื้อยคลานขั้น 4 เปิดด้วยซุ่ม — ชนะ% (สมมาตร) • มนุษย์กลาง/ปลายสุด • ซอมบี้กลาง/ปลาย ===");
  console.log("ตัวเลือก".padEnd(40) + "| กลาง/กลาง | ปลาย/กลาง | ปลาย/ปลายสุด | ดาเมจเปิดเฉลี่ย (ครั้งเดียว/เดินทาง)");
  for (const [name, o] of V) {
    const cell = (zs, hu) => pct(run({ s: zs, e: { s: 4 }, m: 0 }, hu, HEAL["ปัจจุบัน 2/3/5"], { ...base, ...o }).win);
    const zs = ZB["ปลาย 50 แต้ม"], raw = 5 + zs.str + 3 * 0, pHit = (o.ambushRoll ? 1 - (6 - 0) / 36 * 0 : 0) , pm = o.ambushRoll ? (() => { let c = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (Math.min(6 + o.ambushRoll, a + o.ambushRoll) > b) c++; return c / 36; })() : 15 / 36;
    console.log(name.padEnd(40) + `|   ${cell(ZB["กลาง 26 แต้ม"], HU["มนุษย์กลาง (ขวาน 18, เกราะ 15%)"])}     |   ${cell(ZB["ปลาย 50 แต้ม"], HU["มนุษย์กลาง (ขวาน 18, เกราะ 15%)"])}     |    ${cell(ZB["ปลาย 50 แต้ม"], HU["มนุษย์ปลาย (ซามูไร 28, เกราะ 20%)"])}      | ≈ ${(pm * (5 + ZB["ปลาย 50 แต้ม"].str + 3) * (o.ambush || 1) * 0.85).toFixed(0)} HP`);
  }
}
shadeAmbush();
