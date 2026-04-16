"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import { MOODS, AM } from "../lib/constants";
import {
  calcBioSignal, calcBurnoutIndex, calcProtoSensitivity,
  calcNeuralVariability,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, layout, semantic } from "../lib/theme";

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

export default function DashboardView({ st, isDark, ac, switchTab, sp, onShowHist }) {
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

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
    <div style={{ padding: `14px 20px ${layout.bottomSafe}px` }}>
      <div style={{ padding: "40px 20px" }}>
        {/* Preview of what they'll unlock */}
        <div style={{ textAlign: "center", marginBottom: space[5] }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: `0 auto ${space[3]}px`, display: "block" }}>
              <circle cx="32" cy="32" r="30" fill="none" stroke={ac} strokeWidth="1.5" opacity=".15" />
              <circle cx="32" cy="32" r="22" fill="none" stroke={ac} strokeWidth="1" strokeDasharray="4 6" opacity=".2" />
              <circle cx="32" cy="32" r="6" fill={ac} opacity=".2" />
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return <circle key={i} cx={32 + Math.cos(rad) * 22} cy={32 + Math.sin(rad) * 22} r="3" fill={["#3B82F6", "#059669", "#D97706", "#8B5CF6", "#0D9488", "#EC4899"][i]} opacity=".4" />;
              })}
            </svg>
          </motion.div>
          <div style={ty.heroHeading(t1)}>Tu radar neural</div>
          <div style={{ ...ty.body(t3), maxWidth: 260, margin: `${space[1.5]}px auto 0` }}>Una sesión activa 6 dimensiones de tu rendimiento cognitivo.</div>
        </div>
        {/* Preview cards — what metrics they'll see */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space[1.5], marginBottom: space[5], opacity: 0.5 }}>
          {[{ l: "Enfoque", c: "#3B82F6" }, { l: "Calma", c: "#8B5CF6" }, { l: "Energía", c: "#6366F1" }].map((m, i) => (
            <div key={i} style={{ background: withAlpha(m.c, 4), borderRadius: radius.sm + 3, padding: `${space[2.5]}px ${space[1]}px`, textAlign: "center" }}>
              <div style={{ fontSize: font.size.lg, fontWeight: font.weight.black, color: m.c }}>—%</div>
              <div style={{ ...ty.caption(t3), marginTop: 1 }}>{m.l}</div>
            </div>))}
        </div>
        <motion.button whileTap={{ scale: .95 }} onClick={() => switchTab("ignicion")} style={{ width: "100%", maxWidth: 280, margin: "0 auto", display: "flex", padding: `${space[3]}px ${space[5]}px`, borderRadius: radius.full, background: `linear-gradient(135deg,${ac},#0D9488)`, border: "none", color: "#fff", ...ty.button, cursor: "pointer", alignItems: "center", justifyContent: "center", gap: space[2], boxShadow: `0 4px 18px ${withAlpha(ac, 10)}` }}><Icon name="bolt" size={13} color="#fff" />PRIMERA IGNICIÓN</motion.button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: `14px 20px ${layout.bottomSafe}px` }}>
      {/* Executive Summary — Hero card */}
      <div style={{ background: `linear-gradient(145deg,${isDark ? "#0D1117" : "#FFFFFF"},${isDark ? "#141820" : ac + "06"})`, borderRadius: 22, padding: "20px 18px", marginBottom: 16, border: `1.5px solid ${ac}15`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${ac}10,transparent)`, filter: "blur(20px)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
          <div><div style={{ ...ty.label(t3), marginBottom: space[1] }}>Rendimiento Neural</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: space[1] }}><span style={ty.metric(t1, font.size["4xl"])}>{perf}</span><span style={ty.caption(t3)}>%</span></div></div>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${ac}15,${ac}08)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${ac}15` }}>
            <Icon name={perf >= 70 ? "shield" : perf >= 50 ? "gauge" : "alert"} size={22} color={ac} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[{ v: st.weeklyData.reduce((a, b) => a + b, 0), l: "Semana", c: ac }, { v: bioSignal.score, l: "BioSignal", c: bioSignal.score >= 70 ? semantic.success : bioSignal.score >= 45 ? semantic.warning : semantic.danger }, { v: burnout.risk === "sin datos" ? "—" : burnout.index, l: "Burnout", c: burnout.risk === "bajo" ? semantic.success : semantic.danger }].map((m, i) => (
            <div key={i} style={{ textAlign: "center", padding: `${space[2]}px ${space[1]}px`, background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: radius.md }}>
              <div style={ty.metric(m.c, font.size.xl)}>{m.v}</div>
              <div style={{ ...ty.label(t3), fontSize: font.size.xs, letterSpacing: font.tracking.wider, marginTop: 2 }}>{m.l}</div>
            </div>))}
        </div>
        <div style={{ ...ty.body(t2), padding: `${space[2]}px ${space[2.5]}px`, background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: radius.sm, textAlign: "center" }}>{perf >= 70 ? "Rendimiento alto. Mantén tu ritmo." : perf >= 50 ? "Estado funcional. Una sesión más elevaría tu rendimiento." : "Tu sistema necesita atención. Prioriza un reset."}</div>
      </div>

      {/* ─── PRIMARY: Real-time state ─── */}
      <div style={{ marginBottom: 14 }}><NeuralRadar st={st} isDark={isDark} /></div>
      <NeuralCoach st={st} isDark={isDark} onSelectProtocol={sp} />

      {/* ─── SECONDARY: Trends & patterns ─── */}
      <div style={{ ...ty.label(t3), marginBottom: space[2], marginTop: space[1], paddingLeft: 2 }}>TENDENCIAS</div>
      <WeeklyReport st={st} isDark={isDark} />
      <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p) => { sp(p); switchTab("ignicion"); }} />

      {/* ─── TERTIARY: Deep analytics ─── */}
      <div style={{ ...ty.label(t3), marginBottom: space[2], marginTop: space[1], paddingLeft: 2 }}>ANÁLISIS PROFUNDO</div>

      {/* Neural Variability Index */}
      {neuralVar && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="predict" size={12} color={t3} /><span style={ty.label(t3)}>Variabilidad Neural</span></div>
          <span style={ty.metric(neuralVar.index < 10 ? semantic.success : neuralVar.index < 20 ? semantic.warning : semantic.danger, font.size.xl)}>{neuralVar.index}</span>
        </div>
        <div style={ty.body(t2)}>{neuralVar.interpretation}</div>
        <div style={{ ...ty.caption(t3), marginTop: space[1] }}>Tendencia: <span style={{ fontWeight: font.weight.bold, color: neuralVar.trend === "ascendente" ? semantic.success : neuralVar.trend === "descendente" ? semantic.danger : t3 }}>{neuralVar.trend}</span></div>
      </div>}

      {/* BioSignal + Burnout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
        <div style={{ background: `linear-gradient(145deg,${cd},${(bioSignal.score >= 70 ? semantic.success : bioSignal.score >= 45 ? semantic.warning : semantic.danger) + "06"})`, borderRadius: 18, padding: "16px 14px", border: `1px solid ${bd}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: (bioSignal.score >= 70 ? semantic.success : semantic.warning) + "08" }} />
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[1.5] }}><Icon name="shield" size={12} color={bioSignal.score >= 70 ? semantic.success : semantic.warning} /><span style={ty.label(t3)}>BioSignal</span></div>
          <AnimatedNumber value={bioSignal.score} color={bioSignal.score >= 70 ? semantic.success : bioSignal.score >= 45 ? semantic.warning : semantic.danger} size={28} />
          <div style={{ ...ty.caption(t2), marginTop: space[1.5] }}>{bioSignal.score >= 70 ? "Rendimiento alto" : bioSignal.score >= 45 ? "Estado funcional" : "Intervención activa"}</div>
        </div>
        <div style={{ background: `linear-gradient(145deg,${cd},${(burnout.risk === "bajo" ? semantic.success : semantic.danger) + "06"})`, borderRadius: 18, padding: "16px 14px", border: `1px solid ${burnout.risk === "crítico" || burnout.risk === "alto" ? ${semantic.danger + "15"} : bd}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -10, right: -10, width: 40, height: 40, borderRadius: "50%", background: (burnout.risk === "bajo" ? semantic.success : semantic.danger) + "08" }} />
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[1.5] }}><Icon name="alert-triangle" size={12} color={burnout.risk === "bajo" ? semantic.success : semantic.danger} /><span style={ty.label(t3)}>Burnout</span></div>
          <AnimatedNumber value={burnout.index} color={burnout.risk === "bajo" ? semantic.success : burnout.risk === "moderado" ? semantic.warning : semantic.danger} size={28} />
          <div style={{ ...ty.caption(burnout.risk === "bajo" ? semantic.success : semantic.danger), fontWeight: font.weight.bold, marginTop: space[1.5] }}>Riesgo {burnout.risk}</div>
        </div>
      </div>

      {/* Mood Trend */}
      {moodTrend.length >= 2 && <div style={{ background: cd, borderRadius: 16, padding: "12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={ty.label(t3)}>Tendencia Emocional</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Icon name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"} size={12} color={MOODS[Math.round(avgMood) - 1]?.color || t3} />
            <span style={ty.title(MOODS[Math.round(avgMood) - 1]?.color || t3)}>{avgMood}/5</span>
          </div>
        </div>
        <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
      </div>}

      {/* Activity Heatmap */}
      <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ ...ty.label(t3), marginBottom: space[2.5] }}>Actividad · 28 días</div>
        <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={ac} />
      </div>

      {/* Energy Flow */}
      {st.history?.length >= 3 && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ ...ty.label(t3), marginBottom: space[2.5] }}>Flujo de Energía</div>
        <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={ac} />
      </div>}

      {/* Protocol Sensitivity */}
      {Object.keys(protoSens).length >= 2 && <div style={{ background: cd, borderRadius: 16, padding: "14px 12px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBottom: space[2] }}><Icon name="fingerprint" size={11} color={t3} /><span style={ty.label(t3)}>Sensibilidad por Protocolo</span></div>
        {Object.entries(protoSens).sort((a, b) => b[1].avgDelta - a[1].avgDelta).slice(0, 5).map(([name, data], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${bd}` : "none" }}>
            <span style={ty.caption(t1)}>{name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...ty.title(data.avgDelta > 0 ? semantic.success : semantic.danger), fontWeight: font.weight.black }}>{data.avgDelta > 0 ? "+" : ""}{data.avgDelta}</span>
              <span style={ty.caption(t3)}>{data.sessions}x</span>
            </div>
          </div>))}
      </div>}

      {/* Weekly chart */}
      <div style={{ background: cd, borderRadius: 16, padding: "12px 10px", marginBottom: 14, border: `1px solid ${bd}` }}>
        <div style={{ ...ty.label(t3), marginBottom: space[2] }}>Esta Semana</div>
        <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={ac} />
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[{ l: "Enfoque", v: st.coherencia, d: rD.c > 0 ? "+" + rD.c + "%" : "—", c: "#3B82F6", ic: "focus" }, { l: "Calma", v: st.resiliencia, d: rD.r > 0 ? "+" + rD.r + "%" : "—", c: "#8B5CF6", ic: "calm" }, { l: "V-Cores", v: st.vCores || 0, d: "+" + (st.history?.slice(-1)[0]?.vc || 0), c: "#D97706", ic: "sparkle" }, { l: "Sesiones", v: st.totalSessions, d: st.streak + "d racha", c: "#059669", ic: "bolt" }].map((k, i) => (
          <div key={i} style={{ background: cd, borderRadius: 14, padding: "11px 10px", border: `1px solid ${bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: space[1] }}><div style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon name={k.ic} size={10} color={t3} /><span style={ty.caption(t3)}>{k.l}</span></div><span style={{ ...ty.caption("#059669"), fontWeight: font.weight.bold }}>{k.d}</span></div>
            <AnimatedNumber value={k.v} suffix={k.l === "Enfoque" || k.l === "Calma" ? "%" : ""} color={k.c} size={20} />
          </div>))}
      </div>

      <motion.button whileTap={{ scale: .97 }} onClick={onShowHist} style={{ width: "100%", padding: `${space[3]}px`, borderRadius: radius.md, border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: space[1.5], marginBottom: space[4] }}><Icon name="clock" size={13} color={t3} /><span style={ty.caption(t2)}>Historial ({(st.history || []).length})</span></motion.button>
      {st.achievements.length > 0 && <div style={{ background: withAlpha(ac, 2), borderRadius: radius.lg, padding: `${space[3]}px ${space[2.5]}px`, border: `1px solid ${withAlpha(ac, 10)}` }}><div style={{ display: "flex", alignItems: "center", gap: space[1.5], marginBottom: space[1] }}><Icon name="trophy" size={14} color={ac} /><span style={ty.title(ac)}>Logros</span></div>{st.achievements.map(a => <div key={a} style={{ ...ty.caption(ac), padding: "2px 0", display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 3, height: 3, borderRadius: radius.full, background: ac }} />{AM[a] || a}</div>)}</div>}
    </div>
  );
}
