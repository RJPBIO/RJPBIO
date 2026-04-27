import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCohortPrior, _resetCohortPriorCache } from "./useCohortPrior";

const SAMPLE_PRIOR = {
  table: { 7: { calma: { delta: 1.5, n: 30, distinctUsers: 8 } } },
  totalSessions: 30,
  totalUsers: 8,
};

describe("useCohortPrior", () => {
  beforeEach(() => {
    _resetCohortPriorCache();
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna null inicialmente y luego prior tras fetch", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cohortPrior: SAMPLE_PRIOR }),
    });
    const { result } = renderHook(() => useCohortPrior());
    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual(SAMPLE_PRIOR));
  });

  it("retorna null si endpoint responde !ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { result } = renderHook(() => useCohortPrior());
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });

  it("retorna null si fetch lanza", async () => {
    global.fetch.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useCohortPrior());
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });

  it("retorna null si endpoint dice cohortPrior:null (org sin data)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cohortPrior: null, reason: "no-org" }),
    });
    const { result } = renderHook(() => useCohortPrior());
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });

  it("usa cache en mounts subsecuentes (no re-fetch)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cohortPrior: SAMPLE_PRIOR }),
    });
    const { result: r1, unmount: u1 } = renderHook(() => useCohortPrior());
    await waitFor(() => expect(r1.current).toEqual(SAMPLE_PRIOR));
    u1();

    // Segundo mount: NO debe llamar fetch otra vez (TTL no expirado)
    const { result: r2 } = renderHook(() => useCohortPrior());
    expect(r2.current).toEqual(SAMPLE_PRIOR);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("hace una sola request si múltiples hooks montan en paralelo", async () => {
    let resolve;
    const inflight = new Promise((r) => { resolve = r; });
    global.fetch.mockImplementationOnce(() => inflight);

    const { result: r1 } = renderHook(() => useCohortPrior());
    const { result: r2 } = renderHook(() => useCohortPrior());
    expect(r1.current).toBeNull();
    expect(r2.current).toBeNull();

    resolve({ ok: true, json: async () => ({ cohortPrior: SAMPLE_PRIOR }) });

    await waitFor(() => expect(r1.current).toEqual(SAMPLE_PRIOR));
    await waitFor(() => expect(r2.current).toEqual(SAMPLE_PRIOR));

    // Solo UNA llamada a fetch (deduped vía inFlight Promise)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
