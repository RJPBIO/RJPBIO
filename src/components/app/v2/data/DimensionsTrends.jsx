"use client";
import { colors, typography, spacing, motion as motionTok } from "../tokens";
import Sparkline from "./Sparkline";

// 3 mini-charts apilados: FOCO / CALMA / ENERGIA con sparkline 32px.
// Color sparkline rgba(255,255,255,0.32) — cyan reservado para acentos.

const NEUTRAL = "rgba(255,255,255,0.32)";

export default function DimensionsTrends({ data, onSelect }) {
  if (!data) return null;
  const items = [
    { id: "foco",    label: "FOCO",    series: data.focus  },
    { id: "calma",   label: "CALMA",   series: data.calm   },
    { id: "energia", label: "ENERGÍA", series: data.energy },
  ];

  return (
    <section
      data-v2-dimensions-trends
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
        DIMENSIONES · 28 DÍAS
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.s16 }}>
        {items.map((it) => {
          const series = it.series || [];
          const current = series.length ? Number(series[series.length - 1].value) : 0;
          const last7 = series.slice(-7);
          const prev7 = series.slice(-14, -7);
          const avg = (arr) => arr.length ? arr.reduce((a, b) => a + Number(b.value), 0) / arr.length : 0;
          const delta = Math.round(avg(last7) - avg(prev7));
          const deltaSign = delta > 0 ? "+" : delta < 0 ? "-" : "";
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelect && onSelect(it.id)}
              data-v2-trend={it.id}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                color: "inherit",
                display: "grid",
                gridTemplateColumns: "auto auto 1fr auto",
                alignItems: "center",
                gap: spacing.s16,
                padding: 0,
                cursor: "pointer",
                transition: `opacity ${motionTok.duration.tap}ms ${motionTok.ease.out}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.95"; }}
            >
              <span
                style={{
                  fontFamily: typography.familyMono,
                  fontSize: typography.size.microCaps,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: typography.weight.medium,
                  minWidth: 64,
                }}
              >
                {it.label}
              </span>
              <span
                style={{
                  fontFamily: typography.family,
                  fontSize: typography.size.subtitleMin,
                  fontWeight: typography.weight.regular,
                  color: "rgba(255,255,255,0.96)",
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 44,
                }}
              >
                {Math.round(current)}%
              </span>
              <span style={{ display: "block", height: 32, minWidth: 60 }}>
                <Sparkline data={series} height={32} strokeColor={NEUTRAL} strokeWidth={1.5} />
              </span>
              <span
                style={{
                  fontFamily: typography.familyMono,
                  fontSize: typography.size.microCaps,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: typography.weight.regular,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "end",
                }}
              >
                {deltaSign}{Math.abs(delta)} vs sem ant
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
