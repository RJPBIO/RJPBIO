/* Regenerate backup codes — returns 10 fresh plaintext codes one time,
   invalidating whatever codes the user had. Requires the user to have
   MFA enabled and to have verified recently (mfaVerifiedAt within 10m). */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { generateBackupCodes, hashBackupCode } from "@/server/mfa";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FRESH_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id: session.user.id } });
  if (!user?.mfaEnabled) return new Response("MFA no activado", { status: 409 });

  const verifiedAt = user.mfaVerifiedAt?.getTime() || 0;
  if (Date.now() - verifiedAt > FRESH_WINDOW_MS) {
    return new Response(JSON.stringify({ error: "stale", needsStepUp: true }), {
      status: 401, headers: { "content-type": "application/json" },
    });
  }

  const codes = generateBackupCodes(10);
  const hashed = codes.map(hashBackupCode);

  await orm.user.update({
    where: { id: user.id },
    data: { mfaBackupCodes: hashed },
  });

  await auditLog({ action: "auth.mfa.backup.regen", actorId: user.id }).catch(() => {});
  return Response.json({ backupCodes: codes });
}
