"use client";
/* ═══════════════════════════════════════════════════════════════
   OcularHorizontalMetronome — un punto cyan moviéndose izq-der
   Linear easing (NO ease-in-out, evita ilusión rebote).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function OcularHorizontalMetronome({
  frequency_hz = 0.5,
  total_cycles = 10,
  onComplete,
}) {
  const [t, setT] = useState(0);
  const [cycles, setCycles] = useState(0);
  const startRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  // Quick fix post-SP5 — ref pattern para RAF loop.
  const onCompleteRef = useRef(onComplete);
  const freqRef = useRef(frequency_hz);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { freqRef.current = frequency_hz; }, [frequency_hz]);

  useEffect(() => {
    let raf;
    function tick() {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const elapsed = (now - startRef.current) / 1000;
      const period = 1 / freqRef.current;
      const cyc = Math.floor(elapsed / period);
      setCycles(cyc);
      const phase = (elapsed % period) / period;
      const progress = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      setT(progress);
      if (cyc >= total_cycles) {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total_cycles]);

  return (
    <div
      role="img"
      aria-label="Sigue el punto con los ojos"
      style={{
        position: "relative",
        inlineSize: "100%",
        blockSize: 240,
        background: "rgba(255,255,255,0.02)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: `calc(${t * 100}% - 7px)`,
          marginTop: -7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: ACCENT,
          boxShadow: "0 0 0 4px rgba(34,211,238,0.16)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 12,
          left: 16,
          fontSize: 11,
          letterSpacing: "0.12em",
          fontWeight: 500,
          color: colors.text.muted,
          textTransform: "uppercase",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ciclo {Math.min(cycles + 1, total_cycles)} / {total_cycles}
      </div>
    </div>
  );
}
