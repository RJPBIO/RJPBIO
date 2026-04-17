/* Feature flags — env + per-tenant override via Org.branding.flags. */
export function flag(name, { org } = {}) {
  const envVal = process.env[`FF_${name.toUpperCase()}`];
  const orgFlag = org?.branding?.flags?.[name];
  if (orgFlag != null) return !!orgFlag;
  if (envVal != null) return envVal === "1" || envVal === "true";
  return false;
}
