-- Phone auth (SMS-OTP): alternate identity for passwordless sign-in.
-- Safe to roll forward: phone is nullable, unique-index allows many NULL.

ALTER TABLE "User"
  ADD COLUMN "phone"         TEXT,
  ADD COLUMN "phoneVerified" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- Ephemeral OTP store. One active row per phone; rotated on resend.
CREATE TABLE "PhoneOtp" (
  "id"        TEXT NOT NULL,
  "phone"     TEXT NOT NULL,
  "codeHash"  TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts"  INTEGER NOT NULL DEFAULT 0,
  "ip"        TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PhoneOtp_phone_key" ON "PhoneOtp"("phone");
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");
