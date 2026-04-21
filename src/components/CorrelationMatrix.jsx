"use client";
/* ═══════════════════════════════════════════════════════════════
   CORRELATION MATRIX — efectividad personal por protocolo
   Base: Metacognitive Monitoring (Flavell 1979).

   Layout tipo ficha de laboratorio: corner brackets, mono
   blueprint, delta monumental, gradientes bio-signal, left-rail
   del color del protocolo en cada fila, 44-min tap target.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { calcProtocolCorrelations } from "../lib/neural";
import { P } from "../lib/protocols";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion, onActivate } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function CornerBrackets({ color }) {
  const L = 10;
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

export default function CorrelationMatrix({ st, isDark, onSelectProtocol }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);

  const correlations = useMemo(() => calcProtocolCorrelations(st), [st.moodLog, st.history]);

  if (!correlations || Object.keys(correlations).length < 2) return null;

  const sorted = Object.entries(correlations).sort((a, b) => b[1].avgDelta - a[1].avgDelta);
  const maxDelta = Math.max(...sorted.map(([, d]) => Math.abs(d.avgDelta)), 0.1);

  const frameStroke = withAlpha(brand.primary, isDark ? 32 : 24);
  const rule = withAlpha(brand.primary, isDark ? 20 : 14);

  return (
    <section
      aria-label="Efectividad personal por protocolo"
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
      <CornerBrackets color={frameStroke} />

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
          <Icon name="radar" size={12} color={brand.primary} aria-hidden="true" />
          <h3
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: brand.primary,
              textTransform: "uppercase",
              margin: 0,
              opacity: 0.9,
            }}
          >
            ▸ Efectividad Personal
          </h3>
        </div>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 1.5,
            color: t3,
            textTransform: "uppercase",
          }}
        >
          N · {sorted.length} protocolos
        </span>
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
          const protoColor = proto?.cl || bioSignal.neuralViolet;
          const deltaColor = isPositive ? brand.primary : bioSignal.plasmaPink;
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
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px 8px 12px",
                borderRadius: 10,
                background: isDark ? "#1A1E28" : "#F8FAFC",
                border: `1px solid ${withAlpha(protoColor, isDark ? 14 : 10)}`,
                cursor: interactive ? "pointer" : "default",
                minBlockSize: interactive ? 56 : undefined,
                overflow: "hidden",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  insetInlineStart: 0,
                  insetBlockStart: 0,
                  insetBlockEnd: 0,
                  inlineSize: 3,
                  background: `linear-gradient(180deg, ${withAlpha(protoColor, 90)}, ${withAlpha(protoColor, 30)})`,
                }}
              />

              <div
                aria-hidden="true"
                style={{
                  position: "relative",
                  inlineSize: 32,
                  blockSize: 32,
                  borderRadius: 8,
                  background: withAlpha(protoColor, 14),
                  border: `1px solid ${withAlpha(protoColor, 28)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.5,
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
                    gap: 8,
                    marginBlockEnd: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: t1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      letterSpacing: -0.1,
                    }}
                  >
                    {name}
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 700,
                        color: deltaColor,
                        lineHeight: 1,
                        letterSpacing: -0.3,
                        textShadow: `0 0 8px ${withAlpha(deltaColor, 25)}`,
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {data.avgDelta}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9,
                        color: t3,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      · {data.sessions}×
                    </span>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={barWidth}
                  style={{
                    blockSize: 4,
                    background: withAlpha(bd, 60),
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
                        ? `linear-gradient(90deg, ${brand.primary}, ${bioSignal.phosphorCyan})`
                        : `linear-gradient(90deg, ${bioSignal.plasmaPink}, ${bioSignal.ignition})`,
                      borderRadius: 2,
                      boxShadow: `0 0 8px ${withAlpha(deltaColor, 45)}`,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color: t3,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBlockStart: 4,
                  }}
                >
                  ▸ Mejor · {data.bestTimeOfDay} ·{" "}
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
