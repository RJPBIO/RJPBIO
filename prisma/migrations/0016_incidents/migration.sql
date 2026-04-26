-- Sprint 19 — Incident management para /status público + RSS feed.
-- Status.io / Atlassian-style: status enum, severity, components.
-- Updates separados (history) en IncidentUpdate.

CREATE TYPE "IncidentStatus" AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');
CREATE TYPE "IncidentSeverity" AS ENUM ('minor', 'major', 'critical');

CREATE TABLE "Incident" (
  "id"          TEXT                PRIMARY KEY,
  "title"       TEXT                NOT NULL,
  "body"        TEXT,
  "status"      "IncidentStatus"    NOT NULL DEFAULT 'investigating',
  "severity"    "IncidentSeverity"  NOT NULL,
  "components"  TEXT[]              NOT NULL DEFAULT ARRAY[]::TEXT[],
  "creatorId"   TEXT,
  "startedAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "IncidentUpdate" (
  "id"          TEXT                PRIMARY KEY,
  "incidentId"  TEXT                NOT NULL REFERENCES "Incident"("id") ON DELETE CASCADE,
  "status"      "IncidentStatus"    NOT NULL,
  "body"        TEXT                NOT NULL,
  "authorId"    TEXT,
  "createdAt"   TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Incident_status_severity_idx" ON "Incident"("status", "severity");
CREATE INDEX "Incident_resolvedAt_idx" ON "Incident"("resolvedAt");
CREATE INDEX "Incident_startedAt_idx" ON "Incident"("startedAt");
CREATE INDEX "IncidentUpdate_incidentId_idx" ON "IncidentUpdate"("incidentId");
