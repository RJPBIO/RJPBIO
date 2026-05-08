/* LearningView.fix-a1.test — Phase 6H Fix-A1.
   Integration test: engine real shape (`primary.protocol`) llega correctamente
   al RecommendationCard, source="engine", reason caption visible. Test file
   separado del baseline + bugfix para no modificar tests existing. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import LearningView from "./LearningView";

// Mock useAdaptiveRecommendation con shape REAL del engine.
const recommendationMock = vi.fn();
vi.mock("@/hooks/useAdaptiveRecommendation", () => ({
  useAdaptiveRecommendation: (...args) => recommendationMock(...args),
}));

// Mock useReadiness — engine consumer pero out of scope aquí.
vi.mock("@/hooks/useReadiness", () => ({
  useReadiness: () => null,
}));

// Mock useActiveProgram — server fetch, out of scope.
vi.mock("@/hooks/useActiveProgram", () => ({
  useActiveProgram: () => ({ data: null, refetch: vi.fn() }),
}));

// Mock useStore — minimal state for LearningView render.
const mockStore = {
  history: Array.from({ length: 7 }, (_, i) => ({ p: "Test", c: 60, ts: Date.now() - i * 86400000 })),
  firstIntent: "calma",
  streak: 3,
  coherencia: 65,
  resiliencia: 60,
  capacidad: 58,
};
vi.mock("@/store/useStore", () => ({
  useStore: (selector) => {
    if (typeof selector === "function") return selector(mockStore);
    return mockStore;
  },
}));

beforeEach(() => {
  recommendationMock.mockReset();
});

afterEach(() => cleanup());

describe("LearningView — Phase 6H Fix-A1 engine real shape integration", () => {
  it("engine real shape (primary.protocol) → recoCard usa protocol.n + source=engine + reason visible", () => {
    recommendationMock.mockReturnValue({
      primary: {
        protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" },
        score: 73.5,
        reason: "Tu historial muestra +1.2 puntos con este protocolo",
      },
      alternatives: [],
      need: "energia",
    });
    const { container } = render(
      <LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />
    );
    const recoCard = container.querySelector("[data-v2-recommendation]");
    expect(recoCard).toBeTruthy();
    // Source attr correctamente "engine"
    expect(recoCard.getAttribute("data-v2-recommendation-source")).toBe("engine");
    // Title del card es engine protocol.n (NO fallback firstProtocolForIntent)
    expect(recoCard.textContent).toMatch(/Pulse Shift/);
    // Reason caption visible (engine string)
    const reasonCaption = container.querySelector("[data-v2-recommendation-reason]");
    expect(reasonCaption).toBeTruthy();
    expect(reasonCaption.textContent).toMatch(/Tu historial muestra \+1\.2 puntos/);
  });

  it("engine sin reason → card muestra protocol pero NO reason caption", () => {
    recommendationMock.mockReturnValue({
      primary: {
        protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" },
        score: 73.5,
        // NO reason
      },
    });
    const { container } = render(
      <LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />
    );
    expect(container.querySelector("[data-v2-recommendation-source]").getAttribute("data-v2-recommendation-source")).toBe("engine");
    // Reason caption NO renderea
    expect(container.querySelector("[data-v2-recommendation-reason]")).toBeNull();
  });

  it("engine null → fallback rotation, source=fallback, NO reason", () => {
    recommendationMock.mockReturnValue(null);
    const { container } = render(
      <LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />
    );
    const recoCard = container.querySelector("[data-v2-recommendation]");
    expect(recoCard.getAttribute("data-v2-recommendation-source")).toBe("fallback");
    expect(container.querySelector("[data-v2-recommendation-reason]")).toBeNull();
  });

  it("engine con primary.protocol pero alternative reasons → solo primary reason expuesto", () => {
    recommendationMock.mockReturnValue({
      primary: {
        protocol: { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma" },
        score: 80,
        reason: "Reportaste tensión alta: regulación parasimpática antes de cualquier carga",
      },
      alternatives: [
        { protocol: { id: 4, n: "Pulse Shift" }, score: 65, reason: "ALTERNATIVE REASON SHOULD NOT APPEAR" },
      ],
    });
    const { container } = render(
      <LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />
    );
    const reasonCaption = container.querySelector("[data-v2-recommendation-reason]");
    expect(reasonCaption.textContent).toMatch(/Reportaste tensión alta/);
    expect(reasonCaption.textContent).not.toMatch(/ALTERNATIVE REASON/);
  });

  it("engine real samples (4 reasons distintas) → todos extracted + visibles", () => {
    const samples = [
      { reason: "Prioridad: reducir riesgo de agotamiento sostenido", proto: { id: 1, n: "Reinicio Parasimpático", int: "calma" } },
      { reason: "Readiness elevado (78): ventana para trabajo cognitivo exigente", proto: { id: 2, n: "Activación Cognitiva", int: "enfoque" } },
      { reason: "Reportaste agotamiento: descarga cognitiva antes de activar", proto: { id: 3, n: "Reset Ejecutivo", int: "reset" } },
      { reason: "Tu sistema necesita regulación parasimpática", proto: { id: 1, n: "Reinicio Parasimpático", int: "calma" } },
    ];
    for (const sample of samples) {
      recommendationMock.mockReturnValue({
        primary: { protocol: sample.proto, score: 70, reason: sample.reason },
      });
      const { container, unmount } = render(
        <LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />
      );
      const reasonCaption = container.querySelector("[data-v2-recommendation-reason]");
      expect(reasonCaption).toBeTruthy();
      expect(reasonCaption.textContent).toBe(sample.reason);
      unmount();
    }
  });
});
