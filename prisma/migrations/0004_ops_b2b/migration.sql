-- 0004_ops_b2b — dunning, support tickets, impersonation audit, wearables ingress.

-- Org: billing lifecycle state
ALTER TABLE "Org"
  ADD COLUMN IF NOT EXISTS "dunningState" TEXT,
  ADD COLUMN IF NOT EXISTS "graceUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Org_dunningState_idx" ON "Org" ("dunningState");

-- User: passkey creds + soft-delete (drift-repair: also in 0001 migration)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passkeyCredentials" JSONB,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- SupportTicket
DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN','PENDING','RESOLVED','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW','NORMAL','HIGH','URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"        TEXT PRIMARY KEY,
  "orgId"     TEXT,
  "userId"    TEXT,
  "email"     TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "status"    "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority"  "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "tags"      TEXT[] NOT NULL DEFAULT '{}',
  "ua"        TEXT,
  "ip"        TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "SupportTicket_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL,
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "SupportTicket_orgId_status_createdAt_idx" ON "SupportTicket" ("orgId","status","createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_priority_createdAt_idx" ON "SupportTicket" ("status","priority","createdAt");

-- Impersonation audit
CREATE TABLE IF NOT EXISTS "Impersonation" (
  "id"        TEXT PRIMARY KEY,
  "orgId"     TEXT NOT NULL,
  "actorId"   TEXT NOT NULL,
  "targetId"  TEXT NOT NULL,
  "reason"    TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "endedAt"   TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ip"        TEXT,
  "ua"        TEXT,
  CONSTRAINT "Impersonation_orgId_fkey"    FOREIGN KEY ("orgId")    REFERENCES "Org"("id")  ON DELETE CASCADE,
  CONSTRAINT "Impersonation_actorId_fkey"  FOREIGN KEY ("actorId")  REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Impersonation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Impersonation_orgId_startedAt_idx"    ON "Impersonation" ("orgId","startedAt");
CREATE INDEX IF NOT EXISTS "Impersonation_actorId_startedAt_idx"  ON "Impersonation" ("actorId","startedAt");
CREATE INDEX IF NOT EXISTS "Impersonation_targetId_startedAt_idx" ON "Impersonation" ("targetId","startedAt");

-- WearableEvent
CREATE TABLE IF NOT EXISTS "WearableEvent" (
  "id"         TEXT PRIMARY KEY,
  "orgId"      TEXT,
  "userId"     TEXT,
  "provider"   TEXT NOT NULL,
  "kind"       TEXT NOT NULL,
  "payload"    JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "WearableEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "WearableEvent_provider_receivedAt_idx"        ON "WearableEvent" ("provider","receivedAt");
CREATE INDEX IF NOT EXISTS "WearableEvent_userId_provider_receivedAt_idx" ON "WearableEvent" ("userId","provider","receivedAt");
