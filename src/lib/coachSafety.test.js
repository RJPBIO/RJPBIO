import { describe, it, expect } from "vitest";
import { evaluateSafetySignals, SAFETY_RESOURCES } from "./coachSafety";

const DAY = 86400000;

function base(over = {}) {
  return { instruments: [], moodLog: [], ...over };
}

describe("evaluateSafetySignals — baseline", () => {
  it("estado vacío sin texto: level none, recommendation continue", () => {
    const r = evaluateSafetySignals(base());
    expect(r.level).toBe("none");
    expect(r.triggers).toEqual([]);
    expect(r.recommendation).toBe("continue");
    expect(r.message).toBe("");
  });

  it("frase ambigua NO debe disparar crisis (false-positive guard)", () => {
    const r = evaluateSafetySignals(base(), { userText: "estoy cansado hoy, necesito un respiro" });
    expect(r.level).toBe("none");
    expect(r.triggers).toEqual([]);
  });

  it("null/undefined st no crashea", () => {
    expect(() => evaluateSafetySignals(null)).not.toThrow();
    expect(() => evaluateSafetySignals(undefined)).not.toThrow();
  });
});

describe("evaluateSafetySignals — crisis text patterns", () => {
  const crisisExamples = [
    "me quiero morir",
    "quiero matarme",
    "no quiero vivir más",
    "pienso en suicidio",
    "voy a matarme esta noche",
    "quiero hacerme daño",
    "tengo pensamientos de muerte",
    "I want to kill myself",
    "thinking about suicide",
    "I self-harm sometimes",
    "I want to end it",
    "end my life",
  ];

  for (const text of crisisExamples) {
    it(`crisis: "${text}"`, () => {
      const r = evaluateSafetySignals(base(), { userText: text });
      expect(r.level).toBe("crisis");
      expect(r.triggers).toContain("text_crisis");
      expect(r.recommendation).toBe("refer_human");
      expect(r.message.length).toBeGreaterThan(0);
      expect(r.resources.length).toBeGreaterThan(0);
    });
  }

  it("crisis case-insensitive", () => {
    const r = evaluateSafetySignals(base(), { userText: "QUIERO MORIR" });
    expect(r.level).toBe("crisis");
  });
});

describe("evaluateSafetySignals — soft text patterns", () => {
  const softExamples = [
    "ya no puedo más con esto",
    "estoy colapsada",
    "estoy quebrado",
    "ya no aguanto",
    "i can't anymore",
    "i can't do this",
    "i feel hopeless",
  ];

  for (const text of softExamples) {
    it(`soft: "${text}"`, () => {
      const r = evaluateSafetySignals(base(), { userText: text });
      expect(r.level).toBe("soft");
      expect(r.triggers).toContain("text_soft");
      expect(r.recommendation).toBe("offer_support");
    });
  }
});

describe("evaluateSafetySignals — state-based triggers", () => {
  it("PHQ-2 último ≥ 3 dispara phq2_positive → soft", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        instruments: [
          { instrumentId: "phq-2", ts: now - 10 * DAY, score: 1 },
          { instrumentId: "phq-2", ts: now - DAY, score: 4 },
        ],
      }),
      { now }
    );
    expect(r.triggers).toContain("phq2_positive");
    expect(r.level).toBe("soft");
  });

  it("PHQ-2 último < 3 NO dispara", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({ instruments: [{ instrumentId: "phq-2", ts: now, score: 2 }] }),
      { now }
    );
    expect(r.triggers).not.toContain("phq2_positive");
  });

  it("PSS-4 dos consecutivas 'high' dispara sustained_high → soft", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        instruments: [
          { instrumentId: "pss-4", ts: now - 30 * DAY, score: 5, level: "moderate" },
          { instrumentId: "pss-4", ts: now - 14 * DAY, score: 12, level: "high" },
          { instrumentId: "pss-4", ts: now - DAY, score: 13, level: "high" },
        ],
      }),
      { now }
    );
    expect(r.triggers).toContain("pss4_sustained_high");
    expect(r.level).toBe("soft");
  });

  it("PSS-4 solo una 'high' NO dispara sustained", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        instruments: [
          { instrumentId: "pss-4", ts: now - 5 * DAY, score: 7, level: "moderate" },
          { instrumentId: "pss-4", ts: now - DAY, score: 12, level: "high" },
        ],
      }),
      { now }
    );
    expect(r.triggers).not.toContain("pss4_sustained_high");
  });

  it("≥ 3 moods ≤ 2 en últimos 7 días dispara mood_sustained_low", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        moodLog: [
          { ts: now - DAY, mood: 1 },
          { ts: now - 2 * DAY, mood: 2 },
          { ts: now - 3 * DAY, mood: 2 },
          { ts: now - 10 * DAY, mood: 1 },
        ],
      }),
      { now }
    );
    expect(r.triggers).toContain("mood_sustained_low");
    expect(r.level).toBe("soft");
  });

  it("moods bajos fuera de 7 días NO disparan", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        moodLog: [
          { ts: now - 10 * DAY, mood: 1 },
          { ts: now - 12 * DAY, mood: 2 },
          { ts: now - 15 * DAY, mood: 1 },
        ],
      }),
      { now }
    );
    expect(r.triggers).not.toContain("mood_sustained_low");
  });
});

describe("evaluateSafetySignals — precedencia crisis > soft", () => {
  it("texto crisis gana aunque haya soft triggers acumulados", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      base({
        instruments: [{ instrumentId: "phq-2", ts: now, score: 4 }],
        moodLog: [
          { ts: now - DAY, mood: 1 },
          { ts: now - 2 * DAY, mood: 1 },
          { ts: now - 3 * DAY, mood: 2 },
        ],
      }),
      { userText: "me quiero morir", now }
    );
    expect(r.level).toBe("crisis");
    expect(r.recommendation).toBe("refer_human");
    expect(r.triggers).toContain("text_crisis");
    expect(r.triggers).toContain("phq2_positive");
    expect(r.triggers).toContain("mood_sustained_low");
  });
});

describe("evaluateSafetySignals — locale-aware resources", () => {
  it("es-MX retorna SAPTEL", () => {
    const r = evaluateSafetySignals(base(), { userText: "quiero morir", locale: "es-MX" });
    expect(r.resources).toBe(SAFETY_RESOURCES.es_MX);
    expect(r.resources.some((x) => /SAPTEL/i.test(x.label))).toBe(true);
  });

  it("es genérico retorna Teléfono de la Esperanza / 024", () => {
    const r = evaluateSafetySignals(base(), { userText: "quiero morir", locale: "es" });
    expect(r.resources).toBe(SAFETY_RESOURCES.es);
  });

  it("en retorna 988 Lifeline", () => {
    const r = evaluateSafetySignals(base(), { userText: "kill myself", locale: "en" });
    expect(r.resources).toBe(SAFETY_RESOURCES.en);
    expect(r.resources.some((x) => /988/.test(x.contact))).toBe(true);
  });

  it("locale desconocido cae en default", () => {
    const r = evaluateSafetySignals(base(), { userText: "kill myself", locale: "fr-FR" });
    expect(r.resources).toBe(SAFETY_RESOURCES.default);
  });

  it("sin locale devuelve default", () => {
    const r = evaluateSafetySignals(base(), { userText: "kill myself", locale: null });
    expect(r.resources).toBe(SAFETY_RESOURCES.default);
  });
});

describe("coachSafety — Phase 6D SP5 ideación pasiva ES (true positives)", () => {
  const passiveCrisisExamples = [
    "no veo salida en mi vida",
    "ya no aguanto más",
    "ya no quiero seguir así",
    "ya no quiero vivir esto",
    "ya no quiero estar aquí",
    "todo me pesa demasiado",
    "todo me pesa mucho",
    "todo me pesa",
    "a veces solo me quiero ir",
    "no puedo más con la vida",
    "no puedo más con todo",
    "no le veo sentido a nada",
    "no veo sentido a seguir",
    "estoy harto de todo",
    "estoy harta de la vida",
    "no vale la pena seguir",
    "no vale pena vivir",
    "quiero desaparecer para siempre",
    "me siento atrapado",
    "me siento atrapada",
    "me quiero cortar",
    "me quiero lastimar",
  ];
  for (const text of passiveCrisisExamples) {
    it(`crisis pasiva ES: "${text}"`, () => {
      const r = evaluateSafetySignals(base(), { userText: text });
      expect(r.level).toBe("crisis");
      expect(r.triggers).toContain("text_crisis");
      expect(r.recommendation).toBe("refer_human");
    });
  }
});

describe("coachSafety — Phase 6D SP5 ideación pasiva ES (false positive guards)", () => {
  const innocuousExamples = [
    "me quiero ir a casa",
    "me quiero ir de vacaciones",
    "me quiero ir al cine",
    "me quiero ir contigo al parque",
    "no aguanto este calor en agosto",
    "no aguanto este dolor de muelas",
    "no aguanto esta humedad",
    "no veo la salida del estacionamiento",
    "no veo la salida del edificio",
    "no veo la salida del metro",
    "me quiero cortar el pelo",
    "me quiero cortar las uñas",
    "me quiero cortar la barba",
    "no puedo más con la tarea de matemáticas",
    "no puedo más con la fila del banco",
    "i can't go on this trip",
    "i can't go on with the meeting",
    "no way out of this parking garage",
    "want to disappear from this meeting",
  ];
  for (const text of innocuousExamples) {
    it(`NO crisis (false positive guard): "${text}"`, () => {
      const r = evaluateSafetySignals(base(), { userText: text });
      expect(r.level).not.toBe("crisis");
    });
  }
});

describe("coachSafety — Phase 6D SP5 ideación pasiva EN (true positives)", () => {
  const passiveCrisisExamplesEN = [
    "i can't go on",
    "I can't go on anymore",
    "there's no way out",
    "i don't want to exist",
    "i don't want to be here",
    "i don't want to wake up",
    "everyone would be better off dead",
    "they'd be better off without me",
    "nothing matters anymore",
    "i'm so tired of living",
    "tired of everything",
    "tired of being alive",
    "i just want to disappear",
    "i want to give up on life",
  ];
  for (const text of passiveCrisisExamplesEN) {
    it(`crisis pasiva EN: "${text}"`, () => {
      const r = evaluateSafetySignals(base(), { userText: text });
      expect(r.level).toBe("crisis");
      expect(r.triggers).toContain("text_crisis");
    });
  }
});

describe("evaluateSafetySignals — robustez de entrada", () => {
  it("instruments/moodLog mal formateados no crashean", () => {
    const r = evaluateSafetySignals({ instruments: "x", moodLog: null });
    expect(r.level).toBe("none");
  });

  it("userText vacío o undefined no dispara", () => {
    expect(evaluateSafetySignals(base(), { userText: "" }).level).toBe("none");
    expect(evaluateSafetySignals(base(), { userText: undefined }).level).toBe("none");
  });

  it("entradas inválidas en moodLog/instruments se ignoran", () => {
    const now = Date.now();
    const r = evaluateSafetySignals(
      {
        instruments: [null, { instrumentId: "phq-2" }, { instrumentId: "phq-2", ts: now, score: "bad" }],
        moodLog: [null, { mood: "a" }, { ts: "x", mood: 1 }],
      },
      { now }
    );
    expect(r.level).toBe("none");
  });
});
