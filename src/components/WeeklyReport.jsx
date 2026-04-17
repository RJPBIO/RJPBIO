"use client";
/* ═══════════════════════════════════════════════════════════════
   WEEKLY REPORT — comparación semanal con delta
   Base: Self-Determination Theory (Deci & Ryan 2000).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import BioSparkline from "./BioSparkline";
import { DN } from "../lib/constants";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

export default function WeeklyReport({ st, isDark }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t2, t3 } = resolveTheme(isDark);
  const ac = brand.primary;

  const report = useMemo(() => {
    const curr = st.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    const prev = st.prevWeekData || [0, 0, 0, 0, 0, 0, 0];
    const currTotal = curr.reduce((a, b) => a + b, 0);
    const prevTotal = prev.reduce((a, b) => a + b, 0);
    const diff = currTotal - prevTotal;
    const activeDaysCurr = curr.filter((v) => v > 0).length;
    const activeDaysPrev = prev.filter((v) => v > 0).length;

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

    const weekCurve = weekHist
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .map((h) => h.bioQ || h.c || 50);

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
      weekCurve,
    };
  }, [st.weeklyData, st.prevWeekData, st.moodLog, st.history]);

  if (!report.hasPrev && report.currTotal === 0) return null;

  const maxVal = Math.max(...report.curr, ...report.prev, 1);
  const diffColor = report.diff >= 0 ? semantic.success : semantic.danger;

  const ariaLabel =
    `Reporte semanal. ${report.currTotal} sesiones esta semana` +
    (report.hasPrev ? `, ${report.diff >= 0 ? "+" : ""}${report.diff} vs semana anterior` : "") +
    `. ${report.activeDaysCurr} de 7 días activos.` +
    (report.moodAvg ? ` Ánimo promedio ${report.moodAvg}.` : "") +
    (report.avgC ? ` Coherencia ${report.avgC}%.` : "");

  return (
    <section
      aria-label={ariaLabel}
      style={{
        background: cd,
        borderRadius: 18,
        padding: "16px 14px",
        border: `1px solid ${bd}`,
        marginBlockEnd: 14,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBlockEnd: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="chart" size={12} color={t3} aria-hidden="true" />
          <h3
            style={{
              fontSize: 10,
              fontWeight: font.weight.black,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Reporte Semanal
          </h3>
        </div>
        {report.hasPrev && (
          <div
            role="status"
            aria-label={`Diferencia: ${report.diff >= 0 ? "+" : ""}${report.diff} sesiones`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 8,
              background: withAlpha(diffColor, 10),
            }}
          >
            <Icon
              name={report.diff >= 0 ? "trending-up" : "trending-down"}
              size={10}
              color={diffColor}
              aria-hidden="true"
            />
            <span style={{ fontSize: 10, fontWeight: font.weight.black, color: diffColor }}>
              {report.diff >= 0 ? "+" : ""}
              {report.diff}
            </span>
          </div>
        )}
      </header>

      {report.weekCurve.length >= 3 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBlockEnd: 10,
            paddingInline: 2,
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: 1.5, color: t3, textTransform: "uppercase", flexShrink: 0 }}>
            Señal
          </span>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <BioSparkline
              data={report.weekCurve}
              width={220}
              height={26}
              color={bioSignal.phosphorCyan}
              ariaLabel={`Curva de calidad biométrica de ${report.weekCurve.length} sesiones esta semana`}
            />
          </div>
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          display: "flex",
          gap: 6,
          alignItems: "flex-end",
          blockSize: 70,
          marginBlockEnd: 10,
        }}
      >
        {DN.map((d, i) => {
          const currH = Math.max(2, (report.curr[i] / maxVal) * 60);
          const prevH = Math.max(2, (report.prev[i] / maxVal) * 60);
          const barColor =
            report.curr[i] > 0
              ? report.curr[i] > (report.prev[i] || 0)
                ? ac
                : "#6366F1"
              : bd;
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
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", blockSize: 60 }}>
                {report.hasPrev && (
                  <motion.div
                    initial={reduced ? { height: prevH } : { height: 0 }}
                    animate={{ height: prevH }}
                    transition={reduced ? { duration: 0 } : { delay: i * 0.05, duration: 0.4 }}
                    style={{ inlineSize: 6, background: bd, borderRadius: 3 }}
                  />
                )}
                <motion.div
                  initial={reduced ? { height: currH } : { height: 0 }}
                  animate={{ height: currH }}
                  transition={reduced ? { duration: 0 } : { delay: i * 0.05 + 0.1, duration: 0.4 }}
                  style={{ inlineSize: 10, background: barColor, borderRadius: 3 }}
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

      {report.hasPrev && (
        <div
          aria-hidden="true"
          style={{ display: "flex", justifyContent: "center", gap: 16, marginBlockEnd: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ inlineSize: 8, blockSize: 8, borderRadius: 2, background: ac }} />
            <span style={{ fontSize: 9, color: t3 }}>Esta semana ({report.currTotal})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ inlineSize: 8, blockSize: 8, borderRadius: 2, background: bd }} />
            <span style={{ fontSize: 9, color: t3 }}>Anterior ({report.prevTotal})</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        <div
          role="group"
          aria-label={`Días activos: ${report.activeDaysCurr} de 7`}
          style={{
            background: isDark ? "#1A1E28" : "#F8FAFC",
            borderRadius: 10,
            padding: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: font.weight.black, color: ac }}>
            {report.activeDaysCurr}/7
          </div>
          <div style={{ fontSize: 9, color: t3 }}>días activos</div>
        </div>
        {report.moodAvg > 0 && (
          <div
            role="group"
            aria-label={`Ánimo promedio: ${report.moodAvg}${report.moodDelta ? `, delta ${report.moodDelta > 0 ? "+" : ""}${report.moodDelta}` : ""}`}
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 10,
              padding: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: font.weight.black,
                color: report.moodDelta >= 0 ? semantic.success : semantic.danger,
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
            role="group"
            aria-label={`Coherencia promedio: ${report.avgC}%${report.cohDelta ? `, delta ${report.cohDelta > 0 ? "+" : ""}${report.cohDelta}` : ""}`}
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 10,
              padding: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: font.weight.black,
                color: report.cohDelta >= 0 ? "#3B82F6" : semantic.danger,
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
    </section>
  );
}
