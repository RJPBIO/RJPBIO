"use client";
/* ═══════════════════════════════════════════════════════════════
   BillingBanner — pill discreta arriba del PWA durante trial activo.
   ═══════════════════════════════════════════════════════════════
   Estados:
     · Trial Pro 1-7 días restantes  → "Te quedan N días de Pro"
     · Trial expirando 1 día          → urgencia visible (warn color)
     · Dunning (past_due)             → "Pago pendiente — actualiza"
     · Plan PRO confirmado            → no banner (UX limpia)
     · FREE sin trial                 → no banner

   Subscribe a "bio-billing-update" event que sync.js dispatcha tras
   pullRemote. window.__bioBilling sirve como snapshot inicial para
   componentes que montan después del primer pull.

   Discreto: pill 28px tall, no bloquea UI, dismissible por sesión
   (no persistido — quincena trial corta debe re-aparecer al recargar).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { isInTrial, trialDaysLeft, PLAN_LABELS } from "../lib/billing";

export default function BillingBanner({ accent = "#22D3EE" }) {
  const [billing, setBilling] = useState(() => {
    if (typeof window !== "undefined" && window.__bioBilling) return window.__bioBilling;
    return null;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onUpdate = (e) => setBilling(e.detail || null);
    if (typeof window !== "undefined") {
      window.addEventListener("bio-billing-update", onUpdate);
      return () => window.removeEventListener("bio-billing-update", onUpdate);
    }
  }, []);

  if (!billing || dismissed) return null;

  const { plan, trialEndsAt, dunningState } = billing;

  // Caso 1: Dunning — pago rechazado, urgencia roja
  if (dunningState === "past_due") {
    return (
      <Banner
        tone="error"
        accent={accent}
        message="Pago rechazado · actualiza tu método para mantener acceso."
        cta="Resolver"
        href="/account"
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  // Caso 2: Trial activo — countdown
  if (isInTrial(trialEndsAt)) {
    const days = trialDaysLeft(trialEndsAt);
    const urgent = days <= 1;
    return (
      <Banner
        tone={urgent ? "warn" : "info"}
        accent={accent}
        message={
          days === 0
            ? "Tu trial termina hoy — confirma tu suscripción"
            : days === 1
              ? "Te queda 1 día de prueba Pro · confirma para continuar"
              : `Te quedan ${days} días de prueba Pro`
        }
        cta="Confirmar"
        href="/account"
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  // Caso 3: Trial expirado, plan revirtió a FREE — soft prompt
  if (plan === "FREE" && trialEndsAt && !isInTrial(trialEndsAt)) {
    return (
      <Banner
        tone="info"
        accent={accent}
        message="Tu prueba expiró — reactiva Pro para sesiones ilimitadas"
        cta="Activar Pro"
        href="/account"
        onDismiss={() => setDismissed(true)}
      />
    );
  }

  // PRO confirmado, FREE sin trial → no banner
  return null;
}

function Banner({ tone, accent, message, cta, href, onDismiss }) {
  const colors = {
    info: { bg: `${accent}10`, border: `${accent}28`, text: "var(--bi-text-strong, #0F172A)" },
    warn: { bg: "#F59E0B12", border: "#F59E0B40", text: "#F59E0B" },
    error: { bg: "#DC262612", border: "#DC262640", text: "#DC2626" },
  }[tone] || { bg: `${accent}10`, border: `${accent}28`, text: "currentColor" };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingBlock: 8,
        paddingInline: 14,
        marginBlockEnd: 12,
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        fontSize: 12,
        lineHeight: 1.3,
      }}
    >
      <span style={{ flex: 1, minInlineSize: 0, color: colors.text, fontWeight: 600 }}>
        {message}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <Link
          href={href}
          style={{
            color: colors.text,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: 0.3,
            fontSize: 11,
            textTransform: "uppercase",
          }}
        >
          {cta} →
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar banner"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 2,
            color: colors.text,
            opacity: 0.6,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </span>
    </div>
  );
}
