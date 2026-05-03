// Copy fijo Tab Hoy v2. Sin invenciones libres: cada string proviene
// del spec de Sub-prompt 2 (greetings literales, bucket boundaries
// resolucion 2, FRASES_HOME_COACH explicitamente autorizado por el
// dueno como set fijo). NO agregar variantes sin pedir.

// Resolucion 2: boundaries de buckets temporales.
// Madrugada 00:00-05:59, Manana 06:00-11:59, Tarde 12:00-18:59,
// Noche 19:00-23:59.
export function bucketForHour(hour) {
  if (hour < 6) return "Madrugada";
  if (hour < 12) return "Manana"; // sin tilde para evitar mojibake en consts
  if (hour < 19) return "Tarde";
  return "Noche";
}

// Display label con tilde para UI.
export function bucketLabelForHour(hour) {
  if (hour < 6) return "MADRUGADA";
  if (hour < 12) return "MAÑANA";
  if (hour < 19) return "TARDE";
  return "NOCHE";
}

// Saludo dinamico por bucket. Strings literales del spec.
export function greetingForHour(hour) {
  if (hour < 6) return "Hola.";
  if (hour < 12) return "Buenos días.";
  if (hour < 19) return "Buenas tardes.";
  return "Buenas noches.";
}

// Linea coach humana — set fijo de variantes (10-15 segun spec).
// Eleccion guiada por dataMaturity + composite range + window data.
// La pieza secundaria se concatena solo si hay window data; si no,
// se usa "no-window" fallback dentro del set.

// Primarias por composite range (personalized).
export const PRIMARY_PERSONALIZED = {
  high:    "Recursos elevados.",       // >=80
  steady:  "Sistema estable.",         // 65-79
  medium:  "Reservas medianas.",       // 45-64
  recover: "Sistema en recuperación.",  // <45
};

// Primaria learning (sin importar composite).
export const PRIMARY_LEARNING = "Estamos aprendiendo tu patrón.";

// Secundarias relativas a ventana (FOMO suave Apollo).
export const SECONDARY_WINDOW = {
  hasBest:    (hhmm) => `Tu mejor ventana es a las ${hhmm}.`,
  countdown:  (h, m) => `Tu próxima ventana en ${h}h ${m}m.`,
  noWindowL:  (n)    => `Datos suficientes en ${n} sesiones más.`,
  noWindowP:  ()     => "Tu mejor ventana se está formando.",
};

// Selector primary line.
export function primaryLineForState({ dataMaturity, composite }) {
  if (dataMaturity === "learning") return PRIMARY_LEARNING;
  if (dataMaturity !== "personalized") return null;
  if (composite >= 80) return PRIMARY_PERSONALIZED.high;
  if (composite >= 65) return PRIMARY_PERSONALIZED.steady;
  if (composite >= 45) return PRIMARY_PERSONALIZED.medium;
  return PRIMARY_PERSONALIZED.recover;
}

// Selector secondary line.
// optimalWindow viene de suggestOptimalTime(state).best (puede ser null).
// totalSessions usado para fallback "Datos suficientes en N mas" en learning.
export function secondaryLineForState({ dataMaturity, optimalWindow, totalSessions }) {
  const now = new Date();
  if (optimalWindow && typeof optimalWindow.hour === "number") {
    const targetHour = optimalWindow.hour;
    const nowHour = now.getHours();
    const nowMin = now.getMinutes();
    let diffMin = (targetHour - nowHour) * 60 - nowMin;
    if (diffMin <= 0) diffMin += 24 * 60;
    if (diffMin <= 6 * 60) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return SECONDARY_WINDOW.countdown(h, m);
    }
    const hh = String(targetHour).padStart(2, "0");
    return SECONDARY_WINDOW.hasBest(`${hh}:00`);
  }
  if (dataMaturity === "learning") {
    const need = Math.max(1, 20 - (totalSessions || 0));
    return SECONDARY_WINDOW.noWindowL(need);
  }
  return SECONDARY_WINDOW.noWindowP();
}

// Descriptores humanos por dimension. Bands del spec.
// Ejemplos del spec: "Concentracion firme", "Suficiente", "Recuperando".
export function focusDescriptor(v) {
  if (v >= 80) return "Concentración firme";
  if (v >= 60) return "Concentración estable";
  if (v >= 40) return "Disperso";
  return "Recuperando";
}
export function calmDescriptor(v) {
  if (v >= 80) return "Parasimpático activo";
  if (v >= 60) return "Suficiente";
  if (v >= 40) return "Tensión leve";
  return "Recuperando";
}
export function energyDescriptor(v) {
  if (v >= 80) return "Reservas altas";
  if (v >= 60) return "Suficiente";
  if (v >= 40) return "Bajo combustible";
  return "Recuperando";
}

// Programa id -> tag de 2 letras (badge cuadrado).
export const PROGRAM_TAG = {
  "neural-baseline": "NB",
  "recovery-week": "RW",
  "focus-sprint": "FS",
  "burnout-recovery": "BR",
  "executive-presence": "EP",
};

// Programa id -> nombre brand literal.
export const PROGRAM_NAME = {
  "neural-baseline": "Neural Baseline",
  "recovery-week": "Recovery Week",
  "focus-sprint": "Focus Sprint",
  "burnout-recovery": "Burnout Recovery",
  "executive-presence": "Executive Presence",
};

// Programa id -> dias totales. Sincronizado con backend
// src/lib/programs.js field `duration`.
export const PROGRAM_DAYS = {
  "neural-baseline": 14,
  "recovery-week": 7,
  "focus-sprint": 5,
  "burnout-recovery": 28,
  "executive-presence": 10,
};

// Decision 5: humanizar tecnico en home. Descriptor del action card
// nunca es jerga (no "Reset neurocardiaco", "Coherencia 6-2-8", etc).
// El nombre brand del protocolo SI se respeta literal porque es marca.
export const INTENT_HUMAN = {
  calma:   "Calma tu sistema",
  enfoque: "Activa tu enfoque",
  energia: "Sube tu energía",
  reset:   "Reset de tu sistema",
};

export function humanIntentLabel(intent) {
  return INTENT_HUMAN[intent] || "Sesión guiada";
}
