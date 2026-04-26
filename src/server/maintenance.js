/* ═══════════════════════════════════════════════════════════════
   Maintenance windows — server CRUD + status transitions + notify.
   ═══════════════════════════════════════════════════════════════
   Pure logic en lib/maintenance.js (validation, transitions, notify
   cadence). Aquí persistencia + audit + integration con subscribers.

   Auth: PLATFORM_ADMIN_EMAILS (igual que Sprint 19 incidents).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { isPlatformAdmin } from "./incidents"; // reuse helper
import { canTransitionStatus, nextNotificationKind } from "@/lib/maintenance";
import { notifyMaintenanceSubscribers } from "./incident-subscribers";

export { isPlatformAdmin };

export async function createMaintenanceWindow({
  title, body, scheduledStart, scheduledEnd, components = [], creatorEmail,
}) {
  if (!title || !scheduledStart || !scheduledEnd) {
    return { ok: false, error: "bad_input" };
  }
  try {
    const orm = await db();
    const w = await orm.maintenanceWindow.create({
      data: {
        title, body: body || null,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        components: components || [],
        creatorId: creatorEmail || null,
      },
    });
    await auditLog({
      action: "platform.maintenance.created",
      actorEmail: creatorEmail || null,
      target: w.id,
      payload: {
        title,
        scheduledStart: new Date(scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        components,
      },
    }).catch(() => {});
    // T-24h check inmediato — si la window es <24h al futuro, marcamos para
    // notificar en próximo sweep (cron-driven).
    return { ok: true, window: w };
  } catch {
    return { ok: false, error: "create_failed" };
  }
}

/**
 * Transición de status. status=in_progress setea actualStart;
 * completed setea actualEnd; cancelled marca terminal sin actualEnd.
 */
export async function updateMaintenanceStatus({
  windowId, status, actorEmail,
}) {
  if (!windowId || !status) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const w = await orm.maintenanceWindow.findUnique({ where: { id: windowId } });
    if (!w) return { ok: false, error: "not_found" };
    if (!canTransitionStatus(w.status, status)) {
      return { ok: false, error: "invalid_transition" };
    }
    const now = new Date();
    const data = { status, updatedAt: now };
    if (status === "in_progress" && !w.actualStart) data.actualStart = now;
    if (status === "completed" && !w.actualEnd) data.actualEnd = now;
    const updated = await orm.maintenanceWindow.update({
      where: { id: windowId }, data,
    });
    await auditLog({
      action: status === "completed" ? "platform.maintenance.completed"
        : status === "cancelled" ? "platform.maintenance.cancelled"
        : "platform.maintenance.updated",
      actorEmail: actorEmail || null,
      target: windowId,
      payload: { status, prevStatus: w.status },
    }).catch(() => {});
    // Si transitamos a in_progress o completed, dispara notify check.
    notifyForMaintenance(updated).catch(() => {});
    return { ok: true, window: updated };
  } catch {
    return { ok: false, error: "update_failed" };
  }
}

/**
 * Decide + envía notificación según `nextNotificationKind` de la lib pura.
 * Persiste el flag correspondiente para que cron sweep no duplique.
 *
 * Retorna { kind, notified } o { kind: null }.
 */
export async function notifyForMaintenance(w, now = new Date()) {
  if (!w) return { kind: null };
  const kind = nextNotificationKind(w, now);
  if (!kind) return { kind: null };
  try {
    const orm = await db();
    const updated = await orm.maintenanceWindow.update({
      where: { id: w.id },
      data:
        kind === "T24" ? { notifiedT24: true } :
        kind === "T0"  ? { notifiedT0: true } :
        kind === "complete" ? { notifiedComplete: true } : {},
    });
    // Notify subscribers via Sprint 20 infra (helper especializado).
    notifyMaintenanceSubscribers(updated, kind).catch(() => {});
    await auditLog({
      action: `platform.maintenance.notified.${kind}`,
      target: w.id,
    }).catch(() => {});
    return { kind, notified: true };
  } catch {
    return { kind: null };
  }
}

/**
 * Sweeper — corre cada N minutos via cron, busca windows que necesitan
 * notify en este momento y procesa cada una.
 */
export async function sweepMaintenanceNotifications() {
  try {
    const orm = await db();
    // Solo windows que podrían necesitar notify (no completed sin notify;
    // no cancelled).
    const candidates = await orm.maintenanceWindow.findMany({
      where: {
        OR: [
          { status: "scheduled" },
          { status: "in_progress" },
          { status: "completed", notifiedComplete: false },
        ],
      },
      take: 200,
    });
    let count = 0;
    for (const w of candidates) {
      const r = await notifyForMaintenance(w);
      if (r.kind) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Public list para /status.
 */
export async function listStatusMaintenances({ recentDays = 14, limit = 100 } = {}) {
  try {
    const orm = await db();
    const cutoff = new Date(Date.now() - recentDays * 86400_000);
    return await orm.maintenanceWindow.findMany({
      where: {
        OR: [
          { status: { in: ["scheduled", "in_progress"] } },
          { status: { in: ["completed", "cancelled"] }, scheduledEnd: { gte: cutoff } },
        ],
      },
      orderBy: { scheduledStart: "asc" },
      take: Math.min(Math.max(1, limit), 500),
    });
  } catch {
    return [];
  }
}

/**
 * Admin list (todos).
 */
export async function listAllMaintenances({ limit = 100 } = {}) {
  try {
    const orm = await db();
    return await orm.maintenanceWindow.findMany({
      orderBy: { scheduledStart: "desc" },
      take: Math.min(Math.max(1, limit), 500),
    });
  } catch {
    return [];
  }
}
