"use client";
/* ═══════════════════════════════════════════════════════════════
   MarkMomentSheet — marcar un momento de vida para el diario autonómico.
   ───────────────────────────────────────────────────────────────
   Overlay simple: etiqueta opcional + contexto (chip) → logLifeEvent.
   El momento se ancla a "ahora". La huella la deriva autonomicJournal
   con las lecturas HRV cercanas. ADN PWA oscuro.
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { JOURNAL_CONTEXTS } from "@/lib/autonomicJournal";
import { colors, typography, spacing } from "../tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function MarkMomentSheet({ onSave, onClose }) {
  const [label, setLabel] = useState("");
  const [context, setContext] = useState(null);

  const canSave = !!context;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Marcar un momento"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,4,6,0.78)",
        zIndex: 1100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          inlineSize: "100%",
          maxInlineSize: 460,
          background: "#0E0E12",
          borderStartStartRadius: 24,
          borderStartEndRadius: 24,
          border: `0.5px solid ${colors.separator}`,
          padding: spacing.s24,
          paddingBlockEnd: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ACCENT,
            fontWeight: typography.weight.medium,
          }}
        >
          Marcar un momento
        </div>
        <p style={{ margin: 0, fontFamily: typography.family, fontSize: typography.size.caption, color: colors.text.secondary, lineHeight: 1.5 }}>
          Queda anclado a ahora. Si mides tu HRV cerca, verás su huella fisiológica.
        </p>

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="¿Qué pasó? (opcional)"
          maxLength={120}
          style={{
            appearance: "none",
            background: "rgba(255,255,255,0.04)",
            border: `0.5px solid ${colors.separator}`,
            borderRadius: 12,
            padding: "12px 14px",
            color: colors.text.primary,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {JOURNAL_CONTEXTS.map((c) => {
            const on = context === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setContext(on ? null : c.id)}
                style={{
                  appearance: "none",
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: on ? `rgba(34,211,238,0.16)` : "transparent",
                  border: `0.5px solid ${on ? ACCENT : colors.separator}`,
                  color: on ? ACCENT : colors.text.secondary,
                  fontFamily: typography.family,
                  fontSize: typography.size.caption,
                  fontWeight: typography.weight.medium,
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: spacing.s16, marginBlockStart: spacing.s8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: "0 0 auto",
              appearance: "none",
              cursor: "pointer",
              padding: "12px 20px",
              background: "transparent",
              border: `0.5px solid ${colors.separator}`,
              borderRadius: 999,
              color: colors.text.secondary,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.medium,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => canSave && onSave({ ts: Date.now(), label: label.trim(), context })}
            style={{
              flex: 1,
              appearance: "none",
              cursor: canSave ? "pointer" : "default",
              padding: "12px 20px",
              background: canSave ? ACCENT : "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 999,
              color: canSave ? "#08080A" : colors.text.muted,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.04em",
            }}
          >
            Guardar momento
          </button>
        </div>
      </div>
    </div>
  );
}
