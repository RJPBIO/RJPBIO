/* TransitionContainer.test — SP-B-1 Capa 4. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  hapticProtocolSignature: vi.fn(),
  createParticleSystem: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    setPhase: vi.fn(),
    getParticleCount: () => 12,
  })),
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: vi.fn(),
}));

vi.mock("@/lib/audio", () => ({
  hapticProtocolSignature: mocks.hapticProtocolSignature,
  speak: vi.fn(),
}));

vi.mock("@/lib/animations/particleSystem", () => ({
  createParticleSystem: mocks.createParticleSystem,
}));

import TransitionContainer, { __internals } from "./TransitionContainer";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.hapticProtocolSignature.mockClear();
  mocks.createParticleSystem.mockClear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TransitionContainer — SP-B-1 Capa 4 idle state", () => {
  it("Renderiza children + container con role attrs", () => {
    render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div data-testid="child">CHILD</div>
      </TransitionContainer>
    );
    expect(document.querySelector('[data-testid="transition-container"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="child"]')).toBeTruthy();
  });

  it("Idle state cuando from === to", () => {
    render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>CHILD</div>
      </TransitionContainer>
    );
    const c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("idle");
  });

  it("Cero canvas overlay en idle state", () => {
    render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>CHILD</div>
      </TransitionContainer>
    );
    expect(document.querySelector('[data-testid="transition-canvas"]')).toBeNull();
  });
});

describe("TransitionContainer — SP-B-1 Capa 4 state machine", () => {
  it("State machine: outgoing → midpoint → incoming → idle (timing 600ms total)", () => {
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>CHILD</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div>CHILD</div>
      </TransitionContainer>
    );
    let c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("outgoing");
    act(() => { vi.advanceTimersByTime(__internals.MIDPOINT_MS + 5); });
    c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("midpoint");
    act(() => { vi.advanceTimersByTime(__internals.INCOMING_MS - __internals.MIDPOINT_MS + 5); });
    c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("incoming");
    act(() => { vi.advanceTimersByTime(__internals.TRANSITION_DURATION_MS); });
    c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("idle");
  });

  it("Duration total: 600ms (TRANSITION_DURATION_MS const)", () => {
    expect(__internals.TRANSITION_DURATION_MS).toBe(600);
    expect(__internals.MIDPOINT_MS).toBe(300);
    expect(__internals.INCOMING_MS).toBe(450);
  });

  it("Haptic phase_shift fired at midpoint", () => {
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div>X</div>
      </TransitionContainer>
    );
    mocks.hapticProtocolSignature.mockClear();
    act(() => { vi.advanceTimersByTime(305); });
    expect(mocks.hapticProtocolSignature).toHaveBeenCalledWith(1, "phase_shift", { reducedMotion: false });
  });

  it("onAudioCrossfadeRequest called al inicio de transition", () => {
    const onAudioCrossfadeRequest = vi.fn();
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0} onAudioCrossfadeRequest={onAudioCrossfadeRequest}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1} onAudioCrossfadeRequest={onAudioCrossfadeRequest}>
        <div>X</div>
      </TransitionContainer>
    );
    expect(onAudioCrossfadeRequest).toHaveBeenCalledWith(0, 1);
  });

  it("onTransitionComplete called al final de 600ms", () => {
    const onTransitionComplete = vi.fn();
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0} onTransitionComplete={onTransitionComplete}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1} onTransitionComplete={onTransitionComplete}>
        <div>X</div>
      </TransitionContainer>
    );
    act(() => { vi.advanceTimersByTime(605); });
    expect(onTransitionComplete).toHaveBeenCalledTimes(1);
  });
});

describe("TransitionContainer — SP-B-1 Capa 4 reduced motion", () => {
  it("Reduced motion: instant complete (no states)", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const onTransitionComplete = vi.fn();
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0} onTransitionComplete={onTransitionComplete}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1} onTransitionComplete={onTransitionComplete}>
        <div>X</div>
      </TransitionContainer>
    );
    expect(onTransitionComplete).toHaveBeenCalledTimes(1);
    const c = document.querySelector('[data-testid="transition-container"]');
    expect(c.getAttribute("data-state")).toBe("idle");
  });

  it("Reduced motion: haptic phase_shift fired with reducedMotion:true", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>X</div>
      </TransitionContainer>
    );
    mocks.hapticProtocolSignature.mockClear();
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div>X</div>
      </TransitionContainer>
    );
    expect(mocks.hapticProtocolSignature).toHaveBeenCalledWith(1, "phase_shift", { reducedMotion: true });
  });

  it("Reduced motion: NO canvas overlay rendered", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div>X</div>
      </TransitionContainer>
    );
    expect(document.querySelector('[data-testid="transition-canvas"]')).toBeNull();
  });
});

describe("TransitionContainer — SP-B-1 Capa 4 anti-regression", () => {
  it("Children rendered always (idle/transitioning) — no break flow", () => {
    const { rerender } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div data-testid="content">CONTENT</div>
      </TransitionContainer>
    );
    expect(document.querySelector('[data-testid="content"]')).toBeTruthy();
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div data-testid="content">CONTENT</div>
      </TransitionContainer>
    );
    expect(document.querySelector('[data-testid="content"]')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="content"]')).toBeTruthy();
  });

  it("Cleanup on unmount: timers cleared sin warnings", () => {
    const { rerender, unmount } = render(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={0}>
        <div>X</div>
      </TransitionContainer>
    );
    rerender(
      <TransitionContainer protocolId={1} fromPhaseIdx={0} toPhaseIdx={1}>
        <div>X</div>
      </TransitionContainer>
    );
    expect(() => unmount()).not.toThrow();
  });
});
