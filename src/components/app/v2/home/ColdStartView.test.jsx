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

// ============================================================================
// Phase 6H Premium-Fix2 — phase=fresh|active intermediate state (H-2 finding)
// ============================================================================
describe("ColdStartView phase — Phase 6H Premium-Fix2", () => {
  beforeEach(() => { setStore({}); });
  afterEach(() => { cleanup(); });

  it("phase=fresh (totalSessions=0) → data-phase='fresh', no progress ni mini-stats", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 0,
      history: [],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { container } = render(
      <ColdStartView greeting="Buenas noches." totalSessions={0} onAction={() => {}} />,
    );
    expect(container.querySelector("[data-v2-coldstart][data-phase='fresh']")).toBeTruthy();
    expect(container.querySelector('[data-testid="coldstart-active-progress"]')).toBeNull();
    expect(container.querySelector("[data-v2-mini-stats-row]")).toBeNull();
    // Eyebrow legacy preservado
    expect(container.textContent).toMatch(/EMPEZAR POR AQUÍ/);
    // Subtitle legacy preservado
    expect(container.textContent).toMatch(/Vamos a conocerte/);
  });

  it("phase=active+actions (totalSessions=3 con HRV pendiente) → progress + mini-stats + copy adapter", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 3,
      history: [{ ts: Date.now() - 86400000, c: 60 }, { ts: Date.now() - 3600000, c: 65 }, { ts: Date.now(), c: 68 }],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [], // ← gap: HRV pendiente
      streak: 2,
    });
    const { container } = render(
      <ColdStartView
        greeting="Buenas noches."
        totalSessions={3}
        onAction={() => {}}
        recommendation={null}
        streak={2}
        nextWindow="22:00"
      />,
    );
    expect(container.querySelector("[data-v2-coldstart][data-phase='active']")).toBeTruthy();
    expect(container.querySelector('[data-testid="coldstart-active-progress"]')).toBeTruthy();
    expect(container.querySelector("[data-v2-mini-stats-row]")).toBeTruthy();
    // ProgressBar value=3 max=5
    const bar = container.querySelector("[data-v2-learning-progressbar]");
    expect(bar.getAttribute("aria-valuenow")).toBe("3");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
    // Copy adapter activo
    expect(container.textContent).toMatch(/TU PRÓXIMO PASO/);
    expect(container.textContent).toMatch(/Tu trayectoria está tomando forma/);
    expect(container.textContent).not.toMatch(/EMPEZAR POR AQUÍ/);
    // Mini-stats valores
    expect(container.querySelector('[data-testid="mini-stat-sessions"]').textContent).toContain("3");
    expect(container.querySelector('[data-testid="mini-stat-streak"]').textContent).toContain("2d");
    expect(container.querySelector('[data-testid="mini-stat-window"]').textContent).toContain("22:00");
  });

  it("phase=active+actions con recommendation engine → reco card prepended", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 2,
      history: [{}, {}],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const recommendation = { primary: { id: "reinicio-parasimpatico", n: "Reinicio Parasimpático", d: 120 } };
    const { container } = render(
      <ColdStartView
        greeting="Buenas tardes."
        totalSessions={2}
        onAction={() => {}}
        recommendation={recommendation}
        streak={1}
        nextWindow="09:30"
      />,
    );
    const recoCard = container.querySelector('[data-testid="coldstart-active-recommendation"]');
    expect(recoCard).toBeTruthy();
    expect(recoCard.textContent).toMatch(/RECOMENDADO/);
    expect(recoCard.textContent).toMatch(/Reinicio Parasimpático/);
  });

  it("phase=active+actions sin recommendation → fallback firstProtocolForIntent", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 2,
      history: [{}, {}],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { container } = render(
      <ColdStartView
        greeting="Hola."
        totalSessions={2}
        onAction={() => {}}
        recommendation={null}
        streak={0}
        nextWindow={null}
      />,
    );
    // Fallback firstProtocolForIntent("calma") devuelve un protocol válido
    const recoCard = container.querySelector('[data-testid="coldstart-active-recommendation"]');
    expect(recoCard).toBeTruthy();
    expect(recoCard.textContent).toMatch(/RECOMENDADO/);
    // Streak=0 → muestra "—"
    expect(container.querySelector('[data-testid="mini-stat-streak"]').textContent).toContain("—");
    // nextWindow=null → muestra "—"
    expect(container.querySelector('[data-testid="mini-stat-window"]').textContent).toContain("—");
  });

  it("phase=active+empty (gates done) → NO progress ni mini-stats (preserva EmptyColdStart legacy)", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 1,
      history: [{}],
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
    });
    const { container } = render(
      <ColdStartView
        greeting="Hola."
        totalSessions={1}
        onAction={() => {}}
        recommendation={null}
        streak={1}
        nextWindow="22:00"
      />,
    );
    expect(container.querySelector("[data-v2-coldstart][data-phase='active']")).toBeTruthy();
    // EmptyColdStart card preservada
    expect(container.querySelector("[data-v2-coldstart-empty]")).toBeTruthy();
    // No progress ni mini-stats (no aplica al empty case)
    expect(container.querySelector('[data-testid="coldstart-active-progress"]')).toBeNull();
    expect(container.querySelector("[data-v2-mini-stats-row]")).toBeNull();
    // Reco persistente NO se muestra cuando hasActions=false
    expect(container.querySelector('[data-testid="coldstart-active-recommendation"]')).toBeNull();
    // Copy legacy empty
    expect(container.textContent).toMatch(/Listo para tu próxima sesión/);
    expect(container.textContent).toMatch(/TU PRÓXIMA ACCIÓN/);
  });

  it("phase=active+actions sin protocol resoluble (intent inválido) → no reco card pero progress/mini-stats sí", () => {
    setStore({
      firstIntent: null, // sin intent → firstProtocolForIntent devuelve fallback default
      totalSessions: 2,
      history: [{}, {}],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { container } = render(
      <ColdStartView
        greeting="Hola."
        totalSessions={2}
        onAction={() => {}}
        recommendation={null}
        streak={0}
        nextWindow={null}
      />,
    );
    // Progress y mini-stats SÍ visibles (independientes de reco)
    expect(container.querySelector('[data-testid="coldstart-active-progress"]')).toBeTruthy();
    expect(container.querySelector("[data-v2-mini-stats-row]")).toBeTruthy();
  });

  it("anti-regression: phase=fresh + recommendation prop ignorada (no reco card en fresh)", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 0,
      history: [],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const recommendation = { primary: { id: "reinicio-parasimpatico", n: "Reinicio", d: 120 } };
    const { container } = render(
      <ColdStartView
        greeting="Buenas noches."
        totalSessions={0}
        onAction={() => {}}
        recommendation={recommendation}
        streak={0}
        nextWindow="22:00"
      />,
    );
    // Phase=fresh → NO reco persistent
    expect(container.querySelector('[data-testid="coldstart-active-recommendation"]')).toBeNull();
    // Y todas las cards legacy visibles
    expect(container.querySelectorAll("[data-v2-onboarding-row]").length).toBeGreaterThanOrEqual(4);
  });

  it("threshold: totalSessions=4 sigue en cold-start phase=active; threshold N=5 elevation es responsabilidad de HomeV2", () => {
    setStore({
      firstIntent: "calma",
      totalSessions: 4,
      history: [{}, {}, {}, {}],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { container } = render(
      <ColdStartView
        greeting="Hola."
        totalSessions={4}
        onAction={() => {}}
        recommendation={null}
        streak={4}
        nextWindow="22:00"
      />,
    );
    expect(container.querySelector("[data-v2-coldstart][data-phase='active']")).toBeTruthy();
    const bar = container.querySelector("[data-v2-learning-progressbar]");
    expect(bar.getAttribute("aria-valuenow")).toBe("4");
    expect(bar.getAttribute("aria-valuemax")).toBe("5");
  });

  it("acción tap en reco card invoca onAction con item shape correcto", () => {
    const onAction = vi.fn();
    setStore({
      firstIntent: "calma",
      totalSessions: 2,
      history: [{}, {}],
      instruments: [],
      chronotype: null,
      hrvLog: [],
    });
    const { getByTestId } = render(
      <ColdStartView
        greeting="Hola."
        totalSessions={2}
        onAction={onAction}
        recommendation={{ primary: { id: "reinicio-parasimpatico", n: "Reinicio", d: 120 } }}
        streak={0}
        nextWindow={null}
      />,
    );
    fireEvent.click(getByTestId("coldstart-active-recommendation"));
    expect(onAction).toHaveBeenCalledTimes(1);
    const arg = onAction.mock.calls[0][0];
    expect(arg.action).toBe("start-protocol");
    expect(arg.protocolId).toBe("reinicio-parasimpatico");
  });
});
