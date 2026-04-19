"use client";
/* ═══════════════════════════════════════════════════════════════
   InstallBanner — banner discreto inferior que ofrece instalar la
   PWA cuando el navegador emite `beforeinstallprompt`.

   Se muestra sólo si:
     - El evento BIP está disponible (Chrome/Edge/Samsung, etc.)
     - El usuario tiene engagement mínimo (totalSessions>=1)
     - No descartó hace menos de 7 días
     - La app no está ya instalada (display-mode: standalone)
   ═══════════════════════════════════════════════════════════════ */

import { useStore } from "../store/useStore";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { cssVar, radius, space, font } from "./ui/tokens";

export default function InstallBanner() {
  const totalSessions = useStore((s) => s.totalSessions || 0);
  const engaged = totalSessions >= 1;
  const { visible, install, dismiss } = useInstallPrompt({ engaged });

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      style={{
        position: "fixed",
        insetBlockEnd: space[4],
        insetInlineStart: "50%",
        transform: "translateX(-50%)",
        zIndex: 310,
        display: "flex",
        alignItems: "center",
        gap: space[3],
        padding: `${space[3]}px ${space[4]}px`,
        background: cssVar.surface,
        border: `1px solid ${cssVar.borderStrong}`,
        borderRadius: radius.lg,
        boxShadow: "0 16px 40px -16px rgba(0,0,0,0.45)",
        maxInlineSize: "min(460px, calc(100vw - 24px))",
      }}
    >
      <span
        aria-hidden
        style={{
          inlineSize: 32,
          blockSize: 32,
          borderRadius: radius.md,
          background: `color-mix(in srgb, ${cssVar.accent} 15%, transparent)`,
          color: cssVar.accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: font.weight.bold,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        ↓
      </span>
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <div style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: cssVar.text, lineHeight: 1.3 }}>
          Instalar BIO-IGNICIÓN
        </div>
        <div style={{ fontSize: font.size.sm, color: cssVar.textDim, marginBlockStart: 2 }}>
          Añade la app a tu pantalla — acceso rápido sin navegador.
        </div>
      </div>
      <button
        type="button"
        onClick={install}
        style={{
          background: cssVar.accent,
          color: cssVar.accentInk,
          border: "none",
          borderRadius: radius.md,
          padding: `${space[2]}px ${space[3]}px`,
          fontSize: font.size.sm,
          fontWeight: font.weight.bold,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        Instalar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Descartar"
        style={{
          background: "transparent",
          border: "none",
          color: cssVar.textMuted,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: space[1],
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
