/* ═══════════════════════════════════════════════════════════════
   SESSION CLOSE — métricas puras del cierre de sesión
   ═══════════════════════════════════════════════════════════════
   Extrae el cálculo de tiempos (esperado / real / oculto / activo)
   y la selección de mensaje+firma según la calidad evaluada.

   Puro: recibe `now` como parámetro (no usa Date.now) para que el
   testing con fake timers sea trivial.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Computa las métricas temporales de una sesión cerrada.
 * - expectedSec: duración teórica (del sessionData o protocolo*mult)
 * - actualSec:   segundos reales desde start (clamp ≥ 0)
 * - hiddenSec:   segundos que la pestaña estuvo en background
 * - activeSec:   max(0, actual - hidden)
 * - completeness: activeSec / expectedSec (capado en 1)
 * - sessionDataFull: sessionData original + los campos derivados
 */
export function computeSessionMetrics({ sessionData, protocol, durMult, now }) {
  const expectedSec = sessionData.expectedSec || Math.round(protocol.d * durMult);
  const actualSec = sessionData.startedAt
    ? Math.max(0, (now - sessionData.startedAt) / 1000)
    : expectedSec;
  const hiddenSec = (sessionData.hiddenMs || 0) / 1000;
  const activeSec = Math.max(0, actualSec - hiddenSec);
  const completeness = expectedSec > 0 ? Math.min(1, activeSec / expectedSec) : 1;
  const sessionDataFull = { ...sessionData, actualSec, hiddenSec, completeness };
  return { expectedSec, actualSec, hiddenSec, activeSec, completeness, sessionDataFull };
}

/**
 * Mensaje hablado post-sesión según calidad evaluada.
 */
export function sessionQualityMessage(quality) {
  if (quality === "alta") return "Sesión excelente";
  if (quality === "ligera") return "Sesión ligera registrada";
  return "Sesión completada";
}

/**
 * La firma de ignición (sonora + háptica) se reserva para sesiones
 * reales — evitamos premiar "ligera" o "inválida" (abandono temprano).
 */
export function shouldPlayIgnitionSignature(quality) {
  return quality !== "ligera" && quality !== "inválida";
}
