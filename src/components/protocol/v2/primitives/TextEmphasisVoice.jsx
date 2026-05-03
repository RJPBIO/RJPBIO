"use client";
/* ═══════════════════════════════════════════════════════════════
   TextEmphasisVoice — texto grande centrado, opcional TTS.
   Default voice OFF. Opt-in vía prop voice_enabled.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { speak } from "../../../../lib/audio";
import { colors, typography, spacing } from "../../../app/v2/tokens";

export default function TextEmphasisVoice({
  text = "",
  subtext = "",
  voice_enabled = false,
  locale = "es",
  min_duration_ms = 6000,
  onComplete,
}) {
  const spokenRef = useRef(false);

  useEffect(() => {
    if (voice_enabled && !spokenRef.current && text) {
      spokenRef.current = true;
      try { speak(text, undefined, true, locale); } catch { /* noop */ }
    }
  }, [voice_enabled, text, locale]);

  // Quick fix post-SP5 — ref pattern.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  useEffect(() => {
    const id = setTimeout(() => {
      if (typeof onCompleteRef.current === "function") onCompleteRef.current();
    }, min_duration_ms);
    return () => clearTimeout(id);
  }, [min_duration_ms]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.s24,
      paddingBlock: spacing.s48,
      textAlign: "center",
    }}>
      <h2 style={{
        margin: 0,
        fontFamily: typography.family,
        fontWeight: typography.weight.light,
        fontSize: 32,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: colors.text.primary,
        maxInlineSize: 560,
      }}>
        {text}
      </h2>
      {subtext && (
        <p style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 16,
          color: colors.text.muted,
          maxInlineSize: 440,
        }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
