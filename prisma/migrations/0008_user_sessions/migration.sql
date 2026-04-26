-- Sprint 8 — UserSession (DB-backed active sessions for JWT-strategy auth)
--
-- NextAuth está en strategy="jwt" — no hay rows de Session por diseño.
-- Para mostrar "sesiones activas" + remote-revoke necesitamos tracking
-- propio. JWT callback crea row al signin con jti, ip, ua. Lazy validation
-- (admin layout / API wrappers) chequea revokedAt → fuerza signout si
-- la sesión actual fue revocada.
--
-- User.sessionEpoch — counter para "logout all devices" estilo Google:
-- bump epoch → todos los JWT existentes con epoch viejo se rechazan
-- en el siguiente refresh. Más barato que mass-revoke por jti.

CREATE TABLE "UserSession" (
  "id"         TEXT          PRIMARY KEY,
  "userId"     TEXT          NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "jti"        TEXT          NOT NULL UNIQUE,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "label"      TEXT,
  "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3)  NOT NULL,
  "revokedAt"  TIMESTAMP(3)
);

CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_userId_revokedAt_expiresAt_idx" ON "UserSession"("userId", "revokedAt", "expiresAt");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

ALTER TABLE "User" ADD COLUMN "sessionEpoch" INTEGER NOT NULL DEFAULT 0;
