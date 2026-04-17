/* ═══════════════════════════════════════════════════════════════
   HRV DELTA — cambio pre/post sesión con gating por MDC95
   ═══════════════════════════════════════════════════════════════
   Cambios por debajo del Mínimo Detectable de Cambio (95%) no se
   reportan como significativos: distingue efecto real de ruido.
   Agregación respeta k-anonimato para exposición en dashboard.

   Referencias:
   - Haley & Fragala-Pinkham (2006). Interpreting change scores of
     tests and measures used in physical therapy. Physical Therapy,
     86(5), 735-743.
   ═══════════════════════════════════════════════════════════════ */

import { mdc95 } from "./hrv";

/**
 * Delta pre/post con clasificación MDC95-gated.
 * @param {{rmssd,lnRmssd,valid}} pre
 * @param {{rmssd,lnRmssd,valid}} post
 * @param {number[]} history - RMSSD values for personal baseline
 * @returns delta info o null si muestra inválida
 */
export function computeHrvDelta(pre, post, history = []) {
  if (!pre || !post || !pre.valid || !post.valid) return null;
  const deltaRmssd = +(post.rmssd - pre.rmssd).toFixed(1);
  const deltaLnRmssd = +((post.lnRmssd || 0) - (pre.lnRmssd || 0)).toFixed(2);
  const relativeChange = pre.rmssd > 0
    ? +(((post.rmssd - pre.rmssd) / pre.rmssd) * 100).toFixed(1)
    : 0;
  const mdc = mdc95(history);
  const significant = mdc !== null ? Math.abs(deltaRmssd) >= mdc : null;
  let classification;
  if (significant === null) classification = "unverified";
  else if (!significant) classification = "no-change";
  else if (deltaRmssd > 0) classification = "vagal-lift";
  else classification = "vagal-suppression";
  return { deltaRmssd, deltaLnRmssd, relativeChange, mdc95: mdc, significant, classification };
}

/**
 * Empareja lecturas HRV con sesiones por proximidad temporal.
 * Pre: dentro de `windowMs` antes del start; post: dentro de `windowMs`
 * después del end. Retorna array de deltas emparejados.
 *
 * @param {Array<{ts:number, startedAt?:number, actualSec?:number, dur?:number}>} sessions
 * @param {Array<{ts:number, rmssd:number, lnRmssd:number, valid?:boolean}>} hrvEntries
 * @param {{windowMs?:number, history?:number[]}} opts
 */
export function pairSessionHrvDeltas(sessions, hrvEntries, opts = {}) {
  const windowMs = opts.windowMs ?? 15 * 60 * 1000; // 15 min
  const history = Array.isArray(opts.history) ? opts.history : [];
  const entries = Array.isArray(hrvEntries) ? [...hrvEntries].sort((a, b) => a.ts - b.ts) : [];
  const out = [];
  for (const s of Array.isArray(sessions) ? sessions : []) {
    if (!s) continue;
    const start = typeof s.startedAt === "number" ? s.startedAt : s.ts;
    const durSec = typeof s.actualSec === "number" ? s.actualSec : typeof s.dur === "number" ? s.dur : 0;
    const end = start + durSec * 1000;
    if (!start) continue;
    let pre = null;
    let post = null;
    for (const e of entries) {
      if (!e || typeof e.ts !== "number") continue;
      if (e.ts <= start && start - e.ts <= windowMs) pre = e;
      if (e.ts >= end && e.ts - end <= windowMs && !post) { post = e; break; }
    }
    if (!pre || !post) continue;
    const normalized = (x) => ({
      rmssd: x.rmssd,
      lnRmssd: x.lnRmssd ?? (x.rmssd > 0 ? Math.log(x.rmssd) : 0),
      valid: x.valid !== false,
    });
    const delta = computeHrvDelta(normalized(pre), normalized(post), history);
    if (delta) out.push({ ...delta, sessionTs: s.ts, protocolId: s.proto || s.protocolId });
  }
  return out;
}

/**
 * Agregado k-anónimo de deltas RMSSD para dashboard organizacional.
 * Descarta entradas no numéricas. Retorna insufficient si n < minK.
 */
export function aggregateHrvDeltas(deltas, { minK = 5 } = {}) {
  const safe = Array.isArray(deltas) ? deltas : [];
  const valid = safe
    .map((d) => d?.deltaRmssd)
    .filter((v) => typeof v === "number" && isFinite(v));
  if (valid.length < minK) {
    return { insufficient: true, n: valid.length, minK };
  }
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((a, b) => a + (b - mean) ** 2, 0) / (valid.length - 1);
  const sd = Math.sqrt(variance);
  const se = sd / Math.sqrt(valid.length);
  const ci95 = 1.96 * se;
  const positivePct = Math.round(
    (valid.filter((v) => v > 0).length / valid.length) * 100
  );
  return {
    insufficient: false,
    n: valid.length,
    meanDelta: +mean.toFixed(1),
    sd: +sd.toFixed(1),
    ci95Lo: +(mean - ci95).toFixed(1),
    ci95Hi: +(mean + ci95).toFixed(1),
    positivePct,
    minK,
  };
}
