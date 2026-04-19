export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import MembersClient from "./MembersClient";

export const metadata = { title: "Miembros · Admin" };

export default async function MembersPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const memberships = await orm.membership.findMany({ where: { orgId } });
  const rows = await Promise.all(memberships.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return {
      id: m.id, userId: m.userId, role: m.role, createdAt: m.createdAt,
      scimId: m.scimId,
      email: u?.email || "", name: u?.name || "",
    };
  }));
  return <MembersClient initialRows={rows} orgId={orgId} />;
}
