import { describe, it, expect } from "vitest";
import { itemScore, scoreAnswers, computeNivel, aggregateScores, recomendacionPorNivel } from "./scoring";
import { ITEMS } from "./items";

describe("itemScore", () => {
  it("devuelve el valor tal cual para ítem normal", () => {
    expect(itemScore(0, false)).toBe(0);
    expect(itemScore(4, false)).toBe(4);
  });
  it("invierte para ítem reverso", () => {
    expect(itemScore(0, true)).toBe(4);
    expect(itemScore(4, true)).toBe(0);
    expect(itemScore(2, true)).toBe(2);
  });
  it("devuelve null para valores inválidos", () => {
    expect(itemScore(-1, false)).toBe(null);
    expect(itemScore(5, false)).toBe(null);
    expect(itemScore("x", false)).toBe(null);
    expect(itemScore(undefined, false)).toBe(null);
  });
});

describe("computeNivel", () => {
  it("mapea umbrales oficiales", () => {
    expect(computeNivel(0).nivel).toBe("nulo");
    expect(computeNivel(49).nivel).toBe("nulo");
    expect(computeNivel(50).nivel).toBe("bajo");
    expect(computeNivel(69).nivel).toBe("bajo");
    expect(computeNivel(70).nivel).toBe("medio");
    expect(computeNivel(89).nivel).toBe("medio");
    expect(computeNivel(90).nivel).toBe("alto");
    expect(computeNivel(139).nivel).toBe("alto");
    expect(computeNivel(140).nivel).toBe("muy_alto");
    expect(computeNivel(999).nivel).toBe("muy_alto");
  });
});

describe("scoreAnswers", () => {
  it("sin respuestas: total 0, nivel nulo, 72 faltantes", () => {
    const r = scoreAnswers({});
    expect(r.total).toBe(0);
    expect(r.completedCount).toBe(0);
    expect(r.missingCount).toBe(72);
    expect(r.nivel).toBe("nulo");
  });

  it("todas con valor 0 (ítems normales) e invertidas: marca sesgado a riesgo medio/alto", () => {
    // value=0 significa "Nunca". Para ítems reverse=true (positivos),
    // "nunca" = peor escenario => score máx.
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, 0]));
    const r = scoreAnswers(answers);
    expect(r.completedCount).toBe(72);
    // Suma de scores = 4 * número de ítems reversos
    const reversos = ITEMS.filter((i) => i.reverse).length;
    expect(r.total).toBe(reversos * 4);
  });

  it("todas con valor 4 (Siempre): total = 4 × no-reversos (máximo riesgo)", () => {
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, 4]));
    const r = scoreAnswers(answers);
    const noReversos = ITEMS.filter((i) => !i.reverse).length;
    expect(r.total).toBe(noReversos * 4);
    expect(r.nivel).toBe("muy_alto");
  });

  it("el agregado por dominio suma exactamente lo de sus ítems", () => {
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, 2]));
    const r = scoreAnswers(answers);
    // value=2 → score=2 para normales y 2 para reversos (4-2)
    // por dominio: 2 * n_items_del_dominio
    const cargaCount = ITEMS.filter((i) => i.dominio === "carga").length;
    expect(r.porDominio.carga).toBe(2 * cargaCount);
  });

  it("asigna categoría correcta a cada dominio", () => {
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, 1]));
    const r = scoreAnswers(answers);
    // condiciones pertenece a "ambiente"
    expect(r.porCategoria.ambiente).toBeGreaterThan(0);
    expect(r.porCategoria.actividad).toBeGreaterThan(0);
  });

  it("ignora ítems con valores inválidos", () => {
    const answers = { 1: 99, 2: "x", 3: 2 };
    const r = scoreAnswers(answers);
    expect(r.completedCount).toBe(1);
    expect(r.missingCount).toBe(71);
  });
});

describe("recomendacionPorNivel", () => {
  it("da texto específico por nivel", () => {
    expect(recomendacionPorNivel("nulo")).toMatch(/sin riesgo/i);
    expect(recomendacionPorNivel("medio")).toMatch(/reset/i);
    expect(recomendacionPorNivel("alto")).toMatch(/calma/i);
    expect(recomendacionPorNivel("muy_alto")).toMatch(/clínica|valoración/i);
  });
});

describe("aggregateScores", () => {
  it("suprime cuando N < minN (privacidad)", () => {
    const responses = Array.from({ length: 3 }, () => scoreAnswers({}));
    const agg = aggregateScores(responses, { minN: 5 });
    expect(agg.suppressed).toBe(true);
    expect(agg.n).toBe(3);
  });

  it("promedia totales y cuenta niveles cuando N >= minN", () => {
    // Todas las respuestas = 0 ("Nunca"). Para ítems normales score=0;
    // para reversos score=4. Así el total determinístico = 4 × reversos.
    const answers = Object.fromEntries(ITEMS.map((i) => [i.id, 0]));
    const reversos = ITEMS.filter((i) => i.reverse).length;
    const one = scoreAnswers(answers);
    expect(one.total).toBe(reversos * 4);
    const responses = Array.from({ length: 6 }, () => one);
    const agg = aggregateScores(responses, { minN: 5 });
    expect(agg.suppressed).toBe(false);
    expect(agg.n).toBe(6);
    expect(agg.avgTotal).toBe(reversos * 4);
    const total = Object.values(agg.nivelCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(6);
  });
});
