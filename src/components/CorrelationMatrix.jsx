"use client";
/* ═══════════════════════════════════════════════════════════════
   CORRELATION MATRIX — Visualización de efectividad por protocolo
   Base: la retroalimentación sobre efectividad personal guía
   la auto-selección óptima (Metacognitive Monitoring, Flavell 1979)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { calcProtocolCorrelations } from "../lib/neural";
import { P } from "../lib/protocols";

export default function CorrelationMatrix({ st, isDark, onSelectProtocol }) {
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";

  const correlations = useMemo(() => calcProtocolCorrelations(st), [st.moodLog, st.history]);

  if (!correlations || Object.keys(correlations).length < 2) return null;

  const sorted = Object.entries(correlations).sort((a, b) => b[1].avgDelta - a[1].avgDelta);
  const maxDelta = Math.max(...sorted.map(([, d]) => Math.abs(d.avgDelta)), 0.1);

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
          <Icon name="radar" size={12} color={t3} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
            }}
          >
            Efectividad Personal
          </span>
        </div>
        <span style={{ fontSize: 10, color: t3 }}>
          {sorted.length} protocolos
        </span>
      </div>

      {/* Protocol bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.slice(0, 7).map(([name, data], i) => {
          const proto = P.find((p) => p.n === name);
          const isPositive = data.avgDelta > 0;
          const barWidth = Math.round((Math.abs(data.avgDelta) / maxDelta) * 100);

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                if (onSelectProtocol && proto) onSelectProtocol(proto);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                background: isDark ? "#1A1E28" : "#F8FAFC",
                cursor: proto ? "pointer" : "default",
              }}
            >
              {/* Protocol tag */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: (proto?.cl || "#6366F1") + "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 800,
                  color: proto?.cl || "#6366F1",
                  flexShrink: 0,
                }}
              >
                {proto?.tg || "?"}
              </div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: isPositive ? "#059669" : "#DC2626",
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {data.avgDelta}
                    </span>
                    <span style={{ fontSize: 9, color: t3 }}>{data.sessions}x</span>
                  </div>
                </div>

                {/* Delta bar */}
                <div
                  style={{
                    height: 4,
                    background: bd,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: barWidth + "%" }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                    style={{
                      height: "100%",
                      background: isPositive
                        ? "linear-gradient(90deg, #059669, #0D9488)"
                        : "linear-gradient(90deg, #DC2626, #EF4444)",
                      borderRadius: 2,
                    }}
                  />
                </div>

                {/* Time of day hint */}
                <div style={{ fontSize: 9, color: t3, marginTop: 3 }}>
                  Mejor: {data.bestTimeOfDay} ·{" "}
                  {data.bestTimeOfDay === "mañana"
                    ? `+${data.morningDelta}`
                    : `+${data.afternoonDelta}`}{" "}
                  pts
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
