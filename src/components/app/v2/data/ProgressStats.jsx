"use client";
import { colors, typography, spacing } from "../tokens";

// 3 stats: V-Cores / Streak / Achievements. Sin alarmas, sin barras a "siguiente nivel".

export default function ProgressStats({
  vCores = 0,
  vCoresThisWeek = 0,
  streak = 0,
  bestStreak = 0,
  achievementsCount = 0,
  achievementsThisMonth = 0,
}) {
  const items = [
    {
      value: formatThousands(vCores),
      label: "V-CORES",
      sub: `+${vCoresThisWeek} esta semana`,
    },
    {
      value: String(streak),
      label: "DÍAS · RACHA ACTUAL",
      sub: `Mejor: ${bestStreak} días`,
    },
    {
      value: String(achievementsCount),
      label: "LOGROS",
      sub: achievementsThisMonth > 0
        ? `+${achievementsThisMonth} este mes`
        : "Sin nuevos este mes",
    },
  ];

  return (
    <section
      data-v2-progress-stats
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
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s24,
        }}
      >
        PROGRESO
      </div>

      <div
        style={{
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
              paddingInline: spacing.s8,
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
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.3,
                textAlign: "center",
              }}
            >
              {it.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatThousands(n) {
  return Number(n).toLocaleString("es-MX");
}
