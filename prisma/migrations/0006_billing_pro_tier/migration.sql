-- Sprint 2 — Billing PRO tier
-- Añade el tier B2C "PRO" entre FREE y STARTER. Habilita revenue
-- individual ($9.99/mes, 1 seat, personal-org). Sin cambios en
-- tablas existentes — solo extiende el enum Plan.
--
-- ALTER TYPE ... ADD VALUE no puede correr dentro de transacción
-- en Postgres < 12. Asumimos Postgres ≥ 12 (Neon, Supabase, Vercel
-- Postgres todos lo soportan). Si falla, ejecutar manualmente:
--   BEGIN; COMMIT; (forzar fin de tx)
--   ALTER TYPE "Plan" ADD VALUE 'PRO' BEFORE 'STARTER';

ALTER TYPE "Plan" ADD VALUE 'PRO' BEFORE 'STARTER';
