"use client";
import { colors, typography, spacing, radii } from "../tokens";

export default function WeeklySummaryCard({ summary, onExport }) {
  if (!summary || !summary.text) return null;
  return (
    <section
      data-v2-weekly-summary
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.accent.phosphorCyan,
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s16,
        }}
      >
        TU RESUMEN · SEMANA {summary.week}
      </div>

      <article
        style={{
          background: "transparent",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panelLg,
          padding: spacing.s24,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.6,
          }}
        >
          {summary.text}
        </p>
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.s16,
            marginBlockStart: spacing.s24,
          }}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
              fontWeight: typography.weight.medium,
            }}
          >
            GENERADO LUNES 14:00
          </span>
          <button
            type="button"
            onClick={onExport}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: typography.weight.medium,
              padding: 0,
            }}
          >
            EXPORTAR →
          </button>
        </footer>
      </article>
    </section>
  );
}
