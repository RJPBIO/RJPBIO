"use client";
/* ═══════════════════════════════════════════════════════════════
   STREAK SHIELD — Sistema de protección de racha con urgencia
   visual progresiva y sugerencia de sesión rápida
   Base: la aversión a la pérdida es 2.5x más motivadora que
   la ganancia equivalente (Prospect Theory, Kahneman 1979)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";

export default function StreakShield({ st, isDark, onQuickSession }) {
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t3 = isDark ? "#4B5568" : "#94A3B8";
  const bd = isDark ? "#1E2330" : "#E2E8F0";

  const shield = useMemo(() => {
    if (st.streak < 2 || (st.todaySessions || 0) > 0) return null;

    const h = new Date().getHours();
    const hoursLeft = 24 - h;

    // Urgency levels based on time remaining and streak value
    let urgency = "none";
    let color = "#059669";
    let message = "";
    let icon = "shield";

    if (h >= 22) {
      urgency = "critical";
      color = "#DC2626";
      message = `¡${st.streak} días en peligro! Sesión de 60s antes de dormir.`;
      icon = "alert-triangle";
    } else if (h >= 20) {
      urgency = "high";
      color = "#D97706";
      message = `Tu racha de ${st.streak} días necesita una sesión hoy. Quedan ${hoursLeft}h.`;
      icon = "alert";
    } else if (h >= 18) {
      urgency = "medium";
      color = "#6366F1";
      message = `Aún no hiciste tu sesión hoy. Racha: ${st.streak} días.`;
      icon = "clock";
    } else {
      return null; // Too early to warn
    }

    // Calculate streak value in V-Cores (loss aversion framing)
    const streakValue = Math.round(st.streak * 3.5);

    return { urgency, color, message, icon, hoursLeft, streakValue };
  }, [st.streak, st.todaySessions]);

  if (!shield) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          marginBottom: 14,
          borderRadius: 16,
          overflow: "hidden",
          border: `1.5px solid ${shield.color}25`,
          background: `linear-gradient(135deg, ${shield.color}08, ${shield.color}03)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
          }}
        >
          <motion.div
            animate={
              shield.urgency === "critical"
                ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                : {}
            }
            transition={
              shield.urgency === "critical"
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: shield.color + "15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={shield.icon} size={16} color={shield.color} />
          </motion.div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: shield.color,
                lineHeight: 1.4,
              }}
            >
              {shield.message}
            </div>
            <div style={{ fontSize: 10, color: t3, marginTop: 2 }}>
              Valor de racha: ~{shield.streakValue} V-Cores acumulados
            </div>
          </div>
        </div>

        {/* Quick session CTA */}
        {shield.urgency === "critical" && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onQuickSession}
            style={{
              width: "100%",
              padding: "10px",
              background: shield.color + "10",
              border: "none",
              borderTop: `1px solid ${shield.color}15`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Icon name="bolt" size={12} color={shield.color} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: shield.color,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Sesión rápida 60s — Salva tu racha
            </span>
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
