/* ═══════════════════════════════════════════════════════════════
   BURNOUT ENHANCED — Phase 6F SP-E
   ───────────────────────────────────────────────────────────────
   Wellbeing trends · early-warning detection retrospectiva.

   IMPORTANTE — marketing copy reformulado (D8 NO psicólogo consultor):
     ❌ "burnout score"        → ✅ "wellbeing trends"
     ❌ "predicción"           → ✅ "early-warning detection"
     ❌ "diagnóstico"          → ✅ "indicador sugerente"
     ❌ "riesgo de burnout"    → ✅ "patrones consistentes con agotamiento"
     ✅ "Si estás en crisis: SAPTEL 800-290-0024"
     ✅ "Bio-Ignición no es dispositivo médico"

   Extiende src/lib/burnout.js (assessBurnout sessions-array based) con
   2 signals adicionales:
     1. freqDrop                   (existing) frecuencia sesiones declive
     2. moodSlope                  (existing) pre-mood trend negativo
     3. effDrop                    (existing) effectiveness declive
     4. hrvDecline      (NEW)      RMSSD recent 7d < baseline 28d × 0.80
     5. chronoDyssynchrony (NEW)   ≥7 sesiones consecutivas más recientes
                                   fuera del deep-work window del cronotipo

   Level by signal count:
     0 → "ok"     1 → "watch"     2 → "warn"     3+ → "alert"

   NO modifica burnout.js core (preserva tests existing).
   Decisión arquitectónica D6: heurística retrospectiva (no ML predictive).
   ═══════════════════════════════════════════════════════════════ */

import { assessBurnout, BURNOUT_DEFAULTS, BURNOUT_LEVELS } from "./burnout.js";
import { isInDeepWorkWindow } from "./chronotype.js";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

// Thresholds — alineados con BURNOUT_DEFAULTS (watch-level) para consistency
// con el engine base. "Watch level" = considerar señal activa.
export const ENHANCED_DEFAULTS = Object.freeze({
  // Signals 1-3 reuso watch thresholds de burnout.js (see freqDropWatch etc).
  // Signal 4 — HRV decline.
  hrvBaselineDays: 28,                  // ventana baseline rmssd (28d-7d)
  hrvRecentDays: 7,                     // ventana recent rmssd (last 7d)
  hrvDeclineThreshold: 0.20,            // recent < baseline × (1 - 0.20)
  hrvMinSamples: 3,                     // ≥3 mediciones requeridas en cada ventana
  // Signal 5 — Chronotype dyssynchrony.
  chronoDyssynchronySessions: 7,        // ≥7 sesiones consecutivas más recientes
                                        // fuera de deep-work window
});

// Disclaimer canónico — incluido en TODA respuesta del assessment.
// NO modificar el texto sin lawyer review (D8).
export const WELLBEING_DISCLAIMER =
  "Indicador sugerente de patrones consistentes con agotamiento. NO es " +
  "diagnóstico médico ni reemplaza atención profesional. Bio-Ignición no " +
  "es dispositivo médico. Si te encuentras en crisis: SAPTEL 800-290-0024 " +
  "(México).";

/**
 * Assessment enhanced del wellbeing user. Consume el snapshot canónico
 * de buildUserSnapshot (SP-A) y devuelve un assessment serializable con
 * level + signals + metrics + disclaimer.
 *
 * @param {object} snapshot — UserSnapshot (sessions+hrv+chronotype+...)
 * @param {object} [opts]   — overrides de thresholds (testing)
 * @returns {{level, signals, metrics, snapshot:{...}}}
 */
export function assessBurnoutEnhanced(snapshot, opts = {}) {
  const cfg = { ...BURNOUT_DEFAULTS, ...ENHANCED_DEFAULTS, ...opts };
  const now = opts.now ? new Date(opts.now).getTime() : Date.now();

  if (!snapshot || typeof snapshot !== "object") {
    return emptyAssessment(now, "no_snapshot");
  }

  const sessions = Array.isArray(snapshot.sessions) ? snapshot.sessions : [];
  const hrv = Array.isArray(snapshot.hrv) ? snapshot.hrv : [];
  const chronotype = snapshot.chronotype || null;

  // ── Map DB shape (moodPre/moodPost) → assessBurnout shape (pre/mood) ──
  // assessBurnout expects { completedAt, pre, mood, coherenciaDelta }.
  // El campo `coherenciaDelta` ya tiene el mismo nombre.
  const sessionsForBase = sessions.map((s) => ({
    completedAt: s.completedAt,
    pre: s.moodPre,
    mood: s.moodPost,
    coherenciaDelta: s.coherenciaDelta,
  }));

  // ── Signals 1-3 derivados de base assessment (metrics) ──
  const base = assessBurnout(sessionsForBase, { ...cfg, now });

  const signals = [];

  if (typeof base.metrics?.freqDrop === "number" && base.metrics.freqDrop >= cfg.freqDropWatch) {
    signals.push("freqDrop");
  }
  if (typeof base.metrics?.moodSlopePerWeek === "number" && base.metrics.moodSlopePerWeek <= cfg.moodSlopeWatch) {
    signals.push("moodSlope");
  }
  if (typeof base.metrics?.effectivenessDrop === "number" && base.metrics.effectivenessDrop >= cfg.effectivenessDropWatch) {
    signals.push("effDrop");
  }

  // ── Signal 4 — HRV decline ──
  const hrvSignal = computeHrvDeclineSignal(hrv, now, cfg);
  if (hrvSignal.active) signals.push("hrvDecline");

  // ── Signal 5 — Chronotype dyssynchrony ──
  const chronoSignal = computeChronoDyssynchronySignal(sessions, chronotype, cfg);
  if (chronoSignal.active) signals.push("chronoDyssynchrony");

  const level = levelFromSignalCount(signals.length);

  return {
    level,
    signals,
    metrics: {
      // Base metrics (from assessBurnout) — preserve all numeric fields.
      baselineFreqPerDay: base.metrics?.baselineFreqPerDay ?? null,
      recentFreqPerDay: base.metrics?.recentFreqPerDay ?? null,
      freqDrop: base.metrics?.freqDrop ?? null,
      moodSlopePerWeek: base.metrics?.moodSlopePerWeek ?? null,
      effectivenessDrop: base.metrics?.effectivenessDrop ?? null,
      // HRV signal metrics.
      hrvBaseline28d: hrvSignal.baseline,
      hrvRecent7d: hrvSignal.recent,
      hrvDeclinePct: hrvSignal.declinePct,
      hrvBaselineN: hrvSignal.baselineN,
      hrvRecentN: hrvSignal.recentN,
      // Chrono signal metrics.
      chronoMisalignedSessions: chronoSignal.misalignedSessions,
      chronoType: chronotype?.type || null,
    },
    n: base.n || sessions.length,
    insufficient: !!base.insufficient,
    snapshot: {
      computedAt: new Date(now),
      version: "v1",
      methodology: "heuristic-retrospective",
      disclaimer: WELLBEING_DISCLAIMER,
    },
  };
}

/**
 * Copy adaptativo per level — REFORMULADO marketing (NO "burnout score").
 * Cada copy incluye CTA opcional + disclaimer implícito en el assessment
 * (no se duplica aquí — el consumer renderea ambos).
 */
export function wellbeingCopy(level) {
  const COPIES = {
    ok: {
      title: "Tu wellbeing se ve estable",
      subtitle: "Tus patrones recientes son consistentes con bienestar.",
      cta: null,
      severity: "info",
    },
    watch: {
      title: "Patrón a observar",
      subtitle:
        "Detectamos un cambio leve en tu trayectoria. Considera mantener tus hábitos consolidados y revisar tu carga.",
      cta: { label: "Ver tendencias", target: "/app/data" },
      severity: "info",
    },
    warn: {
      title: "Patrones consistentes con agotamiento",
      subtitle:
        "Múltiples señales sugieren que podrías beneficiarte de un programa de recuperación. Esto NO es diagnóstico médico.",
      cta: { label: "Empezar Burnout Recovery", target: "/app/program/today" },
      severity: "warn",
    },
    alert: {
      title: "Múltiples señales de agotamiento",
      subtitle:
        "Tu wellbeing muestra varios indicadores que merecen atención. Considera hablar con un profesional de salud mental.",
      cta: { label: "Ver recursos", target: "/app/program/today" },
      crisisLine: "Si estás en crisis: SAPTEL 800-290-0024 (México)",
      severity: "danger",
    },
  };
  return COPIES[level] || COPIES.ok;
}

/* ─── Internal helpers ─────────────────────────────────────────── */

function levelFromSignalCount(count) {
  if (count === 0) return BURNOUT_LEVELS.OK;
  if (count === 1) return BURNOUT_LEVELS.WATCH;
  if (count === 2) return BURNOUT_LEVELS.WARN;
  return BURNOUT_LEVELS.ALERT; // 3+
}

function emptyAssessment(now, reason) {
  return {
    level: BURNOUT_LEVELS.OK,
    signals: [],
    metrics: {},
    n: 0,
    insufficient: true,
    reason,
    snapshot: {
      computedAt: new Date(now),
      version: "v1",
      methodology: "heuristic-retrospective",
      disclaimer: WELLBEING_DISCLAIMER,
    },
  };
}

/**
 * HRV decline signal: recent 7d mean RMSSD < baseline 28d-7d mean × (1-threshold).
 * Insuficiente data (<3 mediciones en cada ventana) → no activo (NO falsa alarma).
 *
 * @param {Array<{rmssd:number, measuredAt:Date|string}>} hrv
 * @param {number} now ms
 * @param {object} cfg
 * @returns {{active, baseline, recent, declinePct, baselineN, recentN}}
 */
function computeHrvDeclineSignal(hrv, now, cfg) {
  const safe = (Array.isArray(hrv) ? hrv : [])
    .map((m) => {
      const ts = m?.measuredAt instanceof Date ? m.measuredAt.getTime() : Date.parse(m?.measuredAt);
      return Number.isFinite(ts) && typeof m.rmssd === "number" && Number.isFinite(m.rmssd)
        ? { ts, rmssd: m.rmssd }
        : null;
    })
    .filter(Boolean);

  const baselineCutEnd = now - cfg.hrvRecentDays * DAY_MS;
  const baselineCutStart = now - cfg.hrvBaselineDays * DAY_MS;
  const recentCut = now - cfg.hrvRecentDays * DAY_MS;

  const baselineWindow = safe.filter((m) => m.ts >= baselineCutStart && m.ts < baselineCutEnd);
  const recentWindow = safe.filter((m) => m.ts >= recentCut);

  if (baselineWindow.length < cfg.hrvMinSamples || recentWindow.length < cfg.hrvMinSamples) {
    return {
      active: false,
      baseline: null,
      recent: null,
      declinePct: null,
      baselineN: baselineWindow.length,
      recentN: recentWindow.length,
      reason: "insufficient_data",
    };
  }

  const baselineMean = baselineWindow.reduce((s, m) => s + m.rmssd, 0) / baselineWindow.length;
  const recentMean = recentWindow.reduce((s, m) => s + m.rmssd, 0) / recentWindow.length;
  const declinePct = baselineMean > 0 ? (baselineMean - recentMean) / baselineMean : 0;

  return {
    active: declinePct >= cfg.hrvDeclineThreshold,
    baseline: +baselineMean.toFixed(2),
    recent: +recentMean.toFixed(2),
    declinePct: +declinePct.toFixed(3),
    baselineN: baselineWindow.length,
    recentN: recentWindow.length,
  };
}

/**
 * Chronotype dyssynchrony signal: contar sesiones más recientes consecutivas
 * fuera del deep-work window del cronotipo. Si ≥ chronoDyssynchronySessions
 * (default 7) → activo.
 *
 * Proxy de social-jetlag: el user está haciendo todas sus sesiones recientes
 * fuera de su ventana fisiológicamente óptima. NO es medida directa de
 * sleep schedule (deferred a Phase 6G+ con wearable data).
 *
 * @param {Array<{completedAt:Date|string}>} sessions
 * @param {object|null} chronotype — { type: "intermediate" | "definite_morning" | ... }
 * @param {object} cfg
 * @returns {{active, misalignedSessions}}
 */
function computeChronoDyssynchronySignal(sessions, chronotype, cfg) {
  if (!chronotype || typeof chronotype.type !== "string") {
    return { active: false, misalignedSessions: 0, reason: "no_chronotype" };
  }

  const safe = (Array.isArray(sessions) ? sessions : [])
    .map((s) => {
      const ts = s?.completedAt instanceof Date ? s.completedAt.getTime() : Date.parse(s?.completedAt);
      return Number.isFinite(ts) ? { ts, raw: s } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts); // most recent first

  if (safe.length === 0) {
    return { active: false, misalignedSessions: 0, reason: "no_sessions" };
  }

  // Pasamos chronotype.type STRING a isInDeepWorkWindow (NOT el objeto entero).
  let consecutive = 0;
  for (const s of safe) {
    const inWindow = isInDeepWorkWindow(chronotype.type, new Date(s.ts));
    if (!inWindow) {
      consecutive += 1;
    } else {
      break;
    }
  }

  return {
    active: consecutive >= cfg.chronoDyssynchronySessions,
    misalignedSessions: consecutive,
  };
}
