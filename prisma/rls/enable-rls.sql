-- ═══════════════════════════════════════════════════════════════
-- RLS — habilita Row-Level Security + políticas (two-org aware).
-- ───────────────────────────────────────────────────────────────
-- NO es una migración Prisma auto-aplicable a propósito: habilitar RLS
-- ROMPE la app si algún query no setea el contexto de tenant. Se aplica
-- MANUALMENTE tras (1) crear el rol dedicado, (2) cablear withTenant en
-- los queries, (3) verificar con scripts/rls/verify-cross-tenant.mjs.
-- Ver RLS_ROLLOUT.md.
--
-- Contexto por request (GUCs, seteados por withTenant dentro de la tx):
--   app.user_id    — el usuario autenticado
--   app.org_ids    — orgs del usuario (csv) — para tablas con orgId B2B
--   app.member_ids — userIds que el requester puede leer (csv) — para
--                    tablas personal-scoped agregadas por un admin B2B
--
-- current_setting(..., true) = missing_ok → NULL si no está seteado →
-- nullif('')→NULL → string_to_array(NULL)→NULL → ANY(NULL)=false =
-- FAIL-CLOSED (sin contexto, no se ve nada).
-- ═══════════════════════════════════════════════════════════════

-- Helpers inline (se repiten por claridad; Postgres los inlinea):
--   ORGIDS   := string_to_array(nullif(current_setting('app.org_ids',   true), ''), ',')
--   MEMBERS  := string_to_array(nullif(current_setting('app.member_ids', true), ''), ',')
--   UID      := nullif(current_setting('app.user_id', true), '')

-- ── Tablas orgId-scoped (B2B) ──────────────────────────────────
-- Membership: el usuario ve sus propias membresías + las de sus orgs.
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_tenant ON "Membership";
CREATE POLICY rls_tenant ON "Membership" USING (
  "orgId" = ANY(string_to_array(nullif(current_setting('app.org_ids', true), ''), ','))
  OR "userId" = nullif(current_setting('app.user_id', true), '')
) WITH CHECK (
  "orgId" = ANY(string_to_array(nullif(current_setting('app.org_ids', true), ''), ','))
);

-- Nom35Response: guardado en orgId B2B (route usa la org no-personal) +
-- el propio usuario puede leer las suyas.
ALTER TABLE "Nom35Response" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Nom35Response" FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rls_tenant ON "Nom35Response";
CREATE POLICY rls_tenant ON "Nom35Response" USING (
  "orgId" = ANY(string_to_array(nullif(current_setting('app.org_ids', true), ''), ','))
  OR "userId" = nullif(current_setting('app.user_id', true), '')
) WITH CHECK (
  "userId" = nullif(current_setting('app.user_id', true), '')
);

-- AuditLog / ApiKey / Webhook / Integration: orgId-scoped puro.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['AuditLog','ApiKey','Webhook','Integration'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS rls_tenant ON %I;', t);
    EXECUTE format($f$CREATE POLICY rls_tenant ON %I USING (
      "orgId" = ANY(string_to_array(nullif(current_setting('app.org_ids', true), ''), ','))
    ) WITH CHECK (
      "orgId" = ANY(string_to_array(nullif(current_setting('app.org_ids', true), ''), ','))
    );$f$, t);
  END LOOP;
END $$;

-- ── Tablas personal-scoped (por userId) ────────────────────────
-- NeuralSession, HrvMeasurement, Instrument, BurnoutScore, ProgramAssignment:
-- orgId = personal-org del user (Sprint 62). Acceso: el propio usuario, o
-- un admin B2B cuyo app.member_ids incluye ese userId.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['NeuralSession','HrvMeasurement','Instrument','BurnoutScore','ProgramAssignment'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE  ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS rls_tenant ON %I;', t);
    EXECUTE format($f$CREATE POLICY rls_tenant ON %I USING (
      "userId" = nullif(current_setting('app.user_id', true), '')
      OR "userId" = ANY(string_to_array(nullif(current_setting('app.member_ids', true), ''), ','))
    ) WITH CHECK (
      "userId" = nullif(current_setting('app.user_id', true), '')
    );$f$, t);
  END LOOP;
END $$;

-- NOTA: User, Account, Session (identidad) y tablas de plataforma
-- (Incident, MaintenanceWindow, StripeEvent) NO llevan RLS: no son
-- tenant-scoped o son globales. Revisar caso por caso antes de ampliar.
