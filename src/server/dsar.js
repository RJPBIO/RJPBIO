/* ═══════════════════════════════════════════════════════════════
   DSAR — server-side CRUD + resolve + expire sweeper.
   ═══════════════════════════════════════════════════════════════
   Pure logic en lib/dsar.js para tests sin DB. Este módulo persiste.

   Auto-resolve flow:
   - ACCESS / PORTABILITY → status=COMPLETED + artifactUrl al export
     existente (/api/v1/users/me/export). Audit trail formal sin admin.
   - ERASURE → status=PENDING; admin debe resolver vía /admin/compliance/dsar.

   Erasure aprobado: setea User.deletedAt + revoca sesiones; el sweep
   real (hard-delete) corre por cron tras grace period (no implementado
   en este sprint — defer).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { revokeAllForUser } from "./sessions";
import {
  isAutoResolveKind,
  computeExpiry,
  canTransition,
} from "@/lib/dsar";

const ARTIFACT_URL_ME_EXPORT = "/api/v1/users/me/export";

/**
 * Crea una DsarRequest. Auto-resuelve si kind permite.
 * @param {object} args { userId, orgId?, kind, reason?, ip?, userAgent? }
 * @returns {Promise<object|null>} La row creada (o null en error).
 */
export async function createDsarRequest({ userId, orgId, kind, reason, ip, userAgent }) {
  if (!userId || !kind) return null;
  try {
    const orm = await db();
    const expiresAt = computeExpiry();
    const data = {
      userId,
      orgId: orgId || null,
      kind,
      reason: reason || null,
      ip: ip || null,
      userAgent: userAgent || null,
      expiresAt,
    };

    if (isAutoResolveKind(kind)) {
      data.status = "COMPLETED";
      data.resolvedAt = new Date();
      data.artifactUrl = ARTIFACT_URL_ME_EXPORT;
    }

    const created = await orm.dsarRequest.create({ data });

    await auditLog({
      orgId: orgId || null,
      actorId: userId,
      action: "user.dsar.requested",
      payload: {
        dsarId: created.id,
        kind,
        status: created.status,
        autoResolved: isAutoResolveKind(kind),
      },
    }).catch(() => {});

    return created;
  } catch {
    return null;
  }
}

/**
 * Lista requests del usuario actual.
 */
export async function listDsarForUser(userId, { limit = 50 } = {}) {
  if (!userId) return [];
  try {
    const orm = await db();
    return await orm.dsarRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: Math.min(Math.max(1, limit), 200),
      select: {
        id: true, kind: true, status: true, reason: true,
        artifactUrl: true, resolverNotes: true,
        requestedAt: true, resolvedAt: true, expiresAt: true,
      },
    });
  } catch {
    return [];
  }
}

/**
 * Lista requests de un org (admin queue). Incluye datos del requester.
 */
export async function listDsarForOrg(orgId, { status = null, limit = 100 } = {}) {
  if (!orgId) return [];
  try {
    const orm = await db();
    const where = { orgId };
    if (status) where.status = status;
    return await orm.dsarRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
      take: Math.min(Math.max(1, limit), 500),
      include: {
        user: { select: { id: true, email: true, name: true } },
        resolver: { select: { id: true, email: true, name: true } },
      },
    });
  } catch {
    return [];
  }
}

/**
 * Resuelve una request. Verifica role + state machine + persiste.
 * Si APPROVED y kind=ERASURE → marca user.deletedAt + revokeAllForUser.
 *
 * @param {object} args { requestId, orgId, actorUserId, actorRole, status, notes? }
 * @returns {Promise<{ ok, error?, request? }>}
 */
export async function resolveDsarRequest({ requestId, orgId, actorUserId, actorRole, status, notes }) {
  if (!requestId || !orgId || !actorUserId) {
    return { ok: false, error: "bad_input" };
  }
  if (!["OWNER", "ADMIN"].includes(actorRole)) {
    return { ok: false, error: "forbidden" };
  }
  try {
    const orm = await db();
    const req = await orm.dsarRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) return { ok: false, error: "not_found" };
    if (req.orgId !== orgId) return { ok: false, error: "wrong_org" };
    if (!canTransition(req.status, status)) {
      return { ok: false, error: "invalid_transition" };
    }

    const data = {
      status,
      resolverId: actorUserId,
      resolvedAt: new Date(),
    };
    if (notes) data.resolverNotes = notes;

    // Side-effects para ERASURE APPROVED.
    if (status === "APPROVED" && req.kind === "ERASURE") {
      try {
        await orm.user.update({
          where: { id: req.userId },
          data: { deletedAt: new Date() },
        });
        await revokeAllForUser(req.userId).catch(() => {});
      } catch { /* best-effort */ }
    }

    const updated = await orm.dsarRequest.update({
      where: { id: requestId },
      data,
    });

    await auditLog({
      orgId,
      actorId: actorUserId,
      action: "org.dsar.resolved",
      target: req.userId,
      payload: { dsarId: requestId, kind: req.kind, status, notes: notes || null },
    }).catch(() => {});

    return { ok: true, request: updated };
  } catch {
    return { ok: false, error: "resolve_failed" };
  }
}

/**
 * Sweep que marca como EXPIRED las requests PENDING vencidas.
 * Llamable desde cron. Returns count.
 */
export async function expireOldDsarRequests() {
  try {
    const orm = await db();
    const r = await orm.dsarRequest.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });
    return r?.count ?? 0;
  } catch {
    return 0;
  }
}
