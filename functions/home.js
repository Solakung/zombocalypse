// 🛋️ บ้านของฉัน: จัดห้องเอง (วางของตกแต่งตามตำแหน่ง) + ธีมห้อง + เยี่ยมห้อง + ถูกใจ + ห้องยอดนิยมประจำสัปดาห์
// ข้อมูลที่ home/{uid} (ไม่มีใน rules → ฟังก์ชันเท่านั้น; คนอื่นดูห้องผ่านคำสั่ง visit ซึ่งคืนเฉพาะข้อมูลสาธารณะ)
//   own/{ของ}: จำนวนที่มี (d0..d11 = ของเดิมจาก base/{uid}/deco, ชื่ออื่น = ของใหม่, t_<ธีม> = ธีม) • lay: [{d,x,y}] • th: ธีม • cap: ดัชนีวลี • lk: ถูกใจรวม • mig: ย้ายของเดิมแล้ว • tc/{สัปดาห์}: รับรางวัลห้องยอดนิยมแล้ว
//   hw/{สัปดาห์}/{uid}: ถูกใจสัปดาห์นั้น • hl/{uid}: {d: วัน, n: จำนวนที่กดวันนี้, to: {uid:1}}
const { fail, withLock, takeItem, grantAll, dayIdx, dayEnd, TZ, DAY } = require("./lib");
const SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / DAY);   // จันทร์ — ต้องตรงกับ script.js / pass.js
const weekIdx = (now) => Math.floor((dayIdx(now) - SEA_EPOCH) / 7);

// ---------- แคตตาล็อก ----------
// [id, ไอคอน, ชื่อ, โซนวาง (w=ผนัง y20–132, f=พื้น y128–196, a=ที่ไหนก็ได้ y20–196), ขนาดตัวอักษรใน SVG, หมวด, ฝ่าย ("" = ทุกฝ่าย), ราคาระดับ 1–4 (0 = ได้จากรางวัลเท่านั้น)]
const OLD = [   // ของเดิม 12 ชิ้น (ซื้อผ่านหน้าที่พักเดิม baseAct) — ตำแหน่งเริ่มต้น = SCN_POS เดิม
  ["d0", "🪴", "กระถางต้นไม้", "f", 30, "old", "", 0, [296, 168]], ["d1", "🕯️", "เทียนไข", "a", 18, "old", "", 0, [150, 124]], ["d2", "🧸", "ตุ๊กตาผ้า", "f", 24, "old", "", 0, [104, 176]],
  ["d3", "📻", "วิทยุเก่า", "a", 22, "old", "", 0, [40, 68]], ["d4", "🖼️", "รูปถ่ายครอบครัว", "w", 28, "old", "", 0, [138, 48]], ["d5", "🪑", "เก้าอี้โยก", "f", 38, "old", "", 0, [246, 176]],
  ["d6", "🏺", "แจกันโบราณ", "a", 22, "old", "", 0, [176, 125]], ["d7", "🎸", "กีตาร์เก่า", "f", 32, "old", "", 0, [78, 158]], ["d8", "🔭", "กล้องโทรทรรศน์", "f", 36, "old", "", 0, [200, 160]],
  ["d9", "🏆", "ถ้วยรางวัล", "a", 20, "old", "", 0, [88, 66]], ["d10", "🛋️", "โซฟานุ่ม", "f", 48, "old", "", 0, [150, 178]], ["d11", "🌌", "โคมไฟดวงดาว", "w", 26, "old", "", 0, [172, 30]]
];
const NEW = [
  // ผู้รอดชีวิต
  ["cot", "🛏️", "เตียงสนาม", "f", 40, "surv", "", 3], ["barrel", "🛢️", "ถังเหล็ก", "f", 32, "surv", "", 1], ["crate", "📦", "ลังไม้", "f", 30, "surv", "", 1], ["flag", "🏴", "ธงผู้รอดชีวิต", "w", 30, "surv", "", 2],
  ["map", "🗺️", "แผนที่เมือง", "w", 30, "surv", "", 2], ["lantern", "🏮", "โคมแขวน", "a", 24, "surv", "", 2], ["toolbox", "🧰", "กล่องเครื่องมือ", "f", 26, "surv", "", 1], ["backpack", "🎒", "เป้เดินทาง", "f", 26, "surv", "", 1],
  ["rock", "🪨", "กองหินกันลม", "f", 28, "surv", "", 1], ["clock", "🕰️", "นาฬิกาแขวน", "w", 26, "surv", "", 3],
  // สวน/ธรรมชาติ
  ["sunflower", "🌻", "ทานตะวัน", "f", 34, "gard", "", 2], ["cactus", "🌵", "กระบองเพชร", "f", 32, "gard", "", 1], ["bamboo", "🎍", "ต้นไผ่มงคล", "f", 38, "gard", "", 2], ["palm", "🌴", "ปาล์มเล็ก", "f", 42, "gard", "", 3],
  ["mushpot", "🍄", "เห็ดในกระถาง", "f", 28, "gard", "", 1], ["bucket", "🪣", "ถังรดน้ำ", "f", 26, "gard", "", 1], ["nestbox", "🪺", "รังนก", "w", 26, "gard", "", 2], ["rose", "🌹", "กุหลาบหนาม", "f", 28, "gard", "", 2],
  ["lotus", "🪷", "บัวในอ่าง", "f", 30, "gard", "", 3], ["beehive", "🐝", "รังผึ้ง", "a", 26, "gard", "", 3],
  // ห้องวิจัย
  ["microscope", "🔬", "กล้องจุลทรรศน์", "a", 26, "lab", "", 2], ["flask", "⚗️", "ขวดทดลอง", "a", 24, "lab", "", 1], ["dna", "🧬", "แบบจำลอง DNA", "w", 30, "lab", "", 3], ["monitor", "🖥️", "จอข้อมูล", "a", 30, "lab", "", 3],
  ["server", "🗄️", "ตู้เก็บแฟ้ม", "f", 40, "lab", "", 2], ["radar", "📡", "จานรับสัญญาณ", "f", 36, "lab", "", 3], ["robot", "🤖", "หุ่นยนต์เก่า", "f", 38, "lab", "", 4], ["vial", "🧪", "หลอดทดลอง", "a", 22, "lab", "", 1], ["magnet", "🧲", "แม่เหล็กยักษ์", "a", 24, "lab", "", 2],
  // รัง/ซอมบี้ (ฝั่งซอมบี้)
  ["bones", "🦴", "กองกระดูก", "f", 28, "nest", "z", 1], ["web", "🕸️", "ใยแมงมุม", "w", 32, "nest", "z", 1], ["coffin", "⚰️", "โลงศพเก่า", "f", 42, "nest", "z", 3], ["grave", "🪦", "ป้ายหลุมศพ", "f", 34, "nest", "z", 2],
  ["skull", "☠️", "หัวกะโหลกเทียน", "a", 26, "nest", "z", 2], ["eyes", "👁️", "ดวงตาบนผนัง", "w", 30, "nest", "z", 3], ["spider", "🕷️", "แมงมุมยักษ์", "w", 30, "nest", "z", 2], ["pot", "🫕", "หม้อเนื้อหมัก", "f", 32, "nest", "z", 2],
  // เทศกาล/ซีซัน/ถ้วย (ได้จากรางวัลเท่านั้น)
  ["xtree", "🎄", "ต้นไม้ประดับไฟ", "f", 42, "fest", "", 0], ["redpack", "🧧", "ซองแดงแขวน", "w", 26, "fest", "", 0], ["firework", "🎆", "ดอกไม้ไฟ", "w", 32, "fest", "", 0], ["jacko", "🎃", "ฟักทองแกะสลัก", "f", 32, "fest", "", 0],
  ["snowman", "⛄", "ตุ๊กตาหิมะ", "f", 36, "fest", "", 0], ["umbrella", "☂️", "ร่มสีสด", "a", 28, "fest", "", 0], ["rainbow", "🌈", "สายรุ้ง", "w", 40, "fest", "", 0], ["leaves", "🍂", "กองใบไม้", "f", 30, "fest", "", 0],
  ["star", "🌟", "ดาวประดับ", "w", 28, "fest", "", 0], ["medal", "🥇", "เหรียญทอง", "a", 24, "fest", "", 0], ["crown", "👑", "มงกุฎผู้ชนะ", "a", 28, "fest", "", 0], ["gift", "🎁", "กล่องของขวัญ", "f", 30, "fest", "", 0]
];
const CATS = { old: "ของเดิม", surv: "ผู้รอดชีวิต", gard: "สวน/ธรรมชาติ", lab: "ห้องวิจัย", nest: "รัง", fest: "เทศกาล/รางวัล" };
// ราคา: ระดับ p → วัสดุ × (หมวดกำหนดชนิดตามฝ่าย)
const PRICE = { surv: { h: ["scrap", 6], z: ["rotten_meat", 6] }, gard: { h: ["herb_bundle", 4], z: ["moss", 4] }, lab: { h: ["chem", 5], z: ["chem", 5] }, nest: { h: ["rotten_meat", 6], z: ["rotten_meat", 6] } };
const costOf = (cat, p, fk) => { const b = PRICE[cat] && PRICE[cat][fk]; return b && p ? [b[0], b[1] * p] : null; };
const ITEMS = {};
OLD.forEach(([id, ic, n, z, sz, cat, f, p, pos]) => { ITEMS[id] = { id, ic, n, z, sz, cat, f, p, pos }; });
NEW.forEach(([id, ic, n, z, sz, cat, f, p]) => { ITEMS[id] = { id, ic, n, z, sz, cat, f, p }; });
// ธีมห้อง: [id, ชื่อ, ไอคอน, พาเลต [ผนัง, เส้นผนัง, พื้น, เส้นพื้น, พรม, ผ้าม่าน], ราคา (null = รางวัลเท่านั้น), ฝ่าย]
const THEMES = [
  ["plain", "ห้องเดิม", "🏠", null, 0, ""],
  ["cozy", "อุ่นสบาย", "🕯️", ["#8a5a3a", "#76492e", "#a37a50", "#85603c", "#b94a3c", "#d1604f"], ["scrap", 24], ""],
  ["mint", "มิ้นต์สวน", "🌿", ["#5d7a62", "#4c6851", "#8a7a56", "#706244", "#3f7a8c", "#59a0b5"], ["herb_bundle", 16], "h"],
  ["dusk", "ยามเย็น", "🌇", ["#6a5470", "#58445f", "#7a5a44", "#634833", "#d08a38", "#e6a24c"], ["scrap", 30], ""],
  ["steel", "เหล็กกล้า", "🔩", ["#59606a", "#4a5059", "#6a6f76", "#565b62", "#8a3a3a", "#a04a4a"], ["steel_plate", 3], "h"],
  ["lab", "ห้องแล็บ", "🔬", ["#cfd8dc", "#b0bec5", "#90a4ae", "#78909c", "#4a90a4", "#6ab0c4"], ["chem", 20], ""],
  ["moss", "รังมอส", "🍃", ["#26332f", "#1f2b28", "#38301f", "#2c2518", "#3a5a4a", "#4f7a64"], ["moss", 16], "z"],
  ["blood", "รังโลหิต", "🩸", ["#3a2430", "#2f1c26", "#3a2a22", "#2b1e18", "#7a2b3f", "#a03a52"], ["rotten_meat", 24], "z"],
  ["rain", "ฤดูฝน", "🌧️", ["#4f6a7a", "#42596a", "#6e6a58", "#585545", "#2f6a8a", "#4a8cad"], null, ""],
  ["plague", "ฤดูโรคระบาด", "🦠", ["#566a4a", "#475a3c", "#6a6246", "#554e38", "#8aa83a", "#a6c24c"], null, ""],
  ["harvest", "ฤดูเก็บเสบียง", "🌾", ["#9a7a3c", "#846830", "#a98c52", "#8b7240", "#b8742a", "#d68f3c"], null, ""],
  ["winter", "ฤดูหนาว", "❄️", ["#7a8a98", "#677785", "#9aa4ac", "#808a92", "#5a7aa8", "#7a9ac8"], null, ""],
  ["gold", "ราชาห้องยอดนิยม", "👑", ["#6a4a2a", "#563a1f", "#b08a40", "#8f6f30", "#8a1f2f", "#b03a4a"], null, ""]
];
const TH = {}; THEMES.forEach(([id, n, ic, pal, cost, f]) => { TH[id] = { id, n, ic, pal, cost, f }; });
const CAPS = ["ยินดีต้อนรับสู่ห้องของฉัน", "ทุกอย่างเรียบร้อยดี", "ใครผ่านมาแวะดื่มน้ำได้นะ", "ยังรอดอยู่ วันนี้ก็เช่นกัน", "ห้องนี้มีที่ให้เพื่อนเสมอ", "เก็บของหายากไว้ตรงนี้แหละ", "คืนนี้เงียบดี… ผิดปกติ", "ฝนตกก็ไม่กลัว", "ซอมบี้ห้ามเข้า (ยกเว้นเจ้าของ)", "บ้านหลังเล็กแต่อบอุ่น", "ที่นี่คือฐานของผู้รอดชีวิต", "จัดห้องเสร็จแล้ว ค่อยออกค้นต่อ"];
const SLOTS = [6, 9, 12, 16];
const MAX_LIKES = 5, LIKE_MIN_SRCH = 20;
const ZB = { w: [20, 132], f: [128, 196], a: [20, 196] };
const LIKE_REW = { h: [["scrap", 2]], z: [["rotten_meat", 2]] };
const TOP_REW = [   // อันดับ 1–3 / 4–10
  [["deco_crown", 1], ["deco_gift", 1]], [["deco_gift", 1]]
];

function makeHome(db) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  async function load(uid) {
    const p = (await db.ref(`users/${uid}`).get()).val();
    if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    return p;
  }
  const slotsOf = (lv) => SLOTS[Math.max(0, Math.min(3, Number(lv) || 0))];
  const okThemeFor = (t, fk) => TH[t] && (!TH[t].f || TH[t].f === fk);
  const okItemFor = (it, fk) => it && (!it.f || it.f === fk);
  const cleanLay = (own, lay, fk, slots) => {
    if (!Array.isArray(lay)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    if (lay.length > slots) fail("failed-precondition", `วางของได้ไม่เกิน ${slots} ชิ้นที่ที่พักระดับนี้`);
    const used = {}, out = [];
    for (const e of lay) {
      const it = e && ITEMS[e.d]; if (!it) fail("invalid-argument", "มีของที่ไม่รู้จัก");
      if (!okItemFor(it, fk)) fail("failed-precondition", "ของชิ้นนี้ใช้ได้เฉพาะอีกฝ่าย");
      used[e.d] = (used[e.d] || 0) + 1; if (used[e.d] > (Number(own[e.d]) || 0)) fail("failed-precondition", `คุณมี ${it.n} ไม่พอสำหรับที่วาง`);
      const x = Math.round(Number(e.x)), y = Math.round(Number(e.y)), [lo, hi] = ZB[it.z];
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 8 || x > 312 || y < lo || y > hi) fail("invalid-argument", `${it.n} วางตำแหน่งนี้ไม่ได้`);
      out.push({ d: e.d, x, y });
    }
    return out;
  };
  const catalog = (fk) => Object.values(ITEMS).filter((it) => okItemFor(it, fk)).map((it) => ({ id: it.id, ic: it.ic, n: it.n, z: it.z, sz: it.sz, cat: it.cat, cost: it.cat === "old" || !it.p ? null : costOf(it.cat, it.p, fk), pos: it.pos || null }));

  async function migrate(uid, h, now) {   // ย้ายของเดิมจาก base/{uid}/deco (ซ้ำได้ ไม่ทำของหาย/ซ้ำ)
    const bd = col((await db.ref(`base/${uid}/deco`).get()).val()), own = col(h.own), up = {};
    for (const d of Object.keys(bd)) if (bd[d] === true && ITEMS[d] && !(own[d] > 0)) { own[d] = 1; up[`own/${d}`] = 1; }
    if (!h.mig) {   // ครั้งแรก: วางของเดิมที่มีตามตำแหน่งเริ่มต้น + ตั้งธีมเริ่มต้น
      const lay = Object.keys(own).filter((d) => ITEMS[d] && ITEMS[d].pos && own[d] > 0).map((d) => ({ d, x: ITEMS[d].pos[0], y: ITEMS[d].pos[1] }));
      if (lay.length) { h.lay = lay; up.lay = lay; }
      up.th = h.th || "plain"; up.mig = now; h.mig = now; h.th = up.th;
    }
    if (Object.keys(up).length) await db.ref(`home/${uid}`).update(up);
    h.own = own; return h;
  }

  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "visit" || a === "top") return runPublic(uid, a, data, now);
    return withLock(db, uid, now, async () => {
      const p = await load(uid), fac = p.faction === "zombie" ? "zombie" : "human", fk = fac === "zombie" ? "z" : "h";
      const blv = (await db.ref(`base/${uid}/lv`).get()).val() || 0, wi = weekIdx(now), di = dayIdx(now);
      let h = col((await db.ref(`home/${uid}`).get()).val()); h = await migrate(uid, h, now);
      const own = h.own, slots = slotsOf(blv);
      const lk = (await db.ref(`hw/${wi}/${uid}`).get()).val() || 0;
      const view = (extra) => Object.assign({
        ok: true, slots, lv: blv, own, lay: Array.isArray(h.lay) ? h.lay : [], th: TH[h.th] ? h.th : "plain", cap: Number.isInteger(h.cap) ? h.cap : null, likes: h.lk || 0, wlikes: lk, wend: (SEA_EPOCH + (wi + 1) * 7) * DAY - TZ,
        catalog: catalog(fk), cats: CATS, caps: CAPS, price: PRICE,
        themes: THEMES.filter(([id]) => okThemeFor(id, fk)).map(([id, n, ic, pal, cost]) => ({ id, n, ic, pal, cost, owned: id === "plain" || !!(own["t_" + id] > 0) }))
      }, extra || {});
      if (a === "state") return view();

      if (a === "place") {
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        const lay = cleanLay(own, data.lay, fk, slots), up = { lay: lay.length ? lay : null };
        if (data.th !== undefined) { const t = String(data.th); if (!okThemeFor(t, fk)) fail("invalid-argument", "ไม่มีธีมนี้"); if (t !== "plain" && !(own["t_" + t] > 0)) fail("failed-precondition", "ยังไม่ได้ปลดล็อกธีมนี้"); up.th = t; h.th = t; }
        if (data.cap !== undefined) { const c = data.cap === null ? null : Number(data.cap); if (c !== null && !(Number.isInteger(c) && c >= 0 && c < CAPS.length)) fail("invalid-argument", "วลีไม่ถูกต้อง"); up.cap = c; h.cap = c; }
        await db.ref(`home/${uid}`).update(up); h.lay = lay;
        return view({ saved: true });
      }
      if (a === "buy") {
        if (!(p.hp > 0)) fail("failed-precondition", "ต้องมีชีวิตอยู่");
        const it = ITEMS[data.d];
        if (it) {
          if (!okItemFor(it, fk) || it.cat === "old" || !it.p) fail("invalid-argument", "ซื้อของชิ้นนี้ไม่ได้");
          const [cid, cq] = costOf(it.cat, it.p, fk);
          if (!(Number(own[it.id]) < 9 || !own[it.id])) fail("failed-precondition", "มีครบ 9 ชิ้นแล้ว");
          if (!(await takeItem(db, uid, cid, cq))) fail("failed-precondition", "ของไม่พอ");
          if (!(await grantAll(db, uid, [["deco_" + it.id, 1]]))) { await grantAll(db, uid, [[cid, cq]]); fail("failed-precondition", "มีของชิ้นนี้ครบแล้ว"); }
          own[it.id] = (Number(own[it.id]) || 0) + 1;
          return view({ bought: it.id });
        }
        const t = TH[data.t];
        if (!t || !okThemeFor(t.id, fk) || !t.cost) fail("invalid-argument", "ซื้อธีมนี้ไม่ได้");
        if (own["t_" + t.id] > 0) fail("failed-precondition", "มีธีมนี้แล้ว");
        if (!(await takeItem(db, uid, t.cost[0], t.cost[1]))) fail("failed-precondition", "ของไม่พอ");
        if (!(await grantAll(db, uid, [["theme_" + t.id, 1]]))) { await grantAll(db, uid, [[t.cost[0], t.cost[1]]]); fail("failed-precondition", "มีธีมนี้แล้ว"); }
        own["t_" + t.id] = 1;
        return view({ boughtTheme: t.id });
      }
      if (a === "like") {
        const to = String(data.to || "");
        if (!to || to === uid) fail("invalid-argument", "ถูกใจห้องตัวเองไม่ได้");
        const [tp, srch] = await Promise.all([db.ref(`users/${to}`).get(), db.ref(`ach/${uid}/c/srch`).get()]);
        const t = tp.val(); if (!t || t.banned === true || !t.username) fail("invalid-argument", "ไม่พบผู้เล่นนี้");
        if (!(Number(srch.val()) >= LIKE_MIN_SRCH)) fail("failed-precondition", `ต้องเล่นให้มากกว่านี้ก่อน (ค้นหาอย่างน้อย ${LIKE_MIN_SRCH} ครั้ง) ถึงจะกดถูกใจได้`);
        if (!(Object.keys(col((await db.ref(`home/${to}/lay`).get()).val())).length)) fail("failed-precondition", "ห้องนี้ยังไม่ได้ตกแต่ง");
        const hl = col((await db.ref(`hl/${uid}`).get()).val()), today = hl.d === di ? hl : { d: di, n: 0, to: {} };
        if (today.to && today.to[to]) fail("failed-precondition", "วันนี้ถูกใจห้องนี้ไปแล้ว");
        if ((today.n || 0) >= MAX_LIKES) fail("failed-precondition", `วันนี้ถูกใจครบ ${MAX_LIKES} ห้องแล้ว`);
        const first = !(today.n > 0);
        await db.ref(`hl/${uid}`).set({ d: di, n: (today.n || 0) + 1, to: { ...(today.to || {}), [to]: 1 } });
        await db.ref(`home/${to}/lk`).transaction((x) => (Number(x) || 0) + 1);
        await db.ref(`hw/${wi}/${to}`).transaction((x) => (Number(x) || 0) + 1);
        let rew = null;
        if (first && (await grantAll(db, uid, LIKE_REW[fk]))) rew = LIKE_REW[fk];
        return { ok: true, left: MAX_LIKES - (today.n || 0) - 1, rew };
      }
      if (a === "claimTop") {   // รางวัลห้องยอดนิยมของสัปดาห์ที่แล้ว
        const pw = wi - 1;
        if (h.tc && h.tc[pw]) fail("failed-precondition", "รับรางวัลสัปดาห์ที่แล้วไปแล้ว");
        const top = await topList(pw), rank = top.findIndex((r) => r.uid === uid);
        if (rank < 0) fail("failed-precondition", "สัปดาห์ที่แล้วคุณไม่ได้อยู่ใน 10 อันดับ");
        const rew = TOP_REW[rank < 3 ? 0 : 1];
        await db.ref(`home/${uid}/tc/${pw}`).set(now);
        if (!(await grantAll(db, uid, rew))) { await db.ref(`home/${uid}/tc/${pw}`).remove(); fail("failed-precondition", "ของเต็ม — ตกแต่งเกินจำนวนที่ถือได้ ลองใหม่ภายหลัง"); }
        return view({ rewarded: rew, rank: rank + 1 });
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }

  async function topList(wi) {
    const all = (await db.ref(`hw/${wi}`).get()).val() || {};   // อ่านทั้งสัปดาห์แล้วเรียงในหน่วยความจำ (ไม่ต้องพึ่ง .indexOn ใน rules)
    const arr = Object.entries(all).map(([uid, v]) => ({ uid, v: Number(v) || 0 })).filter((r) => r.v > 0).sort((x, y) => y.v - x.v || (x.uid < y.uid ? -1 : 1)).slice(0, 10);
    const names = await Promise.all(arr.map((r) => db.ref(`users/${r.uid}`).get()));
    return arr.map((r, i) => { const u = names[i].val() || {}; return { uid: r.uid, name: u.username || "?", fac: u.faction === "zombie" ? "zombie" : "human", v: r.v }; }).filter((r) => r.v > 0);
  }
  async function runPublic(uid, a, data, now) {
    const me = await load(uid), wi = weekIdx(now);   // ต้องล็อกอินและไม่ถูกแบน
    if (a === "top") {
      const cur = await topList(wi), prev = await topList(wi - 1);
      return { ok: true, wi, end: (SEA_EPOCH + (wi + 1) * 7) * DAY - TZ, cur, prev, canClaim: prev.some((r) => r.uid === uid) && !((await db.ref(`home/${uid}/tc/${wi - 1}`).get()).val()), rew: TOP_REW };
    }
    const to = String(data.uid || "");
    if (!to) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const [tp, hs, bl] = await Promise.all([db.ref(`users/${to}`).get(), db.ref(`home/${to}`).get(), db.ref(`base/${to}/lv`).get()]);
    const t = tp.val(); if (!t || t.banned === true) fail("invalid-argument", "ไม่พบผู้เล่นนี้");
    const h = col(hs.val()), fk = t.faction === "zombie" ? "z" : "h";
    const lay = Array.isArray(h.lay) ? h.lay.filter((e) => e && ITEMS[e.d] && okItemFor(ITEMS[e.d], fk)) : [];
    const di = dayIdx(now), hl = col((await db.ref(`hl/${uid}`).get()).val());
    const todayLikes = hl.d === di ? hl : { n: 0, to: {} };
    return { ok: true, uid: to, name: t.username || "?", fac: t.faction === "zombie" ? "zombie" : "human", lv: Number(bl.val()) || 0, lay, th: TH[h.th] && okThemeFor(h.th, fk) ? h.th : "plain", pal: TH[h.th] ? TH[h.th].pal : null, cap: Number.isInteger(h.cap) ? CAPS[h.cap] || null : null, likes: h.lk || 0, wlikes: (await db.ref(`hw/${wi}/${to}`).get()).val() || 0, self: to === uid, liked: !!(todayLikes.to && todayLikes.to[to]), left: Math.max(0, MAX_LIKES - (todayLikes.n || 0)), items: Object.fromEntries(lay.map((e) => [e.d, [ITEMS[e.d].ic, ITEMS[e.d].n, ITEMS[e.d].sz]])) };
  }
  return { run };
}
module.exports = { makeHome, ITEMS, THEMES, TH, CAPS, SLOTS, PRICE, costOf, MAX_LIKES, weekIdx };
