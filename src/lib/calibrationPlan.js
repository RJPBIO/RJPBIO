/* ═══════════════════════════════════════════════════════════════
   calibrationPlan — pasos del onboarding de datos.

   Tres sesiones variando intent para darle al motor un mínimo de
   señal antes de emitir recomendaciones personalizadas. Es pura:
   no depende de React.
   ═══════════════════════════════════════════════════════════════ */

export const CALIBRATION_STEPS = [
  {
    id: 1,
    intent: "calma",
    title: "Calibrar calma",
    subtitle: "Una sesión de respiración guiada. Mide cómo responde tu sistema al bajar revoluciones.",
    icon: "leaf",
  },
  {
    id: 2,
    intent: "enfoque",
    title: "Calibrar enfoque",
    subtitle: "Sesión de atención sostenida. Aprende cómo entras en foco bajo tu ritmo natural.",
    icon: "target",
  },
  {
    id: 3,
    intent: "energia",
    title: "Calibrar activación",
    subtitle: "Un empuje controlado. Cierra el triángulo de intents para el motor adaptativo.",
    icon: "bolt",
  },
];

/**
 * Devuelve el estado del plan según cuántas sesiones se completaron.
 * @param {number} totalSessions
 * @returns {{ currentStep: number, completed: boolean, percent: number, steps: Array }}
 */
export function calibrationState(totalSessions) {
  const done = Math.max(0, Math.min(CALIBRATION_STEPS.length, totalSessions | 0));
  const steps = CALIBRATION_STEPS.map((s, i) => ({
    ...s,
    state: i < done ? "done" : i === done ? "current" : "pending",
  }));
  return {
    currentStep: Math.min(done + 1, CALIBRATION_STEPS.length),
    completed: done >= CALIBRATION_STEPS.length,
    percent: Math.round((done / CALIBRATION_STEPS.length) * 100),
    steps,
  };
}
