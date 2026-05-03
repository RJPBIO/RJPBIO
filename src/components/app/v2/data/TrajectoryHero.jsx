"use client";
import { colors, typography, spacing } from "../tokens";
import Sparkline from "./Sparkline";

// Hero "ULTIMOS 28 DIAS": kicker + sparkline 120px + 2 stats con separador.

export default function TrajectoryHero({ data = [], previousAvg = null }) {
  const values = data.map(d => Number(d.value) || 0);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const recentWeek = values.slice(-7);
  const prevWeek = values.slice(-14, -7);
  const wAvg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const delta = recentWeek.length && prevWeek.length
    ? wAvg(recentWeek) - wAvg(prevWeek)
    : (previousAvg != null ? avg - previousAvg : 0);

  const deltaSign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  const deltaAbs = Math.abs(delta);
  const deltaColor = delta > 0 ? colors.accent.phosphorCyan : "rgba(255,255,255,0.55)";

  return (
    <section
      data-v2-trajectory-hero
      style={{
        paddingInline: spacing.s24,
        paddingBlockEnd: spacing.s32,
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
          marginBlockEnd: spacing.s16,
        }}
      >
        ÚLTIMOS 28 DÍAS
      </div>

      <div style={{ marginBlockEnd: spacing.s24 }}>
        <Sparkline
          data={data}
          height={120}
          strokeColor={colors.accent.phosphorCyan}
          strokeWidth={1.5}
          showMarkers={true}
          ariaLabel="Trayectoria de tu sistema en los últimos 28 días"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <Stat value={avg} label="PROMEDIO" />
        <Stat
          value={`${deltaSign}${deltaAbs}`}
          label="VS SEMANA ANTERIOR"
          color={deltaColor}
          leftSeparator
        />
      </div>
    </section>
  );
}

function Stat({ value, label, color = "rgba(255,255,255,0.96)", leftSeparator = false }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        paddingBlock: spacing.s8,
        borderInlineStart: leftSeparator ? `0.5px solid ${colors.separator}` : "none",
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 32,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
    </div>
  );
}
