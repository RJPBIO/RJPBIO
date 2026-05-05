"use client";
/* WellbeingSparkline — Phase 6F SP-F
   Step-line client component que mapea level histórico a numeric:
     ok=0, watch=1, warn=2, alert=3
   Recharts client-only (Decision SP-D Opción B locked: server page query
   directo a BurnoutScore.findMany pasa el array via prop).
   Tema bio: stroke cyan, axis muted, dots cyan filled. */

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { colors, typography, spacing, radii, surfaces, withAlpha } from "../tokens";

const LEVEL_NUMERIC = { ok: 0, watch: 1, warn: 2, alert: 3 };
const LEVEL_LABELS = ["ok", "watch", "warn", "alert"];

export default function WellbeingSparkline({ history = [] }) {
  const safeHistory = Array.isArray(history) ? history : [];

  // Filter+sort PRIMERO; después check length. Antes el length-check pasaba
  // arrays con N≥2 pero entries con shape inválido (level desconocido o
  // computedAt no parseable) → chartData quedaba en 0 entries y el chart
  // se renderizaba vacío en lugar de mostrar placeholder.
  const chartData = safeHistory
    .map((h) => {
      const ts = h?.computedAt instanceof Date ? h.computedAt.getTime() : Date.parse(h?.computedAt);
      if (!Number.isFinite(ts)) return null;
      const numericLevel = LEVEL_NUMERIC[h.level];
      if (typeof numericLevel !== "number") return null;
      return {
        ts,
        date: formatDateShort(new Date(ts)),
        level: numericLevel,
        levelLabel: h.level,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  if (chartData.length < 2) {
    return (
      <article
        data-v2-wellbeing-sparkline
        data-empty="true"
        style={{
          background: colors.bg.raised,
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          padding: spacing.s16,
          minHeight: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{
          margin: 0,
          fontFamily: typography.family,
          fontSize: typography.size.bodyMin,
          color: colors.text.muted,
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          Necesitas más historial para mostrar tu trayectoria de wellbeing. Continúa
          usando Bio-Ignición y esta visualización aparecerá automáticamente.
        </p>
      </article>
    );
  }

  return (
    <article
      data-v2-wellbeing-sparkline
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: spacing.s16,
        height: 200,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(245,245,247,0.5)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            tickFormatter={(v) => LEVEL_LABELS[v] || ""}
            tick={{ fontSize: 9, fill: "rgba(245,245,247,0.5)" }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          {/* Reference line at warn boundary (level 2) — visual cue */}
          <ReferenceLine
            y={2}
            stroke={withAlpha(colors.semantic.warningRgb, 40)}
            strokeDasharray="3 3"
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
            contentStyle={{
              background: "rgba(8,8,10,0.95)",
              border: `0.5px solid ${colors.separator}`,
              fontSize: 11,
              padding: "6px 10px",
              borderRadius: 6,
            }}
            labelStyle={{ color: "rgba(245,245,247,0.8)" }}
            formatter={(_value, _name, ctx) => [ctx.payload?.levelLabel || "", "Nivel"]}
          />
          <Line
            type="step"
            dataKey="level"
            stroke={colors.accent.phosphorCyan}
            strokeWidth={1.5}
            dot={{ r: 3, fill: colors.accent.phosphorCyan, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </article>
  );
}

function formatDateShort(d) {
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
