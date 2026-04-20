"use client";
/* ═══════════════════════════════════════════════════════════════
   CountryPicker — combobox with typeahead search over the full
   E.164 registry. No external flag dependency: each country is
   shown as a monospace ISO-2 badge (works identically on every
   OS — no emoji fallback box on Windows). Autodetects from
   navigator locale on mount. Keyboard-navigable (↑/↓/Enter/Esc).
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, BY_ISO, detectIso, localizedName } from "@/data/countries";
import { cssVar, radius, space, font, bioSignal } from "./tokens";

function IsoBadge({ iso }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minWidth: 28, height: 20,
        padding: "0 6px",
        background: `linear-gradient(180deg, ${bioSignal.phosphorCyan}22, ${bioSignal.neuralViolet}22)`,
        border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 35%, transparent)`,
        borderRadius: 4,
        fontFamily: cssVar.fontMono, fontSize: 10,
        fontWeight: 800, letterSpacing: "0.05em",
        color: cssVar.text,
      }}
    >
      {iso}
    </span>
  );
}

export function CountryPicker({ value, onChange, locale = "es", ariaLabel = "Country" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const btnRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!value) onChange?.(detectIso());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const current = BY_ISO[value] || BY_ISO.MX;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const localized = localizedName(c.iso, locale).toLowerCase();
      return (
        localized.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, ""))
      );
    });
  }, [query, locale]);

  function select(iso) {
    onChange?.(iso);
    setOpen(false);
    setQuery("");
    setCursor(0);
    btnRef.current?.focus();
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const pick = filtered[cursor]; if (pick) select(pick.iso); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: space[2],
          height: 44,
          padding: `0 ${space[3]}px`,
          background: cssVar.bg,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          color: cssVar.text,
          fontFamily: cssVar.fontSans,
          fontSize: font.size.md,
          cursor: "pointer",
        }}
      >
        <IsoBadge iso={current.iso} />
        <span style={{ fontFamily: cssVar.fontMono, fontWeight: 700 }}>+{current.dial}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden focusable="false" style={{ color: cssVar.textMuted }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={boxRef}
          role="listbox"
          onKeyDown={onKey}
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetBlockStart: "calc(100% + 6px)",
            zIndex: 50,
            width: 320,
            maxHeight: 360,
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.md,
            boxShadow: `0 24px 60px -20px color-mix(in srgb, ${bioSignal.phosphorCyan} 35%, transparent)`,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: space[2], borderBottom: `1px solid ${cssVar.border}` }}>
            <input
              ref={inputRef}
              type="search"
              placeholder={locale === "en" ? "Search country or code…" : "Buscar país o código…"}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
              onKeyDown={onKey}
              style={{
                width: "100%",
                height: 36,
                padding: `0 ${space[3]}px`,
                background: cssVar.bg,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.sm,
                color: cssVar.text,
                fontSize: font.size.md,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, overflowY: "auto", maxHeight: 300 }}>
            {filtered.length === 0 && (
              <li style={{ padding: space[4], color: cssVar.textMuted, fontSize: font.size.sm, textAlign: "center" }}>
                {locale === "en" ? "No matches" : "Sin coincidencias"}
              </li>
            )}
            {filtered.map((c, i) => {
              const active = i === cursor;
              const selected = c.iso === current.iso;
              return (
                <li key={c.iso} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => select(c.iso)}
                    onMouseEnter={() => setCursor(i)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: space[3],
                      padding: `${space[2]}px ${space[3]}px`,
                      background: active ? `color-mix(in srgb, ${bioSignal.phosphorCyan} 10%, transparent)` : "transparent",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "start",
                      color: cssVar.text,
                      fontFamily: "inherit",
                      fontSize: font.size.sm,
                    }}
                  >
                    <IsoBadge iso={c.iso} />
                    <span style={{ color: cssVar.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {localizedName(c.iso, locale)}
                    </span>
                    <span style={{ fontFamily: cssVar.fontMono, color: cssVar.textDim }}>+{c.dial}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
