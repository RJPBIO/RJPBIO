"use client";
/* ═══════════════════════════════════════════════════════════════
   WalkingPaceIndicator — para #24 Bilateral Walking Meditation.
   2 pisadas (izq+der) que alternan highlight a pace_bpm.
   Tap manual: el user da un tap por cada paso. Counter visible.
   Patrón ref-based: callbacks en refs, deps estables.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, playSpark } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function WalkingPaceIndicator({
  target_steps = 16,
  pattern = "alternate", // "alternate" | "left_only" | "right_only"
  pace_bpm = 60,
  audio_enabled = true,
  haptic_enabled = true,
  onStep,
  onComplete,
}) {
  const [steps, setSteps] = useState(0);
  const [activeFoot, setActiveFoot] = useState(pattern === "right_only" ? "right" : "left");
  const onCompleteRef = useRef(onComplete);
  const onStepRef = useRef(onStep);
  const completedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onStepRef.current = onStep; }, [onStep]);

  // Pace pulse: línea horizontal pulsa a pace_bpm
  const [pulseT, setPulseT] = useState(0);
  useEffect(() => {
    if (completedRef.current) return undefined;
    const interval_ms = 60000 / pace_bpm;
    const id = setInterval(() => setPulseT((v) => v + 1), Math.max(80, Math.floor(interval_ms / 8)));
    return () => clearInterval(id);
  }, [pace_bpm]);

  function tapStep() {
    if (completedRef.current) return;
    const next = steps + 1;
    setSteps(next);
    if (haptic_enabled) {
      try { hap("tap"); } catch { /* noop */ }
    }
    if (audio_enabled) {
      try { playSpark(440, 0.02); } catch { /* noop */ }
    }
    // Determine foot for the step we just took
    const foot =
      pattern === "left_only" ? "left" :
      pattern === "right_only" ? "right" :
      next % 2 === 1 ? "left" : "right";
    if (typeof onStepRef.current === "function") onStepRef.current({ step: next, foot });
    // Switch active foot for next step
    if (pattern === "alternate") {
      setActiveFoot(next % 2 === 1 ? "right" : "left");
    }
    if (next >= target_steps && !completedRef.current) {
      completedRef.current = true;
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    }
  }

  // Pulse opacity para línea horizontal de pace (sin loop CSS)
  const pulseOpacity = 0.32 + 0.42 * Math.abs(Math.sin(pulseT * 0.4));

  const leftActive = activeFoot === "left" && !completedRef.current;
  const rightActive = activeFoot === "right" && !completedRef.current;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.s24,
      padding: spacing.s32,
      background: "rgba(255,255,255,0.02)",
      border: `0.5px solid ${colors.separator}`,
      borderRadius: radii.panelLg,
      inlineSize: "100%",
      maxInlineSize: 320,
    }}>
      <svg viewBox="0 0 200 160" width="200" height="160" aria-label="Pace de marcha">
        {/* Pace line (horizontal pulsante) */}
        <line
          x1="20" y1="20" x2="180" y2="20"
          stroke={ACCENT}
          strokeWidth="0.8"
          opacity={pulseOpacity}
        />
        {/* Pisada izquierda */}
        <ellipse
          cx="68" cy="92" rx="22" ry="34"
          fill={leftActive ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.04)"}
          stroke={leftActive ? ACCENT : "rgba(245,245,247,0.42)"}
          strokeWidth="1.4"
        />
        <text
          x="68" y="148"
          textAnchor="middle"
          fill={leftActive ? ACCENT : "rgba(245,245,247,0.62)"}
          fontFamily={typography.family}
          fontSize="11"
          letterSpacing="0.12em"
        >
          IZQ
        </text>
        {/* Pisada derecha */}
        <ellipse
          cx="132" cy="92" rx="22" ry="34"
          fill={rightActive ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.04)"}
          stroke={rightActive ? ACCENT : "rgba(245,245,247,0.42)"}
          strokeWidth="1.4"
        />
        <text
          x="132" y="148"
          textAnchor="middle"
          fill={rightActive ? ACCENT : "rgba(245,245,247,0.62)"}
          fontFamily={typography.family}
          fontSize="11"
          letterSpacing="0.12em"
        >
          DER
        </text>
      </svg>

      <h3 style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 20,
        color: colors.text.primary,
        letterSpacing: "-0.01em",
      }}>
        Marcha lenta consciente
      </h3>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 13,
        color: colors.text.muted,
      }}>
        Un tap por cada paso. Atención en los pies.
      </p>

      <p
        data-testid="step-counter"
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        Pasos {Math.min(steps, target_steps)} / {target_steps}
      </p>

      <button
        type="button"
        onClick={tapStep}
        disabled={completedRef.current}
        style={{
          appearance: "none",
          cursor: completedRef.current ? "default" : "pointer",
          padding: "14px 28px",
          minBlockSize: 44,
          minInlineSize: 44,
          background: completedRef.current ? "rgba(255,255,255,0.06)" : ACCENT,
          color: completedRef.current ? colors.text.muted : "#08080A",
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {completedRef.current ? "Listo" : "Paso"}
      </button>
    </div>
  );
}
