"use client";
/* ═══════════════════════════════════════════════════════════════
   PROFILE VIEW — operator identity + analytics
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../lib/easings";
import Link from "next/link";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import { BioGlyph } from "./BioIgnicionMark";
import AchievementBadge, { achievementMeta } from "./AchievementBadge";
import { MOODS, DS, AM, LVL } from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, suggestOptimalTime, analyzeStreakChain,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, bioSignal, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";
import RemindersCard from "./RemindersCard";
import InstrumentDueCard from "./InstrumentDueCard";
import BaselineCard from "./BaselineCard";
import ProfileAuthCard from "./ProfileAuthCard";

const ACHIEVEMENT_IDS = Object.keys(AM);
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function sectionLabel(color) {
  return {
    fontSize: 12,
    fontWeight: 600,
    color,
    letterSpacing: -0.05,
    margin: 0,
  };
}

export default function ProfileView({
  st, setSt, isDark, ac,
  onShowSettings, onShowHist, onShowCalibration,
  onShowChronotype, onShowResonance, onShowNOM035,
}) {
  const reduced = useReducedMotion();
  const { card: cd, surface: sf, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const lv = gL(st.totalSessions);
  const lPct = lvPct(st.totalSessions);
  const nLv = nxtLv(st.totalSessions);
  const perf = Math.round(((st.coherencia || 0) + (st.resiliencia || 0) + (st.capacidad || 0)) / 3);
  const totalSessions = st.totalSessions || 0;
  const streak = st.streak || 0;
  const nSt = getStatus(perf);
  const avgMood = useMemo(() => {
    const ml = st.moodLog || [];
    if (!ml.length) return 0;
    return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1);
  }, [st.moodLog]);

  const subtle = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)";

  // Cascade entrance helper — applies stagger delay per slot
  const enterCascade = (idx) => ({
    initial: reduced ? { opacity: 1 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 + idx * 0.045 },
  });

  // State-aware: detect empty operator (no data yet)
  const totalSeconds = st.totalTime || 0;
  const isEmptyOperator = totalSessions === 0 && streak === 0 && totalSeconds === 0;

  return (
    <section role="region" aria-label="Perfil del operador" style={{ paddingBlock: "14px 220px", paddingInline: 20 }}>
      {/* "OPERATOR PASS" — asymmetric badge horizontal, BIO-IGNICIÓN signature */}
      {(() => {
        const passId = `OPN·${String(totalSessions).padStart(3, "0")}·${String(streak).padStart(2, "0")}`;
        const yearShort = new Date().getFullYear();
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const timeLabel = `${hours}h ${String(mins).padStart(2, "0")}m`;
        return (
        <motion.article
          aria-label={`Pase Operador Neural, rango ${lv.n}`}
          {...enterCascade(0)}
          style={{
            position: "relative",
            marginBlockStart: 6,
            marginBlockEnd: 22,
            padding: "16px 16px 14px",
            borderRadius: 22,
            background: `radial-gradient(ellipse 90% 70% at 100% 0%, ${withAlpha(ac, 22)} 0%, ${withAlpha(ac, 8)} 35%, transparent 70%), radial-gradient(ellipse 60% 80% at 0% 100%, ${withAlpha(bioSignal.neuralViolet, 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.10) 100%)`,
            backdropFilter: "blur(28px) saturate(160%) brightness(1.04)",
            WebkitBackdropFilter: "blur(28px) saturate(160%) brightness(1.04)",
            border: `0.5px solid rgba(255,255,255,0.10)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.26), 0 1px 0 ${withAlpha(ac, 18)}, 0 12px 36px rgba(0,0,0,0.36), 0 0 0 1px ${withAlpha(ac, 22)}, 0 0 24px ${withAlpha(ac, 14)}`,
            overflow: "hidden",
          }}
        >
          {/* Top hairline shimmer */}
          <span aria-hidden="true" style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)`, pointerEvents: "none" }} />
          {/* Corner mark — chamfered detail bottom-left */}
          <span aria-hidden="true" style={{ position: "absolute", bottom: 8, left: 8, inlineSize: 10, blockSize: 10, borderInlineStart: `1px solid ${withAlpha(ac, 60)}`, borderBlockEnd: `1px solid ${withAlpha(ac, 60)}`, pointerEvents: "none" }} />
          <span aria-hidden="true" style={{ position: "absolute", bottom: 8, right: 8, inlineSize: 10, blockSize: 10, borderInlineEnd: `1px solid ${withAlpha(ac, 60)}`, borderBlockEnd: `1px solid ${withAlpha(ac, 60)}`, pointerEvents: "none" }} />

          {/* Top row: pass-ID left + status right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 14, position: "relative", zIndex: 1 }}>
            <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: "0.22em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: ac, textShadow: `0 0 6px ${withAlpha(ac, 50)}` }}>OPN</span>
              <span style={{ marginInline: 5, color: "rgba(245,245,247,0.20)" }}>·</span>
              <span>{yearShort}</span>
              <span style={{ marginInline: 5, color: "rgba(245,245,247,0.20)" }}>/</span>
              <span>{passId.split("·").slice(1).join("·")}</span>
            </span>
            <span aria-label={`Estado ${nSt.label}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span aria-hidden="true" style={{ position: "relative", inlineSize: 6, blockSize: 6, display: "inline-block" }}>
                <motion.span animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }} transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: nSt.color }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${nSt.color} 55%, ${nSt.color} 100%)`, boxShadow: `0 0 8px ${nSt.color}, 0 0 3px ${nSt.color}` }} />
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: nSt.color, letterSpacing: "0.20em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(nSt.color, 50)}` }}>{nSt.label}</span>
            </span>
          </div>

          {/* Main body — split asymmetric: BioGlyph squircle (left) + identity (right) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", zIndex: 1 }}>
            {/* BioGlyph squircle (NOT circle — distinct shape) */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <motion.div
                aria-hidden="true"
                animate={reduced ? {} : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
                transition={reduced ? {} : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: -8, borderRadius: 24, background: `radial-gradient(ellipse at center, ${withAlpha(ac, 22)} 0%, transparent 60%)`, filter: "blur(14px)", pointerEvents: "none", zIndex: 0 }}
              />
              <div
                aria-label={`Identidad bioneural, nivel ${lv.n}`}
                style={{
                  position: "relative",
                  zIndex: 1,
                  inlineSize: 76,
                  blockSize: 76,
                  borderRadius: 22,
                  background: `radial-gradient(circle at 30% 25%, ${withAlpha(ac, 28)} 0%, ${withAlpha(ac, 12)} 50%, transparent 90%), linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.20) 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.30), inset 0 0 0 0.5px ${withAlpha(ac, 24)}, 0 0 0 1px ${withAlpha(ac, 32)}, 0 8px 22px ${withAlpha(ac, 28)}, 0 0 22px ${withAlpha(ac, 18)}`,
                  backdropFilter: "blur(8px) saturate(140%)",
                }}
              >
                <BioGlyph size={48} color={bioSignal.phosphorCyan} spark={bioSignal.ignition} animated={!reduced} />
              </div>
              {/* Level chevron tag bottom-right */}
              <div aria-hidden="true" style={{ position: "absolute", insetBlockEnd: -6, insetInlineEnd: -6, zIndex: 2, display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px 3px 6px", borderRadius: 8, background: `linear-gradient(135deg, ${lv.c} 0%, ${lv.c}cc 100%)`, border: `1.5px solid #08080A`, boxShadow: `0 0 0 1px ${withAlpha(lv.c, 50)}, 0 4px 10px ${withAlpha(lv.c, 50)}` }}>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: "#fff", letterSpacing: "0.04em", lineHeight: 1, textShadow: `0 1px 1px rgba(0,0,0,0.30)` }}>{lv.g || lv.n[0]}.{Math.max(1, totalSessions)}</span>
              </div>
            </div>

            {/* Identity column — vertical stack */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: "0.30em", textTransform: "uppercase", marginBlockEnd: 4 }}>Operador</div>
              <motion.h2
                initial={reduced ? undefined : { backgroundPosition: "120% 0, 0 0" }}
                animate={reduced ? undefined : { backgroundPosition: ["120% 0, 0 0", "-20% 0, 0 0", "-20% 0, 0 0"] }}
                transition={reduced ? undefined : { duration: 11, times: [0, 0.55, 1], ease: "easeInOut", repeat: Infinity }}
                style={{
                  margin: 0,
                  fontSize: 24,
                  lineHeight: 1.0,
                  fontWeight: 250,
                  letterSpacing: -1.0,
                  fontFeatureSettings: "'ss01' on, 'cv11' on",
                  backgroundImage: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(225,225,232,0.78) 100%)",
                  backgroundSize: "200% 100%, 100% 100%",
                  backgroundRepeat: "no-repeat",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.30))",
                }}
              >Neural</motion.h2>
              {/* Inline progress bar showing level pct */}
              <div style={{ marginBlockStart: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={lPct} style={{ flex: 1, blockSize: 4, borderRadius: 99, background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.18) 100%)", boxShadow: "inset 0 0.5px 0 rgba(0,0,0,0.40), 0 0 0 0.5px rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div
                    initial={reduced ? { width: lPct + "%" } : { width: 0 }}
                    animate={{ width: lPct + "%" }}
                    transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{ blockSize: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${lv.c}aa 0%, ${lv.c} 100%)`, boxShadow: `0 0 6px ${lv.c}80, inset 0 0.5px 0 rgba(255,255,255,0.30)` }}
                  />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9, fontWeight: 500, color: lv.c, letterSpacing: "0.10em", fontVariantNumeric: "tabular-nums", textShadow: `0 0 6px ${withAlpha(lv.c, 50)}`, textTransform: "uppercase", whiteSpace: "nowrap" }}>{lv.n}·{lPct}%</span>
              </div>
            </div>
          </div>

          {/* Bottom metrics row — horizontal mono caps separator */}
          {isEmptyOperator ? (
            // Empty state — RECOLECTANDO DATOS pulse with calibrating triple dots
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBlockStart: 14, paddingBlockStart: 10, borderBlockStart: `0.5px solid rgba(255,255,255,0.06)`, position: "relative", zIndex: 1 }}>
              <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      inlineSize: 4,
                      blockSize: 4,
                      borderRadius: "50%",
                      background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 60%)`,
                      boxShadow: `0 0 5px ${ac}`,
                      animation: reduced ? "none" : `shimDot 1.4s ease-in-out ${i * 0.36}s infinite`,
                    }}
                  />
                ))}
              </span>
              <span style={{
                fontFamily: MONO,
                fontSize: 8.5,
                fontWeight: 500,
                color: ac,
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                textShadow: `0 0 6px ${withAlpha(ac, 50)}`,
              }}>
                Recolectando datos
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 8, marginBlockStart: 14, paddingBlockStart: 10, borderBlockStart: `0.5px solid rgba(255,255,255,0.06)`, position: "relative", zIndex: 1 }}>
              {[
                { v: totalSessions, l: "Sesiones" },
                { v: timeLabel, l: "Tiempo" },
                { v: streak, l: "Racha" },
              ].map((m, i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, fontWeight: 500, color: "rgba(245,245,247,0.96)", letterSpacing: -0.2, fontVariantNumeric: "tabular-nums", textShadow: `0 0 6px ${withAlpha(ac, 30)}` }}>{m.v}</span>
                  <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.22em", textTransform: "uppercase" }}>{m.l}</span>
                </div>
              ))}
            </div>
          )}
        </motion.article>
      );})()}

      <motion.div {...enterCascade(1)}>
        <ProfileAuthCard isDark={isDark} ac={ac} />
      </motion.div>
      {/* Stats card eliminado — sesiones/tiempo/racha + level progress ya viven en el Operator Pass header (data ladder + inline progress bar). Sin duplicación. */}

      {/* Neural Progression Track — horizontal vertebra of 6 Greek-glyph rank nodes */}
      <motion.details
        {...enterCascade(2)}
        className="bi-rank-ladder"
        style={{
          position: "relative",
          background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${withAlpha(lv.c, 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          borderRadius: 18,
          border: `0.5px solid rgba(255,255,255,0.10)`,
          marginBlockEnd: 14,
          overflow: "hidden",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(lv.c, 18)}, 0 6px 22px rgba(0,0,0,0.28)`,
        }}
      >
        <summary
          aria-label="Ver todos los rangos del operador neural"
          style={{
            listStyle: "none",
            cursor: "pointer",
            padding: "14px 14px 14px",
            userSelect: "none",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top eyebrow row — section title + current rank meta */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: "0.30em", textTransform: "uppercase" }}>Progresión Neural</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span aria-hidden="true" style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: lv.c, letterSpacing: "0.20em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(lv.c, 50)}` }}>{lv.n}</span>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9, fontWeight: 500, color: "rgba(245,245,247,0.50)", letterSpacing: "0.10em", fontVariantNumeric: "tabular-nums" }}>· {totalSessions}/{lv.mx < 999 ? lv.mx : "∞"}</span>
            </span>
          </div>

          {/* Horizontal vertebra track — 6 rank nodes */}
          <div style={{ position: "relative", marginBlockEnd: 14 }}>
            {/* Spinal line connecting all nodes */}
            <div aria-hidden="true" style={{ position: "absolute", top: 14, left: "8.33%", right: "8.33%", height: 1, background: `linear-gradient(90deg, ${withAlpha(LVL[0].c, 60)} 0%, ${withAlpha(lv.c, 80)} ${(LVL.findIndex(r => r.n === lv.n) / (LVL.length - 1)) * 100}%, rgba(255,255,255,0.08) ${(LVL.findIndex(r => r.n === lv.n) / (LVL.length - 1)) * 100 + 5}%, rgba(255,255,255,0.05) 100%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingInline: 0, position: "relative" }}>
              {LVL.map((rank, idx) => {
                const currentIdx = LVL.findIndex(r => r.n === lv.n);
                const isCurrent = idx === currentIdx;
                const isPast = idx < currentIdx;
                const isFuture = idx > currentIdx;
                return (
                  <div key={rank.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                    {/* Greek glyph node */}
                    <div aria-hidden="true" style={{ position: "relative", inlineSize: 28, blockSize: 28, borderRadius: "50%", background: isCurrent ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${rank.c} 0%, ${rank.c}cc 100%)` : isPast ? `${rank.c}26` : "rgba(255,255,255,0.04)", border: `1px solid ${isCurrent ? withAlpha(rank.c, 60) : isPast ? `${rank.c}3a` : "rgba(255,255,255,0.10)"}`, boxShadow: isCurrent ? `0 0 0 1px rgba(0,0,0,0.30), 0 0 14px ${withAlpha(rank.c, 50)}, 0 0 0 4px ${withAlpha(rank.c, 12)}, inset 0 1px 0 rgba(255,255,255,0.22)` : isPast ? `inset 0 1px 0 rgba(255,255,255,0.06)` : "inset 0 1px 0 rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isCurrent && !reduced && (
                        <motion.span aria-hidden="true" animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }} style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `1px solid ${rank.c}`, boxShadow: `0 0 8px ${rank.c}` }} />
                      )}
                      <span style={{ fontSize: 14, fontWeight: 500, color: isCurrent ? "#fff" : isPast ? rank.c : "rgba(245,245,247,0.30)", lineHeight: 1, fontFamily: "'Times New Roman', serif", textShadow: isCurrent ? `0 0 6px ${withAlpha(rank.c, 80)}, 0 1px 1px rgba(0,0,0,0.30)` : "none", position: "relative", zIndex: 1 }}>{rank.g}</span>
                    </div>
                    {/* Position dot below */}
                    <span aria-hidden="true" style={{ inlineSize: 3, blockSize: 3, borderRadius: "50%", background: isCurrent ? rank.c : isPast ? `${rank.c}80` : "rgba(255,255,255,0.14)", boxShadow: isCurrent ? `0 0 4px ${rank.c}` : "none" }} />
                    {/* Rank name micro */}
                    <span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: isCurrent ? rank.c : isPast ? "rgba(245,245,247,0.55)" : "rgba(245,245,247,0.30)", letterSpacing: "0.10em", textTransform: "uppercase", textAlign: "center", whiteSpace: "nowrap", textShadow: isCurrent ? `0 0 6px ${withAlpha(rank.c, 50)}` : "none" }}>{rank.n.slice(0, 5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: progression hint + expand chevron */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: "rgba(245,245,247,0.62)", letterSpacing: "0.14em", fontVariantNumeric: "tabular-nums" }}>
              {nLv ? <>→ <span style={{ color: nLv.c, fontWeight: 500, textShadow: `0 0 6px ${withAlpha(nLv.c, 50)}` }}>{nLv.n.toUpperCase()}</span> en <span style={{ color: "rgba(245,245,247,0.92)" }}>{Math.max(0, nLv.m - (st.totalSessions || 0))}</span> sesiones</> : "Rango máximo alcanzado"}
            </span>
            <span aria-hidden="true" className="bi-rank-chev" style={{ display: "inline-flex", color: lv.c, opacity: 0.7, transition: "transform .2s ease", filter: `drop-shadow(0 0 4px ${withAlpha(lv.c, 50)})` }}>
              <Icon name="chevron-down" size={12} color={lv.c} />
            </span>
          </div>
        </summary>
        <ol
          role="list"
          aria-label="Progresión de rangos"
          style={{
            listStyle: "none",
            margin: 0,
            padding: `0 14px 16px`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderBlockStart: `0.5px solid rgba(255,255,255,0.06)`,
            paddingBlockStart: 14,
          }}
        >
          {LVL.map((rank, idx) => {
            const currentIdx = LVL.findIndex(r => r.n === lv.n);
            const isCurrent = idx === currentIdx;
            const isPast = idx < currentIdx;
            return (
              <li
                key={rank.n}
                aria-current={isCurrent ? "true" : undefined}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: isCurrent ? `linear-gradient(180deg, ${withAlpha(rank.c, 16)} 0%, ${withAlpha(rank.c, 6)} 100%)` : "transparent",
                  border: `0.5px solid ${isCurrent ? withAlpha(rank.c, 38) : "transparent"}`,
                  opacity: isPast && !isCurrent ? 0.62 : isCurrent ? 1 : 0.85,
                  boxShadow: isCurrent ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 12px ${withAlpha(rank.c, 18)}` : "none",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    inlineSize: 36,
                    blockSize: 36,
                    borderRadius: "50%",
                    background: isCurrent ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${rank.c} 0%, ${rank.c}cc 100%)` : `${rank.c}1a`,
                    border: `0.5px solid ${isCurrent ? withAlpha(rank.c, 60) : `${rank.c}30`}`,
                    boxShadow: isCurrent ? `inset 0 1px 0 rgba(255,255,255,0.20), 0 0 12px ${withAlpha(rank.c, 40)}` : "inset 0 1px 0 rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 500,
                    color: isCurrent ? "#fff" : rank.c,
                    lineHeight: 1,
                    fontFamily: "'Times New Roman', serif",
                    textShadow: isCurrent ? `0 0 8px ${withAlpha(rank.c, 80)}, 0 1px 1px rgba(0,0,0,0.30)` : "none",
                  }}
                >
                  {rank.g}
                </div>
                <div style={{ minInlineSize: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: isCurrent ? rank.c : "rgba(245,245,247,0.92)", letterSpacing: "0.18em", textTransform: "uppercase", lineHeight: 1.2, marginBlockEnd: 3, textShadow: isCurrent ? `0 0 8px ${withAlpha(rank.c, 50)}` : "none" }}>
                    {rank.n}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(245,245,247,0.55)", lineHeight: 1.4, letterSpacing: -0.05 }}>{rank.d}</div>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 10,
                    fontWeight: 500,
                    color: isCurrent ? rank.c : "rgba(245,245,247,0.42)",
                    letterSpacing: 0,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                    textShadow: isCurrent ? `0 0 6px ${withAlpha(rank.c, 50)}` : "none",
                  }}
                >
                  {rank.m}{rank.mx < 999 ? `–${rank.mx}` : "+"}
                </div>
              </li>
            );
          })}
        </ol>
      </motion.details>

      {(() => {
        const unlocked = st.achievements || [];
        const unlockedCount = ACHIEVEMENT_IDS.filter((id) => unlocked.includes(id)).length;
        const recentId = unlocked[unlocked.length - 1];

        // Tier breakdown — sólo tiers con unlocks > 0
        const tierCounts = { bronze: 0, silver: 0, gold: 0, cyan: 0, violet: 0, rose: 0 };
        unlocked.forEach((id) => {
          const meta = achievementMeta(id);
          if (meta && tierCounts[meta.tier] !== undefined) tierCounts[meta.tier]++;
        });
        const tierOrder = [
          { k: "gold",   c: bioSignal.ignition,      n: "oro" },
          { k: "rose",   c: bioSignal.plasmaPink,    n: "rosa" },
          { k: "violet", c: bioSignal.neuralViolet,  n: "violeta" },
          { k: "cyan",   c: bioSignal.phosphorCyan,  n: "cian" },
          { k: "silver", c: "#94A3B8",               n: "plata" },
          { k: "bronze", c: "#D97706",               n: "bronce" },
        ];
        const activeTiers = tierOrder.filter((tr) => tierCounts[tr.k] > 0);

        // Unlocked primero, locked después (estable)
        const sortedIds = [...ACHIEVEMENT_IDS].sort((a, b) => {
          const ua = unlocked.includes(a) ? 1 : 0;
          const ub = unlocked.includes(b) ? 1 : 0;
          return ub - ua;
        });

        const pct = ACHIEVEMENT_IDS.length ? (unlockedCount / ACHIEVEMENT_IDS.length) * 100 : 0;
        const bracketColor = withAlpha(brand.primary, isDark ? 30 : 22);

        // Tier total for distribution bar
        const tierBarColors = tierOrder.map(tr => ({ c: tr.c, count: tierCounts[tr.k], n: tr.n, k: tr.k }));
        return (
          <motion.details
            {...enterCascade(3)}
            aria-label={`Logros: ${unlockedCount} de ${ACHIEVEMENT_IDS.length}`}
            style={{
              position: "relative",
              background: `radial-gradient(ellipse 70% 50% at 100% 0%, ${withAlpha(bioSignal.ignition, 14)} 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 0% 100%, ${withAlpha(bioSignal.plasmaPink, 10)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
              backdropFilter: "blur(22px) saturate(150%)",
              WebkitBackdropFilter: "blur(22px) saturate(150%)",
              borderRadius: 18,
              marginBlockEnd: 14,
              border: `0.5px solid rgba(255,255,255,0.10)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(bioSignal.ignition, 14)}, 0 8px 24px rgba(0,0,0,0.30)`,
              overflow: "hidden",
            }}
          >
            {/* Diagonal asymmetric brackets — top-right + bottom-left only */}
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 14, blockSize: 14, insetBlockStart: 10, insetInlineEnd: 10, pointerEvents: "none", zIndex: 2 }} viewBox="0 0 14 14">
              <path d="M0 0 L14 0 L14 14" stroke={withAlpha(bioSignal.ignition, 70)} strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 14, blockSize: 14, insetBlockEnd: 10, insetInlineStart: 10, pointerEvents: "none", zIndex: 2 }} viewBox="0 0 14 14">
              <path d="M14 14 L0 14 L0 0" stroke={withAlpha(bioSignal.ignition, 70)} strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>

            {/* COLLAPSED — compact strip */}
            <summary
              aria-label={`Ver todas las insignias. ${unlockedCount} de ${ACHIEVEMENT_IDS.length} desbloqueadas`}
              style={{
                listStyle: "none",
                cursor: "pointer",
                padding: "14px 14px 13px",
                userSelect: "none",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Top eyebrow row — pulse + label + sessions context */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBlockEnd: 10 }}>
                <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block", flexShrink: 0 }}>
                  <motion.span animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }} transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut" }} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: bioSignal.ignition }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${bioSignal.ignition} 55%, ${bioSignal.ignition} 100%)`, boxShadow: `0 0 6px ${bioSignal.ignition}, 0 0 2px ${bioSignal.ignition}` }} />
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: bioSignal.ignition, letterSpacing: "0.30em", textTransform: "uppercase", textShadow: `0 0 8px ${withAlpha(bioSignal.ignition, 50)}` }}>Logros neurales</span>
              </div>

              {/* Compact strip — number + tier bar + chevron all inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Number-hero compact */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 32, fontWeight: 200, lineHeight: 0.9, letterSpacing: -1.6, color: "rgba(245,245,247,0.96)", fontVariantNumeric: "tabular-nums", textShadow: `0 0 14px ${withAlpha(bioSignal.ignition, 40)}` }}>{unlockedCount}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: 0, fontVariantNumeric: "tabular-nums" }}>/ {ACHIEVEMENT_IDS.length}</span>
                </div>

                {/* Tier-distribution bar — flexible mid */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div aria-label="Distribución por tier" style={{ display: "flex", gap: 2, blockSize: 6, borderRadius: 99, overflow: "hidden", padding: 1, background: "linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.18) 100%)", boxShadow: "inset 0 0.5px 0 rgba(0,0,0,0.40), 0 0 0 0.5px rgba(255,255,255,0.05)" }}>
                    {tierBarColors.filter(t => t.count > 0).map((t) => (
                      <div key={t.k} style={{ flex: t.count, blockSize: "100%", borderRadius: 99, background: `linear-gradient(180deg, ${t.c} 0%, ${t.c}cc 100%)`, boxShadow: `0 0 6px ${withAlpha(t.c, 70)}, inset 0 0.5px 0 rgba(255,255,255,0.30)` }} />
                    ))}
                    <div style={{ flex: ACHIEVEMENT_IDS.length - unlockedCount, blockSize: "100%", background: "rgba(255,255,255,0.04)" }} />
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.50)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                    {unlockedCount === 0 ? "Insignias por desbloquear" : `${ACHIEVEMENT_IDS.length - unlockedCount} restantes`}
                  </span>
                </div>

                {/* Expand chevron */}
                <span aria-hidden="true" className="bi-rank-chev" style={{ display: "inline-flex", color: bioSignal.ignition, opacity: 0.7, transition: "transform .2s ease", filter: `drop-shadow(0 0 4px ${withAlpha(bioSignal.ignition, 50)})` }}>
                  <Icon name="chevron-down" size={12} color={bioSignal.ignition} />
                </span>
              </div>
            </summary>

            {/* EXPANDED — tier legend + badge grid */}
            <div style={{ padding: "0 14px 16px", borderBlockStart: `0.5px solid rgba(255,255,255,0.06)`, paddingBlockStart: 14, position: "relative", zIndex: 1 }}>
              {/* Tier legend chips */}
              {activeTiers.length > 0 && (
                <div style={{ display: "flex", gap: 9, marginBlockEnd: 14, flexWrap: "wrap" }}>
                  {activeTiers.map(tr => (
                    <span key={tr.k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9, fontWeight: 500, color: tr.c, letterSpacing: "0.16em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(tr.c, 50)}` }}>
                      <span aria-hidden="true" style={{ inlineSize: 5, blockSize: 5, borderRadius: "50%", background: tr.c, boxShadow: `0 0 5px ${tr.c}` }} />
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9.5, fontVariantNumeric: "tabular-nums" }}>{tierCounts[tr.k]}</span>
                      <span>{tr.n}</span>
                    </span>
                  ))}
                </div>
              )}

              <div
                role="list"
                aria-label="Cuadrícula de insignias"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))",
                  gap: 8,
                  justifyItems: "center",
                }}
              >
                {sortedIds.map((id) => (
                  <div key={id} role="listitem">
                    <AchievementBadge
                      id={id}
                      unlocked={unlocked.includes(id)}
                      recent={unlocked.includes(id) && id === recentId}
                      size={64}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.details>
        );
      })()}

      {(() => {
        const fp = calcNeuralFingerprint(st);
        if (!fp) return null;
        const trendUp = (col) => (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M5 8.5 L5 2 M5 2 L2.2 4.5 M5 2 L7.8 4.5" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
        const trendDown = (col) => (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M5 1.5 L5 8 M5 8 L2.2 5.5 M5 8 L7.8 5.5" stroke={col} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );
        const trendFlat = (col) => (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 5 L8 5" stroke={col} strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
        );
        const lines = [
          { l: "Hora pico", v: `${String(fp.peakHour).padStart(2, "0")}:00`, c: bioSignal.phosphorCyan, suffix: null },
          { l: "Mejor protocolo", v: fp.bestProto, c: ac, suffix: null },
          { l: "Calidad", v: `${fp.avgQuality}%`, c: fp.avgQuality >= 70 ? semantic.success : semantic.warning, suffix: fp.avgQuality >= 70 ? "up" : "flat" },
          { l: "Adaptación", v: fp.adaptationRate > 0 ? `+${fp.adaptationRate}` : `${fp.adaptationRate}`, c: fp.adaptationRate > 0 ? semantic.success : fp.adaptationRate < 0 ? semantic.danger : "rgba(245,245,247,0.50)", suffix: fp.adaptationRate > 0 ? "up" : fp.adaptationRate < 0 ? "down" : "flat" },
        ];
        const fpHash = `${fp.peakHour}-${(fp.bestProto || "").slice(0, 3).toUpperCase()}-${fp.avgQuality}`;
        return (
          <motion.article
            {...enterCascade(4)}
            aria-label="Firma neural"
            style={{
              position: "relative",
              background: `linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.30) 100%)`,
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              borderRadius: 12,
              padding: "12px 14px 13px",
              marginBlockEnd: 14,
              border: `0.5px solid rgba(255,255,255,0.10)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.30), 0 0 0 1px ${withAlpha(bioSignal.phosphorCyan, 14)}, 0 4px 18px rgba(0,0,0,0.30)`,
              overflow: "hidden",
              fontFamily: MONO,
            }}
          >
            {/* Faint CRT-style scanlines bg */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)`, zIndex: 0 }} />
            {/* Top terminal-style header — bracket ⊢ + section ID */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingBlockEnd: 9, marginBlockEnd: 10, borderBlockEnd: `0.5px dashed ${withAlpha(bioSignal.phosphorCyan, 28)}` }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span aria-hidden="true" style={{ color: bioSignal.phosphorCyan, fontSize: 11, fontWeight: 500, lineHeight: 1, textShadow: `0 0 6px ${bioSignal.phosphorCyan}` }}>⊢</span>
                <span style={{ fontSize: 9, fontWeight: 500, color: bioSignal.phosphorCyan, letterSpacing: "0.30em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(bioSignal.phosphorCyan, 50)}` }}>Firma neural</span>
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.16em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
                <span style={{ color: "rgba(245,245,247,0.20)" }}>ID·</span>{fpHash}
              </span>
            </div>

            {/* Console-style key-value lines with dotted leaders */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((d, i) => (
                <div key={i} role="group" aria-label={`${d.l}: ${d.v}`} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 500, color: "rgba(245,245,247,0.55)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>{d.l}</span>
                  <span aria-hidden="true" style={{ flex: 1, blockSize: 1, marginInline: 4, marginBlockStart: 6, background: `repeating-linear-gradient(90deg, transparent 0, transparent 2px, rgba(255,255,255,0.18) 2px, rgba(255,255,255,0.18) 3px)`, alignSelf: "center" }} />
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, fontWeight: 500, color: d.c, letterSpacing: -0.1, fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${withAlpha(d.c, 50)}`, flexShrink: 0, whiteSpace: "nowrap" }}>{d.v}</span>
                  {d.suffix && (
                    <span aria-hidden="true" style={{ display: "inline-flex", marginInlineStart: 2, filter: `drop-shadow(0 0 4px ${withAlpha(d.c, 60)})` }}>
                      {d.suffix === "up" ? trendUp(d.c) : d.suffix === "down" ? trendDown(d.c) : trendFlat(d.c)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom terminal-style closing bracket */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "flex-end", marginBlockStart: 9, paddingBlockStart: 9, borderBlockStart: `0.5px dashed ${withAlpha(bioSignal.phosphorCyan, 18)}` }}>
              <span aria-hidden="true" style={{ color: withAlpha(bioSignal.phosphorCyan, 70), fontSize: 11, fontWeight: 500, lineHeight: 1, textShadow: `0 0 6px ${withAlpha(bioSignal.phosphorCyan, 50)}` }}>⊣</span>
            </div>
          </motion.article>
        );
      })()}

      <motion.div {...enterCascade(5)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBlockEnd: 14 }}>
        {/* V-Cores — currency / rare crystal feel */}
        <article
          aria-label={`V-Cores: ${st.vCores || 0}`}
          style={{
            position: "relative",
            background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${withAlpha(bioSignal.ignition, 16)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            borderRadius: 14,
            padding: "12px 14px 11px",
            border: `0.5px solid rgba(255,255,255,0.10)`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(bioSignal.ignition, 18)}, 0 4px 14px rgba(0,0,0,0.24)`,
            overflow: "hidden",
          }}
        >
          {/* Top corner accent — diamond glyph (custom SVG, NOT Unicode) */}
          <span aria-hidden="true" style={{ position: "absolute", top: 8, right: 8, opacity: 0.55, filter: `drop-shadow(0 0 4px ${bioSignal.ignition})` }}>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 1 L9 5 L5 9 L1 5 Z" stroke={bioSignal.ignition} strokeWidth="1" fill="none" strokeLinejoin="round" />
              <circle cx="5" cy="5" r="1.2" fill={bioSignal.ignition} />
            </svg>
          </span>
          <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: bioSignal.ignition, letterSpacing: "0.26em", textTransform: "uppercase", marginBlockEnd: 6, textShadow: `0 0 6px ${withAlpha(bioSignal.ignition, 50)}` }}>V-Cores</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, filter: `drop-shadow(0 0 10px ${withAlpha(bioSignal.ignition, 40)})` }}>
            <AnimatedNumber value={st.vCores || 0} color={"rgba(245,245,247,0.96)"} size={28} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.18em", textTransform: "uppercase", marginBlockStart: 3 }}>Cristales neurales</div>
        </article>

        {/* Mood — uses custom mood glyphs from /app E13 instead of generic icons */}
        {(() => {
          const moodIdx = avgMood > 0 ? Math.round(avgMood) : 0;
          const moodColor = avgMood > 0 ? (MOODS[moodIdx - 1]?.color || ac) : "rgba(245,245,247,0.30)";
          const moodLabel = avgMood > 0 ? (MOODS[moodIdx - 1]?.label || "—") : "Sin datos";
          // Custom mood glyph SVG by id (mismo set que /app E13)
          const moodGlyph = (id, c, sw) => {
            if (id === 1) return <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10 L4.5 5.5 L6.5 14.5 L9 4 L11 16 L13.5 5.5 L15.5 13.5 L18 10" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
            if (id === 2) return <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 5 Q6 9 10 10.5 Q13.5 12 17.5 14" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/><circle cx="2.5" cy="5" r="1.4" fill={c}/><circle cx="17.5" cy="14" r="1.4" fill={c} opacity="0.45"/></svg>;
            if (id === 3) return <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10 Q5.5 7.5 10 10 T18 10" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/></svg>;
            if (id === 4) return <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.4" fill={c}/><circle cx="10" cy="10" r="5" stroke={c} strokeWidth={sw - 0.4} fill="none" opacity="0.55"/><circle cx="10" cy="10" r="8" stroke={c} strokeWidth={sw - 0.6} fill="none" opacity="0.25"/></svg>;
            if (id === 5) return <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill={c} opacity="0.55"/><circle cx="10" cy="10" r="3.6" stroke={c} strokeWidth={sw - 0.2} fill="none"/><line x1="10" y1="2" x2="10" y2="4" stroke={c} strokeWidth={sw - 0.2} strokeLinecap="round"/><line x1="10" y1="16" x2="10" y2="18" stroke={c} strokeWidth={sw - 0.2} strokeLinecap="round"/><line x1="2" y1="10" x2="4" y2="10" stroke={c} strokeWidth={sw - 0.2} strokeLinecap="round"/><line x1="16" y1="10" x2="18" y2="10" stroke={c} strokeWidth={sw - 0.2} strokeLinecap="round"/></svg>;
            return null;
          };
          return (
            <article
              aria-label={avgMood > 0 ? `Ánimo promedio: ${avgMood} sobre 5` : "Ánimo: sin datos"}
              style={{
                position: "relative",
                background: avgMood > 0 ? `radial-gradient(ellipse 90% 70% at 50% 0%, ${withAlpha(moodColor, 16)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)` : `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                borderRadius: 14,
                padding: "12px 14px 11px",
                border: `0.5px solid rgba(255,255,255,0.10)`,
                boxShadow: avgMood > 0 ? `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(moodColor, 18)}, 0 4px 14px rgba(0,0,0,0.24)` : `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.20)`,
                overflow: "hidden",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: avgMood > 0 ? moodColor : "rgba(245,245,247,0.45)", letterSpacing: "0.26em", textTransform: "uppercase", marginBlockEnd: 6, textShadow: avgMood > 0 ? `0 0 6px ${withAlpha(moodColor, 50)}` : "none" }}>Mood</div>
              {avgMood > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span aria-hidden="true" style={{ display: "inline-flex", flexShrink: 0, filter: `drop-shadow(0 0 6px ${withAlpha(moodColor, 60)})` }}>{moodGlyph(moodIdx, moodColor, 1.6)}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 22, fontWeight: 200, lineHeight: 1, letterSpacing: -0.8, color: "rgba(245,245,247,0.96)", fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${withAlpha(moodColor, 40)}` }}>{avgMood}</span>
                    <span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: moodColor, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{moodLabel}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ display: "inline-flex", flexShrink: 0, opacity: 0.42 }}>{moodGlyph(3, "rgba(245,245,247,0.30)", 1.4)}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Sin datos</span>
                </div>
              )}
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.18em", textTransform: "uppercase", marginBlockStart: 3 }}>Promedio 7 días</div>
            </article>
          );
        })()}
      </motion.div>

      {(() => {
        const ot = suggestOptimalTime(st);
        if (!ot || !ot.best) return null;
        const peakH = ot.best.hour;
        return (
          <motion.article
            {...enterCascade(6)}
            aria-label="Hora óptima para entrenar"
            style={{
              position: "relative",
              background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${withAlpha(bioSignal.phosphorCyan, 12)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              borderRadius: 16,
              padding: "13px 14px 14px",
              marginBlockEnd: 14,
              border: `0.5px solid rgba(255,255,255,0.10)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(bioSignal.phosphorCyan, 14)}, 0 4px 16px rgba(0,0,0,0.26)`,
              overflow: "hidden",
            }}
          >
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBlockEnd: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
                  <motion.span animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }} transition={reduced ? {} : { duration: 2.6, repeat: Infinity, ease: "easeOut" }} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: bioSignal.phosphorCyan }} />
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${bioSignal.phosphorCyan} 55%, ${bioSignal.phosphorCyan} 100%)`, boxShadow: `0 0 6px ${bioSignal.phosphorCyan}` }} />
                </span>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: bioSignal.phosphorCyan, letterSpacing: "0.30em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(bioSignal.phosphorCyan, 50)}` }}>Hora óptima</span>
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14, fontWeight: 500, color: "rgba(245,245,247,0.96)", letterSpacing: -0.4, fontVariantNumeric: "tabular-nums", textShadow: `0 0 8px ${withAlpha(bioSignal.phosphorCyan, 50)}` }}>{String(peakH).padStart(2, "0")}:00</span>
            </header>
            {/* 24h horizontal timeline with peak marker */}
            <div aria-hidden="true" style={{ position: "relative", blockSize: 24, marginBlockEnd: 12 }}>
              {/* Track base */}
              <div style={{ position: "absolute", top: 11, left: 0, right: 0, height: 2, borderRadius: 99, background: `linear-gradient(90deg, ${withAlpha(bioSignal.neuralViolet, 30)} 0%, ${withAlpha(bioSignal.phosphorCyan, 40)} 25%, ${withAlpha(bioSignal.ignition, 50)} 50%, ${withAlpha(bioSignal.phosphorCyan, 40)} 75%, ${withAlpha(bioSignal.neuralViolet, 30)} 100%)` }} />
              {/* 24 hour ticks */}
              {Array.from({ length: 24 }).map((_, i) => {
                const isPeak = i === peakH;
                const isMajor = i % 6 === 0;
                return (
                  <span key={i} style={{ position: "absolute", left: `${(i / 23) * 100}%`, top: isPeak ? 4 : 8, transform: "translateX(-50%)", inlineSize: isPeak ? 2 : 1, blockSize: isPeak ? 16 : isMajor ? 6 : 4, background: isPeak ? bioSignal.phosphorCyan : isMajor ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.14)", borderRadius: 1, boxShadow: isPeak ? `0 0 8px ${bioSignal.phosphorCyan}, 0 0 3px ${bioSignal.phosphorCyan}` : "none" }} />
                );
              })}
              {/* Peak marker label */}
              <span style={{ position: "absolute", top: -2, left: `${(peakH / 23) * 100}%`, transform: "translateX(-50%)", fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: bioSignal.phosphorCyan, letterSpacing: "0.10em", textTransform: "uppercase", textShadow: `0 0 6px ${bioSignal.phosphorCyan}`, whiteSpace: "nowrap" }}>Peak</span>
            </div>
            {/* Hour scale labels */}
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: 10, fontFamily: MONO, fontSize: 7.5, fontWeight: 500, color: "rgba(245,245,247,0.42)", letterSpacing: "0.18em", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
              <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 400, color: "rgba(245,245,247,0.66)", lineHeight: 1.45, letterSpacing: -0.05, margin: 0 }}>{ot.recommendation}</p>
          </motion.article>
        );
      })()}

      {(() => {
        const sc = analyzeStreakChain(st);
        if (!sc) return null;
        const maxVal = Math.max(sc.maxStreak, sc.avgStreak, sc.avgBreakPoint, 1);
        const metrics = [
          { v: sc.maxStreak, l: "Récord", c: bioSignal.ignition, k: "rec" },
          { v: sc.avgStreak, l: "Promedio", c: bioSignal.phosphorCyan, k: "avg" },
          { v: sc.avgBreakPoint, l: "Quiebre", c: bioSignal.neuralViolet, k: "qui" },
        ];
        return (
          <motion.article
            {...enterCascade(7)}
            aria-label="Análisis de rachas"
            style={{
              position: "relative",
              background: `radial-gradient(ellipse 90% 60% at 100% 0%, ${withAlpha(bioSignal.ignition, 12)} 0%, transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
              backdropFilter: "blur(20px) saturate(150%)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              borderRadius: 16,
              padding: "13px 14px 14px",
              marginBlockEnd: 14,
              border: `0.5px solid rgba(255,255,255,0.10)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(bioSignal.ignition, 14)}, 0 4px 16px rgba(0,0,0,0.26)`,
              overflow: "hidden",
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: 7, marginBlockEnd: 14 }}>
              <span aria-hidden="true" style={{ display: "inline-flex", filter: `drop-shadow(0 0 5px ${withAlpha(bioSignal.ignition, 70)})` }}>
                <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
                  <path d="M5.5 12 Q1 9 1 5.5 Q1 2 4 1 Q4 3.5 5.5 4.5 Q7 3 7 1.5 Q9 2.5 10 5 Q10 9 5.5 12 Z" fill={bioSignal.ignition} opacity="0.85" />
                </svg>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: bioSignal.ignition, letterSpacing: "0.30em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(bioSignal.ignition, 50)}` }}>Análisis de rachas</span>
            </header>
            {/* Triad: 3 vertical bars proportional to value */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "end", marginBlockEnd: 14, blockSize: 76 }}>
              {metrics.map((m, i) => {
                const pct = (m.v / maxVal) * 100;
                return (
                  <div key={m.k} role="group" aria-label={`${m.l}: ${m.v} días`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, blockSize: "100%", justifyContent: "flex-end" }}>
                    {/* Number above bar */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 18, fontWeight: 200, lineHeight: 1, letterSpacing: -0.6, color: m.c, fontVariantNumeric: "tabular-nums", textShadow: `0 0 10px ${withAlpha(m.c, 50)}` }}>{m.v}</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: withAlpha(m.c, 80), letterSpacing: 0 }}>d</span>
                    </div>
                    {/* Vertical bar */}
                    <motion.div
                      initial={reduced ? { height: `${pct}%` } : { height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={reduced ? { duration: 0 } : { duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        inlineSize: 18,
                        minBlockSize: 4,
                        borderRadius: 99,
                        background: `linear-gradient(180deg, ${m.c} 0%, ${m.c}80 100%)`,
                        boxShadow: `0 0 10px ${withAlpha(m.c, 60)}, inset 0 1px 0 rgba(255,255,255,0.30)`,
                      }}
                    />
                    {/* Label below bar */}
                    <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: m.c, letterSpacing: "0.16em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(m.c, 50)}` }}>{m.l}</span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 12, fontWeight: 400, color: "rgba(245,245,247,0.66)", lineHeight: 1.45, letterSpacing: -0.05, margin: 0, paddingBlockStart: 10, borderBlockStart: `0.5px solid rgba(255,255,255,0.06)` }}>{sc.prediction}</p>
          </motion.article>
        );
      })()}

      <motion.div
        {...enterCascade(8)}
        role="group"
        aria-label="Acciones de perfil"
        style={{
          position: "relative",
          background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          borderRadius: 16,
          border: `0.5px solid rgba(255,255,255,0.10)`,
          marginBlockEnd: 14,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.04)`,
          overflow: "hidden",
        }}
      >
        {[
          { label: "Ajustes", caption: "Preferencias · Audio · Háptica", iconName: "gear", onClick: onShowSettings, ariaLabel: "Abrir ajustes", color: bioSignal.phosphorCyan },
          { label: "Historial", caption: "Sesiones · Calidad · Deltas", iconName: "clock", onClick: onShowHist, ariaLabel: "Abrir historial de sesiones", color: bioSignal.neuralViolet },
        ].map((item, idx) => (
          <motion.button
            key={item.label}
            whileTap={reduced ? {} : { scale: 0.985 }}
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              inlineSize: "100%",
              padding: "13px 14px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderBlockStart: idx > 0 ? `0.5px solid rgba(255,255,255,0.06)` : "none",
              textAlign: "left",
              fontFamily: "inherit",
              position: "relative",
            }}
          >
            {/* Icon tile glass with accent */}
            <div
              aria-hidden="true"
              style={{
                position: "relative",
                inlineSize: 34,
                blockSize: 34,
                borderRadius: 10,
                background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${withAlpha(item.color, 22)} 0%, ${withAlpha(item.color, 8)} 100%)`,
                border: `0.5px solid ${withAlpha(item.color, 32)}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 0 10px ${withAlpha(item.color, 18)}, 0 0 0 1px rgba(0,0,0,0.20)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ filter: `drop-shadow(0 0 5px ${withAlpha(item.color, 70)})` }}>
                <Icon name={item.iconName} size={15} color={item.color} aria-hidden="true" />
              </span>
            </div>
            {/* Label + caption stack */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(245,245,247,0.96)", letterSpacing: -0.2, lineHeight: 1.15 }}>{item.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.45)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.caption}</span>
            </div>
            {/* Right chevron */}
            <span aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55, filter: `drop-shadow(0 0 3px ${withAlpha(item.color, 50)})`, color: item.color }}>
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={item.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </span>
          </motion.button>
        ))}
      </motion.div>
      <motion.div {...enterCascade(9)} style={{ marginBlockEnd: 10 }}>
        <InstrumentDueCard isDark={isDark} ac={ac} />
      </motion.div>

      {/* RESEARCH BENTO — featured Informe trimestral (hero) + secondary pair (Biblioteca / Aprende) */}
      {(() => {
        const Q = Math.floor((new Date().getMonth() / 3)) + 1;
        const yr = new Date().getFullYear();
        return (
          <motion.div
            aria-label="Ciencia y resultados"
            role="region"
            {...enterCascade(10)}
            style={{ marginBlockEnd: 10, display: "flex", flexDirection: "column", gap: 8 }}
          >
            {/* HERO — Informe trimestral (featured cyan) */}
            <Link
              href="/reporte"
              aria-label="Ver informe trimestral"
              className="bi-row-link"
              style={{
                position: "relative",
                display: "block",
                background: `radial-gradient(ellipse 80% 130% at 100% 50%, ${withAlpha(ac, 16)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)`,
                backdropFilter: "blur(22px) saturate(150%)",
                WebkitBackdropFilter: "blur(22px) saturate(150%)",
                border: `0.5px solid rgba(255,255,255,0.10)`,
                borderRadius: 18,
                padding: "16px 16px 14px 16px",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(ac, 22)}, 0 8px 26px rgba(0,0,0,0.32), 0 0 22px ${withAlpha(ac, 10)}`,
                overflow: "hidden",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {/* Insignia — quarterly disc with 4 segments rotating */}
              <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: -14, insetBlockStart: -14, inlineSize: 130, blockSize: 130, opacity: 0.85, pointerEvents: "none" }}>
                <svg viewBox="0 0 130 130" width="130" height="130">
                  <defs>
                    <radialGradient id="qDiscGlow" cx="50%" cy="50%">
                      <stop offset="0%" stopColor={withAlpha(ac, 28)} />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  <circle cx="65" cy="65" r="55" fill="url(#qDiscGlow)" />
                  {/* Outer ring */}
                  <circle cx="65" cy="65" r="42" fill="none" stroke={withAlpha(ac, 35)} strokeWidth="0.5" />
                  <circle cx="65" cy="65" r="50" fill="none" stroke={withAlpha(ac, 18)} strokeWidth="0.5" strokeDasharray="2 4" />
                  {/* 4 quarter ticks (90 days = 4 weeks each) */}
                  {[0, 90, 180, 270].map((deg, i) => {
                    const rad = (deg - 90) * Math.PI / 180;
                    const x1 = 65 + Math.cos(rad) * 38;
                    const y1 = 65 + Math.sin(rad) * 38;
                    const x2 = 65 + Math.cos(rad) * 46;
                    const y2 = 65 + Math.sin(rad) * 46;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ac} strokeWidth="1.2" strokeLinecap="round" opacity={i === Q - 1 ? 1 : 0.35} />;
                  })}
                  {/* Active quarter arc */}
                  <path d={`M 65 23 A 42 42 0 0 1 ${65 + Math.cos((Q * 90 - 90) * Math.PI / 180) * 42} ${65 + Math.sin((Q * 90 - 90) * Math.PI / 180) * 42}`} stroke={ac} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
                  {/* Center dot */}
                  <circle cx="65" cy="65" r="2.5" fill={ac} />
                  <circle cx="65" cy="65" r="6" fill="none" stroke={withAlpha(ac, 55)} strokeWidth="0.8" />
                </svg>
              </span>

              {/* Content stack */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, paddingInlineEnd: 70 }}>
                {/* Eyebrow row: pulse + meta */}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
                    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%)`, boxShadow: `0 0 6px ${ac}` }} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 500, color: ac, letterSpacing: "0.24em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(ac, 50)}` }}>
                    Reporte · Q{Q} · {yr}
                  </span>
                </span>
                {/* Title display */}
                <span style={{ fontSize: 19, fontWeight: 300, color: "rgba(245,245,247,0.96)", letterSpacing: -0.65, lineHeight: 1.05 }}>
                  Informe trimestral
                </span>
                {/* Caption */}
                <span style={{ fontSize: 11.5, fontWeight: 400, color: "rgba(245,245,247,0.55)", letterSpacing: 0, lineHeight: 1.4, maxInlineSize: 280 }}>
                  Sesiones, HRV, ánimo y escalas validadas · 90 días
                </span>
                {/* CTA inline mono caps */}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBlockStart: 4 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 500, color: ac, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                    Generar
                  </span>
                  <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                    <path d="M2 5.5 L8 5.5 M5.5 3 L8 5.5 L5.5 8" stroke={ac} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* SECONDARY PAIR — Biblioteca de evidencia · Aprende */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {/* Biblioteca de evidencia (violet) */}
              <Link
                href="/evidencia"
                aria-label="Biblioteca de evidencia científica"
                className="bi-row-link"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  background: `radial-gradient(ellipse 80% 100% at 0% 0%, ${withAlpha("#8B5CF6", 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                  backdropFilter: "blur(20px) saturate(150%)",
                  WebkitBackdropFilter: "blur(20px) saturate(150%)",
                  border: `0.5px solid rgba(255,255,255,0.08)`,
                  borderRadius: 14,
                  padding: "12px 12px 11px 12px",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha("#8B5CF6", 16)}, 0 4px 16px rgba(0,0,0,0.26)`,
                  overflow: "hidden",
                  textDecoration: "none",
                  cursor: "pointer",
                  minBlockSize: 110,
                }}
              >
                {/* Custom SVG: peer-review hex lattice (3 nodes connected) */}
                <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 8, insetBlockStart: 8, opacity: 0.9 }}>
                  <svg width="34" height="34" viewBox="0 0 34 34">
                    {/* 3 nodes in triangle */}
                    <line x1="17" y1="8" x2="9" y2="22" stroke={withAlpha("#8B5CF6", 60)} strokeWidth="0.8" />
                    <line x1="17" y1="8" x2="25" y2="22" stroke={withAlpha("#8B5CF6", 60)} strokeWidth="0.8" />
                    <line x1="9" y1="22" x2="25" y2="22" stroke={withAlpha("#8B5CF6", 45)} strokeWidth="0.8" strokeDasharray="2 2" />
                    <circle cx="17" cy="8" r="3" fill="#8B5CF6" opacity="0.9" />
                    <circle cx="17" cy="8" r="5" fill="none" stroke={withAlpha("#8B5CF6", 55)} strokeWidth="0.5" />
                    <circle cx="9" cy="22" r="2.4" fill="#8B5CF6" opacity="0.7" />
                    <circle cx="25" cy="22" r="2.4" fill="#8B5CF6" opacity="0.7" />
                  </svg>
                </span>
                <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: "#8B5CF6", letterSpacing: "0.22em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha("#8B5CF6", 50)}` }}>
                  Evidencia
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(245,245,247,0.94)", letterSpacing: -0.25, lineHeight: 1.18, marginBlockStart: "auto" }}>
                  Biblioteca de evidencia
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 400, color: "rgba(245,245,247,0.50)", lineHeight: 1.3 }}>
                  Estudios y mecanismos detrás de cada protocolo
                </span>
              </Link>

              {/* Aprende (amber) */}
              <Link
                href="/learn"
                aria-label="Artículos de fundamentos"
                className="bi-row-link"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  background: `radial-gradient(ellipse 80% 100% at 0% 0%, ${withAlpha("#F59E0B", 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                  backdropFilter: "blur(20px) saturate(150%)",
                  WebkitBackdropFilter: "blur(20px) saturate(150%)",
                  border: `0.5px solid rgba(255,255,255,0.08)`,
                  borderRadius: 14,
                  padding: "12px 12px 11px 12px",
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha("#F59E0B", 16)}, 0 4px 16px rgba(0,0,0,0.26)`,
                  overflow: "hidden",
                  textDecoration: "none",
                  cursor: "pointer",
                  minBlockSize: 110,
                }}
              >
                {/* Custom SVG: ignition burst — 6 rays from core (knowledge ignite) */}
                <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 8, insetBlockStart: 8, opacity: 0.9 }}>
                  <svg width="34" height="34" viewBox="0 0 34 34">
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                      const rad = (deg - 90) * Math.PI / 180;
                      const x1 = 17 + Math.cos(rad) * 6;
                      const y1 = 17 + Math.sin(rad) * 6;
                      const x2 = 17 + Math.cos(rad) * 13;
                      const y2 = 17 + Math.sin(rad) * 13;
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" opacity={0.55 + (i % 2) * 0.25} />;
                    })}
                    <circle cx="17" cy="17" r="3.5" fill="#F59E0B" />
                    <circle cx="17" cy="17" r="6" fill="none" stroke={withAlpha("#F59E0B", 50)} strokeWidth="0.6" />
                  </svg>
                </span>
                <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 500, color: "#F59E0B", letterSpacing: "0.22em", textTransform: "uppercase", textShadow: `0 0 5px ${withAlpha("#F59E0B", 50)}` }}>
                  Fundamentos
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(245,245,247,0.94)", letterSpacing: -0.25, lineHeight: 1.18, marginBlockStart: "auto" }}>
                  Aprende
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 400, color: "rgba(245,245,247,0.50)", lineHeight: 1.3 }}>
                  HRV, cronotipo, respiración resonante · con citas
                </span>
              </Link>
            </div>
          </motion.div>
        );
      })()}

      <motion.div {...enterCascade(11)} style={{ marginBlockEnd: 10 }}>
        <RemindersCard isDark={isDark} ac={ac} />
      </motion.div>
      {(onShowChronotype || onShowResonance || onShowNOM035) && (() => {
        const lastNom = (st.nom035Results || []).slice(-1)[0];
        const plates = [
          onShowChronotype && {
            key: "chrono",
            color: "#D97706",
            category: "Cronotipo · MEQ-SA",
            title: "Cronotipo",
            caption: "5 preguntas · ritmo circadiano",
            calibrated: !!st.chronotype,
            valueText: st.chronotype?.label || null,
            ariaLabel: "Test de cronotipo MEQ-SA",
            onClick: onShowChronotype,
            // Sun-moon dial SVG: arc gradient amber→violet (sunrise → night), sun yellow + moon violet, always colored
            renderGlyph: (active) => (
              <svg width="48" height="48" viewBox="0 0 48 48">
                <defs>
                  <linearGradient id="chronoArcG" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="100%" stopColor="#A78BFA" />
                  </linearGradient>
                </defs>
                {/* Half-arc dial (sunrise → sunset → night) — gradient always */}
                <path d="M 8 30 A 16 16 0 0 1 40 30" fill="none" stroke="url(#chronoArcG)" strokeWidth="1.6" strokeLinecap="round" opacity={active ? 1 : 0.85} />
                {/* Outer dashed echo arc */}
                <path d="M 6 30 A 18 18 0 0 1 42 30" fill="none" stroke="rgba(252,211,77,0.32)" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="2 2" />
                {/* Sun glyph (left/morning) — yellow with white core */}
                <circle cx="8" cy="30" r="3" fill="#FCD34D" stroke="#fff" strokeWidth="0.6" />
                {[0, 45, 90, 135].map((d, i) => {
                  const r = (d - 90) * Math.PI / 180;
                  return <line key={i} x1={8 + Math.cos(r) * 4.2} y1={30 + Math.sin(r) * 4.2} x2={8 + Math.cos(r) * 6} y2={30 + Math.sin(r) * 6} stroke="#FCD34D" strokeWidth="0.8" strokeLinecap="round" opacity="0.95" />;
                })}
                {/* Moon glyph (right/night) — violet crescent with white border */}
                <path d="M 38 27 A 3.2 3.2 0 1 0 41.5 30.5 A 2.6 2.6 0 0 1 38 27 Z" fill="#A78BFA" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" />
                {/* Position marker on arc — varies if calibrated */}
                {active && (() => {
                  const angle = 180 + ((st.chronotype?.score || 50) / 100) * 180;
                  const rad = (angle - 180) * Math.PI / 180;
                  const x = 24 + Math.cos(rad - Math.PI) * 16;
                  const y = 30 + Math.sin(rad - Math.PI) * 16;
                  return (
                    <>
                      <circle cx={x} cy={y} r="3.2" fill="#fff" />
                      <circle cx={x} cy={y} r="5.2" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
                    </>
                  );
                })()}
                {/* Horizon line */}
                <line x1="6" y1="30" x2="42" y2="30" stroke="rgba(252,211,77,0.28)" strokeWidth="0.5" strokeDasharray="1 2" />
              </svg>
            ),
          },
          onShowResonance && {
            key: "reson",
            color: "#6366F1",
            category: "Resonancia · BLE",
            title: "Frecuencia Resonante",
            caption: "5 ensayos · máximo HRV",
            calibrated: !!st.resonanceFreq,
            valueText: st.resonanceFreq ? `${st.resonanceFreq} rpm` : null,
            ariaLabel: "Calibrar frecuencia resonante con sensor de HR",
            onClick: onShowResonance,
            // Sine breath wave SVG with peak marker — always indigo gradient
            renderGlyph: (active) => (
              <svg width="48" height="48" viewBox="0 0 48 48">
                <defs>
                  <linearGradient id="resonWaveG" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#A5B4FC" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                {/* Primary wave — indigo always */}
                <path
                  d="M 4 24 Q 12 12, 18 24 T 30 24 T 44 24"
                  fill="none"
                  stroke="url(#resonWaveG)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity={active ? 1 : 0.85}
                />
                {/* Secondary echo wave (offset down) */}
                <path
                  d="M 4 32 Q 12 26, 18 32 T 30 32 T 44 32"
                  fill="none"
                  stroke="rgba(165,180,252,0.40)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeDasharray="1 2"
                />
                {/* Peak marker dot — white core with indigo glow when calibrated */}
                {active ? (
                  <>
                    <circle cx="12" cy="13" r="2.4" fill="#fff" stroke="#6366F1" strokeWidth="0.8" />
                    <circle cx="12" cy="13" r="4.5" fill="none" stroke="#A5B4FC" strokeWidth="0.6" opacity="0.5" />
                  </>
                ) : (
                  <circle cx="12" cy="13" r="1.8" fill="#A5B4FC" opacity="0.85" stroke="#fff" strokeWidth="0.4" />
                )}
                {/* Center axis tick */}
                <line x1="24" y1="6" x2="24" y2="42" stroke="rgba(99,102,241,0.25)" strokeWidth="0.5" strokeDasharray="1 2" />
              </svg>
            ),
          },
          onShowNOM035 && {
            key: "nom",
            color: "#EF4444",
            category: "NOM-035 · Guía II",
            title: "Riesgo psicosocial",
            caption: "46 ítems oficiales",
            calibrated: !!lastNom,
            valueText: lastNom ? lastNom.level?.label || "—" : null,
            ariaLabel: "Evaluación NOM-035",
            onClick: onShowNOM035,
            // Shield: RED fill + WHITE border (always colored), risk fill bands inside
            renderGlyph: (active) => {
              const level = lastNom?.level?.score ?? null;
              const fillPct = level !== null ? Math.max(0, Math.min(1, 1 - level / 4)) : 0;
              return (
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <defs>
                    <clipPath id="shieldClipG">
                      <path d="M 24 6 L 38 12 L 38 26 Q 38 36, 24 42 Q 10 36, 10 26 L 10 12 Z" />
                    </clipPath>
                    <linearGradient id="shieldFillG" x1="50%" x2="50%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity="0.85" />
                    </linearGradient>
                  </defs>
                  {/* Inner shield filled with red gradient (always) */}
                  <path
                    d="M 24 6 L 38 12 L 38 26 Q 38 36, 24 42 Q 10 36, 10 26 L 10 12 Z"
                    fill="url(#shieldFillG)"
                    stroke="#fff"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    opacity={active ? 1 : 0.95}
                  />
                  {/* Outer dashed echo — white */}
                  <path
                    d="M 24 4 L 40 11 L 40 26 Q 40 37, 24 44 Q 8 37, 8 26 L 8 11 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.30)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    strokeLinejoin="round"
                  />
                  {/* Risk-level fill (rises from bottom; fuller = lower risk) — bright red overlay when calibrated */}
                  {active && level !== null && (
                    <rect
                      x="10"
                      y={42 - fillPct * 36}
                      width="28"
                      height={fillPct * 36}
                      fill="rgba(255,255,255,0.18)"
                      clipPath="url(#shieldClipG)"
                    />
                  )}
                  {/* Tick lines inside (4 risk bands) — white */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="14"
                      y1={14 + i * 7}
                      x2="34"
                      y2={14 + i * 7}
                      stroke="rgba(255,255,255,0.30)"
                      strokeWidth="0.4"
                      strokeDasharray="1 2"
                      clipPath="url(#shieldClipG)"
                    />
                  ))}
                  {/* Center checkmark when calibrated — white */}
                  {active && (
                    <path d="M 19 24 L 23 28 L 30 19" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  )}
                </svg>
              );
            },
          },
        ].filter(Boolean);
        const calibratedCount = plates.filter((p) => p.calibrated).length;

        return (
          <motion.section
            aria-label="Perfil bioneural"
            {...enterCascade(12)}
            style={{ marginBlockEnd: 10 }}
          >
            {/* Header — eyebrow with calibration count */}
            <header style={{ display: "flex", flexDirection: "column", gap: 3, marginBlockEnd: 10, paddingInlineStart: 4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block" }}>
                  <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%)`, boxShadow: `0 0 6px ${ac}` }} />
                </span>
                <span style={{
                  fontFamily: MONO,
                  fontSize: 8.5,
                  fontWeight: 500,
                  color: "rgba(245,245,247,0.55)",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}>
                  Bioneural · {calibratedCount}/{plates.length} calibradas
                </span>
              </span>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "rgba(245,245,247,0.94)", letterSpacing: -0.3, lineHeight: 1.15, margin: 0 }}>
                Perfil bioneural
              </h3>
            </header>

            {/* Plates — 3 separate glass cards, asymmetric layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plates.map((p) => (
                <motion.button
                  key={p.key}
                  onClick={p.onClick}
                  aria-label={p.ariaLabel}
                  whileTap={reduced ? {} : { scale: 0.985 }}
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    columnGap: 12,
                    alignItems: "center",
                    inlineSize: "100%",
                    minBlockSize: 64,
                    padding: "10px 14px 10px 10px",
                    background: p.calibrated
                      ? `radial-gradient(ellipse 70% 100% at 0% 50%, ${withAlpha(p.color, 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`
                      : `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
                    backdropFilter: "blur(20px) saturate(150%)",
                    WebkitBackdropFilter: "blur(20px) saturate(150%)",
                    border: `0.5px solid rgba(255,255,255,${p.calibrated ? 0.10 : 0.07})`,
                    borderRadius: 14,
                    boxShadow: p.calibrated
                      ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(p.color, 18)}, 0 4px 16px rgba(0,0,0,0.26)`
                      : `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 14px rgba(0,0,0,0.22)`,
                    cursor: "pointer",
                    textAlign: "start",
                    overflow: "hidden",
                    fontFamily: "inherit",
                  }}
                >
                  {/* Custom bio-glyph SVG — always colored */}
                  <span aria-hidden="true" style={{ flexShrink: 0, opacity: 1, filter: `drop-shadow(0 0 6px ${withAlpha(p.color, p.calibrated ? 50 : 30)})` }}>
                    {p.renderGlyph(p.calibrated)}
                  </span>

                  {/* Identity stack */}
                  <span style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{
                      fontFamily: MONO,
                      fontSize: 8,
                      fontWeight: 500,
                      color: p.calibrated ? p.color : "rgba(245,245,247,0.40)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      textShadow: p.calibrated ? `0 0 5px ${withAlpha(p.color, 50)}` : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {p.category}
                    </span>
                    <span style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "rgba(245,245,247,0.94)",
                      letterSpacing: -0.25,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {p.title}
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 400,
                      color: "rgba(245,245,247,0.48)",
                      lineHeight: 1.3,
                    }}>
                      {p.caption}
                    </span>
                  </span>

                  {/* State-aware right column: value badge + chevron OR pulse "Calibrar" */}
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {p.calibrated ? (
                      <span style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: 500,
                        color: p.color,
                        letterSpacing: "0.06em",
                        paddingInline: 8,
                        paddingBlock: 3,
                        background: withAlpha(p.color, 14),
                        border: `0.5px solid ${withAlpha(p.color, 30)}`,
                        borderRadius: 99,
                        whiteSpace: "nowrap",
                        textShadow: `0 0 6px ${withAlpha(p.color, 50)}`,
                      }}>
                        {p.valueText}
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: MONO,
                        fontSize: 8.5,
                        fontWeight: 500,
                        color: "rgba(245,245,247,0.55)",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                      }}>
                        <span aria-hidden="true" style={{
                          inlineSize: 4,
                          blockSize: 4,
                          borderRadius: "50%",
                          background: "rgba(245,245,247,0.40)",
                          animation: reduced ? "none" : "shimDot 2.4s ease-in-out infinite",
                        }} />
                        Calibrar
                      </span>
                    )}
                    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                      <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={p.calibrated ? p.color : "rgba(245,245,247,0.40)"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={p.calibrated ? 0.85 : 0.6} />
                    </svg>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        );
      })()}

      <motion.div {...enterCascade(13)}>
        <BaselineCard st={st} isDark={isDark} ac={ac} onRecalibrate={onShowCalibration} />
      </motion.div>

      {st.neuralBaseline && (
        <motion.button
          {...enterCascade(14)}
          whileTap={reduced ? {} : { scale: 0.985 }}
          onClick={onShowCalibration}
          aria-label="Recalibrar baseline neural"
          style={{
            position: "relative",
            inlineSize: "100%",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            columnGap: 12,
            alignItems: "center",
            paddingBlock: 12,
            paddingInline: "12px 16px",
            borderRadius: 14,
            border: `0.5px solid ${withAlpha(ac, 30)}`,
            background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${withAlpha(ac, 12)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(ac, 14)}, 0 4px 14px rgba(0,0,0,0.24)`,
            cursor: "pointer",
            marginBlockEnd: 8,
            textAlign: "start",
            fontFamily: "inherit",
            overflow: "hidden",
          }}
        >
          {/* Custom radar/sweep SVG glyph */}
          <span aria-hidden="true" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${withAlpha(ac, 40)})` }}>
            <svg width="36" height="36" viewBox="0 0 36 36">
              <defs>
                <radialGradient id="sweepCore" cx="50%" cy="50%">
                  <stop offset="0%" stopColor={withAlpha(ac, 50)} />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <linearGradient id="sweepArc" x1="0%" x2="100%">
                  <stop offset="0%" stopColor={ac} stopOpacity="0" />
                  <stop offset="100%" stopColor={ac} />
                </linearGradient>
              </defs>
              {/* outer dashed ring */}
              <circle cx="18" cy="18" r="14" fill="none" stroke={withAlpha(ac, 22)} strokeWidth="0.5" strokeDasharray="2 3" />
              {/* mid ring */}
              <circle cx="18" cy="18" r="9" fill="none" stroke={withAlpha(ac, 35)} strokeWidth="0.6" />
              {/* sweep arc (rotating gradient feel) */}
              <path d="M 18 18 L 18 4 A 14 14 0 0 1 30 12 Z" fill="url(#sweepArc)" opacity="0.55" />
              {/* center pulse */}
              <circle cx="18" cy="18" r="1.6" fill="#fff" />
              <circle cx="18" cy="18" r="3.5" fill="url(#sweepCore)" />
              {/* cardinal ticks */}
              {[0, 90, 180, 270].map((deg, i) => {
                const r = (deg - 90) * Math.PI / 180;
                return <line key={i} x1={18 + Math.cos(r) * 11} y1={18 + Math.sin(r) * 11} x2={18 + Math.cos(r) * 14} y2={18 + Math.sin(r) * 14} stroke={withAlpha(ac, 60)} strokeWidth="0.6" strokeLinecap="round" />;
              })}
            </svg>
          </span>

          {/* Identity stack */}
          <span style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{
              fontFamily: MONO,
              fontSize: 8,
              fontWeight: 500,
              color: ac,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              textShadow: `0 0 5px ${withAlpha(ac, 50)}`,
            }}>
              Mantenimiento · 60s
            </span>
            <span style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(245,245,247,0.94)",
              letterSpacing: -0.25,
              lineHeight: 1.2,
            }}>
              Recalibrar baseline neural
            </span>
          </span>

          {/* Right CTA cap */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{
              fontFamily: MONO,
              fontSize: 8.5,
              fontWeight: 500,
              color: ac,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}>
              Iniciar
            </span>
            <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
              <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={ac} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
        </motion.button>
      )}
      <motion.button
        {...enterCascade(15)}
        whileTap={reduced ? {} : { scale: 0.985 }}
        onClick={() => {
          if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos?")) {
            setSt({ ...DS, weekNum: getWeekNum() });
          }
        }}
        aria-label="Reiniciar todos los datos"
        style={{
          position: "relative",
          inlineSize: "100%",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          columnGap: 12,
          alignItems: "center",
          paddingBlock: 12,
          paddingInline: "12px 16px",
          borderRadius: 14,
          border: `0.5px solid ${withAlpha(semantic.danger, 40)}`,
          background: `radial-gradient(ellipse 60% 100% at 0% 50%, ${withAlpha(semantic.danger, 14)} 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(20px) saturate(150%)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${withAlpha(semantic.danger, 22)}, 0 4px 14px rgba(0,0,0,0.24)`,
          cursor: "pointer",
          textAlign: "start",
          fontFamily: "inherit",
          overflow: "hidden",
        }}
      >
        {/* Custom warning triangle SVG glyph — red gradient + white border + exclamation */}
        <span aria-hidden="true" style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${withAlpha(semantic.danger, 50)})` }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <defs>
              <linearGradient id="warnTriG" x1="50%" x2="50%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            {/* Outer dashed echo triangle */}
            <path d="M 18 3 L 34 32 L 2 32 Z" fill="none" stroke="rgba(248,113,113,0.30)" strokeWidth="0.5" strokeDasharray="2 2" strokeLinejoin="round" />
            {/* Filled triangle red gradient + white border */}
            <path d="M 18 6 L 32 30 L 4 30 Z" fill="url(#warnTriG)" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
            {/* Exclamation: vertical bar + dot, white */}
            <line x1="18" y1="14" x2="18" y2="22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="18" cy="26.5" r="1.3" fill="#fff" />
          </svg>
        </span>

        {/* Identity stack */}
        <span style={{ minInlineSize: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{
            fontFamily: MONO,
            fontSize: 8,
            fontWeight: 500,
            color: semantic.danger,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textShadow: `0 0 5px ${withAlpha(semantic.danger, 50)}`,
          }}>
            Acción destructiva · irreversible
          </span>
          <span style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "rgba(245,245,247,0.94)",
            letterSpacing: -0.25,
            lineHeight: 1.2,
          }}>
            Reiniciar datos
          </span>
        </span>

        {/* Right CTA cap */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{
            fontFamily: MONO,
            fontSize: 8.5,
            fontWeight: 500,
            color: semantic.danger,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textShadow: `0 0 5px ${withAlpha(semantic.danger, 40)}`,
          }}>
            Ejecutar
          </span>
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <path d="M3.5 1.5 L7.5 5.5 L3.5 9.5" stroke={semantic.danger} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      </motion.button>
    </section>
  );
}
