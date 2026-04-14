"use client";
/* ═══════════════════════════════════════════════════════════════
   TEMPORAL CHARTS — Visualizaciones temporales con recharts
   Mood trend, heatmap semanal, flujo de energía
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, Cell,
} from "recharts";

// ─── Mood Trend Area Chart ────────────────────────────────
export function MoodTrendChart({ moodLog, isDark }) {
  const data = useMemo(() => {
    if (!moodLog || moodLog.length < 2) return [];
    return moodLog.slice(-14).map((m, i) => ({
      idx: i,
      mood: m.mood,
      date: new Date(m.ts).toLocaleDateString("es", { day: "numeric", month: "short" }),
      energy: m.energy || 2,
    }));
  }, [moodLog]);

  if (data.length < 2) return null;
  const avgMood = +(data.reduce((a, d) => a + d.mood, 0) / data.length).toFixed(1);
  const color = avgMood >= 3.5 ? "#059669" : avgMood >= 2.5 ? "#D97706" : "#DC2626";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  return (
    <div style={{ width: "100%", height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: t3 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, 5]} tick={{ fontSize: 9, fill: t3 }} axisLine={false} tickLine={false} ticks={[1, 3, 5]} />
          <Tooltip
            contentStyle={{
              background: isDark ? "#1A1E28" : "#fff",
              border: `1px solid ${isDark ? "#2A2E3A" : "#E2E8F0"}`,
              borderRadius: 10, fontSize: 11, padding: "6px 10px",
            }}
            formatter={(v) => [`${v}/5`, "Estado"]}
            labelFormatter={(l) => l}
          />
          <Area
            type="monotone" dataKey="mood" stroke={color} strokeWidth={2}
            fill="url(#moodGrad)" dot={{ r: 3, fill: color, strokeWidth: 0 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Energy Flow Bar Chart ────────────────────────────────
export function EnergyFlowChart({ history, isDark, ac = "#059669" }) {
  const data = useMemo(() => {
    if (!history || history.length < 3) return [];
    const hrs = Array(24).fill(0);
    history.forEach((h) => { hrs[new Date(h.ts).getHours()]++; });
    const slots = [];
    for (let i = 6; i < 23; i++) {
      slots.push({ hour: `${i}h`, count: hrs[i], h: i });
    }
    return slots;
  }, [history]);

  if (data.length === 0) return null;
  const mx = Math.max(...data.map((d) => d.count), 1);
  const t3 = isDark ? "#4B5568" : "#94A3B8";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const peakHour = data.reduce((best, d) => d.count > best.count ? d : best, data[0]);

  return (
    <div>
      <div style={{ width: "100%", height: 70 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: t3 }} axisLine={false} tickLine={false} interval={2} />
            <Tooltip
              contentStyle={{ background: isDark ? "#1A1E28" : "#fff", border: `1px solid ${bd}`, borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [`${v} sesiones`, ""]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} animationDuration={600}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count > 0 ? ac : bd}
                  opacity={entry.count > 0 ? 0.3 + 0.7 * (entry.count / mx) : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 10, color: isDark ? "#8B95A8" : "#475569", marginTop: 6, fontStyle: "italic" }}>
        Tu hora pico: <span style={{ fontWeight: 800, color: ac }}>{peakHour.h}:00</span>. Tu sistema rinde mejor aquí.
      </div>
    </div>
  );
}

// ─── Activity Heatmap (GitHub-style) ──────────────────────
export function ActivityHeatmap({ history, isDark, ac = "#059669" }) {
  const cells = useMemo(() => {
    const now = new Date();
    const hist = history || [];
    const result = [];
    for (let d = 27; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const ds = day.toDateString();
      const count = hist.filter((h) => new Date(h.ts).toDateString() === ds).length;
      const dayName = day.toLocaleDateString("es", { weekday: "short" });
      result.push({ d, count, isToday: d === 0, dayName, dateStr: day.toLocaleDateString("es", { day: "numeric", month: "short" }) });
    }
    return result;
  }, [history]);

  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((cell) => (
          <div
            key={cell.d}
            title={`${cell.dateStr}: ${cell.count} sesiones`}
            style={{
              aspectRatio: "1", borderRadius: 4,
              background: cell.count === 0 ? (isDark ? "#1A1E28" : "#F1F5F9") :
                cell.count === 1 ? ac + "30" : cell.count === 2 ? ac + "60" : ac,
              border: cell.isToday ? `1.5px solid ${ac}` : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s",
            }}
          >
            {cell.count > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: cell.count >= 3 ? "#fff" : ac }}>
                {cell.count}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: t3 }}>4 semanas atrás</span>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 10, color: t3 }}>Menos</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? (isDark ? "#1A1E28" : "#F1F5F9") : i === 1 ? ac + "30" : i === 2 ? ac + "60" : ac }} />
          ))}
          <span style={{ fontSize: 10, color: t3 }}>Más</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Comparison Chart ──────────────────────────────
export function WeeklyChart({ weeklyData, isDark, ac = "#059669" }) {
  const DN = ["L", "M", "X", "J", "V", "S", "D"];
  const mW = Math.max(...weeklyData, 1);
  const today = ((new Date().getDay() + 6) % 7);
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  const data = weeklyData.map((v, i) => ({
    day: DN[i], sessions: v, isToday: i === today,
  }));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 50 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{
            width: "100%", borderRadius: 5,
            height: Math.max((d.sessions / mW) * 42, 2),
            background: d.isToday ? ac : bd,
            transition: "height .6s",
          }} />
          <span style={{ fontSize: 10, color: d.isToday ? ac : t3, fontWeight: d.isToday ? 800 : 600 }}>
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Coherence Sparkline (inline mini-chart) ──────────────
export function CoherenceSparkline({ history, isDark, width = 120, height = 30 }) {
  const data = useMemo(() => {
    if (!history || history.length < 2) return [];
    return history.slice(-20).map((h, i) => ({ idx: i, c: h.c || 50 }));
  }, [history]);

  if (data.length < 2) return null;
  const lastVal = data[data.length - 1].c;
  const firstVal = data[0].c;
  const color = lastVal >= firstVal ? "#059669" : "#DC2626";

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="cohGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="c" stroke={color} strokeWidth={1.5} fill="url(#cohGrad)" dot={false} animationDuration={500} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
