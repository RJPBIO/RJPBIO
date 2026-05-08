/* MonthlyDigestSheet.test — Phase Polish-Tier-3. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import MonthlyDigestSheet from "./MonthlyDigestSheet";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const sampleDigest = {
  monthOffset: 0,
  monthStart: new Date("2026-04-08").getTime(),
  monthEnd: new Date("2026-05-08").getTime(),
  sessionsCount: 24,
  topProtocols: [
    ["Reset Adaptativo", 8],
    ["Activación Cognitiva", 6],
    ["Coherencia 5/5", 4],
  ],
  avgBioQ: 72,
  avgCoherence: 78,
  totalDurationSec: 3000,
  avgMood: 3.8,
  achievementsTotal: 5,
};

describe("MonthlyDigestSheet — Polish-Tier-3", () => {
  it("isOpen=false → no render", () => {
    const { container } = render(<MonthlyDigestSheet isOpen={false} digest={sampleDigest} />);
    expect(container.firstChild).toBeNull();
  });

  it("digest=null → no render (defensive)", () => {
    const { container } = render(<MonthlyDigestSheet isOpen digest={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("isOpen + digest → renderea sheet con sessionsCount + topProtocols + stats", () => {
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onContinue={() => {}} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="monthly-digest-sheet"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="monthly-digest-sessions-count"]').textContent).toBe("24");
    expect(document.querySelector('[data-testid="digest-stat-minutes"]').textContent).toMatch(/50/);
    expect(document.querySelector('[data-testid="digest-stat-bio"]').textContent).toMatch(/72/);
    expect(document.querySelector('[data-testid="digest-stat-coherence"]').textContent).toMatch(/78/);
    expect(document.querySelector('[data-testid="digest-stat-mood"]').textContent).toMatch(/3\.8/);
    expect(document.querySelectorAll('[data-testid^="digest-top-protocol-"]')).toHaveLength(3);
    expect(document.querySelector('[data-testid="digest-top-protocol-0"]').textContent).toMatch(/Reset Adaptativo.*8/);
  });

  it("CTA continuar dispara onContinue + onDismiss", () => {
    const onContinue = vi.fn();
    const onDismiss = vi.fn();
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onContinue={onContinue} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.click(document.querySelector('[data-testid="monthly-digest-continue"]'));
    expect(onContinue).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("CTA dismiss dispara solo onDismiss (no onContinue)", () => {
    const onContinue = vi.fn();
    const onDismiss = vi.fn();
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onContinue={onContinue} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.click(document.querySelector('[data-testid="monthly-digest-dismiss"]'));
    expect(onDismiss).toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("backdrop click dispara onDismiss", () => {
    const onDismiss = vi.fn();
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.click(document.querySelector('[data-testid="monthly-digest-backdrop"]'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("click dentro del sheet NO dispara onDismiss (stopPropagation)", () => {
    const onDismiss = vi.fn();
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.click(document.querySelector('[data-testid="monthly-digest-sheet"]'));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("avgMood null → digest-stat-mood NO renderea", () => {
    render(
      <MonthlyDigestSheet
        isOpen
        digest={{ ...sampleDigest, avgMood: null }}
        onDismiss={() => {}}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="digest-stat-mood"]')).toBeNull();
  });

  it("avgBioQ null → digest-stat-bio NO renderea", () => {
    render(
      <MonthlyDigestSheet
        isOpen
        digest={{ ...sampleDigest, avgBioQ: null }}
        onDismiss={() => {}}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector('[data-testid="digest-stat-bio"]')).toBeNull();
  });

  it("topProtocols vacío → sección protocolos top NO renderea", () => {
    render(
      <MonthlyDigestSheet
        isOpen
        digest={{ ...sampleDigest, topProtocols: [] }}
        onDismiss={() => {}}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-monthly-digest-top]")).toBeNull();
  });

  it("aria-modal + role=dialog + aria-labelledby presentes (a11y)", () => {
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    const sheet = document.querySelector('[data-testid="monthly-digest-sheet"]');
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    expect(sheet.getAttribute("aria-labelledby")).toBe("v2-monthly-digest-title");
  });

  it("ESC key dismisses (focus trap onEscape)", () => {
    const onDismiss = vi.fn();
    render(<MonthlyDigestSheet isOpen digest={sampleDigest} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(700); });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalled();
  });
});
