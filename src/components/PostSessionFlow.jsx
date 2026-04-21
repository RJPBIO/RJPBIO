"use client";
/* ═══════════════════════════════════════════════════════════════
   POST-SESSION FLOW — breathe (check-in) + summary (celebration)
   Full a11y: role=dialog + focus trap, radiogroups, reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import SessionShareCard from "./SessionShareCard";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap } from "../lib/a11y";

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
              background: `${bg}F5`,
              backdropFilter: "blur(30px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: space[5],
              overflowY: "auto",
            }}
            aria-hidden="true"
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
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: space[4], marginBlockEnd: space[4] }}>
                <motion.div
                  aria-hidden="true"
                  animate={reduced ? {} : { scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={reduced ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    inlineSize: 56,
                    blockSize: 56,
                    borderRadius: radius.full,
                    background: `radial-gradient(circle,${withAlpha(ac, 8)},${withAlpha(ac, 4)},transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <motion.div
                    animate={reduced ? {} : { opacity: [0.3, 0.8, 0.3] }}
                    transition={reduced ? {} : { duration: 2.5, repeat: Infinity }}
                    style={{ inlineSize: 12, blockSize: 12, borderRadius: radius.full, background: ac }}
                  />
                </motion.div>
                <div>
                  <h2 id={breatheTitleId} style={{ ...ty.heading(t1), fontSize: font.size.lg, lineHeight: font.leading.normal, margin: 0 }}>
                    Sesión completada
                  </h2>
                  <div style={ty.body(t3)}>Tu sistema nervioso cambió en {Math.round(pr.d * durMult)}s</div>
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

              <div role="radiogroup" aria-label="Nivel de energía" style={{ display: "flex", gap: space[1.5] || 6, marginBlockEnd: space[4] }}>
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

              <div role="radiogroup" aria-label="Contexto de la sesión" style={{ display: "flex", flexWrap: "wrap", gap: space[1], marginBlockEnd: space[4] }}>
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

              <motion.button
                type="button"
                whileTap={reduced || checkMood <= 0 ? {} : { scale: 0.96 }}
                onClick={checkMood > 0 ? submitCheckin : undefined}
                aria-disabled={checkMood <= 0}
                aria-label={checkMood <= 0 ? "Selecciona tu estado antes de continuar" : "Continuar al resumen"}
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
                {checkMood > 0 ? "Continuar" : "Selecciona tu estado"}
              </motion.button>
              <button
                onClick={() => onSetPostStep("summary")}
                aria-label="Omitir check-in"
                style={{
                  inlineSize: "100%",
                  padding: space[2],
                  marginBlockStart: space[1],
                  background: "transparent",
                  border: "none",
                  color: t3,
                  ...ty.caption(t3),
                  cursor: "pointer",
                }}
              >
                Omitir
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
              background: `${bg}F2`,
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: space[5],
              overflowY: "auto",
            }}
            aria-hidden="true"
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
              }}
            >
              {!reduced && Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const dist = 60 + Math.random() * 80;
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
                      insetBlockStart: "18%",
                      insetInlineStart: "50%",
                      inlineSize: i % 3 === 0 ? 5 : 3,
                      blockSize: i % 3 === 0 ? 5 : 3,
                      borderRadius: i % 4 === 0 ? "1px" : radius.full,
                      background: i % 3 === 0 ? ac : i % 3 === 1 ? "#6366F1" : semantic.warning,
                    }}
                  />
                );
              })}

              <div style={{ textAlign: "center", marginBlockEnd: space[4] }}>
                <motion.div
                  aria-hidden="true"
                  initial={reduced ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: `0 auto ${space[2.5] || 10}px`, display: "block" }}>
                    <circle cx="24" cy="24" r="22" fill={ac} opacity=".08" />
                    <circle cx="24" cy="24" r="16" fill={ac} opacity=".12" />
                    <path d="M15 24l6 6 12-12" stroke={ac} strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </motion.div>
                <h2 id={summaryTitleId} style={{ ...ty.heroHeading(t1), margin: 0 }}>
                  {st.totalSessions <= 1 ? "Tu primera ignición" : "Sesión completada"}
                </h2>
                <div style={{ ...ty.title(ac), marginBlockStart: space[1] }}>
                  {pr.n} · {Math.round(pr.d * durMult)}s
                </div>
              </div>

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
                aria-label="Recompensa"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: space[1],
                  marginBlockEnd: space[3],
                }}
              >
                {[
                  { l: "V-Cores", v: "+" + postVC, c: ac },
                  { l: "Enfoque", v: st.coherencia + "%", c: "#3B82F6" },
                  { l: "Calma", v: st.resiliencia + "%", c: "#8B5CF6" },
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
