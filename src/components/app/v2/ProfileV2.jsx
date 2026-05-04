"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { getLevel } from "@/lib/neural";
import HeaderV2 from "./home/HeaderV2";
import IdentityHeader from "./profile/IdentityHeader";
import StatsHighlights from "./profile/StatsHighlights";
import SubRoutesList from "./profile/SubRoutesList";
import CalibrationView from "./profile/calibration/CalibrationView";
import InstrumentsView from "./profile/instruments/InstrumentsView";
import Nom35View from "./profile/nom35/Nom35View";
import EngineHealthView from "./profile/engine-health/EngineHealthView";
import SettingsView from "./profile/settings/SettingsView";
import SecurityView from "./profile/security/SecurityView";
import PrivacyView from "./profile/privacy/PrivacyView";
import DataRequestsView from "./profile/data-requests/DataRequestsView";
import AccountView from "./profile/account/AccountView";
import { devLog } from "@/lib/dev-utils";

const SECTION_VIEWS = {
  calibration:    CalibrationView,
  instruments:    InstrumentsView,
  nom35:          Nom35View,
  "engine-health": EngineHealthView,
  settings:       SettingsView,
  security:       SecurityView,
  privacy:        PrivacyView,
  "data-requests": DataRequestsView,
  account:        AccountView,
};

// Phase 6D SP3 — fixtures cleanup. ProfileV2 ahora deriva TODA su data
// del store (sin fallbacks a FIXTURE_PROFILE). Reemplaza:
//
//   - FIXTURE_PROFILE.name "Operador Neural"     → null o derivado de email
//   - FIXTURE_PROFILE.email "operador@bio-..."   → state._userEmail
//   - level: 3 hardcoded                         → getLevel(totalSessions)
//   - totalSessions/streak/achievementsCount     → del store directo
//
// Si user no tiene sessions, IdentityHeader muestra empty state honesto
// en lugar del fake "47 sesiones · racha 7 · 8 logros". Bug-21 fix:
// _userEmail ahora existe en DS (Phase 6D SP3) y se setea via setUserEmail
// desde el sign-in flow o un wiring raíz con useSession.
//
// Para previewing dev (?profile=b2b), el devOverride sigue funcional pero
// solo afecta PrivacyView (b2b vs personal) — NO inyecta fixture identity.

// Phase 6D SP4c — section + subAnchor ahora controlados externamente.
// AppV2Root mantiene el state lifted para poder dispatch desde otros tabs
// (e.g. HomeV2 ColdStart card "Mide tu HRV" → target:/app/profile/calibration#hrv
// → AppV2Root setea tab=perfil + section=calibration + subAnchor=hrv).
// Antes (Bug-11): ProfileV2 mantenía section local sin setter externo, así
// que target navigation cambiaba tab pero no abría la sub-section.
//
// Backward-compat: si caller no provee section/onSectionChange (e.g. tests
// legacy), usamos local state controlado por sectionInitial — comportamiento
// pre-SP4c. Esto evita romper consumidores existentes mientras AppV2Root
// migra al patrón controlled.

export default function ProfileV2({
  onNavigate,
  onBellClick,
  devOverride = null,
  sectionInitial = null,
  section: sectionProp,
  onSectionChange,
  subAnchor = null,
}) {
  const userEmail = useStore((s) => s._userEmail);
  const totalSessions = useStore((s) => s.totalSessions || 0);
  const historyLen = useStore((s) => Array.isArray(s.history) ? s.history.length : 0);
  const streak = useStore((s) => s.streak || 0);
  const achievements = useStore((s) => s.achievements);

  // Controlled vs uncontrolled. Si parent provee section/onSectionChange,
  // usamos esos; si no, fallback a local state (modo legacy pre-SP4c).
  const isControlled = sectionProp !== undefined && typeof onSectionChange === "function";
  const [internalSection, setInternalSection] = useState(sectionInitial);
  const section = isControlled ? sectionProp : internalSection;
  const setSection = isControlled
    ? onSectionChange
    : setInternalSection;

  useEffect(() => { devLog("[v2] ProfileV2 active", { section, devOverride }); }, [section, devOverride]);

  const profile = buildProfile({ userEmail, totalSessions, historyLen, streak, achievements });
  const b2b = devOverride === "b2b";

  const SubView = section ? SECTION_VIEWS[section] : null;

  if (SubView) {
    const subProps = { onBack: () => setSection(null), onNavigate, subAnchor };
    if (section === "privacy") subProps.b2b = b2b;
    return <SubView {...subProps} />;
  }

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <IdentityHeader
        displayName={profile.displayName}
        email={profile.email}
        level={profile.level}
        isEmpty={profile.isEmpty}
      />
      {!profile.isEmpty && (
        <StatsHighlights
          totalSessions={profile.totalSessions}
          streak={profile.streak}
          achievementsCount={profile.achievementsCount}
        />
      )}
      <SubRoutesList rows={buildRows(profile, b2b)} onPick={(id) => setSection(id)} />
    </>
  );
}

// Phase 6D SP3 — derive profile from real store. No fixture fallback.
function buildProfile({ userEmail, totalSessions, historyLen, streak, achievements }) {
  const sessionsForLevel = totalSessions || historyLen;
  const isEmpty = sessionsForLevel === 0;
  // Display name desde el local part del email — fallback razonable cuando
  // no hay full name (NextAuth providers como magic link sólo tienen email).
  // Ejemplo: "ana.gomez@empresa.com" → "ana.gomez". Si no hay email, null.
  const displayName = userEmail
    ? userEmail.split("@")[0]
    : null;
  // getLevel() de lib/neural retorna { n: "Delta"|"Theta"|... , g, m, mx, c, d }
  // basado en thresholds de sessions. Sub 0 cae a Delta (m=0). Esto reemplaza
  // el `level: 3` hardcoded que mostraba "NIVEL 3" para todo user con 1+ sesión.
  const lvl = getLevel(sessionsForLevel);
  return {
    displayName,
    email: userEmail || null,
    isEmpty,
    totalSessions: sessionsForLevel,
    streak,
    achievementsCount: Array.isArray(achievements) ? achievements.length : 0,
    level: {
      name: lvl?.n || "Delta",
      glyph: lvl?.g || "δ",
      color: lvl?.c || null,
    },
  };
}

function buildRows(profile, b2b) {
  // Engine health descriptor honesto: deriva del state real en lugar del
  // fixture FIXTURE_ENGINE_HEALTH.overall. Threshold pragmático: <5 sessions
  // = "conociéndonos" (cold-start), 5-29 = "aprendiendo" (early personalization),
  // 30+ = "personalizado" (bandit ya tiene data significativa).
  let ehDescriptor;
  if (profile.totalSessions === 0) ehDescriptor = "Sin datos · primera sesión pendiente";
  else if (profile.totalSessions < 5) ehDescriptor = `Conociéndonos · ${profile.totalSessions} de 5 sesiones`;
  else if (profile.totalSessions < 30) ehDescriptor = `Aprendiendo · ${profile.totalSessions} sesiones`;
  else ehDescriptor = `Personalizado · ${profile.totalSessions} sesiones`;

  // Security descriptor honesto: hasta SP4 wire al endpoint real, mostramos
  // copy genérico que no miente. Antes el fixture decía "MFA activo · 2
  // dispositivos confiables" para todos los users — engañoso.
  const securityDescriptor = "Ver MFA, sesiones y dispositivos";

  const privacyDescriptor = b2b ? "Personal · empresa" : "Cuenta personal";

  return [
    { id: "calibration",    icon: "compass",         title: "Calibración",          descriptor: "Cronotipo · Resonancia · HRV baseline" },
    { id: "instruments",    icon: "clipboard-list",  title: "Instrumentos",         descriptor: "PSS-4 · SWEMWBS-7 · PHQ-2" },
    { id: "nom35",          icon: "shield-check",    title: "NOM-035 STPS",         descriptor: "Evaluación 72 ítems · personal" },
    { id: "engine-health",  icon: "activity",        title: "Salud del motor",      descriptor: ehDescriptor },
    { id: "settings",       icon: "settings",        title: "Ajustes",              descriptor: "Notificaciones · audio · voz · haptic" },
    { id: "security",       icon: "lock",            title: "Seguridad",            descriptor: securityDescriptor },
    { id: "privacy",        icon: "users",           title: "Privacidad y empresa", descriptor: privacyDescriptor },
    { id: "data-requests",  icon: "download",        title: "Mis datos",            descriptor: "Exportar · solicitar · eliminar" },
    { id: "account",        icon: "user",            title: "Cuenta",               descriptor: "Email · password · cerrar sesión" },
  ];
}
