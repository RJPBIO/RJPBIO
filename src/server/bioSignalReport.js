/* ═══════════════════════════════════════════════════════════════
   BIOSIGNAL REPORT (server) — índice de la org vs su industria.
   ───────────────────────────────────────────────────────────────
   Computa el BioSignal Index de la org y lo compara con el benchmark
   anónimo de su cohorte (misma industria). Doble k-anon:
     · cada org entra al benchmark solo si su reporte NO está suprimido
       (N≥5 miembros activos, vía buildExecutiveReport).
     · el benchmark de cohorte exige ≥5 ORGS (buildCohortBenchmark).

   Estado honesto:
     · sin industria definida → pide configurarla.
     · cohorte con <5 orgs → "en formación" (no se revela).

   NOTA de escala: hoy computa el índice por org on-demand (cohortes
   pequeñas). A escala, un cron precomputaría el índice por org.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { buildExecutiveReport } from "./executiveReport";
import { computeOrgIndex, buildCohortBenchmark, compareOrgToCohort } from "../lib/bioSignalIndex";

const MIN_ORGS = 5;
const MAX_COHORT_SCAN = 200;

function aggFromReport(r) {
  return {
    nom35Level: r?.kpis?.nom35Level,
    moodDeltaMean: r?.kpis?.moodDeltaMean,
    hrvDeltaMean: r?.kpis?.hrvDeltaMean,
    engagementRate: r?.engagement?.activationRate ?? r?.kpis?.activationRate,
  };
}

export async function buildBioSignalReport(orgId, opts = {}) {
  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, industry: true, companySize: true, shift: true },
  });
  if (!org) return { available: false, reason: "Organización no encontrada." };
  if (!org.industry) {
    return {
      available: false,
      needsCohort: true,
      reason: "Define la industria de tu organización para activar el benchmark.",
      org: { name: org.name },
    };
  }

  // Reporte de esta org (días 90) → índice.
  let myReport = null;
  try {
    myReport = await buildExecutiveReport(orgId, { days: 90, now: opts.now });
  } catch {
    myReport = null;
  }
  const myIndexRes = computeOrgIndex(myReport && !myReport.suppressed ? aggFromReport(myReport) : {});
  const myIndex = myIndexRes.index;

  // Cohorte: orgs de la misma industria.
  let cohortOrgs = [];
  try {
    cohortOrgs = await orm.org.findMany({
      where: { personal: false, industry: org.industry },
      select: { id: true },
      take: MAX_COHORT_SCAN,
    });
  } catch {
    cohortOrgs = [];
  }

  const entries = [];
  for (const o of cohortOrgs) {
    try {
      const r = o.id === orgId ? myReport : await buildExecutiveReport(o.id, { days: 90, now: opts.now });
      if (!r || r.suppressed) continue;
      const { index } = computeOrgIndex(aggFromReport(r));
      if (Number.isFinite(index)) entries.push({ cohort: org.industry, index });
    } catch {
      /* org saltada */
    }
  }

  const { cohorts } = buildCohortBenchmark(entries, { minOrgs: MIN_ORGS });
  const cohort = cohorts[org.industry] || null;
  const comparison = compareOrgToCohort(myIndex, cohort);

  return {
    available: true,
    org: { name: org.name, industry: org.industry, companySize: org.companySize, shift: org.shift },
    myIndex,
    components: myIndexRes.components,
    benchmarkReady: !!cohort,
    cohort: cohort
      ? { n: cohort.n, mean: cohort.mean, p25: cohort.p25, p50: cohort.p50, p75: cohort.p75 }
      : null,
    comparison,
    minOrgs: MIN_ORGS,
  };
}
