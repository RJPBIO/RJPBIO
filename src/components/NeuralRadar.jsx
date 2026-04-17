"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL RADAR — Clinical radar, single-channel teal.
   No polychrome. No gradient fills. One instrument, six axes.
   Axis labels at 10px/600/0.12em uppercase.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

export default function NeuralRadar({ st, isDark, onZoneClick }) {
  const [activeZone, setActiveZone] = useState(null);
  const { t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const focus = st.coherencia || 50;
  const calm = st.resiliencia || 50;
  const energy = st.capacidad || 50;
  const stress = Math.max(0, 100 - Math.round((focus + calm) / 2));

  const consistency = useMemo(() => {
    const wd = st.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    return Math.round((wd.filter(v => v > 0).length / 7) * 100);
  }, [st.weeklyData]);

  const adaptability = useMemo(() => {
    const h = st.history || [];
    if (h.length < 5) return 50;
    const uniqueProtos = new Set(h.slice(-20).map(x => x.p)).size;
    return Math.min(100, Math.round((uniqueProtos / 14) * 100 + Math.min(20, h.length)));
  }, [st.history]);

  const data = [
    { subject: "Enfoque", value: focus, fullMark: 100 },
    { subject: "Calma", value: calm, fullMark: 100 },
    { subject: "Energía", value: energy, fullMark: 100 },
    { subject: "Consistencia", value: consistency, fullMark: 100 },
    { subject: "Adaptación", value: adaptability, fullMark: 100 },
    { subject: "Resiliencia", value: Math.max(0, 100 - stress), fullMark: 100 },
  ];

  const interpretations = {
    "Enfoque": focus >= 80 ? "Óptimo para decisiones críticas" : focus >= 60 ? "Funcional para trabajo profundo" : focus >= 40 ? "Disperso — sesión de enfoque recomendada" : "Bajo — Protocolo Lightning Focus sugerido",
    "Calma": calm >= 80 ? "Regulación excelente. Parasimpático activo" : calm >= 60 ? "Calma funcional. Buen baseline" : calm >= 40 ? "Tensión detectada. Protocolo de reset sugerido" : "Alta activación simpática. Prioriza calma",
    "Energía": energy >= 80 ? "Alto rendimiento disponible" : energy >= 60 ? "Energía moderada. Suficiente para ejecutar" : energy >= 40 ? "Bajo combustible. Pulse Shift recomendado" : "Reservas agotadas. Recuperación necesaria",
    "Consistencia": consistency >= 80 ? "Hábito sólido. Tu cerebro ya espera la sesión" : consistency >= 50 ? "Frecuencia aceptable. Intenta no romper la cadena" : "Inconsistente. La constancia multiplica resultados",
    "Adaptación": adaptability >= 70 ? "Alta diversidad de protocolos. Entrenamiento integral" : adaptability >= 40 ? "Diversidad moderada. Explora protocolos nuevos" : "Poca variedad. Tu cerebro necesita estímulos diferentes",
    "Resiliencia": stress <= 20 ? "Estrés mínimo. Estado óptimo" : stress <= 40 ? "Estrés controlado. Sin riesgo" : stress <= 60 ? "Estrés elevado. Monitor activo" : "Estrés crítico. Intervención inmediata",
  };

  const perf = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);
  const perfColor = perf >= 70 ? teal : perf >= 45 ? semantic.warning : semantic.danger;
  const perfLabel = perf >= 80 ? "Óptimo" : perf >= 65 ? "Rendimiento" : perf >= 45 ? "Activación" : "Calibrando";

  const handleClick = (zone) => {
    setActiveZone(activeZone === zone ? null : zone);
    if (onZoneClick) onZoneClick(zone);
  };

  const activeValue = activeZone ? data.find(d => d.subject === activeZone)?.value : null;

  return (
    <div style={{
      background: isDark ? "#141820" : "#FFFFFF",
      borderRadius: radius.lg,
      border: hairline(isDark),
      overflow: "hidden",
    }}>
      {/* Header strip — hairline bottom */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: "18px 20px 16px",
        borderBottom: hairline(isDark),
      }}>
        <div>
          <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>Estado Neural</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 300, color: t1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{perf}</span>
            <span style={{ fontSize: 13, fontWeight: 400, color: t3 }}>%</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: perfColor,
            animation: "shimDot 2.4s ease infinite",
          }} />
          <span style={{ ...CAPS, color: perfColor }}>{perfLabel}</span>
        </div>
      </div>

      {/* Radar — clinical palette */}
      <div style={{ width: "100%", height: 240, padding: "8px 8px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke={isDark ? "#232836" : "#E5E7EB"} strokeWidth={0.5} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fontWeight: 600, fill: t3, letterSpacing: 1 }}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleClick(e.value)}
            />
            <Radar
              name="Neural"
              dataKey="value"
              stroke={teal}
              fill={teal}
              fillOpacity={0.08}
              strokeWidth={1}
              dot={{ r: 2, fill: teal, strokeWidth: 0 }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension row — hairline, no pills */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        borderTop: hairline(isDark),
      }}>
        {data.map((d, i) => {
          const isActive = activeZone === d.subject;
          return (
            <button
              key={d.subject}
              onClick={() => handleClick(d.subject)}
              style={{
                padding: "14px 10px",
                background: isActive ? (isDark ? "#1A1E28" : "#F2F4F7") : "transparent",
                border: "none",
                borderLeft: i % 3 !== 0 ? hairline(isDark) : "none",
                borderTop: i >= 3 ? hairline(isDark) : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ ...CAPS, color: t3, marginBottom: 6, fontSize: 9 }}>{d.subject}</div>
              <div style={{ fontSize: 18, fontWeight: 300, color: isActive ? teal : t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {d.value}<span style={{ fontSize: 10, color: t3, marginLeft: 2 }}>%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Zone interpretation */}
      {activeZone && (
        <div style={{
          padding: "14px 20px",
          borderTop: hairline(isDark),
          animation: "fi 0.28s ease-out",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ ...CAPS, color: teal }}>{activeZone}</span>
            <span style={{ fontSize: 18, fontWeight: 300, color: teal, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{activeValue}%</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 400, color: t2, lineHeight: 1.6 }}>
            {interpretations[activeZone]}
          </div>
        </div>
      )}

      {!activeZone && (
        <div style={{
          padding: "12px 20px 14px",
          borderTop: hairline(isDark),
          fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
          color: t3, textAlign: "center",
        }}>
          Toca una dimensión para inspeccionar
        </div>
      )}
    </div>
  );
}
