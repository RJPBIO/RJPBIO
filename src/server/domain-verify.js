/* ═══════════════════════════════════════════════════════════════
   Custom domain DNS verification — DB ops + DNS resolveTxt.
   ═══════════════════════════════════════════════════════════════
   Lib pura en lib/domain-verify.js (token gen, TXT match, instructions).
   Este módulo hace lookup DNS real + persiste status.

   Importante: dns.resolveTxt corre en runtime nodejs (no edge). Las
   routes que importan esto deben tener `export const runtime = "nodejs"`.
   En Vercel, default Node runtime ya cumple.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { promises as dns } from "node:dns";
import { db } from "./db";
import { auditLog } from "./audit";
import {
  generateVerifyToken,
  verifyHostname,
  txtMatchesToken,
} from "@/lib/domain-verify";

/**
 * Inicia o reinicia el flow de verificación. Genera un token nuevo
 * (rotación) y lo persiste. Retorna { token, hostname }.
 *
 * Idempotente con override: cada start regenera el token (los DNS records
 * viejos quedan inválidos si el admin los puso). Auditable.
 */
export async function startDomainVerification({ orgId, actorUserId, domain }) {
  if (!orgId || !domain) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const token = generateVerifyToken();
    await orm.org.update({
      where: { id: orgId },
      data: {
        customDomainVerifyToken: token,
        customDomainVerified: false,
        customDomainVerifiedAt: null,
        customDomainLastCheckedAt: null,
      },
    });
    await auditLog({
      orgId,
      actorId: actorUserId || null,
      action: "org.domain.verify.started",
      payload: { domain },
    }).catch(() => {});
    return {
      ok: true,
      token,
      hostname: verifyHostname(domain),
    };
  } catch {
    return { ok: false, error: "start_failed" };
  }
}

/**
 * Hace dns.resolveTxt en el subdomain de verificación y compara contra
 * el token persistido. Si match → marca verified=true.
 *
 * @returns {Promise<{ok, verified?, records?, error?}>}
 */
export async function checkDomainVerification({ orgId, actorUserId, domain }) {
  if (!orgId || !domain) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    const org = await orm.org.findUnique({
      where: { id: orgId },
      select: { customDomainVerifyToken: true, customDomainVerified: true },
    });
    if (!org) return { ok: false, error: "not_found" };
    if (!org.customDomainVerifyToken) {
      return { ok: false, error: "no_token", message: "Inicia verificación primero" };
    }

    const hostname = verifyHostname(domain);
    let records = [];
    let resolveError = null;
    try {
      records = await dns.resolveTxt(hostname);
    } catch (e) {
      // ENODATA / ENOTFOUND son normales si el record aún no propagó.
      resolveError = e?.code || String(e);
    }

    const matched = txtMatchesToken(records, org.customDomainVerifyToken);
    const now = new Date();

    await orm.org.update({
      where: { id: orgId },
      data: {
        customDomainLastCheckedAt: now,
        ...(matched
          ? { customDomainVerified: true, customDomainVerifiedAt: now }
          : {}),
      },
    });

    await auditLog({
      orgId,
      actorId: actorUserId || null,
      action: matched ? "org.domain.verify.success" : "org.domain.verify.attempt",
      payload: {
        domain,
        hostname,
        matched,
        resolveError,
        recordCount: records.length,
      },
    }).catch(() => {});

    return {
      ok: true,
      verified: matched,
      records: records.map((r) => Array.isArray(r) ? r.join("") : r),
      resolveError,
    };
  } catch {
    return { ok: false, error: "check_failed" };
  }
}

/**
 * Limpia el token + status. Útil si el admin abandona el flow o cambia
 * de dominio. NO afecta el customDomain en branding (ese es por separado).
 */
export async function clearDomainVerification({ orgId, actorUserId }) {
  if (!orgId) return { ok: false, error: "bad_input" };
  try {
    const orm = await db();
    await orm.org.update({
      where: { id: orgId },
      data: {
        customDomainVerifyToken: null,
        customDomainVerified: false,
        customDomainVerifiedAt: null,
        customDomainLastCheckedAt: null,
      },
    });
    await auditLog({
      orgId,
      actorId: actorUserId || null,
      action: "org.domain.verify.cleared",
    }).catch(() => {});
    return { ok: true };
  } catch {
    return { ok: false, error: "clear_failed" };
  }
}
