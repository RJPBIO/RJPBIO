"use client";
import { forwardRef, useId } from "react";
import { cssVar, space, font } from "./tokens";

/**
 * Checkbox — visually-hidden native input behind a custom visual box.
 * Native a11y preserved (keyboard, screen reader, form submit). Phosphor
 * fill + checkmark when checked, phosphor ring on focus. Used wherever a
 * native checkbox would look out of place next to the ignite CTA.
 */
export const Checkbox = forwardRef(function Checkbox(
  { id, label, description, className = "", style, disabled, ...rest },
  ref
) {
  const generated = useId();
  const inputId = id || generated;

  return (
    <label
      htmlFor={inputId}
      className={`bi-checkbox ${className} ${disabled ? "bi-checkbox-disabled" : ""}`}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: space[3],
        alignItems: "flex-start",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="bi-checkbox-input"
        disabled={disabled}
        {...rest}
      />
      <span className="bi-checkbox-box" aria-hidden>
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 8 3.5 3.5L13 5" />
        </svg>
      </span>
      {(label || description) && (
        <span className="bi-checkbox-body" style={{ minWidth: 0 }}>
          {label && (
            <span style={{ color: cssVar.text, fontSize: font.size.md, fontWeight: font.weight.semibold, lineHeight: 1.4 }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ display: "block", color: cssVar.textDim, fontSize: font.size.sm, lineHeight: 1.5, marginBlockStart: label ? 4 : 0 }}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
});
