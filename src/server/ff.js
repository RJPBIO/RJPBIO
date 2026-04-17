/* Feature flags — env + per-tenant override via Org.brandingJson.flags. */
export function flag(name, { org } = {}) {
  const envVal = process.env[`FF_${name.toUpperCase()}`];
  const orgFlag = org?.brandingJson?.flags?.[name];
  if (orgFlag != null) return !!orgFlag;
  if (envVal != null) return envVal === "1" || envVal === "true";
  return false;
}
