import { describe, it, expect } from "vitest";
import { mergeStates } from "./sync";

describe("mergeStates — merge strategy", () => {
  it("retorna remote si local es null", () => {
    const remote = { totalSessions: 5 };
    expect(mergeStates(null, remote)).toEqual(remote);
  });

  it("retorna local si remote es null", () => {
    const local = { totalSessions: 5 };
    expect(mergeStates(local, null)).toEqual(local);
  });

  it("counters → MAX (nunca decremento)", () => {
    const local = { totalSessions: 10, vCores: 50, streak: 3, bestStreak: 5 };
    const remote = { totalSessions: 12, vCores: 30, streak: 7, bestStreak: 4 };
    const merged = mergeStates(local, remote);
    expect(merged.totalSessions).toBe(12); // MAX
    expect(merged.vCores).toBe(50);        // MAX
    expect(merged.streak).toBe(7);         // MAX
    expect(merged.bestStreak).toBe(5);     // MAX
  });

  it("totalTime → MAX", () => {
    const merged = mergeStates({ totalTime: 1000 }, { totalTime: 2000 });
    expect(merged.totalTime).toBe(2000);
  });

  it("counters undefined tratados como 0 (no NaN)", () => {
    const merged = mergeStates({}, { totalSessions: 5 });
    expect(merged.totalSessions).toBe(5);
    expect(merged.streak).toBe(0);
  });

  it("history → dedupe por ts", () => {
    const local = { history: [{ ts: 1, p: "calma" }, { ts: 2, p: "enfoque" }] };
    const remote = { history: [{ ts: 2, p: "enfoque" }, { ts: 3, p: "energia" }] };
    const merged = mergeStates(local, remote);
    expect(merged.history).toHaveLength(3);
    const ts = merged.history.map((x) => x.ts).sort();
    expect(ts).toEqual([1, 2, 3]);
  });

  it("history se trunca a 500 entries", () => {
    const local = {
      history: Array.from({ length: 600 }, (_, i) => ({ ts: i, p: "x" })),
    };
    const merged = mergeStates(local, {});
    expect(merged.history).toHaveLength(500);
  });

  it("moodLog → dedupe por ts", () => {
    const local = { moodLog: [{ ts: 1, mood: 3 }, { ts: 2, mood: 4 }] };
    const remote = { moodLog: [{ ts: 2, mood: 4 }, { ts: 3, mood: 5 }] };
    const merged = mergeStates(local, remote);
    expect(merged.moodLog).toHaveLength(3);
  });

  it("achievements → union (set semantics)", () => {
    const local = { achievements: ["first_session", "mood5"] };
    const remote = { achievements: ["first_session", "calibrated"] };
    const merged = mergeStates(local, remote);
    expect(merged.achievements.sort()).toEqual(
      ["calibrated", "first_session", "mood5"]
    );
  });

  it("unlockedSS → union con default 'off'", () => {
    const local = { unlockedSS: ["off", "rain"] };
    const remote = { unlockedSS: ["off", "fire"] };
    const merged = mergeStates(local, remote);
    expect(merged.unlockedSS.sort()).toEqual(["fire", "off", "rain"]);
  });

  it("unlockedSS añade 'off' si ambos están vacíos", () => {
    const merged = mergeStates({}, {});
    expect(merged.unlockedSS).toContain("off");
  });

  it("neuralBaseline → pick by ts (más reciente gana)", () => {
    const local = { neuralBaseline: { ts: 1000, value: "old" } };
    const remote = { neuralBaseline: { ts: 2000, value: "new" } };
    const merged = mergeStates(local, remote);
    expect(merged.neuralBaseline.value).toBe("new");
  });

  it("neuralBaseline pick maneja null en uno de los lados", () => {
    const local = { neuralBaseline: null };
    const remote = { neuralBaseline: { ts: 1000, value: "x" } };
    const merged = mergeStates(local, remote);
    expect(merged.neuralBaseline?.value).toBe("x");
  });

  it("campos arbitrarios: local wins (más fresco)", () => {
    const local = { customField: "local-version" };
    const remote = { customField: "remote-version" };
    const merged = mergeStates(local, remote);
    expect(merged.customField).toBe("local-version");
  });

  it("campos solo en remote son preservados", () => {
    const local = { totalSessions: 5 };
    const remote = { extraServerOnly: "value", totalSessions: 3 };
    const merged = mergeStates(local, remote);
    expect(merged.extraServerOnly).toBe("value");
    expect(merged.totalSessions).toBe(5);
  });

  it("listas vacías o ausentes no rompen merge", () => {
    const merged = mergeStates({}, {});
    expect(merged.history).toEqual([]);
    expect(merged.moodLog).toEqual([]);
    expect(merged.hrvLog).toEqual([]);
    expect(merged.rhrLog).toEqual([]);
    expect(merged.achievements).toEqual([]);
  });

  it("hrvLog y rhrLog se truncan a 200", () => {
    const local = {
      hrvLog: Array.from({ length: 250 }, (_, i) => ({ ts: i, rmssd: 50 })),
    };
    const merged = mergeStates(local, {});
    expect(merged.hrvLog).toHaveLength(200);
  });

  it("instruments y nom035Results se truncan a 100 y 50", () => {
    const local = {
      instruments: Array.from({ length: 150 }, (_, i) => ({ ts: i })),
      nom035Results: Array.from({ length: 80 }, (_, i) => ({ ts: i })),
    };
    const merged = mergeStates(local, {});
    expect(merged.instruments).toHaveLength(100);
    expect(merged.nom035Results).toHaveLength(50);
  });

  it("dedupe ignora entries sin ts", () => {
    const local = { history: [{ p: "no_ts" }, { ts: 1 }] };
    const remote = { history: [{ ts: 1 }, { p: "another_no_ts" }] };
    const merged = mergeStates(local, remote);
    // Ambos sin ts deberían filtrarse (key undefined)
    expect(merged.history.every((x) => x.ts !== undefined)).toBe(true);
    expect(merged.history).toHaveLength(1);
  });

  it("preserva semántica con counters concurrentes (race-safe)", () => {
    // Escenario real: device A sincroniza con totalSessions=10
    // Device B offline hace +3 sesiones (totalSessions=13 local)
    // Device B sincroniza → debería ganar
    const local = { totalSessions: 13 };  // device B (más reciente)
    const remote = { totalSessions: 10 }; // server (último sync)
    const merged = mergeStates(local, remote);
    expect(merged.totalSessions).toBe(13);
  });
});
