/* Tests Phase 6F SP-E — GET /api/v1/orgs/[orgId]/burnout/aggregate */

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

function buildOrm({ members = [], scores = [] } = {}) {
  return {
    membership: {
      findMany: vi.fn(async () => members),
    },
    burnoutScore: {
      findMany: vi.fn(async () => scores),
    },
  };
}

const mockReq = (orgId = "org_1", searchParams = {}) => {
  const url = new URL(`https://app.bio-ignicion.app/api/v1/orgs/${orgId}/burnout/aggregate`);
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, String(v));
  return { url: url.toString() };
};
const ctx = (orgId = "org_1") => ({ params: Promise.resolve({ orgId }) });

const NOW = Date.now();
function makeScore({ userId, level, daysAgo = 1, signals = [] }) {
  return {
    id: `bs_${userId}_${daysAgo}`,
    userId,
    orgId: "org_1",
    level,
    signals,
    metrics: {},
    computedAt: new Date(NOW - daysAgo * 86400_000),
    notifiedAt: null,
  };
}

describe("GET /api/v1/orgs/[orgId]/burnout/aggregate", () => {
  it("401 sin sesión", async () => {
    auth.mockResolvedValue(null);
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(401);
  });

  it("400 cuando orgId vacío", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(""), { params: Promise.resolve({ orgId: "" }) });
    expect(res.status).toBe(400);
  });

  it("403 cuando user NO es member del org", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, memberships: [] });
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(403);
  });

  it("403 cuando role es MEMBER", async () => {
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

  it("suppressed top-level cuando members < 5", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(
      buildOrm({
        members: [
          { userId: "u1", orgId: "org_1" },
          { userId: "u2", orgId: "org_1" },
          { userId: "u3", orgId: "org_1" },
        ],
      })
    );
    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.suppressed).toBe(true);
    expect(j.reason).toBe("k_anonymity");
    expect(j.message).toMatch(/mínimo 5/i);
    expect(j.snapshot.disclaimer).toMatch(/k≥5/);
  });

  it("200 + distribution con bands suprimidas si count < 5", async () => {
    const members = Array.from({ length: 10 }, (_, i) => ({
      userId: `u${i + 1}`,
      orgId: "org_1",
    }));
    // 7 ok + 3 watch (watch < 5 → null) + 0 warn + 0 alert
    const scores = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeScore({ userId: `u${i + 1}`, level: "ok" })
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeScore({ userId: `u${i + 8}`, level: "watch" })
      ),
    ];
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "OWNER" }],
    });
    db.mockResolvedValue(buildOrm({ members, scores }));

    const res = await GET(mockReq(), ctx());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.suppressed).toBeUndefined();
    expect(j.n).toBe(10);
    expect(j.members).toBe(10);
    // ok=7 ≥5 → expuesto. watch=3 <5 → suppressed (null).
    expect(j.distribution.ok).toBe(7);
    expect(j.distribution.watch).toBeNull();
    expect(j.distribution.warn).toBeNull(); // 0 < 5
    expect(j.distribution.alert).toBeNull();
  });

  it("topSignals con k-anon: signals con count <5 → suppressed", async () => {
    const members = Array.from({ length: 8 }, (_, i) => ({ userId: `u${i + 1}`, orgId: "org_1" }));
    // 6 users con freqDrop, 2 users con hrvDecline
    const scores = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeScore({ userId: `u${i + 1}`, level: "watch", signals: ["freqDrop"] })
      ),
      ...Array.from({ length: 2 }, (_, i) =>
        makeScore({ userId: `u${i + 7}`, level: "watch", signals: ["hrvDecline"] })
      ),
    ];
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm({ members, scores }));

    const res = await GET(mockReq(), ctx());
    const j = await res.json();
    const freqDrop = j.topSignals.find((s) => s.signal === "freqDrop");
    const hrvDecline = j.topSignals.find((s) => s.signal === "hrvDecline");
    expect(freqDrop.count).toBe(6);
    expect(freqDrop.suppressed).toBe(false);
    expect(hrvDecline.count).toBeNull();
    expect(hrvDecline.suppressed).toBe(true);
  });

  it("usa último BurnoutScore per user (no duplica si user tiene varios)", async () => {
    const members = Array.from({ length: 5 }, (_, i) => ({
      userId: `u${i + 1}`,
      orgId: "org_1",
    }));
    // u1 tiene 2 scores: el más reciente (1d ago) "warn", el viejo (5d ago) "ok"
    const scores = [
      makeScore({ userId: "u1", level: "ok", daysAgo: 5 }),
      makeScore({ userId: "u1", level: "warn", daysAgo: 1 }),
      ...Array.from({ length: 4 }, (_, i) =>
        makeScore({ userId: `u${i + 2}`, level: "warn", daysAgo: 1 })
      ),
    ];
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm({ members, scores }));

    const res = await GET(mockReq(), ctx());
    const j = await res.json();
    // Solo cuenta 1 score por user (el más reciente). 5 warn (≥5 → expuesto).
    expect(j.n).toBe(5);
    expect(j.distribution.warn).toBe(5);
    expect(j.distribution.ok).toBeNull(); // 0 → null (no ≥5)
  });

  it("clampea days param a [7..90]", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    db.mockResolvedValue(buildOrm({ members: [] }));

    const r1 = await GET(mockReq("org_1", { days: 9999 }), ctx());
    const j1 = await r1.json();
    expect(j1.period.days).toBe(90);

    const r2 = await GET(mockReq("org_1", { days: 1 }), ctx());
    const j2 = await r2.json();
    expect(j2.period.days).toBe(7);
  });

  it("audit log fired con suppressed flag + members + n", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "ADMIN" }],
    });
    const members = Array.from({ length: 5 }, (_, i) => ({ userId: `u${i + 1}`, orgId: "org_1" }));
    const scores = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeScore({ userId: `u${i + 1}`, level: "ok" })
      ),
    ];
    db.mockResolvedValue(buildOrm({ members, scores }));

    await GET(mockReq(), ctx());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_1",
        actorId: "u1",
        action: "org.burnout.aggregate.viewed",
        target: "org_1",
        payload: expect.objectContaining({
          n: 5,
          members: 5,
        }),
      })
    );
  });

  it("audit log distinto cuando suppressed top-level (k_anonymity_members)", async () => {
    auth.mockResolvedValue({
      user: { id: "u1" },
      memberships: [{ orgId: "org_1", role: "MANAGER" }],
    });
    db.mockResolvedValue(
      buildOrm({ members: [{ userId: "u1" }, { userId: "u2" }] })
    );
    await GET(mockReq(), ctx());
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          suppressed: true,
          reason: "k_anonymity_members",
        }),
      })
    );
  });
});
