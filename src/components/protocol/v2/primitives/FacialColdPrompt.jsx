"use client";
/* ═══════════════════════════════════════════════════════════════
   FacialColdPrompt — CRÍTICO PANIC INTERRUPT
   Dive reflex prompt. Botón "Listo" oculto hasta min_duration.
   TTS automatic ON (override crisis).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { speakNow } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function FacialColdPrompt({
  min_duration_ms = 25000,
  voice_text = "Agua fría en la cara. Frente, mejillas, ojos. Sostén treinta segundos.",
  onCompleted,
}) {
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (!spokenRef.current) {
      spokenRef.current = true;
      try { speakNow(voice_text, undefined, true, "es"); } catch { /* noop */ }
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    const tid = setTimeout(() => setReady(true), min_duration_ms);
    return () => { clearInterval(id); clearTimeout(tid); };
  }, [min_duration_ms, voice_text]);

  const handleDone = () => {
    if (!ready) return;
    if (typeof onCompleted === "function") onCompleted();
  };

  const remainingSec = Math.max(0, Math.ceil((min_duration_ms - elapsed) / 1000));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.s32,
      paddingBlock: spacing.s48,
      textAlign: "center",
    }}>
      <h2 style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 28,
        letterSpacing: "-0.01em",
        color: colors.text.primary,
        lineHeight: 1.2,
      }}>
        Agua fría en la cara
      </h2>
      <p style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 16,
        color: colors.text.secondary,
        maxInlineSize: 320,
      }}>
        Frente, mejillas, ojos. 30 segundos.
      </p>
      <button
        type="button"
        disabled={!ready}
        onClick={handleDone}
        style={{
          appearance: "none",
          cursor: ready ? "pointer" : "default",
          opacity: ready ? 1 : 0.35,
          padding: "14px 28px",
          background: ready ? ACCENT : "rgba(34,211,238,0.18)",
          color: ready ? "#08080A" : colors.text.muted,
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 14,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          transition: "opacity 200ms linear, background 200ms linear",
        }}
      >
        {ready ? "Listo, frío aplicado" : `${remainingSec}s`}
      </button>
    </div>
  );
}
