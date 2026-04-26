/* GET /api/v1/health/metrics — observability dashboard.
   Auth: PLATFORM_ADMIN_EMAILS (mismo gate que incidents/maintenance). */

import { auth } from "@/server/auth";
import { gatherHealthSnapshot, isPlatformAdmin } from "@/server/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isPlatformAdmin(session.user.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const snap = await gatherHealthSnapshot();
  return Response.json(snap, { headers: { "cache-control": "no-store" } });
}
