import { describe, it, expect } from "vitest";
import { prescribe } from "./prescriber";

function state(overrides = {}) {
  return {
    moodLog: [],
    history: [],
    hrvLog: [],
    rhrLog: [],
    lastSleepHours: null,
    chronotype: null,
    ...overrides,
  };
}

describe("prescriber.prescribe — rule priority", () => {
  it("R1: mood bajo reciente → calma + physiological_sigh", () => {
    const now = new Date();
    const st = state({
      moodLog: [{ ts: Date.now() - 10 * 60000, mood: 1, energy: 2 }],
    });
    const r = prescribe({ st, now });
    expect(r.intent).toBe("calma");
    expect(r.priority).toBe(1);
    expect(r.reason).toMatch(/tensión alta/i);
  });

  it("R2: >3 sesiones en 2h → calma + nsdr", () => {
    const now = new Date("2026-04-16T11:00:00");
    const t = now.getTime();
    const st = state({
      history: [
        { ts: t - 30 * 60000, pid: 1 },
        { ts: t - 50 * 60000, pid: 2 },
        { ts: t - 70 * 60000, pid: 3 },
        { ts: t - 90 * 60000, pid: 4 },
      ],
    });
    const r = prescribe({ st, now });
    expect(r.intent).toBe("calma");
    expect(r.priority).toBe(2);
    expect(r.reason).toMatch(/sobre-entrenamiento/i);
  });

  it("R6: ventana nocturna ≥21 → calma", () => {
    const now = new Date("2026-04-16T22:30:00");
    const r = prescribe({ st: state(), now });
    expect(r.intent).toBe("calma");
    expect(r.priority).toBe(6);
  });

  it("R6: ventana nocturna <5 → calma", () => {
    const now = new Date("2026-04-16T03:00:00");
    const r = prescribe({ st: state(), now });
    expect(r.intent).toBe("calma");
    expect(r.priority).toBe(6);
  });

  it("R7: bache post-almuerzo → reset", () => {
    const now = new Date("2026-04-16T14:30:00");
    const r = prescribe({ st: state(), now });
    expect(r.intent).toBe("reset");
    expect(r.priority).toBe(7);
  });

  it("fallback: mañana sin señales → energia", () => {
    const now = new Date("2026-04-16T08:00:00");
    const r = prescribe({ st: state(), now });
    expect(r.priority).toBe(99);
    expect(r.intent).toBe("energia");
  });

  it("fallback: tarde-noche sin señales (19+) → calma", () => {
    const now = new Date("2026-04-16T19:30:00");
    const r = prescribe({ st: state(), now });
    expect(r.priority).toBe(99);
    expect(r.intent).toBe("calma");
  });

  it("fallback: mediodía → enfoque", () => {
    const now = new Date("2026-04-16T11:30:00");
    const r = prescribe({ st: state(), now });
    expect(r.priority).toBe(99);
    expect(r.intent).toBe("enfoque");
  });

  it("retorna objeto con proto y señales presentes", () => {
    const now = new Date("2026-04-16T11:00:00");
    const r = prescribe({ st: state(), now });
    expect(r.proto).toBeDefined();
    expect(r.proto.int).toBeDefined();
  });

  it("mood bajo >30 min no dispara R1", () => {
    const now = new Date();
    const st = state({
      moodLog: [{ ts: Date.now() - 60 * 60000, mood: 1, energy: 2 }],
    });
    const r = prescribe({ st, now });
    expect(r.priority).not.toBe(1);
  });

  it("2 sesiones en 2h no disparan R2", () => {
    const now = new Date("2026-04-16T11:00:00");
    const t = now.getTime();
    const st = state({
      history: [
        { ts: t - 30 * 60000, pid: 1 },
        { ts: t - 60 * 60000, pid: 2 },
      ],
    });
    const r = prescribe({ st, now });
    expect(r.priority).not.toBe(2);
  });
});
