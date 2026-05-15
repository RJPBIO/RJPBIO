"use client";
/* ═══════════════════════════════════════════════════════════════
   CohortCountdown — SP-MKT Capa 1 D9
   ───────────────────────────────────────────────────────────────
   Renders live countdown a la fecha de cierre cohorte piloto Q2 2026.
   Format compacto "Xd Yh Zm", tabular-nums, aria-live polite.

   - SSR-safe: pre-hydration renderiza placeholder neutral.
   - Env-driven: NEXT_PUBLIC_COHORT_CLOSE_DATE (ISO) o default
     2026-05-15T23:59:59-05:00 (CDMX).
   - Update interval 60s (no point updating segundos en marketing).
   - Expired: muestra mensaje de transición a Q3.

   Props:
     - date?: string ISO. Default env var, después constante CDMX.
     - locale?: "es" | "en". Default "es". Solo afecta texto "expired".

   ADN compliance:
     - Cero framer-motion (consistency con MockupFrame + foundation).
     - Cero emojis ni glifos genéricos.
     - tabular-nums + JetBrains Mono via parent.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";

const DEFAULT_DATE = "2026-05-15T23:59:59-05:00";

const COPY = {
  es: {
    placeholder: "—d —h —m",
    expired: "COHORTE CERRADA · Q3 ABIERTA",
  },
  en: {
    placeholder: "—d —h —m",
    expired: "COHORT CLOSED · Q3 OPEN",
  },
};

export function computeRemaining(targetMs, nowMs) {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { expired: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  return { days, hours, minutes, expired: false };
}

export default function CohortCountdown({ date, locale = "es", className }) {
  const targetDate =
    date ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COHORT_CLOSE_DATE) ||
    DEFAULT_DATE;
  const [remaining, setRemaining] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const targetMs = new Date(targetDate).getTime();
    function update() {
      setRemaining(computeRemaining(targetMs, Date.now()));
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [targetDate]);

  const t = COPY[locale] || COPY.es;
  const style = {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
  };

  if (!hydrated || !remaining) {
    return (
      <span
        className={className}
        style={style}
        data-testid="cohort-countdown"
        data-state="placeholder"
      >
        {t.placeholder}
      </span>
    );
  }
  if (remaining.expired) {
    return (
      <span
        className={className}
        style={style}
        data-testid="cohort-countdown"
        data-state="expired"
        aria-live="polite"
      >
        {t.expired}
      </span>
    );
  }
  return (
    <span
      className={className}
      style={style}
      data-testid="cohort-countdown"
      data-state="live"
      aria-live="polite"
      aria-label={`${remaining.days} días ${remaining.hours} horas ${remaining.minutes} minutos restantes`}
    >
      {remaining.days}d {remaining.hours}h {remaining.minutes}m
    </span>
  );
}
