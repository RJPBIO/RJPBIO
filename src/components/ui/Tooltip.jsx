"use client";
import { useId, useState } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Tooltip CSS-only (hover + focus). No se apoya en JS para mostrarse;
 * respeta prefers-reduced-motion y se oculta en touch.
 */
export function Tooltip({ content, side = "top", children }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  const pos = {
    top:    { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top:    "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left:   { right:  "calc(100% + 6px)", top: "50%",  transform: "translateY(-50%)" },
    right:  { left:   "calc(100% + 6px)", top: "50%",  transform: "translateY(-50%)" },
  }[side] || {};

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute", zIndex: 220,
            ...pos,
            whiteSpace: "nowrap",
            padding: `${space[1]}px ${space[2]}px`,
            background: cssVar.text,
            color: cssVar.bg,
            borderRadius: radius.sm,
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            boxShadow: "0 8px 24px -8px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            animation: "fi 0.12s ease-out",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
