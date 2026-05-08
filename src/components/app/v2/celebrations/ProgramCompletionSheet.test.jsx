/* ProgramCompletionSheet.test — Phase 6I-1.
   Cubre 3 estados (null/programa-conocido/programa-fallback) + interactions
   + reduced-motion path. Pattern reuse de CohortCelebrationSheet.test.jsx. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import ProgramCompletionSheet from "./ProgramCompletionSheet";

// JSDOM matchMedia mock (useReducedMotion lo requiere).
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

describe("ProgramCompletionSheet — null / no-render", () => {
  it("celebration null → no renderea", () => {
    const { container } = render(<ProgramCompletionSheet celebration={null} />);
    expect(container.querySelector('[data-testid="program-completion-sheet"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("celebration sin programId válido → no renderea", () => {
    const { container } = render(
      <ProgramCompletionSheet celebration={{ totalDays: 5 }} />
    );
    expect(container.querySelector('[data-testid="program-completion-sheet"]')).toBeNull();
  });
});

describe("ProgramCompletionSheet — burnout-recovery copy (28 días)", () => {
  const celebration = {
    programId: "burnout-recovery",
    programName: "Burnout Recovery",
    totalDays: 28,
    completedAt: Date.now(),
    timestamp: Date.now(),
  };

  it("renderea sheet con eyebrow + title + subtitle + stat label específicos", () => {
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    const sheet = document.querySelector('[data-testid="program-completion-sheet"]');
    expect(sheet).toBeTruthy();
    expect(sheet.getAttribute("data-program-id")).toBe("burnout-recovery");
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
    const html = document.body.innerHTML;
    expect(html).toMatch(/BURNOUT RECOVERY · COMPLETO/);
    expect(html).toMatch(/Has completado tu programa de recuperación/);
    expect(html).toMatch(/DÍAS · BURNOUT RECOVERY/);
    expect(html).toMatch(/Ver mi progreso/);
    expect(html).toMatch(/Continuar/);
  });

  it("count-up animation 0→28 (target=28 para burnout-recovery)", () => {
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    const count0 = document.querySelector('[data-testid="program-completion-count"]');
    expect(count0.textContent).toBe("0");
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="program-completion-count"]').textContent).toBe("28");
  });
});

describe("ProgramCompletionSheet — los 5 programs del catálogo tienen copy", () => {
  const programs = [
    { id: "neural-baseline", days: 14, copyMatch: /NEURAL BASELINE/ },
    { id: "recovery-week", days: 7, copyMatch: /RECOVERY WEEK/ },
    { id: "focus-sprint", days: 5, copyMatch: /FOCUS SPRINT/ },
    { id: "burnout-recovery", days: 28, copyMatch: /BURNOUT RECOVERY/ },
    { id: "executive-presence", days: 10, copyMatch: /EXECUTIVE PRESENCE/ },
  ];

  for (const { id, days, copyMatch } of programs) {
    it(`programId="${id}" totalDays=${days} → copy específico visible`, () => {
      const celebration = {
        programId: id,
        programName: id,
        totalDays: days,
        completedAt: Date.now(),
        timestamp: Date.now(),
      };
      render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
      expect(document.body.innerHTML).toMatch(copyMatch);
      act(() => { vi.advanceTimersByTime(900); });
      expect(document.querySelector('[data-testid="program-completion-count"]').textContent).toBe(String(days));
    });
  }
});

describe("ProgramCompletionSheet — fallback copy (programId no en catálogo)", () => {
  it("programId desconocido → fallback genérico usa programName del payload", () => {
    const celebration = {
      programId: "future-program-x",
      programName: "Future Program X",
      totalDays: 21,
      completedAt: Date.now(),
      timestamp: Date.now(),
    };
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.body.innerHTML).toMatch(/FUTURE PROGRAM X · COMPLETO/);
    expect(document.body.innerHTML).toMatch(/Has completado Future Program X/);
    act(() => { vi.advanceTimersByTime(900); });
    expect(document.querySelector('[data-testid="program-completion-count"]').textContent).toBe("21");
  });

  it("programId desconocido + totalDays=0 → fallback sin count + copy genérica", () => {
    const celebration = {
      programId: "x",
      programName: "X",
      totalDays: 0,
    };
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    // Cuando totalDays=0, count-up no anima — count se queda en 0
    expect(document.querySelector('[data-testid="program-completion-count"]').textContent).toBe("0");
  });
});

describe("ProgramCompletionSheet — interactions", () => {
  const celebration = {
    programId: "burnout-recovery",
    programName: "Burnout Recovery",
    totalDays: 28,
    completedAt: Date.now(),
    timestamp: Date.now(),
  };

  it("primary CTA invoca onPrimaryAction(programId) + onDismiss", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ProgramCompletionSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="program-completion-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).toHaveBeenCalledWith("burnout-recovery");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("secondary CTA dismiss invoca onDismiss SIN onPrimaryAction", () => {
    const onPrimaryAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ProgramCompletionSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={onDismiss}
      />
    );
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(document.querySelector('[data-testid="program-completion-dismiss"]'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPrimaryAction).not.toHaveBeenCalled();
  });

  it("backdrop click invoca onDismiss", () => {
    const onDismiss = vi.fn();
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={onDismiss} />);
    const backdrop = document.querySelector('[data-testid="program-completion-backdrop"]');
    fireEvent.click(backdrop, { target: backdrop });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("click DENTRO del sheet NO invoca onDismiss", () => {
    const onDismiss = vi.fn();
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={onDismiss} />);
    const sheet = document.querySelector('[data-testid="program-completion-sheet"]');
    fireEvent.click(sheet);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ESC invoca onDismiss (via useFocusTrap)", () => {
    const onDismiss = vi.fn();
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("Auto-dismiss tras 8s", () => {
    const onDismiss = vi.fn();
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={onDismiss} />);
    act(() => { vi.advanceTimersByTime(8001); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("dismiss CTA tiene data-v2-skip-ghost (Premium-Fix4 pattern)", () => {
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    const dismiss = document.querySelector('[data-testid="program-completion-dismiss"]');
    expect(dismiss.hasAttribute("data-v2-skip-ghost")).toBe(true);
  });
});

describe("ProgramCompletionSheet — prefers-reduced-motion", () => {
  it("reduce=true → count-up se setea instant al target", () => {
    mockMatchMedia(true);
    const celebration = {
      programId: "focus-sprint",
      programName: "Focus Sprint",
      totalDays: 5,
      completedAt: Date.now(),
      timestamp: Date.now(),
    };
    render(<ProgramCompletionSheet celebration={celebration} onDismiss={() => {}} />);
    expect(document.querySelector('[data-testid="program-completion-count"]').textContent).toBe("5");
  });

  it("reduce=true → CTAs interactables sin stagger delay", () => {
    mockMatchMedia(true);
    const celebration = {
      programId: "focus-sprint", programName: "Focus Sprint", totalDays: 5,
    };
    const onPrimaryAction = vi.fn();
    render(
      <ProgramCompletionSheet
        celebration={celebration}
        onPrimaryAction={onPrimaryAction}
        onDismiss={() => {}}
      />
    );
    fireEvent.click(document.querySelector('[data-testid="program-completion-primary"]'));
    expect(onPrimaryAction).toHaveBeenCalled();
  });
});
