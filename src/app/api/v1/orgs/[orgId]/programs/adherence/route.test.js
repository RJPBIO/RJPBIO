/* Tests Phase 6F SP-A — endpoint /api/v1/orgs/[orgId]/programs/adherence
   Cubre: 401, 403 (role gate), k-anon supression k<5, agregaciones
   correctas, audit log. */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/db", () => ({ db: vi.fn() }));
vi.mock("@/server/audit", () => ({ auditLog: vi.fn(async () => ({})) }));

import { GET } from "./route";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

beforeEach(() => {
  vi.clearAllMocks();
});

function buildOrm(programAssignments = []) {
  return {
    programAssignment: {
      findMany: vi.fn(async () => programAssignments),
    },
  };
}

function mockReq(orgId = "org_1", searchParams = {}) {
  const url = new URL("https://app.bio-ignicion.app/api/v1/orgs/" + orgId + "/programs/adherence");
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, String(v));
  return { url: url.toString() };
}

const ctx = (orgId = "org_1") => ({ params: Promise.resolve({ orgId }) });

const NOW = Date.now();
function makeAssignment({ programId, daysAgo = 10, completed = false, abandoned = false }) {
  const startedAt = new Date(NOW - daysAgo * 86400_000);
  return {
    id: `pa_${programId}_${daysAgo}`,
    programId,
    orgId: "org_1",
    startedAt,
    completedAt: completed ? new Date() : null,
    abandonedAt: abandoned ? new Date() : null,
    completedDays: [],
  };
}

describe("GET /api/v1/orgs/[orgId]/programs/adherence", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(401);
  });

  it("400 si orgId vacío en params", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(""), { params: Promise.resolve({ orgId: "" }) });
    expect(res.status).toBe(400);
  });

  it("403 si user no es member del org", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("403 si user es MEMBER (sólo OWNER/ADMIN/MANAGER permitidos)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "MEMBER" }],
    });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("403 si membership está deactivated", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN", deactivatedAt: new Date() }],
    });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("200 + array vacío cuando no hay assignments", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm([]));
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.programs).toEqual([]);
    expect(j.totalAssignments).toBe(0);
    expect(j.minK).toBe(5);
  });

  it("supprime metrics cuando programa tiene n<5 (k-anonymity)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "MANAGER" }],
    });
    // 3 assignments para neural-baseline (< 5)
    const assignments = [
      makeAssignment({ programId: "neural-baseline", daysAgo: 5 }),
      makeAssignment({ programId: "neural-baseline", daysAgo: 10 }),
      makeAssignment({ programId: "neural-baseline", daysAgo: 15 }),
    ];
    db.mockResolvedValue(buildOrm(assignments));
    const res = await GET(mockReq(), ctx());
    const j = await res.json();
    const nb = j.programs.find((p) => p.programId === "neural-baseline");
    expect(nb.suppressed).toBe(true);
    expect(nb.reason).toBe("k_anonymity");
    // No se exponen métricas individuales
    expect(nb.n).toBeUndefined();
    expect(nb.completionRate).toBeUndefined();
  });

  it("expone metrics cuando n >= 5", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "OWNER" }],
    });
    // 6 assignments: 3 completed, 1 abandoned, 2 active
    const assignments = [
      makeAssignment({ programId: "burnout-recovery", completed: true, daysAgo: 30 }),
      makeAssignment({ programId: "burnout-recovery", completed: true, daysAgo: 25 }),
      makeAssignment({ programId: "burnout-recovery", completed: true, daysAgo: 20 }),
      makeAssignment({ programId: "burnout-recovery", abandoned: true, daysAgo: 15 }),
      makeAssignment({ programId: "burnout-recovery", daysAgo: 10 }),
      makeAssignment({ programId: "burnout-recovery", daysAgo: 5 }),
    ];
    db.mockResolvedValue(buildOrm(assignments));
    const res = await GET(mockReq(), ctx());
    const j = await res.json();
    const br = j.programs.find((p) => p.programId === "burnout-recovery");
    expect(br.suppressed).toBe(false);
    expect(br.n).toBe(6);
    expect(br.completed).toBe(3);
    expect(br.abandoned).toBe(1);
    expect(br.active).toBe(2);
    expect(br.completionRate).toBe(0.5); // 3/6
    expect(br.abandonRate).toBeCloseTo(0.167, 2);
  });

  it("respeta param days (default 90, cap 730)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm([]));
    const res = await GET(mockReq("org_1", { days: 9999 }), ctx());
    const j = await res.json();
    expect(j.periodDays).toBe(730); // capped
  });

  it("acepta days=30 custom", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm([]));
    const res = await GET(mockReq("org_1", { days: 30 }), ctx());
    const j = await res.json();
    expect(j.periodDays).toBe(30);
  });

  it("audit log fired con suppressedCount + programsCount", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    const assignments = [
      makeAssignment({ programId: "neural-baseline" }),
      makeAssignment({ programId: "neural-baseline" }),
    ];
    db.mockResolvedValue(buildOrm(assignments));
    await GET(mockReq(), ctx());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "org.program.adherence.viewed",
        orgId: "org_1",
        actorId: "u1",
        payload: expect.objectContaining({
          totalAssignments: 2,
          suppressedCount: 1,
        }),
      })
    );
  });

  it("agrupa correctamente cuando hay múltiples programIds", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    const assignments = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeAssignment({ programId: "burnout-recovery", daysAgo: i + 1, completed: i < 3 })
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        makeAssignment({ programId: "focus-sprint", daysAgo: i + 10, completed: i < 5 })
      ),
    ];
    db.mockResolvedValue(buildOrm(assignments));
    const res = await GET(mockReq(), ctx());
    const j = await res.json();
    expect(j.programs).toHaveLength(2);
    const fs = j.programs.find((p) => p.programId === "focus-sprint");
    expect(fs.completionRate).toBeCloseTo(5 / 6, 2);
    expect(j.totalAssignments).toBe(11);
  });
});
