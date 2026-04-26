import { describe, it, expect } from "vitest";
import {
  canManageOrgSessions, canRevokeTarget,
  joinSessionsWithMembers, groupSessionsByUser, countActivePerUser,
  ADMIN_SESSION_ROLES,
} from "./org-sessions";

describe("canManageOrgSessions", () => {
  it("OWNER → true", () => expect(canManageOrgSessions("OWNER")).toBe(true));
  it("ADMIN → true", () => expect(canManageOrgSessions("ADMIN")).toBe(true));
  it("MEMBER → false", () => expect(canManageOrgSessions("MEMBER")).toBe(false));
  it("undefined / inválido → false", () => {
    expect(canManageOrgSessions(undefined)).toBe(false);
    expect(canManageOrgSessions(null)).toBe(false);
    expect(canManageOrgSessions("OWNER_LITE")).toBe(false);
  });

  it("ADMIN_SESSION_ROLES expone los valores válidos", () => {
    expect(ADMIN_SESSION_ROLES).toEqual(["OWNER", "ADMIN"]);
  });
});

describe("canRevokeTarget", () => {
  const args = (overrides = {}) => ({
    actorRole: "OWNER",
    actorUserId: "u_actor",
    targetRole: "MEMBER",
    targetUserId: "u_target",
    ...overrides,
  });

  it("OWNER → puede revocar MEMBER", () => {
    expect(canRevokeTarget(args())).toBe(true);
  });

  it("OWNER → puede revocar ADMIN", () => {
    expect(canRevokeTarget(args({ targetRole: "ADMIN" }))).toBe(true);
  });

  it("OWNER → puede revocar OTRO OWNER (caso multi-owner)", () => {
    expect(canRevokeTarget(args({ targetRole: "OWNER" }))).toBe(true);
  });

  it("ADMIN → puede revocar MEMBER", () => {
    expect(canRevokeTarget(args({ actorRole: "ADMIN" }))).toBe(true);
  });

  it("ADMIN → NO puede revocar otro ADMIN (anti-warfare)", () => {
    expect(canRevokeTarget(args({ actorRole: "ADMIN", targetRole: "ADMIN" }))).toBe(false);
  });

  it("ADMIN → NO puede revocar OWNER", () => {
    expect(canRevokeTarget(args({ actorRole: "ADMIN", targetRole: "OWNER" }))).toBe(false);
  });

  it("MEMBER → no puede revocar a nadie", () => {
    expect(canRevokeTarget(args({ actorRole: "MEMBER" }))).toBe(false);
    expect(canRevokeTarget(args({ actorRole: "MEMBER", targetRole: "MEMBER" }))).toBe(false);
  });

  it("self-revoke: actor === target → permitido (incluso para ADMIN)", () => {
    expect(canRevokeTarget(args({
      actorRole: "ADMIN",
      actorUserId: "u_self",
      targetUserId: "u_self",
      targetRole: "ADMIN",
    }))).toBe(true);
  });

  it("self-revoke para MEMBER → false (no tiene acceso al endpoint admin)", () => {
    expect(canRevokeTarget(args({
      actorRole: "MEMBER",
      actorUserId: "u_self",
      targetUserId: "u_self",
      targetRole: "MEMBER",
    }))).toBe(false);
  });
});

describe("joinSessionsWithMembers", () => {
  const m = new Map([
    ["u1", { role: "OWNER", user: { email: "owner@acme.com", name: "Owner" } }],
    ["u2", { role: "ADMIN", user: { email: "admin@acme.com", name: "Admin" } }],
    ["u3", { role: "MEMBER", user: { email: "member@acme.com", name: null } }],
  ]);

  const sessions = [
    { id: "s1", jti: "j1", userId: "u1", label: "Chrome", ip: "10.0.0.1", userAgent: "ua",
      createdAt: new Date("2026-01-01"), lastSeenAt: new Date("2026-01-02"),
      expiresAt: new Date("2026-01-08"), revokedAt: null },
    { id: "s2", jti: "j2", userId: "u3", label: "Firefox", ip: "10.0.0.3",
      createdAt: new Date("2026-01-01"), lastSeenAt: new Date("2026-01-02"),
      expiresAt: new Date("2026-01-08"), revokedAt: null },
    { id: "s3", jti: "j3", userId: "u_orphan",
      createdAt: new Date(), lastSeenAt: new Date(),
      expiresAt: new Date(), revokedAt: null }, // user que no es del org
  ];

  it("joinea con datos de user/role", () => {
    const r = joinSessionsWithMembers(sessions, m);
    expect(r).toHaveLength(2); // u_orphan se filtra
    expect(r[0].userEmail).toBe("owner@acme.com");
    expect(r[0].userRole).toBe("OWNER");
    expect(r[1].userEmail).toBe("member@acme.com");
    expect(r[1].userName).toBe(null);
  });

  it("inputs inválidos → []", () => {
    expect(joinSessionsWithMembers(null, m)).toEqual([]);
    expect(joinSessionsWithMembers(sessions, null)).toEqual([]);
    expect(joinSessionsWithMembers(sessions, {})).toEqual([]);
  });

  it("no expone jti completo si label es null", () => {
    const minimal = [{
      id: "s1", jti: "j1", userId: "u1",
      createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(),
    }];
    const r = joinSessionsWithMembers(minimal, m);
    expect(r[0].label).toBe(null);
  });
});

describe("groupSessionsByUser", () => {
  it("agrupa por userId, ordena OWNER → ADMIN → MEMBER", () => {
    const rows = [
      { id: "s1", userId: "u_member", userEmail: "m@acme.com", userRole: "MEMBER", lastSeenAt: new Date() },
      { id: "s2", userId: "u_owner", userEmail: "o@acme.com", userRole: "OWNER", lastSeenAt: new Date() },
      { id: "s3", userId: "u_admin", userEmail: "a@acme.com", userRole: "ADMIN", lastSeenAt: new Date() },
      { id: "s4", userId: "u_owner", userEmail: "o@acme.com", userRole: "OWNER", lastSeenAt: new Date() },
    ];
    const r = groupSessionsByUser(rows);
    expect(r.map((g) => g.userRole)).toEqual(["OWNER", "ADMIN", "MEMBER"]);
    const ownerGroup = r[0];
    expect(ownerGroup.sessions).toHaveLength(2);
  });

  it("ordena sesiones más recientes primero dentro del grupo", () => {
    const rows = [
      { id: "old", userId: "u1", userRole: "MEMBER", lastSeenAt: new Date("2026-01-01") },
      { id: "new", userId: "u1", userRole: "MEMBER", lastSeenAt: new Date("2026-01-05") },
      { id: "mid", userId: "u1", userRole: "MEMBER", lastSeenAt: new Date("2026-01-03") },
    ];
    const r = groupSessionsByUser(rows);
    expect(r[0].sessions.map((s) => s.id)).toEqual(["new", "mid", "old"]);
  });

  it("desempate alfabético dentro del mismo role", () => {
    const rows = [
      { id: "s1", userId: "u_zoe", userEmail: "zoe@acme.com", userRole: "MEMBER", lastSeenAt: new Date() },
      { id: "s2", userId: "u_alex", userEmail: "alex@acme.com", userRole: "MEMBER", lastSeenAt: new Date() },
    ];
    const r = groupSessionsByUser(rows);
    expect(r[0].userEmail).toBe("alex@acme.com");
  });

  it("non-array → []", () => {
    expect(groupSessionsByUser(null)).toEqual([]);
    expect(groupSessionsByUser(undefined)).toEqual([]);
  });
});

describe("countActivePerUser", () => {
  const now = new Date("2026-01-15T12:00:00Z");

  it("cuenta sólo activas (no revoked, no expired)", () => {
    const rows = [
      { userId: "u1", revokedAt: null, expiresAt: new Date("2026-02-01") },
      { userId: "u1", revokedAt: null, expiresAt: new Date("2026-02-01") },
      { userId: "u1", revokedAt: new Date("2026-01-10"), expiresAt: new Date("2026-02-01") },
      { userId: "u2", revokedAt: null, expiresAt: new Date("2025-12-01") }, // expirada
      { userId: "u2", revokedAt: null, expiresAt: new Date("2026-02-01") },
    ];
    const c = countActivePerUser(rows, now);
    expect(c.get("u1")).toBe(2);
    expect(c.get("u2")).toBe(1);
  });

  it("non-array → Map vacío", () => {
    expect(countActivePerUser(null).size).toBe(0);
  });

  it("rows vacío → Map vacío", () => {
    expect(countActivePerUser([], now).size).toBe(0);
  });
});
