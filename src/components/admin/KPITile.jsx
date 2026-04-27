import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

/* Editorial KPI tile with sparkline + trend + signal glow.
   Linear/Stripe-style: monospace value, micro-density, optional spark. */
export function KPITile({
  label,
  value,
  unit,
  sub,
  spark,
  trend,
  tone = "neutral",
  glow = false,
}) {
  const toneAccent = {
    neutral: cssVar.text,
    success: "#10B981",
    warn: "#D97706",
    danger: "#DC2626",
    signal: bioSignal.phosphorCyanInk,
  }[tone] || cssVar.text;

  return (
    <div className="bi-kpi-tile" data-tone={tone} data-glow={glow ? "1" : undefined}>
      <div className="bi-kpi-eyebrow">
        <span className="bi-kpi-dot" aria-hidden />
        {label}
      </div>
      <div className="bi-kpi-value-row">
        <span className="bi-kpi-value" style={{ color: toneAccent }}>
          {value}
          {unit && <span className="bi-kpi-unit">{unit}</span>}
        </span>
        {trend != null && <Trend pct={trend} />}
      </div>
      {sub && <div className="bi-kpi-sub">{sub}</div>}
      {Array.isArray(spark) && spark.length > 1 && (
        <Sparkline data={spark} tone={tone} />
      )}
    </div>
  );
}

function Trend({ pct }) {
  const positive = pct > 0;
  const zero = pct === 0;
  const tone = zero ? "neutral" : positive ? "success" : "danger";
  const toneColor = {
    neutral: cssVar.textMuted,
    success: "#10B981",
    danger: "#F43F5E",
  }[tone];
  return (
    <span className="bi-kpi-trend" style={{ color: toneColor }}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        {zero ? (
          <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        ) : positive ? (
          <path d="M2 7 L5 3 L8 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M2 3 L5 7 L8 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Sparkline({ data, tone }) {
  if (data.length < 2) return null;
  const w = 120, h = 30;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`);
  const color = {
    success: "#10B981",
    warn: "#D97706",
    danger: "#DC2626",
    signal: bioSignal.phosphorCyan,
    neutral: bioSignal.phosphorCyan,
  }[tone] || bioSignal.phosphorCyan;
  return (
    <svg className="bi-kpi-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={`bi-kpi-fill-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill={`url(#bi-kpi-fill-${tone})`}
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) * step}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export default KPITile;
