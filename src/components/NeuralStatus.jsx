"use client";

/**
 * NeuralStatus — Bottom glass cards
 * Shows: Actividad Cortical + Recomendación
 * Matches reference: frosted glass panels below the core
 */
export function NeuralStatus({ nSt, brain, theme, ac, isDark, t1, t2, t3, ts }) {
  if (ts === "running" || ts === "paused") return null;
  
  const stateColor = theme.sa || ac;

  return (
    <div style={{ padding: "0 20px", marginTop: 8 }}>
      {/* Actividad Cortical */}
      <div style={{
        background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid " + (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"),
        borderRadius: 16, padding: "14px 18px", marginBottom: 8,
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
          color: t3, textTransform: "uppercase", marginBottom: 4,
        }}>Actividad Cortical:</div>
        <div style={{
          fontSize: 18, fontWeight: 800, color: stateColor,
          letterSpacing: "-.3px",
        }}>{nSt.label}</div>
      </div>

      {/* Recomendación */}
      <div style={{
        background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid " + (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"),
        borderRadius: 16, padding: "14px 18px", marginBottom: 8,
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
          color: t3, textTransform: "uppercase", marginBottom: 4,
        }}>Recomendación:</div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: t1,
          letterSpacing: "-.2px", lineHeight: 1.4,
        }}>
          {brain.message || (theme.isUrgent 
            ? "Mantener Respiración" 
            : theme.state === "optimal" 
            ? "Estado Óptimo — Ventana de Alto Rendimiento"
            : "Una Ignición Más Elevaría tu Estado")}
        </div>
      </div>
    </div>
  );
}
