"use client";
/* ═══════════════════════════════════════════════════════════════
   SilenceCyanMinimal — pantalla negra con dot cyan central.
   Spacer entre actos o fase contemplativa pura.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function SilenceCyanMinimal({
  text = "",
  duration_ms = 8000,
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.s32,
      paddingBlock: spacing.s64,
      background: colors.bg.base,
    }}>
      <div
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: ACCENT,
          boxShadow: "0 0 0 4px rgba(34,211,238,0.12)",
        }}
      />
      {text && (
        <p style={{
          margin: 0,
          textAlign: "center",
          fontFamily: typography.family,
          fontWeight: typography.weight.light,
          fontSize: 14,
          color: colors.text.muted,
          maxInlineSize: 360,
        }}>
          {text}
        </p>
      )}
    </div>
  );
}
