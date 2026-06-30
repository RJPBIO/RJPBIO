import { describe, it, expect } from "vitest";
import { buildAutonomicJournal, JOURNAL_CONTEXTS } from "./autonomicJournal";

const H = 3_600_000;
const D = 86_400_000;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

const hr = (ts, rmssd) => ({ ts, rmssd });
const ev = (id, ts, context, label = "") => ({ id, ts, context, label });

describe("buildAutonomicJournal", () => {
  it("vacío no rompe", () => {
    const r = buildAutonomicJournal([], [], { now: NOW });
    expect(r.entries).toEqual([]);
    expect(r.byContext).toEqual([]);
    expect(r.coverage).toEqual({ total: 0, withReading: 0 });
  });

  it("asocia la lectura HRV más cercana dentro de la ventana", () => {
    const events = [ev("a", NOW - D, "logro")];
    const hrv = [hr(NOW - D + 1 * H, 58), hr(NOW - D + 5 * H, 50)];
    const r = buildAutonomicJournal(events, hrv, { now: NOW });
    expect(r.entries[0].autonomic).not.toBeNull();
    expect(r.entries[0].autonomic.rmssd).toBe(58); // la más cercana (+1h)
    expect(r.entries[0].contextLabel).toBe("Logro");
  });

  it("sin lectura cercana → huella null (no inventa)", () => {
    const r = buildAutonomicJournal([ev("e", NOW - 5 * D, "pareja")], [hr(NOW, 40)], { now: NOW });
    expect(r.entries[0].autonomic).toBeNull();
    expect(r.coverage.withReading).toBe(0);
  });

  it("agrega por contexto y revela mejores/peores estados", () => {
    const events = [
      ev("a", NOW - 1 * D, "logro"),
      ev("b", NOW - 3 * D, "logro"),
      ev("c", NOW - 2 * D, "trabajo"),
      ev("d", NOW - 4 * D, "trabajo"),
    ];
    const hrv = [
      hr(NOW - 1 * D, 58),
      hr(NOW - 3 * D, 62),
      hr(NOW - 2 * D, 26),
      hr(NOW - 4 * D, 24),
    ];
    const r = buildAutonomicJournal(events, hrv, { now: NOW });
    expect(r.best.context).toBe("logro");
    expect(r.worst.context).toBe("trabajo");
    expect(r.best.meanRmssd).toBeGreaterThan(r.worst.meanRmssd);
    expect(r.insight).toMatch(/Logro/);
    expect(r.insight).toMatch(/Trabajo/);
    // z dirección: logro por encima del baseline, trabajo por debajo
    expect(r.best.meanZ).toBeGreaterThan(0);
    expect(r.worst.meanZ).toBeLessThan(0);
  });

  it("ignora contextos con menos de 2 lecturas", () => {
    const events = [ev("a", NOW - 1 * D, "logro"), ev("c", NOW - 2 * D, "trabajo"), ev("d", NOW - 4 * D, "trabajo")];
    const hrv = [hr(NOW - 1 * D, 58), hr(NOW - 2 * D, 26), hr(NOW - 4 * D, 24)];
    const r = buildAutonomicJournal(events, hrv, { now: NOW });
    expect(r.byContext.map((c) => c.context)).not.toContain("logro"); // solo 1 lectura
    expect(r.byContext.map((c) => c.context)).toContain("trabajo");
  });

  it("ordena eventos recientes primero y excluye futuros", () => {
    const events = [ev("old", NOW - 5 * D, "social"), ev("new", NOW - 1 * D, "social"), ev("future", NOW + D, "social")];
    const r = buildAutonomicJournal(events, [], { now: NOW });
    expect(r.entries.map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("JOURNAL_CONTEXTS expone el set curado", () => {
    expect(JOURNAL_CONTEXTS.length).toBeGreaterThanOrEqual(6);
    expect(JOURNAL_CONTEXTS.map((c) => c.id)).toContain("perdida");
  });
});
