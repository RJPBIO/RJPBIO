/* HomeV2.smoke.test — Phase 6D SP6 Bug-26.
   Smoke tests con devOverride. Anti-regression: verificar que
   HomeV2 NO sirve fixtures hardcoded en sus branches principales.
   Tests usan useStore.setState para inyectar state minimal sin
   mockear el módulo entero (más realista). */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HomeV2 from "./HomeV2";
import { useStore } from "@/store/useStore";

const initialState = useStore.getState();

beforeEach(() => {
  // Reset store a defaults limpios para cada test (sin fixtures).
  useStore.setState(initialState, true);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-04T08:00:00"));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("HomeV2 — smoke Phase 6D SP6", () => {
  it("renderiza ColdStartView cuando devOverride='cold-start'", () => {
    render(<HomeV2 devOverride="cold-start" onNavigate={() => {}} onBellClick={() => {}} />);
    // ColdStartView renderiza saludo + cards. Verificamos que monta sin crash
    // y que NO inyecta strings de fixtures eliminados (ej. "Pulse Shift" estaba
    // hardcoded en SP1 antes del fix Bug-22).
    const html = document.body.innerHTML;
    expect(html).not.toContain("FIXTURE_");
    expect(html).not.toContain("neural-baseline");
    expect(html).not.toContain("Día 4 de 14");
  });

  it("renderiza PersonalizedView cuando devOverride='personalized'", () => {
    render(<HomeV2 devOverride="personalized" onNavigate={() => {}} onBellClick={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).not.toContain("FIXTURE_");
    // Composite mock 62 (applyDevOverride hardcoded para preview).
    expect(html).toMatch(/62/);
  });

  it("renderiza con state vacío real sin crash", () => {
    expect(() => render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />)).not.toThrow();
  });

  it("greeting se deriva de hora actual (no fixture)", () => {
    vi.setSystemTime(new Date("2026-05-04T08:00:00"));
    render(<HomeV2 devOverride="personalized" onNavigate={() => {}} onBellClick={() => {}} />);
    const html = document.body.innerHTML;
    // Saludo bucket-aware. Solo verificamos que NO esté el placeholder
    // "Hola User" o similar fixture text.
    expect(html).not.toContain("Hola User");
  });
});

// Phase 6E SP-A — Bug-48 ColdStart Stuck regression guard.
// Cubre cohortes intermedias 0..20+ verificando que HomeV2 SIEMPRE
// renderea contenido accionable (ningún rango produce viewport vacío).
describe("HomeV2 — Phase 6E SP-A NEVER empty viewport (Bug-48 anti-regression)", () => {
  const scenarios = [
    {
      name: "fresh user (0 sessions, ningún instrument)",
      state: { totalSessions: 0, history: [], instruments: [], chronotype: null, hrvLog: [], firstIntent: null },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-onboarding-row]",
    },
    {
      name: "post-onboarding (instruments + chronotype, history vacío)",
      state: { totalSessions: 0, history: [], instruments: [{ instrumentId: "pss-4" }, { instrumentId: "maia-2" }], chronotype: { type: "intermediate" }, hrvLog: [], firstIntent: "calma" },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-onboarding-row]",
    },
    {
      name: "post-1-session + todas las gates (Bug-48 reproducer original)",
      state: { totalSessions: 1, history: [{ ts: Date.now(), c: 60 }], instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-coldstart-empty]",
    },
    {
      name: "post-2-sessions con todas las gates → empty state",
      state: { totalSessions: 2, history: [{ c: 60 }, { c: 65 }], instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-coldstart-empty]",
    },
    {
      name: "post-3-sessions con todas las gates → empty state",
      state: { totalSessions: 3, history: [{ c: 60 }, { c: 65 }, { c: 70 }], instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-coldstart-empty]",
    },
    {
      name: "post-4-sessions con todas las gates → empty state (boundary cold-start)",
      state: { totalSessions: 4, history: [{ c: 60 }, { c: 65 }, { c: 70 }, { c: 68 }], instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "cold-start",
      expectedSelector: "[data-v2-coldstart-empty]",
    },
    {
      name: "post-5-sessions (entered learning per engine threshold)",
      state: { totalSessions: 5, history: Array.from({ length: 5 }, (_, i) => ({ c: 60 + i, ts: Date.now() - i * 86400000 })), instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "learning",
      expectedSelector: "[data-v2-learning-progress]",
    },
    {
      name: "post-10-sessions (mid-learning)",
      state: { totalSessions: 10, history: Array.from({ length: 10 }, (_, i) => ({ c: 60 + i, ts: Date.now() - i * 86400000 })), instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "learning",
      expectedSelector: "[data-v2-learning-progress]",
    },
    {
      name: "post-20-sessions (boundary personalized)",
      state: { totalSessions: 20, history: Array.from({ length: 20 }, (_, i) => ({ c: 60 + i, ts: Date.now() - i * 86400000 })), instruments: [{ instrumentId: "pss-4" }], chronotype: { type: "intermediate" }, hrvLog: [{ rmssd: 45 }], firstIntent: "calma" },
      expectedBranch: "personalized",
      expectedSelector: "[data-v2-hero]",
    },
  ];

  scenarios.forEach(({ name, state, expectedBranch, expectedSelector }) => {
    it(`scenario "${name}" → branch ${expectedBranch} con contenido accionable`, () => {
      useStore.setState({ ...initialState, ...state }, true);
      const { container } = render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />);
      // Greeting siempre visible
      expect(container.querySelector("[data-v2-greeting], [data-v2-hero]")).toBeTruthy();
      // Branch específico verificado
      expect(container.querySelector(expectedSelector)).toBeTruthy();
      // ASSERTION CRÍTICA: al menos UNO de los selectores actionables presente
      const actionableSelectors = [
        "[data-v2-onboarding-row]",
        "[data-v2-coldstart-empty]",
        "[data-v2-learning-progress]",
        "[data-v2-recommendation]",
        "[data-v2-hero]",
      ];
      const hasActionableContent = actionableSelectors.some((sel) => container.querySelector(sel) !== null);
      expect(hasActionableContent).toBe(true);
    });
  });

  it("LearningView fallback recommendation cuando engine retorna null (post-5-session, sin history rica)", () => {
    useStore.setState({
      ...initialState,
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({ ts: Date.now() - i * 86400000, c: 60 + i })),
      instruments: [{ instrumentId: "pss-4" }],
      chronotype: { type: "intermediate" },
      hrvLog: [{ rmssd: 45 }],
      firstIntent: "calma",
    }, true);
    const { container } = render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />);
    const reco = container.querySelector("[data-v2-recommendation]");
    expect(reco).toBeTruthy();
    // Source debe estar marcada (engine o fallback) — ambos válidos
    expect(reco.getAttribute("data-v2-recommendation-source")).toMatch(/engine|fallback/);
  });
});
