/* ═══════════════════════════════════════════════════════════════
   PHASE ENGINE — motor puro de progresión de fases
   ═══════════════════════════════════════════════════════════════
   Dos funciones core que determinan qué fase está activa y cuánto
   falta para la próxima, dado el tiempo transcurrido y un
   multiplicador de duración (0.5x, 1x, 1.5x).

   Puro: sin efectos, sin React. Permite testear la lógica crítica
   del timing de sesión sin montar el componente.
   ═══════════════════════════════════════════════════════════════ */

function threshold(phase, scale) {
  return Math.round((phase.s || 0) * scale);
}

/**
 * Índice de la fase activa dado el tiempo transcurrido.
 * Recorre las fases de atrás hacia adelante y retorna la primera
 * cuyo umbral ya fue alcanzado. Si nada aplica o las fases son
 * inválidas, retorna 0 (fase inicial segura).
 */
export function computePhaseIndex(elapsedSec, phases, scale) {
  if (!phases || phases.length === 0) return 0;
  for (let i = phases.length - 1; i >= 0; i--) {
    if (elapsedSec >= threshold(phases[i], scale)) return i;
  }
  return 0;
}

/**
 * Segundos hasta el inicio de la siguiente fase. Retorna null si
 * ya estamos en la última. Puede devolver 0 (umbral exacto) o
 * negativo (índice desincronizado con el tiempo real).
 */
export function timeToNextPhase(elapsedSec, phases, scale, currentIdx) {
  if (!phases || phases.length === 0) return null;
  const nextIdx = currentIdx + 1;
  if (nextIdx >= phases.length) return null;
  return threshold(phases[nextIdx], scale) - elapsedSec;
}
