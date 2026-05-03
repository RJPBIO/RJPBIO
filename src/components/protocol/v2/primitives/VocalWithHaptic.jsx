"use client";
/* ═══════════════════════════════════════════════════════════════
   VocalWithHaptic — vocalización con resonancia torácica
   Counter visible "1 de 3". User confirma con tap "Hecho" después
   de cada exhalación. vibrate(800) al inicio, playChord al cierre.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { playChord } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function VocalWithHaptic({
  target_vocalizations = 3,
  vocalization_duration_ms = 6000,
  haptic_enabled = true,
  audio_enabled = true,
  onComplete,
}) {
  const [done, setDone] = useState(0);
  const [vocalizing, setVocalizing] = useState(false);
  const [waveT, setWaveT] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!vocalizing) return undefined;
    let raf;
    function tick() {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      setWaveT(now / 200);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [vocalizing]);

  const startVocalization = () => {
    if (completedRef.current || vocalizing) return;
    setVocalizing(true);
    if (haptic_enabled && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(800); } catch { /* noop */ }
    }
  };

  const finishVocalization = () => {
    if (!vocalizing) return;
    setVocalizing(false);
    if (audio_enabled) {
      try { playChord([220, 165], 0.5, 0.04); } catch { /* noop */ }
    }
    setDone((d) => {
      const next = d + 1;
      if (next >= target_vocalizations && !completedRef.current) {
        completedRef.current = true;
        if (typeof onComplete === "function") onComplete();
      }
      return next;
    });
  };

  const wavePath = Array.from({ length: 60 }, (_, i) => {
    const x = i * (240 / 59);
    const amp = vocalizing ? 18 : 4;
    const y = 40 + Math.sin(i * 0.4 + waveT) * amp * (0.5 + 0.5 * Math.sin(i / 12));
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s24 }}>
      <svg viewBox="0 0 240 80" width="240" height="80" aria-label="Onda vocal">
        <path d={wavePath} fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <h3 style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 22,
        color: colors.text.primary,
        letterSpacing: "-0.01em",
      }}>
        Exhala con sonido grave: aaaaah
      </h3>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 14,
        color: colors.text.muted,
      }}>
        Que vibre en tu pecho
      </p>
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
        {Math.min(done, target_vocalizations)} de {target_vocalizations}
      </p>
      <button
        type="button"
        onClick={vocalizing ? finishVocalization : startVocalization}
        disabled={completedRef.current}
        style={{
          appearance: "none",
          cursor: completedRef.current ? "default" : "pointer",
          padding: "14px 28px",
          background: vocalizing ? "rgba(34,211,238,0.18)" : ACCENT,
          color: vocalizing ? ACCENT : "#08080A",
          border: vocalizing ? `0.5px solid ${ACCENT}` : "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {completedRef.current ? "Hecho" : vocalizing ? "Hecho" : "Empezar"}
      </button>
    </div>
  );
}
