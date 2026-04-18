"use client";
import { useEffect, useState } from "react";
import { useT } from "../../hooks/useT";
import { cssVar, radius, space, font } from "./tokens";

// Pill visible en el header que abre el command palette. Cliente mínimo —
// solo despacha el evento; la paleta está montada en GlobalChrome.
export default function CommandPaletteTrigger() {
  const { t } = useT();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || ""));
  }, []);

  const open = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("bio-cmd:open"));
  };

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("cmd.open")}
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
      <span aria-hidden>⌕</span>
      <kbd style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        padding: "1px 5px",
        border: `1px solid ${cssVar.border}`,
        borderRadius: 4,
        background: cssVar.surface2,
        color: cssVar.textMuted,
      }}>
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
