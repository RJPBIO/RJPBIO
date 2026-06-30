-- BioSignal Index (B2B) — campos de cohorte en Org para benchmark anónimo
-- por industria / tamaño / turno. Opt-in del admin (nullable).
-- Aditiva, idempotente, NO breaking: columnas nullable sin default.

ALTER TABLE "Org" ADD COLUMN IF NOT EXISTS "industry"    TEXT;
ALTER TABLE "Org" ADD COLUMN IF NOT EXISTS "companySize" TEXT;
ALTER TABLE "Org" ADD COLUMN IF NOT EXISTS "shift"       TEXT;

-- Índice para agrupar por cohorte en el cálculo del benchmark (cross-org).
CREATE INDEX IF NOT EXISTS "Org_industry_idx" ON "Org" ("industry");
