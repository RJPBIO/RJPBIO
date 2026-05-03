"use client";
/* ═══════════════════════════════════════════════════════════════
   VisualPanoramicPrompt — pantalla casi vacía, instrucción.
   Validación: timing-based min_duration solamente.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

export default function VisualPanoramicPrompt({
  duration_ms = 30000,
  text = "Mira lo más lejos posible",
  subtext = "Ventana, pasillo, horizonte",
  onComplete,
}) {
  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    }, duration_ms);
    return () => clearTimeout(id);
  }, [duration_ms]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s16,
        paddingBlock: spacing.s64,
        textAlign: "center",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.light,
          fontSize: 28,
          letterSpacing: "-0.02em",
          color: colors.text.primary,
          lineHeight: 1.15,
        }}
      >
        {text}
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 14,
          color: colors.text.muted,
        }}
      >
        {subtext}
      </p>
    </div>
  );
}
