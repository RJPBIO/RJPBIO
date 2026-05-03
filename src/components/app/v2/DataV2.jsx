"use client";
import { useEffect, useMemo } from "react";
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
import {
  fixtureComposite28d,
  fixtureDimensions28d,
  FIXTURE_SESSIONS,
  FIXTURE_PROGRESS,
  FIXTURE_ACHIEVEMENTS_RECENT,
  FIXTURE_ACTIVE_PROGRAM,
} from "./data/fixtures";

// Tab Datos v2 — archivo historico del usuario.
// 7 secciones scrolleables con separadores 0.5px entre ellas.
// Si state esta vacio (dev), usa fixtures realistas.
// ?empty=true desactiva fixtures para ver state real.

export default function DataV2({ empty = false, onNavigate, onBellClick }) {
  const store = useStore();
  useEffect(() => { console.log("[v2] DataV2 active", { empty }); }, [empty]);

  const data = useMemo(() => deriveData(store, empty), [store, empty]);

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <DataIntro />
      <TrajectoryHero data={data.composite28d} />
      <DimensionsTrends
        data={data.dimensions28d}
        onSelect={(id) => onNavigate && onNavigate({ target: `/app/profile/engine-health#${id}` })}
      />
      <ProgramsSection
        activeProgram={data.activeProgram}
        onProgramTap={(p) => onNavigate && onNavigate({ action: "tap-program", id: p.id, hasActive: !!data.activeProgram })}
        onSeeToday={() => onNavigate && onNavigate({ action: "see-program-today" })}
        onAbandon={() => onNavigate && onNavigate({ action: "abandon-program" })}
      />
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

function deriveData(store, empty) {
  if (empty) {
    return {
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
  const realHistory = Array.isArray(store?.history) ? store.history : [];
  const hasRealHistory = realHistory.length >= 5;

  if (hasRealHistory) {
    return {
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

  // Dev fallback: fixtures.
  return {
    composite28d: fixtureComposite28d(),
    dimensions28d: fixtureDimensions28d(),
    sessions: FIXTURE_SESSIONS,
    activeProgram: store?.activeProgram || FIXTURE_ACTIVE_PROGRAM,
    progress: FIXTURE_PROGRESS,
    achievementsRecent: FIXTURE_ACHIEVEMENTS_RECENT,
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

function realDimensionsFromHistory(history) {
  return { focus: [], calm: [], energy: [] };
}
