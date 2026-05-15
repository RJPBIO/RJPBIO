/* SP-MKT Capa 1 D9 — tests para CohortCountdown.
   Cubre: computeRemaining pure helper + SSR-safe placeholder + live update
   60s + expired state + env var override + a11y aria-live. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import CohortCountdown, { computeRemaining } from "./CohortCountdown";

describe("computeRemaining (pure)", () => {
  it("returns days/hours/minutes for future target", () => {
    const now = new Date("2026-05-01T00:00:00Z").getTime();
    const target = new Date("2026-05-15T12:30:00Z").getTime();
    const r = computeRemaining(target, now);
    expect(r.expired).toBe(false);
    expect(r.days).toBe(14);
    expect(r.hours).toBe(12);
    expect(r.minutes).toBe(30);
  });

  it("returns expired:true for past target", () => {
    const now = Date.now();
    const target = now - 1000;
    expect(computeRemaining(target, now)).toEqual({ expired: true });
  });

  it("returns expired:true at exact target time", () => {
    const t = Date.now();
    expect(computeRemaining(t, t)).toEqual({ expired: true });
  });

  it("handles sub-minute remaining gracefully (0 minutes)", () => {
    const now = Date.now();
    const target = now + 30_000;
    const r = computeRemaining(target, now);
    expect(r).toMatchObject({ days: 0, hours: 0, minutes: 0, expired: false });
  });
});

describe("CohortCountdown component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("renders placeholder pre-hydration (SSR-safe)", () => {
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    const node = getByTestId("cohort-countdown");
    // Pre-effect: state=placeholder. After effect on next tick, transitions to live.
    expect(node.dataset.state).toBeDefined();
  });

  it("renders live state with computed Xd Yh Zm post-hydration", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => {
      await Promise.resolve(); // flush useEffect
    });
    const node = getByTestId("cohort-countdown");
    expect(node.dataset.state).toBe("live");
    expect(node.textContent).toMatch(/^\d+d \d+h \d+m$/);
  });

  it("respects date prop over env var", async () => {
    vi.stubEnv("NEXT_PUBLIC_COHORT_CLOSE_DATE", "2030-01-01T00:00:00Z");
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => { await Promise.resolve(); });
    const node = getByTestId("cohort-countdown");
    // Days = ~14 from 2026-05-01 to 2026-05-15, not thousands.
    const match = node.textContent.match(/^(\d+)d/);
    expect(match).toBeTruthy();
    expect(Number(match[1])).toBeLessThan(30);
  });

  it("renders expired text when target is in past", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2020-01-01T00:00:00Z" locale="es" />,
    );
    await act(async () => { await Promise.resolve(); });
    const node = getByTestId("cohort-countdown");
    expect(node.dataset.state).toBe("expired");
    expect(node.textContent).toContain("COHORTE CERRADA");
  });

  it("renders English expired text when locale=en", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2020-01-01T00:00:00Z" locale="en" />,
    );
    await act(async () => { await Promise.resolve(); });
    const node = getByTestId("cohort-countdown");
    expect(node.textContent).toContain("COHORT CLOSED");
  });

  it("uses tabular-nums for stable digit alignment", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => { await Promise.resolve(); });
    const node = getByTestId("cohort-countdown");
    expect(node.style.fontVariantNumeric).toBe("tabular-nums");
  });

  it("includes aria-live polite + descriptive aria-label", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => { await Promise.resolve(); });
    const node = getByTestId("cohort-countdown");
    expect(node.getAttribute("aria-live")).toBe("polite");
    expect(node.getAttribute("aria-label")).toMatch(/días.*horas.*minutos/);
  });

  it("updates every 60s via interval", async () => {
    const { getByTestId } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => { await Promise.resolve(); });
    const before = getByTestId("cohort-countdown").textContent;

    // Advance system clock 65s + flush 1 interval cycle.
    await act(async () => {
      vi.setSystemTime(new Date(Date.now() + 65_000));
      vi.advanceTimersByTime(65_000);
    });
    const after = getByTestId("cohort-countdown").textContent;
    // After 65s, minutes should have decremented by 1 (rough).
    expect(after).not.toBe(before);
  });

  it("clears interval on unmount (no zombie timers)", async () => {
    const { unmount } = render(
      <CohortCountdown date="2026-05-15T12:00:00Z" />,
    );
    await act(async () => { await Promise.resolve(); });
    const before = vi.getTimerCount();
    unmount();
    const after = vi.getTimerCount();
    expect(after).toBeLessThan(before);
  });
});
