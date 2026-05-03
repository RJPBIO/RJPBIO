"use client";
import { colors, typography, spacing } from "../tokens";

export default function StatsHighlights({ totalSessions = 0, streak = 0, achievementsCount = 0 }) {
  const items = [
    { value: totalSessions, label: "SESIONES TOTALES" },
    { value: streak,        label: "DÍAS · RACHA" },
    { value: achievementsCount, label: "LOGROS" },
  ];
  return (
    <section
      data-v2-stats-highlights
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            paddingBlock: spacing.s8,
            borderInlineStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
          }}
        >
          <span
            style={{
              fontFamily: typography.family,
              fontSize: 32,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.96)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {it.value}
          </span>
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              fontWeight: typography.weight.medium,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {it.label}
          </span>
        </div>
      ))}
    </section>
  );
}
