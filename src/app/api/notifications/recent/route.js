import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { NOTIFY_PREFIX } from "@/server/notifications";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const adminOrgs = (session.memberships || [])
    .filter((m) => ["OWNER", "ADMIN"].includes(m.role))
    .map((m) => m.orgId);
  if (!adminOrgs.length) return Response.json({ items: [] });

  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  const since = sinceRaw ? new Date(Number(sinceRaw)) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orm = await db();
  const rows = await orm.auditLog.findMany({
    where: {
      orgId: { in: adminOrgs },
      action: { startsWith: NOTIFY_PREFIX },
      ts: { gte: since },
    },
    orderBy: { ts: "desc" },
    take: 20,
  });

  return Response.json({
    items: rows.map((r) => ({
      id: String(r.id),
      at: r.ts.getTime(),
      title: r.payload?.title || "Aviso",
      body: r.payload?.body || "",
      level: r.payload?.level || "info",
      href: r.payload?.href || null,
    })),
  });
}
