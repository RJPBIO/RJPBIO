-- Sprint 17 — Webhook secret rotation con overlap period (zero-downtime).
-- Durante overlap (default 7d) dispatchWebhooks firma con prev+current
-- (multi-sig en webhook-signature header, Standard Webhooks v1) para
-- que clientes verifiquen contra cualquiera de los dos secrets.

ALTER TABLE "Webhook" ADD COLUMN "prevSecret" TEXT;
ALTER TABLE "Webhook" ADD COLUMN "prevSecretExpiresAt" TIMESTAMP(3);
ALTER TABLE "Webhook" ADD COLUMN "secretRotatedAt" TIMESTAMP(3);

CREATE INDEX "Webhook_prevSecretExpiresAt_idx" ON "Webhook"("prevSecretExpiresAt");
