"use client";
import { useState, useRef, useEffect } from "react";

/* Inline help icon with hover/focus tooltip.
   Used next to complex form fields (rate-limit syntax, IP CIDR, retention).
   Linear-style: subtle ? icon, popover with arrow, supports rich content. */
export default function HelpTooltip({ children, label = "Ayuda contextual", placement = "top" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    function onClick(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span ref={ref} className="bi-help" data-placement={placement}>
      <button
        type="button"
        className="bi-help-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
          <circle cx="12" cy="17" r="0.6" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <span role="tooltip" className="bi-help-bubble">
          {children}
        </span>
      )}
    </span>
  );
}
