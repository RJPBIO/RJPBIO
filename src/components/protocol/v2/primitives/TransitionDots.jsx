"use client";
/* ═══════════════════════════════════════════════════════════════
   TransitionDots — indicador de progreso entre actos del protocolo.
   Reemplaza el countdown timer presionando del v1.
   ●●●○ : completado / pendiente. 6px diámetro, gap 8px, sin animación.
   ═══════════════════════════════════════════════════════════════ */

import { colors } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;
const PENDING = "rgba(245,245,247,0.32)";

export default function TransitionDots({
  total_acts = 1,
  current_act = 0,
}) {
  const acts = Math.max(1, total_acts);
  const cur = Math.max(0, Math.min(current_act, acts - 1));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={acts}
      aria-valuenow={cur + 1}
      aria-label={`Acto ${cur + 1} de ${acts}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {Array.from({ length: acts }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            inlineSize: 6,
            blockSize: 6,
            borderRadius: "50%",
            background: i <= cur ? ACCENT : "transparent",
            border: i <= cur ? "none" : `0.5px solid ${PENDING}`,
            display: "inline-block",
          }}
        />
      ))}
    </div>
  );
}
