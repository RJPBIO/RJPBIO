import { describe, it, expect } from "vitest";
import {
  PSS4, WEMWBS7, PHQ2, RMEQ,
  scorePss4, scoreWemwbs7, scorePhq2, scoreRmeq,
  chronotypeLabel, buildChronotypeRecord,
  nextInstrumentDue, aggregateInstrument,
} from "./instruments";

describe("PSS-4 scoring", () => {
  it("retorna null si faltan respuestas", () => {
    expect(scorePss4(null)).toBeNull();
    expect(scorePss4({ q1: 2 })).toBeNull();
    expect(scorePss4({ q1: 2, q2: 1, q3: 2 })).toBeNull();
  });

  it("valida rango 0-4 por ítem", () => {
    expect(scorePss4({ q1: 5, q2: 0, q3: 0, q4: 0 })).toBeNull();
    expect(scorePss4({ q1: -1, q2: 0, q3: 0, q4: 0 })).toBeNull();
  });

  it("invierte ítems positivos (q2, q3) correctamente", () => {
    // Todo en 0: q1+q4=0, q2 invertido (4-0)=4, q3 invertido (4-0)=4 → total 8
    expect(scorePss4({ q1: 0, q2: 0, q3: 0, q4: 0 }).score).toBe(8);
    // Todo en 4: q1+q4=8, q2 invertido (4-4)=0, q3 invertido (4-4)=0 → total 8
    expect(scorePss4({ q1: 4, q2: 4, q3: 4, q4: 4 }).score).toBe(8);
    // Score máximo: q1=4, q2=0 (invertido→4), q3=0 (→4), q4=4 = 16
    expect(scorePss4({ q1: 4, q2: 0, q3: 0, q4: 4 }).score).toBe(16);
    // Score mínimo: q1=0, q2=4 (invertido→0), q3=4 (→0), q4=0 = 0
    expect(scorePss4({ q1: 0, q2: 4, q3: 4, q4: 0 }).score).toBe(0);
  });

  it("clasifica nivel low/moderate/high por tertiles Warnecke", () => {
    expect(scorePss4({ q1: 0, q2: 4, q3: 4, q4: 0 }).level).toBe("low");  // 0
    expect(scorePss4({ q1: 2, q2: 2, q3: 2, q4: 1 }).level).toBe("moderate"); // 2+2+2+1=7
    expect(scorePss4({ q1: 4, q2: 0, q3: 0, q4: 4 }).level).toBe("high");  // 16
  });

  it("expone el máximo correcto (16)", () => {
    expect(PSS4.max).toBe(16);
    expect(scorePss4({ q1: 0, q2: 0, q3: 0, q4: 0 }).max).toBe(16);
  });
});

describe("WEMWBS-7 (SWEMWBS) scoring", () => {
  it("retorna null si faltan respuestas", () => {
    expect(scoreWemwbs7(null)).toBeNull();
    expect(scoreWemwbs7({ q1: 3 })).toBeNull();
  });

  it("valida rango 1-5 por ítem", () => {
    const complete = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
    expect(scoreWemwbs7(complete)).not.toBeNull();
    expect(scoreWemwbs7({ ...complete, q1: 0 })).toBeNull();
    expect(scoreWemwbs7({ ...complete, q1: 6 })).toBeNull();
  });

  it("computa rawScore y aplica tabla Rasch de Stewart-Brown 2009", () => {
    const all3 = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
    const r = scoreWemwbs7(all3);
    expect(r.rawScore).toBe(21);
    expect(r.metricScore).toBeCloseTo(19.25, 1); // tabla: 21 → 19.25
  });

  it("clasifica level según normas UK (Warwick 2011)", () => {
    const low = scoreWemwbs7({ q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1 });
    expect(low.level).toBe("low"); // raw=7 → 7.00
    const high = scoreWemwbs7({ q1: 5, q2: 5, q3: 5, q4: 5, q5: 5, q6: 5, q7: 5 });
    expect(high.level).toBe("high"); // raw=35 → 35.00
  });

  it("max=35", () => {
    expect(WEMWBS7.max).toBe(35);
  });
});

describe("PHQ-2 scoring", () => {
  it("retorna null si faltan respuestas", () => {
    expect(scorePhq2(null)).toBeNull();
    expect(scorePhq2({ q1: 2 })).toBeNull();
  });

  it("valida rango 0-3", () => {
    expect(scorePhq2({ q1: 4, q2: 0 })).toBeNull();
    expect(scorePhq2({ q1: -1, q2: 0 })).toBeNull();
  });

  it("score≥3 marca positive=true → action=refer", () => {
    const neg = scorePhq2({ q1: 1, q2: 1 });
    expect(neg.score).toBe(2);
    expect(neg.positive).toBe(false);
    expect(neg.action).toBe("continue");
    const pos = scorePhq2({ q1: 2, q2: 1 });
    expect(pos.score).toBe(3);
    expect(pos.positive).toBe(true);
    expect(pos.action).toBe("refer");
  });

  it("máximo 6", () => {
    expect(PHQ2.max).toBe(6);
    expect(scorePhq2({ q1: 3, q2: 3 }).score).toBe(6);
  });
});

describe("nextInstrumentDue — scheduling", () => {
  const DAY = 86400000;

  it("retorna PSS-4 si el usuario nunca lo ha contestado", () => {
    expect(nextInstrumentDue([], Date.now())).toBe("pss-4");
    expect(nextInstrumentDue(null, Date.now())).toBe("pss-4");
  });

  it("retorna PSS-4 si el último es >30 días", () => {
    const now = Date.now();
    const history = [{ instrumentId: "pss-4", ts: now - 31 * DAY }];
    expect(nextInstrumentDue(history, now)).toBe("pss-4");
  });

  it("no repite PSS-4 si se contestó hace <30 días", () => {
    const now = Date.now();
    const history = [{ instrumentId: "pss-4", ts: now - 10 * DAY }];
    // PSS aún vigente → sugiere WEMWBS-7 si nunca se contestó
    expect(nextInstrumentDue(history, now)).toBe("wemwbs-7");
  });

  it("sugiere WEMWBS-7 cuando PSS-4 vigente y WEMWBS nunca", () => {
    const now = Date.now();
    const history = [{ instrumentId: "pss-4", ts: now - 5 * DAY }];
    expect(nextInstrumentDue(history, now)).toBe("wemwbs-7");
  });

  it("WEMWBS-7 se repite a los 90 días", () => {
    const now = Date.now();
    const history = [
      { instrumentId: "pss-4", ts: now - 5 * DAY },
      { instrumentId: "wemwbs-7", ts: now - 91 * DAY },
    ];
    expect(nextInstrumentDue(history, now)).toBe("wemwbs-7");
  });

  it("retorna null si ambos están al día", () => {
    const now = Date.now();
    const history = [
      { instrumentId: "pss-4", ts: now - 5 * DAY },
      { instrumentId: "wemwbs-7", ts: now - 30 * DAY },
    ];
    expect(nextInstrumentDue(history, now)).toBeNull();
  });
});

describe("aggregateInstrument — k-anonymous org rollup", () => {
  it("insufficient si n<minK", () => {
    const resp = [
      { instrumentId: "pss-4", score: 5 },
      { instrumentId: "pss-4", score: 7 },
    ];
    const agg = aggregateInstrument(resp, "pss-4", { minK: 5 });
    expect(agg.insufficient).toBe(true);
    expect(agg.n).toBe(2);
  });

  it("calcula mean, sd y distribución por level con n suficiente", () => {
    const resp = Array.from({ length: 8 }, (_, i) => ({
      instrumentId: "pss-4",
      score: 2 + i,  // 2..9
      level: i < 4 ? "low" : "moderate",
    }));
    const agg = aggregateInstrument(resp, "pss-4", { minK: 5 });
    expect(agg.insufficient).toBe(false);
    expect(agg.n).toBe(8);
    expect(agg.mean).toBeCloseTo(5.5, 1);
    expect(agg.distribution.low).toBe(4);
    expect(agg.distribution.moderate).toBe(4);
  });

  it("filtra entradas de otros instrumentos", () => {
    const resp = [
      ...Array.from({ length: 3 }, () => ({ instrumentId: "pss-4", score: 5, level: "low" })),
      ...Array.from({ length: 6 }, () => ({ instrumentId: "wemwbs-7", score: 20, level: "average" })),
    ];
    const agg = aggregateInstrument(resp, "wemwbs-7", { minK: 5 });
    expect(agg.insufficient).toBe(false);
    expect(agg.n).toBe(6);
  });
});

// ─── Phase 6D SP1 — rMEQ + chronotype helpers ───────────────────
describe("rMEQ definition (Adan & Almirall 1991)", () => {
  it("tiene id rmeq y 5 ítems", () => {
    expect(RMEQ.id).toBe("rmeq");
    expect(RMEQ.items).toHaveLength(5);
    expect(RMEQ.version).toMatch(/Adan & Almirall 1991/);
  });

  it("cada ítem tiene options propias (no escala uniforme)", () => {
    for (const item of RMEQ.items) {
      expect(Array.isArray(item.options)).toBe(true);
      expect(item.options.length).toBeGreaterThan(0);
      for (const opt of item.options) {
        expect(typeof opt.label).toBe("string");
        expect(typeof opt.value).toBe("number");
      }
    }
  });
});

describe("scoreRmeq", () => {
  it("retorna null si falta alguna respuesta", () => {
    expect(scoreRmeq(null)).toBeNull();
    expect(scoreRmeq({})).toBeNull();
    expect(scoreRmeq({ q1: 5, q2: 4, q3: 4, q4: 3 })).toBeNull(); // falta q5
  });

  it("score mínimo (4) → definitely_evening", () => {
    const r = scoreRmeq({ q1: 1, q2: 1, q3: 0, q4: 1, q5: 0 });
    expect(r.score).toBe(3); // suma 1+1+0+1+0=3, dentro de evening
    expect(r.chronotype).toBe("definitely_evening");
    expect(r.bestTimeWindow).toBe("evening");
  });

  it("score 12 (intermediate) → midday window", () => {
    // q1=3 + q2=3 + q3=4 + q4=3 + q5=2 = 15 → intermediate
    const r = scoreRmeq({ q1: 3, q2: 3, q3: 4, q4: 3, q5: 2 });
    expect(r.score).toBe(15);
    expect(r.chronotype).toBe("intermediate");
    expect(r.bestTimeWindow).toBe("midday");
  });

  it("score 20 → moderately_morning", () => {
    // q1=4 + q2=3 + q3=6 + q4=3 + q5=4 = 20
    const r = scoreRmeq({ q1: 4, q2: 3, q3: 6, q4: 3, q5: 4 });
    expect(r.score).toBe(20);
    expect(r.chronotype).toBe("moderately_morning");
    expect(r.bestTimeWindow).toBe("morning");
  });

  it("score 25 (max) → definitely_morning", () => {
    // q1=5 + q2=4 + q3=6 + q4=4 + q5=6 = 25
    const r = scoreRmeq({ q1: 5, q2: 4, q3: 6, q4: 4, q5: 6 });
    expect(r.score).toBe(25);
    expect(r.chronotype).toBe("definitely_morning");
  });

  it("retorna instrumentId 'rmeq' y level alias = chronotype", () => {
    const r = scoreRmeq({ q1: 3, q2: 3, q3: 4, q4: 3, q5: 2 });
    expect(r.instrumentId).toBe("rmeq");
    expect(r.level).toBe(r.chronotype);
  });

  it("rechaza valores no numéricos", () => {
    const r = scoreRmeq({ q1: "5", q2: 3, q3: 4, q4: 3, q5: 2 });
    expect(r).toBeNull();
  });
});

describe("chronotypeLabel", () => {
  it("mapea categorías conocidas a labels en español", () => {
    expect(chronotypeLabel("definitely_morning")).toBe("Definitivamente matutino");
    expect(chronotypeLabel("moderately_morning")).toBe("Más matutino");
    expect(chronotypeLabel("intermediate")).toBe("Intermedio");
    expect(chronotypeLabel("moderately_evening")).toBe("Más vespertino");
    expect(chronotypeLabel("definitely_evening")).toBe("Definitivamente vespertino");
  });

  it("default a 'Intermedio' para categorías desconocidas", () => {
    expect(chronotypeLabel(null)).toBe("Intermedio");
    expect(chronotypeLabel("foo")).toBe("Intermedio");
  });
});

describe("buildChronotypeRecord (shape persistido en store.chronotype)", () => {
  it("retorna null si rmeqResult inválido", () => {
    expect(buildChronotypeRecord(null)).toBeNull();
    expect(buildChronotypeRecord({})).toBeNull();
    expect(buildChronotypeRecord({ chronotype: "intermediate" })).toBeNull(); // falta score
  });

  it("incluye campos type + category (alias) + label + score + bestTimeWindow + ts", () => {
    const r = scoreRmeq({ q1: 3, q2: 3, q3: 4, q4: 3, q5: 2 });
    const rec = buildChronotypeRecord(r, 1700000000000);
    expect(rec.type).toBe("intermediate");        // prescriber.js usa .type
    expect(rec.category).toBe("intermediate");    // alias canónico Phase 6D
    expect(rec.label).toBe("Intermedio");         // ProfileView legacy usa .label
    expect(rec.score).toBe(15);
    expect(rec.bestTimeWindow).toBe("midday");
    expect(rec.ts).toBe(1700000000000);
  });

  it("ts default a Date.now() cuando no se provee", () => {
    const r = scoreRmeq({ q1: 5, q2: 4, q3: 6, q4: 4, q5: 6 });
    const before = Date.now();
    const rec = buildChronotypeRecord(r);
    const after = Date.now();
    expect(rec.ts).toBeGreaterThanOrEqual(before);
    expect(rec.ts).toBeLessThanOrEqual(after);
  });
});

// ─── Phase 6D SP2 — PSS-4 canónico Cohen 1983 ───────────────────
// Verifica que la canonización de PSS-4 (eliminar Cohen & Williamson
// 1988, mantener Cohen 1983) preservó wording, scale y citation
// correctos. Los tests de scoring (líneas 9-42) ya cubren la lógica
// matemática que es idéntica entre versiones; estos tests cubren la
// identidad clínica del instrumento.
describe("PSS-4 canonización Cohen 1983 (Phase 6D SP2)", () => {
  it("version es exactamente 'Cohen 1983' (no Cohen & Williamson 1988)", () => {
    expect(PSS4.version).toBe("Cohen 1983");
    expect(PSS4.version).not.toMatch(/Williamson/);
    expect(PSS4.version).not.toMatch(/1988/);
  });

  it("scale options usa Cohen 1983 wording ('Frecuentemente/Muy frecuentemente')", () => {
    expect(PSS4.scale).toEqual([
      "Nunca",
      "Casi nunca",
      "A veces",
      "Frecuentemente",
      "Muy frecuentemente",
    ]);
    // Anti-regression: asegura que NO regresamos a labels Cohen & Williamson 1988.
    expect(PSS4.scale).not.toContain("Casi siempre");
    expect(PSS4.scale).not.toContain("Siempre");
  });

  it("items wording empieza con 'En el último mes' (Cohen 1983 framing)", () => {
    for (const item of PSS4.items) {
      expect(item.text).toMatch(/^En el último mes/);
    }
  });

  it("items 2 y 3 son reverse-scored (positivamente formulados)", () => {
    expect(PSS4.items[0].reverse).toBe(false);  // q1: incapaz de controlar
    expect(PSS4.items[1].reverse).toBe(true);   // q2: te sentiste seguro/a
    expect(PSS4.items[2].reverse).toBe(true);   // q3: las cosas iban como querías
    expect(PSS4.items[3].reverse).toBe(false);  // q4: dificultades se acumulaban
  });

  it("name display es 'Estrés percibido (PSS-4)'", () => {
    expect(PSS4.name).toBe("Estrés percibido (PSS-4)");
  });
});
