// 🚦 ทดสอบ "เปิดเกมจริงแล้วเข้าหน้าเกมได้" — โหลด index.html + script.js จริงด้วย Firebase จำลองในหน่วยความจำ (ไม่ต้องใช้เน็ต/emulator)
// จับกรณี script.js พังตั้งแต่โหลด (ไวยากรณ์ผิด/อ้างตัวแปรก่อนประกาศ) ซึ่งทำให้ผู้เล่นติดหน้าล็อกอิน — เทสต์ UI อื่นตัดสคริปต์เป็นช่วงจึงไม่เห็น
// ใช้: node tests/ui/uiboot.js   (FAC=zombie เพื่อลองฝั่งซอมบี้) • ข้อผิดพลาดที่เกิดจากข้อมูลจำลองไม่ครบ (เช่น fxPerkMods) ไม่นับ
const { boot } = require("./_fakefb"), assert = require("assert");
(async () => {
  const { pg, br, errs } = await boot({ faction: process.env.FAC || "human" }); await pg.waitForTimeout(Number(process.argv[2] || 5000));
  const st = await pg.evaluate(() => ({ screen: [...document.querySelectorAll(".screen.active")].map((s) => s.id).join(","), zone: document.getElementById("zone-title")?.textContent, login: document.getElementById("login-error")?.textContent, calls: (window.__calls || []).join(",") }));
  console.log(JSON.stringify(st));
  const fatal = errs.filter((e) => /SyntaxError|is not defined|before initialization|Unexpected token|Unexpected end|Cannot read properties of null \(reading 'addEventListener'\)/.test(e));
  await br.close(); assert.deepStrictEqual(fatal, [], "ข้อผิดพลาดร้ายแรงตอนโหลด: " + fatal.join(" || ")); assert.strictEqual(st.screen, "screen-game", "ต้องเข้าหน้าเกมได้ (ตอนนี้: " + st.screen + ")");
  console.log("UI BOOT OK (" + (process.env.FAC || "human") + ")");
})().catch((e) => { console.error("FAIL", e.message || e); process.exit(1); });
