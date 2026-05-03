"use client";
import { colors } from "../tokens";

export default function Slider({ value = 0, min = 0, max = 1, step = 0.01, onChange, ariaLabel }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange && onChange(Number(e.target.value))}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        width: "100%",
        height: 2,
        background: "rgba(255,255,255,0.12)",
        borderRadius: 1,
        outline: "none",
        cursor: "pointer",
        accentColor: colors.accent.phosphorCyan,
      }}
    />
  );
}
