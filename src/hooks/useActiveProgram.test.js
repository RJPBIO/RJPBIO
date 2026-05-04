/* useActiveProgram — Phase 6F SP-B
   Hook fetch del programa activo + AbortController + refetch + 401/error handling. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useActiveProgram } from "./useActiveProgram";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("useActiveProgram — Phase 6F SP-B", () => {
  it("fetch al mount + popula data cuando 200 con programa activo", async () => {
    const activeShape = {
      id: "pa_1",
      programId: "burnout-recovery",
      startedAt: new Date().toISOString(),
      completedDays: [1, 3],
      reEvalAt: new Date().toISOString(),
      reEvalCompletedAt: null,
      source: "self-selected",
      todayStatus: { shouldSession: true, day: 5, session: { day: 5, protocolId: 6 } },
      lagStatus: { isLagging: false, daysBehind: 0 },
      progress: { completed: 2, total: 14, fraction: 0.14, isComplete: false },
      reEval: { dueDate: new Date().toISOString(), isDue: false, daysUntil: 9, completed: false },
    };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ active: activeShape }),
    });
    const { result } = renderHook(() => useActiveProgram());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({
      programId: "burnout-recovery",
      progress: { completed: 2, total: 14 },
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isUnauthenticated).toBe(false);
  });

  it("retorna data:null cuando server responde { active: null }", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ active: null }),
    });
    const { result } = renderHook(() => useActiveProgram());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isUnauthenticated).toBe(false);
  });

  it("setea isUnauthenticated:true en 401 sin error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    const { result } = renderHook(() => useActiveProgram());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isUnauthenticated).toBe(true);
    expect(result.current.data).toBeNull();
    // Por convención, 401 no setea error — el flag isUnauthenticated lo cubre.
    expect(result.current.error).toBeNull();
  });

  it("error.type='server' en 500", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const { result } = renderHook(() => useActiveProgram());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "server", status: 500 });
    expect(result.current.data).toBeNull();
  });

  it("error.type='network' cuando fetch lanza", async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError("Network down"));
    const { result } = renderHook(() => useActiveProgram());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatchObject({ type: "network" });
    expect(result.current.data).toBeNull();
  });

  it("AbortError no setea error (cleanup en unmount)", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" });
    globalThis.fetch.mockRejectedValueOnce(abortErr);
    const { result } = renderHook(() => useActiveProgram());
    // Espera a que el effect corra y maneje el AbortError sin crash
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it("refetch dispara nueva llamada con datos actualizados", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ active: null }),
    });
    const { result } = renderHook(() => useActiveProgram());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();

    // Segunda llamada: ahora hay programa activo
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        active: { id: "pa_2", programId: "neural-baseline", startedAt: new Date().toISOString(), completedDays: [] },
      }),
    });
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({ programId: "neural-baseline" });
  });

  it("AbortController cleanup en unmount cancela fetch en vuelo", async () => {
    let aborted = false;
    globalThis.fetch.mockImplementationOnce(
      (_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener?.("abort", () => {
          aborted = true;
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      })
    );
    const { unmount } = renderHook(() => useActiveProgram());
    unmount();
    // Pequeño await para que el cleanup ejecute
    await new Promise((r) => setTimeout(r, 10));
    expect(aborted).toBe(true);
  });
});
