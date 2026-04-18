"use client";
/* ═══════════════════════════════════════════════════════════════
   TOAST · global notifications (tokens, a11y, reduced-motion)
   ───────────────────────────────────────────────────────────────
   Uso:
     import { toast } from "@/components/ui/Toast";
     toast.success("Invitación enviada");
     toast.error("No se pudo conectar", { action: { label: "Reintentar", onClick: ... } });
   Montaje único desde GlobalChrome. Emite eventos con window.dispatchEvent.
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState, useCallback } from "react";
import { cssVar, radius, space, font } from "./tokens";

const EVENT = "bio-toast:push";

function push(variant, message, opts = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, {
    detail: {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      variant,
      message,
      duration: opts.duration ?? (variant === "error" ? 6000 : 3500),
      action: opts.action || null,
    },
  }));
}

export const toast = {
  success: (m, o) => push("success", m, o),
  error:   (m, o) => push("error", m, o),
  info:    (m, o) => push("info", m, o),
  warn:    (m, o) => push("warn", m, o),
};

export default function ToastHost() {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => {
    setItems((xs) => xs.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onPush = (e) => {
      const t = e.detail;
      setItems((xs) => [...xs, t]);
      if (t.duration > 0) setTimeout(() => remove(t.id), t.duration);
    };
    window.addEventListener(EVENT, onPush);
    return () => window.removeEventListener(EVENT, onPush);
  }, [remove]);

  if (!items.length) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      style={{
        position: "fixed",
        insetBlockEnd: space[6],
        insetInlineEnd: space[6],
        zIndex: 320,
        display: "flex",
        flexDirection: "column",
        gap: space[2],
        pointerEvents: "none",
        maxInlineSize: "min(420px, calc(100vw - 32px))",
      }}
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onClose }) {
  const color = VARIANT[t.variant] || VARIANT.info;
  return (
    <div
      role={t.variant === "error" ? "alert" : "status"}
      aria-live={t.variant === "error" ? "assertive" : "polite"}
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: space[3],
        padding: `${space[3]}px ${space[4]}px`,
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderInlineStartWidth: 3,
        borderInlineStartColor: color,
        borderRadius: radius.md,
        boxShadow: "0 12px 32px -12px rgba(0,0,0,0.4)",
        animation: "bi-toast-in 0.18s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span aria-hidden style={{ color, fontSize: 16, lineHeight: 1, marginBlockStart: 2 }}>
        {ICON[t.variant] || ICON.info}
      </span>
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <div style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: cssVar.text, lineHeight: 1.4 }}>
          {t.message}
        </div>
        {t.action && (
          <button
            type="button"
            onClick={() => { t.action.onClick?.(); onClose(); }}
            style={{
              marginBlockStart: space[2],
              background: "transparent",
              border: "none",
              color,
              fontSize: font.size.sm,
              fontWeight: font.weight.semibold,
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          background: "transparent",
          border: "none",
          color: cssVar.textMuted,
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
          fontFamily: "inherit",
        }}
      >
        ×
      </button>
    </div>
  );
}

const VARIANT = {
  success: "#10B981",
  error:   "#EF4444",
  warn:    "#F59E0B",
  info:    "var(--bi-accent)",
};

const ICON = {
  success: "✓",
  error:   "!",
  warn:    "▲",
  info:    "◉",
};
