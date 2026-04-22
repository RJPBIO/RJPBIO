"use client";
import { useCopy } from "../../hooks/useCopy";
import { cssVar, space, font, radius } from "./tokens";

/* Drop-in copy button. Shows "Copiar" → "Copiado" (or custom labels)
   with a 2s feedback window. Safe on http (textarea fallback). */
export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado",
  errorLabel = "Error",
  size = "sm",
  variant = "ghost",
  className,
  style,
  ariaLabel,
}) {
  const { copy, copied, error } = useCopy();

  const padding = size === "md" ? `${space[2]}px ${space[3]}px` : `${space[1]}px ${space[2]}px`;
  const fontSize = size === "md" ? font.size.md : font.size.sm;

  const variantStyle = variant === "solid"
    ? { background: cssVar.accent, color: cssVar.accentInk, border: "1px solid transparent" }
    : { background: "transparent", color: copied ? cssVar.accent : cssVar.textDim, border: `1px solid ${cssVar.border}` };

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={ariaLabel || label}
      aria-live="polite"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space[1],
        padding,
        fontSize,
        fontWeight: font.weight.semibold,
        fontFamily: "inherit",
        borderRadius: radius.sm,
        cursor: "pointer",
        lineHeight: 1,
        transition: "color .12s ease, background .12s ease",
        ...variantStyle,
        ...style,
      }}
    >
      <span aria-hidden style={{ fontFamily: "var(--font-mono), monospace" }}>
        {copied ? "✓" : error ? "!" : "⧉"}
      </span>
      <span>{copied ? copiedLabel : error ? errorLabel : label}</span>
    </button>
  );
}

export default CopyButton;
