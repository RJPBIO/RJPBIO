"use client";
import { useEffect, useState } from "react";
import { useT } from "../../hooks/useT";

// Pill visible en el header que abre el command palette. Escucha eventos
// `bio-cmd:open` / `bio-cmd:close` para reflejar estado abierto con anillo
// fósforo — el loop visual que confirma al usuario que el atajo funcionó.
export default function CommandPaletteTrigger({ searchLabel = "Buscar" }) {
  const { t } = useT();
  const [isMac, setIsMac] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || ""));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => setActive(true);
    const onClose = () => setActive(false);
    window.addEventListener("bio-cmd:open", onOpen);
    window.addEventListener("bio-cmd:close", onClose);
    return () => {
      window.removeEventListener("bio-cmd:open", onOpen);
      window.removeEventListener("bio-cmd:close", onClose);
    };
  }, []);

  const open = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("bio-cmd:open"));
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("cmd.open")}
      aria-expanded={active}
      className="bi-shell-search"
      data-active={active ? "true" : undefined}
    >
      <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className="bi-shell-search-icon">
        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="bi-shell-search-label">{searchLabel}</span>
      <kbd className="bi-shell-search-kbd">{isMac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}
