/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Chronotype-aware circadian
   Ajusta las ventanas horarias según el chronotype del usuario
   (MEQ-SA). El "reloj subjetivo" de un vespertino está desplazado
   ~2h respecto a un matutino (Roenneberg et al. 2007).

   Uso: `getCircadianPersonalized(chronotypeResult, now?)`
   El retorno es compatible con `getCircadian()` original.
   ═══════════════════════════════════════════════════════════════ */

/** Offset horario (h) por tipo discreto (fallback si no hay score). */
const OFFSET_BY_TYPE = Object.freeze({
  definite_morning:  -2,
  moderate_morning:  -1,
  intermediate:       0,
  moderate_evening:   1,
  definite_evening:   2,
});

/**
 * Interpolación continua del offset a partir del score MEQ-SA reducido
 * (rango 4–25; mayor = más matutino). Anclas = punto medio de cada banda
 * (Adan & Almirall 1991), con interpolación lineal entre anclas.
 *
 * Permite resoluciones intermedias — p. ej. dos usuarios clasificados
 * como "moderate_morning" (score 17 vs 18) ya no reciben el mismo offset.
 */
const SCORE_ANCHORS = Object.freeze([
  [5.5,  2],   // medio de definite_evening (4–7)
  [9.5,  1],   // medio de moderate_evening (8–11)
  [14,   0],   // medio de intermediate (12–16)
  [17.5, -1],  // medio de moderate_morning (17–18)
  [22,  -2],   // medio de definite_morning (19–25)
]);

function offsetFromScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return null;
  if (s <= SCORE_ANCHORS[0][0]) return SCORE_ANCHORS[0][1];
  const last = SCORE_ANCHORS[SCORE_ANCHORS.length - 1];
  if (s >= last[0]) return last[1];
  for (let i = 0; i < SCORE_ANCHORS.length - 1; i++) {
    const [x0, y0] = SCORE_ANCHORS[i];
    const [x1, y1] = SCORE_ANCHORS[i + 1];
    if (s >= x0 && s <= x1) {
      const t = (s - x0) / (x1 - x0);
      return +(y0 + t * (y1 - y0)).toFixed(3);
    }
  }
  return 0;
}

export function chronotypeOffset(chronotype) {
  if (!chronotype) return 0;
  // Preferimos el score numérico cuando existe: más resolución que los 5 tipos.
  const fromScore = offsetFromScore(chronotype.score);
  if (fromScore !== null) return fromScore;
  const t = chronotype.type;
  if (!t) return 0;
  const v = OFFSET_BY_TYPE[t];
  return typeof v === "number" ? v : 0;
}

/**
 * Devuelve la "hora subjetiva": lo que un intermediate viviría a la hora
 * real actual para este usuario. Ejemplo: usuario vespertino definido
 * a las 9:00 reales vive subjetivamente las 7:00.
 */
export function subjectiveHour(chronotype, date = new Date()) {
  const offset = chronotypeOffset(chronotype);
  const h = date.getHours() + date.getMinutes() / 60;
  // subjective = real - offset (un vespertino, offset +2, a las 9 reales
  // está viviendo sus 7 subjetivas)
  let sh = h - offset;
  if (sh < 0) sh += 24;
  if (sh >= 24) sh -= 24;
  return sh;
}

/**
 * Replica la lógica de `getCircadian` original pero usando la hora
 * SUBJETIVA. Salida idéntica en forma al original para drop-in.
 */
export function circadianFromHour(hSubjective) {
  const h = hSubjective;
  if (h >= 5 && h < 9)   return { period: "amanecer",  energy: "alta",        voiceRate: 0.95, voicePitch: 1.05, warmth: 0,  intent: "energia", uiWarmth: "0deg",  audioFreq: "beta" };
  if (h >= 9 && h < 13)  return { period: "mañana",    energy: "máxima",      voiceRate: 0.92, voicePitch: 1.0,  warmth: 0,  intent: "enfoque", uiWarmth: "0deg",  audioFreq: "beta" };
  if (h >= 13 && h < 16) return { period: "mediodía",  energy: "media",       voiceRate: 0.90, voicePitch: 0.98, warmth: 10, intent: "reset",   uiWarmth: "5deg",  audioFreq: "alpha" };
  if (h >= 16 && h < 20) return { period: "tarde",     energy: "descendente", voiceRate: 0.88, voicePitch: 0.95, warmth: 20, intent: "enfoque", uiWarmth: "10deg", audioFreq: "alpha" };
  if (h >= 20 && h < 23) return { period: "noche",     energy: "baja",        voiceRate: 0.82, voicePitch: 0.90, warmth: 40, intent: "calma",   uiWarmth: "20deg", audioFreq: "theta" };
  return                        { period: "madrugada", energy: "mínima",      voiceRate: 0.78, voicePitch: 0.88, warmth: 50, intent: "calma",   uiWarmth: "25deg", audioFreq: "delta" };
}

/**
 * Versión personalizada: aplica offset por chronotype. Sin chronotype
 * se comporta igual que el original.
 */
export function getCircadianPersonalized(chronotype, date = new Date()) {
  const sh = subjectiveHour(chronotype, date);
  const base = circadianFromHour(sh);
  return {
    ...base,
    subjectiveHour: +sh.toFixed(2),
    offsetHours: chronotypeOffset(chronotype),
  };
}
