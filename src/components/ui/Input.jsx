"use client";
import { forwardRef } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Input tokenizado con estados: default/invalid/disabled. Acepta `leading`
 * y `trailing` (ReactNode) para íconos. Focus ring cae en :focus-visible
 * desde globals.css — no duplicar box-shadow aquí.
 */
export const Input = forwardRef(function Input(
  { leading, trailing, invalid, align = "start", style, className = "", ...rest },
  ref
) {
  const hasAdornment = leading || trailing;
  const commonInput = {
    flex: 1,
    minWidth: 0,
    width: "100%",
    background: "transparent",
    color: cssVar.text,
    border: "none",
    outline: "none",
    fontSize: font.size.lg,
    fontFamily: "inherit",
    lineHeight: 1.4,
    padding: hasAdornment ? `${space[2.5]}px 0` : `${space[2.5]}px ${space[3]}px`,
    minHeight: 20,
    textAlign: align === "center" ? "center" : undefined,
    letterSpacing: rest.type === "text" && rest.inputMode === "numeric" ? "4px" : undefined,
  };

  if (!hasAdornment) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`bi-input ${className}`}
        style={{
          display: "block",
          width: "100%",
          background: cssVar.bg,
          color: cssVar.text,
          border: `1px solid ${invalid ? cssVar.danger : cssVar.border}`,
          borderRadius: radius.sm,
          padding: `${space[2.5]}px ${space[3]}px`,
          fontSize: font.size.lg,
          fontFamily: "inherit",
          lineHeight: 1.4,
          minHeight: 40,
          transition: "border-color .15s ease, box-shadow .15s ease",
          ...style,
        }}
        {...rest}
      />
    );
  }

  return (
    <div
      className={`bi-input-wrap ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: space[2],
        paddingInline: space[3],
        background: cssVar.bg,
        color: cssVar.text,
        border: `1px solid ${invalid ? cssVar.danger : cssVar.border}`,
        borderRadius: radius.sm,
        minHeight: 40,
        transition: "border-color .15s ease, box-shadow .15s ease",
        ...style,
      }}
    >
      {leading && <span style={{ color: cssVar.textMuted, display: "inline-flex" }}>{leading}</span>}
      <input ref={ref} aria-invalid={invalid || undefined} style={commonInput} {...rest} />
      {trailing && <span style={{ color: cssVar.textMuted, display: "inline-flex" }}>{trailing}</span>}
    </div>
  );
});

export const Select = forwardRef(function Select({ invalid, style, className = "", children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`bi-select ${className}`}
      style={{
        display: "block",
        width: "100%",
        background: cssVar.bg,
        color: cssVar.text,
        border: `1px solid ${invalid ? cssVar.danger : cssVar.border}`,
        borderRadius: radius.sm,
        padding: `${space[2.5]}px ${space[3]}px`,
        fontSize: font.size.lg,
        fontFamily: "inherit",
        minHeight: 40,
        appearance: "auto",
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea({ invalid, rows = 4, style, className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`bi-textarea ${className}`}
      style={{
        display: "block",
        width: "100%",
        background: cssVar.bg,
        color: cssVar.text,
        border: `1px solid ${invalid ? cssVar.danger : cssVar.border}`,
        borderRadius: radius.sm,
        padding: `${space[2.5]}px ${space[3]}px`,
        fontSize: font.size.lg,
        fontFamily: "inherit",
        lineHeight: 1.5,
        resize: "vertical",
        ...style,
      }}
      {...rest}
    />
  );
});
