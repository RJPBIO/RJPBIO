/* ═══════════════════════════════════════════════════════════════
   Cron · Incident broadcast worker (Sprint S2.6)
   ═══════════════════════════════════════════════════════════════
   Cadencia: cada minuto.
   Busca IncidentUpdate creados desde el último run (lastNotifiedAt).
   Para cada update:
     - Encuentra IncidentSubscribers verified que matchean components.
     - Audita la fan-out con count.
     - Persiste subscriber.lastNotifiedAt.

   El delivery real (email + webhook con HMAC) queda como hook —
   este worker registra que el broadcast fue intentado y lleva
   audit trail. Sprint 5 cablea email-delivery + webhook-delivery
   a este worker.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "../db";
import { auditLog } from "../audit";

const RECENT_WINDOW_MS = 10 * 60_000; // 10 min lookback (cubre downtime del cron)

function arraysIntersect(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(b);
  return a.some((x) => set.has(x));
}

export async function runIncidentBroadcast() {
  const orm = await db();
  const now = new Date();
  const since = new Date(now.getTime() - RECENT_WINDOW_MS);

  const updates = await orm.incidentUpdate.findMany({
    where: { createdAt: { gte: since } },
    take: 200,
  }).catch(() => []);

  if (!updates.length) return { processed: 0, errors: 0, details: { updates: 0 } };

  // Pre-fetch incidents para conocer sus components.
  const incidentIds = Array.from(new Set(updates.map((u) => u.incidentId)));
  const incidentsArr = await orm.incident.findMany({
    where: { id: { in: incidentIds } },
    select: { id: true, components: true, severity: true, title: true },
  }).catch(() => []);
  const incidents = new Map(incidentsArr.map((i) => [i.id, i]));

  const subscribers = await orm.incidentSubscriber.findMany({
    where: { verified: true },
    select: { id: true, components: true, email: true, webhookUrl: true, lastNotifiedAt: true },
  }).catch(() => []);

  let processed = 0;
  let errors = 0;
  const matches = []; // dedupe: subscriber × incident

  for (const u of updates) {
    const incident = incidents.get(u.incidentId);
    if (!incident) continue;
    const incComponents = incident.components || [];
    for (const sub of subscribers) {
      const subComponents = sub.components || [];
      const interested =
        subComponents.length === 0 || // sin filtros = recibe todo
        incComponents.length === 0 || // incident sin components especificados = todos
        arraysIntersect(subComponents, incComponents);
      if (!interested) continue;
      // Idempotencia: si subscriber.lastNotifiedAt > update.createdAt, skip.
      if (sub.lastNotifiedAt && new Date(sub.lastNotifiedAt) > new Date(u.createdAt)) continue;
      matches.push({ subId: sub.id, updateId: u.id, incidentId: u.incidentId });
      try {
        await orm.incidentSubscriber.update({
          where: { id: sub.id },
          data: { lastNotifiedAt: now },
        });
        processed += 1;
      } catch {
        errors += 1;
      }
    }
  }

  await auditLog({
    action: "cron.incident.broadcast.tick",
    payload: {
      updatesProcessed: updates.length,
      subscriberMatches: matches.length,
      errors,
    },
  }).catch(() => {});

  return {
    processed,
    errors,
    details: {
      updatesProcessed: updates.length,
      matchedNotifications: matches.length,
    },
  };
}
