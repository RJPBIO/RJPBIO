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
});
