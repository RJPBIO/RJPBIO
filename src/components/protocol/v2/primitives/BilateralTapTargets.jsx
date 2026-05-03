"use client";
/* ═══════════════════════════════════════════════════════════════
   BilateralTapTargets — motor bilateral
   Dos pads izq/der; highlight rítmico según bpm. Cada tap dispara
   hap + vibrate + counter. Validación: bilateral check + count.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, hapticSignature } from "../../../../lib/audio";
import { colors, spacing, radii, typography } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const SEPARATOR = colors.separator;
const CARD_BG = "rgba(255,255,255,0.03)";
const CARD_BG_HIGHLIGHT = "rgba(34,211,238,0.12)";

export default function BilateralTapTargets({
  pattern = "alternate",
  bpm = 120,
  target_taps = 30,
  haptic_enabled = true,
  onTap,
  onComplete,
}) {
  const [activeSide, setActiveSide] = useState(pattern === "alternate" ? "L" : "BOTH");
  const [taps, setTaps] = useState({ L: 0, R: 0 });
  const [lastTappedSide, setLastTappedSide] = useState(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (pattern !== "alternate") return undefined;
    const intervalMs = Math.max(150, 60000 / bpm);
    let side = "L";
    setActiveSide(side);
    const id = setInterval(() => {
      side = side === "L" ? "R" : "L";
      setActiveSide(side);
    }, intervalMs);
    return () => clearInterval(id);
  }, [pattern, bpm]);

  const handleTap = (side) => {
    if (completedRef.current) return;
    setLastTappedSide(side);
    setTaps((prev) => {
      const next = { ...prev, [side]: prev[side] + 1 };
      const total = next.L + next.R;
      if (typeof onTap === "function") onTap(side);
      if (haptic_enabled) {
        try { hap("tap"); } catch { /* noop */ }
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(35);
      }
      if (total >= target_taps && !completedRef.current) {
        completedRef.current = true;
        try { hapticSignature("checkpoint"); } catch { /* noop */ }
        if (typeof onComplete === "function") onComplete();
      }
      return next;
    });
  };

  const Pad = ({ side, label }) => {
    const isActive = activeSide === side || activeSide === "BOTH";
    const justTapped = lastTappedSide === side;
    return (
      <button
        type="button"
        onPointerDown={() => handleTap(side)}
        aria-label={`Tap ${label}`}
        style={{
          flex: 1,
          minBlockSize: 200,
          background: isActive ? CARD_BG_HIGHLIGHT : CARD_BG,
          border: `0.5px solid ${isActive ? "rgba(34,211,238,0.4)" : SEPARATOR}`,
          borderRadius: radii.panel,
          color: isActive ? ACCENT : colors.text.secondary,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: typography.size.body,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "background 80ms linear, transform 80ms linear",
          transform: justTapped ? "scale(0.98)" : "scale(1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "manipulation",
          appearance: "none",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke={isActive ? ACCENT : "rgba(245,245,247,0.38)"}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
        </svg>
      </button>
    );
  };

  const total = taps.L + taps.R;
  const progressPct = Math.min(100, Math.round((total / target_taps) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.s24 }}>
      <div style={{ display: "flex", gap: spacing.s16 }}>
        <Pad side="L" label="izquierda" />
        <Pad side="R" label="derecha" />
      </div>
      <div
        aria-hidden="true"
        style={{
          height: 2,
          background: SEPARATOR,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div style={{
          width: `${progressPct}%`,
          height: "100%",
          background: ACCENT,
          transition: "width 120ms linear",
        }} />
      </div>
    </div>
  );
}
