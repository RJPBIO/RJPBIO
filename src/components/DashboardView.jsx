"use client";
/* ═══════════════════════════════════════════════════════════════
   DASHBOARD — NEURAL LAB REPORT
   The output of a premium private clinic: real data, clear hierarchy,
   immediate interpretation. No decoration. Every pixel informs.
   The radar is the load-bearing element.
   ═══════════════════════════════════════════════════════════════ */

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
import { resolveTheme, ty, font, space, radius, layout, semantic, hairline } from "../lib/theme";

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

/* ─── Clinical primitives ─── */
const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

function SectionHeader({ label, color }) {
  return (
    <div style={{ ...CAPS, color, marginBottom: 14, paddingLeft: 2, opacity: 0.9 }}>
      {label}
    </div>
  );
}

function ClinicalCard({ children, isDark, style = {} }) {
  return (
    <div style={{
      background: isDark ? "#141820" : "#FFFFFF",
      borderRadius: radius.lg,
      padding: 20,
      border: hairline(isDark),
      marginBottom: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

function MetricRow({ label, value, unit, color, subtext, isDark, t1, t2, t3 }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: "14px 0", borderBottom: hairline(isDark),
    }}>
      <div>
        <div style={{ ...CAPS, color: t3, marginBottom: 4 }}>{label}</div>
        {subtext && <div style={{ fontSize: 12, fontWeight: 400, color: t2, marginTop: 2 }}>{subtext}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 300, color, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, fontWeight: 400, color: t3, letterSpacing: "0.02em" }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function DashboardView({ st, isDark, ac, switchTab, sp, onShowHist }) {
  const { bg, t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";

  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const bioSignal = useMemo(() => calcBioSignal(st), [st.coherencia, st.resiliencia, st.capacidad, st.moodLog, st.weeklyData, st.history]);
  const burnout = useMemo(() => calcBurnoutIndex(st.moodLog, st.history), [st.moodLog, st.history]);
  const protoSens = useMemo(() => calcProtoSensitivity(st.moodLog), [st.moodLog]);
  const neuralVar = useMemo(() => calcNeuralVariability(st.history), [st.history]);
  const moodTrend = useMemo(() => (st.moodLog || []).slice(-14).map(m => m.mood), [st.moodLog]);
  const avgMood = useMemo(() => {
    const ml = st.moodLog || []; if (!ml.length) return 0;
    return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1);
  }, [st.moodLog]);
  const rD = useMemo(() => {
    const h = st.history || []; if (h.length < 2) return { c: 0, r: 0 };
    return {
      c: h.slice(-1)[0].c - (h.length >= 5 ? h[h.length - 5] : h[0]).c,
      r: h.slice(-1)[0].r - (h.length >= 5 ? h[h.length - 5] : h[0]).r,
    };
  }, [st.history]);
  const noData = st.totalSessions === 0;

  /* ─── Empty state — clinical awaiting ─── */
  if (noData) return (
    <div style={{ padding: `24px 20px ${layout.bottomSafe}px`, minHeight: "100vh" }}>
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ paddingTop: 48, maxWidth: 340, margin: "0 auto" }}
      >
        <div style={{ ...CAPS, color: t3, marginBottom: 16 }}>Informe neural</div>
        <div style={{ fontSize: 24, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
          Sin datos aún.
        </div>
        <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6, marginBottom: 40 }}>
          Una sesión activa seis dimensiones del rendimiento: enfoque, calma, energía, coherencia, resiliencia y capacidad.
        </div>

        <div style={{
          borderTop: hairline(isDark), borderBottom: hairline(isDark),
          padding: "16px 0", marginBottom: 40,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
        }}>
          {["Enfoque", "Calma", "Energía"].map((l, i) => (
            <div key={i}>
              <div style={{ ...CAPS, color: t3, marginBottom: 6 }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 300, color: t3, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", opacity: 0.4 }}>—</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => switchTab("ignicion")}
          style={{
            width: "100%", padding: "16px 24px",
            borderRadius: radius.md, background: teal,
            border: `1px solid ${teal}`, color: "#fff",
            fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
            minHeight: 52, cursor: "pointer",
          }}
        >
          Iniciar primera ignición
        </button>
      </motion.div>
    </div>
  );

  /* ─── Report header — date + executive line ─── */
  const today = new Date();
  const dateStr = today.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  const bioColor = bioSignal.score >= 70 ? teal : bioSignal.score >= 45 ? semantic.warning : semantic.danger;
  const burnColor = burnout.risk === "bajo" ? teal : burnout.risk === "moderado" ? semantic.warning : semantic.danger;

  return (
    <div style={{ padding: `24px 20px ${layout.bottomSafe}px` }}>
      {/* ─── HEADER — clinical report ─── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        style={{ borderBottom: hairline(isDark), paddingBottom: 20, marginBottom: 28 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ ...CAPS, color: t3 }}>Informe Neural</div>
          <div style={{ ...MICRO, color: t3, fontVariantNumeric: "tabular-nums" }}>{dateStr}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <AnimatedNumber value={perf} color={t1} size={56} weight={200} />
          <span style={{ fontSize: 20, fontWeight: 300, color: t3, letterSpacing: "0.02em" }}>%</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: t2, marginLeft: 12, letterSpacing: "0.02em" }}>
            Operador
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6 }}>
          {perf >= 70
            ? "Rendimiento alto. Sistema en rango óptimo."
            : perf >= 50
              ? "Estado funcional. Una sesión elevaría el umbral."
              : "Sistema bajo umbral. Intervención recomendada."}
        </div>
      </motion.div>

      {/* ─── PRIMARY METRICS — executive row ─── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: hairline(isDark), borderBottom: hairline(isDark),
        marginBottom: 32,
      }}>
        {[
          { l: "Semana", v: st.weeklyData.reduce((a, b) => a + b, 0), u: "ses", c: t1 },
          { l: "BioSignal", v: bioSignal.score, u: "", c: bioColor },
          { l: "Burnout", v: burnout.risk === "sin datos" ? "—" : burnout.index, u: "", c: burnColor },
        ].map((m, i) => (
          <div key={i} style={{
            padding: "18px 12px",
            borderLeft: i > 0 ? hairline(isDark) : "none",
            textAlign: "left",
          }}>
            <div style={{ ...CAPS, color: t3, marginBottom: 8 }}>{m.l}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 300, color: m.c, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.v}</span>
              {m.u && <span style={{ fontSize: 10, fontWeight: 500, color: t3, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.u}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ─── NEURAL RADAR — load-bearing element ─── */}
      <SectionHeader label="Radar Neural · tiempo real" color={t3} />
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.28 }}
        style={{ marginBottom: 32 }}
      >
        <NeuralRadar st={st} isDark={isDark} />
      </motion.div>

      {/* ─── AI COACH — recommendation engine ─── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.28 }}
        style={{ marginBottom: 32 }}
      >
        <NeuralCoach st={st} isDark={isDark} onSelectProtocol={sp} />
      </motion.div>

      {/* ─── TRENDS ─── */}
      <SectionHeader label="Tendencias · 7 días" color={t3} />
      <WeeklyReport st={st} isDark={isDark} />
      <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p) => { sp(p); switchTab("ignicion"); }} />

      {/* ─── DIAGNOSTICS ─── */}
      <div style={{ marginTop: 32 }}>
        <SectionHeader label="Diagnóstico profundo" color={t3} />
      </div>

      {/* Neural Variability */}
      {neuralVar && (
        <ClinicalCard isDark={isDark}>
          <MetricRow
            label="Variabilidad Neural"
            value={neuralVar.index}
            color={neuralVar.index < 10 ? teal : neuralVar.index < 20 ? semantic.warning : semantic.danger}
            subtext={`Tendencia ${neuralVar.trend}`}
            isDark={isDark} t1={t1} t2={t2} t3={t3}
          />
          <div style={{ fontSize: 14, fontWeight: 400, color: t2, lineHeight: 1.6, paddingTop: 14 }}>
            {neuralVar.interpretation}
          </div>
        </ClinicalCard>
      )}

      {/* BioSignal / Burnout — two columns, hairline divider */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        background: isDark ? "#141820" : "#FFFFFF",
        border: hairline(isDark), borderRadius: radius.lg,
        marginBottom: 14,
      }}>
        <div style={{ padding: 20, borderRight: hairline(isDark) }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>BioSignal</div>
          <div style={{ fontSize: 32, fontWeight: 300, color: bioColor, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {bioSignal.score}
          </div>
          <div style={{ fontSize: 13, fontWeight: 400, color: t2, marginTop: 10, letterSpacing: "0.01em" }}>
            {bioSignal.score >= 70 ? "Alto rendimiento" : bioSignal.score >= 45 ? "Funcional" : "Intervención"}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>Burnout</div>
          <div style={{ fontSize: 32, fontWeight: 300, color: burnColor, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {burnout.index}
          </div>
          <div style={{ fontSize: 13, fontWeight: 400, color: t2, marginTop: 10, letterSpacing: "0.01em" }}>
            Riesgo {burnout.risk}
          </div>
        </div>
      </div>

      {/* Mood Trend */}
      {moodTrend.length >= 2 && (
        <ClinicalCard isDark={isDark} style={{ padding: "20px 20px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ ...CAPS, color: t3 }}>Tendencia Emocional</div>
            <div style={{ fontSize: 20, fontWeight: 300, color: MOODS[Math.round(avgMood) - 1]?.color || t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
              {avgMood}<span style={{ fontSize: 11, fontWeight: 500, color: t3, letterSpacing: "0.08em" }}>/5</span>
            </div>
          </div>
          <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
        </ClinicalCard>
      )}

      {/* Heatmap */}
      <ClinicalCard isDark={isDark} style={{ padding: "20px 20px 14px" }}>
        <div style={{ ...CAPS, color: t3, marginBottom: 14 }}>Actividad · 28 días</div>
        <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={teal} />
      </ClinicalCard>

      {/* Energy Flow */}
      {st.history?.length >= 3 && (
        <ClinicalCard isDark={isDark} style={{ padding: "20px 20px 14px" }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 14 }}>Flujo de Energía</div>
          <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={teal} />
        </ClinicalCard>
      )}

      {/* Protocol Sensitivity */}
      {Object.keys(protoSens).length >= 2 && (
        <ClinicalCard isDark={isDark}>
          <div style={{ ...CAPS, color: t3, marginBottom: 12 }}>Sensibilidad por Protocolo</div>
          {Object.entries(protoSens).sort((a, b) => b[1].avgDelta - a[1].avgDelta).slice(0, 5).map(([name, data], i, arr) => (
            <div key={i} style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
            }}>
              <span style={{ fontSize: 14, fontWeight: 400, color: t1, letterSpacing: "-0.01em" }}>{name}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{
                  fontSize: 18, fontWeight: 300, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums",
                  color: data.avgDelta > 0 ? teal : semantic.danger,
                }}>
                  {data.avgDelta > 0 ? "+" : ""}{data.avgDelta}
                </span>
                <span style={{ ...MICRO, color: t3 }}>{data.sessions}×</span>
              </div>
            </div>
          ))}
        </ClinicalCard>
      )}

      {/* Weekly chart */}
      <ClinicalCard isDark={isDark} style={{ padding: "20px 20px 14px" }}>
        <div style={{ ...CAPS, color: t3, marginBottom: 14 }}>Esta Semana</div>
        <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={teal} />
      </ClinicalCard>

      {/* Metrics grid — clinical row style, no shadows */}
      <div style={{
        background: isDark ? "#141820" : "#FFFFFF",
        border: hairline(isDark), borderRadius: radius.lg,
        marginBottom: 14,
      }}>
        {[
          { l: "Enfoque", v: st.coherencia, d: rD.c > 0 ? `+${rD.c}` : null, u: "%", c: t1 },
          { l: "Calma", v: st.resiliencia, d: rD.r > 0 ? `+${rD.r}` : null, u: "%", c: t1 },
          { l: "V-Cores", v: st.vCores || 0, d: (st.history?.slice(-1)[0]?.vc ? `+${st.history.slice(-1)[0].vc}` : null), u: "", c: t1 },
          { l: "Sesiones", v: st.totalSessions, d: `${st.streak}d cadena`, u: "", c: t1 },
        ].map((k, i, arr) => (
          <div key={i} style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
          }}>
            <div>
              <div style={{ ...CAPS, color: t3, marginBottom: 6 }}>{k.l}</div>
              {k.d && <div style={{ fontSize: 11, fontWeight: 500, color: teal, letterSpacing: "0.04em" }}>{k.d}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 26, fontWeight: 300, color: k.c, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{k.v}</span>
              {k.u && <span style={{ fontSize: 12, fontWeight: 400, color: t3 }}>{k.u}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* History link — hairline row */}
      <button
        onClick={onShowHist}
        style={{
          width: "100%", padding: "14px 20px",
          borderRadius: radius.md, border: hairline(isDark),
          background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20, minHeight: 52,
        }}
      >
        <span style={{ ...CAPS, color: t2 }}>Historial completo</span>
        <span style={{ fontSize: 13, fontWeight: 400, color: t3, fontVariantNumeric: "tabular-nums" }}>
          {(st.history || []).length} registros
        </span>
      </button>

      {/* Achievements — if any */}
      {st.achievements.length > 0 && (
        <div style={{
          borderTop: hairline(isDark), paddingTop: 20,
        }}>
          <div style={{ ...CAPS, color: t3, marginBottom: 12 }}>Reconocimientos</div>
          {st.achievements.map(a => (
            <div key={a} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              fontSize: 13, fontWeight: 400, color: t2, letterSpacing: "0.01em",
            }}>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: teal }} />
              {AM[a] || a}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
