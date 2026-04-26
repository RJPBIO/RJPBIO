-- Sprint 14 — Custom domain DNS verification (TXT challenge).
-- Org.branding ya guarda customDomain string; estos campos rastrean
-- el flow de verificación: token generado, último check, status final.

ALTER TABLE "Org" ADD COLUMN "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Org" ADD COLUMN "customDomainVerifyToken" TEXT;
ALTER TABLE "Org" ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Org" ADD COLUMN "customDomainLastCheckedAt" TIMESTAMP(3);

CREATE INDEX "Org_customDomainVerified_idx" ON "Org"("customDomainVerified");
