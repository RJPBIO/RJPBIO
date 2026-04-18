import { describe, it, expect } from "vitest";
import { assessBurnout, BURNOUT_LEVELS, burnoutCopy } from "./burnout";

const DAY = 86400_000;
const NOW = new Date("2026-04-17T12:00:00Z").getTime();

function mkSession(daysAgo, { pre = 6, mood = 7, cd = 10 } = {}) {
  return {
    completedAt: new Date(NOW - daysAgo * DAY).toISOString(),
    pre,
    mood,
    coherenciaDelta: cd,
  };
}

describe("assessBurnout", () => {
  it("returns insufficient below minSessions", () => {
    const r = assessBurnout([mkSession(1), mkSession(2)], { now: NOW });
    expect(r.insufficient).toBe(true);
    expect(r.level).toBe(BURNOUT_LEVELS.OK);
  });

  it("OK for steady pattern", () => {
    const sessions = [];
    for (let d = 0; d < 28; d++) sessions.push(mkSession(d, { pre: 6, mood: 7, cd: 12 }));
    const r = assessBurnout(sessions, { now: NOW });
    expect(r.level).toBe(BURNOUT_LEVELS.OK);
    expect(r.signals).toHaveLength(0);
  });

  it("flags a significant frequency drop", () => {
    const sessions = [];
    // Baseline denso (2/día × 21 días = 42)
    for (let d = 8; d < 28; d++) { sessions.push(mkSession(d + 0.1)); sessions.push(mkSession(d + 0.5)); }
    // Recientes: solo 3 sesiones en 7 días → drop ~78%
    sessions.push(mkSession(0), mkSession(2), mkSession(4));
    const r = assessBurnout(sessions, { now: NOW });
    expect([BURNOUT_LEVELS.WARN, BURNOUT_LEVELS.ALERT]).toContain(r.level);
    expect(r.signals.some((s) => /frecuencia/.test(s))).toBe(true);
  });

  it("WARN on strong declining pre-mood", () => {
    const sessions = [];
    for (let d = 0; d < 28; d++) {
      // pre-mood cae de 8 a 3 linealmente
      const pre = 8 - (27 - d) / 27 * 5;
      sessions.push(mkSession(d, { pre, mood: pre + 0.2, cd: 10 }));
    }
    const r = assessBurnout(sessions, { now: NOW });
    expect(r.metrics.moodSlopePerWeek).toBeLessThan(0);
    expect([BURNOUT_LEVELS.WARN, BURNOUT_LEVELS.ALERT]).toContain(r.level);
  });

  it("ALERT when 2+ strong signals combine", () => {
    const sessions = [];
    // Baseline frecuente y con buena efectividad
    for (let d = 7; d < 28; d++) sessions.push(mkSession(d, { pre: 7, mood: 9, cd: 25 }));
    // Reciente: baja frecuencia y baja efectividad
    for (let d = 0; d < 7; d += 3) sessions.push(mkSession(d, { pre: 4, mood: 4.2, cd: 2 }));
    const r = assessBurnout(sessions, { now: NOW });
    expect(r.level).toBe(BURNOUT_LEVELS.ALERT);
    expect(r.signals.length).toBeGreaterThanOrEqual(2);
  });

  it("metrics include freqDrop and effectivenessDrop as numbers", () => {
    const sessions = [];
    for (let d = 0; d < 28; d++) sessions.push(mkSession(d));
    const r = assessBurnout(sessions, { now: NOW });
    expect(typeof r.metrics.freqDrop).toBe("number");
    expect(typeof r.metrics.effectivenessDrop).toBe("number");
  });

  it("handles sessions without pre/mood gracefully", () => {
    const sessions = [];
    for (let d = 0; d < 14; d++) sessions.push({ completedAt: new Date(NOW - d * DAY).toISOString() });
    const r = assessBurnout(sessions, { now: NOW });
    expect(r.level).toBeDefined();
    expect(r.metrics.moodSlopePerWeek).toBe(0);
  });
});

describe("burnoutCopy", () => {
  it("returns title+body for every level", () => {
    for (const l of Object.values(BURNOUT_LEVELS)) {
      const c = burnoutCopy(l);
      expect(c.title).toBeTruthy();
      expect(c.body).toBeTruthy();
    }
  });

  it("never claims diagnosis on ALERT", () => {
    const c = burnoutCopy(BURNOUT_LEVELS.ALERT);
    expect(c.body.toLowerCase()).not.toMatch(/diagnós/);
  });
});
