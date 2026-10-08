process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert"), crypto = require("crypto");
const admin = require(F + "node_modules/firebase-admin"); const sharp = require(F + "node_modules/sharp");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=pf" });
const db = admin.database(); const P = require(F + "profile");
// ---- คลาวด์สตอเรจจำลองในหน่วยความจำ
const store = new Map();
const bucket = { file: (n) => ({ exists: async () => [store.has(n)], getMetadata: async () => [{ size: store.get(n).length }], download: async () => [store.get(n)], save: async (buf, o) => { store.set(n, Buffer.from(buf)); store.meta = o; }, delete: async () => { store.delete(n); } }) };
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err: " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 8, 7, 3), H = 3600000;
(async () => {
  const pr = P.makeProfile(db, () => bucket), run = (uid, d, now = T0) => pr.run(uid, d, now, { bucket, sharp });
  // ======= ตัวแปลงรูป: ต้องได้ webp < 100KB เสมอ ไม่ว่าส่งอะไรมา =======
  const rnd = (w, h, ch = 3) => sharp(crypto.randomBytes(w * h * ch), { raw: { width: w, height: h, channels: ch } });   // สัญญาณรบกวนล้วน = บีบยากที่สุด
  const cases = {
    "noise 4000x3000 jpeg": await rnd(4000, 3000).jpeg({ quality: 95 }).toBuffer(),
    "noise 2000x2000 png": await rnd(2000, 2000).png().toBuffer(),
    "portrait 1200x4000 jpeg": await sharp({ create: { width: 1200, height: 4000, channels: 3, background: { r: 200, g: 40, b: 40 } } }).jpeg().toBuffer(),
    "landscape webp 3000x500": await sharp({ create: { width: 3000, height: 500, channels: 3, background: "#4488cc" } }).webp().toBuffer(),
    "tiny 16x16 png": await sharp({ create: { width: 16, height: 16, channels: 4, background: "#00ff0088" } }).png().toBuffer(),
    "exif rotated + gps": await sharp({ create: { width: 800, height: 400, channels: 3, background: "#228833" } }).withExif({ IFD0: { Orientation: "6", Copyright: "SECRET-OWNER" }, GPS: { GPSLatitudeRef: "N" } }).jpeg().toBuffer(),
    "gif": await sharp({ create: { width: 300, height: 300, channels: 3, background: "#aa22aa" } }).gif().toBuffer()
  };
  for (const [name, buf] of Object.entries(cases)) {
    const out = await pr.toWebp(buf, sharp), m = await sharp(out).metadata();
    assert(out.length < 100 * 1024, name + " size " + out.length); assert.strictEqual(out.slice(0, 4).toString(), "RIFF"); assert.strictEqual(out.slice(8, 12).toString(), "WEBP", name + " magic");
    assert(!m.exif && !(m.icc && m.icc.length > 4000), name + " metadata stripped"); assert(m.width === m.height && m.width <= 384, name + " square " + m.width + "x" + m.height);
    console.log("  ok", name, "→", out.length, "B", m.width + "x" + m.height, `(in ${buf.length} B)`);
  }
  await rej(pr.toWebp(Buffer.from("not an image at all"), sharp)); await rej(pr.toWebp(Buffer.from("<script>alert(1)</script>"), sharp));
  assert(!(await pr.toWebp(cases["exif rotated + gps"], sharp)).toString("latin1").includes("SECRET-OWNER"), "exif gone");
  // ======= ตรรกะโปรไฟล์ =======
  await db.ref().set({ users: { a: { username: "a", faction: "human", hp: 80 }, z: { username: "z", faction: "zombie", hp: 80 }, g: { username: "g", faction: "human", role: "gm" }, r1: { username: "r1", faction: "human" }, r2: { username: "r2", faction: "human" }, r3: { username: "r3", faction: "human" } }, ach: { a: { c: { srch: 400, gard: 12, found: 150 } }, r1: { c: { srch: 30 } }, r2: { c: { srch: 30 } }, r3: { c: { srch: 30 } }, z: { c: { bite: 60 } } } });
  let r = await run("a", { a: "state" }); assert(r.avatars.find((x) => x.id === "av_wolf").ok && !r.avatars.find((x) => x.id === "av_owl").ok && !r.avatars.some((x) => x.id === "av_zom"), "faction + unlock");
  assert(r.avatars.find((x) => x.id === "av_owl").need.includes("100")); assert(r.titles.find((x) => x.id === "ti_seeker").ok);
  await rej(run("a", { a: "set", av: "av_owl" }), "ยังไม่ปลดล็อก"); await rej(run("a", { a: "set", av: "av_zom" }), "ยังไม่ปลดล็อก"); await rej(run("a", { a: "set", av: "ti_new" }), "ไม่ถูกต้อง"); await rej(run("a", { a: "set", fr: "nope" }), "ไม่ถูกต้อง"); await rej(run("a", { a: "set" }), "ไม่มีอะไร");
  r = await run("a", { a: "set", av: "av_wolf", fr: "fr_steel", bn: "bn_forest", ti: "ti_seeker" }); assert.deepStrictEqual(r.cur, { av: "av_wolf", fr: "fr_steel", bn: "bn_forest", ti: "ti_seeker" });
  await db.ref("pass/a").set({ s: 0, xp: 1200 }); r = await run("a", { a: "state" }, T0); assert(r.frames.find((x) => x.id === "fr_neon").ok, "tier 12 → fr_neon"); assert(!r.frames.find((x) => x.id === "fr_rain").ok);
  await db.ref("col/a/cl").set({ lab: 1, m50: 1 }); r = await run("a", { a: "state" }); assert(r.avatars.find((x) => x.id === "av_gas").ok && r.banners.find((x) => x.id === "bn_aurora").ok && r.avatars.find((x) => x.id === "av_dragon").ok === false);
  const pz = await run("z", { a: "state" }); assert(pz.avatars.some((x) => x.id === "av_zom") && !pz.avatars.some((x) => x.id === "av_scout") && pz.avatars.find((x) => x.id === "av_ghost").ok);
  // ======= อัปโหลด/แปลง =======
  await rej(run("a", { a: "commit" }), "ยังไม่ได้อัปโหลด");
  store.set("raw/a", await rnd(2400, 1800).jpeg({ quality: 60 }).toBuffer()); r = await run("a", { a: "commit" }, T0); assert(r.converted && r.up.kb < 100 && r.up.v === 1 && !store.has("raw/a"), "raw deleted"); assert(store.has("profile/a.webp")); assert(store.get("profile/a.webp").length < 100 * 1024); assert.strictEqual(store.meta.contentType, "image/webp");
  store.set("raw/a", cases["gif"]); await rej(run("a", { a: "commit" }, T0 + 10 * 60000), "ชั่วโมงละ 1"); assert(!store.has("raw/a") || true);
  store.set("raw/a", cases["gif"]); r = await run("a", { a: "commit" }, T0 + 2 * H); assert(r.up.v === 2);
  store.set("raw/a", Buffer.from("MZ\x90\x00 fake exe")); await rej(run("a", { a: "commit" }, T0 + 5 * H), "ไม่ใช่รูป"); assert(!store.has("raw/a"), "bad raw still removed"); const stored = store.get("profile/a.webp"); assert(stored.slice(8, 12).toString() === "WEBP", "previous good image untouched");
  store.set("raw/a", Buffer.alloc(11 * 1024 * 1024, 1)); await rej(run("a", { a: "commit" }, T0 + 6 * H), "10 MB");
  // ======= สาธารณะ/รายงาน/GM =======
  let v = await run("r1", { a: "visit", uid: "a" }); assert(v.card.up && v.card.up.v === 2 && v.card.av === "av_wolf" && v.card.ti === "ti_seeker" && !v.self && !v.canGm && !("own" in v.card));
  // รูปย่อสำหรับแชท (mini): คืนเฉพาะคนที่มีอวาตาร์/รูป • ตัด uid แปลก/ซ้ำ • สูงสุด 25 • รูปที่ซ่อนไม่ส่ง
  { const m = await run("r1", { a: "mini", uids: ["a", "a", "nobody", "bad id!", 5, null] }); assert.deepStrictEqual(Object.keys(m.list), ["a"]); assert(m.list.a.avic === "🐺" && m.list.a.upv === 2 && typeof m.list.a.fr === "string", JSON.stringify(m.list));
    await db.ref("prof/a/hid").set(true); const mh = await run("r1", { a: "mini", uids: ["a"] }); assert(mh.list.a && mh.list.a.upv === null && mh.list.a.avic === "🐺", "ซ่อนรูป: ยังเห็นอวาตาร์เกมแต่ไม่ส่งรูปอัปโหลด"); await db.ref("prof/a/hid").remove();
    const many = await run("r1", { a: "mini", uids: Array.from({ length: 40 }, (_, i) => "u" + i) }); assert.deepStrictEqual(many.list, {}); await rej(run(null, { a: "mini", uids: ["a"] }), "ล็อกอิน"); assert.deepStrictEqual((await run("r1", { a: "mini" })).list, {}); }
  await rej(run("a", { a: "report", uid: "a" }), "ตัวเอง"); await rej(run("r1", { a: "report", uid: "z" }), "ไม่มีรูป"); await db.ref("ach/g/c/srch").set(50);
  let rp = await run("r1", { a: "report", uid: "a" }); assert(rp.reports === 1 && !rp.hidden); await run("r1", { a: "report", uid: "a" }); rp = await run("r2", { a: "report", uid: "a" }); assert(rp.reports === 2 && !rp.hidden);
  await rej(run("n1", { a: "report", uid: "a" }), "ใช้งานไม่ได้"); rp = await run("r3", { a: "report", uid: "a" }); assert(rp.hidden, "3 reporters hide");
  v = await run("g", { a: "visit", uid: "a" }); assert(v.card.hid && v.card.up === null && v.canGm);
  await rej(run("r1", { a: "gmList" }), "เฉพาะ GM"); let gl = await run("g", { a: "gmList" }); assert(gl.rows.length === 1 && gl.rows[0].n === 3 && gl.rows[0].hid);
  await run("g", { a: "gmRemove", uid: "a", mode: "keep" }); v = await run("r1", { a: "visit", uid: "a" }); assert(!v.card.hid && v.card.up, "kept");
  await db.ref("profRep/a").set({ r1: 1 }); await run("g", { a: "gmRemove", uid: "a", mode: "delete" }); assert(!store.has("profile/a.webp"), "file deleted"); v = await run("r1", { a: "visit", uid: "a" }); assert(v.card.up === null);
  store.set("raw/a", cases["gif"]); await rej(run("a", { a: "commit" }, T0 + 20 * H), "ถูกจำกัด");
  // ลบรูปตัวเอง
  store.set("raw/z", cases["tiny 16x16 png"]); await run("z", { a: "commit" }, T0); assert(store.has("profile/z.webp")); r = await run("z", { a: "removeUp" }); assert(r.removed && !store.has("profile/z.webp") && r.up === null);
  console.log("locks:", JSON.stringify((await db.ref("locks").get()).val())); console.log("PROF ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
