"use client";
/* ═══════════════════════════════════════════════════════════════
   InstallBanner — banner discreto inferior que ofrece instalar la
   PWA cuando el navegador emite `beforeinstallprompt`.

   Se muestra sólo si:
     - El evento BIP está disponible (Chrome/Edge/Samsung, etc.)
     - El usuario tiene engagement mínimo (totalSessions >= 1)
     - No descartó hace menos de 7 días
     - La app no está ya instalada (display-mode: standalone)

   Polish: enter/exit animados, touch targets ≥44px, hover/focus
   states, respeta prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useReducedMotion } from "../lib/a11y";
import { useHaptic } from "../hooks/useHaptic";
import { cssVar, radius, space, font } from "./ui/tokens";

export default function InstallBanner() {
  const totalSessions = useStore((s) => s.totalSessions || 0);
  const engaged = totalSessions >= 1;
  const reduced = useReducedMotion();
  const haptic = useHaptic();
  const { visible, install, dismiss } = useInstallPrompt({ engaged });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Instalar aplicación"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
          transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 300, damping: 28 }}
          style={{
            position: "fixed",
            insetBlockEnd: `calc(${space[4]}px + 68px + env(safe-area-inset-bottom, 0px))`,
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
            maxInlineSize: "min(460px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 24px))",
          }}
        >
          <span
            aria-hidden
            style={{
              inlineSize: 36,
              blockSize: 36,
              borderRadius: radius.md,
              background: `color-mix(in srgb, ${cssVar.accent} 15%, transparent)`,
              color: cssVar.accent,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: font.weight.bold,
              fontSize: 18,
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
          <motion.button
            type="button"
            onClick={() => { haptic("tap"); install(); }}
            whileTap={reduced ? undefined : { scale: 0.96 }}
            style={{
              background: cssVar.accent,
              color: cssVar.accentInk,
              border: "none",
              borderRadius: radius.md,
              padding: `0 ${space[3]}px`,
              minBlockSize: 44,
              fontSize: font.size.sm,
              fontWeight: font.weight.bold,
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            Instalar
          </motion.button>
          <motion.button
            type="button"
            onClick={() => { haptic("tap"); dismiss(); }}
            aria-label="Descartar prompt de instalación"
            whileTap={reduced ? undefined : { scale: 0.92 }}
            style={{
              background: "transparent",
              border: "none",
              color: cssVar.textMuted,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              minInlineSize: 44,
              minBlockSize: 44,
              fontFamily: "inherit",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
