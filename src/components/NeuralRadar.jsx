"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL RADAR — Radar 6D · instrumento biométrico
   ═══════════════════════════════════════════════════════════════
   Visualización multidimensional con identidad BIO-IGNICIÓN:
   paleta bio-signal unificada, corner brackets, lattice micro-
   DNA detrás del polar grid, typography mono blueprint.

   Dimensiones → bio-signal tokens:
     Enfoque       → neuralViolet  (cognición)
     Calma         → brand.primary (emerald, equilibrio)
     Energía       → ignition gold (pale gold spark)
     Consistencia  → phosphorCyan  (signal eléctrica)
     Adaptación    → brand.secondary (indigo)
     Resiliencia   → plasmaPink    (pico de ignición)
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo, useId, useRef } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { resolveTheme, withAlpha, font, space, radius, brand, bioSignal } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export default function NeuralRadar({ st, isDark, onZoneClick }) {
  const reduced = useReducedMotion();
  const [activeZone, setActiveZone] = useState(null);
  const detailId = useId();
  const pillsRef = useRef([]);

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

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const ac = brand.primary;

  const data = useMemo(() => [
    { subject: "Enfoque",      value: focus,                      fullMark: 100, color: bioSignal.neuralViolet },
    { subject: "Calma",        value: calm,                       fullMark: 100, color: brand.primary },
    { subject: "Energía",      value: energy,                     fullMark: 100, color: bioSignal.ignition },
    { subject: "Consistencia", value: consistency,                fullMark: 100, color: bioSignal.phosphorCyan },
    { subject: "Adaptación",   value: adaptability,               fullMark: 100, color: brand.secondary },
    { subject: "Resiliencia",  value: Math.max(0, 100 - stress),  fullMark: 100, color: bioSignal.plasmaPink },
  ], [focus, calm, energy, consistency, adaptability, stress]);

  const zones = useMemo(() => ({
    Enfoque: {
      value: focus,
      color: bioSignal.neuralViolet,
      interp:
        focus >= 80 ? "Óptimo para decisiones críticas" :
        focus >= 60 ? "Funcional para trabajo profundo" :
        focus >= 40 ? "Disperso — sesión de enfoque recomendada" :
                      "Bajo — Protocolo Lightning Focus sugerido",
    },
    Calma: {
      value: calm,
      color: brand.primary,
      interp:
        calm >= 80 ? "Regulación excelente. Parasimpático activo" :
        calm >= 60 ? "Calma funcional. Buen baseline" :
        calm >= 40 ? "Tensión detectada. Protocolo de reset sugerido" :
                      "Alta activación simpática. Prioriza calma",
    },
    Energía: {
      value: energy,
      color: bioSignal.ignition,
      interp:
        energy >= 80 ? "Alto rendimiento disponible" :
        energy >= 60 ? "Energía moderada. Suficiente para ejecutar" :
        energy >= 40 ? "Bajo combustible. Pulse Shift recomendado" :
                       "Reservas agotadas. Recuperación necesaria",
    },
    Consistencia: {
      value: consistency,
      color: bioSignal.phosphorCyan,
      interp:
        consistency >= 80 ? "Hábito sólido. Tu cerebro ya espera la sesión" :
        consistency >= 50 ? "Frecuencia aceptable. Intenta no romper la cadena" :
                             "Inconsistente. La constancia multiplica resultados",
    },
    Adaptación: {
      value: adaptability,
      color: brand.secondary,
      interp:
        adaptability >= 70 ? "Alta diversidad de protocolos. Entrenamiento integral" :
        adaptability >= 40 ? "Diversidad moderada. Explora protocolos nuevos" :
                              "Poca variedad. Tu cerebro necesita estímulos diferentes",
    },
    Resiliencia: {
      value: 100 - stress,
      color: bioSignal.plasmaPink,
      interp:
        stress <= 20 ? "Estrés mínimo. Estado óptimo" :
        stress <= 40 ? "Estrés controlado. Sin riesgo" :
        stress <= 60 ? "Estrés elevado. Monitor activo" :
                        "Estrés crítico. Intervención inmediata",
    },
  }), [focus, calm, energy, consistency, adaptability, stress]);

  const perf = useMemo(
    () => Math.round(data.reduce((a, d) => a + d.value, 0) / data.length),
    [data],
  );
  const perfColor = perf >= 70 ? semantic.success : perf >= 45 ? semantic.warning : semantic.danger;
  const perfLabel = perf >= 80 ? "Óptimo" : perf >= 65 ? "Rendimiento" : perf >= 45 ? "Activación" : "Calibrando";

  const handleClick = (zone) => {
    setActiveZone(activeZone === zone ? null : zone);
    if (onZoneClick) onZoneClick(zone);
  };

  const handlePillKey = (e, i) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % data.length;
      pillsRef.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + data.length) % data.length;
      pillsRef.current[prev]?.focus();
    }
  };

  const active = activeZone ? zones[activeZone] : null;

  const summary = data.map((d) => `${d.subject} ${d.value}%`).join(", ");
  const ariaLabel = `Radar neural. Rendimiento global ${perf}%, estado ${perfLabel}. ${summary}.`;

  const cornerStroke = withAlpha(ac, isDark ? 30 : 22);

  // Lattice plus-marks — subtle DNA behind the chart area
  const lattice = useMemo(() => {
    const marks = [];
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 5; r++) {
        marks.push({ id: `${c}-${r}`, x: (c + 0.5) / 7, y: (r + 0.5) / 5 });
      }
    }
    return marks;
  }, []);

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
      <CornerBrackets color={cornerStroke} />

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBlockEnd: 4,
          position: "relative",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: font.weight.black,
              letterSpacing: 3,
              color: t3,
              textTransform: "uppercase",
              marginBlockEnd: 3,
            }}
          >
            ▸ Estado Neural
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              fontWeight: font.weight.black,
              color: t1,
              letterSpacing: -1.5,
              lineHeight: 1,
              textShadow: `0 0 18px ${withAlpha(ac, 18)}`,
            }}
          >
            {perf}
            <span style={{ fontSize: 14, color: t3, marginInlineStart: 2, letterSpacing: 0 }}>%</span>
          </div>
        </div>
        <div
          role="status"
          aria-label={`Estado: ${perfLabel}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingBlock: 4,
            paddingInline: 8,
            borderRadius: radius.full,
            border: `1px solid ${withAlpha(perfColor, 25)}`,
            background: withAlpha(perfColor, 8),
          }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 7,
              blockSize: 7,
              borderRadius: "50%",
              background: perfColor,
              boxShadow: `0 0 8px ${withAlpha(perfColor, 60)}`,
              animation: reduced ? "none" : "shimDot 2s ease infinite",
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.5,
              color: perfColor,
              textTransform: "uppercase",
            }}
          >
            {perfLabel}
          </span>
        </div>
      </header>

      <div style={{ position: "relative", inlineSize: "100%", blockSize: 220, margin: "0 auto" }}>
        {/* Lattice plus-marks */}
        <svg
          aria-hidden="true"
          viewBox="0 0 100 70"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            inlineSize: "100%",
            blockSize: "100%",
            pointerEvents: "none",
            opacity: isDark ? 0.35 : 0.22,
          }}
        >
          <defs>
            <radialGradient id="radar-lattice-mask">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="60%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="radar-lattice-mask-apply">
              <rect width="100" height="70" fill="url(#radar-lattice-mask)" />
            </mask>
          </defs>
          <g mask="url(#radar-lattice-mask-apply)">
            {lattice.map((m) => {
              const cx = m.x * 100;
              const cy = m.y * 70;
              return (
                <path
                  key={m.id}
                  d={`M${cx - 0.8} ${cy} L${cx + 0.8} ${cy} M${cx} ${cy - 0.8} L${cx} ${cy + 0.8}`}
                  stroke={ac}
                  strokeWidth="0.18"
                />
              );
            })}
          </g>
        </svg>

        <div style={{ position: "relative", inlineSize: "100%", blockSize: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
              <PolarGrid stroke={withAlpha(ac, isDark ? 20 : 16)} strokeWidth={0.7} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fontWeight: 700, fill: t2, fontFamily: MONO }}
                style={{ cursor: "pointer" }}
                onClick={(e) => handleClick(e.value)}
              />
              <Radar
                name="Neural"
                dataKey="value"
                stroke={ac}
                fill={ac}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 3, fill: ac, strokeWidth: 0 }}
                animationDuration={reduced ? 0 : 800}
                animationEasing="ease-out"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        role="group"
        aria-label="Dimensiones del radar neural"
        aria-controls={detailId}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
          marginBlockStart: 8,
        }}
      >
        {data.map((d, i) => {
          const isActive = activeZone === d.subject;
          return (
            <button
              key={d.subject}
              ref={(el) => { pillsRef.current[i] = el; }}
              type="button"
              aria-pressed={isActive}
              aria-label={`${d.subject}: ${d.value}%`}
              onClick={() => handleClick(d.subject)}
              onKeyDown={(e) => handlePillKey(e, i)}
              style={{
                minBlockSize: 32,
                paddingBlock: 6,
                paddingInline: 10,
                borderRadius: radius.full,
                border: isActive ? `1.5px solid ${d.color}` : `1px solid ${bd}`,
                background: isActive ? withAlpha(d.color, 12) : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: reduced ? "none" : "all .18s",
                fontFamily: "inherit",
                boxShadow: isActive ? `0 0 0 3px ${withAlpha(d.color, 10)}` : "none",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 3px ${withAlpha(d.color, 20)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = isActive ? `0 0 0 3px ${withAlpha(d.color, 10)}` : "none";
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  inlineSize: 7,
                  blockSize: 7,
                  borderRadius: "50%",
                  background: d.color,
                  boxShadow: isActive ? `0 0 6px ${d.color}` : "none",
                }}
              />
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: isActive ? d.color : t3,
                }}
              >
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
              position: "relative",
              padding: "14px 16px",
              marginBlockStart: 10,
              background: withAlpha(active.color, 10),
              borderRadius: 14,
              border: `1.5px solid ${withAlpha(active.color, 22)}`,
              animation: reduced ? "none" : "fi .3s",
            }}
          >
            {/* Tiny corner brackets on the detail panel */}
            <svg aria-hidden="true" style={{ position: "absolute", insetBlockStart: 4, insetInlineStart: 4, inlineSize: 8, blockSize: 8 }} viewBox="0 0 8 8">
              <path d="M0 8 L0 0 L8 0" stroke={active.color} strokeWidth="1.25" fill="none" opacity="0.5" />
            </svg>
            <svg aria-hidden="true" style={{ position: "absolute", insetBlockStart: 4, insetInlineEnd: 4, inlineSize: 8, blockSize: 8 }} viewBox="0 0 8 8">
              <path d="M0 0 L8 0 L8 8" stroke={active.color} strokeWidth="1.25" fill="none" opacity="0.5" />
            </svg>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBlockEnd: 4,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: font.weight.black,
                  color: active.color,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                ▸ {activeZone}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: font.weight.black,
                  color: active.color,
                  letterSpacing: -1,
                }}
              >
                {active.value}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: t2, lineHeight: 1.55 }}>{active.interp}</div>
          </div>
        )}
      </div>

      {!active && (
        <div
          aria-hidden="true"
          style={{
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: t3,
            textAlign: "center",
            marginBlockStart: 10,
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          ▸ Tap · Explorar dimensión
        </div>
      )}
    </section>
  );
}

function CornerBrackets({ color }) {
  const style = { position: "absolute", inlineSize: 12, blockSize: 12, pointerEvents: "none" };
  return (
    <>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 8, insetInlineStart: 8 }} viewBox="0 0 12 12">
        <path d="M0 12 L0 0 L12 0" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockStart: 8, insetInlineEnd: 8 }} viewBox="0 0 12 12">
        <path d="M0 0 L12 0 L12 12" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 8, insetInlineStart: 8 }} viewBox="0 0 12 12">
        <path d="M12 12 L0 12 L0 0" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
      <svg aria-hidden="true" style={{ ...style, insetBlockEnd: 8, insetInlineEnd: 8 }} viewBox="0 0 12 12">
        <path d="M0 12 L12 12 L12 0" stroke={color} strokeWidth="1.4" fill="none" />
      </svg>
    </>
  );
}
