"use client";
/* ═══════════════════════════════════════════════════════════════
   TEMPORAL CHARTS — Clinical visualizations.
   Single-channel teal. No gradients. Hairline grid. Tabular numerals.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, Cell,
} from "recharts";
import { resolveTheme, semantic } from "../lib/theme";

const TEAL = "#0F766E";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

// ─── Mood Trend — single teal line, no gradient ────────────
export function MoodTrendChart({ moodLog, isDark }) {
  const { t2, t3 } = resolveTheme(isDark);
  const gridColor = isDark ? "#232836" : "#E5E7EB";
  const bgColor = isDark ? "#141820" : "#FFFFFF";

  const data = useMemo(() => {
    if (!moodLog || moodLog.length < 2) return [];
    return moodLog.slice(-14).map((m, i) => ({
      idx: i,
      mood: m.mood,
      date: new Date(m.ts).toLocaleDateString("es", { day: "numeric", month: "short" }),
    }));
  }, [moodLog]);

  if (data.length < 2) return null;

  return (
    <div style={{ width: "100%", height: 96 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: t3, fontVariantNumeric: "tabular-nums" }}
            axisLine={false} tickLine={false} interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 5]} ticks={[1, 3, 5]}
            tick={{ fontSize: 9, fill: t3, fontVariantNumeric: "tabular-nums" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: bgColor,
              border: `0.5px solid ${gridColor}`,
              borderRadius: 4,
              fontSize: 11, padding: "6px 10px",
              color: t2, fontVariantNumeric: "tabular-nums",
            }}
            formatter={(v) => [`${v}/5`, "Mood"]}
            labelFormatter={(l) => l}
            cursor={{ stroke: gridColor, strokeWidth: 0.5 }}
          />
          <Area
            type="monotone" dataKey="mood"
            stroke={TEAL} strokeWidth={1}
            fill={TEAL} fillOpacity={0.06}
            dot={{ r: 2, fill: TEAL, strokeWidth: 0 }}
            animationDuration={280}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Energy Flow — hairline bars, opacity only ─────────────
export function EnergyFlowChart({ history, isDark, ac }) {
  const { t2, t3 } = resolveTheme(isDark);
  const gridColor = isDark ? "#232836" : "#E5E7EB";
  const bgColor = isDark ? "#141820" : "#FFFFFF";
  const teal = ac || TEAL;

  const data = useMemo(() => {
    if (!history || history.length < 3) return [];
    const hrs = Array(24).fill(0);
    history.forEach((h) => { hrs[new Date(h.ts).getHours()]++; });
    const slots = [];
    for (let i = 6; i < 23; i++) {
      slots.push({ hour: `${i}`, count: hrs[i], h: i });
    }
    return slots;
  }, [history]);

  if (data.length === 0) return null;
  const mx = Math.max(...data.map((d) => d.count), 1);
  const peakHour = data.reduce((best, d) => d.count > best.count ? d : best, data[0]);

  return (
    <div>
      <div style={{ width: "100%", height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: t3, fontVariantNumeric: "tabular-nums" }}
              axisLine={false} tickLine={false} interval={2}
            />
            <Tooltip
              contentStyle={{
                background: bgColor,
                border: `0.5px solid ${gridColor}`,
                borderRadius: 4, fontSize: 11, padding: "6px 10px",
                color: t2, fontVariantNumeric: "tabular-nums",
              }}
              formatter={(v) => [`${v} sesiones`, ""]}
              cursor={{ fill: gridColor, fillOpacity: 0.3 }}
            />
            <Bar dataKey="count" radius={[1, 1, 0, 0]} animationDuration={280}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.count > 0 ? teal : gridColor}
                  fillOpacity={entry.count > 0 ? 0.25 + 0.75 * (entry.count / mx) : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 8,
        ...MICRO, color: t3, marginTop: 10, fontVariantNumeric: "tabular-nums",
      }}>
        <span>Hora pico</span>
        <span style={{ color: teal }}>{String(peakHour.h).padStart(2, "0")}:00</span>
        <span>·</span>
        <span>Sistema óptimo</span>
      </div>
    </div>
  );
}

// ─── Activity Heatmap — monochrome teal by density ─────────
export function ActivityHeatmap({ history, isDark, ac }) {
  const { t3 } = resolveTheme(isDark);
  const gridColor = isDark ? "#232836" : "#E5E7EB";
  const surfaceColor = isDark ? "#0F131A" : "#F2F4F7";
  const teal = ac || TEAL;

  const cells = useMemo(() => {
    const now = new Date();
    const hist = history || [];
    const result = [];
    for (let d = 27; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const ds = day.toDateString();
      const count = hist.filter((h) => new Date(h.ts).toDateString() === ds).length;
      result.push({
        d, count,
        isToday: d === 0,
        dateStr: day.toLocaleDateString("es", { day: "numeric", month: "short" }),
      });
    }
    return result;
  }, [history]);

  const levelFill = (n) => {
    if (n === 0) return surfaceColor;
    if (n === 1) return `${teal}33`;
    if (n === 2) return `${teal}66`;
    return teal;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {cells.map((cell) => (
          <div
            key={cell.d}
            title={`${cell.dateStr}: ${cell.count} sesiones`}
            style={{
              aspectRatio: "1", borderRadius: 2,
              background: levelFill(cell.count),
              border: cell.isToday ? `1px solid ${teal}` : `0.5px solid ${gridColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .28s ease-out",
            }}
          >
            {cell.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: cell.count >= 3 ? "#FFFFFF" : teal,
                fontVariantNumeric: "tabular-nums",
              }}>
                {cell.count}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 12, ...MICRO, color: t3, fontVariantNumeric: "tabular-nums",
      }}>
        <span>28 días</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Menos</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: 2,
              background: levelFill(i),
              border: i === 0 ? `0.5px solid ${gridColor}` : "none",
            }} />
          ))}
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Bars — teal when active day, hairline else ────
export function WeeklyChart({ weeklyData, isDark, ac }) {
  const { t3 } = resolveTheme(isDark);
  const gridColor = isDark ? "#232836" : "#E5E7EB";
  const teal = ac || TEAL;
  const DN = ["L", "M", "X", "J", "V", "S", "D"];
  const mW = Math.max(...weeklyData, 1);
  const today = ((new Date().getDay() + 6) % 7);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
      {weeklyData.map((v, i) => {
        const isToday = i === today;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: "100%", borderRadius: 1,
              height: Math.max((v / mW) * 42, 1),
              background: isToday ? teal : gridColor,
              transition: "height .28s ease-out",
            }} />
            <span style={{
              ...MICRO, color: isToday ? teal : t3,
              fontVariantNumeric: "tabular-nums",
            }}>
              {DN[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Coherence Sparkline — single thin teal line ──────────
export function CoherenceSparkline({ history, isDark, width = 120, height = 28 }) {
  const data = useMemo(() => {
    if (!history || history.length < 2) return [];
    return history.slice(-20).map((h, i) => ({ idx: i, c: h.c || 50 }));
  }, [history]);

  if (data.length < 2) return null;
  const lastVal = data[data.length - 1].c;
  const firstVal = data[0].c;
  const color = lastVal >= firstVal ? TEAL : semantic.danger;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Area
            type="monotone" dataKey="c"
            stroke={color} strokeWidth={1}
            fill={color} fillOpacity={0.06}
            dot={false}
            animationDuration={280}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
