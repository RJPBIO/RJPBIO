/* ═══════════════════════════════════════════════════════════════
   INSTRUMENTS — escalas psicométricas validadas
   ═══════════════════════════════════════════════════════════════
   Instrumentos para anclar los claims del motor neural a literatura
   publicada y revisada por pares. La plataforma ya contiene NOM-035
   (México); esto añade estándares globales:

     - PSS-4   (Cohen 1983) — estrés percibido mensual
     - SWEMWBS (Stewart-Brown et al. 2009) — bienestar trimestral
     - PHQ-2   (Kroenke, Spitzer & Williams 2003) — screener depresión
     - rMEQ    (Adan & Almirall 1991) — cronotipo (Phase 6D SP1)

   Funciones puras — scoring, scheduling y agregación k-anónima.
   ═══════════════════════════════════════════════════════════════ */

// ─── PSS-4 ──────────────────────────────────────────────────────
// Perceived Stress Scale 4-item, 0-4 per item, total 0-16.
// Items q2 & q3 are positively-worded and reverse-scored.
// Cohen S. (1983). "Perceived Stress in a sample of the United
// States." Reproduced in Cohen, Kamarck, Mermelstein "A global
// measure of perceived stress." Journal of Health and Social
// Behavior, 24(4), 385-396.
//
// Phase 6D SP2 — canonización Cohen 1983. Antes el repo tenía dos
// versiones divergentes: lib/instruments.js (esta) usaba Cohen &
// Williamson 1988 con escala "Casi siempre/Siempre" mientras
// NeuralCalibrationV2 usaba internal Cohen 1983 con "Frecuentemente/
// Muy frecuentemente". Adicionalmente InstrumentsView ya citaba
// "Cohen 1983 · 4 ítems" en el card label — el runner real ejecutaba
// Cohen & Williamson 1988 → mismatch visible al usuario. El scoring
// matemático es idéntico (mismos items reversed, mismo range 0-16);
// la diferencia es wording. Cohen 1983 es la versión original
// publicada y la más citada en literatura clínica.
export const PSS4 = {
  id: "pss-4",
  name: "Estrés percibido (PSS-4)",
  version: "Cohen 1983",
  periodicity: "monthly",
  items: [
    { id: "q1", text: "En el último mes, ¿con qué frecuencia te sentiste incapaz de controlar las cosas importantes de tu vida?", reverse: false },
    { id: "q2", text: "En el último mes, ¿con qué frecuencia te sentiste seguro/a sobre tu capacidad para manejar tus problemas personales?", reverse: true },
    { id: "q3", text: "En el último mes, ¿con qué frecuencia sentiste que las cosas iban como tú querías?", reverse: true },
    { id: "q4", text: "En el último mes, ¿con qué frecuencia sentiste que las dificultades se acumulaban tanto que no podías superarlas?", reverse: false },
  ],
  scale: ["Nunca", "Casi nunca", "A veces", "Frecuentemente", "Muy frecuentemente"], // 0..4
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

// ─── rMEQ ──────────────────────────────────────────────────────
// Reduced Morningness-Eveningness Questionnaire (5 ítems).
// Adan A, Almirall H. (1991). "Horne & Östberg morningness-
// eveningness questionnaire: A reduced scale." Personality and
// Individual Differences, 12(3), 241-253.
// Cada ítem tiene su propia escala de scores (NO Likert uniforme).
// Total range 4-25. Categorías:
//   4-7   definitely_evening
//   8-11  moderately_evening
//   12-17 intermediate
//   18-21 moderately_morning
//   22-25 definitely_morning
//
// El runner genérico (InstrumentRunner) espera answers como
// objeto { qN: scoreNumeric }. Para rMEQ el scoreNumeric ya es el
// peso del ítem (no índice de opción), porque cada opción tiene
// score directo (e.g. "Antes de 6:30" = 5, "Después de 11:00" = 1).
export const RMEQ = {
  id: "rmeq",
  name: "Cuestionario reducido de matutinidad-vespertinidad",
  version: "Adan & Almirall 1991",
  periodicity: "asNeeded",
  // items[].options sobrescribe la escala genérica del runner cuando
  // existe — permite scores no-Likert por ítem. Renderer (InstrumentRunner
  // legacy + futuro v2) debe respetar item.options si está presente.
  items: [
    {
      id: "q1",
      text: "Si fueras totalmente libre de planificar tu día, ¿a qué hora te levantarías?",
      options: [
        { label: "Antes de 6:30",    value: 5 },
        { label: "6:30 — 7:45",      value: 4 },
        { label: "7:45 — 9:45",      value: 3 },
        { label: "9:45 — 11:00",     value: 2 },
        { label: "Después de 11:00", value: 1 },
      ],
    },
    {
      id: "q2",
      text: "Después de despertar, ¿cómo te sientes en los primeros 30 minutos?",
      options: [
        { label: "Muy alerta",             value: 4 },
        { label: "Bastante alerta",        value: 3 },
        { label: "Bastante somnoliento/a", value: 2 },
        { label: "Muy somnoliento/a",      value: 1 },
      ],
    },
    {
      id: "q3",
      text: "¿A qué hora del día te sientes mejor para trabajar mentalmente?",
      options: [
        { label: "Pico mañana — antes de 11:00",  value: 6 },
        { label: "Pico mediodía",                 value: 4 },
        { label: "Pico tarde — después de 17:00", value: 2 },
        { label: "Pico noche — después de 21:00", value: 0 },
      ],
    },
    {
      id: "q4",
      text: "Cuando te acuestas tarde, ¿qué tipo de día sigue?",
      options: [
        { label: "Muy difícil",  value: 1 },
        { label: "Algo difícil", value: 2 },
        { label: "Normal",       value: 3 },
        { label: "Sin problema", value: 4 },
      ],
    },
    {
      id: "q5",
      text: "¿De qué tipo te consideras?",
      options: [
        { label: "Definitivamente matutino/a",      value: 6 },
        { label: "Más matutino/a que vespertino/a", value: 4 },
        { label: "Más vespertino/a que matutino/a", value: 2 },
        { label: "Definitivamente vespertino/a",    value: 0 },
      ],
    },
  ],
  // scale es fallback cuando un ítem no define options propias.
  // No se usa con rMEQ (todos los ítems tienen options) pero se
  // mantiene por contrato del runner.
  scale: [],
  min: 4,
  max: 25,
};

export function scoreRmeq(answers) {
  if (!answers || typeof answers !== "object") return null;
  let score = 0;
  for (const item of RMEQ.items) {
    const v = answers[item.id];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    score += v;
  }
  let chronotype, bestTimeWindow;
  if (score >= 22)      { chronotype = "definitely_morning"; bestTimeWindow = "morning"; }
  else if (score >= 18) { chronotype = "moderately_morning"; bestTimeWindow = "morning"; }
  else if (score >= 12) { chronotype = "intermediate";       bestTimeWindow = "midday"; }
  else if (score >= 8)  { chronotype = "moderately_evening"; bestTimeWindow = "afternoon"; }
  else                  { chronotype = "definitely_evening"; bestTimeWindow = "evening"; }
  return {
    score,
    chronotype,
    bestTimeWindow,
    level: chronotype, // alias para uniformidad con otros instrumentos
    instrumentId: RMEQ.id,
    max: RMEQ.max,
    min: RMEQ.min,
  };
}

// Mapeo categoría → label legible para UI (compartido entre
// CalibrationView, NeuralCalibrationV2 summary y future Profile).
const CHRONOTYPE_LABELS = {
  definitely_morning:  "Definitivamente matutino",
  moderately_morning:  "Más matutino",
  intermediate:        "Intermedio",
  moderately_evening:  "Más vespertino",
  definitely_evening:  "Definitivamente vespertino",
};

export function chronotypeLabel(c) {
  return CHRONOTYPE_LABELS[c] || "Intermedio";
}

// Helper para construir el shape persistido en store.chronotype.
// Combina los aliases que distintos consumers usan:
//   - prescriber.js               → .type
//   - ProfileView.jsx legacy      → .label, .score
//   - useAdaptiveRecommendation.js → truthy check
//   - ColdStartView (Phase 6D SP1) → truthy check
// Centralizar acá evita drift entre call sites.
export function buildChronotypeRecord(rmeqResult, ts = Date.now()) {
  if (!rmeqResult || typeof rmeqResult.score !== "number") return null;
  return {
    type: rmeqResult.chronotype,
    category: rmeqResult.chronotype,
    label: chronotypeLabel(rmeqResult.chronotype),
    score: rmeqResult.score,
    bestTimeWindow: rmeqResult.bestTimeWindow,
    ts,
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
