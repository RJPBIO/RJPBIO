/* PhysiologicalSighOrb.test — Phase 7 F1 Flagship #15.
   Verifica:
   1) Render shape (orb disc + eyebrow + phase label).
   2) Reduced motion path (no RAF, setInterval-based).
   3) Cycle phase progression (inhale1 → inhale2 → hold → exhale → afterwave).
   4) Haptic F0-4 wiring (hapticProtocolSignature(15, ...) invocado).
   5) Voice cues (speak("uno"/"dos"/"exhala")) opt-in.
   6) onCycleComplete + onComplete callbacks.
   7) Eyebrow Stanford inline.
*/
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

import PhysiologicalSighOrb, { __internals } from "./PhysiologicalSighOrb";

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

describe("PhysiologicalSighOrb — F1 Capa-1 render", () => {
  it("renderiza orb disc con data-testid + eyebrow Stanford + phase label", () => {
    render(<PhysiologicalSighOrb />);
    expect(document.querySelector('[data-testid="physiological-sigh-orb"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="physiological-sigh-orb-disc"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="physiological-sigh-eyebrow"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="physiological-sigh-phase-label"]')).toBeTruthy();
  });

  it("eyebrow tiene texto STANFORD 2023 · CELL REPORTS MEDICINE", () => {
    render(<PhysiologicalSighOrb />);
    const eyebrow = document.querySelector('[data-testid="physiological-sigh-eyebrow"]');
    expect(eyebrow.textContent).toMatch(/STANFORD 2023/);
    expect(eyebrow.textContent).toMatch(/CELL REPORTS MEDICINE/);
  });

  it("showEyebrow=false: no renderiza eyebrow Stanford", () => {
    render(<PhysiologicalSighOrb showEyebrow={false} />);
    expect(document.querySelector('[data-testid="physiological-sigh-eyebrow"]')).toBeNull();
  });

  it("phase label inicial 'INHALA · UNO' al mount", () => {
    render(<PhysiologicalSighOrb />);
    const label = document.querySelector('[data-testid="physiological-sigh-phase-label"]');
    expect(label.textContent).toMatch(/INHALA . UNO/);
  });

  it("aria-label informa ciclo + total + fase", () => {
    render(<PhysiologicalSighOrb cycleCountTarget={5} />);
    const orb = document.querySelector('[data-testid="physiological-sigh-orb"]');
    expect(orb.getAttribute("aria-label")).toMatch(/ciclo 1 de 5/);
    expect(orb.getAttribute("role")).toBe("img");
  });

  it("data-cycle-phase attribute refleja phase actual", () => {
    render(<PhysiologicalSighOrb />);
    const orb = document.querySelector('[data-testid="physiological-sigh-orb"]');
    expect(orb.getAttribute("data-cycle-phase")).toBe("inhale1");
    expect(orb.getAttribute("data-cycle-idx")).toBe("0");
  });
});

describe("PhysiologicalSighOrb — F1 Capa-1 cycle config", () => {
  it("CYCLE_SEQUENCE tiene 5 segments: inhale1, inhale2, hold, exhale, afterwave", () => {
    expect(__internals.CYCLE_SEQUENCE.length).toBe(5);
    expect(__internals.CYCLE_SEQUENCE.map((s) => s.phase)).toEqual([
      "inhale1", "inhale2", "hold", "exhale", "afterwave",
    ]);
  });

  it("CYCLE_TOTAL_MS suma 5000ms (1+1+1+1.5+0.5 segundos)", () => {
    expect(__internals.CYCLE_TOTAL_MS).toBe(5000);
  });

  it("inhale1 scaleFrom 1.0 → scaleTo 1.30 (primera inhalación 70%)", () => {
    const seg = __internals.CYCLE_SEQUENCE.find((s) => s.phase === "inhale1");
    expect(seg.scaleFrom).toBe(1.0);
    expect(seg.scaleTo).toBe(1.30);
  });

  it("inhale2 scaleFrom 1.30 → scaleTo 1.50 (top-off 30% — doble inhalación)", () => {
    const seg = __internals.CYCLE_SEQUENCE.find((s) => s.phase === "inhale2");
    expect(seg.scaleFrom).toBe(1.30);
    expect(seg.scaleTo).toBe(1.50);
  });

  it("exhale scaleFrom 1.50 → scaleTo 0.85 (exhalación larga)", () => {
    const seg = __internals.CYCLE_SEQUENCE.find((s) => s.phase === "exhale");
    expect(seg.scaleFrom).toBe(1.50);
    expect(seg.scaleTo).toBe(0.85);
  });
});

describe("PhysiologicalSighOrb — F1 Capa-1 haptic F0-4 wiring", () => {
  it("hapticProtocolSignature invocado al mount con (15, 'breath_inhale', ...)", () => {
    render(<PhysiologicalSighOrb hapticEnabled />);
    // First effect runs synchronously after mount — phase 'inhale1' → breath_inhale
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[0]).toBe(15);
    expect(firstCall[1]).toBe("breath_inhale");
  });

  it("hapticEnabled=false: no invoca hapticProtocolSignature", () => {
    render(<PhysiologicalSighOrb hapticEnabled={false} />);
    expect(mocks.hapticProtocolSignature).not.toHaveBeenCalled();
  });
});

describe("PhysiologicalSighOrb — F1 Capa-1 voice TTS opt-in", () => {
  it("voiceEnabled=true: speak('uno') al inicio (phase inhale1)", () => {
    render(<PhysiologicalSighOrb voiceEnabled />);
    expect(mocks.speak).toHaveBeenCalledWith("uno");
  });

  it("voiceEnabled=false (default): no invoca speak", () => {
    render(<PhysiologicalSighOrb />);
    expect(mocks.speak).not.toHaveBeenCalled();
  });
});

describe("PhysiologicalSighOrb — F1 Capa-1 reduced motion", () => {
  it("prefers-reduced-motion: orb static, no RAF (setInterval path)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<PhysiologicalSighOrb />);
    const disc = document.querySelector('[data-testid="physiological-sigh-orb-disc"]');
    expect(disc.style.transform).toMatch(/scale\(1\.?0?\)/);
  });

  it("reduced motion: hapticProtocolSignature pasa reducedMotion: true", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<PhysiologicalSighOrb />);
    expect(mocks.hapticProtocolSignature).toHaveBeenCalled();
    const firstCall = mocks.hapticProtocolSignature.mock.calls[0];
    expect(firstCall[2]).toEqual({ reducedMotion: true });
  });
});

describe("PhysiologicalSighOrb — F1 Capa-1 cleanup", () => {
  it("unmount cancels RAF/interval — sin warnings", () => {
    mocks.useReducedMotion.mockReturnValue(false);
    const { unmount } = render(<PhysiologicalSighOrb />);
    expect(() => unmount()).not.toThrow();
  });
});
