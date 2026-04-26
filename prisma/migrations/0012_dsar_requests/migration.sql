-- Sprint 13 — DSAR (Data Subject Access Requests) GDPR Art. 15/17/20.
-- Auto-resolve para ACCESS/PORTABILITY (artifactUrl al export existente).
-- ERASURE requiere admin approval con 30-day grace period.

CREATE TYPE "DsarKind" AS ENUM ('ACCESS', 'PORTABILITY', 'ERASURE');
CREATE TYPE "DsarStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED');

CREATE TABLE "DsarRequest" (
  "id"            TEXT          PRIMARY KEY,
  "userId"        TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"         TEXT          REFERENCES "Org"("id") ON DELETE SET NULL,
  "kind"          "DsarKind"    NOT NULL,
  "status"        "DsarStatus"  NOT NULL DEFAULT 'PENDING',
  "reason"        TEXT,
  "resolverId"    TEXT          REFERENCES "User"("id") ON DELETE SET NULL,
  "resolverNotes" TEXT,
  "artifactUrl"   TEXT,
  "ip"            TEXT,
  "userAgent"     TEXT,
  "requestedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"    TIMESTAMP(3),
  "expiresAt"     TIMESTAMP(3)  NOT NULL,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DsarRequest_userId_idx" ON "DsarRequest"("userId");
CREATE INDEX "DsarRequest_orgId_status_idx" ON "DsarRequest"("orgId", "status");
CREATE INDEX "DsarRequest_status_expiresAt_idx" ON "DsarRequest"("status", "expiresAt");
