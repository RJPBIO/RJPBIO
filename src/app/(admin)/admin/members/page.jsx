export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import MembersClient from "./MembersClient";

export const metadata = { title: "Miembros · Admin" };

export default async function MembersPage() {
  const session = await auth();
  // Prefiere B2B Org (no personal) cuando ambos existen — admin/members
  // tiene sentido solo para B2B; personal-org no tiene team management.
  const memberships = session?.memberships || [];
  const b2bMembership = memberships.find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  ) || memberships.find((m) => ["OWNER", "ADMIN"].includes(m.role));
  const orgId = b2bMembership?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const orgMemberships = await orm.membership.findMany({ where: { orgId } });
  const rows = await Promise.all(orgMemberships.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return {
      id: m.id, userId: m.userId, role: m.role, createdAt: m.createdAt,
      scimId: m.scimId,
      email: u?.email || "", name: u?.name || "",
    };
  }));
  // Pending invitations — para el panel de admin con acciones revoke/resend.
  // Solo las que NO han sido aceptadas aún (acceptedAt: null).
  const pendingInvites = await orm.invitation.findMany({
    where: { orgId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, token: true, createdAt: true, expiresAt: true },
  });
  return <MembersClient initialRows={rows} pendingInvites={pendingInvites} orgId={orgId} />;
}
