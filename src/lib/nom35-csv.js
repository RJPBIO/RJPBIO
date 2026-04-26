/* ═══════════════════════════════════════════════════════════════
   NOM-035 CSV builder — pure function, testeable.
   ═══════════════════════════════════════════════════════════════
   Genera CSV en formato informe con secciones múltiples para auditors
   STPS / compliance officers. Extraído del route handler para tests
   isolated.

   Output: { csv, filename } — string CSV completo (UTF-8 BOM-prefixed)
   + filename sugerido sanitizado.

   Privacy: respeta la supresión k≥5 que aggregateScores marca via
   { suppressed: true, reason }. Si suppressed, el CSV NO incluye datos
   agregados, sólo metadata + razón legal de supresión.

   CSV escaping: quotes dobladas + wrap de strings con commas/newlines/
   quotes. Soporta nombres de org con caracteres especiales sin romper
   el parsing en Excel/scripts.
   ═══════════════════════════════════════════════════════════════ */

import { DOMINIOS, CATEGORIAS } from "./nom35/items";

const NIVELES_ORDER = ["nulo", "bajo", "medio", "alto", "muy_alto"];

export function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows) {
  return rows
    .map((r) => (Array.isArray(r) ? r.map(csvEscape).join(",") : ""))
    .join("\r\n");
}

/**
 * Sanitiza el filename para Content-Disposition. Reemplaza chars
 * problemáticos en filesystems (Win/Mac/Linux) y limita largo.
 */
export function sanitizeFilename(name) {
  return String(name || "Organizacion")
    .normalize("NFKD")
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64) || "Organizacion";
}

/**
 * Construye las filas del informe CSV (sin BOM, sin join).
 * @returns {Array<Array>} filas, cada una array de celdas
 */
export function buildNom35CsvLines({
  orgName = "Organización",
  generatedAt,
  totalSeats = 0,
  totalResponses = 0,
  agg = {},
  generatedBy = "",
  periodDays = 365,
} = {}) {
  const ts = generatedAt instanceof Date ? generatedAt.toISOString() : (generatedAt || new Date().toISOString());
  const lines = [];

  lines.push(["BIO-IGNICIÓN — NOM-035 STPS-2018 · Informe Agregado"]);
  lines.push([]);
  lines.push(["Organización", orgName]);
  lines.push(["Generado", ts]);
  lines.push(["Periodo", `Últimos ${periodDays} días`]);
  lines.push(["Total miembros", totalSeats]);
  lines.push(["Total respuestas", totalResponses]);
  lines.push([
    "Cobertura %",
    totalSeats ? Math.round((totalResponses / totalSeats) * 100) : 0,
  ]);
  lines.push([]);

  if (agg.suppressed) {
    lines.push(["Datos suprimidos por privacidad"]);
    lines.push([
      "Razón",
      agg.reason ||
        "Muestra menor a k=5 — el agregado podría reidentificar individuos",
    ]);
    lines.push([]);
  } else {
    lines.push(["RESUMEN GLOBAL"]);
    lines.push(["Puntaje promedio", agg.avgTotal ?? ""]);
    lines.push(["Nivel promedio", agg.nivelPromedio ?? ""]);
    lines.push([]);

    lines.push(["DISTRIBUCIÓN DE NIVELES"]);
    lines.push(["Nivel", "Conteo", "Porcentaje"]);
    for (const nivel of NIVELES_ORDER) {
      const n = agg.nivelCounts?.[nivel] || 0;
      const pct = totalResponses ? Math.round((n / totalResponses) * 100) : 0;
      lines.push([nivel, n, `${pct}%`]);
    }
    lines.push([]);

    if (Array.isArray(agg.porDominioAltoRiesgo) && agg.porDominioAltoRiesgo.length) {
      lines.push(["DOMINIOS POR RIESGO PROMEDIO (alto a bajo)"]);
      lines.push(["Dominio ID", "Dominio (etiqueta)", "Categoría", "Promedio"]);
      for (const row of agg.porDominioAltoRiesgo) {
        const info = Object.values(DOMINIOS).find((d) => d.id === row.dominio);
        const cat = info && Object.values(CATEGORIAS).find((c) => c.id === info.categoria);
        lines.push([
          row.dominio,
          info?.label || "",
          cat?.label || "",
          row.avg ?? "",
        ]);
      }
      lines.push([]);
    }
  }

  lines.push([
    "Privacidad",
    "k-anonymity k≥5 aplicada. Buckets con menos de 5 respuestas se suprimen automáticamente.",
  ]);
  if (generatedBy) lines.push(["Generado por", generatedBy]);

  return lines;
}

/**
 * Wrapper end-to-end que produce { csv, filename } listos para serve.
 * Incluye BOM UTF-8 (Excel detecta encoding).
 */
export function buildNom35CsvExport(input) {
  const lines = buildNom35CsvLines(input);
  const csv = "﻿" + rowsToCsv(lines);
  const dateStr = (input?.generatedAt instanceof Date
    ? input.generatedAt.toISOString()
    : (input?.generatedAt || new Date().toISOString())
  ).slice(0, 10);
  const orgPart = sanitizeFilename(input?.orgName);
  const filename = `nom35-aggregate-${orgPart}-${dateStr}.csv`;
  return { csv, filename };
}
