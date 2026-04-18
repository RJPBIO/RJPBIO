"use client";
/* ═══════════════════════════════════════════════════════════════
   LocaleSelect — selector de idioma reutilizable
   ═══════════════════════════════════════════════════════════════
   Dos variantes: `compact` (pill en header público) y `radiogroup`
   (fila inline en SettingsSheet). Ambas llaman setLocale() del
   store global i18n.js — que persiste en localStorage + cookie
   (para SSR) y actualiza <html lang>/dir. Si el usuario está
   autenticado, se persiste también server-side via PATCH /api/v1/me.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { setLocale, getLocale, onLocaleChange, LOCALE_LABELS } from "@/lib/i18n";
import { cssVar, radius, space, font } from "./tokens";

const QUICK = ["es", "en"];

function csrfHeader() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

async function persistServer(locale) {
  // Best-effort: si el usuario no está autenticado, el 401 se ignora.
  try {
    await fetch("/api/v1/users/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json", ...csrfHeader() },
      body: JSON.stringify({ locale }),
    });
  } catch {}
}

export default function LocaleSelect({ variant = "compact", locales = QUICK }) {
  const [locale, setLoc] = useState("es");
  useEffect(() => {
    setLoc(getLocale());
    return onLocaleChange(setLoc);
  }, []);

  const change = (l) => {
    if (l === locale) return;
    setLocale(l);
    persistServer(l);
  };

  if (variant === "radiogroup") {
    return (
      <div role="radiogroup" aria-label="Idioma" style={{ display: "flex", gap: 4 }}>
        {locales.map((l) => {
          const active = locale === l;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => change(l)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: `1px solid ${active ? "var(--bi-accent)" : "var(--bi-border)"}`,
                background: active ? "color-mix(in srgb, var(--bi-accent) 10%, transparent)" : "transparent",
                color: active ? "var(--bi-accent)" : "var(--bi-text-dim)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontFamily: "inherit",
              }}
            >
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  // compact (header público): select nativo = accesible, compacto, sin libs.
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
      <span className="bi-sr-only">Idioma</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        aria-label="Idioma de la interfaz"
        style={{
          padding: `${space[1.5]}px ${space[3]}px`,
          borderRadius: radius.full,
          background: "transparent",
          color: cssVar.textDim,
          border: `1px solid ${cssVar.border}`,
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {locales.map((l) => (
          <option key={l} value={l}>{LOCALE_LABELS[l] || l.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
