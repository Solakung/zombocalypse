// 🗺️ แผนที่โลก (ข้อมูลโซน/ถนน/พลังงาน/พาหนะ): ข้อมูลฝั่งเกมตรงฝั่งเซิร์ฟเวอร์ • กราฟเชื่อมกันครบ • พลังงานต่อถนนอยู่ในช่วงที่ตั้งใจ • ตัววางแผนเส้นทาง • พาหนะ (เตรียมไว้) • ไม่ต้องใช้ emulator
const fs = require("fs"), assert = require("assert");
const F = "/home/user/zombocalypse/", sc = fs.readFileSync(F + "script.js", "utf8"), M = require(F + "functions/worldmap");
const part = sc.slice(sc.indexOf("// ---- 🗺️ แผนที่โลก"), sc.indexOf("// ---- /แผนที่โลก")); assert(part.length > 800, "slice");
const C = new Function(part + ";return { WORLD, worldPts, worldLen, worldCost, worldRoute };")();
// ตรงกันทุกอย่าง
assert.deepStrictEqual(C.WORLD, M.WORLD, "WORLD data");
const ids = Object.keys(M.WORLD.nodes);
for (const a of ids) for (const b of ids) for (const mode of ["foot", "bike", "car"]) assert.deepStrictEqual(C.worldRoute(a, b, mode), M.worldRoute(a, b, mode), `route ${a}>${b} ${mode}`);
M.WORLD.roads.forEach((r, i) => { assert.strictEqual(C.worldLen(r), M.worldLen(r)); ["foot", "bike", "car"].forEach((m) => assert.strictEqual(C.worldCost(r, m), M.worldCost(r, m))); });
// โซนครบตามเกม (ZONES + คาสิโน) และมีพิกัดในกรอบ
const zones = [...sc.slice(sc.indexOf("const ZONES = {"), sc.indexOf("\n};", sc.indexOf("const ZONES = {"))).matchAll(/^  (\w+): \{ name:/gm)].map((x) => x[1]); assert(zones.length >= 11, "zones " + zones);
zones.forEach((z) => { if (z !== "jail") assert(M.WORLD.nodes[z], "node " + z); }); assert(M.WORLD.nodes.casino, "casino");
for (const [k, [x, y]] of Object.entries(M.WORLD.nodes)) assert(x >= 0 && x <= M.WORLD.w && y >= 0 && y <= M.WORLD.h, "in frame " + k);
// กราฟ: เชื่อมกันครบ • ถนนไม่ซ้ำ/ไม่วนตัวเอง • ชนิดถนนมีจริง • ทุกจุดโค้งอยู่ในกรอบ
M.WORLD.roads.forEach(([a, b, c, via], i) => { assert(M.WORLD.nodes[a] && M.WORLD.nodes[b] && a !== b, "road " + i); assert(M.WORLD.classes[c], "class " + c); (via || []).forEach(([x, y]) => assert(x >= 0 && x <= M.WORLD.w && y >= 0 && y <= M.WORLD.h)); });
const keys = M.WORLD.roads.map(([a, b]) => [a, b].sort().join("-")); assert.strictEqual(new Set(keys).size, keys.length, "ไม่มีถนนซ้ำ");
ids.forEach((z) => assert(M.worldRoute("safe", z), "reach " + z));
// พลังงานต่อถนน: เดินเท้า 2–9 (ค่าเฉลี่ยราว 5–6 ตามที่ตั้งใจ) • โซนไกลสุด (3 ช่อง) รวมไม่เกิน 20
const costs = M.WORLD.roads.map((r) => M.worldCost(r)); assert(costs.every((c) => c >= 2 && c <= 9), "cost range " + costs); const avg = costs.reduce((a, b) => a + b, 0) / costs.length; assert(avg >= 4.5 && avg <= 6.5, "avg " + avg);
ids.forEach((z) => { const q = M.worldRoute("safe", z); assert(q.energy <= 20, `${z} ${q.energy}`); assert.strictEqual(q.steps, q.path.length - 1); assert.strictEqual(q.roads.length, q.steps); });
// ระยะทางตามถนนจริง: ช่อง 1 = ใกล้ Safe Zone • ฐาน/ตำรวจ/อุโมงค์/แล็บ/คาสิโน = 3 ช่อง ผ่านโรงพยาบาล
assert.deepStrictEqual(["ruins", "forest", "factory"].map((z) => M.worldRoute("safe", z).steps), [1, 1, 1]); assert.deepStrictEqual(["port", "mall", "hospital"].map((z) => M.worldRoute("safe", z).steps), [2, 2, 2]);
["base", "police", "tunnel", "lab", "casino"].forEach((z) => { const q = M.worldRoute("safe", z); assert.strictEqual(q.steps, 3, z); assert.strictEqual(q.path[2], "hospital", z); });
assert.strictEqual(M.worldRoute("safe", "safe").steps, 0); assert.strictEqual(M.worldRoute("safe", "nowhere"), null); assert.strictEqual(M.worldRoute("x", "safe"), null);
// สมมาตร: ไป-กลับพลังงานเท่ากัน
ids.forEach((a) => ids.forEach((b) => assert.strictEqual(M.worldRoute(a, b).energy, M.worldRoute(b, a).energy)));
// พาหนะ (เตรียมไว้ ยังไม่เปิด): รถยนต์ลดพลังงานมาก ไปได้เฉพาะถนนลาดยาง (ทางป่าไม่ได้) • จักรยานลดปานกลางและไปทางป่าได้ • ยังไม่เปิดใช้ (on:false)
assert(M.WORLD.modes.foot.on === true && M.WORLD.modes.car.on === false && M.WORLD.modes.bike.on === false);
assert.strictEqual(M.worldRoute("safe", "forest", "car"), null, "ป่าต้องผ่านทางป่า: รถไม่ได้"); assert(M.worldRoute("safe", "hospital", "car").energy < M.worldRoute("safe", "hospital", "foot").energy * 0.5, "รถประหยัดเกินครึ่ง");
assert(M.worldRoute("safe", "forest", "bike").energy < M.worldRoute("safe", "forest", "foot").energy); assert(M.worldRoute("safe", "base", "car").energy <= 8);
// สะพานโรงพยาบาลเป็นทางข้ามเดียวไปทางเหนือ (ผลของแม่น้ำบนแผนที่ — ตัดแล้วโซนเหนือทั้งหมดไปไม่ถึง)
{ const cut = { ...M.WORLD, roads: M.WORLD.roads.filter((r) => r[2] !== "bridge") }, reach = new Set(["safe"]); let ch = true; while (ch) { ch = false; cut.roads.forEach(([a, b]) => { if (reach.has(a) !== reach.has(b)) { reach.add(a); reach.add(b); ch = true; } }); } assert(["hospital", "base", "police", "tunnel", "lab", "casino"].every((z) => !reach.has(z)), "สะพาน = ทางเดียว"); }
console.log("worldmap OK (" + M.WORLD.roads.length + " roads, avg " + avg.toFixed(1) + "⚡)");
