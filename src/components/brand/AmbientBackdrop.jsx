"use client";
import { useEffect, useRef } from "react";

/* AmbientBackdrop — backdrop global estilo Linear/Stripe.
   Conic gradient que respira, noise grain SVG, y orbes fósforo/violeta
   que derivan lento. Fijo detrás de todo, no captura eventos.
   Respeta prefers-reduced-motion. */
export default function AmbientBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let y = 0;
    const onScroll = () => {
      y = window.scrollY;
      if (!raf) raf = requestAnimationFrame(() => {
        el.style.setProperty("--bi-scroll", `${y * 0.12}px`);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="bi-ambient-backdrop" aria-hidden>
      <div className="bi-ambient-parallax">
        <div className="bi-ambient-mesh" />
        <div className="bi-ambient-lattice" />
      </div>
      <div className="bi-ambient-orb bi-ambient-orb-a" />
      <div className="bi-ambient-orb bi-ambient-orb-b" />
      <div className="bi-ambient-orb bi-ambient-orb-c" />
      <div className="bi-ambient-scanline" />
      <div className="bi-ambient-vignette" />
      <svg className="bi-ambient-grain" width="100%" height="100%">
        <filter id="bi-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.35 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bi-grain)" />
      </svg>
    </div>
  );
}
