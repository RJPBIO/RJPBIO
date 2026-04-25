"use client";
/* ═══════════════════════════════════════════════════════════════
   OfflineChip — pill esquina inferior-izquierda que aparece offline
   y muestra "Conexión restaurada — sincronizando" al reconectar.
   Animación spring elegante (entrada y salida); respeta prefers-
   reduced-motion sin movimiento, solo opacity.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useReducedMotion } from "../lib/a11y";
import { cssVar, space, font } from "./ui/tokens";

export default function OfflineChip() {
  const online = useOnlineStatus();
  const reduced = useReducedMotion();
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

  const visible = !online || showRestored;
  const restored = online && showRestored;
  const dotColor = restored ? cssVar.success : cssVar.warn;
  const label = restored
    ? "Conexión restaurada — sincronizando"
    : "Sin conexión — cambios locales se sincronizarán al volver";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={restored ? "restored" : "offline"}
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
          transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 280, damping: 26 }}
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
          }}
        >
          <motion.span
            aria-hidden
            animate={reduced ? {} : { scale: [1, 1.25, 1] }}
            transition={reduced ? {} : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
