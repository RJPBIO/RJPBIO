"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Icon from "./Icon";
import { MOODS, AM } from "../lib/constants";
import {
  calcBioSignal, calcBurnoutIndex, calcProtoSensitivity,
  calcNeuralVariability,
} from "../lib/neural";

const NeuralRadar = dynamic(() => import("./NeuralRadar"), { ssr: false });
const NeuralCoach = dynamic(() => import("./NeuralCoach"), { ssr: false });
const WeeklyReport = dynamic(() => import("./WeeklyReport"), { ssr: false });
const CorrelationMatrix = dynamic(() => import("./CorrelationMatrix"), { ssr: false });
const TemporalCharts = dynamic(() => import("./TemporalCharts").then(mod => ({
  default: ({ type, ...props }) => {
    if (type === "mood") return <mod.MoodTrendChart {...props} />;
    if (type === "energy") return <mod.EnergyFlowChart {...props} />;
    if (type === "heatmap") return <mod.ActivityHeatmap {...props} />;
    if (type === "weekly") return <mod.WeeklyChart {...props} />;
    if (type === "sparkline") return <mod.CoherenceSparkline {...props} />;
    return null;
  }
})), { ssr: false });

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

export default function DashboardView({ st, isDark, ac, switchTab, sp, onShowHist }) {
  const bg = isDark ? "#0B0E14" : "#F1F4F9";
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const bioSignal = useMemo(() => calcBioSignal(st), [st.coherencia, st.resiliencia, st.capacidad, st.moodLog, st.weeklyData, st.history]);
  const burnout = useMemo(() => calcBurnoutIndex(st.moodLog, st.history), [st.moodLog, st.history]);
  const protoSens = useMemo(() => calcProtoSensitivity(st.moodLog), [st.moodLog]);
  const neuralVar = useMemo(() => calcNeuralVariability(st.history), [st.history]);
  const moodTrend = useMemo(() => (st.moodLog || []).slice(-14).map(m => m.mood), [st.moodLog]);
  const avgMood = useMemo(() => { const ml = st.moodLog || []; if (!ml.length) return 0; return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1); }, [st.moodLog]);
  const rD = useMemo(() => { const h = st.history || []; if (h.length < 2) return { c: 0, r: 0 }; return { c: h.slice(-1)[0].c - (h.length >= 5 ? h[h.length - 5] : h[0]).c, r: h.slice(-1)[0].r - (h.length >= 5 ? h[h.length - 5] : h[0]).r }; }, [st.history]);
  const noData = st.totalSessions === 0;

  if (noData) return (
    <div style={{ padding: "14px 20px 180px" }}>
      <div style={{ textAlign: "center", padding: "50px 20px" }}>
        <Icon name="bolt" size={34} color={ac} />
        <div style={{ fontSize: 15, fontWeight: 800, color: t1, marginTop: 10, marginBottom: 5 }}>Tu dashboard te espera</div>
        <div style={{ fontSize: 11, color: t3, marginBottom: 18 }}>Completa tu primera ignición para ver tus métricas neurales.</div>
        <motion.button whileTap={{ scale: .95 }} onClick={() => switchTab("ignicion")} style={{ padding: "11px 28px", borderRadius: 50, background: ac, border: "none", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}>IR A IGNICIÓN</motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "14px 20px 180px" }}>
      {/* Executive Summary — Hero card */}
      <div style={{ background: `linear-gradient(145deg,${isDark ? "#0D1117" : "#FFFFFF"},${isDark ? "#141820" : ac + "06"})`, borderRadius: 22, padding: "20px 18px", marginBottom: 16, border: `1.5px solid ${ac}15`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${ac}10,transparent)`, filter: "blur(20px)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
          <div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase", marginBottom: 4 }}>Rendimiento Neural</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontSize: 34, fontWeight: 800, color: t1, letterSpacing: "-2px" }}>{perf}</span><span style={{ fontSize: 14, fontWeight: 600, color: t3 }}>%</span></div></div>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${ac}15,${ac}08)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${ac}15` }}>
            <Icon name={perf >= 70 ? "shield" : perf >= 50 ? "gauge" : "alert"} size={22} color={ac} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[{ v: st.weeklyData.reduce((a, b) => a + b, 0), l: "Semana", c: ac }, { v: bioSignal.score, l: "BioSignal", c: bioSignal.score >= 70 ? "#059669" : bioSignal.score >= 45 ? "#D97706" : "#DC2626" }, { v: burnout.risk === "sin datos" ? "—" : burnout.index, l: "Burnout", c: burnout.risk === "bajo" ? "#059669" : "#DC2626" }].map((m, i) => (
            <div key={i} style={{ textAlign: "center", padding: "8px 4px", background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, color: t3, fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{m.l}</div>
            </div>))}
        </div>
        <div style={{ fontSize: 11, color: t2, lineHeight: 1.5, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 10, textAlign: "center" }}>{perf >= 70 ? "Rendimiento alto. Mantén tu ritmo." : perf >= 50 ? "Estado funcional. Una sesión más elevaría tu rendimiento." : "Tu sistema necesita atención. Prioriza un reset."}</div>
      </div>

      <div style={{ marginBottom: 14 }}><NeuralRadar st={st} isDark={isDark} /></div>
      <NeuralCoach st={st} isDark={isDark} onSelectProtocol={sp} />
      <WeeklyReport st={st} isDark={isDark} />
      <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p) => { sp(p); switchTab("ignicion"); }} />

      {/* Neural Variability Index */}
      {neuralVar && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="predict" size={12} color={t3} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>Variabilidad Neural</span></div>
          <span style={{ fontSize: 18, fontWeight: 800, color: neuralVar.index < 10 ? "#059669" : neuralVar.index < 20 ? "#D97706" : "#DC2626" }}>{neuralVar.index}</span>
        </div>
        <div style={{ fontSize: 11, color: t2, lineHeight: 1.5 }}>{neuralVar.interpretation}</div>
        <div style={{ fontSize: 10, color: t3, marginTop: 4 }}>Tendencia: <span style={{ fontWeight: 700, color: neuralVar.trend === "ascendente" ? "#059669" : neuralVar.trend === "descendente" ? "#DC2626" : t3 }}>{neuralVar.trend}</span></div>
      </div>}

      {/* BioSignal + Burnout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
        <div style={{ background: `linear-gradient(145deg,${cd},${(bioSignal.score >= 70 ? "#059669" : bioSignal.score >= 45 ? "#D97706" : "#DC2626") + "06"})`, borderRadius: 18, padding: "16px 14px", border: `1px solid ${bd}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: (bioSignal.score >= 70 ? "#059669" : "#D97706") + "08" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><Icon name="shield" size={12} color={bioSignal.score >= 70 ? "#059669" : "#D97706"} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>BioSignal</span></div>
          <AN value={bioSignal.score} color={bioSignal.score >= 70 ? "#059669" : bioSignal.score >= 45 ? "#D97706" : "#DC2626"} sz={28} />
          <div style={{ fontSize: 10, color: t2, marginTop: 6, lineHeight: 1.4 }}>{bioSignal.score >= 70 ? "Rendimiento alto" : bioSignal.score >= 45 ? "Estado funcional" : "Intervención activa"}</div>
        </div>
        <div style={{ background: `linear-gradient(145deg,${cd},${(burnout.risk === "bajo" ? "#059669" : "#DC2626") + "06"})`, borderRadius: 18, padding: "16px 14px", border: `1px solid ${burnout.risk === "crítico" || burnout.risk === "alto" ? "#DC262615" : bd}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: (burnout.risk === "bajo" ? "#059669" : "#DC2626") + "08" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><Icon name="alert-triangle" size={12} color={burnout.risk === "bajo" ? "#059669" : "#DC2626"} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>Burnout</span></div>
          <AN value={burnout.index} color={burnout.risk === "bajo" ? "#059669" : burnout.risk === "moderado" ? "#D97706" : "#DC2626"} sz={28} />
          <div style={{ fontSize: 10, color: burnout.risk === "bajo" ? "#059669" : "#DC2626", fontWeight: 700, marginTop: 6 }}>Riesgo {burnout.risk}</div>
        </div>
      </div>

      {/* Mood Trend */}
      {moodTrend.length >= 2 && <div style={{ background: cd, borderRadius: 16, padding: "12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>Tendencia Emocional</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Icon name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"} size={12} color={MOODS[Math.round(avgMood) - 1]?.color || t3} />
            <span style={{ fontSize: 12, fontWeight: 800, color: MOODS[Math.round(avgMood) - 1]?.color || t3 }}>{avgMood}/5</span>
          </div>
        </div>
        <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
      </div>}

      {/* Activity Heatmap */}
      <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase", marginBottom: 10 }}>Actividad · 28 días</div>
        <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={ac} />
      </div>

      {/* Energy Flow */}
      {st.history?.length >= 3 && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase", marginBottom: 10 }}>Flujo de Energía</div>
        <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={ac} />
      </div>}

      {/* Protocol Sensitivity */}
      {Object.keys(protoSens).length >= 2 && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><Icon name="fingerprint" size={11} color={t3} /><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: t3, textTransform: "uppercase" }}>Sensibilidad por Protocolo</span></div>
        {Object.entries(protoSens).sort((a, b) => b[1].avgDelta - a[1].avgDelta).slice(0, 5).map(([name, data], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${bd}` : "none" }}>
            <span style={{ fontSize: 11, color: t1, fontWeight: 600 }}>{name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: data.avgDelta > 0 ? "#059669" : "#DC2626" }}>{data.avgDelta > 0 ? "+" : ""}{data.avgDelta}</span>
              <span style={{ fontSize: 10, color: t3 }}>{data.sessions}x</span>
            </div>
          </div>))}
      </div>}

      {/* Weekly chart */}
      <div style={{ background: cd, borderRadius: 16, padding: "12px 10px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: t3, textTransform: "uppercase", marginBottom: 8 }}>Esta Semana</div>
        <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={ac} />
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[{ l: "Enfoque", v: st.coherencia, d: rD.c > 0 ? "+" + rD.c + "%" : "—", c: "#3B82F6", ic: "focus" }, { l: "Calma", v: st.resiliencia, d: rD.r > 0 ? "+" + rD.r + "%" : "—", c: "#8B5CF6", ic: "calm" }, { l: "V-Cores", v: st.vCores || 0, d: "+" + (st.history?.slice(-1)[0]?.vc || 0), c: "#D97706", ic: "sparkle" }, { l: "Sesiones", v: st.totalSessions, d: st.streak + "d racha", c: "#059669", ic: "bolt" }].map((k, i) => (
          <div key={i} style={{ background: cd, borderRadius: 14, padding: "11px 10px", border: `1px solid ${bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon name={k.ic} size={10} color={t3} /><span style={{ fontSize: 10, fontWeight: 700, color: t3 }}>{k.l}</span></div><span style={{ fontSize: 10, fontWeight: 700, color: "#059669" }}>{k.d}</span></div>
            <AN value={k.v} sfx={k.l === "Enfoque" || k.l === "Calma" ? "%" : ""} color={k.c} sz={20} />
          </div>))}
      </div>

      <motion.button whileTap={{ scale: .97 }} onClick={onShowHist} style={{ width: "100%", padding: "11px", borderRadius: 13, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}><Icon name="clock" size={13} color={t3} /><span style={{ fontSize: 10, fontWeight: 700, color: t2 }}>Historial ({(st.history || []).length})</span></motion.button>
      {st.achievements.length > 0 && <div style={{ background: ac + "05", borderRadius: 16, padding: "12px 10px", border: `1px solid ${ac}10` }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}><Icon name="trophy" size={14} color={ac} /><span style={{ fontSize: 11, fontWeight: 800, color: ac }}>Logros</span></div>{st.achievements.map(a => <div key={a} style={{ fontSize: 10, color: ac, padding: "2px 0", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}><div style={{ width: 3, height: 3, borderRadius: "50%", background: ac }} />{AM[a] || a}</div>)}</div>}
    </div>
  );
}
