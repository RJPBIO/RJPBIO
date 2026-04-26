/* ═══════════════════════════════════════════════════════════════
   Incident subscribers — server-side CRUD + notify orchestration.
   ═══════════════════════════════════════════════════════════════
   Pure logic en lib/incident-subscribers.js. Aquí persistencia + email
   delivery + webhook POST.

   Tokens generados con randomBytes(32).hex (64 chars) — entropy 256 bits.
   Email subscribe → token verify → click → verified=true. Sin click,
   subscriber queda PENDING y NO recibe notifications.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { auditLog } from "./audit";
import { sendIncidentNotification, sendIncidentVerification } from "./email";
import {
  shouldNotifyForIncident,
  buildUnsubscribeUrl,
  buildVerifyUrl,
  formatNotificationSubject,
  TOKEN_LENGTH,
} from "@/lib/incident-subscribers";

function newToken() {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app";
}

/**
 * Crea subscriber y dispara verify email (si email channel).
 * Webhooks no requieren verify (caller demuestra ownership al recibir hits).
 *
 * Idempotente: si email ya existe, retorna existing (no resend automático).
 */
export async function subscribe({ email, webhookUrl, components = [] }) {
  if (!email && !webhookUrl) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const unsubscribeToken = newToken();

    if (email) {
      const existing = await orm.incidentSubscriber.findUnique({ where: { email } });
      if (existing) {
        return { ok: true, subscriber: existing, alreadyExists: true };
      }
      const verifyToken = newToken();
      const created = await orm.incidentSubscriber.create({
        data: {
          email, components, verifyToken, unsubscribeToken,
          verified: false,
        },
      });
      await sendIncidentVerification({
        to: email,
        verifyUrl: buildVerifyUrl(verifyToken, baseUrl()),
      }).catch(() => {});
      await auditLog({
        action: "platform.subscriber.created",
        target: created.id,
        payload: { channel: "email" },
      }).catch(() => {});
      return { ok: true, subscriber: created };
    }

    // Webhook channel — verified=true desde el principio (ownership inferido).
    const created = await orm.incidentSubscriber.create({
      data: {
        webhookUrl, components,
        verified: true, // webhooks no necesitan verify magic-link
        unsubscribeToken,
      },
    });
    await auditLog({
      action: "platform.subscriber.created",
      target: created.id,
      payload: { channel: "webhook" },
    }).catch(() => {});
    return { ok: true, subscriber: created };
  } catch {
    return { ok: false, error: "subscribe_failed" };
  }
}

/**
 * Confirm email — clear verifyToken, set verified=true.
 */
export async function verifyEmailSubscription(token) {
  if (!token) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const sub = await orm.incidentSubscriber.findFirst({
      where: { verifyToken: token, verified: false },
    });
    if (!sub) return { ok: false, error: "invalid_or_expired" };
    const updated = await orm.incidentSubscriber.update({
      where: { id: sub.id },
      data: { verified: true, verifyToken: null },
    });
    await auditLog({
      action: "platform.subscriber.verified",
      target: sub.id,
    }).catch(() => {});
    return { ok: true, subscriber: updated };
  } catch {
    return { ok: false, error: "verify_failed" };
  }
}

/**
 * One-click unsubscribe (no auth) — delete row + audit.
 */
export async function unsubscribeByToken(token) {
  if (!token) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const sub = await orm.incidentSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
    if (!sub) return { ok: false, error: "not_found" };
    await orm.incidentSubscriber.delete({ where: { id: sub.id } });
    await auditLog({
      action: "platform.subscriber.unsubscribed",
      target: sub.id,
    }).catch(() => {});
    return { ok: true };
  } catch {
    return { ok: false, error: "unsubscribe_failed" };
  }
}

/**
 * Notifica a todos los subscribers verified que matcheen el incident.
 * Best-effort — no bloquea si email/webhook falla. Persiste lastNotifiedAt.
 *
 * @param {object} incident
 * @param {"created"|"updated"|"resolved"} kind
 */
export async function notifySubscribers(incident, kind = "updated") {
  if (!incident?.id) return { ok: false, error: "bad_input", count: 0 };
  try {
    const orm = await db();
    const all = await orm.incidentSubscriber.findMany({
      where: { verified: true },
    });
    const eligible = all.filter((s) => shouldNotifyForIncident(s, incident));
    if (eligible.length === 0) return { ok: true, count: 0 };

    const subject = formatNotificationSubject(incident, "es");
    const now = new Date();

    let sent = 0;
    for (const s of eligible) {
      try {
        const unsubUrl = buildUnsubscribeUrl(s.unsubscribeToken, baseUrl());
        if (s.email) {
          await sendIncidentNotification({
            to: s.email,
            subject,
            incident,
            kind,
            unsubscribeUrl: unsubUrl,
          });
          sent++;
        } else if (s.webhookUrl) {
          await fetch(s.webhookUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "user-agent": "BIO-IGNICION-StatusSubscriber/1.0",
            },
            body: JSON.stringify({
              event: `incident.${kind}`,
              incident: {
                id: incident.id,
                title: incident.title,
                status: incident.status,
                severity: incident.severity,
                components: incident.components || [],
                startedAt: incident.startedAt,
                resolvedAt: incident.resolvedAt || null,
              },
              unsubscribe: unsubUrl,
            }),
            signal: AbortSignal.timeout(8_000),
          }).catch(() => {});
          sent++;
        }
      } catch { /* best-effort, sigue con los demás */ }
    }

    // Actualiza lastNotifiedAt para todos los notified.
    await orm.incidentSubscriber.updateMany({
      where: { id: { in: eligible.map((s) => s.id) } },
      data: { lastNotifiedAt: now },
    }).catch(() => {});

    await auditLog({
      action: "platform.incident.subscribers_notified",
      target: incident.id,
      payload: { kind, eligible: eligible.length, sent },
    }).catch(() => {});

    return { ok: true, count: sent };
  } catch {
    return { ok: false, error: "notify_failed", count: 0 };
  }
}

/**
 * Sprint 22 — notifica maintenance subscribers (mismo channel que incidents).
 * Component filter aplica igual que en incidents. kind: "T24" | "T0" | "complete".
 *
 * @param {object} window MaintenanceWindow row
 * @param {"T24"|"T0"|"complete"} kind
 */
export async function notifyMaintenanceSubscribers(window, kind = "T24") {
  if (!window?.id) return { ok: false, error: "bad_input", count: 0 };
  try {
    const orm = await db();
    const all = await orm.incidentSubscriber.findMany({ where: { verified: true } });
    // shouldNotifyForIncident toma incident-shape; window tiene components.
    // Reusamos con shape mínima compatible.
    const incidentShape = {
      components: window.components || [],
    };
    const eligible = all.filter((s) => shouldNotifyForIncident(s, incidentShape));
    if (eligible.length === 0) return { ok: true, count: 0 };

    let sent = 0;
    for (const s of eligible) {
      try {
        const unsubUrl = buildUnsubscribeUrl(s.unsubscribeToken, baseUrl());
        if (s.email) {
          // Usar sendIncidentNotification con incident-like wrapper para
          // mantener el rendering consistente. El subject distingue maintenance.
          const incidentLike = {
            id: window.id,
            title: window.title,
            body: window.body,
            severity: "minor", // maintenance no tiene severity
            status: kind === "complete" ? "resolved" : "investigating",
            components: window.components || [],
            startedAt: window.scheduledStart,
            resolvedAt: kind === "complete" ? (window.actualEnd || window.scheduledEnd) : null,
          };
          const subject = kind === "T24"
            ? `[MAINTENANCE — T-24h] ${window.title}`
            : kind === "T0"
              ? `[MAINTENANCE — STARTING] ${window.title}`
              : `[MAINTENANCE — COMPLETED] ${window.title}`;
          await sendIncidentNotification({
            to: s.email,
            subject,
            incident: incidentLike,
            kind: kind === "complete" ? "resolved" : "updated",
            unsubscribeUrl: unsubUrl,
          });
          sent++;
        } else if (s.webhookUrl) {
          await fetch(s.webhookUrl, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "user-agent": "BIO-IGNICION-StatusSubscriber/1.0",
            },
            body: JSON.stringify({
              event: `maintenance.${kind}`,
              window: {
                id: window.id,
                title: window.title,
                body: window.body,
                status: window.status,
                components: window.components || [],
                scheduledStart: window.scheduledStart,
                scheduledEnd: window.scheduledEnd,
                actualStart: window.actualStart || null,
                actualEnd: window.actualEnd || null,
              },
              unsubscribe: unsubUrl,
            }),
            signal: AbortSignal.timeout(8_000),
          }).catch(() => {});
          sent++;
        }
      } catch { /* best-effort */ }
    }

    await orm.incidentSubscriber.updateMany({
      where: { id: { in: eligible.map((s) => s.id) } },
      data: { lastNotifiedAt: new Date() },
    }).catch(() => {});

    await auditLog({
      action: "platform.maintenance.subscribers_notified",
      target: window.id,
      payload: { kind, eligible: eligible.length, sent },
    }).catch(() => {});

    return { ok: true, count: sent };
  } catch {
    return { ok: false, error: "notify_failed", count: 0 };
  }
}

/**
 * Lista para admin — incluye todos (verified + pending).
 */
export async function listSubscribers({ limit = 200 } = {}) {
  try {
    const orm = await db();
    return await orm.incidentSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(1, limit), 1000),
    });
  } catch {
    return [];
  }
}
