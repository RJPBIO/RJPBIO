/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — CHRONOTYPE ASSESSMENT
   Reduced MEQ-SA (Adan & Almirall 1991, validated short form)
   ───────────────────────────────────────────────────────────────
   Primary reference:
   - Adan A, Almirall H (1991). Horne & Östberg morningness-eveningness
     questionnaire: A reduced scale. Personality & Individual
     Differences, 12(3):241-253.
   - Horne JA, Östberg O (1976). A self-assessment questionnaire to
     determine morningness-eveningness in human circadian rhythms.
     Int J Chronobiol, 4(2):97-110.

   Scoring: sum of 5 items (range 4-25); classification per Adan.
   ═══════════════════════════════════════════════════════════════ */

export const MEQ_SA_QUESTIONS = [
  {
    id: 1,
    q: "Si pudieras planear libremente tu día sin obligaciones, ¿a qué hora te levantarías?",
    options: [
      { text: "5:00 – 6:30", score: 5 },
      { text: "6:30 – 7:45", score: 4 },
      { text: "7:45 – 9:45", score: 3 },
      { text: "9:45 – 11:00", score: 2 },
      { text: "11:00 – 12:00", score: 1 },
    ],
  },
  {
    id: 2,
    q: "Durante la primera media hora después de despertarte, ¿qué tan cansado te sientes?",
    options: [
      { text: "Muy cansado", score: 1 },
      { text: "Bastante cansado", score: 2 },
      { text: "Bastante fresco", score: 3 },
      { text: "Muy fresco", score: 4 },
    ],
  },
  {
    id: 3,
    q: "¿A qué hora de la noche te sientes cansado y necesitas dormir?",
    options: [
      { text: "20:00 – 21:00", score: 5 },
      { text: "21:00 – 22:15", score: 4 },
      { text: "22:15 – 00:30", score: 3 },
      { text: "00:30 – 01:45", score: 2 },
      { text: "01:45 – 03:00", score: 1 },
    ],
  },
  {
    id: 4,
    q: "Si siempre tuvieras que levantarte a las 6:00, ¿cómo sería para ti?",
    options: [
      { text: "Muy difícil y desagradable", score: 1 },
      { text: "Bastante difícil y desagradable", score: 2 },
      { text: "Poco desagradable pero sin mayor problema", score: 3 },
      { text: "Fácil y nada desagradable", score: 4 },
    ],
  },
  {
    id: 5,
    q: "Honestamente, ¿en qué tipo te clasificas?",
    options: [
      { text: "Claramente matutino", score: 6 },
      { text: "Más matutino que vespertino", score: 4 },
      { text: "Más vespertino que matutino", score: 2 },
      { text: "Claramente vespertino", score: 0 },
    ],
  },
];

/**
 * Classify chronotype by total score.
 * Bands per Adan & Almirall 1991 reduced MEQ cutoffs.
 * @param {number[]} answers - array of selected option scores
 */
export function classifyChronotype(answers) {
  if (!Array.isArray(answers) || answers.length !== MEQ_SA_QUESTIONS.length) {
    return null;
  }
  const total = answers.reduce((a, b) => a + b, 0);
  let type, label;
  if (total >= 19) { type = "definite_morning"; label = "Matutino definido"; }
  else if (total >= 17) { type = "moderate_morning"; label = "Matutino moderado"; }
  else if (total >= 12) { type = "intermediate"; label = "Intermedio"; }
  else if (total >= 8)  { type = "moderate_evening"; label = "Vespertino moderado"; }
  else                  { type = "definite_evening"; label = "Vespertino definido"; }
  return { score: total, type, label, ...scheduleRecommendation(type) };
}

/**
 * Recommend key windows given chronotype.
 * Based on circadian cortisol & core body temperature peaks for each
 * type (Roenneberg et al. 2007, Sleep Med Rev 11:429).
 */
function scheduleRecommendation(type) {
  const schedules = {
    definite_morning: {
      sleepWindow: "21:30 – 05:30",
      lightExposure: "05:45 – 06:15 (salida directa)",
      deepWork: "07:00 – 11:00",
      exercisePeak: "07:00 – 09:00",
      dinnerCutoff: "18:30",
      protocolsMorning: ["energia", "enfoque"],
      protocolsEvening: ["calma", "reset"],
    },
    moderate_morning: {
      sleepWindow: "22:30 – 06:30",
      lightExposure: "06:45 – 07:15",
      deepWork: "08:30 – 12:30",
      exercisePeak: "08:00 – 10:00",
      dinnerCutoff: "19:30",
      protocolsMorning: ["energia", "enfoque"],
      protocolsEvening: ["calma"],
    },
    intermediate: {
      sleepWindow: "23:00 – 07:00",
      lightExposure: "07:15 – 07:45",
      deepWork: "09:30 – 13:00 y 16:00 – 18:00",
      exercisePeak: "17:00 – 19:00",
      dinnerCutoff: "20:00",
      protocolsMorning: ["enfoque"],
      protocolsEvening: ["reset", "calma"],
    },
    moderate_evening: {
      sleepWindow: "00:30 – 08:30",
      lightExposure: "08:45 – 09:15",
      deepWork: "11:00 – 14:00 y 17:00 – 20:00",
      exercisePeak: "18:00 – 20:00",
      dinnerCutoff: "21:30",
      protocolsMorning: ["reset"],
      protocolsEvening: ["enfoque", "calma"],
    },
    definite_evening: {
      sleepWindow: "01:30 – 09:30",
      lightExposure: "10:00 – 10:30",
      deepWork: "14:00 – 18:00 y 20:00 – 22:30",
      exercisePeak: "19:00 – 21:00",
      dinnerCutoff: "22:30",
      protocolsMorning: ["reset"],
      protocolsEvening: ["enfoque", "calma"],
    },
  };
  return schedules[type] || schedules.intermediate;
}

/**
 * Check if a time is in the user's recommended deep-work window.
 * @param {string} type - chronotype key
 * @param {Date} [date]
 */
export function isInDeepWorkWindow(type, date = new Date()) {
  const rec = scheduleRecommendation(type);
  if (!rec.deepWork) return false;
  const hour = date.getHours() + date.getMinutes() / 60;
  const ranges = rec.deepWork.split(" y ").map((r) => {
    const [a, b] = r.split(" – ").map((t) => {
      const [h, m] = t.split(":").map(Number);
      return h + (m || 0) / 60;
    });
    return [a, b];
  });
  return ranges.some(([a, b]) => hour >= a && hour <= b);
}

/**
 * Return DLMO estimate (dim light melatonin onset) ≈ 2h before sleep onset.
 * Useful for blue-light-cutoff recommendations.
 */
export function estimateDLMO(type) {
  const rec = scheduleRecommendation(type);
  const sleepStart = rec.sleepWindow.split(" – ")[0];
  const [h, m] = sleepStart.split(":").map(Number);
  const dlmoH = ((h - 2) + 24) % 24;
  return `${String(dlmoH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
