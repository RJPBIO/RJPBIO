/* ═══════════════════════════════════════════════════════════════
   Org security policies — pure helpers.
   ═══════════════════════════════════════════════════════════════
   Tres dimensiones de policy enforceables a nivel Org:

   1. requireMfa            — toda sesión necesita MFA verificado
                              (admin layout + jwt callback enforcement)
   2. sessionMaxAgeMinutes  — TTL custom de la JWT (default 8h global)
   3. ipAllowlist (CIDR)    — allowlist de IPv4 ranges; enforcement
                              en middleware vía getToken

   Usuarios con membership en VARIOS orgs heredan el policy más
   restrictivo (most-restrictive-wins): MFA si ANY requiere, TTL =
   MIN, IP debe satisfacer TODAS las allowlists activas.

   IPv6 deferred — la mayoría de allowlists enterprise son IPv4 NAT
   gateways / VPN endpoints. Cuando un cliente lo pida, se extiende.
   ═══════════════════════════════════════════════════════════════ */

export const SESSION_MAX_AGE_MIN_MINUTES = 5;
export const SESSION_MAX_AGE_MAX_MINUTES = 7 * 24 * 60;
export const IP_ALLOWLIST_MAX = 50;

export function parseIpv4(ip) {
  if (typeof ip !== "string") return null;
  const m = ip.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1, 5).map(Number);
  if (parts.some((p) => p < 0 || p > 255)) return null;
  // Bit-ops en JS truncan a int32; usamos *256 + multiply para preservar 32 bits.
  return (parts[0] * 0x1000000 + parts[1] * 0x10000 + parts[2] * 0x100 + parts[3]) >>> 0;
}

export function parseCidr(cidr) {
  if (typeof cidr !== "string") return null;
  const trimmed = cidr.trim();
  const slash = trimmed.indexOf("/");
  let ipPart, bitsStr;
  if (slash === -1) { ipPart = trimmed; bitsStr = "32"; }
  else { ipPart = trimmed.slice(0, slash); bitsStr = trimmed.slice(slash + 1); }
  const ip = parseIpv4(ipPart);
  if (ip === null) return null;
  // Number("") === 0 (válido como /0). Rechazamos explícito que la parte
  // de bits sea string vacío (caso "10.0.0.0/") para evitar fallback laxo.
  if (bitsStr === "") return null;
  const bits = Number(bitsStr);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const network = (ip & mask) >>> 0;
  return { network, mask, bits };
}

export function isIpInCidr(ip, cidr) {
  const ipNum = parseIpv4(ip);
  if (ipNum === null) return false;
  const c = typeof cidr === "string" ? parseCidr(cidr) : cidr;
  if (!c) return false;
  return ((ipNum & c.mask) >>> 0) === c.network;
}

export function isIpAllowed(ip, allowlist) {
  if (!Array.isArray(allowlist) || allowlist.length === 0) return true;
  for (const cidr of allowlist) {
    if (isIpInCidr(ip, cidr)) return true;
  }
  return false;
}

export function formatCidr({ network, bits }) {
  const a = (network >>> 24) & 0xff;
  const b = (network >>> 16) & 0xff;
  const c = (network >>> 8) & 0xff;
  const d = network & 0xff;
  return `${a}.${b}.${c}.${d}/${bits}`;
}

export function validateIpAllowlist(list) {
  if (!Array.isArray(list)) return { ok: false, error: "not_array" };
  if (list.length > IP_ALLOWLIST_MAX) return { ok: false, error: "too_many" };
  const cleaned = [];
  for (const entry of list) {
    if (typeof entry !== "string") return { ok: false, error: "non_string", value: entry };
    const c = parseCidr(entry);
    if (!c) return { ok: false, error: "invalid_cidr", value: entry };
    cleaned.push(formatCidr(c));
  }
  return { ok: true, value: Array.from(new Set(cleaned)) };
}

export function validateSessionMaxAge(minutes) {
  if (minutes === null || minutes === undefined) return { ok: true, value: null };
  if (typeof minutes !== "number" || !Number.isInteger(minutes)) return { ok: false, error: "not_integer" };
  if (minutes < SESSION_MAX_AGE_MIN_MINUTES) return { ok: false, error: "too_small" };
  if (minutes > SESSION_MAX_AGE_MAX_MINUTES) return { ok: false, error: "too_large" };
  return { ok: true, value: minutes };
}

export function validatePolicy(input) {
  const out = {};
  const errors = [];
  if (input?.requireMfa !== undefined) {
    if (typeof input.requireMfa !== "boolean") errors.push({ field: "requireMfa", error: "not_boolean" });
    else out.requireMfa = input.requireMfa;
  }
  if (input?.ipAllowlistEnabled !== undefined) {
    if (typeof input.ipAllowlistEnabled !== "boolean") errors.push({ field: "ipAllowlistEnabled", error: "not_boolean" });
    else out.ipAllowlistEnabled = input.ipAllowlistEnabled;
  }
  if (input?.ipAllowlist !== undefined) {
    const v = validateIpAllowlist(input.ipAllowlist);
    if (!v.ok) errors.push({ field: "ipAllowlist", error: v.error, value: v.value });
    else out.ipAllowlist = v.value;
  }
  if (input?.sessionMaxAgeMinutes !== undefined) {
    const v = validateSessionMaxAge(input.sessionMaxAgeMinutes);
    if (!v.ok) errors.push({ field: "sessionMaxAgeMinutes", error: v.error });
    else out.sessionMaxAgeMinutes = v.value;
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, policy: out };
}

/**
 * Combina policies de varios orgs (most-restrictive-wins).
 * @param {Array<{orgId?, requireMfa?, sessionMaxAgeMinutes?, ipAllowlistEnabled?, ipAllowlist?}>} policies
 */
export function effectivePolicy(policies) {
  const arr = Array.isArray(policies) ? policies : [];
  let requireMfa = false;
  let sessionMaxAgeMinutes = null;
  const ipChecks = [];
  for (const p of arr) {
    if (!p) continue;
    if (p.requireMfa) requireMfa = true;
    if (typeof p.sessionMaxAgeMinutes === "number" && Number.isInteger(p.sessionMaxAgeMinutes)) {
      sessionMaxAgeMinutes = sessionMaxAgeMinutes == null
        ? p.sessionMaxAgeMinutes
        : Math.min(sessionMaxAgeMinutes, p.sessionMaxAgeMinutes);
    }
    if (p.ipAllowlistEnabled && Array.isArray(p.ipAllowlist) && p.ipAllowlist.length) {
      ipChecks.push({ orgId: p.orgId || null, allowlist: p.ipAllowlist });
    }
  }
  return { requireMfa, sessionMaxAgeMinutes, ipChecks };
}

/**
 * ¿La IP pasa TODOS los ipChecks (uno por org con allowlist activa)?
 * Si no hay checks → true (no enforcement).
 */
export function ipPassesAllChecks(ip, ipChecks) {
  if (!Array.isArray(ipChecks) || ipChecks.length === 0) return true;
  for (const c of ipChecks) {
    if (!isIpAllowed(ip, c.allowlist)) return false;
  }
  return true;
}

/**
 * ¿La policy nueva dejaría al saver fuera (self-lockout)?
 * - Si allowlist no está enabled o está vacío → no lockout posible.
 * - Si la IP del saver es IPv6 (no parseable como v4) → no lockout
 *   (middleware hace pass-through para IPv6 hasta que añadamos soporte).
 * - Si la IP no está cubierta por el nuevo allowlist → lockout.
 *
 * @param {object} args
 * @param {string} args.currentIp        IP del request actual del saver
 * @param {string[]} args.newIpAllowlist Lista CIDR validada (post-validatePolicy)
 * @param {boolean} args.newIpAllowlistEnabled
 */
export function wouldSaverLockout({ currentIp, newIpAllowlist, newIpAllowlistEnabled }) {
  if (!newIpAllowlistEnabled) return false;
  if (!Array.isArray(newIpAllowlist) || newIpAllowlist.length === 0) return false;
  if (parseIpv4(currentIp) === null) return false;
  return !isIpAllowed(currentIp, newIpAllowlist);
}
