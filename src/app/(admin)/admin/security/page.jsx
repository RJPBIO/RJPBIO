export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import SecurityResetsClient from "./SecurityResetsClient";

export const metadata = { title: "Reset de MFA · Admin" };

export default async function SecurityPage() {
  const session = await auth();
  const adminOrgIds = (session?.memberships || [])
    .filter((m) => ["OWNER", "ADMIN"].includes(m.role))
    .map((m) => m.orgId);
  if (!adminOrgIds.length) return null;

  const orm = await db();

  const memberships = await orm.membership.findMany({
    where: { orgId: { in: adminOrgIds } },
    select: { userId: true, orgId: true },
  });
  const targetUserIds = Array.from(new Set(memberships.map((m) => m.userId)));
  if (!targetUserIds.length) return <SecurityResetsClient pending={[]} resolved={[]} />;

  const requests = await orm.mfaResetRequest.findMany({
    where: { userId: { in: targetUserIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const userIds = Array.from(new Set(requests.map((r) => r.userId)));
  const users = await orm.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true, mfaEnabled: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const resolverIds = Array.from(new Set(requests.map((r) => r.resolverId).filter(Boolean)));
  const resolvers = resolverIds.length
    ? await orm.user.findMany({ where: { id: { in: resolverIds } }, select: { id: true, email: true, name: true } })
    : [];
  const resolverMap = new Map(resolvers.map((u) => [u.id, u]));

  const rows = requests.map((r) => {
    const u = userMap.get(r.userId);
    const resolver = r.resolverId ? resolverMap.get(r.resolverId) : null;
    return {
      id: r.id,
      userId: r.userId,
      email: r.email,
      userName: u?.name || null,
      userEmail: u?.email || r.email,
      mfaEnabled: !!u?.mfaEnabled,
      reason: r.reason || null,
      ip: r.ip || null,
      userAgent: r.userAgent || null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      resolverEmail: resolver?.email || null,
      resolverName: resolver?.name || null,
    };
  });

  const pending = rows.filter((r) => r.status === "pending");
  const resolved = rows.filter((r) => r.status !== "pending").slice(0, 50);

  return <SecurityResetsClient pending={pending} resolved={resolved} />;
}
