"use client";
import { useState, useEffect, useRef } from "react";
import { font } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

/**
 * AnimatedNumber — Counts up/down with easeOutCubic.
 * Respects prefers-reduced-motion (instant update).
 */
export default function AnimatedNumber({ value, suffix = "", color = "#0F172A", size = 32, ariaLabel }) {
  const reduced = useReducedMotion();
  const [displayed, setDisplayed] = useState(value);
  const raf = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplayed(value);
      prev.current = value;
      return;
    }
    const start = prev.current;
    const end = value;
    const t0 = performance.now();

    function step(now) {
      const p = Math.min((now - t0) / 700, 1);
      setDisplayed(Math.round(start + (1 - Math.pow(1 - p, 3)) * (end - start)));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else prev.current = end;
    }

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, reduced]);

  return (
    <span
      aria-label={ariaLabel || `${value}${suffix}`}
      style={{
        fontSize: size,
        fontWeight: font.weight.black,
        color,
        fontFamily: font.family,
        letterSpacing: "-1px",
      }}
    >
      <span aria-hidden="true">
        {displayed}
        {suffix}
      </span>
    </span>
  );
}
