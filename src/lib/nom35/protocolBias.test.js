import { describe, it, expect } from "vitest";
import {
  topRiskDomain,
  protocolBiasFromDomain,
  applyBiasToScore,
  MAX_BY_DOMAIN,
  DOMAIN_BIAS,
} from "./protocolBias";

describe("MAX_BY_DOMAIN", () => {
  it("cubre los 10 dominios NOM-035", () => {
    expect(Object.keys(MAX_BY_DOMAIN).sort()).toEqual(
      [
        "carga",
        "condiciones",
        "falta_control",
        "interferencia",
        "jornada",
        "liderazgo",
        "pertenencia",
        "reconocimiento",
        "relaciones",
        "violencia",
      ].sort()
    );
  });
  it("todos los máximos son múltiplos de 4", () => {
    for (const [, v] of Object.entries(MAX_BY_DOMAIN)) {
      expect(v % 4).toBe(0);
    }
  });
});

describe("topRiskDomain", () => {
  it("devuelve null con entrada inválida", () => {
    expect(topRiskDomain(null)).toBeNull();
    expect(topRiskDomain(undefined)).toBeNull();
    expect(topRiskDomain("xxx")).toBeNull();
  });
  it("elige por riesgo relativo, no absoluto", () => {
    // carga máximo mucho mayor que condiciones
    // score absoluto mayor en carga, pero relativo mayor en condiciones
    const porDominio = {
      condiciones: MAX_BY_DOMAIN.condiciones * 0.9, // 90%
      carga: MAX_BY_DOMAIN.carga * 0.4,             // 40%
    };
    const top = topRiskDomain(porDominio);
    expect(top.dominio).toBe("condiciones");
    expect(top.relativeRisk).toBeCloseTo(0.9, 2);
  });
  it("ignora dominios desconocidos", () => {
    const top = topRiskDomain({ inventado: 999, carga: 4 });
    expect(top.dominio).toBe("carga");
  });
  it("ignora scores no numéricos", () => {
    const top = topRiskDomain({ carga: "NaN", jornada: 12 });
    expect(top.dominio).toBe("jornada");
  });
});

describe("protocolBiasFromDomain", () => {
  it("null si no hay dominio", () => {
    expect(protocolBiasFromDomain(null)).toBeNull();
  });
  it("null si el top está por debajo del umbral", () => {
    const porDominio = { carga: MAX_BY_DOMAIN.carga * 0.2 };
    expect(protocolBiasFromDomain(porDominio)).toBeNull();
  });
  it("violencia alta marca urgent + externalReferral", () => {
    const porDominio = { violencia: MAX_BY_DOMAIN.violencia * 0.8 };
    const b = protocolBiasFromDomain(porDominio);
    expect(b.dominio).toBe("violencia");
    expect(b.urgent).toBe(true);
    expect(b.externalReferral).toBe(true);
    expect(b.intent).toBe("calma");
    expect(b.weight).toBe(1.0);
  });
  it("carga alta sugiere reset", () => {
    const porDominio = { carga: MAX_BY_DOMAIN.carga * 0.7 };
    const b = protocolBiasFromDomain(porDominio);
    expect(b.dominio).toBe("carga");
    expect(b.intent).toBe("reset");
    expect(b.urgent).toBe(false);
  });
  it("reconocimiento bajo sugiere energia", () => {
    const porDominio = { reconocimiento: MAX_BY_DOMAIN.reconocimiento * 0.6 };
    const b = protocolBiasFromDomain(porDominio);
    expect(b.intent).toBe("energia");
  });
  it("respeta threshold personalizado", () => {
    const porDominio = { carga: MAX_BY_DOMAIN.carga * 0.25 };
    expect(protocolBiasFromDomain(porDominio)).toBeNull();
    expect(protocolBiasFromDomain(porDominio, { threshold: 0.2 })).not.toBeNull();
  });
  it("incluye label legible del dominio", () => {
    const porDominio = { jornada: MAX_BY_DOMAIN.jornada * 0.8 };
    const b = protocolBiasFromDomain(porDominio);
    expect(b.dominioLabel).toMatch(/jornada/i);
  });
});

describe("applyBiasToScore", () => {
  const bias = { intent: "calma", weight: 0.6 };
  it("devuelve base si falta bias o protocol", () => {
    expect(applyBiasToScore(50, null, bias)).toBe(50);
    expect(applyBiasToScore(50, { int: "calma" }, null)).toBe(50);
  });
  it("suma cuando coincide la intención", () => {
    expect(applyBiasToScore(50, { int: "calma" }, bias)).toBeCloseTo(62);
  });
  it("resta cuando va en contra", () => {
    expect(applyBiasToScore(50, { int: "energia" }, bias)).toBeCloseTo(44);
  });
  it("bias con weight 1.0 domina fuerte", () => {
    const strong = { intent: "calma", weight: 1.0 };
    expect(applyBiasToScore(50, { int: "calma" }, strong)).toBe(70);
    expect(applyBiasToScore(50, { int: "energia" }, strong)).toBe(40);
  });
});

describe("DOMAIN_BIAS integrity", () => {
  it("cada dominio tiene intent válido", () => {
    const valid = new Set(["calma", "reset", "energia", "enfoque"]);
    for (const [, v] of Object.entries(DOMAIN_BIAS)) {
      expect(valid.has(v.intent)).toBe(true);
    }
  });
  it("cada dominio tiene weight entre 0 y 1", () => {
    for (const [, v] of Object.entries(DOMAIN_BIAS)) {
      expect(v.weight).toBeGreaterThan(0);
      expect(v.weight).toBeLessThanOrEqual(1);
    }
  });
  it("violencia marca urgent", () => {
    expect(DOMAIN_BIAS.violencia.urgent).toBe(true);
  });
});
