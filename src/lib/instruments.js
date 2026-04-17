/* ═══════════════════════════════════════════════════════════════
   INSTRUMENTS — escalas psicométricas validadas
   ═══════════════════════════════════════════════════════════════
   Instrumentos para anclar los claims del motor neural a literatura
   publicada y revisada por pares. La plataforma ya contiene NOM-035
   (México); esto añade estándares globales:

     - PSS-4   (Cohen & Williamson 1988) — estrés percibido mensual
     - SWEMWBS (Stewart-Brown et al. 2009) — bienestar trimestral
     - PHQ-2   (Kroenke, Spitzer & Williams 2003) — screener depresión

   Funciones puras — scoring, scheduling y agregación k-anónima.
   ═══════════════════════════════════════════════════════════════ */

// ─── PSS-4 ──────────────────────────────────────────────────────
// Perceived Stress Scale 4-item, 0-4 per item, total 0-16.
// Items q2 & q3 are positively-worded and reverse-scored.
// Cohen S, Williamson G. (1988). "Perceived stress in a probability
// sample of the United States." In: The Social Psychology of Health.
export const PSS4 = {
  id: "pss-4",
  name: "Perceived Stress Scale (PSS-4)",
  version: "Cohen & Williamson 1988",
  periodicity: "monthly",
  items: [
    { id: "q1", text: "¿Con qué frecuencia te has sentido incapaz de controlar las cosas importantes en tu vida?", reverse: false },
    { id: "q2", text: "¿Con qué frecuencia te has sentido confiado sobre tu capacidad para manejar tus problemas personales?", reverse: true },
    { id: "q3", text: "¿Con qué frecuencia has sentido que las cosas van como tú quieres?", reverse: true },
    { id: "q4", text: "¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no puedes superarlas?", reverse: false },
  ],
  scale: ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"], // 0..4
  min: 0,
  max: 16,
};

export function scorePss4(answers) {
  if (!answers || typeof answers !== "object") return null;
  let score = 0;
  for (const item of PSS4.items) {
    const v = answers[item.id];
    if (typeof v !== "number" || v < 0 || v > 4) return null;
    score += item.reverse ? 4 - v : v;
  }
  const level = score <= 5 ? "low" : score <= 9 ? "moderate" : "high";
  return { score, level, max: PSS4.max, instrumentId: PSS4.id };
}

// ─── SWEMWBS (WEMWBS-7) ────────────────────────────────────────
// Short Warwick-Edinburgh Mental Well-being Scale.
// Raw 7-35, converted to Rasch-transformed metric per Stewart-Brown
// et al. (2009) "Internal construct validity of the Warwick-Edinburgh
// Mental Well-being Scale (WEMWBS)." Health Qual Life Outcomes 7:15.
export const WEMWBS7 = {
  id: "wemwbs-7",
  name: "Short Warwick-Edinburgh Mental Well-being Scale",
  version: "Stewart-Brown 2009",
  periodicity: "quarterly",
  items: [
    { id: "q1", text: "He sentido optimismo sobre el futuro" },
    { id: "q2", text: "Me he sentido útil" },
    { id: "q3", text: "Me he sentido relajado" },
    { id: "q4", text: "He lidiado bien con los problemas" },
    { id: "q5", text: "He pensado con claridad" },
    { id: "q6", text: "Me he sentido cercano a otras personas" },
    { id: "q7", text: "He podido decidir sobre cosas por mí mismo" },
  ],
  scale: ["Ninguna vez", "Rara vez", "A veces", "A menudo", "Todo el tiempo"], // 1..5
  min: 7,
  max: 35,
};

// Official Rasch-transformed metric conversion (Stewart-Brown 2009, Table 3).
const SWEMWBS_METRIC = {
  7: 7.00, 8: 9.51, 9: 11.25, 10: 12.40, 11: 13.33, 12: 14.08, 13: 14.75,
  14: 15.32, 15: 15.84, 16: 16.36, 17: 16.88, 18: 17.43, 19: 17.98,
  20: 18.59, 21: 19.25, 22: 19.98, 23: 20.73, 24: 21.54, 25: 22.35,
  26: 23.21, 27: 24.11, 28: 25.03, 29: 25.99, 30: 27.03, 31: 28.13,
  32: 29.31, 33: 30.70, 34: 32.55, 35: 35.00,
};

export function scoreWemwbs7(answers) {
  if (!answers || typeof answers !== "object") return null;
  let raw = 0;
  for (const item of WEMWBS7.items) {
    const v = answers[item.id];
    if (typeof v !== "number" || v < 1 || v > 5) return null;
    raw += v;
  }
  const metric = SWEMWBS_METRIC[raw] ?? raw;
  // UK national norms (Warwick 2011): mean ≈ 23.6, SD ≈ 3.9
  // Thresholds: <19.5 (−1 SD) = low, ≥27 (+1 SD) = high
  const level = metric < 19.5 ? "low" : metric >= 27.0 ? "high" : "average";
  return {
    rawScore: raw,
    metricScore: +metric.toFixed(2),
    level,
    max: WEMWBS7.max,
    instrumentId: WEMWBS7.id,
  };
}

// ─── PHQ-2 ──────────────────────────────────────────────────────
// Patient Health Questionnaire 2-item depression screener.
// Sensitivity 83%, specificity 92% at cutoff ≥3 for MDD.
// Kroenke K, Spitzer RL, Williams JBW (2003). "The Patient Health
// Questionnaire-2: validity of a two-item depression screener."
// Medical Care, 41(11), 1284-1292.
export const PHQ2 = {
  id: "phq-2",
  name: "Patient Health Questionnaire (PHQ-2)",
  version: "Kroenke, Spitzer & Williams 2003",
  periodicity: "screening",
  items: [
    { id: "q1", text: "Poco interés o placer en hacer cosas" },
    { id: "q2", text: "Sentirte deprimido/a, triste o sin esperanza" },
  ],
  scale: ["Ningún día", "Varios días", "Más de la mitad de los días", "Casi todos los días"], // 0..3
  min: 0,
  max: 6,
};

export function scorePhq2(answers) {
  if (!answers || typeof answers !== "object") return null;
  let score = 0;
  for (const item of PHQ2.items) {
    const v = answers[item.id];
    if (typeof v !== "number" || v < 0 || v > 3) return null;
    score += v;
  }
  const positive = score >= 3;
  return {
    score,
    positive,
    action: positive ? "refer" : "continue",
    max: PHQ2.max,
    instrumentId: PHQ2.id,
  };
}

// ─── Scheduling ────────────────────────────────────────────────
const DAY = 86400000;
const PSS_INTERVAL = 30 * DAY;
const WEMWBS_INTERVAL = 90 * DAY;

export function nextInstrumentDue(history, now = Date.now()) {
  const safe = Array.isArray(history) ? history : [];
  const lastOf = (id) => {
    let last = null;
    for (const h of safe) {
      if (h?.instrumentId === id && typeof h.ts === "number") {
        if (last === null || h.ts > last) last = h.ts;
      }
    }
    return last;
  };
  const lastPss = lastOf("pss-4");
  if (!lastPss || now - lastPss >= PSS_INTERVAL) return "pss-4";
  const lastWemwbs = lastOf("wemwbs-7");
  if (!lastWemwbs || now - lastWemwbs >= WEMWBS_INTERVAL) return "wemwbs-7";
  return null;
}

// ─── Aggregation (k-anonymous) ──────────────────────────────────
export function aggregateInstrument(responses, instrumentId, { minK = 5 } = {}) {
  const safe = Array.isArray(responses) ? responses : [];
  const filtered = safe.filter(
    (r) => r?.instrumentId === instrumentId && typeof r.score === "number" && isFinite(r.score)
  );
  if (filtered.length < minK) {
    return { insufficient: true, n: filtered.length, minK };
  }
  const scores = filtered.map((r) => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (scores.length - 1);
  const sd = Math.sqrt(variance);
  const distribution = {};
  for (const r of filtered) {
    const lv = r.level || "unknown";
    distribution[lv] = (distribution[lv] || 0) + 1;
  }
  return {
    insufficient: false,
    n: filtered.length,
    mean: +mean.toFixed(2),
    sd: +sd.toFixed(2),
    distribution,
    minK,
  };
}
