import { describe, it, expect } from "vitest";
import {
  pvtPercentile, stroopPercentile, iivScore, pvtLapses, interpretPVT,
} from "./cognitive-norms";

describe("pvtPercentile", () => {
  it("rt inválido → null", () => {
    expect(pvtPercentile(0)).toBeNull();
    expect(pvtPercentile(-100)).toBeNull();
    expect(pvtPercentile(null)).toBeNull();
  });
  it("rt rápido → percentil alto", () => {
    const p = pvtPercentile(200, 25);
    expect(p).toBeGreaterThan(75);
  });
  it("rt lento → percentil bajo", () => {
    const p = pvtPercentile(500, 25);
    expect(p).toBeLessThan(25);
  });
  it("edades diferentes usan normas distintas", () => {
    const joven = pvtPercentile(280, 25);
    const mayor = pvtPercentile(280, 65);
    expect(mayor).toBeGreaterThan(joven);
  });
  it("edad fuera de rango usa fallback", () => {
    const p = pvtPercentile(300, 200);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});

describe("stroopPercentile", () => {
  it("no numérico → null", () => {
    expect(stroopPercentile("nope")).toBeNull();
    expect(stroopPercentile(null)).toBeNull();
  });
  it("interferencia baja → percentil alto", () => {
    const p = stroopPercentile(60, 25);
    expect(p).toBeGreaterThan(70);
  });
  it("interferencia alta → percentil bajo", () => {
    const p = stroopPercentile(250, 25);
    expect(p).toBeLessThan(30);
  });
});

describe("iivScore", () => {
  it("< 5 muestras → null", () => {
    expect(iivScore([1, 2, 3])).toBeNull();
  });
  it("no array → null", () => {
    expect(iivScore(null)).toBeNull();
    expect(iivScore("abc")).toBeNull();
  });
  it("consistentes → IIV bajo", () => {
    const r = iivScore([300, 305, 298, 302, 301, 299]);
    expect(r).toBeLessThan(5);
  });
  it("variables → IIV alto", () => {
    const r = iivScore([100, 800, 200, 700, 150, 600]);
    expect(r).toBeGreaterThan(30);
  });
});

describe("pvtLapses", () => {
  it("no array → 0", () => {
    expect(pvtLapses(null)).toBe(0);
  });
  it("cuenta rt > 500ms", () => {
    expect(pvtLapses([300, 600, 400, 800, 450])).toBe(2);
  });
  it("sin lapses → 0", () => {
    expect(pvtLapses([300, 400, 350])).toBe(0);
  });
});

describe("interpretPVT", () => {
  it("meanRt inválido → datos insuficientes", () => {
    const r = interpretPVT({ meanRt: null, lapses: 0, iiv: null });
    expect(r.label).toBe("Datos insuficientes");
    expect(r.concern).toBeNull();
  });
  it("rt rápido → superior al promedio", () => {
    const r = interpretPVT({ meanRt: 220, lapses: 0, iiv: 5, age: 25 });
    expect(r.label).toMatch(/superior/);
    expect(r.pct).toBeGreaterThan(75);
  });
  it("rt normal → dentro del rango normal", () => {
    const r = interpretPVT({ meanRt: 270, lapses: 0, iiv: 8, age: 25 });
    expect(r.label).toMatch(/normal/);
  });
  it("rt lento → bastante por debajo + fatigue/illness", () => {
    const r = interpretPVT({ meanRt: 500, lapses: 0, iiv: 5, age: 25 });
    expect(r.label).toMatch(/por debajo/);
    expect(r.concern).toBeDefined();
  });
  it("3+ lapses → sleep_deprivation", () => {
    const r = interpretPVT({ meanRt: 270, lapses: 4, iiv: 8, age: 25 });
    expect(r.concern).toBe("sleep_deprivation");
  });
  it("IIV >20 sin otra concern → attentional_instability", () => {
    const r = interpretPVT({ meanRt: 270, lapses: 0, iiv: 25, age: 25 });
    expect(r.concern).toBe("attentional_instability");
  });
});
