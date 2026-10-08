process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
const F = "/home/user/zombocalypse/functions/", assert = require("assert");
const admin = require(F + "node_modules/firebase-admin");
admin.initializeApp({ projectId: "demo-zombo", databaseURL: "http://127.0.0.1:9000?ns=hcx" });
const db = admin.database(); const H = require(F + "hc");
const rej = async (p, m) => { try { await p; } catch (e) { if (m && !String(e.message).includes(m)) throw new Error("wrong err " + e.message); return; } throw new Error("expected reject " + m); };
const T0 = Date.UTC(2026, 9, 7, 3);
(async () => {
  const u = (n, f, zone, extra = {}) => ({ username: n, faction: f, hp: 80, zone, ...extra });
  await db.ref().set({ users: { h1: u("h1", "human", "lab"), h2: u("h2", "human", "lab"), h3: u("h3", "human", "lab"), z1: u("z1", "zombie", "lab"), hs: u("hs", "human", "safe"), hr: u("hr", "human", "ruins"), dead: u("dead", "human", "lab", { hp: 0 }) },
    npc: { h1: { tara: { p: 0, d: 0, s: 0, m: 1 << 21, v: 0 } }, h2: { tara: { p: 0, d: 0, s: 0, m: 1 << 21, v: 0 } }, h3: { tara: { p: 0, d: 0, s: 0, m: 0, v: 0 } } },
    inventory: { hs: { dna_frag: { id: "dna_frag", qty: 50 } }, h1: { dna_frag: { id: "dna_frag", qty: 5 } } } });
  const hc = H.makeHc(db, admin); let r;
  await rej(hc.run(null, {}, T0), "ล็อกอิน"); await rej(hc.run("h1", { a: "zzz" }, T0), "ไม่รู้จัก");
  r = await hc.run("h1", { a: "state" }, T0); assert(r.ok && !r.on && !r.found && r.goal === 300 && r.total === 0);
  await rej(hc.run("h1", { a: "roll" }, T0), "ยังไม่เปิด"); await db.ref("tune").set({ hc_on: 1, hc_goal: 40, hc_pm: 0 });
  r = await hc.run("h1", { a: "roll" }, T0); assert(r.ok && r.hit === false && !r.limited, "p=0 never hits");
  await rej(hc.run("hs", { a: "roll" }, T0), "ศูนย์วิจัย"); await rej(hc.run("dead", { a: "roll" }, T0), "ชีวิต");
  r = await hc.run("h3", { a: "roll" }, T0); assert.strictEqual(r.skip, "boss", "human must beat guard first");
  // ถังโทเค็น: ครั้งที่ 12 ผ่าน ครั้งที่ 13 ถูกจำกัด
  let lim = 0; for (let i = 0; i < 20; i++) { r = await hc.run("h2", { a: "roll" }, T0); if (r.limited) lim++; } assert.strictEqual(lim, 8, "burst 12 then limited"); r = await hc.run("h2", { a: "roll" }, T0 + 130000); assert(!r.limited, "refill 1 per 2 min");
  // ซอมบี้ไม่ต้องล้มผู้เฝ้า; โอกาส 100% → เจอเลย + ได้ต่อม; ประกาศ; บิตเจอแล้ว
  await db.ref("tune/hc_pm").set(1000); r = await hc.run("h1", { a: "roll" }, T0 + 5000);   // มนุษย์ผ่านผู้เฝ้า → hit ทันที (1000‰)
  assert(r.hit && r.reward === "weapon" && r.found.by === "h1", JSON.stringify(r));
  const inv = (await db.ref("inventory/h1").get()).val(), wk = Object.keys(inv).find((k) => inv[k].id === "custom"); assert(wk, "weapon granted"); assert.deepStrictEqual({ ...inv[wk] }, H.WEAPON); assert(inv[wk].dmg > 32 && inv[wk].dur <= 7);
  const rules = JSON.parse(require("fs").readFileSync("/home/user/zombocalypse/database_rules.json", "utf8")).rules; const v = rules.inventory.$uid.$slot[".validate"]; assert(v.includes("'custom'"), "rules know custom weapon");
  assert.strictEqual((await db.ref("npc/h1/tara/m").get()).val() & (1 << 22), 1 << 22, "found bit"); const an = Object.values((await db.ref("announcements").get()).val()); assert(an.length === 1 && an[0].text.includes("h1") && an[0].zone === "all");
  r = await hc.run("h2", { a: "roll" }, T0 + 6000); assert(r.hit === false && r.already, "only one finder"); r = await hc.run("z1", { a: "roll" }, T0 + 6000); assert(r.already);
  r = await hc.run("h2", { a: "state" }, T0); assert(r.found && r.found.by === "h1");
  // ผู้ค้นพบเป็นซอมบี้
  await db.ref("hc").remove(); await db.ref("announcements").remove(); await db.ref("tune/hc_pm").set(2000);   // ซอมบี้ได้ครึ่งเดียว (1000‰ → 50%) จึงใช้ 2000‰ ให้ทอยติดแน่นอน ไม่ให้เทสต์สุ่มผ่านบ้างไม่ผ่านบ้าง
  r = await hc.run("z1", { a: "roll" }, T0 + 9000); assert(r.hit && r.reward === "organ"); assert.strictEqual((await db.ref("inventory/z1/mut_fang5").get()).val().qty, 1);
  // ส่ง DNA
  await rej(hc.run("hs", { a: "donate", q: 0 }, T0), "จำนวน"); await rej(hc.run("hr", { a: "donate", q: 1 }, T0), "Safe Zone"); await rej(hc.run("h1", { a: "donate", q: 1 }, T0), "Safe Zone");
  r = await hc.run("hs", { a: "donate", q: 30 }, T0); assert.strictEqual(r.donated, 30); assert.strictEqual(r.total, 30); assert.strictEqual((await db.ref("inventory/hs/dna_frag/qty").get()).val(), 20); assert.strictEqual((await db.ref("coop/hc1/hs/n").get()).val(), 30);
  r = await hc.run("hs", { a: "donate", q: 99 }, T0 + 10); assert.strictEqual(r.donated, 10, "capped to goal"); assert.strictEqual(r.total, 40); await rej(hc.run("hs", { a: "donate", q: 1 }, T0 + 20), "ครบเป้า"); assert.strictEqual((await db.ref("inventory/hs/dna_frag/qty").get()).val(), 10);
  await db.ref("inventory/hs/dna_frag").set({ id: "dna_frag", qty: 3 }); await db.ref("tune/hc_goal").set(400); await db.ref("coop/hc1").remove(); await db.ref("users/hs/zone").set("safe");
  await db.ref("inventory").update({ a1: { dna_frag: { id: "dna_frag", qty: 3 } }, a2: { dna_frag: { id: "dna_frag", qty: 3 } } }); await db.ref("users").update({ a1: u("a1", "human", "safe"), a2: u("a2", "human", "safe") }); await db.ref("tune/hc_goal").set(5);
  const rs = await Promise.allSettled(["hs", "a1", "a2"].map((x) => hc.run(x, { a: "donate", q: 3 }, T0 + 30))); const tot = Object.values((await db.ref("coop/hc1").get()).val()).reduce((s, x) => s + x.n, 0); assert.strictEqual(tot, 5, "never exceeds goal under concurrency: " + tot + " " + JSON.stringify(rs.map((x) => x.status)));
  console.log("HC ALL OK"); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
