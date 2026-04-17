import { describe, it, expect } from "vitest";
import { computeBreathFrame, breathCycleLength } from "./breathCycle";

const box = { in: 4, h1: 4, ex: 4, h2: 4 };
const inhaleExhale = { in: 4, ex: 6 };

describe("breathCycleLength", () => {
  it("suma todas las sub-fases (con huecos por defecto)", () => {
    expect(breathCycleLength(box)).toBe(16);
    expect(breathCycleLength(inhaleExhale)).toBe(10);
  });

  it("retorna 0 si br es null/undefined", () => {
    expect(breathCycleLength(null)).toBe(0);
    expect(breathCycleLength(undefined)).toBe(0);
  });
});

describe("computeBreathFrame — box 4-4-4-4", () => {
  it("t=0 → INHALA al inicio, scale 1, countdown 4", () => {
    const f = computeBreathFrame(0, box);
    expect(f.label).toBe("INHALA");
    expect(f.scale).toBe(1);
    expect(f.countdown).toBe(4);
  });

  it("t=2 (mitad de inhale) → scale 1.125", () => {
    const f = computeBreathFrame(2, box);
    expect(f.label).toBe("INHALA");
    expect(f.scale).toBe(1.125);
    expect(f.countdown).toBe(2);
  });

  it("t=4 → entra a MANTÉN, scale 1.25", () => {
    const f = computeBreathFrame(4, box);
    expect(f.label).toBe("MANTÉN");
    expect(f.scale).toBe(1.25);
    expect(f.countdown).toBe(4);
  });

  it("t=8 → entra a EXHALA, scale 1.25 (inicio)", () => {
    const f = computeBreathFrame(8, box);
    expect(f.label).toBe("EXHALA");
    expect(f.scale).toBe(1.25);
    expect(f.countdown).toBe(4);
  });

  it("t=10 (mitad de exhale) → scale 1.125", () => {
    const f = computeBreathFrame(10, box);
    expect(f.label).toBe("EXHALA");
    expect(f.scale).toBeCloseTo(1.125, 5);
    expect(f.countdown).toBe(2);
  });

  it("t=12 → entra a SOSTÉN, scale 1", () => {
    const f = computeBreathFrame(12, box);
    expect(f.label).toBe("SOSTÉN");
    expect(f.scale).toBe(1);
    expect(f.countdown).toBe(4);
  });

  it("t=16 → cicla, vuelve a INHALA", () => {
    const f = computeBreathFrame(16, box);
    expect(f.label).toBe("INHALA");
    expect(f.countdown).toBe(4);
  });

  it("t grande sigue funcionando (módulo)", () => {
    // 100 % 16 = 4 → inicio de MANTÉN
    const f = computeBreathFrame(100, box);
    expect(f.label).toBe("MANTÉN");
    // 105 % 16 = 9 → dentro de EXHALA
    expect(computeBreathFrame(105, box).label).toBe("EXHALA");
  });
});

describe("computeBreathFrame — inhale/exhale simple (sin holds)", () => {
  it("t=0 → INHALA", () => {
    const f = computeBreathFrame(0, inhaleExhale);
    expect(f.label).toBe("INHALA");
    expect(f.countdown).toBe(4);
  });

  it("t=4 → EXHALA (sin MANTÉN intermedio)", () => {
    const f = computeBreathFrame(4, inhaleExhale);
    expect(f.label).toBe("EXHALA");
    expect(f.scale).toBe(1.25);
    expect(f.countdown).toBe(6);
  });

  it("t=9 → último segundo de EXHALA", () => {
    const f = computeBreathFrame(9, inhaleExhale);
    expect(f.label).toBe("EXHALA");
    expect(f.countdown).toBe(1);
  });

  it("t=10 → re-cicla a INHALA (no hay SOSTÉN)", () => {
    const f = computeBreathFrame(10, inhaleExhale);
    expect(f.label).toBe("INHALA");
  });
});

describe("computeBreathFrame — defensiva", () => {
  it("retorna null si br es null/undefined", () => {
    expect(computeBreathFrame(0, null)).toBeNull();
    expect(computeBreathFrame(0, undefined)).toBeNull();
  });

  it("retorna null si el ciclo tiene duración 0", () => {
    expect(computeBreathFrame(0, { in: 0, ex: 0 })).toBeNull();
  });
});
