"use client";
/* ═══════════════════════════════════════════════════════════════
   CORRELATION MATRIX — efectividad por protocolo
   Base: Metacognitive Monitoring (Flavell 1979).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { calcProtocolCorrelations } from "../lib/neural";
import { P } from "../lib/protocols";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, onActivate } from "../lib/a11y";

export default function CorrelationMatrix({ st, isDark, onSelectProtocol }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);

  const correlations = useMemo(() => calcProtocolCorrelations(st), [st.moodLog, st.history]);

  if (!correlations || Object.keys(correlations).length < 2) return null;

  const sorted = Object.entries(correlations).sort((a, b) => b[1].avgDelta - a[1].avgDelta);
  const maxDelta = Math.max(...sorted.map(([, d]) => Math.abs(d.avgDelta)), 0.1);

  return (
    <section
      aria-label="Efectividad personal por protocolo"
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
          <Icon name="radar" size={12} color={t3} aria-hidden="true" />
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
            Efectividad Personal
          </h3>
        </div>
        <span style={{ fontSize: 10, color: t3 }}>{sorted.length} protocolos</span>
      </header>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {sorted.slice(0, 7).map(([name, data], i) => {
          const proto = P.find((p) => p.n === name);
          const isPositive = data.avgDelta > 0;
          const barWidth = Math.round((Math.abs(data.avgDelta) / maxDelta) * 100);
          const protoColor = proto?.cl || "#6366F1";
          const interactive = !!proto && !!onSelectProtocol;
          const onClick = interactive ? () => onSelectProtocol(proto) : undefined;
          const ariaLabel =
            `${name}, ${isPositive ? "+" : ""}${data.avgDelta} puntos promedio en ${data.sessions} sesiones. Mejor hora: ${data.bestTimeOfDay}.`;

          return (
            <motion.li
              key={name}
              initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduced ? { duration: 0 } : { delay: i * 0.05 }}
              role={interactive ? "button" : "listitem"}
              tabIndex={interactive ? 0 : undefined}
              aria-label={ariaLabel}
              onClick={onClick}
              onKeyDown={interactive ? onActivate(onClick) : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                background: isDark ? "#1A1E28" : "#F8FAFC",
                cursor: interactive ? "pointer" : "default",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  inlineSize: 28,
                  blockSize: 28,
                  borderRadius: 7,
                  background: withAlpha(protoColor, 12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: font.weight.black,
                  color: protoColor,
                  flexShrink: 0,
                }}
              >
                {proto?.tg || "?"}
              </div>

              <div style={{ flex: 1, minInlineSize: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBlockEnd: 4,
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
                        fontWeight: font.weight.black,
                        color: isPositive ? semantic.success : semantic.danger,
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {data.avgDelta}
                    </span>
                    <span style={{ fontSize: 9, color: t3 }}>{data.sessions}x</span>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={barWidth}
                  style={{
                    blockSize: 4,
                    background: bd,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={reduced ? { width: barWidth + "%" } : { width: 0 }}
                    animate={{ width: barWidth + "%" }}
                    transition={reduced ? { duration: 0 } : { delay: i * 0.05 + 0.2, duration: 0.4 }}
                    style={{
                      blockSize: "100%",
                      background: isPositive
                        ? `linear-gradient(90deg, ${semantic.success}, ${brand.secondary})`
                        : `linear-gradient(90deg, ${semantic.danger}, #EF4444)`,
                      borderRadius: 2,
                    }}
                  />
                </div>

                <div style={{ fontSize: 9, color: t3, marginBlockStart: 3 }}>
                  Mejor: {data.bestTimeOfDay} ·{" "}
                  {data.bestTimeOfDay === "mañana"
                    ? `+${data.morningDelta}`
                    : `+${data.afternoonDelta}`}{" "}
                  pts
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
