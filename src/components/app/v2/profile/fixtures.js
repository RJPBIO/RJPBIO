// Profile helpers — solo lo que NO es data del usuario.
//
// Phase 6B SP3 — eliminó FIXTURE_CALIBRATION + FIXTURE_INSTRUMENTS:
//   CalibrationView e InstrumentsView ahora leen del useStore real.
//
// Phase 6D SP3 — eliminó los 7 FIXTURE_* restantes (FIXTURE_PROFILE,
// FIXTURE_NOM35, FIXTURE_ENGINE_HEALTH, FIXTURE_SECURITY, FIXTURE_PRIVACY,
// FIXTURE_PRIVACY_B2B, FIXTURE_DATA_REQUESTS, FIXTURE_ACCOUNT). Cada
// sub-view ahora deriva su data del store o muestra empty state honesto
// hasta que SP4 wire los endpoints faltantes (security, dsar history).
//
// Archivo intencionalmente mantenido (en lugar de borrar) para preservar
// los dos helpers utilitarios que SÍ se usan: initialsFromName (avatar
// fallback) y relativeTime (formato "hace X min/h/días").

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
