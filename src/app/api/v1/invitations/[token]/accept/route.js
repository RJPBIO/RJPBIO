import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { writeAudit } from "../../../../../../server/audit";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) return Response.redirect(new URL(`/signin?next=/accept-invite/${token}`, process.env.AUTH_URL || "http://localhost:3000"));
  const client = db();
  const inv = await client.invitation.findUnique({ where: { token } });
  if (!inv || inv.acceptedAt || new Date(inv.expiresAt) < new Date()) return new Response("invalid invite", { status: 410 });
  await client.membership.upsert({
    where: { userId_orgId: { userId: session.user.id, orgId: inv.orgId } },
    update: { role: inv.role },
    create: { id: randomUUID(), userId: session.user.id, orgId: inv.orgId, role: inv.role },
  });
  await client.invitation.update({ where: { token }, data: { acceptedAt: new Date() } });
  await writeAudit({ orgId: inv.orgId, actorId: session.user.id, action: "member.joined" });
  return Response.redirect(new URL("/", process.env.AUTH_URL || "http://localhost:3000"));
}
