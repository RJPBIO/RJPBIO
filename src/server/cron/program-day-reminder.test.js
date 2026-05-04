/* Tests Phase 6F SP-A — cron program-day-reminder.
   Mock orm + enqueuePush + auditLog. Verifica:
     - skip cuando no hay assignments activas
     - skip cuando sesión hoy ya completada
     - skip cuando user no tiene push subs
     - encola cuando todo OK + audit log fired
*/

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({ db: vi.fn() }));
vi.mock("../audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("../push-delivery", () => ({
  enqueuePush: vi.fn(async () => ({ ok: true, id: "po_1" })),
}));

import { runProgramDayReminder } from "./program-day-reminder";
import { db } from "../db";
import { auditLog } from "../audit";
import { enqueuePush } from "../push-delivery";

beforeEach(() => {
  vi.clearAllMocks();
});

function buildOrm({ assignments = [], pushSubs = [] } = {}) {
  return {
    programAssignment: {
      findMany: vi.fn(async () => assignments),
    },
    pushSubscription: {
      findMany: vi.fn(async () => pushSubs),
    },
  };
}

const NOW = Date.now();

function makeAssignment({
  userId,
  programId,
  startedDaysAgo = 0,
  completedDays = [],
}) {
  return {
    id: `pa_${userId}_${programId}`,
    userId,
    programId,
    orgId: null,
    startedAt: new Date(NOW - startedDaysAgo * 86400_000),
    completedAt: null,
    abandonedAt: null,
    completedDays,
  };
}

describe("runProgramDayReminder — Phase 6F SP-A", () => {
  it("retorna processed:0 cuando no hay assignments activas", async () => {
    db.mockResolvedValue(buildOrm({ assignments: [] }));
    const r = await runProgramDayReminder();
    expect(r.processed).toBe(0);
    expect(r.errors).toBe(0);
    expect(r.details.activeAssignments).toBe(0);
    expect(enqueuePush).not.toHaveBeenCalled();
  });

  it("encola push para user con sesión hoy + push subs", async () => {
    // Burnout Recovery día 1: protocolId 15. Empezó hoy (startedDaysAgo=0).
    const assignments = [
      makeAssignment({
        userId: "u1",
        programId: "burnout-recovery",
        startedDaysAgo: 0,
        completedDays: [],
      }),
    ];
    db.mockResolvedValue(
      buildOrm({
        assignments,
        pushSubs: [{ id: "ps_1", userId: "u1", endpoint: "https://fcm/x" }],
      })
    );
    const r = await runProgramDayReminder();
    expect(enqueuePush).toHaveBeenCalledTimes(1);
    expect(enqueuePush).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        kind: "program-reminder",
        href: "/app",
      })
    );
    expect(r.processed).toBe(1);
    expect(r.details.pushed).toBe(1);
  });

  it("skip cuando sesión hoy YA está completada", async () => {
    // Burnout Recovery día 1 ya completado (completedDays:[1]).
    const assignments = [
      makeAssignment({
        userId: "u2",
        programId: "burnout-recovery",
        startedDaysAgo: 0,
        completedDays: [1],
      }),
    ];
    db.mockResolvedValue(
      buildOrm({
        assignments,
        pushSubs: [{ id: "ps", userId: "u2", endpoint: "x" }],
      })
    );
    const r = await runProgramDayReminder();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(r.details.skippedAlreadyDone).toBe(1);
  });

  it("skip cuando hoy es día de reposo (sparse schedule)", async () => {
    // Burnout Recovery: día 2 NO tiene sesión (sparse: 1, 3, 5, 7...).
    const assignments = [
      makeAssignment({
        userId: "u3",
        programId: "burnout-recovery",
        startedDaysAgo: 1, // hoy es día 2
      }),
    ];
    db.mockResolvedValue(
      buildOrm({
        assignments,
        pushSubs: [{ id: "ps", userId: "u3", endpoint: "x" }],
      })
    );
    const r = await runProgramDayReminder();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(r.details.skippedNoSession).toBe(1);
  });

  it("skip cuando user NO tiene push subscriptions", async () => {
    const assignments = [
      makeAssignment({
        userId: "u4",
        programId: "burnout-recovery",
        startedDaysAgo: 0,
      }),
    ];
    db.mockResolvedValue(buildOrm({ assignments, pushSubs: [] }));
    const r = await runProgramDayReminder();
    expect(enqueuePush).not.toHaveBeenCalled();
    expect(r.details.skippedNoSubs).toBe(1);
  });

  it("aggrega resultados con multiple assignments mixtos", async () => {
    const assignments = [
      // u1: día 1 BR pendiente → push
      makeAssignment({ userId: "u1", programId: "burnout-recovery", startedDaysAgo: 0 }),
      // u2: día 2 BR es reposo → skip
      makeAssignment({ userId: "u2", programId: "burnout-recovery", startedDaysAgo: 1 }),
      // u3: día 1 BR ya completado → skip
      makeAssignment({
        userId: "u3",
        programId: "burnout-recovery",
        startedDaysAgo: 0,
        completedDays: [1],
      }),
    ];
    db.mockResolvedValue(
      buildOrm({
        assignments,
        pushSubs: [
          { id: "ps_u1", userId: "u1", endpoint: "x" },
          { id: "ps_u2", userId: "u2", endpoint: "x" },
          { id: "ps_u3", userId: "u3", endpoint: "x" },
        ],
      })
    );
    // El mock pushSubs.findMany retorna TODAS las subs — el cron filtra
    // por userId. Como findMany ignora where en este mock simple, vamos
    // a aceptar ese sesgo en el test (todos los users "tienen subs").
    const r = await runProgramDayReminder();
    expect(r.details.pushed + r.details.skippedNoSession + r.details.skippedAlreadyDone).toBe(3);
    expect(r.details.activeAssignments).toBe(3);
  });

  it("audit log fired con stats al completar", async () => {
    db.mockResolvedValue(buildOrm({ assignments: [] }));
    await runProgramDayReminder();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "cron.program-day-reminder.tick",
        payload: expect.objectContaining({
          activeAssignments: 0,
          pushed: 0,
        }),
      })
    );
  });
});
