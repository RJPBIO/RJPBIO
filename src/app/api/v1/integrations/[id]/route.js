import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function requireAdmin(session, orgId) {
  return (session.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.orgId === orgId
  );
}

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const ct = request.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());

  const method = String(data._method || "").toUpperCase();
  const orm = await db();
  const inst = await orm.integration.findUnique({ where: { id } });
  if (!inst) return new Response("no encontrada", { status: 404 });
  if (!(await requireAdmin(session, inst.orgId))) return new Response("forbidden", { status: 403 });

  if (method === "DELETE") {
    await orm.integration.delete({ where: { id } });
    await auditLog({
      orgId: inst.orgId, actorId: session.user.id,
      action: "integration.uninstall", payload: { provider: inst.provider },
    }).catch(() => {});
    revalidatePath("/admin/integrations");
    if (!ct.includes("application/json")) {
      return Response.redirect(new URL("/admin/integrations", request.url), 303);
    }
    return Response.json({ ok: true });
  }

  const target =
    method === "PAUSE" ? false :
    method === "RESUME" ? true :
    !inst.enabled;

  await orm.integration.update({ where: { id }, data: { enabled: target } });
  await auditLog({
    orgId: inst.orgId, actorId: session.user.id,
    action: target ? "integration.resume" : "integration.pause",
    payload: { provider: inst.provider },
  }).catch(() => {});
  revalidatePath("/admin/integrations");

  if (!ct.includes("application/json")) {
    return Response.redirect(new URL("/admin/integrations", request.url), 303);
  }
  return Response.json({ id, enabled: target });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orm = await db();
  const inst = await orm.integration.findUnique({ where: { id } });
  if (!inst) return new Response("no encontrada", { status: 404 });
  if (!(await requireAdmin(session, inst.orgId))) return new Response("forbidden", { status: 403 });

  const patch = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (body.config && typeof body.config === "object") patch.config = body.config;
  if (!Object.keys(patch).length) return new Response("nada que actualizar", { status: 400 });

  const updated = await orm.integration.update({ where: { id }, data: patch });
  await auditLog({
    orgId: inst.orgId, actorId: session.user.id,
    action: "integration.update", payload: { provider: inst.provider, keys: Object.keys(patch) },
  }).catch(() => {});
  revalidatePath("/admin/integrations");
  return Response.json({ id: updated.id, enabled: updated.enabled });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const orm = await db();
  const inst = await orm.integration.findUnique({ where: { id } });
  if (!inst) return new Response("no encontrada", { status: 404 });
  if (!(await requireAdmin(session, inst.orgId))) return new Response("forbidden", { status: 403 });

  await orm.integration.delete({ where: { id } });
  await auditLog({
    orgId: inst.orgId, actorId: session.user.id,
    action: "integration.uninstall", payload: { provider: inst.provider },
  }).catch(() => {});
  revalidatePath("/admin/integrations");
  return Response.json({ ok: true });
}
