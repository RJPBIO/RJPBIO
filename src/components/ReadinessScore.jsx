"use client";
/* ═══════════════════════════════════════════════════════════════
   READINESS SCORE — daily composite with personal baseline
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";
import { calcReadiness } from "../lib/readiness";

export default function ReadinessScore({ st, isDark, onOpenHRV }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const r = useMemo(() => calcReadiness({
    hrvHistory: st.hrvLog || [],
    rhrHistory: st.rhrLog || [],
    sleepHours: st.lastSleepHours || null,
    sleepTarget: st.sleepTargetHours || 7.5,
    moodLog: st.moodLog || [],
    sessions: st.history || [],
    currentHRV: (st.hrvLog || []).slice(-1)[0] || null,
  }), [st.hrvLog, st.rhrLog, st.lastSleepHours, st.sleepTargetHours, st.moodLog, st.history]);

  if (r.insufficient) {
    return (
      <section
        aria-label="Readiness score no disponible"
        style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 16, marginBlockEnd: 14 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBlockEnd: 8 }}>
          <Icon name="gauge" size={12} color={t3} aria-hidden="true" />
          <h3 style={{ fontSize: 10, fontWeight: font.weight.black, letterSpacing: 3, color: t3, textTransform: "uppercase", margin: 0 }}>
            Readiness
          </h3>
        </div>
        <p style={{ color: t2, fontSize: 12, margin: 0, marginBlockEnd: 10, lineHeight: 1.5 }}>
          Todavía no hay datos suficientes. Necesitamos medir tu HRV en reposo al menos 7 días, o bien registrar sueño y ánimo diario.
        </p>
        {onOpenHRV && (
          <button
            onClick={onOpenHRV}
            aria-label="Comenzar medición de HRV"
            style={{ background: "transparent", color: brand.primary, border: `1px solid ${withAlpha(brand.primary, 30)}`, borderRadius: 10, paddingBlock: 8, paddingInline: 14, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Iniciar medición HRV →
          </button>
        )}
      </section>
    );
  }

  const ringColor =
    r.score >= 80 ? brand.primary :
    r.score >= 65 ? brand.secondary :
    r.score >= 45 ? semantic.warning :
    semantic.danger;

  const interp =
    r.interpretation === "primed" ? "Recursos elevados" :
    r.interpretation === "ready" ? "Estado estable" :
    r.interpretation === "caution" ? "Precaución" :
    "Prioriza recuperación";

  const ariaLabel = `Readiness ${r.score} de 100. ${interp}. ${r.recommendation?.reason || ""}`;

  return (
    <section
      aria-label={ariaLabel}
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 16, marginBlockEnd: 14 }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="gauge" size={12} color={t3} aria-hidden="true" />
          <h3 style={{ fontSize: 10, fontWeight: font.weight.black, letterSpacing: 3, color: t3, textTransform: "uppercase", margin: 0 }}>
            Readiness
          </h3>
        </div>
        <span style={{ fontSize: 10, color: t3 }}>baseline {r.baselineDays}d</span>
      </header>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBlockEnd: 14 }}>
        <motion.div
          initial={reduced ? { scale: 1 } : { scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={reduced ? {} : { duration: 0.5 }}
          style={{ position: "relative", inlineSize: 72, blockSize: 72, flexShrink: 0 }}
        >
          <svg viewBox="0 0 72 72" style={{ inlineSize: "100%", blockSize: "100%" }} aria-hidden="true">
            <circle cx="36" cy="36" r="30" fill="none" stroke={bd} strokeWidth="6" />
            <motion.circle
              cx="36" cy="36" r="30"
              fill="none" stroke={ringColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={188.5}
              initial={reduced ? { strokeDashoffset: 188.5 * (1 - r.score / 100) } : { strokeDashoffset: 188.5 }}
              animate={{ strokeDashoffset: 188.5 * (1 - r.score / 100) }}
              transition={reduced ? { duration: 0 } : { duration: 0.8 }}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: font.weight.black, color: t1 }}>{r.score}</span>
          </div>
        </motion.div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: font.weight.black, color: ringColor, marginBlockEnd: 4 }}>
            {interp}
          </div>
          <p style={{ color: t2, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            {r.recommendation?.reason}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: 6 }}>
        {r.components.hrv && <Bar label="HRV" score={r.components.hrv.score} t3={t3} />}
        {r.components.rhr && <Bar label="RHR" score={r.components.rhr.score} t3={t3} />}
        {r.components.sleep && <Bar label="Sueño" score={r.components.sleep.score} t3={t3} />}
        {r.components.subjective && <Bar label="Subj." score={r.components.subjective.score} t3={t3} />}
        {r.components.load && <Bar label="Carga" score={r.components.load.score} t3={t3} />}
      </div>
    </section>
  );
}

function Bar({ label, score, t3 }) {
  const color = score >= 70 ? brand.primary : score >= 50 ? semantic.info : score >= 30 ? semantic.warning : semantic.danger;
  return (
    <div
      role="group"
      aria-label={`${label}: ${score} de 100`}
      style={{ textAlign: "center" }}
    >
      <div style={{ blockSize: 3, background: "rgba(127,127,127,.15)", borderRadius: 2, marginBlockEnd: 4, overflow: "hidden" }}>
        <div style={{ blockSize: "100%", inlineSize: `${score}%`, background: color }} />
      </div>
      <div style={{ color: t3, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
