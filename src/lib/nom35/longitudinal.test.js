import { describe, it, expect } from "vitest";
import {
  dominioNivel,
  compareNom35Snapshots,
  compareNom35Aggregates,
  splitByPeriod,
  DOMINIO_META,
  NIVEL_ORDER,
} from "./longitudinal";

describe("dominioNivel — clasificación por cut-points Anexo III", () => {
  it("carga (cuts 14,19,24,29) clasifica en los bordes correctos", () => {
    expect(dominioNivel("carga", 14).nivel).toBe("nulo");   // <= 14
    expect(dominioNivel("carga", 15).nivel).toBe("bajo");   // 15..19
    expect(dominioNivel("carga", 19).nivel).toBe("bajo");
    expect(dominioNivel("carga", 20).nivel).toBe("medio");  // 20..24
    expect(dominioNivel("carga", 24).nivel).toBe("medio");
    expect(dominioNivel("carga", 25).nivel).toBe("alto");   // 25..29
    expect(dominioNivel("carga", 30).nivel).toBe("muy_alto"); // > 29
  });

  it("devuelve null para dominio o score inválido", () => {
    expect(dominioNivel("no-existe", 10)).toBeNull();
    expect(dominioNivel("carga", "x")).toBeNull();
    expect(dominioNivel("carga", NaN)).toBeNull();
  });

  it("DOMINIO_META cubre los 10 dominios oficiales", () => {
    expect(DOMINIO_META).toHaveLength(10);
    expect(DOMINIO_META.map((d) => d.id)).toContain("violencia");
    expect(DOMINIO_META.every((d) => Array.isArray(d.cuts) && d.cuts.length === 4)).toBe(true);
  });
});

describe("compareNom35Snapshots — dirección de riesgo y nivel-shift", () => {
  // delta NEGATIVO = el puntaje bajó = el riesgo MEJORÓ.
  const baseline = {
    total: 120, // alto
    porDominio: { carga: 30, violencia: 5, condiciones: 8 },
  };
  const current = {
    total: 80, // medio
    porDominio: { carga: 18, violencia: 16, condiciones: 8.5 },
  };
  const cmp = compareNom35Snapshots(baseline, current);

  it("total: riesgo general mejora con shift de nivel", () => {
    expect(cmp.available).toBe(true);
    expect(cmp.total.delta).toBe(-40);
    expect(cmp.total.direction).toBe("improved");
    expect(cmp.total.nivelBaseline).toBe("alto");
    expect(cmp.total.nivelCurrent).toBe("medio");
    expect(cmp.total.nivelShift).toMatch(/Alto.*Medio/);
  });

  it("carga: mejora con shift muy_alto → bajo", () => {
    const carga = cmp.dominios.find((d) => d.id === "carga");
    expect(carga.delta).toBe(-12);
    expect(carga.direction).toBe("improved");
    expect(carga.nivelBaseline).toBe("muy_alto");
    expect(carga.nivelCurrent).toBe("bajo");
    expect(carga.nivelShift).toBeTruthy();
    expect(carga.reading).toContain("Carga de trabajo");
  });

  it("violencia: empeora con shift nulo → alto", () => {
    const v = cmp.dominios.find((d) => d.id === "violencia");
    expect(v.delta).toBe(11);
    expect(v.direction).toBe("worsened");
    expect(v.nivelBaseline).toBe("nulo");
    expect(v.nivelCurrent).toBe("alto");
  });

  it("condiciones: cambio dentro de banda muerta y mismo nivel → estable", () => {
    const c = cmp.dominios.find((d) => d.id === "condiciones");
    expect(c.delta).toBe(0.5);
    expect(c.direction).toBe("stable");
    expect(c.nivelShift).toBeNull();
  });

  it("summary agrupa y detecta mayores movimientos", () => {
    expect(cmp.summary.improved).toContain("carga");
    expect(cmp.summary.worsened).toContain("violencia");
    // dominios no tocados (0→0) son estables
    expect(cmp.summary.stable).toContain("jornada");
    expect(cmp.summary.biggestImprovement.id).toBe("carga");
    expect(cmp.summary.biggestWorsening.id).toBe("violencia");
  });

  it("headline en lenguaje natural sin jerga", () => {
    expect(cmp.headline).toMatch(/Riesgo general/);
    expect(cmp.headline).toMatch(/mejor/);
    expect(cmp.headline).not.toMatch(/z=|ln\(|sigma/i);
  });

  it("rechaza snapshots faltantes o inválidos", () => {
    expect(compareNom35Snapshots(null, current).available).toBe(false);
    expect(compareNom35Snapshots({ total: "x" }, current).available).toBe(false);
  });
});

describe("compareNom35Aggregates — respeta k-anon", () => {
  const baseAgg = { n: 10, suppressed: false, avgTotal: 120, avgPorDominio: { carga: 30 } };
  const curAgg = { n: 12, suppressed: false, avgTotal: 80, avgPorDominio: { carga: 18 } };

  it("compara dos agregados válidos e incluye N por período", () => {
    const cmp = compareNom35Aggregates(baseAgg, curAgg);
    expect(cmp.available).toBe(true);
    expect(cmp.n).toEqual({ baseline: 10, current: 12 });
    expect(cmp.total.direction).toBe("improved");
  });

  it("no compara si algún período está suprimido (N<5)", () => {
    const supp = { n: 3, suppressed: true, reason: "Muestra menor a N=5" };
    expect(compareNom35Aggregates(supp, curAgg).available).toBe(false);
    expect(compareNom35Aggregates(baseAgg, supp).available).toBe(false);
  });
});

describe("splitByPeriod — ventanas contiguas de 90 días", () => {
  const now = 1_700_000_000_000;
  const day = 86_400_000;
  const responses = [
    { completedAt: now - 10 * day, total: 80 },   // current
    { completedAt: now - 100 * day, total: 120 }, // baseline (90..180)
    { completedAt: now - 200 * day, total: 130 }, // fuera de rango
    { ts: now - 5 * day, total: 70 },             // current vía campo ts
    { completedAt: "fecha-invalida", total: 0 },  // ignorada
  ];

  it("bucketea por completedAt/ts y descarta fuera de rango e inválidas", () => {
    const { baseline, current } = splitByPeriod(responses, { now, periodDays: 90 });
    expect(current).toHaveLength(2);
    expect(baseline).toHaveLength(1);
    expect(baseline[0].total).toBe(120);
  });

  it("acepta lista vacía sin romper", () => {
    expect(splitByPeriod([], { now })).toEqual({ baseline: [], current: [] });
    expect(splitByPeriod(undefined, { now })).toEqual({ baseline: [], current: [] });
  });
});

describe("NIVEL_ORDER — invariante de severidad", () => {
  it("ordena de menor a mayor riesgo", () => {
    expect(NIVEL_ORDER.indexOf("nulo")).toBeLessThan(NIVEL_ORDER.indexOf("alto"));
    expect(NIVEL_ORDER.indexOf("alto")).toBeLessThan(NIVEL_ORDER.indexOf("muy_alto"));
  });
});
