"use client";
import { colors, typography, spacing } from "../tokens";
import { initialsFromName } from "./fixtures";

// Phase 6D SP3 — IdentityHeader rewritten para datos reales del store
// (no más FIXTURE_PROFILE fallback). Acepta:
//   displayName: del local-part del email cuando NextAuth no provee name
//   email: state._userEmail (cacheado al sign-in via setUserEmail)
//   level: { name: 'Delta'|'Theta'|'Alpha'|... , glyph: 'δ'|... , color }
//   isEmpty: true cuando user no tiene sessions registradas
//
// Empty state honesto: en lugar de mostrar "Operador Neural · NIVEL 3"
// para todo new user, mostramos "Bienvenido" + invitación a empezar.
// Si email es null, se elide (no decimos "Sin email registrado" para no
// alarmar — el sign-in flow garantiza que cuando un user llega aquí ya
// hay session activa; el caso null es solo para dev/preview).

export default function IdentityHeader({ displayName, email, level, isEmpty = false }) {
  if (isEmpty) {
    return <EmptyHeader displayName={displayName} email={email} />;
  }
  return <PopulatedHeader displayName={displayName} email={email} level={level} />;
}

function EmptyHeader({ displayName, email }) {
  return (
    <section
      data-v2-identity-header
      data-v2-identity-empty
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s32,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s8,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 24,
          fontWeight: typography.weight.regular,
          color: colors.text.primary,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {displayName ? `Bienvenido, ${displayName}` : "Bienvenido"}
      </span>
      {email && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {email}
        </span>
      )}
      <span
        style={{
          marginBlockStart: spacing.s8,
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: colors.text.secondary,
          lineHeight: 1.5,
        }}
      >
        Tu progreso aparece aquí cuando completas tu primera sesión.
      </span>
    </section>
  );
}

function PopulatedHeader({ displayName, email, level }) {
  const initials = initialsFromName(displayName || email || "");
  const levelName = level?.name || "Delta";
  const levelGlyph = level?.glyph || "δ";
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
          color: colors.text.primary,
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
            color: colors.text.primary,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName || "Operador"}
        </span>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.secondary,
            fontWeight: typography.weight.medium,
          }}
        >
          NIVEL · {levelGlyph} {levelName}
        </span>
        {email && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.muted,
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
