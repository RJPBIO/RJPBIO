"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase Polish-Tier-3 — MonthlyDigestSheet
   ───────────────────────────────────────────────────────────────
   Sheet bottom-up Whoop-style con summary del último período de
   30 días. Triggered por AppV2Root cuando totalSessions ≥ 30 y
   daysSinceLastDigest ≥ 28 (ver wiring AppV2Root para detection).

   Pattern reuse de StreakMilestoneSheet (Phase 6I-2): mismo
   z-index 1000/1001, mismo focus-trap, misma triada a11y. NO
   tiene auto-dismiss (8s) porque el digest es content-heavy —
   user dismiss explícito (Continuar / backdrop / ESC).

   Stage 1: backdrop fade-in (180ms)
   Stage 2: sheet slide-up cubic-bezier spring (320ms)
   Stage 3: cyan radial pulse expand+settle (1200ms)
   Stage 4: count-up 0→sessionsCount (650ms cubic ease-out)
   Stage 5: CTAs fade-in stagger (220ms)
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import { colors, typography, spacing, radii, motion as motionTok } from "../tokens";

const STAGE_PULSE_DELAY = 80;
const STAGE_COUNT_DELAY = 200;
const STAGE_CTAS_DELAY = 350;
const COUNT_UP_DURATION = 650;

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

function fmtDateRange(startMs, endMs) {
  try {
    const f = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
    return `${f.format(new Date(startMs))} – ${f.format(new Date(endMs))}`;
  } catch {
    return "";
  }
}

export default function MonthlyDigestSheet({
  isOpen,
  digest,
  onContinue,
  onDismiss,
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onDismiss?.());

  const [mounted, setMounted] = useState(false);
  const [ctasVisible, setCtasVisible] = useState(false);
  const [countDisplay, setCountDisplay] = useState(0);

  const sessionsCount = digest?.sessionsCount || 0;

  useEffect(() => {
    if (!isOpen || !digest) {
      setMounted(false);
      setCtasVisible(false);
      setCountDisplay(0);
      return;
    }
    if (reduceMotion) {
      setMounted(true);
      setCtasVisible(true);
      setCountDisplay(sessionsCount);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen, digest, reduceMotion, sessionsCount]);

  useEffect(() => {
    if (!isOpen || !digest || reduceMotion) return;
    const timer = setTimeout(() => setCtasVisible(true), STAGE_CTAS_DELAY);
    return () => clearTimeout(timer);
  }, [isOpen, digest, reduceMotion]);

  useEffect(() => {
    if (!isOpen || !digest || reduceMotion || sessionsCount <= 0) return;
    let raf = 0;
    let startTs = null;
    const startTimer = setTimeout(() => {
      const tick = (ts) => {
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const t = Math.min(1, elapsed / COUNT_UP_DURATION);
        const eased = EASE_OUT_CUBIC(t);
        setCountDisplay(Math.round(sessionsCount * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, STAGE_COUNT_DELAY);
    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [isOpen, digest, sessionsCount, reduceMotion]);

  useEffect(() => {
    if (isOpen && digest) {
      announce(
        `Tu mes en Bio-Ignición: ${digest.sessionsCount} sesiones completadas.`,
        "polite",
      );
    }
  }, [isOpen, digest]);

  if (!isOpen || !digest) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onDismiss) onDismiss();
  };
  const handleContinue = () => {
    onContinue?.();
    onDismiss?.();
  };

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";
  const pulseStyle = reduceMotion
    ? { transform: "scale(1)", opacity: 0.7 }
    : { animation: `v2-monthly-digest-pulse 1200ms ${motionTok.ease.out} ${STAGE_PULSE_DELAY}ms forwards` };

  const minutesTotal = Math.round((digest.totalDurationSec || 0) / 60);
  const dateRange = digest.monthStart && digest.monthEnd
    ? fmtDateRange(digest.monthStart, digest.monthEnd)
    : "";

  return (
    <>
      <div
        data-v2-monthly-digest-backdrop
        data-testid="monthly-digest-backdrop"
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1000,
          opacity: backdropOpacity,
          transition: reduceMotion ? "none" : `opacity 180ms ${motionTok.ease.out}`,
          pointerEvents: "auto",
        }}
      >
        <aside
          ref={trapRef}
          data-v2-monthly-digest-sheet
          data-testid="monthly-digest-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="v2-monthly-digest-title"
          aria-describedby="v2-monthly-digest-subtitle"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.bg.raised,
            border: `0.5px solid ${colors.accent.phosphorCyan}`,
            borderBottom: "none",
            borderRadius: `${radii.panelLg}px ${radii.panelLg}px 0 0`,
            paddingInline: spacing.s24,
            paddingBlockStart: spacing.s32,
            paddingBlockEnd: `calc(${spacing.s32}px + env(safe-area-inset-bottom))`,
            zIndex: 1001,
            maxHeight: "92vh",
            overflowY: "auto",
            transform: sheetTranslate,
            transition: reduceMotion
              ? "none"
              : `transform 320ms cubic-bezier(0.32, 0.72, 0, 1)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 4,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999,
              marginBlockEnd: spacing.s24,
            }}
          />

          <div
            data-v2-monthly-digest-pulse
            aria-hidden="true"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.18) 45%, transparent 72%)",
              marginBlockEnd: spacing.s16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...pulseStyle,
            }}
          >
            <Sparkles
              size={28}
              strokeWidth={1.6}
              color={colors.accent.phosphorCyan}
              aria-hidden="true"
            />
          </div>

          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: colors.accent.phosphorCyan,
              fontWeight: typography.weight.medium,
              opacity: 0.85,
            }}
          >
            TU MES EN BIO-IGNICIÓN
          </span>

          <h2
            id="v2-monthly-digest-title"
            style={{
              margin: 0,
              marginBlockStart: spacing.s12,
              fontFamily: typography.family,
              fontSize: 26,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: colors.text.strong,
              lineHeight: 1.2,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            {dateRange ? `Tu mes: ${dateRange}` : "Tu mes completado."}
          </h2>

          <p
            id="v2-monthly-digest-subtitle"
            style={{
              margin: 0,
              marginBlockStart: spacing.s12,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.regular,
              color: colors.text.secondary,
              lineHeight: 1.45,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            Has acumulado disciplina sostenida. Esto es lo que tu sistema reporta.
          </p>

          <div
            data-v2-monthly-digest-stat
            style={{
              marginBlockStart: spacing.s24,
              paddingBlock: spacing.s16,
              paddingInline: spacing.s24,
              borderRadius: radii.panel,
              border: `0.5px solid rgba(34,211,238,0.32)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              minWidth: 200,
            }}
          >
            <span
              data-testid="monthly-digest-sessions-count"
              style={{
                fontFamily: typography.family,
                fontSize: 56,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.04em",
                color: colors.text.strong,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {countDisplay}
            </span>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: colors.text.muted,
                fontWeight: typography.weight.medium,
              }}
            >
              SESIONES
            </span>
          </div>

          <div
            data-v2-monthly-digest-grid
            style={{
              width: "100%",
              maxWidth: 360,
              marginBlockStart: spacing.s24,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: spacing.s12,
            }}
          >
            <DigestStat label="MIN. INVERTIDOS" value={`${minutesTotal}`} testid="digest-stat-minutes" />
            {digest.avgBioQ != null && (
              <DigestStat label="BIO PROMEDIO" value={`${digest.avgBioQ}`} testid="digest-stat-bio" />
            )}
            {digest.avgCoherence != null && (
              <DigestStat label="COHERENCIA AVG" value={`${digest.avgCoherence}`} testid="digest-stat-coherence" />
            )}
            {digest.avgMood != null && (
              <DigestStat label="MOOD AVG" value={`${digest.avgMood.toFixed(1)} / 5`} testid="digest-stat-mood" />
            )}
          </div>

          {digest.avgDimensions && (
            <div
              data-v2-monthly-digest-dimensions
              data-testid="digest-dimensions-section"
              style={{
                width: "100%",
                maxWidth: 360,
                marginBlockStart: spacing.s24,
              }}
            >
              <div
                style={{
                  fontFamily: typography.familyMono,
                  fontSize: typography.size.microCaps,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: colors.text.muted,
                  fontWeight: typography.weight.medium,
                  marginBlockEnd: spacing.s8,
                }}
              >
                PROMEDIOS DEL MES
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: spacing.s8,
                }}
              >
                <DigestStat label="FOCO" value={`${digest.avgDimensions.foco}%`} testid="digest-dim-foco" />
                <DigestStat label="CALMA" value={`${digest.avgDimensions.calma}%`} testid="digest-dim-calma" />
                <DigestStat label="ENERGÍA" value={`${digest.avgDimensions.energia}%`} testid="digest-dim-energia" />
              </div>
            </div>
          )}

          {Array.isArray(digest.topProtocols) && digest.topProtocols.length > 0 && (
            <div
              data-v2-monthly-digest-top
              style={{
                width: "100%",
                maxWidth: 360,
                marginBlockStart: spacing.s24,
              }}
            >
              <div
                style={{
                  fontFamily: typography.familyMono,
                  fontSize: typography.size.microCaps,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: colors.text.muted,
                  fontWeight: typography.weight.medium,
                  marginBlockEnd: spacing.s8,
                }}
              >
                PROTOCOLOS TOP
              </div>
              <ul
                data-testid="digest-top-protocols"
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing.s8,
                }}
              >
                {digest.topProtocols.map(([name, count], i) => (
                  <li
                    key={`${name}-${i}`}
                    data-testid={`digest-top-protocol-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBlock: 10,
                      paddingInline: spacing.s12,
                      borderRadius: radii.iconBox,
                      background: "rgba(255,255,255,0.03)",
                      fontFamily: typography.family,
                      fontSize: typography.size.bodyMin,
                      fontWeight: typography.weight.regular,
                      color: colors.text.primary,
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        fontFamily: typography.familyMono,
                        color: colors.accent.phosphorCyan,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}×
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{
              width: "100%",
              maxWidth: 320,
              marginBlockStart: spacing.s32,
              display: "flex",
              flexDirection: "column",
              gap: spacing.s12,
              opacity: ctasVisible ? 1 : 0,
              transform: ctasVisible || reduceMotion ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion
                ? "none"
                : `opacity 220ms ${motionTok.ease.out}, transform 220ms ${motionTok.ease.out}`,
            }}
          >
            <button
              type="button"
              data-testid="monthly-digest-continue"
              onClick={handleContinue}
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
                transitionProperty: "transform",
                transitionDuration: `${motionTok.duration.tap}ms`,
                transitionTimingFunction: motionTok.ease.out,
              }}
              onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
              onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              CONTINUAR TRAYECTORIA
            </button>
            <button
              type="button"
              data-testid="monthly-digest-dismiss"
              onClick={() => onDismiss?.()}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                color: colors.text.secondary,
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: typography.weight.regular,
                paddingBlock: 12,
                paddingInline: 18,
                minHeight: 44,
              }}
            >
              Cerrar
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function DigestStat({ label, value, testid }) {
  return (
    <div
      data-testid={testid}
      style={{
        paddingBlock: spacing.s12,
        paddingInline: spacing.s12,
        borderRadius: radii.iconBox,
        background: "rgba(255,255,255,0.03)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.02em",
          color: colors.text.strong,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.text.muted,
          fontWeight: typography.weight.medium,
        }}
      >
        {label}
      </span>
    </div>
  );
}
