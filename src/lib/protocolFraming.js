/* ═══════════════════════════════════════════════════════════════
   PROTOCOL FRAMING — capa de lenguaje contextual sobre mecanismo fijo.
   ───────────────────────────────────────────────────────────────
   El MECANISMO FISIOLÓGICO es invariable y evidenciado (la respiración
   5-5 sigue siendo 5-5). Lo que se adapta al momento es la CAPA COGNITIVA
   y el TONO DE VOZ: el encuadre con que entras a la sesión.

   Esta lib es la versión DETERMINISTA (matriz de plantillas por daypart /
   intent / situación / desviación del gemelo). Es honesta (no inventa
   cifras ni promete efectos clínicos), siempre disponible, y es el FALLBACK
   del enriquecedor LLM (src/server/protocolFraming.js).

   voiceTone → rate/pitch para el TTS existente (speechSynthesis).
   ═══════════════════════════════════════════════════════════════ */

export const VOICE_TONES = {
  calm: { rate: 0.92, pitch: 0.96 },
  discharge: { rate: 0.9, pitch: 0.92 },
  focus: { rate: 1.0, pitch: 1.0 },
  activation: { rate: 1.08, pitch: 1.05 },
  neutral: { rate: 1.0, pitch: 1.0 },
};

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** daypart natural a partir de la hora local. */
export function dayPart(hour) {
  if (hour >= 5 && hour < 12) return "manana";
  if (hour >= 12 && hour < 17) return "mediodia";
  if (hour >= 17 && hour < 22) return "tarde";
  return "noche";
}

const DAYPART_LABEL = {
  manana: "Mañana",
  mediodia: "Mediodía",
  tarde: "Tarde",
  noche: "Noche",
};

// Situaciones que el usuario puede declarar (chips), o que el contexto sugiere.
// Tienen prioridad sobre el daypart porque son más específicas del momento.
const SITUATIONS = {
  antes_importante: {
    eyebrow: "Antes de algo importante",
    frame:
      "En unos minutos tienes algo que importa. Esto no es para calmarte y ya — es para llegar con la cabeza clara y el cuerpo en su sitio.",
    tone: "focus",
  },
  despues_dificil: {
    eyebrow: "Cierre y transición",
    frame:
      "Vienes de algo difícil. Esta sesión es un cierre: no hay que resolver nada más, solo dejar que el cuerpo marque el final.",
    tone: "discharge",
  },
  reinicio: {
    eyebrow: "Reinicio",
    frame: "Un alto a media marcha. Vuelve al cuerpo y retoma desde ahí.",
    tone: "neutral",
  },
  transicion_casa: {
    eyebrow: "Cruzar el umbral",
    frame:
      "Llegaste a casa, pero tu sistema sigue en el trabajo. Estos minutos son para soltar el rol profesional y llegar de verdad — presente para quienes te esperan.",
    tone: "calm",
  },
  creatividad: {
    eyebrow: "Ventana creativa",
    frame:
      "Tu sistema está en el equilibrio que precede tu mejor trabajo: ni apagado ni acelerado. Estos minutos son para entrar en foco profundo antes de empezar.",
    tone: "focus",
  },
  pre_sueno: {
    eyebrow: "Antes de dormir",
    frame:
      "Es hora de bajar. Deja que la exhalación se alargue y el cuerpo afloje — preparas al sistema para un descanso más profundo, no para resolver nada más.",
    tone: "calm",
  },
  despertar: {
    eyebrow: "Arranque del día",
    frame:
      "Tu sistema aún está despertando. Antes del primer estímulo del día, sube despacio: una activación gradual para llegar con claridad, no en reacción.",
    tone: "activation",
  },
};

// Encuadre por daypart + intención del protocolo (cuando no hay situación).
function dayPartFrame(part, dow, intent) {
  if (dow === 1 && part === "manana") {
    return {
      eyebrow: "Lunes · Activación",
      frame: "Arranque de semana. Usa estos minutos para entrar con foco, no con prisa.",
      tone: intent === "calma" ? "calm" : "activation",
    };
  }
  if (dow === 5 && part === "tarde") {
    return {
      eyebrow: "Viernes · Descarga",
      frame: "Cierre de semana. Esta sesión es para soltar lo acumulado, no para resolver nada más.",
      tone: "discharge",
    };
  }
  switch (part) {
    case "manana":
      return {
        eyebrow: "Mañana · Arranque",
        frame: "Marca el tono del día desde el cuerpo, antes de que el día lo marque por ti.",
        tone: intent === "energia" ? "activation" : "focus",
      };
    case "mediodia":
      return {
        eyebrow: "Mediodía · Reinicio",
        frame: "Un corte limpio a media jornada para volver con la mente despejada.",
        tone: "neutral",
      };
    case "tarde":
      return {
        eyebrow: "Tarde · Descarga",
        frame: "Baja la activación del día. Permítete pasar de hacer a estar.",
        tone: "calm",
      };
    default:
      return {
        eyebrow: "Noche · Desconexión",
        frame: "Prepara al sistema para el descanso. Nada que lograr aquí, solo soltar.",
        tone: "calm",
      };
  }
}

/**
 * @param {object} ctx
 * @param {object} ctx.protocol — { id, n, int }
 * @param {number} [ctx.now=Date.now()]
 * @param {string|null} [ctx.situation] — clave de SITUATIONS
 * @param {string|null} [ctx.twinDirection] — "below"|"within"|"above" (gemelo autonómico)
 * @returns {{eyebrow, frame, voiceTone, voice:{rate,pitch}, close, source:"deterministic"}}
 */
export function buildProtocolFraming(ctx = {}) {
  const protocol = ctx.protocol || {};
  const intent = protocol.int || "calma";
  const now = ctx.now ?? Date.now();
  const d = new Date(now);
  const dow = d.getDay();
  const hour = d.getHours();
  const part = dayPart(hour);

  let base;
  if (ctx.situation && SITUATIONS[ctx.situation]) {
    base = SITUATIONS[ctx.situation];
  } else {
    base = dayPartFrame(part, dow, intent);
  }

  // La desviación del gemelo matiza el encuadre (sin cambiar el mecanismo).
  let frame = base.frame;
  let tone = base.tone;
  if (ctx.twinDirection === "below") {
    frame += " Hoy tu sistema está por debajo de tu norma: prioriza recuperar, no exigir.";
    tone = "calm";
  } else if (ctx.twinDirection === "above") {
    frame += " Hoy tu sistema está por encima de tu norma: es buena ventana para exigir un poco más.";
  }

  const voice = VOICE_TONES[tone] || VOICE_TONES.neutral;

  // `notable` = el contexto aporta señal real (situación declarada, desviación
  // del gemelo, o momento especial lunes-AM / viernes-PM). El consumidor lo usa
  // para mostrar el encuadre SOLO cuando suma, sin imponer fricción a cada sesión.
  const notable =
    !!(ctx.situation && SITUATIONS[ctx.situation]) ||
    ctx.twinDirection === "below" ||
    ctx.twinDirection === "above" ||
    (dow === 1 && part === "manana") ||
    (dow === 5 && part === "tarde");

  return {
    eyebrow: base.eyebrow,
    frame,
    voiceTone: tone,
    voice,
    close: `${DAYPART_LABEL[part]} · ${DAYS[dow]}`,
    notable,
    source: "deterministic",
  };
}
