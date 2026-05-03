"use client";
/* ═══════════════════════════════════════════════════════════════
   ObjectAnchorPrompt — CRÍTICO EMERGENCY RESET (#18).
   Grounding 5-4-3-2-1 modificado: user escribe un objeto.
   Anti-trampa: requiere min_chars escritos.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { hap } from "../../../../lib/audio";
import { colors, typography, spacing, radii } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function ObjectAnchorPrompt({
  prompt = "Elige un objeto a tu alrededor",
  placeholder = "Ej: una taza",
  min_chars = 2,
  affirmation_template = "{value} es lo que ves",
  onComplete,
}) {
  const [value, setValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = () => {
    if (value.trim().length < min_chars || confirmed) return;
    setConfirmed(true);
    try { hap("ok"); } catch { /* noop */ }
    setTimeout(() => {
      if (typeof onComplete === "function") onComplete(value.trim());
    }, 3000);
  };

  if (confirmed) {
    const txt = affirmation_template.replace("{value}", value.trim());
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing.s24,
        paddingBlock: spacing.s48,
        textAlign: "center",
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: typography.family,
          fontWeight: typography.weight.light,
          fontSize: 28,
          color: colors.text.primary,
          letterSpacing: "-0.02em",
        }}>
          {txt}
        </h2>
      </div>
    );
  }

  const canSubmit = value.trim().length >= min_chars;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: spacing.s24,
      paddingBlock: spacing.s32,
    }}>
      <h2 style={{
        margin: 0,
        textAlign: "center",
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        fontSize: 22,
        color: colors.text.primary,
        letterSpacing: "-0.01em",
      }}>
        {prompt}
      </h2>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        autoFocus
        style={{
          appearance: "none",
          padding: "14px 20px",
          minInlineSize: 280,
          maxInlineSize: 360,
          background: "rgba(255,255,255,0.03)",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          color: colors.text.primary,
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 18,
          letterSpacing: "-0.01em",
          outline: "none",
          textAlign: "center",
        }}
      />
      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        style={{
          appearance: "none",
          cursor: canSubmit ? "pointer" : "default",
          opacity: canSubmit ? 1 : 0.35,
          padding: "12px 28px",
          background: canSubmit ? ACCENT : "rgba(34,211,238,0.18)",
          color: canSubmit ? "#08080A" : colors.text.muted,
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontWeight: typography.weight.medium,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Listo
      </button>
    </div>
  );
}
