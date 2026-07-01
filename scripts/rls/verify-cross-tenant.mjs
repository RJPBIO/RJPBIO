#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   verify-cross-tenant — prueba REAL de aislamiento RLS.
   ───────────────────────────────────────────────────────────────
   Requisitos: haber aplicado prisma/rls/enable-rls.sql y conectar como
   el rol de la app (sujeto a RLS; ver RLS_ROLLOUT.md sobre el rol
   dedicado — si conectas como owner sin FORCE, RLS no aplica y este
   test lo detectará: verás filas ajenas).

   Qué hace (sobre datos de prueba con prefijo rls_test_):
     1. Siembra 2 orgs + 2 users + 1 Nom35Response por org.
     2. Con contexto de org A: cuenta cuántas respuestas ve → debe ver
        SOLO la de A (1), NO la de B.
     3. Sin contexto: debe ver 0 (fail-closed).
     4. Limpia todo.

   Uso:  DATABASE_URL=... node scripts/rls/verify-cross-tenant.mjs
   ═══════════════════════════════════════════════════════════════ */

import { PrismaClient } from "@prisma/client";

const A = { org: "rls_test_org_A", user: "rls_test_uA", resp: "rls_test_n_A" };
const B = { org: "rls_test_org_B", user: "rls_test_uB", resp: "rls_test_n_B" };

let url = process.env.DATABASE_URL?.trim();
if (!url) { console.error("DATABASE_URL no set."); process.exit(1); }
if (!/[?&]pgbouncer=/.test(url)) url += (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";

const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => console.error(`  ✗ ${m}`);
let failures = 0;

async function insertRespFor(who, orgId) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${who.user}, true)`;
    await tx.$executeRaw`SELECT set_config('app.org_ids', ${orgId}, true)`;
    await tx.$executeRawUnsafe(
      `INSERT INTO "Nom35Response"
         (id,"orgId","userId",guia,answers,total,nivel,"porDominio","porCategoria","completedAt")
       VALUES ($1,$2,$3,'III','{}'::jsonb,10,'bajo','{}'::jsonb,'{}'::jsonb, now())`,
      who.resp, orgId, who.user
    );
  });
}

try {
  console.log("\n[seed] orgs + users (sin RLS) + respuestas (con contexto)");
  await prisma.org.create({ data: { id: A.org, name: "RLS Test A", slug: A.org } });
  await prisma.org.create({ data: { id: B.org, name: "RLS Test B", slug: B.org } });
  await prisma.user.create({ data: { id: A.user, email: `${A.user}@rls.test` } });
  await prisma.user.create({ data: { id: B.user, email: `${B.user}@rls.test` } });
  await insertRespFor(A, A.org);
  await insertRespFor(B, B.org);
  ok("sembrado");

  console.log("\n[1] Contexto = admin de org A → solo ve datos de A");
  const seen = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.org_ids', ${A.org}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${A.user}, true)`;
    return tx.$queryRawUnsafe(`SELECT "orgId" FROM "Nom35Response" WHERE id LIKE 'rls_test_%'`);
  });
  const orgs = seen.map((r) => r.orgId);
  if (orgs.includes(A.org) && !orgs.includes(B.org)) ok(`ve solo A (${orgs.length} fila/s, ninguna de B)`);
  else { bad(`FUGA cross-tenant o RLS inactivo — orgIds vistos: ${JSON.stringify(orgs)}`); failures++; }

  console.log("\n[2] Sin contexto → 0 filas (fail-closed)");
  const none = await prisma.$transaction(async (tx) =>
    tx.$queryRawUnsafe(`SELECT count(*)::int AS c FROM "Nom35Response" WHERE id LIKE 'rls_test_%'`)
  );
  if (Number(none[0].c) === 0) ok("sin contexto no ve nada");
  else { bad(`sin contexto vio ${none[0].c} filas — RLS no está forzando (¿conectas como owner sin FORCE?)`); failures++; }

  console.log(`\n${failures === 0 ? "✓ RLS AÍSLA CORRECTAMENTE entre tenants." : `✗ ${failures} fallo(s) — NO habilitar en prod hasta resolver.`}`);
} catch (e) {
  bad(`error: ${e?.message || e}`);
  failures++;
} finally {
  console.log("\n[cleanup] borrando datos de prueba");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.org_ids', ${`${A.org},${B.org}`}, true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', ${A.user}, true)`;
      await tx.$executeRaw`SELECT set_config('app.member_ids', ${`${A.user},${B.user}`}, true)`;
      await tx.$executeRawUnsafe(`DELETE FROM "Nom35Response" WHERE id LIKE 'rls_test_%'`);
    });
    await prisma.user.deleteMany({ where: { id: { in: [A.user, B.user] } } });
    await prisma.org.deleteMany({ where: { id: { in: [A.org, B.org] } } });
    console.log("  ✓ limpio");
  } catch (e) { console.error(`  · cleanup parcial: ${e?.message || e} (borra manualmente ids rls_test_*)`); }
  await prisma.$disconnect();
}

process.exit(failures === 0 ? 0 : 1);
