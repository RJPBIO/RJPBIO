/* ═══════════════════════════════════════════════════════════════
   Org-level session admin — DB ops + audit.
   ═══════════════════════════════════════════════════════════════
   Llamado desde /api/v1/orgs/[orgId]/sessions/* y la admin UI.
   Pure logic en lib/org-sessions.js para testing sin server.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { revokeAllForUser } from "./sessions";
import {
  joinSessionsWithMembers,
  groupSessionsByUser,
  canRevokeTarget,
} from "@/lib/org-sessions";

/**
 * Lista todas las sesiones (activas y revocadas recientes) de members
 * del org. Devuelve agrupado por user para UI.
 *
 * @param {string} orgId
 * @param {object} opts
 * @param {boolean} [opts.includeRevoked=false] — incluir revoked recientes
 * @param {number} [opts.limit=200]              — cap de filas a regresar
 */
export async function listSessionsForOrg(orgId, { includeRevoked = false, limit = 200 } = {}) {
  if (!orgId) return { groups: [], total: 0 };
  try {
    const orm = await db();
    const memberships = await orm.membership.findMany({
      where: { orgId },
      select: {
        role: true,
        userId: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
    const userIds = memberships.map((m) => m.userId);
    if (!userIds.length) return { groups: [], total: 0 };

    // Filtra: activas (no revoked) + no expired. Si includeRevoked, levanta
    // el filtro revokedAt (útil para auditoría visual de offboardings).
    const where = {
      userId: { in: userIds },
      ...(includeRevoked ? {} : { revokedAt: null }),
      expiresAt: { gt: new Date() },
    };
    const sessions = await orm.userSession.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      take: limit,
      select: {
        id: true, jti: true, userId: true, label: true, ip: true, userAgent: true,
        createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true,
      },
    });

    const memberMap = new Map(memberships.map((m) => [m.userId, m]));
    const rows = joinSessionsWithMembers(sessions, memberMap);
    const groups = groupSessionsByUser(rows);
    return { groups, total: rows.length };
  } catch {
    return { groups: [], total: 0 };
  }
}

/**
 * Revoca una sesión específica. Verifica que pertenezca a un member del org
 * y que el actor tenga autoridad sobre el target (role gating).
 * Devuelve { ok, error? } — error in: forbidden | not_found | wrong_org | revoke_failed
 *
 * @param {object} args
 * @param {string} args.sessionId
 * @param {string} args.orgId
 * @param {string} args.actorUserId
 * @param {string} args.actorRole   OWNER | ADMIN
 */
export async function revokeOrgSession({ sessionId, orgId, actorUserId, actorRole }) {
  if (!sessionId || !orgId || !actorUserId) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const sess = await orm.userSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true, jti: true },
    });
    if (!sess) return { ok: false, error: "not_found" };
    // Verificar que el target pertenezca al org y obtener su role.
    const targetMembership = await orm.membership.findFirst({
      where: { userId: sess.userId, orgId },
      select: { role: true },
    });
    if (!targetMembership) return { ok: false, error: "wrong_org" };

    if (!canRevokeTarget({
      actorRole,
      actorUserId,
      targetRole: targetMembership.role,
      targetUserId: sess.userId,
    })) {
      return { ok: false, error: "forbidden" };
    }

    if (sess.revokedAt) return { ok: true, idempotent: true }; // ya revocada

    await orm.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    await auditLog({
      orgId,
      actorId: actorUserId,
      action: "org.session.revoked",
      target: sess.userId,
      payload: { sessionId, jtiPrefix: sess.jti?.slice(0, 8) || null },
    }).catch(() => {});
    return { ok: true };
  } catch {
    return { ok: false, error: "revoke_failed" };
  }
}

/**
 * Revoca TODAS las sesiones de un user del org + bumps epoch (offboarding).
 * Verifica role gating. Devuelve { ok, count?, error? }.
 *
 * NOTA: revokeAllForUser bumpea epoch GLOBAL del user, lo que afecta a
 * sesiones en otros orgs también. Esto es intencional — un user offboarded
 * de un org no debería tener tokens válidos en ningún lado.
 */
export async function revokeAllSessionsForOrgUser({ targetUserId, orgId, actorUserId, actorRole }) {
  if (!targetUserId || !orgId || !actorUserId) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const targetMembership = await orm.membership.findFirst({
      where: { userId: targetUserId, orgId },
      select: { role: true },
    });
    if (!targetMembership) return { ok: false, error: "wrong_org" };

    if (!canRevokeTarget({
      actorRole,
      actorUserId,
      targetRole: targetMembership.role,
      targetUserId,
    })) {
      return { ok: false, error: "forbidden" };
    }

    // Counter para audit: cuántas estaban activas antes del bump.
    const activeCount = await orm.userSession.count({
      where: { userId: targetUserId, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    await revokeAllForUser(targetUserId);

    await auditLog({
      orgId,
      actorId: actorUserId,
      action: "org.member.sessions.revoked",
      target: targetUserId,
      payload: { revokedCount: activeCount, reason: "admin_action" },
    }).catch(() => {});

    return { ok: true, count: activeCount };
  } catch {
    return { ok: false, error: "revoke_failed" };
  }
}
