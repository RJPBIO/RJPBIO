/* ═══════════════════════════════════════════════════════════════
   DSAR — Data Subject Access Requests (GDPR Art. 15 / 17 / 20).
   ═══════════════════════════════════════════════════════════════
   Pure helpers para validación + state machine + expiry.

   GDPR derechos cubiertos:
   - ACCESS       (Art. 15): "qué datos tienen sobre mí"
   - PORTABILITY  (Art. 20): "exporta en formato machine-readable"
   - ERASURE      (Art. 17): "borra mis datos" — soft-delete con 30d grace

   Auto-resolve flow:
   - ACCESS y PORTABILITY se autocompletan con artifactUrl al export
     existente /api/v1/users/me/export. Audit trail formal sin admin overhead.
   - ERASURE requiere admin approval (puede haber motivos legales para
     retener) → status=PENDING hasta que OWNER/ADMIN del org resuelva.

   Data-moat: Recital 26 GDPR permite retención de datos AGREGADOS
   anónimos tras erasure. Esta lib trabaja con PII; la lógica de
   anonymización vive en src/lib/analytics-anonymize.js.
   ═══════════════════════════════════════════════════════════════ */

export const DSAR_KINDS = ["ACCESS", "PORTABILITY", "ERASURE"];
export const DSAR_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "EXPIRED"];

// Auto-resolve para self-service. ERASURE requiere admin approval.
export const DSAR_AUTO_RESOLVE_KINDS = ["ACCESS", "PORTABILITY"];

// SLA legal: GDPR Art. 12 §3 da 1 mes, extensible a 3 meses con justificación.
// Default 30 días para alinear con la política de grace period de erasure.
export const DSAR_DEFAULT_EXPIRY_DAYS = 30;
export const DSAR_REASON_MAX = 500;

export function isValidKind(k) {
  return typeof k === "string" && DSAR_KINDS.includes(k);
}

export function isValidStatus(s) {
  return typeof s === "string" && DSAR_STATUSES.includes(s);
}

export function isAutoResolveKind(k) {
  return DSAR_AUTO_RESOLVE_KINDS.includes(k);
}

/**
 * Valida el body de "POST /me/dsar".
 * @param {object} input { kind, reason? }
 */
export function validateDsarRequest(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};
  if (!isValidKind(input.kind)) {
    errors.push({ field: "kind", error: "invalid_kind" });
  } else {
    out.kind = input.kind;
  }
  if (input.reason !== undefined && input.reason !== null && input.reason !== "") {
    if (typeof input.reason !== "string") {
      errors.push({ field: "reason", error: "not_string" });
    } else if (input.reason.length > DSAR_REASON_MAX) {
      errors.push({ field: "reason", error: "too_long" });
    } else {
      out.reason = input.reason.trim();
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * Máquina de estados — ¿es legal pasar de `from` a `to`?
 * PENDING → APPROVED | REJECTED | EXPIRED
 * APPROVED → COMPLETED
 * REJECTED → (terminal)
 * COMPLETED → (terminal)
 * EXPIRED → (terminal)
 */
const TRANSITIONS = {
  PENDING: ["APPROVED", "REJECTED", "EXPIRED", "COMPLETED"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
  EXPIRED: [],
};

export function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Valida una request de admin para resolver: kind del request + status nuevo
 * + notes opcional. Retorna shape para persistir.
 */
export function validateResolve(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  if (!isValidStatus(input.status)) {
    errors.push({ field: "status", error: "invalid_status" });
  } else if (!["APPROVED", "REJECTED", "COMPLETED"].includes(input.status)) {
    // No se puede "resolver" a PENDING o EXPIRED desde admin endpoint.
    errors.push({ field: "status", error: "not_resolvable" });
  }
  const out = { status: input.status };
  if (input.notes !== undefined && input.notes !== null && input.notes !== "") {
    if (typeof input.notes !== "string") {
      errors.push({ field: "notes", error: "not_string" });
    } else if (input.notes.length > DSAR_REASON_MAX) {
      errors.push({ field: "notes", error: "too_long" });
    } else {
      out.notes = input.notes.trim();
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * Calcula expiresAt para una request nueva.
 */
export function computeExpiry(days = DSAR_DEFAULT_EXPIRY_DAYS, now = new Date()) {
  const safe = Number.isFinite(days) && days > 0 ? days : DSAR_DEFAULT_EXPIRY_DAYS;
  return new Date(now.getTime() + safe * 86400_000);
}

/**
 * ¿La request expiró?
 */
export function isExpired(req, now = new Date()) {
  if (!req) return false;
  if (req.status !== "PENDING") return false; // sólo PENDING puede expirar
  if (!req.expiresAt) return false;
  return new Date(req.expiresAt).getTime() < now.getTime();
}

/**
 * Días que quedan hasta expiration (negativo si ya expiró).
 */
export function daysUntilExpiry(req, now = new Date()) {
  if (!req?.expiresAt) return Infinity;
  const ms = new Date(req.expiresAt).getTime() - now.getTime();
  return Math.ceil(ms / 86400_000);
}

/**
 * UI label para status. Locale-aware (es por defecto).
 */
export function statusLabel(status, locale = "es") {
  const map = {
    es: {
      PENDING: "Pendiente", APPROVED: "Aprobada",
      REJECTED: "Rechazada", COMPLETED: "Completada",
      EXPIRED: "Expirada",
    },
    en: {
      PENDING: "Pending", APPROVED: "Approved",
      REJECTED: "Rejected", COMPLETED: "Completed",
      EXPIRED: "Expired",
    },
  };
  return (map[locale] || map.es)[status] || status;
}

export function kindLabel(kind, locale = "es") {
  const map = {
    es: {
      ACCESS: "Acceso a mis datos (Art. 15)",
      PORTABILITY: "Portabilidad (Art. 20)",
      ERASURE: "Borrado (Art. 17)",
    },
    en: {
      ACCESS: "Right to access (Art. 15)",
      PORTABILITY: "Right to portability (Art. 20)",
      ERASURE: "Right to erasure (Art. 17)",
    },
  };
  return (map[locale] || map.es)[kind] || kind;
}

/**
 * Cuenta requests por status. Útil para badges en UI admin.
 */
export function countByStatus(rows) {
  const counts = {};
  for (const s of DSAR_STATUSES) counts[s] = 0;
  for (const r of rows || []) {
    if (r?.status && counts[r.status] !== undefined) counts[r.status]++;
  }
  return counts;
}
