"use client";
import { Ic } from "./Icons";

/**
 * CoreNucleus v9 — The Living Heart of Bio-Ignición
 *
 * Design philosophy: Bioluminescent organism, not a button.
 * - Multi-layered depth: atmosphere → energy field → membrane → core → content
 * - Breathing synchronized to user's respiration (bS scale)
 * - State-reactive glow intensity and color
 * - Organic shape distortion during sessions (nucleusWarp)
 * - Progress ring with luminous trail
 * - Orbital metrics that orbit like electrons
 */
export function CoreNucleus({
  sec, ts, pi, pr, bS = 1, bL, bCnt, pct = 0,
  ac, isDark, t1, t2, t3, cd, bd, theme,
  brain, tp, isActive, isBr,
  onTap, onTouchStart, onTouchEnd,
  st, totalDur,
}) {
  const size = 240;
  const breathScale = isBr ? bS : 1;
  const glowIntensity = theme.isUrgent ? 1.6 : 1;
  const pulseSpeed = theme.motion?.pulse || "4s";
  const isIdle = ts === "idle";
  const isPaused = ts === "paused";

  // Progress ring calculations
  const progress = isActive ? (1 - sec / (totalDur || 120)) : 0;
  const ringR = 112;
  const circumference = 2 * Math.PI * ringR;
  const strokeOffset = circumference * (1 - progress);

  // Format time display
  const mins = Math.floor(sec / 60);
  const secs = sec % 60;
  const timeDisplay = sec > 0 ? (mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${sec}`) : "0";

  return (
    <div style={{
      position: "relative",
      width: size + 80, height: size + 80,
      margin: "0 auto 8px",
    }}>

      {/* ═══ LAYER 1: ATMOSPHERE — outermost energy field ═══ */}
      <div style={{
        position: "absolute", inset: -40,
        borderRadius: "50%",
        background: `radial-gradient(circle at 50% 50%, ${ac}${isActive ? "12" : "06"}, ${ac}04 40%, transparent 70%)`,
        animation: `pu ${pulseSpeed} ease-in-out infinite`,
        transform: `scale(${breathScale * 1.03})`,
        transition: "opacity 1.5s ease",
        opacity: isActive ? 1 : 0.6,
      }} />

      {/* ═══ LAYER 2: ENERGY RINGS — concentric expanding waves ═══ */}
      <div style={{
        position: "absolute", inset: -20,
        borderRadius: "50%",
        border: `1px solid ${ac}${isActive ? "12" : "06"}`,
        animation: `bth ${pulseSpeed} ease-in-out infinite`,
        transition: "all 1.5s ease",
      }} />
      <div style={{
        position: "absolute", inset: -32,
        borderRadius: "50%",
        border: `1px solid ${ac}04`,
        animation: `bth ${pulseSpeed} ease-in-out infinite .6s`,
      }} />
      {isActive && (
        <div style={{
          position: "absolute", inset: -44,
          borderRadius: "50%",
          border: `1px solid ${ac}06`,
          animation: `bth ${pulseSpeed} ease-in-out infinite 1.2s`,
        }} />
      )}

      {/* ═══ LAYER 3: MAIN ORB — the nucleus membrane ═══ */}
      <div
        onClick={onTap}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onTouchStart}
        onMouseUp={onTouchEnd}
        style={{
          position: "absolute",
          inset: 40,
          borderRadius: "50%",
          cursor: "pointer",
          transform: `scale(${tp ? 0.93 : breathScale})`,
          transition: tp
            ? "transform .12s ease"
            : "transform 1.4s cubic-bezier(.4,0,.2,1)",
          // Deep layered background — creates depth illusion
          background: isDark
            ? `radial-gradient(circle at 38% 35%, ${ac}0C, transparent 45%),
               radial-gradient(circle at 62% 65%, ${isDark ? "#6366F1" : "#818CF8"}06, transparent 45%),
               radial-gradient(circle at 50% 50%, #0D1117 0%, #080B12 60%, #060810 100%)`
            : `radial-gradient(circle at 38% 35%, ${ac}08, transparent 45%),
               radial-gradient(circle at 62% 65%, #818CF806, transparent 45%),
               radial-gradient(circle at 50% 50%, #F8FAFC 0%, #F0F2F8 60%, #E8ECF4 100%)`,
          boxShadow: isActive
            ? `0 0 ${50 * glowIntensity}px ${ac}18, 0 0 ${100 * glowIntensity}px ${ac}0A, inset 0 0 ${40 * glowIntensity}px ${ac}06`
            : `0 0 30px ${ac}0A, 0 0 60px ${ac}05, inset 0 0 20px ${ac}03`,
          animation: isIdle
            ? `coreGlow ${pulseSpeed} ease infinite, nucleusWarp 20s ease-in-out infinite`
            : isPaused
            ? `pausePulse 2s ease-in-out infinite`
            : "none",
          border: `1px solid ${ac}${isActive ? "15" : "0A"}`,
          overflow: "hidden",
        }}
      >
        {/* Specular highlight — top left light source */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: "35%", height: "25%", borderRadius: "50%",
          background: `radial-gradient(circle, ${isDark ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.2)"}, transparent)`,
          filter: "blur(10px)",
          pointerEvents: "none",
        }} />

        {/* Breathing inner layers — create volumetric depth */}
        {isBr && <>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `radial-gradient(circle, ${ac}0A, transparent 55%)`,
            transform: `scale(${breathScale})`,
            transition: "transform 1.4s cubic-bezier(.4,0,.2,1)",
          }} />
          <div style={{
            position: "absolute", inset: "10%", borderRadius: "50%",
            background: `radial-gradient(circle, ${ac}10, transparent 55%)`,
            transform: `scale(${breathScale * 1.06})`,
            transition: "transform 1.6s cubic-bezier(.4,0,.2,1) .08s",
          }} />
          <div style={{
            position: "absolute", inset: "25%", borderRadius: "50%",
            background: `radial-gradient(circle, ${ac}14, transparent 50%)`,
            transform: `scale(${breathScale * 1.1})`,
            transition: "transform 1.8s cubic-bezier(.4,0,.2,1) .15s",
          }} />
        </>}

        {/* Idle ambient shimmer */}
        {isIdle && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `radial-gradient(circle at 50% 50%, ${ac}06, transparent 50%)`,
            animation: `pu ${pulseSpeed} ease-in-out infinite`,
          }} />
        )}
      </div>

      {/* ═══ PROGRESS RING SVG ═══ */}
      <svg
        width={size + 80} height={size + 80}
        viewBox="0 0 320 320"
        style={{
          position: "absolute", inset: 0,
          transform: "rotate(-90deg)",
          pointerEvents: "none",
        }}
      >
        {/* Background ring — subtle track */}
        <circle cx="160" cy="160" r={ringR} fill="none"
          stroke={isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.04)"}
          strokeWidth={isActive ? 3 : 1.5}
        />
        {/* Progress fill */}
        {isActive && (
          <circle cx="160" cy="160" r={ringR} fill="none"
            stroke={ac}
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset .95s linear",
              filter: `drop-shadow(0 0 8px ${ac}60)`,
            }}
          />
        )}
        {/* Decorative orbital ring */}
        <circle cx="160" cy="160" r="96" fill="none"
          stroke={ac + "06"}
          strokeWidth="0.8"
          strokeDasharray="3 9"
          style={{ animation: `innerRing ${isActive ? "12s" : "30s"} linear infinite` }}
        />
        {isIdle && (
          <circle cx="160" cy="160" r="126" fill="none"
            stroke={ac + "04"}
            strokeWidth="0.5"
            strokeDasharray="2 12"
            style={{ animation: "innerRing 45s linear infinite reverse" }}
          />
        )}
      </svg>

      {/* ═══ CENTER CONTENT ═══ */}
      <div style={{
        position: "absolute", inset: 40,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2,
      }}>
        {/* Session status label */}
        {isActive && (
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 3.5,
            color: ac, textTransform: "uppercase", marginBottom: 6,
            opacity: 0.7,
          }}>SESIÓN ACTIVA</div>
        )}

        {isPaused && (
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 3.5,
            color: ac, textTransform: "uppercase", marginBottom: 6,
            animation: "pausePulse 2s ease-in-out infinite",
          }}>PAUSADO</div>
        )}

        {/* Timer — large, clear, state-colored */}
        <div style={{
          fontSize: isActive ? 54 : 48,
          fontWeight: 800,
          color: isActive ? ac : t1,
          letterSpacing: "-2.5px",
          lineHeight: 1,
          textShadow: isActive ? `0 0 24px ${ac}25` : "none",
          transition: "color .8s ease, text-shadow .8s ease",
        }}>{timeDisplay}</div>

        {/* Seconds label */}
        {!isActive && (
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 4,
            color: t3, textTransform: "uppercase",
            marginTop: 6, opacity: 0.5,
          }}>SEGUNDOS</div>
        )}

        {/* Breathing label — large and clear during session */}
        {isBr && bL && (
          <div style={{
            fontSize: 15, fontWeight: 800, letterSpacing: 7,
            color: ac, marginTop: 10, opacity: 0.85,
            textShadow: `0 0 16px ${ac}35`,
            transition: "opacity .3s ease",
          }}>{bL}</div>
        )}
        {isBr && bCnt > 0 && (
          <div style={{
            fontSize: 13, fontWeight: 700, color: ac,
            opacity: 0.4, marginTop: 3,
          }}>{bCnt}</div>
        )}

        {/* Idle CTA */}
        {isIdle && (
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 3,
            color: ac, textTransform: "uppercase",
            marginTop: 12, opacity: 0.45,
            animation: "pu 3s ease-in-out infinite",
          }}>TOCA PARA IGNICIÓN</div>
        )}

        {/* Brain message */}
        {isIdle && brain?.message && (
          <div style={{
            fontSize: 10, color: t3, marginTop: 8,
            maxWidth: 140, textAlign: "center",
            lineHeight: 1.4, opacity: 0.35,
          }}>{brain.message}</div>
        )}
      </div>

      {/* ═══ ORBITAL METRICS — Enfoque / Energía / Calma ═══ */}
      {isIdle && <>
        {/* Top — Enfoque */}
        <OrbitalMetric
          value={st?.coherencia || 0} label="Enfoque" color="#3B82F6"
          position="top" isDark={isDark}
        />
        {/* Left — Energía */}
        <OrbitalMetric
          value={st?.capacidad || 0} label="Energía" color="#D97706"
          position="left" isDark={isDark}
        />
        {/* Right — Calma */}
        <OrbitalMetric
          value={st?.resiliencia || 0} label="Calma" color="#10B981"
          position="right" isDark={isDark}
        />
      </>}

      {/* ═══ IGNITION BUTTON — bottom center ═══ */}
      {isIdle && (
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
            border: `1px solid ${ac}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(10px)",
            boxShadow: `0 0 20px ${ac}10`,
            animation: `statusPulse ${pulseSpeed} ease infinite`,
          }}>
            <Ic name="bolt" size={16} color={ac} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OrbitalMetric — A mini metric that orbits the nucleus
 */
function OrbitalMetric({ value, label, color, position, isDark }) {
  const posStyle = position === "top"
    ? { top: -4, left: "50%", transform: "translateX(-50%)" }
    : position === "left"
    ? { left: -8, top: "50%", transform: "translateY(-50%)" }
    : { right: -8, top: "50%", transform: "translateY(-50%)" };

  return (
    <div style={{
      position: "absolute", ...posStyle,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: `${color}${isDark ? "0A" : "08"}`,
        border: `1px solid ${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 14px ${color}12`,
        backdropFilter: "blur(8px)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}</span>
      </div>
      <span style={{
        fontSize: 8, fontWeight: 700, color,
        letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.8,
      }}>{label}</span>
    </div>
  );
}
