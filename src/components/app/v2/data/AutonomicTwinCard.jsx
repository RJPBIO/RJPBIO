"use client";
/* ═══════════════════════════════════════════════════════════════
   AutonomicTwinCard — tu real vs tu esperado personal.
   ───────────────────────────────────────────────────────────────
   Break-pattern: un GAUGE DE BANDA (instrumento de precisión), distinto
   del heatmap-grid, la curva del día y los sparklines. Muestra el rango
   que TU propio modelo espera hoy y dónde cae tu lectura real. La
   desviación contra tu norma es la señal de intervención.
   Modelo: lib/neural/autonomicTwin (EWMA personal + día-semana, on-device).
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { buildAutonomicTwin } from "@/lib/neural/autonomicTwin";
import { colors, typography, spacing } from "../tokens";

const CYAN = colors.accent.phosphorCyan;
const CYAN_RGB = colors.accent.phosphorCyanRgb || "34, 211, 238";
const AMBER = (colors.semantic && colors.semantic.warning) || "#F59E0B";
const MINT = "#5EEAD4";

const DIR_COLOR = { below: AMBER, within: CYAN, above: MINT };

const eyebrow = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  fontWeight: typography.weight.medium,
};

export default function AutonomicTwinCard({ hrvLog }) {
  const data = useMemo(
    () => buildAutonomicTwin(Array.isArray(hrvLog) ? hrvLog : [], { now: Date.now() }),
    [hrvLog]
  );

  // Sin ninguna medición → no ocupar espacio.
  if (!data || (!data.available && (!data.maturity || data.maturity.readings === 0))) return null;

  return (
    <section
      data-v2-autonomic-twin
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div style={{ ...eyebrow, marginBlockEnd: spacing.s16 }}>GEMELO AUTONÓMICO</div>

      {!data.available ? (
        <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.body, color: colors.text.secondary, lineHeight: 1.4 }}>
          {data.reason}
        </p>
      ) : (
        <TwinBody data={data} />
      )}
    </section>
  );
}

function TwinBody({ data }) {
  const { expected, latest, deviation } = data;
  const dir = deviation?.direction || "within";
  const accent = DIR_COLOR[dir];

  // Dominio del gauge: banda esperada + lectura, con padding.
  const actual = latest?.isRecent ? latest.rmssd : null;
  const vals = [expected.low, expected.high, expected.rmssd];
  if (actual != null) vals.push(actual);
  const rawLo = Math.min(...vals);
  const rawHi = Math.max(...vals);
  const padding = Math.max(4, (rawHi - rawLo) * 0.35);
  const domLo = Math.max(0, rawLo - padding);
  const domHi = rawHi + padding;
  const pct = (v) => {
    const p = ((v - domLo) / Math.max(1e-6, domHi - domLo)) * 100;
    return Math.max(0, Math.min(100, p));
  };

  const bandLeft = pct(expected.low);
  const bandRight = pct(expected.high);
  const expX = pct(expected.rmssd);
  const actX = actual != null ? pct(actual) : null;

  return (
    <>
      <p
        style={{
          margin: 0,
          marginBlockEnd: spacing.s24,
          fontFamily: typography.family,
          fontSize: typography.size.subtitle,
          fontWeight: typography.weight.regular,
          color: colors.text.primary,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
          maxInlineSize: 520,
        }}
      >
        {data.headline}
      </p>

      {/* Gauge de banda esperada */}
      <div style={{ position: "relative", height: 56, marginBlockEnd: spacing.s16 }}>
        {/* track */}
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 26,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        {/* banda esperada */}
        <div
          style={{
            position: "absolute",
            left: `${bandLeft}%`,
            width: `${Math.max(2, bandRight - bandLeft)}%`,
            top: 24,
            height: 8,
            borderRadius: 4,
            background: `rgba(${CYAN_RGB}, 0.22)`,
            border: `1px solid rgba(${CYAN_RGB}, 0.4)`,
          }}
        />
        {/* tick esperado (centro) */}
        <div
          style={{
            position: "absolute",
            left: `${expX}%`,
            top: 20,
            width: 2,
            height: 16,
            marginInlineStart: -1,
            background: `rgba(${CYAN_RGB}, 0.8)`,
            borderRadius: 1,
          }}
        />
        {/* etiqueta esperado */}
        <span
          style={{
            position: "absolute",
            left: `${expX}%`,
            top: 0,
            transform: "translateX(-50%)",
            fontFamily: typography.familyMono,
            fontSize: 10,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          esperado
        </span>
        {/* marcador lectura real */}
        {actX != null && (
          <div
            style={{
              position: "absolute",
              left: `${actX}%`,
              top: 22,
              transform: "translateX(-50%)",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
              border: "2px solid #08080A",
            }}
          />
        )}
        {/* etiqueta lectura */}
        {actX != null && (
          <span
            style={{
              position: "absolute",
              left: `${actX}%`,
              top: 40,
              transform: "translateX(-50%)",
              fontFamily: typography.familyMono,
              fontSize: 10,
              letterSpacing: "0.08em",
              color: accent,
              whiteSpace: "nowrap",
            }}
          >
            tu lectura
          </span>
        )}
      </div>

      {/* Readout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.s16,
          flexWrap: "wrap",
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          marginBlockEnd: data.factors?.length ? spacing.s16 : 0,
        }}
      >
        <span style={{ color: colors.text.secondary }}>
          Esperado <span style={{ color: colors.text.primary, fontFamily: typography.familyMono }}>~{expected.rmssd} ms</span>
        </span>
        {actual != null && (
          <>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ color: colors.text.secondary }}>
              Tu lectura <span style={{ color: accent, fontFamily: typography.familyMono }}>{actual} ms</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ color: accent, fontWeight: typography.weight.medium }}>{deviation.label}</span>
          </>
        )}
      </div>

      {/* Factores explicativos */}
      {data.factors?.length > 0 && (
        <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.muted, lineHeight: 1.5 }}>
          {data.factors.join(" ")}
        </p>
      )}
    </>
  );
}
