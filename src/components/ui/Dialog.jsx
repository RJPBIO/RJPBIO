"use client";
import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Dialog — modal accesible con focus-trap + ESC + click-fuera.
 * - `open` controla visibilidad; `onClose` se llama al cerrar
 * - rol "dialog" con aria-modal y aria-labelledby
 * - Cuerpo desplazable; cabecera y footer sticky via grid
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }) {
  const dialogRef = useRef(null);
  const lastActiveRef = useRef(null);

  const handleKey = useCallback((e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
    if (e.key === "Tab" && dialogRef.current) {
      const focusables = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement;
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const firstFocus = dialogRef.current?.querySelector(
        '[data-autofocus], button:not([disabled]), [href], input:not([disabled])'
      );
      firstFocus?.focus();
    }, 20);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
      lastActiveRef.current?.focus?.();
    };
  }, [open, handleKey]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const widths = { sm: 360, md: 480, lg: 640 };
  const panelWidth = widths[size] || widths.md;

  const titleId = "bi-dlg-title";
  const descId  = description ? "bi-dlg-desc" : undefined;

  return createPortal(
    <div
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 210,
        display: "grid", placeItems: "center",
        background: "color-mix(in srgb, var(--bi-bg) 70%, #000 30%)",
        backdropFilter: "blur(6px)",
        padding: space[4],
        animation: "fi 0.18s ease-out",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={{
          width: "min(96vw, " + panelWidth + "px)",
          maxHeight: "92vh",
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.lg,
          boxShadow: "0 40px 100px -30px rgba(0,0,0,0.5)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          overflow: "hidden",
          animation: "po 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <header style={{ padding: `${space[4]}px ${space[5]}px`, borderBottom: `1px solid ${cssVar.border}` }}>
          <h2 id={titleId} style={{
            margin: 0, fontSize: font.size.xl, fontWeight: font.weight.bold,
            color: cssVar.text, letterSpacing: font.tracking.tight,
          }}>{title}</h2>
          {description && (
            <p id={descId} style={{ margin: `${space[1]}px 0 0`, color: cssVar.textDim, fontSize: font.size.md }}>
              {description}
            </p>
          )}
        </header>
        <div style={{ padding: `${space[5]}px`, overflow: "auto", color: cssVar.text }}>{children}</div>
        {footer && (
          <footer style={{
            padding: `${space[3]}px ${space[5]}px`, borderTop: `1px solid ${cssVar.border}`,
            background: cssVar.surface2,
            display: "flex", justifyContent: "flex-end", gap: space[2],
          }}>
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
