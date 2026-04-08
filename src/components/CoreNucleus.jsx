"use client";
import { Ic } from "./Icons";

/**
 * CoreNucleus — The Living Center of Bio-Ignición
 * 
 * A luminous orb that:
 * - Breathes with the user (scale synced to bS)
 * - Glows based on neural state
 * - Shows timer embedded in the center
 * - Has 3 orbital metric indicators (Enfoque/Energía/Calma)
 * - Reacts to touch with spring physics
 * - Changes intensity based on brain urgency
 */
export function CoreNucleus({
  sec, ts, pi, pr, bS = 1, bL, bCnt, pct = 0,
  ac, isDark, t1, t2, t3, cd, bd, theme,
  brain, tp, isActive, isBr,
  onTap, onTouchStart, onTouchEnd,
  st, totalDur,
}) {
  const size = isActive ? 220 : 240;
  const breathScale = isBr ? bS : 1;
  const stateColor = theme.sa || ac;
  const glowIntensity = theme.isUrgent ? 1.4 : 1;
  const pulseSpeed = theme.motion ? theme.motion.pulse : "4s";
  
  // Progress for the ring
  const progress = isActive ? (1 - sec / (totalDur || 120)) : 0;
  const circumference = 2 * Math.PI * 100;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div style={{
      position: "relative",
      width: size + 60, height: size + 60,
      margin: "0 auto 10px",
    }}>
      {/* ═══ AMBIENT GLOW — outer atmosphere ═══ */}
      <div style={{
        position: "absolute", inset: -30,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ac}${isActive ? "18" : "0A"}, transparent 65%)`,
        animation: `pu ${pulseSpeed} ease-in-out infinite`,
        transition: "all 1.5s ease",
        transform: `scale(${breathScale * 1.02})`,
      }} />

      {/* ═══ OUTER ENERGY RING ═══ */}
      <div style={{
        position: "absolute", inset: -15,
        borderRadius: "50%",
        border: `1px solid ${ac}${isActive ? "15" : "08"}`,
        animation: `bth ${pulseSpeed} ease-in-out infinite`,
      }} />
      <div style={{
        position: "absolute", inset: -25,
        borderRadius: "50%",
        border: `1px solid ${ac}06`,
        animation: `bth ${pulseSpeed} ease-in-out infinite .5s`,
      }} />

      {/* ═══ MAIN ORB — the nucleus ═══ */}
      <div
        onClick={onTap}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onTouchStart}
        onMouseUp={onTouchEnd}
        style={{
          position: "absolute", inset: 30,
          borderRadius: "50%",
          cursor: "pointer",
          transform: `scale(${tp ? 0.94 : breathScale})`,
          transition: tp
            ? "transform .15s ease"
            : "transform 1.3s cubic-bezier(.4,0,.2,1)",
          // Multi-layer background for depth
          background: `
            radial-gradient(circle at 35% 35%, ${ac}15, transparent 50%),
            radial-gradient(circle at 65% 65%, ${isDark ? "#6366F1" : "#818CF8"}08, transparent 50%),
            radial-gradient(circle, ${isDark ? "#0D1117" : "#F0F2F8"}, ${isDark ? "#080B12" : "#E8ECF4"})
          `,
          boxShadow: isActive
            ? `0 0 ${40 * glowIntensity}px ${ac}20, 0 0 ${80 * glowIntensity}px ${ac}10, inset 0 0 ${30 * glowIntensity}px ${ac}08`
            : `0 0 30px ${ac}10, 0 0 60px ${ac}06, inset 0 0 20px ${ac}04`,
          animation: ts === "idle" ? `coreGlow ${pulseSpeed} ease infinite` : "none",
          border: `1px solid ${ac}12`,
          overflow: "hidden",
        }}
      >
        {/* Inner light refraction */}
        <div style={{
          position: "absolute", top: "15%", left: "20%",
          width: "30%", height: "20%", borderRadius: "50%",
          background: `radial-gradient(circle, ${ac}08, transparent)`,
          filter: "blur(8px)",
          transform: `scale(${breathScale})`,
          transition: "transform 1.3s ease",
        }} />

        {/* Breathing orbs inside the nucleus */}
        {isBr && <>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `radial-gradient(circle, ${ac}12, transparent 60%)`,
            transform: `scale(${breathScale})`,
            transition: "transform 1.4s cubic-bezier(.4,0,.2,1)",
          }} />
          <div style={{
            position: "absolute", inset: "15%", borderRadius: "50%",
            background: `radial-gradient(circle, ${ac}18, transparent 60%)`,
            transform: `scale(${breathScale * 1.05})`,
            transition: "transform 1.5s cubic-bezier(.4,0,.2,1) .06s",
          }} />
        </>}
      </div>

      {/* ═══ PROGRESS RING SVG ═══ */}
      <svg
        width={size + 60} height={size + 60}
        viewBox="0 0 300 300"
        style={{
          position: "absolute", inset: 0,
          transform: "rotate(-90deg)",
          pointerEvents: "none",
        }}
      >
        {/* Background ring */}
        <circle cx="150" cy="150" r="100" fill="none"
          stroke={isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)"}
          strokeWidth={isActive ? 4 : 2}
        />
        {/* Progress ring */}
        {isActive && (
          <circle cx="150" cy="150" r="100" fill="none"
            stroke={ac}
            strokeWidth={5}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset .95s linear",
              filter: `drop-shadow(0 0 6px ${ac}50)`,
            }}
          />
        )}
        {/* Decorative dashed inner ring */}
        <circle cx="150" cy="150" r="85" fill="none"
          stroke={ac + "08"}
          strokeWidth="1"
          strokeDasharray="4 8"
          style={{ animation: `innerRing ${isActive ? "15s" : "30s"} linear infinite` }}
        />
      </svg>

      {/* ═══ CENTER CONTENT ═══ */}
      <div style={{
        position: "absolute", inset: 30,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2,
      }}>
        {/* Session status */}
        {isActive && (
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 3,
            color: ac, textTransform: "uppercase", marginBottom: 4,
            opacity: 0.8,
          }}>SESIÓN ACTIVA</div>
        )}

        {/* Timer */}
        <div style={{
          fontSize: isActive ? 52 : 48,
          fontWeight: 800,
          color: isActive ? ac : t1,
          letterSpacing: "-3px",
          lineHeight: 1,
          textShadow: isActive ? `0 0 20px ${ac}30` : "none",
        }}>{sec}</div>

        {/* Seconds label */}
        <div style={{
          fontSize: 9, fontWeight: 600, letterSpacing: 5,
          color: t3, textTransform: "uppercase",
          marginTop: 4, opacity: 0.6,
        }}>SEGUNDOS</div>

        {/* Breathing label */}
        {isBr && bL && (
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: 6,
            color: ac, marginTop: 8, opacity: 0.9,
            textShadow: `0 0 12px ${ac}40`,
          }}>{bL}</div>
        )}
        {isBr && bCnt > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: ac,
            opacity: 0.5, marginTop: 2,
          }}>{bCnt}</div>
        )}

        {/* Idle CTA */}
        {ts === "idle" && (
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 3,
            color: ac, textTransform: "uppercase",
            marginTop: 10, opacity: 0.5,
            animation: "pu 3s ease-in-out infinite",
          }}>TOCA PARA IGNICIÓN</div>
        )}

        {/* Brain message below CTA */}
        {ts === "idle" && brain.message && (
          <div style={{
            fontSize: 9, color: t3, marginTop: 6,
            maxWidth: 130, textAlign: "center",
            lineHeight: 1.3, opacity: 0.4,
          }}>{brain.message}</div>
        )}
      </div>

      {/* ═══ ORBITAL INDICATORS — Enfoque / Energía / Calma ═══ */}
      {ts === "idle" && <>
        {/* Top — Enfoque */}
        <div style={{
          position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: isDark ? "rgba(59,130,246,.1)" : "rgba(59,130,246,.08)",
            border: "1px solid rgba(59,130,246,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(59,130,246,.15)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#3B82F6" }}>
              {st.coherencia || 0}
            </span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#3B82F6", letterSpacing: 1, textTransform: "uppercase" }}>
            Enfoque
          </span>
        </div>

        {/* Left — Energía */}
        <div style={{
          position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: isDark ? "rgba(217,119,6,.1)" : "rgba(217,119,6,.08)",
            border: "1px solid rgba(217,119,6,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(217,119,6,.15)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#D97706" }}>
              {st.capacidad || 0}
            </span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#D97706", letterSpacing: 1, textTransform: "uppercase" }}>
            Energía
          </span>
        </div>

        {/* Right — Calma */}
        <div style={{
          position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: isDark ? "rgba(34,211,160,.1)" : "rgba(34,211,160,.08)",
            border: "1px solid rgba(34,211,160,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(34,211,160,.15)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#22D3A0" }}>
              {st.resiliencia || 0}
            </span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#22D3A0", letterSpacing: 1, textTransform: "uppercase" }}>
            Calma
          </span>
        </div>
      </>}

      {/* ═══ PLAY BUTTON — bottom center when idle ═══ */}
      {ts === "idle" && (
        <div style={{
          position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
            border: "1px solid " + (isDark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"),
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 16px " + ac + "15",
          }}>
            <Ic name="bolt" size={16} color={ac} />
          </div>
        </div>
      )}
    </div>
  );
}
