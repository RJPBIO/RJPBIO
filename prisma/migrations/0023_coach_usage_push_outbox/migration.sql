-- Sprint S5 — Coach quota tracking + Push delivery server-side outbox

-- ─── CoachUsage ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CoachUsage" (
  "id"         TEXT          PRIMARY KEY,
  "userId"     TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"      TEXT          REFERENCES "Org"("id") ON DELETE SET NULL,
  "year"       INTEGER       NOT NULL,
  "month"      INTEGER       NOT NULL,
  "requests"   INTEGER       NOT NULL DEFAULT 0,
  "tokensIn"   INTEGER       NOT NULL DEFAULT 0,
  "tokensOut"  INTEGER       NOT NULL DEFAULT 0,
  "modelTier"  TEXT,
  "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "CoachUsage_userId_year_month_key"
  ON "CoachUsage"("userId", "year", "month");
CREATE INDEX IF NOT EXISTS "CoachUsage_orgId_year_month_idx"
  ON "CoachUsage"("orgId", "year", "month");
CREATE INDEX IF NOT EXISTS "CoachUsage_year_month_idx"
  ON "CoachUsage"("year", "month");

-- ─── PushOutbox ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PushOutbox" (
  "id"           TEXT          PRIMARY KEY,
  "userId"       TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title"        TEXT          NOT NULL,
  "body"         TEXT,
  "href"         TEXT,
  "kind"         TEXT,
  "status"       TEXT          NOT NULL DEFAULT 'pending',
  "attempts"     INTEGER       NOT NULL DEFAULT 0,
  "nextAttempt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError"    TEXT,
  "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt"       TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "PushOutbox_status_nextAttempt_idx"
  ON "PushOutbox"("status", "nextAttempt");
CREATE INDEX IF NOT EXISTS "PushOutbox_userId_createdAt_idx"
  ON "PushOutbox"("userId", "createdAt" DESC);
