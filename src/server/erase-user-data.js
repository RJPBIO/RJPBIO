/* ═══════════════════════════════════════════════════════════════
   GDPR Art. 17 — soft-erase + cascade revoke (Sprint S1.3)
   ═══════════════════════════════════════════════════════════════
   Antes: cuando un DSAR ERASURE era APPROVED, solo se setteaba
   `User.deletedAt = now`. El user seguía con sesiones activas,
   trusted-devices, push subscriptions y phone OTPs vivos —
   un compliance gap real con Art 17 que en teoría exige
   "without undue delay".

   Esta función hace la SOFT-ERASURE inmediata (revoca TODO lo que
   identifica al usuario en runtime) y deja la data principal viva
   30 días para grace + recovery + audit trail. Un cron separado
   (Sprint S2) hace HARD-DELETE post-grace.

   Lo que SÍ borra inmediatamente (revoke / delete):
   - UserSession.revokedAt = now (todas las sesiones device)
   - PhoneOtp (tabla per-user, no PII después de uso)
   - PushSubscription (push notifications cesan)
   - TrustedDevice (no MFA-skip post-erasure)
   - MfaResetRequest (PENDING quedan obsoletas)
   - Account (OAuth tokens) — NextAuth los recreó en próximo signin
   - Membership en orgs personales (no en orgs B2B compartidas — eso
     lo decide el OWNER del org B2B aparte)

   Lo que NO borra (queda para hard-delete cron):
   - User row (soft-delete con deletedAt)
   - NeuralSession history (audit trail, anonymizable)
   - Nom35Response (tras anonymizar userId, queda en agregados)
   - AuditLog rows con actorId=userId (legal-hold + chain integrity)
   - WearableEvent (cascade automática vía onDelete:Cascade en User
     row hard-delete; aquí los dejamos vivos por grace period)

   Trade-off del bandit / cohort prior:
   - banditArms del user en NeuralState quedan; al hard-delete se
     evaporan con el User row. Cohort prior org no se ve afectado.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";

/**
 * Soft-erasure inmediata. Idempotente: re-ejecutar es seguro.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {string} [opts.actorId]  - quién aprobó (admin / platform-admin)
 * @param {string} [opts.reason]   - DSAR id o motivo audit-trail
 * @returns {Promise<{ok:boolean, revokedSessions:number, removedDevices:number, removedSubs:number, removedAccounts:number, deactivatedMemberships:number}>}
 */
export async function eraseUserData(userId, { actorId = null, reason = null } = {}) {
  if (!userId || typeof userId !== "string") {
    return { ok: false, error: "invalid_user_id" };
  }
  const orm = await db();

  // 1) Marcar User como soft-deleted (idempotente: no sobreescribe deletedAt
  //    si ya estaba seteado, para preservar la fecha original del flow DSAR).
  const existing = await orm.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });
  if (!existing) return { ok: false, error: "user_not_found" };

  if (!existing.deletedAt) {
    await orm.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }

  // 2) Revocar todas las sesiones (UserSession). updateMany es atómico per-row.
  const revokedSessions = await orm.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  }).then((r) => r?.count ?? 0).catch(() => 0);

  // 3) sessionEpoch++ → invalida JWTs no-DB que sigan vivos. Lazy revalidation
  //    los marcará invalid en el próximo callback (≤60s).
  await orm.user.update({
    where: { id: userId },
    data: { sessionEpoch: { increment: 1 } },
  }).catch(() => {});

  // 4) TrustedDevice — borrar todos. Best-effort (no-op si tabla no existe en
  //    memory adapter de tests).
  const removedDevices = await orm.trustedDevice.deleteMany({ where: { userId } })
    .then((r) => r?.count ?? 0).catch(() => 0);

  // 5) PushSubscription — borrar todas para cortar push notifications.
  const removedSubs = await orm.pushSubscription.deleteMany({ where: { userId } })
    .then((r) => r?.count ?? 0).catch(() => 0);

  // 6) Account (OAuth tokens NextAuth) — limpiar para que un re-signin
  //    requiera re-autorización del provider (esto es lo que GDPR
  //    típicamente exige: "el sistema olvida el OAuth link").
  const removedAccounts = await orm.account.deleteMany({ where: { userId } })
    .then((r) => r?.count ?? 0).catch(() => 0);

  // 7) MfaResetRequest pendientes — marcadas como rejected. No borramos
  //    para preservar audit trail.
  await orm.mfaResetRequest.updateMany({
    where: { userId, status: "pending" },
    data: { status: "rejected", resolvedAt: new Date() },
  }).catch(() => {});

  // 8) PhoneOtp — borrar el row activo del phone del user (si tiene phone).
  //    No hay índice por userId; usamos phone si está presente en User.
  const userWithPhone = await orm.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  }).catch(() => null);
  if (userWithPhone?.phone) {
    await orm.phoneOtp.deleteMany({ where: { phone: userWithPhone.phone } })
      .catch(() => {});
  }

  // 9) Memberships en orgs PERSONALES (slug=personal-{userId}): desactivar.
  //    En orgs B2B no las tocamos — el OWNER del org B2B decide qué hacer
  //    cuando uno de sus miembros se borra.
  const personalSlug = `personal-${userId}`;
  const personalOrg = await orm.org.findUnique({
    where: { slug: personalSlug },
    select: { id: true },
  }).catch(() => null);
  let deactivatedMemberships = 0;
  if (personalOrg?.id) {
    const r = await orm.membership.updateMany({
      where: { userId, orgId: personalOrg.id },
      data: { deactivatedAt: new Date() },
    }).catch(() => null);
    deactivatedMemberships = r?.count ?? 0;
  }

  // 10) Audit log de la operación. Best-effort.
  await auditLog({
    orgId: personalOrg?.id || null,
    actorId: actorId || userId,
    action: "user.erasure.soft",
    target: userId,
    payload: {
      revokedSessions,
      removedDevices,
      removedSubs,
      removedAccounts,
      deactivatedMemberships,
      reason,
    },
  }).catch(() => {});

  return {
    ok: true,
    revokedSessions,
    removedDevices,
    removedSubs,
    removedAccounts,
    deactivatedMemberships,
  };
}

/**
 * HARD-DELETE post-grace. Llamado por cron diario (Sprint S2) sobre
 * users con `deletedAt < now - 30d`.
 *
 * Borra el User row → onDelete:Cascade limpia automáticamente
 * UserSession, TrustedDevice, MfaResetRequest, Account, PushSubscription,
 * WearableEvent (Sprint S1.4), DsarRequest, Notification, NeuralSession.
 *
 * Lo que sobrevive (intencional):
 * - AuditLog rows (chain integrity + legal hold).
 *   actorId/actorEmail quedan literales — si quieres anonymizar PII
 *   en audit log, hazlo en cron separado (PII removal vs row removal).
 *   El row sobrevive porque AuditLog NO tiene FK a User (solo a Org).
 *
 * Lo que cascade hard-delete elimina automáticamente:
 * - Nom35Response (Cascade vía User), incluyendo en B2B-orgs. Esto
 *   reduce la N en agregados pero respeta Art 17. Si quieres preservar
 *   el dato anonymizado, anonymiza ANTES de eraseUserData (sub-item
 *   futuro: anonymization layer pre-erase).
 * - WearableEvent (Cascade vía User, Sprint S1.4)
 * - DsarRequest (Cascade vía User para requester)
 * - Notification (Cascade vía User)
 * - NeuralSession (no FK, queda. ⚠ candidato a anonymization futura.)
 *
 * @param {object} [opts]
 * @param {number} [opts.graceDays=30]
 * @param {number} [opts.batchSize=50]
 * @param {Date}   [opts.now=new Date()]
 * @returns {Promise<{deleted: number, errors: number}>}
 */
export async function hardDeleteExpiredUsers({
  graceDays = 30,
  batchSize = 50,
  now = new Date(),
} = {}) {
  const orm = await db();
  const cutoff = new Date(now.getTime() - graceDays * 86400_000);
  const candidates = await orm.user.findMany({
    where: { deletedAt: { lt: cutoff, not: null } },
    select: { id: true, email: true },
    take: batchSize,
  }).catch(() => []);
  let deleted = 0;
  let errors = 0;
  for (const u of candidates) {
    try {
      await orm.user.delete({ where: { id: u.id } });
      deleted += 1;
      await auditLog({
        action: "user.erasure.hard",
        target: u.id,
        payload: { graceDays, email: u.email },
      }).catch(() => {});
    } catch {
      errors += 1;
    }
  }
  return { deleted, errors };
}
