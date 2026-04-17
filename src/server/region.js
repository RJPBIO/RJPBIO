/* ═══════════════════════════════════════════════════════════════
   Region routing — pick the right DB URL based on tenant region.
   Residency promise: "EU stays in EU, APAC in APAC, LATAM in LATAM".
   Configure REGION_DB_URL_* envs; falls back to DATABASE_URL.
   ═══════════════════════════════════════════════════════════════ */

const REGIONS = ["US", "EU", "APAC", "LATAM"];

export function dbUrlFor(region) {
  const key = `REGION_DB_URL_${String(region || "US").toUpperCase()}`;
  return process.env[key] || process.env.DATABASE_URL || "";
}

export function countryToRegion(country) {
  if (!country) return "US";
  const c = country.toUpperCase();
  if (["MX", "BR", "AR", "CL", "CO", "PE", "UY", "VE", "EC"].includes(c)) return "LATAM";
  if (["DE", "FR", "ES", "IT", "NL", "IE", "PT", "BE", "AT", "SE", "FI", "DK", "PL", "GB"].includes(c)) return "EU";
  if (["JP", "KR", "SG", "AU", "NZ", "HK", "TW", "TH", "VN", "MY", "ID", "PH", "IN"].includes(c)) return "APAC";
  return "US";
}

export function residencyHeaders(region) {
  return {
    "X-Data-Residency": REGIONS.includes(region) ? region : "US",
  };
}
