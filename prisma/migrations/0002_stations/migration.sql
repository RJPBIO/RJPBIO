-- ═══════════════════════════════════════════════════════════════
-- BIO-IGNICIÓN — Tap-to-Ignite (estaciones físicas QR/NFC)
-- Genera el SQL real con: npx prisma migrate dev --name stations
-- Este archivo es placeholder para que despliegues frescos no fallen.
-- ═══════════════════════════════════════════════════════════════

CREATE TYPE "StationSlot"   AS ENUM ('MORNING', 'EVENING', 'ADHOC');
CREATE TYPE "StationPolicy" AS ENUM ('ANY', 'ENTRY_EXIT', 'MORNING_ONLY', 'EVENING_ONLY');

CREATE TABLE "Station" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "orgId"      TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "location"   TEXT,
  "policy"     "StationPolicy" NOT NULL DEFAULT 'ENTRY_EXIT',
  "signingKey" TEXT NOT NULL,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "lastTapAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Station_orgId_active_idx" ON "Station"("orgId", "active");

CREATE TABLE "StationTap" (
  "id"        BIGSERIAL PRIMARY KEY,
  "orgId"     TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "userId"    TEXT,
  "anonId"    TEXT,
  "slot"      "StationSlot" NOT NULL,
  "status"    TEXT NOT NULL,
  "ip"        TEXT,
  "ua"        TEXT,
  "ts"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StationTap_stationId_fk" FOREIGN KEY ("stationId")
    REFERENCES "Station"("id") ON DELETE CASCADE
);
CREATE INDEX "StationTap_orgId_ts_idx"              ON "StationTap"("orgId", "ts");
CREATE INDEX "StationTap_stationId_ts_idx"          ON "StationTap"("stationId", "ts");
CREATE INDEX "StationTap_orgId_userId_slot_ts_idx"  ON "StationTap"("orgId", "userId", "slot", "ts");

ALTER TABLE "NeuralSession"
  ADD COLUMN "stationId" TEXT,
  ADD COLUMN "slot"      "StationSlot";

CREATE INDEX "NeuralSession_orgId_stationId_completedAt_idx"
  ON "NeuralSession"("orgId", "stationId", "completedAt");
CREATE INDEX "NeuralSession_orgId_slot_completedAt_idx"
  ON "NeuralSession"("orgId", "slot", "completedAt");

ALTER TABLE "NeuralSession"
  ADD CONSTRAINT "NeuralSession_stationId_fk"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL;
