"use client";
/* ═══════════════════════════════════════════════════════════════
   CalibrationPlan — onboarding de datos para usuarios nuevos.

   Tres sesiones variando intent (calma/enfoque/energía) antes de
   mostrar el dashboard "real". Layout tipo procedimiento
   instrumentado: mono kickers, corner brackets por paso, progreso
   con ticks de etapa y CTA de 44-min con letra mono.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import Icon from "./Icon";
import { calibrationState } from "../lib/calibrationPlan";
import {
  resolveTheme,
  withAlpha,
  ty,
  font,
  space,
  radius,
  bioSignal,
} from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function CornerBrackets({ color, size = 8 }) {
  const L = size;
  const common = { position: "absolute", inlineSize: L, blockSize: L, pointerEvents: "none" };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 4, insetBlockStart: 4, borderInlineStart: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 4, insetBlockStart: 4, borderInlineEnd: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 4, insetBlockEnd: 4, borderInlineStart: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 4, insetBlockEnd: 4, borderInlineEnd: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
    </>
  );
}

export default function CalibrationPlan({
  totalSessions,
  isDark,
  ac,
  onStart,
}) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const plan = calibrationState(totalSessions);

  const rule = withAlpha(ac, isDark ? 22 : 16);

  return (
    <section
      role="region"
      aria-label="Plan de calibración inicial"
      style={{ paddingBlock: 14, paddingInline: space[5], paddingBlockEnd: 180 }}
    >
      <header style={{ marginBlockEnd: space[4], paddingBlockEnd: space[3], borderBlockEnd: `1px dashed ${rule}` }}>
        <p
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: ac,
            fontWeight: 800,
            margin: 0,
            opacity: 0.9,
          }}
        >
          ▸ Calibración · Paso {plan.currentStep}/3
        </p>
        <h2 style={{ ...ty.heading(t1), margin: 0, marginBlockStart: 4 }}>
          Calibra tu motor neural
        </h2>
        <p style={{ ...ty.body(t2), margin: 0, marginBlockStart: 6 }}>
          Tres sesiones cortas para que el sistema aprenda cómo respondes. Después, tus
          recomendaciones se adaptan a ti — no al promedio.
        </p>
      </header>

      <div
        role="progressbar"
        aria-valuenow={plan.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso de calibración"
        style={{
          position: "relative",
          inlineSize: "100%",
          blockSize: 6,
          background: withAlpha(ac, 10),
          borderRadius: 999,
          overflow: "hidden",
          marginBlockEnd: space[4],
        }}
      >
        <motion.div
          initial={{ inlineSize: 0 }}
          animate={{ inlineSize: `${plan.percent}%` }}
          transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            blockSize: "100%",
            background: `linear-gradient(90deg, ${ac}, ${bioSignal.phosphorCyan})`,
            borderRadius: 999,
            boxShadow: `0 0 10px ${withAlpha(ac, 50)}`,
          }}
        />
        {[33.33, 66.66].map((pct) => (
          <span
            key={pct}
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInlineStart: `${pct}%`,
              insetBlockStart: 0,
              inlineSize: 1,
              blockSize: "100%",
              background: withAlpha(isDark ? "#FFFFFF" : "#000000", 20),
            }}
          />
        ))}
      </div>

      <ol
        aria-label="Pasos de calibración"
        style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[3] }}
      >
        {plan.steps.map((step, i) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const accent = isDone ? semantic.success : isCurrent ? ac : t3;
          const statusLabel = isDone ? "Completado" : isCurrent ? "Actual" : "Pendiente";
          const stepNum = String(i + 1).padStart(2, "0");
          return (
            <motion.li
              key={step.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.08, duration: reduced ? 0 : 0.3 }}
              style={{
                position: "relative",
                background: cd,
                border: `1px solid ${isCurrent ? withAlpha(ac, 40) : bd}`,
                borderRadius: radius.lg,
                padding: space[4],
                display: "flex",
                alignItems: "flex-start",
                gap: space[3],
                opacity: isDone ? 0.72 : 1,
                boxShadow: isCurrent
                  ? `0 0 0 1px ${withAlpha(ac, 22)}, 0 10px 30px -20px ${withAlpha(ac, 80)}`
                  : "none",
                overflow: "hidden",
              }}
            >
              <CornerBrackets color={withAlpha(accent, isCurrent ? 55 : 28)} />

              <div
                aria-hidden
                style={{
                  position: "relative",
                  inlineSize: 44,
                  blockSize: 44,
                  borderRadius: radius.md,
                  background: withAlpha(accent, isCurrent ? 18 : 10),
                  border: `1px solid ${withAlpha(accent, isCurrent ? 40 : 24)}`,
                  color: accent,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8,
                    letterSpacing: 1.3,
                    color: accent,
                    opacity: 0.7,
                    lineHeight: 1,
                  }}
                >
                  {stepNum}
                </span>
                {isDone ? (
                  <Icon name="check" size={16} color={accent} />
                ) : (
                  <Icon name={step.icon} size={16} color={accent} />
                )}
              </div>

              <div style={{ flex: 1, minInlineSize: 0 }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: accent,
                    textTransform: "uppercase",
                    opacity: 0.85,
                    marginBlockEnd: 3,
                  }}
                >
                  ▸ {statusLabel}
                </div>
                <p
                  style={{
                    fontSize: font.size.md,
                    fontWeight: font.weight.bold,
                    color: isDone ? t3 : t1,
                    margin: 0,
                    letterSpacing: -0.2,
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontSize: font.size.sm,
                    color: isDone ? t3 : t2,
                    margin: 0,
                    marginBlockStart: 4,
                    lineHeight: 1.45,
                  }}
                >
                  {step.subtitle}
                </p>
                {isCurrent && (
                  <motion.button
                    whileTap={reduced ? {} : { scale: 0.97 }}
                    onClick={() => onStart?.(step.intent)}
                    aria-label={`Iniciar ${step.title}`}
                    style={{
                      marginBlockStart: space[3],
                      background: `linear-gradient(135deg, ${ac}, ${bioSignal.phosphorCyan})`,
                      color: "#fff",
                      border: "none",
                      borderRadius: radius.md,
                      paddingBlock: 12,
                      paddingInline: 18,
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      minBlockSize: 44,
                      boxShadow: `0 8px 24px -10px ${withAlpha(ac, 90)}`,
                    }}
                  >
                    ▸ Empezar ahora
                  </motion.button>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <p
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.5,
          color: t3,
          marginBlockStart: space[4],
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        ▸ Tip · Hazlas en días distintos para que aprenda tu ritmo circadiano
      </p>
    </section>
  );
}
