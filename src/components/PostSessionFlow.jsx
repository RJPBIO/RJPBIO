"use client";
/* ═══════════════════════════════════════════════════════════════
   POST-SESSION FLOW — breathe (check-in) + summary (celebration)
   Full a11y: role=dialog + focus trap, radiogroups, reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  H, submitCheckin, onSetPostStep, onReset,
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
              backdropFilter: "blur(30px)",
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
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }}
              style={{
                background: cd,
                borderRadius: radius["2xl"],
                padding: `${space[6]}px ${space[5]}px`,
                maxInlineSize: 400,
                inlineSize: "100%",
                border: `1px solid ${withAlpha(ac, 8)}`,
              }}
            >
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

              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.05, color: t3, marginBlockEnd: space[2], padding: 0 }}>
                  ¿Cómo te sientes ahora?
                </legend>
                <div role="radiogroup" aria-label="Estado emocional post-sesión" style={{ display: "flex", justifyContent: "center", gap: space[1] }}>
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
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: space[1],
                          paddingBlock: space[2],
                          paddingInline: space[1],
                          borderRadius: radius.md,
                          border: active ? `2px solid ${m.color}` : `1.5px solid ${bd}`,
                          background: active ? withAlpha(m.color, 4) : cd,
                          cursor: "pointer",
                          transition: reduced ? "none" : "all .2s",
                          flex: 1,
                        }}
                      >
                        <Icon name={m.icon} size={18} color={active ? m.color : t3} aria-hidden="true" />
                        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: active ? m.color : t3, textAlign: "center", lineHeight: font.leading.tight }}>
                          {m.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.05, color: t3, marginBlockEnd: space[2], padding: 0 }}>
                  ¿Cómo está tu energía?
                </legend>
                <div role="radiogroup" aria-label="Nivel de energía" style={{ display: "flex", gap: space[1.5] || 6 }}>
                {ENERGY_LEVELS.map((e) => {
                  const active = checkEnergy === e.v;
                  return (
                    <motion.button
                      key={e.id}
                      role="radio"
                      aria-checked={active}
                      aria-label={`Energía ${e.label}`}
                      whileTap={reduced ? {} : { scale: 0.95 }}
                      onClick={() => { setCheckEnergy(e.v); H("tap"); }}
                      style={{
                        flex: 1,
                        padding: space[2],
                        borderRadius: radius.sm,
                        border: active ? `2px solid ${ac}` : `1.5px solid ${bd}`,
                        background: active ? withAlpha(ac, 4) : cd,
                        color: active ? ac : t3,
                        ...ty.caption(active ? ac : t3),
                        cursor: "pointer",
                      }}
                    >
                      {e.label}
                    </motion.button>
                  );
                })}
                </div>
              </fieldset>

              <fieldset style={{ border: "none", padding: 0, margin: 0, marginBlockEnd: space[4] }}>
                <legend style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.05, color: t3, marginBlockEnd: space[2], padding: 0 }}>
                  ¿En qué contexto?
                </legend>
                <div role="radiogroup" aria-label="Contexto de la sesión" style={{ display: "flex", flexWrap: "wrap", gap: space[1] }}>
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
                        paddingBlock: space[1],
                        paddingInline: space[2.5] || 10,
                        borderRadius: radius.lg,
                        border: active ? `1.5px solid ${ac}` : `1px solid ${bd}`,
                        background: active ? withAlpha(ac, 4) : cd,
                        color: active ? ac : t3,
                        ...ty.caption(active ? ac : t3),
                        cursor: "pointer",
                      }}
                    >
                      {tg}
                    </button>
                  );
                })}
                </div>
              </fieldset>

              <motion.button
                type="button"
                whileTap={reduced || checkMood <= 0 ? {} : { scale: 0.96 }}
                onClick={checkMood > 0 ? submitCheckin : undefined}
                aria-disabled={checkMood <= 0}
                aria-label={checkMood <= 0 ? "Continuar — selecciona tu estado primero" : "Continuar al resumen"}
                style={{
                  inlineSize: "100%",
                  minBlockSize: 48,
                  paddingBlock: 14,
                  borderRadius: radius.full,
                  background: checkMood > 0 ? ac : bd,
                  border: "none",
                  color: checkMood > 0 ? "#fff" : t3,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.1,
                  cursor: checkMood > 0 ? "pointer" : "not-allowed",
                  opacity: checkMood > 0 ? 1 : 0.55,
                }}
              >
                Continuar
              </motion.button>
              <button
                onClick={() => onSetPostStep("summary")}
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
              background: `radial-gradient(120% 80% at 50% 0%, ${withAlpha(ac, 10)}, ${bg}F2 60%)`,
              backdropFilter: "blur(20px)",
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
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }}
              style={{
                background: cd,
                borderRadius: radius["2xl"],
                padding: `${space[7]}px ${space[6]}px`,
                maxInlineSize: 400,
                inlineSize: "100%",
                position: "relative",
                overflow: "hidden",
                border: `1px solid ${withAlpha(ac, 8)}`,
              }}
            >
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
                    transition={{ duration: 1.8, delay: i * 0.04, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      insetBlockStart: "22%",
                      insetInlineStart: "50%",
                      inlineSize: i % 3 === 0 ? 5 : 3,
                      blockSize: i % 3 === 0 ? 5 : 3,
                      borderRadius: i % 4 === 0 ? "1px" : radius.full,
                      background: palette[i % 4],
                      boxShadow: i % 3 === 0 ? `0 0 6px ${palette[i % 4]}` : "none",
                    }}
                  />
                );
              })}

              <div style={{ display: "flex", justifyContent: "center", marginBlockEnd: space[2] }}>
                <BioIgnicionMark glyphSize={22} textColor={t1} signalColor={ac} letterSpacing={3} animated={false} />
              </div>
              <div style={{ textAlign: "center", marginBlockEnd: space[4] }}>
                <motion.div
                  aria-hidden="true"
                  initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 16, delay: 0.2 }}
                  style={{ position: "relative", inlineSize: 72, blockSize: 72, margin: `0 auto ${space[2]}px` }}
                >
                  <motion.div
                    aria-hidden="true"
                    initial={{ scale: 0.3, opacity: 0.8 }}
                    animate={reduced ? {} : { scale: [0.3, 2, 2.4], opacity: [0.6, 0.15, 0] }}
                    transition={reduced ? {} : { duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                    style={{ position: "absolute", inset: 0, borderRadius: radius.full, border: `2px solid ${ac}` }}
                  />
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: "relative" }}>
                    <circle cx="36" cy="36" r="34" fill={withAlpha(ac, 8)} />
                    <circle cx="36" cy="36" r="26" fill={withAlpha(ac, 12)} />
                    <motion.path
                      d="M22 36l10 10 18-18"
                      stroke={ac}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                </motion.div>
                <h2 id={summaryTitleId} style={{ ...ty.heroHeading(t1), margin: 0 }}>
                  {st.totalSessions <= 1 ? "Tu primera ignición" : `Ignición #${st.totalSessions}`}
                </h2>
                <div style={{ ...ty.title(ac), marginBlockStart: space[1] }}>
                  {pr.n} · {Math.round(pr.d * durMult)}s
                </div>
              </div>

              {typeof lastBioQ === "number" && lastBioQ > 0 && (() => {
                const tone = bioQTone(lastBioQ);
                return (
                  <motion.div
                    role="group"
                    aria-label={`BioQ Score ${lastBioQ} por ciento — calidad ${tone.label}`}
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 0.55, duration: 0.4 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: space[3],
                      padding: `${space[3]}px ${space[4]}px`,
                      marginBlockEnd: space[3],
                      background: `linear-gradient(135deg, ${withAlpha(tone.color, 8)}, ${withAlpha(tone.color, 4)})`,
                      borderRadius: radius.lg,
                      border: `1px solid ${withAlpha(tone.color, 15)}`,
                    }}
                  >
                    <div>
                      <div style={{ ...ty.caption(t3), letterSpacing: 1.5, textTransform: "uppercase", fontSize: font.size.xs }}>
                        BioQ Score
                      </div>
                      <div style={{ ...ty.caption(t2), fontSize: font.size.sm, marginBlockStart: 2 }}>
                        Calidad de sesión · {tone.label}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      <div style={{ ...ty.metric(tone.color, font.size["3xl"]), fontVariantNumeric: "tabular-nums" }}>
                        {lastBioQ}
                      </div>
                      <div style={{ ...ty.caption(t3), fontSize: font.size.sm }}>%</div>
                    </div>
                  </motion.div>
                );
              })()}

              {st.streak >= 3 && (
                <div
                  role="status"
                  style={{
                    textAlign: "center",
                    padding: space[2.5] || 10,
                    marginBlockEnd: space[3],
                    background: `linear-gradient(135deg,${withAlpha(semantic.warning, isDark ? 8 : 4)},${withAlpha(semantic.warning, isDark ? 4 : 2)})`,
                    borderRadius: radius.lg,
                    border: `1px solid ${withAlpha(semantic.warning, 8)}`,
                  }}
                >
                  <div style={ty.title(semantic.warning)}>
                    <Icon name="fire" size={14} color={semantic.warning} aria-hidden="true" />{" "}
                    {st.streak} días ·{" "}
                    {st.streak >= 30 ? "Imparable" : st.streak >= 14 ? "Disciplinado" : st.streak >= 7 ? "Constante" : "En construcción"}
                  </div>
                </div>
              )}

              {preMood > 0 && checkMood > 0 && (
                <div
                  role="group"
                  aria-label={`Cambio de ánimo: ${moodDiff > 0 ? "+" : ""}${moodDiff} puntos`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space[3],
                    marginBlockEnd: space[4],
                    padding: space[4],
                    background: `linear-gradient(135deg,${isDark ? "#1A1E28" : "#F1F5F9"},${isDark ? "#141820" : "#F8FAFC"})`,
                    borderRadius: radius.lg,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <Icon name={MOODS[preMood - 1].icon} size={22} color={MOODS[preMood - 1].color} aria-hidden="true" />
                    <div style={{ ...ty.caption(t3), marginBlockStart: 3 }}>Antes</div>
                  </div>
                  <motion.div
                    initial={reduced ? { scale: 1 } : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reduced ? { duration: 0 } : { type: "spring", delay: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                  >
                    <div
                      style={ty.metric(
                        moodDiff > 0 ? semantic.success : moodDiff < 0 ? semantic.danger : t3,
                        font.size.xl
                      )}
                    >
                      {moodDiff > 0 ? "+" + moodDiff : moodDiff === 0 ? "=" : moodDiff}
                    </div>
                    <div style={ty.caption(t3)}>puntos</div>
                  </motion.div>
                  <div style={{ textAlign: "center" }}>
                    <Icon name={MOODS[checkMood - 1].icon} size={22} color={MOODS[checkMood - 1].color} aria-hidden="true" />
                    <div style={{ ...ty.caption(t3), marginBlockStart: 3 }}>Después</div>
                  </div>
                </div>
              )}

              <div
                role="group"
                aria-label="Contribución de esta sesión"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: space[1],
                  marginBlockEnd: space[3],
                }}
              >
                {[
                  { l: "V-Cores", v: "+" + postVC, c: bioSignal.ignition },
                  { l: "Racha", v: (st.streak || 0) + "d", c: bioSignal.signalAmber },
                  { l: "Hoy", v: (st.todaySessions || 1) + "/" + (st.sessionGoal || 2), c: ac },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    role="group"
                    aria-label={`${m.l}: ${m.v}`}
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 0.2 + i * 0.1 }}
                    style={{
                      background: withAlpha(m.c, 4),
                      borderRadius: radius.sm + 3,
                      padding: `${space[2]}px ${space[1]}px`,
                      textAlign: "center",
                    }}
                  >
                    <div style={ty.metric(m.c, font.size.lg)}>{m.v}</div>
                    <div style={{ fontSize: font.size.sm, fontWeight: 600, letterSpacing: -0.05, color: t3, marginBlockStart: 1 }}>{m.l}</div>
                  </motion.div>
                ))}
              </div>

              <div
                style={{
                  background: withAlpha(ac, 4),
                  borderRadius: radius.sm,
                  padding: `${space[2.5] || 10}px ${space[3]}px`,
                  marginBlockEnd: space[3],
                  border: `1px solid ${withAlpha(ac, 6)}`,
                }}
              >
                <p style={{ ...ty.body(t2), fontStyle: "italic", margin: 0 }}>{postMsg}</p>
              </div>

              {nextProto && (() => {
                const nxCl = protoColor[nextProto.int] || ac;
                return (
                  <motion.div
                    role="group"
                    aria-label={`Ignición siguiente sugerida: ${nextProto.n}`}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { delay: 0.7 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: space[3],
                      padding: `${space[2.5] || 10}px ${space[3]}px`,
                      marginBlockEnd: space[3],
                      background: `linear-gradient(135deg, ${withAlpha(nxCl, 6)}, ${withAlpha(nxCl, 2)})`,
                      borderRadius: radius.md,
                      border: `1px solid ${withAlpha(nxCl, 12)}`,
                    }}
                  >
                    <div style={{
                      inlineSize: 36, blockSize: 36, borderRadius: radius.full,
                      background: `radial-gradient(circle at 50% 40%, ${withAlpha(nxCl, 25)}, #0a0d14 75%)`,
                      boxShadow: `inset 0 1px 0 ${withAlpha("#ffffff", 6)}, 0 0 12px ${withAlpha(nxCl, 25)}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <div style={{ inlineSize: 8, blockSize: 8, borderRadius: radius.full, background: bioSignal.ignition, boxShadow: `0 0 6px ${nxCl}` }} />
                    </div>
                    <div style={{ minInlineSize: 0, flex: 1 }}>
                      <div style={{ fontSize: font.size.xs, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: font.weight.bold, color: nxCl, marginBlockEnd: 2 }}>
                        Ignición siguiente
                      </div>
                      <div style={{ ...ty.body(t1), fontWeight: font.weight.semibold, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nextProto.n} · {Math.round(nextProto.d / 60)} min
                      </div>
                    </div>
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
                    borderRadius: radius.full,
                    background: "transparent",
                    border: `1px solid ${withAlpha(ac, 10)}`,
                    color: ac,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: -0.05,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space[1],
                  }}
                >
                  <Icon name="export" size={14} color={ac} />
                  Generar tarjeta
                </motion.button>
              )}

              <motion.button
                whileTap={reduced ? {} : { scale: 0.96 }}
                onClick={() => { setShowShare(false); onReset(); onSetPostStep("none"); }}
                aria-label="Continuar"
                style={{
                  inlineSize: "100%",
                  minBlockSize: 48,
                  paddingBlock: 14,
                  borderRadius: radius.full,
                  background: ac,
                  border: "none",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.1,
                  cursor: "pointer",
                }}
              >
                Continuar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
