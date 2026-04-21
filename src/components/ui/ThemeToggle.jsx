"use client";
import { useEffect, useState } from "react";

/**
 * Ciclo: system → light → dark → system. Persiste en localStorage bajo
 * `bio-theme`. Aplica clase `theme-light` o `theme-dark` en <html>.
 * Sin FOUC: lee la preferencia en el componente script inline del layout.
 */
const KEY = "bio-theme";
const ORDER = ["system", "light", "dark"];
const LABELS = { system: "Auto", light: "Claro", dark: "Oscuro" };

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
  const [announcement, setAnnouncement] = useState("");

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
    setAnnouncement(`Tema cambiado a ${LABELS[next]}`);
    try { localStorage.setItem(KEY, next); } catch {}
  };

  const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <>
      <button
        type="button"
        onClick={cycle}
        aria-label={`Tema: ${LABELS[mode]}. Click para cambiar a ${LABELS[nextMode]}`}
        title={`Cambiar a ${LABELS[nextMode]}`}
        className="bi-shell-theme"
        data-mode={mode}
      >
        <span aria-hidden className="bi-shell-theme-icon">
          {mode === "light" ? "☀" : mode === "dark" ? "☾" : "◐"}
        </span>
        <span className="bi-shell-theme-label">{LABELS[mode]}</span>
      </button>
      <span role="status" aria-live="polite" className="bi-sr-only">{announcement}</span>
    </>
  );
}
