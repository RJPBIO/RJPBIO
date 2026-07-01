/* ═══════════════════════════════════════════════════════════════
   Phase 6F SP-C — buildExecutiveReport server-side
   ═══════════════════════════════════════════════════════════════
   Construye el reporte ejecutivo NOM-035 + biometría agregada para
   un org B2B. Decision A locked: ventana 90d default; extensible a
   180d/365d via opts.days.

   Patrones críticos respetados:
     · NeuralSession.orgId = personal-org del user (BUG FIX Sprint 62 en
       neural-org-stats.js). Query B2B por userId ∈ memberships, NO
       por orgId == B2B-org.
     · K-anon ≥ 5 enforced en TODAS las agregaciones (NOM-035, instruments,
       HRV, programs cohort, correlation).
     · safeFindMany resilient cuando memory adapter no expone tabla
       (hrvMeasurement, nom35Response no están en memory adapter actual).
     · No expone PII — solo agregados con count + means + bounds.

   K-anon convention: cada bloque retorna `suppressed: true, reason:
   "k_anonymity"` cuando la cohorte cae bajo MIN_K. NO oculta el bloque
   completo (el consumer renderea "sin muestra suficiente").
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { decryptHrvRows } from "./encrypted-fields";
import { aggregateScores } from "@/lib/nom35/scoring";
import { aggregateInstrument } from "@/lib/instruments";
import { aggregateHrvDeltas } from "@/lib/hrvDelta";
import { computeProtocolEffectiveness } from "@/lib/effectiveness";
import { DOMINIOS } from "@/lib/nom35/items";
import { getProgramById } from "@/lib/programs";

const DAY_MS = 86400_000;
const WEEK_MS = 7 * DAY_MS;
const MIN_K = 5;

const ALL_DOMINIO_IDS = Object.values(DOMINIOS).map((d) => d.id);

async function safeFindMany(table, args) {
  if (!table || typeof table.findMany !== "function") return [];
  try {
    return await table.findMany(args);
  } catch {
    return [];
  }
}

function toMs(d) {
  if (!d) return null;
  return d instanceof Date ? d.getTime() : Date.parse(d);
}

function mean(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  let n = 0, sum = 0;
  for (const v of arr) {
    if (typeof v === "number" && Number.isFinite(v)) { sum += v; n += 1; }
  }
  return n > 0 ? sum / n : null;
}

/**
 * @param {string} orgId
 * @param {object} [opts]
 * @param {Date|number} [opts.now=Date.now()]
 * @param {number} [opts.days=90]  ventana de recall (7..365)
 * @returns {Promise<ExecutiveReport|null>}
 */
export async function buildExecutiveReport(orgId, opts = {}) {
  if (!orgId || typeof orgId !== "string") return null;

  const orm = await db();
  const nowMs = opts.now instanceof Date ? opts.now.getTime() : (opts.now || Date.now());
  const days = Number.isFinite(opts.days) && opts.days > 0
    ? Math.min(365, Math.max(7, Math.floor(opts.days)))
    : 90;
  const periodStart = new Date(nowMs - days * DAY_MS);
  const periodEnd = new Date(nowMs);

  // 1. Lookup org
  let org = null;
  try {
    org = await orm.org.findUnique({ where: { id: orgId } });
  } catch {
    org = null;
  }
  if (!org) return null;

  // 2. Memberships activas (no deactivated, no personal-org membership pero el
  //    org B2B mismo no es personal — los users pueden tener doble membership)
  let memberships = [];
  try {
    memberships = await orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
    });
  } catch {
    memberships = [];
  }
  const userIds = memberships.map((m) => m.userId).filter(Boolean);
  const totalActiveMembers = userIds.length;

  // K-anon top-level: si menos de MIN_K members, suprimir reporte entero.
  if (totalActiveMembers < MIN_K) {
    return {
      org: {
        id: org.id,
        name: org.name,
        plan: org.plan,
        activeMembers: totalActiveMembers,
      },
      period: { start: periodStart, end: periodEnd, days },
      suppressed: true,
      reason: "k_anonymity",
      message: `Reporte requiere mínimo ${MIN_K} miembros activos. Tu organización tiene ${totalActiveMembers}.`,
      snapshot: { generatedAt: periodEnd, version: "v1", kAnonThreshold: MIN_K },
    };
  }

  // 3. Parallel fetch — TODAS las queries usan userId ∈ userIds (no orgId direct).
  //    Razón: NeuralSession.orgId es personal-org del user (BUG FIX Sprint 62);
  //    HrvMeasurement/Instrument/Nom35Response también pueden tener orgId null.
  //    Por consistencia agregamos por userId membership del B2B.
  const [sessions, hrv, instruments, nom35, programs] = await Promise.all([
    safeFindMany(orm.neuralSession, {
      where: { userId: { in: userIds }, completedAt: { gte: periodStart } },
      orderBy: { completedAt: "desc" },
    }),
    safeFindMany(orm.hrvMeasurement, {
      where: { userId: { in: userIds }, measuredAt: { gte: periodStart } },
      orderBy: { measuredAt: "desc" },
    }).then(decryptHrvRows),
    safeFindMany(orm.instrument, {
      where: { userId: { in: userIds }, takenAt: { gte: periodStart } },
      orderBy: { takenAt: "desc" },
    }),
    safeFindMany(orm.nom35Response, {
      where: { userId: { in: userIds }, completedAt: { gte: periodStart } },
      orderBy: { completedAt: "desc" },
    }),
    safeFindMany(orm.programAssignment, {
      where: { userId: { in: userIds }, startedAt: { gte: periodStart } },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  // 4. NOM-035 summary (k-anon ≥ 5 enforced internamente por aggregateScores).
  const nom35Rows = nom35.map((r) => ({
    total: r.total,
    porDominio: r.porDominio,
    porCategoria: r.porCategoria,
    nivel: r.nivel,
  }));
  const nom35Summary = aggregateScores(nom35Rows, { minN: MIN_K });
  const nom35Trends = buildNom35Trends(nom35, periodStart, periodEnd);

  // 5. Instruments aggregation per id (PSS-4, WEMWBS-7, PHQ-2).
  const instrumentRows = instruments.map((i) => ({
    instrumentId: i.instrumentId,
    score: i.score,
    level: i.level,
    ts: toMs(i.takenAt),
  }));
  const instrumentsSummary = {
    pss4: aggregateInstrument(instrumentRows, "pss-4", { minK: MIN_K }),
    wemwbs7: aggregateInstrument(instrumentRows, "wemwbs-7", { minK: MIN_K }),
    phq2: aggregateInstrument(instrumentRows, "phq-2", { minK: MIN_K }),
  };
  const instrumentsTrends = buildInstrumentTrends(instrumentRows, periodStart, periodEnd);

  // 6. HRV trends (rolling weekly mean RMSSD with k≥5 unique users).
  const hrvTrends = buildHrvTrends(hrv, periodStart, periodEnd);

  // 7. Sessions metrics + protocol effectiveness.
  //    Mapear DB shape (moodPre, moodPost, coherenciaDelta, completedAt) al
  //    shape esperado por effectiveness.js (s.pre, s.mood, s.coh, s.ts).
  const sessionsMapped = sessions.map((s) => ({
    pre: s.moodPre,
    mood: s.moodPost,
    coh: s.coherenciaDelta,
    p: s.protocolId,
    ts: toMs(s.completedAt),
    userId: s.userId,
  }));
  const sessionsMetrics = buildSessionsMetrics(sessionsMapped, totalActiveMembers);
  const protocolsTop = buildTopProtocols(sessionsMapped, MIN_K);

  // 8. Programs cohort pre/post.
  const programsCohort = await buildProgramsCohort({
    orm,
    programs,
    userIds,
    periodStart,
    minN: MIN_K,
  });

  // 9. Engagement.
  const engagement = buildEngagementMetrics(sessionsMapped, totalActiveMembers, nowMs);

  // 10. HRV ↔ NOM-035 correlation per-user means, Pearson r if k≥5.
  const correlation = buildHrvNom35Correlation(hrv, nom35, MIN_K);

  // 11. KPIs top-level.
  const kpis = {
    activeMembers: totalActiveMembers,
    sessionsTotal: sessions.length,
    sessionsPerActiveMember: totalActiveMembers > 0
      ? +(sessions.length / totalActiveMembers).toFixed(2)
      : 0,
    hrvDeltaMean: sessionsMetrics.cohDeltaMean, // Δcoherencia (Δ HRV phase-lock proxy)
    moodDeltaMean: sessionsMetrics.moodDeltaMean,
    programCompletionRate: programsCohort.completionRate,
    nom35Level: nom35Summary?.suppressed ? null : (nom35Summary?.nivelPromedio || null),
  };

  return {
    org: {
      id: org.id,
      name: org.name,
      plan: org.plan,
      activeMembers: totalActiveMembers,
    },
    period: { start: periodStart, end: periodEnd, days },
    kpis,
    nom35: {
      summary: nom35Summary,
      trends: nom35Trends,
    },
    instruments: {
      summary: instrumentsSummary,
      trends: instrumentsTrends,
    },
    hrv: hrvTrends,
    sessions: sessionsMetrics,
    topProtocols: protocolsTop,
    programs: programsCohort,
    engagement,
    correlation,
    snapshot: {
      generatedAt: periodEnd,
      version: "v1",
      kAnonThreshold: MIN_K,
    },
  };
}

/* ─── Helpers privados ─────────────────────────────────────────── */

/**
 * Trends weekly por dominio NOM-035 (10 dominios). Cada semana retorna
 * { week, date, value, n, suppressed } donde value es mean del puntaje
 * por dominio. K-anon por celda: si responses<5 en la semana, suppressed.
 */
function buildNom35Trends(responses, periodStart, periodEnd) {
  const trends = {};
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const totalWeeks = Math.max(1, Math.ceil((endMs - startMs) / WEEK_MS));

  // Fix escala O(n×w): agrupa las respuestas por semana UNA vez (O(n)) en
  // vez de escanear toda la lista por cada dominio×semana (10×semanas×n).
  const byWeek = Array.from({ length: totalWeeks }, () => []);
  for (const r of responses) {
    const ts = toMs(r.completedAt);
    if (ts == null || ts < startMs || ts >= endMs) continue;
    const w = Math.floor((ts - startMs) / WEEK_MS);
    if (w >= 0 && w < totalWeeks) byWeek[w].push(r);
  }

  for (const dominioId of ALL_DOMINIO_IDS) {
    trends[dominioId] = [];
    for (let w = 0; w < totalWeeks; w++) {
      const weekStartMs = startMs + w * WEEK_MS;
      const inWeek = byWeek[w];
      if (inWeek.length < MIN_K) {
        trends[dominioId].push({
          week: w,
          date: new Date(weekStartMs),
          suppressed: true,
          n: inWeek.length,
        });
        continue;
      }
      const values = inWeek
        .map((r) => {
          const dom = r.porDominio?.[dominioId];
          if (typeof dom === "number") return dom;
          if (dom && typeof dom.total === "number") return dom.total;
          if (dom && typeof dom.score === "number") return dom.score;
          return null;
        })
        .filter((v) => v != null);
      const m = mean(values);
      trends[dominioId].push({
        week: w,
        date: new Date(weekStartMs),
        value: m != null ? +m.toFixed(2) : null,
        n: inWeek.length,
        suppressed: false,
      });
    }
  }
  return trends;
}

function buildInstrumentTrends(instrumentRows, periodStart, periodEnd) {
  const ids = ["pss-4", "wemwbs-7", "phq-2"];
  const out = {};
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const totalWeeks = Math.max(1, Math.ceil((endMs - startMs) / WEEK_MS));

  for (const id of ids) {
    out[id] = [];
    for (let w = 0; w < totalWeeks; w++) {
      const weekStartMs = startMs + w * WEEK_MS;
      const weekEndMs = Math.min(weekStartMs + WEEK_MS, endMs);
      const inWeek = instrumentRows.filter(
        (r) => r.instrumentId === id && r.ts != null && r.ts >= weekStartMs && r.ts < weekEndMs
      );
      if (inWeek.length < MIN_K) {
        out[id].push({ week: w, date: new Date(weekStartMs), suppressed: true, n: inWeek.length });
        continue;
      }
      const m = mean(inWeek.map((r) => r.score));
      out[id].push({
        week: w,
        date: new Date(weekStartMs),
        value: m != null ? +m.toFixed(2) : null,
        n: inWeek.length,
        suppressed: false,
      });
    }
  }
  return out;
}

function buildHrvTrends(hrv, periodStart, periodEnd) {
  const startMs = periodStart.getTime();
  const endMs = periodEnd.getTime();
  const totalWeeks = Math.max(1, Math.ceil((endMs - startMs) / WEEK_MS));
  const trend = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekStartMs = startMs + w * WEEK_MS;
    const weekEndMs = Math.min(weekStartMs + WEEK_MS, endMs);
    const inWeek = hrv.filter((h) => {
      const ts = toMs(h.measuredAt);
      return ts != null && ts >= weekStartMs && ts < weekEndMs;
    });
    const uniqueUsers = new Set(inWeek.map((h) => h.userId).filter(Boolean));
    if (uniqueUsers.size < MIN_K) {
      trend.push({
        week: w,
        date: new Date(weekStartMs),
        suppressed: true,
        n: inWeek.length,
        uniqueUsers: uniqueUsers.size,
      });
      continue;
    }
    const m = mean(inWeek.map((h) => h.rmssd));
    const lnM = mean(inWeek.map((h) => h.lnRmssd));
    trend.push({
      week: w,
      date: new Date(weekStartMs),
      value: m != null ? +m.toFixed(2) : null,
      lnRmssdMean: lnM != null ? +lnM.toFixed(3) : null,
      n: inWeek.length,
      uniqueUsers: uniqueUsers.size,
      suppressed: false,
    });
  }

  return { trend, totalSamples: hrv.length };
}

function buildSessionsMetrics(sessionsMapped, totalActiveMembers) {
  const cohDeltas = sessionsMapped.map((s) => s.coh).filter((v) => typeof v === "number");
  const moodPairs = sessionsMapped.filter(
    (s) => typeof s.pre === "number" && typeof s.mood === "number"
  );
  const moodDeltas = moodPairs.map((s) => s.mood - s.pre);
  return {
    total: sessionsMapped.length,
    avgPerMember: totalActiveMembers > 0
      ? +(sessionsMapped.length / totalActiveMembers).toFixed(2)
      : 0,
    cohDeltaMean: cohDeltas.length >= MIN_K
      ? +(mean(cohDeltas) || 0).toFixed(2)
      : null,
    moodDeltaMean: moodDeltas.length >= MIN_K
      ? +(mean(moodDeltas) || 0).toFixed(2)
      : null,
    moodDeltaN: moodDeltas.length,
    cohDeltaN: cohDeltas.length,
  };
}

/**
 * Top 5 protocolos con mejor lift mood pre/post (k≥5).
 * Reusa computeProtocolEffectiveness por protocolo.
 */
function buildTopProtocols(sessionsMapped, minN) {
  const byProto = new Map();
  for (const s of sessionsMapped) {
    if (!s.p) continue;
    const arr = byProto.get(s.p) || [];
    arr.push(s);
    byProto.set(s.p, arr);
  }
  const out = [];
  for (const [protoId, rows] of byProto.entries()) {
    const eff = computeProtocolEffectiveness(rows, { minN });
    if (eff.insufficient) continue;
    out.push({
      protocolId: protoId,
      n: eff.n,
      meanLift: eff.meanLift,
      cohensD: eff.cohensD,
      magnitude: eff.magnitude,
      significant: eff.significant,
    });
  }
  out.sort((a, b) => (b.meanLift || 0) - (a.meanLift || 0));
  return out.slice(0, 5);
}

/**
 * Programs cohort pre/post comparison. Solo programas COMPLETED
 * (no abandoned, no active). Por programa, k≥5 enforce.
 *
 * Pre window: N días antes de startedAt (N = program.duration)
 * Post window: desde completedAt hasta N días después
 *
 * Métricas: PSS-4 mean, RMSSD mean (Δ pre→post). Otras métricas
 * deferidas a Phase 6G (MAIA-2 no implementado, NOM-035 raramente
 * se mide pre/post programa específico).
 */
async function buildProgramsCohort({ orm, programs, userIds, periodStart, minN }) {
  const completed = (programs || []).filter((p) => p.completedAt && !p.abandonedAt);
  const totalAssignments = (programs || []).length;
  const completionRate = totalAssignments >= minN
    ? +(completed.length / totalAssignments).toFixed(3)
    : null;

  if (completed.length < minN) {
    return {
      suppressed: true,
      reason: "k_anonymity",
      n: completed.length,
      completionRate,
      cohorts: {},
    };
  }

  // Agrupar por programId; k≥5 por programa.
  const byProgram = new Map();
  for (const p of completed) {
    if (!p.programId) continue;
    const arr = byProgram.get(p.programId) || [];
    arr.push(p);
    byProgram.set(p.programId, arr);
  }

  // Pre/post requires extra HRV + Instrument fetches OUTSIDE the periodStart
  // window (since pre starts N days before programStartedAt, which itself
  // can be at periodStart edge). Best-effort: re-fetch wider window once.
  const widestPreMs = Math.min(
    ...completed.map((p) => toMs(p.startedAt) - getProgramDurationMs(p.programId)),
    periodStart.getTime()
  );
  const widePeriodStart = new Date(widestPreMs);

  const [hrvWide, instrumentsWide] = await Promise.all([
    safeFindMany(orm.hrvMeasurement, {
      where: { userId: { in: userIds }, measuredAt: { gte: widePeriodStart } },
      orderBy: { measuredAt: "desc" },
    }).then(decryptHrvRows),
    safeFindMany(orm.instrument, {
      where: { userId: { in: userIds }, takenAt: { gte: widePeriodStart } },
      orderBy: { takenAt: "desc" },
    }),
  ]);

  // Fix escala O(n×m): antes, por cada programa completado se escaneaba
  // TODA la lista de instrumentos/HRV (50k+) varias veces. Se indexa por
  // userId una sola vez (ts precomputado) → lookup O(filas-del-usuario).
  const pss4ByUser = new Map();
  for (const i of instrumentsWide) {
    if (i.instrumentId !== "pss-4") continue;
    let arr = pss4ByUser.get(i.userId);
    if (!arr) { arr = []; pss4ByUser.set(i.userId, arr); }
    arr.push({ ts: toMs(i.takenAt), score: i.score });
  }
  const hrvByUser = new Map();
  for (const h of hrvWide) {
    let arr = hrvByUser.get(h.userId);
    if (!arr) { arr = []; hrvByUser.set(h.userId, arr); }
    arr.push({ ts: toMs(h.measuredAt), rmssd: h.rmssd });
  }

  const cohorts = {};
  for (const [programId, rows] of byProgram.entries()) {
    if (rows.length < minN) {
      cohorts[programId] = { suppressed: true, n: rows.length, reason: "k_anonymity" };
      continue;
    }
    const program = getProgramById(programId);
    if (!program) {
      cohorts[programId] = { suppressed: true, n: rows.length, reason: "program_not_in_catalog" };
      continue;
    }
    const N = program.duration || 14;
    const Nms = N * DAY_MS;

    const prePss4Means = [];
    const postPss4Means = [];
    const preHrvMeans = [];
    const postHrvMeans = [];

    for (const p of rows) {
      const startMs = toMs(p.startedAt);
      const endMs = toMs(p.completedAt);
      if (startMs == null || endMs == null) continue;
      const preStart = startMs - Nms;
      const preEnd = startMs;
      const postStart = endMs;
      const postEnd = endMs + Nms;

      const userPss4All = pss4ByUser.get(p.userId) || [];
      const userPss4Pre = userPss4All
        .filter((i) => i.ts != null && i.ts >= preStart && i.ts < preEnd)
        .map((i) => i.score);
      const userPss4Post = userPss4All
        .filter((i) => i.ts != null && i.ts >= postStart && i.ts < postEnd)
        .map((i) => i.score);
      if (userPss4Pre.length && userPss4Post.length) {
        prePss4Means.push(mean(userPss4Pre));
        postPss4Means.push(mean(userPss4Post));
      }

      const userHrvAll = hrvByUser.get(p.userId) || [];
      const userHrvPre = userHrvAll
        .filter((h) => h.ts != null && h.ts >= preStart && h.ts < preEnd)
        .map((h) => h.rmssd);
      const userHrvPost = userHrvAll
        .filter((h) => h.ts != null && h.ts >= postStart && h.ts < postEnd)
        .map((h) => h.rmssd);
      if (userHrvPre.length && userHrvPost.length) {
        preHrvMeans.push(mean(userHrvPre));
        postHrvMeans.push(mean(userHrvPost));
      }
    }

    const cohort = {
      n: rows.length,
      duration: N,
      pss4: prePss4Means.length >= minN
        ? {
            n: prePss4Means.length,
            preMean: +(mean(prePss4Means) || 0).toFixed(2),
            postMean: +(mean(postPss4Means) || 0).toFixed(2),
            delta: +((mean(postPss4Means) || 0) - (mean(prePss4Means) || 0)).toFixed(2),
          }
        : { suppressed: true, n: prePss4Means.length },
      hrv: preHrvMeans.length >= minN
        ? {
            n: preHrvMeans.length,
            preMean: +(mean(preHrvMeans) || 0).toFixed(2),
            postMean: +(mean(postHrvMeans) || 0).toFixed(2),
            delta: +((mean(postHrvMeans) || 0) - (mean(preHrvMeans) || 0)).toFixed(2),
          }
        : { suppressed: true, n: preHrvMeans.length },
    };
    cohorts[programId] = cohort;
  }

  return {
    suppressed: false,
    n: completed.length,
    completionRate,
    cohorts,
  };
}

function getProgramDurationMs(programId) {
  const p = getProgramById(programId);
  return ((p?.duration || 14) * DAY_MS);
}

function buildEngagementMetrics(sessionsMapped, totalActiveMembers, nowMs) {
  const last7dMs = nowMs - 7 * DAY_MS;
  const last30dMs = nowMs - 30 * DAY_MS;

  const sessionsLast7d = sessionsMapped.filter((s) => s.ts != null && s.ts >= last7dMs);
  const sessionsLast30d = sessionsMapped.filter((s) => s.ts != null && s.ts >= last30dMs);
  const dauUsers = new Set(sessionsLast7d.map((s) => s.userId).filter(Boolean));
  const wauUsers = new Set(sessionsLast30d.map((s) => s.userId).filter(Boolean));

  if (sessionsMapped.length < MIN_K) {
    return { suppressed: true, n: sessionsMapped.length };
  }
  return {
    suppressed: false,
    sessionsLast7d: sessionsLast7d.length,
    sessionsLast30d: sessionsLast30d.length,
    activeUsersLast7d: dauUsers.size,
    activeUsersLast30d: wauUsers.size,
    activationRate: totalActiveMembers > 0
      ? +(wauUsers.size / totalActiveMembers).toFixed(3)
      : null,
  };
}

/**
 * HRV ↔ NOM-035 correlation per-user. Para cada user con ≥1 medición HRV
 * y ≥1 NOM-035 response, computar (mean RMSSD, NOM-35 total). Si N≥5
 * pares user-level → Pearson r. Sino suppressed.
 *
 * Esto NO mide correlación temporal intra-user (deferred Phase 6G),
 * sino correlación cross-section: orgs donde HRV bajo correlaciona con
 * NOM-035 alto (riesgo psicosocial).
 */
function buildHrvNom35Correlation(hrv, nom35, minK) {
  const hrvByUser = new Map();
  for (const h of hrv) {
    if (!h.userId || typeof h.rmssd !== "number") continue;
    const arr = hrvByUser.get(h.userId) || [];
    arr.push(h.rmssd);
    hrvByUser.set(h.userId, arr);
  }
  const nom35ByUser = new Map();
  for (const n of nom35) {
    if (!n.userId || typeof n.total !== "number") continue;
    const arr = nom35ByUser.get(n.userId) || [];
    arr.push(n.total);
    nom35ByUser.set(n.userId, arr);
  }

  const pairs = [];
  for (const [uid, hrvScores] of hrvByUser.entries()) {
    const nom35Scores = nom35ByUser.get(uid);
    if (!nom35Scores || !nom35Scores.length) continue;
    pairs.push({ x: mean(hrvScores), y: mean(nom35Scores) });
  }

  if (pairs.length < minK) {
    return { suppressed: true, n: pairs.length, reason: "k_anonymity" };
  }

  const xMean = mean(pairs.map((p) => p.x));
  const yMean = mean(pairs.map((p) => p.y));
  let num = 0, dx = 0, dy = 0;
  for (const p of pairs) {
    num += (p.x - xMean) * (p.y - yMean);
    dx += (p.x - xMean) ** 2;
    dy += (p.y - yMean) ** 2;
  }
  const r = (dx > 0 && dy > 0) ? num / Math.sqrt(dx * dy) : 0;
  return {
    suppressed: false,
    n: pairs.length,
    pearsonR: +r.toFixed(3),
    interpretation: interpretCorrelation(r),
  };
}

function interpretCorrelation(r) {
  const a = Math.abs(r);
  if (a < 0.1) return "no_correlation";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  return "strong";
}
