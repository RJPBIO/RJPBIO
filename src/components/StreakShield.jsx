"use client";
/* ═══════════════════════════════════════════════════════════════
   STREAK SHIELD — Clinical alert strip.
   No gradient. No pulsing icon. Hairline accent, single color.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

export default function StreakShield({ st, isDark, onQuickSession }) {
  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const shield = useMemo(() => {
    if (st.streak < 2 || (st.todaySessions || 0) > 0) return null;
    const h = new Date().getHours();
    const hoursLeft = 24 - h;

    if (h >= 22) {
      return {
        urgency: "critical", color: semantic.danger,
        label: "Cadena en riesgo",
        message: `${st.streak}d · sesión de 60s antes de dormir.`,
        hoursLeft,
        streakValue: Math.round(st.streak * 3.5),
      };
    }
    if (h >= 20) {
      return {
        urgency: "high", color: semantic.warning,
        label: "Acción requerida",
        message: `${st.streak}d requieren una sesión. Quedan ${hoursLeft}h.`,
        hoursLeft,
        streakValue: Math.round(st.streak * 3.5),
      };
    }
    if (h >= 18) {
      return {
        urgency: "medium", color: teal,
        label: "Recordatorio",
        message: `Sesión pendiente hoy. Cadena: ${st.streak}d.`,
        hoursLeft,
        streakValue: Math.round(st.streak * 3.5),
      };
    }
    return null;
  }, [st.streak, st.todaySessions]);

  if (!shield) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          marginBottom: 14,
          borderRadius: radius.lg,
          overflow: "hidden",
          background: isDark ? "#141820" : "#FFFFFF",
          border: hairline(isDark),
          borderLeft: `2px solid ${shield.color}`,
        }}
      >
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ ...CAPS, color: shield.color }}>{shield.label}</span>
            <span style={{ ...CAPS, color: t3, fontVariantNumeric: "tabular-nums" }}>{shield.hoursLeft}h</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 400, color: t1, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            {shield.message}
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, color: t3, marginTop: 8, letterSpacing: "0.01em" }}>
            Valor acumulado · {shield.streakValue} V-Cores
          </div>
        </div>

        {shield.urgency === "critical" && (
          <button
            onClick={onQuickSession}
            style={{
              width: "100%",
              padding: "14px 18px",
              background: "transparent",
              border: "none",
              borderTop: hairline(isDark),
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 52,
              color: teal,
              ...CAPS,
            }}
          >
            Iniciar sesión de 60s
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
