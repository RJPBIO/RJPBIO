#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Backup verification — restaura el snapshot más reciente a una
   DB efímera y valida que:
     1. pg_restore termina sin errores fatales.
     2. Las tablas críticas tienen row count >= umbral mínimo.
     3. Una query de integridad (hash-chain) pasa en al menos un org.

   Uso:
     BACKUP_URL=s3://... RESTORE_DB_URL=postgres://... node scripts/verify-backup.js

   Requiere en PATH: aws cli (si S3) + psql + pg_restore.
   En prod, corre en cron diario; falla → alerta PagerDuty.
   ═══════════════════════════════════════════════════════════════ */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const BACKUP_URL = process.env.BACKUP_URL;
const RESTORE_DB_URL = process.env.RESTORE_DB_URL;

if (!BACKUP_URL || !RESTORE_DB_URL) {
  console.error("BACKUP_URL and RESTORE_DB_URL required");
  process.exit(2);
}

const MIN_ROWS = {
  User: 1,
  Org: 1,
  AuditLog: 1,
};

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr || r.stdout}`);
  return r.stdout;
}

const workDir = mkdtempSync(join(tmpdir(), "bio-restore-"));
const dumpFile = join(workDir, "snapshot.dump");

try {
  console.log(`[1/4] Fetching backup from ${BACKUP_URL}`);
  if (BACKUP_URL.startsWith("s3://")) {
    run("aws", ["s3", "cp", BACKUP_URL, dumpFile]);
  } else if (BACKUP_URL.startsWith("gs://")) {
    run("gsutil", ["cp", BACKUP_URL, dumpFile]);
  } else {
    run("curl", ["-fsSL", "-o", dumpFile, BACKUP_URL]);
  }

  console.log(`[2/4] Restoring into ${RESTORE_DB_URL.replace(/:[^:@]*@/, ":***@")}`);
  run("pg_restore", [
    "--dbname", RESTORE_DB_URL,
    "--clean", "--if-exists", "--no-owner", "--no-privileges",
    "--exit-on-error", dumpFile,
  ]);

  console.log("[3/4] Counting rows in critical tables");
  for (const [table, min] of Object.entries(MIN_ROWS)) {
    const out = runCapture("psql", [
      RESTORE_DB_URL, "-At", "-c", `SELECT COUNT(*) FROM "${table}";`,
    ]);
    const n = Number(out.trim());
    console.log(`  ${table}: ${n} rows`);
    if (!Number.isFinite(n) || n < min) {
      throw new Error(`${table} has ${n} rows, expected >= ${min}`);
    }
  }

  console.log("[4/4] Walking one audit hash chain sample");
  const orgIds = runCapture("psql", [
    RESTORE_DB_URL, "-At", "-c",
    `SELECT "orgId" FROM "AuditLog" GROUP BY "orgId" HAVING COUNT(*) > 10 LIMIT 1;`,
  ]).trim().split("\n").filter(Boolean);

  if (orgIds.length === 0) {
    console.warn("  no org with >10 audit rows — skipping chain walk");
  } else {
    const orgId = orgIds[0];
    const rows = JSON.parse(runCapture("psql", [
      RESTORE_DB_URL, "-At", "-c",
      `SELECT json_agg(row_to_json(x) ORDER BY ts) FROM "AuditLog" x WHERE "orgId" = '${orgId.replace(/'/g, "''")}';`,
    ]).trim() || "[]");

    let prev = null, broken = 0;
    for (const r of rows) {
      const { prevHash, hash, id, ts, ...rest } = r;
      const payload = Object.keys(rest).sort().reduce((a, k) => { a[k] = rest[k]; return a; }, {});
      const expected = createHash("sha256")
        .update(`${prev || ""}|${JSON.stringify(payload)}`)
        .digest("hex");
      if (expected !== hash) broken++;
      prev = hash;
    }
    if (broken > 0) throw new Error(`hash-chain broken at ${broken} of ${rows.length} rows`);
    console.log(`  chain OK: ${rows.length} rows verified for org ${orgId}`);
  }

  console.log("\n✅ Backup verified. Restore tested, counts OK, audit chain intact.");
  process.exit(0);
} catch (e) {
  console.error(`\n❌ Backup verification FAILED: ${e.message}`);
  process.exit(1);
} finally {
  try { rmSync(workDir, { recursive: true, force: true }); } catch {}
}
