/* Reset1CompletionCard.test — Phase 7 F3 Capa-2.
   Verifica:
   1) Render shape (4 stages + 4 metric blocks: streak/hrv/coh/fallback).
   2) Streak framing per habit-formation thresholds (1/3/7/14/30).
   3) HRV + Coherence framing (heredado F1+F2).
   4) Validation paragraph conditional (streak ≥7 only).
   5) Helpers defensive.
   6) Reduced motion + CTA. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
  announce: vi.fn(),
}));

vi.mock("@/lib/a11y", () => ({
  useReducedMotion: mocks.useReducedMotion,
  useFocusTrap: vi.fn(() => ({ current: null })),
  announce: mocks.announce,
}));

import Reset1CompletionCard, {
  buildReset1HrvDisplay,
  buildReset1StreakDisplay,
  buildReset1CoherenceDisplay,
  buildReset1SparklineData,
} from "./Reset1CompletionCard";

beforeEach(() => {
  mocks.useReducedMotion.mockReturnValue(false);
  mocks.announce.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("Reset1CompletionCard — F3 Capa-2 mount/unmount", () => {
  it("isOpen=false → no renderiza", () => {
    const { container } = render(<Reset1CompletionCard isOpen={false} onContinue={() => {}} />);
    expect(container.querySelector('[data-testid="reset1-completion-card"]')).toBeNull();
  });

  it("isOpen=true → renderiza dialog con role + aria-modal", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const card = document.querySelector('[data-testid="reset1-completion-card"]');
    expect(card).toBeTruthy();
    expect(card.getAttribute("role")).toBe("dialog");
    expect(card.getAttribute("aria-modal")).toBe("true");
  });

  it("eyebrow REINICIO PARASIMPÁTICO COMPLETADO + título 'Tu sistema vagal se activó.'", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-eyebrow"]').textContent).toMatch(/REINICIO PARASIMPÁTICO COMPLETADO/);
    expect(document.body.innerHTML).toMatch(/Tu sistema vagal se activó/);
  });

  it("announce sr-live polite al abrir", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    expect(mocks.announce).toHaveBeenCalledWith(
      expect.stringMatching(/Reinicio Parasimpático completado/),
      "polite"
    );
  });
});

describe("Reset1CompletionCard — F3 metric blocks (streak lead)", () => {
  it("Todos los metrics presentes → streak + hrv + coh blocks visibles", () => {
    render(
      <Reset1CompletionCard
        isOpen
        hrvDelta={2.5}
        hrvClassification="vagal-lift"
        coherenceScore={0.55}
        streakDays={7}
        onContinue={() => {}}
      />
    );
    expect(document.querySelector('[data-testid="reset1-streak-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-hrv-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-coherence-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-fallback-block"]')).toBeNull();
  });

  it("Solo streak presente → streak block + NO fallback", () => {
    render(<Reset1CompletionCard isOpen streakDays={3} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-streak-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-fallback-block"]')).toBeNull();
  });

  it("Todos los metrics null → fallback block visible", () => {
    render(
      <Reset1CompletionCard isOpen hrvDelta={null} coherenceScore={null} streakDays={null} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="reset1-fallback-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-streak-block"]')).toBeNull();
  });

  it("streakDays=0 → no streak block (defensive)", () => {
    render(<Reset1CompletionCard isOpen streakDays={0} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-streak-block"]')).toBeNull();
  });
});

describe("Reset1CompletionCard — F3 streak framing thresholds", () => {
  it("streakDays=1 → tone 'first' + headline '1 día'", () => {
    render(<Reset1CompletionCard isOpen streakDays={1} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-streak-block"]');
    expect(block.getAttribute("data-streak-tone")).toBe("first");
    expect(document.querySelector('[data-testid="reset1-streak-headline"]').textContent).toMatch(/1 día/);
  });

  it("streakDays=3 → tone 'starting' + 'X días seguidos'", () => {
    render(<Reset1CompletionCard isOpen streakDays={3} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-streak-block"]');
    expect(block.getAttribute("data-streak-tone")).toBe("starting");
  });

  it("streakDays=7 → tone 'building' (primera semana)", () => {
    render(<Reset1CompletionCard isOpen streakDays={7} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-streak-block"]');
    expect(block.getAttribute("data-streak-tone")).toBe("building");
  });

  it("streakDays=14 → tone 'consolidating'", () => {
    render(<Reset1CompletionCard isOpen streakDays={14} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-streak-block"]');
    expect(block.getAttribute("data-streak-tone")).toBe("consolidating");
  });

  it("streakDays=30 → tone 'established' (hábito instalado)", () => {
    render(<Reset1CompletionCard isOpen streakDays={30} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-streak-block"]');
    expect(block.getAttribute("data-streak-tone")).toBe("established");
  });
});

describe("Reset1CompletionCard — F3 validation paragraph conditional", () => {
  it("streakDays ≥ 7 (building) → validation paragraph visible", () => {
    render(<Reset1CompletionCard isOpen streakDays={7} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-research-validation"]')).toBeTruthy();
  });

  it("streakDays < 7 → NO validation paragraph (no overclaim)", () => {
    render(<Reset1CompletionCard isOpen streakDays={5} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-research-validation"]')).toBeNull();
  });

  it("streakDays=0 / null → NO validation paragraph", () => {
    render(<Reset1CompletionCard isOpen streakDays={null} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-research-validation"]')).toBeNull();
  });

  it("streakDays=30 (established) → validation menciona 'instalado' o 'hábito' + VVC (F3.5-A)", () => {
    render(<Reset1CompletionCard isOpen streakDays={30} onContinue={() => {}} />);
    const v = document.querySelector('[data-testid="reset1-research-validation"]');
    expect(v.textContent).toMatch(/instalado|hábito/);
    expect(v.textContent).toMatch(/VVC|Porges 2022/);
  });

  it("streakDays=14 (consolidating) → validation menciona 'consolida' + VVC (F3.5-A)", () => {
    render(<Reset1CompletionCard isOpen streakDays={14} onContinue={() => {}} />);
    const v = document.querySelector('[data-testid="reset1-research-validation"]');
    expect(v.textContent).toMatch(/consolida/);
    expect(v.textContent).toMatch(/VVC/);
  });
});

describe("Reset1CompletionCard — F3.5-A stage 3 framing científico", () => {
  it("Stage 3 eyebrow includes RCT-VALIDATED marker", () => {
    render(<Reset1CompletionCard isOpen streakDays={3} onContinue={() => {}} />);
    const stage3 = document.querySelector('[data-testid="reset1-stage-3"]');
    expect(stage3.textContent).toMatch(/POLYVAGAL/);
    expect(stage3.textContent).toMatch(/BOX 4-4-4-4/);
    expect(stage3.textContent).toMatch(/RCT-VALIDATED/);
  });

  it("Stage 3 body cita Russo 2017 Breathe ERS", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const body = document.querySelector('[data-testid="reset1-research-body"]');
    expect(body.textContent).toMatch(/Russo/);
    expect(body.textContent).toMatch(/2017/);
    expect(body.textContent).toMatch(/Breathe ERS/);
  });

  it("Stage 3 body cita Ma 2017 Frontiers in Psychology RCT N=40", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const body = document.querySelector('[data-testid="reset1-research-body"]');
    expect(body.textContent).toMatch(/Ma/);
    expect(body.textContent).toMatch(/Frontiers in Psychology/);
    expect(body.textContent).toMatch(/N=40/);
  });

  it("Stage 3 body menciona 3.75 brpm (precise rate de box 4-4-4-4)", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const body = document.querySelector('[data-testid="reset1-research-body"]');
    expect(body.textContent).toMatch(/3\.75 brpm/);
  });

  it("Stage 3 body cita Lemaitre 2025 Adv Resp Med", () => {
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const body = document.querySelector('[data-testid="reset1-research-body"]');
    expect(body.textContent).toMatch(/Lemaitre/);
    expect(body.textContent).toMatch(/2025/);
  });
});

describe("buildReset1StreakDisplay helper — F3", () => {
  it("1 → first", () => { expect(buildReset1StreakDisplay(1).tone).toBe("first"); });
  it("3 → starting", () => { expect(buildReset1StreakDisplay(3).tone).toBe("starting"); });
  it("7 → building", () => { expect(buildReset1StreakDisplay(7).tone).toBe("building"); });
  it("14 → consolidating", () => { expect(buildReset1StreakDisplay(14).tone).toBe("consolidating"); });
  it("30 → established", () => { expect(buildReset1StreakDisplay(30).tone).toBe("established"); });
  it("0 / null / NaN → null defensive", () => {
    expect(buildReset1StreakDisplay(0)).toBeNull();
    expect(buildReset1StreakDisplay(null)).toBeNull();
    expect(buildReset1StreakDisplay(NaN)).toBeNull();
    expect(buildReset1StreakDisplay(-5)).toBeNull();
  });

  it("singular 'día' vs plural 'días'", () => {
    expect(buildReset1StreakDisplay(1).headline).toMatch(/1 día$/);
    expect(buildReset1StreakDisplay(2).headline).toMatch(/días/);
  });
});

describe("buildReset1HrvDisplay helper — F3", () => {
  it("uplift / neutral / null defensive", () => {
    expect(buildReset1HrvDisplay(2.5, "vagal-lift").tone).toBe("uplift");
    expect(buildReset1HrvDisplay(-1.0, "vagal-suppression").tone).toBe("neutral");
    expect(buildReset1HrvDisplay(null)).toBeNull();
    expect(buildReset1HrvDisplay(NaN)).toBeNull();
  });
});

describe("buildReset1CoherenceDisplay helper — F3 (Lehrer thresholds)", () => {
  it("≥0.50 → achieved / ≥0.30 → partial / <0.30 → low / null", () => {
    expect(buildReset1CoherenceDisplay(0.60).tone).toBe("achieved");
    expect(buildReset1CoherenceDisplay(0.35).tone).toBe("partial");
    expect(buildReset1CoherenceDisplay(0.10).tone).toBe("low");
    expect(buildReset1CoherenceDisplay(null)).toBeNull();
  });
});

describe("buildReset1SparklineData helper — F3.5-A", () => {
  const sample = (calmaArr, name = "Reinicio Parasimpático") =>
    calmaArr.map((c, i) => ({
      ts: i * 86400000,
      p: name,
      dimensions: { foco: 50, calma: c, energia: 50 },
    }));

  it("history vacía → null", () => {
    expect(buildReset1SparklineData([], "Reinicio Parasimpático")).toBeNull();
  });

  it("protocolName no string → null", () => {
    expect(buildReset1SparklineData([], 1)).toBeNull();
    expect(buildReset1SparklineData([], null)).toBeNull();
  });

  it("history sin protocolo target → null", () => {
    const h = sample([60, 70], "Otro Protocolo");
    expect(buildReset1SparklineData(h, "Reinicio Parasimpático")).toBeNull();
  });

  it("filter por h.p === protocolName (string match exact)", () => {
    const h = [
      ...sample([60, 65], "Reinicio Parasimpático"),
      ...sample([90, 95], "Otro"),
    ];
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático");
    expect(r.last7).toEqual([60, 65]);
  });

  it("avg7 + avg30 + best computed correctly", () => {
    const h = sample([50, 60, 70, 80, 90]);
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático");
    expect(r.avg7).toBe(70); // (50+60+70+80+90)/5 = 70
    expect(r.avg30).toBe(70);
    expect(r.best).toBe(90);
    expect(r.sessionCount).toBe(5);
  });

  it("last7 toma últimos 7 sesiones, last30 últimos 30", () => {
    const calmas = Array.from({ length: 35 }, (_, i) => 50 + i);
    const h = sample(calmas);
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático");
    expect(r.last7.length).toBe(7);
    expect(r.last30.length).toBe(30);
    expect(r.last7[6]).toBe(50 + 34); // último valor
    expect(r.sessionCount).toBe(35);
  });

  it("currentVsAvg 'above' cuando currentCalma > avg7 + 3", () => {
    const h = sample([60, 60, 60, 60, 60, 60, 60]);
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático", 70);
    expect(r.currentVsAvg).toBe("above");
  });

  it("currentVsAvg 'below' cuando currentCalma < avg7 - 3", () => {
    const h = sample([60, 60, 60, 60, 60, 60, 60]);
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático", 50);
    expect(r.currentVsAvg).toBe("below");
  });

  it("currentVsAvg 'at' cuando close to avg (default)", () => {
    const h = sample([60, 60, 60, 60, 60, 60, 60]);
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático", 61);
    expect(r.currentVsAvg).toBe("at");
  });

  it("Defensive: entries sin dimensions o calma NaN filtered out", () => {
    const h = [
      { p: "Reinicio Parasimpático", dimensions: null },
      { p: "Reinicio Parasimpático", dimensions: { calma: NaN, foco: 50, energia: 50 } },
      { p: "Reinicio Parasimpático", dimensions: { calma: 70, foco: 50, energia: 50 } },
    ];
    const r = buildReset1SparklineData(h, "Reinicio Parasimpático");
    expect(r.last7).toEqual([70]);
    expect(r.sessionCount).toBe(1);
  });
});

describe("Reset1CompletionCard sparkline render — F3.5-A", () => {
  const sparkData = (sessionCount = 5, currentVsAvg = "above") => ({
    last7: [60, 65, 62, 68, 70, 72, 75],
    last30: [60, 65, 62, 68, 70, 72, 75],
    avg7: 67,
    avg30: 67,
    best: 75,
    sessionCount,
    currentVsAvg,
  });

  it("sparklineData null → no sparkline section", () => {
    render(<Reset1CompletionCard isOpen sparklineData={null} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-sparkline-block"]')).toBeNull();
  });

  it("sparklineData con sessionCount<2 → no sparkline (single point not viable)", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(1)} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-sparkline-block"]')).toBeNull();
  });

  it("sparklineData con sessionCount≥2 → sparkline visible + SVG + table", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(7)} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-sparkline-block"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-sparkline-svg"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="reset1-sparkline-table"]')).toBeTruthy();
  });

  it("Tabular comparison muestra avg7 + avg30 + best", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(7)} onContinue={() => {}} />);
    const table = document.querySelector('[data-testid="reset1-sparkline-table"]');
    expect(table.textContent).toMatch(/PROMEDIO 7d.*67/);
    expect(table.textContent).toMatch(/PROMEDIO 30d.*67/);
    expect(table.textContent).toMatch(/MEJOR.*75/);
  });

  it("currentVsAvg 'above' → validation paragraph 'sistema vagal en alza'", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(7, "above")} onContinue={() => {}} />);
    const v = document.querySelector('[data-testid="reset1-sparkline-validation"]');
    expect(v).toBeTruthy();
    expect(v.textContent).toMatch(/supera tu promedio.*alza/);
  });

  it("currentVsAvg 'below' o 'at' → NO validation paragraph (no overclaim)", () => {
    const { rerender } = render(
      <Reset1CompletionCard isOpen sparklineData={sparkData(7, "below")} onContinue={() => {}} />
    );
    expect(document.querySelector('[data-testid="reset1-sparkline-validation"]')).toBeNull();
    rerender(<Reset1CompletionCard isOpen sparklineData={sparkData(7, "at")} onContinue={() => {}} />);
    expect(document.querySelector('[data-testid="reset1-sparkline-validation"]')).toBeNull();
  });

  it("data-spark-vs-avg attr refleja currentVsAvg", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(7, "above")} onContinue={() => {}} />);
    const block = document.querySelector('[data-testid="reset1-sparkline-block"]');
    expect(block.getAttribute("data-spark-vs-avg")).toBe("above");
  });

  it("a11y: SVG tiene role=img + aria-label informativo", () => {
    render(<Reset1CompletionCard isOpen sparklineData={sparkData(7)} onContinue={() => {}} />);
    const svg = document.querySelector('[data-testid="reset1-sparkline-svg"]');
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toMatch(/Sparkline calma.*promedio.*mejor/);
  });
});

describe("Reset1CompletionCard — F3 reduced motion + CTA", () => {
  it("prefers-reduced-motion: instant stage 4", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    render(<Reset1CompletionCard isOpen onContinue={() => {}} />);
    const stage4 = document.querySelector('[data-testid="reset1-stage-4"]');
    expect(stage4.getAttribute("data-stage-visible")).toBe("true");
  });

  it("Continue CTA fires onContinue", () => {
    mocks.useReducedMotion.mockReturnValue(true);
    const onContinue = vi.fn();
    render(<Reset1CompletionCard isOpen onContinue={onContinue} />);
    fireEvent.click(document.querySelector('[data-testid="reset1-continue"]'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
