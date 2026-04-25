-- PWA Sync — Sprint 1
-- Conecta el PWA local-first (IndexedDB) al backend Prisma.
--
-- Cambios:
--   1. Org.personal: boolean. Auto-creado al primer signIn de cada
--      usuario, sirve como tenant default para sesiones individuales
--      antes de que la persona se una a (o cree) un org B2B.
--   2. User.lastSyncedAt: timestamp del último sync exitoso de
--      neuralState desde el PWA. Permite detectar drift y warn al user.
--
-- Roll-forward seguro: ambos defaults son nullable o false, no rompen
-- queries existentes ni la schema multi-tenant.

ALTER TABLE "Org"
  ADD COLUMN "personal" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Org_personal_idx" ON "Org"("personal");

ALTER TABLE "User"
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
