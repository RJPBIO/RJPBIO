"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Drawer({ open, onClose, title, children, footer, width }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="bi-drawer-backdrop" onClick={onClose} />
      <aside
        className="bi-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bi-drawer-title"
        style={width ? { width: `min(${width}px, 100vw)` } : undefined}
      >
        <header className="bi-drawer-header">
          <h2 id="bi-drawer-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {title}
          </h2>
          <button type="button" className="bi-drawer-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="bi-drawer-body">{children}</div>
        {footer && (
          <footer className="bi-drawer-footer">{footer}</footer>
        )}
      </aside>
    </>,
    document.body
  );
}
