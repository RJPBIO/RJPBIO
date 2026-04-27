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
 * Effectiveness por protocolo: combina adoption (count, distinct users) con
 * impacto observable (mood delta, coherencia delta) cuando hay datos.
 *
 * K-anonymity: protocolos con menos de `kmin` usuarios distintos quedan
 * suprimidos (no se reportan métricas individuales). Esto protege a usuarios
 * en organizaciones pequeñas o con protocolos raros.
 *
 * @param {Array<SessionRecord>} sessions
 *   Cada session: {userId, protocolId, moodPre?, moodPost?, coherenciaDelta?}
 * @param {object} [options]
 * @param {number} [options.kmin] - usuarios distintos mínimos por protocolo (default 5)
 * @param {number} [options.topN] - máximo de protocolos a retornar (default 8)
 * @returns {Array<ProtocolEffectiveness>} ordenado por mood delta desc
 */
export function computeProtocolEffectiveness(sessions, options = {}) {
  const kmin = options.kmin ?? KMIN;
  const topN = options.topN ?? 8;
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  const byProto = new Map();
  for (const s of sessions) {
    if (!s || !s.protocolId) continue;
    const proto = s.protocolId;
    if (!byProto.has(proto)) {
      byProto.set(proto, {
        protocol: proto,
        count: 0,
        users: new Set(),
        moodDeltas: [],
        coherenciaDeltas: [],
      });
    }
    const bucket = byProto.get(proto);
    bucket.count++;
    if (s.userId) bucket.users.add(s.userId);
    if (typeof s.moodPre === "number" && typeof s.moodPost === "number") {
      bucket.moodDeltas.push(s.moodPost - s.moodPre);
    }
    if (typeof s.coherenciaDelta === "number") {
      bucket.coherenciaDeltas.push(s.coherenciaDelta);
    }
  }

  const results = [];
  for (const bucket of byProto.values()) {
    const distinctUsers = bucket.users.size;
    const item = {
      protocol: bucket.protocol,
      count: bucket.count,
      distinctUsers,
      suppressed: distinctUsers < kmin,
    };
    if (item.suppressed) {
      item.reason = `k<${kmin} usuarios distintos`;
      results.push(item);
      continue;
    }
    if (bucket.moodDeltas.length >= 3) {
      const n = bucket.moodDeltas.length;
      const sum = bucket.moodDeltas.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      // Sprint 52 — sample variance (n-1) para inferencia, no population (n).
      const sampleVar = bucket.moodDeltas.reduce((a, d) => a + (d - mean) * (d - mean), 0) / Math.max(1, n - 1);
      const sd = Math.sqrt(sampleVar);
      // 95% CI (z=1.96 gaussian aproximation; con n≥3 sub-estima ligeramente
      // vs t-distribution pero evita lookup tables y dep adicional).
      const margin = 1.96 * (sd / Math.sqrt(n));
      const ciLower = mean - margin;
      const ciUpper = mean + margin;
      // Cohen's d (Cohen 1988): magnitud de impacto independiente de n.
      // small=0.2, medium=0.5, large=0.8.
      // Caso especial: sd=0 (todos los deltas idénticos). Cohen's d formal
      // es indefinido pero la interpretación práctica es "consistencia
      // perfecta" — tratamos como large si mean ≠ 0, trivial si mean = 0.
      const cohensD = sd > 0 ? mean / sd : (mean === 0 ? 0 : Math.sign(mean) * 9.99);
      const cohensDLabel = Math.abs(cohensD) >= 0.8 ? "large"
        : Math.abs(cohensD) >= 0.5 ? "medium"
        : Math.abs(cohensD) >= 0.2 ? "small"
        : "trivial";
      // Significance: CI95 excluye 0 → diferencia estadísticamente detectable
      const significant = ciLower > 0 || ciUpper < 0;

      item.moodDelta = +mean.toFixed(2);
      item.moodDeltaStdev = +sd.toFixed(2);
      item.moodSampleSize = n;
      item.ci95Lower = +ciLower.toFixed(2);
      item.ci95Upper = +ciUpper.toFixed(2);
      item.cohensD = +cohensD.toFixed(2);
      item.effectSize = cohensDLabel;
      item.significant = significant;
      // Hit rate: % sesiones con delta positivo (impacto observable)
      const hits = bucket.moodDeltas.filter((d) => d > 0).length;
      item.hitRate = +(hits / n).toFixed(3);
    }
    if (bucket.coherenciaDeltas.length >= 3) {
      const mean = bucket.coherenciaDeltas.reduce((a, b) => a + b, 0) / bucket.coherenciaDeltas.length;
      item.coherenciaDelta = +mean.toFixed(2);
      item.coherenciaSampleSize = bucket.coherenciaDeltas.length;
    }
    results.push(item);
  }

  // Ordenar: primero los reportables (no-suppressed) por mood delta desc;
  // luego los suprimidos (para transparencia de cuántos faltan).
  results.sort((a, b) => {
    if (a.suppressed !== b.suppressed) return a.suppressed ? 1 : -1;
    const ma = typeof a.moodDelta === "number" ? a.moodDelta : -Infinity;
    const mb = typeof b.moodDelta === "number" ? b.moodDelta : -Infinity;
    if (mb !== ma) return mb - ma;
    return b.count - a.count; // tiebreak por adoption
  });

  return results.slice(0, topN);
}

/**
 * @typedef {object} SessionRecord
 * @property {string} userId
 * @property {string} protocolId
 * @property {number} [moodPre]
 * @property {number} [moodPost]
 * @property {number} [coherenciaDelta]
 */

/**
 * @typedef {object} ProtocolEffectiveness
 * @property {string} protocol
 * @property {number} count
 * @property {number} distinctUsers
 * @property {boolean} suppressed
 * @property {string} [reason]
 * @property {number} [moodDelta]
 * @property {number} [moodDeltaStdev]
 * @property {number} [moodSampleSize]
 * @property {number} [ci95Lower] - Sprint 52: límite inferior 95% CI
 * @property {number} [ci95Upper] - Sprint 52: límite superior 95% CI
 * @property {number} [cohensD]   - Sprint 52: effect size Cohen's d
 * @property {"trivial"|"small"|"medium"|"large"} [effectSize] - Sprint 52
 * @property {boolean} [significant] - Sprint 52: CI95 excluye 0
 * @property {number} [hitRate]
 * @property {number} [coherenciaDelta]
 * @property {number} [coherenciaSampleSize]
 */

/**
 * @typedef {object} OrgNeuralHealth
 * @property {number} totalMembers
 * @property {number} activeMembers
 * @property {boolean} suppressed
 * @property {string} [reason]
 * ...
 */
