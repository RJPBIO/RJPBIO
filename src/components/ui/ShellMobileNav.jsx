"use client";
import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { cssVar, space, font, radius } from "./tokens";
import { useFocusTrap } from "@/lib/a11y";

export default function ShellMobileNav({ items, activePath, triggerLabel = "Menú", closeLabel = "Cerrar" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const dialogRef = useFocusTrap(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="bi-shell-nav-trigger"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          marginInlineStart: "auto",
          background: "transparent",
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          color: cssVar.text,
          cursor: "pointer",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 70,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
            }}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={triggerLabel}
            id={panelId}
            className="bi-mobile-drawer"
            style={{
              position: "fixed",
              insetBlock: 0,
              insetInlineEnd: 0,
              zIndex: 71,
              inlineSize: "min(320px, 90vw)",
              background: cssVar.surface,
              borderInlineStart: `1px solid ${cssVar.border}`,
              display: "flex",
              flexDirection: "column",
              padding: space[4],
              gap: space[2],
              boxShadow: "-20px 0 40px -20px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBlockEnd: space[3],
            }}>
              <span style={{
                color: "#22D3EE",
                fontSize: 13,
                letterSpacing: -0.1,
                fontWeight: 700,
              }}>
                {triggerLabel}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                style={{
                  width: 36, height: 36,
                  background: "transparent", border: `1px solid ${cssVar.border}`,
                  borderRadius: radius.sm, color: cssVar.text, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>
            <nav
              aria-label={triggerLabel}
              style={{ display: "grid", gap: space[2], overflowY: "auto", flex: 1 }}
            >
              {items.map((it) => {
                const hasSub = Array.isArray(it.submenu) && it.submenu.length > 0;
                const parentActive = activePath === it.href;
                const childActive = hasSub && it.submenu.some(
                  (s) => activePath === s.href || activePath?.startsWith(s.href + "/")
                );
                // Parent row: always rendered as a primary link. When it has
                // a submenu, we render the submenu below as a quiet sublist —
                // no accordion toggling, so the drawer reveals the full IA
                // in one glance (mobile users shouldn't have to tap-to-expand
                // every section to understand what's here).
                return (
                  <div key={it.href} style={{ display: "grid", gap: space[1] }}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      aria-current={parentActive ? "page" : undefined}
                      className="bi-mobile-navlink"
                      data-active={parentActive || childActive ? "true" : undefined}
                      style={{
                        padding: `${space[3]}px ${space[4]}px`,
                        borderRadius: radius.sm,
                        color: cssVar.text,
                        fontWeight: font.weight.bold,
                        fontSize: font.size.lg,
                        textDecoration: "none",
                      }}
                    >
                      {it.label}
                    </Link>
                    {hasSub && (
                      <ul
                        role="list"
                        aria-label={it.label}
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "grid",
                          gap: 2,
                          marginInlineStart: space[3],
                          borderInlineStart: `1px solid ${cssVar.border}`,
                          paddingInlineStart: space[3],
                        }}
                      >
                        {it.submenu.map((s) => {
                          const subActive = activePath === s.href || activePath?.startsWith(s.href + "/");
                          return (
                            <li key={s.href}>
                              <Link
                                href={s.href}
                                onClick={() => setOpen(false)}
                                aria-current={subActive ? "page" : undefined}
                                className="bi-mobile-navlink"
                                data-active={subActive ? "true" : undefined}
                                style={{
                                  display: "block",
                                  padding: `${space[2]}px ${space[3]}px`,
                                  borderRadius: radius.sm,
                                  color: cssVar.textMuted,
                                  fontWeight: font.weight.medium,
                                  fontSize: font.size.base,
                                  textDecoration: "none",
                                }}
                              >
                                {s.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
