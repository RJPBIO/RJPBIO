/* GET /api/v1/orgs/[orgId]/audit/count?from=ISO&to=ISO
   Devuelve count de logs del org en el rango. Lightweight (no devuelve
   rows) — útil para preview "X logs serán exportados" antes de descargar.
   Auth: OWNER o ADMIN. */

import { auth } from "../../../../../../../server/auth";
import { db } from "../../../../../../../server/db";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : null;
  const to = toStr ? new Date(toStr) : null;
  if (from && Number.isNaN(from.getTime())) {
    return Response.json({ error: "invalid_from" }, { status: 400 });
  }
  if (to && Number.isNaN(to.getTime())) {
    return Response.json({ error: "invalid_to" }, { status: 400 });
  }

  const where = { orgId };
  if (from || to) {
    where.ts = {};
    if (from) where.ts.gte = from;
    if (to) where.ts.lte = to;
  }

  try {
    const orm = await db();
    const count = await orm.auditLog.count({ where });
    return Response.json({ count, from: fromStr || null, to: toStr || null });
  } catch {
    return Response.json({ error: "count_failed" }, { status: 500 });
  }
}
