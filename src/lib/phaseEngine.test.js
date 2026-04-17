import { describe, it, expect } from "vitest";
import { computePhaseIndex, timeToNextPhase } from "./phaseEngine";

const phases = [
  { s: 0, ic: "breath", l: "Intro" },
  { s: 30, ic: "body", l: "Activar" },
  { s: 60, ic: "mind", l: "Enfocar" },
  { s: 90, ic: "focus", l: "Sostener" },
];

describe("computePhaseIndex", () => {
  it("empieza en la fase 0 cuando no hay tiempo transcurrido", () => {
    expect(computePhaseIndex(0, phases, 1)).toBe(0);
  });

  it("mantiene la fase actual hasta cruzar el próximo umbral", () => {
    expect(computePhaseIndex(29, phases, 1)).toBe(0);
    expect(computePhaseIndex(30, phases, 1)).toBe(1);
    expect(computePhaseIndex(59, phases, 1)).toBe(1);
    expect(computePhaseIndex(60, phases, 1)).toBe(2);
  });

  it("se queda en la última fase cuando el tiempo excede el total", () => {
    expect(computePhaseIndex(90, phases, 1)).toBe(3);
    expect(computePhaseIndex(10_000, phases, 1)).toBe(3);
  });

  it("escala los umbrales con durationMultiplier", () => {
    // scale 0.5: umbrales efectivos 0, 15, 30, 45
    expect(computePhaseIndex(14, phases, 0.5)).toBe(0);
    expect(computePhaseIndex(15, phases, 0.5)).toBe(1);
    expect(computePhaseIndex(30, phases, 0.5)).toBe(2);
    expect(computePhaseIndex(45, phases, 0.5)).toBe(3);
  });

  it("escala al alza (scale > 1)", () => {
    // scale 1.5: umbrales efectivos 0, 45, 90, 135
    expect(computePhaseIndex(44, phases, 1.5)).toBe(0);
    expect(computePhaseIndex(45, phases, 1.5)).toBe(1);
    expect(computePhaseIndex(135, phases, 1.5)).toBe(3);
  });

  it("defensivo: fases vacías o nulas retornan 0", () => {
    expect(computePhaseIndex(10, [], 1)).toBe(0);
    expect(computePhaseIndex(10, null, 1)).toBe(0);
    expect(computePhaseIndex(10, undefined, 1)).toBe(0);
  });

  it("defensivo: una sola fase siempre retorna 0", () => {
    expect(computePhaseIndex(100, [{ s: 0 }], 1)).toBe(0);
  });

  it("redondea umbrales fraccionarios (scale 0.3 con s=30 → 9)", () => {
    // round(30 * 0.3) = 9, round(60 * 0.3) = 18
    const p = [
      { s: 0 },
      { s: 30 },
      { s: 60 },
    ];
    expect(computePhaseIndex(8, p, 0.3)).toBe(0);
    expect(computePhaseIndex(9, p, 0.3)).toBe(1);
    expect(computePhaseIndex(18, p, 0.3)).toBe(2);
  });
});

describe("timeToNextPhase", () => {
  it("retorna segundos hasta el inicio de la siguiente fase", () => {
    expect(timeToNextPhase(10, phases, 1, 0)).toBe(20); // 30 - 10
    expect(timeToNextPhase(29, phases, 1, 0)).toBe(1);
    expect(timeToNextPhase(45, phases, 1, 1)).toBe(15); // 60 - 45
  });

  it("retorna null cuando el índice actual es el último", () => {
    expect(timeToNextPhase(95, phases, 1, 3)).toBeNull();
  });

  it("escala con durationMultiplier", () => {
    // scale 0.5: fase 1 empieza en 15
    expect(timeToNextPhase(5, phases, 0.5, 0)).toBe(10);
    expect(timeToNextPhase(28, phases, 0.5, 1)).toBe(2);
  });

  it("defensivo: fases vacías retornan null", () => {
    expect(timeToNextPhase(5, [], 1, 0)).toBeNull();
    expect(timeToNextPhase(5, null, 1, 0)).toBeNull();
  });

  it("puede retornar 0 cuando el tiempo coincide exactamente con el umbral", () => {
    expect(timeToNextPhase(30, phases, 1, 0)).toBe(0);
  });

  it("retorna valor negativo si se llama con índice desincronizado (señal de bug)", () => {
    // Si elapsed ya pasó el umbral pero currentIdx no se actualizó,
    // el resultado es negativo — útil para detectar inconsistencias.
    expect(timeToNextPhase(45, phases, 1, 0)).toBe(-15);
  });
});
