// ตลาด (🏪): ลงขาย / ซื้อ / ยกเลิก / รับของ + ตลาดมืด (🕶️) + ฝากของให้เพื่อน (🎁)
// ย้ายตรรกะมาจาก database_rules.json (market, marketTx, marketPayouts, bm, giftTx และกิ่งของตลาดใน inventory)
// ค่าคงที่ต้องตรงกับ script.js (MKT_IDS, MKT_WEAP, GIFT_IDS, BM_CFG)
const { fail, withLock, takeItem } = require("./lib");

const MKT_IDS = ["canned_food", "water", "bandage", "medkit", "scrap", "bread", "fruit", "moss", "energy_drink", "antidote", "serum", "trauma_kit", "army_meal", "water_jug", "soup", "stim_shot", "choco_bar", "chem", "rotten_meat"];
const MKT_WEAP = ["wooden_bat", "pocket_knife", "crowbar", "knife", "spiked_bat", "fire_axe", "crossbow", "pistol", "samurai_sword", "shotgun", "lab_blade"];
const GIFT_IDS = ["water", "canned_food", "bandage", "moss", "bread", "fruit"];
const MAX = 99, WANT_KEYS = ["want", "want2", "want3"], PAY_KEY = ["", "b", "c"];
const BM_CFG = {"win":3600000,"slots":{"o1":"common","o2":"common","o3":"mid","o4":"mid","o5":"rare"},"stock":{"common":4,"mid":3,"rare":2},"human":{"currency":"scrap","tiers":{"common":["chem","water_jug","choco_bar","soup","medkit"],"mid":["army_meal","energy_drink","antidote","stim_shot"],"rare":["serum","trauma_kit"]},"price":{"chem":[5,4,6],"water_jug":[6,5,7],"choco_bar":[6,5,7],"soup":[5,4,6],"medkit":[6,5,7],"army_meal":[6,5,7],"energy_drink":[9,7,11],"antidote":[12,10,14],"stim_shot":[13,11,15],"serum":[17,14,20],"trauma_kit":[19,16,22]}},"zombie":{"currency":"rotten_meat","tiers":{"common":["water_jug","choco_bar","soup","moss"],"mid":["medkit","energy_drink","stim_shot"],"rare":["trauma_kit"]},"price":{"water_jug":[3,2,4],"choco_bar":[3,2,4],"soup":[3,2,4],"moss":[2,1,3],"medkit":[3,2,4],"energy_drink":[4,3,5],"stim_shot":[6,5,7],"trauma_kit":[8,6,10]}}};

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

// สุ่มชั้นวางตลาดมืด: mulberry32 + seed จากเลขรอบ — ต้องเหมือน script.js เดิมทุกประการ (ผลลัพธ์ต้องเข้าเงื่อนไขราคา/สต็อกของตลาดมืดเดิม)
function bmRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function bmBuildRound(fac, w) {
  const c = BM_CFG[fac], rnd = bmRng(w * 2654435761 + (fac === "zombie" ? 977 : 31)), used = {}, round = { w };
  Object.entries(BM_CFG.slots).forEach(([k, tier]) => {
    const all = c.tiers[tier], pool = all.filter((id) => !used[id]), list = pool.length ? pool : all;
    const id = list[Math.floor(rnd() * list.length)]; used[id] = 1;
    const [base, lo, hi] = c.price[id];
    const qty = Math.max(lo, Math.min(hi, Math.round(base * (0.88 + 0.24 * rnd()))));
    round[k] = { give: { id, qty: 1 }, want: { id: c.currency, qty }, stock: BM_CFG.stock[tier], sold: 0 };
  });
  return round;
}

function makeMarket(db) {
  const inv = (uid, id) => db.ref(`inventory/${uid}/${id}`);
  const haveQty = async (uid, id) => { const v = (await inv(uid, id).get()).val(); return v && v.id === id ? v.qty || 0 : 0; };

  // ใส่ของเข้าคลัง (เขียนทั้งช่อง {id, qty} เหมือนฝั่งเกมเดิมตอนรับของ) — เกิน 99 หรือช่องเป็นของคนละชนิด → ไม่เขียน คืน false
  async function credit(uid, id, qty) {
    const res = await inv(uid, id).transaction((cur) => {
      if (!cur) return qty <= MAX ? { id, qty } : undefined;
      if (cur.id !== id || !(cur.qty + qty <= MAX)) return undefined;
      return { id, qty: cur.qty + qty };
    });
    return res.committed;
  }
  // ถอนค่าที่เพิ่งหักออกไปกลับ (ใช้ตอนขั้นตอนถัดไปล้มเหลว) — ไม่ตรวจเพดาน เพราะเคยมีของจำนวนนี้อยู่แล้ว
  const refund = (uid, id, qty) => inv(uid, id).transaction((cur) => (cur && cur.id === id ? { ...cur, qty: cur.qty + qty } : !cur ? { id, qty } : undefined));
  async function createIfAbsent(ref, value) { const r = await ref.transaction((cur) => (cur === null ? value : undefined)); return r.committed; }
  // ลบโหนดถ้าเข้าเงื่อนไข (อ่านค่าล่าสุดจากเซิร์ฟเวอร์) — คืน true เมื่อลบสำเร็จ
  async function removeIf(ref, pred) {
    let ok = false;
    const r = await ref.transaction((cur) => { ok = false; if (cur === null) return cur; if (!pred(cur)) return undefined; ok = true; return null; });
    return r.committed && ok;
  }
  async function loadUser(uid) {
    const p = (await db.ref(`users/${uid}`).get()).val();
    if (!p || p.banned === true) fail("permission-denied", "บัญชีนี้ใช้งานไม่ได้");
    if (p.faction !== "human" && p.faction !== "zombie") fail("failed-precondition", "ยังไม่ได้เลือกฝ่าย");
    return p;
  }
  const needSafe = (p) => { if (!(p.hp > 0)) fail("failed-precondition", "คุณสลบอยู่"); if (p.zone !== "safe") fail("failed-precondition", "ซื้อขายได้เฉพาะใน Safe Zone"); };
  const wantsOf = (l) => WANT_KEYS.map((k) => l[k]).filter((w) => w && w.id);
  const weapSlot = (l) => `m_${l.ts}`;

  // คืนของในประกาศให้ผู้รับ (ซื้อ/ยกเลิก): อาวุธ → ช่อง m_{ts} / ของทั่วไป → บวกในช่องเดิม
  async function deliverGive(uid, l) {
    if (l.give.slot) return createIfAbsent(inv(uid, weapSlot(l)), { id: l.give.id, qty: 1, dur: l.give.dur, ...(l.give.maxDur ? { maxDur: l.give.maxDur } : {}) });
    return credit(uid, l.give.id, l.give.qty);
  }
  async function canDeliver(uid, l) {
    if (l.give.slot) return !(await inv(uid, weapSlot(l)).get()).exists();
    return (await haveQty(uid, l.give.id)) + l.give.qty <= MAX;
  }

  async function sell(uid, p, d, now) {
    needSafe(p);
    const fac = p.faction, g = String(d.g || ""), isW = g.startsWith("w:");
    const ws = Array.isArray(d.wants) ? d.wants.slice(0, 3) : [];
    if (!ws.length || (Array.isArray(d.wants) && d.wants.length > 3)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const wants = [];
    for (const x of ws) {
      if (!x || !MKT_IDS.includes(x.id) || !isInt(x.qty, 1, MAX)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      if (wants.some((w) => w.id === x.id)) fail("invalid-argument", "ของที่ต้องการห้ามซ้ำกันเอง");
      wants.push({ id: x.id, qty: x.qty });
    }
    const market = (await db.ref(`market/${fac}`).get()).val() || {};
    const n = [1, 2, 3].find((i) => !market[`${uid}_${i}`]);
    if (!n) fail("failed-precondition", "ลงขายได้สูงสุด 3 ประกาศ — ยกเลิกอันเก่าก่อน");
    const lid = `${uid}_${n}`;
    let give;
    if (isW) {
      const slot = g.slice(2);
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(slot)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      const it = (await inv(uid, slot).get()).val();
      if (!it || !MKT_WEAP.includes(it.id) || !isInt(it.dur, 1, 100) || (it.maxDur !== undefined && !isInt(it.maxDur, 1, 100))) fail("failed-precondition", "ไม่พบอาวุธชิ้นนี้ในกระเป๋า");
      give = { id: it.id, qty: 1, dur: it.dur, slot, ...(it.maxDur ? { maxDur: it.maxDur } : {}) };
      const taken = await removeIf(inv(uid, slot), (cur) => cur.id === it.id && cur.dur === it.dur && cur.maxDur === it.maxDur);
      if (!taken) fail("failed-precondition", "ไม่พบอาวุธชิ้นนี้ในกระเป๋า");
      if (p.equipped === slot) await db.ref(`users/${uid}/equipped`).remove();
    } else {
      const gq = d.gq;
      if (!MKT_IDS.includes(g) || !isInt(gq, 1, MAX)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
      if (wants.some((w) => w.id === g)) fail("invalid-argument", "ของที่ต้องการต้องไม่ซ้ำกับของที่ขาย");
      give = { id: g, qty: gq };
      if (!(await takeItem(db, uid, g, gq))) fail("failed-precondition", "ของในกระเป๋าไม่พอ");
    }
    const L = { seller: uid, sellerName: p.username, give, want: wants[0], ts: now };
    if (wants[1]) L.want2 = wants[1]; if (wants[2]) L.want3 = wants[2];
    if (!(await createIfAbsent(db.ref(`market/${fac}/${lid}`), L))) {   // มีคนใช้ช่องนี้ไปก่อน (ไม่น่าเกิดเพราะมีล็อก) → คืนของ
      if (isW) await createIfAbsent(inv(uid, give.slot), { id: give.id, qty: 1, dur: give.dur, ...(give.maxDur ? { maxDur: give.maxDur } : {}) }); else await refund(uid, give.id, give.qty);
      fail("aborted", "ลงขายไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
    return { ok: true, lid };
  }

  async function buy(uid, p, d, now) {
    needSafe(p);
    const lid = String(d.lid || ""); if (!lid || lid.length > 60) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const lref = db.ref(`market/${p.faction}/${lid}`), l = (await lref.get()).val();
    if (!l || !l.give) fail("failed-precondition", "ประกาศนี้ถูกซื้อหรือยกเลิกไปแล้ว");
    if (l.seller === uid) fail("failed-precondition", "ซื้อประกาศตัวเองไม่ได้");
    const wants = wantsOf(l);
    for (const w of wants) if ((await haveQty(uid, w.id)) < w.qty) fail("failed-precondition", "ของไม่พอ");
    if (!(await canDeliver(uid, l))) fail("failed-precondition", "ของในกระเป๋าจะเกินจำนวนสูงสุด — ใช้ของก่อน");
    const paid = [];
    const undo = async () => { for (const w of paid) await refund(uid, w.id, w.qty); };
    for (const w of wants) { if (!(await takeItem(db, uid, w.id, w.qty))) { await undo(); fail("failed-precondition", "ของไม่พอ"); } paid.push(w); }
    if (!(await removeIf(lref, (cur) => cur.ts === l.ts && cur.seller === l.seller))) { await undo(); fail("aborted", "มีคนซื้อ/ยกเลิกไปก่อนแล้ว"); }
    if (!(await deliverGive(uid, l))) {   // ไม่น่าเกิด (เช็กก่อนแล้ว) — ถ้าเกิดจริงให้คืนทุกอย่าง
      await createIfAbsent(lref, l); await undo(); fail("aborted", "รับของไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
    await Promise.all(wants.map((w, i) => db.ref(`marketPayouts/${l.seller}/${i ? `${lid}_${PAY_KEY[i]}${l.ts}` : `${lid}_${l.ts}`}`).set({ id: w.id, qty: w.qty, lid })));
    return { ok: true, id: l.give.id, qty: l.give.qty };
  }

  async function cancel(uid, p, d) {   // กฎเดิมไม่เช็กโซน/HP ตอนยกเลิก
    const lid = String(d.lid || ""); if (!lid || lid.length > 60) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const lref = db.ref(`market/${p.faction}/${lid}`), l = (await lref.get()).val();
    if (!l || !l.give || l.seller !== uid) fail("failed-precondition", "ไม่พบประกาศของคุณ");
    if (!(await canDeliver(uid, l))) fail("failed-precondition", "ของในกระเป๋าจะเกินจำนวนสูงสุด — ใช้ของก่อน");
    if (!(await removeIf(lref, (cur) => cur.ts === l.ts && cur.seller === uid))) fail("aborted", "ประกาศนี้ถูกซื้อไปแล้ว");
    if (!(await deliverGive(uid, l))) { await createIfAbsent(lref, l); fail("aborted", "รับของคืนไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    return { ok: true };
  }

  async function claim(uid, p, d) {
    const pid = String(d.pid || ""); if (!pid || pid.length > 90) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const pref = db.ref(`marketPayouts/${uid}/${pid}`), pay = (await pref.get()).val();
    if (!pay || !MKT_IDS.includes(pay.id) || !isInt(pay.qty, 1, MAX)) fail("failed-precondition", "ไม่พบของที่รอรับ");
    if ((await haveQty(uid, pay.id)) + pay.qty > MAX) fail("failed-precondition", "ของในกระเป๋าจะเกินจำนวนสูงสุด — ใช้ของก่อนแล้วค่อยรับ");
    if (!(await removeIf(pref, (cur) => cur.id === pay.id && cur.qty === pay.qty))) fail("aborted", "รับของไม่สำเร็จ ลองใหม่อีกครั้ง");
    if (!(await credit(uid, pay.id, pay.qty))) { await pref.set(pay); fail("aborted", "รับของไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    return { ok: true, id: pay.id, qty: pay.qty };
  }

  async function bmBuy(uid, p, d, now) {
    needSafe(p);
    const k = String(d.k || ""); if (!/^o[1-5]$/.test(k)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const bref = db.ref(`bm/${p.faction}`), round = (await bref.get()).val();
    const w = round && round.w, o = round && round[k];
    if (!o || !o.give || !(w * BM_CFG.win <= now && now < (w + 1) * BM_CFG.win)) fail("failed-precondition", "ตลาดมืดกำลังเปลี่ยนรอบ — รอสักครู่");
    if (o.buyers && o.buyers[uid]) fail("failed-precondition", "คุณซื้อรายการนี้ในรอบนี้แล้ว");
    if ((o.sold || 0) + 1 > o.stock) fail("failed-precondition", "สินค้าหมดแล้ว");
    if ((await haveQty(uid, o.want.id)) < o.want.qty) fail("failed-precondition", "ของไม่พอ");
    if ((await haveQty(uid, o.give.id)) + o.give.qty > MAX) fail("failed-precondition", "ของในกระเป๋าจะเกินจำนวนสูงสุด — ใช้ของก่อน");
    if (!(await takeItem(db, uid, o.want.id, o.want.qty))) fail("failed-precondition", "ของไม่พอ");
    let ok = false;
    const r = await bref.transaction((cur) => {
      ok = false; if (cur === null) return cur;
      const c = cur[k]; if (!c || cur.w !== w || (c.buyers && c.buyers[uid]) || (c.sold || 0) + 1 > c.stock) return undefined;
      ok = true; return { ...cur, [k]: { ...c, sold: (c.sold || 0) + 1, buyers: { ...(c.buyers || {}), [uid]: true } } };
    });
    if (!(r.committed && ok)) { await refund(uid, o.want.id, o.want.qty); fail("aborted", "มีคนซื้อตัดหน้า หรือเปลี่ยนรอบแล้ว"); }
    if (!(await credit(uid, o.give.id, o.give.qty))) fail("aborted", "รับของไม่สำเร็จ ลองใหม่อีกครั้ง");   // ถึงขั้นนี้แล้วถือว่าซื้อสำเร็จ — แจ้งผู้เล่นให้ติดต่อ (ไม่น่าเกิดเพราะเช็กเพดานก่อน)
    return { ok: true, id: o.give.id, qty: o.give.qty };
  }

  async function bmRotate(uid, p, d, now) {
    const w = Math.floor(now / BM_CFG.win);
    const r = await db.ref(`bm/${p.faction}`).transaction((cur) => (cur === null || !(cur.w >= w) ? bmBuildRound(p.faction, w) : undefined));
    return { ok: true, rotated: r.committed, w };
  }

  async function gift(uid, p, d, now) {
    needSafe(p);
    const to = String(d.to || ""), id = d.id;
    if (!to || to.length > 40 || to === uid || !GIFT_IDS.includes(id)) fail("invalid-argument", "ข้อมูลไม่ถูกต้อง");
    const rcp = (await db.ref(`users/${to}`).get()).val();
    if (!rcp || rcp.faction !== p.faction) fail("failed-precondition", "ฝากของได้เฉพาะเพื่อนฝั่งเดียวกัน");
    const last = (await db.ref(`giftTx/${uid}/ts`).get()).val();
    if (typeof last === "number" && !(last < now - 3000)) fail("resource-exhausted", "รอสักครู่ก่อนฝากชิ้นต่อไป");
    const pref = db.ref(`marketPayouts/${to}/g${uid}`);
    if ((await pref.get()).exists()) fail("failed-precondition", "เพื่อนยังไม่ได้รับของที่ฝากไว้ก่อนหน้า");
    if (!(await takeItem(db, uid, id, 1))) fail("failed-precondition", "ของชิ้นนี้หมดแล้ว");
    if (!(await createIfAbsent(pref, { id, qty: 1, lid: "gift", n: String(p.username || "").slice(0, 16) }))) { await refund(uid, id, 1); fail("failed-precondition", "เพื่อนยังไม่ได้รับของที่ฝากไว้ก่อนหน้า"); }
    await db.ref(`giftTx/${uid}`).set({ ts: now, to });
    return { ok: true };
  }

  const actions = { sell, buy, cancel, claim, bmBuy, bmRotate, gift };
  async function run(uid, data, now = Date.now()) {
    if (!uid) fail("unauthenticated", "ต้องล็อกอินก่อน");
    const fn = actions[data && data.a];
    if (!fn) fail("invalid-argument", "ไม่รู้จักคำสั่ง");
    return withLock(db, uid, now, async () => { const p = await loadUser(uid); return fn(uid, p, data, now); });
  }
  return { run };
}

module.exports = { makeMarket, bmBuildRound, BM_CFG, MKT_IDS, MKT_WEAP, GIFT_IDS };
