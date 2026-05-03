"use client";
import { colors, typography, spacing } from "../tokens";

// Row sutil mensajes/mes + plan + upgrade link condicional.

export default function QuotaRow({ used = 0, max = 100, plan = "FREE", onUpgrade }) {
  const exceeded = max !== Infinity && used >= max;
  const isFree = String(plan).toUpperCase() === "FREE";

  return (
    <section
      data-v2-quota-row
      style={{
        paddingInline: spacing.s24,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      {exceeded ? (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.s16, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.4,
            }}
          >
            Has llegado a tu límite mensual.
          </span>
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: colors.accent.phosphorCyan,
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: typography.weight.medium,
              padding: 0,
            }}
          >
            MEJORA TU PLAN →
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: spacing.s16, flexWrap: "wrap" }}>
          <Cell label="MENSAJES ESTE MES" value={`${used} / ${max === Infinity ? "∞" : max}`} />
          <Sep />
          <Cell label="PLAN" value={String(plan).toUpperCase()} />
          {isFree && (
            <>
              <Sep />
              <button
                type="button"
                onClick={onUpgrade}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: colors.accent.phosphorCyan,
                  fontFamily: typography.familyMono,
                  fontSize: typography.size.microCaps,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: typography.weight.medium,
                  padding: 0,
                }}
              >
                MEJORA TU PLAN →
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Cell({ label, value }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.32)",
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.72)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden="true" style={{ width: 1, height: 12, background: "rgba(255,255,255,0.06)", display: "inline-block" }} />
  );
}
