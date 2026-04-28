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

  return (
    <section role="region" aria-label="Perfil del operador" style={{ paddingBlock: "14px 180px", paddingInline: 20 }}>
      <header style={{ textAlign: "center", marginBlockEnd: 20, marginBlockStart: 8, position: "relative" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetBlockStart: 0,
            insetInlineStart: "50%",
            transform: "translateX(-50%)",
            inlineSize: 200,
            blockSize: 200,
            borderRadius: "50%",
            background: `radial-gradient(circle,${withAlpha(ac, 8)},transparent)`,
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          initial={reduced ? { opacity: 1 } : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduced ? { duration: 0 } : SPRING.default}
        >
          <div
            aria-label={`Identidad bioneural, nivel ${lv.n}`}
            style={{
              inlineSize: 96,
              blockSize: 96,
              borderRadius: "50%",
              margin: "0 auto 14px",
              background: `radial-gradient(circle at 35% 30%, ${withAlpha(ac, 15)}, ${withAlpha(bioSignal.neuralViolet, 8)} 60%, transparent 80%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 10px 34px ${withAlpha(ac, 25)}, 0 0 0 1px ${withAlpha(ac, 15)} inset`,
              position: "relative",
            }}
          >
            <BioGlyph size={58} color={bioSignal.phosphorCyan} spark={bioSignal.ignition} animated={!reduced} />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                insetBlockEnd: -2,
                insetInlineEnd: -2,
                inlineSize: 28,
                blockSize: 28,
                borderRadius: radius.full,
                background: `linear-gradient(135deg,${lv.c},${lv.c}CC)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `3px solid ${cd}`,
                boxShadow: `0 2px 8px ${withAlpha(lv.c, 40)}`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 14,
                  fontWeight: font.weight.black,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {lv.g || lv.n[0]}
              </span>
            </div>
          </div>
        </motion.div>
        <h2 style={ty.heroHeading(t1)}>Operador Neural</h2>
        <div
          role="status"
          aria-label={`Estado ${nSt.label}, nivel ${lv.n}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginBlockStart: space[1.5] || 6,
            paddingBlock: space[1],
            paddingInline: space[4],
            background: withAlpha(nSt.color, 4),
            borderRadius: radius.xl,
            border: `1px solid ${withAlpha(nSt.color, 8)}`,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 5,
              blockSize: 5,
              borderRadius: radius.full,
              background: nSt.color,
            }}
          />
          <span style={ty.title(nSt.color)}>{nSt.label} · {lv.n}</span>
        </div>
      </header>

      <ProfileAuthCard isDark={isDark} ac={ac} />

      <motion.article
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.08, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`Estadísticas: ${totalSessions} sesiones, racha ${streak} días`}
        style={{
          background: `linear-gradient(145deg,${cd},${withAlpha(ac, 5)})`,
          borderRadius: 20,
          padding: "18px 16px",
          marginBlockEnd: 12,
          border: `1px solid ${bd}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetBlockStart: -20,
            insetInlineEnd: -20,
            inlineSize: 80,
            blockSize: 80,
            borderRadius: "50%",
            background: withAlpha(ac, 6),
          }}
        />
        {/* Sprint 102 — Apple Fitness pattern. Stats con icon container
            circular saturado + número grande color category + label
            visible. Antes: 14px icon casi invisible + label en t3 muted
            (#48484A) que se perdía sobre bg neutral = "gris seco". */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBlockEnd: 14 }}>
          {[
            { v: totalSessions, l: "Sesiones", c: bioSignal.phosphorCyan, ic: "bolt" },
            {
              v: `${Math.floor((st.totalTime || 0) / 3600)}h${Math.floor(((st.totalTime || 0) % 3600) / 60)}m`,
              l: "Tiempo",
              c: "#A78BFA", // violet-400 — distintivo, no neutral
              ic: "clock",
            },
            { v: streak, l: "Racha", c: "#F59E0B", ic: "fire" },
          ].map((m, i) => (
            <div
              key={i}
              role="group"
              aria-label={`${m.l}: ${m.v}`}
              style={{
                textAlign: "center",
                padding: "10px 8px",
                background: withAlpha(m.c, 6),
                borderRadius: 14,
                border: `1px solid ${withAlpha(m.c, 18)}`,
              }}
            >
              <div style={{
                inlineSize: 32, blockSize: 32, borderRadius: "50%",
                background: withAlpha(m.c, 22),
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 6px",
              }}>
                <Icon name={m.ic} size={16} color={m.c} aria-hidden="true" />
              </div>
              <div style={ty.metric(m.c, font.size["2xl"])}>{m.v}</div>
              <div
                style={{
                  fontSize: font.size.xs,
                  fontWeight: 600,
                  color: t2,
                  letterSpacing: -0.05,
                  marginBlockStart: 3,
                }}
              >
                {m.l}
              </div>
            </div>
          ))}
        </div>
        <div
          role="group"
          aria-label={`Progreso de nivel: ${lPct}%${nLv ? ` hacia ${nLv.n}` : ""}`}
          style={{ padding: "10px 12px", background: subtle, borderRadius: 12 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockEnd: 6 }}>
            <span style={ty.title(lv.c)}>{lv.n}</span>
            <span style={ty.caption(t3)}>{nLv ? `→ ${nLv.n}` : ""} · {lPct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={lPct}
            style={{ blockSize: 6, background: bd, borderRadius: 6, overflow: "hidden" }}
          >
            <motion.div
              initial={reduced ? { width: lPct + "%" } : { width: 0 }}
              animate={{ width: lPct + "%" }}
              transition={reduced ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                blockSize: "100%",
                borderRadius: 6,
                background: `linear-gradient(90deg,${lv.c},${lv.c}BB)`,
              }}
            />
          </div>
        </div>
      </motion.article>

      <details
        className="bi-rank-ladder"
        style={{
          background: cd,
          borderRadius: 16,
          border: `1px solid ${bd}`,
          marginBlockEnd: 10,
          overflow: "hidden",
        }}
      >
        <summary
          aria-label="Ver todos los rangos del operador neural"
          style={{
            listStyle: "none",
            cursor: "pointer",
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: space[2],
            userSelect: "none",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 24,
              blockSize: 24,
              borderRadius: radius.full,
              background: `linear-gradient(135deg,${lv.c},${lv.c}CC)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {lv.g}
          </div>
          <div style={{ flex: 1, minInlineSize: 0 }}>
            <div style={ty.title(t1)}>Rango · {lv.n}</div>
            <div style={ty.caption(t3)}>
              {nLv ? `→ ${nLv.n} en ${Math.max(0, nLv.m - (st.totalSessions || 0))} sesiones` : "Rango máximo alcanzado"}
            </div>
          </div>
          <Icon name="chevron" size={14} color={t3} aria-hidden="true" />
        </summary>
        <ol
          role="list"
          aria-label="Progresión de rangos"
          style={{
            listStyle: "none",
            margin: 0,
            padding: `0 14px 14px`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderBlockStart: `1px solid ${bd}`,
            paddingBlockStart: 14,
          }}
        >
          {LVL.map((rank) => {
            const isCurrent = rank.n === lv.n;
            const isPast = (st.totalSessions || 0) >= rank.mx;
            return (
              <li
                key={rank.n}
                aria-current={isCurrent ? "true" : undefined}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  background: isCurrent ? withAlpha(rank.c, 8) : subtle,
                  border: `1px solid ${isCurrent ? withAlpha(rank.c, 20) : "transparent"}`,
                  opacity: isPast && !isCurrent ? 0.55 : 1,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    inlineSize: 32,
                    blockSize: 32,
                    borderRadius: radius.full,
                    background: isCurrent
                      ? `linear-gradient(135deg,${rank.c},${rank.c}CC)`
                      : withAlpha(rank.c, 12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 900,
                    color: isCurrent ? "#fff" : rank.c,
                    lineHeight: 1,
                  }}
                >
                  {rank.g}
                </div>
                <div style={{ minInlineSize: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? rank.c : t1, letterSpacing: -0.05 }}>
                    {rank.n}
                  </div>
                  <div style={ty.caption(t3)}>{rank.d}</div>
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    color: t3,
                    letterSpacing: -0.1,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {rank.m}{rank.mx < 999 ? `–${rank.mx}` : "+"}
                </div>
              </li>
            );
          })}
        </ol>
      </details>

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

        return (
          <motion.article
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.16, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            aria-label={`Logros: ${unlockedCount} de ${ACHIEVEMENT_IDS.length}`}
            style={{
              background: cd,
              borderRadius: 16,
              padding: 14,
              marginBlockEnd: 10,
              border: `1px solid ${bd}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Corner brackets — Neural-DNA chrome */}
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 12, blockSize: 12, insetBlockStart: 8, insetInlineStart: 8, pointerEvents: "none" }} viewBox="0 0 12 12">
              <path d="M0 12 L0 0 L12 0" stroke={bracketColor} strokeWidth="1.2" fill="none" />
            </svg>
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 12, blockSize: 12, insetBlockStart: 8, insetInlineEnd: 8, pointerEvents: "none" }} viewBox="0 0 12 12">
              <path d="M0 0 L12 0 L12 12" stroke={bracketColor} strokeWidth="1.2" fill="none" />
            </svg>
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 12, blockSize: 12, insetBlockEnd: 8, insetInlineStart: 8, pointerEvents: "none" }} viewBox="0 0 12 12">
              <path d="M12 12 L0 12 L0 0" stroke={bracketColor} strokeWidth="1.2" fill="none" />
            </svg>
            <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 12, blockSize: 12, insetBlockEnd: 8, insetInlineEnd: 8, pointerEvents: "none" }} viewBox="0 0 12 12">
              <path d="M0 12 L12 12 L12 0" stroke={bracketColor} strokeWidth="1.2" fill="none" />
            </svg>

            <header style={{ marginBlockEnd: space[3] }}>
              {/* Kicker MONO tracked */}
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBlockEnd: 6,
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: font.weight.bold,
                  letterSpacing: font.tracking.caps,
                  textTransform: "uppercase",
                  color: withAlpha(brand.primary, 70),
                }}
              >
                <span
                  style={{
                    inlineSize: 4,
                    blockSize: 4,
                    borderRadius: "50%",
                    background: brand.primary,
                    boxShadow: `0 0 6px ${withAlpha(brand.primary, 80)}`,
                  }}
                />
                <span>Logros neurales</span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: space[2] }}>
                <div style={{ display: "flex", alignItems: "center", gap: space[1] }}>
                  <Icon name="trophy" size={13} color={t2} aria-hidden="true" />
                  <h3 style={{ ...ty.heading(t1), fontSize: font.size.lg, margin: 0 }}>Insignias</h3>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 3,
                    fontFamily: MONO,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: -0.15,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: font.weight.black, color: t1 }}>{unlockedCount}</span>
                  <span style={{ fontSize: 12, fontWeight: font.weight.bold, color: t3 }}>/{ACHIEVEMENT_IDS.length}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={ACHIEVEMENT_IDS.length}
                aria-valuenow={unlockedCount}
                aria-label={`${unlockedCount} de ${ACHIEVEMENT_IDS.length} logros desbloqueados`}
                style={{
                  position: "relative",
                  blockSize: 5,
                  borderRadius: 3,
                  background: withAlpha(brand.primary, 8),
                  overflow: "hidden",
                  marginBlockStart: space[2],
                }}
              >
                <motion.div
                  initial={{ inlineSize: 0 }}
                  animate={{ inlineSize: `${pct}%` }}
                  transition={{ duration: reduced ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    insetBlockStart: 0,
                    insetInlineStart: 0,
                    blockSize: "100%",
                    background: `linear-gradient(90deg, ${withAlpha(brand.primary, 55)}, ${brand.primary})`,
                    boxShadow: `0 0 8px ${withAlpha(brand.primary, 60)}`,
                  }}
                />
              </div>

              {/* Tier breakdown chips — sólo tiers con count > 0 */}
              {activeTiers.length > 0 && (
                <div
                  aria-label="Desglose por tier"
                  style={{
                    display: "flex",
                    gap: 5,
                    flexWrap: "wrap",
                    marginBlockStart: space[2],
                  }}
                >
                  {activeTiers.map((tr) => (
                    <span
                      key={tr.k}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        paddingInline: 7,
                        paddingBlock: 2,
                        borderRadius: radius.full,
                        background: withAlpha(tr.c, 10),
                        border: `1px solid ${withAlpha(tr.c, 28)}`,
                        fontFamily: MONO,
                        fontSize: 10,
                        fontWeight: font.weight.bold,
                        color: tr.c,
                        letterSpacing: -0.05,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          inlineSize: 4,
                          blockSize: 4,
                          borderRadius: "50%",
                          background: tr.c,
                          boxShadow: `0 0 4px ${withAlpha(tr.c, 80)}`,
                        }}
                      />
                      <span>{tierCounts[tr.k]}</span>
                      <span style={{ fontWeight: font.weight.semibold, opacity: 0.85 }}>{tr.n}</span>
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div
              role="list"
              aria-label="Cuadrícula de insignias"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))",
                gap: space[2],
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
          </motion.article>
        );
      })()}

      {(() => {
        const fp = calcNeuralFingerprint(st);
        if (!fp) return null;
        return (
          <article
            aria-label="Firma neural"
            style={{
              background: cd,
              borderRadius: 16,
              padding: 14,
              marginBlockEnd: 10,
              border: `1px solid ${bd}`,
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2.5] || 10 }}>
              <Icon name="fingerprint" size={12} color={t3} aria-hidden="true" />
              <h3 style={sectionLabel(t3)}>Tu Firma Neural</h3>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {[
                { l: "Hora pico", v: `${fp.peakHour}:00` },
                { l: "Mejor protocolo", v: fp.bestProto, c: ac },
                {
                  l: "Calidad",
                  v: `${fp.avgQuality}%`,
                  c: fp.avgQuality >= 70 ? semantic.success : semantic.warning,
                },
                {
                  l: "Adaptación",
                  v: fp.adaptationRate > 0 ? `+${fp.adaptationRate}` : `${fp.adaptationRate}`,
                  c: fp.adaptationRate > 0 ? semantic.success : semantic.danger,
                },
              ].map((d, i) => (
                <div
                  key={i}
                  role="group"
                  aria-label={`${d.l}: ${d.v}`}
                  style={{ background: sf, borderRadius: 12, padding: 10 }}
                >
                  <div style={ty.caption(t3)}>{d.l}</div>
                  <div style={ty.metric(d.c || t1, font.size.lg)}>{d.v}</div>
                </div>
              ))}
            </div>
          </article>
        );
      })()}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBlockEnd: 10 }}>
        <article
          aria-label={`V-Cores: ${st.vCores || 0}`}
          style={{
            background: withAlpha(ac, 6),
            borderRadius: 14,
            padding: "14px 12px",
            border: `1px solid ${withAlpha(ac, 10)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginBlockEnd: 2 }}>
            <Icon name="sparkle" size={10} color={ac} aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: -0.05, color: ac }}>V-Cores</span>
          </div>
          <AnimatedNumber value={st.vCores || 0} color={ac} size={24} />
        </article>
        <article
          aria-label={avgMood > 0 ? `Ánimo promedio: ${avgMood} sobre 5` : "Ánimo: sin datos"}
          style={{
            background: cd,
            borderRadius: 14,
            padding: "14px 12px",
            border: `1px solid ${bd}`,
          }}
        >
          <div style={{ ...sectionLabel(t3), marginBlockEnd: 2 }}>Mood</div>
          {avgMood > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: space[1] }}>
              <Icon
                name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"}
                size={18}
                color={MOODS[Math.round(avgMood) - 1]?.color || t3}
                aria-hidden="true"
              />
              <span style={ty.metric(MOODS[Math.round(avgMood) - 1]?.color || t3)}>{avgMood}</span>
            </div>
          ) : (
            <span style={ty.body(t3)}>Sin datos</span>
          )}
        </article>
      </div>

      {(() => {
        const ot = suggestOptimalTime(st);
        if (!ot || !ot.best) return null;
        return (
          <article
            aria-label="Hora óptima para entrenar"
            style={{
              background: cd,
              borderRadius: 16,
              padding: 14,
              marginBlockEnd: 10,
              border: `1px solid ${bd}`,
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
              <Icon name="clock" size={12} color={t3} aria-hidden="true" />
              <h3 style={sectionLabel(t3)}>Hora Óptima</h3>
            </header>
            <p style={ty.body(t2)}>{ot.recommendation}</p>
          </article>
        );
      })()}

      {(() => {
        const sc = analyzeStreakChain(st);
        if (!sc) return null;
        return (
          <article
            aria-label="Análisis de rachas"
            style={{
              background: cd,
              borderRadius: 16,
              padding: 14,
              marginBlockEnd: 10,
              border: `1px solid ${bd}`,
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
              <Icon name="fire" size={12} color={semantic.warning} aria-hidden="true" />
              <h3 style={sectionLabel(t3)}>Análisis de Rachas</h3>
            </header>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: space[2],
                marginBlockEnd: space[2],
              }}
            >
              <div role="group" aria-label={`Récord: ${sc.maxStreak} días`} style={{ textAlign: "center" }}>
                <div style={ty.metric(semantic.warning, font.size.xl)}>{sc.maxStreak}d</div>
                <div style={{ fontSize: font.size.xs, color: t3 }}>récord</div>
              </div>
              <div role="group" aria-label={`Promedio: ${sc.avgStreak} días`} style={{ textAlign: "center" }}>
                <div style={ty.metric(t1, font.size.xl)}>{sc.avgStreak}d</div>
                <div style={{ fontSize: font.size.xs, color: t3 }}>promedio</div>
              </div>
              <div role="group" aria-label={`Punto de quiebre: ${sc.avgBreakPoint} días`} style={{ textAlign: "center" }}>
                <div style={ty.metric("#6366F1", font.size.xl)}>{sc.avgBreakPoint}d</div>
                <div style={{ fontSize: font.size.xs, color: t3 }}>punto quiebre</div>
              </div>
            </div>
            <p style={ty.body(t2)}>{sc.prediction}</p>
          </article>
        );
      })()}

      <div
        role="group"
        aria-label="Acciones de perfil"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBlockEnd: 10 }}
      >
        <motion.button
          whileTap={reduced ? {} : { scale: 0.95 }}
          onClick={onShowSettings}
          aria-label="Abrir ajustes"
          style={{
            padding: 14,
            borderRadius: 16,
            border: `1px solid ${bd}`,
            background: cd,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 36,
              blockSize: 36,
              borderRadius: 11,
              background: isDark ? "#1A1E28" : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="gear" size={16} color={t3} />
          </div>
          <span style={ty.caption(t2)}>Ajustes</span>
        </motion.button>
        <motion.button
          whileTap={reduced ? {} : { scale: 0.95 }}
          onClick={onShowHist}
          aria-label="Abrir historial de sesiones"
          style={{
            padding: space[4],
            borderRadius: radius.lg,
            border: `1px solid ${bd}`,
            background: cd,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: space[1.5] || 6,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              inlineSize: 36,
              blockSize: 36,
              borderRadius: radius.sm + 3,
              background: isDark ? "#1A1E28" : "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="clock" size={16} color={t3} />
          </div>
          <span style={ty.caption(t2)}>Historial</span>
        </motion.button>
      </div>
      <div style={{ marginBlockEnd: 10 }}>
        <InstrumentDueCard isDark={isDark} ac={ac} />
      </div>

      <article
        aria-label="Ciencia y resultados"
        style={{
          background: cd,
          borderRadius: 16,
          padding: 14,
          marginBlockEnd: 10,
          border: `1px solid ${bd}`,
        }}
      >
        <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
          <Icon name="shield" size={12} color={t3} aria-hidden="true" />
          <h3 style={sectionLabel(t3)}>Ciencia & Resultados</h3>
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Sprint 101 — Apple Health pattern: icon container 36px
              circular con bg fill saturado en category color. Bumpea
              icons 14→18px. Inyecta brand vibrancy en chrome neutral
              tras user report "todo gris seco, sin color". */}
          <Link
            href="/reporte"
            aria-label="Ver informe trimestral"
            className="bi-row-link"
            style={{
              display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
              paddingBlock: 10, paddingInline: 12,
              background: sf,
              border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer",
              textAlign: "start", textDecoration: "none",
            }}
          >
            <div style={{
              inlineSize: 36, blockSize: 36, borderRadius: "50%",
              background: withAlpha(ac, 18),
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="trophy" size={18} color={ac} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...ty.title(t1) }}>Informe trimestral</div>
              <div style={ty.caption(t3)}>Sesiones, HRV, ánimo y escalas validadas · 90 días</div>
            </div>
            <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
          </Link>
          <Link
            href="/evidencia"
            aria-label="Biblioteca de evidencia científica"
            className="bi-row-link"
            style={{
              display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
              paddingBlock: 10, paddingInline: 12,
              background: sf,
              border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer",
              textAlign: "start", textDecoration: "none",
            }}
          >
            <div style={{
              inlineSize: 36, blockSize: 36, borderRadius: "50%",
              background: withAlpha("#8B5CF6", 18),
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="fingerprint" size={18} color="#8B5CF6" aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...ty.title(t1) }}>Biblioteca de evidencia</div>
              <div style={ty.caption(t3)}>Estudios y mecanismos detrás de cada protocolo</div>
            </div>
            <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
          </Link>
          <Link
            href="/learn"
            aria-label="Artículos de fundamentos"
            className="bi-row-link"
            style={{
              display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
              paddingBlock: 10, paddingInline: 12,
              background: sf,
              border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer",
              textAlign: "start", textDecoration: "none",
            }}
          >
            <div style={{
              inlineSize: 36, blockSize: 36, borderRadius: "50%",
              background: withAlpha("#F59E0B", 18),
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon name="lightbulb" size={18} color="#F59E0B" aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...ty.title(t1) }}>Aprende</div>
              <div style={ty.caption(t3)}>HRV, cronotipo, respiración resonante · con citas</div>
            </div>
            <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
          </Link>
        </div>
      </article>

      <div style={{ marginBlockEnd: 10 }}>
        <RemindersCard isDark={isDark} ac={ac} />
      </div>
      {(onShowChronotype || onShowResonance || onShowNOM035) && (
        <article
          aria-label="Perfil bioneural"
          style={{
            background: cd,
            borderRadius: 16,
            padding: 14,
            marginBlockEnd: 10,
            border: `1px solid ${bd}`,
          }}
        >
          <header style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
            <Icon name="fingerprint" size={12} color={t3} aria-hidden="true" />
            <h3 style={sectionLabel(t3)}>Perfil Bioneural</h3>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Sprint 101 — Apple Health pattern. Cada card de Perfil
                Bioneural ahora tiene icon container 36px circular en
                category color saturado. Inyecta brand vibrancy. */}
            {onShowChronotype && (
              <button
                onClick={onShowChronotype}
                aria-label="Test de cronotipo MEQ-SA"
                style={{
                  display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
                  minBlockSize: 44, paddingBlock: 10, paddingInline: 12,
                  background: sf,
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <div style={{
                  inlineSize: 36, blockSize: 36, borderRadius: "50%",
                  background: withAlpha("#D97706", 18),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="clock" size={18} color="#D97706" aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...ty.title(t1) }}>Cronotipo (MEQ-SA)</div>
                  <div style={ty.caption(t3)}>
                    {st.chronotype ? st.chronotype.label : "5 preguntas · calibra tu ritmo circadiano"}
                  </div>
                </div>
                <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
              </button>
            )}
            {onShowResonance && (
              <button
                onClick={onShowResonance}
                aria-label="Calibrar frecuencia resonante con sensor de HR"
                style={{
                  display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
                  minBlockSize: 44, paddingBlock: 10, paddingInline: 12,
                  background: sf,
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <div style={{
                  inlineSize: 36, blockSize: 36, borderRadius: "50%",
                  background: withAlpha("#6366F1", 18),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="predict" size={18} color="#6366F1" aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...ty.title(t1) }}>Frecuencia Resonante</div>
                  <div style={ty.caption(t3)}>
                    {st.resonanceFreq ? `${st.resonanceFreq} rpm` : "5 ensayos con banda BLE · máximo HRV"}
                  </div>
                </div>
                <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
              </button>
            )}
            {onShowNOM035 && (
              <button
                onClick={onShowNOM035}
                aria-label="Evaluación NOM-035"
                style={{
                  display: "flex", alignItems: "center", gap: 12, inlineSize: "100%",
                  minBlockSize: 44, paddingBlock: 10, paddingInline: 12,
                  background: sf,
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <div style={{
                  inlineSize: 36, blockSize: 36, borderRadius: "50%",
                  background: withAlpha("#059669", 18),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="shield" size={18} color="#059669" aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...ty.title(t1) }}>NOM-035 · Riesgo psicosocial</div>
                  <div style={ty.caption(t3)}>
                    {(() => {
                      const last = (st.nom035Results || []).slice(-1)[0];
                      return last ? `Último: ${last.level?.label || "—"}` : "46 ítems oficiales · Guía II";
                    })()}
                  </div>
                </div>
                <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
              </button>
            )}
          </div>
        </article>
      )}

      <BaselineCard st={st} isDark={isDark} ac={ac} onRecalibrate={onShowCalibration} />

      {st.neuralBaseline && <motion.button
        whileTap={reduced ? {} : { scale: 0.95 }}
        onClick={onShowCalibration}
        aria-label="Recalibrar baseline neural"
        style={{
          inlineSize: "100%",
          paddingBlock: 14,
          paddingInline: 18,
          borderRadius: radius.lg,
          border: `1.5px solid ${withAlpha(ac, 12)}`,
          background: `linear-gradient(135deg,${withAlpha(ac, 4)},${withAlpha(ac, 2)})`,
          color: ac,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: -0.1,
          minBlockSize: 48,
          cursor: "pointer",
          marginBlockEnd: space[2],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: space[1.5] || 6,
        }}
      >
        <Icon name="radar" size={14} color={ac} aria-hidden="true" />
        Recalibrar baseline neural
      </motion.button>}
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos?")) {
            setSt({ ...DS, weekNum: getWeekNum() });
          }
        }}
        aria-label="Reiniciar todos los datos"
        style={{
          inlineSize: "100%",
          paddingBlock: 12,
          paddingInline: 16,
          borderRadius: radius.lg,
          border: `1px solid ${withAlpha(semantic.danger, 20)}`,
          background: withAlpha(semantic.danger, isDark ? 8 : 4),
          color: semantic.danger,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: -0.05,
          minBlockSize: 44,
          cursor: "pointer",
        }}
      >
        Reiniciar datos
      </button>
    </section>
  );
}
