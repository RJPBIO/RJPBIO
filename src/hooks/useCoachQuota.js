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

export function useCoachQuota(opts = {}) {
  // BUG FIX (console hygiene): `enabled` permite que CoachV2 evite el fetch
  // (que 401ea) cuando ya sabe que no hay sesión. Default true = backward
  // compatible (tests intactos). Con enabled=false marcamos isUnauthenticated
  // (mismo estado que producía el 401) para que CoachV2 muestre CoachAuthRequired.
  const enabled = opts.enabled !== false;
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  // Phase 6D SP4a (Bug-12) — unauthenticated flag explícito.
  // Antes 401 dejaba quota en null y CoachV2 caía al DEFAULT_QUOTA
  // hardcoded "PLAN PRO 0/100" — engañoso para users no auth. Ahora
  // el consumer puede chequear isUnauthenticated y mostrar CoachAuthRequired.
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const doFetch = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/quota", { signal, credentials: "same-origin" });
      if (!res.ok) {
        if (res.status === 401) {
          // Sin sesión: marcar el flag para que CoachV2 muestre empty
          // state honesto (con CTA login) en lugar del PRO 0/100 fake.
          setIsUnauthenticated(true);
          setQuota(null);
          return;
        }
        throw new Error(`quota_http_${res.status}`);
      }
      // 200 OK — user autenticado.
      setIsUnauthenticated(false);
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
    if (!enabled) {
      // Sin sesión conocida: no fetcheamos (evita 401) y reflejamos el mismo
      // estado "no autenticado" que el 401 producía → CoachV2 muestra el gate.
      setIsUnauthenticated(true);
      setQuota(null);
      setLoading(false);
      return;
    }
    setIsUnauthenticated(false);
    const ctrl = new AbortController();
    doFetch(ctrl.signal);
    return () => ctrl.abort();
  }, [doFetch, enabled]);

  const refetch = useCallback(() => doFetch(undefined), [doFetch]);

  return { quota, loading, error, refetch, isUnauthenticated };
}
