"use client";
import { useState, useEffect, useRef } from "react";
import { font } from "../lib/tokens";

/**
 * AnimatedNumber — Counts up/down with easeOutCubic.
 * Shared primitive used by Dashboard, Profile, and summary screens.
 */
export default function AnimatedNumber({ value, suffix = "", color = "#0F172A", size = 32 }) {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = displayed;
    const end = value;
    const t0 = performance.now();

    function step(now) {
      const p = Math.min((now - t0) / 700, 1);
      setDisplayed(Math.round(start + (1 - Math.pow(1 - p, 3)) * (end - start)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }

    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  return (
    <span style={{
      fontSize: size,
      fontWeight: font.weight.black,
      color,
      fontFamily: font.family,
      letterSpacing: "-1px",
    }}>
      {displayed}{suffix}
    </span>
  );
}
