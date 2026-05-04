/* ═══════════════════════════════════════════════════════════════
   useCoachQuota.test — Phase 6C SP2
   Hook fetch de quota real al mount + refetch + manejo de 401/error.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCoachQuota } from "./useCoachQuota";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("useCoachQuota — Phase 6C SP2", () => {
  it("fetch al mount + popula quota cuando 200", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        used: 23, max: 100, plan: "PRO",
        period: { year: 2026, month: 5 },
        modelTier: "sonnet", blocked: false,
      }),
    });
    const { result } = renderHook(() => useCoachQuota());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quota).toMatchObject({
      used: 23, max: 100, plan: "PRO", blocked: false,
    });
    expect(result.current.error).toBeNull();
  });

  it("max=null del server se normaliza a Infinity (GROWTH/ENTERPRISE)", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ used: 4200, max: null, plan: "GROWTH", blocked: false }),
    });
    const { result } = renderHook(() => useCoachQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quota.max).toBe(Infinity);
  });

  it("401 deja quota null sin error (cliente sigue con defensiva local)", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    const { result } = renderHook(() => useCoachQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quota).toBeNull();
    expect(result.current.error).toBeNull(); // 401 NO es error de la app
  });

  it("500 / network failure popula error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "internal_error" }),
    });
    const { result } = renderHook(() => useCoachQuota());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.quota).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it("refetch dispara segundo fetch + actualiza quota", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ used: 23, max: 100, plan: "PRO", blocked: false }),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ used: 24, max: 100, plan: "PRO", blocked: false }),
      });
    const { result } = renderHook(() => useCoachQuota());
    await waitFor(() => expect(result.current.quota?.used).toBe(23));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.quota.used).toBe(24);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
