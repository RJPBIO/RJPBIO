import { describe, it, expect } from "vitest";
import {
  detectPauseFatigue,
  applyFatigueAdjustment,
  fatigueOverridePrimaryNeed,
  fatigueGuidance,
} from "./pauseFatigue";

function entry({ partial = false, quality = "media", pauses = 0, dur = 90, hiddenSec = 0 } = {}) {
  return { partial, quality, pauses, dur, hiddenSec };
}

describe("detectPauseFatigue", () => {
  it("none cuando history corto", () => {
    const r = detectPauseFatigue([entry()]);
    expect(r.level).toBe("none");
    expect(r.reason).toBe("insufficient-data");
  });

  it("none con sesiones limpias", () => {
    const hist = Array(8).fill(0).map(() => entry({ pauses: 0, partial: false, hiddenSec: 0, dur: 90 }));
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("none");
    expect(r.signals).toEqual([]);
  });

  it("mild con 2/5 partial sessions", () => {
    const hist = [
      entry({ partial: true, quality: "ligera" }),
      entry({ partial: true, quality: "ligera" }),
      entry(),
      entry(),
      entry(),
    ];
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("mild");
    expect(r.partialRatio).toBeCloseTo(0.4, 1);
    expect(r.signals.find((s) => s.kind === "partial")).toBeDefined();
  });

  it("severe con ≥3/5 partial sessions", () => {
    const hist = [
      entry({ partial: true, quality: "ligera" }),
      entry({ partial: true, quality: "ligera" }),
      entry({ partial: true, quality: "ligera" }),
      entry(),
      entry(),
    ];
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("severe");
    expect(r.partialRatio).toBeCloseTo(0.6, 1);
  });

  it("mild con avg pauses ≥2", () => {
    const hist = Array(5).fill(0).map(() => entry({ pauses: 2 }));
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("mild");
    expect(r.signals.find((s) => s.kind === "pauses")).toBeDefined();
  });

  it("severe con avg pauses ≥4", () => {
    const hist = Array(5).fill(0).map(() => entry({ pauses: 5 }));
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("severe");
  });

  it("mild con hidden ratio ≥20%", () => {
    const hist = Array(5).fill(0).map(() => entry({ dur: 100, hiddenSec: 25 })); // 25%
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("mild");
    expect(r.signals.find((s) => s.kind === "hidden")).toBeDefined();
  });

  it("severe con hidden ratio ≥40%", () => {
    const hist = Array(5).fill(0).map(() => entry({ dur: 100, hiddenSec: 50 })); // 50%
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("severe");
  });

  it("composes signals: cualquiera severe → level severe", () => {
    const hist = [
      entry({ pauses: 0, partial: false }),
      entry({ pauses: 0, partial: false }),
      entry({ pauses: 0, partial: false }),
      entry({ pauses: 0, partial: false }),
      entry({ pauses: 5 }), // mucha pausa pero solo 1
    ];
    // avg pauses = 1 → no severe individual
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("none");
  });

  it("nunca tira con malformed history", () => {
    expect(() => detectPauseFatigue(null)).not.toThrow();
    expect(() => detectPauseFatigue([null, undefined, {}])).not.toThrow();
  });

  it("solo considera la ventana (últimas 5)", () => {
    // 10 sesiones — primeras 5 todas partial, últimas 5 limpias
    const hist = [
      ...Array(5).fill(0).map(() => entry({ partial: true })),
      ...Array(5).fill(0).map(() => entry()),
    ];
    const r = detectPauseFatigue(hist);
    expect(r.level).toBe("none");
  });
});

describe("applyFatigueAdjustment", () => {
  it("no-op cuando level=none", () => {
    const r = applyFatigueAdjustment(50, { dif: 4, int: "energia" }, { level: "none" });
    expect(r).toBe(50);
  });

  it("penaliza protocolos con dif≥3 cuando mild", () => {
    const r = applyFatigueAdjustment(50, { dif: 4, int: "energia" }, { level: "mild" });
    expect(r).toBe(45); // 50 + (-5)
  });

  it("penaliza más cuando severe", () => {
    const r = applyFatigueAdjustment(50, { dif: 4, int: "energia" }, { level: "severe" });
    expect(r).toBe(35); // 50 + (-15)
  });

  it("no penaliza dif baja", () => {
    const r = applyFatigueAdjustment(50, { dif: 2, int: "energia" }, { level: "mild" });
    expect(r).toBe(50);
  });

  it("boostea protocolos de regulación", () => {
    const r = applyFatigueAdjustment(50, { dif: 1, int: "calma" }, { level: "severe" });
    expect(r).toBeGreaterThan(50);
  });
});

describe("fatigueOverridePrimaryNeed", () => {
  it("null si fatigue=none", () => {
    expect(fatigueOverridePrimaryNeed({ level: "none" }, "energia")).toBeNull();
  });

  it("null si fatigue=mild", () => {
    expect(fatigueOverridePrimaryNeed({ level: "mild" }, "energia")).toBeNull();
  });

  it("'calma' si severe y need actual no es regulación", () => {
    expect(fatigueOverridePrimaryNeed({ level: "severe" }, "energia")).toBe("calma");
    expect(fatigueOverridePrimaryNeed({ level: "severe" }, "enfoque")).toBe("calma");
  });

  it("null si severe pero ya en calma/reset", () => {
    expect(fatigueOverridePrimaryNeed({ level: "severe" }, "calma")).toBeNull();
    expect(fatigueOverridePrimaryNeed({ level: "severe" }, "reset")).toBeNull();
  });
});

describe("fatigueGuidance", () => {
  it("null sin fatigue", () => {
    expect(fatigueGuidance(null)).toBeNull();
    expect(fatigueGuidance({ level: "none" })).toBeNull();
  });

  it("retorna mild guidance", () => {
    const g = fatigueGuidance({ level: "mild" });
    expect(g.severity).toBe("mild");
    expect(g.title).toMatch(/ritmo/i);
  });

  it("retorna severe guidance", () => {
    const g = fatigueGuidance({ level: "severe" });
    expect(g.severity).toBe("severe");
    expect(g.title).toMatch(/pausa/i);
    expect(g.cta).toMatch(/calma/i);
  });
});
