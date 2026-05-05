-- Phase 6F SP-E — BurnoutScore table (wellbeing trends).
-- NO es "burnout score" ni diagnóstico médico — indicador retrospectivo
-- computado por assessBurnoutEnhanced. Habilita push throttle (notifiedAt)
-- + B2B aggregate k-anon ≥ 5 + future ML training data flywheel.
-- Aditiva, idempotente. NO breaking.

CREATE TABLE IF NOT EXISTS "BurnoutScore" (
  "id"          TEXT          PRIMARY KEY,
  "userId"      TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"       TEXT          REFERENCES "Org"("id") ON DELETE SET NULL,

  -- Output del assessment.
  "level"       TEXT          NOT NULL,                      -- "ok" | "watch" | "warn" | "alert"
  "signals"     JSONB         NOT NULL DEFAULT '[]'::jsonb,  -- array of signal ids
  "metrics"     JSONB         NOT NULL DEFAULT '{}'::jsonb,  -- thresholds + computed values

  "computedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Push throttle: timestamp del último push enviado para este score.
  -- Cron consulta últimos 7 días para dedup.
  "notifiedAt"  TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "BurnoutScore_userId_computedAt_idx"
  ON "BurnoutScore"("userId", "computedAt" DESC);
CREATE INDEX IF NOT EXISTS "BurnoutScore_orgId_level_computedAt_idx"
  ON "BurnoutScore"("orgId", "level", "computedAt" DESC);
CREATE INDEX IF NOT EXISTS "BurnoutScore_userId_notifiedAt_idx"
  ON "BurnoutScore"("userId", "notifiedAt" DESC);
