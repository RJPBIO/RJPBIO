"use client";
/* ═══════════════════════════════════════════════════════════════
   POST-SESSION FLOW — breathe (check-in) + summary (celebration)
   Full a11y: role=dialog + focus trap, radiogroups, reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SPRING } from "../lib/easings";
import Icon from "./Icon";
import SessionShareCard from "./SessionShareCard";
import BioIgnicionMark from "./BioIgnicionMark";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z, bioSignal } from "../lib/theme";
import { semantic, protoColor } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";
import { useAdaptiveRecommendation } from "../hooks/useAdaptiveRecommendation";
import { playChord, hapticSignature } from "../lib/audio";

function bioQTone(score) {
  if (score == null) return { label: null, color: bioSignal.phosphorCyan };
  if (score >= 80) return { label: "Alta", color: bioSignal.phosphorCyan };
  if (score >= 60) return { label: "Media", color: bioSignal.phosphorCyan };
  if (score >= 40) return { label: "Baja", color: bioSignal.signalAmber };
  return { label: "Ligera", color: bioSignal.plasmaRed };
}

export default function PostSessionFlow({
  postStep, ts, ac, isDark,
  pr, durMult, st,
  checkMood, setCheckMood, checkEnergy, setCheckEnergy, checkTag, setCheckTag,
  preMood, postVC, postMsg, moodDiff,
  // Evidencia objetiva post-sesión: { evidenceLevel, hrv, mood, durationSec }
  // Calculada en page.jsx con buildSessionDelta. Cuando hrv es null o
  // significant !== true, el card cae a un estado más humilde.
  delta = null,
  H, submitCheckin, onSetPostStep, onReset,
  // Path de "Omitir check-in" — debe disparar el envío de la sesión a
  // outbox aunque no haya postMood; sin esto el admin pierde sesiones.
  onSkipCheckin,
}) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const showBreathe = postStep === "breathe" && ts === "done";
  const showSummary = postStep === "summary" && ts === "done";
  const [showShare, setShowShare] = useState(false);
  const lastSession = (st.history || []).slice(-1)[0];
  const lastBioQ = lastSession?.bioQ ?? null;

  const breatheDialogRef = useFocusTrap(showBreathe, () => onSetPostStep("summary"));
  const summaryDialogRef = useFocusTrap(showSummary, () => {
    onReset();
    onSetPostStep("none");
  });

  const breatheTitleId = useId();
  const summaryTitleId = useId();

  // Firma al abrir summary: chord de premio + haptic "award". Separado del
  // playIgnition() que suena al cerrar el orb — este es el momento "medalla".
  useEffect(() => {
    if (!showSummary) return;
    if (st.soundOn !== false) { try { playChord([660, 990, 1320], 0.32, 0.035); } catch {} }
    if (st.hapticOn !== false) { try { hapticSignature("award"); } catch {} }
  }, [showSummary, st.soundOn, st.hapticOn]);

  const nextRec = useAdaptiveRecommendation(showSummary ? st : null);
  const nextProto = nextRec?.primary?.protocol && nextRec.primary.protocol.n !== pr.n ? nextRec.primary.protocol : null;

  return (
    <>
      <AnimatePresence>
        {showBreathe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: z.postSession,
              background: `radial-gradient(120% 80% at 50% 0%, ${withAlpha(ac, 10)}, ${bg}F5 60%)`,
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: space[5],
              overflowY: "auto",
            }}
            role="presentation"
          >
            <motion.div
              ref={breatheDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={breatheTitleId}
              initial={reduced ? { opacity: 0 } : { scale: 0.9 }}
              animate={reduced ? { opacity: 1 } : { scale: 1 }}
              transition={reduced ? { duration: 0 } : SPRING.default}
              style={{
                position: "relative",
                // Glass dark + accent corner radial (Menu Strip canon)
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${withAlpha(ac, 16)} 0%, transparent 55%), linear-gradient(180deg, rgba(20,20,28,0.96) 0%, rgba(8,8,12,0.98) 100%)`,
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                borderRadius: 22,
                padding: `${space[6]}px ${space[5]}px`,
                maxInlineSize: 400,
                inlineSize: "100%",
                border: `0.5px solid rgba(255,255,255,0.10)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(ac, 18)}, 0 16px 40px rgba(0,0,0,0.45), 0 0 24px ${withAlpha(ac, 10)}`,
                overflow: "hidden",
              }}
            >
              {/* Top sheen */}
              <span aria-hidden="true" style={{
                position: "absolute", insetBlockStart: 0,
                insetInlineStart: "20%", insetInlineEnd: "20%", blockSize: 1,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)`,
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", justifyContent: "center", marginBlockEnd: space[3] }}>
                <BioIgnicionMark glyphSize={22} textColor={t1} signalColor={ac} letterSpacing={3} animated={false} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: space[2], marginBlockEnd: space[4] }}>
                <motion.div
                  aria-hidden="true"
                  animate={reduced ? {} : { scale: [1, 1.06, 1] }}
                  transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    inlineSize: 120,
                    blockSize: 120,
                    borderRadius: radius.full,
                    background: `radial-gradient(circle at 50% 38%, ${withAlpha(ac, 25)}, #0a0d14 72%)`,
                    boxShadow: `0 18px 48px -16px ${withAlpha(ac, 50)}, inset 0 1px 0 ${withAlpha("#ffffff", 8)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <motion.div
                    aria-hidden="true"
                    animate={reduced ? {} : { opacity: [0.6, 1, 0.6], scale: [0.9, 1.05, 0.9] }}
                    transition={reduced ? {} : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      inlineSize: 28,
                      blockSize: 28,
                      borderRadius: radius.full,
                      background: `radial-gradient(circle, ${bioSignal.ignition}, ${ac})`,
                      filter: `drop-shadow(0 0 10px ${withAlpha(ac, 70)})`,
                    }}
                  />
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                    <path d="M30 36 L60 30 L90 36" stroke={withAlpha(ac, 25)} strokeWidth="1" fill="none" />
                    <path d="M30 84 L60 90 L90 84" stroke={withAlpha(ac, 15)} strokeWidth="1" fill="none" />
                  </svg>
                </motion.div>
                <div style={{ textAlign: "center" }}>
                  <h2 id={breatheTitleId} style={{ ...ty.heading(t1), fontSize: font.size["2xl"], lineHeight: font.leading.tight, margin: 0 }}>
                    Ignición completa
                  </h2>
                  <div style={{ ...ty.body(t3), marginBlockStart: 2 }}>
                    Tu sistema nervioso cambió en {Math.round(pr.d * durMult)}s
                  </div>
                </div>
              </div>

              {/* MOOD fieldset — IconTile-style mood cards */}
              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 8.5, fontWeight: 500,
                  color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                  textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
                  marginBlockEnd: space[2], padding: 0,
                }}>
                  ¿Cómo te sientes ahora?
                </legend>
                <div role="radiogroup" aria-label="Estado emocional post-sesión" style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  {MOODS.map((m) => {
                    const active = checkMood === m.value;
                    return (
                      <motion.button
                        key={m.id}
                        role="radio"
                        aria-checked={active}
                        aria-label={m.label}
                        whileTap={reduced ? {} : { scale: 0.93 }}
                        onClick={() => { setCheckMood(m.value); H("tap"); }}
                        style={{
                          flex: 1,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                          paddingBlock: 10, paddingInline: 4,
                          borderRadius: 12,
                          background: active
                            ? `radial-gradient(circle at 50% 0%, ${withAlpha(m.color, 22)} 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`
                            : "rgba(255,255,255,0.025)",
                          border: `0.5px solid ${active ? withAlpha(m.color, 40) : "rgba(255,255,255,0.08)"}`,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          boxShadow: active
                            ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(m.color, 28)}, 0 0 12px ${withAlpha(m.color, 16)}`
                            : "inset 0 1px 0 rgba(255,255,255,0.04)",
                          transition: reduced ? "none" : "all .25s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        <span aria-hidden="true" style={{
                          inlineSize: 28, blockSize: 28,
                          borderRadius: 8,
                          background: active
                            ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%), linear-gradient(140deg, ${withAlpha(m.color, 32)} 0%, ${withAlpha(m.color, 10)} 100%)`
                            : "rgba(255,255,255,0.04)",
                          border: `0.5px solid ${active ? withAlpha(m.color, 50) : "rgba(255,255,255,0.10)"}`,
                          boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 8px ${withAlpha(m.color, 30)}` : "none",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name={m.icon} size={14} color={active ? m.color : t3} />
                        </span>
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: 7.5, fontWeight: 500,
                          color: active ? m.color : t3,
                          letterSpacing: "0.14em", textTransform: "uppercase",
                          textShadow: active ? `0 0 4px ${withAlpha(m.color, 50)}` : "none",
                          lineHeight: 1.2,
                        }}>
                          {m.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </fieldset>

              {/* ENERGY fieldset — glass segmented */}
              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 8.5, fontWeight: 500,
                  color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                  textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
                  marginBlockEnd: space[2], padding: 0,
                }}>
                  ¿Cómo está tu energía?
                </legend>
                <div role="radiogroup" aria-label="Nivel de energía" style={{
                  display: "flex", gap: 4, padding: 3,
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                  borderRadius: 99,
                }}>
                {ENERGY_LEVELS.map((e) => {
                  const active = checkEnergy === e.v;
                  return (
                    <motion.button
                      key={e.id}
                      role="radio"
                      aria-checked={active}
                      aria-label={`Energía ${e.label}`}
                      whileTap={reduced ? {} : { scale: 0.96 }}
                      onClick={() => { setCheckEnergy(e.v); H("tap"); }}
                      style={{
                        flex: 1,
                        paddingBlock: 7, paddingInline: 8,
                        borderRadius: 99,
                        border: "none",
                        background: active
                          ? `linear-gradient(180deg, ${withAlpha(ac, 28)} 0%, ${withAlpha(ac, 10)} 100%)`
                          : "transparent",
                        color: active ? ac : t3,
                        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 9, fontWeight: 500,
                        letterSpacing: "0.10em", textTransform: "uppercase",
                        cursor: "pointer",
                        textShadow: active ? `0 0 5px ${withAlpha(ac, 50)}` : "none",
                        boxShadow: active ? `inset 0 0.5px 0 rgba(255,255,255,0.18), 0 0 0 0.5px ${withAlpha(ac, 35)}` : "none",
                      }}
                    >
                      {e.label}
                    </motion.button>
                  );
                })}
                </div>
              </fieldset>

              {/* CONTEXT fieldset — glass tag pills */}
              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 8.5, fontWeight: 500,
                  color: ac, letterSpacing: "0.30em", textTransform: "uppercase",
                  textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
                  marginBlockEnd: space[2], padding: 0,
                }}>
                  ¿En qué contexto?
                </legend>
                <div role="radiogroup" aria-label="Contexto de la sesión" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {WORK_TAGS.map((tg) => {
                  const active = checkTag === tg;
                  return (
                    <button
                      key={tg}
                      role="radio"
                      aria-checked={active}
                      aria-label={`Contexto: ${tg}`}
                      onClick={() => { setCheckTag(active ? "" : tg); H("tap"); }}
                      style={{
                        paddingBlock: 5, paddingInline: 12,
                        borderRadius: 99,
                        border: `0.5px solid ${active ? withAlpha(ac, 40) : "rgba(255,255,255,0.10)"}`,
                        background: active
                          ? `linear-gradient(180deg, ${withAlpha(ac, 18)} 0%, ${withAlpha(ac, 6)} 100%)`
                          : "rgba(255,255,255,0.03)",
                        color: active ? ac : t3,
                        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 9, fontWeight: 500,
                        letterSpacing: "0.10em", textTransform: "uppercase",
                        cursor: "pointer",
                        textShadow: active ? `0 0 4px ${withAlpha(ac, 50)}` : "none",
                        boxShadow: active ? `inset 0 0.5px 0 rgba(255,255,255,0.10), 0 0 0 0.5px ${withAlpha(ac, 22)}` : "none",
                      }}
                    >
                      {tg}
                    </button>
                  );
                })}
                </div>
              </fieldset>

              {/* CONTINUE CTA — glass primary pill matching Brújula CTA */}
              <motion.button
                type="button"
                whileTap={reduced || checkMood <= 0 ? {} : { scale: 0.985 }}
                onClick={checkMood > 0 ? submitCheckin : undefined}
                aria-disabled={checkMood <= 0}
                aria-label={checkMood <= 0 ? "Continuar — selecciona tu estado primero" : "Continuar al resumen"}
                style={{
                  position: "relative",
                  inlineSize: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  minBlockSize: 48,
                  paddingBlock: 14, paddingInline: 18,
                  borderRadius: 99,
                  background: checkMood > 0
                    ? `linear-gradient(180deg, ${ac} 0%, ${withAlpha(ac, 88)} 100%)`
                    : "rgba(255,255,255,0.04)",
                  border: "none",
                  color: checkMood > 0 ? "#08080A" : t3,
                  fontSize: 13, fontWeight: 600, letterSpacing: 0.05,
                  fontFamily: "inherit",
                  cursor: checkMood > 0 ? "pointer" : "not-allowed",
                  boxShadow: checkMood > 0
                    ? `inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(ac, 60)}, 0 4px 14px ${withAlpha(ac, 40)}, 0 0 18px ${withAlpha(ac, 22)}`
                    : "inset 0 1px 0 rgba(255,255,255,0.05)",
                  overflow: "hidden",
                  opacity: checkMood > 0 ? 1 : 0.55,
                }}
              >
                {checkMood > 0 && (
                  <span aria-hidden="true" style={{
                    position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
                    background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`,
                    pointerEvents: "none",
                  }} />
                )}
                <span style={{ position: "relative", textShadow: checkMood > 0 ? "0 0 8px rgba(255,255,255,0.30), 0 1px 1px rgba(0,0,0,0.18)" : "none" }}>Continuar</span>
                {checkMood > 0 && (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 6 L9 6 M6.5 3 L9 6 L6.5 9" stroke="#08080A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </motion.button>
              <button
                onClick={() => (onSkipCheckin ? onSkipCheckin() : onSetPostStep("summary"))}
                aria-label="Omitir check-in e ir al resumen"
                style={{
                  inlineSize: "100%",
                  minBlockSize: 40,
                  paddingBlock: space[2],
                  marginBlockStart: space[1],
                  background: "transparent",
                  border: "none",
                  color: t2,
                  fontSize: font.size.sm,
                  fontWeight: font.weight.semibold,
                  letterSpacing: -0.05,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  textDecorationColor: withAlpha(t2, 30),
                }}
              >
                Omitir check-in
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: z.postSession,
              background: `radial-gradient(120% 80% at 50% 0%, ${withAlpha(ac, 12)}, ${bg}F2 60%)`,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: space[5],
              overflowY: "auto",
            }}
            role="presentation"
          >
            <motion.div
              ref={summaryDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={summaryTitleId}
              initial={reduced ? { opacity: 0 } : { scale: 0.9 }}
              animate={reduced ? { opacity: 1 } : { scale: 1 }}
              transition={reduced ? { duration: 0 } : SPRING.default}
              style={{
                position: "relative",
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${withAlpha(ac, 18)} 0%, transparent 55%), linear-gradient(180deg, rgba(20,20,28,0.96) 0%, rgba(8,8,12,0.98) 100%)`,
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                borderRadius: 22,
                padding: `${space[6]}px ${space[5]}px`,
                maxInlineSize: 420,
                inlineSize: "100%",
                border: `0.5px solid rgba(255,255,255,0.10)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(ac, 18)}, 0 16px 40px rgba(0,0,0,0.45), 0 0 24px ${withAlpha(ac, 10)}`,
                overflow: "hidden",
              }}
            >
              {/* Top sheen */}
              <span aria-hidden="true" style={{
                position: "absolute", insetBlockStart: 0,
                insetInlineStart: "20%", insetInlineEnd: "20%", blockSize: 1,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)`,
                pointerEvents: "none",
              }} />
              {!reduced && Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const dist = 60 + Math.random() * 80;
                const palette = [ac, bioSignal.phosphorCyan, bioSignal.ignition, bioSignal.plasmaPink];
                return (
                  <motion.div
                    key={i}
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.2, 1, 0.5],
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist - 20,
                    }}
                    transition={{ duration: 1.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: "absolute",
                      insetBlockStart: "28%",
                      insetInlineStart: "50%",
                      inlineSize: i % 3 === 0 ? 5 : 3,
                      blockSize: i % 3 === 0 ? 5 : 3,
                      borderRadius: i % 4 === 0 ? "1px" : radius.full,
                      background: palette[i % 4],
                      boxShadow: i % 3 === 0 ? `0 0 6px ${palette[i % 4]}` : "none",
                      pointerEvents: "none",
                    }}
                  />
                );
              })}

              {/* HEADER — eyebrow + BioQ Ring hero + display title */}
              <header style={{ textAlign: "center", marginBlockEnd: space[3], position: "relative" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBlockEnd: 14 }}>
                  <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5 }}>
                    <motion.span
                      animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                      transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                      style={{ position: "absolute", inset: 0, borderRadius: "50%", background: ac }}
                    />
                    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%)`, boxShadow: `0 0 8px ${ac}` }} />
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 9, fontWeight: 500,
                    color: ac, letterSpacing: "0.28em", textTransform: "uppercase",
                    textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
                  }}>
                    {st.totalSessions <= 1 ? "Sesión inaugural" : `Sesión #${st.totalSessions}`} · {pr.n} · {Math.round(pr.d * durMult)}s
                  </span>
                </span>

                {typeof lastBioQ === "number" && lastBioQ > 0 ? (() => {
                  const tone = bioQTone(lastBioQ);
                  const RR = 56;
                  const C = 2 * Math.PI * RR;
                  const offset = C - (lastBioQ / 100) * C;
                  return (
                    <div
                      role="group"
                      aria-label={`BioQ Score ${lastBioQ} por ciento — calidad ${tone.label}`}
                      style={{ position: "relative", inlineSize: 156, blockSize: 156, marginInline: "auto" }}
                    >
                      <motion.div
                        aria-hidden="true"
                        animate={reduced ? {} : { scale: [1, 1.05, 1], opacity: [0.35, 0.6, 0.35] }}
                        transition={reduced ? {} : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          position: "absolute", inset: -6,
                          background: `radial-gradient(circle, ${withAlpha(tone.color, 24)} 0%, transparent 65%)`,
                          filter: "blur(12px)",
                          pointerEvents: "none",
                        }}
                      />
                      <svg width="156" height="156" viewBox="0 0 156 156" style={{ position: "relative", display: "block" }} aria-hidden="true">
                        <defs>
                          <linearGradient id={`bioqRing-${summaryTitleId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={tone.color} stopOpacity="1" />
                            <stop offset="100%" stopColor={tone.color} stopOpacity="0.7" />
                          </linearGradient>
                        </defs>
                        <circle cx="78" cy="78" r={RR} fill="none" stroke={withAlpha(tone.color, 12)} strokeWidth="1.5" />
                        <motion.circle
                          cx="78" cy="78" r={RR}
                          fill="none"
                          stroke={`url(#bioqRing-${summaryTitleId})`}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeDasharray={C}
                          initial={reduced ? { strokeDashoffset: offset } : { strokeDashoffset: C }}
                          animate={{ strokeDashoffset: offset }}
                          transition={reduced ? { duration: 0 } : { duration: 1.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          transform="rotate(-90 78 78)"
                          style={{ filter: `drop-shadow(0 0 5px ${withAlpha(tone.color, 70)})` }}
                        />
                        {[25, 50, 75].map(p => {
                          const a = (p / 100) * 2 * Math.PI - Math.PI / 2;
                          const r1 = RR - 4, r2 = RR + 4;
                          return (
                            <line
                              key={p}
                              x1={78 + Math.cos(a) * r1} y1={78 + Math.sin(a) * r1}
                              x2={78 + Math.cos(a) * r2} y2={78 + Math.sin(a) * r2}
                              stroke={withAlpha(tone.color, 30)} strokeWidth="0.6"
                              strokeLinecap="round"
                            />
                          );
                        })}
                      </svg>
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 3,
                      }}>
                        <motion.div
                          initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 16, delay: 0.6 }}
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 40, fontWeight: 300, color: t1,
                            letterSpacing: -1.4, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                            textShadow: `0 0 18px ${withAlpha(tone.color, 50)}`,
                          }}
                        >
                          {lastBioQ}
                        </motion.div>
                        <div style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: 8, fontWeight: 500, color: tone.color,
                          letterSpacing: "0.26em", textTransform: "uppercase",
                          textShadow: `0 0 5px ${withAlpha(tone.color, 50)}`,
                        }}>
                          BioQ · {tone.label}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <motion.div
                    aria-hidden="true"
                    initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 16, delay: 0.2 }}
                    style={{ position: "relative", inlineSize: 92, blockSize: 92, marginInline: "auto" }}
                  >
                    <motion.div
                      aria-hidden="true"
                      initial={{ scale: 0.3, opacity: 0.8 }}
                      animate={reduced ? {} : { scale: [0.3, 2, 2.4], opacity: [0.6, 0.15, 0] }}
                      transition={reduced ? {} : { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                      style={{ position: "absolute", inset: 0, borderRadius: radius.full, border: `1.5px solid ${ac}` }}
                    />
                    <svg width="92" height="92" viewBox="0 0 92 92" style={{ position: "relative" }}>
                      <circle cx="46" cy="46" r="42" fill={withAlpha(ac, 8)} />
                      <circle cx="46" cy="46" r="33" fill={withAlpha(ac, 12)} />
                      <motion.path
                        d="M30 46l10 10 22-22"
                        stroke={ac}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                  </motion.div>
                )}

                <h2 id={summaryTitleId} style={{
                  fontSize: 19, fontWeight: 300, color: t1,
                  letterSpacing: -0.4, lineHeight: 1.1, margin: 0, marginBlockStart: 12,
                }}>
                  Ignición completa
                </h2>
              </header>

              {/* HRV evidence — glass row + EKG glyph */}
              {delta && delta.hrv && (() => {
                const dh = delta.hrv;
                const isVerified = dh.significant === true;
                const isSuppression = dh.classification === "vagal-suppression";
                const isLift = dh.classification === "vagal-lift";
                const isSteady = dh.classification === "no-change";
                const isUnverified = dh.classification === "unverified";
                const tone = isLift
                  ? bioSignal.phosphorCyan
                  : isSuppression
                    ? bioSignal.signalAmber
                    : isSteady
                      ? ac
                      : ac;
                const sign = dh.deltaRmssd > 0 ? "+" : "";
                const headlineKey = isVerified
                  ? (isLift ? "Tu HRV subió" : "Tu HRV bajó")
                  : isSteady
                    ? "Sistema estable"
                    : "HRV registrado";
                const subKey = isVerified
                  ? "Cambio verificado · MDC95"
                  : isSteady
                    ? "Cambio menor al ruido medible"
                    : isUnverified
                      ? "Necesitamos 7+ lecturas previas"
                      : "Variabilidad parasimpática";
                return (
                  <motion.div
                    role="group"
                    aria-label={`${headlineKey} ${sign}${dh.deltaRmssd} milisegundos. ${subKey}`}
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 0.7, duration: 0.4 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: `12px 14px`,
                      marginBlockEnd: space[3],
                      background: `linear-gradient(180deg, rgba(20,20,28,0.6) 0%, rgba(14,14,20,0.45) 100%)`,
                      borderRadius: 14,
                      border: `0.5px solid ${withAlpha(tone, 28)}`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 16px ${withAlpha(tone, 12)}`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{
                      flexShrink: 0,
                      inlineSize: 36, blockSize: 36,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(180deg, ${withAlpha(tone, 22)} 0%, ${withAlpha(tone, 8)} 100%)`,
                      border: `0.5px solid ${withAlpha(tone, 38)}`,
                      borderRadius: 10,
                      boxShadow: `inset 0 1px 0 ${withAlpha("#fff", 14)}`,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <motion.path
                          d="M2 10 L5 10 L7 4 L9 16 L11 7 L13 13 L15 10 L18 10"
                          stroke={tone} strokeWidth="1.4"
                          strokeLinecap="round" strokeLinejoin="round" fill="none"
                          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={reduced ? { duration: 0 } : { duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </svg>
                    </div>
                    <div style={{ minInlineSize: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 8.5, fontWeight: 500,
                        color: tone, letterSpacing: "0.28em", textTransform: "uppercase",
                        textShadow: `0 0 5px ${withAlpha(tone, 50)}`,
                        marginBlockEnd: 3,
                      }}>
                        Evidencia objetiva
                      </div>
                      <div style={{ ...ty.body(t1), fontWeight: font.weight.semibold, lineHeight: 1.25, fontSize: 13 }}>
                        {headlineKey}
                      </div>
                      <div style={{ ...ty.caption(t3), fontSize: 11, marginBlockStart: 1, lineHeight: 1.35 }}>
                        {subKey}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 1, flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 22, fontWeight: 500, color: tone,
                        letterSpacing: -0.6, fontVariantNumeric: "tabular-nums",
                        textShadow: `0 0 6px ${withAlpha(tone, 40)}`,
                      }}>
                        {sign}{dh.deltaRmssd}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 9, color: t3, letterSpacing: 0.5,
                      }}>ms</div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Streak ribbon — custom flame */}
              {st.streak >= 3 && (
                <div
                  role="status"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    paddingBlock: 10, paddingInline: 14,
                    marginBlockEnd: space[3],
                    background: `radial-gradient(circle at 50% 0%, ${withAlpha(semantic.warning, 14)} 0%, transparent 70%), linear-gradient(180deg, rgba(20,20,28,0.6) 0%, rgba(14,14,20,0.45) 100%)`,
                    borderRadius: 12,
                    border: `0.5px solid ${withAlpha(semantic.warning, 30)}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px ${withAlpha(semantic.warning, 12)}`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <motion.path
                      d="M8 1 Q 4 5 5 9 Q 6 12.5 8 13 Q 12 12 12 9 Q 12 6 10 4 Q 10 6 8.5 7 Q 10 4 8 1 Z"
                      stroke={semantic.warning} strokeWidth="1" strokeLinejoin="round"
                      fill={withAlpha(semantic.warning, 35)}
                      animate={reduced ? {} : { opacity: [0.7, 1, 0.7] }}
                      transition={reduced ? {} : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 10, fontWeight: 600, color: semantic.warning,
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    textShadow: `0 0 5px ${withAlpha(semantic.warning, 50)}`,
                  }}>
                    {st.streak} días · {st.streak >= 30 ? "Imparable" : st.streak >= 14 ? "Disciplinado" : st.streak >= 7 ? "Constante" : "En construcción"}
                  </span>
                </div>
              )}

              {/* Mood delta — IconTile dimensional + animated arrow */}
              {preMood > 0 && checkMood > 0 && (() => {
                const moodTone = moodDiff > 0 ? semantic.success : moodDiff < 0 ? semantic.danger : t3;
                return (
                  <div
                    role="group"
                    aria-label={`Cambio de ánimo: ${moodDiff > 0 ? "+" : ""}${moodDiff} puntos`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      marginBlockEnd: space[3],
                      padding: `14px 16px`,
                      background: `linear-gradient(180deg, rgba(20,20,28,0.6) 0%, rgba(14,14,20,0.45) 100%)`,
                      borderRadius: 14,
                      border: `0.5px solid rgba(255,255,255,0.08)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
                      <div style={{
                        inlineSize: 40, blockSize: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 50%), linear-gradient(140deg, ${withAlpha(MOODS[preMood-1].color, 28)} 0%, ${withAlpha(MOODS[preMood-1].color, 8)} 100%)`,
                        border: `0.5px solid ${withAlpha(MOODS[preMood-1].color, 40)}`,
                        borderRadius: 12,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 8px ${withAlpha(MOODS[preMood-1].color, 22)}`,
                      }}>
                        <Icon name={MOODS[preMood - 1].icon} size={20} color={MOODS[preMood - 1].color} aria-hidden="true" />
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 8, fontWeight: 500, color: t3,
                        letterSpacing: "0.20em", textTransform: "uppercase",
                      }}>
                        Antes
                      </div>
                    </div>

                    <motion.div
                      initial={reduced ? { scale: 1 } : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={reduced ? { duration: 0 } : { ...SPRING.default, delay: 0.4 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
                    >
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 22, fontWeight: 500, color: moodTone,
                        letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                        textShadow: `0 0 8px ${withAlpha(moodTone, 40)}`,
                      }}>
                        {moodDiff > 0 ? "+" + moodDiff : moodDiff === 0 ? "=" : moodDiff}
                      </div>
                      <svg width="36" height="8" viewBox="0 0 36 8" aria-hidden="true">
                        <motion.path
                          d="M2 4 L34 4 M30 1 L34 4 L30 7"
                          stroke={withAlpha(moodTone, 70)} strokeWidth="1.2"
                          strokeLinecap="round" strokeLinejoin="round" fill="none"
                          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </svg>
                    </motion.div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
                      <div style={{
                        inlineSize: 40, blockSize: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 50%), linear-gradient(140deg, ${withAlpha(MOODS[checkMood-1].color, 38)} 0%, ${withAlpha(MOODS[checkMood-1].color, 10)} 100%)`,
                        border: `0.5px solid ${withAlpha(MOODS[checkMood-1].color, 55)}`,
                        borderRadius: 12,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 12px ${withAlpha(MOODS[checkMood-1].color, 32)}`,
                      }}>
                        <Icon name={MOODS[checkMood - 1].icon} size={20} color={MOODS[checkMood - 1].color} aria-hidden="true" />
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 8, fontWeight: 500, color: MOODS[checkMood - 1].color,
                        letterSpacing: "0.20em", textTransform: "uppercase",
                        textShadow: `0 0 4px ${withAlpha(MOODS[checkMood - 1].color, 40)}`,
                      }}>
                        Ahora
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Metric trinity — IconTile dimensional cards */}
              <div
                role="group"
                aria-label="Contribución de esta sesión"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBlockEnd: space[3],
                }}
              >
                {[
                  {
                    l: "V-Cores", v: "+" + postVC, c: bioSignal.ignition,
                    glyph: (color) => (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M9 2 L11.5 7 L17 8 L13 12 L14 17 L9 14.5 L4 17 L5 12 L1 8 L6.5 7 Z"
                          stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill={withAlpha(color, 18)} />
                      </svg>
                    ),
                  },
                  {
                    l: "Racha", v: (st.streak || 0) + "d", c: bioSignal.signalAmber,
                    glyph: (color) => (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M9 2 Q 5 6 6 10 Q 7 13 9 14 Q 13 13 13 10 Q 13 7 11 5 Q 11 7 9.5 8 Q 11 5 9 2 Z"
                          stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill={withAlpha(color, 22)} />
                      </svg>
                    ),
                  },
                  {
                    l: "Hoy", v: (st.todaySessions || 1) + "/" + (st.sessionGoal || 2), c: ac,
                    glyph: (color) => {
                      const done = st.todaySessions || 1;
                      const goal = st.sessionGoal || 2;
                      const pct = Math.min(1, done / goal);
                      const C2 = 2 * Math.PI * 6.5;
                      return (
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                          <circle cx="9" cy="9" r="6.5" stroke={withAlpha(color, 25)} strokeWidth="1.4" fill="none" />
                          <circle cx="9" cy="9" r="6.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"
                            strokeDasharray={C2} strokeDashoffset={C2 * (1 - pct)}
                            transform="rotate(-90 9 9)"
                          />
                        </svg>
                      );
                    },
                  },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    role="group"
                    aria-label={`${m.l}: ${m.v}`}
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 0.8 + i * 0.08, duration: 0.4 }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      paddingBlock: 12, paddingInline: 6,
                      background: `radial-gradient(circle at 50% 0%, ${withAlpha(m.c, 12)} 0%, transparent 70%), linear-gradient(180deg, rgba(20,20,28,0.5) 0%, rgba(14,14,20,0.35) 100%)`,
                      border: `0.5px solid ${withAlpha(m.c, 22)}`,
                      borderRadius: 14,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 12px ${withAlpha(m.c, 8)}`,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div style={{
                      inlineSize: 32, blockSize: 32,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(180deg, ${withAlpha(m.c, 25)} 0%, ${withAlpha(m.c, 8)} 100%)`,
                      border: `0.5px solid ${withAlpha(m.c, 38)}`,
                      borderRadius: 9,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)`,
                    }}>
                      {m.glyph(m.c)}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 16, fontWeight: 500, color: m.c,
                      letterSpacing: -0.4, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                      textShadow: `0 0 6px ${withAlpha(m.c, 40)}`,
                    }}>
                      {m.v}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 7.5, fontWeight: 500, color: t3,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                    }}>
                      {m.l}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Coach quote */}
              <div
                style={{
                  position: "relative",
                  padding: `12px 16px 12px 30px`,
                  marginBlockEnd: space[3],
                  background: `linear-gradient(180deg, rgba(20,20,28,0.55) 0%, rgba(14,14,20,0.4) 100%)`,
                  borderRadius: 12,
                  border: `0.5px solid ${withAlpha(ac, 18)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                <span aria-hidden="true" style={{
                  position: "absolute",
                  insetInlineStart: 12, insetBlockStart: 8,
                  fontFamily: "Georgia, serif",
                  fontSize: 22, lineHeight: 1,
                  color: withAlpha(ac, 50),
                }}>“</span>
                <p style={{ ...ty.body(t2), fontStyle: "italic", margin: 0, fontSize: 13, lineHeight: 1.5 }}>{postMsg}</p>
              </div>

              {/* Next protocol — glass row with pulsing ignition core */}
              {nextProto && (() => {
                const nxCl = protoColor[nextProto.int] || ac;
                return (
                  <motion.div
                    role="group"
                    aria-label={`Ignición siguiente sugerida: ${nextProto.n}`}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 1.0, duration: 0.4 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingBlock: 10, paddingInline: 14,
                      marginBlockEnd: space[3],
                      background: `radial-gradient(circle at 0% 50%, ${withAlpha(nxCl, 14)} 0%, transparent 65%), linear-gradient(180deg, rgba(20,20,28,0.6) 0%, rgba(14,14,20,0.45) 100%)`,
                      borderRadius: 12,
                      border: `0.5px solid ${withAlpha(nxCl, 26)}`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 12px ${withAlpha(nxCl, 10)}`,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div style={{
                      inlineSize: 36, blockSize: 36, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `linear-gradient(180deg, ${withAlpha(nxCl, 25)} 0%, ${withAlpha(nxCl, 8)} 100%)`,
                      border: `0.5px solid ${withAlpha(nxCl, 38)}`,
                      borderRadius: 10,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14)`,
                    }}>
                      <motion.div
                        animate={reduced ? {} : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                        transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          inlineSize: 8, blockSize: 8, borderRadius: "50%",
                          background: `radial-gradient(circle, ${nxCl} 0%, ${withAlpha(nxCl, 40)} 100%)`,
                          boxShadow: `0 0 8px ${nxCl}`,
                        }}
                      />
                    </div>
                    <div style={{ minInlineSize: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 8.5, fontWeight: 500,
                        color: nxCl, letterSpacing: "0.28em", textTransform: "uppercase",
                        textShadow: `0 0 5px ${withAlpha(nxCl, 50)}`,
                        marginBlockEnd: 2,
                      }}>
                        Siguiente ignición
                      </div>
                      <div style={{ ...ty.body(t1), fontWeight: font.weight.semibold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>
                        {nextProto.n} · {Math.round(nextProto.d / 60)} min
                      </div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M4 2 L8 6 L4 10" stroke={withAlpha(nxCl, 70)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </motion.div>
                );
              })()}

              <AnimatePresence initial={false}>
                {showShare && (
                  <motion.div
                    key="share"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden", marginBlockEnd: space[3] }}
                  >
                    <SessionShareCard
                      protocolName={pr.n}
                      durationSec={Math.round(pr.d * durMult)}
                      bioQ={lastBioQ}
                      vCores={postVC}
                      moodDelta={preMood > 0 && checkMood > 0 ? moodDiff : 0}
                      accent={ac}
                      textPrimary={t1}
                      textMuted={t3}
                      onClose={() => setShowShare(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate share card — glass ghost with custom export glyph */}
              {!showShare && (
                <motion.button
                  type="button"
                  whileTap={reduced ? {} : { scale: 0.97 }}
                  onClick={() => setShowShare(true)}
                  aria-label="Ver tarjeta compartible de la sesión"
                  style={{
                    inlineSize: "100%",
                    minBlockSize: 44,
                    paddingBlock: 12,
                    paddingInline: space[3],
                    marginBlockEnd: space[2],
                    borderRadius: 99,
                    background: `linear-gradient(180deg, rgba(20,20,28,0.55) 0%, rgba(14,14,20,0.4) 100%)`,
                    border: `0.5px solid ${withAlpha(ac, 24)}`,
                    color: ac,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    textShadow: `0 0 5px ${withAlpha(ac, 40)}`,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1 L6 8 M3 4 L6 1 L9 4" stroke={ac} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 9 L2 11 L10 11 L10 9" stroke={withAlpha(ac, 70)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  Generar tarjeta
                </motion.button>
              )}

              {/* CONTINUE CTA — glass primary pill (matches breathe step) */}
              <motion.button
                type="button"
                whileTap={reduced ? {} : { scale: 0.985 }}
                onClick={() => { setShowShare(false); onReset(); onSetPostStep("none"); }}
                aria-label="Continuar"
                style={{
                  position: "relative",
                  inlineSize: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  minBlockSize: 48,
                  paddingBlock: 14, paddingInline: 18,
                  borderRadius: 99,
                  background: `linear-gradient(180deg, ${ac} 0%, ${withAlpha(ac, 88)} 100%)`,
                  border: "none",
                  color: "#08080A",
                  fontSize: 13, fontWeight: 600, letterSpacing: 0.05,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(ac, 60)}, 0 4px 14px ${withAlpha(ac, 40)}, 0 0 18px ${withAlpha(ac, 22)}`,
                  overflow: "hidden",
                }}
              >
                <span aria-hidden="true" style={{
                  position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
                  background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`,
                  pointerEvents: "none",
                }} />
                <span style={{ position: "relative", textShadow: "0 0 8px rgba(255,255,255,0.30), 0 1px 1px rgba(0,0,0,0.18)" }}>Continuar</span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 6 L9 6 M6.5 3 L9 6 L6.5 9" stroke="#08080A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
