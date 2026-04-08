"use client";
import { Ic } from "./Icons";

/**
 * NeuralStatus v9 — Neural Scan Readout
 *
 * Design: Feels like reading a real-time brain scan diagnostic.
 * Two glass panels: Cortical Activity + AI Recommendation.
 * Subtle scanline animation creates "live data" feeling.
 * Hidden during active sessions (screen real estate for breathing).
 */
export function NeuralStatus({ nSt, brain, theme, ac, isDark, t1, t2, t3, ts }) {
  if (ts === "running" || ts === "paused") return null;

  const stateColor = theme.sa || ac;
  const stateLabel = nSt?.label || "Analizando";

  return (
    <div style={{ padding: "0 20px", marginTop: 6 }}>
      {/* ═══ Cortical Activity Card ═══ */}
      <div style={{
        background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"}`,
        borderRadius: 18, padding: "16px 18px", marginBottom: 8,
        position: "relative", overflow: "hidden",
      }}>
        {/* Top accent line — state colored */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
          background: `linear-gradient(90deg, transparent, ${stateColor}20, transparent)`,
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
              color: t3, textTransform: "uppercase", marginBottom: 6,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: "50%",
                background: stateColor,
                animation: `shimDot ${theme.motion?.dot || "2.2s"} ease infinite`,
                boxShadow: `0 0 6px ${stateColor}40`,
              }} />
              Actividad Cortical
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: stateColor,
              letterSpacing: "-.4px", lineHeight: 1,
            }}>{stateLabel}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${stateColor}0A`,
            border: `1px solid ${stateColor}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ic name={theme.isUrgent ? "calm" : "bolt"} size={16} color={stateColor} />
          </div>
        </div>
      </div>

      {/* ═══ Recommendation Card ═══ */}
      <div style={{
        background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"}`,
        borderRadius: 18, padding: "16px 18px", marginBottom: 8,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
          color: t3, textTransform: "uppercase", marginBottom: 6,
        }}>Recomendación Neural</div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: t1,
          letterSpacing: "-.2px", lineHeight: 1.5,
        }}>
          {brain?.message || (theme.isUrgent
            ? "Tu sistema necesita regulación. Inicia una ignición."
            : theme.state === "optimal"
            ? "Estado óptimo — ventana de alto rendimiento activa."
            : "Una ignición más elevaría tu estado neural.")}
        </div>
      </div>
    </div>
  );
}
