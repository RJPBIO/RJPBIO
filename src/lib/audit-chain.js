/* ═══════════════════════════════════════════════════════════════
   Audit hash-chain — pure helpers shared between the server writer
   (src/server/audit.js) and the CLI verifiers (scripts/verify-*.js).

   Keeping this module pure (no "server-only", no next/headers) lets
   offline tooling recompute the exact same hash the server stored.
   ═══════════════════════════════════════════════════════════════ */

import { createHash, createHmac } from "node:crypto";

export function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

/* Canonical form hashed into the chain. Excludes id/ts/hash (metadata
   not part of the signed envelope) and prepends prevHash as a framed
   prefix so a cross-row collision would have to also collide the
   delimiter. Keys are sorted to survive payload re-serialization. */
export function canonicalize(entry) {
  const { prevHash, hash, id, ts, ...rest } = entry;
  const sorted = Object.keys(rest).sort().reduce((acc, k) => {
    acc[k] = rest[k];
    return acc;
  }, {});
  return `${prevHash || ""}|${JSON.stringify(sorted)}`;
}

/* Strips the `_seal` field that auditLog() injects into payload AFTER
   hashing. Re-verification must hash the payload WITHOUT _seal, so any
   consumer that read the row back must call this before canonicalize. */
export function stripSeal(payload) {
  if (!payload || typeof payload !== "object") return { payload, seal: null };
  if (!("_seal" in payload)) return { payload, seal: null };
  const { _seal, ...rest } = payload;
  return { payload: rest, seal: _seal };
}

export function sealHmac(prevHash, hash, key) {
  if (!key) return null;
  return createHmac("sha256", key).update(`${prevHash || ""}|${hash}`).digest("hex");
}

/* Recomputes hash (and optional seal) for a single row as read from the
   DB. Returns { expectedHash, expectedSeal, storedSeal }. */
export function recomputeRow(row, prevHash, hmacKey) {
  const { payload: cleanPayload, seal: storedSeal } = stripSeal(row.payload);
  const canonicalEntry = {
    orgId: row.orgId ?? null,
    actorId: row.actorId ?? null,
    actorEmail: row.actorEmail ?? null,
    action: row.action,
    target: row.target ?? null,
    ip: row.ip ?? null,
    ua: row.ua ?? null,
    payload: cleanPayload,
    prevHash: prevHash ?? null,
  };
  const expectedHash = sha256(canonicalize(canonicalEntry));
  const expectedSeal = sealHmac(prevHash, expectedHash, hmacKey);
  return { expectedHash, expectedSeal, storedSeal };
}
