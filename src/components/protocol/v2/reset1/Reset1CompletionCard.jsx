"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 7 F3 Flagship #1 — Reset1CompletionCard
   ───────────────────────────────────────────────────────────────
   Post-session completion card específica para Reinicio Parasimpático.
   Pattern reuse F1 Sigh15 + F2 Pulse25 (4-stage choreography).

   Diferencia clave vs F1+F2: streak emphasis (daily anchor narrative).
   Reinicio Parasimpático es el cohort cold-start onboarding flagship —
   el card celebra la consistencia diaria, no solo la sesión individual.

   Métricas mostradas (en order de importancia):
     1. Streak days (NUEVO): "X días seguidos" con framing escalonado
        (1 inicio → 3 building → 7 primera semana → 14 consolidando →
         30 hábito establecido). Source: state.streak.
     2. HRV delta (heredado F1+F2): ms framing.
     3. Coherence score (heredado F2): Lehrer-Vaschillo thresholds.

   Validation paragraph conditional: solo si streak ≥7 (primera semana
   completa) — narrativa de hábito automático del sistema nervioso.

   Honest limitation: hrvClassification null in practice (heredado F1+F2).
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { announce, useFocusTrap, useReducedMotion } from "@/lib/a11y";
import {
  colors,
  typography,
  spacing,
  radii,
  motion as motionTok,
  touchTarget,
} from "../../../app/v2/tokens";
import VagalCouplingReveal from "./VagalCouplingReveal";

/**
 * Build HRV delta display (mismo patrón F1+F2, ms framing).
 * @param {number|null} hrvDelta
 * @param {string|null} classification
 * @returns {{ tone, headline, sub }|null}
 */
export function buildReset1HrvDisplay(hrvDelta, classification = null) {
  if (typeof hrvDelta !== "number" || !Number.isFinite(hrvDelta)) return null;
  const abs = Math.round(Math.abs(hrvDelta) * 10) / 10;
  if (classification === "vagal-lift" || (classification == null && hrvDelta > 0)) {
    return {
      tone: "uplift",
      headline: `+${abs} ms HRV`,
      sub: "Sistema parasimpático activado",
    };
  }
  if (classification === "vagal-suppression" || (classification == null && hrvDelta < 0)) {
    return {
      tone: "neutral",
      headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
      sub: "Práctica continua mejora la respuesta vagal",
    };
  }
  return {
    tone: "neutral",
    headline: `${hrvDelta > 0 ? "+" : "−"}${abs} ms HRV`,
    sub: "Sin cambio significativo medido",
  };
}

/**
 * Build streak display per habit-formation thresholds.
 * Daily anchor narrative — el corazón del flagship F3.
 *
 * Thresholds basados en literatura habit formation (Lally et al. 2010 —
 * automatización de hábito ~66 días promedio, primera semana = signal
 * inicial, 30 días = consolidación robusta).
 *
 * @param {number|null} streakDays
 * @returns {{ tone: 'established'|'consolidating'|'building'|'starting'|'first', headline, sub }|null}
 */
export function buildReset1StreakDisplay(streakDays) {
  if (typeof streakDays !== "number" || !Number.isFinite(streakDays) || streakDays < 1) return null;
  const days = Math.floor(streakDays);
  const dayWord = days === 1 ? "día" : "días";
  if (days >= 30) {
    return {
      tone: "established",
      headline: `${days} ${dayWord} seguidos`,
      sub: "Hábito establecido · sistema instalado",
    };
  }
  if (days >= 14) {
    return {
      tone: "consolidating",
      headline: `${days} ${dayWord} seguidos`,
      sub: "Patrón consolidándose",
    };
  }
  if (days >= 7) {
    return {
      tone: "building",
      headline: `${days} ${dayWord} seguidos`,
      sub: "Primera semana · respuesta empieza a automatizarse",
    };
  }
  if (days >= 3) {
    return {
      tone: "starting",
      headline: `${days} ${dayWord} seguidos`,
      sub: "Construyendo el ancla",
    };
  }
  return {
    tone: "first",
    headline: `${days} ${dayWord}`,
    sub: "Inicio del hábito",
  };
}

/**
 * Build sparkline temporal data desde history.
 *
 * Phase 7 F3.5-A: D7 boost mostrando evolución per-protocol del usuario.
 * Decisión arquitectónica: usa `dimensions.calma` (existing post-v18,
 * 0-100 scale, populated every session) en lugar de HRV delta (no
 * persistido a entry). Filtra por `h.p === protocolName` (h.p es STRING
 * no id).
 *
 * @param {Array} history — state.history array
 * @param {string} protocolName — "Reinicio Parasimpático" exact match
 * @returns {{ last7: number[], last30: number[], avg7: number, avg30: number,
 *             best: number, sessionCount: number, currentVsAvg: 'above'|'at'|'below' }|null}
 */
export function buildReset1SparklineData(history, protocolName, currentCalma = null) {
  if (!Array.isArray(history) || history.length === 0) return null;
  if (typeof protocolName !== "string" || !protocolName) return null;

  // Filter sessions del protocolo con dimensions.calma válido.
  const protoSessions = history.filter((h) => {
    if (!h || typeof h !== "object") return false;
    if (h.p !== protocolName) return false;
    return h.dimensions != null
      && typeof h.dimensions === "object"
      && typeof h.dimensions.calma === "number"
      && Number.isFinite(h.dimensions.calma);
  });

  if (protoSessions.length === 0) return null;

  const last30 = protoSessions.slice(-30).map((h) => h.dimensions.calma);
  const last7 = protoSessions.slice(-7).map((h) => h.dimensions.calma);
  const avg = (arr) => arr.reduce((s, n) => s + n, 0) / Math.max(1, arr.length);
  const avg7 = Math.round(avg(last7));
  const avg30 = Math.round(avg(last30));
  const best = Math.round(Math.max(...last30));

  let currentVsAvg = "at";
  if (typeof currentCalma === "number" && Number.isFinite(currentCalma)) {
    if (currentCalma > avg7 + 3) currentVsAvg = "above";
    else if (currentCalma < avg7 - 3) currentVsAvg = "below";
  }

  return {
    last7,
    last30,
    avg7,
    avg30,
    best,
    sessionCount: protoSessions.length,
    currentVsAvg,
  };
}

/**
 * Build coherence display (reuse Pulse25 F2 thresholds Lehrer-Vaschillo).
 */
export function buildReset1CoherenceDisplay(coherenceScore) {
  if (typeof coherenceScore !== "number" || !Number.isFinite(coherenceScore)) return null;
  const pct = Math.round(coherenceScore * 100);
  if (coherenceScore >= 0.50) {
    return { tone: "achieved", headline: `${pct}% coherencia`, sub: "Acoplamiento vagal alcanzado" };
  }
  if (coherenceScore >= 0.30) {
    return { tone: "partial", headline: `${pct}% coherencia`, sub: "Coherencia parcial" };
  }
  return { tone: "low", headline: `${pct}% coherencia`, sub: "Práctica repetida desarrolla la capacidad" };
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {number|null} [props.hrvDelta=null]
 * @param {string|null} [props.hrvClassification=null]
 * @param {number|null} [props.coherenceScore=null]
 * @param {number|null} [props.streakDays=null] — state.streak post-session
 * @param {object|null} [props.sparklineData=null] — F3.5-A: buildReset1SparklineData output
 * @param {()=>void} props.onContinue
 */
export default function Reset1CompletionCard({
  isOpen,
  hrvDelta = null,
  hrvClassification = null,
  coherenceScore = null,
  streakDays = null,
  sparklineData = null,
  onContinue,
}) {
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(!!isOpen, () => onContinue?.());
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStage(0);
      setMounted(false);
      return undefined;
    }
    announce("Reinicio Parasimpático completado. Tu sistema vagal se activó.", "polite");
    if (reduceMotion) {
      setMounted(true);
      setStage(4);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    const timers = [200, 400, 600, 800].map((delay, idx) =>
      setTimeout(() => setStage(idx + 1), delay)
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [isOpen, reduceMotion]);

  if (!isOpen) return null;

  const hrvDisplay = buildReset1HrvDisplay(hrvDelta, hrvClassification);
  const streakDisplay = buildReset1StreakDisplay(streakDays);
  const cohDisplay = buildReset1CoherenceDisplay(coherenceScore);
  const showFallback = !hrvDisplay && !streakDisplay && !cohDisplay;
  // Validation paragraph: solo si streak ≥7 (semana completa) — narrativa hábito.
  const showValidation = streakDisplay
    && (streakDisplay.tone === "building"
      || streakDisplay.tone === "consolidating"
      || streakDisplay.tone === "established");

  const backdropOpacity = mounted ? 1 : 0;
  const sheetTranslate = mounted ? "translateY(0)" : "translateY(100%)";

  return (
    <>
      <div
        data-v2-reset1-backdrop
        data-testid="reset1-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.78)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 1000,
          opacity: backdropOpacity,
          transition: reduceMotion ? "none" : `opacity 200ms ${motionTok.ease.out}`,
          pointerEvents: "auto",
        }}
      >
        <aside
          ref={trapRef}
          data-v2-reset1-completion-card
          data-testid="reset1-completion-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset1-title"
          aria-describedby="reset1-sub"
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
            maxHeight: "85vh",
            overflowY: "auto",
            transform: sheetTranslate,
            transition: reduceMotion
              ? "none"
              : `transform 320ms cubic-bezier(0.32, 0.72, 0, 1)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Drag handle */}
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

          {/* Phase 7 SP-B-5 — Vagal Coupling Reveal hero cinematic.
              Plays independently from stage cascade — visual proof
              of post-session vagal coherence. */}
          <VagalCouplingReveal hrvDelta={hrvDelta} />

          {/* Stage 1: Eyebrow + Title */}
          <div
            data-testid="reset1-stage-1"
            data-stage-visible={stage >= 1 ? "true" : "false"}
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              textAlign: "center",
              maxWidth: 360,
              width: "100%",
            }}
          >
            <span
              data-testid="reset1-eyebrow"
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
              REINICIO PARASIMPÁTICO COMPLETADO
            </span>
            <h2
              id="reset1-title"
              style={{
                margin: 0,
                marginBlockStart: spacing.s12,
                fontFamily: typography.family,
                fontSize: 26,
                fontWeight: typography.weight.light,
                letterSpacing: "-0.02em",
                color: colors.text.strong,
                lineHeight: 1.2,
              }}
            >
              Tu sistema vagal se activó.
            </h2>
          </div>

          {/* Stage 2: Streak (lead) + HRV + Coherence */}
          <div
            data-testid="reset1-stage-2"
            data-stage-visible={stage >= 2 ? "true" : "false"}
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              textAlign: "center",
              maxWidth: 360,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: spacing.s24,
            }}
          >
            {/* Streak emphasis — ORDER LEAD para flagship daily anchor */}
            {streakDisplay && (
              <div data-testid="reset1-streak-block" data-streak-tone={streakDisplay.tone}>
                <div
                  data-testid="reset1-streak-headline"
                  style={{
                    fontFamily: typography.family,
                    fontSize: 44,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.03em",
                    color: streakDisplay.tone === "established" || streakDisplay.tone === "consolidating"
                      ? colors.accent.phosphorCyan
                      : colors.text.strong,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.0,
                  }}
                >
                  {streakDisplay.headline}
                </div>
                <p
                  style={{
                    margin: 0,
                    marginBlockStart: spacing.s8,
                    fontFamily: typography.family,
                    fontSize: typography.size.body,
                    fontWeight: typography.weight.regular,
                    color: colors.text.secondary,
                    lineHeight: 1.45,
                  }}
                >
                  {streakDisplay.sub}
                </p>
              </div>
            )}
            {hrvDisplay && (
              <div data-testid="reset1-hrv-block" data-hrv-tone={hrvDisplay.tone}>
                <div
                  data-testid="reset1-hrv-headline"
                  style={{
                    fontFamily: typography.family,
                    fontSize: 32,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.02em",
                    color: hrvDisplay.tone === "uplift"
                      ? colors.accent.phosphorCyan
                      : colors.text.strong,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.0,
                  }}
                >
                  {hrvDisplay.headline}
                </div>
                <p
                  style={{
                    margin: 0,
                    marginBlockStart: spacing.s8,
                    fontFamily: typography.family,
                    fontSize: typography.size.body,
                    fontWeight: typography.weight.regular,
                    color: colors.text.secondary,
                    lineHeight: 1.45,
                  }}
                >
                  {hrvDisplay.sub}
                </p>
              </div>
            )}
            {cohDisplay && (
              <div data-testid="reset1-coherence-block" data-coh-tone={cohDisplay.tone}>
                <div
                  data-testid="reset1-coherence-headline"
                  style={{
                    fontFamily: typography.family,
                    fontSize: 26,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.02em",
                    color: cohDisplay.tone === "achieved"
                      ? colors.accent.phosphorCyan
                      : colors.text.strong,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1.0,
                  }}
                >
                  {cohDisplay.headline}
                </div>
                <p
                  style={{
                    margin: 0,
                    marginBlockStart: spacing.s8,
                    fontFamily: typography.family,
                    fontSize: typography.size.body,
                    fontWeight: typography.weight.regular,
                    color: colors.text.secondary,
                    lineHeight: 1.45,
                  }}
                >
                  {cohDisplay.sub}
                </p>
              </div>
            )}
            {showFallback && (
              <div data-testid="reset1-fallback-block">
                <div
                  style={{
                    fontFamily: typography.family,
                    fontSize: 32,
                    fontWeight: typography.weight.light,
                    letterSpacing: "-0.02em",
                    color: colors.text.strong,
                    lineHeight: 1.2,
                  }}
                >
                  Sistema regulado
                </div>
                <p
                  id="reset1-sub"
                  style={{
                    margin: 0,
                    marginBlockStart: spacing.s8,
                    fontFamily: typography.family,
                    fontSize: typography.size.body,
                    fontWeight: typography.weight.regular,
                    color: colors.text.secondary,
                    lineHeight: 1.45,
                  }}
                >
                  120 segundos · 2 ciclos box 4-4-4-4 · entrada vagal
                </p>
              </div>
            )}

            {/* Phase 7 F3.5-A — Sparkline temporal calma últimos 7 sesiones #1.
                D7 boost: evolución visible per-protocol. Visible solo si
                sparklineData != null AND sessionCount ≥ 2 (un solo punto no
                es sparkline). Source: dimensions.calma existing field. */}
            {sparklineData && sparklineData.sessionCount >= 2 && (
              <div
                data-testid="reset1-sparkline-block"
                data-spark-vs-avg={sparklineData.currentVsAvg}
              >
                <span
                  style={{
                    fontFamily: typography.familyMono,
                    fontSize: typography.size.microCaps,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: colors.text.muted,
                    fontWeight: typography.weight.medium,
                    display: "block",
                    marginBlockEnd: spacing.s12,
                  }}
                >
                  CALMA · ÚLTIMAS {sparklineData.last7.length} SESIONES
                </span>
                {/* SVG sparkline */}
                {(() => {
                  const arr = sparklineData.last7;
                  const w = 240;
                  const h = 40;
                  const max = Math.max(...arr, 100);
                  const min = Math.min(...arr, 0);
                  const range = Math.max(1, max - min);
                  const pts = arr.map((v, i) => {
                    const x = arr.length > 1 ? (i / (arr.length - 1)) * w : w / 2;
                    const y = h - ((v - min) / range) * h;
                    return { x, y, v };
                  });
                  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                  return (
                    <svg
                      data-testid="reset1-sparkline-svg"
                      width={w}
                      height={h}
                      role="img"
                      aria-label={`Sparkline calma últimas ${arr.length} sesiones, promedio ${sparklineData.avg7}, mejor ${sparklineData.best}`}
                      style={{ display: "block", marginInline: "auto" }}
                    >
                      <polyline
                        points={polyline}
                        stroke={colors.accent.phosphorCyan}
                        strokeWidth={1.5}
                        fill="none"
                        opacity={0.6}
                      />
                      {pts.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={i === pts.length - 1 ? 3 : 2}
                          fill={colors.accent.phosphorCyan}
                        />
                      ))}
                    </svg>
                  );
                })()}
                {/* Tabular comparison */}
                <div
                  data-testid="reset1-sparkline-table"
                  style={{
                    marginBlockStart: spacing.s12,
                    fontFamily: typography.familyMono,
                    fontSize: typography.size.microCaps,
                    letterSpacing: "0.12em",
                    color: colors.text.secondary,
                    fontVariantNumeric: "tabular-nums",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    textAlign: "left",
                    maxWidth: 240,
                    marginInline: "auto",
                  }}
                >
                  <div>PROMEDIO 7d · {sparklineData.avg7}/100</div>
                  <div>PROMEDIO 30d · {sparklineData.avg30}/100</div>
                  <div>MEJOR · {sparklineData.best}/100</div>
                </div>
                {/* Validation contextual */}
                {sparklineData.currentVsAvg === "above" && (
                  <p
                    data-testid="reset1-sparkline-validation"
                    style={{
                      margin: 0,
                      marginBlockStart: spacing.s12,
                      fontFamily: typography.family,
                      fontSize: typography.size.caption,
                      fontWeight: typography.weight.regular,
                      color: colors.accent.phosphorCyan,
                      lineHeight: 1.5,
                      textAlign: "center",
                    }}
                  >
                    Tu calma de hoy supera tu promedio · sistema vagal en alza.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stage 3: Polyvagal framing + validation conditional */}
          <div
            data-testid="reset1-stage-3"
            data-stage-visible={stage >= 3 ? "true" : "false"}
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              maxWidth: 360,
              width: "100%",
            }}
          >
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: colors.text.muted,
                fontWeight: typography.weight.medium,
                display: "block",
                marginBlockEnd: spacing.s8,
              }}
            >
              POLYVAGAL · BOX 4-4-4-4 · RCT-VALIDATED
            </span>
            <p
              data-testid="reset1-research-body"
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.6,
              }}
            >
              El patrón box 4-4-4-4 opera a 3.75 brpm — dentro del rango óptimo
              Russo et al. (2017, Breathe ERS) para vagal coupling y enhanced
              HRV. Ma et al. (2017, Frontiers in Psychology, RCT N=40) demostró
              que respiración lenta 4 brpm × 8 semanas reduce cortisol salival
              y mejora sustained attention. Lemaitre et al. (2025, Adv Resp
              Med) replicó en RCT box 4-4-4-4 con HRV (HF component) ↑.
            </p>
            {showValidation && (
              <p
                data-testid="reset1-research-validation"
                style={{
                  margin: 0,
                  marginBlockStart: spacing.s12,
                  fontFamily: typography.family,
                  fontSize: typography.size.caption,
                  fontWeight: typography.weight.regular,
                  color: colors.accent.phosphorCyan,
                  lineHeight: 1.6,
                }}
              >
                {streakDisplay?.tone === "established"
                  ? `Tu hábito de ${streakDisplay.headline.split(" ")[0]} días ha instalado el patrón VVC (ventral vagal complex, Porges 2022) como respuesta automática del sistema nervioso.`
                  : streakDisplay?.tone === "consolidating"
                    ? `Tu consistencia de ${streakDisplay.headline.split(" ")[0]} días consolida la activación VVC en memoria procedimental autonómica.`
                    : `Tu primera semana instala el patrón base VVC (Porges 2022) — el sistema empieza a automatizar la respuesta vagal.`}
              </p>
            )}
          </div>

          {/* Stage 4: CTA */}
          <div
            data-testid="reset1-stage-4"
            data-stage-visible={stage >= 4 ? "true" : "false"}
            style={{
              opacity: stage >= 4 ? 1 : 0,
              transform: stage >= 4 ? "translateY(0)" : "translateY(8px)",
              transition: reduceMotion ? "none" : `all 280ms ${motionTok.ease.out}`,
              marginBlockStart: spacing.s32,
              width: "100%",
              maxWidth: 320,
            }}
          >
            <button
              type="button"
              data-testid="reset1-continue"
              onClick={onContinue}
              style={{
                background: colors.accent.phosphorCyan,
                color: "#041019",
                border: "none",
                borderRadius: 999,
                paddingBlock: spacing.s14,
                paddingInline: spacing.s24,
                fontFamily: typography.familyMono,
                fontSize: 12,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                minHeight: touchTarget.preferred,
                width: "100%",
                transition: reduceMotion ? "none" : `all 180ms ${motionTok.ease.out}`,
              }}
            >
              Continuar
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
