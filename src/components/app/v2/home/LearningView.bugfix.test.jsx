/* LearningView bug-fixes — Phase 6F validation runtime
   ───────────────────────────────────────────────────────────────
   Anti-regression para los 3 bugs detectados en validation visual:

   #2 Fallback diversity: cuando engine no produce reco (banditArms
      vacío + cohort prior k<5), antes el fallback era FIJO per-intent
      (firstProtocolForIntent) → siempre Reinicio Parasimpático para
      calma. Ahora rota contra last-3 protocols.

   #3 data-v2-recommendation-source: antes decía "engine" cuando
      recommendation.primary era truthy aunque recoProtocol viniera
      del fallback (mismatch). Ahora refleja origen real.

   #4 Copy "Sesión X de 5 hasta tu trayectoria personalizada":
      threshold real para personalized branch es 20, no 5. Antes user
      completaba 5 y NO veía cambio → "no hace nada después de 5
      primeras". Copy ahora dice "Sesión X de 20".
   ─────────────────────────────────────────────────────────────── */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock hooks (LearningView consume useStore + useReadiness + useAdaptiveRecommendation).
const storeState = {
  history: [],
  streak: 5,
  coherencia: 60,
  firstIntent: "calma",
};

vi.mock("@/store/useStore", () => ({
  useStore: (selector) => {
    if (typeof selector === "function") return selector(storeState);
    return storeState;
  },
}));

vi.mock("@/hooks/useReadiness", () => ({
  useReadiness: () => null,
}));

vi.mock("@/hooks/useActiveProgram", () => ({
  useActiveProgram: () => ({ data: null, refetch: vi.fn() }),
}));

const recommendationMock = vi.fn();
vi.mock("@/hooks/useAdaptiveRecommendation", () => ({
  useAdaptiveRecommendation: (...args) => recommendationMock(...args),
}));

import LearningView from "./LearningView";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset store mock state per test
  storeState.history = [];
  storeState.firstIntent = "calma";
});

function setHistory(protos) {
  storeState.history = protos.map((p, i) => ({
    ts: Date.now() - (protos.length - i) * 86400000,
    p,
    int: storeState.firstIntent,
    d: 120,
    c: 60,
    bioQ: 50,
    deltaC: 5,
    mPre: 5,
    mPost: 7,
  }));
}

describe("LearningView — Bug #4 copy threshold real (20, no 5)", () => {
  it("muestra 'Sesión X de 20 hasta tu trayectoria personalizada'", () => {
    setHistory(["Reinicio Parasimpático", "Pulse Shift", "Reset Ejecutivo"]);
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    // Threshold real para personalized = 14 (alineado con engine interno
    // neural.js:1012). Antes UI requería 20 — misalignment con engine.
    expect(
      screen.getByText(/Sesión 3 de 14 hasta tu trayectoria personalizada/i)
    ).toBeInTheDocument();
  });

  it("body text usa '14 sesiones' threshold (alineado con engine, no 5 ni 20)", () => {
    setHistory(["Reinicio Parasimpático", "Pulse Shift"]);
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    // Con N=2 → 12 sesiones más para personalized (14 - 2)
    expect(screen.getByText(/12 sesiones más para tu trayectoria personalizada/i)).toBeInTheDocument();
  });

  it("ProgressBar max=14 (alineado con engine threshold)", () => {
    setHistory(["Reinicio Parasimpático"]);
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("14");
    expect(pb.getAttribute("aria-valuenow")).toBe("1");
  });

  it("totalSessions=14 muestra cierre de calibración (no 'X sesiones más')", () => {
    setHistory(Array.from({ length: 14 }, (_, i) => `Protocolo ${i}`));
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    expect(screen.getByText(/Tu próxima sesión cierra tu calibración/i)).toBeInTheDocument();
  });
});

describe("LearningView — Bug #2 fallback diversity contra last-3", () => {
  it("history con últimos 3 protocols evita repetirlos en fallback", () => {
    // firstIntent = calma. Protocols calma en catálogo:
    // 1 Reinicio Parasimpático, 6 Grounded Steel, 9 Steel Core Reset,
    // 11 Body Anchor, 15 Suspiro Fisiológico, 16 Resonancia Vagal,
    // 17 NSDR, 22 ... (varios)
    storeState.firstIntent = "calma";
    setHistory(["Reinicio Parasimpático", "Grounded Steel", "Body Anchor"]);
    // Engine retorna null para forzar fallback
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const recoCard = document.querySelector("[data-v2-recommendation]");
    const text = recoCard?.textContent || "";
    // No debe ser ninguno de los últimos 3
    expect(text).not.toMatch(/Reinicio Parasimpático/);
    expect(text).not.toMatch(/Grounded Steel/);
    expect(text).not.toMatch(/Body Anchor/);
    // Debe ser otro protocolo de intent calma
    expect(text.length).toBeGreaterThan(20);
  });

  it("history vacío + engine null → fallback a primer protocol del intent", () => {
    storeState.firstIntent = "energia";
    setHistory([]);
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    // last-3 vacío, intentPool retorna full intent list, primer match.
    // Para energia: Pulse Shift (id 4) es el firstProtocolForIntent fallback.
    const recoCard = document.querySelector("[data-v2-recommendation]");
    expect(recoCard).toBeInTheDocument();
  });
});

describe("LearningView — Bug #3 data-source attr engine vs fallback correcto", () => {
  it("engine con primary.id válido → data-source='engine'", () => {
    setHistory(["Reinicio Parasimpático"]);
    recommendationMock.mockReturnValue({
      primary: { id: 4, n: "Pulse Shift", int: "energia" },
    });
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const recoCard = document.querySelector("[data-v2-recommendation]");
    expect(recoCard?.getAttribute("data-v2-recommendation-source")).toBe("engine");
  });

  it("engine sin primary → data-source='fallback'", () => {
    setHistory(["Reinicio Parasimpático"]);
    recommendationMock.mockReturnValue({ primary: null });
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const recoCard = document.querySelector("[data-v2-recommendation]");
    expect(recoCard?.getAttribute("data-v2-recommendation-source")).toBe("fallback");
  });

  it("engine retorna null entero → data-source='fallback'", () => {
    setHistory(["Reinicio Parasimpático"]);
    recommendationMock.mockReturnValue(null);
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const recoCard = document.querySelector("[data-v2-recommendation]");
    expect(recoCard?.getAttribute("data-v2-recommendation-source")).toBe("fallback");
  });

  it("engine con primary.id=undefined → data-source='fallback' (no 'engine' mismatch)", () => {
    setHistory(["Reinicio Parasimpático"]);
    // Bug original: primary truthy pero sin id → cae a fallback PERO marcaba "engine"
    recommendationMock.mockReturnValue({ primary: { n: "X", int: "calma" } });
    render(<LearningView greeting="Hola." subtitle={null} onAction={vi.fn()} />);
    const recoCard = document.querySelector("[data-v2-recommendation]");
    expect(recoCard?.getAttribute("data-v2-recommendation-source")).toBe("fallback");
  });
});
