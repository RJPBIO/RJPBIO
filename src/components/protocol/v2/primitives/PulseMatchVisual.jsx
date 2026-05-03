"use client";
/* ═══════════════════════════════════════════════════════════════
   PulseMatchVisual — para #25 Cardiac Coherence Pulse Match.
   Heartbeat dot + breath orb sincronizado lado a lado.
   User da tap en cada latido detectado en sus dedos. Counter visible.
   Anti-trampa: BPM rate check (60-120 sostenido válido; >120 invalida).
   Patrón ref-based: callbacks en refs, deps estables.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { hap, playSpark, hapticSignature } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const MAX_BPM_VALID = 120;

export default function PulseMatchVisual({
  mode = "match_breathing", // "count_only" | "match_breathing"
  target_breaths = 5,
  interval_ms = 30000,
  audio_enabled = true,
  haptic_enabled = true,
  onPulseTap,
  onComplete,
}) {
  const [pulses, setPulses] = useState(0);
  const [breathSec, setBreathSec] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const [intervalLeft, setIntervalLeft] = useState(interval_ms);
  const [invalidRate, setInvalidRate] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onPulseTapRef = useRef(onPulseTap);
  const completedRef = useRef(false);
  const tapTimesRef = useRef([]);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onPulseTapRef.current = onPulseTap; }, [onPulseTap]);

  // Breath cycle tick (5.5 rpm = ~10.9s por ciclo). Usamos 11s.
  // 4s in, 7s out.
  const CYCLE_MS = 11000;

  useEffect(() => {
    if (completedRef.current) return undefined;
    const id = setInterval(() => {
      setBreathSec((s) => {
        const next = s + 100;
        if (next >= CYCLE_MS) {
          setBreathCycles((c) => {
            const nc = c + 1;
            if (mode === "match_breathing" && nc >= target_breaths && !completedRef.current) {
              completedRef.current = true;
              if (audio_enabled) {
                try { playSpark(640, 0.02); } catch { /* noop */ }
                try { hapticSignature("checkpoint"); } catch { /* noop */ }
              }
              if (typeof onCompleteRef.current === "function") onCompleteRef.current();
            }
            return nc;
          });
          return 0;
        }
        return next;
      });
      setIntervalLeft((v) => {
        const next = Math.max(0, v - 100);
        if (next === 0 && mode === "count_only" && !completedRef.current) {
          completedRef.current = true;
          if (audio_enabled) {
            try { playSpark(640, 0.02); } catch { /* noop */ }
          }
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [mode, target_breaths, audio_enabled]);

  function tapPulse() {
    if (completedRef.current) return;
    const now = Date.now();
    const arr = tapTimesRef.current;
    arr.push(now);
    // Keep last 5 taps to compute rolling BPM
    while (arr.length > 5) arr.shift();
    if (arr.length >= 3) {
      const span = arr[arr.length - 1] - arr[0];
      const intervals = arr.length - 1;
      const avgInterval = span / intervals;
      const bpm = 60000 / avgInterval;
      setInvalidRate(bpm > MAX_BPM_VALID);
    }
    setPulses((p) => p + 1);
    if (haptic_enabled) {
      try { hap("tap"); } catch { /* noop */ }
    }
    if (typeof onPulseTapRef.current === "function") onPulseTapRef.current({ at: now });
  }

  // Breath orb radius animado
  const cyclePos = breathSec / CYCLE_MS; // 0..1
  // Inhale 0..0.36, exhale 0.36..1
  let breathR;
  if (cyclePos < 0.36) {
    breathR = 16 + (cyclePos / 0.36) * 22; // 16 → 38
  } else {
    breathR = 38 - ((cyclePos - 0.36) / 0.64) * 22; // 38 → 16
  }
  // Heartbeat dot pulse: cuando el user tap, brilla brevemente
  const lastTapAge = tapTimesRef.current.length
    ? Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1]
    : 9999;
  const heartGlow = lastTapAge < 200 ? 1 : 0.55;

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
      maxInlineSize: 360,
    }}>
      <svg viewBox="0 0 220 120" width="220" height="120" aria-label="Pulso y respiración">
        {/* Heartbeat dot (left) */}
        <circle cx="68" cy="60" r="14" fill="none" stroke="rgba(245,245,247,0.32)" strokeWidth="0.6" />
        <circle cx="68" cy="60" r="8"
          fill={ACCENT}
          opacity={heartGlow}
        />
        <text x="68" y="100" textAnchor="middle"
          fill="rgba(245,245,247,0.62)"
          fontFamily={typography.family} fontSize="11" letterSpacing="0.12em">
          PULSO
        </text>
        {/* Breath orb (right) */}
        <circle cx="152" cy="60" r={breathR}
          fill="none" stroke={ACCENT} strokeWidth="1.0" opacity="0.78" />
        <text x="152" y="100" textAnchor="middle"
          fill="rgba(245,245,247,0.62)"
          fontFamily={typography.family} fontSize="11" letterSpacing="0.12em">
          RESPIRA
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
        {mode === "match_breathing" ? "Sincroniza con respiración" : "Cuenta latidos en tus dedos"}
      </h3>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 13,
        color: colors.text.muted,
      }}>
        Dedos en muñeca o cuello. Un tap por latido.
      </p>

      <div
        data-testid="pulse-stats"
        style={{
          display: "flex",
          gap: spacing.s24,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>Latidos {pulses}</span>
        {mode === "match_breathing" && (
          <span>Ciclos {Math.min(breathCycles, target_breaths)} / {target_breaths}</span>
        )}
        {mode === "count_only" && (
          <span>{Math.ceil(intervalLeft / 1000)}s</span>
        )}
      </div>

      {invalidRate && (
        <p
          data-testid="invalid-rate-warning"
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontWeight: typography.weight.regular,
            fontSize: 12,
            color: "rgba(245,245,247,0.62)",
            textAlign: "center",
          }}
        >
          Demasiado rápido. Sólo cuenta los latidos que sientes.
        </p>
      )}

      <button
        type="button"
        onClick={tapPulse}
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
        {completedRef.current ? "Listo" : "Latido"}
      </button>
    </div>
  );
}
