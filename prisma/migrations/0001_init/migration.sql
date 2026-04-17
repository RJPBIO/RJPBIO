-- ═══════════════════════════════════════════════════════════════
-- BIO-IGNICIÓN — initial migration (aligns with prisma/schema.prisma)
-- Generate actual SQL with: npx prisma migrate dev --name init
-- This file is a placeholder so fresh deploys don't fail.
-- ═══════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'ENTERPRISE');
CREATE TYPE "Region" AS ENUM ('US', 'EU', 'APAC', 'LATAM');

-- Org
CREATE TABLE "Org" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "plan" "Plan" NOT NULL DEFAULT 'FREE',
  "region" "Region" NOT NULL DEFAULT 'US',
  "seats" INTEGER NOT NULL DEFAULT 5,
  "stripeCustomerId" TEXT,
  "brandingJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "name" TEXT,
  "image" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'es',
  "mfaSecret" TEXT,
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "backupCodes" TEXT[],
  "passkeyCredentials" JSONB,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Membership
CREATE TABLE "Membership" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "role" "Role" NOT NULL DEFAULT 'MEMBER',
  "teamId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "orgId")
);

-- Team
CREATE TABLE "Team" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invitation
CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'MEMBER',
  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AuditLog (append-only, hash chain)
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "meta" JSONB,
  "prevHash" TEXT,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");

-- NeuralSession
CREATE TABLE "NeuralSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "teamId" TEXT,
  "protocol" TEXT NOT NULL,
  "durationSec" INTEGER NOT NULL,
  "metricsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "NeuralSession_orgId_createdAt_idx" ON "NeuralSession"("orgId", "createdAt");

-- Webhook
CREATE TABLE "Webhook" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events" TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WebhookDelivery
CREATE TABLE "WebhookDelivery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "webhookId" TEXT NOT NULL REFERENCES "Webhook"("id") ON DELETE CASCADE,
  "event" TEXT NOT NULL,
  "status" INTEGER,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ApiKey
CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "hash" TEXT NOT NULL UNIQUE,
  "scopes" TEXT[],
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Integration
CREATE TABLE "Integration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orgId" TEXT NOT NULL REFERENCES "Org"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "configJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Auth.js tables (Account, Session, VerificationToken)
CREATE TABLE "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER,
  "token_type" TEXT, "scope" TEXT, "id_token" TEXT, "session_state" TEXT,
  UNIQUE ("provider", "providerAccountId")
);
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL,
  UNIQUE ("identifier", "token")
);

-- ─── Row-Level Security (SEV-2 #19) ─────────────────────────
ALTER TABLE "NeuralSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Webhook"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation"    ENABLE ROW LEVEL SECURITY;

-- current_setting('app.current_org', true) is set by the app on every connection checkout
CREATE POLICY tenant_isolation_ns   ON "NeuralSession" USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_mb   ON "Membership"    USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_al   ON "AuditLog"      USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_wh   ON "Webhook"       USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_ak   ON "ApiKey"        USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_it   ON "Integration"   USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_tm   ON "Team"          USING ("orgId" = current_setting('app.current_org', true));
CREATE POLICY tenant_isolation_in   ON "Invitation"    USING ("orgId" = current_setting('app.current_org', true));
