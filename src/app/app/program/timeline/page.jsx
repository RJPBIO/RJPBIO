"use client";
/* /app/program/timeline — Phase 6F SP-B
   Vista standalone del ProgramTimeline para que user revise progreso
   completo. CTA "Volver" → /app. Si no hay programa activo, muestra
   bloque informativo. Sin BottomNavV2 (acceso directo no-tab). */

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { colors, typography, spacing, layout } from "@/components/app/v2/tokens";

const ProgramTimeline = dynamic(
  () => import("@/components/app/v2/program/ProgramTimeline"),
  { ssr: false, loading: () => <Loading /> }
);
// Phase 6G Fix2 P1-2 — empty state reusable hacia /app/programs.
const EmptyProgramState = dynamic(
  () => import("@/components/app/v2/program/EmptyProgramState"),
  { ssr: false }
);

export default function ProgramTimelinePage() {
  const router = useRouter();
  const { data: activeProgram, loading, error, isUnauthenticated, refetch } = useActiveProgram();

  if (loading) return <Loading />;

  if (isUnauthenticated) {
    if (typeof window !== "undefined") {
      router.replace("/signin?callbackUrl=/app/program/timeline");
    }
    return <Loading />;
  }

  if (error) {
    return (
      <Shell>
        <Block message="No pudimos cargar tu programa." action={{ label: "Reintentar", onClick: refetch }} />
      </Shell>
    );
  }

  if (!activeProgram) {
    return (
      <Shell>
        <EmptyProgramState context="timeline" />
      </Shell>
    );
  }

  return (
    <Shell>
      <ProgramTimeline activeProgram={activeProgram} />
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main
      data-v2-program-timeline-page
      style={{
        minBlockSize: "100dvh",
        background: colors.bg.base,
        color: colors.text.primary,
        paddingBlock: spacing.s32,
        paddingInline: layout.contentPadInline,
        maxInlineSize: layout.maxContentWidth,
        marginInline: "auto",
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <a
          href="/app"
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
            textDecoration: "none",
          }}
        >
          ← Volver
        </a>
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 32,
            fontWeight: typography.weight.light,
            color: colors.text.strong,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          Línea de tiempo
        </h1>
      </header>
      {children}
    </main>
  );
}

function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      style={{
        minBlockSize: "100dvh",
        background: colors.bg.base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: colors.accent.phosphorCyan,
          fontWeight: typography.weight.medium,
        }}
      >
        Cargando…
      </span>
    </main>
  );
}

function Block({ eyebrow, message, action }) {
  return (
    <article
      style={{
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: 16,
        padding: spacing.s24,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s16,
      }}
    >
      {eyebrow && (
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.text.muted,
            fontWeight: typography.weight.medium,
          }}
        >
          {eyebrow}
        </span>
      )}
      <p style={{ margin: 0, color: colors.text.strong, lineHeight: 1.5 }}>{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            appearance: "none",
            background: "transparent",
            border: `0.5px solid ${colors.accent.phosphorCyan}`,
            borderRadius: 12,
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
          }}
        >
          {action.label}
        </button>
      )}
    </article>
  );
}
