"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import { MOODS, DS } from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, suggestOptimalTime, analyzeStreakChain,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, layout, semantic } from "../lib/theme";

export default function ProfileView({ st, setSt, isDark, ac, onShowSettings, onShowHist, onShowCalibration }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const lv = gL(st.totalSessions);
  const lPct = lvPct(st.totalSessions);
  const nLv = nxtLv(st.totalSessions);
  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const nSt = getStatus(perf);
  const avgMood = useMemo(() => { const ml = st.moodLog || []; if (!ml.length) return 0; return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1); }, [st.moodLog]);

  return (
    <div style={{ padding: `14px 20px ${layout.bottomSafe}px` }}>
      {/* Profile Hero — atmospheric personal space */}
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 12, position: "relative" }}>
        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 240, height: 240, borderRadius: "50%", background: `radial-gradient(circle,${ac}06,transparent 60%)`, filter: "blur(40px)", pointerEvents: "none" }} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 20 }}>
          <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto 16px" }}>
            {/* Breathing ring around avatar */}
            <motion.div animate={{ scale: [1, 1.06, 1], opacity: [.15, .3, .15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `1px solid ${ac}` }} />
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg,${ac},#6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 30px ${ac}20`, position: "relative" }}>
              <Icon name="user" size={34} color="#fff" />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: radius.full, background: `linear-gradient(135deg,${lv.c},${lv.c}CC)`, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${cd}`, boxShadow: `0 2px 8px ${lv.c}30` }}><span style={{ fontSize: font.size.sm, fontWeight: font.weight.black, color: "#fff" }}>{lv.n[0]}</span></div>
            </div>
          </div>
        </motion.div>
        <div style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, color: t1, letterSpacing: "-0.5px" }}>Tu perfil neural</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: space[2], padding: `${space[1.5]}px ${space[4]}px`, background: withAlpha(nSt.color, 3), borderRadius: radius.xl, border: `1px solid ${withAlpha(nSt.color, 6)}` }}><div style={{ width: 5, height: 5, borderRadius: radius.full, background: nSt.color, animation: "shimDot 2s ease infinite" }} /><span style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: nSt.color }}>{nSt.label} · {lv.n}</span></div>
      </div>

      {/* Stats hero card */}
      <div style={{ background: `linear-gradient(155deg,${cd},${isDark ? ac + "04" : ac + "03"})`, borderRadius: radius["2xl"], padding: "22px 18px", marginBottom: 14, border: `1px solid ${isDark ? ac + "08" : bd}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle,${ac}06,transparent)` }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space[2], marginBottom: space[4] }}>
          {[{ v: st.totalSessions, l: "Sesiones", c: ac, ic: "bolt" }, { v: `${Math.floor((st.totalTime || 0) / 3600)}h${Math.floor(((st.totalTime || 0) % 3600) / 60)}m`, l: "Tiempo", c: t1, ic: "clock" }, { v: st.streak, l: "Racha", c: semantic.warning, ic: "fire" }].map((m, i) => (
            <div key={i} style={{ textAlign: "center", padding: `${space[2.5]}px ${space[1]}px`, background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.015)", borderRadius: radius.md }}>
              <Icon name={m.ic} size={14} color={m.c} />
              <div style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, color: m.c, letterSpacing: "-0.5px", marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: t3, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{m.l}</div>
            </div>))}
        </div>
        <div style={{ padding: `${space[2.5]}px ${space[3]}px`, background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.015)", borderRadius: radius.md }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space[1.5] }}>
            <span style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: lv.c }}>{lv.n}</span>
            <span style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: t3 }}>{nLv ? `→ ${nLv.n}` : ""} · {lPct}%</span>
          </div>
          <div style={{ height: 5, background: bd, borderRadius: 4, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: lPct + "%" }} transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${lv.c},${lv.c}BB)`, boxShadow: `0 0 10px ${lv.c}25` }} />
          </div>
        </div>
      </div>

      {/* Neural Fingerprint */}
      {(() => { let fp; try { fp = calcNeuralFingerprint(st); } catch(e) { fp = null; } if (!fp) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[2.5] }}><Icon name="fingerprint" size={12} color={t3} /><span style={ty.label(t3)}>Tu Firma Neural</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {[{ l: "Hora pico", v: `${fp.peakHour}:00` }, { l: "Mejor protocolo", v: fp.bestProto, c: ac }, { l: "Calidad", v: `${fp.avgQuality}%`, c: fp.avgQuality >= 70 ? semantic.success : semantic.warning }, { l: "Adaptación", v: fp.adaptationRate > 0 ? `+${fp.adaptationRate}` : `${fp.adaptationRate}`, c: fp.adaptationRate > 0 ? semantic.success : semantic.danger }].map((d, i) => (
              <div key={i} style={{ background: isDark ? "#1A1E28" : "#F8FAFC", borderRadius: 12, padding: "10px" }}>
                <div style={ty.caption(t3)}>{d.l}</div>
                <div style={ty.metric(d.c || t1, font.size.lg)}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>); })()}

      {/* V-Cores + Mood */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
        <div style={{ background: ac + "06", borderRadius: 14, padding: "14px 12px", border: `1px solid ${ac}10` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}><Icon name="sparkle" size={10} color={ac} /><span style={ty.label(ac)}>V-Cores</span></div>
          <AnimatedNumber value={st.vCores || 0} color={ac} size={24} />
        </div>
        <div style={{ background: cd, borderRadius: 14, padding: "14px 12px", border: `1px solid ${bd}` }}>
          <div style={{ ...ty.label(t3), marginBottom: 2 }}>Mood</div>
          {avgMood > 0 ? <div style={{ display: "flex", alignItems: "center", gap: space[1] }}><Icon name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"} size={18} color={MOODS[Math.round(avgMood) - 1]?.color || t3} /><span style={ty.metric(MOODS[Math.round(avgMood) - 1]?.color || t3)}>{avgMood}</span></div> : <span style={ty.body(t3)}>Sin datos</span>}
        </div>
      </div>

      {/* Optimal Time Suggestion */}
      {(() => { let ot; try { ot = suggestOptimalTime(st); } catch(e) { ot = null; } if (!ot || !ot.best) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[2] }}><Icon name="clock" size={12} color={t3} /><span style={ty.label(t3)}>Hora Óptima</span></div>
          <div style={ty.body(t2)}>{ot.recommendation}</div>
        </div>); })()}

      {/* Streak Chain Analysis */}
      {(() => { let sc; try { sc = analyzeStreakChain(st); } catch(e) { sc = null; } if (!sc) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[2] }}><Icon name="fire" size={12} color={semantic.warning} /><span style={ty.label(t3)}>Análisis de Rachas</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space[2], marginBottom: space[2] }}>
            <div style={{ textAlign: "center" }}><div style={ty.metric(semantic.warning, font.size.xl)}>{sc.maxStreak}d</div><div style={{ fontSize: font.size.xs, color: t3 }}>récord</div></div>
            <div style={{ textAlign: "center" }}><div style={ty.metric(t1, font.size.xl)}>{sc.avgStreak}d</div><div style={{ fontSize: font.size.xs, color: t3 }}>promedio</div></div>
            <div style={{ textAlign: "center" }}><div style={ty.metric(semantic.info, font.size.xl)}>{sc.avgBreakPoint}d</div><div style={{ fontSize: font.size.xs, color: t3 }}>punto quiebre</div></div>
          </div>
          <div style={ty.body(t2)}>{sc.prediction}</div>
        </div>); })()}

      {/* Actions grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <motion.button whileTap={{ scale: .95 }} onClick={onShowSettings} style={{ padding: "14px", borderRadius: 16, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: isDark ? "#1A1E28" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="gear" size={16} color={t3} /></div>
          <span style={ty.caption(t2)}>Ajustes</span>
        </motion.button>
        <motion.button whileTap={{ scale: .95 }} onClick={onShowHist} style={{ padding: `${space[4]}px`, borderRadius: radius.lg, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: space[1.5] }}>
          <div style={{ width: 36, height: 36, borderRadius: radius.sm + 3, background: isDark ? "#1A1E28" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="clock" size={16} color={t3} /></div>
          <span style={ty.caption(t2)}>Historial</span>
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: .95 }} onClick={onShowCalibration} style={{ width: "100%", padding: `${space[3]}px`, borderRadius: radius.lg, border: `1.5px solid ${withAlpha(ac, 12)}`, background: `linear-gradient(135deg,${withAlpha(ac, 4)},${withAlpha(ac, 2)})`, color: ac, ...ty.title(ac), cursor: "pointer", marginBottom: space[2], display: "flex", alignItems: "center", justifyContent: "center", gap: space[1.5] }}><Icon name="radar" size={14} color={ac} />Recalibrar Baseline Neural</motion.button>
      <button onClick={() => { if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos?")) { setSt({ ...DS, weekNum: getWeekNum() }); } }} style={{ width: "100%", padding: `${space[3]}px`, borderRadius: radius.lg, border: `1px solid ${withAlpha(semantic.danger, 8)}`, background: withAlpha(semantic.danger, 2), color: semantic.danger, ...ty.caption(semantic.danger), cursor: "pointer" }}>Reiniciar Datos</button>
    </div>
  );
}
