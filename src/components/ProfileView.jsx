"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { MOODS, DS } from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum,
  calcNeuralFingerprint, suggestOptimalTime, analyzeStreakChain,
} from "../lib/neural";

/* Animated Number */
function AN({ value, sfx = "", color = "#0F172A", sz = 32 }) {
  const [d, sD] = useState(0);
  const rf = useRef(null);
  useEffect(() => {
    let s = d; const e = value; const t0 = performance.now();
    function step(n) { const p = Math.min((n - t0) / 700, 1); sD(Math.round(s + (1 - Math.pow(1 - p, 3)) * (e - s))); if (p < 1) rf.current = requestAnimationFrame(step); }
    rf.current = requestAnimationFrame(step);
    return () => { if (rf.current) cancelAnimationFrame(rf.current); };
  }, [value]);
  return <span style={{ fontSize: sz, fontWeight: 800, color, fontFamily: "'Manrope',sans-serif", letterSpacing: "-1px" }}>{d}{sfx}</span>;
}

export default function ProfileView({ st, setSt, isDark, ac, onShowSettings, onShowHist, onShowCalibration }) {
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  const lv = gL(st.totalSessions);
  const lPct = lvPct(st.totalSessions);
  const nLv = nxtLv(st.totalSessions);
  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const nSt = getStatus(perf);
  const avgMood = useMemo(() => { const ml = st.moodLog || []; if (!ml.length) return 0; return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1); }, [st.moodLog]);

  return (
    <div style={{ padding: "14px 20px 180px" }}>
      {/* Profile Hero */}
      <div style={{ textAlign: "center", marginBottom: 20, marginTop: 8, position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${ac}08,transparent)`, filter: "blur(30px)", pointerEvents: "none" }} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 12px", background: `linear-gradient(135deg,${ac},#6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 30px ${ac}25,0 0 0 3px ${cd},0 0 0 5px ${ac}20`, position: "relative" }}>
            <Icon name="user" size={32} color="#fff" />
            <div style={{ position: "absolute", bottom: -3, right: -3, width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${lv.c},${lv.c}CC)`, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${cd}`, boxShadow: `0 2px 8px ${lv.c}40` }}><span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{lv.n[0]}</span></div>
          </div>
        </motion.div>
        <div style={{ fontSize: 20, fontWeight: 800, color: t1, letterSpacing: "-0.5px" }}>Operador Neural</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "4px 14px", background: nSt.color + "0C", borderRadius: 20, border: `1px solid ${nSt.color}15` }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: nSt.color, animation: "shimDot 2s ease infinite" }} /><span style={{ fontSize: 11, fontWeight: 700, color: nSt.color }}>{nSt.label} · {lv.n}</span></div>
      </div>

      {/* Stats hero card */}
      <div style={{ background: `linear-gradient(145deg,${cd},${ac}05)`, borderRadius: 20, padding: "18px 16px", marginBottom: 12, border: `1px solid ${bd}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: ac + "06" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ v: st.totalSessions, l: "Sesiones", c: ac, ic: "bolt" }, { v: `${Math.floor((st.totalTime || 0) / 3600)}h${Math.floor(((st.totalTime || 0) % 3600) / 60)}m`, l: "Tiempo", c: t1, ic: "clock" }, { v: st.streak, l: "Racha", c: "#D97706", ic: "fire" }].map((m, i) => (
            <div key={i} style={{ textAlign: "center", padding: "8px", background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 14 }}>
              <Icon name={m.ic} size={14} color={m.c} />
              <div style={{ fontSize: 20, fontWeight: 800, color: m.c, lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: 9, color: t3, fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>{m.l}</div>
            </div>))}
        </div>
        <div style={{ padding: "10px 12px", background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: lv.c }}>{lv.n}</span>
            <span style={{ fontSize: 10, color: t3 }}>{nLv ? `→ ${nLv.n}` : ""} · {lPct}%</span>
          </div>
          <div style={{ height: 6, background: bd, borderRadius: 6, overflow: "hidden" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: lPct + "%" }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: "100%", borderRadius: 6, background: `linear-gradient(90deg,${lv.c},${lv.c}BB)`, boxShadow: `0 0 8px ${lv.c}30` }} />
          </div>
        </div>
      </div>

      {/* Neural Fingerprint */}
      {(() => { const fp = calcNeuralFingerprint(st); if (!fp) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}><Icon name="fingerprint" size={12} color={t3} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase" }}>Tu Firma Neural</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {[{ l: "Hora pico", v: `${fp.peakHour}:00` }, { l: "Mejor protocolo", v: fp.bestProto, c: ac }, { l: "Calidad", v: `${fp.avgQuality}%`, c: fp.avgQuality >= 70 ? "#059669" : "#D97706" }, { l: "Adaptación", v: fp.adaptationRate > 0 ? `+${fp.adaptationRate}` : `${fp.adaptationRate}`, c: fp.adaptationRate > 0 ? "#059669" : "#DC2626" }].map((d, i) => (
              <div key={i} style={{ background: isDark ? "#1A1E28" : "#F8FAFC", borderRadius: 12, padding: "10px" }}>
                <div style={{ fontSize: 10, color: t3 }}>{d.l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: d.c || t1 }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>); })()}

      {/* V-Cores + Mood */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
        <div style={{ background: ac + "06", borderRadius: 14, padding: "14px 12px", border: `1px solid ${ac}10` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}><Icon name="sparkle" size={10} color={ac} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: ac, textTransform: "uppercase" }}>V-Cores</span></div>
          <AN value={st.vCores || 0} color={ac} sz={24} />
        </div>
        <div style={{ background: cd, borderRadius: 14, padding: "14px 12px", border: `1px solid ${bd}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase", marginBottom: 2 }}>Mood</div>
          {avgMood > 0 ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"} size={18} color={MOODS[Math.round(avgMood) - 1]?.color || t3} /><span style={{ fontSize: 20, fontWeight: 800, color: MOODS[Math.round(avgMood) - 1]?.color || t3 }}>{avgMood}</span></div> : <span style={{ fontSize: 11, color: t3 }}>Sin datos</span>}
        </div>
      </div>

      {/* Optimal Time Suggestion */}
      {(() => { const ot = suggestOptimalTime(st); if (!ot || !ot.best) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><Icon name="clock" size={12} color={t3} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase" }}>Hora Óptima</span></div>
          <div style={{ fontSize: 11, color: t2, lineHeight: 1.6 }}>{ot.recommendation}</div>
        </div>); })()}

      {/* Streak Chain Analysis */}
      {(() => { const sc = analyzeStreakChain(st); if (!sc) return null; return (
        <div style={{ background: cd, borderRadius: 16, padding: "14px", marginBottom: 10, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><Icon name="fire" size={12} color="#D97706" /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase" }}>Análisis de Rachas</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#D97706" }}>{sc.maxStreak}d</div><div style={{ fontSize: 9, color: t3 }}>récord</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: t1 }}>{sc.avgStreak}d</div><div style={{ fontSize: 9, color: t3 }}>promedio</div></div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#6366F1" }}>{sc.avgBreakPoint}d</div><div style={{ fontSize: 9, color: t3 }}>punto quiebre</div></div>
          </div>
          <div style={{ fontSize: 10, color: t2, lineHeight: 1.5 }}>{sc.prediction}</div>
        </div>); })()}

      {/* Actions grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <motion.button whileTap={{ scale: .95 }} onClick={onShowSettings} style={{ padding: "14px", borderRadius: 16, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: isDark ? "#1A1E28" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="gear" size={16} color={t3} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: t2 }}>Ajustes</span>
        </motion.button>
        <motion.button whileTap={{ scale: .95 }} onClick={onShowHist} style={{ padding: "14px", borderRadius: 16, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: isDark ? "#1A1E28" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="clock" size={16} color={t3} /></div>
          <span style={{ fontSize: 10, fontWeight: 700, color: t2 }}>Historial</span>
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: .95 }} onClick={onShowCalibration} style={{ width: "100%", padding: "13px", borderRadius: 14, border: `1.5px solid ${ac}20`, background: `linear-gradient(135deg,${ac}08,${ac}03)`, color: ac, fontSize: 11, fontWeight: 700, cursor: "pointer", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="radar" size={14} color={ac} />Recalibrar Baseline Neural</motion.button>
      <button onClick={() => { if (typeof window !== "undefined" && window.confirm("¿Reiniciar todos los datos?")) { setSt({ ...DS, weekNum: getWeekNum() }); } }} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid #FEE2E2", background: isDark ? "#1A0A0A" : "#FFF5F5", color: "#DC2626", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Reiniciar Datos</button>
    </div>
  );
}
