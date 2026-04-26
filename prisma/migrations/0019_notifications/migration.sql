-- Sprint 25 — Notifications proper model.
-- Reemplaza el hack de audit-log-with-notify.* prefix con un modelo
-- per-user con read/unread state. Audit log se mantiene para compliance
-- trail; este modelo es para UI.

CREATE TYPE "NotificationLevel" AS ENUM ('info', 'warn', 'error', 'success');

CREATE TABLE "Notification" (
  "id"         TEXT                 PRIMARY KEY,
  "userId"     TEXT                 NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "orgId"      TEXT                 REFERENCES "Org"("id") ON DELETE SET NULL,
  "kind"       TEXT                 NOT NULL,
  "level"      "NotificationLevel"  NOT NULL DEFAULT 'info',
  "title"      TEXT                 NOT NULL,
  "body"       TEXT,
  "href"       TEXT,
  "readAt"     TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Hot path: GET /me/notifications?unreadOnly=1 → query userId + readAt is null
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
CREATE INDEX "Notification_orgId_idx" ON "Notification"("orgId");
