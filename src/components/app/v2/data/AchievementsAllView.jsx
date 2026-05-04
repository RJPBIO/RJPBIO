"use client";
import { useStore } from "@/store/useStore";
import { ArrowLeft } from "lucide-react";
import HeaderV2 from "../home/HeaderV2";
import { ACHIEVEMENT_LABELS } from "./fixtures";
import { colors, typography, spacing, radii } from "../tokens";

// Phase 6D SP4c — vista completa de achievements del user. Wired al
// target:/app/data/achievements/all desde DataV2.AchievementsRecent
// "Ver todos". Lee state.achievements (array de IDs) y mapea a
// ACHIEVEMENT_LABELS catalog.

export default function AchievementsAllView({ onBack, onBellClick }) {
  const ids = useStore((s) => Array.isArray(s.achievements) ? s.achievements : []);

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <SubHeader
        title="Logros"
        subtitle={`${ids.length} ${ids.length === 1 ? "logro" : "logros"} desbloqueados`}
        onBack={onBack}
      />
      {ids.length === 0 ? (
        <article
          style={{
            margin: spacing.s24,
            padding: spacing.s24 - 4,
            background: "transparent",
            border: `0.5px dashed ${colors.separator}`,
            borderRadius: radii.panelLg,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.medium,
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            Sin logros desbloqueados todavía. Tu primera sesión desbloquea el primer logro.
          </p>
        </article>
      ) : (
        <ul
          data-testid="achievements-all-list"
          style={{
            listStyle: "none",
            margin: 0,
            paddingInline: spacing.s24,
            paddingBlock: spacing.s16,
          }}
        >
          {ids.map((id, i) => {
            const meta = ACHIEVEMENT_LABELS[id] || { label: id, icon: null };
            return (
              <li
                key={`${id}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === ids.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(34,211,238,0.06)",
                    border: `0.5px solid ${colors.accent.phosphorCyan}`,
                    borderRadius: radii.iconBox,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: colors.accent.phosphorCyan,
                    flexShrink: 0,
                    fontFamily: typography.familyMono,
                    fontSize: 14,
                    fontWeight: typography.weight.medium,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: typography.family,
                    fontSize: typography.size.bodyMin,
                    fontWeight: typography.weight.medium,
                    color: colors.text.strong,
                  }}
                >
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function SubHeader({ title, subtitle, onBack }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
        paddingInline: spacing.s24,
        paddingBlock: spacing.s16,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        data-testid="achievements-all-back"
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: colors.text.secondary,
          cursor: "pointer",
          padding: spacing.s8,
          margin: -spacing.s8,
        }}
      >
        <ArrowLeft size={20} strokeWidth={1.5} />
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.muted,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </header>
  );
}
