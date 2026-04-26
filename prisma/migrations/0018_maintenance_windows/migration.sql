-- Sprint 22 — Maintenance windows (planned downtime, distinto de incidents).
-- Lifecycle scheduled → in_progress → completed | cancelled (terminales).
-- Notify cadence proactiva: T-24h, T-0 (start), T+done (cron sweeps).

CREATE TYPE "MaintenanceStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE "MaintenanceWindow" (
  "id"                TEXT                PRIMARY KEY,
  "title"             TEXT                NOT NULL,
  "body"              TEXT,
  "status"            "MaintenanceStatus" NOT NULL DEFAULT 'scheduled',
  "components"        TEXT[]              NOT NULL DEFAULT ARRAY[]::TEXT[],
  "scheduledStart"    TIMESTAMP(3)        NOT NULL,
  "scheduledEnd"      TIMESTAMP(3)        NOT NULL,
  "actualStart"       TIMESTAMP(3),
  "actualEnd"         TIMESTAMP(3),
  -- Anti-duplicate notify (cron sweep verifica estos antes de enviar)
  "notifiedT24"       BOOLEAN             NOT NULL DEFAULT false,
  "notifiedT0"        BOOLEAN             NOT NULL DEFAULT false,
  "notifiedComplete"  BOOLEAN             NOT NULL DEFAULT false,
  "creatorId"         TEXT,
  "createdAt"         TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MaintenanceWindow_status_scheduledStart_idx" ON "MaintenanceWindow"("status", "scheduledStart");
CREATE INDEX "MaintenanceWindow_scheduledEnd_idx" ON "MaintenanceWindow"("scheduledEnd");
