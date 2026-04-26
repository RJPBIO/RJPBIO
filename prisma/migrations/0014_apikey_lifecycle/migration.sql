-- Sprint 15 — API key lifecycle (expiry + lastUsedIp).
-- Antes: keys vivían forever hasta revoke manual.
-- Ahora: expiresAt opcional para rotación automática + lastUsedIp para forensics.

ALTER TABLE "ApiKey" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN "lastUsedIp" TEXT;

CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");
