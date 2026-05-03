"use client";
import { colors, typography, spacing, radii, surfaces, motion as motionTok } from "../tokens";

// Tarjeta accion contextual cuando hay recomendacion del motor.
// Border accent cyan sutil 0.15 alpha — indicador accionable.
// Pill cyan ancho completo: "Iniciar".

export default function ActionCard({ kicker = "RECOMENDADO AHORA", title, description, onStart }) {
  return (
    <section
      data-v2-action
      style={{
        marginInline: spacing.s24,
        marginBlockEnd: spacing.s24,
        background: colors.bg.raised,
        border: `0.5px solid ${surfaces.accentBorder}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.accent.phosphorCyan,
          fontWeight: typography.weight.medium,
        }}
      >
        {kicker}
      </div>
      <div>
        <h3
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              marginBlockStart: 6,
              marginBlockEnd: 0,
              fontFamily: typography.family,
              fontSize: typography.size.bodyMin,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onStart}
        style={{
          appearance: "none",
          width: "100%",
          padding: "14px 0",
          background: colors.accent.phosphorCyan,
          color: "#08080A",
          border: "none",
          borderRadius: radii.pill,
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          letterSpacing: "0",
          cursor: "pointer",
          transition: `transform ${motionTok.duration.tap}ms ${motionTok.ease.out}`,
        }}
        onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        Iniciar
      </button>
    </section>
  );
}
