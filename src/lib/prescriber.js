/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — CONTEXTUAL PRESCRIPTION ENGINE
   ───────────────────────────────────────────────────────────────
   Given the user's current state (readiness, mood, recent load,
   chronotype, time of day), recommend the next protocol with
   transparent rationale.
   ═══════════════════════════════════════════════════════════════ */

import { P } from "./protocols";
import { calcReadiness } from "./readiness";
import { isInDeepWorkWindow } from "./chronotype";
import {
  getReliableHrvEntries,
  getReliableRhrEntries,
  getCurrentReliableHrv,
} from "./hrvLog";

/**
 * @typedef {Object} PrescriberInput
 * @property {object} st - full app state (store)
 * @property {Date} [now]
 */

/**
 * Primary entry point. Returns { proto, reason, priority, readiness }.
 */
export function prescribe({ st, now = new Date() }) {
  const readiness = calcReadinessFromState(st);
  const hour = now.getHours();
  const lastMood = (st.moodLog || []).slice(-1)[0];
  const last2hSessions = (st.history || []).filter((h) => now.getTime() - h.ts < 2 * 3600000);
  const lastSessionMs = (st.history || []).slice(-1)[0]?.ts || 0;
  const sinceLastMin = lastSessionMs ? (now.getTime() - lastSessionMs) / 60000 : 9999;

  const signals = [];
  if (readiness && readiness.score !== null) signals.push({ type: "readiness", value: readiness.score });
  if (lastMood && now.getTime() - lastMood.ts < 2 * 3600000) {
    signals.push({ type: "mood", value: lastMood.mood, energy: lastMood.energy });
  }
  signals.push({ type: "timeOfDay", hour });
  signals.push({ type: "recentLoad", last2h: last2hSessions.length, sinceLastMin });
  if (st.chronotype?.type) signals.push({ type: "chronotype", value: st.chronotype.type });

  const rule = firstMatchingRule({ signals, st, hour, lastMood, readiness, last2hSessions, sinceLastMin });

  if (!rule) return fallback(st, hour);

  const proto = pickProtocol(st, rule.intent, rule.prefer);
  if (!proto) return fallback(st, hour);

  return {
    proto,
    intent: rule.intent,
    reason: rule.reason,
    priority: rule.priority,
    readiness,
    signals,
    evidenceId: rule.evidenceId,
  };
}

function calcReadinessFromState(st) {
  try {
    // Filtrado por confiabilidad (SQI gating). Antes pasaba st.hrvLog
    // crudo → entradas cámara basura contaminaban el baseline neural
    // y las recomendaciones quedaban envenenadas.
    return calcReadiness({
      hrvHistory: getReliableHrvEntries(st.hrvLog).map((h) => ({ ts: h.ts, lnRmssd: h.lnRmssd })),
      rhrHistory: getReliableRhrEntries(st.rhrLog).map((h) => ({ ts: h.ts, rhr: h.rhr })),
      sleepHours: st.lastSleepHours || null,
      moodLog: st.moodLog || [],
      sessions: st.history || [],
      currentHRV: getCurrentReliableHrv(st.hrvLog),
    });
  } catch {
    return null;
  }
}

/**
 * Rule priorities, highest first. The first matching rule wins.
 * Rules are deterministic; nothing is random.
 */
function firstMatchingRule({ signals, st, hour, lastMood, readiness, last2hSessions, sinceLastMin }) {
  if (lastMood && lastMood.mood <= 2 && Date.now() - lastMood.ts < 30 * 60000) {
    return {
      intent: "calma",
      prefer: "physiological_sigh",
      reason: "Estado de tensión alta reportado en los últimos 30 min. Descarga parasimpática aguda indicada.",
      priority: 1,
      evidenceId: "physiological_sigh",
    };
  }

  if (last2hSessions.length >= 3) {
    return {
      intent: "calma",
      prefer: "nsdr",
      reason: "Más de 3 sesiones en las últimas 2 horas. Riesgo de sobre-entrenamiento atencional — ventana de recuperación obligada.",
      priority: 2,
      evidenceId: "nsdr",
    };
  }

  if (readiness && readiness.score !== null) {
    if (readiness.score < 45) {
      return {
        intent: "calma",
        reason: `Readiness ${readiness.score}/100. Recursos bajos — prioriza recuperación, evita carga cognitiva adicional.`,
        priority: 3,
        evidenceId: "resonance_breathing",
      };
    }
    if (readiness.score >= 80) {
      if (st.chronotype?.type && isInDeepWorkWindow(st.chronotype.type)) {
        return {
          intent: "enfoque",
          reason: `Readiness ${readiness.score}/100 + ventana de trabajo profundo personal. Aprovecha para tareas cognitivamente exigentes.`,
          priority: 4,
          evidenceId: "meditation",
        };
      }
      return {
        intent: "energia",
        reason: `Readiness ${readiness.score}/100. Recursos elevados — buen momento para activación controlada.`,
        priority: 4,
      };
    }
  }

  if (st.chronotype?.type && isInDeepWorkWindow(st.chronotype.type) && sinceLastMin > 90) {
    return {
      intent: "enfoque",
      reason: "Dentro de tu ventana de pico cognitivo personal (según cronotipo). Preparación mental para bloque profundo.",
      priority: 5,
      evidenceId: "meditation",
    };
  }

  if (hour >= 21 || hour < 5) {
    return {
      intent: "calma",
      prefer: "resonance_breathing",
      reason: "Ventana nocturna. Protocolos calmantes facilitan transición al sueño; evitar activación.",
      priority: 6,
      evidenceId: "resonance_breathing",
    };
  }

  if (hour >= 13 && hour < 16 && sinceLastMin > 120) {
    return {
      intent: "reset",
      reason: "Bache de la tarde (post-almuerzo). Reset breve previene caída cognitiva sostenida.",
      priority: 7,
    };
  }

  return null;
}

function pickProtocol(st, intent, preferKey) {
  const pool = P.filter((p) => p.int === intent);
  if (pool.length === 0) return null;
  if (preferKey) {
    const special = pool.find((p) => (p.n || "").toLowerCase().includes(preferKey.replace("_", " ")));
    if (special) return special;
  }
  const last = (st.history || []).slice(-1)[0];
  const notRepeat = pool.filter((p) => !last || p.id !== last.pid);
  const poolFinal = notRepeat.length ? notRepeat : pool;
  const seed = Math.floor(Date.now() / 3600000);
  return poolFinal[seed % poolFinal.length];
}

function fallback(st, hour) {
  let intent = "reset";
  if (hour < 10) intent = "energia";
  else if (hour < 15) intent = "enfoque";
  else if (hour < 19) intent = "enfoque";
  else intent = "calma";
  const proto = pickProtocol(st, intent);
  return {
    proto,
    intent,
    reason: "Sin señales suficientes para recomendación personalizada. Sugerencia basada en hora del día.",
    priority: 99,
    readiness: null,
    signals: [],
  };
}
