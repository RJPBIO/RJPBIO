/* ═══════════════════════════════════════════════════════════════
   Audit log append-only con hash chain SHA-256 + HMAC externo.
   - Hash chain: cada row encadena al anterior vía SHA-256.
   - HMAC "seal": cada row incluye un HMAC(prevHash + hash) usando
     AUDIT_HMAC_KEY. Un atacante que regrabe la cadena entera desde
     una mutación necesitaría también la llave para pasar verificación.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import { headers } from "next/headers";
import { sha256, canonicalize, sealHmac as sealHmacPure, recomputeRow } from "../lib/audit-chain";

function sealHmac(prevHash, hash) {
  return sealHmacPure(prevHash, hash, process.env.AUDIT_HMAC_KEY);
}

export async function auditLog({ orgId, actorId, actorEmail, action, target, payload }) {
  const orm = await db();
  let ip, ua;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    ua = h.get("user-agent") || null;
  } catch {}

  const last = orgId ? await orm.auditLog.findFirst({
    where: { orgId }, orderBy: { ts: "desc" },
  }) : null;

  const entry = {
    orgId: orgId || null,
    actorId: actorId || null,
    actorEmail: actorEmail || null,
    action,
    target: target || null,
    ip, ua,
    payload: payload || null,
    prevHash: last?.hash || null,
  };
  const hash = sha256(canonicalize(entry));
  const seal = sealHmac(entry.prevHash, hash);
  const data = { ...entry, hash, ts: new Date() };
  if (seal) data.payload = { ...(entry.payload || {}), _seal: seal };
  return orm.auditLog.create({ data });
}

export async function verifyChain(orgId) {
  const orm = await db();
  const rows = await orm.auditLog.findMany({ where: { orgId }, orderBy: { ts: "asc" } });
  let prev = null;
  for (const r of rows) {
    const { expectedHash, expectedSeal, storedSeal } = recomputeRow(r, prev, process.env.AUDIT_HMAC_KEY);
    if (r.hash !== expectedHash) return { ok: false, brokenAt: r.id, reason: "hash" };
    if (expectedSeal && storedSeal !== expectedSeal) {
      return { ok: false, brokenAt: r.id, reason: "seal" };
    }
    prev = r.hash;
  }
  return { ok: true, entries: rows.length };
}

/**
 * Sprint 10 — Sweeper de retención. Borra logs cuyo ts < cutoff.
 * Borrar logs antiguos dentro de la política es legítimo. La cadena
 * hash sigue verificable para los logs restantes (chain advances
 * naturally desde el primer log no borrado).
 *
 * @param {string} orgId
 * @param {number} retentionDays — debe estar pre-validado (30..2555)
 * @returns {Promise<number>} count borrado
 */
export async function pruneByRetention(orgId, retentionDays) {
  if (!orgId || !Number.isInteger(retentionDays)) return 0;
  try {
    const cutoff = new Date(Date.now() - retentionDays * 86400_000);
    const orm = await db();
    const r = await orm.auditLog.deleteMany({
      where: { orgId, ts: { lt: cutoff } },
    });
    return r?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Sprint 10 — Lee logs para export. Filtra por rango opcional.
 * Hard-cap en 50k rows para evitar OOM en orgs grandes.
 *
 * @param {object} args
 * @param {string} args.orgId
 * @param {Date|null} [args.from]
 * @param {Date|null} [args.to]
 * @param {number} [args.limit=50000]
 */
export async function readAuditLogsForExport({ orgId, from, to, limit = 50_000 }) {
  if (!orgId) return [];
  try {
    const orm = await db();
    const where = { orgId };
    if (from || to) {
      where.ts = {};
      if (from) where.ts.gte = from;
      if (to) where.ts.lte = to;
    }
    return await orm.auditLog.findMany({
      where,
      orderBy: { ts: "asc" },
      take: Math.min(Math.max(1, limit), 50_000),
    });
  } catch {
    return [];
  }
}
