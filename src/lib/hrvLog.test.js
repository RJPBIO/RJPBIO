import { describe, it, expect } from "vitest";
import {
  isReliableHrvEntry,
  isReliableRhrEntry,
  getReliableHrvEntries,
  getReliableRhrEntries,
  getCurrentReliableHrv,
  buildReliableHrvBaseline,
} from "./hrvLog";

describe("isReliableHrvEntry", () => {
  it("BLE / legacy (no source) entries are reliable", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0 })).toBe(true);
  });

  it("camera entries with SQI ≥ 60 are reliable", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 60 })).toBe(true);
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 90 })).toBe(true);
  });

  it("camera entries with SQI < 60 are rejected", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 59 })).toBe(false);
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera", sqi: 0 })).toBe(false);
  });

  it("camera entries without SQI are rejected (sospechosa)", () => {
    expect(isReliableHrvEntry({ lnRmssd: 4.0, source: "camera" })).toBe(false);
  });

  it("entries without lnRmssd are rejected", () => {
    expect(isReliableHrvEntry({ source: "camera", sqi: 80 })).toBe(false);
    expect(isReliableHrvEntry({})).toBe(false);
    expect(isReliableHrvEntry(null)).toBe(false);
    expect(isReliableHrvEntry(undefined)).toBe(false);
  });
});

describe("isReliableRhrEntry", () => {
  it("BLE / legacy (no source) entries are reliable", () => {
    expect(isReliableRhrEntry({ rhr: 60 })).toBe(true);
  });

  it("camera entries follow same SQI rules", () => {
    expect(isReliableRhrEntry({ rhr: 60, source: "camera", sqi: 75 })).toBe(true);
    expect(isReliableRhrEntry({ rhr: 60, source: "camera", sqi: 30 })).toBe(false);
    expect(isReliableRhrEntry({ rhr: 60, source: "camera" })).toBe(false);
  });

  it("entries without rhr are rejected", () => {
    expect(isReliableRhrEntry({ source: "camera", sqi: 80 })).toBe(false);
    expect(isReliableRhrEntry(null)).toBe(false);
  });
});

describe("getReliableHrvEntries", () => {
  it("returns empty for non-array input", () => {
    expect(getReliableHrvEntries(null)).toEqual([]);
    expect(getReliableHrvEntries(undefined)).toEqual([]);
    expect(getReliableHrvEntries("oops")).toEqual([]);
  });

  it("normalizes legacy lnrmssd casing", () => {
    const log = [{ ts: 1, lnrmssd: 3.9 }];
    const out = getReliableHrvEntries(log);
    expect(out).toHaveLength(1);
    expect(out[0].lnRmssd).toBe(3.9);
  });

  it("filters out unreliable camera entries while keeping BLE", () => {
    const log = [
      { ts: 1, lnRmssd: 4.0 }, // BLE — reliable
      { ts: 2, lnRmssd: 4.1, source: "camera", sqi: 80 }, // good cam
      { ts: 3, lnRmssd: 3.5, source: "camera", sqi: 25 }, // basura
      { ts: 4, lnRmssd: 4.2, source: "camera" }, // sin SQI → basura
    ];
    const out = getReliableHrvEntries(log);
    expect(out.map((h) => h.ts)).toEqual([1, 2]);
  });
});

describe("getReliableRhrEntries", () => {
  it("legacy rhrLog entries (no source) are kept", () => {
    const log = [{ ts: 1, rhr: 60 }, { ts: 2, rhr: 62 }];
    expect(getReliableRhrEntries(log)).toHaveLength(2);
  });

  it("filters camera RHR by SQI", () => {
    const log = [
      { ts: 1, rhr: 60 }, // BLE legacy
      { ts: 2, rhr: 65, source: "camera", sqi: 70 }, // good
      { ts: 3, rhr: 55, source: "camera", sqi: 30 }, // basura
    ];
    const out = getReliableRhrEntries(log);
    expect(out.map((h) => h.ts)).toEqual([1, 2]);
  });
});

describe("getCurrentReliableHrv", () => {
  it("returns null for empty / unreliable-only logs", () => {
    expect(getCurrentReliableHrv([])).toBeNull();
    expect(getCurrentReliableHrv(null)).toBeNull();
    expect(
      getCurrentReliableHrv([
        { ts: 1, lnRmssd: 4.0, source: "camera", sqi: 30 },
      ])
    ).toBeNull();
  });

  it("returns the most recent RELIABLE entry, not just the most recent", () => {
    const log = [
      { ts: 100, lnRmssd: 4.0, rhr: 62 }, // BLE
      { ts: 200, lnRmssd: 3.0, rhr: 90, source: "camera", sqi: 25 }, // basura
    ];
    const r = getCurrentReliableHrv(log);
    expect(r).toEqual({ lnRmssd: 4.0, rhr: 62 });
  });

  it("handles missing rhr gracefully", () => {
    const log = [{ ts: 1, lnRmssd: 4.0 }];
    expect(getCurrentReliableHrv(log)).toEqual({ lnRmssd: 4.0, rhr: null });
  });
});

describe("buildReliableHrvBaseline", () => {
  it("returns empty for non-array", () => {
    expect(buildReliableHrvBaseline(null)).toEqual([]);
  });

  it("respects time window + reliability simultaneously", () => {
    const now = Date.now();
    const log = [
      { ts: now - 1 * 86400000, lnRmssd: 4.0 }, // in window, BLE
      { ts: now - 5 * 86400000, lnRmssd: 4.1, source: "camera", sqi: 80 }, // in window, good cam
      { ts: now - 6 * 86400000, lnRmssd: 3.0, source: "camera", sqi: 30 }, // in window, basura
      { ts: now - 30 * 86400000, lnRmssd: 4.5 }, // out of 14d window
    ];
    expect(buildReliableHrvBaseline(log, 14)).toEqual([4.0, 4.1]);
  });
});
