/* Tests buildUserSnapshot — Phase 6F SP-A.
   Memory adapter en db.js (test mode) provee user, neuralSession,
   membership, programAssignment. hrv/instrument/nom35 retornan []
   silenciosamente vía safeFindMany — eso es correcto en tests. */

import { describe, test, expect, beforeEach } from "vitest";
import { db } from "./db";
import { buildUserSnapshot, buildUserSnapshotLite } from "./snapshot";

async function createTestUser({ id = "user_test_1", email = "u@test.local", neuralState = null } = {}) {
  const orm = await db();
  return orm.user.create({
    data: {
      id,
      email,
      locale: "es",
      timezone: "America/Mexico_City",
      neuralState,
      mfaEnabled: false,
      sessionEpoch: 0,
    },
  });
}

async function createSession({ userId, completedAt, protocolId = "1", coherenciaDelta = 5 }) {
  const orm = await db();
  return orm.neuralSession.create({
    data: {
      orgId: "org_test_1",
      userId,
      protocolId,
      durationSec: 300,
      coherenciaDelta,
      moodPre: 5,
      moodPost: 7,
      completedAt,
    },
  });
}

async function createProgramAssignment({ userId, programId, startedAt, completedAt = null, abandonedAt = null, completedDays = [] }) {
  const orm = await db();
  return orm.programAssignment.create({
    data: {
      userId,
      orgId: null,
      programId,
      startedAt,
      completedAt,
      abandonedAt,
      completedDays,
      source: "self-selected",
    },
  });
}

describe("buildUserSnapshot — Phase 6F SP-A", () => {
  // Memory adapter es global por module; cada test inicia con userId distinto
  // para evitar cross-pollution. No reset porque el adapter no expone `clear()`.

  test("retorna null cuando userId no existe", async () => {
    const snap = await buildUserSnapshot("nonexistent_user_id");
    expect(snap).toBeNull();
  });

  test("retorna null para userId vacío o no-string", async () => {
    expect(await buildUserSnapshot("")).toBeNull();
    expect(await buildUserSnapshot(null)).toBeNull();
    expect(await buildUserSnapshot(undefined)).toBeNull();
    expect(await buildUserSnapshot(123)).toBeNull();
  });

  test("retorna shape canónico para user con sesiones", async () => {
    const u = await createTestUser({ id: "user_snap_canon" });
    const now = Date.now();
    await createSession({ userId: u.id, completedAt: new Date(now - 86400_000) });
    await createSession({ userId: u.id, completedAt: new Date(now - 2 * 86400_000) });
    await createSession({ userId: u.id, completedAt: new Date(now - 3 * 86400_000) });

    const snap = await buildUserSnapshot(u.id);

    expect(snap).not.toBeNull();
    expect(snap.user.id).toBe(u.id);
    expect(snap.user.timezone).toBe("America/Mexico_City");
    expect(snap.user.locale).toBe("es");
    expect(snap.sessions).toHaveLength(3);
    expect(Array.isArray(snap.hrv)).toBe(true);
    expect(Array.isArray(snap.instruments)).toBe(true);
    expect(snap.nom35).toBeNull();
    expect(snap.activeProgram).toBeNull();
    expect(snap.programHistory).toEqual([]);
    expect(snap.windowDays).toBe(90);
    expect(snap.snapshotAt instanceof Date).toBe(true);
  });

  test("respeta window days param (excluye sesiones fuera de ventana)", async () => {
    const u = await createTestUser({ id: "user_snap_window" });
    const now = Date.now();
    // 2 sesiones dentro de 7d, 2 sesiones fuera (15d, 30d)
    await createSession({ userId: u.id, completedAt: new Date(now - 86400_000) });
    await createSession({ userId: u.id, completedAt: new Date(now - 2 * 86400_000) });
    await createSession({ userId: u.id, completedAt: new Date(now - 15 * 86400_000) });
    await createSession({ userId: u.id, completedAt: new Date(now - 30 * 86400_000) });

    const snap = await buildUserSnapshot(u.id, { days: 7 });
    expect(snap.sessions.length).toBe(2);
  });

  test("extrae chronotype de neuralState cuando está presente", async () => {
    const u = await createTestUser({
      id: "user_snap_chrono",
      neuralState: {
        chronotype: {
          type: "intermediate",
          category: "intermediate",
          label: "Intermedio",
          score: 12,
          bestTimeWindow: "midday",
          ts: Date.now(),
        },
      },
    });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.chronotype).toBeTruthy();
    expect(snap.chronotype.type).toBe("intermediate");
    expect(snap.chronotype.score).toBe(12);
  });

  test("chronotype null cuando neuralState ausente", async () => {
    const u = await createTestUser({ id: "user_snap_no_chrono", neuralState: null });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.chronotype).toBeNull();
  });

  test("detecta activeProgram (sin completedAt ni abandonedAt)", async () => {
    const u = await createTestUser({ id: "user_snap_active" });
    await createProgramAssignment({
      userId: u.id,
      programId: "burnout-recovery",
      startedAt: new Date(Date.now() - 5 * 86400_000),
    });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.activeProgram).toBeTruthy();
    expect(snap.activeProgram.programId).toBe("burnout-recovery");
    expect(snap.programHistory).toEqual([]);
  });

  test("activeProgram null cuando programa fue abandonado", async () => {
    const u = await createTestUser({ id: "user_snap_abandoned" });
    await createProgramAssignment({
      userId: u.id,
      programId: "focus-sprint",
      startedAt: new Date(Date.now() - 10 * 86400_000),
      abandonedAt: new Date(Date.now() - 3 * 86400_000),
    });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.activeProgram).toBeNull();
    expect(snap.programHistory).toHaveLength(1);
    expect(snap.programHistory[0].programId).toBe("focus-sprint");
  });

  test("activeProgram null cuando programa fue completado", async () => {
    const u = await createTestUser({ id: "user_snap_completed" });
    await createProgramAssignment({
      userId: u.id,
      programId: "recovery-week",
      startedAt: new Date(Date.now() - 10 * 86400_000),
      completedAt: new Date(Date.now() - 3 * 86400_000),
      completedDays: [1, 2, 3, 4, 5, 6, 7],
    });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.activeProgram).toBeNull();
    expect(snap.programHistory).toHaveLength(1);
  });

  test("user sin memberships → orgId/teamId/role null", async () => {
    const u = await createTestUser({ id: "user_snap_no_org" });
    const snap = await buildUserSnapshot(u.id);
    expect(snap.user.orgId).toBeNull();
    expect(snap.user.teamId).toBeNull();
    expect(snap.user.role).toBeNull();
  });

  test("buildUserSnapshotLite sólo retorna user/sessions/hrv/chronotype", async () => {
    const u = await createTestUser({
      id: "user_snap_lite",
      neuralState: { chronotype: { type: "moderate_morning", score: 18 } },
    });
    await createSession({ userId: u.id, completedAt: new Date() });

    const lite = await buildUserSnapshotLite(u.id);
    expect(lite).not.toBeNull();
    expect(lite.user.id).toBe(u.id);
    expect(lite.sessions.length).toBe(1);
    expect(lite.chronotype.type).toBe("moderate_morning");
    expect(lite.windowDays).toBe(30); // default lite
    expect(lite).not.toHaveProperty("nom35");
    expect(lite).not.toHaveProperty("activeProgram");
    expect(lite).not.toHaveProperty("instruments");
  });

  test("buildUserSnapshotLite retorna null para user inexistente", async () => {
    expect(await buildUserSnapshotLite("nonexistent_lite")).toBeNull();
    expect(await buildUserSnapshotLite("")).toBeNull();
  });
});
