/* MoodPostSessionSheet.test — Phase 6J-1 Group A.
   Cubre mount/unmount, mood selection, submit, skip, ESC, backdrop click,
   reduced-motion path. Pattern reuse de StreakMilestoneSheet.test.jsx. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import MoodPostSessionSheet from "./MoodPostSessionSheet";

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
});

afterEach(() => {
  cleanup();
});

describe("MoodPostSessionSheet — mount/unmount", () => {
  it("isOpen=false → no renderea", () => {
    const { container } = render(<MoodPostSessionSheet isOpen={false} />);
    expect(container.querySelector('[data-testid="mood-post-sheet"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("isOpen=true → renderea sheet con role=dialog + aria-modal", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const sheet = document.querySelector('[data-testid="mood-post-sheet"]');
    expect(sheet).toBeTruthy();
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-modal")).toBe("true");
  });

  it("renderea title + subtitle + 5 mood options", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).toMatch(/¿Cómo te sientes ahora\?/);
    expect(html).toMatch(/Tu respuesta entrena tu motor neural personalizado/);
    expect(document.querySelector('[data-testid="mood-post-option-1"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-post-option-2"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-post-option-3"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-post-option-4"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="mood-post-option-5"]')).toBeTruthy();
  });

  it("mood options con role=radio + aria-label descriptivo", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const opt1 = document.querySelector('[data-testid="mood-post-option-1"]');
    expect(opt1.getAttribute("role")).toBe("radio");
    expect(opt1.getAttribute("aria-label")).toMatch(/tensión alta/i);
    const opt5 = document.querySelector('[data-testid="mood-post-option-5"]');
    expect(opt5.getAttribute("aria-label")).toMatch(/óptimo/i);
  });
});

describe("MoodPostSessionSheet — mood selection", () => {
  it("Click mood option → aria-checked=true en ese option, false en otros", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const opt3 = document.querySelector('[data-testid="mood-post-option-3"]');
    fireEvent.click(opt3);
    expect(opt3.getAttribute("aria-checked")).toBe("true");
    expect(opt3.getAttribute("data-active")).toBe("true");
    const opt1 = document.querySelector('[data-testid="mood-post-option-1"]');
    expect(opt1.getAttribute("aria-checked")).toBe("false");
  });

  it("Tap mood diferente → cambia selección", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const opt2 = document.querySelector('[data-testid="mood-post-option-2"]');
    const opt5 = document.querySelector('[data-testid="mood-post-option-5"]');
    fireEvent.click(opt2);
    expect(opt2.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(opt5);
    expect(opt5.getAttribute("aria-checked")).toBe("true");
    expect(opt2.getAttribute("aria-checked")).toBe("false");
  });
});

describe("MoodPostSessionSheet — submit", () => {
  it("Submit sin mood seleccionado → button disabled, onSubmit NO llamado", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    const submit = document.querySelector('[data-testid="mood-post-submit"]');
    expect(submit.getAttribute("disabled")).not.toBeNull();
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Phase 7 F0-3 shape change verificado: tap submit del mood step ya no
  // dispara onSubmit. En su lugar avanza al primer sub-step ('helped').
  // Para completar y disparar onSubmit, user debe terminar el flow F0-3 o
  // tap "Saltar todo" desde un sub-step.
  it("Submit con mood seleccionado → avanza a helped step (no onSubmit todavía)", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    fireEvent.click(document.querySelector('[data-testid="mood-post-option-4"]'));
    fireEvent.click(document.querySelector('[data-testid="mood-post-submit"]'));
    expect(onSubmit).not.toHaveBeenCalled();
    // Step changed → mood-post-submit ya no en el DOM, post-step-advance sí.
    expect(document.querySelector('[data-testid="mood-post-submit"]')).toBeNull();
    expect(document.querySelector('[data-testid="post-step-advance"]')).toBeTruthy();
    // Eyebrow refleja step.
    const eyebrow = document.querySelector('[data-testid="mood-post-eyebrow"]');
    expect(eyebrow.textContent).toMatch(/PASO 1 DE 5/);
  });

  it("Mood pick + submit + skip-all desde helped → onSubmit(mood, null)", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    fireEvent.click(document.querySelector('[data-testid="mood-post-option-4"]'));
    fireEvent.click(document.querySelector('[data-testid="mood-post-submit"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-skip-all"]'));
    expect(onSubmit).toHaveBeenCalledWith(4, null);
  });
});

describe("MoodPostSessionSheet — skip / dismiss", () => {
  it("Tap skip button → onSkip llamado", () => {
    const onSkip = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={onSkip} />);
    fireEvent.click(document.querySelector('[data-testid="mood-post-skip"]'));
    expect(onSkip).toHaveBeenCalled();
  });

  it("Backdrop click → onSkip llamado", () => {
    const onSkip = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={onSkip} />);
    const backdrop = document.querySelector('[data-testid="mood-post-backdrop"]');
    fireEvent.click(backdrop, { target: backdrop, currentTarget: backdrop });
    expect(onSkip).toHaveBeenCalled();
  });

  it("Click en sheet (no backdrop) NO dispara onSkip", () => {
    const onSkip = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={onSkip} />);
    const sheet = document.querySelector('[data-testid="mood-post-sheet"]');
    fireEvent.click(sheet);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("ESC key → onSkip llamado (focus trap)", () => {
    const onSkip = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={onSkip} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onSkip).toHaveBeenCalled();
  });
});

describe("MoodPostSessionSheet — reduced motion", () => {
  it("prefers-reduced-motion → mounted=true sin RAF (no transition)", () => {
    mockMatchMedia(true);
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    const sheet = document.querySelector('[data-testid="mood-post-sheet"]');
    // Reduce motion path: transition='none' aplicado
    expect(sheet.style.transition).toBe("none");
  });
});

describe("MoodPostSessionSheet — state reset on close", () => {
  it("Selecciona mood, cierra, re-abre → selección reset", () => {
    const onSubmit = vi.fn();
    const onSkip = vi.fn();
    const { rerender } = render(
      <MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={onSkip} />
    );
    fireEvent.click(document.querySelector('[data-testid="mood-post-option-3"]'));
    expect(document.querySelector('[data-testid="mood-post-option-3"]').getAttribute("aria-checked")).toBe("true");
    rerender(<MoodPostSessionSheet isOpen={false} onSubmit={onSubmit} onSkip={onSkip} />);
    rerender(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={onSkip} />);
    // Re-abrir → mood option 3 ya no está aria-checked
    expect(document.querySelector('[data-testid="mood-post-option-3"]').getAttribute("aria-checked")).toBe("false");
  });
});

/* ─── Phase 7 F0-3 — five post-session questions ─────────────── */

function _advanceToHelpedStep(mood = 3) {
  fireEvent.click(document.querySelector(`[data-testid="mood-post-option-${mood}"]`));
  fireEvent.click(document.querySelector('[data-testid="mood-post-submit"]'));
}

describe("MoodPostSessionSheet — F0-3 step navigation", () => {
  it("Initial render: mood step visible (anti-regression Phase 6J-1)", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    expect(document.querySelector('[data-testid="mood-post-icons"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="post-step-title"]')).toBeNull();
  });

  it("Tras submit del mood: F0-3 step 'helped' montado", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep(4);
    const title = document.querySelector('[data-testid="post-step-title"]');
    expect(title).toBeTruthy();
    expect(title.textContent).toMatch(/¿Te ayudó\?/);
  });

  it("Sequence completa mood→helped→willDoAgain→bodySensations→sideEffects→timeToEffect→complete", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    _advanceToHelpedStep(5);
    // helped: pick + advance
    fireEvent.click(document.querySelector('[data-testid="post-step-helped-opt-5"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // willDoAgain
    fireEvent.click(document.querySelector('[data-testid="post-step-willDoAgain-opt-4"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // bodySensations (multi)
    fireEvent.click(document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-bodySensations-opt-clear"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // sideEffects (multi, 'none' exclusive)
    fireEvent.click(document.querySelector('[data-testid="post-step-sideEffects-opt-none"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // timeToEffect (single)
    fireEvent.click(document.querySelector('[data-testid="post-step-timeToEffect-opt-immediate"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // Completion
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [mood, fb] = onSubmit.mock.calls[0];
    expect(mood).toBe(5);
    expect(fb).not.toBeNull();
    expect(fb.helpedRating).toBe(5);
    expect(fb.willDoAgain).toBe(4);
    expect(fb.bodySensations).toEqual(["relaxed", "clear"]);
    expect(fb.sideEffects).toEqual(["none"]);
    expect(fb.timeToEffect).toBe("immediate");
    expect(typeof fb.capturedAt).toBe("number");
  });

  it("Back button regresa al step anterior; preserva selecciones", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep(3);
    fireEvent.click(document.querySelector('[data-testid="post-step-helped-opt-4"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // Now in willDoAgain
    expect(document.querySelector('[data-testid="post-step-title"]').textContent).toMatch(/¿Volverías/);
    fireEvent.click(document.querySelector('[data-testid="post-step-back"]'));
    // Back to helped — selección de helped preservada
    expect(document.querySelector('[data-testid="post-step-title"]').textContent).toMatch(/¿Te ayudó/);
    const opt4 = document.querySelector('[data-testid="post-step-helped-opt-4"]');
    expect(opt4.getAttribute("aria-checked")).toBe("true");
  });

  it("Skip individual avanza al siguiente sin guardar respuesta", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    _advanceToHelpedStep(2);
    fireEvent.click(document.querySelector('[data-testid="post-step-skip"]'));
    expect(document.querySelector('[data-testid="post-step-title"]').textContent).toMatch(/¿Volverías/);
  });

  it("Skip-all desde cualquier step → onSubmit(mood, null) si nada respondido", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    _advanceToHelpedStep(3);
    fireEvent.click(document.querySelector('[data-testid="post-step-skip-all"]'));
    expect(onSubmit).toHaveBeenCalledWith(3, null);
  });

  it("Skip-all con feedback parcial → onSubmit(mood, partialFeedback)", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    _advanceToHelpedStep(2);
    fireEvent.click(document.querySelector('[data-testid="post-step-helped-opt-3"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-skip-all"]'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [mood, fb] = onSubmit.mock.calls[0];
    expect(mood).toBe(2);
    expect(fb.helpedRating).toBe(3);
    expect(fb.willDoAgain).toBeNull();
    expect(fb.bodySensations).toBeNull();
  });
});

describe("MoodPostSessionSheet — F0-3 chip selection semantics", () => {
  it("Single-select: tap diferente cambia selección (helped step)", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    fireEvent.click(document.querySelector('[data-testid="post-step-helped-opt-2"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-helped-opt-5"]'));
    expect(document.querySelector('[data-testid="post-step-helped-opt-2"]').getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector('[data-testid="post-step-helped-opt-5"]').getAttribute("aria-checked")).toBe("true");
  });

  it("Multi-select: toggle on/off + acumula en bodySensations", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]')); // skip helped
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]')); // skip willDoAgain
    fireEvent.click(document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-bodySensations-opt-energized"]'));
    expect(document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]').getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector('[data-testid="post-step-bodySensations-opt-energized"]').getAttribute("aria-checked")).toBe("true");
    fireEvent.click(document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]'));
    expect(document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]').getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector('[data-testid="post-step-bodySensations-opt-energized"]').getAttribute("aria-checked")).toBe("true");
  });

  it("'none' exclusive en sideEffects: deselecciona otras y vice versa", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    // skip a sideEffects (paso 4)
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    // pick dizziness + anxiety
    fireEvent.click(document.querySelector('[data-testid="post-step-sideEffects-opt-dizziness"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-sideEffects-opt-anxiety"]'));
    // ahora pick 'none' exclusive
    fireEvent.click(document.querySelector('[data-testid="post-step-sideEffects-opt-none"]'));
    expect(document.querySelector('[data-testid="post-step-sideEffects-opt-none"]').getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector('[data-testid="post-step-sideEffects-opt-dizziness"]').getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector('[data-testid="post-step-sideEffects-opt-anxiety"]').getAttribute("aria-checked")).toBe("false");
    // pick dizziness de nuevo → deselecciona 'none'
    fireEvent.click(document.querySelector('[data-testid="post-step-sideEffects-opt-dizziness"]'));
    expect(document.querySelector('[data-testid="post-step-sideEffects-opt-none"]').getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector('[data-testid="post-step-sideEffects-opt-dizziness"]').getAttribute("aria-checked")).toBe("true");
  });
});

describe("MoodPostSessionSheet — F0-3 backdrop semantics", () => {
  it("Backdrop click NO cierra desde sub-step F0-3 (preserva feedback partial)", () => {
    const onSkip = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={onSkip} />);
    _advanceToHelpedStep(3);
    const backdrop = document.querySelector('[data-testid="mood-post-backdrop"]');
    fireEvent.click(backdrop, { target: backdrop, currentTarget: backdrop });
    expect(onSkip).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="post-step-title"]')).toBeTruthy();
  });
});

describe("MoodPostSessionSheet — F0-3 a11y", () => {
  it("Eyebrow refleja step (PASO X DE 5)", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    expect(document.querySelector('[data-testid="mood-post-eyebrow"]').textContent).toMatch(/PASO 1 DE 5/);
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    expect(document.querySelector('[data-testid="mood-post-eyebrow"]').textContent).toMatch(/PASO 2 DE 5/);
  });

  it("Single-step chips role=radio + aria-checked toggling", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    const opt = document.querySelector('[data-testid="post-step-helped-opt-3"]');
    expect(opt.getAttribute("role")).toBe("radio");
    expect(opt.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(opt);
    expect(opt.getAttribute("aria-checked")).toBe("true");
  });

  it("Multi-step chips role=checkbox + aria-checked", () => {
    render(<MoodPostSessionSheet isOpen onSubmit={() => {}} onSkip={() => {}} />);
    _advanceToHelpedStep();
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    fireEvent.click(document.querySelector('[data-testid="post-step-advance"]'));
    const opt = document.querySelector('[data-testid="post-step-bodySensations-opt-relaxed"]');
    expect(opt.getAttribute("role")).toBe("checkbox");
    expect(opt.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(opt);
    expect(opt.getAttribute("aria-checked")).toBe("true");
  });
});
