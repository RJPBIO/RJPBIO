/* GET /api/notifications/recent?since=ms — Sprint 25: lee de Notification
   model (per-user) en vez de audit-log-prefix. Compatible con shape antiguo
   para no romper NotificationsBell durante migración.
   Auth: cualquier sesión válida. */

import { auth } from "@/server/auth";
import { listForUser, countUnread } from "@/server/notifications";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  const since = sinceRaw ? new Date(Number(sinceRaw)) : null;

  const [rows, unread] = await Promise.all([
    listForUser(session.user.id, { limit: 50, since }),
    countUnread(session.user.id),
  ]);

  return Response.json({
    items: rows.map((r) => ({
      id: r.id,
      at: r.createdAt instanceof Date ? r.createdAt.getTime() : new Date(r.createdAt).getTime(),
      kind: r.kind,
      title: r.title,
      body: r.body || "",
      level: r.level,
      href: r.href || null,
      readAt: r.readAt
        ? (r.readAt instanceof Date ? r.readAt.getTime() : new Date(r.readAt).getTime())
        : null,
    })),
    unreadCount: unread,
  });
}
