import { cssVar, radius, space, font } from "./tokens";

/**
 * Progress — barra determinada (0..100) con gradiente bio-signal.
 * Si `value` es null/undefined => indeterminada.
 */
export function Progress({ value, max = 100, label, size = "md", tone = "accent" }) {
  const indeterminate = value == null;
  const pct = indeterminate ? null : Math.max(0, Math.min(100, (value / max) * 100));
  const h = size === "sm" ? 4 : size === "lg" ? 10 : 6;
  const tones = {
    accent: `linear-gradient(90deg, var(--bi-accent), #22D3EE)`,
    warn:   `linear-gradient(90deg, var(--bi-warn), #FDE68A)`,
    danger: `linear-gradient(90deg, var(--bi-danger), #F472B6)`,
  };

  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: font.size.sm, color: cssVar.textDim, marginBottom: space[1] }}>
          <span>{label}</span>
          {!indeterminate && <span style={{ fontFamily: cssVar.fontMono }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "progreso"}
        style={{
          width: "100%",
          height: h,
          background: cssVar.surface2,
          borderRadius: radius.full,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: indeterminate ? "40%" : `${pct}%`,
            background: tones[tone] || tones.accent,
            borderRadius: radius.full,
            transition: "width .3s cubic-bezier(0.16,1,0.3,1)",
            animation: indeterminate ? "bi-indeterminate 1.4s ease-in-out infinite" : undefined,
            boxShadow: `0 0 12px color-mix(in srgb, var(--bi-accent) 35%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
