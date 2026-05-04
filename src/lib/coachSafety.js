/* ═══════════════════════════════════════════════════════════════
   coachSafety — evaluador de señales de riesgo.

   Escanea estado y (opcionalmente) texto escrito por el usuario en
   busca de indicadores que exijan escalar: ideación suicida,
   auto-daño, crisis, PHQ-2 positivo sostenido, colapso del ánimo.

   Devuelve un nivel (`none|soft|crisis`), un mensaje humano y una
   lista de recursos adecuados al locale. La UI decide cómo render.
   No llama a ningún servicio — puro y testable.

   ESTE ARCHIVO ES CRÍTICO. Cualquier cambio requiere revisión
   con tests adversariales verdes.
   ═══════════════════════════════════════════════════════════════ */

const DAY = 86400000;

// Palabras ancla en español e inglés. Se usan como trigger amplio
// (false positives OK; false negatives no). La lista es pequeña y
// auditable; intencional — no queremos un filtro opaco.
//
// PHASE 6D SP5 — Expansión de patrones de ideación pasiva.
//
// Hallazgo Bug-05 reconnaissance: patrones previos solo capturaban
// frases explícitas ("suicidio", "matarme"). Ideación pasiva común
// en usuarios B2B en estrés crónico ("no veo salida", "no aguanto más",
// "ya no quiero seguir") pasaba el filtro y llegaba al LLM como
// mensaje regular — el coach respondía con tips de respiración a un
// usuario en señales pre-crisis.
//
// Patrones nuevos verificados contra:
//   - True positives: 12 frases pasivas comunes (ES + EN)
//   - False positives: 6 anti-regression cases con negative lookahead
//
// Si nuevo false positive detectado en producción, añadir exclusion
// específica con negative lookahead en lugar de eliminar pattern.
// Política: false positives son aceptables (CrisisCard ofrece recursos),
// false negatives son inaceptables (LLM responde a ideación con tips).
const CRISIS_PATTERNS = [
  /\bme\s+quiero\s+(morir|matar)\b/i,
  /\bquiero\s+(morir|matar(me)?)\b/i,
  /\bno\s+quiero\s+vivir\b/i,
  /\bsuicid(?:a|arme|io|arse)\b/i,
  /\b(me\s+)?voy\s+a\s+matar(me)?\b/i,
  /\bhacerme\s+da(?:ñ|n)o\b/i,
  /\bpensamientos\s+de\s+muerte\b/i,
  /\bkill\s+myself\b/i,
  /\bsuicide\b/i,
  /\bself[-\s]?harm\b/i,
  /\bend(\s+it|\s+my\s+life)\b/i,

  // PHASE 6D SP5 — ideación pasiva ES.
  // "no veo salida" — evita "no veo la salida del estacionamiento" via
  // exclusion explícita de objetos físicos comunes después.
  /\bno\s+veo\s+(?:la\s+)?salida\b(?!\s+(?:del?\s+)?(?:estacionamiento|edificio|metro|c(?:ine|asa)|hotel|aeropuerto|tunel|t[úu]nel|parking|garage)\b)/i,
  // "no aguanto más" — pero NO "no aguanto este calor/dolor de muelas/etc".
  // Negative lookahead exige que NO siga "este/esta/el/la <objeto físico>".
  /\b(?:ya\s+)?no\s+aguanto\s+m[áa]s\b(?!\s+(?:este|esta|el|la|los|las)\s+)/i,
  // "ya no quiero seguir/vivir/estar" — la triada núcleo de ideación pasiva.
  /\bya\s+no\s+quiero\s+(?:seguir|vivir|estar(?:\s+aqu[íi])?|continuar|despertar)\b/i,
  // "todo me pesa demasiado" / "todo me pesa mucho" / "todo me pesa".
  /\btodo\s+me\s+pesa(?:\s+(?:demasiado|mucho|tanto))?\b/i,
  // "me quiero ir" SIN destino físico ("a casa", "a dormir", "de viaje").
  /\bme\s+quiero\s+ir\b(?!\s+(?:a\s+\w|de\s+\w|al\s+\w|para\s+\w|contigo|con\s+\w))/i,
  // "no puedo más con (la vida|todo|mi vida|nada)" — escala a crisis cuando
  // el objeto es vital/global. NOTA: "no puedo más con esto" se mantiene en
  // SOFT_PATTERNS abajo porque "esto" es ambiguo (tarea, ruido, situación
  // específica) — escalarlo automático a crisis sería over-trigger.
  /\bno\s+puedo\s+m[áa]s\s+con\s+(?:la\s+vida|todo|mi\s+vida|nada)\b/i,
  // "no le veo sentido" / "no veo sentido a (vivir|nada|todo|seguir)".
  /\bno\s+(?:le\s+)?veo\s+sentido(?:\s+a\s+(?:vivir|nada|todo|seguir|esto|la\s+vida))?\b/i,
  // "estoy harto/a de (todo|vivir|esto|la vida)" — exclusión de objetos comunes.
  /\bestoy\s+hart[oa]\s+de\s+(?:todo|vivir|esto|la\s+vida|mi\s+vida)\b/i,
  // "no vale la pena (seguir|vivir)" / "no vale pena seguir".
  /\bno\s+vale(?:\s+la)?\s+pena(?:\s+(?:seguir|vivir|continuar))?\b/i,
  // "desaparecer (para siempre|de la faz|del mundo)".
  /\bdesaparecer\s+(?:para\s+siempre|de\s+la\s+faz|del\s+mundo|de\s+aqu[íi])\b/i,
  // "me siento atrapado/a" — señal de hopelessness fuerte.
  /\bme\s+siento\s+atrapad[oa]\b/i,
  // Auto-daño no suicida — "me quiero cortar" SIN objeto físico ("el pelo|las uñas").
  /\bme\s+quiero\s+cortar\b(?!\s+(?:el|las?|los)\s+(?:pelo|cabello|u[ñn]as|barba|bigote|fleco|patilla)s?\b)/i,
  // "quiero hacerme daño" — explícito, mantiene precedente del existente.
  /\bquiero\s+hacerme\s+da(?:ñ|n)o\b/i,
  // "me quiero lastimar" — auto-daño no específico.
  /\bme\s+quiero\s+lastimar\b/i,

  // PHASE 6D SP5 — passive ideation EN.
  /\bcan'?t\s+go\s+on\b(?!\s+(?:this|the|that|with\s+(?:this|the|that|him|her|them))\s+)/i,
  /\bno\s+way\s+out\b(?!\s+of\s+(?:this\s+(?:room|building|maze|hotel|garage|parking))\b)/i,
  /\bdon'?t\s+want\s+to\s+(?:exist|be\s+here|wake\s+up|live)\b/i,
  /\bbetter\s+off\s+(?:dead|without\s+me|gone)\b/i,
  /\bnothing\s+matters\s+anymore\b/i,
  /\btired\s+of\s+(?:living|everything|life|being\s+alive)\b/i,
  /\bwant\s+to\s+disappear\b(?!\s+(?:from\s+(?:this\s+(?:meeting|party|event)|the\s+(?:meeting|party|event)))\b)/i,
  /\bgive\s+up\s+on\s+(?:life|living|everything)\b/i,
];

const SOFT_PATTERNS = [
  /\bno\s+puedo\s+m[aá]s\b/i,
  /\bestoy\s+colapsad[oa]\b/i,
  /\bestoy\s+quebrad[oa]\b/i,
  /\bya\s+no\s+(aguanto|puedo)\b/i,
  /\bi\s+can'?t\s+(anymore|do\s+this)\b/i,
  /\bhopeless(ness)?\b/i,
];

export const SAFETY_RESOURCES = {
  es_MX: [
    { label: "SAPTEL (24/7, México)", contact: "800-290-0024" },
    { label: "Línea de la Vida", contact: "800-911-2000" },
    { label: "Emergencias", contact: "911" },
  ],
  es: [
    { label: "Teléfono de la Esperanza", contact: "+34 914 590 055" },
    { label: "024 — Atención a la conducta suicida (España)", contact: "024" },
  ],
  en: [
    { label: "988 Suicide & Crisis Lifeline (US)", contact: "988" },
    { label: "Crisis Text Line", contact: "Text HOME to 741741" },
  ],
  default: [
    { label: "Encuentra una línea local", contact: "https://findahelpline.com" },
  ],
};

function resolveResources(locale) {
  if (!locale) return SAFETY_RESOURCES.default;
  if (locale.startsWith("es-MX") || locale === "es-MX") return SAFETY_RESOURCES.es_MX;
  if (locale.startsWith("es")) return SAFETY_RESOURCES.es;
  if (locale.startsWith("en")) return SAFETY_RESOURCES.en;
  return SAFETY_RESOURCES.default;
}

function matchAny(text, patterns) {
  if (!text || typeof text !== "string") return false;
  for (const re of patterns) {
    if (re.test(text)) return true;
  }
  return false;
}

/**
 * Evalúa el riesgo combinando estado persistido + turno actual.
 *
 * @param {object} st  Store state (DS-shaped).
 * @param {object} [opts]
 * @param {string} [opts.userText]  Texto escrito por el usuario en este turno.
 * @param {string} [opts.locale]    Locale para elegir recursos.
 * @param {number} [opts.now=Date.now()]
 * @returns {{
 *   level: "none"|"soft"|"crisis",
 *   triggers: string[],
 *   message: string,
 *   resources: Array<{label:string, contact:string}>,
 *   recommendation: "continue"|"offer_support"|"refer_human"
 * }}
 */
export function evaluateSafetySignals(st, {
  userText = "",
  locale = "es",
  now = Date.now(),
} = {}) {
  const triggers = [];
  const safe = st || {};
  const instruments = Array.isArray(safe.instruments) ? safe.instruments : [];
  const moodLog = Array.isArray(safe.moodLog) ? safe.moodLog : [];

  // 1) Texto del usuario — trigger más fuerte.
  if (matchAny(userText, CRISIS_PATTERNS)) {
    triggers.push("text_crisis");
  } else if (matchAny(userText, SOFT_PATTERNS)) {
    triggers.push("text_soft");
  }

  // 2) Último PHQ-2 ≥ 3 (screening positivo).
  const phq2s = instruments
    .filter((e) => e?.instrumentId === "phq-2" && typeof e.score === "number")
    .sort((a, b) => a.ts - b.ts);
  if (phq2s.length && phq2s[phq2s.length - 1].score >= 3) {
    triggers.push("phq2_positive");
  }

  // 3) PSS-4 alto sostenido (2 mediciones consecutivas).
  const pss4s = instruments
    .filter((e) => e?.instrumentId === "pss-4" && typeof e.score === "number")
    .sort((a, b) => a.ts - b.ts);
  if (pss4s.length >= 2) {
    const last2 = pss4s.slice(-2);
    if (last2.every((e) => e.level === "high")) triggers.push("pss4_sustained_high");
  }

  // 4) Ánimo colapsado: ≥ 3 entradas de mood ≤ 2 en los últimos 7 días.
  const recentLow = moodLog.filter(
    (m) => typeof m?.mood === "number" && m.mood <= 2 && typeof m?.ts === "number" && now - m.ts <= 7 * DAY
  );
  if (recentLow.length >= 3) triggers.push("mood_sustained_low");

  const hasCrisis = triggers.includes("text_crisis");
  const softCount = triggers.filter((t) => t !== "text_crisis").length;

  let level = "none";
  if (hasCrisis) level = "crisis";
  else if (softCount >= 1) level = "soft";

  const resources = resolveResources(locale);

  let message = "";
  let recommendation = "continue";
  if (level === "crisis") {
    recommendation = "refer_human";
    message =
      "Lo que describes es importante y merece acompañamiento humano ahora, no una app. " +
      "Por favor contacta a una línea de crisis o a alguien de confianza. Estoy aquí, pero esto va más allá de lo que puedo hacer por ti.";
  } else if (level === "soft") {
    recommendation = "offer_support";
    message =
      "Noto señales sostenidas que sugieren una carga alta. Un profesional de salud mental puede ayudarte " +
      "a explorar esto con más profundidad. Mientras tanto, puedo acompañarte con protocolos suaves si lo prefieres.";
  }

  return { level, triggers, message, resources, recommendation };
}
