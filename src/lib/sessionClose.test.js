import { describe, it, expect } from "vitest";
import {
  computeSessionMetrics,
  sessionQualityMessage,
  shouldPlayIgnitionSignature,
} from "./sessionClose";

const baseProtocol = { n: "Test", d: 120 };

describe("computeSessionMetrics", () => {
  it("usa expectedSec del sessionData cuando está presente", () => {
    const now = 10_000;
    const m = computeSessionMetrics({
      sessionData: { expectedSec: 60, startedAt: now - 60_000, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now,
    });
    expect(m.expectedSec).toBe(60);
  });

  it("cae a round(protocol.d * durMult) si no hay expectedSec", () => {
    const m = computeSessionMetrics({
      sessionData: { startedAt: 1_000, hiddenMs: 0 },
      protocol: { d: 120 },
      durMult: 0.5,
      now: 60_000,
    });
    expect(m.expectedSec).toBe(60);
  });

  it("actualSec es (now - startedAt) / 1000", () => {
    const now = 100_000;
    const m = computeSessionMetrics({
      sessionData: { startedAt: 40_000, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now,
    });
    expect(m.actualSec).toBe(60);
  });

  it("actualSec cae a expectedSec si no hay startedAt", () => {
    const m = computeSessionMetrics({
      sessionData: { expectedSec: 90, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now: 1_000,
    });
    expect(m.actualSec).toBe(90);
  });

  it("actualSec se clampa a 0 si startedAt es futuro (reloj raro)", () => {
    const now = 5_000;
    const m = computeSessionMetrics({
      sessionData: { startedAt: 10_000, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now,
    });
    expect(m.actualSec).toBe(0);
  });

  it("hiddenSec convierte ms a segundos", () => {
    const m = computeSessionMetrics({
      sessionData: { startedAt: 1_000, hiddenMs: 5_500 },
      protocol: baseProtocol,
      durMult: 1,
      now: 60_000,
    });
    expect(m.hiddenSec).toBe(5.5);
  });

  it("activeSec = max(0, actual - hidden)", () => {
    const m = computeSessionMetrics({
      sessionData: { startedAt: 1_000, hiddenMs: 20_000 },
      protocol: baseProtocol,
      durMult: 1,
      now: 61_000,
    });
    expect(m.actualSec).toBe(60);
    expect(m.hiddenSec).toBe(20);
    expect(m.activeSec).toBe(40);
  });

  it("activeSec nunca es negativo aunque hidden > actual", () => {
    const m = computeSessionMetrics({
      sessionData: { startedAt: 1_000, hiddenMs: 100_000 },
      protocol: baseProtocol,
      durMult: 1,
      now: 30_000,
    });
    expect(m.activeSec).toBe(0);
  });

  it("completeness = activeSec / expectedSec, tope en 1", () => {
    const m = computeSessionMetrics({
      sessionData: { expectedSec: 120, startedAt: 1_000, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now: 61_000,
    });
    expect(m.completeness).toBe(0.5);
  });

  it("completeness tope en 1 cuando active > expected", () => {
    const m = computeSessionMetrics({
      sessionData: { expectedSec: 60, startedAt: 1_000, hiddenMs: 0 },
      protocol: baseProtocol,
      durMult: 1,
      now: 180_000,
    });
    expect(m.completeness).toBe(1);
  });

  it("completeness = 1 si expectedSec es 0 (defensiva contra división)", () => {
    const m = computeSessionMetrics({
      sessionData: { expectedSec: 0, startedAt: 1_000, hiddenMs: 0 },
      protocol: { d: 0 },
      durMult: 1,
      now: 1_000,
    });
    expect(m.completeness).toBe(1);
  });

  it("sessionDataFull incluye los campos computados", () => {
    const m = computeSessionMetrics({
      sessionData: { pauses: 2, startedAt: 1_000, hiddenMs: 3_000 },
      protocol: { d: 100 },
      durMult: 1,
      now: 61_000,
    });
    expect(m.sessionDataFull.pauses).toBe(2);
    expect(m.sessionDataFull.actualSec).toBe(60);
    expect(m.sessionDataFull.hiddenSec).toBe(3);
    expect(m.sessionDataFull.completeness).toBeCloseTo(0.57, 2);
  });
});

describe("sessionQualityMessage", () => {
  it("mensaje específico por calidad", () => {
    expect(sessionQualityMessage("alta")).toBe("Sesión excelente");
    expect(sessionQualityMessage("ligera")).toBe("Sesión ligera registrada");
    expect(sessionQualityMessage("media")).toBe("Sesión completada");
    expect(sessionQualityMessage(undefined)).toBe("Sesión completada");
  });
});

describe("shouldPlayIgnitionSignature", () => {
  it("se reproduce solo cuando la sesión es real", () => {
    expect(shouldPlayIgnitionSignature("alta")).toBe(true);
    expect(shouldPlayIgnitionSignature("media")).toBe(true);
    expect(shouldPlayIgnitionSignature("ligera")).toBe(false);
    expect(shouldPlayIgnitionSignature("inválida")).toBe(false);
  });
});
