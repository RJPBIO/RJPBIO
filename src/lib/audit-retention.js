/* ═══════════════════════════════════════════════════════════════
   Audit retention + export — pure helpers.
   ═══════════════════════════════════════════════════════════════
   Compañero de lib/audit-chain.js (que firma + verifica). Esto es:
   - validateRetentionDays: bounds para política de retención
   - computeCutoff: Date para sweeper "delete logs older than X"
   - summarizeVerification: traduce resultado de verifyChain a UI
   - formatExportFilename: nombre de archivo determinístico para export

   Defaults SOC2-friendly: 365 días default, mínimo 30 (recovery window),
   máximo 2555 (~7 años para SEC retention requirements).
   ═══════════════════════════════════════════════════════════════ */

export const AUDIT_RETENTION_MIN_DAYS = 30;
export const AUDIT_RETENTION_MAX_DAYS = 2555; // ~7 años (SOC2/SEC standard)
export const AUDIT_RETENTION_DEFAULT = 365;
export const AUDIT_EXPORT_MAX_ROWS = 50_000;

export function validateRetentionDays(n) {
  if (n === null || n === undefined) {
    return { ok: false, error: "required" };
  }
  if (typeof n !== "number" || !Number.isInteger(n)) {
    return { ok: false, error: "not_integer" };
  }
  if (n < AUDIT_RETENTION_MIN_DAYS) return { ok: false, error: "too_small" };
  if (n > AUDIT_RETENTION_MAX_DAYS) return { ok: false, error: "too_large" };
  return { ok: true, value: n };
}

/**
 * Cutoff date para el sweeper. Logs con ts < cutoff son borrados.
 * @param {number} retentionDays
 * @param {Date} now reference time (testing)
 */
export function computeCutoff(retentionDays, now = new Date()) {
  const safe = Number.isInteger(retentionDays) && retentionDays >= AUDIT_RETENTION_MIN_DAYS
    ? retentionDays
    : AUDIT_RETENTION_DEFAULT;
  return new Date(now.getTime() - safe * 86400_000);
}

/**
 * Traduce el resultado crudo de verifyChain a un objeto UI-friendly.
 * @param {object} result { ok, brokenAt?, reason?, entries }
 */
export function summarizeVerification(result) {
  if (!result || typeof result !== "object") {
    return { status: "error", message: "Resultado inválido", verified: 0 };
  }
  if (result.ok) {
    return {
      status: "verified",
      message: `${result.entries || 0} entradas verificadas correctamente`,
      verified: result.entries || 0,
    };
  }
  const reasons = {
    hash: "Hash chain roto: contenido modificado después de escritura",
    seal: "HMAC seal inválido: posible manipulación con AUDIT_HMAC_KEY comprometida",
  };
  return {
    status: "tampered",
    message: reasons[result.reason] || `Cadena rota en ${result.brokenAt || "row desconocida"}`,
    brokenAt: result.brokenAt || null,
    reason: result.reason || "unknown",
    verified: 0,
  };
}

/**
 * Filename determinístico para export. Sanitiza orgId para filesystem.
 * @param {object} args { orgId, format = "csv" | "jsonl", from, to }
 */
export function formatExportFilename({ orgId, format = "csv", from, to }) {
  const safeOrg = String(orgId || "org").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
  const fmt = format === "jsonl" ? "jsonl" : "csv";
  const fromPart = from ? new Date(from).toISOString().slice(0, 10) : "all";
  const toPart = to ? new Date(to).toISOString().slice(0, 10) : "all";
  return `audit-${safeOrg}-${fromPart}-${toPart}.${fmt}`;
}

/**
 * Convierte una row de AuditLog a línea CSV (escape comas/quotes/newlines).
 * Headers fijos para que el CSV sea machine-readable.
 */
export const AUDIT_CSV_HEADERS = [
  "id", "ts", "orgId", "actorId", "actorEmail", "action", "target",
  "ip", "ua", "payloadJson", "hash", "prevHash",
];

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : (v instanceof Date ? v.toISOString() : JSON.stringify(v));
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowToCsvLine(row) {
  if (!row) return "";
  const parts = AUDIT_CSV_HEADERS.map((h) => {
    if (h === "payloadJson") return csvEscape(row.payload ? JSON.stringify(row.payload) : "");
    if (h === "ts") return csvEscape(row.ts);
    return csvEscape(row[h]);
  });
  return parts.join(",");
}

export function rowsToCsv(rows) {
  const lines = [AUDIT_CSV_HEADERS.join(",")];
  for (const r of rows || []) lines.push(rowToCsvLine(r));
  return lines.join("\n") + "\n";
}

export function rowsToJsonl(rows) {
  if (!Array.isArray(rows)) return "";
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}
