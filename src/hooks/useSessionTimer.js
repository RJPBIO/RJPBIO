"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/* Cronómetro de sesión desacoplado de la UI.
   Usa Date.now() como fuente de verdad; el setInterval solo dispara
   recálculos. Así no drifta cuando el SO ralentiza/pausa los timers
   (móvil con pantalla bloqueada, tab en background). */
export function useSessionTimer(initialSeconds = 120) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState("idle"); // idle | running | paused | done

  const totalMs = useRef(initialSeconds * 1000);
  const deadline = useRef(null); // ms absolutos; null si no está corriendo
  const remaining = useRef(initialSeconds * 1000); // ms restantes congelados en pausa
  const intervalRef = useRef(null);

  const recompute = useCallback(() => {
    if (!deadline.current) return;
    const leftMs = Math.max(0, deadline.current - Date.now());
    const leftSec = Math.ceil(leftMs / 1000);
    setSeconds((s) => (s === leftSec ? s : leftSec));
    if (leftMs <= 0) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      deadline.current = null;
      remaining.current = 0;
      setStatus("done");
    }
  }, []);

  const start = useCallback(() => {
    if (status === "running") return;
    totalMs.current = initialSeconds * 1000;
    remaining.current = totalMs.current;
    deadline.current = Date.now() + remaining.current;
    setStatus("running");
    setSeconds(Math.ceil(remaining.current / 1000));
    clearInterval(intervalRef.current);
    // 250ms da UI fluida sin depender de que setInterval sea exacto.
    intervalRef.current = setInterval(recompute, 250);
  }, [status, initialSeconds, recompute]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    remaining.current = Math.max(0, (deadline.current || 0) - Date.now());
    deadline.current = null;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStatus("paused");
  }, [status]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    deadline.current = Date.now() + remaining.current;
    setStatus("running");
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(recompute, 250);
  }, [status, recompute]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    deadline.current = null;
    remaining.current = initialSeconds * 1000;
    setStatus("idle");
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const reset = useCallback((s = initialSeconds) => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    deadline.current = null;
    remaining.current = s * 1000;
    setSeconds(s);
    setStatus("idle");
  }, [initialSeconds]);

  // Al volver de background, re-sincronizar con Date.now() real.
  useEffect(() => {
    if (typeof document === "undefined") return;
    function onVis() {
      if (document.visibilityState === "visible" && status === "running") recompute();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [status, recompute]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { seconds, status, start, pause, resume, stop, reset };
}
