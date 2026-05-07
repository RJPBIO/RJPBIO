"use client";
/* ═══════════════════════════════════════════════════════════════
   CrisisFAB — botón flotante persistente para acceso rápido a
   protocolos crisis (#18, #19, #20).
   Phase 6 SP4. Posición bottom-right encima de BottomNavV2.
   ADN: phosphorCyan border, dark bg, ≥44px tap target.
   ═══════════════════════════════════════════════════════════════ */

import { LifeBuoy } from "lucide-react";
import { colors, typography, layout, motion as motionTok } from "./tokens";

export default function CrisisFAB({ onOpenSheet }) {
  return (
    <button
      type="button"
      onClick={onOpenSheet}
      data-v2-crisis-fab
      aria-label="Acceso rápido a protocolo de crisis"
      style={{
        position: "fixed",
        // Phase 6H Polish-1 — safe-area-inset-right para landscape con
        // notch. max(16px, ...) preserva separación mínima en devices
        // sin notch. fallback 0 cuando env() no soportado.
        right: `max(16px, env(safe-area-inset-right, 0px))`,
        // Phase 6H Polish-1 — safe-area-inset-bottom matchea el patrón
        // canon del shell v2 (ver AppV2Root.jsx:895, CoachV2.jsx:477).
        // BottomNavV2 extiende su altura visual debajo del home indicator
        // sumando safe-area-inset-bottom; FAB se posiciona 16px arriba
        // del nav visual real para no chocar con tabs/labels.
        bottom: `calc(${layout.bottomNavHeight}px + 16px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 55,
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minWidth: 44,
        minHeight: 44,
        paddingInline: 14,
        paddingBlock: 10,
        background: "rgba(8,8,10,0.85)",
        // Phase 6D SP4b — Bug-28 excepción documentada. ADN v2 prohíbe
        // glassmorphism en general, pero CrisisFAB necesita legibilidad
        // sobre cualquier background del tab activo (HomeV2, DataV2,
        // etc.). Backdrop-filter mantiene el botón visible sin fondo
        // sólido que rompa el flow visual del contenido.
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: colors.accent.phosphorCyan,
        border: `0.5px solid ${colors.accent.phosphorCyan}`,
        borderRadius: 999,
        fontFamily: typography.familyMono,
        fontSize: typography.size.microCaps,
        fontWeight: typography.weight.medium,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        transitionProperty: "transform, background",
        transitionDuration: `${motionTok.duration.tap}ms`,
        transitionTimingFunction: motionTok.ease.out,
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <LifeBuoy size={16} strokeWidth={1.5} aria-hidden="true" />
      <span>SOS</span>
    </button>
  );
}
