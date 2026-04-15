/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — NEURAL CALCULATION ENGINE
   Motor de cálculos neurológicos, métricas y predicciones
   ═══════════════════════════════════════════════════════════════ */

import { P } from "./protocols";
import { LVL, STATUS_MSGS, DAILY_PHRASES } from "./constants";

// ─── Level System ─────────────────────────────────────────
export function gL(s) {
  let l = LVL[0];
  for (const v of LVL) if (s >= v.m) l = v;
  return l;
}

export function lvPct(s) {
  const l = gL(s);
  if (s >= l.mx) return 100;
  return Math.round(((s - l.m) / (l.mx - l.m)) * 100);
}

export function nxtLv(s) {
  const i = LVL.findIndex((l) => l.n === gL(s).n);
  return i < LVL.length - 1 ? LVL[i + 1] : null;
}

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

// ─── Burnout Prediction Index ─────────────────────────────
export function calcBurnoutIndex(ml, hist) {
  ml = ml || []; hist = hist || [];
  if (ml.length < 5) return { index: 0, risk: "sin datos", trend: "neutral", prediction: "", avgMood: 3 };
  const last7 = ml.slice(-7);
  const prev7 = ml.slice(-14, -7);
  const avgR = last7.reduce((a, m) => a + m.mood, 0) / last7.length;
  const avgP = prev7.length >= 3 ? prev7.reduce((a, m) => a + m.mood, 0) / prev7.length : avgR;
  const trend = avgR - avgP;
  const lowC = last7.filter((m) => m.mood <= 2).length;
  const sessW = hist.filter((s) => Date.now() - s.ts < 7 * 86400000).length;
  const raw = Math.max(0, Math.min(100, 50 - trend * 15 + lowC * 10 - sessW * 2 + (avgR < 2.5 ? 20 : 0)));
  const idx = Math.round(raw);
  const flatAffect = ml.length >= 7 && ml.slice(-7).every((m) => m.mood === 3);
  const risk = flatAffect ? "moderado" : idx >= 70 ? "crítico" : idx >= 50 ? "alto" : idx >= 30 ? "moderado" : "bajo";
  const pred = flatAffect
    ? "Patrón de respuesta uniforme detectado. Posible desengagement. Variar protocolos recomendado."
    : idx >= 70 ? "Riesgo de agotamiento en 48h. Protocolo OMEGA recomendado."
    : idx >= 50 ? "Tendencia descendente detectada. Aumentar frecuencia de sesiones."
    : idx >= 30 ? "Estado estable con margen de mejora."
    : "Sistema en buen estado. Mantener ritmo.";
  return { index: idx, risk, trend: trend > 0.3 ? "mejorando" : trend < -0.3 ? "deteriorando" : "estable", prediction: pred, avgMood: +avgR.toFixed(1) };
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

// ─── Gaming Detection ─────────────────────────────────────
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

// ─── Insights Generator ──────────────────────────────────
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

// ─── Smart Suggest ────────────────────────────────────────
export function smartSuggest(st) {
  const h = new Date().getHours();
  const lastMood = (st.moodLog || []).slice(-1)[0]?.mood || 3;
  const lastP = (st.history || []).slice(-1)[0]?.p || "";
  let intent = "calma";
  if (h >= 6 && h < 10) intent = lastMood <= 2 ? "reset" : "energia";
  else if (h >= 10 && h < 14) intent = "enfoque";
  else if (h >= 14 && h < 18) intent = lastMood <= 2 ? "calma" : "enfoque";
  else intent = "calma";
  const opts = P.filter((p) => p.int === intent && p.n !== lastP);
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : P[0];
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
export function predictSessionImpact(st, protocol) {
  const ml = st.moodLog || [];
  const withProto = ml.filter(m => m.proto === protocol.n && m.pre > 0);
  if (withProto.length >= 2) {
    const avgDelta = withProto.reduce((a, m) => a + (m.mood - m.pre), 0) / withProto.length;
    return {
      predictedDelta: +avgDelta.toFixed(1),
      confidence: Math.min(95, 50 + withProto.length * 5),
      basis: "historial personal",
      message: avgDelta > 0 ? `+${avgDelta.toFixed(1)} puntos estimados basado en ${withProto.length} sesiones anteriores` : "Protocolo sin mejora demostrada. Considera cambiar."
    };
  }
  const intentSessions = ml.filter(m => {
    const p = P.find(pp => pp.n === m.proto);
    return p && p.int === protocol.int && m.pre > 0;
  });
  if (intentSessions.length >= 2) {
    const avgDelta = intentSessions.reduce((a, m) => a + (m.mood - m.pre), 0) / intentSessions.length;
    return {
      predictedDelta: +avgDelta.toFixed(1),
      confidence: Math.min(70, 30 + intentSessions.length * 4),
      basis: "protocolos similares",
      message: `+${avgDelta.toFixed(1)} estimado basado en protocolos de ${protocol.int}`
    };
  }
  return {
    predictedDelta: 0.8,
    confidence: 20,
    basis: "promedio global",
    message: "Primera sesión con este protocolo. Impacto promedio: +0.8"
  };
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
   ADVANCED NEURAL AI — Motor adaptativo v2
   Funciones de IA avanzada para recomendación y análisis
   ═══════════════════════════════════════════════════════════════ */

// ─── Adaptive Protocol Engine ────────────────────────────
// Motor inteligente que considera: hora, mood, historial, burnout,
// ritmo circadiano, efectividad personal, diversidad y carga cognitiva
export function adaptiveProtocolEngine(st) {
  const h = new Date().getHours();
  const circadian = getCircadian();
  const ml = st.moodLog || [];
  const hist = st.history || [];
  const burnout = calcBurnoutIndex(ml, hist);
  const lastMood = ml.slice(-1)[0]?.mood || 3;
  const sensitivity = calcProtoSensitivity(ml);
  const momentum = calcNeuralMomentum(st);

  // Determinar necesidad primaria por contexto
  let primaryNeed = circadian.intent;

  // Override por burnout
  if (burnout.risk === "crítico" || burnout.risk === "alto") {
    primaryNeed = "calma";
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

  // Puntuar cada candidato multidimensionalmente
  const scored = candidates.map((p) => {
    let score = 50;

    // Sensibilidad personal al protocolo (+/- 20)
    const sens = sensitivity[p.n];
    if (sens) {
      score += sens.avgDelta * 20;
      if (sens.sessions >= 5) score += 10;
    }

    // Diversidad: evitar repetir últimos 3 protocolos (-15)
    const last3 = hist.slice(-3).map((x) => x.p);
    if (last3.includes(p.n)) score -= 15;

    // Match de dificultad con nivel del usuario (+/-10)
    const level = gL(st.totalSessions);
    const levelIdx = LVL.findIndex((l) => l.n === level.n);
    if (p.dif <= levelIdx + 1) score += 5;
    if (p.dif > levelIdx + 2) score -= 10;

    // Bonus circadiano (+10)
    if (h < 10 && (p.int === "energia" || p.int === "enfoque")) score += 10;
    if (h >= 20 && p.int === "calma") score += 10;
    if (h >= 13 && h < 16 && p.int === "reset") score += 8;

    // Bonus favoritos (+8)
    if ((st.favs || []).includes(p.n)) score += 8;

    // Generar razón contextual
    const reason = _generateReason(p, primaryNeed, sens, burnout, momentum);

    return { protocol: p, score, reason };
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
    },
  };
}

function _generateReason(protocol, need, sensitivity, burnout, momentum) {
  if (burnout.risk === "crítico" || burnout.risk === "alto") {
    return "Prioridad: reducir riesgo de agotamiento neural";
  }
  if (sensitivity && sensitivity.avgDelta > 0.5) {
    return `Tu historial muestra +${sensitivity.avgDelta} puntos con este protocolo`;
  }
  if (momentum.direction === "descendente") {
    return "Recuperación de momentum neural recomendada";
  }
  const reasons = {
    calma: "Tu sistema necesita regulación parasimpática",
    enfoque: "Ventana óptima para activación prefrontal",
    energia: "Ciclo circadiano favorable para activación simpática",
    reset: "Descarga neural recomendada según tu estado",
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
      score > 30 ? "Momentum fuerte. Tu cerebro está en fase de crecimiento neural." :
      score > 10 ? "Tendencia positiva. Cada sesión consolida nuevas vías." :
      score > -10 ? "Estado estable. Mantén la frecuencia para no perder ganancia." :
      score > -30 ? "Momentum descendente. Aumenta frecuencia de sesiones." :
      "Pérdida de momentum. Sesión de reset urgente recomendada.",
    delta: Math.round(delta),
    recentAvg: Math.round(recentAvg),
    prevAvg: Math.round(prevAvg),
  };
}

// ─── Cognitive Load Estimator ────────────────────────────
// Estima la carga cognitiva actual del usuario basándose en
// hora del día, sesiones realizadas, mood y patrones temporales
export function estimateCognitiveLoad(st) {
  const h = new Date().getHours();
  const todaySessions = st.todaySessions || 0;
  const ml = st.moodLog || [];
  const lastMood = ml.slice(-1)[0]?.mood || 3;

  // Carga base por hora (recursos cognitivos se depletan durante el día)
  let base = h < 8 ? 15 : h < 10 ? 25 : h < 13 ? 40 : h < 15 ? 55 : h < 18 ? 60 : h < 21 ? 70 : 80;

  // Cada sesión reduce carga temporalmente (efecto de claridad post-sesión)
  base -= todaySessions * 10;

  // Ajuste por mood reciente
  if (lastMood <= 2) base += 15;
  else if (lastMood >= 4) base -= 10;

  // Ajuste por día de semana (lunes y viernes mayor carga)
  const dow = new Date().getDay();
  if (dow === 1) base += 8;
  if (dow === 5) base += 5;

  const load = Math.max(0, Math.min(100, Math.round(base)));

  return {
    load,
    level: load < 25 ? "bajo" : load < 45 ? "moderado" : load < 65 ? "alto" : "máximo",
    recommendation:
      load < 25 ? "Capacidad disponible — ideal para protocolos de enfoque o avanzados" :
      load < 45 ? "Carga moderada — protocolos de activación funcionarán bien" :
      load < 65 ? "Carga alta — prioriza reset o calma para desbloquear rendimiento" :
      "Carga máxima — sesión de descarga parasimpática necesaria",
    optimalDuration: load < 45 ? 1.5 : load < 65 ? 1 : 0.5,
    color: load < 25 ? "#059669" : load < 45 ? "#6366F1" : load < 65 ? "#D97706" : "#DC2626",
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
        ? "Neuroplasticidad consolidada. El hábito está cableado en tus ganglios basales."
        : st.streak >= 14
        ? "Dos semanas. Tu cerebro ya anticipa la sesión — dopamina preparatoria activa."
        : "Una semana. La mielina de tus nuevas vías se está fortaleciendo.",
    });
  }

  // 6. Diversidad de protocolos
  if (hist.length >= 10) {
    const last10Protos = new Set(hist.slice(-10).map((h) => h.p));
    if (last10Protos.size <= 2) {
      insights.push({
        type: "diversity", priority: 1, icon: "shuffle", color: "#8B5CF6",
        title: "Diversifica estímulos",
        message: `Solo ${last10Protos.size} protocolos en tus últimas 10 sesiones. Tu cerebro necesita variedad para evitar habituación.`,
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
      title: h < 12 ? "Tu cerebro te espera" : h < 18 ? "Pausa estratégica" : "Cierra el día con claridad",
      message: h < 12
        ? "Una sesión matutina activa la corteza prefrontal para las próximas 4 horas."
        : h < 18
        ? "2 minutos de regulación neural = 90 minutos de rendimiento sostenido."
        : "Resetea tu sistema antes de dormir. Tu cerebro consolida durante el sueño.",
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
    const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
    if (diff <= 1.5) {
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
