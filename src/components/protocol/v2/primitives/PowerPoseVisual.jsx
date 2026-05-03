"use client";
/* ═══════════════════════════════════════════════════════════════
   PowerPoseVisual — para #23 Power Pose Activation.
   Phase-controlled (Phase 5 quick-fix 5-2): el prop `phase` decide
   qué estado renderiza, NO un ciclo interno fijo.
     - "posture_alignment": figura erguida con 5 puntos highlight
                            cyan, sin loop isometric. onComplete al
                            t = duration_ms (timing-based).
     - "isometric_holds":   figura + ciclo APRIETA → SUELTA según
                            target_holds. onComplete al completar
                            target_holds.
   Patrón ref-based: callbacks en refs, deps estables.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, playChord } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function PowerPoseVisual({
  phase = "isometric_holds", // "posture_alignment" | "isometric_holds"
  duration_ms = 30000,        // usado por "posture_alignment"
  target_holds = 3,
  hold_duration_ms = 8000,
  release_duration_ms = 4000,
  audio_enabled = true,
  haptic_enabled = true,
  onHoldComplete,
  onComplete,
}) {
  // ─── Estado interno: separado del prop phase ───────────────
  // Para isometric_holds: hold | release | done
  // Para posture_alignment: alignment | done (no usa hold/release)
  const [subPhase, setSubPhase] = useState(phase === "posture_alignment" ? "alignment" : "hold");
  const [holdsDone, setHoldsDone] = useState(0);
  const [phaseSec, setPhaseSec] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const onHoldCompleteRef = useRef(onHoldComplete);
  const completedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onHoldCompleteRef.current = onHoldComplete; }, [onHoldComplete]);

  // Single ticker (deps estables: ninguna). Detiene cuando completedRef true.
  useEffect(() => {
    const id = setInterval(() => {
      if (completedRef.current) return;
      setPhaseSec((s) => s + 100);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Posture alignment: completar tras duration_ms (timing-based).
  useEffect(() => {
    if (phase !== "posture_alignment" || completedRef.current) return;
    if (phaseSec < duration_ms) return;
    completedRef.current = true;
    if (audio_enabled) {
      try { playChord([432], 0.3, 0.04); } catch { /* noop */ }
    }
    setSubPhase("done");
    if (typeof onCompleteRef.current === "function") onCompleteRef.current();
  }, [phase, phaseSec, duration_ms, audio_enabled]);

  // Isometric holds: ciclo hold → release → ... → done.
  useEffect(() => {
    if (phase !== "isometric_holds" || completedRef.current) return;
    if (subPhase === "done") return;
    const limit = subPhase === "hold" ? hold_duration_ms : release_duration_ms;
    if (phaseSec < limit) return;
    if (subPhase === "hold") {
      if (haptic_enabled) {
        try { hap("ok"); } catch { /* noop */ }
      }
      const next = holdsDone + 1;
      setHoldsDone(next);
      if (typeof onHoldCompleteRef.current === "function") onHoldCompleteRef.current(next);
      if (next >= target_holds) {
        if (audio_enabled) {
          try { playChord([432], 0.3, 0.04); } catch { /* noop */ }
        }
        completedRef.current = true;
        setSubPhase("done");
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        return;
      }
      setSubPhase("release");
      setPhaseSec(0);
    } else {
      setSubPhase("hold");
      setPhaseSec(0);
    }
  }, [
    phase, subPhase, phaseSec, holdsDone, target_holds,
    hold_duration_ms, release_duration_ms, audio_enabled, haptic_enabled,
  ]);

  // ─── Visual derivation ──────────────────────────────────────
  const isAlignment = phase === "posture_alignment";
  const isDone = subPhase === "done";
  const isHold = !isAlignment && subPhase === "hold";
  const figureHighlighted = isAlignment ? !isDone : isHold;
  const figureStroke = figureHighlighted ? ACCENT : "rgba(245,245,247,0.62)";
  const breathScale = figureHighlighted ? 1.0 + 0.16 * Math.sin(phaseSec / 600) : 0.92;

  const titleText = isAlignment
    ? (isDone ? "Listo" : "Alineación postural")
    : (isDone ? "Listo" : isHold ? "Aprieta" : "Suelta");

  const limitForCountdown = isAlignment
    ? duration_ms
    : (isHold ? hold_duration_ms : release_duration_ms);
  const remainingSec = Math.max(0, Math.ceil((limitForCountdown - phaseSec) / 1000));
  const counterText = isAlignment
    ? (isDone ? "—" : `${remainingSec}s`)
    : `${Math.min(holdsDone, target_holds)} / ${target_holds}`;

  return (
    <div
      data-testid="pose-root"
      data-phase={phase}
      data-subphase={subPhase}
      style={{
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
      }}
    >
      <svg viewBox="0 0 160 220" width="160" height="220" aria-label="Postura erguida">
        {/* Cabeza */}
        <circle cx="80" cy="32" r="14" fill="none" stroke={figureStroke} strokeWidth="1.4" />
        {/* Columna recta */}
        <line x1="80" y1="46" x2="80" y2="130" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />
        {/* Hombros expandidos */}
        <line x1="52" y1="62" x2="108" y2="62" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />
        {/* Brazos firmes */}
        <line x1="52" y1="62" x2="46" y2="118" stroke={figureStroke} strokeWidth="1.2" strokeLinecap="round" />
        <line x1="108" y1="62" x2="114" y2="118" stroke={figureStroke} strokeWidth="1.2" strokeLinecap="round" />
        {/* Pelvis */}
        <line x1="62" y1="130" x2="98" y2="130" stroke={figureStroke} strokeWidth="1.2" strokeLinecap="round" />
        {/* Piernas firmes */}
        <line x1="62" y1="130" x2="60" y2="186" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="98" y1="130" x2="100" y2="186" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />
        {/* Pies firmes */}
        <line x1="48" y1="186" x2="72" y2="186" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="88" y1="186" x2="112" y2="186" stroke={figureStroke} strokeWidth="1.4" strokeLinecap="round" />

        {/* 5 puntos anotados (highlights cyan cuando figureHighlighted) */}
        {figureHighlighted && (
          <>
            <circle cx="60" cy="186" r="3" fill={ACCENT} opacity="0.78" />
            <circle cx="100" cy="186" r="3" fill={ACCENT} opacity="0.78" />
            <circle cx="80" cy="92" r="3" fill={ACCENT} opacity="0.78" />
            <circle cx="52" cy="62" r="3" fill={ACCENT} opacity="0.78" />
            <circle cx="108" cy="62" r="3" fill={ACCENT} opacity="0.78" />
          </>
        )}

        {/* Breath orb (bottom, sutil) */}
        <circle cx="80" cy="208" r={6 * breathScale}
          fill="none" stroke={ACCENT} strokeWidth="0.6" opacity="0.32" />
      </svg>

      <h3 style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: isAlignment ? 20 : 22,
        color: figureHighlighted ? ACCENT : colors.text.primary,
        letterSpacing: isAlignment ? "-0.01em" : "0.04em",
        textTransform: isAlignment ? "none" : "uppercase",
      }}>
        {titleText}
      </h3>
      <div style={{
        fontFamily: typography.family,
        fontWeight: typography.weight.light,
        fontSize: 36,
        color: colors.text.primary,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {isDone ? "—" : `${remainingSec}s`}
      </div>
      <p
        data-testid="pose-counter"
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
        {counterText}
      </p>
    </div>
  );
}
