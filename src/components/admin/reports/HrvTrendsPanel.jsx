"use client";
/* HrvTrendsPanel — Phase 6F SP-D
   RMSSD weekly trends. Suppressed weeks (k<5 unique users) muestran gap.
   Recharts client-side con tema bio (line cyan, axis muted). */

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

export default function HrvTrendsPanel({ hrv }) {
  if (!hrv || !Array.isArray(hrv.trend)) {
    return null;
  }

  const validWeeks = hrv.trend.filter((w) => !w.suppressed && Number.isFinite(w.value));
  const totalWeeks = hrv.trend.length;
  const suppressedCount = hrv.trend.filter((w) => w.suppressed).length;

  // Mean RMSSD across non-suppressed weeks (display-only KPI)
  const meanValue = validWeeks.length
    ? validWeeks.reduce((s, w) => s + w.value, 0) / validWeeks.length
    : null;

  if (validWeeks.length < 2) {
    return (
      <section
        data-v2-hrv-trends
        data-suppressed="true"
        style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
      >
        <SectionHeader
          eyebrow="Biometría neural · HRV"
          italic="Variabilidad cardíaca."
          title="Sin muestra suficiente"
          subtitle="Se requieren mínimo 5 personas únicas con HRV por semana"
        />
        <p style={{
          color: cssVar.textMuted,
          fontSize: font.size.sm,
        }}>
          {suppressedCount} de {totalWeeks} semanas suprimidas por k-anonimato.
        </p>
      </section>
    );
  }

  // Recharts data: usa week index + iso date (string para axis legible)
  const chartData = validWeeks.map((w) => ({
    week: w.week,
    label: formatWeekLabel(w.date),
    value: w.value,
    n: w.n,
  }));

  return (
    <section
      data-v2-hrv-trends
      style={{ marginBlockStart: space[6], marginBlockEnd: space[5] }}
    >
      <SectionHeader
        eyebrow="Biometría neural · HRV"
        italic="Variabilidad cardíaca."
        title={meanValue != null ? `RMSSD medio: ${meanValue.toFixed(1)} ms` : "Tendencia"}
        subtitle={`Evolución semanal · k-anon ≥ 5 usuarios únicos · ${validWeeks.length}/${totalWeeks} semanas con muestra`}
      />
      <article
        data-v2-hrv-chart
        style={{
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          padding: space[4],
          height: 240,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--bi-text-muted)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--bi-text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ stroke: "var(--bi-border)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--bi-surface-2)",
                border: `1px solid var(--bi-border)`,
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 6,
              }}
              formatter={(value, _name, ctx) => [
                `${value} ms`,
                `RMSSD (n=${ctx.payload?.n || "?"})`,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={bioSignal.phosphorCyan}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </article>
    </section>
  );
}

function formatWeekLabel(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
