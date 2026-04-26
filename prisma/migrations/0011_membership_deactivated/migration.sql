-- Sprint 12 — SCIM soft-deactivation. Antes el flow era:
-- DELETE membership → user "desactivado" pero pierde audit trail / re-activation.
-- Ahora setMembership.deactivatedAt = now() → user.active=false en SCIM,
-- pero mantenemos role/teamId por si reactivan. Activate borra deactivatedAt.

ALTER TABLE "Membership" ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE INDEX "Membership_deactivatedAt_idx" ON "Membership"("deactivatedAt");
