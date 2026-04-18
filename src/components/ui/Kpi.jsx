import { cssVar, radius, space, font } from "./tokens";

/**
 * KPI card con numeral tabular-nums en JetBrains Mono (identidad "instrument").
 * `live` aplica aria-live para anunciar cambios de valor (calculadora ROI).
 */
export function Kpi({ label, value, sub, accent = false, live = false, size = "md" }) {
  const valueSize = { sm: 20, md: 26, lg: 34 }[size] || size;
  return (
    <div
      style={{
        padding: space[4],
        borderRadius: radius.md,
        background: accent ? cssVar.accentSoft : cssVar.surface,
        border: `1px solid ${accent ? cssVar.accent : cssVar.border}`,
        marginBottom: space[2.5],
      }}
    >
      <div style={{ fontSize: font.size.sm, fontWeight: font.weight.bold, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "1.5px" }}>
        {label}
      </div>
      <div
        aria-live={live ? "polite" : undefined}
        aria-atomic={live ? "true" : undefined}
        style={{
          fontSize: valueSize,
          fontWeight: font.weight.black,
          margin: `${space[1]}px 0`,
          fontFamily: cssVar.fontMono,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.5px",
          color: cssVar.text,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: font.size.sm, color: cssVar.textDim }}>{sub}</div>}
    </div>
  );
}
