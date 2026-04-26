/* ═══════════════════════════════════════════════════════════════
   Notifications — Sprint 25: dual-write a Notification model + auditLog.
   ═══════════════════════════════════════════════════════════════
   Antes (Sprints 1-24): solo audit log con prefix `notify.*`.
   Ahora: per-user Notification rows con readAt para UI; auditLog se
   mantiene para compliance trail (no se borra evidencia con un read).

   API pública:
   - notifyOrgAdmins  — kept for backward compat (broadcast a OWNER+ADMIN)
   - createNotification — direct para target user
   - listForUser, markRead, markAllRead, countUnread
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { validateNotification } from "@/lib/notifications-lib";

export const NOTIFY_PREFIX = "notify.";

/**
 * Backward-compat: notifica a TODOS los OWNER/ADMIN del org.
 * Sprint 25: dual-write — Notification (per-user rows) Y auditLog.
 */
export async function notifyOrgAdmins(orgId, { title, body = null, level = "info", href = null, kind = "general" }) {
  if (!orgId || !title) return null;
  try {
    const orm = await db();
    const admins = await orm.membership.findMany({
      where: { orgId, role: { in: ["OWNER", "ADMIN"] } },
      select: { userId: true },
    });
    if (admins.length > 0) {
      await orm.notification.createMany({
        data: admins.map((m) => ({
          userId: m.userId,
          orgId,
          kind,
          level,
          title: String(title).slice(0, 160),
          body: body ? String(body).slice(0, 400) : null,
          href: href ? String(href).slice(0, 400) : null,
        })),
      });
    }
    // Audit log se mantiene para compliance trail.
    await auditLog({
      orgId,
      action: `${NOTIFY_PREFIX}${kind}`,
      payload: {
        title: String(title).slice(0, 160),
        body: body ? String(body).slice(0, 400) : null,
        level,
        href: href ? String(href).slice(0, 400) : null,
        targetCount: admins.length,
      },
    }).catch(() => {});
    return { count: admins.length };
  } catch {
    return null;
  }
}

/**
 * Crear una notification para un user específico. Validation pure.
 */
export async function createNotification(input) {
  const v = validateNotification(input);
  if (!v.ok) return { ok: false, errors: v.errors };
  try {
    const orm = await db();
    const created = await orm.notification.create({ data: v.value });
    return { ok: true, notification: created };
  } catch {
    return { ok: false, errors: [{ field: "_root", error: "create_failed" }] };
  }
}

/**
 * Lista las notifications del user (más recientes primero).
 */
export async function listForUser(userId, { limit = 50, unreadOnly = false, since = null } = {}) {
  if (!userId) return [];
  try {
    const orm = await db();
    const where = { userId };
    if (unreadOnly) where.readAt = null;
    if (since) where.createdAt = { gte: since };
    return await orm.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(1, limit), 200),
    });
  } catch {
    return [];
  }
}

/**
 * Cuenta unread del user — hot path para badge UI.
 */
export async function countUnread(userId) {
  if (!userId) return 0;
  try {
    const orm = await db();
    return await orm.notification.count({ where: { userId, readAt: null } });
  } catch {
    return 0;
  }
}

/**
 * Mark single as read. IDOR-safe (verifica userId match).
 */
export async function markRead(notificationId, userId) {
  if (!notificationId || !userId) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const n = await orm.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true, readAt: true },
    });
    if (!n) return { ok: false, error: "not_found" };
    if (n.userId !== userId) return { ok: false, error: "forbidden" };
    if (n.readAt) return { ok: true, idempotent: true };
    await orm.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "update_failed" };
  }
}

/**
 * Mark all unread as read para el user. Returns count.
 */
export async function markAllRead(userId) {
  if (!userId) return { count: 0 };
  try {
    const orm = await db();
    const r = await orm.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { count: r?.count ?? 0 };
  } catch {
    return { count: 0 };
  }
}
