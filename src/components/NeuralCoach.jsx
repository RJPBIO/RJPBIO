"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL COACH — Panel de coaching IA dinámico
   ═══════════════════════════════════════════════════════════════
   - Usa resolveTheme + tokens (no más colores hardcoded).
   - aria-expanded, aria-controls para insights desplegables.
   - role="region" con aria-label para navegación por landmarks.
   - Respeta reduced-motion.
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
import { resolveTheme, withAlpha, ty, font, space, radius, brand } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { semantic } from "../lib/tokens";

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
    momentum.score > 10 ? semantic.success : momentum.score < -10 ? semantic.danger : t1;
  const momentumIcon =
    momentum.direction === "ascendente" ? "trending-up" :
    momentum.direction === "descendente" ? "trending-down" : "minus";
  const momentumIconColor =
    momentum.direction === "ascendente" ? semantic.success :
    momentum.direction === "descendente" ? semantic.danger : t3;

  const qualityColor =
    qualityTrend?.direction === "mejorando" ? semantic.success :
    qualityTrend?.direction === "deteriorando" ? semantic.danger : t1;

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: space[1.5] }}>
          <Icon name="cpu" size={13} color={brand.primary} aria-hidden="true" />
          <span style={{ ...ty.label(t3), fontSize: font.size.sm }}>Coach Neural IA</span>
        </div>
        <button
          onClick={() => setShowDetail(!showDetail)}
          aria-expanded={showDetail}
          aria-controls={`${baseId}-detail`}
          style={{
            fontSize: font.size.sm,
            fontWeight: font.weight.bold,
            color: brand.primary,
            background: "none",
            border: "none",
            paddingBlock: space[0.5],
            paddingInline: space[1.5],
            borderRadius: radius.sm,
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
            background: safety.level === "crisis" ? withAlpha(semantic.danger, 10) : withAlpha(semantic.warning, 8),
            border: `1.5px solid ${safety.level === "crisis" ? withAlpha(semantic.danger, 30) : withAlpha(semantic.warning, 25)}`,
            borderRadius: radius.md,
            padding: space[2.5],
            marginBlockEnd: space[2.5],
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: space[1.5], marginBlockEnd: space[1] }}>
            <Icon name={safety.level === "crisis" ? "alert-triangle" : "shield"} size={14} color={safety.level === "crisis" ? semantic.danger : semantic.warning} aria-hidden="true" />
            <span style={{ ...ty.label(safety.level === "crisis" ? semantic.danger : semantic.warning), fontSize: font.size.sm }}>
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
            background: withAlpha(brand.primary, 5),
            border: `1px solid ${withAlpha(brand.primary, 12)}`,
            borderRadius: radius.sm,
            paddingBlock: space[1.5],
            paddingInline: space[2.5],
            marginBlockEnd: space[2.5],
            fontSize: font.size.xs,
            color: t2,
            lineHeight: font.leading.normal,
          }}
        >
          <span style={{ ...ty.label(brand.primary), fontSize: 10, marginInlineEnd: space[1] }}>Memoria</span>
          {memorySummary}
        </div>
      )}

      <div
        role="group"
        aria-label="Indicadores neurales"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: space[1.5],
          marginBlockEnd: space[2.5],
        }}
      >
        <article
          aria-label={`Momentum: ${momentum.score > 0 ? "+" : ""}${momentum.score}, tendencia ${momentum.direction}`}
          style={{
            background: cd,
            borderRadius: radius.md,
            padding: space[2.5],
            border: `1px solid ${bd}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[1] }}>
            <span style={{ ...ty.caption(t3), fontWeight: font.weight.bold }}>Momentum</span>
            <Icon name={momentumIcon} size={12} color={momentumIconColor} aria-hidden="true" />
          </div>
          <div style={{ ...ty.metric(momentumColor, font.size["2xl"]) }}>
            {momentum.score > 0 ? "+" : ""}{momentum.score}
          </div>
          <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>{momentum.direction}</div>
        </article>

        <article
          aria-label={`Carga cognitiva: ${load.load}%, nivel ${load.level}`}
          style={{
            background: cd,
            borderRadius: radius.md,
            padding: space[2.5],
            border: `1px solid ${bd}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[1] }}>
            <span style={{ ...ty.caption(t3), fontWeight: font.weight.bold }}>Carga</span>
            <Icon name="gauge" size={12} color={load.color} aria-hidden="true" />
          </div>
          <div style={{ ...ty.metric(load.color, font.size["2xl"]) }}>{load.load}%</div>
          <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>{load.level}</div>
        </article>
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
                    paddingBlock: 11,
                    paddingInline: space[3],
                    background: isOpen ? withAlpha(insight.color, 4) : cd,
                    borderRadius: radius.md,
                    border: isOpen
                      ? `1.5px solid ${withAlpha(insight.color, 15)}`
                      : `1px solid ${bd}`,
                    textAlign: "start",
                    transition: "all .2s",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 28, blockSize: 28, borderRadius: radius.sm,
                      background: withAlpha(insight.color, 8),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={insight.icon} size={13} color={insight.color} />
                  </div>
                  <div style={{ flex: 1, minInlineSize: 0 }} id={insightId}>
                    <div style={{ ...ty.caption(insight.color), fontWeight: font.weight.bold, marginBlockEnd: 2 }}>
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
                          marginBlockStart: space[1.5],
                          paddingBlock: space[1.5],
                          paddingInline: space[2],
                          background: withAlpha(insight.color, 4),
                          borderRadius: radius.sm,
                          fontSize: font.size.sm,
                          fontWeight: font.weight.semibold,
                          color: insight.color,
                        }}
                      >
                        → {insight.action}
                      </motion.div>
                    )}
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 4, blockSize: 4, borderRadius: "50%",
                      background: insight.color,
                      opacity: insight.priority === 0 ? 1 : 0.3,
                      flexShrink: 0,
                      marginBlockStart: 4,
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
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[1.5], marginBlockStart: space[2.5] }}
            >
              <article
                aria-label={`Diversidad: ${diversity.uniqueCount} de ${diversity.totalAvailable} protocolos`}
                style={{ background: cd, borderRadius: radius.md, padding: space[2.5], border: `1px solid ${bd}` }}
              >
                <div style={{ ...ty.caption(t3), fontWeight: font.weight.bold, marginBlockEnd: space[1] }}>Diversidad</div>
                <div style={{ ...ty.metric(diversity.score >= 50 ? semantic.success : semantic.warning, font.size.xl) }}>
                  {diversity.uniqueCount}/{diversity.totalAvailable}
                </div>
                <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>protocolos</div>
              </article>

              {rhythm && (
                <article
                  aria-label={`Hora pico: ${rhythm.peakWindow ? rhythm.peakWindow.start + " horas" : "indefinida"}, patrón ${rhythm.pattern}`}
                  style={{ background: cd, borderRadius: radius.md, padding: space[2.5], border: `1px solid ${bd}` }}
                >
                  <div style={{ ...ty.caption(t3), fontWeight: font.weight.bold, marginBlockEnd: space[1] }}>Hora Pico</div>
                  <div style={{ ...ty.metric(brand.secondary, font.size.xl) }}>
                    {rhythm.peakWindow ? `${rhythm.peakWindow.start}:00` : "—"}
                  </div>
                  <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>{rhythm.pattern}</div>
                </article>
              )}

              {qualityTrend && (
                <article
                  aria-label={`Calidad de sesión: ${qualityTrend.current}%, tendencia ${qualityTrend.direction}`}
                  style={{
                    background: cd,
                    borderRadius: radius.md,
                    padding: space[2.5],
                    border: `1px solid ${bd}`,
                    gridColumn: rhythm ? "auto" : "span 2",
                  }}
                >
                  <div style={{ ...ty.caption(t3), fontWeight: font.weight.bold, marginBlockEnd: space[1] }}>Calidad sesión</div>
                  <div style={{ display: "flex", alignItems: "center", gap: space[1] }}>
                    <span style={{ ...ty.metric(qualityColor, font.size.xl) }}>{qualityTrend.current}%</span>
                    {qualityTrend.trend !== 0 && (
                      <span style={{ ...ty.caption(qualityTrend.trend > 0 ? semantic.success : semantic.danger), fontWeight: font.weight.bold }}>
                        {qualityTrend.trend > 0 ? "+" : ""}{qualityTrend.trend}
                      </span>
                    )}
                  </div>
                  <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>{qualityTrend.direction}</div>
                </article>
              )}

              {rhythm && (
                <article
                  aria-label={`Mejor día: ${rhythm.bestDay}, ${rhythm.consistency}% de consistencia`}
                  style={{ background: cd, borderRadius: radius.md, padding: space[2.5], border: `1px solid ${bd}` }}
                >
                  <div style={{ ...ty.caption(t3), fontWeight: font.weight.bold, marginBlockEnd: space[1] }}>Mejor día</div>
                  <div style={{ ...ty.metric(t1, font.size.xl) }}>{rhythm.bestDay}</div>
                  <div style={{ ...ty.caption(t3), marginBlockStart: 2 }}>{rhythm.consistency}% consistencia</div>
                </article>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
