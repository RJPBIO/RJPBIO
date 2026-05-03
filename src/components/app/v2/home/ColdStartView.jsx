"use client";
import { Compass, Play, Activity, ClipboardList, ChevronRight } from "lucide-react";
import { colors, typography, spacing, radii, surfaces, icon, motion as motionTok } from "../tokens";

// Estado A — cold-start (menos de 5 sesiones).
// Saludo + 4 cards de accion lista-row. Whitespace 96px hasta nav.

const ACTIONS = [
  {
    id: "cronotipo",
    Icon: Compass,
    title: "Calibra tu cronotipo",
    description: "Test MEQ-SA · 19 preguntas · 4 min",
    target: "/app/profile/calibration",
  },
  {
    id: "primera",
    Icon: Play,
    title: "Tu primera sesión",
    description: "Pulse Shift · 120s · sin protocolo previo necesario",
    action: "start-pulse-shift",
  },
  {
    id: "hrv",
    Icon: Activity,
    title: "Mide tu variabilidad cardíaca",
    description: "60s con cámara o BLE · primera medición",
    target: "/app/profile/calibration#hrv",
  },
  {
    id: "pss4",
    Icon: ClipboardList,
    title: "Test de estrés percibido",
    description: "PSS-4 · 4 preguntas · 1 min",
    target: "/app/profile/instruments#pss4",
  },
];

export default function ColdStartView({ greeting, subtitle = "Vamos a conocerte.", onAction }) {
  return (
    <>
      <section
        data-v2-greeting
        style={{
          paddingInline: spacing.s24,
          paddingBlockStart: spacing.s8,
          paddingBlockEnd: spacing.s64,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 40,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.05,
          }}
        >
          {greeting}
        </h1>
        <p
          style={{
            marginBlockStart: 8,
            marginBlockEnd: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      </section>

      <section
        data-v2-onboarding
        aria-label="Empezar por aquí"
        style={{
          paddingInline: spacing.s24,
          paddingBlockEnd: spacing.s96,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
            marginBlockEnd: 4,
          }}
        >
          EMPEZAR POR AQUÍ
        </div>

        {ACTIONS.map((a) => (
          <ActionRow key={a.id} item={a} onAction={onAction} />
        ))}
      </section>
    </>
  );
}

function ActionRow({ item, onAction }) {
  const { Icon, title, description } = item;
  return (
    <button
      type="button"
      onClick={() => onAction && onAction(item)}
      data-v2-onboarding-row={item.id}
      style={{
        appearance: "none",
        textAlign: "start",
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "inherit",
        cursor: "pointer",
        width: "100%",
        transitionProperty: "background, transform",
        transitionDuration: "180ms",
        transitionTimingFunction: motionTok.ease.out,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = surfaces.rowHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = colors.bg.raised; }}
      onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          background: surfaces.iconBox,
          borderRadius: radii.iconBox,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.55)",
          flexShrink: 0,
        }}
      >
        <Icon size={icon.size} strokeWidth={icon.strokeWidth} />
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={icon.strokeWidth}
        color="rgba(255,255,255,0.32)"
        aria-hidden="true"
      />
    </button>
  );
}
