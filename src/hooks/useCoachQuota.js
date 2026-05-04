"use client";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   useCoachQuota — fetch real de la quota mensual al mount + refetch
   ═══════════════════════════════════════════════════════════════
   Phase 6C SP2. Reemplaza la quota defensiva `0/100 PRO` que CoachV2
   inicializaba en SP1. Hace GET /api/coach/quota una vez al mount;
   `refetch()` se invoca después de cada mensaje exitoso para
   reconciliar el contador local con el server.

   Estado:
     · quota:   null mientras carga; objeto { used, max, plan, blocked, period, modelTier } cuando llega
     · loading: true mientras hay fetch en vuelo
     · error:   null o Error si el fetch falla

   max=null se interpreta como Infinity (server lo serializa así porque
   JSON no soporta Infinity nativo). El consumidor debe convertir.
   ═══════════════════════════════════════════════════════════════ */

export function useCoachQuota() {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/quota", { signal, credentials: "same-origin" });
      if (!res.ok) {
        if (res.status === 401) {
          // Sin sesión: dejamos quota en null para que el consumidor
          // siga mostrando el placeholder defensivo del initial state.
          return;
        }
        throw new Error(`quota_http_${res.status}`);
      }
      const data = await res.json();
      // Normaliza max=null → Infinity (server serializa Infinity como null)
      const normalized = {
        ...data,
        max: data.max == null ? Infinity : data.max,
      };
      setQuota(normalized);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch]);

  const refetch = useCallback(() => doFetch(undefined), [doFetch]);

  return { quota, loading, error, refetch };
}
