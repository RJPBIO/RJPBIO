import { cssVar, radius, space, font } from "./tokens";

/**
 * Alert — mensaje semántico accesible. Kinds: info/success/warn/danger.
 * `role` por defecto: alert si danger, status si success/info, alert si warn.
 */
export function Alert({ kind = "info", title, children, style, className = "" }) {
  const palettes = {
    info:    { bg: "color-mix(in srgb, var(--bi-accent) 10%, transparent)", border: cssVar.accent, text: cssVar.text, icon: "ℹ" },
    success: { bg: "color-mix(in srgb, var(--bi-accent) 12%, transparent)", border: cssVar.accent, text: cssVar.text, icon: "✓" },
    warn:    { bg: "color-mix(in srgb, var(--bi-warn) 12%, transparent)",   border: cssVar.warn,   text: cssVar.text, icon: "!" },
    danger:  { bg: "color-mix(in srgb, var(--bi-danger) 12%, transparent)", border: cssVar.danger, text: cssVar.text, icon: "⚠" },
  };
  const p = palettes[kind] || palettes.info;
  const role = kind === "danger" || kind === "warn" ? "alert" : "status";
  return (
    <div
      role={role}
      className={`bi-alert bi-alert-${kind} ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: space[3],
        padding: space[3],
        background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: radius.md,
        color: p.text,
        fontSize: font.size.md,
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 24, height: 24, borderRadius: radius.full,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: p.border, color: cssVar.accentInk, fontSize: font.size.sm, fontWeight: font.weight.bold,
        }}
      >
        {p.icon}
      </span>
      <div>
        {title && <div style={{ fontWeight: font.weight.bold, marginBottom: space[0.5] }}>{title}</div>}
        <div style={{ color: cssVar.textDim, lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}
