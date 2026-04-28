/* ═══════════════════════════════════════════════════════════════
   SYNC NEURAL-STATE MERGE — Sprint 90

   Antes (bug #1 round 2): /api/sync/outbox sobrescribía
   `user.neuralState` con el incoming JSON completo. Last-writer-wins
   entre devices → user en phone agrega HRV #101, sync; user en laptop
   (con neuralState pre-#101 cacheado) agrega HRV #102, sync → server
   sobrescribe → #101 desaparece.

   Esta función mergea correctamente:
     · TS_LOGS: arrays append-only de objetos con `ts` numeric.
       Merge por ts con dedupe (en colisión, prevalece el client —
       asumimos que el cliente vio última edición de derived fields).
     · MAX_COUNTERS: contadores monotónicos (totalSessions, vCores,
       bestStreak, totalTime). MAX entre server y client.
     · SET_UNIONS: arrays de strings sin orden (achievements, favs).
       Union ignorando duplicados.
     · CAPS: cada log se limita a su cap histórico (mismo que client
       aplica via .slice(-N) en useStore.js — replica server-side
       para no rebasar MAX_NEURAL_STATE_BYTES tras merge).
     · Resto: spread del client (last-writer-wins para state derivado
       como streak, lastDate, coherencia, settings, activeProgram).

   Trade-off conocido (no fix en este sprint):
     · banditArms es objeto con drift cross-device. Sin merge.
     · Counters como streak/lastDate/todaySessions son derivables
       desde history pero no recomputamos server-side. Last-writer
       puede dejar valores inconsistentes con history merged. Cliente
       reconcilia en próxima sesión via _computeStreakUpdate.
   ═══════════════════════════════════════════════════════════════ */

// Logs append-only con campo `ts` numérico para dedup
const TS_LOGS = [
  "history",
  "moodLog",
  "hrvLog",
  "rhrLog",
  "breathTechniqueLog",
  "cognitiveLog",
  "instruments",
  "nom035Results",
  "calibrationHistory",
];

// programHistory tiene `startedAt` (no `ts`); lo mergeamos por startedAt
const PROGRAM_HISTORY_KEY = "programHistory";

// Contadores monotónicos (siempre crecen). MAX entre server y client.
const MAX_COUNTERS = ["totalSessions", "vCores", "bestStreak", "totalTime"];

// Arrays de strings (sets sin orden)
const SET_UNIONS = ["achievements", "favs"];

// Caps históricos — replica de los .slice(-N) en useStore.js
const CAPS = {
  history: 1000,
  moodLog: 200,
  hrvLog: 365,
  rhrLog: 365,
  breathTechniqueLog: 500,
  cognitiveLog: 200,
  instruments: 200,
  nom035Results: 20,
  calibrationHistory: 10,
  programHistory: 50,
};

function mergeByKey(serverArr, clientArr, keyFn) {
  const a = Array.isArray(serverArr) ? serverArr : [];
  const b = Array.isArray(clientArr) ? clientArr : [];
  if (!a.length) return b.slice();
  if (!b.length) return a.slice();
  const map = new Map();
  for (const e of a) {
    const k = keyFn(e);
    if (k != null) map.set(k, e);
  }
  // Client gana en colisión — refleja edición más reciente de fields derivados
  for (const e of b) {
    const k = keyFn(e);
    if (k != null) map.set(k, e);
  }
  return Array.from(map.values()).sort((x, y) => {
    const kx = keyFn(x);
    const ky = keyFn(y);
    return (typeof kx === "number" ? kx : 0) - (typeof ky === "number" ? ky : 0);
  });
}

function mergeByTs(serverArr, clientArr) {
  return mergeByKey(serverArr, clientArr, (e) => (e && typeof e.ts === "number" ? e.ts : null));
}

function mergeProgramHistory(serverArr, clientArr) {
  // programHistory entries tienen startedAt como key estable
  return mergeByKey(serverArr, clientArr, (e) => (e && typeof e.startedAt === "number" ? e.startedAt : null));
}

function mergeUnion(serverArr, clientArr) {
  const a = Array.isArray(serverArr) ? serverArr : [];
  const b = Array.isArray(clientArr) ? clientArr : [];
  if (!a.length && !b.length) return [];
  return Array.from(new Set([...a, ...b]));
}

function maxNum(s, c) {
  const sv = typeof s === "number" && Number.isFinite(s) ? s : 0;
  const cv = typeof c === "number" && Number.isFinite(c) ? c : 0;
  return Math.max(sv, cv);
}

export function mergeNeuralState(serverState, clientState) {
  // Edge cases: uno o ambos vacíos
  if (!serverState || typeof serverState !== "object") return clientState ?? null;
  if (!clientState || typeof clientState !== "object") return serverState;

  // Base: client gana para todos los fields no especiales
  const merged = { ...serverState, ...clientState };

  // Append-only logs por ts
  for (const k of TS_LOGS) {
    const out = mergeByTs(serverState[k], clientState[k]);
    const cap = CAPS[k];
    merged[k] = cap ? out.slice(-cap) : out;
  }

  // programHistory por startedAt
  const ph = mergeProgramHistory(serverState[PROGRAM_HISTORY_KEY], clientState[PROGRAM_HISTORY_KEY]);
  merged[PROGRAM_HISTORY_KEY] = ph.slice(-CAPS[PROGRAM_HISTORY_KEY]);

  // Counters monotónicos
  for (const k of MAX_COUNTERS) {
    merged[k] = maxNum(serverState[k], clientState[k]);
  }

  // Set unions (achievements, favs)
  for (const k of SET_UNIONS) {
    merged[k] = mergeUnion(serverState[k], clientState[k]);
  }

  // predictionResiduals.history (nested array de residuales con ts)
  const sRes = serverState.predictionResiduals;
  const cRes = clientState.predictionResiduals;
  if ((sRes && typeof sRes === "object") || (cRes && typeof cRes === "object")) {
    merged.predictionResiduals = {
      ...(sRes || {}),
      ...(cRes || {}),
      history: mergeByTs(sRes?.history, cRes?.history).slice(-100),
    };
  }

  return merged;
}
