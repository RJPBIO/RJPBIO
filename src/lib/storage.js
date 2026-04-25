/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Storage Layer
   IndexedDB primario + cifrado AES-GCM + fallback localStorage
   Outbox para background sync · Migraciones con versión
   ═══════════════════════════════════════════════════════════════ */

const DB_NAME = "bio-ignicion";
const DB_VERSION = 2;
const STORE_STATE = "state";
const STORE_OUTBOX = "outbox";
const STORE_META = "meta";
const STATE_KEY = "app";
const CRYPTO_KEY_NAME = "bio-crypto-key";

const isBrowser = () => typeof window !== "undefined";
const hasIDB = () => isBrowser() && "indexedDB" in window;
const hasCrypto = () => isBrowser() && window.crypto?.subtle;

// ─── IndexedDB primitives ────────────────────────────────
// Safari iOS (modo privado / Home Screen PWA) a veces deja open() en pending
// sin disparar onsuccess/onerror. Timeout duro evita que toda la app se cuelgue.
function openDB() {
  return new Promise((resolve, reject) => {
    if (!hasIDB()) return reject(new Error("IndexedDB not available"));
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("IndexedDB open timeout"));
    }, 1500);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE);
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) db.createObjectStore(STORE_OUTBOX, { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => {
      if (settled) { try { req.result.close(); } catch {} return; }
      settled = true; clearTimeout(timer); resolve(req.result);
    };
    req.onerror = () => {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(req.error);
    };
    req.onblocked = () => {
      if (settled) return;
      settled = true; clearTimeout(timer); reject(new Error("IndexedDB blocked"));
    };
  });
}

async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const r = tx.objectStore(store).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function idbSet(store, key, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    const r = key === undefined ? os.add(value) : os.put(value, key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const r = tx.objectStore(store).getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    const r = tx.objectStore(store).delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

// ─── Crypto (AES-GCM 256) ────────────────────────────────
async function getKey() {
  if (!hasCrypto()) return null;
  try {
    const existing = await idbGet(STORE_META, CRYPTO_KEY_NAME);
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await idbSet(STORE_META, CRYPTO_KEY_NAME, key);
    return key;
  } catch { return null; }
}

async function encrypt(data) {
  const key = await getKey();
  const plain = new TextEncoder().encode(JSON.stringify(data));
  if (!key) return { encoded: false, data: plain };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return { encoded: true, iv, data: new Uint8Array(ct) };
}

async function decrypt(blob) {
  if (!blob) return null;
  if (!blob.encoded) return JSON.parse(new TextDecoder().decode(blob.data));
  const key = await getKey();
  if (!key) return null;
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: blob.iv }, key, blob.data);
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}

// ─── Public API ──────────────────────────────────────────
export async function loadState() {
  if (!isBrowser()) return null;
  try {
    if (hasIDB()) {
      const blob = await idbGet(STORE_STATE, STATE_KEY);
      const decoded = await decrypt(blob);
      if (decoded) return decoded;
    }
  } catch {}
  try {
    const raw = localStorage.getItem("bio-g2");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveState(state) {
  if (!isBrowser()) return;
  try {
    if (hasIDB()) {
      const blob = await encrypt(state);
      await idbSet(STORE_STATE, STATE_KEY, blob);
    }
  } catch {}
  try { localStorage.setItem("bio-g2", JSON.stringify(state)); } catch {}
}

export async function clearAll() {
  if (!isBrowser()) return;
  try { if (hasIDB()) await idbDelete(STORE_STATE, STATE_KEY); } catch {}
  try { localStorage.removeItem("bio-g2"); } catch {}
  // El sync-token está ligado al usuario previo: si se queda, el próximo
  // login puede mergear estado remoto ajeno. Lo eliminamos siempre.
  try { localStorage.removeItem("bio-sync-token"); } catch {}
}

// ─── Outbox (offline queue para sync) ───────────────────
// Event bus: dispatch "bio-outbox-changed" después de cada add para
// que sync.js dispare drain debounced sin crear circular dep
// (storage no importa sync).
export async function outboxAdd(entry) {
  if (!hasIDB()) return null;
  const stored = await idbSet(STORE_OUTBOX, undefined, { ...entry, ts: Date.now() });
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bio-outbox-changed", { detail: { kind: entry?.kind } }));
    }
  } catch {}
  return stored;
}

export async function outboxAll() {
  if (!hasIDB()) return [];
  return idbGetAll(STORE_OUTBOX);
}

export async function outboxRemove(id) {
  if (!hasIDB()) return;
  return idbDelete(STORE_OUTBOX, id);
}

// ─── Export firmado (GDPR) ──────────────────────────────
export async function exportSigned(state) {
  const payload = { app: "bio-ignicion", version: 1, exportedAt: new Date().toISOString(), data: state };
  const text = JSON.stringify(payload);
  if (!hasCrypto()) return { payload: text, signature: null };
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const sig = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { payload: text, signature: sig };
}
