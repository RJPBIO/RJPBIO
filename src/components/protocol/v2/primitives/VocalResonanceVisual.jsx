"use client";
/* ═══════════════════════════════════════════════════════════════
   VocalResonanceVisual — para #22 Vagal Hum.
   Silueta de cabeza + 3 anillos concéntricos cyan que pulsan a
   frecuencia humming (~5Hz) durante el hum activo. Counter "Hum 1/4".
   Anti-trampa: tap "Hum hecho" después de cada vocalización.
   Patrón ref-based: callbacks en refs, deps estables.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { playChord } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function VocalResonanceVisual({
  target_hums = 4,
  hum_duration_ms = 8000,
  haptic_enabled = true,
  audio_enabled = true,
  onHumComplete,
  onComplete,
}) {
  const [done, setDone] = useState(0);
  const [humming, setHumming] = useState(false);
  const [waveT, setWaveT] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const onHumCompleteRef = useRef(onHumComplete);
  const completedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onHumCompleteRef.current = onHumComplete; }, [onHumComplete]);

  useEffect(() => {
    if (!humming) return undefined;
    let raf;
    function tick() {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      // ~5Hz = 0.005 rad/ms × 2π → use 0.03 rad/ms for smoother visual
      setWaveT(now / 60);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [humming]);

  function startHum() {
    if (completedRef.current || humming) return;
    setHumming(true);
    if (haptic_enabled && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(800); } catch { /* noop */ }
    }
  }

  function finishHum() {
    if (!humming) return;
    setHumming(false);
    if (audio_enabled) {
      try { playChord([220, 165], 0.5, 0.04); } catch { /* noop */ }
    }
    setDone((d) => {
      const next = d + 1;
      if (typeof onHumCompleteRef.current === "function") onHumCompleteRef.current(next);
      if (next >= target_hums && !completedRef.current) {
        completedRef.current = true;
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      }
      return next;
    });
  }

  // Anillos concéntricos: 3 ondas que escalan + fadean a frecuencia humming.
  // r0 = 38, r1 = 56, r2 = 74 (base) + ±6 según seno
  const ringR = (base, phaseOffset) => base + (humming ? Math.sin(waveT + phaseOffset) * 6 : 0);
  const ringOpacity = (phaseOffset) => {
    if (!humming) return 0.18;
    const v = (Math.sin(waveT + phaseOffset) + 1) / 2;
    return 0.22 + v * 0.55;
  };

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
      <svg viewBox="0 0 180 180" width="180" height="180" aria-label="Resonancia vocal">
        {/* Anillos concéntricos */}
        <circle cx="90" cy="100" r={ringR(72, 0)}
          fill="none" stroke={ACCENT} strokeWidth="0.8" opacity={ringOpacity(0)} />
        <circle cx="90" cy="100" r={ringR(54, 1.0)}
          fill="none" stroke={ACCENT} strokeWidth="0.8" opacity={ringOpacity(1.0)} />
        <circle cx="90" cy="100" r={ringR(36, 2.0)}
          fill="none" stroke={ACCENT} strokeWidth="0.8" opacity={ringOpacity(2.0)} />
        {/* Silueta de cabeza (ovalada) + cuello */}
        <ellipse cx="90" cy="92" rx="28" ry="36"
          fill="none" stroke="rgba(245,245,247,0.42)" strokeWidth="1.2" />
        <line x1="78" y1="128" x2="78" y2="148"
          stroke="rgba(245,245,247,0.42)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="102" y1="128" x2="102" y2="148"
          stroke="rgba(245,245,247,0.42)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Garganta (zona de resonancia, highlight si humming) */}
        <line x1="78" y1="138" x2="102" y2="138"
          stroke={humming ? ACCENT : "rgba(245,245,247,0.42)"}
          strokeWidth={humming ? 1.6 : 1.0} strokeLinecap="round" />
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
        Hum sostenido
      </h3>
      <p style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 14,
        color: colors.text.muted,
      }}>
        Boca cerrada. Vibra mejillas y nariz.
      </p>
      <p
        data-testid="hum-counter"
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
        Hum {Math.min(done, target_hums)} / {target_hums}
      </p>
      <button
        type="button"
        onClick={humming ? finishHum : startHum}
        disabled={completedRef.current}
        style={{
          appearance: "none",
          cursor: completedRef.current ? "default" : "pointer",
          padding: "14px 28px",
          minBlockSize: 44,
          minInlineSize: 44,
          background: humming ? "rgba(34,211,238,0.18)" : ACCENT,
          color: humming ? ACCENT : "#08080A",
          border: humming ? `0.5px solid ${ACCENT}` : "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {completedRef.current ? "Hecho" : humming ? "Hum hecho" : "Empezar hum"}
      </button>
    </div>
  );
}
