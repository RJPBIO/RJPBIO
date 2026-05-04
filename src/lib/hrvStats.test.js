import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  average,
  stddev,
  dayKey,
  dayLabel,
  relativeTime,
  groupByDay,
  findSessionContext,
  buildBaseline,
  computeHrvStats,
  toCSV,
  zScore,
} from "./hrvStats";

const MS_PER_DAY = 86_400_000;

// PHASE 6D SP6 — fix flaky tests. Antes algunos tests usaban Date.now()
// directo, lo que causaba false positives cerca de midnight rollover
// (groupByDay agrupaba ts1+ts2 en distintos días si el test corría
// justo cuando el reloj cruzaba 23:59 → 00:00). vi.useFakeTimers + un
// timestamp fijo bien lejos de medianoche elimina la fuente de flake.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 4, 4, 12, 0, 0)); // 2026-05-04 12:00:00 local
});

afterAll(() => {
  vi.useRealTimers();
});

describe("hrvStats — basic stats", () => {
  it("average vacio → null", () => {
    expect(average([])).toBeNull();
  });
  it("average filtra non-finite", () => {
    expect(average([1, 2, NaN, 3, undefined])).toBe(2);
  });
  it("stddev n<2 → null", () => {
    expect(stddev([1])).toBeNull();
  });
  it("stddev calcula muestral", () => {
    const sd = stddev([10, 20, 30, 40, 50]);
    expect(sd).toBeCloseTo(15.811, 2);
  });
  it("zScore null si baseline.sd<=0", () => {
    expect(zScore(40, { mean: 35, sd: 0, n: 5 })).toBeNull();
    expect(zScore(40, null)).toBeNull();
  });
  it("zScore correcto", () => {
    expect(zScore(40, { mean: 35, sd: 5, n: 5 })).toBe(1);
  });
});

describe("hrvStats — date helpers", () => {
  it("dayKey local format YYYY-MM-DD", () => {
    const ts = new Date(2026, 3, 27, 14, 30).getTime();
    expect(dayKey(ts)).toBe("2026-04-27");
  });
  it("dayLabel hoy", () => {
    const now = new Date(2026, 3, 27, 12, 0).getTime();
    expect(dayLabel("2026-04-27", now)).toBe("Hoy");
  });
  it("dayLabel ayer", () => {
    const now = new Date(2026, 3, 27, 12, 0).getTime();
    expect(dayLabel("2026-04-26", now)).toBe("Ayer");
  });
  it("dayLabel fecha en el mismo año incluye día de semana", () => {
    const now = new Date(2026, 3, 27, 12, 0).getTime();
    const label = dayLabel("2026-04-20", now);
    // Locale puede variar pero debe contener mes abreviado y día
    expect(label).toMatch(/abr/i);
    expect(label).toMatch(/20/);
  });
  it("relativeTime escala correcta", () => {
    const now = Date.now();
    expect(relativeTime(now - 30_000, now)).toBe("ahora");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("hace 5 min");
    expect(relativeTime(now - 2 * 3_600_000, now)).toBe("hace 2 h");
    expect(relativeTime(now - 3 * MS_PER_DAY, now)).toBe("hace 3 d");
  });
});

describe("hrvStats — groupByDay", () => {
  it("agrupa entries del mismo día", () => {
    const ts1 = new Date(2026, 3, 27, 9, 0).getTime();
    const ts2 = new Date(2026, 3, 27, 18, 0).getTime();
    const ts3 = new Date(2026, 3, 26, 10, 0).getTime();
    const groups = groupByDay([
      { ts: ts1, rmssd: 40 },
      { ts: ts2, rmssd: 45 },
      { ts: ts3, rmssd: 38 },
    ], new Date(2026, 3, 27, 23, 0).getTime());
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("Hoy");
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].label).toBe("Ayer");
    expect(groups[1].entries).toHaveLength(1);
  });
  it("entries dentro del grupo en orden descendente", () => {
    const t1 = Date.now() - 5 * 60_000;
    const t2 = Date.now() - 60 * 60_000;
    const groups = groupByDay([
      { ts: t2, rmssd: 35 },
      { ts: t1, rmssd: 40 },
    ]);
    expect(groups[0].entries[0].ts).toBe(t1);
    expect(groups[0].entries[1].ts).toBe(t2);
  });
  it("ignora entries inválidas", () => {
    const groups = groupByDay([null, undefined, { rmssd: 40 }, { ts: "x" }]);
    expect(groups).toEqual([]);
  });
});

describe("hrvStats — findSessionContext", () => {
  const sessionTs = new Date(2026, 3, 27, 9, 0, 0).getTime();
  const session = { ts: sessionTs, p: "Reset Ejecutivo", dur: 120 };

  it("HRV justo después → post", () => {
    const hrv = { ts: sessionTs + 90 * 1000 }; // mid-session
    const ctx = findSessionContext(hrv, [session]);
    expect(ctx.phase).toBe("post");
    expect(ctx.protocol).toBe("Reset Ejecutivo");
  });
  it("HRV 30s después del fin → post (dentro de buffer)", () => {
    const hrv = { ts: sessionTs + 150_000 }; // 30s después de end (120s dur)
    const ctx = findSessionContext(hrv, [session]);
    expect(ctx.phase).toBe("post");
  });
  it("HRV 4 min antes del start → pre", () => {
    const hrv = { ts: sessionTs - 4 * 60 * 1000 };
    const ctx = findSessionContext(hrv, [session]);
    expect(ctx.phase).toBe("pre");
    expect(ctx.protocol).toBe("Reset Ejecutivo");
  });
  it("HRV lejos de cualquier sesión → null", () => {
    const hrv = { ts: sessionTs + 30 * 60 * 1000 }; // 30 min después
    const ctx = findSessionContext(hrv, [session]);
    expect(ctx.phase).toBeNull();
    expect(ctx.protocol).toBeNull();
  });
  it("Múltiples sesiones, gana la más cercana", () => {
    const s1 = { ts: sessionTs, p: "A", dur: 120 };
    const s2 = { ts: sessionTs + 600 * 1000, p: "B", dur: 120 };
    const hrv = { ts: sessionTs + 700 * 1000 }; // más cerca de s2
    const ctx = findSessionContext(hrv, [s1, s2]);
    expect(ctx.protocol).toBe("B");
  });
  it("History inválida no rompe", () => {
    expect(findSessionContext({ ts: 1 }, null).phase).toBeNull();
    expect(findSessionContext({ ts: 1 }, []).phase).toBeNull();
    expect(findSessionContext(null, []).phase).toBeNull();
  });
});

describe("hrvStats — computeHrvStats min N=3", () => {
  const now = new Date(2026, 3, 27, 12, 0).getTime();

  it("vacio → todo null", () => {
    const r = computeHrvStats([], { now });
    expect(r.total).toBe(0);
    expect(r.last).toBeNull();
    expect(r.avg7).toBeNull();
    expect(r.trendDir).toBeNull();
    expect(r.trendReason).toBe("insufficient_recent");
  });
  it("n=1 en últimos 7d → tendencia null por insufficient_recent", () => {
    const r = computeHrvStats(
      [{ ts: now - 60_000, rmssd: 40 }],
      { now }
    );
    expect(r.total).toBe(1);
    expect(r.avg7).toBe(40);
    expect(r.trendDir).toBeNull();
    expect(r.trendReason).toBe("insufficient_recent");
  });
  it("n=3 en últimos 7d pero n=0 en previos → insufficient_baseline", () => {
    const recent = [
      { ts: now - 60_000, rmssd: 40 },
      { ts: now - 120_000, rmssd: 42 },
      { ts: now - 180_000, rmssd: 44 },
    ];
    const r = computeHrvStats(recent, { now });
    expect(r.trendDir).toBeNull();
    expect(r.trendReason).toBe("insufficient_baseline");
  });
  it("n>=3 en ambos buckets reporta tendencia mejora cuando delta > 1.5", () => {
    const recent = [
      { ts: now - 1 * MS_PER_DAY, rmssd: 50 },
      { ts: now - 2 * MS_PER_DAY, rmssd: 52 },
      { ts: now - 3 * MS_PER_DAY, rmssd: 51 },
    ];
    const previous = [
      { ts: now - 8 * MS_PER_DAY, rmssd: 40 },
      { ts: now - 10 * MS_PER_DAY, rmssd: 42 },
      { ts: now - 12 * MS_PER_DAY, rmssd: 41 },
    ];
    const r = computeHrvStats([...recent, ...previous], { now });
    expect(r.trendDir).toBe("mejora");
    expect(r.trendDelta).toBeGreaterThan(1.5);
    expect(r.trendReason).toBeNull();
  });
  it("delta dentro de ±1.5 → estable", () => {
    const recent = [
      { ts: now - 1 * MS_PER_DAY, rmssd: 41 },
      { ts: now - 2 * MS_PER_DAY, rmssd: 42 },
      { ts: now - 3 * MS_PER_DAY, rmssd: 41 },
    ];
    const previous = [
      { ts: now - 8 * MS_PER_DAY, rmssd: 40 },
      { ts: now - 10 * MS_PER_DAY, rmssd: 42 },
      { ts: now - 12 * MS_PER_DAY, rmssd: 41 },
    ];
    const r = computeHrvStats([...recent, ...previous], { now });
    expect(r.trendDir).toBe("estable");
  });
  it("delta < -1.5 → baja", () => {
    const recent = [
      { ts: now - 1 * MS_PER_DAY, rmssd: 30 },
      { ts: now - 2 * MS_PER_DAY, rmssd: 32 },
      { ts: now - 3 * MS_PER_DAY, rmssd: 31 },
    ];
    const previous = [
      { ts: now - 8 * MS_PER_DAY, rmssd: 45 },
      { ts: now - 10 * MS_PER_DAY, rmssd: 44 },
      { ts: now - 12 * MS_PER_DAY, rmssd: 46 },
    ];
    const r = computeHrvStats([...recent, ...previous], { now });
    expect(r.trendDir).toBe("baja");
    expect(r.trendDelta).toBeLessThan(-1.5);
  });
});

describe("hrvStats — buildBaseline", () => {
  const now = Date.now();
  it("null si n<5", () => {
    const entries = [
      { ts: now - MS_PER_DAY, rmssd: 40 },
      { ts: now - 2 * MS_PER_DAY, rmssd: 41 },
    ];
    expect(buildBaseline(entries, { now })).toBeNull();
  });
  it("calcula mean + sd con n>=5", () => {
    const entries = [
      { ts: now - 1 * MS_PER_DAY, rmssd: 40 },
      { ts: now - 2 * MS_PER_DAY, rmssd: 42 },
      { ts: now - 3 * MS_PER_DAY, rmssd: 38 },
      { ts: now - 4 * MS_PER_DAY, rmssd: 44 },
      { ts: now - 5 * MS_PER_DAY, rmssd: 41 },
    ];
    const bl = buildBaseline(entries, { now });
    expect(bl).not.toBeNull();
    expect(bl.n).toBe(5);
    expect(bl.mean).toBeCloseTo(41, 1);
    expect(bl.sd).toBeGreaterThan(1);
  });
  it("ignora entries fuera del rango de days", () => {
    const entries = [
      { ts: now - 1 * MS_PER_DAY, rmssd: 40 },
      { ts: now - 35 * MS_PER_DAY, rmssd: 100 }, // fuera de 30 días
      { ts: now - 2 * MS_PER_DAY, rmssd: 42 },
      { ts: now - 3 * MS_PER_DAY, rmssd: 41 },
      { ts: now - 4 * MS_PER_DAY, rmssd: 43 },
      { ts: now - 5 * MS_PER_DAY, rmssd: 39 },
    ];
    const bl = buildBaseline(entries, { now, days: 30 });
    expect(bl.n).toBe(5);
    // mean cercano a 41, no contaminado por el outlier 100
    expect(bl.mean).toBeLessThan(50);
  });
});

describe("hrvStats — toCSV", () => {
  it("genera header + rows con valores", () => {
    const ts = new Date(2026, 3, 27, 9, 30).getTime();
    const csv = toCSV([
      { ts, rmssd: 45, rhr: 72, sdnn: 50, pnn50: 12, sqiBand: "good", source: "camera", durationSec: 60 },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("fecha");
    expect(lines[0]).toContain("rmssd_ms");
    expect(lines[1]).toContain("2026-04-27");
    expect(lines[1]).toContain("45");
    expect(lines[1]).toContain("good");
  });
  it("empty → solo header", () => {
    expect(toCSV([])).toBe(toCSV([])); // idempotente
    expect(toCSV([]).split("\n")).toHaveLength(1);
  });
  it("escapa comillas y comas", () => {
    const ts = Date.now();
    const csv = toCSV([{ ts, rmssd: 40, source: 'cam,era "test"' }]);
    expect(csv).toContain('"cam,era ""test"""');
  });
});
