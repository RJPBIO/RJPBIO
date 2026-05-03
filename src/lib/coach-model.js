/* ═══════════════════════════════════════════════════════════════
   Coach LLM model resolution (Sprint S1.6 + S5)
   ═══════════════════════════════════════════════════════════════
   Antes: el endpoint /api/coach hardcoded "claude-sonnet-4-6" e ignoraba
   process.env.COACH_MODEL definido en .env.example. Ahora:

   1. process.env.COACH_MODEL — override global (ops/staging tests).
   2. Si no hay override, plan-based default:
      - FREE        → claude-haiku-4-5-20251001  (cheap, fast)
      - PRO         → claude-sonnet-4-6
      - STARTER     → claude-sonnet-4-6
      - GROWTH      → claude-sonnet-4-6
      - ENTERPRISE  → claude-sonnet-4-6 (default)
                      claude-opus-4-7  (si process.env.COACH_OPUS_FOR_ENTERPRISE=1)
   3. Plan unknown → trate como FREE.

   El gating de USO (mensajes/mes) vive en /api/coach con CoachUsage table
   (Sprint S5). Este módulo solo decide QUÉ modelo, no SI procede la query.
   ═══════════════════════════════════════════════════════════════ */

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";
const OPUS = "claude-opus-4-7";

const PLAN_DEFAULTS = Object.freeze({
  FREE: HAIKU,
  PRO: SONNET,
  STARTER: SONNET,
  GROWTH: SONNET,
  ENTERPRISE: SONNET,
});

/**
 * Resuelve el modelo Anthropic para una request del coach.
 *
 * @param {string|null} plan - "FREE" | "PRO" | "STARTER" | "GROWTH" | "ENTERPRISE"
 * @param {object} [opts]
 * @param {string} [opts.envOverride] - lo que viene en process.env.COACH_MODEL
 * @param {boolean} [opts.opusEnterprise] - process.env.COACH_OPUS_FOR_ENTERPRISE === "1"
 * @returns {string} model id
 */
export function resolveCoachModel(plan, { envOverride = null, opusEnterprise = false } = {}) {
  if (envOverride && typeof envOverride === "string" && envOverride.trim()) {
    return envOverride.trim();
  }
  const norm = String(plan || "FREE").toUpperCase();
  if (norm === "ENTERPRISE" && opusEnterprise) return OPUS;
  return PLAN_DEFAULTS[norm] || HAIKU;
}

export const COACH_MODEL_IDS = Object.freeze({ HAIKU, SONNET, OPUS });
export const COACH_PLAN_DEFAULTS = PLAN_DEFAULTS;
