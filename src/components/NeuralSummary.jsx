"use client";
import { RingGauge } from "./RingGauge";
import { Ic } from "./Icons";

/**
 * NeuralSummary — Apple Health-style executive overview
 * 3 ring gauges (Focus/Calm/Energy) + BioSignal + brain recommendation
 * This is the FIRST thing the user sees on the Dashboard.
 */
export function NeuralSummary({ st, brain, theme, bioSignal, burnout, ac, isDark, cd, bd, t1, t2, t3, nSt, weeklyTotal }) {
  const stateColor = theme.state === "optimal" ? "#059669" : theme.state === "stressed" ? "#D97706" : theme.state === "critical" ? "#DC2626" : "#6366F1";
  
  return (
    <div style={{
      background: cd,
      borderRadius: 22,
      padding: "20px 16px",
      marginBottom: 14,
      border: `1.5px solid ${stateColor}18`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top accent glow */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 2,
        background: `linear-gradient(90deg, transparent, ${stateColor}35, transparent)`,
      }} />

      {/* Header — State + Rendimiento */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: t3, textTransform: "uppercase", marginBottom: 4 }}>Tu Estado</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: stateColor, lineHeight: 1 }}>{bioSignal.score}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: stateColor, opacity: 0.6 }}>/ 100</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 20,
          background: stateColor + "0C",
          border: `1px solid ${stateColor}15`,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: stateColor, animation: `shimDot ${theme.motion.dot} ease infinite`, boxShadow: `0 0 6px ${stateColor}50` }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: stateColor }}>{nSt.label}</span>
        </div>
      </div>

      {/* Ring Gauges — The Apple Health moment */}
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 18 }}>
        <RingGauge value={st.coherencia || 0} color="#3B82F6" label="Enfoque" size={68} strokeWidth={5} isDark={isDark} />
        <RingGauge value={st.resiliencia || 0} color="#059669" label="Calma" size={68} strokeWidth={5} isDark={isDark} />
        <RingGauge value={st.capacidad || 0} color="#D97706" label="Energía" size={68} strokeWidth={5} isDark={isDark} />
      </div>

      {/* Weekly + Burnout row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{
          flex: 1, padding: "10px 12px", borderRadius: 12,
          background: isDark ? "#1C2030" : "#F6F8FC",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: ac }}>{weeklyTotal}</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>esta semana</div>
        </div>
        <div style={{
          flex: 1, padding: "10px 12px", borderRadius: 12,
          background: isDark ? "#1C2030" : "#F6F8FC",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: burnout.risk === "bajo" ? "#059669" : burnout.risk === "alto" ? "#DC2626" : "#D97706" }}>
            {burnout.risk === "sin datos" ? "—" : burnout.index}
          </div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>burnout idx</div>
        </div>
        <div style={{
          flex: 1, padding: "10px 12px", borderRadius: 12,
          background: isDark ? "#1C2030" : "#F6F8FC",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#D97706" }}>{st.streak || 0}</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>racha</div>
        </div>
      </div>

      {/* Brain recommendation */}
      <div style={{
        padding: "12px 14px", borderRadius: 14,
        background: stateColor + "08",
        border: `1px solid ${stateColor}12`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: stateColor + "15",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic name={theme.isUrgent ? "calm" : theme.state === "optimal" ? "bolt" : "focus"} size={13} color={stateColor} />
          </div>
          <div style={{ fontSize: 11, color: t2, lineHeight: 1.6, fontWeight: 500 }}>
            {theme.isUrgent
              ? brain.reason + ". Protocolo recomendado: " + brain.bestProto.n
              : theme.state === "optimal"
              ? "Estado óptimo. Ventana ideal para decisiones importantes."
              : "Rendimiento funcional. Una ignición más elevaría tu estado."}
          </div>
        </div>
      </div>
    </div>
  );
}
