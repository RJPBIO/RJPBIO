"use client";
import { colors, motion as motionTok } from "../tokens";

// Spec ajuste cliente SP5: ON track = blanco neutral cool (no cyan).
// Razon: cyan es accent reservado a acciones primarias / estados de
// actividad accionable. Switches son preferencias estaticas — usan
// blanco igual que iOS/Linear/Things en dark mode. Reservar cyan
// preserva la disciplina cromatica Tactical Premium Dark.

export default function Switch({ checked = false, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange && onChange(!checked)}
      style={{
        appearance: "none",
        border: "none",
        cursor: "pointer",
        width: 36,
        height: 20,
        borderRadius: 999,
        background: checked ? "rgba(245,245,247,1.0)" : "rgba(255,255,255,0.12)",
        position: "relative",
        padding: 0,
        flexShrink: 0,
        transition: `background 200ms ${motionTok.ease.out}`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: checked ? colors.bg.base : colors.text.strong,
          transition: `left 200ms ${motionTok.ease.out}, background 200ms ${motionTok.ease.out}`,
        }}
      />
    </button>
  );
}
