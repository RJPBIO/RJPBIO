"use client";
/* ═══════════════════════════════════════════════════════════════
   PROTOCOL DETAIL — Clinical protocol brief.
   Phases as hairline timeline, no colored backgrounds.
   Single teal CTA, no gradient, no shadow.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SCIENCE_DEEP } from "../lib/protocols";
import { DIF_LABELS } from "../lib/constants";
import { predictSessionImpact, calcProtoSensitivity } from "../lib/neural";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

const PHASE_LABELS = {
  breath: "Respiración",
  body: "Corporal",
  mind: "Mental",
  focus: "Enfoque",
};

export default function ProtocolDetail({ protocol, st, isDark, onStart, onClose, durMult = 1 }) {
  const { t1, t2, t3, bg } = resolveTheme(isDark);
  const teal = "#0F766E";

  const prediction = useMemo(() => { try { return predictSessionImpact(st, protocol); } catch { return null; } }, [st, protocol]);
  const sensitivity = useMemo(() => { try { const s = calcProtoSensitivity(st.moodLog); return s[protocol.n] || null; } catch { return null; } }, [st.moodLog, protocol.n]);

  const totalDur = Math.round(protocol.d * durMult);
  const histCount = useMemo(() => (st.history || []).filter((h) => h.p === protocol.n).length, [st.history, protocol.n]);
  const difColor = protocol.dif === 1 ? teal : protocol.dif === 2 ? semantic.warning : semantic.danger;
  const predColor = prediction && prediction.predictedDelta > 0 ? teal : t1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "fixed", inset: 0, zIndex: 210,
        background: isDark ? "rgba(12,15,20,.72)" : "rgba(10,14,20,.48)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          width: "100%", maxWidth: 430, maxHeight: "92vh",
          background: bg,
          borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 28, height: 2, background: isDark ? "#232836" : "#E5E7EB",
          margin: "12px auto 0",
        }} />

        {/* Header */}
        <div style={{
          padding: "20px 20px 18px",
          borderBottom: hairline(isDark),
        }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Protocolo · {protocol.tg}</div>
          <div style={{ fontSize: 28, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 8 }}>
            {protocol.n}
          </div>
          <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6, marginBottom: 14 }}>
            {protocol.sb}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>
            <span>{totalDur}s</span>
            <span>{protocol.ph.length} fases</span>
            <span style={{ color: difColor }}>{DIF_LABELS[(protocol.dif || 1) - 1]}</span>
            {histCount > 0 && <span>{histCount}× completado</span>}
          </div>
        </div>

        {/* Prediction row */}
        {prediction && (
          <div style={{
            padding: "18px 20px",
            borderBottom: hairline(isDark),
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>IA · Predicción</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: t2, lineHeight: 1.5, marginBottom: 4 }}>
                {prediction.message}
              </div>
              <div style={{ ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>
                Confianza {prediction.confidence}% · {prediction.basis}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{
                fontSize: 28, fontWeight: 300, color: predColor,
                letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
              }}>
                {prediction.predictedDelta > 0 ? "+" : ""}{prediction.predictedDelta}
              </span>
            </div>
          </div>
        )}

        {/* Personal effectiveness */}
        {sensitivity && (
          <div style={{
            padding: "16px 20px",
            borderBottom: hairline(isDark),
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ ...CAPS, color: t3, marginBottom: 6 }}>Tu historial</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: t2, lineHeight: 1.5 }}>
                {sensitivity.sessions} sesiones · efectividad {sensitivity.eff}
              </div>
            </div>
            <span style={{
              fontSize: 22, fontWeight: 300,
              color: sensitivity.avgDelta > 0 ? teal : semantic.danger,
              letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>
              {sensitivity.avgDelta > 0 ? "+" : ""}{sensitivity.avgDelta}
            </span>
          </div>
        )}

        {/* Phase timeline — hairline rows */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 14 }}>Fases</div>
          {protocol.ph.map((phase, i, arr) => {
            const startS = Math.round(phase.s * durMult);
            const endS = Math.round(phase.e * durMult);
            const typeLabel = PHASE_LABELS[phase.ic] || "Fase";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.28 }}
                style={{
                  display: "flex", gap: 14,
                  padding: "14px 0",
                  borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                }}
              >
                <div style={{
                  width: 28, flexShrink: 0,
                  ...CAPS, color: t3, fontSize: 9, fontVariantNumeric: "tabular-nums",
                  paddingTop: 2,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    marginBottom: 4, gap: 10,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: "-0.01em" }}>
                      {phase.l}
                    </span>
                    <span style={{ ...MICRO, color: t3, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {startS}–{endS}s
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: t2, lineHeight: 1.5, marginBottom: phase.br ? 8 : 0 }}>
                    {phase.k}
                  </div>
                  {phase.br && (
                    <div style={{
                      ...MICRO, color: teal,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      Respiración · {phase.br.in}-{phase.br.h1 || 0}-{phase.br.ex}-{phase.br.h2 || 0}
                    </div>
                  )}
                  <div style={{ ...MICRO, color: t3, marginTop: phase.br ? 4 : 6 }}>
                    {typeLabel}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Science */}
        {SCIENCE_DEEP[protocol.id] && (
          <div style={{
            padding: "20px",
            borderTop: hairline(isDark),
            borderBottom: hairline(isDark),
          }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>Base Neurocientífica</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: t2, lineHeight: 1.7 }}>
              {SCIENCE_DEEP[protocol.id]}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ padding: "20px" }}>
          <button
            onClick={() => onStart(protocol)}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: radius.md,
              background: teal,
              border: `1px solid ${teal}`,
              color: "#FFFFFF",
              ...CAPS, fontSize: 13,
              cursor: "pointer",
              minHeight: 56,
            }}
          >
            Iniciar · {totalDur}s
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
