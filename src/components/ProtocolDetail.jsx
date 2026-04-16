"use client";
/* ═══════════════════════════════════════════════════════════════
   PROTOCOL DETAIL — Vista expandida de protocolo con preview,
   predicción de impacto, timeline de fases y ciencia profunda
   Base: pre-visualizar el protocolo mejora adherencia un 28%
   (Implementation Intentions, Gollwitzer 1999)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { SCIENCE_DEEP } from "../lib/protocols";
import { DIF_LABELS } from "../lib/constants";
import { predictSessionImpact, calcProtoSensitivity } from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius } from "../lib/theme";

const PHASE_ICONS = {
  breath: { icon: "breath", label: "Respiración", color: "#059669" },
  body: { icon: "heart", label: "Corporal", color: "#DC2626" },
  mind: { icon: "mind", label: "Mental", color: "#8B5CF6" },
  focus: { icon: "focus", label: "Enfoque", color: "#6366F1" },
};

export default function ProtocolDetail({ protocol, st, isDark, onStart, onClose, durMult = 1 }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const prediction = useMemo(() => { try { return predictSessionImpact(st, protocol); } catch (e) { console.warn("[BIO] Prediction error:", e.message); return null; } }, [st, protocol]);
  const sensitivity = useMemo(() => { try { const s = calcProtoSensitivity(st.moodLog); return s[protocol.n] || null; } catch (e) { return null; } }, [st.moodLog, protocol.n]);

  const totalDur = Math.round(protocol.d * durMult);
  const phaseTypes = protocol.ph.map((p) => p.ic);
  const uniqueTypes = [...new Set(phaseTypes)];

  const histCount = useMemo(() => {
    return (st.history || []).filter((h) => h.p === protocol.n).length;
  }, [st.history, protocol.n]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "rgba(15,23,42,.4)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: "100%",
          maxWidth: 430,
          maxHeight: "88vh",
          background: cd,
          borderRadius: "26px 26px 0 0",
          padding: "18px 20px 36px",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: bd,
            borderRadius: 2,
            margin: "0 auto 16px",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: protocol.cl + "12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: protocol.cl,
              flexShrink: 0,
              border: `1.5px solid ${protocol.cl}20`,
            }}
          >
            {protocol.tg}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: t1, margin: 0 }}>
              {protocol.n}
            </h3>
            <div style={{ fontSize: 11, color: t2, marginTop: 2 }}>{protocol.sb}</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: protocol.dif === 1 ? "#059669" : protocol.dif === 2 ? "#D97706" : "#DC2626",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background:
                    (protocol.dif === 1 ? "#059669" : protocol.dif === 2 ? "#D97706" : "#DC2626") +
                    "10",
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
        </div>

        {/* Prediction card */}
        {prediction && <div
          style={{
            background:
              prediction.predictedDelta > 0
                ? isDark
                  ? "#0A1A0A"
                  : "#F0FDF4"
                : isDark
                ? "#1A1E28"
                : "#F8FAFC",
            borderRadius: 14,
            padding: "14px",
            marginBottom: 14,
            border: `1px solid ${prediction.predictedDelta > 0 ? "#05966920" : bd}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon
                name="predict"
                size={13}
                color={prediction.predictedDelta > 0 ? "#059669" : "#6366F1"}
              />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>
                Predicción IA
              </span>
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: prediction.predictedDelta > 0 ? "#059669" : "#6366F1",
              }}
            >
              {prediction.predictedDelta > 0 ? "+" : ""}
              {prediction.predictedDelta}
            </span>
          </div>
          <div style={{ fontSize: 10, color: t2, lineHeight: 1.5 }}>{prediction.message}</div>
          <div style={{ fontSize: 10, color: t3, marginTop: 4 }}>
            Confianza: {prediction.confidence}% · {prediction.basis}
          </div>
        </div>}

        {/* Personal effectiveness */}
        {sensitivity && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              marginBottom: 14,
              background: sensitivity.avgDelta > 0 ? "#05966908" : "#DC262608",
              borderRadius: 12,
              border: `1px solid ${sensitivity.avgDelta > 0 ? "#05966915" : "#DC262615"}`,
            }}
          >
            <Icon
              name="fingerprint"
              size={14}
              color={sensitivity.avgDelta > 0 ? "#059669" : "#DC2626"}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: sensitivity.avgDelta > 0 ? "#059669" : "#DC2626",
                }}
              >
                Tu historial: {sensitivity.avgDelta > 0 ? "+" : ""}
                {sensitivity.avgDelta} puntos promedio en {sensitivity.sessions} sesiones
              </div>
              <div style={{ fontSize: 10, color: t3, marginTop: 1 }}>
                Efectividad personal: {sensitivity.eff}
              </div>
            </div>
          </div>
        )}

        {/* Phase types overview */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {uniqueTypes.map((type) => {
            const cfg = PHASE_ICONS[type] || PHASE_ICONS.breath;
            const count = phaseTypes.filter((t) => t === type).length;
            return (
              <div
                key={type}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 10,
                  background: cfg.color + "08",
                  border: `1px solid ${cfg.color}15`,
                  textAlign: "center",
                }}
              >
                <Icon name={cfg.icon} size={14} color={cfg.color} />
                <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 3 }}>
                  {cfg.label}
                </div>
                <div style={{ fontSize: 10, color: t3 }}>{count} fase{count > 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>

        {/* Phase Timeline */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Fases del Protocolo
          </div>
          {protocol.ph.map((phase, i) => {
            const cfg = PHASE_ICONS[phase.ic] || PHASE_ICONS.breath;
            const startS = Math.round(phase.s * durMult);
            const endS = Math.round(phase.e * durMult);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 10,
                  position: "relative",
                }}
              >
                {/* Timeline line */}
                <div
                  style={{
                    width: 2,
                    position: "absolute",
                    left: 15,
                    top: 28,
                    bottom: i < protocol.ph.length - 1 ? -10 : 0,
                    background: i < protocol.ph.length - 1 ? bd : "transparent",
                  }}
                />
                {/* Phase dot */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: cfg.color + "12",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                    border: `1.5px solid ${cfg.color}25`,
                  }}
                >
                  <Icon name={cfg.icon} size={13} color={cfg.color} />
                </div>
                {/* Phase content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: t1 }}>
                      {phase.l}
                    </span>
                    <span style={{ fontSize: 10, color: t3 }}>
                      {startS}–{endS}s
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: cfg.color,
                      marginTop: 3,
                      lineHeight: 1.4,
                    }}
                  >
                    {phase.k}
                  </div>
                  {phase.br && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "#05966908",
                        fontSize: 10,
                        color: "#059669",
                        fontWeight: 600,
                      }}
                    >
                      <Icon name="breath" size={10} color="#059669" />
                      {phase.br.in}-{phase.br.h1 || 0}-{phase.br.ex}-{phase.br.h2 || 0}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Science section */}
        {SCIENCE_DEEP[protocol.id] && (
          <div
            style={{
              background: isDark ? "#1A1E28" : "#F8FAFC",
              borderRadius: 14,
              padding: "14px",
              marginBottom: 18,
              border: `1px solid ${bd}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Icon name="mind" size={12} color={protocol.cl} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: protocol.cl,
                  textTransform: "uppercase",
                }}
              >
                Base Neurocientífica
              </span>
            </div>
            <div style={{ fontSize: 11, color: t2, lineHeight: 1.7 }}>
              {SCIENCE_DEEP[protocol.id]}
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onStart(protocol)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 50,
            background: `linear-gradient(135deg, ${protocol.cl}, #0D9488)`,
            border: "none",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: `0 4px 18px ${protocol.cl}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="bolt" size={14} color="#fff" />
          INICIAR {protocol.n.toUpperCase()} · {totalDur}s
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
