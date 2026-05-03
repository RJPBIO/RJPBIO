-- Sprint S1 — compliance hard fixes
-- 1. User.deletedAt index (Art 17 hot path)
-- 2. WearableEvent.userId promoted to FK with onDelete: Cascade (Art 17 cascade)
-- 3. WearableEvent (orgId, provider, receivedAt) index (admin reportes B2B)
-- 4. StripeEvent table (idempotency fingerprinting)

-- ─── User.deletedAt index ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- ─── WearableEvent.userId FK + cascade ────────────────────────
-- Postgres requiere drop+add cuando se cambia onDelete behavior y antes
-- no había FK declarada (userId era columna sin relation).
-- Idempotente: solo añade si no existe constraint con el nombre target.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'WearableEvent_userId_fkey'
  ) THEN
    ALTER TABLE "WearableEvent"
      ADD CONSTRAINT "WearableEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- WearableEvent (orgId, provider, receivedAt) compound index para admin reports.
CREATE INDEX IF NOT EXISTS "WearableEvent_orgId_provider_receivedAt_idx"
  ON "WearableEvent"("orgId", "provider", "receivedAt");

-- ─── StripeEvent table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "StripeEvent" (
  "id"          TEXT          PRIMARY KEY,
  "type"        TEXT          NOT NULL,
  "orgId"       TEXT,
  "processedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload"     JSONB
);

CREATE INDEX IF NOT EXISTS "StripeEvent_processedAt_idx"
  ON "StripeEvent"("processedAt");
CREATE INDEX IF NOT EXISTS "StripeEvent_orgId_processedAt_idx"
  ON "StripeEvent"("orgId", "processedAt");
