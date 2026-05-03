"use client";
import { colors, typography, spacing } from "../tokens";
import ActiveProgramFull from "./ActiveProgramFull";
import ProgramCatalogRow from "./ProgramCatalogRow";
import { PROGRAM_CATALOG_META } from "./fixtures";

export default function ProgramsSection({ activeProgram, onProgramTap, onSeeToday, onAbandon }) {
  return (
    <section
      data-v2-programs-section
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s16,
        }}
      >
        PROGRAMAS
      </div>

      {activeProgram && (
        <div style={{ marginBlockEnd: spacing.s32 }}>
          <SubKicker tone="cyan">ACTIVO</SubKicker>
          <ActiveProgramFull
            program={activeProgram}
            onSeeToday={onSeeToday}
            onAbandon={onAbandon}
          />
        </div>
      )}

      <SubKicker tone="muted">CATÁLOGO</SubKicker>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBlockStart: spacing.s8,
        }}
      >
        {PROGRAM_CATALOG_META
          .filter((p) => !activeProgram || p.id !== activeProgram.id)
          .map((p) => (
            <ProgramCatalogRow
              key={p.id}
              tag={p.tag}
              name={p.name}
              descriptor={p.descriptor}
              onTap={() => onProgramTap && onProgramTap(p)}
            />
          ))}
      </div>
    </section>
  );
}

function SubKicker({ children, tone = "muted" }) {
  const color = tone === "cyan" ? colors.accent.phosphorCyan : "rgba(255,255,255,0.55)";
  return (
    <div
      style={{
        fontFamily: typography.familyMono,
        fontSize: typography.size.microCaps,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        fontWeight: typography.weight.medium,
        marginBlockEnd: 8,
      }}
    >
      {children}
    </div>
  );
}
