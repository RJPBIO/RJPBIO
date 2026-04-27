/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — NEURAL CALCULATION ENGINE
   Motor de cálculos neurológicos, métricas y predicciones
   ═══════════════════════════════════════════════════════════════ */

import { P } from "./protocols";
import { LVL, STATUS_MSGS, DAILY_PHRASES } from "./constants";
import { scoreArm, armKey, timeBucket } from "./neural/bandit";
import { getCircadianPersonalized } from "./neural/chronoCircadian";
import { calibratePrediction } from "./neural/residuals";
import { protocolBiasFromDomain, applyBiasToScore } from "./nom35/protocolBias";
import { NEURAL_CONFIG as NC } from "./neural/config";
import { getColdStartPrior, priorBonus, priorPredictionShape } from "./neural/coldStart";
import { detectStaleness, recalibrationGuidance, sampleAgeWeight } from "./neural/staleness";

// Re-export para que consumers puedan importar desde @/lib/neural
export { NEURAL_CONFIG } from "./neural/config";
export { evaluateEngineHealth } from "./neural/health";
export { getColdStartPrior, BASELINE_BY_BUCKET } from "./neural/coldStart";
export { detectStaleness, recalibrationGuidance, sampleAgeWeight } from "./neural/staleness";
export {
  detectGamingV2,
  analyzeRTVariance,
  analyzeTouchHoldUniformity,
  analyzeTimeOfDayDistribution,
  analyzeBioQDistribution,
  analyzeDurationUniformity,
} from "./neural/antiGaming";

// ─── Level System ─────────────────────────────────────────
/**
 * Resuelve el nivel del usuario dado un score (totalSessions).
 * @param {number} s - score (típicamente totalSessions)
 * @returns {{n:string, m:number, mx:number}} nivel correspondiente
 */
export function getLevel(s) {
  let l = LVL[0];
  for (const v of LVL) if (s >= v.m) l = v;
  return l;
}

/**
 * Porcentaje de progreso dentro del nivel actual (0-100).
 */
export function getLevelPercent(s) {
  const l = getLevel(s);
  if (s >= l.mx) return 100;
  return Math.round(((s - l.m) / (l.mx - l.m)) * 100);
}

/**
 * Próximo nivel a alcanzar, o null si está en el último nivel.
 */
export function getNextLevel(s) {
  const i = LVL.findIndex((l) => l.n === getLevel(s).n);
  return i < LVL.length - 1 ? LVL[i + 1] : null;
}

// Aliases legacy — mantenidos para backwards compat. Código nuevo debe
// usar getLevel/getLevelPercent/getNextLevel (Sprint 44 rename).
export const gL = getLevel;
export const lvPct = getLevelPercent;
export const nxtLv = getNextLevel;

export function getStatus(v) {
  for (const s of STATUS_MSGS) if (v >= s.min && v < s.max) return s;
  return STATUS_MSGS[3];
}

export function getWeekNum() {
  const d = new Date();
  const j = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - j) / 864e5 + j.getDay() + 1) / 7);
}

// ─── Daily Ignición ───────────────────────────────────────
export function getDailyIgn(st) {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
  const h = d.getHours();
  const lastMood = (st.moodLog || []).slice(-1)[0]?.mood || 3;
  let pool = P;
  if (h < 10) pool = P.filter((p) => p.int === "calma" || p.int === "energia");
  else if (h < 15) pool = P.filter((p) => p.int === "enfoque");
  else if (h < 19) pool = P.filter((p) => p.int === "enfoque" || p.int === "reset");
  else pool = P.filter((p) => p.int === "calma" || p.int === "reset");
  if (lastMood <= 2) pool = pool.filter((p) => p.dif <= 2);
  const pick = pool[seed % pool.length] || P[0];
  const phrase = DAILY_PHRASES[seed % DAILY_PHRASES.length];
  return { proto: pick, phrase };
}

// ─── Circadian Engine ─────────────────────────────────────
export function getCircadian() {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return { period: "amanecer", energy: "alta", voiceRate: 0.95, voicePitch: 1.05, warmth: 0, intent: "energia", uiWarmth: "0deg", audioFreq: "beta" };
  if (h >= 9 && h < 13) return { period: "mañana", energy: "máxima", voiceRate: 0.92, voicePitch: 1.0, warmth: 0, intent: "enfoque", uiWarmth: "0deg", audioFreq: "beta" };
  if (h >= 13 && h < 16) return { period: "mediodía", energy: "media", voiceRate: 0.90, voicePitch: 0.98, warmth: 10, intent: "reset", uiWarmth: "5deg", audioFreq: "alpha" };
  if (h >= 16 && h < 20) return { period: "tarde", energy: "descendente", voiceRate: 0.88, voicePitch: 0.95, warmth: 20, intent: "enfoque", uiWarmth: "10deg", audioFreq: "alpha" };
  if (h >= 20 && h < 23) return { period: "noche", energy: "baja", voiceRate: 0.82, voicePitch: 0.90, warmth: 40, intent: "calma", uiWarmth: "20deg", audioFreq: "theta" };
  return { period: "madrugada", energy: "mínima", voiceRate: 0.78, voicePitch: 0.88, warmth: 50, intent: "calma", uiWarmth: "25deg", audioFreq: "delta" };
}

// ─── BIO Quality Score ────────────────────────────────────
export function calcBioQuality(sd) {
  const interactions = sd.interactions || 0;
  const touchHolds = sd.touchHolds || 0;
  const motionSamples = sd.motionSamples || 0;
  const pauses = sd.pauses || 0;
  const iScore = Math.min(1, interactions / 3);
  const tScore = touchHolds >= 1 ? 1 : interactions >= 2 ? 0.5 : 0;
  const hasMotionPerm = motionSamples > 0;
  const mScore = hasMotionPerm ? (motionSamples >= 5 ? 1 : motionSamples >= 2 ? 0.6 : 0) : 0;
  const pauseP = Math.max(0, 1 - pauses * 0.2);
  const wI = hasMotionPerm ? 0.30 : 0.38;
  const wT = hasMotionPerm ? 0.25 : 0.32;
  const wM = hasMotionPerm ? 0.15 : 0;
  const raw = (iScore * wI + tScore * wT + mScore * wM + pauseP * 0.15 + 0.15) * 100;
  const score = Math.round(Math.max(5, Math.min(100, raw)));
  const quality = interactions === 0 && touchHolds === 0 ? "inválida" : score >= 70 ? "alta" : score >= 45 ? "media" : score >= 20 ? "baja" : "inválida";
  return { score, quality, iScore: Math.round(iScore * 100), mScore: Math.round(mScore * 100), tScore: Math.round(tScore * 100) };
}

// ─── Burnout Index ─────────────────────────────────────────
// Inspirado en los 3 componentes del Maslach Burnout Inventory
// (MBI-GS, Schaufeli 2002), adaptado a lo que podemos observar sin
// cuestionario:
//   1. Agotamiento emocional → tendencia negativa del mood reciente.
//   2. Distanciamiento / cinismo → varianza de mood comprimida
//      (respuestas "uniformes" = posible desengagement).
//   3. Realización reducida → caída en calidad de sesión (bioQ).
//
// Cada subíndice es 0..100. El índice agregado los combina con pesos
// iguales (MBI también los trata separadamente). No es diagnóstico:
// es un indicador interno que el motor usa para sesgar protocolos.
function _burnoutExhaustion(ml) {
  const cfg = NC.burnout;
  if (ml.length < cfg.minSamplesExhaustion) return { value: 0, reason: "datos insuficientes" };
  const w = cfg.windowDays;
  const last7 = ml.slice(-w);
  const prev7 = ml.slice(-w * 2, -w);
  const avgR = last7.reduce((a, m) => a + m.mood, 0) / last7.length;
  const avgP = prev7.length >= 3 ? prev7.reduce((a, m) => a + m.mood, 0) / prev7.length : avgR;
  const trend = avgR - avgP; // + = mejorando, − = empeorando
  // Escalón por nivel absoluto: mood sostenido muy bajo es la señal
  // más fuerte de exhaustion (independiente del trend).
  const baseLow = (cfg.exhaustionLowMoodThresholds.find((t) => avgR < t.max) || { value: 0 }).value;
  // Trend penalty: -1.0 → +25; +1.0 → -25 (cap entre floor y cap).
  const trendPenalty = Math.max(
    cfg.exhaustionTrendFloor,
    Math.min(cfg.exhaustionTrendCap, -trend * cfg.exhaustionTrendMultiplier)
  );
  return {
    value: Math.max(0, Math.min(100, Math.round(baseLow + trendPenalty + cfg.exhaustionOffset))),
    trend: +trend.toFixed(2),
    avgR: +avgR.toFixed(2),
  };
}

function _burnoutDisengagement(ml) {
  const cfg = NC.burnout;
  if (ml.length < cfg.minSamplesDisengage) return { value: 0, reason: "datos insuficientes" };
  const w = cfg.windowDays;
  const last7 = ml.slice(-w).map((m) => m.mood);
  const avg = last7.reduce((a, b) => a + b, 0) / last7.length;
  const variance = last7.reduce((a, m) => a + (m - avg) * (m - avg), 0) / last7.length;
  // Solo flat+neutro (avg ~3) cuenta como disengagement. Var 0 con mood
  // muy bajo es exhaustion sostenida, capturada en el otro componente.
  const neutral = avg >= cfg.disengageNeutralMin && avg <= cfg.disengageNeutralMax;
  const flat = variance < cfg.disengageVarianceFlat && neutral;
  if (variance < cfg.disengageVarianceFlat) {
    return { value: neutral ? 80 : 15, variance: +variance.toFixed(2), flat };
  }
  if (variance < cfg.disengageVarianceMid) return { value: 50, variance: +variance.toFixed(2), flat: false };
  if (variance < cfg.disengageVarianceHigh) return { value: 25, variance: +variance.toFixed(2), flat: false };
  return { value: 10, variance: +variance.toFixed(2), flat: false };
}

function _burnoutReducedEfficacy(hist) {
  if (hist.length < 6) return { value: 0, reason: "datos insuficientes" };
  const last5 = hist.slice(-5).filter((h) => typeof h.bioQ === "number");
  const prev5 = hist.slice(-10, -5).filter((h) => typeof h.bioQ === "number");
  if (last5.length < 3 || prev5.length < 3) return { value: 0, reason: "datos insuficientes" };
  const qR = last5.reduce((a, h) => a + h.bioQ, 0) / last5.length;
  const qP = prev5.reduce((a, h) => a + h.bioQ, 0) / prev5.length;
  const drop = qP - qR; // positivo = cayendo la calidad
  const baseFromLow = qR < 40 ? 30 : qR < 55 ? 15 : 0;
  const dropPenalty = Math.max(0, Math.min(40, drop));
  return {
    value: Math.max(0, Math.min(100, Math.round(baseFromLow + dropPenalty))),
    qualityRecent: Math.round(qR),
    qualityDrop: Math.round(drop),
  };
}

export function calcBurnoutIndex(ml, hist) {
  const cfg = NC.burnout;
  ml = ml || []; hist = hist || [];
  if (ml.length < cfg.minSamplesExhaustion) return { index: 0, risk: "sin datos", trend: "neutral", prediction: "", avgMood: 3, components: null };
  const exhaustion = _burnoutExhaustion(ml);
  const disengage = _burnoutDisengagement(ml);
  const efficacy = _burnoutReducedEfficacy(hist);
  const hasEfficacy = efficacy.value > 0 || efficacy.qualityRecent != null;
  const w = hasEfficacy ? cfg.weights.withEfficacy : cfg.weights.withoutEfficacy;
  const idx = Math.round(
    hasEfficacy
      ? exhaustion.value * w.exhaustion + disengage.value * w.disengage + efficacy.value * w.efficacy
      : exhaustion.value * w.exhaustion + disengage.value * w.disengage
  );
  const t = cfg.riskThresholds;
  const risk = disengage.flat ? "moderado"
    : idx >= t.critical ? "crítico"
    : idx >= t.high ? "alto"
    : idx >= t.moderate ? "moderado"
    : "bajo";
  const pred = disengage.flat
    ? "Respuestas uniformes detectadas. Posible desengagement. Variar protocolos ayuda a reactivar."
    : idx >= t.critical ? "Carga sostenida alta. Prioriza protocolos de calma y reduce exigencia esta semana."
    : idx >= t.high ? "Tendencia de fatiga detectada. Aumentar frecuencia de sesiones cortas."
    : idx >= t.moderate ? "Estado estable con margen de mejora."
    : "Estado dentro de rango saludable. Mantener ritmo.";
  const trendWord =
    exhaustion.trend > 0.3 ? "mejorando" : exhaustion.trend < -0.3 ? "deteriorando" : "estable";
  return {
    index: idx,
    risk,
    trend: trendWord,
    prediction: pred,
    avgMood: exhaustion.avgR ?? 3,
    components: { exhaustion, disengage, efficacy },
  };
}

// ─── BioSignal Score ──────────────────────────────────────
export function calcBioSignal(st) {
  const perf = Math.round(((st.coherencia || 50) + (st.resiliencia || 50) + (st.capacidad || 50)) / 3);
  const ml = st.moodLog || [];
  const rec = ml.slice(-7);
  const mAvg = rec.length ? rec.reduce((a, m) => a + m.mood, 0) / rec.length : 3;
  const cons = Math.min(1, (st.weeklyData || []).filter((v) => v > 0).length / 7);
  const bo = calcBurnoutIndex(ml, st.history);
  const sig = Math.round(perf * 0.3 + mAvg * 12 + cons * 20 - bo.index * 0.2);
  return { score: Math.max(0, Math.min(100, sig)), perf, mAvg: +mAvg.toFixed(1), consistency: Math.round(cons * 100), burnout: bo };
}

// ─── Protocol Sensitivity ─────────────────────────────────
export function calcProtoSensitivity(ml) {
  const m = (ml || []).filter((m) => m.pre > 0 && m.proto);
  const bp = {};
  m.forEach((x) => { if (!bp[x.proto]) bp[x.proto] = { d: [], c: 0 }; bp[x.proto].d.push(x.mood - x.pre); bp[x.proto].c++; });
  const r = {};
  Object.entries(bp).forEach(([n, d]) => { const a = d.d.reduce((a, b) => a + b, 0) / d.d.length; r[n] = { avgDelta: +a.toFixed(2), sessions: d.c, eff: a > 0.5 ? "alta" : a > 0 ? "media" : "baja" }; });
  return r;
}

// ─── Neural Fingerprint ───────────────────────────────────
export function calcNeuralFingerprint(st) {
  const ml = st.moodLog || []; const h = st.history || [];
  if (h.length < 10) return null;
  const hrs = Array(24).fill(0);
  h.forEach((x) => { hrs[new Date(x.ts).getHours()]++; });
  const peakHour = hrs.indexOf(Math.max(...hrs));
  const protoEff = calcProtoSensitivity(ml);
  const bestProto = Object.entries(protoEff).sort((a, b) => b[1].avgDelta - a[1].avgDelta)[0];
  const avgQuality = h.slice(-20).filter((x) => x.bioQ).reduce((a, x) => a + (x.bioQ || 50), 0) / Math.max(1, h.slice(-20).filter((x) => x.bioQ).length);
  const weekPattern = (st.weeklyData || []).map((v, i) => ({ day: ["L", "M", "X", "J", "V", "S", "D"][i], sessions: v }));
  const moodBaseline = ml.length >= 14 ? +(ml.slice(-14).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 14)).toFixed(1) : 3;
  return {
    peakHour, bestProto: bestProto ? bestProto[0] : "N/D", avgQuality: Math.round(avgQuality), weekPattern, moodBaseline,
    adaptationRate: h.length >= 20 ? +((h.slice(-10).reduce((a, x) => a + (x.c || 50), 0) / 10) - (h.slice(-20, -10).reduce((a, x) => a + (x.c || 50), 0) / 10)).toFixed(1) : 0,
    cognitiveBaseline: { focus: st.coherencia || 50, calm: st.resiliencia || 50, energy: st.capacidad || 50 },
  };
}

// ─── Cognitive Entropy ────────────────────────────────────
export function calcCognitiveEntropy(sessionData) {
  const rt = sessionData.reactionTimes || [];
  if (rt.length < 2) return { entropy: 0, state: "neutral" };
  const avg = rt.reduce((a, b) => a + b, 0) / rt.length;
  const variance = rt.reduce((a, t) => a + Math.pow(t - avg, 2), 0) / rt.length;
  const entropy = Math.min(100, Math.round(Math.sqrt(variance) * 10));
  const speed = avg < 400 ? "alta" : avg < 600 ? "media" : avg < 800 ? "normal" : "baja";
  const firstHalf = rt.slice(0, Math.floor(rt.length / 2));
  const secondHalf = rt.slice(Math.floor(rt.length / 2));
  const avgFirst = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avg;
  const avgSecond = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avg;
  const activationDelta = Math.round(avgFirst - avgSecond);
  return { entropy, state: entropy > 60 ? "alto — cerebro desordenado" : entropy > 30 ? "medio — procesamiento irregular" : "bajo — alta coherencia", avgReaction: Math.round(avg), speed, activationDelta, improved: activationDelta > 50 };
}

// ─── Touch Coherence Estimation ───────────────────────────
export function estimateCoherence(reactionTimes) {
  if (!reactionTimes || reactionTimes.length < 2) return { coherence: 0, consistency: 0, state: "sin datos" };
  const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
  const variance = reactionTimes.reduce((a, t) => a + Math.pow(t - avg, 2), 0) / reactionTimes.length;
  const cv = Math.sqrt(variance) / avg;
  const consistency = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
  const coherence = Math.round(Math.max(0, Math.min(100, consistency * 0.7 + Math.min(30, reactionTimes.length * 5))));
  const state = coherence >= 70 ? "alta coherencia" : coherence >= 40 ? "coherencia parcial" : "baja coherencia";
  return { coherence, consistency, state, avgRT: Math.round(avg) };
}

// ─── Gaming Detection (v1 legacy) ─────────────────────────
// Mantenido por backwards-compat — drop-in shape {gaming, reason}.
// Sprint 45: para detección moderna multi-signal con score, ver
// detectGamingV2 en src/lib/neural/antiGaming.js (re-exportado abajo).
export function detectGamingPattern(history) {
  if (!history || history.length < 5) return { gaming: false, reason: "" };
  const last10 = history.slice(-10);
  const zeroInteractions = last10.filter((h) => h.interactions === 0).length;
  if (zeroInteractions >= 8) return { gaming: true, reason: "Sin interacción en " + zeroInteractions + "/" + last10.length + " sesiones" };
  const qualities = last10.map((h) => h.bioQ || 0);
  const allSame = qualities.every((q) => q === qualities[0]) && qualities[0] < 30;
  if (allSame) return { gaming: true, reason: "Calidad idéntica y baja en todas las sesiones" };
  for (let i = 1; i < last10.length; i++) { if (last10[i].ts - last10[i - 1].ts < 30000) return { gaming: true, reason: "Sesiones con menos de 30s entre ellas" }; }
  return { gaming: false, reason: "" };
}

// ─── Recovery Index ───────────────────────────────────────
export function calcRecoveryIndex(moodLog) {
  if (!moodLog || moodLog.length < 4) return null;
  const withPre = moodLog.filter((m) => m.pre > 0 && m.mood > 0);
  if (withPre.length < 2) return null;
  const recoveries = [];
  for (let i = 1; i < withPre.length; i++) {
    const prev = withPre[i - 1]; const curr = withPre[i];
    const timeBetween = (curr.ts - prev.ts) / 3600000;
    const moodAtEnd = prev.mood; const moodAtNextStart = curr.pre;
    const retention = moodAtNextStart / Math.max(1, moodAtEnd);
    if (timeBetween > 0.5 && timeBetween < 48) recoveries.push({ hours: Math.round(timeBetween), retention: Math.round(retention * 100) });
  }
  if (!recoveries.length) return null;
  const avgRetention = Math.round(recoveries.reduce((a, r) => a + r.retention, 0) / recoveries.length);
  const avgHours = Math.round(recoveries.reduce((a, r) => a + r.hours, 0) / recoveries.length);
  return {
    avgRetention, avgHours, sessions: recoveries.length,
    interpretation: avgRetention >= 80 ? "Excelente retención. El efecto persiste " + avgHours + "h promedio." : avgRetention >= 60 ? "Retención moderada. Considerar 2 sesiones diarias." : "Baja retención. Aumentar frecuencia o cambiar protocolo.",
  };
}

// ─── Insights Generator (LEGACY) ─────────────────────────
/**
 * @deprecated desde Sprint 44 — usar `generateCoachingInsights(st)` para
 * insights más ricos y priorizados (10+ tipos de señal vs los ~6 de aquí).
 * Se mantiene por backwards compat con consumers existentes.
 *
 * Migration path: reemplazar `genIns(st)` con `generateCoachingInsights(st)`
 * y mapear el shape — el nuevo retorna {type, priority, icon, color, title,
 * message, action?} en lugar de {t, x}.
 */
export function genIns(st) {
  const r = [];
  if (st.totalSessions > 0) {
    const cG = st.coherencia - 64;
    if (cG > 10) r.push({ t: "up", x: `Enfoque +${cG} puntos desde el inicio.` });
    const rG = st.resiliencia - 66;
    if (rG > 5) r.push({ t: "up", x: `Calma sistémica +${rG}%.` });
    if (st.streak >= 3) r.push({ t: "fire", x: `${st.streak} días consecutivos. El hábito se consolida.` });
    if (st.totalTime > 0) r.push({ t: "star", x: `${Math.round(st.totalTime / 60)} minutos invertidos en rendimiento.` });
    const ml = st.moodLog || [];
    if (ml.length >= 3) {
      const a = ml.slice(-3).reduce((a, m) => a + m.mood, 0) / 3;
      if (a >= 4) r.push({ t: "up", x: "Tendencia emocional ascendente." });
      if (a <= 2) r.push({ t: "alert", x: "Tensión elevada detectada. Prioriza sesiones de Calma." });
      const hrs = st.history?.slice(-10).map((h) => new Date(h.ts).getHours()) || [];
      if (hrs.length >= 5) {
        const counts = {};
        hrs.forEach((h) => { const b = Math.floor(h / 3) * 3; counts[b] = (counts[b] || 0) + 1; });
        const peak = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (peak && peak[1] >= 3) {
          const peakH = parseInt(peak[0]);
          const now = new Date().getHours();
          if (Math.abs(now - peakH) <= 2 && st.todaySessions === 0) r.push({ t: "rec", x: `Tu hora pico es ${peakH}:00-${peakH + 3}:00. Aprovéchala ahora.` });
        }
      }
    }
    if (st.history?.length >= 3) {
      const l3 = st.history.slice(-3);
      if (l3.every((h) => h.p === l3[0].p)) {
        const o = P.find((p) => p.n !== l3[0].p);
        if (o) r.push({ t: "rec", x: `Diversifica: prueba ${o.n}.` });
      }
    }
  }
  const h = new Date().getHours();
  if (!r.find((x) => x.t === "rec")) r.push({ t: "rec", x: h < 12 ? "Reset Ejecutivo ideal para la mañana." : h < 17 ? "Protocolo OMEGA para la tarde." : "Reinicio Parasimpático para cerrar el día." });
  if (!r.length) r.push({ t: "star", x: "Tu primera ignición te espera." });
  return r;
}

// ─── Records ──────────────────────────────────────────────
export function getRecords(st) {
  const h = st.history || [];
  const bestStreak = Math.max(st.streak, ...[st.streak]);
  const maxC = h.length ? Math.max(...h.map((x) => x.c)) : st.coherencia;
  const protos = {};
  h.forEach((x) => { protos[x.p] = (protos[x.p] || 0) + 1; });
  const topProto = Object.entries(protos).sort((a, b) => b[1] - a[1])[0];
  const hours = h.map((x) => new Date(x.ts).getHours()).filter((x) => x > 0);
  const earliest = hours.length ? Math.min(...hours) : null;
  return { bestStreak, maxC, topProto: topProto ? { n: topProto[0], c: topProto[1] } : null, earliest };
}

// ─── Neural Variability Index (NEW) ──────────────────────
export function calcNeuralVariability(history) {
  if (!history || history.length < 3) return null;
  const last10 = history.slice(-10);
  const coherencias = last10.map(h => h.c || 50);
  const avg = coherencias.reduce((a, b) => a + b, 0) / coherencias.length;
  const variance = coherencias.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / coherencias.length;
  const variability = Math.round(Math.sqrt(variance));
  return {
    index: variability,
    interpretation: variability < 5 ? "Estabilidad alta — tu sistema es consistente" :
      variability < 15 ? "Variabilidad normal — adaptación activa" :
      "Alta variabilidad — tu sistema está en fase de ajuste",
    trend: coherencias.length >= 4 ? (coherencias.slice(-2).reduce((a,b)=>a+b,0)/2 > coherencias.slice(0,2).reduce((a,b)=>a+b,0)/2 ? "ascendente" : "descendente") : "neutral"
  };
}

// ─── Prediction Engine (NEW) ─────────────────────────────
// Returns predictedDelta + 80 % CI (lower/upper). CI is derived from
// the standard error of the sample mean (σ / √n), so más sesiones ⇒
// banda más estrecha. Si la muestra < 2, devolvemos banda amplia.
function _ciBand(deltas) {
  const cfg = NC.prediction;
  const n = deltas.length;
  const mean = deltas.reduce((a, b) => a + b, 0) / n;
  if (n < cfg.minSamplesForCI) {
    return { mean, lower: mean - cfg.fallbackBandHalfWidth, upper: mean + cfg.fallbackBandHalfWidth, se: null };
  }
  const variance = deltas.reduce((a, d) => a + (d - mean) * (d - mean), 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  const margin = cfg.ciZ * se;
  return { mean, lower: mean - margin, upper: mean + margin, se };
}

// Aplica calibración por residuales al final de cualquier predicción.
// Además ensancha el CI si detecta drift (últimas 5 entradas vs las 5
// previas cambian el signo del bias) — señal de no-estacionariedad.
function _applyResidualCalibration(raw, st, protocol) {
  const residuals = st?.predictionResiduals;
  if (!residuals || !Array.isArray(residuals.history) || residuals.history.length < 5) {
    return raw;
  }
  const calibrated = calibratePrediction(residuals, raw, { armId: protocol.int });
  if (!calibrated || !calibrated.calibrated) return raw;
  // Detectar drift: bias reciente vs bias antiguo.
  const cfgP = NC.prediction;
  const hist = residuals.history;
  if (hist.length >= cfgP.driftMinHistory) {
    const recent = hist.slice(-5).map(h => h.residual);
    const prev = hist.slice(-10, -5).map(h => h.residual);
    const mR = recent.reduce((a, b) => a + b, 0) / recent.length;
    const mP = prev.reduce((a, b) => a + b, 0) / prev.length;
    if (Math.sign(mR) !== Math.sign(mP) && Math.abs(mR - mP) > cfgP.driftThreshold) {
      const widen = Math.abs(mR - mP) * cfgP.driftWidenMultiplier;
      calibrated.lower = +(calibrated.lower - widen).toFixed(2);
      calibrated.upper = +(calibrated.upper + widen).toFixed(2);
      calibrated.confidence = Math.max(10, (calibrated.confidence || 0) - cfgP.driftConfidencePenalty);
      calibrated.drift = true;
    }
  }
  calibrated.predictedDelta = +Number(calibrated.predictedDelta).toFixed(1);
  return calibrated;
}

/**
 * Predice el impacto esperado de una sesión.
 *
 * @param {object}   st          - state del store
 * @param {object}   protocol    - protocolo objetivo (n, int)
 * @param {object}   [options]
 * @param {object|null} [options.chronotype] - resultado MEQ-SA. Si presente,
 *   activa el prior cronobiológico (Sprint 41) en cold-start.
 * @param {Date}     [options.now] - timestamp de evaluación (default: now)
 */
export function predictSessionImpact(st, protocol, options = {}) {
  const { chronotype = null, now = new Date() } = options;
  const cfg = NC.prediction;
  const ml = st.moodLog || [];
  const withProto = ml.filter(m => m.proto === protocol.n && m.pre > 0);
  let raw;
  if (withProto.length >= cfg.minSamplesForCI) {
    const deltas = withProto.map(m => m.mood - m.pre);
    const { mean, lower, upper } = _ciBand(deltas);
    raw = {
      predictedDelta: +mean.toFixed(1),
      lower: +lower.toFixed(2),
      upper: +upper.toFixed(2),
      confidence: Math.min(cfg.selfConfidenceCap, cfg.selfConfidenceBase + withProto.length * cfg.selfConfidenceBonus),
      sampleSize: withProto.length,
      basis: "historial personal",
      message: mean > 0 ? `+${mean.toFixed(1)} puntos estimados basado en ${withProto.length} sesiones anteriores` : "Protocolo sin mejora demostrada. Considera cambiar."
    };
  } else {
    const intentSessions = ml.filter(m => {
      const p = P.find(pp => pp.n === m.proto);
      return p && p.int === protocol.int && m.pre > 0;
    });
    if (intentSessions.length >= cfg.minSamplesForCI) {
      const deltas = intentSessions.map(m => m.mood - m.pre);
      const { mean, lower, upper } = _ciBand(deltas);
      raw = {
        predictedDelta: +mean.toFixed(1),
        lower: +lower.toFixed(2),
        upper: +upper.toFixed(2),
        confidence: Math.min(cfg.crossProtocolConfidenceCap, cfg.crossProtocolConfidenceBase + intentSessions.length * cfg.crossProtocolConfidenceBonus),
        sampleSize: intentSessions.length,
        basis: "protocolos similares",
        message: `+${mean.toFixed(1)} estimado basado en protocolos de ${protocol.int}`
      };
    } else {
      // Sprint 41 — si tenemos chronotype, usamos prior cronobiológico
      // condicionado a hora subjetiva + intent. Sin chronotype, mantenemos
      // el fallback global de toda la vida (compat hacia atrás).
      if (chronotype) {
        const prior = getColdStartPrior({
          chronotype,
          intent: protocol.int,
          now,
          sessionsCount: ml.length,
        });
        raw = priorPredictionShape(prior, "prior cronobiológico");
      } else {
        raw = {
          predictedDelta: cfg.fallbackPredictedDelta,
          lower: +(cfg.fallbackPredictedDelta - cfg.fallbackBandHalfWidth).toFixed(2),
          upper: +(cfg.fallbackPredictedDelta + cfg.fallbackBandHalfWidth).toFixed(2),
          confidence: cfg.coldStartConfidence,
          sampleSize: 0,
          basis: "promedio global",
          message: `Primera sesión con este protocolo. Impacto promedio: +${cfg.fallbackPredictedDelta}`
        };
      }
    }
  }
  return _applyResidualCalibration(raw, st, protocol);
}

// ─── Correlation Engine (NEW) ────────────────────────────
export function calcProtocolCorrelations(st) {
  const ml = st.moodLog || [];
  const withPre = ml.filter(m => m.pre > 0 && m.proto);
  if (withPre.length < 5) return null;

  const byProtocol = {};
  withPre.forEach(m => {
    if (!byProtocol[m.proto]) byProtocol[m.proto] = [];
    byProtocol[m.proto].push({ delta: m.mood - m.pre, hour: new Date(m.ts).getHours(), energy: m.energy || 2 });
  });

  const correlations = {};
  Object.entries(byProtocol).forEach(([name, data]) => {
    if (data.length < 2) return;
    const avgDelta = data.reduce((a, d) => a + d.delta, 0) / data.length;
    const morningData = data.filter(d => d.hour < 12);
    const afternoonData = data.filter(d => d.hour >= 12);
    const morningAvg = morningData.length ? morningData.reduce((a, d) => a + d.delta, 0) / morningData.length : 0;
    const afternoonAvg = afternoonData.length ? afternoonData.reduce((a, d) => a + d.delta, 0) / afternoonData.length : 0;

    correlations[name] = {
      avgDelta: +avgDelta.toFixed(2),
      sessions: data.length,
      bestTimeOfDay: morningAvg > afternoonAvg ? "mañana" : "tarde",
      morningDelta: +morningAvg.toFixed(2),
      afternoonDelta: +afternoonAvg.toFixed(2),
    };
  });
  return correlations;
}

/* ═══════════════════════════════════════════════════════════════
   MOTOR HEURÍSTICO ADAPTATIVO — v2
   Reglas estadísticas y pesos deterministas (no modelo ML entrenado).
   Decisiones basadas en: hora, mood, historial, ritmo circadiano,
   burnout index y carga cognitiva estimada.
   ═══════════════════════════════════════════════════════════════ */

// ─── Adaptive Protocol Engine ────────────────────────────
// Motor inteligente que considera: hora, mood, historial, burnout,
// ritmo circadiano, efectividad personal, diversidad, carga cognitiva,
// chronotype (hora subjetiva), bandit (exploración UCB) y bias
// NOM-035 (dominio de mayor riesgo psicosocial).
//
// Options (todas opcionales, sin romper compatibilidad):
//   - chronotype: resultado de MEQ-SA → desplaza el reloj circadiano
//   - banditArms: estado UCB1 por intent ({ calma, reset, energia, enfoque })
//   - porDominio: sumatorios crudos NOM-035 por dominio → aplica sesgo
//   - readiness: output de calcReadiness(...) — z-scores de HRV/RHR/sueño
export function adaptiveProtocolEngine(st, options = {}) {
  const { chronotype = null, banditArms = null, porDominio = null, readiness = null, currentMood = null } = options;
  const now = new Date();
  const h = now.getHours();
  // Reloj circadiano personalizado por chronotype (fallback al real).
  const circadian = chronotype
    ? getCircadianPersonalized(chronotype, now)
    : getCircadian();
  const ml = st.moodLog || [];
  const hist = st.history || [];
  const burnout = calcBurnoutIndex(ml, hist);
  // Override lastMood con el estado declarado en el picker pre-sesión si existe.
  // Esto vuelve el picker un controller vivo: el motor reacciona en tiempo real.
  const moodIsExplicit = typeof currentMood === "number" && currentMood >= 1 && currentMood <= 5;
  const lastMood = moodIsExplicit
    ? currentMood
    : (ml.slice(-1)[0]?.mood || 3);
  const sensitivity = calcProtoSensitivity(ml);
  const momentum = calcNeuralMomentum(st);
  const nom35Bias = porDominio ? protocolBiasFromDomain(porDominio) : null;
  // Sprint 42 — detectar staleness para escalar confianza en datos personales
  const staleness = detectStaleness(st, { now });
  const dataConfidence = staleness.dataConfidence;

  // Determinar necesidad primaria por contexto
  let primaryNeed = circadian.intent;

  // Override por burnout
  if (burnout.risk === "crítico" || burnout.risk === "alto") {
    primaryNeed = "calma";
  }
  // Override por readiness crítico: HRV/RHR/sueño fisiológicos mandan sobre
  // preferencias. "recover" → calma forzada; "primed" → permite activación.
  else if (readiness && readiness.score !== null && readiness.interpretation === "recover") {
    primaryNeed = "calma";
  }
  // Override por NOM-35 urgente (violencia) — tiene prioridad por sobre
  // tendencias recientes y momentum, pero cede ante burnout crítico.
  else if (nom35Bias && nom35Bias.urgent) {
    primaryNeed = nom35Bias.intent;
  }
  // Override por estado declarado en el picker pre-sesión (mood inmediato).
  // Solo cuando es explícito (no herencia del último log): el tap debe mover
  // la recomendación en tiempo real. Estable (3) no override — deja que el
  // circadiano/tendencia decidan.
  else if (moodIsExplicit && lastMood !== 3) {
    if (lastMood === 1) primaryNeed = "calma";
    else if (lastMood === 2) primaryNeed = "reset";
    else if (lastMood === 5) primaryNeed = "energia";
    else if (lastMood === 4 && h >= 8 && h < 20) primaryNeed = "enfoque";
  }
  // Override por tendencia emocional reciente
  else if (ml.length >= 3) {
    const recentAvg = ml.slice(-3).reduce((a, m) => a + m.mood, 0) / 3;
    if (recentAvg <= 2) primaryNeed = "reset";
    else if (recentAvg >= 4 && h >= 9 && h < 18) primaryNeed = "enfoque";
  }
  // Override por momentum negativo
  else if (momentum.direction === "descendente") {
    primaryNeed = "reset";
  }

  // Obtener candidatos
  let candidates = P.filter((p) => p.int === primaryNeed);
  if (!candidates.length) candidates = [...P];

  // Bucket temporal actual (contexto del bandit) y total de pulls.
  const bucket = timeBucket(now);
  const armsTotal = banditArms
    ? Object.values(banditArms).reduce((a, arm) => a + (arm?.n || 0), 0)
    : 0;

  // Puntuar cada candidato multidimensionalmente
  const sCfg = NC.scoring;
  const scored = candidates.map((p) => {
    let score = sCfg.baseScore;

    // Sensibilidad personal al protocolo (escalada por dataConfidence
    // si hay staleness — datos viejos pesan menos)
    const sens = sensitivity[p.n];
    if (sens) {
      score += sens.avgDelta * sCfg.sensitivity.deltaMultiplier * dataConfidence;
      if (sens.sessions >= sCfg.sensitivity.sessionsBonusThreshold) {
        score += sCfg.sensitivity.sessionsBonus * dataConfidence;
      }
    }

    // Diversidad: evitar repetir últimos 3 protocolos
    const last3 = hist.slice(-3).map((x) => x.p);
    if (last3.includes(p.n)) score += sCfg.diversityPenalty;

    // Match de dificultad con nivel del usuario
    const level = getLevel(st.totalSessions);
    const levelIdx = LVL.findIndex((l) => l.n === level.n);
    if (p.dif <= levelIdx + 1) score += sCfg.levelMatch.withinReach;
    if (p.dif > levelIdx + 2) score += sCfg.levelMatch.tooHigh;

    // Bonus circadiano
    if (h < 10 && (p.int === "energia" || p.int === "enfoque")) score += sCfg.circadianBonus.morningActivation;
    if (h >= 20 && p.int === "calma") score += sCfg.circadianBonus.eveningCalma;
    if (h >= 13 && h < 16 && p.int === "reset") score += sCfg.circadianBonus.midDayReset;

    // Bonus favoritos
    if ((st.favs || []).includes(p.n)) score += sCfg.favoritesBonus;

    // Bandit UCB1 contextual: mira primero el brazo (intent:bucket);
    // si está vacío, cae al brazo global (intent). El prior poblacional
    // hace que siempre devuelva un score finito, sin empates triviales.
    if (banditArms) {
      const ctxArm = banditArms[armKey(p.int, bucket)] || banditArms[p.int] || null;
      const ucb = scoreArm(ctxArm, armsTotal, sCfg.banditExplorationConst);
      if (Number.isFinite(ucb)) score += ucb * sCfg.banditUcbWeight;
    }

    // Readiness (HRV+RHR+sueño) alinea la activación fisiológica esperada.
    if (readiness && typeof readiness.score === "number") {
      if (readiness.interpretation === "recover") {
        if (p.int === "calma") score += sCfg.readinessBonus.recoverCalma;
        else if (p.int === "energia" || p.int === "enfoque") score += sCfg.readinessBonus.recoverActivePenalty;
      } else if (readiness.interpretation === "primed") {
        if (p.int === "energia" || p.int === "enfoque") score += sCfg.readinessBonus.primedActive;
        else if (p.int === "calma") score += sCfg.readinessBonus.primedCalmaPenalty;
      }
    }

    // Sesgo NOM-035 (dominio psicosocial dominante → intent preferido)
    if (nom35Bias) score = applyBiasToScore(score, p, nom35Bias);

    // Sprint 41 — Cold-start prior bonus. Aporta cuando totalSessions<5
    // O cuando hay staleness fuerte (recalibrate truthy) — el prior se
    // reactiva como si el usuario fuera nuevo, escalado por la pérdida
    // de confianza en sus datos personales.
    const totalSessions = (st.totalSessions || hist.length || 0);
    const stalenessBoosts = staleness.recalibrate !== false;
    if (totalSessions < 5 || stalenessBoosts) {
      // Effective sessionsCount: bajo staleness, fingimos menos sesiones
      // para que priorWeight sea > 0. Mapping: dataConfidence 1.0 → real,
      // dataConfidence 0.0 → cero sesiones (full prior).
      const effective = stalenessBoosts
        ? Math.round(totalSessions * dataConfidence)
        : totalSessions;
      const prior = getColdStartPrior({
        chronotype,
        intent: p.int,
        now,
        sessionsCount: effective,
      });
      score += priorBonus(prior);
    }

    // Generar razón contextual (prioriza NOM-35 si aplica)
    const reason = _generateReason(p, primaryNeed, sens, burnout, momentum, nom35Bias, readiness, moodIsExplicit, lastMood);

    return { protocol: p, score: +score.toFixed(2), reason };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    primary: scored[0],
    alternatives: scored.slice(1, 3),
    need: primaryNeed,
    context: {
      circadian: circadian.period,
      burnoutRisk: burnout.risk,
      lastMood,
      momentum: momentum.score,
      momentumDir: momentum.direction,
      chronotype: chronotype?.type || null,
      subjectiveHour: circadian.subjectiveHour ?? null,
      timeBucket: bucket,
      nom35Bias: nom35Bias
        ? { dominio: nom35Bias.dominio, intent: nom35Bias.intent, urgent: !!nom35Bias.urgent }
        : null,
      readiness: readiness && typeof readiness.score === "number"
        ? { score: readiness.score, interpretation: readiness.interpretation }
        : null,
      // Sprint 42 — staleness expone al consumer si el motor está
      // operando con datos potencialmente obsoletos.
      staleness: {
        level: staleness.level,
        daysSinceLast: staleness.daysSinceLast,
        dataConfidence: staleness.dataConfidence,
        recalibrate: staleness.recalibrate,
      },
      recalibration: recalibrationGuidance(staleness, { now }),
    },
  };
}

function _generateReason(protocol, need, sensitivity, burnout, momentum, nom35Bias, readiness, moodIsExplicit = false, lastMood = null) {
  if (burnout.risk === "crítico" || burnout.risk === "alto") {
    return "Prioridad: reducir riesgo de agotamiento sostenido";
  }
  if (readiness && readiness.interpretation === "recover") {
    return "Readiness bajo (HRV/sueño): prioriza recuperación parasimpática";
  }
  if (readiness && readiness.interpretation === "primed" && (protocol.int === "energia" || protocol.int === "enfoque")) {
    return `Readiness elevado (${readiness.score}): ventana para trabajo cognitivo exigente`;
  }
  if (nom35Bias && nom35Bias.urgent) {
    return "Prioridad: indicadores NOM-035 de violencia laboral requieren intervención formal";
  }
  if (nom35Bias && protocol.int === nom35Bias.intent) {
    return `Tu perfil NOM-035 (${nom35Bias.dominioLabel || nom35Bias.dominio}) indica ${nom35Bias.intent} como prioridad`;
  }
  if (moodIsExplicit && lastMood !== null) {
    if (lastMood === 1) return "Reportaste tensión alta: regulación parasimpática antes de cualquier carga";
    if (lastMood === 2) return "Reportaste agotamiento: descarga cognitiva antes de activar";
    if (lastMood === 5 && protocol.int === "energia") return "Estás en óptimo: ventana para capitalizar activación";
    if (lastMood === 4 && protocol.int === "enfoque") return "Reportaste enfoque: aprovecha la activación prefrontal actual";
  }
  if (sensitivity && sensitivity.avgDelta > 0.5) {
    return `Tu historial muestra +${sensitivity.avgDelta} puntos con este protocolo`;
  }
  if (momentum.direction === "descendente") {
    return "Recuperación de momentum recomendada";
  }
  const reasons = {
    calma: "Tu sistema necesita regulación parasimpática",
    enfoque: "Ventana óptima para activación prefrontal",
    energia: "Ciclo circadiano favorable para activación",
    reset: "Descarga cognitiva recomendada según tu estado",
  };
  return reasons[need] || "Protocolo adaptado a tu contexto actual";
}

// ─── Neural Momentum Score ───────────────────────────────
// Rastrea la dirección e intensidad del cambio en métricas neurales
export function calcNeuralMomentum(st) {
  const hist = st.history || [];
  if (hist.length < 5) return { score: 0, direction: "neutral", description: "Acumulando datos para calcular momentum", delta: 0 };

  const recent5 = hist.slice(-5);
  const prev5 = hist.slice(-10, -5);
  if (prev5.length < 3) return { score: 0, direction: "neutral", description: "Necesitas más sesiones para ver tendencia", delta: 0 };

  const recentAvg = recent5.reduce((a, h) => a + (h.c || 50), 0) / recent5.length;
  const prevAvg = prev5.reduce((a, h) => a + (h.c || 50), 0) / prev5.length;
  const delta = recentAvg - prevAvg;

  const streak = st.streak || 0;
  const weeklyTotal = (st.weeklyData || []).reduce((a, b) => a + b, 0);

  // Momentum = tendencia coherencia + consistencia + racha
  const raw = delta * 2 + streak * 1.5 + weeklyTotal * 2;
  const score = Math.max(-100, Math.min(100, Math.round(raw)));

  return {
    score,
    direction: score > 10 ? "ascendente" : score < -10 ? "descendente" : "estable",
    description:
      score > 30 ? "Momentum fuerte. Tu coherencia sube y la racha sostiene el ritmo." :
      score > 10 ? "Tendencia positiva. Cada sesión suma al promedio sin caer bajo la línea base." :
      score > -10 ? "Estado estable. Mantén la frecuencia para no perder el efecto acumulado." :
      score > -30 ? "Momentum descendente. Aumenta frecuencia de sesiones." :
      "Pérdida de momentum. Considera una sesión corta de reset hoy.",
    delta: Math.round(delta),
    recentAvg: Math.round(recentAvg),
    prevAvg: Math.round(prevAvg),
  };
}

// ─── Cognitive Load Estimator ────────────────────────────
// Estima la carga cognitiva actual combinando señales genéricas
// (hora, día, mood) con datos del propio usuario (sus horas pico
// históricas y su patrón por día de la semana). Si existe suficiente
// historial, este componente personal pesa más que las heurísticas.
export function estimateCognitiveLoad(st) {
  const now = new Date();
  const h = now.getHours();
  const dow = now.getDay();
  const todaySessions = st.todaySessions || 0;
  const ml = st.moodLog || [];
  const hist = st.history || [];
  const lastMood = ml.slice(-1)[0]?.mood || 3;

  // Curva base por hora: recursos cognitivos se depletan durante el día.
  let base = h < 8 ? 15 : h < 10 ? 25 : h < 13 ? 40 : h < 15 ? 55 : h < 18 ? 60 : h < 21 ? 70 : 80;

  // Señal personal 1: estamos dentro de la ventana pico histórica del
  // usuario (donde ha entrenado con mejor coherencia). En esa ventana
  // el rendimiento es demostrablemente mejor, así que bajamos carga.
  const rhythm = hist.length >= 8 ? analyzeNeuralRhythm(st) : null;
  if (rhythm?.isInPeakNow) base -= 12;
  else if (rhythm?.peakWindow) {
    const dist = Math.min(
      Math.abs(h - rhythm.peakWindow.start),
      Math.abs(h - (rhythm.peakWindow.end || rhythm.peakWindow.start + 2))
    );
    if (dist <= 1) base -= 6; // borde de la ventana
  }

  // Señal personal 2: densidad histórica por día de la semana. Si un
  // día tiene muchas sesiones es porque ahí el usuario ha tenido capacidad
  // (observado) → menor carga esperada. Si casi nunca entrena ese día,
  // probablemente está más cargado.
  if (hist.length >= 14) {
    const dayCounts = Array(7).fill(0);
    for (const x of hist) {
      const d = new Date(x.ts).getDay();
      dayCounts[d === 0 ? 6 : d - 1]++;
    }
    const todayIdx = dow === 0 ? 6 : dow - 1;
    const avgPerDay = dayCounts.reduce((a, b) => a + b, 0) / 7;
    const diff = dayCounts[todayIdx] - avgPerDay;
    // +1 sesión vs promedio → −4 de carga; −1 → +4 (acotado a ±12).
    base -= Math.max(-12, Math.min(12, diff * 4));
  } else {
    // Fallback heurístico cuando no tenemos historial suficiente.
    if (dow === 1) base += 8; // Lunes
    if (dow === 5) base += 5; // Viernes
  }

  // Cada sesión hoy reduce carga (claridad post-sesión).
  base -= todaySessions * 10;

  // Ajuste por mood reciente (observable).
  if (lastMood <= 2) base += 15;
  else if (lastMood >= 4) base -= 10;

  // Deuda de sueño: horas de la última noche contra target personal.
  // +6 de carga por cada hora faltante (capado a +20). Evidencia: deprivación
  // parcial de sueño reduce memoria de trabajo y control inhibitorio
  // (Lim & Dinges 2010, Psychol Bull 136:375).
  const sleepHours = typeof st.lastSleepHours === "number" ? st.lastSleepHours : null;
  const sleepTarget = typeof st.sleepTargetHours === "number" ? st.sleepTargetHours : 7.5;
  let sleepDebtUsed = false;
  if (sleepHours !== null && sleepHours > 0) {
    const deficit = Math.max(0, sleepTarget - sleepHours);
    if (deficit > 0) {
      base += Math.min(20, deficit * 6);
      sleepDebtUsed = true;
    }
  }

  const load = Math.max(0, Math.min(100, Math.round(base)));

  return {
    load,
    level: load < 25 ? "bajo" : load < 45 ? "moderado" : load < 65 ? "alto" : "máximo",
    recommendation:
      load < 25 ? "Capacidad disponible — ideal para protocolos de enfoque o avanzados" :
      load < 45 ? "Carga moderada — protocolos de activación funcionarán bien" :
      load < 65 ? "Carga alta — prioriza reset o calma para desbloquear rendimiento" :
      "Carga máxima — sesión corta de reset antes de seguir",
    optimalDuration: load < 45 ? 1.5 : load < 65 ? 1 : 0.5,
    color: load < 25 ? "#059669" : load < 45 ? "#6366F1" : load < 65 ? "#D97706" : "#DC2626",
    personalized: rhythm != null || hist.length >= 14 || sleepDebtUsed,
    sleepDebt: sleepDebtUsed ? +Math.max(0, sleepTarget - sleepHours).toFixed(1) : 0,
  };
}

// ─── Neural Rhythm Analyzer ─────────────────────────────
// Detecta patrones temporales en la actividad del usuario:
// horas pico, días preferidos, ventanas óptimas
export function analyzeNeuralRhythm(st) {
  const hist = st.history || [];
  if (hist.length < 8) return null;

  // Distribución por horas
  const hourCounts = Array(24).fill(0);
  const hourQuality = {};
  hist.forEach((x) => {
    const hr = new Date(x.ts).getHours();
    hourCounts[hr]++;
    if (!hourQuality[hr]) hourQuality[hr] = [];
    hourQuality[hr].push(x.c || 50);
  });

  // Encontrar ventanas de 2 horas con mejor rendimiento
  const windows = [];
  for (let start = 5; start < 23; start += 2) {
    const count = hourCounts[start] + (hourCounts[start + 1] || 0);
    const qualities = [...(hourQuality[start] || []), ...(hourQuality[start + 1] || [])];
    const avgQ = qualities.length ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length) : 0;
    windows.push({ start, end: start + 2, count, avgQuality: avgQ });
  }
  windows.sort((a, b) => b.count * (b.avgQuality || 1) - a.count * (a.avgQuality || 1));

  // Distribución por día de semana
  const dayCounts = Array(7).fill(0);
  hist.forEach((x) => {
    const d = new Date(x.ts).getDay();
    dayCounts[d === 0 ? 6 : d - 1]++;
  });
  const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // Regularidad (cuántos días de la semana tiene al menos 1 sesión)
  const activeDays = dayCounts.filter((d) => d > 0).length;

  return {
    peakWindow: windows[0] || null,
    secondWindow: windows[1] || null,
    bestDay: dayNames[bestDayIdx],
    activeDays,
    consistency: Math.round((activeDays / 7) * 100),
    pattern: (windows[0]?.count || 0) >= 5 ? "Ritmo establecido" : "Ritmo en formación",
    isInPeakNow: windows[0] ? new Date().getHours() >= windows[0].start && new Date().getHours() < windows[0].end : false,
  };
}

// ─── Dynamic Coaching Engine ─────────────────────────────
// Genera insights personalizados y accionables basados en el
// estado completo del usuario: momentum, burnout, ritmo, carga,
// diversidad de protocolos, efectividad y patrones temporales
export function generateCoachingInsights(st) {
  const insights = [];
  const ml = st.moodLog || [];
  const hist = st.history || [];
  const burnout = calcBurnoutIndex(ml, hist);
  const momentum = calcNeuralMomentum(st);
  const rhythm = analyzeNeuralRhythm(st);
  const load = estimateCognitiveLoad(st);
  const sens = calcProtoSensitivity(ml);

  // 1. Momentum
  if (momentum.direction === "ascendente") {
    insights.push({
      type: "momentum", priority: 2, icon: "trending-up", color: "#059669",
      title: "Momentum positivo",
      message: `Tu coherencia subió ${momentum.delta} puntos en las últimas sesiones. ${momentum.description}`,
    });
  } else if (momentum.direction === "descendente") {
    insights.push({
      type: "momentum", priority: 0, icon: "trending-down", color: "#DC2626",
      title: "Atención al momentum",
      message: momentum.description,
      action: "Sesión de reset recomendada",
    });
  }

  // 2. Burnout
  if (burnout.risk === "alto" || burnout.risk === "crítico") {
    insights.push({
      type: "burnout", priority: 0, icon: "alert-triangle", color: "#DC2626",
      title: "Alerta de agotamiento",
      message: burnout.prediction,
      action: "Prioriza protocolos de calma hoy",
    });
  }

  // 3. Ventana óptima
  if (rhythm && rhythm.isInPeakNow && (st.todaySessions || 0) === 0) {
    insights.push({
      type: "timing", priority: 1, icon: "clock", color: "#6366F1",
      title: "Ventana óptima activa",
      message: `Tu hora pico es ${rhythm.peakWindow.start}:00–${rhythm.peakWindow.end}:00. Estás en ella ahora.`,
      action: "Inicia sesión para máximo impacto",
    });
  }

  // 4. Carga cognitiva
  if (load.level === "máximo" || load.level === "alto") {
    insights.push({
      type: "load", priority: 1, icon: "gauge", color: "#D97706",
      title: `Carga cognitiva ${load.level}`,
      message: load.recommendation,
    });
  }

  // 5. Racha
  if (st.streak >= 7) {
    insights.push({
      type: "streak", priority: 2, icon: "fire", color: "#D97706",
      title: `${st.streak} días de racha`,
      message: st.streak >= 30
        ? "Un mes consecutivo. La consistencia en protocolos de autorregulación muestra efecto acumulado."
        : st.streak >= 14
        ? "Dos semanas. A esta altura la sesión ya compite por sí sola contra la fricción del día."
        : "Una semana. La práctica diaria empieza a sostenerse sin fuerza de voluntad.",
    });
  }

  // 6. Diversidad de protocolos
  if (hist.length >= 10) {
    const last10Protos = new Set(hist.slice(-10).map((h) => h.p));
    if (last10Protos.size <= 2) {
      insights.push({
        type: "diversity", priority: 1, icon: "shuffle", color: "#8B5CF6",
        title: "Diversifica estímulos",
        message: `Solo ${last10Protos.size} protocolos en tus últimas 10 sesiones. La variedad reduce habituación y mantiene el efecto.`,
        action: "Prueba un protocolo nuevo hoy",
      });
    }
  }

  // 7. Protocolo estrella (basado en sensibilidad personal)
  const bestProto = Object.entries(sens)
    .filter(([, d]) => d.avgDelta > 0.3 && d.sessions >= 2)
    .sort((a, b) => b[1].avgDelta - a[1].avgDelta)[0];
  if (bestProto) {
    insights.push({
      type: "effectiveness", priority: 2, icon: "star", color: "#059669",
      title: "Tu protocolo estrella",
      message: `${bestProto[0]} te genera +${bestProto[1].avgDelta} puntos promedio en ${bestProto[1].sessions} sesiones.`,
    });
  }

  // 8. Retención entre sesiones
  const recovery = calcRecoveryIndex(ml);
  if (recovery && recovery.avgRetention < 60) {
    insights.push({
      type: "recovery", priority: 1, icon: "refresh", color: "#D97706",
      title: "Retención baja",
      message: recovery.interpretation,
      action: "Considera 2 sesiones diarias para mantener el efecto",
    });
  }

  // 9. Consistencia semanal
  if (rhythm && rhythm.consistency < 50 && hist.length >= 14) {
    insights.push({
      type: "consistency", priority: 1, icon: "compass", color: "#6366F1",
      title: "Inconsistencia detectada",
      message: `Solo entrenas ${rhythm.activeDays} de 7 días. La regularidad multiplica resultados.`,
    });
  }

  // Si no hay insights, generar uno motivacional
  if (!insights.length) {
    const h = new Date().getHours();
    insights.push({
      type: "motivational", priority: 3, icon: "lightbulb", color: "#059669",
      title: h < 12 ? "Abre el día con un ancla" : h < 18 ? "Pausa estratégica" : "Cierra el día con claridad",
      message: h < 12
        ? "Una sesión matutina prepara el tono cognitivo antes de la primera demanda fuerte del día."
        : h < 18
        ? "Dos minutos de regulación respiratoria bajan activación y extienden el foco."
        : "Un reset antes de dormir separa trabajo y descanso — la calidad del sueño lo agradece.",
    });
  }

  // Ordenar por prioridad (0 = urgente, 3 = informacional)
  insights.sort((a, b) => a.priority - b.priority);
  return insights;
}

// ─── Protocol Diversity Score ────────────────────────────
export function calcProtocolDiversity(hist) {
  if (!hist || hist.length < 5) return { score: 0, uniqueCount: 0, totalAvailable: P.length, message: "Acumulando datos" };
  const unique = new Set(hist.map((h) => h.p));
  const score = Math.round((unique.size / P.length) * 100);
  return {
    score,
    uniqueCount: unique.size,
    totalAvailable: P.length,
    message:
      score >= 80 ? "Explorador completo — tu cerebro recibe estímulos variados" :
      score >= 50 ? "Diversidad moderada — aún hay protocolos por descubrir" :
      "Poca variedad — tu cerebro se habitúa. Explora nuevos protocolos.",
  };
}

// ─── Session Quality Trend ──────────────────────────────
export function calcSessionQualityTrend(hist) {
  if (!hist || hist.length < 5) return null;
  const last10 = hist.slice(-10).filter((h) => h.bioQ);
  if (last10.length < 3) return null;
  const half = Math.floor(last10.length / 2);
  const first = last10.slice(0, half);
  const second = last10.slice(half);
  const avgFirst = first.reduce((a, h) => a + h.bioQ, 0) / first.length;
  const avgSecond = second.reduce((a, h) => a + h.bioQ, 0) / second.length;
  const trend = avgSecond - avgFirst;
  return {
    current: Math.round(avgSecond),
    previous: Math.round(avgFirst),
    trend: Math.round(trend),
    direction: trend > 5 ? "mejorando" : trend < -5 ? "deteriorando" : "estable",
    message:
      trend > 10 ? "Tu calidad de sesión mejora. Mayor presencia y compromiso." :
      trend > 0 ? "Tendencia positiva en calidad. Sigue así." :
      trend > -10 ? "Calidad estable. Intenta mantener más presencia en sesión." :
      "La calidad baja. ¿Estás siguiendo las instrucciones con atención?",
  };
}

// ─── Streak Chain Analysis ──────────────────────────────
// Analiza la cadena de rachas históricas para detectar patrones
// de abandono y predecir probabilidad de mantener racha actual
export function analyzeStreakChain(st) {
  const hist = st.history || [];
  if (hist.length < 7) return null;

  // Reconstruir rachas históricas desde timestamps
  const dates = [...new Set(hist.map((h) => new Date(h.ts).toDateString()))].sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const streaks = [];
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    // DST safety: cambios horarios pueden hacer que un día tenga 23h o 25h.
    // Math.round() resuelve el delta a número entero de días, evitando
    // que una transición DST genere un break espurio.
    const diff = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000);
    if (diff <= 1) {
      currentStreak++;
    } else {
      streaks.push(currentStreak);
      currentStreak = 1;
    }
  }
  streaks.push(currentStreak);

  const maxStreak = Math.max(...streaks);
  const avgStreak = +(streaks.reduce((a, b) => a + b, 0) / streaks.length).toFixed(1);
  const breakPoints = streaks.filter((s) => s > 2).map((s) => s);
  const avgBreakPoint = breakPoints.length
    ? Math.round(breakPoints.reduce((a, b) => a + b, 0) / breakPoints.length)
    : 7;

  // Predict if current streak is at risk
  const currentStreakVal = st.streak || 0;
  const atRisk = currentStreakVal >= avgBreakPoint * 0.8;

  return {
    maxStreak,
    avgStreak,
    totalStreaks: streaks.length,
    avgBreakPoint,
    atRisk,
    currentStreak: currentStreakVal,
    prediction:
      currentStreakVal >= maxStreak
        ? "En tu mejor racha histórica. Cada día es un récord."
        : atRisk
        ? `Históricamente pierdes la racha alrededor del día ${avgBreakPoint}. Estás cerca — enfócate hoy.`
        : `Racha estable. Tu récord es ${maxStreak} días.`,
    streakHistory: streaks.slice(-10),
  };
}

// ─── Session Timing Optimizer ───────────────────────────
// Sugiere la hora óptima para la próxima sesión basándose en
// patrones de efectividad personal por hora del día
export function suggestOptimalTime(st) {
  const hist = st.history || [];
  if (hist.length < 10) return null;

  const hourBuckets = {};
  const ml = st.moodLog || [];

  hist.forEach((h) => {
    const hour = new Date(h.ts).getHours();
    const bucket = Math.floor(hour / 2) * 2; // 2-hour windows
    if (!hourBuckets[bucket]) hourBuckets[bucket] = { sessions: 0, totalC: 0, avgQuality: 0 };
    hourBuckets[bucket].sessions++;
    hourBuckets[bucket].totalC += h.c || 50;
  });

  // Enrich with mood deltas per time window
  ml.filter((m) => m.pre > 0).forEach((m) => {
    const hour = new Date(m.ts).getHours();
    const bucket = Math.floor(hour / 2) * 2;
    if (hourBuckets[bucket]) {
      if (!hourBuckets[bucket].deltas) hourBuckets[bucket].deltas = [];
      hourBuckets[bucket].deltas.push(m.mood - m.pre);
    }
  });

  // Score each bucket
  const scored = Object.entries(hourBuckets)
    .map(([bucket, data]) => {
      const avgC = data.totalC / data.sessions;
      const avgDelta = data.deltas?.length
        ? data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length
        : 0;
      return {
        hour: parseInt(bucket),
        sessions: data.sessions,
        avgCoherence: Math.round(avgC),
        avgDelta: +avgDelta.toFixed(2),
        score: avgC * 0.4 + avgDelta * 20 + data.sessions * 2,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    best: scored[0] || null,
    second: scored[1] || null,
    worst: scored[scored.length - 1] || null,
    recommendation: scored[0]
      ? `Tu ventana óptima es ${scored[0].hour}:00–${scored[0].hour + 2}:00 (coherencia: ${scored[0].avgCoherence}%, delta: +${scored[0].avgDelta})`
      : "Acumulando datos para optimizar tu horario",
  };
}

// ─── Calibration Baseline Scoring ───────────────────────
// Interpreta resultados de calibración y genera recomendaciones
export function interpretCalibration(baseline) {
  if (!baseline) return null;

  const strengths = [];
  const areas = [];

  if (baseline.rtScore >= 70) strengths.push("Velocidad de procesamiento alta");
  else if (baseline.rtScore < 40) areas.push("Velocidad de reacción — protocolos de enfoque ayudarán");

  if (baseline.bhScore >= 60) strengths.push("Buena capacidad respiratoria");
  else if (baseline.bhScore < 30) areas.push("Capacidad respiratoria — practica retención progresiva");

  if (baseline.focusAccuracy >= 70) strengths.push("Foco atencional fuerte");
  else if (baseline.focusAccuracy < 40) areas.push("Estabilidad atencional — entrena con Lightning Focus");

  if (baseline.stressScore >= 60) strengths.push("Estado emocional equilibrado");
  else if (baseline.stressScore < 40) areas.push("Regulación emocional — prioriza protocolos de calma");

  return {
    strengths,
    areas,
    primaryProtocol:
      baseline.recommendations?.primaryIntent === "calma"
        ? "Reinicio Parasimpático"
        : baseline.recommendations?.primaryIntent === "enfoque"
        ? "Activación Cognitiva"
        : "Pulse Shift",
    summary:
      strengths.length >= 3
        ? "Tu baseline indica alta capacidad cognitiva. Enfócate en protocolos avanzados."
        : strengths.length >= 2
        ? "Buen punto de partida. Los protocolos intermedios maximizarán tu progreso."
        : "Excelente momento para empezar. Los protocolos básicos construirán tu fundación neural.",
  };
}

// ─── Session Completion Calculator ───────────────────────
// Pure function: given current state + session context, returns new metrics.
// Sprint 44 — descompuesto en helpers privados para testabilidad y lectura.

/** Calcula nueva racha (streak) según fecha relativa de la última sesión. */
function _computeStreakUpdate(st, today, yesterday) {
  return st.lastDate === today ? st.streak
    : st.lastDate === yesterday ? st.streak + 1
    : 1;
}

/** Coherencia desde mood deltas + nivel base previo. */
function _computeCoherence(st, recentDeltas, avgDelta, cohBoost, cohDecay) {
  return Math.min(100, Math.max(20,
    recentDeltas.length >= 3
      ? Math.round(50 + avgDelta * 15 + recentDeltas.length * 2 + cohDecay)
      : st.coherencia + cohBoost + cohDecay
  ));
}

/** Resiliencia desde consistencia semanal + streak. */
function _computeResilience(weekTotal, streak) {
  const consistencyScore = Math.min(7, weekTotal) / 7;
  const streakBonus = Math.min(30, streak) * 0.5;
  return {
    value: Math.min(100, Math.max(20, Math.round(40 + consistencyScore * 30 + streakBonus))),
    consistencyScore,
  };
}

/** Capacidad desde diversidad de protocolos + experiencia (sqrt sessions). */
function _computeCapacity(uniqueProtos, totalSessions) {
  const diversityScore = (uniqueProtos / 14) * 30;
  const expScore = Math.min(30, Math.sqrt(totalSessions || 0) * 3);
  return Math.min(100, Math.max(20, Math.round(30 + diversityScore + expScore)));
}

/** Detecta partial / ligera y ajusta bioQ in-place. Retorna isPartial flag. */
function _classifyPartialSession(bioQ, sessionData, protocol, durMult) {
  const completeness = typeof sessionData?.completeness === "number" ? sessionData.completeness : 1;
  const isPartial = completeness < 0.85 || (sessionData?.hiddenSec || 0) > (protocol.d * durMult) * 0.3;
  if (isPartial && bioQ.quality !== "inválida") {
    bioQ.quality = "ligera";
    bioQ.score = Math.min(bioQ.score, 40);
  }
  return { isPartial, completeness };
}

/** Multiplicador de quality para vCores. */
function _qualityMultiplier(quality) {
  return quality === "alta" ? 1.5
    : quality === "media" ? 1.0
    : quality === "baja" ? 0.5
    : quality === "ligera" ? 0.4
    : 0.2;
}

/** Calcula achievements unlocked nuevos. Retorna array completo merged. */
function _computeAchievements(currentAch, ctx) {
  const { newStreak, newSessionsTotal, newCoherence, totalTime, hour, uniqueProtoCount } = ctx;
  const ach = [...currentAch];
  if (newStreak >= 7  && !ach.includes("streak7"))   ach.push("streak7");
  if (newStreak >= 30 && !ach.includes("streak30"))  ach.push("streak30");
  if (newCoherence >= 90 && !ach.includes("coherencia90")) ach.push("coherencia90");
  if (newSessionsTotal >= 50  && !ach.includes("sessions50"))  ach.push("sessions50");
  if (newSessionsTotal >= 100 && !ach.includes("sessions100")) ach.push("sessions100");
  if (totalTime >= 3600 && !ach.includes("time60")) ach.push("time60");
  if (hour < 7  && !ach.includes("earlyBird")) ach.push("earlyBird");
  if (hour >= 22 && !ach.includes("nightOwl"))  ach.push("nightOwl");
  if (uniqueProtoCount >= 14 && !ach.includes("allProtos")) ach.push("allProtos");
  return ach;
}

/** Construye el entry del history append. */
function _buildHistoryEntry(args) {
  const { protocol, durMult, sessionData, nfcCtx, circadian, eVC, newCoherence,
          newResilience, bioQ, burnoutIdx, bioSignalScore, isPartial, completeness } = args;
  const coh = sessionData?.coherenceLive;
  const coherenceLive = coh && typeof coh.score === "number"
    ? { score: coh.score, amplitude: coh.amplitude, phaseLock: coh.phaseLock, n: coh.n }
    : undefined;
  return {
    p: protocol.n, ts: Date.now(), vc: eVC, c: newCoherence, r: newResilience,
    dur: Math.round(protocol.d * durMult), ctx: nfcCtx?.type || "manual",
    bioQ: bioQ.score, quality: bioQ.quality,
    interactions: sessionData.interactions || 0,
    motionSamples: sessionData.motionSamples || 0,
    pauses: sessionData.pauses || 0,
    burnoutIdx,
    circadian: circadian?.period || "day",
    bioSignal: bioSignalScore,
    partial: !!isPartial,
    hiddenSec: Math.round(sessionData?.hiddenSec || 0),
    completeness: Math.round(completeness * 100) / 100,
    ...(coherenceLive ? { coherenceLive } : {}),
  };
}

export function calcSessionCompletion(st, sessionCtx) {
  const { protocol, durMult, sessionData, nfcCtx, circadian } = sessionCtx;
  const today = new Date().toDateString();
  const di = new Date().getDay();
  const ad = di === 0 ? 6 : di - 1;
  const nw = [...st.weeklyData];
  nw[ad] = (nw[ad] || 0) + 1;
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  let newStreak = _computeStreakUpdate(st, today, yesterday);
  // Ligeras NO avanzan racha (se recalcula más abajo tras determinar quality)

  const ml = st.moodLog || [];
  const hist = st.history || [];
  const recentDeltas = ml.filter((m) => m.pre > 0).slice(-10);
  const avgDelta = recentDeltas.length >= 2
    ? recentDeltas.reduce((a, m) => a + (m.mood - m.pre), 0) / recentDeltas.length
    : 0;
  const cohBoost = Math.max(0, Math.min(8, Math.round(avgDelta * 3 + 2)));
  const cohDecay = avgDelta <= 0 && recentDeltas.length >= 3 ? -3 : 0;
  const newCoherence = _computeCoherence(st, recentDeltas, avgDelta, cohBoost, cohDecay);

  const weekTotal = nw.reduce((a, b) => a + b, 0);
  const { value: newResilience, consistencyScore } = _computeResilience(weekTotal, newStreak);

  const uniqueProtos = new Set([...hist.map((h) => h.p), protocol.n]).size;
  const newCapacity = _computeCapacity(uniqueProtos, st.totalSessions);

  const newSessionsTotal = st.totalSessions + 1;
  const bioQ = calcBioQuality(sessionData);
  const gamingCheck = detectGamingPattern(hist);
  if (gamingCheck.gaming) { bioQ.score = Math.min(bioQ.score, 20); bioQ.quality = "inválida"; }

  const { isPartial, completeness } = _classifyPartialSession(bioQ, sessionData, protocol, durMult);

  const qualityMult = _qualityMultiplier(bioQ.quality);
  const eVC = Math.max(3, Math.round(
    (5 + (cohBoost * 1.5) + (consistencyScore * 5) + (uniqueProtos * 0.5)) * qualityMult
  ));
  if (bioQ.quality === "ligera") newStreak = st.streak; // no extiende racha
  const vc = (st.vCores || 0) + eVC;

  const totalT = (st.totalTime || 0) + Math.round(protocol.d * durMult);
  const hr = new Date().getHours();
  const ach = _computeAchievements(st.achievements, {
    newStreak,
    newSessionsTotal,
    newCoherence,
    totalTime: totalT,
    hour: hr,
    uniqueProtoCount: uniqueProtos,
  });

  const burnout = calcBurnoutIndex(ml, hist);
  const bioSignal = calcBioSignal(st);

  const newHist = [...hist, _buildHistoryEntry({
    protocol, durMult, sessionData, nfcCtx, circadian,
    eVC, newCoherence, newResilience, bioQ,
    burnoutIdx: burnout.index, bioSignalScore: bioSignal.score,
    isPartial, completeness,
  })].slice(-200);

  return {
    eVC,
    newState: {
      totalSessions: newSessionsTotal,
      streak: newStreak,
      todaySessions: st.lastDate === today ? st.todaySessions + 1 : 1,
      lastDate: today,
      weeklyData: nw,
      weekNum: getWeekNum(),
      coherencia: newCoherence,
      resiliencia: newResilience,
      capacidad: newCapacity,
      achievements: ach,
      vCores: vc,
      history: newHist,
      totalTime: totalT,
      firstDone: true,
      progDay: Math.min((st.progDay || 0) + 1, 7),
    },
    bioQ,
  };
}
