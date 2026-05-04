-- Phase 6F SP-A — ProgramAssignment table.
-- Mirror server-side del activeProgram que vive en Zustand. Habilita
-- adherence agregada B2B (Idea 3 + Idea 1 reportes) y nightly cron
-- program-day-reminder. Aditiva, idempotente. NO breaking.

CREATE TABLE IF NOT EXISTS "ProgramAssignment" (
  "id"                 TEXT          PRIMARY KEY,
  "userId"             TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"              TEXT          REFERENCES "Org"("id") ON DELETE SET NULL,

  "programId"          TEXT          NOT NULL,                     -- "neural-baseline" | "recovery-week" | "focus-sprint" | "burnout-recovery" | "executive-presence"
  "startedAt"          TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"        TIMESTAMP(3),
  "abandonedAt"        TIMESTAMP(3),

  -- Días completados (1-based, sparse). Json array de integers.
  "completedDays"      JSONB         NOT NULL DEFAULT '[]'::jsonb,

  -- Re-evaluación mid-program (solo Burnout Recovery 28d → día 14 PSS-4).
  "reEvalAt"           TIMESTAMP(3),
  "reEvalCompletedAt"  TIMESTAMP(3),

  -- Origen del programa para analytics + audit.
  "source"             TEXT          NOT NULL DEFAULT 'self-selected',

  -- Snapshot opcional del contexto al inicio para pre/post comparativas.
  "meta"               JSONB
);

CREATE INDEX IF NOT EXISTS "ProgramAssignment_userId_startedAt_idx"
  ON "ProgramAssignment"("userId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "ProgramAssignment_orgId_programId_startedAt_idx"
  ON "ProgramAssignment"("orgId", "programId", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "ProgramAssignment_userId_completedAt_idx"
  ON "ProgramAssignment"("userId", "completedAt" DESC);
