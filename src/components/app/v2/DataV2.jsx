"use client";
import { useEffect, useMemo, useRef } from "react";
import { Activity } from "lucide-react";
import { useStore } from "@/store/useStore";
import HeaderV2 from "./home/HeaderV2";
import DataIntro from "./data/DataIntro";
import TrajectoryHero from "./data/TrajectoryHero";
import DimensionsTrends from "./data/DimensionsTrends";
import ProgramsSection from "./data/ProgramsSection";
import ProtocolCatalog from "./data/ProtocolCatalog";
import SessionsRecent from "./data/SessionsRecent";
import ProgressStats from "./data/ProgressStats";
import AchievementsRecent from "./data/AchievementsRecent";
import SessionsAllView from "./data/SessionsAllView";
import AchievementsAllView from "./data/AchievementsAllView";
import { devLog } from "@/lib/dev-utils";
import { colors, typography, spacing, radii, motion as motionTok } from "./tokens";

// Tab Datos v2 — archivo histórico del usuario.
//
// Phase 6D SP3 — fixtures cleanup. Antes deriveData() tenía un branch final
// que devolvía FIXTURE_* (28 días sintéticos, "56 PROMEDIO", FIXTURE_SESSIONS,
// FIXTURE_ACTIVE_PROGRAM "Neural Baseline · Día 4 de 14") cuando un user
// tenía menos de 5 sesiones — es decir, TODO new user veía datos fake como
// si fueran propios. El URL param ?empty=true era el único escape, pero
// el user real no lo conoce.
//
// Ahora:
//   - history.length === 0  → DataEmpty con CTA "Empezar primera sesión"
//   - 1-4 sessions          → vista parcial honesta (sin sintetizar 28d)
//   - 5+ sessions           → vista completa
//
// Catalog (ProtocolCatalog, PROGRAM_CATALOG_META) NO son fixtures — son
// metadata del producto. Permanecen.

// Phase 6D SP4c — DataV2 acepta sub-view (sessions-all/achievements-all),
// dimension filter (focus/calma/energia para highlight cards), y subAnchor
// para scroll dentro del main view (e.g. "programs"). State controlled
// desde AppV2Root para que target navigation desde HomeV2 funcione real.
export default function DataV2({
  empty = false,
  onNavigate,
  onBellClick,
  subView = null,
  onSubViewChange,
  dimension = null,
  subAnchor = null,
}) {
  const store = useStore();
  const mainRef = useRef(null);
  useEffect(() => { devLog("[v2] DataV2 active", { empty, subView, dimension, subAnchor }); }, [empty, subView, dimension, subAnchor]);

  // Scroll al anchor cuando cambia (e.g. ?#programs).
  useEffect(() => {
    if (subView || !subAnchor) return;
    const el = document.querySelector(`[data-anchor="${subAnchor}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [subAnchor, subView]);

  // useMemo BEFORE conditional early returns para mantener hook order
  // estable (regla de Hooks). El cómputo es trivial cuando subView está
  // activo (no se usa el resultado).
  const data = useMemo(() => deriveData(store, empty), [store, empty]);

  // Sub-view: reemplaza completamente el main view de DataV2.
  if (subView === "sessions-all") {
    return (
      <SessionsAllView
        onBack={() => onSubViewChange?.(null)}
        onBellClick={onBellClick}
        onNavigate={onNavigate}
      />
    );
  }
  if (subView === "achievements-all") {
    return (
      <AchievementsAllView
        onBack={() => onSubViewChange?.(null)}
        onBellClick={onBellClick}
      />
    );
  }

  if (data.isEmpty) {
    return (
      <>
        <HeaderV2 onBellClick={onBellClick} />
        <DataEmpty
          onStart={() => onNavigate && onNavigate({ action: "first-session" })}
          onProtocols={() => onNavigate && onNavigate({ target: "/app/data#protocols" })}
        />
        {/* ProtocolCatalog visible incluso en empty — es el catálogo,
            no data del usuario. Ayuda al user a explorar antes de iniciar. */}
        <ProtocolCatalog
          onSelectProtocol={(p) => onNavigate && onNavigate({ action: "start-protocol", protocolId: p.id })}
        />
      </>
    );
  }

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <DataIntro />
      <TrajectoryHero data={data.composite28d} />
      <DimensionsTrends
        data={data.dimensions28d}
        onSelect={(id) => onNavigate && onNavigate({ target: `/app/profile/engine-health#${id}` })}
      />
      <div data-anchor="programs">
        <ProgramsSection
          activeProgram={data.activeProgram}
          onProgramTap={(p) => onNavigate && onNavigate({ action: "tap-program", id: p.id, hasActive: !!data.activeProgram })}
          onSeeToday={() => onNavigate && onNavigate({ action: "see-program-today" })}
          onAbandon={() => onNavigate && onNavigate({ action: "abandon-program" })}
        />
      </div>
      <ProtocolCatalog
        onSelectProtocol={(p) => onNavigate && onNavigate({ action: "start-protocol", protocolId: p.id })}
      />
      <SessionsRecent
        sessions={data.sessions}
        onSeeAll={() => onNavigate && onNavigate({ target: "/app/data/sessions/all" })}
      />
      <ProgressStats {...data.progress} />
      <AchievementsRecent
        ids={data.achievementsRecent}
        total={data.progress.achievementsCount}
        onSeeAll={() => onNavigate && onNavigate({ target: "/app/data/achievements/all" })}
      />
    </>
  );
}

// Phase 6D SP3 — derive only real data. Empty branch retorna isEmpty:true
// para que DataV2 renderice DataEmpty en lugar del layout completo. NO
// hay branch FIXTURE.
export function deriveData(store, empty) {
  const realHistory = Array.isArray(store?.history) ? store.history : [];
  const totalSessions = realHistory.length;

  // ?empty=true URL param sigue funcional para previews QA. Sin URL param,
  // user real con history vacío también cae en empty (ANTES caía a fixtures).
  if (empty || totalSessions === 0) {
    return {
      isEmpty: true,
      composite28d: [],
      dimensions28d: { focus: [], calm: [], energy: [] },
      sessions: [],
      activeProgram: store?.activeProgram || null,
      progress: {
        vCores: store?.vCores || 0,
        vCoresThisWeek: 0,
        streak: store?.streak || 0,
        bestStreak: store?.bestStreak || 0,
        achievementsCount: Array.isArray(store?.achievements) ? store.achievements.length : 0,
        achievementsThisMonth: 0,
      },
      achievementsRecent: Array.isArray(store?.achievements) ? store.achievements.slice(-3).reverse() : [],
    };
  }

  // 1+ sesiones reales → render con data del usuario, sin fixtures.
  return {
    isEmpty: false,
    composite28d: realCompositeFromHistory(realHistory),
    dimensions28d: realDimensionsFromHistory(realHistory),
    sessions: realHistory.slice(-10).reverse(),
    activeProgram: store?.activeProgram || null,
    progress: {
      vCores: store?.vCores || 0,
      vCoresThisWeek: 0,
      streak: store?.streak || 0,
      bestStreak: store?.bestStreak || 0,
      achievementsCount: Array.isArray(store?.achievements) ? store.achievements.length : 0,
      achievementsThisMonth: 0,
    },
    achievementsRecent: Array.isArray(store?.achievements) ? store.achievements.slice(-3).reverse() : [],
  };
}

function realCompositeFromHistory(history) {
  const DAY = 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - 28 * DAY;
  const buckets = {};
  history.forEach((h) => {
    if (h.ts < cutoff) return;
    const dayKey = Math.floor(h.ts / DAY);
    if (!buckets[dayKey]) buckets[dayKey] = { sum: 0, n: 0, ts: dayKey * DAY };
    buckets[dayKey].sum += Number(h.c) || 0;
    buckets[dayKey].n += 1;
  });
  return Object.values(buckets)
    .map((b) => ({ ts: b.ts, value: Math.round(b.sum / b.n) }))
    .sort((a, b) => a.ts - b.ts);
}

function realDimensionsFromHistory(_history) {
  // Future Phase 6D SP6+ — derivar focus/calm/energy desde historial real.
  // Por ahora arrays vacíos (DimensionsTrends maneja gracefully).
  return { focus: [], calm: [], energy: [] };
}

// Phase 6D SP3 — DataEmpty: empty state honesto cuando user no tiene
// sesiones registradas. Antes este branch servía fixtures sintéticos.
function DataEmpty({ onStart }) {
  return (
    <section
      data-v2-data-empty
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s32,
        paddingBlockEnd: spacing.s48,
        display: "flex",
        flexDirection: "column",
        gap: spacing.s24,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 40,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.04em",
            color: colors.text.primary,
            lineHeight: 1.05,
          }}
        >
          Tu trayectoria.
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: colors.text.secondary,
            lineHeight: 1.4,
          }}
        >
          Aparece aquí cuando empieces.
        </p>
      </header>

      <article
        style={{
          background: "transparent",
          border: `0.5px dashed ${colors.separator}`,
          borderRadius: radii.panelLg,
          padding: spacing.s24,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.text.secondary,
              flexShrink: 0,
            }}
          >
            <Activity size={20} strokeWidth={1.5} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.medium,
                color: colors.text.primary,
                letterSpacing: "-0.005em",
              }}
            >
              Sin sesiones todavía
            </span>
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.4,
              }}
            >
              Tu sparkline 28 días, dimensiones, programas y logros aparecen
              al completar tu primera sesión.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          data-testid="data-empty-cta"
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
            transitionDuration: "180ms",
            transitionTimingFunction: motionTok.ease.out,
          }}
        >
          Empezar primera sesión
        </button>
      </article>
    </section>
  );
}
