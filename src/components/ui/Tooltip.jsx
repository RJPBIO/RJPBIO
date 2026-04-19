"use client";
import { useId, useEffect, useRef, useState } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Tooltip con hover + focus, delay corto, cierre por Escape y wrap
 * en contenido largo. Se oculta en touch para evitar el sticky-hover.
 */
export function Tooltip({ content, side = "top", delay = 250, children }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); hide(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pos = {
    top:    { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top:    "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
    left:   { right:  "calc(100% + 6px)", top: "50%",  transform: "translateY(-50%)" },
    right:  { left:   "calc(100% + 6px)", top: "50%",  transform: "translateY(-50%)" },
  }[side] || {};

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onPointerEnter={(e) => { if (e.pointerType !== "touch") show(); }}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
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
            maxInlineSize: 260,
            inlineSize: "max-content",
            whiteSpace: "normal",
            lineHeight: 1.4,
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
