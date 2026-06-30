"use client";
/* ═══════════════════════════════════════════════════════════════
   OptimalWindowCard — "tu mejor ventana", observada (no declarada).
   ───────────────────────────────────────────────────────────────
   Break-pattern deliberado: ni grid (ConsistencyHeatmap) ni sparkline
   chico (DimensionsTrends). Una CURVA DEL DÍA suave (0–24h) con la
   ventana de mayor receptividad resaltada en phosphorCyan + marcador
   "ahora". Cuenta una historia: cómo responde tu sistema a lo largo del
   día. Modelo en lib/neural/optimalWindow (responsividad por franja).
   ═══════════════════════════════════════════════════════════════ */
import { useMemo } from "react";
import { buildOptimalWindow } from "@/lib/neural/optimalWindow";
import { buildChronotypeDrift } from "@/lib/neural/chronotypeDrift";
import { colors, typography, spacing } from "../tokens";

const CYAN = colors.accent.phosphorCyan;
const CYAN_RGB = colors.accent.phosphorCyanRgb || "34, 211, 238";
const VB_W = 1000;
const VB_H = 150;
const PAD_Y = 18;

// Catmull-Rom → cúbica de Bézier para una curva suave que pasa por todos
// los puntos (más orgánica que polyline, sin overshoot agresivo).
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

const eyebrow = {
  fontFamily: typography.familyMono,
  fontSize: typography.size.microCaps,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  fontWeight: typography.weight.medium,
};

export default function OptimalWindowCard({ history, chronotype, onNavigate }) {
  const data = useMemo(
    () => buildOptimalWindow(Array.isArray(history) ? history : [], { now: Date.now() }),
    [history]
  );
  // Cronotipo como variable dinámica: compara lo declarado vs lo observado.
  const drift = useMemo(
    () => buildChronotypeDrift({ chronotype, history, now: Date.now() }),
    [chronotype, history]
  );

  // Antes de que haya señal alguna, no ocupar espacio (DATOS ya tiene empty arriba).
  if (!data || (!data.available && (!data.profile || data.profile.length === 0))) return null;

  const profile = data.profile || [];
  const shrunks = profile.map((b) => b.shrunk);
  const min = Math.min(...shrunks);
  const max = Math.max(...shrunks);
  const span = Math.max(1e-6, max - min);
  const pts = profile.map((b, i) => ({
    x: ((i + 0.5) / profile.length) * VB_W,
    y: VB_H - PAD_Y - ((b.shrunk - min) / span) * (VB_H - 2 * PAD_Y),
  }));
  const line = smoothPath(pts);
  const area = line ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${VB_H} L ${pts[0].x.toFixed(1)} ${VB_H} Z` : "";

  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const nowX = (nowHour / 24) * VB_W;

  // Banda de la mejor ventana (en coords de franja).
  let bandX = null;
  let peakPt = null;
  if (data.available && data.best) {
    const bi = data.best.hourStart / 2;
    bandX = { x1: (bi / profile.length) * VB_W, x2: ((bi + 1) / profile.length) * VB_W };
    peakPt = pts[bi] || null;
  }

  const hourTicks = [0, 6, 12, 18];

  return (
    <section
      data-v2-optimal-window
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div style={{ ...eyebrow, marginBlockEnd: spacing.s16 }}>VENTANA ÓPTIMA · OBSERVADA</div>

      {data.available ? (
        <p
          style={{
            margin: 0,
            marginBlockEnd: spacing.s24,
            fontFamily: typography.family,
            fontSize: typography.size.subtitle,
            fontWeight: typography.weight.regular,
            color: colors.text.primary,
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            maxInlineSize: 520,
          }}
        >
          {data.headline}
        </p>
      ) : (
        <p
          style={{
            margin: 0,
            marginBlockEnd: spacing.s24,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {data.reason}
        </p>
      )}

      {/* Curva del día */}
      <svg
        role="img"
        aria-label={
          data.available
            ? `Curva de receptividad por hora; mejor ventana ${data.best.label}`
            : "Curva de receptividad por hora, en formación"
        }
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height={VB_H}
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="ow-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgba(${CYAN_RGB}, ${data.available ? 0.22 : 0.08})`} />
            <stop offset="100%" stopColor={`rgba(${CYAN_RGB}, 0)`} />
          </linearGradient>
        </defs>

        {/* Banda de mejor ventana */}
        {bandX && (
          <rect
            x={bandX.x1}
            y={0}
            width={bandX.x2 - bandX.x1}
            height={VB_H}
            fill={`rgba(${CYAN_RGB}, 0.10)`}
          />
        )}

        {area && <path d={area} fill="url(#ow-fill)" stroke="none" />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={data.available ? CYAN : "rgba(255,255,255,0.30)"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Marcador "ahora" */}
        <line
          x1={nowX}
          y1={0}
          x2={nowX}
          y2={VB_H}
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />

        {/* Pico de la mejor ventana */}
        {peakPt && (
          <circle cx={peakPt.x} cy={peakPt.y} r={4.5} fill={CYAN} vectorEffect="non-scaling-stroke">
          </circle>
        )}
      </svg>

      {/* Eje de horas */}
      <div style={{ position: "relative", height: 14, marginBlockStart: 4 }}>
        {hourTicks.map((h) => (
          <span
            key={h}
            style={{
              position: "absolute",
              left: `${(h / 24) * 100}%`,
              transform: "translateX(-50%)",
              fontFamily: typography.familyMono,
              fontSize: 9,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            {String(h).padStart(2, "0")}h
          </span>
        ))}
      </div>

      {/* Readout */}
      {data.available && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.s16,
            marginBlockStart: spacing.s16,
            flexWrap: "wrap",
            fontFamily: typography.family,
            fontSize: typography.size.caption,
          }}
        >
          <span style={{ color: CYAN, fontWeight: typography.weight.medium }}>
            Mejor {data.best.label}
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
          <span style={{ color: colors.text.secondary }}>Evita {data.worst.label}</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
          <span style={{ color: colors.text.muted }}>{data.maturity.sessions} sesiones</span>
        </div>
      )}

      {/* Cronotipo dinámico: drift declarado vs observado */}
      {data.available && drift.available && drift.drift !== "aligned" && (
        <div
          style={{
            marginBlockStart: spacing.s16,
            paddingBlockStart: spacing.s16,
            borderBlockStart: `0.5px solid ${colors.separator}`,
          }}
        >
          <div
            style={{
              ...eyebrow,
              marginBlockEnd: 6,
              color: drift.shouldRecalibrate ? "#F59E0B" : "rgba(255,255,255,0.55)",
            }}
          >
            CRONOTIPO · {drift.shouldRecalibrate ? "POSIBLE CAMBIO" : "LIGERA DESVIACIÓN"}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              color: colors.text.secondary,
              lineHeight: 1.5,
            }}
          >
            {drift.message}
          </p>
          {drift.shouldRecalibrate && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate({ action: "retake-chronotype" })}
              style={{
                appearance: "none",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: "8px 0 0",
                color: CYAN,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.medium,
              }}
            >
              Recalibrar cronotipo
            </button>
          )}
        </div>
      )}
    </section>
  );
}
