"use client";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   useActiveProgram — fetch del programa activo del user via
   GET /api/v1/me/program/active. Patrón consistent con useCoachQuota
   (Phase 6C SP2): doFetch via useCallback + AbortController + refetch.

   Estado:
     · data:              null cuando no hay programa activo, objeto rico cuando sí
     · loading:           true mientras hay fetch en vuelo
     · error:             null o { type, status?, message? } si fetch falla
     · isUnauthenticated: true cuando server retorna 401

   data shape (cuando programa activo):
     {
       id, programId, startedAt, completedDays, reEvalAt,
       reEvalCompletedAt, source,
       todayStatus, lagStatus, progress, reEval,
     }

   Error types:
     "unauthenticated" → 401 (UI redirect a signin)
     "server"          → 4xx/5xx no-401 (UI error message)
     "network"         → fetch threw (UI retry CTA)
   ═══════════════════════════════════════════════════════════════ */

export function useActiveProgram() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const doFetch = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/me/program/active", {
        signal,
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setIsUnauthenticated(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError({ type: "server", status: res.status });
        setData(null);
        return;
      }
      setIsUnauthenticated(false);
      const body = await res.json();
      // Server retorna { active: null } cuando user no tiene programa — esto
      // NO es error. data:null es estado válido (consumer renderea fallback).
      setData(body?.active ?? null);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError({ type: "network", message: e?.message || "fetch_failed" });
      setData(null);
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

  return { data, loading, error, isUnauthenticated, refetch };
}
