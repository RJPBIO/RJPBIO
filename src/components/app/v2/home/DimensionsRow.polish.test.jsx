/* DimensionsRow.polish.test — Phase Polish-Tier-1 Gap-1.
   Cubre microinteractions aditivas: haptic on tap, long-press tooltip,
   tap-during-tooltip dismiss, reduced-motion, vibrate fallback.
   No reescribe los 9 tests Phase 6H Fix1 — éste suite es additive. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import DimensionsRow from "./DimensionsRow";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// useStore mock para que useHaptic lea hapticOn=true.
vi.mock("@/store/useStore", () => ({
  useStore: (selector) => {
    const fakeState = { hapticOn: true };
    return selector ? selector(fakeState) : fakeState;
  },
}));

// useReducedMotion override per-test via spy. Default: false.
vi.mock("@/lib/a11y", async () => {
  const actual = await vi.importActual("@/lib/a11y");
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

import * as a11y from "@/lib/a11y";

describe("DimensionsRow — Polish-Tier-1 microinteractions", () => {
  beforeEach(() => {
    if (typeof navigator !== "undefined") {
      navigator.vibrate = vi.fn(() => true);
    }
  });

  it("expone data-testid `dimensions-chip-{id}` por chip visible", () => {
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    expect(document.querySelector('[data-testid="dimensions-chip-foco"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dimensions-chip-calma"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="dimensions-chip-energia"]')).toBeTruthy();
  });

  it("tap chip → haptic vibrate(30) + onSelect called con id", () => {
    const onSelect = vi.fn();
    render(<DimensionsRow focus={70} calm={60} energy={75} onSelect={onSelect} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.click(chip);
    expect(navigator.vibrate).toHaveBeenCalledWith(30); // PATTERNS.tap
    expect(onSelect).toHaveBeenCalledWith("foco");
  });

  it("long-press 500ms → tooltip visible con detail copy", () => {
    vi.useFakeTimers();
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.pointerDown(chip);
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeNull();
    act(() => { vi.advanceTimersByTime(500); });
    const tip = document.querySelector("[data-v2-dim-tooltip]");
    expect(tip).toBeTruthy();
    expect(tip.getAttribute("role")).toBe("tooltip");
    expect(tip.textContent).toMatch(/atención|sostener/i);
  });

  it("long-press dispara haptic más fuerte (warn pattern)", () => {
    vi.useFakeTimers();
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-calma"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(500); });
    // PATTERNS.warn = [40, 60, 40]
    expect(navigator.vibrate).toHaveBeenCalledWith([40, 60, 40]);
  });

  it("tap durante tooltip visible → dismiss-first, NO navega", () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(<DimensionsRow focus={70} calm={60} energy={75} onSelect={onSelect} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-energia"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(500); });
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeTruthy();
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);
    // El primer click post-long-press dismiss el tooltip; NO debe navegar.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("tooltip auto-dismiss tras 2 segundos", () => {
    vi.useFakeTimers();
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(500); });
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeNull();
  });

  it("pointerUp antes de 500ms → NO long-press, tap normal procede", () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(<DimensionsRow focus={70} calm={60} energy={75} onSelect={onSelect} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeNull();
    expect(onSelect).toHaveBeenCalledWith("foco");
  });

  it("reduced-motion → tooltip sin animation pero igual visible", () => {
    a11y.useReducedMotion.mockReturnValue(true);
    vi.useFakeTimers();
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(500); });
    const tip = document.querySelector("[data-v2-dim-tooltip]");
    expect(tip).toBeTruthy();
    expect(tip.style.animation).toBe("none");
    a11y.useReducedMotion.mockReturnValue(false);
  });

  it("Vibration API ausente → graceful (NO crash, sin haptic)", () => {
    const orig = navigator.vibrate;
    delete navigator.vibrate;
    const onSelect = vi.fn();
    render(<DimensionsRow focus={70} calm={60} energy={75} onSelect={onSelect} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    expect(() => fireEvent.click(chip)).not.toThrow();
    expect(onSelect).toHaveBeenCalledWith("foco");
    if (orig) navigator.vibrate = orig;
  });

  it("pointerLeave durante hold cancela long-press timer", () => {
    vi.useFakeTimers();
    render(<DimensionsRow focus={70} calm={60} energy={75} />);
    const chip = document.querySelector('[data-testid="dimensions-chip-foco"]');
    fireEvent.pointerDown(chip);
    act(() => { vi.advanceTimersByTime(300); });
    fireEvent.pointerLeave(chip);
    act(() => { vi.advanceTimersByTime(500); });
    expect(document.querySelector("[data-v2-dim-tooltip]")).toBeNull();
  });
});
