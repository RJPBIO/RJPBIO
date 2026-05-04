/* useExecutiveReport — Phase 6F SP-D
   Cubre: 401, 403, 404, 500, network, AbortController cleanup, refetch,
   re-fetch on days change, no-orgId early return. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useExecutiveReport } from "./useExecutiveReport";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("useExecutiveReport — Phase 6F SP-D", () => {
  it("retorna data en happy path", async () => {
    const fakeReport = {
      org: { id: "o1", name: "Acme", activeMembers: 12 },
      kpis: { activeMembers: 12, sessionsTotal: 50 },
      period: { days: 90 },
      snapshot: { kAnonThreshold: 5 },
    };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => fakeReport,
    });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({ org: { id: "o1" } });
    expect(result.current.error).toBeNull();
  });

  it("URL incluye days param y orgId encoded", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({}),
    });
    renderHook(() => useExecutiveReport("o1", { days: 180 }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const call = globalThis.fetch.mock.calls[0][0];
    expect(call).toBe("/api/v1/orgs/o1/reports/executive?days=180");
  });

  it("days param se clampea a [7..365]", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true, status: 200, json: async () => ({}),
    });

    renderHook(() => useExecutiveReport("o1", { days: 9999 }));
    await waitFor(() => {
      const call = globalThis.fetch.mock.calls[0]?.[0];
      expect(call).toBe("/api/v1/orgs/o1/reports/executive?days=365");
    });

    globalThis.fetch.mockClear();
    renderHook(() => useExecutiveReport("o1", { days: 1 }));
    await waitFor(() => {
      const call = globalThis.fetch.mock.calls[0]?.[0];
      expect(call).toBe("/api/v1/orgs/o1/reports/executive?days=7");
    });
  });

  it("error.type='unauthenticated' en 401", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "unauthenticated" });
    expect(result.current.data).toBeNull();
  });

  it("error.type='forbidden' en 403", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "forbidden" });
  });

  it("error.type='not_found' en 404", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "not_found" });
  });

  it("error.type='server' en 500", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "server", status: 500 });
  });

  it("error.type='network' cuando fetch lanza", async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError("Network down"));
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "network" });
  });

  it("AbortError no setea error (cleanup unmount)", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" });
    globalThis.fetch.mockRejectedValueOnce(abortErr);
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it("AbortController cleanup cancela fetch en unmount", async () => {
    let aborted = false;
    globalThis.fetch.mockImplementationOnce(
      (_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener?.("abort", () => {
          aborted = true;
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      })
    );
    const { unmount } = renderHook(() => useExecutiveReport("o1"));
    unmount();
    await new Promise((r) => setTimeout(r, 10));
    expect(aborted).toBe(true);
  });

  it("refetch dispara nueva llamada", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ snapshot: { v: 1 } }),
    });
    const { result } = renderHook(() => useExecutiveReport("o1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ snapshot: { v: 2 } }),
    });
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });

  it("cambio de days dispara re-fetch (orgId fijo)", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true, status: 200, json: async () => ({}),
    });
    const { rerender } = renderHook(
      ({ days }) => useExecutiveReport("o1", { days }),
      { initialProps: { days: 90 } }
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    rerender({ days: 180 });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
    const lastCall = globalThis.fetch.mock.calls[1][0];
    expect(lastCall).toBe("/api/v1/orgs/o1/reports/executive?days=180");
  });

  it("orgId vacío → loading:false sin fetch", async () => {
    const { result } = renderHook(() => useExecutiveReport(""));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
