// Fixtures realistas para Tab Coach en dev. NO mutan store.
// Override flags via ?coach=empty|conversation|streaming|quota|weekly|all.

const MIN = 60 * 1000;

export const FIXTURE_QUOTA = {
  used: 23,
  max: 100,
  plan: "PRO",
};

export const FIXTURE_QUOTA_EXCEEDED = {
  used: 5,
  max: 5,
  plan: "FREE",
};

export const FIXTURE_QUOTA_FREE = {
  used: 2,
  max: 5,
  plan: "FREE",
};

// Weekly summary mock — texto narrativo Haiku 4.5.
// ISO week 18 corresponde a primera semana de mayo 2026.
export const FIXTURE_WEEKLY_SUMMARY = {
  week: 18,
  generatedAt: Date.now() - 6 * 60 * 60 * 1000, // hoy en la mañana
  text:
    "Esta semana hiciste 5 sesiones, todas en horarios consistentes entre las 6 y las 9 de la mañana. " +
    "Tu intent dominante fue enfoque, con un Pulse Shift particularmente potente el martes que subió tu composite +7. " +
    "Para la próxima, prueba una sesión de calma el viernes por la tarde — tu sistema lo está pidiendo.",
};

// Conversación simulada con 6 mensajes intercalados.
const NOW = Date.now();
export const FIXTURE_MESSAGES = [
  {
    id: "m1",
    role: "user",
    content: "Vengo de una junta intensa, no puedo soltar la cabeza.",
    ts: NOW - 12 * MIN,
  },
  {
    id: "m2",
    role: "coach",
    content:
      "Eso pasa cuando el sistema simpático se queda encendido. Tienes 3 minutos. Vamos con un Reinicio Parasimpático: respira en 4-4-4-4 conmigo.",
    ts: NOW - 11 * MIN,
  },
  {
    id: "m3",
    role: "user",
    content: "Listo. Sentí que se aflojó la mandíbula como en el segundo ciclo.",
    ts: NOW - 8 * MIN,
  },
  {
    id: "m4",
    role: "coach",
    content:
      "Buena señal. La mandíbula es un termómetro confiable de carga acumulada. ¿Cómo estás ahora del 1 al 5?",
    ts: NOW - 7 * MIN,
  },
  {
    id: "m5",
    role: "user",
    content: "Como en 4. Pero mañana tengo otra junta así, ¿algo que pueda hacer antes?",
    ts: NOW - 4 * MIN,
  },
  {
    id: "m6",
    role: "coach",
    content:
      "Sí. 3 minutos antes, haz Activación Cognitiva (coherencia 6-2-8). Te pone en estado de foco sin la activación simpática que te dejó tensa hoy. Te lo agendo en tu home a las 9:55.",
    ts: NOW - 3 * MIN,
  },
];

// Para estado streaming: mensaje coach incompleto al final.
export const FIXTURE_MESSAGES_STREAMING = [
  ...FIXTURE_MESSAGES.slice(0, 5),
  {
    id: "m6",
    role: "coach",
    content: "Sí. 3 minutos antes, haz Activación Cognitiva (coherencia 6-2-8). Te pone en estado de foco sin",
    ts: NOW - 30 * 1000,
    streaming: true,
  },
];

// Chips de prompts sugeridos para empty state.
export const SUGGESTED_PROMPTS = [
  "Me siento agotado",
  "Necesito enfoque",
  "Estoy ansioso",
  "No puedo dormir",
  "Vengo del gym",
];
