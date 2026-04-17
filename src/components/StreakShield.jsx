"use client";
/* ═══════════════════════════════════════════════════════════════
   STREAK SHIELD — Sistema de protección de racha con urgencia
   visual progresiva y sugerencia de sesión rápida.
   Base: aversión a la pérdida 2.5x > ganancia equivalente.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

export default function StreakShield({ st, isDark, onQuickSession }) {
  const reduced = useReducedMotion();
  const { t3 } = resolveTheme(isDark);

  const shield = useMemo(() => {
    if (st.streak < 2 || (st.todaySessions || 0) > 0) return null;

    const h = new Date().getHours();
    const hoursLeft = 24 - h;

    let urgency = "none";
    let color = semantic.success;
    let message = "";
    let icon = "shield";

    if (h >= 22) {
      urgency = "critical";
      color = semantic.danger;
      message = `¡${st.streak} días en peligro! Sesión de 60s antes de dormir.`;
      icon = "alert-triangle";
    } else if (h >= 20) {
      urgency = "high";
      color = semantic.warning;
      message = `Tu racha de ${st.streak} días necesita una sesión hoy. Quedan ${hoursLeft}h.`;
      icon = "alert";
    } else if (h >= 18) {
      urgency = "medium";
      color = "#6366F1";
      message = `Aún no hiciste tu sesión hoy. Racha: ${st.streak} días.`;
      icon = "clock";
    } else {
      return null;
    }

    const streakValue = Math.round(st.streak * 3.5);
    return { urgency, color, message, icon, hoursLeft, streakValue };
  }, [st.streak, st.todaySessions]);

  if (!shield) return null;

  const ariaLabel = `${shield.message} Valor de racha aproximado: ${shield.streakValue} V-Cores.`;

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
          marginBlockEnd: 14,
          borderRadius: 16,
          overflow: "hidden",
          border: `1.5px solid ${withAlpha(shield.color, 25)}`,
          background: `linear-gradient(135deg, ${withAlpha(shield.color, 8)}, ${withAlpha(shield.color, 3)})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <motion.div
            aria-hidden="true"
            animate={
              shield.urgency === "critical" && !reduced
                ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={
              shield.urgency === "critical" && !reduced
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            style={{
              inlineSize: 36,
              blockSize: 36,
              borderRadius: 11,
              background: withAlpha(shield.color, 15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={shield.icon} size={16} color={shield.color} />
          </motion.div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: shield.color, lineHeight: 1.4, margin: 0 }}>
              {shield.message}
            </p>
            <p style={{ fontSize: 10, color: t3, marginBlockStart: 2, margin: 0 }}>
              Valor de racha: ~{shield.streakValue} V-Cores acumulados
            </p>
          </div>
        </div>

        {shield.urgency === "critical" && (
          <motion.button
            whileTap={reduced ? {} : { scale: 0.97 }}
            onClick={onQuickSession}
            aria-label="Iniciar sesión rápida de 60 segundos para salvar la racha"
            style={{
              inlineSize: "100%",
              padding: 10,
              background: withAlpha(shield.color, 10),
              border: "none",
              borderBlockStart: `1px solid ${withAlpha(shield.color, 15)}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="bolt" size={12} color={shield.color} aria-hidden="true" />
            <span
              style={{
                fontSize: 10,
                fontWeight: font.weight.black,
                color: shield.color,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Sesión rápida 60s — Salva tu racha
            </span>
          </motion.button>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}
