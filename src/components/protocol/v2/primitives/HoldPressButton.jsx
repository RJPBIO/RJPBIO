"use client";
/* ═══════════════════════════════════════════════════════════════
   HoldPressButton — botón circular con ring progress.
   Anti-trampa: el press físico ES la validación.
   Pointer-up antes de min_hold → cancel + hap("error").
   Hold completo → hapticSignature("award") + onComplete.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, typography } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const SIZE = 140;
const RADIUS = 64;

export default function HoldPressButton({
  label = "Sostén",
  min_hold_ms = 3000,
  release_message = "Listo",
  haptic_during_hold = true,
  onComplete,
  onCancel,
}) {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showRelease, setShowRelease] = useState(false);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const tickRef = useRef(null);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    rafRef.current = null;
    tickRef.current = null;
  };

  useEffect(() => () => stopAnim(), []);

  const tick = () => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(1, elapsed / min_hold_ms);
    setProgress(pct);
    if (pct >= 1) {
      stopAnim();
      setCompleted(true);
      setPressing(false);
      try { hapticSignature("award"); } catch { /* noop */ }
      setShowRelease(true);
      setTimeout(() => {
        if (typeof onComplete === "function") onComplete();
      }, 1200);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPress = () => {
    if (completed) return;
    setPressing(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    if (haptic_during_hold) {
      tickRef.current = setInterval(() => {
        try { hap("tap"); } catch { /* noop */ }
      }, 200);
    }
  };

  const cancelPress = () => {
    if (completed || !pressing) return;
    const elapsed = Date.now() - startRef.current;
    stopAnim();
    setPressing(false);
    if (elapsed < min_hold_ms) {
      try { hap("error"); } catch { /* noop */ }
      setProgress(0);
      if (typeof onCancel === "function") onCancel();
    }
  };

  const circumference = 2 * Math.PI * RADIUS;
  const dashOffset = circumference * (1 - progress);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <button
        type="button"
        aria-label={label}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        style={{
          appearance: "none",
          position: "relative",
          inlineSize: SIZE,
          blockSize: SIZE,
          borderRadius: "50%",
          background: pressing ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.03)",
          border: `0.5px solid ${pressing ? ACCENT : colors.separator}`,
          color: pressing || completed ? ACCENT : colors.text.secondary,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: completed ? "default" : "pointer",
          touchAction: "none",
          transition: "background 120ms linear, border-color 120ms linear",
        }}
      >
        <svg
          aria-hidden="true"
          width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={ACCENT} strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 80ms linear" }}
          />
        </svg>
        <span style={{ position: "relative", zIndex: 1 }}>
          {showRelease ? release_message : label}
        </span>
      </button>
    </div>
  );
}
