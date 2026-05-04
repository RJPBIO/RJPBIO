/* Tests Phase 6F SP-A — endpoints /api/v1/me/program/{active,start,abandon,reEval}
   ───────────────────────────────────────────────────────────────────
   Pattern reusado de src/app/api/v1/me/security/route.test.js:
     - vi.mock("@/server/auth") + vi.mock("@/server/db")
     - cada test inyecta auth.mockResolvedValue + db.mockResolvedValue
   ─────────────────────────────────────────────────────────────────── */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/db", () => ({ db: vi.fn() }));
vi.mock("@/server/audit", () => ({ auditLog: vi.fn(async () => ({})) }));

// Import after mocks
import { GET as getActive } from "./active/route";
import { POST as postStart } from "./start/route";
import { POST as postAbandon } from "./abandon/route";
import { POST as postReEval } from "./reEval/route";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

beforeEach(() => {
  vi.clearAllMocks();
});

/* ─── Mocks helpers ───────────────────────────────────────────────── */

function buildOrm({
  user = null,
  activeAssignment = null,
  programAssignments = [],
  membershipsForUser = [],
} = {}) {
  return {
    user: {
      findUnique: vi.fn(async () => user),
    },
    membership: {
      findMany: vi.fn(async () => membershipsForUser),
    },
    programAssignment: {
      findFirst: vi.fn(async ({ where }) => {
        if (where?.userId && where?.completedAt === null && where?.abandonedAt === null) {
          return activeAssignment;
        }
        return programAssignments[0] || null;
      }),
      findMany: vi.fn(async () => programAssignments),
      create: vi.fn(async ({ data }) => ({ id: "pa_new_1", ...data })),
      update: vi.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    },
    instrument: {
      findMany: vi.fn(async () => []),
      create: vi.fn(async ({ data }) => ({ id: "ins_new_1", ...data })),
    },
    neuralSession: { findMany: vi.fn(async () => []) },
    hrvMeasurement: { findMany: vi.fn(async () => []) },
    nom35Response: { findMany: vi.fn(async () => []) },
  };
}

function mockRequest(body) {
  return {
    json: async () => body,
  };
}

/* ════════════════════════════════════════════════════════════════════
   GET /api/v1/me/program/active
   ════════════════════════════════════════════════════════════════════ */
describe("GET /api/v1/me/program/active", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await getActive();
    expect(res.status).toBe(401);
  });

  it("404 cuando user no existe", async () => {
    auth.mockResolvedValue({ user: { id: "u_missing" } });
    db.mockResolvedValue(buildOrm({ user: null }));
    const res = await getActive();
    expect(res.status).toBe(404);
  });

  it("200 + active:null cuando no hay programa activo", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(
      buildOrm({
        user: { id: "u1", neuralState: null, timezone: "America/Mexico_City", locale: "es" },
        programAssignments: [],
      })
    );
    const res = await getActive();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.active).toBeNull();
  });

  it("200 con todayStatus + lagStatus + progress + reEval cuando hay activeProgram", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const startedAt = new Date(Date.now() - 5 * 86400_000);
    db.mockResolvedValue(
      buildOrm({
        user: { id: "u1", neuralState: null, timezone: "America/Mexico_City", locale: "es" },
        programAssignments: [
          {
            id: "pa_1",
            programId: "burnout-recovery",
            startedAt,
            completedAt: null,
            abandonedAt: null,
            completedDays: [1, 3],
            reEvalAt: new Date(startedAt.getTime() + 14 * 86400_000),
            reEvalCompletedAt: null,
            source: "self-selected",
          },
        ],
      })
    );
    const res = await getActive();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.active).not.toBeNull();
    expect(json.active.programId).toBe("burnout-recovery");
    expect(json.active.todayStatus).toBeDefined();
    expect(json.active.lagStatus).toBeDefined();
    expect(json.active.progress).toBeDefined();
    expect(json.active.progress.completed).toBe(2);
    expect(json.active.reEval).toBeDefined();
    expect(json.active.reEval.completed).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════════
   POST /api/v1/me/program/start
   ════════════════════════════════════════════════════════════════════ */
describe("POST /api/v1/me/program/start", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await postStart(mockRequest({ programId: "neural-baseline" }));
    expect(res.status).toBe(401);
  });

  it("400 si body inválido (no JSON)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const req = { json: async () => { throw new Error("bad json"); } };
    const res = await postStart(req);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_body");
  });

  it("400 si programId no existe en catálogo", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    db.mockResolvedValue(buildOrm());
    const res = await postStart(mockRequest({ programId: "fake-program" }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_program");
  });

  it("400 si source no es uno de los permitidos", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    db.mockResolvedValue(buildOrm());
    const res = await postStart(
      mockRequest({ programId: "neural-baseline", source: "hacker-injection" })
    );
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_source");
  });

  it("201 con assignment y reEvalAt para Burnout Recovery", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", org: { id: "org_1", personal: false } }],
    });
    db.mockResolvedValue(buildOrm({ activeAssignment: null }));
    const res = await postStart(
      mockRequest({ programId: "burnout-recovery", source: "suggested-burnout-alert" })
    );
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.assignment.programId).toBe("burnout-recovery");
    expect(j.assignment.reEvalAt).not.toBeNull();
    expect(j.assignment.source).toBe("suggested-burnout-alert");
    expect(j.assignment.orgId).toBe("org_1");
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "program.started" })
    );
  });

  it("201 con reEvalAt:null para programas sin reEvalEvery", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    db.mockResolvedValue(buildOrm({ activeAssignment: null }));
    const res = await postStart(mockRequest({ programId: "focus-sprint" }));
    const j = await res.json();
    expect(j.assignment.reEvalAt).toBeNull();
  });

  it("abandona programa previo si existe activeProgram al iniciar otro", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const orm = buildOrm({
      activeAssignment: {
        id: "pa_old",
        programId: "neural-baseline",
        completedAt: null,
        abandonedAt: null,
      },
    });
    db.mockResolvedValue(orm);
    await postStart(mockRequest({ programId: "focus-sprint" }));
    expect(orm.programAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pa_old" },
        data: expect.objectContaining({ abandonedAt: expect.any(Date) }),
      })
    );
  });

  it("usa orgId no-personal preferido sobre personal", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [
        { orgId: "personal_x", org: { id: "personal_x", personal: true } },
        { orgId: "org_real", org: { id: "org_real", personal: false } },
      ],
    });
    db.mockResolvedValue(buildOrm({ activeAssignment: null }));
    const res = await postStart(mockRequest({ programId: "focus-sprint" }));
    const j = await res.json();
    expect(j.assignment.orgId).toBe("org_real");
  });
});

/* ════════════════════════════════════════════════════════════════════
   POST /api/v1/me/program/abandon
   ════════════════════════════════════════════════════════════════════ */
describe("POST /api/v1/me/program/abandon", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await postAbandon();
    expect(res.status).toBe(401);
  });

  it("404 si no hay activeProgram", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm({ activeAssignment: null }));
    const res = await postAbandon();
    expect(res.status).toBe(404);
    const j = await res.json();
    expect(j.error).toBe("no_active_program");
  });

  it("200 + audit log al marcar abandonedAt", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const orm = buildOrm({
      activeAssignment: {
        id: "pa_2",
        programId: "burnout-recovery",
        orgId: "org_1",
        completedAt: null,
        abandonedAt: null,
      },
    });
    db.mockResolvedValue(orm);
    const res = await postAbandon();
    expect(res.status).toBe(200);
    expect(orm.programAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pa_2" },
        data: expect.objectContaining({ abandonedAt: expect.any(Date) }),
      })
    );
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "program.abandoned", target: "pa_2" })
    );
  });
});

/* ════════════════════════════════════════════════════════════════════
   POST /api/v1/me/program/reEval
   ════════════════════════════════════════════════════════════════════ */
describe("POST /api/v1/me/program/reEval", () => {
  const validBody = {
    instrumentId: "pss-4",
    score: 8,
    level: "moderate",
    answers: { q1: 2, q2: 1, q3: 2, q4: 3 },
  };

  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await postReEval(mockRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("400 si instrumentId !== 'pss-4'", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm());
    const res = await postReEval(mockRequest({ ...validBody, instrumentId: "phq-2" }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("invalid_instrument");
  });

  it("400 si score fuera de rango 0..16", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm());
    const res = await postReEval(mockRequest({ ...validBody, score: 99 }));
    expect(res.status).toBe(400);
  });

  it("400 si level no es low|moderate|high", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm());
    const res = await postReEval(mockRequest({ ...validBody, level: "extreme" }));
    expect(res.status).toBe(400);
  });

  it("400 si answers ausente", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm());
    const res = await postReEval(mockRequest({ ...validBody, answers: null }));
    expect(res.status).toBe(400);
  });

  it("404 si no hay activeProgram", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(buildOrm({ activeAssignment: null }));
    const res = await postReEval(mockRequest(validBody));
    expect(res.status).toBe(404);
    const j = await res.json();
    expect(j.error).toBe("no_active_program");
  });

  it("400 si programa no tiene reEvalAt", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(
      buildOrm({
        activeAssignment: {
          id: "pa_3",
          programId: "focus-sprint",
          reEvalAt: null,
          reEvalCompletedAt: null,
        },
      })
    );
    const res = await postReEval(mockRequest(validBody));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("no_reeval_due");
  });

  it("400 si re-eval ya completada (idempotente protector)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue(
      buildOrm({
        activeAssignment: {
          id: "pa_4",
          programId: "burnout-recovery",
          reEvalAt: new Date(),
          reEvalCompletedAt: new Date(),
        },
      })
    );
    const res = await postReEval(mockRequest(validBody));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("reeval_already_completed");
  });

  it("200 + persiste Instrument + marca reEvalCompletedAt + audit", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const orm = buildOrm({
      activeAssignment: {
        id: "pa_5",
        programId: "burnout-recovery",
        orgId: "org_1",
        reEvalAt: new Date(),
        reEvalCompletedAt: null,
      },
    });
    db.mockResolvedValue(orm);
    const res = await postReEval(mockRequest(validBody));
    expect(res.status).toBe(200);
    expect(orm.instrument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          instrumentId: "pss-4",
          score: 8,
          level: "moderate",
        }),
      })
    );
    expect(orm.programAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pa_5" },
        data: expect.objectContaining({ reEvalCompletedAt: expect.any(Date) }),
      })
    );
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "program.reEval.completed" })
    );
  });
});
