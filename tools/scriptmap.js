// สร้างแผนที่ของ script.js: node tools/scriptmap.js            → เขียน SCRIPT_MAP.md (หัวข้อ/ช่วงบรรทัด/ฟังก์ชันหลัก)
// ตัดเฉพาะส่วนไปให้ผู้ช่วย:     node tools/scriptmap.js slice 51  → เขียน slice_51.txt (หัวข้อเลข 51)   |   node tools/scriptmap.js lines 5800 5900
const fs = require("fs"), path = require("path");
const file = path.join(__dirname, "..", "script.js"), L = fs.readFileSync(file, "utf8").split("\n");
const heads = [];   // หัวข้อแบบ /* ===== ... */ ตามด้วยบรรทัด "   NN) ชื่อ" หรือ "NN. ชื่อ"
for (let i = 0; i < L.length; i++) {
  if (/^\/\* =+\s*$/.test(L[i]) || /^\/\*\s*=+/.test(L[i])) {
    const t = (L[i + 1] || "").trim(); const m = t.match(/^(\d+(?:\.\d+)?)[).]\s*(.*)$/);
    if (m) heads.push({ n: m[1], title: m[2].slice(0, 110), start: i + 1 });
  } else { const m = L[i].match(/^\/\/ -{5,}\s+(\d+(?:\.\d+)?)\s+(.*?)(?:\s+-{5,})?\s*$/); if (m) heads.push({ n: m[1], title: m[2].slice(0, 110), start: i + 1 }); }   // หัวข้อแบบ "// ---------- 49.48 ชื่อ ----------"
}
heads.forEach((h, k) => { h.end = k + 1 < heads.length ? heads[k + 1].start - 1 : L.length; });
const fnRe = /^(?:async\s+)?function\s+(\w+)|^const\s+(\w+)\s*=\s*(?:async\s*)?\(|^const\s+([A-Z][A-Z0-9_]{2,})\s*=/;
const [cmd, a, b] = process.argv.slice(2);
if (cmd === "slice") { const h = heads.filter((x) => x.n === a); if (!h.length) { console.error("ไม่พบหัวข้อ", a); process.exit(1); } const out = h.map((x) => L.slice(x.start - 1, x.end).join("\n")).join("\n\n"); fs.writeFileSync(`slice_${a}.txt`, out); console.log(`slice_${a}.txt (${h.map((x) => x.start + "-" + x.end).join(", ")})`); }
else if (cmd === "lines") { fs.writeFileSync(`lines_${a}_${b}.txt`, L.slice(Number(a) - 1, Number(b)).join("\n")); console.log(`lines_${a}_${b}.txt`); }
else {
  let md = "# แผนที่ script.js (สร้างอัตโนมัติด้วย `node tools/scriptmap.js` — รันใหม่ทุกครั้งที่เพิ่มหัวข้อ)\n\nวิธีใช้: ดูหัวข้อที่เกี่ยวข้องแล้วตัดส่งให้ผู้ช่วยด้วย `node tools/scriptmap.js slice <เลขหัวข้อ>` หรือ `node tools/scriptmap.js lines <เริ่ม> <จบ>`\n\n| หัวข้อ | บรรทัด | ชื่อ | ฟังก์ชัน/ค่าคงที่หลัก |\n|---|---|---|---|\n";
  if (heads[0] && heads[0].start > 1) md += `| — | 1–${heads[0].start - 1} | ส่วนหัว: import, ตัวห่อเรียกฟังก์ชัน (\`xxxCall\`), ตารางไอเทม \`ITEMS\`, โซน \`ZONES\`, บอส \`BOSSES\`, สูตรคราฟต์ \`RECIPES\` | |\n`;
  for (const h of heads) {
    const names = []; for (let i = h.start; i < h.end && names.length < 7; i++) { const m = L[i].match(fnRe); if (m) names.push(m[1] || m[2] || m[3]); }
    md += `| ${h.n} | ${h.start}–${h.end} | ${h.title.replace(/\|/g, "/")} | ${names.map((n) => "`" + n + "`").join(" ")} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, "..", "SCRIPT_MAP.md"), md); console.log(`SCRIPT_MAP.md (${heads.length} หัวข้อ)`);
}
