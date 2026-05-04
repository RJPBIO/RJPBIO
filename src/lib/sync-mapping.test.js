/* ═══════════════════════════════════════════════════════════════
   sync-mapping.test — Phase 6B SP3
   Verifica que outbox entries (kind:"hrv" + kind:"instrument") se
   mapean correctamente a row data para Prisma con coerciones de
   defensa en profundidad.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { mapHrvEntry, mapInstrumentEntry } from "./sync-mapping";

const CTX = { userId: "user-123", orgId: "org-personal-abc" };

describe("sync-mapping — mapHrvEntry", () => {
  it("mapea entry HRV cámara completa con todos los campos", () => {
    const entry = {
      id: "hrv-uuid-1",
      kind: "hrv",
      payload: {
        ts: 1700000000000,
        rmssd: 47.2, lnRmssd: 3.85, sdnn: 38.1, pnn50: 12.5,
        meanHR: 62.3, rhr: 62, n: 38, durationSec: 60,
        source: "camera", sqi: 78, sqiBand: "good",
      },
    };
    const data = mapHrvEntry(entry, CTX);
    expect(data.id).toBe("hrv-uuid-1");
    expect(data.userId).toBe("user-123");
    expect(data.orgId).toBe("org-personal-abc");
    expect(data.rmssd).toBe(47.2);
    expect(data.lnRmssd).toBe(3.85);
    expect(data.sdnn).toBe(38.1);
    expect(data.pnn50).toBe(12.5);
    expect(data.meanHr).toBe(62.3);
    expect(data.rhr).toBe(62);
    expect(data.durationSec).toBe(60);
    expect(data.n).toBe(38);
    expect(data.source).toBe("camera");
    expect(data.sqi).toBe(78);
    expect(data.sqiBand).toBe("good");
    expect(data.measuredAt).toEqual(new Date(1700000000000));
  });

  it("mapea entry HRV BLE sin sqi/sqiBand", () => {
    const entry = {
      id: "hrv-ble-1",
      kind: "hrv",
      payload: {
        ts: 1700000050000,
        rmssd: 50, lnRmssd: 3.91, meanHR: 58, n: 280,
        durationSec: 300, source: "ble",
      },
    };
    const data = mapHrvEntry(entry, CTX);
    expect(data.source).toBe("ble");
    expect(data.sqi).toBeNull();
    expect(data.sqiBand).toBeNull();
    expect(data.sdnn).toBeNull();
    expect(data.pnn50).toBeNull();
    expect(data.rhr).toBeNull();
  });

  it("acepta meanHr alias además de meanHR", () => {
    const entry = { id: "x", kind: "hrv", payload: { rmssd: 40, lnRmssd: 3.7, meanHr: 70, n: 30, durationSec: 60 } };
    expect(mapHrvEntry(entry, CTX).meanHr).toBe(70);
  });

  it("coerce source desconocido a 'camera' (default seguro)", () => {
    const entry = { id: "x", kind: "hrv", payload: { source: "evil_provider", rmssd: 40, lnRmssd: 3.7, meanHR: 60, n: 30, durationSec: 60 } };
    expect(mapHrvEntry(entry, CTX).source).toBe("camera");
  });

  it("clampea durationSec >7200 (max 2h fisiológico)", () => {
    const entry = { id: "x", kind: "hrv", payload: { rmssd: 40, lnRmssd: 3.7, meanHR: 60, n: 30, durationSec: 999999 } };
    expect(mapHrvEntry(entry, CTX).durationSec).toBe(7200);
  });

  it("rechaza Infinity/NaN en métricas core (defensa contra payload malicioso)", () => {
    const entry = { id: "x", kind: "hrv", payload: { rmssd: Infinity, lnRmssd: NaN, meanHR: -Infinity, sdnn: NaN, pnn50: Infinity, n: 30, durationSec: 60 } };
    const data = mapHrvEntry(entry, CTX);
    expect(data.rmssd).toBe(0);
    expect(data.lnRmssd).toBe(0);
    expect(data.meanHr).toBe(0);
    expect(data.sdnn).toBeNull();
    expect(data.pnn50).toBeNull();
  });

  it("trunca sqiBand a 32 chars (defensa column overflow)", () => {
    const entry = { id: "x", kind: "hrv", payload: { rmssd: 40, lnRmssd: 3.7, meanHR: 60, n: 30, durationSec: 60, sqiBand: "x".repeat(200) } };
    expect(mapHrvEntry(entry, CTX).sqiBand.length).toBe(32);
  });

  it("usa Date.now() si payload sin ts", () => {
    const entry = { id: "x", kind: "hrv", payload: { rmssd: 40, lnRmssd: 3.7, meanHR: 60, n: 30, durationSec: 60 } };
    const before = Date.now();
    const data = mapHrvEntry(entry, CTX);
    const after = Date.now();
    expect(data.measuredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(data.measuredAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("payload vacío no crashea (null-safe defaults)", () => {
    const entry = { id: "x", kind: "hrv", payload: {} };
    const data = mapHrvEntry(entry, CTX);
    expect(data.rmssd).toBe(0);
    expect(data.source).toBe("camera");
    expect(data.n).toBe(0);
  });

  it("payload undefined no crashea", () => {
    const entry = { id: "x", kind: "hrv" };
    const data = mapHrvEntry(entry, CTX);
    expect(data.rmssd).toBe(0);
    expect(data.userId).toBe("user-123");
  });
});

describe("sync-mapping — mapInstrumentEntry", () => {
  it("mapea entry PSS-4 completa", () => {
    const entry = {
      id: "inst-pss4-1",
      kind: "instrument",
      payload: {
        instrumentId: "pss-4",
        ts: 1700000000000,
        score: 7,
        level: "moderate",
        answers: [2, 1, 2, 2],
      },
    };
    const data = mapInstrumentEntry(entry, CTX);
    expect(data.id).toBe("inst-pss4-1");
    expect(data.userId).toBe("user-123");
    expect(data.orgId).toBe("org-personal-abc");
    expect(data.instrumentId).toBe("pss-4");
    expect(data.score).toBe(7);
    expect(data.level).toBe("moderate");
    expect(data.answers).toEqual([2, 1, 2, 2]);
    expect(data.takenAt).toEqual(new Date(1700000000000));
  });

  it("mapea entry SWEMWBS-7 con metricScore", () => {
    const entry = {
      id: "inst-sw-1",
      kind: "instrument",
      payload: {
        instrumentId: "swemwbs-7",
        ts: 1700001000000,
        score: 28,
        level: "high",
        answers: [4, 4, 4, 4, 4, 4, 4],
      },
    };
    const data = mapInstrumentEntry(entry, CTX);
    expect(data.instrumentId).toBe("swemwbs-7");
    expect(data.score).toBe(28);
  });

  it("trunca instrumentId a 64 chars (defensa column overflow)", () => {
    const entry = { id: "x", kind: "instrument", payload: { instrumentId: "x".repeat(200), score: 5, level: "low", answers: [] } };
    expect(mapInstrumentEntry(entry, CTX).instrumentId.length).toBe(64);
  });

  it("trunca level a 32 chars", () => {
    const entry = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: 5, level: "x".repeat(200), answers: [] } };
    expect(mapInstrumentEntry(entry, CTX).level.length).toBe(32);
  });

  it("score se redondea y clampa a [0, 1000]", () => {
    const entry1 = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: 7.8, level: "low", answers: [] } };
    expect(mapInstrumentEntry(entry1, CTX).score).toBe(7);
    const entry2 = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: 99999, level: "low", answers: [] } };
    expect(mapInstrumentEntry(entry2, CTX).score).toBe(1000);
    const entry3 = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: -50, level: "low", answers: [] } };
    expect(mapInstrumentEntry(entry3, CTX).score).toBe(0);
  });

  it("answers null fallback a {} (JSONB-safe)", () => {
    const entry = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: 5, level: "low" } };
    expect(mapInstrumentEntry(entry, CTX).answers).toEqual({});
  });

  it("instrumentId desconocido fallback a 'unknown'", () => {
    const entry = { id: "x", kind: "instrument", payload: { score: 5, level: "low", answers: [] } };
    expect(mapInstrumentEntry(entry, CTX).instrumentId).toBe("unknown");
  });

  it("usa Date.now() si payload sin ts", () => {
    const entry = { id: "x", kind: "instrument", payload: { instrumentId: "pss-4", score: 5, level: "low", answers: [] } };
    const before = Date.now();
    const data = mapInstrumentEntry(entry, CTX);
    const after = Date.now();
    expect(data.takenAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(data.takenAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("payload undefined no crashea", () => {
    const entry = { id: "x", kind: "instrument" };
    const data = mapInstrumentEntry(entry, CTX);
    expect(data.instrumentId).toBe("unknown");
    expect(data.score).toBe(0);
    expect(data.userId).toBe("user-123");
  });
});
