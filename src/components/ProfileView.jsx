"use client";
/* ═══════════════════════════════════════════════════════════════
   PROFILE VIEW — operator identity + analytics
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import { BioGlyph } from "./BioIgnicionMark";
import AchievementBadge from "./AchievementBadge";
import { MOODS, DS, AM } from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, suggestOptimalTime, analyzeStreakChain,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, bioSignal } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";
import RemindersCard from "./RemindersCard";
import InstrumentDueCard from "./InstrumentDueCard";

const ACHIEVEMENT_IDS = Object.keys(AM);

export default function ProfileView({
  st, setSt, isDark, ac,
  onShowSettings, onShowHist, onShowCalibration,
  onShowChronotype, onShowResonance, onShowNOM035,
}) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const lv = gL(st.totalSessions);
  const lPct = lvPct(st.totalSessions);
  const nLv = nxtLv(st.totalSessions);
  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
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
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200 }}
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
              <span style={{ fontSize: font.size.sm, fontWeight: font.weight.black, color: "#fff" }}>{lv.n[0]}</span>
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
              animation: reduced ? "none" : "shimDot 2s ease infinite",
            }}
          />
          <span style={ty.title(nSt.color)}>{nSt.label} · {lv.n}</span>
        </div>
      </header>

      <motion.article
        initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.08, duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`Estadísticas: ${st.totalSessions} sesiones, racha ${st.streak} días`}
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBlockEnd: 14 }}>
          {[
            { v: st.totalSessions, l: "Sesiones", c: ac, ic: "bolt" },
            {
              v: `${Math.floor((st.totalTime || 0) / 3600)}h${Math.floor(((st.totalTime || 0) % 3600) / 60)}m`,
              l: "Tiempo",
              c: t1,
              ic: "clock",
            },
            { v: st.streak, l: "Racha", c: semantic.warning, ic: "fire" },
          ].map((m, i) => (
            <div
              key={i}
              role="group"
              aria-label={`${m.l}: ${m.v}`}
              style={{ textAlign: "center", padding: 8, background: subtle, borderRadius: 14 }}
            >
              <Icon name={m.ic} size={14} color={m.c} aria-hidden="true" />
              <div style={ty.metric(m.c, font.size["2xl"])}>{m.v}</div>
              <div
                style={{
                  ...ty.label(t3),
                  fontSize: font.size.xs,
                  letterSpacing: font.tracking.wider,
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
              transition={reduced ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
              style={{
                blockSize: "100%",
                borderRadius: 6,
                background: `linear-gradient(90deg,${lv.c},${lv.c}BB)`,
                boxShadow: `0 0 8px ${withAlpha(lv.c, 30)}`,
              }}
            />
          </div>
        </div>
      </motion.article>

      {(() => {
        const unlocked = st.achievements || [];
        const unlockedCount = ACHIEVEMENT_IDS.filter((id) => unlocked.includes(id)).length;
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
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: space[1],
                marginBlockEnd: space[3],
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: space[1] }}>
                <Icon name="trophy" size={12} color={t3} aria-hidden="true" />
                <h3 style={ty.label(t3)}>Insignias</h3>
              </div>
              <span style={{ ...ty.caption(t3), fontFamily: font.mono, letterSpacing: 1 }}>
                {unlockedCount}/{ACHIEVEMENT_IDS.length}
              </span>
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
              {ACHIEVEMENT_IDS.map((id) => (
                <div key={id} role="listitem">
                  <AchievementBadge id={id} unlocked={unlocked.includes(id)} size={64} />
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
              <h3 style={ty.label(t3)}>Tu Firma Neural</h3>
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
                  style={{ background: isDark ? "#1A1E28" : "#F8FAFC", borderRadius: 12, padding: 10 }}
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
            <span style={ty.label(ac)}>V-Cores</span>
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
          <div style={{ ...ty.label(t3), marginBlockEnd: 2 }}>Mood</div>
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
              <h3 style={ty.label(t3)}>Hora Óptima</h3>
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
              <h3 style={ty.label(t3)}>Análisis de Rachas</h3>
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
          <h3 style={ty.label(t3)}>Ciencia & Resultados</h3>
        </header>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Link
            href="/reporte"
            aria-label="Ver informe trimestral"
            style={{
              display: "flex", alignItems: "center", gap: 10, inlineSize: "100%",
              paddingBlock: 10, paddingInline: 12,
              background: isDark ? "#1A1E28" : "#F8FAFC",
              border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer",
              textAlign: "start", textDecoration: "none",
            }}
          >
            <Icon name="trophy" size={14} color={ac} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <div style={{ ...ty.title(t1) }}>Informe trimestral</div>
              <div style={ty.caption(t3)}>Sesiones, HRV, ánimo y escalas validadas · 90 días</div>
            </div>
            <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
          </Link>
          <Link
            href="/evidencia"
            aria-label="Biblioteca de evidencia científica"
            style={{
              display: "flex", alignItems: "center", gap: 10, inlineSize: "100%",
              paddingBlock: 10, paddingInline: 12,
              background: isDark ? "#1A1E28" : "#F8FAFC",
              border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer",
              textAlign: "start", textDecoration: "none",
            }}
          >
            <Icon name="fingerprint" size={14} color="#8B5CF6" aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <div style={{ ...ty.title(t1) }}>Biblioteca de evidencia</div>
              <div style={ty.caption(t3)}>Estudios y mecanismos detrás de cada protocolo</div>
            </div>
            <Icon name="chevron" size={12} color={t3} aria-hidden="true" />
          </Link>
        </div>
      </article>

      <div style={{ marginBlockEnd: 10 }}>
        <RemindersCard />
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
            <h3 style={ty.label(t3)}>Perfil Bioneural</h3>
          </header>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {onShowChronotype && (
              <button
                onClick={onShowChronotype}
                aria-label="Test de cronotipo MEQ-SA"
                style={{
                  display: "flex", alignItems: "center", gap: 10, inlineSize: "100%",
                  paddingBlock: 10, paddingInline: 12,
                  background: isDark ? "#1A1E28" : "#F8FAFC",
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <Icon name="clock" size={14} color="#D97706" aria-hidden="true" />
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
                  display: "flex", alignItems: "center", gap: 10, inlineSize: "100%",
                  paddingBlock: 10, paddingInline: 12,
                  background: isDark ? "#1A1E28" : "#F8FAFC",
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <Icon name="predict" size={14} color="#6366F1" aria-hidden="true" />
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
                  display: "flex", alignItems: "center", gap: 10, inlineSize: "100%",
                  paddingBlock: 10, paddingInline: 12,
                  background: isDark ? "#1A1E28" : "#F8FAFC",
                  border: `1px solid ${bd}`, borderRadius: 12, cursor: "pointer", textAlign: "start",
                }}
              >
                <Icon name="shield" size={14} color="#059669" aria-hidden="true" />
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

      <motion.button
        whileTap={reduced ? {} : { scale: 0.95 }}
        onClick={onShowCalibration}
        aria-label="Recalibrar baseline neural"
        style={{
          inlineSize: "100%",
          padding: space[3],
          borderRadius: radius.lg,
          border: `1.5px solid ${withAlpha(ac, 12)}`,
          background: `linear-gradient(135deg,${withAlpha(ac, 4)},${withAlpha(ac, 2)})`,
          color: ac,
          ...ty.title(ac),
          cursor: "pointer",
          marginBlockEnd: space[2],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: space[1.5] || 6,
        }}
      >
        <Icon name="radar" size={14} color={ac} aria-hidden="true" />
        Recalibrar Baseline Neural
      </motion.button>
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos?")) {
            setSt({ ...DS, weekNum: getWeekNum() });
          }
        }}
        aria-label="Reiniciar todos los datos"
        style={{
          inlineSize: "100%",
          padding: space[3],
          borderRadius: radius.lg,
          border: `1px solid ${withAlpha(semantic.danger, 20)}`,
          background: isDark ? "#1A0A0A" : withAlpha(semantic.danger, 4),
          color: semantic.danger,
          ...ty.caption(semantic.danger),
          cursor: "pointer",
        }}
      >
        Reiniciar Datos
      </button>
    </section>
  );
}
