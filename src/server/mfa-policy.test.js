import { describe, it, expect, vi, beforeEach } from "vitest";

const users = new Map();
function makeOrm() {
  return {
    user: {
      findUnique: async ({ where, select }) => {
        const u = users.get(where.id);
        if (!u) return null;
        if (!select) return u;
        const out = {};
        for (const k of Object.keys(select)) if (select[k]) out[k] = u[k];
        return out;
      },
    },
  };
}

vi.mock("./db", () => ({ db: vi.fn(async () => makeOrm()) }));

const { enforceMfaIfPolicyDemands, mfaGateResponse } = await import("./mfa-policy.js");

beforeEach(() => {
  users.clear();
});

const sessionWith = (policies, userId = "u1") => ({
  user: { id: userId },
  securityPolicies: policies,
});

describe("enforceMfaIfPolicyDemands", () => {
  it("passes when no policies demand MFA", async () => {
    users.set("u1", { mfaEnabled: false });
    const r = await enforceMfaIfPolicyDemands(sessionWith([]));
    expect(r.ok).toBe(true);
  });

  it("passes when policies present but requireMfa=false", async () => {
    const r = await enforceMfaIfPolicyDemands(sessionWith([{ orgId: "o1", requireMfa: false }]));
    expect(r.ok).toBe(true);
  });

  it("denies when policy demands MFA and user has not enabled MFA", async () => {
    users.set("u1", { mfaEnabled: false, mfaVerifiedAt: null });
    const r = await enforceMfaIfPolicyDemands(sessionWith([{ orgId: "o1", requireMfa: true }]));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("mfa_not_enabled");
    expect(r.demandedByOrgIds).toEqual(["o1"]);
  });

  it("denies when MFA enabled but never verified", async () => {
    users.set("u1", { mfaEnabled: true, mfaVerifiedAt: null });
    const r = await enforceMfaIfPolicyDemands(sessionWith([{ orgId: "o1", requireMfa: true }]));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("mfa_never_verified");
  });

  it("passes when verified within max age", async () => {
    users.set("u1", { mfaEnabled: true, mfaVerifiedAt: new Date(Date.now() - 3600_000) }); // 1h ago
    const r = await enforceMfaIfPolicyDemands(sessionWith([{ orgId: "o1", requireMfa: true }]));
    expect(r.ok).toBe(true);
  });

  it("denies when verified is stale", async () => {
    users.set("u1", { mfaEnabled: true, mfaVerifiedAt: new Date(Date.now() - 30 * 3600_000) }); // 30h ago
    const r = await enforceMfaIfPolicyDemands(sessionWith([{ orgId: "o1", requireMfa: true }]), { mfaMaxAgeHours: 24 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("mfa_stale");
    expect(r.ageHours).toBeGreaterThan(24);
  });

  it("denies when no session", async () => {
    const r = await enforceMfaIfPolicyDemands({});
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_session");
  });

  it("aggregates orgIds when multiple orgs demand MFA", async () => {
    users.set("u1", { mfaEnabled: false });
    const r = await enforceMfaIfPolicyDemands(sessionWith([
      { orgId: "oA", requireMfa: true },
      { orgId: "oB", requireMfa: false },
      { orgId: "oC", requireMfa: true },
    ]));
    expect(r.ok).toBe(false);
    expect(r.demandedByOrgIds.sort()).toEqual(["oA", "oC"]);
  });
});

describe("mfaGateResponse", () => {
  it("returns null when ok", () => {
    expect(mfaGateResponse({ ok: true })).toBeNull();
  });

  it("returns 403 with mfa_required body when not ok", async () => {
    const res = mfaGateResponse({ ok: false, reason: "mfa_stale", ageHours: 30, maxAgeHours: 24 });
    expect(res.status).toBe(403);
    expect(res.headers.get("X-MFA-Required")).toBe("true");
    const body = await res.json();
    expect(body.error).toBe("mfa_required");
    expect(body.reason).toBe("mfa_stale");
    expect(body.ageHours).toBe(30);
  });
});
