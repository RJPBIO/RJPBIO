"use client";
/* ═══════════════════════════════════════════════════════════════
   ShakeHandsPrompt — sacudir manos motor release
   vibrate continuous + playSpark cada 2s
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { playSpark } from "../../../../lib/audio";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function ShakeHandsPrompt({
  duration_ms = 30000,
  audio_enabled = true,
  haptic_enabled = true,
  onComplete,
}) {
  const [shakeT, setShakeT] = useState(0);

  useEffect(() => {
    let raf;
    function tick() {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      setShakeT(Math.sin(now / 60));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (haptic_enabled && typeof navigator !== "undefined" && navigator.vibrate) {
      const vibrateLoop = setInterval(() => {
        try { navigator.vibrate([60, 30, 60, 30]); } catch { /* noop */ }
      }, 220);
      return () => clearInterval(vibrateLoop);
    }
    return undefined;
  }, [haptic_enabled]);

  useEffect(() => {
    if (!audio_enabled) return undefined;
    const id = setInterval(() => {
      try { playSpark(440, 0.02); } catch { /* noop */ }
    }, 2000);
    return () => clearInterval(id);
  }, [audio_enabled]);

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    }, duration_ms);
    return () => clearTimeout(id);
  }, [duration_ms]);

  const offset = shakeT * 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s24 }}>
      <svg viewBox="0 0 200 160" width="200" height="160" aria-label="Sacude las manos" style={{ overflow: "visible" }}>
        <g transform={`translate(${offset} 0)`}>
          <path d="M 60 80 Q 60 60 70 56 Q 80 56 80 70 L 80 90 Q 80 110 70 110 Q 60 110 58 96 Z"
            fill="rgba(34,211,238,0.12)" stroke={ACCENT} strokeWidth="1" strokeLinejoin="round" />
        </g>
        <g transform={`translate(${-offset} 0)`}>
          <path d="M 140 80 Q 140 60 130 56 Q 120 56 120 70 L 120 90 Q 120 110 130 110 Q 140 110 142 96 Z"
            fill="rgba(34,211,238,0.12)" stroke={ACCENT} strokeWidth="1" strokeLinejoin="round" />
        </g>
      </svg>
      <h3 style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 22,
        letterSpacing: "-0.01em",
        color: colors.text.primary,
        textAlign: "center",
      }}>
        Sacude las manos vigorosamente
      </h3>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 14,
        color: colors.text.muted,
        textAlign: "center",
      }}>
        Como si tuvieras agua y la tiraras
      </p>
    </div>
  );
}
