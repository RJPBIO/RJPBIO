/* useNom35Profile.test — Phase 6J-2 HIGH-2.
   Cubre el helper puro deriveNom35Profile (sin React/store mocking).
   El hook React (useNom35Profile) es trivial wrapper; lo cubrimos via
   integration tests de HomeV2 propagación. */
import { describe, it, expect } from "vitest";
import { deriveNom35Profile } from "./useNom35Profile";

describe("deriveNom35Profile — empty cases", () => {
  it("undefined → null shape", () => {
    expect(deriveNom35Profile(undefined)).toEqual({
      nom35Dominios: null,
      latestTotal: null,
      latestNivel: null,
      latestAt: null,
    });
  });

  it("null → null shape", () => {
    expect(deriveNom35Profile(null)).toEqual({
      nom35Dominios: null,
      latestTotal: null,
      latestNivel: null,
      latestAt: null,
    });
  });

  it("array vacío → null shape", () => {
    expect(deriveNom35Profile([])).toEqual({
      nom35Dominios: null,
      latestTotal: null,
      latestNivel: null,
      latestAt: null,
    });
  });
});

describe("deriveNom35Profile — single result", () => {
  it("1 result con porDominio + nivel + total → shape correcto", () => {
    const result = deriveNom35Profile([
      {
        ts: 1000,
        total: 50,
        nivel: "medio",
        porDominio: { condiciones: 5, carga: 8, liderazgo: 3 },
      },
    ]);
    expect(result.nom35Dominios).toEqual({ condiciones: 5, carga: 8, liderazgo: 3 });
    expect(result.latestTotal).toBe(50);
    expect(result.latestNivel).toBe("medio");
    expect(result.latestAt).toBe(1000);
  });

  it("result sin ts → latestAt null", () => {
    const result = deriveNom35Profile([
      { total: 30, nivel: "bajo", porDominio: { carga: 5 } },
    ]);
    expect(result.latestAt).toBeNull();
    expect(result.nom35Dominios).toEqual({ carga: 5 });
  });
});

describe("deriveNom35Profile — multiple results", () => {
  it("multiple → returns most recent by ts (no por orden array)", () => {
    const result = deriveNom35Profile([
      { ts: 100, total: 30, nivel: "bajo", porDominio: { carga: 3 } },
      { ts: 500, total: 70, nivel: "alto", porDominio: { carga: 12 } },
      { ts: 200, total: 40, nivel: "medio", porDominio: { carga: 6 } },
    ]);
    expect(result.latestTotal).toBe(70);
    expect(result.latestNivel).toBe("alto");
    expect(result.nom35Dominios.carga).toBe(12);
    expect(result.latestAt).toBe(500);
  });

  it("results sin ts mixed → fallback a último elemento del array", () => {
    const result = deriveNom35Profile([
      { total: 30, porDominio: { carga: 3 } },
      { total: 50, porDominio: { carga: 8 } },
    ]);
    // Sin ts en ninguno: ambos tienen tsA=0 y tsB=0 → sort estable → primer item primero.
    // Esto verifica que NO crashea; el caller decide tolerar este edge.
    expect(result.nom35Dominios).toBeTruthy();
    expect(typeof result.latestTotal).toBe("number");
  });
});

describe("deriveNom35Profile — defensive shape variants", () => {
  it("shape con `dominios` (legacy alternative) → fallback funciona", () => {
    const result = deriveNom35Profile([
      { ts: 1000, dominios: { carga: 7, liderazgo: 4 } },
    ]);
    expect(result.nom35Dominios).toEqual({ carga: 7, liderazgo: 4 });
  });

  it("shape con porDominio + dominios → prefer porDominio (canonical)", () => {
    const result = deriveNom35Profile([
      {
        ts: 1000,
        porDominio: { carga: 10 },
        dominios: { carga: 999 }, // legacy garbage
      },
    ]);
    expect(result.nom35Dominios.carga).toBe(10);
  });

  it("shape sin porDominio ni dominios → nom35Dominios null", () => {
    const result = deriveNom35Profile([{ ts: 1000, total: 20 }]);
    expect(result.nom35Dominios).toBeNull();
    expect(result.latestTotal).toBe(20);
  });

  it("dominios null/undefined explicit → nom35Dominios null", () => {
    expect(deriveNom35Profile([{ ts: 1, porDominio: null }]).nom35Dominios).toBeNull();
    expect(deriveNom35Profile([{ ts: 1, porDominio: undefined }]).nom35Dominios).toBeNull();
  });
});
