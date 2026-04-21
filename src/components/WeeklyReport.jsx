"use client";
/* ═══════════════════════════════════════════════════════════════
   WEEKLY REPORT — comparación semanal con delta
   Base: Self-Determination Theory (Deci & Ryan 2000).

   Ficha semanal instrumentada: corner brackets, mono kickers,
   paleta bio-signal unificada, barras con halo y tiles con
   sub-delta mono.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import BioSparkline from "./BioSparkline";
import { DN } from "../lib/constants";
import { resolveTheme, withAlpha, brand, bioSignal } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function CornerBrackets({ color, size = 10 }) {
  const L = size;
  const common = { position: "absolute", inlineSize: L, blockSize: L, pointerEvents: "none" };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockStart: 6, borderInlineStart: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockStart: 6, borderInlineEnd: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockEnd: 6, borderInlineStart: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockEnd: 6, borderInlineEnd: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
    </>
  );
}

function MiniCornerBrackets({ color }) {
  const common = { position: "absolute", inlineSize: 5, blockSize: 5, pointerEvents: "none" };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 3, insetBlockStart: 3, borderInlineStart: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 3, insetBlockStart: 3, borderInlineEnd: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 3, insetBlockEnd: 3, borderInlineStart: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 3, insetBlockEnd: 3, borderInlineEnd: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
    </>
  );
}

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
  const diffColor = report.diff >= 0 ? brand.primary : bioSignal.plasmaPink;
  const moodColor = report.moodDelta >= 0 ? brand.primary : bioSignal.plasmaPink;
  const cohColor = report.cohDelta >= 0 ? bioSignal.phosphorCyan : bioSignal.plasmaPink;

  const cornerStroke = withAlpha(ac, isDark ? 30 : 24);
  const rule = withAlpha(ac, isDark ? 20 : 14);

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
        position: "relative",
        background: cd,
        borderRadius: 18,
        padding: "16px 14px",
        border: `1px solid ${bd}`,
        marginBlockEnd: 14,
        overflow: "hidden",
      }}
    >
      <CornerBrackets color={cornerStroke} />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBlockEnd: 12,
          paddingBlockEnd: 10,
          borderBlockEnd: `1px dashed ${rule}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="chart" size={12} color={ac} aria-hidden="true" />
          <h3
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: ac,
              textTransform: "uppercase",
              margin: 0,
              opacity: 0.9,
            }}
          >
            ▸ Reporte · Semanal
          </h3>
        </div>
        {report.hasPrev && (
          <div
            role="status"
            aria-label={`Diferencia: ${report.diff >= 0 ? "+" : ""}${report.diff} sesiones`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 999,
              background: withAlpha(diffColor, 12),
              border: `1px solid ${withAlpha(diffColor, 28)}`,
            }}
          >
            <Icon
              name={report.diff >= 0 ? "trending-up" : "trending-down"}
              size={10}
              color={diffColor}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 800,
                color: diffColor,
                letterSpacing: 0.3,
                textShadow: `0 0 8px ${withAlpha(diffColor, 30)}`,
              }}
            >
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
            marginBlockEnd: 12,
            paddingInline: 2,
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: 2,
              color: t3,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            ▸ Señal
          </span>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <BioSparkline
              data={report.weekCurve}
              width={220}
              height={28}
              color={bioSignal.phosphorCyan}
              ariaLabel={`Curva de calidad biométrica de ${report.weekCurve.length} sesiones esta semana`}
              showGrid
              showExtremes
            />
          </div>
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          position: "relative",
          display: "flex",
          gap: 6,
          alignItems: "flex-end",
          blockSize: 78,
          marginBlockEnd: 10,
          paddingBlockEnd: 12,
          borderBlockEnd: `1px dashed ${rule}`,
        }}
      >
        {DN.map((d, i) => {
          const currH = Math.max(2, (report.curr[i] / maxVal) * 60);
          const prevH = Math.max(2, (report.prev[i] / maxVal) * 60);
          const beatsPrev = report.curr[i] > (report.prev[i] || 0);
          const barColor =
            report.curr[i] > 0
              ? beatsPrev
                ? ac
                : bioSignal.neuralViolet
              : bd;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
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
                  style={{
                    inlineSize: 10,
                    background: barColor,
                    borderRadius: 3,
                    boxShadow:
                      report.curr[i] > 0
                        ? `0 0 8px ${withAlpha(barColor, 55)}`
                        : "none",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
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
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBlockEnd: 10,
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                inlineSize: 8,
                blockSize: 8,
                borderRadius: 2,
                background: ac,
                boxShadow: `0 0 6px ${withAlpha(ac, 55)}`,
              }}
            />
            <span style={{ color: t3 }}>Semana · {report.currTotal}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ inlineSize: 8, blockSize: 8, borderRadius: 2, background: bd }} />
            <span style={{ color: t3 }}>Previa · {report.prevTotal}</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        <StatTile
          label="Activos"
          value={`${report.activeDaysCurr}/7`}
          color={ac}
          bgColor={isDark ? "#1A1E28" : "#F8FAFC"}
          ariaLabel={`Días activos: ${report.activeDaysCurr} de 7`}
        />
        {report.moodAvg > 0 && (
          <StatTile
            label="Ánimo"
            value={report.moodAvg}
            delta={report.moodDelta || null}
            color={moodColor}
            bgColor={isDark ? "#1A1E28" : "#F8FAFC"}
            ariaLabel={`Ánimo promedio: ${report.moodAvg}${report.moodDelta ? `, delta ${report.moodDelta > 0 ? "+" : ""}${report.moodDelta}` : ""}`}
          />
        )}
        {report.avgC > 0 && (
          <StatTile
            label="Coherencia"
            value={`${report.avgC}%`}
            delta={report.cohDelta || null}
            color={cohColor}
            bgColor={isDark ? "#1A1E28" : "#F8FAFC"}
            ariaLabel={`Coherencia promedio: ${report.avgC}%${report.cohDelta ? `, delta ${report.cohDelta > 0 ? "+" : ""}${report.cohDelta}` : ""}`}
          />
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value, delta, color, bgColor, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        position: "relative",
        background: bgColor,
        border: `1px solid ${withAlpha(color, 16)}`,
        borderRadius: 10,
        padding: "10px 8px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <MiniCornerBrackets color={withAlpha(color, 50)} />
      <div
        style={{
          fontFamily: MONO,
          fontSize: 15,
          fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: -0.3,
          textShadow: `0 0 10px ${withAlpha(color, 25)}`,
        }}
      >
        {value}
        {delta != null && delta !== 0 && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
              marginInlineStart: 4,
              opacity: 0.85,
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.5,
          color: "rgba(127,127,127,.9)",
          textTransform: "uppercase",
          marginBlockStart: 4,
        }}
      >
        ▸ {label}
      </div>
    </div>
  );
}
