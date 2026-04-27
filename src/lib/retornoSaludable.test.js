import { describe, it, expect } from "vitest";
import { computeRetornoSaludable, compareRetornoSaludable } from "./retornoSaludable";

const HOUR = 60 * 60 * 1000;

function s(userId, t) {
  return { userId, completedAt: new Date(t) };
}

describe("computeRetornoSaludable", () => {
  it("insufficient cuando hay <minK usuarios con ≥2 sesiones", () => {
    const sessions = [
      s("a", 0), s("a", HOUR * 8),
      s("b", 0), s("b", HOUR * 8),
      s("c", 0), s("c", HOUR * 8),
      s("d", 0), s("d", HOUR * 8),
    ];
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(true);
    expect(r.reason).toBe("k_anonymity");
    expect(r.uniqueUsers).toBe(4);
  });

  it("computa tasa correcta con 5 usuarios — todos saludables", () => {
    const sessions = [];
    for (const u of ["a", "b", "c", "d", "e"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 8)); // 8h después → saludable
    }
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(false);
    expect(r.healthyReturnRate).toBe(100);
    expect(r.evaluable).toBe(5);
    expect(r.healthy).toBe(5);
    expect(r.uniqueUsers).toBe(5);
  });

  it("una sesión que vuelve <6h después NO es saludable", () => {
    const sessions = [];
    for (const u of ["a", "b", "c", "d"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 8));
    }
    // Quinto usuario regresa a las 2h → no saludable
    sessions.push(s("e", 0));
    sessions.push(s("e", HOUR * 2));
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(false);
    expect(r.evaluable).toBe(5);
    expect(r.healthy).toBe(4);
    expect(r.healthyReturnRate).toBe(80);
  });

  it("la última sesión por usuario NO entra al denominador", () => {
    const sessions = [];
    for (const u of ["a", "b", "c", "d", "e"]) {
      sessions.push(s(u, 0));        // evaluable
      sessions.push(s(u, HOUR * 8)); // evaluable
      sessions.push(s(u, HOUR * 16)); // última, no evaluable
    }
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(false);
    // Cada usuario aporta 2 evaluables (1ª y 2ª), no la 3ª.
    expect(r.evaluable).toBe(10);
    expect(r.healthy).toBe(10);
  });

  it("usuarios con UNA sola sesión no cuentan ni hacen ruido", () => {
    const sessions = [
      // 5 usuarios con 2 sesiones cada uno
      s("a", 0), s("a", HOUR * 8),
      s("b", 0), s("b", HOUR * 8),
      s("c", 0), s("c", HOUR * 8),
      s("d", 0), s("d", HOUR * 8),
      s("e", 0), s("e", HOUR * 8),
      // 50 usuarios con 1 sesión: no contribuyen
      ...Array.from({ length: 50 }, (_, i) => s(`one-${i}`, HOUR * i)),
    ];
    const r = computeRetornoSaludable(sessions);
    expect(r.uniqueUsers).toBe(5);
    expect(r.evaluable).toBe(5);
  });

  it("sesiones sin userId o sin timestamp se descartan silenciosamente", () => {
    const sessions = [
      s("a", 0), s("a", HOUR * 8),
      s("b", 0), s("b", HOUR * 8),
      s("c", 0), s("c", HOUR * 8),
      s("d", 0), s("d", HOUR * 8),
      s("e", 0), s("e", HOUR * 8),
      { userId: null, completedAt: new Date() },
      { userId: "z", completedAt: "no-es-una-fecha" },
      { userId: "y", completedAt: undefined },
      null,
      undefined,
      "string",
    ];
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(false);
    expect(r.uniqueUsers).toBe(5);
  });

  it("acepta completedAt como number, ISO string o Date", () => {
    const t = Date.now();
    const sessions = [];
    for (const u of ["a", "b", "c", "d", "e"]) {
      sessions.push({ userId: u, completedAt: t });
      sessions.push({ userId: u, completedAt: new Date(t + HOUR * 8).toISOString() });
    }
    const r = computeRetornoSaludable(sessions);
    expect(r.insufficient).toBe(false);
    expect(r.healthy).toBe(5);
  });

  it("respeta gapMs custom (ej. 1h en vez de 6h)", () => {
    const sessions = [];
    for (const u of ["a", "b", "c", "d", "e"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 2)); // 2h después
    }
    const customGap = computeRetornoSaludable(sessions, { gapMs: HOUR });
    expect(customGap.healthyReturnRate).toBe(100);

    const defaultGap = computeRetornoSaludable(sessions);
    expect(defaultGap.healthyReturnRate).toBe(0);
  });

  it("respeta minK custom", () => {
    const sessions = [];
    for (const u of ["a", "b"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 8));
    }
    const r = computeRetornoSaludable(sessions, { minK: 2 });
    expect(r.insufficient).toBe(false);
    expect(r.uniqueUsers).toBe(2);
  });

  it("input no-array retorna insufficient gracefully", () => {
    expect(computeRetornoSaludable(null).insufficient).toBe(true);
    expect(computeRetornoSaludable(undefined).insufficient).toBe(true);
    expect(computeRetornoSaludable("no").insufficient).toBe(true);
  });

  it("redondea healthyReturnRate a 1 decimal", () => {
    const sessions = [];
    // 7 usuarios: 3 saludables, 4 no → 3/7 = 42.857 → 42.9
    for (const u of ["a", "b", "c"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 8));
    }
    for (const u of ["d", "e", "f", "g"]) {
      sessions.push(s(u, 0));
      sessions.push(s(u, HOUR * 2));
    }
    const r = computeRetornoSaludable(sessions);
    expect(r.healthyReturnRate).toBe(42.9);
  });
});

describe("compareRetornoSaludable", () => {
  it("calcula deltaPp cuando ambos periodos son suficientes", () => {
    const mkPeriod = (rate) => {
      // Construye un periodo con healthyReturnRate aprox `rate%`.
      // 10 evaluables → rate/10 saludables.
      const out = [];
      const healthy = Math.round((rate / 100) * 10);
      const users = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        out.push(s(u, 0));
        out.push(s(u, i < healthy ? HOUR * 8 : HOUR * 2));
      }
      return out;
    };
    const cmp = compareRetornoSaludable(mkPeriod(80), mkPeriod(60));
    expect(cmp.current.healthyReturnRate).toBe(80);
    expect(cmp.prior.healthyReturnRate).toBe(60);
    expect(cmp.deltaPp).toBe(20);
  });

  it("deltaPp=null si alguno es insufficient", () => {
    const cmp = compareRetornoSaludable(
      [s("a", 0), s("a", HOUR * 8)],
      []
    );
    expect(cmp.deltaPp).toBeNull();
  });
});
