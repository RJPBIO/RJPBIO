import { describe, it, expect } from "vitest";
import { computeAdaptiveRecommendation } from "./useAdaptiveRecommendation";

describe("computeAdaptiveRecommendation", () => {
  it("devuelve recomendación con estado mínimo", () => {
    const st = { moodLog: [], history: [], weeklyData: [0, 0, 0, 0, 0, 0, 0], totalSessions: 0 };
    const r = computeAdaptiveRecommendation(st);
    expect(r).toBeTruthy();
    expect(r.primary?.protocol).toBeDefined();
    expect(r.context?.timeBucket).toBeDefined();
  });

  it("propaga opciones (nom35Dominios, readiness) al motor", () => {
    const st = { moodLog: [], history: [], weeklyData: [0, 0, 0, 0, 0, 0, 0], totalSessions: 0 };
    const readiness = { score: 30, interpretation: "recover" };
    const r = computeAdaptiveRecommendation(st, { readiness });
    // Con readiness recover, el motor fuerza intent=calma
    expect(r.need).toBe("calma");
    expect(r.context.readiness).toEqual({ score: 30, interpretation: "recover" });
  });

  it("devuelve null si el motor lanza (no rompe caller)", () => {
    // Null como st hará que el engine lance al acceder a .moodLog
    const r = computeAdaptiveRecommendation(null);
    expect(r).toBeNull();
  });

  it("readiness primed se refleja en context sin forzar override", () => {
    // "primed" da bonus a activación pero respeta circadiano; no hace
    // override como "recover". Verificamos que el context reporta el
    // score correctamente para la UI.
    const st = { moodLog: [], history: [], weeklyData: [0, 0, 0, 0, 0, 0, 0], totalSessions: 10 };
    const r = computeAdaptiveRecommendation(st, {
      readiness: { score: 85, interpretation: "primed" },
    });
    expect(r.context.readiness).toEqual({ score: 85, interpretation: "primed" });
  });

  // ─── Phase 6J-3 M-6 — integration scenarios ─────────────────
  // Cubre cohorts (cold-start fresh / active / learning / personalized)
  // + override branches via options propagation.
  describe("Phase 6J-3 M-6 — cohort scenarios", () => {
    function buildCohort(N) {
      return {
        totalSessions: N,
        coherencia: 60, resiliencia: 50, capacidad: 50,
        streak: 0, todaySessions: 0,
        weeklyData: [1, 1, 1, 0, 0, 0, 0],
        moodLog: [],
        history: Array.from({ length: N }, (_, i) => ({
          p: "test", ts: Date.now() - i * 86400000, c: 60, bioQ: 60, dur: 120,
        })),
      };
    }

    it("cold-start fresh (N=0) → engine devuelve recommendation primary válido", () => {
      const r = computeAdaptiveRecommendation(buildCohort(0));
      expect(r.primary.protocol).toBeTruthy();
      expect(r.primary.protocol.id).toBeGreaterThan(0);
    });

    it("cold-start active (N=3) → recommendation primary + context populated", () => {
      const r = computeAdaptiveRecommendation(buildCohort(3));
      expect(r.primary.protocol).toBeTruthy();
      expect(r.context.timeBucket).toBeDefined();
    });

    it("learning (N=7) → engine real recommendation con scoring", () => {
      const r = computeAdaptiveRecommendation(buildCohort(7));
      expect(r.primary.protocol).toBeTruthy();
      expect(r.primary.score).toBeGreaterThan(0);
    });

    it("personalized (N=21) → engine + alternatives", () => {
      const r = computeAdaptiveRecommendation(buildCohort(21));
      expect(r.primary.protocol).toBeTruthy();
      expect(Array.isArray(r.alternatives)).toBe(true);
    });
  });

  describe("Phase 6J-3 M-6 — engine integrations", () => {
    function baseSt() {
      return {
        totalSessions: 10,
        coherencia: 60, resiliencia: 50, capacidad: 50,
        streak: 0, todaySessions: 0,
        weeklyData: [1, 1, 1, 0, 0, 0, 0],
        moodLog: [],
        history: Array.from({ length: 10 }, (_, i) => ({
          p: "test", ts: Date.now() - i * 86400000, c: 60, bioQ: 60, dur: 120,
        })),
      };
    }

    it("nom35Dominios urgent → context.nom35Bias.urgent=true", () => {
      const r = computeAdaptiveRecommendation(baseSt(), {
        nom35Dominios: {
          condiciones: 0, carga: 0, falta_control: 0, jornada: 0,
          interferencia: 0, liderazgo: 0, violencia: 22, // 22/44=0.5 ≥ 0.3 threshold
        },
      });
      expect(r.context.nom35Bias).toBeTruthy();
      expect(r.context.nom35Bias.urgent).toBe(true);
    });

    it("nom35Dominios non-urgent + match intent → context.nom35Bias.urgent=false", () => {
      const r = computeAdaptiveRecommendation(baseSt(), {
        nom35Dominios: {
          condiciones: 1, carga: 18, falta_control: 1, jornada: 2,
          interferencia: 1, liderazgo: 1, violencia: 0,
        },
      });
      expect(r.context.nom35Bias).toBeTruthy();
      expect(r.context.nom35Bias.urgent).toBe(false);
    });

    it("currentMood=1 + readiness null → need='calma'", () => {
      const r = computeAdaptiveRecommendation(baseSt(), { currentMood: 1 });
      expect(r.need).toBe("calma");
    });

    it("currentMood=5 + readiness null → need='energia'", () => {
      const r = computeAdaptiveRecommendation(baseSt(), { currentMood: 5 });
      expect(r.need).toBe("energia");
    });

    it("priority order: readiness recover > currentMood=5", () => {
      // readiness recover override → calma; currentMood=5 normalmente energia.
      // Engine prioriza readiness recover sobre currentMood explicit.
      // Importante: en code el order es: fatigue > burnout > readiness recover
      //   > nom35 urgent > moodIsExplicit > tendencia > momentum
      const r = computeAdaptiveRecommendation(baseSt(), {
        readiness: { score: 20, interpretation: "recover" },
        currentMood: 5,
      });
      expect(r.need).toBe("calma");
    });

    it("priority order: nom35 urgent > currentMood explicit", () => {
      const r = computeAdaptiveRecommendation(baseSt(), {
        nom35Dominios: {
          condiciones: 0, carga: 0, falta_control: 0, jornada: 0,
          interferencia: 0, liderazgo: 0, violencia: 22, // 22/44=0.5 ≥ 0.3 threshold
        },
        currentMood: 5,
      });
      expect(r.context.nom35Bias?.urgent).toBe(true);
      // need debería ser intent del nom35 bias (calma para violencia)
      expect(r.need).toBe(r.context.nom35Bias.intent);
    });

    it("staleness severe (90 días gap) → context.staleness.dataConfidence muy bajo", () => {
      const oldTs = Date.now() - 90 * 86400000;
      const st = {
        ...baseSt(),
        history: [{ p: "test", ts: oldTs, c: 60, bioQ: 60, dur: 120 }],
      };
      const r = computeAdaptiveRecommendation(st);
      expect(r.context.staleness.daysSinceLast).toBeGreaterThanOrEqual(60);
      expect(r.context.staleness.dataConfidence).toBeLessThanOrEqual(0.25);
      expect(r.context.recalibration).toBeTruthy();
    });

    it("ningún options pasado → defaults seguros (no errores, primary válido)", () => {
      const r = computeAdaptiveRecommendation(baseSt());
      expect(r.primary.protocol).toBeTruthy();
      expect(r.context.nom35Bias).toBeNull();
      expect(r.context.readiness).toBeNull();
    });

    it("st sin history ni moodLog → no crash, retorna primary válido", () => {
      const r = computeAdaptiveRecommendation({
        totalSessions: 0, history: [], moodLog: [], weeklyData: [0, 0, 0, 0, 0, 0, 0],
      });
      expect(r).toBeTruthy();
      expect(r.primary.protocol).toBeTruthy();
    });
  });
});
