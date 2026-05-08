/* DimensionsRow.tier4.test — Phase Polish-Tier-4 Capa 2.
   Cubre el sparklineData prop opcional de DimensionsRow (mini-sparklines
   per-chip via Sparkline component). Anti-regression: tests Phase 6H Fix1
   y Polish-Tier-1 NO se modifican; este suite es additive. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import DimensionsRow from "./DimensionsRow";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("@/store/useStore", () => ({
  useStore: (selector) => selector({ hapticOn: true }),
}));

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

describe("DimensionsRow — Polish-Tier-4 Capa-2 mini-sparklines", () => {
  it("sparklineData ausente → no mini-sparklines (legacy preservado)", () => {
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    expect(document.querySelectorAll("[data-v2-dim-sparkline]")).toHaveLength(0);
  });

  it("sparklineData con todas las series < 2 → no sparklines (defensive)", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{ foco: [{ value: 70, ts: 1 }], calma: [], energia: [] }}
      />
    );
    expect(document.querySelectorAll("[data-v2-dim-sparkline]")).toHaveLength(0);
  });

  it("sparklineData solo foco con >=2 → solo chip foco muestra sparkline", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }],
          calma: [],
          energia: [],
        }}
      />
    );
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-foco"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-calma"]')).toBeNull();
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-energia"]')).toBeNull();
  });

  it("sparklineData con 3 series populated → 3 chips con sparkline", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }],
          calma: [{ value: 60, ts: 1 }, { value: 65, ts: 2 }, { value: 70, ts: 3 }],
          energia: [{ value: 75, ts: 1 }, { value: 78, ts: 2 }],
        }}
      />
    );
    expect(document.querySelectorAll("[data-v2-dim-sparkline]")).toHaveLength(3);
    expect(document.querySelector('[data-testid="dim-sparkline-foco"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dim-sparkline-calma"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dim-sparkline-energia"]')).toBeTruthy();
  });

  it("sparkline muted color (rgba 0.55) — distinto del hero phosphorCyan", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }],
          calma: [], energia: [],
        }}
      />
    );
    const linePath = document.querySelectorAll('[data-testid="dim-sparkline-foco"] path')[1];
    expect(linePath.getAttribute("stroke")).toBe("rgba(255,255,255,0.55)");
  });

  it("sparkline ariaLabel refleja count del data per-dim", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }, { value: 80, ts: 3 }],
          calma: [], energia: [],
        }}
      />
    );
    const svg = document.querySelector('[data-testid="dim-sparkline-foco"]');
    expect(svg.getAttribute("aria-label")).toMatch(/foco.*3 días/i);
  });

  it("source='fallback' → chip omitido + su sparkline también omitido", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sources={{ foco: "measured", calma: "fallback", energia: "measured" }}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }],
          calma: [{ value: 60, ts: 1 }, { value: 65, ts: 2 }], // available pero chip oculto
          energia: [{ value: 75, ts: 1 }, { value: 78, ts: 2 }],
        }}
      />
    );
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-foco"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-calma"]')).toBeNull();
    expect(document.querySelector('[data-testid="dimensions-chip-sparkline-energia"]')).toBeTruthy();
  });

  it("anti-regression: data-v2-dim selectors preservados", () => {
    render(
      <DimensionsRow
        focus={70} calm={60} energy={75}
        sparklineData={{
          foco: [{ value: 70, ts: 1 }, { value: 75, ts: 2 }],
          calma: [{ value: 60, ts: 1 }, { value: 65, ts: 2 }],
          energia: [{ value: 75, ts: 1 }, { value: 80, ts: 2 }],
        }}
      />
    );
    expect(document.querySelectorAll("[data-v2-dim]")).toHaveLength(3);
    expect(document.querySelector('[data-v2-dim="foco"]')).toBeTruthy();
  });
});
