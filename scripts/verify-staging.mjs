#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   verify-staging — valida que el staging Postgres soporta el
   mecanismo que RLS necesita, ANTES de escribir políticas.
   ───────────────────────────────────────────────────────────────
   Verifica, contra la DB real (lo que NO se puede probar in-memory):
     1. Conexión OK.
     2. set_config('app.*', v, is_local=true) + current_setting se
        leen DENTRO de una transacción (el motor de withTenant).
     3. El setting es TRANSACTION-LOCAL: fuera de la tx ya no existe
        → confirma que funciona a través del pooler en modo transacción
        sin filtrar contexto entre requests.
     4. Reporta qué env de crypto/firma están configuradas.

   Uso:
     DATABASE_URL=... DIRECT_URL=... node scripts/verify-staging.mjs
   (o `npm run verify:staging` tras poblar .env.local)
   ═══════════════════════════════════════════════════════════════ */

import { PrismaClient } from "@prisma/client";

function ok(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); }

let url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL no está set. Pobla .env.local con el pooled URL (puerto 6543) de Supabase.");
  process.exit(1);
}
// Mismos flags que src/server/db.js para el pooler en modo transacción.
if (!/[?&]pgbouncer=/.test(url)) {
  url += (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";
}

const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });

let failures = 0;

try {
  console.log("\n[1] Conexión");
  await prisma.$queryRaw`SELECT 1`;
  ok("conectó a Postgres");

  console.log("\n[2] set_config dentro de transacción (motor de withTenant)");
  const inside = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${"u_test"}, true)`;
    await tx.$executeRaw`SELECT set_config('app.org_ids', ${"o_1,o_2"}, true)`;
    const rows = await tx.$queryRaw`SELECT current_setting('app.user_id', true) AS uid, current_setting('app.org_ids', true) AS orgs`;
    return rows[0];
  });
  if (inside?.uid === "u_test" && inside?.orgs === "o_1,o_2") {
    ok(`leyó el contexto dentro de la tx (app.user_id=${inside.uid}, app.org_ids=${inside.orgs})`);
  } else {
    fail(`contexto no coincide dentro de la tx: ${JSON.stringify(inside)}`);
    failures++;
  }

  console.log("\n[3] El contexto es transaction-local (no filtra entre requests)");
  const afterRows = await prisma.$queryRaw`SELECT current_setting('app.user_id', true) AS uid`;
  const after = afterRows?.[0]?.uid;
  if (!after) {
    ok("fuera de la tx el contexto ya no existe (is_local=true correcto)");
  } else {
    fail(`el contexto persistió fuera de la tx: '${after}' — RLS filtraría entre requests. Revisa el pooler.`);
    failures++;
  }

  console.log("\n[4] Env de crypto / firma");
  const dataKey = process.env.DATA_KEY?.trim();
  if (dataKey && dataKey.length === 64) ok("DATA_KEY configurada (32 bytes hex) — cifrado en reposo activo");
  else fail("DATA_KEY ausente o no es 32 bytes hex → kms.js usa dev-key cero (NO usar en staging real)"), failures++;

  const sign = process.env.ARTIFACT_SIGNING_PRIVATE_KEY?.trim();
  if (sign) ok("ARTIFACT_SIGNING_PRIVATE_KEY configurada — firma Ed25519 activa");
  else console.log("  – ARTIFACT_SIGNING_PRIVATE_KEY ausente → artifacts sin firma (ok para arrancar)");

  console.log(`\n${failures === 0 ? "✓ STAGING LISTO para Fase 2 (RLS + cifrado de numéricos)." : `✗ ${failures} verificación(es) fallaron — resolver antes de RLS.`}\n`);
} catch (e) {
  fail(`error: ${e?.message || e}`);
  failures++;
} finally {
  await prisma.$disconnect();
}

process.exit(failures === 0 ? 0 : 1);
