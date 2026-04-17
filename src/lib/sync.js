/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Sync Adapter
   Abstrae el backend (Supabase/Firebase/self-hosted).
   Flush de outbox con backoff exponencial y merge idempotente.
   ═══════════════════════════════════════════════════════════════ */

import { outboxAll, outboxRemove, saveState, loadState } from "./storage";
import { logger } from "./logger";

const ENDPOINT = process.env.NEXT_PUBLIC_SYNC_ENDPOINT;
const TOKEN_KEY = "bio-sync-token";
const MAX_ATTEMPTS = 5;

function getToken() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(t) {
  if (typeof window === "undefined") return;
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {}
}

async function post(path, body) {
  if (!ENDPOINT) throw new Error("SYNC_ENDPOINT not configured");
  const token = getToken();
  const r = await fetch(`${ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`sync ${path} ${r.status}`);
  return r.json().catch(() => ({}));
}

export async function flushOutbox() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { skipped: true };
  const entries = await outboxAll();
  if (!entries.length) return { sent: 0 };
  let sent = 0;
  for (const entry of entries) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        if (ENDPOINT) await post("/events", entry);
        await outboxRemove(entry.id);
        sent += 1;
        break;
      } catch (e) {
        const delay = 250 * 2 ** attempt + Math.random() * 200;
        logger.warn("sync.retry", { attempt, err: String(e) });
        await new Promise((r) => setTimeout(r, delay));
        if (attempt === MAX_ATTEMPTS - 1) logger.error("sync.drop", { id: entry.id });
      }
    }
  }
  return { sent };
}

export async function pullRemote() {
  if (!ENDPOINT) return null;
  try {
    const r = await post("/pull", { since: 0 });
    if (r?.state) {
      const local = await loadState();
      const merged = mergeStates(local, r.state);
      await saveState(merged);
      return merged;
    }
  } catch (e) { logger.warn("sync.pull", e); }
  return null;
}

function mergeStates(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  const pick = (a, b) => ((a?.ts || 0) > (b?.ts || 0) ? a : b);
  return {
    ...local,
    ...remote,
    totalSessions: Math.max(local.totalSessions || 0, remote.totalSessions || 0),
    totalTime: Math.max(local.totalTime || 0, remote.totalTime || 0),
    streak: Math.max(local.streak || 0, remote.streak || 0),
    bestStreak: Math.max(local.bestStreak || 0, remote.bestStreak || 0),
    vCores: Math.max(local.vCores || 0, remote.vCores || 0),
    history: dedupe([...(local.history || []), ...(remote.history || [])], "ts").slice(-500),
    moodLog: dedupe([...(local.moodLog || []), ...(remote.moodLog || [])], "ts").slice(-500),
    achievements: Array.from(new Set([...(local.achievements || []), ...(remote.achievements || [])])),
    neuralBaseline: pick(local.neuralBaseline, remote.neuralBaseline),
  };
}

function dedupe(arr, key) {
  const seen = new Set();
  return arr.filter((x) => {
    const k = x?.[key];
    if (k === undefined || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function wireBackgroundSync() {
  if (typeof navigator === "undefined") return;
  window.addEventListener("online", () => flushOutbox().catch(() => {}));
  navigator.serviceWorker?.addEventListener?.("message", (e) => {
    if (e.data?.type === "SYNC_FLUSH") flushOutbox().catch(() => {});
  });
  navigator.serviceWorker?.ready?.then(async (reg) => {
    try { await reg.sync?.register("bio-sync-outbox"); } catch {}
    try { await reg.periodicSync?.register?.("bio-sync-outbox", { minInterval: 6 * 60 * 60 * 1000 }); } catch {}
  });
}
