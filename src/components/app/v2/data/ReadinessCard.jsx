"use client";
/* ═══════════════════════════════════════════════════════════════
   ReadinessCard — Disposición: % hacia tu mejor estado personal.
   ───────────────────────────────────────────────────────────────
   Break-pattern: un ANILLO RADIAL con el número al centro ("71%"),
   distinto del gauge-banda del gemelo, la curva del día y el heatmap.
   Complementa al gemelo (norma) anclando al PICO personal.
   Honesto: refleja estado autonómico vs tu mejor rango — no predice la
   calidad de decisiones. Modelo: lib/neural/readinessIndex.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { buildReadinessIndex } from "@/lib/neural/readinessIndex";
import { colors, typography, spacing } from "../tokens";

const CYAN = colors.accent.phosphorCyan;
const AMBER = (colors.semantic && colors.semantic.warning) || "#F59E0B";
const MINT = "#5EEAD4";

const R = 64;
const C = 2 * Math.PI * R;

const eyebrow = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  fontWeight: typography.weight.medium,
};

function ringColor(pct) {
  if (pct >= 70) return MINT;
  if (pct >= 40) return CYAN;
  return AMBER;
}

export default function ReadinessCard({ hrvLog }) {
  const data = useMemo(
    () => buildReadinessIndex(Array.isArray(hrvLog) ? hrvLog : [], { now: Date.now() }),
    [hrvLog]
  );

  if (!data || (!data.available && (!data.maturity || data.maturity.readings === 0))) return null;

  const pct = data.readiness?.pct ?? null;
  const hasPct = pct != null;
  const color = hasPct ? ringColor(pct) : "rgba(255,255,255,0.28)";
  const offset = hasPct ? C * (1 - pct / 100) : C;

  return (
    <section
      data-v2-readiness
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div style={{ ...eyebrow, marginBlockEnd: spacing.s24 }}>DISPOSICIÓN · VS TU PICO</div>

      {!data.available ? (
        <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.body, color: colors.text.secondary, lineHeight: 1.4 }}>
          {data.reason}
        </p>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.s24, flexWrap: "wrap" }}>
          {/* Anillo radial */}
          <div style={{ position: "relative", width: 152, height: 152, flexShrink: 0 }}>
            <svg viewBox="0 0 152 152" width="152" height="152" style={{ display: "block", transform: "rotate(-90deg)" }} aria-hidden="true">
              <circle cx="76" cy="76" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              {hasPct && (
                <circle
                  cx="76"
                  cy="76"
                  r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                  style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
                />
              )}
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {hasPct ? (
                <>
                  <span style={{ fontFamily: typography.family, fontSize: 40, fontWeight: typography.weight.light, color: colors.text.primary, letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {pct}
                    <span style={{ fontSize: 18, color: colors.text.secondary }}>%</span>
                  </span>
                  <span style={{ fontFamily: typography.familyMono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color }}>
                    de tu pico
                  </span>
                </>
              ) : (
                <span style={{ fontFamily: typography.familyMono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.text.muted, textAlign: "center", padding: "0 12px" }}>
                  sin lectura hoy
                </span>
              )}
            </div>
          </div>

          {/* Texto */}
          <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: spacing.s16 }}>
            <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.subtitle, fontWeight: typography.weight.regular, color: colors.text.primary, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
              {data.headline}
            </p>
            {data.readiness && (
              <div style={{ fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.secondary }}>
                Tu lectura <span style={{ color, fontFamily: typography.familyMono }}>{data.readiness.currentRmssd} ms</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}> · </span>
                tu pico <span style={{ color: colors.text.primary, fontFamily: typography.familyMono }}>~{data.readiness.peakRmssd} ms</span>
              </div>
            )}
            <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.muted, lineHeight: 1.5 }}>
              Refleja tu estado autonómico vs tu mejor rango personal. No predice la calidad de tus decisiones.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
