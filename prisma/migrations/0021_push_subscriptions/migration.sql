-- Sprint 91 — Web Push subscriptions persistidas.
-- Antes /api/push/resubscribe era no-op y subscribePush() del client
-- no posteaba a server → feature de push era teatro (UI con toggle
-- pero server nunca tenía endpoints registrados).
-- Esta tabla permite persistir endpoint+keys para que server-side
-- web-push pueda dispatchar pushes.

CREATE TABLE "PushSubscription" (
  "id"          TEXT          PRIMARY KEY,
  "userId"      TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "endpoint"    TEXT          NOT NULL UNIQUE,
  "p256dh"      TEXT          NOT NULL,
  "authKey"     TEXT          NOT NULL,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Hot path: dispatch push to specific user → query userId
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
