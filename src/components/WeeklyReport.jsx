"use client";
/* ═══════════════════════════════════════════════════════════════
   WEEKLY REPORT — Comparación semanal con análisis delta
   Base: feedback de progreso temporal aumenta motivación intrínseca
   un 41% (Self-Determination Theory, Deci & Ryan 2000)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { DN } from "../lib/constants";

export default function WeeklyReport({ st, isDark }) {
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const ac = "#059669";

  const report = useMemo(() => {
    const curr = st.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    const prev = st.prevWeekData || [0, 0, 0, 0, 0, 0, 0];
    const currTotal = curr.reduce((a, b) => a + b, 0);
    const prevTotal = prev.reduce((a, b) => a + b, 0);
    const diff = currTotal - prevTotal;
    const activeDaysCurr = curr.filter((v) => v > 0).length;
    const activeDaysPrev = prev.filter((v) => v > 0).length;

    // Mood analysis for the week
    const ml = st.moodLog || [];
    const weekMoods = ml.filter((m) => Date.now() - m.ts < 7 * 86400000);
    const prevWeekMoods = ml.filter(
      (m) => Date.now() - m.ts >= 7 * 86400000 && Date.now() - m.ts < 14 * 86400000
    );
    const moodAvg = weekMoods.length
      ? +(weekMoods.reduce((a, m) => a + m.mood, 0) / weekMoods.length).toFixed(1)
      : 0;
    const prevMoodAvg = prevWeekMoods.length
      ? +(prevWeekMoods.reduce((a, m) => a + m.mood, 0) / prevWeekMoods.length).toFixed(1)
      : 0;
    const moodDelta = moodAvg && prevMoodAvg ? +(moodAvg - prevMoodAvg).toFixed(1) : 0;

    // Coherence delta
    const hist = st.history || [];
    const weekHist = hist.filter((h) => Date.now() - h.ts < 7 * 86400000);
    const prevWeekHist = hist.filter(
      (h) => Date.now() - h.ts >= 7 * 86400000 && Date.now() - h.ts < 14 * 86400000
    );
    const avgC = weekHist.length
      ? Math.round(weekHist.reduce((a, h) => a + (h.c || 50), 0) / weekHist.length)
      : 0;
    const prevAvgC = prevWeekHist.length
      ? Math.round(prevWeekHist.reduce((a, h) => a + (h.c || 50), 0) / prevWeekHist.length)
      : 0;

    return {
      curr,
      prev,
      currTotal,
      prevTotal,
      diff,
      activeDaysCurr,
      activeDaysPrev,
      moodAvg,
      moodDelta,
      avgC,
      cohDelta: avgC && prevAvgC ? avgC - prevAvgC : 0,
      hasPrev: prevTotal > 0,
    };
  }, [st.weeklyData, st.prevWeekData, st.moodLog, st.history]);

  if (!report.hasPrev && report.currTotal === 0) return null;

  const maxVal = Math.max(...report.curr, ...report.prev, 1);

  return (
    <div
      style={{
        background: cd,
        borderRadius: 18,
        padding: "16px 14px",
        border: `1px solid ${bd}`,
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="chart" size={12} color={t3} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
            }}
          >
            Reporte Semanal
          </span>
        </div>
        {report.hasPrev && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 8,
              background: report.diff >= 0 ? "#05966910" : "#DC262610",
            }}
          >
            <Icon
              name={report.diff >= 0 ? "trending-up" : "trending-down"}
              size={10}
              color={report.diff >= 0 ? "#059669" : "#DC2626"}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: report.diff >= 0 ? "#059669" : "#DC2626",
              }}
            >
              {report.diff >= 0 ? "+" : ""}
              {report.diff}
            </span>
          </div>
        )}
      </div>

      {/* Bar chart comparison */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "flex-end",
          height: 70,
          marginBottom: 10,
        }}
      >
        {DN.map((d, i) => {
          const currH = Math.max(2, (report.curr[i] / maxVal) * 60);
          const prevH = Math.max(2, (report.prev[i] / maxVal) * 60);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-end",
                  height: 60,
                }}
              >
                {report.hasPrev && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: prevH }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    style={{
                      width: 6,
                      background: bd,
                      borderRadius: 3,
                    }}
                  />
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: currH }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                  style={{
                    width: 10,
                    background:
                      report.curr[i] > 0
                        ? report.curr[i] > (report.prev[i] || 0)
                          ? ac
                          : "#6366F1"
                        : bd,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: report.curr[i] > 0 ? t2 : t3,
                }}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {report.hasPrev && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: 2, background: ac }}
            />
            <span style={{ fontSize: 9, color: t3 }}>Esta semana ({report.currTotal})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: 2, background: bd }}
            />
            <span style={{ fontSize: 9, color: t3 }}>Anterior ({report.prevTotal})</span>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        <div
          style={{
            background: isDark ? "#1A1E28" : "#F8FAFC",
            borderRadius: 10,
            padding: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: ac }}>
            {report.activeDaysCurr}/7
          </div>
          <div style={{ fontSize: 9, color: t3 }}>días activos</div>
        </div>
        {report.moodAvg > 0 && (
          <div
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 10,
              padding: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: report.moodDelta >= 0 ? "#059669" : "#DC2626",
              }}
            >
              {report.moodAvg}
              {report.moodDelta !== 0 && (
                <span style={{ fontSize: 10 }}>
                  {" "}
                  {report.moodDelta > 0 ? "+" : ""}
                  {report.moodDelta}
                </span>
              )}
            </div>
            <div style={{ fontSize: 9, color: t3 }}>mood prom.</div>
          </div>
        )}
        {report.avgC > 0 && (
          <div
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 10,
              padding: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: report.cohDelta >= 0 ? "#3B82F6" : "#DC2626",
              }}
            >
              {report.avgC}%
              {report.cohDelta !== 0 && (
                <span style={{ fontSize: 10 }}>
                  {" "}
                  {report.cohDelta > 0 ? "+" : ""}
                  {report.cohDelta}
                </span>
              )}
            </div>
            <div style={{ fontSize: 9, color: t3 }}>coherencia</div>
          </div>
        )}
      </div>
    </div>
  );
}
