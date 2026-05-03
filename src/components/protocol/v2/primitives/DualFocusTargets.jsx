"use client";
/* ═══════════════════════════════════════════════════════════════
   DualFocusTargets — alternancia near/far para recalibración visual
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function DualFocusTargets({
  near_duration_ms = 5000,
  far_duration_ms = 5000,
  cycles = 4,
  onComplete,
}) {
  const [phase, setPhase] = useState("near");
  const [cycleIdx, setCycleIdx] = useState(0);

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  const nearMsRef = useRef(near_duration_ms);
  const farMsRef = useRef(far_duration_ms);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { nearMsRef.current = near_duration_ms; }, [near_duration_ms]);
  useEffect(() => { farMsRef.current = far_duration_ms; }, [far_duration_ms]);

  useEffect(() => {
    if (cycleIdx >= cycles) {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      return undefined;
    }
    const ms = phase === "near" ? nearMsRef.current : farMsRef.current;
    const id = setTimeout(() => {
      if (phase === "near") setPhase("far");
      else { setPhase("near"); setCycleIdx((c) => c + 1); }
    }, ms);
    return () => clearTimeout(id);
  }, [phase, cycleIdx, cycles]);

  return (
    <div
      style={{
        position: "relative",
        inlineSize: "100%",
        blockSize: 320,
        background: "rgba(255,255,255,0.02)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingInline: spacing.s24,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: phase === "near" ? ACCENT : "rgba(34,211,238,0.18)",
          opacity: phase === "near" ? 1 : 0.35,
          boxShadow: phase === "near" ? "0 0 0 6px rgba(34,211,238,0.16)" : "none",
          transition: "opacity 240ms linear, box-shadow 240ms linear, background 240ms linear",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: phase === "far" ? ACCENT : "rgba(34,211,238,0.18)",
          opacity: phase === "far" ? 1 : 0.35,
          boxShadow: phase === "far" ? "0 0 0 4px rgba(34,211,238,0.16)" : "none",
          transition: "opacity 240ms linear, box-shadow 240ms linear, background 240ms linear",
        }}
      />
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          insetBlockEnd: 16,
          textAlign: "center",
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 14,
          color: colors.text.secondary,
          letterSpacing: "0.02em",
        }}
      >
        {phase === "near" ? "Mira tu mano (cerca)" : "Mira el horizonte (lejos)"}
      </div>
    </div>
  );
}
