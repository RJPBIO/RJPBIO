/* HeroComposite.test — Phase 6H Premium-Fix1 + Polish-Tier-2 Gap-4 sparkline coverage.
   Cubre 3 modos: legacy (value+lines), partial (readiness con coherence-only),
   y empty-state (readiness sin signals + sin elegibilidad).
   Anti-regression: tests previos asumen [data-v2-hero] selector + composite
   numérico visible cuando devOverride='personalized' — preservamos ambos. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import HeroComposite from "./HeroComposite";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("HeroComposite — modo legacy (compat existing)", () => {
  it("renderea hero con value numérico, sin readiness", () => {
    render(<HeroComposite value={62} primaryLine="Reservas medianas." secondaryLine="Tu mejor ventana es a las 06:00." />);
    expect(document.querySelector("[data-v2-hero]")).toBeTruthy();
    expect(document.querySelector('[data-v2-hero][data-source="legacy"]')).toBeTruthy();
    expect(document.querySelector('[data-v2-hero][data-partial="false"]')).toBeTruthy();
    // count-up corre 650ms — flushear
    act(() => { vi.advanceTimersByTime(700); });
    const display = document.querySelector("[data-v2-hero-display]");
    expect(display.textContent).toBe("62");
  });

  it("aria-label refleja el valor", () => {
    render(<HeroComposite value={45} primaryLine="x" />);
    act(() => { vi.advanceTimersByTime(700); });
    const display = document.querySelector("[data-v2-hero-display]");
    expect(display.getAttribute("aria-label")).toMatch(/45 de 100/);
  });

  it("NO renderea LECTURA PARCIAL ni CTA en modo legacy", () => {
    render(<HeroComposite value={70} primaryLine="x" />);
    expect(document.querySelector("[data-v2-hero-partial-descriptor]")).toBeNull();
    expect(document.querySelector('[data-testid="hero-activate-hrv"]')).toBeNull();
  });
});

describe("HeroComposite — modo partial (coherence-only fallback)", () => {
  const partialReadiness = {
    score: 66,
    partial: true,
    source: "coherence-only",
    reason: "Lectura parcial · activa HRV para tu lectura completa",
    eligibleForFallback: true,
  };

  it("renderea display con score, descriptor LECTURA PARCIAL, y CTA cyan", () => {
    const onActivateHRV = vi.fn();
    render(
      <HeroComposite
        value={0}
        primaryLine="ignored when readiness.partial"
        readiness={partialReadiness}
        onActivateHRV={onActivateHRV}
      />
    );
    expect(document.querySelector('[data-v2-hero][data-source="coherence-only"]')).toBeTruthy();
    expect(document.querySelector('[data-v2-hero][data-partial="true"]')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-hero-display]").textContent).toBe("66");
    expect(document.querySelector("[data-v2-hero-partial-descriptor]").textContent).toMatch(/LECTURA PARCIAL/i);
    expect(document.querySelector('[data-testid="hero-activate-hrv"]')).toBeTruthy();
  });

  it("CTA hero-activate-hrv invoca callback", () => {
    const onActivateHRV = vi.fn();
    render(
      <HeroComposite value={0} readiness={partialReadiness} onActivateHRV={onActivateHRV} />
    );
    fireEvent.click(document.querySelector('[data-testid="hero-activate-hrv"]'));
    expect(onActivateHRV).toHaveBeenCalledTimes(1);
  });

  it("subtitle muestra reason del readiness, no primaryLine legacy", () => {
    render(
      <HeroComposite
        value={0}
        primaryLine="LEGACY_LINE_NOT_VISIBLE"
        readiness={partialReadiness}
        onActivateHRV={() => {}}
      />
    );
    const html = document.body.innerHTML;
    expect(html).not.toContain("LEGACY_LINE_NOT_VISIBLE");
    expect(html).toMatch(/Lectura parcial/i);
  });

  it("NO renderea CTA si no se pasa handler", () => {
    render(<HeroComposite value={0} readiness={partialReadiness} />);
    expect(document.querySelector('[data-testid="hero-activate-hrv"]')).toBeNull();
  });

  it("aria-label incluye '(lectura parcial)'", () => {
    render(<HeroComposite value={0} readiness={partialReadiness} onActivateHRV={() => {}} />);
    act(() => { vi.advanceTimersByTime(700); });
    const display = document.querySelector("[data-v2-hero-display]");
    expect(display.getAttribute("aria-label")).toMatch(/lectura parcial/i);
  });
});

describe("HeroComposite — modo empty-state", () => {
  const emptyReadiness = {
    score: null,
    partial: false,
    source: null,
    reason: "Datos insuficientes — completa al menos 5 sesiones",
    eligibleForFallback: false,
  };

  it("renderea card educativa con [data-v2-hero][data-empty-state=true]", () => {
    render(
      <HeroComposite
        value={0}
        primaryLine="x"
        readiness={emptyReadiness}
        onActivateHRV={() => {}}
        onCalibrate={() => {}}
      />
    );
    const hero = document.querySelector("[data-v2-hero]");
    expect(hero).toBeTruthy();
    expect(hero.getAttribute("data-empty-state")).toBe("true");
    // NO renderea display gigante "0"
    expect(document.querySelector("[data-v2-hero-display]")).toBeNull();
  });

  it("renderea 2 CTAs (hrv + calibrate) cuando ambos handlers presentes", () => {
    const onActivateHRV = vi.fn();
    const onCalibrate = vi.fn();
    render(
      <HeroComposite
        value={0}
        readiness={emptyReadiness}
        onActivateHRV={onActivateHRV}
        onCalibrate={onCalibrate}
      />
    );
    expect(document.querySelector('[data-testid="hero-empty-activate-hrv"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="hero-empty-calibrate"]')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-testid="hero-empty-activate-hrv"]'));
    expect(onActivateHRV).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('[data-testid="hero-empty-calibrate"]'));
    expect(onCalibrate).toHaveBeenCalledTimes(1);
  });

  it("usa reason del readiness object para subtitle copy", () => {
    render(
      <HeroComposite
        value={0}
        readiness={{ ...emptyReadiness, reason: "Sin datos — completa tu primera sesión" }}
        onActivateHRV={() => {}}
        onCalibrate={() => {}}
      />
    );
    expect(document.body.innerHTML).toMatch(/sin datos/i);
  });

  it("oculta CTA cuya handler no se proveyó", () => {
    render(
      <HeroComposite
        value={0}
        readiness={emptyReadiness}
        onActivateHRV={() => {}}
        // sin onCalibrate
      />
    );
    expect(document.querySelector('[data-testid="hero-empty-activate-hrv"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="hero-empty-calibrate"]')).toBeNull();
  });
});

describe("HeroComposite — anti-regression devOverride='personalized' compat", () => {
  it("preserva [data-v2-hero] selector + composite numérico visible", () => {
    // HomeV2.smoke.test.jsx asume que devOverride='personalized' renderea
    // composite 62 visible. Comportamiento legacy debe preservarse cuando
    // no hay readiness object (la rama devOverride pasa value=62 sin readiness).
    render(<HeroComposite value={62} primaryLine="Reservas medianas." secondaryLine="x" />);
    expect(document.querySelector("[data-v2-hero]")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.body.innerHTML).toMatch(/62/);
  });
});

describe("HeroComposite — Polish-Tier-2 Gap-4 sparkline aditivo", () => {
  it("sparklineData ausente → no renderea sparkline (legacy preservado)", () => {
    render(<HeroComposite value={62} primaryLine="x" />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-hero-sparkline]")).toBeNull();
    expect(document.querySelector('[data-testid="hero-sparkline"]')).toBeNull();
  });

  it("sparklineData con bio.length<2 → no renderea sparkline (defensive)", () => {
    render(<HeroComposite value={62} primaryLine="x" sparklineData={{ bio: [{ value: 50, ts: 1 }] }} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-hero-sparkline]")).toBeNull();
  });

  it("sparklineData con bio.length>=2 → renderea sparkline visible", () => {
    render(
      <HeroComposite
        value={62}
        primaryLine="x"
        sparklineData={{ bio: [
          { value: 50, ts: 1 },
          { value: 65, ts: 2 },
          { value: 70, ts: 3 },
        ] }}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-hero-sparkline]")).toBeTruthy();
    expect(document.querySelector('[data-testid="hero-sparkline"]')).toBeTruthy();
  });

  it("sparkline aria-label refleja count del data", () => {
    render(
      <HeroComposite
        value={62}
        primaryLine="x"
        sparklineData={{ bio: [
          { value: 50, ts: 1 },
          { value: 60, ts: 2 },
          { value: 70, ts: 3 },
        ] }}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    const svg = document.querySelector('[data-testid="hero-sparkline"]');
    expect(svg.getAttribute("aria-label")).toMatch(/3 días/);
  });

  it("sparkline coexiste con partial mode + descriptor + CTA", () => {
    render(
      <HeroComposite
        value={66}
        primaryLine="x"
        readiness={{ score: 66, partial: true, source: "coherence-only" }}
        onActivateHRV={() => {}}
        sparklineData={{ bio: [
          { value: 50, ts: 1 },
          { value: 65, ts: 2 },
        ] }}
      />
    );
    act(() => { vi.advanceTimersByTime(700); });
    expect(document.querySelector("[data-v2-hero-partial-descriptor]")).toBeTruthy();
    expect(document.querySelector('[data-testid="hero-activate-hrv"]')).toBeTruthy();
    expect(document.querySelector("[data-v2-hero-sparkline]")).toBeTruthy();
  });

  it("empty-state mode → sparkline omitido (Phase 6H Fix1 contract preservado)", () => {
    render(
      <HeroComposite
        readiness={{ score: null, eligibleForFallback: false }}
        onActivateHRV={() => {}}
        onCalibrate={() => {}}
        sparklineData={{ bio: [{ value: 50, ts: 1 }, { value: 60, ts: 2 }] }}
      />
    );
    expect(document.querySelector('[data-empty-state="true"]')).toBeTruthy();
    expect(document.querySelector("[data-v2-hero-sparkline]")).toBeNull();
  });
});
