import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, deleteUser, linkWithCredential, EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, remove, onValue, onChildAdded, onChildRemoved,
  onDisconnect, query, orderByKey, limitToLast, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

/* =========================================================
   1) ตั้งค่า Firebase — แก้เป็นค่าจากโปรเจกต์ของคุณ
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyD_5ovnQvZrkO8kG1i00dMdkO2rlNTG_Tk",
  authDomain: "zompocalypse-137a6.firebaseapp.com",
  databaseURL: "https://zompocalypse-137a6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zompocalypse-137a6",
  storageBucket: "zompocalypse-137a6.firebasestorage.app",
  messagingSenderId: "1032491711291",
  appId: "1:1032491711291:web:4f6d6d9f3eb7d174a0151e",
  measurementId: "G-66LKE0WRVB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* =========================================================
   2) ข้อมูลเกม (ต้องตรงกับรายชื่อใน database.rules.json)
   ========================================================= */
const STAMINA_COST = 10, STAMINA_MAX = 100, REGEN_MS = 5000, HP_MAX = 100;
const CHAT_LIMIT = 100, ANN_LIMIT = 50, ATTACK_COOLDOWN = 3000, UNARMED_DMG = 5;

const FACTION = {
  human: { name: "มนุษย์", icon: "👤" },
  zombie: { name: "ซอมบี้", icon: "🧟" }
};

const ITEMS = {
  canned_food: { name: "อาหารกระป๋อง", icon: "🥫", type: "consumable", heal: 10 },
  water: { name: "น้ำดื่ม", icon: "💧", type: "consumable", heal: 5 },
  bandage: { name: "ผ้าพันแผล", icon: "🩹", type: "consumable", heal: 20 },
  medkit: { name: "ชุดปฐมพยาบาล", icon: "🧰", type: "consumable", heal: 50 },
  wooden_bat: { name: "ไม้เบสบอล", icon: "🏏", type: "weapon", dmg: 8, maxDur: 20 },
  knife: { name: "มีด", icon: "🔪", type: "weapon", dmg: 12, maxDur: 25 },
  crowbar: { name: "ชะแลง", icon: "🔧", type: "weapon", dmg: 10, maxDur: 30 },
  pistol: { name: "ปืนพก", icon: "🔫", type: "weapon", dmg: 25, maxDur: 12 },
  super_ration: { name: "เสบียงพิเศษ (GM)", icon: "🍱", type: "consumable", heal: 50, gmOnly: true },
  admin_katana: { name: "ดาบคาตานะ (GM)", icon: "🗡️", type: "weapon", dmg: 40, maxDur: 60, gmOnly: true }
};

// drops: น้ำหนักการสุ่ม (id: null = ไม่เจออะไร)
const ZONES = {
  safe: {
    name: "Safe Zone", icon: "🏕️", desc: "ค่ายพักพิง ปลอดภัย ต่อสู้ไม่ได้ ของหายาก",
    drops: [{ id: "canned_food", w: 20 }, { id: "water", w: 20 }, { id: "bandage", w: 5 }, { id: null, w: 55 }]
  },
  ruins: {
    name: "เขตเมืองร้าง", icon: "🏚️", desc: "ตึกพังและซากรถ มีของใช้ทั่วไปและอาวุธมือ",
    drops: [{ id: "canned_food", w: 15 }, { id: "water", w: 15 }, { id: "bandage", w: 10 }, { id: "wooden_bat", w: 8 },
            { id: "knife", w: 6 }, { id: "crowbar", w: 6 }, { id: null, w: 40 }]
  },
  hospital: {
    name: "โรงพยาบาลร้าง", icon: "🏥", desc: "ยาและเวชภัณฑ์เยอะ แต่อันตราย",
    drops: [{ id: "bandage", w: 20 }, { id: "medkit", w: 12 }, { id: "canned_food", w: 8 }, { id: "water", w: 10 },
            { id: "knife", w: 5 }, { id: null, w: 45 }]
  },
  forest: {
    name: "ป่าลึก", icon: "🌲", desc: "ไกลจากทุกอย่าง อาวุธดีๆ ซ่อนอยู่",
    drops: [{ id: "water", w: 20 }, { id: "canned_food", w: 10 }, { id: "knife", w: 8 }, { id: "crowbar", w: 8 },
            { id: "pistol", w: 4 }, { id: null, w: 50 }]
  }
};

/* =========================================================
   3) State + helpers
   ========================================================= */
const state = {
  uid: null, profile: null, zone: null, offset: 0, inv: {}, ground: {},
  unsubs: [], started: false, busy: false, lastAttack: 0, sessionStart: 0, attackQueue: Promise.resolve()
};

const $ = (id) => document.getElementById(id);
const serverNow = () => Date.now() + state.offset;
const d6 = () => 1 + Math.floor(Math.random() * 6);
const isStaff = () => ["gm", "owner"].includes(state.profile?.role);

function mk(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
function btn(label, fn, cls = "btn primary mini") {
  const b = mk("button", cls, label);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
function show(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
}
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}
const errMsg = (e) => (String(e?.code || e).includes("PERMISSION_DENIED") ? "ระบบไม่อนุญาตการกระทำนี้" : "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง");

// ลบรายการเก่าสุดใน path ให้เหลือไม่เกิน limit (ใช้กับแชท 100 ข้อความ และประกาศ)
async function trimList(path, limit) {
  const snap = await get(query(ref(db, path), orderByKey(), limitToLast(limit + 10)));
  let extra = snap.size - limit;
  const del = {};
  snap.forEach((c) => { if (extra-- > 0) del[`${path}/${c.key}`] = null; });
  if (Object.keys(del).length) await update(ref(db), del);
}

// พลังงานปัจจุบัน = ค่าที่เก็บ + ที่ฟื้นตามเวลา (ลบ 1.5 วิ กันเวลาเพี้ยน ให้ผ่านกฎฝั่งเซิร์ฟเวอร์)
function curStamina() {
  const p = state.profile;
  if (!p) return 0;
  const regen = Math.max(0, Math.floor((serverNow() - 1500 - p.staminaTs) / REGEN_MS));
  return Math.min(STAMINA_MAX, p.stamina + regen);
}

function equippedWeapon() {
  const slot = state.profile?.equipped;
  const it = slot && state.inv[slot];
  const def = it && ITEMS[it.id];
  return def && def.type === "weapon" && it.dur > 0 ? { slot, it, def } : null;
}

// ใช้อาวุธ 1 ครั้ง = ความคงทน −1 (ถึง 0 = พัง)
function wearUpdates(u, w) {
  const left = w.it.dur - 1;
  if (left <= 0) {
    u[`inventory/${state.uid}/${w.slot}`] = null;
    u[`users/${state.uid}/equipped`] = null;
    toast(`${w.def.name} พังแล้ว!`);
  } else {
    u[`inventory/${state.uid}/${w.slot}/dur`] = left;
  }
}

/* ---------- แท็บสำหรับมือถือ (บนคอมไม่มีผล) ---------- */
function setTab(t) {
  document.querySelectorAll(".layout .panel").forEach((p) => p.classList.toggle("tab-on", p.dataset.panel === t));
  document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  if (t === "chat") document.querySelector('.tabbar [data-tab="chat"]').classList.remove("unread");
}
function notifyChat() {
  if (!document.querySelector(".layout .panel.chat").classList.contains("tab-on"))
    document.querySelector('.tabbar [data-tab="chat"]').classList.add("unread");
}
document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
setTab("chat");

/* =========================================================
   4) ล็อกอินด้วยชื่อผู้ใช้ + รหัสผ่าน
   Firebase ต้องการอีเมล จึงแปลงชื่อเป็นอีเมลจำลองหลังบ้าน (ผู้เล่นไม่เห็น)
   ========================================================= */
onValue(ref(db, ".info/serverTimeOffset"), (s) => { state.offset = s.val() || 0; });

const EMAIL_DOMAIN = "zombocalypse.app";
const nameKey = (name) => name.toLowerCase().replace(/\s+/g, "_");
const cleanName = (v) => v.replace(/[.#$\[\]\/]/g, "").trim();

async function emailFor(name) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nameKey(name)));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `u${hex.slice(0, 40)}@${EMAIL_DOMAIN}`;
}

function authError(e) {
  const c = String(e?.code || e);
  if (c.includes("email-already-in-use") || c.includes("PERMISSION_DENIED")) return "ชื่อนี้ถูกใช้แล้ว ลองชื่ออื่น";
  if (c.includes("invalid-credential") || c.includes("user-not-found") || c.includes("wrong-password")) return "ชื่อหรือรหัสผ่านไม่ถูกต้อง";
  if (c.includes("weak-password")) return "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)";
  if (c.includes("too-many-requests")) return "ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";
  if (c.includes("network")) return "เชื่อมต่อเครือข่ายไม่ได้";
  if (c.includes("operation-not-allowed")) return "ยังไม่ได้เปิด Email/Password ใน Firebase Authentication";
  if (c.includes("requires-recent-login")) return "เซสชันเก่าเกินไป ออกจากระบบแล้วเข้าใหม่";
  return "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง";
}

onAuthStateChanged(auth, async (user) => {
  if (state.registering) return;            // กำลังสมัคร: register() จัดการเอง
  try {
    if (!user) { show("login"); return; }
    state.uid = user.uid;
    const snap = await get(ref(db, "users/" + user.uid));
    if (snap.exists()) { startGame(); return; }
    await signOut(auth);                     // มีบัญชีแต่ไม่มีตัวละคร
    show("login");
    $("login-error").textContent = "ไม่พบตัวละครของบัญชีนี้ กรุณาสร้างตัวละครใหม่";
  } catch (e) {
    show("login");
    $("login-error").textContent = "เชื่อมต่อ Firebase ไม่ได้ — ตรวจ firebaseConfig และการตั้งค่า Authentication";
    console.error(e);
  }
});

let mode = "login", pickedFaction = null;
function setMode(m) {
  mode = m;
  document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  document.querySelectorAll(".reg-only").forEach((el) => el.classList.toggle("hidden", m !== "register"));
  $("auth-submit").textContent = m === "login" ? "เข้าสู่ระบบ" : "สร้างตัวละครและเข้าเกม";
  $("inp-password").autocomplete = m === "login" ? "current-password" : "new-password";
  $("login-error").textContent = "";
}
document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
document.querySelectorAll(".faction-btn").forEach((b) => b.addEventListener("click", () => {
  pickedFaction = b.dataset.faction;
  document.querySelectorAll(".faction-btn").forEach((x) => x.classList.toggle("selected", x === b));
}));

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = (t) => { $("login-error").textContent = t; };
  const name = cleanName($("inp-username").value), pw = $("inp-password").value;
  if (name.length < 2) return err("ชื่อต้องยาวอย่างน้อย 2 ตัวอักษร");
  if (pw.length < 6) return err("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
  if (mode === "register") {
    if (pw !== $("inp-password2").value) return err("รหัสผ่านสองช่องไม่ตรงกัน");
    if (!pickedFaction) return err("เลือกฝ่ายก่อน");
  }
  err("");
  $("auth-submit").disabled = true;
  try {
    const email = await emailFor(name);
    if (mode === "login") await signInWithEmailAndPassword(auth, email, pw);   // แล้ว onAuthStateChanged พาเข้าเกม
    else await register(name, email, pw);
  } catch (ex) { err(authError(ex)); }
  finally { $("auth-submit").disabled = false; }
});

async function register(name, email, pw) {
  state.registering = true;
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, pw);
    const uid = cred.user.uid;
    // จองชื่อ + สร้างตัวละครในคำสั่งเดียว (ชื่อซ้ำ = ทั้งคู่ล้มเหลว)
    await update(ref(db), {
      ["usernames/" + nameKey(name)]: uid,
      ["users/" + uid]: {
        username: name, faction: pickedFaction, role: "player", banned: false, zone: "safe",
        stamina: STAMINA_MAX, staminaTs: serverTimestamp(), hp: HP_MAX, createdAt: serverTimestamp()
      }
    });
    state.uid = uid;
    startGame();
  } catch (e) {
    if (cred) await deleteUser(cred.user).catch(() => {});   // ไม่ให้เหลือบัญชีกำพร้า
    throw e;
  } finally { state.registering = false; }
}

// ออกจากระบบ
$("btn-logout").addEventListener("click", async () => {
  try {
    if (state.zone) {
      const r = ref(db, `zonePlayers/${state.zone}/${state.uid}`);
      await onDisconnect(r).cancel();
      await remove(r);
    }
  } catch { /* ไม่เป็นไร */ }
  await signOut(auth);
  location.reload();
});

// ตัวละครเก่าที่สร้างไว้แบบไม่มีรหัสผ่าน (Anonymous) → ตั้งรหัสผ่านให้
$("btn-setpw").addEventListener("click", () => $("pw-modal").classList.remove("hidden"));
$("pw-close").addEventListener("click", () => $("pw-modal").classList.add("hidden"));
$("pw-save").addEventListener("click", async () => {
  const p1 = $("pw-1").value;
  if (p1.length < 6) return toast("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
  if (p1 !== $("pw-2").value) return toast("รหัสผ่านสองช่องไม่ตรงกัน");
  try {
    const email = await emailFor(state.profile.username);
    await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, p1));
    $("pw-modal").classList.add("hidden");
    $("btn-setpw").classList.add("hidden");
    toast("ตั้งรหัสผ่านแล้ว ครั้งหน้าเข้าด้วยชื่อ + รหัสผ่าน");
  } catch (ex) { toast(authError(ex)); }
});

/* =========================================================
   5) เริ่มเกม
   ========================================================= */
function startGame() {
  if (state.started) return;
  state.started = true;
  state.sessionStart = serverNow() - 30000;

  onValue(ref(db, "users/" + state.uid), (snap) => {
    const p = snap.val();
    if (!p) return;
    state.profile = p;
    if (p.banned) { teardownZone(); show("banned"); return; }
    if (!$("screen-game").classList.contains("active")) {
      show("game");
      buildZoneList();
      buildAdmin();
      listenInventory();
      listenAnnouncements();
      listenAttacks();
      enterZone(p.zone in ZONES ? p.zone : "safe", true);
    }
    renderProfile();
  });
  setInterval(renderBars, 1000);
}

function renderProfile() {
  const p = state.profile;
  $("me-name").textContent = p.username;
  $("me-faction").textContent = FACTION[p.faction].icon;
  const badge = $("me-role");
  badge.className = "badge " + p.role;
  badge.textContent = p.role;
  badge.classList.toggle("hidden", p.role === "player");
  $("btn-admin").classList.toggle("hidden", !isStaff());
  $("btn-setpw").classList.toggle("hidden", !auth.currentUser?.isAnonymous);
  document.querySelector(".owner-only").classList.toggle("hidden", p.role !== "owner");
  if (!isStaff()) $("admin-modal").classList.add("hidden");
  renderBars();
  renderInv();
}

function renderBars() {
  const p = state.profile;
  if (!p) return;
  const st = curStamina();
  $("bar-hp").style.width = (p.hp / HP_MAX) * 100 + "%";
  $("txt-hp").textContent = `HP ${p.hp}/${HP_MAX}`;
  $("bar-st").style.width = (st / STAMINA_MAX) * 100 + "%";
  $("txt-st").textContent = `พลังงาน ${st}/${STAMINA_MAX}`;
  $("btn-scavenge").disabled = st < STAMINA_COST;
}

$("btn-copy-id").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(state.uid); toast("คัดลอก Player ID แล้ว"); }
  catch { prompt("Player ID ของคุณ", state.uid); }
});

/* =========================================================
   6) โซน + แชท
   ========================================================= */
function buildZoneList() {
  const ul = $("zone-list");
  ul.innerHTML = "";
  Object.entries(ZONES).forEach(([id, z]) => {
    const li = mk("li");
    li.style.padding = "0"; li.style.border = "0"; li.style.background = "none";
    const b = mk("button", "zone-btn", `${z.icon} ${z.name}`);
    b.dataset.zone = id;
    b.addEventListener("click", () => { enterZone(id); setTab("chat"); });
    li.append(b);
    ul.append(li);
  });
}

function teardownZone() {
  state.unsubs.forEach((f) => f());
  state.unsubs = [];
}

async function enterZone(z, initial = false) {
  if (!initial && z === state.zone) return;
  const old = state.zone;
  try {
    if (!initial) {
      await update(ref(db), { ["users/" + state.uid + "/zone"]: z });
      if (old) {
        const oldRef = ref(db, `zonePlayers/${old}/${state.uid}`);
        await onDisconnect(oldRef).cancel();
        await remove(oldRef);
      }
    }
    teardownZone();
    state.zone = z;
    state.ground = {};
    $("chat-log").innerHTML = "";
    $("zone-title").textContent = `${ZONES[z].icon} ${ZONES[z].name}`;
    $("zone-desc").textContent = ZONES[z].desc;
    document.querySelectorAll(".zone-btn").forEach((b) => b.classList.toggle("current", b.dataset.zone === z));

    // presence: รายชื่อผู้เล่นในโซน (หายอัตโนมัติเมื่อปิดหน้าเว็บ)
    const pRef = ref(db, `zonePlayers/${z}/${state.uid}`);
    await set(pRef, { name: state.profile.username, faction: state.profile.faction });
    onDisconnect(pRef).remove();

    const chatQ = query(ref(db, "chats/" + z), orderByKey(), limitToLast(CHAT_LIMIT));
    state.unsubs.push(
      onChildAdded(chatQ, (s) => addChat(s.key, s.val())),
      onChildRemoved(chatQ, (s) => { document.querySelector(`[data-key="${s.key}"]`)?.remove(); }),
      onValue(ref(db, "zonePlayers/" + z), renderPlayers),
      onValue(ref(db, "zoneItems/" + z), (s) => { state.ground = s.val() || {}; renderGround(); })
    );
    if (!initial) logLine(`คุณเดินทางมาถึง ${ZONES[z].name}`, "info");
  } catch (e) {
    toast(errMsg(e));
  }
}

function logLine(text, cls = "info") {
  const log = $("chat-log");
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  log.append(mk("div", "msg " + cls, text));
  if (near) log.scrollTop = log.scrollHeight;
  notifyChat();
}

function addChat(key, m) {
  const log = $("chat-log");
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  let el;
  if (m.type === "combat") {
    el = mk("div", "msg combat", m.text);
  } else {
    el = mk("div", "msg");
    el.append(mk("span", "n " + m.faction, `${FACTION[m.faction]?.icon || ""} ${m.name}`), mk("span", "", `: ${m.text}`));
  }
  el.dataset.key = key;
  log.append(el);
  if (near) log.scrollTop = log.scrollHeight;
  notifyChat();
}

$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = $("chat-input").value.trim().slice(0, 200);
  if (!text) return;
  $("chat-input").value = "";
  try { await sendChat(text, "chat"); } catch (err) { toast(errMsg(err)); }
});

async function sendChat(text, type) {
  const z = state.zone, p = state.profile;
  await push(ref(db, "chats/" + z), {
    uid: state.uid, name: p.username, faction: p.faction, text, type, ts: serverTimestamp()
  });
  trimList("chats/" + z, CHAT_LIMIT).catch(() => {});   // ข้อความที่ 101 → ลบข้อความเก่าสุดทันที
}

function renderPlayers(snap) {
  const ul = $("player-list");
  ul.innerHTML = "";
  snap.forEach((c) => {
    const v = c.val(), me = c.key === state.uid;
    const li = mk("li");
    li.append(mk("span", "", `${FACTION[v.faction]?.icon || ""} ${v.name}${me ? " (คุณ)" : ""}`));
    if (!me && state.zone !== "safe") li.append(btn("โจมตี", () => attack(c.key), "btn danger mini"));
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีใครอยู่"));
}

/* =========================================================
   7) ประกาศระบบ (สีแดง)
   ========================================================= */
function listenAnnouncements() {
  onChildAdded(query(ref(db, "announcements"), limitToLast(10)), (s) => {
    const a = s.val();
    if (typeof a.ts === "number" && a.ts < state.sessionStart) return;
    if (a.zone === "all" || a.zone === state.zone) logLine(`[ประกาศระบบ] ${a.text}`, "system");
  });
}

/* =========================================================
   8) กระเป๋า / ของบนพื้น
   ========================================================= */
function listenInventory() {
  onValue(ref(db, "inventory/" + state.uid), (s) => { state.inv = s.val() || {}; renderInv(); });
}

function renderInv() {
  const ul = $("inv-list");
  if (!ul) return;
  ul.innerHTML = "";
  Object.entries(state.inv).forEach(([slot, it]) => {
    const def = ITEMS[it.id];
    if (!def) return;
    const li = mk("li");
    if (def.type === "weapon") {
      const eq = state.profile?.equipped === slot;
      if (eq) li.classList.add("equipped");
      li.append(mk("span", "", `${def.icon} ${def.name} (${it.dur}/${def.maxDur})`));
      li.append(btn(eq ? "ถอด" : "ถือ", () => equip(slot, eq), "btn ghost mini"));
    } else {
      li.append(mk("span", "", `${def.icon} ${def.name} ×${it.qty}`));
      li.append(btn("ใช้", () => useItem(slot)));
    }
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "กระเป๋าว่างเปล่า"));
}

function renderGround() {
  const ul = $("ground-list");
  ul.innerHTML = "";
  Object.entries(state.ground).forEach(([key, g]) => {
    const def = ITEMS[g.id];
    if (!def) return;
    const li = mk("li");
    li.append(mk("span", "", `${def.icon} ${def.name}${def.type === "consumable" ? " ×" + g.qty : ""}`));
    li.append(btn("เก็บ", () => pickup(key)));
    ul.append(li);
  });
  if (!ul.children.length) ul.append(mk("li", "empty", "ไม่มีของบนพื้น"));
}

// เพิ่มไอเทมเข้ากระเป๋าตัวเอง (ใส่ลงใน object update)
function invAddUpdate(u, itemId, qty, src, dur) {
  const def = ITEMS[itemId];
  if (def.type === "weapon") {
    const k = push(ref(db, "inventory/" + state.uid)).key;
    u[`inventory/${state.uid}/${k}`] = { id: itemId, qty: 1, dur: dur ?? def.maxDur, ...(src ? { src } : {}) };
  } else {
    const total = Math.min(99, (state.inv[itemId]?.qty || 0) + qty);
    u[`inventory/${state.uid}/${itemId}`] = { id: itemId, qty: total, ...(src ? { src } : {}) };
  }
}

async function pickup(key) {
  const g = state.ground[key];
  if (!g) return;
  const u = { [`zoneItems/${state.zone}/${key}`]: null };
  invAddUpdate(u, g.id, g.qty || 1, key, g.dur);
  try { await update(ref(db), u); toast(`เก็บ ${ITEMS[g.id].name} แล้ว`); }
  catch { toast("มีคนเก็บไปก่อนแล้ว หรือกระเป๋าเต็ม"); }
}

async function equip(slot, isEquipped) {
  try { await update(ref(db), { ["users/" + state.uid + "/equipped"]: isEquipped ? null : slot }); }
  catch (e) { toast(errMsg(e)); }
}

async function useItem(slot) {
  const it = state.inv[slot], def = it && ITEMS[it.id], p = state.profile;
  if (!def || def.type !== "consumable") return;
  if (p.hp >= HP_MAX) return toast("เลือดเต็มอยู่แล้ว");
  const u = { ["users/" + state.uid + "/hp"]: Math.min(HP_MAX, p.hp + def.heal) };
  if (it.qty > 1) u[`inventory/${state.uid}/${slot}/qty`] = it.qty - 1;
  else u[`inventory/${state.uid}/${slot}`] = null;
  try { await update(ref(db), u); toast(`ใช้ ${def.name} ฟื้น ${def.heal} HP`); }
  catch (e) { toast(errMsg(e)); }
}

/* =========================================================
   9) ค้นหาไอเทม (Scavenging)
   ========================================================= */
function rollDrop(table) {
  const total = table.reduce((s, d) => s + d.w, 0);
  let r = Math.random() * total;
  for (const d of table) { if ((r -= d.w) < 0) return d.id; }
  return null;
}

$("btn-scavenge").addEventListener("click", async () => {
  if (state.busy) return;
  const cur = curStamina();
  if (cur < STAMINA_COST) return toast("พลังงานไม่พอ");
  state.busy = true;
  try {
    const found = rollDrop(ZONES[state.zone].drops);
    const u = {
      ["users/" + state.uid + "/stamina"]: cur - STAMINA_COST,
      ["users/" + state.uid + "/staminaTs"]: serverTimestamp()
    };
    if (found) invAddUpdate(u, found, 1);
    await update(ref(db), u);
    logLine(found ? `คุณค้นหา… เจอ ${ITEMS[found].icon} ${ITEMS[found].name}` : "คุณค้นหา… ไม่เจออะไรเลย", "info");
  } catch (e) { toast(errMsg(e)); }
  finally { state.busy = false; }
});

/* =========================================================
   10) ต่อสู้ (ทอยเต๋า d6)
   ผู้โจมตีทอยแล้วส่งคำขอไปที่เป้าหมาย → ฝั่งเป้าหมายทอยป้องกัน,
   ตัดสิน, หักเลือดตัวเอง แล้วประกาศผลในแชทโซน
   ========================================================= */
async function attack(targetUid) {
  if (state.zone === "safe") return toast("Safe Zone ต่อสู้ไม่ได้");
  if (Date.now() - state.lastAttack < ATTACK_COOLDOWN) return toast("รอสักครู่ก่อนโจมตีอีกครั้ง");
  state.lastAttack = Date.now();
  const w = equippedWeapon();
  const roll = d6();
  const key = push(ref(db, "attacks/" + targetUid)).key;
  const u = {
    [`attacks/${targetUid}/${key}`]: {
      from: state.uid, fromName: state.profile.username, roll, zone: state.zone, ts: serverTimestamp(),
      ...(w ? { wpn: w.it.id } : {})
    }
  };
  if (w) wearUpdates(u, w);
  try { await update(ref(db), u); toast(`คุณทอยได้ ${roll} — รอผลการต่อสู้`); }
  catch (e) { toast(errMsg(e)); }
}

function listenAttacks() {
  onChildAdded(ref(db, "attacks/" + state.uid), (s) => {
    state.attackQueue = state.attackQueue.then(() => resolveAttack(s.key, s.val())).catch(console.error);
  });
}

async function resolveAttack(key, a) {
  const aRef = ref(db, `attacks/${state.uid}/${key}`);
  const p = state.profile;
  if (serverNow() - a.ts > 30000 || a.zone !== state.zone) { await remove(aRef); return; }

  const defRoll = d6();
  const w = equippedWeapon();
  const u = { [`attacks/${state.uid}/${key}`]: null };
  if (w) wearUpdates(u, w);

  const hit = a.roll > defRoll;
  const dmg = hit ? (ITEMS[a.wpn]?.dmg || UNARMED_DMG) : 0;
  const newHp = Math.max(0, p.hp - dmg);
  let text = `⚔ ${a.fromName} ทอย ${a.roll} vs ${p.username} ทอย ${defRoll} → `;
  if (hit) {
    text += `${a.fromName} โจมตีโดน! −${dmg} HP`;
    u[`users/${state.uid}/hp`] = newHp === 0 ? 50 : newHp;   // ล้มแล้วฟื้นที่ Safe Zone ด้วย 50 HP
    if (newHp === 0) text += ` — ${p.username} ล้มลง!`;
  } else {
    text += a.roll === defRoll ? "เสมอ ไม่มีใครโดน" : `${p.username} ป้องกันได้`;
  }

  await update(ref(db), u);
  await sendChat(text, "combat");
  if (hit && newHp === 0) {
    await enterZone("safe");
    logLine("คุณถูกกำจัด แล้วฟื้นขึ้นที่ Safe Zone", "system");
  }
}

/* =========================================================
   11) Admin Console (gm / owner)
   ========================================================= */
function fillSelect(sel, entries) {
  sel.innerHTML = "";
  entries.forEach(([v, label]) => sel.append(new Option(label, v)));
}

function buildAdmin() {
  fillSelect($("adm-ann-zone"), [["all", "ทุกโซน"], ...Object.entries(ZONES).map(([id, z]) => [id, "เฉพาะ " + z.name])]);
  fillSelect($("adm-target-zone"), Object.entries(ZONES).map(([id, z]) => [id, z.name]));
  fillSelect($("adm-item"), Object.entries(ITEMS).map(([id, i]) => [id, `${i.icon} ${i.name}`]));
}

$("btn-admin").addEventListener("click", () => { if (isStaff()) $("admin-modal").classList.remove("hidden"); });
$("adm-close").addEventListener("click", () => $("admin-modal").classList.add("hidden"));
$("adm-mode").addEventListener("change", (e) => {
  $("adm-target-id").classList.toggle("hidden", e.target.value !== "player");
  $("adm-target-zone").classList.toggle("hidden", e.target.value !== "zone");
});

$("adm-ann-send").addEventListener("click", async () => {
  const text = $("adm-ann-text").value.trim().slice(0, 200);
  if (!text) return;
  try {
    await push(ref(db, "announcements"), {
      text, zone: $("adm-ann-zone").value, by: state.profile.username, ts: serverTimestamp()
    });
    $("adm-ann-text").value = "";
    toast("ส่งประกาศแล้ว");
    trimList("announcements", ANN_LIMIT).catch(() => {});
  } catch (e) { toast(errMsg(e)); }
});

$("adm-spawn").addEventListener("click", async () => {
  const itemId = $("adm-item").value, def = ITEMS[itemId];
  const qty = Math.max(1, Math.min(99, parseInt($("adm-qty").value, 10) || 1));
  try {
    if ($("adm-mode").value === "zone") {
      const z = $("adm-target-zone").value;
      const n = def.type === "weapon" ? Math.min(qty, 10) : 1;
      for (let i = 0; i < n; i++) {
        await push(ref(db, "zoneItems/" + z), {
          id: itemId, qty: def.type === "weapon" ? 1 : qty, ...(def.type === "weapon" ? { dur: def.maxDur } : {})
        });
      }
      toast(`วาง ${def.name} ไว้ใน ${ZONES[z].name} แล้ว`);
    } else {
      const target = $("adm-target-id").value.trim();
      if (!target) return toast("ใส่ Player ID ก่อน");
      const t = await get(ref(db, "users/" + target));
      if (!t.exists()) return toast("ไม่พบ Player ID นี้");
      if (def.type === "weapon") {
        for (let i = 0; i < Math.min(qty, 10); i++) {
          await push(ref(db, `inventory/${target}`), { id: itemId, qty: 1, dur: def.maxDur });
        }
      } else {
        await runTransaction(ref(db, `inventory/${target}/${itemId}`), (cur) => ({
          id: itemId, qty: Math.min(99, (cur?.qty || 0) + qty)
        }));
      }
      toast(`เสก ${def.name} ให้ ${t.val().username} แล้ว`);
    }
  } catch (e) { toast(errMsg(e)); }
});

async function ownerSet(patch, okMsg) {
  const pid = $("adm-pid").value.trim();
  if (!pid) return toast("ใส่ Player ID ก่อน");
  if (pid === state.uid) return toast("ไม่สามารถแก้สิทธิ์ตัวเองได้");
  try {
    const t = await get(ref(db, "users/" + pid));
    if (!t.exists()) return toast("ไม่พบ Player ID นี้");
    const u = {};
    Object.entries(patch).forEach(([k, v]) => { u[`users/${pid}/${k}`] = v; });
    await update(ref(db), u);
    toast(`${okMsg}: ${t.val().username}`);
  } catch (e) { toast(errMsg(e)); }
}
$("adm-setrole").addEventListener("click", () => ownerSet({ role: $("adm-role").value }, "ตั้งสิทธิ์แล้ว"));
$("adm-ban").addEventListener("click", () => ownerSet({ banned: true }, "แบนแล้ว"));
$("adm-unban").addEventListener("click", () => ownerSet({ banned: false }, "ปลดแบนแล้ว"));
