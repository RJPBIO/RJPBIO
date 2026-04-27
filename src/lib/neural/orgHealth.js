/* ═══════════════════════════════════════════════════════════════
   orgHealth — agregación org-level del estado del motor adaptativo
   ═══════════════════════════════════════════════════════════════
   Sprint 43: el operador (OWNER/ADMIN del org) puede ver cómo está
   funcionando el motor adaptativo a través de su organización.

   PRIVACIDAD: este módulo opera sobre per-user counts ya colectados.
   NO accede a moodLog ni datos personales detallados — solo:
     - cantidad de sesiones por usuario
     - timestamp de última sesión
     - protocolo más usado por user
     - distribución de protocolos (anónima, agregada)

   K-anonymity: si el org tiene < KMIN miembros activos, suprimimos
   métricas que pudieran identificar individuos. Mismo principio que
   nom35 aggregate.
   ═══════════════════════════════════════════════════════════════ */

import { NEURAL_CONFIG as NC } from "./config";

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;

const KMIN = 5; // mínimo de usuarios activos para reportar agregados

/**
 * Computa stats org-level del motor adaptativo.
 *
 * @param {Array<UserSummary>} users - Cada user con sus stats per-user
 *   (computados upstream desde audit/analytics, NO desde moodLog crudo).
 * @param {object} [options]
 * @param {Date}   [options.now]
 * @returns {OrgNeuralHealth}
 */
export function computeOrgNeuralHealth(users, options = {}) {
  const now = options.now ?? new Date();
  const list = Array.isArray(users) ? users.filter(Boolean) : [];

  // Solo contamos usuarios que tuvieron alguna sesión EN cualquier momento.
  const active = list.filter((u) => (u.totalSessions || 0) > 0);
  const totalMembers = list.length;
  const activeMembers = active.length;

  // K-anonymity guard: bajo umbral, suprimimos detalles.
  if (activeMembers < KMIN) {
    return {
      totalMembers,
      activeMembers,
      suppressed: true,
      reason: `Muestra insuficiente para reportar (k<${KMIN}, hay ${activeMembers} miembros activos)`,
      now: now.toISOString(),
    };
  }

  // Maturity distribution
  const cs = NC.health.coldStartSessions;   // 5
  const ls = NC.health.learningSessions;    // 20
  const buckets = { coldStart: 0, learning: 0, personalized: 0 };
  for (const u of active) {
    const n = u.totalSessions || 0;
    if (n < cs) buckets.coldStart++;
    else if (n < ls) buckets.learning++;
    else buckets.personalized++;
  }

  // Staleness distribution — basado en daysSinceLast
  const stale = { fresh: 0, active: 0, cooling: 0, stale: 0, abandoned: 0 };
  let recalibrationNeeded = 0;
  for (const u of active) {
    const lastTs = u.lastSessionTs;
    if (typeof lastTs !== "number") { stale.abandoned++; recalibrationNeeded++; continue; }
    const days = Math.floor((now.getTime() - lastTs) / DAY_MS);
    if (days <= 7) stale.fresh++;
    else if (days <= 14) stale.active++;
    else if (days <= 30) { stale.cooling++; recalibrationNeeded++; }
    else if (days <= 60) { stale.stale++; recalibrationNeeded++; }
    else { stale.abandoned++; recalibrationNeeded++; }
  }

  // Engagement: avg sessions per active user, last 30d activity
  const totalSessions = active.reduce((a, u) => a + (u.totalSessions || 0), 0);
  const avgSessionsPerUser = +(totalSessions / activeMembers).toFixed(1);

  const last30dActive = active.filter((u) => {
    const ts = u.lastSessionTs;
    return typeof ts === "number" && (now.getTime() - ts) <= 30 * DAY_MS;
  }).length;

  // Top protocols (orgwide)
  const protoCounts = {};
  for (const u of active) {
    if (!u.protocolHistogram) continue;
    for (const [p, c] of Object.entries(u.protocolHistogram)) {
      protoCounts[p] = (protoCounts[p] || 0) + c;
    }
  }
  const topProtocols = Object.entries(protoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([protocol, count]) => ({ protocol, count, share: +(count / totalSessions).toFixed(3) }));

  // Health verdict — composición de riesgo agregado
  const recalibPct = recalibrationNeeded / activeMembers;
  const personalizedPct = buckets.personalized / activeMembers;
  const verdict =
    recalibPct >= 0.5 ? "at-risk"
    : personalizedPct >= 0.5 ? "mature"
    : buckets.coldStart / activeMembers >= 0.5 ? "early"
    : "developing";

  // Recommended actions for the operator
  const actions = [];
  if (recalibPct >= 0.3) {
    actions.push({
      kind: "warn",
      title: `${Math.round(recalibPct * 100)}% del org necesita recalibración`,
      detail: "Considera lanzar campaña de re-engagement o ajustar reminders push.",
    });
  }
  if (last30dActive / activeMembers < 0.5 && activeMembers >= 10) {
    actions.push({
      kind: "warn",
      title: "Engagement 30d bajo",
      detail: `Solo ${last30dActive}/${activeMembers} miembros activos en últimos 30 días. Revisa cadencia de sesiones obligatorias.`,
    });
  }
  if (buckets.personalized === 0 && activeMembers >= 10) {
    actions.push({
      kind: "info",
      title: "Ningún miembro alcanzó motor personalizado",
      detail: `Necesitas ≥${ls} sesiones por usuario para que el motor entre en modo personalizado.`,
    });
  }
  if (!actions.length) {
    actions.push({
      kind: "ok",
      title: "Org operando dentro de rangos saludables",
      detail: "Continúa monitoreando. Re-evalúa en 30 días.",
    });
  }

  return {
    totalMembers,
    activeMembers,
    activeIn30d: last30dActive,
    avgSessionsPerUser,
    totalSessions,

    maturity: buckets,
    maturityPct: {
      coldStart: +(buckets.coldStart / activeMembers).toFixed(3),
      learning: +(buckets.learning / activeMembers).toFixed(3),
      personalized: +(buckets.personalized / activeMembers).toFixed(3),
    },

    staleness: stale,
    recalibrationNeeded,
    recalibrationPct: +recalibPct.toFixed(3),

    topProtocols,

    verdict,
    actions,

    suppressed: false,
    now: now.toISOString(),
  };
}

/**
 * @typedef {object} UserSummary
 * @property {string} userId
 * @property {number} totalSessions
 * @property {number|null} lastSessionTs - ms epoch
 * @property {Object<string, number>} [protocolHistogram] - { "protoName": count }
 */

/**
 * @typedef {object} OrgNeuralHealth
 * @property {number} totalMembers
 * @property {number} activeMembers
 * @property {boolean} suppressed
 * @property {string} [reason]
 * ...
 */
