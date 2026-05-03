/* ═══════════════════════════════════════════════════════════════
   MFA policy enforcement (Sprint S3.1)
   ═══════════════════════════════════════════════════════════════
   Antes: `requireMfa` solo se enforce en /admin layout
   (src/app/(admin)/admin/layout.jsx). El gap real:

   - Un MEMBER de un org "requireMfa=true" podía acceder /app PWA
     sin MFA, capturar HRV/mood, y sincronizarlo al server vía
     /api/sync/outbox. El threat model "datos del operador no salen
     sin MFA verificado" estaba roto.

   Esta lib expone `enforceMfaIfPolicyDemands(session, opts)` que:

   1. Lee `session.securityPolicies` (embebido en JWT por auth.js).
   2. Si NINGUNA policy demanda MFA → ok.
   3. Si alguna demanda MFA → query `User.mfaVerifiedAt` y compara
      con `mfaMaxAgeHours` (default 24h). Si no verificado o stale,
      devuelve `{ ok: false, reason }`.

   Patrón de uso en handlers (/api/sync/*, /api/coach, etc):

       const mfa = await enforceMfaIfPolicyDemands(session);
       if (!mfa.ok) {
         return Response.json({ error: "mfa_required", reason: mfa.reason },
                              { status: 403 });
       }

   Nota: NO toca `/app` (layout no existe; frontend no se modifica
   en esta sesión). El enforcement vive en cada endpoint donde los
   datos del operador llegan al server.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";

const HOUR_MS = 3600_000;
const DEFAULT_MAX_AGE_HOURS = 24;

/**
 * Determina si la session debe pasar gate de MFA.
 * Devuelve { ok: true } cuando pasa o cuando ninguna policy lo demanda.
 *
 * @param {object} session                - resultado de auth()
 * @param {object} [opts]
 * @param {number} [opts.mfaMaxAgeHours]  - frescura mínima del último verify
 * @param {Date}   [opts.now]
 * @returns {Promise<{ok: boolean, reason?: string, demandedByOrgIds?: string[]}>}
 */
export async function enforceMfaIfPolicyDemands(session, opts = {}) {
  const maxAgeHours = Number.isFinite(opts.mfaMaxAgeHours) ? opts.mfaMaxAgeHours : DEFAULT_MAX_AGE_HOURS;
  const now = opts.now ?? new Date();

  if (!session?.user?.id) {
    return { ok: false, reason: "no_session" };
  }
  const policies = Array.isArray(session.securityPolicies) ? session.securityPolicies : [];
  const demanding = policies.filter((p) => p?.requireMfa);
  if (demanding.length === 0) {
    return { ok: true };
  }

  // Hay al menos un org con requireMfa=true. Lookup User.
  let user;
  try {
    const orm = await db();
    user = await orm.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true, mfaVerifiedAt: true },
    });
  } catch {
    // Fail-secure: si DB caída, denegar (no es fail-open en compliance).
    return { ok: false, reason: "mfa_lookup_failed", demandedByOrgIds: demanding.map((p) => p.orgId).filter(Boolean) };
  }
  if (!user) return { ok: false, reason: "user_not_found" };

  if (!user.mfaEnabled) {
    return {
      ok: false,
      reason: "mfa_not_enabled",
      demandedByOrgIds: demanding.map((p) => p.orgId).filter(Boolean),
    };
  }
  if (!user.mfaVerifiedAt) {
    return {
      ok: false,
      reason: "mfa_never_verified",
      demandedByOrgIds: demanding.map((p) => p.orgId).filter(Boolean),
    };
  }

  const verifiedAt = new Date(user.mfaVerifiedAt).getTime();
  const ageMs = now.getTime() - verifiedAt;
  if (ageMs > maxAgeHours * HOUR_MS) {
    return {
      ok: false,
      reason: "mfa_stale",
      verifiedAt: user.mfaVerifiedAt,
      ageHours: +(ageMs / HOUR_MS).toFixed(1),
      maxAgeHours,
      demandedByOrgIds: demanding.map((p) => p.orgId).filter(Boolean),
    };
  }

  return { ok: true };
}

/**
 * Helper: convierte el resultado de `enforceMfaIfPolicyDemands` en una
 * Response HTTP estándar para handlers. null si pasa el gate.
 */
export function mfaGateResponse(result) {
  if (!result || result.ok) return null;
  return Response.json(
    {
      error: "mfa_required",
      reason: result.reason || "mfa_required",
      ...(result.ageHours !== undefined ? { ageHours: result.ageHours, maxAgeHours: result.maxAgeHours } : {}),
      ...(result.demandedByOrgIds ? { demandedByOrgIds: result.demandedByOrgIds } : {}),
    },
    {
      status: 403,
      headers: { "X-MFA-Required": "true" },
    }
  );
}
