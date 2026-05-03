"use client";
/* ═══════════════════════════════════════════════════════════════
   ChestPercussionPrompt — torso + ritmo táctil/visual
   Dispara vibrate + playSpark cada beat. User copia el ritmo.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { playSpark } from "../../../../lib/audio";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function ChestPercussionPrompt({
  bpm = 150,
  duration_ms = 30000,
  haptic_enabled = true,
  audio_enabled = true,
  onComplete,
}) {
  const [pulseOn, setPulseOn] = useState(false);

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  const hapticEnabledRef = useRef(haptic_enabled);
  const audioEnabledRef = useRef(audio_enabled);
  useEffect(() => { onCompleteRef.current = onComplete; });
  useEffect(() => { hapticEnabledRef.current = haptic_enabled; }, [haptic_enabled]);
  useEffect(() => { audioEnabledRef.current = audio_enabled; }, [audio_enabled]);

  useEffect(() => {
    const intervalMs = Math.max(120, 60000 / bpm);
    const id = setInterval(() => {
      setPulseOn((p) => !p);
      if (hapticEnabledRef.current && typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(35); } catch { /* noop */ }
      }
      if (audioEnabledRef.current) {
        try { playSpark(640, 0.03); } catch { /* noop */ }
      }
    }, intervalMs);
    const stopId = setTimeout(() => {
      clearInterval(id);
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    }, duration_ms);
    return () => { clearInterval(id); clearTimeout(stopId); };
  }, [bpm, duration_ms]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s24 }}>
      <svg viewBox="0 0 200 220" width="200" height="220" aria-label="Percusión torácica">
        <ellipse cx="100" cy="36" rx="20" ry="22" fill="none" stroke="rgba(245,245,247,0.32)" strokeWidth="1" />
        <path d="M 60 76 L 60 168 Q 100 188 140 168 L 140 76 Q 100 64 60 76 Z"
          fill="rgba(255,255,255,0.02)" stroke="rgba(245,245,247,0.32)" strokeWidth="1" strokeLinejoin="round" />
        <circle
          cx="100" cy="118"
          r={pulseOn ? 28 : 18}
          fill={pulseOn ? "rgba(34,211,238,0.22)" : "rgba(34,211,238,0.08)"}
          stroke={ACCENT}
          strokeWidth="0.8"
          opacity={pulseOn ? 0.9 : 0.5}
          style={{ transition: "r 80ms linear, opacity 80ms linear, fill 80ms linear" }}
        />
        <path d="M 130 90 Q 145 100 145 118 Q 145 130 134 134"
          fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 15,
        color: colors.text.primary,
      }}>
        Yemas de los dedos sobre el esternón
      </p>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 13,
        color: colors.text.muted,
      }}>
        Copia el ritmo del haptic
      </p>
    </div>
  );
}
