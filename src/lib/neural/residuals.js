/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Prediction residuals & calibration
   Registra predicho vs observado por sesión y ajusta futuras
   predicciones según el sesgo sistemático del motor.

   Forma de estado:
     residuals = {
       history: [{ predicted, actual, residual, ts, armId? }, ...]
     }
   Mantenemos ventana de 100 entradas (rolling).
   ═══════════════════════════════════════════════════════════════ */

const MAX_HISTORY = 100;
const READY_MIN_N = 5;

/** Registra una predicción contrastada con la realidad. */
export function logResidual(state, { predicted, actual, armId = null, ts = null }) {
  const p = Number(predicted);
  const a = Number(actual);
  if (!Number.isFinite(p) || !Number.isFinite(a)) return state || { history: [] };
  const entry = {
    predicted: +p.toFixed(3),
    actual: +a.toFixed(3),
    residual: +(a - p).toFixed(3),
    armId,
    ts: ts || Date.now(),
  };
  const history = [...((state && state.history) || []), entry].slice(-MAX_HISTORY);
  return { history };
}

/**
 * Diagnósticos de calibración globales.
 * - bias: residual promedio (positivo = el motor sub-predice)
 * - mae:  error absoluto medio
 * - rmse: error cuadrático medio
 */
export function calibration(state) {
  const hist = (state && state.history) || [];
  if (hist.length < READY_MIN_N) {
    return { ready: false, n: hist.length, bias: 0, mae: null, rmse: null };
  }
  const n = hist.length;
  const sumR = hist.reduce((a, h) => a + h.residual, 0);
  const sumAbs = hist.reduce((a, h) => a + Math.abs(h.residual), 0);
  const sumSq = hist.reduce((a, h) => a + h.residual * h.residual, 0);
  const bias = sumR / n;
  return {
    ready: true,
    n,
    bias: +bias.toFixed(3),
    mae: +(sumAbs / n).toFixed(3),
    rmse: +Math.sqrt(sumSq / n).toFixed(3),
  };
}

/**
 * Calibración por brazo (protocolo). Útil para corregir sesgos
 * específicos: quizá el motor sobre-predice calma pero sub-predice reset.
 */
export function calibrationByArm(state) {
  const hist = (state && state.history) || [];
  const buckets = {};
  for (const h of hist) {
    if (!h.armId) continue;
    (buckets[h.armId] = buckets[h.armId] || []).push(h.residual);
  }
  const out = {};
  for (const [id, residuals] of Object.entries(buckets)) {
    const n = residuals.length;
    if (n < 3) continue;
    const bias = residuals.reduce((a, r) => a + r, 0) / n;
    const mae = residuals.reduce((a, r) => a + Math.abs(r), 0) / n;
    out[id] = { n, bias: +bias.toFixed(3), mae: +mae.toFixed(3) };
  }
  return out;
}

/**
 * Ajusta una predicción cruda restando el sesgo.
 * Sesgo positivo en residuales = el motor subestimó históricamente, así que
 * SUMAMOS el sesgo a la predicción cruda para compensar.
 */
export function calibratePrediction(state, rawPrediction, { armId = null } = {}) {
  const perArm = armId ? calibrationByArm(state)[armId] : null;
  const global = calibration(state);
  if (!rawPrediction || typeof rawPrediction.predictedDelta !== "number") return rawPrediction;
  let bias = 0;
  let source = "none";
  if (perArm && perArm.n >= 5) { bias = perArm.bias; source = "arm"; }
  else if (global.ready) { bias = global.bias; source = "global"; }
  if (source === "none") return { ...rawPrediction, calibrated: false };
  const adjusted = +(rawPrediction.predictedDelta + bias).toFixed(2);
  return {
    ...rawPrediction,
    predictedDelta: adjusted,
    calibrated: true,
    calibrationSource: source,
    calibrationBias: +bias.toFixed(3),
  };
}
