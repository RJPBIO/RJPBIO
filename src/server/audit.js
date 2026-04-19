/* ═══════════════════════════════════════════════════════════════
   Audit log append-only con hash chain SHA-256 + HMAC externo.
   - Hash chain: cada row encadena al anterior vía SHA-256.
   - HMAC "seal": cada row incluye un HMAC(prevHash + hash) usando
     AUDIT_HMAC_KEY. Un atacante que regrabe la cadena entera desde
     una mutación necesitaría también la llave para pasar verificación.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHash, createHmac } from "node:crypto";
import { db } from "./db";
import { headers } from "next/headers";

function sha256(s) { return createHash("sha256").update(s).digest("hex"); }

function sealHmac(prevHash, hash) {
  const key = process.env.AUDIT_HMAC_KEY;
  if (!key) return null;
  return createHmac("sha256", key).update(`${prevHash || ""}|${hash}`).digest("hex");
}

function canonicalize(entry) {
  const { prevHash, hash, id, ts, ...rest } = entry;
  const sorted = Object.keys(rest).sort().reduce((acc, k) => { acc[k] = rest[k]; return acc; }, {});
  return `${prevHash || ""}|${JSON.stringify(sorted)}`;
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
    const payload = r.payload ? { ...r.payload } : null;
    const seal = payload?._seal;
    if (payload && "_seal" in payload) delete payload._seal;
    const expected = sha256(canonicalize({ ...r, payload, prevHash: prev }));
    if (r.hash !== expected) return { ok: false, brokenAt: r.id, reason: "hash" };
    const expectedSeal = sealHmac(prev, r.hash);
    if (expectedSeal && seal !== expectedSeal) {
      return { ok: false, brokenAt: r.id, reason: "seal" };
    }
    prev = r.hash;
  }
  return { ok: true, entries: rows.length };
}
