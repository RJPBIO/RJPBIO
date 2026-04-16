"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL COACH — Panel de coaching IA dinámico
   Genera insights accionables basados en el estado neural completo
   Base: el coaching adaptativo mejora la adherencia un 47% vs
   feedback estático (Michie et al., 2017)
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import {
  generateCoachingInsights,
  calcNeuralMomentum,
  estimateCognitiveLoad,
  analyzeNeuralRhythm,
  calcProtocolDiversity,
  calcSessionQualityTrend,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, semantic, brand } from "../lib/theme";

export default function NeuralCoach({ st, isDark, onSelectProtocol }) {
  const [expanded, setExpanded] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const insights = generateCoachingInsights(st);
  const momentum = calcNeuralMomentum(st);
  const load = estimateCognitiveLoad(st);
  const rhythm = analyzeNeuralRhythm(st);
  const diversity = calcProtocolDiversity(st.history);
  const qualityTrend = calcSessionQualityTrend(st.history);

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="cpu" size={13} color={brand.primary} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
            }}
          >
            Coach Neural IA
          </span>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: brand.primary,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 6px",
          }}
        >
          {showDetail ? "Menos" : "Detalle"}
        </button>
      </div>

      {/* Momentum + Load mini-bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          marginBottom: 10,
        }}
      >
        {/* Momentum */}
        <div
          style={{
            background: cd,
            borderRadius: 12,
            padding: "10px",
            border: `1px solid ${bd}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 10, color: t3, fontWeight: 700 }}>
              Momentum
            </span>
            <Icon
              name={
                momentum.direction === "ascendente"
                  ? "trending-up"
                  : momentum.direction === "descendente"
                  ? "trending-down"
                  : "minus"
              }
              size={12}
              color={
                momentum.direction === "ascendente"
                  ? semantic.success
                  : momentum.direction === "descendente"
                  ? semantic.danger
                  : t3
              }
            />
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color:
                momentum.score > 10
                  ? semantic.success
                  : momentum.score < -10
                  ? semantic.danger
                  : t1,
            }}
          >
            {momentum.score > 0 ? "+" : ""}
            {momentum.score}
          </div>
          <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
            {momentum.direction}
          </div>
        </div>

        {/* Carga Cognitiva */}
        <div
          style={{
            background: cd,
            borderRadius: 12,
            padding: "10px",
            border: `1px solid ${bd}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 10, color: t3, fontWeight: 700 }}>
              Carga
            </span>
            <Icon name="gauge" size={12} color={load.color} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: load.color }}>
            {load.load}%
          </div>
          <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
            {load.level}
          </div>
        </div>
      </div>

      {/* Insights list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <AnimatePresence>
          {insights.slice(0, showDetail ? 6 : 3).map((insight, i) => (
            <motion.div
              key={insight.type + i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <button
                onClick={() =>
                  setExpanded(expanded === insight.type ? null : insight.type)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "11px 12px",
                  background:
                    expanded === insight.type
                      ? `${insight.color}08`
                      : cd,
                  borderRadius: 12,
                  border:
                    expanded === insight.type
                      ? `1.5px solid ${insight.color}20`
                      : `1px solid ${bd}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all .2s",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${insight.color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name={insight.icon}
                    size={13}
                    color={insight.color}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: insight.color,
                      marginBottom: 2,
                    }}
                  >
                    {insight.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: t2,
                      lineHeight: 1.5,
                    }}
                  >
                    {insight.message}
                  </div>
                  {expanded === insight.type && insight.action && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      style={{
                        marginTop: 6,
                        padding: "6px 8px",
                        background: `${insight.color}08`,
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 600,
                        color: insight.color,
                      }}
                    >
                      → {insight.action}
                    </motion.div>
                  )}
                </div>
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: insight.color,
                    opacity: insight.priority === 0 ? 1 : 0.3,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detail panel: rhythm + diversity + quality */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                marginTop: 10,
              }}
            >
              {/* Diversidad */}
              <div
                style={{
                  background: cd,
                  borderRadius: 12,
                  padding: "10px",
                  border: `1px solid ${bd}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: t3,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Diversidad
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color:
                      diversity.score >= 50 ? semantic.success : semantic.warning,
                  }}
                >
                  {diversity.uniqueCount}/{diversity.totalAvailable}
                </div>
                <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
                  protocolos
                </div>
              </div>

              {/* Ritmo */}
              {rhythm && (
                <div
                  style={{
                    background: cd,
                    borderRadius: 12,
                    padding: "10px",
                    border: `1px solid ${bd}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: t3,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Hora Pico
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: semantic.info }}>
                    {rhythm.peakWindow
                      ? `${rhythm.peakWindow.start}:00`
                      : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
                    {rhythm.pattern}
                  </div>
                </div>
              )}

              {/* Calidad de sesión */}
              {qualityTrend && (
                <div
                  style={{
                    background: cd,
                    borderRadius: 12,
                    padding: "10px",
                    border: `1px solid ${bd}`,
                    gridColumn: rhythm ? "auto" : "span 2",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: t3,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Calidad sesión
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color:
                          qualityTrend.direction === "mejorando"
                            ? semantic.success
                            : qualityTrend.direction === "deteriorando"
                            ? semantic.danger
                            : t1,
                      }}
                    >
                      {qualityTrend.current}%
                    </span>
                    {qualityTrend.trend !== 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            qualityTrend.trend > 0
                              ? semantic.success
                              : semantic.danger,
                        }}
                      >
                        {qualityTrend.trend > 0 ? "+" : ""}
                        {qualityTrend.trend}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
                    {qualityTrend.direction}
                  </div>
                </div>
              )}

              {/* Mejor día */}
              {rhythm && (
                <div
                  style={{
                    background: cd,
                    borderRadius: 12,
                    padding: "10px",
                    border: `1px solid ${bd}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: t3,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Mejor día
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t1 }}>
                    {rhythm.bestDay}
                  </div>
                  <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
                    {rhythm.consistency}% consistencia
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
