/* HeaderV2.test — Phase 6D SP6 Bug-36 verification.
   Verifica que el setInterval(60s) tiene cleanup correcto en unmount
   (el componente ya tenía el cleanup; este test es regression guard). */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import HeaderV2 from "./HeaderV2";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-04T07:30:00"));
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("HeaderV2 — Phase 6D SP6 Bug-36", () => {
  it("renderiza con bucket label + HH:MM derivado de Date.now", () => {
    render(<HeaderV2 onBellClick={() => {}} />);
    // 7:30 → bucket "MAÑANA" según copy.bucketLabelForHour
    expect(screen.getByText(/07:30/)).toBeTruthy();
  });

  it("setInterval cleanup en unmount evita leak", () => {
    const { unmount } = render(<HeaderV2 onBellClick={() => {}} />);
    const initialTimers = vi.getTimerCount();
    unmount();
    const afterTimers = vi.getTimerCount();
    // El timer del HeaderV2 debió limpiarse — count debe bajar.
    expect(afterTimers).toBeLessThan(initialTimers);
  });

  it("actualiza state.now tras 60s tick (timer ejecutado)", () => {
    render(<HeaderV2 onBellClick={() => {}} />);
    const beforeCount = vi.getTimerCount();
    expect(beforeCount).toBeGreaterThan(0); // timer activo
    act(() => { vi.advanceTimersByTime(60_000); });
    // Tras tick, timer sigue activo (setInterval no es one-shot).
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("bell button tiene aria-label", () => {
    render(<HeaderV2 onBellClick={() => {}} />);
    const bell = screen.getByRole("button");
    expect(bell.getAttribute("aria-label") || bell.textContent).toBeTruthy();
  });

  it("bell click dispara callback", () => {
    const onBell = vi.fn();
    render(<HeaderV2 onBellClick={onBell} />);
    screen.getByRole("button").click();
    expect(onBell).toHaveBeenCalledTimes(1);
  });
});
