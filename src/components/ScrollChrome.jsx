"use client";
import { useEffect, useRef, useState } from "react";

/* ScrollChrome — a single rAF-throttled scroll listener that drives three
   premium chrome signals at once:

     1. A 2px phosphor-cyan progress bar pinned at inset-block-start: 0,
        scaled to scroll depth. The bar sits above the header so the
        journey is always visible without stealing focus.
     2. `data-scrolled="true"` on <html> past 120px. The CSS scroll-
        timeline path (Chromium) already shrinks the header natively; the
        attribute is the fallback for Safari / Firefox where
        animation-timeline isn't supported yet — a @supports block in
        globals.css mirrors the same compressed state when the flag is on.
     3. A back-to-top button that appears past 800px. Fixed bottom-end
        corner, cyan border-ring, smooth-scrolls to top on click.

   Mounted once in the root layout. The /app (product) surface opts out
   via data-app-route on a wrapping element; the shell only uses this on
   public marketing routes. */

export default function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const raf = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = m.matches;
    const onMatch = (e) => { reduced.current = e.matches; };
    m.addEventListener("change", onMatch);

    const compute = () => {
      const doc = document.documentElement;
      const top = window.scrollY || doc.scrollTop || 0;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, top / max));
      setProgress(p);
      setShowTop(top > 800);
      doc.dataset.scrolled = top > 120 ? "true" : "false";
      raf.current = 0;
    };

    const onScroll = () => {
      if (raf.current) return;
      raf.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      m.removeEventListener("change", onMatch);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduced.current ? "auto" : "smooth" });
  };

  return (
    <>
      <div
        aria-hidden
        className="bi-scroll-progress"
        style={{
          transform: `scaleX(${progress})`,
          opacity: progress > 0.005 ? 1 : 0,
        }}
      />
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Volver arriba"
        className="bi-back-to-top"
        data-visible={showTop ? "true" : "false"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M8 12.5V3.5 M4 7L8 3L12 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
    </>
  );
}
