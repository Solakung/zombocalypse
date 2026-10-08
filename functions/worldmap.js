// 🗺️ แผนที่โลก: ตำแหน่งโซน ถนน พลังงานต่อถนน และพาหนะ (เตรียมรองรับอัปเดตรถยนต์) — ข้อมูลเดียวกับ script.js (บล็อก "แผนที่โลก") แต่ตรวจโดย tests/emulator/worldmap.js
// - ใช้ฝั่งเซิร์ฟเวอร์ในอนาคตตอนเปิดระบบเดินตามถนน (ตรวจเส้นทาง/คิดพลังงาน/สร้างตาราง rules) — ตอนนี้ยังไม่มีฟังก์ชันไหนเรียกใช้ จึงไม่มีผลกับเกม
// - แก้ตำแหน่ง/ถนนที่ script.js แล้วคัดลอกบล็อกเดียวกันมาที่นี่ (เทสต์จะฟ้องถ้าไม่ตรง)
// ---- ข้อมูล (ต้องตรง script.js)
// พิกัด: x 0–100 (ตะวันตก→ตะวันออก) × y 0–130 (เหนือ→ใต้) — ทะเลอยู่ตะวันตก ภูเขาอยู่เหนือ/ตะวันออกเฉียงเหนือ แม่น้ำไหลจากตะวันออกลงทะเลคั่นเมืองเหนือ/ใต้ (สะพานโรงพยาบาลเป็นทางข้ามเดียว)
// ถนน [จาก, ถึง, ชนิด, จุดโค้ง?] • พลังงานต่อถนน = round(ความยาว ÷ unit × ตัวคูณชนิดถนน × ตัวคูณพาหนะ) ขั้นต่ำ 2 • risk = ตัวคูณโอกาสซุ่ม (เตรียมไว้ ยังไม่ใช้) • modes = พาหนะ (เตรียมรองรับอัปเดตรถยนต์/จักรยาน — on:false = ยังไม่เปิด)
const WORLD = {
  w: 100, h: 130, unit: 5.6, km: 0.25,
  nodes: { safe: [52, 106], ruins: [24, 108], forest: [82, 108], factory: [52, 80], port: [18, 82], mall: [82, 82], hospital: [50, 54], casino: [20, 52], base: [24, 22], police: [52, 16], tunnel: [80, 24], lab: [86, 52] },
  roads: [["safe", "ruins", "street", [[38, 110]]], ["safe", "forest", "trail", [[68, 100]]], ["safe", "factory", "main"], ["ruins", "port", "street", [[16, 96]]], ["factory", "port", "street", [[34, 84]]], ["factory", "mall", "street", [[67, 78]]], ["forest", "mall", "trail", [[86, 95]]],
    ["factory", "hospital", "bridge", [[51, 67]]], ["hospital", "casino", "street", [[35, 50]]], ["hospital", "base", "street", [[36, 40]]], ["hospital", "police", "main"], ["hospital", "tunnel", "main", [[66, 44]]], ["hospital", "lab", "street", [[70, 57]]], ["tunnel", "lab", "tunnel", [[88, 38]]]],
  classes: { main: { n: "ถนนหลัก", mul: 1, risk: 0.8, w: 3.2, c: "#c8b077" }, street: { n: "ถนน", mul: 1, risk: 1, w: 2.2, c: "#9aa4ac" }, trail: { n: "ทางป่า", mul: 1.25, risk: 1.4, w: 1.4, c: "#8a7550", dash: "3 2" }, tunnel: { n: "อุโมงค์", mul: 1, risk: 1.6, w: 2.4, c: "#b8b8c8", dash: "1.5 1.5" }, bridge: { n: "สะพาน", mul: 1, risk: 1.2, w: 2.6, c: "#cfc7ad" } },
  modes: { foot: { n: "เดินเท้า", mul: 1, roads: ["main", "street", "trail", "tunnel", "bridge"], on: true }, bike: { n: "จักรยาน", mul: 0.6, roads: ["main", "street", "trail", "bridge"], on: false }, car: { n: "รถยนต์", mul: 0.35, roads: ["main", "street", "bridge", "tunnel"], on: false } }
};
const worldPts = (r) => [WORLD.nodes[r[0]], ...(r[3] || []), WORLD.nodes[r[1]]];
const worldLen = (r) => { const p = worldPts(r); let t = 0; for (let i = 1; i < p.length; i++) t += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return t; };
const worldCost = (r, mode = "foot") => { const m = WORLD.modes[mode]; return m && m.roads.includes(r[2]) ? Math.max(2, Math.round((worldLen(r) / WORLD.unit) * WORLD.classes[r[2]].mul * m.mul)) : null; };
function worldRoute(a, b, mode = "foot") {   // เส้นทางพลังงานน้อยที่สุด (Dijkstra) → { path:[โซน], roads:[ดัชนีถนน], energy, steps, km } หรือ null ถ้าไปไม่ได้ด้วยพาหนะนี้
  if (!WORLD.nodes[a] || !WORLD.nodes[b]) return null;
  const dist = { [a]: 0 }, prev = {}, done = new Set();
  for (;;) {
    let u = null; for (const k of Object.keys(dist)) if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
    if (u === null) return null; if (u === b) break; done.add(u);
    WORLD.roads.forEach((r, i) => { const c = worldCost(r, mode); if (c === null || (r[0] !== u && r[1] !== u)) return; const v = r[0] === u ? r[1] : r[0]; if (done.has(v)) return; if (dist[v] === undefined || dist[u] + c < dist[v]) { dist[v] = dist[u] + c; prev[v] = [u, i]; } });
  }
  const path = [b], roads = []; for (let v = b; v !== a;) { const [u, i] = prev[v]; roads.unshift(i); path.unshift(u); v = u; }
  return { path, roads, energy: dist[b], steps: roads.length, km: Math.round(roads.reduce((t, i) => t + worldLen(WORLD.roads[i]), 0) * WORLD.km * 10) / 10 };
}
// โอกาสโดนซุ่มตลอดเส้นทาง (ตัวเลขประเมิน ไม่ใช่กลไกสุ่มใหม่): Σ ตัวคูณความเสี่ยงของถนน × (0.3 + อันตรายปลายทาง/10) × (1 + 0.1 × ผู้เล่นปลายทาง ≤ 5) • ระดับ 0 ต่ำ (<1.2) / 1 กลาง (<2.4) / 2 สูง — ใช้แสดงตอนวางเส้นทาง
function worldRisk(q, danger, presence) {
  let s = 0; q.roads.forEach((ri, k) => { const r = WORLD.roads[ri], z = q.path[k + 1]; s += WORLD.classes[r[2]].risk * (0.3 + ((danger && danger(z)) || 0) / 10) * (1 + 0.1 * Math.min(5, (presence && presence(z)) || 0)); });
  s = Math.round(s * 100) / 100; return { score: s, level: s < 1.2 ? 0 : s < 2.4 ? 1 : 2 };
}

module.exports = { WORLD, worldPts, worldLen, worldCost, worldRoute, worldRisk };
