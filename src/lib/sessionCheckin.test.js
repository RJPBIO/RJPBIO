import { describe, it, expect } from "vitest";
import { buildCheckinEntry } from "./sessionCheckin";

const PROTO = { n: "Box 4-4-4-4", int: "calma" };

describe("buildCheckinEntry", () => {
  it("devuelve skipped cuando checkMood<=0", () => {
    const r = buildCheckinEntry({
      checkMood: 0,
      protocol: PROTO,
      existingMoodLog: [{ ts: 1, mood: 3 }],
      existingAchievements: ["x"],
    });
    expect(r.skipped).toBe(true);
    expect(r.moodLog).toEqual([{ ts: 1, mood: 3 }]);
    expect(r.achievements).toEqual(["x"]);
    expect(r.outcome).toBeNull();
  });

  it("appendea una entrada con shape canónica", () => {
    const r = buildCheckinEntry({
      checkMood: 4,
      checkEnergy: 3,
      checkTag: "after lunch",
      preMood: 2,
      protocol: PROTO,
      ts: 1000,
      existingMoodLog: [],
      existingAchievements: [],
    });
    expect(r.skipped).toBe(false);
    expect(r.moodLog).toHaveLength(1);
    expect(r.moodLog[0]).toEqual({
      ts: 1000, mood: 4, energy: 3, tag: "after lunch", proto: "Box 4-4-4-4", pre: 2,
    });
  });

  it("respeta MAX_LOG=100 (recorta desde el principio)", () => {
    const existing = Array.from({ length: 100 }, (_, i) => ({ ts: i, mood: 3 }));
    const r = buildCheckinEntry({
      checkMood: 4, preMood: 2, protocol: PROTO, ts: 999,
      existingMoodLog: existing, existingAchievements: [],
    });
    expect(r.moodLog).toHaveLength(100);
    expect(r.moodLog[0].ts).toBe(1); // el 0 se perdió
    expect(r.moodLog[99].ts).toBe(999);
  });

  it("añade achievement mood5 la primera vez", () => {
    const r = buildCheckinEntry({
      checkMood: 5, preMood: 3, protocol: PROTO,
      existingMoodLog: [], existingAchievements: ["foo"],
    });
    expect(r.achievements).toEqual(["foo", "mood5"]);
  });

  it("no duplica mood5 si ya existe", () => {
    const r = buildCheckinEntry({
      checkMood: 5, preMood: 3, protocol: PROTO,
      existingMoodLog: [], existingAchievements: ["mood5"],
    });
    expect(r.achievements).toEqual(["mood5"]);
  });

  it("no produce outcome sin preMood", () => {
    const r = buildCheckinEntry({
      checkMood: 4, preMood: 0, protocol: PROTO,
      existingMoodLog: [], existingAchievements: [],
    });
    expect(r.outcome).toBeNull();
    // pero sí guarda el entry
    expect(r.moodLog).toHaveLength(1);
  });

  it("outcome incluye intent/protocol/deltaMood con pre+post", () => {
    const r = buildCheckinEntry({
      checkMood: 5, preMood: 2, protocol: PROTO, predictedDelta: 2.3,
      completionRatio: 0.9,
      existingMoodLog: [], existingAchievements: [],
    });
    expect(r.outcome).toMatchObject({
      intent: "calma",
      protocol: "Box 4-4-4-4",
      deltaMood: 3,
      predictedDelta: 2.3,
      completionRatio: 0.9,
    });
  });

  it("no produce outcome sin protocol.int válido", () => {
    const r = buildCheckinEntry({
      checkMood: 4, preMood: 3,
      protocol: { n: "x" }, // sin int
      existingMoodLog: [], existingAchievements: [],
    });
    expect(r.outcome).toBeNull();
  });

  it("valores no-finitos caen a defaults sin romper", () => {
    const r = buildCheckinEntry({
      checkMood: 3, checkEnergy: NaN, preMood: "bad", protocol: PROTO,
      existingMoodLog: null, existingAchievements: null,
    });
    expect(r.moodLog[0].energy).toBe(2); // default
    expect(r.outcome).toBeNull(); // preMood inválido → no outcome
  });

  it("hrvDelta y energyDeltaOverride se propagan al outcome cuando son finitos", () => {
    const r = buildCheckinEntry({
      checkMood: 4, preMood: 2, protocol: PROTO,
      existingMoodLog: [], existingAchievements: [],
      hrvDelta: 0.15, energyDeltaOverride: 1,
    });
    expect(r.outcome.hrvDelta).toBe(0.15);
    expect(r.outcome.energyDelta).toBe(1);
  });
});
