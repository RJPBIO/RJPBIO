import { describe, it, expect } from "vitest";
import {
  csvEscape, rowsToCsv, sanitizeFilename,
  buildNom35CsvLines, buildNom35CsvExport,
} from "./nom35-csv";

describe("csvEscape", () => {
  it("strings simples sin escape", () => {
    expect(csvEscape("hola")).toBe("hola");
    expect(csvEscape("123")).toBe("123");
  });

  it("escape comma → wrap quotes", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
  });

  it("escape newline → wrap quotes", () => {
    expect(csvEscape("a\nb")).toBe('"a\nb"');
    expect(csvEscape("a\rb")).toBe('"a\rb"');
  });

  it("escape quote → wrap + double quotes", () => {
    expect(csvEscape('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("null/undefined → empty string", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("number → string", () => {
    expect(csvEscape(42)).toBe("42");
    expect(csvEscape(0)).toBe("0");
  });
});

describe("rowsToCsv", () => {
  it("filas a CSV con CRLF separators", () => {
    const csv = rowsToCsv([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(csv).toBe("a,b,c\r\n1,2,3");
  });

  it("filas con escape correcto", () => {
    const csv = rowsToCsv([
      ["org, name", "count"],
      ['name "test"', 5],
    ]);
    expect(csv).toBe('"org, name",count\r\n"name ""test""",5');
  });

  it("filas vacías producen línea vacía", () => {
    const csv = rowsToCsv([["a"], [], ["b"]]);
    expect(csv).toBe("a\r\n\r\nb");
  });

  it("non-array filas (defensive) → string vacío", () => {
    const csv = rowsToCsv([["a"], null, ["b"]]);
    expect(csv).toBe("a\r\n\r\nb");
  });
});

describe("sanitizeFilename", () => {
  it("preserva ASCII alfanuméricos + guiones", () => {
    expect(sanitizeFilename("acme-corp")).toBe("acme-corp");
    expect(sanitizeFilename("ACME_CORP_2026")).toBe("ACME_CORP_2026");
  });

  it("reemplaza espacios y especiales con underscore", () => {
    expect(sanitizeFilename("Acme Corp / Inc.")).toBe("Acme_Corp_Inc");
  });

  it("acentos → ASCII via NFKD normalize", () => {
    // Combining marks se eliminan, base char queda
    expect(sanitizeFilename("Empresa Mexicó S.A.")).toBe("Empresa_Mexico_S_A");
  });

  it("trim underscores leading/trailing", () => {
    expect(sanitizeFilename("__hello__")).toBe("hello");
  });

  it("colapsa underscores múltiples", () => {
    expect(sanitizeFilename("a   b   c")).toBe("a_b_c");
  });

  it("cap a 64 chars", () => {
    const long = "a".repeat(100);
    expect(sanitizeFilename(long).length).toBe(64);
  });

  it("null/undefined → fallback", () => {
    expect(sanitizeFilename(null)).toBe("Organizacion");
    expect(sanitizeFilename(undefined)).toBe("Organizacion");
    expect(sanitizeFilename("")).toBe("Organizacion");
  });

  it("nombres solo con caracteres especiales → fallback", () => {
    expect(sanitizeFilename("///")).toBe("Organizacion");
  });
});

describe("buildNom35CsvLines — header metadata", () => {
  it("incluye título + organización + generated + período", () => {
    const lines = buildNom35CsvLines({
      orgName: "Acme",
      generatedAt: new Date("2026-04-26T12:00:00Z"),
      totalSeats: 10,
      totalResponses: 7,
    });
    expect(lines[0]).toEqual(["BIO-IGNICIÓN — NOM-035 STPS-2018 · Informe Agregado"]);
    expect(lines.find((l) => l[0] === "Organización")).toEqual(["Organización", "Acme"]);
    expect(lines.find((l) => l[0] === "Total miembros")).toEqual(["Total miembros", 10]);
    expect(lines.find((l) => l[0] === "Total respuestas")).toEqual(["Total respuestas", 7]);
    expect(lines.find((l) => l[0] === "Cobertura %")).toEqual(["Cobertura %", 70]);
  });

  it("cobertura 0 cuando totalSeats es 0", () => {
    const lines = buildNom35CsvLines({ totalSeats: 0, totalResponses: 0 });
    expect(lines.find((l) => l[0] === "Cobertura %")).toEqual(["Cobertura %", 0]);
  });

  it("acepta string ISO en generatedAt", () => {
    const lines = buildNom35CsvLines({ generatedAt: "2026-04-26T12:00:00Z" });
    expect(lines.find((l) => l[0] === "Generado")).toEqual(["Generado", "2026-04-26T12:00:00Z"]);
  });
});

describe("buildNom35CsvLines — supresión por privacy", () => {
  it("agg.suppressed=true → solo metadata + razón, sin datos", () => {
    const lines = buildNom35CsvLines({
      orgName: "TinyOrg",
      totalResponses: 3,
      agg: { suppressed: true, reason: "Muestra menor a k=5" },
    });
    const flat = lines.map((l) => l[0]);
    expect(flat).toContain("Datos suprimidos por privacidad");
    expect(flat).not.toContain("RESUMEN GLOBAL");
    expect(flat).not.toContain("DISTRIBUCIÓN DE NIVELES");
  });

  it("razón default si no se provee", () => {
    const lines = buildNom35CsvLines({ agg: { suppressed: true } });
    const razon = lines.find((l) => l[0] === "Razón");
    expect(razon[1]).toMatch(/k=5/);
  });
});

describe("buildNom35CsvLines — datos visibles", () => {
  const fullAgg = {
    suppressed: false,
    avgTotal: 42,
    nivelPromedio: "medio",
    nivelCounts: { nulo: 5, bajo: 10, medio: 3, alto: 2, muy_alto: 0 },
    porDominioAltoRiesgo: [
      { dominio: "violencia", avg: 65 },
      { dominio: "carga_trabajo", avg: 50 },
    ],
  };

  it("incluye RESUMEN GLOBAL con avgTotal + nivelPromedio", () => {
    const lines = buildNom35CsvLines({ agg: fullAgg, totalResponses: 20 });
    expect(lines.find((l) => l[0] === "Puntaje promedio")).toEqual(["Puntaje promedio", 42]);
    expect(lines.find((l) => l[0] === "Nivel promedio")).toEqual(["Nivel promedio", "medio"]);
  });

  it("DISTRIBUCIÓN DE NIVELES en orden fijo nulo→muy_alto", () => {
    const lines = buildNom35CsvLines({ agg: fullAgg, totalResponses: 20 });
    const startIdx = lines.findIndex((l) => l[0] === "Nivel" && l[1] === "Conteo");
    expect(lines[startIdx + 1][0]).toBe("nulo");
    expect(lines[startIdx + 2][0]).toBe("bajo");
    expect(lines[startIdx + 3][0]).toBe("medio");
    expect(lines[startIdx + 4][0]).toBe("alto");
    expect(lines[startIdx + 5][0]).toBe("muy_alto");
  });

  it("porcentajes calculados sobre totalResponses", () => {
    const lines = buildNom35CsvLines({ agg: fullAgg, totalResponses: 20 });
    // nulo: 5/20 = 25%, bajo: 10/20 = 50%
    const nuloRow = lines.find((l) => l[0] === "nulo");
    expect(nuloRow).toEqual(["nulo", 5, "25%"]);
    const bajoRow = lines.find((l) => l[0] === "bajo");
    expect(bajoRow).toEqual(["bajo", 10, "50%"]);
  });

  it("DOMINIOS sección presente cuando hay porDominioAltoRiesgo", () => {
    const lines = buildNom35CsvLines({ agg: fullAgg, totalResponses: 20 });
    expect(lines.find((l) => l[0] === "DOMINIOS POR RIESGO PROMEDIO (alto a bajo)")).toBeTruthy();
    // Los dominios pueden o no resolver a labels conocidos según items.js
    const violRow = lines.find((l) => l[0] === "violencia");
    expect(violRow).toBeTruthy();
    expect(violRow[3]).toBe(65); // avg en posición 3
  });

  it("DOMINIOS sección OMITIDA cuando porDominioAltoRiesgo está vacío", () => {
    const lines = buildNom35CsvLines({
      agg: { ...fullAgg, porDominioAltoRiesgo: [] },
      totalResponses: 20,
    });
    expect(lines.find((l) => l[0] === "DOMINIOS POR RIESGO PROMEDIO (alto a bajo)")).toBeFalsy();
  });

  it("nivelCounts ausentes → 0 (defensive)", () => {
    const lines = buildNom35CsvLines({
      agg: { ...fullAgg, nivelCounts: {} },
      totalResponses: 20,
    });
    const nuloRow = lines.find((l) => l[0] === "nulo");
    expect(nuloRow).toEqual(["nulo", 0, "0%"]);
  });
});

describe("buildNom35CsvLines — privacy footer", () => {
  it("siempre incluye nota de k-anonymity", () => {
    const lines = buildNom35CsvLines({});
    const privacyRow = lines.find((l) => l[0] === "Privacidad");
    expect(privacyRow[1]).toMatch(/k≥5|k-anonymity/);
  });

  it("incluye 'Generado por' si se provee", () => {
    const lines = buildNom35CsvLines({ generatedBy: "admin@acme.com" });
    expect(lines.find((l) => l[0] === "Generado por")).toEqual(["Generado por", "admin@acme.com"]);
  });

  it("OMITE 'Generado por' si no se provee", () => {
    const lines = buildNom35CsvLines({});
    expect(lines.find((l) => l[0] === "Generado por")).toBeFalsy();
  });
});

describe("buildNom35CsvExport — wrapper end-to-end", () => {
  it("retorna {csv, filename}", () => {
    const r = buildNom35CsvExport({
      orgName: "Acme",
      generatedAt: new Date("2026-04-26T12:00:00Z"),
      totalSeats: 10,
      totalResponses: 5,
      agg: { suppressed: true },
    });
    expect(r.csv).toBeTruthy();
    expect(r.filename).toBe("nom35-aggregate-Acme-2026-04-26.csv");
  });

  it("CSV inicia con BOM UTF-8", () => {
    const r = buildNom35CsvExport({ orgName: "X" });
    // El BOM es U+FEFF, codepoint 65279
    expect(r.csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it("filename sanitized — caracteres especiales en orgName", () => {
    const r = buildNom35CsvExport({
      orgName: "Acme/Corp & Co.",
      generatedAt: new Date("2026-04-26"),
    });
    expect(r.filename).toMatch(/^nom35-aggregate-[\w]+-2026-04-26\.csv$/);
    expect(r.filename).not.toContain("/");
    expect(r.filename).not.toContain("&");
    // El "." final viene de ".csv" extensión — verificamos que el orgName
    // sanitizado NO tiene puntos internos.
    const orgPart = r.filename.replace(/^nom35-aggregate-/, "").replace(/-\d{4}-\d{2}-\d{2}\.csv$/, "");
    expect(orgPart).not.toContain(".");
  });

  it("filename usa fecha de generatedAt si provista", () => {
    const r = buildNom35CsvExport({
      orgName: "X",
      generatedAt: "2025-12-31T23:59:59Z",
    });
    expect(r.filename).toContain("2025-12-31");
  });

  it("CSV contiene CRLF entre filas", () => {
    const r = buildNom35CsvExport({
      orgName: "Acme",
      totalResponses: 0,
      agg: { suppressed: true },
    });
    // Debería haber al menos varios CRLF
    const crlfCount = (r.csv.match(/\r\n/g) || []).length;
    expect(crlfCount).toBeGreaterThan(5);
  });

  it("CSV con orgName que contiene comma → escaped en organización field", () => {
    const r = buildNom35CsvExport({ orgName: "Acme, Inc." });
    expect(r.csv).toContain('"Acme, Inc."');
  });
});
