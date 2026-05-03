"use client";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";
import { P as PROTOCOLS } from "@/lib/protocols";
import { closeSession, adaptPlayerCompletionToSessionData } from "@/lib/sessionFlow";
import { colors, typography, layout } from "./tokens";
import HomeV2 from "./HomeV2";
import DataV2 from "./DataV2";
import CoachV2 from "./CoachV2";
import ProfileV2 from "./ProfileV2";
import BottomNavV2 from "./BottomNavV2";
import CrisisFAB from "./CrisisFAB";
import CrisisSheet from "./CrisisSheet";

// Phase 6 SP3 — ProtocolPlayer overlay desde AppV2Root.
// Lazy import para preservar SSR-safety de AppV2Root y evitar bundle bloat.
const ProtocolPlayer = dynamic(
  () => import("@/components/protocol/v2/ProtocolPlayer"),
  { ssr: false }
);

// Phase 6 quick-fix post-SP5 — Onboarding V2 components reescritos desde
// cero con ADN heredado + instrumentos clínicos validados peer-reviewed
// (PSS-4 Cohen 1983 + rMEQ Adan&Almirall 1991 + MAIA-2 Mehling 2018).
// Los legacy en src/components/{BioIgnitionWelcome,NeuralCalibration}.jsx
// quedan eliminados post-validación e2e (este sub-prompt).
const BioIgnitionWelcome = dynamic(
  () => import("@/components/onboarding/v2/BioIgnitionWelcomeV2"),
  { ssr: false }
);
const NeuralCalibration = dynamic(
  () => import("@/components/onboarding/v2/NeuralCalibrationV2"),
  { ssr: false }
);

// Phase 6 SP5 — Mapeo intent → protocolo recomendado para "Tu primera sesión".
const FIRST_PROTOCOL_BY_INTENT = {
  calma: 1,           // Reinicio Parasimpático
  enfoque: 2,         // Activación Cognitiva
  energia: 4,         // Pulse Shift
  reset: 3,           // Reset Ejecutivo
  recuperacion: 3,    // Reset Ejecutivo (alias welcome → engine)
};

const SCREENS = {
  hoy: HomeV2,
  datos: DataV2,
  coach: CoachV2,
  perfil: ProfileV2,
};

const VALID_OVERRIDES = new Set(["cold-start", "personalized", "with-program"]);
const VALID_COACH = new Set(["empty", "conversation", "streaming", "quota", "weekly", "all"]);
const VALID_PROFILE = new Set(["b2b"]);
const VALID_PROFILE_SECTIONS = new Set([
  "calibration", "instruments", "nom35", "engine-health",
  "settings", "security", "privacy", "data-requests", "account",
]);
const VALID_TABS = new Set(["hoy", "datos", "coach", "perfil"]);

export default function AppV2Root() {
  const initialTab = useInitialTab();
  const [tab, setTab] = useState(initialTab);
  const devOverride = useDevOverride();
  useEffect(() => { console.log("[v2] AppV2Root mounted", { devOverride, initialTab }); }, [devOverride, initialTab]);

  const Screen = SCREENS[tab] || HomeV2;
  const empty = useEmptyOverride();
  const coachOverride = useCoachOverride();
  const profileOverride = useProfileOverride();
  const profileSection = useProfileSectionInitial();

  // Phase 6 SP3 — state lifted para mount del ProtocolPlayer overlay.
  // selectedProtocol: protocolo elegido por el bandit / catálogo.
  // playerOpen: gate del overlay full-screen.
  // sessionStartedAt: timestamp de mount, key forzado para re-mount limpio.
  const store = useStore();
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [crisisSheetOpen, setCrisisSheetOpen] = useState(false);

  // Helper común para mountar el player con un protocolo dado.
  const launchProtocol = useCallback((protocol) => {
    if (!protocol) return;
    setSelectedProtocol(protocol);
    setSessionStartedAt(Date.now());
    setPlayerOpen(true);
  }, []);

  const onNavigate = useCallback((event) => {
    if (!event || typeof event !== "object") return;
    // SP3: start-recommended (HomeV2 ActionCard) + SP4: start-protocol (catálogo).
    if (event.action === "start-recommended" || event.action === "start-protocol") {
      const id = Number(event.protocolId);
      if (!Number.isFinite(id)) return;
      const protocol = PROTOCOLS.find((p) => p.id === id);
      if (!protocol) return;
      launchProtocol(protocol);
      return;
    }
    // SP5: ColdStart "Tu primera sesión" → arranca protocolo según firstIntent.
    if (event.action === "start-pulse-shift" || event.id === "primera") {
      const st = useStore.getState();
      const id = FIRST_PROTOCOL_BY_INTENT[st.firstIntent] || 4; // default Pulse Shift
      const protocol = PROTOCOLS.find((p) => p.id === id);
      if (!protocol) return;
      launchProtocol(protocol);
      return;
    }
    // SP5: targets → switch to perfil tab + initial section.
    if (typeof event.target === "string") {
      const target = event.target;
      if (target.startsWith("/app/profile/calibration")) {
        setTab("perfil");
        // Sub-section is read by ProfileV2 vía useProfileSectionInitial,
        // que lee ?ps= del URL. Para v2 intra-shell, abrimos calibración:
        // ProfileV2 montea SubView via state local; pero ese state no tiene
        // setter externo. Defer al user navegar manualmente desde Perfil.
        return;
      }
      if (target.startsWith("/app/profile/instruments")) {
        setTab("perfil");
        return;
      }
      if (target.startsWith("/app/data")) {
        setTab("datos");
        return;
      }
      // Otros targets (e.g. /pricing) — log para SP6 si aplica.
    }
    // Otras acciones (tap-program, see-program-today, abandon-program,
    // export-weekly-summary) se manejan en SPs futuros. Por ahora log.
    console.log("[v2] navigate", event);
  }, [launchProtocol]);

  // Phase 6 SP4 — Crisis quick access.
  const handleOpenCrisisSheet = useCallback(() => setCrisisSheetOpen(true), []);
  const handleCloseCrisisSheet = useCallback(() => setCrisisSheetOpen(false), []);
  const handleCrisisProtocolSelect = useCallback((protocol) => {
    setCrisisSheetOpen(false);
    launchProtocol(protocol);
  }, [launchProtocol]);

  const handlePlayerComplete = useCallback((playerSessionData) => {
    if (!selectedProtocol) {
      setPlayerOpen(false);
      return;
    }
    const startedAt = sessionStartedAt ?? (Date.now() - (playerSessionData?.durationMs || 0));
    const sessionData = adaptPlayerCompletionToSessionData(
      playerSessionData,
      selectedProtocol,
      startedAt,
    );
    const st = useStore.getState();
    let result = null;
    try {
      result = closeSession({
        sessionData,
        protocol: selectedProtocol,
        st,
        durMult: 1,
        preMood: typeof st.preMood === "number" ? st.preMood : null,
        nfcCtx: null,
        circadian: null,
        voiceOn: !!st.voiceOn,
        refs: { sessionStartedAt: startedAt, sessionEndedAt: Date.now() },
        hrvLog: Array.isArray(st.hrvLog) ? st.hrvLog : [],
      });
    } catch (e) {
      console.error("[v2] closeSession error", e);
    }
    if (result) {
      // 1. Aplicar transición de state al store (vCores, streak, history, ...).
      try {
        store.completeSession({
          eVC: result.eVC,
          nC: result.newState.coherencia,
          nR: result.newState.resiliencia,
          nE: result.newState.capacidad,
          ns: result.newState.totalSessions,
          nsk: result.newState.streak,
          nw: result.newState.weeklyData,
          newHist: result.newState.history,
          ach: result.newState.achievements,
          totalT: result.newState.totalTime,
        });
      } catch (e) {
        console.error("[v2] store.completeSession error", e);
      }
      // 2. Avance de programa si aplica.
      if (result.programAdvance && result.programAdvance.day) {
        try {
          store.completeProgramDay(result.programAdvance.day, {
            protocolId: selectedProtocol.id,
            bioQ: result.bioQ?.quality,
          });
          if (result.programAdvance.finalize) {
            store.finalizeProgram({
              totalRequired: result.programAdvance.program?.sessions?.length || 0,
            });
          }
        } catch (e) {
          console.error("[v2] programAdvance error", e);
        }
      }
      // 3. Auto-record bandit (Phase 6 SP4).
      // Crisis NO entra al bandit (acceso explícito, no spontaneous recommendation).
      // banditWeight viene del playerCompletion Phase 4 (penalty=0.5 en partial).
      if (selectedProtocol.useCase !== "crisis" && selectedProtocol.int) {
        try {
          store.recordSessionOutcome({
            intent: selectedProtocol.int,
            protocol: selectedProtocol.n,
            deltaMood: null, // sin checkin manual MVP
            predictedDelta: null,
            completionRatio: typeof playerSessionData?.banditWeight === "number"
              ? playerSessionData.banditWeight
              : 1,
            energyDelta: null,
            hrvDelta: null, // sin biometría real todavía (Phase 6B)
          });
        } catch (e) {
          console.error("[v2] recordSessionOutcome error", e);
        }
      }
    }
    // 4. Cerrar overlay.
    setPlayerOpen(false);
    setSelectedProtocol(null);
    setSessionStartedAt(null);
  }, [selectedProtocol, sessionStartedAt, store]);

  const handlePlayerCancel = useCallback(() => {
    // Cancel: no persiste sesión, no actualiza bandit.
    setPlayerOpen(false);
    setSelectedProtocol(null);
    setSessionStartedAt(null);
  }, []);

  const onBellClick = () => { console.log("[v2] bell click — drawer placeholder"); };
  const screenProps = tab === "hoy"
    ? { devOverride, onNavigate, onBellClick }
    : tab === "datos"
      ? { empty, onNavigate, onBellClick }
      : tab === "coach"
        ? { devOverride: coachOverride, onNavigate, onBellClick }
        : tab === "perfil"
          ? { devOverride: profileOverride, sectionInitial: profileSection, onNavigate, onBellClick }
          : { onNavigate, onBellClick };

  // Phase 6 SP5 — Onboarding gates.
  // 1. BioIgnitionWelcome: cuando user nunca completó el welcome.
  // 2. NeuralCalibration: post-welcome, hasta que onboardingComplete.
  // Devolución temprana garantiza que shell + tabs no se mountean hasta
  // que onboarding está cerrado. Salida vía dev-override ?onboard=skip.
  const skipOnboardParam = typeof window !== "undefined"
    && new URL(window.location.href).searchParams.get("onboard") === "skip";

  if (!skipOnboardParam && !store.welcomeDone) {
    return (
      <div
        data-v2-onboarding-welcome
        style={{
          minHeight: "100dvh",
          background: colors.bg.base,
          color: colors.text.primary,
          fontFamily: typography.family,
        }}
      >
        <BioIgnitionWelcome
          onComplete={(payload) => {
            // V2 payload: { intent, completedAt, skipped? }. Legacy compat
            // si alguna vez recibimos string crudo, lo aceptamos también.
            const intent = typeof payload === "string" ? payload : payload?.intent;
            if (intent) store.setFirstIntent(intent);
            store.setWelcomeDone(true);
          }}
          onSkip={() => {
            store.setWelcomeDone(true);
          }}
        />
      </div>
    );
  }

  if (!skipOnboardParam && store.welcomeDone && !store.onboardingComplete) {
    return (
      <div
        data-v2-onboarding-calibration
        style={{
          minHeight: "100dvh",
          background: colors.bg.base,
          color: colors.text.primary,
          fontFamily: typography.family,
        }}
      >
        <NeuralCalibration
          isDark={true}
          onComplete={(baseline) => {
            store.setNeuralBaseline(baseline);
            // setNeuralBaseline ya marca onboardingComplete=true.
          }}
        />
      </div>
    );
  }

  return (
    <div
      data-v2-root
      style={{
        minHeight: "100dvh",
        background: colors.bg.base,
        color: colors.text.primary,
        fontFamily: typography.family,
        fontWeight: typography.weight.regular,
        paddingBlockStart: "max(env(safe-area-inset-top), 16px)",
        paddingBlockEnd: `calc(${layout.bottomNavHeight}px + env(safe-area-inset-bottom))`,
      }}
    >
      <main
        data-v2-main
        style={{
          maxWidth: layout.maxContentWidth,
          marginInline: "auto",
        }}
      >
        <Screen {...screenProps} />
      </main>
      <BottomNavV2 active={tab} onSelect={setTab} />

      {/* Phase 6 SP4 — CrisisFAB persistente (oculto mientras el player
          o el sheet están abiertos para evitar superposición). */}
      {!playerOpen && !crisisSheetOpen && (
        <CrisisFAB onOpenSheet={handleOpenCrisisSheet} />
      )}
      <CrisisSheet
        open={crisisSheetOpen}
        onClose={handleCloseCrisisSheet}
        onSelectProtocol={handleCrisisProtocolSelect}
      />

      {/* Phase 6 SP3 — ProtocolPlayer overlay full-screen.
          State lifted al root para que cualquier tab pueda dispararlo
          via onNavigate({action:"start-recommended", protocolId}).
          Props reactivos vía `store` del hook (no getState() inline). */}
      {playerOpen && selectedProtocol && (
        <ProtocolPlayer
          key={`pp-${selectedProtocol.id}-${sessionStartedAt || 0}`}
          protocol={selectedProtocol}
          voiceOn={!!store.voiceOn}
          hapticOn={store.hapticOn !== false}
          binauralOn={store.binauralOn !== false && store.soundOn !== false}
          cameraEnabled={false}
          onComplete={handlePlayerComplete}
          onCancel={handlePlayerCancel}
        />
      )}
    </div>
  );
}

function useDevOverride() {
  const [override, setOverride] = useState(null);
  useEffect(() => {
    const read = () => {
      const url = new URL(window.location.href);
      const v = url.searchParams.get("state");
      setOverride(VALID_OVERRIDES.has(v) ? v : null);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  return override;
}

function useInitialTab() {
  // Lee ?tab=hoy|datos|coach|perfil una sola vez al mount.
  const [t] = useState(() => {
    if (typeof window === "undefined") return "hoy";
    const v = new URL(window.location.href).searchParams.get("tab");
    return VALID_TABS.has(v) ? v : "hoy";
  });
  return t;
}

function useEmptyOverride() {
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const read = () => {
      const url = new URL(window.location.href);
      setEmpty(url.searchParams.get("empty") === "true");
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  return empty;
}

function useProfileOverride() {
  const [v] = useState(() => {
    if (typeof window === "undefined") return null;
    const p = new URL(window.location.href).searchParams.get("profile");
    return VALID_PROFILE.has(p) ? p : null;
  });
  return v;
}

function useProfileSectionInitial() {
  const [v] = useState(() => {
    if (typeof window === "undefined") return null;
    const s = new URL(window.location.href).searchParams.get("ps");
    return VALID_PROFILE_SECTIONS.has(s) ? s : null;
  });
  return v;
}

function useCoachOverride() {
  // Sincrono en mount para que CoachV2 useState inicialice bien.
  const [v] = useState(() => {
    if (typeof window === "undefined") return null;
    const c = new URL(window.location.href).searchParams.get("coach");
    return VALID_COACH.has(c) ? c : null;
  });
  return v;
}
