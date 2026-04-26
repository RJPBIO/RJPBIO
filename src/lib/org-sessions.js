/* ═══════════════════════════════════════════════════════════════
   Org-level session admin — pure helpers.
   ═══════════════════════════════════════════════════════════════
   Role gating + display formatting para /admin/security/sessions.

   Reglas de autoridad (anti-warfare):
   - OWNER       → puede revocar cualquier sesión del org (incluyendo
                   otros ADMINs y MEMBERs)
   - ADMIN       → solo puede revocar sesiones de MEMBERs
                   (NO otros ADMINs, NO OWNERs)
   - MEMBER      → no puede usar admin endpoints (UI no expuesto)

   Esto previene admin warfare: dos ADMINs que se peleen pueden
   bloquearse mutuamente con escalada al OWNER. OWNER es el árbitro.
   ═══════════════════════════════════════════════════════════════ */

export const ADMIN_SESSION_ROLES = ["OWNER", "ADMIN"];

/**
 * ¿El actor puede gestionar sesiones a nivel de admin para este org?
 * No discrimina target — sólo si tiene acceso al endpoint.
 */
export function canManageOrgSessions(actorRole) {
  return ADMIN_SESSION_ROLES.includes(actorRole);
}

/**
 * ¿El actor puede revocar a este target específico?
 * @param {object} args
 * @param {string} args.actorRole   OWNER | ADMIN | MEMBER
 * @param {string} args.actorUserId
 * @param {string} args.targetRole  OWNER | ADMIN | MEMBER
 * @param {string} args.targetUserId
 */
export function canRevokeTarget({ actorRole, actorUserId, targetRole, targetUserId }) {
  if (!canManageOrgSessions(actorRole)) return false;
  // Self-revoke en endpoints admin: permitido (útil cuando admin pierde
  // device; aunque normalmente usa /me/sessions, no hay razón de bloquear).
  if (actorUserId === targetUserId) return true;
  if (actorRole === "OWNER") return true;
  // ADMIN: solo puede revocar MEMBERs.
  if (actorRole === "ADMIN") return targetRole === "MEMBER";
  return false;
}

/**
 * Joina sesiones con membership/user data para mostrar en UI admin.
 * @param {Array} sessions   UserSession rows
 * @param {Map<string, {role, user: {email, name}}>} membershipByUserId
 * @returns rows enriquecidos: { id, jti, userId, userEmail, userName,
 *          userRole, label, ip, userAgent, createdAt, lastSeenAt,
 *          expiresAt, revokedAt }
 */
export function joinSessionsWithMembers(sessions, membershipByUserId) {
  if (!Array.isArray(sessions)) return [];
  if (!membershipByUserId || typeof membershipByUserId.get !== "function") return [];
  const out = [];
  for (const s of sessions) {
    const m = membershipByUserId.get(s.userId);
    if (!m) continue; // sesión de user que ya no es del org → ocultar
    out.push({
      id: s.id,
      jti: s.jti,
      userId: s.userId,
      userEmail: m.user?.email || null,
      userName: m.user?.name || null,
      userRole: m.role,
      label: s.label || null,
      ip: s.ip || null,
      userAgent: s.userAgent || null,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt || null,
    });
  }
  return out;
}

/**
 * Agrupa rows por userId. Útil para UI con secciones colapsables.
 */
export function groupSessionsByUser(rows) {
  if (!Array.isArray(rows)) return [];
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.userId)) {
      groups.set(r.userId, {
        userId: r.userId,
        userEmail: r.userEmail,
        userName: r.userName,
        userRole: r.userRole,
        sessions: [],
      });
    }
    groups.get(r.userId).sessions.push(r);
  }
  // Sort dentro de cada grupo: sesión más reciente primero.
  for (const g of groups.values()) {
    g.sessions.sort((a, b) =>
      new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime()
    );
  }
  // Sort grupos: OWNER primero, luego ADMIN, luego MEMBER (alfabético dentro).
  const roleOrder = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
  return Array.from(groups.values()).sort((a, b) => {
    const ra = roleOrder[a.userRole] ?? 99;
    const rb = roleOrder[b.userRole] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.userEmail || "").localeCompare(b.userEmail || "");
  });
}

/**
 * Cuenta sesiones activas (no revoked, no expired) por user.
 */
export function countActivePerUser(rows, now = new Date()) {
  if (!Array.isArray(rows)) return new Map();
  const counts = new Map();
  for (const r of rows) {
    const isActive = !r.revokedAt &&
      (!r.expiresAt || new Date(r.expiresAt).getTime() > now.getTime());
    if (!isActive) continue;
    counts.set(r.userId, (counts.get(r.userId) || 0) + 1);
  }
  return counts;
}
