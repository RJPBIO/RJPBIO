/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — RECOMMENDATION EXTRACTION HELPERS
   Phase 6H Fix-A1
   ───────────────────────────────────────────────────────────────
   Helper compartido para extraer protocol/id/reason desde la salida
   del adaptive engine. Cubre el bug latente A1 documentado en
   PHASE_6H_PREMIUM_FIX4_REPORT: callers downstream extraían mal
   `primary.id` cuando el shape REAL del engine es:

     { primary: { protocol: {id, n, d, int, ...}, score, reason }, ... }

   El path correcto es `primary.protocol.id` — NO `primary.id`.
   Resultado del bug: callers caían siempre al fallback
   `firstProtocolForIntent`, perdiendo engine recommendations
   personalizadas + reasons contextuales.

   DEFENSIVE EXTRACTION CHAIN: estos helpers prueban primero el path
   correcto del engine (`primary.protocol.id`) y caen al legacy
   `primary.id` para preservar backward compat con:
   - Legacy LearningView.bugfix.test.jsx (Phase 6F) que mockea shape
     incorrecto `{primary: {id, n, int}}` sin protocol wrapper.
   - Cualquier futuro caller que pase un Protocol-shape directo.

   Source authoritative del shape engine: src/lib/neural.js:809.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Extrae el objeto Protocol completo desde una recommendation.
 *
 * Defensive chain:
 *   1. recommendation.primary.protocol → engine REAL shape (preferido)
 *   2. recommendation.primary           → legacy/mock shape (Protocol flat)
 *   3. recommendation                    → caso edge: ya es Protocol-shaped
 *   4. null                              → no hay primary válido
 *
 * @param {object|null} recommendation - output de useAdaptiveRecommendation
 * @returns {object|null} Protocol object {id, n, d, int, ...} o null
 */
export function extractPrimaryProtocol(recommendation) {
  if (!recommendation) return null;

  const primary = recommendation.primary;
  if (primary) {
    // Engine real shape (neural.js:809): primary = { protocol, score, reason }
    if (primary.protocol && primary.protocol.id != null) {
      return primary.protocol;
    }
    // Legacy/mock shape: primary es Protocol flat con id directo
    if (primary.id != null) return primary;
    return null;
  }

  // Edge case defensivo: caller pasó un Protocol directamente (no envuelto)
  if (recommendation.id != null && recommendation.n != null) return recommendation;

  return null;
}

/**
 * Extrae el id del Protocol primary. Útil cuando solo necesitas el id
 * sin el objeto completo (e.g. PROTOCOLS.find(p => p.id === id)).
 *
 * @param {object|null} recommendation
 * @returns {number|string|null}
 */
export function extractPrimaryProtocolId(recommendation) {
  const proto = extractPrimaryProtocol(recommendation);
  return proto?.id ?? null;
}

/**
 * Extrae el reason del primary recommendation. Engine produce strings
 * contextuales premium-grade ("Tu historial muestra +1.2 puntos con
 * este protocolo", "Readiness elevado (78): ventana para trabajo
 * cognitivo exigente"). Si el caller pasó un Protocol flat (sin reason
 * envuelto), retorna null — no hay reason para fallbacks.
 *
 * @param {object|null} recommendation
 * @returns {string|null}
 */
export function extractPrimaryReason(recommendation) {
  if (!recommendation?.primary) return null;
  const reason = recommendation.primary.reason;
  return typeof reason === "string" && reason.length > 0 ? reason : null;
}

/**
 * Helper combinado: indica si la recommendation viene del engine real
 * (con shape `primary.protocol`) vs un mock/legacy/Protocol-flat.
 *
 * Útil para marcar `data-source="engine" | "fallback"` en el UI y/o
 * decidir si exponer reason caption (solo cuando viene del engine).
 *
 * @param {object|null} recommendation
 * @returns {boolean}
 */
export function isEngineRecommendation(recommendation) {
  return !!(recommendation?.primary?.protocol && recommendation.primary.protocol.id != null);
}

/**
 * Phase 6I-3 — Extrae el array de alternatives del recommendation.
 *
 * Engine real shape (neural.js:816): `alternatives: scored.slice(1, 3)` produce
 * 0-2 items con misma estructura que primary: `{protocol, score, reason}`.
 *
 * Defensive chain (consistente con extractPrimaryProtocol):
 *   1. recommendation.alternatives es Array → filtra items con protocol.id válido
 *      (engine real) O con id flat (legacy/mock fallback compat)
 *   2. recommendation null/undefined/sin alternatives → []
 *   3. alternatives no es Array → []
 *
 * Retorna SIEMPRE un array (nunca null) para que callers puedan usar `.length`
 * o `.map()` sin null-checks adicionales.
 *
 * @param {object|null} recommendation - output de useAdaptiveRecommendation
 * @returns {Array<{protocol, score, reason}>} alternatives válidos (0-N items)
 */
export function extractAlternatives(recommendation) {
  if (!recommendation || !Array.isArray(recommendation.alternatives)) return [];
  return recommendation.alternatives.filter((alt) => {
    if (!alt) return false;
    // Engine real shape: alt.protocol.id válido
    if (alt.protocol && alt.protocol.id != null) return true;
    // Legacy/mock shape: alt.id directo (Protocol flat) — defensive backward compat
    if (alt.id != null) return true;
    return false;
  });
}

/**
 * Phase 6I-3 — Extrae el Protocol object de una alternative item.
 *
 * Defensive chain (espejo de extractPrimaryProtocol):
 *   1. alt.protocol con id válido → engine real shape
 *   2. alt.id directo → legacy/mock shape (alt es Protocol flat)
 *   3. null defensivo
 *
 * @param {object|null} alt - una entry del array `recommendation.alternatives`
 * @returns {object|null} Protocol object {id, n, d, int, ...} o null
 */
export function extractAlternativeProtocol(alt) {
  if (!alt || typeof alt !== "object") return null;
  if (alt.protocol && alt.protocol.id != null) return alt.protocol;
  if (alt.id != null) return alt;
  return null;
}

/**
 * Phase 6I-3 — Extrae el reason string de una alternative.
 *
 * Engine produce contextual reasons (neural.js:_generateReason) — mismas que
 * primary, pero específicas al protocol de la alternative. Solo retorna string
 * non-empty; null para reasons missing/empty/non-string.
 *
 * @param {object|null} alt - alternative item
 * @returns {string|null}
 */
export function extractAlternativeReason(alt) {
  if (!alt || typeof alt !== "object") return null;
  const reason = alt.reason;
  if (typeof reason !== "string") return null;
  if (reason.trim() === "") return null;
  return reason;
}
