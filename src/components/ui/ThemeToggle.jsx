"use client";
import { useEffect, useState } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Ciclo: system → light → dark → system. Persiste en localStorage bajo
 * `bio-theme`. Aplica clase `theme-light` o `theme-dark` en <html>.
 * Sin FOUC: lee la preferencia en el componente script inline del layout.
 */
const KEY = "bio-theme";
const ORDER = ["system", "light", "dark"];

function apply(mode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-light", "theme-dark");
  if (mode === "light") html.classList.add("theme-light");
  else if (mode === "dark") html.classList.add("theme-dark");
  // system: sin clase → CSS usa prefers-color-scheme.
}

export default function ThemeToggle() {
  const [mode, setMode] = useState("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && ORDER.includes(saved)) { setMode(saved); apply(saved); }
    } catch {}
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    apply(next);
    try { localStorage.setItem(KEY, next); } catch {}
  };

  const labels = { system: "Auto", light: "Claro", dark: "Oscuro" };
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tema actual: ${labels[mode]}. Cambiar`}
      className="bi-theme-toggle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space[2],
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
      <span aria-hidden>{mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐"}</span>
      <span>{labels[mode]}</span>
    </button>
  );
}
