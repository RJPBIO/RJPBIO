/* ScientificEyebrowMorph.test — SP-B-1 Capa 3.
   Verifica render initial, morph animation, reduced motion, a11y. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  announce: vi.fn(),
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: mocks.announce,
}));

import ScientificEyebrowMorph from "./ScientificEyebrowMorph";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.announce.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ScientificEyebrowMorph — SP-B-1 Capa 3 render initial", () => {
  it("renderiza text initial", () => {
    render(<ScientificEyebrowMorph text="POLYVAGAL · 3.75 BRPM" />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el).toBeTruthy();
    expect(el.textContent).toBe("POLYVAGAL · 3.75 BRPM");
  });

  it("aria-live polite en root", () => {
    render(<ScientificEyebrowMorph text="HOLA" />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("data-phase-idx attr refleja prop", () => {
    render(<ScientificEyebrowMorph text="X" phaseIdx={2} />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.getAttribute("data-phase-idx")).toBe("2");
  });

  it("Color: matches getCyanForPhase(phaseIdx) inline style", () => {
    render(<ScientificEyebrowMorph text="X" phaseIdx={0} />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.style.color).toBe("rgb(14, 116, 144)"); // #0E7490 phase1 cyan-deep
  });

  it("Color phase 2: cyan-cool #67E8F9", () => {
    render(<ScientificEyebrowMorph text="X" phaseIdx={1} />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.style.color).toBe("rgb(103, 232, 249)");
  });

  it("Color phase 3: cyan-warm #06B6D4", () => {
    render(<ScientificEyebrowMorph text="X" phaseIdx={2} />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.style.color).toBe("rgb(6, 182, 212)");
  });

  it("Defensive: phaseIdx out of range → base phosphorCyan #22D3EE", () => {
    render(<ScientificEyebrowMorph text="X" phaseIdx={99} />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.style.color).toBe("rgb(34, 211, 238)");
  });
});

describe("ScientificEyebrowMorph — SP-B-1 Capa 3 morph animation", () => {
  it("Animation: data-is-animating='true' durante morph", () => {
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="XYZ" />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.getAttribute("data-is-animating")).toBe("true");
  });

  it("Animation: completes después de morphDurationMs (default 600ms)", () => {
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="XYZ" />);
    act(() => { vi.advanceTimersByTime(700); }); // > 600ms
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.textContent).toBe("XYZ");
    expect(el.getAttribute("data-is-animating")).toBe("false");
  });

  it("Animation: announce called con new text al completar", () => {
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="XYZ" />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(mocks.announce).toHaveBeenCalledWith("XYZ", "polite");
  });

  it("Same text rerender: NO triggers animation", () => {
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="ABC" />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.getAttribute("data-is-animating")).toBe("false");
  });

  it("morphDurationMs custom: respected", () => {
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" morphDurationMs={300} />);
    rerender(<ScientificEyebrowMorph text="XYZ" morphDurationMs={300} />);
    act(() => { vi.advanceTimersByTime(400); });
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.textContent).toBe("XYZ");
  });
});

describe("ScientificEyebrowMorph — SP-B-1 Capa 3 reduced motion", () => {
  it("Reduced motion: instant swap (no animation)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="XYZ" />);
    const el = document.querySelector('[data-testid="scientific-eyebrow-morph"]');
    expect(el.textContent).toBe("XYZ");
    expect(el.getAttribute("data-is-animating")).toBe("false");
  });

  it("Reduced motion: announce called with new text directamente", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(<ScientificEyebrowMorph text="ABC" />);
    rerender(<ScientificEyebrowMorph text="XYZ" />);
    expect(mocks.announce).toHaveBeenCalledWith("XYZ", "polite");
  });
});
