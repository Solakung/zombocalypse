// 🎓 บทสอนผู้เล่นใหม่ — รันเกมจริงด้วย Firebase จำลอง (tests/ui/_fakefb.js): เฉพาะบัญชีใหม่เห็น • จับมือทำทีละขั้นจนจบ • ข้ามได้ • ซอมบี้เห็นธารา • เดสก์ท็อปไม่ค้างขั้นแท็บ • /tutorial เล่นซ้ำ
const { boot } = require("./_fakefb"), assert = require("assert");
const vis = (pg) => pg.evaluate(() => { const L = document.getElementById("tut-layer"); return !!L && !L.classList.contains("hidden") ? { txt: L.querySelector(".tut-txt").textContent, name: L.querySelector(".tut-name").textContent, prog: document.getElementById("tut-prog").textContent, next: !document.getElementById("tut-next").classList.contains("hidden"), skipStep: !document.getElementById("tut-skipstep").classList.contains("hidden") } : null; });
const fatalOf = (errs) => errs.filter((e) => /SyntaxError|is not defined|before initialization|Unexpected token|Unexpected end/.test(e));
(async () => {
  // ---- 1) บัญชีเก่า → ไม่มีบทสอน
  { const { pg, br, errs } = await boot({ createdAt: Date.now() - 5 * 86400000 }); await pg.waitForTimeout(4500); assert.strictEqual(await vis(pg), null, "บัญชีเก่าต้องไม่เห็นบทสอน"); assert.deepStrictEqual(fatalOf(errs), []); await br.close(); }
  // ---- 2) ทีมงาน/เจ้าของ → ไม่มีบทสอน แม้บัญชีใหม่
  { const { pg, br } = await boot({ createdAt: "now", role: "gm" }); await pg.waitForTimeout(4500); assert.strictEqual(await vis(pg), null, "ทีมงานต้องไม่เห็น"); await br.close(); }
  // ---- 3) มนุษย์ใหม่: จับมือทำทีละขั้นจนจบ (มือถือ 360px)
  { const { pg, br, errs } = await boot({ createdAt: "now", inventory: { water: { id: "water", qty: 2 }, bandage: { id: "bandage", qty: 1 } } }); await pg.waitForTimeout(4500);
    let s = await vis(pg); assert(s, "บัญชีใหม่ต้องเห็นบทสอน"); assert.strictEqual(s.name, "มิรา"); assert(s.txt.includes("ยินดีต้อนรับ") && s.next && s.prog.startsWith("1/")); assert.strictEqual(await pg.evaluate(() => innerWidth), 360);
    // กันกดทะลุ: ขั้นข้อความล้วนมีตัวบล็อกครอบทั้งจอ — กดปุ่มค้นหาไม่ได้
    await pg.click("#tut-next"); s = await vis(pg); assert(s.txt.includes("HP") && s.txt.includes("อาหาร")); await pg.click("#tut-next");
    s = await vis(pg); assert(s.txt.includes("แท็บ") && s.txt.includes("กระเป๋า") && !s.next && s.skipStep, "ขั้นรอให้กดแท็บกระเป๋า");
    await pg.click('.tabbar [data-tab="bag"]'); await pg.waitForTimeout(700); s = await vis(pg); assert(s.txt.includes("ปุ่มค้นหา") && !s.next, "ขั้นรอการค้นหา");
    // ก่อนกดค้นหา: ตัวบล็อกอยู่รอบปุ่มแต่ปุ่มต้องกดได้ (ช่องสปอตไลต์เปิด)
    const hole = await pg.evaluate(() => { const b = document.getElementById("btn-scavenge").getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2, el = document.elementFromPoint(x, y); return el && (el.id === "btn-scavenge" || el.closest("#btn-scavenge")) ? "open" : (el && el.className) || "none"; }); assert.strictEqual(hole, "open", "ช่องสปอตไลต์ต้องกดปุ่มค้นหาได้");
    const blocked = await pg.evaluate(() => { const el = document.elementFromPoint(5, 400); return el && el.classList.contains("tut-blk"); }); assert(blocked, "นอกช่องสปอตไลต์ต้องถูกบล็อก");
    await pg.click("#btn-scavenge"); await pg.waitForTimeout(2500); s = await vis(pg); assert(s && /กระเป๋า|ของที่เจอ/.test(s.txt) && s.next, "หลังค้นหาแล้วไปขั้นอธิบายกระเป๋า: " + (s && s.txt));
    await pg.click("#tut-next"); s = await vis(pg); assert(s.txt.includes("ใช้") && !s.next, "ขั้นใช้ไอเทม (มีของใช้ได้)");
    await pg.evaluate(() => { document.getElementById("tut-skipstep").click(); }); s = await vis(pg); assert(s.txt.includes("แผนที่"), "ข้ามขั้นนี้ได้ → ไปแผนที่");
    await pg.click('.tabbar [data-tab="map"]'); await pg.waitForTimeout(700); s = await vis(pg); assert(s.txt.includes("โซนทั้งหมด") && s.next); await pg.click("#tut-next"); s = await vis(pg); assert(s.txt.includes("รายชื่อผู้เล่น")); await pg.click("#tut-next");
    s = await vis(pg); assert(s.txt.includes("แชท") && !s.next); await pg.click('.tabbar [data-tab="chat"]'); await pg.waitForTimeout(700); s = await vis(pg); assert(s.txt.includes("วิธีเล่น") && s.next && /เริ่มเล่น/.test(await pg.textContent("#tut-next")));
    await pg.click("#tut-next"); await pg.waitForTimeout(300); assert.strictEqual(await vis(pg), null, "จบแล้วเลเยอร์หาย");
    const done = await pg.evaluate(() => Object.entries(localStorage).filter(([k]) => k.includes("tutdone")).map(([, v]) => v).join(",")); assert.strictEqual(done, "1");
    // เปิดซ้ำ (รีโหลด) ไม่เห็นอีก
    await pg.reload(); await pg.waitForTimeout(4500); assert.strictEqual(await vis(pg), null, "จบแล้วไม่เห็นซ้ำ"); assert.deepStrictEqual(fatalOf(errs), []); await br.close(); }
  // ---- 4) ซอมบี้ใหม่: ธารา + ข้ามขั้นใช้ไอเทม + ข้ามทั้งหมดได้
  { const { pg, br } = await boot({ createdAt: "now", faction: "zombie" }); await pg.waitForTimeout(4500); let s = await vis(pg); assert(s && s.name === "ธารา" && s.txt.includes("ไม่เหมือนคนทั่วไป"), "ซอมบี้เห็นธารา");
    await pg.click("#tut-next"); s = await vis(pg); assert(s.txt.includes("เนื้อเน่า"), "ข้อความฝั่งซอมบี้พูดเรื่องอาหาร");
    pg.once("dialog", (d) => d.accept()); await pg.click("#tut-skip"); await pg.waitForTimeout(300); assert.strictEqual(await vis(pg), null, "ข้ามทั้งหมดแล้วเลเยอร์หาย");
    await pg.reload(); await pg.waitForTimeout(4500); assert.strictEqual(await vis(pg), null, "ข้ามแล้วไม่เห็นซ้ำ"); await br.close(); }
  // ---- 5) เดสก์ท็อป (ไม่มีแท็บล่าง): ขั้นแท็บกลายเป็น "ต่อไป" ไม่ค้าง
  { const { pg, br } = await boot({ createdAt: "now", desktop: true, viewport: { width: 1100, height: 800 } }); await pg.waitForTimeout(4500); let s = await vis(pg); assert(s, "เดสก์ท็อปเห็นบทสอน"); await pg.click("#tut-next"); await pg.click("#tut-next"); s = await vis(pg); assert(s.next, "ขั้นแท็บบนเดสก์ท็อปต้องมีปุ่มต่อไป (ไม่มีแท็บให้กด)"); await br.close(); }
  console.log("UI TUT OK");
})().catch((e) => { console.error("FAIL", e.message || e); process.exit(1); });
