/* GET /api/v1/orgs/[orgId]/compliance/export?format=markdown|json
   Download del evidence pack (text/markdown o application/json).
   Auth: OWNER o ADMIN. Audit-loga el export para evidencia recursiva. */

import { auth } from "../../../../../../../server/auth";
import { getCompliancePackForOrg } from "../../../../../../../server/compliance";
import { formatPackAsMarkdown, formatPackAsJson } from "../../../../../../../lib/compliance";
import { auditLog } from "../../../../../../../server/audit";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { orgId } = await params;
  const m = session.memberships?.find((mm) => mm.orgId === orgId);
  if (!m || !["OWNER", "ADMIN"].includes(m.role)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "json" ? "json" : "markdown";

  const pack = await getCompliancePackForOrg(orgId, { actorUserId: session.user.id });
  if (!pack) return Response.json({ error: "not_found" }, { status: 404 });

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.compliance.exported",
    payload: { format, coverage: pack.summary.coverage },
  }).catch(() => {});

  const date = new Date().toISOString().slice(0, 10);
  const safeOrg = String(pack.org?.id || "org").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 24);

  if (format === "json") {
    return new Response(formatPackAsJson(pack), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-${safeOrg}-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new Response(formatPackAsMarkdown(pack, "es"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="compliance-${safeOrg}-${date}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
