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

  it("Submit con mood seleccionado → onSubmit(mood) llamado", () => {
    const onSubmit = vi.fn();
    render(<MoodPostSessionSheet isOpen onSubmit={onSubmit} onSkip={() => {}} />);
    fireEvent.click(document.querySelector('[data-testid="mood-post-option-4"]'));
    fireEvent.click(document.querySelector('[data-testid="mood-post-submit"]'));
    expect(onSubmit).toHaveBeenCalledWith(4);
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
