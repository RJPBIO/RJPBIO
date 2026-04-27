import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { evaluateEngineHealth } from "./health";

const HOUR = 3600000;
const DAY = 24 * HOUR;
const NOW = new Date("2026-04-26T12:00:00Z").getTime();

function makeHist(count, opts = {}) {
  const startTs = opts.startTs ?? NOW - count * DAY;
  const protos = opts.protos || ["alpha", "beta", "gamma", "delta"];
  return Array.from({ length: count }, (_, i) => ({
    p: protos[i % protos.length],
    ts: startTs + i * DAY,
    c: 50 + (i % 10),
    bioQ: opts.bioQ ?? 60,
  }));
}

function makeMl(count, opts = {}) {
  const protos = opts.protos || ["alpha", "beta"];
  const base = opts.base ?? 3;
  return Array.from({ length: count }, (_, i) => ({
    proto: protos[i % protos.length],
    pre: base,
    mood: base + (opts.deltas?.[i] ?? 0.5),
    ts: NOW - (count - i) * HOUR,
  }));
}

describe("evaluateEngineHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("retorna cold-start con state vacío", () => {
    const r = evaluateEngineHealth({});
    expect(r.dataMaturity).toBe("cold-start");
    expect(r.totalSessions).toBe(0);
    expect(r.overall).toBe("cold-start");
    expect(r.staleness.status).toBe("no-data");
  });

  it("cold-start con < 5 sesiones", () => {
    const r = evaluateEngineHealth({ history: makeHist(3) });
    expect(r.dataMaturity).toBe("cold-start");
  });

  it("learning entre 5 y 19 sesiones", () => {
    const r = evaluateEngineHealth({ history: makeHist(10) });
    expect(r.dataMaturity).toBe("learning");
  });

  it("personalized con ≥ 20 sesiones", () => {
    const r = evaluateEngineHealth({ history: makeHist(25) });
    expect(r.dataMaturity).toBe("personalized");
  });

  describe("staleness", () => {
    it("fresh: última sesión hoy", () => {
      const r = evaluateEngineHealth({
        history: [{ p: "x", ts: NOW - HOUR, c: 50, bioQ: 60 }],
      });
      expect(r.staleness.status).toBe("fresh");
      expect(r.staleness.days).toBe(0);
    });
    it("active: 5 días sin sesión", () => {
      const r = evaluateEngineHealth({
        history: [{ p: "x", ts: NOW - 5 * DAY, c: 50, bioQ: 60 }],
      });
      expect(r.staleness.status).toBe("active");
    });
    it("cooling: 10 días sin sesión", () => {
      const r = evaluateEngineHealth({
        history: [{ p: "x", ts: NOW - 10 * DAY, c: 50, bioQ: 60 }],
      });
      expect(r.staleness.status).toBe("cooling");
    });
    it("stale: 20 días sin sesión", () => {
      const r = evaluateEngineHealth({
        history: makeHist(5, { startTs: NOW - 25 * DAY }),
      });
      expect(r.staleness.status).toBe("stale");
      expect(r.overall).toBe("stale");
    });
  });

  describe("predictionAccuracy", () => {
    it("insufficient-data con <3 pares", () => {
      const r = evaluateEngineHealth({ moodLog: makeMl(2) });
      expect(r.predictionAccuracy.status).toBe("insufficient-data");
    });

    it("good cuando deltas son consistentes", () => {
      const ml = Array.from({ length: 8 }, (_, i) => ({
        proto: "alpha",
        pre: 3, mood: 3.6, // delta consistente +0.6 (dentro de tolerance 0.75)
        ts: NOW - (8 - i) * HOUR,
      }));
      const r = evaluateEngineHealth({ moodLog: ml });
      expect(r.predictionAccuracy.status).toBe("good");
      expect(r.predictionAccuracy.value).toBeGreaterThan(0.5);
    });

    it("poor cuando deltas son erráticos", () => {
      const erraticDeltas = [3, -2, 2.5, -1.5, 2, -2.5, 3, -1.8];
      const ml = erraticDeltas.map((d, i) => ({
        proto: "alpha",
        pre: 3, mood: Math.max(1, Math.min(5, 3 + d)),
        ts: NOW - (erraticDeltas.length - i) * HOUR,
      }));
      const r = evaluateEngineHealth({ moodLog: ml });
      expect(r.predictionAccuracy.status).toBe("poor");
    });
  });

  describe("recommendationAcceptance", () => {
    it("insufficient-data con <5 sesiones", () => {
      const r = evaluateEngineHealth({ history: makeHist(3) });
      expect(r.recommendationAcceptance.status).toBe("insufficient-data");
    });

    it("good con diversidad alta + bioQ alta", () => {
      const r = evaluateEngineHealth({
        history: makeHist(10, { protos: ["a", "b", "c", "d", "e"], bioQ: 70 }),
      });
      expect(r.recommendationAcceptance.status).toBe("good");
    });

    it("poor con un solo protocolo + bioQ baja", () => {
      const r = evaluateEngineHealth({
        history: makeHist(10, { protos: ["alpha"], bioQ: 30 }),
      });
      expect(r.recommendationAcceptance.status).toBe("poor");
    });
  });

  describe("personalization", () => {
    it("minimal sin señales", () => {
      const r = evaluateEngineHealth({});
      expect(r.personalization.status).toBe("minimal");
      expect(r.personalization.activeSignals).toBe(0);
    });

    it("strong cuando hay 4-5 señales activas", () => {
      const r = evaluateEngineHealth({
        history: makeHist(15),
        moodLog: makeMl(6),
        predictionResiduals: { history: Array(8).fill({ residual: 0.1 }) },
        banditArms: { calma: { n: 3, mean: 0.5 } },
      });
      expect(r.personalization.activeSignals).toBeGreaterThanOrEqual(4);
      expect(["strong", "developing"]).toContain(r.personalization.status);
    });

    it("flag weakRisk con muchas sesiones pero pocas señales", () => {
      const r = evaluateEngineHealth({
        history: makeHist(30), // muchas sesiones
        // sin moodLog → no sensitivity, sin residuals, sin bandit
      });
      expect(r.personalization.weakRisk).toBe(true);
      expect(r.overall).toBe("underperforming");
    });
  });

  describe("synthesizeActions", () => {
    it("siempre retorna al menos 1 acción", () => {
      const r = evaluateEngineHealth({});
      expect(r.actions.length).toBeGreaterThanOrEqual(1);
    });

    it("acción info para cold-start", () => {
      const r = evaluateEngineHealth({});
      expect(r.actions[0].kind).toBe("info");
      expect(r.actions[0].title).toMatch(/Cold start/i);
    });

    it("acción warn para staleness", () => {
      const r = evaluateEngineHealth({
        history: makeHist(5, { startTs: NOW - 25 * DAY }),
      });
      expect(r.actions.some((a) => a.kind === "warn" && /obsoletos/i.test(a.title))).toBe(true);
    });

    it("acción danger para personalización débil", () => {
      const r = evaluateEngineHealth({ history: makeHist(30) });
      expect(r.actions.some((a) => a.kind === "danger")).toBe(true);
    });
  });

  it("schemaVersion presente para forward-compat", () => {
    const r = evaluateEngineHealth({});
    expect(r.schemaVersion).toBe(1);
  });

  it("nunca tira con state malformado", () => {
    expect(() => evaluateEngineHealth(null)).not.toThrow();
    expect(() => evaluateEngineHealth(undefined)).not.toThrow();
    expect(() => evaluateEngineHealth({ history: null })).not.toThrow();
    expect(() => evaluateEngineHealth({ history: "not-array" })).not.toThrow();
  });
});
