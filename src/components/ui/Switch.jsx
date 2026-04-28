"use client";
import { useId } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Switch — toggle accesible (role=switch). Controlado: pasa `checked` y
 * `onChange(boolean)`. Tamaños sm/md. Label opcional alineado al lado.
 */
export function Switch({ checked, onChange, label, hint, disabled, size = "md", id }) {
  const generated = useId();
  const switchId = id || generated;
  const dims = size === "sm"
    ? { w: 32, h: 18, knob: 14, pad: 2 }
    : { w: 42, h: 24, knob: 18, pad: 3 };

  return (
    <label
      htmlFor={switchId}
      style={{
        display: "inline-flex", alignItems: "center", gap: space[3],
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        role="switch"
        id={switchId}
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
      />
      <span
        aria-hidden
        style={{
          position: "relative",
          width: dims.w, height: dims.h,
          background: checked ? cssVar.accent : cssVar.border,
          borderRadius: radius.full,
          transition: "background .18s cubic-bezier(0.22, 1, 0.36, 1)",
          flexShrink: 0,
          display: "inline-block",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: dims.pad, left: checked ? dims.w - dims.knob - dims.pad : dims.pad,
            width: dims.knob, height: dims.knob,
            background: cssVar.accentInk,
            borderRadius: radius.full,
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left .18s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </span>
      {label && (
        <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: cssVar.text, fontSize: font.size.md, fontWeight: font.weight.medium }}>{label}</span>
          {hint && <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>{hint}</span>}
        </span>
      )}
    </label>
  );
}
