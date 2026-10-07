// 📉 สถิติผู้เล่น (แดชบอร์ดเจ้าของ): retCompute (ผู้เล่นหายตรงไหน) + pvpCompute (ผลสู้ตามฝ่าย) — ฟังก์ชันล้วนจาก script.js • `node tests/sim/telemetry.js`
const fs = require("fs"), assert = require("assert"), path = require("path"), rules = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../database_rules.json"), "utf8")).rules;
const sc = fs.readFileSync(path.resolve(__dirname, "../../script.js"), "utf8");
const part = sc.slice(sc.indexOf("// ---- 📉 สถิติผู้เล่น"), sc.indexOf("// ---- /สถิติผู้เล่น"));
assert(part.length > 500);
const { retCompute, pvpCompute } = new Function(part + "; return { retCompute, pvpCompute };")();
const H = 3600000, D = 86400000, now = 100 * D;
const P = (u, srch, extra = {}) => ({ u: { role: "player", faction: "human", zone: "ruins", hp: 50, ...u }, a: { c: { srch, ...extra } } });
const people = [
  P({ createdAt: now - 5 * D, seenAt: now - 5 * D + 5 * 60000, zone: "ruins" }, 0),                       // หาย: <10 นาที ไม่เคยค้นหา
  P({ createdAt: now - 4 * D, seenAt: now - 4 * D + 30 * 60000, faction: "zombie", zone: "forest", hp: 0 }, 6),   // หาย: 10 นาที–1 ชม. ล้มอยู่
  P({ createdAt: now - 4 * D, seenAt: now - 4 * D + 5 * H, zone: "ruins" }, 40),                          // หาย: 1–24 ชม.
  P({ createdAt: now - 6 * D, seenAt: now - 2 * D, zone: "mall" }, 200),                                  // หาย: 1–3 วัน (4 วัน → >3 วัน)
  P({ createdAt: now - 3 * D, seenAt: now - H }, 90),                                                     // ยังเล่นอยู่
  P({ createdAt: now - 2 * H, seenAt: now - 1000 }, 3),                                                   // ยังเล่นอยู่ (ใหม่)
  P({ createdAt: now - 9 * D, seenAt: now, role: "owner" }, 999),                                          // ไม่นับเจ้าของ
  { u: null, a: null }, P({ createdAt: undefined }, 5)                                                    // ข้อมูลพัง → ข้าม
];
const R = retCompute(people, now);
assert.strictEqual(R.n, 6); assert.strictEqual(R.gone, 4); assert.strictEqual(R.active, 2);
assert.deepStrictEqual(R.buckets.map((b) => b.n), [1, 1, 1, 0, 1]); assert.strictEqual(R.never, 1); assert.strictEqual(R.dead, 1); assert.strictEqual(R.medSrch, (6 + 40) / 2);
assert.deepStrictEqual(R.zones[0], ["ruins", 2]); assert.deepStrictEqual({ h: R.human, z: R.zombie }, { h: { n: 5, gone: 3 }, z: { n: 1, gone: 1 } });
assert.strictEqual(retCompute([], now).medSrch, null);
// PvP: ผู้ถูกโจมตีเป็นคนบันทึก
const V = pvpCompute([
  P({ faction: "human" }, 1, { patkz: 10, phitz: 4, pdmgz: 40, patkh: 2, phith: 1, pdmgh: 12, pdie: 1 }),
  P({ faction: "human" }, 1, { patkz: 5, phitz: 3, pdmgz: 30 }),
  P({ faction: "zombie" }, 1, { patkz: 3, phitz: 1, pdmgz: 6, patkh: 8, phith: 2, pdmgh: 24, pdie: 2 }),
  { u: { faction: "human" }, a: null }, { u: null, a: { c: { patkz: 99 } } }
]);
assert.deepStrictEqual(V.M.z.human, { atk: 15, hit: 7, dmg: 70 }); assert.deepStrictEqual(V.M.h.human, { atk: 2, hit: 1, dmg: 12 }); assert.deepStrictEqual(V.M.z.zombie, { atk: 3, hit: 1, dmg: 6 }); assert.deepStrictEqual(V.M.h.zombie, { atk: 8, hit: 2, dmg: 24 }); assert.deepStrictEqual(V.died, { human: 1, zombie: 2 });
// ตัวนับต้องผ่าน rules ach/c ($k = [a-z0-9]{1,10}) และถูกเขียนใน resolveAttack ครบ
const kre = new RegExp(rules.ach.$uid.c.$k[".validate"].match(/matches\(\/(\^\[[^/]+)\//)[1]);
for (const k of ["patkz", "patkh", "phitz", "phith", "pdmgz", "pdmgh", "pdie"]) { assert(kre.test(k), "rules key " + k); assert(sc.includes(`"${k}"`) || sc.includes(`"${k.slice(0, -1)}" + sf`), "bump " + k); }
console.log("TELEMETRY OK");
