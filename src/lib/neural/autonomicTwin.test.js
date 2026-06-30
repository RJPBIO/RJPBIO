import { describe, it, expect } from "vitest";
import { buildAutonomicTwin } from "./autonomicTwin";

const DAY = 86_400_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

// Baseline: 20 lecturas cada 2 días (daysAgo 2..40), rmssd ~40 con spread.
function baseline() {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const rmssd = 40 + (((i % 5) - 2) * 4); // {32,36,40,44,48}
    out.push({ ts: NOW - i * 2 * DAY, rmssd });
  }
  return out;
}

describe("buildAutonomicTwin — calibración", () => {
  it("cold-start: pocas lecturas → no disponible con faltante", () => {
    const r = buildAutonomicTwin(baseline().slice(0, 5), { now: NOW });
    expect(r.available).toBe(false);
    expect(r.maturity).toMatchObject({ readings: 5, ready: false });
    expect(r.reason).toMatch(/5 mediciones más/);
  });

  it("span insuficiente: 10 lecturas el mismo día → no calibra", () => {
    const sameDay = Array.from({ length: 10 }, (_, i) => ({ ts: NOW - i * 3_600_000, rmssd: 40 }));
    const r = buildAutonomicTwin(sameDay, { now: NOW });
    expect(r.maturity.readings).toBe(10);
    expect(r.available).toBe(false);
  });
});

describe("buildAutonomicTwin — predicción y desviación", () => {
  it("esperado con banda coherente (low < esperado < high)", () => {
    const r = buildAutonomicTwin(baseline(), { now: NOW });
    expect(r.available).toBe(true);
    expect(r.expected.low).toBeLessThan(r.expected.rmssd);
    expect(r.expected.rmssd).toBeLessThan(r.expected.high);
    expect(r.expected.rmssd).toBeGreaterThan(30);
    expect(r.expected.rmssd).toBeLessThan(50);
  });

  it("lectura reciente muy baja → desviación 'below' (señal de recuperar)", () => {
    const log = [...baseline(), { ts: NOW, rmssd: 25 }];
    const r = buildAutonomicTwin(log, { now: NOW });
    expect(r.deviation).not.toBeNull();
    expect(r.deviation.direction).toBe("below");
    expect(r.deviation.deltaRmssd).toBeLessThan(0);
    expect(r.headline).toMatch(/por debajo de tu norma/i);
  });

  it("lectura reciente muy alta → 'above'", () => {
    const log = [...baseline(), { ts: NOW, rmssd: 62 }];
    const r = buildAutonomicTwin(log, { now: NOW });
    expect(r.deviation.direction).toBe("above");
    expect(r.deviation.deltaRmssd).toBeGreaterThan(0);
  });

  it("lectura reciente cerca del esperado → 'within'", () => {
    const r = buildAutonomicTwin([...baseline(), { ts: NOW, rmssd: 40 }], { now: NOW });
    expect(r.deviation.direction).toBe("within");
  });

  it("sin lectura reciente (>36h) → sin desviación, invita a medir", () => {
    const r = buildAutonomicTwin(baseline(), { now: NOW }); // última hace 2 días
    expect(r.available).toBe(true);
    expect(r.deviation).toBeNull();
    expect(r.headline).toMatch(/Mide tu HRV/);
  });

  it("excluye la lectura de hoy del baseline (comparación fuera de muestra)", () => {
    // Una lectura baja hoy no debe arrastrar el esperado hacia abajo.
    const withLow = buildAutonomicTwin([...baseline(), { ts: NOW, rmssd: 20 }], { now: NOW });
    const withoutToday = buildAutonomicTwin(baseline(), { now: NOW });
    expect(withLow.expected.rmssd).toBeCloseTo(withoutToday.expected.rmssd, 1);
  });

  it("usa lnRmssd si viene; si no, lo deriva de rmssd", () => {
    const log = baseline().map((e) => ({ ts: e.ts, lnRmssd: Math.log(e.rmssd) }));
    const r = buildAutonomicTwin([...log, { ts: NOW, rmssd: 25 }], { now: NOW });
    expect(r.available).toBe(true);
    expect(r.deviation.direction).toBe("below");
  });

  it("no rompe con entradas inválidas", () => {
    const r = buildAutonomicTwin([{ ts: "x" }, { rmssd: 0 }, null], { now: NOW });
    expect(r.available).toBe(false);
  });
});
