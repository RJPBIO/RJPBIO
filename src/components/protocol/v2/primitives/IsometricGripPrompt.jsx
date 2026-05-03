"use client";
/* ═══════════════════════════════════════════════════════════════
   IsometricGripPrompt — alterna APRIETA / SUELTA con counter
   Anti-trampa: tap "Listo" después de cada hold para acreditar.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, playChord } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function IsometricGripPrompt({
  target_holds = 3,
  hold_duration_ms = 10000,
  release_duration_ms = 5000,
  onHoldComplete,
  onComplete,
}) {
  const [phase, setPhase] = useState("hold"); // "hold" | "release" | "done"
  const [holdsDone, setHoldsDone] = useState(0);
  const [phaseSec, setPhaseSec] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (phase === "done" || completedRef.current) return undefined;
    const id = setInterval(() => setPhaseSec((s) => s + 100), 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "done" || completedRef.current) return;
    const limit = phase === "hold" ? hold_duration_ms : release_duration_ms;
    if (phaseSec < limit) return;
    if (phase === "hold") {
      try { playChord([432], 0.3, 0.04); } catch { /* noop */ }
      try { hap("ok"); } catch { /* noop */ }
      const next = holdsDone + 1;
      setHoldsDone(next);
      if (typeof onHoldComplete === "function") onHoldComplete(next);
      if (next >= target_holds) {
        completedRef.current = true;
        setPhase("done");
        if (typeof onComplete === "function") onComplete();
        return;
      }
      setPhase("release");
      setPhaseSec(0);
    } else {
      setPhase("hold");
      setPhaseSec(0);
    }
  }, [phaseSec, phase, holdsDone, target_holds, hold_duration_ms, release_duration_ms, onHoldComplete, onComplete]);

  const isHold = phase === "hold";
  const limit = phase === "hold" ? hold_duration_ms : release_duration_ms;
  const remainingSec = Math.max(0, Math.ceil((limit - phaseSec) / 1000));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.s24,
      padding: spacing.s32,
      background: "rgba(255,255,255,0.03)",
      border: `0.5px solid ${colors.separator}`,
      borderRadius: radii.panel,
    }}>
      <svg width="84" height="84" viewBox="0 0 24 24" fill="none"
        stroke={isHold ? ACCENT : "rgba(245,245,247,0.42)"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11V6a2 2 0 014 0v5" />
        <path d="M9 11V8a2 2 0 00-4 0v6c0 4 3 7 7 7s7-3 7-7V8a2 2 0 00-4 0v3" />
      </svg>
      <h3 style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 24,
        letterSpacing: "0.04em",
        color: isHold ? ACCENT : colors.text.primary,
        textTransform: "uppercase",
      }}>
        {phase === "done" ? "Listo" : isHold ? "Aprieta" : "Suelta"}
      </h3>
      <div style={{
        fontFamily: typography.family,
        fontWeight: typography.weight.light,
        fontSize: 36,
        color: colors.text.primary,
        letterSpacing: "-0.02em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {phase === "done" ? "—" : `${remainingSec}s`}
      </div>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.medium,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: colors.text.muted,
        fontVariantNumeric: "tabular-nums",
      }}>
        {Math.min(holdsDone, target_holds)} / {target_holds}
      </p>
    </div>
  );
}
