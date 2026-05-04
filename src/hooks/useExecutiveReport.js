"use client";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   useExecutiveReport — fetch del reporte ejecutivo via
   GET /api/v1/orgs/[orgId]/reports/executive?days=N.

   Patrón clon de useActiveProgram (SP-B) y useCoachQuota (Phase 6C SP2):
   useState + useCallback doFetch + AbortController + refetch.

   Estado:
     · data:    null mientras carga; objeto report cuando llega
     · loading: true mientras hay fetch en vuelo
     · error:   null o { type, status?, message? }

   Error types:
     "unauthenticated" → 401 (UI redirect a signin)
     "forbidden"       → 403 (UI: "Sin permisos")
     "not_found"       → 404 (UI: "Reporte no encontrado")
     "server"          → otros 4xx/5xx (UI mensaje genérico + retry)
     "network"         → fetch threw (UI retry CTA)

   El reporte puede ser `data: { suppressed: true, ... }` cuando k<5;
   eso NO es error — el consumer renderea el bloque suppressed.
   ═══════════════════════════════════════════════════════════════ */

export function useExecutiveReport(orgId, opts = {}) {
  const days = Number.isFinite(opts?.days) && opts.days > 0
    ? Math.min(365, Math.max(7, Math.floor(opts.days)))
    : 90;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async (signal) => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/orgs/${encodeURIComponent(orgId)}/reports/executive?days=${days}`,
        { signal, credentials: "same-origin" }
      );
      if (res.status === 401) {
        setError({ type: "unauthenticated" });
        setData(null);
        return;
      }
      if (res.status === 403) {
        setError({ type: "forbidden" });
        setData(null);
        return;
      }
      if (res.status === 404) {
        setError({ type: "not_found" });
        setData(null);
        return;
      }
      if (!res.ok) {
        setError({ type: "server", status: res.status });
        setData(null);
        return;
      }
      const body = await res.json();
      setData(body);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError({ type: "network", message: e?.message || "fetch_failed" });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [orgId, days]);

  useEffect(() => {
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch]);

  const refetch = useCallback(() => doFetch(undefined), [doFetch]);

  return { data, loading, error, refetch };
}
