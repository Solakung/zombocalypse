const F = "/home/user/zombocalypse/functions/";
const fs = require("fs"), m = require(F + "pass");
const sc = fs.readFileSync("/home/user/zombocalypse/script.js", "utf8");
const rules = JSON.parse(fs.readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules;
const wl = new RegExp(rules.inventory["$uid"]["$slot"][".validate"].match(/matches\(\/(\^\([^)]*\)\$)\//)[1]);
let bad = 0;
for (let s = 0; s < 4; s++) {
  const rw = m.tierRew(s); if (rw.length !== 30) throw new Error("len");
  const ids = new Set(); rw.forEach((r) => [r.h, r.z].forEach((l) => l.forEach(([id, q]) => { ids.add(id); if (!(q >= 1 && q <= 10)) throw new Error("qty " + id); })));
  for (const id of [...ids].filter((x) => !/^(seed|deco|theme)_/.test(x))) { const a = new RegExp("^  " + id + ": \\{", "m").test(sc), b = wl.test(id); if (!a || !b) { bad++; console.log("BAD", s, id, a, b); } }
  // ธีมต้องไม่มีของ zombieOnly ในชุดมนุษย์ และของ human-only ในชุดซอมบี้ (ตรวจแบบหยาบ: mut_* เฉพาะซอมบี้)
  rw.forEach((r, i) => r.h.forEach(([id]) => { if (id.startsWith("mut_")) { bad++; console.log("human gets mut", s, i + 1, id); } }));
  for (const f of ["human", "zombie"]) for (const d of [20000, 20001, 20002, 20003]) {
    const dl = m.pick(m.DAILY.concat(m.THEME[s].d), 3, d * 7 + 1, f), wk = m.pick(m.WEEKLY.concat(m.THEME[s].w), 4, d * 13 + 5, f);
    if (dl.length !== 3 || wk.length !== 4) { bad++; console.log("short pick", s, f, dl, wk); }
    dl.concat(wk).forEach((id) => { if (!m.POOL[id]) { bad++; console.log("missing", id); } else if (m.POOL[id].f && m.POOL[id].f !== f[0]) { bad++; console.log("faction", id, f); } });
  }
  console.log("season", s, "ids", ids.size, "t10", rw[9].h[0][0], "t20", rw[19].h[0][0], "t30", rw[29].h[0][0]);
}
console.log("bad:", bad); process.exit(bad ? 1 : 0);
