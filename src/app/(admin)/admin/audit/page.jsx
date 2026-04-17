import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { verifyChain } from "@/server/audit";

export default async function AuditPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER","ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const rows = await orm.auditLog.findMany({ where: { orgId }, orderBy: { ts: "desc" }, take: 200 });
  const chain = await verifyChain(orgId);

  return (
    <>
      <h1>Auditoría</h1>
      <p style={{ fontSize: 13, color: chain.ok ? "#10B981" : "#EF4444" }}>
        Hash chain: {chain.ok ? `verificado · ${chain.entries} entradas` : `ROTO en ${chain.brokenAt}`}
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Target</th><th>IP</th><th>Hash</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)}>
              <td>{new Date(r.ts).toISOString()}</td>
              <td>{r.actorEmail || r.actorId || "—"}</td>
              <td><code>{r.action}</code></td>
              <td>{r.target || "—"}</td>
              <td>{r.ip || "—"}</td>
              <td title={r.hash}>{r.hash?.slice(0, 10)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
