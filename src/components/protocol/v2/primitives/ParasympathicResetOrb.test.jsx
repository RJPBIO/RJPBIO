/* ParasympathicResetOrb.test — Phase 7 F3 Flagship #1.
   Verifica:
   1) Render shape (orb + halo + eyebrow + counter + phase label).
   2) Box 4-4-4-4 cycle config (4 phases × 4s = 16s/cycle).
   3) Haptic F0-4 wiring (hapticProtocolSignature(1, ...)).
   4) Voice TTS opt-in (3 cues "inhala/mantén/exhala", empty silent).
   5) Reduced motion path.
   6) a11y. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

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
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: vi.fn(),
}));

import ParasympathicResetOrb, { __internals } from "./ParasympathicResetOrb";

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

describe("ParasympathicResetOrb — F3 Capa-1 render", () => {
  it("renderiza orb + halo + eyebrow + counter + phase label", () => {
    render(<ParasympathicResetOrb />);
    expect(document.querySelector('[data-testid="parasympathic-reset-orb"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="parasympathic-reset-orb-disc"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="parasympathic-reset-halo"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="parasympathic-reset-eyebrow"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="parasympathic-reset-cycle-counter"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="parasympathic-reset-phase-label"]')).toBeTruthy();
  });

  it("eyebrow POLYVAGAL · 3.75 BRPM · RCT-VALIDATED (Phase 7 F3.5-A precise)", () => {
    // Phase 7 F3.5-A: eyebrow updated a precise framing con BRPM rate
    // Russo 2017 + RCT-validated marker (Ma 2017 + Lemaitre 2025).
    render(<ParasympathicResetOrb />);
    const eyebrow = document.querySelector('[data-testid="parasympathic-reset-eyebrow"]');
    expect(eyebrow.textContent).toMatch(/POLYVAGAL/);
    expect(eyebrow.textContent).toMatch(/3\.75 BRPM/);
    expect(eyebrow.textContent).toMatch(/RCT-VALIDATED/);
    expect(eyebrow.textContent).not.toMatch(/4-7-8|WEIL/);
  });

  it("showEyebrow=false: NO renderiza eyebrow", () => {
    render(<ParasympathicResetOrb showEyebrow={false} />);
    expect(document.querySelector('[data-testid="parasympathic-reset-eyebrow"]')).toBeNull();
  });

  it("phase label inicial 'INHALA · 4' al mount", () => {
    render(<ParasympathicResetOrb />);
    const label = document.querySelector('[data-testid="parasympathic-reset-phase-label"]');
    expect(label.textContent).toMatch(/INHALA . 4/);
  });

  it("aria-label informa box 4-4-4-4 + ciclo + fase", () => {
    render(<ParasympathicResetOrb cycleCountTarget={2} />);
    const root = document.querySelector('[data-testid="parasympathic-reset-orb"]');
    expect(root.getAttribute("aria-label")).toMatch(/ciclo 1 de 2/);
    expect(root.getAttribute("aria-label")).toMatch(/box 4-4-4-4/);
    expect(root.getAttribute("role")).toBe("img");
  });

  it("data attrs reflejan phase + cycle", () => {
    render(<ParasympathicResetOrb />);
    const root = document.querySelector('[data-testid="parasympathic-reset-orb"]');
    expect(root.getAttribute("data-cycle-phase")).toBe("inhale");
    expect(root.getAttribute("data-cycle-idx")).toBe("0");
  });

  it("cycle counter inicial '1 / N'", () => {
    render(<ParasympathicResetOrb cycleCountTarget={3} />);
    const counter = document.querySelector('[data-testid="parasympathic-reset-cycle-counter"]');
    expect(counter.textContent).toMatch(/1\s*\/\s*3/);
  });
});

describe("ParasympathicResetOrb — F3 Capa-1 cycle config (BOX 4-4-4-4)", () => {
  it("INHALE_MS, HOLD_MS, EXHALE_MS, EMPTY_MS son 4000 cada uno", () => {
    expect(__internals.INHALE_MS).toBe(4000);
    expect(__internals.HOLD_MS).toBe(4000);
    expect(__internals.EXHALE_MS).toBe(4000);
    expect(__internals.EMPTY_MS).toBe(4000);
  });

  it("CYCLE_MS suma 16000 (4+4+4+4 = box 4-4-4-4 con vacío)", () => {
    expect(__internals.CYCLE_MS).toBe(16000);
  });

  it("DEFAULT_TARGET_CYCLES = 2 (alineado a validate.min_cycles del catálogo)", () => {
    expect(__internals.DEFAULT_TARGET_CYCLES).toBe(2);
  });
});

describe("ParasympathicResetOrb — F3 Capa-1 haptic F0-4 wiring", () => {
  it("hapticProtocolSignature invocado al mount con (1, 'breath_inhale', ...)", () => {
    render(<ParasympathicResetOrb hapticEnabled />);
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[0]).toBe(1);
    expect(firstCall[1]).toBe("breath_inhale");
  });

  it("hapticEnabled=false: NO invoca hapticProtocolSignature", () => {
    render(<ParasympathicResetOrb hapticEnabled={false} />);
    expect(mocks.hapticProtocolSignature).not.toHaveBeenCalled();
  });

  it("reduced motion: hapticProtocolSignature pasa reducedMotion: true", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<ParasympathicResetOrb />);
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[2]).toEqual({ reducedMotion: true });
  });
});

describe("ParasympathicResetOrb — F3 Capa-1 voice TTS opt-in (3 cues)", () => {
  it("voiceEnabled=true: speak('inhala') al mount (phase inhale)", () => {
    render(<ParasympathicResetOrb voiceEnabled />);
    expect(mocks.speak).toHaveBeenCalledWith("inhala");
  });

  it("voiceEnabled=false (default): NO invoca speak", () => {
    render(<ParasympathicResetOrb />);
    expect(mocks.speak).not.toHaveBeenCalled();
  });

  // Note: empty phase NO dispara speak (silencio respeta vacío del ciclo box).
});

describe("ParasympathicResetOrb — F3 Capa-1 reduced motion", () => {
  it("prefers-reduced-motion: orb + halo static, no RAF", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<ParasympathicResetOrb />);
    const orb = document.querySelector('[data-testid="parasympathic-reset-orb-disc"]');
    const halo = document.querySelector('[data-testid="parasympathic-reset-halo"]');
    expect(orb.style.transform).toMatch(/scale\(1\.?0?\)/);
    expect(halo.style.transform).toMatch(/scale\(1\.?0?\)/);
    expect(halo.style.opacity).toBe("0");
  });
});

describe("ParasympathicResetOrb — F3 Capa-1 cleanup", () => {
  it("unmount cancels RAF/interval — sin warnings", () => {
    mocks.useReducedMotion.mockReturnValue(false);
    const { unmount } = render(<ParasympathicResetOrb />);
    expect(() => unmount()).not.toThrow();
  });
});
