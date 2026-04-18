"use client";
/* ═══════════════════════════════════════════════════════════════
   OfflineChip — pill discreta esquina inferior-izquierda que sólo
   aparece cuando el navegador reporta offline. Silencioso online:
   cero ruido visual cuando todo funciona.
   ═══════════════════════════════════════════════════════════════ */

import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { cssVar, radius, space, font } from "./ui/tokens";

export default function OfflineChip() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        insetBlockEnd: space[4],
        insetInlineStart: space[4],
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
      }}
    >
      <span
        aria-hidden
        style={{
          inlineSize: 8,
          blockSize: 8,
          borderRadius: 999,
          background: cssVar.warn,
          display: "inline-block",
          boxShadow: `0 0 0 3px color-mix(in srgb, ${cssVar.warn} 18%, transparent)`,
        }}
      />
      Sin conexión — cambios locales se sincronizarán al volver
    </div>
  );
}
