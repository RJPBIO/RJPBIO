#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   simulate-orgs-db.js — validación end-to-end con Postgres real.

   Espejo de simulate-orgs.js pero contra la DB. Inserta 5 B2B orgs
   con N usuarios cada una, sus personal-orgs, memberships y sesiones
   sintéticas. Luego corre la query nueva del admin (Sprint 55:
   userId∈members) Y la query vieja (orgId) para confirmar el fix.

   Todo se prefijo `sim-` para cleanup trivial.

   Uso:
     node scripts/simulate-orgs-db.js              # cleanup + seed + validate
     node scripts/simulate-orgs-db.js --cleanup    # solo borra data sim-
     node scripts/simulate-orgs-db.js --validate   # solo valida (asume seed)
     SEED=42 node scripts/simulate-orgs-db.js
   ═══════════════════════════════════════════════════════════════ */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { anonymize } from "../src/lib/analytics-anonymize.js";

const SLUG_PREFIX = "sim-";
const EMAIL_DOMAIN_LOCAL = "@simulator.bio-ignicion.test";

const SEED = Number(process.env.SEED || 42);
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

const ORGS = [
  { slug: "solo-founder",  name: "Solo Founder Co",  members: 1,   plan: "STARTER",    region: "US"    },
  { slug: "tiny-pilot",    name: "Tiny Pilot",       members: 4,   plan: "STARTER",    region: "LATAM" },
  { slug: "growing-team",  name: "Growing Team",     members: 12,  plan: "GROWTH",     region: "US"    },
  { slug: "mid-size-co",   name: "Mid-size Co",      members: 50,  plan: "GROWTH",     region: "EU"    },
  { slug: "enterprise",    name: "Enterprise Inc",   members: 250, plan: "ENTERPRISE", region: "US"    },
];

const PROFILE_MIX = [
  { tier: "high",    weight: 0.20, sessionsPerWeek: 6,   completionRate: 0.92 },
  { tier: "medium",  weight: 0.40, sessionsPerWeek: 2.5, completionRate: 0.75 },
  { tier: "low",     weight: 0.25, sessionsPerWeek: 0.8, completionRate: 0.55 },
  { tier: "dormant", weight: 0.10, sessionsPerWeek: 0,   completionRate: 0    },
  { tier: "churn",   weight: 0.05, sessionsPerWeek: 0,   completionRate: 0    },
];
const PROTOCOLS = ["entrada", "salida", "suspiro_fisiologico", "nsdr", "reinicio_parasimpatico", "activacion_cognitiva", "pulse_shift"];

const DAYS = 30;
const MS_DAY = 86_400_000;
const NOW = Date.now();
const K = 5;

function pickProfile() {
  const u = rand();
  let acc = 0;
  for (const p of PROFILE_MIX) { acc += p.weight; if (u <= acc) return p; }
  return PROFILE_MIX[PROFILE_MIX.length - 1];
}

function generateSessionsFor(userId, profile) {
  const sessions = [];
  const churnAfterDay = profile.tier === "churn" ? randInt(7, 14) : null;
  const stress = randInt(2, 5);
  for (let day = 0; day < DAYS; day++) {
    if (churnAfterDay && day >= churnAfterDay) break;
    if (profile.sessionsPerWeek === 0) continue;
    if (rand() > Math.min(1, profile.sessionsPerWeek / 7)) continue;
    const count = rand() < 0.15 ? 2 : 1;
    for (let s = 0; s < count; s++) {
      const completedAt = new Date(NOW - (DAYS - day) * MS_DAY + randInt(0, MS_DAY - 1));
      const completed = rand() < profile.completionRate;
      const moodPre = Math.max(1, Math.min(5, Math.round(stress + randNormal(0, 0.6))));
      const moodPost = completed
        ? Math.max(1, Math.min(5, Math.round(moodPre + randNormal(0.8, 0.5))))
        : Math.max(1, Math.min(5, moodPre + (rand() < 0.5 ? 0 : 1)));
      sessions.push({
        protocolId: pick(PROTOCOLS),
        durationSec: completed ? randInt(90, 180) : randInt(20, 70),
        coherenciaDelta: completed ? randNormal(12, 8) : randNormal(2, 4),
        moodPre,
        moodPost,
        completedAt,
      });
    }
  }
  return sessions;
}

async function cleanup(prisma) {
  console.log("→ cleanup: borrando data con prefijo sim-");
  // Encuentra orgs B2B sim
  const b2bOrgs = await prisma.org.findMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
    select: { id: true },
  });
  const b2bIds = b2bOrgs.map((o) => o.id);

  // Encuentra usuarios sim por email
  const simUsers = await prisma.user.findMany({
    where: { email: { endsWith: EMAIL_DOMAIN_LOCAL } },
    select: { id: true },
  });
  const userIds = simUsers.map((u) => u.id);

  // Personal-orgs de los usuarios sim
  const personalOrgs = userIds.length
    ? await prisma.org.findMany({
        where: { slug: { in: userIds.map((id) => `personal-${id}`) } },
        select: { id: true },
      })
    : [];
  const personalOrgIds = personalOrgs.map((o) => o.id);

  const allOrgIds = [...new Set([...b2bIds, ...personalOrgIds])];

  if (allOrgIds.length || userIds.length) {
    // Orden para respetar FK
    await prisma.neuralSession.deleteMany({ where: { OR: [
      { orgId: { in: allOrgIds } },
      { userId: { in: userIds } },
    ] } });
    await prisma.auditLog.deleteMany({ where: { orgId: { in: allOrgIds } } });
    await prisma.membership.deleteMany({ where: { OR: [
      { orgId: { in: allOrgIds } },
      { userId: { in: userIds } },
    ] } });
    await prisma.org.deleteMany({ where: { id: { in: allOrgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`  ✓ borrados: ${b2bIds.length} B2B orgs, ${personalOrgIds.length} personal orgs, ${userIds.length} users`);
  } else {
    console.log("  (nada que borrar)");
  }
}

async function seed(prisma) {
  console.log(`→ seed: SEED=${SEED}, ${DAYS} días, ${ORGS.length} orgs (createMany batched)`);
  const stats = [];

  for (let i = 0; i < ORGS.length; i++) {
    const cfg = ORGS[i];
    const t0 = performance.now();

    // Pre-genera TODOS los ids upfront para evitar findUnique roundtrips.
    const b2bOrgId = randomUUID();
    const userRows = [];
    const personalOrgRows = [];
    const memberRows = [];
    const sessionRows = [];
    const tierCount = {};

    for (let u = 0; u < cfg.members; u++) {
      const userId = randomUUID();
      const personalOrgId = randomUUID();
      const profile = pickProfile();
      tierCount[profile.tier] = (tierCount[profile.tier] || 0) + 1;

      userRows.push({
        id: userId,
        email: `sim-${cfg.slug}-${u}-${userId.slice(0, 6)}${EMAIL_DOMAIN_LOCAL}`,
        name: `Sim ${cfg.slug} #${u}`,
        locale: "es",
      });
      personalOrgRows.push({
        id: personalOrgId,
        slug: `personal-${userId}`,
        name: `Personal · ${userId.slice(0, 6)}`,
        plan: "FREE",
        region: cfg.region,
        seats: 1,
        seatsUsed: 1,
        personal: true,
      });
      memberRows.push({ id: randomUUID(), userId, orgId: personalOrgId, role: "OWNER" });
      // user[0] es OWNER del B2B — el resto MEMBER. Necesario para que el
      // admin elija el B2B al hacer dev-login (admin filtra por OWNER/ADMIN).
      memberRows.push({ id: randomUUID(), userId, orgId: b2bOrgId, role: u === 0 ? "OWNER" : "MEMBER" });

      // Sesiones de este user, attached a su personal-org
      for (const s of generateSessionsFor(userId, profile)) {
        sessionRows.push({
          id: randomUUID(),
          orgId: personalOrgId,
          userId,
          protocolId: s.protocolId,
          durationSec: s.durationSec,
          coherenciaDelta: s.coherenciaDelta,
          moodPre: s.moodPre,
          moodPost: s.moodPost,
          completedAt: s.completedAt,
        });
      }
    }

    // Inserts batched. createMany es ~50-100x más rápido que create x N.
    await prisma.org.create({
      data: {
        id: b2bOrgId,
        name: cfg.name,
        slug: `${SLUG_PREFIX}${cfg.slug}-${b2bOrgId.slice(0, 6)}`,
        plan: cfg.plan,
        region: cfg.region,
        seats: Math.max(cfg.members, 5),
        seatsUsed: cfg.members,
        personal: false,
      },
    });
    if (userRows.length) await prisma.user.createMany({ data: userRows });
    if (personalOrgRows.length) await prisma.org.createMany({ data: personalOrgRows });
    if (memberRows.length) await prisma.membership.createMany({ data: memberRows });
    if (sessionRows.length) {
      // Chunk sessions por si son miles (Postgres MAX bind params ~32k)
      const CHUNK = 1000;
      for (let s = 0; s < sessionRows.length; s += CHUNK) {
        await prisma.neuralSession.createMany({ data: sessionRows.slice(s, s + CHUNK) });
      }
    }

    const t1 = performance.now();
    stats.push({ org: cfg.name, members: cfg.members, sessions: sessionRows.length, tiers: tierCount, ms: Math.round(t1 - t0) });
    console.log(`  ✓ ${cfg.name}: ${cfg.members} users, ${sessionRows.length} sessions [${Math.round(t1 - t0)}ms]`);
  }
  return stats;
}

async function validate(prisma) {
  console.log("→ validate: corriendo queries del admin\n");
  const since = new Date(NOW - DAYS * MS_DAY);
  const findings = [];
  const rows = [];

  const b2bOrgs = await prisma.org.findMany({
    where: { slug: { startsWith: SLUG_PREFIX }, personal: false },
    orderBy: { seatsUsed: "asc" },
  });

  console.log("┌─────────────────────┬────────┬──────────┬──────────┬────────┬──────────┬─────────────┐");
  console.log("│ Org                 │ Memb   │ NEW (∈)  │ OLD (=)  │ Suppr. │ Buckets  │ Empty state │");
  console.log("├─────────────────────┼────────┼──────────┼──────────┼────────┼──────────┼─────────────┤");

  for (const org of b2bOrgs) {
    // Query NUEVA (Sprint 55): userId ∈ members
    const memberships = await prisma.membership.findMany({
      where: { orgId: org.id, deactivatedAt: null },
      select: { userId: true },
    });
    const memberIds = memberships.map((m) => m.userId);
    const sessionsNew = memberIds.length
      ? await prisma.neuralSession.findMany({
          where: { userId: { in: memberIds }, completedAt: { gte: since } },
        })
      : [];

    // Query VIEJA: orgId == B2B org
    const sessionsOld = await prisma.neuralSession.findMany({
      where: { orgId: org.id, completedAt: { gte: since } },
    });

    const agg = anonymize(sessionsNew, { k: K });
    const willShowEmpty = agg.buckets.length === 0;

    rows.push({
      name: org.name,
      members: memberships.length,
      sessionsNew: sessionsNew.length,
      sessionsOld: sessionsOld.length,
      buckets: agg.buckets.length,
      suppressed: agg.suppressed,
      empty: willShowEmpty,
    });

    const pad = (s, n) => String(s).padEnd(n);
    console.log(
      `│ ${pad(org.name, 19)} │ ${pad(memberships.length, 6)} │ ${pad(sessionsNew.length, 8)} │ ${pad(sessionsOld.length, 8)} │ ${pad(agg.suppressed, 6)} │ ${pad(agg.buckets.length, 8)} │ ${pad(willShowEmpty ? "yes" : "no", 11)} │`
    );

    // Findings
    if (sessionsOld.length > 0) {
      findings.push({ severity: "BUG", org: org.name, msg: `query VIEJA todavía ve ${sessionsOld.length} sesiones — orgId no debería match (sessions viven en personal-org)` });
    }
    if (memberships.length >= 5 && sessionsNew.length > 0 && agg.buckets.length === 0) {
      findings.push({ severity: "WARN", org: org.name, msg: `5+ miembros y ${sessionsNew.length} sesiones pero 0 buckets — actividad muy dispersa para k=5` });
    }
    if (memberships.length < 5 && agg.buckets.length > 0) {
      findings.push({ severity: "BUG", org: org.name, msg: `${memberships.length} miembros (k<5) pero ${agg.buckets.length} buckets expuestos — VIOLACIÓN k-anonymity` });
    }
  }
  console.log("└─────────────────────┴────────┴──────────┴──────────┴────────┴──────────┴─────────────┘");
  console.log("");
  console.log("  NEW (∈)  = query Sprint 55: userId ∈ membership(orgId)");
  console.log("  OLD (=)  = query previa: orgId == B2B id (rota porque sessions viven en personal-org)");
  console.log("");

  if (findings.length === 0) {
    console.log("  ✓ Sin bugs. Sprint 55 funciona correctamente contra Postgres.");
  } else {
    console.log(`  Hallazgos: ${findings.length}`);
    for (const f of findings) {
      const tag = f.severity === "BUG" ? "[BUG] " : "[WARN]";
      console.log(`  ${tag} ${f.org}: ${f.msg}`);
    }
  }
  return { rows, findings };
}

async function main() {
  const args = process.argv.slice(2);
  const onlyCleanup = args.includes("--cleanup");
  const onlyValidate = args.includes("--validate");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no está set en .env.local. Aborto.");
    process.exit(1);
  }

  const prisma = new PrismaClient({ log: ["error"] });
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("BIO-IGNICIÓN — Simulación DB-level (Postgres real)");
  console.log(`SEED: ${SEED}    K: ${K}    Window: ${DAYS}d    Mode: ${onlyCleanup ? "cleanup" : onlyValidate ? "validate" : "full"}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  try {
    if (onlyValidate) {
      await validate(prisma);
    } else {
      await cleanup(prisma);
      if (!onlyCleanup) {
        console.log("");
        await seed(prisma);
        console.log("");
        await validate(prisma);
      }
    }
  } catch (e) {
    console.error("\nERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
