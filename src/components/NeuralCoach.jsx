"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL COACH — Clinical IA recommendation panel.
   Flat hierarchy, hairline rows, weight-300 metrics.
   No pills, no gradient accent tiles, no colored backgrounds.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateCoachingInsights,
  calcNeuralMomentum,
  estimateCognitiveLoad,
  analyzeNeuralRhythm,
  calcProtocolDiversity,
  calcSessionQualityTrend,
} from "../lib/neural";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

function MiniStat({ label, value, unit, sub, color, t3, borderLeft, isDark }) {
  return (
    <div style={{
      padding: "16px 14px",
      borderLeft: borderLeft ? hairline(isDark) : "none",
    }}>
      <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 300, color, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.06em" }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, fontWeight: 400, color: t3, marginTop: 6, letterSpacing: "0.01em" }}>{sub}</div>}
    </div>
  );
}

export default function NeuralCoach({ st, isDark, onSelectProtocol }) {
  const [expanded, setExpanded] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const insights = generateCoachingInsights(st);
  const momentum = calcNeuralMomentum(st);
  const load = estimateCognitiveLoad(st);
  const rhythm = analyzeNeuralRhythm(st);
  const diversity = calcProtocolDiversity(st.history);
  const qualityTrend = calcSessionQualityTrend(st.history);

  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const momColor = momentum.score > 10 ? teal : momentum.score < -10 ? semantic.danger : t1;

  return (
    <div style={{
      background: isDark ? "#141820" : "#FFFFFF",
      border: hairline(isDark),
      borderRadius: radius.lg,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: hairline(isDark),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: teal }} />
          <span style={{ ...CAPS, color: t3 }}>IA · Recomendación</span>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          style={{
            ...CAPS, color: teal,
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          {showDetail ? "Ocultar" : "Detalle"}
        </button>
      </div>

      {/* Momentum + Load — 2 columns flat */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        borderBottom: hairline(isDark),
      }}>
        <MiniStat
          label="Momentum"
          value={`${momentum.score > 0 ? "+" : ""}${momentum.score}`}
          sub={momentum.direction}
          color={momColor}
          t3={t3} isDark={isDark}
        />
        <MiniStat
          label="Carga"
          value={load.load}
          unit="%"
          sub={load.level}
          color={load.color}
          t3={t3} isDark={isDark} borderLeft
        />
      </div>

      {/* Insights — hairline-separated rows */}
      <div>
        <AnimatePresence initial={false}>
          {insights.slice(0, showDetail ? 6 : 3).map((insight, i, arr) => {
            const isOpen = expanded === insight.type;
            return (
              <motion.div
                key={insight.type + i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : insight.type)}
                  style={{
                    width: "100%",
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "16px 20px",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  {/* Priority dot */}
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: insight.priority === 0 ? teal : t3,
                    opacity: insight.priority === 0 ? 1 : 0.4,
                    marginTop: 7, flexShrink: 0,
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: t3, marginBottom: 6,
                    }}>
                      {insight.title}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 400, color: t1,
                      lineHeight: 1.5, letterSpacing: "-0.01em",
                    }}>
                      {insight.message}
                    </div>
                    {isOpen && insight.action && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28 }}
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: hairline(isDark),
                          fontSize: 12, fontWeight: 500, color: teal, letterSpacing: "0.02em",
                        }}
                      >
                        → {insight.action}
                      </motion.div>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            style={{ overflow: "hidden", borderTop: hairline(isDark) }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
            }}>
              <MiniStat
                label="Diversidad"
                value={diversity.uniqueCount}
                sub={`de ${diversity.totalAvailable} protocolos`}
                color={diversity.score >= 50 ? teal : semantic.warning}
                t3={t3} isDark={isDark}
              />
              {rhythm && (
                <MiniStat
                  label="Hora Pico"
                  value={rhythm.peakWindow ? `${rhythm.peakWindow.start}` : "—"}
                  unit={rhythm.peakWindow ? ":00" : ""}
                  sub={rhythm.pattern}
                  color={t1}
                  t3={t3} isDark={isDark} borderLeft
                />
              )}
              {qualityTrend && (
                <div style={{ gridColumn: rhythm ? "auto" : "span 2", borderTop: hairline(isDark) }}>
                  <MiniStat
                    label="Calidad · Sesión"
                    value={qualityTrend.current}
                    unit="%"
                    sub={`${qualityTrend.trend !== 0 ? (qualityTrend.trend > 0 ? "+" : "") + qualityTrend.trend + " · " : ""}${qualityTrend.direction}`}
                    color={qualityTrend.direction === "mejorando" ? teal : qualityTrend.direction === "deteriorando" ? semantic.danger : t1}
                    t3={t3} isDark={isDark}
                  />
                </div>
              )}
              {rhythm && (
                <div style={{ borderTop: hairline(isDark) }}>
                  <MiniStat
                    label="Mejor día"
                    value={rhythm.bestDay}
                    sub={`${rhythm.consistency}% consistencia`}
                    color={t1}
                    t3={t3} isDark={isDark} borderLeft
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
