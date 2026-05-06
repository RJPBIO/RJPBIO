"use client";
/* /app/program/today — Phase 6F SP-B
   Vista standalone para acceso directo al programa activo (deeplink del
   push notification + nav futura). Renderiza ProgramActiveCard con
   chrome minimal (eyebrow + back link). NO incluye BottomNavV2 — esta
   es página de acceso directo, no tab principal. */

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { colors, typography, spacing, layout } from "@/components/app/v2/tokens";

const ProgramActiveCard = dynamic(
  () => import("@/components/app/v2/program/ProgramActiveCard"),
  { ssr: false, loading: () => <Loading /> }
);
const ProgramReEvalPrompt = dynamic(
  () => import("@/components/app/v2/program/ProgramReEvalPrompt"),
  { ssr: false }
);
// Phase 6G Fix2 P1-2 — empty state reusable hacia /app/programs.
const EmptyProgramState = dynamic(
  () => import("@/components/app/v2/program/EmptyProgramState"),
  { ssr: false }
);

import { useState } from "react";
import { csrfFetch } from "@/components/app/v2/profile/modals/ModalShell";

export default function ProgramTodayPage() {
  const router = useRouter();
  const { data: activeProgram, loading, error, isUnauthenticated, refetch } = useActiveProgram();
  const [reEvalOpen, setReEvalOpen] = useState(false);

  if (loading) return <Loading />;

  if (isUnauthenticated) {
    if (typeof window !== "undefined") {
      router.replace("/signin?callbackUrl=/app/program/today");
    }
    return <Loading />;
  }

  if (error) {
    return (
      <Shell>
        <ErrorBlock
          message="No pudimos cargar tu programa. Intenta de nuevo."
          onRetry={refetch}
        />
      </Shell>
    );
  }

  if (!activeProgram) {
    return (
      <Shell>
        <EmptyProgramState context="today" />
      </Shell>
    );
  }

  const handleAction = async (item) => {
    if (!item || typeof item !== "object") return;
    if (item.action === "open-reeval-prompt") {
      setReEvalOpen(true);
      return;
    }
    if (item.action === "abandon-program") {
      const ok = typeof window !== "undefined"
        ? window.confirm("¿Abandonar el programa actual? Tu progreso se archiva.")
        : true;
      if (!ok) return;
      try {
        const res = await csrfFetch("/api/v1/me/program/abandon", { method: "POST" });
        if (res.ok) {
          refetch();
          router.push("/app");
        }
      } catch { refetch(); }
      return;
    }
    if (item.target) {
      router.push(item.target);
      return;
    }
    if (item.action === "start-protocol") {
      // Forward al shell principal — /app maneja el ProtocolPlayer.
      router.push("/app");
    }
  };

  return (
    <Shell>
      <ProgramActiveCard activeProgram={activeProgram} onAction={handleAction} />
      {reEvalOpen && (
        <ProgramReEvalPrompt
          activeProgram={activeProgram}
          onClose={() => setReEvalOpen(false)}
          onComplete={refetch}
        />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main
      data-v2-program-today-page
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
          Tu programa hoy
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

function ErrorBlock({ message, onRetry }) {
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
      <p style={{ margin: 0, color: colors.text.strong, lineHeight: 1.5 }}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          appearance: "none",
          background: "transparent",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: 12,
          color: colors.text.strong,
          cursor: "pointer",
          paddingBlock: 12,
          paddingInline: 18,
          fontFamily: typography.family,
          fontSize: 12,
          fontWeight: typography.weight.medium,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          alignSelf: "flex-start",
        }}
      >
        Reintentar
      </button>
    </article>
  );
}
