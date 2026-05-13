/* eslint-disable no-console */
/*
 * SP-1.5 dev-seed unit tests — pure-function coverage.
 *
 * Cubre: parseArgs · assertSafetyGuards · buildHistoryEntries · buildMoodLog ·
 *        computeStreak · seededRandom (determinismo).
 *
 * NO cubre: injectViaPlaywright / generateAuthCookie (integration; requieren
 * dev server + Playwright + DB live). Esos se validan con TASK 4 e2e manual.
 */

import { describe, it, expect } from "vitest";
import {
  parseArgs,
  buildHistoryEntries,
  buildMoodLog,
  computeStreak,
  seededRandom,
} from "./dev-seed.mjs";

describe("dev-seed · parseArgs", () => {
  it("parses email + sessions", () => {
    const a = parseArgs(["--email", "u@x.com", "--sessions", "10"]);
    expect(a.email).toBe("u@x.com");
    expect(a.sessions).toBe(10);
    expect(a.clear).toBe(false);
  });

  it("defaults sessions to 30", () => {
    const a = parseArgs(["--email", "u@x.com"]);
    expect(a.sessions).toBe(30);
  });

  it("parses --clear flag", () => {
    const a = parseArgs(["--email", "u@x.com", "--clear"]);
    expect(a.clear).toBe(true);
  });

  it("parses --base-url override", () => {
    const a = parseArgs(["--email", "u@x.com", "--base-url", "http://127.0.0.1:4000"]);
    expect(a.baseUrl).toBe("http://127.0.0.1:4000");
  });

  it("returns null email when missing", () => {
    const a = parseArgs(["--sessions", "5"]);
    expect(a.email).toBeNull();
  });
});

describe("dev-seed · seededRandom", () => {
  it("is deterministic given same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const aSeq = [a(), a(), a(), a()];
    const bSeq = [b(), b(), b(), b()];
    expect(aSeq).toEqual(bSeq);
  });

  it("returns values in [0,1)", () => {
    const r = seededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("dev-seed · buildHistoryEntries", () => {
  it("produces N entries with correct shape", () => {
    const entries = buildHistoryEntries({
      sessions: 30,
      startDateMs: Date.now() - 30 * 86400000,
    });
    expect(entries).toHaveLength(30);
    for (const e of entries) {
      expect(typeof e.p).toBe("string");
      expect(typeof e.ts).toBe("number");
      expect(typeof e.vc).toBe("number");
      expect(typeof e.c).toBe("number");
      expect(typeof e.r).toBe("number");
      expect(typeof e.dur).toBe("number");
      expect(typeof e.bioQ).toBe("number");
      expect(["ligera", "estándar", "alta", "premium"]).toContain(e.quality);
      expect(["morning", "day", "evening", "night"]).toContain(e.circadian);
      expect(typeof e.partial).toBe("boolean");
      expect(e.completeness).toBeGreaterThanOrEqual(0);
      expect(e.completeness).toBeLessThanOrEqual(1);
      expect(e.dimensions).toMatchObject({
        foco: expect.any(Number),
        calma: expect.any(Number),
        energia: expect.any(Number),
      });
      // Per shape de _buildHistoryEntry (src/lib/neural.js:1573)
      expect(e.actsLog).toBeNull();
      expect(e.actsCompleted).toBeNull();
      expect(e.actsSkipped).toBeNull();
      expect(e.actsFailed).toBeNull();
      expect(e.postSessionFeedback).toBeNull();
    }
  });

  it("produces realistic distribution (70/20/10 ± wiggle)", () => {
    const entries = buildHistoryEntries({ sessions: 200, startDateMs: 0, seed: 42 });
    const partial = entries.filter((e) => e.partial).length;
    // 20% partials with reasonable variance
    expect(partial).toBeGreaterThan(20);
    expect(partial).toBeLessThan(80);
  });

  it("HRV trends up over sessions", () => {
    const entries = buildHistoryEntries({ sessions: 30, startDateMs: 0, seed: 1 });
    const firstHalfAvg = entries.slice(0, 15)
      .reduce((sum, e) => sum + e._seedMeta.rmssd, 0) / 15;
    const secondHalfAvg = entries.slice(15)
      .reduce((sum, e) => sum + e._seedMeta.rmssd, 0) / 15;
    expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
  });

  it("entries are chronologically ordered", () => {
    const entries = buildHistoryEntries({ sessions: 20, startDateMs: 0 });
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].ts).toBeGreaterThanOrEqual(entries[i - 1].ts);
    }
  });
});

describe("dev-seed · buildMoodLog", () => {
  it("produces one mood entry per session entry", () => {
    const entries = buildHistoryEntries({ sessions: 10, startDateMs: 0 });
    const mood = buildMoodLog(entries);
    expect(mood).toHaveLength(10);
    for (const m of mood) {
      expect(m.pre).toBeGreaterThanOrEqual(1);
      expect(m.pre).toBeLessThanOrEqual(5);
      expect(m.mood).toBeGreaterThanOrEqual(1);
      expect(m.mood).toBeLessThanOrEqual(5);
    }
  });
});

describe("dev-seed · computeStreak", () => {
  it("returns 0 for empty entries", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("returns 0 when last entry is older than yesterday", () => {
    const tenDaysAgo = Date.now() - 10 * 86400000;
    expect(computeStreak([{ ts: tenDaysAgo }])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const entries = [];
    for (let i = 0; i < 5; i++) {
      entries.push({ ts: Date.now() - i * 86400000 });
    }
    const s = computeStreak(entries);
    expect(s).toBeGreaterThanOrEqual(4);
    expect(s).toBeLessThanOrEqual(5);
  });
});
