import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const VALID_PROVIDERS = ["slack", "teams", "okta", "workday"];

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const admin = (session.memberships || []).find((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!admin) return new Response("forbidden", { status: 403 });

  const orm = await db();
  const list = await orm.integration.findMany({ where: { orgId: admin.orgId } });
  return Response.json({
    integrations: list.map((i) => ({
      id: i.id, provider: i.provider, enabled: i.enabled, createdAt: i.createdAt,
    })),
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const ct = request.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await request.json().catch(() => ({}))
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());

  const provider = String(data.provider || "").toLowerCase();
  if (!VALID_PROVIDERS.includes(provider)) return new Response("proveedor inválido", { status: 400 });

  const admin = (session.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && (!data.orgId || m.orgId === data.orgId)
  );
  if (!admin) return new Response("forbidden", { status: 403 });

  const orm = await db();
  const existing = await orm.integration.findUnique({
    where: { orgId_provider: { orgId: admin.orgId, provider } },
  }).catch(() => null);

  if (existing) {
    await auditLog({
      orgId: admin.orgId, actorId: session.user.id,
      action: "integration.exists", payload: { provider },
    }).catch(() => {});
    revalidatePath("/admin/integrations");
    if (!ct.includes("application/json")) {
      return Response.redirect(new URL("/admin/integrations", request.url), 303);
    }
    return Response.json({ id: existing.id, provider, enabled: existing.enabled });
  }

  const config = typeof data.config === "object" && data.config !== null ? data.config : {};
  const inst = await orm.integration.create({
    data: { orgId: admin.orgId, provider, config, enabled: true },
  });
  await auditLog({
    orgId: admin.orgId, actorId: session.user.id,
    action: "integration.install", payload: { provider },
  }).catch(() => {});
  revalidatePath("/admin/integrations");

  if (!ct.includes("application/json")) {
    return Response.redirect(new URL("/admin/integrations", request.url), 303);
  }
  return Response.json({ id: inst.id, provider, enabled: true });
}
