-- Sprint 10 polish — Persistencia de "last verified" para evidence pack SOC2.
-- Auditor pregunta: "¿Cuándo verificaron última vez la integridad?"
-- Respuesta: SELECT auditLastVerifiedAt FROM Org WHERE id = ?

ALTER TABLE "Org" ADD COLUMN "auditLastVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Org" ADD COLUMN "auditLastVerifiedStatus" TEXT;  -- "verified" | "tampered" | null
ALTER TABLE "Org" ADD COLUMN "auditLastPrunedAt" TIMESTAMP(3);
