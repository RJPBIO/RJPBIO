"use client";
/* ═══════════════════════════════════════════════════════════════
   DASHBOARD VIEW — Panel ejecutivo con ReadinessRing
   ═══════════════════════════════════════════════════════════════
   - ReadinessRing nuevo como hero glance-able.
   - Semántica: region/article/landmarks + aria-label por métrica.
   - Reduced-motion aware en botones y transiciones.
   - Tokens: semantic color map en lugar de hexes literales.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Icon from "./Icon";
import AnimatedNumber from "./AnimatedNumber";
import ReadinessRing from "./ReadinessRing";
import BioSparkline from "./BioSparkline";
import { MOODS, AM } from "../lib/constants";
import {
  calcBioSignal, calcBurnoutIndex, calcProtoSensitivity,
  calcNeuralVariability,
} from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

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

function colorForScore(score, goodThreshold = 70, mediumThreshold = 45) {
  if (score >= goodThreshold) return semantic.success;
  if (score >= mediumThreshold) return semantic.warning;
  return semantic.danger;
}

export default function DashboardView({ st, isDark, ac, switchTab, sp, onShowHist }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const reduced = useReducedMotion();

  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const bioSignal = useMemo(() => calcBioSignal(st), [st.coherencia, st.resiliencia, st.capacidad, st.moodLog, st.weeklyData, st.history]);
  const burnout = useMemo(() => calcBurnoutIndex(st.moodLog, st.history), [st.moodLog, st.history]);
  const protoSens = useMemo(() => calcProtoSensitivity(st.moodLog), [st.moodLog]);
  const neuralVar = useMemo(() => calcNeuralVariability(st.history), [st.history]);
  const moodTrend = useMemo(() => (st.moodLog || []).slice(-14).map(m => m.mood), [st.moodLog]);
  const avgMood = useMemo(() => {
    const ml = st.moodLog || [];
    if (!ml.length) return 0;
    return +(ml.slice(-7).reduce((a, m) => a + m.mood, 0) / Math.min(ml.length, 7)).toFixed(1);
  }, [st.moodLog]);
  const rD = useMemo(() => {
    const h = st.history || [];
    if (h.length < 2) return { c: 0, r: 0 };
    return {
      c: h.slice(-1)[0].c - (h.length >= 5 ? h[h.length - 5] : h[0]).c,
      r: h.slice(-1)[0].r - (h.length >= 5 ? h[h.length - 5] : h[0]).r,
    };
  }, [st.history]);
  const perfTrend = useMemo(() => {
    const h = (st.history || []).slice(-14);
    if (h.length < 3) return [];
    return h.map((s) => Math.round(((s.c ?? 50) + (s.r ?? 50)) / 2));
  }, [st.history]);
  const noData = st.totalSessions === 0;
  const bioColor = colorForScore(bioSignal.score, 70, 45);
  const burnoutColor = burnout.risk === "bajo" ? semantic.success : burnout.risk === "moderado" ? semantic.warning : semantic.danger;

  if (noData) {
    return (
      <section role="region" aria-label="Dashboard vacío" style={{ paddingBlock: `${space[3.5] || 14}px`, paddingInline: space[5], paddingBlockEnd: 180 }}>
        <div style={{ textAlign: "center", paddingBlock: 50, paddingInline: space[5] }}>
          <Icon name="bolt" size={34} color={ac} aria-hidden="true" />
          <h2 style={{ ...ty.heading(t1), marginBlockStart: space[2.5], marginBlockEnd: space[1] }}>
            Tu dashboard te espera
          </h2>
          <p style={{ ...ty.body(t3), marginBlockEnd: space[5] }}>
            Completa tu primera ignición para ver tus métricas neurales.
          </p>
          <motion.button
            whileTap={reduced ? {} : { scale: .95 }}
            onClick={() => switchTab("ignicion")}
            aria-label="Ir a la pestaña de ignición para empezar"
            style={{
              paddingBlock: space[3],
              paddingInline: space[7],
              borderRadius: radius.full,
              background: ac,
              border: "none",
              color: "#fff",
              ...ty.button,
            }}
          >
            IR A IGNICIÓN
          </motion.button>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label="Dashboard neural"
      style={{ paddingBlock: 14, paddingInline: space[5], paddingBlockEnd: 180 }}
    >
      <div style={{ marginBlockEnd: space[4] }}>
        <ReadinessRing
          focusScore={st.coherencia}
          calmScore={st.resiliencia}
          energyScore={st.capacidad}
          isDark={isDark}
        />
      </div>

      <article
        aria-label={`Rendimiento neural ${perf}%`}
        style={{
          background: `linear-gradient(145deg,${isDark ? "#0D1117" : "#FFFFFF"},${isDark ? "#141820" : withAlpha(ac, 4)})`,
          borderRadius: radius["2xl"] - 6,
          padding: `${space[5]}px ${space[4] + 2}px`,
          marginBlockEnd: space[4],
          border: `1.5px solid ${withAlpha(ac, 10)}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            insetBlockStart: -30,
            insetInlineEnd: -30,
            inlineSize: 120,
            blockSize: 120,
            borderRadius: "50%",
            background: `radial-gradient(circle,${withAlpha(ac, 8)},transparent)`,
            filter: "blur(20px)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: space[3.5] || 14, position: "relative" }}>
          <div>
            <div style={{ ...ty.label(t3), marginBlockEnd: space[1] }}>Rendimiento Neural</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: space[1] }}>
              <span style={ty.metric(t1, font.size["4xl"])}>{perf}</span>
              <span style={ty.caption(t3)}>%</span>
            </div>
          </div>
          <div
            aria-hidden="true"
            style={{
              inlineSize: 52, blockSize: 52,
              borderRadius: radius.lg,
              background: `linear-gradient(135deg,${withAlpha(ac, 10)},${withAlpha(ac, 6)})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${withAlpha(ac, 10)}`,
            }}
          >
            <Icon name={perf >= 70 ? "shield" : perf >= 50 ? "gauge" : "alert"} size={22} color={ac} />
          </div>
        </div>
        <div
          role="group"
          aria-label="Resumen semanal"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space[2], marginBlockEnd: space[3] }}
        >
          {[
            { v: st.weeklyData.reduce((a, b) => a + b, 0), l: "Semana", c: ac, aria: `Sesiones esta semana: ${st.weeklyData.reduce((a, b) => a + b, 0)}` },
            { v: bioSignal.score, l: "BioSignal", c: bioColor, aria: `BioSignal: ${bioSignal.score} por ciento` },
            { v: burnout.risk === "sin datos" ? "—" : burnout.index, l: "Burnout", c: burnout.risk === "bajo" ? semantic.success : semantic.danger, aria: `Índice de burnout: ${burnout.index}, riesgo ${burnout.risk}` },
          ].map((m, i) => (
            <div
              key={i}
              role="group"
              aria-label={m.aria}
              style={{
                textAlign: "center",
                paddingBlock: space[2],
                paddingInline: space[1],
                background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
                borderRadius: radius.md,
              }}
            >
              <div style={ty.metric(m.c, font.size.xl)}>{m.v}</div>
              <div style={{ ...ty.label(t3), fontSize: font.size.xs, letterSpacing: font.tracking.wider, marginBlockStart: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>
        {perfTrend.length >= 3 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: space[2],
              marginBlockEnd: space[2],
              paddingInline: space[1],
            }}
          >
            <span style={{ ...ty.label(t3), fontSize: font.size.xs, flexShrink: 0 }}>
              Trayectoria
            </span>
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
              <BioSparkline
                data={perfTrend}
                width={200}
                height={28}
                color={bioColor}
                ariaLabel={`Trayectoria de rendimiento últimas ${perfTrend.length} sesiones`}
              />
            </div>
          </div>
        )}
        <div
          style={{
            ...ty.body(t2),
            paddingBlock: space[2],
            paddingInline: space[2.5],
            background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
            borderRadius: radius.sm,
            textAlign: "center",
          }}
        >
          {perf >= 70 ? "Rendimiento alto. Mantén tu ritmo." :
           perf >= 50 ? "Estado funcional. Una sesión más elevaría tu rendimiento." :
           "Tu sistema necesita atención. Prioriza un reset."}
        </div>
      </article>

      <div style={{ marginBlockEnd: 14 }}><NeuralRadar st={st} isDark={isDark} /></div>
      <NeuralCoach st={st} isDark={isDark} onSelectProtocol={sp} />
      <WeeklyReport st={st} isDark={isDark} />
      <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p) => { sp(p); switchTab("ignicion"); }} />

      {neuralVar && (
        <article
          aria-label={`Variabilidad neural: índice ${neuralVar.index}, tendencia ${neuralVar.trend}`}
          style={{ background: cd, borderRadius: radius.lg, padding: `${space[3.5] || 14}px ${space[3]}px`, marginBlockEnd: 14, border: `1px solid ${bd}` }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockEnd: space[1.5] }}>
            <div style={{ display: "flex", alignItems: "center", gap: space[1] }}>
              <Icon name="predict" size={12} color={t3} aria-hidden="true" />
              <span style={ty.label(t3)}>Variabilidad Neural</span>
            </div>
            <span style={ty.metric(colorForScore(100 - neuralVar.index, 90, 80), font.size.xl)}>{neuralVar.index}</span>
          </div>
          <div style={ty.body(t2)}>{neuralVar.interpretation}</div>
          <div style={{ ...ty.caption(t3), marginBlockStart: space[1] }}>
            Tendencia:{" "}
            <span style={{
              fontWeight: font.weight.bold,
              color: neuralVar.trend === "ascendente" ? semantic.success : neuralVar.trend === "descendente" ? semantic.danger : t3,
            }}>
              {neuralVar.trend}
            </span>
          </div>
        </article>
      )}

      <div
        role="group"
        aria-label="BioSignal y riesgo de burnout"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBlockEnd: 14 }}
      >
        <article
          aria-label={`BioSignal: ${bioSignal.score}. ${bioSignal.score >= 70 ? "Rendimiento alto" : bioSignal.score >= 45 ? "Estado funcional" : "Intervención activa"}`}
          style={{
            background: `linear-gradient(145deg,${cd},${withAlpha(bioColor, 4)})`,
            borderRadius: radius.xl - 2,
            padding: `${space[4]}px ${space[3.5] || 14}px`,
            border: `1px solid ${bd}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div aria-hidden="true" style={{ position: "absolute", insetBlockStart: -10, insetInlineEnd: -10, inlineSize: 40, blockSize: 40, borderRadius: "50%", background: withAlpha(bioColor, 6) }} />
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[1.5] }}>
            <Icon name="shield" size={12} color={bioColor} aria-hidden="true" />
            <span style={ty.label(t3)}>BioSignal</span>
          </div>
          <AnimatedNumber value={bioSignal.score} color={bioColor} size={28} />
          <div style={{ ...ty.caption(t2), marginBlockStart: space[1.5] }}>
            {bioSignal.score >= 70 ? "Rendimiento alto" : bioSignal.score >= 45 ? "Estado funcional" : "Intervención activa"}
          </div>
        </article>
        <article
          aria-label={`Burnout: índice ${burnout.index}, riesgo ${burnout.risk}`}
          style={{
            background: `linear-gradient(145deg,${cd},${withAlpha(burnoutColor, 4)})`,
            borderRadius: radius.xl - 2,
            padding: `${space[4]}px ${space[3.5] || 14}px`,
            border: `1px solid ${burnout.risk === "crítico" || burnout.risk === "alto" ? withAlpha(semantic.danger, 10) : bd}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div aria-hidden="true" style={{ position: "absolute", insetBlockStart: -10, insetInlineEnd: -10, inlineSize: 40, blockSize: 40, borderRadius: "50%", background: withAlpha(burnoutColor, 6) }} />
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[1.5] }}>
            <Icon name="alert-triangle" size={12} color={burnoutColor} aria-hidden="true" />
            <span style={ty.label(t3)}>Burnout</span>
          </div>
          <AnimatedNumber value={burnout.index} color={burnoutColor} size={28} />
          <div style={{ ...ty.caption(burnoutColor), fontWeight: font.weight.bold, marginBlockStart: space[1.5] }}>
            Riesgo {burnout.risk}
          </div>
        </article>
      </div>

      {moodTrend.length >= 2 && (
        <article
          aria-label={`Tendencia emocional. Promedio ${avgMood} de 5`}
          style={{ background: cd, borderRadius: radius.lg, padding: space[3], marginBlockEnd: 14, border: `1px solid ${bd}` }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBlockEnd: space[1.5] }}>
            <span style={ty.label(t3)}>Tendencia Emocional</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name={MOODS[Math.round(avgMood) - 1]?.icon || "neutral"} size={12} color={MOODS[Math.round(avgMood) - 1]?.color || t3} aria-hidden="true" />
              <span style={ty.title(MOODS[Math.round(avgMood) - 1]?.color || t3)}>{avgMood}/5</span>
            </div>
          </div>
          <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
        </article>
      )}

      <article
        aria-label="Mapa de actividad últimos 28 días"
        style={{ background: cd, borderRadius: radius.lg, padding: `${space[3.5] || 14}px ${space[3]}px`, marginBlockEnd: 14, border: `1px solid ${bd}` }}
      >
        <div style={{ ...ty.label(t3), marginBlockEnd: space[2.5] }}>Actividad · 28 días</div>
        <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={ac} />
      </article>

      {st.history?.length >= 3 && (
        <article
          aria-label="Flujo de energía histórico"
          style={{ background: cd, borderRadius: radius.lg, padding: `${space[3.5] || 14}px ${space[3]}px`, marginBlockEnd: 14, border: `1px solid ${bd}` }}
        >
          <div style={{ ...ty.label(t3), marginBlockEnd: space[2.5] }}>Flujo de Energía</div>
          <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={ac} />
        </article>
      )}

      {Object.keys(protoSens).length >= 2 && (
        <article
          aria-label="Sensibilidad por protocolo"
          style={{ background: cd, borderRadius: radius.lg, padding: `${space[3.5] || 14}px ${space[3]}px`, marginBlockEnd: 14, border: `1px solid ${bd}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: space[1], marginBlockEnd: space[2] }}>
            <Icon name="fingerprint" size={11} color={t3} aria-hidden="true" />
            <span style={ty.label(t3)}>Sensibilidad por Protocolo</span>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {Object.entries(protoSens).sort((a, b) => b[1].avgDelta - a[1].avgDelta).slice(0, 5).map(([name, data], i, arr) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBlock: space[1.5],
                  borderBlockEnd: i < arr.length - 1 ? `1px solid ${bd}` : "none",
                }}
              >
                <span style={ty.caption(t1)}>{name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ ...ty.title(data.avgDelta > 0 ? semantic.success : semantic.danger), fontWeight: font.weight.black }}>
                    {data.avgDelta > 0 ? "+" : ""}{data.avgDelta}
                  </span>
                  <span style={ty.caption(t3)}>{data.sessions}x</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      )}

      <article
        aria-label="Resumen semanal en gráfico"
        style={{ background: cd, borderRadius: radius.lg, padding: `${space[3]}px ${space[2.5]}px`, marginBlockEnd: 14, border: `1px solid ${bd}` }}
      >
        <div style={{ ...ty.label(t3), marginBlockEnd: space[2] }}>Esta Semana</div>
        <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={ac} />
      </article>

      <div
        role="group"
        aria-label="Métricas clave"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[1.5], marginBlockEnd: 14 }}
      >
        {[
          { l: "Enfoque", v: st.coherencia, d: rD.c > 0 ? `+${rD.c}%` : "—", c: "#3B82F6", ic: "focus", suffix: "%" },
          { l: "Calma", v: st.resiliencia, d: rD.r > 0 ? `+${rD.r}%` : "—", c: "#8B5CF6", ic: "calm", suffix: "%" },
          { l: "V-Cores", v: st.vCores || 0, d: `+${st.history?.slice(-1)[0]?.vc || 0}`, c: semantic.warning, ic: "sparkle", suffix: "" },
          { l: "Sesiones", v: st.totalSessions, d: `${st.streak}d racha`, c: semantic.success, ic: "bolt", suffix: "" },
        ].map((k, i) => (
          <article
            key={i}
            aria-label={`${k.l}: ${k.v}${k.suffix}. ${k.d}`}
            style={{ background: cd, borderRadius: radius.md + 2, padding: `${space[2.5] + 1}px ${space[2.5]}px`, border: `1px solid ${bd}` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: space[1] }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name={k.ic} size={10} color={t3} aria-hidden="true" />
                <span style={ty.caption(t3)}>{k.l}</span>
              </div>
              <span style={{ ...ty.caption(semantic.success), fontWeight: font.weight.bold }}>{k.d}</span>
            </div>
            <AnimatedNumber value={k.v} suffix={k.suffix} color={k.c} size={20} />
          </article>
        ))}
      </div>

      <motion.button
        whileTap={reduced ? {} : { scale: .97 }}
        onClick={onShowHist}
        aria-label={`Abrir historial con ${(st.history || []).length} sesiones`}
        style={{
          inlineSize: "100%",
          padding: space[3],
          borderRadius: radius.md,
          border: `1px solid ${bd}`,
          background: cd,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: space[1.5],
          marginBlockEnd: space[4],
        }}
      >
        <Icon name="clock" size={13} color={t3} aria-hidden="true" />
        <span style={ty.caption(t2)}>Historial ({(st.history || []).length})</span>
      </motion.button>

      {st.achievements.length > 0 && (
        <article
          aria-label={`Logros: ${st.achievements.length}`}
          style={{
            background: withAlpha(ac, 2),
            borderRadius: radius.lg,
            padding: `${space[3]}px ${space[2.5]}px`,
            border: `1px solid ${withAlpha(ac, 10)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: space[1.5], marginBlockEnd: space[1] }}>
            <Icon name="trophy" size={14} color={ac} aria-hidden="true" />
            <span style={ty.title(ac)}>Logros</span>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {st.achievements.map(a => (
              <li key={a} style={{ ...ty.caption(ac), paddingBlock: 2, display: "flex", alignItems: "center", gap: 5 }}>
                <span aria-hidden="true" style={{ inlineSize: 3, blockSize: 3, borderRadius: radius.full, background: ac }} />
                {AM[a] || a}
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
