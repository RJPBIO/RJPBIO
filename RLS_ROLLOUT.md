# RLS rollout — cómo habilitar Row-Level Security con seguridad

Estado: **foundation construida** (políticas, verificación, rollback). Habilitar en la app es un proceso **gated por tu DB** porque el aislamiento no se puede verificar in-memory y encender RLS mal **rompe la app**. Sigue este orden.

## ⚠️ El punto crítico de Supabase (léelo primero)

RLS **solo protege si el rol de conexión está sujeto a las políticas.** Supabase por defecto conecta la app como `postgres` (owner de las tablas), y **un owner IGNORA RLS** a menos que se use `FORCE ROW LEVEL SECURITY`. Por eso `enable-rls.sql` usa **FORCE**.

Consecuencia: con FORCE, **hasta la app (como owner) queda sujeta a las políticas** → si un query no setea el contexto de tenant, **devuelve 0 filas** (fail-closed) y esa función se rompe. Dos caminos:

- **(Recomendado) Rol dedicado:** crear un rol `app_rls` sin BYPASSRLS con privilegios `SELECT/INSERT/UPDATE/DELETE`, y que la app use SU connection string. Los crons/migraciones siguen con el rol owner (bypass natural). Más limpio, menos FORCE-sorpresas.
- **(Simple) Solo FORCE:** todo (app + crons) sujeto; los crons DEBEN setear contexto o usar un rol aparte.

## Orden de rollout

1. **Verificar el mecanismo** (5 min): `npm run verify:staging` → debe decir "STAGING LISTO" (confirma que `set_config` local funciona en tu pooler).
2. **Aplicar políticas:** correr `prisma/rls/enable-rls.sql` contra la DB (Supabase SQL editor o `psql < prisma/rls/enable-rls.sql`).
3. **Verificar aislamiento:** `npm run verify:rls` → debe decir "RLS AÍSLA CORRECTAMENTE". Si en el paso [2] ves filas ajenas → estás conectando como owner sin FORCE efectivo (revisa el rol).
4. **Cablear `withTenant` en TODOS los queries tenant-scoped** (checklist abajo). Sin esto la app se rompe. `withTenant` ya existe en `src/server/db.js`.
5. **Smoke test de la app** contra la DB con RLS activo (login, ver sesiones, reporte admin).
6. Si algo falla: `prisma/rls/rollback-rls.sql` revierte al instante (defensa vuelve a solo app-layer).

## Checklist de cableado `withTenant` (paso 4)

Cada acceso a una tabla con RLS debe correr dentro de `withTenant(ctx, orm => …)`. Sitios (del inventario del código):

- [ ] `src/server/executiveReport.js` — **two-phase**: set `org_ids`, query `membership` para obtener userIds, set `member_ids`, luego las queries de salud. (withTenant acepta `memberIds` en ctx cuando ya los conoces.)
- [ ] `src/server/snapshot.js` — `buildUserSnapshot` / `Lite`: ctx = `{ userId }` (self) o `{ memberIds }` (admin).
- [ ] `src/app/api/v1/nom35/responses/route.js` — GET/POST: ctx = `{ userId, orgIds:[orgId] }`.
- [ ] `src/app/api/v1/nom35/aggregate/route.js` + `compare` — ctx = `{ orgIds:[orgId] }`.
- [ ] `src/app/(admin)/admin/nom35/*` — ctx = `{ orgIds:[orgId] }`.
- [ ] `src/app/api/v1/orgs/[orgId]/burnout/aggregate` + `admin/wellbeing/aggregate` — ctx = `{ memberIds }`.
- [ ] `src/app/api/sync/outbox/route.js` — writes: ctx = `{ userId }`.
- [ ] `src/server/cron/*` (burnout-scan, nom35-reapply, executive digests) — correr con rol owner (bypass) o setear contexto por-user.
- [ ] Resto de endpoints que tocan Membership/AuditLog/ApiKey/Webhook/Integration — ctx = `{ orgIds }`.

> Regla: enciende RLS **tabla por tabla**. Habilita una tabla, cablea sus queries, corre `verify:rls` + smoke test, y solo entonces la siguiente. `enable-rls.sql` las hace todas — puedes comentar tablas para ir por partes.

## Notas
- Las tablas de identidad (User, Account, Session) y globales (Incident, StripeEvent) **no** llevan RLS.
- `withTenant` en el adaptador de memoria (tests) es passthrough → la suite sigue verde; el aislamiento real solo se prueba con `verify:rls` contra Postgres.
- Ver también `STAGING_SETUP.md`.
