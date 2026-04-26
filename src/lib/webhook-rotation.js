/* ═══════════════════════════════════════════════════════════════
   Webhook secret rotation — pure helpers para zero-downtime rotation.
   ═══════════════════════════════════════════════════════════════
   Flujo:
   1. Admin click "Rotate" → server genera nuevo secret + setea overlap
   2. Durante overlap (default 7 días): dispatchWebhooks firma con BOTH
      secrets y manda ambas firmas en header "webhook-signature"
      space-separated (Standard Webhooks v1 soporta multi-sig).
   3. Cliente verifica contra su secret guardado (sea el viejo o el
      nuevo) — alguna de las firmas en el header matcheará.
   4. Cliente actualiza su secret stored al nuevo cuando puede.
   5. Tras overlap expira: prevSecret se borra, dispatch firma sólo
      con el nuevo. Sin downtime.

   Pure module — testable sin server. Para crypto random usamos
   crypto.randomBytes en server/webhooks.js (sólo importable en node).
   Aquí solo math/UI logic.
   ═══════════════════════════════════════════════════════════════ */

export const OVERLAP_MIN_DAYS = 1;
export const OVERLAP_MAX_DAYS = 30;
export const OVERLAP_DEFAULT_DAYS = 7;

/**
 * Valida días de overlap solicitados por el admin.
 */
export function validateOverlapDays(n) {
  if (n === null || n === undefined || n === "") {
    return { ok: true, value: OVERLAP_DEFAULT_DAYS };
  }
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isInteger(num)) return { ok: false, error: "not_integer" };
  if (num < OVERLAP_MIN_DAYS) return { ok: false, error: "too_small" };
  if (num > OVERLAP_MAX_DAYS) return { ok: false, error: "too_large" };
  return { ok: true, value: num };
}

/**
 * Calcula prevSecretExpiresAt (cutoff del overlap) desde now + days.
 */
export function computeOverlapExpiry(days, now = new Date()) {
  const safe = Number.isInteger(days) && days >= OVERLAP_MIN_DAYS
    ? days
    : OVERLAP_DEFAULT_DAYS;
  return new Date(now.getTime() + safe * 86400_000);
}

/**
 * ¿El webhook tiene un overlap activo? (prevSecret presente Y no expirado).
 */
export function isOverlapActive(webhook, now = new Date()) {
  if (!webhook) return false;
  if (!webhook.prevSecret) return false;
  if (!webhook.prevSecretExpiresAt) return false;
  return new Date(webhook.prevSecretExpiresAt).getTime() > now.getTime();
}

/**
 * Días que quedan del overlap. 0 si ya expiró, Infinity si no hay overlap.
 */
export function daysUntilOverlapExpires(webhook, now = new Date()) {
  if (!webhook?.prevSecretExpiresAt) return Infinity;
  const ms = new Date(webhook.prevSecretExpiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86400_000));
}

/**
 * Resumen UI-friendly del status de rotación.
 */
export function summarizeRotation(webhook, now = new Date()) {
  if (!webhook) return { status: "unknown", label: "—", tone: "neutral" };
  const active = isOverlapActive(webhook, now);
  if (active) {
    const days = daysUntilOverlapExpires(webhook, now);
    return {
      status: "rotating",
      label: "Rotando",
      tone: "warn",
      detail: `Secret anterior expira en ${days} día${days !== 1 ? "s" : ""}`,
      daysLeft: days,
    };
  }
  if (webhook.secretRotatedAt) {
    return {
      status: "rotated",
      label: "Rotado",
      tone: "success",
      detail: `Última rotación: ${new Date(webhook.secretRotatedAt).toLocaleDateString()}`,
    };
  }
  return {
    status: "original",
    label: "Original",
    tone: "soft",
    detail: "Sin rotaciones todavía",
  };
}

/**
 * Une múltiples firmas en formato Standard Webhooks v1 (space-separated).
 * Si solo hay una, retorna esa. Si hay duplicadas, dedup.
 *
 * @param {string[]} signatures — array de "v1,base64..." strings
 */
export function buildSignatureHeader(signatures) {
  if (!Array.isArray(signatures)) return "";
  const valid = signatures.filter((s) => typeof s === "string" && s.length > 0);
  if (valid.length === 0) return "";
  const dedup = Array.from(new Set(valid));
  return dedup.join(" ");
}

/**
 * ¿La cleanup de prev secret debe ejecutarse? Útil para sweep cron.
 * True si overlap expiró pero prevSecret sigue presente en DB.
 */
export function shouldCleanupOverlap(webhook, now = new Date()) {
  if (!webhook?.prevSecret) return false;
  if (!webhook?.prevSecretExpiresAt) return true; // datos inconsistentes — limpiar
  return new Date(webhook.prevSecretExpiresAt).getTime() <= now.getTime();
}
