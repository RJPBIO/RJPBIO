/* /api/v1/me/providers (LIST + DELETE) — Phase 6D SP4a tests. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/server/db", () => ({
  db: vi.fn(),
}));
vi.mock("@/server/csrf", () => ({
  requireCsrf: vi.fn(() => null),
}));
vi.mock("@/server/audit", () => ({
  auditLog: vi.fn(async () => ({})),
}));
vi.mock("@/server/ratelimit", () => ({
  check: vi.fn(async () => ({ ok: true })),
}));

import { GET as listProviders } from "./route";
import { DELETE as unlinkProvider } from "./[provider]/route";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { requireCsrf } from "@/server/csrf";
import { auditLog } from "@/server/audit";
import { check } from "@/server/ratelimit";

beforeEach(() => {
  vi.clearAllMocks();
});

function mockOrm(accountFindMany = [], accountDelete = null) {
  db.mockResolvedValue({
    account: {
      findMany: vi.fn(async () => accountFindMany),
      delete: accountDelete || vi.fn(async () => ({})),
    },
  });
}

describe("GET /api/v1/me/providers", () => {
  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await listProviders();
    expect(res.status).toBe(401);
  });

  it("retorna lista sanitizada con providerAccountId truncado", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    mockOrm([
      { provider: "google", providerAccountId: "1234567890abcdef", type: "oauth" },
      { provider: "email", providerAccountId: "test@example.com", type: "email" },
    ]);
    const res = await listProviders();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.count).toBe(2);
    // accountSub trunca a 8 chars
    expect(j.providers[0].accountSub).toBe("12345678");
    expect(j.providers[0].provider).toBe("google");
    // No expone providerAccountId completo
    expect(j.providers[0].providerAccountId).toBeUndefined();
  });

  it("retorna count 0 con array vacío cuando no hay accounts", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    mockOrm([]);
    const res = await listProviders();
    const j = await res.json();
    expect(j.count).toBe(0);
    expect(j.providers).toEqual([]);
  });
});

describe("DELETE /api/v1/me/providers/[provider]", () => {
  function mockReq() {
    return {
      method: "DELETE",
      headers: new Map(),
      cookies: new Map(),
    };
  }
  function mockCtx(provider) {
    return { params: Promise.resolve({ provider }) };
  }

  it("401 si no auth", async () => {
    auth.mockResolvedValue(null);
    const res = await unlinkProvider(mockReq(), mockCtx("google"));
    expect(res.status).toBe(401);
  });

  it("400 si provider name no conocido (path injection guard)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const res = await unlinkProvider(mockReq(), mockCtx("../etc/passwd"));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe("provider_invalid");
  });

  it("404 si provider name conocido pero no vinculado al user", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    mockOrm([{ provider: "google", id: "a1" }]);
    const res = await unlinkProvider(mockReq(), mockCtx("apple"));
    expect(res.status).toBe(404);
  });

  it("409 si es el último provider (anti lock-out)", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    mockOrm([{ provider: "google", id: "a1" }]);
    const res = await unlinkProvider(mockReq(), mockCtx("google"));
    expect(res.status).toBe(409);
    const j = await res.json();
    expect(j.error).toBe("last_provider");
    // Debe loggear el bloqueo en audit
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "account.provider.unlink.blocked_last" })
    );
  });

  it("200 + delete exitoso cuando hay >1 provider", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    const deleteFn = vi.fn(async () => ({}));
    db.mockResolvedValue({
      account: {
        findMany: vi.fn(async () => [
          { provider: "google", id: "a1" },
          { provider: "apple", id: "a2" },
        ]),
        delete: deleteFn,
      },
    });
    const res = await unlinkProvider(mockReq(), mockCtx("apple"));
    expect(res.status).toBe(200);
    expect(deleteFn).toHaveBeenCalledWith({ where: { id: "a2" } });
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "account.provider.unlink", payload: expect.objectContaining({ provider: "apple", remainingProviders: 1 }) })
    );
  });

  it("429 si rate-limit excedido", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    check.mockResolvedValueOnce({ ok: false });
    const res = await unlinkProvider(mockReq(), mockCtx("google"));
    expect(res.status).toBe(429);
  });

  it("rejects when CSRF fails", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    requireCsrf.mockReturnValueOnce(new Response("csrf", { status: 403 }));
    const res = await unlinkProvider(mockReq(), mockCtx("google"));
    expect(res.status).toBe(403);
  });
});
