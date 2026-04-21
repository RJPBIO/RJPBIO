-- MFA hardening: adds verified-at, backup codes, lockout tracking,
-- trusted-device cookie store, and self-serve reset-request ticket.
-- All additions are nullable / default so this is a safe roll-forward.

ALTER TABLE "User"
  ADD COLUMN "mfaVerifiedAt"   TIMESTAMP(3),
  ADD COLUMN "mfaBackupCodes"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "mfaFailCount"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "mfaLockedUntil"  TIMESTAMP(3);

CREATE TABLE "TrustedDevice" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "tokenHash"  TEXT NOT NULL,
  "label"      TEXT,
  "ip"         TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TrustedDevice_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");
CREATE INDEX "TrustedDevice_userId_idx"    ON "TrustedDevice"("userId");
CREATE INDEX "TrustedDevice_expiresAt_idx" ON "TrustedDevice"("expiresAt");

CREATE TABLE "MfaResetRequest" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "reason"     TEXT,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolverId" TEXT,
  CONSTRAINT "MfaResetRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaResetRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MfaResetRequest_status_createdAt_idx" ON "MfaResetRequest"("status", "createdAt");
CREATE INDEX "MfaResetRequest_userId_idx"           ON "MfaResetRequest"("userId");
