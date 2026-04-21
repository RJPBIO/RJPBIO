/* MFA enrollment — two-step flow.
   GET:  returns the otpauth URL + fresh backup codes (one-time plaintext).
         Persists the *pending* secret (encrypted) + hashed backup codes
         but leaves mfaEnabled = false until a code is confirmed.
   POST: confirms a TOTP code against the pending secret; flips mfaEnabled.
*/

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  generateSecret,
  otpauthURL,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
} from "@/server/mfa";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { encryptIfPlaintext, decryptIfEncrypted } from "@/server/kms";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new Response("not found", { status: 404 });
  if (user.mfaEnabled) return new Response("already enabled", { status: 409 });

  const secret = generateSecret();
  const codes = generateBackupCodes(10);
  const hashed = codes.map(hashBackupCode);

  await orm.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: encryptIfPlaintext(secret),
      mfaBackupCodes: hashed,
      mfaEnabled: false,
      mfaFailCount: 0,
      mfaLockedUntil: null,
    },
  });

  await auditLog({ action: "auth.mfa.setup.begin", actorId: user.id }).catch(() => {});

  const url = otpauthURL(secret, user.email);
  const qrDataURL = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 6,
    color: { dark: "#0B0F14", light: "#FFFFFFFF" },
  });

  return Response.json({
    otpauthURL: url,
    qrDataURL,       // data:image/png;base64,... — rendered directly by client
    secret,          // shown alongside QR for manual entry
    backupCodes: codes, // ONE-TIME plaintext — UI must tell user to save now
  });
}

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  let code;
  try {
    const body = await request.json();
    code = String(body?.code || "").trim();
  } catch { return new Response("bad request", { status: 400 }); }
  if (!/^\d{6}$/.test(code)) return new Response("código inválido", { status: 400 });

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id: session.user.id } });
  if (!user?.mfaSecret) return new Response("run GET first", { status: 409 });

  const secret = decryptIfEncrypted(user.mfaSecret);
  const ok = await verifyTOTP(secret, code);
  if (!ok) {
    await auditLog({ action: "auth.mfa.setup.fail", actorId: user.id }).catch(() => {});
    return new Response(JSON.stringify({ error: "invalid" }), {
      status: 401, headers: { "content-type": "application/json" },
    });
  }

  await orm.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true, mfaVerifiedAt: new Date() },
  });
  await auditLog({ action: "auth.mfa.setup.ok", actorId: user.id }).catch(() => {});

  return Response.json({ ok: true });
}
