/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Chronotype-aware circadian
   Ajusta las ventanas horarias según el chronotype del usuario
   (MEQ-SA). El "reloj subjetivo" de un vespertino está desplazado
   ~2h respecto a un matutino (Roenneberg et al. 2007).

   Uso: `getCircadianPersonalized(chronotypeResult, now?)`
   El retorno es compatible con `getCircadian()` original.
   ═══════════════════════════════════════════════════════════════ */

/** Offset horario (h) que aplicamos según tipo. */
const OFFSET_BY_TYPE = Object.freeze({
  definite_morning:  -2,
  moderate_morning:  -1,
  intermediate:       0,
  moderate_evening:   1,
  definite_evening:   2,
});

export function chronotypeOffset(chronotype) {
  const t = chronotype?.type;
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
