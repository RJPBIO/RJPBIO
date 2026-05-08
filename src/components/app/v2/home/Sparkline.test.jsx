/* Sparkline.test — Phase Polish-Tier-2 Gap-4. */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import Sparkline from "./Sparkline";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return { ...actual, useReducedMotion: vi.fn(() => false) };
});

import * as a11y from "@/lib/a11y";

describe("Sparkline — Polish-Tier-2 Gap-4", () => {
  it("data ausente → returns null (no render)", () => {
    const { container } = render(<Sparkline data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("solo 1 punto → returns null (mínimo 2 requerido)", () => {
    const { container } = render(<Sparkline data={[{ value: 50, ts: 1 }]} />);
    expect(container.firstChild).toBeNull();
  });

  it("2+ puntos válidos → SVG renders con path line + fill", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }, { value: 60, ts: 3 }]} />);
    const svg = document.querySelector("[data-v2-sparkline]");
    expect(svg).toBeTruthy();
    const paths = svg.querySelectorAll("path");
    expect(paths).toHaveLength(2); // fill + line
  });

  it("scaling correct: max value en y=0, min value en y=height", () => {
    render(<Sparkline data={[{ value: 10, ts: 1 }, { value: 90, ts: 2 }]} width={100} height={20} />);
    const linePath = document.querySelectorAll("[data-v2-sparkline] path")[1];
    const d = linePath.getAttribute("d");
    // Min (10) at first point: y=height=20; Max (90) at second: y=0.
    expect(d).toMatch(/M 0,20 L 100,0/);
  });

  it("flat data (todos iguales) → línea al medio (no div-by-0 collapse)", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 50, ts: 2 }]} width={100} height={20} />);
    const linePath = document.querySelectorAll("[data-v2-sparkline] path")[1];
    const d = linePath.getAttribute("d");
    // height/2 = 10 — flat line en mitad.
    expect(d).toMatch(/M 0,10 L 100,10/);
  });

  it("stroke default es phosphorCyan #22D3EE", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} />);
    const linePath = document.querySelectorAll("[data-v2-sparkline] path")[1];
    expect(linePath.getAttribute("stroke")).toBe("#22D3EE");
  });

  it("custom strokeColor respetado", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} strokeColor="#FF0000" />);
    const linePath = document.querySelectorAll("[data-v2-sparkline] path")[1];
    expect(linePath.getAttribute("stroke")).toBe("#FF0000");
  });

  it("showDots=true → renderea círculos en cada punto", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }, { value: 60, ts: 3 }]} showDots />);
    const circles = document.querySelectorAll("[data-v2-sparkline] circle");
    expect(circles).toHaveLength(3);
  });

  it("showDots=false (default) → 0 círculos", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} />);
    const circles = document.querySelectorAll("[data-v2-sparkline] circle");
    expect(circles).toHaveLength(0);
  });

  it("reduced-motion → no fade-in animation", () => {
    a11y.useReducedMotion.mockReturnValueOnce(true);
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} />);
    const svg = document.querySelector("[data-v2-sparkline]");
    expect(svg.style.animation).toBe("none");
  });

  it("ariaLabel custom propagado para a11y", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} ariaLabel="Tendencia bio últimos 14 días" />);
    const svg = document.querySelector("[data-v2-sparkline]");
    expect(svg.getAttribute("aria-label")).toBe("Tendencia bio últimos 14 días");
    expect(svg.getAttribute("role")).toBe("img");
  });

  it("testid custom propagado", () => {
    render(<Sparkline data={[{ value: 50, ts: 1 }, { value: 70, ts: 2 }]} testid="my-spark" />);
    expect(document.querySelector('[data-testid="my-spark"]')).toBeTruthy();
  });

  it("entries con value no-numérico → filtrados (mínimo 2 válidos requeridos)", () => {
    const { container } = render(<Sparkline data={[
      { value: "bad", ts: 1 },
      { value: 50, ts: 2 },
    ]} />);
    // Solo 1 válido tras filter → null.
    expect(container.firstChild).toBeNull();
  });
});
