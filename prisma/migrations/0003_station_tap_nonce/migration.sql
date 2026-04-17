-- ═══════════════════════════════════════════════════════════════
-- BIO-IGNICIÓN — Replay protection para Tap-to-Ignite.
-- Añade columna `nonce` a StationTap y unique(stationId, nonce)
-- para que la misma URL firmada no pueda consumirse dos veces
-- (evita que una foto del QR sirva a múltiples dispositivos).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE "StationTap" ADD COLUMN "nonce" TEXT;
CREATE UNIQUE INDEX "StationTap_stationId_nonce_key"
  ON "StationTap"("stationId", "nonce")
  WHERE "nonce" IS NOT NULL;
