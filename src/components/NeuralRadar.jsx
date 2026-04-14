"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL RADAR — Radar chart multidimensional interactivo
   Visualización de estado neural en tiempo real con drill-down
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function NeuralRadar({ st, isDark, onZoneClick }) {
  const [activeZone, setActiveZone] = useState(null);

  const focus = st.coherencia || 50;
  const calm = st.resiliencia || 50;
  const energy = st.capacidad || 50;
  const stress = Math.max(0, 100 - Math.round((focus + calm) / 2));

  // Derivar consistencia y recuperación del historial
  const consistency = useMemo(() => {
    const wd = st.weeklyData || [0,0,0,0,0,0,0];
    return Math.round((wd.filter(v => v > 0).length / 7) * 100);
  }, [st.weeklyData]);

  const adaptability = useMemo(() => {
    const h = st.history || [];
    if (h.length < 5) return 50;
    const uniqueProtos = new Set(h.slice(-20).map(x => x.p)).size;
    return Math.min(100, Math.round((uniqueProtos / 14) * 100 + Math.min(20, h.length)));
  }, [st.history]);

  const data = [
    { subject: "Enfoque", value: focus, fullMark: 100, color: "#3B82F6" },
    { subject: "Calma", value: calm, fullMark: 100, color: "#059669" },
    { subject: "Energía", value: energy, fullMark: 100, color: "#D97706" },
    { subject: "Consistencia", value: consistency, fullMark: 100, color: "#8B5CF6" },
    { subject: "Adaptación", value: adaptability, fullMark: 100, color: "#0D9488" },
    { subject: "Resiliencia", value: Math.max(0, 100 - stress), fullMark: 100, color: "#EC4899" },
  ];

  const zones = {
    "Enfoque": { value: focus, color: "#3B82F6", interp: focus >= 80 ? "Óptimo para decisiones críticas" : focus >= 60 ? "Funcional para trabajo profundo" : focus >= 40 ? "Disperso — sesión de enfoque recomendada" : "Bajo — Protocolo Lightning Focus sugerido" },
    "Calma": { value: calm, color: "#059669", interp: calm >= 80 ? "Regulación excelente. Parasimpático activo" : calm >= 60 ? "Calma funcional. Buen baseline" : calm >= 40 ? "Tensión detectada. Protocolo de reset sugerido" : "Alta activación simpática. Prioriza calma" },
    "Energía": { value: energy, color: "#D97706", interp: energy >= 80 ? "Alto rendimiento disponible" : energy >= 60 ? "Energía moderada. Suficiente para ejecutar" : energy >= 40 ? "Bajo combustible. Pulse Shift recomendado" : "Reservas agotadas. Recuperación necesaria" },
    "Consistencia": { value: consistency, color: "#8B5CF6", interp: consistency >= 80 ? "Hábito sólido. Tu cerebro ya espera la sesión" : consistency >= 50 ? "Frecuencia aceptable. Intenta no romper la cadena" : "Inconsistente. La constancia multiplica resultados" },
    "Adaptación": { value: adaptability, color: "#0D9488", interp: adaptability >= 70 ? "Alta diversidad de protocolos. Entrenamiento integral" : adaptability >= 40 ? "Diversidad moderada. Explora protocolos nuevos" : "Poca variedad. Tu cerebro necesita estímulos diferentes" },
    "Resiliencia": { value: 100 - stress, color: "#EC4899", interp: stress <= 20 ? "Estrés mínimo. Estado óptimo" : stress <= 40 ? "Estrés controlado. Sin riesgo" : stress <= 60 ? "Estrés elevado. Monitor activo" : "Estrés crítico. Intervención inmediata" },
  };

  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const ac = "#059669";

  const perf = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);

  const handleClick = (zone) => {
    setActiveZone(activeZone === zone ? null : zone);
    if (onZoneClick) onZoneClick(zone);
  };

  const active = activeZone ? zones[activeZone] : null;

  return (
    <div style={{ background: cd, borderRadius: 22, padding: "20px 16px", border: `1px solid ${bd}`, position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase", marginBottom: 3 }}>
            Estado Neural
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: t1, letterSpacing: "-1px" }}>
            {perf}<span style={{ fontSize: 14, color: t3 }}>%</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: perf >= 70 ? "#059669" : perf >= 45 ? "#D97706" : "#DC2626", animation: "shimDot 2s ease infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: perf >= 70 ? "#059669" : perf >= 45 ? "#D97706" : "#DC2626" }}>
            {perf >= 80 ? "Óptimo" : perf >= 65 ? "Rendimiento" : perf >= 45 ? "Activación" : "Calibrando"}
          </span>
        </div>
      </div>

      {/* Radar Chart */}
      <div style={{ width: "100%", height: 220, margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke={isDark ? "#2A2E3A" : "#E2E8F0"} strokeWidth={0.5} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fontWeight: 700, fill: t3 }}
              style={{ cursor: "pointer" }}
              onClick={(e) => handleClick(e.value)}
            />
            <Radar
              name="Neural"
              dataKey="value"
              stroke={ac}
              fill={ac}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: ac, strokeWidth: 0 }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 4 }}>
        {data.map((d) => (
          <button
            key={d.subject}
            onClick={() => handleClick(d.subject)}
            style={{
              padding: "4px 10px", borderRadius: 20, border: activeZone === d.subject ? `1.5px solid ${d.color}` : `1px solid ${bd}`,
              background: activeZone === d.subject ? d.color + "10" : "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, transition: "all .2s",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: activeZone === d.subject ? d.color : t3 }}>
              {d.value}%
            </span>
          </button>
        ))}
      </div>

      {/* Zone detail */}
      {active && (
        <div style={{
          padding: "12px 14px", marginTop: 10, background: active.color + "08",
          borderRadius: 14, border: `1.5px solid ${active.color}20`, animation: "fi .3s",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: active.color }}>{activeZone}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: active.color }}>{active.value}%</span>
          </div>
          <div style={{ fontSize: 11, color: t2, lineHeight: 1.5 }}>{active.interp}</div>
        </div>
      )}

      {/* Tap hint */}
      {!active && (
        <div style={{ fontSize: 10, color: t3, textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
          Toca las dimensiones para explorar cada estado
        </div>
      )}
    </div>
  );
}
