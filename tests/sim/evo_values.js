// 🧬 ค่าสายวิวัฒนาการซอมบี้ที่ตกลงกันไว้ (ปรับสมดุล 3 สาย) — ตรวจจาก script.js ตรงๆ • `node tests/sim/evo_values.js`
const fs = require("fs"), assert = require("assert"), path = require("path");
const sc = fs.readFileSync(path.resolve(__dirname, "../../script.js"), "utf8");
const cut = (a, b) => { const i = sc.indexOf(a); assert(i >= 0, a); return sc.slice(i, sc.indexOf(b, i)); };
const state = { profile: { faction: "zombie", lastTravel: 1000 }, evo: {}, evoAmbFor: 0 }; let NOW = 1000;
const serverNow = () => NOW;
const api = new Function("state", "serverNow", cut("function evoBonusAt(", "\nfunction evoBonus(k)") + "\n" + cut("function evoT(", "\n") + "\n" + cut("const mutTierH", "\n") + "\n" + cut("const evoFoodMult", "\n") + "\n" + cut("function evoCutDmg", "\n") + "\n" + cut("const AMB_ROLL", "\n") + "\n" + cut("function ambushMult", "\n}\n") + "\n}\nreturn { evoBonusAt, evoCutDmg, ambushMult, evoFoodMult, mutTierH, AMB_ROLL };")(state, serverNow);
const B = (k, e) => api.evoBonusAt(k, e);
// ซากหนา: HP +30 (ขั้น 1-3) / +50 (ขั้น 4) • ความทน +2 • ว่องไวลด 0/1/2/2 • พลังงานสูงสุด −20 และฟื้นฟู −1 ตั้งแต่ขั้น 3
assert.deepStrictEqual([0, 1, 2, 3, 4].map((g) => B("hp", { g })), [0, 3, 3, 3, 5]); assert.deepStrictEqual([0, 1, 4].map((g) => B("tough", { g })), [0, 2, 2]);
assert.deepStrictEqual([0, 1, 2, 3, 4].map((g) => B("agi", { g })), [0, 0, -1, -2, -2]); assert.deepStrictEqual([0, 1, 2, 3, 4].map((g) => B("st", { g })), [0, 0, 0, -2, -2]); assert.deepStrictEqual([0, 2, 3, 4].map((g) => B("regen", { g })), [0, 0, -1, -1]);
// ตะกละ: พละกำลัง +1 (ขั้น 1) +2 (ขั้น 4) • เลื้อยคลาน: ว่องไว +2 (ขั้น 1) +3 (ขั้น 4), HP −10/−20
assert.deepStrictEqual([0, 1, 3, 4].map((h) => B("str", { h })), [0, 1, 1, 2]); assert.deepStrictEqual([0, 1, 4].map((s) => B("agi", { s })), [0, 2, 3]); assert.deepStrictEqual([0, 1, 2, 3, 4].map((s) => B("hp", { s })), [0, 0, -1, -2, -2]);
// ลดดาเมจซากหนา 15% ตั้งแต่ขั้น 2
state.evo = { g: 1 }; assert.strictEqual(api.evoCutDmg(100), 100); state.evo = { g: 2 }; assert.strictEqual(api.evoCutDmg(100), 85); state.evo = { g: 4 }; assert.strictEqual(api.evoCutDmg(20), 17); assert.strictEqual(api.evoCutDmg(1), 1);
// ซุ่ม: ขั้น 3 ×2.5 / ขั้น 4 ×4 (ภายใน 55 วิ ครั้งเดียวต่อการเดินทาง) และทอยแรก +2
state.evo = { s: 2 }; assert.strictEqual(api.ambushMult(), 1); state.evo = { s: 3 }; assert.strictEqual(api.ambushMult(), 2.5); state.evo = { s: 4 }; assert.strictEqual(api.ambushMult(), 4);
NOW = 1000 + 55001; assert.strictEqual(api.ambushMult(), 1, "เกิน 55 วิ"); NOW = 1000; state.evoAmbFor = 1000; assert.strictEqual(api.ambushMult(), 1, "ใช้ไปแล้วต่อการเดินทางนี้"); assert.strictEqual(api.AMB_ROLL, 2);
// อาหารที่ได้ ×0.75 ตั้งแต่ตะกละขั้น 2 • ขั้นมิวเตชัน
state.evo = { h: 1 }; assert.strictEqual(api.evoFoodMult(), 1); state.evo = { h: 2 }; assert.strictEqual(api.evoFoodMult(), 0.75); state.profile.faction = "human"; assert.strictEqual(api.evoFoodMult(), 1); state.profile.faction = "zombie";
state.mutD = null; assert.strictEqual(api.mutTierH(), 0); state.mutD = { line: "giant", m: 4 }; assert.strictEqual(api.mutTierH(), 0); state.mutD = { line: "hunter", m: 4 }; assert.strictEqual(api.mutTierH(), 4);
// ตารางฮีลตอนกัด (ข้อความในโค้ด) และหิวเร็ว 15/30/40/50%
assert(sc.includes('h >= 4 && mutTierH() >= 4 ? 8 : h >= 4 ? 5 : h >= 2 ? 3 : 2'), "heal table"); assert(sc.includes("[0, 0.15, 0.3, 0.4, 0.5][evoT(\"h\")]"), "hunger pct");
console.log("EVO VALUES OK");
