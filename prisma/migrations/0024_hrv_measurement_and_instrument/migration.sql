-- Phase 6B SP3 — HRV first-party + instrumentos psicométricos repeatable
-- Aditiva, idempotente. NO breaking. Promueve outbox kind:"hrv" y
-- kind:"instrument" desde User.neuralState JSON a tablas dedicadas con
-- índices para analytics y compliance audit.

-- ─── HrvMeasurement ──────────────────────────────────────────────
-- Mediciones HRV originadas en el PWA mismo (cámara vía PPG ROI o BLE
-- strap directo). Distinta de WearableEvent (3rd-party Whoop/Oura).
CREATE TABLE IF NOT EXISTS "HrvMeasurement" (
  "id"           TEXT              PRIMARY KEY,
  "userId"       TEXT              NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"        TEXT              REFERENCES "Org"("id") ON DELETE SET NULL,
  -- Core HRV time-domain metrics (Task Force 1996 / Shaffer 2017).
  "rmssd"        DOUBLE PRECISION  NOT NULL,
  "lnRmssd"      DOUBLE PRECISION  NOT NULL,
  "sdnn"         DOUBLE PRECISION,
  "pnn50"        DOUBLE PRECISION,
  "meanHr"       DOUBLE PRECISION  NOT NULL,
  "rhr"          DOUBLE PRECISION,
  -- Measurement metadata + signal quality.
  "durationSec"  INTEGER           NOT NULL,
  "n"            INTEGER           NOT NULL,
  "source"       TEXT              NOT NULL,                                  -- "camera" | "ble"
  "sqi"          INTEGER,                                                     -- 0-100 (camera only)
  "sqiBand"      TEXT,                                                        -- "excellent" | "good" | "marginal" | "poor"
  "measuredAt"   TIMESTAMP(3)      NOT NULL,
  "createdAt"    TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "HrvMeasurement_userId_measuredAt_idx"
  ON "HrvMeasurement"("userId", "measuredAt" DESC);
CREATE INDEX IF NOT EXISTS "HrvMeasurement_orgId_measuredAt_idx"
  ON "HrvMeasurement"("orgId", "measuredAt" DESC);
CREATE INDEX IF NOT EXISTS "HrvMeasurement_source_idx"
  ON "HrvMeasurement"("source");

-- ─── Instrument ──────────────────────────────────────────────────
-- Instrumentos psicométricos validados peer-reviewed (PSS-4 Cohen 1983,
-- SWEMWBS-7 Stewart-Brown 2009, PHQ-2 Kroenke 2003). Repeatable: el
-- mismo instrumento se administra periódicamente y cada toma genera
-- una row aquí. El baseline one-time del onboarding vive en User.neuralState.
CREATE TABLE IF NOT EXISTS "Instrument" (
  "id"            TEXT          PRIMARY KEY,
  "userId"        TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"         TEXT          REFERENCES "Org"("id") ON DELETE SET NULL,
  "instrumentId"  TEXT          NOT NULL,                                  -- "pss-4" | "swemwbs-7" | "phq-2"
  "score"         INTEGER       NOT NULL,
  "level"         TEXT          NOT NULL,                                  -- "low" | "moderate" | "high" | "positive" | "negative"
  "answers"       JSONB         NOT NULL,
  "takenAt"       TIMESTAMP(3)  NOT NULL,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Instrument_userId_takenAt_idx"
  ON "Instrument"("userId", "takenAt" DESC);
CREATE INDEX IF NOT EXISTS "Instrument_orgId_takenAt_idx"
  ON "Instrument"("orgId", "takenAt" DESC);
CREATE INDEX IF NOT EXISTS "Instrument_instrumentId_idx"
  ON "Instrument"("instrumentId");
