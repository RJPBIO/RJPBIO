/* ═══════════════════════════════════════════════════════════════
   HRV-CAMERA · Signal Quality Index (SQI)
   ═══════════════════════════════════════════════════════════════
   Score 0-100 que el usuario ve en tiempo real para saber si su
   medición es confiable. CRÍTICO: preferimos rechazar una medición
   sucia a reportar número falso. Dato clínico basura es peor que
   ningún dato.

   Componentes del score:

     1) Pulse periodicity consistency (35%)
        — CV de los últimos IBIs. CV típico en reposo: 0.02-0.08.
        — CV >0.35 indica o movimiento extremo o arritmia (no real
          HRV, sino artefacto). CV ~0 indica señal muerta/flat.

     2) Ectopic rate (25%)
        — Fracción de IBIs rechazados por ser outliers (>20% de la
          mediana). >15% de ectópicos → medición descartable.

     3) Peak prominence consistency (25%)
        — Variabilidad de la altura de los picos detectados. Picos
          muy heterogéneos → señal inestable (dedo moviéndose,
          luz variable).

     4) Signal coverage (15%)
        — ¿Obtuvimos suficientes latidos para el periodo medido?
          Esperamos ~1 latido/s a 60 BPM. Cobertura <70% =
          peak detection fallando.

   Salida:
     - score 0-100
     - band "excellent" / "good" / "marginal" / "poor"
     - breakdown por componente (para debug/feedback al usuario)
   ═══════════════════════════════════════════════════════════════ */

/**
 * @param {object} input
 * @param {number[]} input.ibisValid      IBIs validados (post-physiological)
 * @param {number}   input.ectopicRate    fracción 0-1 de ectópicos
 * @param {number[]} [input.peakValues]   valor/amplitud de cada pico detectado
 * @param {number}   input.durationSec    duración total de la medición en segundos
 * @param {number}   [input.expectedHrBpm=70]  HR promedio esperado para cobertura
 * @returns {{score, band, components}}
 */
export function computeSqi({ ibisValid, ectopicRate, peakValues = [], durationSec, expectedHrBpm = 70 }) {
  const N = ibisValid.length;

  // ─── 1) Periodicity consistency (via CV) ────────────────────
  let periodicityScore = 0;
  if (N >= 5) {
    const mean = ibisValid.reduce((a, b) => a + b, 0) / N;
    const variance = ibisValid.reduce((a, b) => a + (b - mean) ** 2, 0) / N;
    const std = Math.sqrt(variance);
    const cv = std / mean; // coeficiente de variación
    // Score: óptimo CV entre 0.02 (muy regular pero no flat) y 0.15
    // (HRV saludable). Fuera → penaliza.
    if (cv < 0.01 || cv > 0.5) periodicityScore = 0;
    else if (cv < 0.02) periodicityScore = 60; // señal quizá demasiado regular (arrítmica?)
    else if (cv <= 0.15) periodicityScore = 100;
    else if (cv <= 0.25) periodicityScore = 70;
    else if (cv <= 0.35) periodicityScore = 40;
    else periodicityScore = 10;
  }

  // ─── 2) Ectopic rate ────────────────────────────────────────
  // 0% ectópicos = 100, 20% ectópicos = 0 (linear)
  const ectopicScore = Math.max(0, Math.round((1 - ectopicRate * 5) * 100));

  // ─── 3) Peak prominence consistency ─────────────────────────
  let prominenceScore = 50; // neutral si no hay data
  if (peakValues.length >= 3) {
    const meanP = peakValues.reduce((a, b) => a + b, 0) / peakValues.length;
    const varP = peakValues.reduce((a, b) => a + (b - meanP) ** 2, 0) / peakValues.length;
    const stdP = Math.sqrt(varP);
    const cvP = Math.abs(meanP) > 0 ? stdP / Math.abs(meanP) : 1;
    if (cvP < 0.25) prominenceScore = 100;
    else if (cvP < 0.45) prominenceScore = 70;
    else if (cvP < 0.65) prominenceScore = 40;
    else prominenceScore = 10;
  }

  // ─── 4) Signal coverage ─────────────────────────────────────
  // Esperamos N_expected = (durationSec * expectedHrBpm / 60) latidos.
  const expected = (durationSec * expectedHrBpm) / 60;
  const coverage = expected > 0 ? Math.min(1, N / expected) : 0;
  const coverageScore = Math.round(coverage * 100);

  // ─── Weighted final ─────────────────────────────────────────
  const score = Math.round(
    periodicityScore * 0.35 +
      ectopicScore * 0.25 +
      prominenceScore * 0.25 +
      coverageScore * 0.15
  );

  const band =
    score >= 80 ? "excellent" :
    score >= 60 ? "good" :
    score >= 40 ? "marginal" : "poor";

  return {
    score,
    band,
    components: {
      periodicity: periodicityScore,
      ectopic: ectopicScore,
      prominence: prominenceScore,
      coverage: coverageScore,
    },
  };
}

/**
 * Decisión final: ¿aceptamos esta medición?
 * Conservador — preferir rechazar sobre reportar dato sucio.
 */
export function shouldAcceptMeasurement(sqi) {
  if (!sqi) return false;
  if (sqi.score < 40) return false; // "poor" band siempre rechazado
  if (sqi.components.coverage < 50) return false; // insuficientes latidos
  if (sqi.components.ectopic < 30) return false; // >14% ectópicos
  return true;
}
