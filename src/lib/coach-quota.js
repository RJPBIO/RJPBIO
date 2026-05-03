/* ═══════════════════════════════════════════════════════════════
   Coach LLM monthly quota (Sprint S5.1)
   ═══════════════════════════════════════════════════════════════
   Hard cap por plan (mensajes/mes). Reset implícito: una nueva fila
   `CoachUsage` se crea cuando cambia el mes (year+month es único por
   user). Mensajes consumidos se cuentan en `requests`.

   Tier matrix (per user instructions):
     FREE        →   5 msgs/mes (Haiku)
     PRO         → 100 msgs/mes (Sonnet)
     STARTER     → 500 msgs/mes (Sonnet)
     GROWTH      → unlimited (Sonnet)
     ENTERPRISE  → unlimited (Sonnet o Opus opt-in)

   "Unlimited" se representa como Infinity en el cap. Hard cap implica:
   al alcanzar el límite, el handler devuelve 429 con quota info.
   ═══════════════════════════════════════════════════════════════ */

export const COACH_QUOTA_BY_PLAN = Object.freeze({
  FREE:       { maxRequests: 5,        modelTier: "haiku" },
  PRO:        { maxRequests: 100,      modelTier: "sonnet" },
  STARTER:    { maxRequests: 500,      modelTier: "sonnet" },
  GROWTH:     { maxRequests: Infinity, modelTier: "sonnet" },
  ENTERPRISE: { maxRequests: Infinity, modelTier: "sonnet" },
});

/**
 * Devuelve el cap por plan. Plan unknown → FREE.
 */
export function getCoachQuota(plan) {
  const norm = String(plan || "FREE").toUpperCase();
  return COACH_QUOTA_BY_PLAN[norm] || COACH_QUOTA_BY_PLAN.FREE;
}

/**
 * ¿La sesión está dentro del cap mensual? Pure helper.
 *
 * @param {object} usage  - row de CoachUsage actual del user (puede ser null)
 * @param {string} plan
 * @returns {{ok: boolean, used: number, max: number, remaining: number, reason?: string}}
 */
export function evaluateQuota(usage, plan) {
  const { maxRequests } = getCoachQuota(plan);
  const used = usage?.requests || 0;
  if (maxRequests === Infinity) {
    return { ok: true, used, max: Infinity, remaining: Infinity };
  }
  const remaining = Math.max(0, maxRequests - used);
  if (used >= maxRequests) {
    return { ok: false, used, max: maxRequests, remaining: 0, reason: "quota_exceeded" };
  }
  return { ok: true, used, max: maxRequests, remaining };
}

/**
 * Año/mes actual en UTC (consistente cross-timezone para billing).
 */
export function currentBillingPeriod(now = new Date()) {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
