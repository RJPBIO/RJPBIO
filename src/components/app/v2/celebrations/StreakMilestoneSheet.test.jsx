/* StreakMilestoneSheet.test — Phase 6I-2.
   Cubre 3 milestones (7/14/30) + fallback genérico + interactions completas
   + reduced-motion path. Pattern reuse de CohortCelebrationSheet.test.jsx
   y ProgramCompletionSheet.test.jsx. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import StreakMilestoneSheet from "./StreakMilestoneSheet";

function mockMatchMedia(reduce = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? reduce : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockMatchMedia(false);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("StreakMilestoneSheet — null / no-render", () => {
  it("celebration null → no renderea", () => {
    const { container } = render(<StreakMilestoneSheet celebration={null} />);
    expect(container.querySelector('[data-testid="streak-milestone-sheet"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("celebration sin milestone (undefined) → no renderea", () => {
    const { container } = render(
      <StreakMilestoneSheet celebration={{ currentStreak: 7, timestamp: 1 }} />
    );
    expect(container.querySelector('[data-testid="streak-milestone-sheet"]')).toBeNull();
  });
});

describe("StreakMilestoneSheet — milestone 7 CONSISTENCIA", () => {
  const celebration = { milestone: 7, currentStreak: 7, timestamp: Date.now() };

  it("renderea sheet con eyebrow + title + subtitle + stat label específicos", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    const sheet = document.querySelector('[data-testid="streak-milestone-sheet"]');
    expect(sheet).toBeTruthy();
    expect(sheet.getAttribute("data-milestone")).toBe("7");
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    const html = document.body.innerHTML;
    expect(html).toMatch(/7 DÍAS · CONSISTENCIA/);
    expect(html).toMatch(/Has mantenido 7 días consecutivos/);
    expect(html).toMatch(/DÍAS · STREAK COMPLETO/);
    expect(html).toMatch(/Continuar la racha/);
    expect(html).toMatch(/Continuar/);
  });

  it("count-up animation 0→7", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    const count0 = document.querySelector('[data-testid="streak-milestone-count"]');
    expect(count0.textContent).toBe("0");
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("7");
  });
});

describe("StreakMilestoneSheet — milestone 14 DISCIPLINA", () => {
  const celebration = { milestone: 14, currentStreak: 14, timestamp: Date.now() };

  it("copy específico con DISCIPLINA tier theme", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.body.innerHTML).toMatch(/14 DÍAS · DISCIPLINA/);
    expect(document.body.innerHTML).toMatch(/Has mantenido 2 semanas consecutivas/);
    expect(document.body.innerHTML).toMatch(/DOS SEMANAS/);
  });

  it("count-up llega a 14", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("14");
  });
});

describe("StreakMilestoneSheet — milestone 30 MAESTRÍA", () => {
  const celebration = { milestone: 30, currentStreak: 30, timestamp: Date.now() };

  it("copy específico con MAESTRÍA tier theme + ctaPrimary alterno", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.body.innerHTML).toMatch(/30 DÍAS · MAESTRÍA/);
    expect(document.body.innerHTML).toMatch(/Has mantenido 30 días consecutivos/);
    expect(document.body.innerHTML).toMatch(/UN MES COMPLETO/);
    // Milestone 30 tiene ctaPrimary distinto: "Ver mi trayectoria"
    expect(document.body.innerHTML).toMatch(/Ver mi trayectoria/);
  });

  it("count-up llega a 30", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("30");
  });
});

describe("StreakMilestoneSheet — fallback genérico (milestones futuros)", () => {
  it("milestone=60 (no en STREAK_MILESTONE_COPY) → fallback genérico", () => {
    const celebration = { milestone: 60, currentStreak: 60, timestamp: Date.now() };
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.body.innerHTML).toMatch(/60 DÍAS · MILESTONE/);
    expect(document.body.innerHTML).toMatch(/Has mantenido 60 días consecutivos/);
    expect(document.body.innerHTML).toMatch(/STREAK 60/);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("60");
  });

  it("milestone=90 → fallback (futuro 3-month milestone)", () => {
    const celebration = { milestone: 90, currentStreak: 90, timestamp: Date.now() };
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.body.innerHTML).toMatch(/90 DÍAS · MILESTONE/);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("90");
  });
});

describe("StreakMilestoneSheet — interactions", () => {
  const celebration = { milestone: 7, currentStreak: 7, timestamp: Date.now() };

  it("primary CTA invoca onPrimaryAction(milestone) + onDismiss", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <StreakMilestoneSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="streak-milestone-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith(7);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("secondary CTA dismiss invoca onDismiss SIN onPrimaryAction", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <StreakMilestoneSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="streak-milestone-dismiss"]'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it("backdrop click invoca onDismiss", () => {
    const onDismiss = vi.fn();
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={onDismiss} />);
    const backdrop = document.querySelector('[data-testid="streak-milestone-backdrop"]');
    fireEvent.click(backdrop, { target: backdrop });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("click DENTRO del sheet NO invoca onDismiss", () => {
    const onDismiss = vi.fn();
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={onDismiss} />);
    const sheet = document.querySelector('[data-testid="streak-milestone-sheet"]');
    fireEvent.click(sheet);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ESC invoca onDismiss (via useFocusTrap)", () => {
    const onDismiss = vi.fn();
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("Auto-dismiss tras 8s", () => {
    const onDismiss = vi.fn();
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(8001); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismiss CTA tiene data-v2-skip-ghost (Premium-Fix4 pattern)", () => {
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    const dismiss = document.querySelector('[data-testid="streak-milestone-dismiss"]');
    expect(dismiss.hasAttribute("data-v2-skip-ghost")).toBe(true);
  });
});

describe("StreakMilestoneSheet — prefers-reduced-motion", () => {
  it("reduce=true → count-up se setea instant al milestone", () => {
    mockMatchMedia(true);
    const celebration = { milestone: 14, currentStreak: 14, timestamp: Date.now() };
    render(<StreakMilestoneSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.querySelector('[data-testid="streak-milestone-count"]').textContent).toBe("14");
  });

  it("reduce=true → CTAs interactables sin stagger delay", () => {
    mockMatchMedia(true);
    const celebration = { milestone: 30, currentStreak: 30, timestamp: Date.now() };
    const onPrimaryAction = vi.fn();
    render(
      <StreakMilestoneSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={() => {}}
      />
    );
    fireEvent.click(document.querySelector('[data-testid="streak-milestone-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalled();
  });
});
