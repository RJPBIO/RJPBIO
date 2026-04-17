/* ═══════════════════════════════════════════════════════════════
   BREATH CYCLE — frame puro del ciclo respiratorio
   ═══════════════════════════════════════════════════════════════
   Dado un tick entero y la configuración `{in, h1, ex, h2}`,
   devuelve el label, el scale del orb y el countdown de la sub-fase
   actual. Permite testear sin React ni timers.
   ═══════════════════════════════════════════════════════════════ */

export function breathCycleLength(br) {
  if (!br) return 0;
  return (br.in || 0) + (br.h1 || 0) + (br.ex || 0) + (br.h2 || 0);
}

/**
 * Frame del ciclo en el tick `t` (segundos desde el inicio).
 * Retorna null si la config es inválida.
 */
export function computeBreathFrame(t, br) {
  const cy = breathCycleLength(br);
  if (cy <= 0) return null;
  const inS = br.in || 0;
  const h1 = br.h1 || 0;
  const exS = br.ex || 0;
  const p = t % cy;

  if (p < inS) {
    return { label: "INHALA", scale: 1 + 0.25 * (p / inS), countdown: inS - p };
  }
  if (p < inS + h1) {
    return { label: "MANTÉN", scale: 1.25, countdown: inS + h1 - p };
  }
  if (p < inS + h1 + exS) {
    const ep = p - inS - h1;
    return { label: "EXHALA", scale: 1.25 - 0.25 * (ep / exS), countdown: exS - ep };
  }
  return { label: "SOSTÉN", scale: 1, countdown: cy - p };
}
