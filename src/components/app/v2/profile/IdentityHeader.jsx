"use client";
import { colors, typography, spacing } from "../tokens";
import { initialsFromName } from "./fixtures";

export default function IdentityHeader({ name, email, level }) {
  const initials = initialsFromName(name);
  return (
    <section
      data-v2-identity-header
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: typography.family,
          fontSize: 24,
          fontWeight: typography.weight.medium,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 24,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name || "Operador Neural"}
        </span>
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
          OPERADOR NEURAL · NIVEL {level || 1}
        </span>
        {email && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </span>
        )}
      </div>
    </section>
  );
}
