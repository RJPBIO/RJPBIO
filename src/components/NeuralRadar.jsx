"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL RADAR — Radar chart multidimensional interactivo
   Visualización de estado neural en tiempo real con drill-down.
   Tokens + a11y (role=radiogroup para pills; region wrapper).
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo, useId } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { resolveTheme, withAlpha, ty, font, space, radius, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

export default function NeuralRadar({ st, isDark, onZoneClick }) {
  const reduced = useReducedMotion();
  const [activeZone, setActiveZone] = useState(null);
  const detailId = useId();

  const focus = st.coherencia || 50;
  const calm = st.resiliencia || 50;
  const energy = st.capacidad || 50;
  const stress = Math.max(0, 100 - Math.round((focus + calm) / 2));

  const consistency = useMemo(() => {
    const wd = st.weeklyData || [0, 0, 0, 0, 0, 0, 0];
    return Math.round((wd.filter((v) => v > 0).length / 7) * 100);
  }, [st.weeklyData]);

  const adaptability = useMemo(() => {
    const h = st.history || [];
    if (h.length < 5) return 50;
    const uniqueProtos = new Set(h.slice(-20).map((x) => x.p)).size;
    return Math.min(100, Math.round((uniqueProtos / 14) * 100 + Math.min(20, h.length)));
  }, [st.history]);

  const data = [
    { subject: "Enfoque", value: focus, fullMark: 100, color: "#3B82F6" },
    { subject: "Calma", value: calm, fullMark: 100, color: brand.primary },
    { subject: "Energía", value: energy, fullMark: 100, color: semantic.warning },
    { subject: "Consistencia", value: consistency, fullMark: 100, color: "#8B5CF6" },
    { subject: "Adaptación", value: adaptability, fullMark: 100, color: brand.secondary },
    { subject: "Resiliencia", value: Math.max(0, 100 - stress), fullMark: 100, color: "#EC4899" },
  ];

  const zones = {
    Enfoque: {
      value: focus,
      color: "#3B82F6",
      interp:
        focus >= 80
          ? "Óptimo para decisiones críticas"
          : focus >= 60
          ? "Funcional para trabajo profundo"
          : focus >= 40
          ? "Disperso — sesión de enfoque recomendada"
          : "Bajo — Protocolo Lightning Focus sugerido",
    },
    Calma: {
      value: calm,
      color: brand.primary,
      interp:
        calm >= 80
          ? "Regulación excelente. Parasimpático activo"
          : calm >= 60
          ? "Calma funcional. Buen baseline"
          : calm >= 40
          ? "Tensión detectada. Protocolo de reset sugerido"
          : "Alta activación simpática. Prioriza calma",
    },
    Energía: {
      value: energy,
      color: semantic.warning,
      interp:
        energy >= 80
          ? "Alto rendimiento disponible"
          : energy >= 60
          ? "Energía moderada. Suficiente para ejecutar"
          : energy >= 40
          ? "Bajo combustible. Pulse Shift recomendado"
          : "Reservas agotadas. Recuperación necesaria",
    },
    Consistencia: {
      value: consistency,
      color: "#8B5CF6",
      interp:
        consistency >= 80
          ? "Hábito sólido. Tu cerebro ya espera la sesión"
          : consistency >= 50
          ? "Frecuencia aceptable. Intenta no romper la cadena"
          : "Inconsistente. La constancia multiplica resultados",
    },
    Adaptación: {
      value: adaptability,
      color: brand.secondary,
      interp:
        adaptability >= 70
          ? "Alta diversidad de protocolos. Entrenamiento integral"
          : adaptability >= 40
          ? "Diversidad moderada. Explora protocolos nuevos"
          : "Poca variedad. Tu cerebro necesita estímulos diferentes",
    },
    Resiliencia: {
      value: 100 - stress,
      color: "#EC4899",
      interp:
        stress <= 20
          ? "Estrés mínimo. Estado óptimo"
          : stress <= 40
          ? "Estrés controlado. Sin riesgo"
          : stress <= 60
          ? "Estrés elevado. Monitor activo"
          : "Estrés crítico. Intervención inmediata",
    },
  };

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const ac = brand.primary;

  const perf = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);
  const perfColor = perf >= 70 ? semantic.success : perf >= 45 ? semantic.warning : semantic.danger;
  const perfLabel = perf >= 80 ? "Óptimo" : perf >= 65 ? "Rendimiento" : perf >= 45 ? "Activación" : "Calibrando";

  const handleClick = (zone) => {
    setActiveZone(activeZone === zone ? null : zone);
    if (onZoneClick) onZoneClick(zone);
  };

  const active = activeZone ? zones[activeZone] : null;

  const summary = data.map((d) => `${d.subject} ${d.value}%`).join(", ");
  const ariaLabel = `Radar neural. Rendimiento global ${perf}%, estado ${perfLabel}. ${summary}.`;

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      style={{
        background: cd,
        borderRadius: 22,
        padding: "20px 16px",
        border: `1px solid ${bd}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBlockEnd: 4,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: font.weight.black,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              marginBlockEnd: 3,
            }}
          >
            Estado Neural
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: font.weight.black,
              color: t1,
              letterSpacing: "-1px",
            }}
          >
            {perf}
            <span style={{ fontSize: 14, color: t3 }}>%</span>
          </div>
        </div>
        <div
          role="status"
          aria-label={`Estado: ${perfLabel}`}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 7,
              blockSize: 7,
              borderRadius: "50%",
              background: perfColor,
              animation: reduced ? "none" : "shimDot 2s ease infinite",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 700, color: perfColor }}>{perfLabel}</span>
        </div>
      </header>

      <div aria-hidden="true" style={{ inlineSize: "100%", blockSize: 220, margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke={bd} strokeWidth={0.5} />
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
              animationDuration={reduced ? 0 : 800}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div
        role="radiogroup"
        aria-label="Dimensiones del radar neural"
        aria-controls={detailId}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
          marginBlockStart: 4,
        }}
      >
        {data.map((d) => {
          const isActive = activeZone === d.subject;
          return (
            <button
              key={d.subject}
              role="radio"
              aria-checked={isActive}
              aria-label={`${d.subject}: ${d.value}%`}
              onClick={() => handleClick(d.subject)}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                border: isActive ? `1.5px solid ${d.color}` : `1px solid ${bd}`,
                background: isActive ? withAlpha(d.color, 10) : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: reduced ? "none" : "all .2s",
              }}
            >
              <span
                aria-hidden="true"
                style={{ inlineSize: 6, blockSize: 6, borderRadius: "50%", background: d.color }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? d.color : t3 }}>
                {d.value}%
              </span>
            </button>
          );
        })}
      </div>

      <div id={detailId} aria-live="polite">
        {active && (
          <div
            role="region"
            aria-label={`Detalle ${activeZone}: ${active.value}%. ${active.interp}`}
            style={{
              padding: "12px 14px",
              marginBlockStart: 10,
              background: withAlpha(active.color, 8),
              borderRadius: 14,
              border: `1.5px solid ${withAlpha(active.color, 20)}`,
              animation: reduced ? "none" : "fi .3s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBlockEnd: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: font.weight.black, color: active.color }}>{activeZone}</span>
              <span style={{ fontSize: 18, fontWeight: font.weight.black, color: active.color }}>
                {active.value}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: t2, lineHeight: 1.5 }}>{active.interp}</div>
          </div>
        )}
      </div>

      {!active && (
        <div
          style={{
            fontSize: 10,
            color: t3,
            textAlign: "center",
            marginBlockStart: 8,
            fontStyle: "italic",
          }}
        >
          Toca las dimensiones para explorar cada estado
        </div>
      )}
    </section>
  );
}
