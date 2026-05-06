"use client";
/* /app/programs — Phase 6G Fix2 P1-1
   ═══════════════════════════════════════════════════════════════
   Listing de programas adaptativos del catálogo (lib/programs.js).
   - Si user tiene programa activo → highlight "EN CURSO" + CTA Continuar.
   - CTAs "EMPEZAR" en cada card → POST /api/v1/me/program/start.
   - Si user inicia programa con uno activo → confirm reemplazar.

   Sin BottomNavV2 (acceso directo, no tab principal — consistente con
   /app/program/today y /app/program/timeline). Header con back-link a /app.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { PROGRAMS, getProgramById } from "@/lib/programs";
import { csrfFetch } from "@/components/app/v2/profile/modals/ModalShell";
import { colors, typography, spacing, layout, radii } from "@/components/app/v2/tokens";

export default function ProgramsListPage() {
  const router = useRouter();
  const { data: activeProgram, loading, isUnauthenticated, refetch } = useActiveProgram();
  const [starting, setStarting] = useState(null); // programId in flight | null
  const [error, setError] = useState(null);

  if (isUnauthenticated) {
    if (typeof window !== "undefined") {
      router.replace("/signin?callbackUrl=/app/programs");
    }
    return <Loading />;
  }

  const activeMeta = activeProgram ? getProgramById(activeProgram.programId) : null;

  const handleStart = async (programId) => {
    setError(null);
    if (activeProgram && activeProgram.programId !== programId) {
      const ok = typeof window !== "undefined"
        ? window.confirm(
            `Tienes "${activeMeta?.n || "un programa"}" en curso. ¿Cambiar a "${getProgramById(programId)?.n}"? Tu progreso actual se archiva.`
          )
        : true;
      if (!ok) return;
    }
    if (activeProgram && activeProgram.programId === programId) {
      router.push("/app/program/today");
      return;
    }
    setStarting(programId);
    try {
      const res = await csrfFetch("/api/v1/me/program/start", {
        method: "POST",
        body: JSON.stringify({ programId, source: "self-selected" }),
      });
      if (res.ok) {
        await refetch();
        router.push("/app/program/today");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "no_se_pudo_iniciar");
    } catch (e) {
      setError("network");
    } finally {
      setStarting(null);
    }
  };

  return (
    <main
      data-v2-programs-list-page
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
          data-testid="programs-back-link"
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
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.accent.phosphorCyan,
            fontWeight: typography.weight.medium,
            marginBlockStart: 4,
          }}
        >
          PROGRAMAS
        </span>
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
          Trayectorias adaptativas
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.body,
            marginBlockStart: 8,
          }}
        >
          Programas estructurados de 5 a 28 días con re-evaluación intermedia y
          ajuste basado en tu data fisiológica.
        </p>
      </header>

      {loading && <Loading inline />}

      {error && (
        <article
          role="alert"
          style={{
            background: "rgba(220,38,38,0.06)",
            border: `0.5px solid ${colors.semantic.danger}`,
            borderRadius: radii.panel,
            padding: spacing.s16,
            color: colors.text.strong,
            fontSize: typography.size.body,
            fontFamily: typography.family,
          }}
        >
          No se pudo iniciar el programa ({error}). Intenta de nuevo.
        </article>
      )}

      {/* Active program highlight */}
      {activeProgram && activeMeta && (
        <section
          data-v2-programs-active-highlight
          data-program-id={activeProgram.programId}
          style={{
            background: "rgba(34,211,238,0.04)",
            border: `0.5px solid rgba(34,211,238,0.4)`,
            borderRadius: radii.panelLg,
            padding: spacing.s24,
            display: "flex",
            flexDirection: "column",
            gap: spacing.s16,
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
            EN CURSO
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 24,
              fontWeight: typography.weight.light,
              color: colors.text.strong,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {activeMeta.n}
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.body,
            }}
          >
            {activeMeta.sb}
            {typeof activeProgram?.todayStatus?.dayNumber === "number"
              ? ` · día ${activeProgram.todayStatus.dayNumber} de ${activeMeta.duration}`
              : ""}
          </p>
          <a
            href="/app/program/today"
            data-testid="programs-continue-cta"
            style={{
              appearance: "none",
              background: colors.accent.phosphorCyan,
              border: "none",
              borderRadius: radii.pill,
              color: colors.bg.base,
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
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Continuar
          </a>
        </section>
      )}

      {/* Programs grid */}
      <section
        data-v2-programs-grid
        style={{ display: "flex", flexDirection: "column", gap: spacing.s16 }}
      >
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
          {activeProgram ? "CAMBIAR DE PROGRAMA" : "ELIGE UN PROGRAMA"}
        </span>
        {PROGRAMS.map((program) => {
          const isActive = activeProgram?.programId === program.id;
          const isStarting = starting === program.id;
          const required = Array.isArray(program.sessions) ? program.sessions.length : 0;
          return (
            <article
              key={program.id}
              data-v2-program-card
              data-program-id={program.id}
              style={{
                background: colors.bg.raised,
                border: `0.5px solid ${isActive ? "rgba(34,211,238,0.4)" : colors.separator}`,
                borderRadius: radii.panelLg,
                padding: spacing.s24,
                display: "flex",
                flexDirection: "column",
                gap: spacing.s16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                    {program.duration}D · {required} SESIONES · {String(program.intent || "").toUpperCase()}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: typography.family,
                      fontSize: 22,
                      fontWeight: typography.weight.light,
                      color: colors.text.strong,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {program.n}
                  </h3>
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: typography.familyMono,
                    fontSize: 11,
                    fontWeight: typography.weight.medium,
                    color: colors.text.muted,
                    letterSpacing: "0.16em",
                    paddingBlock: 6,
                    paddingInline: 8,
                    border: `0.5px solid ${colors.separator}`,
                    borderRadius: radii.iconBox,
                    alignSelf: "flex-start",
                  }}
                >
                  {program.tg}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  color: colors.text.secondary,
                  lineHeight: typography.lineHeight.body,
                }}
              >
                {program.sb_long || program.sb}
              </p>
              {program.evidence && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: typography.familyMono,
                    fontSize: 11,
                    color: colors.text.muted,
                    letterSpacing: "0.04em",
                    lineHeight: 1.4,
                  }}
                >
                  Evidencia: {program.evidence}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleStart(program.id)}
                disabled={loading || isStarting}
                data-testid={`programs-start-${program.id}`}
                style={{
                  appearance: "none",
                  background: isActive ? colors.accent.phosphorCyan : "transparent",
                  border: `0.5px solid ${colors.accent.phosphorCyan}`,
                  borderRadius: radii.pill,
                  color: isActive ? colors.bg.base : colors.accent.phosphorCyan,
                  cursor: loading || isStarting ? "default" : "pointer",
                  opacity: loading || isStarting ? 0.6 : 1,
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
                {isStarting ? "Iniciando…" : isActive ? "Continuar" : "Empezar"}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Loading({ inline = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minBlockSize: inline ? 80 : "100dvh",
        background: inline ? "transparent" : colors.bg.base,
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
    </div>
  );
}
