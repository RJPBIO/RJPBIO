"use client";
/* ═══════════════════════════════════════════════════════════════
   WEEKLY REPORT — Clinical 7-day comparison.
   Hairline bars. No gradients. Delta in tabular-nums.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DN } from "../lib/constants";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

export default function WeeklyReport({ st, isDark }) {
  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";
  const divider = isDark ? "#232836" : "#E5E7EB";

  const report = useMemo(() => {
    const curr = st.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    const prev = st.prevWeekData || [0, 0, 0, 0, 0, 0, 0];
    const currTotal = curr.reduce((a, b) => a + b, 0);
    const prevTotal = prev.reduce((a, b) => a + b, 0);
    const diff = currTotal - prevTotal;
    const activeDaysCurr = curr.filter((v) => v > 0).length;

    const ml = st.moodLog || [];
    const weekMoods = ml.filter((m) => Date.now() - m.ts < 7 * 86400000);
    const prevWeekMoods = ml.filter((m) => Date.now() - m.ts >= 7 * 86400000 && Date.now() - m.ts < 14 * 86400000);
    const moodAvg = weekMoods.length ? +(weekMoods.reduce((a, m) => a + m.mood, 0) / weekMoods.length).toFixed(1) : 0;
    const prevMoodAvg = prevWeekMoods.length ? +(prevWeekMoods.reduce((a, m) => a + m.mood, 0) / prevWeekMoods.length).toFixed(1) : 0;
    const moodDelta = moodAvg && prevMoodAvg ? +(moodAvg - prevMoodAvg).toFixed(1) : 0;

    const hist = st.history || [];
    const weekHist = hist.filter((h) => Date.now() - h.ts < 7 * 86400000);
    const prevWeekHist = hist.filter((h) => Date.now() - h.ts >= 7 * 86400000 && Date.now() - h.ts < 14 * 86400000);
    const avgC = weekHist.length ? Math.round(weekHist.reduce((a, h) => a + (h.c || 50), 0) / weekHist.length) : 0;
    const prevAvgC = prevWeekHist.length ? Math.round(prevWeekHist.reduce((a, h) => a + (h.c || 50), 0) / prevWeekHist.length) : 0;

    return {
      curr, prev, currTotal, prevTotal, diff, activeDaysCurr,
      moodAvg, moodDelta, avgC, cohDelta: avgC && prevAvgC ? avgC - prevAvgC : 0,
      hasPrev: prevTotal > 0,
    };
  }, [st.weeklyData, st.prevWeekData, st.moodLog, st.history]);

  if (!report.hasPrev && report.currTotal === 0) return null;

  const maxVal = Math.max(...report.curr, ...report.prev, 1);
  const diffColor = report.diff >= 0 ? teal : semantic.danger;

  return (
    <div style={{
      background: isDark ? "#141820" : "#FFFFFF",
      borderRadius: radius.lg,
      border: hairline(isDark),
      marginBottom: 14,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: hairline(isDark),
      }}>
        <span style={{ ...CAPS, color: t3 }}>Reporte Semanal</span>
        {report.hasPrev && (
          <span style={{ fontSize: 14, fontWeight: 300, color: diffColor, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
            {report.diff >= 0 ? "+" : ""}{report.diff}
            <span style={{ ...CAPS, color: t3, marginLeft: 6, fontSize: 9 }}>Δ</span>
          </span>
        )}
      </div>

      {/* Bar chart — hairline bars, two-channel comparison */}
      <div style={{
        padding: "20px 20px 14px",
        borderBottom: hairline(isDark),
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 70, marginBottom: 10 }}>
          {DN.map((d, i) => {
            const currH = Math.max(2, (report.curr[i] / maxVal) * 60);
            const prevH = Math.max(2, (report.prev[i] / maxVal) * 60);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
                  {report.hasPrev && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: prevH }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                      style={{ width: 4, background: divider }}
                    />
                  )}
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: currH }}
                    transition={{ delay: i * 0.04 + 0.08, duration: 0.4 }}
                    style={{ width: 6, background: report.curr[i] > 0 ? teal : divider }}
                  />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: report.curr[i] > 0 ? t2 : t3,
                }}>
                  {d}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {report.hasPrev && (
          <div style={{ display: "flex", justifyContent: "center", gap: 24, paddingTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 2, background: teal }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>
                Actual · {report.currTotal}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 2, background: divider }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>
                Anterior · {report.prevTotal}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics row — hairline columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div style={{ padding: "14px 12px" }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Días activos</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: teal, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {report.activeDaysCurr}<span style={{ fontSize: 11, color: t3 }}>/7</span>
          </div>
        </div>
        {report.moodAvg > 0 && (
          <div style={{ padding: "14px 12px", borderLeft: hairline(isDark) }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Mood · prom</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 300, color: t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{report.moodAvg}</span>
              {report.moodDelta !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 500, color: report.moodDelta > 0 ? teal : semantic.danger }}>
                  {report.moodDelta > 0 ? "+" : ""}{report.moodDelta}
                </span>
              )}
            </div>
          </div>
        )}
        {report.avgC > 0 && (
          <div style={{ padding: "14px 12px", borderLeft: hairline(isDark) }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Coherencia</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 300, color: t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {report.avgC}<span style={{ fontSize: 11, color: t3 }}>%</span>
              </span>
              {report.cohDelta !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 500, color: report.cohDelta > 0 ? teal : semantic.danger }}>
                  {report.cohDelta > 0 ? "+" : ""}{report.cohDelta}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
