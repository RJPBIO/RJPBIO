-- ═══════════════════════════════════════════════════════════════
-- RLS — rollback. Deshabilita RLS y borra las políticas rls_tenant.
-- Úsalo si la app deja de leer datos tras habilitar (contexto no
-- cableado en algún query). Restaura el comportamiento previo (defensa
-- solo a nivel app vía requireMembership).
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Membership','Nom35Response','AuditLog','ApiKey','Webhook','Integration',
    'NeuralSession','HrvMeasurement','Instrument','BurnoutScore','ProgramAssignment'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS rls_tenant ON %I;', t);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;
