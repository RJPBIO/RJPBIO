"use client";
import { colors, typography, spacing } from "../tokens";

// Phase 6H Premium-Fix2 — compact 3-stat row para ColdStartView phase=active.
// Pattern: "Sesiones · Racha · Próxima ventana cronotipo"
//
// Cada stat es { label (mono microCaps secondary), value (light tabular-nums),
// testid? }. Layout grid 1fr equidistante con separator vertical 0.5px entre
// columnas (pattern compartido con DimensionsRow).
//
// Cuando stats=[] o falsy → return null (no row vacío).

export default function MiniStatsRow({ stats }) {
  if (!Array.isArray(stats) || stats.length === 0) return null;

  return (
    <section
      data-v2-mini-stats-row
      aria-label="Tu progreso esta semana"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 0,
        marginBlockStart: spacing.s16,
        marginBlockEnd: spacing.s16,
      }}
    >
      {stats.map((stat, idx) => (
        <div
          key={stat.id || stat.testid || idx}
          data-v2-mini-stat={stat.id || idx}
          data-testid={stat.testid || undefined}
          style={{
            paddingBlock: spacing.s12,
            paddingInline: spacing.s8,
            textAlign: "center",
            borderInlineStart: idx > 0 ? `0.5px solid ${colors.separator}` : "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.text.muted,
              fontWeight: typography.weight.medium,
            }}
          >
            {stat.label}
          </span>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: 18,
              fontWeight: typography.weight.light,
              color: colors.text.strong,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </section>
  );
}
