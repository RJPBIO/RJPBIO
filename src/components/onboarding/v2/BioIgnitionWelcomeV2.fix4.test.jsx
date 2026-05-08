/* BioIgnitionWelcomeV2.fix4.test — Phase 6H Premium-Fix4 M-3 + M-4.
   Tests específicos del fix4: focus primary CTA on mount/step change +
   Skip ghost data-v2-skip-ghost attribute.

   Test file separado del baseline (BioIgnitionWelcomeV2.test.jsx) para
   no modificar tests anti-regresión existing. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import BioIgnitionWelcomeV2 from "./BioIgnitionWelcomeV2";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("BioIgnitionWelcomeV2 — Phase 6H Premium-Fix4 M-3 focus primary CTA", () => {
  it("on mount → primary CTA welcome-cta tiene focus (no welcome-skip)", async () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    // setTimeout 50ms del useEffect
    act(() => { vi.advanceTimersByTime(100); });
    const cta = document.querySelector('[data-testid="welcome-cta"]');
    expect(cta).toBeTruthy();
    expect(document.activeElement).toBe(cta);
    // Skip CTA NO debe tener focus
    const skip = document.querySelector('[data-testid="welcome-skip"]');
    expect(document.activeElement).not.toBe(skip);
  });

  it("step change → re-focus primary CTA", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    act(() => { vi.advanceTimersByTime(100); });
    const cta1 = document.querySelector('[data-testid="welcome-cta"]');
    expect(document.activeElement).toBe(cta1);
    // Click → step++ → useEffect re-runs → focus
    act(() => { fireEvent.click(cta1); });
    act(() => { vi.advanceTimersByTime(100); });
    const cta2 = document.querySelector('[data-testid="welcome-cta"]');
    expect(document.activeElement).toBe(cta2);
  });
});

describe("BioIgnitionWelcomeV2 — Phase 6H Premium-Fix4 M-4 Skip ghost attr", () => {
  it("welcome-skip tiene data-v2-skip-ghost para CSS override", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    const skip = document.querySelector('[data-testid="welcome-skip"]');
    expect(skip).toBeTruthy();
    expect(skip.hasAttribute("data-v2-skip-ghost")).toBe(true);
  });

  it("welcome-skip preserva styling ghost (transparent + appearance:none + 44px touch)", () => {
    // jsdom no expone `style.border` shorthand cuando React inline-set
    // `border: 'none'`. Validamos `appearance` (también shorthand pero ok)
    // y otros atributos que sí preservan.
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    const skip = document.querySelector('[data-testid="welcome-skip"]');
    expect(skip.style.background).toBe("transparent");
    expect(skip.style.appearance).toBe("none");
    // Touch target ≥44px Polish-2
    expect(skip.style.minHeight).toBe("44px");
  });
});
