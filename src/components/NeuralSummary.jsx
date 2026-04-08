"use client";
import { RingGauge } from "./RingGauge";
import { Ic } from "./Icons";

/**
 * NeuralSummary v9 — Executive Neural Dashboard
 *
 * Design: Apple Health-inspired but with neural identity.
 * Clear visual hierarchy: Score → Rings → Stats → Recommendation.
 * Each section has breathing room. No information overload.
 * State color drives the entire card's personality.
 */
export function NeuralSummary({ st, brain, theme, bioSignal, burnout, ac, isDark, cd, bd, t1, t2, t3, nSt, weeklyTotal }) {
  const stateColor = theme.state === "optimal" ? "#10B981"
    : theme.state === "stressed" ? "#F59E0B"
    : theme.state === "critical" ? "#EF4444"
    : "#6366F1";

  const burnoutColor = burnout.risk === "bajo" || burnout.risk === "sin datos"
    ? "#10B981" : burnout.risk === "alto" || burnout.risk === "crítico"
    ? "#EF4444" : "#F59E0B";

  return (
    <div style={{
      background: isDark ? "#0C1017" : "#FFFFFF",
      borderRadius: 22,
      padding: "22px 18px",
      marginBottom: 14,
      border: `1px solid ${stateColor}10`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top accent glow line */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 1.5,
        background: `linear-gradient(90deg, transparent, ${stateColor}30, transparent)`,
        borderRadius: 1,
      }} />

      {/* ═══ HEADER — Score + State Badge ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        marginBottom: 20,
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
            color: t3, textTransform: "uppercase", marginBottom: 6,
          }}>Tu Estado Neural</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontSize: 36, fontWeight: 800, color: stateColor,
              lineHeight: 1, letterSpacing: "-1.5px",
            }}>{bioSignal.score}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: stateColor, opacity: 0.4 }}>/ 100</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 20,
          background: `${stateColor}08`,
          border: `1px solid ${stateColor}12`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: stateColor,
            animation: `shimDot ${theme.motion?.dot || "2.2s"} ease infinite`,
            boxShadow: `0 0 6px ${stateColor}40`,
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: stateColor }}>
            {nSt?.label || "Analizando"}
          </span>
        </div>
      </div>

      {/* ═══ RING GAUGES — The signature visual ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-around",
        marginBottom: 20,
        padding: "4px 0",
      }}>
        <RingGauge value={st.coherencia || 0} color="#3B82F6" label="Enfoque" size={72} strokeWidth={5} isDark={isDark} />
        <RingGauge value={st.resiliencia || 0} color="#10B981" label="Calma" size={72} strokeWidth={5} isDark={isDark} />
        <RingGauge value={st.capacidad || 0} color="#D97706" label="Energía" size={72} strokeWidth={5} isDark={isDark} />
      </div>

      {/* ═══ STATS ROW — Weekly / Burnout / Streak ═══ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <StatCard value={weeklyTotal} label="esta semana" color={ac} isDark={isDark} />
        <StatCard
          value={burnout.risk === "sin datos" ? "—" : burnout.index}
          label="burnout idx"
          color={burnoutColor}
          isDark={isDark}
        />
        <StatCard value={st.streak || 0} label="racha" color="#D97706" isDark={isDark} />
      </div>

      {/* ═══ AI RECOMMENDATION ═══ */}
      <div style={{
        padding: "14px 16px", borderRadius: 16,
        background: `${stateColor}06`,
        border: `1px solid ${stateColor}0A`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: `${stateColor}10`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic name={theme.isUrgent ? "calm" : theme.state === "optimal" ? "bolt" : "focus"} size={14} color={stateColor} />
          </div>
          <div style={{
            fontSize: 12, color: t2, lineHeight: 1.6, fontWeight: 500,
          }}>
            {theme.isUrgent
              ? (brain?.reason || "Tu sistema necesita regulación") + ". Protocolo recomendado: " + (brain?.bestProto?.n || "—")
              : theme.state === "optimal"
              ? "Estado óptimo. Ventana ideal para decisiones importantes."
              : "Rendimiento funcional. Una ignición más elevaría tu estado."}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard — Compact metric display
 */
function StatCard({ value, label, color, isDark }) {
  return (
    <div style={{
      flex: 1, padding: "12px 10px", borderRadius: 14,
      background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
      border: `1px solid ${isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"}`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{
        fontSize: 9, fontWeight: 600, color: isDark ? "#3E4A60" : "#8B96AA",
        marginTop: 4, letterSpacing: 0.3,
      }}>{label}</div>
    </div>
  );
}
