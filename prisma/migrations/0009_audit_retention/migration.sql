-- Sprint 10 — Audit retention policy per-org
--
-- Default 365 días (1 año) — alineado con la mayoría de prácticas SOC2.
-- Range: 30 (recovery window mínimo) a 2555 (~7 años, SEC retention).
-- Sweeper en src/server/audit.js corre por org y borra logs con ts < cutoff.
-- Borrar audit logs ROMPE el hash chain del segmento eliminado, pero no
-- afecta la verificación del segmento restante (chain advances naturally).

ALTER TABLE "Org" ADD COLUMN "auditRetentionDays" INTEGER NOT NULL DEFAULT 365;
