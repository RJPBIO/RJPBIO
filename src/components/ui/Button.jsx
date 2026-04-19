import Link from "next/link";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Button/Link polimórfico. Si recibe `href` renderiza <Link>/<a> según
 * sea interno o externo; si no, renderiza <button>. Estilos tokenizados,
 * focus-visible con ring, hit area ≥44px para accesibilidad táctil.
 *
 * @param {object} props
 * @param {"primary"|"secondary"|"ghost"|"danger"} [props.variant]
 * @param {"sm"|"md"|"lg"} [props.size]
 * @param {string} [props.href]
 * @param {boolean} [props.block]
 * @param {boolean} [props.disabled]
 */
export function Button({
  variant = "primary",
  size = "md",
  href,
  block = false,
  disabled = false,
  loading = false,
  loadingLabel,
  type,
  className = "",
  children,
  ...rest
}) {
  const sizes = {
    sm: { padding: `${space[1.5]}px ${space[3]}px`, fontSize: font.size.base, minHeight: 36 },
    md: { padding: `${space[2.5]}px ${space[4]}px`, fontSize: font.size.md,   minHeight: 44 },
    lg: { padding: `${space[3]}px ${space[6]}px`,  fontSize: font.size.lg,   minHeight: 48 },
  };
  const variants = {
    primary:   { background: cssVar.accent,     color: cssVar.accentInk, border: `1px solid ${cssVar.accent}` },
    secondary: { background: "transparent",     color: cssVar.text,      border: `1px solid ${cssVar.borderStrong}` },
    ghost:     { background: "transparent",     color: cssVar.textDim,   border: "1px solid transparent" },
    danger:    { background: cssVar.danger,     color: "#FFF",           border: `1px solid ${cssVar.danger}` },
  };
  const isDisabled = disabled || loading;
  const style = {
    display: block ? "flex" : "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space[2],
    width: block ? "100%" : undefined,
    borderRadius: radius.md,
    fontWeight: font.weight.bold,
    fontFamily: cssVar.fontSans,
    textDecoration: "none",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.65 : 1,
    position: "relative",
    transition: "background .15s ease, transform .1s ease, box-shadow .15s ease",
    ...sizes[size],
    ...variants[variant],
  };

  const cls = `bi-btn bi-btn-${variant} ${className}`;
  const spinnerColor = variant === "primary" ? cssVar.accentInk : variant === "danger" ? "#FFF" : cssVar.text;

  const content = loading ? (
    <>
      <span
        aria-hidden="true"
        style={{
          inlineSize: 14, blockSize: 14, borderRadius: "50%",
          border: `2px solid color-mix(in srgb, ${spinnerColor} 30%, transparent)`,
          borderTopColor: spinnerColor,
          animation: "bi-btn-spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      <span>{loadingLabel || children}</span>
    </>
  ) : children;

  if (href) {
    const external = /^https?:\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    if (external) {
      const externalRel = /^https?:\/\//.test(href) ? (rest.rel ?? "noopener noreferrer") : rest.rel;
      return (
        <a href={href} className={cls} style={style} {...rest} rel={externalRel}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} style={style} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type || "button"}
      className={cls}
      style={style}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
