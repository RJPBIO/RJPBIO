/* MonthlyDigestSheet.tier4.test — Phase Polish-Tier-4 Capa 2.
   Cubre la dimension averages section (additive). Anti-regression: tests
   en MonthlyDigestSheet.test.jsx no se modifican. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import MonthlyDigestSheet from "./MonthlyDigestSheet";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const baseDigest = {
  monthOffset: 0,
  monthStart: new Date("2026-04-08").getTime(),
  monthEnd: new Date("2026-05-08").getTime(),
  sessionsCount: 24,
  topProtocols: [["Reset", 8]],
  avgBioQ: 70,
  avgCoherence: 75,
  totalDurationSec: 3000,
  avgMood: 3.8,
  achievementsTotal: 5,
  avgDimensions: null,
};

describe("MonthlyDigestSheet — Tier-4 dimension averages section", () => {
  it("avgDimensions null → section NO renderea (legacy preservado)", () => {
    render(<MonthlyDigestSheet isOpen digest={baseDigest} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="digest-dimensions-section"]')).toBeNull();
  });

  it("avgDimensions populated → section visible con 3 stats foco/calma/energia", () => {
    const digest = { ...baseDigest, avgDimensions: { foco: 72, calma: 68, energia: 75 } };
    render(<MonthlyDigestSheet isOpen digest={digest} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="digest-dimensions-section"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="digest-dim-foco"]').textContent).toMatch(/72%/);
    expect(document.querySelector('[data-testid="digest-dim-calma"]').textContent).toMatch(/68%/);
    expect(document.querySelector('[data-testid="digest-dim-energia"]').textContent).toMatch(/75%/);
  });

  it("section eyebrow texto 'PROMEDIOS DEL MES'", () => {
    const digest = { ...baseDigest, avgDimensions: { foco: 70, calma: 60, energia: 80 } };
    render(<MonthlyDigestSheet isOpen digest={digest} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    const section = document.querySelector('[data-testid="digest-dimensions-section"]');
    expect(section.textContent).toMatch(/PROMEDIOS DEL MES/);
  });

  it("anti-regression: top protocols section sigue renderando independiente", () => {
    const digest = { ...baseDigest, avgDimensions: { foco: 70, calma: 60, energia: 80 } };
    render(<MonthlyDigestSheet isOpen digest={digest} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="digest-top-protocols"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="digest-dimensions-section"]')).toBeTruthy();
  });
});
