import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db (memory adapter no soporta deleteMany sobre todas las tablas usadas).
const tables = {
  user: new Map(),
  userSession: [],
  trustedDevice: [],
  pushSubscription: [],
  account: [],
  mfaResetRequest: [],
  phoneOtp: [],
  org: new Map(),
  membership: [],
};

function makeMockOrm() {
  return {
    user: {
      findUnique: async ({ where, select }) => {
        const u = tables.user.get(where.id);
        if (!u) return null;
        if (!select) return u;
        const out = {};
        for (const k of Object.keys(select)) if (select[k]) out[k] = u[k];
        return out;
      },
      update: async ({ where, data }) => {
        const u = tables.user.get(where.id);
        if (!u) throw new Error("not found");
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && "increment" in v) {
            u[k] = (u[k] || 0) + v.increment;
          } else {
            u[k] = v;
          }
        }
        tables.user.set(where.id, u);
        return u;
      },
    },
    userSession: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const s of tables.userSession) {
          if (s.userId === where.userId && (where.revokedAt === null ? s.revokedAt == null : true)) {
            Object.assign(s, data);
            count++;
          }
        }
        return { count };
      },
    },
    trustedDevice: {
      deleteMany: async ({ where }) => {
        const before = tables.trustedDevice.length;
        tables.trustedDevice = tables.trustedDevice.filter((d) => d.userId !== where.userId);
        return { count: before - tables.trustedDevice.length };
      },
    },
    pushSubscription: {
      deleteMany: async ({ where }) => {
        const before = tables.pushSubscription.length;
        tables.pushSubscription = tables.pushSubscription.filter((d) => d.userId !== where.userId);
        return { count: before - tables.pushSubscription.length };
      },
    },
    account: {
      deleteMany: async ({ where }) => {
        const before = tables.account.length;
        tables.account = tables.account.filter((d) => d.userId !== where.userId);
        return { count: before - tables.account.length };
      },
    },
    mfaResetRequest: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const r of tables.mfaResetRequest) {
          if (r.userId === where.userId && (!where.status || r.status === where.status)) {
            Object.assign(r, data);
            count++;
          }
        }
        return { count };
      },
    },
    phoneOtp: {
      deleteMany: async ({ where }) => {
        const before = tables.phoneOtp.length;
        tables.phoneOtp = tables.phoneOtp.filter((p) => p.phone !== where.phone);
        return { count: before - tables.phoneOtp.length };
      },
    },
    org: {
      findUnique: async ({ where }) => {
        for (const o of tables.org.values()) {
          if (o.slug === where.slug) return o;
        }
        return null;
      },
    },
    membership: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const m of tables.membership) {
          if (m.userId === where.userId && m.orgId === where.orgId) {
            Object.assign(m, data);
            count++;
          }
        }
        return { count };
      },
    },
  };
}

vi.mock("./db", () => ({
  db: vi.fn(async () => makeMockOrm()),
}));

vi.mock("./audit", () => ({
  auditLog: vi.fn(async () => ({})),
}));

const { eraseUserData } = await import("./erase-user-data.js");

beforeEach(() => {
  tables.user = new Map([
    ["u1", { id: "u1", email: "u1@x.com", phone: "+5215555555555", deletedAt: null, sessionEpoch: 0 }],
    ["u2", { id: "u2", email: "u2@x.com", phone: null, deletedAt: null, sessionEpoch: 0 }],
  ]);
  tables.userSession = [
    { id: "s1", userId: "u1", revokedAt: null },
    { id: "s2", userId: "u1", revokedAt: null },
    { id: "s3", userId: "u2", revokedAt: null },
  ];
  tables.trustedDevice = [{ id: "d1", userId: "u1" }];
  tables.pushSubscription = [{ id: "p1", userId: "u1" }, { id: "p2", userId: "u1" }];
  tables.account = [{ id: "a1", userId: "u1" }];
  tables.mfaResetRequest = [{ id: "m1", userId: "u1", status: "pending" }];
  tables.phoneOtp = [{ phone: "+5215555555555" }];
  tables.org = new Map([
    ["o1", { id: "o1", slug: "personal-u1" }],
  ]);
  tables.membership = [{ userId: "u1", orgId: "o1", deactivatedAt: null }];
});

describe("eraseUserData", () => {
  it("revokes all sessions and removes PII", async () => {
    const r = await eraseUserData("u1", { actorId: "admin" });
    expect(r.ok).toBe(true);
    expect(r.revokedSessions).toBe(2);
    expect(r.removedDevices).toBe(1);
    expect(r.removedSubs).toBe(2);
    expect(r.removedAccounts).toBe(1);
    expect(r.deactivatedMemberships).toBe(1);
  });

  it("sets deletedAt only once (idempotent)", async () => {
    await eraseUserData("u1", { actorId: "admin" });
    const first = tables.user.get("u1").deletedAt;
    expect(first).toBeInstanceOf(Date);
    // Second call should not overwrite deletedAt
    const r2 = await eraseUserData("u1", { actorId: "admin" });
    expect(r2.ok).toBe(true);
    expect(tables.user.get("u1").deletedAt).toBe(first);
  });

  it("bumps sessionEpoch", async () => {
    await eraseUserData("u1", { actorId: "admin" });
    expect(tables.user.get("u1").sessionEpoch).toBe(1);
  });

  it("rejects unknown user", async () => {
    const r = await eraseUserData("nope");
    expect(r.ok).toBe(false);
  });

  it("rejects invalid userId", async () => {
    const r = await eraseUserData(null);
    expect(r.ok).toBe(false);
  });

  it("handles user without phone", async () => {
    const r = await eraseUserData("u2", { actorId: "admin" });
    expect(r.ok).toBe(true);
    expect(r.revokedSessions).toBe(1);
  });
});
