/* ═══════════════════════════════════════════════════════════════
   NOM-035 domain → protocol bias
   Traduce el dominio NOM-035 con mayor riesgo relativo en sesgos
   concretos de protocolo BIO.

   Entrada: `porDominio` = { condiciones: N, carga: N, ... } (sumatorios
   crudos por dominio, salida de `scoreAnswers`).
   Salida: { dominio, relativeRisk, intent, weight, externalReferral,
            message } | null.

   "Relative risk" normaliza por el máximo posible de cada dominio
   (dado el número de ítems que contiene y la escala 0..4).
   ═══════════════════════════════════════════════════════════════ */
import { ITEMS, DOMINIOS } from "./items";

// Pre-calcula el máximo por dominio (ítems * 4)
const MAX_BY_DOMAIN = (() => {
  const acc = {};
  for (const it of ITEMS) {
    acc[it.dominio] = (acc[it.dominio] || 0) + 4;
  }
  return Object.freeze(acc);
})();

// Reglas de sesgo por dominio. `weight` in [0,1] modula cuánto
// dominar sobre circadiano. `externalReferral` marca casos donde
// BIO por sí solo no es suficiente y se sugiere RH/Medicina.
const DOMAIN_BIAS = Object.freeze({
  condiciones: {
    intent: "calma",
    weight: 0.3,
    externalReferral: false,
    message: "Ambiente físico detectado como riesgo. Reporta a seguridad e higiene; mientras, protocolos de calma reducen la activación.",
  },
  carga: {
    intent: "reset",
    weight: 0.7,
    externalReferral: false,
    message: "Carga elevada detectada. Protocolos de reset entre bloques de trabajo reducen fatiga cognitiva.",
  },
  falta_control: {
    intent: "calma",
    weight: 0.6,
    externalReferral: false,
    message: "Falta de control sobre la tarea eleva cortisol. Protocolos de calma ayudan a regular el sistema nervioso.",
  },
  jornada: {
    intent: "calma",
    weight: 0.7,
    externalReferral: false,
    message: "Jornadas extendidas afectan recuperación. Protocolos de calma antes de dormir mejoran el descanso.",
  },
  interferencia: {
    intent: "reset",
    weight: 0.6,
    externalReferral: false,
    message: "Interferencia trabajo-familia detectada. Un reset al final de la jornada separa los contextos.",
  },
  liderazgo: {
    intent: "calma",
    weight: 0.5,
    externalReferral: true,
    message: "Liderazgo negativo detectado. Habla con Recursos Humanos; protocolos de calma ayudan a sostener mientras se resuelve.",
  },
  relaciones: {
    intent: "calma",
    weight: 0.6,
    externalReferral: true,
    message: "Relaciones laborales como factor de riesgo. Busca apoyo con tu líder o RH.",
  },
  violencia: {
    intent: "calma",
    weight: 1.0,
    externalReferral: true,
    urgent: true,
    message: "Indicadores de violencia laboral. Esto requiere intervención formal de RH / Medicina del Trabajo; BIO no sustituye esa atención.",
  },
  reconocimiento: {
    intent: "energia",
    weight: 0.4,
    externalReferral: false,
    message: "Reconocimiento bajo afecta motivación. Protocolos de energía ayudan a sostener el impulso mientras se ajusta.",
  },
  pertenencia: {
    intent: "enfoque",
    weight: 0.4,
    externalReferral: false,
    message: "Bajo sentido de pertenencia. Protocolos de enfoque refuerzan agencia personal en la tarea.",
  },
});

/** Dominio con mayor riesgo relativo (score/max). */
export function topRiskDomain(porDominio) {
  if (!porDominio || typeof porDominio !== "object") return null;
  let best = null;
  for (const [dom, score] of Object.entries(porDominio)) {
    const max = MAX_BY_DOMAIN[dom];
    if (!max || typeof score !== "number") continue;
    const rel = score / max;
    if (!best || rel > best.relativeRisk) {
      best = { dominio: dom, score, max, relativeRisk: +rel.toFixed(3) };
    }
  }
  return best;
}

/**
 * Traduce porDominio en un sesgo concreto para el motor.
 * Devuelve null si no hay datos o el riesgo relativo < 0.3.
 */
export function protocolBiasFromDomain(porDominio, { threshold = 0.3 } = {}) {
  const top = topRiskDomain(porDominio);
  if (!top) return null;
  if (top.relativeRisk < threshold) return null;
  const rules = DOMAIN_BIAS[top.dominio];
  if (!rules) return null;
  const info = Object.values(DOMINIOS).find((d) => d.id === top.dominio);
  return {
    dominio: top.dominio,
    dominioLabel: info?.label || top.dominio,
    relativeRisk: top.relativeRisk,
    intent: rules.intent,
    weight: rules.weight,
    externalReferral: !!rules.externalReferral,
    urgent: !!rules.urgent,
    message: rules.message,
  };
}

/**
 * Aplica el sesgo a un score base de un protocolo candidato.
 * `baseScore` es el puntaje que produjo `adaptiveProtocolEngine`.
 * Si el protocolo comparte intención con el bias, suma `weight*20` pts.
 * Si va en contra (distinto intent), resta `weight*10`.
 */
export function applyBiasToScore(baseScore, protocol, bias) {
  if (!bias || !protocol) return baseScore;
  if (protocol.int === bias.intent) return baseScore + bias.weight * 20;
  return baseScore - bias.weight * 10;
}

export { MAX_BY_DOMAIN, DOMAIN_BIAS };
