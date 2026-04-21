/* Disable MFA — requires a fresh step-up (mfaVerifiedAt within 10m).
   Clears secret + backup codes and flips mfaEnabled off. Trusted
   devices are revoked too so they can't be used to skip re-enrollment. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
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

  await orm.$transaction([
    orm.trustedDevice.deleteMany({ where: { userId: user.id } }),
    orm.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        mfaFailCount: 0,
        mfaLockedUntil: null,
        mfaVerifiedAt: null,
      },
    }),
  ]);

  await auditLog({ action: "auth.mfa.disable", actorId: user.id }).catch(() => {});
  return Response.json({ ok: true });
}
