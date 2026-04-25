/* ═══════════════════════════════════════════════════════════════
   Sync validation — helpers puros para validar entries del outbox.
   ═══════════════════════════════════════════════════════════════
   Extraídos de /api/sync/outbox/route.js para que sean testables
   en isolation (sin auth, db, csrf). El route importa estas
   funciones; los tests las consumen directamente.
   ═══════════════════════════════════════════════════════════════ */

// Whitelist de kinds — bloquea entries malformadas o payloads custom
// inyectados por un cliente comprometido. Cada nuevo kind futuro debe
// añadirse aquí explícitamente.
export const VALID_KINDS = new Set([
  "session", "mood", "hrv", "rhr", "chronotype",
  "nom035", "instrument",
  "program_start", "program_complete", "program_abandon", "program_day_complete",
]);

// Limits — alineados con el route handler.
export const MAX_BATCH = 200;
export const MAX_PAYLOAD_BYTES = 512 * 1024;
export const MAX_NEURAL_STATE_BYTES = 256 * 1024;
export const MAX_ENTRY_PAYLOAD_BYTES = 32 * 1024;

export function jsonSize(obj) {
  try { return new TextEncoder().encode(JSON.stringify(obj)).length; }
  catch { return Number.POSITIVE_INFINITY; }
}

/**
 * Valida un entry individual del outbox.
 * @returns {string|null} código de error, o null si es válido.
 */
export function validateEntry(e) {
  if (!e || typeof e !== "object") return "not_object";
  if (typeof e.id !== "string" || e.id.length === 0 || e.id.length > 128) return "bad_id";
  if (typeof e.kind !== "string" || !VALID_KINDS.has(e.kind)) return "bad_kind";
  if (e.payload != null && typeof e.payload !== "object") return "bad_payload";
  if (e.payload && jsonSize(e.payload) > MAX_ENTRY_PAYLOAD_BYTES) return "payload_too_large";
  return null;
}
