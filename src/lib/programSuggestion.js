/* ═══════════════════════════════════════════════════════════════
   PROGRAM SUGGESTION

   Dada el estado del usuario, sugiere UN programa específico para
   empezar (o null si no hay razón suficiente).

   Reglas de prioridad (primera regla que matchea gana):
     1. Burnout alto/crítico → Burnout Recovery (urgencia clínica)
     2. Readiness "recover" sostenido + 5+ sesiones → Recovery Week
     3. ≥3 sesiones + sin historial de programs → Neural Baseline
        (onboarding progresivo — aprende qué intent responde mejor)
     4. sino → null (no push, no spam; el usuario descubre por sí mismo)

   Si el usuario YA tiene activeProgram, esta función siempre retorna
   null — no sugerimos mientras hay un programa en curso.

   La UI consume { programId, reason, urgency } para renderizar un
   banner arriba del ProgramBrowser con el CTA directo "Empezar".
   ═══════════════════════════════════════════════════════════════ */

import { getProgramById } from "./programs";

/**
 * @param {object} st — store state
 * @param {object} options
 * @param {object} [options.burnout]  { risk: "bajo"|"moderado"|"alto"|"crítico" }
 * @param {object} [options.readiness] { interpretation: "recover"|"primed"|"baseline"|... }
 * @returns {{ programId, reason, urgency }|null}
 */
export function suggestProgram(st, options = {}) {
  if (!st) return null;
  // Nunca sugerir si ya hay programa activo
  if (st.activeProgram && st.activeProgram.id) return null;

  const { burnout = null, readiness = null } = options;

  // Regla 1 — Burnout alto/crítico (máxima prioridad clínica)
  if (burnout && (burnout.risk === "alto" || burnout.risk === "crítico")) {
    return {
      programId: "burnout-recovery",
      reason:
        burnout.risk === "crítico"
          ? "Riesgo crítico de burnout detectado. Programa clínico de 4 semanas."
          : "Riesgo alto de burnout detectado. Programa clínico recomendado.",
      urgency: burnout.risk === "crítico" ? "critical" : "high",
    };
  }

  // Regla 2 — Readiness "recover" sostenido + historial suficiente
  // (no tiene sentido sugerir Recovery Week a un usuario nuevo que todavía
  // no ha calibrado su baseline)
  const totalSessions = Number(st.totalSessions || 0);
  if (readiness && readiness.interpretation === "recover" && totalSessions >= 5) {
    return {
      programId: "recovery-week",
      reason:
        "Tu sistema muestra signos de recuperación pendiente. 7 días de descarga progresiva.",
      urgency: "medium",
    };
  }

  // Regla 3 — Onboarding: usuario con 3+ sesiones, sin historial de programs
  const programHistory = Array.isArray(st.programHistory) ? st.programHistory : [];
  const hasProgramHistory = programHistory.length > 0;
  if (totalSessions >= 3 && !hasProgramHistory) {
    return {
      programId: "neural-baseline",
      reason:
        "Completaste tus primeras sesiones. Neural Baseline calibra qué intent responde mejor a tu fisiología.",
      urgency: "low",
    };
  }

  return null;
}

/**
 * Resuelve la sugerencia a formato listo para UI — incluye el objeto
 * program completo. Retorna null si no aplica o programId inválido.
 */
export function resolveProgramSuggestion(st, options = {}) {
  const suggestion = suggestProgram(st, options);
  if (!suggestion) return null;
  const program = getProgramById(suggestion.programId);
  if (!program) return null;
  return { ...suggestion, program };
}
