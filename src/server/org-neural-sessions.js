/* ═══════════════════════════════════════════════════════════════
   ORG NEURAL SESSIONS — query helpers

   Resuelve el patrón userId∈members. Las NeuralSessions se escriben
   con orgId = personal-{userId} (ver /api/sync/outbox/route.js:137),
   nunca con la B2B-org. Por eso, cualquier query de tipo "todas las
   sesiones del B2B org" debe primero traerse los userIds de los
   miembros, y luego filtrar NeuralSession por userId∈ese conjunto.

   Sprint 63 — abstracción tras 4 incidentes idénticos (Sprints 55,
   57, 59, 62). Usar SIEMPRE este helper en código nuevo. Hay un test
   guard en src/server/__tests__ que prohíbe `neuralSession.findMany(
   { where: { orgId } })` directo en código de producción.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";

/**
 * Devuelve NeuralSessions de TODOS los members activos del B2B org.
 *
 * @param {string} orgId — el B2B-org (no la personal-org)
 * @param {object} [opts]
 * @param {object} [opts.where]   — filtros adicionales (completedAt, protocolId, etc.)
 * @param {object} [opts.select]  — proyección Prisma
 * @param {object} [opts.orderBy] — orden Prisma
 * @param {number} [opts.take]    — límite
 * @param {number} [opts.skip]    — offset
 * @returns {Promise<Array>} sessions; [] si no hay members o orgId inválido
 */
export async function findSessionsForOrgMembers(orgId, opts = {}) {
  if (!orgId) return [];
  const orm = await db();
  const memberships = await orm.membership.findMany({
    where: { orgId, deactivatedAt: null },
    select: { userId: true },
  });
  const userIds = memberships.map((m) => m.userId);
  if (userIds.length === 0) return [];
  const { where = {}, ...rest } = opts;
  return orm.neuralSession.findMany({
    where: { userId: { in: userIds }, ...where },
    ...rest,
  });
}

/**
 * Resuelve solo los userIds activos del B2B org (los necesitas si
 * vas a hacer una query custom o agregaciones).
 *
 * @param {string} orgId
 * @returns {Promise<string[]>}
 */
export async function getActiveOrgMemberIds(orgId) {
  if (!orgId) return [];
  const orm = await db();
  const memberships = await orm.membership.findMany({
    where: { orgId, deactivatedAt: null },
    select: { userId: true },
  });
  return memberships.map((m) => m.userId);
}
