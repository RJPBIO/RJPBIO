"use client";
import { Ic } from "./Icons";
import { RingGauge } from "./RingGauge";

/**
 * BioHeader — Top header + 3 neural ring gauges
 * Matches the reference: dark premium biometric dashboard
 */
export function BioHeader({ st, isDark, ac, t1, t2, t3, bd, nSt, theme, onProfile, onSettings }) {
  return (
    <div style={{ padding: "12px 20px 0" }}>
      {/* Top bar — Profile | Title | Settings */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
      }}>
        <button onClick={onProfile} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Ic name="user" size={16} color={t3} />
        </button>
        
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 16, fontWeight: 800, color: t1, letterSpacing: 2,
          }}>
            <span style={{ color: t1 }}>BIO-</span>
            <span style={{ color: ac }}>IGNICIÓN</span>
          </div>
        </div>
        
        <button onClick={onSettings} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Ic name="gear" size={16} color={t3} />
        </button>
      </div>

      {/* 3 Ring Gauges — Enfoque | Calma | Energía */}
      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "flex-start",
        marginBottom: 16,
      }}>
        <RingGauge 
          value={st.capacidad || 0} color="#D97706" 
          label="Energía" size={76} strokeWidth={5} isDark={isDark} 
        />
        <RingGauge 
          value={st.coherencia || 0} color="#3B82F6" 
          label="Enfoque" size={86} strokeWidth={6} isDark={isDark} 
        />
        <RingGauge 
          value={st.resiliencia || 0} color="#22D3A0" 
          label="Calma" size={76} strokeWidth={5} isDark={isDark} 
        />
      </div>

      {/* Neural state badge */}
      <div style={{
        display: "flex", justifyContent: "center", marginBottom: 8,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 14px", borderRadius: 20,
          background: (nSt.color || ac) + "10",
          border: "1px solid " + (nSt.color || ac) + "18",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: nSt.color || ac,
            animation: "shimDot " + (theme.motion ? theme.motion.dot : "2.2s") + " ease infinite",
            boxShadow: "0 0 8px " + (nSt.color || ac) + "50",
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: nSt.color || ac }}>
            {nSt.label}
          </span>
        </div>
      </div>
    </div>
  );
}
