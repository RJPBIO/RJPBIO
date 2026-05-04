/* Phase 6D SP1 — ColdStartView buildActions selector tests.
   Verifica el filtrado dinámico de cards basado en state.chronotype,
   instruments, hrvLog y totalSessions, y la derivación del label de
   "Tu primera sesión" desde firstIntent. */

import { describe, it, expect } from "vitest";
import { buildActions } from "./ColdStartView";

const baseState = {
  firstIntent: null,
  chronotype: null,
  instruments: [],
  totalSessions: 0,
  hrvLog: [],
};

describe("buildActions — filtrado dinámico por state", () => {
  it("user totalmente nuevo (sin nada) muestra los 4 cards", () => {
    const actions = buildActions(baseState);
    expect(actions.map((a) => a.id)).toEqual(["primera", "cronotipo", "hrv", "pss4"]);
  });

  it("oculta card cronotipo cuando state.chronotype !== null", () => {
    const actions = buildActions({
      ...baseState,
      chronotype: { type: "intermediate", score: 15, label: "Intermedio", ts: Date.now() },
    });
    expect(actions.map((a) => a.id)).not.toContain("cronotipo");
  });

  it("oculta card pss4 cuando instruments incluye entry pss-4", () => {
    const actions = buildActions({
      ...baseState,
      instruments: [{ instrumentId: "pss-4", ts: Date.now(), score: 5, level: "low" }],
    });
    expect(actions.map((a) => a.id)).not.toContain("pss4");
  });

  it("oculta card hrv cuando hrvLog no está vacío", () => {
    const actions = buildActions({
      ...baseState,
      hrvLog: [{ ts: Date.now(), rmssd: 42, lnRmssd: 3.7, source: "camera" }],
    });
    expect(actions.map((a) => a.id)).not.toContain("hrv");
  });

  it("oculta card primera cuando totalSessions > 0", () => {
    const actions = buildActions({ ...baseState, totalSessions: 1 });
    expect(actions.map((a) => a.id)).not.toContain("primera");
  });

  it("oculta TODAS las cards cuando user completó todo onboarding + 1 sesión", () => {
    const actions = buildActions({
      firstIntent: "calma",
      chronotype: { type: "intermediate", score: 15, ts: Date.now() },
      instruments: [{ instrumentId: "pss-4", ts: Date.now(), score: 5, level: "low" }],
      totalSessions: 1,
      hrvLog: [{ ts: Date.now(), rmssd: 42, lnRmssd: 3.7 }],
    });
    expect(actions).toEqual([]);
  });

  it("instruments con otros instrumentId NO oculta card pss4", () => {
    const actions = buildActions({
      ...baseState,
      instruments: [{ instrumentId: "wemwbs-7", ts: Date.now(), score: 20, level: "average" }],
    });
    expect(actions.map((a) => a.id)).toContain("pss4");
  });
});

describe("buildActions — label derivado de firstIntent (Bug-09 fix)", () => {
  it("intent calma → label 'Reinicio Parasimpático · 120s · ...'", () => {
    const actions = buildActions({ ...baseState, firstIntent: "calma" });
    const primera = actions.find((a) => a.id === "primera");
    expect(primera).toBeDefined();
    expect(primera.description).toMatch(/Reinicio Parasimpático/);
    expect(primera.description).toMatch(/120s/);
  });

  it("intent enfoque → 'Activación Cognitiva'", () => {
    const actions = buildActions({ ...baseState, firstIntent: "enfoque" });
    const primera = actions.find((a) => a.id === "primera");
    expect(primera.description).toMatch(/Activación Cognitiva/);
  });

  it("intent energia → 'Pulse Shift'", () => {
    const actions = buildActions({ ...baseState, firstIntent: "energia" });
    const primera = actions.find((a) => a.id === "primera");
    expect(primera.description).toMatch(/Pulse Shift/);
  });

  it("intent reset → 'Reset Ejecutivo'", () => {
    const actions = buildActions({ ...baseState, firstIntent: "reset" });
    const primera = actions.find((a) => a.id === "primera");
    expect(primera.description).toMatch(/Reset Ejecutivo/);
  });

  it("intent null/desconocido → default 'Reinicio Parasimpático' (no Pulse Shift)", () => {
    const actions = buildActions({ ...baseState, firstIntent: null });
    const primera = actions.find((a) => a.id === "primera");
    expect(primera.description).toMatch(/Reinicio Parasimpático/);
    expect(primera.description).not.toMatch(/Pulse Shift/);
  });
});

describe("buildActions — copy correcto rMEQ (Bug-15 fix)", () => {
  it("card cronotipo cita 'rMEQ · 5 ítems · Adan & Almirall 1991', NO MEQ-SA 19", () => {
    const actions = buildActions(baseState);
    const cronotipo = actions.find((a) => a.id === "cronotipo");
    expect(cronotipo.description).toMatch(/rMEQ/);
    expect(cronotipo.description).toMatch(/5 ítems/);
    expect(cronotipo.description).toMatch(/Adan & Almirall 1991/);
    expect(cronotipo.description).not.toMatch(/MEQ-SA/);
    expect(cronotipo.description).not.toMatch(/19 preguntas/);
  });
});

describe("buildActions — actions canónicas Phase 6D", () => {
  it("card primera tiene action 'first-session' (no legacy 'start-pulse-shift')", () => {
    const actions = buildActions(baseState);
    const primera = actions.find((a) => a.id === "primera");
    expect(primera.action).toBe("first-session");
  });

  it("card cronotipo tiene action 'retake-chronotype'", () => {
    const actions = buildActions(baseState);
    const cronotipo = actions.find((a) => a.id === "cronotipo");
    expect(cronotipo.action).toBe("retake-chronotype");
  });

  it("card hrv tiene action 'new-hrv' (consistente con CalibrationView)", () => {
    const actions = buildActions(baseState);
    const hrv = actions.find((a) => a.id === "hrv");
    expect(hrv.action).toBe("new-hrv");
  });

  it("card pss4 tiene action 'retake-pss4'", () => {
    const actions = buildActions(baseState);
    const pss4 = actions.find((a) => a.id === "pss4");
    expect(pss4.action).toBe("retake-pss4");
  });
});

describe("buildActions — defensivo contra inputs malformados", () => {
  it("instruments undefined no crashea", () => {
    const actions = buildActions({ ...baseState, instruments: undefined });
    expect(actions.map((a) => a.id)).toContain("pss4");
  });

  it("hrvLog undefined no crashea", () => {
    const actions = buildActions({ ...baseState, hrvLog: undefined });
    expect(actions.map((a) => a.id)).toContain("hrv");
  });

  it("totalSessions undefined trata como 0", () => {
    const actions = buildActions({ ...baseState, totalSessions: undefined });
    expect(actions.map((a) => a.id)).toContain("primera");
  });
});
