// Fixtures dev para Tab Perfil. NO mutan store.

export const FIXTURE_PROFILE = {
  name: "Operador Neural",
  email: "operador@bio-ignicion.local",
  avatar: null,
  level: 3,
  totalSessions: 47,
  streak: 7,
  bestStreak: 14,
  achievementsCount: 8,
};

export const FIXTURE_CALIBRATION = {
  chronotype: { label: "Vespertino moderado", score: 41, lastTs: Date.now() - 23 * 86400000 },
  resonance:  { rate: 5.5, lastTs: Date.now() - 9 * 86400000 },
  hrv:        { rmssd: 47, n: 12, lastTs: Date.now() - 3 * 86400000 },
};

export const FIXTURE_INSTRUMENTS = {
  pss4:    { score: 7, max: 16, level: "Estrés bajo",       lastTs: Date.now() - 12 * 86400000 },
  swemwbs: { score: 28, max: 35, level: "Bienestar funcional", lastTs: Date.now() - 14 * 86400000 },
  phq2:    { score: 1, max: 6, level: "Sin signos",          lastTs: Date.now() - 30 * 86400000 },
};

export const FIXTURE_NOM35 = {
  hasResponse: true,
  level: "Riesgo medio",
  lastTs: Date.now() - 60 * 86400000,
};

export const FIXTURE_ENGINE_HEALTH = {
  overall: "Personalizado",
  overallCaption: "El motor te conoce. 47 sesiones procesadas.",
  hitRate: 82,
  acceptance: 0.74,
  personalization: "Alta",
  dataConfidence: 0.91,
  cohortPrior: {
    available: true,
    teamN: 12,
    summary: "Tu equipo (n=12) tiene patrones similares al tuyo en horas matutinas.",
    buckets: [
      { bucket: "Madrugada", intent: "calma" },
      { bucket: "Mañana",    intent: "enfoque" },
      { bucket: "Tarde",     intent: "reset" },
      { bucket: "Noche",     intent: "calma" },
    ],
  },
  calibrationBias: [
    { protocol: "Pulse Shift",            bias: +1.2, n: 12 },
    { protocol: "Reinicio Parasimpático", bias: -0.4, n: 9  },
    { protocol: "Activación Cognitiva",   bias: +0.7, n: 8  },
    { protocol: "Reset Ejecutivo",        bias: -1.1, n: 7  },
    { protocol: "Skyline Focus",          bias:  0.0, n: 6  },
  ],
  actions: [
    "Calibra HRV de nuevo",
    "Sesión a las 06:00 para mejorar accuracy",
    "Diversifica intent — solo has hecho enfoque esta semana",
  ],
};

export const FIXTURE_SETTINGS = {
  reminders: { enabled: false, hour: 7, min: 30 },
  weeklySummary: true,
  audio: { volume: 0.85, music: true, binaural: true },
  voice: { enabled: true, preference: "default", rate: 1.0 },
  haptic: { enabled: true, intensity: "normal" },
  reducedMotion: false,
};

export const FIXTURE_SECURITY = {
  mfaEnabled: true,
  mfaSetupTs: Date.now() - 90 * 86400000,
  trustedDevicesCount: 2,
  sessions: [
    { id: "s1", device: "Mac · Chrome",   location: "CDMX, MX", lastSeen: Date.now() - 3 * 60 * 1000,        current: true  },
    { id: "s2", device: "iPhone · Safari", location: "CDMX, MX", lastSeen: Date.now() - 4 * 60 * 60 * 1000,   current: false },
    { id: "s3", device: "iPad · Safari",   location: "CDMX, MX", lastSeen: Date.now() - 6 * 86400000,         current: false },
  ],
  trustedDevices: [
    { id: "t1", label: "Mac personal",    addedTs: Date.now() - 30 * 86400000 },
    { id: "t2", label: "iPhone personal", addedTs: Date.now() - 14 * 86400000 },
  ],
};

export const FIXTURE_PRIVACY = {
  memberships: [
    { orgId: "personal-1", orgName: "Cuenta personal", role: "OWNER",  isPersonal: true  },
  ],
  hasAdminAccess: false,
};

export const FIXTURE_PRIVACY_B2B = {
  memberships: [
    { orgId: "personal-1", orgName: "Cuenta personal", role: "OWNER",  isPersonal: true  },
    { orgId: "acme",       orgName: "Acme",            role: "ADMIN",  isPersonal: false },
  ],
  hasAdminAccess: true,
};

export const FIXTURE_DATA_REQUESTS = {
  pending: null,
  history: [
    { kind: "ACCESS",     status: "RESOLVED", ts: Date.now() - 45 * 86400000 },
  ],
};

export const FIXTURE_ACCOUNT = {
  email: "operador@bio-ignicion.local",
  hasPassword: true,
  linkedProviders: [
    { id: "google", label: "Google",   sub: "operador@gmail.com" },
  ],
};

export function initialsFromName(name) {
  if (!name) return "ON";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "ON";
}

export function relativeTime(ts) {
  if (!ts) return "nunca";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const months = Math.floor(d / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}
