/* DELETE /api/auth/mfa/trusted-devices/[id] — revoke a specific trusted
   device. Users can only revoke their own; the FK on userId enforces this. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  const orm = await db();
  const row = await orm.trustedDevice.findUnique({ where: { id } });
  if (!row || row.userId !== session.user.id) {
    return new Response("not found", { status: 404 });
  }

  await orm.trustedDevice.delete({ where: { id } });
  await auditLog({ action: "auth.mfa.device.revoke", actorId: session.user.id, meta: { id } }).catch(() => {});

  return Response.json({ ok: true });
}
