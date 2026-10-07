// 🪪 โปรไฟล์ตกแต่งตัวตน: อวาตาร์ • กรอบ • แบนเนอร์ • ฉายา (ปลดล็อกจากความก้าวหน้าจริง ตรวจฝั่งเซิร์ฟเวอร์) + รูปอัปโหลดเอง
// - ข้อมูลที่ prof/{uid}: av, fr, bn, ti, up:{t, v, kb} (รูปอัปโหลดใช้อยู่), hid (ซ่อนโดยการรายงาน/GM) • profRep/{uid}: ผู้รายงาน (uid → เวลา) • ไม่มีใน rules
// - รูปอัปโหลด: ผู้เล่นส่งไฟล์ต้นฉบับไป Storage raw/{uid} → commit: ระบบ "แปลงเอง" ด้วย sharp เป็น webp < 100 KB เสมอ (ลบ EXIF/GPS) → profile/{uid}.webp แล้วลบต้นฉบับ
// - ขึ้นทันทีโดยไม่รอตรวจ (ตามที่เจ้าของเกมตัดสินใจ) → มีรายงาน (3 บัญชี = ซ่อนอัตโนมัติ) และเครื่องมือ GM ลบ/ซ่อนรูป
const { fail, withLock, dayIdx } = require("./lib");
const MAX_KB = 100, MAX_RAW = 10 * 1024 * 1024, GAP_MS = 3600000, HIDE_AT = 3;

// ---------- แคตตาล็อก (การแสดงผลอยู่ฝั่งเกม; ที่นี่เก็บเงื่อนไขปลดล็อก) ----------
// req: [ชนิด, ...] — ach:[คีย์,n] • col:[ชุด] (ชุดสะสมที่รับแล้ว) • pct:[n] (ความสมบูรณ์ผ่านชุดที่รับแล้ว/รางวัล) • tier:[n] (Season Pass ระดับสูงสุดในซีซันปัจจุบัน) • likes:[n] • none
const AVATARS = [
  ["av_surv", "🧑‍🚒", "ผู้รอดชีวิต", ["none"], ""], ["av_scout", "🧭", "นักสำรวจ", ["none"], "h"], ["av_medic", "🧑‍⚕️", "หมอสนาม", ["none"], "h"], ["av_cook", "🧑‍🍳", "พ่อครัวค่าย", ["none"], "h"],
  ["av_fox", "🦊", "จิ้งจอก", ["none"], ""], ["av_wolf", "🐺", "หมาป่า", ["ach", "srch", 300], ""], ["av_owl", "🦉", "นกฮูกกลางคืน", ["ach", "nsrch", 100], ""], ["av_cat", "🐈‍⬛", "แมวดำ", ["ach", "petc", 10], ""],
  ["av_bear", "🐻", "หมีใหญ่", ["ach", "boss", 10], ""], ["av_hawk", "🦅", "เหยี่ยว", ["ach", "found", 500], ""], ["av_gas", "😷", "หน้ากากกันแก๊ส", ["col", "lab"], "h"], ["av_robot", "🤖", "หุ่นยนต์", ["col", "gadget"], "h"],
  ["av_skull", "💀", "กะโหลก", ["none"], "z"], ["av_zom", "🧟", "ซอมบี้หนุ่ม", ["none"], "z"], ["av_zomf", "🧟‍♀️", "ซอมบี้สาว", ["none"], "z"], ["av_ghost", "👻", "วิญญาณ", ["ach", "bite", 50], "z"],
  ["av_bat", "🦇", "ค้างคาว", ["ach", "nsrch", 60], "z"], ["av_demon", "👹", "ปีศาจ", ["ach", "bite", 150], "z"], ["av_alien", "👽", "เอเลี่ยน", ["col", "fangs"], "z"], ["av_spider", "🕷️", "แมงมุม", ["col", "noses"], "z"],
  ["av_plant", "🌱", "ต้นกล้า", ["ach", "gard", 10], ""], ["av_sun", "🌻", "ทานตะวัน", ["col", "garden"], "h"], ["av_mush", "🍄", "เห็ดป่า", ["ach", "gard", 30], ""], ["av_dragon", "🐉", "มังกร", ["pct", 75], ""],
  ["av_crown", "👑", "ราชา", ["likes", 25], ""], ["av_star", "🌟", "ดาวเด่น", ["tier", 20], ""], ["av_fire", "🔥", "เปลวไฟ", ["ach", "login", 30], ""], ["av_gem", "💎", "อัญมณี", ["pct", 100], ""]
];
const FRAMES = [
  ["fr_none", "ไม่มีกรอบ", ["none"]], ["fr_tan", "ทองแดง", ["none"]], ["fr_steel", "เหล็กกล้า", ["ach", "srch", 100]], ["fr_gold", "ทองคำ", ["ach", "srch", 1000]], ["fr_mint", "มิ้นต์", ["ach", "gard", 20]], ["fr_blood", "โลหิต", ["ach", "bite", 20]],
  ["fr_neon", "นีออน", ["tier", 10]], ["fr_rain", "สายฝน", ["tier", 30]], ["fr_heart", "หัวใจ", ["likes", 10]], ["fr_lab", "ห้องแล็บ", ["col", "lab"]], ["fr_dash", "ลายประ", ["ach", "found", 200]], ["fr_royal", "ราชวงศ์", ["pct", 100]]
];
const BANNERS = [
  ["bn_dusk", "ยามเย็น", ["none"]], ["bn_night", "คืนเดือนหงาย", ["none"]], ["bn_forest", "ป่าลึก", ["ach", "found", 100]], ["bn_ruins", "ซากเมือง", ["ach", "srch", 150]], ["bn_lab", "ห้องวิจัย", ["col", "lab"]], ["bn_nest", "รังมืด", ["ach", "bite", 10]],
  ["bn_rain", "ฝนพรำ", ["tier", 5]], ["bn_gold", "ทองอำพัน", ["tier", 15]], ["bn_snow", "หิมะ", ["tier", 25]], ["bn_garden", "สวนลับ", ["col", "garden"]], ["bn_fire", "ไฟลุก", ["ach", "boss", 20]], ["bn_aurora", "ออโรร่า", ["pct", 50]]
];
const TITLES = [
  ["ti_none", "ไม่มีฉายา", ["none"]], ["ti_new", "ผู้รอดชีวิตหน้าใหม่", ["none"]], ["ti_seeker", "นักค้นของ", ["ach", "srch", 200]], ["ti_hoard", "นักสะสมตัวยง", ["col", "keepsake"]], ["ti_farmer", "ชาวสวนเมืองร้าง", ["ach", "gard", 25]],
  ["ti_hunter", "นักล่าค่าหัว", ["ach", "boss", 15]], ["ti_diver", "นักดิ่งลึก", ["ach", "dive", 10]], ["ti_nem", "ผู้ล้มคู่อาฆาต", ["ach", "nemk", 5]], ["ti_radio", "ผู้ถอดรหัส", ["ach", "radio", 1]], ["ti_trader", "พ่อค้าตลาดมืด", ["ach", "mkt", 40]],
  ["ti_pet", "เพื่อนสัตว์โลก", ["ach", "petc", 20]], ["ti_decor", "นักตกแต่ง", ["ach", "home", 5]], ["ti_loved", "ห้องเป็นที่รัก", ["likes", 15]], ["ti_pass", "ผู้พิชิตซีซัน", ["tier", 30]], ["ti_full", "ผู้รอดชีวิตเต็มตัว", ["pct", 100]],
  ["ti_biter", "ผู้กัดไม่ปรานี", ["ach", "bite", 100]], ["ti_slayer", "ผู้ล้างซอมบี้", ["ach", "zwin", 150]], ["ti_craft", "ช่างฝีมือ", ["ach", "craft", 60]], ["ti_enc", "ผู้ผ่านเหตุการณ์", ["ach", "enc", 30]], ["ti_vet", "ผู้อยู่รอดนาน", ["ach", "login", 20]],
  ["ti_tara", "ผู้ค้นพบธารา", ["hcf"]], ["ti_mut_h", "อสูรทมิฬ", ["mut", "h", 4]], ["ti_mut_g", "ยักษ์ศิลาอมตะ", ["mut", "g", 4]], ["ti_mut_s", "ราชันเงา", ["mut", "s", 4]], ["ti_mut_p", "จ่าฝูงดึกดำบรรพ์", ["mut", "p", 4]]
];
const ALL = {};
AVATARS.forEach(([id, ic, n, req, f]) => { ALL[id] = { id, k: "av", ic, n, req, f }; });
FRAMES.forEach(([id, n, req]) => { ALL[id] = { id, k: "fr", n, req, f: "" }; });
BANNERS.forEach(([id, n, req]) => { ALL[id] = { id, k: "bn", n, req, f: "" }; });
TITLES.forEach(([id, n, req]) => { ALL[id] = { id, k: "ti", n, req, f: "" }; });
const REQ_TXT = { hcf: () => "เป็นคนแรกที่ค้นพบธาราที่ศูนย์วิจัย", mut: (r) => `มิวเตชันซอมบี้ถึงขั้น ${4 + r[2]}`, ach: (r, L) => `${L[r[1]] || r[1]} ${r[2]}`, col: (r) => `ครบชุดสะสม "${r[1]}"`, pct: (r) => `ความสมบูรณ์ ${r[1]}%`, tier: (r) => `Season Pass ระดับ ${r[1]}`, likes: (r) => `ถูกใจห้อง ${r[1]} ครั้ง` };
const ACH_LBL = { srch: "ค้นหา", nsrch: "ค้นหากลางคืน", petc: "รับของสัตว์เลี้ยง", boss: "ชนะบอส", found: "เจอของ", bite: "กัดเหยื่อ", gard: "เก็บเกี่ยว", login: "เข้าเล่น", dive: "ดิ่งลึก", nemk: "ล้มคู่อาฆาต", radio: "ไขวิทยุ", mkt: "ตลาด", home: "จัดห้อง", zwin: "ชนะซอมบี้", craft: "คราฟต์", enc: "เหตุการณ์สุ่ม" };

function makeProfile(db, bucketFn) {
  const col = (x) => (x && typeof x === "object" ? x : {});
  async function load(uid) {
    const p = (await db.ref(`users/${uid}`).get()).val();
    if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    return p;
  }
  // ข้อมูลความก้าวหน้าของผู้เล่น (อ่านฝั่งเซิร์ฟเวอร์ ปลอมไม่ได้เท่าที่ ach อนุญาต)
  async function progress(uid, now) {
    const [aS, cS, pS, hS, mS, fS] = await Promise.all([db.ref(`ach/${uid}/c`).get(), db.ref(`col/${uid}`).get(), db.ref(`pass/${uid}`).get(), db.ref(`home/${uid}/lk`).get(), db.ref(`mut/${uid}`).get(), db.ref("hc/state/by").get()]);
    const ach = col(aS.val()), cl = col(col(cS.val()).cl), ps = col(pS.val());
    const done = Object.keys(cl).filter((k) => !/^m\d+$/.test(k)).length, ms = Object.keys(cl).filter((k) => /^m\d+$/.test(k)).map((k) => Number(k.slice(1)));
    const pct = ms.length ? Math.max(...ms) : 0;   // รางวัลความสมบูรณ์ที่รับแล้วสูงสุด (25/50/75/100)
    const SEA_EPOCH = Math.floor(Date.UTC(2026, 8, 7) / 86400000), seaNow = Math.max(0, Math.floor((dayIdx(now) - SEA_EPOCH) / 28));
    const tier = ps.s === seaNow ? Math.min(30, Math.floor((Number(ps.xp) || 0) / 100)) : 0;
    return { ach, cl, pct, tier, likes: Number(hS.val()) || 0, done, mut: col(mS.val()), hcf: fS.val() === uid };
  }
  const unlocked = (it, P, fk) => {
    if (it.f && it.f !== fk) return false;
    const r = it.req;
    switch (r[0]) {
      case "none": return true; case "ach": return (Number(P.ach[r[1]]) || 0) >= r[2]; case "col": return !!P.cl[r[1]];
      case "pct": return P.pct >= r[1]; case "tier": return P.tier >= r[1]; case "likes": return P.likes >= r[1]; case "hcf": return !!P.hcf; case "mut": return (Number(col(P.mut)[r[1]]) || 0) >= r[2]; default: return false;
    }
  };
  const reqText = (it) => { const r = it.req; return r[0] === "none" ? "" : REQ_TXT[r[0]](r, ACH_LBL); };
  const bucket = () => bucketFn();
  const pub = (pf, name, fac) => ({ name, fac, av: pf.av || null, avic: pf.av && ALL[pf.av] ? ALL[pf.av].ic : null, tin: pf.ti && ALL[pf.ti] ? ALL[pf.ti].n : null, fr: pf.fr || "fr_none", bn: pf.bn || null, ti: pf.ti || null, up: pf.up && !pf.hid ? { v: pf.up.v, t: pf.up.t } : null, uu: pf.uu !== false, hid: !!pf.hid });

  // แปลงรูปเป็น webp < 100 KB เสมอ (ไลบรารี sharp) — ผู้เล่นไม่ต้องแปลงมาก่อน
  async function toWebp(buf, sharp) {
    let img = sharp(buf, { failOn: "error", limitInputPixels: 40e6 });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) fail("invalid-argument", "อ่านไฟล์รูปไม่ได้");
    for (const size of [384, 320, 256, 192, 144]) {
      for (const q of [80, 65, 50, 40, 30, 22]) {
        const out = await sharp(buf, { failOn: "error", limitInputPixels: 40e6 }).rotate().resize(size, size, { fit: "cover", position: "centre" }).webp({ quality: q, effort: 4 }).toBuffer();   // rotate() ตาม EXIF แล้ว output ไม่มี metadata (ตัด EXIF/GPS ทิ้ง)
        if (out.length < MAX_KB * 1024) return out;
      }
    }
    fail("invalid-argument", "บีบรูปให้เล็กพอไม่ได้ ลองรูปอื่น");
  }

  async function run(uid, data, now = Date.now(), deps = {}) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const a = (data && data.a) || "state";
    if (a === "visit") {   // ดูการ์ดโปรไฟล์ผู้อื่น (สาธารณะ)
      await load(uid);
      const to = String(data.uid || ""), t = (await db.ref(`users/${to}`).get()).val();
      if (!t || t.banned === true) fail("invalid-argument", "ไม่พบผู้เล่นนี้");
      const pf = col((await db.ref(`prof/${to}`).get()).val()), me = (await db.ref(`users/${uid}`).get()).val();
      const rp = col((await db.ref(`profRep/${to}`).get()).val());
      return { ok: true, card: pub(pf, t.username || "?", t.faction === "zombie" ? "zombie" : "human"), self: to === uid, reported: !!rp[uid], canGm: me && (me.role === "gm" || me.role === "owner") };
    }
    if (a === "gmList" || a === "gmRemove") {
      const me = await load(uid);
      if (!(me.role === "gm" || me.role === "owner")) fail("permission-denied", "เฉพาะ GM/Owner");
      if (a === "gmList") {
        const all = col((await db.ref("profRep").get()).val()), rows = [];
        for (const [u, reps] of Object.entries(all)) { const n = Object.keys(col(reps)).length, pf = col((await db.ref(`prof/${u}`).get()).val()), t = (await db.ref(`users/${u}`).get()).val(); if (pf.up) rows.push({ uid: u, name: (t && t.username) || "?", n, hid: !!pf.hid, v: pf.up.v }); }
        rows.sort((x, y) => y.n - x.n); return { ok: true, rows: rows.slice(0, 50) };
      }
      const to = String(data.uid || ""); if (!to) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      const mode = data.mode === "hide" ? "hide" : data.mode === "keep" ? "keep" : "delete";
      if (mode === "delete") { try { await bucket().file(`profile/${to}.webp`).delete({ ignoreNotFound: true }); } catch { /* ข้าม */ } await db.ref(`prof/${to}/up`).remove(); await db.ref(`prof/${to}/hid`).remove(); await db.ref(`profRep/${to}`).remove(); await db.ref(`prof/${to}/ban`).set(now); }
      else if (mode === "hide") await db.ref(`prof/${to}/hid`).set(true);
      else { await db.ref(`prof/${to}/hid`).remove(); await db.ref(`profRep/${to}`).remove(); }
      return { ok: true, mode };
    }
    return withLock(db, uid, now, async () => {
      const p = await load(uid), fk = p.faction === "zombie" ? "z" : "h", pf = col((await db.ref(`prof/${uid}`).get()).val());
      const P = await progress(uid, now);
      const lst = (arr) => arr.map((it) => ({ id: it.id, n: it.n, ic: it.ic || null, ok: unlocked(it, P, fk), need: unlocked(it, P, fk) ? "" : reqText(it) })).filter((x) => { const it = ALL[x.id]; return !it.f || it.f === fk; });
      const view = (extra) => Object.assign({
        ok: true, cur: { av: pf.av || null, fr: pf.fr || "fr_none", bn: pf.bn || null, ti: pf.ti || null }, up: pf.up || null, hid: !!pf.hid, banned: !!pf.ban, nextUp: Math.max(0, ((pf.up && pf.up.t) || 0) + GAP_MS - now),
        avatars: lst(AVATARS.map((x) => ALL[x[0]])), frames: lst(FRAMES.map((x) => ALL[x[0]])), banners: lst(BANNERS.map((x) => ALL[x[0]])), titles: lst(TITLES.map((x) => ALL[x[0]]))
      }, extra || {});
      if (a === "state") return view();
      if (a === "set") {
        const up = {};
        for (const [k, key] of [["av", "av"], ["fr", "fr"], ["bn", "bn"], ["ti", "ti"]]) {
          if (data[k] === undefined) continue;
          if (data[k] === null) { up[key] = null; pf[key] = null; continue; }
          const it = ALL[String(data[k])];
          if (!it || it.k !== k) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
          if (!unlocked(it, P, fk)) fail("failed-precondition", `ยังไม่ปลดล็อก: ${reqText(it) || "ไม่ทราบเงื่อนไข"}`);
          up[key] = it.id; pf[key] = it.id;
        }
        if (data.useUp !== undefined && pf.up) { up.uu = !!data.useUp; pf.uu = !!data.useUp; }   // เลือกแสดงรูปอัปโหลดหรืออวาตาร์เกม
        if (!Object.keys(up).length) fail("invalid-argument", "ไม่มีอะไรเปลี่ยน");
        await db.ref(`prof/${uid}`).update(up);
        return view({ saved: true });
      }
      if (a === "commit") {   // แปลงรูปต้นฉบับ (Storage raw/{uid}) เป็น webp < 100 KB
        if (pf.ban) fail("permission-denied", "บัญชีนี้ถูกจำกัดการอัปโหลดรูป");
        if (pf.up && now - (pf.up.t || 0) < GAP_MS) fail("resource-exhausted", `เปลี่ยนรูปได้ชั่วโมงละ 1 ครั้ง (อีก ${Math.ceil((GAP_MS - (now - pf.up.t)) / 60000)} นาที)`);
        const sharp = deps.sharp || require("sharp"), b = deps.bucket || bucket(), rawF = b.file(`raw/${uid}`);
        const [exists] = await rawF.exists(); if (!exists) fail("failed-precondition", "ยังไม่ได้อัปโหลดไฟล์");
        try {
          const [md] = await rawF.getMetadata(); if (Number(md.size) > MAX_RAW) fail("invalid-argument", "ไฟล์ใหญ่เกิน 10 MB");
          const [buf] = await rawF.download();
          let out; try { out = await toWebp(buf, sharp); } catch (e) { if (e && e.code && String(e.code).startsWith("invalid") ) throw e; if (e && e.httpErrorCode) throw e; fail("invalid-argument", "ไฟล์นี้ไม่ใช่รูปที่อ่านได้"); }
          await b.file(`profile/${uid}.webp`).save(out, { contentType: "image/webp", resumable: false, metadata: { cacheControl: "public, max-age=3600" } });
          const up = { t: now, v: (Number(pf.up && pf.up.v) || 0) + 1, kb: Math.ceil(out.length / 1024) };
          await db.ref(`prof/${uid}`).update({ up, uu: true, hid: null }); pf.up = up; pf.uu = true; pf.hid = null;
          await db.ref(`profRep/${uid}`).remove();
        } finally { try { await rawF.delete({ ignoreNotFound: true }); } catch { /* ข้าม */ } }
        return view({ converted: true });
      }
      if (a === "removeUp") {
        try { await bucket().file(`profile/${uid}.webp`).delete({ ignoreNotFound: true }); } catch { /* ข้าม */ }
        await db.ref(`prof/${uid}`).update({ up: null, uu: null, hid: null }); pf.up = null; pf.uu = null; pf.hid = null;
        return view({ removed: true });
      }
      if (a === "report") {
        const to = String(data.uid || ""); if (!to || to === uid) fail("invalid-argument", "รายงานตัวเองไม่ได้");
        const tpf = col((await db.ref(`prof/${to}`).get()).val()); if (!tpf.up) fail("failed-precondition", "ผู้เล่นนี้ไม่มีรูปที่อัปโหลด");
        if ((Number((await db.ref(`ach/${uid}/c/srch`).get()).val()) || 0) < 20) fail("failed-precondition", "ต้องเล่นให้มากกว่านี้ก่อนถึงจะรายงานได้");
        await db.ref(`profRep/${to}/${uid}`).set(now);
        const n = Object.keys(col((await db.ref(`profRep/${to}`).get()).val())).length;
        if (n >= HIDE_AT) await db.ref(`prof/${to}/hid`).set(true);
        return { ok: true, reports: n, hidden: n >= HIDE_AT };
      }
      fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    });
  }
  return { run, toWebp };
}
module.exports = { makeProfile, AVATARS, FRAMES, BANNERS, TITLES, ALL, MAX_KB };
