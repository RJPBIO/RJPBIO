import { describe, it, expect } from "vitest";
import { updateArm, armStats, scoreArm, selectArm, armCI, topArms } from "./bandit";

describe("updateArm", () => {
  it("inicializa desde undefined", () => {
    const a = updateArm(undefined, 1.5);
    expect(a).toEqual({ n: 1, sum: 1.5, sumsq: 2.25 });
  });
  it("acumula incrementalmente", () => {
    let a = updateArm(undefined, 1);
    a = updateArm(a, 2);
    a = updateArm(a, 3);
    expect(a.n).toBe(3);
    expect(a.sum).toBe(6);
    expect(a.sumsq).toBe(14);
  });
  it("ignora NaN / no-finitos sin romper", () => {
    const base = { n: 1, sum: 1, sumsq: 1 };
    expect(updateArm(base, NaN)).toEqual(base);
    expect(updateArm(base, Infinity)).toEqual(base);
  });
  it("no muta la entrada", () => {
    const a = { n: 1, sum: 1, sumsq: 1 };
    updateArm(a, 2);
    expect(a).toEqual({ n: 1, sum: 1, sumsq: 1 });
  });
});

describe("armStats", () => {
  it("n=0 → media 0, se Infinito", () => {
    const s = armStats(null);
    expect(s.n).toBe(0);
    expect(s.se).toBe(Infinity);
  });
  it("calcula media y varianza correctas", () => {
    let a;
    [1, 2, 3, 4, 5].forEach((x) => { a = updateArm(a, x); });
    const s = armStats(a);
    expect(s.mean).toBe(3);
    expect(s.variance).toBeCloseTo(2.5, 5);
    expect(s.n).toBe(5);
  });
  it("n=1 devuelve varianza por defecto 1", () => {
    const a = updateArm(undefined, 5);
    expect(armStats(a).variance).toBe(1);
  });
});

describe("scoreArm", () => {
  it("brazos nuevos reciben +Infinity (exploración forzada)", () => {
    expect(scoreArm(null, 10)).toBe(Infinity);
    expect(scoreArm({ n: 1, sum: 2, sumsq: 4 }, 10)).toBe(Infinity);
  });
  it("ordena por media + bonus de confianza", () => {
    const good = { n: 10, sum: 20, sumsq: 45 }; // μ=2, var≈0.28
    const bad = { n: 10, sum: 5, sumsq: 3 };    // μ=0.5
    expect(scoreArm(good, 20)).toBeGreaterThan(scoreArm(bad, 20));
  });
});

describe("selectArm", () => {
  const P = [
    { id: "calma", int: "calma" },
    { id: "enfoque", int: "enfoque" },
    { id: "reset", int: "reset" },
  ];

  it("explora primero brazos sin datos", () => {
    const r = selectArm({}, P);
    expect(r.protocol).toBeDefined();
    expect(r.reason).toMatch(/explorando/);
  });
  it("elige el de mejor media con datos suficientes", () => {
    const state = {
      calma:   { n: 20, sum: 40, sumsq: 100 }, // μ=2
      enfoque: { n: 20, sum: 10, sumsq: 10 },  // μ=0.5
      reset:   { n: 20, sum: 20, sumsq: 40 },  // μ=1
    };
    const r = selectArm(state, P, { c: 0 }); // c=0 → puro greedy
    expect(r.protocol.id).toBe("calma");
  });
  it("devuelve null si no hay candidatos", () => {
    expect(selectArm({}, [])).toBeNull();
    expect(selectArm({}, null)).toBeNull();
  });
  it("con c alto, la exploración puede ganar a la explotación", () => {
    const state = {
      calma: { n: 100, sum: 200, sumsq: 410 }, // μ=2, muchos datos
      reset: { n: 3,   sum: 3,   sumsq: 3 },    // μ=1, pocos datos
    };
    const greedy = selectArm(state, [{ id: "calma" }, { id: "reset" }], { c: 0 });
    expect(greedy.protocol.id).toBe("calma");
    const explore = selectArm(state, [{ id: "calma" }, { id: "reset" }], { c: 5 });
    // Con c muy alto, reset (menos n) gana por el bonus
    expect(explore.protocol.id).toBe("reset");
  });
});

describe("armCI", () => {
  it("n<2 → CI ancho por defecto", () => {
    const ci = armCI({ n: 1, sum: 1, sumsq: 1 });
    expect(ci.width).toBe(4);
  });
  it("CI contiene la media", () => {
    let a;
    [1, 2, 3, 2, 1].forEach((x) => { a = updateArm(a, x); });
    const ci = armCI(a);
    expect(ci.lower).toBeLessThan(ci.mean);
    expect(ci.upper).toBeGreaterThan(ci.mean);
  });
  it("CI se encoge con más datos", () => {
    let small;
    [1, 2].forEach((x) => { small = updateArm(small, x); });
    let big;
    for (let i = 0; i < 50; i++) big = updateArm(big, 1 + (i % 2));
    expect(armCI(big).width).toBeLessThan(armCI(small).width);
  });
});

describe("topArms", () => {
  it("lista solo brazos con n>=2 ordenados por media", () => {
    const state = {
      a: { n: 5, sum: 10, sumsq: 25 },   // μ=2
      b: { n: 5, sum: 5, sumsq: 7 },     // μ=1
      c: { n: 1, sum: 3, sumsq: 9 },     // se excluye
      d: { n: 5, sum: 15, sumsq: 50 },   // μ=3
    };
    const top = topArms(state, 3);
    expect(top.map((t) => t.id)).toEqual(["d", "a", "b"]);
  });
});
