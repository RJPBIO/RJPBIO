/* Phase 6D SP1 — ColdStartView buildActions selector tests.
   Verifica el filtrado dinámico de cards basado en state.chronotype,
   instruments, hrvLog y totalSessions, y la derivación del label de
   "Tu primera sesión" desde firstIntent.

   Phase 6E SP-A — extendido con tests del empty state (Bug-48). */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import ColdStartView, { buildActions } from "./ColdStartView";
import { useStore } from "@/store/useStore";

const initialStoreState = useStore.getState();

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

// ─── Phase 6E SP-A — Bug-48 ColdStart Stuck empty state tests ──────

function setStore(partial) {
  useStore.setState({ ...initialStoreState, ...partial }, true);
}

describe("ColdStartView empty state — Phase 6E SP-A Bug-48", () => {
  beforeEach(() => { setStore({}); });
  afterEach(() => { cleanup(); });

  it("renderiza EmptyColdStart cuando todas las gates pasan (actions=[])", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 1,
      history: [{ ts: Date.now(), c: 60, p: "test" }],
      instruments: [{ instrumentId: "pss-4", ts: Date.now(), score: 6 }],
      chronotype: { type: "intermediate", label: "Intermedio", score: 12 },
      hrvLog: [{ rmssd: 45, ts: Date.now() }],
    });
    const { container } = render(
      <ColdStartView greeting="Hola." subtitle="Vamos a conocerte." totalSessions={1} onAction={() => {}} />,
    );
    expect(container.querySelector("[data-v2-coldstart-empty]")).toBeTruthy();
    expect(container.querySelector("[data-v2-onboarding-row]")).toBeNull();
  });

  it("eyebrow cambia a 'TU PRÓXIMA ACCIÓN' cuando empty state activo", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 1,
      history: [{}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container } = render(
      <ColdStartView greeting="Hola." totalSessions={1} onAction={() => {}} />,
    );
    expect(container.textContent).toMatch(/TU PRÓXIMA ACCIÓN/);
    expect(container.textContent).not.toMatch(/EMPEZAR POR AQUÍ/);
  });

  it("greeting/subtitle cambian a 'Listo para tu próxima sesión.' cuando empty", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 1,
      history: [{}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container } = render(
      <ColdStartView greeting="Hola." subtitle="Vamos a conocerte." totalSessions={1} onAction={() => {}} />,
    );
    expect(container.textContent).toMatch(/Listo para tu próxima sesión/);
    expect(container.textContent).not.toMatch(/Vamos a conocerte/);
  });

  it("NO renderiza EmptyColdStart cuando user tiene cards (state inicial)", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 0,
      history: [],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { container } = render(
      <ColdStartView greeting="Hola." totalSessions={0} onAction={() => {}} />,
    );
    expect(container.querySelector("[data-v2-coldstart-empty]")).toBeNull();
    expect(container.querySelectorAll("[data-v2-onboarding-row]").length).toBeGreaterThan(0);
    expect(container.textContent).toMatch(/EMPEZAR POR AQUÍ/);
  });

  it("EmptyColdStart CTA dispara onAction con first-session", () => {
    const onAction = vi.fn();
    setStore({
      firstIntent: "calma",
      totalSessions: 1,
      history: [{}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { getByTestId } = render(
      <ColdStartView greeting="Hola." totalSessions={1} onAction={onAction} />,
    );
    fireEvent.click(getByTestId("coldstart-empty-cta"));
    expect(onAction).toHaveBeenCalledWith({ action: "first-session" });
  });

  it("copy refleja sessionsToBaseline correctamente (totalSessions=2 → '3 sesiones más', singular en 4)", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 2,
      history: [{}, {}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container, rerender } = render(
      <ColdStartView greeting="Hola." totalSessions={2} onAction={() => {}} />,
    );
    expect(container.textContent).toMatch(/Sesión 2 de 5/);
    expect(container.textContent).toMatch(/3 sesiones más/);

    cleanup();
    setStore({
      firstIntent: "calma",
      totalSessions: 4,
      history: [{}, {}, {}, {}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container: c2 } = render(
      <ColdStartView greeting="Hola." totalSessions={4} onAction={() => {}} />,
    );
    expect(c2.textContent).toMatch(/Sesión 4 de 5/);
    expect(c2.textContent).toMatch(/1 sesión más/);
    expect(c2.textContent).not.toMatch(/1 sesiones más/);
  });

  it("totalSessions prop tiene precedencia sobre store.totalSessions", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 99, // ← store dice 99 (incorrecto)
      history: [{}, {}, {}], // ← real es 3
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container } = render(
      <ColdStartView greeting="Hola." totalSessions={3} onAction={() => {}} />,
    );
    expect(container.textContent).toMatch(/Sesión 3 de 5/);
    expect(container.textContent).not.toMatch(/Sesión 99/);
  });
});
