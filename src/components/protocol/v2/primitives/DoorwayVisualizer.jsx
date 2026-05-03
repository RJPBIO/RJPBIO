"use client";
/* ═══════════════════════════════════════════════════════════════
   DoorwayVisualizer — para #21 Threshold Crossing.
   Phase-controlled (Phase 5 quick-fix): el prop `phase` decide qué
   estado renderiza, NO un ciclo interno que recorre todo.
     - "approach": portal lejano se acerca (escala 0.4 → 1.0).
                   Sin flash. onComplete al t = duration_ms.
     - "cross":    flash breve <250ms al inicio (cumple WCAG 2.3.1)
                   + estado "Del otro lado" sostenido. onComplete al t = duration_ms.
     - "post":     "Del otro lado" estático sin flash. onComplete al t = duration_ms.
   Patrón ref-based: callbacks en refs, deps estables, sin re-mount loop.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { playSpark, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const FLASH_MS = 220; // <250ms cumple WCAG 2.1 SC 2.3.1

export default function DoorwayVisualizer({
  phase = "approach", // "approach" | "cross" | "post"
  duration_ms = 30000,
  flash_enabled = true,
  audio_enabled = true,
  haptic_enabled = true,
  post_text = "Del otro lado",
  onComplete,
}) {
  const [t, setT] = useState(0);
  const [flashing, setFlashing] = useState(phase === "cross" && flash_enabled);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Single tick (deps estables: ninguna).
  useEffect(() => {
    const TICK = 100;
    const id = setInterval(() => setT((v) => v + TICK), TICK);
    return () => clearInterval(id);
  }, []);

  // Cross-only: flash + cue al mount, una sola vez. flashTimer en ref para
  // que no se cancele al re-render del padre.
  const flashTimerRef = useRef(null);
  const flashFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== "cross" || flashFiredRef.current) return undefined;
    flashFiredRef.current = true;
    if (audio_enabled) {
      try { playSpark(440, 0.04); } catch { /* noop */ }
    }
    if (haptic_enabled) {
      try { hapticSignature("phaseShift"); } catch { /* noop */ }
    }
    if (flash_enabled) {
      flashTimerRef.current = setTimeout(() => setFlashing(false), FLASH_MS);
    } else {
      setFlashing(false);
    }
    return undefined;
  }, [phase, audio_enabled, haptic_enabled, flash_enabled]);

  // Cleanup en unmount.
  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  // onComplete cuando t alcanza duration_ms (una sola vez).
  useEffect(() => {
    if (completedRef.current) return;
    if (t < duration_ms) return;
    completedRef.current = true;
    if (typeof onCompleteRef.current === "function") onCompleteRef.current();
  }, [t, duration_ms]);

  // ─── Visual state derivation por phase ────────────────────────
  const progress = phase === "approach"
    ? Math.min(1, t / Math.max(1, duration_ms))
    : 1;

  const scale =
    phase === "approach" ? 0.4 + 0.6 * progress :
    1.0; // cross + post: portal completo

  const showFlashOverlay = phase === "cross" && flashing;
  const flashOpacity = showFlashOverlay ? 0.78 : 0;

  const labelText =
    phase === "approach" ? "El umbral se acerca" :
    /* cross | post */ post_text;

  const isPostlike = phase === "cross" || phase === "post";

  const subText =
    phase === "approach" ? `${Math.round(progress * 100)} %` :
    "Listo";

  return (
    <div
      data-testid="doorway-root"
      data-phase={phase}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing.s24,
        padding: spacing.s32,
        background: "rgba(255,255,255,0.02)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        inlineSize: "100%",
        maxInlineSize: 360,
        overflow: "hidden",
      }}
    >
      {/* Flash overlay — solo phase="cross" durante FLASH_MS */}
      <div
        data-testid="doorway-flash"
        data-active={showFlashOverlay ? "true" : "false"}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: ACCENT,
          opacity: flashOpacity,
          transition: `opacity ${flash_enabled ? 80 : 360}ms linear`,
          pointerEvents: "none",
        }}
      />
      <svg
        viewBox="0 0 200 220"
        width="200"
        height="220"
        aria-label="Umbral"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "50% 70%",
          transition: "transform 100ms linear",
          opacity: isPostlike ? 0.42 : 0.92,
        }}
      >
        <line x1="60" y1="40" x2="60" y2="200"
          stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="140" y1="40" x2="140" y2="200"
          stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 60 40 Q 100 8 140 40"
          fill="none" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="40" y1="200" x2="160" y2="200"
          stroke="rgba(245,245,247,0.18)" strokeWidth="0.6" />
      </svg>
      <h3
        data-testid="doorway-label"
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: typography.family,
          fontWeight: isPostlike ? typography.weight.medium : typography.weight.regular,
          fontSize: isPostlike ? 32 : 22,
          letterSpacing: "-0.01em",
          color: isPostlike ? colors.text.primary : colors.text.secondary,
          position: "relative",
          zIndex: 2,
        }}
      >
        {labelText}
      </h3>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontVariantNumeric: "tabular-nums",
          position: "relative",
          zIndex: 2,
        }}
      >
        {subText}
      </p>
    </div>
  );
}
