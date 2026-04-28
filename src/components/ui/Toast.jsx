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
import { useEffect, useRef, useState, useCallback } from "react";
import { cssVar, radius, space, font } from "./tokens";

const EVENT = "bio-toast:push";
const MAX_STACK = 5;

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
      setItems((xs) => {
        const next = [...xs, t];
        return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
      });
    };
    window.addEventListener(EVENT, onPush);
    return () => window.removeEventListener(EVENT, onPush);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setItems((xs) => xs.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      style={{
        position: "fixed",
        insetBlockEnd: `calc(${space[6]}px + env(safe-area-inset-bottom, 0px))`,
        insetInlineEnd: `calc(${space[6]}px + env(safe-area-inset-right, 0px))`,
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
  const rootRef = useRef(null);
  const timerRef = useRef(null);
  const deadlineRef = useRef(0);
  const remainingRef = useRef(t.duration);
  const [paused, setPaused] = useState(false);

  const startTimer = useCallback((ms) => {
    if (!ms || ms <= 0) return;
    clearTimeout(timerRef.current);
    deadlineRef.current = Date.now() + ms;
    timerRef.current = setTimeout(onClose, ms);
  }, [onClose]);

  const pause = useCallback(() => {
    if (!t.duration || t.duration <= 0) return;
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    const left = deadlineRef.current - Date.now();
    remainingRef.current = Math.max(0, left);
    setPaused(true);
  }, [t.duration]);

  const resume = useCallback(() => {
    if (!t.duration || t.duration <= 0) return;
    if (timerRef.current) return;
    setPaused(false);
    startTimer(remainingRef.current || t.duration);
  }, [t.duration, startTimer]);

  useEffect(() => {
    remainingRef.current = t.duration;
    startTimer(t.duration);
    return () => clearTimeout(timerRef.current);
  }, [t.duration, startTimer]);

  return (
    <div
      ref={rootRef}
      role={t.variant === "error" ? "alert" : "status"}
      aria-live={t.variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={(e) => { if (!rootRef.current?.contains(e.relatedTarget)) resume(); }}
      style={{
        pointerEvents: "auto",
        position: "relative",
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
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden
        style={{
          color, fontSize: 12, lineHeight: 1, marginBlockStart: 2,
          width: 22, height: 22, borderRadius: 999,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: `color-mix(in srgb, ${color} 18%, transparent)`,
          border: `1px solid ${color}`,
          fontWeight: font.weight.bold,
          flexShrink: 0,
          animation: "bi-ionize 0.7s ease-out",
        }}
      >
        {ICON[t.variant] || ICON.info}
      </span>
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <div style={{ fontSize: font.size.md, fontWeight: font.weight.medium, color: cssVar.text, lineHeight: 1.4 }}>
          {t.message}
        </div>
        {t.action && (
          <button
            type="button"
            className="bi-toast-action"
            onClick={() => { t.action.onClick?.(); onClose(); }}
            style={{
              marginBlockStart: space[2],
              background: "transparent",
              border: "none",
              color,
              fontSize: font.size.sm,
              fontWeight: font.weight.semibold,
              cursor: "pointer",
              padding: `${space[1]}px ${space[2]}px`,
              marginInlineStart: `-${space[2]}px`,
              fontFamily: "inherit",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              borderRadius: radius.sm,
            }}
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="bi-toast-close"
        onClick={onClose}
        aria-label="Cerrar notificación"
        style={{
          background: "transparent",
          border: "none",
          color: cssVar.textMuted,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          inlineSize: 44,
          blockSize: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.sm,
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        ×
      </button>
      {t.duration > 0 && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetBlockEnd: 0,
            blockSize: 2,
            inlineSize: "100%",
            background: `color-mix(in srgb, ${color} 60%, transparent)`,
            transformOrigin: "left",
            animation: `bi-toast-progress ${t.duration}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      )}
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
