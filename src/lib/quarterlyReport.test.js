import { describe, it, expect } from "vitest";
import { buildQuarterlyReport } from "./quarterlyReport";

const DAY = 86400000;

function stFixture(over = {}) {
  return {
    totalSessions: 20,
    streak: 4,
    bestStreak: 12,
    coherencia: 72,
    resiliencia: 68,
    capacidad: 70,
    history: [],
    moodLog: [],
    hrvLog: [],
    instruments: [],
    ...over,
  };
}

describe("buildQuarterlyReport", () => {
  it("estado vacío no rompe y devuelve warnings=[], counts=0", () => {
    const now = new Date("2026-04-15").getTime();
    const r = buildQuarterlyReport(stFixture(), { now });
    expect(r.sessions.count).toBe(0);
    expect(r.mood.avg).toBe(null);
    expect(r.hrv.avgRmssd).toBe(null);
    expect(r.instruments.pss4.n).toBe(0);
    expect(r.warnings).toEqual([]);
    expect(r.period.days).toBe(90);
  });

  it("solo cuenta sesiones dentro del rango de días", () => {
    const now = new Date("2026-04-15").getTime();
    const st = stFixture({
      history: [
        { ts: now - 10 * DAY, int: "calma", p: "Coherencia", d: 180, mPre: 2, mPost: 4 },
        { ts: now - 95 * DAY, int: "calma", p: "Coherencia", d: 180 }, // fuera de rango
        { ts: now - 1 * DAY, int: "enfoque", p: "Box", d: 120, mPre: 3, mPost: 4 },
      ],
    });
    const r = buildQuarterlyReport(st, { now });
    expect(r.sessions.count).toBe(2);
    expect(r.sessions.byIntent.calma).toBe(1);
    expect(r.sessions.byIntent.enfoque).toBe(1);
    expect(r.sessions.totalTimeSec).toBe(300);
    expect(r.sessions.topProtocols).toHaveLength(2);
    const coherencia = r.sessions.topProtocols.find((p) => p.name === "Coherencia");
    expect(coherencia.avgDelta).toBe(2);
  });

  it("calcula delta entre primer y último instrumento del mismo tipo", () => {
    const now = new Date("2026-04-15").getTime();
    const st = stFixture({
      instruments: [
        { instrumentId: "pss-4", ts: now - 80 * DAY, score: 11, level: "high" },
        { instrumentId: "pss-4", ts: now - 10 * DAY, score: 6, level: "moderate" },
      ],
    });
    const r = buildQuarterlyReport(st, { now });
    expect(r.instruments.pss4.n).toBe(2);
    expect(r.instruments.pss4.first.score).toBe(11);
    expect(r.instruments.pss4.latest.score).toBe(6);
    expect(r.instruments.pss4.delta).toBe(-5);
  });

  it("emite warning phq2_positive si último PHQ-2 >= 3", () => {
    const now = Date.now();
    const st = stFixture({
      instruments: [{ instrumentId: "phq-2", ts: now - DAY, score: 4, level: null }],
    });
    const r = buildQuarterlyReport(st, { now });
    const codes = r.warnings.map((w) => w.code);
    expect(codes).toContain("phq2_positive");
  });

  it("no emite warning HRV si no hay datos reales", () => {
    const now = Date.now();
    const r = buildQuarterlyReport(stFixture(), { now });
    expect(r.warnings.find((w) => w.code === "hrv_down")).toBeUndefined();
  });

  it("tendencia de ánimo es estable cuando los valores oscilan cerca de la media", () => {
    const now = Date.now();
    const st = stFixture({
      moodLog: Array.from({ length: 8 }, (_, i) => ({ ts: now - (7 - i) * DAY, mood: 3 })),
    });
    const r = buildQuarterlyReport(st, { now });
    expect(r.mood.trend).toBe("estable");
    expect(r.mood.avg).toBe(3);
  });
});
