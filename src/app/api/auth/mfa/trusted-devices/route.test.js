/* /api/auth/mfa/trusted-devices (LIST) — Phase 6D SP4b. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/db", () => ({ db: vi.fn() }));

import { GET } from "./route";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/mfa/trusted-devices (LIST)", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("retorna lista vacía cuando no hay devices", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue({
      trustedDevice: { findMany: vi.fn(async () => []) },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.devices).toEqual([]);
    expect(j.count).toBe(0);
  });

  it("filtra devices expirados", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue({
      trustedDevice: {
        findMany: vi.fn(async () => [
          {
            id: "d1", label: "Mac", ip: "1.1.1.1",
            createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000),
            lastUsedAt: new Date(),
          },
          {
            id: "d2", label: "Old phone", ip: "2.2.2.2",
            createdAt: new Date(Date.now() - 60 * 86400000),
            expiresAt: new Date(Date.now() - 86400000),
            lastUsedAt: new Date(),
          },
        ]),
      },
    });
    const res = await GET();
    const j = await res.json();
    expect(j.count).toBe(1);
    expect(j.devices[0].id).toBe("d1");
    expect(j.devices[0].label).toBe("Mac");
  });

  it("usa label fallback cuando es null", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.mockResolvedValue({
      trustedDevice: {
        findMany: vi.fn(async () => [
          {
            id: "d1", label: null, ip: null,
            createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000),
            lastUsedAt: new Date(),
          },
        ]),
      },
    });
    const res = await GET();
    const j = await res.json();
    expect(j.devices[0].label).toBe("Dispositivo sin nombre");
  });

  it("serializa fechas a ISO strings", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const now = new Date();
    db.mockResolvedValue({
      trustedDevice: {
        findMany: vi.fn(async () => [
          {
            id: "d1", label: "Mac", ip: "1.1.1.1",
            createdAt: now, expiresAt: new Date(now.getTime() + 30 * 86400000),
            lastUsedAt: now,
          },
        ]),
      },
    });
    const res = await GET();
    const j = await res.json();
    expect(typeof j.devices[0].createdAt).toBe("string");
    expect(j.devices[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
