import { describe, it, expect } from "vitest";
import { computeOrgIndex, buildCohortBenchmark, compareOrgToCohort } from "./bioSignalIndex";

describe("computeOrgIndex", () => {
  it("compone los señales disponibles (ponderado)", () => {
    const { index, components } = computeOrgIndex({
      nom35Level: "bajo", moodDeltaMean: 1, hrvDeltaMean: 0, engagementRate: 0.6,
    });
    // 0.35*80 + 0.25*75 + 0.25*50 + 0.15*60 = 68.25
    expect(index).toBe(68);
    expect(components.nom35).toBe(80);
  });

  it("re-normaliza cuando faltan componentes (solo nom35)", () => {
    expect(computeOrgIndex({ nom35Level: "alto" }).index).toBe(35);
  });

  it("nom35: menos riesgo → mayor índice", () => {
    expect(computeOrgIndex({ nom35Level: "nulo" }).index).toBeGreaterThan(
      computeOrgIndex({ nom35Level: "muy_alto" }).index
    );
  });

  it("agg vacío → null", () => {
    expect(computeOrgIndex({}).index).toBeNull();
    expect(computeOrgIndex(null).index).toBeNull();
  });
});

describe("buildCohortBenchmark — k-anon a nivel de org", () => {
  const entries = [
    ...Array.from({ length: 6 }, (_, i) => ({ cohort: "manufactura", index: 50 + i * 4 })), // 50..70
    ...Array.from({ length: 3 }, (_, i) => ({ cohort: "tech", index: 80 + i })),            // <5 → suprimida
  ];

  it("construye cohortes con masa suficiente y suprime las pequeñas", () => {
    const { cohorts, suppressed } = buildCohortBenchmark(entries, { minOrgs: 5 });
    expect(cohorts.manufactura).toBeDefined();
    expect(cohorts.manufactura.n).toBe(6);
    expect(cohorts.tech).toBeUndefined();
    expect(suppressed).toBe(1);
  });

  it("calcula media + cuartiles", () => {
    const { cohorts } = buildCohortBenchmark(entries, { minOrgs: 5 });
    expect(cohorts.manufactura.mean).toBe(60); // media de 50..70 step4
    expect(cohorts.manufactura.p25).toBeLessThan(cohorts.manufactura.p75);
  });
});

describe("compareOrgToCohort", () => {
  const { cohorts } = buildCohortBenchmark(
    Array.from({ length: 6 }, (_, i) => ({ cohort: "m", index: 50 + i * 4 })),
    { minOrgs: 5 }
  );

  it("org por encima del promedio → delta positivo + label", () => {
    const c = compareOrgToCohort(72, cohorts.m);
    expect(c.available).toBe(true);
    expect(c.delta).toBe(72 - cohorts.m.mean);
    expect(c.label).toMatch(/por encima/);
    expect(c.percentile).toBeGreaterThan(50);
  });

  it("org por debajo → label correspondiente", () => {
    expect(compareOrgToCohort(48, cohorts.m).label).toMatch(/por debajo/);
  });

  it("sin cohorte → no disponible", () => {
    expect(compareOrgToCohort(60, null).available).toBe(false);
  });
});
