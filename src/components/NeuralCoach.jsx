"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL COACH — Panel de coaching IA dinámico
   ═══════════════════════════════════════════════════════════════
   Identidad elevada: mono kickers, corner brackets, paleta
   bio-signal, 44-min tap target en insights. Preserva toda la
   lógica (insights, safety, memory, detail). Los tiles hablan
   como instrumentos, no como cards genéricas.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useId } from "react";
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
import { buildCoachContext, summarizeContext } from "../lib/coachMemory";
import { evaluateSafetySignals } from "../lib/coachSafety";
import {
  resolveTheme,
  withAlpha,
  font,
  space,
  radius,
  brand,
  bioSignal,
} from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { semantic } from "../lib/tokens";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function NeuralCoach({ st, isDark, onSelectProtocol }) {
  const [expanded, setExpanded] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const reduced = useReducedMotion();
  const baseId = useId();

  const insights = generateCoachingInsights(st);
  const momentum = calcNeuralMomentum(st);
  const load = estimateCognitiveLoad(st);
  const rhythm = analyzeNeuralRhythm(st);
  const diversity = calcProtocolDiversity(st.history);
  const qualityTrend = calcSessionQualityTrend(st.history);
  const memoryCtx = buildCoachContext(st);
  const memorySummary = summarizeContext(memoryCtx);
  const safety = evaluateSafetySignals(st, { locale: typeof navigator !== "undefined" ? navigator.language : "es" });

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const momentumColor =
    momentum.score > 10 ? brand.primary : momentum.score < -10 ? bioSignal.plasmaPink : t1;
  const momentumIcon =
    momentum.direction === "ascendente" ? "trending-up" :
    momentum.direction === "descendente" ? "trending-down" : "minus";
  const momentumIconColor =
    momentum.direction === "ascendente" ? brand.primary :
    momentum.direction === "descendente" ? bioSignal.plasmaPink : t3;

  const qualityColor =
    qualityTrend?.direction === "mejorando" ? brand.primary :
    qualityTrend?.direction === "deteriorando" ? bioSignal.plasmaPink : t1;

  const safetyTone =
    safety.level === "crisis" ? semantic.danger : bioSignal.ignition;

  return (
    <section
      role="region"
      aria-label="Coach Neural con IA"
      style={{ marginBlockEnd: space[4] }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBlockEnd: space[2.5],
          paddingBlockEnd: space[2],
          borderBlockEnd: `1px dashed ${withAlpha(brand.primary, isDark ? 22 : 16)}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: space[1.5] }}>
          <Icon name="cpu" size={14} color={brand.primary} aria-hidden="true" />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.05,
              color: brand.primary,
            }}
          >
            Coach Neural · IA
          </span>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          aria-expanded={showDetail}
          aria-controls={`${baseId}-detail`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.05,
            color: brand.primary,
            background: withAlpha(brand.primary, 8),
            border: `1px solid ${withAlpha(brand.primary, 22)}`,
            paddingBlock: 6,
            paddingInline: 12,
            borderRadius: radius.sm,
            minBlockSize: 32,
            cursor: "pointer",
          }}
        >
          {showDetail ? "Menos" : "Detalle"}
        </button>
      </header>

      {safety.level !== "none" && (
        <aside
          role={safety.level === "crisis" ? "alert" : "status"}
          aria-label={safety.level === "crisis" ? "Alerta de seguridad" : "Señal de cuidado"}
          style={{
            position: "relative",
            background: withAlpha(safetyTone, 10),
            border: `1.5px solid ${withAlpha(safetyTone, 30)}`,
            borderRadius: radius.md,
            padding: space[3],
            marginBlockEnd: space[2.5],
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: space[1.5], marginBlockEnd: space[1] }}>
            <Icon name={safety.level === "crisis" ? "alert-triangle" : "shield"} size={15} color={safetyTone} aria-hidden="true" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: -0.05,
                color: safetyTone,
              }}
            >
              {safety.level === "crisis" ? "Apoyo humano ahora" : "Carga alta detectada"}
            </span>
          </div>
          <p style={{ fontSize: font.size.sm, color: t2, margin: 0, lineHeight: font.leading.normal }}>
            {safety.message}
          </p>
          {safety.resources.length > 0 && (
            <ul role="list" style={{ listStyle: "none", padding: 0, margin: `${space[2]}px 0 0`, display: "flex", flexDirection: "column", gap: space[1] }}>
              {safety.resources.map((r, i) => (
                <li key={i} style={{ fontSize: font.size.sm, color: t1, lineHeight: font.leading.normal }}>
                  <strong>{r.label}:</strong> {r.contact}
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {memorySummary && (
        <div
          aria-label="Resumen de memoria del coach"
          style={{
            position: "relative",
            background: withAlpha(brand.primary, 6),
            border: `1px solid ${withAlpha(brand.primary, 14)}`,
            borderRadius: radius.sm,
            paddingBlock: space[2],
            paddingInline: space[3],
            marginBlockEnd: space[2.5],
            fontSize: font.size.xs,
            color: t2,
            lineHeight: font.leading.normal,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: -0.05,
              color: brand.primary,
              marginInlineEnd: space[1.5],
            }}
          >
            Memoria ·
          </span>
          {memorySummary}
        </div>
      )}

      <div
        role="group"
        aria-label="Indicadores neurales"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: space[2],
          marginBlockEnd: space[2.5],
        }}
      >
        <MetricTile
          label="Momentum"
          value={`${momentum.score > 0 ? "+" : ""}${momentum.score}`}
          subtitle={momentum.direction}
          color={momentumColor}
          iconName={momentumIcon}
          iconColor={momentumIconColor}
          cd={cd}
          bd={bd}
          t3={t3}
          ariaLabel={`Momentum: ${momentum.score > 0 ? "+" : ""}${momentum.score}, tendencia ${momentum.direction}`}
        />
        <MetricTile
          label="Carga"
          value={`${load.load}%`}
          subtitle={load.level}
          color={load.color}
          iconName="gauge"
          iconColor={load.color}
          cd={cd}
          bd={bd}
          t3={t3}
          ariaLabel={`Carga cognitiva: ${load.load}%, nivel ${load.level}`}
        />
      </div>

      <ul
        aria-label="Insights de coaching"
        style={{ display: "flex", flexDirection: "column", gap: space[1], listStyle: "none", padding: 0, margin: 0 }}
      >
        <AnimatePresence>
          {insights.slice(0, showDetail ? 6 : 3).map((insight, i) => {
            const isOpen = expanded === insight.type;
            const insightId = `${baseId}-insight-${i}`;
            return (
              <motion.li
                key={insight.type + i}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ delay: reduced ? 0 : i * 0.05, duration: reduced ? 0 : 0.3 }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : insight.type)}
                  aria-expanded={isOpen}
                  aria-controls={insightId}
                  style={{
                    inlineSize: "100%",
                    display: "flex",
                    gap: space[2.5],
                    alignItems: "flex-start",
                    paddingBlock: 12,
                    paddingInline: space[3],
                    background: isOpen ? withAlpha(insight.color, 6) : cd,
                    borderRadius: radius.md,
                    border: isOpen
                      ? `1.5px solid ${withAlpha(insight.color, 28)}`
                      : `1px solid ${bd}`,
                    boxShadow: isOpen
                      ? `0 6px 18px -12px ${withAlpha(insight.color, 80)}`
                      : "none",
                    textAlign: "start",
                    transition: "all .2s",
                    minBlockSize: 56,
                    cursor: "pointer",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 32, blockSize: 32, borderRadius: radius.sm,
                      background: withAlpha(insight.color, 12),
                      border: `1px solid ${withAlpha(insight.color, 24)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={insight.icon} size={14} color={insight.color} />
                  </div>
                  <div style={{ flex: 1, minInlineSize: 0 }} id={insightId}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: -0.05,
                        color: insight.color,
                        marginBlockEnd: 3,
                      }}
                    >
                      {insight.title}
                    </div>
                    <div style={{ fontSize: font.size.sm, color: t2, lineHeight: font.leading.normal }}>
                      {insight.message}
                    </div>
                    {isOpen && insight.action && (
                      <motion.div
                        initial={reduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        style={{
                          marginBlockStart: space[2],
                          paddingBlock: space[2],
                          paddingInline: space[2.5],
                          background: withAlpha(insight.color, 8),
                          border: `1px solid ${withAlpha(insight.color, 20)}`,
                          borderRadius: radius.sm,
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: -0.05,
                          color: insight.color,
                          lineHeight: 1.5,
                        }}
                      >
                        {insight.action}
                      </motion.div>
                    )}
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 6, blockSize: 6, borderRadius: "50%",
                      background: insight.color,
                      boxShadow: insight.priority === 0 ? `0 0 8px ${withAlpha(insight.color, 70)}` : "none",
                      opacity: insight.priority === 0 ? 1 : 0.35,
                      flexShrink: 0,
                      marginBlockStart: 6,
                    }}
                  />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            id={`${baseId}-detail`}
            initial={reduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div
              role="group"
              aria-label="Detalle neural ampliado"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: space[2],
                marginBlockStart: space[2.5],
              }}
            >
              <MetricTile
                label="Diversidad"
                value={`${diversity.uniqueCount}/${diversity.totalAvailable}`}
                subtitle="protocolos"
                color={diversity.score >= 50 ? brand.primary : bioSignal.ignition}
                cd={cd}
                bd={bd}
                t3={t3}
                ariaLabel={`Diversidad: ${diversity.uniqueCount} de ${diversity.totalAvailable} protocolos`}
              />

              {rhythm && (
                <MetricTile
                  label="Hora pico"
                  value={rhythm.peakWindow ? `${rhythm.peakWindow.start}:00` : "—"}
                  subtitle={rhythm.pattern}
                  color={bioSignal.neuralViolet}
                  cd={cd}
                  bd={bd}
                  t3={t3}
                  ariaLabel={`Hora pico: ${rhythm.peakWindow ? rhythm.peakWindow.start + " horas" : "indefinida"}, patrón ${rhythm.pattern}`}
                />
              )}

              {qualityTrend && (
                <div
                  role="group"
                  aria-label={`Calidad de sesión: ${qualityTrend.current}%, tendencia ${qualityTrend.direction}`}
                  style={{
                    position: "relative",
                    background: cd,
                    border: `1px solid ${withAlpha(qualityColor, 20)}`,
                    borderRadius: radius.md,
                    padding: space[3],
                    gridColumn: rhythm ? "auto" : "span 2",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: -0.05,
                      color: t3,
                      marginBlockEnd: 6,
                    }}
                  >
                    Calidad de sesión
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 22,
                        fontWeight: 700,
                        color: qualityColor,
                        lineHeight: 1,
                        letterSpacing: -0.5,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {qualityTrend.current}%
                    </span>
                    {qualityTrend.trend !== 0 && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 12,
                          fontWeight: 600,
                          color: qualityTrend.trend > 0 ? brand.primary : bioSignal.plasmaPink,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {qualityTrend.trend > 0 ? "+" : ""}{qualityTrend.trend}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: font.size.xs, color: t3, marginBlockStart: 4 }}>{qualityTrend.direction}</div>
                </div>
              )}

              {rhythm && (
                <MetricTile
                  label="Mejor día"
                  value={rhythm.bestDay}
                  subtitle={`${rhythm.consistency}% consistencia`}
                  color={t1}
                  cd={cd}
                  bd={bd}
                  t3={t3}
                  ariaLabel={`Mejor día: ${rhythm.bestDay}, ${rhythm.consistency}% de consistencia`}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MetricTile({ label, value, subtitle, color, iconName, iconColor, cd, bd, t3, ariaLabel }) {
  return (
    <article
      aria-label={ariaLabel}
      style={{
        position: "relative",
        background: cd,
        border: `1px solid ${withAlpha(color, 18)}`,
        borderRadius: radius.md,
        padding: space[3],
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBlockEnd: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.05,
            color: t3,
          }}
        >
          {label}
        </span>
        {iconName && <Icon name={iconName} size={13} color={iconColor || color} aria-hidden="true" />}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 700,
          color,
          lineHeight: 1,
          letterSpacing: -0.5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: font.size.xs,
            color: t3,
            marginBlockStart: 4,
          }}
        >
          {subtitle}
        </div>
      )}
    </article>
  );
}
