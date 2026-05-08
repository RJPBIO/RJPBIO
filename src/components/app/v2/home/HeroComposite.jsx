"use client";
import { useEffect, useRef, useState } from "react";
import { Activity, Sparkles } from "lucide-react";
import { colors, typography, spacing, radii, motion as motionTok } from "../tokens";
// Phase Polish-Tier-2 Gap-4 — sparkline aditivo bajo el big number cuando
// hay >= 2 puntos de history. Preserva contract Phase 6H Fix1 (sparklineData
// es prop opcional, render condicional, no afecta selectors data-v2-hero*).
import Sparkline from "./Sparkline";

// Hero composite: kicker + numero gigante + linea coach.
// Count-up 0->valor en 650ms ease-out solo en mount.
//
// Phase 6H Premium-Fix1 — extension con readiness object opcional.
// Cuando se pasa `readiness` con shape extendido (computeReadiness output),
// el hero gana 2 modos nuevos:
//   · empty-state: readiness.score === null && !eligibleForFallback
//     → card educativa "Activa tu lectura completa" con CTAs HRV/Calibración
//   · partial: readiness.partial === true
//     → display normal + descriptor "LECTURA PARCIAL" + CTA "Activar lectura completa"
// Cuando readiness no se pasa (o source==='full'), comportamiento legacy
// idéntico — preserva contracts existentes para llamadas que aún usan `value`.

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

function useCountUp(target, duration = 650) {
  const [v, setV] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(0);
  useEffect(() => {
    const targetN = Math.max(0, Math.round(Number(target) || 0));
    setV(0);
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);
    const tick = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = EASE_OUT_CUBIC(t);
      setV(Math.round(targetN * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return v;
}

export default function HeroComposite({
  value,
  primaryLine,
  secondaryLine,
  // Phase 6H Premium-Fix1 — opcionales aditivos.
  readiness = null,
  onActivateHRV,
  onCalibrate,
  // Phase Polish-Tier-2 Gap-4 — sparkline data opcional (último 14 entries).
  // Shape: { bio: [{ value, ts }, ...] }. Sparkline auto-hide cuando bio.length<2.
  sparklineData = null,
}) {
  // Hook precede returns condicionales (Rules of Hooks). El `0` para empty-state
  // es benigno — el componente retorna empty card antes de usar `display`.
  const partial = !!(readiness && readiness.partial === true);
  const numericValue = readiness && typeof readiness.score === "number" ? readiness.score : value;
  const display = useCountUp(numericValue || 0, 650);

  // Modo empty-state: engine sin signals + sin elegibilidad para fallback.
  // (Pre-baseline sin coherencia válida — usuario aterriza en personalized
  // por dataMaturity pero el composite no es derivable.)
  if (readiness && readiness.score === null && !readiness.eligibleForFallback) {
    return <HeroEmptyState onActivateHRV={onActivateHRV} onCalibrate={onCalibrate} reason={readiness.reason} />;
  }

  return (
    <section
      data-v2-hero
      data-source={readiness?.source || "legacy"}
      data-partial={partial ? "true" : "false"}
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: 80,
        paddingBlockEnd: partial ? 24 : 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: 12,
        }}
      >
        TU SISTEMA HOY
      </div>
      <div
        aria-label={`Tu sistema hoy: ${numericValue} de 100${partial ? " (lectura parcial)" : ""}`}
        data-v2-hero-display
        style={{
          fontFamily: typography.family,
          fontSize: 128,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.045em",
          color: "rgba(255,255,255,0.96)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>
      {sparklineData?.bio && sparklineData.bio.length >= 2 && (
        <div
          data-v2-hero-sparkline
          style={{
            marginBlockStart: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Sparkline
            data={sparklineData.bio}
            width={140}
            height={24}
            ariaLabel={`Tendencia bio últimos ${sparklineData.bio.length} días`}
            testid="hero-sparkline"
          />
        </div>
      )}
      {partial && (
        <div
          data-v2-hero-partial-descriptor
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            opacity: 0.78,
            fontWeight: typography.weight.medium,
            marginBlockStart: 8,
          }}
        >
          LECTURA PARCIAL
        </div>
      )}
      <p
        style={{
          marginBlockStart: partial ? 16 : 24,
          marginBlockEnd: 0,
          textAlign: "center",
          maxWidth: 320,
          fontFamily: typography.family,
          fontSize: typography.size.subtitleMin,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.4,
        }}
      >
        {partial && readiness?.reason
          ? readiness.reason
          : <>{primaryLine}{secondaryLine ? " " : ""}{secondaryLine}</>}
      </p>
      {partial && (onActivateHRV || onCalibrate) && (
        <button
          type="button"
          data-testid="hero-activate-hrv"
          onClick={onActivateHRV || onCalibrate}
          style={{
            marginBlockStart: 20,
            appearance: "none",
            cursor: "pointer",
            background: "transparent",
            border: `1px solid ${colors.accent.phosphorCyan}`,
            borderRadius: radii.pill,
            color: colors.accent.phosphorCyan,
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontWeight: typography.weight.medium,
            paddingBlock: 12,
            paddingInline: 20,
            transitionProperty: "transform, background-color",
            transitionDuration: `${motionTok.duration.tap}ms`,
            transitionTimingFunction: motionTok.ease.out,
            minHeight: 44,
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          ACTIVAR LECTURA COMPLETA
        </button>
      )}
    </section>
  );
}

// Phase 6H Premium-Fix1 — empty-state card cuando engine no puede derivar
// composite (pre-baseline sin coherencia válida). NO usa el display gigante
// "0" — sustituye con eyebrow + título compacto + 2 CTAs cyan stacked.
// Mantiene `data-v2-hero` selector para que tests existing y assertHomeViewportNotEmpty
// (helpers.ts:455-470) sigan reconociendo este componente como "actionable content".
function HeroEmptyState({ onActivateHRV, onCalibrate, reason }) {
  return (
    <section
      data-v2-hero
      data-empty-state="true"
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: colors.bg.raised,
          border: `0.5px solid ${colors.accent.phosphorCyan}`,
          borderRadius: radii.panelLg,
          padding: spacing.s24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            opacity: 0.78,
            fontWeight: typography.weight.medium,
          }}
        >
          TU SISTEMA
        </span>
        <h2
          style={{
            margin: 0,
            marginBlockStart: 12,
            fontFamily: typography.family,
            fontSize: 28,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.02em",
            color: colors.text.strong,
            lineHeight: 1.15,
            textAlign: "center",
          }}
        >
          Activa tu lectura completa
        </h2>
        <p
          style={{
            margin: 0,
            marginBlockStart: 12,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            lineHeight: 1.45,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {reason || "Completa al menos 3 señales para tu composite real."}
        </p>
        <div
          style={{
            marginBlockStart: spacing.s24,
            display: "flex",
            flexDirection: "column",
            gap: spacing.s12,
            width: "100%",
          }}
        >
          {onActivateHRV && (
            <button
              type="button"
              data-testid="hero-empty-activate-hrv"
              onClick={onActivateHRV}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: colors.accent.phosphorCyan,
                border: "none",
                borderRadius: radii.pill,
                color: colors.bg.base,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                paddingBlock: 14,
                paddingInline: 18,
                minHeight: 48,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transitionProperty: "transform, opacity",
                transitionDuration: `${motionTok.duration.tap}ms`,
                transitionTimingFunction: motionTok.ease.out,
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Activity size={16} strokeWidth={1.8} aria-hidden="true" />
              MEDIR HRV
            </button>
          )}
          {onCalibrate && (
            <button
              type="button"
              data-testid="hero-empty-calibrate"
              onClick={onCalibrate}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: `1px solid ${colors.accent.phosphorCyan}`,
                borderRadius: radii.pill,
                color: colors.accent.phosphorCyan,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                paddingBlock: 14,
                paddingInline: 18,
                minHeight: 48,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transitionProperty: "transform, background-color",
                transitionDuration: `${motionTok.duration.tap}ms`,
                transitionTimingFunction: motionTok.ease.out,
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Sparkles size={16} strokeWidth={1.8} aria-hidden="true" />
              CRONOTIPO + PSS-4
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
