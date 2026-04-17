/* ═══════════════════════════════════════════════════════════════
   ROI — modelo conservador de horas de foco recuperadas
   ═══════════════════════════════════════════════════════════════
   Diseñado para sobrevivir el escrutinio de un CFO. Todos los
   factores son conservadores, documentados y ajustables.

   Fórmula:

     recoveredHours = sessionsMinutes × observedLift × residualFactor / 60

     observedLift:
       - fracción 0..1 (efecto sobre estado/foco)
       - se capsula en effectSizeCap=0.35 para evitar sobre-reporte
         basado en self-report (auto-evaluación post-sesión infla).
       - si no se pasa explícitamente se deriva de la fracción de
         sesiones con mood > pre.

     residualFactor:
       - persistencia del lift más allá de la sesión misma.
       - default 2.0× duración de sesión — suposición conservadora
         soportada por literatura de "arousal / attention carryover"
         en intervenciones breves (Zeidan 2010, Basso et al. 2019).

     valor monetario:
       - hourlyLoadedCost = costo cargado / hora (default USD 60,
         estimación conservadora global knowledge worker 2026).

   El modelo expone intencionalmente sus supuestos: cambiar los
   defaults y observar sensibilidad es parte del entregable a RH/CFO.

   Referencias:
   - Zeidan F et al. (2010). Mindfulness meditation improves cognition:
     Evidence of brief mental training. Consciousness & Cognition,
     19(2), 597-605.
   - Basso JC et al. (2019). Brief, daily meditation enhances attention,
     memory, mood. Behavioural Brain Research, 356, 208-220.
   ═══════════════════════════════════════════════════════════════ */

export const ROI_DEFAULTS = {
  effectSizeCap: 0.35,
  residualFactor: 2.0,
  minSessions: 30,
  hourlyLoadedCost: 60,       // USD/hr
  fallbackSessionSec: 180,    // used when actualSec is missing
};

export function computeRecoveredHours({
  sessions = [],
  observedLift = null,
  residualFactor = ROI_DEFAULTS.residualFactor,
} = {}) {
  const safe = Array.isArray(sessions) ? sessions : [];
  if (safe.length < ROI_DEFAULTS.minSessions) {
    return {
      insufficient: true,
      n: safe.length,
      minRequired: ROI_DEFAULTS.minSessions,
    };
  }
  const totalSec = safe.reduce(
    (sum, s) => sum + (typeof s?.actualSec === "number" && s.actualSec > 0
      ? s.actualSec
      : ROI_DEFAULTS.fallbackSessionSec),
    0
  );
  const sessionsMinutes = totalSec / 60;

  let lift;
  if (typeof observedLift === "number" && isFinite(observedLift)) {
    lift = Math.max(0, Math.min(observedLift, ROI_DEFAULTS.effectSizeCap));
  } else {
    const eligible = safe.filter(
      (s) => typeof s?.pre === "number" && typeof s?.mood === "number"
    );
    if (eligible.length > 0) {
      const positives = eligible.filter((s) => s.mood > s.pre).length;
      const rate = positives / eligible.length;
      lift = Math.min(rate, ROI_DEFAULTS.effectSizeCap);
    } else {
      lift = 0;
    }
  }
  const recoveredMinutes = sessionsMinutes * lift * residualFactor;
  return {
    insufficient: false,
    n: safe.length,
    sessionsMinutes: +sessionsMinutes.toFixed(0),
    observedLift: +lift.toFixed(3),
    residualFactor,
    effectSizeCap: ROI_DEFAULTS.effectSizeCap,
    recoveredHours: +(recoveredMinutes / 60).toFixed(2),
  };
}

export function computeRoiValue({
  recoveredHours,
  hourlyLoadedCost = ROI_DEFAULTS.hourlyLoadedCost,
  currency = "USD",
} = {}) {
  if (!recoveredHours || recoveredHours <= 0) return null;
  return {
    currency,
    hourlyLoadedCost,
    recoveredHours,
    totalValue: Math.round(recoveredHours * hourlyLoadedCost),
  };
}
