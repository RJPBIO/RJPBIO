#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   simulate-orgs.js — validación end-to-end con datos sintéticos.

   Genera 5 orgs de tamaños distintos × 30 días de actividad realista
   por usuario, luego ejercita las funciones de producción:
     · anonymize(rows, k=5) — k-anonymity primitive del admin B2B
     · sanity de mood deltas / coherencia / engagement

   100% in-memory. NO toca la DB. Reproducible vía SEED env var.

   Uso:
     node scripts/simulate-orgs.js
     SEED=42 node scripts/simulate-orgs.js
   ═══════════════════════════════════════════════════════════════ */

import { anonymize } from "../src/lib/analytics-anonymize.js";

// ─── PRNG seedable (Mulberry32) ──────────────────────────────
const SEED = Number(process.env.SEED || Date.now());
let _seed = SEED >>> 0;
function rand() {
  _seed = (_seed + 0x6D2B79F5) >>> 0;
  let t = _seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (lo, hi) => Math.floor(rand() * (hi - lo + 1)) + lo;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
function randNormal(mean = 0, sd = 1) {
  const u1 = Math.max(rand(), 1e-9), u2 = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Configuración del experimento ───────────────────────────
const ORGS = [
  { name: "Solo Founder Co",  members: 1,   plan: "STARTER",    region: "US"    },
  { name: "Tiny Pilot",       members: 4,   plan: "STARTER",    region: "LATAM" },
  { name: "Growing Team",     members: 12,  plan: "GROWTH",     region: "US"    },
  { name: "Mid-size Co",      members: 50,  plan: "GROWTH",     region: "EU"    },
  { name: "Enterprise",       members: 250, plan: "ENTERPRISE", region: "US"    },
];

// Distribución de perfiles por org (suma 1.0)
const PROFILE_MIX = [
  { tier: "high",    weight: 0.20, sessionsPerWeek: 6,   completionRate: 0.92 },
  { tier: "medium",  weight: 0.40, sessionsPerWeek: 2.5, completionRate: 0.75 },
  { tier: "low",     weight: 0.25, sessionsPerWeek: 0.8, completionRate: 0.55 },
  { tier: "dormant", weight: 0.10, sessionsPerWeek: 0,   completionRate: 0    },
  { tier: "churn",   weight: 0.05, sessionsPerWeek: 0,   completionRate: 0    },
];

const PROTOCOLS = [
  "entrada", "salida", "suspiro_fisiologico", "nsdr",
  "reinicio_parasimpatico", "activacion_cognitiva", "pulse_shift",
];

const DAYS = 30;
const MS_DAY = 86_400_000;
const NOW = Date.now();
const K = 5;

// ─── Generación ──────────────────────────────────────────────
function pickProfile() {
  const u = rand();
  let acc = 0;
  for (const p of PROFILE_MIX) {
    acc += p.weight;
    if (u <= acc) return p;
  }
  return PROFILE_MIX[PROFILE_MIX.length - 1];
}

function generateUsers(orgId, count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const profile = pickProfile();
    users.push({
      id: `${orgId}_user_${i}`,
      orgId,
      profile: profile.tier,
      sessionsPerWeek: profile.sessionsPerWeek,
      completionRate: profile.completionRate,
      stressBaseline: randInt(2, 5), // pre-sesión típico
      teamId: count >= 12 ? `${orgId}_team_${i % Math.max(1, Math.floor(count / 8))}` : null,
      // churn: stops after week 2
      churnAfterDay: profile.tier === "churn" ? randInt(7, 14) : null,
    });
  }
  return users;
}

function generateSessions(user) {
  const sessions = [];
  for (let day = 0; day < DAYS; day++) {
    if (user.churnAfterDay && day >= user.churnAfterDay) break;
    if (user.sessionsPerWeek === 0) continue;
    // Probabilidad diaria ~ sessionsPerWeek / 7
    const pDay = Math.min(1, user.sessionsPerWeek / 7);
    if (rand() > pDay) continue;
    // Algunos días dobles
    const count = rand() < 0.15 ? 2 : 1;
    for (let s = 0; s < count; s++) {
      const completedAt = new Date(NOW - (DAYS - day) * MS_DAY + randInt(0, MS_DAY - 1));
      const completed = rand() < user.completionRate;
      const duration = completed ? randInt(90, 180) : randInt(20, 70);
      const moodPre = Math.max(1, Math.min(5, Math.round(user.stressBaseline + randNormal(0, 0.6))));
      const moodPost = completed
        ? Math.max(1, Math.min(5, Math.round(moodPre + randNormal(0.8, 0.5))))
        : Math.max(1, Math.min(5, moodPre + (rand() < 0.5 ? 0 : 1)));
      const coherenciaDelta = completed ? randNormal(12, 8) : randNormal(2, 4);
      sessions.push({
        id: `${user.id}_s_${day}_${s}`,
        orgId: user.orgId,
        userId: user.id,
        teamId: user.teamId,
        protocolId: pick(PROTOCOLS),
        durationSec: duration,
        moodPre,
        moodPost,
        coherenciaDelta,
        completedAt,
        completed,
      });
    }
  }
  return sessions;
}

// ─── Validaciones ────────────────────────────────────────────
function validateAnonymity(buckets, k) {
  const violations = [];
  for (const b of buckets) {
    if (b.uniqueUsers < k) {
      violations.push({ day: b.day, teamId: b.teamId, uniqueUsers: b.uniqueUsers });
    }
  }
  return violations;
}

function summarize(sessions, users) {
  const completed = sessions.filter((s) => s.completed);
  const moodDeltas = sessions
    .filter((s) => s.moodPre != null && s.moodPost != null)
    .map((s) => s.moodPost - s.moodPre);
  const cohDeltas = sessions
    .filter((s) => typeof s.coherenciaDelta === "number")
    .map((s) => s.coherenciaDelta);
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const completionPct = sessions.length ? completed.length / sessions.length : 0;
  const activeUsers = new Set(sessions.map((s) => s.userId)).size;
  const avgSessionsPerActiveUser = activeUsers ? sessions.length / activeUsers : 0;
  return {
    totalUsers: users.length,
    activeUsers,
    sessions: sessions.length,
    completed: completed.length,
    completionPct,
    avgSessionsPerActiveUser,
    avgMoodDelta: avg(moodDeltas),
    avgCoherenciaDelta: avg(cohDeltas),
  };
}

// ─── Run ─────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════════════════");
console.log("BIO-IGNICIÓN — Simulación de 5 orgs (in-memory, no DB)");
console.log(`SEED: ${SEED}    K-anonymity: ${K}    Window: ${DAYS} días`);
console.log("═══════════════════════════════════════════════════════════════\n");

const allFindings = [];
let totalSessionsGenerated = 0;
const t0 = performance.now();

for (let i = 0; i < ORGS.length; i++) {
  const cfg = ORGS[i];
  const orgId = `sim_org_${i}`;
  const users = generateUsers(orgId, cfg.members);
  const sessions = users.flatMap(generateSessions);
  totalSessionsGenerated += sessions.length;

  const t1 = performance.now();
  const agg = anonymize(sessions, { k: K });
  const aggTime = (performance.now() - t1).toFixed(1);

  const violations = validateAnonymity(agg.buckets, K);
  const summary = summarize(sessions, users);

  const tierCount = {};
  for (const u of users) tierCount[u.profile] = (tierCount[u.profile] || 0) + 1;

  console.log(`──── ${cfg.name} (${cfg.plan}, ${cfg.region}) ────`);
  console.log(`  Members: ${cfg.members}   tiers: ${JSON.stringify(tierCount)}`);
  console.log(`  Sessions generadas: ${summary.sessions}   completed: ${summary.completed} (${(summary.completionPct * 100).toFixed(0)}%)`);
  console.log(`  Usuarios activos: ${summary.activeUsers}/${summary.totalUsers}   avg sessions/active: ${summary.avgSessionsPerActiveUser.toFixed(1)}`);
  console.log(`  Avg mood Δ: ${summary.avgMoodDelta != null ? summary.avgMoodDelta.toFixed(2) : "—"}    Avg coherencia Δ: ${summary.avgCoherenciaDelta != null ? summary.avgCoherenciaDelta.toFixed(2) : "—"}`);
  console.log(`  Anonymize team-level: ${agg.buckets.length} buckets visibles · ${agg.suppressed} suppressed (k<${K})    [${aggTime}ms]`);

  // Vista org-wide (sin teamId) — lo que vería el admin sin filtro de team.
  const orgWideRows = sessions.map((s) => ({ ...s, teamId: null }));
  const t1b = performance.now();
  const aggOrg = anonymize(orgWideRows, { k: K });
  const aggOrgTime = (performance.now() - t1b).toFixed(1);
  console.log(`  Anonymize org-wide: ${aggOrg.buckets.length} buckets visibles · ${aggOrg.suppressed} suppressed    [${aggOrgTime}ms]`);

  // Vista con DP (epsilon=1.0) — noise Laplace en avg coh
  const aggDP = anonymize(orgWideRows, { k: K, epsilon: 1.0 });
  const cohRaw = aggOrg.buckets.map((b) => b.avgCoherenciaDelta).filter((x) => x != null);
  const cohDP = aggDP.buckets.map((b) => b.avgCoherenciaDelta).filter((x) => x != null);
  if (cohRaw.length > 0 && cohDP.length === cohRaw.length) {
    const meanRaw = cohRaw.reduce((a, b) => a + b, 0) / cohRaw.length;
    const meanDP = cohDP.reduce((a, b) => a + b, 0) / cohDP.length;
    const driftPct = meanRaw !== 0 ? Math.abs((meanDP - meanRaw) / meanRaw) * 100 : 0;
    console.log(`  DP epsilon=1.0: mean coh raw=${meanRaw.toFixed(2)} → DP=${meanDP.toFixed(2)} (drift ${driftPct.toFixed(1)}%)`);
    if (driftPct > 50) {
      allFindings.push({ org: cfg.name, severity: "WARN", msg: `DP epsilon=1.0 introduce ${driftPct.toFixed(0)}% drift en coherencia — podría confundir interpretación` });
    }
  }

  // Findings
  if (cfg.members < K && agg.buckets.length > 0) {
    allFindings.push({ org: cfg.name, severity: "CRITICAL", msg: `org con ${cfg.members} miembros (k<${K}) NO debería exponer buckets, pero ${agg.buckets.length} pasaron` });
    console.log(`  ⚠  CRITICAL: ${agg.buckets.length} buckets expuestos en org de ${cfg.members} miembros (k=${K})`);
  }
  if (violations.length > 0) {
    allFindings.push({ org: cfg.name, severity: "CRITICAL", msg: `${violations.length} buckets con uniqueUsers<${K} no fueron suprimidos` });
    console.log(`  ⚠  CRITICAL: ${violations.length} buckets violan k=${K}`);
  }
  if (summary.avgMoodDelta != null && summary.avgMoodDelta < 0) {
    allFindings.push({ org: cfg.name, severity: "WARN", msg: `mood delta promedio negativo (${summary.avgMoodDelta.toFixed(2)}) — esperaríamos positivo si las sesiones funcionan` });
  }
  if (cfg.members >= K * 3 && agg.buckets.length === 0 && summary.sessions > 50) {
    allFindings.push({ org: cfg.name, severity: "WARN", msg: `org grande con muchas sesiones pero 0 buckets visibles — anonymize muy estricto?` });
  }
  // PRODUCT-CRITICAL: si team-view suprime >70% pero org-wide no, marcar
  if (cfg.members >= 12 && agg.suppressed > 0 && (agg.suppressed / (agg.suppressed + agg.buckets.length)) > 0.7) {
    const teamSuppressionPct = (agg.suppressed / (agg.suppressed + agg.buckets.length) * 100).toFixed(0);
    const orgSuppressionPct = (aggOrg.suppressed / Math.max(1, aggOrg.suppressed + aggOrg.buckets.length) * 100).toFixed(0);
    allFindings.push({
      org: cfg.name,
      severity: "PRODUCT",
      msg: `team-view suprime ${teamSuppressionPct}% de buckets vs org-wide ${orgSuppressionPct}% — UX implication: dashboard team-breakdown estará mayormente vacío`,
    });
  }
  console.log("");
}

const totalTime = (performance.now() - t0).toFixed(0);

console.log("═══════════════════════════════════════════════════════════════");
console.log("RESUMEN");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`  Sesiones totales generadas: ${totalSessionsGenerated}`);
console.log(`  Tiempo total: ${totalTime}ms`);
console.log(`  Findings: ${allFindings.length}`);
if (allFindings.length === 0) {
  console.log("  ✓ No se encontraron problemas en esta corrida.");
} else {
  for (const f of allFindings) {
    const tag = f.severity === "CRITICAL" ? "[BUG]" : f.severity === "PRODUCT" ? "[UX] " : "[WARN]";
    console.log(`  ${tag} ${f.org}: ${f.msg}`);
  }
}
console.log("");
process.exit(allFindings.filter((f) => f.severity === "CRITICAL").length > 0 ? 1 : 0);
