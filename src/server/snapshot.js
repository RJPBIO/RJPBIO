/* ═══════════════════════════════════════════════════════════════
   Phase 6F SP-A — buildUserSnapshot server-side
   ═══════════════════════════════════════════════════════════════
   Función reusable que las 3 ideas Phase 6F+ consumen:
     - Idea 1 NOM-035 ejecutivo (org aggregations cross-user)
     - Idea 2 burnout assessment (HRV + sessions + chronotype)
     - Idea 3 programas adaptativos (activeProgram + adherence)
     - Coach context (LLM puede consumir snapshot pre-resumido)

   Diseño:
     - Lee 6 tablas en paralelo (Promise.all).
     - Resiliente: tablas opcionales en memory adapter retornan [] sin crash.
     - Window configurable (default 90 días) — recortar en consumers.
     - chronotype derivado de neuralState.chronotype (mantenida por cliente).
     - activeProgram filtrado de programAssignments (completedAt+abandonedAt nulls).

   NO mutate. NO side-effects. Pura lectura.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";

const DAY_MS = 86400_000;

/**
 * Helper: invoca findMany sobre una tabla del orm. Si la tabla no existe
 * (memory adapter sin entry para ese modelo) o lanza, retorna [].
 */
async function safeFindMany(table, args) {
  if (!table || typeof table.findMany !== "function") return [];
  try {
    return await table.findMany(args);
  } catch {
    return [];
  }
}

/**
 * Construye snapshot consolidado del state user para uso server-side.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @param {Date|number} [opts.now=Date.now()]
 * @param {number} [opts.days=90]  ventana de recall (sessions/hrv/instruments)
 * @returns {Promise<UserSnapshot|null>}  null si user no existe
 */
export async function buildUserSnapshot(userId, opts = {}) {
  if (!userId || typeof userId !== "string") return null;
  const orm = await db();

  const nowMs = opts.now instanceof Date ? opts.now.getTime() : (opts.now || Date.now());
  const days = Number.isFinite(opts.days) && opts.days > 0 ? Math.floor(opts.days) : 90;
  const since = new Date(nowMs - days * DAY_MS);

  const [user, sessions, hrv, instruments, nom35Latest, programAssignments] = await Promise.all([
    // User core + memberships embedded.
    (async () => {
      try {
        return await orm.user.findUnique({ where: { id: userId } });
      } catch {
        return null;
      }
    })(),
    // NeuralSession en ventana — base para burnout signals + adherence outcomes.
    safeFindMany(orm.neuralSession, {
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
    }),
    // HRV en ventana — tabla puede no existir en memory adapter (returns []).
    safeFindMany(orm.hrvMeasurement, {
      where: { userId, measuredAt: { gte: since } },
      orderBy: { measuredAt: "desc" },
    }),
    // Instrumentos en ventana — pss-4, swemwbs-7, phq-2, rmeq.
    safeFindMany(orm.instrument, {
      where: { userId, takenAt: { gte: since } },
      orderBy: { takenAt: "desc" },
    }),
    // Última respuesta NOM-035 (legacy MX compliance, opcional).
    safeFindMany(orm.nom35Response, {
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 1,
    }),
    // Program assignments — todos los del user; consumer filtra active vs history.
    safeFindMany(orm.programAssignment, {
      where: { userId },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  if (!user) return null;

  // Memberships: la tabla User no necesariamente embebe memberships (depende
  // del adapter). Hacemos query independiente para tener orgId/teamId/role.
  let memberships = [];
  try {
    memberships = await orm.membership.findMany({
      where: { userId, deactivatedAt: null },
    });
  } catch {
    memberships = [];
  }
  // Primera no-personal preferred — si todas son personales, usa la primera.
  const m =
    memberships.find((mm) => mm.org && !mm.org.personal) ||
    memberships[0] ||
    null;

  // Chronotype lives en neuralState (managed by client, mirrored al sync).
  // Shape per buildChronotypeRecord en src/lib/instruments.js:
  //   { type, category, label, score, bestTimeWindow, ts }
  const chronotype = (user.neuralState && typeof user.neuralState === "object")
    ? user.neuralState.chronotype || null
    : null;

  // Active program: el primero sin completedAt y sin abandonedAt.
  // Si hay >1 (no debería, pero defensivo) tomamos el más reciente startedAt.
  const active = (Array.isArray(programAssignments) ? programAssignments : [])
    .filter((p) => p && !p.completedAt && !p.abandonedAt);
  const activeProgram = active.length ? active[0] : null;
  const programHistory = (Array.isArray(programAssignments) ? programAssignments : [])
    .filter((p) => p && (p.completedAt || p.abandonedAt));

  return {
    user: {
      id: user.id,
      email: user.email || null,
      timezone: user.timezone || "America/Mexico_City",
      locale: user.locale || "es",
      orgId: m?.orgId || null,
      teamId: m?.teamId || null,
      role: m?.role || null,
    },
    sessions: Array.isArray(sessions) ? sessions : [],
    hrv: Array.isArray(hrv) ? hrv : [],
    instruments: Array.isArray(instruments) ? instruments : [],
    nom35: Array.isArray(nom35Latest) && nom35Latest.length ? nom35Latest[0] : null,
    chronotype,
    activeProgram,
    programHistory,
    snapshotAt: new Date(nowMs),
    windowDays: days,
  };
}

/**
 * Versión liviana para batch processing (e.g. nightly cron de burnout-scan).
 * Skip nom35 + programHistory; retorna sólo lo crítico para una decisión
 * por user en O(<10ms) por iteración.
 *
 * @param {string} userId
 * @param {object} [opts]
 * @returns {Promise<UserSnapshotLite|null>}
 */
export async function buildUserSnapshotLite(userId, opts = {}) {
  if (!userId || typeof userId !== "string") return null;
  const orm = await db();
  const nowMs = opts.now instanceof Date ? opts.now.getTime() : (opts.now || Date.now());
  const days = Number.isFinite(opts.days) && opts.days > 0 ? Math.floor(opts.days) : 30;
  const since = new Date(nowMs - days * DAY_MS);

  const [user, sessions, hrv] = await Promise.all([
    (async () => {
      try {
        return await orm.user.findUnique({ where: { id: userId } });
      } catch {
        return null;
      }
    })(),
    safeFindMany(orm.neuralSession, {
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
    }),
    safeFindMany(orm.hrvMeasurement, {
      where: { userId, measuredAt: { gte: since } },
      orderBy: { measuredAt: "desc" },
    }),
  ]);

  if (!user) return null;

  const chronotype = (user.neuralState && typeof user.neuralState === "object")
    ? user.neuralState.chronotype || null
    : null;

  return {
    user: { id: user.id, timezone: user.timezone || "America/Mexico_City" },
    sessions: Array.isArray(sessions) ? sessions : [],
    hrv: Array.isArray(hrv) ? hrv : [],
    chronotype,
    snapshotAt: new Date(nowMs),
    windowDays: days,
  };
}
