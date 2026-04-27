/* ═══════════════════════════════════════════════════════════════
   SESSION DELTA — evidencia objetiva post-sesión (HRV + mood)
   ───────────────────────────────────────────────────────────────
   Compone una "carta de evidencia" para el cierre de sesión a
   partir de las señales que YA capturamos:
     · HRV pre/post emparejado por proximidad temporal
     · MDC95-gated: solo reporta como verificado lo que supera
       el mínimo detectable de cambio personal del usuario.
     · Mood pre/post (subjetivo, no se reporta como verificado).

   Filosofía operativa BIO-IGNICIÓN:
     - Verificable > sentido.
     - No se reporta cambio que no supere el ruido.
     - "Sin datos" es honesto, no negativo.

   Uso (cliente):
     buildSessionDelta({
       sessionStartedAt, sessionEndedAt, hrvLog,
       preMood, postMood, durationSec,
     })

   Salida pura — sin side-effects, sin acceso a store.
   ═══════════════════════════════════════════════════════════════ */

import { computeHrvDelta } from "./hrvDelta";

const HRV_PAIR_WINDOW_MS = 15 * 60 * 1000; // 15 min
const HRV_HISTORY_FOR_MDC = 7;             // mínimo para MDC95
const HRV_HISTORY_LOOKBACK = 60;           // últimos 60 lecturas para baseline

/**
 * Encuentra la lectura HRV más reciente dentro de [t-window, t].
 */
function findReadingBefore(entries, t, windowMs) {
  let best = null;
  for (const e of entries) {
    if (!e || typeof e.ts !== "number") continue;
    if (e.ts > t) continue;
    if (t - e.ts > windowMs) continue;
    if (!best || e.ts > best.ts) best = e;
  }
  return best;
}

/**
 * Encuentra la lectura HRV más cercana a t hacia adelante, dentro
 * de [t, t+window].
 */
function findReadingAfter(entries, t, windowMs) {
  let best = null;
  for (const e of entries) {
    if (!e || typeof e.ts !== "number") continue;
    if (e.ts < t) continue;
    if (e.ts - t > windowMs) continue;
    if (!best || e.ts < best.ts) best = e;
  }
  return best;
}

function normalizeReading(r) {
  if (!r || typeof r.rmssd !== "number") return null;
  if (r.valid === false) return null;
  return {
    rmssd: r.rmssd,
    lnRmssd: typeof r.lnRmssd === "number" ? r.lnRmssd : (r.rmssd > 0 ? Math.log(r.rmssd) : 0),
    valid: true,
    ts: r.ts,
  };
}

/**
 * Construye el payload de evidencia para una sesión que acaba de
 * cerrarse.
 *
 * @param {object} args
 * @param {number} args.sessionStartedAt   Epoch ms del inicio
 * @param {number} args.sessionEndedAt     Epoch ms del cierre
 * @param {Array}  args.hrvLog             Log local del usuario
 * @param {number} [args.preMood]          1-5
 * @param {number} [args.postMood]         1-5
 * @param {number} [args.durationSec]      Duración del protocolo
 * @returns {{
 *   evidenceLevel: "verified" | "subjective" | "time-only",
 *   hrv: null | {
 *     deltaRmssd: number, classification: string,
 *     significant: boolean | null, mdc95: number | null,
 *     relativeChange: number, preTs: number, postTs: number,
 *   },
 *   mood: null | { delta: number, pre: number, post: number },
 *   durationSec: number,
 * }}
 */
export function buildSessionDelta({
  sessionStartedAt,
  sessionEndedAt,
  hrvLog,
  preMood,
  postMood,
  durationSec = 0,
} = {}) {
  const entries = Array.isArray(hrvLog) ? hrvLog : [];
  let hrv = null;

  if (
    typeof sessionStartedAt === "number" &&
    typeof sessionEndedAt === "number" &&
    sessionEndedAt > sessionStartedAt &&
    entries.length > 0
  ) {
    const preRaw = findReadingBefore(entries, sessionStartedAt, HRV_PAIR_WINDOW_MS);
    const postRaw = findReadingAfter(entries, sessionEndedAt, HRV_PAIR_WINDOW_MS);
    const pre = normalizeReading(preRaw);
    const post = normalizeReading(postRaw);
    if (pre && post && post.ts !== pre.ts) {
      // Historial para MDC95: lecturas previas al inicio, hasta N atrás.
      const history = entries
        .filter((e) => e && typeof e.ts === "number" && e.ts < sessionStartedAt && typeof e.rmssd === "number")
        .sort((a, b) => b.ts - a.ts)
        .slice(0, HRV_HISTORY_LOOKBACK)
        .map((e) => e.rmssd);
      const enoughHistory = history.length >= HRV_HISTORY_FOR_MDC;
      const delta = computeHrvDelta(pre, post, enoughHistory ? history : []);
      if (delta) {
        hrv = {
          deltaRmssd: delta.deltaRmssd,
          deltaLnRmssd: delta.deltaLnRmssd,
          relativeChange: delta.relativeChange,
          mdc95: delta.mdc95,
          significant: delta.significant,
          classification: delta.classification,
          preTs: pre.ts,
          postTs: post.ts,
        };
      }
    }
  }

  let mood = null;
  if (
    typeof preMood === "number" && preMood >= 1 && preMood <= 5 &&
    typeof postMood === "number" && postMood >= 1 && postMood <= 5
  ) {
    mood = { pre: preMood, post: postMood, delta: postMood - preMood };
  }

  // Nivel de evidencia: HRV verificada > mood subjetivo > solo tiempo.
  let evidenceLevel = "time-only";
  if (hrv && hrv.significant === true) {
    evidenceLevel = "verified";
  } else if (mood) {
    evidenceLevel = "subjective";
  } else if (hrv) {
    // HRV sin MDC95 confirmado todavía: lo tratamos como subjective-equivalent
    // — mostramos el dato pero NO como "verificado".
    evidenceLevel = "subjective";
  }

  return {
    evidenceLevel,
    hrv,
    mood,
    durationSec: Math.max(0, Math.floor(Number(durationSec) || 0)),
  };
}

/**
 * Devuelve copy localizable para el card de evidencia.
 * Cliente del UI lo consume y mapea a strings i18n.
 */
export function deltaDisplay(delta) {
  if (!delta) return null;
  const { evidenceLevel, hrv } = delta;
  if (evidenceLevel === "verified" && hrv) {
    if (hrv.classification === "vagal-lift") {
      return { tone: "uplift", key: "session.delta.verifiedUplift", value: hrv.deltaRmssd };
    }
    if (hrv.classification === "vagal-suppression") {
      return { tone: "drop", key: "session.delta.verifiedDrop", value: hrv.deltaRmssd };
    }
  }
  if (hrv && hrv.classification === "no-change") {
    return { tone: "steady", key: "session.delta.steady", value: hrv.deltaRmssd };
  }
  if (hrv && hrv.classification === "unverified") {
    return { tone: "subjective", key: "session.delta.unverifiedHrv", value: hrv.deltaRmssd };
  }
  if (delta.mood) {
    return { tone: "subjective", key: "session.delta.moodOnly", value: delta.mood.delta };
  }
  return { tone: "neutral", key: "session.delta.timeOnly", value: delta.durationSec };
}

/**
 * Construye payload listo para outbox (kind:"session").
 * Solo expone campos que el outbox API valida; preserva privacidad.
 */
export function buildSessionOutboxPayload({
  protocolId,
  durationSec,
  delta,
  preMood,
  postMood,
  completedAt = Date.now(),
}) {
  // coherenciaDelta: usamos lnRmssd cuando hay verified vagal-lift/suppression.
  // Es la métrica de coherencia derivada de HRV; mantiene compatibilidad con
  // schema actual (Float?). Si no es verificado → null para no contaminar.
  let coherenciaDelta = null;
  if (delta && delta.hrv && delta.hrv.significant === true) {
    coherenciaDelta = delta.hrv.deltaLnRmssd;
  }
  // protocolId acepta string o number (los protocols built-in usan ids
  // numéricos). El outbox API hace String(p.protocolId).slice(0, 64).
  let pid = null;
  if (typeof protocolId === "string" && protocolId.length > 0) pid = protocolId;
  else if (typeof protocolId === "number" && Number.isFinite(protocolId)) pid = String(protocolId);
  return {
    protocolId: pid,
    durationSec: Math.max(0, Math.min(7200, Number(durationSec) || 0)),
    coherenciaDelta,
    moodPre: typeof preMood === "number" && preMood >= 1 && preMood <= 5 ? preMood : null,
    moodPost: typeof postMood === "number" && postMood >= 1 && postMood <= 5 ? postMood : null,
    completedAt: typeof completedAt === "number"
      ? new Date(completedAt).toISOString()
      : new Date().toISOString(),
  };
}
