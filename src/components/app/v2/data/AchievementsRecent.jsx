"use client";
import * as Lucide from "lucide-react";
import { colors, typography, spacing } from "../tokens";
import { ACHIEVEMENT_LABELS } from "./fixtures";

const FALLBACK_ICON = Lucide.Award;

export default function AchievementsRecent({ ids = [], total = 0, onSeeAll }) {
  const recent = ids.slice(0, 3);
  return (
    <section
      data-v2-achievements-recent
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s96,
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
        LOGROS DESBLOQUEADOS · {recent.length} RECIENTES
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 10,
          overflowX: "auto",
          paddingBlockEnd: 4,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {recent.map((id) => {
          const meta = ACHIEVEMENT_LABELS[id] || { label: id, icon: "Award" };
          const Icon = Lucide[meta.icon] || FALLBACK_ICON;
          return (
            <span
              key={id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: colors.bg.raised,
                border: `0.5px solid ${colors.separator}`,
                borderRadius: 999,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Icon size={16} strokeWidth={1.5} color="rgba(255,255,255,0.72)" />
              <span
                style={{
                  fontFamily: typography.family,
                  fontSize: typography.size.caption,
                  fontWeight: typography.weight.medium,
                  color: "rgba(255,255,255,0.96)",
                  letterSpacing: "-0.005em",
                }}
              >
                {meta.label}
              </span>
            </span>
          );
        })}
      </div>

      {total > recent.length && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBlockStart: spacing.s16 }}>
          <button
            type="button"
            onClick={onSeeAll}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: typography.weight.medium,
              padding: 0,
            }}
          >
            VER TODOS →
          </button>
        </div>
      )}
    </section>
  );
}
