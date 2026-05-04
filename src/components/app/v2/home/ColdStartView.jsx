"use client";
import { useMemo } from "react";
import { Compass, Play, Activity, ClipboardList, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { firstProtocolForIntent } from "@/lib/first-protocol";
import { colors, typography, spacing, radii, surfaces, icon, motion as motionTok } from "../tokens";

// Estado A — cold-start (menos de 5 sesiones).
// Saludo + cards de accion lista-row dinamicamente filtradas:
//   - "Tu primera sesion": label DERIVADO del firstIntent del user
//     (Phase 6D SP1, antes hardcodeado a "Pulse Shift" → user con intent
//     calma veia "Pulse Shift" pero al tap se lanzaba el correcto Reinicio
//     Parasimpatico → mismatch UI/comportamiento).
//   - "Calibra cronotipo": oculto si state.chronotype !== null.
//   - "PSS-4": oculto si state.instruments incluye una entrada pss-4.
//   - "Mide HRV": siempre visible mientras user no tenga mediciones — la
//     card permanece como recordatorio (HRV puede medirse muchas veces).
// Whitespace 96px hasta nav.
//
// Phase 6E SP-A — empty state branch (Bug-48 ColdStart Stuck).
// Si user completa primera sesión + HRV + PSS-4 + chronotype durante
// el período cold-start (totalSessions < 5), buildActions retorna [].
// Antes: pantalla con greeting + "EMPEZAR POR AQUÍ" header + viewport
// vacío. Ahora: EmptyColdStart card con progress hacia baseline + CTA
// "Nueva sesión". Greeting copy también cambia ("Listo para tu próxima
// sesión." en lugar del "Vamos a conocerte." onboarding-vibe).

export default function ColdStartView({ greeting, subtitle = "Vamos a conocerte.", totalSessions: totalSessionsProp, onAction }) {
  // Selectores granulares para evitar re-render en cambios irrelevantes.
  const firstIntent = useStore((s) => s.firstIntent);
  const chronotype = useStore((s) => s.chronotype);
  const instruments = useStore((s) => s.instruments);
  const totalSessionsStore = useStore((s) => s.totalSessions);
  const hrvLog = useStore((s) => s.hrvLog);
  // Prop tiene precedencia (HomeV2 ya derivó de history.length); fallback al store.
  const totalSessions = Number.isFinite(totalSessionsProp) ? totalSessionsProp : (totalSessionsStore || 0);

  const actions = useMemo(
    () => buildActions({ firstIntent, chronotype, instruments, totalSessions, hrvLog }),
    [firstIntent, chronotype, instruments, totalSessions, hrvLog],
  );

  const hasActions = actions.length > 0;
  const headlineCopy = hasActions ? greeting : "Listo para tu próxima sesión.";
  const subtitleCopy = hasActions ? subtitle : "Sigues construyendo tu trayectoria.";
  const eyebrowCopy = hasActions ? "EMPEZAR POR AQUÍ" : "TU PRÓXIMA ACCIÓN";

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
            color: colors.text.strong,
            lineHeight: 1.05,
          }}
        >
          {headlineCopy}
        </h1>
        <p
          style={{
            marginBlockStart: 8,
            marginBlockEnd: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {subtitleCopy}
        </p>
      </section>

      <section
        data-v2-onboarding
        aria-label={hasActions ? "Empezar por aquí" : "Tu próxima acción"}
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
          {eyebrowCopy}
        </div>

        {hasActions ? (
          actions.map((a) => (
            <ActionRow key={a.id} item={a} onAction={onAction} />
          ))
        ) : (
          <EmptyColdStart
            totalSessions={totalSessions}
            onAction={onAction}
          />
        )}
      </section>
    </>
  );
}

// Phase 6D SP1 — buildActions decide qué cards aparecen y con qué
// label. La función vive afuera del componente para testabilidad
// directa (tests pueden importarla y verificar el filtrado sin
// montar el árbol React).
export function buildActions({
  firstIntent,
  chronotype,
  instruments,
  totalSessions,
  hrvLog,
}) {
  const safeInstruments = Array.isArray(instruments) ? instruments : [];
  const safeHrvLog = Array.isArray(hrvLog) ? hrvLog : [];
  const hasChronotype = chronotype !== null && chronotype !== undefined;
  const hasPss4 = safeInstruments.some((e) => e && e.instrumentId === "pss-4");
  const hasFirstSession = (totalSessions || 0) > 0;
  const hasHrv = safeHrvLog.length > 0;

  // first-session card: label DERIVADO del intent. firstProtocolForIntent
  // resuelve el catálogo y devuelve el objeto Protocol completo.
  const firstProtocol = firstProtocolForIntent(firstIntent);
  const firstProtocolName = firstProtocol?.n || "Sesión inicial";
  const firstProtocolDuration = firstProtocol?.d || 120;

  const out = [];

  // Card 1 — primera sesión (oculta si user ya tiene sesiones).
  if (!hasFirstSession) {
    out.push({
      id: "primera",
      Icon: Play,
      title: "Tu primera sesión",
      description: `${firstProtocolName} · ${firstProtocolDuration}s · sin protocolo previo necesario`,
      action: "first-session",
    });
  }

  // Card 2 — cronotipo (oculta si ya calibrado).
  // Bug-15 fix: el instrumento real es rMEQ (5 ítems, Adan & Almirall
  // 1991), no MEQ-SA (19 ítems, Horne & Östberg 1976).
  if (!hasChronotype) {
    out.push({
      id: "cronotipo",
      Icon: Compass,
      title: "Calibra tu cronotipo",
      description: "rMEQ · 5 ítems · Adan & Almirall 1991",
      action: "retake-chronotype",
    });
  }

  // Card 3 — HRV (siempre visible mientras no haya mediciones; sigue
  // siendo opcional aún post-onboarding porque algunos users pueden
  // querer iniciar después).
  if (!hasHrv) {
    out.push({
      id: "hrv",
      Icon: Activity,
      title: "Mide tu variabilidad cardíaca",
      description: "60s con cámara o BLE · primera medición",
      action: "new-hrv",
    });
  }

  // Card 4 — PSS-4 (oculto si ya hecho en onboarding o standalone).
  if (!hasPss4) {
    out.push({
      id: "pss4",
      Icon: ClipboardList,
      title: "Test de estrés percibido",
      description: "PSS-4 · 4 preguntas · 1 min",
      action: "retake-pss4",
    });
  }

  return out;
}

// Phase 6E SP-A — empty state cuando user completó todas las gates de
// onboarding pero sigue en cold-start (totalSessions < 5). Bridge entre
// "lista de tareas" (cards iniciales) y "vista personalizada" (5+ sesiones)
// — sin esto la pantalla quedaba con header + viewport vacío post primera
// acción del user (Bug-48).
function EmptyColdStart({ totalSessions, onAction }) {
  const sessionsToBaseline = Math.max(0, 5 - (totalSessions || 0));
  const ctaCopy = sessionsToBaseline > 0
    ? `${sessionsToBaseline} ${sessionsToBaseline === 1 ? "sesión" : "sesiones"} más para empezar a personalizar tu coach.`
    : "Tu próxima sesión empieza tu trayectoria personalizada.";
  return (
    <article
      data-v2-coldstart-empty
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panelLg,
        padding: spacing.s24 - 4,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
            lineHeight: 1.25,
          }}
        >
          Sesión {totalSessions || 0} de 5 hasta tu trayectoria personalizada.
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {ctaCopy}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onAction?.({ action: "first-session" })}
        data-testid="coldstart-empty-cta"
        style={{
          appearance: "none",
          background: "transparent",
          border: `0.5px solid ${colors.accent.phosphorCyan}`,
          borderRadius: 8,
          color: colors.accent.phosphorCyan,
          cursor: "pointer",
          paddingBlock: 14,
          paddingInline: 20,
          minBlockSize: 48,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
          transitionProperty: "background, transform",
          transitionDuration: `${motionTok.duration.tap}ms`,
          transitionTimingFunction: motionTok.ease.out,
        }}
      >
        Nueva sesión
      </button>
    </article>
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
