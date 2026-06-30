"use client";
/* ═══════════════════════════════════════════════════════════════
   ContextualFrame — encuadre pre-sesión generado por el momento.
   ───────────────────────────────────────────────────────────────
   Overlay breve y calmo que antecede a la sesión cuando el contexto
   aporta señal (lunes-AM, viernes-PM, situación declarada, o desviación
   del gemelo). El MECANISMO de la sesión no cambia — solo el encuadre
   cognitivo. Espeja el patrón SafetyOverlay del player (bloquea autoStart
   hasta "Comenzar"). Datos: lib/protocolFraming.
   ═══════════════════════════════════════════════════════════════ */
import { colors, typography, spacing } from "../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function ContextualFrame({ framing, protocolName, onStart, onCancel }) {
  if (!framing) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Encuadre de la sesión"
      data-testid="contextual-frame"
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg.base,
        zIndex: 1150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.s32,
        textAlign: "center",
      }}
    >
      <div style={{ maxInlineSize: 460, display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s24 }}>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: ACCENT,
            fontWeight: typography.weight.medium,
          }}
        >
          {framing.eyebrow}
        </span>

        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 22,
            fontWeight: typography.weight.regular,
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
            color: colors.text.primary,
          }}
        >
          {framing.frame}
        </p>

        {protocolName && (
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.text.muted,
            }}
          >
            {protocolName}
          </span>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s16, marginBlockStart: spacing.s16 }}>
          <button
            type="button"
            onClick={onStart}
            data-testid="contextual-frame-start"
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "14px 40px",
              background: ACCENT,
              color: "#08080A",
              border: "none",
              borderRadius: 999,
              fontFamily: typography.family,
              fontWeight: typography.weight.medium,
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              minBlockSize: 48,
            }}
          >
            Comenzar
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                color: colors.text.muted,
                fontFamily: typography.family,
                fontSize: 13,
                letterSpacing: "0.04em",
                padding: 8,
              }}
            >
              Ahora no
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
