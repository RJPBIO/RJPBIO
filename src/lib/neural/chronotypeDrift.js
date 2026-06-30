/* ═══════════════════════════════════════════════════════════════
   CHRONOTYPE DRIFT — el cronotipo como variable dinámica.
   ───────────────────────────────────────────────────────────────
   El cronotipo cambia con edad, estrés, estaciones, turnos. Este detector
   compara tu cronotipo DECLARADO (rMEQ) contra tu mejor ventana OBSERVADA
   (lib/neural/optimalWindow) y avisa cuando divergen → recalibra.

   HONESTIDAD (clave): NO estima la fase circadiana real. Eso requiere
   muestreo denso/nocturno continuo (wearable), no HRV de spot diurna. Esto
   solo detecta un desajuste entre lo declarado y lo observado, y sugiere
   re-hacer el rMEQ. La resincronización circadiana activa (luz/temperatura/
   timing) es el hito de wearables (Sprint 6 diferido), no esto.

   Función pura, on-device. Sin dependencias nuevas.
   ═══════════════════════════════════════════════════════════════ */

import { normalizeChronotype } from "../chronotype";
import { buildOptimalWindow } from "./optimalWindow";

// Centro esperado de la mejor ventana según el cronotipo declarado (hora local).
const EXPECTED_CENTER = {
  definite_morning: 8.5,
  moderate_morning: 10,
  intermediate: 12.5,
  moderate_evening: 16.5,
  definite_evening: 19,
};

const LABEL = {
  definite_morning: "Matutino definido",
  moderate_morning: "Matutino moderado",
  intermediate: "Intermedio",
  moderate_evening: "Vespertino moderado",
  definite_evening: "Vespertino definido",
};

const MILD_H = 2.5;
const NOTABLE_H = 4;

function declaredType(chronotype) {
  if (!chronotype) return null;
  const raw = chronotype.type || chronotype.category || chronotype.chronotype || null;
  if (typeof raw !== "string") return null;
  const t = normalizeChronotype(raw);
  return EXPECTED_CENTER[t] != null ? t : null;
}

const periodWord = (h) => (h < 12 ? "la mañana" : h < 17 ? "la tarde" : "la noche");

/**
 * @param {object} args — { chronotype, history, now }
 */
export function buildChronotypeDrift({ chronotype, history, now = Date.now() } = {}) {
  const type = declaredType(chronotype);
  if (!type) {
    return { available: false, reason: "Sin cronotipo declarado — calibra tu rMEQ primero." };
  }

  const win = buildOptimalWindow(Array.isArray(history) ? history : [], { now });
  if (!win.available || !win.best) {
    return { available: false, reason: win.reason || "Aún sin ventana observada para comparar." };
  }

  const expectedCenter = EXPECTED_CENTER[type];
  const observedCenter = win.best.hourStart + 1; // centro de la franja de 2h
  // Diferencia circular (24h).
  let diff = Math.abs(observedCenter - expectedCenter);
  if (diff > 12) diff = 24 - diff;
  const diffHours = Math.round(diff * 10) / 10;

  const drift = diff >= NOTABLE_H ? "notable" : diff >= MILD_H ? "mild" : "aligned";
  const shouldRecalibrate = drift === "notable";

  let message;
  if (drift === "aligned") {
    message = `Tu ritmo observado coincide con tu cronotipo declarado (${LABEL[type]}).`;
  } else if (drift === "mild") {
    message = `Tu mejor ventana observada (${win.best.label}) se desvía un poco de tu cronotipo declarado (${LABEL[type]}).`;
  } else {
    message = `Tu cronotipo declarado (${LABEL[type]}) apunta a ${periodWord(expectedCenter)}, pero tu mejor respuesta observada es en ${win.best.label}. Tu ritmo puede haber cambiado — recalibra.`;
  }

  return {
    available: true,
    declaredType: type,
    declaredLabel: LABEL[type],
    declaredCenter: expectedCenter,
    observed: { hourStart: win.best.hourStart, label: win.best.label, center: observedCenter },
    diffHours,
    drift,
    shouldRecalibrate,
    message,
  };
}
