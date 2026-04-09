"use client";
import { calcProtocolCorrelations, calcNeuralVariability, predictSessionImpact } from "@/lib/neural-engine";
import { P } from "@/lib/protocols";

const TYPE_META = {
  prediction: { label: "PREDICCIÓN", color: "#6366F1", icon: "▲" },
  correlation: { label: "CORRELACIÓN", color: "#10B981", icon: "≈" },
  pattern: { label: "PATRÓN", color: "#0EA5E9", icon: "◆" },
  alert: { label: "ALERTA", color: "#F59E0B", icon: "!" },
  achievement: { label: "LOGRO", color: "#10B981", icon: "★" },
  recovery: { label: "RECUPERACIÓN", color: "#0EA5E9", icon: "↺" },
  recommendation: { label: "RECOMENDACIÓN", color: "#6366F1", icon: "→" },
};

function generateCoachInsights(st, brain, burnout, bioSignal, protoSens) {
  const insights = [];
  const ml = st.moodLog || [];
  const h = st.history || [];

  const corr = calcProtocolCorrelations(st);
  if (corr.bestByIntent && Object.keys(corr.bestByIntent).length) {
    const intents = Object.entries(corr.bestByIntent);
    const top = intents.sort((a, b) => b[1].avgDelta - a[1].avgDelta)[0];
    if (top && top[1].avgDelta > 0.3) {
      insights.push({
        type: "correlation",
        title: `${top[1].name} es tu protocolo más efectivo`,
        body: `Para ${top[0]}: tu mood mejora +${top[1].avgDelta.toFixed(1)} pts en promedio (${top[1].sessions} sesiones).`,
        protocol: top[1].name,
      });
    }
  }

  const variability = calcNeuralVariability(ml);
  if (variability && variability.label === "alta") {
    insights.push({
      type: "pattern",
      title: "Alta variabilidad neural",
      body: "Tu estado oscila mucho entre sesiones. Protocolos de estabilidad y rutinas fijas pueden ayudar.",
    });
  }

  if (burnout && (burnout.risk === "alto" || burnout.risk === "crítico")) {
    insights.push({
      type: "alert",
      title: `Riesgo de burnout: ${burnout.risk}`,
      body: burnout.prediction || "Considera reducir intensidad y aumentar protocolos de calma.",
    });
  }

  if (st.streak >= 7) {
    insights.push({
      type: "achievement",
      title: `${st.streak} días seguidos`,
      body: st.streak >= 30 ? "Tu cerebro ya opera en otro nivel. Estás reconstruyendo circuitos neurales." : "Tu sistema nervioso se está adaptando. Cada día consolida el cambio.",
    });
  }

  if (bioSignal && bioSignal.score >= 75) {
    insights.push({
      type: "achievement",
      title: "Bio-Signal en zona óptima",
      body: `${bioSignal.score}/100 — tu coherencia neural está en niveles altos. Mantén el ritmo.`,
    });
  } else if (bioSignal && bioSignal.score < 40) {
    insights.push({
      type: "alert",
      title: "Bio-Signal bajo",
      body: "Tu sistema necesita más sesiones consistentes esta semana para recuperar coherencia.",
    });
  }

  if (brain && brain.bestProto) {
    const proto = P.find(p => p.n === brain.bestProto.n);
    if (proto) {
      const pred = predictSessionImpact(st, proto);
      if (pred && pred.confidence >= 40 && pred.delta > 0) {
        insights.push({
          type: "prediction",
          title: `Si haces ${proto.n} ahora`,
          body: `Predicción: tu mood subiría ~${pred.delta.toFixed(1)} pts (confianza ${pred.confidence}%).`,
          protocol: proto.n,
        });
      }
    }
  }

  if (corr.bestByTime && Object.keys(corr.bestByTime).length) {
    const hour = new Date().getHours();
    const bracket = hour < 12 ? "manana" : hour < 16 ? "mediodia" : hour < 20 ? "tarde" : "noche";
    const best = corr.bestByTime[bracket];
    if (best && best.avgDelta > 0.2) {
      insights.push({
        type: "pattern",
        title: `Tu mejor hora detectada`,
        body: `En este horario respondes mejor a ${best.name} (+${best.avgDelta.toFixed(1)} pts promedio).`,
        protocol: best.name,
      });
    }
  }

  if (h.length >= 5 && h.length < 10) {
    insights.push({
      type: "recommendation",
      title: "Construyendo tu perfil neural",
      body: `Llevas ${h.length} sesiones. Con 10+ podré darte recomendaciones más precisas.`,
    });
  }

  return insights.slice(0, 4);
}

function InsightCard({ insight, isDark, ac, t1, t2, t3, bd, cd, onSelectProtocol }) {
  const meta = TYPE_META[insight.type] || TYPE_META.recommendation;
  return (
    <div style={{ padding: "12px 14px", background: isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.02)", borderRadius: 13, border: `1px solid ${meta.color}25`, marginBottom: 8, animation: "insightSlide .4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: meta.color + "20", color: meta.color, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{meta.icon}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: meta.color, letterSpacing: 1.2 }}>{meta.label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: t1, marginBottom: 4, lineHeight: 1.35 }}>{insight.title}</div>
      <div style={{ fontSize: 10, color: t2, lineHeight: 1.5 }}>{insight.body}</div>
      {insight.protocol && onSelectProtocol && (
        <button onClick={() => onSelectProtocol(insight.protocol)} style={{ marginTop: 8, padding: "5px 10px", borderRadius: 18, background: meta.color + "12", border: `1px solid ${meta.color}30`, color: meta.color, fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}>USAR ESTE PROTOCOLO →</button>
      )}
    </div>
  );
}

export function NeuralCoachCard({ st, brain, burnout, bioSignal, protoSens, isDark, ac, t1, t2, t3, bd, cd, onSelectProtocol }) {
  const insights = generateCoachInsights(st, brain, burnout, bioSignal, protoSens);
  if (!insights.length) return null;

  return (
    <div style={{ background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 18, padding: "16px 14px", marginBottom: 14, border: "1px solid " + bd, animation: "fi .5s ease, coachGlow 4s ease infinite" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `radial-gradient(circle, ${ac}30, ${ac}05)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: ac, animation: "focusLock 2s ease infinite" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t1, letterSpacing: 1.5, textTransform: "uppercase" }}>Coach Neural</div>
          <div style={{ fontSize: 9, color: t3 }}>{insights.length} insights basados en tus datos</div>
        </div>
      </div>
      {insights.map((ins, i) => (
        <InsightCard key={i} insight={ins} isDark={isDark} ac={ac} t1={t1} t2={t2} t3={t3} bd={bd} cd={cd} onSelectProtocol={onSelectProtocol} />
      ))}
    </div>
  );
}
