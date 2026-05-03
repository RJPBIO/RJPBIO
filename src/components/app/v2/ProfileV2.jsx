"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
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
import {
  FIXTURE_PROFILE,
  FIXTURE_SECURITY,
  FIXTURE_PRIVACY,
  FIXTURE_PRIVACY_B2B,
  FIXTURE_ENGINE_HEALTH,
} from "./profile/fixtures";

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

export default function ProfileV2({ onNavigate, onBellClick, devOverride = null, sectionInitial = null }) {
  const store = useStore();
  const [section, setSection] = useState(sectionInitial);
  useEffect(() => { console.log("[v2] ProfileV2 active", { section, devOverride }); }, [section, devOverride]);

  const profile = useProfileData(store);
  const b2b = devOverride === "b2b";
  const privacy = b2b ? FIXTURE_PRIVACY_B2B : FIXTURE_PRIVACY;

  const SubView = section ? SECTION_VIEWS[section] : null;

  if (SubView) {
    const subProps = { onBack: () => setSection(null), onNavigate };
    if (section === "privacy") subProps.b2b = b2b;
    return <SubView {...subProps} />;
  }

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <IdentityHeader name={profile.name} email={profile.email} level={profile.level} />
      <StatsHighlights
        totalSessions={profile.totalSessions}
        streak={profile.streak}
        achievementsCount={profile.achievementsCount}
      />
      <SubRoutesList rows={buildRows(profile, b2b)} onPick={(id) => setSection(id)} />
    </>
  );
}

function buildRows(profile, b2b) {
  const eh = FIXTURE_ENGINE_HEALTH;
  const ehDescriptor = eh.overall === "Personalizado"
    ? `Personalizado · ${profile.totalSessions} sesiones`
    : eh.overall === "Aprendiendo"
      ? `Aprendiendo · ${profile.totalSessions} sesiones`
      : `Conociéndonos · ${profile.totalSessions} de 5 sesiones`;
  const sec = FIXTURE_SECURITY;
  const securityDescriptor = sec.mfaEnabled
    ? `MFA activo · ${sec.trustedDevicesCount} dispositivos confiables`
    : "MFA recomendado · sin MFA";
  const privacyDescriptor = b2b ? "Personal · Empresa Acme" : "Cuenta personal";

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

function useProfileData(store) {
  // Real store fields cuando esten disponibles, else fixture.
  const totalSessions = Array.isArray(store?.history) ? store.history.length : 0;
  const useFixture = totalSessions === 0;
  if (useFixture) return FIXTURE_PROFILE;
  return {
    name: store?.userName || FIXTURE_PROFILE.name,
    email: store?._userEmail || FIXTURE_PROFILE.email,
    avatar: null,
    level: 3,
    totalSessions,
    streak: store?.streak || 0,
    bestStreak: store?.bestStreak || 0,
    achievementsCount: Array.isArray(store?.achievements) ? store.achievements.length : 0,
  };
}
