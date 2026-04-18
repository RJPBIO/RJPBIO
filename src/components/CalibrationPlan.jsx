"use client";
/* ═══════════════════════════════════════════════════════════════
   CalibrationPlan — onboarding de datos para usuarios nuevos.

   Tres sesiones variando intent (calma/enfoque/energía) antes de
   mostrar el dashboard "real". Abre la pestaña Ignición y, si se
   pasa un `onSelectIntent`, hace focus en el intent del paso.

   Se muestra mientras `totalSessions < 3`. Completado, el Dashboard
   toma el relevo normalmente.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import Icon from "./Icon";
import { calibrationState } from "../lib/calibrationPlan";
import { resolveTheme, withAlpha, ty, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

export default function CalibrationPlan({
  totalSessions,
  isDark,
  ac,
  onStart,           // (intent) => void : abre ignición con el intent del paso
}) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const plan = calibrationState(totalSessions);

  return (
    <section
      role="region"
      aria-label="Plan de calibración inicial"
      style={{ paddingBlock: 14, paddingInline: space[5], paddingBlockEnd: 180 }}
    >
      <header style={{ marginBlockEnd: space[4] }}>
        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: ac, fontWeight: font.weight.bold, margin: 0 }}>
          Paso {plan.currentStep} de 3
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
          style={{ blockSize: "100%", background: ac, borderRadius: 999 }}
        />
      </div>

      <ol
        aria-label="Pasos de calibración"
        style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[3] }}
      >
        {plan.steps.map((step, i) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const accent = isDone ? semantic.success : isCurrent ? ac : t3;
          return (
            <motion.li
              key={step.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.08, duration: reduced ? 0 : 0.3 }}
              style={{
                background: cd,
                border: `1px solid ${isCurrent ? withAlpha(ac, 35) : bd}`,
                borderRadius: radius.lg,
                padding: space[4],
                display: "flex",
                alignItems: "flex-start",
                gap: space[3],
                opacity: isDone ? 0.6 : 1,
                position: "relative",
              }}
            >
              <div
                aria-hidden
                style={{
                  inlineSize: 36,
                  blockSize: 36,
                  borderRadius: radius.md,
                  background: withAlpha(accent, isCurrent ? 18 : 10),
                  color: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: font.weight.bold,
                }}
              >
                {isDone ? "✓" : <Icon name={step.icon} size={16} color={accent} />}
              </div>
              <div style={{ flex: 1, minInlineSize: 0 }}>
                <p style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: isDone ? t3 : t1, margin: 0 }}>
                  {step.title}
                  {isDone && <span style={{ fontSize: font.size.sm, color: semantic.success, marginInlineStart: 8, fontWeight: font.weight.semibold }}>hecho</span>}
                </p>
                <p style={{ fontSize: font.size.sm, color: isDone ? t3 : t2, margin: 0, marginBlockStart: 2, lineHeight: 1.4 }}>
                  {step.subtitle}
                </p>
                {isCurrent && (
                  <motion.button
                    whileTap={reduced ? {} : { scale: 0.97 }}
                    onClick={() => onStart?.(step.intent)}
                    aria-label={`Iniciar ${step.title}`}
                    style={{
                      marginBlockStart: space[3],
                      background: ac,
                      color: "#fff",
                      border: "none",
                      borderRadius: radius.md,
                      padding: `${space[2]}px ${space[4]}px`,
                      fontSize: font.size.sm,
                      fontWeight: font.weight.bold,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Empezar ahora
                  </motion.button>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <p style={{ fontSize: font.size.sm, color: t3, marginBlockStart: space[4], textAlign: "center" }}>
        Tip: hazlas en días distintos para que el motor aprenda tu ritmo circadiano.
      </p>
    </section>
  );
}
