"use client";
/* ═══════════════════════════════════════════════════════════════
   OcularDots — saccade target stub (eye_movement validation)
   4-6 puntos en posiciones fijas. Cambia el activo cada interval.
   SP2: timing-based validation. SP3+: optional eye-tracking integration.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const POSITIONS_5 = [
  { top: "12%", left: "12%" },
  { top: "12%", right: "12%" },
  { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  { bottom: "12%", left: "12%" },
  { bottom: "12%", right: "12%" },
];

function buildSequence(n, kind) {
  const idxs = Array.from({ length: n }, (_, i) => i);
  if (kind === "clockwise") return [0, 1, 4, 3, 2];
  if (kind === "saccade_pattern") return [0, 1, 0, 1, 4, 3, 4, 3];
  return idxs.sort(() => 0.5 - Math.random());
}

export default function OcularDots({
  dot_count = 5,
  interval_ms = 1200,
  sequence = "saccade_pattern",
  total_steps = 12,
  onComplete,
}) {
  const positions = POSITIONS_5.slice(0, Math.min(dot_count, POSITIONS_5.length));
  const seqRef = useRef(buildSequence(positions.length, sequence));
  const [stepIdx, setStepIdx] = useState(0);

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  const intervalMsRef = useRef(interval_ms);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { intervalMsRef.current = interval_ms; }, [interval_ms]);

  useEffect(() => {
    if (stepIdx >= total_steps) {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      return undefined;
    }
    const id = setTimeout(() => setStepIdx((i) => i + 1), intervalMsRef.current);
    return () => clearTimeout(id);
  }, [stepIdx, total_steps]);

  const activeIdx = seqRef.current[stepIdx % seqRef.current.length];

  return (
    <div
      role="img"
      aria-label="Sigue el punto activo con la mirada"
      style={{
        position: "relative",
        inlineSize: "100%",
        blockSize: 360,
        background: "rgba(255,255,255,0.02)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {positions.map((pos, i) => {
        const isActive = i === activeIdx;
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: "absolute",
              ...pos,
              inlineSize: 12,
              blockSize: 12,
              borderRadius: "50%",
              background: isActive ? ACCENT : "rgba(34,211,238,0.5)",
              border: `0.5px solid ${ACCENT}`,
              opacity: isActive ? 1 : 0.45,
              boxShadow: isActive ? `0 0 0 4px rgba(34,211,238,0.18)` : "none",
              transition: "opacity 200ms linear, box-shadow 200ms linear",
            }}
          />
        );
      })}
    </div>
  );
}
