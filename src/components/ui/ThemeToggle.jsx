"use client";
import { useEffect, useState } from "react";

/**
 * Ciclo (solo /app): system → light → dim → system. Persiste en localStorage
 * bajo `bio-theme`. Aplica `theme-light` o `theme-dim` en <html>. Sin FOUC:
 * el script inline del layout lo lee antes del primer paint. El marketing
 * site no monta este componente (identidad única: luz + #059669).
 */
const KEY = "bio-theme";
const ORDER = ["system", "light", "dim"];
const LABELS = { system: "Auto", light: "Claro", dim: "Dim" };

function apply(mode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-light", "theme-dark", "theme-dim");
  if (mode === "light") html.classList.add("theme-light");
  else if (mode === "dim") html.classList.add("theme-dim");
  // system: sin clase → script del layout aplica por prefers-color-scheme.
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
          {mode === "light" ? "☀" : mode === "dim" ? "☾" : "◐"}
        </span>
        <span className="bi-shell-theme-label">{LABELS[mode]}</span>
      </button>
      <span role="status" aria-live="polite" className="bi-sr-only">{announcement}</span>
    </>
  );
}
