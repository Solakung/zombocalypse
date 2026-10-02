// ใช้ก่อน commit ทุกครั้งที่แก้เกม:  node bump.js            (เลขเวอร์ชัน = วันเวลาปัจจุบัน)
//                                  node bump.js 2026-10-05.2  (กำหนดเอง)
// แก้ให้ตรงกัน 3 ที่: APP_VERSION ใน script.js, ?v= ใน index.html, และ version.json
const fs = require("fs");
const d = new Date(), p = (n) => String(n).padStart(2, "0");
const v = process.argv[2] || `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}`;
const sub = (file, re, to) => { const s = fs.readFileSync(file, "utf8"); if (!re.test(s)) throw new Error(`ไม่พบรูปแบบเวอร์ชันใน ${file}`); fs.writeFileSync(file, s.replace(re, to)); };
sub("script.js", /const APP_VERSION = "[^"]*";/, `const APP_VERSION = "${v}";`);
sub("index.html", /style\.css(\?v=[^"']*)?"/, `style.css?v=${v}"`);
sub("index.html", /script\.js(\?v=[^"']*)?"/, `script.js?v=${v}"`);
fs.writeFileSync("version.json", JSON.stringify({ v }) + "\n");
console.log("เวอร์ชัน →", v);
