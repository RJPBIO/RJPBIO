"use client";
/* ═══════════════════════════════════════════════════════════════
   CrisisSheet — bottom sheet con los 3 protocolos crisis del
   catálogo (#18 Emergency Reset, #19 Panic Interrupt, #20 Block
   Break). Tap → onSelectProtocol(protocol) → AppV2Root mounta
   el ProtocolPlayer con SafetyOverlay automático.
   Phase 6 SP4.
   Copy disciplinado: describe estado, no etiqueta crisis severa.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { ChevronRight, X } from "lucide-react";
import { getCrisisProtocols } from "@/lib/protocols";
import { colors, typography, spacing, radii, motion as motionTok } from "./tokens";

const STATE_COPY = {
  18: {
    label: "Pánico, ansiedad aguda",
    description: "Reset emocional con grounding sensorial 5-4-3-2-1.",
  },
  19: {
    label: "Crisis aguda, sensación de pérdida",
    description: "Interrupción vagal sin infraestructura externa.",
  },
  20: {
    label: "Bloqueo cognitivo, agotamiento",
    description: "Reset físico + mental para inercia paralizante.",
  },
};

export default function CrisisSheet({ open, onClose, onSelectProtocol }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === "Escape") onClose && onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const protocols = getCrisisProtocols();

  return (
    <div
      data-v2-crisis-sheet
      role="dialog"
      aria-modal="true"
      aria-label="Acceso rápido a protocolos de crisis"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(8,8,10,0.72)",
        // Phase 6D SP4b — Bug-28 excepción documentada. Crisis sheet
        // necesita separación clara del background sin perder contexto
        // (user puede ver brevemente que viene de Hoy/Datos/etc.). Blur
        // 8px es la cantidad mínima que logra esa hierarchy visual.
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animationName: "biCrisisSheetFade",
        animationDuration: `${motionTok.duration.enter}ms`,
        animationTimingFunction: motionTok.ease.out,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
    >
      <section
        ref={sheetRef}
        style={{
          width: "100%",
          maxWidth: 480,
          background: colors.bg.base,
          borderTop: `0.5px solid ${colors.separator}`,
          borderInline: `0.5px solid ${colors.separator}`,
          borderTopLeftRadius: radii.panelLg,
          borderTopRightRadius: radii.panelLg,
          padding: spacing.s24,
          paddingBlockEnd: `calc(${spacing.s24}px + env(safe-area-inset-bottom))`,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.s16,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: colors.accent.phosphorCyan,
                fontWeight: typography.weight.medium,
              }}
            >
              ESTOY AQUÍ
            </p>
            <h2
              style={{
                margin: "8px 0 0",
                fontFamily: typography.family,
                fontSize: 22,
                fontWeight: typography.weight.regular,
                letterSpacing: "-0.02em",
                color: colors.text.primary,
              }}
            >
              Cómo te sientes ahora
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="crisis-sheet-close"
            aria-label="Cerrar"
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              color: colors.text.muted,
              minWidth: 44,
              minHeight: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {protocols.map((p) => {
            const copy = STATE_COPY[p.id] || { label: p.n, description: p.sb };
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectProtocol && onSelectProtocol(p)}
                  data-testid={`crisis-option-${p.id}`}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${colors.separator}`,
                    borderRadius: radii.panel,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.s16,
                    color: "inherit",
                    textAlign: "start",
                    minHeight: 44,
                  }}
                >
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: typography.family,
                        fontSize: 15,
                        fontWeight: typography.weight.medium,
                        color: colors.text.primary,
                      }}
                    >
                      {copy.label}
                    </span>
                    <span
                      style={{
                        fontFamily: typography.family,
                        fontSize: 12,
                        fontWeight: typography.weight.regular,
                        color: colors.text.muted,
                        lineHeight: 1.4,
                      }}
                    >
                      {copy.description}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    strokeWidth={1.5}
                    color={colors.accent.phosphorCyan}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={onClose}
          data-testid="crisis-sheet-im-ok"
          style={{
            appearance: "none",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            color: colors.text.secondary,
            paddingBlock: spacing.s8,
            fontFamily: typography.family,
            fontSize: 13,
            fontWeight: typography.weight.regular,
            letterSpacing: "-0.005em",
          }}
        >
          Estoy bien por ahora
        </button>
      </section>
    </div>
  );
}
