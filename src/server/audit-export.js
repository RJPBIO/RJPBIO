/* ═══════════════════════════════════════════════════════════════
   Audit log WORM export — append-only, tamper-evident offsite (Sprint S3.2)
   ═══════════════════════════════════════════════════════════════
   Pipeline:
     1. Lee chunk de `AuditLog` por `orgId` + `sinceId` cursor.
     2. Serializa NDJSON.
     3. Calcula SHA-256 manifest del NDJSON.
     4. Escribe a S3 (Object Lock COMPLIANCE) si está configurado,
        else filesystem `.audit-export/` (mock dev stub).
     5. Retorna `{exported, manifest, key, sinceId, lastId, target}`.

   ─── Cómo activar S3 Object Lock real ───────────────────────────
   1. Crear bucket S3 con Object Lock habilitado al CREAR (no se puede
      activar post-hoc):
        aws s3api create-bucket --bucket bio-ignicion-audit-prod \
          --object-lock-enabled-for-bucket --region us-east-1

   2. Configurar default retention (opcional pero recomendado):
        aws s3api put-object-lock-configuration --bucket bio-ignicion-audit-prod \
          --object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"COMPLIANCE","Days":2555}}}'

   3. Set env vars en Vercel/AWS:
        AUDIT_EXPORT_BUCKET=bio-ignicion-audit-prod
        AWS_REGION=us-east-1
        AWS_ACCESS_KEY_ID=...     (o IAM role en Vercel)
        AWS_SECRET_ACCESS_KEY=...
        AUDIT_OBJECT_LOCK_DAYS=2555  (opcional; default 2555 = 7 años)

   4. Instalar AWS SDK (no agregamos como dep automáticamente para no
      inflar el bundle si el dueño no usa S3):
        npm i @aws-sdk/client-s3

   5. Una vez instalado y env configurado, esta función detecta y usa
      la ruta real automáticamente. Si el SDK no está instalado, lanza
      error explícito en runtime — fail loud, no fallback silencioso.

   ─── Por qué Object Lock COMPLIANCE mode ────────────────────────
   - GOVERNANCE mode: admin con permiso especial puede borrar antes
     del retain-until. Útil para sandbox.
   - COMPLIANCE mode: nadie (ni el root account) puede borrar antes
     del retain-until. Esto es lo que SOC2/HIPAA evidence pack
     necesita: una garantía criptográfica + S3-side de inmutabilidad.

   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db";
import { auditLog } from "./audit";

const DEFAULT_OBJECT_LOCK_DAYS = 2555; // 7 años (SOC2 + HIPAA típico)
const DEFAULT_PAGE_SIZE = 500;

/**
 * Export 1 chunk de la audit chain de un org. Idempotente con cursor.
 *
 * @param {string} orgId
 * @param {object} [opts]
 * @param {bigint|number|null} [opts.sinceId]   - cursor (último id exportado)
 * @param {number} [opts.pageSize]              - default 500
 * @param {number} [opts.objectLockDays]        - retención WORM
 * @returns {Promise<{exported:number, manifest:string|null, key:string|null, sinceId:bigint|number|null, lastId:bigint|number|null, target:"s3"|"fs"|"none", objectLockDays?:number}>}
 */
export async function exportChain(orgId, {
  sinceId = null,
  pageSize = DEFAULT_PAGE_SIZE,
  objectLockDays = Number(process.env.AUDIT_OBJECT_LOCK_DAYS) || DEFAULT_OBJECT_LOCK_DAYS,
} = {}) {
  const orm = await db();
  const where = { orgId };
  if (sinceId !== null && sinceId !== undefined) {
    where.id = { gt: sinceId };
  }

  const entries = await orm.auditLog.findMany({
    where,
    orderBy: { id: "asc" },
    take: pageSize,
  });

  if (!entries.length) {
    return { exported: 0, manifest: null, key: null, sinceId, lastId: sinceId, target: "none" };
  }

  // Serialización NDJSON (BigInt-safe). JSON.stringify falla con BigInt;
  // convertimos antes.
  const ndjson = entries.map((e) => JSON.stringify(serializeAuditRow(e))).join("\n") + "\n";
  const manifest = createHash("sha256").update(ndjson).digest("hex");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const firstId = entries[0].id;
  const lastId = entries[entries.length - 1].id;
  const key = `audit/${orgId}/${ts}__${firstId}__${lastId}.ndjson`;

  let target = "fs";
  if (process.env.AUDIT_EXPORT_BUCKET && process.env.AWS_REGION) {
    target = "s3";
    await putToS3WithObjectLock({
      bucket: process.env.AUDIT_EXPORT_BUCKET,
      region: process.env.AWS_REGION,
      key,
      body: ndjson,
      objectLockDays,
      manifest,
    });
  } else {
    await writeFsStub({ key, ndjson });
  }

  await auditLog({
    orgId,
    action: "audit.export.chunk",
    payload: { manifest, key, exported: entries.length, target, objectLockDays: target === "s3" ? objectLockDays : undefined },
  }).catch(() => {});

  return { exported: entries.length, manifest, key, sinceId, lastId, target, ...(target === "s3" ? { objectLockDays } : {}) };
}

/**
 * Serializa una row de AuditLog a JSON (BigInt → string, Date → ISO).
 */
function serializeAuditRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (typeof v === "bigint") out[k] = v.toString();
    else if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}

/**
 * Escribe a S3 con Object Lock COMPLIANCE. Requiere `@aws-sdk/client-s3`
 * instalado. Lanza error explícito si no está.
 */
async function putToS3WithObjectLock({ bucket, region, key, body, objectLockDays, manifest }) {
  let S3Client, PutObjectCommand;
  // Indirect string + @vite-ignore evita que Vite/Vitest intente resolver
  // estáticamente el dep en tiempo de bundle/test cuando no está instalado.
  // En runtime, si AUDIT_EXPORT_BUCKET está set pero el SDK no está, lanzamos
  // error claro abajo. En dev/CI sin S3, esta función nunca se invoca.
  const moduleName = "@aws-sdk/client-s3";
  try {
    const sdk = await import(/* @vite-ignore */ moduleName);
    S3Client = sdk.S3Client;
    PutObjectCommand = sdk.PutObjectCommand;
  } catch {
    throw new Error(
      "AUDIT_EXPORT_BUCKET configured but @aws-sdk/client-s3 is not installed. " +
      "Run `npm i @aws-sdk/client-s3` to enable S3 export, or unset AUDIT_EXPORT_BUCKET to fall back to filesystem."
    );
  }

  const client = new S3Client({ region });
  const retainUntil = new Date(Date.now() + objectLockDays * 86400_000);

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/x-ndjson",
    ObjectLockMode: "COMPLIANCE",
    ObjectLockRetainUntilDate: retainUntil,
    Metadata: {
      "manifest-sha256": manifest,
      "object-lock-days": String(objectLockDays),
    },
    // Nota: ChecksumAlgorithm: "SHA256" disponible en SDK v3 ≥ 3.388.
    // Si está instalado, AWS valida server-side el SHA256 y rechaza si discrepa.
  }));
}

/**
 * Mock: escribe a `.audit-export/` (filesystem local). Fallback dev/staging
 * sin S3. NO ofrece garantías WORM — solo "ejercita la cadena" para validar
 * que el pipeline llega entero.
 */
async function writeFsStub({ key, ndjson }) {
  const dir = ".audit-export";
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, key.replace(/\//g, "__")), ndjson, "utf8");
}

/**
 * Helper para cron: drena toda la cadena del org en chunks hasta vaciarla.
 * Persiste cursor implícito en `Org.auditLastExportedId` (a agregar en
 * próxima migración cuando el cron esté wired). Por ahora: streaming por
 * páginas hasta que `exported=0`.
 */
export async function exportChainAll(orgId, { pageSize = DEFAULT_PAGE_SIZE, maxPages = 100 } = {}) {
  let sinceId = null;
  let totalExported = 0;
  let manifests = [];
  let lastTarget = "none";
  for (let i = 0; i < maxPages; i++) {
    const r = await exportChain(orgId, { sinceId, pageSize });
    if (r.exported === 0) break;
    totalExported += r.exported;
    manifests.push(r.manifest);
    lastTarget = r.target;
    sinceId = r.lastId;
  }
  return { totalExported, manifests, target: lastTarget, lastId: sinceId };
}
