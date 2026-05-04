/* /api/v1/me/security — Phase 6D SP4b agregado MFA + sessions + trusted-devices. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/db", () => ({ db: vi.fn() }));
vi.mock("@/server/sessions", () => ({ listUserSessions: vi.fn() }));

import { GET } from "./route";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { listUserSessions } from "@/server/sessions";

beforeEach(() => {
  vi.clearAllMocks();
});

function mockOrm(user = null, trustedDevices = []) {
  db.mockResolvedValue({
    user: { findUnique: vi.fn(async () => user) },
    trustedDevice: { findMany: vi.fn(async () => trustedDevices) },
  });
}

describe("GET /api/v1/me/security", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("404 si user no existe en DB", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    mockOrm(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("retorna mfa.enabled=false + zero counts cuando user fresh", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    mockOrm({ mfaEnabled: false, mfaVerifiedAt: null, mfaBackupCodes: [], mfaLockedUntil: null });
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.mfa.enabled).toBe(false);
    expect(j.mfa.backupCodesRemaining).toBe(0);
    expect(j.mfa.stepUpFreshSeconds).toBe(0);
    expect(j.sessions.count).toBe(0);
    expect(j.trustedDevices.count).toBe(0);
  });

  it("calcula stepUpFreshSeconds correcto cuando mfaVerifiedAt reciente", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    const recent = new Date(Date.now() - 2 * 60 * 1000); // 2 min ago
    mockOrm({
      mfaEnabled: true,
      mfaVerifiedAt: recent,
      mfaBackupCodes: ["h1", "h2", "h3"],
      mfaLockedUntil: null,
    });
    const res = await GET();
    const j = await res.json();
    expect(j.mfa.enabled).toBe(true);
    // 10min window - 2min elapsed = ~8min = ~480 sec
    expect(j.mfa.stepUpFreshSeconds).toBeGreaterThan(450);
    expect(j.mfa.stepUpFreshSeconds).toBeLessThanOrEqual(600);
    expect(j.mfa.backupCodesRemaining).toBe(3);
  });

  it("stepUpFreshSeconds=0 cuando mfaVerifiedAt > 10 min", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    const stale = new Date(Date.now() - 11 * 60 * 1000);
    mockOrm({ mfaEnabled: true, mfaVerifiedAt: stale, mfaBackupCodes: [], mfaLockedUntil: null });
    const res = await GET();
    const j = await res.json();
    expect(j.mfa.stepUpFreshSeconds).toBe(0);
  });

  it("calcula lockedSecondsRemaining cuando user bloqueado", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    mockOrm({ mfaEnabled: true, mfaVerifiedAt: null, mfaBackupCodes: [], mfaLockedUntil: lockedUntil });
    const res = await GET();
    const j = await res.json();
    expect(j.mfa.lockedSecondsRemaining).toBeGreaterThan(290);
    expect(j.mfa.lockedSecondsRemaining).toBeLessThanOrEqual(300);
  });

  it("filtra trusted devices expirados", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    listUserSessions.mockResolvedValue([]);
    mockOrm(
      { mfaEnabled: true, mfaVerifiedAt: null, mfaBackupCodes: [], mfaLockedUntil: null },
      [
        { id: "d1", label: "Mac", ip: "1.1.1.1",
          createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000), lastUsedAt: new Date() },
        { id: "d2", label: "Phone", ip: "2.2.2.2",
          createdAt: new Date(Date.now() - 60 * 86400000), expiresAt: new Date(Date.now() - 86400000), lastUsedAt: new Date() },
      ],
    );
    const res = await GET();
    const j = await res.json();
    // d2 está expirado, debe ser filtrado
    expect(j.trustedDevices.count).toBe(1);
    expect(j.trustedDevices.items[0].id).toBe("d1");
  });

  it("marca current=true en la sesión actual usando jti", async () => {
    auth.mockResolvedValue({ user: { id: "u1" }, jti: "jti-current" });
    listUserSessions.mockResolvedValue([
      { id: "s1", jti: "jti-other", ip: "1", userAgent: "ua", label: "Mac",
        createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 86400000), revokedAt: null },
      { id: "s2", jti: "jti-current", ip: "2", userAgent: "ua", label: "Phone",
        createdAt: new Date(), lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 86400000), revokedAt: null },
    ]);
    mockOrm({ mfaEnabled: false, mfaVerifiedAt: null, mfaBackupCodes: [], mfaLockedUntil: null });
    const res = await GET();
    const j = await res.json();
    expect(j.sessions.count).toBe(2);
    expect(j.sessions.items.find((s) => s.id === "s2").current).toBe(true);
    expect(j.sessions.items.find((s) => s.id === "s1").current).toBe(false);
  });
});
