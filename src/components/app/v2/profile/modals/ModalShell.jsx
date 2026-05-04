"use client";
import { useEffect } from "react";
import { colors, typography, spacing, radii } from "../../tokens";

// Phase 6D SP4a — primitive compartido para los modales DSAR + Account
// (DsarRequestModal, ChangeEmailModal, UnlinkProviderModal, SignoutModal).
// Replica el chrome de MfaStepUpModal (Phase 6C) para consistencia ADN
// sin duplicar markup. ESC y backdrop click cierran (cuando onClose pasado).
//
// Estructura:
//   <ModalShell title eyebrow eyebrowTone onClose>
//     <Body>...content...</Body>
//     <Footer>...buttons...</Footer>
//   </ModalShell>
//
// El consumer renderiza children directos; ModalShell sólo provee el
// backdrop, el container, el header con eyebrow + título, y maneja keyboard.

export default function ModalShell({
  title,
  eyebrow,
  eyebrowTone = "cyan",  // "cyan" | "danger" | "muted"
  onClose,
  children,
  testId,
  maxWidth = 380,
}) {
  // ESC closes — patrón estándar accessible modal.
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const eyebrowColor =
    eyebrowTone === "danger" ? colors.semantic.danger :
    eyebrowTone === "muted" ? colors.text.muted :
    colors.accent.phosphorCyan;

  return (
    <div
      data-v2-modal-shell={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={testId ? `${testId}-title` : undefined}
      onClick={(e) => {
        // Backdrop click cierra. Click DENTRO del container NO propaga.
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.s24,
        zIndex: 100,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          maxWidth,
          width: "100%",
          background: colors.bg.base,
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panelLg,
          padding: spacing.s32,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        {eyebrow && (
          <div
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: eyebrowColor,
              fontWeight: typography.weight.medium,
            }}
          >
            {eyebrow}
          </div>
        )}
        {title && (
          <h2
            id={testId ? `${testId}-title` : undefined}
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.subtitleMin,
              fontWeight: typography.weight.medium,
              color: colors.text.strong,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

// Helper para los CTAs del footer — mantiene ADN cyan/danger consistente
// y disabled state (durante submit). Reutilizado por todos los modales.
export function ModalCta({
  children,
  onClick,
  variant = "primary",   // "primary" | "outlined" | "danger"
  disabled = false,
  testId,
}) {
  const isDanger = variant === "danger";
  const isOutlined = variant === "outlined";
  const accent = isDanger ? colors.semantic.danger : colors.accent.phosphorCyan;
  const bg = disabled
    ? "rgba(255,255,255,0.06)"
    : isOutlined ? "transparent" : accent;
  const fg = disabled
    ? "rgba(255,255,255,0.32)"
    : isOutlined ? accent : colors.bg.base;
  const border = isOutlined
    ? `0.5px solid ${disabled ? "rgba(255,255,255,0.16)" : accent}`
    : "none";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      style={{
        appearance: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: bg,
        color: fg,
        border,
        borderRadius: radii.pill,
        padding: "12px 20px",
        minBlockSize: 48,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        fontWeight: typography.weight.medium,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "background 180ms ease, color 180ms ease",
      }}
    >
      {children}
    </button>
  );
}

export function ModalRow({ children, justify = "space-between" }) {
  return (
    <div
      style={{
        display: "flex",
        gap: spacing.s16,
        justifyContent: justify,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {children}
    </div>
  );
}

export function ModalText({ children, tone = "primary" }) {
  const color =
    tone === "muted" ? colors.text.muted :
    tone === "secondary" ? colors.text.secondary :
    tone === "danger" ? colors.semantic.danger :
    colors.text.strong;
  return (
    <p
      style={{
        margin: 0,
        fontFamily: typography.family,
        fontSize: typography.size.bodyMin,
        fontWeight: typography.weight.regular,
        color,
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

// CSRF helper — el repo usa double-submit con cookie `bio-csrf` seteada
// por middleware en cada GET no-/api/. Para mutations: leer cookie y
// mandarla como header `x-csrf-token` (lo que `requireCsrf` valida).
// Si la cookie no existe (sesión muy vieja, browser nuevo), retorna ""
// y el server rechazará 403 — el modal mostrará el error.
export function readCsrfToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)bio-csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

// Wrapper de fetch con CSRF header automático para mutations a endpoints
// del repo. Method, headers extras y body normales.
export async function csrfFetch(url, init = {}) {
  const token = readCsrfToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set("x-csrf-token", token);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(url, { ...init, headers, credentials: "include" });
}
