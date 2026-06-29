"use client";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   useWellbeingTrends — Phase 6F SP-F
   Fetch wellbeing assessment via GET /api/v1/me/burnout?days=N.

   NOTA: backend endpoint usa nombre legacy "/burnout" pero UI naming
   es "wellbeing trends" (D8 marketing reformulado — NO "burnout score").

   Patrón clon de useExecutiveReport (SP-D) y useActiveProgram (SP-B):
   useCallback doFetch + AbortController + refetch.

   Estado:
     · data:    null | { assessment, copy, period }
     · loading: true mientras hay fetch
     · error:   null | { type, status?, message? }
       · "unauthenticated" → 401 (UI redirect a signin)
       · "not_found"       → 404 (UI: "Sin datos suficientes")
       · "server"          → otros 4xx/5xx
       · "network"         → fetch threw
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_DAYS = 28;
const MIN_DAYS = 7;
const MAX_DAYS = 90;

export function useWellbeingTrends(opts = {}) {
  // BUG FIX (console hygiene): `enabled` evita disparar el fetch autenticado
  // cuando el consumidor ya sabe que no lo necesita (ej. WellbeingBanner con
  // totalSessions < 1, o usuario local-first sin sesión). Antes el hook se
  // llamaba incondicionalmente antes del early-return del banner → 401 en cada
  // carga de Home. Default true = backward-compatible (tests intactos).
  const enabled = opts.enabled !== false;
  const days = Number.isFinite(opts?.days) && opts.days > 0
    ? Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(opts.days)))
    : DEFAULT_DAYS;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/me/burnout?days=${days}`,
        { signal, credentials: "same-origin" }
      );
      if (res.status === 401) {
        setError({ type: "unauthenticated" });
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
  }, [days]);

  useEffect(() => {
    if (!enabled) { setLoading(false); setData(null); setError(null); return; }
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch, enabled]);

  const refetch = useCallback(() => doFetch(undefined), [doFetch]);

  return { data, loading, error, refetch };
}
