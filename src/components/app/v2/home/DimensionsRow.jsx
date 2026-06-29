"use client";
import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing, motion as motionTok, easing } from "../tokens";
import { focusDescriptor, calmDescriptor, energyDescriptor, DIMENSION_DETAIL } from "./copy";
import { useReducedMotion } from "@/lib/a11y";
import { useHaptic } from "@/hooks/useHaptic";
// Phase Polish-Tier-4 Capa-2 — mini-sparkline per chip (additive, opcional).
// Reuse del Sparkline de Tier 2 con stroke muted + width/height compactos.
// sparklineData es prop opcional; chips auto-hide sparkline cuando series<2.
import Sparkline from "./Sparkline";

// 3 dimensiones equidistantes con separadores verticales 0.5px.
// Sin cards. Hover opacity boost 0.05. Tap scale 0.98 120ms.
//
// Phase 6H Premium-Fix1 — B4 logic con prop opcional `sources`:
//   { foco: 'measured' | 'partial' | 'fallback',
//     calma: 'measured' | 'partial' | 'fallback',
//     energia: 'measured' | 'partial' | 'fallback' }
// · 'measured' → render normal sin descriptor extra
// · 'partial'  → render con eyebrow ESTIMADO debajo del valor
// · 'fallback' → dimension oculta (no participa del grid)
// Si todas son 'fallback' → componente entero retorna null (no row vacío).
//
// Cuando `sources` no se pasa, comportamiento legacy preservado: las 3
// dimensiones siempre visibles sin descriptor source. Esto evita romper
// callers existentes (PersonalizedView legacy api focus/calm/energy).
//
// Phase Polish-Tier-1 Gap-1 — microinteractions (additive):
// · onPointerDown → haptic "tap" (30ms vía useHaptic, respeta hapticOn).
// · long-press 500ms → tooltip role=tooltip con detail string + haptic
//   stronger (warn pattern). Tooltip auto-dismiss 2s. Reduced-motion: tooltip
//   sin fade animation. Tap durante tooltip visible NO navega (dismiss-first).

const LONG_PRESS_MS = 500;
const TOOLTIP_DISMISS_MS = 2000;

export default function DimensionsRow({
  focus = 0,
  calm = 0,
  energy = 0,
  sources = null,
  onSelect,
  // Phase Polish-Tier-4 Capa-2 — sparklineData opcional shape:
  // { foco: [{value, ts}, ...], calma: [...], energia: [...] }.
  // Cuando ausente o serie < 2 puntos, el mini-sparkline se omite.
  sparklineData = null,
}) {
  const baseItems = [
    { id: "foco",    label: "FOCO",    value: focus,  desc: focusDescriptor(focus),  source: sources?.foco    || "measured" },
    { id: "calma",   label: "CALMA",   value: calm,   desc: calmDescriptor(calm),    source: sources?.calma   || "measured" },
    { id: "energia", label: "ENERGÍA", value: energy, desc: energyDescriptor(energy), source: sources?.energia || "measured" },
  ];
  // B4: filter out 100% fallback dimensions (no signal real disponible).
  const items = baseItems.filter((it) => it.source !== "fallback");

  // Hooks SIEMPRE se llaman antes del early return — react-rules. El
  // null branch debajo NO altera el orden de hooks.
  const reduce = useReducedMotion();
  const haptic = useHaptic();
  const [tooltipFor, setTooltipFor] = useState(null);
  const longPressTimer = useRef(null);
  const tooltipDismissTimer = useRef(null);
  const longPressFiredRef = useRef(false);

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (tooltipDismissTimer.current) clearTimeout(tooltipDismissTimer.current);
  }, []);

  if (items.length === 0) return null;

  // Phase 6H Premium-Fix1 — gridTemplateColumns dinámico para que columnas
  // restantes ocupen ancho equitativamente cuando alguna se oculta.
  const gridTemplate = `repeat(${items.length}, 1fr)`;

  const startLongPress = (id) => {
    longPressFiredRef.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true;
      haptic("warn");
      setTooltipFor(id);
      if (tooltipDismissTimer.current) clearTimeout(tooltipDismissTimer.current);
      tooltipDismissTimer.current = setTimeout(() => {
        setTooltipFor((cur) => (cur === id ? null : cur));
      }, TOOLTIP_DISMISS_MS);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <section
      data-v2-dimensions
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: 0,
        paddingBlockEnd: spacing.s64,
        display: "grid",
        gridTemplateColumns: gridTemplate,
      }}
    >
      {items.map((it, i) => (
        <button
          key={it.id}
          type="button"
          onClick={() => {
            // Phase Polish-Tier-1 Gap-1 — si tooltip estaba visible, primer
            // tap solo dismiss (no navigate). Long-press fired flag tracks
            // que la última interacción fue un long-press, no un tap real.
            if (longPressFiredRef.current) {
              longPressFiredRef.current = false;
              setTooltipFor(null);
              if (tooltipDismissTimer.current) clearTimeout(tooltipDismissTimer.current);
              return;
            }
            haptic("tap");
            onSelect && onSelect(it.id);
          }}
          data-v2-dim={it.id}
          data-source={it.source}
          data-testid={`dimensions-chip-${it.id}`}
          aria-describedby={tooltipFor === it.id ? `dim-tip-${it.id}` : undefined}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            borderInlineStart: i === 0 ? "none" : `0.5px solid ${colors.separator}`,
            color: "inherit",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            paddingBlock: spacing.s16,
            cursor: "pointer",
            position: "relative",
            transitionProperty: "opacity, transform",
            transitionDuration: `${motionTok.duration.tap}ms`,
            transitionTimingFunction: motionTok.ease.out,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.95"; cancelLongPress(); }}
          onPointerDown={(e) => {
            e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`;
            startLongPress(it.id);
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            cancelLongPress();
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            cancelLongPress();
          }}
          onPointerCancel={() => cancelLongPress()}
        >
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              fontWeight: typography.weight.medium,
              marginBlockEnd: 6,
            }}
          >
            {it.label}
          </span>
          <span
            style={{
              fontFamily: typography.family,
              fontSize: 32,
              fontWeight: typography.weight.light,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.96)",
              lineHeight: 1,
              marginBlockEnd: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(it.value)}%
          </span>
          {it.source === "partial" && (
            <span
              data-v2-dim-source-tag
              style={{
                fontFamily: typography.familyMono,
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: colors.accent.phosphorCyan,
                opacity: 0.55,
                fontWeight: typography.weight.medium,
                marginBlockEnd: 4,
              }}
            >
              ESTIMADO
            </span>
          )}
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.3,
              textAlign: "center",
              paddingInline: 4,
            }}
          >
            {it.desc}
          </span>

          {Array.isArray(sparklineData?.[it.id]) && sparklineData[it.id].length >= 2 && (
            <span
              data-v2-dim-sparkline
              data-testid={`dimensions-chip-sparkline-${it.id}`}
              style={{
                marginBlockStart: 6,
                opacity: 0.7,
                pointerEvents: "none",
              }}
            >
              <Sparkline
                data={sparklineData[it.id]}
                width={48}
                height={12}
                strokeColor="rgba(255,255,255,0.55)"
                fillColor="rgba(255,255,255,0.06)"
                ariaLabel={`Tendencia ${it.label.toLowerCase()} últimos ${sparklineData[it.id].length} días`}
                testid={`dim-sparkline-${it.id}`}
              />
            </span>
          )}

          {tooltipFor === it.id && DIMENSION_DETAIL[it.id] && (
            <span
              data-v2-dim-tooltip
              id={`dim-tip-${it.id}`}
              role="tooltip"
              style={{
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(8,8,10,0.96)",
                border: `0.5px solid ${colors.accent.phosphorCyan}`,
                borderRadius: 8,
                paddingBlock: 8,
                paddingInline: 12,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.35,
                width: "max-content",
                maxWidth: 220,
                whiteSpace: "normal",
                textAlign: "center",
                pointerEvents: "none",
                zIndex: 10,
                animation: reduce ? "none" : `bi-dim-tip-in 180ms ${easing.spring} forwards`,
              }}
            >
              {DIMENSION_DETAIL[it.id]}
            </span>
          )}
        </button>
      ))}
    </section>
  );
}
