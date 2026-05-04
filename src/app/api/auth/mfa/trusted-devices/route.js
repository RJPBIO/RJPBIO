/* GET /api/auth/mfa/trusted-devices — lista trusted devices del user
   actual. Phase 6D SP4b. Para SecurityView + RemoveTrustedDeviceModal.

   Auth: cualquier sesión válida. Solo devuelve los del user actual
   (FK userId enforce). El tokenHash NO se devuelve (sensible).
   Devuelve solo metadata visible al user para identificar dispositivos. */

import "server-only";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const orm = await db();
  const rows = await orm.trustedDevice.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      label: true,
      ip: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
    },
    orderBy: { lastUsedAt: "desc" },
  });
  // Filter out expired entries (defensive — prisma aún no los limpia
  // automáticamente en este endpoint).
  const now = Date.now();
  const active = rows.filter((r) => r.expiresAt.getTime() > now);
  return Response.json({
    devices: active.map((d) => ({
      id: d.id,
      label: d.label || "Dispositivo sin nombre",
      ip: d.ip,
      createdAt: d.createdAt.toISOString(),
      expiresAt: d.expiresAt.toISOString(),
      lastUsedAt: d.lastUsedAt.toISOString(),
    })),
    count: active.length,
  });
}
