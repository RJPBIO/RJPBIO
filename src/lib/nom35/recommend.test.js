import { describe, it, expect } from "vitest";
import {
  intentForNivel,
  recommendProtocolForNivel,
  bannerForNivel,
  readStoredNom35Level,
  NIVEL_LABEL,
} from "./recommend";

const P = [
  { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma", dif: 1 },
  { id: 2, n: "Activación Cognitiva",   d: 120, int: "enfoque", dif: 1 },
  { id: 3, n: "Reset Ejecutivo",        d: 120, int: "reset", dif: 1 },
  { id: 6, n: "Grounded Steel",         d: 120, int: "calma", dif: 2 },
  { id: 15, n: "Suspiro Fisiológico",   d: 90,  int: "calma", dif: 1 },
  { id: 17, n: "NSDR 10 min",           d: 600, int: "reset", dif: 1 },
];

describe("intentForNivel", () => {
  it("nulo/bajo → null (sin intervención)", () => {
    expect(intentForNivel("nulo")).toBeNull();
    expect(intentForNivel("bajo")).toBeNull();
  });
  it("medio → reset", () => {
    expect(intentForNivel("medio")).toBe("reset");
  });
  it("alto / muy_alto → calma", () => {
    expect(intentForNivel("alto")).toBe("calma");
    expect(intentForNivel("muy_alto")).toBe("calma");
  });
  it("nivel desconocido → null", () => {
    expect(intentForNivel("x")).toBeNull();
    expect(intentForNivel(null)).toBeNull();
    expect(intentForNivel(undefined)).toBeNull();
  });
});

describe("recommendProtocolForNivel", () => {
  it("nulo/bajo → null", () => {
    expect(recommendProtocolForNivel("nulo", P)).toBeNull();
    expect(recommendProtocolForNivel("bajo", P)).toBeNull();
  });
  it("alto → calma de dif 1 más corta (Suspiro, 90s)", () => {
    const r = recommendProtocolForNivel("alto", P);
    expect(r).toBeTruthy();
    expect(r.int).toBe("calma");
    expect(r.dif).toBe(1);
    expect(r.d).toBe(90);
  });
  it("medio → reset de dif 1 más corta", () => {
    const r = recommendProtocolForNivel("medio", P);
    expect(r).toBeTruthy();
    expect(r.int).toBe("reset");
    expect(r.dif).toBe(1);
    expect(r.d).toBe(120);
  });
  it("cae a dif != 1 si no hay fáciles", () => {
    const only = [{ id: 99, n: "X", d: 120, int: "calma", dif: 3 }];
    const r = recommendProtocolForNivel("alto", only);
    expect(r?.id).toBe(99);
  });
  it("devuelve null si no hay protocolos de la intención", () => {
    const none = [{ id: 99, n: "X", d: 120, int: "enfoque", dif: 1 }];
    expect(recommendProtocolForNivel("alto", none)).toBeNull();
  });
  it("maneja input inválido sin lanzar", () => {
    expect(recommendProtocolForNivel("alto", null)).toBeNull();
    expect(recommendProtocolForNivel("alto", [])).toBeNull();
  });
});

describe("bannerForNivel", () => {
  it("nulo → null", () => {
    expect(bannerForNivel("nulo")).toBeNull();
  });
  it("alto → banner calma con label", () => {
    const b = bannerForNivel("alto");
    expect(b?.intent).toBe("calma");
    expect(b?.label).toBe(NIVEL_LABEL.alto);
    expect(b?.text).toMatch(/calma/i);
  });
  it("medio → banner reset", () => {
    const b = bannerForNivel("medio");
    expect(b?.intent).toBe("reset");
    expect(b?.text).toMatch(/reset/i);
  });
});

function mockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe("readStoredNom35Level", () => {
  it("devuelve null si no hay valor", () => {
    expect(readStoredNom35Level(mockStorage())).toBeNull();
  });
  it("devuelve nivel válido", () => {
    expect(readStoredNom35Level(mockStorage({ "bio-nom35-level": "alto" }))).toBe("alto");
  });
  it("descarta valor inválido", () => {
    expect(readStoredNom35Level(mockStorage({ "bio-nom35-level": "nope" }))).toBeNull();
  });
  it("es SSR-safe sin window", () => {
    expect(readStoredNom35Level(null)).toBeNull();
  });
  it("tolera storage roto", () => {
    const broken = { getItem: () => { throw new Error("denied"); } };
    expect(readStoredNom35Level(broken)).toBeNull();
  });
});
