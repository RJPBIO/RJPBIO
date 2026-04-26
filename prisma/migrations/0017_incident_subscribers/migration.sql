-- Sprint 20 — Status page subscribers (email + webhook + auto-notify).
-- Closes el loop de Sprint 19: customers ya no tienen que poll RSS;
-- ahora reciben push email/webhook cada vez que se crea/actualiza/resuelve
-- un incident. Component filter opcional.

CREATE TABLE "IncidentSubscriber" (
  "id"               TEXT          PRIMARY KEY,
  "email"            TEXT,
  "webhookUrl"       TEXT,
  "components"       TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
  "verified"         BOOLEAN       NOT NULL DEFAULT false,
  "verifyToken"      TEXT,
  "unsubscribeToken" TEXT          NOT NULL UNIQUE,
  "lastNotifiedAt"   TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email único (cuando no es null) — un email subscribe una vez.
CREATE UNIQUE INDEX "IncidentSubscriber_email_key" ON "IncidentSubscriber"("email") WHERE "email" IS NOT NULL;
CREATE INDEX "IncidentSubscriber_verified_idx" ON "IncidentSubscriber"("verified");
CREATE INDEX "IncidentSubscriber_verifyToken_idx" ON "IncidentSubscriber"("verifyToken");
