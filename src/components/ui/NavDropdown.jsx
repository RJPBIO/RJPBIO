"use client";
import { useState, useRef, useEffect, useId } from "react";
import Link from "next/link";

/* Flyout curado — hover + focus-within + click/enter. Cierra con Escape,
   click afuera o blur completo del tree. Accesible vía roving focus y
   aria-expanded. No usa portal: el menú vive junto al trigger y hereda
   el stacking context del header. */
export default function NavDropdown({ label, href, active, items }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); } };
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const openNow = () => { clearTimeout(timerRef.current); setOpen(true); };
  const closeSoon = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <div
      ref={wrapRef}
      className="bi-shell-dropdown"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => { if (!wrapRef.current?.contains(e.relatedTarget)) closeSoon(); }}
    >
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="bi-shell-navlink"
        data-active={active ? "true" : undefined}
      >
        <span className="bi-shell-navlink-dot" aria-hidden />
        <span className="bi-shell-navlink-label">{label}</span>
        <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className="bi-shell-navlink-caret" data-open={open ? "true" : undefined}>
          <path d="M2 3.75L5 6.75 8 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </Link>

      <div
        id={menuId}
        role="menu"
        className="bi-shell-flyout"
        data-open={open ? "true" : undefined}
        aria-hidden={!open}
      >
        <span aria-hidden className="bi-shell-flyout-aura" />
        <div className="bi-shell-flyout-inner">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              className="bi-shell-flyout-item"
              onClick={() => setOpen(false)}
            >
              <span className="bi-shell-flyout-item-icon" aria-hidden>{it.icon}</span>
              <span className="bi-shell-flyout-item-body">
                <span className="bi-shell-flyout-item-title">{it.title}</span>
                <span className="bi-shell-flyout-item-desc">{it.desc}</span>
              </span>
              <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className="bi-shell-flyout-item-arrow">
                <path d="M3 6h6M7 3.5L9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
