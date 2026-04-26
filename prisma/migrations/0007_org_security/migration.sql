-- Sprint 7 — Org security policies
-- Three enforcement axes per org:
--   1. requireMfa            — every member needs MFA verified
--   2. sessionMaxAgeMinutes  — JWT TTL override (default 8h global)
--   3. ipAllowlist + ipAllowlistEnabled — CIDR allowlist (IPv4)
--
-- Defaults are open (false / null / [] / false) so existing orgs are
-- not affected at migration time. Owner/admin opt-in via /admin/security.

ALTER TABLE "Org" ADD COLUMN "requireMfa" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Org" ADD COLUMN "sessionMaxAgeMinutes" INTEGER;
ALTER TABLE "Org" ADD COLUMN "ipAllowlist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Org" ADD COLUMN "ipAllowlistEnabled" BOOLEAN NOT NULL DEFAULT false;
