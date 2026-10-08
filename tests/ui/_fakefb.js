// 🧪 Firebase จำลองในหน่วยความจำ + โหลดเกมจริง (index.html + script.js) — ใช้ร่วมกันของ uiboot / uitut
// boot({ faction, role, createdAt (ms หรือ "now"), inventory, seed (โหนดฐานข้อมูลเพิ่มเติม), viewport, ms }) → { pg, br, errs, state() }
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "../../");
const DBJS = `
const now = Date.now(); const CFG = window.__CFG || {}; const DB = window.__DB = { users: { u1: { username: "tester", faction: CFG.faction || "human", role: CFG.role || "player", banned: false, zone: "safe", hp: 100, stamina: 100, staminaTs: now, food: 100, foodTs: now, water: 100, waterTs: now, createdAt: CFG.createdAt === "now" ? now - 30000 : (CFG.createdAt ?? now - 1e9), seenAt: now } }, stats: { u1: { str: 1, hp: 1, st: 1, regen: 0, agi: 0, tough: 0 } }, ...(CFG.inventory ? { inventory: { u1: CFG.inventory } } : {}) };
if (CFG.seed) for (const [k, v] of Object.entries(CFG.seed)) DB[k] = v;   // boot({ seed }) ใส่โหนดเริ่มต้นเพิ่ม (เช่น evo)
const L = []; const SV = { __sv: 1 };
const norm = (p) => String(p || "").split("/").filter(Boolean).join("/");
const getAt = (p) => { let c = DB; for (const k of norm(p).split("/").filter(Boolean)) { if (c == null || typeof c !== "object") return null; c = c[k]; } return c === undefined ? null : c; };
const setAt = (p, v) => { const ks = norm(p).split("/").filter(Boolean); if (!ks.length) return; let c = DB; for (let i = 0; i < ks.length - 1; i++) { if (c[ks[i]] == null || typeof c[ks[i]] !== "object") c[ks[i]] = {}; c = c[ks[i]]; } if (v === null || v === undefined) delete c[ks[ks.length - 1]]; else c[ks[ks.length - 1]] = fix(v); };
const fix = (v) => v && v.__sv ? Date.now() : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
const snap = (p) => { const v = getAt(p), ks = norm(p).split("/"); const s = { key: ks[ks.length - 1] || null, val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v ?? null))), exists: () => v !== null && v !== undefined, hasChild: (k) => !!v && typeof v === "object" && k in v, numChildren: () => (v && typeof v === "object" ? Object.keys(v).length : 0), child: (k) => snap(norm(p) + "/" + k), forEach: (cb) => { if (v && typeof v === "object") for (const k of Object.keys(v)) if (cb(snap(norm(p) + "/" + k)) === true) break; }, hasChildren: () => !!v && typeof v === "object" && Object.keys(v).length > 0 }; return s; };
const rel = (a, b) => a === b || a.startsWith(b + "/") || b.startsWith(a + "/") || a === "" || b === "";
const fire = (changed) => { for (const l of L) if (rel(l.p, changed)) { try { l.cb(snap(l.p)); } catch (e) { console.error("listener error", l.p, e && e.stack || e); } } };
export const getDatabase = () => ({ __db: 1 });
export const ref = (db, p) => ({ path: norm(p), key: norm(p).split("/").pop(), parent: null, toString() { return this.path; } });
export const get = async (r) => snap(r.path);
export const set = async (r, v) => { setAt(r.path, v); fire(r.path); };
export const update = async (r, o) => { for (const [k, v] of Object.entries(o)) { setAt(norm(r.path + "/" + k), v); } for (const k of Object.keys(o)) fire(norm(r.path + "/" + k)); };
export const push = (r, v) => { const k = "k" + Math.random().toString(36).slice(2, 9); const nr = ref(null, norm(r.path + "/" + k)); if (v !== undefined) set(nr, v); return nr; };
export const remove = async (r) => { setAt(r.path, null); fire(r.path); };
export const onValue = (r, cb, err) => { const l = { p: r.path, cb }; L.push(l); setTimeout(() => { try { cb(snap(r.path)); } catch (e) { console.error("onValue cb error", r.path, e && e.stack || e); } }, 0); return () => { const i = L.indexOf(l); if (i >= 0) L.splice(i, 1); }; };
export const onChildAdded = (r, cb) => { setTimeout(() => { const v = getAt(r.path); if (v && typeof v === "object") for (const k of Object.keys(v)) try { cb(snap(norm(r.path + "/" + k))); } catch (e) { console.error("childAdded cb error", e && e.stack || e); } }, 0); return () => {}; };
export const onChildRemoved = () => () => {};
export const onDisconnect = () => ({ remove() { return Promise.resolve(); }, set() { return Promise.resolve(); }, cancel() { return Promise.resolve(); } });
export const query = (r) => r; export const orderByKey = () => ({}); export const limitToLast = () => ({});
export const runTransaction = async (r, fn) => { const cur = getAt(r.path); const nv = fn(cur === null ? null : JSON.parse(JSON.stringify(cur))); if (nv !== undefined) { setAt(r.path, nv); fire(r.path); } return { committed: nv !== undefined, snapshot: snap(r.path) }; };
export const serverTimestamp = () => SV;
`;
const AUTH = `export const getAuth = () => ({ currentUser: { uid: "u1" } }); export const onAuthStateChanged = (a, cb) => { setTimeout(() => cb({ uid: "u1" }), 30); return () => {}; }; export const createUserWithEmailAndPassword = async () => ({}); export const signInWithEmailAndPassword = async () => ({}); export const signOut = async () => { console.error("SIGNOUT CALLED"); }; export const deleteUser = async () => {};`;
const APP = `export const initializeApp = () => ({});`;
const FN = `export const getFunctions = () => ({}); export const httpsCallable = (f, name) => async (d) => { window.__calls = (window.__calls || []); window.__calls.push(name + ":" + (d && d.a)); if (window.__FNRES && window.__FNRES[name]) return { data: await window.__FNRES[name](d) }; return { data: { ok: true, perks: [], steps: [], list: [], items: [] } }; };`;
const ST = `export const getStorage = () => ({}); export const ref = () => ({}); export const uploadBytes = async () => ({}); export const getDownloadURL = async () => "";`;

async function boot(o = {}) {
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] }); const errs = [];
  const ctx = await br.newContext({ viewport: o.viewport || { width: 360, height: 780 }, isMobile: !o.desktop, hasTouch: !o.desktop }); const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push("PAGEERROR " + String(e && e.stack || e).split("\n").slice(0, 4).join(" | "))); pg.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE " + m.text().slice(0, 300)); });
  await pg.addInitScript((cfg) => { window.__CFG = cfg; }, { faction: o.faction || "human", role: o.role || "player", createdAt: o.createdAt === "now" ? "now" : (o.createdAt ?? null), inventory: o.inventory || null, seed: o.seed || null });
  await pg.route("**/*", async (r) => {
    const u = r.request().url();
    if (u.includes("gstatic.com/firebasejs")) { const body = u.includes("firebase-database") ? DBJS : u.includes("firebase-auth") ? AUTH : u.includes("firebase-app") ? APP : u.includes("firebase-functions") ? FN : ST; return r.fulfill({ contentType: "application/javascript", body }); }
    if (u.startsWith("http://game.test/")) { const f = path.join(ROOT, new URL(u).pathname.replace(/^\//, "") || "index.html"); if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ path: f, contentType: f.endsWith(".js") ? "application/javascript" : f.endsWith(".json") ? "application/json" : f.endsWith(".css") ? "text/css" : f.endsWith(".html") ? "text/html" : undefined }); return r.fulfill({ status: 404, body: "" }); }
    return r.abort();
  });
  await pg.goto("http://game.test/index.html");
  return { pg, br, errs };
}
module.exports = { boot };
