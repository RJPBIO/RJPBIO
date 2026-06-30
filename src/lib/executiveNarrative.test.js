import { describe, it, expect } from "vitest";
import { buildExecutiveNarrative } from "./executiveNarrative";

const baseReport = {
  org: { name: "Acme MX", activeMembers: 23 },
  period: { days: 90 },
  kpis: {
    activeMembers: 23,
    sessionsTotal: 410,
    sessionsPerActiveMember: 17.8,
    nom35Level: "medio",
    moodDeltaMean: 0.42,
    programCompletionRate: 0.64,
  },
  nom35: {
    summary: {
      nivelPromedio: "medio",
      porDominioAltoRiesgo: [
        { dominio: "carga", avg: 22.1 },
        { dominio: "violencia", avg: 18.3 },
      ],
    },
  },
  topProtocols: [
    { protocolId: "Reset Ejecutivo", meanLift: 0.5, significant: true },
    { protocolId: "Pulse Shift", meanLift: 0.3, significant: true },
    { protocolId: "Ruido", meanLift: 0.1, significant: false },
  ],
  engagement: { activationRate: 0.42 },
  correlation: { suppressed: false, interpretation: "moderate", pearsonR: -0.38 },
};

const titles = (n) => n.sections.map((s) => s.title);
const sectionBody = (n, t) => n.sections.find((s) => s.title === t)?.body || "";

describe("buildExecutiveNarrative", () => {
  it("resumen incluye actividad y nivel de riesgo", () => {
    const n = buildExecutiveNarrative(baseReport);
    expect(n.generatedBy).toBe("deterministic");
    expect(n.summary).toMatch(/23 personas activas/);
    expect(n.summary).toMatch(/410 sesiones/);
    expect(n.summary).toMatch(/17\.8 por persona/);
    expect(n.summary).toMatch(/nivel Medio/);
  });

  it("'Qué funcionó' nombra protocolos significativos + finalización", () => {
    const n = buildExecutiveNarrative(baseReport);
    const body = sectionBody(n, "Qué funcionó");
    expect(body).toMatch(/Reset Ejecutivo y Pulse Shift/);
    expect(body).toMatch(/64%/);
  });

  it("'A vigilar' nombra dominios de mayor riesgo + activación baja", () => {
    const n = buildExecutiveNarrative(baseReport);
    const body = sectionBody(n, "A vigilar");
    expect(body).toMatch(/Carga de trabajo y Violencia laboral/);
    expect(body).toMatch(/42%/);
  });

  it("incluye correlación cuando no está suprimida y no es nula", () => {
    const n = buildExecutiveNarrative(baseReport);
    const body = sectionBody(n, "Correlación");
    expect(body).toMatch(/moderada/);
    expect(body).toMatch(/r=-0\.38/);
    expect(body).toMatch(/no.*causal/i);
  });

  it("'Próximos 90 días' prioriza el dominio top + reaplicar NOM-035", () => {
    const n = buildExecutiveNarrative(baseReport);
    const body = sectionBody(n, "Próximos 90 días");
    expect(body).toMatch(/priorizar intervención en Carga de trabajo/);
    expect(body).toMatch(/reaplicar NOM-035/);
  });

  it("sin protocolos significativos → fallback honesto", () => {
    const r = { ...baseReport, topProtocols: [{ protocolId: "x", significant: false }] };
    const body = sectionBody(buildExecutiveNarrative(r), "Qué funcionó");
    expect(body).toMatch(/no hay protocolos con un efecto estad/i);
  });

  it("activación alta → recomienda sostener, no reforzar adherencia", () => {
    const r = { ...baseReport, engagement: { activationRate: 0.82 } };
    const n = buildExecutiveNarrative(r);
    expect(sectionBody(n, "A vigilar")).not.toMatch(/activación semanal/);
    expect(sectionBody(n, "Próximos 90 días")).toMatch(/sostener el uso/);
  });

  it("reporte suprimido (k<5) → resumen explicativo, sin secciones", () => {
    const n = buildExecutiveNarrative({ suppressed: true, message: "Requiere 5 miembros." });
    expect(n.summary).toMatch(/Requiere 5 miembros/);
    expect(n.sections).toEqual([]);
  });

  it("no rompe con reporte vacío", () => {
    const n = buildExecutiveNarrative(null);
    expect(n.sections).toEqual([]);
    expect(typeof n.summary).toBe("string");
  });
});
