"use client";
import { ChevronRight } from "lucide-react";
import { colors, typography, spacing, radii, surfaces, icon, motion as motionTok } from "../tokens";
import { PROGRAM_TAG, PROGRAM_NAME, PROGRAM_DAYS } from "./copy";

// Ajuste cliente Sub-prompt 2: kicker pasa de cyan 0.7 a blanco
// muted 0.55 — Decision 4 cap de cyan a 4 elementos. El cyan se
// reserva para header dot, RECOMENDADO AHORA, pill Iniciar, nav activo.

// Tarjeta sutil "Hoy: dia X de Y · [Nombre]" con tap a sesion del dia.
// Resolucion 5: solo aparece si hay programa activo.

export default function ActiveProgramCard({ program, onOpen }) {
  if (!program || !program.id) return null;
  const tag = PROGRAM_TAG[program.id] || program.id.slice(0, 2).toUpperCase();
  const name = PROGRAM_NAME[program.id] || program.id;
  const totalDays = PROGRAM_DAYS[program.id] || program.totalDays || 0;
  const today = computeProgramDay(program);

  return (
    <button
      type="button"
      onClick={onOpen}
      data-v2-active-program
      style={{
        appearance: "none",
        textAlign: "start",
        marginInline: spacing.s24,
        marginBlockStart: spacing.s16,
        marginBlockEnd: 0,
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: "inherit",
        cursor: "pointer",
        width: `calc(100% - ${spacing.s24 * 2}px)`,
        transition: `transform ${motionTok.duration.tap}ms ${motionTok.ease.out}`,
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          background: surfaces.iconBox,
          borderRadius: radii.iconBox,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.medium,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        {tag}
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            fontWeight: typography.weight.medium,
          }}
        >
          HOY · DÍA {today} DE {totalDays}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.2,
          }}
        >
          {name}
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={icon.strokeWidth}
        color="rgba(255,255,255,0.32)"
        aria-hidden="true"
      />
    </button>
  );
}

function computeProgramDay(p) {
  if (!p.startedAt) return 1;
  const elapsed = Date.now() - p.startedAt;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor(elapsed / dayMs) + 1);
}
