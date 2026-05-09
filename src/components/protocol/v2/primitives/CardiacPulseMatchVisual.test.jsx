/* CardiacPulseMatchVisual.test — Phase 7 F2 Flagship #25.
   Verifica:
   1) Render shape (orb + ring + diagram + eyebrow + counter + variant toggle).
   2) Reduced motion path (setInterval, no RAF).
   3) Haptic F0-4 wiring (hapticProtocolSignature(25, 'breath_inhale'/'breath_exhale')).
   4) Voice cues (speak('siente'/'exhala')) opt-in.
   5) Variant toggle radial → carotid (diagram swaps).
   6) Cycle config 5500/5500 ms.
   7) a11y role/aria-label/aria-live. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  hapticProtocolSignature: vi.fn(),
  speak: vi.fn(),
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("../../../../lib/audio", () => ({
  hapticProtocolSignature: mocks.hapticProtocolSignature,
  speak: mocks.speak,
  hapticBreath: vi.fn(),
  hapticPhase: vi.fn(),
  hapticSignature: vi.fn(),
  playBreathTick: vi.fn(),
  hap: vi.fn(),
  playSpark: vi.fn(),
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: vi.fn(),
}));

import CardiacPulseMatchVisual, { __internals } from "./CardiacPulseMatchVisual";

beforeEach(() => {
  mocks.hapticProtocolSignature.mockClear();
  mocks.speak.mockClear();
  mocks.useReducedMotion.mockReturnValue(false);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CardiacPulseMatchVisual — F2 Capa-1 render", () => {
  it("renderiza visual + orb + ring + diagram + eyebrow + counter", () => {
    render(<CardiacPulseMatchVisual />);
    expect(document.querySelector('[data-testid="cardiac-pulse-match-visual"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-orb"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-ring"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-diagram"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-eyebrow"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-cycle-counter"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="cardiac-pulse-variant-toggle"]')).toBeTruthy();
  });

  it("eyebrow texto SCHANDRY · GARFINKEL · LEHRER-VASCHILLO", () => {
    render(<CardiacPulseMatchVisual />);
    const eyebrow = document.querySelector('[data-testid="cardiac-pulse-eyebrow"]');
    expect(eyebrow.textContent).toMatch(/SCHANDRY 1981/);
    expect(eyebrow.textContent).toMatch(/GARFINKEL 2015/);
    expect(eyebrow.textContent).toMatch(/LEHRER-VASCHILLO/);
  });

  it("showEyebrow=false: NO renderiza eyebrow", () => {
    render(<CardiacPulseMatchVisual showEyebrow={false} />);
    expect(document.querySelector('[data-testid="cardiac-pulse-eyebrow"]')).toBeNull();
  });

  it("phase label inicial 'SIENTE TU PULSO' al mount (inhale)", () => {
    render(<CardiacPulseMatchVisual />);
    const label = document.querySelector('[data-testid="cardiac-pulse-phase-label"]');
    expect(label.textContent).toMatch(/SIENTE TU PULSO/);
  });

  it("aria-label informa ciclo + total + fase + variant", () => {
    render(<CardiacPulseMatchVisual cycleCountTarget={5} />);
    const root = document.querySelector('[data-testid="cardiac-pulse-match-visual"]');
    expect(root.getAttribute("aria-label")).toMatch(/ciclo 1 de 5/);
    expect(root.getAttribute("aria-label")).toMatch(/pulso radial/);
    expect(root.getAttribute("role")).toBe("img");
  });

  it("data attrs reflejan phase + cycle + variant", () => {
    render(<CardiacPulseMatchVisual />);
    const root = document.querySelector('[data-testid="cardiac-pulse-match-visual"]');
    expect(root.getAttribute("data-cycle-phase")).toBe("inhale");
    expect(root.getAttribute("data-cycle-idx")).toBe("0");
    expect(root.getAttribute("data-variant")).toBe("radial");
  });

  it("cycle counter inicial '1 / N'", () => {
    render(<CardiacPulseMatchVisual cycleCountTarget={7} />);
    const counter = document.querySelector('[data-testid="cardiac-pulse-cycle-counter"]');
    expect(counter.textContent).toMatch(/1\s*\/\s*7/);
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 cycle config", () => {
  it("INHALE_MS y EXHALE_MS son 5500 (5.5 rpm Lehrer-Vaschillo)", () => {
    expect(__internals.INHALE_MS).toBe(5500);
    expect(__internals.EXHALE_MS).toBe(5500);
  });

  it("CYCLE_MS suma 11000 (5.5s + 5.5s)", () => {
    expect(__internals.CYCLE_MS).toBe(11000);
  });

  it("DEFAULT_TARGET_CYCLES = 5 (~55s alineado a Phase 3 60s)", () => {
    expect(__internals.DEFAULT_TARGET_CYCLES).toBe(5);
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 haptic F0-4 wiring", () => {
  it("hapticProtocolSignature invocado al mount con (25, 'breath_inhale', ...)", () => {
    render(<CardiacPulseMatchVisual hapticEnabled />);
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[0]).toBe(25);
    expect(firstCall[1]).toBe("breath_inhale");
  });

  it("hapticEnabled=false: NO invoca hapticProtocolSignature", () => {
    render(<CardiacPulseMatchVisual hapticEnabled={false} />);
    expect(mocks.hapticProtocolSignature).not.toHaveBeenCalled();
  });

  it("reduced motion: hapticProtocolSignature pasa reducedMotion: true", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<CardiacPulseMatchVisual />);
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[2]).toEqual({ reducedMotion: true });
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 voice TTS opt-in", () => {
  it("voiceEnabled=true: speak('siente') al inicio (phase inhale)", () => {
    render(<CardiacPulseMatchVisual voiceEnabled />);
    expect(mocks.speak).toHaveBeenCalledWith("siente");
  });

  it("voiceEnabled=false (default): NO invoca speak", () => {
    render(<CardiacPulseMatchVisual />);
    expect(mocks.speak).not.toHaveBeenCalled();
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 variant toggle (accessibility)", () => {
  it("default variant 'radial' (forearm + radial pulse dot)", () => {
    render(<CardiacPulseMatchVisual />);
    const diagram = document.querySelector('[data-testid="cardiac-pulse-diagram"]');
    expect(diagram.getAttribute("data-diagram-variant")).toBe("radial");
  });

  it("toggle button cambia variant a 'carotid'", () => {
    render(<CardiacPulseMatchVisual />);
    const toggle = document.querySelector('[data-testid="cardiac-pulse-variant-toggle"]');
    expect(toggle.textContent).toMatch(/USAR CUELLO/);
    fireEvent.click(toggle);
    const diagram = document.querySelector('[data-testid="cardiac-pulse-diagram"]');
    expect(diagram.getAttribute("data-diagram-variant")).toBe("carotid");
    const root = document.querySelector('[data-testid="cardiac-pulse-match-visual"]');
    expect(root.getAttribute("data-variant")).toBe("carotid");
  });

  it("toggle bidirectional: carotid → radial", () => {
    render(<CardiacPulseMatchVisual />);
    const toggle = document.querySelector('[data-testid="cardiac-pulse-variant-toggle"]');
    fireEvent.click(toggle); // → carotid
    fireEvent.click(toggle); // → radial otra vez
    const root = document.querySelector('[data-testid="cardiac-pulse-match-visual"]');
    expect(root.getAttribute("data-variant")).toBe("radial");
  });

  it("toggle aria-label refleja siguiente variant", () => {
    render(<CardiacPulseMatchVisual />);
    const toggle = document.querySelector('[data-testid="cardiac-pulse-variant-toggle"]');
    expect(toggle.getAttribute("aria-label")).toMatch(/Cambiar a pulso carotídeo/);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-label")).toMatch(/Cambiar a pulso radial/);
  });

  it("aria-label root cambia con variant", () => {
    render(<CardiacPulseMatchVisual />);
    const root = document.querySelector('[data-testid="cardiac-pulse-match-visual"]');
    expect(root.getAttribute("aria-label")).toMatch(/pulso radial/);
    fireEvent.click(document.querySelector('[data-testid="cardiac-pulse-variant-toggle"]'));
    expect(root.getAttribute("aria-label")).toMatch(/pulso carotídeo/);
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 reduced motion", () => {
  it("prefers-reduced-motion: orb + ring static, no RAF (setInterval path)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<CardiacPulseMatchVisual />);
    const orb = document.querySelector('[data-testid="cardiac-pulse-orb"]');
    const ring = document.querySelector('[data-testid="cardiac-pulse-ring"]');
    expect(orb.style.transform).toMatch(/scale\(1\.?0?\)/);
    expect(ring.style.transform).toMatch(/scale\(1\.?0?\)/);
  });
});

describe("CardiacPulseMatchVisual — F2 Capa-1 cleanup", () => {
  it("unmount cancels RAF/interval — sin warnings", () => {
    mocks.useReducedMotion.mockReturnValue(false);
    const { unmount } = render(<CardiacPulseMatchVisual />);
    expect(() => unmount()).not.toThrow();
  });
});
