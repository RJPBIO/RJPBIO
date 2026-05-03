"use client";
import { colors, typography, spacing, radii, surfaces } from "../tokens";
import { PROGRAM_TAG, PROGRAM_NAME, PROGRAM_DAYS } from "../home/copy";
import { ACTIVE_PROGRAM_DESCRIPTOR } from "./fixtures";

// Card de programa activo: badge + title + descriptor + progress bar 2px + 2 acciones texto.

export default function ActiveProgramFull({ program, onSeeToday, onAbandon }) {
  if (!program || !program.id) return null;
  const tag = PROGRAM_TAG[program.id] || program.id.slice(0, 2).toUpperCase();
  const name = PROGRAM_NAME[program.id] || program.id;
  const totalDays = PROGRAM_DAYS[program.id] || program.totalDays || 0;
  const today = computeProgramDay(program);
  const descriptor = `Día ${today} de ${totalDays} · ${ACTIVE_PROGRAM_DESCRIPTOR[program.id] || ""}`;
  const pct = totalDays ? Math.min(100, Math.max(0, Math.round((today / totalDays) * 100))) : 0;

  return (
    <div
      data-v2-active-program-full
      style={{
        marginBlockStart: spacing.s8,
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
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
            {name}
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4,
            }}
          >
            {descriptor}
          </p>
        </div>
      </div>

      <div
        aria-label={`Progreso ${pct}%`}
        style={{
          height: 2,
          width: "100%",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: colors.accent.phosphorCyan,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.s16,
        }}
      >
        <TextButton onClick={onSeeToday}>VER DÍA HOY</TextButton>
        <span aria-hidden="true" style={{ width: 1, height: 12, background: colors.separator }} />
        <TextButton onClick={onAbandon} dim>ABANDONAR</TextButton>
      </div>
    </div>
  );
}

function TextButton({ children, onClick, dim }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none",
        background: "transparent",
        border: "none",
        color: dim ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.55)",
        fontFamily: typography.familyMono,
        fontSize: typography.size.microCaps,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: typography.weight.medium,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function computeProgramDay(p) {
  if (!p.startedAt) return 1;
  const elapsed = Date.now() - p.startedAt;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor(elapsed / dayMs) + 1);
}
