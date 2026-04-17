/* ═══════════════════════════════════════════════════════════════
   Audit log append-only con hash chain SHA-256.
   Inviolabilidad verificable reejecutando el chain.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { headers } from "next/headers";

function sha256(s) { return createHash("sha256").update(s).digest("hex"); }

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
  return orm.auditLog.create({ data: { ...entry, hash, ts: new Date() } });
}

export async function verifyChain(orgId) {
  const orm = await db();
  const rows = await orm.auditLog.findMany({ where: { orgId }, orderBy: { ts: "asc" } });
  let prev = null;
  for (const r of rows) {
    const expected = sha256(canonicalize({ ...r, prevHash: prev }));
    if (r.hash !== expected) return { ok: false, brokenAt: r.id };
    prev = r.hash;
  }
  return { ok: true, entries: rows.length };
}
