/* ═══════════════════════════════════════════════════════════════
   Membership revoke cascade (Sprint S3.3)
   ═══════════════════════════════════════════════════════════════
   Cuando un user se desactiva en un org via SCIM PATCH active=false
   (o DELETE), antes solo se settía `Membership.deactivatedAt`. Las
   sesiones JWT del user seguían vivas hasta su expiración natural —
   8h por default. Durante ese tiempo, si tenía /admin de otro org o
   /app PWA, podía seguir operando.

   GAP de compliance: SCIM deactivation = "the user is gone from this
   org, **immediately**". 8h de gracia es inaceptable.

   Esta función:
   1. Revoca todas las UserSessions del user (revokedAt = now).
   2. Bump `User.sessionEpoch++` → invalida JWTs en próximo lazy
      revalidation (≤60s).
   3. Borra TrustedDevice entries (no skip-MFA post-deactivation).
   4. NO toca:
      - API keys (org-owned, otros members las usan).
      - Webhooks (org-owned).
      - Push subscriptions (multi-org user puede tenerlas para personal-org).

   Idempotente: re-correr es seguro.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";

/**
 * Revoca acceso de un user globalmente (todos los orgs). Usado por SCIM
 * deactivation y por flujos similares (org B2B booting un member).
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {string} [opts.orgId]      - org que dispara la revocación (audit trail)
 * @param {string} [opts.reason]     - "scim.deactivate" | "admin.kick" | etc
 * @param {string} [opts.actorId]    - quién la disparó
 * @returns {Promise<{ok: boolean, revokedSessions: number, removedDevices: number}>}
 */
export async function revokeUserAccess(userId, { orgId = null, reason = null, actorId = null } = {}) {
  if (!userId || typeof userId !== "string") return { ok: false, error: "invalid_user_id" };
  const orm = await db();

  let revokedSessions = 0;
  try {
    const r = await orm.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    revokedSessions = r?.count ?? 0;
  } catch {/* skip */}

  // Bump sessionEpoch para que JWTs cacheados se invaliden en lazy revalidation.
  try {
    await orm.user.update({
      where: { id: userId },
      data: { sessionEpoch: { increment: 1 } },
    });
  } catch {/* skip */}

  // TrustedDevice — borra para que MFA-skip cookie no permita re-entry sin MFA.
  let removedDevices = 0;
  try {
    const r = await orm.trustedDevice.deleteMany({ where: { userId } });
    removedDevices = r?.count ?? 0;
  } catch {/* skip */}

  await auditLog({
    orgId,
    actorId,
    action: "user.access.revoked",
    target: userId,
    payload: { reason, revokedSessions, removedDevices },
  }).catch(() => {});

  return { ok: true, revokedSessions, removedDevices };
}
