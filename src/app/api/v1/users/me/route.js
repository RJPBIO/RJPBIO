import { auth } from "../../../../../server/auth";
import { db } from "../../../../../server/db";
import { auditLog } from "../../../../../server/audit";
import { requireCsrf } from "../../../../../server/csrf";
import { LOCALES } from "../../../../../lib/i18n";

export const dynamic = "force-dynamic";

const SUPPORTED_LOCALES = Object.keys(LOCALES);

/** Actualiza preferencias del usuario autenticado. Por ahora: `locale`. */
export async function PATCH(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  let body;
  try { body = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  const patch = {};
  if (typeof body?.locale === "string" && SUPPORTED_LOCALES.includes(body.locale)) {
    patch.locale = body.locale;
  }
  if (typeof body?.timezone === "string" && body.timezone.length <= 64) {
    patch.timezone = body.timezone;
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "no supported fields" }, { status: 400 });
  }

  const client = await db();
  const updated = await client.user.update({ where: { id: session.user.id }, data: patch });
  return Response.json({ id: updated.id, locale: updated.locale, timezone: updated.timezone });
}

/** GDPR Art. 17 — right to erasure. Soft-deletes now; hard-delete after 30d grace. */
export async function DELETE(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const client = await db();
  await client.user.update({ where: { id: userId }, data: { deletedAt: new Date(), email: `deleted-${userId}@bio-ignicion.local`, name: null, image: null } });
  const memberships = await client.membership.findMany({ where: { userId } });
  for (const m of memberships) {
    await auditLog({ orgId: m.orgId, actorId: userId, action: "user.deletion.requested", target: userId, payload: { graceDays: 30 } });
  }
  return Response.json({ status: "scheduled", hardDeleteAt: new Date(Date.now() + 30 * 86400_000).toISOString() });
}
