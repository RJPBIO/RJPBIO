"use client";
import { useId } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Wrapper accesible label+input/select/textarea:
 *  - id autogenerado si no se pasa
 *  - aria-describedby ligado a hint / error
 *  - required visual + aria
 */
export function Field({ label, hint, error, required, children, id, className = "", style }) {
  const generated = useId();
  const fieldId = id || generated;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-err` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const child = typeof children === "function"
    ? children({ id: fieldId, "aria-describedby": describedBy, "aria-invalid": !!error, required })
    : children;

  return (
    <div className={`bi-field ${className}`} style={{ display: "block", marginBottom: space[4], ...style }}>
      <label htmlFor={fieldId} style={{ display: "block", fontSize: font.size.md, color: cssVar.textDim, marginBottom: space[1], fontWeight: font.weight.semibold }}>
        {label}
        {required && <span aria-hidden style={{ color: cssVar.danger, marginInlineStart: 4 }}>*</span>}
      </label>
      {child}
      {hint && !error && (
        <p id={hintId} style={{ margin: `${space[1]}px 0 0`, fontSize: font.size.sm, color: cssVar.textMuted }}>{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" style={{ margin: `${space[1]}px 0 0`, fontSize: font.size.sm, color: cssVar.danger }}>{error}</p>
      )}
    </div>
  );
}

export const inputStyle = {
  display: "block",
  width: "100%",
  background: cssVar.bg,
  color: cssVar.text,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.sm,
  padding: `${space[2.5]}px ${space[3]}px`,
  fontSize: font.size.lg,
  fontFamily: "inherit",
  lineHeight: 1.4,
  minHeight: 40,
};
