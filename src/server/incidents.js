/* ═══════════════════════════════════════════════════════════════
   Incidents — server-side CRUD + audit + state machine guard.
   ═══════════════════════════════════════════════════════════════
   Pure validators y RSS render en lib/incidents.js. Aquí persistencia.

   Auth: PLATFORM_ADMIN_EMAILS env var separated by commas (case-insensitive).
   Sólo platform staff (no clientes B2B) crea/edita incidents — afectan
   a todos los tenants.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { auditLog } from "./audit";
import { canTransitionStatus } from "@/lib/incidents";

/**
 * ¿El email del actor está en PLATFORM_ADMIN_EMAILS env? Lista de
 * emails separados por coma. Vacío = nadie autorizado (cierra el flow
 * en producción si no se configura). Para dev/staging, configurar.
 */
export function isPlatformAdmin(email) {
  if (!email) return false;
  const allowed = (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return false;
  return allowed.includes(String(email).trim().toLowerCase());
}

export async function createIncident({ title, body, severity, components, creatorEmail }) {
  if (!title || !severity) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const incident = await orm.incident.create({
      data: {
        title, body: body || null, severity,
        components: components || [],
        creatorId: creatorEmail || null,
      },
    });
    await auditLog({
      action: "platform.incident.created",
      actorEmail: creatorEmail || null,
      target: incident.id,
      payload: { title, severity, components: components || [] },
    }).catch(() => {});
    return { ok: true, incident };
  } catch {
    return { ok: false, error: "create_failed" };
  }
}

export async function addIncidentUpdate({ incidentId, status, body, authorEmail }) {
  if (!incidentId || !status || !body) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const incident = await orm.incident.findUnique({ where: { id: incidentId } });
    if (!incident) return { ok: false, error: "not_found" };
    if (!canTransitionStatus(incident.status, status) && incident.status !== status) {
      return { ok: false, error: "invalid_transition" };
    }

    const now = new Date();
    const isResolving = status === "resolved" && incident.status !== "resolved";

    const [update] = await orm.$transaction([
      orm.incidentUpdate.create({
        data: { incidentId, status, body, authorId: authorEmail || null },
      }),
      orm.incident.update({
        where: { id: incidentId },
        data: {
          status,
          updatedAt: now,
          ...(isResolving ? { resolvedAt: now } : {}),
        },
      }),
    ]);

    await auditLog({
      action: isResolving ? "platform.incident.resolved" : "platform.incident.updated",
      actorEmail: authorEmail || null,
      target: incidentId,
      payload: { status, bodySnippet: body.slice(0, 200) },
    }).catch(() => {});

    return { ok: true, update };
  } catch {
    return { ok: false, error: "update_failed" };
  }
}

/**
 * Lista incidents para /status. Activos + recently-resolved.
 * @param {object} [opts]
 * @param {number} [opts.recentDays=14]
 * @param {number} [opts.limit=100]
 */
export async function listStatusIncidents({ recentDays = 14, limit = 100 } = {}) {
  try {
    const orm = await db();
    const cutoff = new Date(Date.now() - recentDays * 86400_000);
    return await orm.incident.findMany({
      where: {
        OR: [
          { status: { not: "resolved" } },
          { resolvedAt: { gte: cutoff } },
        ],
      },
      orderBy: [{ startedAt: "desc" }],
      take: Math.min(Math.max(1, limit), 500),
      include: {
        updates: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch {
    return [];
  }
}

/**
 * Lista para admin UI — incluye todos sin filtrar.
 */
export async function listAllIncidents({ limit = 100 } = {}) {
  try {
    const orm = await db();
    return await orm.incident.findMany({
      orderBy: [{ startedAt: "desc" }],
      take: Math.min(Math.max(1, limit), 500),
      include: {
        updates: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch {
    return [];
  }
}

/**
 * Single incident por id, con updates ordenados.
 */
export async function getIncident(id) {
  if (!id) return null;
  try {
    const orm = await db();
    return await orm.incident.findUnique({
      where: { id },
      include: { updates: { orderBy: { createdAt: "asc" } } },
    });
  } catch {
    return null;
  }
}
