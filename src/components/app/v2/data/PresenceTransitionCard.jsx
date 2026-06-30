"use client";
/* ═══════════════════════════════════════════════════════════════
   PresenceTransitionCard — cruzar el umbral del trabajo a casa.
   ───────────────────────────────────────────────────────────────
   Aparece SOLO cuando se detecta el estado de transición (tarde-noche +
   activación simpática sostenida). Propone 3 minutos para pasar del rol
   profesional al personal — mecanismo parasimpático (Reinicio
   Parasimpático) + encuadre "transicion_casa". El outcome no es HRV: es
   tu presencia, que marcas después en el diario (pareja/familia).
   Modelo: lib/neural/presenceTransition.
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { buildPresenceTransition } from "@/lib/neural/presenceTransition";
import { colors, typography, spacing } from "../tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function PresenceTransitionCard({ hrvLog, onNavigate, now }) {
  const data = useMemo(
    () => buildPresenceTransition({ hrvLog: hrvLog || [], now: now ?? Date.now() }),
    [hrvLog, now]
  );

  if (!data || !data.detected) return null;

  return (
    <section
      data-v2-presence-transition
      style={{
        marginInline: spacing.s24,
        marginBlockStart: spacing.s24,
        padding: spacing.s24,
        borderRadius: 18,
        background: "rgba(34,211,238,0.05)",
        border: `0.5px solid ${colors.separator}`,
        borderInlineStart: `2px solid ${ACCENT}`,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: ACCENT,
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s12,
        }}
      >
        Transición a casa
      </div>

      <p
        style={{
          margin: 0,
          marginBlockEnd: spacing.s24,
          fontFamily: typography.family,
          fontSize: typography.size.subtitle,
          fontWeight: typography.weight.regular,
          color: colors.text.primary,
          letterSpacing: "-0.01em",
          lineHeight: 1.35,
          maxInlineSize: 480,
        }}
      >
        {data.message}
      </p>

      <button
        type="button"
        onClick={() =>
          onNavigate &&
          onNavigate({ action: "start-protocol", protocolId: data.protocolId, situation: data.situation })
        }
        style={{
          appearance: "none",
          cursor: "pointer",
          padding: "13px 28px",
          background: ACCENT,
          color: "#08080A",
          border: "none",
          borderRadius: 999,
          fontFamily: typography.family,
          fontSize: 14,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.02em",
          minBlockSize: 48,
        }}
      >
        Cruzar el umbral · 3 min
      </button>

      <p
        style={{
          margin: 0,
          marginBlockStart: spacing.s16,
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          color: colors.text.muted,
          lineHeight: 1.5,
        }}
      >
        Después, marca cómo fue tu presencia en tu diario — eso es lo que de verdad importa.
      </p>
    </section>
  );
}
