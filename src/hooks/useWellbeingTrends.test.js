/* useWellbeingTrends — Phase 6F SP-F
   Cubre 401/404/500/network + AbortController + refetch + days clamp [7..90]. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useWellbeingTrends } from "./useWellbeingTrends";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("useWellbeingTrends — Phase 6F SP-F", () => {
  it("happy path retorna data con assessment + copy + period", async () => {
    const fakeBody = {
      assessment: {
        level: "warn",
        signals: ["freqDrop", "hrvDecline"],
        metrics: {},
        snapshot: { disclaimer: "test" },
      },
      copy: { title: "Test", severity: "warn" },
      period: { days: 28 },
    };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => fakeBody,
    });
    const { result } = renderHook(() => useWellbeingTrends());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.assessment?.level).toBe("warn");
    expect(result.current.error).toBeNull();
  });

  it("URL incluye days=28 default", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/v1/me/burnout?days=28");
  });

  it("clampea days a [7..90]", async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    renderHook(() => useWellbeingTrends({ days: 9999 }));
    await waitFor(() => {
      expect(globalThis.fetch.mock.calls[0]?.[0]).toBe("/api/v1/me/burnout?days=90");
    });

    globalThis.fetch.mockClear();
    renderHook(() => useWellbeingTrends({ days: 1 }));
    await waitFor(() => {
      expect(globalThis.fetch.mock.calls[0]?.[0]).toBe("/api/v1/me/burnout?days=7");
    });
  });

  it("error.type='unauthenticated' en 401", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "unauthenticated" });
    expect(result.current.data).toBeNull();
  });

  it("error.type='not_found' en 404", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "not_found" });
  });

  it("error.type='server' en 500", async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "server", status: 500 });
  });

  it("error.type='network' cuando fetch lanza", async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError("Network down"));
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "network" });
  });

  it("AbortError NO setea error (cleanup unmount)", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" });
    globalThis.fetch.mockRejectedValueOnce(abortErr);
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it("AbortController cleanup en unmount", async () => {
    let aborted = false;
    globalThis.fetch.mockImplementationOnce(
      (_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener?.("abort", () => {
          aborted = true;
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      })
    );
    const { unmount } = renderHook(() => useWellbeingTrends());
    unmount();
    await new Promise((r) => setTimeout(r, 10));
    expect(aborted).toBe(true);
  });

  it("refetch dispara nueva llamada", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ v: 1 }),
    });
    const { result } = renderHook(() => useWellbeingTrends());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ v: 2 }),
    });
    await act(async () => { result.current.refetch(); });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });

  it("cambio de days dispara re-fetch", async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const { rerender } = renderHook(
      ({ days }) => useWellbeingTrends({ days }),
      { initialProps: { days: 28 } }
    );
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
    rerender({ days: 90 });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
    expect(globalThis.fetch.mock.calls[1][0]).toBe("/api/v1/me/burnout?days=90");
  });
});
