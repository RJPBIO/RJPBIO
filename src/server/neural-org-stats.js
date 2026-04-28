/* ═══════════════════════════════════════════════════════════════
   neural-org-stats — recolecta per-user summaries del org y delega
   a lib/neural/orgHealth para el cálculo agregado.

   Sprint 43.

   Privacidad: NO leemos moodLog ni datos personales detallados (esos
   viven en client local-first). Solo NeuralSession (orgId, userId,
   protocolId, completedAt) — datos que el usuario ya consintió compartir
   por su membresía en el org.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { computeOrgNeuralHealth, computeProtocolEffectiveness } from "@/lib/neural/orgHealth";
import { computeCohortPrior } from "@/lib/neural/coldStart";

/**
 * Recolecta UserSummary[] del org y agrega vía orgHealth.
 *
 * @param {string} orgId
 * @returns {Promise<OrgNeuralHealth>}
 */
export async function getOrgNeuralHealth(orgId) {
  if (!orgId) return null;
  try {
    const orm = await db();

    // Total members en el org (independiente de actividad).
    const memberships = await orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
      select: { userId: true },
    });
    const userIds = memberships.map((m) => m.userId);
    if (userIds.length === 0) return computeOrgNeuralHealth([]);

    // BUG FIX (Sprint 62): NeuralSession.orgId es la personal-org del user,
    // no la B2B-org (ver /api/sync/outbox/route.js:137). Query por
    // {orgId: B2B} devolvía [] → /admin/neural mostraba "0 sesiones" con
    // users activos. Mismo patrón que Sprint 55/59. Fix: query por
    // userId∈members del B2B org.
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const sessions = await orm.neuralSession.findMany({
      where: {
        userId: { in: userIds },
        completedAt: { gte: oneYearAgo },
      },
      select: {
        userId: true,
        protocolId: true,
        completedAt: true,
        moodPre: true,
        moodPost: true,
        coherenciaDelta: true,
      },
    });

    // Build per-user summary
    const byUser = new Map();
    for (const uid of userIds) {
      byUser.set(uid, {
        userId: uid,
        totalSessions: 0,
        lastSessionTs: null,
        protocolHistogram: {},
      });
    }
    for (const s of sessions) {
      const u = byUser.get(s.userId);
      if (!u) continue; // sesión de user que ya no es miembro
      u.totalSessions++;
      const ts = s.completedAt instanceof Date ? s.completedAt.getTime() : Date.parse(s.completedAt);
      if (typeof ts === "number" && (u.lastSessionTs === null || ts > u.lastSessionTs)) {
        u.lastSessionTs = ts;
      }
      if (s.protocolId) {
        u.protocolHistogram[s.protocolId] = (u.protocolHistogram[s.protocolId] || 0) + 1;
      }
    }

    const orgHealth = computeOrgNeuralHealth(Array.from(byUser.values()));
    if (orgHealth.suppressed) {
      // Si la org entera está bajo k, no exponemos protocol effectiveness.
      return orgHealth;
    }
    const protocolEffectiveness = computeProtocolEffectiveness(sessions);
    return { ...orgHealth, protocolEffectiveness };
  } catch (e) {
    return {
      totalMembers: 0,
      activeMembers: 0,
      suppressed: true,
      reason: "Error al recolectar datos del org",
      error: String(e).slice(0, 120),
    };
  }
}

/**
 * Sprint 48 — Cohort prior para new users.
 *
 * Aggregates moodPre/moodPost por bucket × intent. K-anonymity ≥5 usuarios
 * distintos por celda. Útil para blending en cold-start de un usuario nuevo
 * en el org. NO expone datos individuales — solo agregados por celda.
 *
 * @param {string} orgId
 * @returns {Promise<{table, totalSessions, totalUsers, kmin}|null>}
 */
export async function getOrgCohortPrior(orgId) {
  if (!orgId) return null;
  try {
    const orm = await db();
    // BUG FIX (Sprint 62): mismo patrón Sprint 55/59 — NeuralSession.orgId
    // es personal-org. Cohort prior del B2B salía vacío silently → cold-start
    // de new users no recibía blending real. Fix: query por userId∈members.
    const memberships = await orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
      select: { userId: true },
    });
    const userIds = memberships.map((m) => m.userId);
    if (userIds.length === 0) return computeCohortPrior([]);

    // Solo sesiones de últimos 6 meses para que el prior refleje rutinas
    // actuales del org (post Sprint 47 también haría sentido decay temporal).
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const sessions = await orm.neuralSession.findMany({
      where: {
        userId: { in: userIds },
        completedAt: { gte: sixMonthsAgo },
        moodPre: { not: null },
        moodPost: { not: null },
      },
      select: {
        userId: true,
        protocolId: true,
        completedAt: true,
        moodPre: true,
        moodPost: true,
      },
    });
    return computeCohortPrior(sessions);
  } catch {
    return null;
  }
}
