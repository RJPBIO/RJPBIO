"use client";
import { useEffect, useRef } from "react";

/* useCursorSpotlight — rastrea mouse dentro de un contenedor y expone
   coords locales via CSS vars (--mx, --my en px; --mxp, --myp en %) a cada
   descendiente que matchee `childSelector`. Linear/Vercel style.
   No-op si prefers-reduced-motion. Usa delegación de eventos + rAF. */
export function useCursorSpotlight(childSelector = ".bi-spot") {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;
    let pendingEl = null;

    const flush = () => {
      if (pendingEl) {
        pendingEl.style.setProperty("--mx", `${pendingX}px`);
        pendingEl.style.setProperty("--my", `${pendingY}px`);
        pendingEl.style.setProperty("--mxp", `${pendingX / pendingEl.offsetWidth * 100}%`);
        pendingEl.style.setProperty("--myp", `${pendingY / pendingEl.offsetHeight * 100}%`);
      }
      raf = 0;
    };

    const onMove = (e) => {
      const target = e.target.closest(childSelector);
      if (!target || !host.contains(target)) return;
      const rect = target.getBoundingClientRect();
      pendingX = e.clientX - rect.left;
      pendingY = e.clientY - rect.top;
      pendingEl = target;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    host.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [childSelector]);

  return ref;
}
