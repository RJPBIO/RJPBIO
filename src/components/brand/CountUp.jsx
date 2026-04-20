"use client";
import { useEffect, useRef, useState } from "react";

/* CountUp — anima un entero de 0 a `value` cuando entra en viewport.
   Respeta prefers-reduced-motion (muestra el número final directo).
   Pensado para las proof stats; ease-out para que sea legible. */
export default function CountUp({ value, duration = 1400, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(value); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });

    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const finalStr = String(value) + suffix;
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        minInlineSize: `${finalStr.length}ch`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}{suffix}
    </span>
  );
}
