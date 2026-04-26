/* GET /api/v1/orgs/[orgId]/audit/export?format=csv|jsonl&from=ISO&to=ISO
   Auth: OWNER o ADMIN (audit es security-critical).
   Streams la respuesta como text/csv o application/jsonl. Audit logs el
   evento de export (action: org.audit.exported) para meta-trazabilidad. */

import { auth } from "../../../../../../../server/auth";
import {
  auditLog,
  readAuditLogsForExport,
} from "../../../../../../../server/audit";
import {
  rowsToCsv,
  rowsToJsonl,
  formatExportFilename,
} from "../../../../../../../lib/audit-retention";

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
  const fmt = url.searchParams.get("format") === "jsonl" ? "jsonl" : "csv";
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : null;
  const to = toStr ? new Date(toStr) : null;
  if (from && Number.isNaN(from.getTime())) {
    return Response.json({ error: "invalid_from" }, { status: 400 });
  }
  if (to && Number.isNaN(to.getTime())) {
    return Response.json({ error: "invalid_to" }, { status: 400 });
  }

  const rows = await readAuditLogsForExport({ orgId, from, to });
  const filename = formatExportFilename({ orgId, format: fmt, from, to });
  const body = fmt === "jsonl" ? rowsToJsonl(rows) : rowsToCsv(rows);
  const contentType = fmt === "jsonl"
    ? "application/x-ndjson; charset=utf-8"
    : "text/csv; charset=utf-8";

  await auditLog({
    orgId,
    actorId: session.user.id,
    action: "org.audit.exported",
    payload: { format: fmt, rows: rows.length, from: fromStr, to: toStr },
  }).catch(() => {});

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
