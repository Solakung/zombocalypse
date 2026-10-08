// จำลองสมดุลบอสเผ่ามนุษย์ (ซอมบี้) เทียบบอสฝั่งมนุษย์ — `node tests/sim/hboss_balance.js` • สมมติสเตตัส/ของ/นโยบายผู้เล่น (ไม่ใช่ข้อมูลจริง) ใช้ตัวเลขบอสจาก functions/hboss.js และ script.js โดยตรง
const fs = require("fs"); const R = require("path").resolve(__dirname, "../..") + "/";
const H = require(R + "functions/hboss.js"), PK = require(R + "functions/pack.js"); const sc = fs.readFileSync(R + "script.js", "utf8");
const hb = sc.slice(sc.indexOf("const BOSSES = {"), sc.indexOf("\n};", sc.indexOf("const BOSSES = {")) + 3);
const HBOSS = new Function(hb.replace("const BOSSES", "const B") + "; return B;")();
const d6 = () => 1 + Math.floor(Math.random() * 6), ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const mult = (r) => (r === 1 ? 0 : r <= 3 ? 0.6 : r <= 5 ? 1 : 1.5);
const evoB0 = (e, k) => { const h = e.h || 0, g = e.g || 0, s = e.s || 0, cap = { str: 2, hp: 5, agi: 4, tough: 2 }; let v = 0; if (k === "str") v = (h >= 1) + (h >= 4); else if (k === "hp") v = (g >= 1 ? 3 : 0) + (g >= 4 ? 2 : 0) - (s >= 3 ? 2 : s >= 2 ? 1 : 0); else if (k === "agi") v = (s >= 1 ? 2 : 0) + (s >= 4 ? 1 : 0) - [0, 0, 1, 2, 2][g]; else if (k === "tough") v = g >= 1 ? 2 : 0; return cap[k] !== undefined ? Math.min(v, cap[k]) : v; };
const evoB = (e, k) => { const t = PK.packTier(e), v = evoB0(e, k) + PK.packBonus(k, t), cap = { str: 2, hp: 5, agi: 4, tough: 2 }; return cap[k] !== undefined ? Math.min(v, cap[k]) : v; };   // + สายแรปเตอร์ (e.p)
// ---- ซอมบี้ผู้เล่นสู้บอสเผ่า (ตรงกับ functions/hboss.js)
function zFight(z, b) {
  const st = (k) => (z.s[k] || 0) + evoB(z.e || {}, k), maxHp = 100 + 10 * st("hp"); const pt = PK.packTier(z.e || {}); let hp = maxHp, bh = b.hp, sh = b.shield || 0, round = 0, pdN = 0, pdP = 0, wk = 0, rounds = 0;
  const strike = () => { let t = 0, landed = 0; const heavy = b.heavy && round % b.heavy === 0; for (let i = 0; i < b.hits; i++) { if (Math.random() >= b.acc) continue; if (Math.random() < Math.min(PK.DODGE_CAP, Math.max(0, 0.03 * st("agi")) + (pt ? PK.DODGE[pt] : 0))) continue; if (pt && Math.random() < PK.INTERCEPT[pt]) continue; let d = ri(b.dmg[0], b.dmg[1]); if (heavy) d = Math.round(d * 1.5); d = Math.max(1, d - Math.max(0, st("tough"))); t += d; landed++; } if (landed) { if (b.pdot) { pdN = b.pdot.n; pdP = b.pdot.per; } if (b.weak) wk = b.weak.n; } return t; };
  if (b.first) { round = 1; hp -= strike(); if (hp <= 0) return { r: "dead", loss: 1, rounds: 0 }; }
  for (;;) {
    round++; rounds++;
    if (hp < 0.35 * maxHp) { if (Math.random() < b.flee) return { r: "flee", loss: 1 - hp / maxHp, rounds }; }
    else { let dmg = Math.round(Math.max(1, 5 + st("str")) * mult(d6())); if (wk > 0 && dmg > 0) { dmg = Math.max(1, Math.round(dmg * (100 - b.weak.pct) / 100)); wk--; } if (dmg && sh > 0) { const ab = Math.min(sh, dmg); sh -= ab; dmg -= ab; } bh -= dmg; if (bh <= 0) return { r: "win", loss: 1 - hp / maxHp, rounds }; }
    if (pt && Math.random() < PK.BITE_ACC) { let md = ri(PK.BITE[pt][0], PK.BITE[pt][1]); if (sh > 0) { const ab = Math.min(sh, md); sh -= ab; md -= ab; } bh -= md; if (bh <= 0) return { r: "win", loss: 1 - hp / maxHp, rounds }; }   // ลูกฝูงกัดทุกรอบที่สู้ต่อ
    if (pdN > 0) { hp -= pdP; pdN--; } if (hp > 0) hp -= strike(); if (hp <= 0) return { r: "dead", loss: 1, rounds };
    if (rounds > 200) return { r: "stall", loss: 1 - hp / maxHp, rounds };
  }
}
// ---- มนุษย์สู้บอสฝั่งมนุษย์ (ตาม script.js: ไม่มีหลบ, มีเกราะลดดาเมจ, ใช้ผ้าพันแผล/ชุดปฐมพยาบาลได้)
function hFight(h, b) {
  const maxHp = 100 + 10 * h.s.hp; let hp = maxHp, bh = b.hp, bd = h.bandage, mk = h.medkit, rounds = 0, dur = h.dur;
  for (;;) {
    rounds++;
    if (hp < 0.4 * maxHp && (mk > 0 || bd > 0)) { if (mk > 0 && hp < 0.3 * maxHp) { mk--; hp = Math.min(maxHp, hp + 50); } else if (bd > 0) { bd--; hp = Math.min(maxHp, hp + 20); } else { mk--; hp = Math.min(maxHp, hp + 50); } }
    else if (hp < 0.3 * maxHp) { if (Math.random() < b.flee) return { r: "flee", loss: 1 - hp / maxHp, rounds }; }
    else { const w = dur > 0 ? h.w : 0; const dmg = Math.round(Math.max(1, (w || 5) + h.s.str) * mult(d6())); if (w) dur--; bh -= dmg; if (bh <= 0) return { r: "win", loss: 1 - hp / maxHp, rounds }; }
    let t = 0; for (let i = 0; i < b.hits; i++) if (Math.random() < b.acc) { const d = ri(b.dmg[0], b.dmg[1]); t += d; } hp -= t > 0 ? Math.max(1, Math.round(t * (1 - h.red / 100))) : 0;
    if (hp <= 0) return { r: "dead", loss: 1, rounds }; if (rounds > 200) return { r: "stall", loss: 1, rounds };
  }
}
const N = 6000;
const run = (f, p, b) => { let w = 0, fl = 0, d = 0, loss = 0, rd = 0; for (let i = 0; i < N; i++) { const x = f(p, b); if (x.r === "win") w++; else if (x.r === "flee") fl++; else d++; loss += x.loss; rd += x.rounds; } return { win: w / N, flee: fl / N, dead: d / N, loss: loss / N, rounds: rd / N }; };
const pct = (x) => (100 * x).toFixed(0).padStart(3) + "%";
// ---- โปรไฟล์ (แต้มสเตตัสรวมต่างขั้น + ลายสเตตัสต่างกัน) — ซอมบี้
const alloc = (tot, w) => { const k = Object.keys(w), s = k.reduce((a, x) => a + w[x], 0), o = {}; k.forEach((x) => (o[x] = Math.round((tot * w[x]) / s))); return o; };
const ARCH = { balanced: { str: 1, hp: 1, agi: 1, tough: 1 }, brawler: { str: 3, hp: 2, agi: 0.5, tough: 0.5 }, dodger: { str: 1, hp: 1.5, agi: 3, tough: 0.5 }, tank: { str: 1, hp: 2, agi: 0.5, tough: 2.5 } };
const TIERS = [["เริ่มต้น 7 แต้ม", 7, {}], ["กลาง 20 แต้ม", 20, { h: 1, g: 0, s: 0 }], ["ปลาย 40 แต้ม", 40, { h: 4, g: 0, s: 0 }], ["สูงสุด 60 แต้ม", 60, { h: 4, g: 0, s: 0 }]];
const zeroTier = (e, a) => (a === "dodger" ? { ...e, h: 0, s: e.h ? 3 : 0 } : a === "tank" ? { ...e, h: 0, g: e.h ? 3 : 0 } : e);
const ZB = H.BOSSES, ZZ = ["forest", "police", "port", "factory", "hospital", "tunnel"];
console.log("=== ซอมบี้ผู้เล่น vs บอสเผ่ามนุษย์ (นโยบาย: HP<35% ลองหนี) — ชนะ/หนี/ตาย, เสียเลือดเฉลี่ย, รอบเฉลี่ย ===");
for (const [tn, tot, e] of TIERS) for (const a of Object.keys(ARCH)) {
  const z0 = alloc(tot, ARCH[a]), z = { s: { ...z0, str: Math.min(17, z0.str) }, e: zeroTier(e, a) }; let line = `${tn.padEnd(14)} ${a.padEnd(8)} str${z.s.str} hp${z.s.hp} agi${z.s.agi} tgh${z.s.tough} |`;
  for (const zn of ZZ) { const r = run(zFight, z, ZB[zn]); line += ` ${zn.slice(0, 4)} ${pct(r.win)}/${pct(r.flee)}/${pct(r.dead)}`; }
  console.log(line);
}
console.log("\n=== 🦖 สายแรปเตอร์เทียบสายเดิมที่ขั้นเท่ากัน (สเตตัสพื้นฐานแบบ balanced) — ชนะ/หนี/ตาย ===");
for (const [tn, tot] of [["เริ่มต้น 7 แต้ม", 7], ["ต้น 12 แต้ม", 12]]) for (const t of [1, 2, 3, 4]) for (const [ln, e] of [["ตะกละ", { h: t }], ["ซากหนา", { g: t }], ["เลื้อยคลาน", { s: t }], ["แรปเตอร์", { p: t }]]) {
  const z0 = alloc(tot, ARCH.balanced), z = { s: { ...z0, str: Math.min(17, z0.str) }, e: { h: 0, g: 0, s: 0, ...e } }; let line = `${tn.padEnd(14)} ขั้น${t} ${ln.padEnd(10)} |`;
  for (const zn of ZZ) { const r = run(zFight, z, ZB[zn]); line += ` ${zn.slice(0, 4)} ${pct(r.win)}/${pct(r.flee)}/${pct(r.dead)}`; }
  console.log(line);
}
console.log("\n=== มนุษย์ vs บอสซอมบี้ (มีอาวุธ+เกราะ+ผ้าพันแผล 3 + ชุดปฐมพยาบาล 1) ===");
const HT = [["เริ่มต้น 7 แต้ม", 7, 9, 0], ["กลาง 20 แต้ม", 20, 14, 10], ["ปลาย 40 แต้ม", 40, 22, 15], ["สูงสุด 60 แต้ม", 60, 28, 20]];
const HZ = ["ruins", "forest", "hospital", "police", "mall", "factory", "base", "port", "tunnel"];
for (const [tn, tot, w, red] of HT) for (const [an, aw] of [["brawler", { str: 3, hp: 2 }], ["tank", { str: 1, hp: 3 }]]) {
  const s = alloc(tot, aw); const h = { s: { str: Math.min(13 + 4, s.str || 0), hp: s.hp || 0 }, w, red, bandage: 3, medkit: 1, dur: 20 }; let line = `${tn.padEnd(14)} ${an.padEnd(8)} str${h.s.str} hp${h.s.hp} wpn${w} red${red}% |`;
  for (const zn of HZ) { if (!HBOSS[zn]) continue; const r = run(hFight, h, HBOSS[zn]); line += ` ${zn.slice(0, 4)} ${pct(r.win)}/${pct(r.flee)}/${pct(r.dead)}`; }
  console.log(line);
}
console.log("\nบอสฝั่งมนุษย์ (ข้อมูล):", HZ.filter((z) => HBOSS[z]).map((z) => `${z}:hp${HBOSS[z].hp},${HBOSS[z].hits}×${HBOSS[z].dmg.join("-")},acc${HBOSS[z].acc},flee${HBOSS[z].flee}`).join(" "));
