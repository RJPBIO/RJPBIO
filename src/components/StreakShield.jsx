"use client";
/* ═══════════════════════════════════════════════════════════════
   STREAK SHIELD — protección de racha con instrumento visual
   ═══════════════════════════════════════════════════════════════
   Surface emocional alta: aparece cuando la racha del usuario
   está en riesgo. Identidad BIO-IGNICIÓN vía bio-signal tokens,
   corner brackets, tick marks, streak digit monumental y barra
   de cuenta regresiva de horas.

   Urgencia progresiva por hora del día:
     h 18-19 → medium   (neuralViolet)
     h 20-21 → high     (semantic.warning)
     h 22+   → critical (plasmaPink + ignition pulse + CTAs)

   Base: aversión a la pérdida 2.5× > ganancia equivalente.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, space, radius, brand, bioSignal } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

const HOUR_TOTAL = 24;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function StreakShield({ st, isDark, onQuickSession, onFreezeStreak }) {
  const reduced = useReducedMotion();
  const { t1, t3 } = resolveTheme(isDark);

  const freezesLeft = useMemo(() => {
    const sf = st.streakFreezes || { usedThisMonth: [], lastFreezeMonth: null };
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const used = sf.lastFreezeMonth === monthKey ? sf.usedThisMonth.length : 0;
    return Math.max(0, 2 - used);
  }, [st.streakFreezes]);

  const shield = useMemo(() => {
    if (st.streak < 2 || (st.todaySessions || 0) > 0) return null;

    const h = new Date().getHours();
    const hoursLeft = HOUR_TOTAL - h;

    let urgency = "none";
    let color = semantic.success;
    let message = "";
    let icon = "shield";

    if (h >= 22) {
      urgency = "critical";
      color = bioSignal.plasmaPink;
      message = `¡${st.streak} días en peligro! Sesión de 60s antes de dormir.`;
      icon = "alert-triangle";
    } else if (h >= 20) {
      urgency = "high";
      color = semantic.warning;
      message = `Tu racha de ${st.streak} días necesita una sesión hoy. Quedan ${hoursLeft}h.`;
      icon = "alert";
    } else if (h >= 18) {
      urgency = "medium";
      color = bioSignal.neuralViolet;
      message = `Aún no hiciste tu sesión hoy. Racha: ${st.streak} días.`;
      icon = "clock";
    } else {
      return null;
    }

    const streakValue = Math.round(st.streak * 3.5);
    const dayProgress = Math.min(1, Math.max(0, h / HOUR_TOTAL));
    return { urgency, color, message, icon, hoursLeft, streakValue, dayProgress };
  }, [st.streak, st.todaySessions]);

  if (!shield) return null;

  const ariaLabel = `${shield.message} Valor de racha aproximado: ${shield.streakValue} V-Cores. Quedan ${shield.hoursLeft} horas.`;
  const isCritical = shield.urgency === "critical";

  return (
    <AnimatePresence>
      <motion.aside
        role="alert"
        aria-label={ariaLabel}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        style={{
          position: "relative",
          marginBlockEnd: 14,
          borderRadius: 16,
          overflow: "hidden",
          border: `1.5px solid ${withAlpha(shield.color, 28)}`,
          background: `linear-gradient(135deg, ${withAlpha(shield.color, 10)}, ${withAlpha(shield.color, 3)})`,
          boxShadow: isCritical
            ? `0 0 0 1px ${withAlpha(shield.color, 18)}, 0 12px 40px -12px ${withAlpha(shield.color, 40)}`
            : "none",
        }}
      >
        {/* Corner brackets — brand DNA */}
        <CornerBrackets color={withAlpha(shield.color, 55)} />

        <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
          {/* Hero column: monumental streak digit */}
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingBlock: space[3],
              paddingInline: space[4],
              borderInlineEnd: `1px solid ${withAlpha(shield.color, 16)}`,
              background: `radial-gradient(circle at center, ${withAlpha(shield.color, 10)}, transparent 75%)`,
              minInlineSize: 84,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 3,
                color: withAlpha(shield.color, 80),
                textTransform: "uppercase",
              }}
            >
              ▸ RACHA
            </span>
            <motion.span
              animate={
                isCritical && !reduced
                  ? { textShadow: [`0 0 8px ${shield.color}55`, `0 0 20px ${shield.color}88`, `0 0 8px ${shield.color}55`] }
                  : {}
              }
              transition={isCritical && !reduced ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
              style={{
                fontFamily: MONO,
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: -2,
                color: shield.color,
                lineHeight: 1,
                marginBlockStart: 2,
              }}
            >
              {st.streak}
            </motion.span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 2,
                color: t3,
                marginBlockStart: 2,
                textTransform: "uppercase",
              }}
            >
              {st.streak === 1 ? "día" : "días"}
            </span>
          </div>

          {/* Message + countdown column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingBlock: space[3], paddingInline: space[4], gap: 6, minInlineSize: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
              <motion.div
                aria-hidden="true"
                animate={
                  isCritical && !reduced
                    ? { scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }
                    : {}
                }
                transition={
                  isCritical && !reduced
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
                style={{
                  inlineSize: 28,
                  blockSize: 28,
                  borderRadius: 9,
                  background: withAlpha(shield.color, 15),
                  border: `1px solid ${withAlpha(shield.color, 22)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  filter: isCritical ? `drop-shadow(0 0 8px ${withAlpha(shield.color, 50)})` : "none",
                }}
              >
                <Icon name={shield.icon} size={14} color={shield.color} />
              </motion.div>
              <p style={{ fontSize: 11, fontWeight: 700, color: shield.color, lineHeight: 1.35, margin: 0, flex: 1 }}>
                {shield.message}
              </p>
            </div>

            {/* Blueprint mono status line */}
            <div
              aria-hidden="true"
              style={{
                fontFamily: MONO,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 2,
                color: t3,
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span>▸ V-CORES · ~{shield.streakValue}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ color: shield.color }}>T-{shield.hoursLeft}H</span>
            </div>

            {/* Countdown progress bar — day elapsed */}
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={24}
              aria-valuenow={24 - shield.hoursLeft}
              aria-label={`Transcurridas ${24 - shield.hoursLeft} de 24 horas del día`}
              style={{
                position: "relative",
                blockSize: 4,
                borderRadius: 2,
                background: withAlpha(shield.color, 10),
                overflow: "hidden",
                marginBlockStart: 2,
              }}
            >
              <motion.div
                initial={{ inlineSize: 0 }}
                animate={{ inlineSize: `${shield.dayProgress * 100}%` }}
                transition={{ duration: reduced ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  insetBlockStart: 0,
                  insetInlineStart: 0,
                  blockSize: "100%",
                  background: `linear-gradient(90deg, ${withAlpha(shield.color, 60)}, ${shield.color})`,
                  boxShadow: `0 0 8px ${withAlpha(shield.color, 50)}`,
                }}
              />
              {/* Tick marks at 6h intervals */}
              {[6, 12, 18].map((h) => (
                <span
                  key={h}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    insetBlockStart: 0,
                    insetInlineStart: `${(h / 24) * 100}%`,
                    inlineSize: 1,
                    blockSize: "100%",
                    background: withAlpha(shield.color, 25),
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTAs — always shown when shield renders */}
        <div style={{ display: "flex", borderBlockStart: `1px solid ${withAlpha(shield.color, 16)}` }}>
          <motion.button
            type="button"
            whileTap={reduced ? {} : { scale: 0.97 }}
            onClick={onQuickSession}
            aria-label="Iniciar sesión rápida de 60 segundos"
            style={{
              flex: 1,
              minBlockSize: 44,
              paddingBlock: space[3],
              paddingInline: space[3],
              background: isCritical ? withAlpha(shield.color, 14) : withAlpha(shield.color, 8),
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              outline: "none",
              transition: "background 0.18s ease",
            }}
          >
            <Icon name="bolt" size={13} color={shield.color} aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: font.weight.black, color: shield.color, letterSpacing: 1.3, textTransform: "uppercase", fontFamily: MONO }}>
              Sesión 60s
            </span>
          </motion.button>
          {onFreezeStreak && freezesLeft > 0 && (
            <motion.button
              type="button"
              whileTap={reduced ? {} : { scale: 0.97 }}
              onClick={onFreezeStreak}
              aria-label={`Pausa honesta — congela la racha por hoy sin hacer sesión. Te quedan ${freezesLeft} este mes.`}
              title="No mentir bajo presión. Congela tu racha honestamente."
              style={{
                flex: 1,
                minBlockSize: 44,
                paddingBlock: space[3],
                paddingInline: space[3],
                background: "transparent",
                border: "none",
                borderInlineStart: `1px solid ${withAlpha(shield.color, 16)}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
                outline: "none",
                color: t1,
              }}
            >
              <Icon name="shield" size={13} color={t3} aria-hidden="true" />
              <span style={{ fontSize: 11, fontWeight: font.weight.bold, color: t3, letterSpacing: 1.3, textTransform: "uppercase", fontFamily: MONO }}>
                Pausa · {freezesLeft}
              </span>
            </motion.button>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function CornerBrackets({ color }) {
  const style = { position: "absolute", inlineSize: 10, blockSize: 10, pointerEvents: "none" };
  return (
    <>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 6, insetInlineStart: 6 }} viewBox="0 0 10 10">
        <path d="M0 10 L0 0 L10 0" stroke={color} strokeWidth="1.25" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 6, insetInlineEnd: 6 }} viewBox="0 0 10 10">
        <path d="M0 0 L10 0 L10 10" stroke={color} strokeWidth="1.25" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 6, insetInlineStart: 6 }} viewBox="0 0 10 10">
        <path d="M10 10 L0 10 L0 0" stroke={color} strokeWidth="1.25" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 6, insetInlineEnd: 6 }} viewBox="0 0 10 10">
        <path d="M0 10 L10 10 L10 0" stroke={color} strokeWidth="1.25" fill="none" />
      </svg>
    </>
  );
}
