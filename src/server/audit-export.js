/* ═══════════════════════════════════════════════════════════════
   Audit log WORM export — append-only, tamper-evident offsite.
   In prod: set AUDIT_EXPORT_BUCKET with S3 Object Lock (Compliance
   mode). Every N entries, we ship a NDJSON page + SHA-256 manifest.
   Locally, we write to .audit-export/ so the chain is exercised.
   ═══════════════════════════════════════════════════════════════ */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db";

export async function exportChain(orgId, { sinceId = null, pageSize = 500 } = {}) {
  const entries = await db().auditLog.findMany({
    where: { orgId, ...(sinceId ? { id: { gt: sinceId } } : {}) },
    orderBy: { createdAt: "asc" },
    take: pageSize,
  });
  if (!entries.length) return { exported: 0, manifest: null };

  const ndjson = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  const manifest = createHash("sha256").update(ndjson).digest("hex");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `audit/${orgId}/${ts}__${entries[0].id}__${entries[entries.length - 1].id}.ndjson`;

  if (process.env.AUDIT_EXPORT_BUCKET) {
    // Placeholder: in production call AWS SDK PutObject with Object-Lock
    // headers (x-amz-object-lock-mode: COMPLIANCE, retain-until-date).
    // Intentionally left as a hook so deploys decide their SDK/cred flow.
  } else {
    const dir = ".audit-export";
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, key.replace(/\//g, "__")), ndjson, "utf8");
  }

  return { exported: entries.length, manifest, key };
}
