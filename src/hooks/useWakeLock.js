"use client";
import { useEffect, useRef } from "react";

export function useWakeLock(active) {
  const sentinel = useRef(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    async function request() {
      try { sentinel.current = await navigator.wakeLock.request("screen"); } catch {}
    }
    async function release() {
      try { await sentinel.current?.release(); sentinel.current = null; } catch {}
    }
    if (active) request();
    else release();

    function onVisibility() {
      if (active && document.visibilityState === "visible" && !sentinel.current) request();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      release();
    };
  }, [active]);
}
