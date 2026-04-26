/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Sync (PWA local-first ↔ backend Prisma)
   ═══════════════════════════════════════════════════════════════
   Capa que conecta el IndexedDB local al backend Prisma multi-tenant.
   El PWA es local-first: IndexedDB es source of truth en el cliente.
   El backend es backup + multi-device + agregación + B2B analytics.

   Endpoints (session-cookie + CSRF, same-origin):
     · GET  /api/sync/state   → hydrate al login + multi-device pull
     · POST /api/sync/outbox  → drain entries pending + push neuralState

   Estrategia merge: last-write-wins por timestamp para campos
   acumulativos (history, moodLog), MAX para counters (streak, vCores),
   union para sets (achievements). Server data nunca pisa local sin
   merge — el local es siempre el más reciente para sesión activa.

   Concurrency: single-flight lock en flushOutbox. Backoff exponencial.
   ═══════════════════════════════════════════════════════════════ */

import { outboxAll, outboxRemove, saveState, loadState } from "./storage";
import { logger } from "./logger";

const CSRF_COOKIE = "bio-csrf";
const CSRF_HEADER = "x-csrf-token";
const CLIENT_VERSION_HEADER = "x-client-version";
// CLIENT_VERSION se hornea via env var en build, fallback a fixed string.
// El server lo registra en NeuralSession.clientVersion + audit log para
// debugging cross-device (saber qué versión escribió qué fila).
const CLIENT_VERSION =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_VERSION) || "pwa";

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function syncHeaders() {
  const token = readCookie(CSRF_COOKIE);
  const out = { [CLIENT_VERSION_HEADER]: CLIENT_VERSION };
  if (token) out[CSRF_HEADER] = token;
  return out;
}

// ─── Drain lock — single-flight ───────────────────────────────
// Evita drains paralelos que dupliquen escrituras o thrasheen DB.
let _drainInflight = null;

export async function flushOutbox({ currentUserId = null } = {}) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { skipped: true, reason: "offline", sent: 0, dropped: 0 };
  }
  if (_drainInflight) return _drainInflight;

  _drainInflight = (async () => {
    try {
      const entries = await outboxAll();

      // Identity binding: descartar entries de otro user (login anterior
      // en este browser que no se limpió). No filtramos datos cruzados.
      const filtered = [];
      let dropped = 0;
      for (const entry of entries) {
        const entryUid = entry.userId ?? null;
        if (entryUid !== null && currentUserId !== null && entryUid !== currentUserId) {
          await outboxRemove(entry.id).catch(() => {});
          dropped += 1;
          continue;
        }
        filtered.push(entry);
      }

      // Snapshot del state actual para mergear server-side
      let neuralState = null;
      try {
        neuralState = await loadState();
        // Si el state pertenece a otro user (race condition), no enviar
        if (neuralState?._userId && currentUserId && neuralState._userId !== currentUserId) {
          neuralState = null;
        }
      } catch { neuralState = null; }

      if (filtered.length === 0 && !neuralState) {
        return { sent: 0, dropped, skipped: true, reason: "nothing_to_sync" };
      }

      const res = await fetch("/api/sync/outbox", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...syncHeaders() },
        body: JSON.stringify({ entries: filtered, neuralState }),
      });

      if (res.status === 401) {
        return { sent: 0, dropped, skipped: true, reason: "unauthenticated" };
      }
      if (!res.ok) {
        logger.warn("sync.flush.http", { status: res.status });
        return { sent: 0, dropped, error: `http_${res.status}` };
      }

      const data = await res.json().catch(() => ({}));
      const syncedIds = Array.isArray(data?.synced) ? data.synced : [];
      for (const id of syncedIds) {
        await outboxRemove(id).catch(() => {});
      }
      return {
        sent: syncedIds.length,
        dropped,
        failed: Array.isArray(data?.failed) ? data.failed.length : 0,
        lastSyncedAt: data?.lastSyncedAt || null,
      };
    } catch (e) {
      logger.warn("sync.flush.exception", { err: String(e) });
      return { sent: 0, dropped: 0, error: "network" };
    } finally {
      _drainInflight = null;
    }
  })();
  return _drainInflight;
}

// ─── Hydrate from server (login + multi-device) ───────────────
export async function pullRemote({ currentUserId = null } = {}) {
  try {
    const res = await fetch("/api/sync/state", {
      method: "GET",
      credentials: "same-origin",
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await res.json();

    // Billing summary se publica vía custom event para que componentes
    // que NO viven en el store (BillingBanner, FeatureGate) puedan
    // suscribirse sin pedir un fetch extra. Always dispatched, incluso
    // si neuralState es null (usuario nuevo sin data).
    if (typeof window !== "undefined" && data?.billing) {
      try {
        window.dispatchEvent(new CustomEvent("bio-billing-update", { detail: data.billing }));
        window.__bioBilling = data.billing; // snapshot para late-mounters
      } catch {}
    }

    if (!data?.neuralState) return null;
    const remote = data.neuralState;

    // Identity binding: rechazar state ajeno (token stale)
    const remoteUid = remote?._userId ?? null;
    if (remoteUid !== null && currentUserId !== null && remoteUid !== currentUserId) {
      logger.warn("sync.pull.mismatch", { expected: currentUserId, got: remoteUid });
      return null;
    }

    const local = await loadState();
    const merged = mergeStates(local, remote);
    if (currentUserId) merged._userId = currentUserId;
    await saveState(merged);
    return merged;
  } catch (e) {
    logger.warn("sync.pull.exception", { err: String(e) });
    return null;
  }
}

// ─── State merging — last-write-wins + max + union ────────────
// Exportado para testing. La merge strategy es:
//   · Counters (totalSessions, vCores, streak): MAX (nunca decremento)
//   · Listas (history, moodLog): dedupe por ts, cap recencia
//   · Sets (achievements, unlockedSS): union
//   · Picks por timestamp (neuralBaseline)
//   · Resto: local wins (más fresco para sesión activa)
export function mergeStates(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  const pick = (a, b) => ((a?.ts || 0) > (b?.ts || 0) ? a : b);
  return {
    ...remote,
    ...local, // local wins por defecto (más reciente para esta sesión)
    // Counters → MAX (nunca decremento)
    totalSessions: Math.max(local.totalSessions || 0, remote.totalSessions || 0),
    totalTime: Math.max(local.totalTime || 0, remote.totalTime || 0),
    streak: Math.max(local.streak || 0, remote.streak || 0),
    bestStreak: Math.max(local.bestStreak || 0, remote.bestStreak || 0),
    vCores: Math.max(local.vCores || 0, remote.vCores || 0),
    // Listas → dedupe por ts, cap recencia
    history: dedupe([...(local.history || []), ...(remote.history || [])], "ts").slice(-500),
    moodLog: dedupe([...(local.moodLog || []), ...(remote.moodLog || [])], "ts").slice(-500),
    hrvLog: dedupe([...(local.hrvLog || []), ...(remote.hrvLog || [])], "ts").slice(-200),
    rhrLog: dedupe([...(local.rhrLog || []), ...(remote.rhrLog || [])], "ts").slice(-200),
    instruments: dedupe([...(local.instruments || []), ...(remote.instruments || [])], "ts").slice(-100),
    nom035Results: dedupe([...(local.nom035Results || []), ...(remote.nom035Results || [])], "ts").slice(-50),
    // Sets → union
    achievements: Array.from(new Set([...(local.achievements || []), ...(remote.achievements || [])])),
    unlockedSS: Array.from(new Set([...(local.unlockedSS || ["off"]), ...(remote.unlockedSS || ["off"])])),
    // Picks por timestamp
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

// ─── Backoff exponencial — reintento de drain fallido ─────────
const BACKOFF_STEPS = [1000, 2000, 5000, 10000, 30000, 60000];
let _backoffIdx = 0;
let _backoffTimer = null;

export function scheduleBackoffDrain(getCurrentUserId) {
  if (_backoffTimer) return;
  const delay = BACKOFF_STEPS[Math.min(_backoffIdx, BACKOFF_STEPS.length - 1)];
  _backoffTimer = setTimeout(async () => {
    _backoffTimer = null;
    const result = await flushOutbox({
      currentUserId: getCurrentUserId?.() ?? null,
    });
    if (result.sent > 0 || result.skipped) {
      _backoffIdx = 0; // reset on success or auth-skip
    } else if (result.error) {
      _backoffIdx += 1;
      scheduleBackoffDrain(getCurrentUserId);
    }
  }, delay);
}

export function resetBackoff() {
  _backoffIdx = 0;
  if (_backoffTimer) {
    clearTimeout(_backoffTimer);
    _backoffTimer = null;
  }
}

// ─── Debounced trigger — llamar después de outboxAdd ───────────
let _debounceTimer = null;
export function triggerDrain(getCurrentUserId, delayMs = 800) {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(async () => {
    _debounceTimer = null;
    const result = await flushOutbox({
      currentUserId: getCurrentUserId?.() ?? null,
    });
    if (result.error && !result.skipped) {
      scheduleBackoffDrain(getCurrentUserId);
    }
  }, delayMs);
}

// ─── Background sync wiring (online + visibility + outbox events + SW) ──
export function wireBackgroundSync({ getCurrentUserId } = {}) {
  if (typeof navigator === "undefined") return;
  const flush = () =>
    flushOutbox({ currentUserId: getCurrentUserId?.() ?? null }).catch(() => {});
  // Online — vuelta a red dispara drain inmediato
  window.addEventListener("online", flush);
  // Visibility — abrir tab dispara drain (catch-up tras background)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flush();
  });
  // Outbox event bus — storage.outboxAdd dispatcha "bio-outbox-changed"
  // tras cada IndexedDB write. Drain debounced 800ms para batch.
  window.addEventListener("bio-outbox-changed", () => {
    triggerDrain(getCurrentUserId);
  });
  // Service worker — periodic sync registration (Chrome only, requires
  // PWA installed). Best-effort; failures silenciosos.
  navigator.serviceWorker?.addEventListener?.("message", (e) => {
    if (e.data?.type === "SYNC_FLUSH") flush();
  });
  navigator.serviceWorker?.ready?.then(async (reg) => {
    try { await reg.sync?.register("bio-sync-outbox"); } catch {}
    try {
      await reg.periodicSync?.register?.("bio-sync-outbox", {
        minInterval: 6 * 60 * 60 * 1000,
      });
    } catch {}
  });
}

// ─── Legacy compatibility (token-based external sync) ─────────
// Deprecated: el sync ahora usa session cookies. Estas funciones
// quedan como no-ops para no romper imports en migration.
export function setToken() { /* no-op: session cookies ahora */ }
