/* Tests Phase 6F SP-E — GET /api/v1/me/burnout */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/audit", () => ({ auditLog: vi.fn(async () => ({})) }));
vi.mock("@/server/snapshot", () => ({ buildUserSnapshot: vi.fn() }));
vi.mock("@/lib/burnoutEnhanced", async () => {
  const actual = await vi.importActual("@/lib/burnoutEnhanced");
  return {
    ...actual,
    assessBurnoutEnhanced: vi.fn(),
    wellbeingCopy: vi.fn(),
  };
});

import { GET } from "./route";
import { auth } from "@/server/auth";
import { auditLog } from "@/server/audit";
import { buildUserSnapshot } from "@/server/snapshot";
import { assessBurnoutEnhanced, wellbeingCopy } from "@/lib/burnoutEnhanced";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockReq = (params = {}) => {
  const url = new URL("https://app.bio-ignicion.app/api/v1/me/burnout");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return { url: url.toString() };
};

describe("GET /api/v1/me/burnout", () => {
  it("401 sin sesión", async () => {
    auth.mockResolvedValue(null);
    const res = await GET(mockReq());
    expect(res.status).toBe(401);
  });

  it("404 cuando snapshot null (user no existe)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue(null);
    const res = await GET(mockReq());
    expect(res.status).toBe(404);
  });

  it("200 + retorna assessment + copy + period", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u1", orgId: "org_1" },
      sessions: [],
      hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok",
      signals: [],
      metrics: {},
      n: 0,
      snapshot: { disclaimer: "test disclaimer" },
    });
    wellbeingCopy.mockReturnValue({
      title: "OK",
      severity: "info",
    });
    const res = await GET(mockReq());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.assessment.level).toBe("ok");
    expect(j.copy.title).toBe("OK");
    expect(j.period.days).toBe(28);
  });

  it("clampea days param a [7..90] (default 28)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue({ user: { id: "u1" }, sessions: [], hrv: [] });
    assessBurnoutEnhanced.mockReturnValue({ level: "ok", signals: [], metrics: {}, snapshot: {} });
    wellbeingCopy.mockReturnValue({});

    await GET(mockReq({ days: 9999 }));
    expect(buildUserSnapshot).toHaveBeenLastCalledWith("u1", { days: 90 });

    await GET(mockReq({ days: 1 }));
    expect(buildUserSnapshot).toHaveBeenLastCalledWith("u1", { days: 7 });

    await GET(mockReq({ days: 60 }));
    expect(buildUserSnapshot).toHaveBeenLastCalledWith("u1", { days: 60 });
  });

  it("usa default 28 cuando days no se pasa", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue({ user: { id: "u1" }, sessions: [], hrv: [] });
    assessBurnoutEnhanced.mockReturnValue({ level: "ok", signals: [], metrics: {}, snapshot: {} });
    wellbeingCopy.mockReturnValue({});
    await GET(mockReq());
    expect(buildUserSnapshot).toHaveBeenCalledWith("u1", { days: 28 });
  });

  it("audit log fired con level + signalsCount + days + orgId", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u1", orgId: "org_1" },
      sessions: [],
      hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "warn",
      signals: ["freqDrop", "hrvDecline"],
      metrics: {},
      snapshot: {},
    });
    wellbeingCopy.mockReturnValue({});

    await GET(mockReq({ days: 60 }));

    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "u1",
        orgId: "org_1",
        action: "me.burnout.viewed",
        target: "u1",
        payload: expect.objectContaining({
          level: "warn",
          signalsCount: 2,
          days: 60,
        }),
      })
    );
  });

  it("audit log con orgId undefined cuando user sin org no-personal", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    buildUserSnapshot.mockResolvedValue({
      user: { id: "u1", orgId: null },
      sessions: [],
      hrv: [],
    });
    assessBurnoutEnhanced.mockReturnValue({
      level: "ok",
      signals: [],
      metrics: {},
      snapshot: {},
    });
    wellbeingCopy.mockReturnValue({});
    await GET(mockReq());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "u1",
        action: "me.burnout.viewed",
      })
    );
    // orgId puede ser undefined (no se setea explícitamente cuando null)
    const call = auditLog.mock.calls[0][0];
    expect(call.orgId).toBeUndefined();
  });
});
