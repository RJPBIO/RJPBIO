"use client";
import { Ic } from "./Icons";

/**
 * BioHeader v9 — Minimal Neural Identity Bar
 *
 * Simplified from v8: removed redundant ring gauges from header
 * (they already exist in CoreNucleus orbital metrics).
 * Now focuses on: brand identity + navigation + state indicator.
 *
 * Design: Clean, breathable, premium. Less is more.
 */
export function BioHeader({ st, isDark, ac, t1, t2, t3, bd, nSt, theme, onProfile, onSettings }) {
  const stateColor = nSt?.color || ac;
  const dotSpeed = theme.motion?.dot || "2.2s";

  return (
    <div style={{ padding: "14px 20px 0" }}>
      {/* Top bar — Profile | Brand | Settings */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14,
      }}>
        {/* Profile button */}
        <button onClick={onProfile} style={{
          width: 38, height: 38, borderRadius: "50%",
          background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
          border: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          <Ic name="user" size={15} color={t3} />
        </button>

        {/* Brand mark */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            fontSize: 15, fontWeight: 800, letterSpacing: 2.5,
            display: "flex", alignItems: "center", gap: 0,
          }}>
            <span style={{ color: t1 }}>BIO-</span>
            <span style={{ color: ac }}>IGNICIÓN</span>
          </div>
          {/* State indicator — inline, minimal */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20,
            background: `${stateColor}08`,
            border: `1px solid ${stateColor}12`,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: stateColor,
              animation: `shimDot ${dotSpeed} ease infinite`,
              boxShadow: `0 0 6px ${stateColor}40`,
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: stateColor, letterSpacing: 0.5 }}>
              {nSt?.label || "Cargando"}
            </span>
          </div>
        </div>

        {/* Settings button */}
        <button onClick={onSettings} style={{
          width: 38, height: 38, borderRadius: "50%",
          background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
          border: `1px solid ${isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          <Ic name="gear" size={15} color={t3} />
        </button>
      </div>
    </div>
  );
}
