"use client";
/* ═══════════════════════════════════════════════════════════════
   OfflineChip — pill discreta esquina inferior-izquierda que sólo
   aparece cuando el navegador reporta offline, con un breve pulso
   de "Conexión restaurada" al reconectar.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { cssVar, space, font } from "./ui/tokens";

export default function OfflineChip() {
  const online = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      setShowRestored(false);
      return;
    }
    if (!wasOfflineRef.current) return;
    wasOfflineRef.current = false;
    setShowRestored(true);
    const t = setTimeout(() => setShowRestored(false), 2800);
    return () => clearTimeout(t);
  }, [online]);

  if (online && !showRestored) return null;

  const restored = online && showRestored;
  const dotColor = restored ? cssVar.success : cssVar.warn;
  const label = restored
    ? "Conexión restaurada — sincronizando"
    : "Sin conexión — cambios locales se sincronizarán al volver";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        insetBlockEnd: `calc(${space[4]}px + env(safe-area-inset-bottom, 0px))`,
        insetInlineStart: `calc(${space[4]}px + env(safe-area-inset-left, 0px))`,
        zIndex: 300,
        display: "inline-flex",
        alignItems: "center",
        gap: space[2],
        padding: `${space[1]}px ${space[3]}px`,
        background: cssVar.surface,
        border: `1px solid ${cssVar.borderStrong}`,
        borderRadius: 999,
        boxShadow: "0 8px 24px -10px rgba(0,0,0,0.35)",
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        color: cssVar.textDim,
        transition: "opacity 0.25s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          inlineSize: 8,
          blockSize: 8,
          borderRadius: 999,
          background: dotColor,
          display: "inline-block",
          boxShadow: `0 0 0 3px color-mix(in srgb, ${dotColor} 18%, transparent)`,
        }}
      />
      {label}
    </div>
  );
}
