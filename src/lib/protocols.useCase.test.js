/* ═══════════════════════════════════════════════════════════════
   protocols.useCase.test — Sprint 70

   Verifica el contrato de useCase del catálogo:
   - "crisis" → solo #18, #19, #20 (acceso explícito por user)
   - "training" → solo #16, #17 (10 min, programa o manual)
   - "active" (implícito) → todos los demás
   - getUseCase() devuelve "active" si no hay campo

   También valida que el motor neural y el prescriber NUNCA devuelven
   crisis/training en su recommendation default — el invariante crítico
   que garantiza que un user en flujo normal jamás recibe un protocolo
   de pánico cuando solo quiere su sesión diaria.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { P, getUseCase } from "./protocols";
import { defaultRecommendationPool, getDailyIgn } from "./neural";

const CRISIS_IDS = [18, 19, 20];
const TRAINING_IDS = [16, 17];

describe("useCase contract del catálogo", () => {
  it("getUseCase devuelve \"active\" si no hay campo (default implícito)", () => {
    expect(getUseCase({ id: 1 })).toBe("active");
    expect(getUseCase({})).toBe("active");
    expect(getUseCase(null)).toBe("active");
    expect(getUseCase(undefined)).toBe("active");
  });

  it("solo #18/#19/#20 son useCase \"crisis\"", () => {
    const crisis = P.filter((p) => getUseCase(p) === "crisis");
    expect(crisis.map((p) => p.id).sort((a, b) => a - b)).toEqual(CRISIS_IDS);
  });

  it("solo #16/#17 son useCase \"training\"", () => {
    const training = P.filter((p) => getUseCase(p) === "training");
    expect(training.map((p) => p.id).sort((a, b) => a - b)).toEqual(TRAINING_IDS);
  });

  it("el resto del catálogo es useCase \"active\"", () => {
    const active = P.filter((p) => getUseCase(p) === "active");
    const expected = P
      .filter((p) => !CRISIS_IDS.includes(p.id) && !TRAINING_IDS.includes(p.id))
      .map((p) => p.id);
    expect(active.map((p) => p.id).sort((a, b) => a - b)).toEqual(expected.sort((a, b) => a - b));
  });
});

describe("defaultRecommendationPool excluye crisis y training", () => {
  it("nunca incluye protocolo crisis", () => {
    const pool = defaultRecommendationPool();
    const ids = pool.map((p) => p.id);
    CRISIS_IDS.forEach((id) => {
      expect(ids).not.toContain(id);
    });
  });

  it("nunca incluye protocolo training", () => {
    const pool = defaultRecommendationPool();
    const ids = pool.map((p) => p.id);
    TRAINING_IDS.forEach((id) => {
      expect(ids).not.toContain(id);
    });
  });

  it("incluye al menos los protocolos active del catálogo", () => {
    const pool = defaultRecommendationPool();
    const activeCount = P.filter((p) => getUseCase(p) === "active").length;
    expect(pool.length).toBe(activeCount);
  });
});

describe("getDailyIgn nunca recomienda crisis/training", () => {
  // Probamos cada hora del día (0..23) — el filtro temporal no debe
  // dejar pasar crisis/training en ningún slot horario.
  for (let h = 0; h < 24; h++) {
    it(`hora ${h}: protocolo recomendado no es crisis ni training`, () => {
      const realDate = global.Date;
      class FrozenDate extends realDate {
        constructor() {
          super();
          return new realDate(2026, 4, 15, h, 0, 0);
        }
      }
      global.Date = FrozenDate;
      try {
        const result = getDailyIgn({ moodLog: [] });
        const uc = getUseCase(result.proto);
        expect(uc, `hora ${h}: useCase fue "${uc}" para protocolo #${result.proto.id} ${result.proto.n}`).not.toBe("crisis");
        expect(uc).not.toBe("training");
      } finally {
        global.Date = realDate;
      }
    });
  }
});
