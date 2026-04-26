/* ═══════════════════════════════════════════════════════════════
   Invitation helpers — validación + filtrado puros.
   ═══════════════════════════════════════════════════════════════
   Extraídos de /api/v1/invitations/[token]/accept y /api/invite/bulk
   para tests isolados (sin db, sin email, sin auth).

   Decisión: pure functions retornan {ok, reason} en lugar de throw.
   Permite que el caller decida HTTP status apropiado y mensaje.
   ═══════════════════════════════════════════════════════════════ */

export const VALID_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"];
export const INVITE_EXP_DAYS = 7;
export const MAX_INVITE_BATCH = 200;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida si una invitación puede ser aceptada AHORA.
 * Causas de rechazo: no encontrada, ya aceptada, expirada.
 */
export function validateInvitationForAcceptance(inv, now = new Date()) {
  if (!inv) return { ok: false, reason: "not_found" };
  if (inv.acceptedAt) return { ok: false, reason: "already_accepted" };
  if (inv.expiresAt && new Date(inv.expiresAt) < now) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}

/**
 * Valida un email. Lowercase + trim para deduping consistente.
 */
export function isValidEmail(e) {
  return typeof e === "string" && EMAIL_RE.test(e);
}

export function normalizeEmail(e) {
  return String(e || "").trim().toLowerCase();
}

/**
 * Valida un rol contra la whitelist.
 */
export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

/**
 * Filtra emails de un batch:
 *   - Normaliza (lowercase + trim)
 *   - Valida formato
 *   - Dedupea
 *   - Excluye los que ya tienen invitación pending
 *   - Excluye los que ya son members del org
 *
 * Returns: { eligible: string[], skipped: { duplicates, invalid, alreadyPending, alreadyMembers } }
 */
export function filterInviteCandidates(emails, opts = {}) {
  const pending = new Set((opts.pendingEmails || []).map(normalizeEmail));
  const members = new Set((opts.memberEmails || []).map(normalizeEmail));

  const seen = new Set();
  const eligible = [];
  let invalid = 0;
  let duplicates = 0;
  let alreadyPending = 0;
  let alreadyMembers = 0;

  for (const raw of emails || []) {
    const e = normalizeEmail(raw);
    if (!isValidEmail(e)) { invalid += 1; continue; }
    if (seen.has(e)) { duplicates += 1; continue; }
    seen.add(e);
    if (members.has(e)) { alreadyMembers += 1; continue; }
    if (pending.has(e)) { alreadyPending += 1; continue; }
    eligible.push(e);
  }

  return {
    eligible,
    skipped: { duplicates, invalid, alreadyPending, alreadyMembers },
  };
}

/**
 * Calcula expiración default desde ahora.
 */
export function defaultExpiry(now = Date.now()) {
  return new Date(now + INVITE_EXP_DAYS * 86400000);
}
