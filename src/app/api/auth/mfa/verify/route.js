/* MFA verification — accepts either a 6-digit TOTP code or a backup code.
   On success: resets failure counter, stamps mfaVerifiedAt, rotates any
   stale sessions, and (if rememberDevice) issues a 30-day trusted-device
   cookie whose sha256 hash we persist in TrustedDevice.
   On failure: increments mfaFailCount, locks the account after 5
   consecutive fails for 15 minutes, returns remaining attempts. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  verifyTOTP,
  verifyBackupCode,
  newTrustedDeviceToken,
  hashDeviceToken,
} from "@/server/mfa";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { decryptIfEncrypted } from "@/server/kms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const TRUST_DAYS = 30;
const TRUST_COOKIE = "bi_mfa_trust";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  let payload;
  try { payload = await request.json(); }
  catch { return new Response("bad request", { status: 400 }); }

  const totp = typeof payload?.code === "string" ? payload.code.trim() : "";
  const backup = typeof payload?.backupCode === "string" ? payload.backupCode.trim() : "";
  const rememberDevice = !!payload?.rememberDevice;

  if (!totp && !backup) return new Response("missing code", { status: 400 });
  if (totp && !/^\d{6}$/.test(totp)) return new Response("código inválido", { status: 400 });

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id: session.user.id } });
  if (!user?.mfaSecret) return new Response("MFA no configurado", { status: 409 });

  // Lockout gate — if still locked, reject early regardless of code validity.
  if (user.mfaLockedUntil && user.mfaLockedUntil.getTime() > Date.now()) {
    const retryAfter = Math.ceil((user.mfaLockedUntil.getTime() - Date.now()) / 1000);
    await auditLog({ action: "auth.mfa.locked", actorId: user.id }).catch(() => {});
    return new Response(
      JSON.stringify({ error: "locked", retryAfter }),
      { status: 429, headers: { "content-type": "application/json", "retry-after": String(retryAfter) } },
    );
  }

  let ok = false;
  let remainingBackupHashes = user.mfaBackupCodes;
  let usedBackup = false;

  if (backup) {
    const r = verifyBackupCode(backup, user.mfaBackupCodes || []);
    ok = r.ok;
    remainingBackupHashes = r.remaining;
    usedBackup = r.ok;
  } else {
    const secret = decryptIfEncrypted(user.mfaSecret);
    ok = await verifyTOTP(secret, totp);
  }

  if (!ok) {
    const fails = (user.mfaFailCount || 0) + 1;
    const lock = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS) : null;
    await orm.user.update({
      where: { id: user.id },
      data: { mfaFailCount: fails, mfaLockedUntil: lock },
    }).catch(() => {});
    await auditLog({ action: "auth.mfa.fail", actorId: user.id, meta: { backup: !!backup, fails } }).catch(() => {});
    const remaining = Math.max(0, MAX_FAILS - fails);
    const status = lock ? 429 : 401;
    return new Response(
      JSON.stringify({ error: "invalid", remaining, locked: !!lock }),
      { status, headers: { "content-type": "application/json" } },
    );
  }

  // Success — reset counters, stamp verified-at, consume backup if used.
  const update = {
    mfaFailCount: 0,
    mfaLockedUntil: null,
    mfaVerifiedAt: new Date(),
    mfaEnabled: true,
  };
  if (usedBackup) update.mfaBackupCodes = remainingBackupHashes;

  await orm.user.update({ where: { id: user.id }, data: update }).catch(() => {});

  // Rotate other sessions to close any post-MFA hijack window.
  await orm.session.deleteMany({
    where: { userId: user.id, NOT: { sessionToken: session.sessionToken || undefined } },
  }).catch(() => {});

  await auditLog({ action: "auth.mfa.ok", actorId: user.id, meta: { backup: usedBackup } }).catch(() => {});

  // Trusted device — mint cookie + persist hash.
  let trustCookie = null;
  if (rememberDevice) {
    const token = newTrustedDeviceToken();
    const tokenHash = hashDeviceToken(token);
    const expiresAt = new Date(Date.now() + TRUST_DAYS * 24 * 60 * 60 * 1000);
    const ua = request.headers.get("user-agent") || "";
    const label = deriveDeviceLabel(ua);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await orm.trustedDevice.create({
      data: { userId: user.id, tokenHash, label, ip, expiresAt },
    }).catch(() => {});
    trustCookie = token;
  }

  const body = {
    ok: true,
    backupCodesRemaining: usedBackup ? remainingBackupHashes.length : undefined,
  };
  const res = new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

  if (trustCookie) {
    const parts = [
      `${TRUST_COOKIE}=${trustCookie}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      process.env.NODE_ENV === "production" ? "Secure" : "",
      `Max-Age=${TRUST_DAYS * 24 * 60 * 60}`,
    ].filter(Boolean);
    res.headers.append("set-cookie", parts.join("; "));
  }

  return res;
}

function deriveDeviceLabel(ua) {
  if (!ua) return null;
  const os = /Mac OS X/.test(ua) ? "macOS"
    : /Windows NT/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari" : "browser";
  return `${browser} · ${os}`;
}
