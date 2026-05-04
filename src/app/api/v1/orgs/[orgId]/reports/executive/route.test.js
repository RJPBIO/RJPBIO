/* Tests Phase 6F SP-C — GET /api/v1/orgs/[orgId]/reports/executive */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("@/server/executiveReport", () => ({
  buildExecutiveReport: vi.fn(async () => null),
}));

import { GET } from "./route";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildExecutiveReport } from "@/server/executiveReport";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockReq = (orgId = "org_1", searchParams = {}) => {
  const url = new URL(`https://app.bio-ignicion.app/api/v1/orgs/${orgId}/reports/executive`);
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, String(v));
  return { url: url.toString() };
};
const ctx = (orgId = "org_1") => ({ params: Promise.resolve({ orgId }) });

describe("GET /api/v1/orgs/[orgId]/reports/executive", () => {
  it("401 sin session", async () => {
    auth.mockResolvedValue(null);
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(401);
  });

  it("400 cuando orgId vacío", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(""), { params: Promise.resolve({ orgId: "" }) });
    expect(res.status).toBe(400);
  });

  it("403 cuando user NO es member", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("403 cuando role es MEMBER (no MANAGER+)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "MEMBER" }],
    });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("403 cuando membership está deactivated", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN", deactivatedAt: new Date() }],
    });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("404 cuando buildExecutiveReport retorna null (org no existe)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    buildExecutiveReport.mockResolvedValueOnce(null);
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(404);
  });

  it("200 + payload del reporte cuando happy path", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "OWNER" }],
    });
    const fakeReport = {
      org: { id: "org_1", name: "Acme", plan: "STARTER", activeMembers: 10 },
      kpis: { activeMembers: 10, sessionsTotal: 50 },
      period: { days: 90 },
      snapshot: { generatedAt: new Date(), version: "v1", kAnonThreshold: 5 },
    };
    buildExecutiveReport.mockResolvedValueOnce(fakeReport);
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.org.id).toBe("org_1");
    expect(j.kpis.activeMembers).toBe(10);
  });

  it("clampea days param a [7..365]", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    buildExecutiveReport.mockResolvedValueOnce({
      org: { id: "org_1" },
      kpis: {},
      period: { days: 365 },
      snapshot: {},
    });
    await GET(mockReq("org_1", { days: 9999 }), ctx());
    expect(buildExecutiveReport).toHaveBeenCalledWith("org_1", { days: 365 });

    buildExecutiveReport.mockResolvedValueOnce({
      org: { id: "org_1" },
      kpis: {},
      period: { days: 7 },
      snapshot: {},
    });
    await GET(mockReq("org_1", { days: 1 }), ctx());
    expect(buildExecutiveReport).toHaveBeenLastCalledWith("org_1", { days: 7 });
  });

  it("usa default 90 cuando days no se pasa", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    buildExecutiveReport.mockResolvedValueOnce({
      org: { id: "org_1" }, kpis: {}, period: { days: 90 }, snapshot: {},
    });
    await GET(mockReq(), ctx());
    expect(buildExecutiveReport).toHaveBeenCalledWith("org_1", { days: 90 });
  });

  it("audit log fired con orgId + actorId + suppressed flag + activeMembers", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    buildExecutiveReport.mockResolvedValueOnce({
      org: { id: "org_1", activeMembers: 8 },
      kpis: {}, period: { days: 90 }, snapshot: {},
    });
    await GET(mockReq(), ctx());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_1",
        actorId: "u1",
        action: "org.executive_report.viewed",
        payload: expect.objectContaining({
          days: 90,
          suppressed: false,
          activeMembers: 8,
        }),
      })
    );
  });

  it("audit log captura suppressed:true cuando reporte fue k-anon", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "MANAGER" }],
    });
    buildExecutiveReport.mockResolvedValueOnce({
      org: { id: "org_1", activeMembers: 3 },
      suppressed: true,
      reason: "k_anonymity",
      snapshot: {},
    });
    await GET(mockReq(), ctx());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ suppressed: true, activeMembers: 3 }),
      })
    );
  });
});
