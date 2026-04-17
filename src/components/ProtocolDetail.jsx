"use client";
/* ═══════════════════════════════════════════════════════════════
   PROTOCOL DETAIL — bottom-sheet dialog con preview, predicción
   de impacto, timeline de fases y ciencia profunda.
   Base: pre-visualización mejora adherencia 28% (Gollwitzer 1999).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useId } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { SCIENCE_DEEP } from "../lib/protocols";
import { DIF_LABELS } from "../lib/constants";
import { predictSessionImpact, calcProtoSensitivity } from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, z, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

const PHASE_ICONS = {
  breath: { icon: "breath", label: "Respiración", color: brand.primary },
  body: { icon: "heart", label: "Corporal", color: semantic.danger },
  mind: { icon: "mind", label: "Mental", color: "#8B5CF6" },
  focus: { icon: "focus", label: "Enfoque", color: "#6366F1" },
};

function difColor(dif) {
  if (dif === 1) return semantic.success;
  if (dif === 2) return semantic.warning;
  return semantic.danger;
}

export default function ProtocolDetail({ protocol, st, isDark, onStart, onClose, durMult = 1 }) {
  const reduced = useReducedMotion();
  const dialogRef = useFocusTrap(true, onClose);
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();

  const prediction = useMemo(() => predictSessionImpact(st, protocol), [st, protocol]);
  const sensitivity = useMemo(() => {
    const s = calcProtoSensitivity(st.moodLog);
    return s[protocol.n] || null;
  }, [st.moodLog, protocol.n]);

  const totalDur = Math.round(protocol.d * durMult);
  const phaseTypes = protocol.ph.map((p) => p.ic);
  const uniqueTypes = [...new Set(phaseTypes)];

  const histCount = useMemo(() => {
    return (st.history || []).filter((h) => h.p === protocol.n).length;
  }, [st.history, protocol.n]);

  const predictionPositive = prediction.predictedDelta > 0;
  const predictionColor = predictionPositive ? semantic.success : "#6366F1";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: z.overlay,
        background: "rgba(15,23,42,.4)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
      aria-hidden="true"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={reduced ? { opacity: 0 } : { y: "100%" }}
        animate={reduced ? { opacity: 1 } : { y: 0 }}
        exit={reduced ? { opacity: 0 } : { y: "100%" }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
        style={{
          inlineSize: "100%",
          maxInlineSize: 430,
          maxBlockSize: "88vh",
          background: cd,
          borderStartStartRadius: 26,
          borderStartEndRadius: 26,
          paddingBlock: "18px 36px",
          paddingInline: 20,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden="true"
          style={{
            inlineSize: 36,
            blockSize: 4,
            background: bd,
            borderRadius: 2,
            margin: "0 auto 16px",
          }}
        />

        <header style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBlockEnd: 18 }}>
          <div
            aria-hidden="true"
            style={{
              inlineSize: 52,
              blockSize: 52,
              borderRadius: 16,
              background: withAlpha(protocol.cl, 12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: font.weight.black,
              color: protocol.cl,
              flexShrink: 0,
              border: `1.5px solid ${withAlpha(protocol.cl, 20)}`,
            }}
          >
            {protocol.tg}
          </div>
          <div style={{ flex: 1 }}>
            <h3 id={titleId} style={{ fontSize: 18, fontWeight: font.weight.black, color: t1, margin: 0 }}>
              {protocol.n}
            </h3>
            <div style={{ fontSize: 11, color: t2, marginBlockStart: 2 }}>{protocol.sb}</div>
            <div
              role="group"
              aria-label={`Dificultad: ${DIF_LABELS[(protocol.dif || 1) - 1]}, duración ${totalDur} segundos, ${protocol.ph.length} fases${histCount > 0 ? `, completado ${histCount} veces` : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 8, marginBlockStart: 6 }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: difColor(protocol.dif || 1),
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: withAlpha(difColor(protocol.dif || 1), 10),
                }}
              >
                {DIF_LABELS[(protocol.dif || 1) - 1]}
              </span>
              <span style={{ fontSize: 10, color: t3 }}>{totalDur}s</span>
              <span style={{ fontSize: 10, color: t3 }}>{protocol.ph.length} fases</span>
              {histCount > 0 && (
                <span style={{ fontSize: 10, color: protocol.cl, fontWeight: 700 }}>
                  {histCount}x completado
                </span>
              )}
            </div>
          </div>
        </header>

        <article
          aria-label={`Predicción de impacto: ${predictionPositive ? "+" : ""}${prediction.predictedDelta} puntos, confianza ${prediction.confidence}%. ${prediction.message}`}
          style={{
            background: predictionPositive ? (isDark ? "#0A1A0A" : "#F0FDF4") : isDark ? "#1A1E28" : "#F8FAFC",
            borderRadius: 14,
            padding: 14,
            marginBlockEnd: 14,
            border: `1px solid ${predictionPositive ? withAlpha(semantic.success, 20) : bd}`,
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
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="predict" size={13} color={predictionColor} aria-hidden="true" />
              <span style={{ fontSize: 10, fontWeight: font.weight.black, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>
                Predicción IA
              </span>
            </div>
            <span style={{ fontSize: 18, fontWeight: font.weight.black, color: predictionColor }}>
              {predictionPositive ? "+" : ""}
              {prediction.predictedDelta}
            </span>
          </div>
          <p style={{ fontSize: 10, color: t2, lineHeight: 1.5, margin: 0 }}>{prediction.message}</p>
          <p style={{ fontSize: 10, color: t3, marginBlockStart: 4, margin: 0 }}>
            Confianza: {prediction.confidence}% · {prediction.basis}
          </p>
        </article>

        {sensitivity && (
          <article
            aria-label={`Historial personal: ${sensitivity.avgDelta > 0 ? "+" : ""}${sensitivity.avgDelta} puntos promedio en ${sensitivity.sessions} sesiones. Efectividad: ${sensitivity.eff}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              marginBlockEnd: 14,
              background: withAlpha(sensitivity.avgDelta > 0 ? semantic.success : semantic.danger, 8),
              borderRadius: 12,
              border: `1px solid ${withAlpha(sensitivity.avgDelta > 0 ? semantic.success : semantic.danger, 15)}`,
            }}
          >
            <Icon
              name="fingerprint"
              size={14}
              color={sensitivity.avgDelta > 0 ? semantic.success : semantic.danger}
              aria-hidden="true"
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: sensitivity.avgDelta > 0 ? semantic.success : semantic.danger,
                }}
              >
                Tu historial: {sensitivity.avgDelta > 0 ? "+" : ""}
                {sensitivity.avgDelta} puntos promedio en {sensitivity.sessions} sesiones
              </div>
              <div style={{ fontSize: 10, color: t3, marginBlockStart: 1 }}>
                Efectividad personal: {sensitivity.eff}
              </div>
            </div>
          </article>
        )}

        <div
          role="group"
          aria-label="Tipos de fases"
          style={{ display: "flex", gap: 6, marginBlockEnd: 14 }}
        >
          {uniqueTypes.map((type) => {
            const cfg = PHASE_ICONS[type] || PHASE_ICONS.breath;
            const count = phaseTypes.filter((p) => p === type).length;
            return (
              <div
                key={type}
                role="group"
                aria-label={`${cfg.label}: ${count} fase${count > 1 ? "s" : ""}`}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 10,
                  background: withAlpha(cfg.color, 8),
                  border: `1px solid ${withAlpha(cfg.color, 15)}`,
                  textAlign: "center",
                }}
              >
                <Icon name={cfg.icon} size={14} color={cfg.color} aria-hidden="true" />
                <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginBlockStart: 3 }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: 10, color: t3 }}>{count} fase{count > 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>

        <section aria-label="Timeline de fases" style={{ marginBlockEnd: 16 }}>
          <h4
            style={{
              fontSize: 10,
              fontWeight: font.weight.black,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              marginBlockEnd: 10,
              marginBlockStart: 0,
            }}
          >
            Fases del Protocolo
          </h4>
          <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {protocol.ph.map((phase, i) => {
              const cfg = PHASE_ICONS[phase.ic] || PHASE_ICONS.breath;
              const startS = Math.round(phase.s * durMult);
              const endS = Math.round(phase.e * durMult);
              return (
                <motion.li
                  key={i}
                  initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={reduced ? { duration: 0 } : { delay: i * 0.08 }}
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBlockEnd: 10,
                    position: "relative",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 2,
                      position: "absolute",
                      insetInlineStart: 15,
                      insetBlockStart: 28,
                      insetBlockEnd: i < protocol.ph.length - 1 ? -10 : 0,
                      background: i < protocol.ph.length - 1 ? bd : "transparent",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      inlineSize: 32,
                      blockSize: 32,
                      borderRadius: 10,
                      background: withAlpha(cfg.color, 12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      zIndex: 1,
                      border: `1.5px solid ${withAlpha(cfg.color, 25)}`,
                    }}
                  >
                    <Icon name={cfg.icon} size={13} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: t1 }}>{phase.l}</span>
                      <span style={{ fontSize: 10, color: t3 }}>
                        {startS}–{endS}s
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: cfg.color,
                        marginBlockStart: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {phase.k}
                    </div>
                    {phase.br && (
                      <div
                        aria-label={`Patrón de respiración: inhalar ${phase.br.in}, sostener ${phase.br.h1 || 0}, exhalar ${phase.br.ex}, sostener ${phase.br.h2 || 0} segundos`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          marginBlockStart: 4,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: withAlpha(semantic.success, 8),
                          fontSize: 10,
                          color: semantic.success,
                          fontWeight: 600,
                        }}
                      >
                        <Icon name="breath" size={10} color={semantic.success} aria-hidden="true" />
                        {phase.br.in}-{phase.br.h1 || 0}-{phase.br.ex}-{phase.br.h2 || 0}
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>

        {SCIENCE_DEEP[protocol.id] && (
          <section
            aria-label="Base neurocientífica"
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 14,
              padding: 14,
              marginBlockEnd: 18,
              border: `1px solid ${bd}`,
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: 6, marginBlockEnd: 8 }}>
              <Icon name="mind" size={12} color={protocol.cl} aria-hidden="true" />
              <h4
                style={{
                  fontSize: 10,
                  fontWeight: font.weight.black,
                  letterSpacing: 2,
                  color: protocol.cl,
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Base Neurocientífica
              </h4>
            </header>
            <p style={{ fontSize: 11, color: t2, lineHeight: 1.7, margin: 0 }}>
              {SCIENCE_DEEP[protocol.id]}
            </p>
          </section>
        )}

        <motion.button
          whileTap={reduced ? {} : { scale: 0.96 }}
          onClick={() => onStart(protocol)}
          aria-label={`Iniciar ${protocol.n}, ${totalDur} segundos`}
          style={{
            inlineSize: "100%",
            padding: 16,
            borderRadius: 50,
            background: `linear-gradient(135deg, ${protocol.cl}, ${brand.secondary})`,
            border: "none",
            color: "#fff",
            fontSize: 12,
            fontWeight: font.weight.black,
            cursor: "pointer",
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: `0 4px 18px ${withAlpha(protocol.cl, 28)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="bolt" size={14} color="#fff" aria-hidden="true" />
          INICIAR {protocol.n.toUpperCase()} · {totalDur}s
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
