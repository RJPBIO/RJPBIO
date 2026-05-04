/* Tests Phase 6F SP-C — buildExecutiveReport server-side.
   Memory adapter cubre todas las tablas necesarias (Org, Membership,
   NeuralSession, Instrument, HrvMeasurement, Nom35Response, ProgramAssignment).
   Tests cubren: null org, k-anon top-level, shape canónico, NOM-35 trends
   por dominio, programs cohort pre/post, HRV correlation, period.days. */

import { describe, test, expect, beforeEach } from "vitest";
import { db } from "./db";
import { buildExecutiveReport } from "./executiveReport";

const NOW = Date.now();
// Counter monotonic GLOBAL — NO reset por test (memory adapter es singleton
// y los ids deben ser únicos cross-test). Date.now() en tests fast puede
// devolver el mismo valor → ids colisionando, registros sobrescribiéndose.
let GLOBAL_ID_SEED = 0;
function nextId(prefix = "id") {
  GLOBAL_ID_SEED += 1;
  return `${prefix}_${GLOBAL_ID_SEED}`;
}

async function createOrg({ id = nextId("org"), name = "Acme Corp", plan = "STARTER" } = {}) {
  const orm = await db();
  return orm.org.create({
    data: { id, name, slug: id, plan, personal: false, seats: 50 },
  });
}

async function createMember({ orgId, userId, role = "MEMBER" }) {
  const orm = await db();
  // Memory adapter `match` con `deactivatedAt: null` requiere field explícito;
  // sin esto el filter `row[k] !== v` con undefined !== null filtra el row.
  return orm.membership.create({
    data: { orgId, userId, role, deactivatedAt: null },
  });
}

async function createUser({ id = nextId("user"), email } = {}) {
  const orm = await db();
  return orm.user.create({
    data: {
      id,
      email: email || `${id}@test.local`,
      locale: "es",
      timezone: "America/Mexico_City",
    },
  });
}

async function createSession({ userId, completedAt, protocolId = "1", moodPre = 5, moodPost = 7, coherenciaDelta = 5 }) {
  const orm = await db();
  return orm.neuralSession.create({
    data: {
      orgId: "personal-org-x",
      userId,
      protocolId,
      durationSec: 300,
      coherenciaDelta,
      moodPre,
      moodPost,
      completedAt,
    },
  });
}

async function createHrv({ userId, measuredAt, rmssd = 35 }) {
  const orm = await db();
  return orm.hrvMeasurement.create({
    data: {
      userId,
      orgId: null,
      rmssd,
      lnRmssd: Math.log(rmssd),
      meanHr: 70,
      durationSec: 60,
      n: 60,
      source: "ble",
      measuredAt,
    },
  });
}

async function createInstrument({ userId, instrumentId, score, level, takenAt }) {
  const orm = await db();
  return orm.instrument.create({
    data: {
      userId,
      orgId: null,
      instrumentId,
      score,
      level,
      answers: {},
      takenAt,
    },
  });
}

async function createNom35({ userId, total = 50, nivel = "medio", porDominio = {}, completedAt }) {
  const orm = await db();
  return orm.nom35Response.create({
    data: {
      orgId: "x",
      userId,
      guia: "III",
      answers: {},
      total,
      nivel,
      porDominio,
      porCategoria: {},
      completedAt,
    },
  });
}

async function createProgramAssignment({ userId, orgId = null, programId, startedAt, completedAt = null }) {
  const orm = await db();
  return orm.programAssignment.create({
    data: {
      userId,
      orgId,
      programId,
      startedAt,
      completedAt,
      completedDays: [],
      source: "self-selected",
    },
  });
}

async function createOrgWithMembers(memberCount = 5, opts = {}) {
  const org = await createOrg(opts);
  const users = [];
  for (let i = 0; i < memberCount; i++) {
    const u = await createUser({ id: nextId("u"), email: `m${i}-${org.id}@t.local` });
    await createMember({ orgId: org.id, userId: u.id });
    users.push(u);
  }
  return { org, users };
}

// NO reset de ids por test — usar contador global monotónico.

describe("buildExecutiveReport — Phase 6F SP-C", () => {
  test("retorna null cuando orgId no es string o vacío", async () => {
    expect(await buildExecutiveReport(null)).toBeNull();
    expect(await buildExecutiveReport("")).toBeNull();
    expect(await buildExecutiveReport(123)).toBeNull();
  });

  test("retorna null cuando org no existe en DB", async () => {
    const r = await buildExecutiveReport("nonexistent_org_id");
    expect(r).toBeNull();
  });

  test("retorna suppressed cuando activeMembers < 5 (k-anonymity)", async () => {
    const { org } = await createOrgWithMembers(3);
    const r = await buildExecutiveReport(org.id);
    expect(r).not.toBeNull();
    expect(r.suppressed).toBe(true);
    expect(r.reason).toBe("k_anonymity");
    expect(r.org.activeMembers).toBe(3);
    expect(r.message).toMatch(/mínimo 5/i);
    expect(r.snapshot).toBeDefined();
  });

  test("shape canónico cuando ≥5 members con kpis + nom35 + instruments + hrv + programs", async () => {
    const { org, users } = await createOrgWithMembers(5);
    const r = await buildExecutiveReport(org.id);
    expect(r).not.toBeNull();
    expect(r.suppressed).toBeUndefined();
    expect(r.org).toMatchObject({
      id: org.id,
      name: org.name,
      plan: org.plan,
      activeMembers: 5,
    });
    expect(r.period.days).toBe(90);
    expect(r.kpis).toMatchObject({
      activeMembers: 5,
      sessionsTotal: 0,
      sessionsPerActiveMember: 0,
    });
    expect(r.nom35).toBeDefined();
    expect(r.nom35.summary).toBeDefined();
    expect(r.nom35.trends).toBeDefined();
    expect(r.instruments).toBeDefined();
    expect(r.instruments.summary.pss4).toBeDefined();
    expect(r.hrv).toBeDefined();
    expect(r.hrv.trend).toBeDefined();
    expect(r.sessions).toBeDefined();
    expect(r.programs).toBeDefined();
    expect(r.engagement).toBeDefined();
    expect(r.correlation).toBeDefined();
    expect(r.snapshot.kAnonThreshold).toBe(5);
  });

  test("respeta opts.days param (clampa a [7..365])", async () => {
    const { org } = await createOrgWithMembers(5);
    const r1 = await buildExecutiveReport(org.id, { days: 1 });
    expect(r1.period.days).toBe(7); // clamped a min 7

    const r2 = await buildExecutiveReport(org.id, { days: 9999 });
    expect(r2.period.days).toBe(365); // clamped a max 365

    const r3 = await buildExecutiveReport(org.id, { days: 30 });
    expect(r3.period.days).toBe(30);
  });

  test("NOM-35 trends incluye 10 dominios oficiales con suppression k<5 weekly", async () => {
    const { org, users } = await createOrgWithMembers(10);
    // 6 responses esta semana → no suppressed
    for (let i = 0; i < 6; i++) {
      await createNom35({
        userId: users[i].id,
        total: 40 + i,
        nivel: "medio",
        porDominio: { condiciones: 5, carga: 8, liderazgo: 3 },
        completedAt: new Date(NOW - 2 * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.nom35.trends).toBeDefined();
    // 10 dominios oficiales (no 5)
    const dominioKeys = Object.keys(r.nom35.trends);
    expect(dominioKeys).toHaveLength(10);
    expect(dominioKeys).toContain("condiciones");
    expect(dominioKeys).toContain("liderazgo");
    expect(dominioKeys).toContain("violencia");
    expect(dominioKeys).toContain("pertenencia");
    // Cada dominio retorna array de weeks
    for (const dom of dominioKeys) {
      expect(Array.isArray(r.nom35.trends[dom])).toBe(true);
    }
  });

  test("HRV trends suprime weeks con <5 unique users", async () => {
    const { org, users } = await createOrgWithMembers(8);
    // Solo 3 users tienen HRV measurements → suppressed
    const recentTs = new Date(NOW - 2 * 86400_000);
    for (let i = 0; i < 3; i++) {
      await createHrv({ userId: users[i].id, measuredAt: recentTs, rmssd: 30 + i });
    }
    const r = await buildExecutiveReport(org.id, { days: 14 });
    // Cualquier week con <5 unique users debe estar suppressed
    const lastWeek = r.hrv.trend[r.hrv.trend.length - 1];
    expect(lastWeek.suppressed).toBe(true);
    expect(lastWeek.uniqueUsers).toBeLessThan(5);
  });

  test("HRV trends NO suprime cuando ≥5 unique users con HRV", async () => {
    const { org, users } = await createOrgWithMembers(8);
    const recentTs = new Date(NOW - 2 * 86400_000);
    for (let i = 0; i < 6; i++) {
      await createHrv({ userId: users[i].id, measuredAt: recentTs, rmssd: 30 + i });
    }
    const r = await buildExecutiveReport(org.id, { days: 14 });
    const lastWeek = r.hrv.trend[r.hrv.trend.length - 1];
    expect(lastWeek.suppressed).toBe(false);
    expect(lastWeek.uniqueUsers).toBeGreaterThanOrEqual(5);
    expect(typeof lastWeek.value).toBe("number");
  });

  test("programs cohort suppressed cuando completed < 5", async () => {
    const { org, users } = await createOrgWithMembers(8);
    // 3 programs completed → menos del threshold
    for (let i = 0; i < 3; i++) {
      await createProgramAssignment({
        userId: users[i].id,
        programId: "burnout-recovery",
        startedAt: new Date(NOW - 60 * 86400_000),
        completedAt: new Date(NOW - 30 * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.programs.suppressed).toBe(true);
    expect(r.programs.reason).toBe("k_anonymity");
    expect(r.programs.n).toBe(3);
  });

  test("programs cohort calcula cohorts cuando ≥5 completed", async () => {
    const { org, users } = await createOrgWithMembers(10);
    for (let i = 0; i < 6; i++) {
      await createProgramAssignment({
        userId: users[i].id,
        programId: "burnout-recovery",
        startedAt: new Date(NOW - 60 * 86400_000),
        completedAt: new Date(NOW - 30 * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.programs.suppressed).toBe(false);
    expect(r.programs.n).toBe(6);
    expect(r.programs.cohorts["burnout-recovery"]).toBeDefined();
    expect(r.programs.cohorts["burnout-recovery"].n).toBe(6);
  });

  test("HRV ↔ NOM-035 correlation Pearson r calculado con k≥5", async () => {
    const { org, users } = await createOrgWithMembers(8);
    // 5 users con AMBOS HRV + NOM-035 → correlation calculable
    for (let i = 0; i < 5; i++) {
      await createHrv({
        userId: users[i].id,
        rmssd: 30 + i * 5,
        measuredAt: new Date(NOW - 5 * 86400_000),
      });
      await createNom35({
        userId: users[i].id,
        total: 80 - i * 5, // anti-correlated con HRV
        completedAt: new Date(NOW - 3 * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.correlation.suppressed).toBe(false);
    expect(r.correlation.n).toBe(5);
    expect(typeof r.correlation.pearsonR).toBe("number");
    // Anti-correlation perfecta esperada en este setup → r close to -1
    expect(r.correlation.pearsonR).toBeLessThan(-0.9);
    expect(r.correlation.interpretation).toBe("strong");
  });

  test("HRV correlation suppressed cuando <5 users con ambos", async () => {
    const { org, users } = await createOrgWithMembers(8);
    // Solo 3 users con ambos → suppressed
    for (let i = 0; i < 3; i++) {
      await createHrv({ userId: users[i].id, rmssd: 30, measuredAt: new Date(NOW - 5 * 86400_000) });
      await createNom35({ userId: users[i].id, total: 50, completedAt: new Date(NOW - 3 * 86400_000) });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.correlation.suppressed).toBe(true);
    expect(r.correlation.reason).toBe("k_anonymity");
  });

  test("kpis.sessionsPerActiveMember calculado correctamente", async () => {
    const { org, users } = await createOrgWithMembers(5);
    // 10 sessions across 5 members
    for (let i = 0; i < 10; i++) {
      await createSession({
        userId: users[i % 5].id,
        completedAt: new Date(NOW - i * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(r.kpis.sessionsTotal).toBe(10);
    expect(r.kpis.sessionsPerActiveMember).toBe(2);
  });

  test("topProtocols retorna hasta 5 con efectividad calculada (k≥5)", async () => {
    const { org, users } = await createOrgWithMembers(6);
    // 6 sessions del mismo protocol con mood lift positivo
    for (let i = 0; i < 6; i++) {
      await createSession({
        userId: users[i].id,
        protocolId: "1",
        moodPre: 4,
        moodPost: 7,
        completedAt: new Date(NOW - i * 86400_000),
      });
    }
    const r = await buildExecutiveReport(org.id);
    expect(Array.isArray(r.topProtocols)).toBe(true);
    expect(r.topProtocols.length).toBeGreaterThan(0);
    expect(r.topProtocols[0].protocolId).toBe("1");
    expect(r.topProtocols[0].n).toBe(6);
    expect(r.topProtocols[0].meanLift).toBeGreaterThan(0);
  });
});
