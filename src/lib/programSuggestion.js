/* ═══════════════════════════════════════════════════════════════
   PROGRAM SUGGESTION

   Dada el estado del usuario, sugiere UN programa específico para
   empezar (o null si no hay razón suficiente).

   Reglas de prioridad (primera regla que matchea gana):
     1. Burnout alto/crítico → Burnout Recovery (urgencia clínica)
     2. Readiness "recover" sostenido + 5+ sesiones → Recovery Week
     3. ≥3 sesiones + sin historial de programs → Neural Baseline
        (onboarding progresivo — aprende qué intent responde mejor)
     4. (Sprint 64) Cooldown weekly: si último programa completado fue
        hace ≥7 días Y hay programas no-completados, sugerir el siguiente
        del catálogo. Si todos completados, ofrecer Neural Baseline como
        recalibración (gente cambia, baseline cambia).
     5. sino → null (no push, no spam; el usuario descubre por sí mismo)

   Si el usuario YA tiene activeProgram, esta función siempre retorna
   null — no sugerimos mientras hay un programa en curso.

   La UI consume { programId, reason, urgency } para renderizar un
   banner arriba del ProgramBrowser con el CTA directo "Empezar".
   ═══════════════════════════════════════════════════════════════ */

import { getProgramById, PROGRAMS } from "./programs";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

  // Regla 4 (Sprint 64) — Cooldown weekly. Si pasaron ≥7 días desde el
  // último programa COMPLETADO (no abandonado), sugiere el siguiente.
  // Bug previo: el sistema solo sugería onboarding una vez. Una vez
  // completado el primer programa, el usuario nunca volvía a recibir
  // sugerencia salvo burnout/recovery agudo. Esto deja el sistema mudo
  // por meses para usuarios saludables — exactamente la audiencia que
  // se beneficiaría de progressive challenge.
  if (hasProgramHistory) {
    const completedHistory = programHistory.filter(
      (h) => h && !h.abandoned && (h.completionFraction === 1 || h.completionFraction === undefined)
    );
    const lastCompletedAt = completedHistory.reduce(
      (max, h) => Math.max(max, typeof h.completedAt === "number" ? h.completedAt : 0),
      0
    );
    const since = Date.now() - lastCompletedAt;
    if (lastCompletedAt > 0 && since >= SEVEN_DAYS_MS) {
      const completedIds = new Set(completedHistory.map((h) => h.id));
      // Buscar el primer programa del catálogo que aún no se completa.
      const next = PROGRAMS.find((p) => !completedIds.has(p.id));
      if (next) {
        return {
          programId: next.id,
          reason: `Han pasado 7 días desde tu último programa. ${next.n} es el siguiente paso natural.`,
          urgency: "low",
        };
      }
      // Todos completados — ofrecer Neural Baseline como recalibración.
      // La fisiología cambia con el tiempo; reentrenar el motor neural
      // con una baseline fresca tiene valor real.
      return {
        programId: "neural-baseline",
        reason:
          "Has completado todos los programas. Recalibra tu baseline neural — tu fisiología cambia.",
        urgency: "low",
      };
    }
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
