"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/* Hook de cronómetro de sesión desacoplado de la UI.
   Retorna estado + controles. Permite test unitario del timing. */
export function useSessionTimer(initialSeconds = 120) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [status, setStatus] = useState("idle"); // idle | running | paused | done
  const ref = useRef(null);
  const startedAt = useRef(null);

  const tick = useCallback(() => {
    setSeconds((s) => {
      if (s <= 1) {
        clearInterval(ref.current);
        setStatus("done");
        return 0;
      }
      return s - 1;
    });
  }, []);

  const start = useCallback(() => {
    if (status === "running") return;
    startedAt.current = Date.now();
    setStatus("running");
    ref.current = setInterval(tick, 1000);
  }, [status, tick]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    clearInterval(ref.current);
    setStatus("paused");
  }, [status]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    setStatus("running");
    ref.current = setInterval(tick, 1000);
  }, [status, tick]);

  const stop = useCallback(() => {
    clearInterval(ref.current);
    setStatus("idle");
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const reset = useCallback((s = initialSeconds) => {
    clearInterval(ref.current);
    setSeconds(s);
    setStatus("idle");
  }, [initialSeconds]);

  useEffect(() => () => clearInterval(ref.current), []);

  return { seconds, status, start, pause, resume, stop, reset };
}
