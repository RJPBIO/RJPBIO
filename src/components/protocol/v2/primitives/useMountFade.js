"use client";
/* ═══════════════════════════════════════════════════════════════
   useMountFade — Phase 7 elev wave 3
   ───────────────────────────────────────────────────────────────
   Hook compartido para smooth fade-in + slight rise on mount.
   420ms easeOutCubic, transform translateY(8→0).
   Respeta prefers-reduced-motion: SSR-safe.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

export function useMountFade({ duration = 420, rise = 8, reduceMotion = false } = {}) {
  const [t, setT] = useState(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setT(1);
      return undefined;
    }
    let stopped = false;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (stopped) return;
      const ratio = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - ratio, 3);
      setT(eased);
      if (ratio < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [duration, reduceMotion]);

  return {
    opacity: t,
    transform: `translateY(${((1 - t) * rise).toFixed(2)}px)`,
  };
}
