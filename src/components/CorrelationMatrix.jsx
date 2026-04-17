"use client";
/* ═══════════════════════════════════════════════════════════════
   CORRELATION MATRIX — Protocol effectiveness, clinical rows.
   Hairline-separated ranking, single teal bar, tabular deltas.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { calcProtocolCorrelations } from "../lib/neural";
import { P } from "../lib/protocols";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

export default function CorrelationMatrix({ st, isDark, onSelectProtocol }) {
  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const correlations = useMemo(() => calcProtocolCorrelations(st), [st.moodLog, st.history]);

  if (!correlations || Object.keys(correlations).length < 2) return null;

  const sorted = Object.entries(correlations).sort((a, b) => b[1].avgDelta - a[1].avgDelta);
  const maxDelta = Math.max(...sorted.map(([, d]) => Math.abs(d.avgDelta)), 0.1);

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
        <span style={{ ...CAPS, color: t3 }}>Efectividad · Protocolo</span>
        <span style={{ ...CAPS, color: t3, fontVariantNumeric: "tabular-nums" }}>
          {sorted.length} registrados
        </span>
      </div>

      {/* Ranking rows */}
      <div>
        {sorted.slice(0, 7).map(([name, data], i, arr) => {
          const proto = P.find((p) => p.n === name);
          const isPositive = data.avgDelta > 0;
          const barWidth = Math.round((Math.abs(data.avgDelta) / maxDelta) * 100);
          const deltaColor = isPositive ? teal : semantic.danger;

          return (
            <motion.button
              key={name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.28 }}
              onClick={() => { if (onSelectProtocol && proto) onSelectProtocol(proto); }}
              style={{
                width: "100%",
                display: "block",
                padding: "14px 20px",
                background: "transparent",
                border: "none",
                borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                cursor: proto ? "pointer" : "default",
                textAlign: "left",
              }}
            >
              {/* Rank + name + delta */}
              <div style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                gap: 12, marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                  <span style={{ ...CAPS, color: t3, fontSize: 9, fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: 500, color: t1, letterSpacing: "-0.01em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 18, fontWeight: 300, color: deltaColor,
                    letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
                  }}>
                    {isPositive ? "+" : ""}{data.avgDelta}
                  </span>
                  <span style={{ ...CAPS, color: t3, fontSize: 9, fontVariantNumeric: "tabular-nums" }}>
                    {data.sessions}×
                  </span>
                </div>
              </div>

              {/* Single-channel bar */}
              <div style={{
                height: 2, background: isDark ? "#232836" : "#E5E7EB",
                overflow: "hidden", marginBottom: 6,
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: barWidth + "%" }}
                  transition={{ delay: i * 0.04 + 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ height: "100%", background: deltaColor }}
                />
              </div>

              {/* Time of day hint */}
              <div style={{ fontSize: 11, fontWeight: 400, color: t3, letterSpacing: "0.01em" }}>
                Ventana óptima · {data.bestTimeOfDay} · +{data.bestTimeOfDay === "mañana" ? data.morningDelta : data.afternoonDelta} pts
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
