"use client";
import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

const RANGES = [
  { id: 7, label: "7d" },
  { id: 14, label: "14d" },
  { id: 30, label: "30d" },
  { id: 0, label: "Todo" },
];

const METRICS = [
  { id: "mood", label: "Mood", max: 5 },
  { id: "energy", label: "Energía", max: 4 },
  { id: "focus", label: "Enfoque", max: 100 },
  { id: "calm", label: "Calma", max: 100 },
];

export function TimeSeriesChart({ moodLog, history, isDark, ac, t1, t2, t3, bd }) {
  const [range, setRange] = useState(14);
  const [metric, setMetric] = useState("mood");

  const data = useMemo(() => {
    const ml = moodLog || [];
    const filtered = range === 0 ? ml : ml.filter(m => Date.now() - m.ts < range * 86400000);
    return filtered.map(m => ({
      ts: m.ts,
      label: new Date(m.ts).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" }),
      mood: m.mood || 0,
      energy: m.energy || 0,
      focus: m.focus || (m.mood || 0) * 20,
      calm: m.calm || (m.mood || 0) * 20,
    }));
  }, [moodLog, range]);

  const cur = METRICS.find(m => m.id === metric);
  const avg = data.length ? data.reduce((a, d) => a + d[metric], 0) / data.length : 0;
  const trend = data.length >= 2 ? (data[data.length - 1][metric] - data[0][metric]) : 0;
  const trendLabel = trend > 0.3 ? "ascendente" : trend < -0.3 ? "descendente" : "estable";
  const trendColor = trend > 0.3 ? "#10B981" : trend < -0.3 ? "#DC2626" : t2;

  return (
    <div style={{ background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 18, padding: "16px 14px", marginBottom: 14, border: "1px solid " + bd, animation: "fi .5s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t1, letterSpacing: 1.5, textTransform: "uppercase" }}>Evolución Temporal</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>tendencia: <span style={{ color: trendColor, fontWeight: 700 }}>{trendLabel}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: ac, lineHeight: 1 }}>{avg.toFixed(1)}</div>
          <div style={{ fontSize: 9, color: t3 }}>promedio</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: metric === m.id ? `1.5px solid ${ac}` : `1px solid ${bd}`, background: metric === m.id ? ac + "10" : "transparent", color: metric === m.id ? ac : t3, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
          >{m.label}</button>
        ))}
      </div>

      {data.length < 2 ? (
        <div style={{ padding: "30px 14px", textAlign: "center", color: t3, fontSize: 11 }}>Necesitas al menos 2 registros en este rango.</div>
      ) : (
        <div style={{ width: "100%", height: 180, animation: "chartDraw .8s ease" }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 6, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="tsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ac} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={ac} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#CBD5E1"} strokeOpacity={0.25} />
              <XAxis dataKey="label" tick={{ fill: t3, fontSize: 9 }} stroke={t3} />
              <YAxis domain={[0, cur.max]} tick={{ fill: t3, fontSize: 9 }} stroke={t3} />
              <Tooltip
                contentStyle={{ background: isDark ? "#0C1017" : "#FFFFFF", border: "1px solid " + bd, borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: t1, fontWeight: 700 }}
                itemStyle={{ color: ac }}
              />
              <ReferenceLine y={avg} stroke={t3} strokeDasharray="3 3" />
              <Area type="monotone" dataKey={metric} stroke={ac} strokeWidth={2} fill="url(#tsg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {RANGES.map(r => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: range === r.id ? `1.5px solid ${ac}` : `1px solid ${bd}`, background: range === r.id ? ac + "10" : "transparent", color: range === r.id ? ac : t3, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
          >{r.label}</button>
        ))}
      </div>
    </div>
  );
}
