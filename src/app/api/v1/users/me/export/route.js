import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";

export const dynamic = "force-dynamic";

/** GDPR Art. 15 / LFPDPPP Art. 22 — right of access. Returns a signed JSON bundle. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const client = db();
  const [user, memberships, sessions] = await Promise.all([
    client.user.findUnique({ where: { id: userId } }),
    client.membership.findMany({ where: { userId } }),
    client.neuralSession.findMany({ where: { userId } }),
  ]);
  const bundle = {
    subject: { id: user?.id, email: user?.email, name: user?.name, locale: user?.locale },
    memberships, sessions,
    exportedAt: new Date().toISOString(),
    disclaimer: "Generated per GDPR Art. 15 / LFPDPPP Art. 22. Valid 30 days.",
  };
  for (const m of memberships) {
    await auditLog({ orgId: m.orgId, actorId: userId, action: "user.data.exported", target: userId });
  }
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="bio-ignicion-export-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
