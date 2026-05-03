"use client";
import { colors, typography, spacing } from "../tokens";
import { SUGGESTED_PROMPTS } from "./fixtures";

export default function EmptyState({ onPick }) {
  return (
    <div
      data-v2-coach-empty
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: spacing.s24,
      }}
    >
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.4,
        }}
      >
        ¿Qué te ronda la mente hoy?
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 10,
          overflowX: "auto",
          width: "100%",
          paddingBlockEnd: 4,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick && onPick(p)}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "10px 16px",
              background: colors.bg.raised,
              border: `0.5px solid ${colors.separator}`,
              borderRadius: 999,
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: "rgba(255,255,255,0.72)",
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.06em",
              fontWeight: typography.weight.medium,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
